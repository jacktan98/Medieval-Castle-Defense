// Builds the iPhone/iPad app's files into www/ (node tools/app.js; `npm run app` also runs `npx cap sync ios`): the built
// index.html with three changes for the app, and every file the game loads.
// 1) Fonts: the Google Fonts link is swapped for vendor/fonts (copied to www/fonts), so the app works with no network.
// 2) Saved progress: localStorage can be cleared by iOS when space runs low, so every 'mtd-*' key is also kept in the app's
//    own storage (Capacitor Preferences, which iOS never clears). Before the game starts, a small boot script copies the
//    stored keys back into localStorage, then mirrors every later write; the game's code is unchanged and runs after it.
// 3) Nothing else: the website's offline helper (sw.js) and the update check only run on https, and the app's pages are
//    served from capacitor://, so both stay off inside the app (its updates come from the App Store).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'www');
const copy = (from, to = from) => { const d = path.join(OUT, to); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(ROOT, from), d); };
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// fonts from the app itself
html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, '').replace(/<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/, '<link href="fonts/fonts.css" rel="stylesheet">');
if (/fonts\.googleapis/.test(html)) throw new Error('the Google Fonts link was not replaced');
// the game's script (the last inline one) is held back until the saved progress is restored
const at = html.lastIndexOf('<script>\n'), end = html.indexOf('</script>', at);
if (at < 0 || html.slice(at, end).length < 100000) throw new Error('game script not found');
const BOOT = `<script>
// the app: restore saved progress from the app's own storage, mirror every later save there, then start the game
(async () => {
  const P = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Preferences, own = k => typeof k === 'string' && k.startsWith('mtd-');
  if (P) try {
    const { keys } = await P.keys(), have = new Set(keys);
    await Promise.all(keys.filter(own).map(k => P.get({ key: k }).then(r => { if (r.value != null) localStorage.setItem(k, r.value); })));
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (own(k) && !have.has(k)) P.set({ key: k, value: localStorage.getItem(k) }); }
    const set = Storage.prototype.setItem, rem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) { set.call(this, k, v); if (this === localStorage && own(k)) P.set({ key: k, value: String(v) }).catch(() => {}); };
    Storage.prototype.removeItem = function (k) { rem.call(this, k); if (this === localStorage && own(k)) P.remove({ key: k }).catch(() => {}); };
  } catch (e) {}
  const s = document.createElement('script'); s.textContent = document.getElementById('gameSrc').textContent; document.body.appendChild(s);
})();
</script>
`;
html = html.slice(0, at) + '<script type="text/plain" id="gameSrc">\n' + html.slice(at + 9, end) + '</script>\n' + BOOT + html.slice(end + 9);
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// the files the game loads (the same list sw.js keeps for offline play on the website), and the fonts
const files = ['vendor/three.min.js', 'apple-touch-icon.png', 'icon-512.png', 'favicon.png', 'manifest.json'];
for (const d of ['maps', 'maps/thumb']) for (const f of fs.readdirSync(path.join(ROOT, d)).sort()) if (/\.(jpg|png)$/.test(f)) files.push(d + '/' + f);
for (const d of ['audio/music', 'audio/sfx']) { const fl = fs.readdirSync(path.join(ROOT, d));
  for (const f of fl) if (f.endsWith('.m4a') || (f.endsWith('.mp3') && !fl.includes(f.replace(/\.mp3$/, '.m4a')))) files.push(d + '/' + f); }
files.forEach(f => copy(f));
for (const f of fs.readdirSync(path.join(ROOT, 'vendor/fonts'))) copy('vendor/fonts/' + f, 'fonts/' + f);
const mb = files.reduce((n, f) => n + fs.statSync(path.join(ROOT, f)).size, html.length) / 1048576;
console.log(`built www/ · ${files.length + 1} files · ${mb.toFixed(1)} MB`);
