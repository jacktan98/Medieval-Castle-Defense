// Renders the app icon in 3D with the game's own models (Jack: back to the earlier, simpler icon; the day/night one with
// figures was too busy at home-screen size): the tier-3 castle turned a little sideways on a low-poly green hill at dusk,
// the game's trees, rocks and tufts, the game's path from the gate toward the viewer, stars and a crescent moon. Writes
// design/icon/icon-1024.png (the App Store's, no transparency, also put in the iOS project), apple-touch-icon.png (180),
// icon-512.png and favicon.png (32) at the repo root.
//   node design/icon/render3d.js [--three path/to/three.min.js]
const path = require('path'), fs = require('fs');
const { openGame } = require('../../tools/render/serve');
const ROOT = path.resolve(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const { page, close, errors } = await openGame('index.html?debug&map=meadow', { three: arg('--three'), viewport: { width: 1024, height: 1024 } });
  const out = await page.evaluate(() => G(`(() => {
    const S = new THREE.Scene();
    // dusk sky painted on a canvas: deep blue overhead to warm amber at the horizon, a crescent moon, a few stars
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 1024);
    gr.addColorStop(0, '#1b2648'); gr.addColorStop(.38, '#3d4670'); gr.addColorStop(.58, '#c98a5a'); gr.addColorStop(.7, '#f2c26b'); gr.addColorStop(1, '#f2c26b');
    x.fillStyle = gr; x.fillRect(0, 0, 1024, 1024);
    x.fillStyle = '#f6ecd0'; for (const [sx, sy, r] of [[130, 110, 4], [290, 190, 3], [470, 70, 3.5], [900, 330, 3], [80, 300, 2.5], [610, 160, 2.5], [380, 300, 2]]) { x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill(); }
    const mc = document.createElement('canvas'); mc.width = mc.height = 160; const mx = mc.getContext('2d');
    mx.fillStyle = '#f6ecd0'; mx.beginPath(); mx.arc(80, 80, 64, 0, 7); mx.fill(); mx.globalCompositeOperation = 'destination-out'; mx.beginPath(); mx.arc(108, 56, 56, 0, 7); mx.fill(); x.drawImage(mc, 720, 90);
    const bg = new THREE.CanvasTexture(c); bg.encoding = THREE.sRGBEncoding; S.background = bg;
    S.fog = new THREE.Fog(new THREE.Color('#c98a5a'), 45, 95);
    S.add(new THREE.HemisphereLight('#c9d6ff', '#4a3d28', .6));
    const sun = new THREE.DirectionalLight('#ffd6a0', 1.4); sun.position.set(-14, 9, 10); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 60 });
    sun.shadow.bias = -.001; sun.shadow.normalBias = .03; S.add(sun);
    // a low-poly green hill, flat on top for the castle, running off to the horizon; grass tones vary by position
    const hill = (px, pz) => { const r = Math.hypot(px, pz * 1.1); return 4.2 * (1 - sstep(4.6, 20, r)) + (fbm(px * .18 + 3, pz * .18) - .5) * 1.2 * sstep(5, 10, r) - .03 * r; };
    // the game's path from the gate toward the viewer, along the castle's facing (fx, fz), a gentle bend as it comes down
    const fx = Math.sin(-.42), fz = Math.cos(-.42), D0 = 3.4, D1 = 20;
    const latAt = d => { const t = Math.max(0, (d - D0) / (D1 - D0)); return Math.sin(t * 3.4) * .9 * t; }, widAt = d => .8 + Math.max(0, (d - D0) / (D1 - D0)) * .45;
    const toWorld = (d, l) => [fx * d + fz * l, fz * d - fx * l];
    const local = (px, pz) => [px * fx + pz * fz, px * fz - pz * fx];
    const onRoad = (px, pz, m = 0) => { const [d, l] = local(px, pz); return d > D0 - .8 && Math.abs(l - latAt(d)) < widAt(d) * 1.3 + m; };
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
    const castle = makeModel('castle', 3, true, 0, 0); castle.position.y = y0; castle.rotation.y = -.42; S.add(castle);
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
    for (const [bx, bz, s] of [[-4.4, 5.0, 1.2], [4.4, 4.6, 1.0], [-7.8, 6.0, .9], [8.8, 7.4, 1.1], [-1.8, 8.0, .7]]) { if (onRoad(bx, bz, .8)) continue; const m = new THREE.Mesh(CL[2].geo, bushM); m.position.set(bx, hill(bx, bz) - .05, bz); m.scale.setScalar(s); m.castShadow = true; S.add(m); }
    const tuftM = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(.22, .4, .24), flatShading: true });
    for (let k = 0; k < 140; k++) { const tx = (hash(k, 1.3) - .5) * 30, tz = 2 + hash(k, 7.1) * 14; if ((Math.abs(tx) < 3.5 && tz < 5) || onRoad(tx, tz, .6)) continue; const m = new THREE.Mesh(CL[0].geo, tuftM); m.position.set(tx, hill(tx, tz) - .02, tz); m.scale.setScalar(.8 + hash(k, 2.2) * .8); m.rotation.y = k; S.add(m); }
    const ribbon = (wk, lift, colAt, matl) => {
      const pts = [], cols = [], idx = [], N = 70, cc = new THREE.Color();
      for (let i = 0; i <= N; i++) {
        const d = D0 + i / N * (D1 - D0), cl = latAt(d), w = widAt(d) * wk;
        for (const k of [-1, -.5, 0, .5, 1]) { const [px, pz] = toWorld(d, cl + k * w + (Math.abs(k) === 1 ? (hash(i * 1.7, k * 5) - .5) * .12 : 0));
          pts.push(px, hill(px, pz) + lift, pz); colAt(px, pz, cc); cols.push(cc.r, cc.g, cc.b); }
        if (i) for (let k = 0; k < 4; k++) { const a = (i - 1) * 5 + k, b = a + 5; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, matl); m.receiveShadow = true; S.add(m);
    };
    ribbon(1.22, .04, (x, z, c) => c.set('#4e3f2a'), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    ribbon(1, .07, (x, z, c) => { const n = .5 + .25 * Math.sin(x * 2.3 + z * 1.1) + .25 * Math.sin(x * .9 - z * 2.7); c.set('#78614a').multiplyScalar(.85 + .2 * n + .06 * hash(Math.round(x * 4), Math.round(z * 4))); },
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    { const st = [], sc = new THREE.Color(), dm = new THREE.Object3D();
      for (let d = D0 + .3; d < D1; d += .32) { const cl = latAt(d), w = widAt(d);
        for (const sd of [-1, 1]) if (hash(d * 3.3, sd) > .15) st.push([...toWorld(d + (hash(d * 1.1, sd * 3) - .5) * .12, cl + sd * w * (1.12 + (hash(d, sd * 2) - .5) * .1)), .09 + hash(d, sd * 7) * .05, 1]);
        for (let k = 0; k < 2; k++) if (hash(d * 2.9, k * 4.1) < .55) st.push([...toWorld(d + (hash(d * 5, k) - .5) * .3, cl + (hash(d * 1.3, k * 9) - .5) * w * 1.5), .12 + hash(d * 7, k) * .1, 0]); }
      const im = new THREE.InstancedMesh(pathStones.geometry, pathStones.material, st.length); im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(st.length * 3), 3);
      st.forEach(([x, z, r, kerb], n) => { const h = hash(x * 7, z * 3); dm.position.set(x, hill(x, z) + (kerb ? .06 : .08), z); dm.rotation.set((h - .5) * .12, h * 6.3, (hash(z, x) - .5) * .12); dm.scale.set(r, kerb ? .1 : .06, r * (.75 + .4 * h)); dm.updateMatrix(); im.setMatrixAt(n, dm.matrix);
        sc.set(kerb ? '#666154' : '#5e5749').multiplyScalar(.9 + .25 * h); im.setColorAt(n, sc); });
      im.castShadow = im.receiveShadow = true; im.frustumCulled = false; S.add(im); }
    const cam = new THREE.PerspectiveCamera(32, 1, .1, 200); cam.position.set(0, 8.6, 21.5); cam.lookAt(0, 7.5, 0);
    windU.value = 1.3;
    renderer.setPixelRatio(1); renderer.setSize(1024, 1024, false); renderer.render(S, cam);
    return renderer.domElement.toDataURL('image/png');
  })()`));
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
