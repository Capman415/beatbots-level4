#!/usr/bin/env node
// Offline stills: progressive canister fill + grander blast stages (v14.5.19). Not GUI screenshots.
'use strict';
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
const out=process.argv[2]||'/workspace/previews/v14.5.19';fs.mkdirSync(out,{recursive:true});
const W=1920,H=1080,COL={ink:'#19191f'};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const Hlp=new Function('clamp','window',src.match(/const clapDyn=[\s\S]*?HIT_DMG=6;/)[0]+';return{clapDyn,dynFill,dynLevel,BLAST_R}')(clamp,{});

// Extract drawCans + drawBlastRing + junk helpers needed
const bodyStart=src.indexOf('  drawCans(X0,Y0,f,k,t,bt)');
const bodyEnd=src.indexOf('  /* shared POWER system');
const blastStart=src.indexOf('  drawBlastRing(x,y,R,u)');
const blastEnd=src.indexOf('  koIcon(ic,x,y,t)');
const cansCode=src.slice(bodyStart,bodyEnd);
const blastCode=src.slice(blastStart,blastEnd);

function makeRoom(ctx){
  const BB={rrect:(x,y,w,h,r,fill,stroke,lw)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||3;ctx.stroke()}},
    text:(str,x,y,sz,col,o={})=>{ctx.save();ctx.font=`${o.font==='Rammetto One'?'bold':''} ${sz}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';if(o.stroke){ctx.lineWidth=o.stroke;ctx.strokeStyle=o.strokeCol||'#1a1a1a';ctx.strokeText(str,x,y)}ctx.fillStyle=col;ctx.fillText(str,x,y,o.maxW);ctx.restore()},
    lg:(a,b,cols)=>{const g=ctx.createLinearGradient(0,a,0,b);cols.forEach((c,i)=>g.addColorStop(i/(cols.length-1),c));return g}};
  // minimal class with drawCans + drawBlastRing
  const Klass=new Function('ctx','COL','BB','clamp',`return class R{${cansCode}\n${blastCode}}`);
  return new (Klass(ctx,COL,BB,clamp))();
}

function bg(ctx,label){
  ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,W,H);
  // factory floor hint
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a2a38');g.addColorStop(1,'#0a1218');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<40;i++)ctx.fillRect(0,(i*37)%H,W,2);
  ctx.fillStyle='#ffe066';ctx.font='bold 36px sans-serif';ctx.fillText(label,40,50);
  ctx.fillStyle='#9fb0b8';ctx.font='22px sans-serif';ctx.fillText('offline render — not a GUI screenshot',40,90);
}

(async()=>{
  const roomStub=()=>{};
  // --- FILL STAGES contact sheet ---
  {
    const sheet=createCanvas(1920,1080),sctx=sheet.getContext('2d');
    sctx.fillStyle='#071018';sctx.fillRect(0,0,1920,1080);
    sctx.fillStyle='#ffe066';sctx.font='bold 40px sans-serif';sctx.fillText('v14.5.19 clap POWER — progressive amount fill (offline)',40,48);
    sctx.fillStyle='#9fb0b8';sctx.font='22px sans-serif';sctx.fillText('Each panel: N mezzo claps → dynFill. Soft/loud still change per-clap contribution; not clap speed.',40,86);
    const Ns=[0,1,2,3,4,6,8,10];
    for(let i=0;i<Ns.length;i++){
      const n=Ns[i],cw=450,ch=460,x=(i%4)*470+40,y=Math.floor(i/4)*480+120;
      const c=createCanvas(cw,ch),ctx=c.getContext('2d');
      ctx.fillStyle='#12202a';ctx.fillRect(0,0,cw,ch);
      const f=Hlp.dynFill(Array.from({length:n},()=>Hlp.clapDyn({lvl:.7})));
      const lv=Hlp.dynLevel(f);
      const room=makeRoom(ctx);
      room.drawCans(cw/2-140,80,f,0,1.2+i*.1,0);
      ctx.fillStyle='#fff';ctx.font='bold 28px sans-serif';ctx.textAlign='center';
      ctx.fillText(n+' clap'+(n===1?'':'s')+'  fill='+f.toFixed(2),cw/2,400);
      ctx.fillStyle=['#ffe066','#ff8adf','#7ef0ff'][lv];
      ctx.fillText(['p BLAST','mf BIG','f MEGA'][lv],cw/2,435);
      sctx.drawImage(c,x,y);
      sctx.strokeStyle='#2a3a44';sctx.lineWidth=3;sctx.strokeRect(x,y,cw,ch);
    }
    const p=path.join(out,'power_fill_stages.png');fs.writeFileSync(p,sheet.toBuffer('image/png'));console.log('wrote',p);
  }

  // --- BEFORE vs AFTER fill formula (same clap counts) ---
  {
    const oldFill=(ds)=>{if(!ds||!ds.length)return 0;let m=0;for(const d of ds)m+=d;m/=ds.length;return clamp(3*(.12+.88*m)*Math.min(1,ds.length/4),0,3)};
    const sheet=createCanvas(1600,900),sctx=sheet.getContext('2d');
    sctx.fillStyle='#071018';sctx.fillRect(0,0,1600,900);
    sctx.fillStyle='#ffe066';sctx.font='bold 36px sans-serif';sctx.fillText('Fill formula: BEFORE (n/4 chunks) vs AFTER (cumulative amount)',40,48);
    const rows=[['soft×1',.5,1],['soft×2',.5,2],['soft×4',.5,4],['soft×8',.5,8],['mezzo×3',.7,3],['mezzo×6',.7,6],['loud×3',.95,3],['loud×6',.95,6]];
    rows.forEach((row,i)=>{
      const [lab,lvl,n]=row;const ds=Array.from({length:n},()=>Hlp.clapDyn({lvl}));
      const a=oldFill(ds),b=Hlp.dynFill(ds);const y=100+i*90;
      sctx.fillStyle='#9fb0b8';sctx.font='bold 26px sans-serif';sctx.fillText(lab,40,y+28);
      const bar=(x0,val,col)=>{sctx.fillStyle='#1a2830';sctx.fillRect(x0,y,520,40);sctx.fillStyle=col;sctx.fillRect(x0,y,520*(val/3),40);sctx.strokeStyle='#eee4cc';sctx.strokeRect(x0,y,520,40);sctx.fillStyle='#fff';sctx.font='20px sans-serif';sctx.fillText(val.toFixed(2),x0+8,y+28)};
      bar(220,a,'#ff8a5a');bar(780,b,'#6ee678');
    });
    sctx.fillStyle='#ff8a5a';sctx.font='22px sans-serif';sctx.fillText('BEFORE (chunked)',220,80);
    sctx.fillStyle='#6ee678';sctx.fillText('AFTER (amount)',780,80);
    const p=path.join(out,'power_fill_before_after.png');fs.writeFileSync(p,sheet.toBuffer('image/png'));console.log('wrote',p);
  }

  // --- BLAST stages contact sheet ---
  {
    const sheet=createCanvas(1920,1100),sctx=sheet.getContext('2d');
    sctx.fillStyle='#071018';sctx.fillRect(0,0,1920,1100);
    sctx.fillStyle='#ffe066';sctx.font='bold 36px sans-serif';sctx.fillText('v14.5.19 grander blast (stage stable — no VS zoom). Offline render.',40,48);
    const LVs=[0,1,2], Us=[.15,.4,.7,1.0];
    LVs.forEach((lv,li)=>{
      Us.forEach((u,ui)=>{
        const cw=450,ch=420,x=ui*470+40,y=li*340+90;
        const c=createCanvas(cw,ch),ctx=c.getContext('2d');
        const g=ctx.createLinearGradient(0,0,0,ch);g.addColorStop(0,'#1a2a38');g.addColorStop(1,'#0a1218');ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch);
        // stub Jr silhouette
        ctx.fillStyle='#3a2a44';ctx.beginPath();ctx.ellipse(cw/2,ch/2+40,70,90,0,0,7);ctx.fill();
        const room=makeRoom(ctx);
        room.drawBlastRing(cw/2,ch/2,Hlp.BLAST_R[lv],u);
        ctx.fillStyle='#fff';ctx.font='bold 24px sans-serif';ctx.textAlign='center';
        ctx.fillText(['BLAST','BIG BLAST','MEGA BLAST'][lv]+'  u='+u.toFixed(2),cw/2,36);
        sctx.drawImage(c,x,y);
        sctx.strokeStyle='#2a3a44';sctx.lineWidth=3;sctx.strokeRect(x,y,cw,ch);
      });
    });
    const p=path.join(out,'blast_stages.png');fs.writeFileSync(p,sheet.toBuffer('image/png'));console.log('wrote',p);
  }

  // --- Single MEGA peak frame ---
  {
    const c=createCanvas(W,H),ctx=c.getContext('2d');bg(ctx,'MEGA BLAST peak — camera stable (offline)');
    // fake Jr
    try{const jr=await loadImage(path.join(__dirname,'../assets/jr_a.png'));ctx.drawImage(jr,1430-180,540-280,360,420)}catch(e){
      ctx.fillStyle='#5a3a6a';ctx.fillRect(1300,300,260,360)}
    const room=makeRoom(ctx);
    room.drawBlastRing(1430,450,Hlp.BLAST_R[2],.55);
    ctx.fillStyle='#7ef0ff';ctx.font='bold 100px sans-serif';ctx.textAlign='center';
    ctx.strokeStyle='#1a1a1a';ctx.lineWidth=12;ctx.strokeText('MEGA BLAST!',W/2,700);ctx.fillText('MEGA BLAST!',W/2,700);
    ctx.fillStyle='#9fb0b8';ctx.font='28px sans-serif';ctx.fillText('No VS split / no zoom-in action scene — explosion is the payoff',W/2,780);
    const p=path.join(out,'blast_mega_peak.png');fs.writeFileSync(p,c.toBuffer('image/png'));console.log('wrote',p);
  }

  console.log('done',out);
})().catch(e=>{console.error(e);process.exit(1)});
