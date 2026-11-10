// ---------- three setup ----------
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// Graphics (Jack: Low / High in Settings and the pause card, kept in 'mtd-gfx'): High renders at the screen's full sharpness (phones
// are 3×; adaptResolution steps it down if frames get slow), Low at most 1.5 pixels a point, with no shadows and a third of the weather
var gfxLow = false; try { gfxLow = localStorage.getItem('mtd-gfx') === 'low'; } catch (e) {}
const pixelMax = () => Math.min(devicePixelRatio, gfxLow ? 1.5 : 3);
var pixelK = pixelMax(), fpsAcc = 0, fpsN = 0;
renderer.setPixelRatio(pixelK);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// GPU memory: three keeps every shape (geometry) it has drawn until it is disposed, and raiders, buildings swapped on upgrade and whole
// maps were only taken out of the scene, so a long session kept growing (about 750 shapes a stage started, 300 for every 20 raiders).
// Every shape three uploads is noted here, and sweepGeo (at every new game, every dawn and on leaving the gallery) disposes the ones
// no longer in a scene; one that is shown again later is simply uploaded again
const liveGeo = new Set();
{ const on = THREE.BufferGeometry.prototype.addEventListener; THREE.BufferGeometry.prototype.addEventListener = function (type, fn) { if (type === 'dispose') liveGeo.add(this); return on.call(this, type, fn); }; }
function sweepGeo() {
  const used = new Set(), mark = o => { if (o.geometry) used.add(o.geometry); };
  scene.traverse(mark); if (gScene) gScene.traverse(mark);
  for (const g of liveGeo) if (!used.has(g)) { liveGeo.delete(g); g.dispose(); }
}
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene();
const SKY_DAY = new THREE.Color('#9db1b5'), SKY_NIGHT = new THREE.Color('#2a3b63'), SKY_DUSK = new THREE.Color('#c98a5a');
const SKY_R = 280, skyGeo = new THREE.SphereGeometry(SKY_R, 32, 14);
skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
sky.renderOrder = -1; scene.add(sky);
const skyHorizon = new THREE.Color(), skyZenith = new THREE.Color(), skyTmp = new THREE.Color(), ZENITH_TINT = new THREE.Color(.5, .64, .95);
function paintSky() {
  const pos = skyGeo.attributes.position, col = skyGeo.attributes.color;
  skyZenith.copy(skyHorizon).multiply(ZENITH_TINT);
  for (let n = 0; n < pos.count; n++) { const t = Math.max(0, pos.getY(n) / SKY_R); skyTmp.copy(skyHorizon).lerp(skyZenith, Math.sqrt(t)); col.setXYZ(n, skyTmp.r, skyTmp.g, skyTmp.b); }
  col.needsUpdate = true;
}
scene.fog = new THREE.Fog(SKY_DAY.clone(), 60, 150);
const camera = new THREE.PerspectiveCamera(45, 1, .5, 400);
const hemi = new THREE.HemisphereLight('#d6e6ff', '#4a3d28', .6); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe7c4', 1.05);
sun.position.set(SIZE / 2 - 36, 38, SIZE / 2 - 16); sun.target.position.set(SIZE / 2, 0, SIZE / 2);
sun.castShadow = !gfxLow; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -54, right: 54, top: 54, bottom: -54, near: 1, far: 170 });
sun.shadow.bias = -.0006;
scene.add(sun, sun.target);
const SUN_DAY = new THREE.Color('#ffe7c4'), SUN_NIGHT = new THREE.Color('#bccbf5'), SUN_DUSK = new THREE.Color('#ff9a55');
const HEMI_DAY = new THREE.Color('#d6e6ff'), HEMI_NIGHT = new THREE.Color('#7f90c4');

const tPos = new Float32Array(V_MAX * V_MAX * 3), tCol = new Float32Array(V_MAX * V_MAX * 3);
const tGeo = new THREE.BufferGeometry();
tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
tGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 3));
// lay the ground's vertex grid and triangles for the current map size (setMapSize calls it again when the size changes)
function terrainGrid() {
  for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) { const k = idx(i, j); tPos[k * 3] = i; tPos[k * 3 + 2] = j; }
  const tIdx = [];
  for (let j = 0; j < V - 1; j++) for (let i = 0; i < V - 1; i++) {
    const a = idx(i, j), b = idx(i + 1, j), c = idx(i, j + 1), d = idx(i + 1, j + 1);
    tIdx.push(a, c, b, b, c, d);
  }
  tGeo.setIndex(tIdx);
}
terrainGrid();
const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 });
terrainMat.onBeforeCompile = sh => {
  sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = `varying vec3 vWP;
    float gh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float gn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(gh(i), gh(i + vec2(1, 0)), f.x), mix(gh(i + vec2(0, 1)), gh(i + vec2(1, 1)), f.x), f.y); }
  ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    float gd = gn(vWP.xz * 2.3) * .55 + gn(vWP.xz * .45) * .45;
    diffuseColor.rgb *= .9 + .2 * gd;`);
};
const terrain = new THREE.Mesh(tGeo, terrainMat);
terrain.receiveShadow = true; scene.add(terrain);
const waterMat = new THREE.MeshStandardMaterial({ color: '#3e6e7a', transparent: true, opacity: .85, roughness: .7, metalness: 0 });   // rough enough that low-angle views don't glare white
const water = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE).rotateX(-Math.PI / 2).translate(SIZE / 2, 0, SIZE / 2), waterMat);
water.receiveShadow = true; scene.add(water);
// flowing water: two layers of soft noise drift with the current (down the Meadow's river, round the isle's ring) and
// lighten the surface in streaks; where the bed is shallow a band of broken foam laps at the bank. The bed's height comes
// from a small texture of the heightmap (hTex, refreshed by syncTerrain).
const hData = new Uint8Array(V_MAX * V_MAX * 4), hTex = new THREE.DataTexture(hData, V_MAX, V_MAX, THREE.RGBAFormat);   // always V_MAX wide   // the bed under the water
hTex.magFilter = hTex.minFilter = THREE.LinearFilter;
const waterU = { uIsle: { value: 0 }, uC: { value: new THREE.Vector2() }, uFoul: { value: 0 } };
function syncWaterTex() {
  for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) hData[(j * V_MAX + i) * 4] = clamp(Math.round((H[idx(i, j)] + 3) / 6 * 255), 0, 255);
  hTex.needsUpdate = true; waterU.uIsle.value = MAP === 'isle' ? 1 : MAP === 'bridge' || MAP === 'bend' || MAP === 'ford' || MAP === 'hold' ? 2 : 0; waterU.uC.value.set(KX, KZ);
  // Meadowmere's water is foul (Jack: show why fields do badly there): murky olive with a scum of algae, yellowish froth
  const foul = MAP === 'mere' || (bonusOn() && MAP === 'isle'); waterU.uFoul.value = foul ? 1 : 0; edgeWater.material.color.set(foul ? '#3f6560' : '#3d6e86');
}
waterMat.onBeforeCompile = sh => {
  sh.uniforms.uTime = windU; sh.uniforms.uH = { value: hTex }; sh.uniforms.uIsle = waterU.uIsle; sh.uniforms.uC = waterU.uC; sh.uniforms.uFoul = waterU.uFoul;
  sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = `uniform float uTime; uniform sampler2D uH; uniform float uIsle; uniform vec2 uC; uniform float uFoul; varying vec3 vWP;
    float wh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float wn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(wh(i), wh(i + vec2(1, 0)), f.x), mix(wh(i + vec2(0, 1)), wh(i + vec2(1, 1)), f.x), f.y); }
    vec2 flowAt(vec2 p, float k) {            // where this point's water was k seconds-ish ago: drift with the current
      if (uIsle > 1.5) return p + vec2(uTime * .55 * k, 0.0);   // Stonebridge: the river runs west
      if (uIsle > .5) { vec2 d = p - uC;
        if (length(d) > 19.5) return p - vec2(0.0, sign(d.y) * uTime * .55 * k);   // the outflows run away to the map's edge
        float a = -uTime * .045 * k; return uC + mat2(cos(a), -sin(a), sin(a), cos(a)) * d; }
      return p - vec2(0.0, uTime * .55 * k);
    }
    ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    float bed = texture2D(uH, (vWP.xz + .5) / ${V_MAX}.0).r * 6.0 - 3.0, depth = -bed;
    vec2 q1 = flowAt(vWP.xz, 1.0), q2 = flowAt(vWP.xz, 1.6);
    float streak = smoothstep(.5, .85, wn(q1 * 1.1) * .55 + wn(q2 * 2.4) * .45), dark = smoothstep(.55, .2, wn(q2 * .7 + 3.1));
    diffuseColor.rgb *= .88 + .12 * dark;
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.7 + vec3(.05, .07, .08), streak * .6 * (1.0 - .4 * uFoul));
    float scum = uFoul * smoothstep(.66, .86, wn(q2 * .8 + 5.0) * .6 + wn(vWP.xz * 3.1) * .4);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.3, .29, .12), scum * .5);
    diffuseColor.a = mix(diffuseColor.a, 1.0, scum * .35);
    float shore = 1.0 - smoothstep(.02, .3, depth);
    float froth = smoothstep(.45, .75, wn(q1 * 2.6 + vec2(0.0, uTime * .7)) * .6 + wn(vWP.xz * 5.0 - uTime * .9) * .4 + shore * .35);
    diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(.86, .9, .9), vec3(.66, .66, .5), uFoul), shore * froth * .85);
    diffuseColor.a = mix(diffuseColor.a, 1.0, shore * froth * .6);`);
};
waterMat.customProgramCacheKey = () => 'flowing-water';

const C = { grass: new THREE.Color('#5a7338'), grass2: new THREE.Color('#3b5127'), dirt: new THREE.Color('#7b5d3c'),
  rock: new THREE.Color('#77736a'), sand: new THREE.Color('#9d906b'), bed: new THREE.Color('#45432f'), dry: new THREE.Color('#7f7948') };
const tmpC = new THREE.Color();
const SNOW_C = new THREE.Color('#e4e6ea'), SCORCH_MUD = new THREE.Color('#8f7556'), BLIGHT_C = new THREE.Color('#6c6a5c');
function recolor() {
  for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) {
    const k = idx(i, j), h = H[k];
    const hx = (H[idx(Math.min(i + 1, V - 1), j)] - H[idx(Math.max(i - 1, 0), j)]) / 2;
    const hz = (H[idx(i, Math.min(j + 1, V - 1))] - H[idx(i, Math.max(j - 1, 0))]) / 2;
    tmpC.copy(C.grass2).lerp(C.grass, clamp((gvar[k] - .25) * 2, 0, 1));
    tmpC.lerp(C.dry, sstep(.55, .72, dvar[k]) * .4);
    tmpC.lerp(C.sand, sstep(.8, .2, h)); tmpC.lerp(C.bed, sstep(-.1, -.8, h));
    if (MAP === 'dune') { const od = oasisD(i, j); tmpC.lerp(C.dry, sstep(.68, .95, od) * .75); tmpC.lerp(DUNE_SAND, sstep(.86, 1.14, od) * .92); for (const m of DUNE_MESAS) tmpC.lerp(DUNE_ROCK, sstep(1.12, .95, ellD(i, j, m)) * .8); }   // sand beyond the oasis; red-brown rock mesas
    if (MAP === 'keep') { tmpC.lerp(KEEP_ASH, sstep(62, 40, j) * .55); tmpC.lerp(KEEP_RED, sstep(40, 12, j) * .7); }   // red north, scorched middle
    if (MAP === 'hold') tmpC.lerp(C.dry, .2);   // cold grass
    if (MAP === 'mere') {
      // the marsh: brownish olive, patchy; and (Jack: show the fields will do badly) withered straw-brown grass over most of the dry
      // ground too, in broad patches, least on the castle's mound
      tmpC.lerp(MERE_C, marshW(i / MK, j / MK) * (.7 + .3 * fbm(i * .3, j * .3)));
      const wf = sstep(.36, .56, fbm(i / MK * .09 + 3.7, j / MK * .09 + 1.3)) * (.55 + .45 * fbm(i * .4, j * .4));
      tmpC.lerp(MERE_DEAD, Math.max(wf * .85, marshW(i / MK, j / MK) * .45) * (.6 + .4 * sstep(5, 10, Math.hypot(i - KX, j - KZ))));
    }
    if (bonusOn()) {
      if (MAP === 'meadow') {
        // Scorched Meadow: parched yellow-brown grass, bare sandy patches, the dry river bed cracked mud
        tmpC.lerp(C.dry, .8); tmpC.lerp(DUNE_SAND, sstep(.45, .7, fbm(i * .08 + 5, j * .08 + 9)) * .6);
        const bed = 1 - sstep(2.5, 6, Math.abs(i - meadowRiverX(j))), crack = 1 - sstep(0, .035, Math.abs(fbm(i * .7 + 2, j * .7 + 8) - .5));
        tmpC.lerp(SCORCH_MUD, bed * .9); tmpC.multiplyScalar(1 - bed * crack * .35);
      } else if (MAP === 'isle') {
        // Blighted Isle: sickly olive and withered brown in broad patches, the blight's grey rot here and there
        tmpC.lerp(MERE_C, .45); tmpC.lerp(MERE_DEAD, sstep(.38, .58, fbm(i * .09 + 3.7, j * .09 + 1.3)) * .75);
        tmpC.lerp(BLIGHT_C, sstep(.6, .75, fbm(i * .17 + 11, j * .17 + 4)) * .6);
      } else if (MAP === 'pass') tmpC.lerp(SNOW_C, .62 + .25 * fbm(i * .2 + 7, j * .2 + 3));   // Frozen Pass: snow over the open ground
    }
    if (MAP === 'plains') tmpC.lerp(PLAINS_C, .35);              // the plains: a fresh, lighter green
    if (MAP === 'crag') tmpC.lerp(C.rock, (1 - sstep(.75, 1.05, blobD(i / MK, j / MK, CRAG_ROCK, 2))) * .85);   // the grey crag
    if (MAP === 'ford') tmpC.lerp(C.dry, .3);                                                          // highland grass
    if (MAP === 'watch') { tmpC.lerp(C.dry, .62); tmpC.lerp(C.sand, (1 - sstep(1, 3.4, polyDist(WATCH_GULLY, i, j))) * .75); }   // Watchhill: dry golden grass, a sandy gully
    // Greenvale's hills stay green
    tmpC.lerp(C.rock, MAP === 'vale' ? sstep(1.4, 2.2, Math.hypot(hx, hz)) * .6 : sstep(.55, 1.1, Math.hypot(hx, hz)) * (MAP === 'watch' ? .7 : 1));
    if (h > 10) tmpC.lerp(SNOW_C, (MAP === 'hold' ? sstep(10.5, 13, h) * .85 : sstep(16.2, 18.5, h) * .7));   // Warlord's Hold: a lower snow line
    tmpC.lerp(C.dirt, dirt[k]);
    tmpC.multiplyScalar(.94 + .1 * hash(i * 1.7, j * 2.3));
    tCol[k * 3] = tmpC.r; tCol[k * 3 + 1] = tmpC.g; tCol[k * 3 + 2] = tmpC.b;
  }
}
// ---------- the map's sides: solid earth from the ground's edge down, and water where a river runs off the edge ----------
// so seen from a low angle the map is a block of land, not a paper-thin sheet
const EDGE_BASE = -4;
const edgeEarth = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, side: THREE.DoubleSide }));
const edgeWater = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: '#3d6e86', transparent: true, opacity: .85, roughness: .7, side: THREE.DoubleSide }));
edgeEarth.receiveShadow = true; scene.add(edgeEarth, edgeWater);
function buildEdges() {
  const ep = [], ec = [], wp = [], c = new THREE.Color();
  // earth colour by depth below the rim: a grassy lip, then soil, darker and stonier further down
  const col = (y, top, x, z) => { const d = top - y; c.set(d < .12 ? '#5f7a35' : d < 1.2 ? '#7a5d3e' : '#665241'); c.multiplyScalar(.9 + .2 * hash(x * 1.3 + y, z * .7 - y)); return [c.r, c.g, c.b]; };
  const side = pts => {                       // pts: edge vertices [x, z] in order along one side
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], h0 = H[idx(x0, z0)], h1 = H[idx(x1, z1)];
      const q = [[x0, h0, z0], [x1, h1, z1], [x1, EDGE_BASE, z1], [x0, EDGE_BASE, z0]];
      for (const k of [0, 1, 2, 0, 2, 3]) { ep.push(...q[k]); ec.push(...col(q[k][1], k === 1 || k === 2 ? h1 : h0, q[k][0], q[k][2])); }
      if (h0 < 0 || h1 < 0) {                 // the river's cross-section where it leaves the map
        const w = [[x0, Math.min(h0, 0), z0], [x1, Math.min(h1, 0), z1], [x1, 0, z1], [x0, 0, z0]];
        for (const k of [0, 1, 2, 0, 2, 3]) wp.push(...w[k]);
      }
    }
  };
  const e = [...Array(SIZE + 1).keys()];
  side(e.map(i => [i, 0])); side(e.map(i => [SIZE, i])); side(e.map(i => [SIZE - i, SIZE])); side(e.map(i => [0, SIZE - i]));
  for (const [m, pos, cols] of [[edgeEarth, ep, ec], [edgeWater, wp, null]]) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (cols) g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
    m.geometry.dispose(); m.geometry = g;
  }
}
let gIdx = [], gPos = null;
const gGeo = new THREE.BufferGeometry();
function gridLines() {   // the Grid overlay's lines for the current map size
  gIdx = [];
  for (let n = 0; n <= N; n++) { const L = n * CELL; for (let s = 0; s < V - 1; s++) { gIdx.push(idx(s, L), idx(s + 1, L)); gIdx.push(idx(L, s), idx(L, s + 1)); } }
  gPos = new Float32Array(gIdx.length * 3);
  gIdx.forEach((k, n) => { gPos[n * 3] = k % V; gPos[n * 3 + 2] = Math.floor(k / V); });
  gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
}
gridLines();
const grid = new THREE.LineSegments(gGeo, new THREE.LineBasicMaterial({ color: '#f2e6c4', transparent: true, opacity: .28, toneMapped: false }));
grid.visible = false; scene.add(grid);

// ---------- materials + primitives ----------
const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true });
// ---------- team colours (Jack): the town's colour and the raiders' are the player's pick on the title screen (Colours), five to
// choose from, blue and red by default. Every material that carries a side's colour is registered with its side and the colour it
// has by default (`teamMat`); `teamColor` maps that default onto the picked colour, keeping its offset in hue, saturation and
// lightness from the side's default (so a darker drape stays darker than the flag); tinted copies (`tinted`) and the boss forts'
// darkened copies (`darkFort`) register themselves too; the quilted gambesons get a newly drawn texture (`quiltTex`)
const TEAM_PAL = { blue: '#3466b0', red: '#a32a22', green: '#2f8a3e', purple: '#6b3fa0', black: '#34343b', gold: '#c9962f', white: '#d8d3c4' };
// gold and white come with the full game (Jack): a padlock on their swatches before (renderColours, 11-store.js)
const TEAM_DEF = { town: '#3466b0', foe: '#a32a22' }, TEAM_NAMES = ['blue', 'red', 'green', 'purple', 'black', 'gold', 'white'], FULL_COLS = ['gold', 'white'];
var TEAM = { town: 'blue', foe: 'red' };
try { const t = JSON.parse(localStorage.getItem('mtd-colours') || 'null'); if (t && TEAM_PAL[t.town] && TEAM_PAL[t.foe] && t.town !== t.foe) TEAM = t; } catch (e) {}
const teamMats = [];
const hexHSL = h => { const n = parseInt(h.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l }; const s = d / (1 - Math.abs(2 * l - 1)); let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: (hh * 60 + 360) % 360, s, l }; };
const hslHex = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, k = Math.floor(h / 60) % 6;
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k]; return '#' + [r, g, b].map(v => Math.round(clamp(v + m, 0, 1) * 255).toString(16).padStart(2, '0')).join(''); };
function teamColor(def, side) {
  const c0 = hexHSL(TEAM_DEF[side]), cd = hexHSL(def), cp = hexHSL(TEAM_PAL[TEAM[side]]);
  let dh = cd.h - c0.h; if (dh > 180) dh -= 360; if (dh < -180) dh += 360;
  return hslHex((cp.h + dh + 360) % 360, clamp(cp.s * (c0.s ? cd.s / c0.s : 1), 0, 1), clamp(cp.l + (cd.l - c0.l), .05, .9));
}
const srgbHex = c => '#' + c.clone().convertLinearToSRGB().getHexString();
function teamMat(m, side, def, quilt) {
  m.userData.team = { side, def }; teamMats.push({ m, side, def, quilt });
  if (quilt) m.map = quiltTex(teamColor(quilt[0], side), teamColor(quilt[1], side)); else m.color.set(teamColor(def, side));
  return m;
}
function applyTeams() {
  for (const t of teamMats) {
    if (t.quilt) { const old = t.m.map; t.m.map = quiltTex(teamColor(t.quilt[0], t.side), teamColor(t.quilt[1], t.side)); if (old) old.dispose(); }
    else t.m.color.set(teamColor(t.def, t.side));
  }
}
const M = { plaster: mat('#dccba2'), timber: mat('#6e4c30'), roof: mat('#8d4a2c'), stone: mat('#8a857a'),
  wood: mat('#957049'), rough: mat('#8a6a48'), dark: mat('#2a2018'), flag: mat('#3466b0'), stone2: mat('#a39d8f'), court: mat('#7d6a4f'),
  log: mat('#6e4b2c'), logEnd: mat('#c9a271'), thatch: mat('#7d5a38'), thatchOld: mat('#a88d55'), tile: mat('#9b4a2e'), mud: mat('#8a7350'),
  iron: mat('#5d6064'), soil: mat('#5e4630'), crop1: mat('#6f8f3a'), crop2: mat('#93a246'), wheat: mat('#d1b45a'), hay: mat('#c9ab55'),
  canvas: mat('#cfc2a0'), daub: mat('#c8b48c'), banner: mat('#2f4f8a'), leaf: mat('#4f7a32'),
  roofBlue: mat('#3f5f96') };   // tier 3 roofs: blue is the town's colour (red is the raiders')
M.glow = new THREE.MeshStandardMaterial({ color: '#3a2a18', emissive: new THREE.Color('#ffb347'), emissiveIntensity: .1, roughness: .8 });
// fire is unlit and a little see-through: deep orange outside, yellow inside, a near-white core
const flameMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, toneMapped: false });
M.flame = flameMat('#ff5a14', .78); M.flameMid = flameMat('#ffa22e', .85); M.flameCore = flameMat('#fff1b0', .95);
// fire: unit-height cones (see FLAME_GEO) that flicker, lick sideways and stretch, more towards the tip; each tongue gets its own
// phase from its position, so the tongues of one torch never move together
const flameShader = sh => {
  sh.uniforms.uTime = windU;
  sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float ph = modelMatrix[3].x * 3.1 + modelMatrix[3].z * 1.7 + modelMatrix[3].y * 5.3, k = clamp(position.y + .5, 0.0, 1.0);
    transformed.x += (sin(uTime * 9.0 + ph + position.y * 5.0) * .55 + sin(uTime * 19.0 + ph * 2.0) * .2) * k * k;
    transformed.z += (cos(uTime * 7.3 + ph * 1.3 + position.y * 4.0) * .5 + sin(uTime * 15.0 + ph * .7) * .15) * k * k;
    transformed.xz *= 1.0 - .25 * sin(uTime * 13.0 + ph) * k;
    transformed.y = (transformed.y + .5) * (1.0 + .3 * sin(uTime * 11.0 + ph) + .14 * sin(uTime * 23.0 + ph * 1.7)) - .5;`);
};
M.flame.onBeforeCompile = M.flameMid.onBeforeCompile = M.flameCore.onBeforeCompile = flameShader;
const FLAME_GEO = new THREE.ConeGeometry(1, 1, 7, 5);
M.water = new THREE.MeshStandardMaterial({ color: '#2f5560', roughness: .2 });
// stone surfaces get running-bond masonry: darker mortar joints and slightly varied blocks
const masonry = sh => {
  sh.vertexShader = 'varying vec3 vMP; varying vec3 vMN;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    vMP = (modelMatrix * vec4(transformed, 1.0)).xyz; vMN = normalize(mat3(modelMatrix) * objectNormal);`);
  sh.fragmentShader = `varying vec3 vMP; varying vec3 vMN;
    float mh(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.7); }
  ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    vec3 an = abs(vMN);
    vec2 q = an.y > .65 ? vMP.xz * vec2(2.2, 2.2) : (an.x > an.z ? vMP.zy : vMP.xy) * vec2(2.3, 3.4);
    q.x += mod(floor(q.y), 2.0) * .5;
    vec2 cf = fract(q), ci = floor(q);
    float j = max(1.0 - smoothstep(.0, .07, min(cf.x, 1.0 - cf.x)), 1.0 - smoothstep(.0, .1, min(cf.y, 1.0 - cf.y)));
    float blk = .84 + .3 * mh(ci) - .08 * smoothstep(.55, 1.0, cf.y);
    diffuseColor.rgb *= mix(blk, .5, j);`);
};
M.stone.onBeforeCompile = masonry; M.stone2.onBeforeCompile = masonry;
// roofs (tier 1 brown, tier 2 straw, tier 3 blue) get courses of thatch bundles or tiles with uneven, weathered colour
const roofGrit = sh => {
  sh.vertexShader = 'varying vec3 vRP;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    vRP = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
  sh.fragmentShader = `varying vec3 vRP;
    float rh(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    float row = vRP.y * 7.0, cf = fract(row);
    vec2 cell = vec2(floor((vRP.x + vRP.z) * 5.0 + floor(row) * .5), floor(row));
    float var = .8 + .3 * rh(cell) + .08 * rh(floor(vRP.xz * 23.0));
    diffuseColor.rgb *= var * mix(.7, 1.0, smoothstep(.0, .22, cf));`);
};
M.roofBlue.onBeforeCompile = roofGrit;
// tier 1: straw thatch - fine strands running down the slope in ragged bundles, with darker gaps between courses
M.thatchOld.onBeforeCompile = sh => {
  sh.vertexShader = 'varying vec3 vSP; varying vec3 vSO;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    vSP = (modelMatrix * vec4(transformed, 1.0)).xyz; vSO = transformed;`);
  sh.fragmentShader = `varying vec3 vSP; varying vec3 vSO;
    float sh1(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    float u = atan(vSO.z, vSO.x) * 25.46, row = vSP.y * 4.5, cf = fract(row);   // ~160 strands round the peak, running straight down each face
    float strand = sh1(vec2(floor(u), floor(row)));
    float ragged = sh1(vec2(floor(u * .25), floor(row) + 3.0)) * .25;
    diffuseColor.rgb *= (.78 + .32 * strand) * mix(.62, 1.0, smoothstep(ragged, ragged + .25, cf));`);
};
// tier 2 wooden roofs: pyramids (M.thatch) are covered in staggered wooden shingles; the cottage's gable slabs (M.logGable)
// keep compact rounded logs from ridge to eave
const logRoof = gable => sh => {
  sh.vertexShader = 'varying vec3 vLO; varying vec3 vLW; varying vec3 vLN;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    vLO = transformed; vLW = (modelMatrix * vec4(transformed, 1.0)).xyz; vLN = objectNormal;`);
  sh.fragmentShader = `varying vec3 vLO; varying vec3 vLW; varying vec3 vLN;
    float lh(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.7); }
  ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    ${gable ? `float u = vLO.x * 11.0, f = fract(u), id = floor(u);
    float rnd = sqrt(max(0.0, sin(f * 3.14159)));
    diffuseColor.rgb *= (.82 + .3 * lh(vec2(id, 1.0))) * (.38 + .7 * rnd) * (.92 + .12 * lh(vec2(id, floor(vLO.z * 7.0))));` :
    `// pyramids: wooden shingles in staggered rows, each with its own shade, a shadowed lower edge where it laps the row below, and grain
    float row = vLW.y * 9.0, cf = fract(row), across = (abs(vLN.z) > abs(vLN.x) ? vLW.x : vLW.z) * 6.5 + floor(row) * .5;
    float cid = floor(across), cx = fract(across);
    float tone = .74 + .34 * lh(vec2(cid, floor(row)));
    float lap = mix(.5, 1.0, smoothstep(.0, .28, cf)), gap = mix(.62, 1.0, smoothstep(.0, .07, min(cx, 1.0 - cx)));
    float grain = .93 + .1 * lh(vec2(floor(across * 7.0), floor(row)));
    diffuseColor.rgb *= tone * lap * gap * grain;`}`);
};
M.thatch.onBeforeCompile = logRoof(false); M.thatch.customProgramCacheKey = () => 'logroof:peak';   // both variants share one function source
M.logGable = M.thatch.clone(); M.logGable.onBeforeCompile = logRoof(true); M.logGable.customProgramCacheKey = () => 'logroof:gable';
// grit for wood (grain streaks, knots of darker colour) and rock (mottling and specks); composes with any shader the material already has
const GRIT_NOISE = `
  float gh2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float gn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(gh2(i), gh2(i + vec2(1, 0)), f.x), mix(gh2(i + vec2(0, 1)), gh2(i + vec2(1, 1)), f.x), f.y); }
`;
const GRIT = {
  wood: `float gg = gn2(vec2((vGP.x + vGP.z) * 16.0, vGP.y * 1.4)), gk = gn2(vGP.xz * 3.1 + vGP.y * 2.3);
    diffuseColor.rgb *= .76 + .3 * gg + .1 * gk;`,
  rock: `float r1 = gn2(vGP.xz * 3.6 + vGP.y * 2.7), r2 = gn2(vec2(vGP.x + vGP.y, vGP.z - vGP.y) * 11.0);
    diffuseColor.rgb *= (.74 + .3 * r1 + .14 * r2) * (gh2(floor(vGP.xz * 26.0 + vGP.y * 9.0)) > .93 ? .7 : 1.0);`,
  earth: `vec2 ep = vGP.xz + vGP.y * 1.3; float e1 = gn2(ep * 1.7), e2 = gn2(ep * 7.5 + 3.1), es = gh2(floor(ep * 22.0));
    diffuseColor.rgb *= (.8 + .26 * e1 + .12 * e2) * (es > .94 ? .7 : es < .05 ? 1.2 : 1.0);`,
  stone: `float s1 = gn2(vec2(vGP.x + vGP.z, vGP.y) * 9.0);
    diffuseColor.rgb *= .9 + .18 * s1;`,
};
function addGrit(m, kind) {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    prev.call(m, sh, r);
    sh.vertexShader = 'varying vec3 vGP;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 gpos = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        gpos = instanceMatrix * gpos;
      #endif
      vGP = (modelMatrix * gpos).xyz;`);
    sh.fragmentShader = 'varying vec3 vGP;\n' + GRIT_NOISE + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + GRIT[kind]);
  };
  // three keys compiled shaders by the onBeforeCompile source, which is the same text for every grit kind
  m.customProgramCacheKey = () => 'grit:' + kind + ':' + prev.toString();
}
for (const m of [M.wood, M.rough, M.timber, M.log, M.dark]) addGrit(m, 'wood');
addGrit(M.stone, 'stone'); addGrit(M.stone2, 'stone'); addGrit(M.court, 'earth');   // tier 1 slabs: mottled packed earth with pebbles
M.plainStone = mat('#8f8a80'); addGrit(M.plainStone, 'rock');   // tier 2 bases: rough grey stone without block joints
// doors by tier, the same on every building of that tier: weathered planks, dark oak, painted the town's blue like tier-3 roofs
const DOOR_M = [null, mat('#4a301c'), mat('#6b4527'), mat('#7b5639')]; DOOR_M.slice(1).forEach(m => addGrit(m, 'wood'));
M.drape = mat('#2f4f8a');
M.awning = mat('#3466b0');   // market awning stripes: the town's blue (no flag wave)
teamMat(M.flag, 'town', '#3466b0'); teamMat(M.banner, 'town', '#2f4f8a'); teamMat(M.roofBlue, 'town', '#3f5f96'); teamMat(M.drape, 'town', '#2f4f8a'); teamMat(M.awning, 'town', '#3466b0');
M.drape.onBeforeCompile = sh => {
  sh.uniforms.uTime = windU;
  sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float dph = modelMatrix[3].x * .9 + modelMatrix[3].z * .5, du = clamp(.5 - transformed.y * 1.1, 0.0, 1.0);
    transformed.z += (sin(uTime * 2.6 - du * 5.0 + dph) * .05 + .02) * du;
    transformed.x += sin(uTime * 1.9 - du * 3.0 + dph) * .015 * du;`);
};
// flags and banners ripple: the edge nearest the pole stays put, the free edge moves most
for (const fm of [M.flag, M.banner]) fm.onBeforeCompile = sh => {
  sh.uniforms.uTime = windU;
  sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float fph = modelMatrix[3].x * .7 + modelMatrix[3].z * .4, fu = clamp(transformed.x * 1.4 + .5, 0.0, 1.0);
    transformed.z += sin(uTime * 5.0 - fu * 6.0 + fph) * .07 * fu + sin(uTime * 8.3 - fu * 9.0 + fph) * .02 * fu;
    transformed.y += sin(uTime * 3.1 - fu * 4.0 + fph) * .025 * fu;`);
};
const FLOWER = ['#d4483b', '#f0c84a', '#9a5ad0', '#f2efe6', '#e27aa8'].map(mat);
function box(w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; }
function drapeBox(w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 2, 10, 1), m); o.position.set(x, y, z); o.castShadow = true; return o; }
// every flag on a roof is the same size: a 1 m pole from y up, the town's flag at its top; k undoes a scaled parent (crossbow towers)
function roofFlag(parent, x, y, z, k = 1) {
  const f = new THREE.Group(); f.position.set(x, y, z); f.scale.setScalar(1 / k); parent.add(f);
  f.add(box(.05, 1.0, .05, M.timber, 0, .5, 0)); f.add(flagBox(.45, .3, .03, M.flag, .25, .85, 0)); return f;
}
function flagBox(w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 10, 2, 1), m); o.position.set(x, y, z); o.castShadow = true; return o; }
function cyl(rt, rb, h, seg, m, x, y, z) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; }
// a round roof (tower cones) with the same thick eave band as pyramid roofs
function coneRoof(r, h, seg, m, x, y, z) {
  const o = new THREE.Group(); o.position.set(x, y, z);
  const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m); c.castShadow = c.receiveShadow = true; o.add(c);
  const t = Math.min(.14, Math.max(.06, r * .07)), e = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .97, t, seg), m);
  e.position.y = -h / 2 - t / 2 + .005; e.castShadow = e.receiveShadow = true; o.add(e);
  return o;
}
function cone(r, h, seg, m, x, y, z) { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m); o.position.set(x, y, z); o.castShadow = true; return o; }
// a triangular prism lying along x (a gable end seen from the side): base d deep, h high
// a door leaf hung on a hinge at (hx, y, z), running dir (+1/-1) along x; it swings open by `open` radians (see updateDoors)
function leaf(w, h, t, m, hx, y, z, dir, open) {
  const p = new THREE.Group(); p.position.set(hx, y, z); p.add(box(w, h, t, m, dir * w / 2, 0, 0)); p.userData.leaf = open; return p;
}
function prism(w, d, h, m, x, y, z) {
  const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, h); sh.lineTo(-d / 2, 0);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); geo.rotateY(Math.PI / 2); geo.translate(-w / 2, 0, 0);
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; return o;
}
// a four-sided roof; a band under its edge gives the eaves real thickness instead of a paper-thin rim
function pyramid(r, h, sz, m, y, x = 0, z = 0) {
  const o = new THREE.Group(); o.position.set(x, y, z);
  const geo = new THREE.ConeGeometry(r, h, 4); geo.rotateY(Math.PI / 4); geo.scale(1, 1, sz);
  const roof = new THREE.Mesh(geo, m); roof.castShadow = roof.receiveShadow = true; o.add(roof);
  const t = Math.min(.14, Math.max(.06, r * .07)), eg = new THREE.CylinderGeometry(r, r * .97, t, 4, 1); eg.rotateY(Math.PI / 4); eg.scale(1, 1, sz);
  const eave = new THREE.Mesh(eg, m); eave.position.y = -h / 2 - t / 2 + .005; eave.castShadow = eave.receiveShadow = true; o.add(eave);
  return o;
}

