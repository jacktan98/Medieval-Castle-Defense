// node frame-l.js prefix W H -> framed-<prefix>-N.png: landscape store pictures; the title shot fills the frame, the others have
// their caption on the left and the shot on the right in a gold frame
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [PRE,W,H]=[process.argv[2],+process.argv[3],+process.argv[4]];
const CAP={'1title':null,'2town':['Build your town','Houses, farms, markets and castles'],'3wall':['Hold the walls','Raiders storm in every night'],'4siege':['Raise siege engines','Catapults, mangonels and trebuchets'],'5upgrades':['Earn stars','Unlock upgrades for every building']};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
for(const k of Object.keys(CAP)){const f=path.resolve(`${PRE}-${k}.png`);if(!fs.existsSync(f)){console.log('missing',k);continue;}
 const img='data:image/png;base64,'+fs.readFileSync(f).toString('base64');const c=CAP[k],pad=Math.round(H*.06),col=W/H<1.6;
 const body=c?`<div class="cap"><h1>${c[0]}</h1><p>${c[1]}</p></div><div class="shot"><img src="${img}"></div>`:`<img class="full" src="${img}">`;
 await p.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=Alegreya+Sans:wght@500&display=block" rel="stylesheet"><style>
 html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:radial-gradient(ellipse at 15% 50%,#5a4428 0%,#2a1f10 50%,#120c05 100%);display:flex;align-items:center;gap:${pad}px;padding:0 ${pad}px;box-sizing:border-box}
 .full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
 ${col?`body{flex-direction:column;justify-content:center;gap:${Math.round(H*.035)}px;padding:${pad}px}.cap{flex:none!important}.cap h1{font-size:${Math.round(H*.075)}px!important}.cap h1 br{display:none}.cap p{font-size:${Math.round(H*.032)}px!important;margin-top:${Math.round(H*.008)}px!important}.shot{flex:none!important;height:${Math.round(H*.72)}px;width:auto}`:''}
 .cap{flex:0 0 ${Math.round(W*.2)}px;text-align:center}
 h1{margin:0;font-family:'IM Fell English SC',serif;font-weight:400;color:#f3cf6e;font-size:${Math.round(H*.1)}px;line-height:1.05;text-shadow:0 3px 12px rgba(0,0,0,.7)}
 p{margin:${Math.round(H*.03)}px 0 0;font-family:'Alegreya Sans',sans-serif;font-weight:500;color:#f4e3b2;font-size:${Math.round(H*.042)}px;opacity:.92}
 .shot{flex:1;aspect-ratio:${process.argv[5]||"956/440"};border-radius:${Math.round(H*.045)}px;overflow:hidden;border:${Math.max(3,Math.round(H*.007))}px solid #d9b04e;box-shadow:0 10px 40px rgba(0,0,0,.7)}
 .shot img{width:100%;height:100%;object-fit:cover;display:block}</style></head><body>${body}</body></html>`);
 await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);await p.screenshot({path:`framed-${PRE}-${k}.png`});console.log('framed',k);}
await b.close();})();
