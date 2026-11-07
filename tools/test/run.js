// Plays the real game headless and checks it still works (Playwright + Chromium; see tools/render/README.md for setup).
//   node tools/test/run.js            every check, every stage (a few minutes)
//   node tools/test/run.js --quick    the menus and three stages only (under a minute or two)
//   node tools/test/run.js vale keep  just these stages (and the menus)
// Each stage is started on a fixed seed and played fast through the game's own tick() (no drawing): a house and a tower are
// placed by the castle and must get built, then night falls and its raiders must spawn and set off for the town. Any page error
// fails the run. Exits 1 if anything failed, so run it before a push alongside tools/check.js.
const { openGame } = require('../render/serve');
const args = process.argv.slice(2), quick = args.includes('--quick');
const STAGES = ['vale', 'bridge', 'cross', 'watch', 'dune', 'bend', 'crag', 'ford', 'mere', 'plains', 'keep', 'hold', 'meadow', 'isle', 'pass'];
const pick = args.filter(a => STAGES.includes(a)), stages = pick.length ? pick : quick ? ['vale', 'ford', 'keep'] : STAGES;
let fails = 0;
const ok = (cond, what, more) => { if (!cond) fails++; console.log(`${cond ? '  ok  ' : '  FAIL'} ${what}${more ? ' · ' + more : ''}`); return cond; };

(async () => {
  const t0 = Date.now();
  // 1) the plain page: the title, with no errors; the campaign, a stage and the upgrades open
  {
    console.log('title and menus');
    const g = await openGame('index.html', { title: true, viewport: { width: 390, height: 844 }, settle: 1500 }), p = g.page;
    ok(await p.evaluate(() => !document.getElementById('mapPick').hidden), 'title screen shows');
    await p.click('#campBtn'); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !document.getElementById('campaign').hidden && document.querySelectorAll('.cCard').length === 15), 'campaign opens with 15 stages (12 and 3 bonus)');
    await p.click('#campUpBtn', { force: true }).catch(() => {}); await p.waitForTimeout(600);
    ok(await p.evaluate(() => !document.getElementById('upPick').hidden), 'upgrades screen opens');
    ok(!g.errors.length, 'no page errors', g.errors.join(' | ')); await g.close();
  }
  // 2) every stage, played fast
  const g = await openGame('index.html?debug&map=vale', { viewport: { width: 320, height: 240 }, settle: 1000 }), p = g.page;
  const G = s => p.evaluate(s => window.G(s), s);
  await G(`window.SEEN = new Set(); window.SIM = secs => { paused = true; let t = performance.now(); const n = Math.round(secs * 20);
    for (let i = 0; i < n; i++) { t += 50; tick(.05, t); for (const e of enemies) if (!e.sp0 && !e.dormant) { e.sp0 = { x: e.x, z: e.z }; SEEN.add(e); }
      if (i % 4 === 0) { updateHud(); goalTick(); } if (gameOver) break; } paused = false; }; 0`);
  for (const m of stages) {
    console.log(m);
    const before = g.errors.length;
    try {
      await G(`try { localStorage['mtd-guide'] = 'done'; } catch (e) {} hardOn = false; MAP = '${m}'; nextSeed = 4242; gameOver = false; startGame();
        $('#newCards').hidden = true; newCards = []; paused = false; guideOn = false; 0`);
      const s = JSON.parse(await G(`JSON.stringify({ castle: !!castleB(), vill: villagers.length, n: N, nights: NIGHTS, trees: trees.length, rocks: rocks.length })`));
      ok(s.castle && s.vill >= 3, 'starts with a castle and villagers', `${s.vill} villagers, ${s.n}×${s.n}, ${s.nights} nights, ${s.trees} trees, ${s.rocks} rocks`);
      // a house and a tower by the castle, built by the villagers
      const placed = JSON.parse(await G(`res.gold = res.wood = res.stone = res.food = 9999; const C = castleB(), ci = C.ev.ci, cj = C.ev.cj, out = []; window.MINE = [];
        for (const [t, di, dj] of [['house', 3, 0], ['tower', -3, 2]]) { const ev = findValid(t, ci + di, cj + dj); const B = ev && place(t, ev.ci, ev.cj, {}); out.push(!!B); if (B) MINE.push(B); }
        JSON.stringify(out)`));
      ok(placed.every(Boolean), 'a house and a tower can be placed');
      await G(`SIM(150); 0`);
      const built = JSON.parse(await G(`JSON.stringify(MINE.map(B => B.type + (B.site ? ' ' + Math.round(B.site.progress * 100) + '%' : ' built')))`));
      ok(built.length === 2 && built.every(b => b.endsWith('built')), 'they get built in 150 s', built.join(', '));
      // night 1: raiders spawn on the map and head for the town
      await G(`SEEN.clear(); PH.t = .01; SIM(60); 0`);
      const r = JSON.parse(await G(`const E = [...SEEN], bad = E.filter(e => !isFinite(e.x) || !isFinite(e.z));
        const moved = E.filter(e => e.sp0 && Math.hypot(e.x - e.sp0.x, e.z - e.sp0.z) > 4);
        JSON.stringify({ kind: PH.kind, n: E.length, dead: E.filter(e => e.dead).length, queue: spawnQueue.length, bad: bad.length, moved: moved.length, wave: PH.wave })`));
      ok(r.n > 0, 'raiders spawn at nightfall', `${r.n} seen, ${r.queue} still to come`);
      ok(!r.bad, 'no raider at a broken position');
      ok(r.moved >= r.n * .5, 'raiders set off from their spawn', `${r.moved} moved over 4 m, ${r.dead} slain`);
      await G(`SIM(240); 0`);
      const end = JSON.parse(await G(`JSON.stringify({ kind: PH.kind, wave: PH.wave, over: gameOver, castle: !!castleB() && castleB().hp > 0 })`));
      ok(true, 'night played on', `${end.over ? 'game over' : end.kind + ' ' + end.wave}, castle ${end.castle ? 'standing' : 'fallen'}`);
    } catch (e) { ok(false, 'ran without throwing', e.message.split('\n')[0]); }
    ok(g.errors.length === before, 'no page errors', g.errors.slice(before).join(' | '));
  }
  // 3) save and resume give back the same town; the summary opens; the graphics switch
  console.log('save, summary, graphics');
  try {
    await G(`MAP = 'bridge'; nextSeed = 7; gameOver = false; startGame(); $('#newCards').hidden = true; newCards = []; paused = false; res.gold = res.wood = res.stone = 9999;
      const C = castleB(); for (const [t, di, dj] of [['house', 3, 0], ['farm', -4, 0], ['barracks', 0, 4]]) { const ev = findValid(t, C.ev.ci + di, C.ev.cj + dj); ev && place(t, ev.ci, ev.cj, { instant: true, free: true }); } 0`);
    const a = await G(`window.TOWN = () => buildings.filter(B => !B.dead).map(B => B.type + '@' + B.ev.ci + ',' + B.ev.cj + 't' + B.tier).sort().join(' '); saveGame(); TOWN()`);
    await G(`resumeGame(); 0`); const b = await G(`TOWN()`);
    ok(a === b, 'save and resume give back the same buildings', a === b ? '' : `\n      saved   ${a}\n      resumed ${b}`);
    await G(`endGame(true); 0`); await p.waitForTimeout(8000);
    ok(await p.evaluate(() => !document.getElementById('summary').hidden), 'the summary opens after a win');
    await G(`setGfx(true); setGfx(false); 0`); ok(true, 'graphics Low and High switch');
  } catch (e) { ok(false, 'ran without throwing', e.message.split('\n')[0]); }
  ok(!g.errors.length, 'no page errors overall', g.errors.join(' | '));
  await g.close();
  console.log(`\n${fails ? fails + ' failed' : 'all passed'} · ${Math.round((Date.now() - t0) / 1000)} s`);
  process.exit(fails ? 1 : 0);
})();
