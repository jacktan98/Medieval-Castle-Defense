# The game's website

Home (`index.html`), `privacy.html` and `support.html`, in the game's bronze and gold, with the fonts, pictures and trailer kept here (about 6 MB, no other site needed).
It lives in its own **public** repo, `jacktan98/castledefense-site`, served at https://castledefense.app (the `CNAME` file), so the game's repo can be private: GitHub Pages on the free plan only serves public repos. (It was first in `jacktan98.github.io`, but a custom domain on the account's main site moves every other repo's Pages under that domain too.)

Set up once:
1. On GitHub: New repository, name it exactly `jacktan98.github.io`, Public, no README.
2. Copy everything in this folder into it and push (or ask Claude to push it once the repo exists).
3. Settings, Pages: Deploy from a branch, `main`, `/ (root)`. A minute later the site is at https://jacktan98.github.io/

Then in App Store Connect: Privacy Policy URL https://jacktan98.github.io/privacy.html, Support URL https://jacktan98.github.io/support.html, Marketing URL https://jacktan98.github.io/

Support email in `privacy.html` and `support.html`: noobstickz.98@gmail.com. Once the game is live, swap the "Coming soon to the App Store" button in `index.html` (see the `APP_STORE` comment) for the App Store link and Apple's official badge.
Pictures: `img/hero.jpg` is the title showcase rendered without the title; the four game shots are the store set's raw frames (no captions; `tools/render/store/`), shrunk to 1600 px; `video/trailer.mp4` is `design/store/trailer-iphone.mp4` at 1280 px.
