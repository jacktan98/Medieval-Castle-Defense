// Renders the website's cut-out figures and buildings from the game's own models, on see-through backgrounds,
// into design/site/ (node tools/render/site.js). Then each PNG is cropped to what it shows and saved as WebP into site/img/fig/ (figures 520 px tall,
// buildings 640 px wide), and the icons in icons.json are written as SVG files into site/img/ico/, with a few lines of PIL.
// Each figure is posed by the gallery's own poses (galPose) at a set moment, so it is caught mid-action.
const fs = require('fs'), path = require('path');
const { openGame } = require('./serve');
const OUT = path.resolve(__dirname, '../../design/site');
// name, what to build (code run in the game's scope that returns { g, p }), the pose's moment, the turn, frame size [w, h] in metres
const FIGS = [
  ['lumberjack', `fig({ tool: 'axe', carry: 'log' })`, 0.3, 0.55],
  ['chopper', `fig({ tool: 'axe', work: 1 })`, 0.75, 1.05],
  ['mason', `fig({ tool: 'pick', work: 1 })`, 0.85, .6],
  ['builder', `fig({ tool: 'hammer', work: 1 })`, 1.6, 0.5],
  ['farmer', `fig({ tool: 'hoe', work: 1 })`, 0.6, .6],
  ['archer', `fig({ guard: 3 })`, 0.5, 0.7],
  ['crossbow', `fig({ guard: 3, xbow: 1 })`, 0.5, .7],
  ['knight', `fig({ kit: 3 })`, 0.3, .6],
  ['guard', `fig({ kit: 2 })`, 0.2, 0.6],
  ['rider', `fig({ kit: 3, cav: 1 })`, 0.4, 0.9],
  ['raider_sword', `fig({ raider: 'sword', rt: 3 })`, 0.25, -.6],
  ['raider_spear', `fig({ raider: 'spear', rt: 2 })`, 0.3, -0.6],
  ['raider_archer', `fig({ raider: 'archer', rt: 2 })`, 0.5, -.7],
  ['raider_horse', `fig({ raider: 'rider', rt: 3 })`, 0.4, -0.9],
  ['chief', `fig({ raider: 'chief', rt: 3 })`, 0.3, -.5],
  ['raider_ballista', `fig({ raider: 'ballista', rt: 2 })`, 1.2, -0.75],
  ['warlord', `fig({ raider: 'warlord', rt: 3 })`, 0.4, -0.8],
];
const BLDS = [['castle1', 'castle', 1], ['castle3', 'castle', 3], ['house2', 'house', 2], ['tower3', 'tower', 3], ['catapult3', 'catapult', 3], ['ballista2', 'ballista', 2], ['market3', 'market', 3]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { page, errors, close } = await openGame('index.html?debug', { settle: 5000 });
  await page.evaluate(() => G(`
    window.SITE = (() => {
      const W = 900, H = 1200, R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      R.setPixelRatio(1); R.outputEncoding = THREE.sRGBEncoding; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.15;
      R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.setClearColor(0, 0);
      R.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), .005)];
      const S = new THREE.Scene(); S.add(new THREE.HemisphereLight('#e2ecff', '#5a4a30', .8));
      const sun = new THREE.DirectionalLight('#ffe7c4', 1.15); sun.position.set(-5, 12, 9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 40 }); sun.shadow.bias = -.0008; S.add(sun, sun.target);
      const rim = new THREE.DirectionalLight('#ffd9a0', .45); rim.position.set(6, 5, -8); S.add(rim);
      const cam = new THREE.PerspectiveCamera(22, W / H, .1, 300);
      const fig = P => {
        const p = P.raider ? makeRaider(P.raider, P.rt) : P.guard ? makePerson({ tool: P.xbow ? 'crossbow' : 'bow' }) : makePerson({});
        if (P.kit) soldierKit(p, P.kit, P.cav);
        else if (P.guard) armour(p, P.guard);
        else if (!P.raider) { p.plainHat = !P.tool; p.outfitTier = 3; addLoads(p); giveTool(p, P.tool || null); dress(p, P.tool || null); if (P.carry === 'log') p.carryLog.visible = true; }
        if (P.raider && ENEMY[P.raider].engine) Object.assign(p, { kind: P.raider, tier: P.rt, rate: ENEMY[P.raider].rate, seed: 0 });
        else Object.assign(p, P, { seed: 0 }); return p;
      };
      // a figure: posed at time t, turned by rot, framed tight to its own box, ground shadow on an invisible floor
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .32 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; S.add(floor);
      function shoot(g, w, h, look, d, pitch) {
        R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
        cam.position.set(look.x, look.y + Math.sin(pitch) * d, look.z + Math.cos(pitch) * d); cam.lookAt(look);
        R.render(S, cam); return R.domElement.toDataURL('image/png');
      }
      return {
        person(code, t, rot) {
          const p = eval(code); p.g.rotation.y = rot; S.add(p.g);
          if (!p.raider || !ENEMY[p.raider].boss) p.g.scale.setScalar(1);
          let tt = 0; for (let i = 0; i < Math.round(t / .02); i++) { tt += .02; galPose(p, tt, .02); }
          p.g.updateMatrixWorld(true);
          const b = new THREE.Box3().setFromObject(p.g), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
          const hgt = Math.max(s.y, s.x * 1.1) * 1.18, d = hgt / 2 / Math.tan(cam.fov * Math.PI / 360);
          const url = shoot(p.g, 900, 1200, new THREE.Vector3(c.x, c.y, c.z), d * 1.05, .18);
          // its height in the game, for drawing figures side by side to scale: people at UNIT_K, bosses at their own size, engines at 1
          const E = ENEMY[p.raider || p.kind], k = E && E.engine ? 1 : E && E.boss ? E.boss : UNIT_K;
          S.remove(p.g); return { url, h: +(s.y * k).toFixed(3) };
        },
        building(type, tier) {
          const g = makeModel(type, tier, true, 0, 0); galPreview(g, type, tier); S.add(g); g.rotation.y = -.55; g.updateMatrixWorld(true);
          const lawn = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.03, .3, 48), mat('#2a4f1d')); 
          const b = new THREE.Box3().setFromObject(g); b.min.y = Math.max(b.min.y, 0); const s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
          const r = Math.hypot(s.x, s.z) * .5 + .15; lawn.scale.set(r, 1, r); lawn.position.y = -.15; lawn.receiveShadow = true;           R.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), .005)];
          const fit = Math.max(r * 2.1, s.y * 1.6), d = fit / 2 / Math.tan(cam.fov * Math.PI / 360) / (1.2) * 1.15;
          const url = shoot(g, 1200, 1000, new THREE.Vector3(0, s.y * .38, 0), d, .62);
          S.remove(g); R.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), .005)]; return url;
        },
        icons() { return { MAP_ICO, RED_CROWN, BONUS_ICO, OFFER_DOTS, GOLD_LOCK, CROWN_ICO, UP: document.querySelector('#campUpBtn svg').outerHTML,
          ACH: document.querySelector('#campAchBtn svg').outerHTML, CX: document.querySelector('#campCxBtn svg').outerHTML, ICON, TOOL_ICON }; },
      };
    })();`));
  const save = (n, url) => fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  const H = {};
  for (const [n, code, t, rot] of FIGS) { const r = await page.evaluate(a => G(`SITE.person(${JSON.stringify(a[0])}, ${a[1]}, ${a[2]})`), [code, t, rot]); save(n, r.url); H[n] = r.h; }
  // each figure's height in the game (m), so the site can draw a lineup to scale
  fs.writeFileSync(path.join(OUT, 'heights.json'), JSON.stringify(H, null, 1));
  for (const [n, type, tier] of BLDS) save(n, await page.evaluate(a => G(`SITE.building('${a[0]}', ${a[1]})`), [type, tier]));
  fs.writeFileSync(path.join(OUT, 'icons.json'), JSON.stringify(await page.evaluate(() => G('SITE.icons()')), null, 1));
  if (errors.length) console.log(errors.join('\n'));
  await close();
})();
