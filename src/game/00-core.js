(() => {
const $ = s => document.querySelector(s);
// colour management: colours are written in sRGB, converted to linear for lighting, and the renderer converts back with filmic tone mapping
{ const P = THREE.Color.prototype, sH = P.setHex, sS = P.setStyle, sL = P.setHSL;
  P.setHex = function (h) { sH.call(this, h); return this.convertSRGBToLinear(); };
  P.setStyle = function (v) { sS.call(this, v); return this.convertSRGBToLinear(); };
  P.setHSL = function (h, s2, l) { sL.call(this, h, s2, l); return this.convertSRGBToLinear(); }; }
// the map's size is set per stage (setMapSize: the boss stages are bigger); every buffer is allocated at the largest size, N_MAX
const CELL = 2, N_MAX = 40, V_MAX = N_MAX * CELL + 1;
let N = 28, SIZE = N * CELL, V = SIZE + 1;
const F = 3, TICK = 20;
let KX = 19, KZ = 27;                  // castle site: Meadow cells 8–10, 12–14; River isle 12–14, 12–14 (set per map in startGame)
// MAP: 'meadow' (the original map) or 'isle' (the castle on an island ringed by a river, three fixed bridges); ?map=isle skips the picker
var MAP = (location.search.match(/[?&]map=(meadow|isle|pass|vale|bridge|cross|watch|dune|bend|crag|ford|mere|plains|keep|hold)\b/) || [])[1] || 'vale';
// river isle: the river's centre line wobbles round the castle; ISLE.r is its mean radius in metres
const ISLE = { r: 16.6 }, ISLE_BRIDGES = [-90, 30, 150], ISLE_ROCKS = [-30, 90, 210], MEADOW_BRIDGES = [0];   // Meadow: one bridge east from the castle over its river
const isleOutN = z => 41 + 2.5 * Math.sin(z * .22 + .5), isleOutS = z => 18 + 2.5 * Math.sin(z * .2 + 2);   // the isle's two outflows: centre x by z
const isleR = a => ISLE.r + .9 * Math.sin(3 * a + .6) + .6 * Math.sin(5 * a + 2.1) + .4 * Math.sin(8 * a + 1.3);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const idx = (i, j) => j * V + i;
const cellAt = (x, z) => clamp(Math.floor(z / CELL), 0, N - 1) * N + clamp(Math.floor(x / CELL), 0, N - 1);

// ---------- icons ----------
const ICON = {
  range: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#f3ead2" fill-opacity=".25" stroke="#d9503f" stroke-width="1.5"/><circle cx="8" cy="8" r="2.8" fill="none" stroke="#5b8de0" stroke-width="1.4"/><circle cx="8" cy="8" r="1" fill="#d9503f"/><path d="M8 .6 V4 M8 12 V15.4 M.6 8 H4 M12 8 H15.4" stroke="#c9a03e" stroke-width="1.4" stroke-linecap="round"/></svg>',
  siege: '<svg viewBox="0 0 16 16"><path d="M2 12.2 H13.4" stroke="#6b4423" stroke-width="1.8" stroke-linecap="round"/><path d="M4.4 12 L7.4 6.2 L10.2 12" fill="none" stroke="#8b5a2b" stroke-width="1.5" stroke-linejoin="round"/><path d="M12.6 11.4 L3.6 3.2" stroke="#a87a45" stroke-width="1.5" stroke-linecap="round"/><path d="M2 2.2 C2.4 4.6 4.6 5 5.4 3.6" fill="#6b4423" stroke="#4e3015" stroke-width=".8"/><circle cx="3.3" cy="2.6" r="1.4" fill="#9a958b" stroke="#4d4a44" stroke-width=".7"/><circle cx="4.4" cy="13" r="1.9" fill="#6b4423" stroke="#3a2512" stroke-width=".8"/><circle cx="11" cy="13" r="1.9" fill="#6b4423" stroke="#3a2512" stroke-width=".8"/><circle cx="4.4" cy="13" r=".5" fill="#a9afb6"/><circle cx="11" cy="13" r=".5" fill="#a9afb6"/><path d="M7.4 6.2 L8.4 7" stroke="#a9afb6" stroke-width="1.2"/></svg>',
  rate: '<svg viewBox="0 0 16 16"><path d="M8 1.2 L3.5 9 H7.4 L6.2 14.8 L12.5 6.4 H8.6 L10 1.2 Z" fill="#f0c44a" stroke="#8a6416" stroke-width=".9" stroke-linejoin="round"/></svg>',
  prod: '<svg viewBox="0 0 16 16"><path d="M8 1.5 L9.3 3.2 L11.4 2.6 L11.8 4.8 L13.9 5.6 L13 7.6 L14.3 9.4 L12.3 10.5 L12.2 12.7 L10 12.5 L8.8 14.4 L7.2 12.8 L5 13.3 L4.7 11.1 L2.6 10.2 L3.6 8.2 L2.4 6.3 L4.5 5.4 L4.8 3.2 L7 3.6 Z" fill="#a9b4bd" stroke="#4f5961" stroke-width=".8" stroke-linejoin="round"/><circle cx="8.3" cy="8" r="2.2" fill="#4f5961"/></svg>',
  gold: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="#e3b341" stroke="#8a6416" stroke-width="1.2"/><circle cx="8" cy="8" r="3.4" fill="none" stroke="#8a6416" stroke-width="1"/></svg>',
  wood: '<svg viewBox="0 0 16 16"><path d="M3.6 5 H12.5 V11 H3.6 A2 3 0 0 1 3.6 5 Z" fill="#8b5a2b" stroke="#4e3015"/><path d="M4.5 7 H9.5 M5.5 9.2 H10.5" stroke="#6b4423" stroke-width=".7" stroke-linecap="round"/><ellipse cx="12.5" cy="8" rx="2" ry="3" fill="#d9a86b" stroke="#4e3015"/><ellipse cx="12.5" cy="8" rx="1" ry="1.6" fill="none" stroke="#a87a45" stroke-width=".6"/><circle cx="12.5" cy="8" r=".45" fill="#8b5a2b"/></svg>',
  stone: '<svg viewBox="0 0 16 16"><path d="M1.8 13.4 L3.2 7.4 L6.4 3.4 L10.8 3 L14.2 7.6 L14.6 13.4 Z" fill="#8e897f" stroke="#4d4a44" stroke-width="1" stroke-linejoin="round"/><path d="M3.2 7.4 L6.4 3.4 L10.8 3 L9.2 7.2 Z" fill="#bdb8ad"/><path d="M9.2 7.2 L10.8 3 L14.2 7.6 L14.6 13.4 L9.8 13.4 Z" fill="#6c6861"/><path d="M3.2 7.4 L9.2 7.2 L9.8 13.4 M9.2 7.2 L10.8 3" fill="none" stroke="#4d4a44" stroke-width=".7" stroke-linejoin="round"/></svg>',
  pop: '<svg viewBox="0 0 16 16"><circle cx="8" cy="4.6" r="2.6" fill="#e2cfa8" stroke="#6b5a3e"/><path d="M3 14.5 C3.4 9.6 5.5 8 8 8 C10.5 8 12.6 9.6 13 14.5 Z" fill="#8a6a44" stroke="#4a3622"/></svg>',
  guard: '<svg viewBox="0 0 16 16"><circle cx="8" cy="4.6" r="2.6" fill="#e2cfa8" stroke="#6b5a3e"/><path d="M3 14.5 C3.4 9.6 5.5 8 8 8 C10.5 8 12.6 9.6 13 14.5 Z" fill="#3f63b8" stroke="#1f3570"/></svg>',
  food: '<svg viewBox="0 0 16 16"><path d="M9.4 9.8 L12.6 13" stroke="#efe4cc" stroke-width="2.1" stroke-linecap="round"/><circle cx="13.7" cy="12.4" r="1.25" fill="#efe4cc" stroke="#9c8c6c" stroke-width=".6"/><circle cx="12.3" cy="13.8" r="1.25" fill="#efe4cc" stroke="#9c8c6c" stroke-width=".6"/><path d="M2.6 3.4 C5.4 .9 10.4 2 10.9 6 C11.3 9.2 8.6 11.4 5.6 10.6 C2.7 9.8 .9 5.6 2.6 3.4 Z" fill="#c2702a" stroke="#7a4214" stroke-width="1"/><path d="M4 4.2 C5.3 3.1 7.3 3.2 8.2 4.3" stroke="#eaa868" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>',
  hp: '<svg viewBox="0 0 16 16"><path d="M8 14 C3 10.5 1.5 8.3 1.5 5.8 C1.5 3.7 3.1 2.3 4.9 2.3 C6.3 2.3 7.4 3.1 8 4.3 C8.6 3.1 9.7 2.3 11.1 2.3 C12.9 2.3 14.5 3.7 14.5 5.8 C14.5 8.3 13 10.5 8 14 Z" fill="#d9503f" stroke="#7a2418" stroke-width="1"/><path d="M4.3 5 C4.6 4.2 5.2 3.9 5.8 3.9" fill="none" stroke="#f3a493" stroke-width="1" stroke-linecap="round"/></svg>',
  sword: '<svg viewBox="0 0 16 16"><path d="M13.8 2.2 L12.9 4.9 L6.4 11.4 L4.6 9.6 L11.1 3.1 Z" fill="#cfd4da" stroke="#5d646c" stroke-width=".9" stroke-linejoin="round"/><path d="M3.3 8.3 L7.7 12.7" stroke="#c9a03e" stroke-width="1.8" stroke-linecap="round"/><path d="M5.5 10.5 L2.6 13.4" stroke="#6b4423" stroke-width="1.7" stroke-linecap="round"/><circle cx="2.2" cy="13.8" r="1" fill="#c9a03e"/></svg>',
  home: '<svg viewBox="0 0 16 16"><path d="M3.2 7.5 V14 H12.8 V7.5" fill="#e2cfa8" stroke="#6b5a3e" stroke-width="1"/><path d="M1.5 8 L8 2.3 L14.5 8 Z" fill="#b5532f" stroke="#6b2d18" stroke-width="1" stroke-linejoin="round"/><path d="M6.6 14 V10.4 H9.4 V14" fill="#6b4423" stroke="#4a2e16" stroke-width=".8"/></svg>',
  hammer: '<svg viewBox="0 0 16 16"><defs><linearGradient id="hamG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e7ea"/><stop offset=".45" stop-color="#aeb4bb"/><stop offset="1" stop-color="#6d737a"/></linearGradient></defs><path d="M9.4 6.6 L2.6 13.4" stroke="#4e3015" stroke-width="3.3" stroke-linecap="round"/><path d="M9.4 6.6 L2.6 13.4" stroke="#a87442" stroke-width="2.1" stroke-linecap="round"/><g transform="rotate(45 10.3 5.7)"><ellipse cx="6.9" cy="5.7" rx=".9" ry="1.95" fill="url(#hamG)" stroke="#4f555c" stroke-width=".8"/><rect x="6.9" y="3.75" width="6.8" height="3.9" fill="url(#hamG)"/><path d="M6.9 3.75 H13.7 M6.9 7.65 H13.7" stroke="#4f555c" stroke-width=".8"/><ellipse cx="13.7" cy="5.7" rx=".9" ry="1.95" fill="#c9ced3" stroke="#4f555c" stroke-width=".8"/></g></svg>',
  bow: '<svg viewBox="0 0 16 16"><path d="M4.2 1.8 C11 3.2 13 9 11.6 14.2" fill="none" stroke="#8b5a2b" stroke-width="1.7" stroke-linecap="round"/><path d="M4.2 1.8 L11.6 14.2" stroke="#e8e0cc" stroke-width=".7"/><path d="M2 9.5 L12.5 5.2" stroke="#6b4423" stroke-width="1"/><path d="M12.5 5.2 L10.6 4.9 L11.4 6.6 Z" fill="#a9afb6" stroke="#4f555c" stroke-width=".5"/><path d="M2 9.5 L3.4 10.4 M2 9.5 L2.6 8.1" stroke="#d9503f" stroke-width="1"/></svg>',
  shield: '<svg viewBox="0 0 16 16"><path d="M2.8 2.4 H13.2 V7.6 C13.2 11 10.4 13.2 8 14.4 C5.6 13.2 2.8 11 2.8 7.6 Z" fill="#3f63b8" stroke="#cfd4da" stroke-width="1.2" stroke-linejoin="round"/><path d="M8 3.2 V13.4 M3.6 7 H12.4" stroke="#9fb6e6" stroke-width=".8"/></svg>',
  charm: '<svg viewBox="0 0 16 16"><g fill="#e98aa6" stroke="#9c3d5c" stroke-width=".7"><circle cx="8" cy="4" r="2.4"/><circle cx="11.8" cy="6.8" r="2.4"/><circle cx="10.4" cy="11.3" r="2.4"/><circle cx="5.6" cy="11.3" r="2.4"/><circle cx="4.2" cy="6.8" r="2.4"/></g><circle cx="8" cy="7.9" r="2" fill="#f2c95e" stroke="#a07a2a" stroke-width=".7"/></svg>',
  // a boot striding forward with speed lines behind it: paths make everyone walk faster
  speed: '<svg viewBox="0 0 16 16"><path d="M1.2 5.2 H4.4 M.6 8 H3.8 M1.2 10.8 H4.2" stroke="#e8d9b0" stroke-width="1.1" stroke-linecap="round"/><path d="M7 2.4 H10.6 V8.6 L14 10.2 C14.9 10.6 15 11.4 15 12.4 V13.4 H6.4 Z" fill="#8b5a2b" stroke="#4e3015" stroke-width="1" stroke-linejoin="round"/><path d="M6.4 11.6 H15" stroke="#4e3015" stroke-width="1"/><path d="M7 4.2 H10.6" stroke="#c9a03e" stroke-width="1"/></svg>',
  bowl: '<svg viewBox="0 0 16 16"><path d="M1.8 7.2 H14.2 C14.2 10.8 11.6 13 8 13 C4.4 13 1.8 10.8 1.8 7.2 Z" fill="#8b5a2b" stroke="#4e3015" stroke-width="1" stroke-linejoin="round"/><ellipse cx="8" cy="7.2" rx="6.2" ry="1.3" fill="#3a2414" stroke="#4e3015" stroke-width=".8"/><path d="M5.6 14.2 H10.4" stroke="#4e3015" stroke-width="1.2" stroke-linecap="round"/></svg>',
};
document.querySelectorAll('[data-ico]').forEach(el => el.innerHTML = ICON[el.dataset.ico]);
const RES_KEYS = ['gold', 'wood', 'stone', 'food'];
const costHTML = c => RES_KEYS.filter(k => c[k]).map(k => `<span class="cost"><span class="ico">${ICON[k]}</span>${c[k]}</span>`).join('') || 'free';

// ---------- game definitions ----------
// archer towers are drawn smaller than their original models; posts and shot heights scale with them
const TOWER_K = [.8, .8, .72];
const DEF = {
  house:  { size: 1, name: 'House', maxdh: 1.4, hp: [100, 150, 220], cost: { wood: 15 },
            up: [{ wood: 25, gold: 20 }, { wood: 30, stone: 20, gold: 40 }], gold: [2, 4, 6], residents: [2, 3, 4],
            tiers: ['Hovel', 'Cottage', 'Townhouse'], key: '1' },
  farm:   { size: 2, name: 'Fields', maxdh: 1.6, plot: true, field: true, hp: [90, 130, 180], cost: { wood: 15 },
            up: [{ wood: 20, gold: 20 }, { wood: 30, stone: 15, gold: 35 }], food: [3, 5, 8], workers: [1, 1, 2],
            tiers: ['Plot', 'Croft', 'Manor farm'], key: '2' },
  lodge:  { size: 2, name: 'Lumber', maxdh: 1.8, hp: [120, 170, 240], cost: { gold: 20 },
            up: [{ gold: 45, stone: 10 }, { gold: 75, stone: 25 }], reach: 14, workers: [2, 3, 4],
            tiers: ['Lumber shack', 'Lumber camp', 'Lumber yard'], key: '3' },
  quarry: { size: 2, name: 'Quarry', maxdh: 2.2, hp: [140, 200, 280], cost: { gold: 25, wood: 10 },
            up: [{ gold: 45, wood: 20 }, { gold: 75, wood: 30 }], reach: 16, workers: [2, 3, 4],
            tiers: ['Stone pit', 'Quarry', "Masons' yard"], key: '4' },
  tower:  { size: 1, name: 'Archers', maxdh: 1.8, hp: [180, 280, 400], cost: { wood: 15, gold: 10 }, back: true,
            up: [{ wood: 30, gold: 30 }, { stone: 40, gold: 60 }], range: [11, 13, 15], dmg: [7, 9, 12], rate: [1.2, 1.0, .8],
            archers: [2, 2, 2], shootY: [3.4, 3.8, 5.4], tiers: ['Lookout', 'Watchtower', 'Stone tower'], key: '5' },
  barracks: { size: 2, name: 'Barracks', maxdh: 1.8, hp: [220, 320, 450], cost: { wood: 25, gold: 20 },
            up: [{ wood: 30, gold: 35, stone: 10 }, { stone: 40, gold: 60 }], soldiers: [3, 3, 3],
            tiers: ['Muster hut', 'Barracks', 'Garrison'], key: '8' },
  // the other defence picks: a ranged tower that shoots faster but closer, and siege engines that need two crew (a loader and a
  // gunner) to work at all: the ballista's bolt runs through every raider in its line, the catapult's stone hits all round where
  // it lands (not too close: minRange) and the engine can be moved, slowly, to another tile (Move on its card)
  // stables: like the barracks, but its soldiers ride (fast, tough, dear); they gear up in the armoury hut at the front left
  stables: { size: 2, name: 'Stables', maxdh: 1.8, hp: [300, 430, 620], cost: { wood: 30, gold: 30 }, cavalry: true,
            up: [{ wood: 35, gold: 45, stone: 10 }, { stone: 45, gold: 75 }], soldiers: [2, 3, 3],
            tiers: ['Horse shed', 'Stables', 'Royal stables'] },
  crossbow: { size: 1, name: 'Crossbow', maxdh: 1.8, hp: [200, 300, 430], cost: { wood: 20, gold: 15 }, back: true, weapon: 'crossbow',
            up: [{ wood: 35, gold: 35 }, { stone: 45, gold: 65 }], range: [8, 9, 10], dmg: [6, 8, 10], rate: [.55, .48, .4],
            archers: [2, 2, 2], shootY: [2.4, 2.6, 2.85], tiers: ['Bolt tower', 'Crossbow tower', 'Arbalest tower'] },
  ballista: { size: 1, name: 'Ballista', maxdh: 1.8, hp: [170, 250, 350], cost: { wood: 30, gold: 25 }, back: true,
            up: [{ wood: 40, gold: 45 }, { stone: 50, gold: 80 }], range: [14, 16, 18], dmg: [30, 42, 58], rate: [3.2, 2.9, 2.6], crew: [2, 2, 2], splash: [1.2, 1.4, 1.7],
            tiers: ['Scorpion', 'Ballista', 'Great ballista'] },
  catapult: { size: 1, name: 'Catapult', maxdh: 1.4, hp: [150, 220, 320], cost: { wood: 40, gold: 30 }, noRoad: true, movable: true, noPlinth: true,
            up: [{ wood: 50, gold: 50 }, { wood: 40, stone: 40, gold: 90 }], range: [15, 17, 20], minRange: 4, dmg: [28, 38, 52], splash: [1.6, 1.9, 2.3],
            rate: [5.5, 5, 4.5], crew: [2, 2, 2], tiers: ['Catapult', 'Mangonel', 'Trebuchet'] },
  wall:   { size: 1, name: 'Wall', maxdh: 1.8, falloff: 1.5, hp: [200, 350, 500], cost: { wood: 5, gold: 2 }, noRoad: true, paint: true,
            up: [{ stone: 6, gold: 3 }, { stone: 10, gold: 10 }], tiers: ['Palisade', 'Stone wall', 'Battlement'], key: '6' },
  gate:   { size: 1, name: 'Gate', maxdh: 1.6, falloff: 1.5, hp: [250, 400, 600], cost: { wood: 15, gold: 10 }, noRoad: true,
            up: [{ stone: 15, gold: 20 }, { stone: 25, gold: 35 }], tiers: ['Timber gate', 'Stone gate', 'Gatehouse'], key: '7' },
  castle: { size: 3, name: 'Castle', maxdh: 2.6, hp: [900, 1200, 1600], cost: {}, gold: [3, 5, 7],
            up: [{ stone: 60, wood: 40, gold: 70 }, { stone: 100, gold: 100 }], range: [13, 15, 17], dmg: [11, 15, 20], rate: [1.3, 1.15, 1.0],
            archers: [4, 4, 5], shootY: [3.2, 4.6, 5.2], residents: [3, 3, 3], tiers: ['Palisade fort', 'Stone keep', 'Castle'] },
  market: { size: 2, name: 'Market', maxdh: 1.6, hp: [110, 160, 230], cost: { wood: 20, gold: 15 },
            up: [{ wood: 25, gold: 30 }, { stone: 25, gold: 50 }], tiers: ['Market stall', 'Market', 'Market hall'], key: '9' },
  // the other economy picks (one of each pair before a game): a grove grown on its own plot, a mine dug down into its own ground,
  // a yard of animals; none of them needs forest or rock nearby
  forester: { size: 3, name: 'Forester', maxdh: 1.6, plot: true, hp: [100, 140, 200], cost: { gold: 30, wood: 5 },
            up: [{ gold: 55, stone: 10 }, { gold: 85, stone: 25 }], workers: [1, 2, 3], grove: [5, 7, 8], grow: [32, 27, 22], chop: [5, 4.5, 4],
            tiers: ["Forester's hut", 'Coppice', 'Tree farm'] },
  mine:   { size: 2, name: 'Mine', maxdh: 2.6, hp: [160, 230, 320], cost: { gold: 30, wood: 20 },
            up: [{ gold: 55, wood: 25 }, { gold: 85, wood: 35, stone: 10 }], workers: [1, 2, 3], dig: [9, 8, 7],
            tiers: ['Pit shaft', 'Mine', 'Deep mine'] },
  farmhouse: { size: 2, name: 'Farmhouse', maxdh: 1.6, plot: true, field: true, hp: [100, 150, 210], cost: { wood: 25, gold: 10 },
            up: [{ wood: 30, gold: 25 }, { wood: 35, stone: 15, gold: 40 }], food: [4, 7, 11], workers: [1, 2, 2],
            tiers: ['Hen yard', 'Smallholding', 'Farmstead'] },
  well:    { size: 1, name: 'Well', decor: true, maxdh: 1.3, falloff: 1.2, hp: [80], cost: { stone: 5 }, tiers: ['Well'], noRoad: true },
  torch:   { size: 1, name: 'Torch', decor: true, maxdh: 1.6, falloff: 1, hp: [40], cost: { wood: 2 }, tiers: ['Torch post'], noRoad: true },
  flowers: { size: 1, name: 'Flowers', decor: true, maxdh: 1.2, falloff: 1, hp: [40], cost: { gold: 3 }, tiers: ['Flowers'], noRoad: true },
  banner:  { size: 1, name: 'Banner', decor: true, maxdh: 1.4, falloff: 1, hp: [60], cost: { wood: 4, gold: 8 }, tiers: ['Garrison banner'], noRoad: true },
  campfire: { size: 1, name: 'Campfire', decor: true, maxdh: 1.2, falloff: 1, hp: [40], cost: { wood: 4 }, tiers: ['Campfire'], noRoad: true },
  rack:    { size: 1, name: 'Weapon rack', decor: true, maxdh: 1.3, falloff: 1, hp: [60], cost: { wood: 6, gold: 4 }, tiers: ['Weapon rack'], noRoad: true },
  butts:   { size: 1, name: 'Target range', decor: true, maxdh: 1.3, falloff: 1, hp: [60], cost: { wood: 6, gold: 6 }, tiers: ['Archery butts'], noRoad: true },
  stores:  { size: 1, name: 'Siege stores', decor: true, maxdh: 1.3, falloff: 1, hp: [80], cost: { wood: 8, gold: 6 }, tiers: ['Bolts and shot'], noRoad: true },
  statue:  { size: 1, name: 'Statue', decor: true, maxdh: 1.2, falloff: 1.2, hp: [150], cost: { stone: 12, gold: 10 }, tiers: ['Statue'], noRoad: true },
};
// var: star upgrades (Granary, Carts) change them for a campaign game (applyUpgrades)
var MEAL = 20, LUMBER_LOAD = 2;
// market trades: give 10 of one thing for n of another, n + 2 per market tier; rows of two: buy with gold (left), sell for gold (right)
const TRADES = [['wood', 4, 4], ['stone', 2, 6], ['food', 6, 2]].flatMap(([r, buy, sell]) => [
  { give: 'gold', get: r, n: [buy, buy + 2, buy + 4] }, { give: r, get: 'gold', n: [sell, sell + 2, sell + 4] }]);
DEF.castle.food = [3, 4, 5];
DEF.tower.shootY = DEF.tower.shootY.map((y, i) => y * TOWER_K[i]);
const BUILD_T = { butts: 4, stores: 4, banner: 4, campfire: 3, rack: 4, stables: 18, crossbow: 14, ballista: 16, catapult: 18, forester: 12, mine: 16, farmhouse: 12, market: 12, house: 10, farm: 10, lodge: 12, quarry: 14, tower: 14, barracks: 14, wall: 3, gate: 8, castle: 24, well: 5, torch: 3, flowers: 3, statue: 8 };
for (const t in BUILD_T) DEF[t].build = BUILD_T[t];
DEF.well.charm = .25; DEF.torch.charm = .1; DEF.flowers.charm = .15; DEF.statue.charm = .35; DEF.banner.charm = .2; DEF.campfire.charm = .15; DEF.rack.charm = .12; DEF.butts.charm = .1; DEF.stores.charm = .1;
const PATH_COST = { gold: 1 }, PATH_SPEED = 1.6, PATH_CHARM = .02, CHARM_R = 8, WALK = { farm: 1, forester: 1, farmhouse: 1, torch: 1, flowers: 1 };
const CATS = { eco: ['house', 'farm', 'farmhouse', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'stables', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'banner'] };
const WALLY = { wall: 1, gate: 1 };   // walls join only walls and gates
// each stage's waves (MAP_RULES): how many of each raider kind come, by tier ([tier 1, tier 2, tier 3]); spearmen are the basic
// raider, the rest join wave by wave, tiers climb
// the bonus stages (Jack: the old free-play maps, made very hard, after the campaign; Hard only, a crown and no stars):
// 13 Scorched Meadow (drought: no trees, hardly a rock), 14 Blighted Isle (crop blight: fields fail), 15 Frozen Pass (deep winter)
// `plainMap` is set while the title's showcase builds them: their twisted look (Jack: the menu shows the bonus stages as they now
// are) but none of the campaign's cards, upgrades, achievements or hard mode
// `greenLook`: the showcase's lush green version of a bonus map (its old look, Jack: the prettier one), no twists at all
var plainMap = false, greenLook = false;
const bonusOn = () => !greenLook && !!(CAMP_MAPS[MAP] && CAMP_MAPS[MAP].bonus);
const MAP_RULES = {
  // Scorched Meadow: five nights from any side (the river is dry, no bridge to hold); little to start with and nothing to gather
  meadow: { waves: [{ spear: [8], sword: [3], archer: [3] }, { spear: [8, 3], sword: [4, 1], archer: [3, 1], lancer: [2] },
                    { spear: [6, 5], sword: [4, 3], archer: [4, 2], xbow: [3], lancer: [3], ballista: [1] },
                    { spear: [5, 6, 2], sword: [3, 4, 2], archer: [4, 3], xbow: [3, 1], lancer: [3, 2], rider: [2, 1], ram: [1], catapult: [1] },
                    { spear: [4, 8, 4], sword: [3, 5, 3], archer: [3, 4, 2], xbow: [3, 3], lancer: [3, 3, 1], rider: [2, 3, 2], ram: [0, 1], catapult: [0, 1], ballista: [0, 1] }],
            day: [300, 120, 120, 120, 120], spawnGap: .9, res: { gold: 90, wood: 40, stone: 10, food: 30 } },
  // Blighted Isle: five nights over the three bridges after a 7-minute first day (Jack: it was six after eight); fields hardly grow (food from farmhouses and the market)
  isle: { waves: [{ spear: [8, 2], sword: [3], archer: [3] }, { spear: [8, 4], sword: [4, 2], archer: [3, 2], xbow: [2] },
                  { spear: [6, 6], sword: [4, 3], archer: [4, 2], xbow: [3], lancer: [3], ballista: [1] },
                  { spear: [4, 8, 4], sword: [3, 5, 3], archer: [3, 4, 2], xbow: [3, 3], lancer: [3, 3], rider: [2, 3, 1], catapult: [1], ram: [0, 1], ballista: [0, 1] },
                  { spear: [3, 8, 6], sword: [2, 5, 5], archer: [3, 4, 3], xbow: [2, 3, 3], lancer: [3, 3, 2], rider: [2, 3, 3], catapult: [0, 1, 1], ram: [0, 1, 1], ballista: [0, 1, 1] }],
          day: [300, 120, 120, 120, 120], spawnGap: .85, res: { gold: 70, wood: 50, stone: 0, food: 20 } },
  // Frozen Pass (was Mountain pass): one day to prepare (10 minutes in deep winter, it was 15), then two huge nights
  pass: { waves: [{ spear: [30, 6], sword: [12, 4], archer: [10, 2], xbow: [4], lancer: [1], ram: [1] },
                  { spear: [10, 26, 10], sword: [4, 12, 8], archer: [4, 10, 6], xbow: [0, 4, 2], lancer: [0, 1], rider: [0, 0, 1], ballista: [0, 1], catapult: [0, 1] }],
          day: [420, 120], spawnGap: .5, res: { gold: 70, wood: 60, stone: 0, food: 40 } },
  // Greenvale, the campaign's first stop and its tutorial: three short nights of tier-1 spearmen and archers, from the north-east
  vale: { waves: [{ spear: [4] }, { spear: [6], archer: [2] }, { spear: [8], archer: [3] }], day: [180, 120, 120], spawnGap: 1.6,
          res: { gold: 60, wood: 45, stone: 0, food: 30 } },
  // Stonebridge (stage 2): raiders from the north over the stone bridge; from night 3 some come by the ford upstream
  // three nights after a 3-minute first day (Jack)
  bridge: { waves: [{ spear: [5] }, { spear: [6], sword: [3] }, { spear: [10], sword: [6], archer: [3] }],   // no ram yet (Jack: later stages)
            day: [180, 120, 120], spawnGap: 1.4, res: { gold: 60, wood: 45, stone: 0, food: 30 } },
  // Market Cross (stage 3): down the north road, from night 3 along the east road too; horsemen on nights 3 and 4 (Jack: more horses)
  cross: { waves: [{ spear: [7] },
                  { spear: [7], sword: [4] },
                  { spear: [7], sword: [5], archer: [3], lancer: [3] },
                  { spear: [10], sword: [6], archer: [5], lancer: [5], rider: [2] }],
           day: [240, 120, 120, 120], spawnGap: 1.3, res: { gold: 60, wood: 45, stone: 0, food: 30 } },
  // Watchhill (stage 4): five nights up the dry gully from the east, from night 3 down the ridge track from the north too; a raider ballista on night 5 (no ram: Jack)
  // four nights after a 4-minute first day (Jack)
  watch: { waves: [{ spear: [7], archer: [2] },
                  { spear: [9], sword: [4], archer: [2] },
                  { spear: [9, 2], sword: [5, 1], archer: [4], lancer: [3], rider: [2] },
                  { spear: [10, 4], sword: [6, 2], archer: [5, 1], xbow: [2], lancer: [5], rider: [2], ballista: [1] }],
           day: [240, 120, 120, 120], spawnGap: 1.2, res: { gold: 50, wood: 30, stone: 0, food: 30 } },
  // Dunewell (stage 5): over the dunes from the south, from night 3 along the caravan road from the east too
  dune: { waves: [{ spear: [7], archer: [4] },
                 { spear: [10], sword: [5], archer: [3] },
                 { spear: [7, 2], sword: [5], archer: [4], lancer: [5], ballista: [1] },
                 { spear: [8, 4], sword: [5, 3], archer: [5, 1], xbow: [2], lancer: [4], rider: [4], ballista: [1] },
                 { spear: [8, 5], sword: [5, 4], archer: [5, 3], xbow: [4], lancer: [5], rider: [4], ballista: [2] }],
          day: [240, 120, 120, 120, 120], spawnGap: 1.1, res: { gold: 50, wood: 30, stone: 0, food: 30 } },
  // Riverbend (stage 6): over the north bridge, from night 3 over the south bridge too; raider siege from night 3 (Jack: more siege on stages 5–6)
  bend: { waves: [{ spear: [7], sword: [2], archer: [4] },
                 { spear: [10], sword: [5], archer: [3], xbow: [2] },
                 { spear: [7, 4], sword: [5, 1], archer: [4], xbow: [4], lancer: [3], ballista: [1] },
                 { spear: [8, 5], sword: [5, 3], archer: [5, 1], xbow: [4, 1], lancer: [4], rider: [4], ram: [1], ballista: [1] },
                 { spear: [8, 6], sword: [5, 4, 1], archer: [5, 3], xbow: [4, 3], lancer: [5], rider: [4, 1], ram: [1], ballista: [2] }],
          day: [240, 120, 120, 120, 120], spawnGap: 1.0, res: { gold: 50, wood: 30, stone: 0, food: 30 } },
  // stages 7–10: a 7-minute first day (Jack) and waves about 30% bigger to match
  // Ironcrag (stage 7, tier 3 opens): down the forest trail from the north-west, from night 3 along the stream trail from the east too
  crag: { waves: [{ spear: [11, 4], sword: [5], archer: [5] },
                 { spear: [11, 5], sword: [7, 1], archer: [5, 1], xbow: [4] },
                 { spear: [10, 7], sword: [7, 4], archer: [7, 1], xbow: [5], lancer: [5, 1] },
                 { spear: [7, 8, 2], sword: [6, 6, 1], archer: [7, 4], xbow: [6, 1], lancer: [6, 1], rider: [4, 1], ram: [2] },
                 { spear: [7, 11, 4], sword: [6, 7, 4], archer: [7, 6], xbow: [6, 4], lancer: [6, 4], rider: [4, 4], ram: [0, 2], ballista: [2] }],
          day: [300, 120, 120, 120, 120], spawnGap: .95, res: { gold: 50, wood: 30, stone: 0, food: 30 } },
  // Siegeford (stage 8): across the three fords from the north edge, from night 3 along the gorge road from the west too; raider siege engines
  ford: { waves: [{ spear: [11, 4], sword: [5, 1], archer: [5] },
                 { spear: [10, 5], sword: [7, 4], archer: [5, 1], xbow: [4], lancer: [4] },
                 { spear: [8, 7], sword: [5, 5], archer: [7, 4], xbow: [5], lancer: [5], ballista: [2] },
                 { spear: [7, 8, 4], sword: [6, 6, 2], archer: [7, 4], xbow: [6, 1], lancer: [6, 1], rider: [4, 1], catapult: [2], ram: [2] },
                 { spear: [7, 11, 6], sword: [6, 7, 4], archer: [7, 6], xbow: [6, 4, 1], lancer: [6, 4], rider: [4, 4], catapult: [2, 2], ballista: [0, 2], ram: [0, 2] }],
          day: [300, 120, 120, 120, 120], spawnGap: .9, res: { gold: 50, wood: 30, stone: 0, food: 30 } },
  // Meadowmere (stage 9): down the north causeway, from night 3 along the east causeway and over its bridge too
  mere: { waves: [{ spear: [11, 5], sword: [5, 2], archer: [5, 1] },
                 { spear: [10, 7], sword: [5, 4], archer: [5, 4], xbow: [4], lancer: [4, 1] },
                 { spear: [8, 8, 2], sword: [5, 5, 1], archer: [7, 4], xbow: [5, 1], lancer: [5, 1], ballista: [2] },
                 { spear: [7, 11, 4], sword: [6, 7, 1], archer: [7, 6], xbow: [6, 4], lancer: [6, 4], rider: [4, 1], catapult: [2], ram: [2] },
                 { spear: [7, 11, 7], sword: [4, 7, 6], archer: [6, 7, 2], xbow: [6, 4, 1], lancer: [6, 4, 1], rider: [4, 4], catapult: [0, 2], ballista: [0, 2], ram: [0, 2] }],
          day: [300, 120, 120, 120, 120], spawnGap: .85, res: { gold: 50, wood: 30, stone: 0, food: 30 } },
  // Horsefields (stage 10): open on three sides, horsemen in numbers: the north road, from night 2 the west, from night 3 the east too
  plains: { waves: [{ spear: [11, 4], sword: [4, 1], archer: [4], lancer: [5], rider: [1] },
                   { spear: [11, 5], sword: [5, 4], archer: [5, 1], lancer: [7, 1], rider: [4] },
                   { spear: [8, 7], sword: [5, 5], archer: [5, 4], xbow: [4], lancer: [7, 4], rider: [5, 1] },
                   { spear: [7, 8, 4], sword: [4, 7, 2], archer: [6, 6], xbow: [4, 1], lancer: [7, 6], rider: [6, 4, 1], ram: [2], ballista: [2] },
                   { spear: [7, 11, 6], sword: [4, 7, 4], archer: [6, 6, 1], xbow: [4, 4], lancer: [7, 6, 4], rider: [6, 5, 4], catapult: [0, 2], ram: [0, 2] }],
            day: [300, 120, 120, 120, 120], spawnGap: .8, res: { gold: 50, wood: 30, stone: 0, food: 30 } },
  // Raider Keep (stage 11, boss, an 80 m map): seven nights after a 10-minute first day (Jack); round both sides of the keep and out of its gate;
  // the Raider Chief at the tail of night 7
  keep: { waves: [{ spear: [11, 5], sword: [5, 3], archer: [5, 1], lancer: [4] },
                 { spear: [10, 8], sword: [5, 4], archer: [5, 3], xbow: [4, 1], lancer: [4, 1], rider: [3] },
                 { spear: [8, 9, 3], sword: [5, 5, 1], archer: [5, 4], xbow: [4, 3], lancer: [5, 3], rider: [3, 1], ram: [2], ballista: [2] },
                 { spear: [7, 11, 4], sword: [4, 7, 3], archer: [6, 6, 1], xbow: [4, 4], lancer: [6, 4], rider: [4, 3], catapult: [2], ram: [0, 2], ballista: [0, 2] },
                 { spear: [6, 11, 7], sword: [4, 7, 6], archer: [4, 6, 4], xbow: [4, 4, 3], lancer: [6, 4, 3], rider: [4, 4, 3], catapult: [0, 2], ram: [0, 2], ballista: [0, 0, 2] },
                 { spear: [5, 12, 9], sword: [3, 8, 8], archer: [5, 6, 6], xbow: [3, 5, 5], lancer: [4, 4, 4], rider: [3, 4, 4], catapult: [0, 2, 2], ram: [0, 2, 2], ballista: [0, 2, 2] },
                 { spear: [3, 12, 12], sword: [3, 8, 9], archer: [3, 6, 8], xbow: [3, 5, 6], lancer: [3, 4, 6], rider: [3, 4, 6], catapult: [0, 2, 2], ram: [0, 2, 2], ballista: [0, 2, 2], chief: [0, 0, 1] }],
          day: [420, 120, 120, 120, 120, 120, 120], spawnGap: .8, res: { gold: 50, wood: 30, stone: 0, food: 30 } },
  // Warlord's Hold (stage 12, final boss, 80 m): out of the hold's gate, from night 3 the west pass, from night 4 the east pass;
  // seven nights after a 10-minute first day (Jack); the Warlord and his mounted guard (tier-3 horse swords) on night 7
  hold: { waves: [{ spear: [10, 7], sword: [5, 4], archer: [5, 3], xbow: [3], lancer: [4, 1] },
                 { spear: [11, 9], sword: [5, 5], archer: [5, 4], xbow: [4, 2], lancer: [5, 1], rider: [3, 1], ram: [2] },
                 { spear: [8, 10, 4], sword: [5, 7, 3], archer: [5, 5, 1], xbow: [4, 4], lancer: [5, 4], rider: [4, 3], ballista: [2], catapult: [2] },
                 { spear: [7, 11, 6], sword: [4, 7, 4], archer: [6, 6, 3], xbow: [4, 4, 2], lancer: [6, 4, 1], rider: [4, 4, 1], catapult: [0, 2], ram: [0, 2], ballista: [0, 2] },
                 { spear: [6, 11, 8], sword: [4, 8, 7], archer: [4, 7, 4], xbow: [4, 4, 3], lancer: [6, 6, 3], rider: [3, 4, 3], catapult: [0, 2, 2], ram: [0, 0, 2], ballista: [0, 0, 2] },
                 { spear: [5, 12, 12], sword: [3, 9, 9], archer: [5, 8, 6], xbow: [3, 5, 5], lancer: [4, 6, 4], rider: [3, 4, 4], catapult: [0, 2, 2], ram: [0, 2, 2], ballista: [0, 2, 2] },
                 { spear: [3, 12, 15], sword: [3, 9, 11], archer: [3, 8, 8], xbow: [3, 4, 6], lancer: [3, 6, 6], rider: [3, 4, 12], catapult: [0, 2, 4], ram: [0, 2, 2], ballista: [0, 2, 2], warlord: [0, 0, 1] }],
          day: [420, 120, 120, 120, 120, 120, 120], spawnGap: .75, res: { gold: 50, wood: 30, stone: 0, food: 30 } },
};
// a stage's own goals (Jack), listed on its details and the summary and counted with the usual three for the stars;
// done() is read during play (a log line when met) and at the end. Built counts are ever finished (stats.made), not still standing
var guideDone = false, goalsMet = {};
const made = t => (stats.made && stats.made[t]) || 0;
const upTo = (t, n) => buildings.some(B => B.type === t && !B.dead && B.tier >= n);
// how many of a type stand finished with a decor boost on them (the target range for crossbows, siege stores for catapults)
// each campaign stage's two goals (Jack): a win is one star, each goal met one more. [text, check, end]: a goal marked end is
// only judged when the game ends (no buildings lost); the others are met for good the moment they come true (goalTick)
// measured: two tier-1 foresters fell about 12 trees a minute, two tier-1 mines dig about 11.5 stone (Dunewell has ~13 min of daylight, Ironwood ~15)
// boosted kills, measured in a simulated stage: 4 boosted crossbows about 49 kills by Riverbend's night 4, 2 about 35; 4 boosted catapults about 45 by Siegeford's night 3
const GOAL_N = { felled: 100, mined: 120, folk: 40, xbowKills: 40, cataKills: 50 };
const STAGE_GOALS = {
  vale: [['Follow the tutorial', () => guideDone || (GUIDE.length > 0 && GUIDE.every(S => S.tool === 'select' || made(S.tool) >= 1))],   // skipped but its buildings built still counts (Jack)
    ['Build 1 quarry', () => made('quarry') >= 1]],
  bridge: [['Build 1 barracks', () => made('barracks') >= 1], ['Build 2 gates', () => made('gate') >= 2]],
  cross: [['Build 1 market', () => made('market') >= 1], ['Upgrade 1 building to tier 2', () => stats.upgrades >= 1]],
  watch: [['Build 2 ballistas', () => made('ballista') >= 2], ['Upgrade 1 ballista to tier 2', () => upTo('ballista', 2)]],
  dune: [['Build 2 foresters', () => made('forester') >= 2], [`Fell ${GOAL_N.felled} forester trees`, () => stats.felled >= GOAL_N.felled]],
  bend: [['Build 2 crossbows', () => made('crossbow') >= 2], [`Boosted crossbows slay ${GOAL_N.xbowKills} raiders`, () => (stats.boostKills.crossbow || 0) >= GOAL_N.xbowKills]],
  crag: [['Build 2 mines', () => made('mine') >= 2], [`Mine ${GOAL_N.mined} stones`, () => stats.mined >= GOAL_N.mined]],
  ford: [['Build 2 catapults', () => made('catapult') >= 2], [`Boosted catapults slay ${GOAL_N.cataKills} raiders`, () => (stats.boostKills.catapult || 0) >= GOAL_N.cataKills]],
  mere: [['Build 2 farmhouses', () => made('farmhouse') >= 2], ['Upgrade 1 farmhouse to tier 3', () => upTo('farmhouse', 3)]],
  plains: [['Build 2 stables', () => made('stables') >= 2], ['Upgrade 1 stables to tier 3', () => upTo('stables', 3)]],
  keep: [['Upgrade to Castle', () => upTo('castle', 3)], [`Reach ${GOAL_N.folk} villagers`, () => townsfolk().length >= GOAL_N.folk]],
  hold: [['Upgrade to Castle', () => upTo('castle', 3)], [`Reach ${GOAL_N.folk} villagers`, () => townsfolk().length >= GOAL_N.folk]],
};
const stageGoals = m => STAGE_GOALS[m] || [];
const goalOk = ([t, ok]) => !!goalsMet[t] || !!ok();
function goalTick() {
  if (gameOver) return;
  achMax('vill', townsfolk().length);
  // hard mode has no goals: no tick, log line or star sound (Jack)
  if (!hardOn) for (const [t, ok, end] of stageGoals(MAP)) if (!end && !goalsMet[t] && ok()) { goalsMet[t] = true; log(`<b>Goal</b> · ${t} ✓`, 'good'); sfx('star'); }
  renderGoals();
}
// the top panel's Goals (Jack; it was the town log): "Goals" and a gold tick per goal met, Show opens the three goals (Survive and
// the stage's two); on hard mode (and the bonus stages, which are hard only) there are no goals, so it just reads "Hard Mode" with no Show
var goalsKey = '';
function renderGoals() {
  const hard = !!hardOn;
  const list = [[`Survive ${NIGHTS} nights`, false], ...stageGoals(MAP).map(g => [g[0], !!goalsMet[g[0]]])];
  const key = hard + '|' + list.map(g => g[0] + g[1]).join(',');
  if (key === goalsKey) return; goalsKey = key;
  const L = $('#ledger'); L.classList.toggle('hard', hard); if (hard) L.open = false;
  $('#goalHead').textContent = hard ? 'Hard Mode' : 'Goals';
  $('#goalTicks').textContent = hard ? '' : '✓'.repeat(list.filter(g => g[1]).length);
  $('#goalList').innerHTML = list.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}"><b>${ok ? '✓' : '–'}</b>${t}</li>`).join('');
}
// campaign stops' own maps: the buildings each one has (the stop's and every earlier stop's), and where it sits on the overview
const CAMP_MAPS = {
  vale: { stop: 0, maxTier: 1, cats: { eco: ['house', 'farm', 'lodge', 'quarry'], def: ['tower'], decor: ['road', 'flowers', 'torch'] } },
  bridge: { stop: 1, maxTier: 1, cats: { eco: ['house', 'farm', 'lodge', 'quarry'], def: ['tower', 'barracks', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack'] } },
  cross: { stop: 2, maxTier: 2, newTier: 2, cats: { eco: ['house', 'farm', 'lodge', 'quarry', 'market'], def: ['tower', 'barracks', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue'] } },
  dune: { stop: 4, maxTier: 2, prefer: { wood: 'forester' }, cats: { eco: ['house', 'farm', 'lodge', 'forester', 'quarry', 'market'], def: ['tower', 'ballista', 'barracks', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well'] } },
  bend: { stop: 5, maxTier: 2, prefer: { ranged: 'crossbow' }, cats: { eco: ['house', 'farm', 'lodge', 'forester', 'quarry', 'market'], def: ['tower', 'crossbow', 'ballista', 'barracks', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts'] } },
  crag: { stop: 6, maxTier: 3, newTier: 3, prefer: { stone: 'mine' }, cats: { eco: ['house', 'farm', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'barracks', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner'] } },
  ford: { stop: 7, maxTier: 3, prefer: { siege: 'catapult', stone: 'quarry' }, cats: { eco: ['house', 'farm', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'] } },
  mere: { stop: 8, maxTier: 3, prefer: { food: 'farmhouse' }, cats: { eco: ['house', 'farm', 'farmhouse', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'] } },
  plains: { stop: 9, maxTier: 3, prefer: { barracks: 'stables' }, cats: { eco: ['house', 'farm', 'farmhouse', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'stables', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'] } },
  keep: { stop: 10, maxTier: 3, prefer: { food: 'farmhouse' }, cats: { eco: ['house', 'farm', 'farmhouse', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'stables', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'] } },
  hold: { stop: 11, maxTier: 3, cats: { eco: ['house', 'farm', 'farmhouse', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'stables', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'] } },
  // the bonus stages: every building and decor, tier 3 (the player picks on the town picker)
  meadow: { stop: 12, bonus: true, maxTier: 3, cats: { eco: ['house', 'farm', 'farmhouse', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'stables', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'] } },
  isle: { stop: 13, bonus: true, maxTier: 3, prefer: { food: 'farmhouse' }, cats: { eco: ['house', 'farm', 'farmhouse', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'stables', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'] } },
  pass: { stop: 14, bonus: true, maxTier: 3, cats: { eco: ['house', 'farm', 'farmhouse', 'lodge', 'forester', 'quarry', 'mine', 'market'], def: ['tower', 'crossbow', 'ballista', 'catapult', 'barracks', 'stables', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire', 'well', 'butts', 'banner', 'stores'] } },
  watch: { stop: 3, maxTier: 2, cats: { eco: ['house', 'farm', 'lodge', 'quarry', 'market'], def: ['tower', 'ballista', 'barracks', 'wall', 'gate'], decor: ['road', 'flowers', 'torch', 'rack', 'statue', 'campfire'] } },   // more decor than fits: the player picks four (stage picker)
};
// every map has its own rules (all fifteen are campaign stages)
var WAVES = MAP_RULES.vale.waves, NIGHTS = WAVES.length, DAYLEN = MAP_RULES.vale.day, SPAWN_GAP = 1.1;
// Normal mode sends 10% fewer raiders on the twelve main stages (Jack: Normal shouldn't be too hard); Hard keeps the full waves.
// Each wave's foot and horse total is cut and rounded, the cut shared over its kinds and tiers by largest remainder;
// siege engines and bosses are never cut
const NORMAL_K = .9, KEEP_N = ['ballista', 'catapult', 'ram', 'chief', 'warlord'];
function normalWave(w) {
  const r = {}, cells = []; let tot = 0;
  for (const t in w) { r[t] = w[t].slice(); if (KEEP_N.includes(t)) continue; w[t].forEach((c, j) => { if (c) { cells.push({ t, j, x: c * NORMAL_K }); tot += c; } }); }
  cells.forEach(c => c.f = Math.floor(c.x));
  const left = Math.round(tot * NORMAL_K) - cells.reduce((a, c) => a + c.f, 0);
  cells.slice().sort((a, b) => (b.x - b.f) - (a.x - a.f) || b.x - a.x).slice(0, left).forEach(c => c.f++);
  cells.forEach(c => r[c.t][c.j] = c.f);
  return r;
}
function mapRules() { const R = MAP_RULES[MAP]; WAVES = hardOn || (CAMP_MAPS[MAP] && CAMP_MAPS[MAP].bonus) ? R.waves : R.waves.map(normalWave); NIGHTS = WAVES.length; DAYLEN = R.day; SPAWN_GAP = R.spawnGap; }
const ENEMY = {
  sword:   { hp: 50, speed: 1.5, range: .6, dmg: 6, rate: 1.0 },
  archer:  { hp: 32, speed: 1.3, range: 4.5, dmg: 6, rate: 1.8 },
  spear:   { hp: 38, speed: 1.5, range: 1.1, dmg: 5, rate: 1.2 },               // the weakest raider, but with a longer reach than a sword
  xbow:    { hp: 36, speed: 1.2, range: 5.5, dmg: 7, rate: 1.2 },               // crossbowman: shoots faster than an archer (1.2 s against 1.8), a little harder and further
  lancer:  { hp: 110, speed: 2.2, range: 1.4, dmg: 8, rate: 1.2, mounted: true },   // spearman on a horse
  rider:   { hp: 140, speed: 2.1, range: 1.0, dmg: 11, rate: 1.0, mounted: true },  // swordsman on a horse: rides for the castle
  // siege engines, pushed by two of their crew; r: how far they keep others off (separateUnits)
  ballista: { hp: 150, speed: .55, range: 10, dmg: 24, rate: 4.5, engine: true, r: .8 },
  catapult: { hp: 170, speed: .45, range: 13, dmg: 30, rate: 6.5, engine: true, r: .85, splash: 1.6 },
  ram:      { hp: 280, speed: .6, range: 1.25, dmg: 45, rate: 2.4, engine: true, r: .9 },   // goes for walls and gates (range from its middle: the head reaches 1.3 m ahead)
  // bosses (always sent at tier 3, but their hp and dmg are taken as they are): drawn bigger (boss: scale), a long red cloak, they head for the castle
  // Jack: the Chief 3000 health and 30 damage, the Warlord 4000 and 40 (no tier multipliers for bosses)
  chief:    { hp: 3000, speed: 1.35, range: 1.0, dmg: 30, rate: 1.1, boss: 1.35 },                  // the Raider Chief, on foot: horned helm, war axe-sword, red shield
  warlord:  { hp: 4000, speed: 2.0, range: 1.3, dmg: 40, rate: 1.0, mounted: true, boss: 1.3 },     // the Warlord, mounted: crowned helm with a red plume, barded black horse
};
// raider tiers: the same three looks for every kind (raiderArmour), stronger by tier
const RAIDER_T = { hp: [1, 1.6, 2.3], dmg: [1, 1.3, 1.65] };
const RAIDER_NAME = { spear: 'Spearman', sword: 'Swordsman', archer: 'Archer', xbow: 'Crossbow', lancer: 'Horse spear', rider: 'Horse sword',
  ballista: ['Scorpion', 'Ballista', 'Great ballista'], catapult: ['Catapult', 'Mangonel', 'Trebuchet'], ram: ['Ram', 'Covered ram', 'Iron ram'],
  chief: 'Raider Chief', warlord: 'Warlord' };

