// node shots.js W H DSF prefix [scene...]
const L=require('./lib');const [W,H,D,PRE]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];const only=process.argv.slice(6);
const want=s=>!only.length||only.includes(s);
const snap=async(p,name,wait=3000)=>{await p.waitForTimeout(wait);await p.screenshot({path:`${PRE}-${name}.png`});console.log('shot',name,p.errs.slice(0,2));};
const G=(p,code)=>p.evaluate(c=>G(c),code);
(async()=>{const env=await L.start();
if(want('hero')){const p=await L.open(env,'vale',W,H,D);
 await G(p,`SH.town([['house',-3,-1,3],['house',-3,1,3],['house',-2,3,2],['house',3,1,3],['house',3,-1,2],['house',-4,3,2],['house',4,3,3],['house',-5,0,2],['farm',-7,-2,3],['farm',-7,2,2],['lodge',-6,6,3],['quarry',6,6,2],['market',1,5,3],['tower',-3,-4,3],['tower',3,-4,3],['tower',6,-1,2],['barracks',0,-5,3],['torch',-1,2,1],['torch',1,2,1],['campfire',-2,7,1],['flowers',-4,1,1],['flowers',4,1,1],['well',4,5,1],['statue',-2,-3,1],['banner',2,-3,1]],8)`);
 await G(p,'SH.roads();SH.run(45);SH.hud(false);SH.cam({yaw:.5,pitch:.74,dist:38})');await snap(p,'1hero',4000);await p.close();}
if(want('wall')){const p=await L.open(env,'bridge',W,H,D);
 await G(p,`(()=>{const b=bridges[0],bci=Math.floor(b.ex/CELL);
  for(const n of BANK_WALL){if(occB[n])continue;const ci=n%N,cj=(n/N)|0;place(ci===bci?'gate':'wall',ci,cj,{instant:true,free:true,quiet:true});}
  for(const B of buildings)if(B.type==='wall'||B.type==='gate'){B.tier=2;B.max=DEF[B.type].hp[1];B.hp=B.max;swapModel(B);}
  SH.town([['house',-3,1,2],['house',3,1,2],['house',-3,3,3],['house',3,3,3],['house',-5,2,2],['house',5,2,2],['tower',-2,-4,3],['tower',2,-4,3],['barracks',0,4,2],['farm',-7,5,2],['lodge',7,5,2],['torch',-1,-3,1],['torch',1,-3,1],['rack',2,-2,1],['banner',-2,-2,1]],16);
  SH.run(5);SH.hud(true);SPAWN_GAP=.15;
  spawnRaiders([...Array(26)].map(()=>['spear',3]).concat([...Array(16)].map(()=>['sword',3]),[...Array(6)].map(()=>['archer',3]),[['rider',3],['rider',3],['lancer',3],['ram',3],['ram',3]]));SH.run(20);SH.freeze(.45);
  const f=SH.foe(e=>e.z>stoneRiverZ(e.x)+2)||SH.foe();SH.look(f.x,f.z+3,{yaw:Math.PI+.25,pitch:.8,dist:27});})()`);
 await snap(p,'2wall');await p.close();}
if(want('siege')){const p=await L.open(env,'vale',W,H,D);
 await G(p,`(()=>{SH.town([['catapult',-3,-4,3],['catapult',3,-4,3],['catapult',0,-6,2],['ballista',-6,-3,3],['ballista',6,-3,3],['tower',-4,-1,3],['tower',4,-1,3],['house',-3,2,3],['house',3,2,3],['house',-5,3,2],['house',5,3,2],['stores',-1,-3,1],['stores',1,-3,1],['torch',0,3,1],['barracks',0,5,3]],18);
  SH.run(5);SH.hud(true);SPAWN_GAP=.25;
  spawnRaiders([['catapult',3],['ram',3],['ballista',3],['catapult',2],['ram',2]].concat([...Array(18)].map(()=>['spear',3]),[...Array(10)].map(()=>['sword',3]),[...Array(5)].map(()=>['xbow',3])));SH.run(10);for(let k=0;k<300;k++){const st=arrows.filter(a=>a.kind==='stone'&&a.t>.25&&a.t<.6).length;if(st>=2)break;SH.run(.1);}SH.freeze(.45);
  const f=SH.foe();const T=buildings.filter(B=>B.type==='catapult');let x=0,z=0;for(const B of T){const c=center(B);x+=c.x;z+=c.z;}x/=T.length;z/=T.length;
  SH.look(x*.55+f.x*.45,z*.55+f.z*.45,{yaw:Math.atan2(f.x-x,f.z-z)+Math.PI,pitch:.55,dist:28,y:2});})()`);
 await snap(p,'3siege');await p.close();}
if(want('boss')){const p=await L.open(env,'hold',W,H,D);
 await G(p,`(()=>{SH.town([['tower',-4,-4,3],['tower',4,-4,3],['crossbow',-7,-2,3],['crossbow',7,-2,3],['house',-3,2,3],['house',3,2,3],['house',-5,3,3],['house',5,3,3],['stables',0,-6,3],['barracks',-6,4,3],['torch',-1,-3,1],['torch',1,-3,1],['banner',0,-3,1]],20);
  SH.run(5);SH.hud(true);SPAWN_GAP=.12;
  spawnRaiders([...Array(8)].map(()=>['rider',3]).concat([...Array(14)].map(()=>['sword',3]),[['warlord',3]]));
  for(let k=0;k<80;k++){SH.run(.5);const w=enemies.find(e=>e.kind==='warlord'&&!e.dead);if(w){const c=center(castleB());if(Math.hypot(w.x-c.x,w.z-c.z)<26)break;}}
  SH.freeze(.45);const w=enemies.find(e=>e.kind==='warlord'&&!e.dead)||enemies[0];SH.look(w.x,w.z+2,{yaw:Math.PI+.4,pitch:.6,dist:15,y:1.5});})()`);
 await snap(p,'4boss');await p.close();}
const STARS={vale:3,bridge:3,cross:3,watch:2,dune:3,bend:2};
if(want('camp')){const p=await env.b.newPage({viewport:{width:W,height:H},deviceScaleFactor:D,hasTouch:true});p.errs=[];
 await p.goto(env.base);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('mtd-stars',JSON.stringify(s));localStorage.setItem('mtd-upg',JSON.stringify(['tax','homes','seed','axes','qvolley']));localStorage.setItem('mtd-story',JSON.stringify(Object.fromEntries(Object.keys(s).map(k=>[k,1]))));},STARS);
 await p.goto(env.base);await p.waitForTimeout(5000);await p.click('#campBtn');await p.waitForTimeout(1200);await p.click('#cPrev').catch(()=>{});await p.waitForTimeout(600);await p.click('#cPrev').catch(()=>{});await p.waitForTimeout(1500);await snap(p,'5camp');
 await p.click('#campUpBtn');await p.waitForTimeout(800);await p.evaluate(()=>{});await snap(p,'6upgrades');await p.close();}
await env.b.close();env.server.close();})();
