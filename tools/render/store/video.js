// node video.js W H DSF out-dir [clip...]: 30 fps frames, stepped by hand so the motion is smooth however slow the render
const L=require('./lib');const fs=require('fs');const [W,H,D,OUT]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];const only=process.argv.slice(6);
fs.mkdirSync(OUT,{recursive:true});let F=0;const FPS=30;
const G=(p,c)=>p.evaluate(c=>G(c),c);
// take over the frame loop: requestAnimationFrame only stores the callback; step() runs one 1/30 s frame
const own=p=>p.evaluate(()=>G(`adaptResolution=()=>{};window.__T=performance.now();window.requestAnimationFrame=cb=>{window.__cb=cb;return 1;};`));
const step=p=>p.evaluate(()=>{const cb=window.__cb;window.__cb=null;window.__T+=1000/30;if(cb)cb(window.__T);});
const fade=(p,o)=>p.evaluate(o=>{let d=document.getElementById('fadeDiv');if(!d){d=document.createElement('div');d.id='fadeDiv';d.style.cssText='position:fixed;inset:0;background:#000;z-index:999;pointer-events:none';document.body.appendChild(d);}d.style.opacity=o;},o);
async function clip(p,secs,camFn){await own(p);await p.waitForTimeout(300);await step(p);const n=secs*FPS;
 for(let i=0;i<n;i++){const t=i/n;await p.evaluate(([c,t])=>G(c+'('+t+')'),[camFn,t]);await step(p);
  await fade(p,Math.max(0,1-i/8,1-(n-1-i)/8));await p.screenshot({path:`${OUT}/f${String(F++).padStart(5,'0')}.png`});}
 console.log('clip done',F,p.errs.slice(0,2));}
const want=s=>!only.length||only.includes(s);
(async()=>{const env=await L.start();
if(want('hero')){const p=await L.open(env,'vale',W,H,D);
 await G(p,`SH.town([['house',-3,-1,3],['house',-3,1,3],['house',-2,3,2],['house',3,1,3],['house',3,-1,2],['house',-4,3,2],['house',4,3,3],['house',-5,0,2],['farm',-7,-2,3],['farm',-7,2,2],['lodge',-6,6,3],['quarry',6,6,2],['market',1,5,3],['tower',-3,-4,3],['tower',3,-4,3],['tower',6,-1,2],['barracks',0,-5,3],['torch',-1,2,1],['torch',1,2,1],['campfire',-2,7,1],['flowers',-4,1,1],['flowers',4,1,1],['well',4,5,1],['statue',-2,-3,1],['banner',2,-3,1]],8)`);
 await G(p,'SH.roads();SH.run(45);SH.hud(false);window.__cam=t=>SH.cam({yaw:.1+t*.9,pitch:.7-t*.08,dist:40-t*8})');await clip(p,5,'__cam');await p.close();}
if(want('wall')){const p=await L.open(env,'bridge',W,H,D);
 await G(p,`(()=>{const b=bridges[0],bci=Math.floor(b.ex/CELL);
  for(const n of BANK_WALL){if(occB[n])continue;const ci=n%N,cj=(n/N)|0;place(ci===bci?'gate':'wall',ci,cj,{instant:true,free:true,quiet:true});}
  for(const B of buildings)if(B.type==='wall'||B.type==='gate'){B.tier=2;B.max=DEF[B.type].hp[1];B.hp=B.max;swapModel(B);}
  SH.town([['house',-3,1,2],['house',3,1,2],['house',-3,3,3],['house',3,3,3],['house',-5,2,2],['house',5,2,2],['tower',-2,-4,3],['tower',2,-4,3],['barracks',0,4,2],['farm',-7,5,2],['lodge',7,5,2],['torch',-1,-3,1],['torch',1,-3,1],['rack',2,-2,1],['banner',-2,-2,1]],16);
  SH.run(5);SH.hud(true);SPAWN_GAP=.15;
  spawnRaiders([...Array(26)].map(()=>['spear',3]).concat([...Array(16)].map(()=>['sword',3]),[...Array(6)].map(()=>['archer',3]),[['rider',3],['rider',3],['lancer',3],['ram',3],['ram',3]]));SH.run(15);
  const o=updateLight;updateLight=(dt,now)=>{light=.45;o(0,now);};
  const f=SH.foe(e=>e.z>stoneRiverZ(e.x)+2)||SH.foe();window.__f=f;window.__cam=t=>SH.look(__f.x,__f.z+3,{yaw:Math.PI+.1+t*.3,pitch:.8,dist:30-t*5});})()`);
 await clip(p,5,'__cam');await p.close();}
if(want('siege')){const p=await L.open(env,'vale',W,H,D);
 await G(p,`(()=>{SH.town([['catapult',-3,-4,3],['catapult',3,-4,3],['catapult',0,-6,2],['ballista',-6,-3,3],['ballista',6,-3,3],['tower',-4,-1,3],['tower',4,-1,3],['house',-3,2,3],['house',3,2,3],['house',-5,3,2],['house',5,3,2],['stores',-1,-3,1],['stores',1,-3,1],['torch',0,3,1],['barracks',0,5,3]],18);
  SH.run(5);SH.hud(true);SPAWN_GAP=.25;
  spawnRaiders([['catapult',3],['ram',3],['ballista',3],['catapult',2],['ram',2]].concat([...Array(18)].map(()=>['spear',3]),[...Array(10)].map(()=>['sword',3]),[...Array(5)].map(()=>['xbow',3])));SH.run(9);
  const o=updateLight;updateLight=(dt,now)=>{light=.45;o(0,now);};
  const f=SH.foe();const T=buildings.filter(B=>B.type==='catapult');let x=0,z=0;for(const B of T){const c=center(B);x+=c.x;z+=c.z;}x/=T.length;z/=T.length;
  const a=Math.atan2(f.x-x,f.z-z)+Math.PI;window.__cam=t=>SH.look(x*.55+f.x*.45,z*.55+f.z*.45,{yaw:a-.25+t*.5,pitch:.55,dist:30-t*4,y:2});})()`);
 await clip(p,5,'__cam');await p.close();}
if(want('boss')){const p=await L.open(env,'hold',W,H,D);
 await G(p,`(()=>{SH.town([['tower',-4,-4,3],['tower',4,-4,3],['crossbow',-7,-2,3],['crossbow',7,-2,3],['house',-3,2,3],['house',3,2,3],['house',-5,3,3],['house',5,3,3],['stables',0,-6,3],['barracks',-6,4,3],['torch',-1,-3,1],['torch',1,-3,1],['banner',0,-3,1]],20);
  SH.run(5);SH.hud(true);SPAWN_GAP=.12;
  spawnRaiders([...Array(8)].map(()=>['rider',3]).concat([...Array(14)].map(()=>['sword',3]),[['warlord',3]]));
  for(let k=0;k<80;k++){SH.run(.5);const w=enemies.find(e=>e.kind==='warlord'&&!e.dead);if(w){const c=center(castleB());if(Math.hypot(w.x-c.x,w.z-c.z)<34)break;}}
  const o=updateLight;updateLight=(dt,now)=>{light=.45;o(0,now);};
  window.__cam=t=>{const w=enemies.find(e=>e.kind==='warlord'&&!e.dead)||enemies[0];SH.look(w.rx||w.x,(w.rz||w.z)+1,{yaw:Math.PI+.4-t*.3,pitch:.6,dist:15+t*4,y:1.5});};})()`);
 await clip(p,6,'__cam');await p.close();}
await env.b.close();env.server.close();})();
