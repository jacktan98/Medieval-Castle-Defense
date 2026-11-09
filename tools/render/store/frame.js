// node frame.js prefix W H  -> framed-<prefix>-N.png with captions
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [PRE,W,H]=[process.argv[2],+process.argv[3],+process.argv[4]];
const CAP={'1hero':['Build your town','Houses, farms, markets and castles'],'2wall':['Hold the walls','Raiders storm in every night'],'3siege':['Raise siege engines','Catapults, trebuchets and ballistas'],
 '4boss':['Defeat the Warlord','Win back your father’s kingdom'],'5camp':['Twelve stages','Plus three hard bonus stages'],'6upgrades':['Earn stars','Unlock upgrades for every building']};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
for(const k of Object.keys(CAP)){const f=path.resolve(`${PRE}-${k}.png`);if(!fs.existsSync(f)){console.log('missing',k);continue;}
 const img='data:image/png;base64,'+fs.readFileSync(f).toString('base64');const [t,s]=CAP[k];
 const capH=Math.round(H*.17),pad=Math.round(W*.045),avH=H-capH-pad*1.4,ratio=W/H;
 await p.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=Alegreya+Sans:wght@500;700&display=block" rel="stylesheet"><style>
 html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:radial-gradient(ellipse at 50% 0%,#5a4428 0%,#2a1f10 45%,#120c05 100%)}
 .cap{position:absolute;left:0;right:0;top:${Math.round(capH*.16)}px;text-align:center}
 h1{margin:0;font-family:'IM Fell English SC',serif;font-weight:400;color:#f3cf6e;font-size:${Math.round(W*.085)}px;letter-spacing:.02em;text-shadow:0 3px 12px rgba(0,0,0,.7)}
 p{margin:${Math.round(W*.008)}px 0 0;font-family:'Alegreya Sans',sans-serif;font-weight:500;color:#f4e3b2;font-size:${Math.round(W*.038)}px;opacity:.92}
 .shot{position:absolute;left:50%;top:${capH}px;transform:translateX(-50%);height:${Math.round(avH)}px;aspect-ratio:${ratio};border-radius:${Math.round(W*.045)}px;overflow:hidden;border:${Math.max(4,Math.round(W*.006))}px solid #d9b04e;box-shadow:0 10px 40px rgba(0,0,0,.7),0 0 0 ${Math.round(W*.004)}px rgba(255,236,170,.25) inset}
 .shot img{width:100%;height:100%;object-fit:cover;display:block}
 </style></head><body><div class="cap"><h1>${t}</h1><p>${s}</p></div><div class="shot"><img src="${img}"></div></body></html>`);
 await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);await p.screenshot({path:`framed-${PRE}-${k}.png`});console.log('framed',k);}
await b.close();})();
