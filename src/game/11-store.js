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
function testFree() { try { return TEST_SKIP && localStorage.getItem('mtd-testfree') === '1'; } catch (e) { return false; } }
function setFull(on, user) {
  // test switch (TEST_SKIP): after "forget purchase" the App Store's own record is ignored until a Buy or Restore
  if (on && !user && testFree()) return;
  if (on) try { localStorage.removeItem('mtd-testfree'); } catch (e) {}
  const was = fullOwned();
  try { if (on) localStorage.setItem('mtd-full', '1'); else localStorage.removeItem('mtd-full'); } catch (e) {}
  if (on && !was) { if (!$('#campaign').hidden) revealFull(); else pendingReveal = true; }
  else if (!$('#campaign').hidden) { buildDeck(); layoutDeck(false); openStage(cSel); }
  renderColours(); syncTitleCrown();
}
// ---------- what the full game brings (Jack): until bought, Stages 4 to 15 show no picture on the campaign, only a dark cover
// with the padlock and a grey edge; once bought, a parchment card stamped with the seal, then the deck
// sweeps through them and each picture is revealed in turn; a gold crown beside the title; four more colours (green, purple, black, gold)
var REVEAL = new Set(), pendingReveal = false;
function coverOn(i) { return i >= FREE_N && (!fullOwned() || REVEAL.has(i)); }
// the thank-you card (Jack): it fades in slowly, its words are typed out one line after another, the seal is stamped, then it
// fades out by itself and the stages are revealed; a tap skips straight to the reveal
function revealFull() {
  for (let i = FREE_N; i < CAMPAIGN.length; i++) REVEAL.add(i);
  buildDeck(); selectStage(FREE_N, true);
  const w = $('#fullWrap'), seal = $('#fullSeal'), lines = [...w.querySelectorAll('.ty')], T = [];
  if (!seal.firstChild) seal.innerHTML = sealIco('full');
  lines.forEach(l => { l.dataset.t = l.dataset.t || l.textContent; l.textContent = ''; });
  w.classList.remove('stamped', 'out', 'sealed'); w.hidden = false; void w.offsetWidth; w.classList.add('stamped');
  let done = false; const finish = () => { if (done) return; done = true; T.forEach(clearTimeout);
    lines.forEach(l => l.textContent = l.dataset.t); w.classList.add('out');
    setTimeout(() => { w.hidden = true; w.classList.remove('out'); revealSweep(); }, 700); w.onclick = null; };
  let t = 1100;
  lines.forEach((l, k) => { const txt = l.dataset.t, gap = k < 2 ? 70 : 42;
    for (let c = 1; c <= txt.length; c++) T.push(setTimeout(() => { l.textContent = txt.slice(0, c); }, t + c * gap));
    t += txt.length * gap + (k === 1 ? 450 : 300); });
  T.push(setTimeout(() => { w.classList.add('sealed'); sfx('unlock'); }, t));
  T.push(setTimeout(finish, t + 2200));
  w.onclick = () => { sfx('click'); finish(); };
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
// a gold crown beside the title on the title screen once the full game is owned (Jack; it sat on the showcase castle's flag pole)
function syncTitleCrown() { const c = $('#titleCrown'); if (!c) return; if (!c.firstChild) c.innerHTML = CROWN_ICO; c.hidden = !fullOwned(); }
syncTitleCrown();
// a short line in the small black strip over the details' button (like Hard's "Win 3 stars to unlock")
function buyMsg(t) { const p = $(!$('#offerWrap').hidden ? '#offerMsg' : '#buyMsg'); if (!p) return; p.textContent = t; p.hidden = true; void p.offsetWidth; p.hidden = false; clearTimeout(p._t); p._t = setTimeout(() => p.hidden = true, 2200); }
function buyFull() {
  if (!STORE) { sfx('nope'); buyMsg('Full game in the app'); return; }
  if (buying) return; buying = true; openStage(cSel); syncOfferBtn();
  STORE.buy({ id: FULL_ID }).then(r => {
    buying = false; syncOfferBtn();
    if (r && r.state === 'bought') { hideOffer(); setFull(true, true); }
    else { openStage(cSel); if (r && r.state === 'pending') buyMsg('Waiting for approval'); else if (r && r.state === 'failed') buyMsg('Purchase failed'); }
  }).catch(() => { buying = false; syncOfferBtn(); openStage(cSel); buyMsg('Store not available'); });
}
// Restore purchases (Apple requires it), in Settings; only in the app (the website can't buy)
function restoreFull(btn) {
  if (!STORE || btn.disabled) return;
  const say = t => { btn.textContent = t; clearTimeout(btn._t); btn._t = setTimeout(() => { btn.textContent = 'Restore purchases'; btn.disabled = false; }, 2200); };
  btn.disabled = true; btn.textContent = 'Restoring…';
  STORE.restore().then(r => { const ok = !!(r && r.ids && r.ids.includes(FULL_ID)); if (ok) setFull(true, true); say(ok ? 'Restored' : 'Nothing to restore'); })
    .catch(() => say('Store not available'));
}
// the offer card: what the full game brings, and the same Unlock (Jack)
var OFFER_DOTS = '<svg viewBox="0 0 24 24" stroke-linejoin="round"><path d="M12 2.8 C6 2.8 2 6.8 2 11.6 C2 16.6 6.2 20.8 11.4 20.8 C13.2 20.8 13.6 19.6 13 18.4 C12.3 17 13.2 15.6 14.8 15.6 H17.6 C20.2 15.6 22 13.8 22 11.2 C22 6.4 17.6 2.8 12 2.8 Z" fill="#c99a5c" stroke="#5a3a16" stroke-width="1.2"/><circle cx="7.4" cy="13.6" r="1.7" fill="#3f8f3a" stroke="#1f4a1c" stroke-width=".6"/><circle cx="7.6" cy="8.4" r="1.7" fill="#7b4fb0" stroke="#3d2466" stroke-width=".6"/><circle cx="12.2" cy="6.4" r="1.7" fill="#262626" stroke="#000" stroke-width=".6"/><circle cx="16.8" cy="8.4" r="1.7" fill="#e2b445" stroke="#7a5a10" stroke-width=".6"/><circle cx="17.2" cy="12.6" r="1.25" fill="#7a5530" stroke="#5a3a16" stroke-width=".7"/></svg>';
var MAP_ICO = '<svg viewBox="0 0 24 24" stroke="#4a3518" stroke-width="1.3" stroke-linejoin="round"><path d="M3 6 L9 4 V18 L3 20 Z" fill="#e8d6a8"/><path d="M9 4 L15 6 V20 L9 18 Z" fill="#d6c08c"/><path d="M15 6 L21 4 V18 L15 20 Z" fill="#e8d6a8"/><path d="M4.5 15 C6 12 7 13 7.6 10" fill="none" stroke="#4f8f3c" stroke-width="1.4"/><path d="M10.5 9 C12 11 13 8 13.6 12" fill="none" stroke="#3f7fc0" stroke-width="1.4"/><path d="M17 15 L18 12 L19.5 14" fill="none" stroke="#7a6a50" stroke-width="1.2"/><circle cx="18.4" cy="8.6" r="1.3" fill="#c0392b" stroke="none"/></svg>';
var RED_CROWN = '<svg viewBox="0 0 24 24" stroke-linejoin="round"><path d="M2.5 7.5 L7.2 12 L12 4 L16.8 12 L21.5 7.5 L19.4 17.5 H4.6 Z" fill="#c8372b" stroke="#5a1410" stroke-width="1.2"/><path d="M5.6 13.8 L12 6.6 L18.4 13.8" fill="none" stroke="#e8685a" stroke-width=".9" opacity=".8"/><rect x="4.4" y="17" width="15.2" height="3.4" rx=".8" fill="#8e1f17" stroke="#5a1410" stroke-width="1.1"/><circle cx="12" cy="18.7" r="1.05" fill="#f0c95a"/><circle cx="7.6" cy="18.7" r=".8" fill="#f0c95a"/><circle cx="16.4" cy="18.7" r=".8" fill="#f0c95a"/><circle cx="2.5" cy="7.5" r="1.3" fill="#f0c95a" stroke="#5a1410" stroke-width=".8"/><circle cx="12" cy="4" r="1.4" fill="#f0c95a" stroke="#5a1410" stroke-width=".8"/><circle cx="21.5" cy="7.5" r="1.3" fill="#f0c95a" stroke="#5a1410" stroke-width=".8"/></svg>';
var GOLD_LOCK = '<svg viewBox="0 0 24 24"><path d="M8 11 V8 a4 4 0 0 1 7.6-1.7" fill="none" stroke="#b9bcc2" stroke-width="2.4" stroke-linecap="round"/><rect x="5" y="11" width="14" height="10" rx="2" fill="#e2b445" stroke="#8a6418" stroke-width="1.2"/><circle cx="12" cy="15.4" r="1.4" fill="#5a3e10"/><path d="M12 16 V18.2" stroke="#5a3e10" stroke-width="1.4"/></svg>';
var BONUS_ICO = '<svg viewBox="0 0 24 24" stroke-linejoin="round"><path d="M5 2.5 V22" stroke="#5a3a16" stroke-width="2" stroke-linecap="round"/><circle cx="5" cy="2.6" r="1.4" fill="#f0c95a" stroke="#5a3a16" stroke-width=".8"/><path d="M6 4 H20 L17 8.6 L20 13.2 H6 Z" fill="#8a5cd0" stroke="#3d2466" stroke-width="1.2"/><path d="M6 4 H20 L18.6 6.2 H6 Z" fill="#a983e6" stroke="none"/><path d="M12.2 5.6 L13.1 7.5 L15.2 7.7 L13.6 9.1 L14.1 11.1 L12.2 10.1 L10.3 11.1 L10.8 9.1 L9.2 7.7 L11.3 7.5 Z" fill="#f0c95a" stroke="#7a5a10" stroke-width=".5"/></svg>';
function syncOfferBtn() {
  const b = $('#offerBtn'); if (!b) return;
  b.innerHTML = `<button class="primary buy" id="offerBuy"${buying ? ' disabled' : ''}><span class="upLk">${UNLOCK_ICO}Unlock${fullPrice ? `<small>${fullPrice}</small>` : ''}</span></button>`;
  $('#offerBuy').addEventListener('click', () => { sfx('click'); buyFull(); });
}
function showOffer() {
  if (fullOwned()) return;
  $('#offerList').innerHTML = [[MAP_ICO, '9 campaign stages'], [RED_CROWN, '2 boss battles'], [BONUS_ICO, '3 bonus stages'], [OFFER_DOTS, '4 new colours'], [GOLD_LOCK, 'One-time purchase']]
    .map(([i, t]) => `<li><i>${i}</i>${t}</li>`).join('');
  syncOfferBtn(); $('#offerMsg').hidden = true;
  const w = $('#offerWrap'); w.hidden = false; w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop'); sfx('alert');
}
function hideOffer() { $('#offerWrap').hidden = true; }
$('#offerX').addEventListener('click', () => { sfx('click'); hideOffer(); });
$('#offerWrap').addEventListener('click', e => { if (e.target.id === 'offerWrap') hideOffer(); });
$('#fullWrap').addEventListener('pointerdown', e => e.stopPropagation());
if ($('#setRestore')) { $('#setRestoreRow').hidden = !STORE; $('#setRestore').addEventListener('click', e => restoreFull(e.currentTarget)); }
if (STORE) {
  // the price in the player's own currency, and what this Apple account owns (works offline)
  STORE.products({ ids: [FULL_ID] }).then(r => { const p = r && r.products && r.products[0]; if (p) { fullPrice = p.price; if (!$('#campaign').hidden) openStage(cSel); } }).catch(() => {});
  STORE.owned().then(r => { if (r && r.ids && r.ids.includes(FULL_ID)) setFull(true); }).catch(() => {});
  try { STORE.addListener('owned', d => { if (d && d.ids && d.ids.includes(FULL_ID)) setFull(!d.revoked); }); } catch (e) {}
}

// TEMPORARY, for testing the purchase on a phone (Jack): five quick taps on the campaign's "N / 12 stages" line mark Stages 1
// to 3 won (1 star each) and turn the deck to Stage 4; with the full game owned, five taps forget it instead (the free version
// again, kept across restarts in mtd-testfree until Unlock or Restore). Set TEST_SKIP to false before the App Store release.
var TEST_SKIP = true;
if (TEST_SKIP) { let n = 0, t0 = 0;
  $('#campStars').addEventListener('click', () => {
    const now = performance.now(); if (now - t0 > 3000) n = 0; if (!n) t0 = now;
    if (++n < 5) return; n = 0;
    if (fullOwned() && !devOn) { try { localStorage.setItem('mtd-testfree', '1'); } catch (e) {} setFull(false); sfx('nope'); return; }
    for (const c of CAMPAIGN.slice(0, FREE_N)) STARS[c.map] = Math.max(STARS[c.map] || 0, 1);
    try { localStorage.setItem('mtd-stars', JSON.stringify(STARS)); } catch (e) {}
    sfx('unlock'); openCampaign(FREE_N);
  });
}
