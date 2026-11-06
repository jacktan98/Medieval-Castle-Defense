# tools/render

Headless checks against the real game (Playwright + Chromium; `npm i -D playwright && npx playwright install chromium` on a new machine).
Both scripts serve the repo themselves, so no server is needed.

- `node tools/render/gallery.js [--back]` renders the design gallery (`index.html?gallery`, also Admin → Gallery in the game)
  into `design/gallery/sheet.png`: every building at every tier, walls and gates, decor, villagers and raiders.
  `--back` adds `sheet-back.png` with every building turned 180°. Run it after any art change and commit the sheets.
- `node tools/render/motion.js [--secs 60]` runs a busy town and reports how often villagers shake (`rapid`) and whether
  every site gets built. Compare against the previous build.

three.js r128 is in the repo (`vendor/three.min.js`), so nothing is fetched from a CDN; `--three path/to/three.min.js`
still serves another copy in its place. The game's own tests are in `tools/test/run.js` (see CLAUDE.md, Tests).
