// Renders the map picker's pictures from the real maps: maps/meadow.jpg, maps/isle.jpg and maps/pass.jpg (top-down view of the whole map, no UI),
// and the stage previews' pictures (maps/vale.jpg Stage 1, maps/bridge.jpg Stage 2, maps/cross.jpg Stage 3, maps/watch.jpg Stage 4; bigger, top-down).
//   node tools/render/maps.js [--three path/to/three.min.js]
const path = require('path'), fs = require('fs');
const { openGame } = require('./serve');
const ROOT = path.resolve(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const VIEW = { meadow: [28, 0, 28, 0, 1.56, 64], isle: [28, 0, 28, 0, 1.56, 64], pass: [28, 4, 28, 0, 1.56, 64], vale: [28, 0, 28, 0, 1.56, 64], bridge: [28, 0, 28, 0, 1.56, 64], cross: [28, 0, 28, 0, 1.56, 64], watch: [28, 2, 28, 0, 1.56, 64], dune: [28, 1, 28, 0, 1.56, 64], bend: [28, 0, 28, 0, 1.56, 64], crag: [28, 1, 28, 0, 1.56, 64], ford: [28, 1, 28, 0, 1.56, 64], mere: [28, 0, 28, 0, 1.56, 64], plains: [28, 0, 28, 0, 1.56, 64], keep: [40, 2, 40, 0, 1.56, 92], hold: [40, 2, 40, 0, 1.56, 92] };   // stage previews framed like the map cards: no sky past the edges   // vale: Stage 1's preview (top-down too, sharper: PX)    // straight down over the whole map    // target x, y, z, yaw, pitch, dist
(async () => {
  const { page, close, errors } = await openGame('index.html?debug&map=meadow', { three: arg('--three'), viewport: { width: 400, height: 400 } });
  const PX = { meadow: 1080, isle: 1080, pass: 1080, vale: 1080, bridge: 1080, cross: 1080, watch: 1080, dune: 1080, bend: 1080, crag: 1080, ford: 1080, mere: 1080, plains: 1080, keep: 1080, hold: 1080 };   // stage previews are drawn bigger: they fill a phone's width at 3× pixels
  const only = process.argv.slice(2).filter(a => VIEW[a]);   // e.g. `node tools/render/maps.js vale` renders just that one
  for (const m of only.length ? only : Object.keys(VIEW)) {
    const v = VIEW[m];
    await page.evaluate(m => G(`try { localStorage['mtd-guide'] = 'done'; } catch (e) {} guideFinish(); MAP = '${m}'; startGame(); paused = true; 0`), m);
    // the stage's weather in its picture, lightly (Jack: not overdone): falling snow and ash a bit more, mist least (it greys the view);
    // seen straight down, rain is only dots and flakes are specks, so for the picture the streaks are slanted longer and the flakes bigger
    await page.evaluate(() => G(`if (WX.K) { WX.w = WX.cfg.kind === 'mist' ? .3 : WX.cfg.always ? .6 : .45; WX.goal = WX.w; if (WX.K.lines) WX.K = Object.assign({}, WX.K, { len: 2.2, wind: WX.K.wind * 6 }); else wxPts.material.size *= 2.2; } 0`));
    await page.waitForTimeout(1500);
    const url = await page.evaluate(([v, px]) => G(`for (const u of villagers) u.g.visible = false; hideGhost(); deselect();
      target.set(${v[0]}, ${v[1]}, ${v[2]}); yaw = ${v[3]}; pitch = ${v[4]}; dist = ${v[5]}; CAM_LIM.far = 200; updateCam();
      renderer.setPixelRatio(1); renderer.setSize(${px}, ${px}, false); camera.aspect = 1; camera.updateProjectionMatrix();
      renderer.render(scene, camera); renderer.domElement.toDataURL('image/jpeg', ${px > 400 ? .9 : .86})`), [v, PX[m] || 400]);
    fs.writeFileSync(path.join(ROOT, 'maps', m + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote maps/' + m + '.jpg');
  }
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await close();
})();
