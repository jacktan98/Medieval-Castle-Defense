// shared: serve the repo, open a stage in debug, helpers inside the game
const http=require('http'),fs=require('fs'),path=require('path');const{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../../..');
exports.start=async()=>{const server=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}fs.createReadStream(f).pipe(r);});await new Promise(r=>server.listen(0,r));
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});return {b,server,base:`http://localhost:${server.address().port}/index.html`};};
exports.open=async(env,map,W,H,dsf,stars)=>{const p=await env.b.newPage({viewport:{width:W,height:H},deviceScaleFactor:dsf,hasTouch:true});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.goto(env.base);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('mtd-guide','done');localStorage.setItem('mtd-tips',JSON.stringify(['marks','volley','riders','rally','move','trade','decor','skip','upgrade']));if(s)localStorage.setItem('mtd-stars',JSON.stringify(s));},stars);
 await p.goto(env.base+`?map=${map}&debug`);await p.waitForTimeout(4000);
 for(let k=0;k<8&&await p.isVisible('#newCards');k++){await p.click('#ncNext').catch(()=>{});await p.waitForTimeout(250);}
 await p.evaluate(()=>G(`window.SH={
  town(list,pop){const K=castleB();const st=(B,t)=>{if(!B||t<2)return B;B.tier=t;B.max=DEF[B.type].hp[t-1];B.hp=B.max;swapModel(B);return B;};st(K,3);
   const ci=Math.floor((K.ev.x0+K.ev.x1)/2/CELL),cj=Math.floor((K.ev.z0+K.ev.z1)/2/CELL);const out=[];
   for(const [type,dx,dz,t,f] of list){if(f!==undefined)placeFace=f;const ev=findValid(type,ci+dx,cj+dz,{free:true});if(ev){const B=place(type,ev.ci,ev.cj,{instant:true,free:true,quiet:true});out.push(st(B,t));}}
   for(let n=0;n<(pop||0);n++)makeVillager(K);assignJobs();return out.length;},
  run(s){for(let i=0;i<s*20;i++)tick(.05,performance.now()+i*50);},
  cam(o){const K=castleB(),c=center(K);target.set(c.x+(o.dx||0),o.y||1.5,c.z+(o.dz||0));yaw=o.yaw;pitch=o.pitch;dist=o.dist;updateCam();},
  freeze(lv){paused=true;for(const f of floats)f.sp.visible=false;for(const B of buildings)if(B.bar)B.bar.grp.visible=false;for(const e of enemies)if(e.bar&&!ENEMY[e.kind].boss)e.bar.grp.visible=false;for(const v of villagers)if(v.sbar)v.sbar.grp.visible=false;if(lv!==undefined){const o=updateLight;updateLight=(dt,now)=>{light=lv;o(0,now);};}},
  foe(f){const L=enemies.filter(e=>!e.dead&&!e.dormant&&(!f||f(e)));if(!L.length)return null;let x=0,z=0;for(const e of L){x+=e.x;z+=e.z;}return {x:x/L.length,z:z/L.length,n:L.length};},
  look(x,z,o){target.set(x,o.y||1,z);yaw=o.yaw;pitch=o.pitch;dist=o.dist;updateCam();},
  roads(){const K=castleB(),c=center(K);const R=12;layRoads([[[c.x-R,c.z+3.2],[c.x+R,c.z+3.2]],[[c.x,c.z+3.2],[c.x,c.z+R+4]],[[c.x-R,c.z-4],[c.x-R,c.z+3.2]],[[c.x+R,c.z-4],[c.x+R,c.z+3.2]]]);rebuildRoads();cacheCells();},
  // a raider placed at a spot, walking (night begins with the first)
  spawn(kind,t,x,z){if(PH.kind==='day'){spawnRaiders([['spear',1]]);spawnQueue=[];}spawnEnemy(kind,{x,z},1,t);return enemies[enemies.length-1];},
  // the haze closes in so the map's edge never shows (kept every frame through updateCam)
  fog(near,far){const o=updateCam;updateCam=()=>{o();scene.fog.near=near;scene.fog.far=far;};updateCam();},
  // soft clouds round the map, lit by the sky (fog off), so the sky is never a blank band
  clouds(n,tint){if(window.__cl)scene.remove(window.__cl);const g=new THREE.Group();const cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d');
   for(let i=0;i<14;i++){const cx=60+Math.random()*136,cy=110+Math.random()*50,r=30+Math.random()*40;const gr=x.createRadialGradient(cx,cy,0,cx,cy,r);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.6,'rgba(250,250,252,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();}
   x.globalCompositeOperation='source-atop';const sh=x.createLinearGradient(0,90,0,200);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(150,160,178,.75)');x.fillStyle=sh;x.fillRect(0,0,256,256);
   const tex=new THREE.CanvasTexture(cv);const c=new THREE.Vector3(SIZE/2,0,SIZE/2);
   for(let i=0;i<(n||40);i++){const m=new THREE.SpriteMaterial({map:tex,color:new THREE.Color(tint||'#ffffff'),transparent:true,opacity:.55+Math.random()*.35,fog:false,depthWrite:false,toneMapped:false});const s=new THREE.Sprite(m);
    const a=Math.random()*Math.PI*2,R=110+Math.random()*80;s.position.set(c.x+Math.cos(a)*R,6+Math.random()*34,c.z+Math.sin(a)*R);const k=60+Math.random()*70;s.scale.set(k,k*.45,1);s.renderOrder=-1;g.add(s);}
   scene.add(g);window.__cl=g;},

  // land beyond the map's edge: a flat ring at the edge's height, woods on it and low-poly hills further out, all in the fog
  land(o){o=o||{};edgeEarth.visible=edgeWater.visible=false;const g=new THREE.Group();let sh=0,nn=0;for(let i=0;i<=40;i++){const t=i/40*SIZE;for(const [x,z] of [[t,.5],[t,SIZE-.5],[.5,t],[SIZE-.5,t]]){sh+=hAt(x,z);nn++;}}const y=o.y!==undefined?o.y:sh/nn-.08;
   const D=[0,1,2.5,5,9,15,25,40,70,120,200,400,700],M=4*SIZE,gp=[],gc=[],gi=[],tc=tGeo.attributes.color,G0=new THREE.Color(o.ground||'#5c8a3a'),cc=new THREE.Color();
   for(let k=0;k<D.length;k++){const d=D[k],L=SIZE+2*d;for(let m=0;m<M;m++){const u=m/M*4,sd=Math.floor(u),f=u-sd;let x,z;if(sd===0){x=-d+f*L;z=-d;}else if(sd===1){x=SIZE+d;z=-d+f*L;}else if(sd===2){x=SIZE+d-f*L;z=SIZE+d;}else{x=-d;z=SIZE+d-f*L;}
    const cx=Math.min(SIZE,Math.max(0,x)),cz=Math.min(SIZE,Math.max(0,z));const w=Math.min(1,d/45),e=w*w*(3-2*w);const hy=Math.max(hAt(Math.min(SIZE-.01,cx),Math.min(SIZE-.01,cz)),y);gp.push(x,hy+(y-hy)*e,z);
    const vi=Math.round(cz)*V+Math.round(cx);cc.setRGB(tc.getX(vi),tc.getY(vi),tc.getZ(vi));cc.lerp(G0,Math.min(1,d/25));gc.push(cc.r,cc.g,cc.b);}}
   for(let k=0;k<D.length-1;k++)for(let m=0;m<M;m++){const a=k*M+m,b=k*M+(m+1)%M,c2=(k+1)*M+m,d2=(k+1)*M+(m+1)%M;gi.push(a,c2,b,b,c2,d2);}
   const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));rg.setAttribute('color',new THREE.Float32BufferAttribute(gc,3));rg.setIndex(gi);rg.computeVertexNormals();
   const pl=new THREE.Mesh(rg,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));pl.receiveShadow=true;g.add(pl);
   const rnd=()=>Math.random();const out=(d0,d1)=>{for(;;){const x=-d1+rnd()*(SIZE+2*d1),z=-d1+rnd()*(SIZE+2*d1);const dx=Math.max(-x,x-SIZE,0),dz=Math.max(-z,z-SIZE,0),d=Math.max(dx,dz);if(d>d0&&d<d1)return [x,z];}};
   const tm=new THREE.MeshLambertMaterial({color:new THREE.Color(o.tree||'#2f5a2a'),flatShading:true}),km=new THREE.MeshLambertMaterial({color:new THREE.Color('#5a3d24')});
   for(let i=0;i<(o.trees||500);i++){const [x,z]=out(1.5,90);const k=.8+rnd()*.9;const c=new THREE.Mesh(new THREE.ConeGeometry(1.3*k,3.6*k,6),tm);c.position.set(x,y+1.2+1.8*k,z);c.castShadow=true;g.add(c);const tr=new THREE.Mesh(new THREE.CylinderGeometry(.18*k,.22*k,1.4,5),km);tr.position.set(x,y+.7,z);g.add(tr);}
   const hc=(o.hills||['#557d3c','#4d7236','#6b7a5c','#7d8790']).map(c=>new THREE.MeshLambertMaterial({color:new THREE.Color(c),flatShading:true}));
   for(let i=0;i<(o.nh||70);i++){const [x,z]=out(o.h0||40,o.h1||260);const d=Math.max(-x,x-SIZE,-z,z-SIZE);const r=18+rnd()*35,h=(8+rnd()*22)*(o.hk||1)*(.6+d/200);const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,7+((rnd()*4)|0)),hc[(rnd()*hc.length)|0]);m.position.set(x,y+h/2-2,z);m.rotation.y=rnd()*6;g.add(m);}
   scene.add(g);window.__land=g;},
  // clouds put where the camera sees them: through points in the top of the frame, far out
  skyClouds(n,tint,band,o2){band=band||[.25,1.05];o2=o2||{k0:.14,k1:.14};const cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d');
   for(let i=0;i<14;i++){const cx=60+Math.random()*136,cy=110+Math.random()*50,r=30+Math.random()*40;const gr=x.createRadialGradient(cx,cy,0,cx,cy,r);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.6,'rgba(250,250,252,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();}
   x.globalCompositeOperation='source-atop';const sh=x.createLinearGradient(0,90,0,200);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(160,170,186,.7)');x.fillStyle=sh;x.fillRect(0,0,256,256);
   const tex=new THREE.CanvasTexture(cv);const g=new THREE.Group();camera.updateMatrixWorld();
   for(let i=0;i<n;i++){const v=new THREE.Vector3(-1.3+Math.random()*2.6,band[0]+Math.random()*(band[1]-band[0]),.5).unproject(camera).sub(camera.position).normalize();const d=110+Math.random()*120;
    const m=new THREE.SpriteMaterial({map:tex,color:new THREE.Color(tint||'#ffffff'),transparent:true,opacity:.6+Math.random()*.35,fog:false,depthWrite:false,toneMapped:false});const s=new THREE.Sprite(m);s.position.copy(camera.position).addScaledVector(v,d);const k=d*(o2.k0+Math.random()*o2.k1);s.scale.set(k,k*.42,1);g.add(s);}
   scene.add(g);},
  // soldiers stood by hand: [x, z, tier, facing angle, mounted]
  guards(list){const K=castleB();const out=[];for(const [x,z,t,a,cav] of list){const v=makeVillager(K);v.inside=false;v.g.visible=true;soldierKit(v,t,cav);v.x=v.rx=x;v.z=v.rz=z;v.g.position.set(x,walkY(x,z),z);v.g.rotation.y=a;v.state='frozen';out.push(v);}return out;},
  // snow off the ground (the hold's crag)
  thaw(col){const c=tGeo.attributes.color,to=new THREE.Color(col||'#6f6a5e');for(let i=0;i<c.count;i++){const r=c.getX(i),g=c.getY(i),b=c.getZ(i);const w=Math.min(r,g,b);if(w>.45){const k=Math.min(1,(w-.45)/.25);c.setXYZ(i,r+(to.r-r)*k,g+(to.g-g)*k,b+(to.b-b)*k);}}c.needsUpdate=true;},
  // a wider lens for a portrait shot (the frame loop keeps setting 45, so the setter is ignored)
  fov(F){Object.defineProperty(camera,'fov',{get:()=>F,set(){},configurable:true});camera.updateProjectionMatrix();updateCam();},
  sky(col){SKY_DAY.set(col);},
  clearTrees(x,z,r){for(const t of trees)if(Math.hypot(t.x-x,t.z-z)<r){t.dead=true;t.k=0;}seatTrees();},
  hud(on){let s=document.getElementById('shotCss');if(!s){s=document.createElement('style');s.id='shotCss';document.head.appendChild(s);}s.textContent=on==='top'?'.cornerBtns,.guideCard,#log,.dock,#hint{display:none!important}':on?'.cornerBtns,.guideCard,#log{display:none!important}':'#app>:not(canvas){visibility:hidden!important}';}
 }`));
 return p;};
