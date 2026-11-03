// The campaign overview's markers, rendered with the game's own models and lit from the overview's sun's direction (south-west, as in
// overview-scene.js) but higher, so their shadows stay short and light (a long flag shadow looked wrong): the blue rally flag on the stage the player is at, and the town's garrison banner planted on every stage won.
// Each is a strip of looping frames (the cloth's wave drawn with loop-friendly speeds) on a transparent background, with the model's
// shadow on the ground. Evaluated inside the game's closure by tools/render/markers.js (window.G); returns { flag, banner } data URLs.
(() => {
  const FW = 220, FH = 200, NF = 16, PER = Math.PI * 2 / 2.5;   // frame size in px, frames per loop, loop length in s (waves at 2.5, 5 and 10 rad/s)
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(FW, FH, false); r.setClearColor(0, 0);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
  const T = { value: 0 };
  // the flag's and the banner's ripple, as in the game, with speeds that come round together every PER seconds
  const flagM = M.flag.clone(); flagM.onBeforeCompile = sh => { sh.uniforms.uTime = T;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float fu = clamp(transformed.x * 1.4 + .5, 0.0, 1.0);
      transformed.z += sin(uTime * 5.0 - fu * 6.0) * .07 * fu + sin(uTime * 10.0 - fu * 9.0) * .02 * fu;
      transformed.y += sin(uTime * 2.5 - fu * 4.0) * .025 * fu;`); };
  flagM.customProgramCacheKey = () => 'marker-flag';
  const drapeM = M.drape.clone(); drapeM.onBeforeCompile = sh => { sh.uniforms.uTime = T;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float du = clamp(.5 - transformed.y * 1.1, 0.0, 1.0);
      transformed.z += (sin(uTime * 2.5 - du * 5.0) * .05 + .02) * du;
      transformed.x += sin(uTime * 2.5 - du * 3.0 + 1.0) * .015 * du;`); };
  drapeM.customProgramCacheKey = () => 'marker-drape';
  const swap = (g, from, to) => g.traverse(o => { if (o.isMesh && o.material === from) o.material = to; });
  const sheet = (model, look) => {
    const sc = new THREE.Scene(); sc.add(model); model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(12, 12).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: .3 })); gr.receiveShadow = true; sc.add(gr);
    sc.add(new THREE.HemisphereLight('#dfe8ff', '#6b5a3a', .55));
    const sun = new THREE.DirectionalLight('#ffe7c4', 1.25); sun.position.set(-90, 260, 60).normalize().multiplyScalar(20); sc.add(sun, sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 50 }); sun.shadow.bias = -.0005;
    // seen from the south, high up, like a figure on a map: up the screen is north, as on the overview
    const h = look.h, cam = new THREE.OrthographicCamera(-h * FW / FH / 2, h * FW / FH / 2, h / 2, -h / 2, .1, 100);
    const el = .95; cam.position.set(look.x, look.y + Math.sin(el) * 30, Math.cos(el) * 30); cam.lookAt(look.x, look.y, 0);
    const out = document.createElement('canvas'); out.width = FW * NF; out.height = FH; const cx = out.getContext('2d');
    for (let n = 0; n < NF; n++) { T.value = n / NF * PER; r.render(sc, cam); cx.drawImage(r.domElement, n * FW, 0); }
    return out.toDataURL('image/png');
  };
  // the rally flag (as setRally builds it), its cloth drawn larger so it reads on the map
  const f = new THREE.Group(); f.add(box(.06, 1.6, .06, M.timber, 0, .8, 0)); f.add(flagBox(.8, .5, .03, flagM, .42, 1.33, 0));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), M.iron); knob.position.set(0, 1.62, 0); f.add(knob);
  f.rotation.y = -.35;
  const LF = { h: 2.4, y: .9, x: .55 }, LB = { h: 3.9, y: 1.45, x: .9 };
  const flag = sheet(f, LF);
  const b = makeBanner(); swap(b, M.drape, drapeM); b.rotation.y = -.35;
  const banner = sheet(b, LB);
  r.dispose();
  // where the model's foot lands in each frame (px): the overview pins that point on the stop
  const foot = l => [Math.round(FW / 2 - l.x / l.h * FH), Math.round(FH / 2 + l.y * Math.cos(.95) / l.h * FH)];
  return { flag, banner, FW, FH, NF, PER, footFlag: foot(LF), footBanner: foot(LB) };
})()
