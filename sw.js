// Offline play (Jack): built into ./sw.js by tools/build.js, which fills in FILES (every file the game loads, with a hash of its
// contents). Installing fetches only the files whose hash changed since the last version, so an update costs only what changed.
// The page itself (index.html) comes from the network first and from the phone when there is none; everything else from the phone
// first. Sounds the page plays through <audio> ask for byte ranges, which are cut from the stored file (Safari needs that).
const FILES = [["vendor/three.min.js","7a7802bf4f"],["manifest.json","abcb60e4a9"],["apple-touch-icon.png","eb64bc0a0e"],["icon-512.png","71e8f22e59"],["favicon.png","52547fffdd"],["maps/bend.jpg","6bae4e6c7f"],["maps/bridge.jpg","f17ef35b01"],["maps/crag.jpg","dc99ee249d"],["maps/cross.jpg","5b50310414"],["maps/dune.jpg","5983025d0d"],["maps/ford.jpg","99fef2f6dc"],["maps/hold.jpg","83052cdc3b"],["maps/isle.jpg","d8856c81b1"],["maps/keep.jpg","a1a6458f72"],["maps/meadow.jpg","8f3909a907"],["maps/menu-bg.jpg","e46653f5f7"],["maps/mere.jpg","5f09f7f466"],["maps/pass.jpg","439c4def8e"],["maps/plains.jpg","87dbc38b7b"],["maps/vale.jpg","827c653679"],["maps/watch.jpg","733f08e703"],["maps/thumb/bend.jpg","8fd31d05f3"],["maps/thumb/bridge.jpg","7868c5151e"],["maps/thumb/crag.jpg","fd9ca73f33"],["maps/thumb/cross.jpg","8388a08714"],["maps/thumb/dune.jpg","5a61041e53"],["maps/thumb/ford.jpg","1f32173d80"],["maps/thumb/hold.jpg","524c328237"],["maps/thumb/isle.jpg","8d23cb5118"],["maps/thumb/keep.jpg","1a0d2e74c5"],["maps/thumb/meadow.jpg","4d09484671"],["maps/thumb/mere.jpg","6eebac2517"],["maps/thumb/pass.jpg","48289e72d5"],["maps/thumb/plains.jpg","5d7257fcd0"],["maps/thumb/vale.jpg","31fbd8ee1f"],["maps/thumb/watch.jpg","d09218aa64"],["audio/music/Defeat_sound.mp3","911988048d"],["audio/music/Medieval_theme_music.m4a","ec18a9d07f"],["audio/music/Medieval_theme_music_2.m4a","d8189a0c22"],["audio/music/Night_theme_music.m4a","31346dfe78"],["audio/music/Victory_sound.mp3","6b7e1232c6"],["audio/sfx/Achievement_sound.mp3","b42ec47a39"],["audio/sfx/Alert_sound.mp3","401c6f41f9"],["audio/sfx/Arrow_hit.mp3","f2893533ea"],["audio/sfx/Arrow_shot.mp3","7981296a85"],["audio/sfx/Attack_clash.mp3","19cce4ce74"],["audio/sfx/Ballista_bolt_shot.mp3","15ad4dc222"],["audio/sfx/Battleram_hit.mp3","1ace3446a9"],["audio/sfx/Bird_chirping.m4a","0c4ce030dc"],["audio/sfx/Builder_hammer.mp3","5655d6a021"],["audio/sfx/Building_built.mp3","9d3c5be67b"],["audio/sfx/Building_destroyed.mp3","cb85009213"],["audio/sfx/Building_sold.mp3","345d4f13ac"],["audio/sfx/Chicken_cluck.mp3","50f33db73c"],["audio/sfx/Click_sound.mp3","ec4c487450"],["audio/sfx/Coins_payout.mp3","5683e2d7eb"],["audio/sfx/Cow_moo.mp3","f2ec46b667"],["audio/sfx/Crossbow_quiver_shot.mp3","8dc747b233"],["audio/sfx/Enemy_attack_1.mp3","db225411ec"],["audio/sfx/Enemy_attack_2.mp3","00d5a855f7"],["audio/sfx/Enemy_grunt_1.mp3","29277d2071"],["audio/sfx/Enemy_grunt_2.mp3","49ccc39f81"],["audio/sfx/Error_sound.mp3","512396b6a0"],["audio/sfx/Farmer_hoe.mp3","aaedcbf8f7"],["audio/sfx/Fire_sound.m4a","4fede04031"],["audio/sfx/Horse_gallop.m4a","d610efa345"],["audio/sfx/Horse_neigh.mp3","8fb4a366a8"],["audio/sfx/Market_trade.mp3","00a85fc99b"],["audio/sfx/Mason_pick.mp3","7ec1ec9cf6"],["audio/sfx/Morning_rooster.mp3","a1e23bb5d3"],["audio/sfx/Pig_oink.mp3","249e669bc7"],["audio/sfx/Rain_sound.m4a","2f14dfb23e"],["audio/sfx/River_water_flow.m4a","07358011fb"],["audio/sfx/Rock_fired.mp3","d074f75b99"],["audio/sfx/Rock_hit_ground.mp3","6cff60a0ad"],["audio/sfx/Star_sound.mp3","268a9fcfba"],["audio/sfx/Unlock_stage.mp3","0b8458fbaf"],["audio/sfx/Upgrade_sound.mp3","47fad8ba02"],["audio/sfx/Villager_yawn.mp3","c881ba647a"],["audio/sfx/Wave_horn.mp3","a069954106"],["audio/sfx/Wind_sound.m4a","976cf360a9"],["audio/sfx/Woodcutter_axe.mp3","ac5b579a08"]], FONTS = "https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=Alegreya+Sans:wght@400;500;700&display=swap";
const CACHE = 'mtd', HASHES = '__hashes', PAGE = 'index.html';
// the game's build: a new build is a new sw.js, so the phone installs it and stores the new page
const BUILD = 'a79d79abbe';
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
  // and any copy kept under an address with a ?v= on it: a lookup that ignores the ?v= could find that old copy before the
  // fresh one, so a replaced sound kept playing its old recording (Jack heard the old unlock sound)
  for (const k of await c.keys()) if (same(k.url) && new URL(k.url).search) await c.delete(k);
  await c.put(HASHES, new Response(JSON.stringify(now)));
  await self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// the page: from the network (kept for next time), or the stored copy when there is no network or it takes over 4 s
async function page(req) {
  const c = await caches.open(CACHE);
  // past the browser's own cache too (GitHub Pages lets it keep the page 10 minutes): an old page could come back after an update
  const net = fetch(req.url, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(PAGE, r.clone()); return r; });
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
  if (own && /\/version\.json$/.test(req.url.split('?')[0])) return;   // the update check always asks the network
  // the sounds are asked for with ?v=N: the game's own files are looked up by their plain address, the one the install keeps
  // fresh (a lookup ignoring the ?v= could find an old copy kept under another ?v=: Jack heard the old unlock sound);
  // the fonts' answers vary by browser
  const key = own ? req.url.split('?')[0] : req, opt = { ignoreVary: !own };
  const range = req.headers.get('range');
  if (range) return e.respondWith(caches.match(key, opt).then(hit => hit ? ranged(hit, range) : fetch(req)));
  e.respondWith(caches.match(key, opt).then(hit => hit || fetch(req).then(r => {
    // the game's own files are kept under their plain address (no ?v=), the one the install refreshes
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(key, cp)); }
    return r;
  })));
});
