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
  freeze(lv){paused=true;if(lv!==undefined){const o=updateLight;updateLight=(dt,now)=>{light=lv;o(0,now);};}},
  foe(f){const L=enemies.filter(e=>!e.dead&&!e.dormant&&(!f||f(e)));if(!L.length)return null;let x=0,z=0;for(const e of L){x+=e.x;z+=e.z;}return {x:x/L.length,z:z/L.length,n:L.length};},
  look(x,z,o){target.set(x,o.y||1,z);yaw=o.yaw;pitch=o.pitch;dist=o.dist;updateCam();},
  roads(){const K=castleB(),c=center(K);const R=12;layRoads([[[c.x-R,c.z+3.2],[c.x+R,c.z+3.2]],[[c.x,c.z+3.2],[c.x,c.z+R+4]],[[c.x-R,c.z-4],[c.x-R,c.z+3.2]],[[c.x+R,c.z-4],[c.x+R,c.z+3.2]]]);rebuildRoads();cacheCells();},
  hud(on){let s=document.getElementById('shotCss');if(!s){s=document.createElement('style');s.id='shotCss';document.head.appendChild(s);}s.textContent=on?'.cornerBtns,.guideCard,#log{display:none!important}':'#app>:not(canvas){visibility:hidden!important}';}
 }`));
 return p;};
