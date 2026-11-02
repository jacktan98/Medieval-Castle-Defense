// Builds the campaign overview as one 3D landscape and returns it as a JPEG data URL. Evaluated inside the game's closure by
// tools/render/overview.js (window.G), so it uses the game's own trees, rocks and building models.
// The overview's plan is 800 × 900 (CAMPAIGN[].at, CAMP_LAND, CAMP_RIVER), shown stretched to 800 × 1350 (CAMP_CY);
// the world here is that plan at a quarter scale across and 3/8 down: 200 m × 337.5 m, seen straight down.
(() => {
  const WX = .25, WZ = .25 * CAMP_CY, W = 800 * WX, D = 900 * WZ, PXW = 1200, PXH = Math.round(PXW * D / W);
  const toW = (px, py) => [px * WX, py * WZ], toP = (x, z) => [x / WX, z / WZ];
  // the coast and the river, in plan coordinates
  const bez = (p0, a, b, c, d, e, f, n, out) => { for (let i = out.length ? 1 : 0; i <= n; i++) {   // no repeated points: a zero-length segment gives NaN distances
 const t = i / n, m = 1 - t; out.push([m * m * m * p0[0] + 3 * m * m * t * a + 3 * m * t * t * c + t * t * t * e, m * m * m * p0[1] + 3 * m * m * t * b + 3 * m * t * t * d + t * t * t * f]); } };
  const COAST = []; { let p = [40, 880];
    for (const s of [[20, 700, 60, 560, 40, 420], [25, 300, 60, 160, 120, 40]]) { bez(p, ...s, 20, COAST); p = [s[4], s[5]]; }
    COAST.push([700, 30]); p = [700, 30];   // the next curve starts here: bez skips its first point
    for (const s of [[760, 160, 770, 330, 750, 480], [735, 620, 780, 760, 740, 880]]) { bez(p, ...s, 20, COAST); p = [s[4], s[5]]; } }
  const RIV = CAMP_RIVER.map(R => { const pts = []; let p = R[0]; for (const s of R.slice(1)) { bez(p, ...s, 16, pts); p = [s[4], s[5]]; } return pts; });
  const P = CAMPAIGN.map(c => c.at);
  const rivD = (px, py) => Math.min(...RIV.map(r => polyDist(r, px, py)));
  const coastD = (px, py) => inPoly(COAST, px, py) ? polyDist([...COAST, COAST[0]], px, py) : -1;
  const stopD = (px, py) => Math.min(...P.map(([a, b]) => Math.hypot(a - px, (b - py) * 1.2)));
  const keepP = P[10], holdP = P[11];
  // ---------- every built stage, played once (startGame) and shrunk into a round patch at its stop: its own ground and colours, water,
  // bridges, roads, trees, rocks and fixed scenery (walls, ruins, the market cross and hamlet, the bosses' forts); never the castle
  const PATCH = 21, STG = [];   // each stage's patch radius in metres: the closest stops are about 44 m apart
  // clone without userData: three copies it through JSON, and the game keeps object references there (a stack overflow)
  const cl = o => { const saved = []; o.traverse(n => { saved.push([n, n.userData]); n.userData = {}; }); const c = o.clone(); for (const [n, u] of saved) n.userData = u; return c; };
  for (const c of CAMPAIGN) {
    if (!c.map) continue;
    MAP = c.map; startGame(); paused = true;
    const [cx, cz] = toW(...c.at), k = PATCH / (SIZE / 2);
    const wrap = new THREE.Group(); wrap.position.set(cx - SIZE / 2 * k, 0, cz - SIZE / 2 * k); wrap.scale.setScalar(k);
    for (const B of buildings) if (B.type !== 'castle') wrap.add(cl(B.group));
    for (const b of bridges) if (b.g) wrap.add(cl(b.g));
    for (const r of rocks) if (r.mesh) wrap.add(cl(r.mesh));
    if (bossMesh) wrap.add(cl(bossMesh));
    if (ruinMesh) wrap.add(cl(ruinMesh));
    wrap.add(cl(roadBase), cl(roadTop), cl(pathStones));
    STG.push({ cx, cz, k, V, SIZE, H: H.slice(0, V * V), C: tCol.slice(0, V * V * 3), trees: trees.map(t => ({ x: t.x, z: t.z, s: t.s, bare: t.bare })), wrap });
  }
  const stageAt = (x, z) => { for (const st of STG) { const d = Math.hypot(x - st.cx, z - st.cz); if (d < PATCH) return [st, d]; } return null; };
  const stSample = (st, x, z) => {   // the stage's own height (scaled) and colour under an overview point
    const sx = clamp((x - st.cx) / st.k + st.SIZE / 2, 0, st.SIZE), sz = clamp((z - st.cz) / st.k + st.SIZE / 2, 0, st.SIZE), i = Math.floor(sx), j = Math.floor(sz), fx = sx - i, fz = sz - j;
    const at = (a, b) => st.H[Math.min(b, st.V - 1) * st.V + Math.min(a, st.V - 1)];
    const h = lerp(lerp(at(i, j), at(i + 1, j), fx), lerp(at(i, j + 1), at(i + 1, j + 1), fx), fz) * st.k, n = (Math.min(Math.round(sz), st.V - 1) * st.V + Math.min(Math.round(sx), st.V - 1)) * 3;
    return [h, st.C[n], st.C[n + 1], st.C[n + 2]];
  };
  // ---------- ground: heights and colours by land
  const NX = 201, NZ = Math.round(D) + 1, Hh = new Float32Array(NX * NZ), Cc = new Float32Array(NX * NZ * 3);
  const col = new THREE.Color(), tmp = new THREE.Color();
  const C_ = h => new THREE.Color(h);
  const GR = C_('#5a7338'), GR2 = C_('#46602e'), WOOD = C_('#3a5528'), DRY = C_('#a39a5e'), SAND = C_('#c9ad72'), PLAIN = C_('#7e9b45'), HIGH = C_('#7f7a5e'),
    MARSH = C_('#646238'), RED = C_('#7d4d3c'), ROCKC = C_('#77736a'), SNOW = C_('#e4e6ea'), BEACH = C_('#c9b98a'), BED = C_('#5d5a44');
  const hgt = (px, py) => {
    const cd = coastD(px, py); if (cd < 0) return -2.5;
    const wF = landW('woods', px, py, .4, 1.2), wD = landW('desert', px, py, .3, 1.1), wP = landW('plains', px, py, .4, 1.1), wH = landW('high', px, py, .4, 1.15), wM = landW('marsh', px, py, .3, 1.1);
    const north = sstep(250, 110, py) * (1 - .8 * sstep(110, 60, Math.hypot(px - keepP[0], py - keepP[1])));   // the mountains: the far north; the raiders' keep stands on lower red ground below them
    let h = 1.4 + 1.6 * fbm(px * .012, py * .012) + 1.2 * wF * fbm(px * .03 + 5, py * .03);
    h += wH * (2.5 + 5 * fbm(px * .028 + 9, py * .028 + 3));
    h += north * (4 + 14 * Math.pow(1 - Math.abs(2 * fbm(px * .012 + 11, py * .012 + 7) - 1), 1.4)) + sstep(360, 230, py) * 1.6 * fbm(px * .02, py * .02);
    h += wD * 1.3 * Math.pow(Math.max(0, Math.sin(px * .11 + py * .06 + 3 * fbm(px * .02, py * .02))), 2.5);
    h = lerp(h, .9 + .3 * fbm(px * .05, py * .05), wM * .85);
    if (wM > .4 && fbm(px * .07 + 3, py * .07 + 8) > .47) h = lerp(h, -.6, sstep(.47, .53, fbm(px * .07 + 3, py * .07 + 8)) * sstep(.4, .7, wM));   // marsh pools
    h = lerp(-.4, h, sstep(0, 14, cd));                                      // down to the beach
    // each stop's ground made level for its little town
    const rd = rivD(px, py); h = lerp(-1.2, h, sstep(5, 13, rd));
    return h;
  };
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const [px, py] = toP(i, j), k = j * NX + i, h = hgt(px, py); Hh[k] = h;
    const wF = landW('woods', px, py, .45, 1.2), wS = landW('dry', px, py, .45, 1.1), wD = landW('desert', px, py, .3, 1.05), wP = landW('plains', px, py, .4, 1.1), wH = landW('high', px, py, .4, 1.1), wM = landW('marsh', px, py, .3, 1.05);
    col.copy(GR2).lerp(GR, fbm(px * .03, py * .03));
    col.lerp(WOOD, wF * .8); col.lerp(DRY, wS * .7); col.lerp(PLAIN, wP * .6); col.lerp(HIGH, wH * .75); col.lerp(MARSH, wM * .8); col.lerp(SAND, wD * .9);
    col.lerp(HIGH, sstep(330, 200, py) * .45);
    col.lerp(RED, sstep(360, 230, py) * .75 * (1 - sstep(120, 230, Math.hypot(px - keepP[0], py - keepP[1]))));   // the raiders' red land round their keep
    const cd = coastD(px, py); if (cd >= 0 && cd < 12 && h < 1.5) col.lerp(BEACH, .8);
    if (h < .2 && cd >= 0) col.lerp(BED, .6);
    if (h > 12) col.lerp(SNOW, sstep(12, 15.5, h) * .9);
    tmp.copy(col);
    const sp = stageAt(i, j);
    if (sp) { const [st, d] = sp, w = 1 - sstep(PATCH * .72, PATCH, d), [sh, r, gg, b] = stSample(st, i, j); Hh[k] = lerp(Hh[k], sh, w); tmp.r = lerp(tmp.r, r, w); tmp.g = lerp(tmp.g, gg, w); tmp.b = lerp(tmp.b, b, w); }
    Cc.set([tmp.r, tmp.g, tmp.b], k * 3);
  }
  const g = new THREE.BufferGeometry(), pos = new Float32Array(NX * NZ * 3), idxs = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; pos[k * 3] = i; pos[k * 3 + 1] = Hh[k]; pos[k * 3 + 2] = j; }
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idxs.push(a, c, b, b, c, d); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); g.setIndex(idxs); g.computeVertexNormals();
  const sc = new THREE.Scene(); sc.background = C_('#1f3442');
  const ground = new THREE.Mesh(g, terrain.material); ground.receiveShadow = true; ground.castShadow = true; sc.add(ground);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.2, D * 1.2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#3e6e86', roughness: .55, transparent: true, opacity: .9 }));
  sea.position.set(W / 2, 0, D / 2); sea.receiveShadow = true; sc.add(sea);
  const hAtO = (x, z) => { const i = clamp(Math.round(x), 0, NX - 1), j = clamp(Math.round(z), 0, NZ - 1); return Hh[j * NX + i]; };
  // ---------- light: the game's warm sun from the south-west, long soft shadows
  sc.add(new THREE.HemisphereLight('#d6e6ff', '#4a3d28', .62));
  const sun = new THREE.DirectionalLight('#ffe7c4', 1.1); sun.position.set(W / 2 - 90, 120, D / 2 + 60); sun.target.position.set(W / 2, 0, D / 2);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -230, right: 230, top: 230, bottom: -230, near: 1, far: 420 }); sun.shadow.bias = -.0008;
  sc.add(sun, sun.target);
  // ---------- trees: density by land, like the old overview's sketch; pines on the slopes, dead trunks round the raiders' keep
  const T = [];
  for (let z = 1; z < D - 1; z += 1.25) for (let x = 1; x < W - 1; x += 1.25) {
    const jx = x + (hash(x * 3.1, z * 1.7) - .5) * 1.1, jz = z + (hash(z * 2.3, x * .9) - .5) * 1.1, [px, py] = toP(jx, jz), h = hAtO(jx, jz);
    if (h < .4 || coastD(px, py) < 6 || rivD(px, py) < 12 || stageAt(jx, jz)) continue;
    const wF = landW('woods', px, py, .45, 1.25), wD = landW('desert', px, py, .3, 1.2), wS = landW('dry', px, py, .45, 1.1), wP = landW('plains', px, py, .4, 1.1), wH = landW('high', px, py, .4, 1.15), wM = landW('marsh', px, py, .3, 1.1);
    const north = sstep(330, 230, py), mount = sstep(250, 130, py);
    const meadow = (fbm(px * .011, py * .011) - .5) * 1.6 + .1;
    let dens = clamp(.85 * wF + (1 - wF) * (meadow - .75 * wS - .95 * wD - .9 * wP - .5 * wH - .6 * wM - .8 * north), 0, 1);
    if (mount > .3 && h < 11) dens = Math.max(dens, .22 * mount);
    const dead = Math.hypot(px - keepP[0], py - keepP[1]) < 120 && py > 160;
    if (dead) dens = .06;
    if (hash(jx * .7, jz * 1.3) > dens) continue;
    T.push({ x: jx, z: jz, y: h, s: .7 + hash(jz, jx) * .5, dead, dark: wF > .5 || hash(jx, jz * 3) < .45, pine: mount > .3 });
  }
  for (const st of STG) for (const t of st.trees) {
    const x = st.cx + (t.x - st.SIZE / 2) * st.k, z = st.cz + (t.z - st.SIZE / 2) * st.k; if (Math.hypot(x - st.cx, z - st.cz) > PATCH * .95) continue;
    T.push({ x, z, y: stSample(st, x, z)[0], s: t.s * st.k, dead: t.bare, dark: hash(x, z * 3) < .45, pine: false });
  }
  const tr = new THREE.InstancedMesh(trunkGeo, trunks.material, T.length), cr = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true }), T.length);
  tr.castShadow = cr.castShadow = true; cr.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(T.length * 3), 3);
  const dm = new THREE.Object3D();
  T.forEach((t, n) => {
    dm.position.set(t.x, t.y, t.z); dm.rotation.set(0, hash(t.x, t.z) * 6, 0); dm.scale.setScalar(t.s); dm.updateMatrix(); tr.setMatrixAt(n, dm.matrix);
    if (t.dead) { dm.scale.setScalar(1e-4); dm.updateMatrix(); }
    cr.setMatrixAt(n, dm.matrix);
    const r = hash(t.x * 3.3, t.z * 1.1); tmp.setHSL(t.pine ? .33 : .27 + (r - .5) * .07, t.pine ? .28 : .3 + r * .15, (t.dark ? .13 : .18) + hash(t.z, t.x * 2) * .07); cr.setColorAt(n, tmp);
  });
  sc.add(tr, cr);
  // ---------- rocks on the highlands, at the mountains' feet and round the mesas
  const RK = [];
  for (let n = 0; n < 2400; n++) {
    const x = 2 + hash(n, 61) * (W - 4), z = 2 + hash(n, 62) * (D - 4), [px, py] = toP(x, z), h = hAtO(x, z);
    if (h < .5 || stageAt(x, z) || rivD(px, py) < 10) continue;
    const w = landW('high', px, py, .3, 1.05) * .5 + sstep(330, 240, py) * .25 + landW('desert', px, py, .5, 1.2) * .06;
    if (hash(n, 63) > w * .5) continue;
    RK.push([x, h, z, .5 + hash(n, 64) * .7]);
  }
  const rk = new THREE.InstancedMesh(rockGeo, rockMat, RK.length); rk.castShadow = rk.receiveShadow = true;
  RK.forEach(([x, y, z, s], n) => { dm.position.set(x, y + .1, z); dm.rotation.set(s * 3, s * 7, s * 5); dm.scale.setScalar(s); dm.updateMatrix(); rk.setMatrixAt(n, dm.matrix); });
  sc.add(rk);
  for (const st of STG) { st.wrap.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); sc.add(st.wrap); }
  // ---------- straight down, the whole land
  const cam = new THREE.OrthographicCamera(0, W, 0, -D, 1, 400); cam.position.set(0, 200, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
  // looking down -y with up = -z: screen right is +x, screen down is +z; the frustum spans x 0..W, z 0..D
  cam.left = 0; cam.right = W; cam.top = 0; cam.bottom = -D; cam.updateProjectionMatrix();
  const was = renderer.getSize(new THREE.Vector2()), pr = renderer.getPixelRatio();
  renderer.setPixelRatio(1); renderer.setSize(PXW, PXH, false); renderer.render(sc, cam);
  const url = renderer.domElement.toDataURL('image/jpeg', .86);
  renderer.setPixelRatio(pr); renderer.setSize(was.x, was.y, false);
  return url;
})()
