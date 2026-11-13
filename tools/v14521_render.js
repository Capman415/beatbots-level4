#!/usr/bin/env node
// Offline preview frames for v14.5.21 (not GUI screenshots).
'use strict';
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
const out=process.argv[2]||'/workspace/previews/v14.5.21';fs.mkdirSync(out,{recursive:true});
const W=1920,H=1080,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,JR={x:1430,y:540};
const help=src.match(/const BOMB_LANES=[\s\S]*?DODGE_VO=\{[^}]*\};/)[0]
  +src.match(/const SAFE_Y=\d+,throwPath=[\s\S]*?fg:sc>=1\.7\|\|u>=\.4\}\};/)[0]
  +src.match(/const LANE_DIR=[\s\S]*?sx:kind==='bomb'\?1:1-\.16\*Math\.sin\(Math\.PI\*Math\.min\(u,1\)\)\}\};/)[0];
const L=new Function('W','H','clamp','lerp',help+';return{throwPath,throwTurn,LANE_TG}')(W,H,clamp,lerp);
const Hlp=new Function('clamp','window',src.match(/const clapDyn=[\s\S]*?HIT_DMG=6;/)[0]+';return{clapDyn,dynFill,dynLevel,BLAST_R}')(clamp,{});

const cv=createCanvas(W,H),ctx=cv.getContext('2d'),COL={ink:'#19191f',yellow:'#ffe066',green:'#6ee678'};
const BB={rrect:(x,y,w,h,r,f,s,lw)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(f){ctx.fillStyle=f;ctx.fill()}if(s){ctx.strokeStyle=s;ctx.lineWidth=lw||3;ctx.stroke()}},
  lg:(a,b,cols)=>{const g=ctx.createLinearGradient(0,a,0,b);cols.forEach((c,i)=>g.addColorStop(i/(cols.length-1),c));return g},
  text:(str,x,y,sz,col,o={})=>{ctx.save();ctx.font=`bold ${sz}px sans-serif`;ctx.textAlign=o.align||'center';ctx.textBaseline='middle';if(o.stroke){ctx.lineWidth=o.stroke;ctx.strokeStyle=o.strokeCol||'#1a1a1a';ctx.strokeText(str,x,y,o.maxW)}ctx.fillStyle=col;ctx.fillText(str,x,y,o.maxW);ctx.restore()}};
const mb=src.slice(src.indexOf('  junkVol('),src.indexOf('  drawBlastRing('));
const blast=src.slice(src.indexOf('  drawBlastRing('),src.indexOf('\n  koIcon(')>-1?src.indexOf('\n  koIcon('):src.indexOf('  koIcon('));
const cans=src.slice(src.indexOf('  drawCans('),src.indexOf('  /* shared POWER system'));
const M=new Function('ctx','COL','BB','clamp','lerp',
  'return new (class{constructor(){this.dyn=0}\n'+mb+'\n'+blast+'\n'+cans+'\n})')(ctx,COL,BB,clamp,lerp);

function dock(title){
  ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);
  const g=ctx.createLinearGradient(0,700,0,H);g.addColorStop(0,'#3b3f47');g.addColorStop(1,'#1c1e23');ctx.fillStyle=g;ctx.fillRect(0,700,W,H-700);
  ctx.fillStyle='rgba(255,224,102,.28)';ctx.fillRect(400,40,1120,220);BB.text('cue card',420,70,24,'#fff',{align:'left'});
  ctx.fillStyle='rgba(255,138,223,.3)';ctx.fillRect(630,318,660,66);BB.text('DODGE banner',960,350,24,'#fff');
  ctx.fillStyle='#c0603a';ctx.fillRect(JR.x-90,JR.y-180,180,360);
  BB.text(title,40,1044,22,'#cfe8e2',{align:'left'});
}
function save(name){const p=path.join(out,name);fs.writeFileSync(p,cv.toBuffer('image/png'));console.log('wrote',p);return p}

// --- throw height: several v on left/high/right ---
dock('v14.5.21 throw height — mid-flight in upper half, then dives (offline render)');
const lanes=[['left','sock',JR.x-90,JR.y-40],['right','chicken',JR.x+60,JR.y-40],['high','chicken',JR.x-90,JR.y-40]];
for(const [lane,item,sx,sy] of lanes){
  for(let v=0;v<=1.35;v+=.15){
    const P=L.throwPath(lane,v,sx,sy);if(!P)continue;
    ctx.save();ctx.globalAlpha=Math.max(.3,P.a);ctx.translate(P.x,P.y);ctx.scale(P.sc,P.sc);
    const TT=L.throwTurn(lane,v,item);ctx.rotate(TT.rot);ctx.scale(TT.sx,1);
    M.drawJunk(item,0);ctx.restore();
    if(Math.abs(v-.5)<.01){ctx.strokeStyle='#ffe066';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(0,P.y);ctx.lineTo(W,P.y);ctx.stroke();ctx.setLineDash([]);BB.text(lane+' v=0.5  y='+(P.y|0),P.x,Math.max(40,P.y-70),22,'#ffe066')}
  }
}
ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,540);ctx.lineTo(W,540);ctx.stroke();
BB.text('mid-screen y=540',160,520,20,'#fff');
save('throw_height.png');

// --- tire roll frames + strip ---
const tdir=path.join(out,'tire_frames');fs.mkdirSync(tdir,{recursive:true});
for(let i=0,v=0;v<=1.4;v+=.2,i++){
  dock('v14.5.21 tire roll  v='+v.toFixed(1)+'  (offline render)');
  const sx=JR.x-40,sy=JR.y+170,P=L.throwPath('floor',v,sx,sy);
  if(P){ctx.save();ctx.globalAlpha=P.a;ctx.translate(P.x,P.y-58*P.sc);ctx.scale(P.sc,P.sc);const TT=L.throwTurn('floor',v,'tire');ctx.rotate(TT.rot);ctx.scale(TT.sx,1);M.drawTireRoll(v*16);ctx.restore()}
  save('tire_frames/tire_'+String(i).padStart(2,'0')+'.png');
}
// close-up rolling cycle
ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);
BB.text('v14.5.21 tire close-up — clean circular roll, nothing detached',40,50,32,'#fff',{align:'left'});
for(let i=0;i<8;i++){
  const x=160+i*220,y=540;
  ctx.save();ctx.translate(x,y);ctx.scale(2.1,2.1);M.drawTireRoll(i*1.2);ctx.restore();
  BB.text('ph '+(i*1.2).toFixed(1),x,720,22,'#cfe8e2');
}
save('tire_closeup.png');

// --- canister fill ---
function cansSheet(title,counts){
  ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,W,H);
  BB.text(title,W/2,60,36,'#ffe066');
  counts.forEach(([lab,lvl,n],i)=>{
    const x=180+i*430,y=280,f=Hlp.dynFill(Array.from({length:n},()=>Hlp.clapDyn({lvl})));
    ctx.save();ctx.translate(x,y-200);M.drawCans(0,0,f,0,0,0);ctx.restore();
    BB.text(lab,x+140,y+390,28,'#fff');
    BB.text('fill '+f.toFixed(2)+'  '+['BLAST','BIG','MEGA'][Hlp.dynLevel(f)],x+140,y+430,24,'#cfe8e2');
  });
  BB.text('offline render — not a GUI screenshot',40,1044,20,'#9fb0b8',{align:'left'});
}
cansSheet('v14.5.21 clap canister fill — 7.2s window, amount + dynamics',
  [['4 piano',.5,4],['8 piano',.5,8],['12 piano (window)',.5,12],['8 mezzo',.7,8]]);
save('canisters_fill.png');

// --- explosions ---
ctx.fillStyle='#1a1020';ctx.fillRect(0,0,W,H);
BB.text('v14.5.21 punchier hit explosions (big-blast style)',W/2,50,36,'#ffe066');
[['early travel',.2],['impact',.55],['ring linger',.85]].forEach(([lab,u],i)=>{
  const x=320+i*640,y=520;
  ctx.fillStyle='#c0603a';ctx.fillRect(x-70,y-40,140,280);
  if(u<.48){const tt=u/.48,r=34+tt*30;ctx.save();ctx.translate(x,y);ctx.rotate(tt*6);ctx.beginPath();for(let q=0;q<10;q++){const a=q/10*Math.PI*2,rr=q%2?r*.5:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fillStyle='#ffe066';ctx.strokeStyle='#19191f';ctx.lineWidth=7;ctx.fill();ctx.stroke();ctx.restore()}
  else M.drawBlastRing(x,y,150,(u-.48)/.52);
  BB.text(lab,x,860,28,'#fff');
});
BB.text('offline render — not a GUI screenshot',40,1044,20,'#9fb0b8',{align:'left'});
save('explosions.png');

// MEGA blast still
ctx.fillStyle='#1a1020';ctx.fillRect(0,0,W,H);
ctx.fillStyle='#c0603a';ctx.fillRect(JR.x-90,JR.y-180,180,360);
M.drawBlastRing(JR.x,JR.y-90,Hlp.BLAST_R[2],.55);
BB.text('MEGA BLAST!',W/2,640,136,'#7ef0ff',{stroke:12});
BB.text('v14.5.21 MEGA blast (offline render)',40,1044,22,'#cfe8e2',{align:'left'});
save('explosion_mega.png');

// --- 6-7 hands ---
function arms(jx,jy,gv){
  for(const sd of[-1,1]){
    const bob=Math.cos(gv*Math.PI/.8+(sd>0?Math.PI:0))*36,sx=jx+sd*88,sy=jy-48,hx=jx+sd*168,hy=jy-28+bob,ex=lerp(sx,hx,.48)+sd*12,ey=lerp(sy,hy,.48)+14;
    ctx.save();ctx.lineCap='round';ctx.strokeStyle='rgba(45,18,6,.95)';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
    const Ug=ctx.createLinearGradient(sx,sy,ex,ey);Ug.addColorStop(0,'#e3eaee');Ug.addColorStop(1,'#4d575e');ctx.strokeStyle=Ug;ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.strokeStyle='rgba(45,18,6,.95)';ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(hx,hy);ctx.stroke();
    const Fg=ctx.createLinearGradient(ex,ey,hx,hy);Fg.addColorStop(0,'#cfd8dc');Fg.addColorStop(1,'#56616a');ctx.strokeStyle=Fg;ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(hx,hy);ctx.stroke();
    ctx.translate(hx,hy);ctx.scale(sd,1);BB.rrect(-28,-24,56,48,16,BB.lg(-24,24,['#ecc088','#b88246']),'#5a3a1e',4);BB.rrect(-16,-38,34,18,8,'#efe3c8','#5a3a1e',3);
    for(let f=0;f<3;f++){ctx.strokeStyle='rgba(90,58,30,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14+f*14,-8);ctx.lineTo(-14+f*14,16);ctx.stroke()}
    ctx.restore();
  }
  BB.text(gv<.8?'6...':'6... 7!',jx-330,jy-60,72,'#ffe066',{stroke:8});
}
(async()=>{
  const A=path.join(__dirname,'../assets/');
  let jr=null,sp=null;try{jr=await loadImage(A+'jr_a.png')}catch(e){}
  try{sp=await loadImage(A+'sprocket.png')}catch(e){}
  dock('v14.5.21  “6...7”  — robot arms attached at the shoulders (offline render)');
  const jx=JR.x,jy=JR.y;
  if(jr){const jh=520,jw=jh*jr.width/jr.height;ctx.drawImage(jr,jx-jw/2,jy+230-jh,jw,jh)}
  else{ctx.fillStyle='#c0603a';ctx.fillRect(jx-90,jy-180,180,360)}
  arms(jx,jy,1.0);
  save('hands_67.png');

  // fight start — Jr standing, no blast, no lightning, no particles
  dock('v14.5.21 fight start — no opening blast on Static Jr. (offline render)');
  if(jr){const jh=520,jw=jh*jr.width/jr.height;ctx.drawImage(jr,jx-jw/2,jy+230-jh,jw,jh)}
  else{ctx.fillStyle='#c0603a';ctx.fillRect(jx-90,jy-180,180,360)}
  if(sp){const sh=400,sw=sh*sp.width/sp.height;ctx.drawImage(sp,80,H-sh-40,sw,sh)}
  BB.text('ROUND 1: DUCK & LEAN',W/2,200,64,'#ffe066',{stroke:10});
  BB.text('No opening glitch, fuzz, lightning, or leftover blast particles.',W/2,980,28,'#cfe8e2');
  save('fight_start.png');

  // assess AFTER + side-by-side
  function assess(after){
    ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,W,H);
    BB.rrect(80,40,1760,110,28,'#1a2a28','#ffe066',4);
    BB.text('CHECKPOINT  2 / 8',W/2,78,36,'#ffe066',{stroke:5});
    BB.text('Score  1  ·  need 6 of 8 to unlock Static Jr.',W/2,118,28,'#cfe8e2',{stroke:4});
    for(let i=0;i<8;i++){const x=260+i*175,y=155;BB.rrect(x,y,150,18,9,i<1?'#6ee678':i===1?'#ffe066':'#2a3a38','#fff',2)}
    const py=after?350:230;
    BB.text('What does PIANO mean?',W/2,py,40,'#fff',{stroke:7,maxW:1700});
    const choices=[{lab:'SOFT / quiet',sub:'tiny quiet claps'},{lab:'SLOW',sub:'not about speed'},{lab:'LOUD',sub:'that is forte'}];
    const n=3,bw=Math.min(420,Math.floor(1500/n)-24),gap=24,tot=n*bw+(n-1)*gap,x0=W/2-tot/2;
    choices.forEach((ch,i)=>{const x=x0+i*(bw+gap);
      BB.rrect(x,420,bw,220,18,'#2d4744','#eee4cc',4);
      BB.text(ch.lab,x+bw/2,after?530:500,ch.lab.length>12?32:44,'#ffe9a0',{stroke:6,maxW:bw-24});
      if(!after)BB.text(ch.sub,x+bw/2,580,26,'#d7efe8',{stroke:4,strokeCol:'#142826',maxW:bw-24});
    });
    BB.text((after?'AFTER  v14.5.21':'BEFORE  v14.5.20')+'  — offline render, not a GUI screenshot',40,1040,22,'#9fb0b8',{align:'left'});
  }
  assess(true);save('assess_choice_after.png');

  // side-by-side from saved before/after
  const beforeP=path.join(out,'assess_choice_before.png');
  const afterP=path.join(out,'assess_choice_after.png');
  const side=createCanvas(W,H),sctx=side.getContext('2d');
  const bimg=await loadImage(beforeP),aimg=await loadImage(afterP);
  sctx.fillStyle='#0a1211';sctx.fillRect(0,0,W,H);
  sctx.drawImage(bimg,20,80,930,540);
  sctx.drawImage(aimg,970,80,930,540);
  sctx.fillStyle='#fff';sctx.font='bold 36px sans-serif';sctx.fillText('BEFORE  v14.5.20',40,50);
  sctx.fillText('AFTER  v14.5.21',990,50);
  sctx.font='20px sans-serif';sctx.fillStyle='#cfe8e2';
  sctx.fillText('Question lowered toward the choices; spoiler hint lines under answers removed.',40,1060);
  fs.writeFileSync(path.join(out,'assess_choice_before_after.png'),side.toBuffer('image/png'));
  console.log('wrote',path.join(out,'assess_choice_before_after.png'));
})().catch(e=>{console.error(e);process.exit(1)});
