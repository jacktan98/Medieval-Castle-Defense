# Castle Defense on iPhone and iPad

The app is the same game as the website, wrapped by [Capacitor](https://capacitorjs.com) into a real iPhone/iPad app
(`ios/`). Bundle ID `com.jacktan.castledefense` (permanent), name on the home screen "Castle Defense".

## One-time setup on the Mac

1. Install **Xcode** (Mac App Store) and open it once so it finishes installing. In **Xcode → Settings → Accounts**, press
   **+** and sign in with the Apple ID of your developer account.
2. Install **Node.js** (the LTS version) from nodejs.org.
3. Open **Terminal** and get the game:
   ```
   cd ~/Developer
   git clone https://github.com/jacktan98/castledefense-medieval.git Medieval-Castle-Defense
   cd Medieval-Castle-Defense
   npm install
   ```
4. Build the app's files and open it in Xcode:
   ```
   npm run app
   npx cap open ios
   ```
   The first time, Xcode spends a minute fetching Capacitor's packages (bottom-left shows the progress).
5. In Xcode's left panel click **App** (the blue icon at the top), then the **App** target, then **Signing & Capabilities**:
   tick **Automatically manage signing** and pick your name under **Team**.
6. To play it on your iPhone: plug it in with a cable (or pick it wirelessly once paired), choose it at the top of Xcode,
   and press **▶**. The first time, the iPhone asks you to turn on **Developer Mode** (Settings → Privacy & Security →
   Developer Mode) and restart.

## Every time the game changes

```
cd ~/Developer/Medieval-Castle-Defense
git pull
npm run app
```
Then press **▶** in Xcode again. (`npm run app` builds the game, copies it into the app and updates the iOS project.)
If a change adds a package (`package.json` changed, as when the purchase plugin came in), run `npm install` once before
`npm run app`.

## Testing the purchase (the full game)

Stages 1 to 3 are free; Stage 4 on shows **Unlock** with the price in place of Play until the full game is bought
(product `com.jacktan.castledefense.fullgame`, a Non-Consumable in App Store Connect). **Restore purchases** is in Settings.

1. Run the app from Xcode **on your iPhone** (the Simulator may not reach the App Store's test server).
2. On the phone: **Settings → Developer → Sandbox Apple Account** → sign in with the sandbox tester from App Store
   Connect (Users and Access → Sandbox).
3. In the game, win Stage 3, or tap the campaign's "N / 12 stages" line five times quickly (a temporary test shortcut that marks Stages 1 to 3 won; once bought, the same five taps forget the purchase so you see the free version again), then on Stage 4 tap **Unlock**. Apple's
   sheet shows **[Sandbox]**; nothing is charged. Stage 4 on then plays.
4. To test again from scratch: App Store Connect → Users and Access → Sandbox → tick the tester → **Clear Purchase
   History**, then delete and reinstall the app. **Restore purchases** in Settings should bring it back.
5. Take a screenshot of the Unlock button for the purchase's **Review Information** in App Store Connect, and send the
   purchase for review together with the first app version (the purchase can't be reviewed on its own).

### In the Simulator (a local test purchase, to see the unlock animation)

The Simulator can buy from a **StoreKit test file** that lives only on the Mac: no Apple account, no App Store, nothing charged.

1. In Xcode: **File → New → File from Template…**, search **StoreKit Configuration File**, Next. Name it `Products`,
   tick **Sync this file with an app in App Store Connect**, pick Castle Defense, and save it in `ios/App`.
   (If the sync box isn't offered: make it unsynced, then the **+** at the bottom left → **Add Non-Consumable In-App
   Purchase**, Reference Name `Full Game`, Product ID `com.jacktan.castledefense.fullgame`, Price 4.99.)
2. **Product → Scheme → Edit Scheme… → Run → Options → StoreKit Configuration** → pick `Products.storekit` → Close.
3. Run the app in the Simulator, tap the "N / 12 stages" line five times to reach Stage 4, tap **Unlock**, then
   **Purchase** on the test sheet: the thank-you card and the stages' reveal play.
4. To see it again: tap the "N / 12 stages" line five times (forgets it in the game), or delete the purchase in Xcode
   (**Debug → StoreKit → Manage Transactions**, select it, the delete button) and run again.

Only runs started from Xcode use the test file; TestFlight and App Store builds always use the real App Store. Before
testing the real purchase on your iPhone, set step 2 back to **None**, or the phone buys from the test file too.

## Sending a build to TestFlight / the App Store

1. In Xcode, pick **Any iOS Device (arm64)** at the top.
2. Raise the **Build** number by one (App target → **General** → Identity). Every upload needs a new build number;
   **Version** (1.0) only changes for a new release.
3. **Product → Archive**. When it finishes, the Organizer window opens: **Distribute App → App Store Connect → Upload**.
4. A few minutes later the build shows in App Store Connect under **TestFlight**, ready to install on your phone with
   the TestFlight app, or to submit for review.

## What is different in the app

- Saved progress (stars, upgrades, crowns, the saved game) is also kept in the app's own storage, which iOS never clears.
- The fonts are inside the app, so it works with no connection from the very first launch.
- No website update check: updates come from the App Store.
- Stage 4 on is bought in the app (the website shows the same Unlock, which says the full game is in the app).
- The status bar (clock, battery) is hidden.
