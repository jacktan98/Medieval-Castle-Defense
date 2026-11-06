// ---------- the town's buildings for this game: one of each pair for the economy and the defences, any five decor ----------
const LOAD_SLOTS = {
  eco: [['food', ['farm', 'farmhouse']], ['wood', ['lodge', 'forester']], ['stone', ['quarry', 'mine']]],
  def: [['ranged', ['tower', 'crossbow']], ['siege', ['ballista', 'catapult']], ['barracks', ['barracks', 'stables']]],
};
const DECOR_ALL = ['flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'], DECOR_PICK = 4;   // plus the path, always there: five tools, one row in the dock
const LOAD_DEFAULT = { food: 'farm', wood: 'lodge', stone: 'quarry', ranged: 'tower', siege: 'ballista', barracks: 'barracks', decor: ['flowers', 'torch', 'well', 'banner'] };
var LOADOUT = { ...LOAD_DEFAULT, decor: LOAD_DEFAULT.decor.slice() };
try {   // last game's picks; anything unknown falls back to the default
  const L = JSON.parse(localStorage.getItem('mtd-loadout') || 'null');
  if (L) { for (const k of ['eco', 'def']) for (const [slot, opts] of LOAD_SLOTS[k]) if (opts.includes(L[slot])) LOADOUT[slot] = L[slot];
    const D = Array.isArray(L.decor) ? L.decor.filter(t => t !== 'road') : null;   // the path was a pick for a while: drop it from old picks
    if (D && D.length === DECOR_PICK && D.every(t => DECOR_ALL.includes(t))) LOADOUT.decor = D; }
} catch (e) {}
const LOAD_TAG = { ranged: 'Ranged', siege: 'Siege', barracks: 'Troops' };
// the defence rows' icons (Jack): archers' bow for ranged, a catapult for siege, a sword for troops
const LOAD_ICO = { ranged: 'bow', siege: 'siege', barracks: 'sword' };
// a campaign stage with more decor unlocked than DECOR_PICK lets the player choose four on the town picker (the rest shown locked);
// the picks are kept per stage in localStorage['mtd-stage-decor'], by default the newest four
const stageDecorAll = m => CAMP_MAPS[m].cats.decor.filter(t => t !== 'road');
const SLOTS_ALL = () => [...LOAD_SLOTS.eco, ...LOAD_SLOTS.def];
const stageOpen = m => new Set([...CAMP_MAPS[m].cats.eco, ...CAMP_MAPS[m].cats.def]);
const stageBoth = m => SLOTS_ALL().filter(([, o]) => o.every(t => stageOpen(m).has(t)));   // pairs with both unlocked: the player picks one
const stagePicks = m => stageDecorAll(m).length > DECOR_PICK || stageBoth(m).length > 0;
var STAGE_PAIR = {}; try { STAGE_PAIR = JSON.parse(localStorage.getItem('mtd-stage-pair') || '{}') || {}; } catch (e) {}
// with both of a pair unlocked, a stage starts on the newer one (the second of each pair: farmhouse, forester, mine, crossbow, catapult,
// stables; Jack: the new buildings by default, the old still a tap away) unless it suggests otherwise (Siegeford: the quarry, stone
// lying about) or the player picked on this stage before
const stagePair = (m, slot, opts) => (STAGE_PAIR[m] && opts.includes(STAGE_PAIR[m][slot])) ? STAGE_PAIR[m][slot] : (CAMP_MAPS[m].prefer || {})[slot] || opts[1];
var STAGE_DECOR = {}; try { STAGE_DECOR = JSON.parse(localStorage.getItem('mtd-stage-decor') || '{}') || {}; } catch (e) {}
function stageDecor(m) {
  const all = stageDecorAll(m), d = STAGE_DECOR[m];
  return Array.isArray(d) && d.length === DECOR_PICK && d.every(t => all.includes(t)) ? d.slice() : all.slice(-DECOR_PICK);
}
var stagePick = null;   // the stage map whose picks the town picker is showing (null: free play's loadout)
function applyLoadout() {
  const CM = CAMP_MAPS[MAP], L = CM ? { ...LOADOUT, food: 'farm', wood: 'lodge', stone: 'quarry', ranged: 'tower' } : LOADOUT;
  if (CM) {
    Object.assign(CATS, JSON.parse(JSON.stringify(CM.cats)));
    if (stageDecorAll(MAP).length > DECOR_PICK) { const d = stageDecor(MAP); CATS.decor = ['road', ...stageDecorAll(MAP).filter(t => d.includes(t))]; }
    for (const [slot, opts] of stageBoth(MAP)) { const keep = stagePair(MAP, slot, opts); for (const k of ['eco', 'def']) CATS[k] = CATS[k].filter(t => !opts.includes(t) || t === keep); }
  }
  else { CATS.eco = ['house', L.food, L.wood, L.stone, 'market']; CATS.def = [L.ranged, L.siege, L.barracks, 'wall', 'gate']; CATS.decor = ['road', ...DECOR_ALL.filter(t => L.decor.includes(t))]; }
  // the first day's guide follows the picks (a stage may have its own)
  GUIDE = [];
  if (CM && CM.guide) { GUIDE = CM.guide(); return; }
  // each step says what to build and why, in the tips' style (Jack: more detail; no "·" or full stop)
  const STEP = { lodge: 'Build a <b>Lumber</b> near trees for wood', forester: 'Build a <b>Forester</b> for wood',
    farm: 'Build a <b>Fields</b> for food', farmhouse: 'Build a <b>Farmhouse</b> for food',
    tower: 'Build a <b>Archers</b> to guard the town', crossbow: 'Build a <b>Crossbow</b> to guard the town' };
  GUIDE.push({ text: 'Build a <b>House</b> for more villagers', tool: 'house', cat: 'eco', done: () => buildings.some(B => B.type === 'house') },
    { text: STEP[L.wood], tool: L.wood, cat: 'eco', done: () => buildings.some(B => B.type === L.wood) },
    { text: STEP[L.food], tool: L.food, cat: 'eco', done: () => buildings.some(B => B.type === L.food) },
    { text: STEP[L.ranged], tool: L.ranged, cat: 'def', done: () => buildings.some(B => B.type === L.ranged) },
    { text: 'Tap a building to <b>Upgrade</b> it', tool: 'select', done: () => buildings.some(B => B.tier > 1 || (B.site && B.site.kind === 'up')) });
  if (tierCap() < 2) GUIDE.pop();   // no upgrades on this stage
}
const LOCK_ICO = '<svg class="lockIco" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11 V8 a4 4 0 0 1 8 0 V11"/></svg>';
function renderLoadPick() {
  // on a stage: what it has unlocked is fixed (or, for decor, picked), everything else shows a lock
  const SM = stagePick && CAMP_MAPS[stagePick], open = SM ? new Set([...SM.cats.eco, ...SM.cats.def, ...SM.cats.decor]) : null;
  const L = SM ? { ...Object.fromEntries(SLOTS_ALL().map(([slot, opts]) => [slot, opts.every(t => open.has(t)) ? stagePair(stagePick, slot, opts) : opts.find(t => open.has(t))])), decor: STAGE_DECOR[stagePick] } : LOADOUT;
  const lk = t => open && !open.has(t);
  // a locked option shows only a padlock: no name, no icon, no cost
  const opt = (t, on, slot) => lk(t) ? `<button class="ldOpt locked" data-slot="${slot}" data-t="${t}" aria-pressed="false" aria-label="Locked"><span class="tIco">${LOCK_ICO}</span></button>`
    : `<button class="ldOpt" data-slot="${slot}" data-t="${t}" aria-pressed="${on}"><span class="tIco">${TOOL_ICON[t]}</span><span><b>${DEF[t].name}</b><small>${costHTML(DEF[t].cost)}</small></span></button>`;
  for (const k of ['eco', 'def']) $(k === 'eco' ? '#ldEco' : '#ldDef').innerHTML = LOAD_SLOTS[k].map(([slot, opts]) =>
    `<div class="ldRow"><span class="ldCat">${k === 'eco' ? `<span class="ico">${ICON[slot]}</span>` : `<span class="ico" title="${LOAD_TAG[slot]}">${ICON[LOAD_ICO[slot]]}</span>`}</span>${opts.map(t => opt(t, L[slot] === t, slot)).join('')}</div>`).join('');
  $('#ldDecor').innerHTML = DECOR_ALL.map(t => lk(t) ? `<button class="ldOpt locked" data-slot="decor" data-t="${t}" aria-pressed="false" aria-label="Locked"><span class="tIco">${LOCK_ICO}</span></button>`
    : `<button class="ldOpt" data-slot="decor" data-t="${t}" aria-pressed="${L.decor.includes(t)}"><span class="tIco">${TOOL_ICON[t]}</span><b>${t === 'road' ? 'Path' : DEF[t].name}</b></button>`).join('');
  $('#ldBack').textContent = SM ? 'Back' : 'Maps';
  const n = (L.decor || []).length; $('#ldDecN').textContent = `${n}/${DECOR_PICK}`; $('#ldDecN').classList.toggle('short', n !== DECOR_PICK); $('#ldStart').disabled = n !== DECOR_PICK;
}
$('#loadPick').addEventListener('click', e => {
  const b = e.target.closest('.ldOpt'); if (!b) return;
  if (stagePick && b.classList.contains('locked')) { sfx('nope'); return; }
  if (stagePick && b.dataset.slot !== 'decor') {   // a stage's pair: pickable only when both are unlocked
    const pr = SLOTS_ALL().find(([slot]) => slot === b.dataset.slot);
    if (!stageBoth(stagePick).includes(pr)) return;
    (STAGE_PAIR[stagePick] = STAGE_PAIR[stagePick] || {})[b.dataset.slot] = b.dataset.t; sfx('click'); renderLoadPick(); return;
  }
  const L = stagePick ? { decor: STAGE_DECOR[stagePick] } : LOADOUT, t = b.dataset.t;
  if (b.dataset.slot !== 'decor') L[b.dataset.slot] = t;
  else if (L.decor.includes(t)) L.decor = L.decor.filter(x => x !== t);
  else if (L.decor.length < DECOR_PICK) L.decor.push(t);
  else { sfx('nope'); return; }
  if (stagePick) STAGE_DECOR[stagePick] = L.decor;
  sfx('click'); renderLoadPick();
});
function showLoadPick(stage) {
  stagePick = stage || null; if (stagePick) STAGE_DECOR[stagePick] = stageDecor(stagePick);
  renderLoadPick(); $('#loadPick').hidden = false; $('#loadPick').scrollTop = 0; }
$('#ldBack').addEventListener('click', () => { sfx('click'); $('#loadPick').hidden = true; if (stagePick) { stagePick = null; openCampaign(CAMP_MAPS[MAP].stop); } else showMapPick(); });
$('#ldStart').addEventListener('click', () => {
  sfx('click');
  if (stagePick) {
    if (STAGE_DECOR[stagePick].length !== DECOR_PICK) return;
    try { localStorage.setItem('mtd-stage-decor', JSON.stringify(STAGE_DECOR)); localStorage.setItem('mtd-stage-pair', JSON.stringify(STAGE_PAIR)); } catch (e) {}
    stagePick = null; $('#loadPick').hidden = true; $('#campaign').hidden = true; paused = false; startGame(); return;
  }
  if (LOADOUT.decor.length !== DECOR_PICK) return;
  try { localStorage.setItem('mtd-loadout', JSON.stringify(LOADOUT)); } catch (e) {}
  $('#loadPick').hidden = true; paused = false; startGame();
});
// map picker: shown on entry and on Restart / Play again; the game waits (paused) underneath
// Stonebridge's half-built palisade along the town's bank: a line of wall cells from the west edge to the east edge just south of the
// river, joined where it steps; left open at the bridge's southern end (for a gate), at the ford and in one stretch to the west, so a
// new player closes it with a gate and a few walls. BANK_WALL lists every cell of the full line (gaps too), for the guide
var BANK_WALL = [];
function bankWall() {
  const b = bridges[0], line = [];
  let prev = -1;
  for (let ci = 0; ci < N; ci++) {
    const x = (ci + .5) * CELL;
    let cj = Math.floor((stoneRiverZ(x) + BANK_D) / CELL);
    for (let k = 0; k < 3 && cj < N - 1 && (bridgeCell[cj * N + ci] || !evaluate('wall', ci, cj).ok); k++) cj++;   // off the bridge, the bank's slope and the wet
    // join a step with cells on its southern side, away from the river's bank: down the previous column when the line steps south,
    // down this one when it steps north
    if (prev >= 0 && cj > prev) for (let k = prev + 1; k <= cj; k++) line.push([ci - 1, k]);
    if (prev >= 0 && cj < prev) for (let k = cj + 1; k <= prev; k++) line.push([ci, k]);
    line.push([ci, cj]); prev = cj;
  }
  const bci = b ? Math.floor(b.ex / CELL) : -1, fci = Math.floor(FORD_X / CELL);
  BANK_WALL = line.map(([ci, cj]) => cj * N + ci);
  const gap = ([ci, cj]) => ci === bci || Math.abs(ci - fci) <= 1 || ci === 6 || ci === 7;
  for (const c of line) if (!gap(c)) { const ev = evaluate('wall', c[0], c[1]); if (ev.ok) place('wall', c[0], c[1], { instant: true, free: true, quiet: true }); }
}
// Siegeford's old stone wall (tier 2): one straight row along the town's bank (FORD_WALL_ROW, z 30–32), open at the bridge, at the ford,
// in a stretch to the east and one to the west (a winding line chasing the bank broke into pieces on its slopes and rocks)
const fordWallRow = () => Math.floor((FORD_WALL_ROW + .5) * MK);
function fordWall() {
  // laid on the layout's columns (a medium map's cell ci stands over layout column d)
  const cj = fordWallRow(), bci = Math.floor(FORD_BRIDGE_X / CELL), fci = Math.floor(FORD_XS[0] / CELL);
  const gap = c => { const ci = Math.floor((c + .5) / MK); return Math.abs(ci - bci) <= 1 || Math.abs(ci - fci) <= 2 || ci === 22 || ci === 23 || ci <= 4; };   // (Jack: none west of the old gap at columns 3-4)
  for (let ci = 0; ci < N; ci++) if (!gap(ci) && evaluate('wall', ci, cj).ok) {
    const B = place('wall', ci, cj, { instant: true, free: true, quiet: true });
    if (B) { B.tier = 2; B.max = DEF.wall.hp[1]; B.hp = B.max; swapModel(B); }
  }
  // the west side (Jack: so players see raiders may come that way): the same old wall running north to south across the gorge,
  // on layout column 4 from below the bank's row down to the gorge road, left open there (a gate's place); Jack had the stretch south
  // of the road dropped. Any rock on its line is cleared first, so the line has no other holes
  const wci = Math.floor(4.5 * MK), x0 = wci * CELL - .5, x1 = (wci + 1) * CELL + .5;
  for (let wj = cj + 1; wj < N; wj++) {
    if (road[wj * N + wci]) break;
    for (const q of rocks) if (q.x > x0 && q.x < x1 && q.z > wj * CELL - .5 && q.z < (wj + 1) * CELL + .5) q.amount = 0;
    if (!evaluate('wall', wci, wj).ok) continue;
    const B = place('wall', wci, wj, { instant: true, free: true, quiet: true });
    if (B) { B.rot = 1; B.tier = 2; B.max = DEF.wall.hp[1]; B.hp = B.max; swapModel(B); }
  }
  seatRocks(); refreshWalls();
}
// a stage's new buildings, one card at a time over the paused game: picture (tool icon), name, cost and tier-1 stats; Next, then Play
var newCards = [], newCardI = 0;
function newCardStats(t) {
  const T = DEF[t], st = [];
  if (T.hp) st.push(STAT('hp', T.hp[0]));
  if (T.residents) st.push(STAT('home', T.residents[0])); if (T.gold) st.push(STAT('gold', `+${T.gold[0]}`)); if (T.food) st.push(STAT('food', `+${T.food[0]}`));
  if (T.workers) st.push(STAT('hammer', T.workers[0])); if (T.reach) st.push(STAT('range', `${T.reach} m`, '', 'Reach'));
  if (T.archers) st.push(STAT('guard', T.archers[0])); if (T.dmg && T.archers) st.push(STAT('bow', T.dmg[0])); if (T.dmg && T.crew) st.push(STAT('guard', T.crew[0], '', 'Crew'), STAT('siege', T.dmg[0], '', 'Damage')); if (T.range) st.push(STAT('range', `${T.range[0]} m`, '', 'Range'));
  if (T.soldiers) st.push(STAT('guard', T.soldiers[0], '', 'Soldiers'), STAT('sword', SOLDIER.dmg[0]));
  if (T.decor) { st.push(...fxStats(t, (i, v, n) => STAT(i, v, 'good', n))); if (T.charm) st.push(STAT('charm', `+${Math.round(T.charm * 100)}%`, 'good')); }
  return st.join('');
}
function showNewCards(list) {
  newCards = list.slice(); newCardI = 0; if (!newCards.length) return;
  paused = true; hideGhost(); renderNewCard(); $('#newCards').hidden = false; sfx('alert');
}
const STAR_ICO = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.8 L14.7 8.9 L21.3 9.5 L16.3 13.9 L17.8 20.4 L12 17 L6.2 20.4 L7.7 13.9 L2.7 9.5 L9.3 8.9 Z"/></svg>';
const UP_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 14 L12 7 L19 14"/><path d="M5 19 L12 12 L19 19"/></svg>';
function renderNewCard() {
  const t = newCards[newCardI], last = newCardI === newCards.length - 1, nNew = newCards.filter(c => c !== 'goals').length;
  $('#ncStep').textContent = `New · ${newCardI + 1}/${nNew}`; $('#ncNext').textContent = last ? 'Play' : 'Next';
  $('#newCards .ncCard').classList.toggle('goalCard', t === 'goals');
  if (t === 'goals') {        // the stage's two goals: each one met is a star on top of the win's
    $('#ncStep').textContent = `Stage ${CAMP_MAPS[MAP].stop + 1}`; $('#ncName').textContent = 'Goals'; $('#ncIcon').innerHTML = STAR_ICO;
    $('#ncCost').innerHTML = '';
    $('#ncStats').innerHTML = `<ul class="ncGoals"><li><b>★</b>Win</li>${stageGoals(MAP).map(([g]) => `<li><b>★</b>${g}</li>`).join('')}</ul>`;
    return;
  }
  if (/^tier\d$/.test(t)) {   // a tier opening up: what an upgrade brings, house and archer tower as examples
    const k = +t[4] - 1, H = DEF.house, W = DEF.tower;
    $('#ncName').textContent = `Tier ${k + 1}`; $('#ncIcon').innerHTML = UP_ICO;
    $('#ncCost').innerHTML = `<span class="cost"><span class="ico">${UP_ICO}</span>Upgrades</span>`;
    $('#ncStats').innerHTML = '';   // just "Upgrades" (Jack dropped the house / gold / archer examples)
    return;
  }
  $('#ncName').textContent = t === 'road' ? 'Path' : DEF[t].name; $('#ncIcon').innerHTML = TOOL_ICON[t] || '';
  $('#ncCost').innerHTML = costHTML(DEF[t].cost || {}); $('#ncStats').innerHTML = newCardStats(t);
  $('#ncNext').textContent = last ? 'Play' : 'Next';
}
$('#ncNext').addEventListener('click', () => {
  sfx('click');
  if (++newCardI < newCards.length) { renderNewCard(); sfx('alert'); return; }
  $('#newCards').hidden = true; paused = false;
});
// Market Cross: the old roads laid as paths cell by cell (stepping round corners so they join), the stone cross by the junction
// (it works as a statue: its charm lifts the hamlet's gold), and the hamlet's three houses round it
function crossTown() {
  layRoads(CROSS_ROADS);
  const c = cellAt(CROSS_AT[0] - 1.6, CROSS_AT[1] - 1.6), ci = c % N, cj = (c / N) | 0;
  road[c] = 0;
  const S = place('statue', ci, cj, { instant: true, free: true, quiet: true });
  if (S) { S.group.children.forEach(o => o.visible = false); S.group.add(makeMarketCross()); S.marketCross = true; }
  for (const [x, z] of [[20.5, 26.5], [28, 33.5], [20.5, 35]]) {
    const n = cellAt(x, z); let done = false;
    for (const [da, db] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = n % N + da, b = ((n / N) | 0) + db; if (!done && !road[b * N + a] && evaluate('house', a, b).ok) { place('house', a, b, { instant: true, free: true, quiet: true }); done = true; } }
  }
  rebuildRoads();
}
// the old ruined watchtower on Watch hill: a broken ring of stone, fallen blocks round it (scenery: nothing is built or stood on it)
let ruinMesh = null;
// fires burning in the scenery (the ruins, the raiders' camps): embers, a night light and the fire's sound like a built torch's
let sceneFires = [];
// a ruined watchtower (Jack liked Watchhill's): a broken ring of stone, fallen blocks round it; burnt: the stone scorched, soot on the
// broken tops, charred beams fallen in, ash; on fire: flames licking up inside and off a beam. Its local frame; seed varies the ring
let burntStoneM = null;
function makeRuin(seed = 0, fire = false) {
  if (!burntStoneM) { burntStoneM = M.stone2.clone(); burntStoneM.onBeforeCompile = M.stone2.onBeforeCompile; if (M.stone2.customProgramCacheKey) burntStoneM.customProgramCacheKey = M.stone2.customProgramCacheKey; burntStoneM.color.multiplyScalar(.3); }
  const g = new THREE.Group(), H = [1.9, 1.5, 1.1, .5, .3, .7, 1.3, 2.4, 2.1, 1.6, .4, .9], fires = [];
  g.add(box(2.3, .3, 2.3, burntStoneM, 0, .05, 0));
  g.add(cyl(.85, .9, .04, 12, M.dark, 0, .21, 0));   // ash on the floor inside
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, h = H[(i + seed * 5) % 12] * (.85 + hash(i, seed) * .3);
    const b = box(.62, h, .32, burntStoneM, Math.cos(a) * .95, .2 + h / 2, Math.sin(a) * .95); b.rotation.y = -a + Math.PI / 2; g.add(b);
    const soot = box(.64, .14, .34, charM, Math.cos(a) * .95, .2 + h - .06, Math.sin(a) * .95); soot.rotation.y = b.rotation.y; g.add(soot);
  }
  for (let i = 0; i < 7; i++) { const a = 2 + i * .9 + seed, d = 1.5 + (i % 3) * .35, b = box(.34, .24, .3, burntStoneM, Math.cos(a) * d, .1, Math.sin(a) * d); b.rotation.set(i * .4, i * 1.1, i * .25); g.add(b); }
  // charred beams fallen in from the floors that burned, one leaning on the wall
  for (const [x, z, ry, rz, L] of [[.1, -.15, .4 + seed, .5, 1.7], [-.2, .25, 1.9 + seed, -.25, 1.4], [.55, .55, 2.6 + seed, .9, 1.5]]) { const b = box(L, .16, .16, charM, x, .5, z); b.rotation.set(0, ry, rz); g.add(b); }
  if (fire) for (const [x, z, k] of [[-.15, .05, 1.5], [.45, -.35, 1], [.5, .5, .75]]) {   // flames inside the ring, burning low on the rubble
    for (const [m, dx, dz, h, r] of [[M.flame, 0, 0, .9, .3], [M.flame, .16, .1, .55, .16], [M.flame, -.15, -.1, .65, .17], [M.flameMid, 0, 0, .62, .21], [M.flameCore, 0, 0, .34, .12]]) {
      const f = new THREE.Mesh(FLAME_GEO, m); f.scale.set(r * k, h * k, r * k); f.position.set(x + dx * k, .25 + h * k / 2, z + dz * k); f.renderOrder = m === M.flame ? 1 : m === M.flameMid ? 2 : 3; f.userData.noShadow = true; g.add(f);
    }
    fires.push([x, z, k]);
  }
  g.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = o.receiveShadow = true; });
  g.userData.fires = fires;
  return g;
}
// add a ruin's fires to the scenery's fires, in world space
function ruinFires(g) { for (const [x, z, k] of g.userData.fires) { const p = new THREE.Vector3(x, .25 + .5 * k, z); g.localToWorld(p); sceneFires.push({ x: p.x, y: p.y, z: p.z, k: .9 * k + .3, smoke: true }); } }
function placeRuin() {
  if (ruinMesh) scene.remove(ruinMesh);
  const [x, z] = WATCH_RUIN, g = makeRuin(0, true);
  g.position.set(x, hAt(x, z) - .1, z); scene.add(g); ruinMesh = g; g.updateMatrixWorld(true); ruinFires(g);
}
// the boss stages' scenery: the raiders' keep (a dark log palisade round its yard, a stone-and-timber tower with a hall beside it, a
// gate facing the town, red flags, the burned village's blackened ruins) and the Warlord's hold (curtain walls with merlons, four
// corner towers, a tall keep, a gatehouse, red flags)
let bossMesh = null;
const charM = mat('#2b231d');
// the enemy forts: the first layouts' shapes (Jack liked them), built in the detail of the town's own buildings (sharpened palisade
// logs, the lookout towers, masonry, timber framing, roofs with eaves, doors, windows, roof flags, merlons, cone-roofed towers) and
// then darkened, the town's blue turned the raiders' red (darkFort), so they never read as the player's
const darkMats = new Map();
function darkFort(g) {
  g.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || o.material.transparent || o.userData.keepLit) return;   // flames, tents and camp flags stay as they are
    let m = darkMats.get(o.material);
    if (!m) {
      m = o.material.clone(); m.onBeforeCompile = o.material.onBeforeCompile; if (o.material.customProgramCacheKey) m.customProgramCacheKey = o.material.customProgramCacheKey;
      const c = m.color, T = o.material.userData.team;
      // the town's colour turns the raiders' (dark), the raiders' own is darkened; both stay registered so a recolour reaches them
      if (T) teamMat(m, 'foe', T.side === 'town' ? '#6a1612' : srgbHex(new THREE.Color(T.def).multiplyScalar(.26)));
      else if (c) { if (c.b > c.r * 1.3 && c.b > c.g) teamMat(m, 'foe', '#6a1612'); else c.multiplyScalar(.26); }   // linear colour: .26 is about half as bright on screen
      darkMats.set(o.material, m);
    }
    o.material = m; o.castShadow = o.receiveShadow = true;
  });
  return g;
}
// a straight piece from (ax, az) to (bx, bz) in the group's frame: a box of width w and height h, its foot at y
function along(g, ax, az, bx, bz, w, h, m, y) { const L = Math.hypot(bx - ax, bz - az), o = box(L, h, w, m, (ax + bx) / 2, y + h / 2, (az + bz) / 2); o.rotation.y = -Math.atan2(bz - az, bx - ax); g.add(o); return o; }
function placeModel(g, type, tier, x, z, k = 1, ry = 0, mask = 0) { const m = makeModel(type, tier, true, mask, 0); m.scale.setScalar(k); m.rotation.y = ry; m.position.set(x, hAt(x, z), z); g.add(m); return m; }
// a raiders' tent (Jack: brownish, like cloth): two canvas sheets over a ridge pole, sagging between the poles and rippled, a woven
// texture with sewn seams and stains, the front flaps tied back on a dark inside, the inside filled dark
let tentM = null;
function tentMat() {
  if (tentM) return tentM;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 2) { x.fillStyle = `rgba(90,70,45,${.05 + (i % 4 ? .04 : 0)})`; x.fillRect(0, i, 128, 1); x.fillRect(i, 0, 1, 128); }   // the weave
  for (let n = 0; n < 2600; n++) { x.fillStyle = `rgba(${Math.random() < .5 ? '60,45,30' : '255,245,225'},${.05 + Math.random() * .08})`; x.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1); }
  for (const sx of [0, 42, 85]) { x.fillStyle = 'rgba(70,52,34,.45)'; x.fillRect(sx, 0, 2, 128); x.fillStyle = 'rgba(255,240,215,.2)'; x.fillRect(sx + 2, 0, 1, 128); }   // seams
  for (let n = 0; n < 5; n++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 14 + Math.random() * 16); g.addColorStop(0, 'rgba(60,40,22,.22)'); g.addColorStop(1, 'rgba(60,40,22,0)'); x.save(); x.translate(Math.random() * 128, 70 + Math.random() * 58); x.fillStyle = g; x.fillRect(-30, -30, 60, 60); x.restore(); }   // stains low down
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  tentM = new THREE.MeshStandardMaterial({ color: '#83643f', map: t, roughness: .95, side: THREE.DoubleSide });
  return tentM;
}
function campFlag(h = 2.4) {
  const g = new THREE.Group();
  g.add(cyl(.04, .05, h, 6, M.timber, 0, h / 2, 0)); g.add(cone(.05, .1, 6, M.iron, 0, h + .05, 0));
  g.add(flagBox(.6, .38, .03, raiderFlagM(), .31, h - .25, 0));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.keepLit = true; } });
  return g;
}
function raiderTent(seed = 0) {
  const g = new THREE.Group(), W = 1.8, D = 2.2, H = 1.4, m = tentMat();
  for (const s2 of [-1, 1]) {   // a sheet from the ridge down to the ground, sagging between the poles, rippled
    const geo = new THREE.PlaneGeometry(D, 1, 10, 6), P = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < P.count; i++) {
      const u = P.getX(i) / D + .5, v = P.getY(i) + .5;   // u along the ridge, v from the eave (0) to the ridge (1)
      const sag = Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * .09 + Math.sin(u * 19 + seed + s2) * .012 * (1 - v);
      const x = s2 * (W / 2) * (1 - v) - s2 * sag * Math.cos(Math.atan2(W / 2, H)), y = H * v - sag * .4, z = (u - .5) * D;
      P.setXYZ(i, x, y, z); uv.setXY(i, u * 1.6, v * 1.1);
    }
    geo.computeVertexNormals(); const sh = new THREE.Mesh(geo, m); g.add(sh);
  }
  // the ends: canvas at the back, the front open on a dark inside with the flaps tied back
  const end = (w, h, mm, z) => { const t = prism(.03, w, h, mm, 0, 0, z); t.rotation.y = Math.PI / 2; g.add(t); return t; };
  end(W * .97, H * .97, m, -D / 2 + .02); end(W * .5, H * .62, M.dark, D / 2 - .02);
  for (const s2 of [-1, 1]) { const f = prism(.025, W * .26, H * .82, m, s2 * W * .3, 0, D / 2 + .02); f.rotation.y = Math.PI / 2; f.rotation.z = -s2 * .08; g.add(f); }
  g.add(box(.05, .05, D + .3, M.timber, 0, H + .01, 0)); for (const z of [-D / 2 - .1, D / 2 + .1]) g.add(box(.05, H + .05, .05, M.timber, 0, H / 2, z));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(.04, .12, .04, M.timber, x * (W / 2 + .35), .06, z * (D / 2 - .2)));   // pegs
  { const inner = prism(D - .12, W * .8, H * .82, M.dark, 0, 0, 0); inner.rotation.y = Math.PI / 2; g.add(inner); }   // the inside filled dark, never see-through
  g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.userData.keepLit = true; } });
  return g;
}
function buildRaiderKeep(g) {
  const P = KEEP_POLY, [gx, gz] = KEEP_GATE, cx = 41, cz = 15.5, Y = (x, z) => hAt(x, z), GW = KEEP_GATE_W / 2;
  for (let i = 0; i < P.length; i++) {
    const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    let nx = -uz, nz = ux; if ((cx - ax) * nx + (cz - az) * nz < 0) { nx = -nx; nz = -nz; }   // inward
    for (let t = .2; t < L; t += .4) {   // sharpened logs, a little uneven, like the town's palisade
      const x = ax + ux * t, z = az + uz * t; if ((Math.abs(x - gx) < GW + .1 && Math.abs(z - gz) < .5) || Math.hypot(x - ax, z - az) < .9) continue;
      const h = 2.5 + hash(x * 3, z * 5) * .45, y = Y(x, z);
      g.add(cyl(.19, .21, h, 7, M.log, x, y + h / 2 - .4, z)); g.add(cone(.19, .34, 7, M.log, x, y + h - .23, z));
    }
    for (const hy of [.85, 1.75]) along(g, ax + nx * .26, az + nz * .26, bx + nx * .26, bz + nz * .26, .1, .12, M.timber, Y(ax, az) + hy);   // rails inside
    along(g, ax + nx * .75, az + nz * .75, bx + nx * .75, bz + nz * .75, .7, .07, M.wood, Y(ax, az) + 1.55);                                 // the wall-walk
    for (let t = 1; t < L - .5; t += 2) g.add(box(.12, 1.55, .12, M.timber, ax + ux * t + nx * 1, Y(ax, az) + .75, az + uz * t + nz * 1));
    if (i !== 4 && i !== 5) placeModel(g, 'tower', 1, ax + nx * .3, az + nz * .3, 1.2, -Math.atan2(cz - az, cx - ax) + Math.PI / 2);   // a lookout at each corner
  }
  // the gate: three cells wide (Jack), the town's timber gate stretched across them, flanked by two lookouts
  { const m = placeModel(g, 'gate', 1, gx, gz, 1, 0, 10); m.scale.set(KEEP_GATE_W / 2, 1.6, 1.4); }
  for (const sx of [-1, 1]) placeModel(g, 'tower', 1, gx + sx * (GW + 1.25), gz - .3, 1.15);
  // the great tower: masonry below, a jettied timber-framed storey, a shingled pyramid roof with eaves, windows, a door, a flag
  { const y = Y(cx, cz);
    g.add(box(5, 3, 5, M.stone, cx, y + 1.3, cz));
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(.7, 2.4, .7, M.stone2, cx + dx * 2.45, y + 1, cz + dz * 2.45));   // buttresses
    g.add(box(5.6, 2.5, 5.6, M.plaster, cx, y + 4.05, cz));
    for (let k = -2.7; k <= 2.71; k += 1.35) for (const s2 of [-1, 1]) { g.add(box(.16, 2.5, .16, M.timber, cx + k, y + 4.05, cz + s2 * 2.82)); g.add(box(.16, 2.5, .16, M.timber, cx + s2 * 2.82, y + 4.05, cz + k)); }
    for (const s2 of [-1, 1]) { g.add(box(5.8, .2, .2, M.timber, cx, y + 2.85, cz + s2 * 2.84)); g.add(box(.2, .2, 5.8, M.timber, cx + s2 * 2.84, y + 2.85, cz)); g.add(box(5.8, .2, .2, M.timber, cx, y + 5.25, cz + s2 * 2.84)); g.add(box(.2, .2, 5.8, M.timber, cx + s2 * 2.84, y + 5.25, cz)); }
    for (const k of [-1.35, 1.35]) { g.add(box(.5, .6, .06, M.glow, cx + k, y + 4.2, cz + 2.86)); g.add(box(.06, .6, .5, M.glow, cx + 2.86, y + 4.2, cz + k)); g.add(box(.06, .6, .5, M.glow, cx - 2.86, y + 4.2, cz + k)); }
    g.add(box(1.1, 1.8, .08, DOOR_M[2], cx, y + .9, cz + 2.53)); g.add(box(1.4, .25, .2, M.stone2, cx, y + 1.9, cz + 2.55));
    g.add(pyramid(4.6, 2.8, 1, M.thatch, y + 6.75, cx, cz)); roofFlag(g, cx, y + 8.1, cz, .5);
  }
  // the hall: log courses like the lumber shack's, a shingled gable roof, a door, a stone chimney
  { const hx = 34.2, hz = 17.4, y = Y(hx, hz), W = 6.4, D = 3.6;
    for (let c = 0; c < 6; c++) { const yy = y + .2 + c * .34;
      for (const s2 of [-1, 1]) { const a = cyl(.17, .17, W + .3, 7, M.log, hx, yy, hz + s2 * D / 2); a.rotation.z = Math.PI / 2; g.add(a); const b = cyl(.17, .17, D + .3, 7, M.log, hx + s2 * W / 2, yy + .17, hz); b.rotation.x = Math.PI / 2; g.add(b); } }
    g.add(box(W, 2.1, D, M.dark, hx, y + 1.1, hz));
    g.add(prism(W + .7, D + .9, 1.7, M.thatch, hx, y + 2.25, hz));
    g.add(box(.9, 1.4, .08, DOOR_M[1], hx + 1.2, y + .7, hz + D / 2 + .2));
    g.add(box(.7, 3.6, .7, M.stone2, hx - W / 2 + .6, y + 1.8, hz - .5));
  }
  // the yard: the town's weapon rack, campfire and siege stores
  placeModel(g, 'rack', 1, 46, 19); placeModel(g, 'campfire', 1, 46.5, 14.5); placeModel(g, 'stores', 1, 36.5, 12.5); placeModel(g, 'rack', 1, 48, 17);
  // the camps either side: a campfire, torches, a banner, a target range
  for (const c of KEEP_CAMPS) { if (c.fire) placeModel(g, 'campfire', 1, c.fire[0], c.fire[1], 1.2);
    for (const [t, x, z, ry] of c.props) { if (t === 'tent' || t === 'flag') { const m = t === 'tent' ? raiderTent(x + z) : campFlag(); m.rotation.y = ry; m.position.set(x, Y(x, z), z); g.add(m); } else placeModel(g, t, 1, x, z, 1, t === 'torch' ? 0 : ry); } }
}
function buildWarlordsHold(g) {
  const P = HOLD_POLY, [gx, gz] = HOLD_GATE, cx = gx, cz = 9.5, Y = (x, z) => hAt(x, z), y0 = Y(cx, cz);
  // the hold stands on its crag's flat top, but its walls sit on the crag's edge where the ground falls away outside: every wall piece,
  // tower and the keep reach down to the lowest ground under them (Jack saw the east side floating), their tops stay level
  const low = (x, z, r) => { let m = Y(x, z); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; for (const f of [.5, 1, 1.6]) m = Math.min(m, Y(x + Math.cos(a) * r * f, z + Math.sin(a) * r * f)); } return m - 1.2; };
  const TOP = y0 + 4;   // the curtain walls' top all round
  const merlons = (ax, az, bx, bz, y, nx, nz) => { const L = Math.hypot(bx - ax, bz - az); for (let t = .45; t < L - .3; t += .9) { const x = ax + (bx - ax) * t / L - nx * .4, z = az + (bz - az) * t / L - nz * .4; const m = box(.5, .55, .32, M.stone, x, y + .27, z); m.rotation.y = -Math.atan2(bz - az, bx - ax); g.add(m); } };
  // round towers: from the lowest ground under them up to a level top; a roofed tower has no merlons (they poked through its cone)
  const roundTower = (x, z, r, h, roof = true) => { const b = low(x, z, r + .3), top = Y(x, z) + h;
    g.add(cyl(r, r * 1.08, top - b, 14, M.stone, x, (top + b) / 2, z)); g.add(cyl(r + .18, r + .12, .45, 14, M.stone2, x, top - .1, z));
    if (!roof) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.add(box(.42, .5, .3, M.stone, x + Math.cos(a) * (r + .05), top + .35, z + Math.sin(a) * (r + .05))); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .4; g.add(box(.12, .55, .08, M.dark, x + Math.cos(a) * (r + .02), top - h * .45, z + Math.sin(a) * (r + .02))); }   // arrow slits
    if (roof) { g.add(coneRoof(r + .35, r * 1.6, 14, M.roofBlue, x, top + .12 + r * .8, z)); roofFlag(g, x, top + .12 + r * 1.6, z, .6); } };
  for (let i = 0; i < P.length; i++) {   // curtain walls of masonry with a wall-walk behind merlons, built in short pieces down to the ground
    const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    let nx = -uz, nz = ux; if ((cx - ax) * nx + (cz - az) * nz < 0) { nx = -nx; nz = -nz; }
    const gapT = (gx - ax) * ux + (gz - az) * uz, onGate = Math.abs((gx - ax) * nx + (gz - az) * nz) < .5 && gapT > 0 && gapT < L;
    const runs = onGate ? [[0, gapT - 2.3], [gapT + 2.3, L]] : [[0, L]];
    for (const [t0, t1] of runs) {
      const n = Math.max(1, Math.round((t1 - t0) / 1.5)), d = (t1 - t0) / n;
      for (let k = 0; k < n; k++) { const ta = t0 + k * d, tb = ta + d, mx = ax + ux * (ta + tb) / 2, mz = az + uz * (ta + tb) / 2, b = low(mx, mz, 1.8);
        along(g, ax + ux * ta, az + uz * ta, ax + ux * (tb + .02), az + uz * (tb + .02), 1.1, TOP - b, M.stone, b); }
      const sx = ax + ux * t0, sz = az + uz * t0, ex = ax + ux * t1, ez = az + uz * t1;
      merlons(sx, sz, ex, ez, TOP, -nx, -nz);
      along(g, sx + nx * .9, sz + nz * .9, ex + nx * .9, ez + nz * .9, .8, .1, DOOR_M[3], TOP - .5); }
    roundTower(ax, az, 1.9, 6.4);
  }
  // the gatehouse: two round towers either side of an arched passage, a portcullis
  for (const sx of [-1, 1]) roundTower(gx + sx * 2.4, gz, 1.5, 6.8);
  { const y = Y(gx, gz), b = low(gx, gz, 1.6); g.add(box(3.4, y + 4.3 - b, 2.6, M.stone, gx, (y + 4.3 + b) / 2, gz)); g.add(box(2.2, 2.9, 2.7, M.dark, gx, y + 1.15, gz + .02));
    for (let k = -.8; k <= .81; k += .4) g.add(box(.06, 2.6, .06, M.iron, gx + k, y + 1.2, gz + 1.32)); g.add(box(2, .08, .06, M.iron, gx, y + 1.9, gz + 1.32));
    merlons(gx - 1.7, gz + 1.25, gx + 1.7, gz + 1.25, y + 4.3, 0, -1); }
  // the keep: a tall masonry block, four corner turrets with cone roofs, two rows of windows, a framed door, hanging banners
  { const b = low(cx, cz, 3.8); g.add(box(7.4, y0 + 9.3 - b, 6.2, M.stone, cx, (y0 + 9.3 + b) / 2, cz)); }
  g.add(box(7.8, .4, 6.6, M.stone2, cx, y0 + 9.3, cz)); merlons(cx - 2.7, cz + 3.3, cx + 2.7, cz + 3.3, y0 + 9.5, 0, -1); merlons(cx - 2.7, cz - 3.3, cx + 2.7, cz - 3.3, y0 + 9.5, 0, 1);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const tx = cx + dx * 3.7, tz = cz + dz * 3.1, b = low(tx, tz, 1);
    g.add(cyl(.95, 1, y0 + 10.7 - b, 12, M.stone, tx, (y0 + 10.7 + b) / 2, tz)); g.add(coneRoof(1.25, 2.4, 12, M.roofBlue, tx, y0 + 11.9, tz)); roofFlag(g, tx, y0 + 13.1, tz, .6); }
  for (const r of [3.6, 6.4]) for (const k of [-2.2, 0, 2.2]) g.add(box(.55, .9, .06, M.glow, cx + k, y0 + r, cz + 3.12));
  g.add(box(1.3, 2.1, .1, DOOR_M[3], cx, y0 + 1.05, cz + 3.13)); for (const sx of [-1, 1]) g.add(box(.25, 2.4, .25, M.stone2, cx + sx * .8, y0 + 1.2, cz + 3.15)); g.add(box(1.85, .3, .3, M.stone2, cx, y0 + 2.4, cz + 3.15));
  for (const sx of [-1, 1]) { const b = box(1, 3, .05, M.flag, cx + sx * 2.2, y0 + 6.8, cz + 3.15); b.castShadow = true; g.add(b); }
  // inside the walls: the town's garrison and royal stables; two trebuchets on the keep's roof, aimed south (Jack)
  placeModel(g, 'barracks', 3, 31.5, 9.5, 1, Math.PI / 2); placeModel(g, 'stables', 3, 48.5, 9.5, 1, -Math.PI / 2);
  const trebM = [-1, 1].map(sx => { const m = placeModel(g, 'catapult', 3, cx + sx * 1.7, cz, .9); m.position.y = y0 + 9.5; return m; });
  for (const [x, z] of HOLD_TOWERS) placeModel(g, 'tower', 3, x, z);
  for (const c of HOLD_CAMPS) placeModel(g, c.banner ? 'banner' : 'campfire', 1, c.fire[0], c.fire[1]);
  holdTrebs = trebM.map((m, i) => { let turret = null, arm = null; m.traverse(o => { if (o.userData.turret) turret = o; if (o.userData.arm) arm = o; });
    return { m, turret, arm, x: cx + (i ? 1.7 : -1.7), z: cz, y: y0 + 9.5, cool: 3 + i * 1.5, fireT: 0 }; });
}
function placeBossScenery() {
  if (bossMesh) { scene.remove(bossMesh); bossMesh = null; }
  sceneFires = [];
  // cleared before the early return: Warlord's Hold's roof trebuchets kept lobbing stones, unseen, at troops near where they had stood
  // in the next game's stage (Jack's riders fell to rocks across Stonebridge's river on night 1)
  holdRiders = []; holdTrebs = [];
  if (MAP !== 'keep' && MAP !== 'hold') return;
  const g = new THREE.Group(), Y = (x, z) => hAt(x, z);
  if (MAP === 'keep') buildRaiderKeep(g); else buildWarlordsHold(g);
  darkFort(g);
  if (MAP === 'keep') KEEP_RUINS.forEach(([x, z, fire], i) => {   // the burned village: ruined watchtowers, burnt, some still burning
    const r = makeRuin(i + 1, !!fire); r.rotation.y = hash(x, z) * 6.3; r.position.set(x, Y(x, z) - .1, z); g.add(r); r.updateMatrixWorld(true); ruinFires(r);
  });
  // the camps' campfires and torches burn like the town's
  for (const c of bossCamps()) { if (c.fire && !c.banner) sceneFires.push({ x: c.fire[0], y: Y(c.fire[0], c.fire[1]) + .6, z: c.fire[1], k: 1.1 });
    for (const [t, x, z] of c.props || []) if (t === 'torch') sceneFires.push({ x, y: Y(x, z) + 2.25, z, k: 1, torch: true }); }
  // the camps' raiders are real raiders, dormant: resting or on patrol until troops come near, they're hurt, or the boss is out on the
  // last night (Jack); the patrols' corners shift a little each game, so they wander their own way round
  bossCamps().forEach((c, ci) => {
    const put = (k, t, x, z, D) => { spawnEnemy(k, { x, z }, 1, t); const e = enemies[enemies.length - 1]; e.x = e.rx = x; e.z = e.rz = z; e.dormant = Object.assign({ camp: ci, u: 0, s: x * 1.3 + z }, D); e.g.rotation.y = D.ry || 0; };
    for (const [k, t, x, z, ry] of c.rest) put(k, t, x, z, { ry: ry !== undefined ? ry : Math.atan2(c.fire[0] - x, c.fire[1] - z) });
    for (const [k, t, pts] of c.patrol) { const P = patrolRoute(pts); put(k, t, P[0][0], P[0][1], { pts: P, i: 1, wait: 0, walk: ENEMY[k].mounted ? 1.3 : .9 }); }
  });
  if (MAP === 'hold') {
    // two crew to each trebuchet on the keep's roof: on patrol round the roof, at their engine whenever it has a target
    const fig = (kind, tier, x, z, y) => { const p = makeRaider(kind, tier); p.g.scale.setScalar(UNIT_K); p.g.position.set(x, y, z); p.g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(p.g); return p; };
    const roof = [[36.1, 7.2], [41.9, 7.2], [41.9, 11.8], [36.1, 11.8]];
    holdRiders = holdTrebs.flatMap((T, i) => [0, 1].map(j => { const k = i * 2 + j, st = roof[k];
      return { p: fig(j ? 'spear' : 'sword', 3, st[0], st[1], T.y), y: T.y, pts: roof, i: (k + 1) % 4, wait: k * .7, walk: .7, pos: [...st], T, post: [T.x + (j ? .8 : -.8), T.z + (j ? .5 : -.65)], s: k * 1.7 }; }));
  }
  else if (MAP === 'keep') {
    // raiders inside the keep's yard (Jack): wandering round its campfire, and two on watch walking to and fro behind the gate. Scenery
    holdTrebs = [];
    const fig = (kind, tier, x, z) => { const p = makeRaider(kind, tier); p.g.scale.setScalar(UNIT_K); p.g.position.set(x, Y(x, z), z); p.g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(p.g); return p; };
    const walker = (kind, tier, pts, walk, i0) => { const st = pts[i0 % pts.length]; return { p: fig(kind, tier, st[0], st[1]), pts, i: (i0 + 1) % pts.length, wait: Math.random() * 2, walk, pos: [...st], s: Math.random() * 9 }; };
    const fire = [46.5, 14.5], round = (r, n, a0) => Array.from({ length: n }, (_, i) => { const a = a0 + i / n * 6.3; return [fire[0] + Math.cos(a) * r * (.85 + Math.random() * .3), fire[1] + Math.sin(a) * r * .8 * (.85 + Math.random() * .3)]; });
    holdRiders = [walker('spear', 2, round(1.9, 5, 0), .6, 0), walker('archer', 2, round(2.1, 4, 2), .55, 1), walker('sword', 3, round(1.7, 6, 4), .5, 3),
      walker('spear', 3, [[37.4, 21.6], [44.6, 21.6]], .8, 0), walker('xbow', 2, [[44.6, 22.2], [37.4, 22.2]], .75, 0)];
  }
  else { holdRiders = []; holdTrebs = []; }
  scene.add(g); bossMesh = g;
}
// a walker stepping round a loop of points (pts, next i), stopping 1.6 s at each corner; or, given a spot, walking there and staying
// a patrol loop laid over ground raiders can stand on: each corner moved onto the nearest standable spot, the legs between corners
// routed on the cell grid (a straight line between corners ran up the mountainside); the third value 0 marks a point passed without stopping
function patrolRoute(pts) {
  const ok = (x, z) => canStand(x, z, 2) && slopeAt(x, z) < 2.2;
  const snap = ([x, z]) => { if (ok(x, z)) return [x, z];
    for (let r = .5; r < 6; r += .5) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (ok(px, pz)) return [px, pz]; }
    return [x, z]; };
  const C = pts.map(snap), out = [];
  C.forEach((a, i) => { out.push(a); const b = C[(i + 1) % C.length];
    for (const q of findPath(a[0], a[1], b[0], b[1], 2) || []) if (Math.hypot(q.x - b[0], q.z - b[1]) > .3) out.push([q.x, q.z, 0]); });
  return out;
}
function patrolStep(R, dt) {
  let tx, tz;
  if (R.goTo) [tx, tz] = R.goTo; else { if (R.wait > 0) { R.wait -= dt; return false; } [tx, tz] = R.pts[R.i]; }
  const dx = tx - R.pos[0], dz = tz - R.pos[1], d = Math.hypot(dx, dz), st = R.walk * dt;
  if (d <= st) { R.pos[0] = tx; R.pos[1] = tz; if (!R.goTo) { R.wait = R.pts[R.i][2] === 0 ? 0 : 1.6; R.i = (R.i + 1) % R.pts.length; } return false; }
  R.pos[0] += dx / d * st; R.pos[1] += dz / d * st; R.head = Math.atan2(dx, dz); return true;
}
const turnToward = (o, want, k) => { let d = want - o.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); o.rotation.y += d * k; };
// the roof crew: on patrol, or at their trebuchet while it has a target; legs stride while they walk
let holdRiders = [], holdTrebs = [];
function animHoldRiders(t, dt) {
  for (const R of holdRiders) {
    const p = R.p; R.goTo = R.T && R.T.target ? R.post : null;
    const moving = patrolStep(R, dt);
    p.g.position.set(R.pos[0], R.T ? R.y : hAt(R.pos[0], R.pos[1]), R.pos[1]);
    if (moving) turnToward(p.g, R.head, .15); else if (R.goTo && R.T) turnToward(p.g, Math.atan2(R.T.x - R.pos[0], R.T.z - R.pos[1]), .15);
    const sw = moving ? .5 * Math.sin(t * 6.5 + R.s) : 0; p.legs[0].rotation.x = sw; p.legs[1].rotation.x = -sw;
    p.arms[0].rotation.x = R.goTo && !moving ? -1.2 : -sw * .6;
  }
}
// the roof trebuchets: turn onto the nearest of the town's troops within 22 m and lob a heavy stone (both crew at their posts),
// splashing 2.3 m round where it lands; the arm is let fly and winched back over the reload
function updateHoldTrebs(dt) {
  const [cock, thrown] = CATA_ARM[2];
  for (const T of holdTrebs) {
    T.target = nearestSoldier(T.x, T.z, 22);
    T.fireT = Math.max(0, T.fireT - dt);
    const ready = T.target && holdRiders.filter(R => R.T === T).every(R => Math.hypot(R.pos[0] - R.post[0], R.pos[1] - R.post[1]) < .2);
    if (T.target && T.turret) turnToward(T.turret, Math.atan2(T.target.x - T.x, T.target.z - T.z), Math.min(1, dt * 1.2));
    if (ready) T.cool -= dt;
    if (T.arm) T.arm.rotation.x = T.fireT > 0 ? lerp(thrown, cock, Math.pow(T.fireT / .35, 2)) : lerp(thrown, cock, sstep(0, 1, 1 - Math.max(0, T.cool) / 5.5));
    if (ready && T.cool <= 0) {
      T.cool = 5.5; T.fireT = .35; const v = T.target, to = new THREE.Vector3(v.x, walkY(v.x, v.z), v.z), from = new THREE.Vector3(T.x, T.y + 2.2, T.z);
      const m = fireArrow(from, to, () => { for (const o of villagers) if (o.soldier && o.g.visible) { const d = Math.hypot(o.x - to.x, o.z - to.z); if (d < 2.3) hurtSoldier(o, 52 * (1 - .5 * d / 2.3)); }
        blastFx(to.x, to.z, 3, 2.3); shake(.11, to); }, 3 + from.distanceTo(to) * .25, 'stone');
      m.scale.setScalar(CATA_SHOT[2]);
    }
  }
}
// a dormant camp raider: resting by the fire (shifting a little) or on patrol; wakes, with its whole camp, when troops come within
// 7 m, when it's hurt, or when the boss is out on the last night (Jack: they join him). Returns true while still dormant
let campsJoined = false;
function dormantStep(e, dt) {
  const D = e.dormant, last = PH.kind === 'night' && PH.wave >= NIGHTS && enemies.some(o => !o.dead && ENEMY[o.kind].boss);
  if (e.hp < e.max || nearestSoldier(e.x, e.z, 7) || last) {
    for (const o of enemies) if (o.dormant && o.dormant.camp === D.camp) { o.dormant = null; o.retarget = 0; o.target = null;
      if (!canStand(o.x, o.z, 2)) { const [x, z] = patrolRoute([[o.x, o.z]])[0]; o.x = x; o.z = z; } }
    if (last && !campsJoined) { campsJoined = true; log(`<b>Raider camps</b> join the ${MAP === 'keep' ? 'Chief' : 'Warlord'}`, 'bad'); }
    return false;
  }
  if (!D.pts) { e.g.rotation.y = D.ry + .14 * Math.sin((D.u += dt) * .23 + D.s); return true; }
  if (!D.pos) D.pos = [e.x, e.z];
  const moving = patrolStep(D, dt); e.x = D.pos[0]; e.z = D.pos[1]; e.walking = moving; if (moving) turnToward(e.g, D.head, .15);
  return true;
}
// paths laid along polylines, cell by cell, diagonal steps joined so they stay connected
function layRoads(list) {
  for (const pts of list) {
    let prev = -1;
    for (let i = 0; i < pts.length - 1; i++) for (let t = 0; t <= 1; t += .05) {
      const x = clamp(lerp(pts[i][0], pts[i + 1][0], t), .5, SIZE - .5), z = clamp(lerp(pts[i][1], pts[i + 1][1], t), .5, SIZE - .5), n = cellAt(x, z);
      if (n === prev) continue;
      if (prev >= 0 && n % N !== prev % N && ((n / N) | 0) !== ((prev / N) | 0)) { const m = ((prev / N) | 0) * N + n % N; if (!occB[m] && !bridgeCell[m]) road[m] = 1; }   // a diagonal step: join it
      if (!occB[n] && !bridgeCell[n]) road[n] = 1; prev = n;
    }
  }
}
// the old market cross: three stone steps, a shaft and a cross head
function makeMarketCross() {
  const g = new THREE.Group();
  g.add(box(1.5, .18, 1.5, M.stone2, 0, .09, 0)); g.add(box(1.1, .18, 1.1, M.plainStone, 0, .27, 0)); g.add(box(.72, .2, .72, M.stone2, 0, .46, 0));
  g.add(box(.2, 1.5, .2, M.plainStone, 0, 1.31, 0)); g.add(box(.72, .17, .17, M.plainStone, 0, 1.7, 0)); g.add(box(.26, .1, .26, M.stone2, 0, .6, 0));
  g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return g;
}
// back to where this game was chosen: the campaign for a campaign map, else the map picker
function showStart() { if (CAMP_MAPS[MAP]) { showMapPick(); $('#mapPick').hidden = true; openCampaign(CAMP_MAPS[MAP].stop); } else showMapPick(); }
function showMapPick() {
  $('#tipPill').hidden = true; tipT = 0;   // a tip still up when the game was left stayed over the menus
  hushSfx();
  if (paused && !$('#pausedTag').hidden) setPaused(false);
  clearSummary(); paused = true; hideGhost(); $('#mapPick').hidden = false;
  if (!showcaseBuilt) buildShowcase();
  markMapStars(); syncResumeBtn();
}
function markMapStars() { document.querySelectorAll('.mapBtn').forEach(b => { b.classList.toggle('last', b.dataset.map === MAP); const st = b.querySelector('.stars'); if (st) st.remove(); b.insertAdjacentHTML('beforeend', starsHTML(STARS[b.dataset.map] || 0)); }); }
// ---------- campaign: an overview map with twelve stops, each bringing in a few new buildings (only Greenvale, stop 1, is playable so far)
const CAMPAIGN = [
  { name: 'Greenvale', sub: 'Tutorial', map: 'vale', at: [140, 820], adds: ['house', 'farm', 'lodge', 'quarry', 'tower', 'road', 'flowers', 'torch'] },
  { name: 'Stonebridge', map: 'bridge', at: [250, 700], land: 'A bridge town', adds: ['barracks', 'wall', 'gate', 'rack'] },
  { name: 'Market Cross', map: 'cross', at: [420, 785], land: 'Old crossroads · little stone', adds: ['market', 'statue'] },
  { name: 'Watchhill', map: 'watch', at: [580, 735], land: 'Dry hills', adds: ['ballista', 'campfire'] },
  { name: 'Dunewell', map: 'dune', at: [668, 590], land: 'Desert · few trees', adds: ['forester', 'well'] },
  { name: 'Riverbend', map: 'bend', at: [345, 600], land: 'Between two rivers', adds: ['crossbow', 'butts'] },
  { name: 'Ironwood', map: 'crag', at: [160, 500], land: 'Deep woods · no stone', adds: ['mine', 'banner'] },
  { name: 'Siegeford', map: 'ford', at: [320, 405], land: 'Highlands · little wood', adds: ['catapult', 'stores'] },
  { name: 'Meadowmere', map: 'mere', at: [548, 470], land: 'Sodden ground · poor fields', adds: ['farmhouse'] },
  { name: 'Horsefields', map: 'plains', at: [668, 340], land: 'Open plains', adds: ['stables'] },
  { name: 'Raider Keep', sub: 'Boss', map: 'keep', at: [475, 225], boss: true, adds: [] },
  { name: "Warlord's Hold", sub: 'Boss', map: 'hold', at: [290, 115], boss: true, adds: [] },
];
// the lands of the overview, each a soft ellipse (centre, radii) that fades into the next; weights 0–1 by how deep inside a spot is
const CAMP_LAND = {
  woods:  { c: [160, 505], r: [125, 118], fill: '#33502c' },
  dry:    { c: [655, 520], r: [165, 255], fill: '#8f8a50' },   // dry grass round the desert, out to the plains and Watchhill
  desert: { c: [668, 585], r: [105, 92], fill: '#d1b97e' },
  plains: { c: [668, 345], r: [125, 85], fill: '#87944e' },
  high:   { c: [315, 395], r: [145, 88], fill: '#7c7458' },    // rocky highlands rising into the northern hills
  marsh:  { c: [520, 455], r: [118, 70], fill: '#45695a' },
};
const CAMP_CY = 1.5;   // the overview is drawn half again as tall as its 800 × 900 plan (Jack wanted it longer; each stage's detail is in its preview)
const landW = (k, x, y, a = .55, b = 1.15) => { const L = CAMP_LAND[k], d = Math.hypot((x - L.c[0]) / L.r[0], (y - L.c[1]) / L.r[1]); return 1 - sstep(a, b, d); };
// the river (cubic segments): down from the north-east mountains, split round Riverbend, out at the west edge
const CAMP_RIVER = [
  [[718, 133], [690, 200, 655, 300, 616, 350], [590, 385, 565, 396, 540, 408], [505, 430, 480, 462, 451, 478], [410, 498, 365, 506, 335, 516], [300, 532, 288, 570, 284, 610], [280, 650, 252, 688, 210, 705], [160, 722, 110, 738, 32, 764]],
  [[451, 478], [458, 520, 466, 560, 448, 592], [428, 625, 398, 642, 360, 655], [322, 668, 292, 676, 262, 686]],
];
// ---------- the campaign as a carousel (Jack's sketch; it replaced a scrolling road, which replaced the overview map): the stages are
// cards in a 3D deck, the one in front large, the others angled away behind it on both sides; swipe, tap a side card, the arrows, the
// arrow keys or the mouse wheel to turn it. Under it a row of twelve markers (banner = won, flag = where you are, padlock = ahead, red
// = boss; tap one to jump there), then the front stage's details and Play. Behind it the title's scene keeps running.
const LOCK_SVG = '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5 V8 a4 4 0 0 1 8 0 V10.5"/></svg>';
const DOT_BAN = '<svg viewBox="0 0 24 24"><path d="M7 22 V3" stroke="#d9c79a" stroke-width="2" fill="none"/><path d="M7.5 4 H18 V15 L12.7 12.6 L7.5 15 Z" fill="#3a6fd0" stroke="#163a7a" stroke-width="1.2"/></svg>';
const DOT_FLAG = '<svg viewBox="0 0 24 24"><path d="M6 22 V3" stroke="#f2d27a" stroke-width="2" fill="none"/><path d="M6.5 4 C10 2.5 13 6 18.5 4.5 V12.5 C13 14 10 10.5 6.5 12 Z" fill="#3a6fd0" stroke="#f2d27a" stroke-width="1.2"/></svg>';
let cSel = 0, cCur = 0, cDrag = 0;
function campState() { const won = CAMPAIGN.map(c => !!(c.map && STARS[c.map] > 0)); let cur = won.indexOf(false); if (cur < 0) cur = CAMPAIGN.length - 1; return { won, cur }; }
function buildDeck() {
  const { won, cur } = campState(); cCur = cur;
  $('#cCards').innerHTML = CAMPAIGN.map((c, i) => { const st = won[i] ? 'won' : i === cur ? 'cur' : i > cur ? 'locked' : '';
    const mark = i > cur ? `<i class="jLock">${LOCK_SVG}</i>` : '';
    return `<button class="cCard ${st}${c.boss ? ' boss' : ''}" data-i="${i}" tabindex="-1"><span class="cPic" style="background-image:url(maps/thumb/${c.map}.jpg)"></span>
      <span class="cName"><small>${c.boss ? 'Boss · ' : ''}Stage ${i + 1}${won[i] ? ' ' + starsHTML(STARS[c.map] || 0) : ''}${CROWNS[c.map] ? `<span class="crown">${CROWN_ICO}</span>` : ''}</small><b>${c.name}</b></span>${mark}</button>`; }).join('');
  $('#cDots').innerHTML = CAMPAIGN.map((c, i) => `<button class="cDot${c.boss ? ' boss' : ''}${won[i] ? ' won' : i === cur ? ' cur' : ''}" data-i="${i}" aria-label="Stage ${i + 1}"></button>`).join('');
}
// place every card for the front index cSel plus the live drag (in cards); the card's size follows the room the deck has
function layoutDeck(anim = true) {
  const deck = $('#campMap'), W = Math.min(deck.clientWidth * (deck.clientWidth > deck.clientHeight * 1.2 ? .48 : .62), deck.clientHeight - 16, 480), f = cSel + cDrag;
  deck.style.setProperty('--cw', Math.max(120, W) + 'px');
  document.querySelectorAll('#cCards .cCard').forEach(el => {
    const d = +el.dataset.i - f, a = Math.abs(d), sg = Math.sign(d), x = sg * (Math.min(a, 1) * .62 + Math.max(0, a - 1) * .2) * W;
    el.style.transition = anim ? '' : 'none';
    el.style.transform = `translateX(${x.toFixed(1)}px) translateZ(${(-Math.min(a, 4) * 70).toFixed(0)}px) rotateY(${(-Math.max(-1, Math.min(1, d)) * 34).toFixed(1)}deg) scale(${(1 - Math.min(a, 3) * .07).toFixed(3)})`;
    el.style.zIndex = 100 - Math.round(a * 10); el.style.opacity = a > 3.4 ? 0 : Math.max(0, 1 - Math.max(0, a - 1.3) * .45).toFixed(2); el.style.pointerEvents = a > 3.4 ? 'none' : 'auto';
    el.style.setProperty('--dim', Math.min(a, 1.5) * .4);
    el.classList.toggle('front', a < .5);
  });
  // no arrow past the ends: none to the left on Stage 1, none to the right on Stage 12 (Jack); hidden, not removed, so the deck keeps its place
  $('#cPrev').style.visibility = cSel <= 0 ? 'hidden' : ''; $('#cNext').style.visibility = cSel >= CAMPAIGN.length - 1 ? 'hidden' : '';
}
function selectStage(i, quiet) {
  i = Math.max(0, Math.min(CAMPAIGN.length - 1, i)); if (!quiet && i !== cSel) sfx('click'); cSel = i; cDrag = 0; layoutDeck(); openStage(i);
}
function openStage(i) {
  const c = CAMPAIGN[i]; cSel = i;
  document.querySelectorAll('#cDots .cDot').forEach(m => m.classList.toggle('sel', +m.dataset.i === i));
  $('#stName').textContent = `Stage ${i + 1} · ${c.name}`;
  $('#stSub').textContent = [c.sub, c.land].filter(Boolean).join(' · ');
  $('#stNew').innerHTML = c.adds.map(t => `<span>${TOOL_ICON[t] || ''}<b>${t === 'road' ? 'Path' : DEF[t].name}</b></span>`).join('');
  $('#stStars').innerHTML = starsHTML(c.map ? STARS[c.map] || 0 : 0) + (c.map && CROWNS[c.map] ? `<span class="crown" title="Won on hard">${CROWN_ICO}</span>` : c.map && (STARS[c.map] || 0) >= 3 ? `<span class="crown empty" title="Win on hard">${CROWN_ICO}</span>` : '');
  // hard mode: open once the stage has 3 stars (raiders a tier up, 30% less gold and wood to start; a win earns the crown)
  // a Difficulty switch, Normal | Hard (Jack): Hard shows a padlock until the stage has 3 stars, and a tap on it then says so
  const canHard = !!c.map && (STARS[c.map] || 0) >= 3; if (!canHard) hardSel = false; $('#stDiff').hidden = !c.map; syncDiff(canHard);
  // how many waves, how long to prepare before the first, and the quickest win so far
  const R = c.map && MAP_RULES[c.map];
  $('#stInfo').innerHTML = R ? `<span>Day 1: <b>${Math.round(R.day[0] / 60)}</b> min${Math.round(R.day[0] / 60) === 1 ? '' : 's'}</span><span>Waves: <b>${R.waves.length}</b></span>${BEST[c.map] ? `<span>Best: <b>${fmt(BEST[c.map])}</b></span>` : ''}` : '';
  requestAnimationFrame(() => { const slot = $('#cDetSlot'), det = slot.firstElementChild, chips = [...det.querySelectorAll('.stNew span')];
    const rows = new Set(chips.map(e => e.offsetTop)).size, ch = chips[0] ? chips[0].offsetHeight + 7 : 0;
    const full = det.offsetHeight + (rows === 1 ? ch : 0);
    if (getComputedStyle($('.cMain')).flexDirection === 'row') { slot.style.minHeight = ''; return; }
    if (full > (slot._h || 0) || slot._w !== innerWidth) { slot._h = Math.max(full, slot._w === innerWidth ? slot._h || 0 : 0); slot._w = innerWidth; slot.style.minHeight = slot._h + 'px'; } });
  $('#stPlay').innerHTML = c.map ? '<button class="primary" id="campPlay">Play</button>' : '';
  if (c.map) $('#campPlay').addEventListener('click', () => {
    sfx('click');
    MAP = c.map; $('#mapPick').hidden = true; hardOn = hardSel && (STARS[c.map] || 0) >= 3;
    if (stagePicks(MAP)) { $('#campaign').hidden = true; showLoadPick(MAP); return; }   // more decor than fits: choose four first
    $('#campaign').hidden = true; paused = false; startGame();
  });
}
var hardSel = false;
function syncDiff(can) {
  const h = $('#dHard'); h.classList.toggle('locked', !can); h.innerHTML = can ? 'Hard' : LOCK_ICO;   // locked: only the padlock (Jack)
  h.classList.toggle('on', hardSel); $('#dNormal').classList.toggle('on', !hardSel);
}
const stageCanHard = () => { const c = CAMPAIGN[cSel]; return !!(c && c.map) && (STARS[c.map] || 0) >= 3; };
$('#dNormal').addEventListener('click', () => { hardSel = false; syncDiff(stageCanHard()); });
$('#dHard').addEventListener('click', () => {
  if (!stageCanHard()) { sfx('nope'); const p = $('#diffLock'); p.hidden = true; void p.offsetWidth; p.hidden = false; clearTimeout(p._t); p._t = setTimeout(() => p.hidden = true, 1800); return; }
  hardSel = true; syncDiff(true);
});
// turning the deck: drag (a tap without a drag on a side card brings it forward), arrows, keys, wheel, the markers
{ const deck = $('#campMap'); let x0 = null, moved = 0, wheelT = 0, wheelAcc = 0;
  deck.addEventListener('pointerdown', e => { if (e.target.closest('.cArrow')) return; x0 = e.clientX; moved = 0; deck.setPointerCapture(e.pointerId); });
  deck.addEventListener('pointermove', e => { if (x0 === null) return; const dx = e.clientX - x0; moved = Math.max(moved, Math.abs(dx));
    if (moved > 6) { cDrag = Math.max(-cSel - .4, Math.min(CAMPAIGN.length - 1 - cSel + .4, -dx / (parseFloat(deck.style.getPropertyValue('--cw')) * .62))); layoutDeck(false); } });
  const up = e => { if (x0 === null) return; x0 = null;
    if (moved > 6) selectStage(Math.round(cSel + cDrag));
    else { const card = document.elementFromPoint(e.clientX, e.clientY)?.closest('.cCard'); if (card) selectStage(+card.dataset.i); } };
  deck.addEventListener('pointerup', up); deck.addEventListener('pointercancel', () => { x0 = null; cDrag = 0; layoutDeck(); });
  deck.addEventListener('wheel', e => { e.preventDefault(); wheelAcc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const now = performance.now(); if (Math.abs(wheelAcc) > 40 && now - wheelT > 220) { selectStage(cSel + Math.sign(wheelAcc)); wheelAcc = 0; wheelT = now; } }, { passive: false });
  $('#cPrev').addEventListener('pointerdown', e => { e.preventDefault(); selectStage(cSel - 1); }); $('#cNext').addEventListener('pointerdown', e => { e.preventDefault(); selectStage(cSel + 1); });
  $('#cDots').addEventListener('pointerdown', e => { const d = e.target.closest('.cDot'); if (d) { e.preventDefault(); selectStage(+d.dataset.i); } });
  addEventListener('keydown', e => { if ($('#campaign').hidden) return; if (e.key === 'ArrowLeft') selectStage(cSel - 1); else if (e.key === 'ArrowRight') selectStage(cSel + 1); else if (e.key === 'Enter') $('#campPlay')?.click(); });
  addEventListener('resize', () => { if (!$('#campaign').hidden) layoutDeck(false); });
  if (window.ResizeObserver) new ResizeObserver(() => { if (!$('#campaign').hidden) layoutDeck(false); }).observe(deck);
}
const STAGE_PIC = { 0: { src: 'maps/vale.jpg' }, 1: { src: 'maps/bridge.jpg' }, 2: { src: 'maps/cross.jpg' }, 3: { src: 'maps/watch.jpg' }, 4: { src: 'maps/dune.jpg' }, 5: { src: 'maps/bend.jpg' }, 6: { src: 'maps/crag.jpg' }, 7: { src: 'maps/ford.jpg' }, 8: { src: 'maps/mere.jpg' }, 9: { src: 'maps/plains.jpg' }, 10: { src: 'maps/keep.jpg' }, 11: { src: 'maps/hold.jpg' } };
markMapStars();
function openCampaign(i) {
  $('#tipPill').hidden = true; tipT = 0;
  hushSfx();
  buildDeck(); $('#mapPick').hidden = true; $('#campaign').hidden = false;
  { const st = CAMPAIGN.filter(c => c.map), won = st.filter(c => STARS[c.map] > 0).length, stars = starTotal(), max = st.length * 3;
    $('#campStars').innerHTML = `<span><b>${won}</b> / ${st.length} stages</span><span class="sep">·</span><span><b>★ ${stars}</b> / ${max}</span>`;
    $('#campUpN').hidden = !upLeft(); $('#campUpN').textContent = '★' + upLeft(); }
  // opens on the given stage (Restart / Play again) or where the player is
  cSel = i !== undefined ? i : cCur; cDrag = 0; layoutDeck(false); openStage(cSel);
}
$('#campBtn').addEventListener('click', () => { sfx('click'); openCampaign(); });
// ---------- Colours (Jack): the town's and the raiders' colours, five each, in the title's Settings (gear); a colour one side
// has is greyed out for the other; a tap recolours at once (the title's town shows it) and is kept ('mtd-colours')
const COL_NAME = { blue: 'Blue', red: 'Red', green: 'Green', purple: 'Purple', black: 'Black' };
function renderColours() {
  for (const el of document.querySelectorAll('.colSw[data-side]')) {
    const side = el.dataset.side, other = side === 'town' ? TEAM.foe : TEAM.town;
    el.innerHTML = TEAM_NAMES.map(n => `<button class="sw${TEAM[side] === n ? ' on' : ''}${other === n ? ' taken' : ''}" data-side="${side}" data-c="${n}" aria-label="${COL_NAME[n]}" style="--c:${TEAM_PAL[n]}"></button>`).join('');
  }
}
// Settings (Jack picked a gear in the title's corner over a Colours button under Campaign): the colours and the two loudness sliders
$('#setBtn').addEventListener('click', () => { sfx('click'); renderColours(); syncAudioToggles(); $('#colCard').hidden = false; });
$('#colDone').addEventListener('click', () => { $('#colCard').hidden = true; });
// the same swatches in the Settings card and the pause card
document.addEventListener('click', e => {
  const b = e.target.closest('.colSw .sw'); if (!b) return;
  const side = b.dataset.side, c = b.dataset.c, other = side === 'town' ? 'foe' : 'town';
  if (TEAM[other] === c) { sfx('nope'); return; }
  sfx('click'); TEAM = { ...TEAM, [side]: c }; applyTeams(); renderColours();
  try { localStorage.setItem('mtd-colours', JSON.stringify(TEAM)); } catch (e) {}
});
renderColours();
$('#saveResume').addEventListener('click', () => { sfx('click'); resumeGame(); });
$('#campBack').addEventListener('click', () => { sfx('click'); $('#campaign').hidden = true; $('#mapPick').hidden = false; });
document.querySelectorAll('.mapBtn').forEach(b => b.addEventListener('click', () => {
  sfx('click'); MAP = b.dataset.map; hardOn = false; try { localStorage.setItem('mtd-map', MAP); } catch (e) {}
  $('#mapPick').hidden = true; showLoadPick();          // then the town's buildings, then the game
}));
addEventListener('keydown', e => {
  if (/^(w|a|s|d|q|e|arrow)/i.test(e.key)) { heldKeys.add(e.key.toLowerCase()); return; }
  const L = LOADOUT, map = { v: 'select', V: 'select', 1: 'house', 2: L.food, 3: L.wood, 4: L.stone, 5: L.ranged, 6: 'wall', 7: 'gate', 8: L.barracks, 9: 'market', 0: L.siege, r: 'road', R: 'road' };
  if (map[e.key] && (map[e.key] === 'select' || Object.values(CATS).some(c => c.includes(map[e.key])))) setTool(map[e.key]);
  else if (e.key === 'g' || e.key === 'G') $('#gridBtn').click();
  else if (e.key === 'Escape') { deselect(); setTool('select'); }
});
function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
// and if the browser scrolls the document anyway (iOS after a rotation or a toolbar change), put it straight back
const keepTop = () => { if (scrollX || scrollY || document.documentElement.scrollTop || document.body.scrollTop) { scrollTo(0, 0); document.documentElement.scrollTop = document.body.scrollTop = 0; } };
// which side the camera island is on with the phone turned (90: turned left, the island on the left; 270 / -90: on the right), so the
// landscape layout keeps that side's column clear of it and lets the other column sit near the edge (Jack)
function islandSide() {
  const a = screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle : (window.orientation || 0);
  document.body.classList.toggle('islandL', a === 90); document.body.classList.toggle('islandR', a === 270 || a === -90);
}
islandSide(); addEventListener('resize', islandSide); addEventListener('orientationchange', () => setTimeout(islandSide, 100));
if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', islandSide);
addEventListener('scroll', keepTop, { passive: true }); addEventListener('orientationchange', () => { keepTop(); setTimeout(keepTop, 300); setTimeout(() => { keepTop(); resize(); }, 700); });
addEventListener('resize', () => setTimeout(keepTop, 50)); if (window.visualViewport) visualViewport.addEventListener('resize', () => setTimeout(keepTop, 50));
const heldKeys = new Set();
addEventListener('keyup', e => heldKeys.delete(e.key.toLowerCase()));
addEventListener('blur', () => heldKeys.clear());
function keyCamera(dt) {
  if (!heldKeys.size) return;
  const k = 520 * dt, has = (...ks) => ks.some(x => heldKeys.has(x));
  if (has('w', 'arrowup')) pan(0, k); if (has('s', 'arrowdown')) pan(0, -k);
  if (has('a', 'arrowleft')) pan(k, 0); if (has('d', 'arrowright')) pan(-k, 0);
  if (has('q')) yaw += 1.6 * dt; if (has('e')) yaw -= 1.6 * dt;
  updateCam();
}

// ---------- design gallery (Admin → Gallery, or open with ?gallery): every building at every tier and every character, on a lawn ----------
// its own scene, lit like midday; the game is paused underneath and comes back untouched on Back
var galleryOn = false;
let galEnd = 0, gScene = null, gSaved = null, gDoors = 0, gDoorK = 0, gWalk = false;
const gItems = [], gPeople = [], gRows = [], GAL_X = [10, 22, 34];     // gRows: { title, z, depth } for tools/render
function galLabel(text, color, x, z, big, k = 1) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex(text, color), transparent: true, depthWrite: false, toneMapped: false }));
  sp.scale.set((big ? 4.4 : 3.4) * k, (big ? 1.1 : .85) * k, 1); sp.position.set(x, big ? 1.4 : .55, z); sp.renderOrder = 5; gScene.add(sp);
}
// the living parts drawn in place for the gallery: a full-grown grove, the yard's animals
function galPreview(g, type, tier) {
  if (type === 'forester') GROVE_AT.slice(0, DEF.forester.grove[tier - 1]).forEach(([x, z], i) => { const t = makeGroveTree(); t.position.set(x, .07, z); t.scale.setScalar((i % 3 === 2 ? .5 : 1) * GROVE_K); g.add(t); });
  if (type === 'farmhouse') HERD[tier].forEach((kind, i) => { const a = makeAnimal(kind); a.position.set(-1.1 + (i % 3) * .9, .07, .1 + Math.floor(i / 3) * .8); a.rotation.y = i * 1.3; g.add(a); });
}
function buildGallery() {
  gScene = new THREE.Scene(); gScene.background = SKY_DAY.clone();
  gScene.add(new THREE.HemisphereLight('#d6e6ff', '#4a3d28', .7));
  const s = new THREE.DirectionalLight('#ffe7c4', 1.05);
  s.position.set(-12, 46, 8); s.target.position.set(24, 0, 44); s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
  Object.assign(s.shadow.camera, { left: -62, right: 62, top: 62, bottom: -62, near: 1, far: 170 }); s.shadow.bias = -.0006;
  gScene.add(s, s.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220).rotateX(-Math.PI / 2), mat('#6f8a45')); ground.position.set(24, 0, 44); ground.receiveShadow = true; gScene.add(ground);
  let z = 3;
  const row = (title, depth, fill) => { const zc = z + depth / 2; galLabel(title, '#f2c95e', 1.5, zc, true); fill(zc, depth); gRows.push({ title, z: zc, depth }); z += depth + 3.4; };
  const add = (g, x, zc, turns) => { g.position.set(x, 0, zc); g.userData.turn = 0; gScene.add(g); gItems.push({ g, turns }); return g; };
  for (const type of ['castle', 'house', 'lodge', 'forester', 'quarry', 'mine', 'farm', 'farmhouse', 'market', 'tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'stables']) {
    const T = DEF[type], d = (T.dz || T.size) * CELL;
    row(T.name, d, zc => T.tiers.forEach((nm, i) => { const g = add(makeModel(type, i + 1, true, 0, 0), GAL_X[i], zc, true); galPreview(g, type, i + 1); galLabel(nm, '#fff', GAL_X[i], zc + d / 2 + 1.1); }));
  }
  // walls run into a gate from both sides: E–W wall, gate, wall
  row('Walls · gate', 2, zc => DEF.gate.tiers.forEach((nm, i) => {
    add(makeModel('wall', i + 1, true, 2, 0), GAL_X[i] - 2, zc); add(makeModel('gate', i + 1, true, 10, 0), GAL_X[i], zc); add(makeModel('wall', i + 1, true, 8, 0), GAL_X[i] + 2, zc);
    galLabel(nm, '#fff', GAL_X[i], zc + 2.1);
  }));
  row('Decor', 2, zc => ['well', 'torch', 'flowers', 'statue', 'banner', 'campfire', 'rack', 'butts', 'stores'].forEach((t, i) => { add(makeModel(t, 1, true, 0, 0), 4 + i * 4.6, zc, true); galLabel(DEF[t].name, '#fff', 4 + i * 4.6, zc + 2.1); }));
  const people = (title, list) => (row(title, 1.2, zc => list.forEach((P, i) => {
    const x = 6 + i * 3.3, p = P.raider ? makeRaider(P.raider, P.rt) : P.guard ? makePerson({ tool: P.xbow ? 'crossbow' : 'bow' }) : makePerson({});
    if (P.kit) soldierKit(p, P.kit, P.cav);
    else if (P.guard) armour(p, P.guard);
    else if (!P.raider) { p.plainHat = !P.tool; p.outfitTier = P.tier || 3; addLoads(p); giveTool(p, P.tool || null); dress(p, P.tool || null); if (P.carry === 'log') p.carryLog.visible = true; if (P.carry === 'stone') p.carryStone.visible = true; }
    p.g.position.set(x, 0, zc); p.g.rotation.y = .5; gScene.add(p.g); Object.assign(p, P, { seed: i * .7 }); gPeople.push(p);
    galLabel(P.name, P.raider ? '#ff9a8a' : '#fff', x, zc + 1.2, false, .75);
  })), gRows[gRows.length - 1].n = list.length);     // how many people: tools/render takes two shots of a long row
  people('Villagers', [{ name: 'Villager' }, { name: 'Log carrier', tool: 'axe', carry: 'log' }, { name: 'Stone carrier', tool: 'pick', carry: 'stone' }, { name: 'Builder', tool: 'hammer', work: 1 }]);
  // workers by their workplace's tier: own clothes and the tool, the work tunic and a cap, the full outfit
  people('Workers', [['Farmer', 'hoe'], ['Herder', 'pail'], ['Lumberjack', 'axe'], ['Mason', 'pick']].flatMap(([n, t]) => [1, 2, 3].map(k => ({ name: `${n} ${k}`, tool: t, work: 1, tier: k }))));
  // defenders by tier: the same armour for every kind, only the weapon differs
  people('Soldiers', [{ name: 'Archer 1', guard: 1 }, { name: 'Archer 2', guard: 2 }, { name: 'Archer 3', guard: 3 },
    { name: 'Crossbow 1', guard: 1, xbow: 1 }, { name: 'Crossbow 2', guard: 2, xbow: 1 }, { name: 'Crossbow 3', guard: 3, xbow: 1 }, { name: 'Militia', kit: 1 }, { name: 'Guard', kit: 2 }, { name: 'Man-at-arms', kit: 3 },
    { name: 'Rider', kit: 1, cav: 1 }, { name: 'Lancer', kit: 2, cav: 1 }, { name: 'Knight', kit: 3, cav: 1 }]);
  // raiders by tier: the same look for every kind (plain red shirt; red gambeson and iron helm; mail, red surcoat, great helm)
  for (const rt of [1, 2, 3]) people(`Raiders ${rt}`, ['spear', 'sword', 'archer', 'xbow', 'lancer', 'rider'].map(k => ({ name: `${RAIDER_NAME[k]} ${rt}`, raider: k, rt })));
  // the bosses, drawn at their own size
  people('Bosses', [{ name: 'Raider Chief', raider: 'chief', rt: 3 }, { name: 'Warlord', raider: 'warlord', rt: 3 }]);
  gPeople.slice(-2).forEach(p => p.g.scale.setScalar(ENEMY[p.raider].boss));
  // raider siege engines by tier, each pushed by two of its crew
  row('Raider siege', 3, zc => ['ballista', 'catapult', 'ram'].forEach((k, j) => [1, 2, 3].forEach(rt => {
    const i = j * 3 + rt - 1, x = 6 + i * 4.4, p = makeRaider(k, rt);
    p.g.position.set(x, 0, zc); p.g.rotation.y = .5; gScene.add(p.g); Object.assign(p, { kind: k, tier: rt, rate: ENEMY[k].rate, seed: i * .7 }); gPeople.push(p);
    galLabel(RAIDER_NAME[k][rt - 1], '#ff9a8a', x, zc + 2.0, false, .75);
  })));
  gRows[gRows.length - 1].n = 9;
  // the lawn, the sun's shadow box and the camera's reach all grow with the rows (they used to stop short of the people)
  galEnd = z; const mid = z / 2, half = z / 2 + 14;
  ground.geometry.dispose(); ground.geometry = new THREE.PlaneGeometry(260, z + 160).rotateX(-Math.PI / 2); ground.position.set(24, 0, mid);
  s.target.position.set(24, 0, mid); s.position.set(-12, 46, mid - 36);
  Object.assign(s.shadow.camera, { left: -half, right: half, top: half, bottom: -half, far: half * 2 + 90 }); s.shadow.camera.updateProjectionMatrix();
}
function openGallery() {
  if (galleryOn) return;
  if (!gScene) buildGallery();
  gSaved = { target: target.clone(), yaw, pitch, dist, paused, lim: { ...CAM_LIM } };
  paused = true; galleryOn = true; hideGhost();
  Object.assign(CAM_LIM, { lo: -10, hi: Math.max(110, galEnd + 10), near: 4 });   // as far as the rows run
  target.set(22, 0, 16); yaw = 0; pitch = .75; dist = 34; updateCam();
  $('#app').classList.add('gallery'); $('#galBar').hidden = false;
}
function closeGallery() {
  if (!galleryOn) return;
  galleryOn = false; Object.assign(CAM_LIM, gSaved.lim);
  target.copy(gSaved.target); yaw = gSaved.yaw; pitch = gSaved.pitch; dist = gSaved.dist; paused = gSaved.paused; updateCam();
  $('#app').classList.remove('gallery'); $('#galBar').hidden = true;
}
// tap a building: a quarter turn, to see its other sides
function galleryTap(e) {
  setRay(e);
  const hit = ray.intersectObjects(gItems.map(i => i.g), true)[0]; if (!hit) return;
  const it = gItems.find(i => { let o = hit.object; while (o) { if (o === i.g) return true; o = o.parent; } return false; });
  if (it && it.turns) it.g.userData.turn++;
}
function galPose(p, t, dt) {
  if (p.engine) {                                                 // engines: roll with Walk, else shoot (or swing the ram) on their own clock
    p.walking = gWalk; p.aiming = !gWalk; p.phase = t * 6 + p.seed; p.attackT = gWalk ? 0 : Math.max(0, RAM_T - (t + p.seed) % 2.4);
    if (ENG_LOAD[p.kind] && p.crewReady && p.load >= 1) { p.load = 0; p.fireT = .35; }   // loose as soon as it is wound
    animEngine(p, dt, 0); return;
  }
  const ease = (o, v) => o + (v - o) * Math.min(1, dt * 14), walking = gWalk || p.carry || (!p.work && !p.guard && !p.raider && !p.kit);
  const ph = t * 9 + p.seed, sw = walking ? Math.sin(ph) * .6 : 0;
  if (p.horseLegs) horseGait(p.horseLegs, ph, walking ? 1 : 0);
  else { p.legs[0].rotation.x = sw; p.legs[1].rotation.x = -sw; }
  p.body.position.y = p.horseLegs ? SADDLE : walking ? Math.abs(Math.sin(ph)) * .05 : 0;   // a rider stays in the saddle
  let L = -sw * .8, R = sw * .8, tilt = -.2, lean = 0;
  if (p.xbow || p.raider === 'xbow') { xbowPose(p, (t + p.seed) % 1.4 > .7); return; }   // crossbowmen: level and shoot, then down to reload
  if (p.guard || p.raider === 'archer') {                        // loose a shot every 1.8 s: idle, draw with both hands, loose
    const c = (t + p.seed) % 1.8; bowPose(p, c > .6 && c < 1.05, c >= 1.05 && c < 1.4, p.guard ? -.9 : -.35, p.guard ? -.6 : 0); return;
  }
  if (p.raider || p.kit) {                                        // a strike every 1.2 s, as in a fight
    const T0 = (p.raider && SPEARS(p.raider)) || (p.kit && p.kit < 3) ? SPEAR_T : SWORD_T, at = gWalk ? 0 : Math.max(0, T0 - (t + p.seed) % 1.6);
    p.arms[0].rotation.x = -.55 - sw * .2;
    if (p.kit === 3) swordPose(p, at, sw);
    else if ((p.raider && SPEARS(p.raider)) || p.kit) spearPose(p, at, sw);
    else swordPose(p, at, sw);
    return;
  }
  if (p.carry === 'log') { R = -2.75; L = -sw * .6; } else if (p.carry === 'stone') { L = R = -1.2; }
  else if (p.work && !gWalk) { let crouch, twist; ({ R, L, tilt, lean, crouch, twist } = TOOL_POSE[p.tool](t + p.seed, p.seed)); kneel(p, crouch || 0); p.body.rotation.y = twist || 0; }
  else if (p.tool) { R = -.3 + sw * .25; tilt = -.25; }
  if (p.pivot) { p.pivot.visible = !p.carry; p.pivot.rotation.x = ease(p.pivot.rotation.x, tilt); }
  p.arms[0].rotation.x = ease(p.arms[0].rotation.x, L); p.arms[1].rotation.x = ease(p.arms[1].rotation.x, R); p.body.rotation.x = ease(p.body.rotation.x, lean);
}
function updateGallery(dt, now) {
  const t = now / 1000; windU.value = t;
  gDoorK += (gDoors - gDoorK) * Math.min(1, dt * 4);
  for (const it of gItems) {
    const g = it.g, goal = g.userData.turn * Math.PI / 2;
    g.rotation.y += (goal - g.rotation.y) * Math.min(1, dt * 6);
    if (!g.userData.leaves) { const L = []; g.traverse(o => { if (o.userData.leaf !== undefined) L.push(o); }); g.userData.leaves = L; }
    for (const l of g.userData.leaves) l.rotation.y = l.userData.leaf * gDoorK;
    animHorses(g, t);
  }
  for (const p of gPeople) galPose(p, t, dt);
}
$('#adGallery').addEventListener('click', openGallery);
// Reset campaign (Jack): tap twice within 3 s; clears stars, best times, crowns, the save, the tutorial and tips seen and the
// stages' town picks (sound settings, the free-play loadout and the last map stay), then reloads
let campResetT = 0;
$('#adReset').addEventListener('click', () => {
  const b = $('#adReset');
  if (performance.now() > campResetT) { campResetT = performance.now() + 3000; b.classList.add('armed'); b.textContent = 'Tap again to reset'; setTimeout(() => { if (performance.now() > campResetT) { b.classList.remove('armed'); b.textContent = 'Reset campaign'; } }, 3100); return; }
  try { for (const k of ['stars', 'best', 'crowns', 'save', 'guide', 'tips', 'stage-pair', 'stage-decor', 'upg']) localStorage.removeItem('mtd-' + k); } catch (e) {}
  location.reload();
});
$('#moveBtn').addEventListener('click', () => { if (paused) return setHint('Paused', 'bad'); if (!selected) return; moveFor = moveFor === selected ? null : selected; setHint(moveFor ? 'Tap a tile' : 'Select a building'); refreshCard(); });
$('#rallyBtn').addEventListener('click', () => { if (!selected) return; rallyFor = rallyFor === selected ? null : selected; setHint(rallyFor ? 'Tap a spot' : 'Select a building'); refreshCard(); });
$('#cardTrade').addEventListener('click', e => {
  const b = e.target.closest('button'), B = selected; if (!b || !B || B.type !== 'market' || !B.built) return;
  if (paused) return setHint('Paused', 'bad');
  const t = TRADES[+b.dataset.i], give = { [t.give]: 10 }, n = t.n[B.tier - 1], c = center(B);
  if (!canAfford(give)) return setHint(`Need ${costHTML(give)}`, 'bad');
  pay(give); res[t.get] += n; const y = B.group.position.y + 2.4;
  floatRes(t.get, n, c.x, y, c.z); coinFly(c.x, y, c.z, Math.min(4, Math.ceil(n / 2)), t.get); sfx('trade'); refreshCard();
});
function volleyAct() {
  if (paused) return setHint('Paused', 'bad'); if (volleyCd > 0) return; if (PH.kind !== 'night') return setHint('Night only', 'bad');
  volleyAim = !volleyAim; if (volleyAim) rallyFor = null; if (!volleyAim) volleyLine.visible = false; setHint(volleyAim ? 'Tap a spot' : 'Select a building'); refreshCard(); updatePowers();
}
function ridersAct(K) {
  if (paused) return setHint('Paused', 'bad'); if (!K || K.type !== 'castle') return;
  if (summoned().length) { rallyFor = rallyFor === K ? null : K; if (rallyFor) volleyAim = false; setHint(rallyFor ? 'Tap a spot' : 'Select a building'); refreshCard(); updatePowers(); return; }
  if (summonCd > 0) return; if (PH.kind !== 'night') return setHint('Night only', 'bad');
  summonRiders(); refreshCard(); updatePowers();
}
$('#volleyBtn').addEventListener('click', volleyAct);
$('#summonBtn').addEventListener('click', () => ridersAct(selected));
$('#pwVolley').addEventListener('click', volleyAct);
$('#pwRiders').addEventListener('click', () => ridersAct(castleB()));
// the night powers' corner buttons: shown at night while the castle stands, mirroring the card's buttons (cooldowns, rally flag)
function updatePowers() {
  const K = castleB(), el = $('#powers'), on = PH.kind === 'night' && !gameOver && K && K.built && !menuOn() && !galleryOn && !showcaseBuilt;
  el.hidden = !on; if (!on) return;
  const v = $('#pwVolley'), r = $('#pwRiders');
  if (!v.innerHTML) { v.innerHTML = $('#volleyBtn').querySelector('svg').outerHTML + '<b class="cd"></b>'; r.innerHTML = '<svg viewBox="0 0 24 24"></svg><b class="cd"></b>'; }
  v.classList.toggle('cool', volleyCd > 0); v.querySelector('.cd').textContent = volleyCd > 0 ? Math.ceil(volleyCd) : ''; v.setAttribute('aria-pressed', String(volleyAim));
  const out = summoned().length > 0, rc = !out && summonCd > 0, ico = out ? 'rally' : 'horse';
  if (r.dataset.ico !== ico) { r.dataset.ico = ico; r.querySelector('svg').innerHTML = out ? '<path d="M6 21 V3.5"/><path d="M6 4 H17.5 L15 8 L17.5 12 H6"/>' : HORSE_ICO; }
  r.classList.toggle('cool', rc); r.querySelector('.cd').textContent = rc ? Math.ceil(summonCd) : ''; r.setAttribute('aria-pressed', String(out && rallyFor === K));
  r.setAttribute('aria-label', out ? 'Rally riders' : 'Riders');
  // side by side just under the top panel (under the boss bar too while one is out), at its left edge (Jack): always the same spot,
  // clear of the dock and the building card
  const pn = document.querySelector('.panel').getBoundingClientRect(), bb = $('#bossBar');
  let top = pn.bottom + 8;
  if (bb && !bb.hidden) { const r = bb.getBoundingClientRect(); if (r.height && r.left < pn.left + 110) top = Math.max(top, r.bottom + 8); }
  el.classList.remove('col'); el.style.bottom = 'auto'; el.style.top = top + 'px'; el.style.left = pn.left + 'px';
}
// the boss's health along the top while one is out
function updateBossBar() {
  const B = enemies.find(e => !e.dead && !e.dormant && ENEMY[e.kind].boss), el = $('#bossBar');
  el.hidden = !B || gameOver || menuOn(); if (el.hidden) return;
  // under the top panel when it spans the screen (upright), else beside it, clear of its right edge (sideways)
  const top = document.querySelector('.panel').getBoundingClientRect(), wide = top.right > innerWidth * .6, w = el.offsetWidth;
  // a phone held sideways: under the row of buttons at the top middle
  const side = document.querySelector('.bar').getBoundingClientRect().height > innerHeight * .5;
  el.style.top = (wide ? top.bottom + 8 : side ? 54 : 10) + 'px'; el.style.left = (wide ? innerWidth / 2 : Math.max(innerWidth / 2, top.right + 14 + w / 2)) + 'px';
  $('#bossName').textContent = RAIDER_NAME[B.kind]; $('#bossFill').style.width = Math.max(0, B.hp / B.max * 100) + '%';
}
$('#recallBtn').addEventListener('click', () => { if (selected) { setRally(selected, null); rallyFor = null; setHint('Recalled'); refreshCard(); } });
$('#galBack').addEventListener('click', closeGallery);
$('#galTurn').addEventListener('click', () => { for (const it of gItems) if (it.turns) it.g.userData.turn++; });
$('#galDoors').addEventListener('click', () => { gDoors = gDoors ? 0 : 1; $('#galDoors').setAttribute('aria-pressed', String(!!gDoors)); });
$('#galWalk').addEventListener('click', () => { gWalk = !gWalk; $('#galWalk').setAttribute('aria-pressed', String(gWalk)); });

