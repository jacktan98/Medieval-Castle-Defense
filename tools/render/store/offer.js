// node offer.js W H DSF out.png : the in-app purchase's review screenshot (the offer card over Stage 4 on the campaign)
const L=require('./lib');const [W,H,D,OUT]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];
(async()=>{const env=await L.start();const p=await env.b.newPage({viewport:{width:W,height:H},deviceScaleFactor:D,hasTouch:true});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.goto(env.base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mtd-stars',JSON.stringify({vale:3,bridge:3,cross:2}));localStorage.setItem('mtd-cards',JSON.stringify(['vale','bridge','cross']));localStorage.setItem('mtd-story',JSON.stringify({vale:1,bridge:1,cross:1,watch:1}));});
 await p.goto(env.base+'?debug');await p.waitForTimeout(5000);
 await p.evaluate(()=>G('fullOwned=()=>false;showStart?0:0;'));
 await p.evaluate(()=>G('buildShowcase(0);showMapPick();'));await p.waitForTimeout(2500);
 await p.evaluate(()=>G('openCampaign(3)'));await p.waitForTimeout(2500);
 await p.evaluate(()=>G('showOffer()'));await p.waitForTimeout(1500);
 await p.screenshot({path:OUT});console.log('shot',OUT,p.errs.slice(0,3));await env.b.close();env.server.close();})();
