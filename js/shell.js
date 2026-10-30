// App shell: boot, title, mic setup, room map, room registry. Later rooms plug in via BB.ROOMS.
'use strict';
(()=>{const ctx=BB.ctx,COL=BB.COL,W=BB.W,H=BB.H;
// ---- Room registry: add a room by giving it a create() that returns a scene object ----
// Scene interface: enter(), update(dt), draw(ctx), exit(); room scenes call BB.roomDone(id) when finished.
BB.ROOMS=[
  {id:'mine',name:'NOTE MINE',sub:'Dig up whole notes',create:()=>BB.MineRoom&&new BB.MineRoom(),col:'#a0643c'},
  {id:'smasher',name:'NOTE SMASHER',sub:'Meet tika-tika',create:()=>new BB.SmasherRoom(),col:'#5a8cb4'},
  {id:'packing',name:'PACKING STATION',sub:'Cargo Code',create:()=>new BB.PackingRoom(),col:'#c89632'},
  {id:'label',name:'NAME THAT RHYTHM',sub:'Label Room',create:()=>BB.LabelRoom&&new BB.LabelRoom(),col:'#b45aa0'},
  {id:'finale',name:'DELIVERY',sub:'Stop Static Jr.!',create:null,col:'#3c5a8c'},
];
const save=JSON.parse(localStorage.getItem('bb4')||'{"done":[]}');BB.save=save;
const persist=()=>localStorage.setItem('bb4',JSON.stringify(save));
BB.unlocked=i=>i===0||save.done.includes(BB.ROOMS[i-1].id);
BB.roomDone=id=>{if(!save.done.includes(id))save.done.push(id);persist();BB.go(new MapScene(id))};
// ---- shared warehouse backdrop for menus ----
const bgCache={};
function menuBg(which='title_bg',dim=.0){const im=BB.V2[which],key=which+dim;
  // painted backdrop + vignette + dim baked once into one offscreen image (same pixels, one draw per frame)
  if(im&&!bgCache[key]){const c=document.createElement('canvas');c.width=W;c.height=H;const g2=c.getContext('2d');g2.drawImage(im,0,0,W,H);
    const g=g2.createRadialGradient(W/2,H*.45,H*.35,W/2,H*.5,H*1.05);g.addColorStop(0,'rgba(20,10,4,0)');g.addColorStop(1,'rgba(20,10,4,.55)');g2.fillStyle=g;g2.fillRect(0,0,W,H);
    if(dim){g2.fillStyle=`rgba(15,10,6,${dim})`;g2.fillRect(0,0,W,H)}bgCache[key]=c}
  if(im)ctx.drawImage(bgCache[key],0,0);else{ctx.fillStyle='#c86a32';ctx.fillRect(0,0,W,H)}
  ctx.fillStyle='rgba(255,235,190,.35)';if(BB.q)for(let i=0;i<18;i++){const x=(i*397+BB.t*(8+i%5*3))%W,y=(i*211+Math.sin(BB.t*.5+i)*30)%(H*.8);ctx.beginPath();ctx.arc(x,y,1.5+(i%3),0,7);ctx.fill()}}
BB.gear=(x,y,r,a,col)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=col;ctx.beginPath();
  for(let i=0;i<12;i++){const a0=i*Math.PI/6;ctx.lineTo(Math.cos(a0-.12)*r*1.18,Math.sin(a0-.12)*r*1.18);ctx.lineTo(Math.cos(a0+.12)*r*1.18,Math.sin(a0+.12)*r*1.18);ctx.lineTo(Math.cos(a0+.3)*r,Math.sin(a0+.3)*r);ctx.lineTo(Math.cos(a0+Math.PI/6-.3)*r,Math.sin(a0+Math.PI/6-.3)*r)}
  ctx.closePath();ctx.fill();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(0,0,r*.35,0,7);ctx.fill();ctx.restore()};
// ---- Title ----
class TitleScene{enter(){this.t0=BB.t}
  update(){if(!this.mus&&BB.groove&&BB.ac.state==='running'){this.mus=1;BB.groove.start(108,'title')}// v13.2 title music (starts on the first tap: browsers block autoplay)
    if(BB.keys.includes('Enter'))this.start()}
  start(){BB.unlockAudio();BB.groove&&BB.groove.stop();BB.sfx.fanfare();BB.go(new MicScene())}
  draw(){menuBg();const t=BB.t-this.t0,k=Math.min(1,t/.8);
    // v12.7: the real Beat Bots logo + logo-style rendered yellow subtitle (no panel, nothing on a border)
    ctx.save();ctx.translate(W/2,300);const s=BB.ease.back(k);ctx.scale(s,s);BB.glow(0,-60,700,'rgba(255,220,150,A)',.22);
    const lg=BB.V2.logo;if(lg){const h=380,w=lg.width*h/lg.height;ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=30;ctx.shadowOffsetY=14;ctx.drawImage(lg,-w/2,-300,w,h);ctx.restore()}
    BB.logoText('LEVEL 4: THE RHYTHM WAREHOUSE',0,150,74,{maxW:1500,matte:1});ctx.restore();
    const b=Math.sin(BB.t*4);
    BB.contactShadow(380,1010,190,.5);BB.sprite('sprocket',380,1010,430,{squash:b*.02,shadow:false});
    BB.contactShadow(1560,1010,160,.5);BB.sprite('sorter',1560,1010,360,{squash:-b*.02,shadow:false});
    BB.staticJr(1330+Math.sin(BB.t*1.3)*60,1040,110,{spd:80,flip:Math.cos(BB.t*1.3)<0,run:.5,glitch:Math.sin(BB.t*2)>.95?1:0,rot:Math.sin(BB.t*8)*.08});
    BB.button(W/2-260,680,520,160,'START',{style:'green',size:80,font:'Rammetto One',id:'start',pop:1+Math.sin(BB.t*3)*.03,onClick:()=>this.start()});
    BB.rrect(W/2-560,1018,1120,50,25,'rgba(15,25,24,.7)');BB.text('Best on a big screen. Tap full screen (top right) for the whole board.',W/2,1045,28,'#fff',{stroke:4})}}
// ---- Mic setup ----
class MicScene{enter(){this.state='ask';this.t0=BB.t;this.heard=0;if(BB.mic.ok)this.state='on';setTimeout(()=>BB.say('mic'),300)}
  update(dt){if(BB.MLP&&BB.MLP.on&&(this.state==='on'||this.state==='calib'||this.state==='gcal'||this.lc||this.mlCal))BB.MLP.micWant();if(this.lc){this.lc.update();return}const o=BB.mic.take();if(o.length){this.heard+=o.length;this.flash=BB.t;BB.burst(W/2,560,18,{cols:['#ffe066','#6ee678','#fff'],kind:'star',size:14,g:300})}}
  async turnOn(){this.state='asking';const ok=await BB.startMic();
    if(ok){this.state='calib';// measure how loud our own click track is in the mic so it is not mistaken for claps
      // latency calibration: play 4 beeps, measure when the mic hears each one
      const t=BB.ac.currentTime+.3,times=[0,1,2,3].map(i=>t+i*.5);BB.mic.calib=[];times.forEach((x,i)=>BB.sfx.tick(x,i===0));
      setTimeout(()=>{const c=BB.mic.calib;BB.mic.calib=null;const d=[];for(const x of times){const h=c.find(y=>y>x-.02&&y<x+.4);if(h!=null)d.push(h-x)}
        if(d.length>=2){d.sort((a,b)=>a-b);BB.mic.lat=Math.max(0,d[d.length>>1])}if(window.GroupGate)GroupGate.setLat(BB.mic.lat);BB.mic.onsets=[];this.state='on';
        // v12.6: the soft/loud check runs ONCE here, before the game (cave-in, piano and forte all use it; Skip = defaults)
        if(!(window.GroupGate&&GroupGate.calOk()))setTimeout(()=>{if(BB.scene===this)this.loudCal()},1800)},2600)}
    else this.state='denied'}

  groupCal(){if(this.state!=='on'||!window.GroupGate)return;this.state='gcal';this.gIdx=-1;
    const t=BB.ac.currentTime+1.2,times=[0,1,2,3].map(i=>t+i*.75);this.gTimes=times;times.forEach((x,i)=>BB.sfx.tick(x,i===0));
    times.forEach((x,i)=>setTimeout(()=>this.gIdx=i,(x-BB.ac.currentTime)*1000));
    setTimeout(()=>{const Es=times.map(x=>GroupGate.measure(x+GroupGate.W0,x+GroupGate.W1).E);const c=GroupGate.calibrate(Es);
      this.gRes=Es.filter(e=>e>0).length>=2?'Got it! I know how loud your class is.':'Hmm, I barely heard you. Try again or skip.';BB.mic.onsets=[];this.state='on'},(times[3]+.6-BB.ac.currentTime)*1000)}
  loudCal(){if(this.state!=='on'||this.lc)return;this.lc=new BB.LoudCal(ok=>{this.lc=null;this.lcRes=ok?'Soft & loud saved!':'';BB.mic.onsets=[]})}
  draw(){menuBg('title_bg',.25);BB.panel(260,120,1400,800,44);
    BB.text('MICROPHONE CHECK',W/2,215,64,'#fff',{font:'Rammetto One',stroke:8});
    BB.contactShadow(500,740,140,.45);BB.sprite('sprocket',500,740,420,{squash:BB.isTalking('sprocket')?Math.sin(BB.t*18)*.015:0});
    // painted microphone, pulses with the input level
    // v12.7: bigger, no pale glow pooling under the base, centred on the controls column (y 330..860 -> mid 595)
    {const lv=Math.min(1,BB.mic.level||0),MX=800,h=400*(1+lv*.04),base=775;BB.glow(MX,base-h*.72,140+lv*110,'rgba(120,230,200,A)',.1+lv*.45);BB.contactShadow(MX,base-4,95,.55);
     const im=BB.V2.mic;if(im){const w=im.width*h/im.height;ctx.drawImage(im,MX-w/2,base-h,w,h)}}
    const st=this.state,CX=1330;// v12.7: one centre line for the whole right column
    if(st==='ask'||st==='asking'){BB.text('Sprocket wants to hear your claps!',CX,330,40,'#fff',{maxW:560});
      BB.text('Your browser will ask to use the microphone.',CX,390,30,COL.yellow,{maxW:560});
      BB.button(CX-250,640,500,140,st==='asking'?'ASKING...':'TURN ON MIC',{style:'green',size:56,id:'micon',onClick:()=>this.state==='ask'&&this.turnOn()});
      BB.button(CX-250,800,500,80,'Play without mic',{size:34,id:'nomic',onClick:()=>BB.go(new MapScene())})}
    else if(st==='calib'){BB.text('Shh... checking the room',CX,360,44,'#fff');BB.text('(listening to our own beat clicks)',CX,420,30,COL.yellow)}
    else if(st==='denied'){BB.text('No microphone? No problem!',CX,330,42,'#fff',{maxW:560});
      if(BB.mic.err)BB.text(BB.mic.err,CX,560,26,'#ff9c8a',{maxW:600});BB.button(CX-250,800,500,80,'TRY MIC AGAIN',{size:34,id:'retry',onClick:()=>{this.state='ask';this.turnOn()}});
      BB.text('Use the big MANUAL OVERRIDE button',CX,395,32,COL.yellow,{maxW:560});BB.text('when the class gets it right.',CX,440,32,COL.yellow,{maxW:560});
      BB.button(CX-250,630,500,140,'CONTINUE',{style:'green',size:56,id:'cont',onClick:()=>BB.go(new MapScene())})}
    else if(st==='gcal'){BB.text('Everyone clap with the beeps!',CX,360,44,'#fff',{maxW:620});BB.text(this.gIdx>=0?['1','2','3','4'][this.gIdx]:'Ready...',CX,470,90,COL.yellow,{font:'Rammetto One',stroke:8})}
    else{BB.text('Clap once to test!',CX,350,48,'#fff');
      const f=this.flash&&BB.t-this.flash<.4;BB.text(this.heard?`Heard ${this.heard} clap${this.heard>1?'s':''}!`:'...',CX,410,40,f?COL.green:COL.yellow);
      BB.micMeter(CX-165,462);// meter (346 wide) centred over the Sensitivity + CONTINUE row
      BB.text('Sensitivity',1075+100,630,28,'#fff');BB.sensButtons(1075,652);
      BB.button(1310,630,275,124,'CONTINUE',{style:'green',size:44,id:'cont',onClick:()=>BB.go(new MapScene())});// inside the frame (well ends at 1642)
      BB.button(1075,780,245,76,'Class clap check',{size:27,id:'gcal',onClick:()=>this.groupCal()});BB.button(1340,780,245,76,'Soft / loud check',{size:27,id:'lcal',onClick:()=>this.loudCal()});if(BB.MLP&&BB.MLP.on&&window.ClapNet&&ClapNet.ready){BB.button(1075,870,510,60,this.mlCal?'Clap 8 times with the ticks...':(this.mlRes||'Clap model: clap 8 times'),{size:24,id:'mlcal',onClick:()=>{if(this.mlCal)return;this.mlCal=1;BB.MLP.calibrate((ok,n)=>{this.mlCal=0;this.mlRes=ok?'Clap model tuned to this room ('+n+' claps)':'Heard only '+(n||0)+' claps - try again'})}})}
      const rs=[this.gRes,this.lcRes].filter(Boolean).join('  ');if(rs)BB.text(rs,CX,885,24,COL.green,{maxW:600})}
    if(this.lc){ctx.fillStyle='rgba(10,20,20,.55)';ctx.fillRect(0,0,W,H);this.lc.draw(W/2,H/2-40)}
    BB.captionBox()}}

// v12.7 hub bay: a doorway cut in the factory wall that previews its room
function drawBay(i,cx,top,bot,bw,un,ready){const x=cx-bw/2,w=bw,h=bot-top,im=BB.V2[['tun0','smash_blur','pack_blur'][i]];
  ctx.save();ctx.beginPath();ctx.roundRect(x+14,top+14,w-28,h-14,[18,18,0,0]);ctx.clip();
  if(im){const s=Math.max((w-28)/im.width,(h-14)/im.height);ctx.drawImage(im,cx-im.width*s/2,top+14+(h-14)/2-im.height*s/2,im.width*s,im.height*s)}
  else{ctx.fillStyle=BB.lg(top,bot,['#1b1a22','#2c2a36']);ctx.fillRect(x,top,w,h)}
  if(i===0){// mine entrance: dark tunnel mouth, rails into the dark, hanging lantern
    const g=ctx.createRadialGradient(cx,bot-90,10,cx,bot-90,150);g.addColorStop(0,'rgba(0,0,0,.75)');g.addColorStop(1,'rgba(0,0,0,.1)');ctx.fillStyle=g;ctx.fillRect(x,top,w,h);
    ctx.strokeStyle='#8b949a';ctx.lineWidth=5;for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(cx+s*70,bot);ctx.lineTo(cx+s*12,bot-110);ctx.stroke()}
    ctx.strokeStyle='#5a3a22';for(let k=0;k<6;k++){const f=k/6,y=bot-f*f*110-4,hw=70-58*f;ctx.lineWidth=7-4*f;ctx.beginPath();ctx.moveTo(cx-hw-8,y);ctx.lineTo(cx+hw+8,y);ctx.stroke()}}
  if(!un||!ready){ctx.fillStyle='rgba(10,8,12,.55)';ctx.fillRect(x,top,w,h);// rolled-down shutter
    const sh=!un?h:h*.62;for(let y=top+14;y<top+14+sh-14;y+=16){ctx.fillStyle=BB.lg(y,y+16,['#c9d3d1','#8f9b99','#5d6866']);ctx.fillRect(x,y,w,16);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x,y+14,w,2)}
    const yb=top+sh-8;ctx.fillStyle=BB.lg(yb-10,yb+6,['#f6d24a','#c99a10']);ctx.fillRect(x,yb-10,w,16);}
  else{const sy=top+14,g=ctx.createLinearGradient(0,sy,0,sy+40);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x,sy,w,40)}
  ctx.restore();
  if(i===0){// timber frame
    const wood=(X,Y,W2,H2)=>{BB.rrect(X,Y,W2,H2,4,BB.lg(Y,Y+H2,['#a8743f','#7a4e26','#5a3518']),'#3a2210',3);ctx.strokeStyle='rgba(40,20,5,.35)';ctx.lineWidth=2;for(let k=1;k<3;k++){ctx.beginPath();if(W2<H2){ctx.moveTo(X+W2*k/3,Y+6);ctx.lineTo(X+W2*k/3,Y+H2-6)}else{ctx.moveTo(X+6,Y+H2*k/3);ctx.lineTo(X+W2-6,Y+H2*k/3)}ctx.stroke()}};
    wood(x,top+6,26,h-6);wood(x+w-26,top+6,26,h-6);wood(x-14,top-10,w+28,30);
    for(const bx of[x+13,x+w-13])BB.rivet(bx,top+5,3.5);
    const lx=cx+80,ly=top+70+Math.sin(BB.t*1.6)*2;ctx.strokeStyle='#222';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx,top+20);ctx.lineTo(lx,ly-16);ctx.stroke();
    BB.glow(lx,ly,70+6*Math.sin(BB.t*7),'rgba(255,190,90,A)',.55);BB.rrect(lx-10,ly-14,20,28,5,BB.lg(ly-14,ly+14,['#ffe7a0','#ffb43c']),'#3a2a18',3);
    BB.glow(cx-60,bot-50,90,'rgba(255,220,140,A)',.35+.08*Math.sin(BB.t*3));BB.solidWhole(cx-62,bot-62,30,{glow:.5});BB.contactShadow(cx+48,bot,55,.45);BB.pickbot(cx+48,bot,150,(Math.sin(BB.t*4)+1)/2)}
  else{// steel loading-dock frame with hazard jambs
    BB.rrect(x-2,top-2,w+4,h+4,[22,22,0,0],null,'#2a3432',4);
    for(const jx of[x,x+w-16]){BB.rrect(jx,top+10,16,h-10,3,BB.lg(top,bot,['#e9eeed','#9aa6a4','#5d6866']),'#2a3432',2)}
    BB.rrect(x-10,top-8,w+20,26,10,BB.lg(top-8,top+18,['#d8f3ea','#8fcdb9','#4f9a86']),'#24413b',3);
    ctx.save();ctx.beginPath();ctx.rect(x+18,top+20,w-36,10);ctx.clip();for(let k=-2;k<w/14;k++){ctx.fillStyle=k%2?'#1d1d1d':'#f2c230';ctx.beginPath();ctx.moveTo(x+18+k*14,top+30);ctx.lineTo(x+32+k*14,top+20);ctx.lineTo(x+46+k*14,top+20);ctx.lineTo(x+32+k*14,top+30);ctx.fill()}ctx.restore();
    for(const bx of[x+20,x+w-20])BB.rivet(bx,top+5,3.5);
    if(!un){const lk=BB.V2.lock;if(lk){const lh=120,lw=lk.width*lh/lk.height;ctx.drawImage(lk,cx-lw/2,top+h*.32+Math.sin(BB.t*2+i)*3,lw,lh)}}
    else if(!ready){BB.plaque(cx,top+h*.36,200,54,'COMING SOON',22,'#28403c',{font:'Rammetto One',noRivet:1})}}
  BB.contactShadow(cx,bot,w*.6,.35)}
// ---- Room map ----
class MapScene{constructor(justDone){this.justDone=justDone}
  enter(){this.t0=BB.t;this.toast=null;if(this.justDone)BB.sfx.fanfare()}
  update(){}
  open(i){const r=BB.ROOMS[i];if(!BB.unlocked(i)){this.toast={txt:'LOCKED! Finish the room before it first.',t:BB.t};BB.sfx.bonk();return}
    if(!r.create||!r.create()){this.toast={txt:`${r.name}: COMING SOON!`,t:BB.t};BB.sfx.wobble();return}
    BB.go(r.create())}
  draw(){menuBg('hub_bg');
    // v12.7: logo-style rendered title, no panel (nothing on a border)
    BB.logoText('THE RHYTHM WAREHOUSE',W/2,86,68,{face:['#e6fbf3','#a6e0cf','#6fb8a4','#3f8a78']});
    // five loading bays in the riveted factory wall; each doorway previews its room
    const DX=[206,581,956,1335,1712],BT=430,BB2=760,BW=280;
    BB.ROOMS.forEach((r,i)=>{const cx=DX[i],un=BB.unlocked(i),ready=!!r.create,done=BB.save.done.includes(r.id);
      const pop=this.justDone&&BB.ROOMS[i-1]&&BB.ROOMS[i-1].id===this.justDone?1+.06*Math.max(0,Math.sin((BB.t-this.t0)*8))*Math.exp(-(BB.t-this.t0)):1;
      ctx.save();ctx.translate(cx,(BT+BB2)/2);ctx.scale(pop,pop);ctx.translate(-cx,-(BT+BB2)/2);
      drawBay(i,cx,BT,BB2,BW,un,ready);
      ctx.restore();
      // name plate on the floor in front of the bay
      BB.panel(cx-165,778,330,128,24);BB.text('ROOM '+(i+1),cx,814,24,COL.yellow,{stroke:4});BB.text(r.name,cx,849,27,'#fff',{font:'Rammetto One',stroke:5,maxW:230});BB.text(r.sub,cx,881,21,'#bfe3dc',{maxW:270});
      if(done)BB.star(cx+118,820,15,COL.yellow,0);
      if(un)BB.button(cx-120,930,240,80,done?'PLAY AGAIN':ready?'PLAY':'PEEK',{style:ready?'green':'cream',size:34,id:'room'+i,onClick:()=>this.open(i)});
      else BB.button(cx-120,930,240,80,'LOCKED',{size:34,id:'room'+i,onClick:()=>this.open(i)});
    });
    BB.button(W-250,24,226,76,'MIC SETUP',{size:30,id:'mic',onClick:()=>BB.go(new MicScene())});
    if(this.toast&&BB.t-this.toast.t<2.5){const k=Math.min(1,(BB.t-this.toast.t)*5);ctx.save();ctx.globalAlpha=k;BB.rrect(W/2-450,940,900,100,50,BB.lg(940,1040,['#ffffff','#e8e2cd']),COL.ink,5);BB.text(this.toast.txt,W/2,992,40,COL.ink);ctx.restore()}}}
BB.MapScene=MapScene;BB.MicScene=MicScene;
// ---- boot ----
async function boot(){ctx.setTransform(1,0,0,1,0,0);
  // v13.2: never hang on a slow/old board - fonts API may be missing, and after 10 s we start with whatever has loaded
  const F=document.fonts&&document.fonts.load?[document.fonts.load("40px 'Rammetto One'").catch(()=>{}),document.fonts.load("40px 'Lilita One'").catch(()=>{})]:[];
  await Promise.race([Promise.all([BB.loadImages(['sprocket','sorter','turtle','rocket','whisper','boom','tinytv','jr_a']),BB.loadV2()].concat(F)),new Promise(r=>setTimeout(r,10000))]);
  BB.loadVO(BB.VO_LINES||[]);
  const p=new URLSearchParams(location.search);
  const ro={skipIntro:p.has('skip'),startAt:+p.get('at')||0,auto:p.has('auto')};
  if(p.get('room')==='mine')BB.go(new BB.MineRoom(ro));else if(p.get('room')==='smasher')BB.go(new BB.SmasherRoom(ro));else if(p.get('room')==='packing')BB.go(new BB.PackingRoom(ro));else if(p.get('room')==='label')BB.go(new BB.LabelRoom(ro));else if(p.get('room')==='map')BB.go(new MapScene());else if(p.get('room')==='mic')BB.go(new MicScene());else BB.go(new TitleScene());
  BB.start()}
boot();
})();
