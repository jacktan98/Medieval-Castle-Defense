// ---------- state ----------
let adapt = true, tool = 'select', cat = 'eco', cur = null, selected = null, gameOver = false;
const anims = [], buildings = [], villagers = [], enemies = [], arrows = [];
const res = { gold: 0, wood: 0, stone: 0, food: 0 };
let stats = { slain: 0, lost: 0, fallen: 0, gold: 0, wood: 0, stone: 0, food: 0, built: 0, upgrades: 0, made: {}, lostB: 0, felled: 0, mined: 0, boostKills: {}, t0: 0 };
let PH = { kind: 'day', wave: 1, t: DAYLEN[0] }, econT = TICK, spawnQueue = [], spawnT = 0, light = 1, nextId = 1;
const canAfford = c => RES_KEYS.every(k => (res[k] || 0) >= (c[k] || 0));
const shortfall = c => RES_KEYS.filter(k => (c[k] || 0) > res[k]).map(k => `${c[k] - Math.floor(res[k])} more ${k}`).join(', ');
function pay(c) { RES_KEYS.forEach(k => res[k] -= (c[k] || 0)); }
function log(html, cls) {
  const li = document.createElement('li'); li.innerHTML = html; if (cls) li.className = cls;
  const ol = $('#log'); ol.prepend(li); while (ol.children.length > 10) ol.lastChild.remove();
}

// ---------- placement ----------
function countRes(type, cx, cz) {
  const R = DEF[type].reach;
  if (type === 'lodge') return trees.filter(t => !t.dead && Math.hypot(t.x - cx, t.z - cz) < R).length;
  if (type === 'quarry') return rocks.filter(r => r.amount > 0 && Math.hypot(r.x - cx, r.z - cz) < R).length;
  return 0;
}
// a building's footprint in cells, x by z, when it faces f: the forester (2 wide, 3 deep) turned sideways is 3 by 2 (Jack)
const dimsFor = (type, f) => { const T = DEF[type], s = T.size, sz = T.dz || s; return T.turnDims && f % 2 ? [sz, s] : [s, sz]; };
function evaluate(type, ci, cj, free) {
  const T = DEF[type], [s, sz] = dimsFor(type, placeFace), x0 = ci * CELL, z0 = cj * CELL, x1 = x0 + s * CELL, z1 = z0 + sz * CELL;
  const r = { type, ci, cj, s, sz, x0, z0, x1, z1, ok: true, reason: '' };
  if (ci < 0 || cj < 0 || ci + s > N || cj + sz > N) return { ...r, ok: false, reason: 'Off the map' };
  for (let b = cj; b < cj + sz; b++) for (let a = ci; a < ci + s; a++) if (sceneryAt((a + .5) * CELL, (b + .5) * CELL)) return { ...r, ok: false, reason: 'Occupied' };
  if (MAP === 'pass' || MAP === 'vale' || MAP === 'hold') for (let b = cj; b < cj + sz; b++) for (let a = ci; a < ci + s; a++) if (!mapOpen((a + .5) * CELL, (b + .5) * CELL)) return { ...r, ok: false, reason: 'Too steep' };
  for (let b = cj; b < cj + sz; b++) for (let a = ci; a < ci + s; a++) { if (occB[b * N + a]) return { ...r, ok: false, reason: 'Occupied' }; if (bridgeCell[b * N + a]) return { ...r, ok: false, reason: 'Bridge' }; }
  // solid buildings can't sit on another building's door cell, or villagers coming out get trapped there
  if (!WALK[type] && type !== 'gate' && buildings.some(B => !B.dead && B.door && B.door.a >= ci && B.door.a < ci + s && B.door.b >= cj && B.door.b < cj + sz))
    return { ...r, ok: false, reason: type === 'wall' ? 'Blocks a door · use a gate' : 'Blocks a door' };
  // rocks stay: building over one would bury stone the masons can't mine any more
  if (rocks.some(q => q.amount > 0 && q.x > x0 - .5 && q.x < x1 + .5 && q.z > z0 - .5 && q.z < z1 + .5)) return { ...r, ok: false, reason: 'Rocks' };
  if (MAP === 'watch' && WATCH_RUIN[0] > x0 - 1.3 && WATCH_RUIN[0] < x1 + 1.3 && WATCH_RUIN[1] > z0 - 1.3 && WATCH_RUIN[1] < z1 + 1.3) return { ...r, ok: false, reason: 'Ruin' };
  let mn = 1e9, mx = -1e9, sum = 0, n = 0;
  for (let j = z0; j <= z1; j++) for (let i = x0; i <= x1; i++) { const h = H[idx(i, j)]; mn = Math.min(mn, h); mx = Math.max(mx, h); sum += h; n++; }
  r.dh = mx - mn; r.target = sum / n; r.center = hAt((x0 + x1) / 2, (z0 + z1) / 2);
  if (mn < .5) return { ...r, ok: false, reason: 'Too wet' };
  if (adapt && r.dh > T.maxdh) return { ...r, ok: false, reason: 'Too steep' };
  if (T.reach) {
    r.resCount = countRes(type, (x0 + x1) / 2, (z0 + z1) / 2);
    if (type === 'lodge' && r.resCount < 3) return { ...r, ok: false, reason: 'No forest nearby' };
    if (type === 'quarry' && r.resCount < 1) return { ...r, ok: false, reason: 'No rock nearby' };
  }
  // smart rotate: keep the player's facing if its door tile is open, else the nearest turn whose door is
  r.face = FACING[type] ? placeFace : 0;
  const faces = T.noRoad ? [r.face] : (FACING[type] ? [0, 3, 1, 2] : [0]).map(k => (placeFace + k) % 4).filter(f => (!T.faces || T.faces.includes(f)) && (!T.turnDims || f % 2 === placeFace % 2) && doorOk(doorCell(r, type, f)));
  if (!faces.length) return { ...r, ok: false, reason: 'Door blocked' };
  // and nobody may end up sealed in: the first of those turns that keeps every door, site and tower joined to the castle
  let cut = '';
  for (const f of faces) { cut = cutsOff(r, type, f); if (!cut) { r.face = f; break; } }
  if (cut) return { ...r, ok: false, reason: type === 'wall' && cut === 'Blocks the way' ? 'Blocks the way · use a gate' : cut };
  if (!free && !canAfford(T.cost)) return { ...r, ok: false, reason: `Need ${shortfall(T.cost)}` };
  if (adapt) snapToNeighbours(type, r);
  return r;
}
function evaluateRoad(a, b) {
  const r = { type: 'road', ci: a, cj: b, s: 1, x0: a * CELL, z0: b * CELL, x1: (a + 1) * CELL, z1: (b + 1) * CELL, ok: true, reason: '' };
  if (a < 0 || b < 0 || a >= N || b >= N) return { ...r, ok: false, reason: 'Off the map' };
  const o = occB[b * N + a];
  if (o && o.type !== 'gate') return { ...r, ok: false, reason: 'Occupied' };
  if (road[b * N + a]) return { ...r, ok: false, reason: 'Already a path', soft: true };
  if (bridgeCell[b * N + a]) return { ...r, ok: false, reason: 'Bridge' };
  const st = cellStats(a, b);
  if (st.mn < .4) return { ...r, ok: false, reason: 'Water' };
  if (st.spread >= 1.9) return { ...r, ok: false, reason: 'Too steep' };
  return r;
}
function planFlatten(ev, FO) {
  const verts = [];
  for (let j = Math.max(0, Math.floor(ev.z0 - FO)); j <= Math.min(V - 1, Math.ceil(ev.z1 + FO)); j++)
    for (let i = Math.max(0, Math.floor(ev.x0 - FO)); i <= Math.min(V - 1, Math.ceil(ev.x1 + FO)); i++) {
      const k = idx(i, j);
      const dx = Math.max(ev.x0 - i, 0, i - ev.x1), dz = Math.max(ev.z0 - j, 0, j - ev.z1), dist = Math.hypot(dx, dz);
      // ground shared with a neighbour stays put, except that it may come down to this building's level: left higher, it would
      // bury this building's base (a neighbour's base runs well below its top, so its side just shows a little more)
      if (lock[k]) { if (dist === 0 && H[k] > ev.target) verts.push({ k, inside: true, h0: H[k], h1: ev.target, d0: dirt[k], d1: dirt[k] }); continue; }
      if (dist > FO) continue;
      verts.push({ k, inside: dist === 0, h0: H[k], h1: lerp(ev.target, H[k], sstep(0, FO, dist)), d0: dirt[k],
        d1: dirt[k] });   // no dirt splat: buildings stand on grass
    }
  const pad = .8, inPad = (x, z) => x > ev.x0 - pad && x < ev.x1 + pad && z > ev.z0 - pad && z < ev.z1 + pad;
  const cleared = trees.filter(t => !t.dead && inPad(t.x, t.z)); cleared.forEach(t => { t.dead = true; t.claim = null; });
  rocks.filter(r => r.amount > 0 && inPad(r.x, r.z)).forEach(r => { r.amount = 0; });
  return { verts, cleared };
}
function applyPlan(p, e) {
  for (const v of p.verts) { H[v.k] = lerp(v.h0, v.h1, e); dirt[v.k] = lerp(v.d0, v.d1, e); }
  for (const t of p.cleared) t.k = Math.min(t.k, 1 - e);
}
function finishAnims() { while (anims.length) applyPlan(anims.shift().plan, 1); }
function charmOf(B) {
  const c = center(B); let s = 0, p = 0;
  for (const D of buildings) if (DEF[D.type].charm && D.built) { const d = center(D); if (Math.hypot(d.x - c.x, d.z - c.z) <= CHARM_R) s += DEF[D.type].charm; }
  for (let n = 0; n < N * N; n++) if (road[n] && Math.hypot((n % N + .5) * CELL - c.x, (((n / N) | 0) + .5) * CELL - c.z) <= CHARM_R * .6) p += PATH_CHARM;
  return Math.min(1, s + Math.min(.2, p));
}
// ---------- decor that does something: each still gives its bit of charm, and helps what stands within BOOST_R of it
// (one of a kind doesn't stack with another of the same kind; different kinds add up)
const BOOST_R = CHARM_R;               // the same circle as charm, so one ring shows both
const DECOR_FX = {
  torch: { range: 1 },                 // ranged and siege towers (and the castle's archers) shoot further
  campfire: { range: 2 },              // the same, more
  butts: { rangeArch: 1.5 },           // ranged towers and the castle's archers only
  banner: { troopRate: .15, troopWalk: .2 },   // barracks and stables troops near it strike faster and move faster
  rack: { troopDmg: .2 },              // and hit harder
  well: { prod: .2 },                  // economy buildings (wood, stone, food) work faster
  stores: { siegeRate: .2 },           // siege engines reload faster
};
// the best of one effect from the built decor within BOOST_R of a spot
function decorFx(x, z, key) {
  let v = 0;
  for (const D of buildings) { const F = DECOR_FX[D.type]; if (!F || !F[key] || !D.built || D.dead) continue; const c = center(D); if (Math.hypot(c.x - x, c.z - z) <= BOOST_R) v = Math.max(v, F[key]); }
  return v;
}
const RANGED = { tower: 1, crossbow: 1, castle: 1 };
// a tower's or siege engine's range with any torch, campfire (and, for archers and crossbowmen, target range) nearby
function rangeOf(B) {
  const T = DEF[B.type]; if (!T.range) return 0; const c = center(B);
  return T.range[B.tier - 1] + Math.max(decorFx(c.x, c.z, 'range'), 0) + (RANGED[B.type] ? decorFx(c.x, c.z, 'rangeArch') : 0);
}
const siegeRate = B => DEF[B.type].rate[B.tier - 1] * (1 - decorFx(center(B).x, center(B).z, 'siegeRate'));
// Meadowmere (Jack: a better reason for the farmhouse): its sodden ground grows fields at half anywhere, and in the marsh itself at .3;
// the farmhouse's yard is not a field, so it keeps its full yield
const prodK = B => (1 + decorFx(center(B).x, center(B).z, 'prod')) * (MAP === 'mere' && B.type === 'farm' ? (marshW(center(B).x / MK, center(B).z / MK) > .5 ? .3 : .5) : 1);
const housesNear = (x, z) => buildings.filter(B => B.type === 'house' && Math.hypot(center(B).x - x, center(B).z - z) <= CHARM_R).length;
function center(B) { return { x: (B.ev.x0 + B.ev.x1) / 2, z: (B.ev.z0 + B.ev.z1) / 2 }; }
function doorPoint(B) { const d = B.door; if (!d) return { x: center(B).x, z: B.ev.z1 + .6 }; const [sx, sz] = doorShift(B); return { x: (d.a + .5) * CELL + sx, z: (d.b + .5) * CELL + sz }; }
// how far this tier's door sits across from the door tile's centre line (the tile holding the tier-1 door: on a 2x2 its
// centre is 1 m off the building's middle, toward the door's side)
function doorShift(B) {
  const L = DOOR[B.type]; if (!L || !B.door) return [0, 0];
  const tile = B.ev.s % 2 ? 0 : Math.sign(L[0][0]) * CELL / 2;
  return faceRot(B.face || 0, L[B.tier - 1][0] - tile, 0);
}
// where the model's own door is; villagers walk from the path tile to here before they vanish inside
// a point in a building's own frame (front = +z) in the world
function localPt(B, x, z) { const c = center(B), [rx, rz] = faceRot(B.face || 0, x, z); return { x: c.x + rx, z: c.z + rz }; }
// where a worker steps in from: the forester's own men use the hut door inside the plot (they never leave the plot to store logs)
function yardDoor(B) { const p = innerDoor(B); if (!p) return null; const L = DOOR[B.type][B.tier - 1]; return localPt(B, L[0] + .4, L[1] + .32); }   // clear of the grove's nearest trees
function outerDoor(B, v) { return B.type === 'forester' && v && v.job === B && innerDoor(B) ? yardDoor(B) : doorPoint(B); }
function innerDoor(B) {
  const L = DOOR[B.type]; if (!L || !B.door || !B.built) return null;
  const c = center(B), [x, z] = faceRot(B.face || 0, ...L[B.tier - 1]); return { x: c.x + x, z: c.z + z };
}
function wallMask(B) {
  let m = 0;
  for (const [da, db, bit] of DIRS) { const a = B.ev.ci + da, b = B.ev.cj + db; if (a < 0 || b < 0 || a >= N || b >= N) continue; const o = occB[b * N + a]; if (o && o !== B && WALLY[o.type]) m |= bit; }
  return m;
}
function swapModel(B) {
  const old = B.group, g = makeModel(B.type, B.tier, B.plinth, B.mask, B.rot, B.rotFixed);
  g.position.copy(old.position); g.rotation.y = old.rotation.y; g.scale.copy(old.scale); g.userData.B = B; scene.remove(old); scene.add(g); B.group = g;
}
function refreshWalls() { for (const B of buildings) if (B.type === 'wall' || B.type === 'gate') { const m = wallMask(B); if (m !== B.mask) { B.mask = m; swapModel(B); } } }

function place(type, ci, cj, opts = {}) {
  finishAnims();
  const ev = evaluate(type, ci, cj, opts.free);
  if (!ev.ok) { if (!opts.silent) setHint(ev.reason, 'bad'); return null; }
  const T = DEF[type];
  if (!opts.free) pay(T.cost);
  const B = { id: nextId++, type, tier: 1, ev, plinth: adapt, max: T.hp[0], hp: T.hp[0], cool: [], fed: true, mask: 0, rot: ROTATES[type] ? placeRot : 0, rotFixed: false };
  for (let b = cj; b < cj + (ev.sz || ev.s); b++) for (let a = ci; a < ci + ev.s; a++) { occB[b * N + a] = B; if (type !== 'gate') road[b * N + a] = 0; }
  const c = center(B), now = performance.now();
  const g = makeModel(type, 1, adapt, 0, B.rot); g.userData.B = B; B.group = g;
  if (adapt && type !== 'wall' && !T.movable) {          // walls follow the slope; a movable engine leaves the ground as it is
    const plan = planFlatten(ev, T.falloff || F);
    plan.verts.forEach(v => { if (v.inside) lock[v.k] = 1; });
    if (opts.instant) applyPlan(plan, 1); else anims.push({ plan, t0: now, dur: 450 });
    g.position.set(c.x, ev.target, c.z);
  } else g.position.set(c.x, ev.center, c.z);
  B.face = FACING[type] ? ev.face : 0; g.rotation.y = B.face * Math.PI / 2;
  B.door = T.noRoad ? null : doorCell(ev, type, B.face);     // paths are the player's to lay
  scene.add(g); buildings.push(B);
  const bw = type === 'castle' ? 2.6 : T.size === 1 ? 1.2 : 1.8;
  B.bar = makeBar(bw); B.pbar = makeBar(bw);
  if (opts.instant) { B.built = true; syncResidents(B); }
  else { B.built = false; B.site = { kind: 'new', progress: 0, time: T.build }; g.scale.y = .08; addScaffold(B); if (instantBuild) { B.site.progress = 1; } }
  if (WALLY[type]) refreshWalls();
  if (opts.instant) syncTerrain(); else rebuildRoads();
  villagers.forEach(v => v.path = null); regionDirty = true;
  if (!opts.quiet) log(`<b>${T.tiers[0]}</b> placed`);
  return B;
}
// ---------- construction ----------
const LIGHT_SCAFFOLD = { wall: 1, torch: 1, flowers: 1 };
function addScaffold(B) {
  removeScaffold(B);
  // timber scaffolding round the site: poles every metre or so, a plank deck at each lift, cross braces, a ladder, and stacks of materials
  const g = new THREE.Group(), e = B.ev, hgt = { tower: 4, castle: 5, wall: 2.4, gate: 3, house: 2.8, statue: 2.4, torch: 2.2 }[B.type] || 2.6, c = center(B);
  const hx = (e.x1 - e.x0) / 2 + .05, hz = (e.z1 - e.z0) / 2 + .05, lift = .95;
  const nx = Math.max(2, Math.round(hx * 2 / 1.1) + 1), nz = Math.max(2, Math.round(hz * 2 / 1.1) + 1);
  if (LIGHT_SCAFFOLD[B.type]) {             // small pieces built in runs: just corner poles and a rail, or a wall line becomes a tangle
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.06, hgt * .8, .06, M.rough, sx * hx * .8, hgt * .4, sz * hz * .8));
    g.add(box(hx * 1.6, .05, .05, M.rough, 0, hgt * .7, hz * .8));
    g.position.set(c.x, B.group.position.y, c.z); scene.add(g); B.scaffold = g; return;
  }
  const along = (n, h) => Array.from({ length: n }, (_, i) => -h + 2 * h * i / (n - 1));
  for (const x of along(nx, hx)) for (const sz of [-1, 1]) g.add(box(.07, hgt, .07, M.rough, x, hgt / 2, sz * hz));
  for (const z of along(nz, hz)) for (const sx of [-1, 1]) g.add(box(.07, hgt, .07, M.rough, sx * hx, hgt / 2, z));
  for (let y = lift; y < hgt; y += lift) {
    for (const sz of [-1, 1]) { g.add(box(hx * 2, .05, .05, M.rough, 0, y + .32, sz * hz)); g.add(box(hx * 2 + .1, .04, .28, M.wood, 0, y, sz * (hz + .1))); }
    for (const sx of [-1, 1]) { g.add(box(.05, .05, hz * 2, M.rough, sx * hx, y + .32, 0)); g.add(box(.28, .04, hz * 2 + .1, M.wood, sx * (hx + .1), y, 0)); }
  }
  const xs = along(nx, hx), zs = along(nz, hz);
  for (let i = 0; i + 1 < xs.length; i++) for (const sz of [-1, 1]) { const w = xs[i + 1] - xs[i], br = box(.04, Math.hypot(w, lift), .04, M.rough, (xs[i] + xs[i + 1]) / 2, lift / 2 + (i % 2) * lift, sz * hz); br.rotation.z = (i % 2 ? 1 : -1) * Math.atan2(w, lift); g.add(br); }
  for (let i = 0; i + 1 < zs.length; i++) for (const sx of [-1, 1]) { const d = zs[i + 1] - zs[i], br = box(.04, Math.hypot(d, lift), .04, M.rough, sx * hx, lift / 2 + (i % 2) * lift, (zs[i] + zs[i + 1]) / 2); br.rotation.x = (i % 2 ? -1 : 1) * Math.atan2(d, lift); g.add(br); }
  const lx = hx + .22;                      // ladder up the east side
  for (const dz of [-.16, .16]) g.add(box(.05, hgt * .95, .05, M.rough, lx, hgt * .47, dz));
  for (let y = .25; y < hgt * .9; y += .28) g.add(box(.04, .04, .34, M.rough, lx, y, 0));
  // materials stacked by the front corner: planks and cut stone
  for (let n = 0; n < 3; n++) g.add(box(.9, .07, .12, M.wood, -hx + .5, .04 + n * .07, hz + .35 + (n % 2) * .02));
  for (const [dx, dy, dz] of [[0, 0, 0], [.26, 0, .02], [.12, .2, .01]]) g.add(box(.24, .2, .22, M.stone2, hx - .45 + dx, .1 + dy, hz + .35 + dz));
  g.position.set(c.x, B.group.position.y, c.z); scene.add(g); B.scaffold = g;
}
// a puff of dust where builders are working
function dustAt(x, y, z) {
  if (puffs.length > 160) return;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: '#b9a582', transparent: true, depthWrite: false, opacity: 0 }));
  sp.position.set(x + (Math.random() - .5) * .4, y + .1, z + (Math.random() - .5) * .4); sp.scale.setScalar(.25);
  scene.add(sp); puffs.push({ sp, t: 0, life: 1.1 + Math.random() * .6, dx: (Math.random() - .5) * .4, dust: true });
}
function removeScaffold(B) { if (B.scaffold) { scene.remove(B.scaffold); B.scaffold = null; } }
// repairs are free but take builder-time; a building's own workers mend it themselves, pausing their gathering
const REPAIR_K = 1.2;
function startRepairs() {
  let n = 0;
  for (const B of buildings) {
    if (B.dead || B.hp >= B.max) continue;
    if (B.site && B.site.kind !== 'repair') { B.hp = B.max; continue; }      // half-built sites just get patched up
    const lost = 1 - B.hp / B.max;
    B.site = { kind: 'repair', progress: instantBuild ? 1 : 0, time: Math.max(3, DEF[B.type].build * lost * REPAIR_K), hp0: B.hp };
    n++;
  }
  return n;
}
function completeSite(B) {
  const T = DEF[B.type], S = B.site; B.site = null; removeScaffold(B); B.pbar.grp.visible = false; regionDirty = true;   // an upgraded farm moves its hut
  const c = center(B);
  if (S.kind === 'repair') {
    B.hp = B.max; floatText('Repaired', '#8cc46e', c.x, B.group.position.y + 3, c.z); sfx('build', c, .6);
    refreshCard(); return;
  }
  if (S.kind !== 'repair') { B.pop = performance.now(); for (let n = 0; n < 6; n++) { const a = n / 6 * 6.283, r = B.ev.s * CELL * .55; dustAt(c.x + Math.cos(a) * r, B.group.position.y, c.z + Math.sin(a) * r); } }
  if (S.kind === 'new') {
    B.built = true; B.group.scale.y = 1; stats.built++; stats.made[B.type] = (stats.made[B.type] || 0) + 1; if (B.type !== 'castle' || stats.built > 1) sfx('build', c);
    if (B.type !== 'wall') log(`<b>${T.tiers[0]}</b> built${T.residents ? ` · +${T.residents[0]}` : ''}`, 'good');
    // the first of a kind: a one-line tip for what it can do
    if (T.soldiers) tipOnce('rally', 'Tap the barracks, then <b>Rally</b> to send soldiers to a spot');
    else if (T.movable) tipOnce('move', 'Tap the catapult, then <b>Move</b> to roll it somewhere new');
    else if (B.type === 'market') tipOnce('market', 'Tap the market to <b>trade</b>');
    else if (DEF_FXT(B.type)) tipOnce('decor', '<b>Decor</b> helps what stands near it');
    if (stats.built >= 4 && B.type !== 'castle' && MAP !== 'vale') tipOnce('skip', '<b>Skip day</b> early to earn gold for the time left');
  } else {
    B.tier++; stats.upgrades++; swapModel(B); settleBase(B); rebuildRoads(); B.group.scale.y = 1; B.max = T.hp[B.tier - 1]; B.hp = B.max;
    if (B.tier === 2) rebuildRoads();   // the new stone base: paths now stop at its edge
    if (B.figs && B.figs.length) { hideDefenders(B); (B.manned || []).forEach((on, a) => on && showDefender(B, a)); }
    floatText(`${T.tiers[B.tier - 1]}!`, '#f2c95e', c.x, B.group.position.y + 4, c.z); sfx('build', c);
    log(`<b>${T.tiers[B.tier - 1]}</b> ready`, 'good');
  }
  syncResidents(B); assignJobs(); if (WALLY[B.type]) refreshWalls(); refreshCard();
}
// the highest tier a stage allows (Stages 1–2 stay at tier 1, Stage 3 opens tier 2 (Jack: trading for stone makes sense with upgrades), Stage 7 tier 3); free play has all three
const tierCap = () => (CAMP_MAPS[MAP] && CAMP_MAPS[MAP].maxTier) || 3;
function upgrade(B) {
  const T = DEF[B.type];
  if (!T.up || B.tier >= 3 || B.tier >= tierCap() || B.dead || B.site) return;
  const cost = T.up[B.tier - 1];
  if (!canAfford(cost)) { setHint(`Need ${shortfall(cost)}`, 'bad'); return; }
  pay(cost);
  B.site = { kind: 'up', progress: instantBuild ? 1 : 0, time: Math.round(T.build * 1.3) }; addScaffold(B);
  log(`Upgrading · <b>${T.tiers[B.tier]}</b>`);
  refreshCard();
}
function removeBuilding(B, raid, cancel) {
  if (B.dead) return; B.dead = true;
  scene.remove(B.group); scene.remove(B.bar.grp); scene.remove(B.pbar.grp); removeScaffold(B);
  for (let n = 0; n < N * N; n++) if (occB[n] === B) occB[n] = null;
  buildings.splice(buildings.indexOf(B), 1);
  // a lost house leaves its people homeless, not dead: they shelter in the castle and move into the next house built
  const K = castleB();
  if (K) for (const v of villagers) if (v.home === B) { v.home = K; v.homeless = true; if (v.indoor === B) v.indoor = K; }
  if (K) for (const r of respawns) if (r.home === B) { r.home = K; r.homeless = true; }
  // a lost barracks: armed soldiers fall back to the castle door for the rest of the night; anyone still changing comes out unarmed
  for (const v of villagers) if (v.post && v.post.B === B && DEF[B.type].soldiers) {
    if (v.soldier && K) { v.post = { B: K, a: v.post.a, fled: true }; v.foe = null; v.prog = null; v.path = null; continue; }
    if (v.indoor === B) v.indoor = K;
    if (v.kitT > 0) { v.kitT = 0; if (!v.g.visible || v.doorWalk) exitDoor(v); }
    v.post = null; v.posted = false;
  }
  for (const v of villagers.slice()) if (v.home === B || (v.post && v.post.B === B && v.posted && !v.soldier)) killVillager(v);   // (only the castle's own, at the very end)
  if (B.rallyFlag) setRally(B, null);
  for (const v of villagers) {
    if (v.post && v.post.B === B) v.post = null;
    if (v.job === B) { v.job = null; v.state = 'find'; release(v); }
    if (v.build === B) { v.build = null; v.state = v.job ? 'commute' : 'find'; }
  }
  regionDirty = true; hideDefenders(B); assignJobs(); villagers.forEach(v => v.path = null);
  const c = center(B), name = DEF[B.type].tiers[B.tier - 1].toLowerCase();
  if (!raid) sfx(cancel ? 'click' : 'sold', c);
  if (raid) { stats.lost++; if (!WALLY[B.type]) stats.lostB++; sfx('destroyed', c); shake(.3, c, 'lost', .6); debrisBurst(B, c); floatText('Destroyed', '#e2715b', c.x, B.group.position.y + 3, c.z); log(`<b>${DEF[B.type].tiers[B.tier - 1]}</b> lost`, 'warn'); }
  else if (cancel) { RES_KEYS.forEach(k => res[k] += DEF[B.type].cost[k] || 0); log(`<b>${DEF[B.type].tiers[0]}</b> cancelled · +${costHTML(DEF[B.type].cost)}`); }
  else {
    const back = {}; RES_KEYS.forEach(k => { if (DEF[B.type].cost[k]) back[k] = Math.floor(DEF[B.type].cost[k] / 2); res[k] += back[k] || 0; });
    log(`<b>${DEF[B.type].tiers[B.tier - 1]}</b> demolished · +${costHTML(back)}`);
  }
  if (selected === B) deselect();
  refreshWalls(); rebuildRoads();
  if (B.type === 'castle') endGame(false);
}
function hurtBuilding(B, d) { if (B.dead || gameOver) return; B.hp -= d; B.hitT = performance.now(); shake(.05, center(B)); if (B.hp <= 0) removeBuilding(B, true); }
function paintRoad(a, b) {
  const ev = evaluateRoad(a, b);
  if (!ev.ok) { if (!ev.soft) setHint(ev.reason, 'bad'); return false; }
  if (!canAfford(PATH_COST)) { setHint(`Need ${shortfall(PATH_COST)}`, 'bad'); return false; }
  pay(PATH_COST); road[b * N + a] = 1; rebuildRoads(); villagers.forEach(v => v.path = null); sfx('path', { x: (a + .5) * CELL, z: (b + .5) * CELL });
  const m = roadMask(a, b);
  setHint('<b>Path</b>', 'ok');
  return true;
}
let lastPaint = '', wallStroke = 0;
function paintWall(a, b) {
  const key = a + ',' + b; if (key === lastPaint) return; lastPaint = key;
  const B = place('wall', a, b, { quiet: true });
  if (B) { wallStroke++; sfx('click'); setHint('<b>Wall</b>', 'ok'); }
}

