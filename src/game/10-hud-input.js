// ---------- HUD ----------
const hintEl = $('#hint');
// a red hint straight after the player's own tap or key press gets the "not allowed" knock (hover hints stay silent)
let userActT = -1e9; for (const ev of ['pointerup', 'click', 'keydown']) addEventListener(ev, () => { userActT = performance.now(); }, true);
// quiet: a red hint that isn't a refusal (pausing shows "Paused" in red), so no error sound
function setHint(html, cls, quiet) { if (cls === 'bad' && !quiet && performance.now() - userActT < 80) sfx('nope'); hintEl.innerHTML = html; hintEl.className = 'pill' + (cls ? ' ' + cls : ''); }
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const TOOL_ICON = {
  market: '<svg viewBox="0 0 24 24"><path d="M3.5 9 L5.5 4 H18.5 L20.5 9 Z"/><path d="M3.5 9 a2.75 2.2 0 0 0 5.5 0 a2.75 2.2 0 0 0 5.5 0 a2.75 2.2 0 0 0 5.5 0"/><path d="M5 11.5 V20 H19 V11.5"/><path d="M9.5 20 V15 H14.5 V20"/></svg>',
  house: '<svg viewBox="0 0 24 24"><path d="M4 11 L12 4 L20 11"/><path d="M6 9.5 V20 H18 V9.5"/><path d="M10 20 V15 H14 V20"/></svg>',
  farm: '<svg viewBox="0 0 24 24"><path d="M3 20 H21"/><path d="M7 20 V10 M12 20 V8 M17 20 V10"/><path d="M7 12 l-2.2-2.2 M7 12 l2.2-2.2 M12 10 l-2.2-2.2 M12 10 l2.2-2.2 M17 12 l-2.2-2.2 M17 12 l2.2-2.2"/></svg>',
  lodge: '<svg viewBox="0 0 24 24"><path d="M5 20 L15 8"/><path d="M13 5.5 C17 3.5 21 6.5 20 11 L15.5 8 Z"/><path d="M4 20 H11"/></svg>',
  quarry: '<svg viewBox="0 0 24 24"><path d="M8 20 L14.5 10"/><path d="M5 9 C9 5 15 4.5 19.5 8"/><path d="M14 20 L16 16 L20 16 L21 20 Z"/></svg>',
  barracks: '<svg viewBox="0 0 24 24"><path d="M7.5 16.5 L19.5 4.5 M5.5 14.5 L9.5 18.5 M7.5 16.5 L4.8 19.2"/><path d="M16.5 16.5 L4.5 4.5 M18.5 14.5 L14.5 18.5 M16.5 16.5 L19.2 19.2"/><circle cx="4.2" cy="19.8" r=".9"/><circle cx="19.8" cy="19.8" r=".9"/></svg>',
  tower: '<svg viewBox="0 0 24 24"><path d="M10 3 Q17 12 10 21"/><path d="M10 3 V21"/><path d="M2.5 12 H20.5"/><path d="M18 9.6 L21 12 L18 14.4"/><path d="M2.5 12 L1 10 M2.5 12 L1 14 M5 12 L3.5 10 M5 12 L3.5 14"/></svg>',
  wall: '<svg viewBox="0 0 24 24"><path d="M3 20 V11 H21 V20 Z"/><path d="M3 11 V8 H6 V11 M9 11 V8 H12 V11 M15 11 V8 H18 V11 M21 11 V8"/><path d="M3 15.5 H21 M8 11 V15.5 M15 11 V15.5 M11.5 15.5 V20"/></svg>',
  gate: '<svg viewBox="0 0 24 24"><path d="M4 20 V8 H20 V20"/><path d="M8 20 V13.5 A4 4 0 0 1 16 13.5 V20"/><path d="M4 8 V5 H7 V8 M17 8 V5 H20 V8"/></svg>',
  road: '<svg viewBox="0 0 24 24"><path d="M7 21 C9 15 13 10 15 3"/><path d="M12 21 C14 16 17 12 19.5 6"/><path d="M10.2 16 L13.8 17 M12.6 10.5 L15.6 12"/></svg>',
  forester: '<svg viewBox="0 0 24 24"><path d="M12 21 V11"/><path d="M12 11 C8 11 5.5 8.5 5.5 4.8 C9.2 4.8 12 7.4 12 11 Z"/><path d="M12 14.5 C15.6 14.5 18.5 12 18.5 8 C14.8 8 12 10.6 12 14.5 Z"/><path d="M6 21 H18"/></svg>',
  mine: '<svg viewBox="0 0 24 24"><path d="M2.5 20 H21.5"/><path d="M4.5 20 C4.5 11 8 6.5 12 6.5 C16 6.5 19.5 11 19.5 20"/><path d="M9 20 V14.5 H15 V20"/><path d="M8.5 14.5 H15.5"/></svg>',
  banner: '<svg viewBox="0 0 24 24"><path d="M6 21.5 V2.5"/><path d="M4 21.5 H8"/><path d="M6 4 H18 V14 L12 11.5 L6 14"/></svg>',
  campfire: '<svg viewBox="0 0 24 24"><path d="M12 15 C8.5 13 9 9.5 12 5.5 C12.5 8.5 15.5 9.5 15 12.5 C14.8 14 13.6 15 12 15 Z"/><path d="M4.5 20.5 L19.5 16.5 M4.5 16.5 L19.5 20.5"/></svg>',
  rack: '<svg viewBox="0 0 24 24"><path d="M4 21 V7 M20 21 V7 M3 8 H21 M3 17 H21"/><path d="M8 20 V3 M12 20 V3 M16 20 V3"/><path d="M7 4.5 L8 2.5 L9 4.5 M11 4.5 L12 2.5 L13 4.5 M15 4.5 L16 2.5 L17 4.5"/></svg>',
  stables: '<svg viewBox="0 0 24 24"><path d="M7 20.5 C2.5 15.5 3.5 5 12 4 C20.5 5 21.5 15.5 17 20.5"/><path d="M5.5 20.5 H9 M15 20.5 H18.5"/><path d="M6.2 12 H6.3 M17.7 12 H17.8 M8 7 H8.1 M16 7 H16.1"/></svg>',
  crossbow: '<svg viewBox="0 0 24 24"><path d="M12 21 V4"/><path d="M4 12 Q12 6 20 12"/><path d="M4 12 L12 16.5 L20 12"/><path d="M10 4.6 L12 2 L14 4.6"/></svg>',
  ballista: '<svg viewBox="0 0 24 24"><path d="M3 21.5 H14.5"/><path d="M9 21.5 V15.6 M5 21.5 L9 15.6"/><path d="M6.8 15.4 A2.2 2.2 0 0 1 11.2 15.4"/><path d="M1.9 14.5 L16.4 6 L17.6 8 L3.1 16.5 Z"/><path d="M12.2 4.3 Q16.9 6.9 16.9 12.6"/><path d="M12.2 4.3 L17 7"/><path d="M17.6 7.2 L21.8 4.7 M20.2 4.1 L21.8 4.7 L21.5 6.3"/></svg>',
  catapult: '<svg viewBox="0 0 24 24"><path d="M3 18 H21"/><circle cx="7" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/><path d="M14 18 L7 6"/><path d="M5 6.5 a2.2 2.2 0 1 0 4 -1"/><path d="M15 18 V12 H18"/></svg>',
  farmhouse: '<svg viewBox="0 0 24 24"><path d="M3 20 V10.5 L12 4 L21 10.5 V20 Z"/><path d="M8.5 20 V13.5 H15.5 V20"/><path d="M8.5 13.5 L15.5 20 M15.5 13.5 L8.5 20"/></svg>',
  well: '<svg viewBox="0 0 24 24"><path d="M6 13 H18 V20 H6 Z"/><path d="M7 13 V7.5 M17 13 V7.5"/><path d="M4.5 8 L12 3.5 L19.5 8"/><path d="M12 8 V11"/></svg>',
  torch: '<svg viewBox="0 0 24 24"><path d="M12 21 V11"/><path d="M9 11 H15"/><path d="M12 9 C9.5 7 10.5 5 12 3 C13.5 5 14.5 7 12 9 Z"/></svg>',
  flowers: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="2.6"/><path d="M12 10.6 V20"/><path d="M12 15 C9 13 7 13.5 5.5 16 M12 17 C15 15 17 15.5 18.5 18"/><path d="M5 20 H19"/></svg>',
  butts: '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="7"/><circle cx="12" cy="10" r="3.6"/><circle cx="12" cy="10" r=".9"/><path d="M8 16.2 L6 21.5 M16 16.2 L18 21.5"/><path d="M14.5 7.5 L20.5 2.5"/></svg>',
  stores: '<svg viewBox="0 0 24 24"><path d="M3 12 H13 V21 H3 Z"/><path d="M3 16.5 H13"/><path d="M5 12 V5 M8 12 V3.5 M11 12 V5"/><path d="M4 6.5 L5 4.5 L6 6.5 M7 5 L8 3 L9 5 M10 6.5 L11 4.5 L12 6.5"/><circle cx="17.5" cy="18" r="3"/><circle cx="18" cy="11.5" r="2.6"/></svg>',
  statue: '<svg viewBox="0 0 24 24"><path d="M7 20 H17 V17 H7 Z"/><path d="M10 17 V11 H14 V17"/><circle cx="12" cy="8" r="2"/><path d="M14 11.5 L17.5 5"/></svg>',
  castle: '<svg viewBox="0 0 24 24"><path d="M4 20 V9 H8 V12 H16 V9 H20 V20 Z"/><path d="M4 9 V6 H6 V9 M18 9 V6 H20 V9 M10 12 V7 H14 V12"/><path d="M10.5 20 V16.5 A1.5 1.5 0 0 1 13.5 16.5 V20"/><path d="M12 7 V3.5 L15 4.5 L12 5.5"/></svg>',
};
function toolLabel(t) {
  if (t === 'road') return { name: 'Path', small: costHTML(PATH_COST) };
  const T = DEF[t]; return { name: T.name, small: costHTML(T.cost) };
}
function renderTools() {
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
  $('#tools').innerHTML = CATS[cat].map(t => { const L = toolLabel(t); return `<button class="tool" data-tool="${t}" aria-pressed="${tool === t}"><span class="tIco">${TOOL_ICON[t]}</span><b>${L.name}</b><small>${L.small}</small></button>`; }).join('');
  document.querySelectorAll('#tools .tool').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  markTools();
}
function markTools() {
  if (guideStep >= 0) setTimeout(guideMark);   // the dock may have been redrawn: re-place the pulse
  document.querySelectorAll('.tool').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.tool === tool));
    const T = DEF[b.dataset.tool]; b.classList.toggle('cant', b.dataset.tool === 'road' ? !canAfford(PATH_COST) : !!T && !canAfford(T.cost));
  });
}
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { cat = b.dataset.cat; renderTools(); }));
const PH_ICON = {
  sun: '<svg viewBox="0 0 26 26"><g stroke="#e8b84e" stroke-width="2" stroke-linecap="round">' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return `<line x1="${13 + Math.cos(r) * 8.5}" y1="${13 + Math.sin(r) * 8.5}" x2="${13 + Math.cos(r) * 11.5}" y2="${13 + Math.sin(r) * 11.5}"/>`; }).join('') + '</g><circle cx="13" cy="13" r="5.6" fill="#f2c95e"/></svg>',
  moon: '<svg viewBox="0 0 26 26"><path d="M17.5 4.5a9 9 0 1 0 4 15.5 7.2 7.2 0 0 1-4-15.5z" fill="#c9d4f5"/><circle cx="6" cy="6" r=".9" fill="#c9d4f5"/><circle cx="21" cy="9" r=".7" fill="#c9d4f5"/></svg>',
};
let phIcoKind = '';
function updateHud() {
  const pt = $('#phaseText'), sub = $('#phaseSub');
  if (PH.kind === 'day') { pt.textContent = `Day ${PH.wave} of ${NIGHTS}`; pt.className = ''; sub.textContent = gameOver ? 'Victory' : `Night in ${fmt(Math.max(0, PH.t))}`; $('#nightBtn').hidden = gameOver || (MAP === 'vale' && guideOn); }
  else { const left = spawnQueue.length + enemies.filter(e => !e.dead && !e.dormant).length; pt.textContent = `Night ${PH.wave} of ${NIGHTS}`; pt.className = 'night'; sub.textContent = `${left} raider${left === 1 ? '' : 's'} left`; $('#nightBtn').hidden = true; }
  const kind = PH.kind === 'day' ? 'sun' : 'moon'; if (phIcoKind !== kind) { phIcoKind = kind; $('#phIco').innerHTML = PH_ICON[kind]; }
  $('#tickRing').style.strokeDashoffset = (94.25 * (1 - econT / TICK)).toFixed(1); $('#tickN').textContent = Math.ceil(econT);
  const pop = popStats(), hungry = villagers.filter(v => v.hungry).length; const night = PH.kind === 'night', chipIco = night ? 'guard' : 'pop';
  // villagers alive (the fallen waiting to come back don't count yet) / beds in built houses and the castle: red while anyone is homeless
  const beds = buildings.reduce((n, B) => n + (B.built && DEF[B.type].residents ? DEF[B.type].residents[B.tier - 1] : 0), 0), hTxt = `${pop.total}/${beds}`;
  if ($('#cHouse b').textContent !== hTxt) $('#cHouse b').textContent = hTxt;
  $('#cHouse').classList.toggle('short', villagers.some(v => v.homeless) || pop.total > beds);
  // by day: idle villagers (spare hands: dimmed at 0); by night: manning the castle, towers and barracks / villagers
  if ($('#cPop').dataset.ico !== chipIco) { $('#cPop').dataset.ico = chipIco; $('#cPop .ico').innerHTML = ICON[chipIco]; $('#cPop').title = night ? 'Soldiers / villagers' : 'Idle'; }
  const popTxt = night ? `${townsfolk().filter(v => v.post).length}/${pop.total}` : `${pop.idle}`;
  if ($('#cPop b').textContent !== popTxt) $('#cPop b').textContent = popTxt;
  $('#cPop').classList.toggle('dim', !night && pop.idle === 0);
  const eaters = hungry ? 1e9 : 1;
  for (const k of RES_KEYS) { const el = $('#c' + k[0].toUpperCase() + k.slice(1)); el.querySelector('b').textContent = shortN(Math.floor(res[k])); el.classList.toggle('low', k === 'food' && res.food < eaters); }
  markTools(); refreshCard();
  if (!$('#admin').hidden) syncAdmin(false);
}
const DEM_ICO = '<svg class="bIco" viewBox="0 0 24 24"><path d="M3.5 11 L12 4 L20.5 11"/><path d="M5.5 9.5 V20 H18.5 V9.5"/><path d="M12 2 L10 8 L14 12.5 L10.5 17 L12 22"/></svg>';
// card stats: icon + number; tapping one shows its name (statTip)
const STAT_NAME = { home: 'Housing', hp: 'Health', gold: 'Gold', food: 'Food', pop: 'Villagers', hammer: 'Workers', guard: 'Archers', bow: 'Damage', sword: 'Damage', charm: 'Charm', bowl: 'Hungry', speed: 'Walk speed', range: 'Range', rate: 'Attack speed', prod: 'Production' };
// a decor's boost as card / hint items: icon and amount
const FX_ITEMS = { range: ['range', v => `+${v} m`, 'Range'], rangeArch: ['range', v => `+${v} m`, 'Archer range'], troopRate: ['rate', v => `+${Math.round(v * 100)}%`, 'Troop attack speed'],
  troopWalk: ['speed', v => `+${Math.round(v * 100)}%`, 'Troop walk speed'], troopDmg: ['sword', v => `+${Math.round(v * 100)}%`, 'Troop damage'], prod: ['prod', v => `+${Math.round(v * 100)}%`, 'Production'],
  siegeRate: ['rate', v => `+${Math.round(v * 100)}%`, 'Siege reload'] };
const fxStats = (type, mk) => Object.entries(DECOR_FX[type] || {}).map(([k, v]) => mk(FX_ITEMS[k][0], FX_ITEMS[k][1](v), FX_ITEMS[k][2]));
// what a spot would help: the buildings an effect reaches (towers and siege for range, troops' barracks, economy, siege)
const ECO = { lodge: 1, forester: 1, quarry: 1, mine: 1, farm: 1, farmhouse: 1 };
function fxTargets(type, x, z) {
  const F = DECOR_FX[type]; if (!F) return 0;
  const hit = B => (F.range && DEF[B.type].range) || (F.rangeArch && RANGED[B.type]) || ((F.troopRate || F.troopDmg) && DEF[B.type].soldiers) || (F.prod && ECO[B.type]) || (F.siegeRate && DEF[B.type].crew);
  return buildings.filter(B => !B.dead && hit(B) && Math.hypot(center(B).x - x, center(B).z - z) <= BOOST_R).length;
}
const STAT = (ico, txt, cls = '', name = STAT_NAME[ico]) => `<span class="stat ${cls}" data-name="${name || ''}" title="${name || ''}">${ico ? `<span class="ico">${ICON[ico]}</span>` : ''}${txt}</span>`;
function refreshCard() {
  const card = $('#card');
  syncRange();
  if (!selected) { card.hidden = true; return; }
  $('#cardHp').parentElement.hidden = !!selected.path;
  if (selected.path) {                                 // a path tile: just a name and Demolish (no refund)
    card.hidden = false; $('#cardIco').innerHTML = TOOL_ICON.road; $('#cardTitle').textContent = 'Path'; $('#cardSub').textContent = ''; $('#cardPips').innerHTML = '';
    $('#cardStats').innerHTML = STAT('speed', `×${PATH_SPEED}`) + STAT('charm', `+${Math.round(PATH_CHARM * 100)}%`); $('#moveBtn').hidden = $('#cardRotBtn').hidden = $('#upBtn').hidden = $('#rallyBtn').hidden = $('#recallBtn').hidden = $('#volleyBtn').hidden = $('#cancelBtn').hidden = $('#cardTrade').hidden = true;   // nothing left over from the last card
    const dem = $('#demBtn'), armed = demArmed.B === selected && performance.now() - demArmed.t < 3000;
    dem.hidden = false; $('#cardActs').hidden = false; dem.classList.toggle('armed', armed); if (!armed) dem.style.minWidth = ''; dem.innerHTML = armed ? PICO.tick.replace('<svg ', '<svg class="bIco" ') : DEM_ICO; dem.title = 'Remove path'; return;
  }
  const B = selected, T = DEF[B.type], k = B.tier - 1, c0 = center(B);
  card.hidden = false;
  $('#cardIco').innerHTML = TOOL_ICON[B.type] || '';
  $('#cardTitle').textContent = T.decor ? T.name : T.tiers[k];
  $('#cardSub').textContent = T.decor ? 'Decoration' : T.name === T.tiers[k] ? '' : T.name;
  $('#cardPips').innerHTML = T.decor ? '' : [1, 2, 3].map(t => `<i class="${t <= B.tier ? 'on' : ''}"></i>`).join('');
  const hpf = Math.max(0, B.hp / B.max);
  $('#cardHp').style.width = `${hpf * 100}%`; $('#cardHp').style.background = hpf < .35 ? 'var(--bad)' : hpf < .7 ? '#e6c46a' : 'var(--ok)';
  const st = [];
  if (B.site) {
    const crew = villagers.filter(v => v.build === B).length;
    const pc = Math.floor(B.site.progress * 100);
    st.push(STAT('', `<span class="mini"><i style="width:${pc}%"></i></span>${pc}%`, 'warn', { new: 'Building', up: 'Upgrading', repair: 'Repairing' }[B.site.kind]));
    st.push(STAT('hammer', `${crew}`, crew ? '' : 'bad', 'Builders'));
  }
  st.push(STAT('hp', B.hp < B.max ? `${Math.ceil(B.hp)}/${B.max}` : `${B.max}`, hpf < .35 ? 'bad' : ''));
  if (B.type === 'castle') { st.push(STAT('gold', `+${T.gold[k]}`)); st.push(STAT('food', `+${T.food[k]}`)); }
  if (B.type === 'house') {
    st.push(STAT('gold', `+${T.gold[k]}`));
    const ch = Math.round(charmOf(B) * 100); if (ch) st.push(STAT('charm', `+${ch}%`, 'good'));
    const hg = villagers.filter(v => v.home === B && v.hungry).length; if (hg) st.push(STAT('bowl', `${hg}`, 'bad'));
  }
  if (B.type === 'forester' && B.built) st.push(STAT('wood', `${(B.grove || []).filter(t => t.g >= 1).length}/${T.grove[k]}`, '', 'Trees grown'));
  if (T.field) { const f = +(T.food[k] * farmersAt(B) / T.workers[k] * prodK(B)).toFixed(1); st.push(STAT('food', `+${f}`, f < T.food[k] ? 'warn' : '')); }
  if (T.residents) st.push(STAT('home', `${villagers.filter(v => v.home === B && !v.homeless && !v.summoned).length}/${B.built ? T.residents[B.tier - 1] : 0}`));   // housing: residents / room
  if (T.workers && B.built) { const w = villagers.filter(v => v.job === B).length; st.push(STAT('hammer', `${w}/${T.workers[k]}`, w < T.workers[k] ? 'warn' : '')); }
  if (T.range) {
    const m = (B.manned || []).filter(Boolean).length, n = (T.archers || T.crew)[k];
    st.push(STAT('guard', PH.kind === 'night' ? `${m}/${n}` : `${n}`, T.crew && PH.kind === 'night' && m < n ? 'warn' : '', T.crew ? 'Crew' : undefined));
    // a siege engine's damage shows the catapult, a tower's or the castle's the bow (Jack saw the catapult on the archers)
    st.push(STAT(T.crew ? 'siege' : 'bow', `${T.dmg[k]}`, '', 'Damage'));
    const R = rangeOf(B); st.push(STAT('range', `${+R.toFixed(1)} m`, R > T.range[k] ? 'good' : '', 'Range'));
    if (T.crew && siegeRate(B) < T.rate[k]) st.push(STAT('rate', `+${Math.round((1 - siegeRate(B) / T.rate[k]) * 100)}%`, 'good', 'Reload'));
  }
  if (ECO[B.type] && prodK(B) > 1) st.push(STAT('prod', `+${Math.round((prodK(B) - 1) * 100)}%`, 'good', 'Production'));
  if (T.soldiers) {
    const m = villagers.filter(v => v.soldier && v.post && v.post.B === B).length;
    st.push(STAT('guard', PH.kind === 'night' ? `${m}/${T.soldiers[k]}` : `${T.soldiers[k]}`, '', 'Soldiers'));
    st.push(STAT('sword', `${(T.cavalry ? RIDER : SOLDIER).dmg[k]}`));
  }
  if (T.decor) { st.push(...fxStats(B.type, (i, v, n) => STAT(i, v, 'good', n))); st.push(STAT('charm', `+${Math.round(T.charm * 100)}%`, 'good')); }
  $('#cardStats').innerHTML = st.join('');
  const tr = $('#cardTrade'); tr.hidden = B.type !== 'market' || !B.built;
  if (!tr.hidden) {                                   // rebuilt only when something changes, or taps get lost between redraws
    const key = B.id + ':' + k + ':' + TRADES.map(t => +canAfford({ [t.give]: 10 })).join('');
    if (tr.dataset.key !== key) {
      tr.dataset.key = key;
      tr.innerHTML = TRADES.map((t, i) => `<button data-i="${i}" ${canAfford({ [t.give]: 10 }) ? '' : 'disabled'} title="Trade">${costHTML({ [t.give]: 10 })}<span class="to">›</span>${costHTML({ [t.get]: t.n[k] })}</button>`).join('');
    }
  }
  $('#rallyBtn').hidden = $('#recallBtn').hidden = !T.soldiers || !B.built;
  $('#rallyBtn').setAttribute('aria-pressed', String(rallyFor === B)); $('#recallBtn').disabled = !B.rally;
  $('#moveBtn').hidden = !T.movable || !B.built || !!B.site; $('#moveBtn').setAttribute('aria-pressed', String(moveFor === B));
  // the arrow volley and the riders live only on the night powers' round buttons now (Jack had them taken off the castle's card)
  const sb = $('#summonBtn'); sb.hidden = true;
  if (!sb.hidden) {
    const out = summoned().length > 0, cool = !out && summonCd > 0, day = PH.kind !== 'night';
    const ico = out ? 'rally' : 'horse'; if (sb.dataset.ico !== ico) { sb.dataset.ico = ico; sb.querySelector('svg').innerHTML = out ? '<path d="M6 21 V3.5"/><path d="M6 4 H17.5 L15 8 L17.5 12 H6"/>' : HORSE_ICO; }
    sb.classList.toggle('cool', cool); sb.classList.toggle('off', day && !out && !cool); sb.disabled = cool;
    sb.title = out ? 'Rally: tap, then a spot' : day ? 'Night only' : 'Riders: two for the night'; sb.setAttribute('aria-pressed', String(out && rallyFor === B));
    sb.querySelector('.cd').textContent = cool ? Math.ceil(summonCd) : '';
  }
  const vb = $('#volleyBtn'); vb.hidden = true;
  if (!vb.hidden) { const cool = volleyCd > 0, day = PH.kind !== 'night'; vb.classList.toggle('cool', cool); vb.classList.toggle('off', day && !cool); vb.disabled = cool; vb.title = day ? 'Night only' : 'Arrow volley: tap, then a spot'; vb.querySelector('.cd').textContent = cool ? Math.ceil(volleyCd) : ''; vb.setAttribute('aria-pressed', String(volleyAim)); }
  const up = $('#upBtn');
  if (!T.up) up.hidden = true;
  else if (B.tier >= 3 || B.tier >= tierCap() || B.site) up.hidden = true;
  else { const c = T.up[k]; up.hidden = false; up.innerHTML = B.site ? '…' : `<svg class="bIco" viewBox="0 0 24 24"><path d="M5 14 L12 7 L19 14"/><path d="M5 19 L12 12 L19 19"/></svg>${costHTML(c)}`; up.disabled = !!B.site || !canAfford(c); up.title = `Upgrade to ${T.tiers[k + 1]}`; }
  $('#cardRotBtn').hidden = !canRotate(B);
  const dem = $('#demBtn');
  dem.hidden = B.type === 'castle'; dem.disabled = PH.kind === 'night'; dem.title = PH.kind === 'night' ? 'Not at night' : 'Demolish';
  // a site nobody has started on yet is cancelled instead, for its full cost back
  const canCancel = !!(B.site && B.site.kind === 'new' && B.site.progress <= 0); $('#cancelBtn').hidden = !canCancel; if (canCancel) dem.hidden = true;
  $('#cardActs').hidden = [...$('#cardActs').children].every(b => b.hidden);
  if (!dem.hidden) { const back = {}; RES_KEYS.forEach(r => { if (T.cost[r]) back[r] = Math.floor(T.cost[r] / 2); }); const armed = demArmed.B === B && performance.now() - demArmed.t < 3000; dem.classList.toggle('armed', armed); if (!armed) dem.style.minWidth = ''; dem.innerHTML = armed ? '<svg class="bIco" viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7"/></svg>' : `${DEM_ICO}${costHTML(back)}`; dem.title = 'Demolish and get half the build cost back'; }
}
function selectPath(a, b) {
  const x0 = a * CELL, z0 = b * CELL;
  selected = { path: true, a, b, ev: { x0, z0, x1: x0 + CELL, z1: z0 + CELL } };
  drape(selLine, x0 - .1, z0 - .1, x0 + CELL + .1, z0 + CELL + .1); refreshCard();
}
function removePath(P) { road[P.b * N + P.a] = 0; rebuildRoads(); villagers.forEach(v => v.path = null); sfx('click'); deselect(); }
let statTipT = 0;
// out of the dock (its transform would offset a fixed tooltip) into #app with the HUD's other parts: straight under <body>, after
// the 3D canvas's layer, Chromium drew it under the map on screens wider than a phone and the tip never showed there
$('#app').appendChild($('#statTip'));
// a name tooltip over (or, for the top bar, under) an icon, for 1.6 s
function showTip(el, name, below) {
  const r = el.getBoundingClientRect(), tip = $('#statTip');
  tip.textContent = name; tip.classList.toggle('below', !!below);
  tip.style.left = (r.left + r.width / 2) + 'px'; tip.style.top = (below ? r.bottom : r.top) + 'px'; tip.hidden = false;
  clearTimeout(statTipT); statTipT = setTimeout(() => { tip.hidden = true; }, 1600);
}
$('#cardStats').addEventListener('pointerdown', e => {   // pointerdown: the stats are redrawn every .2 s, which can swallow a click
  const st = e.target.closest('.stat'); if (st && st.dataset.name) showTip(st, st.dataset.name);
});
// 1000 and up as 1.2k / 12k, so six chips fit across a phone's top panel
const shortN = n => n < 1000 ? String(n) : n < 10000 ? (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'k' : Math.floor(n / 1000) + 'k';
const CHIP_NAME = { cGold: 'Gold', cWood: 'Wood', cStone: 'Stone', cFood: 'Food', cHouse: 'Housing', cPop: 'Idle' };
const chipName = id => id === 'cPop' && PH.kind === 'night' ? 'Soldiers' : CHIP_NAME[id];
for (const id in CHIP_NAME) $('#' + id).addEventListener('pointerdown', e => showTip(e.currentTarget, chipName(id), true));
function select(B) { selected = B; drape(selLine, B.ev.x0 - .1, B.ev.z0 - .1, B.ev.x1 + .1, B.ev.z1 + .1); refreshCard(); }
// archers' reach round a selected castle or archer tower; redrawn when the tier changes
let rangeKey = '';
function syncRange() {
  const B = selected, T = B && !B.path && DEF[B.type], k = T && (T.range || T.decor || T.reach) ? B.id + ':' + B.tier + ':' + (T.range ? rangeOf(B) : 0) + ':' + Math.round(center(B).x * 10) + ':' + Math.round(center(B).z * 10) : '';
  if (k === rangeKey) return; rangeKey = k;
  if (!k) { rangeLine.visible = false; selDisc.visible = false; return; }
  const c = center(B);
  const r = T.decor ? BOOST_R : T.range ? rangeOf(B) : T.reach;
  drapeCircle(rangeLine, c.x, c.z, r); drapeDisc(selDisc, c.x, c.z, r);
}
function deselect() { selected = null; volleyAim = false; moveFor = null; selLine.visible = false; $('#statTip').hidden = true; refreshCard(); }
$('#upBtn').addEventListener('click', () => { if (paused) return setHint('Paused', 'bad'); selected && upgrade(selected); });
$('#rotBtn').addEventListener('click', rotatePlacement);
$('#cardRotBtn').addEventListener('click', () => { if (paused) return setHint('Paused', 'bad'); rotateBuilding(selected); });
addEventListener('keydown', e => { if ((e.key === 'r' || e.key === 'R') && !e.target.closest('input')) { if (ROTATES[tool] || FACING[tool]) rotatePlacement(); else if (selected) rotateBuilding(selected); } });
// demolish takes two taps within 3 s, like Restart
var demArmed = { B: null, t: 0 };
$('#demBtn').addEventListener('click', () => {
  if (paused) return setHint('Paused', 'bad'); if (!selected) return;
  if (PH.kind === 'night' && !selected.path) return setHint('Not at night', 'bad');   // no pulling buildings down mid-raid
  if (demArmed.B === selected && performance.now() - demArmed.t < 3000) { demArmed = { B: null, t: 0 }; if (selected.path) removePath(selected); else removeBuilding(selected, false); return; }
  // the armed (tick) button keeps its width, so the buttons beside it don't slide under the finger for the second tap
  const dem = $('#demBtn'); dem.style.minWidth = dem.offsetWidth + 'px';
  demArmed = { B: selected, t: performance.now() }; refreshCard(); setTimeout(refreshCard, 3050);
});
$('#cancelBtn').addEventListener('click', () => {
  if (paused) return setHint('Paused', 'bad'); const B = selected;
  if (!B || B.path || !(B.site && B.site.kind === 'new' && B.site.progress <= 0)) return refreshCard();   // building has begun
  removeBuilding(B, false, true);
});
$('#closeCard').addEventListener('click', deselect);
// calling the night early pays for the time left (Kingdom Rush style): a gold for every 4 s, at most 60
$('#nightBtn').addEventListener('click', () => { $('#nightBtn').classList.remove('skipGlow');
  if (PH.kind !== 'day' || gameOver) return;
  const g = Math.min(60, Math.round(PH.t / 4)), K = castleB();
  if (g > 0) { res.gold += g; stats.gold += g; log(`<b>Early</b> · +${g} gold`, 'good'); if (K) { const c = center(K), y = K.group.position.y + 4; floatRes('gold', g, c.x, y, c.z); coinFly(c.x, y, c.z, 3); } }
  PH.t = 0;
});

// ---------- ghost ----------
const isTouch = matchMedia('(pointer: coarse)').matches;
function hideGhost() { for (const t in ghosts) ghosts[t].visible = false; footLine.visible = ringLine.visible = reachLine.visible = boostDisc.visible = false; cur = null; }
const cellFor = (p, s, sz = s) => s === 1 && sz === 1 ? [Math.floor(p.x / CELL), Math.floor(p.z / CELL)] : [s === 1 ? Math.floor(p.x / CELL) : Math.round(p.x / CELL - s / 2), sz === 1 ? Math.floor(p.z / CELL) : Math.round(p.z / CELL - sz / 2)];
function showGhostAt(point) {
  if (!tool || tool === 'select' || paused) return hideGhost();
  if (tool === 'road') {
    for (const t in ghosts) ghosts[t].visible = false; ringLine.visible = reachLine.visible = boostDisc.visible = false;
    const ev = evaluateRoad(Math.floor(point.x / CELL), Math.floor(point.z / CELL));
    footLine.material.color.set(ev.ok ? '#8cc46e' : '#e2715b'); drape(footLine, ev.x0, ev.z0, ev.x1, ev.z1); cur = ev;
    if (ev.ok) setHint(`<b>Path</b><i class="gap"></i>${costHTML(PATH_COST)}<i class="gap"></i><span class="cost" title="Walk speed"><span class="ico">${ICON.speed}</span>×${PATH_SPEED}</span>`, 'ok'); else setHint(ev.reason, 'bad', true);
    return;
  }
  const T = DEF[tool], [ci, cj] = cellFor(point, ...dimsFor(tool, placeFace)), ev = evaluate(tool, ci, cj);
  for (const t in ghosts) ghosts[t].visible = t === tool;
  const g = ghosts[tool], cx = (ev.x0 + ev.x1) / 2, cz = (ev.z0 + ev.z1) / 2;
  g.position.set(cx, adapt && tool !== 'wall' && ev.target != null ? ev.target : hAt(cx, cz), cz);
  g.rotation.y = FACING[tool] ? (ev.face ?? placeFace) * Math.PI / 2 : 0;
  const col = ev.ok ? '#8cc46e' : '#e2715b';
  ghostMat.color.set(col); footLine.material.color.set(col);
  drape(footLine, ev.x0, ev.z0, ev.x1, ev.z1);
  const FO = T.falloff || F;
  if (adapt && ev.ok) drape(ringLine, Math.max(0, ev.x0 - FO), Math.max(0, ev.z0 - FO), Math.min(SIZE, ev.x1 + FO), Math.min(SIZE, ev.z1 + FO)); else ringLine.visible = false;
  if (T.reach) drapeCircle(reachLine, cx, cz, T.reach); else if (T.range) drapeCircle(reachLine, cx, cz, T.range[0]); else if (T.charm) drapeCircle(reachLine, cx, cz, CHARM_R); else reachLine.visible = false;
  // the soft disc under the ring: a decor's reach, a tower's or siege engine's range, a camp's reach for trees or rock
  const dr = T.decor ? BOOST_R : T.reach || (T.range && T.range[0]) || 0;
  if (dr) drapeDisc(boostDisc, cx, cz, dr); else boostDisc.visible = false;
  cur = ev;
  // the outline's hints are a preview and stay silent (Jack heard the error sound laying paths: the outline, moved after a
  // tap or a drag's end, found the tile just laid and said "Already a path" within the tap's 80 ms); a refused placement
  // itself still sounds it (place, paintRoad, paintWall)
  if (!ev.ok) { setHint(ev.reason, 'bad', true); return; }
  // short: name, cost, then only what matters for this spot, each as an icon and a number (no instructions, no dots)
  const it = (ico, txt, cls = '', name = '') => `<span class="cost${cls}" title="${name}"><span class="ico">${ICON[ico]}</span>${txt}</span>`;
  const parts = [`<b>${T.name}</b>`, costHTML(T.cost)];
  if (T.reach) parts.push(it(tool === 'lodge' ? 'wood' : 'stone', ev.resCount, '', tool === 'lodge' ? 'Trees in reach' : 'Rocks in reach'));
  if (DECOR_FX[tool]) { parts.push(...fxStats(tool, (i, v, n) => it(i, v, '', n))); parts.push(it('hammer', fxTargets(tool, cx, cz), '', 'Buildings helped')); }
  if (T.charm) parts.push(it('charm', `+${Math.round(T.charm * 100)}%`, '', 'Charm'), it('home', housesNear(cx, cz), '', 'Houses nearby'));
  if (T.workers) { const need = T.workers[0], idle = popStats().idle; parts.push(it('hammer', need, idle < need ? ' short' : '', 'Workers needed')); }
  if (ROTATES[tool]) parts.push(placeRot ? 'N–S' : 'E–W');
  setHint(parts.join('<i class="gap"></i>'), 'ok');
}
function regho() { if (cur) showGhostAt(new THREE.Vector3((cur.x0 + cur.x1) / 2, 0, (cur.z0 + cur.z1) / 2)); }

// ---------- camera + input ----------
const target = new THREE.Vector3(SIZE * .45, 2, SIZE * .5);
let yaw = .65, pitch = .9, dist = 46;
function updateCam() {
  camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(target);
  scene.fog.near = dist + 100; scene.fog.far = dist + 240;   // haze starts beyond the town, so the top of a tall phone screen stays crisp
}
var CAM_LIM = { lo: 0, hi: SIZE, near: 14 };      // the gallery widens these
function pan(dx, dy) {
  const k = dist * .0016;
  target.x = clamp(target.x + (-Math.cos(yaw) * dx - Math.sin(yaw) * dy) * k, CAM_LIM.lo, CAM_LIM.hi);
  target.z = clamp(target.z + (Math.sin(yaw) * dx - Math.cos(yaw) * dy) * k, CAM_LIM.lo, CAM_LIM.hi);
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function setRay(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
function pick(e) { setRay(e); const hit = ray.intersectObject(terrain)[0]; return hit ? hit.point : null; }
// strict: only a tap on the building's own body counts (not its ground shadow, plinth edge or the ground around it)
function pickBuilding(e, strict) {
  setRay(e);
  for (const hit of ray.intersectObjects(buildings.map(B => B.group), true)) {
    let o = hit.object; while (o && !o.userData.B) o = o.parent;
    const B = o && o.userData.B; if (!B) continue;
    if (!strict) return B;
    const m = .35, p = hit.point, ev = B.ev;
    if (p.x > ev.x0 + m && p.x < ev.x1 - m && p.z > ev.z0 + m && p.z < ev.z1 - m && p.y > B.group.position.y + .2) return B;
    return null;
  }
  // missed every model: whatever stands on the tapped tile (a torch or flowers are much smaller than their tile)
  if (!strict) { const pt = pick(e), o = pt && occB[cellAt(pt.x, pt.z)]; if (o && !o.dead) return o; }
  return null;
}
const PAINT = { road: 1, wall: 1 };
const ptrs = new Map(); let down = null, pinch = null;
const pinchState = () => { const [a, b] = [...ptrs.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x) }; };
function paintAt(e) {
  const pt = pick(e); if (!pt) return;
  const a = Math.floor(pt.x / CELL), b = Math.floor(pt.z / CELL);
  // the outline first, then the path: drawn after it, the outline found the new path there and said "Already a path" (Jack)
  if (tool === 'road') { showGhostAt(pt); paintRoad(a, b); } else { paintWall(a, b); }
}
function endStroke() {
  if (wallStroke) { log(`<b>Wall</b> ×${wallStroke}`); wallStroke = 0; }
  lastPaint = '';
}
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, moved: false, btn: e.button, shift: e.shiftKey, painting: PAINT[tool] && e.button === 0 && !e.shiftKey && !gameOver && !paused };
  else { if (down) { down.moved = true; down.painting = false; } pinch = pinchState(); }
});
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) { if (e.pointerType === 'mouse') { const pt = pick(e); if (volleyAim) { if (pt) drapeCircle(volleyLine, pt.x, pt.z, volleyR()); return; } pt ? showGhostAt(pt) : hideGhost(); } return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 1 && down) {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
    if (down.painting) { if (down.moved) paintAt(e); return; }
    if (down.moved) { if (down.btn === 2 || down.shift) { yaw -= dx * .006; pitch = clamp(pitch + dy * .005, .3, 1.45); } else pan(dx, dy); updateCam(); }
  } else if (ptrs.size === 2 && pinch) {
    const s = pinchState(); let da = s.ang - pinch.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); yaw += da; dist = clamp(dist * pinch.d / s.d, CAM_LIM.near, 95); pan(s.mx - pinch.mx, s.my - pinch.my); pinch = s; updateCam();
  }
});
function endPtr(e) {
  const wasTap = e.type === 'pointerup' && ptrs.size === 1 && down && !down.moved && down.btn === 0;
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (ptrs.size === 0) down = null;
  if (wasTap) tap(e);
  if (ptrs.size === 0) endStroke();
}
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); dist = clamp(dist * Math.exp(e.deltaY * .001), CAM_LIM.near, 95); updateCam(); }, { passive: false });
function tap(e) {
  if (galleryOn) { galleryTap(e); return; }
  if (moveFor) {                                      // moving a catapult: tap the tile it should roll to
    const pt = pick(e), B = moveFor; moveFor = null;
    if (pt && !B.dead) startMove(B, Math.floor(pt.x / CELL), Math.floor(pt.z / CELL));
    refreshCard(); return;
  }
  if (rallyFor) {                                     // placing a barracks' rally flag
    const pt = pick(e), B = rallyFor;
    if (!pt || !canStand(pt.x, pt.z, 1)) { setHint('Blocked', 'bad'); return; }
    rallyFor = null; setRally(B, pt); sfx('click'); setHint('Rallied'); refreshCard(); return;
  }
  if (gameOver) return;
  if (paused) { const hb = pickBuilding(e); if (hb) select(hb); setHint('Paused', 'bad'); return; }
  if (volleyAim) {                                    // aiming the castle's arrow volley
    const pt = pick(e); if (!pt) { setHint('Pick a spot', 'bad'); return; }
    volleyAim = false; if (PH.kind !== 'night') return refreshCard(); castVolley(pt); setHint('Volley'); refreshCard(); return;
  }
  if (PAINT[tool]) {
    // the Path tool on a path tile takes it up again (a quick undo for a misplaced tile)
    const pt = tool === 'road' && pick(e), c = pt && cellAt(pt.x, pt.z);
    if (pt && road[c]) { removePath({ a: c % N, b: (c / N) | 0 }); setHint('Path removed'); return; }
    paintAt(e); return;
  }
  const building = tool && tool !== 'select';
  const hb = pickBuilding(e, building);
  if (hb) { select(hb); return; }
  if (!building) { const pt = pick(e), c = pt && cellAt(pt.x, pt.z); if (pt && road[c]) selectPath(c % N, Math.floor(c / N)); else deselect(); return; }
  const pt = pick(e); if (!pt) return;
  const [ci, cj] = cellFor(pt, ...dimsFor(tool, placeFace));
  if (e.pointerType !== 'mouse' && !(cur && cur.ci === ci && cur.cj === cj && cur.type === tool && ghosts[tool].visible)) { showGhostAt(pt); return; }
  // placed: the building sound (Jack: it played the error sound with a mouse, as the outline shown again at once found the spot
  // taken, a red "Occupied" within the tap's 80 ms; the tap's moment is cleared first so that hint stays quiet)
  if (place(tool, ci, cj)) { sfx('build', { x: pt.x, z: pt.z }, .8); userActT = -1e9; if (e.pointerType === 'mouse') showGhostAt(pt); else { hideGhost(); setHint('Placed'); } }
}
const ROTATES = { wall: 1, gate: 1 };
function rotatePlacement() {
  if (ROTATES[tool]) { placeRot ^= 1; for (const t in ROTATES) makeGhost(t); regho(); }
  else if (FACING[tool]) { placeFace = (placeFace + 3) % 4; regho(); }     // a quarter turn clockwise seen from above
}
// on the card: gates always; walls only while they stand alone (connected walls follow their neighbours); everything else turns to any side its door can open on
const canRotate = B => B && ((ROTATES[B.type] && (B.type === 'gate' || !B.mask)) || FACING[B.type]);
function rotateBuilding(B) {
  if (!canRotate(B)) return;
  if (ROTATES[B.type]) { B.rot ^= 1; B.rotFixed = true; swapModel(B); select(B); return; }
  const T = DEF[B.type];
  for (let k = 1; k < 4; k++) {
    const f = ((B.face || 0) + 4 - k) % 4, d = T.noRoad ? null : doorCell(B.ev, B.type, f);
    if (T.faces && !T.faces.includes(f)) continue;
    // a placed forester only turns end for end: a quarter turn would change its 2 x 3 plot to 3 x 2
    if (T.turnDims && f % 2 !== (B.face || 0) % 2) continue;
    if (d && !doorOk(d)) continue;
    if (d && B.type !== 'castle' && mainRegion() && regions()[d.b * N + d.a] !== mainRegion()) continue;   // a door turned into a sealed-off corner
    if (d && buildings.some(o => o !== B && !o.dead && !WALK[o.type] && o.type !== 'gate' && occB[d.b * N + d.a] === o)) continue;
    B.face = f; B.door = d; B.group.rotation.y = f * Math.PI / 2; if (B.scaffold) B.scaffold.rotation.y = B.group.rotation.y;
    rebuildRoads(); villagers.forEach(v => v.path = null); regionDirty = true; select(B); return;
  }
  setHint('Door blocked', 'bad');
}
// the dock can be folded down to its Select and Grid buttons for a clear view (Jack); the fold button shares its slot with Rotate,
// which only shows while placing something that turns: folded, no build tool is picked, so the slot is the unfold button
var dockMini = false;
const DOCK_ICO = { min: '<svg viewBox="0 0 24 24"><path d="M6 9.5 L12 15.5 L18 9.5"/></svg>', max: '<svg viewBox="0 0 24 24"><path d="M6 14.5 L12 8.5 L18 14.5"/></svg>' };
function syncDockBtns() {
  const rot = !!(ROTATES[tool] || FACING[tool]) && !dockMini, b = $('#dockMin');
  $('#rotBtn').hidden = !rot; b.hidden = rot;
  b.innerHTML = DOCK_ICO[dockMini ? 'max' : 'min']; b.title = dockMini ? 'Show the bar' : 'Hide the bar'; b.setAttribute('aria-label', b.title);
}
function setDockMini(on) {
  dockMini = on; document.body.classList.toggle('dockMini', on);
  if (on && tool !== 'select') setTool('select'); else syncDockBtns();
  if (typeof guideMark === 'function') guideMark();
  // the hint's spot beside the folded bar (upright phones, CSS): the bar's width, and the lift that centres the pill on its row
  if (on) requestAnimationFrame(() => { const d = document.querySelector('.dock'), bar = d.querySelector('.bar'), h = $('#hint');
    d.style.setProperty('--barW', bar.offsetWidth + 'px'); d.style.setProperty('--hintB', Math.max(0, (bar.offsetHeight - h.offsetHeight) / 2) + 'px'); });
}
$('#dockMin').addEventListener('click', () => setDockMini(!dockMini));
function setTool(t) {
  tool = t;
  if (dockMini && t !== 'select') { dockMini = false; document.body.classList.remove('dockMini'); }   // picking a tool (a number key) unfolds it
  syncDockBtns();
  for (const c in CATS) if (CATS[c].includes(t) && c !== cat) { cat = c; renderTools(); }
  markTools();
  if (tool === 'select') { hideGhost(); setHint('Select a building'); }
  else if (cur) regho();
  else setHint(isTouch ? 'Tap to place' : 'Pick a spot');
}
document.querySelector('.util .tool').addEventListener('click', () => setTool('select'));
$('#gridBtn').addEventListener('click', e => { grid.visible = !grid.visible; e.currentTarget.setAttribute('aria-pressed', String(grid.visible)); });
// pause menu icons
const PICO = {
  play: '<svg viewBox="0 0 24 24"><path class="solid" d="M7.5 4.5 L19.5 12 L7.5 19.5 Z"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M3.5 11.5 L12 4 L20.5 11.5"/><path d="M6 10 V19.5 H10 V14.5 H14 V19.5 H18 V10"/></svg>',
  restart: '<svg viewBox="0 0 24 24"><path d="M4.5 12 a7.5 7.5 0 1 0 2.2-5.3"/><path d="M6.5 3 V6.9 H10.4"/></svg>',
  tick: '<svg viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7"/></svg>',
  no: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M6.3 17.7 L17.7 6.3"/></svg>',
};
$('#resumeBtn').innerHTML = PICO.play; $('#reset').innerHTML = PICO.restart;
// the pause card (Jack: an app is always full screen, so Full screen gave way to Main menu): Main menu goes back to this stage on the
// campaign, Restart plays the stage again at once; each takes two taps within 3 s
function armTwice(btn, ico, act) {
  let t = 0;
  btn.addEventListener('click', () => {
    if (t && performance.now() - t < 3000) { t = 0; btn.innerHTML = ico; btn.classList.remove('armed'); act(); return; }
    t = performance.now(); btn.innerHTML = PICO.tick; btn.classList.add('armed');
    setTimeout(() => { if (t && performance.now() - t >= 2900) { t = 0; btn.innerHTML = ico; btn.classList.remove('armed'); } }, 3000);
  });
}
$('#menuBtn').innerHTML = PICO.home;
armTwice($('#menuBtn'), PICO.home, () => showStart());
armTwice($('#reset'), PICO.restart, () => { setPaused(false); hushSfx(); startGame(); });
// the summary's Restart plays the same stage again (same picks and difficulty); Continue / Main menu goes to a stage's preview
$('#sumRestart').addEventListener('click', () => { clearSummary(); hushSfx(); paused = false; startGame(); });
$('#sumNext').addEventListener('click', () => {
  const u = unlockNext; unlockNext = null;
  if (nextStage < 0) { showStart(); return; }
  showMapPick(); $('#mapPick').hidden = true; openCampaign(nextStage); if (u != null) unlockCard(u);
});
