module.exports={
hero:{map:'vale',code:`(()=>{SH.town([['house',-3,-1,3],['house',-3,1,3],['house',-2,3,2],['house',3,1,3],['house',3,-1,2],['house',-4,3,2],['house',4,3,3],['house',-5,0,2],['farm',-7,-2,3],['farm',-7,2,2],['lodge',-6,6,3],['quarry',6,6,2],['market',1,5,3],['tower',-3,-4,3],['tower',3,-4,3],['tower',6,-1,2],['barracks',0,-5,3],['torch',-1,2,1],['torch',1,2,1],['campfire',-2,7,1],['flowers',-4,1,1],['flowers',4,1,1],['well',4,5,1],['statue',-2,-3,1],['banner',2,-3,1],['house',5,-3,3],['house',7,-5,2],['house',4,-6,3],['house',8,-2,3],['farm',6,-9,3],['market',2,-8,3],['tower',9,-7,3],['house',1,-4,2],['well',5,-5,1],['torch',3,-3,1],['flowers',6,-4,1],['lodge',10,-4,2],['house',9,0,3],['house',9,-10,3],['farm',12,-8,2],['torch',7,-8,1],['house',4,-10,2],['banner',8,-6,1]],16);
 SH.roads();SH.run(45);SH.hud(false);SH.clouds(45);SH.fog(70,160);const K=castleB();SH.cam({yaw:2.36,pitch:.24,dist:38,dx:5,dz:-5,y:2});})()`},
};
module.exports.wall={map:'bridge',code:`(()=>{const b=bridges[0],bci=Math.floor(b.ex/CELL);
  for(const n of BANK_WALL){if(occB[n])continue;const ci=n%N,cj=(n/N)|0;place(ci===bci?'gate':'wall',ci,cj,{instant:true,free:true,quiet:true});}
  for(const B of buildings)if(B.type==='wall'||B.type==='gate'){B.tier=2;B.max=DEF[B.type].hp[1];B.hp=B.max;swapModel(B);}
  SH.town([['tower',-3,-6,3],['crossbow',3,-6,3],['tower',-7,-6,3],['crossbow',7,-6,3],['crossbow',-1,-5,2],['house',-3,1,2],['house',3,1,2],['house',-3,3,3],['house',3,3,3],['house',-5,2,2],['house',5,2,2],['barracks',0,4,2],['torch',-1,-3,1],['torch',1,-3,1],['banner',-2,-2,1]],22);
  SH.run(4);SH.hud('top');
  const K0=castleB(),c0=center(K0);SH.clearTrees(c0.x,c0.z-6,7);
  const kinds=['spear','spear','sword','spear','sword','lancer','rider','archer','spear','xbow'];let n=0;
  for(let k=0;k<2000&&n<60;k++){const x=c0.x-15+Math.random()*32,rz=stoneRiverZ(x),u=Math.random(),z=u<.4?rz+1.5+Math.random()*4:rz-2-Math.random()*13;if(!canStand(x,z,2))continue;SH.spawn(kinds[n%kinds.length],1+(n%3),x,z);n++;}
  SH.run(2.5);SH.freeze(.4);SH.fog(55,120);SH.clouds(40,'#d9c4b0');
  const K=castleB(),c=center(K);SH.look(c.x+1,c.z-19,{yaw:.1,pitch:.5,dist:36,y:1});})()`};
module.exports.siege={map:'plains',code:`(()=>{const K=castleB(),c=center(K);
  SH.town([['catapult',-1,-10,2,2],['ballista',1,-13,2,2],['tower',-4,-12,3],['stores',1,-10,1],['torch',-2,-9,1],['house',-4,3,3],['house',4,3,2]],14);
  SH.run(3);SH.hud('top');{const h=SH.spawn('spear',1,c.x,2);h.speed=0;h.g.visible=false;window.__hold=h;}SH.run(16);const E=buildings.find(B=>B.type==='catapult'),BL=buildings.find(B=>B.type==='ballista');const ce=center(E),cb=center(BL);
  const mx=ce.x,mz=ce.z;const dx=0,dz=-1,l=1;SH.clearTrees(mx,mz-16,14);
  const kinds=['spear','sword','spear','lancer','sword','rider','spear','archer'];let n=0;
  for(let k=0;k<2000&&n<28;k++){const d=12+Math.random()*7,s=(Math.random()-.5)*10;const x=mx+dx/l*d-dz/l*s,z=mz+dz/l*d+dx/l*s;if(!canStand(x,z,2))continue;SH.spawn(kinds[n%kinds.length],2+(n%2),x,z);n++;}
  {const f=SH.foe();for(const B of [E,BL]){B.cd=0;const q=center(B);if(B.turret)B.turret.rotation.y=Math.atan2(f.x-q.x,f.z-q.z)-B.group.rotation.y;}}{const h=window.__hold;h.dead=true;h.hp=0;scene.remove(h.g);enemies.splice(enemies.indexOf(h),1);}
  let ok=0;for(let k=0;k<80;k++){const st=arrows.filter(a=>a.kind==='stone'&&a.t>.3&&a.t<.55).length;if(st){ok=1;break;}SH.run(.05);}window.__ok=ok;
  SH.sky('#8db0cf');SH.freeze(.75);SH.fog(60,140);SH.clouds(50);
  SH.look(mx+2,mz-7,{yaw:-.2,pitch:.22,dist:16,y:2});})()`};
module.exports.boss={map:'hold',code:`(()=>{SH.town([['tower',-4,-4,3],['tower',4,-4,3],['crossbow',-7,-2,3],['crossbow',7,-2,3],['house',-3,2,3],['house',3,2,3],['house',-5,3,3],['house',5,3,3],['stables',-7,-6,3],['barracks',-6,4,3],['torch',-1,-3,1],['torch',1,-3,1],['banner',0,-3,1]],20);
  SH.run(3);SH.hud('top');const K=castleB(),c=center(K);
  const w=SH.spawn('warlord',3,c.x,c.z-30);SH.spawn('rider',3,c.x-3,c.z-33);SH.spawn('rider',3,c.x+3,c.z-33);SH.spawn('lancer',3,c.x-1,c.z-36);
  for(let k=0;k<60;k++){SH.run(.25);if(Math.hypot(w.x-c.x,w.z-c.z)<22)break;}
  SH.freeze(.72);SH.clouds(40,'#d8dde6');const r=Math.atan2(c.x-w.x,c.z-w.z);SH.look(w.x+Math.sin(r)*1.2,w.z+Math.cos(r)*1.2,{yaw:r+.22,pitch:.2,dist:7.6,y:walkY(w.x,w.z)+1.9});})()`};
