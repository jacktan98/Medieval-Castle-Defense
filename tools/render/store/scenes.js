// the four game scenes for the store pictures (landscape), each rebuilt from Jack's own reference screenshot
module.exports={
// 1 Build your town: Market Cross, a big tier-3 walled town round the castle, a grid of roads, by day
hero:{map:'cross',code:`(()=>{for(const B of buildings.slice())removeBuilding(B,false,true);for(const v of villagers)scene.remove(v.g);villagers.length=0;road.fill(0);rebuildRoads();cacheCells();regionDirty=true;
  const ev0=findValid('castle',Math.floor(N/2)-1,Math.floor(N/2)-1,{free:true});const K=place('castle',ev0.ci,ev0.cj,{instant:true,free:true,quiet:true});for(let n=0;n<3;n++)makeVillager(K);SH.face(K,0);const c=center(K),ci=Math.floor(c.x/CELL),cj=Math.floor(c.z/CELL);SH.clearTrees(c.x+2,c.z,20);
  SH.walls([[ci-7,cj-8],[ci+9,cj-8],[ci+9,cj+7],[ci-7,cj+7],[ci-7,cj-8]],3,[[ci+1,cj+7],[ci+9,cj]]);
  for(const [a,b] of [[ci-7,cj-8],[ci+9,cj-8],[ci+9,cj+7],[ci-7,cj+7]]){}
  SH.town([['tower',-6,-7,3,0],['tower',8,-7,3,0],['tower',-6,6,3,0],['tower',8,6,3,0],['crossbow',4,-7,3,0],['crossbow',8,2,3,0],
   ['house',-3,3,3,0],['house',3,3,3,0],['house',-4,-3,3,0],['house',4,-4,2,0],['house',6,4,3,0],['house',-5,0,2,0],['house',6,-1,3,0],['house',1,-6,3,0],
   ['farm',4,0,3,0],['market',2,5,3,0],['lodge',-4,5,3,0],['quarry',-3,-6,2,0],['statue',-2,2,1,0],['flowers',-2,-2,1,0],['flowers',2,-2,1,0],['flowers',7,4,1,0],
   ['torch',-2,3,1,0],['torch',2,3,1,0],['torch',5,-3,1,0],['well',6,-4,1,0],['barracks',-5,-5,3,0],['lodge',-2,-4,3,0],['quarry',2,-4,3,0],['lodge',-4,1,3,0],['lodge',4,1,3,0],['quarry',-4,4,3,0],['lodge',4,4,3,0],['house',0,4,3,0],['house',-1,6,2,0],['house',1,6,3,0],['farm',-6,2,2,0],['market',5,-6,3,0],['house',-6,-1,3,0],['house',7,1,2,0],['flowers',-1,3,1,0],['flowers',1,3,1,0],['banner',0,-3,1,0],['campfire',-3,-1,1,0],['well',3,-1,1,0]],40);
  layRoads([[[c.x,c.z+3.2],[c.x,c.z+15]],[[c.x-12,c.z+6],[c.x+18,c.z+6]],[[c.x+7,c.z-12],[c.x+7,c.z+12]],[[c.x-8,c.z-6],[c.x+14,c.z-6]],[[c.x+7,c.z],[c.x+18,c.z]]]);rebuildRoads();cacheCells();
  window.__ok=JSON.stringify(buildings.filter(B=>/lodge|quarry|farm|market/.test(B.type)).map(B=>{const q=center(B);return [B.type,Math.round(q.x-c.x),Math.round(q.z-c.z)]}));SH.run(40);SH.hud(false);SH.freeze(1);SH.cam({yaw:.15,pitch:.9,dist:20,dx:0,dz:.5,y:1});})()`},
// 2 Hold the walls: Raider Keep at night, the wall and gatehouse with manned towers, troops rallied behind the gate, raider siege coming
wall:{map:'keep',code:`(()=>{const K=castleB(),c=center(K),ci=Math.floor(c.x/CELL),cj=Math.floor(c.z/CELL),wj=cj-7;
  SH.walls([[ci-16,wj],[ci+16,wj]],3,[[ci,wj]]);
  SH.town([['tower',-3,-6,3,0],['tower',3,-6,3,0],['crossbow',-6,-6,3,0],['crossbow',6,-6,3,0],['barracks',-3,-3,3,0],['stables',3,-3,3,0],['butts',-6,-3,1,0],['stores',-7,-3,1,0],['banner',6,-4,1,0],['torch',-1,-5,1,0],['torch',1,-5,1,0]],40);
  SH.run(3);SH.hud(false);const h=SH.spawn('spear',1,c.x,c.z-40);h.speed=0;h.hp=h.max=1e9;h.g.visible=false;
  for(const v of villagers){v.sleeping=false;v.hunger=0;}res.food=999;SH.run(1);assignPosts();SH.run(10);assignPosts();SH.run(15);
  const gx=(ci+.5)*CELL,gz=wj*CELL;for(const B of buildings)if(B.type==='barracks'||B.type==='stables')setRally(B,{x:gx+(B.type==='stables'?1.2:-1),z:gz+4.5});SH.run(14);for(const B of buildings)if(B.rallyFlag)B.rallyFlag.visible=true;
  for(const [k,x,z] of [['spear',gx-8,gz-6],['spear',gx-7,gz-7.5],['sword',gx+7,gz-5],['spear',gx+8.5,gz-6.5],['archer',gx-3,gz-12],['xbow',gx+3,gz-13],['lancer',gx-9,gz-11],['spear',gx+1,gz-11]])SH.spawn(k,2,x,z);SH.spawn('catapult',3,gx-2.5,gz-9);SH.spawn('ballista',3,gx-6,gz-7.5);SH.spawn('ram',3,gx+2.5,gz-6);for(const [k,x,z] of [['sword',gx+1,gz-4.5],['spear',gx-2,gz-5],['spear',gx+5,gz-7],['archer',gx-5,gz-10],['rider',gx+6,gz-10],['sword',gx+.5,gz-8]])SH.spawn(k,3,x,z);
  SH.run(.6);h.dead=true;scene.remove(h.g);enemies.splice(enemies.indexOf(h),1);
  for(const B of buildings)if(B.type==='tower'||B.type==='crossbow'){const q=center(B),L=new THREE.PointLight(0xffb060,2.2,9,1.6);L.position.set(q.x,hAt(q.x,q.z)+5.2,q.z+1.2);scene.add(L);}SH.freeze(.3);SH.look(gx,gz-3,{yaw:0,pitch:.74,dist:20,y:1});})()`},
// 3 Raise siege engines: Siegeford by day by the river, catapult, mangonel and trebuchet side by side, crewed and loosing
siege:{map:'ford',code:`(()=>{const K=castleB(),c=center(K);let bz=c.z;while(bz>2&&hAt(c.x,bz)>.35)bz-=.5;const cj=Math.floor(c.z/CELL),dj=Math.floor((bz+6)/CELL)-cj;
  SH.town([['catapult',0,dj,2,2],['stores',1,dj-1,1,0]],12);const E=buildings.find(B=>B.type==='catapult'),q=center(E);
  SH.run(3);SH.hud(false);const h=SH.spawn('spear',1,q.x+1,q.z-13);h.speed=0;h.hp=h.max=1e9;h.g.visible=false;
  for(const v of villagers){v.sleeping=false;v.hunger=0;}res.food=999;SH.run(1);assignPosts();SH.run(12);assignPosts();SH.run(25);
  let fired=0;for(let k=0;k<400&&!fired;k++){SH.run(.05);if(arrows.some(a=>a.kind==='stone'))fired=1;}SH.run(2.2);
  for(const a of arrows.slice()){if(a.mesh)scene.remove(a.mesh);}arrows.length=0;
  window.__ok='crew '+(E.manned||[]).filter(Boolean).length+' fired '+fired+' cd '+E.cd.toFixed(2);
  for(const B of buildings)if(B.type==='wall'||B.type==='gate'){const w=center(B);if(Math.hypot(w.x-q.x,w.z-q.z)<14)B.group.visible=false;}SH.clearTrees(q.x,q.z,8);SH.freeze(1);SH.look(q.x,q.z+.2,{yaw:-.75,pitch:.32,dist:5,y:hAt(q.x,q.z)+.7});})()`}
};
