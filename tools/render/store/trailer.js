// node trailer.js W H DSF out-dir [part...]: the ~30 s landscape trailer (Jack): a black title card before each part, then the town
// growing and upgrading into dusk, holding the line, siege against siege, the title. 30 fps frames stepped by hand; every
// game sound played while a part renders is logged (<part>.json: [frame, sound, gain]) for mix.js, which builds the soundtrack and
// joins everything into the video. Parts: cards town wall siege black title
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
 const CARDS={'0-card':['Build','your town'],'2-card':['Hold','the line'],'4-card':['Control','siege engines']};
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
if(want('town')){const p=await L.open(env,SC.hero.map,W,H,D);
 await G(p,`(()=>{for(const B of buildings.slice())removeBuilding(B,false,true);for(const v of villagers)scene.remove(v.g);villagers.length=0;road.fill(0);rebuildRoads();cacheCells();regionDirty=true;
  const ev0=findValid('castle',Math.floor(N/2)-1,Math.floor(N/2)-1,{free:true});const K=place('castle',ev0.ci,ev0.cj,{instant:true,free:true,quiet:true});SH.face(K,0);const c=center(K),ci=Math.floor(c.x/CELL),cj=Math.floor(c.z/CELL);SH.clearTrees(c.x,c.z,19);
  for(const r of rocks){const a=Math.floor(r.x/CELL),b=Math.floor(r.z/CELL);if(Math.abs(a-ci)<=6&&Math.abs(b-cj)<=6)r.amount=0;}seatRocks();cacheCells();
  SH.walls([[ci-6,cj-6],[ci+6,cj-6],[ci+6,cj+6],[ci-6,cj+6],[ci-6,cj-6]],3,[[ci,cj+6],[ci+6,cj]]);
  SH.town([['tower',-5,-5,3,0],['tower',5,-5,3,0],['tower',-5,5,3,0],['tower',5,5,3,0],
   ['house',-2,3,3,0],['house',2,3,2,0],['house',-4,2,3,0],['house',3,-3,3,0],['house',-3,-3,2,0],['house',0,-4,3,0],
   ['farm',-4,-1,3,0],['market',3,1,3,0],['lodge',-3,4,2,0],['barracks',3,4,3,0],
   ['well',2,-2,1,0],['torch',-1,3,1,0],['torch',1,3,1,0],['flowers',-2,-2,1,0],['banner',-2,2,1,0],['campfire',4,-1,1,0]],12);
  for(const B of buildings.slice())if(B.type!=='wall'&&B.type!=='gate'&&B!==K){const q=center(B);if(Math.abs(q.x-c.x)>11||Math.abs(q.z-c.z)>11)removeBuilding(B,false,true);}
  const gz=(cj+6.5)*CELL,gx=(ci+6.5)*CELL;layRoads([[[c.x,c.z+3.2],[c.x,gz+5]],[[c.x+3.2,c.z],[gx+5,c.z]]]);rebuildRoads();cacheCells();
  SH.run(40);SH.hud(false);})()`);
 await G(p,`(()=>{const K=castleB(),c=center(K);let s=7;const R=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  const L=buildings.filter(B=>B!==K).map(B=>({B,t:B.tier,d:Math.hypot(center(B).x-c.x,center(B).z-c.z)+(B.type==='wall'||B.type==='gate'?6:0)})).sort((a,b)=>a.d-b.d);
  L.forEach((o,i)=>{o.a=.02+.5*i/L.length;o.u2=o.t>=2?Math.min(.93,o.a+.12+R()*.4):9;o.u3=o.t>=3?Math.min(.97,o.u2+.1+R()*.3):9;});
  const pop=(B,up)=>{B.pop=window.__T;const q=center(B);for(let n=0;n<6;n++){const a=n/6*6.283;dustAt(q.x+Math.cos(a)*1.2,hAt(q.x,q.z),q.z+Math.sin(a)*1.2);}
   if(B===K){window.__ev.push([window.__fi||0,'castleUp',1]);return;}if(B.type!=='wall'&&B.type!=='gate')sfx('build',{x:q.x,z:q.z},up?.55:.7);};
  const set=(B,t)=>{if(B.tier>=t)return;B.tier=t;B.max=DEF[B.type].hp[t-1];B.hp=B.max;swapModel(B);pop(B,1);};
  for(const o of L){o.B.tier=1;o.B.max=DEF[o.B.type].hp[0];o.B.hp=o.B.max;swapModel(o.B);o.B.group.visible=false;}K.tier=1;swapModel(K);refreshWalls();for(const o of L)if(o.B.type==='wall'||o.B.type==='gate')o.B.group.visible=false;
  paused=false;PH.kind='day';const lo=updateLight;updateLight=(dt,now)=>{light=PH.t<DUSK?.25+.75*sstep(0,DUSK,PH.t):1;lo(dt,now);};
  window.__tick=t=>{for(const o of L){if(t>=o.a&&!o.B.group.visible){o.B.group.visible=true;pop(o.B,0);}if(t>=o.u2)set(o.B,2);if(t>=o.u3)set(o.B,3);}
   if(t>=.42)set(K,2);if(t>=.74)set(K,3);
   // morning slides toward dusk, as the next part is night
   const k=Math.min(1,Math.max(0,(t-.2)/.8));PH.t=DUSK+6-(DUSK*.8+6)*k*k*(3-2*k);
   SH.cam({yaw:-.3+t*.55,pitch:.95-t*.1,dist:26-t*3,dx:0,dz:0,y:1});};})()`);
 await clip(p,'1-town',8.5);await p.close();}
// 2 hold the line: Raider Keep at night, a wave right at the wall and the gate, the towers shooting (at .8 speed)
if(want('wall')){const p=await L.open(env,SC.wall.map,W,H,D);await G(p,SC.wall.code);
 await G(p,`(()=>{paused=false;const Gt=buildings.find(B=>B.type==='gate'),q=center(Gt);const K=['spear','sword','spear','sword','archer','spear','xbow','sword'];for(let i=0;i<22;i++){const x=q.x-10+Math.random()*20,z=q.z-3-Math.random()*6;if(canStand(x,z,2))SH.spawn(K[i%K.length],1+(i%3),x,z);}SH.spawn('ram',3,q.x,q.z-2.4);SH.run(2.5);
  window.__tick=t=>SH.look(q.x,q.z-3.5-t*.8,{yaw:-.2+t*.3,pitch:.92,dist:17-t*2,y:1});})()`);
 await clip(p,'3-wall',6.5,{k:.8});await p.close();}
// 3 siege against siege by day: the town's engines already turned on the raiders' engines, the barracks' and stables' troops out in
// front of them holding off the raiders rushing them (at .8 speed)
if(want('siege')){const p=await L.open(env,'plains',W,H,D);
 await G(p,`(()=>{SH.town([['catapult',-4,-1,3,2],['catapult',4,-1,3,2],['catapult',0,-3,3,2],['catapult',-7,0,3,2],['ballista',-3,-5,3,2],['ballista',3,-5,3,2],['tower',-5,3,3],['tower',5,3,3],['house',-3,3,3],['house',3,3,3],['stores',-2,-3,1],['stores',2,-3,1],['torch',0,3,1],['stables',-9,2,3],['stables',9,2,3],['barracks',0,6,3],['house',-6,-8,2],['house',6,-8,2],['house',-1,-9,2],['house',4,-10,1]],50);UPK.lance=true;
  SH.run(5);SH.hud(false);for(const v of villagers){v.sleeping=false;v.hunger=0;}res.food=999;
  const E=buildings.filter(B=>B.type==='catapult'||B.type==='ballista');let x=0,z=0;for(const B of E){const c=center(B);x+=c.x;z+=c.z;}x/=E.length;z/=E.length;const fz=z-13;
  SH.clearTrees(x,z-6,26);for(const r of rocks)if(Math.hypot(r.x-x,r.z-z+8)<12)r.amount=0;seatRocks();cacheCells();
  SH.spawn('catapult',3,x-4,fz-1);SH.spawn('catapult',2,x+4.5,fz-.5);SH.spawn('ballista',3,x+1,fz+2.5);SH.spawn('ram',3,x-1.5,fz+3.5);
  SH.run(.5);assignPosts();
  // the riders start at their stables' door, so they are mounted by the time the clip begins
  for(const v of villagers)if(v.post&&v.post.B.type==='stables'){const d=doorPoint(v.post.B);v.x=v.rx=d.x;v.z=v.rz=d.z;}
  // the houses out in front are already battered, so the raiders tear them down in the clip
  for(const B of buildings)if(B.type==='house'&&center(B).z<z-10){B.hp=B.max*.3;}
  // riders wait behind the engines, then charge out at the clip's start to keep the raiders off the trebuchets
  const ST=buildings.filter(B=>B.type==='stables');for(const B of buildings)if(B.type==='barracks'||B.type==='stables')setRally(B,{x:x+(B.type==='stables'?(center(B).x<x?-2.5:2.5):0),z:z+1.5});
  const aim=()=>{const f=SH.foe(e=>ENEMY[e.kind].engine)||SH.foe();if(!f)return;for(const B of E){const q=center(B);if(B.turret)B.turret.rotation.y=Math.atan2(f.x-q.x,f.z-q.z)-B.group.rotation.y;}};
  for(let k=0;k<8;k++){aim();SH.run(.5);}
  // the foot come on behind their engines, still on their way when the clip starts
  const K=['spear','sword','spear','lancer','sword','xbow','spear','rider'];for(let i=0;i<24;i++){const ex=x-9+Math.random()*18,ez=fz-2-Math.random()*8;if(canStand(ex,ez,2))SH.spawn(K[i%K.length],2+(i%2),ex,ez);}
  for(let k=0;k<2;k++){aim();SH.run(.3);}for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=false;
  for(const B of buildings)if(B.bar)B.bar.grp.visible=false;const lo=updateLight;updateLight=(dt,now)=>{light=1;lo(dt,now);};
  const mx=x,mz=z-6.5;window.__ok=[x,z,SIZE].join(' ');
  // from the town's side, behind its engines (Jack), looking down steeply so little sky and none of the map's edge shows
  let rushed=0;window.__tick=t=>{if(!rushed&&t>.06){rushed=1;window.__ev.push([window.__fi||0,'rush',1]);for(const B of ST)setRally(B,{x:x+(center(B).x<x?-2.5:2.5),z:z-11});for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=false;}SH.look(mx,mz+1,{yaw:.35-t*.3,pitch:1.0,dist:20-t*2,y:1.5});};})()`);
 console.log('siege at',await G(p,'window.__ok'));await clip(p,'5-siege',7,{k:.8});await p.close();}
// a short black screen between the siege and the ending
if(want('black')){const p=await env.b.newPage({viewport:{width:W,height:H},deviceScaleFactor:D});await p.setContent('<html><body style="margin:0;background:#000"></body></html>');
 for(let i=0;i<15;i++)await shot(p,'6-black',i);fs.writeFileSync(`${OUT}/6-black.json`,'[]');console.log('black 15');await p.close();}
// 5 the title over the Blighted Isle, and "Your castle awaits" under it, big and gold
if(want('title')){const p=await L.open(env,SC.title.map,W,H,D);await G(p,SC.title.code);await p.waitForTimeout(3000);
 await p.evaluate(()=>{const t=document.querySelector('.gameTitle'),cs=getComputedStyle(t),d=document.createElement('div');d.id='awaits';d.innerHTML='<span>Your castle awaits</span>';
  d.style.cssText='position:fixed;left:0;right:0;bottom:0;height:36%;display:flex;align-items:center;justify-content:center;z-index:9998;opacity:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55) 45%,rgba(0,0,0,.7))';
  const s=d.firstChild;s.style.cssText=`display:inline-block;font-family:${cs.fontFamily};color:#f6d77a;font-size:${parseFloat(cs.fontSize)*1.05}px;letter-spacing:.03em;-webkit-text-stroke:2px #3a2009;paint-order:stroke fill;text-shadow:0 3px 14px rgba(0,0,0,.9),0 0 22px rgba(243,207,110,.35)`;document.body.appendChild(d);});
 await G(p,`window.__tick=t=>{const d=document.getElementById('awaits');if(d){const k=Math.min(1,Math.max(0,(t-.22)/.25));d.style.opacity=k;d.firstChild.style.transform='scale('+(1.08-.08*k)+')';}}`);
 await clip(p,'8-title',3,{fin:20,fout:0});await p.close();}
await env.b.close();env.server.close();})();
