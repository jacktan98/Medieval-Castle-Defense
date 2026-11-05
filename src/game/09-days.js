// ---------- economy ----------
const farmersAt = B => villagers.filter(v => v.job === B && !v.build && !v.hungry && !v.post).length;
function econTick() {
  for (const B of buildings) {
    if (!B.built) continue;
    const c = center(B), T = DEF[B.type];
    if (T.field) {                    // food by farmers at work: a Manor farm with 1 of its 2 farmers makes half
      const k = B.tier - 1, raw = T.food[k] * farmersAt(B) / T.workers[k] * prodK(B), f = Math.floor(raw) + (Math.random() < raw % 1 ? 1 : 0);
      if (f) { res.food += f; stats.food += f; floatRes('food', f, c.x, B.group.position.y + 1.6, c.z); }
    }
    if (B.type === 'castle') {
      const g = T.gold[B.tier - 1], f = T.food[B.tier - 1]; res.gold += g; stats.gold += g; res.food += f; stats.food += f;
      floatRes('gold', g, c.x, B.group.position.y + 7.2, c.z); floatRes('food', f, c.x, B.group.position.y + 6.4, c.z); coinFly(c.x, B.group.position.y + 5, c.z, 3);
    }
    if (B.type === 'house') {
      const rs = villagers.filter(v => v.home === B); if (!rs.length) continue;
      const awake = rs.filter(v => !v.hungry).length / rs.length, y = B.group.position.y + 2.6;
      if (!awake) { floatText('Hungry', '#e2715b', c.x, y, c.z); continue; }
      const raw = T.gold[B.tier - 1] * (1 + charmOf(B)) * awake, g = Math.floor(raw) + (Math.random() < raw % 1 ? 1 : 0);
      if (g) { res.gold += g; stats.gold += g; floatRes('gold', g, c.x, y, c.z); coinFly(c.x, y, c.z, 1); }
    }
  }
  sfx('coins');
}
// villagers eat 1 wheat every MEAL seconds of daylight; with none in store they go home and sleep until there is
let hungryLogT = 0, newlyHungry = 0;
function feedVillager(v, dt) {
  if (v.hungry) return;
  if ((v.mealT = (v.mealT ?? 15 + Math.random() * 30) - dt) > 0) return;
  if (res.food >= 1) { res.food -= 1; stats.eaten = (stats.eaten || 0) + 1; v.mealT = MEAL * (.85 + Math.random() * .3); return; }
  v.hungry = true; newlyHungry++; release(v); v.visit = null; v.path = null;
  if (v.job && DEF[v.job.type].field) v.job = null;    // a hungry farmer leaves the field, so someone else takes it over at once
  if (v.build) v.build = null;
  floatText('Hungry', '#e2715b', v.x, hAt(v.x, v.z) + 1.6, v.z);
}
function updateHungry(v, dt) {
  if (v.sleeping) {
    if (res.food >= 1) { res.food -= 1; v.hungry = v.sleeping = false; v.mealT = MEAL; exitDoor(v); v.state = v.job ? 'commute' : 'find'; }
    return;
  }
  const H0 = v.home && !v.home.dead ? v.home : castleB();
  if (v.hideT > 0) { v.hideT = 0; }
  if (!v.g.visible && !v.hideT) exitDoor(v);
  const dp = doorPoint(H0);
  if (walkTo(v, dp.x, dp.z, dt, 1, .4, .8) || nearDoor(v, H0, dp) || v.noProg > 6) {
    v.sleeping = true; v.indoor = H0; goIn(v, H0); sfx('yawn', dp); floatText('Zzz', '#bcd0ff', dp.x, hAt(dp.x, dp.z) + 1.8, dp.z);
  }
}

// ---------- phases ----------
const bannerEl = $('#banner'); let bannerTimer = 0;
function banner(title, sub, night) {
  bannerEl.innerHTML = `${title}<small>${sub}</small>`; bannerEl.className = 'banner show' + (night ? ' night' : '');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => bannerEl.classList.remove('show'), 3200);
}
// the coming night's two spawn points, picked at dawn (and at the start) so their marks can show all day; a point built over since
// is picked again at nightfall
var nextPts = null;
function nightPts() { if (!nextPts) nextPts = [edgePoint(0), edgePoint(1)]; return nextPts; }
// two crossed falchions (Jack's sketch: a broad blade with a straight back and a curved edge sweeping up to the tip, a crossguard, a short grip)
const RAID_ICO = '<svg viewBox="0 0 24 24" class="swords"><g transform="translate(12 11.6) scale(.76) rotate(44)"><g transform="translate(0 7.6)"><path class="bl" d="M-.6 0 V-15 Q-.6 -17.8 1.15 -18.3 Q1.3 -9.5 .6 0 Z"/><path class="hl" d="M-3.4 .15 L3.4 -.15"/><path class="hl" d="M-.8 .25 V3.4 H.8 V.25"/><circle class="hl" cx="0" cy="4.3" r=".75"/></g></g><g transform="translate(12 11.6) scale(-.76 .76) rotate(44)"><g transform="translate(0 7.6)"><path class="bl" d="M-.6 0 V-15 Q-.6 -17.8 1.15 -18.3 Q1.3 -9.5 .6 0 Z"/><path class="hl" d="M-3.4 .15 L3.4 -.15"/><path class="hl" d="M-.8 .25 V3.4 H.8 V.25"/><circle class="hl" cx="0" cy="4.3" r=".75"/></g></g></svg><span class="arr"></span>';
const WAVE_ORDER = ['ram', 'ballista', 'catapult', 'spear', 'sword', 'archer', 'xbow', 'lancer', 'rider', 'chief', 'warlord'];
function wavePopHTML() {
  const w = WAVES[PH.wave - 1] || {}, rows = [];
  for (const k of WAVE_ORDER) { const by = [0, 0, 0]; (w[k] || []).forEach((c, t) => { by[Math.min(2, t + (hardOn && !ENEMY[k].boss ? 1 : 0))] += c; });   // hard mode: a tier up
    by.forEach((c, t) => { if (!c) return; const nm = RAIDER_NAME[k], name = Array.isArray(nm) ? nm[t] : nm;
    rows.push(`<div class="${ENEMY[k].boss ? 'boss' : ''}"><span>${name}${!Array.isArray(nm) && !ENEMY[k].boss && t ? `<i>${['', 'II', 'III'][t]}</i>` : ''}</span><b>${c}</b></div>`); }); }
  return `<h4>Night ${PH.wave}${hardOn ? ' · Hard' : ''}</h4>${rows.join('')}`;
}
let markRect = null, markRectT = 0;
// the band the edge marks may use: below the top panel, above the dock (measured every .5 s)
function markBand(dt) {
  if ((markRectT -= dt) <= 0 || !markRect) {
    markRectT = .5; const top = document.querySelector('.panel').getBoundingClientRect(), dock = document.querySelector('.dock').getBoundingClientRect();
    markRect = { x0: 24, x1: innerWidth - 24, y0: (top.bottom < innerHeight / 2 && top.right > innerWidth / 2 ? top.bottom : 60) + 26, y1: Math.min(innerHeight, dock.top) - 26 };
  }
  return markRect;
}
// a world point on screen, or held to the band's edge along the line from the middle toward it (edge: true, a: the angle toward it)
function edgeSpot(x, y, z, R) {
  const v = new THREE.Vector3(x, y, z).project(camera), cx = innerWidth / 2, cy = (R.y0 + R.y1) / 2;
  let sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight; const behind = v.z > 1;
  if (behind) { sx = innerWidth - sx; sy = innerHeight - sy; }
  const edge = behind || sx < R.x0 || sx > R.x1 || sy < R.y0 || sy > R.y1, dx = sx - cx, dy = sy - cy || .001;
  if (edge) { const k = Math.min(Math.abs((dx > 0 ? R.x1 - cx : R.x0 - cx) / (dx || .001)), Math.abs((dy > 0 ? R.y1 - cy : R.y0 - cy) / dy)); sx = cx + dx * Math.min(1, k); sy = cy + dy * Math.min(1, k); }
  return { x: sx, y: sy, edge, a: Math.atan2(dy, dx) };
}
// buildings hit in the last 2.5 s that are out of view: up to three red pointers at the edge (near ones grouped); a tap looks there
const hitEls = [...document.querySelectorAll('.hitMark')];
hitEls.forEach(e => e.addEventListener('click', () => { const t = e._at; if (t) { target.x = t.x; target.z = t.z; updateCam(); sfx('click'); } }));
function updateHitMarks(dt, now) {
  const on = PH.kind === 'night' && !gameOver && !menuOn() && !galleryOn && !showcaseBuilt;
  const spots = [];
  if (on) { const R = markBand(dt);
    for (const B of buildings) if (B.hitT && now - B.hitT < 2500 && !B.dead) {
      const c = center(B); if (spots.some(q => Math.hypot(q.wx - c.x, q.wz - c.z) < 10)) continue;
      const sp = edgeSpot(c.x, B.group.position.y + 1, c.z, R); if (sp.edge) spots.push({ ...sp, wx: c.x, wz: c.z });
      if (spots.length >= 3) break;
    } }
  hitEls.forEach((e, i) => { const q = spots[i]; e.hidden = !q; if (!q) return; e._at = { x: q.wx, z: q.wz };
    e.style.setProperty('--p', `translate(${q.x}px, ${q.y}px)`); e.style.setProperty('--a', q.a + 'rad'); e.style.transform = `translate(${q.x}px, ${q.y}px)`; });
}
// ---------- one-time tips: the first time a mechanic matters, one line above the dock for 6 s (seen ones kept in 'mtd-tips') ----------
var TIPS_SEEN = {}; try { TIPS_SEEN = JSON.parse(localStorage.getItem('mtd-tips') || '{}') || {}; } catch (e) {}
let tipQ = [], tipT = 0;
function tipOnce(key, html) {
  if (TIPS_SEEN[key] || showcaseBuilt || galleryOn || tipQ.some(q => q[0] === key)) return;
  TIPS_SEEN[key] = 1; try { localStorage.setItem('mtd-tips', JSON.stringify(TIPS_SEEN)); } catch (e) {}
  tipQ.push([key, html]);
}
function updateTips(dt) {
  const el = $('#tipPill');
  if (menuOn() || gameOver) { el.hidden = true; return; }
  if (tipT > 0 && (tipT -= dt) > 0) { const d = document.querySelector('.dock').getBoundingClientRect(), pw = $('#powers'); el.style.bottom = (innerHeight - Math.min(d.top, pw.hidden ? 1e9 : pw.getBoundingClientRect().top) + 10) + 'px'; return; }
  el.hidden = true; if (!tipQ.length || paused) return;
  const [, html] = tipQ.shift(); el.innerHTML = html; el.hidden = false; tipT = 6; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
}
// the tutorial's build steps: where that building would do well (near the castle; lumber by trees; archers toward the raiders),
// shown as soft gold tiles over the cells it would take, a small gap between them like the grid (Jack: a grid, not a circle,
// and not too bright); rebuilt whenever the step changes, so a spot never lingers where something now stands
const guideTiles = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: '#e9c76a', transparent: true, opacity: .25, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
guideTiles.renderOrder = 2; guideTiles.frustumCulled = false; guideTiles.visible = false; scene.add(guideTiles);
let guideSpotFor = -1;
function tileSpot(ev) {
  const pos = [], K = 4, inset = .12;
  for (let cz = ev.z0; cz < ev.z1 - .01; cz += CELL) for (let cx = ev.x0; cx < ev.x1 - .01; cx += CELL) {
    const x0 = cx + inset, z0 = cz + inset, w = CELL - 2 * inset, P = (i, j) => { const x = x0 + w * i / K, z = z0 + w * j / K; return [x, Math.max(hAt(x, z), 0) + .07, z]; };
    for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) pos.push(...P(i, j), ...P(i + 1, j), ...P(i, j + 1), ...P(i + 1, j), ...P(i + 1, j + 1), ...P(i, j + 1));
  }
  guideTiles.geometry.dispose(); guideTiles.geometry = new THREE.BufferGeometry(); guideTiles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
}
function updateGuideSpot(now) {
  const S = guideOn && !gameOver && guideStep >= 0 && GUIDE[guideStep], t = S && S.tool && DEF[S.tool] ? S.tool : null;
  if (!t || menuOn() || PH.kind !== 'day') { guideTiles.visible = false; guideSpotFor = -1; return; }
  if (guideSpotFor !== guideStep) {
    guideSpotFor = guideStep; guideTiles.visible = false; const K = castleB(); if (!K) return; const c = center(K); let tx = c.x, tz = c.z + 6;
    if (t === 'lodge' || t === 'forester') { let best = null, bd = 1e9; for (const T of trees) if (!T.deco && !T.cut) { const d = Math.hypot(T.x - c.x, T.z - c.z); if (d > 8 && d < bd) { bd = d; best = T; } } if (best) { tx = lerp(c.x, best.x, .65); tz = lerp(c.z, best.z, .65); } }
    else if (DEF[t].archers || DEF[t].crew) { const p = nightPts()[0]; const d = Math.hypot(p.x - c.x, p.z - c.z) || 1; tx = c.x + (p.x - c.x) / d * 7; tz = c.z + (p.z - c.z) / d * 7; }
    else if (t === 'farm' || t === 'farmhouse') { tx = c.x - 6; tz = c.z + 3; }
    else { tx = c.x + 4; tz = c.z + 3; }
    const ev = findValid(t, Math.floor(tx / CELL), Math.floor(tz / CELL), { free: true });
    if (!ev) return;
    tileSpot(ev); guideTiles.visible = true;
  }
  if (guideTiles.visible) guideTiles.material.opacity = .2 + .1 * Math.sin(now / 320);
}
function updateRaidMarks(dt) {
  // only from dusk (Jack): by day the coming night's points stay hidden
  const show = PH.kind === 'day' && PH.t <= DUSK && !gameOver && !menuOn() && !galleryOn && !showcaseBuilt && !!castleB();
  const m = [$('#raidMark0'), $('#raidMark1')];
  if (!show) { m.forEach(e => e.hidden = true); $('#wavePop').hidden = true; return; }
  const P = nightPts();
  const R = markBand(dt);
  P.forEach((p, i) => {
    const e = m[i]; if (!e.innerHTML) { e.innerHTML = RAID_ICO; e.addEventListener('click', () => { sfx('click'); const pop = $('#wavePop'); if (!pop.hidden && pop.dataset.i === String(i)) { pop.hidden = true; return; } pop.innerHTML = wavePopHTML(); pop.dataset.i = i; pop.hidden = false; placePop(e); }); }
    if (i === 1 && Math.hypot(P[0].x - p.x, P[0].z - p.z) < 3) { e.hidden = true; return; }   // both at one spot: one mark
    const q = edgeSpot(p.x, walkY(p.x, p.z) + 1, p.z, R);
    if (q.edge) e.style.setProperty('--a', q.a + 'rad');
    e.classList.toggle('edge', q.edge); e.hidden = false; e.style.transform = `translate(${q.x}px, ${q.y}px)`;
    if (PH.wave > 1 || !guideOn) tipOnce('marks', 'Tap a <b>Red mark</b> to see the raiders coming that night');
  });
  const pop = $('#wavePop'); if (!pop.hidden) placePop(m[+pop.dataset.i]);
}
function placePop(e) {
  const pop = $('#wavePop'), r = e.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
  pop.style.top = (r.top - h - 10 > 70 ? r.top - h - 10 : Math.min(r.bottom + 10, innerHeight - h - 8)) + 'px';
}
document.addEventListener('pointerdown', e => { if (!e.target.closest('.raidMark,.wavePop')) $('#wavePop').hidden = true; }, true);
function startNight() {
  $('#nightBtn').classList.remove('skipGlow');
  const w = WAVES[PH.wave - 1];
  PH.kind = 'night'; spawnQueue = []; sfx('horn');
  const pts = nightPts().map((p, i) => cellPass(cellAt(p.x, p.z), 2) ? p : edgePoint(i)); nextPts = null;
  tipOnce('volley', 'Tap <b>Arrow volley</b>, then tap the raiders'); tipOnce('riders', 'Tap <b>Riders</b> to call two horsemen from the castle');
  // siege engines at the head of the column (Jack: they are slow, so they set off first), then foot and horse mixed (spearmen first),
  // bosses last of all; each entry [kind, spawn point, tier]
  // hard mode: every raider a tier up (tier 3 stays 3)
  const each = (k, f) => (w[k] || []).forEach((c, t) => { for (let n = 0; n < c; n++) f(Math.min(3, t + 1 + (hardOn && !ENEMY[k].boss ? 1 : 0)), n); });
  each('spear', (t, n) => spawnQueue.push(['spear', pts[n % 2], t]));
  for (const k of ['archer', 'sword', 'xbow', 'lancer', 'rider']) each(k, (t, n) => spawnQueue.splice(Math.floor(Math.random() * (spawnQueue.length + 1)), 0, [k, pts[n % 2], t]));
  const siege = []; for (const k of ['ram', 'ballista', 'catapult']) each(k, (t, n) => siege.push([k, pts[n % 2], t]));
  spawnQueue.unshift(...siege);
  for (const k of ['chief', 'warlord']) each(k, (t, n) => spawnQueue.push([k, pts[n % 2], t]));
  spawnT = 1;
  const ps = assignPosts();
  banner(`Night ${PH.wave}`, `${spawnQueue.length} raiders`, true); setMusic('night');
  log(`<b>Night ${PH.wave}</b> · ${spawnQueue.length} raiders · ${ps.posted} on guard`, 'warn');
}
// ---------- a save at every dawn (one slot, localStorage 'mtd-save'): the town is rebuilt on the same seeded map by resumeGame ----------
function saveGame() {
  if (gameOver || showcaseBuilt || galleryOn || !castleB()) return;
  const S = { v: 1, map: MAP, seed: gameSeed, hard: !!hardOn, wave: PH.wave, t: PH.t, res: { ...res }, stats: { ...stats, t0: 0 }, goalsMet, guideDone, guideOn,
    cats: CATS, road: [...road.slice(0, N * N)].map((r, i) => r ? i : -1).filter(i => i >= 0), rocks: rocks.map(q => q.amount),
    b: buildings.filter(B => !B.dead).map(B => ({ t: B.type, ci: B.ev.ci, cj: B.ev.cj, f: B.face || 0, r: B.rot || 0, rf: !!B.rotFixed, tier: B.tier, hp: Math.round(B.hp),
      site: B.site && B.site.kind !== 'repair' ? { kind: B.site.kind, p: B.site.progress, time: B.site.time } : null, rally: B.rally || null })) };
  try { localStorage.setItem('mtd-save', JSON.stringify(S)); } catch (e) {}
}
function loadSave() { try { const S = JSON.parse(localStorage.getItem('mtd-save') || 'null'); return S && S.v === 1 && S.b ? S : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem('mtd-save'); } catch (e) {} syncResumeBtn(); }
const saveName = S => { const st = CAMPAIGN.findIndex(c => c.map === S.map); return (st >= 0 ? `Stage ${st + 1} · ${CAMPAIGN[st].name}` : { meadow: 'Meadow', isle: 'River isle', pass: 'Mountain pass' }[S.map] || S.map) + ` · Day ${S.wave}`; };
// a gold Resume button with the saved game's stage and day as a line under it, outside the button (Jack)
function syncResumeBtn() { const S = loadSave(), b = $('#saveResume'), i = $('#saveInfo'); if (!b) return; b.hidden = i.hidden = !S; if (S) i.textContent = saveName(S); }
function resumeGame() {
  const S = loadSave(); if (!S) return;
  ['#mapPick', '#campaign', '#loadPick'].forEach(q => $(q).hidden = true);
  MAP = S.map; nextSeed = S.seed; hardOn = !!S.hard; paused = false; startGame();
  $('#newCards').hidden = true; newCards = []; paused = false;
  // what the start placed (the castle, a stage's old walls and houses) is kept where the save has it, and removed where it doesn't
  const key = (t, ci, cj) => t + '@' + ci + ',' + cj, have = new Map(buildings.map(B => [key(B.type, B.ev.ci, B.ev.cj), B])), keep = new Set();
  const pf = placeFace, pr = placeRot;
  for (const E of S.b) {
    let B = have.get(key(E.t, E.ci, E.cj));
    if (!B) { placeFace = E.f; placeRot = E.r; B = place(E.t, E.ci, E.cj, { instant: !E.site || E.site.kind !== 'new', free: true, quiet: true, silent: true }); }
    if (!B) continue; keep.add(B);
    const T = DEF[E.t];
    if (E.tier > 1) { B.tier = E.tier; B.max = T.hp[E.tier - 1]; swapModel(B); settleBase(B); }
    B.hp = Math.min(B.max, E.hp); B.rot = E.r; B.rotFixed = E.rf;
    if (E.site && E.site.kind === 'new' && B.site) B.site.progress = E.site.p;
    if (E.site && E.site.kind === 'up') { B.site = { kind: 'up', progress: E.site.p, time: E.site.time }; addScaffold(B); }
    if (E.rally && T.soldiers) setRally(B, E.rally);
  }
  placeFace = pf; placeRot = pr;
  for (const B of buildings.slice()) if (!keep.has(B) && B.type !== 'castle') removeBuilding(B, false, true);
  for (const B of buildings) if (B.built) syncResidents(B);
  road.fill(0); for (const n of S.road) if (!occB[n] || occB[n].type === 'gate') road[n] = 1;
  S.rocks.forEach((a, i) => { if (rocks[i]) rocks[i].amount = a; }); seatRocks();
  refreshWalls(); rebuildRoads(); regionDirty = true;
  Object.assign(res, S.res); stats = { ...S.stats, t0: performance.now() - (S.stats.playT || 0) * 1000 }; goalsMet = S.goalsMet || {}; guideDone = !!S.guideDone; guideOn = !!S.guideOn; guideMark();
  if (S.cats) { Object.assign(CATS, S.cats); renderTools(); }
  PH = { kind: 'day', wave: S.wave, t: S.t }; nextPts = null; startRepairs(); assignJobs();
  const K = castleB(); if (K) { const c = center(K); target.set(c.x, 2, c.z); updateCam(); }
  $('#log').innerHTML = ''; log(`Survive <b>${NIGHTS} nights</b>`); log(`<b>Day ${S.wave}</b> · resumed`, 'good'); banner(`Day ${S.wave}`, 'Resumed');
  goalsKey = ''; renderGoals();
}
function startDay() {
  const test = PH.testDay; PH.testDay = undefined; nextPts = null;   // the end of an admin test raid: back to the same day, the wave not used up
  sfx('rooster'); if (test === undefined) PH.wave++; PH.kind = 'day'; PH.t = test !== undefined ? Math.max(test, DUSK + 5) : DAYLEN[PH.wave - 1];
  for (const v of villagers) if (v.climb && v.climb.up) { v.climb.up = false; v.post = null; v.posted = false; }   // dawn caught them on the way up: back down
  for (const v of villagers) if (v.post) {
    if (v.summoned) { v.foe = null; v.path = null; v.prog = null; continue; }
    if (v.soldier) { v.unkit = v.post.B; v.posted = false; v.prog = null; v.path = null; }     // walk back to the barracks to change
    else if (v.kitT > 0) { v.kitT = 0; v.posted = false; if (!v.g.visible || v.doorWalk) { v.indoor = v.post.B; exitDoor(v); } }   // dawn caught them changing
    else if (v.posted) {                                           // out of the post itself, back in their own clothes
      v.posted = false; const B = v.post.B, f = DEF[B.type].crew && B.figs && B.figs[v.post.a];
      if (v.crewOf) {                                              // a catapult's crew: off the engine's tile and change back where they stand
        const p = standNear(v.x, v.z); v.x = p.x; v.z = p.z; v.inside = false; v.indoor = null; v.hideT = 0; v.path = null;
        if (B.figs) B.figs[v.post.a] = null; v.crewOf = null; v.crewT = 0; v.crewStrip = v.kit ? CHANGE_T : 0; v.state = v.build ? 'tobuild' : v.job ? 'commute' : 'find';
      }
      else if (DEF[B.type].back && onLadder(B) && B.door) {          // down the ladder again, then off to the day's work
        const L = innerDoor(B); v.x = v.rx = L.x; v.z = v.rz = L.z; v.inside = false; v.indoor = null; v.hideT = 0; v.doorWalk = null; v.path = null;
        v.g.visible = false; v.climb = { B, a: v.post.a, up: false, y: climbH(B, L), wait: v.post.a * 1.4 };   // one at a time down the ladder
      }
      else if (f && f.g.visible) { v.inside = false; v.indoor = null; v.hideT = 0; v.doorWalk = null; const p = standNear(f.g.position.x, f.g.position.z); v.x = v.rx = p.x; v.z = v.rz = p.z; v.g.visible = true; v.path = null; v.state = v.build ? 'tobuild' : v.job ? 'commute' : 'find'; v.wait = 0; }
      else { v.inside = true; v.indoor = B; }                       // from a tower or the castle: out of its door
    }
    v.post = null;
  }
  for (const B of buildings) { B.manned = []; hideDefenders(B); }
  const hurt = startRepairs();
  banner(`Day ${PH.wave}`, hurt ? `${hurt} to repair` : 'Wave held'); setMusic('day');
  for (const v of villagers) v.cheerT = 2.6;   // the town cheers as everyone comes out
  log(`<b>Wave ${PH.wave - 1} held</b>${hurt ? ` · ${hurt} to repair` : ''}`, 'good');
  if (test === undefined) { saveGame(); log('Saved'); }
}
function endGame(won) {
  if (gameOver) return; gameOver = true; clearSave(); setMusic(won ? 'victory' : 'defeat');
  const el = (performance.now() - stats.t0) / 1000;
  $('#sumTitle').textContent = won ? 'The town holds' : 'The castle has fallen';
  $('#sumTitle').className = won ? '' : 'lost';
  $('#sumText').textContent = won ? `All ${NIGHTS} waves held.` : `Fell on night ${PH.wave}.`;
  // only the numbers that tell the story (it listed twelve: built, standing, wood, stone, food... were noise)
  const rows = [['Raiders slain', stats.slain], ['Buildings lost', stats.lost], ['Soldiers lost', stats.fallen], ['Gold earned', stats.gold], ['Time', fmt(stats.playT || el)]];
  $('#sumStats').innerHTML = rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
  // stars: one for holding out, two with some of the goals, three with all of them (kept per map, the best one; to be spent later)
  // a campaign stage: a win is one star and each of its two goals one more (Jack); free play keeps its three goals (all = 3, some = 2)
  const C = castleB(), camp = stageGoals(MAP).length > 0;
  // a defeat meets no goals (a ✓ on "No buildings lost" read oddly with the castle fallen)
  const goals = !won ? (camp ? stageGoals(MAP).map(g => [g[0], false]) : [['No buildings lost', false], ['No soldiers lost', false], ['Castle above half', false]]) : camp ? stageGoals(MAP).map(g => [g[0], goalOk(g)]) : [['No buildings lost', stats.lost === 0], ['No soldiers lost', stats.fallen === 0], ['Castle above half', !!C && C.hp >= C.max / 2]];
  const got = goals.filter(g => g[1]).length, n = !won ? 0 : camp ? 1 + got : got === goals.length ? 3 : got ? 2 : 1;
  $('#sumStars').innerHTML = starsHTML(0);
  const tip = won ? '' : defeatTip(); $('#sumTip').hidden = !tip; $('#sumTip').innerHTML = tip ? `<b>Tip:</b> ${tip}` : '';
  $('#sumGoals').innerHTML = [['Survive', won], ...goals].map(([t, ok]) => `<li class="${ok ? 'ok' : ''}"><b>${ok ? '✓' : '–'}</b>${t}</li>`).join('');
  if (n > (STARS[MAP] || 0)) { STARS[MAP] = n; try { localStorage.setItem('mtd-stars', JSON.stringify(STARS)); } catch (e) {} }
  if (won && hardOn && !CROWNS[MAP]) { CROWNS[MAP] = 1; try { localStorage.setItem('mtd-crowns', JSON.stringify(CROWNS)); } catch (e) {} }
  if (won && hardOn) $('#sumText').innerHTML = `All ${NIGHTS} waves held · <b class="hardTag">${CROWN_ICO} Hard</b>`;
  if (won && stats.playT && !(BEST[MAP] <= stats.playT)) { BEST[MAP] = Math.round(stats.playT); try { localStorage.setItem('mtd-best', JSON.stringify(BEST)); } catch (e) {} }
  // Jack: not straight to the summary; a pause on the field first, then the stars pop in one at a time (a sound per star: SND.star, Star_sound.mp3)
  sumTimers.push(setTimeout(() => {
    $('#summary').hidden = false;
    const el = [...$('#sumStars').querySelectorAll('span span')];
    for (let i = 0; i < n; i++) sumTimers.push(setTimeout(() => { el[i].classList.add('on', 'pop'); sfx('star'); }, 650 + i * 650));
  }, won ? 2200 : 2600));
}
var sumTimers = [];
// a crown per stage won on hard (localStorage 'mtd-crowns')
var CROWNS = {}; try { CROWNS = JSON.parse(localStorage.getItem('mtd-crowns') || '{}') || {}; } catch (e) {}
const CROWN_ICO = '<svg viewBox="0 0 24 24"><path d="M3 8 L7.5 12 L12 5 L16.5 12 L21 8 L19 18 H5 Z"/></svg>';
// after a defeat, one short tip picked from how the town was set up
function defeatTip() {
  const has = t => buildings.some(B => B.type === t), open = t => Object.values(CATS).some(l => l.includes(t));
  const shooters = buildings.filter(B => B.type !== 'castle' && (DEF[B.type].archers || DEF[B.type].crew)).length;
  if (shooters < 2) return 'Build <b>towers</b> where raiders come in';
  if (open('wall') && !has('wall')) return '<b>Walls</b> hold raiders under your <b>towers</b>';
  if (!stats.volleys) return 'Use the <b>Arrow volley</b> at night';
  if (open('barracks') && !has('barracks') && !has('stables')) return '<b>Soldiers</b> hold raiders at the <b>gate</b>';
  if (tierCap() > 1 && !buildings.some(B => B.tier > 1)) return '<b>Upgrade</b> <b>towers</b> before the big nights';
  return 'Build up on Day 1, the longest day';
}
// the quickest win per map, in seconds of play (localStorage 'mtd-best'), shown on the stage's details
var BEST = {}; try { BEST = JSON.parse(localStorage.getItem('mtd-best') || '{}') || {}; } catch (e) {}
function clearSummary() { (sumTimers || []).forEach(clearTimeout); sumTimers = []; $('#summary').hidden = true; }
// best stars per map (localStorage 'mtd-stars'); the total is to be spent on upgrades later
var STARS = {}; try { STARS = JSON.parse(localStorage.getItem('mtd-stars') || '{}') || {}; } catch (e) {}
const starsHTML = n => '<span class="stars">' + [0, 1, 2].map(i => `<span class="${i < n ? 'on' : ''}">★</span>`).join('') + '</span>';
const starTotal = () => Object.values(STARS).reduce((a, b) => a + (+b || 0), 0);
function updatePhase(dt) {
  if (gameOver) return;
  if (PH.kind === 'day') {
    const was = PH.t; PH.t -= dt;
    if (was > DUSK && PH.t <= DUSK) { banner('Dusk', `Night ${PH.wave} soon`); log(`<b>Dusk</b> · raiders at nightfall`, 'warn'); }
    if (PH.t <= 0) startNight();
  }
  else {
    if (spawnQueue.length && (spawnT -= dt) <= 0) { const [k, p, t] = spawnQueue.shift(); spawnEnemy(k, p, PH.wave, t); spawnT = SPAWN_GAP; }
    if (!spawnQueue.length && !enemies.some(e => !e.dead && !e.dormant)) { if (PH.wave >= NIGHTS && PH.testDay === undefined) endGame(true); else startDay(); }
  }
  if (PH.kind === 'day' && (econT -= dt) <= 0) { econT = TICK; econTick(); }   // no payouts at night: the ring waits for dawn
}
let skyT = 0;
const DUSK = 40;   // the last 40 s of each day fade slowly to night
function updateLight(dt, now) {
  const target = PH.kind === 'day' ? (PH.t < DUSK ? .25 + .75 * sstep(0, DUSK, PH.t) : 1) : 0;
  light += (target - light) * Math.min(1, dt * 1.2);
  const dusk = PH.kind === 'day' ? clamp(sstep(DUSK, 0, PH.t) * (1 - Math.abs(light - .55) * 1.1), 0, 1) : 0;
  skyHorizon.copy(SKY_NIGHT).lerp(SKY_DAY, light).lerp(SKY_DUSK, Math.min(dusk, .6)); weatherSky(skyHorizon); scene.fog.color.copy(skyHorizon);
  if ((skyT -= dt) <= 0) { skyT = .15; paintSky(); } sky.position.copy(camera.position);
  windU.value = now / 1000;
  sun.intensity = lerp(.68, 1.05, light); sun.color.copy(SUN_NIGHT).lerp(SUN_DAY, light).lerp(SUN_DUSK, Math.min(dusk, .7));
  hemi.intensity = lerp(.52, .72, light); hemi.color.copy(HEMI_NIGHT).lerp(HEMI_DAY, light);
  M.glow.emissiveIntensity = lerp(1.3, .1, light);
  // Meadowmere's foul water: a murky blue-green (Jack found olive too polluted)
  if (waterU.uFoul.value) waterMat.color.setRGB(lerp(.15, .21, light), lerp(.22, .33, light), lerp(.26, .3, light)).convertSRGBToLinear();
  else waterMat.color.setRGB(lerp(.17, .24, light), lerp(.27, .43, light), lerp(.4, .48, light)).convertSRGBToLinear();
}

