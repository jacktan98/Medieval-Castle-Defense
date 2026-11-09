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
  if (!$('#campaign').hidden) openStage(cSel);
  if (on && !was && !$('#campaign').hidden) { sfx('unlock'); buyMsg('Full game unlocked'); }
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
if ($('#setRestore')) { $('#setRestoreRow').hidden = !STORE; $('#setRestore').addEventListener('click', e => restoreFull(e.currentTarget)); }
if (STORE) {
  // the price in the player's own currency, and what this Apple account owns (works offline)
  STORE.products({ ids: [FULL_ID] }).then(r => { const p = r && r.products && r.products[0]; if (p) { fullPrice = p.price; if (!$('#campaign').hidden) openStage(cSel); } }).catch(() => {});
  STORE.owned().then(r => { if (r && r.ids && r.ids.includes(FULL_ID)) setFull(true); }).catch(() => {});
  try { STORE.addListener('owned', d => { if (d && d.ids && d.ids.includes(FULL_ID)) setFull(!d.revoked); }); } catch (e) {}
}
