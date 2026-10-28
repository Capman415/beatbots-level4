// Room 1: NOTE MINE (style C, cutaway shaft). Static Jr. ate the whole notes; the class digs 8 back up by keeping a steady beat.
'use strict';
(()=>{const ctx=BB.ctx,COL=BB.COL,W=BB.W,H=BB.H,{clamp,lerp,ease}=BB;
BB.VO_LINES=(BB.VO_LINES||[]).concat([
 ['oh_no',"Oh no! The whole note bin is empty!",'sprocket'],
 ['ate_all',"He ate ALL the whole notes! Rhythm Engineers, to the mine!",'sprocket'],
 ['mic',"Hello, Rhythm Engineers! Let's switch on the microphone, so I can hear your claps!",'sprocket'],
 ['andante',"Andante! Walking speed. Clap slow and steady with the turtle!",'sprocket'],
 ['allegro',"Allegro! Fast! Keep up with the rocket!",'sprocket'],
 ['piano',"Piano means soft. Tiny, quiet claps, so the crystal cracks!",'sprocket'],
 ['forte',"Forte means loud! Big, strong claps!",'sprocket'],
 ['cavein',"Cave-in! Allegro AND piano. Fast, but soft!",'sprocket'],
 ['got_note',"A whole note! Four beats long!",'sprocket'],
 ['pebbles',"Hey! Static Jr. is dropping pebbles! Hold that beat steady!",'sprocket'],
 ['complete',"Eight whole notes! Room one complete! Next stop, the Note Smasher!",'sprocket'],
 ['ready',"Ready? Clap on every green light!",'sprocket'],
 ['keepgoing',"Keep that beat going!",'sprocket'],
 ['jr_giggle',"Hee hee hee!",'jr'],['jr_nom',"Nom nom nom!",'jr'],['jr_catch',"Can't catch me!",'jr'],['jr_oof',"Oof!",'jr'],
]);
// ---- world layout (one continuous cutaway: warehouse above, mine below) ----
const GY=880,SHAFT=[1680,2200],PIPE_X=1520,BIN_X=1520,HATCH=[2010,2185],SMASH_X=2500,SPR_X=2880,BTN_X=2720;
const top=k=>1000+k*560,rail=k=>top(k)+380,camY=k=>top(k)+240;
const ROCK_X=2800,BOT_X=2470,LEAD_X=3160,CART_X=1830;
const FLOORS=[
 {name:'ANDANTE',mean:'walking speed',icon:'turtle',vo:'andante',col:'#5f412d'},
 {name:'ALLEGRO',mean:'fast!',icon:'rocket',vo:'allegro',col:'#553a28'},
 {name:'PIANO',mean:'soft',icon:'whisper',vo:'piano',col:'#3a3550'},
 {name:'FORTE',mean:'loud!',icon:'boom',vo:'forte',col:'#4b3223'},
 {name:'CAVE-IN!',mean:'bonus round',icon:null,vo:'cavein',col:'#41291e'},
];
// rock list: 8 whole notes + 2 bonus cave-in rocks
const ROCKS=[
 {f:0,kind:'rock',bpm:75},{f:0,kind:'rock',bpm:75},
 {f:1,kind:'rock',bpm:145,prank:true},{f:1,kind:'rock',bpm:145},
 {f:2,kind:'crystal',bpm:96,dyn:'p'},{f:2,kind:'crystal',bpm:96,dyn:'p',prank:true},
 {f:3,kind:'boulder',bpm:96,dyn:'f'},{f:3,kind:'boulder',bpm:96,dyn:'f'},
 {f:4,kind:'crystal',bpm:145,dyn:'p',bonus:true,sign:['ALLEGRO + PIANO','fast but soft'],icons:['rocket','whisper'],prank:true},
 {f:4,kind:'boulder',bpm:75,dyn:'f',bonus:true,sign:['ANDANTE + FORTE','slow and loud'],icons:['turtle','boom']},
];
const NEED=4;// steady measures per whole note (bonus rocks need 2)
const SOFT_MAX=.62,LOUD_MIN=.7;
// dirt pattern
let dirtPat=null;function dirt(){if(dirtPat)return dirtPat;const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#78503a';g.fillRect(0,0,256,256);let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<70;i++){g.fillStyle=['#6a4532','#86593f','#5f3e2c','#8d6447'][i%4];g.beginPath();g.ellipse(r()*256,r()*256,4+r()*16,3+r()*8,r()*3,0,7);g.fill()}
  return dirtPat=ctx.createPattern(c,'repeat')}
const howTo={title:'NOTE MINE: dig up the whole notes!',
  steps:['Watch the green beat lights.','Clap ONE clap on every light.','4 steady beats = 1 whole note!','Piano = soft claps. Forte = loud claps.','No mic? Tap MANUAL OVERRIDE when they nail it.'],
  words:'"ta - a - a - a" (one whole note = 4 beats)   andante = walking speed,  allegro = fast',
  example:(x,y,w,h,t)=>{const bpm=90,ph=t*bpm/60,b=Math.floor(ph)%4,f=ph%1;
    const lit=[0,0,0,0];lit[b]=1-f*.6;ctx.save();ctx.translate(x+w/2,y+h-80);ctx.scale(.62,.62);BB.beatPills(0,0,lit);ctx.restore();
    const stage=Math.floor(ph/4)%5;drawRock(x+w/2,y+170,95,'rock',stage,f<.15?(1-f/.15)*6:0,0);
    // clapping hands
    const k=f<.15?1:0;ctx.save();ctx.translate(x+w-80,y+90);ctx.fillStyle='#f2c49b';ctx.strokeStyle=COL.ink;ctx.lineWidth=4;
    for(const s of[-1,1]){ctx.save();ctx.rotate(s*(k?.05:.45));ctx.beginPath();ctx.ellipse(s*(k?14:30),0,18,34,0,0,7);ctx.fill();ctx.stroke();ctx.restore()}
    if(k)BB.text('CLAP!',0,-60,30,COL.yellow,{stroke:4});ctx.restore()}};
// ---- rock drawing ----
function rockPts(r,seed){let s=seed*9301+49297;const rnd=()=>((s=(s*9301+49297)%233280)/233280);const p=[];for(let i=0;i<12;i++){const a=i*Math.PI/6;p.push([r*(1+(rnd()-.5)*.27)*Math.cos(a),r*.85*(1+(rnd()-.5)*.27)*Math.sin(a)])}return p}
const crackPaths=[];{let s=3;const rnd=()=>((s=(s*9301+49297)%233280)/233280);
  for(let k=0;k<6;k++){const a=k*1.05+.4,pts=[[0,0]];let x=0,y=0;for(let i=0;i<4;i++){x+=.24*Math.cos(a+(rnd()-.5)*1.2);y+=.24*Math.sin(a+(rnd()-.5)*1.2);pts.push([x,y])}crackPaths.push(pts)}}
function drawRock(x,y,r,kind,stage,shake,wob,o={}){ctx.save();ctx.translate(x+Math.sin(BB.t*60)*shake,y);ctx.rotate(Math.sin(BB.t*14)*wob*.08);
  const pts=rockPts(r,kind==='boulder'?5:kind==='crystal'?2:3);
  if(kind==='crystal'){BB.glow(0,0,r*1.4,o.mixed?'rgba(255,170,120,A)':'rgba(150,220,255,A)',.55)}
  ctx.beginPath();pts.forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();
  ctx.fillStyle=kind==='crystal'?(o.mixed?'#f5c3a0':'#a0d7f5'):kind==='boulder'?(o.mixed?'#8a6a5a':'#6e625c'):'#82746a';ctx.fill();ctx.lineWidth=8;ctx.strokeStyle='#231e1e';ctx.stroke();
  if(kind==='crystal'){for(let i=0;i<5;i++){const a=i*1.3;ctx.fillStyle='rgba(235,250,255,.85)';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r*.8*Math.cos(a),r*.7*Math.sin(a));ctx.lineTo(r*.5*Math.cos(a+.5),r*.5*Math.sin(a+.5));ctx.fill()}}
  else{ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.moveTo(-r*.6,-r*.5);ctx.lineTo(r*.2,-r*.7);ctx.lineTo(-r*.1,-r*.2);ctx.fill();
    if(kind==='boulder'){ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(r*.35,r*.3,r*.25,r*.15,.3,0,7);ctx.fill()}}
  // the whole note glowing inside
  const g=.25+stage*.18;BB.glow(0,0,r*.6,'rgba(255,245,190,A)',g);
  BB.wholeNote(0,0,r*.3,{fill:'#fff8d0'});
  ctx.save();ctx.beginPath();pts.forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.clip();ctx.strokeStyle='#191414';ctx.lineWidth=6;ctx.lineCap='round';
  for(let k=0;k<Math.min(6,stage*1.5);k++){const p=crackPaths[k];ctx.beginPath();p.forEach(q=>ctx.lineTo(q[0]*r*1.05,q[1]*r*1.05));ctx.stroke()}
  if(stage>=3){ctx.globalAlpha=.6+.4*Math.sin(BB.t*20);ctx.strokeStyle='#fff3b0';ctx.lineWidth=3;for(let k=0;k<4;k++){const p=crackPaths[k];ctx.beginPath();p.forEach(q=>ctx.lineTo(q[0]*r*1.05,q[1]*r*1.05));ctx.stroke()}}
  ctx.restore();ctx.restore()}
function drawCart(x,base,n){ctx.save();ctx.translate(x,base);ctx.lineWidth=6;ctx.strokeStyle=COL.ink;
  for(let i=Math.min(n,8)-1;i>=0;i--){BB.wholeNote(-95+(i%4)*63+(i>=4?30:0),-200-(i>=4?26:0),27,{rot:(i%3-1)*.2})}
  ctx.fillStyle='#c85a32';ctx.beginPath();ctx.moveTo(-170,-190);ctx.lineTo(170,-190);ctx.lineTo(145,-45);ctx.lineTo(-145,-45);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#8c3c20';ctx.lineWidth=5;for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(-160+k*4,-150+k*40);ctx.lineTo(160-k*4,-150+k*40);ctx.stroke()}
  for(const wx of[-100,100]){ctx.fillStyle='#323741';ctx.strokeStyle='#14141a';ctx.beginPath();ctx.arc(wx,-40,40,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fac846';ctx.beginPath();ctx.arc(wx,-40,13,0,7);ctx.fill()}
  ctx.restore()}
// ---- the room ----
class MineRoom{
  constructor(o={}){this.o=o}
  enter(){Object.assign(this,{cam:{x:960,y:540,z:1},count:0,binCount:0,lit:[0,0,0,0,0],pipeGlow:0,elevY:GY,botX:1960,botOnElev:true,
    jr:{x:1650,y:GY,vis:true,mode:'munch'},rockI:0,state:'intro',st:0,beat:null,flying:[],pipeNotes:[],stage:0,wob:0,shk:0,
    hatch:0,btnPress:0,sprCheer:0,said:{},prank:null,cardT:-9,lastOverride:-9,doneT:0,marks:[0,0,0,0],dust:[]});this.introT0=BB.t;
    for(let i=0;i<40;i++)this.dust.push({x:Math.random()*W,y:Math.random()*H,s:1+Math.random()*3,v:5+Math.random()*12});
    if(this.o.skipIntro||this.o.startAt){this.skipIntro(this.o.startAt||0)}}
  exit(){this.beat=null}
  // -------- intro timeline (~32 s) --------
  skipIntro(at=0){this.rockI=at;this.count=Math.min(8,at);this.binCount=this.count;this.lit=[1,1,1,1,1];this.pipeGlow=1;this.jr.vis=false;
    const f=ROCKS[at].f;this.elevY=rail(f);this.cam={x:2400,y:camY(f),z:1};this.botOnElev=false;this.botX=BOT_X;this.hatch=0;this.beginRock(true)}
  intro(t,dt){const c=this.cam,ev=(k,fn)=>{if(!this.said[k]&&t>=+k.split('@')[1]){this.said[k]=1;fn()}};
    if(t<6){c.x=lerp(960,2400,ease.inOut(clamp(t/6,0,1)));c.y=540;c.z=1}
    ev('alarm@.2',()=>BB.sfx.alarm());
    ev('nom@6.2',()=>BB.say('jr_nom'));
    ev('burp@8.5',()=>{BB.sfx.burp();this.jr.mode='burp';this.burpT=BB.t;BB.shake(3)});
    ev('gig@9.8',()=>{BB.say('jr_giggle');BB.sfx.glitch();this.jr.mode='giggle'});
    ev('run@11.4',()=>{this.jr.mode='run';BB.sfx.whoosh()});
    if(this.jr.mode==='run'){this.jr.x=Math.min(2098,this.jr.x+dt*520);if(this.jr.x>=2098){this.jr.mode='dive';this.jr.vy=-700;BB.sfx.clunk();this.hatch=1}}
    if(this.jr.mode==='dive'){this.jr.vy+=2200*dt;this.jr.y+=this.jr.vy*dt;this.jr.rot=(this.jr.rot||0)+dt*8;if(this.jr.y>GY+700){this.jr.vis=false;this.jr.mode='gone'}}
    if(this.jr.mode==='gone')this.hatch=Math.max(0,this.hatch-dt*1.5);
    ev('ohno@13.4',()=>{BB.say('oh_no');this.sprCheer=-1});
    ev('ateall@16.3',()=>{BB.say('ate_all');this.sprCheer=1});
    ev('btn@20.6',()=>{this.btnPress=BB.t;BB.sfx.clunk();BB.sfx.motor(BB.ac.currentTime,4.4);this.sprCheer=0});
    if(t>20.6&&t<24){const k=ease.inOut(clamp((t-20.6)/3.2,0,1));c.z=lerp(1,.29,k);c.y=lerp(540,1880,k);c.x=2400}
    if(t>21){this.elevY=lerp(GY,rail(0),ease.inOut(clamp((t-21)/4,0,1)))}
    for(let k=0;k<5;k++)ev(`lit${k}@${23.6+k*.8}`,()=>{BB.sfx.clunk();BB.shake(2);this.litT=BB.t});
    for(let k=0;k<5;k++)if(t>23.6+k*.8)this.lit[k]=Math.min(1,this.lit[k]+dt*4);
    if(t>27.6)this.pipeGlow=Math.min(1,(t-27.6)/1.2);
    ev('pipe@27.6',()=>BB.sfx.whoosh(BB.ac.currentTime,1.2));
    if(t>28.8&&t<31.2){const k=ease.inOut(clamp((t-28.8)/2.4,0,1));c.z=lerp(.29,1,k);c.y=lerp(1880,camY(0),k)}
    if(t>27.5&&this.botOnElev){} 
    if(t>=31.2){this.botOnElev=false;this.botWalk=BB.t;this.beginRock(true)}}
  // -------- rock flow --------
  beginRock(first){const R=ROCKS[this.rockI];this.R=R;this.stage=0;this.state='drop';this.st=BB.t;this.rockY=-400;this.marks=[0,0,0,0];this.missVO=false;
    const newFloor=first||ROCKS[this.rockI-1]&&ROCKS[this.rockI-1].f!==R.f;
    if(newFloor){this.cardT=BB.t;if(R.f===4){BB.sfx.rumble(BB.ac.currentTime,2);BB.shake(6);this.caveT=BB.t}
      setTimeout(()=>{if(BB.scene===this)this.voEnd=BB.t+BB.say(FLOORS[R.f].vo)},first?2200:300)}
    else this.voEnd=BB.t+.5;
    if(R.bonus&&!newFloor){this.voEnd=BB.t+.5;BB.caption={txt:'BONUS! Andante + forte: slow and LOUD!',who:'sprocket',until:BB.t+3.5,start:BB.t}}}
  startBeat(){const R=this.R,spb=60/R.bpm,t0=BB.ac.currentTime+.25;
    this.beat={spb,t0,next:0,evalM:1,hits:{},sim:0};// measure 0 = count-in, scoring starts measure 1
    if(!this.said.ready){this.said.ready=1;BB.say('ready')}}
  beatNow(){const b=this.beat;return b?(BB.ac.currentTime-b.t0)/b.spb:0}
  scheduleTicks(){const b=this.beat,ahead=BB.ac.currentTime+.12;
    while(b.t0+b.next*b.spb<ahead){const t=b.t0+b.next*b.spb;BB.sfx.tick(t,b.next%4===0,this.R.dyn==='p'?.6:1);
      if(BB.debug&&b.next>=4&&Math.random()<.92){const lvl=this.R.dyn==='p'?.45:this.R.dyn==='f'?.9:.7;setTimeout(()=>BB.simClap(t+(Math.random()-.5)*.08,lvl),Math.max(0,(t-BB.ac.currentTime)*1000+30))}
      b.next++}}
  handleOnsets(){const b=this.beat,ons=BB.mic.take();if(!b||this.state!=='dig')return;
    const tol=Math.min(.17,b.spb*.32);
    for(const o of ons){if(BB.talking&&BB.t<BB.talking.until&&!BB.debug)continue;// ignore our own voice lines
      const bi=Math.round((o.t-b.t0)/b.spb),dt=o.t-(b.t0+bi*b.spb);if(bi<4||Math.abs(dt)>tol||b.hits[bi])continue;
      const d=this.R.dyn;
      if(d==='p'&&o.lvl>SOFT_MAX){this.tooLoud=BB.t;BB.sfx.wobble();BB.burst(ROCK_X,rail(this.R.f)-170,14,{cols:['#cfefff','#fff','#9fe0ff'],kind:'star',size:9,g:200,speed:300});continue}
      if(d==='f'&&o.lvl<LOUD_MIN){this.tooSoft=BB.t;BB.burst(ROCK_X-120,rail(this.R.f)-150,6,{col:'#b9a58c',kind:'dust',size:16,g:-40,speed:120});continue}
      b.hits[bi]=1;this.marks[bi%4]=.01;this.hitT=BB.t;BB.sfx.tink();if(d==='f'){BB.sfx.boom();BB.shake(5)}
      BB.burst(ROCK_X-140,rail(this.R.f)-170,12,{cols:['#ffe066','#fff','#ffb040'],speed:600,size:12})}}
  evalMeasures(){const b=this.beat;if(this.state!=='dig')return;const tol=Math.min(.17,b.spb*.32);
    while(BB.ac.currentTime>b.t0+(b.evalM*4+3)*b.spb+tol+.02){const m=b.evalM;let n=0;for(let i=0;i<4;i++)if(b.hits[m*4+i])n++;
      b.evalM++;this.marks=[0,0,0,0];
      if(n>=3)this.crack();
      else{const talking=BB.talking&&BB.t<BB.talking.until;if(talking&&!BB.debug)continue;
        this.wob=1;BB.sfx.wobble();this.shrugT=BB.t;BB.burst(ROCK_X,rail(this.R.f)-60,10,{col:'#c8b49a',kind:'dust',size:18,g:-60,speed:160});
        if(!this.missVO&&n<2){this.missVO=true;BB.say('keepgoing')}}}}
  crack(){const R=this.R;this.stage+=R.bonus?2:1;BB.sfx.crack();BB.shake(4);this.shk=1;
    BB.burst(ROCK_X,rail(R.f)-150,16,{cols:['#a08c78','#6e5a4a','#ffe066'],speed:500,size:12,kind:'dot'});
    if(this.stage>=NEED)this.popNote()}
  popNote(){const R=this.R;this.state='pop';this.st=BB.t;this.beat=null;BB.sfx.chime();BB.sfx.pop();BB.shake(6);
    BB.burst(ROCK_X,rail(R.f)-150,40,{cols:['#ffe066','#fff','#6ee678'],speed:800,size:14,kind:'star',g:500});
    this.halves={t:BB.t};this.flying.push({t0:BB.t,x0:ROCK_X,y0:rail(R.f)-150,x1:PIPE_X,y1:rail(R.f)-120,gold:!!R.bonus,f:R.f});
    if(this.rockI===0)setTimeout(()=>BB.scene===this&&BB.say('got_note'),500)}
  manualOverride(){if(BB.t-this.lastOverride<.5)return;this.lastOverride=BB.t;this.ovPop=BB.t;
    if(this.state==='dig'||this.state==='count'){this.marks=[1,1,1,1];if(this.state==='count'){this.state='dig';this.beat.evalM=Math.max(1,Math.ceil(this.beatNow()/4))}
      this.beat.evalM=Math.max(this.beat.evalM,Math.ceil(this.beatNow()/4));this.crack()}}
  pause(){BB.paused=true;BB.ac.suspend()}
  resume(){BB.paused=false;BB.mic.onsets=[];BB.ac.resume()}
  update(dt){const t=BB.t;
    if(BB.keys.includes(' '))this.manualOverride();if(BB.keys.includes('p')){this.pause();return}
    if(this.state==='intro'){this.intro(t-this.introT0,dt);if(BB.keys.includes('s'))this.skipIntro()}
    if(this.introT0===undefined)this.introT0=t;
    this.wob=Math.max(0,this.wob-dt*1.5);this.shk=Math.max(0,this.shk-dt*3);for(let i=0;i<4;i++)if(this.marks[i])this.marks[i]=Math.min(1,this.marks[i]+dt*5);
    if(this.botWalk!==undefined){const k=clamp((t-this.botWalk)/1.4,0,1);this.botX=lerp(1960,BOT_X,ease.inOut(k))}
    if(this.state==='drop'){const k=clamp((t-this.st)/.9,0,1);this.rockY=lerp(-400,0,ease.out(k));if(k>=1&&!this.landed){this.landed=1;BB.sfx.clunk();BB.shake(4)}
      if(k>=1&&t>this.voEnd){this.landed=0;this.state='count';this.startBeat()}}
    if(this.beat){this.scheduleTicks();if(this.state==='count'&&this.beatNow()>=3.6)this.state='dig';this.handleOnsets();this.evalMeasures()}
    else BB.mic.take();
    if(this.state==='pop'&&t-this.st>2.4){this.rockI++;if(this.rockI>=ROCKS.length)this.finish();else this.beginRock(false)}
    // elevator travel between floors
    if(this.R&&this.state!=='intro'&&this.state!=='end'){const ty=rail(this.R.f);if(Math.abs(this.elevY-ty)>1){
        if(!this.moving){this.moving=1;BB.sfx.motor(BB.ac.currentTime,1.8);this.botOnElev=true;this.botWalk=undefined;this.botX=1960}
        this.elevY=Math.min(ty,this.elevY+dt*340);this.cam.y=Math.min(camY(this.R.f),this.elevY-140);if(this.state==='drop')this.st=t;}
      else if(this.moving){this.moving=0;this.botOnElev=false;this.botWalk=t;this.cam.y=camY(this.R.f)}}
    // flying notes -> pipe -> bin
    for(let i=this.flying.length-1;i>=0;i--){const n=this.flying[i];if(t-n.t0>1.1){this.flying.splice(i,1);this.pipeNotes.push({y:n.y1,gold:n.gold});
      if(!n.gold)this.count++;BB.sfx.ding();this.meterPop=t}}
    for(let i=this.pipeNotes.length-1;i>=0;i--){const p=this.pipeNotes[i];p.y-=dt*1100;if(p.y<GY-120){this.pipeNotes.splice(i,1);this.binCount++;}}
    // Static Jr. pebble prank: once per marked rock, during the 2nd scored measure
    if(this.R&&this.R.prank&&this.state==='dig'&&!this.prank&&this.beat&&this.beatNow()>8)this.startPrank();
    if(this.prank)this.updPrank(dt);
    if(this.state==='end')this.updEnd(dt);
    for(const d of this.dust){d.y-=d.v*dt;d.x+=Math.sin(t*.5+d.s)*6*dt;if(d.y<-10){d.y=H+10;d.x=Math.random()*W}}}
  startPrank(){this.prank={t:BB.t,x:3400,ph:'in'};BB.sfx.glitch();setTimeout(()=>{if(BB.scene===this)BB.say('jr_giggle',{overlap:true})},500)}
  updPrank(dt){const p=this.prank,t=BB.t-p.t;
    if(p.ph==='in'){p.x=lerp(3400,3060,ease.out(clamp(t/.9,0,1)));if(t>1){p.ph='throw';p.t2=BB.t;this.pebbleT=BB.t;BB.say('pebbles',{nocap:false})}}
    if(p.ph==='throw'){const tt=BB.t-p.t2;this.wob=Math.max(this.wob,.9);if(Math.random()<dt*14){BB.sfx.pebble();this.pebbles=(this.pebbles||[]);this.pebbles.push({x:780+Math.random()*360,y:H-260,vy:-200,vx:(Math.random()-.5)*200})}
      if(tt>3.2){p.ph='bonk';p.t3=BB.t;BB.sfx.bonk();BB.say('jr_oof',{overlap:true,nocap:true});BB.burst(p.x,rail(this.R.f)-200,10,{col:COL.yellow,kind:'star',size:14,g:300})}}
    if(p.ph==='bonk'){const tt=BB.t-p.t3;if(tt>1.4){p.ph='out'}}
    if(p.ph==='out'){p.x+=dt*900;if(p.x>3500)p.ph='done'}
    if(this.pebbles)for(const q of this.pebbles){q.vy+=1600*dt;q.y+=q.vy*dt;q.x+=q.vx*dt;if(q.y>H-70&&q.vy>0){q.vy*=-.4;q.y=H-70}}
    if(this.pebbles)this.pebbles=this.pebbles.filter(q=>Math.abs(q.vy)>40||q.y<H-75)}
  finish(){this.state='end';this.st=BB.t;this.botOnElev=true;this.botX=1960;BB.sfx.motor(BB.ac.currentTime,4);this.endSaid=0}
  updEnd(dt){const t=BB.t-this.st,c=this.cam;
    if(t<.8){this.botOnElev=true}
    this.elevY=lerp(rail(4),GY,ease.inOut(clamp((t-.5)/4,0,1)));
    c.z=lerp(1,.62,ease.inOut(clamp(t/1.5,0,1)));if(t>4)c.z=lerp(.62,1,ease.inOut(clamp((t-4)/1.5,0,1)));
    c.y=t<4.5?this.elevY-60:lerp(GY-60,540,ease.inOut(clamp((t-4.5)/1.2,0,1)));c.x=2400;
    if(t>4.6&&!this.endSaid){this.endSaid=1;BB.say('complete');BB.sfx.fanfare();this.sprCheer=1;BB.burst(W/2,300,60,{cols:['#ffe066','#6ee678','#fff','#e65046','#5ac8fa'],kind:'star',size:16,speed:900,g:600,life:2})}
    if(t>5.6&&!this.saved){this.saved=1;if(!BB.save.done.includes('mine')){BB.save.done.push('mine');localStorage.setItem('bb4',JSON.stringify(BB.save))}}}
  // ================= drawing =================
  draw(){const c=this.cam,[sx,sy]=BB.shakeXY;ctx.save();ctx.translate(W/2+sx,H/2+sy);ctx.scale(c.z,c.z);ctx.translate(-c.x,-c.y);
    this.drawWorld();ctx.restore();
    // screen-space ambient dust in the mine
    if(c.y>GY){ctx.fillStyle='rgba(255,240,200,.35)';for(const d of this.dust){ctx.beginPath();ctx.arc(d.x,d.y,d.s,0,7);ctx.fill()}}
    BB.drawParts();
    if(this.state==='intro')this.drawIntroHUD();else if(this.state!=='end')this.drawHUD();
    BB.captionBox();
    if(this.R&&BB.t-this.cardT<2.4&&this.state!=='end'){const F=FLOORS[this.R.f];BB.titleCard(this.rockI===0?'ROOM 1: NOTE MINE':F.name,this.rockI===0?'Static Jr. ate the whole notes. Dig them back up!':F.mean,(BB.t-this.cardT)/2.4)}
    if(this.state==='end')this.drawEnd();
    if(BB.paused)BB.pauseOverlay(howTo,()=>this.resume())}
  drawWorld(){const c=this.cam,t=BB.t;const vx0=c.x-W/2/c.z-50,vx1=c.x+W/2/c.z+50,vy0=c.y-H/2/c.z-50,vy1=c.y+H/2/c.z+50;
    // sky + warehouse interior
    if(vy0<GY){const g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#9ccfe6');g.addColorStop(1,'#c7e3ee');ctx.fillStyle=g;ctx.fillRect(vx0,Math.min(vy0,0),vx1-vx0,GY-Math.min(vy0,0));
      this.drawWarehouse(vx0,vx1)}
    // dirt
    ctx.fillStyle=dirt();ctx.fillRect(vx0,GY,vx1-vx0,Math.max(0,vy1-GY));
    ctx.fillStyle='rgba(60,35,22,.35)';for(let k=0;k<5;k++)ctx.fillRect(vx0,top(k)-60,vx1-vx0,14);
    // tunnels
    for(let k=0;k<5;k++){const y=top(k);if(y>vy1||y+420<vy0)continue;this.drawTunnel(k)}
    // pipe from mine to the WHOLE NOTES bin
    this.drawPipe();
    // shaft + elevator
    ctx.fillStyle='#2a1b14';ctx.fillRect(SHAFT[0],GY,SHAFT[1]-SHAFT[0],rail(4)+60-GY);
    ctx.strokeStyle='#4a3428';ctx.lineWidth=10;for(let y=GY+60;y<rail(4);y+=140){ctx.beginPath();ctx.moveTo(SHAFT[0],y);ctx.lineTo(SHAFT[1],y+70);ctx.stroke()}
    ctx.fillStyle='#5a4030';ctx.fillRect(SHAFT[0]-14,GY,14,rail(4)+60-GY);ctx.fillRect(SHAFT[1],GY,14,rail(4)+60-GY);
    for(let k=0;k<5;k++){ctx.fillStyle='#3a2a20';ctx.fillRect(SHAFT[0],top(k)+40,SHAFT[1]-SHAFT[0],340);
      // light strip on the shaft door frame
      const l=this.lit[k];ctx.fillStyle=l>.5?(Math.sin(t*3+k)>0?'#6ee678':'#3c8a48'):'#333';ctx.fillRect(SHAFT[0]+10,top(k)+40,12,12);ctx.fillRect(SHAFT[1]-22,top(k)+40,12,12)}
    // tunnels pass through the shaft (open doorways)
    for(let k=0;k<5;k++){ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(SHAFT[0],rail(k)-6,SHAFT[1]-SHAFT[0],12)}
    // cables
    ctx.strokeStyle='#1a1a1a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(1760,140);ctx.lineTo(1760,this.elevY-250);ctx.moveTo(2120,140);ctx.lineTo(2120,this.elevY-250);ctx.stroke();
    // elevator cage
    const ey=this.elevY;ctx.strokeStyle='#e0b23c';ctx.lineWidth=8;ctx.strokeRect(1700,ey-330,480,330);ctx.beginPath();ctx.moveTo(1700,ey-330);ctx.lineTo(2180,ey-330);ctx.stroke();
    ctx.fillStyle='#e0b23c';ctx.fillRect(1740,ey-345,400,18);
    drawCart(CART_X,ey,this.count);
    if(this.botOnElev)BB.pickbot(this.botX,ey,240,.2+.1*Math.sin(t*3));
    ctx.fillStyle='#4a4f58';ctx.fillRect(1690,ey,500,26);ctx.save();ctx.beginPath();ctx.rect(1690,ey,500,26);ctx.clip();
    for(let x=1650;x<2200;x+=50){ctx.fillStyle='#ffd23c';ctx.beginPath();ctx.moveTo(x,ey+26);ctx.lineTo(x+25,ey);ctx.lineTo(x+50,ey);ctx.lineTo(x+25,ey+26);ctx.fill()}ctx.restore();
    // Static Jr. diving
    if(this.jr.vis&&(this.jr.mode==='dive'))BB.staticJr(this.jr.x,this.jr.y,110,{rot:this.jr.rot,glitch:.6});
    // warehouse floor slab (with the NOTE MINE hatch)
    if(vy0<GY+60){ctx.fillStyle='#6f7d7b';ctx.fillRect(vx0,GY,SHAFT[0]-vx0,40);ctx.fillRect(SHAFT[1],GY,vx1-SHAFT[1],40);ctx.fillStyle='#55605e';ctx.fillRect(vx0,GY+40,vx1-vx0,10);
      const hd=ease.out(this.hatch);ctx.fillStyle='#2a3433';ctx.save();
      for(const [hx,s] of[[HATCH[0],1],[HATCH[1],-1]]){ctx.save();ctx.translate(hx,GY);ctx.rotate(s*hd*1.4);ctx.fillStyle='#ffd23c';ctx.fillRect(s>0?0:-88,0,88,24);ctx.fillStyle=COL.ink;for(let i=0;i<4;i++)ctx.fillRect((s>0?0:-88)+i*22+4,0,10,24);ctx.restore()}ctx.restore()}
    if(this.jr.vis&&this.jr.mode!=='dive')this.drawJrWarehouse();
  }
  drawWarehouse(vx0,vx1){const t=BB.t;
    ctx.fillStyle='#93b6bb';ctx.fillRect(vx0,150,vx1-vx0,GY-150);
    ctx.fillStyle='#7fa1a6';for(let x=Math.floor(vx0/320)*320;x<vx1;x+=320)ctx.fillRect(x,150,16,GY-150);
    // roof sawtooth
    ctx.fillStyle='#c8beaa';ctx.strokeStyle='#786e64';ctx.lineWidth=4;for(let x=Math.floor(vx0/240)*240;x<vx1;x+=240){ctx.beginPath();ctx.moveTo(x,170);ctx.lineTo(x+120,70);ctx.lineTo(x+240,170);ctx.fill();ctx.stroke()}
    ctx.fillStyle='#d8cfb8';ctx.fillRect(vx0,160,vx1-vx0,24);
    // hanging lamps
    for(let x=200;x<3400;x+=400){ctx.strokeStyle='#333';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,184);ctx.lineTo(x,250);ctx.stroke();BB.glow(x,262,110,'rgba(255,230,160,A)',.35);ctx.fillStyle='#2d4a47';ctx.beginPath();ctx.moveTo(x-30,265);ctx.lineTo(x+30,265);ctx.lineTo(x+16,245);ctx.lineTo(x-16,245);ctx.fill()}
    // shelves with crates (left)
    for(let s=0;s<3;s++){const sx=120+s*420;ctx.fillStyle='#5b6e70';ctx.fillRect(sx,330,20,550);ctx.fillRect(sx+340,330,20,550);
      for(let r=0;r<3;r++){const y=470+r*170;ctx.fillStyle='#e0a040';ctx.fillRect(sx,y,360,16);for(let b=0;b<3;b++){const cx=sx+30+b*110;ctx.fillStyle=['#c8915a','#b47d4a','#d2a064'][(s+r+b)%3];ctx.fillRect(cx,y-90,90,90);ctx.strokeStyle='#6e4a28';ctx.lineWidth=3;ctx.strokeRect(cx,y-90,90,90);ctx.beginPath();ctx.moveTo(cx,y-45);ctx.lineTo(cx+90,y-45);ctx.stroke()}}}
    // conveyor
    ctx.fillStyle='#2b3b3a';ctx.fillRect(40,780,1340,50);ctx.fillStyle='#4b5f5d';for(let x=0;x<1340;x+=56)ctx.fillRect(40+((x+t*80)%1340),788,28,34);
    for(let x=80;x<1380;x+=140){ctx.fillStyle='#1e2a29';ctx.beginPath();ctx.arc(x,850,18,0,7);ctx.fill()}
    // wall gears + blinking lights
    BB.gear(1300,380,70,t*.5,'#5d7e82');BB.gear(1395,450,46,-t*.76,'#6c8e92');BB.gear(3250,360,80,-t*.4,'#5d7e82');
    for(let i=0;i<14;i++){const on=Math.sin(t*3+i*1.9)>.2;ctx.fillStyle=on?'#ffe066':'#5e5e48';ctx.beginPath();ctx.arc(150+i*230,215,7,0,7);ctx.fill()}
    // WAREHOUSE banner
    BB.rrect(1180,560,250,70,14,COL.cream,COL.creamEdge,4);BB.text('RHYTHM WAREHOUSE',1305,597,26,'#28403c');
    // NOTE MINE sign over hatch
    BB.rrect(HATCH[0]-20,640,215,90,16,COL.cream,COL.creamEdge,4);BB.rrect(HATCH[0]-8,650,191,70,12,COL.teal,COL.teal2,3);BB.text('NOTE MINE ↓',(HATCH[0]+HATCH[1])/2,686,30,COL.yellow,{stroke:4});
    // WHOLE NOTES bin
    const bx=BIN_X;ctx.fillStyle='#9fb0b4';ctx.strokeStyle=COL.ink;ctx.lineWidth=5;
    for(let i=0;i<Math.min(this.binCount,10);i++)BB.wholeNote(bx-60+(i%4)*40,GY-175-Math.floor(i/4)*26+(i%2)*6,26,{rot:(i%3-1)*.3});
    ctx.beginPath();ctx.moveTo(bx-95,GY-170);ctx.lineTo(bx+95,GY-170);ctx.lineTo(bx+80,GY);ctx.lineTo(bx-80,GY);ctx.closePath();ctx.fill();ctx.stroke();
    BB.rrect(bx-80,GY-130,160,46,10,COL.cream,COL.creamEdge,3);BB.text('WHOLE NOTES',bx,GY-106,24,'#28403c');
    if(this.binCount===0){ctx.fillStyle='#e8e4d8';for(let i=0;i<9;i++){ctx.beginPath();ctx.arc(bx-110+i*28,GY-6-(i%3)*5,4+(i%2)*3,0,7);ctx.fill()}}
    // SMASH-O-MATIC 4000 (idle) beside the shaft
    const mx=SMASH_X;ctx.fillStyle='#4e6e78';ctx.strokeStyle=COL.ink;ctx.lineWidth=5;ctx.fillRect(mx-160,GY-470,40,470);ctx.strokeRect(mx-160,GY-470,40,470);ctx.fillRect(mx+120,GY-470,40,470);ctx.strokeRect(mx+120,GY-470,40,470);
    BB.rrect(mx-190,GY-540,380,100,14,'#c85a32',COL.ink,5);BB.text('SMASH-O-MATIC',mx,GY-505,30,'#fff',{stroke:4});BB.text('4000',mx,GY-468,26,COL.yellow,{stroke:4});
    const hy=GY-420+Math.sin(t*1.2)*6;ctx.fillStyle='#8a9aa3';ctx.fillRect(mx-12,GY-440,24,hy-(GY-440)+20);BB.rrect(mx-90,hy+20,180,80,10,'#6b7b84',COL.ink,5);
    BB.rrect(mx-120,GY-90,240,90,10,'#3d4f55',COL.ink,5);for(let i=0;i<3;i++){ctx.fillStyle=Math.sin(t*4+i*2)>0?'#6ee678':'#2b4a32';ctx.beginPath();ctx.arc(mx-50+i*50,GY-45,10,0,7);ctx.fill()}
    // elevator call button
    const pressed=this.btnPress&&BB.t-this.btnPress<.4;ctx.fillStyle='#5d6e70';ctx.fillRect(BTN_X-24,GY-140,48,140);ctx.strokeRect(BTN_X-24,GY-140,48,140);
    ctx.fillStyle='#e65046';ctx.beginPath();ctx.ellipse(BTN_X,GY-148+(pressed?8:0),44,18,0,0,7);ctx.fill();ctx.stroke();
    // Sprocket in the warehouse
    const talk=BB.isTalking('sprocket'),ch=this.sprCheer;
    BB.sprite('sprocket',SPR_X,GY,400,{squash:(talk?Math.sin(t*16)*.02:0)+(ch>0?Math.abs(Math.sin(t*8))*.04:0),rot:ch<0?Math.sin(t*20)*.03:0});}
  drawJrWarehouse(){const j=this.jr,m=j.mode,t=BB.t;const glitch=m==='giggle'?(Math.sin(t*30)>.3?1:0):0;
    const sq=m==='munch'?Math.abs(Math.sin(t*12))*.06:m==='burp'?.08*Math.exp(-(t-this.burpT)*4):0;
    BB.staticJr(j.x,j.y,110,{stuffed:m==='munch',squash:sq,glitch,run:m==='run'?1:0,rot:m==='giggle'?Math.sin(t*25)*.08:0});
    if(m==='munch'&&Math.random()<.2)BB.burst(j.x+30,j.y-110,1,{col:'#fff',kind:'dot',size:5,g:900,speed:150,a0:-1.5,spread:1});
    if(m==='burp'&&t-this.burpT<1.6){const k=(t-this.burpT)/1.6;ctx.save();ctx.globalAlpha=1-k;ctx.font="70px 'Lilita One'";ctx.fillStyle='#fff';ctx.strokeStyle=COL.ink;ctx.lineWidth=5;ctx.textAlign='center';
      ctx.strokeText('♪',j.x+20+Math.sin(k*8)*20,j.y-180-k*120);ctx.fillText('♪',j.x+20+Math.sin(k*8)*20,j.y-180-k*120);BB.text('BURP!',j.x-90,j.y-200,40,COL.yellow,{stroke:6});ctx.restore()}}
  drawTunnel(k){const y=top(k),l=this.lit[k],F=FLOORS[k],t=BB.t,active=this.R&&this.R.f===k;
    BB.rrect(1460,y,1880,420,70,F.col);
    // back-wall texture
    ctx.save();ctx.beginPath();ctx.roundRect(1460,y,1880,420,70);ctx.clip();
    ctx.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<14;i++){ctx.beginPath();ctx.ellipse(1500+i*140+(k*37)%60,y+120+((i*53+k*29)%180),60,28,0,0,7);ctx.fill()}
    if(k===2){for(let i=0;i<9;i++){const cx=2300+i*120,h=60+(i*37)%80;BB.glow(cx,y+410-h/2,h,'rgba(150,220,255,A)',.25*l);ctx.fillStyle='rgba(160,215,245,'+(.4+.5*l)+')';ctx.beginPath();ctx.moveTo(cx-20,y+410);ctx.lineTo(cx,y+410-h);ctx.lineTo(cx+20,y+410);ctx.fill()}}
    if(k===1&&active&&this.beat){ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=4;for(let i=0;i<14;i++){const sx=3400-((t*1600+i*397)%2000),sy=y+40+(i*71)%320;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+180,sy);ctx.stroke()}}
    // timber supports
    for(const bx of[2280,3020]){ctx.fillStyle='#8a5a32';ctx.fillRect(bx,y+20,34,360);ctx.fillRect(bx-50,y+16,134,30)}
    // string lights along the ceiling
    for(let i=0;i<14;i++){const lx=2260+i*80,ly=y+60+Math.sin(i*.9)*10,on=l>.5&&Math.sin(t*2+i)>-0.6;if(on)BB.glow(lx,ly,40,'rgba(255,220,140,A)',.5*l);ctx.fillStyle=on?'#ffe9a0':'#4a3a2a';ctx.beginPath();ctx.arc(lx,ly,8,0,7);ctx.fill()}
    // darkness until the tunnel powers on
    if(l<1){ctx.fillStyle=`rgba(10,6,4,${.75*(1-l)})`;ctx.fillRect(1460,y,1880,420)}
    ctx.restore();
    // rails
    ctx.fillStyle='#5a3c26';for(let x=2220;x<3320;x+=60)ctx.fillRect(x,rail(k)-4,30,14);ctx.fillStyle='#aaaab4';ctx.fillRect(2220,rail(k)-10,1100,8);
    // painted tempo word on the tunnel wall
    BB.text(F.name,2330,y+48,34,COL.yellow,{font:'Rammetto One',align:'left',stroke:5});
    // leader robot for this floor
    const ph=active&&this.beat?(this.beatNow()%1+1)%1:(t*1.2)%1,b=BB.bounce(ph,active?.07:.02);
    if(k===0)BB.sprite('turtle',LEAD_X,rail(k),190,{squash:b});
    if(k===1)BB.sprite('rocket',LEAD_X,rail(k)-20-Math.sin(t*6)*10,240,{squash:b,rot:-.15});
    if(k===2){BB.sprite('whisper',LEAD_X,rail(k),260,{squash:b});if(active&&this.tooLoud&&t-this.tooLoud<1.2)this.bubble(LEAD_X-260,rail(k)-330,'shhh... softer!')}
    if(k===3){BB.sprite('boom',LEAD_X,rail(k),270,{squash:b*1.5});if(active&&this.tooSoft&&t-this.tooSoft<1.2)this.bubble(LEAD_X-280,rail(k)-330,'LOUDER! BOOM!')}
    if(k===4){// cave-in rubble
      ctx.fillStyle='#5e4a3c';for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(3080+i*35,rail(k)-20-(i%3)*25,50,34,i,0,7);ctx.fill()}
      if(this.R&&this.R.icons&&active){BB.sprite(this.R.icons[0],3060,rail(k),170,{squash:b});BB.sprite(this.R.icons[1],3230,rail(k),200,{squash:b})}}
    // Sorter Bot + rock on the active floor
    if(active||(this.R&&k===this.R.f)){
      if(!this.botOnElev){const ph2=this.beat?((this.beatNow()%1)+1)%1:.5;let sw=this.beat?(ph2<.12?1:ph2<.8?1-ease.out((ph2-.12)/.68):ease.inOut((ph2-.8)/.2)):.3+.05*Math.sin(t*3);
        const shrug=this.shrugT&&t-this.shrugT<.8;BB.pickbot(this.botX,rail(k),300,sw,{squash:this.beat?BB.bounce(ph2,.06):0});
        if(shrug)this.bubble(this.botX-90,rail(k)-420,'¯\\_(ツ)_/¯')}
      if(this.state!=='pop'&&this.state!=='end'&&this.state!=='intro'){const R=this.R,r=R.kind==='boulder'?170:R.kind==='crystal'?135:150;
        const beatShk=this.beat&&this.state!=='drop'?Math.max(0,1-((this.beatNow()%1)+1)%1*6)*2:0;
        drawRock(ROCK_X,rail(k)-r*.85+this.rockY,r,R.kind,this.stage,beatShk+this.shk*10,this.wob,{mixed:R.bonus});
        if(R.bonus)BB.text('BONUS',ROCK_X,rail(k)-r*1.9+this.rockY,36,COL.yellow,{stroke:6,font:'Rammetto One'})}
      if(this.state==='pop'){const tt=BB.t-this.st,R=this.R,r=150;// halves fly apart
        for(const s of[-1,1]){ctx.save();ctx.translate(ROCK_X+s*tt*500,rail(k)-120+tt*tt*900-tt*400);ctx.rotate(s*tt*4);ctx.globalAlpha=clamp(1-tt,0,1);
          ctx.fillStyle=R.kind==='crystal'?'#a0d7f5':'#82746a';ctx.strokeStyle=COL.ink;ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,r*.8,s>0?-Math.PI/2:Math.PI/2,s>0?Math.PI/2:Math.PI*1.5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
        if(tt<.4){ctx.save();ctx.globalAlpha=1-tt/.4;ctx.fillStyle='#fff8d0';ctx.beginPath();ctx.arc(ROCK_X,rail(k)-130,200*tt/.4+40,0,7);ctx.fill();ctx.restore()}}}
    // flying notes for this floor (arc from rock to pipe hopper)
    for(const n of this.flying){if(n.f!==k)continue;const tt=clamp((BB.t-n.t0)/1.1,0,1),e=ease.inOut(tt);const x=lerp(n.x0,n.x1,e),yy=lerp(n.y0,n.y1,e)-Math.sin(tt*Math.PI)*320-(tt<.25?0:0);
      BB.wholeNote(x,yy,46*(1+.3*Math.sin(tt*Math.PI)),{glow:.8,fill:n.gold?'#ffe066':'#fff',rot:tt*6})}
    // Static Jr. prank on this floor
    if(this.prank&&active&&this.prank.ph!=='done'){const p=this.prank,yb=y+150;ctx.fillStyle='#8a5a32';ctx.fillRect(2960,yb,260,22);
      const bonk=p.ph==='bonk';BB.staticJr(p.x,bonk?yb+Math.min(1,(BB.t-p.t3)*3)*(rail(k)-yb):yb,95,{run:p.ph==='in'||p.ph==='out'?1:0,glitch:p.ph==='throw'&&Math.sin(BB.t*20)>.6?1:0,dizzy:bonk,rot:bonk?.6:0,flip:p.ph==='out'});
      if(p.ph==='throw')this.bubble(p.x-330,yb-190,'hee hee! pebbles!');if(bonk)this.bubble(p.x-170,yb-150,'oof!')}}
  bubble(x,y,txt){const w=BB.measure(txt,34)+50;BB.rrect(x,y,w,64,30,'#fff',COL.ink,4);BB.text(txt,x+w/2,y+34,34,COL.ink)}
  drawPipe(){const top0=GY-150,bot=rail(4)-60,x=PIPE_X;
    ctx.fillStyle='#8a5530';ctx.fillRect(x-30,top0+150,60,bot-top0-150);ctx.fillStyle='#b87333';ctx.fillRect(x-24,top0+150,48,bot-top0-150);
    ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(x-14,top0+150,8,bot-top0-150);
    if(this.pipeGlow>0){ctx.save();ctx.globalAlpha=this.pipeGlow*(.5+.3*Math.sin(BB.t*4));ctx.fillStyle='#ffe9a0';ctx.fillRect(x-6,top0+150,12,bot-top0-150);ctx.restore()}
    for(let y=GY+60;y<bot;y+=160){ctx.fillStyle='#6a3c20';ctx.fillRect(x-36,y,72,16)}
    for(let k=0;k<5;k++){const hy=rail(k)-120;ctx.fillStyle='#b87333';ctx.strokeStyle=COL.ink;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-30,hy+60);ctx.lineTo(x-80,hy-20);ctx.lineTo(x+80,hy-20);ctx.lineTo(x+30,hy+60);ctx.closePath();ctx.fill();ctx.stroke()}
    for(const p of this.pipeNotes){BB.glow(x,p.y,60,'rgba(255,240,170,A)',.9);BB.wholeNote(x,p.y,20,{fill:p.gold?'#ffe066':'#fff'})}}
  // -------- HUD --------
  drawHUD(){const R=this.R||ROCKS[0],F=FLOORS[R.f];
    // cart meter: WHOLE NOTES n of 8
    const mp=this.meterPop&&BB.t-this.meterPop<.5?1+.12*Math.sin((BB.t-this.meterPop)*Math.PI*2):1;
    ctx.save();ctx.translate(40,24);ctx.scale(mp,mp);BB.panel(0,0,640,130,30);
    BB.text('WHOLE NOTES',40,52,32,COL.yellow,{align:'left',stroke:4});BB.text(`${this.count} of 8`,40,92,28,'#fff',{align:'left',font:'Rammetto One',stroke:4});
    for(let i=0;i<8;i++){const on=i<this.count;BB.wholeNote(300+i*40,72,15,{fill:on?'#6ee678':'#2d4744',ring:on?COL.ink:'#22383a'})}
    ctx.restore();
    // tempo / dynamics sign with Italian word
    const sg=R.sign||[F.name,F.mean],icons=R.icons||(F.icon?[F.icon]:[]);BB.panel(W-640,24,600,130,30);
    icons.forEach((ic,i)=>BB.sprite(ic,W-575+i*70,140,100,{shadow:false}));
    BB.text(sg[0],W-560+icons.length*70+(icons.length?0:-20),70,sg[0].length>10?34:46,'#fff',{align:'left',font:'Rammetto One',stroke:5,maxW:420-icons.length*70});
    BB.text(sg[1]+(R.dyn==='p'?'  (p)':R.dyn==='f'?'  (f)':'')+`  ·  ${R.bpm} bpm`,W-560+icons.length*70+(icons.length?0:-20),118,28,COL.yellow,{align:'left',stroke:4});
    BB.pauseBtn(()=>this.pause());
    // beat lights (the green lights keep the beat)
    const lit=[0,0,0,0];let count=false;
    if(this.beat){const bn=this.beatNow();if(bn>=0){const bi=Math.floor(bn),f=bn-bi;lit[bi%4]=Math.max(.25,1-f*.9);count=bi<4}}
    BB.beatPills(W/2,H-90,lit,{marks:this.marks,wobble:this.wob*(this.prank&&this.prank.ph==='throw'?1:.4)});
    if(count&&this.state!=='dig'){const n=4-Math.floor(this.beatNow());BB.text(n>0?String(n):'GO!',W/2,H-215,70,COL.yellow,{font:'Rammetto One',stroke:8})}
    else if(this.state==='dig'){BB.text(R.dyn==='p'?'soft claps!':R.dyn==='f'?'LOUD claps!':'clap on every light!',W/2,H-180,34,'#fff',{stroke:6})}
    if(this.pebbles){ctx.fillStyle='#8a7060';ctx.strokeStyle=COL.ink;ctx.lineWidth=3;for(const q of this.pebbles){ctx.beginPath();ctx.ellipse(q.x,q.y,14,10,q.x,0,7);ctx.fill();ctx.stroke()}}
    // crack progress chips next to the lights
    const need=this.R&&this.R.bonus?2:4;for(let i=0;i<need;i++){const on=i<Math.floor(this.stage/(4/need));BB.rrect(W/2+400+i*38,H-112,28,44,8,on?COL.yellow:'#3a4a48','#fff',2)}
    BB.text('CRACKS',W/2+400+need*19,H-140,22,'#fff',{stroke:4});
    BB.micMeter(40,H-150,{band:R.dyn==='p'?'soft':R.dyn==='f'?'loud':null});
    BB.overrideBtn(()=>this.manualOverride(),{pop:this.ovPop&&BB.t-this.ovPop<.3?1.08:1})}
  drawIntroHUD(){BB.button(W-300,H-130,260,100,'SKIP INTRO',{size:36,id:'skip',onClick:()=>this.skipIntro()});BB.pauseBtn(()=>this.pause())}
  drawEnd(){const t=BB.t-this.st;if(t<5.2)return;const k=ease.back(clamp((t-5.2)/.6,0,1));
    ctx.save();ctx.translate(W/2,330);ctx.scale(k,k);BB.panel(-560,-250,1120,500,44);
    BB.text('ROOM 1 COMPLETE!',0,-160,72,'#fff',{font:'Rammetto One',stroke:9});
    for(let i=0;i<8;i++)BB.wholeNote(-280+i*80,-60,30,{fill:'#6ee678',glow:.4,rot:Math.sin(BB.t*3+i)*.2});
    BB.text('8 whole notes are back in the bin!',0,20,40,COL.yellow,{stroke:5});
    BB.text('Next: the NOTE SMASHER (coming soon)',0,80,36,'#fff',{stroke:5});ctx.restore();
    if(t>6){BB.button(W/2-520,620,480,130,'ROOM MAP',{style:'green',size:56,id:'tomap',onClick:()=>BB.roomDone('mine')});
      BB.button(W/2+40,620,480,130,'PLAY AGAIN',{size:50,id:'again',onClick:()=>BB.go(new MineRoom())})}}
}
BB.MineRoom=MineRoom;
})();
