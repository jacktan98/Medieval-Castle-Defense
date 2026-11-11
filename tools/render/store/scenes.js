module.exports={
hero:{map:'vale',code:`(()=>{SH.town([['house',-3,-1,3],['house',-3,1,3],['house',-2,3,2],['house',3,1,3],['house',3,-1,2],['house',-4,3,2],['house',4,3,3],['house',-5,0,2],['farm',-7,-2,3],['farm',-7,2,2],['lodge',-6,6,3],['quarry',6,6,2],['market',1,5,3],['tower',-3,-4,3],['tower',3,-4,3],['tower',6,-1,2],['barracks',0,-5,3],['torch',-1,2,1],['torch',1,2,1],['campfire',-2,7,1],['flowers',-4,1,1],['flowers',4,1,1],['well',4,5,1],['statue',-2,-3,1],['banner',2,-3,1],['house',5,-3,3],['house',7,-5,2],['house',4,-6,3],['house',8,-2,3],['farm',6,-9,3],['market',2,-8,3],['tower',9,-7,3],['house',1,-4,2],['well',5,-5,1],['torch',3,-3,1],['flowers',6,-4,1],['lodge',10,-4,2],['house',9,0,3],['house',9,-10,3],['farm',12,-8,2],['torch',7,-8,1],['house',4,-10,2],['banner',8,-6,1]].map(e=>[...e,2]),16);
 SH.roads();SH.run(45);SH.hud(false);SH.clouds(45);SH.fog(70,160);const K=castleB(),c=center(K);SH.clearTrees(c.x+4+Math.sin(2.75)*24,c.z-4+Math.cos(2.75)*24,16);SH.cam({yaw:2.75,pitch:.56,dist:38,dx:3,dz:-2,y:1.5});})()`},
};
module.exports.wall={map:'bridge',code:`(()=>{const b=bridges[0],bci=Math.floor(b.ex/CELL);
  for(const n of BANK_WALL){if(occB[n])continue;const ci=n%N,cj=(n/N)|0;place(ci===bci?'gate':'wall',ci,cj,{instant:true,free:true,quiet:true});}
  for(const B of buildings)if(B.type==='wall'||B.type==='gate'){B.tier=2;B.max=DEF[B.type].hp[1];B.hp=B.max;swapModel(B);}
  SH.town([['tower',-2,-7,3],['crossbow',2,-7,3],['crossbow',-5,-7,3],['tower',5,-7,3],['tower',-2,-4,2],['house',-3,1,2],['house',3,1,2],['house',-3,3,3],['house',3,3,3],['house',-5,2,2],['house',5,2,2],['barracks',0,4,2],['torch',-1,-3,1],['torch',1,-3,1],['banner',-2,-2,1]],22);
  SH.run(4);SH.hud(false);
  const K0=castleB(),c0=center(K0);SH.clearTrees(c0.x,c0.z-6,7);
  const kinds=['spear','spear','sword','spear','sword','lancer','rider','archer','spear','xbow'];let n=0;
  for(let k=0;k<3000&&n<90;k++){const x=c0.x-15+Math.random()*32,rz=stoneRiverZ(x),u=Math.random(),z=u<.55?rz+2.5+Math.random()*4.2:rz-2-Math.random()*13;if(!canStand(x,z,2))continue;SH.spawn(kinds[n%kinds.length],1+(n%3),x,z);n++;}
  SH.run(2.5);SH.freeze(.85);SH.fog(60,130);SH.clouds(40,'#d9c4b0');
  const K=castleB(),c=center(K);SH.look(c.x+.5,c.z-17,{yaw:.08,pitch:.6,dist:34,y:1});})()`};
module.exports.siege={map:'plains',code:`(()=>{const K=castleB(),c=center(K);
  SH.town([['catapult',-3,-5,3,2],['ballista',-1,-7,2,2],['catapult',-4,-8,2,2],['catapult',-2,-10,2,2],['ballista',-5,-11,3,2],['catapult',1,-12,1,2],['tower',6,-8,3],['stores',-1,-4,1],['stores',-6,-6,1],['torch',1,-5,1],['house',-4,3,3],['house',4,3,2]],44);
  SH.run(3);SH.hud(false);{const h=SH.spawn('spear',1,c.x,2);h.speed=0;h.hp=h.max=1e9;h.g.visible=false;window.__hold=h;}for(const v of villagers){v.sleeping=false;v.hunger=0;}res.food=999;SH.run(2);assignPosts();SH.run(10);assignPosts();SH.run(25);assignPosts();SH.run(30);const E=buildings.find(B=>B.type==='catapult'),BL=buildings.find(B=>B.type==='ballista'),ENG=buildings.filter(B=>B.type==='catapult'||B.type==='ballista');const ce=center(E),cb=center(BL);
  const mx=ce.x,mz=ce.z;const dx=0,dz=-1,l=1;SH.clearTrees(mx,mz-16,14);
  const kinds=['spear','sword','spear','lancer','sword','rider','spear','archer'];let n=0;
  for(let k=0;k<3000&&n<40;k++){const d=12+Math.random()*9,s=(Math.random()-.5)*22;const x=mx+dx/l*d-dz/l*s,z=mz+dz/l*d+dx/l*s;if(!canStand(x,z,2))continue;SH.spawn(kinds[n%kinds.length],2+(n%2),x,z);n++;}
  {const f=SH.foe();for(const B of ENG){B.cd=Math.random()*1.5;const q=center(B);if(B.turret)B.turret.rotation.y=Math.atan2(f.x-q.x,f.z-q.z)-B.group.rotation.y;}}{const h=window.__hold;h.dead=true;h.hp=0;scene.remove(h.g);if(h.bar)h.bar.grp.visible=false;enemies.splice(enemies.indexOf(h),1);}
  let ok=0;for(let k=0;k<80;k++){const st=arrows.filter(a=>a.kind==='stone'&&a.t>.3&&a.t<.55).length;if(st){ok=1;break;}SH.run(.05);}window.__ok=ok+' foes '+enemies.filter(e=>!e.dead).length;
  SH.sky('#8db0cf');SH.freeze(.75);SH.fog(60,140);SH.clouds(50);
  SH.look(c.x-3,c.z-21,{yaw:-.35,pitch:.6,dist:29,y:1.5});})()`};
module.exports.boss={map:'hold',code:`(()=>{SH.run(2);SH.hud(false);for(const e of enemies.slice())if(e.dormant&&Math.hypot(e.x-HOLD_GATE[0],e.z-HOLD_GATE[1]-16.5)<16){scene.remove(e.g);enemies.splice(enemies.indexOf(e),1);}
  const gx=HOLD_GATE[0],gz=HOLD_GATE[1]+16.5;const L=[];
  const w=SH.spawn('warlord',3,gx,gz);L.push(w);
  const F=[[0,0]];for(const [k,t,dx,dz] of [['rider',3,-1.7,-1.8],['rider',3,1.7,-1.8],['sword',3,-.8,-3.2],['sword',3,.9,-3.3],['lancer',3,-2.9,-4],['lancer',3,2.9,-4],['spear',2,-1.8,-5],['spear',2,0,-5.2],['spear',2,1.8,-5],['archer',2,-.9,-6.5],['xbow',2,.9,-6.5]]){F.push([dx,dz]);L.push(SH.spawn(k,t,gx+dx,gz+dz));}
  for(const e of L){e.speed=0;e.fresh=false;}
  SH.run(.6);L.forEach((e,i)=>{e.x=e.rx=gx+F[i][0];e.z=e.rz=gz+F[i][1];e.hx=Math.sin(.3);e.hz=Math.cos(.3);e.g.rotation.y=.3;e.g.position.set(e.x,walkY(e.x,e.z),e.z);});window.__L=L.map(e=>[e.kind,e.x.toFixed(1),e.z.toFixed(1),e.dead,e.g.visible]);
  SH.freeze(1);updateWeather=()=>{wxPts.visible=wxLines.visible=false;};SH.clouds(40,"#d8dde6");SH.fog(60,140);
  SH.look(gx,gz-2,{yaw:0,pitch:.22,dist:12,y:walkY(gx,gz)+2.9});})()`};
