// the four game scenes for the store pictures (landscape), each rebuilt from Jack's own reference screenshot
module.exports={
// 1 Build your town: Market Cross, a big tier-3 walled town round the castle, a grid of roads, by day
hero:{map:'cross',code:`(()=>{const K=castleB();SH.face(K,0);const c=center(K),ci=Math.floor(c.x/CELL),cj=Math.floor(c.z/CELL);
  SH.walls([[ci-7,cj-8],[ci+9,cj-8],[ci+9,cj+7],[ci-7,cj+7],[ci-7,cj-8]],3,[[ci+1,cj+7],[ci+9,cj]]);
  for(const [a,b] of [[ci-7,cj-8],[ci+9,cj-8],[ci+9,cj+7],[ci-7,cj+7]]){}
  SH.town([['tower',-6,-7,3,0],['tower',8,-7,3,0],['tower',-6,6,3,0],['tower',8,6,3,0],['crossbow',4,-7,3,0],['crossbow',8,2,3,0],
   ['house',-3,3,3,0],['house',3,3,3,0],['house',-4,-3,3,0],['house',4,-4,2,0],['house',6,4,3,0],['house',-5,0,2,0],['house',6,-1,3,0],['house',1,-6,3,0],
   ['farm',4,0,3,0],['market',2,5,3,0],['lodge',-4,5,3,0],['quarry',-3,-6,2,0],['statue',-2,2,1,0],['flowers',-2,-2,1,0],['flowers',2,-2,1,0],['flowers',7,4,1,0],
   ['torch',-2,3,1,0],['torch',2,3,1,0],['torch',5,-3,1,0],['well',6,-4,1,0],['barracks',-5,-5,3,0]],30);
  layRoads([[[c.x,c.z+3.2],[c.x,c.z+15]],[[c.x-12,c.z+6],[c.x+18,c.z+6]],[[c.x+7,c.z-12],[c.x+7,c.z+12]],[[c.x-8,c.z-6],[c.x+14,c.z-6]],[[c.x+7,c.z],[c.x+18,c.z]]]);rebuildRoads();cacheCells();
  SH.run(40);SH.hud(false);SH.freeze(1);SH.cam({yaw:.4,pitch:1,dist:24,dx:2.5,dz:2,y:1});})()`},
// 2 Hold the walls: Raider Keep at night, the wall and gatehouse with manned towers, troops rallied behind the gate, raider siege coming
wall:{map:'keep',code:`(()=>{const K=castleB(),c=center(K),ci=Math.floor(c.x/CELL),cj=Math.floor(c.z/CELL),wj=cj-7;
  SH.walls([[ci-7,wj],[ci+7,wj]],3,[[ci,wj]]);
  SH.town([['tower',-3,-6,3,0],['tower',3,-6,3,0],['crossbow',-6,-6,3,0],['crossbow',6,-6,3,0],['barracks',-3,-3,3,0],['stables',3,-3,3,0],['butts',-6,-3,1,0],['stores',-7,-3,1,0],['banner',6,-4,1,0],['torch',-1,-5,1,0],['torch',1,-5,1,0]],40);
  SH.run(3);SH.hud(false);const h=SH.spawn('spear',1,c.x,c.z-40);h.speed=0;h.hp=h.max=1e9;h.g.visible=false;
  for(const v of villagers){v.sleeping=false;v.hunger=0;}res.food=999;SH.run(1);assignPosts();SH.run(10);assignPosts();SH.run(15);
  const gx=(ci+.5)*CELL,gz=wj*CELL;for(const B of buildings)if(B.type==='barracks'||B.type==='stables')setRally(B,{x:gx+(B.type==='stables'?1.2:-1),z:gz+4.5});SH.run(14);for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=true;
  SH.spawn('catapult',3,gx-2.5,gz-9);SH.spawn('ballista',3,gx-6,gz-7.5);SH.spawn('ram',3,gx+2.5,gz-6);for(const [k,x,z] of [['sword',gx+1,gz-4.5],['spear',gx-2,gz-5],['spear',gx+5,gz-7],['archer',gx-5,gz-10],['rider',gx+6,gz-10],['sword',gx+.5,gz-8]])SH.spawn(k,3,x,z);
  SH.run(.6);h.dead=true;scene.remove(h.g);enemies.splice(enemies.indexOf(h),1);
  SH.freeze(.2);SH.look(gx,gz-1.5,{yaw:0,pitch:.62,dist:17,y:1});})()`},
// 3 Raise siege engines: Siegeford by day by the river, catapult, mangonel and trebuchet side by side, crewed and loosing
siege:{map:'ford',code:`(()=>{const K=castleB(),c=center(K);let bz=c.z;while(bz>2&&hAt(c.x,bz)>.35)bz-=.5;const ci=Math.floor(c.x/CELL),bj=Math.floor((bz+5)/CELL),cj=Math.floor(c.z/CELL),dj=bj-cj+1;
  SH.town([['catapult',-2,dj,1,2],['catapult',0,dj,2,2],['catapult',2,dj,3,2],['tower',4,dj-1,3,0],['banner',-4,dj,1,0],['banner',5,dj+1,1,0],['stores',-3,dj+1,1,0]],30);
  
  SH.run(3);SH.hud(false);const h=SH.spawn('spear',1,c.x,2);h.speed=0;h.hp=h.max=1e9;h.g.visible=false;
  for(const v of villagers){v.sleeping=false;v.hunger=0;}res.food=999;SH.run(1);assignPosts();SH.run(12);assignPosts();SH.run(25);assignPosts();SH.run(20);
  for(const [k,dx,dz] of [['spear',-4,-13],['sword',0,-14],['spear',3,-15],['lancer',-1,-17],['spear',6,-16]])SH.spawn(k,2,c.x+dx,bz+dz);
  const ENG=buildings.filter(B=>B.type==='catapult');{const f=SH.foe();for(const B of ENG){B.cd=Math.random()*.8;const q=center(B);if(B.turret)B.turret.rotation.y=Math.atan2(f.x-q.x,f.z-q.z)-B.group.rotation.y;}}
  h.dead=true;scene.remove(h.g);enemies.splice(enemies.indexOf(h),1);
  let ok=0;for(let k=0;k<80;k++){if(arrows.some(a=>a.kind==='stone'&&a.t>.25&&a.t<.5)){ok=1;break;}SH.run(.05);}window.__ok='stone '+ok+' crews '+ENG.map(B=>(B.manned||[]).filter(Boolean).length).join(',')+' pos '+JSON.stringify(buildings.filter(B=>/cat|tower/.test(B.type)).map(B=>{const q=center(B);return [B.type,(q.x-c.x).toFixed(0),(q.z-c.z).toFixed(0)]}))+' bz '+(bz-c.z).toFixed(1);
  const E=ENG[1],q=center(E);for(const B of buildings)if((B.type==='wall'||B.type==='gate')){const w=center(B);if(Math.abs(w.x-q.x)<9&&w.z>q.z-1)B.group.visible=false;}SH.clearTrees(q.x,q.z+2,8);SH.freeze(1);SH.look(q.x+.5,q.z+.5,{yaw:-.15,pitch:.48,dist:9.5,y:hAt(q.x,q.z)+1.4});})()`},
// 4 Defeat the Warlord: his model as the Archive shows it, big
boss:{map:'vale',code:`(()=>{SH.hud(false);document.querySelector('canvas').style.visibility='hidden';document.body.style.background='radial-gradient(ellipse at 50% 40%,#4a3820 0%,#21180c 60%,#0e0904 100%)';SH.archive('r','warlord',3,.55,.72);})()`},
};
