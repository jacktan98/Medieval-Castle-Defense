// ---------- trees ----------
const MAXT = N_MAX * N_MAX * 3;
const trunkGeo = new THREE.CylinderGeometry(.13, .18, .9, 5).translate(0, .45, 0);
const crownGeo = new THREE.ConeGeometry(.85, 2.3, 6).translate(0, 1.9, 0);
const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: '#4d3622', flatShading: true }), MAXT);
const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true }), MAXT);
trunks.castShadow = crowns.castShadow = true; scene.add(trunks, crowns);
// sized for every tree up front: r128 sizes instanceColor from .count on the first setColorAt, and maps differ in tree count
crowns.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXT * 3), 3);
const windU = { value: 0 };
// trees standing between the camera and the point it looks at dissolve (dithered), so units and buildings stay visible
function cutaway(sh) {
  sh.uniforms.uCam = { value: camera.position }; sh.uniforms.uTgt = { value: target };
  sh.vertexShader = 'varying vec3 vTreeP;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    vTreeP = vec3(0.0);
    #ifdef USE_INSTANCING
      vTreeP = (modelMatrix * instanceMatrix * vec4(0.0, 1.2, 0.0, 1.0)).xyz;
    #endif`);
  sh.fragmentShader = 'uniform vec3 uCam; uniform vec3 uTgt; varying vec3 vTreeP;\n' + sh.fragmentShader.replace('void main() {', `void main() {
    vec3 ct = uTgt - uCam; float tt = clamp(dot(vTreeP - uCam, ct) / dot(ct, ct), 0.0, 1.0);
    float cutK = (1.0 - smoothstep(1.4, 2.8, length(vTreeP - uCam - ct * tt))) * (1.0 - smoothstep(.8, .93, tt)) * 1.25;
    if (cutK > fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))))) discard;`);
}
crowns.material.onBeforeCompile = sh => {
  sh.uniforms.uTime = windU;
  sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float ph = 0.0;
    #ifdef USE_INSTANCING
      ph = instanceMatrix[3].x * .37 + instanceMatrix[3].z * .23;
    #endif
    float sw = max(transformed.y - .7, 0.0);
    transformed.x += sin(uTime * 1.3 + ph) * .055 * sw;
    transformed.z += cos(uTime * 1.05 + ph * 1.3) * .04 * sw;`);
  cutaway(sh);
};
trunks.material.onBeforeCompile = sh => cutaway(sh);
addGrit(trunks.material, 'wood');
let trees = [];
function genTrees() {
  trees = []; if (MAP === 'pass') pickPassRocks(); if (MAP === 'vale') pickValeRocks();
  for (let cj = 0; cj < N; cj++) for (let ci = 0; ci < N; ci++) for (let a = 0; a < 3; a++) {
    const x = ci * CELL + hash(ci * 3 + a, cj) * CELL, z = cj * CELL + hash(cj + a * 7, ci * 5) * CELL;
    const dk = Math.hypot(x - KX, z - KZ);
    if (MAP === 'isle') {
      // woods on the island (clear round the castle and on the way to each bridge), forest beyond the river, none on the rock outcrops
      const r = isleR(Math.atan2(z - KZ, x - KX)), mask = fbm(x * .08 + 20, z * .08 + 11), h = hAt(x, z);
      if (dk < 7.5 || Math.abs(dk - r) < 3.4 || h <= 1 || nearBridge(x, z, 3) || isleRockSite(x, z, 5)) continue;
      if (dk < r && ISLE_BRIDGES.some(d => { const a = d * Math.PI / 180, t = (x - KX) * Math.cos(a) + (z - KZ) * Math.sin(a); return t > 0 && Math.abs((z - KZ) * Math.cos(a) - (x - KX) * Math.sin(a)) < 2.2; })) continue;
      const lone = hash(x * 2.1, z * 1.7) < .06;
      const woods = dk < r ? dk > 8.5 && mask > .43 && hash(x * 1.3, z * .7) < (mask - .39) * 3 : mask > .46 && hash(x * 1.3, z * .7) < (mask - .4) * 3;
      if (woods || lone) trees.push({ x, z, s: .75 + hash(z, x) * .5, k: 1 });
      continue;
    }
    if (MAP === 'keep' || MAP === 'hold') {
      // Raider Keep: dead trees in the middle band (scenery, out of reach), two green woods in the south corners, a few lone trees
      // Warlord's Hold: pines on the lower slopes either side and in the south corners; out-of-reach pines up the mountains
      if (dk < 8 || sceneryAt(x, z) || hAt(x, z) < .7) continue;
      const roads = MAP === 'keep' ? KEEP_ROADS : HOLD_ROADS;
      if (roads.some(p => polyDist(p, x, z) < 2.6)) continue;
      if (MAP === 'keep') {
        if (polyDist(KEEP_DITCH, x, z) < 3 || inPoly(KEEP_POLY, x, z) || KEEP_RUINS.some(([a, b]) => Math.hypot(x - a, z - b) < 3) || KEEP_CAMPS.some(c => Math.hypot(x - c.at[0], z - c.at[1]) < 9)) continue;
        if (z > 28 && z < 56 && hash(x * 1.9, z * 2.3) < .07) { trees.push({ x, z, s: .7 + hash(z, x) * .4, k: 1, bare: true, deco: true }); continue; }
        const wood = [[9, 70, 6, 5], [71, 70, 6, 5]].some(([cx, cz, rx, rz]) => Math.hypot((x - cx) / rx, (z - cz) / rz) < 1) && hash(x * 1.3, z * .7) < .65;
        if (wood || (z > 56 && hash(x * 2.1, z * 1.7) < .02)) trees.push({ x, z, s: .75 + hash(z, x) * .45, k: 1 });
      } else {
        if (polyDist(HOLD_RIVER, x, z) < 4.5) continue;
        if (!holdOpen(x, z)) { if (hAt(x, z) < 13 && hash(x * 2.3, z * 1.9) < .2) trees.push({ x, z, s: .7 + hash(z, x) * .5, k: 1, deco: true }); continue; }
        const wood = [[17, 30, 7, 3.5], [63, 30, 7, 3.5], [19, 70, 7, 3.5], [62, 70, 7, 3.5]].some(([cx, cz, rx, rz]) => Math.hypot((x - cx) / rx, (z - cz) / rz) < 1) && hash(x * 1.3, z * .7) < .7;
        if (wood || hash(x * 2.1, z * 1.7) < .015) trees.push({ x, z, s: .75 + hash(z, x) * .45, k: 1 });
      }
      continue;
    }
    if (MAP === 'mere' || MAP === 'plains') {
      // Meadowmere: woods on the dry rise and in the south-east, a few in the south-west, very few in the marsh
      // Horsefields: three copses and the odd lone tree on the open plains
      // (the layout's own shapes at X, Z: the medium maps are scaled up by MK)
      const X = x / MK, Z = z / MK;
      const roads = MAP === 'mere' ? MERE_ROADS : PLAINS_ROADS, water = MAP === 'mere' ? mereRiverD(X, Z) : polyDist(PLAINS_STREAM, X, Z);
      if (roads.some(p => polyDist(p, X, Z) < 2.6) || water < 4 || dk < 8 || hAt(x, z) < .6) continue;
      const groups = MAP === 'mere' ? [[9.8, 15.5, 6.5, 5.5], [49, 49, 6, 5], [5.6, 50, 3.5, 3]] : [[9.1, 12.6, 3.2, 2.4], [46.2, 43.4, 3.2, 2.4], [43.4, 11.9, 2.4, 2]];
      const wood = groups.some(([cx, cz, rx, rz]) => Math.hypot((X - cx) / rx, (Z - cz) / rz) < 1) && hash(x * 1.3, z * .7) < .65;
      if (wood || hash(x * 2.1, z * 1.7) < (MAP === 'mere' ? (marshW(X, Z) > .5 ? .008 : .03) : .01)) trees.push({ x, z, s: .75 + hash(z, x) * .45, k: 1 });
      continue;
    }
    if (MAP === 'crag') {
      // deep woods everywhere but the clearing, the crag, the trails and the stream
      const X = x / MK, Z = z / MK;
      if (blobD(X, Z, CRAG_CLEAR, 5) < 1 || (X > 40 && Z > 26 && Z < 34 && CRAG_ROADS[1] && polyDist(CRAG_ROADS[1], X, Z) < 3.4) || blobD(X, Z, CRAG_ROCK, 2) < 1.05 || CRAG_ROADS.some(p => polyDist(p, X, Z) < 2.4) || polyDist(CRAG_STREAM, X, Z) < 3 || dk < 8) continue;
      if (hash(x * 1.3, z * .7) < .72) trees.push({ x, z, s: .8 + hash(z, x) * .5, k: 1 });
      continue;
    }
    if (MAP === 'ford') {
      // a few pines: two stands and the odd lone one
      const X = x / MK, Z = z / MK;
      if (polyDist(FORD_RIVER, X, Z) < 5 || polyDist(FORD_ROAD, X, Z) < 2.5 || dk < 8) continue;
      const stand = [[5.6, 32.2, 3.4, 3], [39.2, 53.2, 3, 2.6]].some(([cx, cz, rx, rz]) => Math.hypot((X - cx) / rx, (Z - cz) / rz) < 1) && hash(x * 1.3, z * .7) < .7;
      if (stand || hash(x * 2.1, z * 1.7) < .012) trees.push({ x, z, s: .75 + hash(z, x) * .4, k: 1 });
      continue;
    }
    if (MAP === 'dune') {
      // the only wood: trees round the pool and a few in the oasis
      const p = ellD(x, z, DUNE_POOL), o = oasisD(x, z);
      if (dk < 7.5 || polyDist(DUNE_ROAD, x, z) < 2.6 || p < 1.36) continue;   // none inside the pool's basin (closed: sceneryAt)
      if ((p < 2.2 && hash(x * 1.3, z * .7) < .33) || (o < .85 && hash(x * 2.1, z * 1.7) < .012)) trees.push({ x, z, s: .7 + hash(z, x) * .4, k: 1 });
      continue;
    }
    if (MAP === 'bend') {
      // woods on the island's west end and on both far banks; lone trees; none by the rivers, the roads or the castle
      if (bendRiverD(x, z) < 5 || BEND_ROADS.some(p => polyDist(p, x, z) < 2.6) || dk < 7.5) continue;
      const wood = [[7.7, 28, 5.6, 4.5], [32.9, 5.6, 6.3, 3.2], [17.5, 50.4, 6.3, 3.8], [49, 39.2, 4.2, 4]].some(([cx, cz, rx, rz]) => Math.hypot((x - cx) / rx, (z - cz) / rz) < 1) && hash(x * 1.3, z * .7) < .6;
      if (wood || hash(x * 2.1, z * 1.7) < .035) trees.push({ x, z, s: .75 + hash(z, x) * .5, k: 1 });
      continue;
    }
    if (MAP === 'watch') {
      // wood is short: scrub in a few hollows and the odd lone tree; never on the tracks, round the castle or the old tower
      if (WATCH_ROADS.some(p => polyDist(p, x, z) < 2.6) || polyDist(WATCH_GULLY, x, z) < 2.4 || dk < 8 || nearRuin(x, z, 5)) continue;
      const scrub = [[6.6, 44.8, 6, 5], [10.5, 17.5, 4.5, 4], [26.6, 50.4, 4, 3], [49, 29.4, 4.5, 4]].some(([cx, cz, rx, rz]) => Math.hypot((x - cx) / rx, (z - cz) / rz) < 1) && hash(x * 1.3, z * .7) < .55;
      if (scrub || hash(x * 2.1, z * 1.7) < .018) trees.push({ x, z, s: .6 + hash(z, x) * .4, k: 1 });
      continue;
    }
    if (MAP === 'cross') {
      // plenty of wood: woods west and south-west, along the north-east rise and in the south-east; lone trees; never on the roads,
      // by the brook, round the castle or the cross
      const h = hAt(x, z);
      if (h < .8 || nearCrossRoad(x, z, 2.6) || polyDist(CROSS_BROOK, x, z) < 4 || dk < 7.5 || Math.hypot(x - CROSS_AT[0], z - CROSS_AT[1]) < 7) continue;
      const wood = [[7, 16, 7, 10], [9, 48, 8, 6], [42, 8, 9, 5], [48, 50, 6, 4]].some(([cx, cz, rx, rz]) => Math.hypot((x - cx) / rx, (z - cz) / rz) < 1) && hash(x * 1.3, z * .7) < .62;
      if (wood || hash(x * 2.1, z * 1.7) < .045) trees.push({ x, z, s: .75 + hash(z, x) * .5, k: 1 });
      continue;
    }
    if (MAP === 'bridge') {
      // good timber on the raiders' north bank, a wood in the south-west and one in the south-east, lone trees about the meadow;
      // clear of the river's banks, the bridge, the ford and round the castle
      const d = z - stoneRiverZ(x), h = hAt(x, z), mask = fbm(x * .08 + 20, z * .08 + 11);
      if (Math.abs(d) < 5 || h < .8 || nearBridge(x, z, 3) || Math.abs(x - FORD_X) < 5 && Math.abs(d) < 9 || dk < 8) continue;
      const north = d < 0 && hash(x * 1.3, z * .7) < .5 + (mask - .45) * 1.5;
      const sw = Math.hypot((x - 7) / 7, (z - 38) / 9) < 1 && hash(x * .9, z * 1.9) < .7, se = Math.hypot((x - 49) / 7, (z - 34) / 9) < 1 && hash(x * .9, z * 1.9) < .7;
      const lone = d > 0 && hash(x * 2.1, z * 1.7) < .05;
      if (north || sw || se || lone) trees.push({ x, z, s: .75 + hash(z, x) * .5, k: 1 });
      continue;
    }
    if (MAP === 'vale') {
      // plenty of wood: woods all along the valley's rim and up the corridor's sides, copses about the meadow, clear round the
      // castle and down the corridor's middle; (out of reach, for looks) woods all over the hills
      const d = valeAt(x, z);
      if (d > .3) {
        const [[ax, az], [bx, bz]] = VALE.gap, gx = bx - ax, gz = bz - az, t = clamp(((x - ax) * gx + (z - az) * gz) / (gx * gx + gz * gz), 0, 1);
        const mid = Math.hypot(x - ax - gx * t, z - az - gz * t) < 3.5 && t > 0;   // the raiders' way in stays open
        // (Jack found the first version too thickly wooded: a thinner rim, fewer copses)
        const rim = d < 3.4 && hash(x * 1.3, z * .7) < .34, copse = dk > 9 && fbm(x * .13 + 31, z * .13 + 17) > .63 && hash(x * .9, z * 1.9) < .4;
        if (dk > 7 && !mid && (rim || copse) && !valeRockSite(x, z, 1.6)) trees.push({ x, z, s: .75 + hash(z, x) * .5, k: 1 });
      } else if ((fbm(x * .09 + 11, z * .09 + 5) > .58 && hash(x * 2.3, z * 1.9) < .34) || hash(x * 1.7, z * 2.9) < .03) trees.push({ x, z, s: .75 + hash(z, x) * .5, k: 1, deco: true });   // the hills: woods in patches, open grass between (Jack found them too thickly wooded)
      continue;
    }
    if (MAP === 'pass') {
      // a forest wrapped round the castle except toward the pass, trees along the pass's sides, and (out of reach, for looks)
      // pines on the gentler mountain slopes
      const ang = Math.atan2(z - KZ, x - KX) * 180 / Math.PI, p = passAt(x, z), open = p.depth > .3;
      if (open) {
        const ring = dk > 6.8 && dk < PASS.plate + 3.5 && !(ang > 62 && ang < 118) && hash(x * 1.3, z * .7) < .85;   // a thick forest round the castle, open toward the pass
        const edge = dk > PASS.plate && p.depth < 2.6 && hash(x * 1.7, z * .9) < .4;          // along the foot of the mountains
        const clump = dk > PASS.plate + 2 && fbm(x * .12 + 31, z * .12 + 17) > .6 && hash(x * .9, z * 1.9) < .5;
        if ((ring || edge || clump) && !passRockSite(x, z, 1.8)) trees.push({ x, z, s: .75 + hash(z, x) * .5, k: 1 });
      } else if (slopeAt(x, z) < 1.2 && hAt(x, z) < 14 && hash(x * 2.3, z * 1.9) < .18) trees.push({ x, z, s: .7 + hash(z, x) * .5, k: 1, deco: true });
      continue;
    }
    if (dk < 7.5 || (z > KZ && Math.abs(x - KX) < 3 && dk < 16) || nearBridge(x, z, 3)) continue;
    // Scorched Meadow: no living trees, only a few dead ones out of reach (wood from foresters or the market)
    if (bonusOn()) { if (dk > 10 && hash(x * 2.1, z * 1.7) < .012) trees.push({ x, z, s: .7 + hash(z, x) * .4, k: 1, bare: true, deco: true }); continue; }
    const mask = fbm(x * .08 + 20, z * .08 + 11), h = hAt(x, z);
    const lone = hash(x * 2.1, z * 1.7) < .07, forest = dk > 12 && mask > .5 && hash(x * 1.3, z * .7) < (mask - .45) * 3 * sstep(12, 18, dk);
    if (h > 1 && (dk < 12 ? lone : (forest || (dk < 16 && lone)))) trees.push({ x, z, s: .75 + hash(z, x) * .5, k: 1 });
  }
  trunks.count = crowns.count = trees.length;
  const tc = new THREE.Color();
  const sick = bonusOn() && MAP === 'isle', frost = bonusOn() && MAP === 'pass';
  trees.forEach((t, n) => { const r = hash(t.x * 3.3, t.z * 1.1); tc.setHSL(.27 + (r - .5) * .07, .3 + r * .15, .16 + hash(t.z, t.x * 2) * .09); if (r < .05) tc.setHSL(.08, .35, .24);
    if (sick) tc.setHSL(.13 + (r - .5) * .06, .25 + r * .1, .17 + hash(t.z, t.x * 2) * .08);   // Blighted Isle: sickly yellow-brown crowns
    // Frozen Pass: snow on the boughs
    if (frost) tc.lerp(SNOW_C, .45 + r * .15);
    crowns.setColorAt(n, tc); });
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
}
const dummy = new THREE.Object3D();
function seatTrees() {
  trees.forEach((t, n) => {
    const s = Math.max(1e-4, t.s * t.k);
    dummy.position.set(t.x, hAt(t.x, t.z), t.z); dummy.rotation.set(t.tilt || 0, 0, 0); dummy.scale.set(s, s, s); dummy.updateMatrix();
    trunks.setMatrixAt(n, dummy.matrix);
    if (t.bare) { dummy.scale.set(1e-4, 1e-4, 1e-4); dummy.updateMatrix(); }   // a dead tree: the trunk alone
    crowns.setMatrixAt(n, dummy.matrix);
  });
  trunks.instanceMatrix.needsUpdate = crowns.instanceMatrix.needsUpdate = true;
}
const treeFree = (t, now) => !t.dead && !t.deco && !t.cut && t.k >= 1 && !t.claim && !((t.blocked || 0) > now);   // deco: on a mountain, out of reach

// ---------- rocks ----------
const ROCK_STONE = 10;   // stone in each rock, one per mason trip; mined-out rocks don't come back
let rocks = [];
const rockGeo = new THREE.DodecahedronGeometry(.75, 0), rockMat = mat('#958f84'); addGrit(rockMat, 'rock');
// River isle: three outcrops just beyond the far bank, between the bridges
const isleRockSite = (x, z, d) => MAP === 'isle' && ISLE_ROCKS.some(g => { const a = g * Math.PI / 180, R = isleR(a) + 6.5; return Math.hypot(x - KX - Math.cos(a) * R, z - KZ - Math.sin(a) * R) < d; });
// Mountain pass: plenty of stone, in outcrops on the plateau east and south of the castle, north-west of it, and along the pass
// outcrops sit at the foot of the mountains (2–4 m inside the line), spread round it, so the middle stays open to build on
let PASS_ROCK_C = [];
function pickPassRocks() {
  PASS_ROCK_C = [];
  for (let n = 0; n < 4000 && PASS_ROCK_C.length < 8; n++) {
    const x = 2 + Math.random() * (SIZE - 4), z = 2 + Math.random() * (SIZE - 6), p = passAt(x, z);
    if (p.depth < 2.2 || p.depth > 3.8 || p.plate < 8.5 || PASS_ROCK_C.some(([a, b]) => Math.hypot(a - x, b - z) < 9)) continue;
    PASS_ROCK_C.push([x, z]);
  }
}
const passRockSite = (x, z, d) => MAP === 'pass' && passRockCentres().some(([cx, cz]) => Math.hypot(x - cx, z - cz) < d + 2.2);
const passRockCentres = () => PASS_ROCK_C;
// Greenvale: plenty of stone, in outcrops round the valley's rim (none in the corridor), a short walk from the castle
let VALE_ROCK_C = [];
function pickValeRocks() {
  VALE_ROCK_C = [];
  for (let n = 0; n < 4000 && VALE_ROCK_C.length < 6; n++) {
    const x = 4 + Math.random() * (SIZE - 8), z = 4 + Math.random() * (SIZE - 8), d = valeAt(x, z);
    if (d < 1 || d > 2.6 || Math.hypot(x - KX, z - KZ) < 8 || (x - VALE.c[0] > 4 && z - VALE.c[1] < -4) || VALE_ROCK_C.some(([a, b]) => Math.hypot(a - x, b - z) < 9)) continue;   // at the foot of the hills
    VALE_ROCK_C.push([x, z]);
  }
}
const valeRockSite = (x, z, d) => VALE_ROCK_C.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < d + 2.2);
function genRocks() {
  rocks.forEach(r => scene.remove(r.mesh)); rocks = [];
  const addRock = (x, z, s0, rot) => { const mesh = new THREE.Mesh(rockGeo, rockMat); mesh.castShadow = mesh.receiveShadow = true; mesh.rotation.set(...rot); rocks.push({ x, z, amount: ROCK_STONE, s0, mesh }); scene.add(mesh); };
  if (MAP === 'crag') return;   // Ironcrag: no loose stone at all, mine it
  if (MAP === 'keep' || MAP === 'hold') {   // plenty of stone: the keep's rise and the mountains' feet
    const groups = MAP === 'keep' ? [[7, 27, 6, 4], [75, 27, 6, 4], [14, 52, 3, 3], [68, 54, 3, 3], [30, 30, 3, 3]] : [[12, 45, 4, 3.5], [69, 45, 4, 3.5], [26, 21, 3, 3], [54, 21, 3, 3], [33, 50, 2, 2.5]];
    for (const [cx, cz, want, sp] of groups) for (let n = 0, k = 0; n < 400 && k < want; n++) {
      const x = cx + (Math.random() - .5) * 2 * sp, z = cz + (Math.random() - .5) * 2 * sp, roads = MAP === 'keep' ? KEEP_ROADS : HOLD_ROADS;
      if (!mapOpen(x, z) || sceneryAt(x, z) || hAt(x, z) < .8 || Math.hypot(x - KX, z - KZ) < 7 || roads.some(p => polyDist(p, x, z) < 2) || rocks.some(r => Math.hypot(r.x - x, r.z - z) < 2)) continue;
      if (MAP === 'keep' && (polyDist(KEEP_DITCH, x, z) < 2.5 || KEEP_CAMPS.some(c => Math.hypot(x - c.at[0], z - c.at[1]) < 8.5))) continue;
      addRock(x, z, .75 + Math.random() * .6, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    return;
  }
  if (MAP === 'mere' || MAP === 'plains') {   // little stone on either: a few small groups on dry ground
    const groups = MAP === 'mere' ? [[10.5, 19.6, 4, 3.5], [48.3, 47.6, 4, 3.5], [8, 34, 3, 3]] : [[39.2, 12.6, 3, 3], [15.4, 49, 3, 3], [51.8, 21, 2, 2.5], [20, 18, 2, 2.5]];
    for (const [cx, cz, want, sp] of groups) for (let n = 0, k = 0; n < 300 && k < Math.round(want * MK * MK); n++) {
      const X = cx + (Math.random() - .5) * 2 * sp, Z = cz + (Math.random() - .5) * 2 * sp, x = X * MK, z = Z * MK, roads = MAP === 'mere' ? MERE_ROADS : PLAINS_ROADS;
      if (hAt(x, z) < .8 || Math.hypot(x - KX, z - KZ) < 7 || roads.some(p => polyDist(p, X, Z) < 2) || rocks.some(r => Math.hypot(r.x - x, r.z - z) < 2)) continue;
      addRock(x, z, .75 + Math.random() * .6, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    return;
  }
  if (MAP === 'ford') {   // plenty of stone: on the highlands and both banks
    for (const [cx, cz, want, sp] of [[10.5, 8.4, 7, 6], [48.3, 8.4, 7, 6], [49, 48.3, 6, 5.5], [17.5, 36, 4, 3], [44, 37, 4, 3], [9.8, 49, 4, 4.5], [40, 40, 3, 3]]) for (let n = 0, k = 0; n < 400 && k < Math.round(want * MK * MK); n++) {
      const X = cx + (Math.random() - .5) * 2 * sp, Z = cz + (Math.random() - .5) * 2 * sp, x = X * MK, z = Z * MK;
      if (x < 1.5 || z < 1.5 || x > SIZE - 1.5 || z > SIZE - 1.5 || Math.hypot(x - KX, z - KZ) < 7 || polyDist(FORD_RIVER, X, Z) < 4.5 || polyDist(FORD_ROAD, X, Z) < 2 || Math.abs(z - (fordWallRow() + .5) * CELL) < 2.6 || rocks.some(r => Math.hypot(r.x - x, r.z - z) < 2)) continue;
      addRock(x, z, .75 + Math.random() * .6, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    return;
  }
  if (MAP === 'dune' || MAP === 'bend') {
    // Dunewell: round the foot of the two mesas, a few in the south-east; Riverbend: a few on the island, more on the north bank
    const groups = MAP === 'dune' ? [[46.2, 11.9, 9, 9.5], [9.1, 46.2, 8, 9], [39.2, 42, 3, 4]] : [[39.5, 22, 8, 3.6], [45.5, 5, 6, 6], [8.4, 6.3, 4, 5]];
    for (const [cx, cz, want, sp] of groups) for (let n = 0, k = 0; n < 400 && k < want; n++) {
      const x = cx + (Math.random() - .5) * 2 * sp, z = cz + (Math.random() - .5) * 2 * sp;
      if (x < 1.5 || z < 1.5 || x > SIZE - 1.5 || z > SIZE - 1.5 || Math.hypot(x - KX, z - KZ) < 7 || rocks.some(r => Math.hypot(r.x - x, r.z - z) < 2)) continue;
      if (MAP === 'dune' && (polyDist(DUNE_ROAD, x, z) < 2 || (cx !== 39.2 && (ellD(x, z, DUNE_MESAS[cx > 20 ? 0 : 1]) < 1.08 || ellD(x, z, DUNE_MESAS[cx > 20 ? 0 : 1]) > 1.6)))) continue;
      if (MAP === 'bend' && (bendRiverD(x, z) < (cx === 39.5 ? 3.2 : 4.5) || BEND_ROADS.some(p => polyDist(p, x, z) < 2))) continue;
      addRock(x, z, .75 + Math.random() * .6, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    return;
  }
  if (MAP === 'watch') {   // plenty of stone, in loose groups on the slopes
    for (const [cx, cz, want] of [[39.2, 22.4, 5], [29.4, 12.6, 4], [48.3, 13.3, 6], [10.5, 36.4, 5], [23.1, 39.2, 3], [7.7, 11.2, 4], [44, 32, 3]]) for (let n = 0, k = 0; n < 300 && k < want; n++) {
      const x = cx + (Math.random() - .5) * 6, z = cz + (Math.random() - .5) * 5;
      if (WATCH_ROADS.some(p => polyDist(p, x, z) < 2) || nearRuin(x, z, 3.5) || Math.hypot(x - KX, z - KZ) < 7 || rocks.some(r => Math.hypot(r.x - x, r.z - z) < 2.2)) continue;
      addRock(x, z, .75 + Math.random() * .6, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    return;
  }
  if (MAP === 'cross') {   // stone is short here: five rocks, three of them under the north-east rise (trade for the rest)
    for (const [x, z] of [[46, 15], [48.5, 17], [45, 18.5], [12, 26], [35, 47]]) addRock(x, z, .9 + Math.random() * .4, [Math.random() * 3, Math.random() * 3, Math.random() * 3]);
    return;
  }
  if (MAP === 'bridge') {
    // a stony stretch of the town's bank west of the bridge, rocks by the southern hills, a few on the north bank
    const put = (x0, x1, z0, z1, want, gap) => { for (let n = 0, k = 0; n < 2000 && k < want; n++) {
      const x = x0 + Math.random() * (x1 - x0), z = z0 + Math.random() * (z1 - z0), d = z - stoneRiverZ(x);
      if (Math.abs(d) < 4.5 || Math.abs(d - BANK_D) < 3 || hAt(x, z) < .8 || nearBridge(x, z, 2.5) || Math.hypot(x - KX, z - KZ) < 7.5 || rocks.some(r => Math.hypot(r.x - x, r.z - z) < gap)) continue;   // never on the wall's line
      addRock(x, z, .75 + Math.random() * .6, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++; } };
    put(5, 21, 26, 36, 10, 2.2); put(18, 52, 44, 53, 9, 3.5); put(4, 50, 2, 11, 5, 5);   // just inside the wall west of the castle; the hills; the north bank
    return;
  }
  if (MAP === 'vale') {
    // loose groups of 3–5 spread over 8 m, then single rocks scattered about the valley (Jack found tight clusters unnatural)
    for (const [cx, cz] of VALE_ROCK_C) for (let n = 0, k = 0, want = 3 + Math.floor(Math.random() * 3); n < 300 && k < want; n++) {
      const x = cx + (Math.random() - .5) * 8, z = cz + (Math.random() - .5) * 8;
      if (valeAt(x, z) < .9 || valeAt(x, z) > 3.2 || Math.hypot(x - KX, z - KZ) < 7 || rocks.some(r => Math.hypot(r.x - x, r.z - z) < 2.4)) continue;
      addRock(x, z, .75 + Math.random() * .6, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    const [[ax, az], [bx, bz]] = VALE.gap, gx = bx - ax, gz = bz - az;
    for (let n = 0, k = 0; n < 4000 && k < 16; n++) {
      const x = 2 + Math.random() * (SIZE - 4), z = 2 + Math.random() * (SIZE - 4), t = clamp(((x - ax) * gx + (z - az) * gz) / (gx * gx + gz * gz), 0, 1);
      if (valeAt(x, z) < .9 || valeAt(x, z) > 4.5 || Math.hypot(x - KX, z - KZ) < 7.5 || Math.hypot(x - ax - gx * t, z - az - gz * t) < 4 || rocks.some(r => Math.hypot(r.x - x, r.z - z) < 4)) continue;   // near the hills, not out in the meadow
      addRock(x, z, .6 + Math.random() * .7, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    return;
  }
  if (MAP === 'pass') {
    for (const [cx, cz] of passRockCentres()) for (let n = 0, k = 0; n < 300 && k < 8; n++) {
      const x = cx + (Math.random() - .5) * 5, z = cz + (Math.random() - .5) * 5;
      if (!passOpen(x, z) || passAt(x, z).depth > 5 || Math.hypot(x - KX, z - KZ) < 6.5 || rocks.some(r => Math.hypot(r.x - x, r.z - z) < 1.7)) continue;
      addRock(x, z, .95 + Math.random() * .5, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    for (let n = 0, k = 0; n < 4000 && k < 14; n++) {
      const x = 1 + Math.random() * (SIZE - 2), z = 1 + Math.random() * (SIZE - 2);
      if (!passOpen(x, z) || passAt(x, z).depth > 4.5 || Math.hypot(x - KX, z - KZ) < 7 || rocks.some(q => Math.hypot(q.x - x, q.z - z) < 3)) continue;   // scattered along the mountains' foot too
      addRock(x, z, .85 + Math.random() * .5, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    return;
  }
  if (MAP === 'isle') {
    for (const g of ISLE_ROCKS) {
      const a = g * Math.PI / 180, R = isleR(a) + 6.5, cx = KX + Math.cos(a) * R, cz = KZ + Math.sin(a) * R;
      for (let n = 0, k = 0; n < 300 && k < 7; n++) {
        const x = cx + (Math.random() - .5) * 7, z = cz + (Math.random() - .5) * 7;
        if (x < 1 || z < 1 || x > SIZE - 1 || z > SIZE - 1 || hAt(x, z) < 1 || rocks.some(r => Math.hypot(r.x - x, r.z - z) < 1.9)) continue;
        addRock(x, z, .95 + Math.random() * .5, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
      }
    }
    // and odd rocks scattered over the land beyond the river
    for (let n = 0, k = 0; n < 4000 && k < 16; n++) {
      const x = 1 + Math.random() * (SIZE - 2), z = 1 + Math.random() * (SIZE - 2), r = isleR(Math.atan2(z - KZ, x - KX));
      if (Math.hypot(x - KX, z - KZ) < r + 4.5 || hAt(x, z) < 1.2 || nearBridge(x, z, 2) || rocks.some(q => Math.hypot(q.x - x, q.z - z) < 3)) continue;
      addRock(x, z, .85 + Math.random() * .5, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    return;
  }
  // Scorched Meadow: hardly a rock, five scattered far from the castle (stone from mines or the market)
  if (bonusOn() && MAP === 'meadow') {
    for (let n = 0, k = 0; n < 4000 && k < 5; n++) {
      const x = 2 + Math.random() * (SIZE - 4), z = 2 + Math.random() * (SIZE - 4);
      if (Math.hypot(x - KX, z - KZ) < 16 || hAt(x, z) < 1.2 || Math.abs(x - meadowRiverX(z)) < 6 || rocks.some(q => Math.hypot(q.x - x, q.z - z) < 8)) continue;
      addRock(x, z, .8 + Math.random() * .4, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
    }
    return;
  }
  // Meadow: a stony patch between the castle and the river, north of the bridge
  for (let n = 0, k = 0; n < 400 && k < 8; n++) {
    const x = 32 + (Math.random() - .5) * 8, z = 17 + (Math.random() - .5) * 8;
    if (hAt(x, z) < 1 || nearBridge(x, z, 2) || rocks.some(q => Math.hypot(q.x - x, q.z - z) < 1.9)) continue;
    addRock(x, z, .95 + Math.random() * .5, [Math.random() * 3, Math.random() * 3, Math.random() * 3]); k++;
  }
  for (let n = 0; n < 8000 && rocks.length < 48; n++) {
    const x = 1 + Math.random() * (SIZE - 2), z = 1 + Math.random() * (SIZE - 2);
    if (Math.hypot(x - KX, z - KZ) < 12 || hAt(x, z) < 1.2 || slopeAt(x, z) < .75) continue;
    if (rocks.some(r => Math.hypot(r.x - x, r.z - z) < 2.6) || nearBridge(x, z, 2)) continue;
    const mesh = new THREE.Mesh(rockGeo, rockMat); mesh.castShadow = mesh.receiveShadow = true;
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rocks.push({ x, z, amount: ROCK_STONE, s0: .9 + Math.random() * .6, mesh }); scene.add(mesh);
  }
  for (const a of [-2.4, -1.0, 3.6]) {          // a few outcrops just beyond the clearing
    const x = KX + Math.cos(a) * 10.5, z = KZ + Math.sin(a) * 10.5; if (hAt(x, z) < .6) continue;
    const mesh = new THREE.Mesh(rockGeo, rockMat); mesh.castShadow = mesh.receiveShadow = true; mesh.rotation.set(a, a * 2, 1);
    rocks.push({ x, z, amount: ROCK_STONE, s0: 1.1, mesh }); scene.add(mesh);
  }
}

// ---------- ground clutter: grass tufts, pebbles, bushes (hidden on occupied or paved cells) ----------
const CL = [
  { geo: new THREE.DodecahedronGeometry(.16, 0).scale(1.3, .45, 1.3).translate(0, .03, 0), mat: new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1 }), n: 320, kind: 'tuft' },
  { geo: new THREE.DodecahedronGeometry(.13, 0), mat: new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true }), n: 160, kind: 'pebble' },
  { geo: new THREE.IcosahedronGeometry(.42, 0).translate(0, .25, 0), mat: new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true }), n: 90, kind: 'bush' },
];
CL.forEach(c => { if (c.kind === 'pebble') addGrit(c.mat, 'rock'); c.mesh = new THREE.InstancedMesh(c.geo, c.mat, c.n); c.mesh.receiveShadow = true; c.mesh.castShadow = true; scene.add(c.mesh); });
let clutter = [];
function genClutter() {
  clutter = [];
  const counts = CL.map(() => 0), col = new THREE.Color();
  CL.forEach((c, ci) => {
    let tries = 0;
    while (counts[ci] < c.n && tries++ < c.n * 6) {
      const x = Math.random() * SIZE, z = Math.random() * SIZE, h = hAt(x, z), sl = slopeAt(x, z);
      if (h < .5) continue;
      const dk = Math.hypot(x - KX, z - KZ);
      if (c.kind === 'bush' && dk < 7) continue;
      if (c.kind === 'tuft' && sl > 1.2) continue;
      if (c.kind === 'pebble' && Math.random() > .3 + sl) continue;
      // Dunewell's sand: few bushes and tufts past the oasis (Jack found it too bushy), and the tufts there dry
      const sand = MAP === 'dune' && oasisD(x, z) > .95;
      if (sand && ((c.kind === 'bush' && Math.random() > .1) || (c.kind === 'tuft' && Math.random() > .35))) continue;
      // the bonus stages: Scorched Meadow and the Blighted Isle few bushes, their tufts withered; Frozen Pass's tufts frosted
      const bx = bonusOn() && MAP !== 'pass';
      if (bx && c.kind === 'bush' && Math.random() > (MAP === 'meadow' ? .08 : .4)) continue;
      const reed = MAP === 'mere' && marshW(x / MK, z / MK) > .5;   // Meadowmere's marsh: reed tufts, few bushes
      if (reed && c.kind === 'bush' && Math.random() > .3) continue;
      const n = counts[ci]++;
      clutter.push({ ci, n, x, z, s: .7 + Math.random() * .7, rot: Math.random() * 6.28 });
      // Meadowmere: most tufts withered, like the sand's
      if (c.kind === 'tuft') { if (reed) col.setHSL(.13 + Math.random() * .03, .38, .3 + Math.random() * .08); else if (bonusOn() && MAP === 'pass') col.setHSL(.58, .08, .78 + Math.random() * .1); else if (sand || bx || (MAP === 'mere' && Math.random() < .65)) col.setHSL(.11 + Math.random() * .03, .32, .33 + Math.random() * .08); else col.setHSL(.21 + Math.random() * .05, .3 + Math.random() * .12, .2 + Math.random() * .07); }
      else if (c.kind === 'bush') col.setHSL(.24 + Math.random() * .05, .33, .15 + Math.random() * .08);
      else col.setHSL(.1, .06, .4 + Math.random() * .15);
      c.mesh.setColorAt(n, col);
    }
    c.mesh.count = counts[ci]; if (c.mesh.instanceColor) c.mesh.instanceColor.needsUpdate = true;
  });
}
function seatClutter() {
  for (const it of clutter) {
    // hidden when any part of it reaches an occupied, paved or bridge tile (a bush beside a base used to poke onto it)
    const c = CL[it.ci], R = (c.kind === 'bush' ? .62 : c.kind === 'tuft' ? .3 : .2) * it.s;
    const D = R * .72, busy = [[0, 0], [R, 0], [-R, 0], [0, R], [0, -R], [D, D], [D, -D], [-D, D], [-D, -D]].some(([dx, dz]) => { const cell = cellAt(it.x + dx, it.z + dz); return occB[cell] || road[cell] || bridgeCell[cell]; });
    const s = busy ? 1e-4 : it.s;
    dummy.position.set(it.x, hAt(it.x, it.z) - .03, it.z); dummy.rotation.set(0, it.rot, 0);
    dummy.scale.set(s, s * .8, s); dummy.updateMatrix();
    c.mesh.setMatrixAt(it.n, dummy.matrix);
  }
  CL.forEach(c => c.mesh.instanceMatrix.needsUpdate = true);
}
function seatRocks() {
  for (const r of rocks) { r.mesh.visible = r.amount > 0; const s = r.s0 * (.4 + .6 * r.amount / ROCK_STONE); r.mesh.scale.set(s, s * .8, s); r.mesh.position.set(r.x, hAt(r.x, r.z) - .1, r.z); }
}

// ---------- roads: packed-earth tracks with soft, slightly wavy edges and flat stones set in them ----------
// built from overlapping discs along each connection, so bends come out round and edges organic rather than square
const roadMatBase = new THREE.MeshStandardMaterial({ color: '#4e3f2a', roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const roadMatTop = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
const roadBase = new THREE.Mesh(new THREE.BufferGeometry(), roadMatBase), roadTop = new THREE.Mesh(new THREE.BufferGeometry(), roadMatTop);
roadBase.receiveShadow = roadTop.receiveShadow = true; scene.add(roadBase, roadTop);
const MAX_PSTONES = N_MAX * N_MAX * 24;
const pathStones = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.1, 1, 6), mat('#ffffff'), MAX_PSTONES);
addGrit(pathStones.material, 'rock'); pathStones.receiveShadow = pathStones.castShadow = true; pathStones.frustumCulled = false; scene.add(pathStones);   // r128 culls instances by the mesh origin
// sized up front: r128 sizes instanceColor from .count on the first setColorAt, and count starts at 0 here
pathStones.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PSTONES * 3), 3); pathStones.count = 0;
const DIRS = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
function roadMask(a, b) {
  let m = 0;
  for (const [da, db, bit] of DIRS) { const na = a + da, nb = b + db; if (na >= 0 && nb >= 0 && na < N && nb < N && road[nb * N + na]) m |= bit; }
  for (const B of buildings) { const d = B.door; if (d && d.a === a && d.b === b) m |= d.bit; }
  return m;
}
// path looks by map (sRGB): packed brown earth on the green maps; a pale chalky gravel track on Watchhill's dry hills;
// grey scree on Mountain pass; base = the darker worn edge, set = flat set stones, kerb = the edge stones
const PATH_STYLE = {
  earth:  { top: [.47, .38, .27], base: '#4e3f2a', set: [.37, .34, .29], kerb: [.4, .38, .33] },
  gravel: { top: [.68, .6, .45], base: '#8a7754', set: [.56, .52, .45], kerb: [.58, .54, .46] },
  scree:  { top: [.5, .48, .44], base: '#47443d', set: [.56, .55, .53], kerb: [.6, .59, .56] },
  sand:   { top: [.73, .6, .41], base: '#a98b5a', set: [.62, .55, .44], kerb: [.6, .53, .42], bare: true },   // trodden sand: a little darker than the dunes, no stones
};
const pathStyle = () => PATH_STYLE[MAP === 'watch' ? 'gravel' : MAP === 'pass' ? 'scree' : MAP === 'dune' || (MAP === 'meadow' && bonusOn()) ? 'sand' : 'earth'];
const lin = (sc, c, h, k) => sc.setRGB(((c[0] + k * h) ** 2.2), ((c[1] + k * .85 * h) ** 2.2), ((c[2] + k * .7 * h) ** 2.2));
// packed earth: smooth, low-contrast colour drift by position (no per-square checker), lighter where feet wear it
const pathTmp = new THREE.Color();
function pathCol(x, z, col) {
  const n = .5 + .25 * Math.sin(x * 2.3 + z * 1.1) + .25 * Math.sin(x * .9 - z * 2.7), j = hash(Math.round(x * 4), Math.round(z * 4));
  pathTmp.setRGB(...pathStyle().top).multiplyScalar(.88 + .16 * n + .06 * j);    // sRGB, converted below to match the patched colours
  col.push(pathTmp.r ** 2.2, pathTmp.g ** 2.2, pathTmp.b ** 2.2);
}
// the stone-based building whose footprint holds this point, if any; paths stop at its edge rather than painting over it
function stoneAt(x, z) { const B = occB[cellAt(x, z)]; return B && B.plinth && plinthTop(B.type, B.tier) != null ? B : null; }
function clampOut(x, z) {
  const B = stoneAt(x, z); if (!B) return [x, z];
  const e = B.ev, d = [x - e.x0, e.x1 - x, z - e.z0, e.z1 - z], m = Math.min(...d), k = .005;
  return m === d[0] ? [e.x0 - k, z] : m === d[1] ? [e.x1 + k, z] : m === d[2] ? [x, e.z0 - k] : [x, e.z1 + k];
}
function discInto(arr, cx, cz, r, lift, col, seg = 12) {
  const y = (x, z) => hAt(x, z) + lift;
  for (let k = 0; k < seg; k++) {
    const a0 = k / seg * 6.283, a1 = (k + 1) / seg * 6.283;
    const [x0, z0] = clampOut(cx + Math.cos(a0) * r, cz + Math.sin(a0) * r), [x1, z1] = clampOut(cx + Math.cos(a1) * r, cz + Math.sin(a1) * r);
    arr.push(cx, y(cx, cz), cz, x1, y(x1, z1), z1, x0, y(x0, z0), z0);
    if (col) { pathCol(cx, cz, col); pathCol(x1, z1, col); pathCol(x0, z0, col); }
  }
}
// a tile: a disc at the centre and a chain of discs out to each connected edge; radii wobble by position, so neighbours agree
function tileInto(arr, a, b, m, rad, wob, lift, col, stones, door, discs) {
  const cx = (a + .5) * CELL, cz = (b + .5) * CELL, e = CELL / 2;
  const pts = [[cx, cz]];
  // a door off the tile's centre line: the arm into the building runs straight at the door
  if (door) pts.push([cx + door.sx, cz + door.sz]);
  for (const [da, db, bit] of DIRS) if (m & bit) for (const t of [.34, .67, 1]) { const k = door && bit === door.bit; pts.push([cx + da * e * t + (k ? door.sx : 0), cz + db * e * t + (k ? door.sz : 0)]); }
  for (const [x, z] of pts) { const r = rad + wob * (hash(x * 3.1, z * 2.3) - .5); discInto(arr, x, z, r, lift, col); if (discs) discs.push([x, z, r]); }
  if (stones) for (const [x, z] of pts) if (hash(x * 1.7, z * 5.3) < .5 && !stoneAt(x + (hash(x, z * 3) - .5) * rad * 1.1, z + (hash(z * 2, x) - .5) * rad * 1.1)) stones.push([x + (hash(x, z * 3) - .5) * rad * 1.1, z + (hash(z * 2, x) - .5) * rad * 1.1, x * 7 + z * 3]);
}
function setGeo(mesh, arr, col) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  if (col) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); mesh.geometry.dispose(); mesh.geometry = g;
}
function rebuildRoads() {
  const PS = pathStyle(); roadMatBase.color.set(PS.base);
  const base = [], top = [], tc = [], stones = [], doors = {}, edge = [];
  for (const B of buildings) if (B.door && !B.dead) { const [sx, sz] = doorShift(B); if (sx || sz) doors[B.door.b * N + B.door.a] = { bit: B.door.bit, sx, sz }; }
  for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) if (road[b * N + a]) {
    if (stoneAt((a + .5) * CELL, (b + .5) * CELL)) continue;    // a gate's own tile: its stone floor is the path
    const m = roadMask(a, b), d = doors[b * N + a];
    tileInto(base, a, b, m, .5, .08, .05, null, null, d, edge); tileInto(top, a, b, m, .4, .1, .08, tc, stones, d);
  }
  setGeo(roadBase, base); setGeo(roadTop, top, tc);
  // kerb: small stones set along the track's outer edge, wherever a point on a disc's rim is outside every other disc
  const near = {}; for (const q of edge) { const k = cellAt(q[0], q[1]); (near[k] = near[k] || []).push(q); }
  const kerb = [];
  for (const [x, z, r] of edge) for (let i = 0; i < 14; i++) {
    const t = (i + hash(x * 2.1, z * 1.3)) / 14 * 6.283, px = x + Math.cos(t) * (r - .04), pz = z + Math.sin(t) * (r - .04);
    if (stoneAt(px, pz) || hash(px * 3.3, pz * 2.9) < .18) continue;   // a few gaps, so it reads as laid by hand
    let inside = false;
    const c = cellAt(px, pz), ca = c % N, cb = (c / N) | 0;
    for (let db = -1; db <= 1 && !inside; db++) for (let da = -1; da <= 1 && !inside; da++) {
      const L = near[(cb + db) * N + ca + da]; if (!L || ca + da < 0 || ca + da >= N) continue;
      for (const q of L) if (q[0] !== x || q[1] !== z) { if (Math.hypot(px - q[0], pz - q[1]) < q[2] - .07) { inside = true; break; } }
    }
    if (!inside && !kerb.some(k => Math.abs(k[0] - px) < .17 && Math.abs(k[1] - pz) < .17 && Math.hypot(k[0] - px, k[1] - pz) < .17)) kerb.push([px, pz]);
  }
  // flat set stones, a few per tile, grey-brown and half sunk into the earth
  const sc = new THREE.Color(); let n = 0;
  for (const [x, z, k] of PS.bare ? [] : stones) {
    if (n >= MAX_PSTONES) break;
    const r = .06 + .06 * hash(k, 1.3), h = hash(k, 7.7);
    dummy.position.set(x, hAt(x, z) + .1, z); dummy.rotation.set((h - .5) * .12, h * 6.3, (hash(k, 4.4) - .5) * .12); dummy.scale.set(r, .06, r * (.75 + .4 * h)); dummy.updateMatrix();
    pathStones.setMatrixAt(n, dummy.matrix);
    lin(sc, PS.set, h, .1); pathStones.setColorAt(n, sc); n++;
  }
  for (const [x, z] of PS.bare ? [] : kerb) {
    if (n >= MAX_PSTONES) break;
    const h = hash(x * 5.1, z * 3.7), r = .05 + .045 * h;
    dummy.position.set(x, hAt(x, z) + .07, z); dummy.rotation.set((h - .5) * .2, h * 6.3, (hash(z, x) - .5) * .2); dummy.scale.set(r, .09, r * (.8 + .4 * h)); dummy.updateMatrix();
    pathStones.setMatrixAt(n, dummy.matrix);
    lin(sc, PS.kerb, h, .12); pathStones.setColorAt(n, sc); n++;
  }
  pathStones.count = n; pathStones.instanceMatrix.needsUpdate = true; if (pathStones.instanceColor) pathStones.instanceColor.needsUpdate = true;
  seatClutter();
}
// each model's door, in its own frame (front = +z): x across the front, z just outside the door leaf, per tier
const DOOR = {
  house: [[0, .6], [0, .62], [0, .66]],
  lodge: [[-.65, .52], [-.65, .66], [-.65, .66]],
  quarry: [[-1, -.22], [-1, .03], [-1, .03]],
  castle: [[0, .5], [0, 2.75], [0, 2.51]],      // T1 the hall door; T2/T3 the gatehouse
  barracks: [[-1, .42], [-1, .42], [-1, .42]],
  mine: [[-.55, .55], [-.55, .55], [-.55, .55]],
  stables: [[-1, .4], [-1, .4], [-1, .4]],         // the armoury hut at the front left
  forester: [[-1.6, -1.66], [-1.6, -1.66], [-1.6, -1.66]],
  // towers and the ballista are reached from the back: tiers 1-2 (and every ballista) at the foot of a ladder, tier-3 towers at a door
  tower: [[0, -.92], [0, -.84], [0, -.8]], crossbow: [[0, -.86], [0, -.88], [0, -.68]], ballista: [[0, -1.1], [0, -1.15], [0, -1.22]],   // the hut at the back of the plot: log carriers cross the plot to it     // the adit: in through the timber (stone) portal in the face of the mound
};
// buildings the player can turn (walls and gates have their own E–W / N–S rotation); face 0 = +z, 1 = +x, 2 = -z, 3 = -x
const FACING = { market: 1, house: 1, lodge: 1, quarry: 1, barracks: 1, farm: 1, tower: 1, crossbow: 1, ballista: 1, castle: 1, well: 1, torch: 1, flowers: 1, statue: 1,
  mine: 1, stables: 1, forester: 1, farmhouse: 1, banner: 1, campfire: 1, butts: 1, stores: 1, rack: 1 };
const unrot = (f, x, z) => faceRot((4 - f) % 4, x, z);
const faceRot = (f, x, z) => { const a = f * Math.PI / 2, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a)); return [x * c + z * s, -x * s + z * c]; };
// the tile in front of the door when the building faces f, lined up with the door so villagers walk straight in
function doorCell(ev, type, f) {
  if (DEF[type] && DEF[type].back) f = (f + 2) % 4;                 // reached from behind: the tile at its back
  const lat = DOOR[type] ? DOOR[type][0][0] : ev.s === 2 ? -1 : 0, cx = (ev.x0 + ev.x1) / 2, cz = (ev.z0 + ev.z1) / 2;
  const [dx, dz] = faceRot(f, lat, 0), [nx, nz] = faceRot(f, 0, (f % 2 ? ev.s : ev.sz || ev.s) * CELL / 2 + CELL / 2);
  return { a: Math.floor((cx + dx + nx) / CELL), b: Math.floor((cz + dz + nz) / CELL), bit: [1, 8, 4, 2][f], f };
}
// someone has to be able to stand in front of the door
// and the door must not face the map's edge (a door facing the edge sent villagers out over it): the tile in front of the door and
// the one beyond it, the way the door faces, are both on the map; a door along the edge (facing sideways) is fine (Jack)
const inMap = (a, b) => a >= 0 && b >= 0 && a < N && b < N;
const doorOk = d => { const [fx, fz] = faceRot(d.f, 0, 1); return inMap(d.a, d.b) && inMap(d.a + fx, d.b + fz) && cellPass(d.b * N + d.a, 1); };
function syncTerrain() {
  for (let k = 0; k < V * V; k++) tPos[k * 3 + 1] = H[k];
  tGeo.attributes.position.needsUpdate = true; cacheCells(); syncWaterTex(); buildEdges();
  recolor(); tGeo.attributes.color.needsUpdate = true; tGeo.computeBoundingSphere();
  tGeo.computeVertexNormals();   // the shadow lookup reads normals even with no normal bias; without them the ground received no shadows
  gIdx.forEach((k, n) => { gPos[n * 3 + 1] = H[k] + .06; }); gGeo.attributes.position.needsUpdate = true;
  seatTrees(); seatRocks(); rebuildRoads();
}

