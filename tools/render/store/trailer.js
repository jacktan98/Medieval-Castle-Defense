// node trailer.js W H DSF out-dir [part...]: the ~30 s landscape trailer (Jack): a black title card before each part, then the town
// growing and upgrading, holding the line, siege against siege, the Upgrades screen, the title. 30 fps frames stepped by hand; every
// game sound played while a part renders is logged (<part>.json: [frame, sound, gain]) for mix.js, which builds the soundtrack and
// joins everything into the video. Parts: cards town wall siege upgrades title
const L=require('./lib');const SC=require('./scenes');const fs=require('fs');
const [W,H,D,OUT]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];const only=process.argv.slice(6);
const FPS=30;fs.mkdirSync(OUT,{recursive:true});
const G=(p,c)=>p.evaluate(c=>G(c),c);
// the frame loop is ours: requestAnimationFrame only keeps the callback; step() runs one frame of game time (k: slow motion)
const own=p=>p.evaluate(()=>G(`adaptResolution=()=>{};window.__T=performance.now();window.requestAnimationFrame=cb=>{window.__cb=cb;return 1;};`));
const step=(p,k=1)=>p.evaluate(k=>{const cb=window.__cb;window.__cb=null;window.__T+=1000/30*k;if(cb)cb(window.__T);},k);
// every sound the game plays is noted with the frame it fell on and how loud it would be from where the camera looks
const hear=p=>G(p,`(()=>{if(window.__heard)return;window.__heard=1;window.__ev=[];const o=sfx;sfx=(n,at,v)=>{let g=v===undefined?1:v;if(at&&at.x!==undefined){const d=Math.hypot(at.x-target.x,at.z-target.z);g*=d<7?1:Math.max(.12,1-(d-7)/28);}window.__ev.push([window.__fi||0,n,g]);return o(n,at,v);};})()`);
const fade=(p,o)=>p.evaluate(o=>{let d=document.getElementById('fadeDiv');if(!d){d=document.createElement('div');d.id='fadeDiv';d.style.cssText='position:fixed;inset:0;background:#000;z-index:9999;pointer-events:none';document.body.appendChild(d);}d.style.opacity=o;},o);
const shot=(p,name,i)=>p.screenshot({path:`${OUT}/${name}-${String(i).padStart(4,'0')}.png`});
const save=async(p,name,extra=[])=>{const ev=await p.evaluate(()=>window.__ev||[]);fs.writeFileSync(`${OUT}/${name}.json`,JSON.stringify(ev.concat(extra)));};
async function clip(p,name,secs,{fin=10,fout=10,k=1}={}){await own(p);await hear(p);await p.waitForTimeout(300);await step(p,k);const n=Math.round(secs*FPS);
 await p.evaluate(()=>{window.__ev=[];});
 for(let i=0;i<n;i++){const t=i/(n-1);await p.evaluate(([t,i])=>{window.__fi=i;G('window.__tick&&__tick('+t+')');},[t,i]);await step(p,k);
  await fade(p,Math.max(0,fin?1-i/fin:0,fout?1-(n-1-i)/fout:0));await shot(p,name,i);}
 await save(p,name);console.log('clip',name,n,p.errs.slice(0,2));}
const want=s=>!only.length||only.includes(s);
(async()=>{const env=await L.start();
// title cards: the part's name in gold on black, fading in and out
if(want('cards')){const p=await env.b.newPage({viewport:{width:W,height:H},deviceScaleFactor:D});
 const CARDS={'0-card':['Build','your town'],'2-card':['Hold','the line'],'4-card':['Control','siege engines'],'6-card':['Earn','and upgrade']};
 await p.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&display=block" rel="stylesheet"><style>
  html,body{margin:0;width:${W}px;height:${H}px;background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center}
  #c{text-align:center;font-family:'IM Fell English SC',serif;color:#f3cf6e;text-shadow:0 0 ${H*.04}px rgba(243,207,110,.25)}
  #c b{display:block;font-weight:400;font-size:${H*.15}px;line-height:1}#c span{display:block;font-size:${H*.09}px;color:#f4e3b2;margin-top:${H*.01}px}
  #c i{display:block;width:${W*.22}px;height:2px;margin:${H*.035}px auto 0;background:linear-gradient(90deg,transparent,#d9b04e,transparent)}</style></head><body><div id=c></div></body></html>`);
 await p.evaluate(()=>document.fonts.ready);const n=Math.round(1.5*FPS);
 for(const [name,[a,b]] of Object.entries(CARDS)){await p.evaluate(([a,b])=>{document.getElementById('c').innerHTML=`<b>${a}</b><span>${b}</span><i></i>`;},[a,b]);
  for(let i=0;i<n;i++){const o=Math.min(1,i/10,(n-1-i)/10);await p.evaluate(([o,i,n])=>{const c=document.getElementById('c');c.style.opacity=o;c.style.transform=`scale(${1+.03*i/n})`;},[o,i,n]);await shot(p,name,i);}
  fs.writeFileSync(`${OUT}/${name}.json`,'[]');console.log('card',name,n);}
 await p.close();}
// 1 the town grows round a tier-1 castle while the camera slowly circles; buildings come up one by one and are upgraded now and then,
// each on its own time, until the castle and the rest stand at their final tier
if(want('town')){const p=await L.open(env,SC.hero.map,W,H,D);await G(p,SC.hero.code);
 await G(p,`(()=>{const K=castleB(),c=center(K);let s=7;const R=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  const L=buildings.filter(B=>B!==K).map(B=>({B,t:B.tier,d:Math.hypot(center(B).x-c.x,center(B).z-c.z)+(B.type==='wall'||B.type==='gate'?6:0)})).sort((a,b)=>a.d-b.d);
  L.forEach((o,i)=>{o.a=.02+.5*i/L.length;o.u2=o.t>=2?Math.min(.93,o.a+.12+R()*.4):9;o.u3=o.t>=3?Math.min(.97,o.u2+.1+R()*.3):9;});
  const pop=(B,up)=>{B.pop=window.__T;const q=center(B);for(let n=0;n<6;n++){const a=n/6*6.283;dustAt(q.x+Math.cos(a)*1.2,hAt(q.x,q.z),q.z+Math.sin(a)*1.2);}if(B.type!=='wall'&&B.type!=='gate')sfx(up?'upgrade':'build',{x:q.x,z:q.z},up?.55:.7);};
  const set=(B,t)=>{if(B.tier>=t)return;B.tier=t;B.max=DEF[B.type].hp[t-1];B.hp=B.max;swapModel(B);pop(B,1);};
  for(const o of L){o.B.tier=1;o.B.max=DEF[o.B.type].hp[0];o.B.hp=o.B.max;swapModel(o.B);o.B.group.visible=false;}K.tier=1;swapModel(K);refreshWalls();for(const o of L)if(o.B.type==='wall'||o.B.type==='gate')o.B.group.visible=false;
  paused=false;const lo=updateLight;updateLight=(dt,now)=>{light=1;lo(0,now);};
  window.__tick=t=>{for(const o of L){if(t>=o.a&&!o.B.group.visible){o.B.group.visible=true;pop(o.B,0);}if(t>=o.u2)set(o.B,2);if(t>=o.u3)set(o.B,3);}
   if(t>=.42)set(K,2);if(t>=.74)set(K,3);
   SH.cam({yaw:-.3+t*.55,pitch:.95-t*.1,dist:25-t*3,dx:0,dz:-1,y:1});};})()`);
 await clip(p,'1-town',7.5);await p.close();}
// 2 hold the line: Raider Keep at night, a wave right at the wall and the gate, the towers shooting (at .8 speed)
if(want('wall')){const p=await L.open(env,SC.wall.map,W,H,D);await G(p,SC.wall.code);
 await G(p,`(()=>{paused=false;const Gt=buildings.find(B=>B.type==='gate'),q=center(Gt);const K=['spear','sword','spear','sword','archer','spear','xbow','sword'];for(let i=0;i<22;i++){const x=q.x-10+Math.random()*20,z=q.z-3-Math.random()*6;if(canStand(x,z,2))SH.spawn(K[i%K.length],1+(i%3),x,z);}SH.spawn('ram',3,q.x,q.z-5);SH.run(2.5);
  window.__tick=t=>SH.look(q.x,q.z-3.5-t*.8,{yaw:-.2+t*.3,pitch:.92,dist:17-t*2,y:1});})()`);
 await clip(p,'3-wall',4.5,{k:.8});await p.close();}
// 3 siege against siege by day: the town's engines already turned on the raiders' engines, the barracks' and stables' troops out in
// front of them holding off the raiders rushing them (at .8 speed)
if(want('siege')){const p=await L.open(env,'plains',W,H,D);
 await G(p,`(()=>{SH.town([['catapult',-3,-4,3,2],['catapult',3,-4,2,2],['catapult',0,-6,3,2],['ballista',-6,-3,3,2],['ballista',6,-3,2,2],['tower',-4,-1,3],['tower',4,-1,3],['house',-3,2,3],['house',3,2,3],['house',-5,3,3],['house',5,3,3],['stores',-1,-3,1],['stores',1,-3,1],['torch',0,3,1],['barracks',-6,1,3],['stables',6,1,3],['barracks',0,5,3]],44);
  SH.run(5);SH.hud(false);SPAWN_GAP=.3;
  spawnRaiders([['catapult',3],['ballista',3],['ram',3],['catapult',2],['ballista',2]].concat([...Array(14)].map(()=>['spear',2]),[...Array(8)].map(()=>['sword',3]),[...Array(4)].map(()=>['lancer',2]),[...Array(4)].map(()=>['xbow',2])));
  for(const v of villagers){v.sleeping=false;v.hunger=0;}res.food=999;SH.run(1);assignPosts();
  const E=buildings.filter(B=>B.type==='catapult'||B.type==='ballista');let x=0,z=0;for(const B of E){const c=center(B);x+=c.x;z+=c.z;}x/=E.length;z/=E.length;
  SH.run(6);const f0=SH.foe()||{x,z:z-20},dx=f0.x-x,dz=f0.z-z,l=Math.hypot(dx,dz)||1,px=-dz/l,pz=dx/l;
  for(const B of buildings)if(B.type==='barracks'||B.type==='stables'){const sd=B.type==='stables'?3:-3;setRally(B,{x:x+dx/l*7+px*sd,z:z+dz/l*7+pz*sd});}
  const aim=()=>{const f=SH.foe(e=>ENEMY[e.kind].engine)||SH.foe();if(!f)return;for(const B of E){const q=center(B);if(B.turret)B.turret.rotation.y=Math.atan2(f.x-q.x,f.z-q.z)-B.group.rotation.y;}};
  for(let k=0;k<12;k++){aim();SH.run(.5);}for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=false;
  for(const B of buildings)if(B.bar)B.bar.grp.visible=false;const lo=updateLight;updateLight=(dt,now)=>{light=1;lo(0,now);};
  const f=SH.foe(e=>ENEMY[e.kind].engine)||SH.foe(),a=Math.atan2(f.x-x,f.z-z)+Math.PI,mx=x*.5+f.x*.5,mz=z*.5+f.z*.5,dd=Math.hypot(f.x-x,f.z-z);SH.clearTrees(mx,mz,dd*.75);
  window.__tick=t=>SH.look(mx,mz,{yaw:a+1.1-t*.25,pitch:.66,dist:dd*.7+5-t*2,y:1.5});})()`);
 await clip(p,'5-siege',4.5,{k:.8});await p.close();}
// 4 the Upgrades screen: a moment on each tab, then one bought
if(want('upgrades')){const p=await env.b.newPage({viewport:{width:W,height:H},deviceScaleFactor:D,hasTouch:true});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 const STARS={vale:3,bridge:3,cross:3,watch:2,dune:3,bend:2};
 await p.goto(env.base);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('mtd-stars',JSON.stringify(s));localStorage.setItem('mtd-full','1');localStorage.setItem('mtd-cards',JSON.stringify(Object.keys(s)));localStorage.setItem('mtd-upg',JSON.stringify(['tax','homes','seed','axes','qvolley']));},STARS);
 await p.goto(env.base);await p.waitForTimeout(5000);await p.click('#campBtn');await p.waitForTimeout(1200);await p.click('#campUpBtn');await p.waitForTimeout(1200);
 const tap=async sel=>{await p.evaluate(s=>{const e=typeof s==='number'?document.querySelectorAll('#upPick .upTab')[s]:document.querySelector(s);if(e)e.click();},sel);await p.waitForTimeout(250);};
 const plan={38:1,76:2,96:'#upPick .upNode:not(.done)',108:'#upPick .upBuy'},n=120,ev=[];
 for(let i=0;i<n;i++){if(plan[i]!==undefined){await tap(plan[i]);ev.push([i,i===108?'upgrade':'click',i===108?.9:.8]);}
  await p.evaluate(k=>{document.body.style.transform=`scale(${1+k*.04})`;document.body.style.transformOrigin='50% 45%';},i/n);
  await fade(p,Math.max(0,1-i/10,1-(n-1-i)/10));await shot(p,'7-upgrades',i);}
 fs.writeFileSync(`${OUT}/7-upgrades.json`,JSON.stringify(ev));console.log('clip 7-upgrades',n,p.errs.slice(0,2));await p.close();}
// 5 the title over the Blighted Isle, and "Your castle awaits" under it, big and gold
if(want('title')){const p=await L.open(env,SC.title.map,W,H,D);await G(p,SC.title.code);await p.waitForTimeout(3000);
 await p.evaluate(()=>{const t=document.querySelector('.gameTitle'),cs=getComputedStyle(t),d=document.createElement('div');d.id='awaits';d.innerHTML='<span>Your castle awaits</span>';
  d.style.cssText='position:fixed;left:0;right:0;bottom:0;height:36%;display:flex;align-items:center;justify-content:center;z-index:9998;opacity:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55) 45%,rgba(0,0,0,.7))';
  const s=d.firstChild;s.style.cssText=`display:inline-block;font-family:${cs.fontFamily};color:#f6d77a;font-size:${parseFloat(cs.fontSize)*1.05}px;letter-spacing:.03em;-webkit-text-stroke:2px #3a2009;paint-order:stroke fill;text-shadow:0 3px 14px rgba(0,0,0,.9),0 0 22px rgba(243,207,110,.35)`;document.body.appendChild(d);});
 await G(p,`window.__tick=t=>{const d=document.getElementById('awaits');if(d){const k=Math.min(1,Math.max(0,(t-.22)/.25));d.style.opacity=k;d.firstChild.style.transform='scale('+(1.08-.08*k)+')';}}`);
 await clip(p,'8-title',3.5,{fout:0});await save(p,'8-title',[[Math.round(.22*104),'star',1]]);await p.close();}
await env.b.close();env.server.close();})();
