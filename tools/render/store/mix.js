// node mix.js frames-dir out.mp4: the trailer's soundtrack and video. Parts play in name order (0-card, 1-town, ...); every sound the
// game played while a part rendered (trailer.js's <part>.json) is placed on its frame, levelled like the game levels its effects
// (TARGET_LOUD × trim ÷ the loudest .3 s), and laid over the day theme with birdsong, fire and the horn where they belong
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const [DIR,OUT]=[process.argv[2],process.argv[3]];const ROOT=path.resolve(__dirname,'../../..'),AU=ROOT+'/audio/';
const SR=48000,FPS=30;
// the game's sound table, read from its source
const src=fs.readFileSync(ROOT+'/src/game/12-loop-audio.js','utf8'),SND={};
for(const m of src.matchAll(/^\s+(\w+):\s*\{\s*(?:file:\s*'([^']+)'|files:\s*\[([^\]]*)\])([^}]*)\}/gm)){const files=m[2]?[m[2]]:(m[3].match(/'([^']+)'/g)||[]).map(s=>s.slice(1,-1));
 const tr=/trim:\s*([\d.]+)/.exec(m[4]);SND[m[1]]={files,trim:tr?+tr[1]:1,strikes:/strikes:\s*true/.test(m[4])};}
const cache={};
function pcm(file){if(cache[file])return cache[file];const raw=execFileSync('ffmpeg',['-v','error','-i',AU+file,'-ac','1','-ar',String(SR),'-f','f32le','-'],{maxBuffer:1<<30});
 const a=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);return cache[file]=Float32Array.from(a);}
function loud(a){const w=Math.round(.3*SR);let best=0;for(let s=0;s+w<=a.length;s+=Math.round(w/4)){let e=0;for(let i=s;i<s+w;i++)e+=a[i]*a[i];best=Math.max(best,Math.sqrt(e/w));}return best||Math.sqrt(a.reduce((x,y)=>x+y*y,0)/a.length)||1;}
// one strike out of a long recording of repeated work: from the first onset, .45 s
function strike(a){let pk=0;for(const v of a)pk=Math.max(pk,Math.abs(v));const i=a.findIndex(v=>Math.abs(v)>pk*.25);const s=Math.max(0,i-Math.round(.01*SR));return a.subarray(s,s+Math.round(.45*SR));}
const parts=[...new Set(fs.readdirSync(DIR).filter(f=>f.endsWith('.png')).map(f=>f.replace(/-\d+\.png$/,'')))].sort();
const off={};let F=0;for(const p of parts){off[p]=F;F+=fs.readdirSync(DIR).filter(f=>f.startsWith(p+'-')&&f.endsWith('.png')).length;}
const len=Math.ceil(F/FPS*SR)+SR,mix=new Float32Array(len);
const put=(a,t,g,fi=0,fo=0)=>{const s=Math.round(t*SR);for(let i=0;i<a.length&&s+i<len;i++){if(s+i<0)continue;let k=g;if(fi&&i<fi*SR)k*=i/(fi*SR);if(fo&&i>a.length-fo*SR)k*=(a.length-i)/(fo*SR);mix[s+i]+=a[i]*k;}};
const bed=(file,t0,t1,g,fi=.5,fo=.8,from=0)=>{const a=pcm(file),n=Math.round((t1-t0)*SR),o=Math.round(from*SR),b=new Float32Array(n);for(let i=0;i<n;i++)b[i]=a[(o+i)%a.length];put(b,t0,g,fi,fo);};
const T=p=>off[p]/FPS,E=p=>(off[p]+fs.readdirSync(DIR).filter(f=>f.startsWith(p+'-')&&f.endsWith('.png')).length)/FPS,end=F/FPS;
// music under everything, ambience by part
// the second day theme from 35 s in (Jack); it measured 1.25 × as loud as the first, so a little lower
// a video's own plan (reddit.js writes one): <dir>/mix.json {music: [[file, first part, last part, gain, from, fade out, start late]], beds: [[file, part, gain]], keep, horn}
const CFG=fs.existsSync(DIR+'/mix.json')?JSON.parse(fs.readFileSync(DIR+'/mix.json')):null;
if(CFG){for(const [f,a,b,g,from,fo,late] of CFG.music)if(off[a]!==undefined&&off[b]!==undefined)bed(f,T(a)+(late||0),E(b),g,.6,fo||1.6,from||0);for(const [f,a,g] of CFG.beds||[])if(off[a]!==undefined)bed(f,T(a),E(a),g);}
else{
bed('music/Medieval_theme_music_2.mp3',0,end,.115,.6,1.6,35);
if(off['1-town']!==undefined)bed('sfx/Bird_chirping.mp3',T('1-town'),E('1-town'),.28);
if(off['3-wall']!==undefined){bed('sfx/Fire_sound.mp3',T('3-wall'),E('3-wall'),1.6);}
if(off['5-siege']!==undefined)bed('sfx/Bird_chirping.mp3',T('5-siege'),E('5-siege'),.18);
}
// effects: the logged ones, with a little room between repeats of one sound
// Jack: too many effects at once overwhelmed the viewer: each part keeps only a few telling sounds, one at a time, well spaced
// the town: only the castle's upgrades (Jack); the wall: the ram, both grunts, arrows and siege; the siege: stones, bolts, falling houses and the riders' rush
const KEEP=CFG&&CFG.keep?CFG.keep:{'1-town':['castleUp'],'3-wall':['ramHit','kill','arrow','qbolt','rockFire','rockHit','bolt'],'5-siege':['rockFire','rockHit','bolt','clash','destroyed','rush','kill'],'8-title':[]};
// these play whatever else is sounding (still kept apart from their own repeats)
const LOUD={ramHit:1,grunt:1,rockHit:1,destroyed:1,bolt:1};
// a little louder than the game levels them (Jack): the ram's blow and the stones landing
const BOOST={ramHit:1.6,rockHit:1.5};
// a part's own spacing between any two effects (the wall: more arrows and siege, Jack)
const ALLP={'3-wall':.32};
const GAP={grunt:.6,arrow:.55,qbolt:.7,ramHit:1.2,build:.7,upgrade:.9,rockFire:.9,rockHit:.6,bolt:1,clash:1.3,destroyed:1.5},last={};let ALL=.55,lastAny=-9,n=0,skip=0;
const turn={};const fx=(name,t,g,force)=>{const S=SND[name];if(!S||!S.files.length)return;if(!force&&(t-(last[name]??-9)<(GAP[name]??.5)||(!LOUD[name]&&t-lastAny<ALL))){skip++;return;}last[name]=t;lastAny=t;
 turn[name]=(turn[name]??-1)+1;let a=pcm(S.files[turn[name]%S.files.length]);if(S.strikes)a=strike(a);const k=Math.min(6,Math.max(.1,.09*S.trim/loud(a)));put(a,t,k*Math.min(1,g)*.65*(BOOST[name]||1),0,.15);n++;};
// one more blow of the ram at the wall, a swing (2 s) after its last logged one, if it still falls inside the part
if(!CFG&&off['3-wall']!==undefined&&fs.existsSync(`${DIR}/3-wall.json`)){const r=JSON.parse(fs.readFileSync(`${DIR}/3-wall.json`)).filter(e=>e[1]==='ramHit');if(r.length){const t=(off['3-wall']+r[r.length-1][0])/FPS+2/.8;if(t<E('3-wall')-.3)fx('ramHit',t,1,1);}}
// the wave horn as the wall part begins (Jack)
if(!CFG&&off['3-wall']!==undefined)fx('horn',T('3-wall')+.1,1,1);
for(const p of parts){const f=`${DIR}/${p}.json`;if(!fs.existsSync(f))continue;const keep=KEEP[p]||[];ALL=ALLP[p]??.55;for(const [fr,name,g] of JSON.parse(fs.readFileSync(f)).sort((a,b)=>a[0]-b[0]))if(keep.includes(name)){const t=(off[p]+fr)/FPS;
  // a building's upgrade in the game plays the built sound (the upgrade sound is only the menu's star upgrades: Jack);
  // the castle's upgrade two built sounds, one after the other
  if(name==='horn'){fx('horn',t,1,1);continue;}
  if(name==='castleUp'){fx('build',t,1,1);continue;}
  // a raider falling: a grunt, the two recordings in turn
  if(name==='kill'){fx('grunt',t,Math.max(.5,g));continue;}
  // the riders' charge: a neigh and the gallop under it for a few seconds
  if(name==='rush'){fx('neigh',t+.1,1,1);bed('sfx/Horse_gallop.mp3',t,t+3.2,1.2,.3,.9);continue;}
  fx(name,t,g);}}
// a soft limiter, then 16-bit stereo
let pk=0;for(const v of mix)pk=Math.max(pk,Math.abs(v));const buf=Buffer.alloc(44+len*4);
buf.write('RIFF',0);buf.writeUInt32LE(36+len*4,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);buf.writeUInt32LE(SR,24);buf.writeUInt32LE(SR*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(len*4,40);
for(let i=0;i<len;i++){const v=Math.tanh(mix[i]*1.4)/Math.tanh(1.4),s=Math.round(Math.max(-1,Math.min(1,v))*32000);buf.writeInt16LE(s,44+i*4);buf.writeInt16LE(s,46+i*4);}
const wav=DIR+'/mix.wav';fs.writeFileSync(wav,buf);console.log('effects',n,'skipped',skip,'peak',pk.toFixed(2),'secs',end.toFixed(1));
// the frames in order, then the video
const seq=DIR+'/seq';fs.rmSync(seq,{recursive:true,force:true});fs.mkdirSync(seq);let i=0;
for(const p of parts)for(const f of fs.readdirSync(DIR).filter(f=>f.startsWith(p+'-')&&f.endsWith('.png')).sort())fs.symlinkSync(path.resolve(DIR,f),`${seq}/f${String(i++).padStart(5,'0')}.png`);
execFileSync('ffmpeg',['-y','-v','error','-framerate',String(FPS),'-i',`${seq}/f%05d.png`,'-i',wav,'-map','0:v','-map','1:a','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-c:a','aac','-b:a','256k','-ar','48000','-shortest','-movflags','+faststart',OUT]);
fs.rmSync(seq,{recursive:true,force:true});console.log('wrote',OUT);
