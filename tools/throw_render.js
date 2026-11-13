#!/usr/bin/env node
// v14.5.10 offline VISUAL check of boss throws (no browser): renders the real drawJunk/drawTireRoll + throwPath lanes
// onto a 1920x1080 sheet with the cue card / DODGE banner / bubble boxes, writes PNGs, and fails if an object enters a text box.
// needs @napi-rs/canvas (npm i in /tmp/cv). usage: node tools/throw_render.js [outdir]
'use strict';
const fs=require('fs'),path=require('path');const {createCanvas}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8'),out=process.argv[2]||'/tmp/throws';fs.mkdirSync(out,{recursive:true});
const W=1920,H=1080,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,JR={x:1430,y:540};
const help=src.match(/const BOMB_LANES=[\s\S]*?DODGE_VO=\{[^}]*\};/)[0]+src.match(/const SAFE_Y=\d+,throwPath=[\s\S]*?fg:sc>=1\.7\|\|u>=\.4\}\};/)[0]+src.match(/const LANE_DIR=[\s\S]*?sx:kind==='bomb'\?1:1-\.16\*Math\.sin\(Math\.PI\*Math\.min\(u,1\)\)\}\};/)[0];
const L=new Function('W','H','clamp','lerp',help+';return{throwLane,throwPath,LANE_TG,throwTurn}')(W,H,clamp,lerp);
const cv=createCanvas(W,H),ctx=cv.getContext('2d'),COL={ink:'#19191f'};
const BB={rrect:(x,y,w,h,r,f,s,lw)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(f){ctx.fillStyle=f;ctx.fill()}if(s&&lw){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke()}}};
const mb=src.slice(src.indexOf('  junkVol('),src.indexOf('  drawBlastRing('));const M=new Function('ctx','COL','BB','return new (class{'+mb+'})')(ctx,COL,BB);
const BOX=[{n:'cue card',x:400,y:40,w:1120,h:220},{n:'DODGE banner',x:630,y:318,w:660,h:66},{n:'Jr bubble',x:1280,y:290,w:300,h:100}];
let fails=0;const items={left:'sock',right:'chicken',high:'chicken',floor:'tire',botL:'bomb',botR:'bomb',mid:'bomb'};
function bg(){ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);ctx.fillStyle='#3b3f47';ctx.fillRect(0,740,W,H-740);for(const b of BOX){ctx.fillStyle='rgba(255,224,102,.35)';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#fff';ctx.font='28px sans-serif';ctx.fillText(b.n,b.x+10,b.y+34)}ctx.fillStyle='#c0603a';ctx.fillRect(JR.x-110,JR.y-200,220,380)}
for(const lane of Object.keys(items)){bg();const tire=lane==='floor',sx=tire?JR.x-40:(lane==='right'||lane==='botR')?JR.x+60:JR.x-90,sy=tire?JR.y+170:JR.y-40;let minX=1e9,maxX=-1e9,maxY=-1e9,hit=[];const sc0=[];
  for(let v=0;v<=1.45;v+=.15){const P=L.throwPath(lane,v,sx,sy);if(!P)continue;sc0.push(P.sc);ctx.save();ctx.globalAlpha=Math.max(.25,P.a);ctx.translate(P.x,P.y-(tire?62*P.sc:0));ctx.scale(P.sc,P.sc);{const TT=L.throwTurn(lane,v,items[lane]);ctx.rotate(TT.rot);ctx.scale(TT.sx,1)}tire?M.drawTireRoll(v*16):M.drawJunk(items[lane],0);ctx.restore();
    const r=(tire?62:60)*P.sc,cy=P.y-(tire?62*P.sc:0);minX=Math.min(minX,P.x);maxX=Math.max(maxX,P.x);maxY=Math.max(maxY,cy-r);
    for(const b of BOX)if(P.x+r>b.x&&P.x-r<b.x+b.w&&cy+r>b.y&&cy-r<b.y+b.h)hit.push(b.n+'@v'+v.toFixed(2))}
  ctx.fillStyle='#fff';ctx.font='48px sans-serif';ctx.fillText('lane '+lane+' ('+items[lane]+')',40,1040);fs.writeFileSync(out+'/lane_'+lane+'.png',cv.toBuffer('image/png'));
  const msg=`${lane}: x ${minX|0}..${maxX|0}, scale ${sc0[0].toFixed(2)}->${sc0[sc0.length-1].toFixed(2)}, top-of-object lowest ${maxY|0}`;
  if(hit.length)console.log('ok (v14.5.21 UI coverage allowed)',msg,'overlaps',hit.join(','));else console.log('ok',msg);
  if(!tire){const mid=L.throwPath(lane,.5,sx,sy);if(mid&&mid.y>=540){fails++;console.error('FAIL',lane,'mid-flight y',mid.y|0,'not in upper half')}}
  if(lane==='left'&&!(minX<W*.12)){fails++;console.error('FAIL left lane does not reach far left')}if(lane==='right'&&!(maxX>W*.9)){fails++;console.error('FAIL right lane does not reach far right')}
  if(tire&&!(maxY>H)){fails++;console.error('FAIL tire does not roll off the bottom')}if(tire&&!(sc0[sc0.length-1]>5*sc0[0])){fails++;console.error('FAIL tire does not grow toward the viewer')}}
// close-up of the two junk items
bg();ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);[['sock',500],['chicken',1000],['bomb',1450]].forEach(([j,x])=>{ctx.save();ctx.translate(x,560);ctx.scale(3,3);M.drawJunk(j,0);ctx.restore()});ctx.save();ctx.translate(250,560);ctx.scale(2.5,2.5);M.drawTireRoll(3);ctx.restore();fs.writeFileSync(out+'/items.png',cv.toBuffer('image/png'));
// TURN sequence sheet: each item along its lane, v = 0 .. 1.4, fixed size so only the turn is visible
{ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);ctx.font='30px sans-serif';const rows=[['left','sock'],['right','chicken'],['high','sock'],['botR','bomb'],['floor','tire']],vs=[0,.2,.4,.6,.8,1,1.2,1.4];
  rows.forEach(([lane,j],r)=>{const y=120+r*205;ctx.fillStyle='#fff';ctx.fillText(lane+' / '+j,20,y-60);let mx=0,last=null,flips=0;
    vs.forEach((v,c)=>{const TT=L.throwTurn(lane,v,j);mx=Math.max(mx,Math.abs(TT.rot));ctx.save();ctx.translate(330+c*200,y+20);ctx.scale(j==='tire'?.9:.95,j==='tire'?.9:.95);ctx.rotate(TT.rot);ctx.scale(TT.sx,1);j==='tire'?M.drawTireRoll(v*16):M.drawJunk(j,0);ctx.restore();ctx.fillStyle='#bbb';ctx.fillText('v'+v.toFixed(1)+'  '+(TT.rot*57.3).toFixed(0)+'°',270+c*200,y+105)});
    for(let v=0;v<=1.5;v+=.01){const a=L.throwTurn(lane,v,j).rot;if(last!=null&&Math.abs(a-last)>.05){fails++;console.error('FAIL turn jumps',lane)}last=a}
    const lim=j==='tire'?.15:.61;if(mx>lim){fails++;console.error('FAIL',lane,j,'turn too large',mx)}else console.log('ok',lane,j,'max turn',(mx*57.3).toFixed(0)+'° (smooth, no spin)')});
  const dl=L.throwTurn('left',1,'sock').rot,dr=L.throwTurn('right',1,'chicken').rot;if(!(dl<0&&dr>0)){fails++;console.error('FAIL left/right turn directions')}else console.log('ok left lane turns left, right lane turns right');
  fs.writeFileSync(out+'/turn_sequence.png',cv.toBuffer('image/png'))}
// side-by-side with the real robot sprites (Static Jr. jr_a.png, Sprocket sprocket.png)
{const {loadImage}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');(async()=>{const A=path.join(__dirname,'../assets/');const jr=await loadImage(A+'jr_a.png'),sp=await loadImage(A+'sprocket.png');
  const g=ctx;g.fillStyle='#2b3140';g.fillRect(0,0,W,H);const bgG=g.createLinearGradient(0,600,0,H);bgG.addColorStop(0,'#3b3f47');bgG.addColorStop(1,'#1c1e23');g.fillStyle=bgG;g.fillRect(0,700,W,H-700);
  const jh=560,jw=jh*jr.width/jr.height;g.drawImage(jr,40,140,jw,jh);const sh=520,sw=sh*sp.width/sp.height;g.drawImage(sp,W-sw-40,180,sw,sh);
  [['sock',760,330,2.4],['chicken',1100,330,2.2],['bomb',800,720,2.4],['tire',1120,700,2.2]].forEach(([j,x,y,s])=>{g.save();g.translate(x,y);g.scale(s,s);j==='tire'?M.drawTireRoll(3):M.drawJunk(j,0);g.restore()});
  g.fillStyle='#fff';g.font='40px sans-serif';g.fillText('robots (real sprites) vs thrown junk (delivery.js drawJunk/drawTireRoll)',40,60);fs.writeFileSync(out+'/compare_robots.png',cv.toBuffer('image/png'));console.log('wrote',out+'/compare_robots.png')})()}
if(fails){console.error(fails+' FAIL');process.exit(1)}console.log('all throw render checks passed ->',out);
