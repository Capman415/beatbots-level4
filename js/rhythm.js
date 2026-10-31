// Shared rhythm toolkit for rooms 2-3: note glyphs, glossy note tiles, segmented beat pills, extra sfx, and the clap-back game.
'use strict';
(()=>{let ctx=BB.ctx;BB._sw.push(g=>ctx=g);const COL=BB.COL,W=BB.W,H=BB.H,{clamp,lerp,ease}=BB;
const R=BB.R={};
// note kinds: w whole(4) h half(2) q ta(1) e ti-ti(1) s tika-tika(1) r rest(1)
R.BEATS={w:4,h:2,q:1,e:1,s:1,r:1};
R.NAME={w:'WHOLE',h:'HALF',q:'TA',e:'TI-TI',s:'TIKA-TIKA',r:'REST'};
R.SAY={w:'ta-a-a-a',h:'ta-a',q:'ta',e:'ti-ti',s:'tika-tika',r:'(rest)'};
// v12.2: sheet-music ink look (matches the order ticket): black notation with a soft graphite bevel; colour only on UI
const INK=['#5a5a68','#1a1a22','#040406'];/* v12.6: glossy black CGI solid */R.COLS={w:INK,h:INK,q:INK,e:INK,s:INK,r:['#7d8c8a','#55625f','#323b39']};
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
/* v14.2: one head size for every note on a card (q, e, h share it; dense s/a/b only shrink if they must) */
R.cardNs=(k,bw,bh,n=1)=>{const U=Math.min(bh*.2,bw/5.4);return k==='s'||k==='a'||k==='b'?Math.min(U,R.noteSize(k,n*bw-6,bh)):U};
R.note3d=(k,w,h,o={})=>{const sc=2,key=k+'|'+Math.round(w)+'|'+Math.round(h)+'|'+(o.gs||1)+'|'+(o.ns?o.ns.toFixed(1):'');if(n3c[key])return n3c[key];
  const s=(o.ns||R.noteSize(k,w,h))*(o.gs||1)*sc,PAD=Math.ceil(s*.9),cw=Math.ceil(w*sc)+PAD*2,ch=Math.ceil(h*sc)+PAD*2;
  const m=document.createElement('canvas');m.width=cw;m.height=ch;const mg=m.getContext('2d');
  const gx=cw/2+(k==='e'||k==='s'||k==='w'?0:-s*.4),gy=PAD+h*sc*.86-(k==='w'?h*sc*.3:0);
  if(k==='w'){mg.save();mg.translate(gx,gy);mg.fillStyle='#000';mg.beginPath();mg.ellipse(0,0,s*1.25,s*.85,0,0,7);mg.fill();mg.globalCompositeOperation='destination-out';mg.beginPath();mg.ellipse(0,0,s*.55,s*.42,-.8,0,7);mg.fill();mg.restore()}
  else R.glyph(k,gx,gy,s,'#000',mg);
  const c=R.COLS[k],out=document.createElement('canvas');out.width=cw;out.height=ch;const g=out.getContext('2d');
  const ink=tint(m,()=>'#141419'),deep=tint(m,()=>c[2]),face=tint(m,(gg)=>{const L=gg.createLinearGradient(0,PAD,0,ch-PAD);L.addColorStop(0,c[0]);L.addColorStop(.55,c[1]);L.addColorStop(1,c[2]);return L});
  /* v12.6b: solid 3D note object - extruded thickness, bevelled edges, shaded head, cylinder-lit stems, rim light */
  const d=Math.max(3,s*.3),ex=d*.55;
  const edge=(dx,dy,fill)=>{const e=document.createElement('canvas');e.width=cw;e.height=ch;const eg=e.getContext('2d');eg.drawImage(m,0,0);eg.globalCompositeOperation='destination-out';eg.drawImage(m,dx,dy);return tint(e,fill)};
  /* extrusion: side walls lit from above (lighter near the face) */
  const sideC=tint(m,(gg)=>{const L=gg.createLinearGradient(0,0,0,ch);L.addColorStop(0,'#2c2c36');L.addColorStop(1,'#08080b');return L});
  for(let i=Math.ceil(d);i>0;i--){g.globalAlpha=1;g.drawImage(sideC,i*ex/d*1,i)}
  g.drawImage(edge(0,-1.5,()=>'rgba(150,150,170,.5)'),ex,d);/* lit lower lip of the side */
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;g.drawImage(ink,Math.cos(a)*s*.05,Math.sin(a)*s*.05)}
  /* face: radial key light centred up-left of the note head */
  const hx=gx-s*.45,hy=gy-s*.45;
  const face2=tint(m,(gg)=>{const G=gg.createRadialGradient(hx,hy,s*.1,gx,gy,s*1.9);G.addColorStop(0,'#7a7a8c');G.addColorStop(.35,'#2e2e3a');G.addColorStop(1,'#060608');return G});
  g.drawImage(face2,0,0);
  /* stems/beams: vertical cylinder shading via a soft vertical-gradient over everything above the head */
  {const cy=tint(m,(gg)=>{const L=gg.createLinearGradient(0,0,0,gy-s*.6);L.addColorStop(0,'rgba(120,120,140,.25)');L.addColorStop(1,'rgba(0,0,0,0)');return L});g.save();g.globalCompositeOperation='source-atop';g.drawImage(cy,0,0);g.restore()}
  const b1=Math.max(1.5,s*.14);
  g.save();g.globalCompositeOperation='source-atop';
  g.drawImage(edge(b1,b1,()=>'rgba(255,255,255,.55)'),0,0);/* top-left bevel = light side; on stems this is the cylinder highlight */
  g.drawImage(edge(b1*.45,b1*.45,()=>'rgba(255,255,255,.5)'),0,0);
  g.drawImage(edge(-b1,-b1,()=>'rgba(0,0,0,.7)'),0,0);/* bottom-right = dark side */
  g.drawImage(edge(-b1*.7,0,()=>'rgba(255,205,140,.55)'),0,0);/* warm rim light on the right edge */
  g.restore();
  const sp=document.createElement('canvas');sp.width=cw;sp.height=ch;const sg=sp.getContext('2d');sg.drawImage(m,0,0);sg.globalCompositeOperation='destination-out';sg.drawImage(m,s*.09,s*.12);
  const spt=tint(sp,()=>'rgba(255,255,255,.55)');g.drawImage(spt,0,0);
  /* head specular dot */
  if(k!=='r'){const G=g.createRadialGradient(hx+s*.15,hy+s*.2,0,hx+s*.15,hy+s*.2,s*.45);G.addColorStop(0,'rgba(255,255,255,.75)');G.addColorStop(1,'rgba(255,255,255,0)');g.save();g.globalCompositeOperation='source-atop';g.fillStyle=G;g.fillRect(0,0,cw,ch);g.restore()}
  /* v12.6: shape-true soft shadow = blurred silhouette (shadowBlur trick works on Safari too) */
  const sh=document.createElement('canvas');sh.width=cw;sh.height=ch;{const hg=sh.getContext('2d');hg.shadowColor='rgba(0,0,0,.5)';hg.shadowBlur=Math.max(4,s*.35);hg.shadowOffsetX=cw*4;hg.drawImage(m,-cw*4,0)}
  return n3c[key]={c:out,sh,sc,PAD,s:s/sc,gy:gy/sc}};
// a note object standing in a w x h box (bottom of box = the surface it rests on)
// v12.7: one syllable per printed note, centred under that note's head (matches the glyph spacing in R.glyph / R.note3d)
R.syl=(k,x,w,h)=>{const c=x+w/2;if(k==='e'||k==='s'){const n=k==='e'?2:4,s=R.noteSize(k,w,h),gap=k==='e'?s*2.9:s*2.2,x0=c-gap*(n-1)/2;return(k==='e'?['ti','ti']:['ti','ka','ti','ka']).map((sy,i)=>[x0+i*gap+s*.1,sy])}
  return[[c,{w:'ta-a-a-a',h:'ta-a',q:'ta',r:'rest'}[k]||R.SAY[k]]]};
R.tile=(k,x,y,w,h,o={})=>{ctx.save();ctx.globalAlpha=o.alpha??1;
  // label = cream name tag on the surface UNDER the note (never on the stem); the note shrinks to make room
  const fs=o.label?Math.max(14,Math.min(21,h*.16)):0,tagH=o.label?fs+10:0,pad=o.label?Math.max(6,h*.07):0;if(o.label)h-=tagH+pad*2;// v12.6: even gap note|tag|box bottom
  if(o.shadow!==false){const sw=Math.min(w*.46,(o.ns||R.noteSize(k,w,h))*(k==='s'?4.6:k==='e'?3.4:1.8));const gr=ctx.createRadialGradient(x+w/2,y+h,0,x+w/2,y+h,sw);gr.addColorStop(0,'rgba(0,0,0,.42)');gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=gr;ctx.save();ctx.translate(x+w/2,y+h);ctx.scale(1,.22);ctx.translate(-x-w/2,-y-h);ctx.beginPath();ctx.arc(x+w/2,y+h,sw,0,7);ctx.fill();ctx.restore()}
  if(o.glyph!==false){const sp=R.note3d(k,w,h,o);if(o.shadow!==false&&!(!BB.q)){/* lamp upper-left: shadow falls right & down, flattened onto the surface */const ox=sp.s*.35,oy=sp.s*.18;ctx.save();ctx.globalAlpha*=.75;const pv=y-sp.PAD/sp.sc+sp.gy+sp.s*.7;ctx.translate(x+w/2,pv);ctx.transform(1,0,-.35,.45,0,0);ctx.translate(-x-w/2,-pv);ctx.drawImage(sp.sh,x-sp.PAD/sp.sc+ox,y-sp.PAD/sp.sc+oy,sp.c.width/sp.sc,sp.c.height/sp.sc);ctx.restore()}ctx.drawImage(sp.c,x-sp.PAD/sp.sc,y-sp.PAD/sp.sc,sp.c.width/sp.sc,sp.c.height/sp.sc)}
  if(o.label){const tw=Math.min(w-8,BB.measure(R.NAME[k],fs)+18),ty=y+h+pad;BB.rrect(x+w/2-tw/2+2,ty+3,tw,tagH,7,'rgba(0,0,0,.3)');BB.rrect(x+w/2-tw/2,ty,tw,tagH,7,BB.lg(ty,ty+tagH,['#fbf6e6','#ddd3b8']),'rgba(25,25,31,.8)',2);BB.text(R.NAME[k],x+w/2,ty+tagH/2+1,fs,COL.ink,{maxW:tw-8})}
  if(o.beats){BB.text(String(R.BEATS[k]),x+w-18,y+h-18,22,'#fff',{stroke:4})}
  ctx.restore()};
// segmented beat pills: one cell per beat; ti-ti = 2 segments, tika-tika = 4, half/whole stretch over cells
R.pills=(cx,y,seq,st={})=>{const L=Math.max(4,seq.reduce((a,k)=>a+R.BEATS[k],0)),gap=st.gap||(L>4?14:24),bw=st.bw||(L>4?Math.floor((560-(L-1)*gap)/L):120),ph=50,tot=L*bw+(L-1)*gap;BB.rrect(cx-tot/2-18,y-45,tot+36,110,26,'rgba(0,0,0,.25)');BB.well(cx-tot/2-20,y-55,tot+40,110,26);/* v14.1.2 snug */
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
class ClapBack{constructor(seq,o={}){this.seq=seq;this.bpm=o.bpm||84;this.spb=60/this.bpm;this.snd=R.sounds(seq);this.n=this.snd.length;this.L=Math.max(4,seq.reduce((a,k)=>a+R.BEATS[k],0));// beats in the pattern (4, 6 or 8)
    this.t0=ac.currentTime+.35;this.next=0;this.lit=new Array(this.n).fill(0);this.marks=new Array(this.n).fill(0);this.got=new Array(this.n).fill(0);this.pend=[];this.done=false;this.onDone=o.onDone;this.voice=o.voice||(()=>{});this.cnt=o.countIn!==false;this.read=!!o.read;// v14.0 read mode: the machine stays silent on 'my turn' (class reads the notation)
    this.base=this.cnt?4:0;/* optional count-in measure */this.lc=0;this.lcT=-9;this.qDone=0;this.oQuiet=o.onQuiet;this.oSneak=o.onSneak;
    BB.mic.take();BB.groove&&BB.groove.sync(this.t0,this.spb)}
  beatNow(){return(ac.currentTime-this.t0)/this.spb}
  beatNowV(){return(ac.currentTime-BB.visLat()-this.t0)/this.spb}// v13.2 visual clock = audible beat
  phase(){const b=this.beatNow()-this.base;return b<0?'count':b<this.L?'listen':b<this.L+4?'ready':b<2*this.L+4?'clap':'end'}// v12.2: 4-beat count-in between listen and clap
  update(dt){{const ph=this.phase();BB.listening=ph==='clap'?2:ph==='ready'?1:0}const ahead=ac.currentTime+.12,spb=this.spb,T0=this.t0+this.base*spb;
    while(this.t0+this.next*spb<ahead&&this.next<this.base+2*this.L+4){const t=this.t0+this.next*spb,rd=this.next>=this.base+this.L&&this.next<this.base+this.L+4;BB.sfx.tick(t,this.next%4===0||rd,rd?1:.8);if(this.next===this.base+this.L)R.turnCue(t);this.next++}
    // machine plays the rhythm in measure "listen"
    if(!this.sched){this.sched=1;this.snd.forEach((s,i)=>{const t=T0+s.b*spb;if(this.read)return;BB.sfx.block(t);setTimeout(()=>this.voice(s),Math.max(0,(t-ac.currentTime)*1000))});
      if(BB.debug)this.snd.forEach((s,i)=>{if(Math.random()<.93){const t=T0+(this.L+4+s.b)*spb+(Math.random()-.5)*.05;setTimeout(()=>BB.simClap(t,.7),Math.max(0,(t-ac.currentTime)*1000+30))}})}
    {const tv=ac.currentTime-BB.visLat(),Cc=T0+(this.L+4)*spb;for(let i=0;i<this.n;i++){let l=0;for(const b0 of[T0,Cc]){const d=tv-(b0+this.snd[i].b*spb);if(d>=0&&d<.4)l=Math.max(l,1-d*2.5)}this.lit[i]=l}}// v13.2 lights locked to the audible beat (listen AND clap turn), not setTimeout
    for(let i=0;i<this.n;i++){if(this.marks[i])this.marks[i]=Math.min(1,this.marks[i]+dt*5)}
    const ons=BB.mic.take(),C=T0+(this.L+4)*spb;if(BB.MLP&&BB.MLP.on){const bs=this.snd.map(x=>x.b);BB.MLP.openWin('rhythm',C+Math.min(...bs)*spb-.12,C+Math.max(...bs)*spb+.18)}const G=window.GroupGate,gated=BB.mic.ok&&G&&!BB.debug;
    if(window.ClapDet&&this.seq.includes('s'))ClapDet.fastUntil=ac.currentTime+.5;if(window.ClapDet&&ClapDet.expect&&!this._gap){const bs=this.snd.map(x=>x.b).sort((p,q)=>p-q);let g=1;for(let i=1;i<bs.length;i++)g=Math.min(g,bs[i]-bs[i-1]);this._gap=Math.max(.125,g)*spb}if(window.ClapDet&&ClapDet.expect)ClapDet.expect(this._gap,ac.currentTime+.5);// v13.3: refractory follows the shortest note gap of this rhythm// v13.2 tika-tika: claps 0.18 s apart must not be merged
    // v13.6 clap96 (default; ?det=old = v13.3): per-note score-informed decision on the mic minus our own output, verified by clapnet96
    const K=window.C96;if(K&&!this._k&&K.active()&&ac.currentTime>C-.3){const bs=this.snd.map(x=>x.b).sort((p,q)=>p-q);let g=1;for(let i=1;i<bs.length;i++)g=Math.min(g,bs[i]-bs[i-1]);this._k=K.expect(this,this.snd.map(x=>C+x.b*spb),Math.max(.125,g)*spb)?1:2}
    if(this._k===1){for(const d of K.poll(this)){const te=C+this.snd[d.i].b*spb;if(d.t!=null){BB.clapStats.heard++;BB.clapLog.add({bpm:this.bpm,i:d.i,exp:te,on:d.t,peak:d.info&&d.info.v,thr:d.info&&d.info.s,res:this.got[d.i]?'rejected-as-double':'hit'});if(!this.got[d.i])this.hit(d.i)}else BB.clapLog.add({bpm:this.bpm,i:d.i,exp:te,peak:d.info&&d.info.v,thr:d.info&&d.info.s,res:d.info&&d.info.v>0?'too soft':'miss'});this.logged=this.logged||{};this.logged[d.i]=1}ons.length=0}
    {const S=BB.clapStats,ph=this.phase();if(ph==='clap'){S.peak=Math.max(S.peak,BB.mic.level||0);if(dt>.05)S.slow++}}
    /* v14.3 listening turn: claps while Sprocket plays are logged as clap_during_listen and never scored */
    for(let j=ons.length-1;j>=0;j--){const o=ons[j];if(!o.up&&o.t>=T0-.08&&o.t<T0+this.L*spb+.08){this.lc++;this.lcT=BB.t;BB.clapLog.add({bpm:this.bpm,on:o.t,peak:o.v??o.e,res:'clap_during_listen'});ons.splice(j,1)}}
    if(!this.qDone&&this.beatNow()-this.base>=this.L+.1){this.qDone=1;R.listenResult(this)}
    for(const o of ons){if(o.up){BB.clapLog.add({bpm:this.bpm,on:o.t,peak:o.v??o.e,res:'rejected-as-double'});continue}BB.clapStats.heard++;if(BB.talking&&BB.t<BB.talking.until&&!BB.debug){BB.clapStats.talk++;BB.clapLog.add({bpm:this.bpm,on:o.t,peak:o.v??o.e,res:'ignored-during-playback'});continue}let best=-1,bd=1;
      for(let i=0;i<this.n;i++){if(this.got[i])continue;const s=this.snd[i],te=C+s.b*spb,gapB=Math.min(...this.snd.filter((x,j)=>j!==i).map(x=>Math.abs(x.b-s.b)),1),lat=G?G.lat||0:0,dd=o.t-lat-te,tol=dd<0?Math.min(.15,gapB*spb*.48):Math.min(.22,gapB*spb*.55)/* v14.2 wider (Clap Check leniency) */,d=Math.abs(dd);if(d<tol&&d<bd){bd=d;best=i}}
      if(best<0){if(o.t>C){BB.clapStats.stray++;let ni=0,nd=1e9;for(let i=0;i<this.n;i++){const dd=o.t-(C+this.snd[i].b*spb);if(Math.abs(dd)<Math.abs(nd)){nd=dd;ni=i}}BB.clapLog.add({bpm:this.bpm,i:ni,exp:C+this.snd[ni].b*spb,on:o.t,peak:o.v??o.e,res:this.got[ni]?'rejected-as-double':nd<0?'early':'late'})}if(gated&&o.t>C)G.stray(o.t);continue}
      BB.clapLog.add({bpm:this.bpm,i:best,exp:C+this.snd[best].b*spb,on:o.t,peak:o.v??o.e,res:'hit'});(this.logged=this.logged||{})[best]=1;const s=this.snd[best];if(gated&&!o.sim&&s.f===0){this.got[best]=2;this.pend.push(best)}else this.hit(best)}
    if(gated)this.pend=this.pend.filter(i=>{const te=C+this.snd[i].b*spb;if(ac.currentTime-.02<te+G.lat+Math.max(G.W1,G.win(spb)[1])+.02)return true;const m=G.judge(te,false,spb);if(m.ok)this.hit(i);else{this.got[i]=0;this.few=BB.t;BB.clapLog.add({bpm:this.bpm,i,exp:te,res:'too soft'})}return false});
    if(!this.done&&ac.currentTime>C+this.L*spb+.25&&!(this._k===1&&K.exp&&K.exp.key===this&&ac.currentTime<C+this.L*spb+1.2)){if(this._k===1&&K.exp&&K.exp.key===this)K.cancel();this.done=true;const sc=this.got.filter(x=>x===1).length/this.n;BB.clapStats.exp+=this.n;for(let i=0;i<this.n;i++)if(this.got[i]!==1&&!(this.logged&&this.logged[i]))BB.clapLog.add({bpm:this.bpm,i,exp:C+this.snd[i].b*spb,res:'miss'});BB.clapStats.hit+=this.got.filter(x=>x===1).length;this.score=sc;this.onDone&&this.onDone(sc)}}
  hit(i){this.got[i]=1;this.marks[i]=.01;BB.sfx.tink(undefined,.6)}
  override(){if(this.done)return;for(let i=0;i<this.n;i++)if(!this.got[i]){this.got[i]=1;this.marks[i]=.01}this.done=true;this.score=1;this.onDone&&this.onDone(1)}
  cursor(){const ph=this.phase();if(ph!=='clap')return -1;const b=this.beatNow()-this.base-this.L-4;for(let i=0;i<this.n;i++)if(!this.got[i]&&this.snd[i].b>=b-.12)return i;return -1}
  draw(cx,y){const ph=this.phase(),yt=ph==='ready'||ph==='clap';
    if(yt)R.yourTurn(ph,this.beatNowV()-this.base-this.L,y);
    if(ph==='listen'||(ph==='count'&&this.beatNowV()>=this.base-1))R.listenBanner(this);if(ph==='clap')R.turnFlash((this.beatNowV()-this.base-this.L-4)*this.spb);

    if(yt){ctx.save();ctx.translate(cx,y);ctx.scale(1.18,1.18);ctx.translate(-cx,-y);}// bigger beat lights while it's the class's turn
    R.pills(cx,y,this.seq,{lit:this.lit,marks:this.marks,cur:this.cursor(),words:true});if(yt)ctx.restore();
    const bn=this.beatNowV();let msg='';
    if(ph==='count'){const n=4-Math.floor(bn);msg=n>0?'Listen... '+n:'';}
    else if(ph==='listen')msg=this.read?'READ IT... (silently)':'MY TURN: listen!';else if(ph==='ready'){const n=Math.floor(bn-this.base-this.L)+1;msg=['','1','2','READY','GO!'][n]||'';}else if(ph==='clap')msg='YOUR TURN: clap it!';
    if(msg)BB.text(msg,cx,y-125,ph==='ready'?56:40,ph==='clap'||msg==='GO!'?COL.green:COL.yellow,{font:'Rammetto One',stroke:7});
    // beat dots under the pills
    if(ph!=='end'&&bn>=0){const rd=ph==='ready',nd=rd?4:this.L,tot=4*120+3*24,step=(tot-150)/(nd-1),rel=bn-this.base,bi=rd?Math.floor(rel-this.L):ph==='clap'?Math.floor(rel-this.L-4):ph==='listen'?Math.floor(rel):Math.floor(bn)%4;for(let i=0;i<nd;i++){const on=rd?i<=bi:i===bi;ctx.fillStyle=on?(rd?COL.green:COL.yellow):'rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(cx-tot/2+75+i*step,y+62,on?(rd?13:9):6,0,7);ctx.fill();if(rd&&on&&BB.q)BB.glow(cx-tot/2+75+i*step,y+62,40,'rgba(110,230,120,A)',.5)}}}}
R.ClapBack=ClapBack;
/* v14.3 quiet listening: LISTEN banner + quiet meter, a quiet-listen star, Static Jr. sneak (2+ claps, mode ON), teacher mode on/gentle/off */
{let mode='on';try{mode=localStorage.getItem('bb_listenmode')||'on'}catch(e){}
 BB.listenMode={get v(){return mode},cycle(){mode={on:'gentle',gentle:'off',off:'on'}[mode]||'on';try{localStorage.setItem('bb_listenmode',mode)}catch(e){}},label(){return{on:'ON',gentle:'GENTLE (K)',off:'OFF'}[mode]}}}
R.qStars=()=>{const S=BB.scene||{};return S._qStars||0};
R.listenResult=cb=>{const S=BB.scene;if(!S||BB.listenMode.v==='off')return;
  if(cb.lc===0){S._qStars=(S._qStars||0)+1;cb.oQuiet&&cb.oQuiet();BB.sfx.tink&&BB.sfx.tink(undefined,.5);BB.burst&&BB.burst(W/2+250,232,16,{col:COL.yellow,kind:'star',size:15,speed:500,g:300});S._qFx={t:BB.t,k:'star'}}
  else if(cb.lc>=2&&BB.listenMode.v==='on'){if(S._qStars>0)S._qStars--;cb.oSneak&&cb.oSneak();S._sneak={t:BB.t};BB.sfx.glitch?BB.sfx.glitch():BB.sfx.zap()}};
R.listenBanner=cb=>{const t=BB.t,by=118,bh=150,bw=980,bx=W/2-bw/2,lc=cb.lc,sh=BB.t-cb.lcT<.35?Math.sin(BB.t*90)*10*(1-(BB.t-cb.lcT)/.35):0;
  ctx.save();ctx.translate(sh,0);
  BB.rrect(bx,by-bh/2+8,bw,bh,34,'rgba(0,0,0,.35)');BB.rrect(bx,by-bh/2,bw,bh,34,'#183e3e','#eee4cc',8);
  // ear + hands-down icons
  const ex=bx+95,ey=by;ctx.save();ctx.translate(ex,ey);ctx.fillStyle='#f3c9a2';ctx.strokeStyle='#5a3a24';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,0,34,48,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(2,-6,18,Math.PI*.9,Math.PI*2.2);ctx.stroke();ctx.beginPath();ctx.moveTo(6,10);ctx.quadraticCurveTo(-6,24,4,30);ctx.stroke();
   for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(255,216,74,${.9-.25*i})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(-52,0,16+i*14+((t*30)%14),-.7,.7);ctx.stroke()}ctx.restore();
  const hx=bx+bw-95;ctx.save();ctx.translate(hx,by);for(const s of[-1,1]){ctx.save();ctx.translate(s*22,-8);ctx.fillStyle='#f3c9a2';ctx.strokeStyle='#5a3a24';ctx.lineWidth=4;BB.rrect(-14,-34,28,52,12,'#f3c9a2','#5a3a24',4);ctx.restore()}
   ctx.strokeStyle='#ffd84a';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,26);ctx.lineTo(0,54);ctx.moveTo(-12,42);ctx.lineTo(0,56);ctx.lineTo(12,42);ctx.stroke();ctx.restore();
  BB.text('LISTEN',W/2,by-26,72,'#ffd84a',{font:'Rammetto One',stroke:10});
  ctx.restore();
  // quiet meter under the banner
  const mw=520,mx=W/2-mw/2,my=by+22,mh=34,spb=cb.spb,f=Math.max(0,Math.min(1,(cb.beatNowV()-cb.base)/cb.L)),cr=lc>0;
  ctx.save();ctx.translate(sh*.6,0);BB.rrect(mx-6,my-6,mw+12,mh+12,22,'#0f2a2a','#eee4cc',3);
  if(f>0)BB.rrect(mx,my,Math.max(mh,mw*f),mh,17,cr?'#8aa39d':BB.lg(my,my+mh,['#9ff5b0','#46b45a']));
  BB.text(cr?(lc>=2&&BB.listenMode.v==='on'?'TOO NOISY!':'SHHH...'):(cb.read?'QUIET: read it silently':'QUIET: hands down, ears on'),W/2,my+mh/2+2,22,'#fff',{stroke:4});
  if(cr){ctx.strokeStyle='#1e2b29';ctx.lineWidth=3;ctx.beginPath();const n=Math.min(lc,4);for(let k=0;k<n;k++){const cx=mx+60+k*110;ctx.moveTo(cx,my);ctx.lineTo(cx+12,my+12);ctx.lineTo(cx-6,my+22);ctx.lineTo(cx+8,my+mh)}ctx.stroke()}
  const q=R.qStars();if(q>0||BB.scene._qStars!=null){BB.star(mx+mw+36,my+mh/2,16,COL.yellow,0);BB.text('x'+q,mx+mw+70,my+mh/2+2,24,'#fff',{stroke:4})}
  ctx.restore()};
R.turnFlash=dt=>{if(dt<0||dt>.45)return;const k=1-dt/.45;ctx.save();ctx.globalAlpha=.55*k;ctx.fillStyle='#fffbe0';ctx.fillRect(0,0,W,H);ctx.restore()};
/* sneak overlay: drawn by every ClapBack room after its scene (see BB.drawSneak in engine loop) */
R.drawSneak=()=>{const S=BB.scene;if(!S||!S._sneak)return;const t=BB.t-S._sneak.t;if(t>2){S._sneak=null;return}
  const inn=Math.min(1,t/.35),out=t>1.5?(t-1.5)/.5:0,x=W-140+(1-inn)*260+out*320,y=H-40;
  ctx.save();BB.staticJr(x,y,150,{run:out>0?1:.3,flip:out<=0,rot:Math.sin(BB.t*18)*.06,glitch:t<.4?1:0});ctx.restore();
  if(t<1.5){const bx=x-40,byy=y-280;BB.star(bx-60-(t>.6?(t-.6)*-40:0),byy+60,22,COL.yellow,0);R.bubble(x-60,y-300,'Hee hee! Mine!','#8a2a6e')}
  if(t<.5){ctx.save();ctx.globalAlpha=.25*(1-t/.5);for(let i=0;i<40;i++){ctx.fillStyle=i%2?'#fff':'#7ef0ff';ctx.fillRect(Math.random()*W,Math.random()*H,40+Math.random()*120,2)}ctx.restore()}};

/* v14.2 clap readout (pause menu): what the detector heard vs counted, so misses are visible */
BB.clapStats={heard:0,hit:0,exp:0,talk:0,stray:0,peak:0,slow:0};
/* v14.2.1 local clap diagnostics log: numbers only (never audio), localStorage on this device, last 30000 events.
   Compact rows: [t (0.1 s since epoch base), session idx, room code, bpm, beat, exp*1000, on*1000, peak*1000, thr*1000, result code, playing] */
{const KEY='bb_claplog2',SKEY='bb_clsess',CAP=30000,WARN=27000,T0=17e9,
 RES=['hit','miss','early','late','too soft','ignored-during-playback','rejected-as-double','clap_during_listen'];
 const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}};
 let ev=ld(KEY,[]),sess=ld(SKEY,[]);
 const pad=n=>String(n).padStart(2,'0'),dstr=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 /* v14.2.1 session tag: Day (Mon-Fri) + Class (K-4) pickers only. No student details, no free text. */
 const DAYS=['Mon','Tue','Wed','Thu','Fri'],CLS=['K','1','2','3','4'];
 const today=()=>{const w=new Date().getDay();return DAYS[w>=1&&w<=5?w-1:0]};
 let tag={day:today(),cls:(()=>{const c=ld('bb_sessclass','K');return CLS.includes(c)?c:'K'})()};
 const curSess=()=>{const td=dstr(new Date()),l=sess[sess.length-1];
   if(l&&l.date===td&&l.day===tag.day&&l.cls===tag.cls)return sess.length-1;
   const d=new Date();sess.push({id:td.replace(/-/g,'')+'-'+pad(d.getHours())+pad(d.getMinutes())+'-'+tag.day+'-C'+tag.cls,date:td,day:tag.day,cls:tag.cls});dirty=1;return sess.length-1};
 BB.session={DAYS,CLS,get day(){return tag.day},get cls(){return tag.cls},
  cycleDay(){tag.day=DAYS[(DAYS.indexOf(tag.day)+1)%5]},
  cycleClass(){tag.cls=CLS[(CLS.indexOf(tag.cls)+1)%5];try{localStorage.setItem('bb_sessclass',JSON.stringify(tag.cls))}catch(e){}},
  set(d,c){if(DAYS.includes(d))tag.day=d;if(CLS.includes(c))tag.cls=c}};
 /* migrate v14.2 rows (old key) */
 {const old=ld('bb_claplog',null);if(old&&old.length){const si=sess.push({id:'v14.2-untagged',date:'',day:'',cls:''})-1;
   for(const r of old){const t=Date.parse(r[0]);ev.push([isNaN(t)?0:Math.round(t/100)-T0,si,r[1],r[2],r[3],r[4]===''?'':Math.round(r[4]*1000),r[5]===''?'':Math.round(r[5]*1000),r[7]===''?'':Math.round(r[7]*1000),r[8]===''?'':Math.round(r[8]*1000),Math.max(0,RES.indexOf(r[9])),r[10]])}
   try{localStorage.removeItem('bb_claplog')}catch(e){}}}
 let on=true;try{on=localStorage.getItem('bb_clog')!=='0'}catch(e){}
 let dirty=1,full=0;const save=()=>{if(!dirty)return;dirty=0;try{localStorage.setItem(SKEY,JSON.stringify(sess));localStorage.setItem(KEY,JSON.stringify(ev));full=0}catch(e){full=1;ev.splice(0,ev.length>>3)}};setInterval(save,3000);
 const playing=()=>{const t=ac.currentTime;return !!((BB.talking&&BB.t<BB.talking.until)||(BB.selfWins||[]).some(w=>t>=w.t&&t<=w.e+.05))};
 const ms=v=>v==null||v===''||isNaN(v)?'':Math.round(v*1000);
 const ROOMN={MineRoom:'mine',SmasherRoom:'smasher',PackingRoom:'packing',LabelRoom:'label',DeliveryRoom:'delivery'};
 const q=v=>{v=String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
 const dl=(txt,name)=>{const b=new Blob([txt],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
 BB.clapLog={get on(){return on},set on(v){on=!!v;try{localStorage.setItem('bb_clog',on?'1':'0')}catch(e){}},count:()=>ev.length,CAP,WARN,
  nearCap:()=>ev.length>=WARN||full,bytes:()=>{try{return((localStorage.getItem(KEY)||'').length+(localStorage.getItem(SKEY)||'').length)*2}catch(e){return 0}},
  add(o){if(!on)return;const m=BB.mic||{},n=(BB.scene&&BB.scene.constructor&&BB.scene.constructor.name)||'';
   ev.push([Math.round(Date.now()/100)-T0,curSess(),ROOMN[n]||n,o.bpm||'',o.i??'',ms(o.exp),ms(o.on),ms(o.peak??m.level),ms(o.thr??m.floor),Math.max(0,RES.indexOf(o.res)),playing()?1:0]);
   if(ev.length>CAP)ev.splice(0,ev.length-CAP);dirty=1},
  rows(){return ev.map(r=>{const S=sess[r[1]]||{},e=r[5],o=r[6];return{ts:r[0]?new Date((r[0]+T0)*100).toISOString():'',s:S,room:r[2],bpm:r[3],i:r[4],exp:e===''?'':e/1000,on:o===''?'':o/1000,off:e!==''&&o!==''?o-e:'',peak:r[7]===''?'':r[7]/1000,thr:r[8]===''?'':r[8]/1000,res:RES[r[9]],pl:r[10]}})},
  csv(){return 'session_id,date,day,class,timestamp,room,bpm,beat_index,expected_s,onset_s,offset_ms,peak_level,threshold,result,game_audio_playing\n'+BB.clapLog.rows().map(r=>[r.s.id||'',r.s.date||'',r.s.day||'',r.s.cls||'',r.ts,r.room,r.bpm,r.i,r.exp,r.on,r.off,r.peak,r.thr,r.res,r.pl].map(q).join(',')).join('\n')},
  summaryCsv(){const g=new Map();for(const r of BB.clapLog.rows()){const k=(r.s.id||'')+'|'+r.room;let a=g.get(k);if(!a){a={s:r.s,room:r.room,c:{},n:0,offs:[],first:r.ts,last:r.ts};g.set(k,a)}a.n++;a.c[r.res]=(a.c[r.res]||0)+1;a.last=r.ts;if(r.res==='hit'&&r.off!=='')a.offs.push(r.off)}
   const med=x=>{if(!x.length)return'';x=x.slice().sort((a,b)=>a-b);return x[x.length>>1]};
   return 'session_id,date,day,class,room,first_event,last_event,events,hits,misses,early,late,too_soft,ignored_during_playback,rejected_double,clap_during_listen,hit_rate,median_hit_offset_ms\n'+[...g.values()].map(a=>{const c=k=>a.c[k]||0,h=c('hit'),den=h+c('miss')+c('too soft')+c('early')+c('late');
    return[a.s.id||'',a.s.date||'',a.s.day||'',a.s.cls||'',a.room,a.first,a.last,a.n,h,c('miss'),c('early'),c('late'),c('too soft'),c('ignored-during-playback'),c('rejected-as-double'),c('clap_during_listen'),den?(h/den).toFixed(3):'',med(a.offs)].map(q).join(',')}).join('\n')},
  download(){save();dl(BB.clapLog.csv(),'beatbots_claplog_'+dstr(new Date())+'.csv')},
  downloadSummary(){save();dl(BB.clapLog.summaryCsv(),'beatbots_claplog_summary_'+dstr(new Date())+'.csv')},
  clear(){ev=[];sess=[];dirty=1;save();if(BB.clapStats)for(const k in BB.clapStats)BB.clapStats[k]=0}}}

// v12.6: paper fibre texture (cached pattern) for tickets
let paperPat=null;R.paper=(x,y,w,h)=>{if(!paperPat){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');for(let i=0;i<1400;i++){const v=Math.random();g.fillStyle=v<.5?`rgba(120,95,60,${Math.random()*.06})`:`rgba(255,255,255,${Math.random()*.12})`;g.fillRect(Math.random()*128,Math.random()*128,1+Math.random()*3,1)}paperPat=ctx.createPattern(c,'repeat')}
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.clip();ctx.fillStyle=paperPat;ctx.fillRect(x,y,w,h);const e=ctx.createRadialGradient(x+w/2,y+h/2,Math.min(w,h)*.3,x+w/2,y+h/2,Math.max(w,h)*.75);e.addColorStop(0,'rgba(120,90,40,0)');e.addColorStop(1,'rgba(120,90,40,.18)');ctx.fillStyle=e;ctx.fillRect(x,y,w,h);ctx.restore()};
// v12.6: unmistakable "YOUR TURN" cue (Smartboard-readable): retro ding-ding, full-width pulsing banner, green listening border, robots pointing at the class
R.turnCue=t=>{const s=BB.sfx;if(s.ding){s.ding(t);s.ding(t+.22)}};
R.turnBorder=(cl,pu)=>{if(pu==null)pu=.5+.5*Math.sin(BB.t*Math.PI*2*1.4);ctx.save();const bw=cl?26:16;ctx.lineWidth=bw;ctx.strokeStyle=cl?`rgba(110,230,120,${.55+.4*pu})`:`rgba(255,224,102,${.4+.3*pu})`;ctx.shadowColor=cl?'#6ee678':'#ffe066';ctx.shadowBlur=40;ctx.strokeRect(bw/2,bw/2,W-bw,H-bw);ctx.restore()};
R.yourTurn=(ph,rb,py)=>{const t=BB.t,pu=.5+.5*Math.sin(t*Math.PI*2*1.4),cl=ph==='clap';
  // green border glow while listening
  ctx.save();const bw=cl?26:16;ctx.lineWidth=bw;ctx.strokeStyle=cl?`rgba(110,230,120,${.55+.4*pu})`:`rgba(255,224,102,${.4+.3*pu})`;ctx.shadowColor=cl?'#6ee678':'#ffe066';ctx.shadowBlur=40;ctx.strokeRect(bw/2,bw/2,W-bw,H-bw);ctx.restore();
  // full-width banner
  const by=118,bh=150;ctx.save();ctx.shadowColor=cl?'#6ee678':'#ffe066';ctx.shadowBlur=30+30*pu;
  BB.rrect(30,by-bh/2+8,W-60,bh,34,'rgba(0,0,0,.35)');BB.rrect(30,by-bh/2,W-60,bh,34,BB.lg(-bh/2,bh/2,cl?['#86e486','#3fae4c']:['#f6d65e','#e3b02a']/* v12.8 glare pass: even marquee fill */),'#1e2b29',8);ctx.restore();
  for(let i=0;i<14;i++){const bx=70+i*(W-140)/13,on=(Math.floor(t*6)+i)%2;ctx.fillStyle=on?'#fffbe0':'rgba(80,60,20,.5)';ctx.beginPath();ctx.arc(bx,by-bh/2+16,7,0,7);ctx.arc(bx,by+bh/2-16,7,0,7);ctx.fill()}// marquee bulbs
  const big=cl?'YOUR TURN, ENGINEERS! CLAP!':(['GET READY... 1','GET READY... 2','READY...','GO!'][Math.max(0,Math.min(3,Math.floor(rb)))]);
  BB.text(big,W/2,by+4,(cl?84:90)*(1+.04*pu)*(cl?1+.3*Math.max(0,1-(rb-4)*2.5):1),'#fffdf2',{font:'Rammetto One',stroke:12,maxW:W-420});
  // robots turn and point at the class
  for(const sd of[-1,1]){const rx=W/2+sd*(W/2-130),ry=by+70;ctx.save();ctx.translate(rx,ry);ctx.scale(-sd,1);
    if(BB.IMG&&BB.IMG.sprocket)BB.sprite('sprocket',0,0,150,{parts:false});
    // v14.0: hand-drawn pointing arm removed (teacher: 'weird arm' on the green countdown)
    ctx.restore()}};
// ---------- shared room bits ----------
// bake a static layer once (background + anything that never moves). Phones bake at half size.
R.bake=(fn)=>{const s=!BB.q?.5:1,c=document.createElement('canvas');c.width=W*s;c.height=H*s;const g=c.getContext('2d');g.scale(s,s);const old=BB.ctx;
  // BB helpers draw on the shared ctx, so temporarily point the drawing calls at the layer via a swap
  fn(g);return c};
R.shadow=(g,x,y,rw,a=.45)=>{g.save();g.translate(x,y);g.scale(1,.16);const gr=g.createRadialGradient(0,0,0,0,0,rw);gr.addColorStop(0,`rgba(10,5,2,${a})`);gr.addColorStop(.6,`rgba(10,5,2,${a*.5})`);gr.addColorStop(1,'rgba(10,5,2,0)');g.fillStyle=gr;g.fillRect(-rw,-rw,2*rw,2*rw);g.restore()};
R.lampGlow=(pts,t)=>{if(!BB.q)return;for(const [x,y,s] of pts){BB.glow(x,y+30,180*(s||1),'rgba(255,220,150,A)',.13+.03*Math.sin(t*2.3+x))}};
R.motes=n=>{const a=[];for(let i=0;i<n;i++)a.push({x:Math.random()*W,y:Math.random()*H,s:1+Math.random()*2.5,v:6+Math.random()*14,p:Math.random()*6});return a};
R.drawMotes=(m,dt,t)=>{if(!BB.q)return;ctx.fillStyle='rgba(255,240,200,.28)';for(const d of m){d.y-=d.v*dt;d.x+=Math.sin(t*.4+d.p)*8*dt;if(d.y<-10){d.y=H+10;d.x=Math.random()*W}ctx.beginPath();ctx.arc(d.x,d.y,d.s,0,7);ctx.fill()}};
// Static Jr. bubble
R.bubble=(x,y,txt,col='#c0392b')=>{const w=BB.measure(txt,30)+50;BB.rrect(x-w/2+3,y-34+6,w,68,30,'rgba(0,0,0,.25)');BB.rrect(x-w/2,y-34,w,68,30,'#fff',COL.ink,4);
  ctx.fillStyle='#fff';ctx.strokeStyle=COL.ink;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-12,y+32);ctx.lineTo(x,y+56);ctx.lineTo(x+14,y+32);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillRect(x-14,y+26,30,8);BB.text(txt,x,y+2,30,col)};
R.loadImgs=names=>Promise.all(names.map(([n,e])=>BB.V2[n]?0:new Promise(r=>{const i=new Image();i.onload=()=>{BB.V2[n]=i;(i.decode?i.decode().catch(()=>{}):Promise.resolve()).then(r)};i.onerror=()=>r();i.src='assets/v2/'+n+'.'+e+'?v='+BB.VERSION})));
})();
// v14.1 painted-look pass for code-drawn props: draw into a layer, then add grain texture, a top-left key light,
// a soft bottom occlusion and a warm grade so vector shapes sit in the painted backgrounds. tier 0 = plain draw.
(()=>{const R=BB.R;let L=null,grain=null;
function grainPat(g){if(grain)return g.createPattern(grain,'repeat');const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d');const d=x.createImageData(160,160);
  for(let i=0;i<d.data.length;i+=4){const w=Math.random()<.5;d.data[i]=d.data[i+1]=d.data[i+2]=w?255:0;d.data[i+3]=Math.random()*90}x.putImageData(d,0,0);
  x.globalAlpha=.25;for(let i=0;i<260;i++){x.strokeStyle=Math.random()<.5?'#fff':'#000';x.lineWidth=1+Math.random()*2;const a=Math.random()*7,l=6+Math.random()*16,px=Math.random()*160,py=Math.random()*160;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke()}
  grain=c;return g.createPattern(c,'repeat')}
R.paint=(target,fn,o={})=>{if(!BB.tier){BB.withCtx(target,fn);return}const cw=target.canvas.width,ch=target.canvas.height;
  if(!L||L.width!==cw||L.height!==ch){L=document.createElement('canvas');L.width=cw;L.height=ch}const g=L.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cw,ch);
  g.setTransform(target.getTransform());BB.withCtx(g,fn);g.setTransform(1,0,0,1,0,0);
  g.save();g.globalCompositeOperation='source-atop';
  /* v14.2: grain removed (read as noise next to the painted rooms); opt-in via o.grain */if(o.grain){g.globalAlpha=o.grain;g.fillStyle=grainPat(g);g.fillRect(0,0,cw,ch)}
  g.globalAlpha=1;const lg=g.createLinearGradient(0,0,cw*.35,ch);lg.addColorStop(0,'rgba(255,236,200,.16)');lg.addColorStop(.55,'rgba(255,220,170,0)');lg.addColorStop(1,'rgba(30,18,10,.22)');g.fillStyle=lg;g.fillRect(0,0,cw,ch);
  g.fillStyle=o.tint||'rgba(255,170,100,.09)';g.fillRect(0,0,cw,ch);g.restore();
  target.save();target.setTransform(1,0,0,1,0,0);if(o.shadow!==false){target.shadowColor='rgba(10,6,2,.45)';target.shadowBlur=18*cw/1920;target.shadowOffsetY=8*cw/1920;target.shadowOffsetX=5*cw/1920}target.drawImage(L,0,0);target.restore()}})();
