# Castle Defense on iPhone and iPad

The app is the same game as the website, wrapped by [Capacitor](https://capacitorjs.com) into a real iPhone/iPad app
(`ios/`). Bundle ID `com.jacktan.castledefense` (permanent), name on the home screen "Castle Defense".

## One-time setup on the Mac

1. Install **Xcode** (Mac App Store) and open it once so it finishes installing. In **Xcode → Settings → Accounts**, press
   **+** and sign in with the Apple ID of your developer account.
2. Install **Node.js** (the LTS version) from nodejs.org.
3. Open **Terminal** and get the game:
   ```
   cd ~/Documents
   git clone https://github.com/jacktan98/Medieval-Castle-Defense.git
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
cd ~/Documents/Medieval-Castle-Defense
git pull
npm run app
```
Then press **▶** in Xcode again. (`npm run app` builds the game, copies it into the app and updates the iOS project.)

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
- The status bar (clock, battery) is hidden.
