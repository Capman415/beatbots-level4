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
 ['bb_fixed',"You fixed the factory! Levels one, two, three, and four, complete! Your reward... a boss brain break!",'sprocket'],
 ['bb_tease',"Next stop... somewhere new!",'sprocket'],
 ['bb_p6',"Phase six! Air juggle party! Ta, ta, ta, ta! Keep him bouncing!",'sprocket'],
 ['bb_chant',"Sing-along time! Stomp, stomp, clap! Everybody sing!",'sp'],['bb_ch1',"Rhythm, Rhythm Engineers.",'sp'],['bb_ch2',"Pull the levers, turn your gears.",'sp'],['bb_who1',"Who fixed the factory?",'sp'],['bb_who2',"Who are we?",'sp'],['bb_g1',"Umph!",'jr'],['bb_g2',"Ughh!",'jr'],['bb_g3',"Oof!",'jr'],['bb_6',"Six!",'jr'],['bb_7',"Seven!",'jr'],['bb_heehee',"Hee-hee! Hee-hee!",'jr'],['bb_laugh',"Ha ha ha! Hee hee!",'sprocket'],
 ['bb_sj1',"Your claps are softer than a marshmallow!",'jr'],
 ['bb_sj2',"I've heard louder sneezes!",'jr'],
 ['bb_sj3',"My grandma TV has better rhythm!",'jr'],
 ['bb_sj7',"I've seen kindergartners with better rhythm!",'jr'],
 ['bb_sj4',"Ti-ti? More like tee-hee!",'jr'],
 ['bb_sj5',"I ate all your whole notes... now I'm gonna eat your halves!",'jr'],
 ['bb_sj6',"Come at me, bro!",'jr'],
 ['bb_sp1',"Rhythm Engineers... let's show him!",'sprocket'],
 ['bb_speed',"Clap speed challenge! Clap fast! Faster is stronger!",'sprocket'],
 ['bb_fire',"You're on fire! Prestissimo! Hero punch!",'sprocket'],
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
const KO_B=.6,KO_BAR=2.4,KO_T0=.6,KO_INTRO=37;
/* medley: 5 phases (~30-38 s each), each knocks one chunk off Static Jr.'s power bar (cosmetic, can't fail) */
const KB=(cue,ic,h,o={})=>Object.assign({cue,ic,h},o),FOUR=k=>[[0,k],[1,k],[2,k],[3,k]];
const SH=()=>KB('SHAKE! SHAKE! SHAKE!','loud',[],{mode:'dance'}),SOFT=()=>KB('SHAKE SOFT... shh!','soft',[],{mode:'sneak'}),
  FRZ=b=>KB('FREEZE! FUZZ BOMB!','freeze',[[b,'bomb']],{mode:'freeze'}),PH=(n,name)=>KB('PHASE '+n+': '+name,'ready',[],{count:1,phase:n}),
  CLR=()=>KB('SUPER BEAT BLAST!','clap',[[0,'chunk']],{clear:1}),
  TEMPI={allegro:{w:'ALLEGRO',def:'Allegro = fast!',bpm:125,inc:.25},presto:{w:'PRESTO',def:'PRESTO = very fast!',bpm:170,inc:.15,isNew:1},prestissimo:{w:'PRESTISSIMO',def:'PRESTISSIMO = as fast as possible!',bpm:210,inc:.1,isNew:1}},PWQ=['allegro','allegro','presto','presto','prestissimo'];let PWN=0;
const PWR=()=>{const tp=TEMPI[PWQ[Math.min(PWN++,4)]];return[KB(tp.def,'clap',[],{count:1,pwr:1,tp}),KB(tp.w+'! CLAP CLAP CLAP!','clap',[],{pwr:2,tp})]};
/* CORE RULE (v14.3.1): kids DODGE with their bodies (duck / lean / freeze / jump, mic ignored) and ATTACK ONLY BY CLAPPING.
   Attack bars: each beat fires a cardboard 'clap blast' gag at Static Jr. (always lands: nobody fails); every real clap the mic hears fires an extra CLAP! blast. */
const A_=(cue,h)=>KB(cue,'clap',h,{atk:1}),C4=k=>A_('CLAP NOW! SLAP HIM SILLY!',[[0,'L'],[1,'R'],[2,'L'],[2.5,'R'],[3,k]]),CT=k=>A_('CLAP CLAP CLAP! SLAP-HAPPY!',[[0,'L'],[.5,'R'],[1,'L'],[1.5,'R'],[2,k]]),
  BOMBS=()=>KB('FUZZ BOMBS! FREEZE... then SHAKE!','freeze',[[1,'bomb'],[3,'bomb']],{mode:'throw'}),DK=()=>KB('DUCK!','duck',[[2,'junkT']],{mode:'throw'}),
  DL=()=>KB('LEAN LEFT!','L',[[2,'junkR']],{mode:'throw'}),DR=()=>KB('LEAN RIGHT!','R',[[2,'junkL']],{mode:'throw'}),JP=()=>KB('JUMP! (rolling tire!)','jump',[[2,'junkF']],{mode:'throw'});
const KO_BARS=[
 PH(1,'SHAKE & FREEZE'),SH(),FRZ(2),C4('L'),C4('R'),SOFT(),BOMBS(),CT('L'),FRZ(1),C4('stomp'),...PWR(),CLR(),
 PH(2,'DUCK & LEAN'),DK(),DL(),C4('R'),DR(),CT('L'),KB('DUCK, LEFT, RIGHT!','duck',[[1,'junkT'],[2,'junkR'],[3,'junkL']],{mode:'throw'}),C4('rain'),DL(),CT('R'),...PWR(),CLR(),
 PH(3,'JUMP & FREEZE'),JP(),C4('stomp'),FRZ(2),CT('rain'),JP(),DK(),A_('CLAP! BIG BOOMS!',[[0,'stomp'],[2,'stomp']]),BOMBS(),C4('L'),...PWR(),CLR(),
 PH(4,'FACTORY CLAPS'),DL(),A_('MINE: CLAP to swing the pickaxe!',FOUR('pick')),DK(),A_('PACKING: CLAP to pat the box!',FOUR('pat')),DR(),
  A_('LABEL: CLAP to STAMP!',[[0,'stamp'],[1,'stamp'],[2,'stamp'],[2.5,'stamp'],[3,'stamp']]),JP(),A_('DELIVERY: CLAP to push!',[[0,'push'],[2,'push']]),
  A_('ALL OF THEM: CLAP CLAP CLAP CLAP!',[[0,'pick'],[1,'pat'],[2,'stamp'],[3,'push']]),...PWR(),CLR(),
 PH(5,'CLAP BACK FINALE!'),C4('L'),C4('R'),BOMBS(),CT('L'),KB('DUCK! (it bounces back!)','duck',[[2,'zap']],{mode:'throw'}),A_('CLAP AS FAST AS YOU CAN!',[[0,'L'],[.5,'R'],[1,'L'],[1.5,'R'],[2,'L'],[2.5,'R'],[3,'L']]),DL(),
  C4('stomp'),JP(),A_('CLAP CLAP CLAP CLAP!',[[0,'L'],[1,'R'],[2,'rain'],[3,'stomp']]),
  ...PWR(),
 PH(6,'AIR JUGGLE PARTY!'),
  ...[['ALLEGRO',120,[['q','q','q','q'],['q','q','q','q'],['q','q','q','q'],['q','q','q','q']]],
      ['ALLEGRO',120,[['q','q','q','q'],['q','q','q','q'],['q','q','q','q'],['q','q','q','q']]],
      ['ALLEGRO',120,[['q','q','q','q'],['q','q','q','q'],['q','q','q','q']]]].flatMap(([w,bpm,cards])=>cards.map((pat,j)=>{let x=0,h=[],n=0;for(const k of pat){const st=k==='q'?[0]:k==='e'?[0,.5]:[0,.25,.5,.75];st.forEach(o=>h.push([x+o,n++%2?'R':'L']));x++}return KB('AIR JUGGLE! ta ta ta ta!','read',h,{read:pat,bpm,tw:w,cardN:j})})),
  /* v14.3.4 SING-ALONG CHANT (user's own lyrics): stomp-stomp-CLAP at 110 BPM; Sprocket leads, class echoes, then everybody; Jr gets slapped on the claps */
  ...(()=>{const L1=['Rhythm,','Rhythm','Engi-','neers.'],L2=['Pull the','levers,','turn your','gears.'],CH=(who,ws,o={})=>KB('SING-ALONG! STOMP STOMP CLAP!','clap',[[1,'L'],[3,'R']],Object.assign({chant:who,ws,bpm:110,sty:'chant'},o)),
     CR=(q,a,vo)=>[CH('lead',[q],{vo,ask:1}),CH('crowd',[a],{shout:1,h:[[0,'chunk']]})];
    return[KB('SING-ALONG TIME!','ready',[],{count:1,bpm:110,sty:'chant',chantIntro:1}),
      CH('lead',L1,{vo:'bb_ch1'}),CH('echo',L1),CH('lead',L2,{vo:'bb_ch2'}),CH('echo',L2),
      CH('lead',L1,{vo:'bb_ch1',lay:2}),CH('echo',L1,{lay:2}),CH('lead',L2,{vo:'bb_ch2',lay:2}),CH('echo',L2,{lay:2}),
      ...CR('Who fixed the factory?','WE DID!','bb_who1'),
      CH('all',L1,{vo:'bb_ch1',lay:3}),CH('all',L2,{vo:'bb_ch2',lay:3}),
      ...CR('Who are we?','RHYTHM ENGINEERS!','bb_who2'),
      CH('all',L1,{vo:'bb_ch1',lay:4,sty:'chantUp'}),CH('all',L2,{vo:'bb_ch2',lay:4,sty:'chantUp'})]})(),
  Object.assign(C4('L'),{bpm:110,sty:'chantUp'}),Object.assign(CT('R'),{bpm:110,sty:'chantUp'}),Object.assign(C4('stomp'),{bpm:110,sty:'chantUp'}),
  Object.assign(KB('EVERYBODY GET LOW...','duck',[],{count:2}),{bpm:110,sty:'chantUp'}),Object.assign(KB('EVERYBODY JUMP!','jump',[[0,'big']]),{bpm:110,sty:'chantUp'})];
/* v14.3.2 variable tempo: per-bar start/length (Speed Read Showdown runs faster) */
const BS=[],BL=[];{let x=KO_T0;KO_BARS.forEach((b,i)=>{b.bpm=b.bpm||100;BS[i]=x;BL[i]=240/b.bpm;x+=BL[i]});BS.push(x);BL.push(KO_BAR)}
const barAt=k=>{if(k<KO_T0)return Math.floor((k-KO_T0)/KO_BAR);const n=KO_BARS.length;if(k>=BS[n])return n+Math.floor((k-BS[n])/KO_BAR);let i=0;while(BS[i+1]<=k)i++;return i};BB.KO_BS=BS;
/* v14.3.2 CLAP SPEED: live claps/min (rolling 1.5 s, lenient x1.2) -> tempo tier. No counting, no patterns: any clap = a punch. */
const TIERS=[['ANDANTE',0,'#7ec8ff'],['MODERATO',90,'#6ee678'],['ALLEGRO',120,'#ffe066'],['PRESTO',170,'#ffb020'],['PRESTISSIMO',200,'#ff5a5a']],tierOf=c=>{let i=0;TIERS.forEach((x,j)=>{if(c>=x[1])i=j});return i};
BB.KO_BARS=KO_BARS;KO_BARS.forEach(b=>{b.turn=b.mode?'jr':b.atk||b.pwr||b.clear?'us':''});let RUN=0;KO_BARS.forEach((b,i)=>{if(b.turn==='us'&&!(KO_BARS[i-1]&&KO_BARS[i-1].turn==='us'))RUN++;b.run=b.turn==='us'?RUN:0});
const HERO_AT=[];KO_BARS.forEach((b,i)=>{if(b.atk&&!KO_BARS.slice(i+1).some(c=>c.atk&&c.run===b.run))HERO_AT.push({t:BS[i]+3*BL[i]/4,run:b.run,style:HERO_AT.length%3})});BB.HERO_AT=HERO_AT;const KO_PHASE_END=[];KO_BARS.forEach((b,i)=>b.clear&&KO_PHASE_END.push(BS[i]));
const KO_HITS=[];KO_BARS.forEach((b,i)=>b.h.forEach(([bt,kind])=>KO_HITS.push([BS[i]+bt*BL[i]/4,kind])));
const KO_BIG=BS[KO_BARS.length-1],KO_TF=3.2,KO_LAUNCH=KO_BIG+KO_TF,KO_CEL=KO_LAUNCH+2.4,KO_ATK=k=>['bomb','junkT','junkL','junkR','junkF','zap'].includes(k);
const bossMode=()=>{try{const q=new URLSearchParams(location.search).get('boss');return q||localStorage.bbBoss||'move'}catch(e){return'move'}};BB.bossMode=bossMode;
/* v14.3.2 Beat Chips: one chip per earlier room cleared (Mine, Smasher, Packing, Label = save.done in localStorage 'bb4'). All 4 -> DELUXE ULTRA finisher. Debug: ?deluxe=1 / ?deluxe=0 */
const CHIP_ROOMS=['mine','smasher','packing','label'],chipCount=()=>{try{const d=(BB.save&&BB.save.done)||JSON.parse(localStorage.getItem('bb4')||'{"done":[]}').done||[];return CHIP_ROOMS.filter(r=>d.includes(r)).length}catch(e){return 0}},
  deluxeOn=()=>{try{const q=new URLSearchParams(location.search).get('deluxe');if(q!=null)return q==='1'}catch(e){}return chipCount()>=4};BB.chipCount=chipCount;
const SHIELD=[2,5,7],FACE=[3,6],JR={x:1430,y:540},LCH={x:300,y:760},TRK={x:1110,y:560};
const howTo={title:'DELIVERY SHOWDOWN: beat Static Jr.!',steps:['Each box shows a rhythm. Listen, then clap it back.','A good clap THROWS the box at Static Jr.','Every hit drops a box into the truck. Fill it up!','Shield up? Only a PERFECT clap breaks it.','Face box? Drag it onto his head to BONK him.','No mic? Tap MANUAL OVERRIDE when they nail it.'],
  words:'ta = 1   ti-ti = 2 quick   tika-tika = 4 quicker   ta-ah = 2 beats   rest = silent beat',example:(x,y,w,h,t)=>{}};
class DeliveryRoom{constructor(o={}){this.o=o}
  enter(){BB.groove.start(100,'pack');this.n=this.o.startAt||0;this.hp=TOTAL-this.n;this.state='load';this.said={};this.bolts=[];this.fx=[];this.motes=R.motes(10);this.ph=0;this.jrK=null;
    R.loadImgs([['pack_blur','jpg'],['dock_bg','jpg'],['chip','png']]).then(()=>{this.static=R.bake(g=>this.bake(g));this.state='intro';this.st=BB.t;if(bossMode()==='clap')BB.say('jr_boss');else{BB.celebrate&&0;BB.burst(W/2,300,40,{cols:['#ffe066','#6ee678','#fff','#ff8adf'],kind:'star',size:14,speed:900,g:400})}this.voEnd=BB.t+3.2;setTimeout(()=>BB.scene===this&&!this.move&&BB.say('dl_intro'),2600)});this.move=bossMode()!=='clap';if(this.move)setTimeout(()=>BB.scene===this&&this.state==='intro'&&BB.say('bb_treat',{overlap:true}),11200);if(!this.move)BB.mic.take();window.__dl=this}
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
  startKO(){this.deluxe=deluxeOn();this.chips=this.deluxe?4:chipCount();this.state='end';this.cb=null;this.bolts=[];this.face=null;BB.groove.start(100,'pack');this.a0=BB.groove.t0;this.st=BB.t+(this.a0-BB.ac.currentTime)-KO_T0;BB.sfx.glitch();this.fuzzT=BB.t;this.fuzzD=.4;BB.mic.take();BB.ensureMic&&BB.ensureMic();this.heroes=HERO_AT.map(h=>Object.assign({},h));this.heroes.push({t:KO_BIG,run:-1,style:3,w:1.2});this.cts=[];this.cpm=0;this.fireRun=0}
  bombAt(i){const r=Math.sin(i*12.9898)*43758.5453,f=r-Math.floor(r);return{x:260+f*(W-520),y:420+((f*7)%1)*300}}
  skipKO(){if(this.state!=='end'||this.cel)return;(this.heroes||[]).forEach(h=>h.armed=2);BB.groove.stop();this.st=BB.t-KO_CEL+.05;this.ko=this.dinged=1;KO_HITS.forEach((h,i)=>this['h'+i]=1);BB.say('dl_done',{overlap:true})}
  manualOverride(){if(BB.t-(this.lastOv||0)<.5)return;this.lastOv=BB.t;this.ovPop=BB.t;if(this.cb)this.cb.override()}
  pause(){BB.paused=true;BB.ac.suspend()}
  resume(){BB.paused=false;BB.ensureMic()}
  // static attacks (cosmetic + brief fuzz; never hides the rhythm for long)
  attack(){const p=this.phase(),r=Math.random();this.jrK={t:BB.t,ph:'zap'};
    if(r<.55||!this.cb){const n=1+p;for(let i=0;i<n;i++)this.bolts.push({x:JR.x,y:JR.y-170,tx:300+Math.random()*(W-600),ty:200+Math.random()*500,t:BB.t+i*.18});BB.sfx.zap()}
    else{this.fuzzT=BB.t;this.fuzzD=.35+.1*p;BB.sfx.glitch();if(!this.said.x){this.said.x=1;BB.say('jr_extra',{overlap:true,nocap:true})}}
    this.atk=BB.t+[5,3.6,2.6][p]+Math.random()*2}
  update(dt){if(BB.keys.includes('p')){this.pause();return}if(BB.keys.includes(' ')){if(this.state!=='end')this.manualOverride();else this.manualPc=1}const t=BB.t-this.st;
    if(this.state==='intro'&&t>(this.move?KO_INTRO:6)){if(this.move)this.startKO();else this.newBox()}
    if(this.state==='intro'&&this.move){if(t>8&&!this.saidJr){this.saidJr=1;BB.say('jr_boss',{overlap:true})}if(t>1.2&&!this.saidFx){this.saidFx=1;BB.say('bb_fixed',{overlap:true})}}
    if(this.state==='show'&&t>1.4&&BB.t>this.voEnd&&!this.face)this.startClap();
    if(this.state==='wait'&&BB.t>this.voEnd&&!this.face)this.startClap();
    if(this.state==='throw'&&t>.9&&!this.thrHit){this.thrHit=1;this.landHit()}
    if(this.state==='throw'&&t>2.2){this.thrHit=0;if(this.hp<=0){this.startKO();this.cb=null;this.bolts=[];this.face=null;BB.groove&&BB.groove.stop&&BB.groove.stop();BB.sfx.glitch();BB.shake(10);this.fuzzT=BB.t;this.fuzzD=.4}else this.newBox()}
    if(this.state==='end'){/* v14.3.1 brain break: all sound pre-scheduled on the groove clock, so every hit lands exactly on the beat */
      if(!this.ko){this.ko=1;const A=k=>this.a0+k-KO_T0,S=BB.sfx;
        KO_BARS.forEach((b,i)=>{const b0=BS[i];if(b.count)for(let q=0;q<4;q++)S.tick&&S.tick(A(b0+q*BL[i]/4));if(b.mode==='sneak')S.shhh&&S.shhh(A(b0));if(b.mode==='freeze')S.ding&&S.ding(A(b0));if(i>=KO_BARS.findIndex(x=>x.phase===5)&&!b.pwr&&b.h.length)for(let q=0;q<4;q++)S.pkBlip&&S.pkBlip(A(b0+q*BL[i]/4));if(b.pwr===2){const sp=60/b.tp.bpm;for(let q=0;q*sp<KO_BAR-.05;q++)S.pkBlip&&S.pkBlip(A(b0+q*sp))}});
        KO_HITS.forEach(([k,kind])=>{const a=A(k);if(kind==='big'){[0,.12,.24].forEach(d=>S.pkTa&&S.pkTa(a+d));S.bonk&&S.bonk(a);S.wobble&&S.wobble(a+.05);S.ding&&S.ding(a+KO_TF+1.2);S.chime&&S.chime(a+KO_TF+.95);S.pop&&S.pop(a+.9);[0,.12,.24,.36,.6,.72].forEach((d,q)=>q%2?S.tink&&S.tink(a+1.5+d):S.pkBlip&&S.pkBlip(a+1.5+d));S.pkTa&&S.pkTa(a+KO_TF);S.wobble&&S.wobble(a+KO_TF+.05);if(this.deluxe){[.36,.48,.6].forEach(d=>S.pkTa&&S.pkTa(a+d));S.fanfare&&S.fanfare(a+.7)}}
          else if(kind==='bomb'){S.whoosh&&S.whoosh(a-.5);S.pkTa&&S.pkTa(a);S.pop&&S.pop(a)}else if(kind==='chunk'){[0,.12].forEach(d=>S.pkTa&&S.pkTa(a+d));S.bonk&&S.bonk(a);S.wobble&&S.wobble(a+.05);S.chime&&S.chime(a+.6)}else if(kind==='stamp'||kind==='push'){S.pkTa&&S.pkTa(a);S.clunk&&S.clunk(a)}else if(kind==='pat'){S.pkTa&&S.pkTa(a)}else if(kind==='pick'){S.pkTa&&S.pkTa(a);S.tink&&S.tink(a)}else if(kind[0]==='j'){S.whoosh&&S.whoosh(a-.5);S.pop&&S.pop(a)}
          else{S.pkTa&&S.pkTa(a);if(kind==='stomp')S.clunk&&S.clunk(a);else S.bonk&&S.bonk(a)}});
        }
      KO_HITS.forEach(([hk,kind],i)=>{if(t>=hk&&!this['h'+i]){this['h'+i]=1;if(kind==='big'){BB.shake(this.deluxe?44:30);if(this.deluxe)for(let q=0;q<3;q++)BB.burst(W*(.25+q*.25),H*.3,40,{cols:['#ff5a5a','#ffb020','#ffe066','#6ee678','#5ac8fa','#b07aff'],kind:'star',size:16,speed:1200,g:400,life:2});BB.burst(JR.x,JR.y-60,40,{cols:['#f4ecd8','#ff8adf','#6ee678'],kind:'spark',size:16,speed:1300,g:450,life:2});BB.burst(JR.x,JR.y-170,60,{cols:['#d24a3c','#ffe066','#fff','#7ef0ff'],kind:'star',size:16,speed:1100,g:400,life:1.4});BB.groove.stop()}
        else if(kind==='bomb'){const p=this.bombAt(i);BB.shake(5);BB.burst(p.x,p.y,26,{cols:['#7ef0ff','#ff8adf','#ffe066','#fff'],kind:'star',size:13,speed:700,g:250})}
        else if(KO_ATK(kind)){}else if(kind==='chunk'){BB.shake(26);BB.burst(JR.x,JR.y-60,40,{cols:['#ff8adf','#7ef0ff','#ffe066','#6ee678','#f4ecd8'],kind:'spark',size:14,speed:1200,g:500,life:1.6});BB.burst(JR.x,JR.y-100,45,{cols:['#ffe066','#fff','#ff8adf'],kind:'star',size:15,speed:1000,g:350,life:1.3})}
        else{if(kind==='L'||kind==='R'){this.has=(this.has||[]).filter(p=>BB.t-p.t<1);if(Math.random()<.5)this.has.push({t:BB.t,w:['HA!','HEE HEE!','HA HA!','LOL!'][Math.floor(Math.random()*4)],x:LCH.x+(Math.random()*160-40),y:LCH.y-300-Math.random()*60,c:['#6ee678','#ffe066','#7ec8ff'][Math.floor(Math.random()*3)]});if(BB.t-(this.lastLaugh||-9)>4.5){this.lastLaugh=BB.t;BB.say('bb_laugh',{overlap:true})}
          /* gags: '6-7' meme (~1 in 6, max 3, never back to back) + dazed moonwalk glide (twice) that ends in a slap */
          this.hitN=(this.hitN||0)+1;if(this.hitN%3===1&&BB.t-(this.lastGr||-9)>1.5&&!(this.gag&&BB.t-this.gag.t<2)){this.lastGr=BB.t;this.grN=(this.grN||0)+1;BB.say(['bb_g1','bb_g2','bb_g3'][this.grN%3],{overlap:true})}const g=this.gag,gv=g?BB.t-g.t:9;
          if(g&&g.kind==='mw'&&gv>g.dur){this.gag=null;this.gagLast=this.hitN;BB.text&&0;this.has.push({t:BB.t,w:'SLAP! (mid-glide!)',x:JR.x-120,y:JR.y-330,c:'#ffe066'});BB.sfx.bonk&&BB.sfx.bonk()}
          else if(!g||gv>2.6){const bt=60/(240/(BL[barAt(BB.t-this.st)]||2.4));
            if((this.hitN===14||this.hitN===38)&&(this.mwN||0)<2){this.mwN=(this.mwN||0)+1;this.gag={kind:'mw',t:BB.t,dur:4*(BL[barAt(BB.t-this.st)]||2.4)/4,beat:(BL[barAt(BB.t-this.st)]||2.4)/4};BB.say('bb_heehee',{overlap:true})}
            else if((this.n67||0)<2&&this.hitN-(this.gagLast||-9)>4&&Math.random()<1/10){this.n67=(this.n67||0)+1;this.gagLast=this.hitN;this.gag={kind:'67',t:BB.t,dur:1.6};BB.say('bb_6',{overlap:true});setTimeout(()=>BB.scene===this&&BB.say('bb_7',{overlap:true}),800)}}}BB.shake(kind==='stomp'?12:7);const sx=JR.x+(kind==='L'?-90:kind==='R'?90:0);BB.burst(sx,JR.y-60,16,{cols:['#e2b272','#ffe066','#fff'],kind:'star',size:12,speed:650,g:300});BB.burst(sx,JR.y-60,10,{cols:['#f4ecd8','#efe3c8'],kind:'spark',size:14,speed:500,g:500})}}});
      {const bi=barAt(t),b=KO_BARS[bi],on=BB.mic.take();this.blasts=this.blasts||[];const us=b&&b.turn==='us'&&t<KO_BIG,tr=tierOf(this.cpm||0);if(us)for(const o of on)if(BB.t-(this.lastBl||0)>.1){this.lastBl=BB.t;this.cts.push(BB.t);this.combo=(BB.t-(this.lastCl||0)<.8?(this.combo||0):0)+1;this.lastCl=BB.t;this.blasts.push({t:BB.t,x:W*(.3+Math.random()*.4),s:1+tr*.35});BB.sfx.pkTa&&BB.sfx.pkTa();if(tr>=2)BB.sfx.bonk&&BB.sfx.bonk();BB.shake(3+tr*3);BB.burst(JR.x+(Math.random()-.5)*120,JR.y-60,10+tr*8,{cols:['#ffe066','#fff',TIERS[tr][2]],kind:'star',size:10+tr*3,speed:500+tr*200,g:200})}if(this.manualPc&&us){this.cts.push(BB.t);this.blasts.push({t:BB.t,x:W/2,s:1})}
        this.cts=(this.cts||[]).filter(x=>BB.t-x<1.5);{const raw=us?this.cts.length/1.5*60*1.2:0;this.cpm=lerp(this.cpm||0,raw,Math.min(1,(BB.dt||.016)*(raw>this.cpm?6:2)));if(b&&b.pwr===2)this.cpm=Math.max(this.cpm,Math.pow((t-BS[bi])/BL[bi],1.5)*235)}/* pwr turns auto-complete to PRESTISSIMO */
        {const tn=tierOf(this.cpm);if(us&&tn===4&&this.fireRun!==b.run){this.fireRun=b.run;this.fire=BB.t;BB.say('bb_fire',{overlap:true});const qb=BL[bi]/4,nb=BS[bi]+Math.ceil((t-BS[bi])/qb+1)*qb;const h=this.heroes.find(h=>h.run===b.run&&!h.armed);if(h){if(h.t>nb)h.t=nb}else this.heroes.push({t:nb,run:b.run,style:this.heroes.length%3})}
          if(us&&tn>=2){const hb=Math.floor((t-KO_T0)/(KO_B/(tn>=4?4:2)));if(hb!==this.layB){this.layB=hb;BB.sfx.tick&&BB.sfx.tick();if(tn>=3&&hb%2)BB.sfx.pkBlip&&BB.sfx.pkBlip()}}}
        for(const h of this.heroes)if(!h.armed&&t>=h.t-(h.w||.6)-.15&&t<h.t){h.armed=1;const S=BB.sfx,A=k=>this.a0+k-KO_T0;S.whoosh&&S.whoosh(A(h.t-(h.w||.6)));[0,.1,.2].forEach(d=>S.pkTa&&S.pkTa(A(h.t+d)));S.bonk&&S.bonk(A(h.t));S.wobble&&S.wobble(A(h.t+.05));S.pop&&S.pop(A(h.t+.15))}else if(h.armed===1&&t>=h.t){h.armed=2;BB.shake(34);BB.burst(JR.x,JR.y-80,50,{cols:['#ffe066','#fff','#ff8adf','#7ef0ff'],kind:'star',size:16,speed:1300,g:400})}/* CLAP POWER-UP: the only mic use; lenient (any onset, 0.2 s debounce), auto-fills so nobody fails */
        if(b&&b.pwr===2){const u=(t-BS[bi])/BL[bi];this.pw=this.pw||0;for(const o of on){if(BB.t-(this.lastPc||0)>.1){this.lastPc=BB.t;this.pw+=b.tp.inc*(1+tierOf(this.cpm||0)*.4);BB.sfx.chime&&BB.sfx.chime();BB.burst(LCH.x-175,LCH.y-240,14,{cols:['#ffe066','#fff'],kind:'star',size:10,speed:500,g:200})}}if(this.manualPc){this.manualPc=0;this.pw+=b.tp.inc}this.pw=Math.max(this.pw,u*u)}
        else if(!(b&&b.clear))this.pw=0}
      {const bi=barAt(t),b=KO_BARS[bi],bt=(t-BS[bi])/BL[bi];if(b&&this.lastBi!==bi){this.lastBi=bi;
        if(b.phase){BB.say('bb_p'+b.phase,{overlap:true});const sty=['pack','pack','mine','smash','pack','smash','pack'][b.phase];BB.groove.start(100,sty);BB.groove.t0=this.a0+BS[bi]-KO_T0+KO_B;this.sty=sty}{const p=KO_BARS[bi-1],ws=b.sty||this.sty||'pack',ps=p?(p.sty||this.sty||'pack'):ws;if(p&&!b.phase&&!b.pwr&&(p.bpm!==b.bpm||ps!==ws||p.pwr===2)){BB.groove.start(b.bpm,ws);BB.groove.t0=this.a0+BS[bi]-KO_T0}}if(b.phase)this.curPh=b.phase;BB.groove.vol=b.chant?[.6,.6,.7,.8,.95][b.lay||1]:b.sty?.9:.5+.05*(this.curPh||1);if(b.vo)BB.say(b.vo,{overlap:true});if(b.chantIntro)BB.say('bb_chant',{overlap:true});if(b.chant){const S=BB.sfx,A=x=>this.a0+BS[bi]-KO_T0+x*BL[bi]/4;[0,.5,2,2.5].forEach(x=>{S.clunk&&S.clunk(A(x))});[1,3].forEach(x=>{S.crack&&S.crack(A(x));(b.lay||1)>=3&&S.pkTa&&S.pkTa(A(x))});if(b.shout){S.fanfare&&S.fanfare(A(0))}}if(b.pwr===1)BB.say('bb_speed',{overlap:true});if(b.clear)BB.say('bb_blast',{overlap:true});if(b.h.some(h=>h[1]==='big'))BB.say('bb_jump',{overlap:true});
        if(b.pwr===2)BB.groove.stop()}
        if(b&&b.pwr===2&&bt>.9&&!this['gr'+bi]){this['gr'+bi]=1;BB.groove.start(100,this.sty||'pack');BB.groove.t0=this.a0+BS[bi+1]-KO_T0}}
      if(t>=KO_LAUNCH+1.2&&!this.dinged){this.dinged=1;BB.say('dl_done',{overlap:true})}
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
    const bi=barAt(k),bt=bi*4+(k-BS[Math.max(0,Math.min(bi,KO_BARS.length))])/KO_B,bar=KO_BARS[bi],gone=k>=KO_BIG;
    let last=null;for(const h of KO_HITS)if(k>=h[0])last=h;const since=last?k-last[0]:9,kd=last&&last[1];
    const sd=kd==='L'?1:kd==='R'||kd==='push'?-1:kd==='chunk'?(Math.sin(since*40)>0?1:-1)*Math.exp(-since*3):0;let jx=JR.x+sd*110*Math.exp(-since*6)*Math.cos(since*30),jy=JR.y,rot=sd*.28*Math.exp(-since*6),sq=0;
    {const g=this.gag,gv=g?BB.t-g.t:9;if(g&&g.kind==='mw'&&gv<g.dur+1.2){const st=Math.min(gv,g.dur)/g.beat,f=Math.floor(st)+Math.min(1,(st%1)*2.5);jx-=Math.min(f,4)*55;rot+=Math.sin(st*Math.PI)*.04;}
     if(g&&g.kind==='67')rot+=Math.sin(gv*12)*.03}
    if(kd==='stomp'&&since<.5){jy-=Math.sin(since/.5*Math.PI)*90;sq=since<.08?.25:0}
    if(['rain','zap','pat','stamp','pick'].includes(kd)&&since<.6)sq=Math.max(0,.35-since*.7);
    {const hv=this.heroV(k);if(hv!=null&&hv>=0&&hv<.5){sq=.5*(1-hv/.5);jx+=[0,120,0,0][this.heroS]*Math.exp(-hv*6);jy-=[140,0,0,160][this.heroS]*Math.sin(Math.min(1,hv/.5)*Math.PI);rot+=[.1,.4,0,.2][this.heroS]*Math.exp(-hv*5)}}
    if(bar&&bar.read&&!gone){const qb=BL[bi]/4,ph=((k-BS[bi])/qb)%1;jy-=180+Math.sin(ph*Math.PI)*140;rot+=Math.sin(k*9)*.2}
    if(since<.3&&(kd==='L'||kd==='R')&&!gone){sq=Math.max(sq,.18*Math.sin(since*60)*Math.exp(-since*8))}
    const md=bar&&bar.mode;if(md==='sneak'){jx+=Math.sin((k-KO_T0)/KO_B*Math.PI/2)*160;jy-=Math.abs(Math.sin((k-KO_T0)/KO_B*Math.PI))*20}if(md==='throw')rot+=Math.sin(t*14)*.05;
    if(kd==='chunk'&&since<1.4){const tri=x=>1-Math.abs((x%2)-1);jx=lerp(JR.x,W-140,tri(since*2.2));jy=JR.y-Math.abs(Math.sin(since*7))*120*(1.4-since);rot=since*14;sq=0}
    if(k>=KO_LAUNCH){const u=k-KO_LAUNCH;jx=JR.x+u*1500;jy=JR.y-u*1700+u*u*900;rot=u*14}
    // power bar (cosmetic, 5 chunks: one per phase) + phase banner
    let dmg=0,tot=0;for(const [hk,kind] of KO_HITS){if(KO_ATK(kind))continue;const w=kind==='chunk'?6:kind==='big'?6:1;tot+=w;if(k>=hk)dmg+=w}const hpf=1-dmg/tot;
    if(k<KO_CEL){const x=W-40-400+20,y=200,w=360;BB.rrect(x-20,y-54,w+40,110,28,'rgba(12,16,28,.85)','#ff8adf',3);BB.text('STATIC JR. POWER',x+w/2,y-24,24,'#ffd6f4',{stroke:0});BB.rrect(x,y,w,28,10,'#2a2233',null,0);if(hpf>0)BB.rrect(x,y,w*hpf,28,10,BB.lg(y,y+28,['#ff9ad8','#c03a8e']),null,0);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x,y,w,28);
      if(since<.25&&last&&!KO_ATK(kd)){ctx.save();ctx.globalAlpha=1-since/.25;BB.rrect(x+w*hpf,y,Math.min(w*(1-hpf),40),28,6,'#fff',null,0);ctx.restore()}}
    if(bar&&bar.turn&&!gone){const us=bar.turn==='us',BY=318;BB.rrect(W/2-330,BY,660,66,22,us?'#ffe066':'#ff8adf',COL.ink,4);BB.text(us?'CLAP PARTY! FASTER = SILLIER!':'STATIC JR. ATTACKS: DODGE!',W/2,BY+34,38,us?'#3a2a00':'#3a1040',{stroke:0,maxW:620})}
    {const lc=KO_PHASE_END.filter(x=>x<=k).pop();if(lc&&k-lc<1.4)BB.text('-1 POWER!',JR.x,JR.y-330-(k-lc)*50,80,'#ff8adf',{font:'Rammetto One',stroke:9});
      if(lc&&k-lc<.5){ctx.save();ctx.globalAlpha=1-(k-lc)/.5;ctx.strokeStyle='#ffe066';ctx.shadowColor='#ffe066';ctx.shadowBlur=60;ctx.lineWidth=90;ctx.beginPath();ctx.moveTo(LCH.x-150,LCH.y-60);ctx.lineTo(JR.x,JR.y-60);ctx.stroke();ctx.restore()}}
    if(bar&&bar.tp){const tp=bar.tp,u=(k-BS[bi])/BL[bi];const dlx=this.deluxe&&tp.w==='PRESTISSIMO';if(bar.pwr===1){const s=.8+.2*ease.back(clamp(u*3,0,1));ctx.save();ctx.translate(730,560);ctx.scale(s,s);BB.panel(-490,-120,980,240,30);if(dlx){const g=ctx.createLinearGradient(-490,0,490,0);['#ff5a5a','#ffb020','#ffe066','#6ee678','#5ac8fa','#b07aff'].forEach((c,j)=>g.addColorStop(j/5,c));ctx.strokeStyle=g;ctx.lineWidth=12;ctx.strokeRect(-500,-130,1000,260);BB.text('ALL 4 BEAT CHIPS: DELUXE ULTRA UNLOCKED!',0,-150,44,'#ffd63c',{stroke:8,strokeCol:'#782814',maxW:1100})}BB.text('CLAP PARTY!',0,-50,62,COL.yellow,{stroke:9,maxW:940});BB.text('Clap fast! Faster = sillier! Can we hit PRESTISSIMO?',0,40,40,'#fff',{stroke:5,maxW:940});ctx.restore()}
      else{const tw=TIERS[tierOf(this.cpm||0)][0],s=1+.25*Math.exp(-(BB.t-(this.lastCl||0))*8);ctx.save();ctx.translate(730,580);ctx.scale(s,s);BB.text(dlx?'MEGA '+tw:tw,0,0,tw.length>8?(dlx?78:96):130,dlx?'#ffd63c':'#ff8adf',{font:'Rammetto One',stroke:12,strokeCol:'#3a1040'});ctx.restore();BB.text('CLAP FASTER! FASTER!',730,680,40,'#fff',{stroke:5})}}
    if(this.blasts){this.blasts=this.blasts.filter(b=>BB.t-b.t<.5);for(const b of this.blasts){const u=(BB.t-b.t)/.35;if(u<1){const x=lerp(b.x,jx,u),y=lerp(H,jy-60,u);ctx.save();ctx.strokeStyle='#ffe066';ctx.shadowColor='#ffe066';ctx.shadowBlur=30;ctx.lineWidth=10;ctx.beginPath();ctx.arc(x,y,(30+u*30)*(b.s||1),0,7);ctx.stroke();ctx.restore()}else BB.text('POW!',jx-200,jy-160,60*(b.s||1),'#ffe066',{font:'Rammetto One',stroke:7})}}
    // each scheduled attack beat: a clap shockwave shoots up from the class (the gag prop rides on it)
    for(const [hk,kind] of KO_HITS){if(KO_ATK(kind)||kind==='chunk'||kind==='big')continue;const u=(k-(hk-.25))/.25;if(u>=0&&u<1){ctx.save();ctx.globalAlpha=.7;ctx.strokeStyle='#fff38a';ctx.lineWidth=8;ctx.beginPath();ctx.arc(lerp(W/2,jx,u),lerp(H+40,jy-60,u),40,0,7);ctx.stroke();ctx.restore()}}
    // OVER THE TOP layer: turn-change slam cards, flashes, singed static smoke, finale star twinkle
    if(bar&&bar.turn&&!gone){const prev=KO_BARS[bi-1];if(!prev||prev.turn!==bar.turn){const v=(k-BS[bi])/BL[bi];if(v<.35){const s=lerp(3,1,ease.out(clamp(v/.12,0,1)));ctx.save();ctx.globalAlpha=v<.25?1:1-(v-.25)/.1;ctx.translate(W/2,540);ctx.scale(s,s);ctx.rotate(-.06);BB.text(bar.turn==='us'?'CLAP ATTACK!':'DODGE!',0,0,190,bar.turn==='us'?'#ffe066':'#7ef0ff',{font:'Rammetto One',stroke:16,strokeCol:'#2a1040'});ctx.restore();if(v<.04){ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(0,0,W,H)}}}}
    if(bar&&bar.pwr===2){const v=(k-BS[bi])/BL[bi];if(v<.25){const s=lerp(2.6,1,ease.out(clamp(v/.1,0,1)));ctx.save();ctx.globalAlpha=1-v/.25;ctx.translate(W/2,420);ctx.scale(s,s);BB.text(bar.tp.w+'!',0,0,170,'#ff8adf',{font:'Rammetto One',stroke:16,strokeCol:'#3a1040'});ctx.restore()}}
    for(const [hk,kind] of KO_HITS){const v=k-hk;if(v<0||v>.12)continue;if(kind==='chunk'||kind==='big'){ctx.fillStyle=`rgba(255,250,220,${.7*(1-v/.12)})`;ctx.fillRect(0,0,W,H)}else if(!KO_ATK(kind)){ctx.fillStyle=`rgba(255,240,180,${.15*(1-v/.12)})`;ctx.fillRect(0,0,W,H)}}
    if(!gone&&hpf<.75)for(let i=0;i<(hpf<.4?3:1);i++){const ph=(t*.8+i/3)%1;ctx.save();ctx.globalAlpha=.5*(1-ph);ctx.fillStyle='#8a8f99';ctx.beginPath();ctx.arc(jx-30+i*30+Math.sin(t*3+i)*10,jy-200-ph*120,18+ph*26,0,7);ctx.fill();ctx.restore()}
    if(k>=KO_LAUNCH&&this.deluxe&&k-KO_LAUNCH<1.6){const cols=['#ff5a5a','#ffb020','#ffe066','#6ee678','#5ac8fa','#b07aff'];ctx.save();ctx.lineCap='round';cols.forEach((c,j)=>{ctx.strokeStyle=c;ctx.lineWidth=22;ctx.beginPath();for(let q=0;q<=20;q++){const u=Math.max(0,k-KO_LAUNCH-.6+q*.03);ctx.lineTo(JR.x+u*1500,JR.y+(j-2.5)*20-u*1700+u*u*900+230)}ctx.stroke()});ctx.restore();if(k-KO_LAUNCH<.15){ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(0,0,W,H)}BB.text('DELUXE ULTRA!',W/2,860,120,'#ffd63c',{font:'Rammetto One',stroke:14,strokeCol:'#782814'})}
    if(gone&&k-KO_LAUNCH>.9&&k-KO_LAUNCH<2.6){const v=k-KO_LAUNCH-.9,s=Math.sin(Math.min(1,v/.3)*Math.PI/2)*(1+.3*Math.sin(t*20));ctx.save();ctx.translate(W-260,110);ctx.rotate(t*2);ctx.scale(s*(this.deluxe?2:1),s*(this.deluxe?2:1));ctx.fillStyle='#fff8c0';ctx.shadowColor='#ffe066';ctx.shadowBlur=40;ctx.beginPath();for(let j=0;j<8;j++){const r=j%2?14:70,a=j*Math.PI/4;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.fill();ctx.restore()}
    if(bar&&bar.turn==='us'&&!gone){if(bar.read)R.turnBorder(true);else this.drawSpeed(t)}
    {const nx=KO_BARS[bi+1];if(bar&&bar.read)this.drawCard(bar,(k-BS[bi])/BL[bi],t);else if(nx&&nx.read&&k>BS[bi+1]-.6)this.drawCard(nx,-1,t)}
    for(const [hk,kind] of KO_HITS){if(kind!=='L'&&kind!=='R')continue;const v=k-hk;if(v<-.12||v>.3||gone)continue;const dir=kind==='L'?1:-1,u=clamp((v+.12)/.16,0,1),hx=jx-dir*lerp(260,-40,u),hy=jy-60;ctx.save();ctx.translate(hx,hy);ctx.scale(dir,1);ctx.rotate(-.3+u*.5);BB.rrect(-70,-50,110,100,30,BB.lg(-50,50,['#ecc088','#b88246']),'#5a3a1e',5);for(let f=0;f<4;f++)BB.rrect(30,-48+f*25,60,22,10,'#ecc088','#5a3a1e',4);BB.rrect(-40,-80,40,40,14,'#ecc088','#5a3a1e',4);BB.rrect(-170,-22,110,44,10,BB.lg(-22,22,['#e2b272','#b07a40']),'#5a3a1e',4);ctx.restore();if(v>0&&v<.3)BB.text('SLAP!',jx+dir*150,jy-230-v*80,56,'#ffe066',{font:'Rammetto One',stroke:7})}
    for(const p of this.has||[]){const v=BB.t-p.t;if(v<1)BB.text(p.w,p.x,p.y-v*60,44*(1+.2*Math.exp(-v*8)),p.c,{stroke:6})}
    this.drawHero(k,t);
    // CLAP POWER-UP meter by Sprocket
    if(bar&&bar.pwr||(bar&&bar.clear&&k-(BS[bi])<.4)){const x=LCH.x-175,y=LCH.y-330,pw=clamp(this.pw||0,0,1);BB.rrect(x-30,y-30,60,240,20,'#1e2228','#fff',4);BB.rrect(x-22,y-22+224*(1-pw),44,224*pw,14,this.deluxe&&bar.tp&&bar.tp.w==='PRESTISSIMO'?BB.lg(y,y+210,['#ff5a5a','#ffb020','#ffe066','#6ee678','#5ac8fa','#b07aff']):BB.lg(y,y+210,['#fff38a','#ffb020']),null,0);BB.text('POWER',x,y+240,28,COL.yellow,{stroke:4});if(pw>=1)BB.text('FULL!',x,y-60,44,'#6ee678',{font:'Rammetto One',stroke:6})}
    if(k<.6&&BB.q){ctx.save();ctx.globalAlpha=.3*(1-Math.max(0,k)/.6);for(let i=0;i<30;i++){ctx.fillStyle=Math.random()<.5?'#fff':'#7ef0ff';ctx.fillRect(Math.random()*W,Math.random()*H,60+Math.random()*300,3+Math.random()*5)}ctx.restore()}
    {const sc=BB.t-(this.lastCl||-9);this.flinch=(since<.22&&last&&!KO_ATK(kd))||sc<.22;if(sc<.35&&!gone){const dir=(this.combo||0)%2?1:-1;jx+=dir*60*Math.exp(-sc*12);sq=Math.max(sq,.22*Math.exp(-sc*10));rot+=dir*.12*Math.exp(-sc*10)}if(hpf<.2&&!gone)rot+=Math.sin(t*3)*.06}
    if(gone&&k<KO_LAUNCH)this.drawTransform(k-KO_BIG,t);
    if(jy>-400&&jx<W+400&&!(k>=KO_BIG+.9)){ctx.save();ctx.translate(jx,jy);ctx.rotate(rot);ctx.scale(1+sq*.6,1-sq);BB.staticJr(0,230,300,{dizzy:hpf<.2||gone,flip:md==='sneak'&&Math.cos((k-KO_T0)/KO_B*Math.PI/2)<0,glitch:.2+.15*Math.sin(t*20),noShadow:gone});this.drawDmg(1-hpf,t,gone);ctx.restore();
      {const g=this.gag,gv=g?BB.t-g.t:9;if(g&&g.kind==='67'&&gv<g.dur){for(const sd of[-1,1]){const bob=Math.cos(gv*Math.PI/.8+(sd>0?Math.PI:0))*40;ctx.save();ctx.translate(jx+sd*190,jy-60+bob);BB.rrect(-45,-20,90,40,18,'#e2b272','#5a3a1e',5);BB.rrect(-30,-34,60,22,10,'#efe3c8','#5a3a1e',4);ctx.restore()}
        BB.text(gv<.8?'6...':'6... 7!',jx-330,jy-60,72,'#ffe066',{font:'Rammetto One',stroke:8})}
        if(g&&g.kind==='mw'&&gv<g.dur)BB.text('hee-hee!',jx-300,jy-60,64,'#ff8adf',{stroke:7});
        if(g&&g.kind==='mw'&&gv>g.dur+1.2)this.gag=null}
      if(k>KO_T0){ctx.save();ctx.strokeStyle='#bff8ff';ctx.lineWidth=3;for(let i=0;i<5;i++){const a=t*7+i*1.3,r=150+20*Math.sin(t*13+i);ctx.beginPath();ctx.moveTo(jx+Math.cos(a)*r,jy+40+Math.sin(a)*r*.6);ctx.lineTo(jx+Math.cos(a+.2)*(r+25),jy+40+Math.sin(a+.2)*r*.6-12);ctx.stroke()}ctx.restore()}
      if(bi>=14&&!gone)for(let i=0;i<4;i++){const a=t*5+i*Math.PI/2;BB.text('\u2605',jx+Math.cos(a)*110,jy-160+Math.sin(a)*26,40,'#ffe066',{stroke:4})}}
    if(md&&!gone&&!(this.gag&&BB.t-this.gag.t<2)){const lines={sneak:'tip... toe... hee hee',throw:'catch THIS!',freeze:'statues?! no fair!'};lines[md]&&R.bubble(jx,jy-200,lines[md])}
    const box=(x,y,s,r,lab)=>{ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.scale(s,s);BB.rrect(-70,-60,140,120,10,BB.lg(-60,60,['#e2b272','#b07a40']),'#5a3a1e',5);ctx.fillStyle='rgba(240,220,170,.85)';ctx.fillRect(-14,-60,28,120);if(lab)BB.text(lab,0,8,22,'#d24a3c',{font:'Rammetto One',stroke:0,maxW:130});ctx.restore()};
    const glove=(x,y,dir)=>{ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.fillStyle='#8a5a2e';ctx.fillRect(-900,-18,820,36);BB.rrect(-100,-60,150,120,40,BB.lg(-60,60,['#e2b272','#b07a40']),'#5a3a1e',6);BB.rrect(-40,-70,60,50,20,BB.lg(-70,-20,['#e8bd80','#c08850']),'#5a3a1e',5);ctx.restore()};
    for(const [hk,kind] of KO_HITS){const u=(k-(hk-.25))/.25;if(k<hk-1.3||k>hk+1)continue;const ty=JR.y-60;
      if(kind==='L'||kind==='R'){const dir=kind==='L'?1:-1,x0=kind==='L'?-120:W+120,x1=jx-dir*130,x=u<=1?lerp(x0,x1,ease.in?ease.in(u):u*u):lerp(x1,x0,Math.min(1,(u-1)*1.6));glove(x,ty+(kind==='L'?-20:20),dir)}
      if(kind==='rain'){for(let i=0;i<3;i++){const uu=u-i*.15;if(uu<0)continue;const y=uu<=1?lerp(-150,jy-330,uu*uu):jy-330-Math.sin(Math.min(1,(uu-1))*Math.PI)*160+(uu-1)*600*(uu-1);box(jx+(i-1)*90+(uu>1?(i-1)*(uu-1)*400:0),y,.8,uu*3*(i-1))}}
      if(kind==='zap'){const v=k-(hk-KO_B*1.5);if(v>0&&v<KO_B*1.5+.4){const p=v/(KO_B*1.5);const x=p<.5?lerp(jx-100,200,p*2):lerp(200,jx,(p-.5)*2),y=p<.5?lerp(jy-200,260,p*2):lerp(260,jy-200,(p-.5)*2);if(p<1){ctx.save();ctx.strokeStyle='#bff8ff';ctx.shadowColor='#7ef0ff';ctx.shadowBlur=24;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x-50,y-15);for(let i=0;i<5;i++)ctx.lineTo(x-50+i*25,y+(i%2?20:-20));ctx.stroke();ctx.restore();if(p>.3&&p<.6)BB.text('BOING! it bounced back!',200,200,34,'#fff',{stroke:5})}}}
      if(KO_ATK(kind)&&kind!=='zap'){/* v14.3.2: projectiles FLY AT THE SCREEN (perspective scale-up), aimed to match the dodge cue, then MISSED! on the screen edge */
        const fl=1.2,v=(k-(hk-fl))/fl;if(v<0||v>1.8)continue;const i=KO_HITS.findIndex(h=>h[0]===hk&&h[1]===kind),bp=kind==='bomb'?this.bombAt(i):null;
        const tg=kind==='junkL'?{x:170,y:520}:kind==='junkR'?{x:W-170,y:520}:kind==='junkT'?{x:W/2,y:90}:kind==='junkF'?{x:W/2,y:H-60}:{x:bp.x,y:bp.y};
        const junk=kind==='bomb'?'bomb':kind==='junkF'||kind==='junkR'&&i%2?'tire':kind==='junkT'?'sock':'chicken';
        if(v<1){const z=v*v,sc=.35+z*3.6,x=lerp(jx-40,tg.x,z),y=lerp(jy-120,tg.y,z)-Math.sin(v*Math.PI)*80*(1-z);ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);ctx.rotate(v*7);this.drawJunk(junk,t);ctx.restore();
          if(v>.55){ctx.save();ctx.globalAlpha=(v-.55)*1.6;ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=6;for(let q=0;q<5;q++){const a=q*1.26+t;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*sc*70,y+Math.sin(a)*sc*70);ctx.lineTo(x+Math.cos(a)*sc*110,y+Math.sin(a)*sc*110);ctx.stroke()}ctx.restore()}}
        else{const w=v-1,a=clamp(1-w/.8,0,1);ctx.save();ctx.globalAlpha=a;ctx.translate(tg.x,tg.y);
          if(kind==='bomb'){ctx.fillStyle='rgba(255,138,223,.55)';for(let q=0;q<9;q++){const r=60+(q%3)*40;ctx.beginPath();ctx.arc(Math.cos(q*.7)*r*1.4,Math.sin(q*.7)*r,44+(q%4)*16,0,7);ctx.fill()}BB.text('POOF! MISSED!',0,0,72,'#fff',{font:'Rammetto One',stroke:9,strokeCol:'#3a1040'})}
          else{ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=5;for(let q=0;q<7;q++){const an=q*.9;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(an)*60,Math.sin(an)*60);ctx.lineTo(Math.cos(an+.3)*140,Math.sin(an+.3)*140);ctx.stroke()}
            const sx=clamp(tg.x,330,W-330)-tg.x,sy=clamp(tg.y,140,H-160)-tg.y;BB.text(kind==='junkF'?'BOING! JUMPED IT!':'MISSED!',sx,sy,80,COL.yellow,{font:'Rammetto One',stroke:10,strokeCol:'#3a1040'})}
          ctx.restore()}
        continue}
      if(kind==='pick'){const a=u<=1?lerp(-1.9,.2,u*u):lerp(.2,-1.9,Math.min(1,(u-1)*1.5));ctx.save();ctx.translate(jx-260,jy-260);ctx.rotate(a+1.57);ctx.fillStyle='#8a5a2e';ctx.fillRect(-10,-260,20,260);ctx.translate(0,-260);ctx.beginPath();ctx.moveTo(-90,10);ctx.quadraticCurveTo(0,-40,90,10);ctx.lineTo(0,-10);ctx.closePath();ctx.fillStyle='#c9d6de';ctx.fill();ctx.strokeStyle=COL.ink;ctx.lineWidth=4;ctx.stroke();ctx.restore()}
      if(kind==='pat'){const y=u<=1?lerp(-150,jy-210,u*u):jy-210-Math.sin(Math.min(1,u-1)*Math.PI)*60;box(jx,y,.9,0,'PAT!')}
      if(kind==='stamp'){const y=u<=1?lerp(-300,jy-260,u*u):lerp(jy-260,-300,Math.min(1,(u-1)*1.5));ctx.save();ctx.fillStyle='#7d8c96';ctx.fillRect(jx-14,-20,28,y+20);BB.rrect(jx-110,y,220,70,10,BB.lg(y,y+70,['#c9d6de','#7d8c96']),COL.ink,5);BB.rrect(jx-100,y+70,200,22,6,'#d24a3c',COL.ink,4);ctx.restore()}
      if(kind==='push'){const x=u<=1?lerp(W+300,jx+230,u):jx+230+(u-1)*900,fy=JR.y+150;ctx.save();BB.rrect(x-40,fy-150,230,150,18,BB.lg(fy-150,fy,['#ffd63c','#d9a020']),COL.ink,5);BB.rrect(x+30,fy-250,120,110,12,'rgba(126,240,255,.25)',COL.ink,5);ctx.fillStyle='#3d4650';ctx.fillRect(x-160,fy-40,140,16);ctx.fillRect(x-30,fy-260,16,240);ctx.fillStyle='#1e2228';ctx.beginPath();ctx.arc(x+20,fy+10,32,0,7);ctx.arc(x+150,fy+10,32,0,7);ctx.fill();ctx.restore()}
      if(kind==='stomp'&&u>=1&&u<1.6){ctx.save();ctx.globalAlpha=1.6-u;ctx.strokeStyle='#ffe066';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(JR.x,JR.y+10,(u-1)*600,(u-1)*80,0,0,7);ctx.stroke();ctx.restore()}}
    {const u=(k-(KO_LAUNCH-.6))/.3;if(u>=0&&u<5){const L=k>=KO_LAUNCH,x=L?jx-200:u<=1?lerp(-300,JR.x-200,ease.out(u)):JR.x-200,y=L?jy-60:JR.y-60;if(L){ctx.save();ctx.translate(x,y);ctx.rotate(rot*.3);ctx.translate(-x,-y)}if(k>KO_LAUNCH-.15&&!L)this.drawMini(JR.x-200,JR.y-250-Math.sin(t*30)*6,.5,t);box(x,y,this.deluxe?2.8:2.1,u<=1?0:-.05*(u-1),this.deluxe?'DELUXE ULTRA RETURN':'RETURN TO SENDER');if(L)ctx.restore()}}
    // POW words on each hit
    const WD={pick:['TINK!','CLINK!'],pat:['PAT!','PAT-PAT!'],stamp:['STAMP!','KA-CHUNK!'],push:['SHOVE!','VROOM!'],chunk:['SUPER BEAT BLAST!'],L:['POW!','BONK!','BAM!'],R:['WHAM!','BOP!','SMACK!'],stomp:['THUD!'],rain:['CLONK!'],zap:['ZZT-OOPS!']};
    KO_HITS.forEach(([hk,kind],i)=>{const v=k-hk;if(kind==='big'||v<0||v>=.4||!WD[kind])return;const w=WD[kind][i%WD[kind].length],s=1+.4*Math.exp(-v*12);ctx.save();ctx.translate(JR.x+(kind==='R'?-240:240),JR.y-300-v*40);ctx.scale(s,s);ctx.rotate(i%2?.12:-.12);BB.text(w,0,0,76,COL.yellow,{font:'Rammetto One',stroke:9});ctx.restore()});
    {const v=k-KO_LAUNCH;if(v>=0&&v<1.4){const s=.6+.6*(ease.back?ease.back(clamp(v/.3,0,1)):1);ctx.save();ctx.translate(W/2+220,330);ctx.scale(s,s);ctx.rotate(-.08);BB.text('KA-BOING!',0,0,120,'#ff8adf',{font:'Rammetto One',stroke:12,strokeCol:'#3a1040'});ctx.restore()}}
    if(k>KO_LAUNCH+.2&&k<KO_LAUNCH+1.4)BB.text('beep-boop-byeee...!',Math.min(W-200,JR.x+(k-KO_LAUNCH)*900),Math.max(80,JR.y-(k-KO_LAUNCH)*1100),40,'#fff',{stroke:6});
    if(md==='freeze'){ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#bff8ff';ctx.fillRect(0,0,W,H);ctx.restore()}
    // move card: what to do NOW, 4 beat lights, and what's NEXT
    if(bar&&bi>=0&&!(gone&&k>KO_BIG+1)){const bb=bt-bi*4,pop=1+.06*Math.exp(-(bb%1)*10),cx=W/2,cy=150;ctx.save();ctx.translate(cx,cy);ctx.scale(pop,pop);
      BB.panel(-560,-110,1120,220,30);this.koIcon(bar.ic,-440,-10,t);
      let txt=bar.cue;if(bar.count===1)txt=bar.tp?bar.cue:bar.cue+'  '+['1','2','3','4'][Math.min(3,bb|0)];if(bar.count===2)txt='EVERYBODY GET LOW... '+['1','2','3','4'][Math.min(3,bb|0)];
      BB.text(txt,60,-20,txt.length>16?54:78,COL.yellow,{font:'Rammetto One',stroke:8,maxW:820});
      for(let q=0;q<4;q++)BB.rrect(-110+q*90,50,60,34,12,q===(bb|0)?'#6ee678':'#2d4744','#fff',3);ctx.restore();
      const nx=KO_BARS[bi+1];if(nx&&bb>2&&!(KO_BARS[bi]&&(KO_BARS[bi].chant||KO_BARS[bi].chantIntro)))BB.text('NEXT: '+nx.cue,cx,cy+150,34,'#fff',{stroke:5,maxW:900});
      if(bb%1<.5&&!bar.count&&!bar.chant&&!bar.chantIntro)R.bubble(LCH.x+20,LCH.y-300,bar.cue.toLowerCase())}
    if(!this.cel)(this.q||(f=>f())).call(this,()=>BB.button(W-300,30,260,90,'SKIP',{size:40,id:'koskip',onClick:()=>this.skipKO()}));
    if(k>KO_CEL){const a=clamp((k-KO_CEL)/.4,0,1),s=.7+.3*ease.back(a);ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,190);ctx.scale(s,s);BB.text('DELIVERY DOCK FIXED!',0,0,92,'#ffd63c',{font:'Rammetto One',stroke:12,strokeCol:'#782814'});
      if(BB.V2.chip){const im=BB.V2.chip,h=150,w=im.width*h/im.height;BB.glow(0,170,110,'rgba(255,220,120,A)',.5);ctx.drawImage(im,-w/2,170-h/2,w,h)}BB.text('Level 4 Beat Chip earned!',0,275,40,'#fff',{stroke:6});
      BB.panel(-430,320,860,90,24);BB.text('Great work, Rhythm Engineers!',0,366,44,COL.yellow,{stroke:5});ctx.restore();
      if(this.deluxe){ctx.save();ctx.globalAlpha=a;ctx.translate(W-250,520);ctx.rotate(.12+Math.sin(t*2)*.04);for(let j=0;j<16;j++){ctx.fillStyle=['#ff5a5a','#ffb020','#ffe066','#6ee678','#5ac8fa','#b07aff'][j%6];ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,140,j*Math.PI/8,(j+1)*Math.PI/8);ctx.fill()}ctx.fillStyle='#ffd63c';ctx.beginPath();ctx.arc(0,0,105,0,7);ctx.fill();ctx.strokeStyle='#782814';ctx.lineWidth=6;ctx.stroke();BB.text('DELUXE',0,-22,40,'#782814',{font:'Rammetto One',stroke:0});BB.text('ULTRA',0,26,44,'#782814',{font:'Rammetto One',stroke:0});ctx.restore()}
      else{ctx.save();ctx.globalAlpha=a*.95;BB.panel(W/2-430,700,860,110,24);BB.text('Beat Chips: '+(this.chips||0)+' of 4',W/2,735,34,'#ffd63c',{stroke:4});BB.text('Collect all 4 Beat Chips to unlock DELUXE ULTRA!',W/2,780,30,'#fff',{stroke:4,maxW:820});ctx.restore()}}}
  heroV(k){let best=null;for(const h of this.heroes||[]){const v=k-h.t,w=h.w||.6;if(v>-w-.1&&v<.8&&(best==null||Math.abs(v)<Math.abs(best))){best=v;this.heroS=h.style;this.heroW=w}}return best}
  drawSpeed(t){/* green CLAP NOW border (reused from the YOUR TURN cue) + live tempo gauge */
    const c=this.cpm||0,ti=tierOf(c),fire=ti===4;R.turnBorder(true);
    const w=480,x=W/2-w/2-20,y=H-240;BB.panel(x,y,w+40,210,26);BB.text('CLAP SPEED',x+20+w/2,y+40,26,'#ffd84a',{stroke:0});
    TIERS.forEach(([n,lo,col],i)=>{const hi=(TIERS[i+1]||[0,240])[1],x0=x+20+lo/240*w,x1=x+20+hi/240*w;ctx.globalAlpha=i<=ti?1:.3;BB.rrect(x0+2,y+60,x1-x0-4,30,8,col,null,0);ctx.globalAlpha=1});
    const nx=x+20+clamp(c,0,240)/240*w;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(nx,y+94);ctx.lineTo(nx-12,y+114);ctx.lineTo(nx+12,y+114);ctx.fill();
    const s=1+.15*Math.exp(-(BB.t-(this.lastCl||0))*8);ctx.save();ctx.translate(x+20+w/2,y+152);ctx.scale(s,s);BB.text(TIERS[ti][0],0,0,ti===4?50:56,TIERS[ti][2],{stroke:8});ctx.restore();
    if(this.combo>2&&BB.t-this.lastCl<.8)BB.text('COMBO x'+this.combo+'!',x+w+180,y+105,52,'#ffe066',{stroke:8});
    if(fire){const f=1+.08*Math.sin(t*25);ctx.save();ctx.translate(W/2,H-300);ctx.scale(f,f);BB.text('ON FIRE!',0,0,90,'#ffb020',{stroke:14,strokeCol:'#7a1a00'});ctx.restore();BB.burst(W/2+(Math.random()-.5)*400,H-300,1,{cols:['#ff5a20','#ffb020','#ffe066'],kind:'spark',size:12,speed:200,g:-400,life:.8})}}
  drawFist(x,y,s,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);BB.rrect(-170,-60,170,120,20,BB.lg(-60,60,['#e2b272','#b07a40']),'#5a3a1e',6);BB.rrect(-10,-95,150,190,46,BB.lg(-95,95,['#ecc088','#b88246']),'#5a3a1e',7);ctx.strokeStyle='#5a3a1e';ctx.lineWidth=6;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(60,-95+48*(i+1));ctx.lineTo(140,-95+48*(i+1));ctx.stroke()}BB.rrect(0,30,70,46,18,'#ecc088','#5a3a1e',6);ctx.fillStyle='rgba(240,220,170,.85)';ctx.fillRect(-170,-12,170,24);ctx.restore()}
  drawHero(k,t){/* SLOW-MO HERO PUNCH: windup .6 s (time 'slows': vignette, zoom, speed lines, creeping fist) -> lands exactly on the beat -> KA-POW snap */
    const v=this.heroV(k);if(v==null)return;const st=this.heroS,tx=JR.x,ty=JR.y-90;
    if(v<0){const u=clamp(1+v/this.heroW,0,1),p=u<.85?u/.85*.75:.75+(u-.85)/.15*.25;ctx.save();ctx.globalAlpha=.55*u;const g=ctx.createRadialGradient(tx,ty,150,tx,ty,1100);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(10,0,30,1)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();
      ctx.save();ctx.globalAlpha=.6*u;ctx.strokeStyle='#fff';ctx.lineWidth=4;for(let i=0;i<28;i++){const a=i/28*Math.PI*2+i*.37,r0=260+((i*97)%120),r1=r0+300+u*200;ctx.beginPath();ctx.moveTo(tx+Math.cos(a)*r0,ty+Math.sin(a)*r0);ctx.lineTo(tx+Math.cos(a)*r1,ty+Math.sin(a)*r1);ctx.stroke()}ctx.restore();
      BB.text(st===3?'SUPER SLOW-MO...':'SLOW-MO...',W/2,250,52,'#bff8ff',{stroke:6});
      const fs=[[[tx-40,H+260],[tx-10,ty+60],-Math.PI/2.4]],hay=[[[-260,ty-40],[tx-150,ty-20],0]],dbl=[[[-260,ty+40],[tx-160,ty],0],[[W+260,ty+40],[tx+160,ty],Math.PI]];
      for(const [[ax,ay],[bx,by],r] of [fs,hay,dbl,[...fs,...dbl]][st])this.drawFist(lerp(ax,bx,p),lerp(ay,by,p),.9+.6*p,r)}
    else{if(v<.14){ctx.fillStyle=`rgba(255,255,240,${.85*(1-v/.14)})`;ctx.fillRect(0,0,W,H)}
      const word=['KA-POW!','BAM-WHAM!','DOUBLE POW!',this.deluxe?'DELUXE KA-BOOM!':'ULTRA KA-BOOM!'][st],s=v<.12?lerp(3,1,v/.12):1+.05*Math.sin(t*30);ctx.save();ctx.globalAlpha=clamp((.8-v)/.2,0,1);ctx.translate(tx,ty-250);ctx.rotate(-.12);ctx.scale(s,s);
      ctx.fillStyle='#ffe066';ctx.beginPath();for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=i%2?150:260;ctx.lineTo(Math.cos(a)*r*1.6,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.strokeStyle='#782814';ctx.lineWidth=8;ctx.stroke();
      BB.text(word,0,0,110,'#ff5a5a',{font:'Rammetto One',stroke:12,strokeCol:'#fff'});ctx.restore();
      if(v<.3){const fs=[[tx-10,ty+60-v*200,-Math.PI/2.4]],hay=[[tx-150+v*100,ty-20,0]],dbl=[[tx-160,ty,0],[tx+160,ty,Math.PI]];for(const [x,y,r] of [fs,hay,dbl,[...fs,...dbl]][st])this.drawFist(x,y,1.5,r)}}}
  drawMini(x,y,s,t,o={}){/* 'Static Mini': ORIGINAL chunky retro handheld villain (crimson + charcoal, cyan static screen). No real brand, logo or likeness. */
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(o.rot||0);
    ctx.strokeStyle='#2a2d33';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-40,140);ctx.lineTo(-48,190);ctx.moveTo(40,140);ctx.lineTo(48,190);ctx.stroke();BB.rrect(-72,182,52,20,8,'#2e1a0e',null,0);BB.rrect(22,182,52,20,8,'#2e1a0e',null,0);
    ctx.strokeStyle='#2a2d33';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(60,-150);ctx.lineTo(85,-215);ctx.stroke();ctx.fillStyle='#7ef0ff';ctx.beginPath();ctx.arc(85,-215,10+3*Math.sin(t*30),0,7);ctx.fill();
    BB.rrect(-110,-160,220,310,30,BB.lg(-160,150,['#f0525a','#a8202a']),'#4a0e14',7);BB.rrect(-110,-160,220,40,30,'rgba(255,255,255,.12)',null,0);
    BB.rrect(-88,-130,176,140,14,'#1e2228',null,0);BB.rrect(-72,-116,144,112,6,'#7ef0ff',null,0);
    ctx.save();ctx.beginPath();ctx.rect(-72,-116,144,112);ctx.clip();for(let i=0;i<40;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.5})`;ctx.fillRect(-72+Math.random()*144,-116+Math.random()*112,6+Math.random()*12,3)}
      const P=(cx,cy,c)=>{ctx.fillStyle=c||'#14243a';ctx.fillRect(cx*8-60,cy*8-110,8,8)};const fl=Math.sin(t*16)>0;
      [[2,3],[3,4],[4,5],[10,5],[11,4],[12,3]].forEach(([a,b])=>P(a,b));[[4,6],[10,6]].forEach(([a,b])=>{P(a,b,'#d8203a');P(a,b+1,'#d8203a')});for(let i=4;i<=10;i++)P(i,fl?10:11);P(3,fl?11:10);P(11,fl?11:10);ctx.restore();
    ctx.fillStyle='#2a2d33';ctx.fillRect(-80,45,22,62);ctx.fillRect(-100,65,62,22);ctx.fillStyle='#ffd63c';ctx.beginPath();ctx.arc(52,82,16,0,7);ctx.arc(85,58,16,0,7);ctx.fill();ctx.strokeStyle='#4a0e14';ctx.lineWidth=4;ctx.stroke();
    ctx.strokeStyle='rgba(60,8,12,.6)';ctx.lineWidth=5;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(30+i*14,140);ctx.lineTo(55+i*14,112);ctx.stroke()}
    ctx.restore()}
  drawTransform(v,t){/* final defeat: wrecked Jr glitches -> POOF -> shrinks into the evil handheld -> angry 8-bit squeak -> box swallows it */
    const x=JR.x,y=JR.y;if(v<.9){ctx.save();ctx.globalAlpha=.25+.25*Math.sin(t*50);for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#7ef0ff':'#ff8adf';ctx.fillRect(x-200+Math.random()*400,y-300+Math.random()*420,80+Math.random()*120,10)}ctx.restore();BB.text('BZZT! GLITCH!',x,y-380,56,'#bff8ff',{stroke:7})}
    if(v>=.9&&v<1.5){const u=(v-.9)/.6;if(!this.poofed){this.poofed=1;BB.shake(16);BB.burst(x,y-80,50,{cols:['#fff','#e8e0d0','#7ef0ff'],kind:'star',size:18,speed:900,g:100})}ctx.save();ctx.globalAlpha=1-u;ctx.fillStyle='#f4f0e6';for(let i=0;i<9;i++){const a=i/9*7;ctx.beginPath();ctx.arc(x+Math.cos(a)*(90+u*140),y-80+Math.sin(a)*(70+u*100),70+u*40,0,7);ctx.fill()}ctx.restore();BB.text('POOF!',x,y-80,110*(1+u*.3),'#ff8adf',{font:'Rammetto One',stroke:12,strokeCol:'#3a1040'})}
    if(v>=1&&v<KO_TF-.15){const g=clamp((v-1)/.35,0,1),s=lerp(2.2,.75,ease.out?ease.out(g):g),hop=v>1.4?Math.abs(Math.sin((v-1.4)*9))*40:0,ang=v>1.4?Math.sin(v*40)*.06:0;
      const jx2=v>KO_TF-.6?lerp(x,x-200,(v-(KO_TF-.6))/.45):x,jy2=v>KO_TF-.6?y-100-Math.sin((v-(KO_TF-.6))/.45*Math.PI)*220:y-100;this.drawMini(jx2,jy2-hop,s,t,{rot:ang});
      if(v>1.4&&v<KO_TF-.6){BB.panel(x-770,y-450,580,200,26);BB.text('BEEP-BOOP! BZZT!',x-480,y-390,34,'#7ef0ff',{stroke:0});BB.text("YOU HAVEN'T SEEN",x-480,y-340,38,'#fff',{stroke:0});BB.text('THE LAST OF ME!!',x-480,y-296,38,'#ff5a5a',{stroke:0})}}}
  drawCard(b,u,t){/* Speed Read card: ta / ti-ti / tika-tika, ONE glyph size for every note */
    const cx=760,cy=345,w=620,h=230,pre=u<0;ctx.save();ctx.globalAlpha=pre?.75:1;const pop=pre?1:1+.05*Math.exp(-u*12);ctx.translate(cx,cy);ctx.scale(pop,pop);
    BB.panel(-w/2,-h/2,w,h,26);
    BB.text((pre?'NEXT: ':'')+'AIR JUGGLE '+(b.cardN+1)+'  '+b.tw+'!',0,-h/2+40,32,'#ffd84a',{stroke:0});
    const cw=(w-60)/4,bh=h-90,y0=-h/2+66;
    b.read.forEach((k,i)=>{const x=-w/2+30+i*cw,on=!pre&&Math.floor(u*4)===i;if(on)BB.rrect(x+2,y0-4,cw-4,bh+8,14,'rgba(110,230,120,.35)','#6ee678',3);
      R.tile(k,x+4,y0,cw-8,bh,{ns:R.cardNs(k,cw,bh,1),shadow:false,label:true})});
    if(!pre){const px=-w/2+30+u*(w-60);ctx.fillStyle='#ffd84a';ctx.fillRect(px-3,y0-6,6,bh+12)}ctx.restore()}
  drawStandoff(v,t){/* ~23 s face-off: wind + packing peanut, staredown, Jr's silly rhythm smack talk, Sprocket answers, COME AT ME, BRO!, FIGHT! */
    const SJ=[[3.3,'bb_sj1','Your claps are softer than a marshmallow!'],[5.8,'bb_sj2',"I've heard louder sneezes!"],[8.3,'bb_sj3','My grandma TV has better rhythm!'],[10.8,'bb_sj7',"I've seen kindergartners with better rhythm!"],[13.3,'bb_sj4','Ti-ti? More like tee-hee!'],[15.8,'bb_sp1','Rhythm Engineers... let\'s show him!'],[17.6,'bb_sj5',"I ate all your WHOLE notes... now I'm gonna eat your HALVES!"],[20.2,'bb_sj6','COME AT ME, BRO!']];
    for(const [a,id] of SJ)if(v>=a&&!this['so'+id]){this['so'+id]=1;BB.say(id,{overlap:true})}
    const fx=v<1.5?lerp(W+300,JR.x,ease.out?ease.out(v/1.5):v/1.5):JR.x,hop=v<1.5?Math.abs(Math.sin(v*8))*50:Math.abs(Math.sin(t*3))*6;
    ctx.save();ctx.strokeStyle='rgba(238,228,204,.35)';ctx.lineWidth=4;for(let i=0;i<9;i++){const y=420+i*60,x=((t*900+i*377)%(W+600))-300;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+160,y-6);ctx.stroke()}ctx.restore();
    {const px=((v*420)%(W+400))-200,py=820-Math.abs(Math.sin(v*5))*80;ctx.save();ctx.translate(px,py);ctx.rotate(v*6);ctx.fillStyle='#f4ecd8';ctx.strokeStyle='#b8a888';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(-14,0,20,14,0,0,7);ctx.ellipse(14,0,20,14,0,0,7);ctx.fill();ctx.stroke();ctx.restore()}
    const stare=v>=1.5&&v<3.5;if(stare){ctx.save();ctx.globalAlpha=.5;ctx.fillStyle='#000';ctx.fillRect(0,0,W,110);ctx.fillRect(0,H-110,W,110);ctx.restore();BB.text('. . .',LCH.x+20,LCH.y-330,64,'#fff',{stroke:6});BB.text('. . .',JR.x,JR.y-360,64,'#fff',{stroke:6});BB.text('THE STANDOFF',W/2,200,72,'#ffd63c',{font:'Rammetto One',stroke:10,strokeCol:'#782814'})}
    if(v>1.6&&v<3.6)this.q(()=>{const a=clamp(Math.min((v-1.6)/.25,(3.6-v)/.25),0,1),sl=(1-a)*80;ctx.save();ctx.globalAlpha=a;
      BB.panel(60-sl,H-330,520,130,24);BB.text('SPROCKET',320-sl,H-290,52,'#7ef0ff',{font:'Rammetto One',stroke:7});BB.text('Chief Rhythm Engineer',320-sl,H-235,34,'#fff',{stroke:5});
      BB.panel(W-580+sl,H-330,520,130,24);BB.text('STATIC JR.',W-320+sl,H-290,52,'#ff8adf',{font:'Rammetto One',stroke:7});BB.text('Fuzz Menace (very silly)',W-320+sl,H-235,34,'#fff',{stroke:5});ctx.restore()})
    const beck=v>=20.2&&v<22;BB.staticJr(fx,JR.y+230-hop,300,{flip:true,glitch:.15+.1*Math.sin(t*20),rot:beck?Math.sin(t*10)*.08:0});
    if(beck){const bx=fx-190,by=JR.y-20,c=Math.sin(t*12);ctx.save();ctx.translate(bx,by);BB.rrect(-40,-30,70,60,22,BB.lg(-30,30,['#ecc088','#b88246']),'#5a3a1e',4);BB.rrect(-70,-14+c*10,40,22,10,'#ecc088','#5a3a1e',4);ctx.restore();BB.text('COME AT ME, BRO!',W/2+120,230,92,'#ff8adf',{font:'Rammetto One',stroke:12,strokeCol:'#3a1040'})}
    if(v>=17.6&&v<20.2){const u=v-17.6,S=BB.sfx,ch=Math.floor(u/.45);if(ch!==this.chompN&&u<1.9){this.chompN=ch;S.clunk&&S.clunk();S.pop&&S.pop()}if(u>=2&&!this.burped){this.burped=1;S.glitch&&S.glitch();BB.burst(JR.x-60,JR.y-120,20,{cols:['#7ef0ff','#fff'],kind:'spark',size:10,speed:400,g:-100})}
      const cw=220,bh=220,ns=R.cardNs('q',cw,bh,1);[['w',JR.x-560],['h',JR.x-560]].forEach(([nk,x],q)=>{if(q===0&&u>1)return;if(q===1&&(u<1||u>=2))return;const uu=q?u-1:u,bites=Math.min(3,Math.floor(uu/.33)),y=JR.y-260,sl=uu*120;
        R.tile(nk,x+sl,y,cw,bh,{ns,shadow:false,label:true});ctx.save();ctx.fillStyle='#3a2a22';for(let b=0;b<bites;b++){for(let m=0;m<3;m++){ctx.beginPath();ctx.arc(x+sl+cw+4,y+30+b*60+m*22,18,0,Math.PI*2);ctx.fill()}}ctx.restore();
        if(bites)BB.burst(x+sl+cw,y+bh/2,1,{cols:['#f4ecd8','#e2b272'],kind:'spark',size:8,speed:200,g:500})});
      if(u>=2)BB.text('BURP! bzzt!',JR.x-40,JR.y-260,56,'#7ef0ff',{font:'Rammetto One',stroke:7});else BB.text('CHOMP!',JR.x-300,JR.y-260,52,'#ffe066',{font:'Rammetto One',stroke:7})}
    let cur=null;for(const l of SJ)if(v>=l[0])cur=l;if(cur&&v<cur[0]+2.4&&cur[1]!=='bb_sj6'){if(cur[1]==='bb_sp1')R.bubble(LCH.x-10,LCH.y-310,cur[2].toLowerCase());else R.bubble(JR.x-40,JR.y-360,cur[2].toLowerCase(),'#2a6f8a')}
    if(v>=22){const u=v-22,s=u<.2?lerp(3.2,1,u/.2):1+.03*Math.sin(t*20);if(!this.fightSlam){this.fightSlam=1;BB.shake(26);BB.sfx.pkTa&&BB.sfx.pkTa();BB.sfx.bonk&&BB.sfx.bonk();BB.burst(W/2,480,50,{cols:['#ffe066','#ff8adf','#fff'],kind:'star',size:16,speed:1200,g:300})}ctx.save();ctx.translate(W/2,480);ctx.scale(s,s);BB.text('FIGHT!',0,0,220,'#ffd63c',{font:'Rammetto One',stroke:16,strokeCol:'#782814'});ctx.restore()}
    this.q(()=>BB.button(W-300,30,260,90,'SKIP',{size:40,id:'soskip',onClick:()=>{if(this.state==='intro')this.startKO()}}))}
  drawDmg(d,t,wreck){/* cumulative cartoon damage on Jr (local sprite coords: feet y=230, screen ~(-15,-40), antenna knob (0,-175)). No gore: dents, tape, patches, fuzz, stars. */
    if(wreck)d=1;const ink='#3a2a1e';ctx.save();
    const tape=(x,y,r,w=70)=>{ctx.save();ctx.translate(x,y);ctx.rotate(r);BB.rrect(-w/2,-12,w,24,6,'#f3e2c0','#b89a6a',2);ctx.fillStyle='#e8c9a0';ctx.fillRect(-8,-8,16,16);ctx.restore()};
    if(d>.2){ctx.strokeStyle='#2a2d33';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-178);ctx.lineTo(10,-205);ctx.lineTo(-6,-222);ctx.lineTo(22,-245);ctx.stroke();ctx.fillStyle='#ff5a5a';ctx.beginPath();ctx.arc(22,-245,9,0,7);ctx.fill();tape(-105,-120,-.6)}
    if(d>.4){ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(30,-95);ctx.lineTo(10,-60);ctx.lineTo(28,-35);ctx.moveTo(10,-60);ctx.lineTo(-20,-70);ctx.stroke();BB.rrect(-60,95,60,50,4,BB.lg(95,145,['#e2b272','#b07a40']),ink,3)}
    if(d>.6){ctx.strokeStyle='#8a8f99';ctx.lineWidth=4;for(let i=0;i<9;i++){const x=-70+i*17;ctx.beginPath();ctx.moveTo(x,-188);ctx.lineTo(x+(i%2?14:-10)+Math.sin(t*9+i)*4,-215-(i%3)*8);ctx.stroke()}
      ctx.save();ctx.translate(130,150);ctx.rotate(.5+.15*Math.sin(t*5));BB.rrect(-14,-10,28,90,10,'#f4f0e6',ink,3);ctx.restore();
      if(Math.sin(t*13)>.3)BB.burst&&0;ctx.strokeStyle='#ffe066';ctx.lineWidth=3;if(Math.floor(t*8)%3===0){ctx.beginPath();ctx.moveTo(110,-90);ctx.lineTo(135,-100);ctx.lineTo(125,-80);ctx.lineTo(150,-88);ctx.stroke()}}
    if(d>.8){tape(-15,-40,.7,150);tape(-15,-40,-.7,150)}
    if(this.flinch&&!wreck){ctx.fillStyle='#0e2a33';ctx.fillRect(-115,-105,200,130);ctx.strokeStyle='#7ef0ff';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-80,-75);ctx.lineTo(-50,-55);ctx.lineTo(-80,-35);ctx.moveTo(50,-75);ctx.lineTo(20,-55);ctx.lineTo(50,-35);ctx.moveTo(-60,0);for(let i=0;i<6;i++)ctx.lineTo(-60+i*20+10,i%2?-12:0);ctx.stroke();BB.text('OOF!',90,-170,40,'#fff',{font:'Rammetto One',stroke:6})}
    ctx.restore()}
  /* v14.3.4 CAMERA: gentle action-movie moves (zoom always >= tilt cover, max 1.14x, max 2 deg tilt, eased; no shake added here) */
  q(f){(this.qq=this.qq||[]).push(f)}
  camFor(k){const E=x=>{x=clamp(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2},win=(v,a,b,r=.4)=>E((v-a)/r)*(1-E((v-b+r)/r));let z=1,cx=W/2,cy=H/2,rot=0,px=0,lb=0;
    if(this.state==='intro'&&this.move&&k>=14){const v=k-14;
      {const w=win(v,1.5,3.6,.5);z+=.08*w;lb=Math.max(lb,w)}
      for(const a of[3.3,5.8,8.3,10.8,13.3,17.6]){const w=win(v,a,a+(a===17.6?2.6:2.4),.35);rot-=.035*w;z+=.075*w;cx=lerp(cx,JR.x-120,w*.6);cy=lerp(cy,JR.y-100,w*.6)}
      {const w=win(v,15.8,18,.35);z+=.12*w;cx=lerp(cx,LCH.x+80,w*.7);cy=lerp(cy,LCH.y+120,w*.7)}
      {const w=win(v,20.2,22,.3);z+=.1*w;cx=lerp(cx,JR.x,w*.6)}
      lb=Math.max(lb,win(v,0,3.8,.6),win(v,20.2,23,.3))}
    if(this.state==='end'){const bi=barAt(k),b=KO_BARS[bi],u=b?(k-BS[bi])/BL[bi]:0,p=KO_BARS[bi-1];
      if(b&&p&&p.turn!==b.turn&&b.turn&&u<.3){const d=(b.turn==='us'?-1:1)*50*(1-E(u/.3));px+=d;z+=.04*(1-E(u/.3))}
      if(b&&b.chantIntro){z+=.05*(1-E(u))}
      if(b&&b.shout){const w=Math.sin(Math.min(1,u)*Math.PI);z+=.05*w;cx=lerp(cx,JR.x-200,w*.6);cy=lerp(cy,JR.y-60,w*.6)}
      if(b&&b.chant==='all'&&b.lay===4){z+=.03+.02*Math.sin(k*Math.PI*110/60/2)}
      if(k>KO_BIG&&k<KO_CEL+1){const w=E((k-KO_BIG)/.6)*(1-E((k-KO_CEL)/1));z+=.07*w;px+=Math.sin((k-KO_BIG)*.9)*60*w;lb=Math.max(lb,w)}}
    z=Math.min(z,1.16);rot=Math.max(rot,-.04);const need=1+Math.abs(rot)*1.9+Math.abs(px)/W*2;z=Math.max(z,need);
    const mx=(z-1)*W/2,my=(z-1)*H/2;let tx=(W/2-cx)*(z-1),ty=(H/2-cy)*(z-1);tx=clamp(tx+px,-mx,mx);ty=clamp(ty,-my,my);return{z,rot,tx,ty,lb}}
  drawLetterbox(lb){if(lb<=.01)return;const h=78*lb;ctx.save();ctx.fillStyle='#0b0f14';ctx.fillRect(0,0,W,h);ctx.fillRect(0,H-h,W,h);ctx.restore()}
  drawReplay(k,t){if(this.state!=='end')return;const bi=barAt(k),b=KO_BARS[bi],p=KO_BARS[bi-1];if(!b||!p||!(p.shout&&p.ws[0]==='RHYTHM ENGINEERS!')&&!(KO_BARS[bi-2]&&KO_BARS[bi-2].shout&&KO_BARS[bi-2].ws[0]==='RHYTHM ENGINEERS!'))return;
    const v=k-BS[KO_BARS.indexOf(p.shout?p:KO_BARS[bi-2])+1];if(v<0||v>2.6)return;const a=clamp(Math.min(v/.2,(2.6-v)/.3),0,1),x=W-470,y=H-420,w=420,h=280;
    ctx.save();ctx.globalAlpha=a;BB.panel(x,y,w,h,24);ctx.beginPath();ctx.rect(x+14,y+14,w-28,h-28);ctx.clip();ctx.fillStyle='#24323a';ctx.fillRect(x+14,y+14,w-28,h-28);
    const s=v*.35,jx=x+120+s*260,jy=y+190-Math.sin(Math.min(1,s)*Math.PI)*90;ctx.translate(jx,jy);ctx.rotate(s*5);ctx.scale(.42,.42);BB.staticJr(0,230,300,{dizzy:true,glitch:.3});ctx.restore();
    ctx.save();ctx.globalAlpha=a;BB.text('REPLAY',x+90,y+52,40,'#ff5a5a',{font:'Rammetto One',stroke:6});BB.text('slow-mo x4',x+w-100,y+h-36,30,'#fff',{stroke:5});ctx.restore()}
  drawChant(k,t){const bi=barAt(k),b=KO_BARS[bi];if(!b||!(b.chant||b.chantIntro))return;const bt=(k-BS[bi])/BL[bi]*4,beat=Math.min(3,Math.floor(bt)),fr=bt-beat,pw=1140,ph=250,px=W/2-pw/2,py=300,ee=1-Math.pow(1-clamp((k-BS[bi])/.3,0,1),3),cw=pw/4;
    ctx.save();if(b.chantIntro){const s=lerp(.6,1,ee);ctx.translate(W/2,py+ph/2);ctx.scale(s,s);ctx.translate(-W/2,-(py+ph/2));BB.panel(px,py,pw,ph,30);BB.text('SING-ALONG!',W/2,py+100,90,'#ffe066',{font:'Rammetto One',stroke:9});BB.text('STOMP  STOMP  CLAP!  Everybody sing!',W/2,py+190,48,'#fff',{stroke:6});ctx.restore();return}
    BB.panel(px,py,pw,ph,30);const hd={lead:['SPROCKET SINGS...','#7ec8ff'],echo:['YOUR TURN! SING IT BACK!','#6ee678'],crowd:['EVERYBODY SHOUT!','#ff8adf'],all:['EVERYBODY TOGETHER!','#ffe066']}[b.chant];
    BB.text(hd[0],W/2,py+46,40,hd[1],{stroke:5});
    if(b.ws.length===1){const s=b.shout?1+.25*Math.exp(-((k-BS[bi])*6)):1;ctx.save();ctx.translate(W/2,py+140);ctx.scale(s,s);BB.text(b.ws[0],0,0,b.shout?84:76,b.shout?'#ffe066':'#fff',{font:b.shout?'Rammetto One':'Lilita One',stroke:9,maxW:pw-80});ctx.restore()}
    else{b.ws.forEach((w,i)=>{const x=px+cw*(i+.5),on=i===beat;BB.text(w,x,py+140-(on?8*Math.sin(Math.min(1,fr*3)*Math.PI):0),on?74:64,on?'#ffe066':i<beat?'#cfe8ff':'#ffffff',{stroke:on?9:6})});
      ctx.save();ctx.fillStyle='#ff8adf';ctx.strokeStyle='#3a1040';ctx.lineWidth=4;ctx.beginPath();ctx.arc(px+cw*(beat+.5),py+86-Math.abs(Math.sin(fr*Math.PI))*30,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore()}
    for(const[x,ic]of[[0,'S'],[.5,'S'],[1,'C'],[2,'S'],[2.5,'S'],[3,'C']]){const on=bt>=x&&bt<x+.4,cx=px+cw*(Math.floor(x)+.5)+(ic==='C'?0:x%1?36:-36),cy=py+214,sc=on?1.25:1;ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);
      if(ic==='S')BB.text('STOMP',0,8,on?24:20,on?'#ffe066':'#e2b272',{stroke:4});else BB.text('CLAP!',0,8,on?30:24,on?'#ffe066':'#cfe8ff',{stroke:4});ctx.restore()}
    if((beat===1||beat===3)&&fr<.25){ctx.save();ctx.globalAlpha=.1*(1-fr/.25)*((b.lay||1)/2);ctx.fillStyle='#fff3c0';ctx.fillRect(0,0,W,H);ctx.restore()}
    ctx.restore()}
  drawReward(k,t){/* v14.3.2 reward intro (~14 s, SKIP): factory fixed, Levels 1-4 badges, then the reward reveal */
    ctx.save();ctx.fillStyle='rgba(8,12,24,.55)';ctx.fillRect(0,0,W,H);ctx.restore();
    if(k<8){const s=k<.3?lerp(2.6,1,k/.3):1+.03*Math.sin(t*6);ctx.save();ctx.translate(W/2,215);ctx.scale(s,s);BB.text('YOU FIXED THE FACTORY!',0,0,88,'#ffd63c',{font:'Rammetto One',stroke:12,strokeCol:'#782814'});ctx.restore();
      const L=[['LEVEL 1','gear','#6ee678'],['LEVEL 2','box','#5ac8fa'],['LEVEL 3','bolt','#ff8adf'],['LEVEL 4','truck','#ffd63c']];
      L.forEach(([n,ic,c],i)=>{const v=k-(1.6+i*1.2);if(v<0)return;const sc=ease.back?ease.back(clamp(v/.4,0,1)):1,x=W/2-450+i*320,y=540;if(v<.05&&!this['bd'+i]){this['bd'+i]=1;BB.sfx.pkTa&&BB.sfx.pkTa();BB.sfx.chime&&BB.sfx.chime();BB.burst(x,y,24,{cols:[c,'#fff','#ffe066'],kind:'star',size:12,speed:700,g:300})}
        ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,120,0,7);ctx.fill();ctx.strokeStyle='#eee4cc';ctx.lineWidth=8;ctx.stroke();ctx.fillStyle='#1d3b38';ctx.beginPath();ctx.arc(0,0,96,0,7);ctx.fill();
        if(ic==='gear'){ctx.fillStyle=c;for(let j=0;j<8;j++){ctx.save();ctx.rotate(j*Math.PI/4+t*.5);ctx.fillRect(-12,-70,24,28);ctx.restore()}ctx.beginPath();ctx.arc(0,0,48,0,7);ctx.fill();ctx.fillStyle='#1e3b38';ctx.beginPath();ctx.arc(0,0,18,0,7);ctx.fill()}
        else if(ic==='box'){BB.rrect(-55,-45,110,90,8,BB.lg(-45,45,['#e2b272','#b07a40']),'#5a3a1e',5);ctx.fillStyle='rgba(240,220,170,.85)';ctx.fillRect(-10,-45,20,90)}
        else if(ic==='bolt'){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(10,-70);ctx.lineTo(-40,10);ctx.lineTo(0,10);ctx.lineTo(-12,70);ctx.lineTo(42,-14);ctx.lineTo(4,-14);ctx.closePath();ctx.fill()}
        else{BB.rrect(-70,-35,90,60,8,'#e8e0d0','#5a3a1e',4);BB.rrect(20,-20,48,45,8,'#6fd0b8','#5a3a1e',4);ctx.fillStyle='#1e2228';ctx.beginPath();ctx.arc(-45,32,13,0,7);ctx.arc(40,32,13,0,7);ctx.fill()}
        BB.text(n,0,158,40,'#fff',{stroke:6});BB.text('COMPLETE!',0,198,30,c,{stroke:5});ctx.restore()})
      if(k>2)R.bubble(LCH.x-10,LCH.y-310,'woo-hoo! party time!')}
    else if(k<11.2){const v=k-8,s=v<.3?lerp(3,1,v/.3):1+.04*Math.sin(t*8);if(v<.05&&!this.rvl){this.rvl=1;BB.shake(18);BB.sfx.pkTa&&BB.sfx.pkTa();BB.sfx.bonk&&BB.sfx.bonk();BB.burst(W/2,400,50,{cols:['#ffe066','#ff8adf','#7ef0ff','#6ee678'],kind:'star',size:15,speed:1100,g:400})}
      ctx.save();ctx.translate(W/2,330);ctx.scale(s,s);BB.text('YOUR REWARD:',0,-90,64,'#fff',{stroke:9});BB.text('BOSS BRAIN BREAK!',0,30,120,'#ff8adf',{font:'Rammetto One',stroke:14,strokeCol:'#3a1040'});ctx.restore();if(v<.12){ctx.fillStyle=`rgba(255,255,255,${.5*(1-v/.12)})`;ctx.fillRect(0,0,W,H)}}
    else{BB.panel(W/2-560,140,1120,200,30);BB.text('STAND UP, RHYTHM ENGINEERS!',W/2,190,64,COL.yellow,{stroke:8,maxW:1060});BB.text('DODGE: duck, lean, freeze, jump.  ATTACK: CLAP! Faster = stronger!  Everybody wins!',W/2,265,34,'#fff',{stroke:5,maxW:1040})}
    this.q(()=>BB.button(W-300,30,260,90,'SKIP',{size:40,id:'rwskip',onClick:()=>{if(this.state==='intro'){BB.sayStop&&BB.sayStop();this.startKO()}}}))}
  drawTease(k,t){/* v14.3.2 next-adventure tease: light through the roof, Sprocket looks up. Deliberately vague: no theme, no villain */
    const v=k-(KO_CEL+3);if(v<0)return;if(!this.teased){this.teased=1;BB.say('bb_tease',{overlap:true})}const a=clamp(v/1,0,1);
    ctx.save();ctx.globalAlpha=a*.55;const g=ctx.createLinearGradient(LCH.x,0,LCH.x-120,LCH.y);g.addColorStop(0,'rgba(255,250,220,.9)');g.addColorStop(1,'rgba(255,250,220,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(LCH.x-260,0);ctx.lineTo(LCH.x+60,0);ctx.lineTo(LCH.x+40,LCH.y+80);ctx.lineTo(LCH.x-420,LCH.y+80);ctx.fill();ctx.restore();
    ctx.save();ctx.globalAlpha=a;for(let i=0;i<6;i++){const x=LCH.x-300+i*70,y=40+((i*37)%60),s=.6+.4*Math.sin(t*4+i);BB.text('\u2726',x,y,30*s+10,'#fff8c0',{stroke:0})}
    R.bubble(LCH.x+60,LCH.y-330,'next stop... somewhere new!');ctx.restore()}
  drawJunk(j,t){// original cartoon junk, drawn at ~1x around 0,0
    if(j==='bomb'){ctx.fillStyle='#4b3f8f';ctx.beginPath();ctx.arc(0,0,40,0,7);ctx.fill();ctx.strokeStyle='#bff8ff';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-12,-8,8,0,7);ctx.arc(12,-8,8,0,7);ctx.fill();ctx.strokeStyle='#5a3a1e';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,-40);ctx.quadraticCurveTo(12,-58,4,-70);ctx.stroke();ctx.fillStyle=Math.sin(t*40)>0?'#ffe066':'#fff';ctx.beginPath();ctx.arc(4,-72,9,0,7);ctx.fill()}
    else if(j==='sock'){BB.rrect(-25,-60,50,90,20,'#e8e0d0','#5a3a1e',4);BB.rrect(-25,10,90,40,18,'#e8e0d0','#5a3a1e',4);ctx.fillStyle='#d24a3c';ctx.fillRect(-25,-50,50,10)}
    else if(j==='chicken'){BB.rrect(-80,-20,160,40,20,'#ffe066','#5a3a1e',4);ctx.fillStyle='#d24a3c';ctx.beginPath();ctx.arc(-80,0,18,0,7);ctx.fill();ctx.fillStyle='#ff9c3a';ctx.beginPath();ctx.moveTo(-96,-4);ctx.lineTo(-120,2);ctx.lineTo(-96,8);ctx.fill()}
    else{ctx.lineWidth=26;ctx.strokeStyle='#2a2e36';ctx.beginPath();ctx.arc(0,0,55,0,7);ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle='#5a3a1e';ctx.stroke()}}
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
  draw(){const t=BB.t,k=t-this.st;if(this.static)ctx.drawImage(this.static,0,0,W,H);else{ctx.fillStyle='#111';ctx.fillRect(0,0,W,H)}R.drawMotes(this.motes,BB.dt||.016,t);if(this.state==='load')return;const CAM=this.camFor(k);this.qq=[];ctx.save();ctx.translate(W/2+CAM.tx,H/2+CAM.ty);ctx.rotate(CAM.rot);ctx.scale(CAM.z,CAM.z);ctx.translate(-W/2,-H/2);
    const end=this.state==='end',dx=end?Math.max(0,k-(KO_BIG+1.2))**2*260:0,fill=end?clamp(Math.floor(barAt(k)/(KO_BARS.length-1)*TOTAL)+1,0,TOTAL):Math.min(TOTAL,this.n);
    R.paint(ctx,()=>this.drawTruck(TRK.x+dx,TRK.y,fill,{spin:end?Math.max(0,k-(KO_BIG+1.2))*14:0}));
    if(!end&&!(this.move&&this.state==='intro')){this.drawJr();this.drawHP()}
    else if(!(this.move&&this.state==='intro')){const hv=this.heroV(k);let z=1;if(hv!=null)z=hv<0?1+(this.heroS===3?.35:.22)*clamp(1+hv/this.heroW,0,1):1+.22*Math.max(0,1-hv/.15);ctx.save();if(z>1){ctx.translate(JR.x,JR.y-90);ctx.scale(z,z);ctx.translate(-JR.x,-(JR.y-90))}this.drawKO(k,t);ctx.restore();this.drawChant(k,t)}
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
    if(!end&&!(this.move&&this.state==='intro')){BB.panel(40,24,400,110,28);BB.text('TRUCK LOAD  '+fill+' of '+TOTAL,64,52,28,COL.yellow,{align:'left',stroke:4});for(let i=0;i<TOTAL;i++)BB.rrect(64+i*44,78,36,36,8,i<fill?BB.lg(78,114,['#e2b272','#b07a40']):'#2d4744','#fff',3);
      if(this.phT&&t-this.phT<2.4)BB.text(this.ph===1?'PHASE 2: FASTER!':'PHASE 3: WILD STATIC!',W/2,200,64,'#ff8adf',{font:'Rammetto One',stroke:8})}
    if(!end&&!this.move){BB.pauseBtn(()=>this.pause());BB.micMeter(40,H-150)}if(this.cb){BB.overrideBtn(()=>this.manualOverride(),{pop:this.ovPop&&t-this.ovPop<.3?1.08:1});if(BB.fuzz){ctx.save();ctx.translate((Math.random()-.5)*10,(Math.random()-.5)*4)}this.cb.draw(W/2,H-95);if(BB.fuzz)ctx.restore()}
    // screen fuzz (brief, translucent: rhythm stays readable)
    if(BB.fuzz){ctx.save();ctx.globalAlpha=.22;for(let i=0;i<70;i++){ctx.fillStyle=Math.random()<.5?'#fff':'#7ef0ff';ctx.fillRect(Math.random()*W,Math.random()*H,40+Math.random()*260,2+Math.random()*5)}ctx.restore()}
    if(this.state==='intro'&&!this.move&&k<2.6)BB.titleCard('ROOM 5: DELIVERY SHOWDOWN','Clap the boxes. Beat Static Jr.!',k/2.6);
    if(this.state==='intro'&&this.move){if(k<14)this.drawReward(k,t);else this.drawStandoff(k-14,t)}
    if(end)this.drawTease(k,t);
    if(end&&k>KO_CEL+2){/* v14.2: last room -> back to the room map (finale done) */BB.button(W/2-520,860,480,130,'ROOM MAP',{style:'green',size:56,id:'tomap',onClick:()=>BB.roomDone('finale')});BB.button(W/2+40,860,480,130,'PLAY AGAIN',{size:50,id:'again',onClick:()=>BB.go(new DeliveryRoom())})}
    ctx.restore();this.drawLetterbox(CAM.lb);for(const f of this.qq)f();this.drawReplay(k,t);
    if(BB.paused)BB.pauseOverlay(howTo,()=>this.resume())}}
BB.DeliveryRoom=DeliveryRoom})();
