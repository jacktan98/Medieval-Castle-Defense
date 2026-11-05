// Builds index.html from src/ (node tools/build.js): src/page.html with its <!--@style--> line replaced by src/style.css and its
// <!--@game--> line by every src/game/*.js in name order. The game stays one file (phones load one page; GitHub Pages serves it
// as is), but it is edited in parts. --check only compares: it exits 1 if index.html is not what src/ builds (tools/check.js runs it).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src');
function build() {
  const page = fs.readFileSync(path.join(SRC, 'page.html'), 'utf8').split('\n');
  const css = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
  const game = fs.readdirSync(path.join(SRC, 'game')).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(SRC, 'game', f), 'utf8')).join('');
  const out = page.map(l => l === '<!--@style-->' ? css.replace(/\n$/, '') : l === '<!--@game-->' ? game.replace(/\n$/, '') : l);
  return out.join('\n');
}
const html = build(), file = path.join(ROOT, 'index.html');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(file, 'utf8') !== html) { console.error('index.html is out of date with src/: run node tools/build.js'); process.exit(1); }
  console.log('ok · index.html matches src/');
} else { fs.writeFileSync(file, html); console.log(`built index.html · ${(html.length / 1024).toFixed(0)} KB`); }
