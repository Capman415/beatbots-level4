// Offline multi-timepoint scene: throws in front of Sprocket near endpoint (real throwPath + drawJunk)
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require('/tmp/cv/node_modules/@napi-rs/canvas');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
const out=process.argv[2]||'/workspace/previews/v14.5.18';fs.mkdirSync(out,{recursive:true});
const W=1920,H=1080,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,JR={x:1430,y:540},LCH={x:300,y:760};
const help=src.match(/const TIRE_LANES=[\s\S]*?DODGE_VO=\{[^}]*\};/)[0]+src.match(/const SAFE_Y=\d+,throwPath=[\s\S]*?fg:sc>=1\.7\|\|u>=\.4\}\};/)[0]+src.match(/const LANE_DIR=[\s\S]*?sx:kind==='bomb'\?1:1-\.16\*Math\.sin\(Math\.PI\*Math\.min\(u,1\)\)\}\};/)[0];
const L=new Function('W','H','clamp','lerp',help+';return{throwPath,throwTurn,throwLane}')(W,H,clamp,lerp);
const mb=src.slice(src.indexOf('  junkVol('),src.indexOf('  drawBlastRing('));
(async()=>{
  const sp=await loadImage(path.join(__dirname,'../assets/sprocket.png'));
  const jr=await loadImage(path.join(__dirname,'../assets/jr_a.png'));
  const frames=[.15,.45,.75,1.05];
  for(const lane of['left','right','floor']){
    const c=createCanvas(W,H),ctx=c.getContext('2d');
    const BB={rrect:(x,y,w,h,r,f,s,lw)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(f){ctx.fillStyle=f;ctx.fill()}if(s&&lw){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke()}}};
    const M=new Function('ctx','COL','BB','return new (class{'+mb+'})')(ctx,{ink:'#19191f'},BB);
    const tire=lane==='floor',junk=lane==='left'?'sock':lane==='right'?'chicken':'tire';
    const sx=tire?JR.x-40:(lane==='right'?JR.x+60:JR.x-90),sy=tire?JR.y+170:JR.y-40;
    ctx.fillStyle='#2b3140';ctx.fillRect(0,0,W,H);ctx.fillStyle='#3b3f47';ctx.fillRect(0,740,W,H-740);
    // Static Jr (back)
    const jh=500,jw=jh*jr.width/jr.height;ctx.drawImage(jr,JR.x-jw/2,JR.y-jh+80,jw,jh);
    // early throws (behind Sprocket)
    for(const v of frames.filter(v=>v<.4)){const P=L.throwPath(lane,v,sx,sy);if(!P||P.fg)continue;ctx.save();ctx.globalAlpha=P.a;ctx.translate(P.x,P.y-(tire?62*P.sc:0));ctx.scale(P.sc,P.sc);const TT=L.throwTurn(lane,v,tire?'tire':junk);ctx.rotate(TT.rot);ctx.scale(TT.sx,1);tire?M.drawTireRoll(v*16):M.drawJunk(junk,0);ctx.restore()}
    // Sprocket (middle) — where items used to vanish
    const sh=420,sw=sh*sp.width/sp.height;ctx.drawImage(sp,LCH.x-sw/2-40,LCH.y-sh+40,sw,sh);
    ctx.fillStyle='#ffe066';ctx.font='28px sans-serif';ctx.fillText('Sprocket',LCH.x-60,LCH.y+60);
    // late throws (FG — in front of Sprocket)
    for(const v of frames){const P=L.throwPath(lane,v,sx,sy);if(!P||!P.fg)continue;ctx.save();ctx.globalAlpha=P.a;ctx.translate(P.x,P.y-(tire?62*P.sc:0));ctx.scale(P.sc,P.sc);const TT=L.throwTurn(lane,v,tire?'tire':junk);ctx.rotate(TT.rot);ctx.scale(TT.sx,1);tire?M.drawTireRoll(v*16):M.drawJunk(junk,0);ctx.restore();ctx.fillStyle='#fff';ctx.font='22px sans-serif';ctx.fillText('v='+v+' FG',P.x-30,Math.min(H-20,P.y+20))}
    ctx.fillStyle='#fff';ctx.font='42px sans-serif';ctx.fillText('lane '+lane+' — late throws IN FRONT of Sprocket (offline)',40,60);
    fs.writeFileSync(out+'/scene_'+lane+'.png',c.toBuffer('image/png'));
    console.log('wrote scene_'+lane);
  }
  // assess choice letter color board (offline)
  {const c=createCanvas(1400,500),ctx=c.getContext('2d');ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,1400,500);
    const labs=[['SOFT / quiet','tiny quiet claps'],['WALKING pace','moderately slow'],['FAST / lively','keep up!']];
    labs.forEach((L,i)=>{const x=60+i*440;ctx.fillStyle='#1d3b38';ctx.strokeStyle='#50aaa0';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,120,400,260,24);ctx.fill();ctx.stroke();
      ctx.fillStyle='#ffe9a0';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText(L[0],x+200,230);ctx.fillStyle='#d7efe8';ctx.font='26px sans-serif';ctx.fillText(L[1],x+200,290)});
    ctx.fillStyle='#fff';ctx.font='32px sans-serif';ctx.textAlign='left';ctx.fillText('Assessment choice letters (v14.5.18 light gold on teal)',40,50);
    fs.writeFileSync(out+'/assess_choice_letters.png',c.toBuffer('image/png'));console.log('wrote assess_choice_letters')}
})();
