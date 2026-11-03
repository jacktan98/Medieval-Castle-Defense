// Renders the campaign overview's ground as one 3D landscape seen straight down: maps/overview.jpg (2400 × 4050), the lands between the
// stops shaped like their stages (woods, dry hills, desert, marsh pools, open plains, rocky highlands, snowy mountains, the raiders'
// red north), the river, the coast, and at every stop the stage itself: each built stage is played once and shrunk into a round patch
// (its ground, water, bridges, trees, rocks and fixed scenery; no castle, buildings or roads). The overview's SVG
// draws the trail, the markers (tools/render/markers.js) and the names on top. Re-run after changing CAMPAIGN, CAMP_LAND or CAMP_RIVER.
//   node tools/render/overview.js [--three path/to/three.min.js]
const path = require('path'), fs = require('fs');
const { openGame } = require('./serve');
const ROOT = path.resolve(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const { page, close, errors } = await openGame('index.html?debug&map=meadow', { three: arg('--three'), viewport: { width: 400, height: 400 } });
  const code = fs.readFileSync(path.join(__dirname, 'overview-scene.js'), 'utf8');
  const url = await page.evaluate(c => { const r = G(c); return typeof r === 'string' ? r : 'ERR ' + (r && r.constructor && r.constructor.name); }, code);
  if (!url.startsWith('data:')) { console.log(url, errors); await close(); return; }
  fs.writeFileSync(path.join(ROOT, 'maps', 'overview.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote maps/overview.jpg');
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await close();
})();
