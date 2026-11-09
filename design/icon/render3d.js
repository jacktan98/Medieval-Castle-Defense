// Renders the app icon in 3D with the game's own models: the tier-3 castle on a low-poly green hill with the game's trees,
// rocks and a dirt track, drawn twice from the same camera, by day (blue sky, sun, clouds) and by night (stars, moon, torches
// and lit windows), and joined down the middle: day on the left, night on the right (Jack). Writes design/icon/icon-1024.png
// (the App Store's, no transparency), apple-touch-icon.png (180), icon-512.png and favicon.png (32) at the repo root.
//   node design/icon/render3d.js [--three path/to/three.min.js]
const path = require('path'), fs = require('fs');
const { openGame } = require('../../tools/render/serve');
const ROOT = path.resolve(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BLEND_W = +arg('--blend', 360);
(async () => {
  const { page, close, errors } = await openGame('index.html?debug&map=meadow', { three: arg('--three'), viewport: { width: 1024, height: 1024 } });
  const shot = night => page.evaluate(night => G(`((NIGHT) => {
    const S = new THREE.Scene();
    // the sky painted on a canvas: by day blue overhead to a pale haze at the horizon, the sun and a few soft clouds;
    // by night deep blue to a dark violet horizon, stars and a crescent moon (each on its own half of the icon)
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 1024);
    if (!NIGHT) { gr.addColorStop(0, '#3f86d0'); gr.addColorStop(.42, '#86bde6'); gr.addColorStop(.62, '#d9ecf2'); gr.addColorStop(1, '#d9ecf2'); }
    else { gr.addColorStop(0, '#070c22'); gr.addColorStop(.4, '#121c44'); gr.addColorStop(.62, '#2a2a58'); gr.addColorStop(1, '#2a2a58'); }
    x.fillStyle = gr; x.fillRect(0, 0, 1024, 1024);
    if (!NIGHT) {
      const g2 = x.createRadialGradient(190, 175, 30, 190, 175, 190); g2.addColorStop(0, 'rgba(255,248,214,.95)'); g2.addColorStop(.3, 'rgba(255,240,190,.45)'); g2.addColorStop(1, 'rgba(255,240,190,0)');
      x.fillStyle = g2; x.fillRect(0, 0, 512, 512); x.fillStyle = '#fff8dc'; x.beginPath(); x.arc(190, 175, 58, 0, 7); x.fill();
      const cloud = (cx, cy, k) => { x.fillStyle = 'rgba(255,255,255,.88)'; for (const [dx, dy, r] of [[0, 0, 34], [36, -14, 42], [78, 0, 32], [40, 10, 34], [-28, 8, 24]]) { x.beginPath(); x.arc(cx + dx * k, cy + dy * k, r * k, 0, 7); x.fill(); } };
      cloud(300, 320, 1.1); cloud(60, 430, .8);
    } else {
      x.fillStyle = '#f6ecd0'; for (const [sx, sy, r] of [[560, 90, 3.5], [640, 250, 3], [700, 60, 2.5], [930, 380, 3], [990, 120, 2.5], [600, 360, 2.5], [760, 330, 2], [880, 470, 2], [970, 250, 2], [540, 230, 2]]) { x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill(); }
      const g2 = x.createRadialGradient(830, 175, 40, 830, 175, 170); g2.addColorStop(0, 'rgba(220,226,255,.35)'); g2.addColorStop(1, 'rgba(220,226,255,0)'); x.fillStyle = g2; x.fillRect(512, 0, 512, 512);
      // the crescent cut out on its own canvas, so no darker disc of the moon's unlit side shows against the glow
      const mc = document.createElement('canvas'); mc.width = mc.height = 160; const mx = mc.getContext('2d');
      mx.fillStyle = '#f6ecd0'; mx.beginPath(); mx.arc(80, 80, 64, 0, 7); mx.fill();
      mx.globalCompositeOperation = 'destination-out'; mx.beginPath(); mx.arc(108, 56, 56, 0, 7); mx.fill();
      x.drawImage(mc, 750, 95);
    }
    const bg = new THREE.CanvasTexture(c); bg.encoding = THREE.sRGBEncoding; S.background = bg;
    S.fog = new THREE.Fog(new THREE.Color(NIGHT ? '#1c2148' : '#cfe6ef'), 45, 95);
    if (!NIGHT) {
      S.add(new THREE.HemisphereLight('#d8e8ff', '#5a4a30', .85));
      var sun = new THREE.DirectionalLight('#fff1d6', 1.7); sun.position.set(-14, 12, 10);
    } else {
      S.add(new THREE.HemisphereLight('#5a6aa8', '#1a1628', .5));
      var sun = new THREE.DirectionalLight('#9fb4ff', .6); sun.position.set(14, 12, 10);
    }
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 60 });
    sun.shadow.bias = -.001; sun.shadow.normalBias = .03; S.add(sun);
    // a low-poly green hill, flat on top for the castle, running off to the horizon; grass tones vary by position
    const hill = (px, pz) => { const r = Math.hypot(px, pz * 1.1); return 4.2 * (1 - sstep(4.6, 20, r)) + (fbm(px * .18 + 3, pz * .18) - .5) * 1.2 * sstep(5, 10, r) - .03 * r; };
    // the track's line (used for its ribbon below; the ground under it is left smooth and kept clear of tufts)
    const roadX = z => { const t = Math.max(0, (z - 3.3) / 17); return Math.sin(t * 3.4) * .7 * t; }, roadW = z => .8 + Math.max(0, (z - 3.3) / 17) * .45;
    const onRoad = (px, pz, m = 0) => pz > 2.5 && Math.abs(px - roadX(pz)) < roadW(pz) * 1.3 + m;
    const geo = new THREE.PlaneGeometry(120, 120, 140, 140).rotateX(-Math.PI / 2), pos = geo.attributes.position, col = [];
    const gc = new THREE.Color();
    for (let k = 0; k < pos.count; k++) {
      const px = pos.getX(k), pz = pos.getZ(k), rr = Math.hypot(px, pz); pos.setY(k, hill(px, pz) + (rr > 5.2 && !onRoad(px, pz, 1) ? (hash(px * 3.1, pz * 1.7) - .5) * .28 : 0));   // facets for grit
      const n = fbm(px * .25 + 9, pz * .25 + 4); const j = hash(px * 1.9, pz * 2.7); gc.setHSL(.23 + (n - .5) * .06 + (j - .5) * .02, .36 + n * .12, .25 + (n - .5) * .1 + (j - .5) * .05 - Math.min(.07, rr * .002));
      col.push(gc.r, gc.g, gc.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; S.add(ground);
    const y0 = hill(0, 0);
    const castle = makeModel('castle', 3, true, 0, 0); castle.position.y = y0; castle.rotation.y = 0; S.add(castle);
    castle.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    // the game's trees: a cylinder trunk and a six-sided cone crown in the game's greens
    const tm = new THREE.MeshStandardMaterial({ color: '#4d3622', flatShading: true });
    const tree = (tx, tz, s, h) => {
      const cm = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(.27 + (h - .5) * .07, .3 + h * .15, .16 + h * .08), flatShading: true });
      const g = new THREE.Group(); g.add(new THREE.Mesh(trunkGeo, tm), new THREE.Mesh(crownGeo, cm)); g.children.forEach(m => { m.castShadow = m.receiveShadow = true; });
      g.position.set(tx, hill(tx, tz) - .05, tz); g.scale.setScalar(s); g.rotation.y = h * 6; S.add(g);
    };
    for (const t of [[-6.4, -2.0, 1.5, .2], [-8.0, .8, 1.3, .6], [-5.0, -5.6, 1.6, .85], [-9.4, -3.6, 1.7, .4], [-11.4, 2.2, 1.2, .7], [-3.0, -7.6, 1.7, .35],
      [6.6, -2.4, 1.6, .5], [8.4, .6, 1.3, .3], [4.8, -6.0, 1.5, .75], [9.8, -3.8, 1.8, .15], [11.6, 2.8, 1.15, .9], [1.6, -8.2, 1.8, .65],
      [-1.0, -11, 2.0, .1], [-7.5, -9.5, 1.9, .55], [7.5, -9.8, 2.0, .45], [-14, -6, 2.1, .3], [14.5, -6.5, 2.1, .7], [-17, 0, 1.8, .2], [17.5, 0, 1.9, .6], [3.5, -13, 2.1, .25], [-4.5, -14, 2.2, .8]]) tree(...t);
    // rocks (the game's gritty rock), bushes and grass tufts
    for (const [rx, rz, s, a] of [[-5.8, 6.6, 1.1, .3], [-6.9, 7.6, .65, 1.4], [6.2, 7.2, .95, 2.2], [7.2, 6.2, .6, .9], [-10.5, 6.0, .9, 2.6], [10.8, 8.5, .8, 1.1]]) {
      const m = new THREE.Mesh(rockGeo, rockMat); m.position.set(rx, hill(rx, rz) - .1, rz); m.scale.set(s, s * .75, s); m.rotation.set(a, a * 2, a * .5); m.castShadow = m.receiveShadow = true; S.add(m);
    }
    const bushM = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(.25, .35, .2), flatShading: true });
    for (const [bx, bz, s] of [[-4.4, 5.0, 1.2], [4.4, 4.6, 1.0], [-7.8, 6.0, .9], [8.8, 7.4, 1.1], [-1.8, 8.0, .7]]) { const m = new THREE.Mesh(CL[2].geo, bushM); m.position.set(bx, hill(bx, bz) - .05, bz); m.scale.setScalar(s); m.castShadow = true; S.add(m); }
    const tuftM = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(.22, .4, .24), flatShading: true });
    for (let k = 0; k < 140; k++) { const tx = (hash(k, 1.3) - .5) * 30, tz = 2 + hash(k, 7.1) * 14; if ((Math.abs(tx) < 3.5 && tz < 5) || onRoad(tx, tz, .6)) continue; const m = new THREE.Mesh(CL[0].geo, tuftM); m.position.set(tx, hill(tx, tz) - .02, tz); m.scale.setScalar(.8 + hash(k, 2.2) * .8); m.rotation.y = k; S.add(m); }
    // the game's path from the gate toward the viewer (Jack: the in-game look): a darker worn edge under packed brown earth,
    // flat grey-brown stones set in it and a kerb of small stones along both edges (the game's earth style and its stone mesh)
    const fx = 0, fz = 1;
    const ribbon = (wk, lift, colAt, matl) => {
      const pts = [], cols = [], idx = [], N = 70, cc = new THREE.Color();
      for (let i = 0; i <= N; i++) {
        const z = 3.3 + i / N * 17, cx = roadX(z), w = roadW(z) * wk;
        for (const k of [-1, -.5, 0, .5, 1]) { const px = cx + k * w + (Math.abs(k) === 1 ? (hash(i * 1.7, k * 5) - .5) * .12 : 0);
          pts.push(px, hill(px, z) + lift, z); colAt(px, z, cc); cols.push(cc.r, cc.g, cc.b); }
        if (i) for (let k = 0; k < 4; k++) { const a = (i - 1) * 5 + k, b = a + 5; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, matl); m.receiveShadow = true; S.add(m);
    };
    ribbon(1.22, .04, (x, z, c) => c.set('#4e3f2a'), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    ribbon(1, .07, (x, z, c) => { const n = .5 + .25 * Math.sin(x * 2.3 + z * 1.1) + .25 * Math.sin(x * .9 - z * 2.7); c.set('#78614a').multiplyScalar(.85 + .2 * n + .06 * hash(Math.round(x * 4), Math.round(z * 4))); },
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    { const st = [], sc = new THREE.Color(), dm = new THREE.Object3D();
      for (let z = 3.6; z < 20; z += .32) { const cx = roadX(z), w = roadW(z);
        for (const sd of [-1, 1]) if (hash(z * 3.3, sd) > .15) st.push([cx + sd * w * (1.12 + (hash(z, sd * 2) - .5) * .1), z + (hash(z * 1.1, sd * 3) - .5) * .12, .09 + hash(z, sd * 7) * .05, 1]);   // kerb
        for (let k = 0; k < 2; k++) if (hash(z * 2.9, k * 4.1) < .55) st.push([cx + (hash(z * 1.3, k * 9) - .5) * w * 1.5, z + (hash(z * 5, k) - .5) * .3, .12 + hash(z * 7, k) * .1, 0]); }   // set stones
      const im = new THREE.InstancedMesh(pathStones.geometry, pathStones.material, st.length); im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(st.length * 3), 3);
      st.forEach(([x, z, r, kerb], n) => { const h = hash(x * 7, z * 3); dm.position.set(x, hill(x, z) + (kerb ? .06 : .08), z); dm.rotation.set((h - .5) * .12, h * 6.3, (hash(z, x) - .5) * .12); dm.scale.set(r, kerb ? .1 : .06, r * (.75 + .4 * h)); dm.updateMatrix(); im.setMatrixAt(n, dm.matrix);
        sc.set(kerb ? '#666154' : '#5e5749').multiplyScalar(.9 + .25 * h); im.setColorAt(n, sc); });
      im.castShadow = im.receiveShadow = true; im.frustumCulled = false; S.add(im); }
    // a torch on the night side of the track, lit
    if (NIGHT) { const tx = 3.4, tz = 6.4; const t = makeModel('torch', 1, true, 0, 0); t.position.set(tx, hill(tx, tz), tz); t.scale.setScalar(.85); S.add(t);
      if (NIGHT) { const L = new THREE.PointLight('#ffa64a', 1.3, 4.5, 2); L.position.set(tx, hill(tx, tz) + 1.3, tz); S.add(L); } }
    // people (Jack): by day two villagers, one cheering by the torch, a builder walking up the track; by night raiders charging
    // the castle (a swordsman, a spearman and an archer loosing at it) with arrows flying at the castle through the night sky
    // stood on the faceted ground itself (a ray down onto the ground mesh: hill() leaves out the facets, so feet floated off their shadows)
    const rc = new THREE.Raycaster(), groundY = (x, z) => { rc.set(new THREE.Vector3(x, 50, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(ground)[0]; return h ? h.point.y : hill(x, z); };
    const fig = (p, x, z, ry, k = 1.2) => { p.g.position.set(x, groundY(x, z), z); p.g.rotation.y = ry; p.g.scale.setScalar(k); S.add(p.g); p.g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); return p; };
    if (!NIGHT) {
      // a flower bed (the game's decor) further back on the day side's lawn
      for (const [type, x, z, ry, k] of [['flowers', -4.4, 2.0, .2, .85]]) {
        const d = makeModel(type, 1, true, 0, 0); d.position.set(x, hill(x, z), z); d.rotation.y = ry; d.scale.setScalar(k); S.add(d); d.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); }
      const a = fig(makePerson({}), -1.8, 5.3, .55);
      a.arms[0].rotation.set(-2.9, 0, -.35); a.arms[1].rotation.set(-2.9, 0, .35); a.g.position.y += .14; a.legs[0].rotation.x = .35; a.legs[1].rotation.x = -.2;   // jumping for joy: arms up, off the ground over his shadow (Jack)
      const b = fig(makePerson({}), -3.2, 6.3, .35); giveTool(b, 'hammer');
      b.arms[0].rotation.set(-2.85, 0, -.4); b.arms[1].rotation.set(-2.85, 0, .4); b.pivot.rotation.x = -.6;    // cheering too, hammer held up
    } else {
      const run = (p, k) => { p.legs[0].rotation.x = .7 * k; p.legs[1].rotation.x = -.7 * k; p.body.rotation.x = .14; };
      const s1 = fig(makeRaider('sword', 2), 1.9, 5.5, -2.5); run(s1, 1); s1.arms[0].rotation.x = -.7; s1.arms[1].rotation.x = -2.7; s1.pivot.rotation.x = -.95;   // sword raised
      const s2 = fig(makeRaider('spear', 2), 2.9, 6.9, -2.35); run(s2, -1); spearPose(s2, 0, 0); s2.arms[0].rotation.x = -.6;
      const s3 = fig(makeRaider('archer', 2), 3.1, 4.1, -2.0); s3.arms[0].rotation.set(-2.0, 0, .55); s3.arms[1].rotation.set(-1.85, 0, -.6);   // bow drawn, aimed up at the walls
      const am = new THREE.MeshStandardMaterial({ color: '#d8c39a', emissive: '#2a2010', roughness: .8 }), hm = new THREE.MeshStandardMaterial({ color: '#cfd4dc', metalness: .3, roughness: .5 }), fm = new THREE.MeshStandardMaterial({ color: '#e8e0d0', side: THREE.DoubleSide });
      for (const [x, y, z, dx, dy, dz] of [[3.7, 7.3, 2.2, 5, 4.2, 1.5], [4.9, 6.1, 2.9, 4.5, 4.6, 1.2], [3.0, 8.9, 3.4, 5, 3.8, 1.2], [5.6, 8.1, 2.0, 4.5, 2.6, -1.2]]) {
        const ar = new THREE.Group(), sh = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.1, 5).rotateX(Math.PI / 2), am); ar.add(sh);
        const hd = new THREE.Mesh(new THREE.ConeGeometry(.07, .2, 4).rotateX(-Math.PI / 2), hm); hd.position.z = -.62; ar.add(hd);
        for (const r of [0, Math.PI / 2]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.16, .28), fm); f.rotation.set(Math.PI / 2, 0, r); f.position.z = .45; ar.add(f); }
        ar.position.set(x, y, z); ar.lookAt(x + dx, y + dy, z + dz); ar.scale.setScalar(.95); S.add(ar);   // each flying in from its own angle, so they look loosed by different bows
      }
    }
    if (NIGHT) {
      const G2 = new THREE.PointLight('#ffb35c', .7, 3.2, 2); G2.position.set(fx * 2.9, y0 + 1, fz * 2.9); S.add(G2);
    }
    const cam = new THREE.PerspectiveCamera(32, 1, .1, 200); cam.position.set(0, 8.6, 21.5); cam.lookAt(0, 6.1, 0);
    windU.value = 1.3;
    renderer.setPixelRatio(1); renderer.setSize(1024, 1024, false); renderer.render(S, cam);
    return renderer.domElement.toDataURL('image/png');
  })(${night})`), night);
  const day = await shot(false), nightShot = await shot(true);
  // day on the left, night on the right, blended over a narrow band down the middle
  const out = await page.evaluate(async ([a, b, W]) => {
    const load = s => { const im = new Image(); im.src = s; return im.decode().then(() => im); };
    const [A, B] = [await load(a), await load(b)];
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
    x.drawImage(A, 0, 0);
    const m = document.createElement('canvas'); m.width = m.height = 1024; const y = m.getContext('2d');
    y.drawImage(B, 0, 0); y.globalCompositeOperation = 'destination-in';
    // a wide, eased fade (Jack: the day turned into night too suddenly over the old 60 px band)
    const g = y.createLinearGradient(512 - W / 2, 0, 512 + W / 2, 0);
    for (let i = 0; i <= 16; i++) { const t = i / 16, e = t * t * (3 - 2 * t); g.addColorStop(t, 'rgba(0,0,0,' + e.toFixed(3) + ')'); }
    y.fillStyle = g; y.fillRect(0, 0, 1024, 1024);
    x.drawImage(m, 0, 0);
    return c.toDataURL('image/png');
  }, [day, nightShot, BLEND_W]);
  if (process.env.ICON_PREVIEW) { fs.writeFileSync(process.env.ICON_PREVIEW, Buffer.from(out.split(',')[1], 'base64')); console.log('preview', process.env.ICON_PREVIEW); await close(); return; }
  const big = path.join(__dirname, 'icon-1024.png'); fs.writeFileSync(big, Buffer.from(out.split(',')[1], 'base64'));
  // Apple refuses an app icon with an alpha channel: drop it (PIL), and put the icon in the iOS project
  require('child_process').execFileSync('python3', ['-c', `from PIL import Image; im = Image.open('${big}').convert('RGB'); im.save('${big}'); im.save('${path.join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')}')`]);
  console.log('wrote design/icon/icon-1024.png and the iOS app icon');
  // downscale in the page for smooth resampling
  const files = await page.evaluate(async src => {
    const im = new Image(); im.src = src; await im.decode();
    const o = {}; for (const n of [512, 180, 32]) { const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, n, n); o[n] = c.toDataURL('image/png').split(',')[1]; }
    return o;
  }, out);
  for (const [n, f] of [[512, 'icon-512.png'], [180, 'apple-touch-icon.png'], [32, 'favicon.png']]) { fs.writeFileSync(path.join(ROOT, f), Buffer.from(files[n], 'base64')); console.log('wrote', f); }
  if (errors.length) console.log('page errors:', errors.slice(0, 5));
  await close();
})();
