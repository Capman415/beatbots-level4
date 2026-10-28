// Shared Beat Bots art + HUD pieces (match the video style: cream/teal panels, green beat pills, Lilita/Rammetto).
'use strict';
(()=>{const ctx=BB.ctx,COL=BB.COL,IMG=BB.IMG,W=BB.W,H=BB.H;
// v12.4 moving parts: drawn in the sprite's own box (origin bottom-centre, image spans -w/2..w/2, -h..0) so squash/rot carry them.
const P=(w,h,u,v)=>[-w/2+u*w,-h+v*h];const LQ=()=>BB.q===0;
const INK=()=>COL.ink;
// retro gear: bronze teeth + spokes + hub, ink outline
const gear=(r,teeth,a,ry=1)=>{ctx.save();ctx.scale(1,ry);ctx.rotate(a);ctx.lineWidth=Math.max(2,r*.06);ctx.strokeStyle=INK();
  ctx.beginPath();for(let i=0;i<teeth*2;i++){const a0=i*Math.PI/teeth,rr=i%2?r*.84:r;ctx.lineTo(Math.cos(a0-.12)*rr,Math.sin(a0-.12)*rr);ctx.lineTo(Math.cos(a0+.12)*rr,Math.sin(a0+.12)*rr)}ctx.closePath();
  const g=ctx.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r);g.addColorStop(0,'#e8c27a');g.addColorStop(1,'#a8742e');ctx.fillStyle=g;ctx.fill();ctx.stroke();
  ctx.fillStyle='#5f8f86';ctx.beginPath();ctx.arc(0,0,r*.62,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='#c4924a';for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.roundRect(-r*.09,0,r*.18,r*.66,r*.05);ctx.fill();ctx.stroke();ctx.restore()}
  ctx.fillStyle='#e0b468';ctx.beginPath();ctx.arc(0,0,r*.2,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#7a5222';ctx.beginPath();ctx.arc(0,0,r*.07,0,7);ctx.fill();ctx.restore()};
const twinkle=(x,y,s,ph)=>{const k=.5+.5*Math.sin(BB.t*3+ph);ctx.save();ctx.globalAlpha=.25+.35*k;BB.glow(x,y,s*2.2,'rgba(255,230,140,A)',.8);ctx.restore()};
const PARTS=BB.PARTS={
  turtle:{// Andante: wind-up key turns, shell gear spins (slow and steady)
    clip:(w,h)=>{ctx.beginPath();ctx.rect(-w/2,-h,w,h);const[a,b]=P(w,h,.15,0),[c,d]=P(w,h,.66,.295);ctx.rect(c,b,a-c,d-b);ctx.clip('evenodd')},
    post:(w,h,im)=>{const t=BB.t,sp=LQ()?.5:1;const ang=t*1.6*sp,sx=Math.cos(ang),ax=-w/2+.41*w;
      ctx.save();ctx.translate(ax,0);ctx.scale(Math.max(.12,Math.abs(sx)),1);const su=.15,sv=0,eu=.66,ev=.295;
      ctx.drawImage(im,su*im.width,0,(eu-su)*im.width,ev*im.height,(su-.41)*w,-h,(eu-su)*w,ev*h);
      if(sx<0){ctx.globalAlpha=.25;ctx.fillStyle='#3a2a10';ctx.fillRect((su-.41)*w,-h,(eu-su)*w,ev*h*.48)}ctx.restore();
      const[gx,gy]=P(w,h,.272,.53);ctx.save();ctx.translate(gx,gy);gear(w*.128,12,t*.9*sp,1.05);ctx.restore()}},
  rocket:{// Allegro: rocket blast + billowing smoke under the nozzle
    pre:(w,h,im,o)=>{const t=BB.t,[nx,ny]=P(w,h,.5,.9),lq=LQ(),f=o.thrust??1;
      const n=lq?4:10;for(let i=0;i<n;i++){const life=((t*1.1+i/n)%1),sd=(i*137.5)%1,side=(i%2?1:-1);
        const x=nx+side*life*w*(.35+.4*((i*7)%5)/5),y=ny+h*.12+life*h*.18*f,r=w*(.08+life*.22);
        ctx.globalAlpha=(1-life)*.55;ctx.fillStyle=life<.25?'#fff4d8':'#e9e4da';ctx.strokeStyle='rgba(25,25,31,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();if(!lq)ctx.stroke()}
      ctx.globalAlpha=1;const fl=1+.12*Math.sin(t*31)+.08*Math.sin(t*17),L=h*.24*f*fl;
      BB.glow(nx,ny+L*.4,w*.55,'rgba(255,170,60,A)',.5);
      ctx.lineWidth=3;ctx.strokeStyle=INK();ctx.fillStyle='#ff8a2a';ctx.beginPath();ctx.moveTo(nx-w*.13,ny);ctx.quadraticCurveTo(nx-w*.1,ny+L*.6,nx,ny+L);ctx.quadraticCurveTo(nx+w*.1,ny+L*.6,nx+w*.13,ny);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#ffe066';ctx.beginPath();ctx.moveTo(nx-w*.07,ny);ctx.quadraticCurveTo(nx-w*.05,ny+L*.4,nx,ny+L*.62);ctx.quadraticCurveTo(nx+w*.05,ny+L*.4,nx+w*.07,ny);ctx.closePath();ctx.fill()},
    post:(w,h)=>{const[x,y]=P(w,h,.5,.04);twinkle(x,y,w*.12,0)}},
  sprocket:{// Sprocket: antenna with spinning ring + blinking bulb, turning dials, blinking belly light
    pre:(w,h)=>{const t=BB.t,[x,y]=P(w,h,.55,.15),L=h*.11,lq=LQ();
      ctx.strokeStyle=INK();ctx.lineWidth=Math.max(3,h*.009);ctx.fillStyle='#b9bfc4';ctx.beginPath();ctx.roundRect(x-h*.007,y-L,h*.014,L,3);ctx.fill();ctx.stroke();
      const sx=Math.cos(t*(lq?1.5:3));ctx.fillStyle=sx>0?'#e8e2cd':'#c9c1a8';ctx.beginPath();ctx.ellipse(x,y-L*.55,h*.045*Math.max(.15,Math.abs(sx)),h*.014,0,0,7);ctx.fill();ctx.stroke();
      const bl=.5+.5*Math.sin(t*2.4);BB.glow(x,y-L-6,h*.05,'rgba(255,90,70,A)',.25+.45*bl);ctx.fillStyle=`rgb(${200+55*bl|0},${70+40*bl|0},60)`;ctx.beginPath();ctx.arc(x,y-L-h*.012,h*.018,0,7);ctx.fill();ctx.stroke()},
    post:(w,h)=>{const t=BB.t;for(const[u,v,s]of[[.52,.555,1],[.51,.62,-1]]){const[x,y]=P(w,h,u,v);ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*1.3*s)*1.2);ctx.strokeStyle=INK();ctx.lineWidth=Math.max(2,h*.006);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-w*.022);ctx.stroke();ctx.restore()}
      const[bx,by]=P(w,h,.57,.865),k=.5+.5*Math.sin(t*3.1);ctx.save();ctx.globalAlpha=.3+.5*k;BB.glow(bx,by,w*.06,'rgba(255,190,60,A)',.9);ctx.restore();
      const[rx,ry]=P(w,h,.445,.645);ctx.save();ctx.globalAlpha=.6*(Math.sin(t*4.2)>.3?1:0);BB.glow(rx,ry,w*.03,'rgba(255,80,60,A)',.9);ctx.restore()}},
  sorter:{// Sorter Bot: LED sorting bar chases, mast light blinks, star twinkles
    post:(w,h)=>{const t=BB.t,n=8,cols=['255,90,80','255,160,70','255,220,90','150,230,110','110,220,150','90,200,255','90,170,255','120,150,255'];
      const hd=(t*(LQ()?3:6))%(n+3);for(let i=0;i<n;i++){const d=Math.abs(i-hd);if(d>1.5)continue;const[x,y]=P(w,h,.35+i*.0443,.543);ctx.save();ctx.globalAlpha=(1-d/1.5)*.9;BB.glow(x,y,w*.06,`rgba(${cols[i]},A)`,.9);ctx.restore()}
      const[sx,sy]=P(w,h,.8,.035);twinkle(sx,sy,w*.08,1);const[mx,my]=P(w,h,.815,.32);ctx.save();ctx.globalAlpha=Math.sin(t*2.6)>0?.8:.15;BB.glow(mx,my,w*.04,'rgba(255,90,70,A)',.9);ctx.restore()}},
  whisper:{// Piano bot: grille lights breathe softly
    post:(w,h)=>{const t=BB.t,k=.5+.5*Math.sin(t*1.4),[x,y]=P(w,h,.5,.24);ctx.save();ctx.globalAlpha=.25+.35*k;BB.glow(x,y,w*.55,'rgba(120,200,255,A)',.6);ctx.restore();
      if(!LQ()){const[mx,my]=P(w,h,.38,.43);for(let i=0;i<3;i++){const life=(t*.5+i/3)%1;ctx.save();ctx.globalAlpha=(1-life)*.5;ctx.strokeStyle='#cfe8ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(mx-w*.1,my,w*(.08+life*.25),Math.PI*.75,Math.PI*1.25);ctx.stroke();ctx.restore()}}}},
  boom:{// Forte bot: megaphone pulses sound rings, bulb flares
    post:(w,h)=>{const t=BB.t,[x,y]=P(w,h,.12,.24),n=LQ()?2:3;for(let i=0;i<n;i++){const life=(t*1.2+i/n)%1;ctx.save();ctx.globalAlpha=(1-life)*.7;ctx.strokeStyle='#ffb347';ctx.lineWidth=Math.max(3,w*.02)*(1-life*.5);ctx.beginPath();ctx.arc(x+w*.1,y,w*(.12+life*.35),Math.PI*.72,Math.PI*1.28);ctx.stroke();ctx.restore()}
      const[bx,by]=P(w,h,.29,.26),k=Math.pow(.5+.5*Math.sin(t*5),2);ctx.save();ctx.globalAlpha=.3+.6*k;BB.glow(bx,by,w*.16,'rgba(255,240,170,A)',.9);ctx.restore();const[sx,sy]=P(w,h,.6,.035);twinkle(sx,sy,w*.08,2)}}};
// draw a cutout by its bottom-centre with squash/stretch (+ its moving part when big enough)
BB.sprite=(name,x,base,h,o={})=>{const im=IMG[name];if(!im)return;const w=im.width*h/im.height;const sq=o.squash||0;const pt=o.parts!==false&&h>=150?PARTS[name]:null;
  ctx.save();ctx.translate(x,base);
  if(o.shadow!==false){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,0,w*.38,12,0,0,7);ctx.fill()}
  ctx.rotate(o.rot||0);ctx.scale((o.flip?-1:1)*(1+sq),1-sq);ctx.globalAlpha=o.alpha??1;
  if(pt&&pt.pre){ctx.save();pt.pre(w,h,im,o);ctx.restore()}
  if(pt&&pt.clip){ctx.save();pt.clip(w,h);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore()}else ctx.drawImage(im,-w/2,-h,w,h);
  if(pt&&pt.post){ctx.save();pt.post(w,h,im,o);ctx.restore()}
  ctx.restore()};
// Allegro hovering on his rocket blast: ground shadow shrinks as he rises
BB.rocketBot=(x,ground,h,o={})=>{const t=BB.t,lift=h*.32+Math.sin(t*2.2)*h*.035,sq=o.squash||0;
  BB.contactShadow(x,ground,h*.38*(1-lift/h*.6),.45);BB.sprite('rocket',x,ground-lift,h,{squash:sq,rot:o.rot||0,shadow:false})};
// beat-synced squash: phase 0..1 within the beat -> squash amount
BB.bounce=(ph,amt=.06)=>{const k=Math.exp(-ph*7);return amt*k*Math.cos(ph*9)};
// Sorter Bot with a hard hat and pickaxe. swing: 0 = raised, 1 = striking
BB.pickbot=(x,base,h,swing,o={})=>{const sq=o.squash||0;
  ctx.save();ctx.translate(x,base);
  // pickaxe behind the arm
  const ang=BB.lerp(-1.9,.35,swing);
  ctx.save();ctx.translate(h*.22,-h*.62);ctx.rotate(ang);
  ctx.fillStyle='#8c5a32';ctx.strokeStyle=COL.ink;ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(-8,-h*.42,16,h*.46,6);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-h*.2,-h*.36);ctx.quadraticCurveTo(0,-h*.5,h*.22,-h*.34);ctx.lineTo(h*.2,-h*.3);ctx.quadraticCurveTo(0,-h*.43,-h*.18,-h*.31);ctx.closePath();
  ctx.fillStyle='#b4bec8';ctx.fill();ctx.stroke();ctx.restore();
  ctx.restore();
  BB.sprite('sorter',x,base,h,{squash:sq});
  // hard hat + lamp
  const hy=base-h*(1-sq)*.985;ctx.save();ctx.translate(x,hy);
  BB.glow(0,-4,70,'rgba(255,230,120,A)',.35);
  ctx.fillStyle='#fac83c';ctx.strokeStyle=COL.ink;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,h*.13,h*.07,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.roundRect(-h*.17,-4,h*.34,10,5);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fffbe0';ctx.beginPath();ctx.arc(0,-h*.035,7,0,7);ctx.fill();ctx.stroke();ctx.restore()};
// Static Jr.: the tiny PLEASE STAND BY TV with stick legs and red sneakers.
BB.staticJr=(x,base,h,o={})=>{const im=IMG.tinytv;if(!im)return;const t=BB.t,w=im.width*h/im.height,legH=h*.42,run=o.run||0;
  ctx.save();ctx.translate(x,base);
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,0,w*.4,10,0,0,7);ctx.fill();
  ctx.rotate(o.rot||0);if(o.flip)ctx.scale(-1,1);
  for(const lx of [-.2,.2]){const ph=run?Math.sin(t*28+(lx>0?Math.PI:0))*run:0;
    const fx=w*lx+ph*h*.18,fy=-(ph>0?ph*h*.08:0);
    ctx.strokeStyle='#282c36';ctx.lineWidth=Math.max(5,h*.06);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(w*lx,-legH);ctx.lineTo(fx,fy-h*.06);ctx.stroke();
    ctx.fillStyle='#e65046';ctx.strokeStyle='#1e1e28';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(fx+h*.04,fy-h*.06,h*.12,h*.065,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.fillRect(fx-h*.06,fy-h*.05,h*.16,h*.02)}
  const by=-legH-h,sq=o.squash||0;ctx.translate(0,-legH);ctx.scale(1+sq,1-sq);
  {// v12.4 Jr rabbit-ear antennas with sparks
    const lq=BB.q===0;for(const s of[-1,1]){const a=s*(.45+Math.sin(t*2+s)*.08),L=h*.5,bx=s*w*.12,tx=bx+Math.sin(a)*L,ty=-h-Math.cos(a)*L;
      ctx.strokeStyle='#282c36';ctx.lineWidth=Math.max(3,h*.035);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(bx,-h*.95);ctx.lineTo(tx,ty);ctx.stroke();
      const sp=Math.sin(t*7+s*2)>.55;if(sp)BB.glow(tx,ty,h*.25,'rgba(140,220,255,A)',.6);
      ctx.fillStyle=sp?'#bff0ff':'#e65046';ctx.strokeStyle='#1e1e28';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(tx,ty,h*.06,0,7);ctx.fill();ctx.stroke();
      if(sp&&!lq){ctx.strokeStyle='#ffe066';ctx.lineWidth=2.5;for(let i=0;i<3;i++){const aa=i*2.1+t*9,r1=h*.09,r2=h*.2;ctx.beginPath();ctx.moveTo(tx+Math.cos(aa)*r1,ty+Math.sin(aa)*r1);ctx.lineTo(tx+Math.cos(aa+.3)*(r1+r2)*.6,ty+Math.sin(aa+.3)*(r1+r2)*.6);ctx.lineTo(tx+Math.cos(aa)*r2,ty+Math.sin(aa)*r2);ctx.stroke()}}}}
  if(o.glitch){for(let i=0;i<8;i++){const sy=im.height*i/8,dy=-h+h*i/8,off=(Math.random()-.5)*h*.25*o.glitch;ctx.drawImage(im,0,sy,im.width,im.height/8,-w/2+off,dy,w,h/8+1)}}
  else ctx.drawImage(im,-w/2,-h,w,h);
  if(o.stuffed){// cheeks stuffed + whole note sticking out
    ctx.fillStyle='rgba(255,140,150,.95)';ctx.strokeStyle=COL.ink;ctx.lineWidth=3;
    for(const s of[-1,1]){ctx.beginPath();ctx.ellipse(s*w*.47,-h*.4,w*.12,h*.17,0,0,7);ctx.fill();ctx.stroke()}
    BB.wholeNote(w*.05,-h*.32,h*.2,{rot:-.4+Math.sin(t*12)*.1})}
  if(o.dizzy){for(let i=0;i<3;i++){const a=t*4+i*2.1;BB.star(Math.cos(a)*w*.45,-h*1.08+Math.sin(a)*12,12,COL.yellow,a)}}
  ctx.restore()};
// a whole note (notation style: dark oval ring with a tilted open centre, white outline so it reads on dark panels)
BB.wholeNote=(x,y,s,o={})=>{ctx.save();ctx.translate(x,y);ctx.rotate(o.rot||0);
  if(o.glow)BB.glow(0,0,s*2.2,'rgba(255,245,190,A)',o.glow);
  ctx.lineWidth=Math.max(3,s*.16);ctx.strokeStyle='#fff';ctx.fillStyle=o.ring||COL.ink;
  ctx.beginPath();ctx.ellipse(0,0,s,s*.68,0,0,7);ctx.stroke();ctx.fill();
  ctx.fillStyle=o.fill||'#fff';ctx.beginPath();ctx.ellipse(0,0,s*.5,s*.3,-.75,0,7);ctx.fill();ctx.restore()};
// ---------- HUD ----------
// green beat-light pills. lit: per-pill brightness 0..1, marks: per-pill clap star
BB.beatPills=(cx,y,lit,o={})=>{const n=lit.length,pw=o.pw||120,gap=o.gap||30,ph=50,tot=n*pw+(n-1)*gap;
  const wob=o.wobble||0;
  BB.rrect(cx-tot/2-28,y-40,tot+56,100,30,'rgba(0,0,0,.25)');BB.well(cx-tot/2-30,y-50,tot+60,100,30);
  for(let i=0;i<n;i++){const x=cx-tot/2+i*(pw+gap)+Math.sin(BB.t*20+i*2)*wob*14,yy=y-ph/2+Math.cos(BB.t*17+i)*wob*10,l=lit[i];
    if(l>.01){ctx.save();ctx.globalAlpha=l*.85;BB.glow(x+pw/2,y,90,'rgba(110,230,120,A)',.7);ctx.restore()}
    const g=Math.round(40+l*70),gg=Math.round(60+l*170),bb=Math.round(60+l*60);
    BB.rrect(x,yy,pw,ph,14,BB.lg(yy,yy+ph,[`rgb(${g+40},${Math.min(255,gg+40)},${bb+30})`,`rgb(${g},${gg},${bb})`,`rgb(${g*.7|0},${gg*.75|0},${bb*.75|0})`]),'rgba(235,245,240,.85)',3);ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.roundRect(x+8,yy+5,pw-16,12,6);ctx.fill();
    if(o.marks&&o.marks[i]){const m=o.marks[i];BB.star(x+pw/2,yy+ph/2,16*BB.ease.back(Math.min(1,m)),COL.yellow,BB.t)}}};
// mic meter with soft/loud bands and a sensitivity +/- pair
BB.micMeter=(x,y,o={})=>{const m=BB.mic;BB.rrect(x+2,y+8,330,110,26,'rgba(0,0,0,.25)');BB.well(x,y,330,110,26);
  BB.text('MIC',x+50,y+40,32,COL.yellow,{stroke:4});
  BB.text(m.ok?'ON':({denied:'BLOCKED',nodevice:'NONE',lost:'LOST',error:'ERROR'}[m.state]||'OFF'),x+50,y+78,m.ok?22:16,m.ok?COL.green:'#ff9c8a');
  const n=10,lvl=m.level;for(let i=0;i<n;i++){const on=i<lvl*n,bx=x+95+i*20;let c=on?(i<4?'#6ee678':i<7?'#ffe066':'#ff7b5c'):'#3c5050';
    if(o.band==='soft'&&i>=4)c=on?'#ff7b5c':'#2a3a3a';
    if(o.band==='loud'&&i<6)c=on?'#8aa':'#2a3a3a';
    const by=y+22+(9-i)*3,bh=64-(9-i)*3;BB.rrect(bx,by,14,bh,4,c);if(on){ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(bx+2,by+2,4,bh-4)}}
  if(o.band){const bx0=x+95+(o.band==='soft'?0:6*20),bw=(o.band==='soft'?4:4)*20-6;BB.rrect(bx0-3,y+14,bw+6,80,6,null,o.band==='soft'?'#b6f0ff':'#ffd23c',3)}};
BB.sensButtons=(x,y)=>{const m=BB.mic;
  BB.button(x,y,90,90,'−',{size:50,id:'sens-',onClick:()=>BB.setSens(m.sensIdx-1)});
  BB.button(x+110,y,90,90,'+',{size:50,id:'sens+',onClick:()=>BB.setSens(m.sensIdx+1)})};
BB.pauseBtn=(onClick,x=W/2-110,y=24)=>{BB.button(x,y,220,110,'PAUSE',{style:'teal',size:34,id:'pause',onClick,labelDx:24,
  icon:(ix,iy)=>{ix=x+52;ctx.fillStyle=COL.yellow;ctx.strokeStyle=COL.ink;ctx.lineWidth=3;for(const bx of[ix-14,ix+4]){ctx.fillRect(bx,iy-17,11,34);ctx.strokeRect(bx,iy-17,11,34)}}})};
BB.overrideBtn=(onClick,o={})=>{const x=W-370,y=H-150;BB.button(x,y,340,125,'MANUAL',{style:'red',size:40,sub:'OVERRIDE',id:'override',onClick,pop:o.pop})};
BB.captionBox=()=>{const c=BB.caption;if(!c||BB.t>c.until)return;const k=Math.min(1,(BB.t-c.start)*6);
  const cp=(BB.scene&&BB.scene.capPos&&BB.scene.capPos())||{};const fs=38,w=Math.min(cp.maxW||1150,BB.measure(c.txt,fs)+200),x=(cp.cx||W/2)-w/2,y=cp.y!=null?cp.y:H-300;
  ctx.save();ctx.globalAlpha=k;ctx.translate(0,(1-k)*30);
  BB.rrect(x+4,y+8,w,96,48,'rgba(0,0,0,.3)');BB.rrect(x,y,w,96,48,'#fff',COL.ink,5);
  const face=c.who==='jr'?'tinytv':'sprocket';const im=BB.IMG[face];
  if(im){ctx.save();ctx.beginPath();ctx.arc(x+60,y+48,40,0,7);ctx.fillStyle=c.who==='jr'?'#3a2a3a':'#cdeee0';ctx.fill();ctx.clip();
    const s=c.who==='jr'?70:150;ctx.drawImage(im,x+60-s*im.width/im.height/2,y+48-s*(c.who==='jr'?.5:.28),s*im.width/im.height,s);ctx.restore();
    ctx.lineWidth=4;ctx.strokeStyle=COL.ink;ctx.beginPath();ctx.arc(x+60,y+48,40,0,7);ctx.stroke()}
  BB.text(c.txt,x+w/2+40,y+50,fs,c.who==='jr'?'#c0392b':COL.ink,{maxW:w-170});ctx.restore()};
// ---------- pause + How to Play ----------
BB.pauseOverlay=(howTo,onResume)=>{ctx.fillStyle='rgba(8,18,17,.72)';ctx.fillRect(0,0,W,H);
  const x=210,y=70,w=1500,h=900;BB.panel(x,y,w,h,40);
  BB.text('HOW TO PLAY',W/2,y+85,62,'#fff',{font:'Rammetto One',stroke:8});
  BB.text(howTo.title,W/2,y+150,40,COL.yellow,{stroke:5});
  howTo.steps.forEach((s,i)=>{const yy=y+240+i*92;ctx.fillStyle=COL.green;ctx.beginPath();ctx.arc(x+100,yy,30,0,7);ctx.fill();
    BB.text(String(i+1),x+100,yy+2,36,COL.ink);BB.text(s,x+150,yy+2,36,'#fff',{align:'left',maxW:760})});
  // small animated example
  BB.rrect(x+950,y+200,490,420,26,'#0b1917',COL.teal2,4);howTo.example(x+950,y+200,490,420,BB.realT());
  BB.text('Say it:',x+120,y+h-170,34,COL.yellow,{align:'left'});
  BB.text(howTo.words,x+240,y+h-170,34,'#fff',{align:'left',maxW:1150});
  // clap sensitivity (also in MIC SETUP): softer claps count when turned up
  {const m=BB.mic,sx=x+950,sy=y+762;BB.text('Clap sensitivity',sx+245,sy+18,30,COL.yellow,{stroke:4});
   BB.button(sx,sy+42,80,80,'−',{size:46,id:'psens-',onClick:()=>BB.setSens(m.sensIdx-1)});
   for(let i=0;i<6;i++){const on=i<=m.sensIdx;BB.rrect(sx+102+i*50,sy+92-i*8,38,22+i*8,6,on?(i<2?'#6ee678':i<4?'#ffe066':'#ff9c5c'):'#2f4242','rgba(0,0,0,.35)',2)}
   BB.button(sx+410,sy+42,80,80,'+',{size:46,id:'psens+',onClick:()=>BB.setSens(m.sensIdx+1)})}
  BB.button(W/2-210,y+h-130,420,110,'RESUME',{style:'green',size:56,id:'resume',onClick:onResume})};
let rt=0,rl=performance.now();BB.realT=()=>{const n=performance.now();rt+=(n-rl)/1000;rl=n;return rt};
// room title card
BB.titleCard=(txt,sub,k)=>{if(k<=0||k>=1)return;const a=k<.15?k/.15:k>.85?(1-k)/.15:1;ctx.save();ctx.globalAlpha=a;
  const s=.8+.2*BB.ease.back(Math.min(1,k*4));ctx.translate(W/2,H/2-60);ctx.scale(s,s);BB.panel(-520,-130,1040,260,40);
  BB.text(txt,0,-30,84,'#fff',{font:'Rammetto One',stroke:9});BB.text(sub,0,58,40,COL.yellow,{stroke:5});ctx.restore()};
})();
// ===== v2 painted props: grounded, tinted, clamped to their tunnel box =====
(()=>{const ctx=BB.ctx;BB.V2={};
BB.loadV2=()=>Promise.all([['rock','png'],['crystal','png'],['cart','png'],['elev','png'],['smash','png'],['bin','png'],['rubble','png'],['wh','jpg'],['tun0','jpg'],['tun1','jpg'],['tun2','jpg'],['tun3','jpg'],['tun4','jpg'],['pipe','png'],['funnel','png'],['title_bg','jpg'],['map_bg','jpg'],['mic','png'],['lock','png'],['chip','png'],['earth','jpg'],['shaft','jpg']].map(([n,e])=>new Promise(r=>{const i=new Image();i.onload=()=>{BB.V2[n]=i;(i.decode?i.decode().catch(()=>{}):Promise.resolve()).then(r)};i.onerror=()=>r();i.src='assets/v2/'+n+'.'+e+'?v='+(BB.VERSION||'')})));
const tcache={};
// cached copy of a prop with a top-down rim light + ambient tint baked in (no per-frame compositing cost)
BB.tinted=(name,rim,amb,ambA=.18)=>{const key=name+rim+amb+ambA;if(tcache[key])return tcache[key];const im=BB.V2[name];if(!im)return null;
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';
  if(amb){g.globalAlpha=ambA;g.fillStyle=amb;g.fillRect(0,0,c.width,c.height);g.globalAlpha=1}
  if(rim){const gr=g.createLinearGradient(0,0,0,c.height*.55);gr.addColorStop(0,rim);gr.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=.35;g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);g.globalAlpha=1}
  return tcache[key]=c};
BB.contactShadow=(x,y,rw,a=.45)=>{ctx.save();ctx.translate(x,y);ctx.scale(1,.16);const g=ctx.createRadialGradient(0,0,0,0,0,rw);g.addColorStop(0,`rgba(10,5,2,${a})`);g.addColorStop(.6,`rgba(10,5,2,${a*.5})`);g.addColorStop(1,'rgba(10,5,2,0)');ctx.fillStyle=g;ctx.fillRect(-rw,-rw,2*rw,2*rw);ctx.restore()};
// draw a prop standing on `base`; o.box={x0,x1,y0} keeps it fully inside its tunnel
BB.prop=(name,x,base,h,o={})=>{const im=BB.V2[name];if(!im)return;let hh=h;const ar=im.width/im.height;
  if(o.box){hh=Math.min(hh,base-o.box.y0);hh=Math.min(hh,(o.box.x1-o.box.x0)/ar);const w=hh*ar;x=Math.max(o.box.x0+w/2,Math.min(o.box.x1-w/2,x))}
  const w=hh*ar,src=(o.rim||o.amb)?BB.tinted(name,o.rim,o.amb,o.ambA):im;
  if(o.shadow!==false)BB.contactShadow(x,base,w*.55,o.shadowA??.45);
  ctx.save();ctx.translate(x,base);if(o.rot)ctx.rotate(o.rot);if(o.flip)ctx.scale(-1,1);ctx.globalAlpha=o.alpha??1;ctx.drawImage(src,-w/2,-hh+(o.sink||0),w,hh);ctx.restore();return {x,w,h:hh}};
})();
// ---- v12.5 start-of-game soft/loud clap check (mic setup only): explain -> 4-beat count-in -> 8 soft claps ->
// explain -> 4-beat count-in -> 8 loud claps, at 100 BPM. Count-ins are ignored; median of heard claps -> GroupGate.calLoud.
BB.VO_LINES=(BB.VO_LINES||[]).concat([
 ['lc_intro',"Let's teach my ears your claps! First, we'll clap softly, piano, for eight beats. Then loudly, forte, for eight beats.",'sprocket'],
 ['lc_soft',"Soft claps, piano. Watch the lights. Get ready!",'sprocket'],
 ['lc_mid',"Nice and soft! Now loud claps, forte! Big and strong. Get ready!",'sprocket'],
 ['lc_done',"Got it! Now I know soft from loud.",'sprocket'],
 ['lc_again',"Hmm. Let's try that again. Make the loud claps much louder than the soft ones.",'sprocket']]);
BB.LoudCal=class{constructor(onDone){this.onDone=onDone;this.SPB=.6;this.soft=[];this.loud=[];this.ph='intro';this.t0=BB.t;this.wait=BB.say('lc_intro')+.4;BB.mic.take()}
  get busy(){return this.ph!=='gone'}
  prep(kind){this.kind=kind;this[kind]=[];this.got=[];this.ph='prep';this.t0=BB.t;this.wait=BB.say(kind==='soft'?'lc_soft':'lc_mid')+.3;BB.mic.take()}
  run(){const ac=BB.ac,S=this.SPB,tA=ac.currentTime+.35;this.tA=tA;this.ph='run';BB.mic.take();
    for(let i=0;i<12;i++)BB.sfx.tick(tA+i*S,i===0||i===4||i===8,i<4?1:(this.kind==='soft'?.6:1))}
  beatIdx(){return(BB.ac.currentTime-this.tA)/this.SPB}
  update(){const t=BB.t;if(this.ph==='gone')return;BB.dynMode=t;// don't teach the normal-clap scale
    if(this.kind==='soft'&&this.ph==='run')BB.softClap=t;
    const os=BB.mic.take();
    if(this.ph==='intro'&&t-this.t0>this.wait)this.prep('soft');
    else if(this.ph==='prep'&&t-this.t0>this.wait)this.run();
    else if(this.ph==='run'){const a=this[this.kind],S=this.SPB,lat=BB.mic.lat!=null?BB.mic.lat:.06;
      for(const o of os){if(!o.rms)continue;const x=(o.t-lat-this.tA)/S,i=Math.round(x),d=(x-i)*S;// beats 0-3 = count-in (ignored)
        if(i>=4&&i<12&&d>-.16&&d<.26&&!this.got[i]){this.got[i]=1;a.push(o.rms);this.pop=t}}
      if(this.beatIdx()>11.9){if(this.kind==='soft')this.prep('loud');else this.finish()}}
    else if(this.ph==='done'&&this.ok&&t-this.t0>2.6){this.ph='gone';this.onDone&&this.onDone(true)}}
  finish(){const G=window.GroupGate,med=a=>{const b=[...a].sort((x,y)=>x-y);return b[b.length>>1]};
    this.ok=false;if(G&&this.soft.length>=3&&this.loud.length>=3){const s=med(this.soft),l=med(this.loud);if(20*Math.log10(l/s)>4){G.calLoud(s,l);this.ok=G.calOk()}}
    this.ph='done';this.t0=BB.t;BB.say(this.ok?'lc_done':'lc_again');if(this.ok)BB.sfx.ding()}
  retry(){this.prep('soft')}
  skip(){if(this.ph==='gone')return;this.ph='gone';this.onDone&&this.onDone(false)}// defaults: adaptive scale from normal claps
  draw(cx,cy){if(this.ph==='gone')return;const t=BB.t,COL=BB.COL,ctx=BB.ctx,pw=980,ph=440,x=cx-pw/2,y=cy-ph/2;
    BB.panel(x,y,pw,ph,34);BB.text('CLAP CHECK',cx,y+54,42,COL.yellow,{font:'Rammetto One',stroke:6});
    const soft=this.kind!=='loud',done=this.ph==='done';
    if(this.ph==='intro'){BB.text('Teach Sprocket your claps!',cx,y+130,44,'#fff',{stroke:5});
      BB.text('8 SOFT claps (piano), then 8 LOUD claps (forte)',cx,y+200,32,'#cfe',{stroke:4,maxW:pw-80})}
    else if(done){BB.text(this.ok?'Got it! Soft and loud saved.':'Hmm, the loud claps need to be much louder.',cx,y+130,38,this.ok?COL.green:'#ff9c8a',{stroke:5,maxW:pw-60});
      BB.text(`soft claps heard: ${this.soft.length}   loud claps heard: ${this.loud.length}`,cx,y+200,30,'#cfe',{});
      if(!this.ok){BB.button(cx-260,y+ph-130,240,80,'TRY AGAIN',{style:'green',size:34,id:'lcretry',onClick:()=>this.retry()});
        BB.button(cx+20,y+ph-130,240,80,'Skip',{size:34,id:'lcskip2',onClick:()=>this.skip()})}}
    else{BB.text(soft?'Clap SOFTLY  (piano)':'Clap LOUDLY!  (forte)',cx,y+120,soft?44:52,soft?'#b6f0ff':'#ffb36b',{stroke:5});
      const bi=this.ph==='run'?this.beatIdx():-1,lit=[];for(let i=0;i<8;i++){const k=bi-(i+4);lit.push(k>=-.05&&k<.5?1-k:(this.got[i+4]?.35:0))}
      if(bi>=-.2&&bi<4){const n=Math.min(3,Math.max(0,Math.floor(bi+.05)));const ph2=bi-Math.floor(bi);BB.text(['1','2','3','4'][n],cx,y+235,90*(1+Math.max(0,.25-ph2)),COL.yellow,{font:'Rammetto One',stroke:8})}
      else if(this.ph==='prep')BB.text('get ready...',cx,y+225,40,'rgba(255,255,255,.8)',{})
      else BB.beatPills(cx,y+235,lit,{pw:70,gap:18});
      const a=this[this.kind]||[];BB.text(`${soft?'soft':'loud'} claps: ${a.length} / 8`,cx-170,y+ph-50,34,a.length&&this.pop&&t-this.pop<.3?COL.green:'#fff',{stroke:4});
      BB.micMeter(cx-10,y+ph-118,{band:soft?'soft':'loud'});
      BB.button(x+pw-170,y+ph-80,150,60,'Skip',{size:28,id:'lcskip',onClick:()=>this.skip()})}}};
