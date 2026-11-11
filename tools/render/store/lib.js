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
  freeze(lv){paused=true;for(const B of buildings)if(B.bar)B.bar.grp.visible=false;for(const e of enemies)if(e.bar&&!ENEMY[e.kind].boss)e.bar.grp.visible=false;for(const v of villagers)if(v.sbar)v.sbar.grp.visible=false;if(lv!==undefined){const o=updateLight;updateLight=(dt,now)=>{light=lv;o(0,now);};}},
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
  sky(col){SKY_DAY.set(col);},
  clearTrees(x,z,r){for(const t of trees)if(Math.hypot(t.x-x,t.z-z)<r){t.dead=true;t.k=0;}seatTrees();},
  hud(on){let s=document.getElementById('shotCss');if(!s){s=document.createElement('style');s.id='shotCss';document.head.appendChild(s);}s.textContent=on==='top'?'.cornerBtns,.guideCard,#log,.dock,#hint{display:none!important}':on?'.cornerBtns,.guideCard,#log{display:none!important}':'#app>:not(canvas){visibility:hidden!important}';}
 }`));
 return p;};
