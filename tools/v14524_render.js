#!/usr/bin/env node
// Offline previews for v14.5.24 head-on tire (not GUI screenshots).
'use strict';
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {createCanvas}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
const out=process.argv[2]||'/workspace/previews/v14.5.24';fs.mkdirSync(out,{recursive:true});
const W=1920,H=1080,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,JR={x:1430,y:540};

function extract(srcText){
  const help=srcText.match(/const TIRE_LANES=[\s\S]*?DODGE_VO=\{[^}]*\};/)[0]
    +srcText.match(/const SAFE_Y=\d+,throwPath=[\s\S]*?fg:sc>=1\.7\|\|u>=\.4\}\};/)[0]
    +srcText.match(/const LANE_DIR=[\s\S]*?sx:kind==='bomb'\?1:1-\.16\*Math\.sin\(Math\.PI\*Math\.min\(u,1\)\)\}\};/)[0];
  const L=new Function('W','H','clamp','lerp',help+';return{throwPath,throwTurn,LANE_TG}')(W,H,clamp,lerp);
  return L;
}
function makeM(ctx,srcText){
  const COL={ink:'#19191f',yellow:'#ffe066',green:'#6ee678'};
  const BB={rrect:(x,y,w,h,r,f,s,lw)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(f){ctx.fillStyle=f;ctx.fill()}if(s){ctx.strokeStyle=s;ctx.lineWidth=lw||3;ctx.stroke()}},
    lg:(a,b,cols)=>{const g=ctx.createLinearGradient(0,a,0,b);cols.forEach((c,i)=>g.addColorStop(i/(cols.length-1),c));return g},
    text:(str,x,y,sz,col,o={})=>{ctx.save();ctx.font=`bold ${sz}px sans-serif`;ctx.textAlign=o.align||'center';ctx.textBaseline='middle';if(o.stroke){ctx.lineWidth=o.stroke;ctx.strokeStyle=o.strokeCol||'#1a1a1a';ctx.strokeText(str,x,y,o.maxW)}ctx.fillStyle=col;ctx.fillText(str,x,y,o.maxW);ctx.restore()}};
  const mb=srcText.slice(srcText.indexOf('  junkVol('),srcText.indexOf('  drawBlastRing('));
  return new Function('ctx','COL','BB','clamp','lerp',
    'return new (class{constructor(){this.dyn=0}\n'+mb+'\n})')(ctx,COL,BB,clamp,lerp);
}

const L=extract(src);
const cv=createCanvas(W,H),ctx=cv.getContext('2d');
const COL={ink:'#19191f',yellow:'#ffe066',green:'#6ee678'};
const BB={rrect:(x,y,w,h,r,f,s,lw)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(f){ctx.fillStyle=f;ctx.fill()}if(s){ctx.strokeStyle=s;ctx.lineWidth=lw||3;ctx.stroke()}},
  text:(str,x,y,sz,col,o={})=>{ctx.save();ctx.font=`bold ${sz}px sans-serif`;ctx.textAlign=o.align||'center';ctx.textBaseline='middle';if(o.stroke){ctx.lineWidth=o.stroke;ctx.strokeStyle=o.strokeCol||'#1a1a1a';ctx.strokeText(str,x,y,o.maxW)}ctx.fillStyle=col;ctx.fillText(str,x,y,o.maxW);ctx.restore()}};
const M=makeM(ctx,src);

function dock(title){
  ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);
  const g=ctx.createLinearGradient(0,700,0,H);g.addColorStop(0,'#3b3f47');g.addColorStop(1,'#1c1e23');ctx.fillStyle=g;ctx.fillRect(0,700,W,H-700);
  ctx.fillStyle='rgba(255,224,102,.28)';ctx.fillRect(400,40,1120,220);BB.text('cue card',420,70,24,'#fff',{align:'left'});
  ctx.fillStyle='rgba(255,138,223,.3)';ctx.fillRect(630,318,660,66);BB.text('JUMP! (rolling tire!)',960,350,28,'#fff');
  ctx.fillStyle='#c0603a';ctx.fillRect(JR.x-90,JR.y-180,180,360);BB.text('Jr',JR.x,JR.y-200,22,'#fff');
  // lane guide at the release x
  ctx.strokeStyle='rgba(255,224,102,.35)';ctx.lineWidth=2;ctx.setLineDash([8,8]);
  ctx.beginPath();ctx.moveTo(JR.x-40,0);ctx.lineTo(JR.x-40,H);ctx.stroke();ctx.setLineDash([]);
  BB.text(title,40,1044,22,'#cfe8e2',{align:'left'});
}
function save(name){const p=path.join(out,name);fs.writeFileSync(p,cv.toBuffer('image/png'));console.log('wrote',p);return p}

// --- close-up: one big frame + 8-phase strip ---
ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);
BB.text('v14.5.24 tire — dead-on, rolling straight at the camera',40,48,34,'#fff',{align:'left'});
BB.text('offline render — not a GUI screenshot',40,90,22,'#9fb0b8',{align:'left'});
ctx.save();ctx.translate(480,520);ctx.scale(4.4,4.4);M.drawTireRoll(3.2);ctx.restore();
BB.text('close-up  ph=3.2',480,820,26,'#cfe8e2');
for(let i=0;i<8;i++){
  const x=1180,y=150+i*115;
  ctx.save();ctx.translate(x,y);ctx.scale(1.45,1.45);M.drawTireRoll(i*0.7);ctx.restore();
  BB.text('ph '+(i*0.7).toFixed(1),x+130,y,22,'#cfe8e2',{align:'left'});
}
BB.text('8-phase scroll (bands move downward)',1180,70,22,'#ffe066');
save('tire_closeup.png');

// also a wide 8-phase strip for inspection
ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);
BB.text('v14.5.24  8-phase tread scroll — downward, toward the viewer',40,50,30,'#fff',{align:'left'});
for(let i=0;i<8;i++){
  const x=140+i*230,y=540;
  ctx.save();ctx.translate(x,y);ctx.scale(2.15,2.15);M.drawTireRoll(i*0.7);ctx.restore();
  BB.text('ph '+(i*0.7).toFixed(1),x,760,22,'#cfe8e2');
}
save('tire_phases.png');

// --- path frames (straight, no diagonal) ---
const tdir=path.join(out,'tire_frames');fs.mkdirSync(tdir,{recursive:true});
const sx=JR.x-40,sy=JR.y+170;
for(let i=0,v=0;v<=1.4;v+=.2,i++){
  dock('v14.5.24 tire path  v='+v.toFixed(1)+'  x stays at '+sx+'  (offline render)');
  const P=L.throwPath('floor',v,sx,sy);
  if(P){ctx.save();ctx.globalAlpha=P.a;ctx.translate(P.x,P.y-62*P.sc);ctx.scale(P.sc,P.sc);const TT=L.throwTurn('floor',v,'tire');ctx.rotate(TT.rot);ctx.scale(TT.sx,1);M.drawTireRoll(v*16);ctx.restore();
    BB.text('x='+(P.x|0)+'  y='+(P.y|0)+'  sc='+P.sc.toFixed(2),40,1000,22,'#ffe066',{align:'left'})}
  save('tire_frames/tire_'+String(i).padStart(2,'0')+'.png');
}

// --- comparison vs v14.5.23 ---
const oldSrc=execSync('git show 7b8fca0:js/rooms/delivery.js',{cwd:path.join(__dirname,'..'),encoding:'utf8'});
const Lold=extract(oldSrc);
const cv23=createCanvas(W,H),ctx23=cv23.getContext('2d');
const M23=makeM(ctx23,oldSrc);
function paintCompare(target, Msrc, Lsrc, title, ph, v){
  const g=target.getContext('2d');
  // temporarily swap? easier to draw into the given canvas via its own M
  g.fillStyle='#2b3140';g.fillRect(0,0,W,H);
}
// draw side by side on main cv
ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);
BB.text('v14.5.23 (3/4, diagonal path)   vs   v14.5.24 (head-on, straight at camera)',40,48,28,'#fff',{align:'left'});
BB.text('same phase  ph=3.2',40,90,22,'#9fb0b8',{align:'left'});
// left: old closeup — draw 23 into a temp canvas then blit
function blitTire(Mx, ph, dx, dy, sc){
  const t=createCanvas(400,500),g=t.getContext('2d');
  g.fillStyle='#2b3140';g.fillRect(0,0,400,500);
  g.save();g.translate(200,240);g.scale(sc,sc);Mx.drawTireRoll(ph);g.restore();
  return t;
}
// We need M23 to use ctx23, so draw on cv23 and copy.
ctx23.fillStyle='#2b3140';ctx23.fillRect(0,0,W,H);
ctx23.save();ctx23.translate(W/2,H/2);ctx23.scale(3.6,3.6);M23.drawTireRoll(3.2);ctx23.restore();
const left=ctx23.getImageData(W/2-280,H/2-340,560,700);
ctx.putImageData(left,80,140);
ctx.save();ctx.translate(1440,500);ctx.scale(3.6,3.6);M.drawTireRoll(3.2);ctx.restore();
BB.text('v14.5.23',360,880,32,'#ffe066');
BB.text('v14.5.24',1440,880,32,'#6ee678');
// path traces under the closeups? add a small path inset
function pathInset(Lx, x0, y0, label){
  ctx.save();ctx.translate(x0,y0);
  ctx.fillStyle='#1c1e23';ctx.fillRect(0,0,560,140);
  ctx.strokeStyle='rgba(255,255,255,.2)';ctx.strokeRect(0,0,560,140);
  ctx.beginPath();
  for(let v=0;v<=1.35;v+=.05){
    const P=Lx.throwPath('floor',v,sx,sy);if(!P)continue;
    const px=30+(P.x-1000)*0.35, py=20+(P.y-700)*0.12;
    if(v===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.strokeStyle='#ffe066';ctx.lineWidth=3;ctx.stroke();
  ctx.restore();
  BB.text(label,x0+280,y0+160,20,'#cfe8e2');
}
pathInset(Lold,80,910,'v14.5.23 path (drifts left toward center)');
pathInset(L,1280,910,'v14.5.24 path (straight, locked to lane x)');
save('tire_v14523_vs_v14524.png');

// --- mp4 frames at higher rate ---
const rdir=path.join(out,'roll_frames');fs.mkdirSync(rdir,{recursive:true});
let n=0;
for(let f=0;f<48;f++,n++){
  const v=f/47*1.35;
  dock('v14.5.24  rolling straight at the camera   v='+v.toFixed(2));
  const P=L.throwPath('floor',v,sx,sy);
  if(P){ctx.save();ctx.globalAlpha=P.a;ctx.translate(P.x,P.y-62*P.sc);ctx.scale(P.sc,P.sc);const TT=L.throwTurn('floor',v,'tire');ctx.rotate(TT.rot);ctx.scale(TT.sx,1);M.drawTireRoll(v*16);ctx.restore()}
  const fp=path.join(rdir,'f_'+String(f).padStart(3,'0')+'.png');
  fs.writeFileSync(fp,cv.toBuffer('image/png'));
}
console.log('wrote',n,'roll frames');
