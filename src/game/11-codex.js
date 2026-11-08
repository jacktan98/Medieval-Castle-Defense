// ---------- the Codex (Jack): the players' own gallery of the town's buildings and the raiders, from the campaign screen's
// round book button. Every entry stays locked (a dark shape) until the player builds that building or meets that raider, and each
// tier only once reached (built up to, or met at); kept in localStorage['mtd-codex'] as { b: { type: top tier }, r: { kind: top tier } }.
// Each entry shows the real model turning slowly, drawn by a small renderer of its own (the game's renderer keeps the title scene) ----------
const CODEX_B = ['castle', 'house', 'farm', 'lodge', 'quarry', 'tower', 'barracks', 'wall', 'gate', 'market', 'ballista', 'forester', 'crossbow',
  'mine', 'catapult', 'farmhouse', 'stables', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'];
const CODEX_R = ['spear', 'sword', 'archer', 'xbow', 'lancer', 'rider', 'ram', 'ballista', 'catapult', 'chief', 'warlord'];
// one short line each (Jack's style: a few plain words, no full stop)
const CODEX_TXT = {
  castle: 'The heart of your town, lose it and the stage is lost', house: 'Homes for villagers and a little gold', farm: 'Fields of grain that feed the town',
  lodge: 'Woodcutters fell the trees nearby', quarry: 'Masons cut stone from the rocks nearby', tower: 'Archers shoot raiders from above',
  barracks: 'Soldiers hold the door or a rally flag', wall: 'Holds raiders back, rams break it', gate: 'Lets villagers through the wall',
  market: 'Trade one resource for another', ballista: 'Heavy bolts that pierce a line of raiders', forester: 'Grows its own trees for wood',
  crossbow: 'Fast bolts at close range', mine: 'Digs stone with no rocks needed', catapult: 'Hurls stones that crush crowds, can be moved',
  farmhouse: 'Livestock that feed the town, even in a blight', stables: 'Riders that run raiders down', flowers: 'Charm that lifts nearby houses\' gold',
  torch: 'Lights the night and adds range', rack: 'Nearby soldiers hit harder', statue: 'Much charm for nearby houses', campfire: 'Adds more range to towers nearby',
  well: 'Nearby workers work faster', butts: 'Archers and crossbows nearby reach further', banner: 'Nearby soldiers strike and move faster', stores: 'Siege engines nearby reload faster',
  spear: 'Goes for the nearest building', sword: 'Hunts your towers and siege engines', archer: 'Shoots from range, even over walls',
  xbow: 'Shoots fast from range, even over walls', lancer: 'A rider that hunts your towers', rider: 'A rider that charges the castle',
  ram: 'Batters down walls and gates', r_ballista: 'Shoots bolts at your buildings from afar', r_catapult: 'Lobs stones at your defences from far off',
  chief: 'The raiders\' leader, marching on the castle', warlord: 'The mounted lord of the raiders, charges all in his way',
};
var CODEX = { b: {}, r: {} }; try { const o = JSON.parse(localStorage.getItem('mtd-codex') || '{}'); CODEX = { b: o.b || {}, r: o.r || {} }; } catch (e) {}
const codexSave = () => { try { localStorage.setItem('mtd-codex', JSON.stringify(CODEX)); } catch (e) {} };
// the castle stands from the start, so it is always open at tier 1
const codexTop = (side, id) => side === 'b' ? Math.max(id === 'castle' ? 1 : 0, CODEX.b[id] || 0) : CODEX.r[id] || 0;
// built (or upgraded) and met (a raider out of its spawn or woken in its camp), only in a real campaign game (not the title scene or the gallery)
function codexUse(type, tier) { if (!achOn() || !DEF[type] || (CODEX.b[type] || 0) >= tier) return; CODEX.b[type] = tier; codexSave(); }
function codexMeet(kind, tier) { if (!achOn() || !ENEMY[kind] || (CODEX.r[kind] || 0) >= tier) return; CODEX.r[kind] = tier; codexSave(); }

// ---- the little renderer: one fixed square canvas, copied to the live view each frame and snapped for the list's thumbnails ----
const CX_PX = 320;
// the thumbnail's pose: the gallery's fighting pose, but the spearman stands at rest with his spear upright, so it stays inside
// the tile while he faces the same way as the others (Jack: held level it poked out of the tile)
function cxRest(m, side, id) {
  galPose(m.p, .4, 1);
  if (side === 'r' && id === 'spear') { const p = m.p; p.arms[1].rotation.x = -.35; p.pivot.rotation.x = CX_SPEAR; p.pivot.position.y = CX_SPEAR_Y; p.body.position.z = 0; p.body.rotation.x = 0; }
}
const CX_SPEAR = -2.8, CX_SPEAR_Y = -.33;
// each kind's zoom: [fit (metres), how high the camera aims (× fit), the grass patch's radius for figures and engines]
// buildings by footprint (Jack): the 3×3 ones (castle, forester) in proportion to each other, the 2×2 ones smaller and the 1×1 ones
// smaller again, though each a little bigger than to true scale; the town's catapult at the raiders' siege zoom; bosses on their own
// (smaller than the figures they stand among); a tall building backs the camera off a little more so its top shows
const CX_FIT = { b3: [5.6, .36], b2: [4.4, .36], b1: [3.8, .56], tower: [4.7, .6], decor: [2.8, .46], foot: [.78, .48, .45], horse: [1.15, .5, .7], siege: [2.7, .38, 1.5],
  bossFoot: [1.08, .5, .5], bossHorse: [1.6, .5, .8] };
let cxR = null, cxScene = null, cxCam = null, cxModel = null, cxRaf = 0, cxT0 = 0, cxLast = 0;
function codexRenderer() {
  if (cxR) return;
  cxR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  cxR.setPixelRatio(1); cxR.setSize(CX_PX, CX_PX, false);
  cxR.outputEncoding = THREE.sRGBEncoding; cxR.toneMapping = THREE.ACESFilmicToneMapping; cxR.toneMappingExposure = 1.1;
  cxR.shadowMap.enabled = true; cxR.shadowMap.type = THREE.PCFSoftShadowMap; cxR.setClearColor(0x000000, 0);
  // nothing below the grass is drawn: bases run a metre underground and poked through the patch (Jack)
  cxR.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), .005)];
  cxScene = new THREE.Scene();
  cxScene.add(new THREE.HemisphereLight('#d6e6ff', '#4a3d28', .75));
  const s = new THREE.DirectionalLight('#ffe7c4', 1.1); s.position.set(-6, 14, 8); s.castShadow = true; s.shadow.mapSize.set(1024, 1024);
  Object.assign(s.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 40 }); s.shadow.bias = -.0008; cxScene.add(s, s.target);
  // a round patch of grass under each model, so it stands on something
  const g = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.04, .12, 40), mat('#24521a')); g.position.y = -.06; g.receiveShadow = true; g.name = 'lawn'; cxScene.add(g);
  cxCam = new THREE.PerspectiveCamera(30, 1, .1, 200);
}
// a model for an entry at a tier: the building as built, the raider as it fights (posed by the gallery's own poses)
function codexModel(side, id, tier) {
  if (side === 'b') {
    const g = makeModel(id, tier, true, id === 'wall' || id === 'gate' ? 10 : 0, 0); galPreview(g, id, tier);
    return { g, cat: DEF[id].decor ? 'decor' : id === 'catapult' ? 'siege' : id === 'tower' ? 'tower' : 'b' + (DEF[id].size || 1), foot: id === 'catapult' ? 0 : (DEF[id].size || 1) * CELL };
  }
  const E = ENEMY[id], p = makeRaider(id, E.boss ? 3 : tier);
  Object.assign(p, E.engine ? { kind: id, tier, rate: E.rate, seed: 0 } : { raider: id, rt: tier, seed: 0 });
  if (!E.engine) p.g.scale.setScalar(UNIT_K * (E.boss || 1));
  return { g: p.g, p, cat: E.engine ? 'siege' : E.boss ? (E.mounted ? 'bossHorse' : 'bossFoot') : E.mounted ? 'horse' : 'foot' };
}
// frame the model: the camera backs off to fit its bounding box, a little from above and to the side
function codexFrame(m) {
  cxScene.add(m.g); m.g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(m.g), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  // only what stands above the grass counts
  box.min.y = Math.max(box.min.y, 0); box.getSize(size); box.getCenter(c);
  // one zoom per kind (Jack: models of a kind in proportion to each other): the economy and defence buildings share one, decor
  // another, raiders on foot, mounted raiders and siege engines one each; each fits the biggest of its kind (the stone castle, the
  // banner, the Raider Chief, the Warlord, the trebuchet), and the ground sits at the same height in the view for all of a kind
  const F = CX_FIT[m.cat], fit = m.cat === 'b2' || m.cat === 'b3' ? Math.max(F[0], size.y * .62) : F[0], d = fit / Math.tan(cxCam.fov * Math.PI / 360) * 1.02;
  // the grass: past a building's corners (half its footprint's diagonal), a set patch under figures and engines
  const r = m.foot ? m.foot * .71 + .25 : F[2], lawn = cxScene.getObjectByName('lawn');
  lawn.scale.set(r, 1, r); lawn.position.set(0, -.06, 0);
  m.look = new THREE.Vector3(0, fit * F[1], 0); m.d = d;
  const sl = cxScene.children.find(o => o.isDirectionalLight); const k = Math.max(2, fit * 1.6);
  Object.assign(sl.shadow.camera, { left: -k, right: k, top: k, bottom: -k }); sl.shadow.camera.updateProjectionMatrix();
  sl.position.set(c.x - k * .8, c.y + k * 2.2, c.z + k); sl.target.position.copy(c);
}
function codexShot(m, ang) {
  cxCam.position.set(m.look.x + Math.sin(ang) * m.d * .9, m.look.y + m.d * .42, m.look.z + Math.cos(ang) * m.d * .9); cxCam.lookAt(m.look);
  cxR.render(cxScene, cxCam);
}
const codexDrop = m => { if (m) cxScene.remove(m.g); };
// thumbnails, made a few at a time while the screen is open, kept for the session
const cxThumb = {}, cxQueue = [];
const thumbKey = (side, id, tier) => `${side}:${id}:${tier}`;
function codexThumbs() {
  const t0 = performance.now();
  while (cxQueue.length && performance.now() - t0 < 14) {
    const [side, id, tier] = cxQueue.shift(), key = thumbKey(side, id, tier); if (cxThumb[key]) continue;
    const m = codexModel(side, id, tier); codexFrame(m);
    if (m.p) cxRest(m, side, id);
    codexShot(m, .7); cxThumb[key] = cxR.domElement.toDataURL('image/png'); codexDrop(m);
    for (const im of document.querySelectorAll(`#codexPick img[data-k="${key}"]`)) im.src = cxThumb[key];
  }
}

// ---- the screen ----
let cxTab = 'b', cxSel = null, cxTier = 1;
const cxEntries = () => (cxTab === 'b' ? CODEX_B : CODEX_R).map(id => ({ side: cxTab, id }));
const cxName = (side, id, tier) => side === 'b' ? DEF[id].name : Array.isArray(RAIDER_NAME[id]) ? RAIDER_NAME[id][tier - 1] : RAIDER_NAME[id];
const cxTiers = (side, id) => side === 'b' ? DEF[id].tiers.length : ENEMY[id].boss ? 1 : 3;
function openCodex() {
  sfx('click'); codexRenderer();
  $('#codexPick').replaceChildren(); $('#campaign').hidden = true; $('#codexPick').hidden = false;
  cxTab = 'b'; cxSel = null; renderCodex();
  cancelAnimationFrame(cxRaf); cxT0 = cxLast = performance.now(); cxRaf = requestAnimationFrame(codexLoop);
}
function closeCodex() { cancelAnimationFrame(cxRaf); cxRaf = 0; codexDrop(cxModel); cxModel = null; $('#codexPick').hidden = true; openCampaign(cSel); }
function renderCodex() {
  const list = cxEntries(); if (!cxSel || !list.some(e => e.id === cxSel)) cxSel = list[0].id;
  const el = $('#codexPick'), all = CODEX_B.length + CODEX_R.length, got = CODEX_B.filter(id => codexTop('b', id)).length + CODEX_R.filter(id => codexTop('r', id)).length;
  let sh = el.querySelector('.upSheet'); if (!sh) { sh = document.createElement('div'); sh.className = 'upSheet achSheet cxSheet'; el.replaceChildren(sh); }
  cxQueue.length = 0;
  const tiles = list.map(({ side, id }) => {
    const top = codexTop(side, id), t = Math.max(1, top), key = thumbKey(side, id, t);
    if (!cxThumb[key]) cxQueue.push([side, id, t]);
    return `<div class="achItem"><button class="achNode cxNode${top ? ' done' : ' locked'}${id === cxSel ? ' sel' : ''}" data-cx="${id}" aria-label="${top ? cxName(side, id, t) : 'Locked'}"><img data-k="${key}" alt="" src="${cxThumb[key] || 'data:image/gif;base64,R0lGODlhAQABAAAAACw='}">${top ? '' : `<span class="cxLock">${LOCK_ICO}</span>`}</button><div class="achName">${top ? cxName(side, id, t) : '???'}</div></div>`;
  }).join('');
  sh.innerHTML = `<div class="upTop"><button class="upBack campBack" id="cxBack" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12H5.5M11.5 5.5L5 12l6.5 6.5"/></svg></button><h2>Archive</h2><div class="upBank"><b>${got}</b><i class="upAll">/ ${all}</i></div></div>
    <div class="upTabs"><button class="upTab${cxTab === 'b' ? ' on' : ''}" data-cxtab="b">Buildings</button><button class="upTab${cxTab === 'r' ? ' on' : ''}" data-cxtab="r">Raiders</button></div>
    <div class="achGrid cxGrid">${tiles}</div>
    <div class="upDet cxDet"><canvas class="cxView" width="${CX_PX}" height="${CX_PX}"></canvas><div class="upTx"><div class="upOf"></div><h3></h3><p></p><div class="cxTiers"></div><div class="cxStats"></div></div></div>`;
  selectCodex(cxSel);
}
function cxStatsHTML(side, id, tier) {
  if (side === 'b') return newCardStats(id, tier);
  const E = ENEMY[id], k = tier - 1, hp = E.boss ? E.hp : Math.round(E.hp * RAIDER_T.hp[k]), dmg = E.boss ? E.dmg : Math.round(E.dmg * RAIDER_T.dmg[k] * 10) / 10;
  const st = [STAT('hp', hp), STAT(E.engine ? 'siege' : E.range > 2 ? 'bow' : 'sword', dmg, '', 'Damage')];
  if (E.range > 2) st.push(STAT('range', `${E.range} m`));
  return st.join('');
}
function selectCodex(id, tier) {
  cxSel = id; const el = $('#codexPick'), side = cxTab, top = codexTop(side, id), n = cxTiers(side, id);
  cxTier = top ? Math.min(top, n, tier || top) : 1;
  for (const b of el.querySelectorAll('.cxNode')) b.classList.toggle('sel', b.dataset.cx === id);
  const det = el.querySelector('.cxDet'); det.classList.toggle('locked', !top);
  el.querySelector('.upOf').textContent = !top ? (side === 'b' ? 'Building' : 'Raider') : side === 'b' ? (DEF[id].decor ? 'Decor' : DEF[id].tiers[cxTier - 1]) : ENEMY[id].boss ? 'Boss' : `Raider · Tier ${cxTier}`;
  el.querySelector('.upTx h3').textContent = top ? cxName(side, id, cxTier) : '???';
  el.querySelector('.upTx p').textContent = !top ? (side === 'b' ? 'Build one to unlock' : 'Meet one to unlock') : CODEX_TXT[side === 'r' && DEF[id] && CODEX_TXT['r_' + id] ? 'r_' + id : id] || '';
  el.querySelector('.cxTiers').innerHTML = top && n > 1 ? [1, 2, 3].slice(0, n).map(t => `<button class="seg cxT${t === cxTier ? ' on' : ''}" data-cxt="${t}"${t > top ? ' disabled' : ''}>${t > top ? LOCK_ICO : 'Tier ' + t}</button>`).join('') : '';
  el.querySelector('.cxStats').innerHTML = top ? cxStatsHTML(side, id, cxTier) : '';
  codexDrop(cxModel); cxModel = codexModel(side, id, cxTier); codexFrame(cxModel); cxT0 = performance.now();
}
// the live view: the model turns slowly (a raider keeps fighting, a building's horses and flags keep moving); then a few thumbnails
function codexLoop(now) {
  if ($('#codexPick').hidden) { cxRaf = 0; return; }
  cxRaf = requestAnimationFrame(codexLoop);
  const dt = Math.min(.05, (now - cxLast) / 1000); cxLast = now;
  const cv = $('#codexPick .cxView');
  if (cxModel && cv) {
    const t = (now - cxT0) / 1000; windU.value = now / 1000;
    if (cxModel.p) galPose(cxModel.p, t, dt); else animHorses(cxModel.g, now / 1000);
    codexShot(cxModel, .7 + t * .35);
    const c = cv.getContext('2d'); c.clearRect(0, 0, CX_PX, CX_PX); c.drawImage(cxR.domElement, 0, 0);
  }
  if (cxQueue.length) { const keep = cxModel; if (keep) cxScene.remove(keep.g); codexThumbs(); if (keep) cxScene.add(keep.g); }
}
$('#codexPick').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'cxBack') { sfx('click'); closeCodex(); return; }
  if (b.dataset.cxtab) { if (b.dataset.cxtab !== cxTab) { sfx('click'); cxTab = b.dataset.cxtab; cxSel = null; renderCodex(); } return; }
  if (b.dataset.cx) { sfx('click'); selectCodex(b.dataset.cx); return; }
  if (b.dataset.cxt && !b.disabled) { sfx('click'); selectCodex(cxSel, +b.dataset.cxt); }
});
document.addEventListener('click', e => { if (e.target.closest('#campCxBtn')) openCodex(); });
