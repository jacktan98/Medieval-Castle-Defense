// Before every push: node tools/check.js. 1) index.html must be what src/ builds (edit src/, then node tools/build.js);
// 2) a syntax check of every inline script (a single syntax error stops the whole game loading on the live site)
const fs = require('fs'), vm = require('vm'), path = require('path'), { execFileSync } = require('child_process');
try { execFileSync(process.execPath, [path.join(__dirname, 'build.js'), '--check'], { stdio: 'inherit' }); } catch (e) { process.exit(1); }
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
try { scripts.forEach((s, i) => new vm.Script(s, { filename: `index.html <script> #${i + 1}` })); console.log(`ok · ${scripts.length} inline script(s)`); }
catch (e) { console.error(e.stack.split('\n').slice(0, 4).join('\n')); process.exit(1); }
