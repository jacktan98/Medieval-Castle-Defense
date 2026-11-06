// ---------- villagers ----------
// colour code: plain villagers brown, workers yellows, soldiers blue, raiders red
const tunics = ['#7a5434', '#8a6240', '#6b4a2e', '#956b44', '#7f5a3a', '#5f4229'].map(mat);   // plain villagers: homespun browns
const hairs = ['#3a2716', '#5a3a1e', '#2a221c', '#8a5a2e', '#b8894a', '#6b6b66'].map(mat);
const skin = mat('#d6a982'), hatM = mat('#6b5236'), legM = mat('#3a2e22');
// solid things inside a walkable plot (farm: hut, hay, scarecrow, barn, stooks; forester: hut; farmhouse: house, coop, sty, byre):
// [x, z, half-width, half-depth] from the plot centre, by tier
const OBST = {
  farm: { 1: [[-1.0, -1.2, .55, .4], [.9, -1.2, .3, .3]], 2: [[-1.0, -1.2, .55, .4], [-.15, -1.45, .28, .28], [1.1, -.9, .2, .2]], 3: [[-1.15, -1.15, .55, .45], [1.35, 1.35, .2, .2], [.75, 1.42, .2, .2]] },
  forester: { 1: [[-1.6, -2.15, .55, .42]], 2: [[-1.6, -2.15, .6, .45]], 3: [[-1.6, -2.15, .6, .45]] },
  farmhouse: { 1: [[-1.0, -1.15, .6, .45], [1.15, -1.3, .32, .28]], 2: [[-1.0, -1.15, .65, .5], [1.15, -1.3, .32, .28], [1.25, -.25, .4, .35]],
    3: [[-1.0, -1.15, .65, .5], [1.15, -1.3, .32, .28], [1.25, -.25, .4, .35], [-1.3, .75, .3, .55]] },
};
const FARM_OBST = OBST.farm;
function farmBlocked(B, x, z) { const L = OBST[B.type]; if (!L) return false; const c = center(B), [lx, lz] = unrot(B.face || 0, x - c.x, z - c.z); return L[B.tier].some(([ox, oz, hx, hz]) => Math.abs(lx - ox) < hx + .18 && Math.abs(lz - oz) < hz + .18); }
function canStand(x, z, mode) {   // mode 0 villager, 1 worker, 2 enemy
  if (x < .5 || z < .5 || x > SIZE - .5 || z > SIZE - .5) return false;
  if (nearRuin(x, z, 1.25) || sceneryAt(x, z)) return false;                         // Watchhill's old tower
  if (!mapOpen(x, z)) return false;                              // the mountains (and Greenvale's hills) are too steep for anyone
  { const i = bridgeCell[cellAt(x, z)]; if (i && onDeck(bridges[i - 1], x, z)) return true; }
  const h = hAt(x, z);
  if (h < (mode === 2 || mode === 1 ? .3 : .5)) return false;   // nobody wades: rivers are crossed by bridge
  const b = occB[cellAt(x, z)];
  if (b && !WALK[b.type] && !(b.type === 'gate' && mode !== 2)) return false;
  if (b && OBST[b.type] && farmBlocked(b, x, z)) return false;
  return slopeAt(x, z) < (mode ? 3.4 : 1.6);
}
// a tool held in the hand; its handle runs along the arm's line, so turning the arm swings the tool
function makeTool(kind) {
  const p = new THREE.Group(); p.position.set(0, -.33, 0);
  if (kind === 'bow') {                 // long axis along the hand's z, which points up when the arm is raised forward
    // a gentle C: six tapered segments on an arc whose tips bend towards the string
    const R = .7, TH = .54, SEG = 6;
    for (let n = 0; n < SEG; n++) {
      const f = -TH + (n + .5) * (2 * TH / SEG), w = .042 - Math.abs(f) / TH * .014;
      const sg = box(w, w, R * 2 * TH / SEG + .012, M.timber, 0, R - R * Math.cos(f), R * Math.sin(f)); sg.rotation.x = -f; p.add(sg);
    }
    const tipY = R - R * Math.cos(TH), tipZ = R * Math.sin(TH);
    p.add(box(.008, .008, tipZ * 2, M.canvas, 0, tipY, 0));
    return p;
  }
  if (kind === 'crossbow') {            // the hand holds the grip under the stock; the stock runs forward (−y with the arm raised) from a butt at the shoulder to a curved prod
    const SX = -.06, SZ = .055;          // the stock sits a little toward the other hand (which steadies it) and just above the grip
    p.add(box(.05, .66, .06, M.wood, SX, -.06, SZ));                                     // stock, butt to nose
    p.add(box(.06, .1, .08, M.wood, SX, .24, SZ - .01));                                 // butt
    const gr = box(.04, .05, .12, M.timber, SX * .5, 0, SZ * .35); gr.rotation.y = .45; p.add(gr);   // the grip, from the hand up into the stock
    p.add(box(.012, .04, .03, M.iron, SX, .05, SZ - .045));                              // trigger lever
    p.add(box(.012, .3, .012, M.dark, SX, -.2, SZ + .04));                               // a bolt on top
    const R = .3, TH = .78, SEG = 6, py = -.36;                                          // the prod: a bent bow, tips swept back
    for (let n = 0; n < SEG; n++) {
      const f = -TH + (n + .5) * (2 * TH / SEG), w = .045 - Math.abs(f) / TH * .016;
      const sg = box(R * 2 * TH / SEG + .012, w, w, M.timber, SX + R * Math.sin(f), py + R * (1 - Math.cos(f)), SZ); sg.rotation.z = f; p.add(sg);
    }
    const tx = R * Math.sin(TH), ty = py + R * (1 - Math.cos(TH)), ny = -.2;              // the string from each tip to the nut, spanned
    for (const sx of [-1, 1]) { const dx = sx * tx, dy = ty - ny, L = Math.hypot(dx, dy), st = box(.008, L, .008, ropeM, SX + dx / 2, ny + dy / 2, SZ + .01); st.rotation.z = Math.atan2(-dx, dy); p.add(st); }
    p.add(box(.07, .03, .07, M.iron, SX, -.42, SZ));                                     // the iron stirrup at the nose
    return p;
  }
  if (kind === 'spear') {               // long ash shaft with an iron head at the -y end (forward when the arm is raised)
    p.add(box(.03, 1.5, .03, M.timber, 0, -.25, 0));
    const tip = cone(.04, .18, 4, M.iron, 0, -1.08, 0); tip.rotation.x = Math.PI; p.add(tip);
    return p;
  }
  if (kind === 'sword') { p.add(box(.035, .12, .035, M.timber, 0, .03, 0)); p.add(box(.05, .035, .16, M.iron, 0, -.04, 0)); p.add(box(.025, .56, .05, M.iron, 0, -.34, 0)); p.rotation.x = -.4; return p; }
  p.add(box(.035, .64, .035, M.timber, 0, -.22, 0));
  if (kind === 'axe') p.add(box(.03, .16, .2, M.iron, 0, -.48, -.1));     // blade on the side that leads the swing
  if (kind === 'pick') { p.add(box(.035, .05, .46, M.iron, 0, -.52, 0)); }
  if (kind === 'hoe') p.add(box(.15, .02, .13, M.iron, 0, -.53, -.07));   // blade turned down towards the soil
  if (kind === 'hammer') p.add(box(.07, .09, .18, M.iron, 0, -.5, 0));
  if (kind === 'pail') { p.children.forEach(o => o.visible = false); p.add(cyl(.075, .058, .13, 8, M.wood, 0, -.08, 0)); p.add(cyl(.077, .077, .015, 8, M.iron, 0, -.04, 0)); }   // a feed pail in the hand (no handle shaft)
  return p;
}
// short hair: a cap over the crown and a fuller fall at the back; the face (+z) stays clear
function makeHair(m) {
  const h = new THREE.Group();
  const top = new THREE.Mesh(new THREE.SphereGeometry(.137, 12, 6, 0, Math.PI * 2, 0, Math.PI * .42), m); top.position.y = 1.035; h.add(top);
  const back = new THREE.Mesh(new THREE.SphereGeometry(.141, 12, 7, Math.PI, Math.PI, 0, Math.PI * .7), m); back.position.y = 1.03; h.add(back);
  h.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return h;
}
// headgear for soldiers and raiders, rounded rather than pointed
const steelM = mat('#a3aab2'), soldierBandM = teamMat(mat('#2d4f86'), 'town', '#2d4f86'), ironM = mat('#5b6067'), bandM = mat('#3b3129'), darkIronM = mat('#3e4248');
const mailM = mat('#8d939a'), kiteM = teamMat(mat('#3466b0'), 'town', '#3466b0');   // soldiers' mail; their blue shields and surcoat (plain: M.flag waves)
// tier-2 defenders' gambeson: blue-grey padded cloth quilted in rows (canvas texture)
function quiltTex(base, line) {
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 32, 32); x.fillStyle = line;
  for (let y = 3; y < 32; y += 8) x.fillRect(0, y, 32, 2);
  x.globalAlpha = .45; for (let k = 6; k < 32; k += 10) x.fillRect(k, 0, 1, 32);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.magFilter = THREE.NearestFilter;
  return t;
}
function quiltMat(base, line) { return new THREE.MeshStandardMaterial({ map: quiltTex(base, line), roughness: .95, flatShading: true }); }
const gambesonM = teamMat(quiltMat('#62789a', '#465a7a'), 'town', '#62789a', ['#62789a', '#465a7a']);
function makeHelm(kind) {
  const h = new THREE.Group(), add = o => { o.castShadow = true; h.add(o); return o; };
  if (kind === 'skullcap') {                 // tier 2 soldier: a plain steel skullcap riveted to a leather rim, ear flaps of the padded coif
    const d = add(new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 7, 0, Math.PI * 2, 0, Math.PI * .42), steelM)); d.position.y = 1.075; d.scale.y = .95;
    add(cyl(.152, .152, .035, 14, leatherM, 0, 1.08, 0));
    for (const sx of [-1, 1]) add(box(.03, .1, .09, gambesonM, sx * .135, 1.0, -.01));
  } else if (kind === 'soldier') {          // town archer: bright steel round helm, blue band, nose guard
    const d = add(new THREE.Mesh(new THREE.SphereGeometry(.153, 14, 7, 0, Math.PI * 2, 0, Math.PI * .55), steelM)); d.position.y = 1.045; d.scale.y = 1.12;
    add(cyl(.156, .156, .032, 14, soldierBandM, 0, 1.06, 0));
    add(box(.028, .12, .022, steelM, 0, 1.0, .148));
  } else if (kind === 'greathelm') {         // tier-3 raider: a closed dark iron helm, flat-topped, an eye slit and breaths, a cross on the face
    add(cyl(.158, .162, .27, 12, ironM, 0, 1.04, 0));
    const t = add(new THREE.Mesh(new THREE.SphereGeometry(.158, 12, 5, 0, Math.PI * 2, 0, Math.PI * .3), ironM)); t.position.y = 1.15; t.scale.y = .7;
    add(box(.2, .026, .03, M.dark, 0, 1.07, .152));
    add(box(.03, .17, .02, darkIronM, 0, 1.01, .162)); add(box(.2, .03, .02, darkIronM, 0, 1.105, .158));
    for (const sx of [-1, 1]) for (const y of [.97, 1.0]) add(box(.03, .012, .02, M.dark, sx * .07, y, .152));
  } else {                                   // tier-2 raider: dark iron dome with a riveted band, a nose guard and cheek guards
    const d = add(new THREE.Mesh(new THREE.SphereGeometry(.153, 14, 7, 0, Math.PI * 2, 0, Math.PI * .55), ironM)); d.position.y = 1.045; d.scale.y = 1.12;
    add(cyl(.156, .156, .032, 14, bandM, 0, 1.06, 0));
    add(box(.028, .12, .022, ironM, 0, 1.0, .148));
    for (const sx of [-1, 1]) { const c = add(box(.02, .1, .07, ironM, sx * .14, .98, .05)); c.rotation.y = sx * .25; }
  }
  return h;
}
const UNIT_K = .78;   // everyone drawn a little smaller so they fit through doors
function makePerson(opts) {
  const g = new THREE.Group(), body = new THREE.Group();
  const legs = [-.09, .09].map(x => { const l = box(.1, .4, .12, legM, x, 0, 0); l.geometry.translate(0, -.2, 0); l.position.y = .4; body.add(l); return l; });
  const tun = opts.tunic || tunics[Math.floor(Math.random() * tunics.length)];
  const torso = cyl(.14, .2, .5, 6, tun, 0, .65, 0); body.add(torso);
  const arms = [-1, 1].map(sx => {                     // shoulder pivot, sleeve, and a hand
    const a = new THREE.Group(); a.position.set(sx * .19, .86, 0);
    const sl = box(.075, .3, .075, tun, 0, -.15, 0); sl.rotation.z = sx * .08; a.add(sl); a.userData.sleeve = sl;
    const hd = new THREE.Mesh(new THREE.SphereGeometry(.048, 6, 5), skin); hd.position.set(sx * .012, -.33, 0); hd.castShadow = true; a.add(hd);
    body.add(a); return a;
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), skin); head.position.y = 1.03; head.castShadow = true; body.add(head);
  body.add(makeHair(opts.hair || hairs[Math.floor(Math.random() * hairs.length)]));
  let hatG = null; if (opts.helm) { hatG = makeHelm(opts.helm); body.add(hatG); }
  let pivot = null;
  if (opts.tool) { pivot = makeTool(opts.tool); (opts.tool === 'bow' ? arms[0] : arms[1]).add(pivot); }
  body.scale.setScalar((opts.scale || 1) * UNIT_K);
  g.add(body); scene.add(g);
  return { g, body, legs, arms, torso, hatG, baseTunic: tun, pivot, x: 0, z: 0, tx: 0, tz: 0, wait: Math.random() * 2, speed: .9 + Math.random() * .6, phase: Math.random() * 6, stuck: 0 };
}
// work clothes: each job has its own tunic, hat and (for masons and builders) a leather apron
// a checked (plaid) cloth: wide dark bands crossing a base colour, with a finer thread through the base
function plaidMat(base, band) {
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 32, 32);
  x.globalAlpha = .55; x.fillStyle = band; x.fillRect(0, 0, 32, 12); x.fillRect(0, 0, 12, 32);
  x.globalAlpha = .3; x.fillRect(20, 0, 2, 32); x.fillRect(0, 20, 32, 2);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.magFilter = THREE.NearestFilter;
  return new THREE.MeshStandardMaterial({ map: t, roughness: .9, flatShading: true });
}
const OUTFIT = {
  hoe:    { tunic: mat('#c2a64e'), hat: 'straw' },
  axe:    { tunic: plaidMat('#c9a227', '#4a3018'), hat: 'woolcap', hatM: mat('#45602f'), brimM: mat('#2f4321') },   // lumberjack: yellow and brown checked shirt
  pick:   { tunic: mat('#a8925e'), hat: 'flatcap', hatM: mat('#8c857a'), apron: true },
  hammer: { tunic: mat('#c98f2e'), hat: 'felt', hatM: mat('#6b4a2b'), belt: true },   // builders: amber smock, brown felt hat, tool belt
  pail:   { tunic: mat('#b8934a'), hat: 'coif', hatM: mat('#e6dcc6'), apron: true },  // herders (farmhouse): ochre smock, white linen coif, apron
};
const strawM = mat('#d2b56a'), leatherM = mat('#5a4630'), featherM = mat('#b8452c');
const apronM = (() => { const m = mat('#b9ae96'); m.side = THREE.DoubleSide; return m; })(), apronHemM = (() => { const m = mat('#ddd5c2'); m.side = THREE.DoubleSide; return m; })();
// workers dress by their workplace's tier: 1 their own clothes (the tool says the job), 2 the work tunic and a cloth cap,
// 3 the full outfit (hat, apron or belt); builders always wear theirs (v.outfitTier overrides, for the gallery)
function dress(v, kind) {
  const tier = v.outfitTier || (kind === 'hammer' || !v.job ? 3 : v.job.tier); v.dressT = tier;
  const O0 = OUTFIT[kind], O = O0 && tier === 3 ? O0 : null, tun = O0 && tier >= 2 ? O0.tunic : v.baseTunic;
  v.torso.material = tun; v.arms.forEach(a => a.userData.sleeve.material = tun);
  if (v.hatG) v.body.remove(v.hatG); v.hatG = null;
  if (v.apron) { v.body.remove(v.apron); v.apron = null; }
  const h = new THREE.Group();
  if (!O) { if (v.plainHat || (O0 && tier === 2)) { const c = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 5, 0, Math.PI * 2, 0, Math.PI * .5), hatM); c.scale.y = .72; c.position.y = 1.07; c.castShadow = true; h.add(c); } }
  else if (O.hat === 'straw') { h.add(cyl(.28, .28, .025, 12, strawM, 0, 1.13, 0)); h.add(cyl(.12, .14, .13, 10, strawM, 0, 1.2, 0)); }
  else if (O.hat === 'woolcap') {          // woodsman: round green wool cap, thick rolled brim, a feather tucked in the side
    const cr = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 6, 0, Math.PI * 2, 0, Math.PI * .5), O.hatM); cr.position.y = 1.07; cr.scale.y = 1.1; cr.castShadow = true; h.add(cr);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.148, .035, 6, 14), O.brimM); rim.rotation.x = Math.PI / 2; rim.position.y = 1.075; rim.castShadow = true; h.add(rim);
    const fe = box(.012, .17, .045, featherM, .15, 1.2, -.04); fe.rotation.z = -.45; fe.rotation.x = .25; h.add(fe);
  }
  else if (O.hat === 'flatcap') {           // mason: soft cloth bonnet, puffed and slumped to one side over a leather band
    h.add(cyl(.142, .142, .05, 12, leatherM, 0, 1.115, 0));
    const top = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 6), O.hatM); top.scale.set(1, .38, 1); top.position.set(.03, 1.17, -.01); top.rotation.z = -.16; top.castShadow = true; h.add(top);
  }
  else if (O.hat === 'coif') {             // herder: a close linen coif over the hair, tied under the chin
    const cf = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 7, 0, Math.PI * 2, 0, Math.PI * .62), O.hatM); cf.position.y = 1.035; cf.castShadow = true; h.add(cf);
    h.add(box(.2, .025, .04, O.hatM, 0, .93, .08));
  }
  else if (O.hat === 'felt') { h.add(cyl(.2, .2, .03, 10, O.hatM, 0, 1.12, 0)); h.add(cyl(.12, .13, .11, 10, O.hatM, 0, 1.19, 0)); }
  v.body.add(h); v.hatG = h;
  if (O && O.apron) {                       // mason's canvas apron: curved round the front of the body, waist tie and a chalk-pale hem
    v.apron = new THREE.Group();
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(.17, .216, .4, 12, 1, true, -Math.PI / 3, Math.PI * 2 / 3), apronM); cloth.position.y = .56; cloth.castShadow = true; v.apron.add(cloth);
    const hem = new THREE.Mesh(new THREE.CylinderGeometry(.216, .218, .04, 12, 1, true, -Math.PI / 3, Math.PI * 2 / 3), apronHemM); hem.position.y = .37; v.apron.add(hem);
    v.apron.add(cyl(.176, .176, .045, 12, leatherM, 0, .77, 0));
    v.body.add(v.apron);
  }
  else if (O && O.belt) {                    // leather tool belt with a pouch and a spare chisel
    v.apron = new THREE.Group();
    v.apron.add(cyl(.192, .196, .06, 10, leatherM, 0, .47, 0));
    v.apron.add(box(.09, .11, .05, leatherM, .12, .42, .16));
    v.apron.add(box(.02, .14, .02, M.iron, -.13, .42, .16));
    v.body.add(v.apron);
  }
}
function giveTool(v, kind) {
  if (v.torso) dress(v, kind);
  if (v.pivot) v.pivot.parent.remove(v.pivot); v.pivot = null; v.toolKind = kind || null;
  if (!kind) return;
  const p = makeTool(kind); v.arms[1].add(p); v.pivot = p;
}
const JOB_TOOL = { lodge: 'axe', forester: 'axe', quarry: 'pick', mine: 'pick', farm: 'hoe', farmhouse: 'pail' };
// down on one knee by c (0 standing … 1 kneeling): body lowered, front leg forward, back leg behind
function kneel(p, c) { p.body.position.y = -.2 * c; p.legs[0].rotation.x = -1.3 * c; p.legs[1].rotation.x = .6 * c; }
// working swings (t in seconds): right arm R, free arm L, tool tilt, body lean; w is the swing sine (a strike sounds as it passes +0.85)
// one work stroke over a cycle p (0–1): a slow eased wind-up (w 0 → -1, tool raised), a fast strike (→ +1), a short hold at
// impact, then the recovery back to 0; w passing +0.85 is the hit (sound, chips)
function stroke(p) { return p < .5 ? -sstep(0, .5, p) : p < .62 ? lerp(-1, 1, Math.pow((p - .5) / .12, 1.6)) : p < .72 ? 1 : 1 - sstep(.72, 1, p); }
const TOOL_POSE = {
  // chopping: the whole body twists away on the wind-up and into the trunk on the blow; the free arm steadies
  axe: t => { const w = stroke(t / 1.1 % 1); return { w, R: -1.85 + w * .75, L: -.35 - w * .15, tilt: -.6, lean: .06, twist: -.35 * w }; },   // lands at chest height on the trunk
  // pick and hoe work low (crouch → kneel(); the figure only bends at the ground, so a forward lean would tip it over):
  // the mason rises as the pick goes up and drops onto his knee as it lands
  pick: t => { const w = stroke(t / 1.25 % 1); return { w, R: -1.5 + w, L: -.35 - w * .15, tilt: -.75, lean: .06, crouch: .2 + .55 * (w + 1) / 2 }; },
  // the farmer lifts the hoe, chops it into the soil, then drags it back towards himself (the recovery), crouched throughout
  hoe: t => { const w = stroke(t / 1.05 % 1); return { w, R: -.85 + w * .35, L: -.25, tilt: -.32, lean: .1, crouch: .5 + .25 * Math.max(w, 0), twist: -.1 * w }; },
  // herders kneel to the animals and scatter feed low from the pail: down on a knee, the hand sweeping out and back near the ground, rising a little now and then
  pail: t => { const s = Math.sin(t * 3.1), c = .5 + .5 * Math.sin(t * .8); return { w: -.5, R: -.6 + .35 * s, L: -.35, tilt: -.1, lean: .05, crouch: .65 + .3 * c, twist: .15 * s }; },
  // builders: three light taps and a big blow; half of them kneel to work low (by seed), the rest stand
  hammer: (t, seed = 0) => {
    const p = t / 1.9 % 1, big = p >= .6, w = stroke(big ? (p - .6) / .4 : p / .2 % 1), amp = big ? .85 : .4;
    return { w, big, R: -1.25 + w * amp, L: -.75, tilt: -.95, lean: .1, crouch: Math.sin(seed * 12.9) > 0 ? .55 : 0 };
  },
};
// chips thrown up at each hit: wood from an axe, stone from a pick, clods from a hoe, splinters from a hammer
const CHIP = { axe: ['#c9a271', .9, 6], pick: ['#a39d8f', .12, 6], hoe: ['#6b5236', .06, 5], hammer: ['#d8c49a', .5, 3] };   // colour, height of the hit, count
const chipGeo = new THREE.BoxGeometry(.045, .03, .045), chipMats = {}, chips = [];
function chipBurst(v, kind, big) {
  const c = CHIP[kind]; if (!c || chips.length > 120) return;
  const a = v.g.rotation.y, x = (v.rx ?? v.x) + Math.sin(a) * .6, z = (v.rz ?? v.z) + Math.cos(a) * .6, g = hAt(x, z);
  const m0 = chipMats[kind] = chipMats[kind] || mat(c[0]);
  for (let n = 0; n < c[2] * (big ? 1.7 : 1); n++) {
    const m = new THREE.Mesh(chipGeo, m0); m.position.set(x, g + c[1], z); m.rotation.set(Math.random() * 6, Math.random() * 6, 0); scene.add(m);
    chips.push({ m, g, vx: (Math.random() - .5) * 1.6, vy: 1 + Math.random() * 1.4, vz: (Math.random() - .5) * 1.6, t: 0, life: .6 + Math.random() * .35 });
  }
}
// tiny splashes where the water laps the bank: a few white droplets hop up from a random shoreline point
const splashM = new THREE.MeshBasicMaterial({ color: '#e6f0f0', transparent: true, opacity: .9, toneMapped: false });
let shore = [], splashT = 0;
function genShore() {
  shore = [];
  for (let z = .5; z < SIZE; z += .5) for (let x = .5; x < SIZE; x += .5) { const h = hAt(x, z); if (h > -.12 && h < .02 && !bridgeCell[cellAt(x, z)]) shore.push([x, z]); }
}
// the water's drift at a point, matching the shader's: down the Meadow's river, round the isle's ring
function flowVel(x, z) { return MAP === 'bridge' || MAP === 'bend' || MAP === 'ford' || MAP === 'hold' ? [-.55, 0] : MAP !== 'isle' ? [0, .55] : Math.hypot(x - KX, z - KZ) > 19.5 ? [0, Math.sign(z - KZ) * .55] : [.045 * (z - KZ), -.045 * (x - KX)]; }
let sprayT = 0;
function sprayAt(x, z) {
  if (puffs.length > 170) return;
  const [vx, vz] = flowVel(x, z);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: '#e8f2f4', transparent: true, depthWrite: false, opacity: 0, toneMapped: false }));
  sp.position.set(x + (Math.random() - .5) * .5, .12 + Math.random() * .1, z + (Math.random() - .5) * .5); sp.scale.setScalar(.25);
  scene.add(sp); puffs.push({ sp, t: 0, life: 1.2 + Math.random() * .8, vx: vx * .8, vz: vz * .8, spray: true });
}
function updateSplashes(dt) {
  if (shore.length) for (sprayT -= dt; sprayT < 0; sprayT += .06) { const [x, z] = shore[Math.floor(Math.random() * shore.length)]; for (let k = 0; k < 3; k++) sprayAt(x, z); }
  if (!shore.length || chips.length > 150) return;
  for (splashT -= dt; splashT < 0; splashT += .12) {
    const [x, z] = shore[Math.floor(Math.random() * shore.length)];
    for (let n = 0; n < 3 + Math.floor(Math.random() * 3); n++) {
      const m = new THREE.Mesh(chipGeo, splashM); m.position.set(x, .02, z); m.scale.setScalar(1.3 + Math.random() * .9); scene.add(m);
      chips.push({ m, g: -.05, vx: (Math.random() - .5) * .9, vy: .7 + Math.random() * .9, vz: (Math.random() - .5) * .9, t: 0, life: .35 + Math.random() * .2 });
    }
  }
}
function updateChips(dt) {
  for (let n = chips.length - 1; n >= 0; n--) {
    const c = chips[n], p = c.m.position; c.t += dt; c.vy -= 9 * dt;
    p.x += c.vx * dt; p.y += c.vy * dt; p.z += c.vz * dt; c.m.rotation.x += dt * 8;
    if (p.y < c.g + .015) { p.y = c.g + .015; c.vx *= .4; c.vz *= .4; c.vy = 0; }
    c.m.scale.setScalar(1 - Math.max(0, (c.t / c.life - .7) / .3));
    if (c.t >= c.life) { scene.remove(c.m); chips.splice(n, 1); }
  }
}
const toolFor = v => v.build ? 'hammer' : v.job ? JOB_TOOL[v.job.type] : null;
const castleB = () => buildings.find(B => B.type === 'castle');
// a log for the right shoulder and a block held at the chest, hidden until carried
function addLoads(v) {
  v.carryLog = cyl(.085, .085, .9, 6, M.log, .19, 1.03, .02); v.carryLog.rotation.x = Math.PI / 2; v.carryLog.visible = false; v.body.add(v.carryLog);
  v.carryStone = box(.32, .26, .3, M.stone2, 0, .72, .26); v.carryStone.visible = false; v.body.add(v.carryStone);
  // Carts: a bundle of three logs on the shoulder (two more ride on the first; shown only for a lumber camp's trip)
  for (const [x, z] of [[-.075, -.12], [.08, -.115]]) { const l = cyl(.075, .075, .82, 6, M.log, x, (x > 0 ? .04 : -.03), z); l.visible = false; v.carryLog.add(l); }
}
// Wheelbarrows: a quarry mason wheels the stone home in a barrow, both hands on its handles (made the first time it's needed)
function makeBarrow() {
  const g = new THREE.Group();
  g.add(box(.42, .06, .5, M.timber, 0, .36, .72));
  for (const [x, z, w, d] of [[-.21, .72, .04, .5], [.21, .72, .04, .5], [0, .97, .42, .04], [0, .47, .42, .04]]) g.add(box(w, .2, d, M.plank || M.timber, x, .46, z));
  const wh = cyl(.15, .15, .06, 10, M.timber, 0, .15, 1.05); wh.rotation.z = Math.PI / 2; g.add(wh);
  for (const sx of [-1, 1]) {
    const h = box(.04, .04, .95, M.timber, sx * .17, .5, .72); h.rotation.x = .2; g.add(h);
    g.add(box(.035, .26, .035, M.timber, sx * .17, .2, .5));
  }
  for (const [x, z] of [[-.08, .66], [.1, .8]]) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(.12, 0), M.stone2); s.position.set(x, .5, z); s.castShadow = true; g.add(s); }
  return g;
}
function makeVillager(home) {
  const v = makePerson({}); v.plainHat = Math.random() < .5; dress(v, null);
  addLoads(v);
  const dp = doorPoint(home);
  Object.assign(v, { home, job: null, build: null, state: 'find', x: dp.x + (Math.random() - .5) * .6, z: dp.z + (Math.random() - .5) * .6 });
  v.tx = v.x; v.tz = v.z; v.wait = Math.random() * .4; v.fresh = true;
  if (PH.kind === 'night') { v.inside = true; v.indoor = castleB(); v.g.visible = false; }
  villagers.push(v); return v;
}
// houses (and the castle) are where villagers come from; each tier houses more people
function syncResidents(B) {
  const R = DEF[B.type].residents; if (!R || !B.built) return;
  let have = villagers.filter(v => v.home === B && !v.homeless && !v.summoned).length + respawns.filter(r => r.home === B && !r.homeless).length;   // the fallen come back on their own
  // the homeless move in first; only room left over brings new villagers
  for (const v of villagers) if (have < R[B.tier - 1] && v.homeless) { v.homeless = false; v.home = B; have++; }
  for (const r of respawns) if (have < R[B.tier - 1] && r.homeless) { r.homeless = false; r.home = B; have++; }
  for (; have < R[B.tier - 1]; have++) makeVillager(B);
  assignJobs();
}
// workplaces take villagers who have no job yet; they commute from home
// food is low below 3 meals a head, or while the town eats more than it grows (each villager eats 1 per payout; farms and the
// castle make food each payout): farms are filled first, and if nobody is free a lumberjack or mason is moved to the field
const foodMade = () => buildings.reduce((s, B) => !B.built ? s : DEF[B.type].field ? s + DEF[B.type].food[B.tier - 1] * farmersAt(B) / DEF[B.type].workers[B.tier - 1] * prodK(B) : B.type === 'castle' ? s + DEF.castle.food[B.tier - 1] : s, 0);
const townsfolk = () => villagers.filter(v => !v.summoned);
const foodLow = () => res.food < townsfolk().length * 3 || foodMade() < townsfolk().length;
var foodLogT = -1e9;
function assignJobs() {
  const low = foodLow(), order = buildings.slice().sort((a, b) => !!DEF[b.type].field - !!DEF[a.type].field);
  for (const B of order) {
    const T = DEF[B.type]; if (!T.workers || !B.built) continue;
    let have = villagers.filter(v => v.job === B).length;   // (hungry farmers have already left their field)
    while (have < T.workers[B.tier - 1]) {
      const c = center(B); let best = null, bd = 1e9;
      for (const v of villagers) if (!v.job && !v.soldier && !v.unkit && !v.hungry) { const d = Math.hypot(v.x - c.x, v.z - c.z); if (d < bd) { bd = d; best = v; } }
      if (!best && low && T.field) for (const v of villagers) {
        if (!v.job || DEF[v.job.type].field || v.hungry || v.soldier || v.unkit || v.post || v.build || v.carryLog.visible || v.carryStone.visible) continue;
        const d = Math.hypot(v.x - c.x, v.z - c.z); if (d < bd) { bd = d; best = v; }
      }
      if (!best) break;
      if (best.job && best.job !== B && performance.now() - foodLogT > 20000) { foodLogT = performance.now(); log('<b>Food low</b> · worker to the farm', 'warn'); }
      best.job = B; release(best); best.path = null; best.visit = null;
      if (!best.build) best.state = 'commute';
      have++;
    }
  }
}
const popStats = () => { const t = townsfolk(); return { total: t.length, idle: t.filter(v => !v.job && !v.build).length }; };
// each construction site gets up to two builders: idle villagers first, a worker only if nobody else is building
function assignBuilders() {
  if (PH.kind === 'night') return;
  const R = regions(), now = performance.now();
  for (const S of buildings) {
    if (!S.site) continue;
    const crew = villagers.filter(v => v.build === S).length;
    if (crew >= 2) continue;
    // the castle's repair comes first (Jack saw nobody mend it after a night: every workplace's own workers took their own repair
    // and job-holders only help elsewhere while nobody builds): two builders at once, idle ones first, else off their jobs
    const anyBuilding = villagers.some(v => v.build), c = center(S), repair = S.site.kind === 'repair', urgent = repair && S.type === 'castle';
    const reach = new Set(ringCells(S.ev).map(n => R[n]).filter(Boolean));   // only someone who can walk there
    let best = null, bd = 1e9;
    for (const v of villagers) {
      if (v.build || v.post || v.hungry || v.unkit) continue;
      if (!reach.has(villagerRegion(v, R)) || (v.noBuild && v.noBuild.S === S && v.noBuild.t > now)) continue;
      const own = repair && v.job === S;
      if (v.job && !own && !urgent && (anyBuilding || crew > 0)) continue;
      if (v.carryLog.visible || v.carryStone.visible) continue;
      const d = Math.hypot(v.x - c.x, v.z - c.z) + (own ? -100 : v.job ? 40 : 0); if (d < bd) { bd = d; best = v; }
    }
    if (!best) continue;
    release(best); best.build = S; best.state = 'tobuild'; best.path = null; best.visit = null;
    if (best.hideT > 0) exitDoor(best);
  }
}
function randomNear(B, rmin, rmax) {
  const c = center(B), half = B.ev.s * CELL / 2; rmin += half; rmax += half;
  for (let n = 0; n < 40; n++) { const a = Math.random() * 6.283, r = rmin + Math.random() * (rmax - rmin), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r; if ([[0, 0], [.7, 0], [-.7, 0], [0, .7], [0, -.7]].every(([a, b]) => canStand(x + a, z + b, 0))) return { x, z }; }
  return null;
}
// steering tries: straight, then the committed side, and only then the other side; each group first wants clear ground ahead
const SIDE_L = [0, .5, 1.0, 1.6, 2.2], SIDE_R = SIDE_L.map(o => -o);
const STEER_L = [[SIDE_L, 0], [SIDE_L, 1], [SIDE_R, 0], [SIDE_R, 1]], STEER_R = [[SIDE_R, 0], [SIDE_R, 1], [SIDE_L, 0], [SIDE_L, 1]];
function turnTo(v, a, dt) { let d = a - v.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); v.g.rotation.y += d * Math.min(1, dt * 8); }
function steer(v, tx, tz, dt, mode, stop = .2, mult = 1) {
  const dx = tx - v.x, dz = tz - v.z, d = Math.hypot(dx, dz);
  if (d < stop) return true;
  let sp = v.speed * mult * (road[cellAt(v.x, v.z)] ? PATH_SPEED : 1);
  if (mode === 2 && walkY(v.x, v.z) < .4) sp *= .5;
  const step = Math.min(d - stop * .5, sp * dt), base = Math.atan2(dx, dz);
  if (step < .002) return false;
  // commit to one side when walking around an obstacle, instead of flipping sides every frame
  if ((v.sideT = (v.sideT || 0) - dt) <= 0) v.side = 0;
  // look ahead too: a direction that is open for this step but blocked just beyond it walks the unit into the edge,
  // and it bounces off it next frame; the committed side is used up (with, then without look-ahead) before the other is tried,
  // or the unit steps one way, then the other, and shakes
  const look = Math.min(d, .65);
  for (const [offs, loose] of (v.side < 0 ? STEER_R : STEER_L)) for (const off of offs) {
    const a = base + off, sa = Math.sin(a), ca = Math.cos(a), nx = v.x + sa * step, nz = v.z + ca * step;
    if (!canStand(nx, nz, mode)) continue;
    if (Math.abs(walkY(nx, nz) - walkY(v.x, v.z)) > Math.max(.2, step * 3.6)) continue;   // a ledge: a bridge deck's side
    if (!loose && look > step && !canStand(v.x + sa * look, v.z + ca * look, mode)) continue;
    // face the smoothed direction of travel, not each step's: small corrections along an edge don't swing the body
    const k = Math.min(1, dt * 7); v.hx = lerp(v.hx || sa, sa, k); v.hz = lerp(v.hz || ca, ca, k);
    if (v.fresh) { v.hx = sa; v.hz = ca; v.g.rotation.y = a; v.fresh = false; }   // a raider just spawned: already facing the way it sets off
    v.x = nx; v.z = nz; turnTo(v, Math.atan2(v.hx, v.hz), dt); v.walking = true;
    if (off === 0) v.stuck = Math.max(0, v.stuck - dt);
    else { v.stuck += dt * .4; if (!v.side) v.side = Math.sign(off); v.sideT = .8; }
    return false;
  }
  v.stuck += dt; v.side = -(v.side || 1); v.sideT = .8; v.walking = true; return false;   // keeps striding while it finds a way round
}
// what players see: position eased toward the logical one and a stride that fades in and out, so blocked units never jitter
function smoothPos(u, dt, now) {
  if (u.rx === undefined || now - u.rT > 200 || Math.hypot(u.x - u.rx, u.z - u.rz) > 2.5) { u.rx = u.x; u.rz = u.z; }
  else { const k = Math.min(1, dt * 10); u.rx += (u.x - u.rx) * k; u.rz += (u.z - u.rz) * k; }
  u.rT = now;
}
function stride(u, dt, rate) { u.amp = (u.amp || 0) + ((u.walking ? 1 : 0) - (u.amp || 0)) * Math.min(1, dt * 6); if (u.amp > .02) u.phase += dt * rate; return u.amp; }
// ---------- pathfinding: A* over the cell grid, then follow cell centres, skipping any we can see past ----------
function cellPass(n, mode) {
  if (MAP === 'watch' && n === cellAt(WATCH_RUIN[0], WATCH_RUIN[1])) return false;
  if (sceneryAt((n % N + .5) * CELL, (((n / N) | 0) + .5) * CELL)) return false;
  if (!mapOpen((n % N + .5) * CELL, (((n / N) | 0) + .5) * CELL)) return false;
  if (bridgeCell[n]) return true;
  const o = mode === 3 ? null : occB[n]; if (o && !WALK[o.type] && !(o.type === 'gate' && mode !== 2)) return false;   // mode 3: raiders' ground, buildings count as open (they break through)
  // a farm cell whose middle is the hut, barn, hay or a scarecrow is routed round (people still walk the open ground by it)
  if (o && OBST[o.type] && farmBlocked(o, (n % N + .5) * CELL, (((n / N) | 0) + .5) * CELL)) return false;
  return cH[n] > (mode === 1 ? .2 : .45) && cS[n] < (mode === 1 ? 4 : 2.6);
}
const ND = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
function findPath(sx, sz, tx, tz, mode) {
  const s = cellAt(sx, sz), t = cellAt(tx, tz); if (s === t) return [];
  // standing (or aiming) on the ground in a cell a deck touches counts as off the bridge
  const sOn = deckAt(s, sx, sz), tOn = deckAt(t, tx, tz), bAt = n => n === s ? sOn : n === t ? tOn : bridgeCell[n];
  const g = new Float32Array(N * N).fill(Infinity), f = new Float32Array(N * N).fill(Infinity), came = new Int32Array(N * N).fill(-1), closed = new Uint8Array(N * N);
  const ta = t % N, tb = (t / N) | 0, hh = n => { const dx = Math.abs(n % N - ta), dz = Math.abs(((n / N) | 0) - tb); return Math.max(dx, dz) + .414 * Math.min(dx, dz); };
  const open = [s]; g[s] = 0; f[s] = hh(s);
  while (open.length) {
    let bi = 0; for (let q = 1; q < open.length; q++) if (f[open[q]] < f[open[bi]]) bi = q;
    const c = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (closed[c]) continue; closed[c] = 1;
    if (c === t) { const cells = []; for (let p = came[c]; p !== -1 && p !== s; p = came[p]) cells.unshift(p); return routePoints(cells, sx, sz, sOn, tx, tz, tOn, mode); }
    const a = c % N, b = (c / N) | 0;
    for (const [da, db, w] of ND) {
      const na = a + da, nb = b + db; if (na < 0 || nb < 0 || na >= N || nb >= N) continue;
      const nn = nb * N + na; if (closed[nn]) continue;
      if (nn !== t && !cellPass(nn, mode)) continue;
      if (da && db && (!cellPass(b * N + na, mode) || !cellPass(nb * N + a, mode))) continue;
      const bc = bAt(c), bn = bAt(nn);                            // bridges are only walked on and off through their end cells
      if (bc !== bn && ((bc && !bridges[bc - 1].ends.has(c)) || (bn && !bridges[bn - 1].ends.has(nn)))) continue;
      const ng = g[c] + w * (1 + cS[nn] * .3) * (road[nn] ? .7 : 1);
      if (ng < g[nn]) { g[nn] = ng; came[nn] = c; f[nn] = ng + hh(nn); open.push(nn); }
    }
  }
  return null;
}
const deckAt = (n, x, z) => { const i = bridgeCell[n]; return i && onDeck(bridges[i - 1], x, z) ? i : 0; };
// ---------- connectivity: numbered regions of cells workers can walk between (4 neighbours is enough: A* only goes
// diagonally when both side cells are open; bridges only through their ends, as in findPath). Used to refuse placements
// that would seal anyone or anything off, to send builders and workers only where they can get, and to get anyone
// trapped anyway (e.g. by terrain the flattening changed) out again
function floodRegions(out, pass) {
  out.fill(0); const q = new Int32Array(N * N); let id = 0;
  for (let s = 0; s < N * N; s++) {
    if (out[s] || !pass[s]) continue;
    out[s] = ++id; let h = 0, t = 0; q[t++] = s;
    while (h < t) {
      const c = q[h++], a = c % N, b = (c / N) | 0, bc = bridgeCell[c];
      for (let k = 0; k < 4; k++) {
        const na = a + ND[k][0], nb = b + ND[k][1]; if (na < 0 || nb < 0 || na >= N || nb >= N) continue;
        const nn = nb * N + na; if (out[nn] || !pass[nn]) continue;
        const bn = bridgeCell[nn];
        if (bc !== bn && ((bc && !bridges[bc - 1].ends.has(c)) || (bn && !bridges[bn - 1].ends.has(nn)))) continue;
        out[nn] = id; q[t++] = nn;
      }
    }
  }
  return out;
}
function regions() {
  if (regionDirty) { regionDirty = false; for (let n = 0; n < N * N; n++) regPass[n] = cellPass(n, 1) ? 1 : 0; floodRegions(reg, regPass); }
  return reg;
}
// a spot's region: its cell's, or a neighbour's when the cell itself is steep or built on (a rock, someone in a doorway)
function regionAt(x, z, R = regions()) {
  const n = cellAt(x, z); if (R[n]) return R[n];
  const a = n % N, b = (n / N) | 0;
  for (const [da, db] of ND) { const na = a + da, nb = b + db; if (na >= 0 && nb >= 0 && na < N && nb < N && R[nb * N + na]) return R[nb * N + na]; }
  return 0;
}
const doorRegion = (B, R = regions()) => B && B.door ? R[B.door.b * N + B.door.a] : 0;
const mainRegion = (R = regions()) => doorRegion(castleB(), R);          // the castle's door: where everyone has to get to
// the cells round a footprint, where builders stand
function ringCells(ev) {
  const o = [], add = (a, b) => { if (a >= 0 && b >= 0 && a < N && b < N) o.push(b * N + a); };
  const sz = ev.sz || ev.s;
  for (let k = 0; k < ev.s; k++) { add(ev.ci + k, ev.cj - 1); add(ev.ci + k, ev.cj + sz); }
  for (let k = 0; k < sz; k++) { add(ev.ci - 1, ev.cj + k); add(ev.ci + ev.s, ev.cj + k); }
  return o;
}
const ringIn = (ev, R, id) => !!id && ringCells(ev).some(n => R[n] === id);
// where a villager is, as a region; someone indoors counts as at that building's door
function villagerRegion(v, R = regions()) {
  if (v.g.visible && !(v.hideT > 0) && !v.inside) return regionAt(v.x, v.z, R);
  const B = v.indoor && !v.indoor.dead ? v.indoor : v.home && !v.home.dead ? v.home : castleB();
  return doorRegion(B, R) || regionAt(v.x, v.z, R);
}
// would building this here (facing f) seal off a door, a site or a tower from the castle, or is the spot itself sealed off?
// (pockets with no way out left villagers stuck for good, e.g. coming out of a door boxed in by later buildings)
function cutsOff(r, type, f) {
  const R = regions(), id = mainRegion(R); if (!id) return '';
  const pass = regPass.slice();
  for (let b = r.cj; b < r.cj + (r.sz || r.s); b++) for (let a = r.ci; a < r.ci + r.s; a++) {
    const n = b * N + a, x = (a + .5) * CELL, z = (b + .5) * CELL;
    if (OBST[type] ? farmBlocked({ type, ev: r, face: f, tier: 1 }, x, z) : !WALK[type] && type !== 'gate') pass[n] = 0;
  }
  const T = floodRegions(regTry, pass), K = castleB(), nid = doorRegion(K, T);
  if (!nid) return 'Blocks the way';
  for (const B of buildings) {
    if (B.dead) continue;
    if (B.door) { const n = B.door.b * N + B.door.a; if (R[n] === id && T[n] !== nid) return 'Blocks the way'; }
    if ((B.site || B.type === 'tower') && ringIn(B.ev, R, id) && !ringIn(B.ev, T, nid)) return 'Blocks the way';
  }
  if (!DEF[type].noRoad) { const d = doorCell(r, type, f); if (T[d.b * N + d.a] !== nid) return ringIn(r, T, nid) ? 'Door cut off' : 'No way there'; }
  return ringIn(r, T, nid) ? '' : 'No way there';
}
// someone shut in a pocket with nowhere to go (it shouldn't happen any more, but terrain and old towns can do it):
// hop them to the nearest open ground that joins up with the castle, with a puff of dust
function freeTrapped(v) {
  const R = regions(), id = mainRegion(R); if (!id) return false;
  const a0 = Math.floor(v.x / CELL), b0 = Math.floor(v.z / CELL);
  for (let r = 1; r < N; r++) for (let db = -r; db <= r; db++) for (let da = -r; da <= r; da++) {
    if (Math.max(Math.abs(da), Math.abs(db)) !== r) continue;
    const a = a0 + da, b = b0 + db; if (a < 0 || b < 0 || a >= N || b >= N || R[b * N + a] !== id) continue;
    const x = (a + .5) * CELL, z = (b + .5) * CELL; if (!canStand(x, z, 1)) continue;
    dustAt(v.x, walkY(v.x, v.z), v.z); v.x = v.rx = x; v.z = v.rz = z; dustAt(x, walkY(x, z), z);
    v.path = null; v.prog = null; v.noProg = 0; v.stuck = 0; return true;
  }
  return false;
}
// waypoints for a path of cells: cell centres, and over a bridge a point on the ground in front of its end, the deck's end,
// its far end and the ground beyond, so units line up with the bridge and walk on and off along it
function routePoints(cells, sx, sz, sOn, tx, tz, tOn, mode) {
  const out = [], mid = n => ({ x: (n % N + .5) * CELL, z: (((n / N) | 0) + .5) * CELL });
  const at = (b, u) => ({ x: b.x0 + b.dx * u, z: b.z0 + b.dz * u });
  const front = (b, e) => { for (const q of [.8, 1.2, .5]) { const p = at(b, e ? b.L + q : -q); if (canStand(p.x, p.z, mode)) return p; } return at(b, e ? b.L : 0); };
  for (let k = 0; k < cells.length;) {
    const bi = bridgeCell[cells[k]];
    if (!bi) { out.push(mid(cells[k++])); continue; }
    let e = k; while (e + 1 < cells.length && bridgeCell[cells[e + 1]] === bi) e++;
    const b = bridges[bi - 1], prev = k ? mid(cells[k - 1]) : { x: sx, z: sz }, next = e < cells.length - 1 ? mid(cells[e + 1]) : { x: tx, z: tz };
    const into = k > 0 || sOn !== bi, outOf = e < cells.length - 1 || tOn !== bi;
    const eIn = bridgeT(b, prev.x, prev.z) > .5 ? 1 : 0, eOut = bridgeT(b, next.x, next.z) > .5 ? 1 : 0;
    if (into && outOf && eIn === eOut) out.push(front(b, eIn));                    // only touches the bridge's end: stay on the bank
    else {
      if (into) out.push(front(b, eIn), at(b, eIn ? b.L - .35 : .35));
      if (outOf) out.push(at(b, eOut ? b.L - .35 : .35), front(b, eOut));
      else out.push(bridgeWaypoint(cells[e]));
    }
    k = e + 1;
  }
  return out;
}
// a shortcut has to be clear a body's width either side, or units cut corners, clip them and grind along the edge
function clearLine(x0, z0, x1, z1, mode) {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .4); if (L < 1e-3) return true;
  const px = -(z1 - z0) / L * .22, pz = (x1 - x0) / L * .22;
  // a shortcut may touch a bridge only along its deck (both ends on that bridge): otherwise the path's waypoint lined up
  // with the bridge's end gets skipped and the unit cuts in from the side, onto the ledge, and stalls at the bank
  const b0 = deckAt(cellAt(x0, z0), x0, z0), b1 = deckAt(cellAt(x1, z1), x1, z1), onDeck = b0 && b0 === b1;
  let py = walkY(x0, z0);
  for (let i = 1; i <= n; i++) {
    const x = lerp(x0, x1, i / n), z = lerp(z0, z1, i / n); if (!canStand(x, z, mode) || !canStand(x + px, z + pz, mode) || !canStand(x - px, z - pz, mode)) return false;
    const bc = bridgeCell[cellAt(x, z)]; if (bc && !(onDeck && bc === b0)) return false;
    const y = walkY(x, z); if (Math.abs(y - py) > .35) return false; py = y;   // no shortcut up a ledge (a bridge deck's side)
  }
  return true;
}
function unstick(v, mode) {
  // nearest open cell centre the villager can stand on; a small hop beats walking into a wall forever
  const a0 = Math.floor(v.x / CELL), b0 = Math.floor(v.z / CELL);
  for (let r = 0; r < 4; r++) for (let db = -r; db <= r; db++) for (let da = -r; da <= r; da++) {
    if (Math.max(Math.abs(da), Math.abs(db)) !== r) continue;
    const a = a0 + da, b = b0 + db; if (a < 0 || b < 0 || a >= N || b >= N || !cellPass(b * N + a, mode)) continue;
    const x = (a + .5) * CELL, z = (b + .5) * CELL;
    if (canStand(x, z, mode) && (r > 0 || Math.hypot(x - v.x, z - v.z) > .4)) { v.x = x; v.z = z; return; }
  }
}
// v.noProg: seconds since the unit last got 0.25 m closer to this target (unstick resets v.stuck, never this),
// so callers can give up or settle for "near enough" instead of pushing at a spot forever
// distance still to walk: along the planned path when there is one (a detour, e.g. round to a bridge, still counts as progress)
function pathLeft(v, tx, tz) {
  const p = v.path; if (!p || !p.length || Math.hypot(v.pathX - tx, v.pathZ - tz) > .6) return Math.hypot(tx - v.x, tz - v.z);
  let d = Math.hypot(p[0].x - v.x, p[0].z - v.z);
  for (let i = 1; i < p.length; i++) d += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z);
  return d + Math.hypot(tx - p[p.length - 1].x, tz - p[p.length - 1].z);
}
function trackProgress(v, tx, tz, dt) {
  const d = pathLeft(v, tx, tz), now = performance.now(), P = v.prog;
  if (!P || now - P.seen > 300 || Math.hypot(P.x - tx, P.z - tz) > .6) v.prog = { x: tx, z: tz, best: d, t: 0, seen: now };
  else { P.seen = now; if (d < P.best - .25) { P.best = d; P.t = 0; } else P.t += dt; }
  v.noProg = v.prog.t; return d;
}
function walkTo(v, tx, tz, dt, mode, stop = .2, mult = 1) {
  const d0 = trackProgress(v, tx, tz, dt);
  if (d0 < stop + .7 && v.noProg > .8) return true;     // someone is standing on the spot: this is close enough
  if (v.stuck > 2) { unstick(v, mode); v.stuck = 0; v.path = null; }
  v.repathT = (v.repathT || 0) - dt;
  if (!v.path || Math.hypot(v.pathX - tx, v.pathZ - tz) > .6 || (v.stuck > 1.2 && v.repathT <= 0)) {
    // raiders with every way blocked by buildings or walls head for whatever is in the way and break it, instead of walking straight at the target (into rivers)
    v.path = findPath(v.x, v.z, tx, tz, mode) || (mode === 2 && findPath(v.x, v.z, tx, tz, 3)) || []; v.pathX = tx; v.pathZ = tz; v.repathT = 2; v.skipT = 0;
  }
  if (v.path.length && (v.skipT = (v.skipT || 0) - dt) <= 0) {
    v.skipT = .25;
    if (clearLine(v.x, v.z, tx, tz, mode)) v.path.length = 0;
    else while (v.path.length > 1 && clearLine(v.x, v.z, v.path[1].x, v.path[1].z, mode)) v.path.shift();
  }
  while (v.path.length && Math.hypot(v.path[0].x - v.x, v.path[0].z - v.z) < .45) v.path.shift();
  if (v.path.length) { steer(v, v.path[0].x, v.path[0].z, dt, mode, .3, mult); return false; }
  return steer(v, tx, tz, dt, mode, stop, mult);
}
function enter(v, B, secs) { release(v); v.path = null; v.indoor = B; v.hideT = secs; goIn(v, B); v.stuck = 0; }
// villagers vanish only at the model's door: from the path tile they walk straight in, and come out the same way
function goIn(v, B) {
  const p = innerDoor(B), dp = outerDoor(B, v);
  // walk in only from in front of the door; someone who gave up further off just goes inside, rather than through a wall
  if (p && v.g.visible && Math.hypot(dp.x - v.x, dp.z - v.z) < 1.7) v.doorWalk = { x: p.x, z: p.z, hide: true };
  else { v.doorWalk = null; v.g.visible = false; }
}
function exitDoor(v) {
  const B = v.indoor && !v.indoor.dead ? v.indoor : (v.home && !v.home.dead ? v.home : castleB() || v.home), dp = outerDoor(B, v), p = innerDoor(B);
  dropLoad(v);
  if (v.doorWalk && v.g.visible) v.doorWalk = { x: dp.x, z: dp.z };              // turned back on the way in
  else if (p) { v.x = p.x; v.z = p.z; v.doorWalk = { x: dp.x, z: dp.z }; }
  else { v.x = dp.x; v.z = dp.z; v.doorWalk = null; }
  v.tx = dp.x; v.tz = dp.z; v.indoor = null; v.hideT = 0; v.g.visible = true; v.stuck = 0; v.path = null;
}
// one step of a door walk; true while it lasts (the villager's own logic waits)
function doorStep(v, dt) {
  const W = v.doorWalk, dx = W.x - v.x, dz = W.z - v.z, d = Math.hypot(dx, dz), step = v.speed * (v.horse ? RIDER.speed : 1) * dt;   // a rider goes through a doorway at a trot
  if (d > step) { v.walking = true; turnTo(v, Math.atan2(dx, dz), dt); v.x += dx / d * step; v.z += dz / d * step; return true; }
  v.x = W.x; v.z = W.z;
  if (W.hold > 0) { if (W.face != null) turnTo(v, W.face, dt); W.hold -= dt; return true; }   // a pause on the way (picking up, tipping out)
  v.doorWalk = W.next || null;
  if (W.on) W.on(v);
  if (W.hide) { v.g.visible = false; dropLoad(v); }
  return !!v.doorWalk;
}
// at the door: on its tile, or held up close to it (never just near the building: from behind a wall they walked through it)
function nearDoor(v, B, dp) { const d = Math.hypot(dp.x - v.x, dp.z - v.z); return d < .6 || (v.noProg > 1 && d < 1.6); }
function claimResource(v, now) {
  const hb = center(v.job), R = DEF[v.job.type].reach, G = regions(), id = doorRegion(v.job, G), reach = q => !id || regionAt(q.x, q.z, G) === id;
  let best = null, bd = 1e9;
  if (v.job.type === 'forester') { for (const t of v.job.grove || []) if (t.g >= 1 && !t.claim) { const d = Math.hypot(t.x - v.x, t.z - v.z); if (d < bd) { bd = d; best = t; } } }
  else if (v.job.type === 'lodge') { for (const t of trees) if (treeFree(t, now) && reach(t)) { const d = Math.hypot(t.x - hb.x, t.z - hb.z); if (d < R && d < bd) { bd = d; best = t; } } }
  else for (const r of rocks) if (r.amount > 0 && !((r.blocked || 0) > now) && reach(r)) { const d = Math.hypot(r.x - hb.x, r.z - hb.z) + (r.claim ? 4 : 0); if (d < R + 4 && d < bd) { bd = d; best = r; } }
  if (best) best.claim = v;
  return best;
}
function release(v) { if (v.target && v.target.claim === v) v.target.claim = null; v.target = null; }
function deliver(v) {
  if (v.dropLoad) return;
  if (PH.kind === 'night') { if ((v.carryLog && v.carryLog.visible) || (v.carryStone && v.carryStone.visible)) v.dropLoad = true; if (!v.doorWalk) dropLoad(v); return; }   // nothing is gathered at night: a load carried in after dark is lost
  // Carts (+1 wood a trip) is the lumber camp's upgrade only: a forester's woodcutters always bring 2 (Jack)
  if (v.carryLog && v.carryLog.visible) { const L = v.job && v.job.type === 'forester' ? 2 : LUMBER_LOAD; res.wood += L; stats.wood += L; v.dropLoad = true; }
  if (v.carryStone && v.carryStone.visible) { res.stone += 1 + UPK.stoneTrip; stats.stone += 1 + UPK.stoneTrip; v.dropLoad = true; }
  if (!v.doorWalk) dropLoad(v);           // otherwise it is carried in through the door
}
function dropLoad(v) { if (v.dropLoad) { v.carryLog.visible = v.carryStone.visible = false; v.dropLoad = false; } }
// each builder gets a spot of their own just outside the site, nearest to them, clear of the other builders' spots
function workSpot(S, v, avoid) {
  const e = S.ev, o = .6, pts = [], R = regions(), id = villagerRegion(v, R);
  for (let t = e.x0 + .4; t <= e.x1 - .4 + 1e-6; t += .7) pts.push({ x: t, z: e.z0 - o }, { x: t, z: e.z1 + o });
  for (let t = e.z0 + .4; t <= e.z1 - .4 + 1e-6; t += .7) pts.push({ x: e.x0 - o, z: t }, { x: e.x1 + o, z: t });
  // spots this villager can actually walk to; another builder's spot is left alone unless there's nowhere else
  for (const spaced of [true, false]) {
    let best = null, bd = 1e9;
    for (const p of pts) {
      if (R[cellAt(p.x, p.z)] !== id || !canStand(p.x, p.z, 1) || (avoid && Math.hypot(p.x - avoid.x, p.z - avoid.z) < .5)) continue;
      if (spaced && villagers.some(w => w !== v && w.build === S && w.spot && Math.hypot(w.spot.x - p.x, w.spot.z - p.z) < .8)) continue;
      const d = Math.hypot(p.x - v.x, p.z - v.z); if (d < bd) { bd = d; best = p; }
    }
    if (best) return best;
  }
  return null;
}
// a site this builder can't get to: leave it to someone else for a while
function dropBuild(v, S) { v.noBuild = { S, t: performance.now() + 15000 }; v.build = null; v.spot = null; v.spotN = 0; v.prog = null; v.state = v.job ? 'commute' : 'find'; }
function updateBuilder(v, dt) {
  const S = v.build;
  if (S.dead || !S.site) { v.build = null; v.state = v.job ? 'commute' : 'find'; return; }
  if (v.spotS !== S || !v.spot) { v.spot = workSpot(S, v); v.spotS = S; v.spotN = 0; if (!v.spot && distRect(S, v.x, v.z) > 1.3) { dropBuild(v, S); return; } }
  if (v.state !== 'building') {
    const sp = v.spot || center(S), near = distRect(S, v.x, v.z);
    if (walkTo(v, sp.x, sp.z, dt, 1, .3) || (near < 1.3 && v.noProg > 1)) v.state = 'building';
    else if (v.noProg > 5) {
      if (near < 2.5) v.state = 'building';
      else if (++v.spotN > 3) dropBuild(v, S);                    // tried four spots and got nowhere
      else { v.spot = workSpot(S, v, sp) || sp; v.prog = null; }
    }   // that spot can't be reached: try another
  } else {
    v.working = true; const c = center(S); turnTo(v, Math.atan2(c.x - v.x, c.z - v.z), dt);
    S.site.progress += dt / S.site.time;
    if ((v.dustT = (v.dustT || Math.random()) - dt) <= 0) { v.dustT = .5 + Math.random() * .6; dustAt((v.x + c.x) / 2, hAt(v.x, v.z), (v.z + c.z) / 2); }
  }
}
// a miner out of the adit: to the cart (rolled out and held there), a stone from it onto the spoil heap, back underground
function mineHaul(v, W) {
  const P = (x, z) => localPt(W, x, z), A = DOOR.mine[W.tier - 1], ad = P(A[0], A[1]), cart = P(-.13, 1.5), heap = P(.42, 1.02), hc = P(1.1, 1.25);
  W.hauler = v; v.g.visible = true; v.hideT = 0; v.x = ad.x; v.z = ad.z; v.rx = v.x; v.rz = v.z; v.path = null;
  const cartFace = Math.atan2(P(-.55, 1.62).x - cart.x, P(-.55, 1.62).z - cart.z), heapFace = Math.atan2(hc.x - heap.x, hc.z - heap.z);
  const back = { ...ad, hide: true, on: u => { u.indoor = W; u.hideT = 1e9; if (W.hauler === u) W.hauler = null; } };
  const drop = { ...heap, hold: .7, face: heapFace, on: u => { u.carryStone.visible = false; }, next: back };
  v.doorWalk = { ...cart, hold: .8, face: cartFace, on: u => { u.carryStone.visible = true; }, next: drop };
}
function updateWorker(v, dt, now) {
  const W = v.job, dp = outerDoor(W, v), mult = 1, workMul = W.tier === 3 ? .7 : 1;
  // someone still indoors from another task (a new job, a mine they were moved out of): out first
  if (v.hideT > 0 && v.state !== 'drop' && v.state !== 'dig' && !v.doorWalk) { v.hideT = 0; exitDoor(v); }
  if (v.state === 'commute') { if (walkTo(v, dp.x, dp.z, dt, 1, .4) || nearDoor(v, W, dp) || v.noProg > 6) v.state = 'find'; return; }
  if (DEF[W.type].field) {           // fields and the farmhouse yard: work a spot inside the plot (hoe, or feed from the pail)
    const e = W.ev;
    if (v.state === 'work') { v.working = true; if ((v.wait -= dt) <= 0) v.state = 'find'; return; }
    if (v.state !== 'go') { for (let n = 0; n < 12; n++) { v.tx = lerp(e.x0 + .4, e.x1 - .4, Math.random()); v.tz = lerp(e.z0 + .4, e.z1 - .4, Math.random()); if (canStand(v.tx, v.tz, 1)) break; } v.state = 'go'; v.stuck = 0; }
    if (walkTo(v, v.tx, v.tz, dt, 1, .2, .7) || v.noProg > 3) { v.state = 'work'; v.wait = 2 + Math.random() * 2; }
    return;
  }
  if (W.type === 'mine') {           // miners dig underground: in through the adit, a load of stone up with every dig; out at night or for another task
    if (v.state !== 'dig') {
      if (walkTo(v, dp.x, dp.z, dt, 1, .35) || nearDoor(v, W, dp) || v.noProg > 6) { enter(v, W, 1e9); v.state = 'dig'; v.digT = DEF.mine.dig[W.tier - 1]; }
      return;
    }
    if (v.g.visible || v.doorWalk) return;
    if ((v.digT -= dt) <= 0) {
      v.digT = DEF.mine.dig[W.tier - 1] * (.9 + Math.random() * .2) / prodK(W);
      if (PH.kind === 'day') {
        const c = center(W); res.stone++; stats.stone++; stats.mined++; floatRes('stone', 1, c.x, W.group.position.y + 2.2, c.z); W.cartT = 2.4; sfx('pick', c, .6);
        if (!W.hauler && Math.random() < .4) mineHaul(v, W);          // now and then one comes up to tip the cart's stone onto the heap
      }
    }
    return;
  }
  const lumber = W.type === 'lodge' || W.type === 'forester';
  switch (v.state) {
    case 'find': {
      if ((v.wait -= dt) > 0) break;
      v.target = claimResource(v, now);
      if (v.target) { v.state = 'go'; v.stuck = 0; } else { v.state = 'idle'; v.wait = 3; const r = W.type === 'forester' ? 1.2 : 3; for (let n = 0; n < 8; n++) { v.tx = dp.x + (Math.random() - .5) * r; v.tz = dp.z + (Math.random() - .5) * r; if (canStand(v.tx, v.tz, 1)) break; } }
      break;
    }
    case 'idle': walkTo(v, v.tx, v.tz, dt, 1); if ((v.wait -= dt) <= 0) v.state = 'find'; break;
    case 'go': {
      const t = v.target;
      if (!t || (lumber ? (t.dead || t.cut) : t.amount <= 0)) { release(v); v.state = 'find'; break; }
      if (walkTo(v, t.x, t.z, dt, 1, lumber ? .75 : 1.15, mult)) { v.state = 'work'; v.wait = (t.grove ? DEF.forester.chop[W.tier - 1] : (lumber ? 2.6 * UPK.chop : 3.8 * UPK.dig) * workMul) / prodK(W); v.g.rotation.y = Math.atan2(t.x - v.x, t.z - v.z); }
      else if (v.noProg > 5) { t.blocked = now + 20000; release(v); v.state = 'find'; v.stuck = 0; v.prog = null; }
      break;
    }
    case 'work': {
      v.working = true;
      if ((v.wait -= dt) <= 0) {
        const t = v.target;
        if (!t) { v.state = 'find'; break; }
        if (t.grove) { t.g = 0; t.cut = true; v.carryLog.visible = true; stats.felled++; }          // a grove tree felled: a sapling again
        else if (lumber) { t.cut = true; t.fallStart = now; t.regrow = now + 45000; v.carryLog.visible = true; }
        else { t.amount--; seatRocks(); v.carryStone.visible = true; v.barrowOn = UPK.stoneTrip > 0 && W.type === 'quarry'; }
        // a lumber camp's woodcutter carries the Carts bundle; a forester's, one log
        v.carryLog.children.forEach(c => c.visible = lumber && !t.grove && LUMBER_LOAD > 2);
        release(v); v.state = 'home'; v.stuck = 0;
      }
      break;
    }
    case 'home':
      if (walkTo(v, dp.x, dp.z, dt, 1, .35, mult) || nearDoor(v, W, dp) || v.noProg > 6) { enter(v, W, 1.5 + Math.random() * 2); deliver(v); v.state = 'drop'; }
      break;
    case 'drop': if ((v.hideT -= dt) <= 0) { exitDoor(v); v.state = 'find'; v.wait = .2; } break;
    default: v.state = 'find';
  }
}
// idle villagers stroll near home, then walk to a door and go inside for a while
function updateWander(v, dt) {
  if (v.hideT > 0) { if ((v.hideT -= dt) <= 0) { exitDoor(v); v.wait = .4 + Math.random(); } return; }
  if (v.wait > 0) { v.wait -= dt; return; }
  if (v.visit) {
    if (v.visit.dead) { v.visit = null; return; }
    const dp = doorPoint(v.visit);
    if (walkTo(v, dp.x, dp.z, dt, 1, .3) || nearDoor(v, v.visit, dp)) { enter(v, v.visit, 3 + Math.random() * 7); v.visit = null; }
    else if (v.noProg > 5) { v.visit = null; v.stuck = 0; v.prog = null; v.wait = 1; }
    return;
  }
  if (Math.hypot(v.tx - v.x, v.tz - v.z) < .3 || (v.noProg > 2 && v.prog && Math.hypot(v.prog.x - v.tx, v.prog.z - v.tz) < .1)) {
    v.wait = v.fresh ? 0 : .5 + Math.random() * 2.5; v.stuck = 0; const wasFresh = v.fresh; v.fresh = false; if (wasFresh) v.wait = 0;
    if (!v.fresh && Math.random() < .45) { const doors = buildings.filter(B => B.door && B.built); v.visit = Math.random() < .6 || !doors.length ? v.home : doors[Math.floor(Math.random() * doors.length)]; }
    else { const s = randomNear(v.home, 1.5, 8) || randomNear(v.home, 1, 12); if (s) { v.tx = s.x; v.tz = s.z; } else v.wait = .3; }
    return;
  }
  walkTo(v, v.tx, v.tz, dt, 1);
}
function updateVillagers(dt, now) {
  if ((hungryLogT -= dt) <= 0 && newlyHungry) { log(`No food · <b>${newlyHungry}</b> asleep`, 'warn'); newlyHungry = 0; hungryLogT = 15; }
  const night = PH.kind === 'night', keep = castleB();
  for (const v of villagers) {
    v.walking = false; v.working = false; v.changing = false; v.pushing = false;
    if (v.climb) updateClimb(v, dt);
    else if (v.doorWalk && doorStep(v, dt)) { /* walking through a door */ }
    else if (night) {
      if (v.sleeping) continue;
      if (v.post) {
        if (!v.posted) {
          release(v); v.visit = null;
          if (v.hideT > 0 || v.inside) { v.inside = false; exitDoor(v); }
          const P = v.post;
          if (walkTo(v, P.p.x, P.p.z, dt, 1, .4, 1.5) || v.noProg > 6 || distRect(P.B, v.x, v.z) < .9) {
            v.posted = true; v.doorWalk = null; deliver(v); dropLoad(v); P.B.manned[P.a] = true;   // a log or stone in hand is put down first
            if (DEF[P.B.type].soldiers) { v.kitT = 1.4; v.indoor = P.B; goIn(v, P.B); }   // goes inside to gear up (see below)
            else if (P.B.type === 'catapult') crewUp(v, P.B, P.a);              // a catapult's crew is the villager: they change on the spot and man it
            else if (DEF[P.B.type].back && P.B.door) {                           // towers and the ballista: up the ladder at the back, or in at the door
              P.B.manned[P.a] = false; const B = P.B, a = P.a;
              if (onLadder(B)) { v.doorWalk = { ...innerDoor(B), on: u => { u.climb = { B, a, up: true, y: 0 }; } }; }
              else { v.indoor = B; goIn(v, B); const up = () => { B.manned[a] = true; showDefender(B, a); }; if (v.doorWalk) v.doorWalk.on = up; else up(); }
            }
            else { v.g.visible = false; showDefender(P.B, P.a); }
          }
        } else if (v.kitT > 0) {                    // changing inside the barracks; out again armed
          if (!v.g.visible && !v.doorWalk && (v.kitT -= dt) <= 0) { soldierKit(v, v.post.B.tier, DEF[v.post.B.type].cavalry); v.sbar = v.sbar || makeBar(.6); v.prog = null; v.indoor = v.post.B; exitDoor(v); }
        } else if (v.soldier) updateSoldier(v, dt);
      } else if (!v.inside) {                       // everyone else shelters in the castle
        release(v); v.visit = null; if (v.state === 'building') v.state = 'tobuild';
        const K = keep || v.home;
        if (v.hideT > 0) { v.hideT = 0; v.indoor = K; v.inside = true; v.g.visible = false; }
        else {
          const dp = doorPoint(K);
          if (walkTo(v, dp.x, dp.z, dt, 1, .4, 1.4) || nearDoor(v, K, dp) || v.noProg > 5) { v.inside = true; v.indoor = K; goIn(v, K); deliver(v); }
        }
      }
    } else {
      if (v.summoned) { if (!v.gone && !v.homeIn) rideHome(v, dt); }
      else if (v.unkit) { updateUnkit(v, dt); }
      else if (v.crewStrip > 0) { updateCrewStrip(v, dt); }
      else {
      if (v.inside) { v.inside = false; exitDoor(v); v.state = v.build ? 'tobuild' : v.job ? 'commute' : 'find'; v.wait = Math.random() * 1.5; }
      feedVillager(v, dt);
      if (v.hungry) { updateHungry(v, dt); if (v.sleeping) continue; }
      else {
        const want = toolFor(v) || null;
        if (v.push) updatePush(v, dt);
        else if ((v.toolKind || null) !== want || v.changeT > 0 || (want && want !== 'hammer' && v.job && v.dressT !== v.job.tier)) updateChange(v, dt, want);   // new tool, or the workplace's new tier     // wrong clothes for the next task: change first
        else {
          if (!(v.hideT > 0) && !canStand(v.x, v.z, 1)) exitDoor(v);
          if (v.build) updateBuilder(v, dt); else if (v.job) updateWorker(v, dt, now); else updateWander(v, dt);
          // out in a pocket that doesn't join up with the castle for 3 s (wandering or pushing at a way out): get them out
          if (v.g.visible && !(v.hideT > 0) && !v.doorWalk && mainRegion() && regionAt(v.x, v.z) !== mainRegion()) { if ((v.trapT = (v.trapT || 0) + dt) > 3) { freeTrapped(v); v.trapT = 0; } } else v.trapT = 0;
        }
      }
      }
    }
    if (!v.doorWalk && (v.inside || v.hideT > 0 || (v.posted && !v.soldier) || v.sleeping || !v.g.visible || v.climb)) continue;   // a climber is drawn by updateClimb
    const amp = stride(v, dt, 9), swing = Math.sin(v.phase) * .6 * amp;
    if (v.horse) {                                                    // a rider: legs astride, the horse's diagonal pairs stride
      v.legs[0].rotation.set(-1.2, 0, -.55); v.legs[1].rotation.set(-1.2, 0, .55); v.body.position.y = SADDLE + Math.abs(Math.sin(v.phase * 1.4)) * .04 * amp;
      horseGait(v.horseLegs, v.phase * 1.4, amp);
    } else {
      v.legs[0].rotation.x = swing; v.legs[1].rotation.x = -swing;
      v.body.position.y = Math.abs(Math.sin(v.phase)) * .05 * amp;
    }
    const cheer = v.cheerT > 0 && !v.build && !v.working; if (v.cheerT > 0) v.cheerT -= dt;
    if (v.seed === undefined) v.seed = Math.random() * 6.283;    // fixed per villager: v.phase runs on with the stride, which would speed up swings
    if (cheer) v.body.position.y += Math.abs(Math.sin(now / 1000 * 9 + v.seed)) * .14;
    const carrying = v.carryLog.visible || v.carryStone.visible;
    // arm angle: 0 hangs down, -1.57 points straight ahead, -3 is overhead; tools follow the right hand
    const kind = v.pivot ? v.toolKind : null, logC = v.carryLog.visible, stoneC = v.carryStone.visible;
    let L = -swing * .8, Rt = swing * .8, tilt = -.2, lean = 0, w = null, crouch = 0, twist = 0, big = false;
    const barrow = stoneC && v.barrowOn;
    if (barrow && !v.barrow) { v.barrow = makeBarrow(); v.g.add(v.barrow); }
    if (v.barrow) v.barrow.visible = barrow; v.carryStone.scale.setScalar(barrow ? .001 : 1);
    if (logC) { Rt = -2.75; L = -swing * .6; }                       // hand on the log over the right shoulder
    else if (barrow) { L = Rt = -.75; lean = .08; }                   // both hands on the barrow's handles
    else if (stoneC) { L = Rt = -1.2; }                               // block held against the chest
    else if (v.working && TOOL_POSE[kind]) { ({ w, R: Rt, L, tilt, lean, crouch = 0, twist = 0, big = false } = TOOL_POSE[kind](now / 1000 + v.seed, v.seed)); if (crouch) kneel(v, crouch); } else if (kind) { Rt = -.3 + swing * .25; tilt = -.25; }          // walking with the tool held low
    if (v.changing) {                                                 // bending down to change: lean in and out, arms to the ground
      // down on one knee and up again (the figure bends only at the ground, so it kneels rather than stoops), hands to the ground
      const k = Math.sin(Math.PI * clamp(1 - v.changeT / CHANGE_T, 0, 1)); lean = .22 * k; L = Rt = -1.0 * k; tilt = -.2; kneel(v, k);
      v.toolOff = k > .35;
    }
    if (v.soldier) {                                                  // weapon carried upright; a thrust or a cut when striking
      const at = v.attackT || 0; L = -.55 - swing * .2; lean = 0;
      if (v.toolKind === 'spear') { const u = spearThrust(at); Rt = -1.0 - .45 * u + swing * .08; tilt = -.57 + .45 * u - swing * .08; }   // set exactly below (spearPose)
      else { Rt = -.45; tilt = -.4; }   // set exactly below (swordPose)
    }
    if (w !== null) { if (w > .85) { if (!v.struck) { v.struck = true; sfx(STROKE_SFX[kind], v); chipBurst(v, kind, big); } } else if (w < 0) v.struck = false; }
    v.body.rotation.y += (twist - v.body.rotation.y) * Math.min(1, dt * 14);
    const ease = (o, t) => o + (t - o) * Math.min(1, dt * 14);    // poses blend over ~0.1 s, so switching task never snaps
    if (v.pivot) { v.pivot.visible = !logC && !stoneC && !(v.changing && v.toolOff); v.pivot.rotation.x = ease(v.pivot.rotation.x, tilt); }
    if (v.pushing) { L = Rt = -1.45; lean = .1; }                    // both hands on the engine's back beam
    if (cheer) { L = -2.9 + Math.sin(now / 1000 * 9) * .2; Rt = -2.9 - Math.sin(now / 1000 * 9) * .2; lean = 0; }
    v.arms[0].rotation.x = ease(v.arms[0].rotation.x, L); v.arms[1].rotation.x = ease(v.arms[1].rotation.x, Rt); v.body.rotation.x = ease(v.body.rotation.x, lean);
    if (v.soldier) (v.toolKind === 'spear' ? spearPose : swordPose)(v, v.attackT || 0, swing);   // exact: eased, the strikes go soft
    smoothPos(v, dt, now); v.g.position.set(v.rx, walkY(v.rx, v.rz), v.rz);
    if (v.sbar) { const on = v.soldier && v.hp < v.maxHp; v.sbar.grp.visible = on; if (on) { v.sbar.set(v.hp / v.maxHp); v.sbar.grp.position.set(v.rx, v.g.position.y + 1.5 * UNIT_K, v.rz); } }
  }
}
function updateTrees(now) {
  let dirty = false;
  for (const t of trees) {
    if (t.dead || !t.cut) continue;
    if (t.k > 0 && t.fallStart) { const e = clamp((now - t.fallStart) / 700, 0, 1); t.tilt = e * 1.4; t.k = 1 - sstep(.6, 1, e); dirty = true; if (e >= 1) { t.k = 0; t.tilt = 0; t.fallStart = 0; } }
    else if (now > t.regrow) { t.k = Math.min(1, t.k + .006); dirty = true; if (t.k >= 1) t.cut = false; }
  }
  if (dirty) seatTrees();
}

