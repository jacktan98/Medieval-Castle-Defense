// ---------- building models (3 tiers each) ----------
// every tier-1 door (and every house and barracks door) is the size of the lumber camp's: 0.55 x 1.0 m
const DOOR_W = .55, DOOR_H = 1.0;
function makeHouse(tier, plinth) {
  const g = new THREE.Group();
  if (plinth) g.add(box(2.0, 1.6, 2.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  if (tier === 1) {            // hovel: crooked wattle-and-daub, sagging thatch
    const w = box(1.25, 1.25, 1.05, M.mud, 0, .7, 0); w.rotation.z = .035; g.add(w);
    for (const sx of [-1, 1]) g.add(box(.09, 1.3, .09, M.rough, sx * .62, .7, .52));
    g.add(box(1.3, .08, .08, M.rough, 0, 1.32, .53));
    g.add(pyramid(1.12, 1.15, .95, M.thatchOld, 1.9));
    g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[1], 0, .08 + DOOR_H / 2, .54));
    g.add(box(.16, .14, .04, M.glow, .45, 1.0, .54));
    if (UPK.chimney) g.add(box(.16, .55, .16, M.stone, .4, 1.98, -.22));
  } else if (tier === 2) {     // cottage: plain daub walls, corner posts, a straw gable roof, one door and one window
    g.add(box(1.4, 1.3, 1.1, M.daub, 0, .75, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.1, 1.32, .1, M.timber, sx * .68, .75, sz * .53));
    g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[2], 0, .1 + DOOR_H / 2, .56));
    g.add(box(.18, .18, .04, M.glow, .45, .95, .56));
    g.add(prism(1.4, 1.1, .7, M.daub, 0, 1.4, 0));
    const sl = Math.atan2(.7, .55), len = Math.hypot(.7, .55) + .2;
    for (const sz of [-1, 1]) { const r = box(1.6, .1, len, M.logGable, 0, 1.4 + .35, sz * .35); r.rotation.x = sz * sl; g.add(r); }
    if (UPK.chimney) g.add(box(.18, .45, .18, M.stone, .45, 2.01, -.25));
  } else {                     // town house: one tall stone storey, a timber band and a plaster gable, blue gable roof
    g.add(box(1.4, 1.45, 1.2, M.stone2, 0, .8, 0));
    g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[3], 0, .1 + DOOR_H / 2, .61));
    for (const sx of [-1, 1]) g.add(box(.18, .26, .04, M.glow, sx * .47, 1.1, .61));
    g.add(box(1.46, .07, 1.26, M.timber, 0, 1.53, 0));
    g.add(prism(1.4, 1.2, .8, M.plaster, 0, 1.56, 0));
    const sl = Math.atan2(.8, .6), len = Math.hypot(.8, .6) + .2;
    for (const sz of [-1, 1]) { const r = box(1.6, .1, len, M.roofBlue, 0, 1.56 + .4 + .03, sz * .32); r.rotation.x = sz * sl; g.add(r); }
    if (UPK.chimney) g.add(box(.2, .6, .2, M.stone2, .45, 2.15, -.3));
  }
  return g;
}
function makeTower(tier, plinth) {
  const g = new THREE.Group(), k = TOWER_K[tier - 1];
  if (plinth) g.add(box(2.0, 1.8, 2.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  // the shaft is drawn at TOWER_K scale; the roof is set a person's height above the platform so archers stand under it
  const t = new THREE.Group(); t.scale.setScalar(k); g.add(t);
  const HEAD = 1.55, top = new THREE.Group(); g.add(top);
  const posts = (r, y0, m, w = .08) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) top.add(box(w, HEAD, w, m, sx * r, y0 + HEAD / 2, sz * r)); };
  if (tier === 1) {            // lookout: lashed logs, ladder, thatched hood
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(.2, 3.1, .2, M.rough, sx * .62, 1.55, sz * .62); l.rotation.z = -sx * .05; l.rotation.x = sz * .05; t.add(l); }
    { const span = 1.24, rise = 1.9, L = Math.hypot(span, rise), a = Math.atan2(rise, span);   // a brace on each side, leg to leg
      for (const sz of [-1, 1]) { const x = box(L, .09, .09, M.rough, 0, .35 + rise / 2, sz * .64); x.rotation.z = sz * a; t.add(x); }
      for (const sx of [-1, 1]) { const x = box(.09, .09, L, M.rough, sx * .64, .35 + rise / 2, 0); x.rotation.x = sx * a; t.add(x); } }
    t.add(box(1.7, .18, 1.7, M.rough, 0, 3.1, 0));
    for (let n = 0; n < 8; n++) { const a = n / 8 * Math.PI * 2; const p = box(.07, .5, .07, M.rough, Math.cos(a) * .8, 3.4, Math.sin(a) * .8); p.rotation.z = (hash(n, 4) - .5) * .3; t.add(p); }
    for (const sx of [-1, 1]) t.add(box(.06, 3.5, .06, M.rough, sx * .22, 1.75, -.95));   // the ladder up the back
    for (let y = .35; y < 3.1; y += .4) t.add(box(.5, .05, .05, M.rough, 0, y, -.95));
    const P = 3.19 * k; posts(.7 * k, P, M.rough);
    top.add(pyramid(1.35 * k, .9 * k, 1, M.thatchOld, P + HEAD + .45 * k));
  } else if (tier === 2) {     // watchtower: squared timber, parapet, roof
    const kk = new THREE.Group(); kk.scale.setScalar(.74); t.add(kk);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) kk.add(box(.24, 4.3, .24, M.wood, sx * .7, 2.3, sz * .7));
    for (const y of [1.5, 3.0]) { kk.add(box(1.6, .12, .12, M.timber, 0, y, .7)); kk.add(box(1.6, .12, .12, M.timber, 0, y, -.7));
      kk.add(box(.12, .12, 1.6, M.timber, .7, y, 0)); kk.add(box(.12, .12, 1.6, M.timber, -.7, y, 0)); }
    kk.add(box(2.2, .25, 2.2, M.timber, 0, 4.5, 0));
    kk.add(box(2.2, .6, .12, M.wood, 0, 4.9, 1.05)); kk.add(box(2.2, .6, .12, M.wood, 0, 4.9, -1.05));
    kk.add(box(.12, .6, 2.2, M.wood, 1.05, 4.9, 0)); kk.add(box(.12, .6, 2.2, M.wood, -1.05, 4.9, 0));
    for (const sx of [-1, 1]) kk.add(box(.08, 5.4, .08, M.timber, sx * .25, 2.7, -1.16));   // the ladder up the back, past the parapet
    for (let y = .45; y < 4.6; y += .45) kk.add(box(.58, .06, .06, M.timber, 0, y, -1.16));
    const s2 = .74 * k, P = 4.625 * s2; posts(.95 * s2, P, M.timber, .09);
    const R = P + HEAD; top.add(pyramid(1.75 * s2, 1.3 * s2, 1, M.thatch, R + .65 * s2));
    roofFlag(top, 0, R + 1.3 * s2 - .1, 0);
  } else {                     // stone tower: round masonry, an open platform with a low parapet, blue roof on stone columns
    const sh = cyl(.82, 1.0, 4.6, 8, M.stone2, 0, 2.3, 0); sh.rotation.y = Math.PI / 8; t.add(sh);   // a flat face to the back, for the door
    t.add(cyl(1.05, 1.05, .2, 8, M.stone, 0, 4.6, 0));
    // the door at the back, set into the wall in a stone frame (jambs and a lintel standing proud of it)
    { const dw = DOOR_W / k, dh = DOOR_H / k, y0 = .2 / k;
      t.add(box(dw + .06, dh + .04, .06, M.dark, 0, y0 + dh / 2, -.9)); t.add(box(dw, dh, .06, DOOR_M[3], 0, y0 + dh / 2, -.93));
      for (const sx of [-1, 1]) t.add(box(.13, dh + .12, .16, M.stone, sx * (dw / 2 + .065), y0 + (dh + .12) / 2, -.97));
      t.add(box(dw + .39, .16, .18, M.stone, 0, y0 + dh + .16, -.97)); }
    for (const a of [0, 1.6, 3.2, 4.8]) { const sl = box(.08, .4, .14, M.dark, Math.cos(a) * .9, 2.8, Math.sin(a) * .9); sl.rotation.y = -a; t.add(sl); }
    for (let n = 0; n < 8; n++) { const a = (n + .5) / 8 * Math.PI * 2, m = box(.3, .32, .16, M.stone2, Math.cos(a) * .96, 4.86, Math.sin(a) * .96); m.rotation.y = -a + Math.PI / 2; t.add(m); }
    const P = 4.7 * k;
    for (const a of [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4]) top.add(cyl(.08, .1, HEAD, 6, M.stone2, Math.cos(a) * .92 * k, P + HEAD / 2, Math.sin(a) * .92 * k));
    const R = P + HEAD; top.add(cyl(1.1 * k, 1.1 * k, .1, 8, M.stone, 0, R + .05, 0));
    top.add(coneRoof(1.4 * k, 1.5 * k, 8, M.roofBlue, 0, R + .1 + .75 * k, 0));
    roofFlag(top, 0, R + 1.5 * k, 0);
  }
  return g;
}
// stone castles are drawn narrower (x/z only) so their corner towers stay inside the 3×3 footprint
const CASTLE_K = [1, .9, .82];
function makeCastle(tier, plinth) {
  const root = new THREE.Group(), g = new THREE.Group(), W = 2.6, k = CASTLE_K[tier - 1];
  if (plinth) root.add(box(6.0, 2.0, 6.0, tier === 2 ? M.plainStone : M.stone, 0, -.8, 0));
  g.scale.set(k, 1, k); root.add(g);
  if (tier > 1) g.add(box(4.8, .12, 4.8, tier === 2 ? M.plainStone : M.stone, 0, .26, 0));   // courtyard paved like the base
  if (tier === 1) {            // palisade fort: sharpened logs and a timber hall
    for (let s = -W; s <= W + .01; s += .45) {
      const hh = k => 2.0 + hash(s * 3, k) * .4;
      g.add(cyl(.14, .16, hh(1), 5, M.rough, s, 1.1, -W)); g.add(cyl(.14, .16, hh(2), 5, M.rough, W, 1.1, s)); g.add(cyl(.14, .16, hh(3), 5, M.rough, -W, 1.1, s));
      if (Math.abs(s) > .7) g.add(cyl(.14, .16, hh(4), 5, M.rough, s, 1.1, W));
    }
    g.add(box(2.4, 2.4, 2.0, M.wood, 0, 1.5, -.6));
    g.add(pyramid(2.1, 1.45, .86, M.thatchOld, 3.42, 0, -.6));   // eaves stick out past the hall walls
    // the hall door is wide and tall enough for a rider (the castle's Riders ride out of it): 1.0 x 1.42, swinging out
    g.add(box(.96, 1.38, .01, M.dark, 0, .99, .405)); g.add(leaf(1.0, 1.42, .06, DOOR_M[1], -.5, 1.01, .42, 1, -1.4));
    for (const sx of [-1, 1]) g.add(box(.26, .36, .06, M.glow, sx * .76, 1.98, .42));   // two plain lit windows either side above the door, like the stone keep's
    for (const [px, pz] of [[1.9, 1.9], [-1.9, 1.9], [1.9, -1.9], [-1.9, -1.9]]) {   // a small lookout platform in each corner of the stockade
      g.add(box(.8, .1, .8, M.rough, px, 2.5, pz));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.09, 2.5, .09, M.rough, px + sx * .33, 1.25, pz + sz * .33));
      for (const sx of [-1, 1]) g.add(box(.05, .3, .8, M.rough, px + sx * .38, 2.7, pz));
    }
    g.add(box(.06, 1.4, .06, M.timber, 0, 4.4, -.6)); g.add(flagBox(.7, .4, .04, M.flag, .38, 4.8, -.6));
  } else if (tier === 2) {     // stone keep: plain stone curtain walls, square corner towers open on top, gatehouse, keep with a straw roof
    const wall = (w, d, x, z) => { g.add(box(w, 1.9, d, M.stone2, x, 1.2, z)); };
    wall(5.2, .45, 0, -W); wall(.45, 5.2, W, 0); wall(.45, 5.2, -W, 0); wall(1.6, .45, -1.8, W); wall(1.6, .45, 1.8, W);
    for (let s2 = -1.9; s2 <= 1.91; s2 += .76) {             // merlons along the outer edge of each wall
      g.add(box(.32, .32, .2, M.stone2, s2, 2.3, -W - .12)); g.add(box(.2, .32, .32, M.stone2, W + .12, 2.3, s2)); g.add(box(.2, .32, .32, M.stone2, -W - .12, 2.3, s2));
      if (Math.abs(s2) > 1) g.add(box(.32, .32, .2, M.stone2, s2, 2.3, W + .12));
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {   // square towers with low merlons; archers stand on the open top
      const x = sx * W, z = sz * W;
      g.add(box(1.15, 3.45, 1.15, M.stone2, x, 1.8, z)); g.add(box(1.3, .12, 1.3, M.stone2, x, 3.5, z));
      for (const px of [-1, 1]) for (const pz of [-1, 1]) { g.add(box(.22, .28, .22, M.stone2, x + px * .54, 3.7, z + pz * .54)); }
    }
    // the gate is wide enough for a rider: the towers stand further apart, wider leaves under a longer lintel
    for (const sx of [-1, 1]) g.add(box(.62, 2.9, .9, M.stone2, sx * .9, 1.65, W));
    g.add(box(2.42, .6, .9, M.stone2, 0, 3.0, W));
    for (const s2 of [-.9, 0, .9]) g.add(box(.3, .3, .9, M.stone2, s2, 3.45, W));
    for (const sx of [-1, 1]) g.add(leaf(.57, 1.8, .08, DOOR_M[2], sx * .57, 1.2, W + .42, -sx, -sx * 1.4));   // gatehouse doors swing in
    g.add(box(2.4, 3.6, 2.4, M.stone2, 0, 2.0, -.4));
    g.add(box(.3, .42, .06, M.glow, -.45, 2.6, .82)); g.add(box(.3, .42, .06, M.glow, .45, 2.6, .82));
    // the keep's door is the palisade fort's hall door's size (1.0 x 1.42 m once drawn at k), so the castle's riders come out of it
    g.add(box(.96 / k, 1.38, .01, M.dark, 0, .32 + .69, .805)); g.add(leaf(1.0 / k, 1.42, .06, DOOR_M[2], -.5 / k, .32 + .71, .82, 1, -1.4));
    g.add(pyramid(1.95, 1.5, 1, M.thatch, 4.55, 0, -.4));
    g.add(box(.07, 1.3, .07, M.timber, 0, 5.8, -.4)); g.add(flagBox(.8, .45, .04, M.flag, .43, 6.2, -.4));
  } else {                     // castle: round towers, gatehouse, tall keep, banners
    g.add(box(5.2, 2.2, .5, M.stone2, 0, 1.3, -W)); g.add(box(.5, 2.2, 5.2, M.stone2, W, 1.3, 0)); g.add(box(.5, 2.2, 5.2, M.stone2, -W, 1.3, 0));
    g.add(box(1.6, 2.2, .5, M.stone2, -1.8, 1.3, W)); g.add(box(1.6, 2.2, .5, M.stone2, 1.8, 1.3, W));
    for (let s = -2.0; s <= 2.01; s += .8) {
      g.add(box(.35, .4, .55, M.stone2, s, 2.6, -W)); g.add(box(.55, .4, .35, M.stone2, W, 2.6, s)); g.add(box(.55, .4, .35, M.stone2, -W, 2.6, s));
      if (Math.abs(s) > 1) g.add(box(.35, .4, .55, M.stone2, s, 2.6, W));
    }
    g.add(box(.7, 3.0, .9, M.stone2, -.92, 1.7, W)); g.add(box(.7, 3.0, .9, M.stone2, .92, 1.7, W));
    g.add(box(2.54, .7, .9, M.stone2, 0, 3.0, W)); for (const s of [-.92, 0, .92]) g.add(box(.36, .34, .9, M.stone2, s, 3.52, W));   // merlons over the gate, the full depth as at tier 2
    for (const sx of [-1, 1]) g.add(leaf(.57, 1.8, .08, DOOR_M[3], sx * .57, 1.2, W + .42, -sx, -sx * 1.4));
    g.add(drapeBox(.5, .9, .04, M.drape, -.92, 2.2, W + .47)); g.add(drapeBox(.5, .9, .04, M.drape, .92, 2.2, W + .47));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(cyl(.75, .85, 3.6, 8, M.stone2, sx * W, 2.0, sz * W)); g.add(cyl(.95, .95, .25, 8, M.stone, sx * W, 3.9, sz * W));
      g.add(coneRoof(1.0, 1.4, 8, M.roofBlue, sx * W, 4.7, sz * W));
    }
    g.add(box(2.4, 4.6, 2.4, M.stone2, 0, 2.5, -.4));
    for (const [x, z, w, d] of [[0, -W + .5, 4.2, .55], [W - .5, 0, .55, 4.2], [-W + .5, 0, .55, 4.2], [-1.75, W - .5, 1.3, .55], [1.75, W - .5, 1.3, .55]]) {
      g.add(box(w, .1, d, DOOR_M[3], x, 2.35, z));          // the wall-walk planks, the tier's brown
      for (const k of [-1, 1]) if (w > d) g.add(box(.1, 2.1, .1, M.timber, x + k * (w / 2 - .2), 1.3, z + .2)); else g.add(box(.1, 2.1, .1, M.timber, x + .2 * -Math.sign(x), 1.3, z + k * (d / 2 - .2)));
    }
    for (const s of [-.9, 0, .9]) {
      g.add(box(.4, .45, .4, M.stone2, s, 5.0, -1.4)); g.add(box(.4, .45, .4, M.stone2, s, 5.0, .6));
      g.add(box(.4, .45, .4, M.stone2, -1.0, 5.0, s - .4)); g.add(box(.4, .45, .4, M.stone2, 1.0, 5.0, s - .4));
    }
    g.add(box(.5, .7, .06, M.glow, 0, 3.4, .82)); g.add(box(.5, .5, .06, M.glow, 0, 2.3, .82));
    // a rider-sized door into the keep, as at tier 2
    g.add(box(.96 / k, 1.38, .01, M.dark, 0, .32 + .69, .805)); g.add(leaf(1.0 / k, 1.42, .06, DOOR_M[3], -.5 / k, .32 + .71, .82, 1, -1.4));
    g.add(box(.07, 1.8, .07, M.timber, 0, 5.9, -.4)); g.add(flagBox(.9, .5, .04, M.flag, .48, 6.5, -.4));
  }
  return root;
}
const LODGE_K = .7, LODGE_KY = .8, LODGE_AT = [-.55, -.15], LODGE_DOOR = -.65;   // cabin where the shack's hut stands, door on the shack's door line   // T2/T3 cabin drawn at .7 in plan and .8 in height; its door keeps the standard size
function makeLodge(tier, plinth) {
  const g = new THREE.Group();
  if (plinth) g.add(box(4.0, 1.8, 4.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  // a log pile lying across the front (logs along x), stacked in a pyramid
  const pile = (x, z, n, rad = .17) => { const d = rad * 2.1; for (let r = 0; r < n; r++) for (let c = 0; c < n - r; c++) { const l = cyl(rad, rad, 1.1, 7, M.log, x, rad * 1.8 + r * d * .87, z + (c - (n - r - 1) / 2) * d); l.rotation.z = Math.PI / 2; g.add(l); } };
  const axeStump = (x, z) => { g.add(cyl(.28, .3, .45, 8, M.logEnd, x, .25, z)); const h = box(.05, .6, .05, M.timber, x + .08, .7, z); h.rotation.z = -.4; g.add(h); g.add(box(.05, .16, .22, M.iron, x - .02, .5, z)); };
  if (tier === 1) {            // woodcutter's hut: short log walls, thatched roof, chopping stump
    const X = -.55, D = X - .1;  // hut centre and its door (DOOR.lodge[0]; doorShift lines the path tile's arm up with it)
    for (let n = 0; n < 4; n++) {
      const y = .3 + n * .3;
      if (n < 3) for (const [x0, x1] of [[X - 1, D - .27], [D + .27, X + 1]]) { const l1 = cyl(.15, .15, x1 - x0, 6, M.log, (x0 + x1) / 2, y, .45); l1.rotation.z = Math.PI / 2; g.add(l1); }
      else { const l1 = cyl(.15, .15, 2.0, 6, M.log, X, y, .45); l1.rotation.z = Math.PI / 2; g.add(l1); }
      const l2 = cyl(.15, .15, 2.0, 6, M.log, X, y, -.75); l2.rotation.z = Math.PI / 2; g.add(l2);
      const l3 = cyl(.15, .15, 1.4, 6, M.log, X + .9, y + .15, -.15); l3.rotation.x = Math.PI / 2; g.add(l3);
      const l4 = cyl(.15, .15, 1.4, 6, M.log, X - .9, y + .15, -.15); l4.rotation.x = Math.PI / 2; g.add(l4);
    }
    g.add(box(1.7, 1.2, 1.1, M.rough, X, .75, -.15));
    g.add(pyramid(1.5, 1.1, .78, M.thatchOld, 1.9, X, -.15));
    g.add(box(DOOR_W, DOOR_H, .06, DOOR_M[1], D, .08 + DOOR_H / 2, .46));
    pile(1.05, 1.25, 2);
    axeStump(1.1, -.85);       // chopping block round the back, beside the hut
  } else {                     // log cabin, then timber yard; the cabin is drawn at LODGE_K in x and z (the door keeps its size)
    const cab = new THREE.Group(), K = LODGE_K, CX = LODGE_AT[0], CZ = LODGE_AT[1]; cab.scale.set(K, LODGE_KY, K); cab.position.set(CX, 0, CZ); g.add(cab);
    for (let n = 0; n < 5; n++) {
      const y = .35 + n * .32;
      const l1 = cyl(.17, .17, 2.9, 6, M.log, 0, y, .9); l1.rotation.z = Math.PI / 2; cab.add(l1);
      const l2 = cyl(.17, .17, 2.9, 6, M.log, 0, y, -.9); l2.rotation.z = Math.PI / 2; cab.add(l2);
      const l3 = cyl(.17, .17, 2.0, 6, M.log, 1.3, y + .16, 0); l3.rotation.x = Math.PI / 2; cab.add(l3);
      const l4 = cyl(.17, .17, 2.0, 6, M.log, -1.3, y + .16, 0); l4.rotation.x = Math.PI / 2; cab.add(l4);
    }
    cab.add(box(2.5, 1.5, 1.7, M.wood, 0, .95, 0));
    cab.add(pyramid(2.2, 1.4, .82, tier === 3 ? M.roofBlue : M.thatch, 2.55));
    g.add(box(DOOR_W, DOOR_H, .06, DOOR_M[tier], LODGE_DOOR, .2 + DOOR_H / 2, CZ + 1.08 * K));
    g.add(box(.26, .22, .06, M.glow, CX + .55 * K, 1.0, CZ + 1.08 * K));
    if (tier === 2) {          // log pile at the front, a stack of chopped firewood beside the cabin, the chopping block behind
      pile(1.05, 1.25, 3, .14);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6 - r; c++) { const w = cyl(.075, .075, .5, 6, M.logEnd, 1.15, .08 + r * .13, .2 + (c - (5 - r) / 2) * .15); w.rotation.z = Math.PI / 2; g.add(w); }
      for (const z of [-.3, .7]) g.add(box(.05, .6, .05, M.timber, 1.15, .3, z));   // stakes holding the stack
    } else pile(.95, 1.3, 4, .13);   // the yard piles its logs higher
    axeStump(1.15, -1.35);
    if (tier === 3) {
      cab.add(box(.45, 2.6, .45, M.stone, 1.05, 1.7, -.45));
      // sawbuck: two X trestles cradling a log, a frame saw standing in the cut, sawn rounds beside it
      const SX = 1.15, SZ = -1.37;  // the sawbuck, beside the cabin on its right
      for (const z of [1.35, 1.8]) for (const sx of [-1, 1]) { const l = box(.07, .8, .07, M.timber, SX, .38, z + SZ); l.rotation.z = sx * .55; g.add(l); }
      const lg = cyl(.13, .13, .75, 7, M.log, SX, .62, 1.57 + SZ); lg.rotation.x = Math.PI / 2; g.add(lg);
      g.add(box(.012, .09, .5, M.iron, SX, .78, 1.57 + SZ));
      for (const z of [1.34, 1.8]) g.add(box(.035, .3, .035, M.timber, SX, .9, z + SZ));
      g.add(box(.035, .035, .52, M.timber, SX, 1.04, 1.57 + SZ));
      g.add(cyl(.14, .14, .2, 7, M.logEnd, SX - .3, .1, 1.22 + SZ)); g.add(cyl(.12, .12, .18, 7, M.logEnd, SX - .24, .29, 1.25 + SZ));
    }
  }
  return g;
}
// market: tier 1 one stall under a striped awning, tier 2 two stalls and a cart, tier 3 an open hall on stone pillars
// with a blue roof; goods everywhere (crates, sacks, barrels, produce, cloth)
const MARKET_K = .8;
function makeMarket(tier, plinth) {
  const root = new THREE.Group(), g = new THREE.Group(); g.scale.setScalar(MARKET_K); root.add(g);   // drawn smaller than its tile, like other 2x2s
  if (plinth) root.add(box(4.0, 1.8, 4.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  const crate = (x, z, s = .32, r = 0) => { const c = box(s, s, s, M.wood, x, s / 2, z); c.rotation.y = r; g.add(c); };
  const sack = (x, z, r = .15) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), M.canvas); o.scale.y = 1.25; o.position.set(x, r * 1.1, z); o.castShadow = true; g.add(o); };
  const barrel = (x, z) => { g.add(cyl(.17, .15, .44, 9, M.log, x, .22, z)); g.add(cyl(.175, .175, .04, 9, M.iron, x, .32, z)); };
  const wheat = (x, z) => { barrel(x, z); g.add(cyl(.15, .15, .06, 9, M.wheat, x, .46, z)); for (let i = 0; i < 5; i++) { const st = cone(.03, .22, 4, M.wheat, x + Math.cos(i * 1.3) * .08, .56, z + Math.sin(i * 1.3) * .08); st.rotation.z = Math.cos(i * 1.3) * .3; g.add(st); } };
  const logs = (x, z, along = 0) => {                // a stack of five logs, 3 then 2
    for (const [dy, dw] of [[.12, -.25], [.12, 0], [.12, .25], [.33, -.125], [.33, .125]]) { const l = cyl(.12, .12, 1.0, 7, M.log, x + (along ? 0 : dw), dy, z + (along ? dw : 0)); if (along) l.rotation.x = Math.PI / 2; else l.rotation.z = Math.PI / 2; g.add(l); }
  };
  const stones = (x, z) => {                          // cut blocks, three below and two on top
    for (const [dx, dy, dz] of [[-.28, .12, 0], [0, .12, .04], [.28, .12, -.02], [-.14, .36, .01], [.15, .36, .02]]) { const b = box(.26, .22, .26, M.stone2, x + dx, dy, z + dz); b.rotation.y = dx; g.add(b); }
  };
  const produce = (x, z, w) => {                     // a tray of fruit, veg and cloth on a counter top at height y
    for (let i = 0; i < 6; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 4), FLOWER[i % 5]); o.position.set(x - w / 2 + .1 + i * (w - .2) / 5, .86, z + (i % 2) * .08); o.castShadow = true; g.add(o); }
  };
  // a stall: posts, counter, awning sloping to the front in canvas and blue stripes
  const stall = (x, z, w, d, rot = 0) => {
    const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = rot;
    const P = tier === 1 ? M.rough : M.timber;
    for (const sx of [-1, 1]) { s.add(box(.08, 1.75, .08, P, sx * (w / 2 - .05), .87, -d / 2 + .05)); s.add(box(.08, 1.45, .08, P, sx * (w / 2 - .05), .72, d / 2 - .05)); }
    s.add(box(w - .1, .08, .5, M.wood, 0, .78, d / 2 - .3)); s.add(box(w - .1, .7, .06, M.wood, 0, .38, d / 2 - .1));
    const stripes = 7, aw = new THREE.Group(); aw.position.set(0, 1.62, 0); aw.rotation.x = .32;
    for (let i = 0; i < stripes; i++) aw.add(box((w + .2) / stripes, .03, d + .25, i % 2 ? M.awning : M.canvas, -w / 2 - .1 + (i + .5) * (w + .2) / stripes, 0, .05));
    s.add(aw);
    for (let i = 0; i < 5; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 4), FLOWER[i % 5]); o.position.set(-w / 2 + .3 + i * (w - .6) / 4, .86, d / 2 - .3); o.castShadow = true; s.add(o); }
    g.add(s);
  };
  if (tier === 1) {
    stall(0, -.15, 1.7, 1.05);
    crate(-1.1, .75); crate(-1.05, 1.15, .26, .4); sack(1.0, .8); sack(1.25, 1.05, .12); barrel(1.15, -.9); crate(-1.15, -.85, .34, .2);
    wheat(.3, 1.35); logs(-1.75, .1, 1); stones(1.75, .1); logs(.4, -1.45);
  } else if (tier === 2) {
    stall(-.9, -.6, 1.8, 1.2); stall(1.05, -.4, 1.6, 1.1, -.25);
    // a hand cart of goods at the front
    g.add(box(.9, .1, .6, M.wood, -.6, .42, 1.2)); g.add(box(.9, .22, .05, M.wood, -.6, .56, .92)); g.add(box(.9, .22, .05, M.wood, -.6, .56, 1.48));
    for (const sz of [-1, 1]) { const wh = cyl(.26, .26, .06, 10, M.timber, -.6, .26, 1.2 + sz * .34); wh.rotation.x = Math.PI / 2; g.add(wh); }
    g.add(box(.05, .05, .9, M.timber, .1, .45, 1.2)); sack(-.75, 1.2, .13); sack(-.45, 1.25, .12);
    barrel(1.5, 1.1); barrel(1.15, 1.35); crate(.55, 1.4, .3, .5); crate(-1.6, .6, .3);
    stones(2.0, .3); wheat(.35, .65); logs(0, -1.85); wheat(1.8, -1.6);
  } else {
    // open market hall: stone pillars, a timber floor frame, a steep blue gable roof; tables of goods inside
    for (const x of [-1.5, 0, 1.5]) for (const z of [-1.3, 1.3]) { g.add(cyl(.14, .17, 2.1, 8, M.stone2, x, 1.05, z)); g.add(box(.36, .14, .36, M.stone2, x, 2.1, z)); }
    g.add(box(3.6, .16, .2, M.timber, 0, 2.22, -1.3)); g.add(box(3.6, .16, .2, M.timber, 0, 2.22, 1.3));
    for (const x of [-1.5, 0, 1.5]) g.add(box(.16, .16, 2.8, M.timber, x, 2.22, 0));
    g.add(prism(3.9, 3.3, 1.3, M.roofBlue, 0, 2.3, 0));
    for (const x of [-.8, .8]) { g.add(box(1.1, .06, .6, M.wood, x, .78, 0)); for (const sx of [-1, 1]) g.add(box(.06, .76, .5, M.wood, x + sx * .5, .38, 0)); produce(x, -.05, 1.0); }
    // goods under the roof, along the back and front between the pillars
    for (const [x, z] of [[-1.12, -.82], [-.74, -.95], [-.95, -.55], [.78, -.88], [1.15, -.78], [1.12, .2]]) barrel(x, z);
    crate(1.15, .8, .32, .3); crate(.8, .95, .26, .1); sack(-1.15, .82); sack(-.85, .95, .12); crate(-.3, -.95, .28, .5);
    // and round the hall, on the open paving
    wheat(-1.7, 2.1); stones(1.9, 2.05); logs(-1.2, -2.1); wheat(2.2, .0);
    // a sign hung from an iron bracket on the middle front pillar, square to the front
    g.add(box(.04, .04, .56, M.iron, 0, 1.86, 1.66));     for (const z of [1.62, 1.86]) g.add(box(.015, .14, .015, M.iron, 0, 1.78, z));
    g.add(box(.04, .3, .34, M.awning, 0, 1.56, 1.74));
  }
  return root;
}
// barracks: a hall on the left (door at x -1) and a drill yard on the right with a weapon rack and a practice dummy
function makeBarracks(tier, plinth) {
  const g = new THREE.Group(), X = -.65, F = .3;           // hall centre x, front face z
  if (plinth) g.add(box(4.0, 1.8, 4.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  const rack = (weapon, shield) => {                        // a rack along x at the front right; three weapons leaning on the bar
    for (const x of [.85, 1.75]) g.add(box(.07, .85, .07, tier === 1 ? M.rough : M.timber, x, .42, 1.15));
    g.add(box(1.0, .06, .06, tier === 1 ? M.rough : M.timber, 1.3, .8, 1.15));
    for (const [n, x] of [[0, 1.0], [1, 1.3], [2, 1.6]]) {
      if (weapon === 'spear') { const sp = box(.03, 1.5, .03, M.timber, x, .75, 1.26); sp.rotation.x = -.16; g.add(sp); const tip = cone(.035, .15, 4, M.iron, x, 1.55, 1.13); tip.rotation.x = -.16; g.add(tip); }
      else { const sw = box(.03, .62, .06, M.iron, x, .55, 1.24); sw.rotation.x = -.12; g.add(sw); g.add(box(.13, .03, .04, M.iron, x, .87, 1.2)); g.add(box(.035, .12, .035, M.timber, x, .94, 1.19)); }
      if (shield && n !== 1) {
        // leaning against the rack, face out to the front
        const sh = shield === 'round' ? roundShield(.19, M.wood) : heaterShield(.3, .44, kiteM, steelM);
        sh.rotation.set(-.25, Math.PI / 2, 0, 'YXZ'); sh.position.set(x + .05, .3, 1.42); g.add(sh);
      }
    }
  };
  const dummy = shield => {                                 // practice dummy: a post with a straw body, arms bar and sack head
    g.add(box(.08, 1.15, .08, M.rough, 1.3, .57, -.7)); g.add(box(.62, .06, .06, M.rough, 1.3, .9, -.7));
    g.add(cyl(.14, .17, .46, 8, M.hay, 1.3, .78, -.7));
    const hd = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), M.canvas); hd.position.set(1.3, 1.15, -.7); hd.castShadow = true; g.add(hd);
    if (shield) { const sh = cyl(.17, .17, .035, 12, M.wood, 1.3, .8, -.52); sh.rotation.x = Math.PI / 2; g.add(sh); }
  };
  if (tier === 1) {            // muster hut: plank hall with a thatched roof, a spear rack, a straw dummy
    g.add(box(2.3, 1.3, 1.9, M.wood, X, .7, -.65));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.1, 1.35, .1, M.rough, X + sx * 1.13, .68, -.65 + sz * .93));
    g.add(pyramid(1.9, 1.0, .86, M.thatchOld, 1.85, X, -.65));
    g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[1], -1, .08 + DOOR_H / 2, F + .02)); g.add(box(.22, .18, .04, M.glow, -.1, 1.0, F + .02));
    rack('spear'); dummy(false);
  } else if (tier === 2) {     // barracks: daub hall in a timber frame, log roof, spears and round shields, a blue banner
    g.add(box(2.3, 1.4, 1.9, M.daub, X, .85, -.65));
    for (const x of [-1.78, -.55, .48]) g.add(box(.1, 1.42, .1, M.timber, x, .85, F + .01));
    for (const sx of [-1, 1]) g.add(box(.1, 1.42, .1, M.timber, X + sx * 1.13, .85, -1.6));
    g.add(box(2.34, .08, .08, M.timber, X, 1.55, F + .01));
    g.add(pyramid(1.95, 1.05, .86, M.thatch, 2.08, X, -.65));
    g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[2], -1, .2 + DOOR_H / 2, F + .03)); for (const x of [-.25, .2]) g.add(box(.2, .2, .04, M.glow, x, 1.1, F + .03));
    roofFlag(g, X, 2.5, -.65);   // flag on the roof peak
    rack('spear', 'round'); dummy(true);
  } else {                     // garrison: stone hall, blue tiled roof, swords and blue shields, a hanging banner
    g.add(box(2.3, 1.3, 1.9, M.stone2, X, .7, -.65));
    g.add(box(2.42, .12, 2.02, M.stone2, X, 1.38, -.65));
    g.add(pyramid(1.95, 1.15, .86, M.roofBlue, 2.0, X, -.65));
    g.add(box(DOOR_W, DOOR_H, .06, DOOR_M[3], -1, .2 + DOOR_H / 2, F + .02));
    for (const y of [.45, .95]) g.add(box(.56, .04, .07, M.iron, -1, y, F + .04));
    for (const x of [-.4, .2]) g.add(box(.18, .26, .04, M.glow, x, .95, F + .02));
    roofFlag(g, X, 2.45, -.65);
    rack('sword', 'kite'); dummy(true);
  }
  return g;
}
function makeQuarry(tier, plinth) {
  const g = new THREE.Group();
  if (plinth) g.add(box(4.0, 1.8, 4.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  const blocks = list => list.forEach(([x, y, z]) => g.add(box(.5, .45, .5, M.stone2, x, y, z)));
  if (tier === 1) {            // stone pit: masons' shed, cut blocks, timber hoist
    g.add(box(1.3, 1.3, 1.1, M.rough, -1, .75, -.85));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.1, 1.35, .1, M.timber, -1 + sx * .62, .75, -.85 + sz * .52));
    g.add(pyramid(1.1, .95, .9, M.thatchOld, 1.875, -1, -.85));
    g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[1], -1, .08 + DOOR_H / 2, -.28));
    blocks([[.55, .32, .55], [1.1, .32, .55], [.82, .76, .55]]);
    for (let n = 0; n < 5; n++) { const r = new THREE.Mesh(rockGeo, rockMat); r.scale.setScalar(.25 + hash(n, 2) * .15); r.position.set(.4 + hash(n, 5) * 1.1, .15, 1.1 + hash(n, 8) * .4); r.castShadow = true; g.add(r); }
    // A-frame hoist with a block on the rope
    for (const sx of [-1, 1]) { const l = box(.09, 2.0, .09, M.rough, .9 + sx * .3, 1.0, -.9); l.rotation.z = -sx * .17; g.add(l); }
    g.add(box(.8, .08, .08, M.rough, .9, 1.95, -.9));
    g.add(box(.03, .7, .03, M.dark, .9, 1.55, -.9)); g.add(box(.36, .3, .36, M.stone2, .9, 1.1, -.9));
    // low dry-stone wall
    for (let s = -1.6; s <= 1.61; s += .45) g.add(box(.42, .3, .3, M.stone, s, .15, -1.65));
  } else {
    g.add(box(1.8, 1.4, 1.5, M.stone2, -1, .9, -.8));
    g.add(pyramid(1.45, .9, .9, tier === 3 ? M.roofBlue : M.thatch, 2.05, -1, -.8));
    g.add(box(DOOR_W, DOOR_H, .06, DOOR_M[tier], -1, .2 + DOOR_H / 2, -.03)); g.add(box(.28, .24, .06, M.glow, -.35, 1.1, -.03));
    blocks([[.6, .35, .6], [1.15, .35, .6], [.6, .35, 1.15], [1.15, .35, 1.15], [.88, .8, .88]]);
    if (tier === 2) {          // the back yard: a mason's bench with a half-dressed block, a rubble heap, a wheelbarrow
      g.add(box(.9, .07, .5, M.timber, 1.1, .56, -1.1));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.07, .52, .07, M.timber, 1.1 + sx * .38, .26, -1.1 + sz * .18));
      g.add(box(.4, .28, .34, M.stone2, 1.0, .74, -1.1)); g.add(box(.18, .1, .3, M.stone2, 1.32, .64, -1.08));
      const mh = box(.03, .26, .03, M.timber, 1.4, .63, -.98); mh.rotation.z = 1.4; g.add(mh); g.add(box(.09, .09, .14, M.wood, 1.27, .64, -.98));
      for (let n = 0; n < 7; n++) { const r = new THREE.Mesh(rockGeo, rockMat); r.scale.setScalar(.14 + hash(n, 4) * .12); r.position.set(1.5 + (hash(n, 6) - .5) * .5, .08 + (n > 4 ? .14 : 0), -.25 + (hash(n, 9) - .5) * .5); r.castShadow = true; g.add(r); }
      // wheelbarrow: a wooden tub tipped forward onto its wheel, two long handles resting on short legs behind
      const wb = new THREE.Group(); wb.position.set(.5, 0, -1.5); wb.rotation.y = 1.1; g.add(wb);
      const tub = new THREE.Group(); tub.position.set(0, .26, .05); tub.rotation.x = .18; wb.add(tub);
      tub.add(box(.4, .04, .46, M.wood, 0, -.08, 0)); for (const sx of [-1, 1]) tub.add(box(.04, .17, .46, M.wood, sx * .2, 0, 0));
      tub.add(box(.4, .17, .04, M.wood, 0, 0, .23)); tub.add(box(.4, .17, .04, M.wood, 0, 0, -.23));
      for (let n = 0; n < 3; n++) { const r = new THREE.Mesh(rockGeo, rockMat); r.scale.setScalar(.08); r.position.set((n - 1) * .1, .07, (n % 2) * .08 - .04); tub.add(r); }
      const wh = cyl(.12, .12, .045, 12, M.timber, 0, .12, .38); wh.rotation.z = Math.PI / 2; wb.add(wh); const hub = cyl(.03, .03, .1, 6, M.iron, 0, .12, .38); hub.rotation.z = Math.PI / 2; wb.add(hub);
      for (const sx of [-1, 1]) { const h = box(.035, .035, .95, M.timber, sx * .16, .24, -.08); h.rotation.x = -.14; wb.add(h); wb.add(box(.035, .16, .035, M.timber, sx * .16, .08, -.28)); }
    }
    if (tier === 3) {
      // a hoist on the yard's right side, its block hanging over a cart being loaded
      g.add(box(.14, 2.6, .14, M.timber, 1.6, 1.4, -.35)); g.add(box(1.3, .12, .12, M.timber, 1.0, 2.6, -.35));
      g.add(box(.03, .9, .03, M.dark, .5, 2.15, -.35)); g.add(box(.35, .3, .35, M.stone2, .5, 1.55, -.35));
      g.add(box(1.0, .35, .6, M.wood, .75, .55, -.7));
      for (const x of [.35, 1.15]) { const w = cyl(.22, .22, .08, 10, M.timber, x, .25, -.37); w.rotation.x = Math.PI / 2; g.add(w); }
      blocks([[.55, .95, -.75], [.95, .95, -.75]]);
    }
  }
  return g;
}
// blighted crops (Meadowmere's damp blight, the Blighted Isle): brown, wilted, spotted, so the fields show they do badly
const BLIGHT_M = { crop1: mat('#6e6436'), crop2: mat('#7a6a3a'), wheat: mat('#8c7442') };
const blightMap = () => MAP === 'mere' || MAP === 'keep' || (bonusOn() && MAP === 'isle');
function makeFarm(tier) {
  const g = new THREE.Group(), CM = blightMap() ? BLIGHT_M : M;
  g.add(box(3.5, .08, 3.5, M.soil, 0, .06, 0));
  const rows = tier === 1 ? 4 : 7, per = tier === 1 ? 4 : 9;
  for (let r = 0; r < rows; r++) {
    const z = (tier === 1 ? -.4 : -1.45) + r * ((tier === 1 ? 1.85 : 2.9) / (rows - 1));
    if (tier === 3) {        // tall golden wheat: thin stalks with slightly bent heads
      for (let c = 0; c < 12; c++) {
        const x = -1.45 + c * .27 + (hash(r, c) - .5) * .08, h = .5 + hash(c, r * 3) * .14;
        if (x < -.45 && z < -.45) continue;                                          // keep the barn's front clear: the wheat hid its door
        const st = cone(.075, h * (CM === M ? 1 : .8), 4, CM.wheat, x, h / 2 + .08, z + (hash(c + 7, r) - .5) * .06);
        st.rotation.z = (hash(c, r + 9) - .5) * .25; st.rotation.x = (hash(r + 3, c) - .5) * .2; g.add(st);
      }
      continue;
    }
    for (let c = 0; c < per; c++) {
      if (tier === 1 && hash(r, c) < .25) continue;
      if (tier === 2 && c < 4 && r < 3) continue;                                     // the croft's hut stands here
      const x = (tier === 1 ? -1.5 : -1.5) + c * ((tier === 1 ? 3.0 : 3.0) / (per - 1)), h = tier === 1 ? .28 + hash(c, r) * .15 : .4;
      g.add(cone(.13, h * (CM === M ? 1 : .75), 4, tier === 1 ? CM.crop1 : CM.crop2, x, h / 2 + .08, z));
    }
  }
  if (UPK.fences) for (let s = -1.75; s <= 1.76; s += .5) for (const [x, z] of [[s, -1.75], [s, 1.75], [-1.75, s], [1.75, s]]) {
    if (tier === 1 && hash(x * 3, z * 5) < .45) continue;
    const p = box(.07, .5, .07, tier === 1 ? M.rough : M.timber, x, .25, z); if (tier === 1) p.rotation.z = (hash(x, z) - .5) * .4; g.add(p);
  }
  if (UPK.fences && tier > 1) for (const [x, z, w, d] of [[0, -1.75, 3.5, .05], [0, 1.75, 3.5, .05], [-1.75, 0, .05, 3.5], [1.75, 0, .05, 3.5]]) g.add(box(w, .05, d, M.timber, x, .38, z));
  if (tier === 1) { // thatched field hut
    g.add(box(1.1, 1.25, .8, M.mud, -1.0, .7, -1.2)); g.add(pyramid(.95, .85, .8, M.thatchOld, 1.75, -1.0, -1.2)); g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[1], -1.0, .08 + DOOR_H / 2, -.79));
    g.add(cyl(.28, .3, .4, 8, M.hay, .9, .25, -1.2));
  }
  if (tier === 2) { // the croft's hut: daub between corner posts under a shingle roof, a hay bale beside it
    g.add(box(1.1, 1.25, .8, M.daub, -1.0, .7, -1.2));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.08, 1.3, .08, M.timber, -1.0 + sx * .53, .73, -1.2 + sz * .38));
    g.add(pyramid(.95, .8, .8, M.thatch, 1.72, -1.0, -1.2)); g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[2], -1.0, .08 + DOOR_H / 2, -.79));
    g.add(cyl(.26, .28, .38, 8, M.hay, -.15, .25, -1.45));
  }
  if (tier >= 2) { // scarecrow
    g.add(box(.06, 1.2, .06, M.timber, 1.1, .6, -.9)); g.add(box(.7, .05, .05, M.timber, 1.1, .95, -.9));
    g.add(box(.25, .35, .18, M.canvas, 1.1, .85, -.9));
    const hd = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 5), M.hay); hd.position.set(1.1, 1.25, -.9); g.add(hd);
  }
  if (tier === 3) { // barn + hay
    g.add(box(1.1, 1.3, .9, M.plaster, -1.15, .7, -1.15)); g.add(pyramid(.85, .7, .85, M.roofBlue, 1.7, -1.15, -1.15));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.08, 1.32, .08, M.timber, -1.15 + sx * .53, .71, -1.15 + sz * .43));   // brown corner posts
    g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[3], -1.15, .08 + DOOR_H / 2, -.69));
    for (const [sx, sz] of [[1.35, 1.35], [.75, 1.42]]) {     // stooks: sheaves leaned together
      for (let n = 0; n < 4; n++) { const a = n / 4 * Math.PI * 2, sh = cyl(.06, .09, .55, 6, M.hay, sx + Math.cos(a) * .08, .32, sz + Math.sin(a) * .08); sh.rotation.z = Math.cos(a) * .25; sh.rotation.x = -Math.sin(a) * .25; g.add(sh); }
    }
  }
  return g;
}
// walls pick their arms from the neighbour bitmask, like roads
function makeWall(tier, plinth, mask = 0, rot = 0) {
  const g = new THREE.Group();
  if (!mask) mask = rot ? 5 : 10;      // a lone piece is a straight run along its rotation (E–W or N–S)
  const arms = DIRS.filter(d => mask & d[2]).map(d => [d[0], d[1], 1]);
  if (tier === 1) {
    g.add(cyl(.17, .19, 2.6, 6, M.rough, 0, .7, 0));
    for (const [dx, dz, L] of arms) {
      for (const t of L > 1 ? [.36, .7, 1.0, 1.35] : [.36, .7, 1.0]) { const h = 1.7 + hash(t * 7, dx + dz * 3) * .4; g.add(cyl(.15, .17, h + .6, 6, M.rough, dx * t, .9 - .3, dz * t)); }
      g.add(box(dx ? L : .06, .07, dz ? L : .06, M.timber, dx * L / 2, 1.2, dz * L / 2));
    }
    if (!arms.length) for (const a of [0, 2.1, 4.2]) g.add(cyl(.13, .15, 1.6, 6, M.rough, Math.cos(a) * .35, .8, Math.sin(a) * .35));
  } else {
    const m = tier === 2 ? M.stone : M.stone2, ht = tier === 2 ? 1.7 : 2.2;
    g.add(box(.62, ht + .8, .62, m, 0, (ht + .2) / 2 - .3, 0));
    for (const [dx, dz, L] of arms) {
      g.add(box(dx ? L : .42, ht + .6, dz ? L : .42, m, dx * L / 2, ht / 2 - .3, dz * L / 2));
      if (tier === 3) for (const t of L > 1 ? [.42, .85, 1.25] : [.42, .85]) g.add(box(.26, .3, .26, m, dx * t, ht + .15, dz * t));
    }
    if (tier === 3) g.add(box(.74, .22, .74, M.stone, 0, ht + .31, 0));
  }
  return g;
}
function makeGate(tier, plinth, mask = 0, rot = 0, fixed = false) {
  const outer = new THREE.Group(), g = new THREE.Group(); outer.add(g);
  // the opening follows walls on one axis, otherwise the player's rotation; a gate rotated by hand keeps it
  const ns = (mask & 5) && !(mask & 10), ew = (mask & 10) && !(mask & 5);
  if (fixed ? rot : ns ? 1 : ew ? 0 : rot) g.rotation.y = Math.PI / 2;
  if (tier === 1) {
    for (const sx of [-1, 1]) { g.add(cyl(.2, .22, 2.5, 6, M.rough, sx * .8, 1.25, 0)); g.add(leaf(.6, 1.6, .07, DOOR_M[1], sx * .6, .85, 0, -sx, sx * 1.5)); }
    const lt = cyl(.12, .12, 2.0, 6, M.rough, 0, 2.35, 0); lt.rotation.z = Math.PI / 2; g.add(lt);
  } else if (tier === 2) {
    for (const sx of [-1, 1]) { g.add(box(.45, 2.5, .7, M.stone, sx * .78, 1.25, 0)); g.add(leaf(.55, 1.5, .06, DOOR_M[2], sx * .555, .78, 0, -sx, sx * 1.5)); }
    g.add(box(2.0, .55, .7, M.stone, 0, 2.6, 0));
    for (const s of [-.7, 0, .7]) g.add(box(.3, .3, .7, M.stone, s, 3.0, 0));
    g.add(box(1.1, .35, .06, M.iron, 0, 2.1, 0));
  } else {
    for (const sx of [-1, 1]) { g.add(cyl(.42, .48, 3.2, 8, M.stone2, sx * .8, 1.6, 0)); g.add(coneRoof(.58, .9, 8, M.roofBlue, sx * .8, 3.65, 0)); g.add(leaf(.37, 1.7, .07, DOOR_M[3], sx * .37, .9, 0, -sx, sx * 1.5)); }
    g.add(box(1.2, .7, .65, M.stone2, 0, 2.55, 0));
    g.add(drapeBox(.4, .7, .04, M.drape, 0, 1.95, .34)); g.add(box(1.0, .3, .06, M.iron, 0, 2.05, 0));
  }
  return outer;
}
const ropeM = mat('#b39a6c');
// well: rubble ring with a coping, a windlass (axle, wound rope, crank) on two posts, the bucket hanging on its line, a small gable roof
function makeWell() {
  const g = new THREE.Group();
  g.add(cyl(.78, .82, .06, 14, M.stone, 0, .03, 0));
  g.add(cyl(.5, .55, .6, 10, M.stone2, 0, .3, 0));
  const cap = new THREE.Mesh(new THREE.TorusGeometry(.47, .07, 6, 14), M.stone); cap.rotation.x = Math.PI / 2; cap.position.y = .62; cap.castShadow = true; g.add(cap);
  g.add(cyl(.42, .42, .04, 14, M.water, 0, .61, 0));   // the ring is solid: the water sits just inside the coping
  for (const sx of [-1, 1]) g.add(box(.09, 1.75, .09, M.timber, sx * .6, .875, 0));
  g.add(box(1.32, .08, .08, M.timber, 0, 1.75, 0));
  const ax = cyl(.045, .045, 1.24, 8, M.timber, 0, 1.25, 0); ax.rotation.z = Math.PI / 2; g.add(ax);
  const coil = cyl(.08, .08, .24, 10, ropeM, 0, 1.25, 0); coil.rotation.z = Math.PI / 2; g.add(coil);
  g.add(box(.035, .24, .035, M.iron, .67, 1.15, 0)); g.add(box(.035, .035, .16, M.timber, .69, 1.04, .07));   // crank
  g.add(box(.014, .26, .014, ropeM, 0, 1.06, .075));                                                            // the line
  g.add(cyl(.1, .08, .16, 10, M.wood, 0, .79, .075)); g.add(cyl(.103, .103, .02, 10, M.iron, 0, .84, .075));
  const hd = new THREE.Mesh(new THREE.TorusGeometry(.09, .008, 4, 10, Math.PI), M.iron); hd.position.set(0, .87, .075); g.add(hd);
  const sl = .66, L = .7;
  for (const sz of [-1, 1]) { const r = box(1.5, .06, L, M.roofBlue, 0, 1.97, sz * .26); r.rotation.x = sz * sl; g.add(r); }
  g.add(box(1.5, .07, .07, M.timber, 0, 2.18, 0));
  g.add(cyl(.09, .075, .14, 10, M.wood, .58, .13, .5));                                                        // a spare bucket on the apron
  return g;
}
function makeTorch() {   // one third of a tile: a small flagstone base with an iron brazier on a post
  const g = new THREE.Group();
  g.add(box(.66, .07, .66, M.stone, 0, .04, 0));
  g.add(box(.3, .22, .3, M.stone2, 0, .18, 0)); g.add(box(.1, 1.7, .1, M.timber, 0, 1.05, 0));
  g.add(cyl(.13, .07, .18, 6, M.iron, 0, 1.95, 0));
  // the fire: a big tongue, two small ones and a bright core, all flickering (flameShader)
  for (const [m, x, z, h, r] of [[M.flame, 0, 0, .46, .12], [M.flame, .07, .05, .3, .07], [M.flame, -.07, -.04, .33, .07], [M.flame, -.03, .07, .26, .06],
    [M.flameMid, 0, 0, .34, .085], [M.flameCore, 0, 0, .2, .05]]) {
    const f = new THREE.Mesh(FLAME_GEO, m); f.scale.set(r, h, r); f.position.set(x, 2.03 + h / 2, z); f.renderOrder = m === M.flame ? 1 : m === M.flameMid ? 2 : 3; f.userData.noShadow = true; g.add(f);
  }
  return g;
}
function makeFlowers() {
  const g = new THREE.Group();
  g.add(box(1.5, .14, 1.5, M.soil, 0, .08, 0));
  for (let s = -.72; s <= .73; s += .36) for (const [x, z] of [[s, -.78], [s, .78], [-.78, s], [.78, s]]) g.add(box(.32, .12, .1, M.stone, x, .1, z).rotateY(Math.abs(x) > .7 ? Math.PI / 2 : 0));
  for (let n = 0; n < 18; n++) {
    const x = (hash(n, 1) - .5) * 1.2, z = (hash(n, 2) - .5) * 1.2;
    g.add(cone(.07, .25, 4, M.leaf, x, .27, z));
    const f = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 4), FLOWER[n % FLOWER.length]); f.position.set(x, .42, z); g.add(f);
  }
  return g;
}
function makeStatue() {
  const g = new THREE.Group();
  g.add(box(1.0, .25, 1.0, M.stone, 0, .12, 0)); g.add(box(.75, .7, .75, M.stone2, 0, .6, 0));
  g.add(cyl(.18, .26, .9, 8, M.stone2, 0, 1.4, 0));
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 6), M.stone2); hd.position.set(0, 2.0, 0); g.add(hd);
  const arm = box(.1, .55, .1, M.stone2, .22, 1.95, 0); arm.rotation.z = -.4; g.add(arm);
  g.add(box(.05, .8, .05, M.stone2, .38, 2.5, 0));
  // the other arm (Jack): down at its side, its hand on a sword's hilt, the blade point-down on the plinth
  const arm2 = box(.1, .5, .1, M.stone2, -.25, 1.62, .06); arm2.rotation.z = -.22; g.add(arm2);
  // the hand ends at (-.31, 1.38): the grip under it, then the crossguard, the blade down to the plinth's top (.95)
  g.add(box(.04, .1, .04, M.stone2, -.31, 1.36, .08)); g.add(box(.16, .03, .05, M.stone2, -.31, 1.3, .08)); g.add(box(.05, .34, .025, M.stone2, -.31, 1.12, .08));
  return g;
}
// a timber footbridge over the river: planks across a gentle arch, two log stringers, trestles standing in the water,
// log railings, grey stone landings at both ends. Built along local z, then turned onto its axis.
function makeBridge(b) {
  if (b.stone) return makeStoneBridge(b);
  const g = new THREE.Group(), L = b.L, W = b.w || DECK_W, k = W / DECK_W;   // a wider deck spreads its stringers and trestles
  const yAt = z => deckY(b, (z + L / 2) / L), wx = z => b.mx + b.dx * z, wz = z => b.mz + b.dz * z;
  for (const s of [-1, 1]) {                      // stone landings set into each bank
    const z = s * (L / 2 - .5), y = yAt(z);
    g.add(box(W + .6, 1.6, 1.1, M.plainStone, 0, y - .85, z));
    for (const x of [-1, 1]) g.add(box(.34, .45, .34, M.plainStone, x * (W / 2 + .15), y + .2, s * (L / 2 - .25)));
  }
  const n = Math.round(L / .27);
  for (let i = 0; i < n; i++) {
    const z = -L / 2 + (i + .5) * L / n, dy = (yAt(z + .01) - yAt(z)) / .01;
    const p = box(W + (i % 3 === 1 ? .12 : 0), .07, L / n - .025, M.wood, ((i * 37) % 5 - 2) * .015, yAt(z), z);
    p.rotation.x = -Math.atan(dy); g.add(p);
  }
  const seg = (x, z0, z1, dy, r, m) => {        // a log from z0 to z1 following the deck, dy below/above it
    const y0 = yAt(z0) + dy, y1 = yAt(z1) + dy, c = cyl(r, r, Math.hypot(z1 - z0, y1 - y0) + .04, 7, m, x, (y0 + y1) / 2, (z0 + z1) / 2);
    c.rotation.x = Math.PI / 2 - Math.atan2(y1 - y0, z1 - z0); g.add(c);
  };
  const S = Math.max(4, Math.round(L / 1.2));
  for (const x of [-.6 * k, .6 * k]) for (let i = 0; i < S; i++) seg(x, -L / 2 + i * L / S, -L / 2 + (i + 1) * L / S, -.12, .11, M.log);
  // trestles wherever the deck crosses water, every ~2.4 m
  for (let z = -L / 2 + 1.6; z < L / 2 - 1.5; z += 2.4) {
    const gy = hAt(wx(z), wz(z)); if (gy > yAt(z) - 1) continue;
    const top = yAt(z) - .2, bot = gy - .3;
    for (const x of [-.75 * k, .75 * k]) g.add(cyl(.12, .14, top - bot, 8, M.log, x, (top + bot) / 2, z));
    g.add(box(W + .3, .16, .26, M.log, 0, top, z));
    for (const r of [.85, -.85]) { const br = box(.08, Math.min(1.9, (top - bot) * .9), .08, M.log, 0, top - .8, z); br.rotation.z = r; g.add(br); }
  }
  for (const x of [-W / 2 + .05, W / 2 - .05]) {
    const k = Math.max(4, Math.round((L - .6) / 1.1)), zs = []; for (let i = 0; i <= k; i++) zs.push(-L / 2 + .3 + i * (L - .6) / k);
    for (const z of zs) g.add(cyl(.05, .06, .78, 6, M.log, x, yAt(z) + .4, z));
    for (let i = 0; i < k; i++) { seg(x, zs[i], zs[i + 1], .78, .045, M.log); seg(x, zs[i], zs[i + 1], .4, .035, M.log); }
  }
  g.position.set(b.mx, 0, b.mz); g.rotation.y = Math.atan2(b.dx, b.dz);   // local z onto the bridge's direction
  return g;
}
// an old stone bridge (Stonebridge): a paved deck on a solid stone span, low parapets along both sides, round piers standing in the
// water with cutwaters, stone landings on each bank; the same deck line (deckY) the units walk on
function makeStoneBridge(b) {
  const g = new THREE.Group(), L = b.L, W = b.w || DECK_W;
  const yAt = z => deckY(b, (z + L / 2) / L), wx = z => b.mx + b.dx * z, wz = z => b.mz + b.dz * z;
  const piece = (z0, z1, w, h, dy, m, x = 0) => {      // a block following the deck from z0 to z1, its top dy above the deck
    const y0 = yAt(z0), y1 = yAt(z1), len = Math.hypot(z1 - z0, y1 - y0) + .02, o = box(w, h, len, m, x, (y0 + y1) / 2 + dy - h / 2, (z0 + z1) / 2);
    o.rotation.x = -Math.atan2(y1 - y0, z1 - z0); g.add(o); return o;
  };
  const n = Math.max(6, Math.round(L / .6));
  for (let i = 0; i < n; i++) {
    const z0 = -L / 2 + i * L / n, z1 = z0 + L / n;
    piece(z0, z1, W + .5, .55, -.015, M.stone2);                                    // the span
    piece(z0 + .02, z1 - .02, W - .1, .05, .03, i % 2 ? M.plainStone : M.stone2);   // paving, the slabs a shade apart
    for (const sx of [-1, 1]) piece(z0, z1, .22, .42, .42, M.stone2, sx * (W / 2 + .1));   // parapets
  }
  for (const s of [-1, 1]) {                       // landings set into each bank, a post at each end of the parapets
    const z = s * (L / 2 - .5), y = yAt(z);
    g.add(box(W + .8, 1.6, 1.1, M.plainStone, 0, y - .85, z));
    for (const x of [-1, 1]) g.add(box(.36, .6, .36, M.stone2, x * (W / 2 + .1), y + .3, s * (L / 2 - .15)));
  }
  for (let z = -L / 2 + 1.8; z < L / 2 - 1.7; z += 2.6) {   // piers where it stands in the water, a pointed cutwater upstream
    const gy = hAt(wx(z), wz(z)); if (gy > yAt(z) - 1.2) continue;
    const top = yAt(z) - .5, bot = gy - .4, ph = top - bot;
    g.add(box(W + .3, ph, .7, M.stone2, 0, bot + ph / 2, z));
    const cw = cyl(.5, .5, ph, 4, M.stone2, 0, bot + ph / 2, z); cw.scale.set(1.25, 1, .5); cw.rotation.y = Math.PI / 4; cw.position.x = (W / 2 + .2); g.add(cw);
  }
  if (b.grand) {                                   // the Warlord's bridge: tall towers at both ends with red flags, merlons on the parapets
    for (const s of [-1, 1]) for (const x of [-1, 1]) {
      const z = s * (L / 2 - .6), y = yAt(z), tw = box(1.1, 3.2, 1.1, M.stone2, x * (W / 2 + .5), y + 1.4, z); g.add(tw);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(.85, 1.1, 4), M.plainStone); cap.position.set(x * (W / 2 + .5), y + 3.55, z); cap.rotation.y = Math.PI / 4; g.add(cap);
      g.add(cyl(.035, .035, 1.2, 5, M.timber, x * (W / 2 + .5), y + 4.6, z)); g.add(flagBox(.55, .34, .03, raiderFlagM(), x * (W / 2 + .5) + .28, y + 4.95, z));
    }
    for (let z = -L / 2 + 1.4; z < L / 2 - 1.3; z += .9) for (const x of [-1, 1]) g.add(box(.26, .2, .34, M.stone2, x * (W / 2 + .1), yAt(z) + .74, z));
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  g.position.set(b.mx, 0, b.mz); g.rotation.y = Math.atan2(b.dx, b.dz);
  return g;
}
// the raiders' red flag, waving like the town's (M.flag's shader); the grand bridge's flags fly the same way as the hold's
let _rfm = null; const raiderFlagM = () => { if (!_rfm) { _rfm = M.flag.clone(); _rfm.onBeforeCompile = M.flag.onBeforeCompile; teamMat(_rfm, 'foe', '#8e1d16'); } return _rfm; };
function buildBridges() { for (const b of bridges) { b.g = makeBridge(b); scene.add(b.g); } }

// ---------- the other economy picks: forester, mine, farmhouse ----------
const mineRockM = mat('#79746b'), penM = mat('#7c6b4a'), henM = mat('#efe8da'), combM = mat('#c23a2a'), beakM = mat('#e2a43a'),
  pigM = mat('#e2a596'), snoutM = mat('#c98274'), cowM = mat('#ebe5d8'), patchM = mat('#2b2622'), hornM = mat('#d9cfb8'),
  groveTrunkM = mat('#5a3e26'), groveLeafM = mat('#3f6a2c'), groveLeaf2M = mat('#4f7d34');
addGrit(mineRockM, 'rock');
// a fence round a 2x2 plot (open at the front left, where the plot's door tile is); rough leaning stakes at tier 1, posts and rails after
function plotFence(g, tier, hd = 1.75, hw = 1.75, gx = -1) {     // hd, hw: half the plot's depth and width; gx: the middle of the gap in front
  const gap = (x, z) => z > hd - .05 && x > gx - .5 && x < gx + .5, posts = [];
  for (let s = -hw; s <= hw + .01; s += .5) posts.push([s, -hd], [s, hd]);
  for (let s = -hd; s <= hd + .01; s += .5) posts.push([-hw, s], [hw, s]);
  for (const [x, z] of posts) {
    if (gap(x, z) || (tier === 1 && hash(x * 3, z * 5) < .3)) continue;
    const p = box(.07, .55, .07, tier === 1 ? M.rough : M.timber, x, .27, z); if (tier === 1) p.rotation.z = (hash(x, z) - .5) * .35; g.add(p);
  }
  const lw = gx - .5 + hw, rw = hw - gx - .5;
  if (tier > 1) for (const [x, z, w, d] of [[0, -hd, hw * 2, .05], [-hw, 0, .05, hd * 2], [hw, 0, .05, hd * 2], [hw - rw / 2, hd, rw, .05], [-hw + lw / 2, hd, lw, .05]])
    for (const y of [.25, .45]) g.add(box(w, .05, d, M.timber, x, y, z));
}
// a small hut at the plot's back left with its door to the front (the door everyone uses): tier 1 daub or logs under old thatch,
// tier 2 a log roof, tier 3 plastered with the blue roof
function plotHut(g, tier, wallM, w = 1.2, d = .9, z = -1.15, x = -1.05) {
  const h = 1.28;
  g.add(box(w, h, d, tier === 3 ? M.plaster : wallM, x, h / 2 + .06, z));
  if (tier >= 2) for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.08, h + .02, .08, M.timber, x + sx * (w / 2 - .02), h / 2 + .06, z + sz * (d / 2 - .02)));   // brown corner posts
  g.add(pyramid(w * .78, .8, d / w * 1.05, tier === 1 ? M.thatchOld : tier === 2 ? M.thatch : M.roofBlue, h + .06 + .4, x, z));
  g.add(box(DOOR_W, DOOR_H, .05, DOOR_M[tier], x, .08 + DOOR_H / 2, z + d / 2 + .02));
  g.add(box(.2, .18, .04, M.glow, x + .38, .85, z + d / 2 + .02));
}
// forester: a fenced plot of young trees planted in rows (the trees are drawn by updateEco so they grow and get felled), the
// forester's hut at the back left; tier 1 a sapling bundle and a chopping block, tier 2 a stack of cut poles, tier 3 a log pile
// and a sawhorse on the far side
// the plot is 3 x 3 tiles (6 m square; it was 2 x 3 until Jack wanted bigger trees and room for ten): the hut at the back
// left, the gate in the middle of the front; GROVE_AT is where each tree stands, in the order they are planted (5/7/8 by tier,
// 10 with the Big grove upgrade)
const FOREST_HD = 2.75, GROVE_K = 1.85;
const GROVE_AT = [[.6, -1.95], [1.95, -.95], [-.45, -.6], [-.75, 1.1], [1.75, 2.15], [.95, .05], [-1.95, 1.95], [2.1, 1.05], [-1.95, .2], [.55, 1.75]];   // spread over the plot whatever the count
function makeGroveTree() {
  const t = new THREE.Group();
  t.add(cyl(.035, .06, .6, 5, groveTrunkM, 0, .3, 0));
  t.add(cone(.3, .7, 6, groveLeafM, 0, .82, 0)); t.add(cone(.22, .5, 6, groveLeaf2M, 0, 1.12, 0));
  return t;
}
function makeForester(tier) {
  const g = new THREE.Group();
  g.add(box(FOREST_HD * 2 - .2, .07, FOREST_HD * 2, M.soil, 0, .045, 0));
  GROVE_AT.forEach(([x, z]) => g.add(cyl(.3, .34, .03, 8, M.court, x, .09, z)));   // hoed rings where the trees stand
  plotFence(g, tier, FOREST_HD, FOREST_HD, 0); plotHut(g, tier, tier === 2 ? M.plaster : M.log, 1.15, .85, -2.15, -1.6);   // the coppice: cream walls, brown posts
  if (tier === 1) {
    g.add(cyl(.2, .22, .3, 8, M.log, -.55, .2, -2.45)); g.add(box(.03, .14, .18, M.iron, -.55, .44, -2.45));     // chopping block with the axe in it
    for (let n = 0; n < 5; n++) { const s = box(.03, .7, .03, M.rough, 2.25 + n * .04, .4, -2.2 + n * .05); s.rotation.z = .25; g.add(s); }   // bundled saplings
  } else {
    for (let r = 0; r < 3; r++) for (let n = 0; n < 4 - r; n++) { const l = cyl(.07, .07, 1.0, 6, M.log, 2.15, .14 + r * .12, -2.45 + n * .15 + r * .075); l.rotation.x = Math.PI / 2; g.add(l); }
  }
  if (tier === 3) {
    for (const sx of [-1, 1]) { const l = box(.05, .45, .05, M.timber, -.35 + sx * .2, .25, -2.4); l.rotation.z = sx * .35; g.add(l); }
    g.add(box(.6, .05, .06, M.timber, -.35, .45, -2.4)); const lg = cyl(.08, .08, .7, 6, M.log, -.35, .55, -2.4); lg.rotation.z = Math.PI / 2; g.add(lg);
  }
  return g;
}
// mine: a shaft driven into a rocky mound; rails run out of the adit to a spoil heap and the cart rolls out with every load
// (updateEco). Tier 1 a timber-framed adit and a windlass; tier 2 a headframe with its wheel; tier 3 a stone portal, a taller
// headframe and a winding house with the blue roof
function makeMine(tier, plinth) {
  const g = new THREE.Group(), b = plinth ? .2 : SLAB_TOP;
  if (plinth) g.add(box(4.0, 1.8, 4.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  const rock = (sx, sy, sz, x, y, z, r) => { const o = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), mineRockM); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.y = r; o.castShadow = o.receiveShadow = true; g.add(o); };
  rock(1.75, 1.05 + tier * .15, 1.15, .15, b + .2, -.85, .3); rock(.8, .7, .7, 1.35, b + .1, -.1, 1.1); rock(.55, .45, .5, -1.5, b + .05, -.3, .6);
  const ax = -.55, fz = .32;
  g.add(box(.64, .98, .5, M.dark, ax, b + .49, fz - .1));                                    // the dark mouth of the adit
  if (tier < 3) {
    for (const sx of [-1, 1]) g.add(box(.1, 1.08, .12, M.timber, ax + sx * .37, b + .54, fz + .1));
    g.add(box(.92, .13, .16, M.timber, ax, b + 1.1, fz + .1));
  } else {
    for (const sx of [-1, 1]) g.add(box(.2, 1.15, .22, M.stone2, ax + sx * .42, b + .58, fz + .1));
    g.add(box(1.08, .22, .24, M.stone2, ax, b + 1.22, fz + .1)); g.add(pyramid(.7, .35, .5, M.roofBlue, b + 1.5, ax, fz + .1));
  }
  // Lanterns (+1 miner): two iron lanterns hang either side of the adit's mouth, lit day and night (Jack); none without it
  if (UPK.lanterns) for (const sx of [-1, 1]) {
    const lx = ax + sx * (tier < 3 ? .37 : .42), lz = fz + .3, ly = b + (tier < 3 ? .86 : .9);
    g.add(box(.012, .14, .012, M.iron, lx, ly + .2, lz)); g.add(box(.02, .02, .2, M.iron, lx, ly + .27, lz - .1));
    g.add(cone(.07, .07, 4, M.iron, lx, ly + .13, lz)); g.add(box(.1, .02, .1, M.iron, lx, ly - .06, lz));
    g.add(box(.075, .1, .075, M.glow, lx, ly + .03, lz));
    for (const [x, z] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) g.add(box(.012, .12, .012, M.iron, lx + x * .045, ly + .03, lz + z * .045));
  }
  for (const sx of [-1, 1]) g.add(box(.035, .035, 1.55, M.iron, ax + sx * .17, b + .04, 1.15));
  for (let zz = .5; zz < 1.9; zz += .28) g.add(box(.48, .03, .08, M.timber, ax, b + .02, zz));
  const cart = new THREE.Group(); cart.position.set(ax, b, .75); cart.userData.cart = true; g.add(cart);
  cart.add(box(.36, .22, .48, M.wood, 0, .22, 0)); cart.add(box(.38, .04, .5, M.iron, 0, .34, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = cyl(.07, .07, .04, 8, M.dark, sx * .19, .07, sz * .15); w.rotation.z = Math.PI / 2; cart.add(w); }
  for (const [x, z] of [[-.07, -.08], [.08, .06], [0, .12]]) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(.08, 0), M.stone2); st.position.set(x, .36, z); cart.add(st); }
  g.add(cone(.6, .5, 7, M.stone2, 1.1, b + .25, 1.25));                                       // the spoil heap
  for (const [x, z, r] of [[.7, 1.6, .09], [1.5, 1.6, .11], [1.6, .85, .08]]) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), M.stone2); st.position.set(x, b + r * .7, z); st.castShadow = true; g.add(st); }
  if (tier === 1) {                                                                          // windlass over a shaft beside the adit
    for (const sx of [-1, 1]) g.add(box(.08, .75, .08, M.rough, .55 + sx * .32, b + .38, .55));
    const a = cyl(.05, .05, .7, 6, M.rough, .55, b + .72, .55); a.rotation.z = Math.PI / 2; g.add(a);
    g.add(box(.5, .06, .5, M.dark, .55, b + .02, .55));
  } else {                                                                                   // headframe: two raking legs and a wheel
    const H = tier === 2 ? 2.4 : 2.9, hx = .95, hz = -.05;
    for (const sx of [-1, 1]) { const l = box(.1, H, .1, M.timber, hx + sx * .3, b + H / 2, hz); l.rotation.z = -sx * .12; g.add(l); }
    const back = box(.09, H * 1.05, .09, M.timber, hx, b + H / 2, hz - .45); back.rotation.x = .25; g.add(back);
    g.add(box(.7, .08, .12, M.timber, hx, b + H - .1, hz));
    const wh = new THREE.Mesh(new THREE.TorusGeometry(.3, .04, 6, 14), M.iron); wh.position.set(hx, b + H + .1, hz); wh.castShadow = true; g.add(wh);
    g.add(box(.012, H - .3, .012, ropeM, hx + .3, b + (H + .2) / 2, hz));
  }
  if (tier === 3) {                                                                          // winding house with the blue roof, ore bins
    g.add(box(1.0, .85, .75, M.stone2, 1.35, b + .43, .55)); g.add(pyramid(.78, .5, .78, M.roofBlue, b + 1.1, 1.35, .55));
    for (const x of [-1.55, -1.15]) { g.add(box(.36, .32, .36, M.wood, x, b + .16, 1.45)); const o = new THREE.Mesh(new THREE.DodecahedronGeometry(.12, 0), M.stone2); o.position.set(x, b + .36, 1.45); g.add(o); }
  }
  return g;
}
// farmhouse: a fenced yard with the farmhouse at the back left; hens and their coop from tier 1, a pigsty from tier 2, a hay rack
// and water trough for cows at tier 3 (the animals themselves are drawn by updateEco and wander the yard)
// a leg hung from its hip so it can swing: a pivot at the top, the leg (and hoof) below
function animalLeg(a, w, h, m, x, top, z, hoof) {
  const p = new THREE.Group(); p.position.set(x, top, z); a.add(p); p.add(box(w, h, w, m, 0, -h / 2, 0));
  if (hoof) p.add(box(w * 1.1, .04, w * 1.1, hoof, 0, -h + .02, 0));
  (a.userData.legs = a.userData.legs || []).push(p); return p;
}
function makeAnimal(kind) {
  const a = new THREE.Group();
  if (kind === 'hen') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.085, 7, 5), henM); b.scale.set(1, .85, 1.3); b.position.y = .13; a.add(b);
    a.add(box(.03, .07, .05, henM, 0, .2, -.1));
    const h = new THREE.Mesh(new THREE.SphereGeometry(.045, 6, 4), henM); h.position.set(0, .22, .09); a.add(h);
    a.add(box(.012, .035, .045, combM, 0, .27, .09)); a.add(box(.02, .02, .03, beakM, 0, .22, .14));
    for (const sx of [-1, 1]) animalLeg(a, .012, .07, beakM, sx * .03, .07, 0);
  } else if (kind === 'pig') {
    a.add(box(.26, .22, .44, pigM, 0, .22, 0)); a.add(box(.2, .18, .16, pigM, 0, .24, .28)); a.add(box(.1, .07, .04, snoutM, 0, .21, .37));
    for (const sx of [-1, 1]) { a.add(box(.05, .05, .02, snoutM, sx * .07, .35, .26)); for (const sz of [-1, 1]) animalLeg(a, .06, .12, pigM, sx * .08, .12, sz * .14); }
  } else {
    a.add(box(.36, .32, .7, cowM, 0, .5, 0)); a.add(box(.37, .2, .22, patchM, 0, .55, -.12)); a.add(box(.2, .15, .02, patchM, .1, .5, .351));
    a.add(box(.22, .24, .26, cowM, 0, .6, .45)); a.add(box(.16, .1, .06, snoutM, 0, .52, .59));
    for (const sx of [-1, 1]) { a.add(cone(.025, .1, 5, hornM, sx * .09, .76, .45)); for (const sz of [-1, 1]) animalLeg(a, .08, .34, cowM, sx * .12, .34, sz * .25, hornM); }
  }
  a.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return a;
}
const HERD = { 1: ['hen', 'hen', 'hen', 'hen'], 2: ['hen', 'hen', 'hen', 'pig', 'pig'], 3: ['hen', 'hen', 'pig', 'pig', 'cow'] };
const ANIMAL_SPEED = { hen: .5, pig: .3, cow: .22 }, STEP_RATE = { hen: 16, pig: 11, cow: 7 };
function makeFarmhouse(tier) {
  const g = new THREE.Group();
  g.add(box(3.5, .06, 3.5, penM, 0, .04, 0));
  plotFence(g, tier); plotHut(g, tier, tier === 1 ? M.mud : M.daub, 1.3, 1.0);
  // hen coop on short legs with a ramp, and a feed trough
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.05, .3, .05, M.timber, 1.15 + sx * .26, .15, -1.3 + sz * .22));
  g.add(box(.62, .38, .5, M.wood, 1.15, .48, -1.3)); g.add(pyramid(.46, .3, 1, tier === 3 ? M.roofBlue : M.thatchOld, .82, 1.15, -1.3));
  const ramp = box(.16, .03, .45, M.rough, 1.05, .18, -.9); ramp.rotation.x = .5; g.add(ramp);
  g.add(box(.7, .12, .18, M.wood, .05, .1, -.85));
  if (tier >= 2) {                                                                            // pigsty: low plank walls, a lean-to roof, a wallow
    g.add(box(.82, .02, .72, M.soil, 1.25, .08, -.25));
    for (const [x, z, w, d] of [[1.25, -.6, .82, .05], [1.65, -.25, .05, .72], [1.25, .1, .82, .05]]) g.add(box(w, .3, d, M.wood, x, .2, z));
    const r = box(.86, .04, .4, tier === 3 ? M.roofBlue : M.thatch, 1.28, .55, -.45); r.rotation.x = .35; g.add(r);
    for (const x of [.9, 1.62]) g.add(box(.05, .5, .05, M.timber, x, .3, -.28));
  }
  if (tier === 3) {                                                                           // hay rack and water trough for the cows
    g.add(box(.14, .55, 1.0, M.timber, -1.35, .32, .75)); g.add(box(.3, .3, .9, M.hay, -1.3, .55, .75));
    g.add(box(.25, .14, .8, M.stone2, -1.05, .1, 1.35));
  }
  return g;
}

// ---------- the other defence picks: crossbow tower, ballista, catapult ----------
// crossbow tower: squat and solid next to the archers' tall lookout, an open fighting top behind a parapet for two crossbowmen:
// tier 1 a log blockhouse with a plank parapet, tier 2 stone below a timber hoarding under a log canopy, tier 3 stone with
// battlements and the blue roof on corner piers
const XBOW_K = .74, XBOW_TOP = [2.45, 2.8, 3.15].map(y => y * XBOW_K);   // fighting-top heights as drawn
// the town's blue flag on a short pole from the roof's peak, flying from the pole's top
function xbowFlag(t, peak) { roofFlag(t, 0, peak - .1, 0, XBOW_K); }
function makeCrossbowTower(tier, plinth) {
  const g = new THREE.Group(), top = XBOW_TOP[tier - 1] / XBOW_K, HEAD = 1.55;
  if (plinth) g.add(box(2.0, 1.8, 2.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  const t = new THREE.Group(); t.scale.setScalar(XBOW_K); g.add(t);   // drawn at XBOW_K: squat beside the archers' lookout, not bigger than it
  if (tier === 1) {
    t.add(box(1.5, top - .12, 1.5, M.log, 0, (top - .12) / 2 + .06, 0));
    // Jack: it read as a plain dark box: log courses (dark gaps between them), lighter corner posts, arrow slits on the
    // front and sides, and a straw roof on four posts over the fighting top, as the lookout has
    for (let y = .42; y < top - .3; y += .36) t.add(box(1.53, .035, 1.53, M.dark, 0, y, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.add(box(.16, top - .1, .16, M.rough, sx * .74, (top - .1) / 2 + .05, sz * .74));
    for (const sx of [-1, 1]) { t.add(box(.06, .3, .02, M.dark, sx * .35, 1.2, .775)); for (const sd of [-1, 1]) t.add(box(.02, .3, .06, M.dark, sd * .775, 1.2, sx * .3)); }
    t.add(box(1.8, .12, 1.8, M.rough, 0, top - .06, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.add(box(.08, HEAD, .08, M.rough, sx * .82, top + HEAD / 2, sz * .82));
    t.add(pyramid(1.42, .62, 1, M.thatchOld, top + HEAD + .31));
    for (const [x, z, w, d] of [[0, .87, 1.8, .06], [0, -.87, 1.8, .06], [.87, 0, .06, 1.8], [-.87, 0, .06, 1.8]]) t.add(box(w, .5, d, M.rough, x, top + .25, z));
    // a ladder up the back: two rails clear of the deck's edge, rising past the parapet, rungs between them
    const LZ = -.97, LH = top + .45;
    for (const x of [-.25, .25]) t.add(box(.05, LH, .05, M.rough, x, LH / 2, LZ));
    for (let y = .25; y < top + .3; y += .3) t.add(box(.5, .04, .04, M.rough, 0, y, LZ));
  } else if (tier === 2) {
    t.add(box(1.55, top - 1.0, 1.55, M.plainStone, 0, (top - 1.0) / 2 + .2, 0));
    for (const x of [-.25, .25]) t.add(box(.06, top + .45, .06, M.timber, x, (top + .45) / 2, -1.0));   // the ladder up the back, past the hoarding
    for (let y = .3; y < top; y += .3) t.add(box(.5, .05, .05, M.timber, 0, y, -1.0));
    t.add(box(1.75, .85, 1.75, M.wood, 0, top - .55, 0));
    for (const sx of [-1, 1]) t.add(box(.05, .26, .02, M.dark, sx * .36, top - .55, .88));
    t.add(box(1.85, .1, 1.85, M.timber, 0, top - .07, 0));
    for (const [x, z, w, d] of [[0, .9, 1.85, .06], [0, -.9, 1.85, .06], [.9, 0, .06, 1.85], [-.9, 0, .06, 1.85]]) t.add(box(w, .5, d, M.timber, x, top + .25, z));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.add(box(.08, HEAD, .08, M.timber, sx * .85, top + HEAD / 2, sz * .85));
    t.add(pyramid(1.45, .7, 1, M.thatch, top + HEAD + .35));
    xbowFlag(t, top + HEAD + .7);
  } else {
    t.add(box(1.6, top, 1.6, M.stone, 0, top / 2 + .2, 0));
    // the door at the back, set into the wall in a stone frame (jambs and a lintel standing proud of it), as on the stone archer tower
    { const K = XBOW_K, dw = DOOR_W / K, dh = DOOR_H / K, y0 = .2 / K;
      t.add(box(dw + .06, dh + .04, .04, M.dark, 0, y0 + dh / 2, -.81)); t.add(box(dw, dh, .06, DOOR_M[3], 0, y0 + dh / 2, -.83));
      for (const sx of [-1, 1]) t.add(box(.13, dh + .12, .14, M.stone2, sx * (dw / 2 + .065), y0 + (dh + .12) / 2, -.86));
      t.add(box(dw + .39, .16, .16, M.stone2, 0, y0 + dh + .16, -.86)); }
    for (const sx of [-1, 1]) t.add(box(.06, .3, .03, M.dark, sx * .38, top * .6, .81));
    t.add(box(1.85, .14, 1.85, M.stone2, 0, top + .15, 0));   // its top clear of the shaft's (they shared a face and flickered)
    for (let n = 0; n < 4; n++) for (const k of [-1, 0, 1]) {               // battlements: merlons with gaps on every side
      const a = n * Math.PI / 2, [x, z] = [Math.sin(a) * .86 + Math.cos(a) * k * .62, Math.cos(a) * .86 - Math.sin(a) * k * .62];
      t.add(box(.3, .45, .3, M.stone2, x, top + .42, z));
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.add(box(.18, HEAD, .18, M.stone2, sx * .82, top + .2 + HEAD / 2, sz * .82));
    t.add(pyramid(1.5, .85, 1, M.roofBlue, top + .2 + HEAD + .42));
    xbowFlag(t, top + .2 + HEAD + .85);
  }
  return g;
}
// ballista: a great crossbow on a swivel (userData.turret, turned to the target by its gunner), a bolt laid in it when loaded
// (userData.bolt): tier 1 a scorpion on a low timber deck, tier 2 a ballista up on a raised timber platform, tier 3 a great
// ballista on a stone platform with a low battlement
const BALLISTA_DECK = XBOW_TOP.slice(), BALLISTA_K = [.85, 1, 1.28];
// the ballista's draw (turret frame): the arm tips, the slider at rest (string straight) and drawn back; crew spots on the deck
const BAL_TIP = [.52, .52, .294], BAL_REST = .29, BAL_DRAWN = -.22, BAL_LOADER = [.42, -.5], BAL_GUNNER = [-.34, -.6];
function ballistaTurret(k) {
  const t = new THREE.Group(); t.userData.turret = true;
  t.add(cyl(.07, .1, .45, 6, M.timber, 0, .22, 0));
  t.add(box(.16, .13, 1.15, M.wood, 0, .5, .05));                                    // the stock
  // curved bow arms: out from the springs, bowing forward, the tips swept back to the string
  for (const sx of [-1, 1]) {
    const P = k => { const u = k / 6; return [sx * (.1 + .42 * u), .52, .5 + .16 * Math.sin(Math.PI * u * .8) - .3 * u * u]; };
    for (let k = 0; k < 6; k++) {
      const [x0, y0, z0] = P(k), [x1, , z1] = P(k + 1), L = Math.hypot(x1 - x0, z1 - z0);
      const sg = box(.065 - k * .006, .07 - k * .005, L + .02, M.timber, (x0 + x1) / 2, y0, (z0 + z1) / 2); sg.rotation.y = Math.atan2(x1 - x0, z1 - z0); t.add(sg);
    }
  }
  for (const sx of [-1, 1]) t.add(box(.13, .16, .13, ropeM, sx * .09, .52, .52));      // torsion springs either side of the stock
  // the string runs from each arm tip to the claw on a slider in the stock's groove; the winch at the back hauls the slider (and
  // the string) back by the pulley rope, the trigger line from the claw lets it go (all set each frame by ballistaCrew)
  const sl = new THREE.Group(); sl.userData.slider = true; sl.position.set(0, .585, BAL_DRAWN); t.add(sl);
  sl.add(box(.12, .05, .08, M.iron, 0, 0, 0)); sl.add(box(.03, .06, .03, M.iron, 0, -.04, -.05));
  for (const key of ['bsL', 'bsR', 'prope', 'trope']) { const r = box(key[0] === 'b' ? .016 : .013, 1, key[0] === 'b' ? .016 : .013, ropeM, 0, 0, 0); r.userData[key] = true; r.visible = false; t.add(r); }
  for (const sx of [-1, 1]) { rA.set(sx * BAL_TIP[0], BAL_TIP[1], BAL_TIP[2]); rB.set(0, .585, BAL_DRAWN); const st = box(.016, 1, .016, ropeM, 0, 0, 0); setRope(st, rA, rB); st.userData.staticString = true; t.add(st); }
  const bolt = new THREE.Group(); bolt.userData.bolt = true; bolt.position.z = BAL_DRAWN + .325; t.add(bolt);
  bolt.add(box(.035, .035, .95, M.timber, 0, .6, .15)); const tip = cone(.045, .14, 4, M.iron, 0, .6, .68); tip.rotation.x = Math.PI / 2; bolt.add(tip);
  const cr = new THREE.Group(); cr.position.set(0, .5, -.52); cr.userData.crank = true; t.add(cr);   // the winch: drum and two crank handles
  const w = cyl(.06, .06, .3, 6, ropeM, 0, 0, 0); w.rotation.z = Math.PI / 2; cr.add(w);
  for (const sx of [-1, 1]) { cr.add(box(.025, .14, .025, M.iron, sx * .17, .07, 0)); cr.add(box(.08, .03, .03, M.timber, sx * .21, .14, 0)); }
  t.scale.setScalar(k); return t;
}
function makeBallista(tier, plinth) {
  const g = new THREE.Group(), deck = BALLISTA_DECK[tier - 1];
  if (plinth) g.add(box(2.0, 1.8, 2.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  // a ladder up the back to the deck: two rails standing clear of the platform's edge and rising past the deck, rungs between
  const ladder = (z, m, y0) => {
    const H = deck + .5 - y0;
    for (const sx of [-1, 1]) g.add(box(.05, H, .05, m, sx * .22, y0 + H / 2, z));
    for (let y = y0 + .25; y < deck + .05; y += .3) g.add(box(.44, .04, .04, m, 0, y, z));
  };
  // a diagonal brace on each of the four sides, running from the foot of one post to near the top of the next
  const braces = (m, w) => {
    const span = 1.44, rise = deck * .78, L = Math.hypot(span, rise), a = Math.atan2(rise, span), y = .08 + rise / 2;
    for (const sz of [-1, 1]) { const x = box(L, w, w, m, 0, y, sz * .72); x.rotation.z = sz * a; g.add(x); }
    for (const sx of [-1, 1]) { const x = box(w, w, L, m, sx * .72, y, 0); x.rotation.x = sx * a; g.add(x); }
  };
  if (tier === 1) {            // a scorpion on a rough log stage: four posts, cross-braced, a log deck, a low rail
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.14, deck, .14, M.rough, sx * .72, deck / 2, sz * .72));
    braces(M.rough, .07);
    g.add(box(1.75, .14, 1.75, M.rough, 0, deck - .07, 0));
    for (const [x, z, w, d] of [[.86, 0, .07, 1.75], [-.86, 0, .07, 1.75], [0, .86, 1.75, .07]]) g.add(box(w, .07, d, M.rough, x, deck + .28, z));
    for (const [x, z] of [[.86, .86], [-.86, .86], [.86, -.86], [-.86, -.86]]) g.add(box(.07, .32, .07, M.rough, x, deck + .14, z));
    ladder(-.95, M.rough, SLAB_TOP);
  } else if (tier === 2) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.15, deck, .15, M.timber, sx * .72, deck / 2, sz * .72));
    braces(M.timber, .08);
    g.add(box(1.85, .12, 1.85, M.wood, 0, deck - .06, 0));
    for (const [x, z, w, d] of [[.9, 0, .06, 1.85], [-.9, 0, .06, 1.85], [0, .9, 1.85, .06]]) g.add(box(w, .35, d, M.timber, x, deck + .17, z));
    ladder(-1.0, M.timber, .2);
  } else {
    g.add(box(1.8, deck - .22, 1.8, M.stone, 0, (deck - .22) / 2 + .2, 0)); g.add(box(1.9, .1, 1.9, M.stone2, 0, deck - .05, 0));   // shaft stops short of the slab's top: no shared face
    for (const [x, z] of [[.8, .8], [-.8, .8], [.8, -.8], [-.8, -.8], [.8, 0], [-.8, 0], [0, .8]]) g.add(box(.26, .38, .26, M.stone2, x, deck + .19, z));
    for (const sx of [-1, 1]) g.add(box(.06, .3, .03, M.dark, sx * .38, deck * .55, .91));   // arrow slits
    for (let y = .32; y < deck - .1; y += .27) g.add(box(.45, .1, .22, M.stone2, 0, y, -1.0));   // a stone ladder: rungs set in the back wall, up to the gap in the battlement
  }
  const t = ballistaTurret(BALLISTA_K[tier - 1]); t.position.y = deck; g.add(t);
  return g;
}
// catapult (tier 1, a torsion arm on a wheeled frame), mangonel (tier 2, bigger, a sling, iron-shod), trebuchet (tier 3, a tall
// A-frame and a counterweighted arm on skids); the whole engine turns to aim (userData.turret), the arm (userData.arm) swings
// up to throw and is winched back down while the crew reloads
const CATA_ARM = [[-1.35, .15], [-1.35, .2], [-2.2, .35]];
// the catapult's crew rig, in the engine's own frame (front +z, before its tier scale): the winch drum (centre, radius, length), its
// crank's x and throw, the arm point the winch rope pulls, the loader at the crank, the gunner by the release catch, where the
// gunner pushes from (behind) and where the loader walks (beside) on a move
const CATA_RIG = [
  { drum: [0, .36, -.72], dr: .055, dl: .6, cx: .46, cr: .11, armR: .5, catch: [-.33, .42, -.5], loader: [.78, -.72], gunner: [-.9, -.25], push: [0, -1.0], walk: [.9, 0] },
  { drum: [0, .36, -.72], dr: .06, dl: .6, cx: .46, cr: .11, armR: .5, catch: [-.33, .42, -.5], loader: [.78, -.72], gunner: [-.9, -.25], push: [0, -1.0], walk: [.9, 0] },
  { drum: [0, .38, -.85], dr: .09, dl: .76, cx: .6, cr: .14, armR: 1.5, catch: [-.5, .28, -.7], loader: [.98, -.85], gunner: [-1.05, -.3], push: [0, -1.4], walk: [1.1, 0] },
];   // the arm's angle about x: cocked, and at the end of the throw
function makeCatapult(tier) {
  const g = new THREE.Group(), e = new THREE.Group(); e.userData.turret = true; g.add(e);
  const arm = new THREE.Group(); arm.userData.arm = true;
  if (tier < 3) {
    const k = tier === 1 ? 1 : 1.15, fm = tier === 1 ? M.rough : M.timber; e.scale.setScalar(k);
    for (const sx of [-1, 1]) e.add(box(.12, .18, 1.5, fm, sx * .36, .3, 0));
    for (const z of [-.6, .6]) e.add(box(.84, .12, .12, fm, 0, .3, z));
    for (const sx of [-1, 1]) for (const z of [-.5, .5]) { const w = cyl(.22, .22, .08, 10, M.wood, sx * .47, .22, z); w.rotation.z = Math.PI / 2; e.add(w); if (tier === 2) { const r = cyl(.225, .225, .03, 10, M.iron, sx * .52, .22, z); r.rotation.z = Math.PI / 2; e.add(r); } }
    for (const sx of [-1, 1]) e.add(box(.1, .75, .1, fm, sx * .3, .65, .28));
    e.add(box(.72, .14, .16, fm, 0, 1.02, .28)); e.add(box(.5, .12, .1, M.canvas, 0, 1.02, .2));   // the stop beam, padded
    const tb = cyl(.13, .13, .62, 8, ropeM, 0, .4, -.32); tb.rotation.z = Math.PI / 2; e.add(tb);
    arm.position.set(0, .4, -.32); e.add(arm);
    arm.add(box(.09, 1.25, .09, M.timber, 0, .62, 0));
    // the cup opens off the arm's face (+z), so cocked back it holds its stone face up and flings it forward
    // the mangonel's cup is bigger, bound in iron, for its bigger stone
    const cr = tier === 1 ? .13 : .19, cup = cyl(cr, cr * .7, cr * .75, 9, M.wood, 0, 1.22, .07); cup.rotation.x = Math.PI / 2; arm.add(cup);
    if (tier === 2) { const band = cyl(cr + .012, cr + .012, .03, 9, M.iron, 0, 1.22, .07 + cr * .3); band.rotation.x = Math.PI / 2; arm.add(band); }
    const sr = tier === 1 ? .1 : .14, shot = new THREE.Mesh(new THREE.DodecahedronGeometry(sr, 0), M.stone2); shot.position.set(0, 1.22, .07 + cr * .38 + sr * .75); shot.userData.bolt = true; shot.castShadow = true; arm.add(shot);
    if (tier === 2) for (const sx of [-1, 1]) e.add(box(.04, .04, 1.52, M.iron, sx * .36, .4, 0));
    for (const [x, z, r] of tier === 1 ? [[-.58, .7, .11]] : [[-.58, .7, .13], [-.72, .5, .12]]) { const ball = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), M.stone2); ball.position.set(x, r * .8, z); ball.castShadow = true; ball.userData.ammo = true; e.add(ball); }
  } else {
    for (const sx of [-1, 1]) e.add(box(.14, .16, 1.9, M.timber, sx * .5, .1, 0));
    for (const z of [-.8, .8]) e.add(box(1.14, .12, .14, M.timber, 0, .12, z));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(.12, 2.3, .12, M.timber, sx * .5, 1.12, sz * .42); l.rotation.x = -sz * .36; e.add(l); }
    const ax = cyl(.06, .06, 1.15, 8, M.iron, 0, 2.15, 0); ax.rotation.z = Math.PI / 2; e.add(ax);
    arm.position.set(0, 2.15, 0); e.add(arm);
    arm.add(box(.11, 2.7, .11, M.timber, 0, .7, 0));                                  // long end up (+y), short end down
    arm.add(box(.5, .5, .5, M.wood, 0, -.82, 0)); for (const y of [-.65, -1.0]) arm.add(box(.52, .05, .52, M.iron, 0, y, 0));   // counterweight
    // a big iron-bound cup at the arm's tip, like the catapult's and mangonel's, for the biggest stone
    const cr = .27, cup = cyl(cr, cr * .7, cr * .75, 10, M.wood, 0, 1.9, .15); cup.rotation.x = Math.PI / 2; arm.add(cup);
    for (const dz of [.05, .23]) { const band = cyl(cr * (dz > .1 ? .97 : .78) + .012, cr * (dz > .1 ? .97 : .78) + .012, .03, 10, M.iron, 0, 1.9, .15 + (dz - .15)); band.rotation.x = Math.PI / 2; arm.add(band); }
    const shot = new THREE.Mesh(new THREE.DodecahedronGeometry(.2, 0), M.stone2); shot.position.set(0, 1.9, .15 + cr * .38 + .15); shot.userData.bolt = true; shot.castShadow = true; arm.add(shot);
    for (let n = 0; n < 3; n++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(.15, 0), M.stone2); st.position.set(-.85, .12, .2 + n * .3); st.castShadow = true; st.userData.ammo = true; e.add(st); }
    for (const sz of [-1, 1]) {                                                       // wheels on iron-bound axles under the frame
      e.add(box(1.36, .06, .06, M.iron, 0, .24, sz * .62));
      for (const sx of [-1, 1]) { const w = cyl(.24, .24, .08, 12, M.wood, sx * .64, .24, sz * .62); w.rotation.z = Math.PI / 2; e.add(w); const r = cyl(.245, .245, .03, 12, M.iron, sx * .69, .24, sz * .62); r.rotation.z = Math.PI / 2; e.add(r); }
    }
    for (const sx of [-1, 1]) e.add(box(.08, .2, .08, M.timber, sx * .42, .26, -.85));   // posts carrying the winch drum
  }
  // the winch at the back: a rope-wound drum and a crank on its right end the loader turns to haul the arm down; a rope from
  // the drum to the arm (set each frame), and the trigger line from the release catch to the gunner's hands
  const R = CATA_RIG[tier - 1];
  const dr = cyl(R.dr, R.dr, R.dl, 10, ropeM, 0, R.drum[1], R.drum[2]); dr.rotation.z = Math.PI / 2; e.add(dr);
  const ax2 = cyl(.025, .025, R.cx * 2, 6, M.iron, 0, R.drum[1], R.drum[2]); ax2.rotation.z = Math.PI / 2; e.add(ax2);
  const cr = new THREE.Group(); cr.position.set(R.cx, R.drum[1], R.drum[2]); cr.userData.crank = true; e.add(cr);
  cr.add(box(.03, R.cr + .03, .03, M.iron, .02, R.cr / 2, 0)); cr.add(box(.12, .035, .035, M.timber, .08, R.cr, 0));
  e.add(box(.07, .05, .05, M.iron, ...R.catch));                                      // the release catch
  for (const k of ['wrope', 'trope']) { const rp = box(.016, 1, .016, ropeM, 0, 0, 0); rp.userData[k] = true; rp.visible = false; e.add(rp); }   // shown once updateSiege stretches them
  arm.rotation.x = CATA_ARM[tier - 1][0];
  return g;
}

// stables: a long stable block on the right, open stalls to the front with horses looking out, a small armoury hut at the front
// left where the riders gear up (the door), hay and a trough; tier 1 a plank shed under old thatch, tier 2 timber under a log roof
// with a saddle rack and a flag, tier 3 stone below timber under the blue roof, a third horse and a stand of armour
// a whole horse standing in its stall (the same build as a rider's horse), head out over the half door
const STALL_COATS = [];
function stallHorse(hc) {
  const h = new THREE.Group(), mm = maneM; h.userData.stallHorse = true;
  h.add(box(.34, .36, .92, hc, 0, .78, 0));                                                   // barrel
  // neck, head, mane and ears hang from a pivot at the withers so the head can nod and turn; the tail from the rump
  const hg = new THREE.Group(); hg.position.set(0, .95, .38); hg.userData.horseHead = true; h.add(hg);
  const neck = box(.2, .46, .22, hc, 0, .11, .1); neck.rotation.x = .55; hg.add(neck);
  const head = box(.16, .17, .4, hc, 0, .27, .34); head.rotation.x = .35; hg.add(head);
  const mane = box(.05, .42, .1, mm, 0, .15, .02); mane.rotation.x = .55; hg.add(mane);
  for (const sx of [-1, 1]) hg.add(box(.04, .08, .05, hc, sx * .05, .39, .24));               // ears
  const tg = new THREE.Group(); tg.position.set(0, .96, -.46); tg.userData.horseTail = true; h.add(tg);
  const tail = box(.07, .45, .07, mm, 0, -.2, -.04); tail.rotation.x = -.35; tg.add(tail);
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { h.add(box(.09, .58, .09, hc, sx * .12, .33, sz * .36)); h.add(box(.1, .06, .1, hoofM, sx * .12, .03, sz * .36)); }
  return h;
}
// stabled horses idle: heads nod, turn and now and then dip to the hay, tails swish, weight shifts
function animHorses(g, t) {
  if (!g.userData.horses) { const L = []; g.traverse(o => { if (o.userData.stallHorse) L.push(o); }); g.userData.horses = L.map((o, i) => { let hd = null, tl = null; o.traverse(c => { if (c.userData.horseHead) hd = c; if (c.userData.horseTail) tl = c; }); return { o, hd, tl, s: i * 2.3 + 1, y0: o.rotation.y }; }); }
  for (const H of g.userData.horses) {
    const s = H.s, dip = Math.pow(Math.max(0, Math.sin(t * .21 + s)), 6);
    if (H.hd) { H.hd.rotation.x = .08 * Math.sin(t * .8 + s) + .45 * dip; H.hd.rotation.y = .22 * Math.sin(t * .33 + s * 1.7) * (1 - dip); }
    if (H.tl) { H.tl.rotation.z = .3 * Math.sin(t * 2.2 + s) * Math.max(.2, Math.sin(t * .5 + s)); H.tl.rotation.x = .08 * Math.sin(t * 1.3 + s); }
    H.o.rotation.y = H.y0 + .05 * Math.sin(t * .19 + s);
  }
}
function makeStables(tier, plinth) {
  if (!STALL_COATS.length) STALL_COATS.push(horseM, mat('#3b2a1e'), mat('#8a6a4a'));
  const g = new THREE.Group(), b = plinth ? .2 : SLAB_TOP;
  if (plinth) g.add(box(4.0, 1.8, 4.0, tier === 2 ? M.plainStone : M.stone, 0, -.7, 0));
  const wallM = tier === 1 ? M.rough : M.plaster, roofM = tier === 1 ? M.thatchOld : tier === 2 ? M.thatch : M.roofBlue;
  const sx0 = .25, sx1 = 1.9, sz0 = -1.75, sz1 = .1, h = 1.45, cx = (sx0 + sx1) / 2, w = sx1 - sx0, dpt = sz1 - sz0;
  g.add(box(w, h, .12, wallM, cx, b + h / 2, sz0 + .06));                                   // back wall
  for (const x of [sx0 + .06, sx1 - .06]) g.add(box(.12, h, dpt, wallM, x, b + h / 2, (sz0 + sz1) / 2));
  if (tier > 1) for (const x of [sx0 + .04, sx1 - .04]) for (const z of [sz0 + .04, sz1 - .02]) g.add(box(.1, h + .02, .1, M.timber, x, b + h / 2, z));   // brown corner posts (tier 2 and 3)
  const stalls = 2;   // two stalls and two horses on every tier; the shed is kept to the right to give the armoury room
  for (let n = 1; n < stalls; n++) g.add(box(.08, .9, dpt - .2, M.timber, sx0 + n * w / stalls, b + .45, (sz0 + sz1) / 2));
  for (let n = 0; n < stalls; n++) {                                                        // half doors and a horse looking over each
    const x = sx0 + (n + .5) * w / stalls; g.add(box(w / stalls - .14, .55, .06, DOOR_M[tier], x, b + .28, sz1));
    const hc = STALL_COATS[n % 3], k = .85, hs = stallHorse(hc); hs.scale.setScalar(k); hs.position.set(x, b, sz1 + .1 - .74 * k); g.add(hs);
  }
  g.add(box(w + .1, .1, .1, M.timber, cx, b + h - .05, sz1));
  const rf = pyramid(w * .74, .75, dpt / w * 1.25, roofM, b + h + .37, cx, (sz0 + sz1) / 2); g.add(rf);
  // the armoury hut at the front left, its door the building's
  // big enough for a rider inside: 1.8 x 1.3, 1.65 m to the eaves (lowered: Jack); the door .78 x 1.42 (centred on x -1)
  const hx = -1, hz = .2, hw = 1.8, hd = 1.3, hh = 1.65;
  g.add(box(hw, hh, hd, wallM, hx, b + hh / 2, hz));
  if (tier > 1) for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.08, hh + .02, .08, M.timber, hx + sx * (hw / 2 - .02), b + hh / 2, hz + sz * (hd / 2 - .02)));
  g.add(pyramid(hw * .78, .6, hd / hw * 1.05, roofM, b + hh + .3, hx, hz));
  g.add(box(.78, 1.42, .05, DOOR_M[tier], -1, b + .71, hz + hd / 2 + .03));   // narrower than the castle's (Jack), still room for a horse's .34 m
  // hay and a trough, side by side
  // behind the armoury: the trough runs out from the horse shed's left wall, the hay at its far end (Jack)
  g.add(box(.7, .2, .25, M.wood, sx0 - .35, b + .1, -1.3)); g.add(cyl(.3, .32, .4, 8, M.hay, sx0 - .7 - .32, b + .2, -1.3));
  if (tier >= 2) {
    // the saddle rack, in front between the two stalls
    g.add(box(.5, .06, .08, M.timber, 1.075, b + .7, .75)); for (const x of [.875, 1.275]) g.add(box(.06, .7, .06, M.timber, x, b + .35, .75));
    g.add(box(.22, .12, .3, saddleM, 1.075, b + .78, .75));
    roofFlag(g, cx, b + h + .8, (sz0 + sz1) / 2);
  }
  if (tier === 3) {                                                                          // a stand of armour beside the armoury
    g.add(box(.05, 1.0, .05, M.timber, .05, b + .5, 1.15)); g.add(cyl(.15, .19, .4, 8, mailM, .05, b + .85, 1.15)); g.add(cyl(.15, .2, .3, 8, kiteM, .05, b + .62, 1.15));
    const hm = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 6, 0, Math.PI * 2, 0, Math.PI * .55), steelM); hm.position.set(.05, b + 1.12, 1.15); g.add(hm);
  }
  return g;
}

// garrison banner: the town's blue banner hung from a crossbar on a tall pole, on a stepped stone base
function makeBanner() {
  const g = new THREE.Group();
  g.add(box(.7, .14, .7, M.stone, 0, .07, 0)); g.add(box(.42, .18, .42, M.stone2, 0, .23, 0));
  g.add(cyl(.045, .055, 2.7, 6, M.timber, 0, 1.6, 0)); g.add(cone(.07, .16, 6, M.iron, 0, 3.02, 0));
  g.add(box(.85, .05, .05, M.timber, 0, 2.75, .05));
  g.add(drapeBox(.62, 1.2, .03, M.drape, 0, 2.12, .08));
  for (const sx of [-1, 1]) g.add(box(.03, .1, .03, M.iron, sx * .4, 2.7, .05));
  return g;
}
// campfire: a ring of stones round a few crossed logs and a low fire (flameShader, embers, a warm light at night), logs to sit on
function makeCampfire() {
  const g = new THREE.Group();
  for (let n = 0; n < 9; n++) { const a = n / 9 * Math.PI * 2, st = new THREE.Mesh(new THREE.DodecahedronGeometry(.11, 0), M.stone2); st.position.set(Math.cos(a) * .36, .08, Math.sin(a) * .36); st.castShadow = true; g.add(st); }
  g.add(cyl(.3, .32, .03, 10, M.dark, 0, .03, 0));
  for (let n = 0; n < 3; n++) { const l = cyl(.045, .05, .55, 6, M.log, 0, .12, 0); l.rotation.z = Math.PI / 2 - .25; l.rotation.y = n * Math.PI / 3; g.add(l); }
  for (const [m, x, z, h, r] of [[M.flame, 0, 0, .42, .14], [M.flame, .08, .06, .26, .08], [M.flame, -.08, -.05, .3, .08], [M.flameMid, 0, 0, .3, .1], [M.flameCore, 0, 0, .16, .06]]) {
    const f = new THREE.Mesh(FLAME_GEO, m); f.scale.set(r, h, r); f.position.set(x, .1 + h / 2, z); f.renderOrder = m === M.flame ? 1 : m === M.flameMid ? 2 : 3; f.userData.noShadow = true; g.add(f);
  }
  for (const a of [.1, 2.35]) { const l = cyl(.09, .1, .7, 7, M.log, Math.cos(a) * .8, .1, Math.sin(a) * .8); l.rotation.z = Math.PI / 2; l.rotation.y = -a - Math.PI / 2; g.add(l); }   // seats round the ring, clear of the stones
  return g;
}
// target range: two straw butts on timber stands, painted rings (the town's blue at the heart), arrows stuck in them
function makeButts() {
  const g = new THREE.Group();
  g.add(box(1.5, .04, 1.1, M.court, 0, .02, 0));
  for (const [x, z, r, a] of [[-.32, -.1, .38, .25], [.45, .2, .28, -.3]]) {
    // each target and its stand turn together (Jack: the posts stood apart from the targets): two posts just behind the straw,
    // leaning back with it, and a prop down to the ground behind
    const S = new THREE.Group(); S.position.set(x, 0, z); S.rotation.y = a; g.add(S);
    const t = new THREE.Group(); t.position.set(0, r + .32, 0); t.rotation.x = -.18; S.add(t);
    // the two posts in the target's own (tilted) frame, flat against the straw's back face, from the ground to just over its top,
    // and a rail across them behind the straw (Jack: the straw stood apart from its posts)
    const bot = -(r + .32) / Math.cos(.18) - .05, top = r + .08;
    for (const sx of [-1, 1]) t.add(box(.055, top - bot, .05, M.timber, sx * r * .62, (top + bot) / 2, -.126));
    t.add(box(r * 1.5, .05, .04, M.timber, 0, -r * .45, -.17));
    const face = cyl(r, r, .2, 14, M.hay, 0, 0, 0); face.rotation.x = Math.PI / 2; t.add(face);
    // painted rings, each a little proud of the one behind (at one depth they fought for the same pixels and showed in patches)
    [[r * .78, M.canvas], [r * .58, kiteM], [r * .36, M.canvas], [r * .16, kiteM]].forEach(([rr, m], i) => { const ring = cyl(rr, rr, .012, 20, m, 0, 0, .106 + i * .008); ring.rotation.x = Math.PI / 2; t.add(ring); });
    for (let n = 0; n < 3; n++) { const ar = box(.012, .012, .32, M.dark, (hash(n, x * 7) - .5) * r, (hash(n + 3, z * 5) - .5) * r, .26); ar.rotation.x = (hash(n, 9) - .5) * .3; t.add(ar); }
  }
  // spent arrows that missed, scattered over the ground in front: some stuck in at a slant, some lying flat
  for (let n = 0; n < 6; n++) {
    const ax = -.62 + hash(n, 3.1) * 1.25, az = .3 + hash(n, 7.7) * .22, stuck = n % 3 !== 2;
    const a = box(.012, .012, .32, M.dark, ax, stuck ? .1 : .05, az); a.rotation.order = 'YXZ'; a.rotation.y = (hash(n, 5.3) - .5) * 2.4; a.rotation.x = stuck ? -.7 - hash(n, 2.2) * .3 : 0; g.add(a);
  }
  return g;
}
// siege stores: crates of ballista bolts, a crate of round shot and barrels, under a lean-to of planks
function makeStores() {
  const g = new THREE.Group();
  g.add(box(1.5, .04, 1.2, M.court, 0, .02, 0));
  const crate = (x, z, w, d, h, r = 0) => { const c = box(w, h, d, M.wood, x, h / 2 + .04, z); c.rotation.y = r; g.add(c); for (const sy of [.2, .8]) { const b = box(w + .01, .03, d + .01, M.timber, x, h * sy + .04, z); b.rotation.y = r; g.add(b); } };
  crate(-.35, -.2, .6, .45, .35, .1);
  // bolts, iron heads out: shaft and head built together and turned as one (Jack: the heads sat off the shafts' ends; no fletching)
  for (let n = 0; n < 6; n++) {
    const b = new THREE.Group(); b.position.set(-.52 + (n % 3) * .14, .44 + Math.floor(n / 3) * .05, -.2 + (n % 2 ? .06 : -.06)); b.rotation.y = .1 + Math.PI / 2; g.add(b);
    b.add(box(.035, .035, .75, M.timber, 0, 0, 0)); const t = cone(.03, .1, 4, M.iron, 0, 0, .42); t.rotation.x = Math.PI / 2; b.add(t);
  }
  crate(.4, -.25, .45, .45, .3, -.2);
  for (const [x, z] of [[.33, -.33], [.47, -.33], [.33, -.17], [.47, -.17], [.4, -.25]]) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(.075, 0), M.stone2); st.position.set(x, .4 + (x === .4 ? .08 : 0), z); st.castShadow = true; g.add(st); }   // round shot
  for (const [x, z] of [[.15, .35], [.5, .3]]) { g.add(cyl(.16, .14, .42, 10, M.wood, x, .25, z)); for (const y of [.12, .38]) g.add(cyl(.165, .165, .03, 10, M.iron, x, y, z)); }
  g.add(cyl(.16, .14, .42, 10, M.wood, -.45, .25, .35));
  return g;
}
// weapon rack: a timber A-frame rack of spears, a round shield and a sword on its pegs, a practice shield leant against it
function makeRack() {
  const g = new THREE.Group();
  g.add(box(1.2, .06, .5, M.court, 0, .03, 0));
  for (const sx of [-1, 1]) { for (const sz of [-1, 1]) { const l = box(.07, 1.25, .07, M.timber, sx * .48, .62, sz * .14); l.rotation.x = -sz * .12; g.add(l); } }
  g.add(box(1.04, .06, .06, M.timber, 0, 1.18, 0)); g.add(box(1.04, .05, .32, M.timber, 0, .3, 0));
  for (let n = 0; n < 4; n++) { const sp = box(.03, 1.45, .03, M.timber, -.33 + n * .2, .78, .04); sp.rotation.x = .1; g.add(sp); const t = cone(.035, .15, 4, M.iron, -.33 + n * .2, 1.55, .12); g.add(t); }
  const sh = roundShield(.22, M.wood); sh.position.set(.42, .7, .2); sh.rotation.y = Math.PI / 2; g.add(sh);
  g.add(box(.025, .6, .05, M.iron, -.48, .72, .24)); g.add(box(.12, .03, .05, M.iron, -.48, 1.0, .24));
  return g;
}
const MODELS = { butts: makeButts, stores: makeStores, banner: makeBanner, campfire: makeCampfire, rack: makeRack, stables: makeStables, crossbow: makeCrossbowTower, ballista: makeBallista, catapult: makeCatapult, forester: makeForester, mine: makeMine, farmhouse: makeFarmhouse, market: makeMarket, barracks: makeBarracks, house: makeHouse, tower: makeTower, castle: makeCastle, lodge: makeLodge, quarry: makeQuarry, farm: makeFarm,
  wall: makeWall, gate: makeGate, well: makeWell, torch: makeTorch, flowers: makeFlowers, statue: makeStatue };
// grit: every mesh gets a slightly different, weathered copy of its material; tier 1 is dirtier and duller
// (a soft dark patch was laid under every building, a stand-in for contact shadow from before the sun cast real shadows; Jack had it
// removed: it read as an oval and the real shadows already ground the buildings)
const tintCache = new Map(), NO_TINT = new Set([M.glow, M.flame, M.flameMid, M.flameCore, M.water, M.flag, M.banner, M.drape]);
function tintColor(col, tier, n) {
  const grime = tier === 1 ? .8 : tier === 2 ? .9 : .97, hsl = {};
  col.multiplyScalar(grime * (.88 + .2 * hash(n + 1, tier * 3.3))); col.convertLinearToSRGB(); col.getHSL(hsl);
  col.setHSL(hsl.h + (hash(n, 7) - .5) * .02, hsl.s * (tier === 1 ? .72 : .86), hsl.l);
}
function tinted(m, tier, n) {
  const key = m.uuid + ':' + tier + ':' + n; let t = tintCache.get(key);
  if (!t) {
    t = m.clone(); if (m.onBeforeCompile && m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile) t.onBeforeCompile = m.onBeforeCompile;
    if (Object.prototype.hasOwnProperty.call(m, 'customProgramCacheKey')) t.customProgramCacheKey = m.customProgramCacheKey;
    tintColor(t.color, tier, n);
    // a team colour's copy: its own default (the base's default, tinted the same way) is registered, so a recolour reaches it
    const T = m.userData.team; if (T) { const c = new THREE.Color(T.def); tintColor(c, tier, n); teamMat(t, T.side, srgbHex(c)); }
    tintCache.set(key, t);
  }
  return t;
}
const makeModel = (type, tier, plinth, mask, rot = 0, fixed = false) => {
  const g = MODELS[type](tier, plinth && tier >= 2 && !DEF[type].plot && !DEF[type].decor && !DEF[type].noPlinth, mask, rot, fixed), tt = DEF[type].decor ? 2 : tier;
  if (plinth && tier === 1 && SLAB[type]) { const w = DEF[type].size * CELL; g.add(box(w, 1.0, w, M.court, 0, SLAB_TOP - .5, 0)); }   // a metre deep: ground lowered by a neighbour never opens a gap
  let n = 0;
  // every part gets a slightly different shade, except the base (slab or plinth: footprint-wide, below ground level), which has one
  // shade per tier so neighbouring bases join without a seam
  const fp = DEF[type].size * CELL, isBase = o => o.geometry.parameters && Math.abs(o.geometry.parameters.width - fp) < .01 && o.position.y < 0;
  g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = !o.userData.noShadow; if (!NO_TINT.has(o.material)) o.material = tinted(o.material, tt, isBase(o) ? 0 : (n++ * 5 + Math.floor(Math.random() * 3)) % 6); } });
  return g;
};

// stone bases fill their tiles exactly; this is how far each one's top sits above the building's ground level
const PLINTH_TOP = { stables: .2, crossbow: .2, ballista: .2, mine: .2, market: .2, house: .1, tower: .2, castle: .2, lodge: .2, quarry: .2, barracks: .2 };
// tier 1 stands on a packed-earth slab like the palisade fort's yard, filling its tiles so neighbours meet edge to edge
const SLAB = { stables: 1, crossbow: 1, ballista: 1, mine: 1, market: 1, house: 1, lodge: 1, quarry: 1, castle: 1, barracks: 1, tower: 1 }, SLAB_TOP = .08;
const plinthTop = (type, tier) => tier === 1 ? (SLAB[type] ? SLAB_TOP : null) : PLINTH_TOP[type];
// a stone-based building placed edge to edge with another settles at the height that makes the two stone tops flush,
// so a row of buildings reads as one continuous platform (only if that is within reach of the ground it stands on)
function snapToNeighbours(type, ev) { const t = flushHeight(type, 1, ev, ev.target, .8); if (t !== null) ev.target = t; }
// the height for a building of this type and tier whose base top lines up with an edge-sharing neighbour's, if one is within reach of ref
function flushHeight(type, tier, ev, ref, reach, self) {
  const mine = plinthTop(type, tier); if (mine == null) return null;
  let best = null;
  for (const B of buildings) {
    const top = plinthTop(B.type, B.tier);
    if (B === self || B.dead || !B.plinth || top == null) continue;
    const e = B.ev;
    const touch = ((e.x1 === ev.x0 || ev.x1 === e.x0) && Math.min(e.z1, ev.z1) > Math.max(e.z0, ev.z0)) ||
                  ((e.z1 === ev.z0 || ev.z1 === e.z0) && Math.min(e.x1, ev.x1) > Math.max(e.x0, ev.x0));
    if (!touch) continue;
    const t = B.group.position.y + top - mine;
    if (Math.abs(t - ref) < reach && (best === null || Math.abs(t - ref) < Math.abs(best - ref))) best = t;
  }
  return best;
}
// after an upgrade the base's top height changes (earth slab, plain stone, masonry); shift the building a little so it stays
// flush with its neighbours; a neighbour on much higher or lower ground stays as it is (the bases run deep enough for this)
function settleBase(B) {
  if (!B.plinth) return;
  const t = flushHeight(B.type, B.tier, B.ev, B.group.position.y, .3, B);
  if (t !== null) B.group.position.y = t;
}

