// node trailer.js W H DSF out-dir [clip...]: the ~19 s landscape trailer (Jack): the town growing and upgrading, holding the line,
// siege against siege, the Upgrades screen, then the title. 30 fps frames stepped by hand; join them with the ffmpeg line in README
const L=require('./lib');const SC=require('./scenes');const fs=require('fs');
const [W,H,D,OUT]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];const only=process.argv.slice(6);
const FPS=30;fs.mkdirSync(OUT,{recursive:true});
const G=(p,c)=>p.evaluate(c=>G(c),c);
// the frame loop is ours: requestAnimationFrame only keeps the callback, step() runs one 1/30 s frame
const own=p=>p.evaluate(()=>G(`adaptResolution=()=>{};window.__T=performance.now();window.requestAnimationFrame=cb=>{window.__cb=cb;return 1;};`));
const step=p=>p.evaluate(()=>{const cb=window.__cb;window.__cb=null;window.__T+=1000/30;if(cb)cb(window.__T);});
const fade=(p,o)=>p.evaluate(o=>{let d=document.getElementById('fadeDiv');if(!d){d=document.createElement('div');d.id='fadeDiv';d.style.cssText='position:fixed;inset:0;background:#000;z-index:9999;pointer-events:none';document.body.appendChild(d);}d.style.opacity=o;},o);
const shot=async(p,name,i)=>p.screenshot({path:`${OUT}/${name}-${String(i).padStart(4,'0')}.png`});
// a clip: secs of frames; each frame calls window.__tick(t) inside the game (t 0..1), steps the game one frame, fades at the ends
async function clip(p,name,secs,{fin=6,fout=6,live=true}={}){if(live){await own(p);await p.waitForTimeout(300);await step(p);}const n=Math.round(secs*FPS);
 for(let i=0;i<n;i++){const t=i/(n-1);await p.evaluate(t=>G('window.__tick&&__tick('+t+')'),t);if(live)await step(p);
  await fade(p,Math.max(0,fin?1-i/fin:0,fout?1-(n-1-i)/fout:0));await shot(p,name,i);}
 console.log('clip',name,n,p.errs.slice(0,2));}
const want=s=>!only.length||only.includes(s);
(async()=>{const env=await L.start();
// 1 the town grows round a tier-1 castle while the camera circles, then everything is upgraded to tier 2 and to its final tier
if(want('town')){const p=await L.open(env,SC.hero.map,W,H,D);await G(p,SC.hero.code);
 await G(p,`(()=>{const K=castleB(),c=center(K);const L=buildings.filter(B=>B!==K).map(B=>({B,t:B.tier,d:Math.hypot(center(B).x-c.x,center(B).z-c.z)+(B.type==='wall'||B.type==='gate'?6:0)})).sort((a,b)=>a.d-b.d);
  const set=(B,t)=>{if(B.tier===t)return;B.tier=t;B.max=DEF[B.type].hp[t-1];B.hp=B.max;swapModel(B);B.pop=window.__T;const q=center(B);for(let n=0;n<5;n++){const a=n/5*6.283;dustAt(q.x+Math.cos(a)*1.2,hAt(q.x,q.z),q.z+Math.sin(a)*1.2);}};
  for(const o of L){o.B.tier=1;o.B.max=DEF[o.B.type].hp[0];o.B.hp=o.B.max;swapModel(o.B);o.B.group.visible=false;}K.tier=1;swapModel(K);refreshWalls();
  for(const o of L)if(o.B.type==='wall'||o.B.type==='gate')o.B.group.visible=false;
  paused=false;const lo=updateLight;updateLight=(dt,now)=>{light=1;lo(0,now);};const n=L.length;
  window.__tick=t=>{const shown=Math.floor(n*Math.min(1,.12+t/.5));L.forEach((o,i)=>{if(i<shown&&!o.B.group.visible){o.B.group.visible=true;o.B.pop=window.__T;const q=center(o.B);dustAt(q.x,hAt(q.x,q.z),q.z);}});
   if(t>.55){const k=Math.floor(n*Math.min(1,(t-.55)/.13));set(K,Math.max(K.tier,2));L.slice(0,k).forEach(o=>set(o.B,Math.max(o.B.tier,Math.min(2,o.t))));}
   if(t>.76){const k=Math.floor(n*Math.min(1,(t-.76)/.14));set(K,3);L.slice(0,k).forEach(o=>set(o.B,o.t));}
   SH.cam({yaw:-.3+t*.8,pitch:.95-t*.12,dist:25-t*4,dx:0,dz:-1,y:1});};})()`);
 await clip(p,'a-town',6.5,{fin:0});await p.close();}
// 2 hold the line: Raider Keep at night, raiders at the wall and the gate, the towers shooting, troops behind the gate
if(want('wall')){const p=await L.open(env,SC.wall.map,W,H,D);await G(p,SC.wall.code);
 await G(p,`(()=>{paused=false;const Gt=buildings.find(B=>B.type==='gate'),q=center(Gt);const K=['spear','sword','spear','sword','archer','spear','xbow','sword'];for(let i=0;i<22;i++){const x=q.x-10+Math.random()*20,z=q.z-3-Math.random()*6;if(canStand(x,z,2))SH.spawn(K[i%K.length],1+(i%3),x,z);}SH.spawn('ram',3,q.x,q.z-5);SH.run(3.5);const T=target.clone();window.__tick=t=>SH.look(q.x,q.z-3.5-t*1,{yaw:-.25+t*.4,pitch:.92,dist:17-t*2.5,y:1});})()`);
 await clip(p,'b-wall',3.5);await p.close();}
// 3 siege against siege: the town's catapults and ballistas against raider engines and their escort, by day
if(want('siege')){const p=await L.open(env,'plains',W,H,D);
 await G(p,`(()=>{SH.town([['catapult',-3,-4,3,2],['catapult',3,-4,2,2],['catapult',0,-6,3,2],['ballista',-6,-3,3,2],['ballista',6,-3,2,2],['tower',-4,-1,3],['tower',4,-1,3],['house',-3,2,3],['house',3,2,3],['house',-5,3,2],['house',5,3,2],['stores',-1,-3,1],['stores',1,-3,1],['torch',0,3,1],['barracks',0,5,3]],30);
  SH.run(5);SH.hud(false);SPAWN_GAP=.25;
  spawnRaiders([['catapult',3],['ram',3],['ballista',3],['catapult',2],['ballista',2]].concat([...Array(16)].map(()=>['spear',2]),[...Array(8)].map(()=>['sword',3]),[...Array(4)].map(()=>['xbow',2])));SH.run(13);
  for(const B of buildings)if(B.bar)B.bar.grp.visible=false;const lo=updateLight;updateLight=(dt,now)=>{light=1;lo(0,now);};
  const f=SH.foe(e=>ENEMY[e.kind].engine)||SH.foe();const T=buildings.filter(B=>B.type==='catapult');let x=0,z=0;for(const B of T){const c=center(B);x+=c.x;z+=c.z;}x/=T.length;z/=T.length;
  const a=Math.atan2(f.x-x,f.z-z)+Math.PI,mx=x*.5+f.x*.5,mz=z*.5+f.z*.5;window.__tick=t=>SH.look(mx,mz,{yaw:a+1.15-t*.35,pitch:.66,dist:Math.hypot(f.x-x,f.z-z)*.7+5-t*3,y:1.5});})()`);
 await clip(p,'c-siege',3.5);await p.close();}
// 4 the Upgrades screen, moving across its tabs and buying one
if(want('upgrades')){const p=await env.b.newPage({viewport:{width:W,height:H},deviceScaleFactor:D,hasTouch:true});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 const STARS={vale:3,bridge:3,cross:3,watch:2,dune:3,bend:2};
 await p.goto(env.base);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('mtd-stars',JSON.stringify(s));localStorage.setItem('mtd-full','1');localStorage.setItem('mtd-cards',JSON.stringify(Object.keys(s)));localStorage.setItem('mtd-upg',JSON.stringify(['tax','homes','seed','axes','qvolley']));},STARS);
 await p.goto(env.base);await p.waitForTimeout(5000);await p.click('#campBtn');await p.waitForTimeout(1200);await p.click('#campUpBtn');await p.waitForTimeout(1200);
 const tabs=await p.$$('#upPick .upTab');const tap=async sel=>{await p.evaluate(s=>{const e=typeof s==='number'?document.querySelectorAll('#upPick .upTab')[s]:document.querySelector(s);if(e)e.click();},sel);await p.waitForTimeout(250);};
 const plan={0:null,26:1,52:'#upPick .upNode:not(.done)',62:2,88:'#upPick .upNode:not(.done)',98:'#upPick .upBuy'};const n=110;
 for(let i=0;i<n;i++){if(plan[i]!==undefined&&plan[i]!==null)await tap(plan[i]);await p.evaluate(k=>{document.body.style.transform=`scale(${1+k*.04})`;document.body.style.transformOrigin='50% 45%';},i/n);
  await fade(p,Math.max(0,1-i/6,1-(n-1-i)/6));await shot(p,'d-upgrades',i);}
 console.log('clip d-upgrades',n,p.errs.slice(0,2),tabs.length);await p.close();}
// 5 the title over the Blighted Isle, with "Your castle awaits" under it
if(want('title')){const p=await L.open(env,SC.title.map,W,H,D);await G(p,SC.title.code);await p.waitForTimeout(3000);
 await p.evaluate(()=>{const t=document.querySelector('.gameTitle'),d=document.createElement('div');d.id='awaits';d.textContent='Your castle awaits';const cs=getComputedStyle(t);
  d.style.cssText=`position:fixed;left:0;right:0;bottom:12%;text-align:center;z-index:9998;font-family:${cs.fontFamily};color:#f4e3b2;font-size:${parseFloat(cs.fontSize)*.5}px;letter-spacing:.04em;text-shadow:0 2px 10px rgba(0,0,0,.8);opacity:0`;document.body.appendChild(d);});
 await G(p,`window.__tick=t=>{const d=document.getElementById('awaits');if(d)d.style.opacity=Math.min(1,Math.max(0,(t-.25)/.3));}`);
 await clip(p,'e-title',3,{fout:0});await p.close();}
await env.b.close();env.server.close();})();
