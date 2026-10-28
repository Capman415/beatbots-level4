// App shell: boot, title, mic setup, room map, room registry. Later rooms plug in via BB.ROOMS.
'use strict';
(()=>{const ctx=BB.ctx,COL=BB.COL,W=BB.W,H=BB.H;
// ---- Room registry: add a room by giving it a create() that returns a scene object ----
// Scene interface: enter(), update(dt), draw(ctx), exit(); room scenes call BB.roomDone(id) when finished.
BB.ROOMS=[
  {id:'mine',name:'NOTE MINE',sub:'Dig up whole notes',create:()=>BB.MineRoom&&new BB.MineRoom(),col:'#a0643c'},
  {id:'smasher',name:'NOTE SMASHER',sub:'Meet tika-tika',create:()=>new BB.SmasherRoom(),col:'#5a8cb4'},
  {id:'packing',name:'PACKING STATION',sub:'Cargo Code',create:()=>new BB.PackingRoom(),col:'#c89632'},
  {id:'label',name:'NAME THAT RHYTHM',sub:'Label Room',create:null,col:'#b45aa0'},
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
  update(){if(BB.keys.includes('Enter'))this.start()}
  start(){BB.unlockAudio();BB.sfx.fanfare();BB.go(new MicScene())}
  draw(){menuBg();const t=BB.t-this.t0,k=Math.min(1,t/.8);
    ctx.save();ctx.translate(W/2,250);const s=BB.ease.back(k);ctx.scale(s,s);BB.glow(0,0,820,'rgba(255,220,150,A)',.25);BB.panel(-720,-170,1440,330,50);
    BB.text('BEAT BOTS',0,-60,120,'#fff',{font:'Rammetto One',stroke:12});
    BB.text('LEVEL 4: THE RHYTHM WAREHOUSE',0,75,64,COL.yellow,{stroke:8});ctx.restore();
    const b=Math.sin(BB.t*4);
    BB.contactShadow(380,1010,190,.5);BB.sprite('sprocket',380,1010,430,{squash:b*.02,shadow:false});
    BB.contactShadow(1560,1010,160,.5);BB.sprite('sorter',1560,1010,360,{squash:-b*.02,shadow:false});
    BB.staticJr(1330+Math.sin(BB.t*1.3)*60,1040,110,{spd:80,flip:Math.cos(BB.t*1.3)<0,run:.5,glitch:Math.sin(BB.t*2)>.95?1:0,rot:Math.sin(BB.t*8)*.08});
    BB.button(W/2-260,640,520,170,'START',{style:'green',size:80,id:'start',pop:1+Math.sin(BB.t*3)*.03,onClick:()=>this.start()});
    BB.rrect(W/2-560,1018,1120,50,25,'rgba(15,25,24,.7)');BB.text('Best on a big screen. Tap full screen (top right) for the whole board.',W/2,1045,28,'#fff',{stroke:4})}}
// ---- Mic setup ----
class MicScene{enter(){this.state='ask';this.t0=BB.t;this.heard=0;if(BB.mic.ok)this.state='on';setTimeout(()=>BB.say('mic'),300)}
  update(dt){if(this.lc){this.lc.update();return}const o=BB.mic.take();if(o.length){this.heard+=o.length;this.flash=BB.t;BB.burst(W/2,560,18,{cols:['#ffe066','#6ee678','#fff'],kind:'star',size:14,g:300})}}
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
    BB.contactShadow(450,880,150,.45);BB.sprite('sprocket',450,880,400,{squash:BB.isTalking('sprocket')?Math.sin(BB.t*18)*.015:0});
    // painted microphone, pulses with the input level
    {const lv=Math.min(1,BB.mic.level||0);BB.glow(760,470,200+lv*120,'rgba(120,230,200,A)',.15+lv*.5);BB.contactShadow(760,640,110,.5);
     const im=BB.V2.mic;if(im){const h=330*(1+lv*.04),w=im.width*h/im.height;ctx.drawImage(im,760-w/2,640-h,w,h)}}
    const st=this.state;
    if(st==='ask'||st==='asking'){BB.text('Sprocket wants to hear your claps!',W/2+300,330,40,'#fff',{maxW:560});
      BB.text('Your browser will ask to use the microphone.',W/2+300,390,30,COL.yellow,{maxW:560});
      BB.button(W/2+90,660,500,140,st==='asking'?'ASKING...':'TURN ON MIC',{style:'green',size:56,id:'micon',onClick:()=>this.state==='ask'&&this.turnOn()});
      BB.button(W/2+90,815,500,80,'Play without mic',{size:34,id:'nomic',onClick:()=>BB.go(new MapScene())})}
    else if(st==='calib'){BB.text('Shh... checking the room',W/2+300,360,44,'#fff');BB.text('(listening to our own beat clicks)',W/2+300,420,30,COL.yellow)}
    else if(st==='denied'){BB.text('No microphone? No problem!',W/2+300,330,42,'#fff',{maxW:560});
      if(BB.mic.err)BB.text(BB.mic.err,W/2+300,560,26,'#ff9c8a',{maxW:600});BB.button(W/2+90,860,500,80,'TRY MIC AGAIN',{size:34,id:'retry',onClick:()=>{this.state='ask';this.turnOn()}});
      BB.text('Use the big MANUAL OVERRIDE button',W/2+300,395,32,COL.yellow,{maxW:560});BB.text('when the class gets it right.',W/2+300,440,32,COL.yellow,{maxW:560});
      BB.button(W/2+90,700,500,140,'CONTINUE',{style:'green',size:56,id:'cont',onClick:()=>BB.go(new MapScene())})}
    else if(st==='gcal'){BB.text('Everyone clap with the beeps!',W/2+300,360,44,'#fff',{maxW:620});BB.text(this.gIdx>=0?['1','2','3','4'][this.gIdx]:'Ready...',W/2+300,470,90,COL.yellow,{font:'Rammetto One',stroke:8})}
    else{BB.text('Clap once to test!',W/2+300,340,48,'#fff');
      const f=this.flash&&BB.t-this.flash<.4;BB.text(this.heard?`Heard ${this.heard} clap${this.heard>1?'s':''}!`:'...',W/2+300,410,40,f?COL.green:COL.yellow);
      BB.micMeter(W/2+130,470);BB.text('Sensitivity',W/2+215,620,28,'#fff');BB.sensButtons(W/2+115,640);
      BB.button(W/2+350,600,330,140,'CONTINUE',{style:'green',size:48,id:'cont',onClick:()=>BB.go(new MapScene())})
      BB.button(W/2+90,770,275,80,'Class clap check',{size:28,id:'gcal',onClick:()=>this.groupCal()});BB.button(W/2+375,770,275,80,'Soft / loud check',{size:28,id:'lcal',onClick:()=>this.loudCal()});
      const rs=[this.gRes,this.lcRes].filter(Boolean).join('  ');if(rs)BB.text(rs,W/2+370,880,24,COL.green,{maxW:620})}
    if(this.lc){ctx.fillStyle='rgba(10,20,20,.55)';ctx.fillRect(0,0,W,H);this.lc.draw(W/2,H/2-40)}
    BB.captionBox()}}
// ---- Room map ----
class MapScene{constructor(justDone){this.justDone=justDone}
  enter(){this.t0=BB.t;this.toast=null;if(this.justDone)BB.sfx.fanfare()}
  update(){}
  open(i){const r=BB.ROOMS[i];if(!BB.unlocked(i)){this.toast={txt:'LOCKED! Finish the room before it first.',t:BB.t};BB.sfx.bonk();return}
    if(!r.create||!r.create()){this.toast={txt:`${r.name}: COMING SOON!`,t:BB.t};BB.sfx.wobble();return}
    BB.go(r.create())}
  draw(){menuBg('map_bg');BB.panel(360,24,1200,130,36);BB.text('THE RHYTHM WAREHOUSE',W/2,90,58,'#fff',{font:'Rammetto One',stroke:8});
    // painted map: each room is one of the five arched doors in the background art
    const DX=[206,581,956,1335,1712],DY=420;
    BB.ROOMS.forEach((r,i)=>{const cx=DX[i],un=BB.unlocked(i),ready=!!r.create,done=BB.save.done.includes(r.id);
      const pop=this.justDone&&BB.ROOMS[i-1]&&BB.ROOMS[i-1].id===this.justDone?1+.06*Math.max(0,Math.sin((BB.t-this.t0)*8))*Math.exp(-(BB.t-this.t0)):1;
      ctx.save();ctx.translate(cx,DY);ctx.scale(pop,pop);ctx.translate(-cx,-DY);
      if(!un){ctx.save();ctx.globalAlpha=.55;ctx.fillStyle='#0d0806';ctx.beginPath();ctx.moveTo(cx-120,580);ctx.lineTo(cx-120,330);ctx.arc(cx,330,120,Math.PI,0);ctx.lineTo(cx+120,580);ctx.fill();ctx.restore();
        const lk=BB.V2.lock;if(lk){const h=150,w=lk.width*h/lk.height;BB.contactShadow(cx,560,70,.5);ctx.drawImage(lk,cx-w/2,560-h+Math.sin(BB.t*2+i)*3,w,h)}}
      else if(i===0){BB.glow(cx,430,220,'rgba(255,220,140,A)',.4+.1*Math.sin(BB.t*3));BB.wholeNote(cx-50,470,40,{glow:.6});BB.contactShadow(cx+30,585,60,.45);BB.pickbot(cx+30,585,170,(Math.sin(BB.t*4)+1)/2)}
      else if(!ready){BB.rrect(cx-110,410,220,64,20,BB.lg(410,474,['#ffe680','#e8b830']),COL.ink,4);BB.text('COMING SOON',cx,443,28,COL.ink)}
      // name plate on the floor in front of the door
      BB.panel(cx-170,640,340,150,26);BB.text('ROOM '+(i+1),cx,684,26,COL.yellow,{stroke:4});BB.text(r.name,cx,722,30,'#fff',{font:'Rammetto One',stroke:5,maxW:290});BB.text(r.sub,cx,756,22,'#bfe3dc',{maxW:290});
      if(done){BB.star(cx+140,650,32,COL.yellow,0)}
      ctx.restore();
      if(un)BB.button(cx-130,815,260,90,done?'PLAY AGAIN':ready?'PLAY':'PEEK',{style:ready?'green':'cream',size:38,id:'room'+i,onClick:()=>this.open(i)});
      else BB.button(cx-130,815,260,90,'LOCKED',{size:38,id:'room'+i,onClick:()=>this.open(i)});
    });
    BB.button(40,H-130,280,96,'MIC SETUP',{size:36,id:'mic',onClick:()=>BB.go(new MicScene())});
    if(this.toast&&BB.t-this.toast.t<2.5){const k=Math.min(1,(BB.t-this.toast.t)*5);ctx.save();ctx.globalAlpha=k;BB.rrect(W/2-450,940,900,100,50,BB.lg(940,1040,['#ffffff','#e8e2cd']),COL.ink,5);BB.text(this.toast.txt,W/2,992,40,COL.ink);ctx.restore()}}}
BB.MapScene=MapScene;BB.MicScene=MicScene;
// ---- boot ----
async function boot(){ctx.setTransform(1,0,0,1,0,0);
  await Promise.all([BB.loadImages(['sprocket','sorter','turtle','rocket','whisper','boom','tinytv','jr_a']),BB.loadV2(),document.fonts.load("40px 'Rammetto One'"),document.fonts.load("40px 'Lilita One'")]);
  BB.loadVO(BB.VO_LINES||[]);
  const p=new URLSearchParams(location.search);
  const ro={skipIntro:p.has('skip'),startAt:+p.get('at')||0,auto:p.has('auto')};
  if(p.get('room')==='mine')BB.go(new BB.MineRoom(ro));else if(p.get('room')==='smasher')BB.go(new BB.SmasherRoom(ro));else if(p.get('room')==='packing')BB.go(new BB.PackingRoom(ro));else BB.go(new TitleScene());
  BB.start()}
boot();
})();
