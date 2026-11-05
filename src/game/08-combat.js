// ---------- enemies + combat ----------
const raiderRed = mat('#a32a22');   // every raider wears the same red
const shieldM = mat('#5a2a1e');
// mounted raiders (and the stables' riders) ride: a horse under the rider, who sits astride with legs to either side
const horseM = mat('#5a3a22'), maneM = mat('#2a1d14'), saddleM = mat('#3a2418'), blanketM = mat('#8a221c'), hoofM = mat('#1f1a16');
const SADDLE = .72;   // lifts the rider's body so the hips sit on the saddle
function mountHorse(p, cloth = blanketM) {
  const h = new THREE.Group(); p.g.add(h);
  h.add(box(.34, .36, .92, horseM, 0, .78, 0));                                   // barrel
  const neck = box(.2, .46, .22, horseM, 0, 1.06, .48); neck.rotation.x = .55; h.add(neck);
  const head = box(.16, .17, .4, horseM, 0, 1.22, .72); head.rotation.x = .35; h.add(head);
  const mane = box(.05, .42, .1, maneM, 0, 1.1, .4); mane.rotation.x = .55; h.add(mane);
  for (const sx of [-1, 1]) h.add(box(.04, .08, .05, horseM, sx * .05, 1.34, .62));  // ears
  const tail = box(.07, .45, .07, maneM, 0, .76, -.5); tail.rotation.x = -.35; h.add(tail);
  h.add(box(.38, .06, .4, cloth, 0, .97, -.02)); h.add(box(.3, .08, .3, saddleM, 0, 1.01, -.02));
  p.horseLegs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    // upper leg from the hip, then a knee (forelegs) or hock (hind legs) at -.3 carrying the lower leg and hoof
    const pv = new THREE.Group(); pv.position.set(sx * .12, .62, sz * .36); h.add(pv);
    pv.add(box(.1, .32, .1, horseM, 0, -.15, 0));
    const kn = new THREE.Group(); kn.position.y = -.3; pv.add(kn); pv.userData.knee = kn; pv.userData.fore = sz > 0;
    kn.add(box(.075, .28, .075, horseM, 0, -.14, 0)); kn.add(box(.1, .06, .1, hoofM, 0, -.28, 0));
    return pv;
  });
  p.body.position.y = SADDLE;
  for (const [n, sx] of [[0, -1], [1, 1]]) { p.legs[n].rotation.x = -1.2; p.legs[n].rotation.z = sx * .55; }
  p.horse = h;
}
// a horse's gallop: each leg on its own beat (hind left, hind right, then fore left, fore right), swinging from the hip; while a leg
// swings forward it is lifted, the foreleg's knee folding the lower leg back and the hind leg's hock folding it forward
const GALLOP_OFF = [.55, .65, 0, .1];
function horseGait(legs, ph, amp) {
  legs.forEach((l, i) => { const a = ph + GALLOP_OFF[i] * Math.PI * 2, lift = Math.max(0, -Math.cos(a));   // the swing forward (the hip angle falling)
    l.rotation.x = Math.sin(a) * .65 * amp;
    if (l.userData.knee) l.userData.knee.rotation.x = (l.userData.fore ? 1.25 : -.9) * lift * amp; });
}
// shields are worn on the outside of the left forearm, so the arm never passes through them
// heater shield (flat-topped, pointed foot) in a rim; its face looks along -x, out from a left arm
function heaterShield(w, h, faceM, rimM) {
  const sh = new THREE.Shape(), hw = w / 2, hh = h / 2;
  sh.moveTo(0, -hh); sh.quadraticCurveTo(-hw * .95, -hh * .45, -hw, hh * .25); sh.lineTo(-hw, hh * .8);
  sh.quadraticCurveTo(-hw * .5, hh * .88, 0, hh); sh.quadraticCurveTo(hw * .5, hh * .88, hw, hh * .8); sh.lineTo(hw, hh * .25);
  sh.quadraticCurveTo(hw * .95, -hh * .45, 0, -hh);
  const geo = d => { const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); g.rotateY(-Math.PI / 2); return g; };
  const g = new THREE.Group(), rim = new THREE.Mesh(geo(.022), rimM), face = new THREE.Mesh(geo(.03), faceM);
  rim.scale.set(1, 1.1, 1.12); face.position.x = -.006; rim.castShadow = face.castShadow = true; g.add(rim, face); return g;
}
function roundShield(r, faceM) {
  const g = new THREE.Group(), d = cyl(r, r, .035, 14, faceM, 0, 0, 0); d.rotation.z = Math.PI / 2; g.add(d);
  const b = new THREE.Mesh(new THREE.SphereGeometry(r * .26, 8, 5), M.iron); b.position.x = -.02; b.castShadow = true; g.add(b);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, .014, 4, 18), M.iron); rim.rotation.y = Math.PI / 2; g.add(rim);
  return g;
}
function armShield(p, sh) { sh.position.set(-.09, -.2, .02); p.arms[0].add(sh); return sh; }
// spears are held level at the hip, point forward; a strike (attackT .35 → 0) pushes the spear straight out and draws it back:
// the arm lifts as the tool tilts back by the same angle (the shaft stays level) and the grip slides down the shaft
// a strike is three beats over SPEAR_T: draw the spear back, drive it out 0.45 m with a small lunge (body steps in and leans), recover
const SPEAR_T = .5;
const spearThrust = at => {
  if (!(at > 0)) return 0;
  const p = 1 - at / SPEAR_T;
  return p < .25 ? -.3 * Math.sin(p / .25 * Math.PI / 2) : p < .5 ? lerp(-.3, 1, sstep(.25, .5, p)) : 1 - sstep(.5, 1, p);
};
function spearPose(p, at, sw) {
  const u = spearThrust(at), out = Math.max(0, u);
  p.arms[1].rotation.x = -1.0 - .45 * u + sw * .08; p.pivot.rotation.x = -.57 + .45 * u - sw * .08 - .12 * out; p.pivot.position.y = -.33 - .45 * u;   // - lean: shaft stays level
  p.body.position.z = .15 * out; if (out > 0) p.body.rotation.x = .12 * out;
}
// a sword cut over SWORD_T: raise the blade overhead with the wrist cocked back, chop down with a small step in, recover
const SWORD_T = .5;
function swordPose(p, at, sw) {
  if (!(at > 0)) { p.arms[1].rotation.x = -.45 + sw * .3; p.pivot.rotation.x = -.4; p.body.position.z = 0; return; }
  const t = 1 - at / SWORD_T, up = sstep(0, .4, t), down = sstep(.4, .62, t), back = sstep(.62, 1, t);
  p.arms[1].rotation.x = -.45 - 2.3 * up + 2.55 * down - .25 * back;      // -.45 → -2.75 overhead → -.2 low in front → -.45
  p.pivot.rotation.x = -.4 - .55 * up + .75 * down - .2 * back;            // wrist cocked back, then snapped through
  const cut = t > .4 && t < .85 ? Math.sin(Math.PI * (t - .4) / .45) : 0;
  p.body.position.z = .1 * cut; if (cut > 0) p.body.rotation.x = .08 * cut;
}
// raiders dress by tier, the same for every kind (only the weapon differs): 1 a plain red shirt and a rope belt, bare-headed;
// 2 a red quilted gambeson with a short skirt, a leather belt and an iron helm with nose and cheek guards; 3 mail under a red
// surcoat, a closed iron great helm and iron shoulder plates
const raiderQuiltM = quiltMat('#9c3328', '#6c1d17'), ropeBeltM = mat('#8a7650');
function raiderArmour(p, tier) {
  const put = o => { o.castShadow = true; p.body.add(o); return o; };
  const tun = tier === 3 ? mailM : tier === 2 ? raiderQuiltM : raiderRed;
  p.torso.material = tun; p.arms.forEach(a => a.userData.sleeve.material = tun); p.baseTunic = tun;
  if (tier === 1) put(cyl(.197, .197, .04, 10, ropeBeltM, 0, .47, 0));
  if (tier === 2) { put(cyl(.205, .228, .13, 10, raiderQuiltM, 0, .37, 0)); put(cyl(.197, .197, .045, 10, leatherM, 0, .5, 0)); put(makeHelm('raider')); }
  if (tier === 3) {
    put(cyl(.15, .214, .42, 8, raiderRed, 0, .62, 0)); put(cyl(.17, .17, .05, 8, leatherM, 0, .55, 0)); put(makeHelm('greathelm'));
    for (const sx of [-1, 1]) { const pl = put(new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 5, 0, Math.PI * 2, 0, Math.PI * .5), darkIronM)); pl.position.set(sx * .19, .86, 0); pl.scale.set(1, .8, 1.15); }
  }
}
const raiderShieldM = mat('#7a2019');
const RAIDER_TOOL = { spear: 'spear', lancer: 'spear', sword: 'sword', rider: 'sword', archer: 'bow', xbow: 'crossbow', chief: 'sword', warlord: 'sword' };
const cloakM = mat('#6e1611'), bossGoldM = mat('#c9a24a'), bossHornM = mat('#e3d6b8'), bardM = mat('#2a2522');
function makeRaider(kind, tier = 1) {
  if (ENEMY[kind].engine) return makeEngine(kind, tier);
  const p = makePerson({ tunic: raiderRed, tool: RAIDER_TOOL[kind] });
  raiderArmour(p, tier);
  if (kind === 'sword' || kind === 'rider') armShield(p, roundShield(.19, tier === 3 ? raiderShieldM : M.wood));   // spearmen carry none; archers need both hands
  if (ENEMY[kind].boss) bossGear(p, kind);
  if (ENEMY[kind].mounted) {
    mountHorse(p);
    if (tier === 3) { const ch = box(.17, .06, .34, darkIronM, 0, 1.3, .72); ch.rotation.x = .35; p.horse.add(ch); }   // an iron plate down the horse's face
    if (tier >= 2) for (const sx of [-1, 1]) p.horse.add(box(.02, .3, .5, raiderRed, sx * .185, .9, -.05));               // a red cloth down its flanks
  }
  return p;
}
// the bosses' own gear over the tier-3 armour: a long red cloak from the shoulders, a gold band on the helm and, for the Chief, a
// pair of horns and a red round shield; for the Warlord a gold crown of points, a tall red plume, a red heater shield and a horse
// in dark barding. The whole figure is drawn at ENEMY[kind].boss (spawnEnemy)
function bossGear(p, kind) {
  const put = o => { o.castShadow = true; p.body.add(o); return o; };
  const cl = put(box(.42, .66, .03, cloakM, 0, .55, -.19)); cl.rotation.x = .1;
  put(box(.46, .05, .1, cloakM, 0, .88, -.13));
  put(cyl(.165, .165, .03, 12, bossGoldM, 0, 1.16, 0));
  if (kind === 'chief') {
    for (const sx of [-1, 1]) { const h = put(new THREE.Mesh(new THREE.ConeGeometry(.04, .24, 6), bossHornM)); h.position.set(sx * .18, 1.2, 0); h.rotation.z = -sx * 1.0; }
    armShield(p, roundShield(.22, raiderShieldM));
  } else {
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, c = put(new THREE.Mesh(new THREE.ConeGeometry(.028, .1, 4), bossGoldM)); c.position.set(Math.cos(a) * .15, 1.22, Math.sin(a) * .15); }
    const pl = put(new THREE.Mesh(new THREE.ConeGeometry(.05, .34, 6), cloakM)); pl.position.set(0, 1.36, -.05); pl.rotation.x = -.3;
    armShield(p, heaterShield(.3, .38, raiderShieldM, bossGoldM));
    if (p.horse) {
      p.horse.add(box(.4, .34, .96, bardM, 0, .74, 0));                          // dark barding over the barrel
      for (const sx of [-1, 1]) p.horse.add(box(.02, .36, .7, cloakM, sx * .205, .78, -.02));   // red cloth on both flanks
      const ch = box(.17, .06, .34, bossGoldM, 0, 1.3, .72); ch.rotation.x = .35; p.horse.add(ch);  // a gilded plate down its face
    }
  }
}
// raider siege engines on wheels, pushed by two of their crew (dressed by the engine's tier) walking behind; a red pennant from
// tier 2. ballista: the town's swivel bow on a wheeled carriage; catapult: the town's engine of the same tier (it has wheels);
// ram: a log slung from a frame on four wheels, under a plank roof from tier 2, hides and an iron head at tier 3
const RAM_Y = .62, RAM_ROPE = .78, RAM_T = 2.0;   // the ram's log height, rope length, one charge (drawn back, driven in, knocked back)
const ENG_LEN = { ballista: 1.7, catapult: [1.6, 1.8, 2.0], ram: 2.3 };
function wheel(g, r, x, y, z, iron) {
  const w = cyl(r, r, .08, 12, M.wood, x, y, z); w.rotation.z = Math.PI / 2; g.add(w);
  const h = cyl(r * .3, r * .3, .1, 8, iron ? M.iron : M.timber, x, y, z); h.rotation.z = Math.PI / 2; g.add(h);
  if (iron) { const t = cyl(r + .008, r + .008, .03, 12, M.iron, x + Math.sign(x) * .03, y, z); t.rotation.z = Math.PI / 2; g.add(t); }
}
function pennant(g, x, y, z) {
  g.add(cyl(.02, .02, 1.0, 5, M.timber, x, y + .5, z));
  const f = box(.02, .22, .34, raiderRed, x, y + .86, z - .18); f.castShadow = true; g.add(f);
}
function makeEngine(kind, tier) {
  const g = new THREE.Group(), m = new THREE.Group(); g.add(m); scene.add(g);
  const fm = tier === 1 ? M.rough : M.timber, iron = tier > 1;
  const P = { g, model: m, engine: kind, tier, crew: [] };
  let len;
  if (kind === 'ballista') {
    len = ENG_LEN.ballista;
    for (const sx of [-1, 1]) m.add(box(.1, .14, 1.5, fm, sx * .38, .42, 0));
    // the deck stops short of the back (and the rear axle sits under its edge), so the crew stand in between the rails under the winch
    for (const z of [-.3, .55]) { m.add(box(.86, .1, .12, fm, 0, .42, z)); const ax = cyl(.03, .03, 1.0, 6, M.iron, 0, .26, z); ax.rotation.z = Math.PI / 2; m.add(ax); for (const sx of [-1, 1]) wheel(m, .26, sx * .5, .26, z, iron); }
    m.add(box(.84, .06, .87, M.wood, 0, .5, .215));
    if (tier === 3) for (const sx of [-1, 1]) m.add(box(.04, .04, 1.52, M.iron, sx * .38, .49, 0));
    if (tier >= 2) { const sh = box(1.0, .32, .06, M.wood, 0, .53 + .155, .65 + .04); sh.rotation.x = .25; m.add(sh); }   // the mantlet stands on the deck's front edge, leaning out       // a timber mantlet at the front
    const t = ballistaTurret(BALLISTA_K[tier - 1] * .9); t.position.y = .53 - .18 * BALLISTA_K[tier - 1] * .9; m.add(t); P.turret = t;   // a short stand: its post runs down through the deck, the crank within the crew's reach
    P.rig = { statics: [], k: BALLISTA_K[tier - 1] * .9 };
    t.traverse(o => { const u = o.userData; if (u.bolt) P.bolt = o; for (const key of ['slider', 'bsL', 'bsR', 'prope', 'trope', 'crank']) if (u[key]) P.rig[key] = o; if (u.staticString) P.rig.statics.push(o); });
  } else if (kind === 'catapult') {
    len = ENG_LEN.catapult[tier - 1];
    const c = makeCatapult(tier); m.add(c);
    P.rig = { ammo: [], k: tier === 1 ? 1 : tier === 2 ? 1.15 : 1 };
    c.traverse(o => { const u = o.userData; if (u.arm) P.arm = o; if (u.bolt) P.bolt = o; if (u.turret) P.turret = o; if (u.crank) P.rig.crank = o; if (u.wrope) P.rig.wrope = o; if (u.trope) P.rig.trope = o; if (u.ammo) P.rig.ammo.push(o); });
  } else {
    len = ENG_LEN.ram;
    for (const sx of [-1, 1]) m.add(box(.1, .12, 2.0, fm, sx * .45, .36, 0));
    for (const z of [-.75, .75]) { m.add(box(1.0, .1, .1, fm, 0, .36, z)); for (const sx of [-1, 1]) wheel(m, .24, sx * .56, .24, z, iron); }
    for (const sx of [-1, 1]) for (const z of [-.7, .7]) m.add(box(.09, 1.05, .09, fm, sx * .45, .9, z));            // uprights
    for (const z of [-.7, .7]) m.add(box(1.0, .1, .1, fm, 0, 1.42, z));
    m.add(box(.1, .1, 1.5, fm, 0, 1.42, 0));                                                                         // the beam it hangs from
    // the log hangs level on two ropes from the beam (a parallelogram): it swings back and drives forward without tilting
    const sw = new THREE.Group(); sw.position.set(0, RAM_Y, 0); m.add(sw); P.ram = sw; P.ropes = [];
    const lg = cyl(.13, .14, 2.3, 8, M.rough, 0, 0, .1); lg.rotation.x = Math.PI / 2; sw.add(lg);
    const head = tier === 3 ? cone(.17, .32, 8, darkIronM, 0, 0, 1.38) : cyl(.15, .15, .14, 8, tier === 2 ? M.iron : M.rough, 0, 0, 1.28);
    head.rotation.x = Math.PI / 2; sw.add(head);
    for (const z of [-.45, .55]) { const r = new THREE.Group(); r.position.set(0, RAM_Y + RAM_ROPE, z); r.add(box(.025, RAM_ROPE, .025, ropeM, 0, -RAM_ROPE / 2, 0)); m.add(r); P.ropes.push(r); }
    if (tier >= 2) {                                                                                                 // the roof: planks, hides on top at tier 3
      const rm = tier === 3 ? leatherM : M.wood;
      for (const sx of [-1, 1]) { const r = box(.78, .06, 1.9, rm, sx * .3, 1.66, 0); r.rotation.z = -sx * .62; m.add(r); }
      if (tier === 3) for (const sx of [-1, 1]) for (const z of [-.6, 0, .6]) { const b = box(.8, .02, .04, M.iron, sx * .3, 1.69, z); b.rotation.z = -sx * .62; m.add(b); }
    }
  }
  if (tier >= 2) pennant(m, kind === 'ram' ? .42 : -.42, kind === 'ram' ? 1.4 : .5, -len / 2 + .15);
  m.traverse(o => { if (o.isMesh) o.castShadow = true; });
  // the crew push from behind (their own figures, dressed by the engine's tier, hands forward on the frame)
  for (const sx of [-1, 1]) {
    const c = makePerson({ tunic: raiderRed }); raiderArmour(c, tier);
    c.g.position.set(sx * .3, 0, -len / 2 - .32); g.add(c.g); P.crew.push(c);
    c.arms.forEach(a => a.rotation.x = -1.35);
  }
  P.len = len;
  return P;
}
function spawnEnemy(kind, sp, wave, tier = 1) {
  const E = ENEMY[kind], k = tier - 1, w = WAVES[wave - 1] || {}, p = makeRaider(kind, tier);
  // only a raider's bigger parts cast shadows: the Mountain pass sends up to 100 at once, and every shadow is another draw
  p.g.traverse(o => { if (o.isMesh) { const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); if (g.boundingSphere.radius < .16) o.castShadow = false; } });
  // bosses take no tier multipliers: their numbers are their own (Jack)
  const hp = E.boss ? E.hp : E.hp * RAIDER_T.hp[k] * (w.hp || 1);
  // a metre or so from the spawn point, but never onto ground they can't stand on (a mountain or hillside: they'd stand stuck)
  let sx = clamp(sp.x + (Math.random() - .5) * 2, 1, SIZE - 1), sz = clamp(sp.z + (Math.random() - .5) * 2, 1, SIZE - 1);
  if (!canStand(sx, sz, 2)) { sx = sp.x; sz = sp.z; }
  const e = Object.assign(p, { kind, tier, x: sx, z: sz,
    hp, max: hp, speed: E.speed * (.9 + Math.random() * .2), range: E.range, dmg: E.boss ? E.dmg : E.dmg * RAIDER_T.dmg[k], rate: E.rate,
    cool: E.engine ? E.rate * .5 : Math.random(), fresh: true, target: null, retarget: 0, dead: false, deadT: 0, phase: Math.random() * 6,
    bar: makeBar(E.boss ? 1.6 : E.engine ? 1.3 : E.mounted ? 1.0 : .8), barY: (E.engine ? (kind === 'catapult' ? [1.6, 1.8, 3.3][k] : kind === 'ram' ? 2.1 : 1.5) : 1.6 * UNIT_K + (E.mounted ? SADDLE : 0)) * (E.boss || 1) });
  if (E.boss) { p.g.scale.setScalar(E.boss); banner(RAIDER_NAME[kind], 'Boss', true); log(`<b>${RAIDER_NAME[kind]}</b> comes`, 'bad'); }
  enemies.push(e);
}
function distRect(B, x, z) { const e = B.ev; return Math.hypot(Math.max(e.x0 - x, 0, x - e.x1), Math.max(e.z0 - z, 0, z - e.z1)); }
function nearestBuilding(x, z, maxD = 1e9, ok = null) { let best = null, bd = maxD; for (const B of buildings) { if (DEF[B.type].decor || (ok && !ok(B))) continue; const d = distRect(B, x, z); if (d < bd) { bd = d; best = B; } } return best; }
// a spawn spot from a medium map's 56 m layout: the coordinate along the edge scaled, the edge itself kept
const edgeK = ([x, z]) => [x === 1.2 || x === SIZE - 1.2 ? x : x * MK, z === 1.2 || z === SIZE - 1.2 ? z : z * MK];
function edgePoint(side) {
  const C = castleB(), dp = C && doorPoint(C);   // a spawn must have a walkable route to the castle's door
  if (MAP === 'keep' || MAP === 'hold') {
    // Raider Keep: everyone out of the keep's gate; Warlord's Hold: out of the hold's gate, from night 3 the west pass, from night 4 the east
    const r = Math.random(), W = PH.wave;
    const side = MAP === 'keep' ? (W >= 4 ? (r < .4 ? 'kl' : r < .8 ? 'kr' : 'g') : 'g') : (W >= 4 && r < .25 ? 'e' : W >= 3 && r < .5 ? 'w' : 'g');   // the keep: out of its gate; from night 4 also out of its west and east sides (Jack), right by its walls
    const G = MAP === 'keep' ? KEEP_GATE : HOLD_GATE;
    const pick = side === 'kl' ? () => [25.5 + Math.random() * 2, 12 + Math.random() * 7] : side === 'kr' ? () => [54.5 + Math.random() * 2, 12 + Math.random() * 7] : side === 'w' ? () => [1.2, 24 + Math.random() * 2.5] : side === 'e' ? () => [SIZE - 1.2, 24 + Math.random() * 2.5] : () => [G[0] - (MAP === 'keep' ? 2.5 : 1.5) + Math.random() * (MAP === 'keep' ? 5 : 3), G[1] + 2 + Math.random() * 1.5];
    for (const needRoute of [true, false]) for (let n = 0; n < 60; n++) {
      const [x, z] = pick();
      if (canStand(x, z, 2) && cellPass(cellAt(x, z), 2) && (!needRoute || !dp || findPath(x, z, dp.x, dp.z, 2))) return { x, z };
    }
    const [x, z] = pick(); return { x, z };
  }
  if (MAP === 'mere' || MAP === 'plains') {
    // Meadowmere: the north causeway at the top edge; from night 3 some on the east causeway at the right edge
    // Horsefields: the north road; from night 2 some from the west edge, from night 3 some from the east edge too
    const r = Math.random(), W = PH.wave;
    const side = MAP === 'mere' ? (W >= 3 && r < .4 ? 'e' : 'n') : (W >= 3 && r < .3 ? 'e' : W >= 2 && r < .6 ? 'w' : 'n');
    const pick0 = MAP === 'mere' ? (side === 'e' ? () => [SIZE - 1.2, 30 + Math.random() * 4] : () => [33 + Math.random() * 6, 1.2])
      : side === 'e' ? () => [SIZE - 1.2, 23.5 + Math.random() * 6] : side === 'w' ? () => [1.2, 23.5 + Math.random() * 6] : () => [24.5 + Math.random() * 7, 1.2];
    const pick = () => edgeK(pick0());
    for (const needRoute of [true, false]) for (let n = 0; n < 60; n++) {
      const [x, z] = pick();
      if (canStand(x, z, 2) && cellPass(cellAt(x, z), 2) && (!needRoute || !dp || findPath(x, z, dp.x, dp.z, 2))) return { x, z };
    }
    const [x, z] = pick(); return { x, z };
  }
  if (MAP === 'crag' || MAP === 'ford') {
    // Ironcrag: the forest trail at the west edge; from night 3 some on the stream trail at the east edge
    // Siegeford: the north edge above the fords; from night 3 some on the gorge road at the west edge
    const late = PH.wave >= 3 && Math.random() < .4;
    const pick0 = MAP === 'crag' ? (late ? () => [SIZE - 1.2, 27.5 + Math.random() * 4] : () => [1.2, 8.5 + Math.random() * 4])
      : (late ? () => [1.2, 40.5 + Math.random() * 3.5] : () => [18 + Math.random() * 24, 1.2]);
    const pick = () => edgeK(pick0());
    for (const needRoute of [true, false]) for (let n = 0; n < 60; n++) {
      const [x, z] = pick();
      if (canStand(x, z, 2) && cellPass(cellAt(x, z), 2) && (!needRoute || !dp || findPath(x, z, dp.x, dp.z, 2))) return { x, z };
    }
    const [x, z] = pick(); return { x, z };
  }
  if (MAP === 'dune' || MAP === 'bend') {
    // Dunewell: over the dunes from the south edge; from night 3 some along the caravan road from the east edge
    // Riverbend: down to the north bridge from the north edge; from night 3 some up to the south bridge from the south edge
    // (a night's column comes from two points, startNight's side 0 and 1: on Riverbend's last night one is always the north, the other
    // the south (Jack: the last wave from both sides; by chance both could land on one side))
    const late = MAP === 'bend' && PH.wave >= NIGHTS && side !== undefined ? side === 1 : PH.wave >= 3 && Math.random() < .4;
    const pick = MAP === 'dune' ? (late ? () => [SIZE - 1.2, 21 + Math.random() * 4] : () => [30 + Math.random() * 12, SIZE - 1.2])
      : (late ? () => [15 + Math.random() * 10, SIZE - 1.2] : () => [18 + Math.random() * 10, 1.2]);
    for (const needRoute of [true, false]) for (let n = 0; n < 60; n++) {
      const [x, z] = pick();
      if (canStand(x, z, 2) && cellPass(cellAt(x, z), 2) && (!needRoute || !dp || findPath(x, z, dp.x, dp.z, 2))) return { x, z };
    }
    const [x, z] = pick(); return { x, z };
  }
  if (MAP === 'watch') {                         // up the gully from the east edge; from night 3 some down the ridge track from the north
    const north = PH.wave >= 3 && Math.random() < .4;
    for (const needRoute of [true, false]) for (let n = 0; n < 60; n++) {
      const [x, z] = north ? [39.5 + Math.random() * 6, 1.2] : [SIZE - 1.2, 37 + Math.random() * 6];
      if (canStand(x, z, 2) && cellPass(cellAt(x, z), 2) && (!needRoute || !dp || findPath(x, z, dp.x, dp.z, 2))) return { x, z };
    }
    return north ? { x: 42.5, z: 1.5 } : { x: SIZE - 1.5, z: 40 };
  }
  if (MAP === 'cross') {                         // the top of the north road; from night 3 some on the east road too
    const east = PH.wave >= 3 && Math.random() < .45;
    for (const needRoute of [true, false]) for (let n = 0; n < 60; n++) {
      const [x, z] = east ? [SIZE - 1.2, 22 + Math.random() * 6] : [24 + Math.random() * 6, 1.2];
      if (canStand(x, z, 2) && cellPass(cellAt(x, z), 2) && (!needRoute || !dp || findPath(x, z, dp.x, dp.z, 2))) return { x, z };
    }
    return east ? { x: SIZE - 1.5, z: 25 } : { x: 27, z: 1.5 };
  }
  if (MAP === 'bridge') {                        // the north edge: toward the bridge; from night 3 some from the north-east, toward the ford
    const ford = PH.wave >= 3 && Math.random() < .4;
    for (const needRoute of [true, false]) for (let n = 0; n < 80; n++) {
      const x = ford ? 40 + Math.random() * 14 : 10 + Math.random() * 24, z = 1.2;
      if (canStand(x, z, 2) && cellPass(cellAt(x, z), 2) && (!needRoute || !dp || findPath(x, z, dp.x, dp.z, 2))) return { x, z };
    }
    return { x: 22, z: 1.5 };
  }
  if (MAP === 'vale') {                          // the corridor's mouth, where it meets the top or right edge near the north-east corner
    const pts = [];
    for (let t = 1.2; t < SIZE - 1.2; t += .5) { if (valeAt(t, 1.2) > 1.4 && valeAt(t, 2.4) > 1.4) pts.push({ x: t, z: 1.2 }); if (valeAt(SIZE - 1.2, t) > 1.4 && valeAt(SIZE - 2.4, t) > 1.4) pts.push({ x: SIZE - 1.2, z: t }); }   // well inside the corridor
    for (const needRoute of [true, false]) for (let n = 0; n < 60 && pts.length; n++) {
      const p = pts[Math.floor(Math.random() * pts.length)];
      if (!needRoute || !dp || findPath(p.x, p.z, dp.x, dp.z, 2)) return p;
    }
    return { x: SIZE - 2, z: 2 };
  }
  if (MAP === 'pass') {                          // always the foot of the pass, on the bottom edge
    // with a route to the castle if there is one; walled off, anywhere open down there (they come up and break the walls),
    // never the old fallback in the mountains, where they stood stuck
    // scattered about the middle of the open span there (a bell curve over its middle half), not evenly across it
    const z = SIZE - 1.2; let x0 = 1e9, x1 = -1e9;
    for (let x = 1; x < SIZE - 1; x += .5) if (passOpen(x, z) && passOpen(x, z - 1)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    const mid = (x0 + x1) / 2, half = (x1 - x0) / 2;
    for (const needRoute of [true, false]) for (let n = 0; n < 120; n++) {
      const x = n < 90 ? mid + (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * half * .5 : x0 + Math.random() * (x1 - x0);
      if (passOpen(x, z) && passOpen(x, z - 1) && (!needRoute || !dp || findPath(x, z, dp.x, dp.z, 2))) return { x, z };
    }
    return { x: 27, z: SIZE - 1.5 };
  }
  // somewhere they can walk to the castle from; a walled-in town: somewhere they can reach by breaking walls (mode 3)
  for (const m of [2, 3]) for (let n = 0; n < 80; n++) {
    const side = Math.floor(Math.random() * 4), t = 2 + Math.random() * (SIZE - 4);
    const [x, z] = side === 0 ? [t, 1.2] : side === 1 ? [SIZE - 1.2, t] : side === 2 ? [t, SIZE - 1.2] : [1.2, t];
    if (hAt(x, z) > .5 && slopeAt(x, z) < 1.6 && buildings.every(B => distRect(B, x, z) > 10)
      && cellPass(cellAt(x, z), 2) && (!dp || findPath(x, z, dp.x, dp.z, m))) return { x, z };
  }
  return { x: 1.5, z: SIZE / 2 };
}
const arrowGeo = new THREE.BoxGeometry(.04, .04, .7), arrowMat = mat('#3a2a1a');
// where an archer's arrow leaves: the bow in the raised left hand
// archers: both hands meet at the bow for the draw just before a shot, then the string hand flies back
const DRAW = .45;
function bowPose(p, draw, loose, L0, R0) {
  const [l, r] = p.arms;
  if (draw) { l.rotation.set(-1.55, 0, .6); r.rotation.set(-1.42, 0, -.62); }
  else if (loose) { l.rotation.set(-1.5, 0, .6); r.rotation.set(-1.0, 0, .2); }
  else { l.rotation.set(L0, 0, 0); r.rotation.set(R0, 0, 0); }
}
// crossbowmen: the crossbow levelled at the shoulder with both hands to shoot; between shots it is held low to span and reload
function xbowPose(p, aim) {
  const [l, r] = p.arms;
  // aiming: the right hand on the grip, swung in toward the chest, the left hand up against the stock beside it
  if (aim) { l.rotation.set(-1.45, 0, .5); r.rotation.set(-1.5, 0, -.35); if (p.pivot) p.pivot.rotation.set(0, 0, .35); }
  else { l.rotation.set(-.5, 0, .3); r.rotation.set(-.45, 0, 0); if (p.pivot) p.pivot.rotation.set(0, 0, 0); }   // waiting: crossbow held low, the free hand still beside it
}
function xbowPoint(p) { xbowPose(p, true); p.g.updateMatrixWorld(true); return (p.pivot || p.arms[1]).localToWorld(new THREE.Vector3(-.06, -.38, .1)); }
function bowPoint(p) {
  p.arms[0].rotation.x = -1.5; p.arms[0].rotation.z = .6; p.g.updateMatrixWorld(true);
  return (p.pivot || p.arms[0]).getWorldPosition(new THREE.Vector3());
}
// kind: an arrow (default), 'qbolt' a crossbow's short bolt, 'bolt' a ballista's, 'stone' a catapult's (slow, high)
const CATA_SHOT = [.65, .95, 1.35];     // the catapult's stone grows with the engine (×.17 m)
const SHOT = { qbolt: { geo: new THREE.BoxGeometry(.035, .035, .42), speed: 26 }, bolt: { geo: new THREE.BoxGeometry(.075, .075, 1.3), speed: 25 },
  stone: { geo: new THREE.DodecahedronGeometry(.17, 0), speed: 13, m: M.stone2 } };
function fireArrow(from, to, onHit, arc, kind) {
  const K = SHOT[kind], m = new THREE.Mesh(K ? K.geo : arrowGeo, K && K.m || arrowMat); m.castShadow = true; m.position.copy(from); scene.add(m);
  const d = from.distanceTo(to);
  arrows.push({ m, from: from.clone(), to: to.clone(), t: 0, dur: Math.max(.25, d / (K ? K.speed : 22)), arc: arc || Math.min(3, d * .15), onHit, spin: kind === 'stone', kind });
  sfx(kind === 'bolt' ? 'bolt' : kind === 'qbolt' ? 'qbolt' : kind === 'stone' ? 'rockFire' : 'arrow', from);
  return m;
}
const tv = new THREE.Vector3();
function arrowPos(a, t, out) { out.lerpVectors(a.from, a.to, t); out.y += a.arc * 4 * t * (1 - t); return out; }
// a spent ballista bolt stays stuck in the ground, slanting, for a few seconds
const stuckBolts = [];
function stickBolt(at, dir) {
  const m = new THREE.Mesh(SHOT.bolt.geo, arrowMat); m.castShadow = true;
  m.position.set(at.x - dir.x * .35, at.y + .2, at.z - dir.z * .35); m.lookAt(at.x + dir.x, at.y - .6, at.z + dir.z); scene.add(m);
  stuckBolts.push({ m, t: 3 });
}
function updateArrows(dt) {
  for (let n = stuckBolts.length - 1; n >= 0; n--) { const s = stuckBolts[n]; if ((s.t -= dt) <= 0) { scene.remove(s.m); stuckBolts.splice(n, 1); } }
  for (let n = arrows.length - 1; n >= 0; n--) {
    const a = arrows[n]; a.t += dt / a.dur;
    const t = Math.min(a.t, 1); arrowPos(a, t, a.m.position); if (a.spin) a.m.rotation.x += dt * 6; else a.m.lookAt(arrowPos(a, Math.min(t + .03, 1.03), tv));
    if (a.t >= 1) { scene.remove(a.m); arrows.splice(n, 1); if (a.kind === 'stone') sfx('rockHit', a.to); a.onHit(); }
  }
}
// Arrow volley (castle card): arrows from the castle rain on a small circle anywhere; each enemy inside it takes the volley's
// damage, shared out over the arrows as they land; cooldown in game time
const VOLLEY = { cd: 20, n: [12, 18, 26], r: [2.2, 3, 3.8], dmg: [45, 65, 90], spread: .7 };   // per castle tier
const volleyR = () => VOLLEY.r[(castleB() || { tier: 1 }).tier - 1];
var volleyCd = 0, volleyAim = false, volleyQ = [], volleyRingT = 0;
const volleyLine = makeLine('#8fc1db', 1);
// the castle's manned archers loose the volley: each takes a share of the arrows, drawing high and shooting upward;
// with nobody on the posts it comes from the castle top
const volleyFigs = C => (C.figs || []).filter((f, a) => f && C.manned && C.manned[a]);
function castVolley(pt) {
  stats.volleys = (stats.volleys || 0) + 1;
  const C = castleB(); if (!C) return;
  const k = C.tier - 1, n = VOLLEY.n[k], R = VOLLEY.r[k], per = VOLLEY.dmg[k] / n, m = Math.max(1, volleyFigs(C).length), each = Math.ceil(n / m), gap = VOLLEY.spread / each;
  for (let i = 0; i < n; i++) volleyQ.push({ t: .35 + Math.floor(i / m) * gap + (i % m) * .05 + Math.random() * .05, fig: i % m, x: pt.x, z: pt.z, per, R });
  C.volley = { x: pt.x, z: pt.z, hold: .35 + VOLLEY.spread + .4 };
  volleyCd = VOLLEY.cd; drapeCircle(volleyLine, pt.x, pt.z, R); volleyRingT = VOLLEY.spread + 2.4;
}
// arms raised high toward the target: draw just before each shot, loose after it
function volleyPose(f, draw) {
  const [l, r] = f.arms; l.rotation.set(-2.35, 0, .6);
  if (draw) r.rotation.set(-2.2, 0, -.62); else r.rotation.set(-1.7, 0, .2);
}
// the castle's second ability (Jack): two of the town's riders, of the castle's tier, ride out of the castle for the night; the button
// then rallies them (tap it, then a spot); once both have fallen it waits SUMMON.cd s of game time before it can call two more; at dawn
// they ride back in and are gone. They are villagers marked summoned, posted to the castle (post.summon), never counted as the town's
// people (housing, idle, food), never respawned, and they hold the castle's rally flag
const SUMMON = { n: 2, cd: 20 }, HORSE_ICO = '<g transform="translate(12 0) scale(-1.3 1) translate(-12.6 0)"><path d="M10.6 4.3 L12 1.2 L12.4 4.2"/><path d="M14 4 L15.8 1.6 L15.4 5.7"/><path d="M10.6 4.3 C7.6 6.4 6.2 10 6.3 14.3 C6.4 18.4 9.2 21.4 12.6 22.9"/><path d="M15.4 5.7 C16.6 7.5 17.6 10.4 18 13.1 C18.3 14.2 19.3 14.6 18.9 15.8 C18.4 17.1 16.8 17.4 15.1 16.6"/><path d="M10 9.7 C10.8 12.6 12.6 15.2 15.1 16.6"/><path d="M12.9 14.9 C13.4 17.6 13.2 20.4 12.6 22.9"/></g>';
var summonCd = 0, summonOut = false;
const summoned = () => villagers.filter(v => v.summoned && !v.gone);
// the way the castle's door looks out; the riders' places either side in front of it
const faceAngle = B => { const [fx, fz] = faceRot(B.face || 0, 0, 1); return Math.atan2(fx, fz); };
// the keep's own door inside the courtyard (tiers 2-3); at tier 1 the hall door is the castle's inner door already
const keepDoor = B => { if (B.tier === 1) return null; const c = center(B), [x, z] = faceRot(B.face || 0, 0, .9 * CASTLE_K[B.tier - 1]); return { x: c.x + x, z: c.z + z }; };
const summonSpot = (B, a) => faceRot(B.face || 0, a === 1 ? -.75 : .75, .9);
function summonRiders() {
  const K = castleB(); if (!K) return;
  for (let a = 0; a < SUMMON.n; a++) {
    const v = makeVillager(K); v.summoned = true; v.inside = false; v.indoor = K;
    v.post = { B: K, a: a + 1, summon: true }; v.posted = true;
    soldierKit(v, K.tier, true); v.sbar = makeBar(.6); v.indoor = null; v.hideT = 0;
    // they ride out of the castle's door (widened for a horse) one after the other, the second unseen until its turn, and on to
    // their places side by side in front of the door, where they turn to face outward (updateSoldier)
    const g = innerDoor(K) || doorPoint(K), p = keepDoor(K) || g, dp = doorPoint(K), [ox, oz] = summonSpot(K, a + 1), out = { x: dp.x + ox, z: dp.z + oz };
    v.x = v.rx = v.tx = p.x; v.z = v.rz = v.tz = p.z; v.g.visible = a === 0; v.g.rotation.y = faceAngle(K);
    v.doorWalk = { x: p.x, z: p.z, hold: a * 1.1, on: u => { u.g.visible = true; }, next: p === g ? out : { x: g.x, z: g.z, next: out } };
  }
  summonOut = true; sfx('neigh'); log(`<b>${RIDER.names[K.tier - 1]}s</b> ride out`, 'good');
}
// dawn: back to the castle door at a trot, and gone
// dawn: back to the castle's door and in the way they came out: through the gate (or the hall door), then the keep's door, and gone
function rideHome(v, dt) {
  const K = castleB(); if (!K) { v.gone = true; return; }
  const dp = doorPoint(K);
  if (walkTo(v, dp.x, dp.z, dt, 1, .5, 1.6 * RIDER.speed) || v.noProg > 5) {
    const g = innerDoor(K) || dp, k = keepDoor(K), end = { hide: true, on: u => { u.gone = true; } };
    v.homeIn = true; v.doorWalk = k ? { x: g.x, z: g.z, next: { x: k.x, z: k.z, ...end } } : { x: g.x, z: g.z, ...end };
  }
}
function dropSummoned() {
  for (let n = villagers.length - 1; n >= 0; n--) { const v = villagers[n]; if (!v.summoned || !v.gone) continue; scene.remove(v.g); if (v.sbar) scene.remove(v.sbar.grp); villagers.splice(n, 1); }
}
function updateVolley(dt) {
  if (volleyCd > 0) volleyCd = Math.max(0, volleyCd - dt);
  if (summonCd > 0) summonCd = Math.max(0, summonCd - dt);
  dropSummoned();
  if (summonOut && !summoned().length) { summonOut = false; if (PH.kind === 'night') { summonCd = SUMMON.cd; log('<b>Riders</b> fallen', 'warn'); } const K = castleB(); if (K && K.rally) setRally(K, null); if (rallyFor === K) rallyFor = null; refreshCard(); }
  if (volleyRingT > 0) volleyRingT -= dt;
  if (volleyAim && PH.kind !== 'night') { volleyAim = false; refreshCard(); }
  if (!volleyAim && volleyRingT <= 0) volleyLine.visible = false;
  const C = castleB(), VQ = C && C.volley, figs = C ? volleyFigs(C) : [];
  if (VQ && (VQ.hold -= dt) <= 0) C.volley = null;
  for (let n = volleyQ.length - 1; n >= 0; n--) {
    const q = volleyQ[n]; if ((q.t -= dt) > 0) continue; volleyQ.splice(n, 1);
    const a = Math.random() * 6.283, r = q.R * Math.sqrt(Math.random()), tx = q.x + Math.cos(a) * r, tz = q.z + Math.sin(a) * r;
    const f = figs[q.fig % Math.max(1, figs.length)];
    let from;
    if (f) { f.g.rotation.y = Math.atan2(q.x - f.g.position.x, q.z - f.g.position.z); volleyPose(f, false); f.g.updateMatrixWorld(true); from = (f.pivot || f.arms[0]).getWorldPosition(new THREE.Vector3()); f.vLoose = .2; }
    else { const c = C ? center(C) : { x: KX, z: KZ }; from = new THREE.Vector3(c.x + (Math.random() - .5) * 3, (C ? C.group.position.y + DEF.castle.shootY[C.tier - 1] : 4), c.z + (Math.random() - .5) * 3); }
    const d = Math.hypot(tx - from.x, tz - from.z);
    fireArrow(from, new THREE.Vector3(tx, walkY(tx, tz) + .05, tz), () => { dustAt(tx, walkY(tx, tz), tz); for (const e of enemies) if (!e.dead && Math.hypot(e.x - q.x, e.z - q.z) < q.R) hurtEnemy(e, q.per); }, 3 + d * .25);
  }
  if (VQ && C.volley) figs.forEach((f, i) => {           // after updateDefense, so this pose wins while the volley lasts
    f.vLoose = Math.max(0, (f.vLoose || 0) - dt);
    const next = volleyQ.some(q => q.fig === i && q.t < .3);
    f.g.rotation.y = Math.atan2(VQ.x - f.g.position.x, VQ.z - f.g.position.z);
    volleyPose(f, next && !(f.vLoose > .1));
  });
}
// a raider falling grunts at most every 3 s (SFX_GAP); otherwise the thud of the arrow hit plays
// a siege engine broken: timbers fly, dust, a small shake; it slumps to one side and its crew fall
function engineWreck(e, y) {
  e.fallDir = Math.random() < .5 ? -1 : 1; shake(.08, e); sfx('destroyed', e);
  for (let i = 0; i < 12 && debris.length < 120; i++) {
    const sz = .07 + Math.random() * .12, o = box(sz, sz * .5, sz * (1.5 + Math.random() * 2), i % 3 ? M.timber : M.wood, e.x + (Math.random() - .5), y + .5 + Math.random() * .6, e.z + (Math.random() - .5));
    scene.add(o); debris.push({ o, vx: (Math.random() - .5) * 4, vy: 2.5 + Math.random() * 3, vz: (Math.random() - .5) * 4, life: 1.4 + Math.random() * .6, spin: (Math.random() - .5) * 12 });
  }
  for (let i = 0; i < 8; i++) dustAt(e.x + (Math.random() - .5) * 1.6, y, e.z + (Math.random() - .5) * 1.6);
}
// by: the building whose shot it was (crossbow towers and catapults pass it): a kill while any decor boosts it (Jack: not only the
// target range or siege stores: a torch or campfire's range counts too) goes toward Riverbend's and Siegeford's goals (stats.boostKills)
const BOOST_KEY = { crossbow: 'rangeArch', catapult: 'siegeRate' };
const DEF_FXT = t => !!DECOR_FX[t];
function hurtEnemy(e, d, by) {
  if (e.dead) return; e.hp -= d; e.flashT = .14;
  if (e.hp <= 0) {
    e.dead = true; e.bar.grp.visible = false; stats.slain++; const y = walkY(e.x, e.z);
    // a bounty for every raider slain (Kingdom Rush style): its tier in gold, a rider one more, an engine 4, a boss 40
    const bounty = ENEMY[e.kind].boss ? 40 : ENEMY[e.kind].engine ? 4 : (e.tier || 1) + (ENEMY[e.kind].mounted ? 1 : 0);
    res.gold += bounty; stats.gold += bounty; floatRes('gold', bounty, e.x, y + 1.6, e.z);
    if (by && BOOST_KEY[by.type] && !by.dead && (decorFx(center(by).x, center(by).z, BOOST_KEY[by.type]) > 0 || decorFx(center(by).x, center(by).z, 'range') > 0)) stats.boostKills[by.type] = (stats.boostKills[by.type] || 0) + 1;
    if (e.engine) { engineWreck(e, y); return; }
    sfx('grunt', e) || sfx('arrowHit', e); for (let i = 0; i < 5; i++) dustAt(e.x, y, e.z);   // a puff of dust as they fall
  }
}
// who goes for what: spearmen hit the nearest building, swordsmen and horse spearmen hunt towers and siege engines, horse
// swordsmen ride for the castle, archers, crossbowmen and the ballista aim past walls and gates at what lies behind them, the
// catapult goes for towers and engines, the ram for walls and gates
const NOT_WALL = B => B.type !== 'wall' && B.type !== 'gate';
// how many cells a raider at (x, z) must walk to each cell: over land and bridges (ends only), buildings counted as open
// (they break through); water with no bridge is Infinity. Targets are picked by this, never by a straight line across a river
function landField(x, z) {
  const f = new Float32Array(N * N).fill(Infinity), q = new Int32Array(N * N), s = cellAt(x, z); let h = 0, t = 0; f[s] = 0; q[t++] = s;
  while (h < t) {
    const c = q[h++], a = c % N, b = (c / N) | 0, bc = bridgeCell[c];
    for (let k = 0; k < 4; k++) {
      const na = a + ND[k][0], nb = b + ND[k][1]; if (na < 0 || nb < 0 || na >= N || nb >= N) continue;
      const nn = nb * N + na; if (f[nn] !== Infinity || !cellPass(nn, 3)) continue;
      const bn = bridgeCell[nn]; if (bc !== bn && ((bc && !bridges[bc - 1].ends.has(c)) || (bn && !bridges[bn - 1].ends.has(nn)))) continue;
      f[nn] = f[c] + 1; q[t++] = nn;
    }
  }
  return f;
}
// the nearest building by walking distance (straight-line distance only breaks ties); also where to stand: the cell beside it
// the raider reaches first, so e.tp is on the side they actually arrive at
function reachTarget(e, ok) {
  const f = e.field || (e.field = landField(e.x, e.z));
  let best = null, bd = Infinity, bc = -1;
  for (const B of buildings) {
    if (DEF[B.type].decor || (ok && !ok(B))) continue;
    let m = Infinity, mc = -1;
    for (const n of ringCells(B.ev)) if (f[n] < m) { m = f[n]; mc = n; }
    if (m === Infinity) continue;
    const d = m + distRect(B, e.x, e.z) * .01;
    if (d < bd) { bd = d; best = B; bc = mc; }
  }
  if (best) { const cx = (bc % N + .5) * CELL, cz = (((bc / N) | 0) + .5) * CELL; e.tpNew = { x: clamp(cx, best.ev.x0, best.ev.x1), z: clamp(cz, best.ev.z0, best.ev.z1) }; }
  return best;
}
const DEFENCE = B => B.type !== 'castle' && (DEF[B.type].archers || DEF[B.type].crew);
function pickTarget(e) {
  e.field = null; e.tpNew = null;
  const k = e.kind, any = () => reachTarget(e) || nearestBuilding(e.x, e.z);
  if (k === 'rider' || ENEMY[k].boss) { const K = castleB(); return K && reachTarget(e, B => B === K) || any(); }
  if (k === 'sword' || k === 'lancer') return reachTarget(e, DEFENCE) || any();
  if (k === 'archer' || k === 'xbow' || k === 'ballista') return reachTarget(e, NOT_WALL) || any();
  if (k === 'catapult') return reachTarget(e, DEFENCE) || reachTarget(e, NOT_WALL) || any();
  if (k === 'ram') { const K = castleB(); return reachTarget(e, B => WALLY[B.type]) || K && reachTarget(e, B => B === K) || any(); }
  return any();
}
const SHOOTER = { archer: 1, xbow: 1 }, SPEARS = k => RAIDER_TOOL[k] === 'spear';
// an engine's shot: the ballista's bolt flies dead straight from its bow; the catapult lobs its stone (sized by tier) high
function engineShot(e, B, c) {
  const tgt = B, dmg = e.dmg, to = new THREE.Vector3(c.x, B.group.position.y + .8, c.z);
  e.g.updateMatrixWorld(true);
  if (e.kind === 'ballista') {
    const from = e.turret.localToWorld(new THREE.Vector3(0, .6, .75));
    fireArrow(from, to, () => { hurtBuilding(tgt, dmg); dustAt(c.x, tgt.group.position.y, c.z); }, .01, 'bolt');
    e.load = 0; e.fireT = .35;
    for (let n = 0; n < e.tier; n++) dustAt(e.x + (Math.random() - .5), walkY(e.x, e.z), e.z + (Math.random() - .5));
  } else {
    const from = e.bolt ? e.bolt.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(e.x, e.g.position.y + 1.5, e.z), d = from.distanceTo(to);
    const m = fireArrow(from, to, () => { hurtBuilding(tgt, dmg); blastFx(c.x, c.z, e.tier, ENEMY.catapult.splash * .6); shake(.03 + .02 * e.tier, c); }, 3 + d * .25, 'stone');
    m.scale.setScalar(CATA_SHOT[e.tier - 1]);
    e.load = 0; e.fireT = .35; for (let n = 0; n < e.tier; n++) dustAt(e.x + (Math.random() - .5), walkY(e.x, e.z), e.z + (Math.random() - .5));
  }
}
// raider engines' crew (their figures stand in the engine's own frame, e.g): while it rolls both push from behind; once it is in
// range they walk to their work: the loader kneels at the winch and turns the crank, which draws the ballista's slider and string
// back by the pulley rope (the catapult's arm is winched down by its rope), and the reload only runs while he winds; the gunner
// holds the trigger line and yanks it to loose. The ram's pair drive the whole ram at the wall: they haul it back, run it in,
// it is knocked back by the blow, and they push it up again
const _cv = new THREE.Vector3(), _cw = new THREE.Vector3();
const ENG_LOAD = { ballista: .8, catapult: .75 };   // the winding takes this share of the engine's rate
function crewGo(c, x, z, dt) {
  const p = c.g.position, dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz), st = Math.min(d, dt * 1.3);
  if (d > 1e-4) { p.x += dx / d * st; p.z += dz / d * st; }
  c.going = d > .03; if (c.going) c.g.rotation.y = Math.atan2(dx, dz);
  return !c.going;
}
function crewFace(c, x, z) { const p = c.g.position; c.g.rotation.y = Math.atan2(x - p.x, z - p.z); }
// point a crewman's arm at a point in the world, worked out in the engine's frame (aimArm's maths)
function crewAim(e, c, arm, w) {
  e.g.worldToLocal(_cw.copy(w)); arm.getWorldPosition(_cv); e.g.worldToLocal(_cv);
  const y = c.g.rotation.y, dx = _cw.x - _cv.x, dz = _cw.z - _cv.z, dy = _cw.y - _cv.y;
  const fwd = dx * Math.sin(y) + dz * Math.cos(y), side = dx * Math.cos(y) - dz * Math.sin(y), L = Math.hypot(fwd, dy, side) || 1;
  arm.rotation.set(Math.atan2(-fwd, -dy), 0, clamp(side / L, -.8, .8));
}
// a rope from a point of its parent's frame to a crewman's hand
function crewRope(rope, a, c) { c.g.updateMatrixWorld(true); const h = c.arms[1].localToWorld(_cw.set(0, -.33, 0)); rope.parent.worldToLocal(h); setRope(rope, a, h); }
// one ram blow over p (0–1): the log's swing on its ropes (phi): the crew haul it back, drive it in faster and faster, the blow
// at p .55 knocks it back, and they push it up again
function ramSwing(p) {
  if (p < .35) return -.42 * sstep(0, .35, p);
  if (p < .55) { const u = (p - .35) / .2; return lerp(-.42, .2, u * u); }
  if (p < .75) return lerp(.2, -.08, sstep(.55, .75, p));       // a short bounce off the wall
  return lerp(-.08, 0, sstep(.75, 1, p));
}
const RAM_HIT = .55;
function animEngine(e, dt, sw) {
  e.g.updateMatrixWorld(true);
  const t = performance.now() / 1000, rig = e.rig || {}, back = -e.len / 2 - .32, k = rig.k || 1;
  const work = e.aiming && !e.walking && e.kind !== 'ram';
  if (e.load === undefined) e.load = 1;
  e.fireT = Math.max(0, (e.fireT || 0) - dt);
  const [L, G] = e.crew, pose = (c, lean, arms) => { c.body.rotation.x += (lean - c.body.rotation.x) * Math.min(1, dt * 8); c.arms.forEach(a => { a.rotation.x += (arms - a.rotation.x) * Math.min(1, dt * 8); a.rotation.z *= .8; }); };
  const legs = (c, on, ph) => { const s = on ? Math.sin(ph) * .55 : 0; c.legs[0].rotation.x = s; c.legs[1].rotation.x = -s; c.body.position.y = 0; };
  if (e.kind === 'ram') {
    // stationed at the wall the pair take the log's end and swing it on its ropes; rolling, they push the frame from behind
    const at = e.aiming && !e.walking, p = e.attackT > 0 ? 1 - e.attackT / RAM_T : 0, phi = at && e.attackT > 0 ? ramSwing(p) : 0;
    const v = (phi - (e.ramPhi || 0)) / Math.max(dt, 1e-3); e.ramPhi = phi;
    e.ram.position.set(0, RAM_Y + RAM_ROPE * (1 - Math.cos(phi)), RAM_ROPE * Math.sin(phi)); e.ropes.forEach(r => r.rotation.x = -phi);
    const endZ = e.ram.position.z - 1.05, endY = e.ram.position.y;           // the log's back end (frame of e.g)
    e.crew.forEach((c, i) => {
      const sx = i ? .2 : -.2;
      if (!at) {
        const there = crewGo(c, i ? .3 : -.3, back, dt); if (there) c.g.rotation.y = 0;
        kneel(c, 0); legs(c, e.walking || c.going, (e.walking ? e.phase : t * 9) + i * Math.PI);
        pose(c, e.walking ? .28 : 0, c.going ? -.3 : -1.35); c.atLog = false; return;
      }
      if (!c.atLog) { if (!crewGo(c, sx, endZ - .34, dt)) { kneel(c, 0); legs(c, true, t * 9 + i * Math.PI); pose(c, 0, -.3); return; } c.atLog = true; }
      const cz = c.g.position.z + (endZ - .34 - c.g.position.z) * Math.min(1, dt * 7);   // they step with the log, a little behind it
      c.g.position.set(sx, 0, cz); c.g.rotation.y = 0; kneel(c, 0);
      legs(c, Math.abs(v) > .3, t * (v > 1.5 ? 14 : 9) + i * Math.PI);           // stepping with the log
      c.body.rotation.x += ((p < .35 && e.attackT > 0 ? -.1 : p < .55 && e.attackT > 0 ? .3 : p < .75 && e.attackT > 0 ? .1 : .2) - c.body.rotation.x) * Math.min(1, dt * 10);
      c.g.updateMatrixWorld(true); const h = e.g.localToWorld(_cv.set(sx * .35, endY, endZ));   // both hands on the log's end
      crewAim(e, c, c.arms[0], h); crewAim(e, c, c.arms[1], h);
    });
    return;
  }
  // the reload runs only while the loader is at the winch
  const loaderAt = work && L && !L.going;
  const winding = loaderAt && e.load < 1 && e.fireT <= 0;
  if (winding) e.load = Math.min(1, e.load + dt / (e.rate * ENG_LOAD[e.kind]));
  e.crewReady = work && L && G && !L.going && !G.going;
  const yank = e.fireT > 0 ? Math.sin(Math.PI * clamp(1 - e.fireT / .35, 0, 1)) : 0;
  if (e.kind === 'ballista') {
    rig.statics.forEach(o => o.visible = false);
    const zs = e.fireT > 0 ? BAL_REST : lerp(BAL_REST, BAL_DRAWN, sstep(0, 1, e.load));
    rig.slider.position.z = zs;
    for (const [m, sx] of [[rig.bsL, -1], [rig.bsR, 1]]) { rA.set(sx * BAL_TIP[0], BAL_TIP[1], BAL_TIP[2]); rB.set(0, .585, zs); setRope(m, rA, rB); }
    if (e.bolt) { e.bolt.visible = e.load > .97 && e.fireT <= 0; e.bolt.position.z = zs + .325; }
    if (winding) rig.crank.rotation.x -= dt * 7;
    rA.set(0, .56, -.52); rB.set(0, .585, zs - .04); setRope(rig.prope, rA, rB); rig.prope.visible = winding || e.load > .97;
  } else {
    const [ck, th] = CATA_ARM[e.tier - 1], Rg = CATA_RIG[e.tier - 1];
    e.arm.rotation.x = e.fireT > 0 ? lerp(th, ck, Math.pow(e.fireT / .35, 2)) : lerp(th, ck, sstep(0, 1, e.load));
    if (e.bolt) e.bolt.visible = e.load > .6;
    rig.ammo.forEach(o => o.visible = !e.walking);
    if (winding) rig.crank.rotation.x -= dt * 6;
    if (rig.wrope) {                                 // drum to the arm; gone while the arm flies or it rolls
      const a = e.arm.rotation.x; rA.set(0, Rg.drum[1] + Rg.dr, Rg.drum[2]); rB.set(0, e.arm.position.y + Rg.armR * Math.cos(a), e.arm.position.z + Rg.armR * Math.sin(a));
      setRope(rig.wrope, rA, rB); if (e.fireT > 0 || !work) rig.wrope.visible = false;
    }
  }
  // the crew's spots (engine frame) and the points they work at
  let lx, lz, gx, gz, crankW, catchW;
  if (e.kind === 'ballista') {
    lz = -.52 * rig.k - .26; gz = lz - .06; lx = .14; gx = -.17;   // in between the rails, under the winch
    crankW = rig.crank.localToWorld(new THREE.Vector3(.21, .14, 0)); catchW = e.turret.localToWorld(new THREE.Vector3(0, .56, rig.slider.position.z - .05));
  } else {
    const Rg = CATA_RIG[e.tier - 1]; lx = Rg.loader[0] * k; lz = Rg.loader[1] * k; gx = Rg.gunner[0] * k; gz = Rg.gunner[1] * k;
    crankW = rig.crank.localToWorld(new THREE.Vector3(.1, Rg.cr, 0)); catchW = e.turret.localToWorld(new THREE.Vector3(...Rg.catch));
  }
  e.crew.forEach((c, i) => {
    const pushX = i ? .3 : -.3;
    if (!work) {                                      // pushing (or standing behind it, hands on the frame)
      const at = crewGo(c, pushX, back, dt);
      if (at) c.g.rotation.y = 0;
      kneel(c, 0); legs(c, e.walking || c.going, (e.walking ? e.phase : t * 9) + i * Math.PI);
      pose(c, e.walking ? .28 : 0, c.going ? -.3 : -1.35);
      return;
    }
    const [x, z] = i === 0 ? [lx, lz] : [gx, gz];
    if (!crewGo(c, x, z, dt)) { kneel(c, 0); legs(c, true, t * 9 + i * Math.PI); pose(c, 0, -.3); return; }
    e.g.worldToLocal(_cw.copy(i === 0 ? crankW : catchW)); crewFace(c, _cw.x, _cw.z);
    if (i === 0) {                                    // the loader at the crank, hands on the handle as it turns
      kneel(c, e.kind === 'catapult' ? .55 : .3); c.body.rotation.x = 0; c.g.updateMatrixWorld(true);
      const h = rig.crank.localToWorld(new THREE.Vector3(e.kind === 'ballista' ? .21 : .1, e.kind === 'ballista' ? .14 : CATA_RIG[e.tier - 1].cr, 0));
      crewAim(e, c, c.arms[1], h); crewAim(e, c, c.arms[0], h);
    } else {                                          // the gunner, the trigger line in both hands: a sharp pull looses it
      kneel(c, 0); legs(c, false, 0);
      c.arms[0].rotation.set(-1.0 + .6 * yank, 0, .12); c.arms[1].rotation.set(-1.05 + .6 * yank, 0, -.12); c.body.rotation.x = -.18 * yank;
    }
  });
  if (rig.trope) {                                    // the trigger line from the claw (ballista) or the catch (catapult) to the gunner
    if (work && G && !G.going) {
      if (e.kind === 'ballista') rA.set(0, .56, rig.slider.position.z - .05); else rA.set(...CATA_RIG[e.tier - 1].catch);
      crewRope(rig.trope, rA, G);
    } else rig.trope.visible = false;
  }
}
function updateEnemies(dt) {
  for (let n = enemies.length - 1; n >= 0; n--) {
    const e = enemies[n], E = ENEMY[e.kind];
    if (e.dead) {
      e.deadT += dt;
      if (E.engine) {                                       // slumps to one side and sinks; the crew fall
        e.model.rotation.z = e.fallDir * Math.min(.32, e.deadT * .9);
        e.crew.forEach(c => c.body.rotation.x = -Math.min(1.5, e.deadT * 4));
      } else e.body.rotation.x = -Math.min(1.5, e.deadT * 4);
      e.g.position.y = walkY(e.x, e.z) - Math.max(0, e.deadT - .8) * (E.engine ? 1.2 : .8);
      if (e.deadT > 1.9) { scene.remove(e.g); scene.remove(e.bar.grp); enemies.splice(n, 1); }
      continue;
    }
    e.walking = false; e.aiming = false; e.running = false;
    if (e.dormant && dormantStep(e, dt)) {} else {
    if (!e.target || e.target.dead || (e.retarget -= dt) < 0) {
      const t = pickTarget(e); if (t !== e.target) e.lob = false; e.target = t; e.retarget = 3;
      if (t) e.tp = e.tpNew || { x: clamp(e.x, t.ev.x0, t.ev.x1), z: clamp(e.z, t.ev.z0, t.ev.z1) };   // the side they reach first, fixed until the next retarget
    }
    const B = e.target, foe = !SHOOTER[e.kind] && !E.engine ? nearestSoldier(e.x, e.z, e.horse ? 2.6 : 2.2) : null;
    const strikeT = SPEARS(e.kind) ? SPEAR_T : SWORD_T;
    if (foe) {                                               // a soldier in the way: fight them first
      const d = Math.hypot(foe.x - e.x, foe.z - e.z), reach = Math.max(.75, e.range) + (e.horse ? .3 : 0);
      e.running = (!e.horse || e.kind === 'warlord') && d > reach;
      if (d > reach) steer(e, foe.x, foe.z, dt, 2, reach * .9, e.running ? 1.3 : 1);
      else { e.g.rotation.y = Math.atan2(foe.x - e.x, foe.z - e.z); if ((e.cool -= dt) <= 0) { e.cool = e.rate; e.attackT = strikeT; sfx('clash', e); hurtSoldier(foe, e.dmg); } }
    } else if (B) {
      const d = distRect(B, e.x, e.z), shoots = SHOOTER[e.kind] || e.kind === 'ballista' || e.kind === 'catapult';
      if (e.detour) { steer(e, e.detour.x, e.detour.z, dt, 2); if ((e.detour.t -= dt) < 0) e.detour = null; }
      else if (d > e.range + (e.lob ? 3.5 : 0)) {
        // the Warlord charges from further out (riders otherwise keep their pace)
        e.running = !shoots && !E.engine && (!e.horse || e.kind === 'warlord') && d < (e.horse ? 10 : 6);
        // route on the cell grid like villagers (round water, over bridges, round walls); straight in once close
        const tp = e.tp || { x: clamp(e.x, B.ev.x0, B.ev.x1), z: clamp(e.z, B.ev.z0, B.ev.z1) };
        const qx = clamp(e.x, B.ev.x0, B.ev.x1), qz = clamp(e.z, B.ev.z0, B.ev.z1), ql = Math.hypot(e.x - qx, e.z - qz) || 1;
        // straight in only over open ground (never across a stream or round a corner into a wall)
        if (d < 3 && clearLine(e.x, e.z, qx + (e.x - qx) / ql * .35, qz + (e.z - qz) / ql * .35, 2)) steer(e, qx, qz, dt, 2, e.range * .9, e.running ? 1.6 : 1);
        else walkTo(e, tp.x, tp.z, dt, 2, e.range * .9, e.running ? 1.6 : 1);
        if (e.stuck > 2 || e.noProg > 3.5) {
          const blk = nearestBuilding(e.x, e.z, E.engine ? 2.4 : 1.6);   // a wall is in the way: attack it
          if (blk && shoots && !NOT_WALL(blk) && d <= e.range + 3.5) e.lob = true;   // archers and engines shoot over it instead
          else if (blk) { e.target = blk; e.retarget = 8; }
          else if (E.engine || enemies.some(o => o !== e && !o.dead && Math.hypot(o.x - e.x, o.z - e.z) < 1.3 + (o.engine ? ENEMY[o.kind].r : 0))) { /* held up in a crowd (a queue at a bridge) or an engine: wait, don't wander off */ }
          else {                                             // a short step aside (never back the way they came), then on again
            const a = Math.atan2(tp.x - e.x, tp.z - e.z) + (Math.random() < .5 ? 1 : -1) * (1.2 + Math.random() * .5);
            e.detour = { x: clamp(e.x + Math.sin(a) * 1.8, 1, SIZE - 1), z: clamp(e.z + Math.cos(a) * 1.8, 1, SIZE - 1), t: 1.2 };
          }
          e.stuck = 0; e.prog = null; e.noProg = 0; e.path = null;
        }
      } else {
        const c = center(B), yaw = Math.atan2(c.x - e.x, c.z - e.z); e.aiming = true;
        if (E.engine) turnTo(e, yaw, dt * .35); else e.g.rotation.y = yaw;    // an engine wheels round slowly
        let ad = Math.abs(Math.atan2(Math.sin(yaw - e.g.rotation.y), Math.cos(yaw - e.g.rotation.y)));
        if ((e.cool -= dt) <= 0 && ad < .25 && (!ENG_LOAD[e.kind] || (e.crewReady && e.load >= 1))) {   // engines: crew at their posts, wound
          e.cool = e.rate;
          if (e.kind === 'archer') {
            e.attackT = .35; const tgt = B, dmg = e.dmg;
            fireArrow(bowPoint(e), new THREE.Vector3(c.x, B.group.position.y + 1.2, c.z), () => hurtBuilding(tgt, dmg));
          } else if (e.kind === 'xbow') {
            e.attackT = .35; const tgt = B, dmg = e.dmg;
            fireArrow(xbowPoint(e), new THREE.Vector3(c.x, B.group.position.y + 1.2, c.z), () => hurtBuilding(tgt, dmg), .3, 'qbolt');
          } else if (e.kind === 'ballista' || e.kind === 'catapult') engineShot(e, B, c);
          else if (e.kind === 'ram') { e.attackT = RAM_T; e.ramHit = B; }
          else { e.attackT = strikeT; sfx('attack', e); hurtBuilding(B, e.dmg); }
        }
        if (e.cool < 0) e.cool = 0;
      }
    }
    }
    if (e.kind === 'ram' && e.ramHit && e.attackT > 0 && 1 - e.attackT / RAM_T > RAM_HIT) {   // the ram strikes home
      const T = e.ramHit; e.ramHit = null;
      if (!T.dead) {
        hurtBuilding(T, e.dmg); sfx('ramHit', e); shake(.05, e);
        const hx = e.x + Math.sin(e.g.rotation.y) * 1.5, hz = e.z + Math.cos(e.g.rotation.y) * 1.5;
        for (let i = 0; i < 3; i++) dustAt(hx + (Math.random() - .5) * .5, walkY(hx, hz), hz + (Math.random() - .5) * .5);
      }
    }
    e.attackT = Math.max(0, (e.attackT || 0) - dt);
    if (e.flashT !== undefined) {                          // a red flash where an arrow lands
      const on = (e.flashT -= dt) > 0, m = on ? hitFlashM : e.baseTunic;
      if (e.torso && e.torso.material !== m) { e.torso.material = m; e.arms.forEach(a => a.userData.sleeve.material = m); }
      if (!on) e.flashT = undefined;
    }
    if (e.kind === 'warlord') { const now = performance.now(); if (e.running && !e.charging && !(e.neighT > now)) { sfx('neigh', e); e.neighT = now + 4000; } e.charging = e.running; }   // his horse neighs as the charge begins
    const sw = Math.sin(e.phase) * (e.running ? .95 : .6) * stride(e, dt, e.running ? 14 : E.engine ? 6 : 9);
    if (E.engine) animEngine(e, dt, sw);
    else {
      e.body.rotation.x = e.running && e.walking ? .22 : 0;      // leaning into the charge
      if (e.horse) horseGait(e.horseLegs, e.phase, e.amp || 0);
      else { e.legs[0].rotation.x = sw; e.legs[1].rotation.x = -sw; }
      if (e.kind === 'archer') bowPose(e, e.aiming && !(e.attackT > 0) && e.cool < DRAW, e.attackT > 0, -.35 - sw * .3, -sw * .6);
      else if (e.kind === 'xbow') xbowPose(e, e.aiming && (e.attackT > 0 || e.cool < .5));
      else if (SPEARS(e.kind)) { e.arms[0].rotation.x = -.55 - sw * .2; spearPose(e, e.attackT, sw); }   // level at the hip, thrust out
      else { e.arms[0].rotation.x = -.55 - sw * .2; swordPose(e, e.attackT, sw); }
    }
    smoothPos(e, dt, performance.now()); const y = walkY(e.rx, e.rz);
    e.g.position.set(e.rx, y < 0 ? y * .4 - .2 : y, e.rz);
    e.bar.grp.visible = e.hp < e.max; e.bar.set(e.hp / e.max); e.bar.grp.position.set(e.rx, e.g.position.y + e.barY, e.rz);
  }
}
// ---------- night watch: villagers walk to the castle and towers and shoot from the top ----------
const POSTS = {
  tower: [[.38, 3.19], [.31, 3.43], [.38, 4.7]].map(([x, y], i) => [[x, y * TOWER_K[i], 0], [-x, y * TOWER_K[i], 0]]),
  castle: [
    [[1.9, 2.55, 1.9], [-1.9, 2.55, 1.9], [1.9, 2.55, -1.9], [-1.9, 2.55, -1.9]],
    [[2.6, 3.55, 2.6], [-2.6, 3.55, 2.6], [2.6, 3.55, -2.6], [-2.6, 3.55, -2.6]],
    [[-.45, 4.8, -.4], [.45, 4.8, -.4], [0, 2.4, -2.1], [2.1, 2.4, 0], [-2.1, 2.4, 0]],   // two on the keep, one on each wall-walk except the gate side
  ].map((L, i) => L.map(([x, y, z]) => [x * CASTLE_K[i], y, z * CASTLE_K[i]])),
};
// crossbowmen on the fighting top; siege crews: the loader at the winch, the gunner behind (ballista on its deck, catapult on the ground)
POSTS.crossbow = XBOW_TOP.map(y => [[.3, y, .18], [-.3, y, -.18]]);
POSTS.ballista = BALLISTA_DECK.map((y, i) => [[.55 * BALLISTA_K[i], y, -.3], [-.2, y, -.7 * BALLISTA_K[i]]]);
POSTS.catapult = [[[.72, 0, -.4], [-.62, 0, .15]], [[.8, 0, -.45], [-.7, 0, .15]], [[-.85, 0, -.62], [.85, 0, .5]]];
function postOffset(B, a) { const L = POSTS[B.type][B.tier - 1], [x, y, z] = L[a % L.length], [rx, rz] = faceRot(B.face || 0, x, z); return [rx, y, rz]; }
function showDefender(B, a) {
  B.figs = B.figs || [];
  // the same armour on every defender of the tier; the weapon by post: bow, crossbow, or none for a siege crew
  if (!B.figs[a]) { const T = DEF[B.type]; B.figs[a] = makePerson({ tool: T.crew ? null : T.weapon || 'bow' }); armour(B.figs[a], B.tier); }
  const f = B.figs[a], o = postOffset(B, a), c = B.move ? B.group.position : center(B);
  f.g.position.set(c.x + o[0], B.group.position.y + o[1], c.z + o[2]); f.g.rotation.y = DEF[B.type].crew ? Math.atan2(-o[0], -o[2]) : Math.atan2(o[0] || .01, o[2] || .01); f.g.visible = true;
}
function hideDefenders(B) { (B.figs || []).forEach(f => f && !f.crewOf && scene.remove(f.g)); B.figs = (B.figs || []).map(f => f && f.crewOf ? f : null); }   // a villager crewing a catapult stays
// archer and crossbow towers (tiers 1-2) and every ballista are climbed by a ladder at the back; tier-3 towers have a door there
const onLadder = B => B.type === 'ballista' || ((B.type === 'tower' || B.type === 'crossbow') && B.tier < 3);
// how far up the ladder goes: from the ground at its foot to the deck the defenders stand on
function climbH(B, L) { return B.group.position.y + postOffset(B, 0)[1] - walkY(L.x, L.z); }
// climbing: hand over hand, knees up in turn, facing the ladder; up, they vanish over the top into their post; down, they step
// off and walk out to the tile behind
function updateClimb(v, dt) {
  const C = v.climb, B = C.B;
  if (B.dead || !buildings.includes(B) || !innerDoor(B)) { v.climb = null; v.g.visible = true; if (C.up) { v.posted = false; } return; }
  if (C.wait > 0) { C.wait -= dt; v.g.visible = false; return; }
  v.g.visible = true;
  const L = innerDoor(B), H = climbH(B, L), c = center(B), sp = .9;
  C.y = clamp(C.y + (C.up ? sp : -sp) * dt, 0, H);
  v.x = v.rx = L.x; v.z = v.rz = L.z; v.g.position.set(L.x, walkY(L.x, L.z) + C.y, L.z); v.g.rotation.y = Math.atan2(c.x - L.x, c.z - L.z);
  const ph = C.y * 7;
  v.legs[0].rotation.x = -.7 * Math.max(0, Math.sin(ph)); v.legs[1].rotation.x = -.7 * Math.max(0, -Math.sin(ph));
  v.arms[0].rotation.set(-2.6 - .3 * Math.sin(ph), 0, 0); v.arms[1].rotation.set(-2.6 + .3 * Math.sin(ph), 0, 0); v.body.rotation.x = 0; v.body.position.y = 0;
  if (v.pivot) v.pivot.visible = false;
  if (C.up && C.y >= H) { v.climb = null; v.g.visible = false; B.manned[C.a] = true; showDefender(B, C.a); }
  else if (!C.up && C.y <= 0) {
    v.climb = null; v.legs.forEach(l => l.rotation.set(0, 0, 0)); if (v.pivot) v.pivot.visible = true;
    const dp = doorPoint(B); v.doorWalk = { x: dp.x, z: dp.z }; v.state = v.build ? 'tobuild' : v.job ? 'commute' : 'find'; v.wait = .2;
  }
}
// a catapult's crew: the villager themself, at the engine; down on a knee to change into the tier's kit, then they man it
function crewUp(v, B, a) {
  B.figs = B.figs || []; const old = B.figs[a]; if (old && !old.crewOf) scene.remove(old.g);
  B.figs[a] = v; v.crewOf = B; v.crewT = CHANGE_T; v.crewSwap = false; v.g.visible = true;
}
function crewKit(v, tier) {
  if (v.kit) v.kit.forEach(o => o.parent && o.parent.remove(o));
  if (v.carryLog) v.carryLog.visible = v.carryStone.visible = false;
  v.kit = [...armour(v, tier)]; v.armour = null;
  if (v.pivot) { v.pivot.parent.remove(v.pivot); v.pivot = null; } v.toolKind = null;
}
// dawn: the crew kneel and change back where they stand, then go off to the day's work
function updateCrewStrip(v, dt) {
  v.changing = true; v.changeT = v.crewStrip;
  if ((v.crewStrip -= dt) <= CHANGE_T / 2 && v.kit) stripKit(v);
  if (v.crewStrip <= 0) { v.crewStrip = 0; v.changeT = 0; v.changing = false; v.state = v.build ? 'tobuild' : v.job ? 'commute' : 'find'; v.wait = .1; }
}
function postPoint(B, v) {
  if (B.door) return doorPoint(B);
  const c = center(B), r = B.ev.s + .8; let best = null, bd = 1e9;
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r; if (!canStand(x, z, 1)) continue; const d = Math.hypot(x - v.x, z - v.z); if (d < bd) { bd = d; best = { x, z }; } }
  return best || doorPoint(B);
}
function assignPosts() {
  const slots = [];
  // manned in priority order: the castle, then archer towers, then barracks with whoever is left (a barracks may go short)
  const rank = B => B.type === 'castle' ? 0 : DEF[B.type].archers ? 1 : DEF[B.type].crew ? 1.5 : 2;
  const order = buildings.filter(B => (DEF[B.type].archers || DEF[B.type].soldiers || DEF[B.type].crew) && B.built).sort((a, b) => rank(a) - rank(b));
  for (const B of order) { const T = DEF[B.type]; B.manned = B.manned || []; for (let a = 0; a < (T.archers || T.soldiers || T.crew)[B.tier - 1]; a++) if (!villagers.some(v => v.post && !v.post.fled && !v.post.summon && v.post.B === B && v.post.a === a)) slots.push({ B, a }); }
  let posted = 0;
  const free = () => villagers.filter(v => !v.post && !v.sleeping).length;
  for (const S of slots) {
    // a siege engine is no use half-crewed: its crew is posted as a pair or not at all
    if (DEF[S.B.type].crew && S.a === 0 && free() < 2 && !villagers.some(v => v.post && v.post.B === S.B)) continue;
    if (DEF[S.B.type].crew && S.a === 1 && !villagers.some(v => v.post && v.post.B === S.B && v.post.a === 0)) continue;
    const c = center(S.B); let best = null, bd = 1e9;
    for (const v of villagers) if (!v.post && !v.sleeping) { const d = Math.hypot(v.x - c.x, v.z - c.z) + (v.job ? 10 : 0); if (d < bd) { bd = d; best = v; } }
    if (!best) break;
    release(best); best.post = S; best.posted = false; S.p = postPoint(S.B, best); posted++;
    if (S.B.type === 'catapult' && S.B.turret) { const R = CATA_RIG[S.B.tier - 1], q = S.a ? R.gunner : R.loader; const w = engPt(S.B, q[0], 0, q[1]); S.p = standNear(w.x, w.z); }   // a catapult's crew walk right up to their own spot
    if (best.inside || best.hideT > 0) { best.inside = false; exitDoor(best); }
  }
  return { posted, open: slots.length - posted };
}
function killVillager(v) {
  if (v.post && v.posted && !v.post.fled && v.post.B.manned) { v.post.B.manned[v.post.a] = false; const f = v.post.B.figs && v.post.B.figs[v.post.a]; if (f) { scene.remove(f.g); v.post.B.figs[v.post.a] = null; } }
  release(v); scene.remove(v.g); villagers.splice(villagers.indexOf(v), 1);
  // like a fallen soldier, they come back after 60 s of daylight (homeless if their house is gone too)
  if (castleB()) respawns.push({ home: v.home, t: 60, homeless: !!v.homeless });
}

// ---------- the town's defenders: one look per tier for every defender (archers, barracks soldiers and the rest); only the weapon differs ----------
// tier 1: the villager's own clothes and a blue belt; tier 2: a quilted blue-grey gambeson, a skullcap; tier 3: mail under the blue
// surcoat, a steel helm, shoulder plates
function armour(p, tier) {
  if (p.armour) p.armour.forEach(o => o.parent && o.parent.remove(o));
  p.armour = []; const put = o => { o.castShadow = true; p.body.add(o); p.armour.push(o); return o; };
  const tun = tier === 3 ? mailM : tier === 2 ? gambesonM : p.baseTunic;
  p.torso.material = tun; p.arms.forEach(a => a.userData.sleeve.material = tun);
  if (p.hatG) p.hatG.visible = false; if (p.apron) p.apron.visible = false;
  if (tier === 1) put(cyl(.197, .197, .05, 10, kiteM, 0, .47, 0));
  if (tier === 2) { put(cyl(.205, .228, .13, 10, gambesonM, 0, .37, 0)); put(cyl(.197, .197, .045, 10, leatherM, 0, .5, 0)); put(makeHelm('skullcap')); }
  if (tier === 3) {
    put(cyl(.15, .214, .42, 8, kiteM, 0, .62, 0)); put(cyl(.17, .17, .05, 8, leatherM, 0, .55, 0)); put(makeHelm('soldier'));
    for (const sx of [-1, 1]) { const pl = put(new THREE.Mesh(new THREE.SphereGeometry(.085, 8, 5, 0, Math.PI * 2, 0, Math.PI * .5), steelM)); pl.position.set(sx * .19, .86, 0); pl.scale.set(1, .75, 1.1); }
  }
  return p.armour;
}
// ---------- barracks soldiers: villagers who muster at a barracks at night, gear up by its tier and fight raiders hand to hand ----------
const SOLDIER = { hp: [70, 100, 140], dmg: [7, 10, 14], rate: .9, names: ['Militia', 'Guard', 'Man-at-arms'] };
// the stables' riders: tougher and harder hitting, and they ride at RIDER.speed times a soldier's pace
const RIDER = { hp: [170, 240, 330], dmg: [9, 13, 18], rate: .8, speed: 2.1, names: ['Rider', 'Lancer', 'Knight'] };
const ridingM = mat('#2f4f86');   // the town's blue saddle cloth
const SQUAD = [[0, 0], [-.8, -.5], [.8, -.5]];      // where the three stand round their spot
var respawns = [], fallen = [];                     // fallen soldiers come back as villagers after 60 s of daylight
// the tier's armour (armour()); tier 1 militia: spear; tier 2 guard: spear and a round wooden shield; tier 3 man-at-arms: sword and a blue kite shield
function soldierKit(v, tier, cav) {
  if (v.kit) v.kit.forEach(o => o.parent && o.parent.remove(o));
  v.kit = []; v.kitTier = tier;
  const put = o => { o.castShadow = true; v.body.add(o); v.kit.push(o); return o; };
  if (v.carryLog) v.carryLog.visible = v.carryStone.visible = false;    // nobody marches out with a log
  v.kit.push(...armour(v, tier)); v.armour = null;
  if (tier > 1) { const sh = armShield(v, tier === 2 ? roundShield(.19, M.wood) : heaterShield(.3, .44, kiteM, steelM)); sh.castShadow = true; v.kit.push(sh); }
  if (v.pivot) v.pivot.parent.remove(v.pivot);
  v.toolKind = tier === 3 ? 'sword' : 'spear'; v.pivot = makeTool(v.toolKind); v.arms[1].add(v.pivot);
  v.soldier = true; v.cav = !!cav; v.maxHp = v.hp = (cav ? RIDER : SOLDIER).hp[tier - 1];
  if (cav && !v.horse) { mountHorse(v, ridingM); v.kit.push(v.horse); }
}
function stripKit(v) {
  if (v.kit) { v.kit.forEach(o => o.parent && o.parent.remove(o)); v.kit = null; }
  if (v.horse) { v.horse = null; v.horseLegs = null; v.body.position.y = 0; v.legs.forEach(l => l.rotation.set(0, 0, 0)); }
  v.soldier = false; v.cav = false; v.foe = null; giveTool(v, toolFor(v));
  if (v.sbar) v.sbar.grp.visible = false;
}
function nearestSoldier(x, z, r) { let best = null, bd = r; for (const v of villagers) if (v.soldier && v.g.visible) { const d = Math.hypot(v.x - x, v.z - z); if (d < bd) { bd = d; best = v; } } return best; }
// hold the barracks door (or the rally flag); go for raiders that come within 6 m of it, give up on any that lead them 9 m away
function updateSoldier(v, dt) {
  const B = v.post.B, k = v.kitTier - 1, S = v.cav ? RIDER : SOLDIER, walkK = 1 + decorFx(v.x, v.z, 'troopWalk'), ride = (v.cav ? RIDER.speed : 1) * walkK;
  v.attackT = Math.max(0, (v.attackT || 0) - dt); v.cool = (v.cool || 0) - dt;
  const base = (!v.post.fled && B.rally) || doorPoint(B), [ox, oz] = v.summoned && !B.rally ? summonSpot(B, v.post.a) : SQUAD[v.post.a % 3], hx = base.x + ox, hz = base.z + oz;
  if (v.skip && (v.skip.t -= dt) <= 0) v.skip = null;
  let foe = v.foe && !v.foe.dead && Math.hypot(v.foe.x - hx, v.foe.z - hz) < 9 ? v.foe : null;
  if (!foe) { let bd = 6; for (const e of enemies) if (!e.dead && (!v.skip || v.skip.e !== e)) { const d = Math.hypot(e.x - hx, e.z - hz); if (d < bd) { bd = d; foe = e; } } }
  if (foe !== v.foe) v.prog = null;
  v.foe = foe;
  if (foe) {
    const reach = (v.toolKind === 'spear' ? 1.15 : .9) + (foe.horse ? .3 : 0) + (foe.engine ? ENEMY[foe.kind].r : 0) + (v.cav ? .35 : 0), d = Math.hypot(foe.x - v.x, foe.z - v.z);
    if (d > reach) { walkTo(v, foe.x, foe.z, dt, 1, reach * .9, 1.25 * ride); if (v.noProg > 4) { v.skip = { e: foe, t: 4 }; v.foe = null; } }    // can't reach that one
    else { turnTo(v, Math.atan2(foe.x - v.x, foe.z - v.z), dt); if (v.cool <= 0) { v.cool = S.rate * (1 - decorFx(v.x, v.z, 'troopRate')); v.attackT = v.toolKind === 'spear' ? SPEAR_T : SWORD_T; hurtEnemy(foe, S.dmg[k] * (1 + decorFx(v.x, v.z, 'troopDmg'))); sfx('clash', v); } }
  } else if (Math.hypot(hx - v.x, hz - v.z) > .35) walkTo(v, hx, hz, dt, 1, .3, 1.3 * ride);
  // the castle's riders, at their place, face away from the castle (out of the door, or out from it at a rally flag)
  else if (v.summoned) { const c = center(B); turnTo(v, B.rally ? Math.atan2(hx - c.x, hz - c.z) : faceAngle(B), dt); }
}
// dawn: back to the barracks, in, out of the kit, out again to the day's work (a lost barracks: change where they stand)
// a change of job (or to and from building) means a change of clothes, on the spot: the villager stops, bends down,
// swaps outfit and tool at the bottom of the bend and straightens up (indoors it just happens); soldiers change at the barracks
const CHANGE_T = 1.1;
function updateChange(v, dt, want) {
  if (v.hideT > 0 || !v.g.visible) { giveTool(v, want); v.changeT = 0; return; }
  if (!(v.changeT > 0)) { v.changeT = CHANGE_T; v.swapped = false; release(v); v.path = null; }
  v.changing = true;
  if ((v.changeT -= dt) <= CHANGE_T / 2 && !v.swapped) { giveTool(v, want); v.swapped = true; }
  if (v.changeT <= 0) { v.changeT = 0; if (!v.swapped) giveTool(v, want); v.state = v.build ? 'tobuild' : v.job ? 'commute' : 'find'; v.wait = .1; }
}
function updateUnkit(v, dt) {
  const B = v.unkit, done = () => { stripKit(v); v.unkit = null; v.kitT = 0; v.state = v.build ? 'tobuild' : v.job ? 'commute' : 'find'; v.wait = .3; };
  if (B.dead || !buildings.includes(B)) { done(); return; }
  if (v.kitT > 0) { if (!v.g.visible && !v.doorWalk && (v.kitT -= dt) <= 0) { done(); v.indoor = B; exitDoor(v); } return; }
  const dp = doorPoint(B);
  if (walkTo(v, dp.x, dp.z, dt, 1, .4) || nearDoor(v, B, dp) || v.noProg > 6) { v.kitT = 1.2; v.indoor = B; goIn(v, B); }
}
function hurtSoldier(v, d) {
  if (!v.soldier) return;
  v.hp -= d;
  if (v.hp > 0) return;
  // fallen: out of the town's count; a villager comes back to the same home after 60 s of daylight
  if (v.horse) stripKit(v);
  if (v.summoned) { v.gone = true; v.soldier = false; release(v); villagers.splice(villagers.indexOf(v), 1); if (v.sbar) scene.remove(v.sbar.grp); fallen.push({ v, t: 0 }); return; }
  log(`<b>${(v.cav ? RIDER : SOLDIER).names[v.kitTier - 1]}</b> fallen`, 'warn'); stats.fallen++;
  if (v.post && !v.post.fled && v.post.B.manned) v.post.B.manned[v.post.a] = false;
  release(v); villagers.splice(villagers.indexOf(v), 1); if (v.sbar) scene.remove(v.sbar.grp);
  respawns.push({ home: v.home, t: 60 }); fallen.push({ v, t: 0 });
}
function updateFallen(dt) {
  for (let n = fallen.length - 1; n >= 0; n--) {
    const f = fallen[n], v = f.v; f.t += dt;
    v.body.rotation.x = -Math.min(1.5, f.t * 4); v.g.position.y = walkY(v.x, v.z) - Math.max(0, f.t - 1.2) * .6;
    if (f.t > 2.4) { scene.remove(v.g); fallen.splice(n, 1); }
  }
  if (PH.kind !== 'day') return;
  for (let n = respawns.length - 1; n >= 0; n--) {
    const r = respawns[n]; if ((r.t -= dt) > 0) continue;
    respawns.splice(n, 1);
    const H = r.home && !r.home.dead && buildings.includes(r.home) ? r.home : castleB();
    if (H) { const v = makeVillager(H); v.homeless = !!r.homeless || H !== r.home; assignJobs(); log('<b>Villager</b> back', 'good'); }
  }
}
// rally: the barracks card's Rally, then a tap on the ground; a blue flag marks the spot
var rallyFor = null;
// a catapult rolls, slowly (MOVE_SPEED m/s), to a tile picked after Move on its card: along a walkable route, cell by cell
// (it holds the cell it is in), the engine turned to its way; it can't shoot on the move, and stops short if the way is built over
var moveFor = null; const MOVE_SPEED = .45;
function startMove(B, ci, cj) {
  if (ci === B.ev.ci && cj === B.ev.cj) { B.move = null; return; }
  const own = B.ev.cj * N + B.ev.ci; occB[own] = null; regionDirty = true;
  const ev = evaluate(B.type, ci, cj, true), path = ev.ok ? findPath(center(B).x, center(B).z, (ci + .5) * CELL, (cj + .5) * CELL, 1) : null;
  occB[own] = B; regionDirty = true;
  if (!ev.ok) return setHint(ev.reason, 'bad');
  if (!path) return setHint('No way there', 'bad');
  const crewOn = B.manned && B.manned[0] && B.manned[1];
  if (PH.kind !== 'day' && !crewOn) return setHint('No crew', 'bad');
  // by night its crew pushes it; by day a villager has to come and push
  const was = B.move && B.move.pusher;                           // a new spot mid-move keeps the same pusher
  B.move = { pts: [...path, { x: (ci + .5) * CELL, z: (cj + .5) * CELL }], dest: { x: (ci + .5) * CELL, z: (cj + .5) * CELL }, wait: PH.kind === 'day', pusher: was || null }; setHint(PH.kind === 'day' ? 'Pusher coming' : 'Moving'); sfx('click');
}
// the nearest ground someone may stand on, from a spot that may be inside a building's cell
function standNear(x, z) {
  if (canStand(x, z, 1)) return { x, z };
  for (let r = .3; r < 3; r += .25) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (canStand(px, pz, 1)) return { x: px, z: pz }; }
  return { x, z };
}
// the villager who comes to push a siege engine by day: free, not hungry or carrying, idle ones first, then the nearest
function pickPusher(B) {
  const c = center(B); let best = null, bd = 1e9;
  for (const v of villagers) {
    if (v.post || v.soldier || v.unkit || v.hungry || v.sleeping || v.push || !v.g.visible || v.doorWalk || v.changeT > 0 || v.inside || v.hideT > 0 || v.carryLog.visible || v.carryStone.visible) continue;
    const d = Math.hypot(v.x - c.x, v.z - c.z) + (v.job || v.build ? 8 : 0); if (d < bd) { bd = d; best = v; }
  }
  if (best) { release(best); best.path = null; best.stuck = 0; best.prog = null; }
  return best;
}
// a pusher walks to the engine's back, then holds on behind it, walking, while it rolls; let go when it stops
function updatePush(v, dt) {
  const B = v.push;
  if (!B.move || B.dead || !buildings.includes(B)) {
    if (v.pushOn) { const p = standNear(v.x, v.z); v.x = p.x; v.z = p.z; }     // step off the engine's tile
    v.push = null; v.pushOn = false; v.pushIn = false; v.path = null; v.stuck = 0; v.prog = null; if (v.job) v.state = 'commute'; return;
  }
  if (!B.turret) return;
  const R = CATA_RIG[B.tier - 1], sp = engPt(B, R.push[0], 0, R.push[1]);
  if (!v.pushOn) {
    const d = Math.hypot(sp.x - v.x, sp.z - v.z);
    if (!v.pushIn) { const q = standNear(sp.x, sp.z); if (walkTo(v, q.x, q.z, dt, 1, .15) || Math.hypot(q.x - v.x, q.z - v.z) < .3 || (d < 1.6 && v.noProg > 1.5)) v.pushIn = true; return; }
    // the last bit onto the spot behind the engine, at a walk (the spot can be on the engine's own tile)
    const st = Math.min(d, dt * 1.1 * v.speed); if (d > 1e-3) { v.x += (sp.x - v.x) / d * st; v.z += (sp.z - v.z) / d * st; turnTo(v, Math.atan2(sp.x - v.x, sp.z - v.z), dt); }
    v.walking = true; if (d - st < .03) { v.pushOn = true; v.pushIn = false; }
    return;
  }
  v.x = sp.x; v.z = sp.z; v.walking = !B.move.wait; v.pushing = true; v.g.rotation.y = engYaw(B, [0, 0, 0], [0, 0, 1]);
}
// a blue flag in the middle of the tile an engine is rolling to, gone once it gets there (or the move ends)
const moveFlags = new Map();
function syncMoveFlags() {
  for (const [B, f] of moveFlags) if (!B.move || B.dead || !buildings.includes(B)) { scene.remove(f); moveFlags.delete(B); }
  for (const B of buildings) {
    const d = B.move && B.move.dest; if (!d) continue;
    let f = moveFlags.get(B);
    if (!f) { f = new THREE.Group(); f.add(box(.05, 1.5, .05, M.timber, 0, .75, 0)); f.add(flagBox(.46, .3, .03, M.flag, .25, 1.33, 0)); scene.add(f); moveFlags.set(B, f); }
    f.position.set(d.x, hAt(d.x, d.z), d.z);
  }
}
function updateMoves(dt) {
  syncMoveFlags();
  for (const B of buildings) {
    const mv = B.move; if (!mv || B.dead) continue;
    const crewOn = B.manned && B.manned[0] && B.manned[1];
    if (PH.kind !== 'day') { const u = mv.pusher; if (u) { if (u.pushOn) { const p = standNear(u.x, u.z); u.x = p.x; u.z = p.z; } u.push = null; u.pushOn = false; u.pushIn = false; mv.pusher = null; } mv.wait = !crewOn || (B.figs || []).some(f => f && (f.stepping || f.crewT > 0)); }   // the crew walk to their pushing spots first
    else if (!mv.pusher || mv.pusher.push !== B || !villagers.includes(mv.pusher)) {   // by day: wait for a villager to come and push
      mv.pusher = null; mv.wait = true;
      if ((mv.pickT = (mv.pickT || 0) - dt) <= 0) { mv.pickT = .5; const v = pickPusher(B); if (v) { v.push = B; v.pushOn = false; v.pushIn = false; mv.pusher = v; } }
    } else mv.wait = !mv.pusher.pushOn;
    if (mv.wait) continue;
    const g = B.group.position, p = mv.pts[0], dx = p.x - g.x, dz = p.z - g.z, d = Math.hypot(dx, dz), st = Math.min(d, MOVE_SPEED * dt);
    if (B.turret) B.turret.rotation.y += Math.atan2(Math.sin(Math.atan2(dx, dz) - B.group.rotation.y - B.turret.rotation.y), Math.cos(Math.atan2(dx, dz) - B.group.rotation.y - B.turret.rotation.y)) * Math.min(1, dt * 3);
    if (d > 1e-3) { g.x += dx / d * st; g.z += dz / d * st; g.y = hAt(g.x, g.z); }
    if (d - st < .02) mv.pts.shift();
    const n = cellAt(g.x, g.z), own = B.ev.cj * N + B.ev.ci;
    if (n !== own) {                                       // into the next cell: take it, or stop where it is if it is taken
      if ((occB[n] && occB[n] !== B) || bridgeCell[n]) { g.x = center(B).x; g.z = center(B).z; g.y = hAt(g.x, g.z); B.move = null; setHint('Blocked', 'bad'); continue; }
      occB[own] = null; occB[n] = B;
      const ci = n % N, cj = (n / N) | 0; Object.assign(B.ev, { ci, cj, x0: ci * CELL, z0: cj * CELL, x1: (ci + 1) * CELL, z1: (cj + 1) * CELL });
      regionDirty = true; villagers.forEach(v => v.path = null); rebuildRoads();
      if (selected === B) { select(B); rangeKey = ''; }
    }
    if (!mv.pts.length) { const c = center(B); g.set(c.x, hAt(c.x, c.z), c.z); B.move = null; }
    (B.manned || []).forEach((on, a) => on && showDefender(B, a));     // the crew walks with it
  }
}
function setRally(B, pt) {
  if (B.rallyFlag) scene.remove(B.rallyFlag);
  if (!pt) { B.rally = null; B.rallyFlag = null; return; }
  B.rally = { x: pt.x, z: pt.z };
  const f = new THREE.Group(); f.add(box(.05, 1.5, .05, M.timber, 0, .75, 0)); f.add(flagBox(.46, .3, .03, M.flag, .25, 1.33, 0));
  f.position.set(pt.x, hAt(pt.x, pt.z), pt.z); scene.add(f); B.rallyFlag = f;
}
function updateDefense(dt) {
  for (const B of buildings) {
    const T = DEF[B.type]; if (!T.range || !B.built) continue;
    if (T.crew) { updateSiege(B, T, dt); continue; }
    const k = B.tier - 1, n = T.archers[k], c = center(B), R = rangeOf(B);
    while (B.cool.length < n) B.cool.push(Math.random() * T.rate[k]);
    let best = null, bd = R;
    for (const e of enemies) if (!e.dead) { const d = Math.hypot(e.x - c.x, e.z - c.z); if (d < bd) { bd = d; best = e; } }
    (B.figs || []).forEach((f, a) => {
      if (!f) return;
      f.attackT = Math.max(0, (f.attackT || 0) - dt);
      const draw = best && !(f.attackT > 0) && B.cool[a] < DRAW;
      if (draw) f.g.rotation.y = Math.atan2(best.x - f.g.position.x, best.z - f.g.position.z);
      if (T.weapon === 'crossbow') xbowPose(f, draw || f.attackT > 0); else bowPose(f, draw, f.attackT > 0, -.9, -.6);
    });
    for (let a = 0; a < n; a++) {
      if (!(B.manned && B.manned[a])) continue;
      if ((B.cool[a] -= dt) > 0) continue;
      if (!best) { B.cool[a] = DRAW; continue; }
      B.cool[a] = T.rate[k] * (.9 + Math.random() * .2);
      const f = B.figs && B.figs[a];
      if (f) { f.g.rotation.y = Math.atan2(best.x - f.g.position.x, best.z - f.g.position.z); f.attackT = .3; }
      const from = f ? (T.weapon === 'crossbow' ? xbowPoint(f) : bowPoint(f)) : new THREE.Vector3(c.x, B.group.position.y + T.shootY[k], c.z);
      const lead = best.walking ? .5 : 0, to = new THREE.Vector3(best.x + Math.sin(best.g.rotation.y) * lead, best.g.position.y + .7, best.z + Math.cos(best.g.rotation.y) * lead);
      const tgt = best, dmg = T.dmg[k];
      fireArrow(from, to, () => hurtEnemy(tgt, dmg, B), T.weapon === 'crossbow' ? .3 : 0, T.weapon === 'crossbow' ? 'qbolt' : null);
    }
  }
}
// siege engines work only with both crew posted: the gunner turns the engine (or the ballista's swivel) onto the nearest raider
// in reach (not closer than minRange), it shoots when lined up, then the loader winches it back for the reload time
// a rope (a unit-tall box) stretched between two points in its parent's frame
const UPV = new THREE.Vector3(0, 1, 0), rA = new THREE.Vector3(), rB = new THREE.Vector3(), rC = new THREE.Vector3();
function setRope(m, a, b) { rC.subVectors(b, a); const L = rC.length(); m.visible = L > .01; if (!m.visible) return; m.position.addVectors(a, b).multiplyScalar(.5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(UPV, rC.divideScalar(L)); }
// point an arm (shoulder pivot) at a spot in the world: forward/down by rotation.x, a little sideways by rotation.z
function aimArm(f, arm, t) {
  arm.getWorldPosition(rA); const y = f.g.rotation.y, dx = t.x - rA.x, dz = t.z - rA.z, dy = t.y - rA.y;
  const fwd = dx * Math.sin(y) + dz * Math.cos(y), side = dx * Math.cos(y) - dz * Math.sin(y), L = Math.hypot(fwd, dy, side) || 1;
  arm.rotation.set(Math.atan2(-fwd, -dy), 0, clamp(side / L, -.8, .8));
}
// a point of the engine's own frame in the world
function engPt(B, x, y, z) { return B.turret.localToWorld(new THREE.Vector3(x, y, z)); }
const engYaw = (B, a, b) => { const p = engPt(B, ...a), q = engPt(B, ...b); return Math.atan2(q.x - p.x, q.z - p.z); };
// the catapult's crew: the loader kneels at the crank and turns it while the arm is winched down; the gunner holds the trigger line
// and yanks it to loose; on a move the gunner pushes from behind and the loader walks alongside; the winch rope and trigger line follow
function catapultCrew(B, k, crew, moving, dt, best) {
  B.group.updateMatrixWorld(true);
  const R = CATA_RIG[k], rig = B.rig, e = B.turret, now = performance.now() / 1000, gy = B.group.position.y;
  rig.ammo.forEach(o => o.visible = !moving);                      // the spare stones aren't carted along: they are back when it stops
  const winding = crew && B.cd > 0 && B.fireT <= 0 && !moving;
  if (winding) rig.crank.rotation.x -= dt * 6;
  if (rig.wrope) {                                                 // drum to the arm; slack and gone while the arm flies
    const th = B.arm.rotation.x; rA.set(0, R.drum[1] + R.dr, R.drum[2]); rB.set(0, B.arm.position.y + R.armR * Math.cos(th), B.arm.position.z + R.armR * Math.sin(th));
    setRope(rig.wrope, rA, rB); if (B.fireT > 0 || moving) rig.wrope.visible = false;
  }
  const figs = B.figs || [], L = figs[0] && figs[0].g.visible ? figs[0] : null, G = figs[1] && figs[1].g.visible ? figs[1] : null, roll = !!B.move && PH.kind !== 'day';
  // the crew are villagers: they step the last bit onto their spot (never a jump), and kneel to change before they man it
  const place = (f, x, z) => {
    const p = engPt(B, x, 0, z);
    if (f.crewOf) {                                             // walk there (to the pushing spots too): never a slide
      const dx = p.x - f.x, dz = p.z - f.z, d = Math.hypot(dx, dz), st = Math.min(d, dt * (moving ? 1.3 : 1.2)); f.x += d > 1e-4 ? dx / d * st : 0; f.z += d > 1e-4 ? dz / d * st : 0;
      f.stepping = d > .03 && !(moving && d < .25); if (f.stepping && d > .15) f.g.rotation.y = Math.atan2(dx, dz);
    }
    else { f.x = p.x; f.z = p.z; f.stepping = false; }
    f.rx = f.x; f.rz = f.z; f.g.position.set(f.x, f.crewOf ? walkY(f.x, f.z) : gy, f.z);
  };
  const changing = f => {
    if (!(f.crewT > 0)) return false;
    const k = Math.sin(Math.PI * clamp(1 - f.crewT / CHANGE_T, 0, 1));
    if ((f.crewT -= dt) <= CHANGE_T / 2 && !f.crewSwap) { crewKit(f, B.tier); f.crewSwap = true; }
    kneel(f, k); f.arms[0].rotation.set(-1.0 * k, 0, 0); f.arms[1].rotation.set(-1.0 * k, 0, 0); f.body.rotation.x = .22 * k;
    if (f.crewT <= 0) { f.crewT = 0; kneel(f, 0); f.body.rotation.x = 0; }
    return true;
  };
  const walkLegs = (f, on) => { const sw = on ? Math.sin(now * 9) * .5 : 0; f.legs[0].rotation.set(sw, 0, 0); f.legs[1].rotation.set(-sw, 0, 0); f.body.position.y = on ? Math.abs(Math.sin(now * 9)) * .04 : 0; };
  if (L && L.crewOf && L.crewT > 0) { place(L, ...R.loader); changing(L); }
  else if (L) {
    if (roll) { place(L, ...R.walk); if (!L.stepping) L.g.rotation.y = engYaw(B, [0, 0, 0], [0, 0, 1]); walkLegs(L, moving || L.stepping); L.body.rotation.x = 0; const sw = Math.sin(now * 9) * .4; L.arms[0].rotation.set(sw, 0, 0); L.arms[1].rotation.set(-sw, 0, 0); }
    else {
      place(L, ...R.loader); if (!L.stepping) L.g.rotation.y = engYaw(B, [R.loader[0], 0, R.loader[1]], [R.cx, 0, R.drum[2]]); walkLegs(L, L.stepping); if (!L.stepping) kneel(L, .55); L.body.rotation.x = 0;
      if (L.stepping) { const sw = Math.sin(now * 9) * .4; L.arms[0].rotation.set(sw, 0, 0); L.arms[1].rotation.set(-sw, 0, 0); }
      else { L.g.updateMatrixWorld(true); const h = rig.crank.localToWorld(new THREE.Vector3(.1, R.cr, 0)); aimArm(L, L.arms[1], h); aimArm(L, L.arms[0], h); }
    }
  }
  if (G && G.crewOf && G.crewT > 0) { place(G, ...R.gunner); changing(G); }
  else if (G) {
    if (roll) { place(G, ...R.push); if (!G.stepping) G.g.rotation.y = engYaw(B, [0, 0, 0], [0, 0, 1]); walkLegs(G, moving || G.stepping); const s = G.stepping ? Math.sin(now * 9) * .4 : 0; if (G.stepping) { G.arms[0].rotation.set(s, 0, 0); G.arms[1].rotation.set(-s, 0, 0); G.body.rotation.x = 0; } else { G.arms[0].rotation.set(-1.45, 0, .15); G.arms[1].rotation.set(-1.45, 0, -.15); G.body.rotation.x = .12; } }
    else {
      place(G, ...R.gunner); if (!G.stepping) G.g.rotation.y = engYaw(B, [R.gunner[0], 0, R.gunner[1]], R.catch); walkLegs(G, G.stepping);
      const yank = B.fireT > 0 ? Math.sin(Math.PI * clamp(1 - B.fireT / .35, 0, 1)) : 0;     // a sharp pull on the line looses the arm
      G.arms[0].rotation.set(-1.0 + .6 * yank, 0, .12); G.arms[1].rotation.set(-1.05 + .6 * yank, 0, -.12); G.body.rotation.x = -.18 * yank;
    }
  }
  if (rig.trope) {                                                 // the trigger line: from the catch to the gunner's hands
    if (G && !roll && !G.stepping && !(G.crewT > 0)) { G.g.updateMatrixWorld(true); const h = G.arms[1].localToWorld(new THREE.Vector3(0, -.33, 0)); e.worldToLocal(h); rA.set(...R.catch); setRope(rig.trope, rA, h); }
    else rig.trope.visible = false;
  }
}
// siege effects that grow with the tier, kept modest: a thump of dust (and from tier 2 a puff of smoke) as it looses, and at the
// strike dust thrown up round the spot, clods of earth flung out, and at tier 3 a darker plume
function bigPuff(x, y, z, col, k, life, dust) {
  if (puffs.length > 170) return;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: col, transparent: true, depthWrite: false, opacity: 0 }));
  sp.position.set(x, y, z); sp.scale.setScalar(.25 * k); scene.add(sp); puffs.push({ sp, t: 0, life, dx: (Math.random() - .5) * .3, dust, k });
}
function blastFx(x, z, tier, r) {
  const y = walkY(x, z);
  for (let n = 0; n < 2 + 2 * tier; n++) { const a = Math.random() * 6.28, d = Math.random() * r; bigPuff(x + Math.cos(a) * d, y + .05, z + Math.sin(a) * d, '#b9a582', .9 + .3 * tier, 1.2 + Math.random() * .6, true); }
  if (debris.length < 90) for (let n = 0; n < 1 + 2 * tier; n++) {
    const s = .05 + Math.random() * .05, o = box(s, s * .8, s, M.soil, x, y + .1, z); scene.add(o);
    debris.push({ o, vx: (Math.random() - .5) * (2 + tier), vy: 1.6 + Math.random() * (1 + tier), vz: (Math.random() - .5) * (2 + tier), life: .9 + Math.random() * .4, spin: (Math.random() - .5) * 12 });
  }
  if (tier === 3) for (let n = 0; n < 2; n++) bigPuff(x + (Math.random() - .5) * .6, y + .2, z + (Math.random() - .5) * .6, '#7a7064', 1.6, 1.8, false);
}
function siegeLaunchFx(B, from, dir) {
  const c = B.group.position, gy = c.y + (B.type === 'ballista' ? BALLISTA_DECK[B.tier - 1] : 0);
  for (let n = 0; n < B.tier; n++) bigPuff(c.x + (Math.random() - .5) * .9, gy + .05, c.z + (Math.random() - .5) * .9, '#b9a582', .8 + .2 * B.tier, 1, true);
  if (B.tier >= 2) bigPuff(from.x + dir.x * .3, from.y, from.z + dir.z * .3, '#d9d2c4', .6 + .25 * B.tier, .9, false);
}
// the ballista's crew on the deck, working the engine itself: the loader turns the winch, which hauls the slider (claw, string and
// all) back down the stock by the pulley rope; the bolt is laid in the groove once it is drawn; the gunner holds the trigger line
// from the claw and yanks it to loose, and the slider flies forward with the string
function ballistaCrew(B, k, crew, dt, loadK) {
  const rig = B.rig, t = B.turret; if (!rig.slider) return;
  rig.statics.forEach(o => o.visible = false);
  const winding = crew && B.cd > 0 && B.fireT <= 0;
  const zs = B.fireT > 0 ? BAL_REST : lerp(BAL_REST, BAL_DRAWN, sstep(0, 1, loadK));
  rig.slider.position.z = zs;
  for (const [m, sx] of [[rig.bsL, -1], [rig.bsR, 1]]) { rA.set(sx * BAL_TIP[0], BAL_TIP[1], BAL_TIP[2]); rB.set(0, .585, zs); setRope(m, rA, rB); }
  if (B.bolt) { B.bolt.visible = loadK > .97 && B.fireT <= 0; B.bolt.position.z = zs + .325; }
  if (winding) rig.crank.rotation.x -= dt * 7;
  if (rig.prope) { rA.set(0, .56, -.52); rB.set(0, .585, zs - .04); setRope(rig.prope, rA, rB); rig.prope.visible = winding || loadK > .97; }
  B.group.updateMatrixWorld(true);
  const figs = B.figs || [], L = figs[0] && figs[0].g.visible ? figs[0] : null, G = figs[1] && figs[1].g.visible ? figs[1] : null, gy = B.group.position.y + BALLISTA_DECK[k];
  const put = (f, x, z, fx, fz) => { const p = engPt(B, x, 0, z), q = engPt(B, fx, 0, fz); f.g.position.set(p.x, gy, p.z); f.g.rotation.y = Math.atan2(q.x - p.x, q.z - p.z); };
  if (L) {
    put(L, ...BAL_LOADER, .17, -.52); kneel(L, .3); L.body.rotation.x = 0; L.g.updateMatrixWorld(true);
    const h = rig.crank.localToWorld(new THREE.Vector3(.21, .14, 0)); aimArm(L, L.arms[1], h); aimArm(L, L.arms[0], h);
  }
  if (G) {
    put(G, ...BAL_GUNNER, 0, zs);
    const yank = B.fireT > 0 ? Math.sin(Math.PI * clamp(1 - B.fireT / .35, 0, 1)) : 0;
    G.arms[0].rotation.set(-1.0 + .6 * yank, 0, .12); G.arms[1].rotation.set(-1.05 + .6 * yank, 0, -.12); G.body.rotation.x = -.18 * yank;
  }
  if (rig.trope) {
    if (G) { G.g.updateMatrixWorld(true); const h = G.arms[1].localToWorld(new THREE.Vector3(0, -.33, 0)); t.worldToLocal(h); rA.set(0, .56, zs - .05); setRope(rig.trope, rA, h); }
    else rig.trope.visible = false;
  }
}
function updateSiege(B, T, dt) {
  const k = B.tier - 1, c = center(B), R = rangeOf(B), rate = siegeRate(B), mn = T.minRange || 0, crew = !!(B.manned && B.manned[0] && B.manned[1]) && !B.move && !(B.figs || []).some(f => f && f.crewT > 0);
  if (B.partsOn !== B.group) { B.partsOn = B.group; B.turret = B.arm = B.bolt = null; B.rig = { ammo: [], statics: [] }; B.group.traverse(o => { const u = o.userData; if (u.turret) B.turret = o; if (u.arm) B.arm = o; if (u.bolt) B.bolt = o; if (u.crank) B.rig.crank = o; if (u.wrope) B.rig.wrope = o; if (u.trope) B.rig.trope = o; if (u.ammo) B.rig.ammo.push(o); if (u.slider) B.rig.slider = o; if (u.bsL) B.rig.bsL = o; if (u.bsR) B.rig.bsR = o; if (u.prope) B.rig.prope = o; if (u.staticString) B.rig.statics.push(o); }); }
  if (B.cd === undefined) B.cd = rate;
  const moving = !!(B.move && !B.move.wait);
  if (moving) B.cd = rate;                                   // rolled unloaded, the arm let up; it is winched down again after
  if (crew && B.cd > 0) B.cd -= dt;
  B.fireT = Math.max(0, (B.fireT || 0) - dt);
  let best = null, bd = R;
  if (crew) for (const e of enemies) if (!e.dead) { const d = Math.hypot(e.x - c.x, e.z - c.z); if (d < bd && d >= mn) { bd = d; best = e; } }
  let aimed = false;
  if (best && B.turret) {
    const want = Math.atan2(best.x - c.x, best.z - c.z) - B.group.rotation.y, cur = B.turret.rotation.y;
    let da = Math.atan2(Math.sin(want - cur), Math.cos(want - cur)); const step = (B.type === 'catapult' ? .7 : 1.6) * dt;
    B.turret.rotation.y = cur + clamp(da, -step, step); aimed = Math.abs(da) < .12;
  }
  const loadK = clamp(1 - B.cd / rate, 0, 1);
  if (B.arm) { const [cock, thrown] = CATA_ARM[k]; B.arm.rotation.x = B.fireT > 0 ? lerp(thrown, cock, Math.pow(B.fireT / .35, 2)) : lerp(thrown, cock, sstep(0, 1, loadK)); }
  if (B.bolt && B.type !== 'ballista') B.bolt.visible = loadK > .6;
  if (B.type === 'catapult') catapultCrew(B, k, crew, moving, dt, best);
  else if (B.type === 'ballista') ballistaCrew(B, k, crew, dt, loadK);
  else (B.figs || []).forEach((f, a) => {
    if (!f || !f.g.visible) return;
    const [l, r] = f.arms;
    if (a === 0) { const w = B.cd > 0 && crew ? Math.sin(performance.now() / 140) : 0; l.rotation.set(-1.1 + w * .5, 0, 0); r.rotation.set(-1.1 - w * .5, 0, 0); f.g.rotation.y = Math.atan2(c.x - f.g.position.x, c.z - f.g.position.z); }
    else { l.rotation.set(-1.3, 0, .2); r.rotation.set(-1.3, 0, -.2); if (best) f.g.rotation.y = Math.atan2(best.x - f.g.position.x, best.z - f.g.position.z); }
  });
  if (!crew || !best || !aimed || B.cd > 0) return;
  B.cd = rate * (.92 + Math.random() * .16); B.fireT = .35;
  const yaw = B.group.rotation.y + B.turret.rotation.y, dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), dmg = T.dmg[k];
  if (B.type === 'ballista') {                                    // a bolt down the line: everyone within .7 m of it, out to full range
    B.turret.updateMatrixWorld(true); const from = B.turret.localToWorld(new THREE.Vector3(0, .6, .7));
    // the bolt drives into the ground just past its target: everyone along its line is hit, and the strike throws up earth round it
    const L = clamp(Math.hypot(best.x - from.x, best.z - from.z) + 1, 2, R), to = from.clone().addScaledVector(dir, L); to.y = walkY(to.x, to.z);
    const rad = T.splash[k];
    siegeLaunchFx(B, from, dir);
    fireArrow(from, to, () => {
      blastFx(to.x, to.z, B.tier, .7 + .25 * B.tier); shake(.03 + .02 * B.tier, { x: to.x, z: to.z }, 'bolt', .4);
      for (const e of enemies) if (!e.dead) {
        const ex = e.x - from.x, ez = e.z - from.z, u = clamp(ex * dir.x + ez * dir.z, 0, L), dl = Math.hypot(e.x - to.x, e.z - to.z);
        const hit = Math.hypot(ex - dir.x * u, ez - dir.z * u) < .7 ? dmg : dl < rad ? dmg * (1 - .5 * dl / rad) : 0;
        if (hit) hurtEnemy(e, hit);
      }
      stickBolt(to, dir);
    }, .001, 'bolt');                                                // dead straight: a heavy bolt, not an arrow's arc
  } else {                                                        // a stone lobbed high onto where they will be: everyone round it
    B.arm.updateMatrixWorld(true); const from = B.arm.localToWorld(new THREE.Vector3(0, B.tier === 3 ? 1.9 : 1.3, 0)); siegeLaunchFx(B, from, dir);
    const lead = best.walking ? 1.2 : 0, tx = best.x + Math.sin(best.g.rotation.y) * lead, tz = best.z + Math.cos(best.g.rotation.y) * lead, to = new THREE.Vector3(tx, walkY(tx, tz) + .1, tz), rad = T.splash[k];
    fireArrow(from, to, () => {
      for (const e of enemies) if (!e.dead) { const d = Math.hypot(e.x - tx, e.z - tz); if (d < rad) hurtEnemy(e, dmg * (1 - .5 * d / rad), B); }
      blastFx(tx, tz, B.tier, rad); shake(.05 + .03 * B.tier, { x: tx, z: tz }, 'stone', .4);
    }, Math.max(3, bd * .45), 'stone').scale.setScalar(CATA_SHOT[k]);
  }
}

// the living parts of the other economy picks, kept on whatever model the building has now (an upgrade swaps the model):
// the forester's grove grows by day and is felled tree by tree; the farmhouse animals wander the yard; the mine cart rolls out
// with each load and back
function ecoGroup(B) { if (!B.ecoG) B.ecoG = new THREE.Group(); if (B.ecoG.parent !== B.group) B.group.add(B.ecoG); return B.ecoG; }
function penSpot(B) {
  for (let n = 0; n < 14; n++) {
    const x = (Math.random() - .5) * 2.9, z = -.5 + Math.random() * 1.95;
    if (!OBST.farmhouse[B.tier].some(([ox, oz, hx, hz]) => Math.abs(x - ox) < hx + .2 && Math.abs(z - oz) < hz + .2)) return [x, z];
  }
  return [.3, .8];
}
function updateEco(dt) {
  const day = PH.kind === 'day';
  for (const B of buildings) {
    if (!B.built) continue;
    if (B.type === 'forester') {
      const T = DEF.forester, k = B.tier - 1, G = ecoGroup(B), c = center(B);
      B.grove = B.grove || [];
      while (B.grove.length < T.grove[k]) { const [lx, lz] = GROVE_AT[B.grove.length], m = makeGroveTree(); G.add(m); B.grove.push({ lx, lz, g: .2 + Math.random() * .4, m, grove: true, cut: true, claim: null }); }
      for (const t of B.grove) {
        if (day && t.g < 1) t.g = Math.min(1, t.g + dt / T.grow[k]);
        t.cut = t.g < 1; const [wx, wz] = faceRot(B.face || 0, t.lx, t.lz); t.x = c.x + wx; t.z = c.z + wz;
        t.m.position.set(t.lx, .07, t.lz); t.m.scale.setScalar((.22 + .78 * t.g) * GROVE_K); t.m.rotation.y = t.lx * 3.7;
      }
    } else if (B.type === 'farmhouse') {
      const G = ecoGroup(B);
      if (B.herdT !== B.tier) {
        B.herdT = B.tier; (B.herd || []).forEach(a => G.remove(a.m));
        B.herd = HERD[B.tier].map(kind => { const m = makeAnimal(kind), [x, z] = penSpot(B); G.add(m); return { kind, m, x, z, tx: x, tz: z, wait: Math.random() * 3, ph: Math.random() * 6 }; });
      }
      for (const a of B.herd) {
        const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
        if (d < .04) { if ((a.wait -= dt) <= 0) { [a.tx, a.tz] = penSpot(B); a.wait = 1.5 + Math.random() * 4; } }
        else { const st = Math.min(d, ANIMAL_SPEED[a.kind] * dt); a.x += dx / d * st; a.z += dz / d * st; a.m.rotation.y = Math.atan2(dx, dz); a.ph += dt * STEP_RATE[a.kind]; }
        // legs: hens step left-right, four-legged beasts in diagonal pairs; they settle when it stops
        const walk = d >= .04, swing = Math.sin(a.ph) * (a.kind === 'cow' ? .45 : .6);
        (a.m.userData.legs || []).forEach((l, i) => { const want = walk ? (a.kind === 'hen' ? (i ? -swing : swing) : ((i === 0 || i === 3) ? swing : -swing)) : 0; l.rotation.x += (want - l.rotation.x) * Math.min(1, dt * 12); });
        a.m.position.set(a.x, .07 + (d >= .04 ? Math.abs(Math.sin(a.ph)) * .02 : 0), a.z);
        if (a.kind === 'hen' && d < .04) a.m.rotation.x = Math.max(0, Math.sin(performance.now() / 300 + a.ph)) * .5;   // pecking
        else a.m.rotation.x = 0;
      }
    } else if (B.type === 'stables') {
      if (B.horseOn !== B.group) { B.horseOn = B.group; B.group.userData.horses = null; }
      animHorses(B.group, performance.now() / 1000);
    } else if (B.type === 'mine') {
      if (B.cartOn !== B.group) { B.cartOn = B.group; B.cart = null; B.group.traverse(o => { if (o.userData.cart) B.cart = o; }); }
      B.cartT = Math.max(0, (B.cartT || 0) - dt);
      if (B.hauler && (B.hauler.dead || !B.hauler.doorWalk)) B.hauler = null;
      const want = B.hauler ? 1 : B.cartT > 0 ? Math.sin(Math.PI * (1 - B.cartT / 2.4)) : 0;
      B.cartK = B.hauler ? Math.min(1, (B.cartK || 0) + dt * 1.2) : want;
      if (B.cart) B.cart.position.z = lerp(.75, 1.62, B.cartK);
    }
  }
}
