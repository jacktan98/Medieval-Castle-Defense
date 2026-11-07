// ---------- ghosts + outlines ----------
const ghostMat = new THREE.MeshBasicMaterial({ color: '#8cc46e', transparent: true, opacity: .45, depthWrite: false, toneMapped: false });
const ghosts = {};
let placeRot = 0;                         // rotation for the next wall or gate: 0 = E–W, 1 = N–S
var placeFace = 0;                        // which way the next building faces (FACING); var: evaluate runs during the startup reset
function makeGhost(t) {
  if (ghosts[t]) scene.remove(ghosts[t]);
  const g = MODELS[t](1, false, 0, placeRot); g.traverse(o => { if (o.isMesh) { o.material = ghostMat; o.castShadow = false; } });
  g.visible = false; scene.add(g); ghosts[t] = g;
}
function makeLine(color, opacity) {
  const l = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false, toneMapped: false }));
  l.renderOrder = 10; l.visible = false; scene.add(l); return l;
}
const boostDisc = makeDisc('#8fc1db'), selDisc = makeDisc('#8fc1db');
const rangeLine = makeLine('#8fc1db', .85), footLine = makeLine('#8cc46e', 1), ringLine = makeLine('#d4a84e', .7), reachLine = makeLine('#8fc1db', .8), selLine = makeLine('#f2c95e', 1);
function setLine(line, pts) { line.geometry.dispose(); line.geometry = new THREE.BufferGeometry().setFromPoints(pts); line.visible = true; }
function drape(line, x0, z0, x1, z1) {
  const pts = [], edge = (ax, az, bx, bz) => {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / .5));
    for (let s = 0; s < n; s++) { const x = lerp(ax, bx, s / n), z = lerp(az, bz, s / n); pts.push(new THREE.Vector3(x, hAt(x, z) + .1, z)); }
  };
  edge(x0, z0, x1, z0); edge(x1, z0, x1, z1); edge(x1, z1, x0, z1); edge(x0, z1, x0, z0); pts.push(pts[0].clone());
  setLine(line, pts);
}
function drapeCircle(line, cx, cz, r) {
  const pts = [];
  for (let n = 0; n <= 96; n++) { const a = n / 96 * Math.PI * 2, x = clamp(cx + Math.cos(a) * r, 0, SIZE), z = clamp(cz + Math.sin(a) * r, 0, SIZE); pts.push(new THREE.Vector3(x, Math.max(hAt(x, z), 0) + .15, z)); }
  setLine(line, pts);
}
// a soft filled disc draped over the ground: where a decor's boost reaches (a thin ring alone was hard to see on a phone)
function makeDisc(col) {
  const DISC_RINGS = 8, DISC_SEG = 64, g = new THREE.BufferGeometry(), pos = new Float32Array((DISC_RINGS * DISC_SEG + 1) * 3), idx = [];
  for (let s = 0; s < DISC_SEG; s++) idx.push(0, 1 + s, 1 + (s + 1) % DISC_SEG);
  for (let r = 1; r < DISC_RINGS; r++) for (let s = 0; s < DISC_SEG; s++) {
    const a = 1 + (r - 1) * DISC_SEG + s, b = 1 + (r - 1) * DISC_SEG + (s + 1) % DISC_SEG, c = a + DISC_SEG, d = b + DISC_SEG; idx.push(a, c, b, b, c, d);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .2, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  m.visible = false; m.renderOrder = 2; m.frustumCulled = false; scene.add(m); return m;
}
function drapeDisc(m, cx, cz, r) {
  const DISC_RINGS = 8, DISC_SEG = 64, p = m.geometry.attributes.position.array, put = (i, x, z) => { x = clamp(x, 0, SIZE); z = clamp(z, 0, SIZE); p[i * 3] = x; p[i * 3 + 1] = Math.max(hAt(x, z), 0) + .1; p[i * 3 + 2] = z; };
  put(0, cx, cz);
  for (let r0 = 1; r0 <= DISC_RINGS; r0++) for (let s = 0; s < DISC_SEG; s++) { const a = s / DISC_SEG * Math.PI * 2, rr = r * r0 / DISC_RINGS; put(1 + (r0 - 1) * DISC_SEG + s, cx + Math.cos(a) * rr, cz + Math.sin(a) * rr); }
  m.geometry.attributes.position.needsUpdate = true; m.geometry.computeBoundingSphere(); m.visible = true;
}

// ---------- sprites: health bars + floating text ----------
function makeBar(w) {
  const mk = c => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: c, depthTest: false, transparent: true, toneMapped: false })); s.renderOrder = 20; return s; };
  const bg = mk('#1a1410'), fg = mk('#8cc46e');
  bg.scale.set(w, .14, 1); fg.scale.set(w, .09, 1);
  const grp = new THREE.Group(); grp.add(bg, fg); grp.visible = false; scene.add(grp);
  return { grp, fg, w, set(f) { f = clamp(f, .001, 1); fg.scale.x = w * f; fg.center.x = .5 / f; fg.material.color.setHSL(.3 * f, .55, .5); } };
}
const texCache = {};
function textTex(s, color) {
  const key = s + color; if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.font = 'bold 38px "Alegreya Sans", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 7; x.strokeStyle = 'rgba(0,0,0,.75)'; x.strokeText(s, 128, 32); x.fillStyle = color; x.fillText(s, 128, 32);
  const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; return texCache[key] = tx;
}
const floats = [];
const ICON_IMG = {};
for (const k of ['gold', 'food', 'wood', 'stone']) { const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ICON[k].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); ICON_IMG[k] = im; }
function resTex(kind, n) {
  const key = 'res:' + kind + n; if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.font = 'bold 40px "Alegreya Sans", system-ui, sans-serif'; x.textAlign = 'right'; x.textBaseline = 'middle';
  // n a number: "+n" in the resource's colour; a string (e.g. "−50%", Meadowmere's poor fields): as given, in red
  const neg = typeof n === 'string', col = neg ? '#ff6a55' : { gold: '#f2c95e', food: '#e6cf74', wood: '#d9a46a', stone: '#c9c6bd' }[kind] || '#e6cf74', s = neg ? n : '+' + n;
  x.lineWidth = 7; x.strokeStyle = 'rgba(0,0,0,.75)'; x.strokeText(s, 136, 33); x.fillStyle = col; x.fillText(s, 136, 33);
  const im = ICON_IMG[kind];
  if (im.complete && im.naturalWidth) { x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = 6; x.drawImage(im, 144, 8, 48, 48); }
  else { x.fillStyle = col; x.beginPath(); x.arc(168, 32, 20, 0, 7); x.fill(); }
  const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding;
  if (im.complete && im.naturalWidth) texCache[key] = tx;
  return tx;
}
// life: seconds it lasts (fading all the way) and rises at .9 m/s; a long one (life > 2) rises slowly and holds before it fades
function floatRes(kind, n, x, y, z, life = 1.8) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resTex(kind, n), depthTest: false, transparent: true, toneMapped: false }));
  sp.scale.set(2.6, .65, 1); sp.position.set(x, y, z); sp.renderOrder = 30; scene.add(sp); floats.push({ sp, t: 0, life }); return sp;
}
function floatText(s, color, x, y, z) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex(s, color), depthTest: false, transparent: true, toneMapped: false }));
  sp.scale.set(2.6, .65, 1); sp.position.set(x, y, z); sp.renderOrder = 30; scene.add(sp); floats.push({ sp, t: 0 });
}

// ---------- night lights: a fixed pool of warm point lights moved to the torches and posts nearest the camera ----------
const LAMPS = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight('#ffae5a', 0, 11, 2); scene.add(l); return l; });
let lampT = 0, lampSpots = [];
function updateLamps(dt, now) {
  const dark = 1 - light;
  if ((lampT -= dt) <= 0) {
    lampT = .5; lampSpots = [];
    if (dark > .05) for (const B of buildings) {
      if (!B.built) continue; const c = center(B), y = B.group.position.y;
      if (B.type === 'torch') lampSpots.push({ x: c.x, y: y + 2.3, z: c.z, k: 1 });
      else if (B.type === 'campfire') lampSpots.push({ x: c.x, y: y + .7, z: c.z, k: 1.1 });
      else if (B.type === 'castle') lampSpots.push({ x: c.x, y: y + 2.4, z: B.ev.z1 + .4, k: 1.2 });
      else if (B.type === 'tower' && B.manned && B.manned.some(Boolean)) lampSpots.push({ x: c.x, y: y + DEF.tower.shootY[B.tier - 1] + .6, z: c.z, k: .8 });
      // crossbow towers and ballistas light up like the archer towers once manned (they were missed)
      else if (B.type === 'crossbow' && B.manned && B.manned.some(Boolean)) lampSpots.push({ x: c.x, y: y + DEF.crossbow.shootY[B.tier - 1] + .6, z: c.z, k: .8 });
      else if (B.type === 'ballista' && B.manned && B.manned.some(Boolean)) lampSpots.push({ x: c.x, y: y + BALLISTA_DECK[B.tier - 1] + .9, z: c.z, k: .8 });
      else if (B.type === 'mine' && UPK.lanterns) lampSpots.push({ x: B.ev.x0 + (B.ev.x1 - B.ev.x0) / 2, y: y + 1, z: c.z, k: .7 });
      else if (B.type === 'house' && B.tier > 1) lampSpots.push({ x: c.x, y: y + 1, z: B.ev.z1 + .3, k: .5 });
    }
    if (dark > .05) for (const F of sceneFires) lampSpots.push({ x: F.x, y: F.y + .4, z: F.z, k: F.k });
    // the 4 nearest the camera's aim; on the title's showcase the nearest the town's middle (showC), as its circling camera aims past
    // the town and the lights jumped from the castle to other torches half a second in (Jack saw the castle's light change)
    const ref = showcaseBuilt ? showC : target;
    lampSpots.sort((a, b) => Math.hypot(a.x - ref.x, a.z - ref.z) - Math.hypot(b.x - ref.x, b.z - ref.z));
  }
  LAMPS.forEach((l, n) => {
    const sp = lampSpots[n];
    if (!sp) { l.intensity = 0; return; }
    l.position.set(sp.x, sp.y, sp.z);
    l.intensity = dark * 2.2 * sp.k * (.85 + .15 * Math.sin(now * .017 + n * 2) * Math.sin(now * .011 + n));
  });
}

// ---------- birds: now and then a small flock crosses the sky by day ----------
const birdMat = mat('#2b2824'), birds = [];
let flockT = 25;
function makeBird() {
  const g = new THREE.Group();
  g.add(box(.09, .07, .32, birdMat, 0, 0, 0));
  const wings = [-1, 1].map(sx => { const w = new THREE.Group(); w.position.x = sx * .04; const m = box(.42, .025, .16, birdMat, sx * .21, 0, -.02); w.add(m); g.add(w); return w; });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.scale.setScalar(.55); scene.add(g);
  return { g, wings, ph: Math.random() * 6 };
}
function updateBirds(dt) {
  if ((flockT -= dt) <= 0 && light > .6) {
    flockT = 45 + Math.random() * 50;
    const a = Math.random() * 6.283, dir = { x: Math.cos(a), z: Math.sin(a) }, n = 3 + Math.floor(Math.random() * 4);
    const sx = SIZE / 2 - dir.x * 50 + (Math.random() - .5) * 30, sz = SIZE / 2 - dir.z * 50 + (Math.random() - .5) * 30, h = 13 + Math.random() * 7;
    // about half the flocks wheel round a spot over the town a time or two before flying on
    const orbit = Math.random() < .5 ? { cx: SIZE / 2 + (Math.random() - .5) * 24, cz: SIZE / 2 + (Math.random() - .5) * 24, r: 9 + Math.random() * 6, sign: Math.random() < .5 ? 1 : -1, loops: 1 + Math.random() * .8 } : null;
    if (orbit) { const tx = orbit.cx - sx, tz = orbit.cz - sz, d = Math.hypot(tx, tz); dir.x = tx / d; dir.z = tz / d; }
    for (let i = 0; i < n; i++) {
      const b = makeBird(), row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;      // loose V formation
      b.x = sx - dir.x * row * 1.1 + -dir.z * side * row * .9; b.z = sz - dir.z * row * 1.1 + dir.x * side * row * .9; b.y = h + (Math.random() - .5) * .6;
      b.dx = dir.x; b.dz = dir.z; b.v = 5.5 + Math.random() * .6; b.life = 0; b.orbit = orbit; b.mode = orbit ? 'in' : 'out'; b.rr = orbit ? orbit.r + side * row * .5 : 0;
      birds.push(b);
    }
  }
  for (let i = birds.length - 1; i >= 0; i--) {
    const b = birds[i]; b.life += dt; b.ph += dt;
    const glide = b.mode === 'orbit' ? Math.sin(b.ph * .9) > .1 : Math.sin(b.ph * .7) > .55, flap = glide ? .15 : Math.sin(b.ph * 13) * .7;
    b.wings[0].rotation.z = flap; b.wings[1].rotation.z = -flap;
    const O = b.orbit;
    if (b.mode === 'in' && Math.hypot(b.x - O.cx, b.z - O.cz) <= b.rr) { b.mode = 'orbit'; b.ang = Math.atan2(b.z - O.cz, b.x - O.cx); b.left = O.loops * Math.PI * 2 * b.rr / b.v; }
    if (b.mode === 'orbit') {
      const w = O.sign * b.v / b.rr; b.ang += w * dt;
      b.x = O.cx + Math.cos(b.ang) * b.rr; b.z = O.cz + Math.sin(b.ang) * b.rr;
      b.dx = -Math.sin(b.ang) * O.sign; b.dz = Math.cos(b.ang) * O.sign;
      b.g.rotation.z = -O.sign * .35;
      if ((b.left -= dt) <= 0) b.mode = 'out';
    } else { b.x += b.dx * b.v * dt; b.z += b.dz * b.v * dt; b.g.rotation.z *= .95; }
    b.y += Math.sin(b.ph * 1.3) * .2 * dt;
    b.g.position.set(b.x, b.y, b.z); b.g.rotation.y = Math.atan2(b.dx, b.dz);
    if (b.life > 50) { scene.remove(b.g); birds.splice(i, 1); }
  }
}

// ---------- chimney smoke ----------
const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const puffs = [];
const CHIMNEY = { house: [[.4, 2.27, -.22], [.45, 1.72, -.25], [.45, 2.45, -.3]], lodge: [null, null, [1.05, 3.05, -.45]] };
const emberTex = smokeTex;
function emitSmoke(dt) {
  for (const F of sceneFires) {   // the scenery's fires: embers, and dark smoke off a burning ruin
    if ((F.emberT = (F.emberT || Math.random()) - dt) <= 0 && puffs.length < 140) {
      F.emberT = (.15 + Math.random() * .35) / (F.smoke ? 1.5 : 1);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTex, color: '#ffa040', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      sp.position.set(F.x + (Math.random() - .5) * .3, F.y, F.z + (Math.random() - .5) * .3); sp.scale.setScalar(.08);
      scene.add(sp); puffs.push({ sp, t: 0, life: .8 + Math.random() * .9, dx: (Math.random() - .5) * .35, ember: true });
    }
    if (F.smoke && (F.smokeT = (F.smokeT || Math.random()) - dt) <= 0 && puffs.length < 140) {
      F.smokeT = .35 + Math.random() * .4;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: '#3b3632', transparent: true, depthWrite: false, opacity: 0 }));
      sp.position.set(F.x, F.y + .5, F.z); sp.scale.setScalar(.5); scene.add(sp); puffs.push({ sp, t: 0, life: 3.5 + Math.random() * 1.5, dx: (Math.random() - .5) * .3 });
    }
  }
  for (const B of buildings) {
    if ((B.type === 'torch' || B.type === 'campfire') && B.built && (B.emberT = (B.emberT || Math.random()) - dt) <= 0 && puffs.length < 140) {   // embers lift off the fire
      B.emberT = .15 + Math.random() * .35; const fy = B.type === 'torch' ? 2.25 : .45;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTex, color: '#ffa040', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      sp.position.set(B.group.position.x + (Math.random() - .5) * .12, B.group.position.y + fy, B.group.position.z + (Math.random() - .5) * .12); sp.scale.setScalar(.07);
      scene.add(sp); puffs.push({ sp, t: 0, life: .8 + Math.random() * .7, dx: (Math.random() - .5) * .35, ember: true });
    }
    const ch = CHIMNEY[B.type] && CHIMNEY[B.type][B.tier - 1]; if (!ch || B.rise || (B.type === 'house' && !UPK.chimney)) continue;
    if ((B.smokeT = (B.smokeT || Math.random()) - dt) > 0) continue;
    B.smokeT = .5 + Math.random() * .5;
    if (puffs.length > 140) continue;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: '#8d8a84', transparent: true, depthWrite: false, opacity: 0 }));
    const [cx, cz] = faceRot(B.face || 0, ch[0], ch[2]);
    sp.position.set(B.group.position.x + cx, B.group.position.y + ch[1], B.group.position.z + cz); sp.scale.setScalar(.3);
    scene.add(sp); puffs.push({ sp, t: 0, life: 3 + Math.random() * 1.5, dx: (Math.random() - .3) * .25 });
  }
  for (let n = puffs.length - 1; n >= 0; n--) {
    const p = puffs[n]; p.t += dt; const f = p.t / p.life;
    if (p.spray) {                                         // river spray: a thin mist that rises a little and drifts with the current
      p.sp.position.x += p.vx * dt; p.sp.position.z += p.vz * dt; p.sp.position.y += dt * .12;
      p.sp.scale.setScalar(.35 + f * 1.1); p.sp.material.opacity = Math.min(1, f * 5) * (1 - f) * .5 * (.3 + .7 * light);
    } else if (p.ember) { p.sp.position.y += dt * 1.1; p.sp.position.x += p.dx * dt + Math.sin(p.t * 9 + p.dx * 40) * .004; p.sp.scale.setScalar(.07 * (1 - f * .7)); p.sp.material.opacity = 1 - f; }
    else {
      p.sp.position.y += dt * (p.dust ? .3 : .55); p.sp.position.x += p.dx * dt; p.sp.scale.setScalar((p.dust ? .25 + f * .8 : .3 + f * 1.3) * (p.k || 1));
      p.sp.material.opacity = Math.min(1, f * 6) * (1 - f) * (p.dust ? .55 : .45);
    }
    if (f >= 1) { scene.remove(p.sp); p.sp.material.dispose(); puffs.splice(n, 1); }
  }
}


// ---------- weather by stage (Jack): rain, drizzle, snow, falling ash, blowing sand and dust, mist; only the look changes, never
// the game. It comes and goes on a timer (`on`/`off` seconds, ranges), or stays all game (`always`); `w` eases to its target.
// Particles live in a box that follows the camera's focus (wrapped round it, so panning never drags them along) and only `n × w`
// are drawn; the light dims (`dark`), the sky and fog turn toward a tint and the fog closes in (`fogK`). Off on the title's
// showcase and in the gallery.
const WEATHER = {
  meadow: { kind: 'rain', on: [45, 80], off: [90, 160], first: [60, 140] },
  bridge: { kind: 'rain', on: [50, 90], off: [60, 110], first: [25, 60] },
  bend: { kind: 'rain', on: [50, 90], off: [60, 110], first: [25, 60] },
  watch: { kind: 'dust', on: [40, 70], off: [50, 90], first: [20, 50] },
  dune: { kind: 'sand', on: [45, 80], off: [50, 90], first: [20, 50] },
  crag: { kind: 'mist', on: [70, 120], off: [50, 90], first: [0, 0] },
  ford: { kind: 'drizzle', on: [50, 90], off: [50, 100], first: [20, 60] },
  mere: { kind: 'drizzle', on: [60, 110], off: [40, 80], first: [0, 20] },
  keep: { kind: 'ash', always: true },
  hold: { kind: 'snow', always: true },
  pass: { kind: 'snow', always: true },
  // the bonus stages: hot dust over the Scorched Meadow, damp drizzle over the Blighted Isle (Frozen Pass keeps its snow)
  meadowX: { kind: 'dust', on: [50, 90], off: [40, 80], first: [10, 40] },
  isleX: { kind: 'drizzle', on: [60, 110], off: [40, 80], first: [0, 20] },
};
const WX_KIND = {
  rain: { lines: true, n: 2400, fall: 15, len: .9, wind: 1.6, col: '#c3d0dc', op: .6, dark: .38, fogK: .35, tint: '#8d96a0', tintK: .55 },
  drizzle: { lines: true, n: 1500, fall: 9, len: .55, wind: .8, col: '#c6d0d8', op: .45, dark: .2, fogK: .55, tint: '#a3aab0', tintK: .45 },
  snow: { n: 2000, fall: 1.1, wind: .5, sway: .6, size: .55, col: '#ffffff', op: .9, dark: .12, fogK: .45, tint: '#cfd6de', tintK: .45 },
  ash: { n: 1500, fall: .55, wind: .4, sway: .4, size: .38, col: '#c4bcb4', ember: '#ff8a3a', op: .85, dark: .1, fogK: .35, tint: '#7a6a62', tintK: .35 },
  sand: { n: 2000, fall: .35, wind: 9, sway: .3, size: .22, col: '#f4e6bf', op: .8, dark: .12, fogK: .75, tint: '#cfb688', tintK: .6 },
  dust: { n: 1100, fall: .3, wind: 5, sway: .3, size: .2, col: '#f2e6c8', op: .65, dark: .06, fogK: .45, tint: '#cdb990', tintK: .4 },
  mist: { n: 0, dark: .1, fogK: 1, tint: '#d4d8da', tintK: .75 },
};
const WX_MAX = 2400, wxPos = new Float32Array(WX_MAX * 3), wxVel = new Float32Array(WX_MAX * 2);
const wxLineGeo = new THREE.BufferGeometry(); wxLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WX_MAX * 6), 3));
const wxPtGeo = new THREE.BufferGeometry(); wxPtGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WX_MAX * 3), 3)); wxPtGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(WX_MAX * 3), 3));
const wxDot = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
const wxLines = new THREE.LineSegments(wxLineGeo, new THREE.LineBasicMaterial({ color: '#aebccb', transparent: true, opacity: .4, depthWrite: false }));
const wxPts = new THREE.Points(wxPtGeo, new THREE.PointsMaterial({ size: .12, map: wxDot, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true }));
wxLines.frustumCulled = wxPts.frustumCulled = false; wxLines.visible = wxPts.visible = false; wxLines.renderOrder = wxPts.renderOrder = 5;
scene.add(wxLines, wxPts);
const WX = { cfg: null, K: null, w: 0, goal: 0, timer: 0 };
const wxTint = new THREE.Color(), wxRnd = ([a, b]) => a + Math.random() * (b - a);
// force: the title's showcase picks its own weather (a kind, or null for clear), held all the while
function weatherReset(force) {
  const cfg = force !== undefined ? (force ? { kind: force, always: true } : null) : (bonusOn() && WEATHER[MAP + 'X']) || WEATHER[MAP] || null; WX.cfg = cfg; WX.K = cfg && WX_KIND[cfg.kind]; WX.w = 0;
  WX.goal = cfg && cfg.always ? 1 : 0; WX.timer = cfg && !cfg.always ? wxRnd(cfg.first) : 0;
  if (cfg && cfg.always) WX.w = 1;
  if (!WX.K) { wxLines.visible = wxPts.visible = false; return; }
  const K = WX.K, col = new THREE.Color(K.col), emb = K.ember && new THREE.Color(K.ember), ca = wxPtGeo.attributes.color.array;
  for (let i = 0; i < WX_MAX; i++) {
    wxPos[i * 3] = Math.random() * SIZE; wxPos[i * 3 + 1] = Math.random() * 24; wxPos[i * 3 + 2] = Math.random() * SIZE;
    wxVel[i * 2] = .7 + Math.random() * .6; wxVel[i * 2 + 1] = Math.random() * 6.28;
    const c = emb && Math.random() < .2 ? emb : col; ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b;
  }
  wxPtGeo.attributes.color.needsUpdate = true;
  wxLines.material.color.set(K.col || '#ffffff'); wxPts.material.size = K.size || .1;
}
// the sky and fog colour lean toward the weather's tint (called from updateLight before the fog copies the sky)
function weatherSky(c) { if (WX.K && WX.w > 0) c.lerp(wxTint.set(WX.K.tint).multiplyScalar(.35 + .65 * light), WX.K.tintK * WX.w); }
function updateWeather(dt, live) {
  const K = WX.K, off = !K;
  if (off) { wxLines.visible = wxPts.visible = false; return; }
  if (live && !WX.cfg.always && (WX.timer -= dt) <= 0) { WX.goal = WX.goal ? 0 : 1; WX.timer = wxRnd(WX.goal ? WX.cfg.on : WX.cfg.off); }
  if (live) WX.w += (WX.goal - WX.w) * Math.min(1, dt * .12);
  const w = WX.w;
  // light and fog: on top of updateLight's (which sets them fresh every frame) and updateCam's fog distances
  sun.intensity *= 1 - K.dark * w; hemi.intensity *= 1 - K.dark * .5 * w;
  // the fog closes in toward the camera: with fogK 1 (mist) it starts about half way to the focus and is thick a little past it
  const fk = K.fogK * w; scene.fog.near = lerp(dist + 100, dist * .55, fk); scene.fog.far = lerp(dist + 240, dist + 60, fk);
  const n = Math.round((K.n || 0) * w * (gfxLow ? .35 : 1));
  wxLines.visible = !!K.lines && n > 0; wxPts.visible = !K.lines && n > 0;
  if (!n) return;
  // spread over the whole map (Jack: a box round the camera showed as a box or a line from above), wrapped at its edges
  const top = 26, wrap = v => ((v % SIZE) + SIZE) % SIZE, t = performance.now() / 1000;
  const sdt = live || showcaseBuilt ? Math.min(dt, .05) : 0, night = .45 + .55 * light;
  if (K.lines) {
    const a = wxLineGeo.attributes.position.array, dx = K.wind / K.fall * K.len;
    for (let i = 0; i < n; i++) {
      let y = wxPos[i * 3 + 1] - K.fall * wxVel[i * 2] * sdt; if (y < 0) y += top; wxPos[i * 3 + 1] = y;
      wxPos[i * 3] += K.wind * sdt; const x = wrap(wxPos[i * 3]), z = wrap(wxPos[i * 3 + 2]); wxPos[i * 3] = x; wxPos[i * 3 + 2] = z;
      const yy = hAt(x, z) + y, j = i * 6; a[j] = x; a[j + 1] = yy; a[j + 2] = z; a[j + 3] = x - dx; a[j + 4] = yy - K.len; a[j + 5] = z;
    }
    wxLineGeo.attributes.position.needsUpdate = true; wxLineGeo.setDrawRange(0, n * 2); wxLines.material.opacity = K.op * night * Math.min(1, w * 1.5);
  } else {
    const a = wxPtGeo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      let y = wxPos[i * 3 + 1] - K.fall * wxVel[i * 2] * sdt; if (y < 0) y += top; wxPos[i * 3 + 1] = y;
      const ph = wxVel[i * 2 + 1];
      wxPos[i * 3] += (K.wind * wxVel[i * 2] + Math.sin(t * 1.3 + ph) * K.sway) * sdt; wxPos[i * 3 + 2] += Math.cos(t * 1.1 + ph) * K.sway * sdt;
      const x = wrap(wxPos[i * 3]), z = wrap(wxPos[i * 3 + 2]); wxPos[i * 3] = x; wxPos[i * 3 + 2] = z;
      // blown sand and dust stay low over the ground; snow and ash fill the air
      const yy = hAt(x, z) + (K.wind > 4 ? y % 6 : y);
      a[i * 3] = x; a[i * 3 + 1] = yy; a[i * 3 + 2] = z;
    }
    wxPtGeo.attributes.position.needsUpdate = true; wxPtGeo.setDrawRange(0, n); wxPts.material.opacity = K.op * night * Math.min(1, w * 1.5);
  }
}
