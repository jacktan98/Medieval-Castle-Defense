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
// the test builds' "forget purchase" switch is gone: drop its leftover flag, so the App Store's record counts again
try { localStorage.removeItem('mtd-testfree'); } catch (e) {}
function setFull(on, user) {
  const was = fullOwned();
  try { if (on) localStorage.setItem('mtd-full', '1'); else localStorage.removeItem('mtd-full'); } catch (e) {}
  // bought on the campaign: the thank-you card, then the stages' reveal; bought anywhere else (a locked colour on the title or
  // in the pause card): the thank-you card at once, and the reveal waits for the campaign (Jack)
  // only a purchase or Restore the player made just now plays the card and the reveal; the App Store's own record found at
  // start (or sent in later) unlocks quietly (Jack saw the card at every relaunch: killing the app from Xcode can lose the
  // last saves, so mtd-full was missing and the start-up check counted the purchase as new)
  if (on && !was && user) { if (!$('#campaign').hidden) revealFull(); else { pendingReveal = true; thanksCard(); } }
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
function revealFull() { revealStart(); thanksCard(revealSweep); }
// every stage from the fourth on gets its cover back for the sweep to lift
function revealStart() { for (let i = FREE_N; i < CAMPAIGN.length; i++) REVEAL.add(i); buildDeck(); selectStage(FREE_N, true); }
function thanksCard(after) {
  const w = $('#fullWrap'), seal = $('#fullSeal'), lines = [...w.querySelectorAll('.ty')], T = [];
  if (!seal.firstChild) seal.innerHTML = sealIco('full');
  lines.forEach(l => { l.dataset.t = l.dataset.t || l.textContent; l.textContent = ''; });
  duck(true, .8);
  w.classList.remove('stamped', 'out', 'sealed'); w.hidden = false; void w.offsetWidth; w.classList.add('stamped');
  let done = false; const finish = () => { if (done) return; done = true; T.forEach(clearTimeout);
    lines.forEach(l => l.textContent = l.dataset.t); w.classList.add('out');
    setTimeout(() => { w.hidden = true; w.classList.remove('out'); if (after) after(); else duck(false, 2); }, 700); w.onclick = null; };
  let t = 1100;
  lines.forEach((l, k) => { const txt = l.dataset.t, gap = k < 2 ? 70 : 42;
    for (let c = 1; c <= txt.length; c++) T.push(setTimeout(() => { l.textContent = txt.slice(0, c); }, t + c * gap));
    t += txt.length * gap + (k === 1 ? 450 : 300); });
  T.push(setTimeout(() => { w.classList.add('sealed'); sfx('unlock'); }, t));
  T.push(setTimeout(finish, t + 2200));
  w.onclick = () => { sfx('click'); finish(); };
}
// while the stages are revealed nothing on screen answers a tap, a swipe, the wheel or a key (Jack: players could turn the
// deck mid-sweep and spoil it): a clear layer over everything, and key and wheel events stopped before the game sees them
var revealLock = false;
function lockReveal(on) {
  revealLock = on; let b = $('#revealBlock');
  if (!b) { b = document.createElement('div'); b.id = 'revealBlock'; b.style.cssText = 'position:fixed;inset:0;z-index:99999;background:transparent;touch-action:none'; document.body.appendChild(b); }
  b.hidden = !on;
}
for (const t of ['keydown', 'wheel']) addEventListener(t, e => { if (revealLock) { e.preventDefault(); e.stopImmediatePropagation(); } }, { capture: true, passive: false });
function revealSweep() {
  const idx = [...REVEAL].sort((a, b) => a - b), STEP = 650, T0 = 500;
  lockReveal(true);
  duck(true, .8);
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
  setTimeout(() => { REVEAL.clear(); duck(false, 2); lockReveal(false); if ($('#campaign').hidden) return; buildDeck(); selectStage(FREE_N, true); }, T0 + idx.length * STEP + 1400);
}
// a gold crown beside the title on the title screen once the full game is owned (Jack; it sat on the showcase castle's flag pole):
// a classic crown in the title's style, five points with round tips over a separate band
var TITLE_CROWN = '<svg viewBox="0 0 28 24"><path d="M3.2 9.2 L8.6 13.6 L14 5.2 L19.4 13.6 L24.8 9.2 L22.6 18.6 H5.4 Z"/><rect x="5" y="19.4" width="18" height="2.6" rx=".4"/><circle cx="3.2" cy="7.6" r="1.6"/><circle cx="14" cy="3.4" r="1.8"/><circle cx="24.8" cy="7.6" r="1.6"/><circle cx="8.6" cy="12" r="1.1"/><circle cx="19.4" cy="12" r="1.1"/></svg>';
function syncTitleCrown() { const c = $('#titleCrown'); if (!c) return; if (!c.firstChild) c.innerHTML = TITLE_CROWN; c.hidden = !fullOwned(); }
// a short line in the small black strip over the details' button (like Hard's "Win 3 stars to unlock")
function buyMsg(t) { const p = $(!$('#offerWrap').hidden ? '#offerMsg' : '#buyMsg'); if (!p) return; p.textContent = t; p.hidden = true; void p.offsetWidth; p.hidden = false; clearTimeout(p._t); p._t = setTimeout(() => p.hidden = true, 2200); }
function buyFull() {
  if (!STORE) { try { window.open(APP_URL, '_blank', 'noopener'); } catch (e) {} return; }
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
// outside the app (the website, the itch.io demo) there is no store to buy from: the offer card links to the game's App Store
// page with Apple's own badge instead (Jack)
var APP_URL = 'https://apps.apple.com/app/id6832629905';
var STORE_BADGE = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119.66407 40"><g><g><g><path d="M110.13477,0H9.53468c-.3667,0-.729,0-1.09473.002-.30615.002-.60986.00781-.91895.0127A13.21476,13.21476,0,0,0,5.5171.19141a6.66509,6.66509,0,0,0-1.90088.627A6.43779,6.43779,0,0,0,1.99757,1.99707,6.25844,6.25844,0,0,0,.81935,3.61816a6.60119,6.60119,0,0,0-.625,1.90332,12.993,12.993,0,0,0-.1792,2.002C.00587,7.83008.00489,8.1377,0,8.44434V31.5586c.00489.3105.00587.6113.01515.9219a12.99232,12.99232,0,0,0,.1792,2.0019,6.58756,6.58756,0,0,0,.625,1.9043A6.20778,6.20778,0,0,0,1.99757,38.001a6.27445,6.27445,0,0,0,1.61865,1.1787,6.70082,6.70082,0,0,0,1.90088.6308,13.45514,13.45514,0,0,0,2.0039.1768c.30909.0068.6128.0107.91895.0107C8.80567,40,9.168,40,9.53468,40H110.13477c.3594,0,.7246,0,1.084-.002.3047,0,.6172-.0039.9219-.0107a13.279,13.279,0,0,0,2-.1768,6.80432,6.80432,0,0,0,1.9082-.6308,6.27742,6.27742,0,0,0,1.6172-1.1787,6.39482,6.39482,0,0,0,1.1816-1.6143,6.60413,6.60413,0,0,0,.6191-1.9043,13.50643,13.50643,0,0,0,.1856-2.0019c.0039-.3106.0039-.6114.0039-.9219.0078-.3633.0078-.7246.0078-1.0938V9.53613c0-.36621,0-.72949-.0078-1.09179,0-.30664,0-.61426-.0039-.9209a13.5071,13.5071,0,0,0-.1856-2.002,6.6177,6.6177,0,0,0-.6191-1.90332,6.46619,6.46619,0,0,0-2.7988-2.7998,6.76754,6.76754,0,0,0-1.9082-.627,13.04394,13.04394,0,0,0-2-.17676c-.3047-.00488-.6172-.01074-.9219-.01269-.3594-.002-.7246-.002-1.084-.002Z" style="fill: #a6a6a6"/><path d="M8.44483,39.125c-.30468,0-.602-.0039-.90429-.0107a12.68714,12.68714,0,0,1-1.86914-.1631,5.88381,5.88381,0,0,1-1.65674-.5479,5.40573,5.40573,0,0,1-1.397-1.0166,5.32082,5.32082,0,0,1-1.02051-1.3965,5.72186,5.72186,0,0,1-.543-1.6572,12.41351,12.41351,0,0,1-.1665-1.875c-.00634-.2109-.01464-.9131-.01464-.9131V8.44434S.88185,7.75293.8877,7.5498a12.37039,12.37039,0,0,1,.16553-1.87207,5.7555,5.7555,0,0,1,.54346-1.6621A5.37349,5.37349,0,0,1,2.61183,2.61768,5.56543,5.56543,0,0,1,4.01417,1.59521a5.82309,5.82309,0,0,1,1.65332-.54394A12.58589,12.58589,0,0,1,7.543.88721L8.44532.875H111.21387l.9131.0127a12.38493,12.38493,0,0,1,1.8584.16259,5.93833,5.93833,0,0,1,1.6709.54785,5.59374,5.59374,0,0,1,2.415,2.41993,5.76267,5.76267,0,0,1,.5352,1.64892,12.995,12.995,0,0,1,.1738,1.88721c.0029.2832.0029.5874.0029.89014.0079.375.0079.73193.0079,1.09179V30.4648c0,.3633,0,.7178-.0079,1.0752,0,.3252,0,.6231-.0039.9297a12.73126,12.73126,0,0,1-.1709,1.8535,5.739,5.739,0,0,1-.54,1.67,5.48029,5.48029,0,0,1-1.0156,1.3857,5.4129,5.4129,0,0,1-1.3994,1.0225,5.86168,5.86168,0,0,1-1.668.5498,12.54218,12.54218,0,0,1-1.8692.1631c-.2929.0068-.5996.0107-.8974.0107l-1.084.002Z"/></g><g><g><g><path d="M24.76888,20.30068a4.94881,4.94881,0,0,1,2.35656-4.15206,5.06566,5.06566,0,0,0-3.99116-2.15768c-1.67924-.17626-3.30719,1.00483-4.1629,1.00483-.87227,0-2.18977-.98733-3.6085-.95814a5.31529,5.31529,0,0,0-4.47292,2.72787c-1.934,3.34842-.49141,8.26947,1.3612,10.97608.9269,1.32535,2.01018,2.8058,3.42763,2.7533,1.38706-.05753,1.9051-.88448,3.5794-.88448,1.65876,0,2.14479.88448,3.591.8511,1.48838-.02416,2.42613-1.33124,3.32051-2.66914a10.962,10.962,0,0,0,1.51842-3.09251A4.78205,4.78205,0,0,1,24.76888,20.30068Z" style="fill: #fff"/><path d="M22.03725,12.21089a4.87248,4.87248,0,0,0,1.11452-3.49062,4.95746,4.95746,0,0,0-3.20758,1.65961,4.63634,4.63634,0,0,0-1.14371,3.36139A4.09905,4.09905,0,0,0,22.03725,12.21089Z" style="fill: #fff"/></g></g><g><path d="M42.30227,27.13965h-4.7334l-1.13672,3.35645H34.42727l4.4834-12.418h2.083l4.4834,12.418H43.438ZM38.0591,25.59082h3.752l-1.84961-5.44727h-.05176Z" style="fill: #fff"/><path d="M55.15969,25.96973c0,2.81348-1.50586,4.62109-3.77832,4.62109a3.0693,3.0693,0,0,1-2.84863-1.584h-.043v4.48438h-1.8584V21.44238H48.4302v1.50586h.03418a3.21162,3.21162,0,0,1,2.88281-1.60059C53.645,21.34766,55.15969,23.16406,55.15969,25.96973Zm-1.91016,0c0-1.833-.94727-3.03809-2.39258-3.03809-1.41992,0-2.375,1.23047-2.375,3.03809,0,1.82422.95508,3.0459,2.375,3.0459C52.30227,29.01563,53.24953,27.81934,53.24953,25.96973Z" style="fill: #fff"/><path d="M65.12453,25.96973c0,2.81348-1.50586,4.62109-3.77832,4.62109a3.0693,3.0693,0,0,1-2.84863-1.584h-.043v4.48438h-1.8584V21.44238H58.395v1.50586h.03418A3.21162,3.21162,0,0,1,61.312,21.34766C63.60988,21.34766,65.12453,23.16406,65.12453,25.96973Zm-1.91016,0c0-1.833-.94727-3.03809-2.39258-3.03809-1.41992,0-2.375,1.23047-2.375,3.03809,0,1.82422.95508,3.0459,2.375,3.0459C62.26711,29.01563,63.21438,27.81934,63.21438,25.96973Z" style="fill: #fff"/><path d="M71.71047,27.03613c.1377,1.23145,1.334,2.04,2.96875,2.04,1.56641,0,2.69336-.80859,2.69336-1.91895,0-.96387-.67969-1.541-2.28906-1.93652l-1.60937-.3877c-2.28027-.55078-3.33887-1.61719-3.33887-3.34766,0-2.14258,1.86719-3.61426,4.51855-3.61426,2.624,0,4.42285,1.47168,4.4834,3.61426h-1.876c-.1123-1.23926-1.13672-1.9873-2.63379-1.9873s-2.52148.75684-2.52148,1.8584c0,.87793.6543,1.39453,2.25488,1.79l1.36816.33594c2.54785.60254,3.60645,1.626,3.60645,3.44238,0,2.32324-1.85059,3.77832-4.79395,3.77832-2.75391,0-4.61328-1.4209-4.7334-3.667Z" style="fill: #fff"/><path d="M83.34621,19.2998v2.14258h1.72168v1.47168H83.34621v4.99121c0,.77539.34473,1.13672,1.10156,1.13672a5.80752,5.80752,0,0,0,.61133-.043v1.46289a5.10351,5.10351,0,0,1-1.03223.08594c-1.833,0-2.54785-.68848-2.54785-2.44434V22.91406H80.16262V21.44238H81.479V19.2998Z" style="fill: #fff"/><path d="M86.065,25.96973c0-2.84863,1.67773-4.63867,4.29395-4.63867,2.625,0,4.29492,1.79,4.29492,4.63867,0,2.85645-1.66113,4.63867-4.29492,4.63867C87.72609,30.6084,86.065,28.82617,86.065,25.96973Zm6.69531,0c0-1.9541-.89551-3.10742-2.40137-3.10742s-2.40039,1.16211-2.40039,3.10742c0,1.96191.89453,3.10645,2.40039,3.10645S92.76027,27.93164,92.76027,25.96973Z" style="fill: #fff"/><path d="M96.18606,21.44238h1.77246v1.541h.043a2.1594,2.1594,0,0,1,2.17773-1.63574,2.86616,2.86616,0,0,1,.63672.06934v1.73828a2.59794,2.59794,0,0,0-.835-.1123,1.87264,1.87264,0,0,0-1.93652,2.083v5.37012h-1.8584Z" style="fill: #fff"/><path d="M109.3843,27.83691c-.25,1.64355-1.85059,2.77148-3.89844,2.77148-2.63379,0-4.26855-1.76465-4.26855-4.5957,0-2.83984,1.64355-4.68164,4.19043-4.68164,2.50488,0,4.08008,1.7207,4.08008,4.46582v.63672h-6.39453v.1123a2.358,2.358,0,0,0,2.43555,2.56445,2.04834,2.04834,0,0,0,2.09082-1.27344Zm-6.28223-2.70215h4.52637a2.1773,2.1773,0,0,0-2.2207-2.29785A2.292,2.292,0,0,0,103.10207,25.13477Z" style="fill: #fff"/></g></g></g><g><g><path d="M37.82619,8.731a2.63964,2.63964,0,0,1,2.80762,2.96484c0,1.90625-1.03027,3.002-2.80762,3.002H35.67092V8.731Zm-1.22852,5.123h1.125a1.87588,1.87588,0,0,0,1.96777-2.146,1.881,1.881,0,0,0-1.96777-2.13379h-1.125Z" style="fill: #fff"/><path d="M41.68068,12.44434a2.13323,2.13323,0,1,1,4.24707,0,2.13358,2.13358,0,1,1-4.24707,0Zm3.333,0c0-.97607-.43848-1.54687-1.208-1.54687-.77246,0-1.207.5708-1.207,1.54688,0,.98389.43457,1.55029,1.207,1.55029C44.57522,13.99463,45.01369,13.42432,45.01369,12.44434Z" style="fill: #fff"/><path d="M51.57326,14.69775h-.92187l-.93066-3.31641h-.07031l-.92676,3.31641h-.91309l-1.24121-4.50293h.90137l.80664,3.436h.06641l.92578-3.436h.85254l.92578,3.436h.07031l.80273-3.436h.88867Z" style="fill: #fff"/><path d="M53.85354,10.19482H54.709v.71533h.06641a1.348,1.348,0,0,1,1.34375-.80225,1.46456,1.46456,0,0,1,1.55859,1.6748v2.915h-.88867V12.00586c0-.72363-.31445-1.0835-.97168-1.0835a1.03294,1.03294,0,0,0-1.0752,1.14111v2.63428h-.88867Z" style="fill: #fff"/><path d="M59.09377,8.437h.88867v6.26074h-.88867Z" style="fill: #fff"/><path d="M61.21779,12.44434a2.13346,2.13346,0,1,1,4.24756,0,2.1338,2.1338,0,1,1-4.24756,0Zm3.333,0c0-.97607-.43848-1.54687-1.208-1.54687-.77246,0-1.207.5708-1.207,1.54688,0,.98389.43457,1.55029,1.207,1.55029C64.11232,13.99463,64.5508,13.42432,64.5508,12.44434Z" style="fill: #fff"/><path d="M66.4009,13.42432c0-.81055.60352-1.27783,1.6748-1.34424l1.21973-.07031v-.38867c0-.47559-.31445-.74414-.92187-.74414-.49609,0-.83984.18213-.93848.50049h-.86035c.09082-.77344.81836-1.26953,1.83984-1.26953,1.12891,0,1.76563.562,1.76563,1.51318v3.07666h-.85547v-.63281h-.07031a1.515,1.515,0,0,1-1.35254.707A1.36026,1.36026,0,0,1,66.4009,13.42432Zm2.89453-.38477v-.37646l-1.09961.07031c-.62012.0415-.90137.25244-.90137.64941,0,.40527.35156.64111.835.64111A1.0615,1.0615,0,0,0,69.29543,13.03955Z" style="fill: #fff"/><path d="M71.34816,12.44434c0-1.42285.73145-2.32422,1.86914-2.32422a1.484,1.484,0,0,1,1.38086.79h.06641V8.437h.88867v6.26074h-.85156v-.71143h-.07031a1.56284,1.56284,0,0,1-1.41406.78564C72.0718,14.772,71.34816,13.87061,71.34816,12.44434Zm.918,0c0,.95508.4502,1.52979,1.20313,1.52979.749,0,1.21191-.583,1.21191-1.52588,0-.93848-.46777-1.52979-1.21191-1.52979C72.72121,10.91846,72.26613,11.49707,72.26613,12.44434Z" style="fill: #fff"/><path d="M79.23,12.44434a2.13323,2.13323,0,1,1,4.24707,0,2.13358,2.13358,0,1,1-4.24707,0Zm3.333,0c0-.97607-.43848-1.54687-1.208-1.54687-.77246,0-1.207.5708-1.207,1.54688,0,.98389.43457,1.55029,1.207,1.55029C82.12453,13.99463,82.563,13.42432,82.563,12.44434Z" style="fill: #fff"/><path d="M84.66945,10.19482h.85547v.71533h.06641a1.348,1.348,0,0,1,1.34375-.80225,1.46456,1.46456,0,0,1,1.55859,1.6748v2.915H87.605V12.00586c0-.72363-.31445-1.0835-.97168-1.0835a1.03294,1.03294,0,0,0-1.0752,1.14111v2.63428h-.88867Z" style="fill: #fff"/><path d="M93.51516,9.07373v1.1416h.97559v.74854h-.97559V13.2793c0,.47168.19434.67822.63672.67822a2.96657,2.96657,0,0,0,.33887-.02051v.74023a2.9155,2.9155,0,0,1-.4834.04541c-.98828,0-1.38184-.34766-1.38184-1.21582v-2.543h-.71484v-.74854h.71484V9.07373Z" style="fill: #fff"/><path d="M95.70461,8.437h.88086v2.48145h.07031a1.3856,1.3856,0,0,1,1.373-.80664,1.48339,1.48339,0,0,1,1.55078,1.67871v2.90723H98.69v-2.688c0-.71924-.335-1.0835-.96289-1.0835a1.05194,1.05194,0,0,0-1.13379,1.1416v2.62988h-.88867Z" style="fill: #fff"/><path d="M104.76125,13.48193a1.828,1.828,0,0,1-1.95117,1.30273A2.04531,2.04531,0,0,1,100.73,12.46045a2.07685,2.07685,0,0,1,2.07617-2.35254c1.25293,0,2.00879.856,2.00879,2.27V12.688h-3.17969v.0498a1.1902,1.1902,0,0,0,1.19922,1.29,1.07934,1.07934,0,0,0,1.07129-.5459Zm-3.126-1.45117h2.27441a1.08647,1.08647,0,0,0-1.1084-1.1665A1.15162,1.15162,0,0,0,101.63527,12.03076Z" style="fill: #fff"/></g></g></g></svg>';
function syncOfferBtn() {
  const b = $('#offerBtn'); if (!b) return;
  if (!STORE) { b.innerHTML = `<a class="storeBadge" href="${APP_URL}" target="_blank" rel="noopener" aria-label="Download on the App Store">${STORE_BADGE}</a>`; return; }
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

syncTitleCrown();
