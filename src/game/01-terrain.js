// ---------- noise ----------
function hash(x, y) { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) { let s = 0, a = .5, f = 1; for (let k = 0; k < 4; k++) { s += a * vnoise(x * f, y * f); f *= 2; a *= .5; } return s; }

// ---------- heightmap + cell data ----------
const H = new Float32Array(V_MAX * V_MAX), dirt = new Float32Array(V_MAX * V_MAX), gvar = new Float32Array(V_MAX * V_MAX), dvar = new Float32Array(V_MAX * V_MAX);
const lock = new Uint8Array(V_MAX * V_MAX), road = new Uint8Array(N_MAX * N_MAX);
let occB = new Array(N * N).fill(null);
// the Meadow river's centre line
const meadowRiverX = z => SIZE * .68 + Math.sin(z * .12) * 5 + Math.sin(z * .05 + 1) * 3;
// Mountain pass: the castle on a plateau in the middle of the top half; open ground rings it and narrows into a pass coming up
// from the bottom edge, inside an uneven line of mountains (PASS_EDGE); nobody walks or builds beyond it (passOpen)
const PASS = { plate: 9.5 };
// the mountain line, from the bottom edge up the left, round the top of the castle and back down the right: the open ground rings
// the castle and narrows into a pass running down to the bottom edge, its sides deliberately unalike
const PASS_EDGE = [[14, 60], [15.5, 55], [14, 49], [13.2, 42], [11.5, 36], [9.5, 29], [9.8, 22], [12.5, 15], [17, 10], [23, 7], [30, 6.4], [37, 8], [43, 12.5], [46.5, 18], [47.5, 24], [45.5, 30], [42, 34.5], [40.5, 39], [41.5, 44], [40, 49], [37.5, 54], [38.5, 60]];
const PASS_POLY = PASS_EDGE;   // closed along y 60, below the map's bottom edge
function passAt(x, z) {
  let inside = false, d = 1e9;
  for (let i = 0, j = PASS_POLY.length - 1; i < PASS_POLY.length; j = i++) {
    const [xi, zi] = PASS_POLY[i], [xj, zj] = PASS_POLY[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  for (let i = 0; i < PASS_EDGE.length - 1; i++) {            // distance to the mountain line
    const [ax, az] = PASS_EDGE[i], [bx, bz] = PASS_EDGE[i + 1], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  const wob = 2.2 * (fbm(x * .11 + 7, z * .11 + 2) - .5) + 1.0 * (vnoise(x * .35, z * .35) - .5);   // an uneven, unsymmetrical edge
  return { depth: (inside ? d : -d) + wob, plate: Math.hypot(x - KX, z - KZ) };
}
const passOpen = (x, z) => passAt(x, z).depth > .3;
function passHeight(x, z) {
  const p = passAt(x, z), ridge = 1 - Math.abs(fbm(x * .17 + 5, z * .17 + 9) * 2 - 1);
  const mount = 8 + 6.5 * fbm(x * .11, z * .11) + 4.5 * ridge * ridge + 1.5 * vnoise(x * .4, z * .4);
  // the ground falls from the castle's plateau (6 m) to about 1 m at the bottom-left corner, rolling a little on the way
  const floor = 6 - 5 * sstep(PASS.plate, 42, p.plate) + 1.1 * (fbm(x * .09 + 4, z * .09 + 8) - .5) * sstep(PASS.plate, PASS.plate + 8, p.plate);
  const plateH = 6 + .3 * fbm(x * .2 + 3, z * .2);
  let h = lerp(floor, plateH, sstep(PASS.plate + 2, PASS.plate, p.plate));
  return lerp(mount, h, sstep(-2.6, .4, p.depth));              // 3 m cliffs up to the mountains
}
// Greenvale (campaign 1, the tutorial): a small green valley (VALE.r round VALE.c, about two thirds of the map across) closed in by
// wooded hills, open only to the north-east, where a corridor (VALE.w wide) runs out to the map's corner: every raider comes that way
const VALE = { c: [27, 31], r: 16.5, w: 14, gap: [[35, 23], [64, -6]] };   // the pass is 14 m wide (Jack found 9 m too narrow)
function valeAt(x, z) {
  const dx = x - VALE.c[0], dz = z - VALE.c[1], a = Math.atan2(dz, dx), r = Math.hypot(dx, dz);
  const R = VALE.r + 2.6 * (fbm(Math.cos(a) * 1.4 + 5, Math.sin(a) * 1.4 + 2) - .5) * 2;          // an uneven rim
  const [[ax, az], [bx, bz]] = VALE.gap, gx = bx - ax, gz = bz - az, t = clamp(((x - ax) * gx + (z - az) * gz) / (gx * gx + gz * gz), 0, 1);
  const corr = VALE.w / 2 + 1.4 * (vnoise(x * .2 + 3, z * .2) - .5) - Math.hypot(x - ax - gx * t, z - az - gz * t);
  return Math.max(R - r, corr) + .8 * (vnoise(x * .35, z * .35) - .5);
}
const valeOpen = (x, z) => valeAt(x, z) > .3;
function valeHeight(x, z) {
  const d = valeAt(x, z), floor = 2.4 + 1.1 * (fbm(x * .09 + 4, z * .09 + 8) - .5) * sstep(6, 12, Math.hypot(x - KX, z - KZ));
  const hill = 5 + 4 * fbm(x * .1 + 2, z * .1 + 6) + 1.2 * vnoise(x * .35, z * .35);
  return lerp(hill, floor, sstep(-5.5, .4, d));                 // the hills rise gently from the valley's rim
}
// Stonebridge (stage 2): a river winding from the east edge to the west; the town on the south bank, the raiders' woods on the
// north bank; one old stone bridge (BRIDGE_X) and, upstream, a ford (FORD_X: a gravel bar raiders can wade); low hills to the south
const BRIDGE_X = 28.5, FORD_X = 46.5;
const BANK_D = 7.2;   // the wall line runs this far south of the river's middle, on flat dry ground past the bank's slope
const stoneRiverZ = x => 16.5 - (x - 28) * .14 + 1.5 * Math.sin(x * .13 + 1) + .7 * Math.sin(x * .31);
function bridgeHeight(x, z) {
  let h = 2 + 2.4 * fbm(x * .06, z * .06) + Math.max(0, fbm(x * .14 + 9, z * .14 + 3) - .6) * 6;
  h += 3.2 * sstep(43, 55, z) * (.6 + .6 * fbm(x * .1 + 4, z * .1));          // low hills along the south edge
  h = lerp(3.0 + (h - 3.0) * .35, h, sstep(6, 12, Math.hypot(x - KX, z - KZ)));   // open meadow round the castle
  const ford = sstep(3.6, 2.4, Math.abs(x - FORD_X)), ramp = sstep(6, 3.5, Math.abs(x - FORD_X));   // the ford: the bed rises to a gravel bar
  const d = Math.abs(z - stoneRiverZ(x)), river = lerp(-1.4, h, lerp(sstep(2.2, 6, d), sstep(2.4, 12, d), ramp));   // with gentle banks down to it
  return d < 6 ? Math.max(river, lerp(river, .6 + .06 * vnoise(x * .9, z * .9), ford)) : river;   // .6: above the .45 raiders' routes need
}
// Market Cross (stage 3): a gentle meadow, a low rise to the north-east, a brook through the south-east corner; two old roads
// (already laid as paths) cross north-east of the castle at an old stone market cross, a hamlet of three houses round it
const CROSS_AT = [24, 30];
const CROSS_ROADS = [
  [[27, -1], [26.5, 8], [25, 16], [24.4, 24], [24, 30]],          // the north road (the raiders' way in)
  [[57, 25], [48, 26.5], [40, 28.5], [31, 29.6], [24, 30]],       // the east road (from night 3)
  [[24, 30], [16, 31.5], [8, 33], [-1, 34]],                      // west, the trade road
  [[24, 30], [23, 38], [21.5, 47], [21, 57]]];                    // south
const CROSS_BROOK = [[57, 36], [50, 40], [46, 47], [44, 57]];
const polyDist = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return d; };
const nearCrossRoad = (x, z, r) => CROSS_ROADS.some(p => polyDist(p, x, z) < r);
function crossHeight(x, z) {
  let h = 2 + 2 * fbm(x * .06, z * .06) + 3.2 * Math.pow(clamp(1 - Math.hypot((x - 50) / 15, (z - 4) / 12), 0, 1), 1.5);
  h = lerp(3 + (h - 3) * .35, h, sstep(6, 12, Math.hypot(x - KX, z - KZ)));
  return lerp(-.9, h, sstep(.8, 2.8, polyDist(CROSS_BROOK, x, z)));   // a narrow brook
}
// Watchhill (stage 4): dry golden hills; the castle on a flat hilltop, Watch hill to its north-east with an old ruined tower on top
// (a place for the ballista and the campfire: long sightlines down the slopes), a dry gully up from the east, a ridge track from the north
const WATCH_HILLS = [[17, 29, 13, 11.5, 3.2, 0], [33.6, 17.5, 9, 8, 4, .3], [49, 8.4, 10.5, 8.4, 3.4, 0], [7.7, 8.4, 8.4, 7.7, 2.8, 0], [44.8, 53.5, 12, 6.3, 1.8, 0]];   // x, z, rx, rz, height, flat top
const WATCH_GULLY = [[57, 39.2], [52, 38.2], [48.5, 41.5], [44, 43], [39, 43.6], [34, 42.2], [30.5, 43.6], [27, 46], [24, 49.5], [21.5, 53], [21, 57]];
const WATCH_ROADS = [
  [[57, 41.3], [51, 40.6], [48.3, 45.2], [42, 46.2], [36.4, 46], [32.9, 44.8], [29.4, 42], [26.6, 39.5], [23.8, 36.4], [20.5, 34.5]],   // the valley track, up the gully
  [[42.7, -1], [42, 4.2], [39.2, 8.4], [37, 12], [36.2, 15], [35.8, 19], [31, 22.5], [26, 25.5], [21.5, 27.5]]];                        // the ridge track (night 3+), past the old tower
const WATCH_RUIN = [33.6, 17.2];
const nearRuin = (x, z, r) => MAP === 'watch' && Math.hypot(x - WATCH_RUIN[0], z - WATCH_RUIN[1]) < r;
function watchHeight(x, z) {
  let h = 2 + 1.6 * fbm(x * .07, z * .07);
  for (const [cx, cz, rx, rz, hh, flat] of WATCH_HILLS) h += hh * (1 - sstep(flat, 1, Math.hypot((x - cx) / rx, (z - cz) / rz)));
  h = lerp(5.6 + (h - 5.6) * .3, h, sstep(5.5, 10, Math.hypot(x - KX, z - KZ)));   // the castle's flat hilltop
  return h - 1.1 * (1 - sstep(.8, 3.2, polyDist(WATCH_GULLY, x, z)));
}
// smooth a polyline (Chaikin, twice) so rivers and roads drawn from a sketch's corner points curve
function smoothPts(p, it = 2) { for (let k = 0; k < it; k++) { const q = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const [ax, az] = p[i], [bx, bz] = p[i + 1]; q.push([ax * .75 + bx * .25, az * .75 + bz * .25], [ax * .25 + bx * .75, az * .25 + bz * .75]); } q.push(p[p.length - 1]); p = q; } return p; }
// Dunewell (stage 5): sandy desert with dune ridges; the castle by a green oasis round a pool (palms by the water: the only wood),
// a caravan road west to east past them, two rock mesas (stone) in the north-east and south-west
const DUNE_POOL = [26.6, 24.2, 4.6, 3.1], DUNE_OASIS = [24.5, 25.9, 13.3, 11.5], DUNE_MESAS = [[46.2, 11.9, 7.4, 5.6], [9.1, 46.2, 6.7, 5.3]];
const DUNE_ROAD = smoothPts([[-1, 32.9], [8.4, 32.9], [12.6, 31], [17.5, 30.6], [23.1, 30], [30.1, 29.6], [36.4, 26.6], [43.4, 23.5], [49, 23.1], [57, 23.1]]);
const MERE_DEAD = new THREE.Color('#8a7745'), MERE_C = new THREE.Color('#646238'), PLAINS_C = new THREE.Color('#7e9b45'), DUNE_SAND = new THREE.Color('#c9ad72'), DUNE_ROCK = new THREE.Color('#9a6f4c');
const ellD = (x, z, [cx, cz, rx, rz]) => Math.hypot((x - cx) / rx, (z - cz) / rz);
// the oasis's edge: an ellipse pulled into lobes and bays by angle and noise, ragged where grass gives way to sand (Jack: too oval)
function oasisD(x, z) {
  const [cx, cz] = DUNE_OASIS, a = Math.atan2(z - cz, x - cx);
  const w = 1 + .17 * Math.sin(3 * a + 1.3) + .1 * Math.sin(5 * a + .4) + .07 * Math.sin(8 * a + 2.1) + .45 * (fbm(x * .09 + 3, z * .09 + 8) - .5);
  return ellD(x, z, DUNE_OASIS) / w + .22 * (fbm(x * .4 + 11, z * .4 + 5) - .5);
}
function duneHeight(x, z) {
  let h = 1.8 + .9 * fbm(x * .06, z * .06);
  const open = sstep(.9, 1.3, oasisD(x, z)) * sstep(2.5, 5, polyDist(DUNE_ROAD, x, z));
  h += open * 1.1 * Math.pow(Math.max(0, Math.sin(x * .3 + z * .17 + 3.2 * fbm(x * .05 + 4, z * .05))), 2.5);   // dune ridges
  for (const m of DUNE_MESAS) h += 3.6 * sstep(1.05, .8, ellD(x, z, m)) + .4 * sstep(1.4, 1, ellD(x, z, m));
  h = lerp(2.4, h, sstep(5.5, 10, Math.hypot(x - KX, z - KZ)));
  return lerp(-1, h, sstep(.85, 1.35, ellD(x, z, DUNE_POOL)));
}
// Riverbend (stage 6): the river comes in from the east and splits into a north and a south branch; the town on the land between,
// one timber bridge over each branch on a road through the castle
const BEND_RIVERS = [[[57, 9.8], [50.4, 10.5], [46.2, 13.5], [42, 14.7]],
  [[42, 14.7], [35, 15.8], [30, 12.6], [23, 12.6], [16, 13.3], [10.5, 16.5], [-1, 16.5]],
  [[42, 14.7], [44, 22], [42.5, 29], [37, 35], [31, 41], [24, 43.5], [16, 43.5], [9.5, 40.5], [-1, 41]]].map(p => smoothPts(p));
const BEND_ROADS = [[[23, -1], [23, 26]], [[20, 57], [20, 30]]];   // straight through: cells on a bridge or under the castle are skipped
const BEND_BRIDGES = [[23, 1, 0, 1], [20, 55, 0, -1]];   // ray origins and directions, square across each branch
const bendRiverD = (x, z) => Math.min(...BEND_RIVERS.map(p => polyDist(p, x, z)));
function bendHeight(x, z) {
  let h = 2.2 + 1.6 * fbm(x * .06, z * .06);
  h += 3 * (1 - sstep(0, 1, Math.hypot((x - 43.4) / 16.8, (z - 3) / 7.7))) + 2 * (1 - sstep(0, 1, Math.hypot((x - 49) / 14, (z - 54) / 6.3)));
  h = lerp(3 + (h - 3) * .35, h, sstep(6, 11, Math.hypot(x - KX, z - KZ)));
  return lerp(-1.2, h, sstep(1.7, 3.7, bendRiverD(x, z)));
}
// a wobbly ellipse distance (lobes by angle, noise): natural-looking clearings and patches
function blobD(x, z, e, sd) {
  const a = Math.atan2(z - e[1], x - e[0]);
  return ellD(x, z, e) / (1 + .15 * Math.sin(3 * a + sd) + .09 * Math.sin(5 * a + sd * 2.3) + .35 * (fbm(x * .09 + sd, z * .09 + 8) - .5));
}
// Ironcrag (stage 7): deep woods everywhere, the castle in a clearing, a grey iron crag to the north-east (no loose stone anywhere:
// the mine is the answer), a stream in the south-east; trails from the north-west and the east laid as paths
const CRAG_CLEAR = [25.2, 32.9, 11.5, 9.8], CRAG_ROCK = [39.9, 19.6, 8.4, 6];
const CRAG_STREAM = smoothPts([[57, 36.4], [50.4, 37.8], [46.2, 42], [39.2, 42.7], [32.9, 43.4], [29.4, 46.2], [28, 57]]);
const CRAG_ROADS = [smoothPts([[-1, 10.5], [5.6, 11.9], [10.5, 16.1], [14.7, 21], [17.5, 24.5], [20.3, 28], [22, 30.5]]),
  smoothPts([[57, 29.5], [51.5, 30.2], [47.5, 32.5], [42.5, 34.5], [37.8, 35.8], [33.6, 35.4], [29.5, 34.6]])];   // well up from the stream's bank (it used to run to the water's edge)
function cragHeight(x, z) {
  let h = 2.5 + 1.8 * fbm(x * .06, z * .06);
  const d = blobD(x, z, CRAG_ROCK, 2);
  h += 5.2 * (1 - sstep(.25, 1, d)) + 1.2 * Math.max(0, fbm(x * .3, z * .3) - .45) * (1 - sstep(.6, 1, d));   // the crag, broken on top
  h = lerp(3.2 + (h - 3.2) * .3, h, sstep(6, 11, Math.hypot(x - KX / MK, z - KZ / MK)));
  return lerp(-.8, h, sstep(1.1, 2.6, polyDist(CRAG_STREAM, x, z)));
}
// Siegeford (stage 8): a highland valley, a river across the middle with three shallow fords (grassy bars, like Stonebridge's),
// the town on the south bank round a low rise; plenty of stone, a few pines; a gorge road from the west
const FORD_RIVER = smoothPts([[-1, 23.1], [8.4, 21], [15.4, 22.4], [22.4, 21], [29.4, 19.6], [36.4, 21], [42, 20.3], [47.6, 19.6], [51.8, 17.5], [57, 16.8]]);
const FORD_XS = [34.5], FORD_BRIDGE_X = 15, FORD_WALL_ROW = 15;   // one wide ford; the west crossing is a stone bridge (Jack)
const FORD_ROAD = smoothPts([[-1, 42.7], [5.6, 42], [10.5, 41.3], [15.4, 41.6], [21, 42], [24.5, 42.5]]);
const FORD_HILLS = [[9.1, 7.7, 11.9, 7.7, 4], [48.3, 7.7, 10.5, 7, 4], [8.4, 51, 9.8, 6, 3.2], [49, 48.3, 10.5, 7.7, 4], [29.4, 34.5, 7.7, 4.2, 1.2]];
const fordRiverZ = x => { const P = FORD_RIVER; for (let i = 0; i < P.length - 1; i++) if (x >= P[i][0] && x <= P[i + 1][0]) return lerp(P[i][1], P[i + 1][1], (x - P[i][0]) / (P[i + 1][0] - P[i][0])); return x < P[0][0] ? P[0][1] : P[P.length - 1][1]; };
function fordHeight(x, z) {
  let h = 2.2 + 1.8 * fbm(x * .06, z * .06) + Math.max(0, fbm(x * .14 + 9, z * .14 + 3) - .55) * 4;
  for (const [cx, cz, rx, rz, hh] of FORD_HILLS) h += hh * (1 - sstep(0, 1, Math.hypot((x - cx) / rx, (z - cz) / rz)));
  h = lerp(3 + (h - 3) * .35, h, sstep(6, 11, Math.hypot(x - KX / MK, z - KZ / MK)));
  const fd = Math.min(...FORD_XS.map(f => Math.abs(x - f))), ford = sstep(3.8, 2.6, fd), ramp = sstep(7.5, 4, fd);
  const d = polyDist(FORD_RIVER, x, z), river = lerp(-1.3, h, lerp(sstep(2.2, 5, d), sstep(2.4, 10, d), ramp));
  return d < 5 ? Math.max(river, lerp(river, .6 + .06 * vnoise(x * .9, z * .9), ford)) : river;   // .6: above the .45 raiders' routes need
}
// Meadowmere (stage 9): a marsh of pools along a winding river; fields in the marsh grow half as much (the farmhouse is the answer);
// the castle on a dry mound west of the river, woods on a dry rise to the north-west; two causeways (paths): the north one down the
// west bank, the east one over a timber bridge
const MERE_MARSH = [33, 22, 21, 17], MERE_MOUND = [15, 42, 11, 9], MERE_RISE = [9.8, 15.5, 8.4, 7.7];
const MERE_RIVER = smoothPts([[57, 6.3], [49, 8.4], [45.5, 14], [42, 19], [39, 24], [40, 29], [35.5, 33.5], [29.5, 35.5], [26.3, 38.5], [26, 44], [24.5, 50], [23, 57]]);
const MERE_ROADS = [smoothPts([[36, -1], [35.5, 5.6], [32.5, 11], [29, 16], [25.5, 21], [22.5, 27], [19.5, 32], [17, 36.5]]),
  smoothPts([[57, 32], [50.5, 31.5], [44.5, 33], [38, 37], [32, 39.5], [28.5, 40.6]]), [[23.5, 40.6], [19, 41]]];
const MERE_BRIDGE = { ox: 36, oz: 40.6, dx: -1, dz: 0 };
const marshW = (x, z) => 1 - sstep(.75, 1.05, blobD(x, z, MERE_MARSH, 4));
const mereRiverD = (x, z) => polyDist(MERE_RIVER, x, z);
function mereHeight(x, z) {
  let h = 2 + 1.2 * fbm(x * .06, z * .06);
  h += 1.6 * (1 - sstep(.4, 1, blobD(x, z, MERE_MOUND, 6))) + 1.8 * (1 - sstep(.3, 1, blobD(x, z, MERE_RISE, 7)));
  const m = marshW(x, z), far = sstep(2.5, 4, Math.min(...MERE_ROADS.map(p => polyDist(p, x, z)))) * sstep(4, 6, mereRiverD(x, z)) * sstep(2, 4, Math.abs(z - MERE_BRIDGE.oz) + (x > 22 && x < 37 ? 0 : 9));
  h = lerp(h, .95 + .2 * fbm(x * .2, z * .2), m);
  if (m > .5) h = lerp(h, -.5, sstep(.47, .54, fbm(x * .16 + 7, z * .16 + 2)) * far);   // pools
  h = lerp(3 + (h - 3) * .35, h, sstep(5.5, 10, Math.hypot(x - KX / MK, z - KZ / MK)));
  return lerp(-1.1, h, sstep(1.6, 3.4, mereRiverD(x, z)));
}
// Horsefields (stage 10): open plains, two low swells, a stream across the south-west corner; roads from the north, west and east
const PLAINS_STREAM = smoothPts([[-1, 39.2], [8.4, 37.8], [15.4, 42], [22.4, 43.4], [29.4, 44.8], [33.6, 50.4], [36.4, 57]]);
const PLAINS_ROADS = [[[28, -1], [28, 25]], [[-1, 26.6], [12, 27.3], [24.5, 28]], [[57, 26.6], [44, 27.3], [31.5, 28]]];
function plainsHeight(x, z) {
  let h = 2 + 1.1 * fbm(x * .05, z * .05);
  h += 1.5 * (1 - sstep(0, 1, Math.hypot((x - 11.2) / 8.4, (z - 12.6) / 5.6))) + 1.5 * (1 - sstep(0, 1, Math.hypot((x - 44.8) / 9, (z - 44.8) / 6)));
  h = lerp(3 + (h - 3) * .35, h, sstep(6, 11, Math.hypot(x - KX / MK, z - KZ / MK)));
  return lerp(-.8, h, sstep(1, 2.5, polyDist(PLAINS_STREAM, x, z)));
}
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
// Raider Keep (stage 11, an 80 m map): the raiders' keep on a rocky rise at the top behind a dry ditch (open at the gate), two roads
// from its gate through a burned village and dead woods to the town at the bottom; reddish ground in the north, scorched in the middle
// the keep's front is a straight edge with a gate three cells wide (x 38-44, Jack), its middle cell on the road
const KEEP_POLY = [[31, 11], [41, 7], [51, 11], [53, 20], [45.5, 24], [36.5, 24], [29, 20]], KEEP_GATE = [41, 24], KEEP_GATE_W = 6;
const KEEP_DITCH = smoothPts([[22, 23], [31, 28], [41, 29.5], [51, 28], [60, 23]]);
const KEEP_ROADS = [smoothPts([[41, 25.5], [39, 33], [33, 40], [30, 47], [33, 54], [38, 59], [40, 62]]), smoothPts([[41, 25.5], [45, 33], [52, 38], [56, 47], [52, 54], [46, 59], [42, 62]])];
// the burned village: ruined watchtowers like Watchhill's, burnt, a few still on fire (fire: 1)
const KEEP_RUINS = [[25, 40, 1], [28, 36.5], [56, 38, 1], [60, 42], [42.5, 42.5, 1], [46, 46]];
// the raiders' camps either side of the keep, up on its rise (Jack): laid out afresh each game (rollKeepCamps, after the terrain), the
// two sides unalike: only one has a campfire (torches round it, raiders resting by the fire), the other is tents, stores and a parked
// catapult with a torch; banners, weapon racks and target ranges scattered; horsemen and a foot patrol on loose loops round each
let KEEP_CAMPS = [];
// Jack: the same layout every game (a fixed seed), just not mirrored
function rollKeepCamps() {
  let sd = 7; const rnd = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const fireSide = rnd() < .5 ? 0 : 1, ring = [...KEEP_POLY, KEEP_POLY[0]], pick = a => a[(rnd() * a.length) | 0];
  KEEP_CAMPS = [0, 1].map(side => {
    const X0 = side ? 64 : 15, X1 = side ? 78 : 28, used = [], props = [], rest = [], patrol = [];
    const ok = (x, z, r) => x > X0 && x < X1 && z > 2.5 && z < 14 && !inPoly(KEEP_POLY, x, z) && polyDist(ring, x, z) > 3 + r && polyDist(KEEP_DITCH, x, z) > 4 + r
      && slopeAt(x, z) < .9 && used.every(([a, b, rr]) => Math.hypot(x - a, z - b) > r + rr + .6);
    const spot = (r, near, d = 4) => { for (let n = 0; n < 400; n++) {
      const x = near ? near[0] + (rnd() - .5) * 2 * d : lerp(X0, X1, rnd()), z = near ? near[1] + (rnd() - .5) * 2 * d : 2.5 + rnd() * 11.5;
      if (ok(x, z, r)) { used.push([x, z, r]); return [x, z]; } } return null; };
    const put = (t, r, near, d) => { const q = spot(r, near, d); if (q) props.push([t, q[0], q[1], rnd() * 6.3, r]); return q; };
    let fire = null, at;
    if (side === fireSide) {
      fire = spot(1.6); at = fire;
      for (let n = 0, k = 1 + (rnd() < .5); n < k; n++) put('torch', .3, fire, 3.5);
      for (let n = 0, k = 1 + (rnd() < .6); n < k; n++) put('tent', 1.2, fire, 5);
      put('banner', .5, fire, 5); if (rnd() < .6) put('rack', .6, fire, 5); if (rnd() < .5) put('butts', .8, fire, 6);
      for (let n = 0, k = 3 + (rnd() < .5); n < k; n++) { const a = n / k * 6.3 + rnd() * .8, d = 1.5 + rnd() * .4; rest.push([pick(['spear', 'sword', 'archer', 'spear']), 2 + (rnd() < .4), fire[0] + Math.cos(a) * d, fire[1] + Math.sin(a) * d]); }
    } else {
      at = put('tent', 1.2) || [(X0 + X1) / 2, 8];
      for (let n = 0, k = 1 + (rnd() < .6); n < k; n++) put('tent', 1.2, at, 5);
      put('catapult', 1.1, at, 6); put('stores', .6, at, 5); put('torch', .3, at, 4);
      if (rnd() < .7) put('rack', .6, at, 5); if (rnd() < .5) put('banner', .5, at, 6); if (rnd() < .4) put('butts', .8, at, 6);
      for (let n = 0, k = 2 + (rnd() < .5); n < k; n++) { const q = spot(.4, at, 4); if (q) { used.pop(); rest.push([pick(['spear', 'sword', 'xbow']), 2 + (rnd() < .4), q[0], q[1], rnd() * 6.3]); } }
    }
    put('flag', .3, at, 5);
    // loose loops round the camp, each its own way round
    // the horsemen ride wider, out toward the map's side edge and up and down it (Jack)
    const loop = (r, out = 0, xMin = X0 - 2, xMax = X1 + 2, zMax = 16) => { const a0 = rnd() * 6.3, n = 4 + (rnd() < .5), cx = at[0] + (side ? out : -out);
      return Array.from({ length: n }, (_, i) => { const a = a0 + i / n * 6.3 + (rnd() - .5) * .6, d = r * (.7 + rnd() * .5);
        return [clamp(cx + Math.cos(a) * d, xMin, xMax), clamp(at[1] + Math.sin(a) * d * .9, 2, zMax)]; }); };
    const hx0 = side ? X0 : 1.5, hx1 = side ? SIZE - 1.5 : X1;
    patrol.push([pick(['rider', 'lancer']), 2 + (rnd() < .5), loop(10, 6, hx0, hx1, 21)]);
    if (rnd() < .6) patrol.push([pick(['rider', 'lancer']), 2 + (rnd() < .5), loop(8, 8, hx0, hx1, 21)]);
    patrol.push([pick(['spear', 'sword']), 2, loop(3.5)]);
    return { at, fire, props, rest, patrol };
  });
}
const KEEP_RED = new THREE.Color('#7d4d3c'), KEEP_ASH = new THREE.Color('#6b5d45');
function keepHeight(x, z) {
  let h = 2.2 + 1.4 * fbm(x * .05, z * .05);
  h += 4.2 * (1 - sstep(.45, 1.15, blobD(x, z, [41, 15, 19, 12], 3)));
  if (inPoly(KEEP_POLY, x, z)) h = 6.4 + .1 * fbm(x * .3, z * .3);   // the keep's yard, flat
  h = lerp(3 + (h - 3) * .35, h, sstep(6, 11, Math.hypot(x - KX, z - KZ)));
  const dd = polyDist(KEEP_DITCH, x, z), gap = sstep(3.4, 4.6, Math.abs(x - KEEP_GATE[0]));
  return h - 1.7 * (1 - sstep(.8, 2, dd)) * gap;
}
// Warlord's Hold (stage 12, final boss, 80 m): snowy mountains round the north and both sides, the hold on a crag at the top, a river
// across the middle (a stone bridge on the gate's road, frozen crossings where the two mountain passes come down), pines on the slopes
// the gate, the grand bridge and the road all on x 39, the middle of the road's cell (Jack: the road ran a cell right of the door)
const HOLD_POLY = [[28, 4.5], [52, 4.5], [54, 15], [26, 15]], HOLD_GATE = [39, 15];
const HOLD_MTNS = [[14, 12, 20, 16, 1], [66, 12, 20, 16, 2], [6, 52, 11, 23, 3], [74.5, 52, 11, 23, 4]];
const HOLD_RIVER = smoothPts([[-1, 38], [12, 36], [26, 40], [40, 38], [54, 36], [66, 40], [81, 38]]);
// the two mountain passes: down from the side edges to a stone bridge each (x 16 and 64), then in long straight runs to the castle's
// sides (Jack: the diagonal roads laid as zigzags; they crossed the river by land before)
const HOLD_PASSES = [[[-1, 25], [8, 28], [14, 31], [16, 33], [16, 45], [22, 45], [22, 65], [34, 65]], [[81, 25], [72, 28], [66, 31], [64, 33], [64, 45], [58, 45], [58, 65], [44, 65]]];
const HOLD_ROADS = [[[39, 17], [39, 33]], [[39, 43], [39, 60]], ...HOLD_PASSES];
const holdMtn = (x, z) => Math.max(...HOLD_MTNS.map(([cx, cz, rx, rz, sd]) => 1 - sstep(.75, 1.05, blobD(x, z, [cx, cz, rx, rz], sd)))) * sstep(3, 6, Math.min(...HOLD_PASSES.map(p => polyDist(p, x, z))));
const holdOpen = (x, z) => holdMtn(x, z) < .5;
const holdRiverZ = x => { const P = HOLD_RIVER; for (let i = 0; i < P.length - 1; i++) if (x >= P[i][0] && x <= P[i + 1][0]) return lerp(P[i][1], P[i + 1][1], (x - P[i][0]) / (P[i + 1][0] - P[i][0])); return 38; };
function holdHeight(x, z) {
  let h = 2.4 + 1.3 * fbm(x * .05, z * .05);
  h += holdMtn(x, z) * (9 + 12 * fbm(x * .07 + 5, z * .07 + 9));
  h += 3.2 * (1 - sstep(.4, 1.1, blobD(x, z, [40, 9.5, 16, 10], 6)));
  if (inPoly(HOLD_POLY, x, z)) h = 6 + .1 * fbm(x * .3, z * .3);
  // a ramp down from the gate, so its door meets the ground (Jack)
  else if (z > 14.5 && z < 22) h = lerp(h, lerp(6, h, sstep(15.4, 21.5, z)), sstep(3.4, 2.2, Math.abs(x - HOLD_GATE[0])));
  h = lerp(3 + (h - 3) * .35, h, sstep(6, 11, Math.hypot(x - KX, z - KZ)));
  return lerp(-1.3, h, sstep(2.2, 4.6, polyDist(HOLD_RIVER, x, z)));
}
// the boss stages' fixed scenery nobody walks through or builds on: the keep and the burned village's ruins, the hold
// the Warlord's horse guard idling outside the gate (Jack: livelier): tier-3 horse swords, scenery
// the raiders' camps on the far bank (Jack): round a campfire each, some resting by the fire, some on patrol round a loop of points
// (they walk, stop a moment at each corner, walk on); the horse guard outside the gate the same; and a tier-3 archer tower of the
// raiders' by each side bridge. Scenery: the fires and towers are kept clear in sceneryAt; the walkers just walk
const HOLD_CAMPS = [
  { fire: [6.5, 24.5], banner: true, rest: [['spear', 3, 4.4, 25.2], ['archer', 2, 7.6, 26.4], ['sword', 3, 5.6, 25.8]],
    patrol: [['spear', 3, [[2.5, 24.8], [10.5, 27.6], [13, 29.5], [7, 28.6]]], ['sword', 2, [[18, 30.5], [24, 30.5], [24, 28.2], [18.5, 28.2]]]] },
  { fire: [73.5, 24.5], rest: [['spear', 3, 74.8, 23.6], ['archer', 2, 72.2, 25.4], ['sword', 3, 74.4, 25.8]],
    patrol: [['spear', 3, [[77.5, 24.8], [69.5, 27.6], [67, 29.5], [73, 28.6]]], ['sword', 2, [[54.5, 31], [51.5, 31], [51.5, 25.2], [54.5, 25.2]]]] },
  { fire: [46.5, 22.5], rest: [['rider', 3, 45.2, 21.2], ['rider', 3, 47.8, 23.8]],
    patrol: [['rider', 3, [[37.5, 21.5], [43, 21.5], [43, 28], [37.5, 28]]], ['rider', 3, [[43, 28], [37.5, 28], [37.5, 21.5], [43, 21.5]]], ['rider', 3, [[44.8, 19.6], [50, 19.6], [50, 27.2], [44.8, 27.2]]]] }];
const HOLD_TOWERS = [[20, 31], [60, 31]];
const bossCamps = () => MAP === 'hold' ? HOLD_CAMPS : MAP === 'keep' ? KEEP_CAMPS : [];
const campProp = (x, z) => bossCamps().some(c => (c.fire && Math.hypot(x - c.fire[0], z - c.fire[1]) < .9) || (c.props || []).some(([, a, b, , r]) => Math.hypot(x - a, z - b) < (r || .8)));
const sceneryAt = (x, z) => (MAP === 'hold' || MAP === 'keep') && campProp(x, z) ? true : MAP === 'hold' && HOLD_TOWERS.some(([a, b]) => Math.hypot(x - a, z - b) < 1.2) ? true : MAP === 'keep' ? inPoly(KEEP_POLY, x, z) || KEEP_RUINS.some(([a, b]) => Math.hypot(x - a, z - b) < 1.7) : MAP === 'hold' ? inPoly(HOLD_POLY, x, z) : false;
// the maps with ground nobody may walk or build on (Mountain pass's mountains, Greenvale's hills)
const mapOpen = (x, z) => MAP === 'pass' ? passOpen(x, z) : MAP === 'vale' ? valeOpen(x, z) : MAP === 'hold' ? holdOpen(x, z) : true;
function genHeight(x, z) {
  if (MAP === 'pass') return passHeight(x, z);
  if (MAP === 'vale') return valeHeight(x, z);
  if (MAP === 'bridge') return bridgeHeight(x, z);
  if (MAP === 'cross') return crossHeight(x, z);
  if (MAP === 'watch') return watchHeight(x, z);
  if (MAP === 'dune') return duneHeight(x, z);
  if (MAP === 'bend') return bendHeight(x, z);
  if (MAP === 'crag') return cragHeight(x / MK, z / MK);
  if (MAP === 'ford') return fordHeight(x / MK, z / MK);
  if (MAP === 'mere') return mereHeight(x / MK, z / MK);
  if (MAP === 'plains') return plainsHeight(x / MK, z / MK);
  if (MAP === 'keep') return keepHeight(x, z);
  if (MAP === 'hold') return holdHeight(x, z);
  let h = 1.6 + fbm(x * .06, z * .06) * 4.2;
  h += Math.max(0, fbm(x * .14 + 9, z * .14 + 3) - .6) * 16;
  h += Math.max(0, 10 - x) * .35 * fbm(x * .1, z * .1 + 7);
  const dk = Math.hypot(x - KX, z - KZ);                         // open meadow around the castle
  if (MAP === 'isle') {
    // a flat island, gentle banks, hills rising again a few metres beyond the far bank
    const r = isleR(Math.atan2(z - KZ, x - KX)), flat = 3.0 + (h - 3.0) * .4;
    // the ring, plus two rivers flowing out of it to the map's edge (north-east and south-west), never into the island
    let t = Math.abs(dk - r);
    if (dk > r - 1) { if (z < KZ - 3) t = Math.min(t, Math.abs(x - isleOutN(z))); else if (z > KZ + 3) t = Math.min(t, Math.abs(x - isleOutS(z))); }
    let land = dk < r ? flat : lerp(2.6 + (h - 3.0) * .4, h, sstep(r + 4, r + 11, dk));
    land = lerp(1.0, land, sstep(2.3, 6, t));
    return lerp(-1.9, land, sstep(1.3, 2.3, t));
  }
  h = lerp(3.0 + (h - 3.0) * .4, h, sstep(6, 13, dk));
  const rx = meadowRiverX(z);
  return lerp(-1.4, h, sstep(2.2, 7.5, Math.abs(x - rx)));
}
// a stage's map size in cells (default 28: 56 m; the boss stages 40: 80 m); everything sized by it is rebuilt when it changes
// Stages 7-10 are medium maps (Jack): 34 cells (68 m); each was laid out on a 56 m map, so its layout is scaled up by MK: the map's
// own shapes (heights, rivers, roads, woods, rocks, the castle's site, spawns) are worked out at (x / MK, z / MK)
const MED = { crag: 1, ford: 1, mere: 1, plains: 1 };
const MAP_N = { keep: 40, hold: 40, crag: 34, ford: 34, mere: 34, plains: 34 };
var MK = 1;
const scalePts = pts => pts.map(p => [p[0] * MK, p[1] * MK]);
function setMapSize(n) {
  if (n === N) return;
  N = n; SIZE = N * CELL; V = SIZE + 1;
  terrainGrid(); gridLines();
  water.geometry.dispose(); water.geometry = new THREE.PlaneGeometry(SIZE, SIZE).rotateX(-Math.PI / 2).translate(SIZE / 2, 0, SIZE / 2);
  sun.position.set(SIZE / 2 - 36, 38, SIZE / 2 - 16); sun.target.position.set(SIZE / 2, 0, SIZE / 2);
  const e = SIZE * .97; Object.assign(sun.shadow.camera, { left: -e, right: e, top: e, bottom: -e, far: 120 + SIZE }); sun.shadow.camera.updateProjectionMatrix();
  CAM_LIM.hi = SIZE;
}
function genTerrain() {
  for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) { const k = idx(i, j); H[k] = genHeight(i, j); gvar[k] = fbm(i * .21 + 40, j * .21); dvar[k] = fbm(i * .09 + 70, j * .09 + 30); }
  dirt.fill(0); lock.fill(0); road.fill(0); occB = new Array(N * N).fill(null);
}
// ---------- bridges: fixed timber footbridges straight across a river, at any angle ----------
// A bridge runs from (x0, z0) along the unit direction (dx, dz) for L metres; its deck is DECK_W wide. bridgeCell[n] = bridge
// index + 1 for every cell the deck touches (nothing is built there, everyone may path there); units stand on the deck
// (walkY) only inside its strip. Paths step onto and off a bridge only through its end cells, and waypoints on a bridge
// are pulled onto the deck's centre line (bridgeWaypoint), so units walk down the middle.
let bridges = [];
const bridgeCell = new Uint8Array(N_MAX * N_MAX), BRIDGE_RISE = .45, DECK_W = 1.9;
// where each map's bridges cross: a start point and a direction, marched along until the river is crossed
function bridgeRays() {
  if (MAP === 'pass' || MAP === 'vale' || MAP === 'cross' || MAP === 'watch' || MAP === 'dune' || MAP === 'crag' || MAP === 'plains' || MAP === 'keep') return [];
  if (MAP === 'hold') return [{ ox: 39, oz: holdRiverZ(39) - 9, dx: 0, dz: 1, stone: true, grand: true, w: 3.2 }, ...[16, 64].map(x => ({ ox: x, oz: holdRiverZ(x) - 9, dx: 0, dz: 1, stone: true }))];
  if (MAP === 'mere') return [{ ...MERE_BRIDGE, ox: MERE_BRIDGE.ox * MK, oz: MERE_BRIDGE.oz * MK }];
  if (MAP === 'ford') return [{ ox: FORD_BRIDGE_X * MK, oz: (fordRiverZ(FORD_BRIDGE_X) - 10) * MK, dx: 0, dz: 1, stone: true }];
  if (MAP === 'bend') return BEND_BRIDGES.map(([ox, oz, dx, dz]) => ({ ox, oz, dx, dz, w: 3 }));   // Jack: both bridges bigger (3 m decks)
  if (MAP === 'bridge') {                       // the stone bridge, square across the river north of the castle
    const e = .01, sl = (stoneRiverZ(BRIDGE_X + e) - stoneRiverZ(BRIDGE_X - e)) / (2 * e), m = Math.hypot(1, sl), dx = -sl / m, dz = 1 / m;
    return [{ ox: BRIDGE_X - dx * 10, oz: stoneRiverZ(BRIDGE_X) - dz * 10, dx, dz, stone: true }];
  }
  if (MAP === 'isle') return ISLE_BRIDGES.map(deg => { const a = deg * Math.PI / 180, r = isleR(a); return { ox: KX + Math.cos(a) * (r - 7), oz: KZ + Math.sin(a) * (r - 7), dx: Math.cos(a), dz: Math.sin(a) }; });
  // Meadow: square across its river where it passes the castle's row
  const zc = KZ, drx = .6 * Math.cos(zc * .12) + .15 * Math.cos(zc * .05 + 1), m = Math.hypot(1, drx), dx = 1 / m, dz = -drx / m;
  return [{ ox: meadowRiverX(zc) - dx * 10, oz: zc - dz * 10, dx, dz }];
}
function genBridges() {
  bridges.forEach(b => b.g && scene.remove(b.g)); bridges = []; bridgeCell.fill(0);
  for (const ray of bridgeRays()) {
    let sA = -1, sB = -1;
    for (let q = 0; q < 24; q += .2) { const wet = hAt(ray.ox + ray.dx * q, ray.oz + ray.dz * q) < 0; if (wet && sA < 0) sA = q; if (sA >= 0) { if (wet) sB = q; else if (q - sB > 1) break; } }
    if (sA < 0) continue;
    // each end lands on flat ground at the top of its bank, level with the ground beside it, so the deck is only stepped onto
    // at its end and never from a slope beside it
    const flat = q => [0, 1.3, -1.3].every(w => { const x = ray.ox + ray.dx * q - ray.dz * w, z = ray.oz + ray.dz * q + ray.dx * w; return hAt(x, z) > .5 && slopeAt(x, z) < .6; });
    let a = sA - 1.4, c = sB + 1.4;
    while (a > sA - 6 && !flat(a)) a -= .2;
    while (c < sB + 6 && !flat(c)) c += .2;
    a -= .3; c += .3;
    const b = { x0: ray.ox + ray.dx * a, z0: ray.oz + ray.dz * a, dx: ray.dx, dz: ray.dz, L: c - a, ends: new Set(), stone: !!ray.stone, grand: !!ray.grand, w: ray.w };
    b.ex = b.x0 + b.dx * b.L; b.ez = b.z0 + b.dz * b.L;   // its far (here: southern) end
    b.h0 = hAt(b.x0, b.z0) + .05; b.h1 = hAt(b.x0 + b.dx * b.L, b.z0 + b.dz * b.L) + .05;
    b.mx = b.x0 + b.dx * b.L / 2; b.mz = b.z0 + b.dz * b.L / 2;
    bridges.push(b);
    const hw = b.w && !b.grand ? b.w / 2 - .1 : 1.05;   // a wide deck's cells (the grand bridge keeps its old marking)
    for (let u = 0; u <= b.L + 1e-6; u += .2) for (let w = -hw; w <= hw + .01; w += .35) {
      const x = b.x0 + b.dx * u - b.dz * w, z = b.z0 + b.dz * u + b.dx * w; if (x < 0 || z < 0 || x >= SIZE || z >= SIZE) continue;
      const n = cellAt(x, z); bridgeCell[n] = bridges.length; if (u < 1.3 || u > b.L - 1.3) b.ends.add(n);
    }
  }
}
const bridgeT = (b, x, z) => ((x - b.x0) * b.dx + (z - b.z0) * b.dz) / b.L, bridgeW = (b, x, z) => (z - b.z0) * b.dx - (x - b.x0) * b.dz;
const onDeck = (b, x, z) => { const t = bridgeT(b, x, z); return t >= 0 && t <= 1 && Math.abs(bridgeW(b, x, z)) < (b.w || DECK_W) / 2; };
function deckY(b, t) { t = clamp(t, 0, 1); return lerp(b.h0, b.h1, t) + BRIDGE_RISE * Math.sin(Math.PI * t); }
// ground height for a unit: the deck where it stands on one, else the terrain
function walkY(x, z) { const i = bridgeCell[cellAt(x, z)], h = hAt(x, z); if (!i) return h; const b = bridges[i - 1]; return onDeck(b, x, z) ? Math.max(h, deckY(b, bridgeT(b, x, z))) : h; }
// a path waypoint in a bridge cell, pulled onto the deck's centre line
function bridgeWaypoint(n) {
  const x = (n % N + .5) * CELL, z = (((n / N) | 0) + .5) * CELL, i = bridgeCell[n]; if (!i) return { x, z };
  const b = bridges[i - 1], u = clamp(bridgeT(b, x, z), 0, 1) * b.L; return { x: b.x0 + b.dx * u, z: b.z0 + b.dz * u };
}
const nearBridge = (x, z, d) => bridges.some(b => { const t = bridgeT(b, x, z), u = t * b.L; return u > -d && u < b.L + d && Math.abs(bridgeW(b, x, z)) < d + 1; });
function hAt(x, z) {
  x = clamp(x, 0, SIZE); z = clamp(z, 0, SIZE);
  const i = Math.min(Math.floor(x), V - 2), j = Math.min(Math.floor(z), V - 2), fx = x - i, fz = z - j;
  const a = H[idx(i, j)], b = H[idx(i + 1, j)], c = H[idx(i, j + 1)], d = H[idx(i + 1, j + 1)];
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
}
function slopeAt(x, z) { return Math.hypot(hAt(x + .5, z) - hAt(x - .5, z), hAt(x, z + .5) - hAt(x, z - .5)); }
function cellStats(a, b) {
  let mn = 1e9, mx = -1e9;
  for (let j = b * CELL; j <= (b + 1) * CELL; j++) for (let i = a * CELL; i <= (a + 1) * CELL; i++) { const h = H[idx(i, j)]; mn = Math.min(mn, h); mx = Math.max(mx, h); }
  return { mn, spread: mx - mn };
}

const cH = new Float32Array(N_MAX * N_MAX), cS = new Float32Array(N_MAX * N_MAX);
// which cells can reach which (see regions); rebuilt lazily after any build, removal or terrain change
var reg = new Int32Array(N_MAX * N_MAX), regPass = new Uint8Array(N_MAX * N_MAX), regTry = new Int32Array(N_MAX * N_MAX), regionDirty = true;
function cacheCells() {
  regionDirty = true; fieldCache = pass3 = cellOpen = null;
  for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) { const n = b * N + a; cH[n] = hAt((a + .5) * CELL, (b + .5) * CELL); cS[n] = cellStats(a, b).spread; }
  for (let n = 0; n < N * N; n++) if (bridgeCell[n]) { const p = bridgeWaypoint(n); cH[n] = walkY(p.x, p.z); cS[n] = 0; }
}

