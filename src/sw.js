// Offline play (Jack): built into ./sw.js by tools/build.js, which fills in FILES (every file the game loads, with a hash of its
// contents). Installing fetches only the files whose hash changed since the last version, so an update costs only what changed.
// The page itself (index.html) comes from the network first and from the phone when there is none; everything else from the phone
// first. Sounds the page plays through <audio> ask for byte ranges, which are cut from the stored file (Safari needs that).
const FILES = /*@files*/, FONTS = /*@fonts*/;
const CACHE = 'mtd', HASHES = '__hashes', PAGE = 'index.html';
const same = u => new URL(u, self.location).origin === self.location.origin;

self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  const old = await c.match(HASHES).then(r => r ? r.json() : {}).catch(() => ({})), now = {};
  await Promise.all(FILES.map(async ([p, h]) => {
    if (old[p] === h && await c.match(p)) { now[p] = h; return; }
    try { const r = await fetch(p, { cache: 'reload' }); if (r.ok) { await c.put(p, r); now[p] = h; } } catch (err) {}
  }));
  try { const r = await fetch(PAGE, { cache: 'reload' }); if (r.ok) await c.put(PAGE, r); } catch (err) {}
  // the fonts' stylesheet and the font files it names (the first visit loads them before this worker runs, so they'd be missed)
  try { const r = await fetch(FONTS); if (r.ok) { const css = await r.clone().text(); await c.put(FONTS, r);
    await Promise.all([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => fetch(m[1]).then(f => f.ok && c.put(m[1], f)).catch(() => {}))); } } catch (err) {}
  // files dropped from the game are dropped from the phone too
  for (const p of Object.keys(old)) if (!(p in now)) await c.delete(p);
  await c.put(HASHES, new Response(JSON.stringify(now)));
  await self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// the page: from the network (kept for next time), or the stored copy when there is no network or it takes over 4 s
async function page(req) {
  const c = await caches.open(CACHE);
  const net = fetch(req).then(r => { if (r.ok) c.put(PAGE, r.clone()); return r; });
  net.catch(() => {}); const late = new Promise(res => setTimeout(res, 4000));
  try {
    const r = await Promise.race([net, late]); if (r) return r;
    return (await c.match(PAGE)) || await net;
  } catch (err) { return (await c.match(PAGE)) || Response.error(); }
}
// a byte range of a stored file, for <audio>
async function ranged(res, range) {
  const buf = await res.arrayBuffer(), L = buf.byteLength, m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  let s = m[1] ? +m[1] : 0, e = m[2] ? Math.min(+m[2], L - 1) : L - 1;
  if (!m[1] && m[2]) { s = Math.max(0, L - +m[2]); e = L - 1; }
  return new Response(buf.slice(s, e + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mp4',
    'Content-Range': `bytes ${s}-${e}/${L}`, 'Content-Length': String(e - s + 1), 'Accept-Ranges': 'bytes' } });
}
const KEEP = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;   // the fonts, kept once fetched
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const own = same(req.url);
  if (req.mode === 'navigate' && own) return e.respondWith(page(req));
  if (!own && !KEEP.test(req.url)) return;
  const opt = { ignoreSearch: own, ignoreVary: !own };   // the sounds are asked for with ?v=N; the fonts' answers vary by browser
  const range = req.headers.get('range');
  if (range) return e.respondWith(caches.match(req, opt).then(hit => hit ? ranged(hit, range) : fetch(req)));
  e.respondWith(caches.match(req, opt).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
