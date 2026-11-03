// Renders the campaign overview's markers with the game's own models (tools/render/markers-scene.js): maps/flag.png (the blue rally
// flag on the current stage) and maps/banner.png (the garrison banner on every stage won), each a strip of looping frames.
// Prints the frame size, count, loop length and foot points that campaignSVG uses (MARKER). Re-run after changing the models.
//   node tools/render/markers.js [--three path/to/three.min.js]
const path = require('path'), fs = require('fs');
const { openGame } = require('./serve');
const ROOT = path.resolve(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const { page, close, errors } = await openGame('index.html?debug&map=meadow', { three: arg('--three'), viewport: { width: 400, height: 400 } });
  const code = fs.readFileSync(path.join(__dirname, 'markers-scene.js'), 'utf8');
  const res = await page.evaluate(c => { const r = G(c); return r && r.flag ? r : 'ERR ' + r; }, code);
  if (typeof res === 'string') { console.log(res, errors); await close(); return; }
  for (const k of ['flag', 'banner']) { fs.writeFileSync(path.join(ROOT, 'maps', k + '.png'), Buffer.from(res[k].split(',')[1], 'base64')); console.log('wrote maps/' + k + '.png'); }
  const { FW, FH, NF, PER, footFlag, footBanner } = res; console.log(JSON.stringify({ FW, FH, NF, PER, footFlag, footBanner }));
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await close();
})();
