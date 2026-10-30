// Room 3: PACKING STATION / CARGO CODE (style C, drop chute). Static Jr. destroyed the orders.
// v13.0: 8-beat pallets, gentle belt speed-up, rush orders (beat timer, bonus star, no fail). No clap-back: a full pallet plays back as robot sounds, then ships.
'use strict';
(()=>{const ctx=BB.ctx,COL=BB.COL,W=BB.W,H=BB.H,{clamp,lerp,ease}=BB,R=BB.R;
BB.VO_LINES=(BB.VO_LINES||[]).concat([
 ['pk_intro',"Static Jr. destroyed the orders! Let's pack new rhythm crates. Fill every beat on the pallet. Fill all eight beats on every pallet. Beat the timer on rush orders for bonus stars!",'sprocket'],
 ['pk_how',"Tap a column, then tap DROP. Or swap it with NEXT! Be quick, the next crate is coming!",'sprocket'],
 ['pk_full',"Pallet full! Listen to your rhythm!",'sprocket'],
 ['pk_more',"Here comes another crate! Tap the crate you want to move. Quick, what note is it?",'sprocket'],
 ['pk_rush',"Rush order! Pack it before the timer runs out for a bonus star!",'sprocket'],
 ['pk_big',"Boing! Too big! Count the beats that are left.",'sprocket'],
 ['pk_match',"Now match the order code. Look at the ticket!",'sprocket'],
 ['pk_wrongk',"Oops, the code needs a different crate there.",'sprocket'],
 ['pk_swap',"Uh oh! Static Jr. swapped the next crate! Spot it, and swap it out!",'sprocket'],
 ['pk_great',"Packed and sealed!",'sprocket'],
 ['pk_done',"All orders packed! Room three complete! Next stop, the Label Room!",'sprocket'],
 ['jr_fit',"Wrong fit! Hee hee!",'jr'],
]);
// v12.3: taller chute (longer fall) and 4/6/8-beat pallets; the chute stays 640 px wide, columns narrow as beats grow
const FLOOR=947,CX0=640,CTOP=172,ROWY=575,CH=128;let NB=4,CW=160;const setNB=n=>{NB=n;CW=640/n};
const NEXTP={x:1350,y:170,w:330,h:430},JRH={x:1515,y:110},FB=130;
const ROUNDS=[// v13.0: every pallet is 8 beats; belt speeds up gently (sp); rush orders have a beat timer for a bonus star (no fail). No clap-back: the packed rhythm plays back as robot sounds.
 {n:8,mode:'free',pool:['h','q','e','r','q'],sp:1,ov:1,txt:'FREE BUILD: fill 8 beats any way!'},
 {n:8,mode:'match',code:['h','q','e','q','r','h'],sp:1.08,ov:1,txt:'MATCH THE CODE'},
 {n:8,mode:'free',pool:['w','h','q','e','s','r'],sp:1.16,rush:32,ov:3,txt:'RUSH ORDER: any 8 beats, fast!'},
 {n:8,mode:'match',code:['q','s','e','h','r','q','q'],sp:1.24,ov:2,txt:'8-BEAT CODE with tika-tika'},
 {n:8,mode:'match',code:['w','e','s','q','r'],sp:1.32,rush:36,ov:4,txt:'RUSH ORDER: match the code!'},
 {n:8,mode:'match',code:['h','s','e','q','r','e','q'],sp:1.4,prank:1,ov:3,txt:'8-BEAT CODE (watch out!)'},
];
// v13.2 OVERLAP ("next box falls while you sort"): level -> when the next crate spawns and how many may be in the air.
// at = fraction of the fall the lowest crate has covered before the next one spawns; dly = fallback seconds; max = crates in the air.
// Unplaced crates never fail: a crate that lands where it can't go bounces back to the NEXT queue.
const OVL=[{at:1.01,dly:99,max:1},{at:.68,dly:7,max:2},{at:.55,dly:5.5,max:2},{at:.4,dly:3.6,max:3},{at:.3,dly:3,max:3}];
const splitParts=Rd=>{if(Rd.mode!=='match'){const a=[];for(let n=Rd.n;n>0;n-=8)a.push({n:Math.min(8,n)});return a}const a=[];let cur=[],b=0;for(const k of Rd.code){cur.push(k);b+=R.BEATS[k];if(b===8){a.push({n:8,code:cur});cur=[];b=0}}if(cur.length)a.push({n:b,code:cur});return a};

const howTo={title:'PACKING STATION: fill every beat on the pallet!',
  steps:['A crate falls down the chute. Its size = its beats.','Tap a column (1-4) to move it. Tap DROP to drop it.','Tap SWAP to trade it with the NEXT crate.','Later orders: more crates fall at once. Tap one to grab it (each finger can drag its own).','Full pallet? Listen, then clap the cargo code back!','No mic? Tap MANUAL OVERRIDE when they nail it.'],
  words:'whole = 4 beats   half = 2   ta, ti-ti, tika-tika, rest = 1 beat each',
  example:(x,y,w,h,t)=>{const ph=(t%4)/4;ctx.save();ctx.translate(x+w/2,y+h/2);const cw=100;
    BB.rrect(-2*cw-10,-150,4*cw+20,300,14,'#132322','#50aaa0',3);R.crateDraw('h',-2*cw,90,2*cw-6,70);R.crateDraw('q',0,90,cw-6,70);
    const yy=lerp(-140,90,ease.inOut(clamp(ph*1.6,0,1)));R.crateDraw('e',cw,yy,cw-6,70);if(ph>.66)BB.text('FULL! clap it',0,-120,32,COL.yellow,{stroke:4});ctx.restore()}};
// crate: painted wood 3-slice + colored code label
R.crateDraw=(k,x,y,w,h,o={})=>{const im=BB.V2.crate,c=R.COLS[k];ctx.save();ctx.globalAlpha=o.alpha??1;
  BB.rrect(x+4,y+8,w,h,10,'rgba(0,0,0,.3)');
  if(im){const s=h/im.height,cap=70;ctx.drawImage(im,0,0,cap,im.height,x,y,cap*s,h);ctx.drawImage(im,cap,0,im.width-2*cap,im.height,x+cap*s,y,w-2*cap*s,h);ctx.drawImage(im,im.width-cap,0,cap,im.height,x+w-cap*s,y,cap*s,h)}
  else BB.rrect(x,y,w,h,8,'#c9a06a',COL.ink,3);
  // tinted label + name tag
  const lw=Math.min(w-(w<120?14:40),Math.max(70,h*1.1)),lx=x+w/2-lw/2,ly=y+h*.22,lh=h*.62;BB.rrect(lx,ly,lw,lh,10,BB.lg(ly,ly+lh,[c[0],c[1]]),'rgba(25,25,31,.8)',3);
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(lx+6,ly+4,lw-12,lh*.22);
  R.tile(k,lx+4,ly+lh*.06,lw-8,lh*.86,{shadow:false,gs:.95});
  if(o.tag!==false&&w>60){const fs=w<120?14:18,tw=Math.min(w-16,BB.measure(R.NAME[k],fs)+18),tx=w<120?x+w/2-tw/2:x+12;BB.rrect(tx,y-12,tw,28,8,'#fbf6e6',COL.ink,2);BB.text(R.NAME[k],tx+tw/2,y+3,fs,COL.ink,{maxW:tw-8})}
  BB.text(String(R.BEATS[k]),x+w-22,y+h-20,24,'#fff',{stroke:4});ctx.restore()};
class PackingRoom{constructor(o={}){this.o=o}
  enter(){BB.groove.start(100,'pack');this.ri=this.o.startAt||0;this.packed=this.ri;this.cells=[null,null,null,null];this.placed=[];this.q=[];this.cur=null;this.air=[];this.grab={};this.bounce=[];this.motes=R.motes(22);this.said={};this.lastOverride=-9;this.belt=0;
    this.state='load';R.loadImgs([['pack_bg','jpg'],['crate','png']]).then(()=>{this.static=this.bake();if(this.o.skipIntro||this.o.startAt)this.beginRound();else this.startIntro()});BB.mic.take()}
  exit(){BB.paused=false}
  bake(){const s=!BB.q?.5:1,c=document.createElement('canvas');c.width=W*s;c.height=H*s;const g=c.getContext('2d');g.scale(s,s);const V=BB.V2;
    if(V.pack_bg)g.drawImage(V.pack_bg,0,0,W,H);
    // chute: shadow, frame, dark glass interior with column lanes
    R.shadow(g,W/2,FLOOR+8,420,.6);
    g.fillStyle='rgba(0,0,0,.3)';g.fillRect(CX0-34,CTOP-60+14,NB*CW+68,ROWY+CH+60-CTOP+60);
    const fr=g.createLinearGradient(CX0-30,0,CX0+NB*CW+30,0);fr.addColorStop(0,'#7c8a8c');fr.addColorStop(.5,'#c9d2d3');fr.addColorStop(1,'#6a7678');g.fillStyle=fr;g.fillRect(CX0-30,CTOP-60,NB*CW+60,ROWY+CH+40-CTOP+60);
    const ig=g.createLinearGradient(0,CTOP,0,ROWY+CH);ig.addColorStop(0,'#16282a');ig.addColorStop(1,'#20393a');g.fillStyle=ig;g.fillRect(CX0,CTOP-10,NB*CW,ROWY+CH+10-CTOP+10);
    for(let i=1;i<NB;i++){g.fillStyle='rgba(160,210,200,.16)';g.fillRect(CX0+i*CW-2,CTOP-10,4,ROWY-CTOP+10)}
    g.font=(NB>6?48:64)+"px 'Rammetto One'";g.textAlign='center';g.textBaseline='alphabetic';g.fillStyle='rgba(180,230,220,.14)';for(let i=0;i<NB;i++){const m=g.measureText(String(i+1));g.fillText(String(i+1),CX0+i*CW+CW/2+(m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2,CTOP+40+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2)}
    // rivets
    g.fillStyle='#4d585a';for(let y=CTOP-40;y<ROWY+CH+30;y+=70){for(const x of [CX0-16,CX0+NB*CW+16]){g.beginPath();g.arc(x,y,5,0,7);g.fill()}}
    // yellow header
    g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.moveTo(CX0-90,CTOP-102+10);g.lineTo(CX0+NB*CW+90,CTOP-102+10);g.lineTo(CX0+NB*CW+30,CTOP-48+10);g.lineTo(CX0-30,CTOP-48+10);g.fill();
    const hg=g.createLinearGradient(0,CTOP-102,0,CTOP-48);hg.addColorStop(0,'#ffe680');hg.addColorStop(1,'#e8b830');g.fillStyle=hg;g.beginPath();g.moveTo(CX0-90,CTOP-102);g.lineTo(CX0+NB*CW+90,CTOP-102);g.lineTo(CX0+NB*CW+30,CTOP-48);g.lineTo(CX0-30,CTOP-48);g.closePath();g.fill();g.strokeStyle='#19191f';g.lineWidth=4;g.stroke();
    g.font="30px 'Rammetto One'";g.fillStyle='#3a2a10';g.fillText('DROP CHUTE',W/2,CTOP-73);
    // steel stand under the chute down to the floor
    for(const x of [CX0-10,CX0+NB*CW-40]){const lg=g.createLinearGradient(x,0,x+50,0);lg.addColorStop(0,'#5d696b');lg.addColorStop(.5,'#aab4b5');lg.addColorStop(1,'#4d585a');g.fillStyle=lg;g.fillRect(x,ROWY+CH+40,50,FLOOR-ROWY-CH-30)}
    g.fillStyle='#6a7678';g.fillRect(CX0-10,ROWY+CH+120,NB*CW+20,26);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(CX0-10,ROWY+CH+146,NB*CW+20,8);
    // hazard strip + pallet bed
    for(let i=0;i<24;i++){g.fillStyle=i%2?'#19191f':'#f2c230';g.beginPath();const x=CX0-30+i*((NB*CW+60)/24);g.moveTo(x,ROWY+CH+14);g.lineTo(x+(NB*CW+60)/24,ROWY+CH+14);g.lineTo(x+(NB*CW+60)/24-12,ROWY+CH+40);g.lineTo(x-12,ROWY+CH+40);g.fill()}
    return c}
  startIntro(){this.state='intro';this.st=BB.t;this.jr={x:-160};this.wreck=[];for(let i=0;i<6;i++)this.wreck.push({k:['h','q','e','s','w','r'][i],x:CX0+80+i*100,y:ROWY+40,vx:0,vy:0,r:0,hit:0})}
  intro(dt){const t=BB.t-this.st,j=this.jr;j.x=lerp(-160,W+200,clamp(t/3.2,0,1));
    for(const c of this.wreck){if(!c.hit&&Math.abs(j.x-c.x)<60){c.hit=1;c.vx=300+Math.random()*500;c.vy=-700-Math.random()*400;BB.sfx.crunch();BB.shake(4);BB.burst(c.x,c.y,10,{cols:['#c9a06a','#7c5530'],kind:'dot',size:10,speed:400,g:900})}
      if(c.hit){c.vy+=1800*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.r+=dt*8}}
    if(t>.6&&!this.said.g){this.said.g=1;BB.say('jr_giggle',{overlap:true})}
    if(t>2.6&&!this.said.i){this.said.i=1;this.voEnd=BB.t+BB.say('pk_intro')}
    if(t>3.2&&BB.t>(this.voEnd||0)+.1)this.skipIntro()}
  skipIntro(){this.jr=null;this.wreck=null;BB.talking=null;BB.caption=null;this.beginRound()}
  beginRound(){const Rd=ROUNDS[this.ri];this.Rd=Rd;this.parts=splitParts(Rd);this.part=0;this.beginPart()}
  beginPart(){const Rd=this.Rd,P=this.parts[this.part];this.pcode=P.code||null;setNB(P.n);if(this.bakedN!==NB){this.static=this.bake();this.bakedN=NB}this.state='play';this.cells=new Array(NB).fill(null);this.placed=[];this.cur=null;this.air=[];this.grab={};this.lastSpawn=BB.t;this.cb=null;this.tries=0;this.prank=null;this.decoyUsed=0;this.face=null;this.crush=[];this.palletIn=BB.t;
    if(Rd.mode==='limited')this.q=Rd.set.slice().sort(()=>Math.random()-.5);else if(Rd.mode==='match')this.q=[...this.pcode,'h'].sort(()=>Math.random()-.5);else this.q=[];this.fillQ();
    this.rush=Rd.rush?{t0:BB.t,spb:.6,lim:Rd.rush}:null;if(this.rush&&this.ri>0)setTimeout(()=>BB.scene===this&&BB.say('pk_rush'),400);
    if(this.ri===0){this.cardT=BB.t;setTimeout(()=>BB.scene===this&&BB.say('pk_how'),2600)}
    else if(Rd.mode==='match'&&!this.said.m){this.said.m=1;BB.say('pk_match')}
    this.spawn()}
  fillQ(){const Rd=this.Rd;while(this.q.length<4){if(Rd.mode==='match')this.q.push(...[...this.pcode].sort(()=>Math.random()-.5));
      else if(Rd.mode==='limited')break;else{let left=NB;const set=[];while(left>0){const ok=Rd.pool.filter(k=>R.BEATS[k]<=left);const k=ok[Math.random()*ok.length|0];set.push(k);left-=R.BEATS[k]}this.q.push(...set.sort(()=>Math.random()-.5))}}}
  gapMax(){let m=0,r=0;for(const c of this.cells){r=c?0:r+1;m=Math.max(m,r)}return m}
  spawn(){if(!this.q.length){this.fillQ();if(!this.q.length)return}
    // never deadlock: if nothing in the queue can fit, slip in a crate that does (match mode: the crate the code needs next)
    const g=this.gapMax();if(this.Rd.mode==='match'){let b=0,need=[];for(const k of this.pcode){if(!this.cells[b])need.push(k);b+=R.BEATS[k]}if(!need.some(k=>this.q.includes(k)))this.q.unshift(need[0])}
    else if(!this.q.some(k=>R.BEATS[k]<=g))this.q.unshift(g>=2?'h':'q');let k=this.q.shift(),decoy=0;
    const w=R.BEATS[k];let col=this.firstFree(w);const c={k,col,y:CTOP-CH-10,fast:0,t:BB.t,x:CX0+col*CW,decoy,id:++this.cid||(this.cid=1)};
    // spread a 2nd/3rd crate into a different lane so they don't stack on top of each other
    if(this.air.length){const used=this.air.map(a=>a.col);for(let cc=0;cc<=NB-w;cc++){if(!used.some(u=>Math.abs(u-cc)<w)){c.col=cc;break}}c.x=CX0+c.col*CW}
    this.air.push(c);if(!this.cur)this.cur=c;this.lastSpawn=BB.t;if(this.air.length>1){this.newT=BB.t;if(!this.said.ov){this.said.ov=1;BB.say('pk_more',{overlap:true})}}this.fillQ()}
  ovl(){const Rd=this.Rd;if(!Rd)return OVL[0];let i=Rd.ov||0;if(this.part)i++;return OVL[Math.min(OVL.length-1,i)]}
  // crates still needed in the air? (never more than the beats that are left can hold)
  maybeSpawn(){if(this.state!=='play')return;const o=this.ovl(),n=this.air.length;if(!n){return}
    if(n>=o.max)return;let need=this.left();for(const a of this.air)need-=R.BEATS[a.k];if(need<=0)return;
    const low=Math.max(...this.air.map(a=>a.y)),fr=(low-(CTOP-CH-10))/(ROWY-(CTOP-CH-10));
    const top=Math.min(...this.air.map(a=>a.y));if(top<CTOP+40)return;// room at the top of the chute
    if(fr>=o.at||BB.t-this.lastSpawn>o.dly)this.spawn()}
  select(c){if(c&&this.air.includes(c)){this.cur=c;this.selT=BB.t}}
  firstFree(w){for(let c=0;c<=NB-w;c++){let ok=true;for(let i=0;i<w;i++)if(this.cells[c+i])ok=false;if(ok)return c}return 0}
  left(){return this.cells.filter(x=>!x).length}
  setCol(c){const cu=this.cur;if(!cu||this.state!=='play')return;cu.touched=1;const w=R.BEATS[cu.k];cu.col=clamp(c,0,NB-w)}
  drop(){if(this.cur&&this.state==='play'){this.cur.fast=1;this.cur.touched=1;const d=this.cur;this.cur=this.air.filter(a=>a!==d).sort((a,b)=>b.y-a.y)[0]||d;BB.sfx.whoosh(undefined,.3)}}
  swap(){const cu=this.cur;if(!cu||this.state!=='play'||!this.q.length)return;if(cu.decoy){cu.decoy=0;this.jrToss={t:BB.t,k:cu.k,x0:cu.x};cu.k=this.q.shift();cu.col=clamp(cu.col,0,NB-R.BEATS[cu.k]);this.swapT=BB.t;BB.sfx.pop();return}
    const nk=this.q.shift();this.q.push(cu.k);cu.k=nk;cu.col=clamp(cu.col,0,NB-R.BEATS[nk]);this.swapT=BB.t;BB.sfx.pop();
    if(this.prank&&this.prank.ph==='wait'&&cu.k!=='w'&&this.q[0]==='w'){this.q.shift();this.prankHit()}}
  land(cu){const w=R.BEATS[cu.k];const sel=cu===this.cur;this.air=this.air.filter(a=>a!==cu);for(const id in this.grab)if(this.grab[id].c===cu)delete this.grab[id];const after=()=>{if(this.cur===cu||!this.air.includes(this.cur))this.cur=this.air.slice().sort((a,b)=>b.y-a.y)[0]||null};let fit=true;for(let i=0;i<w;i++)if(this.cells[cu.col+i])fit=false;
    let why='';if(!fit)why=this.left()<w?`too big! ${w} > ${this.left()}`:'no room there!';
    else if(this.Rd.mode==='match'){let b=0,ok=false;for(const k of this.pcode){if(b===cu.col&&k===cu.k)ok=true;b+=R.BEATS[k]}if(!ok){fit=false;why='the code needs '+this.codeAt(cu.col)+' here'}}
    if(fit){for(let i=0;i<w;i++)this.cells[cu.col+i]=cu.k;this.placed.push({k:cu.k,col:cu.col,t:BB.t});BB.sfx.thunk();BB.shake(3);BB.burst(CX0+cu.col*CW+w*CW/2,ROWY+CH,10,{col:'#d8c8a8',kind:'dust',size:16,g:-40,speed:200});after();
      if(this.left()===0){this.air=[];this.cur=null;this.lock();return}this.respawn(450)}
    else if(!sel&&!cu.decoy&&!cu.touched){BB.sfx.boing();this.bounce.push({k:cu.k,x:CX0+cu.col*CW,y:ROWY-20,vx:900,vy:-1100,r:0,t:BB.t,why:''});this.backT=BB.t;const k=cu.k;after();if(!(this.prank&&k==='w'))this.q.unshift(k);else this.prankHit(true);this.respawn(600)}
    else if(why==='no room there!'||why.startsWith('too')||cu.decoy){BB.sfx.crunch();BB.sfx.thunk();BB.shake(6);const cx=CX0+cu.col*CW;this.crush.push({k:cu.k,x:cx,w:w*CW-12,t:BB.t,why:cu.decoy?'decoy crate!':why});
      BB.burst(cx+w*CW/2,ROWY+20,16,{cols:['#c9a06a','#7c5530','#e8d2a8'],kind:'dot',size:10,speed:520,g:1200});this.boinkT=null;if(this.left()<=1&&why.startsWith('too'))this.blink=BB.t;
      if(!this.said.big&&why.startsWith('too')){this.said.big=1;BB.say('pk_big')}const k=cu.k,dec=cu.decoy;after();if(!dec&&!(this.prank&&k==='w'))this.q.splice(sel?this.q.length:0,0,k);else if(this.prank&&k==='w')this.prankHit(true);this.respawn(800)}
    else{BB.sfx.boing();this.bounce.push({k:cu.k,x:CX0+cu.col*CW,y:ROWY-20,vx:-500-Math.random()*200,vy:-900,r:0,t:BB.t,why});this.boinkT=BB.t;
      if(!this.said.big&&why.startsWith('too')){this.said.big=1;BB.say('pk_big')}else if(why.startsWith('the code')&&!this.said.wk){this.said.wk=1;BB.say('pk_wrongk')}
      const k=cu.k;after();if(!(this.prank&&k==='w'))this.q.splice(sel?this.q.length:0,0,k);else this.prankHit(true);this.respawn(700)}}
  respawn(ms){setTimeout(()=>BB.scene===this&&this.state==='play'&&!this.air.length&&this.spawn(),ms)}
  codeAt(col){let b=0;for(const k of this.pcode){if(b===col)return R.NAME[k];if(col>b&&col<b+R.BEATS[k])return R.NAME[k]+' (it starts on beat '+(b+1)+')';b+=R.BEATS[k]}return '?'}
  seq(){const s=[];for(let c=0;c<NB;){const k=this.cells[c];s.push(k);c+=R.BEATS[k]}return s}
  lock(){this.state='lock';this.st=BB.t;BB.sfx.clunk();BB.sfx.thunk(BB.ac.currentTime+.15);BB.shake(5);
    if(this.rush){const left=this.rushLeft();this.rush.done=1;if(left>0){this.stars=(this.stars||0)+1;this.starT=BB.t;BB.sfx.fanfare&&BB.sfx.tink();BB.burst(310,250,18,{col:COL.yellow,kind:'star',size:16,speed:500,g:400})}}
    BB.say('pk_full');setTimeout(()=>BB.scene===this&&this.playBack(),1600)}
  rushLeft(){const r=this.rush;return r?Math.max(0,r.lim-(BB.t-r.t0)/r.spb):0}
  // v13.0: play the packed rhythm back in tempo over the groove, lighting each crate as it sounds
  playBack(){const ac=BB.ac,g=BB.groove,S=BB.sfx;let spb=.6,t0=ac.currentTime+.3;if(g&&g.on){spb=g.spb;const k=Math.ceil((ac.currentTime+.25-g.t0)/spb);t0=g.t0+k*spb}
    const notes=[];let b=0;for(const k of this.seq()){const n=R.BEATS[k],t=t0+b*spb;notes.push({k,col:b,n,t});
      if(k==='q')S.pkTa(t);else if(k==='e'){S.pkBlip(t,1100);S.pkBlip(t+spb/2,1100)}else if(k==='s'){for(let i=0;i<4;i++)S.pkBlip(t+i*spb/4,1500)}else if(k==='r')S.pkHiss(t,spb*.6);else S.pkHum(t,n*spb*.9);b+=n}
    this.pb={notes,a0:t0,spb,end:t0+b*spb};this.state='play2';this.st=BB.t}
  clapDone(){this.pb=null;this.state='ship';this.st=BB.t;BB.sfx.fanfare();BB.say('pk_great');BB.burst(W/2,ROWY+40,40,{cols:['#ffe066','#6ee678','#fff','#5ac8fa'],kind:'star',size:14,speed:800,g:500})}
  manualOverride(){if(BB.t-this.lastOverride<.5)return;this.lastOverride=BB.t;this.ovPop=BB.t;if(this.state==='play')this.drop()}
  // Static Jr. sneaks an overflow crate into NEXT when one beat is left
  // v14.0 Static Jr.'s FACE BOX (teacher-approved): a few times per game (more likely near the end of a pallet) he drops his face box.
  // Drag it up onto his head to bonk him. If it reaches the pallet first, it pops the crates it lands on (+ the one beside it) back into the queue.
  updFace(dt){const f=this.face;if(this.jrB)this.jrB.k=BB.t-this.jrB.t;
    if(!f){if(this.state!=='play'||(this.faces||0)>=3||BB.t-(this.faceT||-9)<14||!this.placed.length||this.left()<1||BB.t-this.palletIn<4)return;
      const prog=1-this.left()/NB;if(Math.random()<dt*.05*(1+3*prog*prog)){this.faces=(this.faces||0)+1;this.faceT=BB.t;const col=Math.random()*NB|0;this.face={x:CX0+col*CW+CW/2,y:-60,t:BB.t,drag:null};this.jrB={t:BB.t,ph:'giggle'};BB.sfx.whoosh(undefined,.5);BB.say('jr_giggle',{overlap:true});
        if(!this.said.face){this.said.face=1;BB.caption={txt:'Static Jr. dropped his FACE BOX! Drag it up onto his head!',who:'sprocket',until:BB.t+3,start:BB.t}}}return}
    if(this.state!=='play'){this.face=null;return}
    if(!f.drag){f.y+=dt*(70+Math.min(40,(BB.t-f.t)*4));if(f.y+FB/2>=ROWY){this.faceHit()}}}
  faceHit(){const f=this.face;this.face=null;const c0=Math.floor((f.x-CX0)/CW);BB.sfx.glitch();BB.sfx.pop();BB.shake(5);BB.burst(f.x,ROWY,30,{cols:['#ffe066','#7ef0ff','#ff8adf','#fff'],kind:'star',size:14,speed:700,g:300});
    const hit=this.placed.filter(p=>p.col<=c0+1&&p.col+R.BEATS[p.k]-1>=c0-1&&Math.abs(p.col+R.BEATS[p.k]/2-(f.x-CX0)/CW)<R.BEATS[p.k]/2+.9);
    for(const p of hit){for(let i=0;i<R.BEATS[p.k];i++)this.cells[p.col+i]=null;this.q.unshift(p.k);this.bounce.push({k:p.k,x:CX0+p.col*CW,y:ROWY,vx:(Math.random()-.5)*900,vy:-1300,r:0,t:BB.t,why:''})}
    this.placed=this.placed.filter(p=>!hit.includes(p));this.jrB={t:BB.t,ph:'laugh'};BB.say('jr_fit',{overlap:true,nocap:true});
    BB.caption={txt:hit.length?'Glitch-pop! '+hit.length+' crate'+(hit.length>1?'s':'')+' popped off. Pack '+(hit.length>1?'them':'it')+' again!':'Phew! It missed your crates.',who:'sprocket',until:BB.t+2.6,start:BB.t}}
  faceBonk(){const f=this.face;this.face=null;this.jrB={t:BB.t,ph:'bonk'};BB.sfx.bonk();BB.shake(4);BB.say('jr_oof',{overlap:true,nocap:true});BB.burst(JRH.x,JRH.y-30,16,{col:COL.yellow,kind:'star',size:14,g:300});
    BB.caption={txt:'BONK! Static Jr.: "Hmph... no fair!"',who:'jr',until:BB.t+2.2,start:BB.t}}
  drawFace(){const f=this.face,jb=this.jrB,k=jb?BB.t-jb.t:9;
    // Jr. perches on the NEXT panel while a face box is live (or reacting)
    if(f||k<2.4){const ph=jb&&jb.ph,bonk=ph==='bonk'&&k<2.4;BB.staticJr(JRH.x,JRH.y+130,120,{dizzy:bonk,glitch:bonk?.5:0,flip:true});
      if(bonk)R.bubble(JRH.x,JRH.y-120,'grumble grumble...');else if(ph==='laugh'&&k<1.8)R.bubble(JRH.x,JRH.y-120,'hee hee!');else if(f){R.bubble(JRH.x,JRH.y-120,'bonk me? never!');if(!f.drag){ctx.save();ctx.globalAlpha=.5+.4*Math.sin(BB.t*8);ctx.strokeStyle=COL.yellow;ctx.lineWidth=6;ctx.setLineDash([14,10]);ctx.beginPath();ctx.moveTo(f.x,f.y-FB/2);ctx.quadraticCurveTo((f.x+JRH.x)/2,Math.min(f.y,JRH.y)-160,JRH.x,JRH.y-10);ctx.stroke();ctx.restore()}}}
    if(!f)return;const s=FB/2,pu=f.drag?1.08:1+.05*Math.sin(BB.t*10);ctx.save();ctx.translate(f.x,f.y);ctx.scale(pu,pu);ctx.rotate(f.drag?0:Math.sin(BB.t*3)*.08);
    BB.rrect(-s,-s,s*2,s*2,16,BB.lg(-s,s,['#9b8fe0','#4b3f8f']),COL.ink,6);ctx.save();ctx.beginPath();ctx.roundRect(-s+5,-s+5,s*2-10,s*2-10,12);ctx.clip();BB.staticJr(0,s*1.25,s*2.1,{});ctx.restore();
    BB.rrect(-70,s+6,140,32,10,'rgba(12,28,26,.85)',COL.yellow,2);BB.text(f.drag?'DROP ON HIS HEAD!':'DRAG ME UP!',0,s+22,17,'#fff',{maxW:132});ctx.restore()}
  startPrank(){this.prank={t:BB.t,x:W+120,ph:'in'};BB.sfx.glitch();BB.say('jr_fit',{overlap:true})}
  updPrank(dt){const p=this.prank,t=BB.t-p.t;
    if(p.ph==='in'){p.x=lerp(W+120,NEXTP.x+NEXTP.w/2+40,ease.out(clamp(t/1,0,1)));if(t>1.1){this.q.unshift('w');BB.sfx.zap();this.swapT=BB.t;p.ph='wait';p.t2=BB.t;setTimeout(()=>BB.scene===this&&BB.say('pk_swap'),600)}}
    if(p.ph==='wait')p.x=NEXTP.x+NEXTP.w/2+40+Math.sin(BB.t*5)*12;
    if(p.ph==='hit'&&BB.t-p.t3>1.6)p.ph='run';
    if(p.ph==='run'){p.x+=dt*1000;if(p.x>W+200)p.ph='done'}}
  prankHit(viaBoink){const p=this.prank;if(!p||p.ph!=='wait')return;p.ph='hit';p.t3=BB.t;this.jrCrate={t:BB.t,x0:viaBoink?CX0:NEXTP.x+60,y0:viaBoink?ROWY-100:NEXTP.y+100};
    setTimeout(()=>{if(BB.scene!==this)return;BB.sfx.bonk();BB.say('jr_oof',{overlap:true,nocap:true});BB.burst(p.x,NEXTP.y-40,12,{col:COL.yellow,kind:'star',size:14,g:300})},500)}
  pause(){BB.paused=true;BB.ac.suspend()}
  resume(){BB.paused=false;BB.ensureMic()}
  // pointer: tap a column to steer, or drag the falling crate sideways
  // v13.2: multi-touch. Touching a crate grabs + selects it (each finger drags its own crate); tapping an empty lane steers the selected crate.
  hitCrate(p){let best=null;for(const a of this.air){const w=R.BEATS[a.k];if(p.x>a.x-10&&p.x<a.x+w*CW+10&&p.y>a.y-30&&p.y<a.y+CH+30&&(!best||a.y>best.y))best=a}return best}
  pdown(p){const f=this.face;if(f&&!f.drag&&this.state==='play'&&Math.abs(p.x-f.x)<FB*.75&&Math.abs(p.y-f.y)<FB*.75){f.drag={id:p.id,dx:p.x-f.x,dy:p.y-f.y};BB.sfx.pop();return true}if(this.state!=='play'||!this.air.length)return false;if(p.x>CX0-20&&p.x<CX0+NB*CW+20&&p.y>CTOP-CH-60&&p.y<ROWY+CH){const c=this.hitCrate(p);
      if(c){this.grab[p.id]={c,dx:p.x-c.x};c.touched=1;this.select(c);return true}
      if(this.cur){this.cur.touched=1;this.grab[p.id]={c:this.cur,dx:R.BEATS[this.cur.k]*CW/2};this.setColOf(this.cur,Math.floor((p.x-CX0)/CW))}return true}return false}
  pmove(p){const f=this.face;if(f&&f.drag&&f.drag.id===p.id){f.x=clamp(p.x-f.drag.dx,80,W-80);f.y=clamp(p.y-f.drag.dy,40,ROWY);return}const g=this.grab[p.id];if(!g||!this.air.includes(g.c))return;this.setColOf(g.c,Math.round((p.x-g.dx-CX0)/CW))}
  pup(p){const f=this.face;if(f&&f.drag&&(!p||f.drag.id===p.id)){f.drag=null;if(Math.hypot(f.x-JRH.x,f.y-JRH.y)<170)this.faceBonk();if(p)return}if(p&&this.grab[p.id])delete this.grab[p.id];else if(!p)this.grab={}}
  setColOf(c,col){if(this.state!=='play')return;c.col=clamp(col,0,NB-R.BEATS[c.k])}
  update(dt){BB.dt=dt;if(BB.keys.includes(' '))this.manualOverride();if(BB.keys.includes('p')){this.pause();return}
    for(const key of BB.keys){if(key>='1'&&key<=String(NB))this.setCol(+key-1);if(key==='ArrowLeft'&&this.cur)this.setCol(this.cur.col-1);if(key==='ArrowRight'&&this.cur)this.setCol(this.cur.col+1);if(key==='ArrowDown'||key==='d')this.drop();if(key==='n')this.swap()}
    this.belt+=dt*40;
    if(this.state==='intro'){this.intro(dt);if(BB.keys.includes('s'))this.skipIntro()}
    const cu=this.cur;if(this.state==='play'){const base=44*(this.Rd.sp||1)*(1+this.part*.06);
      for(const a of this.air.slice()){a.x=lerp(a.x,CX0+a.col*CW,Math.min(1,dt*14));
        // the selected crate falls at full speed; waiting crates drift a bit slower so the overlap stays readable
        const v=a.fast?1150:base*(1+Math.min(.6,(BB.t-a.t)*.04))*(a===this.cur||this.air.length<2?1:.8);a.y+=dt*v;
        if(a.y>=ROWY){a.y=ROWY;this.land(a);if(this.state!=='play')break}}
      this.maybeSpawn()}
    for(let i=this.bounce.length-1;i>=0;i--){const b=this.bounce[i];b.vy+=2200*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.r-=dt*5;if(b.y>H+300)this.bounce.splice(i,1)}
    // sim: steer each crate into the first slot that fits (?sim=1&auto)
    if(BB.debug&&this.o.auto&&cu&&this.state==='play'&&BB.t-Math.max(cu.t,this.selT||0)>.8&&!cu.fast){let c=-1;if(this.Rd.mode==='match'){let b=0;for(const k of this.pcode){if(k===cu.k&&!this.cells[b]){c=b;break}b+=R.BEATS[k]}}else c=this.left()>=R.BEATS[cu.k]?this.firstFree(R.BEATS[cu.k]):-1;
      if(c<0&&this.q.length&&!this.autoSw){this.autoSw=1;this.swap()}else{this.autoSw=0;if(c>=0)this.setCol(c);this.drop()}}
    // v14.0: old last-beat crate swap removed; Static Jr. now drops his face box (updFace)
    this.updFace(dt);
    if(this.prank)this.updPrank(dt);
    BB.mic.take();if(this.state==='play2'&&this.pb&&BB.ac.currentTime>this.pb.end+.15)this.clapDone();
    if(this.state==='ship'){const t=BB.t-this.st;if(t>3.2){if(this.part<this.parts.length-1){this.part++;this.beginPart();return}this.packed++;this.ri++;if(this.ri>=ROUNDS.length){this.state='end';this.st=BB.t;BB.say('pk_done');BB.celebrate({next:'LABEL ROOM'});if(!BB.save.done.includes('packing')){BB.save.done.push('packing');localStorage.setItem('bb4',JSON.stringify(BB.save))}}else this.beginRound()}}}
  // ---------- drawing ----------
  draw(){const t=BB.t,[sx,sy]=BB.shakeXY;ctx.save();ctx.translate(sx,sy);
    if(this.static)ctx.drawImage(this.static,0,0,W,H);else{ctx.fillStyle='#2a3a38';ctx.fillRect(0,0,W,H)}
    R.lampGlow([[348,140],[562,175],[955,175],[1340,175],[1585,140]],t);
    this.drawBelt();this.drawPallet();this.drawChuteContents();this.drawOrder();this.drawNext();this.drawPB();this.drawRush();
    BB.contactShadow(1790,905,110,.5);BB.sprite('sprocket',1790,905,280,{squash:BB.isTalking('sprocket')?Math.sin(t*18)*.015:Math.sin(t*2)*.006});
    if(this.jr)BB.staticJr(this.jr.x,FLOOR,120,{run:1,spd:712});
    if(this.wreck)for(const c of this.wreck){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.r);R.crateDraw(c.k,-60,-50,120,100,{tag:false});ctx.restore()}
    if(this.prank&&this.prank.ph!=='done'){const p=this.prank;BB.staticJr(p.x,NEXTP.y-10,110,{run:p.ph==='in'||p.ph==='run'?1:0,dizzy:p.ph==='hit',glitch:p.ph==='hit'?.6:0,spd:p.ph==='run'?1000:600,flip:p.ph!=='run'});if(p.ph==='wait')R.bubble(p.x,NEXTP.y-230,'wrong fit! hee hee')}
    if(this.jrCrate){const j=this.jrCrate,k=clamp((t-j.t)/.5,0,1);if(t-j.t<1.4){const p=this.prank,x=lerp(j.x0,p?p.x:W,k),y=lerp(j.y0,NEXTP.y-80,k)-Math.sin(k*Math.PI)*220;ctx.save();ctx.translate(x,y);ctx.rotate(k*6);R.crateDraw('w',-90,-30,180,60,{tag:false});ctx.restore()}}
    for(const c of (this.crush||[])){const a=t-c.t;if(a>1.6)continue;const sq=ease.out(clamp(a/.18,0,1));ctx.save();ctx.globalAlpha=a<1.2?1:1-(a-1.2)/.4;ctx.translate(c.x+6+c.w/2,ROWY);ctx.scale(1+sq*.25,1-sq*.72);R.crateDraw(c.k,-c.w/2,-CH,c.w,CH,{tag:false});ctx.restore();
      if(a<1.4){const k=ease.back(clamp(a/.3,0,1));BB.text('CRUNCH!',CX0-150,ROWY-180,72*k,'#e65046',{font:'Rammetto One',stroke:8});R.bubble(CX0-170,ROWY-300,c.why,COL.ink)}}
    this.drawFace();
    if(this.jrToss&&t-this.jrToss.t<1){const j=this.jrToss,k=(t-j.t);ctx.save();ctx.translate(j.x0+k*900,CTOP+40-Math.sin(k*Math.PI)*200);ctx.rotate(k*8);R.crateDraw(j.k,-80,-40,160,80,{tag:false});ctx.restore()}
    for(const b of this.bounce){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.r);R.crateDraw(b.k,0,-CH/2,R.BEATS[b.k]*CW-12,CH);ctx.restore()}
    if(this.boinkT&&t-this.boinkT<1.3){const k=ease.back(clamp((t-this.boinkT)/.3,0,1));BB.text('BOINK!',CX0-150,ROWY-180,80*k,'#e65046',{font:'Rammetto One',stroke:8});const b=this.bounce[this.bounce.length-1];if(b&&b.why)R.bubble(CX0-170,ROWY-300,b.why,COL.ink)}
    ctx.restore();R.drawMotes(this.motes,BB.paused?0:Math.min(.05,BB.dt||.016),t);BB.drawParts();
    this.drawHUD();BB.captionBox();
    if(this.state==='play'&&this.ri===0&&t-this.cardT<2.6)BB.titleCard('ROOM 3: PACKING STATION','Static Jr. destroyed the orders. Pack new ones!',(t-this.cardT)/2.6);
    if(this.state==='end')this.drawEnd();
    if(BB.paused)BB.pauseOverlay(howTo,()=>this.resume())}
  drawBelt(){// ambient: little parcels ride the painted back conveyor (only where the chute doesn't cover it)
    if(!BB.q)return;const y=388;/* v12.6: mint-bevel belt with chrome rollers + shaded cardboard parcels (matches the mine conveyor) */
    const segs=[[0,CX0-40],[CX0+NB*CW+40,W]];for(const[a0,a1]of segs){if(a1<=a0)continue;BB.rrect(a0,y,a1-a0,18,4,BB.lg(y,y+18,['#bff0e0','#6fbca5','#2f6b5c']),'rgba(20,30,28,.9)',2);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(a0+2,y+2,a1-a0-4,2);
      ctx.save();ctx.beginPath();ctx.rect(a0,y,a1-a0,18);ctx.clip();for(let rx=a0-40+((this.belt*.6)%40);rx<a1;rx+=40){const g=ctx.createLinearGradient(0,y+6,0,y+16);g.addColorStop(0,'#f4f8f7');g.addColorStop(.5,'#8e9a98');g.addColorStop(1,'#3a4442');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(rx,y+11,9,5,0,0,7);ctx.fill()}ctx.restore()}
    for(let i=0;i<6;i++){const x=((this.belt+i*330)%1980)-60;if(x>CX0-110&&x<CX0+NB*CW+50)continue;
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x+34,y+1,36,5,0,0,7);ctx.fill();
      BB.rrect(x,y-46,64,46,5,BB.lg(y-46,y,['#e2a868','#b77a3e','#8a5426']),'#4a2e12',2);
      ctx.fillStyle='rgba(255,240,210,.35)';ctx.fillRect(x+2,y-44,60,4);ctx.fillStyle='rgba(60,30,10,.25)';ctx.fillRect(x+44,y-44,18,42);
      ctx.fillStyle='rgba(240,220,170,.75)';ctx.fillRect(x+27,y-46,10,46);ctx.fillStyle='rgba(90,60,30,.6)';ctx.font="9px 'Lilita One'";ctx.fillText('♪',x+8,y-10)}}
  drawPallet(){const t=BB.t,out=this.state==='ship'?ease.inOut(clamp((t-this.st-.8)/1.6,0,1))*1300:0,inn=this.palletIn?(1-ease.out(clamp((t-this.palletIn)/.6,0,1)))*-900:0;
    ctx.save();ctx.translate(out+inn,0);
    // wooden pallet
    const y=ROWY+CH;for(let i=0;i<NB;i++)BB.rrect(CX0+4+i*CW,y-4,CW-8,16,4,BB.lg(y-4,y+12,['#d6b07a','#9a6e3a']),'#5a3a1a',2);
    // placed crates
    const blink=this.blink&&t-this.blink<1.2&&Math.sin((t-this.blink)*18)>0;
    for(let c=0;c<NB;c++)if(!this.cells[c]){BB.rrect(CX0+c*CW+8,ROWY+6,CW-16,CH-12,12,blink?'rgba(255,224,102,.35)':'rgba(255,255,255,.05)',blink?COL.yellow:'rgba(255,255,255,.18)',3);BB.ctext(String(c+1),CX0+c*CW+CW/2,ROWY+CH/2,52,blink?COL.yellow:'rgba(255,255,255,.18)')}
    for(const p of this.placed){const w=R.BEATS[p.k],sq=Math.max(0,1-(t-p.t)/.25)*.12;ctx.save();ctx.translate(CX0+p.col*CW+w*CW/2,ROWY+CH);ctx.scale(1+sq,1-sq);R.crateDraw(p.k,-w*CW/2+6,-CH,w*CW-12,CH);ctx.restore()}
    // lock clamps + green light sweep
    if(this.state==='lock'||this.state==='play2'||this.state==='ship'){const k=ease.back(clamp((t-(this.st||t))/.3,0,1));for(const x of [CX0-26,CX0+NB*CW+26]){BB.rrect(x-18,ROWY+10,36,CH-20,8,BB.lg(ROWY,ROWY+CH,['#ffe680','#c8961a']),COL.ink,3)}
      if(this.state==='lock'){const sw=(t-this.st)/1.2;for(let c=0;c<NB;c++){const l=clamp(1-Math.abs(sw*NB-c-.5),0,1);if(l>0&&BB.q)BB.glow(CX0+c*CW+CW/2,ROWY+CH/2,120,'rgba(110,230,120,A)',l*.5)}}
      if(this.state==='ship'){BB.rrect(CX0+20,ROWY-26,NB*CW-40,30,8,'#e8e2cd',COL.ink,3);BB.text('SEALED',W/2,ROWY-11,24,'#c0392b')}}
    ctx.restore()}
  drawChuteContents(){const cu=this.cur,t=BB.t;if(!cu||this.state!=='play')return;const w=R.BEATS[cu.k],cw=w*CW-12;
    ctx.save();ctx.beginPath();ctx.rect(CX0,CTOP-20,NB*CW,ROWY+CH-CTOP+20);ctx.clip();
    for(const a of this.air){if(a===cu)continue;const aw=R.BEATS[a.k]*CW-12;ctx.save();ctx.globalAlpha=.82;R.crateDraw(a.k,a.x+6,a.y,aw,CH);ctx.restore();BB.rrect(a.x+6+aw/2-58,a.y-38,116,30,10,'rgba(12,28,26,.85)',COL.teal2,2);BB.text('TAP ME',a.x+6+aw/2,a.y-23,18,'#fff')}
    // ghost on the pallet + guide line
    let fit=true;for(let i=0;i<w;i++)if(this.cells[cu.col+i])fit=false;const gx=CX0+cu.col*CW+6;
    BB.rrect(gx,ROWY+6,cw,CH-12,12,fit?'rgba(110,230,120,.18)':'rgba(230,80,70,.22)',fit?'rgba(110,230,120,.8)':'#e65046',3);
    ctx.setLineDash([10,12]);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cu.x+cw/2+6,cu.y+CH);ctx.lineTo(cu.x+cw/2+6,ROWY);ctx.stroke();ctx.setLineDash([]);
    const wob=Math.sin(t*3)*.02;ctx.save();ctx.translate(cu.x+6+cw/2,cu.y+CH/2);ctx.rotate(wob);R.crateDraw(cu.k,-cw/2,-CH/2,cw,CH);if(this.air.length>1){ctx.save();ctx.strokeStyle=COL.yellow;ctx.lineWidth=6;ctx.strokeRect(-cw/2-5,-CH/2-5,cw+10,CH+10);ctx.restore()}if(cu.decoy){ctx.save();ctx.strokeStyle='#e65046';ctx.lineWidth=6;ctx.setLineDash([14,10]);ctx.strokeRect(-cw/2-4,-CH/2-4,cw+8,CH+8);ctx.restore();BB.plaque(0,-CH/2-30,170,40,'DECOY! SWAP IT',18,'#e65046')}ctx.restore();
    ctx.restore();
    // column tap targets (big, Smartboard friendly)
    for(let c=0;c<NB;c++){const on=c>=cu.col&&c<cu.col+w;BB.rrect(CX0+c*CW+8,CTOP-44,CW-16,34,10,on?COL.yellow:'rgba(255,255,255,.12)',on?COL.ink:null,2);BB.text(String(c+1),CX0+c*CW+CW/2,CTOP-27,26,on?COL.ink:'#fff')}}
  drawNext(){const t=BB.t;BB.panel(NEXTP.x,NEXTP.y,NEXTP.w,NEXTP.h,30);BB.well(NEXTP.x+16,NEXTP.y+16,NEXTP.w-32,NEXTP.h-32,22);BB.text('NEXT',NEXTP.x+NEXTP.w/2,NEXTP.y+52,40,COL.yellow,{font:'Rammetto One',stroke:6});
    const sw=this.swapT&&t-this.swapT<.3?1+.15*Math.sin((t-this.swapT)/.3*Math.PI):1;
    this.q.slice(0,3).forEach((k,i)=>{const w=R.BEATS[k],cw=Math.min(260,w*62+20),h=i?64:84,s=i?1:sw;ctx.save();ctx.translate(NEXTP.x+NEXTP.w/2,NEXTP.y+140+i*104);ctx.scale(s,s);ctx.globalAlpha=i?.75:1;R.crateDraw(k,-cw/2,-h/2,cw,h,{tag:i===0});ctx.restore();
      if(i===0&&this.prank&&this.prank.ph==='wait'){ctx.save();ctx.strokeStyle='#e65046';ctx.lineWidth=5;ctx.setLineDash([12,8]);ctx.strokeRect(NEXTP.x+30,NEXTP.y+90,NEXTP.w-60,100);ctx.restore()}});
    const can=this.state==='play'&&this.cur;
    BB.button(NEXTP.x,NEXTP.y+NEXTP.h+20,NEXTP.w,96,'SWAP',{size:44,id:'swap',disabled:!can||!this.q.length,onClick:()=>this.swap()});
    BB.button(NEXTP.x,NEXTP.y+NEXTP.h+130,NEXTP.w,130,'DROP',{style:'green',size:64,id:'drop',disabled:!can,onClick:()=>this.drop()});
    BB.rrect(NEXTP.x+20,NEXTP.y+NEXTP.h+276,NEXTP.w-40,56,28,'rgba(12,28,26,.85)',COL.teal2,3);BB.text('BEATS LEFT: '+this.left(),NEXTP.x+NEXTP.w/2,NEXTP.y+NEXTP.h+305,30,this.blink&&t-this.blink<1.2?COL.yellow:'#fff',{stroke:4})}
  drawOrder(){const Rd=this.Rd;if(!Rd)return;const x=50,y=300,w=520,h=300;ctx.save();ctx.translate(x,y);ctx.rotate(-.02);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=24;ctx.shadowOffsetX=6;ctx.shadowOffsetY=12;BB.rrect(0,0,w,h,10,BB.lg(0,h,['#fffaf0','#f1e8d2','#ddd0b2']));ctx.restore();BB.R.paper(0,0,w,h);BB.rrect(0,0,w,h,10,null,'rgba(110,95,70,.6)',2);{const lg=ctx.createRadialGradient(w*.3,-30,10,w*.3,-30,w);lg.addColorStop(0,'rgba(255,236,180,.2)');lg.addColorStop(1,'rgba(255,236,180,0)');ctx.fillStyle=lg;ctx.fillRect(0,0,w,h)}BB.rrect(0,0,w,50,10,'#e65046');ctx.fillStyle='#e65046';ctx.fillRect(0,28,w,22);
    BB.text('ORDER #'+(this.ri+1)+(this.parts&&this.parts.length>1?'  \u2022  PALLET '+(this.part+1)+' of '+this.parts.length:''),w/2,26,26,'#fff',{stroke:3,maxW:w-24});BB.text(Rd.txt,w/2,80,Rd.txt.length>30?22:26,'#5a5040',{maxW:w-30});
    if(Rd.mode==='match'){let b=0;const cw=(w-40)/NB;for(const k of this.pcode){const n=R.BEATS[k],xx=20+b*cw,ww=n*cw;const done=this.cells[b]===k;ctx.strokeStyle=done?'#3fb45a':'rgba(0,0,0,.18)';ctx.lineWidth=done?4:2;ctx.strokeRect(xx+3,110,ww-6,140);
        R.glyph(k,xx+ww/2,215,Math.min(k==='s'?10:12,ww/(k==='s'?6.4:k==='e'?4.6:k==='w'?2.6:2.4)),COL.ink);BB.text(R.SAY[k],xx+ww/2,270,NB>6?16:20,'#5a5040',{maxW:ww-4});b+=n}}
    else{BB.text(Rd.mode==='limited'?'Every crate must fit!':'Any crates that add up to '+NB,w/2,150,26,'#5a5040');const bw=(w-60)/NB;for(let i=0;i<NB;i++){BB.rrect(30+i*bw,190,bw-14,60,10,this.cells[i]?'#9ff09a':'#eee8d6','#8a806b',2);BB.ctext(this.cells[i]?'\u2713':String(i+1),30+i*bw+(bw-14)/2,220,30,'#5a5040','Lilita One')}}
    if(this.ri===2&&BB.t-this.palletIn<3){ctx.globalAlpha=1-(BB.t-this.palletIn)/3;BB.text('TORN BY STATIC JR. ... fixed!',w/2,h-18,20,'#c0392b')}
    ctx.restore()}
  drawPB(){const p=this.pb;if(!p)return;const now=BB.ac.currentTime;for(const n of p.notes){const on=now>=n.t&&now<n.t+n.n*p.spb,x=CX0+n.col*CW+4,w=n.n*CW-8;if(!on)continue;const a=1-(now-n.t)/(n.n*p.spb)*.5;
      ctx.save();ctx.globalAlpha=a;ctx.shadowColor='#ffe066';ctx.shadowBlur=!BB.q?0:30;BB.rrect(x,ROWY-4,w,CH+8,14,'rgba(255,230,102,.35)','#ffe066',6);ctx.restore()}
    BB.plaque(CX0+NB*CW/2,ROWY-70,360,52,'\u266A PLAYING YOUR RHYTHM',22,COL.teal2||'#2aa198')}
  drawRush(){const r=this.rush,st=this.stars||0;const x=60,y=178,w=500,h=86;
    if(r){const left=this.rushLeft(),f=left/r.lim,live=!r.done&&left>0;BB.rrect(x,y,w,h,18,'rgba(12,28,26,.88)',live?'#e65046':COL.teal2,4);
      BB.text(r.done&&left>0?'\u2605 BONUS STAR!':live?'RUSH ORDER':'RUSH OVER: keep packing!',x+20,y+28,24,live?'#ffb3a8':COL.yellow,{align:'left',stroke:3});
      BB.text(Math.ceil(left)+' beats',x+w-20,y+28,24,'#fff',{align:'right',stroke:3});BB.rrect(x+20,y+50,w-40,20,10,'#2d4744');if(f>0)BB.rrect(x+20,y+50,(w-40)*f,20,10,f<.25?'#e65046':'#ffe066')}
    else if(st){BB.rrect(x,y,w,60,18,'rgba(12,28,26,.88)',COL.teal2,4);BB.text('BONUS STARS: '+'\u2605'.repeat(st),x+w/2,y+30,26,COL.yellow,{stroke:3})}}
  capPos(){return this.state==='clap'&&this.cb?{y:250,maxW:1140}:{y:H-114,maxW:1140}}
  drawHUD(){const t=BB.t;BB.panel(40,24,560,130,30);BB.text('ORDERS PACKED',70,58,32,COL.yellow,{align:'left',stroke:4});BB.text(`${this.packed} of ${ROUNDS.length}`,70,104,30,'#fff',{align:'left',font:'Rammetto One',stroke:4});
    for(let i=0;i<ROUNDS.length;i++)BB.rrect(330+i*42,60,32,52,9,i<this.packed?BB.lg(60,112,['#a6f5ae','#3fb45a']):'#2d4744','#fff',3);
    BB.pauseBtn(()=>this.pause());
    if(this.state==='intro')BB.button(W-300,H-130,260,100,'SKIP INTRO',{size:36,id:'skip',onClick:()=>this.skipIntro()});
    else{BB.micMeter(40,H-150);BB.overrideBtn(()=>this.manualOverride(),{pop:this.ovPop&&t-this.ovPop<.3?1.08:1})}
    if(this.cb&&this.state==='clap')this.cb.draw(W/2,H-90);
    if(this.cb&&this.cb.few&&t-this.cb.few<1.2)R.bubble(W/2,H-300,'Everyone together!',COL.ink)}
  drawEnd(){const t=BB.t-this.st;if(t<.4)return;const k=ease.back(clamp((t-.4)/.6,0,1));ctx.fillStyle=`rgba(8,18,17,${.5*clamp(t,0,1)})`;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(W/2,360);ctx.scale(k,k);BB.panel(-600,-260,1200,520,44);
    BB.text('ROOM 3 COMPLETE!',0,-170,72,'#fff',{font:'Rammetto One',stroke:9});
    R.crateDraw('h',-440,-100,300,120);R.crateDraw('q',-120,-100,140,120);R.crateDraw('e',40,-100,140,120);R.crateDraw('s',200,-100,140,120);R.crateDraw('r',360,-100,100,120,{tag:false});
    BB.text(ROUNDS.length+' orders packed and sealed!',0,80,40,COL.yellow,{stroke:5});BB.text('Next: the LABEL ROOM!',0,150,36,'#fff',{stroke:5});ctx.restore();
    if(t>1.6){BB.button(W/2-520,700,480,130,'ROOM MAP',{style:'green',size:56,id:'tomap',onClick:()=>BB.roomDone('packing')});
      BB.button(W/2+40,700,480,130,'PLAY AGAIN',{size:50,id:'again',onClick:()=>BB.go(new PackingRoom())})}}
}
BB.PackingRoom=PackingRoom;
})();
