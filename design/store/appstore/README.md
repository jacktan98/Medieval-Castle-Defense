# App Store Connect: what goes where

Everything in this folder and in `design/store/` is ready to upload. Text to paste is in `description.txt` and below.

## 1. iOS App Version 1.0 → Header and Search Results
- **Header** (optional; Apple's new custom header): upload `header-3840x1646.png`, or `header-5244x2950.png` if it asks for that size. No words on it, so the app name and icon Apple lays over it never clash.
- **Search Results**: leave it as it is. Apple uses your screenshots there.

## 2. iOS App Version 1.0 → App Previews and Screenshots
| Tab | Previews (up to 3) | Screenshots (up to 10), in order 1 → 5 |
|---|---|---|
| iPhone with Dynamic Island (medium display) | `../trailer-iphone.mp4` (1920 × 886, 30 s) | `../iphone-6.3/1title.jpg` … `5upgrades.jpg` (2622 × 1206) |
| "View All Sizes in Media Manager" → iPhone 6.9" (large display), if listed | `../trailer-iphone.mp4` | `../iphone/1title.jpg` … `5upgrades.jpg` (2868 × 1320) |
| iPad 13" display | none (it needs a 4:3 video; I can make one if you want it) | `../ipad/1title.jpg` … `5upgrades.jpg` (2752 × 2064) |
| iPhone Duo | skip: Apple scales the iPhone ones down | |
| Apple Watch | skip: there is no Watch app | |

After uploading the trailer, pick its **poster frame** (the still shown before it plays). A frame from the town part, about 5 s in, works well.

## 3. iOS App Version 1.0 → text fields
- **Promotional Text** (170 at most; can be changed any time without a review):
  `Build your town by day, hold the walls by night. Play the first 3 stages free, then unlock the full campaign, 2 boss battles and 3 bonus stages.`
- **Description**: paste all of `description.txt`.
- **Keywords** (100 at most, commas, no spaces; leave out the words already in the name and subtitle, as Apple indexes those itself):
  `tower,td,kingdom,village,town,builder,strategy,siege,knight,archer,raid,fort,catapult,offline,rts`
- **Support URL**: `https://castledefense.app/support`
- **Marketing URL**: `https://castledefense.app`
- **Version**: `1.0`
- **Copyright**: `2026 Jack Tan`
- **Routing App Coverage File**, **App Clip**, **iMessage App**: leave empty (they are for maps and add-on apps).
- **Game Center**: leave unticked (the game doesn't use it).

## 4. iOS App Version 1.0 → Build
Upload from Xcode (steps in `APP.md`: Product → Archive → Distribute App → App Store Connect). The build shows up here after 10–30 minutes; select it. Encryption is already answered in the app (`ITSAppUsesNonExemptEncryption` false), so it won't ask.

## 5. iOS App Version 1.0 → App Review Information
- **Sign-in required**: **untick it** (the game has no accounts).
- **Contact Information**: your name, phone (with country code) and email. Apple only uses these to reach you about the review.
- **Notes** (paste):
  ```
  Castle Defense: Medieval is a village-builder and tower-defence game. There is no login and no network use; it plays fully offline.

  In-app purchase: one non-consumable, "Full Game" (com.jacktan.castledefense.fullgame). Stages 1 to 3 are free; the purchase unlocks Stages 4 to 12, the 3 bonus stages and 4 extra team colours.

  To reach the purchase without playing: on the title screen tap Campaign, swipe to Stage 4 and tap its card. Or tap the gear (top right of the title screen) and tap one of the padlocked colours. Restore purchases is in the same Settings card.
  ```
- **Attachment**: none needed.

## 6. In-App Purchases → Full Game
- **Image** (optional, 1024 × 1024; only shown for offer codes or if you turn on App Store promotion): `iap-image.png`.
- **Review Information → Screenshot** (required): `iap-review.png` (the purchase card in the game).
- **Review Notes**:
  ```
  Unlocks Stages 4 to 12, the 3 bonus stages and 4 extra team colours. To see it: title screen → Campaign → swipe to Stage 4 → tap the card (or tap Unlock). Restore purchases: title screen → gear → Restore purchases.
  ```
- **App Store Localization** (further down the same page, or under Localizations): Display Name `Full Game`; Description (55 at most) `9 stages, 2 boss battles, 3 bonus stages, 4 colours`.
- Check **Price** (Pricing, on the same page) and **Availability** are set.
- Then **Add for Review**. The first purchase can only be sent with an app version: on the version page, find the **In-App Purchases and Subscriptions** section, choose **Full Game**, and submit both together.

## 7. Other pages (left-hand menu)
- **App Information**:
  - Category: **Games**, subcategories **Strategy** (primary) and **Simulation** (secondary).
  - Content Rights: **Yes, it contains third-party content, and I have the rights** (the icons are CC BY with a credit in Settings → Credits; three.js and the fonts are open licences; the music and sounds are licensed from ElevenLabs and Pixabay).
  - Age Rating → Edit: **Cartoon or Fantasy Violence: Infrequent/Mild**. Everything else **None** / **No** (no gambling, no web access, no user content, no chat). Expect 9+.
- **Pricing and Availability**: Price **Free (USD 0)**; all countries or regions.
- **App Privacy**:
  - Privacy Policy URL `https://castledefense.app/privacy`.
  - Data collection: **No, we do not collect data from this app**.
- **Trader status (EU, Digital Services Act)**: if asked, you're a trader as soon as you sell anything (the purchase); it shows your contact details in the EU stores.

## When everything is filled
Version page → **Add for Review** → **Submit for Review**. A review usually takes 1–2 days.
