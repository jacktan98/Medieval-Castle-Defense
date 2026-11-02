// Renders the map picker's pictures from the real maps: maps/meadow.jpg, maps/isle.jpg and maps/pass.jpg (top-down view of the whole map, no UI),
// and the stage previews' pictures (maps/vale.jpg, Stage 1, seen from the south-west).
//   node tools/render/maps.js [--three path/to/three.min.js]
const path = require('path'), fs = require('fs');
const { openGame } = require('./serve');
const ROOT = path.resolve(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const VIEW = { meadow: [28, 0, 28, 0, 1.56, 64], isle: [28, 0, 28, 0, 1.56, 64], pass: [28, 4, 28, 0, 1.56, 64], vale: [27, 2, 30, -0.7854, .9, 48] };   // vale: Stage 1's preview, from the south-west    // straight down over the whole map    // target x, y, z, yaw, pitch, dist
(async () => {
  const { page, close, errors } = await openGame('index.html?debug&map=meadow', { three: arg('--three'), viewport: { width: 400, height: 400 } });
  const only = process.argv.slice(2).filter(a => VIEW[a]);   // e.g. `node tools/render/maps.js vale` renders just that one
  for (const m of only.length ? only : Object.keys(VIEW)) {
    const v = VIEW[m];
    await page.evaluate(m => G(`try { localStorage['mtd-guide'] = 'done'; } catch (e) {} guideFinish(); MAP = '${m}'; startGame(); paused = true; 0`), m);
    await page.waitForTimeout(1500);
    const url = await page.evaluate(v => G(`for (const u of villagers) u.g.visible = false; hideGhost(); deselect();
      target.set(${v[0]}, ${v[1]}, ${v[2]}); yaw = ${v[3]}; pitch = ${v[4]}; dist = ${v[5]}; CAM_LIM.far = 200; updateCam();
      renderer.setPixelRatio(1); renderer.setSize(400, 400, false); camera.aspect = 1; camera.updateProjectionMatrix();
      renderer.render(scene, camera); renderer.domElement.toDataURL('image/jpeg', .86)`), v);
    fs.writeFileSync(path.join(ROOT, 'maps', m + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote maps/' + m + '.jpg');
  }
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await close();
})();
