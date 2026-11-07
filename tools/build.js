// Builds index.html from src/ (node tools/build.js): src/page.html with its <!--@style--> line replaced by src/style.css and its
// <!--@game--> line by every src/game/*.js in name order. The game stays one file (phones load one page; GitHub Pages serves it
// as is), but it is edited in parts. It also writes sw.js (offline play) from src/sw.js. --check only compares: it exits 1 if index.html is not what src/ builds (tools/check.js runs it).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src');
function build() {
  const page = fs.readFileSync(path.join(SRC, 'page.html'), 'utf8').split('\n');
  const css = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
  const game = fs.readdirSync(path.join(SRC, 'game')).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(SRC, 'game', f), 'utf8')).join('');
  const out = page.map(l => l === '<!--@style-->' ? css.replace(/\n$/, '') : l === '<!--@game-->' ? game.replace(/\n$/, '') : l);
  return out.join('\n');
}
// sw.js (offline play): src/sw.js with FILES filled in: every file the game loads, each with a hash of its contents. The long
// loops are kept as their .m4a copies (phones play those), every other sound as is.
function precache() {
  const list = ['vendor/three.min.js', 'manifest.json', 'apple-touch-icon.png', 'icon-512.png', 'favicon.png'];
  for (const d of ['maps', 'maps/thumb']) for (const f of fs.readdirSync(path.join(ROOT, d)).sort()) if (/\.(jpg|png)$/.test(f)) list.push(d + '/' + f);
  for (const d of ['audio/music', 'audio/sfx']) { const fl = fs.readdirSync(path.join(ROOT, d)).sort();
    for (const f of fl) if (f.endsWith('.m4a') || (f.endsWith('.mp3') && !fl.includes(f.replace(/\.mp3$/, '.m4a')))) list.push(d + '/' + f); }
  return list.map(p => [p, require('crypto').createHash('sha1').update(fs.readFileSync(path.join(ROOT, p))).digest('hex').slice(0, 10)]);
}
const FONTS = (fs.readFileSync(path.join(SRC, 'page.html'), 'utf8').match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/) || [])[1] || '';
const sw = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8').replace('/*@files*/', JSON.stringify(precache())).replace('/*@fonts*/', JSON.stringify(FONTS.replace(/&amp;/g, '&')));
const html = build(), file = path.join(ROOT, 'index.html'), swFile = path.join(ROOT, 'sw.js');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(file, 'utf8') !== html) { console.error('index.html is out of date with src/: run node tools/build.js'); process.exit(1); }
  if (!fs.existsSync(swFile) || fs.readFileSync(swFile, 'utf8') !== sw) { console.error('sw.js is out of date (src/sw.js, or a picture or sound changed): run node tools/build.js'); process.exit(1); }
  console.log('ok · index.html and sw.js match src/');
} else { fs.writeFileSync(file, html); fs.writeFileSync(swFile, sw); console.log(`built index.html · ${(html.length / 1024).toFixed(0)} KB · sw.js`); }
