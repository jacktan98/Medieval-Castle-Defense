// node draft.js W H DSF prefix scene : one scene's code from scenes.js
const L=require('./lib');const SC=require('./scenes');const [W,H,D,PRE,name]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5],process.argv[6]];
(async()=>{const env=await L.start();const s=SC[name];const p=await L.open(env,s.map,W,H,D);
 await p.evaluate(c=>G(c),s.code);await p.waitForTimeout(s.wait||3500);await p.screenshot({path:`${PRE}-${name}.png`});console.log('shot',name,p.errs.slice(0,3));
 await env.b.close();env.server.close();})();
