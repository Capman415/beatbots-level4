#!/usr/bin/env node
// v14.5.26 offline previews (not a live GUI / mic recording).
'use strict';
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage,GlobalFonts}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');
const ROOT=path.join(__dirname,'..');
const OUT=process.argv[2]||'/workspace/previews/v14.5.26/final';
fs.mkdirSync(OUT,{recursive:true});
const W=1920,H=1080;
const COL={ink:'#19191f',cream:'#e8e2cd',teal:'#142826',teal2:'#50aaa0',green:'#3fb45a',yellow:'#ffe066',red:'#e65046',white:'#fff'};
const MENU_INK='#0d0c22',MENU_MUTED='#6b6a80',MENU_BG='#f6f5f2',MENU_ACCENT='#0e9a6e';
try{GlobalFonts.registerFromPath(path.join(ROOT,'assets/RammettoOne-Regular.ttf'),'Rammetto One')}catch(e){console.warn(e.message)}
try{GlobalFonts.registerFromPath(path.join(ROOT,'assets/LilitaOne-Regular.ttf'),'Lilita One')}catch(e){console.warn(e.message)}

function make(ctx){
  const BB={ctx,COL,W,H,t:8,hits:[]};
  BB.lg=(y0,y1,stops)=>{const g=ctx.createLinearGradient(0,y0,0,y1);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));return g};
  BB.rrect=(x,y,w,h,r,f,s,lw)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(f){ctx.fillStyle=f;ctx.fill()}if(s){ctx.strokeStyle=s;ctx.lineWidth=lw||3;ctx.stroke()}};
  BB.well=(x,y,w,h,r)=>{BB.rrect(x,y,w,h,r,BB.lg(y,y+h,['#0e1f1d','#173230','#11302c']),COL.teal2,5);
    ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));ctx.clip();ctx.fillStyle=BB.lg(y,y+22,['rgba(0,0,0,.35)','rgba(0,0,0,0)']);ctx.fillRect(x,y,w,22);ctx.restore()};
  BB.bevel=(x,y,w,h,r,cols=['#fdf8ea','#e9e2cc','#c9bfa3'])=>{
    ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=18;ctx.shadowOffsetY=8;
    BB.rrect(x-4,y-4,w+8,h+8,r+4,BB.lg(y-4,y+h+4,['#f4f7f6','#9aa6a4','#e2e8e6','#6c7775']));ctx.restore();
    BB.rrect(x-4,y-4,w+8,h+8,r+4,null,'rgba(20,30,30,.75)',2.5);
    BB.rrect(x,y,w,h,r,BB.lg(y,y+h,cols));
    ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));ctx.clip();
    BB.rrect(x+2,y+2,w-4,h-4,r,null,'rgba(255,255,255,.75)',3);ctx.restore()};
  BB.rivet=(x,y,s=3.4)=>{ctx.fillStyle='rgba(40,30,15,.35)';ctx.beginPath();ctx.arc(x+s*.25,y+s*.4,s*1.05,0,7);ctx.fill();ctx.fillStyle=BB.lg(y-s,y+s,['#ffffff','#a9b3b1','#5d6866']);ctx.beginPath();ctx.arc(x,y,s,0,7);ctx.fill();ctx.strokeStyle='rgba(20,30,30,.6)';ctx.lineWidth=1.5;ctx.stroke()};
  BB.panel=(x,y,w,h,r=30)=>{BB.bevel(x,y,w,h,r);const ix=Math.max(14,r*.95),iy=8.5;for(const [rx,ry] of[[x+ix,y+iy],[x+w-ix,y+iy],[x+ix,y+h-iy],[x+w-ix,y+h-iy]])BB.rivet(rx,ry);BB.well(x+18,y+16,w-36,h-32,r-8)};
  BB.text=(t,x,y,sz,col,o={})=>{ctx.save();ctx.font=`${sz}px '${o.font||'Lilita One'}'`;ctx.textAlign=o.align||'center';ctx.textBaseline='middle';
    if(o.maxW){const m=ctx.measureText(t).width;if(m>o.maxW){sz=sz*o.maxW/m;ctx.font=`${sz}px '${o.font||'Lilita One'}'`}}
    if(o.stroke){ctx.lineJoin='round';ctx.lineWidth=o.stroke;ctx.strokeStyle=o.strokeCol||'#000';ctx.strokeText(t,x,y)}
    ctx.fillStyle=col;ctx.fillText(t,x,y);ctx.restore()};
  BB.plaque=(cx,cy,w,h,txt,size,col='#28403c',o={})=>{const x=cx-w/2,y=cy-h/2,r=o.r??12;BB.bevel(x,y,w,h,r,o.cols||['#fdf8ea','#ecdcb8','#caa77a']);BB.text(txt,cx,cy+1,size,col,{font:o.font||'Rammetto One',maxW:w-30,stroke:o.stroke})};
  BB.glow=(x,y,r,col,a=1)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col.replace('A',String(a)));g.addColorStop(1,col.replace('A','0'));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r)};
  BB.beatPills=(cx,y,lit)=>{const n=4,pw=76,gap=16,tot=n*pw+(n-1)*gap,x0=cx-tot/2;
    for(let i=0;i<n;i++){const x=x0+i*(pw+gap),on=lit[i];BB.rrect(x,y-38,pw,76,18,on?COL.green:'#2a3a38','#fff',3)}};
  BB.micIcon=(x,y,s=72,mode)=>{const cx=x+s/2,cy=y+s/2,bad=mode==='bad',pulse=mode==='pulse';
    if(pulse)BB.glow(cx,cy,s*1.05,'rgba(110,230,120,A)',.55);
    BB.bevel(x,y,s,s,20);BB.well(x+8,y+8,s-16,s-16,14);
    const col=bad?'#ff9c8a':pulse?COL.yellow:'#d8efe9';
    ctx.save();ctx.translate(cx,cy-2);ctx.fillStyle=col;ctx.strokeStyle=bad?'#e65046':COL.ink;ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';
    ctx.beginPath();ctx.roundRect(-9,-16,18,24,9);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-13,2);ctx.quadraticCurveTo(-13,16,0,16);ctx.quadraticCurveTo(13,16,13,2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,16);ctx.lineTo(0,22);ctx.moveTo(-8,22);ctx.lineTo(8,22);ctx.stroke();
    if(bad){ctx.strokeStyle='#e65046';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-18,-20);ctx.lineTo(18,22);ctx.stroke()}
    ctx.restore()};
  BB.micMeterBars=(x,y,lvl=.45)=>{const n=10;for(let i=0;i<n;i++){const on=i<lvl*n,bx=x+i*20;const c=on?(i<4?'#6ee678':i<7?'#ffe066':'#ff7b5c'):'#c8c6bf';
    const by=y+(9-i)*3,bh=64-(9-i)*3;BB.rrect(bx,by,14,bh,4,c)}};
  BB.MENU_BTN={x:W-100,y:26,s:72};
  BB.drawMenuBtn=(open)=>{const{x,y,s}=BB.MENU_BTN,cx=x+s/2,cy=y+s/2;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const ink=open?'#f6f3ea':'#f6f3ea';
    const shadow=(fn,lw)=>{ctx.save();ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=lw;ctx.translate(0,2);fn();ctx.restore();ctx.strokeStyle=ink;ctx.lineWidth=lw;fn()};
    if(open){const r=15;shadow(()=>{ctx.beginPath();ctx.moveTo(cx-r,cy-r);ctx.lineTo(cx+r,cy+r);ctx.moveTo(cx+r,cy-r);ctx.lineTo(cx-r,cy+r);ctx.stroke()},3.5)}
    else{const thick=11,barW=68,gap=16,step=thick+gap,x0=cx-barW/2,x1=cx+barW/2;
      shadow(()=>{for(const dy of[-step,0,step]){ctx.beginPath();ctx.moveTo(x0,cy+dy);ctx.lineTo(x1,cy+dy);ctx.stroke()}},thick)}
    ctx.restore()};
  BB.menuEase=t=>{t=Math.max(0,Math.min(1,t));return 1-Math.pow(1-t,3)};
  BB.menuRow=(x,y,w,h,label,o={})=>{
    const ink=o.accent?MENU_ACCENT:MENU_INK;
    BB.text(label,x,y+h/2,o.size||52,ink,{align:'left',font:'Lilita One',maxW:w-(o.chevron?56:16)});
    if(o.chevron){const cx=x+w-36,cy=y+h/2;ctx.strokeStyle=o.accent?MENU_ACCENT:MENU_MUTED;ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(cx-7,cy-11);ctx.lineTo(cx+6,cy);ctx.lineTo(cx-7,cy+11);ctx.stroke()}};
  BB.drawDrawer=(k,page)=>{
    k=Math.max(0,Math.min(1,k));const dw=W/2,dx=-dw*(1-k);
    ctx.fillStyle='rgba(40,42,46,'+(0.45*k)+')';ctx.fillRect(0,0,W,H);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.22)';ctx.shadowBlur=36;ctx.shadowOffsetX=10;ctx.fillStyle=MENU_BG;ctx.fillRect(dx,0,dw,H);ctx.restore();
    ctx.fillStyle=MENU_BG;ctx.fillRect(dx,0,dw,H);
    ctx.save();ctx.beginPath();ctx.rect(dx,0,dw,H);ctx.clip();
    const pad=64,rowH=92,play=true;
    const items=[{label:'Resume',accent:1},{label:'How To Play',chevron:1},{label:'Room Select'},{label:'Mic Setup',chevron:1},{label:'Assessment'},{label:'Teacher',chevron:1}];
    if(page==='main'){
      const ox0=Math.max(dx,0);
      BB.text('Paused',ox0+pad,72,30,MENU_MUTED,{align:'left',font:'Lilita One'});
      let yy=140;
      items.forEach((it,i)=>{const delay=i*0.055,kk=BB.menuEase(Math.max(0,Math.min(1,(k-delay)/0.72))),ox=(1-kk)*24;
        ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,kk*1.15));
        BB.menuRow(ox0+pad+ox,yy,dw-pad*2,rowH,it.label,{size:52,chevron:it.chevron,accent:it.accent});
        ctx.restore();yy+=rowH+8});
    }else if(page==='howto'){
      BB.drawBack(Math.max(dx,0));BB.text('How To Play',Math.max(dx,0)+pad,130,44,MENU_INK,{align:'left',font:'Lilita One'});
      BB.text('NOTE MINE: dig up the whole notes!',Math.max(dx,0)+pad,178,24,MENU_MUTED,{align:'left',font:'Lilita One',maxW:dw-pad*2});
      ['Watch the green beat lights.','Warm up: 4 claps in a row.','Then clap on the beat to strike the rock.','Piano = soft. Forte = loud.'].forEach((s,i)=>{const yy=230+i*70,L=Math.max(dx,0);BB.text(String(i+1),L+pad,yy,32,MENU_ACCENT,{align:'left'});BB.text(s,L+pad+36,yy,28,MENU_INK,{align:'left',maxW:dw-pad*2-36})});
    }else if(page==='teacher'){
      const L=Math.max(dx,0);BB.drawBack(L);let yy=120;const p=48;
      BB.text('Teacher',L+p,yy,38,MENU_INK,{align:'left'});yy+=48;
      BB.text('Mic',L+p,yy,20,MENU_MUTED,{align:'left'});yy+=30;
      BB.micMeterBars(L+p,yy,.5);yy+=90;
      BB.text('Sensitivity    −    +',L+p,yy,22,MENU_MUTED,{align:'left'});yy+=34;
      BB.text('Mic: On',L+p,yy,22,MENU_ACCENT,{align:'left'});yy+=36;
      BB.menuRow(L+p,yy,dw-p*2,52,'Open full mic setup',{size:28,chevron:1});yy+=62;
      BB.text('Class',L+p,yy,20,MENU_MUTED,{align:'left'});yy+=30;
      BB.menuRow(L+p,yy,dw-p*2,52,'Day  1',{size:28});yy+=54;
      BB.menuRow(L+p,yy,dw-p*2,52,'Grade  2',{size:28});yy+=62;
      BB.text('Data',L+p,yy,20,MENU_MUTED,{align:'left'});yy+=30;
      BB.text('Clap log  12 / 30000',L+p,yy,22,MENU_INK,{align:'left'});yy+=28;
      ['Download clap log','Download summary','Clear log','Open assessment'].forEach((s,i)=>{BB.menuRow(L+p,yy,dw-p*2,52,s,{size:28,chevron:s==='Open assessment'});yy+=54});
      yy+=8;BB.text('Options',L+p,yy,20,MENU_MUTED,{align:'left'});yy+=30;
      BB.menuRow(L+p,yy,dw-p*2,52,'Listen rule: On',{size:28});yy+=54;
      BB.menuRow(L+p,yy,dw-p*2,52,'Details',{size:28});
    }
    ctx.restore();
    BB.drawMenuBtn(true);
  };
  BB.drawBack=(dx)=>{const bx=dx+56,by=60;ctx.strokeStyle=MENU_INK;ctx.lineWidth=3.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(bx+12,by-12);ctx.lineTo(bx,by);ctx.lineTo(bx+12,by+12);ctx.stroke();BB.text('Back',bx+28,by,28,MENU_INK,{align:'left'})};
  return BB;
}

function save(c,name){const f=path.join(OUT,name);fs.writeFileSync(f,c.toBuffer('image/png'));console.log('wrote',f);return f}

function drawMineHUD(ctx,BB,o={}){
  // WHOLE NOTES + BEAT CHIP + inset tempo + strikes + mic icon + hamburger
  ctx.save();ctx.translate(40,24);BB.panel(0,0,500,114,28);
  BB.text('WHOLE NOTES',32,42,26,COL.yellow,{align:'left',stroke:4,maxW:200});BB.text('3 of 8',32,80,24,'#fff',{align:'left',font:'Rammetto One',stroke:4});ctx.restore();
  ctx.save();ctx.translate(768,80);BB.panel(-65,-65,130,130,26);BB.text('BEAT CHIP',0,36,14,'#8fb5ad',{stroke:3,maxW:88});ctx.restore();
  const tpx=W-630,tpy=24,tpw=480,tph=114;
  BB.panel(tpx,tpy,tpw,tph,28);
  const title=o.tempo||'ANDANTE',sub=(o.sub||'walking speed  ·  90 bpm');
  BB.text(title,tpx+tpw/2,tpy+48,32,'#fff',{font:'Rammetto One',stroke:5,maxW:tpw-56});
  BB.text(sub,tpx+tpw/2,tpy+82,20,COL.yellow,{stroke:3,maxW:tpw-56});
  const need=o.need||8,pw=need>6?28:34,sPad=24,sW=need*pw+sPad*2,pillW=352,gap=64,group=pillW+gap+sW,gx0=(W-group)/2;
  BB.beatPills(gx0+pillW/2,H-95,[1,1,.4,0]);
  BB.panel(gx0+pillW+gap,H-154,sW,118,26);
  BB.text('STRIKES',gx0+pillW+gap+sW/2,H-154+36,22,'#fff',{stroke:4});
  for(let i=0;i<need;i++)BB.rrect(gx0+pillW+gap+sPad+i*pw,H-154+58,pw-8,32,8,i<3?COL.yellow:'#3a4a48','#fff',2);
  BB.micIcon(36,H-120,72,o.mic||'idle');
  BB.text('MANUAL',W-205,H-95,32,COL.yellow,{stroke:4}); // label only, existing override lives here
  if(!o.noHam)BB.drawMenuBtn(!!o.menuOpen);
}

function warehouse(ctx){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#6a7a86');g.addColorStop(.45,'#8b8f8a');g.addColorStop(1,'#4a4e4a');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#3d4543';ctx.fillRect(0,880,W,200);
  ctx.fillStyle='rgba(255,255,255,.06)';for(let x=0;x<W;x+=80)ctx.fillRect(x,0,2,H);
}

async function main(){
  let smash,smashBefore,wh;
  try{smash=await loadImage(path.join(ROOT,'assets/v2/smash.png'))}catch(e){console.warn('smash',e.message)}
  try{smashBefore=await loadImage('/tmp/smash_before_gaps.png')}catch(e){}
  try{wh=await loadImage(path.join(ROOT,'assets/v2/wh.jpg'))}catch(e){try{wh=await loadImage(path.join(ROOT,'assets/v2/hub_bg.jpg'))}catch(e2){}}

  const c=createCanvas(W,H),ctx=c.getContext('2d');
  const BB=make(ctx);

  const placeMachine=(sx,sy,hgt)=>{
    if(!smash)return {x:sx,y:sy,h:hgt,w:hgt};
    const ar=smash.width/smash.height,hh=hgt,ww=hh*ar;
    ctx.drawImage(smash,sx-ww/2,sy-hh,ww,hh);
    return {x:sx,y:sy,h:hh,w:ww};
  };

  // --- mine play HUD ---
  if(wh){ctx.drawImage(wh,0,0,W,H)}else warehouse(ctx);
  const GY=880;const mx=1280,mh=420;placeMachine(mx,GY+6,mh);
  BB.plaque(mx,GY-260,380,70,'Drill-O-Matic 3000',24,'#b5482a',{font:'Rammetto One',r:16,cols:['#fdf8ea','#ecdcb8','#caa77a']});
  drawMineHUD(ctx,BB,{tempo:'ANDANTE',sub:'walking speed  ·  90 bpm',need:8});
  save(c,'mine_hud_play.png');

  // 2x zoom of machine in the scene
  const z=createCanvas(900,900),zg=z.getContext('2d');
  const zx=mx-225,zy=(GY-260)-200;
  zg.drawImage(c,zx,zy,450,450,0,0,900,900);
  save(z,'mine_machine_2x.png');

  // ANDANTE+FORTE tempo confirmation crop (top right)
  const tc=createCanvas(700,200),tg=tc.getContext('2d');
  tg.drawImage(c,W-700,0,700,200,0,0,700,200);
  save(tc,'mine_tempo_andante.png');

  // hamburger close-up (closed) on dark HUD corner
  const hc=createCanvas(360,360),hg=hc.getContext('2d');
  hg.drawImage(c,W-200,0,200,200,0,0,360,360);
  save(hc,'hamburger_closeup.png');

  // --- other room HUDs (shared hamburger, no pause) ---
  function roomHUD(name,file,extra){
    if(wh){ctx.drawImage(wh,0,0,W,H);ctx.fillStyle='rgba(10,20,20,.25)';ctx.fillRect(0,0,W,H)}
    else warehouse(ctx);
    extra&&extra();
    BB.panel(40,24,420,110,28);BB.text(name,250,80,32,COL.yellow,{font:'Rammetto One',stroke:5,maxW:360});
    BB.micIcon(36,H-120,72);
    BB.drawMenuBtn(false);
    save(c,file);
  }
  roomHUD('NOTE SMASHER','smasher_hud.png');
  roomHUD('PACKING STATION','packing_hud.png');
  roomHUD('LABEL ROOM','label_hud.png');
  roomHUD('DELIVERY','delivery_hud.png',()=>{BB.rrect(W-430,30,260,90,28,BB.lg(30,120,['#fbf6e6','#e8e2cd']),'#8a806b',4);BB.text('SKIP',W-300,75,36,COL.yellow,{stroke:4})});
  roomHUD('CHECKPOINT','assess_hud.png',()=>{BB.panel(80,40,1710,110,28);BB.text('CHECKPOINT  1 / 8',W/2-80,80,36,COL.yellow,{font:'Rammetto One',stroke:5})});
  // map / home with hamburger
  if(wh)ctx.drawImage(wh,0,0,W,H);else warehouse(ctx);
  BB.text('THE RHYTHM WAREHOUSE',W/2,86,64,'#e6fbf3',{font:'Rammetto One',stroke:8});
  BB.drawMenuBtn(false);
  save(c,'map_hud.png');

  // --- paused drawer over mine ---
  if(wh)ctx.drawImage(wh,0,0,W,H);else warehouse(ctx);
  placeMachine(mx,GY+6,mh);
  BB.plaque(mx,GY-260,380,70,'Drill-O-Matic 3000',24,'#b5482a',{font:'Rammetto One',r:16,cols:['#fdf8ea','#ecdcb8','#caa77a']});
  drawMineHUD(ctx,BB,{tempo:'ANDANTE',need:8,noHam:true});
  // mid-animation
  const mid=createCanvas(W,H),mctx=mid.getContext('2d');
  mctx.drawImage(c,0,0);const BBm=make(mctx);BBm.drawDrawer(0.62,'main');
  save(mid,'menu_opening.png');
  // open
  BB.drawDrawer(1,'main');
  save(c,'menu_open.png');
  const hx=createCanvas(360,360),hxg=hx.getContext('2d');
  hxg.drawImage(c,W-200,0,200,200,0,0,360,360);
  save(hx,'hamburger_x_closeup.png');

  // howto + teacher over same gameplay
  if(wh)ctx.drawImage(wh,0,0,W,H);else warehouse(ctx);
  placeMachine(mx,GY+6,mh);
  drawMineHUD(ctx,BB,{tempo:'ANDANTE',need:8,noHam:true});
  BB.drawDrawer(1,'howto');save(c,'howto.png');

  if(wh)ctx.drawImage(wh,0,0,W,H);else warehouse(ctx);
  placeMachine(mx,GY+6,mh);
  drawMineHUD(ctx,BB,{tempo:'ANDANTE',need:8,noHam:true});
  BB.drawDrawer(1,'teacher');save(c,'teacher.png');

  // --- smash before/after on dark checker and in-scene 2x ---
  function checker(w,h,s=20){const im=createCanvas(w,h),g=im.getContext('2d');
    for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){g.fillStyle=((x/s+y/s)&1)?'#16181e':'#0c0d12';g.fillRect(x,y,s,s)}return im}
  function sprOn(img,sc,bg){const w=img.width*sc,h=img.height*sc,im=createCanvas(w,h),g=im.getContext('2d');
    g.drawImage(bg||checker(w,h),0,0,w,h);g.drawImage(img,0,0,w,h);return im}
  if(smashBefore)save(sprOn(smashBefore,2),'smash_before_checker_2x.png');
  if(smash)save(sprOn(smash,2),'smash_after_checker_2x.png');
  // side-by-side pipe-gap close-up
  if(smash&&smashBefore){
    const box=[140,40,160,160],sc=4;
    const pair=createCanvas(box[2]*sc*2+40,box[3]*sc+80),pg=pair.getContext('2d');
    pg.fillStyle='#111';pg.fillRect(0,0,pair.width,pair.height);
    const paste=(img,ox)=>{const ch=checker(box[2]*sc,box[3]*sc,16);pg.drawImage(ch,ox,50);pg.drawImage(img,box[0],box[1],box[2],box[3],ox,50,box[2]*sc,box[3]*sc)};
    paste(smashBefore,20);paste(smash,box[2]*sc+40);
    const BBt=make(pg);BBt.text('BEFORE',20+box[2]*sc/2,30,24,'#fff',{font:'Lilita One'});BBt.text('AFTER',box[2]*sc+40+box[2]*sc/2,30,24,'#fff',{font:'Lilita One'});
    save(pair,'smash_gaps_before_after.png');
  }
  console.log('previews ready in',OUT);
}
main().catch(e=>{console.error(e);process.exit(1)});
