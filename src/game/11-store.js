// ---------- the full game (Jack: free to download, Stages 1 to 3 free; one purchase opens Stage 4 on, the bonus stages too)
// The website plays the same as the app (Jack): Stage 4 on is shut there as well, and its Unlock says the full game is in the
// app. Inside the app the purchase goes through the game's own StoreKit plugin (plugins/store, Capacitor.Plugins.Store).
// Owning it is kept in localStorage['mtd-full'] (mirrored to the app's own storage like every mtd- key, and never cleared by
// Reset campaign) and checked again with the App Store at every start, so a purchase made on another iPhone, an Ask to Buy
// approved later or a refund all come through. ?debug owns it, for testing.
var FULL_ID = 'com.jacktan.castledefense.fullgame', FREE_N = 3, fullPrice = '', buying = false;
var STORE = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Store || null;
function fullOwned() { if (devOn) return true; try { return localStorage.getItem('mtd-full') === '1'; } catch (e) { return false; } }
function paidStage(i) { return i >= FREE_N && !fullOwned(); }
function setFull(on) {
  const was = fullOwned();
  try { if (on) localStorage.setItem('mtd-full', '1'); else localStorage.removeItem('mtd-full'); } catch (e) {}
  if (on && !was) { if (!$('#campaign').hidden) revealFull(); else pendingReveal = true; }
  else if (!$('#campaign').hidden) { buildDeck(); layoutDeck(false); openStage(cSel); }
  renderColours();
}
// ---------- what the full game brings (Jack): until bought, Stages 4 to 15 show no picture on the campaign, only a dark cover
// with the padlock and a grey edge, and their back a teaser; once bought, a parchment card stamped with the seal, then the deck
// sweeps through them and each picture is revealed in turn; a gold crown on the title's castle; gold and white colours
var REVEAL = new Set(), pendingReveal = false;
function coverOn(i) { return i >= FREE_N && (!fullOwned() || REVEAL.has(i)); }
var TEASE = '<b class="tzH">Full Game</b><span class="tz">Stages 4 to 12</span><span class="tz">Two bosses</span><span class="tz">Three bonus stages</span><span class="tz">Gold and white colours</span><span class="tz">One purchase, yours to keep</span>';
function revealFull() {
  for (let i = FREE_N; i < CAMPAIGN.length; i++) REVEAL.add(i);
  buildDeck(); selectStage(FREE_N, true);
  const w = $('#fullWrap'), seal = $('#fullSeal');
  if (!seal.firstChild) seal.innerHTML = sealIco('full');
  w.hidden = false; w.classList.remove('stamped'); void w.offsetWidth; w.classList.add('stamped');
  setTimeout(() => sfx('unlock'), 350);
  w.onclick = () => { if (w._t && performance.now() - w._t < 900) return; w.hidden = true; w.onclick = null; sfx('click'); revealSweep(); };
  w._t = performance.now();
}
function revealSweep() {
  const idx = [...REVEAL].sort((a, b) => a - b), STEP = 650, T0 = 500;
  idx.forEach((i, k) => setTimeout(() => {
    if ($('#campaign').hidden) { REVEAL.clear(); return; }
    if (k) selectStage(i, true);
    setTimeout(() => {
      const card = document.querySelector(`.cCard[data-i="${i}"]`); if (!card) return;
      card.querySelector('.cPic').style.backgroundImage = `url(maps/thumb/${CAMPAIGN[i].map}.jpg)`;
      card.classList.add('revealing');
      // open by progress: its padlock springs open; still locked by progress: the picture shows grey and the padlock stays
      if (!campState().locked[i]) card.querySelector('.jLock')?.classList.add('opening');
      sfx('star', null, .55);
    }, 260);
  }, T0 + k * STEP));
  setTimeout(() => { REVEAL.clear(); if ($('#campaign').hidden) return; buildDeck(); selectStage(FREE_N, true); }, T0 + idx.length * STEP + 1400);
}
// a gold crown on top of the castle's flag pole on the title's showcase (only the tier-3 castle has one there)
var crownM = null;
function crownCastle(K) {
  if (!K || !K.group) return; let pole = null;
  K.group.traverse(o => { if (!pole && o.isMesh && o.geometry.parameters && Math.abs((o.geometry.parameters.height || 0) - 1.8) < .01 && Math.abs((o.geometry.parameters.width || 0) - .07) < .01 && o.position.y > 5) pole = o; });
  if (!pole) return;
  if (!crownM) crownM = new THREE.MeshStandardMaterial({ color: '#e8b53c', metalness: .55, roughness: .32, emissive: '#5a3a08', emissiveIntensity: .35 });
  const c = new THREE.Group(), R = .3;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R, R * .9, .2, 18, 1, true), crownM); band.material.side = THREE.DoubleSide; c.add(band);
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, pt = new THREE.Mesh(new THREE.ConeGeometry(.075, .24, 6), crownM);
    pt.position.set(Math.cos(a) * R * .97, .2, Math.sin(a) * R * .97); c.add(pt);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), crownM); ball.position.set(Math.cos(a) * R * .97, .34, Math.sin(a) * R * .97); c.add(ball); }
  c.position.set(pole.position.x, pole.position.y + .9 + .1, pole.position.z); c.userData.noShadow = true;
  pole.parent.add(c);
}
// a short line in the small black strip over the details' button (like Hard's "Win 3 stars to unlock")
function buyMsg(t) { const p = $('#buyMsg'); if (!p) return; p.textContent = t; p.hidden = true; void p.offsetWidth; p.hidden = false; clearTimeout(p._t); p._t = setTimeout(() => p.hidden = true, 2200); }
function buyFull() {
  if (!STORE) { sfx('nope'); buyMsg('Full game in the app'); return; }
  if (buying) return; buying = true; openStage(cSel);
  STORE.buy({ id: FULL_ID }).then(r => {
    buying = false;
    if (r && r.state === 'bought') setFull(true);
    else { openStage(cSel); if (r && r.state === 'pending') buyMsg('Waiting for approval'); else if (r && r.state === 'failed') buyMsg('Purchase failed'); }
  }).catch(() => { buying = false; openStage(cSel); buyMsg('Store not available'); });
}
// Restore purchases (Apple requires it), in Settings; only in the app (the website can't buy)
function restoreFull(btn) {
  if (!STORE || btn.disabled) return;
  const say = t => { btn.textContent = t; clearTimeout(btn._t); btn._t = setTimeout(() => { btn.textContent = 'Restore purchases'; btn.disabled = false; }, 2200); };
  btn.disabled = true; btn.textContent = 'Restoring…';
  STORE.restore().then(r => { const ok = !!(r && r.ids && r.ids.includes(FULL_ID)); if (ok) setFull(true); say(ok ? 'Restored' : 'Nothing to restore'); })
    .catch(() => say('Store not available'));
}
$('#fullWrap').addEventListener('pointerdown', e => e.stopPropagation());
if ($('#setRestore')) { $('#setRestoreRow').hidden = !STORE; $('#setRestore').addEventListener('click', e => restoreFull(e.currentTarget)); }
if (STORE) {
  // the price in the player's own currency, and what this Apple account owns (works offline)
  STORE.products({ ids: [FULL_ID] }).then(r => { const p = r && r.products && r.products[0]; if (p) { fullPrice = p.price; if (!$('#campaign').hidden) openStage(cSel); } }).catch(() => {});
  STORE.owned().then(r => { if (r && r.ids && r.ids.includes(FULL_ID)) setFull(true); }).catch(() => {});
  try { STORE.addListener('owned', d => { if (d && d.ids && d.ids.includes(FULL_ID)) setFull(!d.revoked); }); } catch (e) {}
}

// TEMPORARY, for testing the purchase on a phone (Jack): five quick taps on the campaign's "N / 12 stages" line mark Stages 1
// to 3 won (1 star each) and turn the deck to Stage 4. Set TEST_SKIP to false (or remove this) before the App Store release.
var TEST_SKIP = true;
if (TEST_SKIP) { let n = 0, t0 = 0;
  $('#campStars').addEventListener('click', () => {
    const now = performance.now(); if (now - t0 > 3000) n = 0; if (!n) t0 = now;
    if (++n < 5) return; n = 0;
    for (const c of CAMPAIGN.slice(0, FREE_N)) STARS[c.map] = Math.max(STARS[c.map] || 0, 1);
    try { localStorage.setItem('mtd-stars', JSON.stringify(STARS)); } catch (e) {}
    sfx('unlock'); openCampaign(FREE_N);
  });
}
