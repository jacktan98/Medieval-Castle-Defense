// Renders the design gallery (index.html?gallery) into contact sheets: one shot per row, front and back.
//   node tools/render/gallery.js [--out design/gallery] [--three path/to/three.min.js] [--back]
// Needs Playwright (npm i -D playwright, then npx playwright install chromium). --three serves another three.js r128
// in place of vendor/three.min.js.
// Writes <out>/sheet.png (all rows, front) and, with --back, <out>/sheet-back.png (every building turned 180°).
const path = require('path'), fs = require('fs');
const { openGame } = require('./serve');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const out = path.resolve(arg('--out', 'design/gallery')), back = process.argv.includes('--back');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { page, close, errors } = await openGame('index.html?gallery&debug', { three: arg('--three'), viewport: { width: 1200, height: 480 } });
  await page.evaluate(() => { document.querySelector('#galBar').hidden = true; });
  const rows = JSON.parse(await page.evaluate(() => G('JSON.stringify(gRows)')));
  const shoot = async tag => {
    const shots = [];
    for (const r of rows) {
      // buildings: the three tiers side by side; people (shallow rows) are small, so two close shots per row
      const views = r.depth > 4 ? [[21, 1, .62, 19]] : r.depth > 1.5 ? [[21, .5, .62, 16]] : r.n > 5 ? [[10.5, .7, .35, 6.5], [22, .7, .35, 6.5]] : [[11, .7, .35, 7.5]];
      for (const v of views) {
        await page.evaluate(([z, v]) => G(`target.set(${v[0]}, ${v[1]}, ${z}); yaw = 0; pitch = ${v[2]}; dist = ${v[3]}; updateCam(); 0`), [r.z, v]);
        await page.waitForTimeout(1200);
        shots.push({ title: r.title, png: (await page.screenshot()).toString('base64') });
      }
    }
    // lay the row shots out two across on one sheet, titled
    const sheet = await page.evaluate(async shots => {
      const W = 1200, H = 480, cols = 2, c = document.createElement('canvas'), k = .5;
      c.width = W * k * cols; c.height = Math.ceil(shots.length / cols) * H * k; const x = c.getContext('2d');
      x.fillStyle = '#20221c'; x.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < shots.length; i++) {
        const im = new Image(); im.src = 'data:image/png;base64,' + shots[i].png; await im.decode();
        const px = (i % cols) * W * k, py = Math.floor(i / cols) * H * k;
        x.drawImage(im, px, py, W * k, H * k);
        x.font = 'bold 18px system-ui'; x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(px, py, x.measureText(shots[i].title).width + 16, 28);
        x.fillStyle = '#f2c95e'; x.fillText(shots[i].title, px + 8, py + 20);
      }
      return c.toDataURL('image/png').split(',')[1];
    }, shots);
    const file = path.join(out, `sheet${tag}.png`); fs.writeFileSync(file, Buffer.from(sheet, 'base64')); console.log('wrote', path.relative(process.cwd(), file));
  };
  await shoot('');
  if (back) { await page.evaluate(() => G('for (const it of gItems) if (it.turns) it.g.userData.turn += 2; 0')); await page.waitForTimeout(1500); await shoot('-back'); }
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await close();
})();
