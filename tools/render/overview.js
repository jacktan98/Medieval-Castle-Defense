// Renders the campaign overview's ground as one 3D landscape seen straight down: maps/overview.jpg (1200 × 2025), the lands shaped like
// their stages (woods, dry hills, desert and mesas, marsh pools, open plains, rocky highlands, snowy mountains, the raiders' red north),
// the river, the coast, and at every stop a little town of the game's own buildings (the bosses' forts darkened). The overview's SVG
// draws the road, the numbered rings and the names on top. Re-run after changing CAMPAIGN, CAMP_LAND or CAMP_RIVER.
//   node tools/render/overview.js [--three path/to/three.min.js]
const path = require('path'), fs = require('fs');
const { openGame } = require('./serve');
const ROOT = path.resolve(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const { page, close, errors } = await openGame('index.html?debug&map=meadow', { three: arg('--three'), viewport: { width: 400, height: 400 } });
  const code = fs.readFileSync(path.join(__dirname, 'overview-scene.js'), 'utf8');
  const url = await page.evaluate(c => G(c), code);
  fs.writeFileSync(path.join(ROOT, 'maps', 'overview.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote maps/overview.jpg');
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await close();
})();
