// Room 5: DELIVERY SHOWDOWN (v14.1, teacher-approved finale). Design: research/delivery_room.md
// Static Jr. boss fight. Each box shows a rhythm; the class claps it back (shared ClapBack -> clap96 detector, MANUAL OVERRIDE w/o mic)
// to THROW the box at him. Every hit drops the box into the truck (truck fill = progress). He fights back with static:
// bolts, screen-fuzz (rhythm stays readable), a shield (perfect clap breaks it) and his face box (drag onto his head = BONK).
// Never stuck: one retry, then Sprocket's assist throw moves on. Ending: he's stuffed in the last box, RETURN TO SENDER, truck drives off.
'use strict';
(()=>{let ctx=BB.ctx;BB._sw.push(g=>ctx=g);const COL=BB.COL,W=BB.W,H=BB.H,{clamp,lerp,ease}=BB,R=BB.R;
BB.VO_LINES=(BB.VO_LINES||[]).concat([
 ['dl_intro',"It's Static Jr.! Clap each box's rhythm to throw it at him, and fill the delivery truck!",'sprocket'],
 ['dl_shield',"He put up a static shield! Only a perfect clap can break it!",'sprocket'],
 ['dl_phase2',"He's getting faster! Keep reading carefully!",'sprocket'],
 ['dl_phase3',"Last few boxes! He's going wild!",'sprocket'],
 ['dl_face',"He dropped his face box! Drag it onto his head!",'sprocket'],
 ['dl_assist',"I'll help with that one! Next box!",'sprocket'],
 ['jr_boss',"Hee hee! You'll never deliver these boxes!",'jr'],
 ['jr_nofair',"No fair! Hey, what are you doing? Put me down!",'jr'],
 ['dl_done',"Return to sender! The truck is full! Level four complete!",'sprocket'],
]);
const TOTAL=8,POOL=[['q','e','r','h'],['q','e','r','h'],['q','e','r','h','s'],['q','e','r','h','s'],['q','e','r','h','s'],['q','e','r','h','s'],['q','e','r','h','s'],['q','e','r','h','s']];
const SHIELD=[2,5,7],FACE=[3,6],JR={x:1430,y:540},LCH={x:300,y:760},TRK={x:1110,y:560};
const howTo={title:'DELIVERY SHOWDOWN: beat Static Jr.!',steps:['Each box shows a rhythm. Listen, then clap it back.','A good clap THROWS the box at Static Jr.','Every hit drops a box into the truck. Fill it up!','Shield up? Only a PERFECT clap breaks it.','Face box? Drag it onto his head to BONK him.','No mic? Tap MANUAL OVERRIDE when they nail it.'],
  words:'ta = 1   ti-ti = 2 quick   tika-tika = 4 quicker   ta-ah = 2 beats   rest = silent beat',example:(x,y,w,h,t)=>{}};
class DeliveryRoom{constructor(o={}){this.o=o}
  enter(){BB.groove.start(100,'pack');this.n=this.o.startAt||0;this.hp=TOTAL-this.n;this.state='load';this.said={};this.bolts=[];this.fx=[];this.motes=R.motes(10);this.ph=0;this.jrK=null;
    R.loadImgs([['pack_blur','jpg']]).then(()=>{this.static=R.bake(g=>this.bake(g));this.state='intro';this.st=BB.t;BB.say('jr_boss');this.voEnd=BB.t+3.2;setTimeout(()=>BB.scene===this&&BB.say('dl_intro'),2600)});BB.mic.take();window.__dl=this}
  exit(){BB.paused=false;BB.fuzz=0}
  bake(g){const V=BB.V2;if(V.pack_blur){g.filter='brightness(.35) saturate(.6)';g.drawImage(V.pack_blur,0,0,W,H);g.filter='none'}
    const sky=g.createLinearGradient(0,0,0,240);sky.addColorStop(0,'#0b1030');sky.addColorStop(1,'#1d2550');g.fillStyle=sky;g.fillRect(0,0,W,240);
    for(let i=0;i<90;i++){g.fillStyle=`rgba(255,255,240,${.3+Math.random()*.6})`;g.beginPath();g.arc(Math.random()*W,Math.random()*220,Math.random()*2+.5,0,7);g.fill()}
    const wall=g.createLinearGradient(0,240,0,740);wall.addColorStop(0,'#3a4152');wall.addColorStop(1,'#272c38');g.fillStyle=wall;g.fillRect(0,240,W,500);
    for(let y=260;y<740;y+=46){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,y,W,3)}
    for(let i=0;i<3;i++){const x=150+i*600;g.fillStyle='#161a22';g.fillRect(x-12,330,444,410);for(let y=340;y<735;y+=30){const lg=g.createLinearGradient(0,y,0,y+28);lg.addColorStop(0,'#6d7688');lg.addColorStop(1,'#4b5263');g.fillStyle=lg;g.fillRect(x,y,420,27)}
      g.fillStyle='#ffe9a8';g.fillRect(x+170,258,80,22);const cone=g.createRadialGradient(x+210,280,10,x+210,520,380);cone.addColorStop(0,'rgba(255,236,170,.38)');cone.addColorStop(1,'rgba(255,236,170,0)');g.fillStyle=cone;g.beginPath();g.moveTo(x+175,280);g.lineTo(x-60,740);g.lineTo(x+480,740);g.lineTo(x+245,280);g.fill();
      g.fillStyle='#ffe066';g.font='34px "Rammetto One"';g.textAlign='center';g.fillText('DOCK '+(i+1),x+210,316)}
    const fl=g.createLinearGradient(0,740,0,H);fl.addColorStop(0,'#3b3f47');fl.addColorStop(1,'#1c1e23');g.fillStyle=fl;g.fillRect(0,740,W,H-740);
    for(let x=0;x<W;x+=80){g.fillStyle=(x/80)%2?'#ffe066':'#1e2b29';g.fillRect(x,740,80,22)}g.fillStyle='rgba(255,255,255,.35)';for(let x=40;x<W;x+=220)g.fillRect(x,960,120,10);
    const vg=g.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H*1.1);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.5)');g.fillStyle=vg;g.fillRect(0,0,W,H)}
  phase(){return this.hp<=2?2:this.hp<=5?1:0}
  bpm(){return[96,104,112][this.phase()]}
  newBox(){const p=this.phase();if(p>this.ph){this.ph=p;BB.say(p===1?'dl_phase2':'dl_phase3');BB.sfx.glitch();BB.shake(8);this.phT=BB.t}
    this.seq=BB.LabelGen?BB.LabelGen.genRhythm(POOL[this.n],this.last,4):['q','e','q','r'];this.last=this.seq.join('');this.tries=0;this.cb=null;this.shield=SHIELD.includes(this.n)?2:0;this.thr=null;
    this.state='show';this.st=BB.t;this.voEnd=Math.max(this.voEnd||0,BB.t+1.2);this.atk=BB.t+2+Math.random()*2;
    if(this.shield){this.shT=BB.t;BB.sfx.zap();if(!this.said.sh){this.said.sh=1;this.voEnd=BB.t+(BB.say('dl_shield',{overlap:true})||2.5)}}
    if(FACE.includes(this.n)&&!this.face){this.face={x:JR.x-420,y:260,t:BB.t,vy:0};BB.sfx.boing();if(!this.said.f){this.said.f=1;BB.say('dl_face',{overlap:true})}}}
  startClap(){this.state='clap';this.st=BB.t;this.cb=new R.ClapBack(this.seq,{bpm:this.bpm(),onDone:sc=>this.clapDone(sc)})}
  clapDone(sc){this.cb=null;this.tries++;const need=this.shield===2?.999:.6;
    if(sc>=need){if(this.shield){this.shield=0;BB.sfx.crack();BB.burst(JR.x,JR.y-140,40,{cols:['#7ef0ff','#fff'],kind:'star',size:12,speed:900,g:200})}this.throwBox(false);return}
    if(this.shield===2&&sc>=.6){this.shield=1;BB.sfx.crack();BB.caption={txt:'Crack! Almost perfect. The shield is weaker now: one more good clap!',who:'sprocket',until:BB.t+2.6,start:BB.t}}
    if(this.tries>=2){this.shield=0;BB.say('dl_assist',{overlap:true});this.throwBox(true);return}
    this.dodge();this.state='wait';this.st=BB.t;this.voEnd=BB.t+1.6}
  dodge(){this.jrK={t:BB.t,ph:'dodge'};BB.sfx.boing();BB.say(Math.random()<.5?'jr_giggle':'jr_catch',{overlap:true,nocap:true});this.fuzzT=BB.t;this.fuzzD=.6}
  throwBox(assist){this.state='throw';this.st=BB.t;this.thr={assist,seq:this.seq};BB.sfx.whoosh()}
  landHit(){this.hp--;this.n++;this.jrK={t:BB.t,ph:'hit'};BB.sfx.bonk();BB.shake(6);BB.say('jr_oof',{overlap:true,nocap:true});BB.burst(JR.x,JR.y-150,24,{cols:['#ffe066','#fff','#ff8adf'],kind:'star',size:14,speed:700,g:300});
    this.fx.push({k:'bonk',t:BB.t});this.drop={t:BB.t}}
  manualOverride(){if(BB.t-(this.lastOv||0)<.5)return;this.lastOv=BB.t;this.ovPop=BB.t;if(this.cb)this.cb.override()}
  pause(){BB.paused=true;BB.ac.suspend()}
  resume(){BB.paused=false;BB.ensureMic()}
  // static attacks (cosmetic + brief fuzz; never hides the rhythm for long)
  attack(){const p=this.phase(),r=Math.random();this.jrK={t:BB.t,ph:'zap'};
    if(r<.55||!this.cb){const n=1+p;for(let i=0;i<n;i++)this.bolts.push({x:JR.x,y:JR.y-170,tx:300+Math.random()*(W-600),ty:200+Math.random()*500,t:BB.t+i*.18});BB.sfx.zap()}
    else{this.fuzzT=BB.t;this.fuzzD=.35+.1*p;BB.sfx.glitch();if(!this.said.x){this.said.x=1;BB.say('jr_extra',{overlap:true,nocap:true})}}
    this.atk=BB.t+[5,3.6,2.6][p]+Math.random()*2}
  update(dt){if(BB.keys.includes('p')){this.pause();return}if(BB.keys.includes(' '))this.manualOverride();const t=BB.t-this.st;
    if(this.state==='intro'&&t>6)this.newBox();
    if(this.state==='show'&&t>1.4&&BB.t>this.voEnd&&!this.face)this.startClap();
    if(this.state==='wait'&&BB.t>this.voEnd&&!this.face)this.startClap();
    if(this.state==='throw'&&t>.9&&!this.thrHit){this.thrHit=1;this.landHit()}
    if(this.state==='throw'&&t>2.2){this.thrHit=0;if(this.hp<=0){this.state='end';this.st=BB.t;this.cb=null;BB.sfx.glitch();BB.say('jr_nofair')}else this.newBox()}
    if(this.state==='end'){if(t>2.2&&!this.stamped){this.stamped=1;BB.sfx.thunk();BB.shake(10);BB.say('dl_done',{overlap:true})}if(t>3.6&&!this.vroom){this.vroom=1;BB.sfx.motor&&BB.sfx.motor()}if(t>7&&!this.cel){this.cel=1;BB.celebrate({next:'ROOM MAP'})}}
    if((this.state==='clap'||this.state==='show'||this.state==='wait')&&BB.t>this.atk&&this.state!=='end')this.attack();
    this.bolts=this.bolts.filter(b=>BB.t-b.t<1.1);
    const f=this.face;if(f&&!f.drag){f.vy=Math.min(f.vy+dt*120,160);f.y+=f.vy*dt;if(f.y>900){this.face=null;BB.sfx.glitch();BB.sfx.pop();this.fuzzT=BB.t;this.fuzzD=.8;this.jrK={t:BB.t,ph:'laugh'};BB.say('jr_giggle',{overlap:true,nocap:true});BB.caption={txt:'Missed him! A little static fuzz... keep going!',who:'sprocket',until:BB.t+2.2,start:BB.t};this.voEnd=BB.t+1}}
    BB.fuzz=this.fuzzT&&BB.t-this.fuzzT<this.fuzzD?1:0;
    if(this.cb)this.cb.update(dt);else BB.mic.take()}
  pdown(p){const f=this.face;if(f&&!f.drag&&Math.abs(p.x-f.x)<110&&Math.abs(p.y-f.y)<110){f.drag={id:p.id,dx:p.x-f.x,dy:p.y-f.y};BB.sfx.pop();return true}return false}
  pmove(p){const f=this.face;if(f&&f.drag&&f.drag.id===p.id){f.x=clamp(p.x-f.drag.dx,80,W-80);f.y=clamp(p.y-f.drag.dy,40,H-60)}}
  pup(p){const f=this.face;if(f&&f.drag&&(!p||f.drag.id===p.id)){f.drag=null;if(Math.hypot(f.x-JR.x,f.y-(JR.y-200))<190){this.face=null;this.jrK={t:BB.t,ph:'hit'};BB.sfx.bonk();BB.shake(5);BB.say('jr_oof',{overlap:true,nocap:true});this.fx.push({k:'bonk',t:BB.t});this.atk=BB.t+6;
    BB.burst(JR.x,JR.y-200,20,{col:COL.yellow,kind:'star',size:14,g:300});BB.caption={txt:'BONK! He\'s dizzy: no static for a bit!',who:'sprocket',until:BB.t+2.4,start:BB.t};this.voEnd=BB.t+1.2}}}
  drawTruck(x,y,fill,o={}){ctx.save();ctx.translate(x,y);R.shadow(ctx,320,255,380,.5);
    BB.rrect(0,0,480,240,18,BB.lg(0,240,['#f4f0e4','#c9c3b2']),COL.ink,6);BB.rrect(14,54,452,172,12,'#2a2f3a','#1a1d24',3);
    for(let i=0;i<fill;i++){const c=i%4,r=1-(i/4|0),bx=24+c*110,by=62+r*82;BB.rrect(bx,by,100,76,6,BB.lg(by,by+76,['#d8a86a','#a8743c']),'#5a3a1e',3);ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(bx+40,by,20,76)}
    BB.rrect(0,0,480,46,14,'#d24a3c',COL.ink,5);BB.text('BEAT BOTS EXPRESS',240,24,30,'#fff',{font:'Rammetto One',stroke:4,maxW:440});
    BB.rrect(480,80,170,160,20,BB.lg(80,240,['#6fc7b4','#3f8f84']),COL.ink,6);BB.rrect(510,102,100,64,10,'#bfe9ff',COL.ink,4);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(520,108,26,50);
    const sp=o.spin||0;for(const wx of[110,370,570]){ctx.save();ctx.translate(wx,246);ctx.rotate(sp);ctx.fillStyle='#1e2b29';ctx.beginPath();ctx.arc(0,0,42,0,7);ctx.fill();ctx.fillStyle='#9aa4a8';ctx.beginPath();ctx.arc(0,0,17,0,7);ctx.fill();ctx.fillStyle='#1e2b29';ctx.fillRect(-3,-17,6,12);ctx.restore()}ctx.restore()}
  drawBox(x,y,s,seq,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);R.shadow&&0;
    BB.rrect(-200,-120,400,240,14,BB.lg(-120,120,['#e2b272','#b07a40']),'#5a3a1e',5);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-22,-120,44,240);
    BB.rrect(-180,-70,360,150,10,'#fffaf0','#d24a3c',4);BB.text('SHIP TO: STATIC JR.',0,-94,20,'#5a3a1e',{stroke:0});
    if(seq){const bw=86,bh=130,U=R.noteSize('q',bw-6,bh);let b=0;for(const k of seq){const w=R.BEATS[k]*bw;R.tile(k,-172+b*bw+3,-62,w-6,bh,{ns:Math.min(U,R.noteSize(k,w-6,bh)),shadow:false});b+=R.BEATS[k]}}ctx.restore()}
  drawJr(){const k=this.jrK?BB.t-this.jrK.t:9,ph=this.jrK&&this.jrK.ph,p=this.phase();let x=JR.x,y=JR.y,rot=0,o={flip:true,glitch:p*.15};
    if(ph==='dodge'&&k<1){x+=Math.sin(k*Math.PI)*170;o.lift=Math.sin(k*Math.PI)*60}
    if(ph==='hit'&&k<1.8){o.dizzy=true;o.glitch=.5;rot=Math.sin(k*20)*.12*(1-k/1.8)}
    if(ph==='zap'&&k<.5)o.glitch=.8;
    x+=Math.sin(BB.t*(2+p))*14*(1+p);
    BB.staticJr(x,y,190,Object.assign(o,{rot}));
    if(this.shield){const a=.35+.15*Math.sin(BB.t*7),r=190;ctx.save();ctx.globalAlpha=this.shield===1?a*.55:a;ctx.strokeStyle='#7ef0ff';ctx.lineWidth=8;ctx.beginPath();ctx.arc(x,y-120,r,0,7);ctx.stroke();ctx.fillStyle='rgba(126,240,255,.14)';ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=3;for(let i=0;i<7;i++){const a0=Math.random()*7;ctx.beginPath();ctx.moveTo(x+Math.cos(a0)*r,y-120+Math.sin(a0)*r);ctx.lineTo(x+Math.cos(a0+.2)*(r-30),y-120+Math.sin(a0+.2)*(r-30));ctx.stroke()}ctx.restore();
      BB.rrect(x-150,y-345,300,44,14,'rgba(10,30,40,.85)','#7ef0ff',3);BB.text(this.shield===2?'SHIELD: PERFECT CLAP!':'SHIELD CRACKED!',x,y-323,22,'#bff8ff',{stroke:0})}
    let bub=null;if(ph==='dodge'&&k<1.6)bub='missed me! hee hee!';else if(ph==='laugh'&&k<1.6)bub='hee hee hee!';else if(ph==='hit'&&k<1.4)bub='OOF!';else if(this.state==='intro')bub="you'll never deliver these!";
    if(bub&&!this.shield)R.bubble(x-300,y-250,bub)}/* v14.1.1 beside his head, clear of the HP panel */
  drawHP(){const x=JR.x-190,y=84,w=380,f=this.hp/TOTAL;BB.rrect(x-10,y-60,w+20,130,24,'rgba(12,16,28,.85)','#ff8adf',3);BB.text('STATIC JR.',x+w/2,y-24,24,'#ffd6f4',{stroke:0});
    BB.rrect(x,y,w,28,10,'#2a2233',null,0);if(f>0)BB.rrect(x,y,w*f,28,10,BB.lg(y,y+28,['#ff9ad8','#c03a8e']),null,0);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x,y,w,28);for(let i=1;i<TOTAL;i++){ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(x+i*w/TOTAL-1,y,2,28)}}
  drawLauncher(){const x=LCH.x,y=LCH.y,k=this.state==='throw'?BB.t-this.st:9,rc=k<.25?Math.sin(k/.25*Math.PI)*18:0;
    if(BB.IMG.sprocket){const im=BB.IMG.sprocket,h=210,w=h*im.width/im.height;ctx.drawImage(im,x-w/2-150,y-h+90,w,h)}
    ctx.save();ctx.translate(x-rc,y);ctx.rotate(-.5);BB.rrect(-30,-36,210,72,30,BB.lg(-36,36,['#c9d6de','#7d8c96']),COL.ink,5);for(let i=0;i<3;i++){ctx.strokeStyle='#ffe066';ctx.lineWidth=5;ctx.beginPath();ctx.arc(60+i*40,0,34,-1.2,1.2);ctx.stroke()}ctx.restore();
    BB.rrect(x-70,y-10,140,110,18,BB.lg(y-10,y+100,['#6c7a86','#3d4650']),COL.ink,5);BB.text('BOX LAUNCHER',x,y+122,20,'#fff',{stroke:4})}
  draw(){const t=BB.t,k=t-this.st;if(this.static)ctx.drawImage(this.static,0,0,W,H);else{ctx.fillStyle='#111';ctx.fillRect(0,0,W,H)}R.drawMotes(this.motes,BB.dt||.016,t);if(this.state==='load')return;
    const end=this.state==='end',dx=end?Math.max(0,k-3.6)**2*260:0,fill=Math.min(TOTAL,this.n);
    R.paint(ctx,()=>this.drawTruck(TRK.x+dx,TRK.y,fill,{spin:end?Math.max(0,k-3.6)*14:0}));
    if(!end){this.drawJr();this.drawHP()}
    else{// Jr. stuffed in the last box on the truck roof, RETURN TO SENDER stamp
      const bx=TRK.x+240+dx,by=TRK.y-90,pop=ease.out(clamp(k/1,0,1));ctx.save();ctx.translate(bx,by);
      ctx.save();ctx.beginPath();ctx.rect(-130,-300,260,300);ctx.clip();BB.staticJr(0,lerp(160,40,pop),150,{dizzy:true,glitch:.3,flip:true,noShadow:true});ctx.restore();
      BB.rrect(-130,-10,260,100,10,BB.lg(-10,90,['#e2b272','#b07a40']),'#5a3a1e',5);ctx.save();ctx.translate(-130,-10);ctx.rotate(-.5-Math.sin(t*9)*.08);BB.rrect(-90,-10,100,16,4,'#c9965a','#5a3a1e',3);ctx.restore();ctx.save();ctx.translate(130,-10);ctx.rotate(.5+Math.sin(t*9)*.08);BB.rrect(-10,-10,100,16,4,'#c9965a','#5a3a1e',3);ctx.restore();
      if(k<3.6)R.bubble(0,-230,'hey! put me down!');ctx.restore();
      if(k>2.2){const s=k<2.45?lerp(3,1,(k-2.2)/.25):1;ctx.save();ctx.translate(W/2-160+dx*.0,360);ctx.rotate(-.12);ctx.scale(s,s);ctx.globalAlpha=Math.min(1,(k-2.2)*6)*.92;ctx.strokeStyle='#d24a3c';ctx.lineWidth=14;ctx.strokeRect(-430,-90,860,180);ctx.strokeRect(-410,-70,820,140);BB.text('RETURN TO SENDER',0,8,78,'#d24a3c',{font:'Rammetto One',stroke:0});ctx.restore()}}
    R.paint(ctx,()=>this.drawLauncher());
    // current box: sits on the launcher pad, then flies at Jr.
    if(this.seq&&!end&&this.state!=='intro'){let bx=760,by=470,s=1,rot=0,show=this.seq;
      if(this.state==='show'){const e=ease.out(clamp(k/.6,0,1));by=lerp(-200,470,e)}
      if(this.state==='throw'){const u=clamp(k/.9,0,1);if(u<1){bx=lerp(760,JR.x,u);by=lerp(470,JR.y-150,u)-Math.sin(u*Math.PI)*260;s=lerp(1,.4,u);rot=u*6}else{const v=clamp((k-.9)/.8,0,1);const sl=this.n-1,c=sl%4,r=1-(sl/4|0);bx=lerp(JR.x,TRK.x+74+c*110,v);by=lerp(JR.y-150,TRK.y+100+r*82,ease.in?ease.in(v):v*v);s=lerp(.4,.25,v);rot=6+v*2;show=null}}
      if(!(this.state==='throw'&&k>1.7)){if(BB.fuzz){ctx.save();ctx.translate((Math.random()-.5)*14,0)}this.drawBox(bx,by,s,show,rot);if(BB.fuzz)ctx.restore()}}
    // static bolts fly at the screen
    for(const b of this.bolts){const u=(BB.t-b.t)/.7;if(u<0)continue;if(u<1){const x=lerp(b.x,b.tx,u),y=lerp(b.y,b.ty,u),sz=20+u*90;ctx.save();ctx.strokeStyle='#bff8ff';ctx.shadowColor='#7ef0ff';ctx.shadowBlur=24;ctx.lineWidth=4+u*8;ctx.beginPath();ctx.moveTo(x-sz,y-sz*.3);for(let i=0;i<5;i++)ctx.lineTo(x-sz+i*sz/2,y+(i%2?sz*.4:-sz*.4));ctx.stroke();ctx.restore()}
      else{const v=(u-1)/.57;ctx.save();ctx.globalAlpha=Math.max(0,1-v);ctx.fillStyle='#e8ffff';ctx.beginPath();ctx.arc(b.tx,b.ty,60+v*80,0,7);ctx.fill();BB.text('ZZT!',b.tx,b.ty,48,'#2a6f8a',{font:'Rammetto One',stroke:0});ctx.restore()}}
    for(const f of this.fx)if(f.k==='bonk'&&t-f.t<1)BB.text('BONK!',JR.x,JR.y-380-(t-f.t)*40,90,COL.yellow,{font:'Rammetto One',stroke:9});this.fx=this.fx.filter(f=>t-f.t<1);
    if(this.face){const f=this.face,s=95;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.drag?0:Math.sin(t*3)*.1);BB.rrect(-s,-s,s*2,s*2,16,BB.lg(-s,s,['#9b8fe0','#4b3f8f']),COL.ink,6);ctx.save();ctx.beginPath();ctx.roundRect(-s+5,-s+5,s*2-10,s*2-10,12);ctx.clip();BB.staticJr(0,s*1.25,s*2.1,{});ctx.restore();
      BB.rrect(-90,s+6,180,34,10,'rgba(12,28,26,.85)',COL.yellow,2);BB.text(f.drag?'DROP ON HIS HEAD!':'DRAG ME TO HIM!',0,s+23,18,'#fff',{maxW:170});ctx.restore();
      if(!f.drag){ctx.save();ctx.globalAlpha=.5+.4*Math.sin(t*8);ctx.strokeStyle=COL.yellow;ctx.lineWidth=6;ctx.setLineDash([14,10]);ctx.beginPath();ctx.moveTo(f.x,f.y-s);ctx.quadraticCurveTo((f.x+JR.x)/2,Math.min(f.y,JR.y)-260,JR.x,JR.y-230);ctx.stroke();ctx.restore()}}
    if(!end){BB.panel(40,24,560,130,30);BB.text('TRUCK LOAD  '+fill+' of '+TOTAL,70,58,30,COL.yellow,{align:'left',stroke:4});for(let i=0;i<TOTAL;i++)BB.rrect(70+i*62,84,50,40,8,i<fill?BB.lg(84,124,['#e2b272','#b07a40']):'#2d4744','#fff',3);
      if(this.phT&&t-this.phT<2.4)BB.text(this.ph===1?'PHASE 2: FASTER!':'PHASE 3: WILD STATIC!',W/2,200,64,'#ff8adf',{font:'Rammetto One',stroke:8})}
    BB.pauseBtn(()=>this.pause());BB.micMeter(40,H-150);if(this.cb){BB.overrideBtn(()=>this.manualOverride(),{pop:this.ovPop&&t-this.ovPop<.3?1.08:1});if(BB.fuzz){ctx.save();ctx.translate((Math.random()-.5)*10,(Math.random()-.5)*4)}this.cb.draw(W/2,H-90);if(BB.fuzz)ctx.restore()}
    // screen fuzz (brief, translucent: rhythm stays readable)
    if(BB.fuzz){ctx.save();ctx.globalAlpha=.22;for(let i=0;i<70;i++){ctx.fillStyle=Math.random()<.5?'#fff':'#7ef0ff';ctx.fillRect(Math.random()*W,Math.random()*H,40+Math.random()*260,2+Math.random()*5)}ctx.restore()}
    if(this.state==='intro'&&k<2.6)BB.titleCard('ROOM 5: DELIVERY SHOWDOWN','Clap the boxes. Beat Static Jr.!',k/2.6);
    if(BB.paused)BB.pauseOverlay(howTo,()=>this.resume())}}
BB.DeliveryRoom=DeliveryRoom})();
