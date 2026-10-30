// Room 2: NOTE SMASHER (style B, the SMASH-O-MATIC 4000). Static Jr. broke the notes; customers' rhythm orders pile up.
// Smash whole -> 2 halves -> 2 quarters each -> ta into ti-ti -> ti-ti into TIKA-TIKA. Fill the 4-beat tray, ring the bell, clap it back.
'use strict';
(()=>{let ctx=BB.ctx;BB._sw.push(g=>ctx=g);const COL=BB.COL,W=BB.W,H=BB.H,{clamp,lerp,ease}=BB,R=BB.R;
// v12.9 phones (light mode): static UI pieces (panels, ticket, marquee face, signs, HUD, tray) are baked once into small sprites
// keyed by their content and blitted each frame - same idea as the v12.8 mine fix. Desktop/Chromebook/Smartboard draw live as before.
const SPR=new Map();const lq=()=>!BB.q;
function spr(key,x,y,w,h,fn){if(!lq()){fn();return}const s=Math.min(1,(BB.dpr||1)*(ctx.canvas.width/(BB.dpr||1))/W*1.15)||.5;let e=SPR.get(key);
  if(!e||e.s!==s){if(SPR.size>80)SPR.clear();const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w*s));c.height=Math.max(1,Math.ceil(h*s));const g=c.getContext('2d');g.scale(s,s);g.translate(-x,-y);
    BB.withCtx(g,fn);e={c,s};SPR.set(key,e)}
  ctx.drawImage(e.c,x,y,w,h)}
BB.VO_LINES=(BB.VO_LINES||[]).concat([
 ['sm_intro',"Oh no! Static Jr. broke all the notes, and the rhythm orders are piling up!",'sprocket'],
 ['sm_how',"Put a note in the Smash-O-Matic, then smash it! Clap together, or tap SMASH!",'sprocket'],
 ['sm_half',"One whole note smashes into two half notes!",'sprocket'],
 ['sm_q',"One half note smashes into two quarter notes. Ta! Ta!",'sprocket'],
 ['sm_e',"Smash a ta, and you get ti-ti. Two sounds in one beat!",'sprocket'],
 ['sm_tika',"FOUR sounds in ONE beat! Tika-tika!",'sprocket'],
 ['sm_echo',"Say it with me! Tika-tika! Tika-tika!",'sprocket'],
 ['sm_order',"Order up! Fill all four beats on the tray, then ring the bell!",'sprocket'],
 ['sm_wrong',"Hmm, that doesn't match the ticket. Let's check it!",'sprocket'],
 ['sm_serve',"Ding! Listen to the order, then clap it back!",'sprocket'],
 ['sm_great',"Delicious rhythm! Order complete!",'sprocket'],
 ['sm_again',"Almost! Let's clap it one more time!",'sprocket'],
 ['sm_rush',"Rush order! Smash fast, but take your time!",'sprocket'],
 ['sm_oops',"Whoa! Too many pieces! Sweep them back into the basket!",'sprocket'],
 ['sm_trick',"Oh no! Static Jr. scrambled the order! Check the ticket, then tap two notes to swap them back!",'sprocket'],
 ['sm_rest',"A rest is one beat of silence. Shh!",'sprocket'],
 ['sm_done',"Five orders served! Room two complete! Next stop, the Packing Station!",'sprocket'],
 ['jr_extra',"Hee hee! Extra static!",'jr'],
 ['jr_mix',"Hee hee! I mixed up your order! Bet you can't fix it!",'jr'],
]);
const FLOOR=952,PX=960,PH=760,PS=PH/900,PW=673*PS,PL=PX-PW/2,PT=FLOOR-PH;
const HAM={x:PL+222*PS,y:PT+286*PS,w:230*PS,h:264*PS},COLLAR=PT+290*PS,ANVIL=PT+628*PS,ROD=[PL+290*PS,PL+395*PS];
const KINDS=['h','q','e','s','r'],BX=[95,225,355,485,615],BASE=520;
const CART={x:250,base:FLOOR};
const JRX=1228;const WIN={x:1300,y:170,w:580,h:420},TRAY={x:1300,y:615,w:580,h:215};
// Curated order pool, one stage per teaching step. Each play deals one order per stage (never the same set twice in a row),
// so the room is replayable but always runs: halves/quarters -> ti-ti -> first tika-tika (prank) -> rests -> rush.
const POOL=[
 {note:'halves and quarters',seqs:[['h','q','q'],['q','q','h'],['q','h','q'],['h','h']]},
 {note:'with ti-ti',seqs:[['q','e','e','q'],['e','q','e','q'],['e','e','q','q'],['q','q','e','e'],['h','e','e'],['e','e','h']]},
 {note:'the first tika-tika!',prank:1,seqs:[['e','s','q','s'],['q','s','e','q'],['s','q','e','q'],['e','q','s','q'],['q','e','s','q']]},
 {note:'tika-tika with rests',rest:1,seqs:[['s','r','e','s'],['e','r','s','q'],['s','e','r','s'],['q','s','r','e'],['s','q','r','e']]},
 {note:'RUSH ORDER',rush:1,rest:1,seqs:[['e','s','s','q'],['s','s','e','q'],['e','s','r','e'],['s','e','s','r'],['q','s','e','s']]},
];
const ORDERS=POOL.map(p=>({...p,seq:p.seqs[0]}));// fixed set for ?fixed (and docs)
function dealOrders(){let last=null;try{last=JSON.parse(localStorage.getItem('bb_sm_last')||'null')}catch(e){}
  const q=new URLSearchParams(location.search);if(q.has('fixed'))return ORDERS;
  let seed=q.has('seed')?(+q.get('seed')||1):(Date.now()%2147483646)+1;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
  let pick;for(let n=0;n<6;n++){pick=POOL.map(p=>Math.floor(rnd()*p.seqs.length));if(!last||pick.some((v,i)=>v!==last[i]))break}
  try{localStorage.setItem('bb_sm_last',JSON.stringify(pick))}catch(e){}
  return POOL.map((p,i)=>{const o={...p,seq:p.seqs[pick[i]]};delete o.seqs;return o})}
const SMASH={w:['h','h'],h:['q','q'],q:['e'],e:['s']};
const howTo={title:'NOTE SMASHER: smash notes to fill the orders!',
  steps:['Tap a basket (or the cart), then TO PRESS.','Clap together (or tap SMASH!) to smash it.','Tap a basket, then TO TRAY to fill the 4 beats.','Ring the bell. Listen, then clap the order back.','No mic? Tap MANUAL OVERRIDE when they nail it.'],
  words:'whole = 2 halves = 4 ta.   ta = ti-ti.   ti-ti = TIKA-TIKA (4 sounds in 1 beat)',
  example:(x,y,w,h,t)=>{const st=Math.floor(t/1.4)%5,ks=['w','h','q','e','s'],k=ks[st],f=(t%1.4)/1.4;
    const n=k==='w'?1:k==='h'?2:k==='q'?4:k==='e'?4:4;ctx.save();ctx.translate(x+w/2,y+h/2);
    const hy=-150+Math.min(1,f*3)*60;ctx.fillStyle='#8a9496';ctx.fillRect(-60,-200,120,hy+200-30);BB.rrect(-90,hy-30,180,60,10,BB.lg(hy-30,hy+30,['#b8c0c2','#6c7476']),COL.ink,3);
    if(f<.3){R.tile(k,-60,-20,120,80,{label:false})}else{const kk=ks[Math.min(4,st+1)];const m=st===0?2:st===1?2:1;for(let i=0;i<m;i++)R.tile(kk,-60+(i-(m-1)/2)*140*Math.min(1,(f-.3)*4),-20,120,80)}
    BB.text(R.NAME[k]+'  \u2192  '+(SMASH[k]?SMASH[k].map(z=>R.NAME[z]).join(' + '):''),0,140,30,'#fff',{stroke:4});ctx.restore()}};
class SmasherRoom{constructor(o={}){this.o=o}
  enter(){BB.groove.start(100,'smash');this.orders=dealOrders();this.inv={h:0,q:0,e:0,s:0,r:9};this.anvil=null;this.tray=[];this.fly=[];this.crumbs=[];this.sel=null;this.oi=this.o.startAt||0;this.prankAt=1+Math.floor(Math.random()*(this.orders.length-1));this.done=0;this.said={};
    this.ham=0;this.hamV=null;this.motes=R.motes(26);this.cust={x:2200,k:0};this.lastOverride=-9;this.firstTika=!this.o.startAt||this.o.startAt<3;
    this.state='load';R.loadImgs([['smash_bg','jpg'],['press','png'],['hammer','png'],['customer','png'],['basket','png']]).then(()=>{this.static=this.bake();
      if(this.o.skipIntro||this.o.startAt)this.beginOrder();else this.startIntro()});BB.mic.take()}
  exit(){BB.paused=false}
  bake(){const s=!BB.q?.5:1,c=document.createElement('canvas');c.width=W*s;c.height=H*s;const g=c.getContext('2d');g.scale(s,s);const V=BB.V2;
    if(V.smash_bg)g.drawImage(V.smash_bg,0,0,W,H);
    // warm pool of light under the press, floor shadow
    const gr=g.createRadialGradient(PX,FLOOR,40,PX,FLOOR,700);gr.addColorStop(0,'rgba(255,220,160,.18)');gr.addColorStop(1,'rgba(255,220,160,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
    R.shadow(g,PX,FLOOR+4,PW*.62,.6);
    // basket shelf
    g.fillStyle='rgba(0,0,0,.25)';g.fillRect(28,BASE+12,672,16);const sg=g.createLinearGradient(0,BASE,0,BASE+24);sg.addColorStop(0,'#c99a62');sg.addColorStop(1,'#7c5530');g.fillStyle=sg;g.fillRect(24,BASE,672,22);
    for(const bx of [80,640]){g.fillStyle='#6c4a2a';g.beginPath();g.moveTo(bx-8,BASE+22);g.lineTo(bx+8,BASE+22);g.lineTo(bx-8,BASE+70);g.closePath();g.fill()}
    if(V.press)g.drawImage(V.press,PL,PT,PW,PH);
    // nameplate text baked onto the press
    // fitted inside the cream plate (plate spans x 250..428, y 88..138 in press.png), two lines, engraved look
    {const cx=PL+339*PS,cy=PT+113*PS,pw=(428-250)*PS-14;g.textAlign='center';g.textBaseline='middle';
     const fit=(txt,px,y,col)=>{g.font=px+"px 'Rammetto One'";const m=g.measureText(txt).width,sx=Math.min(1,pw/m);g.save();g.translate(cx,y);g.scale(sx,1);
       g.fillStyle='rgba(255,255,255,.3)';g.fillText(txt,0,1.2);g.fillStyle=col;g.fillText(txt,0,0);g.restore()};
     fit('SMASH-O-MATIC',17,cy-9*PS,'#3a3226');fit('4000',14,cy+12*PS,'#b5482a')}
    // cart of whole notes
    R.shadow(g,CART.x,CART.base,190,.55);if(V.cart)g.drawImage(V.cart,CART.x-190,CART.base-225,380,225);
    return c}
  // ---------- flow ----------
  startIntro(){this.state='intro';this.st=BB.t;this.jr={x:-200,ph:'run'};BB.sfx.glitch()}
  intro(){const t=BB.t-this.st,j=this.jr;
    if(t<1.6){j.x=lerp(-200,PX-80,ease.out(t/1.6));j.run=1}
    else if(t<3.4){j.run=0;j.hop=Math.abs(Math.sin((t-1.6)*9))*40;if(!this.said.s1){this.said.s1=1;BB.say('jr_giggle',{overlap:true})}
      if(Math.random()<.25){BB.sfx.ting();BB.burst(PX+(Math.random()-.5)*300,ANVIL-20,6,{cols:['#5aa8e6','#ffd36b','#a96ef0','#fff'],kind:'dot',size:10,speed:500,g:900})}}
    else if(t<4.6){j.hop=0;j.run=1;j.x+=BB.dt*1400}
    if(t>3.6&&!this.said.s2){this.said.s2=1;this.voEnd=BB.t+BB.say('sm_intro')}
    if(t>4.6&&BB.t>(this.voEnd||0)+.2){this.jr=null;this.beginOrder()}}
  skipIntro(){this.jr=null;BB.talking=null;BB.caption=null;this.beginOrder()}
  beginOrder(){const O=this.orders[this.oi];this.O=O;this.state='order';this.tray=[];this.cust={x:2200,k:this.oi,in:BB.t};this.mood=null;this.rushT=O.rush?BB.t:null;this.prank=null;this.tries=0;this.cb=null;
    if(this.oi===0){this.cardT=BB.t;setTimeout(()=>BB.scene===this&&BB.say('sm_how'),2500)}
    else if(O.rush)BB.say('sm_rush');else if(O.rest&&!this.said.rest){this.said.rest=1;BB.say('sm_rest')}else BB.say('sm_order');
    BB.sfx.bleep()}
  // ---------- actions ----------
  pick(k){if(this.state!=='order'&&this.state!=='smashing')return;if(k!=='w'&&!this.inv[k]){BB.sfx.bonk();this.empty={k,t:BB.t};return}this.sel=this.sel===k?null:k}
  toPress(k){this.sel=null;if(this.anvil){BB.sfx.bonk();this.busy={t:BB.t,txt:'The press is full! SMASH first.'};return}
    if(k==='r'){BB.sfx.boing();this.busy={t:BB.t,txt:"You can't smash silence!"};return}
    if(k!=='w')this.inv[k]--;const from=k==='w'?[CART.x,CART.base-200]:[BX[KINDS.indexOf(k)],BASE-60];
    this.fly.push({k,x0:from[0],y0:from[1],x1:PX,y1:ANVIL-36,t0:BB.t,d:.45,end:()=>{this.anvil={k,t:BB.t};BB.sfx.clunk()}})}
  toTray(k){this.sel=null;const used=R.len(this.tray),n=R.BEATS[k];if(used+n>4){BB.sfx.boing();this.busy={t:BB.t,txt:`Too big! ${n} beats > ${4-used} left`};return}
    if(k!=='w')this.inv[k]--;const from=k==='w'?[CART.x,CART.base-200]:[BX[KINDS.indexOf(k)],BASE-60],cx=this.slotX(used)+60;
    this.tray.push({k,t:BB.t,pending:1});const it=this.tray[this.tray.length-1];
    this.fly.push({k,x0:from[0],y0:from[1],x1:cx,y1:TRAY.y+110,t0:BB.t,d:.4,end:()=>{it.pending=0;BB.sfx.thunk()}})}
  slotX(b){return TRAY.x+30+b*132}
  slotW(n){return n*132-12}
  untray(i){if(this.state!=='order')return;const it=this.tray[i];if(!it||it.pending)return;if(this.scrambled()){this.swapTap(i);return}
    if(it.k==='x'){this.tossStatic(i);return}
    this.tray.splice(i,1);if(it.k!=='w')this.inv[it.k]++;BB.sfx.pop()}
  smash(){if(!this.anvil||this.hamV)return;const k=this.anvil.k;const slow=k==='e'&&this.firstTika;
    this.hamV={t:BB.t,d:slow?1.6:.16,slow,k};BB.sfx.piston();if(slow){this.firstTika=false;this.slowT=BB.t}}
  impact(){this.smashFx=BB.t;// v12.7 item 26: beat press - a note that slid under in time still gets smashed; otherwise it slams empty
    if(this.hamV.empty){if(this.anvil){this.hamV.k=this.anvil.k}else{BB.shake(2);BB.sfx.thunk();BB.burst(PX,ANVIL-20,6,{cols:['#fff','#ccc'],kind:'dust',size:12,speed:200,g:-40});return}}
    const k=this.hamV.k,slow=this.hamV.slow;BB.shake(6);BB.sfx.crunch();this.anvil=null;
    BB.burst(PX,ANVIL-20,slow?40:18,{cols:['#ffe066','#fff','#ffb040'],kind:'spark',size:10,speed:slow?900:600,g:600});
    if(k==='s'){// over-smash: a funny mess of crumbs, sweep it back
      for(let i=0;i<26;i++)this.crumbs.push({x:PX+(Math.random()-.5)*260,y:ANVIL-6-Math.random()*8,r:Math.random()*6.3,s:6+Math.random()*10,c:R.COLS.s[Math.random()*3|0]});this.mess=BB.t;if(!this.said.oops){this.said.oops=1;BB.say('sm_oops')}return}
    if(k==='w'&&!this.said.half){this.said.half=1;BB.say('sm_half')}
    if(k==='h'&&!this.said.q){this.said.q=1;BB.say('sm_q')}
    if(k==='q'&&!this.said.e){this.said.e=1;BB.say('sm_e')}
    if(slow){this.fan={t:BB.t};setTimeout(()=>{if(BB.scene!==this)return;BB.say('sm_tika');this.echo={t:BB.t+2.6};setTimeout(()=>BB.scene===this&&this.chant(),2600)},700)}
    const out=SMASH[k];out.forEach((o,i)=>{const bx=BX[KINDS.indexOf(o)];this.fly.push({k:o,x0:PX+(i-(out.length-1)/2)*120,y0:ANVIL-40,x1:bx,y1:BASE-60,t0:BB.t+(slow?2.2:.15)+i*.1,d:.6,arc:260,end:()=>{this.inv[o]++;this.binPop={k:o,t:BB.t};BB.sfx.ting()}})})}
  chant(){const t=BB.ac.currentTime+.3,spb=60/84;BB.say('sm_echo',{overlap:true});for(let r=0;r<2;r++)for(let i=0;i<4;i++)BB.sfx.block(t+1.2+r*spb*2+i*spb/4,.8)}
  sweep(){if(!this.crumbs.length)return;BB.sfx.sweep();this.sweepT=BB.t;this.fly.push({k:'s',x0:PX,y0:ANVIL-30,x1:BX[3],y1:BASE-60,t0:BB.t+.4,d:.6,arc:200,end:()=>{this.inv.s++;BB.sfx.ting()}})}
  // v12.2: 1960s retro-robot bell (mint dome, orange plunger, cream bolted base, indicator light)
  // v12.6: CGI desk bell - chrome dome (env reflections, specular, warm rim light), beveled mint enamel base with chrome band + rivets, shaded 3D plunger, flash on hit
  drawBell(bx,by,ready,t){const pt=this.ringT&&t>=this.ringT?t-this.ringT:9,press=pt<.25?Math.sin(pt/.25*Math.PI):0,wob=pt<1.2?Math.sin(pt*30)*.035*(1-pt/1.2):0,fl=pt<.6?1-pt/.6:0,hq=!(!BB.q),INK=COL.ink,E=(x,y,rx,ry,a0=0,a1=7,ccw)=>ctx.ellipse(x,y,rx,ry,0,a0,a1,ccw);
    /* v12.6: matte aged brass counter bell (ref: Victorian brass counter bell). Soft broad highlights, no gloss hotspots. */
    const hg=(x0,x1,st)=>{const g=ctx.createLinearGradient(x0,0,x1,0);st.forEach((c,i)=>g.addColorStop(i/(st.length-1),c));return g};
    const BR=['#6a4c22','#94723a','#c49d58','#dcb872','#caa45e','#ab8648','#8a6834','#563e1a'];
    const vshade=(y0,y1,a,b)=>{const v=ctx.createLinearGradient(0,y0,0,y1);v.addColorStop(0,a);v.addColorStop(1,b);return v};
    ctx.save();ctx.translate(bx,by+6);ctx.scale(.8,.8);
    /* contact shadow */
    {const g=ctx.createRadialGradient(4,0,6,4,0,112);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(.6,'rgba(0,0,0,.25)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.translate(0,18);ctx.scale(1,.2);ctx.fillStyle=g;ctx.beginPath();ctx.arc(4,0,112,0,7);ctx.fill();ctx.restore()}
    if(ready&&hq)BB.glow(0,-40,140,'rgba(255,210,120,A)',.1+.05*Math.sin(t*5));
    /* solid round base: rounded low drum */
    const bw=88,bt=-22,bb=12,ry=18;
    const base=()=>{ctx.beginPath();ctx.moveTo(-bw*.86,bt);ctx.bezierCurveTo(-bw,bt+2,-bw,bb-10,-bw*.97,bb);E(0,bb,bw*.97,ry,Math.PI,0,true);ctx.bezierCurveTo(bw,bb-10,bw,bt+2,bw*.86,bt);E(0,bt,bw*.86,ry*.85,0,Math.PI);ctx.closePath()};
    base();ctx.fillStyle=hg(-bw,bw,BR);ctx.fill();
    ctx.save();base();ctx.clip();ctx.fillStyle=vshade(bt,bb+ry,'rgba(255,230,170,.18)','rgba(20,10,0,.45)');ctx.fillRect(-bw,bt-20,2*bw,80);
    if(hq){/* subtle wear: tarnish blotches + brushed streaks */ctx.globalAlpha=.07;for(let i=0;i<9;i++){const x=Math.sin(i*2.3)*bw*.8,y=bt+8+((i*7)%20);ctx.fillStyle=i%2?'#2a1e0c':'#5a5030';ctx.beginPath();E(x,y,10+i%3*5,4,0,7);ctx.fill()}ctx.globalAlpha=1}
    ctx.restore();base();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke();
    /* base top face + slim shadow line under the dome */
    ctx.fillStyle=hg(-bw,bw,BR);ctx.beginPath();E(0,bt,bw*.86,ry*.85);ctx.fill();ctx.lineWidth=3;ctx.stroke();
    /* dome: smooth, wide and low, sitting snugly */
    ctx.save();ctx.translate(0,bt-3+press*1.5);ctx.rotate(wob);const DR=bw*.84,DH=60,lr=14;
    const dome=()=>{ctx.beginPath();ctx.moveTo(-DR,0);ctx.bezierCurveTo(-DR,-DH*.7,-DR*.55,-DH,0,-DH);ctx.bezierCurveTo(DR*.55,-DH,DR,-DH*.7,DR,0);E(0,0,DR,lr,0,Math.PI);ctx.closePath()};
    ctx.fillStyle='rgba(20,10,0,.55)';ctx.beginPath();E(0,3,DR+2,lr+2);ctx.fill();/* slim shadow line */
    dome();ctx.fillStyle=hg(-DR,DR,BR);ctx.fill();
    ctx.save();dome();ctx.clip();
    /* lamp from upper-left: broad soft key, darker underside, warm bounce at rim */
    {const k=ctx.createRadialGradient(-DR*.3,-DH*.75,4,-DR*.25,-DH*.6,DR*1.05);k.addColorStop(0,'rgba(240,215,150,.55)');k.addColorStop(.45,'rgba(220,190,120,.18)');k.addColorStop(1,'rgba(220,190,120,0)');ctx.fillStyle=k;ctx.fillRect(-DR,-DH,2*DR,DH+lr)}
    ctx.fillStyle=vshade(-DH,lr,'rgba(0,0,0,0)','rgba(30,15,0,.5)');ctx.fillRect(-DR,-DH*.35,2*DR,DH*.35+lr);
    {const rl=ctx.createLinearGradient(DR*.55,0,DR,0);rl.addColorStop(0,'rgba(230,190,120,0)');rl.addColorStop(1,'rgba(230,190,120,.32)');ctx.fillStyle=rl;ctx.fillRect(DR*.5,-DH,DR*.5,DH+lr)}/* soft rim light */
    if(hq){ctx.globalAlpha=.06;for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#2e220e':'#6a6038';ctx.beginPath();E(Math.sin(i*1.9)*DR*.6,-DH*.2-((i*11)%30),8+i%3*6,5,0,7);ctx.fill()}ctx.globalAlpha=1}
    /* hit: subtle gold shine sweep */
    if(fl>0){const sx=-DR+(1-fl)*DR*2.2,g=ctx.createLinearGradient(sx-30,0,sx+30,0);g.addColorStop(0,'rgba(255,230,160,0)');g.addColorStop(.5,`rgba(255,235,170,${.45*fl})`);g.addColorStop(1,'rgba(255,230,160,0)');ctx.fillStyle=g;ctx.fillRect(-DR,-DH,2*DR,DH+lr)}
    ctx.restore();dome();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke();
    /* crown boss */
    ctx.fillStyle=hg(-20,20,BR);ctx.beginPath();E(0,-DH+1,20,6);ctx.fill();ctx.lineWidth=2.5;ctx.stroke();
    /* threaded stem + flat disc plunger */
    const py=-DH-press*8;
    {ctx.fillStyle=hg(-5,5,BR);ctx.beginPath();ctx.rect(-5,py-22,10,22);ctx.fill();ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='rgba(30,18,4,.6)';ctx.lineWidth=1.3;for(let y=py-19;y<py-1;y+=3){ctx.beginPath();ctx.moveTo(-5,y);ctx.lineTo(5,y+1.4);ctx.stroke()}
     ctx.fillStyle=hg(-9,9,BR);ctx.beginPath();ctx.rect(-9,py-10,18,5);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke()}/* nut */
    {const dr=30;ctx.fillStyle=hg(-dr,dr,BR);ctx.beginPath();E(0,py-24,dr,7,0,Math.PI);ctx.lineTo(-dr,py-30);E(0,py-30,dr,7,Math.PI,0,true);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.stroke();
     const tg=ctx.createRadialGradient(-10,py-33,2,0,py-30,dr);tg.addColorStop(0,'#c8a862');tg.addColorStop(.6,'#9a7c40');tg.addColorStop(1,'#6a5026');ctx.fillStyle=tg;ctx.beginPath();E(0,py-30,dr,7);ctx.fill();ctx.stroke()}
    ctx.restore();ctx.restore()}
  ring(){if(this.scrambled()){BB.sfx.bleep();this.busy={t:BB.t,txt:'Swap the notes back to match the ticket first!'};return}if(this.prank&&this.prank.ph==='fixed')return;if(this.state==='order'&&R.len(this.tray)>=4&&!this.tray.some(x=>x.pending))this.ringT=BB.t;if(this.state!=='order'||R.len(this.tray)<4||this.tray.some(x=>x.pending))return;BB.sfx.bell();
    if(this.tray.some(x=>x.k==='x')){this.tossStatic(this.tray.findIndex(x=>x.k==='x'));return}
    const want=this.O.seq,got=this.tray.map(x=>x.k);
    if(got.join()===want.join()){this.mood={k:'yum',t:BB.t};this.state='serve';this.st=BB.t;BB.say('sm_serve');setTimeout(()=>BB.scene===this&&this.startClap(),2300);return}
    // mismatch: the customer bleeps, pieces that don't match hop back into their baskets
    BB.sfx.bleep();this.mood={k:'huh',t:BB.t};BB.say('sm_wrong');let b=0;const wantAt={};{let bb=0;want.forEach(k=>{wantAt[bb]=k;bb+=R.BEATS[k]})}
    const keep=[];for(const it of this.tray){if(wantAt[b]===it.k&&keep.length===this.tray.indexOf(it))keep.push(it);else if(it.k!=='w')this.fly.push({k:it.k,x0:this.slotX(b)+this.slotW(R.BEATS[it.k])/2,y0:TRAY.y+110,x1:BX[KINDS.indexOf(it.k)],y1:BASE-60,t0:BB.t+.4,d:.6,arc:200,end:()=>this.inv[it.k]++});b+=R.BEATS[it.k]}
    this.tray=keep}
  startClap(){this.state='clap';this.cb=new R.ClapBack(this.O.seq,{bpm:84,onDone:sc=>this.clapDone(sc),voice:s=>{this.custBop=BB.t}})}
  clapDone(sc){this.tries++;if(sc>=.6||this.tries>=2){this.state='happy';this.st=BB.t;this.mood={k:'love',t:BB.t};BB.sfx.fanfare();BB.say('sm_great');
      BB.burst(TRAY.x+TRAY.w/2,TRAY.y+60,40,{cols:['#ffe066','#6ee678','#fff','#5ac8fa'],kind:'star',size:14,speed:800,g:500})}
    else{BB.say('sm_again');setTimeout(()=>BB.scene===this&&this.state==='clap'&&this.startClap(),1800)}}
  manualOverride(){if(BB.t-this.lastOverride<.5)return;this.lastOverride=BB.t;this.ovPop=BB.t;
    if(this.state==='clap'&&this.cb)this.cb.override();
    else if(this.state==='order'&&this.scrambled())this.fixOrder();
    else if(this.state==='order'&&this.anvil)this.smash();}
  // v12.2 prank: once the class has built the order right, Static Jr. zaps the tray and SCRAMBLES the beats.
  // The class compares with the ticket and taps two notes to swap them; when it matches again he gets bonked and runs.
  startPrank(){this.prank={t:BB.t,x:JRX,ph:'in'};BB.sfx.glitch();BB.say('jr_mix',{overlap:true})}
  scramble(){const want=this.O.seq.join();let a=this.tray.slice();for(let n=0;n<20;n++){a=this.tray.slice().sort(()=>Math.random()-.5);if(a.map(x=>x.k).join()!==want)break}
    this.tray=a;this.zapT=BB.t;this.swapSel=null;BB.sfx.zap();BB.shake(4);BB.burst(TRAY.x+TRAY.w/2,TRAY.y+110,30,{cols:['#b07cff','#5ac8fa','#fff'],kind:'star',size:10,speed:700,g:200})}
  scrambled(){return !!(this.prank&&this.prank.ph==='wait')}
  swapTap(i){if(this.swapSel==null||this.swapSel===i){this.swapSel=this.swapSel===i?null:i;BB.sfx.pop();return}
    const a=this.tray,j=this.swapSel;[a[i],a[j]]=[a[j],a[i]];a[i].t=a[j].t=BB.t-.4;this.swapSel=null;BB.sfx.thunk();this.checkFixed()}
  checkFixed(){if(this.tray.map(x=>x.k).join()!==this.O.seq.join())return;const p=this.prank;BB.sfx.ding();
    this.fly.push({k:'x',x0:TRAY.x+TRAY.w/2,y0:TRAY.y+110,x1:p.x,y1:FLOOR-150,t0:BB.t,d:.5,arc:300,end:()=>{BB.sfx.bonk();p.ph='hit';p.t3=BB.t;BB.say('jr_oof',{overlap:true,nocap:true});BB.burst(p.x,FLOOR-200,12,{col:COL.yellow,kind:'star',size:14,g:300})}});p.ph='fixed'}
  updPrank(dt){const p=this.prank,t=BB.t-p.t;
    if(p.ph==='in'){p.x=JRX;// v12.3: glitches in beside the tray (no overlap with the order boxes)
if(t>1.1){this.scramble();BB.say('sm_trick');p.ph='wait';p.t2=BB.t}}
    if(p.ph==='wait'){p.x=JRX+Math.sin(BB.t*6)*6;if(BB.t-p.t2>25)this.fixOrder()}// safety: never stall the room
    if(p.ph==='hit'){if(BB.t-p.t3>1.5)p.ph='run'}
    if(p.ph==='run'){p.x+=dt*1100;if(p.x>2200)p.ph='done'}}
  fixOrder(){const pool=this.tray.slice(),out=[];for(const k of this.O.seq){const i=pool.findIndex(x=>x.k===k);out.push(pool.splice(i,1)[0])}this.tray=out;this.swapSel=null;this.checkFixed()}
  tossStatic(i){const p=this.prank;this.tray.splice(i,1);BB.sfx.boing();const x0=this.slotX(R.len(this.tray))+60;
    this.fly.push({k:'x',x0,y0:TRAY.y+110,x1:p?p.x:1800,y1:FLOOR-150,t0:BB.t,d:.5,arc:300,end:()=>{BB.sfx.bonk();if(p){p.ph='hit';p.t3=BB.t;BB.say('jr_oof',{overlap:true,nocap:true});BB.burst(p.x,FLOOR-200,12,{col:COL.yellow,kind:'star',size:14,g:300})}}})}
  pause(){BB.paused=true;BB.ac.suspend()}
  resume(){BB.paused=false;BB.ensureMic()}
  next(){if(BB.groove.on)BB.groove.sync(BB.ac.currentTime+.05,.6);this.done++;this.oi++;this.tray=[];this.cb=null;if(this.oi>=this.orders.length){this.state='end';this.st=BB.t;BB.say('sm_done');BB.celebrate({next:'PACKING STATION'});
      if(!BB.save.done.includes('smasher')){BB.save.done.push('smasher');localStorage.setItem('bb4',JSON.stringify(BB.save))}}else this.beginOrder()}
  // pointer: drag a basket straight onto the press or the tray (taps are handled by buttons)
  pdown(p){if(this.state!=='order')return false;const k=this.hitBasket(p);if(!k)return false;this.drag={k,x0:p.x,y0:p.y};return true}
  pup(p){const d=this.drag;this.drag=null;if(!d)return;if(Math.hypot(p.x-d.x0,p.y-d.y0)<30){BB.sfx.click();this.pick(d.k);return}if(d.k!=='w'&&!this.inv[d.k])return;
    if(Math.abs(p.x-PX)<PW/2&&p.y>PT&&p.y<FLOOR)this.toPress(d.k);else if(p.x>TRAY.x&&p.y>TRAY.y-60&&p.y<TRAY.y+TRAY.h)this.toTray(d.k)}
  hitBasket(p){if(Math.abs(p.x-CART.x)<190&&p.y>CART.base-322&&p.y<CART.base)return 'w';for(let i=0;i<5;i++){if(i===4&&!this.O?.rest)continue;if(Math.abs(p.x-BX[i])<62&&p.y>BASE-150&&p.y<BASE+50)return KINDS[i]}return null}
  update(dt){BB.dt=dt;if(BB.keys.includes(' '))this.manualOverride();if(BB.keys.includes('p')){this.pause();return}
    if(this.state==='intro'){this.intro();if(BB.keys.includes('s'))this.skipIntro()}
    // hammer
    if(this.hamV){const h=this.hamV,t=(BB.t-h.t)/h.d;if(t<1)this.ham=ease.inOut(t)*.4+t*t*.6;else if(!h.hit){h.hit=1;this.ham=1;this.impact();h.up=BB.t}
      if(h.hit){const u=(BB.t-h.up)/.5;this.ham=1-ease.inOut(clamp(u,0,1));if(u>=1)this.hamV=null}}
    // v12.7 item 26: the press auto-slams on every beat of the 100 BPM groove (lands exactly on the beat)
    {const g=BB.groove,now=BB.ac.currentTime;if(this.state==='order'&&g&&g.on&&!this.hamV&&!BB.paused){const nb=g.t0+Math.ceil((now-g.t0+.17)/g.spb)*g.spb;
      if(now>=nb-.17&&this.lastBeat!==nb){this.lastBeat=nb;if(this.anvil&&BB.t-this.anvil.t>.05)this.smash();else{this.hamV={t:BB.t,d:.16,k:null,empty:1};BB.sfx.piston()}}}}
    // clap to smash (group-gated with a live mic) - still works as an instant smash between beats
    const ons=this.state==='clap'?[]:BB.mic.take();
    if(BB.MLP&&BB.MLP.on&&this.state==='order'&&this.anvil&&!this.hamV&&BB.t-this.anvil.t>.4)BB.MLP.micWant();if(this.state==='order'&&this.anvil&&!this.hamV&&BB.t-this.anvil.t>.4){const G=window.GroupGate;
      for(const o of ons){if(BB.talking&&BB.t<BB.talking.until&&!BB.debug)continue;if(BB.mic.ok&&G&&!BB.debug&&!o.sim){this.pendSmash=o.t;break}this.smash();break}}
    if(this.pendSmash&&BB.ac.currentTime-.02>this.pendSmash+.2){const m=window.GroupGate.judge(this.pendSmash);this.pendSmash=null;if(m.ok)this.smash();else this.few=BB.t}
    
    if(this.cb&&this.state==='clap')this.cb.update(dt);
    // fliers
    for(let i=this.fly.length-1;i>=0;i--){const f=this.fly[i];if(BB.t-f.t0>=f.d){this.fly.splice(i,1);f.end&&f.end()}}
    // customer roll-in
    const c=this.cust;if(this.state==='order'||this.state==='serve'||this.state==='clap')c.x=lerp(2200,WIN.x+140,ease.out(clamp((BB.t-c.in)/1.2,0,1)));
    if(this.state==='happy'){const t=BB.t-this.st;if(t>2.2)c.x+=dt*900;this.trayOut=clamp((t-1.6)/1,0,1);if(t>3.4){this.trayOut=0;this.next()}}
    if(this.oi===this.prankAt&&this.state==='order'&&!this.prank&&!this.anvil&&R.len(this.tray)>=4&&!this.tray.some(x=>x.pending)&&this.tray.map(x=>x.k).join()===this.O.seq.join()&&new Set(this.O.seq).size>1)this.startPrank();
    if(this.prank)this.updPrank(dt);
    if(this.crumbs.length&&this.sweepT&&BB.t-this.sweepT>.4){this.crumbs=[];this.sweepT=0}
    // sim: auto-play an order (debug ?sim=1&auto)
    if(BB.debug&&this.o.auto)this.autoplay()}
  autoplay(){if(this.state!=='order'||this.fly.length||this.hamV||BB.t-(this.autoT||0)<.7)return;this.autoT=BB.t;
    if(this.tray.some(x=>x.k==='x')){this.untray(this.tray.findIndex(x=>x.k==='x'));return}
    const used=R.len(this.tray);if(used>=4){this.ring();return}
    let b=0,need=null;for(const k of this.O.seq){if(b===used){need=k;break}b+=R.BEATS[k]}
    if(!need)return;if(need==='r'||this.inv[need]>0){this.toTray(need);return}
    if(this.anvil){this.smash();return}
    const chain={h:'w',q:'h',e:'q',s:'e'};let src=chain[need];while(src!=='w'&&!this.inv[src])src=chain[src];this.toPress(src)}
  // ---------- drawing ----------
  draw(){const t=BB.t,[sx,sy]=BB.shakeXY;ctx.save();
    // slow-mo push-in on the first tika-tika
    let z=1;if(this.slowT){const k=(t-this.slowT);z=k<1.6?1+.28*ease.inOut(clamp(k/1.2,0,1)):1+.28*(1-ease.inOut(clamp((k-3.2)/1,0,1)));if(k>4.4)this.slowT=0}
    if(z!==1){ctx.translate(PX,ANVIL-80);ctx.scale(z,z);ctx.translate(-PX,-(ANVIL-80))}
    ctx.translate(sx,sy);
    if(this.static)ctx.drawImage(this.static,0,0,W,H);else{ctx.fillStyle='#2a3a38';ctx.fillRect(0,0,W,H)}
    R.lampGlow([[312,170],[520,215],[1393,215],[1628,170]],t);
    this.drawCartNotes();this.drawBaskets();this.drawLifts();this.drawPress();this.drawMarquee();this.drawWindow();this.drawTray();
    if(this.jr)BB.staticJr(this.jr.x,FLOOR-(this.jr.hop||0),130,{lift:this.jr.hop||0,spd:1400,run:this.jr.run,glitch:this.jr.hop?.6:0});
    if(this.prank&&this.prank.ph!=='done'){const p=this.prank;const gi=p.ph==='in'?1-clamp((t-p.t)/1,0,1):0;BB.staticJr(p.x,FLOOR,90,{spd:1100,run:p.ph==='run'?1:0,dizzy:p.ph==='hit',rot:p.ph==='hit'?Math.sin(t*10)*.15:0,glitch:p.ph==='hit'?.7:gi});
      if(p.ph==='wait')R.bubble(p.x-60,FLOOR-210,'I mixed it up! hee hee')}
    for(const f of this.fly)this.drawFly(f);
    if(this.drag&&Math.hypot(BB.ptr.x-this.drag.x0,BB.ptr.y-this.drag.y0)>30&&(this.drag.k==='w'||this.inv[this.drag.k])){ctx.save();ctx.globalAlpha=.9;R.tile(this.drag.k,BB.ptr.x-60,BB.ptr.y-42,120,84,{label:true});ctx.restore()}
    for(const c of this.crumbs){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.r);ctx.fillStyle=c.c;ctx.strokeStyle=COL.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-c.s,0);ctx.lineTo(0,-c.s*.7);ctx.lineTo(c.s,c.s*.3);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
    if(this.fan)this.drawFan();
    ctx.restore();
    R.drawMotes(this.motes,BB.paused?0:Math.min(.05,BB.dt||.016),t);BB.drawParts();
    this.drawHUD();BB.captionBox();
    if(this.state==='order'&&this.oi===0&&BB.t-this.cardT<2.6)BB.titleCard('ROOM 2: NOTE SMASHER','Static Jr. broke the notes. Smash them into orders!',(BB.t-this.cardT)/2.6);
    if(this.state==='end')this.drawEnd();
    if(BB.paused)BB.pauseOverlay(howTo,()=>this.resume())}
  drawCartNotes(){const t=BB.t,V=BB.V2||{};/* v12.6: heaped mound of whole-note tiles, cart front rim redrawn on top */
    const P=[[-120,-196,-.25],[-60,-200,.12],[0,-198,-.1],[60,-200,.3],[120,-195,-.2],[-90,-226,-.08],[-30,-230,.18],[30,-229,-.22],[90,-225,.15],[-58,-258,.2],[0,-262,-.15],[58,-257,.1],[-28,-290,.05],[28,-292,-.1]];
    P.forEach(([dx,dy,r],i)=>{ctx.save();ctx.translate(CART.x+dx,CART.base+dy-(i>6?Math.abs(Math.sin(t*1.2+i))*2:0));ctx.rotate(r);BB.solidWhole(0,0,27,{});ctx.restore()});
    if(V.cart){ctx.save();ctx.beginPath();ctx.rect(CART.x-200,CART.base-190,400,194);ctx.clip();ctx.drawImage(V.cart,CART.x-190,CART.base-225,380,225);ctx.restore()}

    BB.plaque(CART.x,CART.base-345,240,46,'WHOLE NOTES',26);
    if(this.sel==='w')this.selRing(CART.x,CART.base-120,210)}
  // per-basket pile slots (stable jitter, so notes don't reshuffle); remembers counts to animate adds and lifts
  pileFor(k,n){const P=this.piles=this.piles||{},t=BB.t;let p=P[k];if(!p)p=P[k]={items:[]};
    const SL=[[-14,-82,-.12],[18,-81,.14],[2,-89,-.03],[-24,-79,-.2]];// v12.6: raised so note heads clear the front rim
    while(p.items.length<n){const j=p.items.length,sl=SL[j%4];p.items.push({x:sl[0],y:sl[1],r:sl[2],add:p.init?t:0})}
    while(p.items.length>n){const it=p.items.pop();/* the fly-out animation carries the picked note */}
    p.init=1;return p.items}
  drawLifts(){const t=BB.t;if(!this.lifts)return;this.lifts=this.lifts.filter(l=>t-l.t<.45);
    for(const l of this.lifts){const f=(t-l.t)/.45,e=ease.out(f);ctx.save();ctx.translate(l.x,l.y-e*90);ctx.rotate(l.r*(1-e));ctx.globalAlpha=1-f*f;ctx.scale(1+e*.15,1+e*.15);R.tile(l.k,-42,-70,84,62,{gs:.95,shadow:false});ctx.restore()}}
  drawBaskets(){const V=BB.V2,t=BB.t;KINDS.forEach((k,i)=>{if(k==='r'&&!(this.O&&this.O.rest))return;const x=BX[i],n=this.inv[k],pop=this.binPop&&this.binPop.k===k&&t-this.binPop.t<.35?1+.12*Math.sin((t-this.binPop.t)/.35*Math.PI):1;
      ctx.save();ctx.translate(x,BASE);ctx.scale(pop,pop);
      // notes nestled IN the basket: a little pile below the rim, front rim drawn over them; count changes add/lift notes
      const pile=this.pileFor(k,k==='r'?2:Math.min(n,4));
      const bh=104,bw=V.basket?V.basket.width*bh/V.basket.height:138;if(V.basket)ctx.drawImage(V.basket,-bw/2,-bh,bw,bh);// back wall + inside
      {const gr=ctx.createRadialGradient(0,-66,3,0,-66,50);gr.addColorStop(0,'rgba(20,10,4,.6)');gr.addColorStop(1,'rgba(20,10,4,0)');ctx.save();ctx.translate(0,-66);ctx.scale(1,.22);ctx.translate(0,66);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,-66,50,0,7);ctx.fill();ctx.restore()}// contact shadow inside
      for(const p of pile){const a=p.add?ease.out(clamp((t-p.add)/.3,0,1)):1;if(a<=0)continue;ctx.save();ctx.translate(p.x,p.y-(1-a)*70);ctx.rotate(p.r);ctx.globalAlpha=Math.min(1,a*2);R.tile(k,-50,-84,100,84,{gs:1,shadow:false});ctx.restore()}
      // front rim + basket front layered over the notes (clip: below the opening's centre line, outside its lower half)
      if(V.basket){ctx.save();ctx.beginPath();ctx.rect(-bw,-66,bw*2,80);ctx.ellipse(0,-66,55,8,0,0,Math.PI*2);ctx.clip('evenodd');ctx.drawImage(V.basket,-bw/2,-bh,bw,bh);ctx.restore()}
      if(k==='r')BB.plaque(0,-1,124,34,'REST',20);else{// v12.7: two-line sign hanging down - note name over its syllable, padded
        spr('bs'+k+n,-70,-22,140,80,()=>{BB.plaque(0,16,124,62,'',16);const nm={w:'WHOLE',h:'HALF',q:'QUARTER',e:'EIGHTHS',s:'16THS'}[k];
        BB.text(nm+' x'+n,0,3,16,'#fff',{maxW:96,stroke:3});BB.text(R.SAY[k],0,30,17,COL.yellow,{maxW:96,stroke:3})})}
      ctx.restore();if(this.sel===k)this.selRing(x,BASE-70,90);
      if(this.empty&&this.empty.k===k&&t-this.empty.t<1.4)R.bubble(x,BASE-200,k==='h'?'smash a WHOLE':'smash '+({q:'a HALF',e:'a TA',s:'a TI-TI'}[k]),COL.ink)});
    // pick / place buttons for the selected basket
    if(this.sel&&this.state==='order'){const i=this.sel==='w'?-1:KINDS.indexOf(this.sel),x=i<0?CART.x:BX[i],y=i<0?CART.base-370:BASE+40;const bx=clamp(x-150,20,420);
      BB.button(bx,y,145,84,'TO PRESS',{style:'green',size:28,id:'topress',onClick:()=>this.toPress(this.sel)});
      BB.button(bx+155,y,145,84,'TO TRAY',{style:'green',size:28,id:'totray',onClick:()=>this.toTray(this.sel)})}
}
  capPos(){return this.state==='clap'&&this.cb?{cx:1590,y:832,maxW:600}:{y:H-114,maxW:1140}}
  capOn(){const c=BB.caption;return c&&BB.t<=c.until}
  selRing(x,y,r){ctx.save();ctx.strokeStyle=COL.yellow;ctx.lineWidth=6;ctx.setLineDash([18,12]);ctx.lineDashOffset=-BB.t*60;ctx.beginPath();ctx.ellipse(x,y,r,r*.62,0,0,7);ctx.stroke();ctx.restore()}
  drawPress(){const V=BB.V2,t=BB.t;const dy=lerp(-86,0,this.ham)+(this.hamV?0:Math.sin(t*2)*2);
    // piece on the anvil
    if(this.anvil){const a=this.anvil,k=ease.back(clamp((t-a.t)/.3,0,1)),sq=this.hamV&&this.ham>.85?(this.ham-.85)*3:0;
      ctx.save();ctx.translate(PX,ANVIL);ctx.scale(1+sq*.4,(1-sq)*k);R.tile(a.k,-80,-112,160,112,{label:true});ctx.restore();
      if(this.state==='order'&&!this.hamV&&BB.q)BB.glow(PX,ANVIL-40,160,'rgba(255,230,140,A)',.18+.08*Math.sin(t*5))}
    // rod + hammer (clipped under the collar so it slides into the machine)
    if(V.hammer){ctx.save();ctx.beginPath();ctx.rect(PL,COLLAR,PW,ANVIL-COLLAR);ctx.clip();
      ctx.fillStyle=BB.lg(0,1,['#9aa2a4','#9aa2a4']);const rg=ctx.createLinearGradient(ROD[0],0,ROD[1],0);rg.addColorStop(0,'#5d6567');rg.addColorStop(.35,'#c3cacc');rg.addColorStop(1,'#4d5456');ctx.fillStyle=rg;ctx.fillRect(ROD[0],COLLAR,ROD[1]-ROD[0],HAM.y+dy+20-COLLAR);
      ctx.drawImage(V.hammer,HAM.x,HAM.y+dy,HAM.w,HAM.h);ctx.restore()}
    if(this.state==='order'||this.state==='intro')BB.button(PX-150,FLOOR-150,300,92,this.anvil?'SMASH!':'SMASH',{style:'red',size:44,id:'smash',disabled:!this.anvil||!!this.hamV,onClick:()=>this.smash()});
    if(this.crumbs.length)BB.button(PX+170,FLOOR-150,220,92,'SWEEP',{size:40,id:'sweep',onClick:()=>this.sweep()});
    if(this.busy&&t-this.busy.t<1.6)R.bubble(PX,PT+60,this.busy.txt,COL.ink)}
  drawWindow(){const V=BB.V2,t=BB.t,O=this.O;spr('win',WIN.x-20,WIN.y-20,WIN.w+40,WIN.h+40,()=>{BB.panel(WIN.x,WIN.y,WIN.w,WIN.h,34);BB.well(WIN.x+16,WIN.y+16,WIN.w-32,WIN.h-32,24)});
    // customer
    ctx.save();ctx.beginPath();ctx.roundRect(WIN.x+16,WIN.y+16,WIN.w-32,WIN.h-32,24);ctx.clip();
    const glowC=['#ffe066','#9ff09a','#d8a6ff','#8fd0ff','#ffb08a'][this.cust.k%5];if(BB.q)BB.glow(WIN.x+150,WIN.y+260,200,'rgba(255,240,200,A)',.12);
    if(V.customer){const c=this.cust,bop=this.custBop&&t-this.custBop<.15?.05:0,mood=this.mood&&t-this.mood.t<2?this.mood.k:null;const h=280,w=h,yy=WIN.y+WIN.h-24+Math.sin(t*3)*3;
      BB.contactShadow(c.x,WIN.y+WIN.h-22,100,.5);ctx.save();ctx.translate(c.x,yy);ctx.scale(1+bop,1-bop);if(mood==='huh')ctx.rotate(Math.sin(t*20)*.05);ctx.drawImage(BB.tinted('customer',null,glowC,.12)||V.customer,-w/2,-h,w,h);ctx.restore();
      if(mood==='love'){for(let i=0;i<3;i++){const a=(t*1.5+i*.33)%1;ctx.globalAlpha=1-a;BB.text('\u2665',c.x-40+i*40,yy-h-a*60,40,'#ff6b8a');ctx.globalAlpha=1}}
      if(mood==='huh')BB.text('?',c.x+70,yy-h-10,60,COL.yellow,{font:'Rammetto One',stroke:6})}
    ctx.restore();
    // ticket
    if(O&&this.state!=='end'){const tx=WIN.x+196,ty=WIN.y+28,tw=360,th=214,k=ease.back(clamp((t-this.cust.in-.6)/.4,0,1));ctx.save();ctx.translate(tx+tw/2,ty);ctx.scale(k,k);ctx.rotate(Math.sin(t*1.3)*.01);
      spr('tk'+this.oi+(O.rush?'r':'')+O.seq.join(''),-tw/2-40,-40,tw+100,th+90,()=>{
      ctx.save();ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=24;ctx.shadowOffsetX=6;ctx.shadowOffsetY=12;BB.rrect(-tw/2,0,tw,th,10,BB.lg(0,th,['#fffaf0','#f1e8d2','#ddd0b2']));ctx.restore();R.paper(-tw/2,0,tw,th);BB.rrect(-tw/2,0,tw,th,10,null,'rgba(110,95,70,.6)',2);/* v12.6: header printed on the paper (red ink + rules), not a separate bar */ctx.fillStyle='rgba(200,60,48,.85)';ctx.fillRect(-tw/2+10,39,tw-20,2.5);ctx.fillRect(-tw/2+10,44,tw-20,1);
      BB.text('ORDER #'+(this.oi+1)+(O.rush?'  RUSH!':''),0,22,26,'#c23a2e',{font:'Rammetto One'});
      let b=0;for(const kk of O.seq){const n=R.BEATS[kk],cw=(tw-24)/4,x=-tw/2+12+b*cw,w=n*cw;ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=2;ctx.strokeRect(x+3,52,w-6,124);
        ctx.save();ctx.beginPath();ctx.rect(x+5,54,w-10,120);ctx.clip();R.tile(kk,x+7,64,w-14,96,{});ctx.restore();// v12.7: note stays inside its own beat box
        for(const [sx,sy] of R.syl(kk,x+7,w-14,96))BB.text(sy,sx,194,16,'#5a5040');b+=n}
      {const lg=ctx.createRadialGradient(-tw*.2,-30,10,-tw*.2,-30,tw);lg.addColorStop(0,'rgba(255,236,180,.22)');lg.addColorStop(1,'rgba(255,236,180,0)');ctx.fillStyle=lg;ctx.beginPath();ctx.roundRect(-tw/2,0,tw,th,10);ctx.fill()}/* lamp light */});
      ctx.restore();
      if(O.rush&&this.rushT&&this.state==='order'){const f=clamp(1-(t-this.rushT)/50,0,1),px=WIN.x+40,py=88,pw=WIN.w-80,ph=66;BB.panel(px,py,pw,ph,20);
        BB.text(f===0?'take your time!':'RUSH',px+30,py+ph/2,22,f===0?'#fff':COL.yellow,{align:'left',stroke:4});
        const bx=px+(f===0?220:110),bw=pw-(f===0?220:110)-30;BB.rrect(bx,py+ph/2-10,bw,20,10,'#233','rgba(255,255,255,.7)',2);if(f>0)BB.rrect(bx,py+ph/2-10,bw*f,20,10,BB.lg(py+ph/2-10,py+ph/2+10,f>.3?['#fff3a6','#e8b830']:['#ffc8a8','#e0805a']))}}
    // bell
    const ready=this.state==='order'&&R.len(this.tray)>=4&&!this.tray.some(x=>x.pending);const bx=WIN.x+WIN.w-118,by=WIN.y+WIN.h-64;/* v12.6: bell sits below the ticket (ticket bottom y400, bell top ~y418); RING! plaque beside it */
    this.drawBell(bx,by,ready,t);
    BB.plaque(bx-150,by+12,110,32,'RING!',22,ready?'#b5482a':'#28403c',{font:'Rammetto One',noRivet:1});
    BB.button(bx-180,by-110,260,140,'',{id:'bell',style:'none',onClick:()=>this.ring()})}
  // v12.6: big retro SMASH-O-MATIC marquee: chrome + enamel bevels, chasing bulbs, gear + lightning accents, flash on each smash
  drawMarquee(){const t=BB.t,cx=PX,cy=252,w=470,h=128,x=cx-w/2,y=cy-h/2,fx=this.smashFx?Math.max(0,1-(t-this.smashFx)/.5):0,fl=BB.q?(Math.random()<.02?.6:1):1;
    // gears behind the corners
    for(const [gx,sd] of[[x+12,1],[x+w-12,-1]]){ctx.save();ctx.translate(gx,cy+6);ctx.rotate(t*.6*sd+fx*2*sd);ctx.fillStyle=BB.lg(-44,44,['#e6eceb','#7d8987','#3b4544']);ctx.strokeStyle='#1e2b29';ctx.lineWidth=3;ctx.beginPath();
      for(let i=0;i<20;i++){const a=i/20*Math.PI*2,rr=i%2?44:36;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#2b3534';ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.fill();ctx.restore()}
    if(BB.q)BB.glow(cx,cy,w*.75,'rgba(255,214,90,A)',(.18+.35*fx)*fl);
    const face=()=>{BB.bevel(x,y,w,h,26,['#ff8f6a','#e0503c','#9e2c22']);
    BB.rrect(x+16,y+30,w-32,h-60,14,BB.lg(y+30,y+h-30,['#173230','#0d1f1d']),'rgba(255,240,200,.5)',2);};if(fx>0||!lq())face();else spr('mq',x-4,y-4,w+8,h+8,face);
    // chasing bulbs
    const N=26,per=2*(w+h);for(let i=0;i<N;i++){let d=i/N*per,bx,by;if(d<w){bx=x+d;by=y+9}else if((d-=w)<h){bx=x+w-9;by=y+d}else if((d-=h)<w){bx=x+w-d;by=y+h-9}else{d-=w;bx=x+9;by=y+h-d}
      const on=fx>0?1:((i+Math.floor(t*8))%3===0);ctx.fillStyle=on?'#fff6c8':'#7a4a2a';if(on&&BB.q){ctx.save();ctx.shadowColor='#ffd75a';ctx.shadowBlur=12;}ctx.beginPath();ctx.arc(bx,by,5.5,0,7);ctx.fill();if(on&&BB.q)ctx.restore();ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=1.2;ctx.stroke()}
    // lightning bolts
    for(const sd of[-1,1]){ctx.save();ctx.translate(cx+sd*(w/2-46),cy+2);ctx.scale(sd,1);ctx.fillStyle=fx>0?'#fffbe0':'#ffd75a';ctx.strokeStyle='#5a3a10';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-6,-26);ctx.lineTo(10,-26);ctx.lineTo(2,-4);ctx.lineTo(12,-4);ctx.lineTo(-8,26);ctx.lineTo(-2,4);ctx.lineTo(-12,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
    const lab=()=>{ctx.save();ctx.globalAlpha=fl;BB.text('SMASH-O-MATIC',cx,cy-5,40*(1+.06*fx),fx>0?'#fffbe0':'#ffe066',{font:'Rammetto One',stroke:7,maxW:w-130});ctx.restore();
    BB.plaque(cx,y+h-6,120,30,'4000',22,'#b5482a',{font:'Rammetto One',noRivet:1})};if(fx>0||!lq())lab();else spr('mql',x,y,w,h+30,lab)}
  drawTray(){const t=BB.t;const off=(this.trayOut||0)*700;ctx.save();ctx.translate(off,0);spr('tray',TRAY.x-20,TRAY.y-20,TRAY.w+40,TRAY.h+40,()=>{BB.panel(TRAY.x,TRAY.y,TRAY.w,TRAY.h,30);
    BB.plaque(TRAY.x+TRAY.w/2,TRAY.y+44,190,24,'ORDER TRAY',17);/* inside the inner border */
    for(let b=0;b<4;b++){const x=this.slotX(b);BB.rrect(x,TRAY.y+68,120,120,18,BB.lg(TRAY.y+68,TRAY.y+188,['#fbf6e6','#e6dcc2']),'rgba(25,25,31,.55)',3);{ctx.font="54px 'Rammetto One'";ctx.textAlign='center';ctx.textBaseline='alphabetic';const m=ctx.measureText(String(b+1)),gx=(m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2;ctx.fillStyle='rgba(40,64,60,.13)';ctx.fillText(String(b+1),x+60+gx,TRAY.y+128+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2)}/* glyph-true centre */}});
    let b=0;this.tray.forEach((it,i)=>{const n=it.k==='x'?1:R.BEATS[it.k],x=this.slotX(b),w=this.slotW(n);
      if(!it.pending){if(it.k==='x'){BB.rrect(x,TRAY.y+68,w,120,18,'#333','#e65046',4);for(let j=0;j<40;j++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.8})`;ctx.fillRect(x+6+Math.random()*(w-16),TRAY.y+74+Math.random()*106,8,4)}BB.text('???',x+w/2,TRAY.y+128,36,'#ff9c8a',{stroke:4})}
        else{const k=ease.back(clamp((t-it.t-.4)/.25,0,1));
          if(n>1){// sustain: glowing bar from the note's box through every beat it is held
            const y0=TRAY.y+68,pulse=.55+.15*Math.sin(t*3+i);for(let j=1;j<n;j++){const hx=this.slotX(b+j);BB.rrect(hx+4,y0+4,112,112,15,`rgba(255,214,90,${.22*pulse})`,`rgba(230,170,40,${.7*pulse})`,3)}
            const by=y0+86;ctx.save();ctx.globalAlpha=.9*k;BB.rrect(x+60,by-7,(n-1)*132+6,14,7,BB.lg(by-7,by+7,['#ffe48a','#f0b43a']),'rgba(25,25,31,.6)',2);ctx.restore();
            for(let j=1;j<n;j++)BB.text('hold',this.slotX(b+j)+60,y0+108,18,'rgba(120,80,10,.8)')}
          const zt=this.zapT?t-this.zapT:9,gl=zt<.7?(1-zt/.7):0;if(this.swapSel===i)BB.rrect(x-4,TRAY.y+64,128,128,20,'rgba(90,200,250,.18)','#5ac8fa',5);
          ctx.save();ctx.translate(x+60+(gl?(Math.random()-.5)*24*gl:0),TRAY.y+188);{const sf=it.k==='s'?.8:it.k==='e'?.92:1;ctx.scale(sf,sf*(.8+.2*k))}R.tile(it.k,-60,-120,120,120,{label:true});ctx.restore();
          if(gl>0&&BB.q){for(let j=0;j<6;j++){ctx.fillStyle=`rgba(${Math.random()<.5?'176,124,255':'90,200,250'},${.6*gl})`;ctx.fillRect(x+Math.random()*110,TRAY.y+72+Math.random()*110,20+Math.random()*50,5)}}}
        if(this.state==='order')BB.button(x,TRAY.y+68,w,120,'',{id:'tray'+i,style:'none',onClick:()=>this.untray(i)})}
      b+=n});
    ctx.restore()}
  drawFly(f){const t=BB.t;if(t<f.t0)return;const k=clamp((t-f.t0)/f.d,0,1),e=ease.inOut(k),x=lerp(f.x0,f.x1,e),y=lerp(f.y0,f.y1,e)-Math.sin(k*Math.PI)*(f.arc||160);
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(k*Math.PI)*.4);if(f.k==='x'){BB.rrect(-50,-40,100,80,14,'#333','#e65046',4);BB.text('???',0,0,30,'#ff9c8a',{stroke:3})}else R.tile(f.k,-60,-42,120,84,{label:true});ctx.restore()}
  drawFan(){const t=BB.t-this.fan.t;if(t>4.2){this.fan=null;return}const k=ease.back(clamp(t/.6,0,1)),a=t<3.6?1:1-(t-3.6)/.6;ctx.save();ctx.globalAlpha=a;
    if(BB.q)BB.glow(PX,ANVIL-200,420,'rgba(216,166,255,A)',.35);
    // four tiny notes fan out, then join with a double beam
    const join=clamp((t-1.1)/.5,0,1);ctx.save();ctx.translate(PX,ANVIL-160);ctx.scale(1.6*k,1.6*k);
    const G=14*2.2,H0=8-1.5*G;// head x of each sixteenth inside R.glyph('s',8,0,14)
    for(let i=0;i<4;i++){const ang=(i-1.5)*.5*(1-join),dx=lerp((i-1.5)*80,H0+i*G,join);ctx.save();ctx.globalAlpha=a*(1-join*.999);ctx.translate(dx,Math.abs(i-1.5)*(1-join)*-30);ctx.rotate(ang);R.glyph('q',0,0,14*(1-join*.14),'#fff');ctx.restore()}
    if(join>0){ctx.globalAlpha=a*join;R.glyph('s',8,0,14,COL.yellow);
      const cur=t>1.7?Math.floor((t-1.7)/.3)%4:-1;['ti','ka','ti','ka'].forEach((sy,i)=>{const hx=H0+i*G+14*.86*.43;BB.text(sy,hx,30,i===cur?20:17,i===cur?'#fff':'#ffe9a8',{stroke:4})})}ctx.restore();
    BB.text('TIKA-TIKA!',PX,ANVIL-370,96*k,COL.yellow,{font:'Rammetto One',stroke:10});BB.text('4 sounds in 1 beat',PX,ANVIL-290,44,'#fff',{stroke:6});ctx.restore()}
  drawHUD(){const t=BB.t;spr('hud'+this.done,30,14,580,150,()=>{BB.panel(40,24,400,110,28);BB.text('ORDERS DONE',64,52,30,COL.yellow,{align:'left',stroke:4});BB.text(`${this.done} of 5`,64,98,28,'#fff',{align:'left',font:'Rammetto One',stroke:4});
    for(let i=0;i<5;i++)BB.rrect(196+i*42,80,32,36,8,i<this.done?BB.lg(80,116,['#a6f5ae','#3fb45a']):'#2d4744','#fff',3);});
    BB.pauseBtn(()=>this.pause());
    if(this.state==='intro')BB.button(W-370,H-150,330,110,'SKIP INTRO',{size:34,id:'skip',onClick:()=>this.skipIntro()});
    else{BB.micMeter(40,H-150);BB.overrideBtn(()=>this.manualOverride(),{pop:this.ovPop&&t-this.ovPop<.3?1.08:1})}
    if(this.cb&&(this.state==='clap'))this.cb.draw(W/2,H-95);
    else if(this.state==='order'){const used=R.len(this.tray);const msg=this.anvil?(this.hamV?'':'CLAP together to SMASH!'):this.scrambled()?'Scrambled! Tap two notes to swap them':used>=4?'Ring the bell!':'Fill the tray: '+(4-used)+' beat'+(4-used===1?'':'s')+' left';
      if(msg&&!this.capOn()){BB.rrect(W/2-330,H-120,660,76,38,'rgba(12,28,26,.78)','rgba(200,240,230,.5)',3);BB.text(msg,W/2,H-82,38,'#fff',{stroke:5})}}
    if(this.few&&t-this.few<1.2)R.bubble(PX,PT-10,'Everyone together!',COL.ink);
    if(this.cb&&this.cb.few&&t-this.cb.few<1.2)R.bubble(W/2,H-300,'Everyone together!',COL.ink)}
  drawEnd(){const t=BB.t-this.st;if(t<.4)return;const k=ease.back(clamp((t-.4)/.6,0,1));ctx.fillStyle=`rgba(8,18,17,${.5*clamp(t,0,1)})`;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(W/2,360);ctx.scale(k,k);BB.panel(-600,-260,1200,520,44);
    BB.text('ROOM 2 COMPLETE!',0,-170,72,'#fff',{font:'Rammetto One',stroke:9});
    ['h','q','e','s'].forEach((kk,i)=>R.tile(kk,-430+i*220,-100,190,120,{label:true}));
    BB.text('whole = 2 halves = 4 ta.  ta = ti-ti.  ti-ti \u2192 TIKA-TIKA!',0,80,36,COL.yellow,{stroke:5});
    BB.text('Next: the PACKING STATION',0,150,38,'#fff',{stroke:5});ctx.restore();
    if(t>1.6){BB.button(W/2-520,700,480,130,'NEXT ROOM',{style:'green',size:56,id:'nextroom',onClick:()=>{BB.go(BB.PackingRoom?new BB.PackingRoom():new BB.MapScene('smasher'))}});
      BB.button(W/2+40,700,480,130,'ROOM MAP',{size:50,id:'tomap',onClick:()=>BB.roomDone('smasher')})}}
}
BB.SmasherRoom=SmasherRoom;
})();
