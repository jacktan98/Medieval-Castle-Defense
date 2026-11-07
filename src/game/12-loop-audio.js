// ---------- game setup ----------
// ---------- the title screen's showcase: the real game behind "Medieval Town Defense", a small town on the Meadow at dusk, torches and
// fires lit, the camera slowly circling it (Jack). Built with the game's own placement (free, instant), then left still: the sim doesn't
// run under a menu, only the camera, the trees, smoke and embers, flags and flames move. Any game started afterwards replaces it.
let showcaseBuilt = false;
const SHOWCASE = [   // type, cells from the castle's centre (x, z; the castle's door faces +z), tier
  ['house', -3, -1, 3], ['house', -3, 1, 2], ['house', -2, 3, 3], ['house', 3, 1, 2], ['house', 3, -1, 3], ['house', -4, 3, 1],
  ['market', 1, 4, 3], ['tower', -3, -4, 3], ['tower', 3, -4, 2], ['tower', 5, 3, 2], ['farm', -7, -1, 2], ['barracks', 0, -5, 2],
  ['lodge', -6, 4, 2], ['torch', -1, 2, 1], ['torch', 1, 2, 1], ['torch', -3, 5, 1], ['campfire', -1, 6, 1], ['banner', 2, -3, 1],
  ['flowers', -4, 0, 1], ['flowers', 4, 0, 1], ['well', 4, 5, 1], ['statue', -2, -3, 1]];
// the scenes it moves between (Jack): it opens on the Meadow at dusk, then every SHOW_T seconds fades to another one at random
// (the pass is ringed by mountains: its camera looks up the pass from the open south and only sways, `swing` rad either way)
const SHOW_SCENES = [{ map: 'meadow', time: 'dusk' }, { map: 'isle', time: 'day' }, { map: 'pass', time: 'night', yaw: 0, swing: .45, pitch: .78, dist: 50 }], SHOW_T = 28;
let showScene = 0, showT = 0, showFading = false, showYaw0 = 0, showPh = 0, showDist = 40;
const showC = new THREE.Vector3();
function nextShowcase() {
  if (showFading) return; showFading = true; canvas.style.transition = 'opacity .7s'; canvas.style.opacity = '0';
  setTimeout(() => {
    showFading = false; showT = 0;
    if (showcaseBuilt && !mapPickEl.hidden) { let n; do n = Math.floor(Math.random() * SHOW_SCENES.length); while (n === showScene); buildShowcase(n); }
    canvas.style.opacity = '1';
  }, 750);
}
function buildShowcase(n = 0) {
  const S = SHOW_SCENES[n]; showScene = n; showT = 0;
  const keep = MAP; MAP = S.map; startGame(); MAP = keep;
  const K = buildings.find(B => B.type === 'castle');
  const setTier = (B, t) => { if (!B || t < 2) return; B.tier = t; B.max = DEF[B.type].hp[t - 1]; B.hp = B.max; swapModel(B); };
  setTier(K, 3);
  const ci = Math.floor((K.ev.x0 + K.ev.x1) / 2 / CELL), cj = Math.floor((K.ev.z0 + K.ev.z1) / 2 / CELL);
  for (const [type, dx, dz, t] of SHOWCASE) { const ev = findValid(type, ci + dx, cj + dz, { free: true }); if (ev) setTier(place(type, ev.ci, ev.cj, { instant: true, free: true, quiet: true }), t); }
  for (const v of villagers) v.g.visible = false;                           // everyone indoors at dusk: the town doesn't move under the menu
  if (S.time === 'dusk') { PH.t = DUSK * .45; light = .25 + .75 * sstep(0, DUSK, PH.t); }   // low warm light, the torches and fires lit
  else if (S.time === 'night') { PH.kind = 'night'; light = 0; }                              // moonlight, every torch and fire burning
  const c = center(K); target.set(c.x, 1.5, c.z); showYaw0 = S.yaw !== undefined ? S.yaw : Math.random() * Math.PI * 2; showPh = 0; yaw = showYaw0;
  pitch = S.pitch || .62; showC.copy(target); showDist = (S.dist || 40) * (innerWidth < innerHeight ? 1.35 : 1); dist = showDist; updateCam();
  $('#log').innerHTML = ''; $('#banner').className = 'banner';
  showcaseBuilt = true;
}
function findValid(type, ci0, cj0, opts = {}) {
  for (let r = 0; r < 24; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    const ev = evaluate(type, ci0 + di, cj0 + dj, opts.free);
    if (ev.ok) return ev;
  }
  return null;
}
// the map's random parts (rocks, clutter, scenery) come from a seed, so a saved game can be rebuilt on the same ground
var gameSeed = 0, nextSeed = null, hardOn = false;
function seededRandom(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function startGame() {
  $('#nightBtn').classList.remove('skipGlow');
  gameSeed = nextSeed != null ? nextSeed : (Math.random() * 2147483647) | 0; nextSeed = null;
  showcaseBuilt = false; campsJoined = false; canvas.style.opacity = '1';
  // Stage 3 opens tier 2: the upgrade step Stage 1's guide drops comes as a one-time tip here (Jack)
  if (MAP === 'cross') tipOnce('upgrade', 'Tap a building to <b>Upgrade</b> it');
  anims.length = 0; spawnQueue = [];
  for (const B of buildings) { scene.remove(B.group); scene.remove(B.bar.grp); scene.remove(B.pbar.grp); removeScaffold(B); hideDefenders(B); if (B.rallyFlag) setRally(B, null); } buildings.length = 0;
  for (const v of villagers) { scene.remove(v.g); if (v.sbar) scene.remove(v.sbar.grp); } villagers.length = 0;
  for (const f of fallen) scene.remove(f.v.g); fallen.length = 0; for (const c of chips) scene.remove(c.m); chips.length = 0; respawns.length = 0; rallyFor = null; moveFor = null;
  for (const e of enemies) { scene.remove(e.g); scene.remove(e.bar.grp); burnOff(e); } enemies.length = 0;
  for (const a of arrows) scene.remove(a.m); arrows.length = 0; volleyQ = []; volleyCd = 0; volleyAim = false; summonCd = 0; summonOut = false; volleyLine.visible = false;
  for (const f of floats) scene.remove(f.sp); floats.length = 0;
  for (const p of puffs) scene.remove(p.sp); puffs.length = 0;
  mapRules(); applyUpgrades();
  PH = { kind: 'day', wave: 1, t: DAYLEN[0] }; nextPts = null; econT = TICK; gameOver = false; endCheer = 0; endDawn = false; musicFade(0); light = 1; if (paused) setPaused(false); setMusic('day');
  if (MAP === 'isle') { KX = 27; KZ = 27; } else if (MAP === 'pass') { KX = 27; KZ = 21; } else if (MAP === 'vale') { KX = 25; KZ = 33; } else if (MAP === 'bridge') { KX = 29; KZ = 37; } else if (MAP === 'cross') { KX = 17; KZ = 39; } else if (MAP === 'watch') { KX = 17; KZ = 29; } else if (MAP === 'dune') { KX = 15; KZ = 26; } else if (MAP === 'bend') { KX = 21; KZ = 28; } else if (MAP === 'crag') { KX = 25; KZ = 33; } else if (MAP === 'ford') { KX = 29; KZ = 43; } else if (MAP === 'mere') { KX = 15; KZ = 43; } else if (MAP === 'plains') { KX = 28; KZ = 28; } else if (MAP === 'keep') { KX = 41; KZ = 67; } else if (MAP === 'hold') { KX = 39; KZ = 65; } else { KX = 19; KZ = 27; }
  // a medium map (Stages 7-10) is its 56 m layout scaled up: the castle's site too
  MK = MED[MAP] ? MAP_N[MAP] * CELL / 56 : 1; if (MED[MAP]) { KX *= MK; KZ *= MK; }
  setMapSize(MAP_N[MAP] || 28);
  const rnd0 = Math.random; Math.random = seededRandom(gameSeed);
  try {
  genTerrain(); if (MAP === 'keep') rollKeepCamps(); genBridges(); genTrees(); genRocks(); genClutter(); syncTerrain(); buildBridges(); genShore(); hideGhost(); deselect();
  Object.assign(res, (MAP_RULES[MAP] || {}).res || { gold: 40, wood: 45, stone: 0, food: 20 });
  // hard: 30% less gold and wood, and every starting amount to the nearest ten (Jack)
  if (hardOn) { res.gold *= .7; res.wood *= .7; for (const k of ['gold', 'wood', 'stone', 'food']) res[k] = Math.round(res[k] / 10) * 10; }
  stats = { slain: 0, lost: 0, fallen: 0, gold: 0, wood: 0, stone: 0, food: 0, built: 0, upgrades: 0, made: {}, lostB: 0, felled: 0, mined: 0, boostKills: {}, t0: performance.now() }; guideDone = false; goalsMet = {};
  clearSummary(); $('#log').innerHTML = '';
  const ev = MAP === 'isle' ? findValid('castle', 12, 12, { free: true }) : MAP === 'pass' ? findValid('castle', 12, 9, { free: true }) : MAP === 'vale' ? findValid('castle', 11, 15, { free: true }) : MAP === 'bridge' ? findValid('castle', 13, 17, { free: true }) : MAP === 'cross' ? findValid('castle', 7, 18, { free: true }) : MAP === 'watch' ? findValid('castle', 7, 13, { free: true }) : MAP === 'dune' ? findValid('castle', 6, 11, { free: true }) : MAP === 'bend' ? findValid('castle', 9, 12, { free: true }) : MAP === 'crag' ? findValid('castle', Math.round(KX / CELL - 1.5), Math.round(KZ / CELL - 1.5), { free: true }) : MAP === 'ford' ? findValid('castle', Math.round(KX / CELL - 1.5), Math.round(KZ / CELL - 1.5), { free: true }) : MAP === 'mere' ? findValid('castle', Math.round(KX / CELL - 1.5), Math.round(KZ / CELL - 1.5), { free: true }) : MAP === 'plains' ? findValid('castle', Math.round(KX / CELL - 1.5), Math.round(KZ / CELL - 1.5), { free: true }) : MAP === 'keep' ? findValid('castle', 19, 32, { free: true }) : MAP === 'hold' ? findValid('castle', 18, 31, { free: true }) : findValid('castle', 8, 12, { free: true });
  if (ev) { const B = place('castle', ev.ci, ev.cj, { instant: true, free: true, quiet: true }); const c = center(B); target.set(c.x, 2, c.z); }
  if (MAP === 'pass') { yaw = 0; target.z += 4.5; }   // looking up the pass at the castle
  if (MAP === 'vale') { yaw = -Math.PI / 4; target.x += 2; target.z -= 2; }   // from the south-west, the way in (north-east) at the top of the screen
  if (MAP === 'bridge') { yaw = 0; target.z -= 4; bankWall(); }   // from the south, the river and the raiders' bank at the top
  if (MAP === 'cross') { yaw = 0; target.x += 4; target.z -= 5; crossTown(); }
  if (ruinMesh && MAP !== 'watch') { scene.remove(ruinMesh); ruinMesh = null; }
  if (MAP === 'dune') { yaw = 0; target.x += 6; target.z += 2; layRoads([DUNE_ROAD]); rebuildRoads(); }   // from the south: the oasis ahead, the dunes behind
  if (MAP === 'bend') { yaw = 0; target.z -= 1; layRoads(BEND_ROADS); rebuildRoads(); }
  if (MAP === 'crag') { yaw = 0; target.x += 3; target.z -= 4; layRoads(CRAG_ROADS.map(scalePts)); rebuildRoads(); }   // from the south: the crag up on the right
  if (MAP === 'ford') { yaw = 0; target.z -= 9; layRoads([scalePts(FORD_ROAD)]); rebuildRoads(); fordWall(); }
  if (MAP === 'mere') { yaw = 0; target.x += 8; target.z -= 8; layRoads(MERE_ROADS.map(scalePts)); rebuildRoads(); }   // from the south: the marsh ahead
  if (MAP === 'plains') { yaw = 0; target.z -= 2; layRoads(PLAINS_ROADS.map(scalePts)); rebuildRoads(); }
  placeBossScenery();
  if (MAP === 'keep') { yaw = 0; target.z -= 10; layRoads(KEEP_ROADS); rebuildRoads(); }   // from the south, looking up at the keep
  if (MAP === 'hold') { yaw = 0; target.z -= 10; layRoads(HOLD_ROADS); rebuildRoads();
  }                   // from the south: the fords ahead                   // from the south: the north bridge at the top
  if (MAP === 'watch') { yaw = 0; target.x += 7; target.z -= 4; layRoads(WATCH_ROADS); rebuildRoads(); placeRuin(); }   // from the south: Watch hill ahead, the gully on the right   // from the south, the cross and the north road ahead
  BANK_WALL = MAP === 'bridge' ? BANK_WALL : [];
  } finally { Math.random = rnd0; }
  // the tutorial stage: the guided first day every time (Skip ends it), except on hard mode (Jack: no tutorial there)
  if (MAP === 'vale' && !hardOn) guideOn = true;
  else if (CAMP_MAPS[MAP]) { guideOn = false; guideMark(); }
  // a campaign stage: its new buildings, one card each (from Stage 2), then its goals (Jack: the goals only on this card)
  // none on hard mode: the stage has been won with 3 stars already (Jack)
  if (CAMP_MAPS[MAP] && !hardOn) showNewCards((CAMP_MAPS[MAP].stop > 0 ? CAMPAIGN[CAMP_MAPS[MAP].stop].adds.concat(CAMP_MAPS[MAP].newTier ? ['tier' + CAMP_MAPS[MAP].newTier] : []) : []).concat(stageGoals(MAP).length ? ['goals'] : []));   // a later stage: its new buildings, one card each, before play
  updateCam();
  log('Drag · twist · pinch');
  log(`Survive <b>${NIGHTS} nights</b>`); if (hardOn) log('<b>Hard:</b> raiders a tier up', 'warn');
  log('<b>Day 1</b>', 'good');
  // behind the new-building or goals cards nobody saw it (Jack): it waits for their Play
  bannerLater = !$('#newCards').hidden ? ['Day 1', 'Build before dark'] : null; if (!bannerLater) banner('Day 1', 'Build before dark');
  applyLoadout(); cat = 'eco'; renderTools(); setTool('select');
  // the Goals panel shows this game's goals at once (it only redrew on the HUD tick, which waits behind the new-building cards,
  // so an open panel kept the last stage's goals: Jack)
  goalsKey = ''; renderGoals(); weatherReset(); sweepGeo(); cellOpen = fieldCache = pass3 = null; regionDirty = true;
}

// ---------- loop ----------
for (const t in DEF) if (t !== 'castle') makeGhost(t);   // here, once every model's materials exist (stables and siege use the soldiers' and horses')
resize();
if (!/[?&](gallery|debug|map=)/.test(location.search)) showMapPick(); else { startGame(); $('#mapPick').hidden = true; }   // shown from the first paint, so the game never flashes up behind it
// the game is up: the loading screen fades once the first frames are drawn
requestAnimationFrame(() => requestAnimationFrame(() => { const L = $('#loading'); if (!L) return; L.classList.add('done'); setTimeout(() => L.remove(), 600); }));
const easeOut = t => 1 - Math.pow(1 - t, 3);
// how high over a building its health bar floats; a type missing here (the newer buildings were) is measured from its model, per tier,
// once it stands finished (it used to come out NaN, so their bars never showed)
function barTop(B) {
  if (BAR_TOP[B.type]) return BAR_TOP[B.type];
  if (B.barTopT !== B.tier && !B.site && !B.rise && !B.pop) {
    const y0 = B.group.position.y; B.barTopT = B.tier; B.barTopY = Math.max(1.4, new THREE.Box3().setFromObject(B.group).max.y - y0 + .45);
  }
  return B.barTopY || 3;
}
const BAR_TOP = { market: 3.0, barracks: 3.4, house: 3.4, farm: 1.6, lodge: 3.6, quarry: 3.0, tower: 6.4, castle: 7.2, wall: 2.8, gate: 3.6, well: 2.3, torch: 2.2, flowers: 1, statue: 3.2 };
let last = performance.now(), hudT = 0, buildT = 0;
var paused = false, gameSpeed = 1, instantBuild = false;
function setPaused(on) {
  paused = on; $('#pauseBtn').setAttribute('aria-pressed', String(on)); $('#pausedTag').hidden = !on;
  if (on) { hideGhost(); setHint('Paused', 'bad', true); } else setHint(tool === 'select' ? 'Select a building' : isTouch ? 'Tap to place' : 'Pick a spot');
  $('#pauseBtn').innerHTML = on ? '<svg viewBox="0 0 24 24"><path class="solid" d="M8 5 L19 12 L8 19 Z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5 V19 M16 5 V19" stroke-width="3.2"/></svg>';
  $('#pauseBtn').setAttribute('aria-label', on ? 'Resume' : 'Pause'); $('#pauseBtn').title = on ? 'Resume (P)' : 'Pause (P)';
}
$('#pauseBtn').addEventListener('click', () => !gameOver && !menuOn() && setPaused(!paused));
$('#resumeBtn').addEventListener('click', () => !menuOn() && setPaused(false));
$('#speedBtn').addEventListener('click', () => {
  gameSpeed = gameSpeed === 1 ? 2 : 1;
  $('#speedBtn').innerHTML = `<span class="spd">${gameSpeed}×</span>`; $('#speedBtn').setAttribute('aria-pressed', String(gameSpeed > 1)); $('#speedBtn').setAttribute('aria-label', `Game speed ${gameSpeed}×`);
});
$('#adminRes').innerHTML = RES_KEYS.map(k => `<div class="adRow"><span class="ico">${ICON[k]}</span><input id="ad-${k}" type="number" min="0" step="10" inputmode="numeric" aria-label="${k === 'food' ? 'Food' : k[0].toUpperCase() + k.slice(1)}"><button data-k="${k}" data-n="100">+100</button><button data-k="${k}" data-n="1000">+1k</button></div>`).join('');
function syncAdmin(force) { for (const k of RES_KEYS) { const el = $('#ad-' + k); if (force || document.activeElement !== el) el.value = Math.floor(res[k]); } }
RES_KEYS.forEach(k => $('#ad-' + k).addEventListener('change', e => { res[k] = Math.max(0, Math.floor(+e.target.value || 0)); syncAdmin(true); }));
document.querySelectorAll('.adRow button').forEach(b => b.addEventListener('click', () => { res[b.dataset.k] += +b.dataset.n; syncAdmin(true); }));
$('#adminBtn').addEventListener('click', () => { const open = $('#admin').hidden && $('#raidDash').hidden; $('#raidDash').hidden = true; $('#admin').hidden = !open; $('#adminBtn').setAttribute('aria-pressed', String(open)); if (open) syncAdmin(true); });
$('#adFill').addEventListener('click', () => { RES_KEYS.forEach(k => res[k] = 9999); syncAdmin(true); });
$('#adFinish').addEventListener('click', () => { buildings.forEach(B => { if (B.site) B.site.progress = 1; }); });
$('#adInstant').addEventListener('change', e => { instantBuild = e.target.checked; if (instantBuild) buildings.forEach(B => { if (B.site) B.site.progress = 1; }); });
$('#adPop').addEventListener('click', () => { const k = castleB(); if (k) { for (let n = 0; n < 5; n++) makeVillager(k); assignJobs(); } });
$('#adDay').addEventListener('click', () => { if (PH.kind === 'day' && !gameOver) PH.t = 0; });
// admin raiders dashboard: every raider kind by tier; a tap sends that many of it. By day it brings on a test night that ends
// back in the same day (the wave isn't used up)
const RD_NAME = { ballista: 'Ballista', catapult: 'Catapult', ram: 'Ram' };
let rdN = 1;
function spawnRaiders(list) {
  if (gameOver || !list.length) return;
  if (PH.kind === 'day') { PH.testDay = PH.t; PH.kind = 'night'; spawnQueue = []; spawnT = .3; sfx('horn'); assignPosts(); setMusic('night'); }
  const pts = [edgePoint(), edgePoint()];
  list.forEach(([k, t], n) => spawnQueue.push([k, pts[n % 2], t]));
  spawnT = Math.min(spawnT, .3);
}
function renderRaidDash() {
  $('#rdCount').innerHTML = [1, 5, 10].map(n => `<button data-n="${n}" class="${n === rdN ? 'on' : ''}">×${n}</button>`).join('');
  // bosses have no tiers (always sent at tier 3): one button across the three columns
  $('#rdList').innerHTML = Object.keys(ENEMY).map(k => `<span>${RD_NAME[k] || RAIDER_NAME[k]}</span>` + (ENEMY[k].boss ? `<button data-k="${k}" data-t="3" style="grid-column:span 3">Boss</button>`
    : [1, 2, 3].map(t => `<button data-k="${k}" data-t="${t}" title="Tier ${t}">${t}</button>`).join(''))).join('');
}
$('#rdCount').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { rdN = +b.dataset.n; renderRaidDash(); } });
$('#rdList').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  spawnRaiders(Array.from({ length: rdN }, () => [b.dataset.k, +b.dataset.t]));
  log(`<b>${RD_NAME[b.dataset.k] || RAIDER_NAME[b.dataset.k]}${ENEMY[b.dataset.k].boss ? '' : ' ' + b.dataset.t}</b> ×${rdN}`, 'warn');
});
const openRaidDash = open => { $('#raidDash').hidden = !open; $('#admin').hidden = open; if (open) renderRaidDash(); };
$('#adRaid').addEventListener('click', () => openRaidDash(true));
$('#rdClose').addEventListener('click', () => openRaidDash(false));

setPaused(false);
addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'P') !gameOver && !menuOn() && setPaused(!paused); });

// ---------- audio ----------
// Every effect is LEVELLED when it loads, the way medieval-td does it: measure the RMS of its loudest 0.3 s,
// scale it to one common loudness, then apply a trim for how prominent that sound should be. Re-uploading a
// file at a different recording level needs no change here.
var SND = {   // game event -> file in audio/sfx (or audio/music) and its trim against the common loudness
  click:     { file: 'sfx/Click_sound.mp3',          trim: .445 },
  build:     { file: 'sfx/Building_built.mp3',       trim: .9 },
  upgrade:   { file: 'sfx/Upgrade_sound.mp3',        trim: .9 },
  unlock:    { file: 'sfx/Unlock_stage.mp3',         trim: .9 },     // a stage unlocking on the campaign (its peak, ~1 s in, meets the padlock opening)     // a star upgrade bought, a building's upgrade finished
  sold:      { file: 'sfx/Building_sold.mp3',        trim: .7 },
  destroyed: { file: 'sfx/Building_destroyed.mp3',   trim: 1 },
  coins:     { file: 'sfx/Coins_payout.mp3',         trim: .7 },
  arrow:     { file: 'sfx/Arrow_shot.mp3',           trim: .889 },
  horn:      { file: 'sfx/Wave_horn.mp3',            trim: 1 },      // nightfall: the raiders' horn
  alert:     { file: 'sfx/Alert_sound.mp3',          trim: .6 },     // each new-building card as it pops up
  attack:    { files: ['sfx/Enemy_attack_1.mp3', 'sfx/Enemy_attack_2.mp3'], trim: .445 },   // a raider's strike on a building, one of the two at random
  clash:     { file: 'sfx/Attack_clash.mp3',         trim: .445 },   // soldier and raider trading blows
  arrowHit:  { file: 'sfx/Arrow_hit.mp3',            trim: .6 },     // a raider falls while the grunt is resting
  grunt:     { files: ['sfx/Enemy_grunt_1.mp3', 'sfx/Enemy_grunt_2.mp3'], trim: 1, reach: 60, near: .7 },   // a raider falls (at most every 3 s; arrowHit otherwise); heard across the map
  trade:     { file: 'sfx/Market_trade.mp3',         trim: .7 },
  star:      { file: 'sfx/Star_sound.mp3',           trim: .8 },   // each summary star as it pops in
  rooster:   { file: 'sfx/Morning_rooster.mp3',      trim: 1.1 },     // dawn: the night is won
  yawn:      { file: 'sfx/Villager_yawn.mp3',        trim: .6 },     // a hungry villager goes to sleep
  nope:      { file: 'sfx/Error_sound.mp3',          trim: .5 },     // a tap that can't be done (any red hint straight after a tap or key)
  // long recordings of repeated work: single strikes are cut out of them (see strikes()) and one plays per swing
  chop:      { file: 'sfx/Woodcutter_axe.mp3',       trim: .736, strikes: true },
  pick:      { file: 'sfx/Mason_pick.mp3',           trim: .736, strikes: true },
  hammer:    { file: 'sfx/Builder_hammer.mp3', trim: .668, strikes: true },
  hoe:       { file: 'sfx/Farmer_hoe.mp3',           trim: .6,   strikes: true },
  // a path tile laid: Path_placed.mp3 when it is added; until then one soft hoe stroke into the earth
  path:      { file: 'sfx/Path_placed.mp3',          trim: .5, fallback: 'hoe' },
  bolt:      { file: 'sfx/Ballista_bolt_shot.mp3',   trim: 1 },      // a ballista looses its bolt (yours or the raiders')
  qbolt:     { file: 'sfx/Crossbow_quiver_shot.mp3', trim: .8 },     // a crossbow shoots (yours or the raiders')
  rockFire:  { file: 'sfx/Rock_fired.mp3',           trim: .9 },     // a catapult, mangonel or trebuchet lets its stone go
  rockHit:   { file: 'sfx/Rock_hit_ground.mp3',      trim: 1, reach: 40 },   // the stone lands
  ramHit:    { file: 'sfx/Battleram_hit.mp3',        trim: 1 },      // a battering ram's log strikes home
  // animals, heard only close up (updateAmbience): the farmhouse's yard by what it keeps, the stables' horses
  hen:       { file: 'sfx/Chicken_cluck.mp3',        trim: .45, reach: 16 },
  pig:       { file: 'sfx/Pig_oink.mp3',             trim: .55, reach: 16 },
  cow:       { file: 'sfx/Cow_moo.mp3',              trim: .55, reach: 16 },
  neigh:     { file: 'sfx/Horse_neigh.mp3',          trim: .5,  reach: 16 },
  victory:   { file: 'music/Victory_sound.mp3',      trim: 1 },
  defeat:    { file: 'music/Defeat_sound.mp3',       trim: 1 },
};
// Long loops stream from <audio> rather than being decoded (a 3-minute track decoded is ~60 MB on a phone), so
// they can't be measured at load. Their levels were measured once (loudest 0.3 s RMS: theme 0.254, birds 0.214)
// and set to sit under the effects: the themes ~6 dB below them (night measured 0.168, so it plays a little higher), birdsong ~10 dB below.
// Re-measure if replaced.
var LOOPS = {
  music: { file: 'music/Medieval_theme_music.mp3', vol: .18 },
  night: { file: 'music/Night_theme_music.mp3', vol: .27 },
  birds: { file: 'sfx/Bird_chirping.mp3',          vol: .09 },
  // world ambience: their level follows the camera (updateAmbience), louder the nearer it looks and the further it zooms in;
  // vol is the most they reach (loudest 0.3 s RMS measured: fire .019, crackles peaking .7; river .035)
  fire:  { file: 'sfx/Fire_sound.mp3',             vol: 1.3, amb: true },
  river: { file: 'sfx/River_water_flow.mp3',       vol: 1.0, amb: true },
  gallop: { file: 'sfx/Horse_gallop.mp3',          vol: .4, amb: true },   // horses on the move (loudest .3 s RMS .126)
};
// bump when a sound file is replaced, so phones fetch the new file instead of a cached copy
var AUDIO_V = 6;
var TARGET_LOUD = .09, LOUD_WINDOW = .3, GAIN_MIN = .1, GAIN_MAX = 6, MASTER = .9, PEAK_CEILING = .95 / MASTER;
var SFX_GAP = { ramHit: .3, hen: 2, pig: 1.5, cow: 4, neigh: 3, bolt: .1, qbolt: .06, rockFire: .15, rockHit: .15, path: .12, clash: .12, arrowHit: .08, grunt: 3, yawn: 3, nope: .3, rooster: 2, chop: .15, pick: .15, hoe: .2, hammer: .12, arrow: .08, attack: .1, coins: .3, click: .05 };   // min seconds between repeats
var STROKE_SFX = { axe: 'chop', pick: 'pick', hoe: 'hoe', hammer: 'hammer' };
var muted = false; try { muted = localStorage.getItem('mtd-muted') === '1'; } catch (e) {}
// music and sounds each have their own loudness (the pause card's two sliders, 0 to 1; all the way down is off); the corner
// button still mutes everything. Stored as numbers ('mtd-music', 'mtd-sfx'; the old on/off toggles stored '1' and '0')
var musicVol = 1, sfxVol = 1, musicOff = false, sfxOff = false, musicBus = null, sfxBus = null;
try { const m = localStorage.getItem('mtd-music'), f = localStorage.getItem('mtd-sfx'); if (m !== null) musicVol = clamp(+m || 0, 0, 1); if (f !== null) sfxVol = clamp(+f || 0, 0, 1); } catch (e) {}
musicOff = musicVol === 0; sfxOff = sfxVol === 0;
// var: sfx()/setMusic() can run during the startup reset, before this block executes
var loopWanted = {}, loopNode = {}, ambK = { fire: 0, river: 0, gallop: 0 }, actx = null, master = null, audioUnlocked = false, musicWant = 'day', clips = {}, sfxLast = {}, lastPick = {}, loopEl = {}, stinger = null;
try { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = MASTER; master.connect(actx.destination);
  musicBus = actx.createGain(); musicBus.gain.value = musicVol; musicBus.connect(master); sfxBus = actx.createGain(); sfxBus.gain.value = sfxVol; sfxBus.connect(master); } catch (e) { actx = null; }
// loudness = RMS of the loudest LOUD_WINDOW; the gain brings it to TARGET_LOUD x trim without the peak passing the ceiling
function levelOf(b, from = 0, to = b.length) {
  const d = b.getChannelData(0), win = Math.max(1, Math.min(to - from, Math.round(LOUD_WINDOW * b.sampleRate))), hop = Math.round(.05 * b.sampleRate);
  let best = 0, peak = 0;
  for (let i = from; i < to; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
  for (let i = from; i + win <= to; i += hop) { let sum = 0; for (let k = i; k < i + win; k++) sum += d[k] * d[k]; best = Math.max(best, Math.sqrt(sum / win)); }
  return { loud: best, peak };
}
function gainFor(m, trim) { return Math.min(clamp(TARGET_LOUD * trim / Math.max(m.loud, 1e-4), GAIN_MIN, GAIN_MAX), PEAK_CEILING / Math.max(m.peak, 1e-4)); }
// onsets: the 10 ms envelope rising past 25% of the clip's peak after 80 ms below 10%; each strike runs to the next (max 0.6 s)
function strikes(b) {
  const d = b.getChannelData(0), hop = Math.round(.01 * b.sampleRate), env = [];
  let peak = 0; for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  for (let i = 0; i + hop <= d.length; i += hop) { let m = 0; for (let k = i; k < i + hop; k++) m = Math.max(m, Math.abs(d[k])); env.push(m); }
  const on = []; let quiet = 8;
  env.forEach((e, i) => { if (e > peak * .25 && quiet >= 8) { on.push(i * .01); quiet = 0; } else if (e < peak * .1) quiet++; else if (e > peak * .25) quiet = 0; });
  return on.map((t, i) => { const from = Math.max(0, t - .02), to = Math.min(i + 1 < on.length ? on[i + 1] - .03 : b.duration, t + .6); return [from, to - from]; }).filter(([, len]) => len > .08);
}
if (actx) for (const k in SND) {
  const S = SND[k]; clips[k] = [];
  for (const f of S.files || [S.file]) fetch('audio/' + f + '?v=' + AUDIO_V).then(r => r.ok ? r.arrayBuffer() : null).then(ab => ab && actx.decodeAudioData(ab, b => {
    if (S.strikes) {
      const cuts = strikes(b), sr = b.sampleRate;
      for (const [from, len] of cuts) clips[k].push({ buf: b, from, len, gain: gainFor(levelOf(b, Math.floor(from * sr), Math.floor((from + len) * sr)), S.trim) });
      if (!cuts.length) clips[k].push({ buf: b, from: 0, len: b.duration, gain: gainFor(levelOf(b), S.trim) });
    } else {   // skip any silence before the sound starts (some recordings open with ~0.4 s of it), so it lands on its event
      const d = b.getChannelData(0); let pk = 0; for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
      let i0 = 0; while (i0 < d.length && Math.abs(d[i0]) < pk * .03) i0++;
      const from = Math.max(0, i0 / b.sampleRate - .01);
      clips[k].push({ buf: b, from, len: b.duration - from, gain: gainFor(levelOf(b), S.trim) });
    }
  }, () => {})).catch(() => {});
}
for (const k in LOOPS) {
  const el = new Audio('audio/' + LOOPS[k].file); el.loop = true; el.preload = k === 'music' ? 'auto' : 'none'; el.crossOrigin = 'anonymous';
  let node = null;
  if (actx) try { node = actx.createGain(); node.gain.value = LOOPS[k].amb ? 0 : LOOPS[k].vol; actx.createMediaElementSource(el).connect(node); node.connect(k === 'music' || k === 'night' ? musicBus : sfxBus); } catch (e) { node = null; }
  if (!node) el.volume = LOOPS[k].amb ? 0 : Math.min(1, LOOPS[k].vol);
  loopNode[k] = node;                     // no Web Audio: plain element volume (ignored on iOS, but that path has no Web Audio anyway)
  // phones only start downloading after the first tap, so a compact AAC copy (.m4a, ~60% smaller) is tried first;
  // if it is missing or can't play, the original .mp3 takes over, and if that fails too the loop is dropped
  const mp3 = 'audio/' + LOOPS[k].file, m4a = mp3.replace(/\.mp3$/, '.m4a');
  if (el.canPlayType('audio/mp4; codecs="mp4a.40.2"')) el.src = m4a;
  el.addEventListener('error', () => {
    if (el.src.endsWith('.m4a')) { const was = !el.paused; el.src = mp3; el.load(); if (was || loopWanted[k]) el.play().catch(() => {}); return; }
    delete loopEl[k]; syncMusic();
  });
  loopEl[k] = el;
}
// at: a world point; world sounds fade with distance from what the camera looks at, and when zoomed far out
function sfx(name, at, vol = 1) {
  if (muted || !actx || actx.state !== 'running') return;
  if (name === 'victory' || name === 'defeat' ? musicOff : sfxOff) return;
  if (!clips[name] || !clips[name].length) return SND[name] && SND[name].fallback ? sfx(SND[name].fallback, at, vol * .7) : undefined;
  const now = actx.currentTime; if (now - (sfxLast[name] || -9) < (SFX_GAP[name] || .05)) return;
  // a refused tap sounds only the error, never the button's click as well (Jack): every button's click plays first (the capture
  // handler), so the error cuts off a click started a moment ago, and a click right after an error is skipped
  if (name === 'click' && now - (sfxLast.nope || -9) < .2) return;
  if (name === 'nope') for (const src of liveSfx) if (src.sndName === 'click' && now - src.t0 < .2) { try { src.stop(); } catch (e) {} liveSfx.delete(src); }
  let v = vol;
  // reach: metres to fade out over (28 by default); near: the least it keeps when zoomed far out
  if (at) { const S = SND[name] || {}; v *= clamp(1 - Math.hypot(at.x - target.x, at.z - target.z) / (S.reach || 28), 0, 1) * clamp(1.25 - dist / 80, S.near || .3, 1); if (v < .03) return; }
  sfxLast[name] = now;
  const list = clips[name];
  let n = Math.floor(Math.random() * list.length); if (list.length > 1 && n === lastPick[name]) n = (n + 1) % list.length;   // never the same take twice running
  lastPick[name] = n;
  const c = list[n], src = actx.createBufferSource(), g = actx.createGain();
  src.buffer = c.buf; src.playbackRate.value = .95 + Math.random() * .1; g.gain.value = c.gain * v;
  src.connect(g); g.connect(name === 'victory' || name === 'defeat' ? musicBus : sfxBus); src.start(0, c.from, c.len);
  src.sndName = name; src.t0 = now; liveSfx.add(src); src.onended = () => liveSfx.delete(src);
  return src;
}
// every one-shot still sounding, so leaving a game can cut them off (Jack heard the last stage's sounds carry on in the menu)
var liveSfx = new Set();
// (also the fire, river and hoof loops: behind a menu the game is paused and updateAmbience doesn't run, so they kept the last
// game's volume and played on in the menu)
function hushSfx() {
  // showMapPick runs at startup, before the audio setup here has run (liveSfx, ambK not set yet): nothing to hush then
  if (!liveSfx || !ambK) return;
  for (const src of liveSfx) if (src.sndName !== 'click') { try { src.stop(); } catch (e) {} liveSfx.delete(src); }
  for (const k of ['fire', 'river', 'gallop']) { ambK[k] = 0; ambK[k + 'Goal'] = 0; if (loopNode[k]) loopNode[k].gain.value = 0; }
  syncMusic();
}
// fire and running water: how loud each should be from where the camera looks (the nearest torch or campfire, the nearest bit of
// shoreline) and how close it is zoomed in; eased so panning past doesn't jump; the loop only plays while it is audible
var ambT = 0, ambCallT = 3;
function updateAmbience(dt) {
  if (!actx || galleryOn) return;
  if ((ambT -= dt) <= 0) {
    ambT = .25;
    const zoom = clamp((60 - dist) / 40, .12, 1);
    let df = 1e9; for (const B of buildings) if ((B.type === 'torch' || B.type === 'campfire') && B.built) { const c = center(B); df = Math.min(df, Math.hypot(c.x - target.x, c.z - target.z) * (B.type === 'torch' ? 1.4 : 1)); }
    for (const F of sceneFires) df = Math.min(df, Math.hypot(F.x - target.x, F.z - target.z) * (F.torch ? 1.4 : 1));
    let dr = 1e9; for (let i = 0; i < shore.length; i += 7) { const p = shore[i]; dr = Math.min(dr, Math.hypot(p[0] - target.x, p[1] - target.z)); }
    // horses moving at a fair pace: mounted raiders and the stables' riders
    let dh = 1e9; const near = u => { dh = Math.min(dh, Math.hypot(u.rx - target.x, u.rz - target.z)); };
    for (const e of enemies) if (e.horse && !e.dead && e.walking) near(e);
    for (const v of villagers) if (v.horse && v.g.visible && v.walking) near(v);
    // no fire, river, hooves or animal calls behind a menu: they belong to a game, not the title scene
    const quiet = menuOn() ? 0 : 1;
    const want = { fire: quiet * Math.pow(clamp(1 - df / 16, 0, 1), 1.5) * zoom, river: quiet * Math.pow(clamp(1 - dr / 22, 0, 1), 1.3) * zoom, gallop: quiet * Math.pow(clamp(1 - dh / 18, 0, 1), 1.3) * zoom };
    let flip = false;
    for (const k of ['fire', 'river', 'gallop']) { ambK[k + 'Goal'] = want[k]; if ((want[k] > .01) !== (ambK[k] > .01)) { flip = true; ambK[k] = Math.max(ambK[k], want[k] > .01 ? .011 : 0); } }
    if (flip) syncMusic();
    // now and then an animal calls, when the camera is close in on a farmhouse yard or the stables
    if ((ambCallT -= .25) <= 0 && zoom > .3 && quiet) {
      ambCallT = 2.5 + Math.random() * 4;
      const pens = buildings.filter(B => B.built && (B.type === 'farmhouse' || B.type === 'stables') && Math.hypot(center(B).x - target.x, center(B).z - target.z) < 14);
      const B = pens[Math.floor(Math.random() * pens.length)];
      if (B) { const kinds = B.type === 'stables' ? ['neigh'] : [...new Set(HERD[B.tier])]; sfx(kinds[Math.floor(Math.random() * kinds.length)], center(B), zoom); }
    }
  }
  for (const k of ['fire', 'river', 'gallop']) {
    const goal = ambK[k + 'Goal'] || 0; ambK[k] += (goal - ambK[k]) * Math.min(1, dt * 2.5); if (goal <= .01 && ambK[k] < .012) ambK[k] = 0;
    const v = LOOPS[k].vol * ambK[k];
    if (loopNode[k]) loopNode[k].gain.value = v; else if (loopEl[k]) loopEl[k].volume = Math.min(1, v);
  }
  if (ambK.fire === 0 || ambK.river === 0 || ambK.gallop === 0) { const want = { fire: ambK.fire > .01, river: ambK.river > .01, gallop: ambK.gallop > .01 }; if (Object.keys(want).some(k => loopEl[k] && !want[k] && !loopEl[k].paused)) syncMusic(); }
}
// the theme loops day and night with birdsong under it by day; victory and defeat stop it and play once
function setMusic(name) { musicWant = name; syncMusic(); }
// fade the music bus out over s seconds (0: back to the set loudness at once): the night theme fades as a won game's last raider falls
function musicFadeIn(s) {
  if (!musicBus || !actx) return; const g = musicBus.gain, t = actx.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(0, t); g.linearRampToValueAtTime(musicVol, t + s);
}
function musicFade(s) {
  if (!musicBus || !actx) return; const g = musicBus.gain, t = actx.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(s ? g.value : musicVol, t); if (s) g.linearRampToValueAtTime(0, t + s);
}
function syncMusic() {
  if (!loopEl) return;
  const on = !muted && audioUnlocked && !document.hidden, end = musicWant === 'victory' || musicWant === 'defeat';
  const nightOn = on && musicWant === 'night' && loopEl.night;   // falls back to the day theme if the night track is missing
  const mu = on && !musicOff, fx = on && !sfxOff;   // the pause card's Music and Sounds toggles
  const want = { music: mu && !end && !nightOn && musicWant !== 'none', night: mu && !!nightOn, birds: fx && musicWant === 'day', fire: fx && !end && ambK.fire > .01, river: fx && !end && ambK.river > .01, gallop: fx && !end && ambK.gallop > .01 };
  loopWanted = want;
  for (const k in loopEl) { const el = loopEl[k]; if (want[k] && el.paused) el.play().catch(() => {}); else if (!want[k] && !el.paused) el.pause(); }
  if (on && end && !stinger) stinger = sfx(musicWant) || 1;
  if (!end) stinger = null;
}
// browsers only allow sound after the player touches the page; phones count only a finger lifting (touchend / click), not
// pointerdown, so every gesture retries until the context runs and the wanted loops play. iOS: 'playback' plays sound
// even with the silent switch on (Web Audio is muted by it otherwise)
function unlockAudio() {
  if (audioUnlocked && (!actx || actx.state === 'running') && !Object.keys(loopEl).some(k => loopWanted[k] && loopEl[k].paused)) return;
  audioUnlocked = true;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  if (actx && actx.state !== 'running') actx.resume().then(syncMusic, () => {});
  syncMusic();
}
for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) addEventListener(ev, unlockAudio, true);
document.addEventListener('visibilitychange', () => { if (actx) document.hidden ? actx.suspend() : audioUnlocked && actx.resume(); syncMusic(); });
document.addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.closest('.cArrow, .cDot, .cCard')) sfx('click'); }, true);
function setMuted(on) {
  muted = on; try { localStorage.setItem('mtd-muted', on ? '1' : '0'); } catch (e) {}
  const b = $('#muteBtn');
  b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z"/>' + (on ? '<path d="M16 9.5 L21 14.5 M21 9.5 L16 14.5"/>' : '<path d="M15.5 9 a4 4 0 0 1 0 6 M18 6.5 a7.5 7.5 0 0 1 0 11"/>') + '</svg>';
  b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Unmute sound' : 'Mute sound'); b.title = on ? 'Sound off (M to unmute)' : 'Sound on (M to mute)';
  syncMusic();
}
$('#muteBtn').addEventListener('click', () => setMuted(!muted));
function syncAudioToggles() { for (const [id, v] of [['musicVol', musicVol], ['sfxVol', sfxVol], ['setMusic', musicVol], ['setSfx', sfxVol]]) { const el = $('#' + id); if (!el) continue; el.value = Math.round(v * 100); el.style.setProperty('--p', el.value + '%'); } }
function setVol(kind, v) {
  v = clamp(v, 0, 1);
  if (kind === 'music') { musicVol = v; musicOff = v === 0; if (musicBus) musicBus.gain.value = v; } else { sfxVol = v; sfxOff = v === 0; if (sfxBus) sfxBus.gain.value = v; }
  try { localStorage.setItem(kind === 'music' ? 'mtd-music' : 'mtd-sfx', String(v)); } catch (e) {}
  syncAudioToggles(); syncMusic();
}
$('#musicVol').addEventListener('input', e => setVol('music', e.target.value / 100));
$('#sfxVol').addEventListener('input', e => setVol('sfx', e.target.value / 100));
$('#sfxVol').addEventListener('change', () => sfx('click'));
$('#setMusic').addEventListener('input', e => setVol('music', e.target.value / 100));
$('#setSfx').addEventListener('input', e => setVol('sfx', e.target.value / 100));
$('#setSfx').addEventListener('change', () => sfx('click'));
syncAudioToggles();
// Graphics: Low / High (both switches, Settings and the pause card, share data-gfx)
function syncGfx() { for (const b of document.querySelectorAll('[data-gfx]')) b.classList.toggle('on', (b.dataset.gfx === 'low') === gfxLow); }
function setGfx(low) {
  gfxLow = low; try { localStorage.setItem('mtd-gfx', low ? 'low' : 'high'); } catch (e) {}
  pixelK = pixelMax(); renderer.setPixelRatio(pixelK); resize(); sun.castShadow = !low; syncGfx();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-gfx]'); if (b) setGfx(b.dataset.gfx === 'low'); });
syncGfx();
addEventListener('keydown', e => { if ((e.key === 'm' || e.key === 'M') && !e.target.closest('input')) setMuted(!muted); });
setMuted(muted);

// ---------- personal space: units ease apart instead of standing inside each other ----------
// villagers and live raiders push each other apart; a raider who has just fallen stays put as an obstacle,
// so a live one never stands in the same spot and looks like he got back up. Nobody is pushed into a building or water.
const sepUnits = [];
// castle and gate doors open while a villager is passing through, then swing shut
function updateDoors(dt) {
  for (const B of buildings) {
    if (B.type !== 'castle' && B.type !== 'gate') continue;
    const g = B.group;
    if (!g.userData.leaves) { const L = []; g.traverse(o => { if (o.userData.leaf !== undefined) L.push(o); }); g.userData.leaves = L; }
    if (!g.userData.leaves.length) continue;
    const p = B.type === 'gate' ? center(B) : innerDoor(B);
    let want = 0;
    if (p && B.built && !B.dead) for (const v of villagers) {
      if (!v.g.visible) continue;
      const d = Math.hypot((v.rx ?? v.x) - p.x, (v.rz ?? v.z) - p.z);
      if (d < 1.7) { want = 1; break; }
    }
    B.doorK = (B.doorK || 0) + (want - (B.doorK || 0)) * Math.min(1, dt * (want ? 6 : 2.5));
    for (const l of g.userData.leaves) l.rotation.y = l.userData.leaf * B.doorK;
  }
}
function separateUnits(dt) {
  sepUnits.length = 0;
  for (const v of villagers) if (v.g.visible && !v.doorWalk && !v.inside && !(v.hideT > 0) && (!v.posted || v.soldier) && !v.sleeping) sepUnits.push({ u: v, r: v.horse ? .5 : .24, fixed: false, mode: 1, w: v.working ? .1 : v.walking ? 1 : .35 });
  for (const e of enemies) sepUnits.push({ u: e, r: e.engine ? ENEMY[e.kind].r : e.horse ? .55 : .26, fixed: e.dead, mode: 2, w: e.walking ? 1 : .35 });
  const k = Math.min(1, dt * 10);
  for (let i = 0; i < sepUnits.length; i++) for (let j = i + 1; j < sepUnits.length; j++) {
    const A = sepUnits[i], B = sepUnits[j]; if (A.fixed && B.fixed) continue;
    let dx = B.u.x - A.u.x, dz = B.u.z - A.u.z; const min = A.r + B.r, d2 = dx * dx + dz * dz;
    if (d2 >= min * min) continue;
    let d = Math.sqrt(d2); if (d < 1e-4) { const a = Math.random() * 6.283; dx = Math.cos(a); dz = Math.sin(a); d = 1; }
    const push = (min - d) * k, nx = dx / d, nz = dz / d, wa = A.fixed ? 0 : A.w, wb = B.fixed ? 0 : B.w, sa = wa / (wa + wb), sb = 1 - sa;
    if (!A.fixed) { const x = A.u.x - nx * push * sa, z = A.u.z - nz * push * sa; if (canStand(x, z, A.mode) && Math.abs(walkY(x, z) - walkY(A.u.x, A.u.z)) < .3) { A.u.x = x; A.u.z = z; } }
    if (!B.fixed) { const x = B.u.x + nx * push * sb, z = B.u.z + nz * push * sb; if (canStand(x, z, B.mode) && Math.abs(walkY(x, z) - walkY(B.u.x, B.u.z)) < .3) { B.u.x = x; B.u.z = z; } }
  }
}

// ---------- juice: camera shake, debris, coins to the counter ----------
var shakeT = 0, shakeAmp = 0;
const shakeV = new THREE.Vector3();
// amp in metres at the camera's focus; fades with distance from it, so far-off hits barely register.
// gap: seconds before another shake of this kind may start (a big raid hits buildings many times a second,
// which kept the screen shaking non-stop); a shake already running is never restarted by a smaller one
var shakeNext = {};
function shake(amp, at, kind = 'hit', gap = 1.5) {
  const now = performance.now() / 1000; if (now < (shakeNext[kind] || 0)) return;
  const near = at ? clamp(1 - Math.hypot(at.x - target.x, at.z - target.z) / 30, 0, 1) : 1;
  const a = amp * near * clamp(dist / 40, .5, 1.5); if (a < .01) return;
  if (shakeT > 0 && a <= shakeAmp * shakeT / .3) return;
  shakeNext[kind] = now + gap; shakeAmp = a; shakeT = .3;
}
function shakeOffset(dt) {
  if (shakeT <= 0) return shakeV.set(0, 0, 0);
  shakeT -= dt; const k = shakeAmp * Math.max(0, shakeT / .3);
  return shakeV.set((Math.random() - .5) * 2 * k, (Math.random() - .5) * k, (Math.random() - .5) * 2 * k);
}
const hitFlashM = new THREE.MeshStandardMaterial({ color: '#ffb0a0', emissive: new THREE.Color('#ff3b2a'), emissiveIntensity: .8, flatShading: true });
const debris = [];
function debrisBurst(B, c) {
  const m = B.tier >= 2 && B.type !== 'house' ? M.stone2 : M.wood, n = B.ev.s > 1 ? 18 : 11, y = B.group.position.y + .8;
  for (let i = 0; i < n; i++) {
    const s = .08 + Math.random() * .14, o = box(s, s * (.6 + Math.random()), s * (.8 + Math.random() * .8), i % 3 ? m : M.timber, c.x + (Math.random() - .5) * B.ev.s, y + Math.random() * .8, c.z + (Math.random() - .5) * B.ev.s);
    scene.add(o); debris.push({ o, vx: (Math.random() - .5) * 5, vy: 3 + Math.random() * 4, vz: (Math.random() - .5) * 5, life: 1.6 + Math.random() * .6, spin: (Math.random() - .5) * 14 });
  }
  for (let i = 0; i < 8; i++) dustAt(c.x + (Math.random() - .5) * B.ev.s * 2, B.group.position.y, c.z + (Math.random() - .5) * B.ev.s * 2);
}
function updateDebris(dt) {
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i], o = d.o; d.life -= dt;
    d.vy -= 14 * dt; o.position.x += d.vx * dt; o.position.y += d.vy * dt; o.position.z += d.vz * dt;
    const g = hAt(o.position.x, o.position.z); if (o.position.y < g) { o.position.y = g; d.vy *= -.25; d.vx *= .5; d.vz *= .5; d.spin *= .5; }
    o.rotation.x += d.spin * dt; o.rotation.z += d.spin * .7 * dt;
    if (d.life < .5) o.scale.setScalar(Math.max(.01, d.life / .5));
    if (d.life <= 0) { scene.remove(o); o.geometry.dispose(); debris.splice(i, 1); }
  }
}
// coins rise from a building and fly to the gold counter, which pulses as they land
let coinsInFlight = 0;
const RES_CHIP = { gold: '#cGold', wood: '#cWood', stone: '#cStone', food: '#cFood' };
function coinFly(x, y, z, n, kind = 'gold') {
  const chip = $(RES_CHIP[kind]); if (!chip || document.hidden) return;
  const p = new THREE.Vector3(x, y, z).project(camera); if (p.z > 1 || Math.abs(p.x) > 1.1 || Math.abs(p.y) > 1.1) return;
  const r = canvas.getBoundingClientRect(), sx = r.left + (p.x + 1) / 2 * r.width, sy = r.top + (1 - p.y) / 2 * r.height;
  const t = chip.getBoundingClientRect(), tx = t.left + 10, ty = t.top + t.height / 2 - 8;
  for (let i = 0; i < n && coinsInFlight < 10; i++) {
    const el = document.createElement('span'); el.className = 'flyCoin'; el.innerHTML = ICON[kind]; document.body.appendChild(el); coinsInFlight++;
    const jx = (Math.random() - .5) * 30, mx = sx + jx + (tx - sx) * .3, my = Math.min(sy, ty) - 40 - Math.random() * 30;
    const a = el.animate([
      { transform: `translate(${sx + jx}px, ${sy}px) scale(.6)`, opacity: 0 },
      { transform: `translate(${mx}px, ${my}px) scale(1.15)`, opacity: 1, offset: .35 },
      { transform: `translate(${tx}px, ${ty}px) scale(.8)`, opacity: 1 },
    ], { duration: 750 + i * 90, easing: 'cubic-bezier(.4,0,.6,1)', delay: i * 70, fill: 'backwards' });
    a.onfinish = () => { el.remove(); coinsInFlight--; chip.classList.remove('pulse'); void chip.offsetWidth; chip.classList.add('pulse'); };
  }
}

// ---------- guided first day: one short step at a time, the button to press pulses; shown once per device ----------
var GUIDE;   // filled per game from the picks (applyLoadout)
var guideOn = false, guideStep = -1, guideEndT = 0;
// (startGame may already have run: a campaign stage after the first keeps its guide off, the tutorial keeps it on)
try { guideOn = MAP === 'vale' || (!CAMP_MAPS[MAP] && localStorage.getItem('mtd-guide') !== 'done'); } catch (e) { guideOn = !CAMP_MAPS[MAP]; }
function guideFinish() { guideOn = false; try { localStorage.setItem('mtd-guide', 'done'); } catch (e) {} guideMark(); }
function guideMark() {
  document.querySelectorAll('.guidePulse').forEach(el => el.classList.remove('guidePulse'));
  const g = $('#guide'); if (!g) return;
  if (!guideOn || gameOver || guideStep < 0) { if (!guideEndT) g.hidden = true; return; }
  const S = GUIDE[guideStep]; g.hidden = false;
  $('#gStep').textContent = `${guideStep + 1}/${GUIDE.length}`; $('#gText').innerHTML = S.text; $('#gSkip').hidden = false;
  if (tool !== S.tool) {
    if (S.cat && cat !== S.cat) { const tab = document.querySelector(`.tab[data-cat="${S.cat}"]`); if (tab) tab.classList.add('guidePulse'); }
    else { const b = document.querySelector(`.tool[data-tool="${S.tool}"]`); if (b) b.classList.add('guidePulse'); }
  }
}
function guideTick() {
  const g = $('#guide'); if (!g) return;
  if (guideEndT && performance.now() > guideEndT) { guideEndT = 0; g.hidden = true; }
  if (!guideOn) return;
  const next = GUIDE.findIndex(S => !S.done());
  // the last step done (Stage 1: the archers): point at Skip day (Jack), which glows until it's pressed or night falls
  if (next < 0) { guideDone = true; $('#gStep').textContent = '✓'; $('#gText').innerHTML = 'When ready, <b>Skip day</b> to face the raiders'; $('#gSkip').hidden = true; guideEndT = performance.now() + 6000; guideFinish(); g.hidden = false; $('#nightBtn').classList.add('skipGlow'); return; }
  if (next !== guideStep) { guideStep = next; guideMark(); }
}
$('#gSkip').addEventListener('click', () => { guideFinish(); $('#guide').hidden = true; });

// every 3 s: if frames averaged over 24 ms (under ~40 fps), drop the resolution half a step, down to 1.5× at most
function adaptResolution(raw) {
  if (raw > .2) return;                          // a hidden tab or a stall, not the render cost
  fpsAcc += raw; fpsN++;
  if (fpsAcc < 3) return;
  const ms = fpsAcc / fpsN * 1000; fpsAcc = fpsN = 0;
  if (ms > 24 && pixelK > 1.5) { pixelK = Math.max(1.5, pixelK - .5); renderer.setPixelRatio(pixelK); resize(); }
}
// a title screen, map or town picker, campaign or stage preview, or the new-building cards is up: the game underneath stands still
// (setPaused(false) at startup used to set it running under the title screen, paying out gold)
const MENUS = ['#mapPick', '#loadPick', '#campaign', '#newCards', '#upPick', '#achPick'].map(q => $(q));
const menuOn = () => MENUS.some(m => !m.hidden);
const mapPickEl = $('#mapPick'), campEl = $('#campaign'), loadEl = $('#loadPick'), upEl = $('#upPick'), achEl = $('#achPick'); let liteN = 0;
mapPickEl.addEventListener('click', e => { if (showcaseBuilt && !e.target.closest('button') && !e.target.closest('#colCard')) nextShowcase(); });   // a tap off the cards and buttons: the next scene (Jack)
// one step of the game itself (no camera, no drawing): frame runs it every animation frame; tools/test runs it in a loop to play fast
function tick(dt, now) {
  const gdt = dt * gameSpeed;            // game time runs faster at 2×; the camera does not
  if (!gameOver) stats.playT = (stats.playT || 0) + dt;   // time spent playing (never paused or under a menu): a stage's best win time
  if (gameOver && endCheer > 0) {
    endCheer -= gdt; updateVillagers(gdt, now); updateEnemies(gdt); updateFallen(gdt); separateUnits(gdt); updateDoors(gdt);
    // a win: the camera drifts to the castle to watch the town come out (the last raider may have fallen anywhere)
    const C = endDawn && castleB(); if (C) { const c = center(C), k = 1 - Math.exp(-gdt * .6); target.x += (c.x - target.x) * k; target.z += (c.z - target.z) * k; updateCam(); }
  }   // the town's cheer before the summary
  if (!gameOver) { updatePhase(gdt); updateVillagers(gdt, now); updateEco(gdt); updateMoves(gdt); updateEnemies(gdt); updateDefense(gdt); separateUnits(gdt); updateDoors(gdt); updateFallen(gdt); updateChips(gdt); updateSplashes(gdt); }
  updateArrows(gdt); updateAmbience(dt); updateVolley(gdt); updateTrees(now); emitSmoke(gdt); updateBirds(gdt); if (holdRiders.length) { animHoldRiders(now / 1000, gdt); updateHoldTrebs(gdt); }
  if (anims.length) {
    for (let n = anims.length - 1; n >= 0; n--) { const a = anims[n], t = clamp((now - a.t0) / a.dur, 0, 1); applyPlan(a.plan, easeOut(t)); if (t >= 1) anims.splice(n, 1); }
    syncTerrain();
    if (cur && DEF[tool] && ghosts[tool] && ghosts[tool].visible) drape(footLine, cur.x0, cur.z0, cur.x1, cur.z1);
    if (selected) drape(selLine, selected.ev.x0 - .1, selected.ev.z0 - .1, selected.ev.x1 + .1, selected.ev.z1 + .1);
  }
  if ((buildT -= dt) <= 0) { buildT = .5; if (!gameOver) { assignBuilders(); if (PH.kind === 'day') assignJobs(); } }
  for (const B of buildings.slice()) {
    if (B.site) {
      const p = clamp(B.site.progress, 0, 1);
      if (B.site.kind === 'new') B.group.scale.y = .08 + .92 * p;
      if (B.site.kind === 'repair') B.hp = B.site.hp0 + (B.max - B.site.hp0) * p;
      B.pbar.grp.visible = true; B.pbar.set(Math.max(p, .02)); B.pbar.fg.material.color.set(B.site.kind === 'repair' ? '#8cc46e' : '#e0b84a');
      B.pbar.grp.position.set(center(B).x, B.group.position.y + barTop(B) + .3, center(B).z);
      if (p >= 1) completeSite(B);
    }
    if (B.pop) { const t = clamp((now - B.pop) / 450, 0, 1), k = 1 + .09 * Math.sin(t * Math.PI) * (1 - t); B.group.scale.x = B.group.scale.z = k; if (t >= 1) { B.group.scale.x = B.group.scale.z = 1; B.pop = 0; } }
    if (B.rise) { const t = clamp((now - B.rise.t0) / 420, 0, 1); B.group.scale.y = Math.max(.001, lerp(B.rise.from, 1, easeOut(t))); if (t >= 1) B.rise = null; }
    const c = center(B);
    B.bar.grp.visible = B.hp < B.max; B.bar.set(B.hp / B.max); B.bar.grp.position.set(c.x, B.group.position.y + barTop(B), c.z);
  }
  for (let n = floats.length - 1; n >= 0; n--) { const f = floats[n]; const L = f.life || 1.8; f.t += dt; f.sp.position.y += dt * (L > 2 ? .25 : .9); f.sp.material.opacity = L > 2 ? 1 - sstep(L - 1.5, L, f.t) : 1 - f.t / L; if (f.t > L) { scene.remove(f.sp); f.sp.material.dispose(); floats.splice(n, 1); } }
}
function frame(now) {
  adaptResolution((now - last) / 1000);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  keyCamera(dt);
  if (galleryOn) { updateGallery(dt, now); renderer.render(gScene, camera); requestAnimationFrame(frame); return; } updateLamps(dt, now); updateLight(dt, now); updateWeather(dt, !paused && !menuOn() && !gameOver);
  const sc = showcaseBuilt && (!mapPickEl.hidden || !campEl.hidden || !loadEl.hidden || !upEl.hidden || !achEl.hidden); if (sc !== document.body.classList.contains('showcase')) document.body.classList.toggle('showcase', sc);
  // the title's showcase town: the camera circles slowly. It looks a little beyond the town, so the town sits low on the screen,
  // under the cards (an off-centre lens did that before and skewed the picture: Jack found it squeezed); on a wide screen the view
  // is narrowed to about 64 degrees across (45 degrees up and down gave nearly 90 across a laptop: wide-angle smear at the sides)
  // and the camera steps back to keep the town the same size
  if (sc) {
    showPh += dt * .03; const S = SHOW_SCENES[showScene]; yaw = S.swing ? showYaw0 + Math.sin(showPh * 2) * S.swing : showYaw0 + showPh;
    const asp = innerWidth / innerHeight, fov = clamp(2 * Math.atan(Math.tan(.56) / asp) * 180 / Math.PI, 30, 45);
    if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    dist = showDist * Math.tan(Math.PI / 8) / Math.tan(fov * Math.PI / 360);
    const ahead = dist * (asp < 1 ? .3 : .12);
    target.set(showC.x - Math.sin(yaw) * ahead, showC.y, showC.z - Math.cos(yaw) * ahead);
    updateCam(); updateTrees(now); emitSmoke(dt); updateBirds(dt); if ((showT += dt) > SHOW_T) nextShowcase();
  } else if (camera.fov !== 45) { camera.fov = 45; camera.updateProjectionMatrix(); }
  // behind the campaign and the town picker the scene is darkened under panels: drawn at 1x pixels and every other frame, so the
  // phone keeps its time for the cards (Jack found the carousel slow to answer); full detail again on the title and in the game
  const lite = sc && (!campEl.hidden || !loadEl.hidden || !upEl.hidden || !achEl.hidden), pr = lite ? Math.min(pixelK, 1) : pixelK;
  // (a resize clears the canvas, so that frame is always drawn: a skipped one showed a blank canvas for a moment)
  let fresh = false; if (renderer.getPixelRatio() !== pr) { renderer.setPixelRatio(pr); resize(); fresh = true; }
  if (paused || menuOn()) { if (!lite || fresh || (liteN = (liteN + 1) % 2) === 0) renderer.render(scene, camera); requestAnimationFrame(frame); if ((hudT -= dt) <= 0) { hudT = .2; updateHud(); } return; }
  tick(dt, now);
  if ((hudT -= dt) <= 0) { hudT = .2; updateHud(); guideTick(); goalTick(); updatePowers(); updateBossBar(); }
  updateDebris(dt); updateRaidMarks(dt); updateHitMarks(dt, now); updateTips(dt); updateGuideSpot(now);
  const sh = shakeOffset(dt); camera.position.add(sh);
  renderer.render(scene, camera);
  camera.position.sub(sh);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (/[?&]gallery\b/.test(location.search)) openGallery();
// dev hook: open with ?debug to evaluate code inside the game scope from the console (window.G('dist=20;updateCam()'))
if (/[?&]debug\b/.test(location.search)) window.G = s => eval(s);
})();
