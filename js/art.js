// Shared Beat Bots art + HUD pieces (match the video style: cream/teal panels, green beat pills, Lilita/Rammetto).
'use strict';
(()=>{const ctx=BB.ctx,COL=BB.COL,IMG=BB.IMG,W=BB.W,H=BB.H;
// draw a cutout by its bottom-centre with squash/stretch
BB.sprite=(name,x,base,h,o={})=>{const im=IMG[name];if(!im)return;const w=im.width*h/im.height;const sq=o.squash||0;
  ctx.save();ctx.translate(x,base);
  if(o.shadow!==false){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,0,w*.38,12,0,0,7);ctx.fill()}
  ctx.rotate(o.rot||0);ctx.scale((o.flip?-1:1)*(1+sq),1-sq);ctx.globalAlpha=o.alpha??1;ctx.drawImage(im,-w/2,-h,w,h);ctx.restore()};
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
  BB.rrect(cx-tot/2-30,y-50,tot+60,100,30,'rgba(20,40,38,.94)',COL.teal2,5);
  for(let i=0;i<n;i++){const x=cx-tot/2+i*(pw+gap)+Math.sin(BB.t*20+i*2)*wob*14,yy=y-ph/2+Math.cos(BB.t*17+i)*wob*10,l=lit[i];
    if(l>.01){ctx.save();ctx.globalAlpha=l*.85;BB.glow(x+pw/2,y,90,'rgba(110,230,120,A)',.7);ctx.restore()}
    const g=Math.round(40+l*70),gg=Math.round(60+l*170),bb=Math.round(60+l*60);
    BB.rrect(x,yy,pw,ph,12,`rgb(${g},${gg},${bb})`,'#fff',3);
    if(o.marks&&o.marks[i]){const m=o.marks[i];BB.star(x+pw/2,yy+ph/2,16*BB.ease.back(Math.min(1,m)),COL.yellow,BB.t)}}};
// mic meter with soft/loud bands and a sensitivity +/- pair
BB.micMeter=(x,y,o={})=>{const m=BB.mic;BB.rrect(x,y,330,110,26,'rgba(20,40,38,.94)',COL.teal2,5);
  BB.text('MIC',x+50,y+40,32,COL.yellow,{stroke:4});
  BB.text(m.ok?'ON':({denied:'BLOCKED',nodevice:'NONE',lost:'LOST',error:'ERROR'}[m.state]||'OFF'),x+50,y+78,m.ok?22:16,m.ok?COL.green:'#ff9c8a');
  const n=10,lvl=m.level;for(let i=0;i<n;i++){const on=i<lvl*n,bx=x+95+i*20;let c=on?(i<4?'#6ee678':i<7?'#ffe066':'#ff7b5c'):'#3c5050';
    if(o.band==='soft'&&i>=4)c=on?'#ff7b5c':'#2a3a3a';
    if(o.band==='loud'&&i<6)c=on?'#8aa':'#2a3a3a';
    ctx.fillStyle=c;ctx.fillRect(bx,y+22+(9-i)*3,14,64-(9-i)*3)}
  if(o.band){const bx0=x+95+(o.band==='soft'?0:6*20),bw=(o.band==='soft'?4:4)*20-6;BB.rrect(bx0-3,y+14,bw+6,80,6,null,o.band==='soft'?'#b6f0ff':'#ffd23c',3)}};
BB.sensButtons=(x,y)=>{const m=BB.mic;
  BB.button(x,y,90,90,'−',{size:50,id:'sens-',onClick:()=>m.sensIdx=Math.max(0,m.sensIdx-1)});
  BB.button(x+110,y,90,90,'+',{size:50,id:'sens+',onClick:()=>m.sensIdx=Math.min(5,m.sensIdx+1)})};
BB.pauseBtn=(onClick,x=W/2-90,y=24)=>{BB.button(x,y,180,110,'PAUSE',{style:'teal',size:34,id:'pause',onClick,
  icon:(ix,iy)=>{ctx.fillStyle=COL.yellow;ctx.fillRect(ix-16,iy-16,10,32);ctx.fillRect(ix,iy-16,10,32)}})};
BB.overrideBtn=(onClick,o={})=>{const x=W-370,y=H-150;BB.button(x,y,340,125,'MANUAL',{style:'red',size:40,sub:'OVERRIDE',id:'override',onClick,pop:o.pop})};
BB.captionBox=()=>{const c=BB.caption;if(!c||BB.t>c.until)return;const k=Math.min(1,(BB.t-c.start)*6);
  const fs=38,w=Math.min(1150,BB.measure(c.txt,fs)+200),x=W/2-w/2,y=H-300;
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
  BB.button(W/2-210,y+h-130,420,110,'RESUME',{style:'green',size:56,id:'resume',onClick:onResume})};
let rt=0,rl=performance.now();BB.realT=()=>{const n=performance.now();rt+=(n-rl)/1000;rl=n;return rt};
// room title card
BB.titleCard=(txt,sub,k)=>{if(k<=0||k>=1)return;const a=k<.15?k/.15:k>.85?(1-k)/.15:1;ctx.save();ctx.globalAlpha=a;
  const s=.8+.2*BB.ease.back(Math.min(1,k*4));ctx.translate(W/2,H/2-60);ctx.scale(s,s);BB.panel(-520,-130,1040,260,40);
  BB.text(txt,0,-30,84,'#fff',{font:'Rammetto One',stroke:9});BB.text(sub,0,58,40,COL.yellow,{stroke:5});ctx.restore()};
})();
