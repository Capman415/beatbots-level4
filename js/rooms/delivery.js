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
 ['bb_treat',"Bonus round! Stand up, Rhythm Engineers! Dodge with your body, and attack by clapping! Nobody fails!",'sprocket'],
 ['bb_p1',"Phase one! Shake and freeze!",'sprocket'],['bb_p2',"Phase two! Duck and lean!",'sprocket'],['bb_p3',"Phase three! Jump and freeze!",'sprocket'],['bb_p4',"Phase four! Factory claps!",'sprocket'],['bb_p5',"Phase five! The clap back finale!",'sprocket'],
 ['bb_allegro',"Clap power up! Allegro means fast! Clap, clap, clap!",'sprocket'],
 ['bb_presto',"New word! Presto means very fast! Clap faster!",'sprocket'],
 ['bb_prestissimo',"Prestissimo! That means as fast as possible! Clap, clap, clap, clap!",'sprocket'],
 ['bb_blast',"Super beat blast!",'sprocket'],['bb_jump',"Everybody, jump!",'sprocket'],
 ['dl_done',"Return to sender! The truck is full! Level four complete!",'sprocket'],
]);
const TOTAL=8,POOL=[['q','e','r','h'],['q','e','r','h'],['q','e','r','h','s'],['q','e','r','h','s'],['q','e','r','h','s'],['q','e','r','h','s'],['q','e','r','h','s'],['q','e','r','h','s']];
/* v14.3.1 KO: beat 0.6 s @100 BPM. hits: t, side, kind */
/* v14.3.1 BRAIN BREAK boss battle (default): no notes, no scoring, no mic. Movement play-along on a steady 100 BPM (beat .6 s, bar 2.4 s)
   on the warm 'pack' groove. Part 1: Static Jr. sneaks (SHAKE SOFT), throws fuzz bombs (SHAKE LOUD, poof on the beat), FREEZE, DUCK/DODGE junk.
   Part 2: the class punches back: every called move lands a cardboard slapstick hit on him exactly on the beat -> EVERYBODY JUMP! -> RETURN TO SENDER.
   Old clap boss fight: ?boss=clap or teacher toggle (localStorage bbBoss='clap'). */
const KO_B=.6,KO_BAR=2.4,KO_T0=.6;
/* medley: 5 phases (~30-38 s each), each knocks one chunk off Static Jr.'s power bar (cosmetic, can't fail) */
const KB=(cue,ic,h,o={})=>Object.assign({cue,ic,h},o),FOUR=k=>[[0,k],[1,k],[2,k],[3,k]];
const SH=()=>KB('SHAKE! SHAKE! SHAKE!','loud',[],{mode:'dance'}),SOFT=()=>KB('SHAKE SOFT... shh!','soft',[],{mode:'sneak'}),
  FRZ=b=>KB('FREEZE! FUZZ BOMB!','freeze',[[b,'bomb']],{mode:'freeze'}),PH=(n,name)=>KB('PHASE '+n+': '+name,'ready',[],{count:1,phase:n}),
  CLR=()=>KB('SUPER BEAT BLAST!','clap',[[0,'chunk']],{clear:1}),
  TEMPI={allegro:{w:'ALLEGRO',def:'Allegro = fast!',bpm:125,inc:.25},presto:{w:'PRESTO',def:'PRESTO = very fast!',bpm:170,inc:.15,isNew:1},prestissimo:{w:'PRESTISSIMO',def:'PRESTISSIMO = as fast as possible!',bpm:210,inc:.1,isNew:1}},PWQ=['allegro','allegro','presto','presto','prestissimo'];let PWN=0;
const PWR=()=>{const tp=TEMPI[PWQ[Math.min(PWN++,4)]];return[KB(tp.def,'clap',[],{count:1,pwr:1,tp}),KB(tp.w+'! CLAP CLAP CLAP!','clap',[],{pwr:2,tp})]};
/* CORE RULE (v14.3.1): kids DODGE with their bodies (duck / lean / freeze / jump, mic ignored) and ATTACK ONLY BY CLAPPING.
   Attack bars: each beat fires a cardboard 'clap blast' gag at Static Jr. (always lands: nobody fails); every real clap the mic hears fires an extra CLAP! blast. */
const A_=(cue,h)=>KB(cue,'clap',h,{atk:1}),C4=k=>A_('CLAP ATTACK! ta ta ta ta!',FOUR(k)),CT=k=>A_('CLAP: ta ta ti-ti ta!',[[0,k],[1,k],[2,k],[2.5,k],[3,k]]),
  BOMBS=()=>KB('FUZZ BOMBS! FREEZE... then SHAKE!','freeze',[[1,'bomb'],[3,'bomb']],{mode:'throw'}),DK=()=>KB('DUCK!','duck',[[2,'junkT']],{mode:'throw'}),
  DL=()=>KB('LEAN LEFT!','L',[[2,'junkR']],{mode:'throw'}),DR=()=>KB('LEAN RIGHT!','R',[[2,'junkL']],{mode:'throw'}),JP=()=>KB('JUMP! (rolling tire!)','jump',[[2,'junkF']],{mode:'throw'});
const KO_BARS=[
 PH(1,'SHAKE & FREEZE'),SH(),FRZ(2),C4('L'),C4('R'),SOFT(),BOMBS(),CT('L'),FRZ(1),C4('stomp'),...PWR(),CLR(),
 PH(2,'DUCK & LEAN'),DK(),DL(),C4('R'),DR(),CT('L'),KB('DUCK, LEFT, RIGHT!','duck',[[1,'junkT'],[2,'junkR'],[3,'junkL']],{mode:'throw'}),C4('rain'),DL(),CT('R'),...PWR(),CLR(),
 PH(3,'JUMP & FREEZE'),JP(),C4('stomp'),FRZ(2),CT('rain'),JP(),DK(),A_('CLAP: ta-ah, ta-ah! BIG BOOMS!',[[0,'stomp'],[2,'stomp']]),BOMBS(),C4('L'),...PWR(),CLR(),
 PH(4,'FACTORY CLAPS'),DL(),A_('MINE: CLAP to swing the pickaxe!',FOUR('pick')),DK(),A_('PACKING: CLAP to pat the box!',FOUR('pat')),DR(),
  A_('LABEL: CLAP to STAMP!',[[0,'stamp'],[1,'stamp'],[2,'stamp'],[2.5,'stamp'],[3,'stamp']]),JP(),A_('DELIVERY: CLAP to push!',[[0,'push'],[2,'push']]),
  A_('ALL OF THEM: CLAP CLAP CLAP CLAP!',[[0,'pick'],[1,'pat'],[2,'stamp'],[3,'push']]),...PWR(),CLR(),
 PH(5,'CLAP BACK FINALE!'),C4('L'),C4('R'),BOMBS(),CT('L'),KB('DUCK! (it bounces back!)','duck',[[2,'zap']],{mode:'throw'}),A_('CLAP: ti-ti ti-ti ti-ti ta!',[[0,'L'],[.5,'R'],[1,'L'],[1.5,'R'],[2,'L'],[2.5,'R'],[3,'L']]),DL(),
  C4('stomp'),JP(),A_('CLAP CLAP CLAP CLAP!',[[0,'L'],[1,'R'],[2,'rain'],[3,'stomp']]),
  ...PWR(),KB('EVERYBODY GET LOW...','duck',[],{count:2}),KB('EVERYBODY JUMP!','jump',[[0,'big']])];
BB.KO_BARS=KO_BARS;KO_BARS.forEach(b=>{b.turn=b.mode?'jr':b.atk||b.pwr||b.clear?'us':''});const KO_PHASE_END=[];KO_BARS.forEach((b,i)=>b.clear&&KO_PHASE_END.push(KO_T0+i*KO_BAR));
const KO_HITS=[];KO_BARS.forEach((b,i)=>b.h.forEach(([bt,kind])=>KO_HITS.push([KO_T0+i*KO_BAR+bt*KO_B,kind])));
const KO_BIG=KO_T0+(KO_BARS.length-1)*KO_BAR,KO_CEL=KO_BIG+2.4,KO_ATK=k=>['bomb','junkT','junkL','junkR','junkF','zap'].includes(k);
const bossMode=()=>{try{const q=new URLSearchParams(location.search).get('boss');return q||localStorage.bbBoss||'move'}catch(e){return'move'}};BB.bossMode=bossMode;
const SHIELD=[2,5,7],FACE=[3,6],JR={x:1430,y:540},LCH={x:300,y:760},TRK={x:1110,y:560};
const howTo={title:'DELIVERY SHOWDOWN: beat Static Jr.!',steps:['Each box shows a rhythm. Listen, then clap it back.','A good clap THROWS the box at Static Jr.','Every hit drops a box into the truck. Fill it up!','Shield up? Only a PERFECT clap breaks it.','Face box? Drag it onto his head to BONK him.','No mic? Tap MANUAL OVERRIDE when they nail it.'],
  words:'ta = 1   ti-ti = 2 quick   tika-tika = 4 quicker   ta-ah = 2 beats   rest = silent beat',example:(x,y,w,h,t)=>{}};
class DeliveryRoom{constructor(o={}){this.o=o}
  enter(){BB.groove.start(100,'pack');this.n=this.o.startAt||0;this.hp=TOTAL-this.n;this.state='load';this.said={};this.bolts=[];this.fx=[];this.motes=R.motes(10);this.ph=0;this.jrK=null;
    R.loadImgs([['pack_blur','jpg'],['dock_bg','jpg'],['chip','png']]).then(()=>{this.static=R.bake(g=>this.bake(g));this.state='intro';this.st=BB.t;BB.say('jr_boss');this.voEnd=BB.t+3.2;setTimeout(()=>BB.scene===this&&!this.move&&BB.say('dl_intro'),2600)});this.move=bossMode()!=='clap';if(this.move)setTimeout(()=>BB.scene===this&&BB.say('bb_treat',{overlap:true}),2700);if(!this.move)BB.mic.take();window.__dl=this}
  exit(){BB.paused=false;BB.fuzz=0}
  bake(g){const V=BB.V2;if(V.dock_bg){/* v14.2 painted night dock (assets/v2/dock_bg.jpg); hazard stripe lifted to the old y=740 dock edge */g.drawImage(V.dock_bg,0,-90,W,H);g.drawImage(V.dock_bg,0,H-90,W,90,0,H-90,W,90);return}if(V.pack_blur){g.filter='brightness(.35) saturate(.6)';g.drawImage(V.pack_blur,0,0,W,H);g.filter='none'}
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
  bpm(){return[92,96,100][this.phase()]}/* v14.2: capped at the Label Room's 100 BPM */
  clapTurn(){const c=this.cb;if(!c)return false;const p=c.phase();return p==='ready'||p==='clap'}
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
  startKO(){this.state='end';this.cb=null;this.bolts=[];this.face=null;BB.groove.start(100,'pack');this.a0=BB.groove.t0;this.st=BB.t+(this.a0-BB.ac.currentTime)-KO_T0;BB.sfx.glitch();this.fuzzT=BB.t;this.fuzzD=.4;BB.mic.take();BB.ensureMic&&BB.ensureMic()}
  bombAt(i){const r=Math.sin(i*12.9898)*43758.5453,f=r-Math.floor(r);return{x:260+f*(W-520),y:420+((f*7)%1)*300}}
  skipKO(){if(this.state!=='end'||this.cel)return;BB.groove.stop();this.st=BB.t-KO_CEL+.05;this.ko=this.dinged=1;KO_HITS.forEach((h,i)=>this['h'+i]=1);BB.say('dl_done',{overlap:true})}
  manualOverride(){if(BB.t-(this.lastOv||0)<.5)return;this.lastOv=BB.t;this.ovPop=BB.t;if(this.cb)this.cb.override()}
  pause(){BB.paused=true;BB.ac.suspend()}
  resume(){BB.paused=false;BB.ensureMic()}
  // static attacks (cosmetic + brief fuzz; never hides the rhythm for long)
  attack(){const p=this.phase(),r=Math.random();this.jrK={t:BB.t,ph:'zap'};
    if(r<.55||!this.cb){const n=1+p;for(let i=0;i<n;i++)this.bolts.push({x:JR.x,y:JR.y-170,tx:300+Math.random()*(W-600),ty:200+Math.random()*500,t:BB.t+i*.18});BB.sfx.zap()}
    else{this.fuzzT=BB.t;this.fuzzD=.35+.1*p;BB.sfx.glitch();if(!this.said.x){this.said.x=1;BB.say('jr_extra',{overlap:true,nocap:true})}}
    this.atk=BB.t+[5,3.6,2.6][p]+Math.random()*2}
  update(dt){if(BB.keys.includes('p')){this.pause();return}if(BB.keys.includes(' ')){if(this.state!=='end')this.manualOverride();else this.manualPc=1}const t=BB.t-this.st;
    if(this.state==='intro'&&t>6){if(this.move)this.startKO();else this.newBox()}
    if(this.state==='show'&&t>1.4&&BB.t>this.voEnd&&!this.face)this.startClap();
    if(this.state==='wait'&&BB.t>this.voEnd&&!this.face)this.startClap();
    if(this.state==='throw'&&t>.9&&!this.thrHit){this.thrHit=1;this.landHit()}
    if(this.state==='throw'&&t>2.2){this.thrHit=0;if(this.hp<=0){this.startKO();this.cb=null;this.bolts=[];this.face=null;BB.groove&&BB.groove.stop&&BB.groove.stop();BB.sfx.glitch();BB.shake(10);this.fuzzT=BB.t;this.fuzzD=.4}else this.newBox()}
    if(this.state==='end'){/* v14.3.1 brain break: all sound pre-scheduled on the groove clock, so every hit lands exactly on the beat */
      if(!this.ko){this.ko=1;const A=k=>this.a0+k-KO_T0,S=BB.sfx;
        KO_BARS.forEach((b,i)=>{const b0=KO_T0+i*KO_BAR;if(b.count)for(let q=0;q<4;q++)S.tick&&S.tick(A(b0+q*KO_B));if(b.mode==='sneak')S.shhh&&S.shhh(A(b0));if(b.mode==='freeze')S.ding&&S.ding(A(b0));if(i>=KO_BARS.findIndex(x=>x.phase===5)&&!b.pwr&&b.h.length)for(let q=0;q<4;q++)S.pkBlip&&S.pkBlip(A(b0+q*KO_B));if(b.pwr===2){const sp=60/b.tp.bpm;for(let q=0;q*sp<KO_BAR-.05;q++)S.pkBlip&&S.pkBlip(A(b0+q*sp))}});
        KO_HITS.forEach(([k,kind])=>{const a=A(k);if(kind==='big'){[0,.12,.24].forEach(d=>S.pkTa&&S.pkTa(a+d));S.bonk&&S.bonk(a);S.wobble&&S.wobble(a+.05);S.ding&&S.ding(a+1.2);S.chime&&S.chime(a+.95)}
          else if(kind==='bomb'){S.pkTa&&S.pkTa(a);S.pop&&S.pop(a)}else if(kind==='chunk'){[0,.12].forEach(d=>S.pkTa&&S.pkTa(a+d));S.bonk&&S.bonk(a);S.wobble&&S.wobble(a+.05);S.chime&&S.chime(a+.6)}else if(kind==='stamp'||kind==='push'){S.pkTa&&S.pkTa(a);S.clunk&&S.clunk(a)}else if(kind==='pat'){S.pkTa&&S.pkTa(a)}else if(kind==='pick'){S.pkTa&&S.pkTa(a);S.tink&&S.tink(a)}else if(kind[0]==='j'){S.whoosh&&S.whoosh(a-.25)}
          else{S.pkTa&&S.pkTa(a);if(kind==='stomp')S.clunk&&S.clunk(a);else S.bonk&&S.bonk(a)}});
        }
      KO_HITS.forEach(([hk,kind],i)=>{if(t>=hk&&!this['h'+i]){this['h'+i]=1;if(kind==='big'){BB.shake(30);BB.burst(JR.x,JR.y-60,40,{cols:['#f4ecd8','#ff8adf','#6ee678'],kind:'spark',size:16,speed:1300,g:450,life:2});BB.burst(JR.x,JR.y-170,60,{cols:['#d24a3c','#ffe066','#fff','#7ef0ff'],kind:'star',size:16,speed:1100,g:400,life:1.4});BB.groove.stop()}
        else if(kind==='bomb'){const p=this.bombAt(i);BB.shake(5);BB.burst(p.x,p.y,26,{cols:['#7ef0ff','#ff8adf','#ffe066','#fff'],kind:'star',size:13,speed:700,g:250})}
        else if(KO_ATK(kind)){}else if(kind==='chunk'){BB.shake(26);BB.burst(JR.x,JR.y-60,40,{cols:['#ff8adf','#7ef0ff','#ffe066','#6ee678','#f4ecd8'],kind:'spark',size:14,speed:1200,g:500,life:1.6});BB.burst(JR.x,JR.y-100,45,{cols:['#ffe066','#fff','#ff8adf'],kind:'star',size:15,speed:1000,g:350,life:1.3})}
        else{BB.shake(kind==='stomp'?12:7);const sx=JR.x+(kind==='L'?-90:kind==='R'?90:0);BB.burst(sx,JR.y-60,16,{cols:['#e2b272','#ffe066','#fff'],kind:'star',size:12,speed:650,g:300});BB.burst(sx,JR.y-60,10,{cols:['#f4ecd8','#efe3c8'],kind:'spark',size:14,speed:500,g:500})}}});
      {const bi=Math.floor((t-KO_T0)/KO_BAR),b=KO_BARS[bi],on=BB.mic.take();this.blasts=this.blasts||[];if(b&&b.atk&&t<KO_BIG)for(const o of on)if(BB.t-(this.lastBl||0)>.1){this.lastBl=BB.t;this.blasts.push({t:BB.t,x:W*(.3+Math.random()*.4)});BB.sfx.chime&&BB.sfx.chime();BB.burst(JR.x,JR.y-60,10,{cols:['#ffe066','#fff'],kind:'star',size:10,speed:500,g:200})}if(this.manualPc&&b&&b.atk){this.manualPc=0;this.blasts.push({t:BB.t,x:W/2})}/* CLAP POWER-UP: the only mic use; lenient (any onset, 0.2 s debounce), auto-fills so nobody fails */
        if(b&&b.pwr===2){const u=(t-KO_T0-bi*KO_BAR)/KO_BAR;this.pw=this.pw||0;for(const o of on){if(BB.t-(this.lastPc||0)>.1){this.lastPc=BB.t;this.pw+=b.tp.inc;BB.sfx.chime&&BB.sfx.chime();BB.burst(LCH.x-175,LCH.y-240,14,{cols:['#ffe066','#fff'],kind:'star',size:10,speed:500,g:200})}}if(this.manualPc){this.manualPc=0;this.pw+=b.tp.inc}this.pw=Math.max(this.pw,u*u)}
        else if(!(b&&b.clear))this.pw=0}
      {const bi=Math.floor((t-KO_T0)/KO_BAR),b=KO_BARS[bi],bt=(t-KO_T0)/KO_BAR-bi;if(b&&this.lastBi!==bi){this.lastBi=bi;
        if(b.phase){BB.say('bb_p'+b.phase,{overlap:true});const sty=['pack','pack','mine','smash','pack','smash'][b.phase];BB.groove.start(100,sty);BB.groove.t0=this.a0+bi*KO_BAR+KO_B;this.sty=sty}if(b.pwr===1)BB.say('bb_'+b.tp.w.toLowerCase(),{overlap:true});if(b.clear)BB.say('bb_blast',{overlap:true});if(b.h.some(h=>h[1]==='big'))BB.say('bb_jump',{overlap:true});
        if(b.pwr===2)BB.groove.stop()}
        if(b&&b.pwr===2&&bt>.9&&!this['gr'+bi]){this['gr'+bi]=1;BB.groove.start(100,this.sty||'pack');BB.groove.t0=this.a0+(bi+1)*KO_BAR}}
      if(t>=KO_BIG+1.2&&!this.dinged){this.dinged=1;BB.say('dl_done',{overlap:true})}
      if(t>=KO_CEL&&!this.cel){this.cel=1;BB.celebrate({next:'',noJr:true})}}
      
    /* v14.2: no zaps/glitch SFX/Jr. voice while the class is clapping (self-sound rejection + voice gate were eating claps) */if(this.clapTurn()&&BB.t>this.atk-1)this.atk=BB.t+1;
    if((this.state==='clap'||this.state==='show'||this.state==='wait')&&BB.t>this.atk&&this.state!=='end')this.attack();
    this.bolts=this.bolts.filter(b=>BB.t-b.t<1.1);
    const f=this.face;if(f&&!f.drag&&!this.clapTurn()){f.vy=Math.min(f.vy+dt*120,160);f.y+=f.vy*dt;if(f.y>900){this.face=null;BB.sfx.glitch();BB.sfx.pop();this.fuzzT=BB.t;this.fuzzD=.8;this.jrK={t:BB.t,ph:'laugh'};BB.say('jr_giggle',{overlap:true,nocap:true});BB.caption={txt:'Missed him! A little static fuzz... keep going!',who:'sprocket',until:BB.t+2.2,start:BB.t};this.voEnd=BB.t+1}}
    BB.fuzz=this.fuzzT&&BB.t-this.fuzzT<this.fuzzD?1:0;
    if(this.cb)this.cb.update(dt);else BB.mic.take()}
  pdown(p){if(this.state==='end')return false;const f=this.face;if(f&&!f.drag&&Math.abs(p.x-f.x)<110&&Math.abs(p.y-f.y)<110){f.drag={id:p.id,dx:p.x-f.x,dy:p.y-f.y};BB.sfx.pop();return true}return false}
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
    if(seq){const bw=86,bh=130,U=R.noteSize('q',bw-6,bh);let b=0;for(const k of seq){const w=R.BEATS[k]*bw;R.tile(k,-172+b*bw+3,-62,w-6,bh,{ns:R.cardNs(k,bw,bh,R.BEATS[k]),shadow:false});b+=R.BEATS[k]}}ctx.restore()}
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
  drawHP(){const x=W-40-400+20,y=78,w=360,f=this.hp/TOTAL;BB.rrect(x-20,y-54,w+40,110,28,'rgba(12,16,28,.85)','#ff8adf',3);BB.text('STATIC JR.',x+w/2,y-24,24,'#ffd6f4',{stroke:0});
    BB.rrect(x,y,w,28,10,'#2a2233',null,0);if(f>0)BB.rrect(x,y,w*f,28,10,BB.lg(y,y+28,['#ff9ad8','#c03a8e']),null,0);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x,y,w,28);for(let i=1;i<TOTAL;i++){ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(x+i*w/TOTAL-1,y,2,28)}}
  drawLauncher(){const x=LCH.x,y=LCH.y,k=this.state==='throw'?BB.t-this.st:9,rc=k<.25?Math.sin(k/.25*Math.PI)*18:0;
    if(BB.IMG.sprocket){/* v14.2 bigger, animated Sprocket (same sprite rig as Mine/Packing) */const tk=BB.isTalking&&BB.isTalking('sprocket'),cheer=this.state==='end'||(this.jrK&&this.jrK.ph==='hit'&&BB.t-this.jrK.t<1.2);BB.contactShadow&&BB.contactShadow(x-175,y+100,100,.5);BB.sprite('sprocket',x-175,y+100,330,{squash:(tk?Math.sin(BB.t*16)*.02:Math.sin(BB.t*2)*.006)+(cheer?Math.abs(Math.sin(BB.t*8))*.04:0),rot:Math.sin(BB.t*1.3)*.015})}
    ctx.save();ctx.translate(x-rc,y);ctx.rotate(-.5);BB.rrect(-30,-36,210,72,30,BB.lg(-36,36,['#c9d6de','#7d8c96']),COL.ink,5);for(let i=0;i<3;i++){ctx.strokeStyle='#ffe066';ctx.lineWidth=5;ctx.beginPath();ctx.arc(60+i*40,0,34,-1.2,1.2);ctx.stroke()}ctx.restore();
    BB.rrect(x-70,y-10,140,110,18,BB.lg(y-10,y+100,['#6c7a86','#3d4650']),COL.ink,5);BB.text('BOX LAUNCHER',x,y+122,20,'#fff',{stroke:4})}
  drawKO(k,t){// v14.3.1 brain break: move cards on the beat, cardboard slapstick on Static, EVERYBODY JUMP -> RETURN TO SENDER
    const bt=(k-KO_T0)/KO_B,bi=Math.floor(bt/4),bar=KO_BARS[bi],gone=k>=KO_BIG;
    let last=null;for(const h of KO_HITS)if(k>=h[0])last=h;const since=last?k-last[0]:9,kd=last&&last[1];
    const sd=kd==='L'?1:kd==='R'||kd==='push'?-1:kd==='chunk'?(Math.sin(since*40)>0?1:-1)*Math.exp(-since*3):0;let jx=JR.x+sd*110*Math.exp(-since*6)*Math.cos(since*30),jy=JR.y,rot=sd*.28*Math.exp(-since*6),sq=0;
    if(kd==='stomp'&&since<.5){jy-=Math.sin(since/.5*Math.PI)*90;sq=since<.08?.25:0}
    if(['rain','zap','pat','stamp','pick'].includes(kd)&&since<.6)sq=Math.max(0,.35-since*.7);
    const md=bar&&bar.mode;if(md==='sneak'){jx+=Math.sin((k-KO_T0)/KO_B*Math.PI/2)*160;jy-=Math.abs(Math.sin((k-KO_T0)/KO_B*Math.PI))*20}if(md==='throw')rot+=Math.sin(t*14)*.05;
    if(kd==='chunk'&&since<1.4){const tri=x=>1-Math.abs((x%2)-1);jx=lerp(JR.x,W-140,tri(since*2.2));jy=JR.y-Math.abs(Math.sin(since*7))*120*(1.4-since);rot=since*14;sq=0}
    if(gone){const u=k-KO_BIG;jx=JR.x+u*1500;jy=JR.y-u*1700+u*u*900;rot=u*14}
    // power bar (cosmetic, 5 chunks: one per phase) + phase banner
    let dmg=0,tot=0;for(const [hk,kind] of KO_HITS){if(KO_ATK(kind))continue;const w=kind==='chunk'?6:kind==='big'?6:1;tot+=w;if(k>=hk)dmg+=w}const hpf=1-dmg/tot;
    if(k<KO_CEL){const x=W-40-400+20,y=200,w=360;BB.rrect(x-20,y-54,w+40,110,28,'rgba(12,16,28,.85)','#ff8adf',3);BB.text('STATIC JR. POWER',x+w/2,y-24,24,'#ffd6f4',{stroke:0});BB.rrect(x,y,w,28,10,'#2a2233',null,0);if(hpf>0)BB.rrect(x,y,w*hpf,28,10,BB.lg(y,y+28,['#ff9ad8','#c03a8e']),null,0);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x,y,w,28);
      if(since<.25&&last&&!KO_ATK(kd)){ctx.save();ctx.globalAlpha=1-since/.25;BB.rrect(x+w*hpf,y,Math.min(w*(1-hpf),40),28,6,'#fff',null,0);ctx.restore()}}
    if(bar&&bar.turn&&!gone){const us=bar.turn==='us';BB.rrect(W/2-330,282,660,66,22,us?'#ffe066':'#ff8adf',COL.ink,4);BB.text(us?'YOUR TURN: ATTACK!':'STATIC JR. ATTACKS: DODGE!',W/2,316,38,us?'#3a2a00':'#3a1040',{font:'Rammetto One',stroke:0})}
    {const lc=KO_PHASE_END.filter(x=>x<=k).pop();if(lc&&k-lc<1.4)BB.text('-1 POWER!',JR.x,JR.y-330-(k-lc)*50,80,'#ff8adf',{font:'Rammetto One',stroke:9});
      if(lc&&k-lc<.5){ctx.save();ctx.globalAlpha=1-(k-lc)/.5;ctx.strokeStyle='#ffe066';ctx.shadowColor='#ffe066';ctx.shadowBlur=60;ctx.lineWidth=90;ctx.beginPath();ctx.moveTo(LCH.x-150,LCH.y-60);ctx.lineTo(JR.x,JR.y-60);ctx.stroke();ctx.restore()}}
    if(bar&&bar.tp){const tp=bar.tp,u=(k-KO_T0)/KO_BAR-bi;if(bar.pwr===1){const s=.8+.2*ease.back(clamp(u*3,0,1));ctx.save();ctx.translate(730,560);ctx.scale(s,s);BB.panel(-490,-120,980,240,30);if(tp.isNew)BB.text('NEW TEMPO WORD!',0,-70,36,'#6ee678',{stroke:5});BB.text(tp.def,0,10,tp.w.length>8?46:62,COL.yellow,{font:'Rammetto One',stroke:9,maxW:940});BB.text('about '+tp.bpm+' beats per minute',0,80,32,'#fff',{stroke:4});ctx.restore()}
      else{const ph=((k-(KO_T0+bi*KO_BAR))*tp.bpm/60)%1,s=1+.25*Math.exp(-ph*8);ctx.save();ctx.translate(730,580);ctx.scale(s,s);BB.text(tp.w,0,0,tp.w.length>8?96:130,'#ff8adf',{font:'Rammetto One',stroke:12,strokeCol:'#3a1040'});ctx.restore();BB.text('CLAP AS FAST AS THE PULSE!',730,680,40,'#fff',{stroke:5})}}
    if(this.blasts){this.blasts=this.blasts.filter(b=>BB.t-b.t<.5);for(const b of this.blasts){const u=(BB.t-b.t)/.35;if(u<1){const x=lerp(b.x,jx,u),y=lerp(H,jy-60,u);ctx.save();ctx.strokeStyle='#ffe066';ctx.shadowColor='#ffe066';ctx.shadowBlur=30;ctx.lineWidth=10;ctx.beginPath();ctx.arc(x,y,30+u*30,0,7);ctx.stroke();ctx.restore()}else BB.text('CLAP!',jx+60,jy-320,60,'#ffe066',{font:'Rammetto One',stroke:7})}}
    // each scheduled attack beat: a clap shockwave shoots up from the class (the gag prop rides on it)
    for(const [hk,kind] of KO_HITS){if(KO_ATK(kind)||kind==='chunk'||kind==='big')continue;const u=(k-(hk-.25))/.25;if(u>=0&&u<1){ctx.save();ctx.globalAlpha=.7;ctx.strokeStyle='#fff38a';ctx.lineWidth=8;ctx.beginPath();ctx.arc(lerp(W/2,jx,u),lerp(H+40,jy-60,u),40,0,7);ctx.stroke();ctx.restore()}}
    // OVER THE TOP layer: turn-change slam cards, flashes, singed static smoke, finale star twinkle
    if(bar&&bar.turn&&!gone){const prev=KO_BARS[bi-1];if(!prev||prev.turn!==bar.turn){const v=(k-KO_T0)/KO_BAR-bi;if(v<.35){const s=lerp(3,1,ease.out(clamp(v/.12,0,1)));ctx.save();ctx.globalAlpha=v<.25?1:1-(v-.25)/.1;ctx.translate(W/2,540);ctx.scale(s,s);ctx.rotate(-.06);BB.text(bar.turn==='us'?'CLAP ATTACK!':'DODGE!',0,0,190,bar.turn==='us'?'#ffe066':'#7ef0ff',{font:'Rammetto One',stroke:16,strokeCol:'#2a1040'});ctx.restore();if(v<.04){ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(0,0,W,H)}}}}
    if(bar&&bar.pwr===2){const v=(k-KO_T0)/KO_BAR-bi;if(v<.25){const s=lerp(2.6,1,ease.out(clamp(v/.1,0,1)));ctx.save();ctx.globalAlpha=1-v/.25;ctx.translate(W/2,420);ctx.scale(s,s);BB.text(bar.tp.w+'!',0,0,170,'#ff8adf',{font:'Rammetto One',stroke:16,strokeCol:'#3a1040'});ctx.restore()}}
    for(const [hk,kind] of KO_HITS){const v=k-hk;if(v<0||v>.12)continue;if(kind==='chunk'||kind==='big'){ctx.fillStyle=`rgba(255,250,220,${.7*(1-v/.12)})`;ctx.fillRect(0,0,W,H)}else if(!KO_ATK(kind)){ctx.fillStyle=`rgba(255,240,180,${.15*(1-v/.12)})`;ctx.fillRect(0,0,W,H)}}
    if(!gone&&hpf<.75)for(let i=0;i<(hpf<.4?3:1);i++){const ph=(t*.8+i/3)%1;ctx.save();ctx.globalAlpha=.5*(1-ph);ctx.fillStyle='#8a8f99';ctx.beginPath();ctx.arc(jx-30+i*30+Math.sin(t*3+i)*10,jy-200-ph*120,18+ph*26,0,7);ctx.fill();ctx.restore()}
    if(gone&&k-KO_BIG>.9&&k-KO_BIG<2.6){const v=k-KO_BIG-.9,s=Math.sin(Math.min(1,v/.3)*Math.PI/2)*(1+.3*Math.sin(t*20));ctx.save();ctx.translate(W-260,110);ctx.rotate(t*2);ctx.scale(s,s);ctx.fillStyle='#fff8c0';ctx.shadowColor='#ffe066';ctx.shadowBlur=40;ctx.beginPath();for(let j=0;j<8;j++){const r=j%2?14:70,a=j*Math.PI/4;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.fill();ctx.restore()}
    // CLAP POWER-UP meter by Sprocket
    if(bar&&bar.pwr||(bar&&bar.clear&&k-(KO_T0+bi*KO_BAR)<.4)){const x=LCH.x-175,y=LCH.y-330,pw=clamp(this.pw||0,0,1);BB.rrect(x-30,y-30,60,240,20,'#1e2228','#fff',4);BB.rrect(x-22,y-22+224*(1-pw),44,224*pw,14,BB.lg(y,y+210,['#fff38a','#ffb020']),null,0);BB.text('POWER',x,y+240,28,COL.yellow,{stroke:4});if(pw>=1)BB.text('FULL!',x,y-60,44,'#6ee678',{font:'Rammetto One',stroke:6})}
    if(k<.6&&BB.q){ctx.save();ctx.globalAlpha=.3*(1-Math.max(0,k)/.6);for(let i=0;i<30;i++){ctx.fillStyle=Math.random()<.5?'#fff':'#7ef0ff';ctx.fillRect(Math.random()*W,Math.random()*H,60+Math.random()*300,3+Math.random()*5)}ctx.restore()}
    if(jy>-400&&jx<W+400){ctx.save();ctx.translate(jx,jy);ctx.rotate(rot);ctx.scale(1+sq*.6,1-sq);BB.staticJr(0,230,300,{dizzy:bi>=13,flip:md==='sneak'&&Math.cos((k-KO_T0)/KO_B*Math.PI/2)<0,glitch:.2+.15*Math.sin(t*20),noShadow:gone});ctx.restore();
      if(k>KO_T0){ctx.save();ctx.strokeStyle='#bff8ff';ctx.lineWidth=3;for(let i=0;i<5;i++){const a=t*7+i*1.3,r=150+20*Math.sin(t*13+i);ctx.beginPath();ctx.moveTo(jx+Math.cos(a)*r,jy+40+Math.sin(a)*r*.6);ctx.lineTo(jx+Math.cos(a+.2)*(r+25),jy+40+Math.sin(a+.2)*r*.6-12);ctx.stroke()}ctx.restore()}
      if(bi>=14&&!gone)for(let i=0;i<4;i++){const a=t*5+i*Math.PI/2;BB.text('\u2605',jx+Math.cos(a)*110,jy-160+Math.sin(a)*26,40,'#ffe066',{stroke:4})}}
    if(md&&!gone){const lines={sneak:'tip... toe... hee hee',throw:'catch THIS!',freeze:'statues?! no fair!'};R.bubble(jx,jy-200,lines[md])}
    const box=(x,y,s,r,lab)=>{ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.scale(s,s);BB.rrect(-70,-60,140,120,10,BB.lg(-60,60,['#e2b272','#b07a40']),'#5a3a1e',5);ctx.fillStyle='rgba(240,220,170,.85)';ctx.fillRect(-14,-60,28,120);if(lab)BB.text(lab,0,8,22,'#d24a3c',{font:'Rammetto One',stroke:0,maxW:130});ctx.restore()};
    const glove=(x,y,dir)=>{ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.fillStyle='#8a5a2e';ctx.fillRect(-900,-18,820,36);BB.rrect(-100,-60,150,120,40,BB.lg(-60,60,['#e2b272','#b07a40']),'#5a3a1e',6);BB.rrect(-40,-70,60,50,20,BB.lg(-70,-20,['#e8bd80','#c08850']),'#5a3a1e',5);ctx.restore()};
    for(const [hk,kind] of KO_HITS){const u=(k-(hk-.25))/.25;if(k<hk-1.3||k>hk+1)continue;const ty=JR.y-60;
      if(kind==='L'||kind==='R'){const dir=kind==='L'?1:-1,x0=kind==='L'?-120:W+120,x1=jx-dir*130,x=u<=1?lerp(x0,x1,ease.in?ease.in(u):u*u):lerp(x1,x0,Math.min(1,(u-1)*1.6));glove(x,ty+(kind==='L'?-20:20),dir)}
      if(kind==='rain'){for(let i=0;i<3;i++){const uu=u-i*.15;if(uu<0)continue;const y=uu<=1?lerp(-150,jy-330,uu*uu):jy-330-Math.sin(Math.min(1,(uu-1))*Math.PI)*160+(uu-1)*600*(uu-1);box(jx+(i-1)*90+(uu>1?(i-1)*(uu-1)*400:0),y,.8,uu*3*(i-1))}}
      if(kind==='zap'){const v=k-(hk-KO_B*1.5);if(v>0&&v<KO_B*1.5+.4){const p=v/(KO_B*1.5);const x=p<.5?lerp(jx-100,200,p*2):lerp(200,jx,(p-.5)*2),y=p<.5?lerp(jy-200,260,p*2):lerp(260,jy-200,(p-.5)*2);if(p<1){ctx.save();ctx.strokeStyle='#bff8ff';ctx.shadowColor='#7ef0ff';ctx.shadowBlur=24;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x-50,y-15);for(let i=0;i<5;i++)ctx.lineTo(x-50+i*25,y+(i%2?20:-20));ctx.stroke();ctx.restore();if(p>.3&&p<.6)BB.text('BOING! it bounced back!',200,200,34,'#fff',{stroke:5})}}}
      if(kind==='bomb'){const p=this.bombAt(KO_HITS.findIndex(h=>h[0]===hk&&h[1]===kind));const v=(k-(hk-KO_B))/KO_B;if(v>=0&&v<1){const x=lerp(jx-60,p.x,v),y=lerp(jy-260,p.y,v)-Math.sin(v*Math.PI)*300;ctx.save();ctx.translate(x,y);ctx.rotate(v*8);ctx.fillStyle='#4b3f8f';ctx.beginPath();ctx.arc(0,0,38,0,7);ctx.fill();ctx.strokeStyle='#bff8ff';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#5a3a1e';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,-38);ctx.quadraticCurveTo(12,-56,4,-68);ctx.stroke();ctx.fillStyle=Math.sin(t*40)>0?'#ffe066':'#fff';ctx.beginPath();ctx.arc(4,-70,8,0,7);ctx.fill();ctx.restore()}
        else if(v>=1&&v<1.5)BB.text('POOF!',p.x,p.y-60-(v-1)*60,60,'#ff8adf',{font:'Rammetto One',stroke:7})}
      if(kind[0]==='j'){const v=(k-(hk-KO_B))/(KO_B*2);if(v>=0&&v<1){const junk=kind==='junkF'?'squeaky tire':['old sock','rubber chicken','squeaky tire'][kind==='junkT'?0:kind==='junkL'?1:2];let x,y;
          if(kind==='junkF'){x=lerp(jx,-250,v);y=JR.y+190-Math.abs(Math.sin(v*9))*30}else if(kind==='junkT'){x=lerp(jx,-200,v);y=lerp(jy-250,300,v)-Math.sin(v*Math.PI)*200}else{const d=kind==='junkR'?1:-1;x=lerp(jx,W/2-d*900,v);y=lerp(jy-250,560,v)}
          ctx.save();ctx.translate(x,y);ctx.rotate(v*10);if(junk==='old sock'){BB.rrect(-25,-60,50,90,20,'#e8e0d0','#5a3a1e',4);BB.rrect(-25,10,90,40,18,'#e8e0d0','#5a3a1e',4);ctx.fillStyle='#d24a3c';ctx.fillRect(-25,-50,50,10)}else if(junk==='rubber chicken'){BB.rrect(-80,-20,160,40,20,'#ffe066','#5a3a1e',4);ctx.fillStyle='#d24a3c';ctx.beginPath();ctx.arc(-80,0,18,0,7);ctx.fill()}else{ctx.lineWidth=26;ctx.strokeStyle='#2a2e36';ctx.beginPath();ctx.arc(0,0,55,0,7);ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle='#5a3a1e';ctx.stroke()}ctx.restore();
          if(v>.3&&v<.8)BB.text(kind==='junkT'?'WHOOSH! (missed!)':kind==='junkF'?'BOING! you jumped it!':'MISSED! haha',W/2,560,46,'#fff',{stroke:6})}}
      if(kind==='pick'){const a=u<=1?lerp(-1.9,.2,u*u):lerp(.2,-1.9,Math.min(1,(u-1)*1.5));ctx.save();ctx.translate(jx-260,jy-260);ctx.rotate(a+1.57);ctx.fillStyle='#8a5a2e';ctx.fillRect(-10,-260,20,260);ctx.translate(0,-260);ctx.beginPath();ctx.moveTo(-90,10);ctx.quadraticCurveTo(0,-40,90,10);ctx.lineTo(0,-10);ctx.closePath();ctx.fillStyle='#c9d6de';ctx.fill();ctx.strokeStyle=COL.ink;ctx.lineWidth=4;ctx.stroke();ctx.restore()}
      if(kind==='pat'){const y=u<=1?lerp(-150,jy-210,u*u):jy-210-Math.sin(Math.min(1,u-1)*Math.PI)*60;box(jx,y,.9,0,'PAT!')}
      if(kind==='stamp'){const y=u<=1?lerp(-300,jy-260,u*u):lerp(jy-260,-300,Math.min(1,(u-1)*1.5));ctx.save();ctx.fillStyle='#7d8c96';ctx.fillRect(jx-14,-20,28,y+20);BB.rrect(jx-110,y,220,70,10,BB.lg(y,y+70,['#c9d6de','#7d8c96']),COL.ink,5);BB.rrect(jx-100,y+70,200,22,6,'#d24a3c',COL.ink,4);ctx.restore()}
      if(kind==='push'){const x=u<=1?lerp(W+300,jx+230,u):jx+230+(u-1)*900,fy=JR.y+150;ctx.save();BB.rrect(x-40,fy-150,230,150,18,BB.lg(fy-150,fy,['#ffd63c','#d9a020']),COL.ink,5);BB.rrect(x+30,fy-250,120,110,12,'rgba(126,240,255,.25)',COL.ink,5);ctx.fillStyle='#3d4650';ctx.fillRect(x-160,fy-40,140,16);ctx.fillRect(x-30,fy-260,16,240);ctx.fillStyle='#1e2228';ctx.beginPath();ctx.arc(x+20,fy+10,32,0,7);ctx.arc(x+150,fy+10,32,0,7);ctx.fill();ctx.restore()}
      if(kind==='stomp'&&u>=1&&u<1.6){ctx.save();ctx.globalAlpha=1.6-u;ctx.strokeStyle='#ffe066';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(JR.x,JR.y+10,(u-1)*600,(u-1)*80,0,0,7);ctx.stroke();ctx.restore()}}
    {const u=(k-(KO_BIG-.3))/.3;if(u>=0&&u<3.5){const x=u<=1?lerp(-300,JR.x-200,ease.out(u)):JR.x-200-(u-1)*120;box(x,JR.y-60,2.1,u<=1?0:-.05*(u-1),'RETURN TO SENDER')}}
    // POW words on each hit
    const WD={pick:['TINK!','CLINK!'],pat:['PAT!','PAT-PAT!'],stamp:['STAMP!','KA-CHUNK!'],push:['SHOVE!','VROOM!'],chunk:['SUPER BEAT BLAST!'],L:['POW!','BONK!','BAM!'],R:['WHAM!','BOP!','SMACK!'],stomp:['THUD!'],rain:['CLONK!'],zap:['ZZT-OOPS!']};
    KO_HITS.forEach(([hk,kind],i)=>{const v=k-hk;if(kind==='big'||v<0||v>=.4||!WD[kind])return;const w=WD[kind][i%WD[kind].length],s=1+.4*Math.exp(-v*12);ctx.save();ctx.translate(JR.x+(kind==='R'?-240:240),JR.y-300-v*40);ctx.scale(s,s);ctx.rotate(i%2?.12:-.12);BB.text(w,0,0,76,COL.yellow,{font:'Rammetto One',stroke:9});ctx.restore()});
    {const v=k-KO_BIG;if(v>=0&&v<1.4){const s=.6+.6*(ease.back?ease.back(clamp(v/.3,0,1)):1);ctx.save();ctx.translate(W/2+220,330);ctx.scale(s,s);ctx.rotate(-.08);BB.text('KA-BOING!',0,0,120,'#ff8adf',{font:'Rammetto One',stroke:12,strokeCol:'#3a1040'});ctx.restore()}}
    if(k>KO_BIG+.2&&k<KO_BIG+1.4)BB.text('bye-bye-bye...!',Math.min(W-200,JR.x+(k-KO_BIG)*900),Math.max(80,JR.y-(k-KO_BIG)*1100),40,'#fff',{stroke:6});
    if(md==='freeze'){ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#bff8ff';ctx.fillRect(0,0,W,H);ctx.restore()}
    // move card: what to do NOW, 4 beat lights, and what's NEXT
    if(bar&&bi>=0&&!(gone&&k>KO_BIG+1)){const bb=bt-bi*4,pop=1+.06*Math.exp(-(bb%1)*10),cx=W/2,cy=150;ctx.save();ctx.translate(cx,cy);ctx.scale(pop,pop);
      BB.panel(-560,-110,1120,220,30);this.koIcon(bar.ic,-440,-10,t);
      let txt=bar.cue;if(bar.count===1)txt=bar.tp?bar.cue:bar.cue+'  '+['1','2','3','4'][Math.min(3,bb|0)];if(bar.count===2)txt='EVERYBODY GET LOW... '+['1','2','3','4'][Math.min(3,bb|0)];
      BB.text(txt,60,-20,txt.length>16?54:78,COL.yellow,{font:'Rammetto One',stroke:8,maxW:820});
      for(let q=0;q<4;q++)BB.rrect(-110+q*90,50,60,34,12,q===(bb|0)?'#6ee678':'#2d4744','#fff',3);ctx.restore();
      const nx=KO_BARS[bi+1];if(nx&&bb>2)BB.text('NEXT: '+nx.cue,cx,cy+150,34,'#fff',{stroke:5,maxW:900});
      if(bb%1<.5&&!bar.count)R.bubble(LCH.x+20,LCH.y-300,bar.cue.toLowerCase())}
    if(!this.cel)BB.button(W-300,30,260,90,'SKIP',{size:40,id:'koskip',onClick:()=>this.skipKO()});
    if(k>KO_CEL){const a=clamp((k-KO_CEL)/.4,0,1),s=.7+.3*ease.back(a);ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,190);ctx.scale(s,s);BB.text('DELIVERY DOCK FIXED!',0,0,92,'#ffd63c',{font:'Rammetto One',stroke:12,strokeCol:'#782814'});
      if(BB.V2.chip){const im=BB.V2.chip,h=150,w=im.width*h/im.height;BB.glow(0,170,110,'rgba(255,220,120,A)',.5);ctx.drawImage(im,-w/2,170-h/2,w,h)}BB.text('Level 4 Beat Chip earned!',0,275,40,'#fff',{stroke:6});
      BB.panel(-430,320,860,90,24);BB.text('Great work, Rhythm Engineers!',0,366,44,COL.yellow,{stroke:5});ctx.restore()}}
  koIcon(ic,x,y,t){// simple drawn icons (no emoji fonts on classroom boards)
    ctx.save();ctx.translate(x,y);BB.rrect(-80,-80,160,160,24,'#1e3b38','#fff',4);ctx.fillStyle='#ffe066';ctx.strokeStyle='#5a3a1e';ctx.lineWidth=5;
    const tri=(r)=>{ctx.save();ctx.rotate(r);ctx.beginPath();ctx.moveTo(50,0);ctx.lineTo(-20,-42);ctx.lineTo(-20,42);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()};
    const fist=(dx,dir)=>{ctx.save();ctx.translate(dx,0);ctx.scale(dir,1);BB.rrect(-30,-30,60,60,18,BB.lg(-30,30,['#e2b272','#b07a40']),'#5a3a1e',4);ctx.fillStyle='#ffe066';ctx.fillRect(-62,-6,26,12);ctx.restore()};
    if(ic==='L')fist(-6,-1);else if(ic==='R')fist(6,1);else if(ic==='LR'){ctx.scale(.7,.7);fist(-42,-1);fist(42,1)}
    else if(ic==='duck')tri(Math.PI/2);else if(ic==='jump')tri(-Math.PI/2);
    else if(ic==='clap'){const c=Math.abs(Math.sin(t*Math.PI/.6))*14;BB.rrect(-50-c,-40,44,80,18,'#e8e0d0','#5a3a1e',4);BB.rrect(6+c,-40,44,80,18,'#e8e0d0','#5a3a1e',4)}
    else if(ic==='pick'){ctx.rotate(-.6);ctx.fillStyle='#8a5a2e';ctx.fillRect(-6,-20,12,80);ctx.beginPath();ctx.moveTo(-55,-15);ctx.quadraticCurveTo(0,-50,55,-15);ctx.lineTo(0,-28);ctx.closePath();ctx.fillStyle='#c9d6de';ctx.fill()}
    else if(ic==='pat'){BB.rrect(-50,-10,100,60,8,BB.lg(-10,50,['#e2b272','#b07a40']),'#5a3a1e',4);BB.rrect(-26,-60+Math.abs(Math.sin(t*5))*20,52,40,16,'#e8e0d0','#5a3a1e',4)}
    else if(ic==='stampI'){BB.rrect(-14,-60,28,50,6,'#7d8c96',COL.ink,3);BB.rrect(-50,-14,100,40,8,'#c9d6de',COL.ink,4);BB.rrect(-46,26,92,16,4,'#d24a3c',COL.ink,3)}
    else if(ic==='push'){BB.rrect(-60,-30,90,60,10,'#ffd63c','#5a3a1e',4);ctx.fillStyle='#1e2228';ctx.beginPath();ctx.arc(-40,36,14,0,7);ctx.arc(10,36,14,0,7);ctx.fill();tri(0);}
    else if(ic==='soft'){BB.rrect(-20,-40,40,60,20,'#fff','#5a3a1e',4);ctx.globalAlpha=.6;for(const d of[-44,44])BB.text('~',d,-6,44,'#ffe066',{stroke:3});ctx.globalAlpha=1;BB.text('shh',0,52,28,'#fff',{stroke:3})}
    else if(ic==='loud'){ctx.rotate(Math.sin(t*30)*.2);BB.rrect(-26,-48,52,76,26,'#fff','#5a3a1e',4);for(const d of[-1,1])for(let j=0;j<3;j++){ctx.strokeStyle='#ffe066';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(d*40,-30+j*25);ctx.lineTo(d*66,-36+j*30);ctx.stroke()}}
    else if(ic==='freeze'){ctx.strokeStyle='#bff8ff';ctx.lineWidth=8;for(let j=0;j<3;j++){ctx.save();ctx.rotate(j*Math.PI/3);ctx.beginPath();ctx.moveTo(-55,0);ctx.lineTo(55,0);ctx.stroke();ctx.restore()}}
    else if(ic==='stomp'){for(const d of[-30,30]){BB.rrect(d-22,-30+(Math.sin(t*10+d)>0?-8:0),44,70,10,'#ffe066','#5a3a1e',4)}}
    else BB.text('!',0,10,100,'#ffe066',{font:'Rammetto One',stroke:6});ctx.restore()}
  draw(){const t=BB.t,k=t-this.st;if(this.static)ctx.drawImage(this.static,0,0,W,H);else{ctx.fillStyle='#111';ctx.fillRect(0,0,W,H)}R.drawMotes(this.motes,BB.dt||.016,t);if(this.state==='load')return;
    const end=this.state==='end',dx=end?Math.max(0,k-(KO_BIG+1.2))**2*260:0,fill=end?clamp(Math.floor((k-KO_T0)/KO_BAR/(KO_BARS.length-1)*TOTAL)+1,0,TOTAL):Math.min(TOTAL,this.n);
    R.paint(ctx,()=>this.drawTruck(TRK.x+dx,TRK.y,fill,{spin:end?Math.max(0,k-(KO_BIG+1.2))*14:0}));
    if(!end){this.drawJr();this.drawHP()}
    else this.drawKO(k,t);
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
    if(!end){BB.panel(40,24,400,110,28);BB.text('TRUCK LOAD  '+fill+' of '+TOTAL,64,52,28,COL.yellow,{align:'left',stroke:4});for(let i=0;i<TOTAL;i++)BB.rrect(64+i*44,78,36,36,8,i<fill?BB.lg(78,114,['#e2b272','#b07a40']):'#2d4744','#fff',3);
      if(this.phT&&t-this.phT<2.4)BB.text(this.ph===1?'PHASE 2: FASTER!':'PHASE 3: WILD STATIC!',W/2,200,64,'#ff8adf',{font:'Rammetto One',stroke:8})}
    if(!end){BB.pauseBtn(()=>this.pause());BB.micMeter(40,H-150)}if(this.cb){BB.overrideBtn(()=>this.manualOverride(),{pop:this.ovPop&&t-this.ovPop<.3?1.08:1});if(BB.fuzz){ctx.save();ctx.translate((Math.random()-.5)*10,(Math.random()-.5)*4)}this.cb.draw(W/2,H-95);if(BB.fuzz)ctx.restore()}
    // screen fuzz (brief, translucent: rhythm stays readable)
    if(BB.fuzz){ctx.save();ctx.globalAlpha=.22;for(let i=0;i<70;i++){ctx.fillStyle=Math.random()<.5?'#fff':'#7ef0ff';ctx.fillRect(Math.random()*W,Math.random()*H,40+Math.random()*260,2+Math.random()*5)}ctx.restore()}
    if(this.state==='intro'&&k<2.6)BB.titleCard(this.move?'BONUS ROUND: BOSS BRAIN BREAK!':'ROOM 5: DELIVERY SHOWDOWN',this.move?'Your treat, Rhythm Engineers! Dodge with your body. Attack by CLAPPING!':'Clap the boxes. Beat Static Jr.!',k/2.6);
    if(this.state==='intro'&&this.move&&k>=2.6){BB.panel(W/2-560,120,1120,200,30);BB.text('YOUR TREAT: STAND UP!',W/2,190,72,COL.yellow,{font:'Rammetto One',stroke:8});BB.text('DODGE: duck, lean, freeze, jump.  ATTACK: clap on the beat!  No score, everybody wins!',W/2,265,36,'#fff',{stroke:5,maxW:1040})}
    if(end&&k>KO_CEL+2){/* v14.2: last room -> back to the room map (finale done) */BB.button(W/2-520,860,480,130,'ROOM MAP',{style:'green',size:56,id:'tomap',onClick:()=>BB.roomDone('finale')});BB.button(W/2+40,860,480,130,'PLAY AGAIN',{size:50,id:'again',onClick:()=>BB.go(new DeliveryRoom())})}
    if(BB.paused)BB.pauseOverlay(howTo,()=>this.resume())}}
BB.DeliveryRoom=DeliveryRoom})();
