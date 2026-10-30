// Room 4: LABEL ROOM / NAME THAT RHYTHM (prototype, v13.4). Sprocket bumped the label printer and mixed up every shipping label.
// Each box hides a 4-beat rhythm (100 BPM). Tap/shake the box to hear it, then pick the label card whose notation matches.
// Wrong cards are near misses (one beat changed, beats swapped, ti-ti/ta swap). Hint ladder costs points but always reaches the answer.
'use strict';
(()=>{let ctx=BB.ctx;BB._sw.push(g=>ctx=g);const COL=BB.COL,W=BB.W,H=BB.H,{clamp,lerp,ease}=BB,R=BB.R,ac=BB.ac;
// ---- two new 1-beat kinds: a = ti-tika (8th + two 16ths), b = tika-ti (two 16ths + 8th) ----
Object.assign(R.BEATS,{a:1,b:1});Object.assign(R.NAME,{a:'TI-TIKA',b:'TIKA-TI'});Object.assign(R.SAY,{a:'ti-tika',b:'tika-ti'});Object.assign(R.SUB,{a:[0,.5,.75],b:[0,.25,.5]});R.COLS.a=R.COLS.b=R.COLS.q;
const g0=R.glyph,ns0=R.noteSize;
R.noteSize=(k,w,h)=>k==='a'||k==='b'?Math.min(h*.2,w/7.4):ns0(k,w,h);
R.glyph=(k,x,y,s,col='#19191f',g=ctx)=>{if(k!=='a'&&k!=='b')return g0(k,x,y,s,col,g);
  g.save();g.fillStyle=col;g.strokeStyle=col;const st=s*3.4,lw=Math.max(2,s*.24),gap=s*2.5,x0=x-gap,hs=s*.9;
  for(let i=0;i<3;i++){const hx=x0+i*gap;g.save();g.translate(hx,y);g.rotate(-.35);g.beginPath();g.ellipse(0,0,hs,hs*.72,0,0,7);g.fill();g.restore();g.lineWidth=lw;g.beginPath();g.moveTo(hx+hs*.86,y-hs*.2);g.lineTo(hx+hs*.86,y-st);g.stroke()}
  const bx=i=>x0+i*gap+hs*.86,bh=s*.62;g.fillRect(bx(0)-lw/2,y-st,bx(2)-bx(0)+lw,bh);
  if(k==='a')g.fillRect(bx(1)-lw/2,y-st+bh*1.7,bx(2)-bx(1)+lw,bh);else g.fillRect(bx(0)-lw/2,y-st+bh*1.7,bx(1)-bx(0)+lw,bh);g.restore()};
// spoken syllables (Piper lessac); rest is silent
const SYL={q:'ta',e:'tee-tee',s:'tika-tika',a:'tee-tika',b:'tika-tee',h:'ta-ah',r:'(rest)'};
BB.VO_LINES=(BB.VO_LINES||[]).concat([
 ['lb_intro',"Uh oh! I bumped the label printer, and it mixed up all the shipping labels! Every box hides a rhythm. Rhythm Engineers, help me fix them!",'sprocket'],
 ['lb_how',"Tap the box to hear what's inside. Then pick the label that matches!",'sprocket'],
 ['lb_right',"That's the one! Label on, ship it out!",'sprocket'],
 ['lb_right2',"Perfect match! Off it goes!",'sprocket'],
 ['lb_wrong',"Hmm, that label doesn't match. Listen again!",'sprocket'],
 ['lb_hint',"Here's a hint!",'sprocket'],
 ['lb_faster',"Great streak! The labels are getting trickier!",'sprocket'],
 ['lb_clap',"Now clap the rhythm back to me!",'sprocket'],
 ['lb_done',"Every box is labeled and shipped! Room four complete! Next stop, the delivery dock!",'sprocket'],
 ['syl_q','ta','sprocket'],['syl_e','tee-tee','sprocket'],['syl_s','tika-tika','sprocket'],['syl_a','tee-tika','sprocket'],['syl_b','tika-tee','sprocket'],['syl_h','ta-ah','sprocket'],
]);
const BOXES=8,ALL=['q','e','r','h','s','a','b'];
const LV=[['q','e'],['q','e','r'],['q','e','r','h'],['q','e','r','h','s'],['q','e','r','h','s','a','b']];
const loadAllowed=()=>{try{const a=JSON.parse(localStorage.getItem('bb_lbl_notes')||'null');if(Array.isArray(a)&&a.length)return a}catch(e){}return ALL.slice()};
const key=s=>s.join('');
// a rhythm = list of note kinds summing to 4 beats
function genRhythm(pool,last){for(let n=0;n<60;n++){const s=[];let b=0,rests=0;while(b<4){const ok=pool.filter(k=>R.BEATS[k]<=4-b&&!(k==='r'&&rests>=1)&&!(k==='h'&&s.includes('h')));const k=ok[Math.random()*ok.length|0];s.push(k);if(k==='r')rests++;b+=R.BEATS[k]}
    const kinds=new Set(s);if(kinds.size<2&&pool.length>1)continue;if(s.every(k=>k==='r'))continue;if(last&&key(s)===last)continue;return s}return['q','e','q','q']}
// near-miss distractors
function nearMiss(ans,pool,n){const out=[],seen=new Set([key(ans)]),one=pool.filter(k=>R.BEATS[k]===1);const ops=[
  s=>{const i=s.findIndex(k=>k==='e'||k==='q');if(i<0)return null;const c=s.slice();c[i]=c[i]==='e'?'q':'e';return c},// ti-ti/ta swap
  s=>{const i=Math.random()*s.length|0;if(R.BEATS[s[i]]!==1)return null;const alt=one.filter(k=>k!==s[i]);if(!alt.length)return null;const c=s.slice();c[i]=alt[Math.random()*alt.length|0];return c},// one beat changed
  s=>{const idx=[];for(let i=0;i<s.length-1;i++)if(s[i]!==s[i+1])idx.push(i);if(!idx.length)return null;const i=idx[Math.random()*idx.length|0],c=s.slice();[c[i],c[i+1]]=[c[i+1],c[i]];return c},// beats swapped
  s=>{const i=s.indexOf('h');if(i<0)return null;const c=s.slice();c.splice(i,1,'q','q');return c},// half -> ta ta
  s=>{const i=s.findIndex(k=>k==='s'||k==='a'||k==='b');if(i<0)return null;const alt=['s','a','b','e'].filter(k=>k!==s[i]);const c=s.slice();c[i]=alt[Math.random()*alt.length|0];return c}];
  for(let t=0;t<200&&out.length<n;t++){const c=ops[Math.random()*ops.length|0](ans);if(!c||R.len(c)!==4||c.every(k=>k==='r'))continue;const kk=key(c);if(seen.has(kk))continue;seen.add(kk);out.push(c)}
  while(out.length<n){const c=genRhythm(pool.length>1?pool:['q','e'],null);if(!seen.has(key(c))){seen.add(key(c));out.push(c)}}return out}
const howTo={title:'LABEL ROOM: find the label that matches the box!',
  steps:['Tap the box to shake it and hear its rhythm.','Pick the label card with the matching notes.','Stuck? Tap HINT (each hint costs a point).','Right label = it ships down the conveyor!','TEACHER picks which notes can appear.'],
  words:'ta = 1 sound   ti-ti = 2   tika-tika = 4   rest = silence   (all 1 beat)',
  example:(x,y,w,h,t)=>{ctx.save();ctx.translate(x+w/2,y+h/2);const sh=Math.sin(t*20)*(t%2<.5?6:0);drawBox(-90+sh,-160,180,150,null,t);
    [['q','e','q','q'],['q','q','e','q']].forEach((s,i)=>drawCard(-220+i*230,40,210,140,s,{badge:'AB'[i],hl:i===1&&t%3>1.5}));ctx.restore()}};
// ---- drawing helpers ----
const BELT_Y=560,BOX_X=880,BOX_W=300,BOX_H=230;
function drawBox(x,y,w,h,lbl,t,o={}){const im=BB.V2.crate;BB.rrect(x+6,y+10,w,h,12,'rgba(0,0,0,.3)');
  const gr=BB.lg(y,y+h,['#e2a868','#c08446','#93582a']);BB.rrect(x,y,w,h,12,gr,'#4a2e12',4);
  ctx.fillStyle='rgba(255,240,210,.3)';ctx.fillRect(x+6,y+6,w-12,6);ctx.fillStyle='rgba(240,220,170,.85)';ctx.fillRect(x+w/2-16,y,32,h*.38);// tape
  ctx.fillStyle='rgba(60,30,10,.18)';ctx.fillRect(x+w*.78,y+8,w*.18,h-16);
  // label slot
  const lx=x+w*.12,ly=y+h*.42,lw=w*.76,lh=h*.48;
  if(lbl)drawCard(lx,ly,lw,lh,lbl,{mini:1});
  else{ctx.setLineDash([10,8]);BB.rrect(lx,ly,lw,lh,10,'rgba(60,30,10,.18)','rgba(255,240,210,.7)',3);ctx.setLineDash([]);
    if(o.first){const cw=lw/4;R.tile(o.first,lx+4,ly+4,cw*R.BEATS[o.first]-8,lh-8,{shadow:false});for(let i=R.BEATS[o.first];i<4;i++)BB.text('?',lx+cw*i+cw/2,ly+lh/2,lh*.5,'rgba(255,240,210,.8)',{font:'Rammetto One'})}
    else BB.text('?',lx+lw/2,ly+lh/2,lh*.6,'rgba(255,240,210,.85)',{font:'Rammetto One'})}
  // beat lamps on the box lid (lit during hint 2)
  if(o.lamps)for(let i=0;i<4;i++){const cx=x+w*.2+i*w*.2,cy=y+h*.22,l=o.lamps[i]||0;ctx.fillStyle='#2a1a0a';ctx.beginPath();ctx.arc(cx,cy,15,0,7);ctx.fill();ctx.fillStyle=l>0?`rgba(255,${200+55*l|0},90,${.4+.6*l})`:'#5a4a2a';ctx.beginPath();ctx.arc(cx,cy,11,0,7);ctx.fill()}}
function drawCard(x,y,w,h,seq,o={}){ctx.save();
  if(!o.mini)BB.rrect(x+5,y+8,w,h,12,'rgba(0,0,0,.35)');
  BB.rrect(x,y,w,h,12,BB.lg(y,y+h,['#fffaf0','#f1e8d2','#ddd0b2']));R.paper(x,y,w,h);BB.rrect(x,y,w,h,12,null,o.hl?COL.yellow:'rgba(110,95,70,.7)',o.hl?6:2);
  const hh=o.mini?0:Math.min(40,h*.2);if(hh){ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,hh+4,[12,12,0,0]);ctx.clip();ctx.fillStyle='#d24a3c';ctx.fillRect(x,y,w,hh+4);ctx.restore();
    BB.text('SHIP TO: DELIVERY',x+(o.badge?58:w/2),y+hh/2+2,Math.min(22,hh*.6),'#fff',{maxW:w-(o.badge?80:20),align:o.badge?'left':'center'});}
  if(o.badge){BB.rrect(x+10,y+6,40,hh-4,8,'#fbf6e6',COL.ink,2);BB.text(o.badge,x+30,y+hh/2+2,24,COL.ink)}
  const pad=o.mini?4:12,bx=x+pad,by=y+hh+pad,bw=(w-pad*2)/4,bh=h-hh-pad*2-(o.syl?28:0);let b=0;
  for(const k of seq){const n=R.BEATS[k],cx=bx+b*bw;if(!o.mini&&b>0){ctx.fillStyle='rgba(90,80,64,.18)';ctx.fillRect(cx-1,by+6,2,bh-12)}
    const lit=o.lit&&o.lit[b]>0;if(lit)BB.rrect(cx+2,by,n*bw-4,bh,8,`rgba(255,224,102,${.25+.4*o.lit[b]})`);
    R.tile(k,cx+3,by,n*bw-6,bh,{shadow:!o.mini&&BB.tier>0});
    if(o.syl)BB.text(SYL[k],cx+n*bw/2,by+bh+16,20,'#5a5040',{maxW:n*bw-6});b+=n}
  if(o.x){ctx.strokeStyle='#d24a3c';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+30,y+30);ctx.lineTo(x+w-30,y+h-30);ctx.moveTo(x+w-30,y+30);ctx.lineTo(x+30,y+h-30);ctx.stroke()}
  ctx.restore()}
class LabelRoom{constructor(o={}){this.o=o}
  enter(){BB.groove.start(100,'pack');this.allowed=loadAllowed();this.streak=0;this.best=0;this.score=0;this.shipped=this.o.startAt||0;this.last=null;this.said={};this.motes=R.motes(18);this.belt=0;this.lamps=[0,0,0,0];
    this.clapBack=localStorage.getItem('bb_lbl_clap')==='1';this.state='load';this.teacher=false;this.lastOverride=-9;
    R.loadImgs([['pack_blur','jpg'],['pack_bg','jpg'],['crate','png']]).then(()=>{this.static=this.bake();if(this.o.skipIntro||this.o.startAt)this.newBox(true);else this.startIntro()});BB.mic.take();window.__lbl=this}
  exit(){BB.paused=false;if(window.__lbl===this)window.__lbl=null}
  bake(){const s=!BB.q?.5:1,c=document.createElement('canvas');c.width=W*s;c.height=H*s;const g=c.getContext('2d');g.scale(s,s);const V=BB.V2;
    if(V.pack_blur||V.pack_bg)g.drawImage(V.pack_blur||V.pack_bg,0,0,W,H);g.fillStyle='rgba(8,18,17,.35)';g.fillRect(0,0,W,H);
    // conveyor frame (belt surface + rollers drawn live)
    R.shadow(g,780,BELT_Y+120,760,.55);const fr=g.createLinearGradient(0,BELT_Y+24,0,BELT_Y+80);fr.addColorStop(0,'#c9d2d3');fr.addColorStop(.5,'#8a9798');fr.addColorStop(1,'#56625f');g.fillStyle=fr;g.fillRect(40,BELT_Y+24,1440,56);
    g.fillStyle='rgba(0,0,0,.3)';g.fillRect(40,BELT_Y+80,1440,8);for(const x of [120,760,1400]){const lg=g.createLinearGradient(x,0,x+44,0);lg.addColorStop(0,'#5d696b');lg.addColorStop(.5,'#aab4b5');lg.addColorStop(1,'#4d585a');g.fillStyle=lg;g.fillRect(x,BELT_Y+88,44,60)}
    return c}
  // beat clock = the groove's grid (one shared grid for music, playback, lights and clap-back)
  beatV(){const gr=BB.groove;return gr&&gr.on?(ac.currentTime-BB.visLat()-gr.t0)/gr.spb:BB.t/.6}
  nextBeat(){const gr=BB.groove;if(!gr||!gr.on)return{t:ac.currentTime+.3,spb:.6};const k=Math.ceil((ac.currentTime+.2-gr.t0)/gr.spb);return{t:gr.t0+k*gr.spb,spb:gr.spb}}
  startIntro(){this.state='intro';this.st=BB.t;this.flurry=[];for(let i=0;i<10;i++)this.flurry.push({x:W/2+(Math.random()-.5)*400,y:-100-Math.random()*400,vx:(Math.random()-.5)*300,vy:200+Math.random()*200,r:Math.random()*6,vr:(Math.random()-.5)*6,s:genRhythm(['q','e','r'],null)});
    BB.sfx.glitch();setTimeout(()=>BB.scene===this&&this.state==='intro'&&(this.voEnd=BB.t+BB.say('lb_intro')),700)}
  skipIntro(){this.flurry=null;BB.talking=null;BB.caption=null;this.newBox(true)}
  level(){return Math.min(LV.length-1,Math.floor(this.streak/2)+Math.floor(this.shipped/3))}
  pool(){let p=LV[this.level()].filter(k=>this.allowed.includes(k));if(p.length<2)p=this.allowed.slice();if(!p.length)p=['q','e'];if(p.length===1&&p[0]==='r')p=['q','r'];return p}
  newBox(first){const pool=this.pool();const ans=genRhythm(pool,this.last);this.last=key(ans);const nc=this.streak>=3||this.level()>=3?4:3;
    const cards=[ans,...nearMiss(ans,pool,nc-1)].sort(()=>Math.random()-.5).map(s=>({s,out:false,x:false,shake:0}));
    this.ans=ans;this.cards=cards;this.hint=0;this.tries=0;this.state='enter';this.st=BB.t;this.boxX=-400;this.pb=null;this.fly=null;this.revealed=false;this.lit=[0,0,0,0];
    BB.sfx.whoosh(undefined,.6);if(first){this.cardT=BB.t;if(!this.said.how){this.said.how=1;setTimeout(()=>BB.scene===this&&BB.say('lb_how'),1200)}}}
  // play the hidden rhythm (robot sounds) on the beat grid; slow = half speed (still on grid beats)
  play(slow,syl){if(this.state!=='pick'&&this.state!=='enter')return;const nb=this.nextBeat(),spb=nb.spb*(slow?2:1),t0=nb.t,S=BB.sfx;let b=0;const notes=[];
    for(const k of this.ans){const t=t0+b*spb;notes.push({k,b,t,n:R.BEATS[k]});
      if(k==='q')S.pkTa(t);else if(k==='e'){S.pkBlip(t,1100);S.pkBlip(t+spb/2,1100)}else if(k==='s'){for(let i=0;i<4;i++)S.pkBlip(t+i*spb/4,1500)}
      else if(k==='a'){S.pkBlip(t,1100);S.pkBlip(t+spb/2,1500);S.pkBlip(t+spb*.75,1500)}else if(k==='b'){S.pkBlip(t,1500);S.pkBlip(t+spb/4,1500);S.pkBlip(t+spb/2,1100)}
      else if(k==='r')S.pkHiss(t,spb*.5);else S.pkHum(t,R.BEATS[k]*spb*.9);
      if(syl&&k!=='r')setTimeout(()=>BB.scene===this&&BB.say('syl_'+k,{overlap:true,nocap:true}),Math.max(0,(t-ac.currentTime)*1000-20));b+=R.BEATS[k]}
    this.pb={t0,spb,notes,end:t0+4*spb};this.shakeT=BB.t}
  tapBox(){if(this.state==='pick'){if(this.pb&&ac.currentTime<this.pb.end)return;this.play(false)}}
  doHint(){if(this.state!=='pick'||this.hint>=5)return;this.hint++;BB.sfx.pop();const h=this.hint;
    if(h===1)this.play(true);else if(h===2)this.play(false);else if(h===3){BB.say('lb_hint',{overlap:true})}
    else if(h===4){const w=this.cards.filter(c=>!c.out&&c.s!==this.ans);if(w.length){const c=w[Math.random()*w.length|0];c.out=true;c.outT=BB.t}}
    else if(h===5){this.revealed=true;this.play(true,true)}}
  pick(c){if(this.state!=='pick'||c.out)return;if(c.s===this.ans){this.correct(c);return}
    this.tries++;c.x=true;c.out=true;c.outT=BB.t;c.shake=BB.t;this.streak=0;BB.sfx.bonk();BB.say('lb_wrong');setTimeout(()=>BB.scene===this&&this.state==='pick'&&this.play(false),1400)}
  points(){return Math.max(1,10-2*this.hint-3*this.tries)}
  correct(c){const i=this.cards.indexOf(c);this.state='fly';this.st=BB.t;this.fly={i,from:this.cardRect(i)};const p=this.points();this.score+=p;this.gain={p,t:BB.t};this.streak++;this.best=Math.max(this.best,this.streak);
    BB.sfx.ding();BB.say(this.streak%2?'lb_right':'lb_right2');if(this.streak===4)setTimeout(()=>BB.scene===this&&BB.say('lb_faster',{overlap:false}),1800)}
  slapped(){BB.sfx.thunk();BB.sfx.clunk(ac.currentTime+.05);BB.shake(5);BB.burst(BOX_X,BELT_Y-BOX_H*.3,18,{cols:['#ffe066','#fff','#d24a3c'],kind:'star',size:12,speed:500,g:500});
    if(this.clapBack){this.state='clap';this.cb=new R.ClapBack(this.ans,{bpm:100,onDone:()=>setTimeout(()=>BB.scene===this&&this.ship(),500)});BB.say('lb_clap',{overlap:true})}else setTimeout(()=>BB.scene===this&&this.ship(),500)}
  ship(){this.cb=null;this.state='ship';this.st=BB.t;BB.sfx.whoosh(undefined,1)}
  manualOverride(){if(BB.t-this.lastOverride<.5)return;this.lastOverride=BB.t;this.ovPop=BB.t;if(this.cb)this.cb.override();else if(this.state==='pick')this.tapBox()}
  pause(){BB.paused=true;BB.ac.suspend()}
  resume(){BB.paused=false;BB.ensureMic()}
  cardRect(i){const n=this.cards.length,cw=n>3?340:400,ch=215,gap=30,tot=n*cw+(n-1)*gap,x0=780-tot/2;return{x:x0+i*(cw+gap),y:690,w:cw,h:ch}}
  update(dt){BB.dt=dt;if(BB.keys.includes('p')){this.pause();return}if(BB.keys.includes(' '))this.manualOverride();
    for(const k of BB.keys){if(k>='1'&&k<='4'&&this.cards&&this.cards[+k-1])this.pick(this.cards[+k-1]);if(k==='h')this.doHint();if(k==='b')this.tapBox()}
    if(this.state==='intro'){const t=BB.t-this.st;for(const f of this.flurry){f.vy+=300*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.r+=f.vr*dt}if(BB.keys.includes('s'))this.skipIntro();if(t>2&&BB.t>(this.voEnd||1e9)+.2)this.skipIntro();if(t>14)this.skipIntro()}
    const bv=this.beatV();this.belt=bv;
    // conveyor lights: one lamp per beat, lit on the beat, decaying
    if(this.state==='enter'){const k=clamp((BB.t-this.st)/1.1,0,1);this.boxX=lerp(-400,BOX_X,ease.out(k));if(k>=1){this.state='pick';this.play(false)}}
    if(this.state==='fly'&&BB.t-this.st>.55){this.state='slap';this.slapped()}
    if(this.state==='ship'){const k=clamp((BB.t-this.st)/1.4,0,1);this.boxX=lerp(BOX_X,W+400,ease.inOut(k));if(k>=1){this.shipped++;if(this.shipped>=BOXES){this.state='end';this.st=BB.t;BB.say('lb_done');BB.celebrate({next:'DELIVERY'});if(!BB.save.done.includes('label')){BB.save.done.push('label');localStorage.setItem('bb4',JSON.stringify(BB.save))}}else this.newBox()}}
    // box beat lamps + card lights follow the audible playback
    const lam=[0,0,0,0];if(this.pb){const tv=ac.currentTime-BB.visLat();for(const n of this.pb.notes){const d=tv-n.t;if(d>=0&&d<n.n*this.pb.spb)for(let j=0;j<n.n;j++){const dj=tv-(n.t+j*this.pb.spb);if(dj>=0&&dj<this.pb.spb)lam[n.b+j]=1-dj/this.pb.spb*.6}}}
    this.lit=lam;if(this.cb)this.cb.update&&this.cb.update(dt);else BB.mic.take()}
  draw(){const t=BB.t,[sx,sy]=BB.shakeXY;ctx.save();ctx.translate(sx,sy);
    if(this.static)ctx.drawImage(this.static,0,0,W,H);else{ctx.fillStyle='#2a3a38';ctx.fillRect(0,0,W,H)}
    this.drawBelt(t);
    if(this.state!=='intro'&&this.state!=='load'&&this.state!=='end'){const sh=this.shakeT&&t-this.shakeT<.35?Math.sin((t-this.shakeT)*60)*8*(1-(t-this.shakeT)/.35):0;
      const lbl=(this.state==='slap'||this.state==='ship'||this.state==='clap')?this.ans:null,bx=this.boxX-BOX_W/2+sh,by=BELT_Y-BOX_H;
      ctx.save();if(sh){ctx.translate(this.boxX,BELT_Y);ctx.rotate(sh*.006);ctx.translate(-this.boxX,-BELT_Y)}
      drawBox(bx,by,BOX_W,BOX_H,lbl,t,{lamps:this.hint>=2&&this.state==='pick'?this.lit:null,first:this.hint>=3&&!lbl?this.ans[0]:null});ctx.restore();
      if(this.state==='pick')BB.button(bx,by,BOX_W,BOX_H,'',{style:'none',id:'box',onClick:()=>this.tapBox()});
      if(this.state==='pick'&&(!this.pb||ac.currentTime>this.pb.end)){const pu=.5+.5*Math.sin(t*5);BB.plaque(this.boxX,by-46,270,50,'TAP TO SHAKE!',24,'#28403c',{cols:pu>.5?['#fff8d0','#ffe680','#e8b830']:undefined})}
      else if(this.state==='pick'&&this.pb&&ac.currentTime<this.pb.end)BB.plaque(this.boxX,by-46,270,50,this.pb.spb>.9?'\u266A SLOW...':'\u266A LISTEN...',24,'#28403c')}
    this.drawSprocket(t);
    if(this.flurry)for(const f of this.flurry){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.r);drawCard(-110,-70,220,140,f.s,{mini:1});ctx.restore()}
    ctx.restore();R.drawMotes(this.motes,BB.paused?0:Math.min(.05,BB.dt||.016),t);BB.drawParts();
    if(this.cards&&['pick','fly','slap','clap','ship','enter'].includes(this.state))this.drawCards(t);
    this.drawHUD(t);BB.captionBox();
    if(this.state==='enter'&&this.cardT&&t-this.cardT<2.6)BB.titleCard('ROOM 4: LABEL ROOM','Sprocket mixed up the labels. Match them!',(t-this.cardT)/2.6);
    if(this.state==='end')this.drawEnd();
    if(this.teacher)this.drawTeacher();
    if(BB.paused)BB.pauseOverlay(howTo,()=>this.resume())}
  drawBelt(t){const y=BELT_Y,x0=40,x1=1480;// belt surface with moving cleats locked to the beat grid
    BB.rrect(x0,y,x1-x0,26,8,BB.lg(y,y+26,['#3a4644','#222b2a']),'#121918',2);ctx.save();ctx.beginPath();ctx.rect(x0,y,x1-x0,26);ctx.clip();
    const off=((this.belt*60)%60+60)%60;ctx.fillStyle='rgba(160,210,200,.22)';for(let x=x0-60+off;x<x1;x+=60)ctx.fillRect(x,y+3,6,20);ctx.restore();
    // lamps along the frame: the lamp for the current beat flashes on the beat
    const bv=this.belt,bi=((Math.floor(bv)%4)+4)%4,ph=bv-Math.floor(bv),fl=Math.max(0,1-ph*2.2);
    for(let i=0;i<16;i++){const lx=x0+50+i*((x1-x0-100)/15),ly=y+52,on=i%4===bi;ctx.fillStyle='#1b2322';ctx.beginPath();ctx.arc(lx,ly,13,0,7);ctx.fill();
      ctx.fillStyle=on&&fl>0?`rgba(255,${210+40*fl|0},90,${.35+.65*fl})`:'#4a5250';ctx.beginPath();ctx.arc(lx,ly,9,0,7);ctx.fill();if(on&&fl>.2&&BB.tier>0)BB.glow(lx,ly,34,'rgba(255,220,120,A)',fl*.5)}}
  drawSprocket(t){const x=1690,base=700;BB.contactShadow(x,base,110,.5);BB.sprite('sprocket',x,base,300,{squash:BB.isTalking('sprocket')?Math.sin(t*18)*.015:Math.sin(t*2)*.006})}
  drawCards(t){const fl=this.fly;this.cards.forEach((c,i)=>{const r=this.cardRect(i);if(fl&&fl.i===i&&this.state!=='fly')return;
    let x=r.x,y=r.y,w=r.w,h=r.h,a=1;if(fl&&fl.i!==i){const k=clamp((t-this.st)/.3,0,1);a=1-k;if(a<=0)return}else if(c.out){const k=clamp((t-(c.outT||0))/.4,0,1);a=c.x?1-.55*k:1-k;if(a<=0)return}
    if(fl&&fl.i===i){const k=ease.inOut(clamp((t-this.st)/.55,0,1));const tx=BOX_X-BOX_W*.38,ty=BELT_Y-BOX_H*.58,tw=BOX_W*.76,th=BOX_H*.48;x=lerp(r.x,tx,k);y=lerp(r.y,ty,k)-Math.sin(k*Math.PI)*120;w=lerp(r.w,tw,k);h=lerp(r.h,th,k)}
    const sh=c.shake&&t-c.shake<.4?Math.sin((t-c.shake)*50)*10:0;ctx.save();ctx.globalAlpha=a;
    drawCard(x+sh,y,w,h,c.s,{badge:fl&&fl.i===i?null:'ABCD'[i],x:c.x,syl:this.revealed&&c.s===this.ans,hl:this.revealed&&c.s===this.ans&&Math.sin(t*6)>0});ctx.restore();
    if(this.state==='pick'&&!c.out)BB.button(r.x,r.y,r.w,r.h,'',{style:'none',id:'card'+i,onClick:()=>this.pick(c)})})}
  drawHUD(t){BB.panel(40,24,560,130,30);BB.text('BOXES SHIPPED',70,58,32,COL.yellow,{align:'left',stroke:4});BB.text(`${this.shipped} of ${BOXES}`,70,104,30,'#fff',{align:'left',font:'Rammetto One',stroke:4});
    for(let i=0;i<BOXES;i++)BB.rrect(300+i*34,64,26,44,8,i<this.shipped?BB.lg(64,108,['#a6f5ae','#3fb45a']):'#2d4744','#fff',3);
    BB.panel(W-620,24,330,130,30);BB.text('POINTS '+this.score,W-455,62,32,'#fff',{stroke:4,maxW:290});BB.text('STREAK '+this.streak+(this.streak>=3?' \u2605':''),W-455,108,28,COL.yellow,{stroke:4,maxW:290});
    if(this.gain&&t-this.gain.t<1.4){const k=(t-this.gain.t)/1.4;ctx.save();ctx.globalAlpha=1-k;BB.text('+'+this.gain.p,W-455,170-k*40,44,COL.green,{font:'Rammetto One',stroke:6});ctx.restore()}
    BB.button(W-270,24,230,76,'TEACHER',{size:30,id:'teacher',onClick:()=>{this.teacher=true}});
    BB.pauseBtn(()=>this.pause());
    if(this.state==='end')return;if(this.state==='intro'){BB.button(W-300,H-130,260,100,'SKIP INTRO',{size:36,id:'skip',onClick:()=>this.skipIntro()});return}
    // hint ladder (right column under Sprocket)
    const HX=1520,HY=700,on=this.state==='pick',names=['SLOW REPLAY','BEAT LIGHTS','FIRST BEAT','REMOVE A CARD','SHOW ANSWER'];
    BB.panel(HX,HY,360,230,28);BB.text('HINTS USED '+this.hint+'/5',HX+180,HY+40,26,COL.yellow,{stroke:4});
    BB.text(this.hint<5?'next: '+names[this.hint]:'answer shown',HX+180,HY+76,22,'#d8efe9',{maxW:320});
    BB.button(HX+20,HY+100,150,70,'HINT',{style:'cream',size:32,id:'hint',disabled:!on||this.hint>=5,onClick:()=>this.doHint()});
    BB.button(HX+190,HY+100,150,70,'REPLAY',{style:'teal',size:28,id:'replay',disabled:!on,onClick:()=>this.tapBox()});
    BB.text('worth '+(on?this.points():'-')+' pts',HX+180,HY+200,24,'#fff',{stroke:4});
    BB.micMeter(40,H-150);if(this.cb){BB.overrideBtn(()=>this.manualOverride(),{pop:this.ovPop&&t-this.ovPop<.3?1.08:1});this.cb.draw(W/2,H-90)}}
  drawTeacher(){ctx.fillStyle='rgba(8,18,17,.78)';ctx.fillRect(0,0,W,H);const x=W/2-560,y=150,w=1120,h=780;BB.panel(x,y,w,h,40);
    BB.text('TEACHER SETTINGS',W/2,y+70,52,'#fff',{font:'Rammetto One',stroke:7});BB.text('Notes allowed on the labels (higher streaks unlock more of these)',W/2,y+130,28,COL.yellow,{stroke:4,maxW:w-80});
    ALL.forEach((k,i)=>{const cx=x+90+(i%4)*240,cy=y+180+Math.floor(i/4)*220,on=this.allowed.includes(k);
      BB.rrect(cx,cy,210,190,20,on?BB.lg(cy,cy+190,['#fffaf0','#e8e2cd']):'#2d4744',on?'#3fb45a':'#5d6866',on?6:3);R.tile(k,cx+20,cy+10,170,120,{shadow:false,alpha:on?1:.4});BB.text(R.NAME[k],cx+105,cy+160,26,on?COL.ink:'#9fb3ae',{maxW:190});
      BB.button(cx,cy,210,190,'',{style:'none',id:'tn'+k,onClick:()=>{const a=this.allowed;if(a.includes(k)){if(a.filter(z=>z!=='r').length>1||k==='r')a.splice(a.indexOf(k),1)}else a.push(k);try{localStorage.setItem('bb_lbl_notes',JSON.stringify(a))}catch(e){}}})});
    BB.button(x+90+3*240,y+400,210,90,this.clapBack?'CLAP: ON':'CLAP: OFF',{style:this.clapBack?'green':'cream',size:30,id:'tclap',onClick:()=>{this.clapBack=!this.clapBack;try{localStorage.setItem('bb_lbl_clap',this.clapBack?'1':'0')}catch(e){}}});
    BB.text('CLAP: after a correct label, the class claps the rhythm back (mic or MANUAL OVERRIDE).',W/2,y+640,24,'#d8efe9',{maxW:w-80});
    BB.button(W/2-160,y+h-120,320,96,'DONE',{style:'green',size:44,id:'tdone',onClick:()=>{this.teacher=false}})}
  drawEnd(){const t=BB.t-this.st;if(t<.4)return;const k=ease.back(clamp((t-.4)/.6,0,1));ctx.fillStyle=`rgba(8,18,17,${.5*clamp(t,0,1)})`;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(W/2,360);ctx.scale(k,k);BB.panel(-600,-260,1200,520,44);BB.text('ROOM 4 COMPLETE!',0,-170,72,'#fff',{font:'Rammetto One',stroke:9});
    drawCard(-260,-110,520,170,['q','e','s','q'],{});BB.text(BOXES+' boxes labeled  \u2022  '+this.score+' points  \u2022  best streak '+this.best,0,110,36,COL.yellow,{stroke:5,maxW:1100});BB.text('Next: DELIVERY (coming soon)',0,175,34,'#fff',{stroke:5});ctx.restore();
    if(t>1.6){BB.button(W/2-520,700,480,130,'ROOM MAP',{style:'green',size:56,id:'tomap',onClick:()=>BB.roomDone('label')});BB.button(W/2+40,700,480,130,'PLAY AGAIN',{size:50,id:'again',onClick:()=>BB.go(new LabelRoom())})}}
}
BB.LabelRoom=LabelRoom;BB.LabelGen={genRhythm,nearMiss,LV};
})();
