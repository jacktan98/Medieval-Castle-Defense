// node hero-loop.js W H out-dir [secs] : the website hero's looping background, the title showcase's green River isle by day
// (as site/img/hero.jpg, its poster) with no words.
// The camera sways gently (a sine, so the end meets the start exactly); one extra second is rendered and blended over the
// first second (smoke, flags and birds aren't periodic). Then: ffmpeg the frames (see the README).
const L=require('./lib');const fs=require('fs');const [W,H,OUT]=[+process.argv[2],+process.argv[3],process.argv[4]];
const T=+(process.argv[5]||14),A=.3,FPS=30,N=T*FPS,K=FPS;fs.mkdirSync(OUT,{recursive:true});
(async()=>{const env=await L.start();const p=await L.open(env,'vale',W,H,1);
 // the first random draw picks the time of day (.1: day); no weather
 await p.evaluate(()=>G(`(()=>{const R=Math.random;let k=0;Math.random=()=>(k++<1?.1:R());try{buildShowcase(2);}finally{Math.random=R;}const K=castleB();showYaw0=(K.face||0)*Math.PI/2+(window.YAW0||.25);showPh=0;yaw=showYaw0;weatherReset(null);showMapPick();})()`));
 await p.addStyleTag({content:'#mapPick>*,#titleCrown,.cornerBtns{visibility:hidden!important} body.showcase #mapPick.modal.tome{background:none!important}'});
 await p.waitForTimeout(3000);
 await p.evaluate(()=>G(`adaptResolution=()=>{};window.__T=performance.now();window.requestAnimationFrame=cb=>{window.__cb=cb;return 1;};window.__y0=showYaw0;showYaw0=0;`));
 await p.waitForTimeout(300);
 for(let i=-60;i<N+K;i++){const y=A*Math.sin(2*Math.PI*i/N);
  await p.evaluate(([y])=>G(`showT=-1e9;showPh=__y0+${y}-.001;`),[y]);
  await p.evaluate(()=>{const cb=window.__cb;window.__cb=null;window.__T+=1000/30;if(cb)cb(window.__T);});
  if(i>=0)await p.screenshot({path:`${OUT}/r${String(i).padStart(5,'0')}.png`});if(i%60===0)console.log('frame',i,p.errs.slice(0,2));}
 await p.close();await env.b.close();env.server.close();})();
