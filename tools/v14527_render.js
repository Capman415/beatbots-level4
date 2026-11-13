#!/usr/bin/env node
// v14.5.27 offline title-logo previews (not a live GUI / mic recording).
'use strict';
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage,GlobalFonts}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');
const ROOT=path.join(__dirname,'..');
const OUT=process.argv[2]||'/workspace/previews/v14.5.27/final';
fs.mkdirSync(OUT,{recursive:true});
const W=1920,H=1080;
const COL={ink:'#19191f',cream:'#e8e2cd',teal:'#142826',teal2:'#50aaa0',green:'#3fb45a',yellow:'#ffe066',red:'#e65046',white:'#fff'};
try{GlobalFonts.registerFromPath(path.join(ROOT,'assets/RammettoOne-Regular.ttf'),'Rammetto One')}catch(e){console.warn(e.message)}
try{GlobalFonts.registerFromPath(path.join(ROOT,'assets/LilitaOne-Regular.ttf'),'Lilita One')}catch(e){console.warn(e.message)}

function checker(w,h,s=16){
  const c=createCanvas(w,h),g=c.getContext('2d');
  for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){
    g.fillStyle=((x/s+y/s)&1)?'#303030':'#d2d2d2';g.fillRect(x,y,s,s);
  }
  return c;
}
function text(ctx,t,x,y,sz,col,o={}){
  ctx.save();ctx.font=`${sz}px '${o.font||'Lilita One'}'`;ctx.textAlign=o.align||'center';ctx.textBaseline='middle';
  if(o.maxW){const m=ctx.measureText(t).width;if(m>o.maxW){sz=sz*o.maxW/m;ctx.font=`${sz}px '${o.font||'Lilita One'}'`}}
  if(o.stroke){ctx.lineJoin='round';ctx.lineWidth=o.stroke;ctx.strokeStyle=o.strokeCol||'#000';ctx.strokeText(t,x,y)}
  ctx.fillStyle=col;ctx.fillText(t,x,y);ctx.restore();
}
function rrect(ctx,x,y,w,h,r,fill,stroke,lw){
  ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||3;ctx.stroke()}}
function lg(ctx,y0,y1,stops){const g=ctx.createLinearGradient(0,y0,0,y1);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));return g}
function save(c,name){fs.writeFileSync(path.join(OUT,name),c.toBuffer('image/png'));console.log('wrote',name,c.width+'x'+c.height)}

// Matches TitleScene (v14.5.27): origin 300, logo h=372 at y=-210, code shadow, subtitle 254, START 705
function drawTitle(ctx, logo, titleBg, scale){
  if(titleBg)ctx.drawImage(titleBg,0,0,W,H);
  else{ctx.fillStyle='#2a241c';ctx.fillRect(0,0,W,H)}
  const s=scale==null?1:scale;
  ctx.save();ctx.translate(W/2,300);ctx.scale(s,s);
  // warm glow
  const g=ctx.createRadialGradient(0,-24,0,0,-24,700);g.addColorStop(0,'rgba(255,220,150,0.22)');g.addColorStop(1,'rgba(255,220,150,0)');
  ctx.fillStyle=g;ctx.fillRect(-700,-724,1400,1400);
  if(logo){
    const h=372,w=logo.width*h/logo.height;
    ctx.save();ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=32;ctx.shadowOffsetY=14;
    ctx.drawImage(logo,-w/2,-210,w,h);ctx.restore();
  }
  // subtitle (approximate Rammetto plaque; close enough for layout/overlap checks)
  text(ctx,'LEVEL 4: THE RHYTHM WAREHOUSE',0,254,70,COL.yellow,{font:'Rammetto One',stroke:8,maxW:1500});
  ctx.restore();
  // START
  const by=705;rrect(ctx,W/2-260,by,520,160,28,lg(ctx,by,by+160,['#a6f5ae','#3fb45a']),'#1a1a1a',4);
  text(ctx,'START',W/2,by+80,80,'#fff',{font:'Rammetto One',stroke:6});
  // footer + robot standing room
  rrect(ctx,W/2-560,1018,1120,50,25,'rgba(15,25,24,.7)');
  text(ctx,'Best on a big screen. Tap full screen (top right) for the whole board.',W/2,1045,28,'#fff',{stroke:4});
}

function letterbox(src,vw,vh){
  const out=createCanvas(vw,vh),g=out.getContext('2d');
  g.fillStyle='#000';g.fillRect(0,0,vw,vh);
  const sc=Math.min(vw/W,vh/H),ox=(vw-W*sc)/2,oy=(vh-H*sc)/2;
  g.drawImage(src,ox,oy,W*sc,H*sc);
  g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=2;g.strokeRect(ox+1,oy+1,W*sc-2,H*sc-2);
  return out;
}

(async()=>{
  let titleBg,logo;
  try{titleBg=await loadImage(path.join(ROOT,'assets/v2/title_bg.jpg'))}catch(e){console.warn('no title_bg',e.message)}
  try{logo=await loadImage(path.join(ROOT,'assets/v2/logo.webp'))}catch(e){
    try{logo=await loadImage(path.join(ROOT,'assets/v2/logo.png'))}catch(e2){console.warn('no logo',e2.message)}
  }
  if(!logo)throw new Error('logo asset missing');

  const c=createCanvas(W,H),ctx=c.getContext('2d');
  drawTitle(ctx,logo,titleBg,1);
  save(c,'title_screen.png');

  // ease.back overshoot (~1.1017) — antenna must stay fully on the 1920x1080 stage
  const cPeak=createCanvas(W,H),pctx=cPeak.getContext('2d');
  drawTitle(pctx,logo,titleBg,1.1017);
  save(cPeak,'title_screen_overshoot.png');

  for(const [vw,vh,name] of [[1024,576,'title_16x9_1024x576.png'],[1280,800,'title_16x10_1280x800.png'],[1024,768,'title_4x3_1024x768.png'],[1280,560,'title_chrome_1280x560.png']]){
    save(letterbox(c,vw,vh),name);
    save(letterbox(cPeak,vw,vh),name.replace('.png','_overshoot.png'));
  }

  // 2x logo close-up over dark and over the title background (plus checker)
  const lh=744,lw=logo.width*lh/logo.height, pad=80;
  const cw=Math.ceil(lw+pad*2),ch=Math.ceil(lh+pad*2+20);
  function logoClose(bgDraw,name){
    const lc=createCanvas(cw,ch),g=lc.getContext('2d');
    bgDraw(g,cw,ch);
    g.save();g.shadowColor='rgba(0,0,0,.4)';g.shadowBlur=40;g.shadowOffsetY=18;
    g.drawImage(logo,(cw-lw)/2,pad,lw,lh);g.restore();
    save(lc,name);
  }
  logoClose((g,w,h)=>{g.fillStyle='#121016';g.fillRect(0,0,w,h)},'logo_2x_dark.png');
  logoClose((g,w,h)=>{
    if(titleBg){
      // crop the warehouse region behind the on-stage logo and scale to the close-up
      const sx=W/2-lw/2,sy=90-20;
      g.drawImage(titleBg,sx,sy,lw+40,lh+40,0,0,w,h);
    }else{g.fillStyle='#3a3228';g.fillRect(0,0,w,h)}
  },'logo_2x_title_bg.png');
  logoClose((g,w,h)=>{g.drawImage(checker(w,h,20),0,0)},'logo_2x_checker.png');

  // native-resolution checker / dark (1x asset)
  const nc=createCanvas(logo.width,logo.height),ng=nc.getContext('2d');
  ng.drawImage(checker(logo.width,logo.height,16),0,0);ng.drawImage(logo,0,0);
  save(nc,'logo_native_checker.png');
  const nd=createCanvas(logo.width,logo.height),ndg=nd.getContext('2d');
  ndg.fillStyle='#121016';ndg.fillRect(0,0,logo.width,logo.height);ndg.drawImage(logo,0,0);
  save(nd,'logo_native_dark.png');

  // layout numbers for the log
  const restTop=90,restBot=90+372,peakTop=300+(90-300)*1.1017;
  console.log('layout restTop',restTop,'restBot',restBot,'peakTop',peakTop.toFixed(1),'subtitle cy',554,'START',705,'robots',1010);
  console.log('logo asset',logo.width+'x'+logo.height);

  // --- assessment: real R.rhythmCard + equal-size choice cards ---
  const rhythmSrc=fs.readFileSync(path.join(ROOT,'js/rhythm.js'),'utf8');
  const assessSrc=fs.readFileSync(path.join(ROOT,'js/rooms/assess.js'),'utf8');
  const R=(()=>{const R={BEATS:{w:4,h:2,q:1,e:1,s:1,r:1}};
    const a=rhythmSrc.indexOf('R.CHOICE='),b=rhythmSrc.indexOf('\n// ---------- extra sounds');
    if(a<0||b<0) throw new Error('could not extract rhythm helpers');
    new Function('R','ctx',rhythmSrc.slice(a,b))(R,ctx);
    return R})();
  function panel(x,y,w,h,rad){
    rrect(ctx,x-6,y-6,w+12,h+12,rad+6,lg(ctx,y-6,y+h+6,['#f4f7f6','#9aa6a4','#e2e8e6','#6c7775']),'rgba(20,30,30,.75)',2.5);
    rrect(ctx,x,y,w,h,rad,lg(ctx,y,y+h,['#fdf8ea','#e9e2cc','#c9bfa3']));
    rrect(ctx,x+18,y+16,w-36,h-32,rad-8,lg(ctx,y+16,y+h-16,['#0e1f1d','#173230','#11302c']),'#50aaa0',5);
  }
  function creamBtn(x,y,w,h,label,style){
    const cols=style==='green'?['#a6f5ae','#3fb45a']:['#fbf6e6','#e8e2cd'];
    rrect(ctx,x,y,w,h,28,lg(ctx,y,y+h,cols),'#1a1a1a',4);
    text(ctx,label,x+w/2,y+h/2,style==='green'?40:36,style==='green'?'#fff':'#19191f',{font:'Rammetto One',stroke:style==='green'?6:4,maxW:w-24});
  }
  function drawHearRow(title,seqs,name){
    ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,W,H);
    panel(124,40,1480,110,28);
    text(ctx,title,W/2,78,36,COL.yellow,{font:'Rammetto One',stroke:5});
    text(ctx,'Tap the rhythm you just heard.',W/2,260,40,'#fff',{font:'Rammetto One',stroke:7,maxW:1700});
    creamBtn(W/2-160,320,320,64,'REPLAY RHYTHM');
    const n=seqs.length,C=R.CHOICE,bw=C.bw,bh=C.bh,gap=C.gap,tot=n*bw+(n-1)*gap,x0=W/2-tot/2,y=C.y;
    seqs.forEach((seq,i)=>{const x=x0+i*(bw+gap);
      rrect(ctx,x,y,bw,bh,28,lg(ctx,y,y+bh,['#1b3a36','#142826']),'#8a806b',4);
      R.rhythmCard(x,y,bw,bh,seq,{ink:'#19191f',letter:String.fromCharCode(65+i)});});
    creamBtn(W-300,24,260,70,'SKIP Q');
    save(c,name);
  }
  // classroom photo trio: A q-s-e-q, B ti-ti + quarters, C rest-first
  drawHearRow('CHECKPOINT  5 / 8',[['q','s','e','q'],['e','e','q','q'],['r','q','q','q']],'assess_trio_qseq_photo.png');
  // 2x close-up of those three equal cards
  {
    const C=R.CHOICE,bw=C.bw,bh=C.bh,gap=C.gap,tot=3*bw+2*gap,x0=W/2-tot/2,y=C.y;
    const z=2,cw=Math.round(tot*z)+40,ch=Math.round(bh*z)+40;
    const c2=createCanvas(cw,ch),g2=c2.getContext('2d');
    g2.imageSmoothingEnabled=false;
    g2.drawImage(c,x0-10,y-10,tot+20,bh+20,0,0,cw,ch);
    fs.writeFileSync(path.join(OUT,'assess_trio_2x.png'),c2.toBuffer('image/png'));
    console.log('wrote assess_trio_2x.png',cw+'x'+ch);
  }
  drawHearRow('DENSEST  ·  TIKA-TIKA ×4',[['s','s','s','s'],['s','s','s','s'],['s','s','s','s']],'assess_dense_ssss.png');
  drawHearRow('DENSE MIXED',[['q','s','e','q'],['s','e','s','e'],['e','s','e','s']],'assess_dense_mixed.png');
  // graded reveal at the shared scale
  ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,W,H);
  panel(124,40,1480,110,28);
  text(ctx,'CHECKPOINT  5 / 8',W/2,78,36,COL.yellow,{font:'Rammetto One',stroke:5});
  text(ctx,'GOT IT!',W/2,400,72,COL.green,{font:'Rammetto One',stroke:10});
  text(ctx,'Heard rhythm:',W/2,500,34,'#ffe9a0',{font:'Rammetto One',stroke:6});
  R.rhythmCard(W/2-480,560,960,280,['q','s','e','q'],{ink:'#19191f',s:R.choiceScale()});
  save(c,'assess_reveal.png');

  // --- result screens (pass + fail), matching assess.js v14.5.27 layout ---
  function drawResult(passed,name){
    ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,W,H);
    panel(124,40,1480,110,28);
    text(ctx,'CHECKPOINT  8 / 8',W/2,78,36,COL.yellow,{font:'Rammetto One',stroke:5});
    text(ctx,passed?'Score  6  ·  need 6 of 8 to unlock Static Jr.':'Score  4  ·  need 6 of 8 to unlock Static Jr.',W/2,118,28,'#cfe8e2',{stroke:4});
    for(let i=0;i<8;i++){const x=260+i*175,y=155,done=passed?i<8:i<4;
      rrect(ctx,x,y,150,18,9,done?'#6ee678':'#2a3a38','#fff',2)}
    const pipBot=173,pad=56,pw=1400,ph=560,px=(W-pw)/2,availT=pipBot+40,availB=H-48,py=Math.round((availT+availB)/2-ph/2);
    panel(px,py,pw,ph,40);
    const cx=W/2,titleY=py+pad+50,scoreY=titleY+100,subY=scoreY+62,btnH=120,btnY=py+ph-pad-btnH,priW=540,secW=420,gap=36,row=priW+gap+secW,bx=cx-row/2;
    text(ctx,passed?'YOU PASSED!':'TRY AGAIN',cx,titleY,72,passed?COL.green:COL.yellow,{font:'Rammetto One',stroke:10});
    text(ctx,passed?'Class score: 6 / 8':'Class score: 4 / 8',cx,scoreY,48,'#fff',{stroke:6});
    text(ctx,passed?'Delivery bay unlocked. Ready for Static Jr.!':'Need 6 correct. Tap RETRY for another run.',cx,subY,32,COL.yellow,{stroke:4,maxW:pw-2*pad});
    creamBtn(bx,btnY,priW,btnH,passed?'FIGHT STATIC JR.!':'RETRY CHECKPOINT','green');
    creamBtn(bx+priW+gap,btnY,secW,btnH,'ROOM MAP');
    save(c,name);
    console.log('result',name,'panel',px,py,pw,ph,'btns',bx,btnY,priW,secW,'pipBot',pipBot,'gap',py-pipBot);
  }
  drawResult(true,'assess_result_pass.png');
  drawResult(false,'assess_result_fail.png');

  console.log('OUT',OUT);
})().catch(e=>{console.error(e);process.exit(1)});
