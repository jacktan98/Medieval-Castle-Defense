// node reddit.js W H DSF out-dir [part...]: a short gameplay video for Reddit (Jack): one place, Stonebridge, with the game's own
// top panel showing: the town grows behind its river wall by day, at dusk the horn sounds and the villagers run to their posts,
// at night a big wave is held on the bridge, then the title. Frames and sound logs like trailer.js; join with
// node mix.js out-dir out.mp4 (reads the out-dir's mix.json, written here). Parts: town dusk wall title (the first three share
// one game, so render them together)
const L=require('./lib');const SC=require('./scenes');const fs=require('fs');
const [W,H,D,OUT]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];const only=process.argv.slice(6);
const FPS=30;fs.mkdirSync(OUT,{recursive:true});
const G=(p,c)=>p.evaluate(c=>G(c),c);
const own=p=>p.evaluate(()=>G(`adaptResolution=()=>{};window.__T=window.__T||performance.now();window.requestAnimationFrame=cb=>{window.__cb=cb;return 1;};`));
const step=(p,k=1)=>p.evaluate(k=>{const cb=window.__cb;window.__cb=null;window.__T+=1000/30*k;if(cb)cb(window.__T);},k);
const hear=p=>G(p,`(()=>{if(window.__heard)return;window.__heard=1;window.__ev=[];const o=sfx;sfx=(n,at,v)=>{let g=v===undefined?1:v;if(at&&at.x!==undefined){const d=Math.hypot(at.x-target.x,at.z-target.z);g*=d<7?1:Math.max(.12,1-(d-7)/28);}window.__ev.push([window.__fi||0,n,g]);return o(n,at,v);};})()`);
const fade=(p,o)=>p.evaluate(o=>{let d=document.getElementById('fadeDiv');if(!d){d=document.createElement('div');d.id='fadeDiv';d.style.cssText='position:fixed;inset:0;background:#000;z-index:9999;pointer-events:none';document.body.appendChild(d);}d.style.opacity=o;},o);
const capSet=(p,c)=>p.evaluate(([c,W,H])=>{let d=document.getElementById('capDiv');if(!d){const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&display=block';document.head.appendChild(l);
  d=document.createElement('div');d.id='capDiv';const u=Math.min(W,H*1.6);d.style.cssText='position:fixed;left:0;bottom:0;width:70%;height:60%;z-index:9990;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 0% 100%,rgba(10,6,2,.78) 0%,rgba(10,6,2,.38) 45%,rgba(10,6,2,0) 75%)';
  d.innerHTML='<div style="position:absolute;left:'+Math.round(u*.045)+'px;bottom:'+Math.round(u*.04)+'px;font-family:\'IM Fell English SC\',serif;color:#f6d77a;line-height:.92;text-shadow:0 0 2px #2a1606,0 '+Math.round(u*.004)+'px 0 #2a1606,0 '+Math.round(u*.008)+'px '+Math.round(u*.018)+'px rgba(0,0,0,.85);-webkit-text-stroke:'+Math.max(1,Math.round(u*.0022))+'px #3a2009;paint-order:stroke fill"><b style="display:block;font-weight:400;font-size:'+Math.round(u*.075)+'px"></b><span style="display:block;font-size:'+Math.round(u*.055)+'px;color:#fff1c8"></span></div>';document.body.appendChild(d);}
  d.querySelector('b').textContent=c[0];d.querySelector('span').textContent=c[1];return document.fonts.ready.then(()=>1);},[c,W,H]);
const capShow=(p,o)=>p.evaluate(o=>{const d=document.getElementById('capDiv');if(d){d.style.opacity=o;d.firstChild.style.transform='translateY('+(1-o)*14+'px)';}},o);
const shot=(p,name,i)=>p.screenshot({path:`${OUT}/${name}-${String(i).padStart(4,'0')}.png`});
// every: render only every n-th frame (a quick look at a part)
const EVERY=+process.env.EVERY||1;
async function clip(p,name,secs,{fin=0,fout=0,k=1,cap=null,capT=3}={}){await own(p);await hear(p);if(cap){await capSet(p,cap);await p.waitForTimeout(700);}await G(p,`barOn=()=>false;for(const e of enemies)if(e.dead)e.__g=1;`);const n=Math.round(secs*FPS),c1=capT*FPS;
 await p.evaluate(()=>{window.__ev=[];});
 for(let i=0;i<n;i++){const t=i/(n-1);await p.evaluate(([t,i])=>{window.__fi=i;G('window.__tick&&__tick('+t+');for(const e of enemies)if(e.dead&&!e.__g){e.__g=1;window.__ev.push([window.__fi,\'kill\',1]);}');},[t,i]);await step(p,k);
  if(i%EVERY)continue;await capShow(p,cap?Math.max(0,Math.min(1,(i-6)/10,(c1-i)/12)):0);await fade(p,Math.max(0,fin?1-i/fin:0,fout?1-(n-1-i)/fout:0));await shot(p,name,i);}
 const ev=await p.evaluate(()=>window.__ev||[]);fs.writeFileSync(`${OUT}/${name}.json`,JSON.stringify(ev));console.log('clip',name,n,p.errs.slice(0,2));}
const want=s=>!only.length||only.includes(s);
(async()=>{const env=await L.start();
if(want('town')||want('dusk')||want('wall')){const p=await L.open(env,'bridge',W,H,D);
 // the town behind the bank wall: its gaps closed, a gate at the bridge, towers and siege behind it
 await G(p,`(()=>{const K=castleB(),c=center(K),b=bridges[0],bci=Math.floor(b.ex/CELL);for(const B of buildings)B.__old=1;weatherReset(null);
  for(const n of BANK_WALL)if(!occB[n]){const ci=n%N,cj=(n-ci)/N;place(ci===bci?'gate':'wall',ci,cj,{instant:true,free:true,quiet:true});}refreshWalls();
  SH.clearTrees(c.x,c.z-3,13);for(const r of rocks)if(Math.hypot(r.x-c.x,r.z-c.z+4)<11)r.amount=0;seatRocks();cacheCells();
  SH.town([['tower',-1,-6,3,0],['tower',3,-6,3,0],['torch',0,-6,1,0],['torch',2,-6,1,0],['ballista',2,-5,3,0],['crossbow',-3,-6,3,0],['crossbow',5,-5,3,0],
   ['catapult',-2,-4,3,0],['catapult',4,-4,3,0],['stores',0,-4,1,0],['barracks',-5,-4,3,0],['stables',6,-3,3,0],['rack',-3,-3,1,0],['banner',5,-1,1,0],
   ['house',-3,0,3,0],['house',-3,2,2,0],['house',3,0,3,0],['house',3,2,3,0],['house',-1,3,3,0],['house',1,3,2,0],['house',-5,0,3,0],['house',5,1,2,0],
   ['market',5,3,3,0],['farm',-6,3,3,0],['farm',-1,5,2,0],['lodge',-8,0,2,0],['well',-2,-2,1,0],['campfire',2,-2,1,0],['flowers',-2,2,1,0],['statue',0,2,1,0]],13);
  layRoads([[[c.x,c.z+3.2],[c.x,c.z+9]],[[c.x+3.4,c.z-2],[b.ex+.6,c.z-6],[b.ex+.6,b.ez+3]]]);rebuildRoads();cacheCells();
  res.food=999;res.gold=420;res.wood=310;res.stone=180;SH.run(40);for(const v of villagers){v.sleeping=false;v.hunger=0;}SH.hud('top');
  let s=document.createElement('style');s.textContent='#raidMark0,#raidMark1,#wavePop,.hitMark{display:none!important}';document.head.appendChild(s);
  window.__ok=buildings.length+' buildings, '+villagers.length+' villagers';})()`);
 console.log(await G(p,'window.__ok'),p.errs.slice(0,3));
 // 1 by day: everything but the old palisade comes up nearest the castle first and is upgraded, each on its own time
 await G(p,`(()=>{const K=castleB(),c=center(K);let s=11;const R=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  const L=buildings.filter(B=>B!==K).map(B=>({B,t:B.tier||1,old:B.__old,d:Math.hypot(center(B).x-c.x,center(B).z-c.z)+(B.type==='wall'||B.type==='gate'?5:0)})).sort((a,b)=>a.d-b.d);
  const W=L.filter(o=>o.B.type==='wall'||o.B.type==='gate');
  L.forEach((o,i)=>{o.a=o.old?-1:.03+.5*i/L.length;o.u2=o.t>=2?Math.min(.9,Math.max(o.a,0)+.12+R()*.35):9;o.u3=o.t>=3?Math.min(.96,o.u2+.1+R()*.25):9;});
  // the wall rises as one: stone from the gate outward, then battlements
  for(const o of W){const far=Math.abs(center(o.B).x-bridges[0].ex)/SIZE;o.t=3;o.u2=.5+far*.25;o.u3=.74+far*.2;}
  const pop=(B,up)=>{B.pop=window.__T;const q=center(B);for(let n=0;n<6;n++){const a=n/6*6.283;dustAt(q.x+Math.cos(a)*1.2,hAt(q.x,q.z),q.z+Math.sin(a)*1.2);}
   if(B===K){window.__ev.push([window.__fi||0,'castleUp',1]);return;}if(B.type!=='wall')sfx('build',{x:q.x,z:q.z},up?.55:.7);};
  const set=(B,t)=>{if(B.tier>=t)return;B.tier=t;B.max=DEF[B.type].hp[t-1];B.hp=B.max;swapModel(B);if(B.type==='wall'||B.type==='gate')refreshWalls();pop(B,1);};
  for(const o of L){o.B.tier=1;o.B.max=DEF[o.B.type].hp[0];o.B.hp=o.B.max;swapModel(o.B);if(!o.old)o.B.group.visible=false;}K.tier=1;swapModel(K);refreshWalls();for(const o of L)if(!o.old)o.B.group.visible=false;
  paused=false;PH.kind='day';PH.wave=2;
  window.__tick=t=>{for(const o of L){if(t>=o.a&&!o.B.group.visible){o.B.group.visible=true;pop(o.B,0);}if(t>=o.u2)set(o.B,2);if(t>=o.u3)set(o.B,3);}
   if(t>=.4)set(K,2);if(t>=.72)set(K,3);
   const k=Math.min(1,Math.max(0,(t-.3)/.7));PH.t=DUSK+40-(DUSK+28)*k*k*(3-2*k);
   SH.look(c.x,c.z-5,{yaw:-.42+t*.5,pitch:.98-t*.12,dist:37-t*5,y:1});};})()`);
 if(want('town'))await clip(p,'1-town',7,{fin:8,k:1.5,cap:['By day','build your town']});else{await own(p);await hear(p);await G(p,'__tick(1)');}
 // 2 dusk: the horn, and every villager runs to a post: towers, the castle, the engines, the barracks and the stables
 await G(p,`(()=>{const c=center(castleB()),b=bridges[0];WAVES[1]={spear:[20,12],sword:[10,8],archer:[6,3],lancer:[0,6],ram:[1]};SPAWN_GAP=.16;PH.wave=2;PH.kind='day';PH.t=2.4;nextPts=null;
  const lo=updateLight;updateLight=(dt,now)=>{lo(dt,now);if(light<.42){light=.42;lo(0,now);}};
  for(const B of buildings)if(B.type==='barracks'||B.type==='stables')setRally(B,{x:b.ex+(B.type==='stables'?.5:-.4),z:b.ez+(B.type==='stables'?.2:1)});
  window.__tick=t=>{for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=false;SH.look(b.ex-1,c.z-10.5+t*1.5,{yaw:.1-t*.14,pitch:.84,dist:24-t*2,y:1});};})()`);
 if(want('dusk'))await clip(p,'2-dusk',5.5,{k:2,cap:['At dusk','villagers take up arms']});else{await own(p);for(let i=0;i<165;i++){await G(p,'__tick('+i/164+')');await step(p,2);}}
 console.log('night',await G(p,`PH.kind+' foes '+enemies.length+' queue '+spawnQueue.length+' posted '+villagers.filter(v=>v.post).length+' lead z '+Math.max(0,...enemies.map(e=>e.z)).toFixed(1)`));
 // 3 night: the wave comes over the bridge into the towers', the ballista's and the trebuchets' reach; an arrow volley on the way
 await G(p,`(()=>{const c=center(castleB()),b=bridges[0];let v1=0,v2=0;const HPK=+'${process.env.HPK||3}';const mid=()=>SH.foe(e=>e.z<b.z0+.5&&e.z>b.z0-7)||SH.foe();
  const tough=()=>{for(const e of enemies)if(!e.__b){e.__b=1;if(!ENEMY[e.kind].engine)e.hp=e.max=e.max*HPK;}};window.__tough=tough;
  window.__tick=t=>{tough();for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=false;
   if(!v1&&t>.3){v1=1;const f=mid();if(f)castVolley({x:f.x,z:f.z});}if(!v2&&t>.78){v2=1;volleyCd=0;const f=mid();if(f)castVolley({x:f.x,z:f.z});}
   SH.look(b.x0+b.dx*b.L*(.5+t*.22),b.z0+b.dz*b.L*(.5+t*.22),{yaw:-.95+t*.35,pitch:.8,dist:23-t*3,y:1.5});};})()`);
 await own(p);for(let i=0;i<(+process.env.PRE||60);i++){await G(p,'__tough();');await step(p,2);}
 if(want('wall'))await clip(p,'3-wall',12,{fout:10,cap:['By night','hold the bridge']});
 console.log('end',await G(p,`'foes left '+enemies.filter(e=>!e.dead).length+' queue '+spawnQueue.length`),p.errs.slice(0,3));await p.close();}
// 4 the title, and where to get it
if(want('title')){const p=await L.open(env,SC.title.map,W,H,D);await G(p,SC.title.code);
 await p.addStyleTag({content:'.gameTitle{top:9vh!important}'});await p.waitForTimeout(3000);
 await p.evaluate(()=>{const t=document.querySelector('.gameTitle'),cs=getComputedStyle(t),d=document.createElement('div');d.id='awaits';d.innerHTML='<span>Free on iPhone and iPad</span>';
  d.style.cssText='position:fixed;left:0;right:0;bottom:0;height:36%;display:flex;align-items:center;justify-content:center;z-index:9998;opacity:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55) 45%,rgba(0,0,0,.7))';
  const s=d.firstChild;s.style.cssText=`display:inline-block;font-family:${cs.fontFamily};color:#f6d77a;font-size:${parseFloat(cs.fontSize)*.9}px;letter-spacing:.03em;-webkit-text-stroke:2px #3a2009;paint-order:stroke fill;text-shadow:0 3px 14px rgba(0,0,0,.9),0 0 22px rgba(243,207,110,.35)`;document.body.appendChild(d);});
 await G(p,`window.__tick=t=>{const d=document.getElementById('awaits');if(d){const k=Math.min(1,Math.max(0,(t-.3)/.25));d.style.opacity=k;d.firstChild.style.transform='scale('+(1.08-.08*k)+')';}}`);
 await clip(p,'8-title',3.5,{fin:14});await p.close();}
// the soundtrack's plan for mix.js
fs.writeFileSync(`${OUT}/mix.json`,JSON.stringify({music:[['music/Medieval_theme_music_2.mp3','1-town','2-dusk',.13,35,2.2],['music/Night_theme_music.mp3','2-dusk','3-wall',.2,4,2.2,1.2],['music/Medieval_theme_music_2.mp3','8-title','8-title',.13,35]],
 beds:[['sfx/Bird_chirping.mp3','1-town',.26],['sfx/River_water_flow.mp3','2-dusk',.5],['sfx/River_water_flow.mp3','3-wall',.4],['sfx/Fire_sound.mp3','3-wall',1.1]],horn:false,
 keep:{'1-town':['castleUp','build'],'2-dusk':['horn'],'3-wall':['ramHit','kill','arrow','qbolt','rockFire','rockHit','bolt','clash'],'8-title':[]}}));
await env.b.close();env.server.close();})();
