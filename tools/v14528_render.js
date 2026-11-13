#!/usr/bin/env node
// v14.5.28 offline assess chrome previews (not a live GUI / mic recording).
'use strict';
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage,GlobalFonts}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');
const ROOT=path.join(__dirname,'..');
const OUT=process.argv[2]||'/workspace/previews/v14.5.28/final';
fs.mkdirSync(OUT,{recursive:true});
const W=1920,H=1080;
const COL={ink:'#19191f',cream:'#e8e2cd',teal:'#142826',teal2:'#50aaa0',green:'#3fb45a',yellow:'#ffe066',red:'#e65046',white:'#fff'};
try{GlobalFonts.registerFromPath(path.join(ROOT,'assets/RammettoOne-Regular.ttf'),'Rammetto One')}catch(e){console.warn(e.message)}
try{GlobalFonts.registerFromPath(path.join(ROOT,'assets/LilitaOne-Regular.ttf'),'Lilita One')}catch(e){console.warn(e.message)}

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
function panel(ctx,x,y,w,h,rad){
  rrect(ctx,x-6,y-6,w+12,h+12,rad+6,lg(ctx,y-6,y+h+6,['#f4f7f6','#9aa6a4','#e2e8e6','#6c7775']),'rgba(20,30,30,.75)',2.5);
  rrect(ctx,x,y,w,h,rad,lg(ctx,y,y+h,['#fdf8ea','#e9e2cc','#c9bfa3']));
  rrect(ctx,x+18,y+16,w-36,h-32,rad-8,lg(ctx,y+16,y+h-16,['#0e1f1d','#173230','#11302c']),'#50aaa0',5);
}
function creamBtn(ctx,x,y,w,h,label,style){
  const cols=style==='green'?['#a6f5ae','#3fb45a']:['#fbf6e6','#e8e2cd'];
  rrect(ctx,x,y,w,h,28,lg(ctx,y,y+h,cols),'#1a1a1a',4);
  text(ctx,label,x+w/2,y+h/2,style==='green'?40:28,style==='green'?'#fff':'#19191f',{font:'Rammetto One',stroke:style==='green'?6:4,maxW:w-24});
}
function hamburger(ctx){
  const x=28,y=26,s=72;
  rrect(ctx,x,y,s,s,16,lg(ctx,y,y+s,['#fbf6e6','#e8e2cd']),'#1a1a1a',3);
  ctx.strokeStyle='#19191f';ctx.lineWidth=5;ctx.lineCap='round';
  for(const yy of [y+22,y+36,y+50]){ctx.beginPath();ctx.moveTo(x+18,yy);ctx.lineTo(x+s-18,yy);ctx.stroke()}
}
function banner(ctx, title, sub){
  const bw=1480,bh=110,bx=(W-bw)/2,by=40,mid=by+16+(bh-32)/2;
  panel(ctx,bx,by,bw,bh,28);
  text(ctx,title,W/2,mid-18,36,COL.yellow,{font:'Rammetto One',stroke:5});
  text(ctx,sub,W/2,mid+22,28,'#cfe8e2',{stroke:4});
  return {bx,by,bw,bh,mid};
}
function pips(ctx, done){
  for(let i=0;i<8;i++){const x=260+i*175,y=155,on=i<done;
    rrect(ctx,x,y,150,18,9,on?'#6ee678':'#2a3a38','#fff',2)}
}
function skip(ctx){creamBtn(ctx,W/2-130,974,260,70,'SKIP Q')}

(async()=>{
  const rhythmSrc=fs.readFileSync(path.join(ROOT,'js/rhythm.js'),'utf8');
  const R=(()=>{const R={BEATS:{w:4,h:2,q:1,e:1,s:1,r:1}};
    const a=rhythmSrc.indexOf('R.CHOICE='),b=rhythmSrc.indexOf('\n// ---------- extra sounds');
    if(a<0||b<0) throw new Error('could not extract rhythm helpers');
    new Function('R','ctx',rhythmSrc.slice(a,b))(R, createCanvas(1,1).getContext('2d'));
    return R})();

  const c=createCanvas(W,H),ctx=c.getContext('2d');

  // hear-a-rhythm (hearPick, after listen, with REPLAY + notation cards)
  ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,W,H);
  hamburger(ctx);
  const bar=banner(ctx,'CHECKPOINT  5 / 8','Score  2  ·  need 6 of 8 to unlock Static Jr.');
  pips(ctx,4);
  text(ctx,'Tap the rhythm you just heard.',W/2,260,40,'#fff',{font:'Rammetto One',stroke:7,maxW:1700});
  creamBtn(ctx,W/2-160,320,320,64,'REPLAY RHYTHM');
  const seqs=[['q','s','e','q'],['e','e','q','q'],['r','q','q','q']];
  const n=seqs.length,C=R.CHOICE,cbw=C.bw,cbh=C.bh,gap=C.gap,tot=n*cbw+(n-1)*gap,x0=W/2-tot/2,cy=C.y;
  seqs.forEach((seq,i)=>{const x=x0+i*(cbw+gap);
    rrect(ctx,x,cy,cbw,cbh,28,lg(ctx,cy,cy+cbh,['#1b3a36','#142826']),'#8a806b',4);
    R.rhythmCard(x,cy,cbw,cbh,seq,{ink:'#19191f',letter:String.fromCharCode(65+i),g:ctx});});
  skip(ctx);
  save(c,'assess_hear_rhythm.png');

  // 2x crop of the checkpoint bar (include a little margin + hamburger for clearance check)
  {
    const mx=80,my=20,sx=Math.min(bar.bx,28)-mx,sy=bar.by-my,sw=Math.max(bar.bx+bar.bw,28+72)-sx+mx,sh=bar.bh+my*2+10;
    const z=2,c2=createCanvas(Math.round(sw*z),Math.round(sh*z)),g2=c2.getContext('2d');
    g2.imageSmoothingEnabled=false;
    g2.drawImage(c,sx,sy,sw,sh,0,0,c2.width,c2.height);
    // guide: vertical midline of the stage, in crop space
    save(c2,'assess_checkpoint_bar_2x.png');
    console.log('bar crop stage',sx,sy,sw,sh,'midX',W/2,'barCenter',bar.bx+bar.bw/2,'text mid',bar.mid);
  }

  // see-a-rhythm / answer-choice (vocab choice cards — same banner + skip chrome)
  ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,W,H);
  hamburger(ctx);
  banner(ctx,'CHECKPOINT  2 / 8','Score  1  ·  need 6 of 8 to unlock Static Jr.');
  pips(ctx,1);
  text(ctx,'What does PIANO mean?',W/2,260,40,'#fff',{font:'Rammetto One',stroke:7,maxW:1700});
  const choices=[{lab:'SOFT / quiet'},{lab:'SLOW'},{lab:'LOUD'}];
  const cn=choices.length,bw=Math.min(420,Math.floor(1500/cn)-24),cg=24,ctot=cn*bw+(cn-1)*cg,cx0=W/2-ctot/2;
  choices.forEach((ch,i)=>{const x=cx0+i*(bw+cg);
    rrect(ctx,x,420,bw,220,28,lg(ctx,420,640,['#1b3a36','#142826']),'#8a806b',4);
    text(ctx,ch.lab,x+bw/2,530,ch.lab.length>12?32:44,'#ffe9a0',{font:'Rammetto One',stroke:6,maxW:bw-24});});
  skip(ctx);
  save(c,'assess_see_choice.png');

  console.log('OUT',OUT);
})().catch(e=>{console.error(e);process.exit(1)});
