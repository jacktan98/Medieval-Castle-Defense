// node frame-l.js prefix W H -> framed-<prefix>-N.png: landscape store pictures in the Clash of Clans way (Jack): the shot fills the
// picture and a short caption sits over its bottom-left corner; the title shot has none (its own title is the caption)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [PRE,W,H]=[process.argv[2],+process.argv[3],+process.argv[4]];
const CAP={'1title':null,'2town':['Build','your town'],'3wall':['Hold','the line'],'4siege':['Control','siege engines'],'5upgrades':['Earn','and upgrade']};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
for(const k of Object.keys(CAP)){const f=path.resolve(`${PRE}-${k}.png`);if(!fs.existsSync(f)){console.log('missing',k);continue;}
 let buf=fs.readFileSync(f);
 const img='data:image/png;base64,'+buf.toString('base64');const c=CAP[k],u=Math.min(W,H*1.6);let CR=1;if(k==='5upgrades'){const d=buf;CR=d.readUInt32BE(20)/d.readUInt32BE(16);}
 await p.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&display=block" rel="stylesheet"><style>
 html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#000}
 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
 .fade{position:absolute;left:0;bottom:0;width:70%;height:55%;background:radial-gradient(ellipse at 0% 100%,rgba(10,6,2,.75) 0%,rgba(10,6,2,.35) 45%,rgba(10,6,2,0) 75%)}
 .fade.deep{width:62%;height:62%;background:radial-gradient(ellipse at 0% 100%,rgba(8,5,2,.85) 0%,rgba(8,5,2,.65) 35%,rgba(8,5,2,.3) 58%,rgba(8,5,2,0) 80%)}
 .cap{position:absolute;left:${Math.round(u*.045)}px;bottom:${Math.round(u*.04)}px;font-family:'IM Fell English SC',serif;color:#f6d77a;line-height:.92;
  text-shadow:0 0 2px #2a1606,0 ${Math.round(u*.004)}px 0 #2a1606,0 ${Math.round(u*.008)}px ${Math.round(u*.018)}px rgba(0,0,0,.85);-webkit-text-stroke:${Math.max(2,Math.round(u*.0022))}px #3a2009;paint-order:stroke fill}
 .cap b{display:block;font-weight:400;font-size:${Math.round(u*.085)}px}.cap span{display:block;font-size:${Math.round(u*.06)}px;color:#fff1c8}
 </style></head><body><img src="${img}">${c?`<div class="fade${k==='5upgrades'||k==='4siege'?' deep':''}"></div><div class="cap"><b>${c[0]}</b><span>${c[1]}</span></div>`:''}</body></html>`);
 await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);await p.screenshot({path:`framed-${PRE}-${k}.png`});console.log('framed',k);}
await b.close();})();
