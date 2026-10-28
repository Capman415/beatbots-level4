// Shared rhythm toolkit for rooms 2-3: note glyphs, glossy note tiles, segmented beat pills, extra sfx, and the clap-back game.
'use strict';
(()=>{const ctx=BB.ctx,COL=BB.COL,W=BB.W,H=BB.H,{clamp,lerp,ease}=BB;
const R=BB.R={};
// note kinds: w whole(4) h half(2) q ta(1) e ti-ti(1) s tika-tika(1) r rest(1)
R.BEATS={w:4,h:2,q:1,e:1,s:1,r:1};
R.NAME={w:'WHOLE',h:'HALF',q:'TA',e:'TI-TI',s:'TIKA-TIKA',r:'REST'};
R.SAY={w:'ta-a-a-a',h:'ta-a',q:'ta',e:'ti-ti',s:'tika-tika',r:'(rest)'};
// v12.2: sheet-music ink look (matches the order ticket): black notation with a soft graphite bevel; colour only on UI
const INK=['#4a4a55','#1e1e26','#08080c'];R.COLS={w:INK,h:INK,q:INK,e:INK,s:INK,r:['#7d8c8a','#55625f','#323b39']};
R.SUB={w:[0],h:[0],q:[0],e:[0,.5],s:[0,.25,.5,.75],r:[]};
// sounds of a sequence, in beats from the start of the measure
R.sounds=seq=>{const o=[];let b=0;seq.forEach((k,i)=>{for(const f of R.SUB[k])o.push({b:b+f,i,k,f});b+=R.BEATS[k]});return o};
R.len=seq=>seq.reduce((a,k)=>a+(R.BEATS[k&&k.k?k.k:k]||0),0);
// ---------- glyphs (stems up). s = notehead size ----------
function head(x,y,s,filled,g=ctx){g.save();g.translate(x,y);g.rotate(-.35);g.beginPath();g.ellipse(0,0,s,s*.72,0,0,7);
  if(filled){g.fill()}else{g.lineWidth=s*.34;g.stroke()}g.restore()}
R.glyph=(k,x,y,s,col='#19191f',g=ctx)=>{g.save();g.fillStyle=col;g.strokeStyle=col;g.lineCap='butt';const st=s*3.4,lw=Math.max(2,s*.24);
  const stem=(hx,hy)=>{g.lineWidth=lw;g.beginPath();g.moveTo(hx+s*.86,hy-s*.2);g.lineTo(hx+s*.86,hy-st);g.stroke()};
  if(k==='w'){g.save();g.translate(x,y);g.beginPath();g.ellipse(0,0,s*1.15,s*.78,0,0,7);g.fill();g.globalCompositeOperation='destination-out';g.beginPath();g.ellipse(0,0,s*.55,s*.42,-.8,0,7);g.fill();g.restore()}
  else if(k==='h'){head(x,y,s,false,g);stem(x,y)}
  else if(k==='q'){head(x,y,s,true,g);stem(x,y)}
  else if(k==='e'||k==='s'){const n=k==='e'?2:4,gap=k==='e'?s*2.9:s*2.2,x0=x-gap*(n-1)/2;
    for(let i=0;i<n;i++){head(x0+i*gap,y,s*(k==='s'?.86:1),true,g);stem(x0+i*gap,y)}
    const bx0=x0+s*.86-lw/2,bx1=x0+gap*(n-1)+s*.86+lw/2,bh=s*.62;g.fillRect(bx0,y-st,bx1-bx0,bh);if(k==='s')g.fillRect(bx0,y-st+bh*1.7,bx1-bx0,bh)}
  else if(k==='r'){g.lineWidth=lw*1.2;g.lineJoin='round';const u=s*.9,yy=y-s*1.7;g.beginPath();g.moveTo(x-u*.4,yy-u*1.6);g.lineTo(x+u*.5,yy-u*.5);g.lineTo(x-u*.3,yy+u*.3);g.lineTo(x+u*.5,yy+u*1.2);g.stroke();
    g.beginPath();g.moveTo(x+u*.5,yy+u*1.2);g.quadraticCurveTo(x-u*.7,yy+u*.9,x-u*.1,yy+u*2.1);g.stroke()}
  g.restore()};
// ---------- tangible notes: painted, extruded enamel-on-metal note objects (cached sprites) ----------
// The note glyph itself is the object: dark ink rim, 3D extrusion in the kind's deep colour, enamel face gradient,
// specular streak, soft contact shadow. Matches the painted v2 props (warm key light from upper left).
const n3c={};
function tint(src,fill){const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=fill(g,c);g.fillRect(0,0,c.width,c.height);return c}
R.noteSize=(k,w,h)=>Math.min(h*.2,w/(k==='s'?8.6:k==='e'?6.2:k==='w'?2.9:3.1));
R.note3d=(k,w,h,o={})=>{const sc=2,key=k+'|'+Math.round(w)+'|'+Math.round(h)+'|'+(o.gs||1);if(n3c[key])return n3c[key];
  const s=R.noteSize(k,w,h)*(o.gs||1)*sc,PAD=Math.ceil(s*.9),cw=Math.ceil(w*sc)+PAD*2,ch=Math.ceil(h*sc)+PAD*2;
  const m=document.createElement('canvas');m.width=cw;m.height=ch;const mg=m.getContext('2d');
  const gx=cw/2+(k==='e'||k==='s'||k==='w'?0:-s*.4),gy=PAD+h*sc*.86-(k==='w'?h*sc*.3:0);
  if(k==='w'){mg.save();mg.translate(gx,gy);mg.fillStyle='#000';mg.beginPath();mg.ellipse(0,0,s*1.25,s*.85,0,0,7);mg.fill();mg.globalCompositeOperation='destination-out';mg.beginPath();mg.ellipse(0,0,s*.55,s*.42,-.8,0,7);mg.fill();mg.restore()}
  else R.glyph(k,gx,gy,s,'#000',mg);
  const c=R.COLS[k],out=document.createElement('canvas');out.width=cw;out.height=ch;const g=out.getContext('2d');
  const ink=tint(m,()=>'#141419'),deep=tint(m,()=>c[2]),face=tint(m,(gg)=>{const L=gg.createLinearGradient(0,PAD,0,ch-PAD);L.addColorStop(0,c[0]);L.addColorStop(.55,c[1]);L.addColorStop(1,c[2]);return L});
  const d=Math.max(2,s*.16);// extrusion depth
  const paper=tint(m,()=>'rgba(250,244,226,.95)');for(let i=0;i<10;i++){const a=i/10*Math.PI*2;g.drawImage(paper,Math.cos(a)*s*.13+d*.6,Math.sin(a)*s*.13+d)}// thin cream paper rim keeps ink notes readable on dark wood
  const deep2=tint(m,()=>'#000');for(let i=Math.ceil(d);i>0;i--)g.drawImage(deep2,i*.6,i);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;g.drawImage(paper,Math.cos(a)*s*.07,Math.sin(a)*s*.07)}
  g.drawImage(face,0,0);
  // light: soft top-left bevel highlight + specular streak, clipped to the face
  const hl=tint(m,(gg)=>{const L=gg.createLinearGradient(0,0,cw*.3,ch);L.addColorStop(0,'rgba(255,255,255,.32)');L.addColorStop(.45,'rgba(255,255,255,0)');return L});
  g.save();g.globalCompositeOperation='source-atop';g.drawImage(hl,-s*.06,-s*.08);g.restore();
  const sp=document.createElement('canvas');sp.width=cw;sp.height=ch;const sg=sp.getContext('2d');sg.drawImage(m,0,0);sg.globalCompositeOperation='destination-out';sg.drawImage(m,s*.09,s*.12);
  const spt=tint(sp,()=>'rgba(255,255,255,.45)');g.drawImage(spt,0,0);
  return n3c[key]={c:out,sc,PAD,gy:gy/sc}};
// a note object standing in a w x h box (bottom of box = the surface it rests on)
R.tile=(k,x,y,w,h,o={})=>{ctx.save();ctx.globalAlpha=o.alpha??1;
  // label = cream name tag on the surface UNDER the note (never on the stem); the note shrinks to make room
  const fs=o.label?Math.max(15,Math.min(22,h*.17)):0,tagH=o.label?fs+10:0;if(o.label)h-=tagH+4;
  if(o.shadow!==false){const sw=Math.min(w*.46,R.noteSize(k,w,h)*(k==='s'?4.6:k==='e'?3.4:1.8));const gr=ctx.createRadialGradient(x+w/2,y+h,0,x+w/2,y+h,sw);gr.addColorStop(0,'rgba(0,0,0,.42)');gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=gr;ctx.save();ctx.translate(x+w/2,y+h);ctx.scale(1,.22);ctx.translate(-x-w/2,-y-h);ctx.beginPath();ctx.arc(x+w/2,y+h,sw,0,7);ctx.fill();ctx.restore()}
  if(o.glyph!==false){const sp=R.note3d(k,w,h,o);ctx.drawImage(sp.c,x-sp.PAD/sp.sc,y-sp.PAD/sp.sc,sp.c.width/sp.sc,sp.c.height/sp.sc)}
  if(o.label){const tw=Math.min(w-4,BB.measure(R.NAME[k],fs)+18),ty=y+h+4;BB.rrect(x+w/2-tw/2+2,ty+3,tw,tagH,7,'rgba(0,0,0,.3)');BB.rrect(x+w/2-tw/2,ty,tw,tagH,7,BB.lg(ty,ty+tagH,['#fbf6e6','#ddd3b8']),'rgba(25,25,31,.8)',2);BB.text(R.NAME[k],x+w/2,ty+tagH/2+1,fs,COL.ink,{maxW:tw-8})}
  if(o.beats){BB.text(String(R.BEATS[k]),x+w-18,y+h-18,22,'#fff',{stroke:4})}
  ctx.restore()};
// segmented beat pills: one cell per beat; ti-ti = 2 segments, tika-tika = 4, half/whole stretch over cells
R.pills=(cx,y,seq,st={})=>{const bw=st.bw||150,gap=st.gap||24,ph=50,tot=4*bw+3*gap;BB.rrect(cx-tot/2-28,y-40,tot+56,100,30,'rgba(0,0,0,.25)');BB.well(cx-tot/2-30,y-50,tot+60,100,30);
  let b=0,si=0;seq.forEach((k,i)=>{const n=R.BEATS[k],x=cx-tot/2+b*(bw+gap),w=n*bw+(n-1)*gap,subs=R.SUB[k];
    if(k==='r'){BB.rrect(x,y-ph/2,w,ph,14,'#1b2a29','rgba(235,245,240,.4)',3);R.glyph('r',x+w/2,y+ph*.62,9,'rgba(235,245,240,.7)')}
    else{const sg=subs.length===1?[[0,1]]:subs.map((f,j)=>[f,f+1/subs.length]);const sgap=k==='s'?6:8;
      sg.forEach(([f0,f1],j)=>{const xx=x+(subs.length===1?0:f0*w+(j?sgap/2:0)),ww=subs.length===1?w:(f1-f0)*w-(j?sgap/2:0)-(j<subs.length-1?sgap/2:0);
        const l=(st.lit&&st.lit[si])||0,m=st.marks&&st.marks[si],cur=st.cur===si;
        if(l>.01&&BB.q){ctx.save();ctx.globalAlpha=l*.8;BB.glow(xx+ww/2,y,70,'rgba(110,230,120,A)',.7);ctx.restore()}
        const g=Math.round(40+l*70),gg=Math.round(60+l*170),bb=Math.round(60+l*60);
        BB.rrect(xx,y-ph/2,ww,ph,12,m?BB.lg(y-ph/2,y+ph/2,['#a6f5ae','#6ee678','#3fb45a']):BB.lg(y-ph/2,y+ph/2,[`rgb(${g+40},${Math.min(255,gg+40)},${bb+30})`,`rgb(${g},${gg},${bb})`]),cur?COL.yellow:'rgba(235,245,240,.85)',cur?5:3);
        if(m)BB.star(xx+ww/2,y,13*ease.back(Math.min(1,m)),COL.yellow,BB.t);si++})}
    b+=n});
  if(st.words){b=0;seq.forEach(k=>{const n=R.BEATS[k],x=cx-tot/2+b*(bw+gap),w=n*bw+(n-1)*gap;BB.text(R.SAY[k],x+w/2,y-72,28,'#fff',{stroke:5});b+=n})}};
// ---------- extra sounds (all logged as self-sounds so the mic ignores them) ----------
const ac=BB.ac,bus=BB.outBus;let nb=null;
function tone(type,f,t,d,pk,f2){BB.selfSound(t,d,null);const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(pk,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(bus);o.start(t);o.stop(t+d+.05)}
function nz(t,d,pk,type,f,q=1,f2){BB.selfSound(t,d,null);if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const a=nb.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}
  const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+d);fl.Q.value=q;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(pk,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl).connect(g).connect(bus);s.start(t,Math.random()*.5);s.stop(t+d+.05)}
const now=()=>ac.currentTime;
Object.assign(BB.sfx,{
  block:(t=now(),v=1)=>{tone('triangle',1050,t,.07,.3*v,700);nz(t,.03,.2*v,'bandpass',2500,4)},
  crunch:(t=now())=>{nz(t,.35,.6,'lowpass',3000,1,200);tone('square',90,t,.18,.25,45);for(let i=0;i<4;i++)tone('sine',2600+Math.random()*2400,t+.05+i*.05,.12,.06)},
  ting:(t=now())=>{for(let i=0;i<3;i++)tone('sine',3000+Math.random()*1800,t+i*.06,.15,.07)},
  bell:(t=now())=>{tone('sine',1760,t,.7,.22);tone('sine',2637,t,.5,.08);tone('sine',1760,t+.22,.8,.22);tone('sine',2637,t+.22,.6,.08)},
  bleep:(t=now())=>{[660,990,780].forEach((f,i)=>tone('square',f,t+i*.08,.07,.06))},
  thunk:(t=now())=>{tone('sine',140,t,.25,.5,60);nz(t,.12,.35,'lowpass',900)},
  boing:(t=now())=>{tone('sine',220,t,.45,.25,660);tone('triangle',330,t+.05,.3,.1,900)},
  sweep:(t=now())=>{nz(t,.5,.25,'bandpass',1800,1.5,600)},
  zap:(t=now())=>{tone('sawtooth',1200,t,.25,.08,120);nz(t,.2,.12,'highpass',4000)},
  hiss:(t=now())=>{tone('sawtooth',300,t,.12,.15,120);tone('square',500,t+.1,.25,.08,900)},
  piston:(t=now())=>{nz(t,.25,.3,'highpass',2000,1,500)},
});
// ---------- clap-back: "my turn" (the machine plays it) then "your turn" (the class claps it) ----------
// seq = 4-beat rhythm. Measure 0 plays it with the click; measure 1 the class claps. Group-gated on the beat-start sounds.
class ClapBack{constructor(seq,o={}){this.seq=seq;this.bpm=o.bpm||84;this.spb=60/this.bpm;this.snd=R.sounds(seq);this.n=this.snd.length;
    this.t0=ac.currentTime+.35;this.next=0;this.lit=new Array(this.n).fill(0);this.marks=new Array(this.n).fill(0);this.got=new Array(this.n).fill(0);this.pend=[];this.done=false;this.onDone=o.onDone;this.voice=o.voice||(()=>{});this.cnt=o.countIn!==false;
    this.base=this.cnt?4:0;// optional count-in measure
    BB.mic.take();}
  beatNow(){return(ac.currentTime-this.t0)/this.spb}
  phase(){const b=this.beatNow()-this.base;return b<0?'count':b<4?'listen':b<8?'ready':b<12?'clap':'end'}// v12.2: 4-beat count-in between listen and clap
  update(dt){const ahead=ac.currentTime+.12,spb=this.spb,T0=this.t0+this.base*spb;
    while(this.t0+this.next*spb<ahead&&this.next<this.base+12){const t=this.t0+this.next*spb,rd=this.next>=this.base+4&&this.next<this.base+8;BB.sfx.tick(t,this.next%4===0||rd,rd?1:.8);this.next++}
    // machine plays the rhythm in measure "listen"
    if(!this.sched){this.sched=1;this.snd.forEach((s,i)=>{const t=T0+s.b*spb;BB.sfx.block(t);setTimeout(()=>{this.lit[i]=1;this.voice(s)},Math.max(0,(t-ac.currentTime)*1000))});
      if(BB.debug)this.snd.forEach((s,i)=>{if(Math.random()<.93){const t=T0+(8+s.b)*spb+(Math.random()-.5)*.05;setTimeout(()=>BB.simClap(t,.7),Math.max(0,(t-ac.currentTime)*1000+30))}})}
    for(let i=0;i<this.n;i++){this.lit[i]=Math.max(0,this.lit[i]-dt*2.5);if(this.marks[i])this.marks[i]=Math.min(1,this.marks[i]+dt*5)}
    const ons=BB.mic.take(),C=T0+8*spb;const G=window.GroupGate,gated=BB.mic.ok&&G&&!BB.debug;
    for(const o of ons){if(BB.talking&&BB.t<BB.talking.until&&!BB.debug)continue;let best=-1,bd=1;
      for(let i=0;i<this.n;i++){if(this.got[i])continue;const s=this.snd[i],te=C+s.b*spb,gapB=Math.min(...this.snd.filter((x,j)=>j!==i).map(x=>Math.abs(x.b-s.b)),1),tol=Math.min(.13,gapB*spb*.48),d=Math.abs(o.t-te);if(d<tol&&d<bd){bd=d;best=i}}
      if(best<0){if(gated&&o.t>C)G.stray(o.t);continue}
      const s=this.snd[best];if(gated&&!o.sim&&s.f===0){this.got[best]=2;this.pend.push(best)}else this.hit(best)}
    if(gated)this.pend=this.pend.filter(i=>{const te=C+this.snd[i].b*spb;if(ac.currentTime-.02<te+G.W1+.02)return true;const m=G.judge(te);if(m.ok)this.hit(i);else{this.got[i]=0;this.few=BB.t}return false});
    if(!this.done&&ac.currentTime>C+4*spb+.25){this.done=true;const sc=this.got.filter(x=>x===1).length/this.n;this.score=sc;this.onDone&&this.onDone(sc)}}
  hit(i){this.got[i]=1;this.marks[i]=.01;BB.sfx.tink(undefined,.6)}
  override(){if(this.done)return;for(let i=0;i<this.n;i++)if(!this.got[i]){this.got[i]=1;this.marks[i]=.01}this.done=true;this.score=1;this.onDone&&this.onDone(1)}
  cursor(){const ph=this.phase();if(ph!=='clap')return -1;const b=this.beatNow()-this.base-8;for(let i=0;i<this.n;i++)if(!this.got[i]&&this.snd[i].b>=b-.12)return i;return -1}
  draw(cx,y){const ph=this.phase();R.pills(cx,y,this.seq,{lit:this.lit,marks:this.marks,cur:this.cursor(),words:true});
    const bn=this.beatNow();let msg='';
    if(ph==='count'){const n=4-Math.floor(bn);msg=n>0?'Listen... '+n:'';}
    else if(ph==='listen')msg='MY TURN: listen!';else if(ph==='ready'){const n=Math.floor(bn-this.base-4)+1;msg=['','1','2','READY','GO!'][n]||'';}else if(ph==='clap')msg='YOUR TURN: clap it!';
    if(msg)BB.text(msg,cx,y-125,ph==='ready'?56:40,ph==='clap'||msg==='GO!'?COL.green:COL.yellow,{font:'Rammetto One',stroke:7});
    // beat dots under the pills
    if(ph!=='end'&&bn>=0){const tot=4*150+3*24,bi=Math.floor(bn)%4,rd=ph==='ready';for(let i=0;i<4;i++){const on=rd?i<=bi:i===bi;ctx.fillStyle=on?(rd?COL.green:COL.yellow):'rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(cx-tot/2+75+i*174,y+62,on?(rd?13:9):6,0,7);ctx.fill();if(rd&&on&&BB.q)BB.glow(cx-tot/2+75+i*174,y+62,40,'rgba(110,230,120,A)',.5)}}}}
R.ClapBack=ClapBack;
// ---------- shared room bits ----------
// bake a static layer once (background + anything that never moves). Phones bake at half size.
R.bake=(fn)=>{const s=BB.phone&&!BB.q?.5:1,c=document.createElement('canvas');c.width=W*s;c.height=H*s;const g=c.getContext('2d');g.scale(s,s);const old=BB.ctx;
  // BB helpers draw on the shared ctx, so temporarily point the drawing calls at the layer via a swap
  fn(g);return c};
R.shadow=(g,x,y,rw,a=.45)=>{g.save();g.translate(x,y);g.scale(1,.16);const gr=g.createRadialGradient(0,0,0,0,0,rw);gr.addColorStop(0,`rgba(10,5,2,${a})`);gr.addColorStop(.6,`rgba(10,5,2,${a*.5})`);gr.addColorStop(1,'rgba(10,5,2,0)');g.fillStyle=gr;g.fillRect(-rw,-rw,2*rw,2*rw);g.restore()};
R.lampGlow=(pts,t)=>{if(!BB.q&&BB.phone)return;for(const [x,y,s] of pts){BB.glow(x,y+30,180*(s||1),'rgba(255,220,150,A)',.13+.03*Math.sin(t*2.3+x))}};
R.motes=n=>{const a=[];for(let i=0;i<n;i++)a.push({x:Math.random()*W,y:Math.random()*H,s:1+Math.random()*2.5,v:6+Math.random()*14,p:Math.random()*6});return a};
R.drawMotes=(m,dt,t)=>{if(BB.phone&&!BB.q)return;ctx.fillStyle='rgba(255,240,200,.28)';for(const d of m){d.y-=d.v*dt;d.x+=Math.sin(t*.4+d.p)*8*dt;if(d.y<-10){d.y=H+10;d.x=Math.random()*W}ctx.beginPath();ctx.arc(d.x,d.y,d.s,0,7);ctx.fill()}};
// Static Jr. bubble
R.bubble=(x,y,txt,col='#c0392b')=>{const w=BB.measure(txt,30)+50;BB.rrect(x-w/2+3,y-34+6,w,68,30,'rgba(0,0,0,.25)');BB.rrect(x-w/2,y-34,w,68,30,'#fff',COL.ink,4);
  ctx.fillStyle='#fff';ctx.strokeStyle=COL.ink;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-12,y+32);ctx.lineTo(x,y+56);ctx.lineTo(x+14,y+32);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillRect(x-14,y+26,30,8);BB.text(txt,x,y+2,30,col)};
R.loadImgs=names=>Promise.all(names.map(([n,e])=>BB.V2[n]?0:new Promise(r=>{const i=new Image();i.onload=()=>{BB.V2[n]=i;(i.decode?i.decode().catch(()=>{}):Promise.resolve()).then(r)};i.onerror=()=>r();i.src='assets/v2/'+n+'.'+e+'?v='+BB.VERSION})));
})();
