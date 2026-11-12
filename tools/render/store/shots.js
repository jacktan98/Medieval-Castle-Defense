// node shots.js W H DSF prefix [scene...]
const L=require('./lib');const [W,H,D,PRE]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];const only=process.argv.slice(6);
const want=s=>!only.length||only.includes(s);
const snap=async(p,name,wait=3000)=>{await p.waitForTimeout(wait);await p.screenshot({path:`${PRE}-${name}.png`});console.log('shot',name,p.errs.slice(0,2));};
const G=(p,code)=>p.evaluate(c=>G(c),code);
(async()=>{const env=await L.start();
const SC=require('./scenes');const NAME={title:'1title',hero:'2town',wall:'3wall',siege:'4siege'};
for(const k of ['title','hero','wall','siege'])if(want(k)){const S=SC[k];const p=await L.open(env,S.map,W,H,D);await p.evaluate(c=>G(c),S.code);await snap(p,NAME[k],S.wait||3500);await p.close();}
const STARS={vale:3,bridge:3,cross:3,watch:2,dune:3,bend:2};
if(want('upgrades')){const p=await env.b.newPage({viewport:{width:W,height:H},deviceScaleFactor:D,hasTouch:true});p.errs=[];
 await p.goto(env.base);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('mtd-stars',JSON.stringify(s));localStorage.setItem('mtd-full','1');localStorage.setItem('mtd-cards',JSON.stringify(Object.keys(s)));localStorage.setItem('mtd-upg',JSON.stringify(['tax','homes','seed','axes','qvolley']));localStorage.setItem('mtd-story',JSON.stringify(Object.fromEntries(Object.keys(s).map(k=>[k,1]))));},STARS);
 await p.goto(env.base);await p.waitForTimeout(5000);await p.click('#campBtn');await p.waitForTimeout(1200);await p.click('#cPrev').catch(()=>{});await p.waitForTimeout(600);await p.click('#cPrev').catch(()=>{});await p.waitForTimeout(1500);await p.waitForTimeout(300);
 await p.click('#campUpBtn');await p.waitForTimeout(800);
 // room for the caption at the bottom left: no Reset button there, and the details box moved to the right (it sat under the caption)
 await p.evaluate(()=>{const r=document.querySelector('#upPick .upRs'),d=document.querySelector('#upPick .upDet'),g=document.querySelector('#upPick .upGrids');if(r)r.style.visibility='hidden';if(d&&g){const a=d.getBoundingClientRect(),b=g.getBoundingClientRect();d.style.transform='translateX('+(b.right-a.right)/(a.width/d.offsetWidth)+'px)';}window.__u=[d&&d.getBoundingClientRect().left,g&&g.getBoundingClientRect().right,innerWidth].join(' ');});console.log(await p.evaluate(()=>window.__u));await snap(p,'5upgrades');await p.close();}
await env.b.close();env.server.close();})();
