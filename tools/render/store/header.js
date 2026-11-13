// node header.js W H DSF out.png : the product page's header, the title showcase with no words on it
const L=require('./lib');const [W,H,D,OUT]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];
(async()=>{const env=await L.start();const S=require('./scenes').title;const p=await L.open(env,S.map,W,H,D);
 await p.evaluate(c=>G(c),S.code);
 await p.evaluate(()=>G('SH.back({trees:6000,wood:30});SH.gameClouds(30,[.45,1.05])'));await p.addStyleTag({content:'.gameTitle,#titleCrown{display:none!important} body.showcase #mapPick.modal.tome{background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 62%,rgba(0,0,0,.22) 100%)!important}'});
 await p.waitForTimeout(S.wait||5000);await p.screenshot({path:OUT});console.log('shot',OUT,p.errs.slice(0,2));await p.close();await env.b.close();env.server.close();})();
