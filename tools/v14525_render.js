#!/usr/bin/env node
// Offline fight-HUD previews for v14.5.25 tire lanes + sock high arcs (not a live GUI recording).
'use strict';
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage,GlobalFonts}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
const out=process.argv[2]||'/workspace/previews/v14.5.25';fs.mkdirSync(out,{recursive:true});
const W=1920,H=1080,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,JR={x:1430,y:540},LCH={x:300,y:760};
try{GlobalFonts.registerFromPath(path.join(__dirname,'../assets/RammettoOne-Regular.ttf'),'Rammetto One')}catch(e){console.warn('font',e.message)}

const help=src.match(/const TIRE_LANES=[\s\S]*?DODGE_VO=\{[^}]*\};/)[0]
  +src.match(/const SAFE_Y=\d+,throwPath=[\s\S]*?fg:sc>=1\.7\|\|u>=\.4\}\};/)[0]
  +src.match(/const LANE_DIR=[\s\S]*?sx:kind==='bomb'\?1:1-\.16\*Math\.sin\(Math\.PI\*Math\.min\(u,1\)\)\}\};/)[0];
const L=new Function('W','H','clamp','lerp',help+';return{throwPath,throwTurn,throwLane,LANE_TG,TIRE_HOP,TIRE_LANES}')(W,H,clamp,lerp);

function makeM(ctx){
  const COL={ink:'#19191f',yellow:'#ffe066',green:'#6ee678'};
  const BB={rrect:(x,y,w,h,r,f,s,lw)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(f){ctx.fillStyle=f;ctx.fill()}if(s){ctx.strokeStyle=s;ctx.lineWidth=lw||3;ctx.stroke()}},
    text:(str,x,y,sz,col,o={})=>{ctx.save();ctx.font=`bold ${sz}px ${o.font||'sans-serif'}`;ctx.textAlign=o.align||'center';ctx.textBaseline='middle';if(o.stroke){ctx.lineWidth=o.stroke;ctx.strokeStyle=o.strokeCol||'#1a1a1a';ctx.strokeText(str,x,y,o.maxW)}ctx.fillStyle=col;ctx.fillText(str,x,y,o.maxW);ctx.restore()}};
  const mb=src.slice(src.indexOf('  junkVol('),src.indexOf('  drawBlastRing('));
  const M=new Function('ctx','COL','BB','clamp','lerp','return new (class{constructor(){this.dyn=0}\n'+mb+'\n})')(ctx,COL,BB,clamp,lerp);
  return {M,BB,COL};
}

(async()=>{
  const dock=await loadImage(path.join(__dirname,'../assets/v2/dock_bg.jpg'));
  const jr=await loadImage(path.join(__dirname,'../assets/jr_a.png'));
  const sp=await loadImage(path.join(__dirname,'../assets/sprocket.png'));
  const cv=createCanvas(W,H),ctx=cv.getContext('2d');
  const {M,BB,COL}=makeM(ctx);

  // Cue card matches drawKO: panel at (W/2,150), 1120×220 → x=400..1520, y=40..260
  const CARD={x:400,y:40,w:1120,h:220};
  function fightBG(cue,beat,next,note){
    ctx.drawImage(dock,0,0,W,H);
    ctx.fillStyle='rgba(8,12,20,.22)';ctx.fillRect(0,0,W,H);
    const jh=520,jw=jh*jr.width/jr.height;ctx.drawImage(jr,JR.x-jw/2,JR.y-jh+90,jw,jh);
    const sh=430,sw=sh*sp.width/sp.height;ctx.drawImage(sp,LCH.x-sw/2-30,LCH.y-sh+50,sw,sh);
    // cue card HUD
    const cx=W/2,cy=150;
    ctx.save();ctx.translate(cx,cy);
    ctx.fillStyle='rgba(16,28,32,.92)';ctx.strokeStyle='#fff';ctx.lineWidth=4;
    ctx.beginPath();ctx.roundRect(-560,-110,1120,220,30);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffe066';ctx.beginPath();ctx.roundRect(-560,-110,140,220,30);ctx.fill();
    BB.text('!',-490,-10,100,'#1a1a1a',{font:'Rammetto One'});
    BB.text(cue,60,-20,cue.length>16?52:74,'#ffe066',{font:'Rammetto One',stroke:8,maxW:820});
    for(let q=0;q<4;q++)BB.rrect(-110+q*90,50,60,34,12,q===beat?'#6ee678':'#2d4744','#fff',3);
    ctx.restore();
    if(next)BB.text('NEXT: '+next,cx,cy+150,34,'#fff',{stroke:5,maxW:900});
    if(note)BB.text(note,40,1048,22,'#cfe8e2',{align:'left'});
  }
  function paintThrow(lane,v,kind){
    const tire=kind==='tire',sx=tire?JR.x-40:JR.x-90,sy=tire?JR.y+170:JR.y-40;
    const P=L.throwPath(lane,v,sx,sy);if(!P)return null;
    const paint=()=>{ctx.save();ctx.globalAlpha=P.a;ctx.translate(P.x,P.y-(tire?62*P.sc:0));ctx.scale(P.sc,P.sc);
      const TT=L.throwTurn(lane,v,kind);ctx.rotate(TT.rot);ctx.scale(TT.sx,1);
      if(tire)M.drawTireRoll(v*16);else M.drawJunk(kind,v);ctx.restore()};
    return {P,paint,tire};
  }
  function pathTrace(lane,kind,col){
    const tire=kind==='tire',sx=tire?JR.x-40:JR.x-90,sy=tire?JR.y+170:JR.y-40;
    ctx.beginPath();let on=0;
    for(let v=0;v<=1.35;v+=.03){
      const P=L.throwPath(lane,v,sx,sy);if(!P)continue;
      const x=P.x,y=P.y-(tire?62*P.sc:0);
      if(!on){ctx.moveTo(x,y);on=1}else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=col;ctx.lineWidth=5;ctx.stroke();
  }
  function save(name){const p=path.join(out,name);fs.writeFileSync(p,cv.toBuffer('image/png'));console.log('wrote',p);return p}

  // ---- three tire paths overlaid ----
  fightBG('JUMP! (rolling tire!)',2,'LEAN RIGHT!','v14.5.25  left / center / right tire lanes — hop from Jr, then a straight roll (offline fight HUD)');
  const cols={floorL:'#7ec8ff',floorC:'#ffe066',floorR:'#ff8adf'};
  const labs={floorL:'LEFT',floorC:'CENTER',floorR:'RIGHT'};
  for(const lane of L.TIRE_LANES){
    ctx.save();ctx.globalAlpha=.9;ctx.setLineDash([16,10]);pathTrace(lane,'tire',cols[lane]);ctx.setLineDash([]);ctx.restore();
    // hop mid + mid-roll + near camera
    for(const v of[L.TIRE_HOP*.5,.75,1.05]){
      const o=paintThrow(lane,v,'tire');if(!o)continue;
      ctx.save();ctx.globalAlpha=v<L.TIRE_HOP?.7:.95;o.paint();ctx.restore();
    }
    const mid=L.throwPath(lane,.75,JR.x-40,JR.y+170);
    BB.text(labs[lane],mid.x,Math.min(H-40,mid.y+40),28,cols[lane],{font:'Rammetto One',stroke:6});
  }
  save('tire_paths.png');

  // ---- socks mid-arc still + coverage measurement ----
  const sockSX=JR.x-90,sockSY=JR.y-40;
  let peak=null;
  const coverLog=[];
  for(let v=0;v<=1.4;v+=.01){
    const P=L.throwPath('left',v,sockSX,sockSY);if(!P)continue;
    const top=P.y-80*P.sc,bot=P.y+66*P.sc,left=P.x-32*P.sc,right=P.x+96*P.sc;
    const cue=!(right<CARD.x||left>CARD.x+CARD.w||bot<CARD.y||top>CARD.y+CARD.h);
    const upper=P.y<540||top<540;
    coverLog.push({v,x:P.x,y:P.y,sc:P.sc,top,bot,cue,upper});
    if(!peak||top<peak.top)peak={v,P,top,bot,cue,upper};
  }
  const covered=coverLog.filter(r=>r.cue);
  const inUpper=coverLog.filter(r=>r.upper&&r.v>0&&r.v<1);
  fs.writeFileSync(path.join(out,'socks_coverage.json'),JSON.stringify({peak,coveredCount:covered.length,firstCover:covered[0]||null,lastCover:covered[covered.length-1]||null,minTop:peak&&peak.top,minY:Math.min(...coverLog.map(r=>r.y)),card:CARD},null,2));
  console.log('SOCK COVERAGE: peak v='+peak.v.toFixed(2)+' y='+peak.P.y.toFixed(0)+' top='+peak.top.toFixed(0)+' sc='+peak.P.sc.toFixed(2)+' coversCue='+peak.cue+'  cue overlaps: '+(covered[0]?('v '+covered[0].v.toFixed(2)+'–'+covered[covered.length-1].v.toFixed(2)):'NONE')+'  mid-flight points in upper half: '+inUpper.length);

  fightBG('LEAN RIGHT!',2,'JUMP! (rolling tire!)','v14.5.25  sock mid-arc  v='+peak.v.toFixed(2)+'  y='+peak.P.y.toFixed(0)+'  top='+peak.top.toFixed(0)+'  (offline fight HUD)');
  // faint path
  ctx.save();ctx.globalAlpha=.7;ctx.setLineDash([10,8]);pathTrace('left','sock','#fff');ctx.setLineDash([]);ctx.restore();
  paintThrow('left',peak.v,'sock').paint();
  // outline the cue card so coverage is obvious
  ctx.save();ctx.strokeStyle='rgba(255,224,102,.85)';ctx.lineWidth=3;ctx.setLineDash([8,6]);
  ctx.strokeRect(CARD.x,CARD.y,CARD.w,CARD.h);ctx.setLineDash([]);
  BB.text(peak.cue?'sock overlaps the cue card':'sock does NOT overlap the cue card',W/2,H-36,28,peak.cue?'#6ee678':'#ff8adf',{font:'Rammetto One',stroke:6});
  save('socks_peak.png');

  // ---- frame writers for mp4s ----
  const tdir=path.join(out,'tire_lane_frames');fs.mkdirSync(tdir,{recursive:true});
  const sdir=path.join(out,'socks_frames');fs.mkdirSync(sdir,{recursive:true});
  const fps=24;

  // three consecutive tire throws, different lanes, normal speed
  // fight time: v=0..1.45 over 1.2*1.45 s (=1.74s) plus 8-frame gap
  let n=0;
  const throwDur=1.2*1.45,gap=8;
  for(let ti=0;ti<3;ti++){
    const lane=L.TIRE_LANES[ti];
    const frames=Math.round(throwDur*fps);
    for(let f=0;f<=frames;f++){
      const v=1.45*f/frames;
      fightBG('JUMP! (rolling tire!)',Math.min(3,(v*3)|0),'LEAN RIGHT!',
        'v14.5.25  throw '+(ti+1)+'/3  lane '+labs[lane]+'  v='+v.toFixed(2)+'  (offline fight HUD, normal speed)');
      const o=paintThrow(lane,v,'tire');
      if(o){o.paint();
        if(v>=1&&v<1.45){ctx.save();ctx.globalAlpha=clamp(1-(v-1)/.45,0,1);BB.text('BOING! JUMPED IT!',clamp(o.P.x,330,W-330),clamp(o.P.y-80,240,H-120),72,COL.yellow,{font:'Rammetto One',stroke:10,strokeCol:'#3a1040'});ctx.restore()}
      }
      const fp=path.join(tdir,'f_'+String(n).padStart(3,'0')+'.png');
      fs.writeFileSync(fp,cv.toBuffer('image/png'));n++;
    }
    for(let g=0;g<gap;g++){
      fightBG('JUMP! (rolling tire!)',3,'LEAN RIGHT!','v14.5.25  (offline fight HUD)');
      fs.writeFileSync(path.join(tdir,'f_'+String(n).padStart(3,'0')+'.png'),cv.toBuffer('image/png'));n++;
    }
  }
  console.log('wrote',n,'tire lane frames');

  // two sock throws, normal speed
  let sn=0;
  for(let ti=0;ti<2;ti++){
    const frames=Math.round(throwDur*fps);
    for(let f=0;f<=frames;f++){
      const v=1.45*f/frames;
      fightBG('LEAN RIGHT!',Math.min(3,(v*3)|0),'DUCK!',
        'v14.5.25  sock throw '+(ti+1)+'/2  v='+v.toFixed(2)+'  (offline fight HUD, normal speed)');
      const o=paintThrow('left',v,'sock');
      if(o){o.paint();
        if(v>=1&&v<1.45){ctx.save();ctx.globalAlpha=clamp(1-(v-1)/.45,0,1);BB.text('MISSED!',clamp(o.P.x,330,W-330),clamp(Math.min(o.P.y,H-160)-80,240,H-120),80,COL.yellow,{font:'Rammetto One',stroke:10,strokeCol:'#3a1040'});ctx.restore()}
      }
      fs.writeFileSync(path.join(sdir,'f_'+String(sn).padStart(3,'0')+'.png'),cv.toBuffer('image/png'));sn++;
    }
    for(let g=0;g<gap;g++){
      fightBG('LEAN RIGHT!',3,'DUCK!','v14.5.25  (offline fight HUD)');
      fs.writeFileSync(path.join(sdir,'f_'+String(sn).padStart(3,'0')+'.png'),cv.toBuffer('image/png'));sn++;
    }
  }
  console.log('wrote',sn,'sock frames');
})().catch(e=>{console.error(e);process.exit(1)});
