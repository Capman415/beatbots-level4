// Shared Beat Bots art + HUD pieces (match the video style: cream/teal panels, green beat pills, Lilita/Rammetto).
'use strict';
(()=>{const ctx=BB.ctx,COL=BB.COL,IMG=BB.IMG,W=BB.W,H=BB.H;
// v12.4 moving parts: drawn in the sprite's own box (origin bottom-centre, image spans -w/2..w/2, -h..0) so squash/rot carry them.
const P=(w,h,u,v)=>[-w/2+u*w,-h+v*h];const LQ=()=>BB.q===0;
const INK=()=>COL.ink;
// retro gear: bronze teeth + spokes + hub, ink outline
// v12.6: crisp gear: even trapezoid teeth, true centre (no squash -> no wobble), uniform line weight, clean hub
const gear=(r,teeth,a)=>{ctx.save();ctx.rotate(a);const lw=Math.max(2.5,r*.07);ctx.lineWidth=lw;ctx.lineJoin='round';ctx.strokeStyle=INK();
  const ro=r,ri=r*.8,st=Math.PI*2/teeth;ctx.beginPath();for(let i=0;i<teeth;i++){const c=i*st;ctx.lineTo(Math.cos(c-st*.32)*ri,Math.sin(c-st*.32)*ri);ctx.lineTo(Math.cos(c-st*.18)*ro,Math.sin(c-st*.18)*ro);ctx.lineTo(Math.cos(c+st*.18)*ro,Math.sin(c+st*.18)*ro);ctx.lineTo(Math.cos(c+st*.32)*ri,Math.sin(c+st*.32)*ri)}ctx.closePath();
  ctx.restore();ctx.save();const g=ctx.createRadialGradient(-r*.35,-r*.35,r*.1,0,0,r*1.05);g.addColorStop(0,'#f2d48e');g.addColorStop(.6,'#c9973f');g.addColorStop(1,'#8a5c22');ctx.fillStyle=g;ctx.fill();ctx.lineWidth=lw;ctx.strokeStyle=INK();ctx.stroke();ctx.restore();
  ctx.save();ctx.rotate(a);ctx.lineWidth=lw;ctx.strokeStyle=INK();ctx.fillStyle='#5f8f86';ctx.beginPath();ctx.arc(0,0,r*.6,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='#d4a656';for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.rect(-r*.08,r*.18,r*.16,r*.42);ctx.fill();ctx.stroke();ctx.restore()}
  ctx.restore();ctx.save();const hg=ctx.createRadialGradient(-r*.07,-r*.07,0,0,0,r*.24);hg.addColorStop(0,'#fff4d0');hg.addColorStop(1,'#b8863a');ctx.fillStyle=hg;ctx.lineWidth=lw;ctx.strokeStyle=INK();ctx.beginPath();ctx.arc(0,0,r*.22,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#4a3010';ctx.beginPath();ctx.arc(0,0,r*.07,0,7);ctx.fill();ctx.restore()};
const twinkle=(x,y,s,ph)=>{const k=.5+.5*Math.sin(BB.t*3+ph);ctx.save();ctx.globalAlpha=.25+.35*k;BB.glow(x,y,s*2.2,'rgba(255,230,140,A)',.8);ctx.restore()};
const PARTS=BB.PARTS={
  turtle:{// Andante: wind-up key turns, shell gear spins (slow and steady)
    clip:(w,h)=>{ctx.beginPath();ctx.rect(-w/2,-h,w,h);const[a,b]=P(w,h,.15,0),[c,d]=P(w,h,.66,.295);ctx.rect(c,b,a-c,d-b);ctx.clip('evenodd')},
    post:(w,h,im)=>{const t=BB.t,sp=LQ()?.5:1;const ang=t*1.6*sp,sx=Math.cos(ang),ax=-w/2+.41*w;
      ctx.save();ctx.translate(ax,0);ctx.scale(Math.max(.12,Math.abs(sx)),1);const su=.15,sv=0,eu=.66,ev=.295;
      ctx.drawImage(im,su*im.width,0,(eu-su)*im.width,ev*im.height,(su-.41)*w,-h,(eu-su)*w,ev*h);
      if(sx<0){ctx.globalAlpha=.25;ctx.fillStyle='#3a2a10';ctx.fillRect((su-.41)*w,-h,(eu-su)*w,ev*h*.48)}ctx.restore();
      const[gx,gy]=P(w,h,.272,.53);ctx.save();ctx.translate(gx,gy);gear(w*.128,12,t*.9*sp);ctx.restore()}},
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
    pre:(w,h)=>{const t=BB.t,[x,y]=P(w,h,.55,.15),L=h*.11,lq=LQ(),lw=Math.max(3,h*.009);// v12.6: classic ball-tipped antenna; a level ring orbits it in 3D (fixed ellipse, spin shown by its studs)
      const rx=h*.05,ry=h*.016,ry0=y-L*.5,sp=t*(lq?1.5:3);
      const ringHalf=(front)=>{ctx.lineWidth=lw+3;ctx.strokeStyle=INK();ctx.beginPath();ctx.ellipse(x,ry0,rx,ry,0,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke();ctx.lineWidth=lw;ctx.strokeStyle=front?'#eef3f1':'#9aa6a4';ctx.stroke();
        for(let i=0;i<6;i++){const a=sp+i*Math.PI/3,sn=Math.sin(a);if(front!==(sn>0))continue;ctx.fillStyle=front?'#ffd75a':'#a8892e';ctx.beginPath();ctx.arc(x+Math.cos(a)*rx,ry0+sn*ry,lw*.7,0,7);ctx.fill()}};
      ringHalf(false);
      ctx.strokeStyle=INK();ctx.lineWidth=lw;ctx.fillStyle=BB.lg(0,1,['#eef3f1','#9aa6a4']);const mg=ctx.createLinearGradient(x-h*.008,0,x+h*.008,0);mg.addColorStop(0,'#7d8987');mg.addColorStop(.4,'#f4f8f7');mg.addColorStop(1,'#6b7775');ctx.fillStyle=mg;ctx.beginPath();ctx.roundRect(x-h*.008,y-L,h*.016,L,3);ctx.fill();ctx.stroke();
      ringHalf(true);
      const bl=.5+.5*Math.sin(t*2.4),br=h*.02,by=y-L-br*.7;BB.glow(x,by,h*.05,'rgba(255,90,70,A)',.25+.45*bl);const bg=ctx.createRadialGradient(x-br*.35,by-br*.35,br*.1,x,by,br);bg.addColorStop(0,'#ffe0d8');bg.addColorStop(.35,`rgb(${220+35*bl|0},${80+40*bl|0},64)`);bg.addColorStop(1,'#8a2018');ctx.fillStyle=bg;ctx.beginPath();ctx.arc(x,by,br,0,7);ctx.fill();ctx.stroke()},
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
  if(o.cut){ctx.save();o.cut(w,h)}
  if(pt&&pt.clip){ctx.save();pt.clip(w,h);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore()}else ctx.drawImage(im,-w/2,-h,w,h);
  if(o.cut)ctx.restore();
  if(pt&&pt.post){ctx.save();pt.post(w,h,im,o);ctx.restore()}
  ctx.restore()};
// Allegro hovering on his rocket blast: ground shadow shrinks as he rises
BB.rocketBot=(x,ground,h,o={})=>{const t=BB.t,lift=h*.32+Math.sin(t*2.2)*h*.035,sq=o.squash||0;
  BB.contactShadow(x,ground,h*.38*(1-lift/h*.6),.45);BB.sprite('rocket',x,ground-lift,h,{squash:sq,rot:o.rot||0,shadow:false})};
// beat-synced squash: phase 0..1 within the beat -> squash amount
BB.bounce=(ph,amt=.06)=>{const k=Math.exp(-ph*7);return amt*k*Math.cos(ph*9)};
// Sorter Bot with a hard hat and pickaxe. swing: 0 = raised, 1 = striking
/* v12.6d: CGI-matched tools - volumetric gradients, speculars, rim light, AO at the grip, waxed-wood handle, bevelled chrome head; hard hat in matching enamel */
const chromeX=(x0,x1,a=1)=>{const G=ctx.createLinearGradient(x0,0,x1,0);G.addColorStop(0,`rgba(58,64,70,${a})`);G.addColorStop(.18,`rgba(150,160,168,${a})`);G.addColorStop(.32,`rgba(250,252,253,${a})`);G.addColorStop(.48,`rgba(170,180,188,${a})`);G.addColorStop(.7,`rgba(96,104,112,${a})`);G.addColorStop(.88,`rgba(196,206,214,${a})`);G.addColorStop(1,`rgba(70,76,84,${a})`);return G};
BB.pickbot=(x,base,h,swing,o={})=>{const sq=o.squash||0;
  ctx.save();ctx.translate(x,base);
  const ang=BB.lerp(-1.9,.35,swing),u=h*.032,edge='rgba(20,24,28,.75)',ew=Math.max(1.2,h*.006);
  ctx.save();ctx.translate(h*.22,-h*.62);ctx.rotate(ang);{
  /* handle: waxed wood cylinder */
  const y0=h*.05,y1=-h*.4;
  ctx.beginPath();ctx.roundRect(-u,y1,u*2,y0-y1,u);
  {const G=ctx.createLinearGradient(-u,0,u,0);G.addColorStop(0,'#3a1e0c');G.addColorStop(.22,'#8a5228');G.addColorStop(.4,'#d89a5c');G.addColorStop(.52,'#f3c38a');G.addColorStop(.7,'#a8642e');G.addColorStop(1,'#2e1608');ctx.fillStyle=G}ctx.fill();
  ctx.save();ctx.clip();ctx.strokeStyle='rgba(60,28,8,.35)';ctx.lineWidth=Math.max(.8,h*.0025);for(let i=0;i<5;i++){const gx=-u*.7+i*u*.35;ctx.beginPath();ctx.moveTo(gx,y1);ctx.bezierCurveTo(gx+u*.25,y1*.6,gx-u*.25,y1*.3,gx+u*.1,y0);ctx.stroke()}
  ctx.fillStyle='rgba(255,240,215,.35)';ctx.fillRect(-u*.25,y1,u*.18,y0-y1);/* specular streak */
  ctx.fillStyle='rgba(150,230,240,.25)';ctx.fillRect(u*.72,y1,u*.2,y0-y1);/* cool rim light */
  {const G=ctx.createLinearGradient(0,-h*.09,0,h*.05);G.addColorStop(0,'rgba(0,0,0,0)');G.addColorStop(.45,'rgba(10,4,0,.55)');G.addColorStop(.7,'rgba(10,4,0,.55)');G.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=G;ctx.fillRect(-u,-h*.09,u*2,h*.14)}/* AO where the claw grips */
  {const G=ctx.createLinearGradient(0,y1,0,y1+h*.08);G.addColorStop(0,'rgba(10,4,0,.6)');G.addColorStop(1,'rgba(10,4,0,0)');ctx.fillStyle=G;ctx.fillRect(-u,y1,u*2,h*.08)}/* AO under the head */
  ctx.restore();ctx.strokeStyle=edge;ctx.lineWidth=ew;ctx.stroke();
  /* chrome ferrule at the butt */
  ctx.beginPath();ctx.roundRect(-u*1.15,y0-h*.035,u*2.3,h*.035,u*.4);ctx.fillStyle=chromeX(-u*1.15,u*1.15);ctx.fill();ctx.strokeStyle=edge;ctx.stroke();
  /* pick head: bevelled chrome, curved, tapered tips */
  const hy=-h*.38;const pick=(k)=>{ctx.beginPath();ctx.moveTo(-h*.23,hy+h*.035);ctx.quadraticCurveTo(-h*.12,hy-h*.055*k,0,hy-h*.075*k);ctx.quadraticCurveTo(h*.12,hy-h*.055*k,h*.24,hy+h*.03);ctx.quadraticCurveTo(h*.12,hy-h*.005,0,hy-h*.015);ctx.quadraticCurveTo(-h*.12,hy-h*.005,-h*.23,hy+h*.035);ctx.closePath()};
  ctx.save();ctx.translate(h*.008,h*.012);pick(1);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fill();ctx.restore();/* contact/ao shadow */
  pick(1);{const G=ctx.createLinearGradient(0,hy-h*.08,0,hy+h*.03);G.addColorStop(0,'#ffffff');G.addColorStop(.18,'#dfe6ea');G.addColorStop(.38,'#8b959d');G.addColorStop(.55,'#4a5259');G.addColorStop(.75,'#9aa5ad');G.addColorStop(1,'#2e3439');ctx.fillStyle=G}ctx.fill();
  ctx.save();ctx.clip();
  /* reflections: horizon band + sky streaks */
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(-h*.07,hy-h*.045,h*.09,h*.008,-.12,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(h*.1,hy-h*.04,h*.06,h*.006,.15,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,190,120,.22)';ctx.fillRect(-h*.25,hy-h*.01,h*.5,h*.012);/* warm floor bounce */
  ctx.restore();
  /* bevel: light top edge, dark under edge, cool rim */
  ctx.save();pick(1);ctx.clip();ctx.lineWidth=h*.012;ctx.strokeStyle='rgba(255,255,255,.65)';ctx.translate(0,h*.004);pick(1);ctx.stroke();ctx.translate(0,-h*.009);ctx.strokeStyle='rgba(0,0,0,.45)';pick(1);ctx.stroke();ctx.restore();
  pick(1);ctx.strokeStyle=edge;ctx.lineWidth=ew;ctx.stroke();
  /* eye collar (where the head meets the handle) */
  ctx.beginPath();ctx.roundRect(-u*1.5,hy-h*.085,u*3,h*.1,u*.6);ctx.fillStyle=chromeX(-u*1.5,u*1.5);ctx.fill();ctx.strokeStyle=edge;ctx.stroke();
  {const r=Math.max(2,h*.013),cx=0,cy=hy-h*.035,G=ctx.createRadialGradient(cx-r*.4,cy-r*.4,0,cx,cy,r);G.addColorStop(0,'#ffffff');G.addColorStop(.5,'#9aa5ad');G.addColorStop(1,'#2e3439');ctx.fillStyle=G;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill()}}
  ctx.restore();
  ctx.restore();
  /* v12.6e: hard hat sits ON the bucket rim, covering the open lid; no added height */
  BB.sprite('sorter',x,base,h,{squash:sq})};
/* v12.6b Static Jr. (option A): rusty orange TV bot drawn in code, cached per size */
const jrC={};
function jrCanvas(h){const key=Math.round(h);if(jrC[key])return jrC[key];const S=h<160?3:2,H=h*S,Wd=H*1.08,P=Math.ceil(H*.03),c=document.createElement('canvas');c.width=Math.ceil(Wd+P*2);c.height=Math.ceil(H+P*2);const g=c.getContext('2d');g.translate(P,P);
  /* v12.6d: volumetric render - soft gradients, AO, rim light, rust chips, dents, seams, rivets, glossy cracked visor */
  let sd=11;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const LG=(x0,y0,x1,y1,a)=>{const G=g.createLinearGradient(x0,y0,x1,y1);a.forEach((v,i)=>G.addColorStop(Array.isArray(v)?v[0]:i/(a.length-1),Array.isArray(v)?v[1]:v));return G};
  const RG=(x,y,r0,x1,y1,r1,a)=>{const G=g.createRadialGradient(x,y,r0,x1,y1,r1);a.forEach((v,i)=>G.addColorStop(i/(a.length-1),v));return G};
  const rp=(x,y,w,hh,r)=>{g.beginPath();g.roundRect(x,y,w,hh,r)};
  /* volumetric block: base vertical gradient + key light blob (upper left) + AO bottom + rim light right + dark edge */
  const vol=(path,x,y,w,hh,cols,o={})=>{g.save();path();g.fillStyle=LG(0,y,0,y+hh,cols);g.fill();g.clip();
    g.fillStyle=RG(x+w*.3,y+hh*.22,0,x+w*.3,y+hh*.22,Math.max(w,hh)*.75,['rgba(255,226,180,.42)','rgba(255,200,150,.12)','rgba(255,200,150,0)']);g.fillRect(x,y,w,hh);
    g.fillStyle=LG(0,y+hh*.6,0,y+hh,['rgba(40,15,5,0)','rgba(40,15,5,.45)']);g.fillRect(x,y,w,hh);
    g.fillStyle=LG(x+w*.75,0,x+w,0,['rgba(0,0,0,0)','rgba(30,10,0,.35)']);g.fillRect(x,y,w,hh);
    if(o.rust)o.rust(x,y,w,hh);
    g.globalCompositeOperation='source-atop';g.lineWidth=H*.014;g.strokeStyle='rgba(255,236,200,.55)';g.translate(H*.006,H*.006);path();g.stroke();g.translate(-H*.012,-H*.012);g.strokeStyle='rgba(130,220,230,.35)';path();g.stroke();g.restore();
    g.save();path();g.lineWidth=Math.max(1.5,H*.006);g.strokeStyle='rgba(45,18,6,.85)';g.stroke();g.restore()};
  const rustTex=(x,y,w,hh,n)=>{for(let i=0;i<n;i++){const px=x+rnd()*w,py=y+rnd()*hh,r=H*(.006+rnd()*rnd()*.035),a=rnd()*3;
      g.fillStyle=rnd()<.35?'rgba(70,55,48,.85)':'rgba(92,36,12,.6)';g.beginPath();for(let k=0;k<7;k++){const aa=a+k/7*6.28,rr=r*(.55+rnd()*.6);g.lineTo(px+Math.cos(aa)*rr,py+Math.sin(aa)*rr*.75)}g.fill();
      g.strokeStyle='rgba(255,190,140,.35)';g.lineWidth=H*.003;g.beginPath();g.arc(px,py+r*.15,r*.8,.3,2.6);g.stroke()}
    for(let i=0;i<n*3;i++){g.fillStyle=rnd()<.5?'rgba(80,30,8,.25)':'rgba(255,190,130,.18)';g.fillRect(x+rnd()*w,y+rnd()*hh,H*.004,H*.004)}
    for(let i=0;i<n/4;i++){const px=x+rnd()*w,py=y+rnd()*hh;g.strokeStyle='rgba(255,215,170,.3)';g.lineWidth=H*.0025;g.beginPath();g.moveTo(px,py);g.lineTo(px+H*(.02+rnd()*.03),py+H*(rnd()-.5)*.01);g.stroke()}
    for(let i=0;i<3;i++){const px=x+w*(.15+rnd()*.7),py=y+hh*(.2+rnd()*.6),r=H*(.02+rnd()*.02);g.fillStyle=RG(px-r*.3,py-r*.3,0,px,py,r,['rgba(40,12,0,.35)','rgba(40,12,0,0)']);g.fillRect(px-r,py-r,r*2,r*2);g.strokeStyle='rgba(255,220,180,.3)';g.lineWidth=H*.003;g.beginPath();g.arc(px,py,r*.8,2.2,4.2);g.stroke()}};
  const rivet=(x,y,r)=>{g.fillStyle='rgba(30,10,0,.45)';g.beginPath();g.arc(x+r*.25,y+r*.35,r,0,7);g.fill();g.fillStyle=RG(x-r*.35,y-r*.35,0,x,y,r,['#ffd7a8','#b0612c','#5a2a10']);g.beginPath();g.arc(x,y,r,0,7);g.fill()};
  const metal=(x,y,w,hh,r)=>{rp(x,y,w,hh,r);g.fillStyle=LG(x,0,x+w,0,['#3b3f45','#9aa3ab',[.35,'#d6dde2'],'#6c737b','#2c3035']);g.fill();g.strokeStyle='rgba(15,15,20,.7)';g.lineWidth=H*.005;g.stroke()};
  const cx=Wd/2;
  /* ---- arms (behind torso): segmented rusty arms with claw hands ---- */
  const ty=H*.6,tw=Wd*.56,tx=cx-tw/2,th=H*.36;
  for(const s of[-1,1]){const ax=cx+s*tw*.56;g.save();g.translate(ax,ty+H*.05);g.rotate(s*-.12);
    vol(()=>{rp(-H*.045,0,H*.09,H*.12,H*.04)},-H*.045,0,H*.09,H*.12,['#e48a4e','#b2551f','#6e2e0e'],{rust:(x,y,w,hh)=>rustTex(x,y,w,hh,6)});
    metal(-H*.03,H*.115,H*.06,H*.035,H*.01);
    vol(()=>{rp(-H*.042,H*.145,H*.084,H*.1,H*.035)},-H*.042,H*.145,H*.084,H*.1,['#de844a','#a94e1c','#64290c'],{rust:(x,y,w,hh)=>rustTex(x,y,w,hh,5)});
    for(const f of[-1,0,1]){g.save();g.translate(f*H*.022,H*.245);g.rotate(f*.35);metal(-H*.011,0,H*.022,H*.05,H*.01);g.restore()}
    g.restore()}
  /* ---- torso ---- */
  const tp=()=>rp(tx,ty,tw,th,H*.07);
  g.save();g.fillStyle='rgba(20,8,0,.35)';g.filter=`blur(${H*.01}px)`;rp(tx-H*.01,ty-H*.02,tw+H*.02,H*.06,H*.03);g.fill();g.restore();/* AO under head */
  vol(tp,tx,ty,tw,th,['#ef9a5c','#c8652b','#8d3c13','#5e250b'],{rust:(x,y,w,hh)=>rustTex(x,y,w,hh,28)});
  g.strokeStyle='rgba(50,18,4,.6)';g.lineWidth=H*.004;g.beginPath();g.moveTo(tx+H*.03,ty+th*.82);g.lineTo(tx+tw-H*.03,ty+th*.82);g.stroke();g.strokeStyle='rgba(255,210,170,.3)';g.beginPath();g.moveTo(tx+H*.03,ty+th*.82+H*.004);g.lineTo(tx+tw-H*.03,ty+th*.82+H*.004);g.stroke();
  for(const [px,py,pw,ph,r] of[[tx+tw*.1,ty+th*.2,tw*.34,th*.46,-.08],[tx+tw*.56,ty+th*.14,tw*.32,th*.48,.06]]){g.save();g.translate(px+pw/2,py+ph/2);g.rotate(r);
    g.fillStyle='rgba(30,10,0,.4)';rp(-pw/2+H*.006,-ph/2+H*.008,pw,ph,H*.012);g.fill();
    rp(-pw/2,-ph/2,pw,ph,H*.012);g.fillStyle=LG(-pw/2,-ph/2,pw/2,ph/2,['#a9d9c4','#73ad97','#4c816e']);g.fill();g.save();g.clip();for(let i=0;i<14;i++){g.fillStyle=rnd()<.5?'rgba(30,60,50,.25)':'rgba(220,255,240,.2)';g.beginPath();g.arc((rnd()-.5)*pw,(rnd()-.5)*ph,H*(.003+rnd()*.008),0,7);g.fill()}g.restore();
    g.strokeStyle='rgba(30,50,45,.8)';g.lineWidth=H*.004;g.stroke();
    g.strokeStyle='#d8c9a8';g.lineWidth=H*.005;g.lineCap='round';const st=(x0,y0,x1,y1,n)=>{for(let i=0;i<n;i++){const k=(i+.5)/n,x=x0+(x1-x0)*k,y=y0+(y1-y0)*k,nx=(y1-y0)?H*.012:0,ny=(x1-x0)?H*.012:0;g.beginPath();g.moveTo(x-nx,y-ny);g.lineTo(x+nx,y+ny);g.stroke()}};
    st(-pw/2,-ph/2,pw/2,-ph/2,4);st(-pw/2,ph/2,pw/2,ph/2,4);st(-pw/2,-ph/2,-pw/2,ph/2,4);st(pw/2,-ph/2,pw/2,ph/2,4);g.restore()}
  for(const [rx,ry] of[[tx+H*.03,ty+H*.03],[tx+tw-H*.03,ty+H*.03],[tx+H*.03,ty+th-H*.035],[tx+tw-H*.03,ty+th-H*.035]])rivet(rx,ry,H*.009);
  /* ---- head ---- */
  const hx=Wd*.07,hw=Wd*.86,hy=H*.08,hh=H*.53,hp=()=>rp(hx,hy,hw,hh,H*.07);
  for(const s of[-1,1]){const ex=s<0?hx-H*.035:hx+hw-H*.015,ey=hy+hh*.28,ew=H*.05,eh=hh*.44;
    rp(ex,ey,ew,eh,H*.025);g.fillStyle=LG(ex,0,ex+ew,0,s<0?['#2c3035','#7b838b','#b8c0c6','#555c63']:['#555c63','#b8c0c6','#7b838b','#2c3035']);g.fill();g.strokeStyle='rgba(15,15,20,.8)';g.lineWidth=H*.005;g.stroke();
    g.fillStyle='rgba(255,255,255,.25)';rp(ex+ew*.3,ey+eh*.08,ew*.18,eh*.84,ew*.09);g.fill()}
  {const dx=cx,dy=hy+H*.01,dr=hw*.17;g.save();g.beginPath();g.ellipse(dx,dy,dr,H*.065,0,Math.PI,0);g.closePath();g.fillStyle=RG(dx-dr*.35,dy-H*.05,0,dx,dy,dr,['#ffbe88','#d0692c','#7a3210']);g.fill();g.clip();rustTex(dx-dr,dy-H*.07,dr*2,H*.07,6);g.restore();g.strokeStyle='rgba(45,18,6,.85)';g.lineWidth=H*.005;g.beginPath();g.ellipse(dx,dy,dr,H*.065,0,Math.PI,0);g.stroke()}
  vol(hp,hx,hy,hw,hh,['#f6a466','#d8743a','#a74c1c','#6e2e0e'],{rust:(x,y,w,hh2)=>rustTex(x,y,w,hh2,60)});
  /* panel seams */
  g.lineWidth=H*.004;for(const [x0,y0,x1,y1] of[[hx+hw*.28,hy,hx+hw*.28,hy+hh*.1],[hx+hw*.7,hy,hx+hw*.7,hy+hh*.1],[hx+hw*.3,hy+hh,hx+hw*.3,hy+hh*.9],[hx+hw*.72,hy+hh,hx+hw*.72,hy+hh*.9],[hx,hy+hh*.5,hx+hw*.04,hy+hh*.5]]){g.strokeStyle='rgba(50,18,4,.75)';g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle='rgba(255,215,175,.35)';g.beginPath();g.moveTo(x0+H*.004,y0);g.lineTo(x1+H*.004,y1);g.stroke()}
  {const px=hx+hw*.11,py=hy+H*.004,pw=hw*.1,ph=H*.045;rp(px,py,pw,ph,H*.006);g.fillStyle=LG(px,py,px+pw,py+ph,['#b4e0cc','#6ea692','#4a7f6c']);g.fill();g.strokeStyle='rgba(30,50,45,.8)';g.lineWidth=H*.004;g.stroke()}
  /* bezel + visor */
  const sx=hx+hw*.065,sy=hy+hh*.14,sw=hw*.66,sh=hh*.72,br=H*.055;
  g.save();g.filter=`blur(${H*.008}px)`;g.fillStyle='rgba(30,10,0,.5)';rp(sx-H*.01,sy-H*.002,sw+H*.03,sh+H*.03,br);g.fill();g.restore();
  rp(sx-H*.022,sy-H*.022,sw+H*.044,sh+H*.044,br*1.2);g.fillStyle=LG(0,sy-H*.02,0,sy+sh+H*.02,['#c9d0d5','#7d858c','#4a5056','#8e969c']);g.fill();g.strokeStyle='rgba(15,15,20,.75)';g.lineWidth=H*.005;g.stroke();
  rp(sx-H*.008,sy-H*.008,sw+H*.016,sh+H*.016,br);g.fillStyle=LG(0,sy,0,sy+sh,['#2a2e33','#5c646b']);g.fill();
  rp(sx,sy,sw,sh,br);g.fillStyle=RG(sx+sw*.5,sy+sh*.45,H*.01,sx+sw*.5,sy+sh*.5,sw*.65,['#1d6670','#0d3a42','#051a1f']);g.fill();
  g.save();rp(sx,sy,sw,sh,br);g.clip();
  g.strokeStyle='rgba(110,230,240,.07)';g.lineWidth=1;const m=H*.008;for(let y=sy;y<sy+sh;y+=m){g.beginPath();g.moveTo(sx,y);g.lineTo(sx+sw,y);g.stroke()}for(let x=sx;x<sx+sw;x+=m){g.beginPath();g.moveTo(x,sy);g.lineTo(x,sy+sh);g.stroke()}
  g.shadowColor='#6ff0ff';g.shadowBlur=H*.035;g.fillStyle='#a8f7ff';
  for(const s of[-1,1]){const ex=sx+sw/2+s*sw*.2,ey=sy+sh*.43;g.save();g.translate(ex,ey);g.rotate(s*.2);g.beginPath();g.ellipse(0,0,sw*.12,sh*.15,0,0,7);g.fill();g.fillStyle='#08262c';g.shadowBlur=0;g.beginPath();g.arc(-s*sw*.03,sh*.03,sw*.048,0,7);g.fill();g.fillStyle='#e9fdff';g.beginPath();g.arc(-s*sw*.045,sh*.0,sw*.014,0,7);g.fill();g.restore();
    g.shadowBlur=H*.03;g.strokeStyle='#a8f7ff';g.lineWidth=H*.024;g.lineCap='round';g.beginPath();g.moveTo(ex-s*sw*.15,ey-sh*.28);g.lineTo(ex+s*sw*.09,ey-sh*.17);g.stroke()}
  g.lineWidth=H*.028;g.beginPath();g.arc(sx+sw/2,sy+sh*.5,sw*.23,.28,Math.PI-.28);g.stroke();g.shadowBlur=0;
  /* crack web from an impact point */
  {const ix=sx+sw*.68,iy=sy+sh*.22;g.strokeStyle='rgba(225,250,255,.8)';g.lineWidth=Math.max(1,H*.0035);for(let i=0;i<9;i++){let a=i/9*6.28+rnd()*.4,x=ix,y=iy;g.beginPath();g.moveTo(x,y);for(let k=0;k<5;k++){const L=sw*(.05+rnd()*.09);a+=(rnd()-.5)*.7;x+=Math.cos(a)*L;y+=Math.sin(a)*L;g.lineTo(x,y)}g.stroke()}
    g.strokeStyle='rgba(225,250,255,.45)';for(const r of[sw*.05,sw*.11]){g.beginPath();for(let k=0;k<=9;k++){const a=k/9*6.28,rr=r*(.8+rnd()*.4);g.lineTo(ix+Math.cos(a)*rr,iy+Math.sin(a)*rr)}g.stroke()}
    g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.arc(ix,iy,H*.006,0,7);g.fill()}
  /* glass gloss: curved reflection band + corner glints + inner shade */
  g.fillStyle=LG(0,sy,0,sy+sh*.45,['rgba(255,255,255,.28)','rgba(255,255,255,.04)']);g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+sw*.75,sy);g.quadraticCurveTo(sx+sw*.45,sy+sh*.25,sx,sy+sh*.42);g.fill();
  g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.ellipse(sx+sw*.15,sy+sh*.14,sw*.05,sh*.025,-.6,0,7);g.fill();
  g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=H*.02;rp(sx,sy,sw,sh,br);g.stroke();g.restore();
  /* dials */
  for(let i=0;i<3;i++){const dx=hx+hw*.865,dy=hy+hh*(.22+i*.27),r=H*.045;g.fillStyle='rgba(30,10,0,.45)';g.beginPath();g.arc(dx+r*.15,dy+r*.25,r*1.12,0,7);g.fill();
    g.fillStyle=LG(dx-r,dy-r,dx+r,dy+r,['#5d636a','#2a2d31']);g.beginPath();g.arc(dx,dy,r*1.1,0,7);g.fill();
    g.fillStyle=RG(dx-r*.4,dy-r*.45,0,dx,dy,r,['#e3e8ec','#8f979e','#3c4147']);g.beginPath();g.arc(dx,dy,r*.88,0,7);g.fill();
    g.strokeStyle='#26292d';g.lineWidth=H*.007;g.beginPath();g.moveTo(dx-r*.5,dy);g.lineTo(dx+r*.5,dy);g.stroke();g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.ellipse(dx-r*.35,dy-r*.42,r*.22,r*.1,-.6,0,7);g.fill()}
  for(const [rx,ry] of[[hx+H*.03,hy+H*.03],[hx+hw-H*.03,hy+H*.03],[hx+H*.03,hy+hh-H*.03],[hx+hw-H*.03,hy+hh-H*.03],[hx+hw*.5,hy+H*.022]])rivet(rx,ry,H*.01);
  return jrC[key]={c,w:Wd/S,h:H/S,pad:P/S}}
// Static Jr.: rusty TV bot, cracked cyan visor, rusty boots.
/* v12.6d: option A render cut into a clean sprite (head+torso+arms); legs/boots/antennas stay procedural for the gait. ?jr=code forces the code-drawn body */
const jrSp={};function jrSprite(h){const I=IMG.jr_a;if(!I||/jr=code/.test(location.search))return null;const k=Math.round(h);if(jrSp[k])return jrSp[k];
  const S=2,H=Math.round(h*S),W=Math.round(H*I.width/I.height),P=2,c=document.createElement('canvas');c.width=W+P*2;c.height=H+P*2;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(I,P,P,W,H);return jrSp[k]={c,w:W/S,h:H/S,pad:P/S,sprite:1}}
BB.staticJr=(x,base,h,o={})=>{const J=jrSprite(h*1.2925)||jrCanvas(h),im=J.c;if(J.sprite)h=J.h;const SPR=!!J.sprite;const t=BB.t,w=J.w,legH=SPR?h*.195:h*.3,run=o.run||0;
  ctx.save();ctx.translate(x,base);
  const lift=o.lift||0;if(!o.noShadow){const k=1/(1+lift/60);ctx.fillStyle=`rgba(0,0,0,${.28*k})`;ctx.beginPath();ctx.ellipse(0,lift,w*.4*k,10*k,0,0,7);ctx.fill()}
  ctx.rotate(o.rot||0);if(o.flip)ctx.scale(-1,1);
  /* v12.6c gait: planted foot moves back at ground speed (no slide), swing foot arcs forward; knees bend; body bobs */
  const spd=o.spd||450,fq=Math.min(11,Math.max(3.5,spd/(4*h*.16))),A=Math.min(h*.26,spd/(4*fq))*run,cyc=t*fq;
  const bob=run?-Math.abs(Math.sin(cyc*Math.PI*2))*h*.035*run:0,hipY=-legH+bob,LL=legH*.56;
  for(const lx of [-.2,.2]){const c=((cyc+(lx>0?.5:0))%1+1)%1;let fx=w*lx*.8,fy=0;
    if(run){if(c<.5){fx+=A-2*A*(c/.5)}else{const u=(c-.5)/.5;fx+=-A+2*A*(u*u*(3-2*u));fy=-Math.sin(Math.PI*u)*h*.12*run}}
    const hx=w*lx*.8,ax=fx,ay=fy-h*.06,dx=ax-hx,dy=ay-hipY,d=Math.hypot(dx,dy),bend=Math.sqrt(Math.max(0,LL*LL-d*d/4));
    const kx=(hx+ax)/2+(-dy/d)*bend*-1,ky=(hipY+ay)/2+(dx/d)*bend*-1;
    const sa=o.noShadow||lift?0:Math.max(0,1+fy/(h*.15));if(sa)ctx.fillStyle=`rgba(0,0,0,${.25*sa})`;if(sa){ctx.beginPath();ctx.ellipse(fx+h*.03,0,h*.1*(.6+.4*sa),h*.025,0,0,7);ctx.fill()}
    ctx.strokeStyle='#2a2d33';ctx.lineWidth=Math.max(6,h*(SPR?.07:.08));ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(hx,hipY);ctx.lineTo(kx,ky);ctx.lineTo(ax,ay);ctx.stroke();
    ctx.strokeStyle='#6a7279';ctx.lineWidth=Math.max(3,h*.05);ctx.stroke();ctx.save();ctx.translate(-h*.012,-h*.006);ctx.strokeStyle='rgba(225,232,238,.75)';ctx.lineWidth=Math.max(1.2,h*.014);ctx.stroke();ctx.restore();
    {const kr=Math.max(3,h*.042);const G=ctx.createRadialGradient(kx-kr*.4,ky-kr*.4,0,kx,ky,kr);G.addColorStop(0,'#eef2f4');G.addColorStop(.5,'#8e979e');G.addColorStop(1,'#33373c');ctx.fillStyle=G;ctx.beginPath();ctx.arc(kx,ky,kr,0,7);ctx.fill();ctx.strokeStyle='rgba(15,15,20,.7)';ctx.lineWidth=1.5;ctx.stroke()}
    const tilt=fy<0?-.25*run:0;ctx.save();ctx.translate(fx+h*.03,fy-h*.06);ctx.rotate(tilt);
    ctx.fillStyle='#2e1a0e';ctx.beginPath();ctx.roundRect(-h*.11,h*.02,h*.22,h*.04,h*.015);ctx.fill();
    {const G=ctx.createRadialGradient(-h*.04,-h*.04,0,0,0,h*.13);G.addColorStop(0,'#ffb47a');G.addColorStop(.45,'#c4602a');G.addColorStop(1,'#5e250b');ctx.fillStyle=G}ctx.strokeStyle='rgba(45,18,6,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-h*.005,h*.11,h*.06,0,Math.PI,0);ctx.lineTo(h*.11,h*.025);ctx.lineTo(-h*.11,h*.025);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(70,40,30,.7)';ctx.beginPath();ctx.arc(h*.04,-h*.02,h*.018,0,7);ctx.arc(-h*.06,h*.0,h*.012,0,7);ctx.fill();ctx.fillStyle='rgba(255,230,200,.55)';ctx.beginPath();ctx.ellipse(-h*.035,-h*.042,h*.04,h*.012,-.2,0,7);ctx.fill();ctx.restore()}
  const by=-legH-h,sq=o.squash||0;ctx.translate(0,hipY+(SPR?h*.125:0));ctx.scale(1+sq,1-sq);
  {// v12.4 Jr rabbit-ear antennas with sparks
    const lq=BB.q===0;for(const s of[-1,1]){const a=s*(.45+Math.sin(t*2+s)*.08),L=h*.5,bx=J.sprite?w*(-.013+s*.075):s*w*.12,tx=bx+Math.sin(a)*L,ty=-h-Math.cos(a)*L;
      ctx.strokeStyle='#3a3e44';ctx.lineWidth=Math.max(3,h*.028);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(bx,-h*(J.sprite?.975:.9));ctx.lineTo(tx,ty);ctx.stroke();ctx.strokeStyle='rgba(220,226,232,.7)';ctx.lineWidth=Math.max(1,h*.009);ctx.beginPath();ctx.moveTo(bx-h*.006,-h*(J.sprite?.975:.9));ctx.lineTo(tx-h*.006,ty);ctx.stroke();
      {const mx=bx+(tx-bx)*.45,my=-h*.9+(ty+h*.9)*.45,r=Math.max(2,h*.02);ctx.fillStyle='#8e979e';ctx.beginPath();ctx.arc(mx,my,r,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(mx-r*.3,my-r*.3,r*.4,0,7);ctx.fill()}
      const sp=Math.sin(t*7+s*2)>.55;if(sp)BB.glow(tx,ty,h*.25,'rgba(140,220,255,A)',.6);
      {const r=h*.045,G=ctx.createRadialGradient(tx-r*.4,ty-r*.4,0,tx,ty,r);G.addColorStop(0,sp?'#ffffff':'#e9eef1');G.addColorStop(.5,sp?'#bff0ff':'#8e979e');G.addColorStop(1,sp?'#4fb6cc':'#33373c');ctx.fillStyle=G;ctx.strokeStyle='rgba(15,15,20,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(tx,ty,r,0,7);ctx.fill();ctx.stroke()}
      if(sp&&!lq){ctx.strokeStyle='#ffe066';ctx.lineWidth=2.5;for(let i=0;i<3;i++){const aa=i*2.1+t*9,r1=h*.09,r2=h*.2;ctx.beginPath();ctx.moveTo(tx+Math.cos(aa)*r1,ty+Math.sin(aa)*r1);ctx.lineTo(tx+Math.cos(aa+.3)*(r1+r2)*.6,ty+Math.sin(aa+.3)*(r1+r2)*.6);ctx.lineTo(tx+Math.cos(aa)*r2,ty+Math.sin(aa)*r2);ctx.stroke()}}}}
  if(o.glitch){for(let i=0;i<8;i++){const sy=im.height*i/8,dy=-h+h*i/8,off=(Math.random()-.5)*h*.25*o.glitch;const P=J.pad;ctx.drawImage(im,0,P*2+sy*(im.height-P*4)/im.height,im.width,(im.height-P*4)/8,-w/2-P+off,dy,w+P*2,h/8+1)}}
  else ctx.drawImage(im,-w/2-J.pad,-h-J.pad,w+J.pad*2,h+J.pad*2);
  if(o.stuffed){// cheeks stuffed + whole note sticking out
    ctx.fillStyle='rgba(255,140,150,.95)';ctx.strokeStyle=COL.ink;ctx.lineWidth=3;
    for(const s of[-1,1]){ctx.beginPath();ctx.ellipse(s*w*.46,-h*.62,w*.1,h*.14,0,0,7);ctx.fill();ctx.stroke()}
    BB.solidWhole(w*.02,-h*.48,h*.17,{rot:-.4+Math.sin(t*12)*.1})}
  if(o.dizzy){for(let i=0;i<3;i++){const a=t*4+i*2.1;BB.star(Math.cos(a)*w*.45,-h*1.08+Math.sin(a)*12,12,COL.yellow,a)}}
  ctx.restore()};
/* v12.6c solid 3D whole note (same object as the room tiles); s = horizontal radius */
BB.solidWhole=(x,y,s,o={})=>{const R=BB.R;if(!R||!R.note3d)return BB.wholeNote(x,y,s,o);const n=s/1.25,hh=n/.2,ww=n*2.9,sp=R.note3d('w',ww,hh);
  ctx.save();ctx.translate(x,y);ctx.rotate(o.rot||0);if(o.glow)BB.glow(0,0,s*2.2,'rgba(255,245,190,A)',o.glow);
  const cw=sp.c.width/sp.sc,ch=sp.c.height/sp.sc;ctx.drawImage(sp.c,-cw/2,-sp.gy,cw,ch);ctx.restore()};
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
BB.micMeter=(x,y,o={})=>{if(BB.listening&&!o._in){const sc=BB.listening===2?1.35:1.15,cx=x<W/2?x:x+330,cy=y>H/2?y+110:y;ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.translate(-cx,-cy);ctx.save();ctx.shadowColor='#6ee678';ctx.shadowBlur=30+20*Math.sin(BB.t*9);BB.rrect(x-8,y-8,346,126,30,null,'#6ee678',6);ctx.restore();BB.micMeter(x,y,{...o,_in:1});BB.text('LISTENING',x+165,y-24,26,'#6ee678',{stroke:5});ctx.restore();return}const m=BB.mic;BB.bevel(x-8,y-8,346,126,30);BB.well(x,y,330,110,26);
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
// ---- v12.6 start-of-game soft/loud clap check (mic setup only): explain -> 4-beat count-in -> 8 soft claps ->
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
