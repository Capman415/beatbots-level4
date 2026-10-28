// App shell: boot, title, mic setup, room map, room registry. Later rooms plug in via BB.ROOMS.
'use strict';
(()=>{const ctx=BB.ctx,COL=BB.COL,W=BB.W,H=BB.H;
// ---- Room registry: add a room by giving it a create() that returns a scene object ----
// Scene interface: enter(), update(dt), draw(ctx), exit(); room scenes call BB.roomDone(id) when finished.
BB.ROOMS=[
  {id:'mine',name:'NOTE MINE',sub:'Dig up whole notes',create:()=>BB.MineRoom&&new BB.MineRoom(),col:'#a0643c'},
  {id:'smasher',name:'NOTE SMASHER',sub:'Meet tika-tika',create:null,col:'#5a8cb4'},
  {id:'packing',name:'PACKING STATION',sub:'Cargo Code',create:null,col:'#c89632'},
  {id:'label',name:'NAME THAT RHYTHM',sub:'Label Room',create:null,col:'#b45aa0'},
  {id:'finale',name:'DELIVERY',sub:'Stop Static Jr.!',create:null,col:'#3c5a8c'},
];
const save=JSON.parse(localStorage.getItem('bb4')||'{"done":[]}');BB.save=save;
const persist=()=>localStorage.setItem('bb4',JSON.stringify(save));
BB.unlocked=i=>i===0||save.done.includes(BB.ROOMS[i-1].id);
BB.roomDone=id=>{if(!save.done.includes(id))save.done.push(id);persist();BB.go(new MapScene(id))};
// ---- shared warehouse backdrop for menus ----
function menuBg(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#9ccfe6');g.addColorStop(.55,'#b9dbe8');g.addColorStop(.56,'#6f8f8c');g.addColorStop(1,'#4a6462');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#c8beaa';ctx.strokeStyle='#786e64';ctx.lineWidth=3;for(let x=-120;x<W;x+=240){ctx.beginPath();ctx.moveTo(x,600);ctx.lineTo(x+120,470);ctx.lineTo(x+240,600);ctx.fill();ctx.stroke()}
  ctx.fillStyle='#d8cfb8';ctx.fillRect(0,600,W,20);
  for(let i=0;i<6;i++){const gx=150+i*330,gy=820+(i%2)*60;BB.gear(gx,gy,60+(i%3)*20,BB.t*(i%2?.6:-.6),'rgba(30,60,58,.5)')}
  for(let i=0;i<12;i++){const on=Math.sin(BB.t*3+i*1.7)>.3;ctx.fillStyle=on?'#ffe066':'#6a6a50';ctx.beginPath();ctx.arc(80+i*160,640,8,0,7);ctx.fill()}}
BB.gear=(x,y,r,a,col)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=col;ctx.beginPath();
  for(let i=0;i<12;i++){const a0=i*Math.PI/6;ctx.lineTo(Math.cos(a0-.12)*r*1.18,Math.sin(a0-.12)*r*1.18);ctx.lineTo(Math.cos(a0+.12)*r*1.18,Math.sin(a0+.12)*r*1.18);ctx.lineTo(Math.cos(a0+.3)*r,Math.sin(a0+.3)*r);ctx.lineTo(Math.cos(a0+Math.PI/6-.3)*r,Math.sin(a0+Math.PI/6-.3)*r)}
  ctx.closePath();ctx.fill();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(0,0,r*.35,0,7);ctx.fill();ctx.restore()};
// ---- Title ----
class TitleScene{enter(){this.t0=BB.t}
  update(){if(BB.keys.includes('Enter'))this.start()}
  start(){BB.unlockAudio();BB.sfx.fanfare();BB.go(new MicScene())}
  draw(){menuBg();const t=BB.t-this.t0,k=Math.min(1,t/.8);
    ctx.save();ctx.translate(W/2,250);const s=BB.ease.back(k);ctx.scale(s,s);BB.panel(-720,-170,1440,330,50);
    BB.text('BEAT BOTS',0,-60,120,'#fff',{font:'Rammetto One',stroke:12});
    BB.text('LEVEL 4: THE RHYTHM WAREHOUSE',0,75,64,COL.yellow,{stroke:8});ctx.restore();
    const b=Math.sin(BB.t*4);
    BB.sprite('sprocket',380,1010,430,{squash:b*.02});
    BB.sprite('sorter',1560,1010,360,{squash:-b*.02});
    BB.staticJr(1330+Math.sin(BB.t*1.3)*60,1040,110,{run:.5,glitch:Math.sin(BB.t*2)>.95?1:0,rot:Math.sin(BB.t*8)*.08});
    BB.button(W/2-260,640,520,170,'START',{style:'green',size:80,id:'start',pop:1+Math.sin(BB.t*3)*.03,onClick:()=>this.start()});
    BB.text('Best on a big screen. Tap full screen (top right) for the whole board.',W/2,1045,28,'#fff',{stroke:5})}}
// ---- Mic setup ----
class MicScene{enter(){this.state='ask';this.t0=BB.t;this.heard=0;if(BB.mic.ok)this.state='on';setTimeout(()=>BB.say('mic'),300)}
  update(dt){const o=BB.mic.take();if(o.length){this.heard+=o.length;this.flash=BB.t;BB.burst(W/2,560,18,{cols:['#ffe066','#6ee678','#fff'],kind:'star',size:14,g:300})}}
  async turnOn(){this.state='asking';const ok=await BB.startMic();
    if(ok){this.state='calib';// measure how loud our own click track is in the mic so it is not mistaken for claps
      // latency calibration: play 4 beeps, measure when the mic hears each one
      const t=BB.ac.currentTime+.3,times=[0,1,2,3].map(i=>t+i*.5);BB.mic.calib=[];times.forEach((x,i)=>BB.sfx.tick(x,i===0));
      setTimeout(()=>{const c=BB.mic.calib;BB.mic.calib=null;const d=[];for(const x of times){const h=c.find(y=>y>x-.02&&y<x+.4);if(h!=null)d.push(h-x)}
        if(d.length>=2){d.sort((a,b)=>a-b);BB.mic.lat=Math.max(0,d[d.length>>1])}BB.mic.onsets=[];this.state='on'},2600)}
    else this.state='denied'}

  draw(){menuBg();BB.panel(260,120,1400,800,44);
    BB.text('MICROPHONE CHECK',W/2,215,64,'#fff',{font:'Rammetto One',stroke:8});
    BB.sprite('sprocket',450,880,400,{squash:BB.isTalking('sprocket')?Math.sin(BB.t*18)*.015:0});
    // big friendly mic icon
    const mx=760,my=470;ctx.save();ctx.translate(mx,my);ctx.fillStyle='#cfd8dc';ctx.strokeStyle=COL.ink;ctx.lineWidth=6;
    ctx.beginPath();ctx.roundRect(-55,-120,110,170,55);ctx.fill();ctx.stroke();for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-40,-80+i*28);ctx.lineTo(40,-80+i*28);ctx.stroke()}
    ctx.beginPath();ctx.arc(0,0,85,.15,Math.PI-.15);ctx.stroke();ctx.beginPath();ctx.moveTo(0,85);ctx.lineTo(0,130);ctx.moveTo(-50,130);ctx.lineTo(50,130);ctx.stroke();ctx.restore();
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
    else{BB.text('Clap once to test!',W/2+300,340,48,'#fff');
      const f=this.flash&&BB.t-this.flash<.4;BB.text(this.heard?`Heard ${this.heard} clap${this.heard>1?'s':''}!`:'...',W/2+300,410,40,f?COL.green:COL.yellow);
      BB.micMeter(W/2+130,470);BB.text('Sensitivity',W/2+215,620,28,'#fff');BB.sensButtons(W/2+115,640);
      BB.button(W/2+350,600,330,140,'CONTINUE',{style:'green',size:48,id:'cont',onClick:()=>BB.go(new MapScene())})}
    BB.captionBox()}}
// ---- Room map ----
class MapScene{constructor(justDone){this.justDone=justDone}
  enter(){this.t0=BB.t;this.toast=null;if(this.justDone)BB.sfx.fanfare()}
  update(){}
  open(i){const r=BB.ROOMS[i];if(!BB.unlocked(i)){this.toast={txt:'LOCKED! Finish the room before it first.',t:BB.t};BB.sfx.bonk();return}
    if(!r.create||!r.create()){this.toast={txt:`${r.name}: COMING SOON!`,t:BB.t};BB.sfx.wobble();return}
    BB.go(r.create())}
  draw(){menuBg();BB.panel(120,40,1680,170,40);BB.text('THE RHYTHM WAREHOUSE',W/2,125,64,'#fff',{font:'Rammetto One',stroke:8});
    // conveyor path
    ctx.fillStyle='#2b3b3a';ctx.fillRect(140,600,1640,40);for(let x=0;x<1640;x+=60){ctx.fillStyle='#4b5f5d';ctx.fillRect(140+((x+BB.t*60)%1640),606,30,28)}
    BB.ROOMS.forEach((r,i)=>{const x=110+i*350,y=300,w=310,h=460,un=BB.unlocked(i),ready=!!r.create,done=BB.save.done.includes(r.id);
      const pop=this.justDone&&BB.ROOMS[i-1]&&BB.ROOMS[i-1].id===this.justDone?1+.06*Math.max(0,Math.sin((BB.t-this.t0)*8))*Math.exp(-(BB.t-this.t0)):1;
      ctx.save();ctx.translate(x+w/2,y+h/2);ctx.scale(pop,pop);ctx.translate(-x-w/2,-y-h/2);
      BB.rrect(x+5,y+10,w,h,30,'rgba(0,0,0,.3)');BB.rrect(x,y,w,h,30,COL.cream,COL.creamEdge,5);BB.rrect(x+16,y+16,w-32,250,22,un?r.col:'#3b4747',COL.ink,4);
      BB.text('ROOM '+(i+1),x+w/2,y+300,30,'#28403c');BB.text(r.name,x+w/2,y+345,34,'#28403c',{font:'Rammetto One',maxW:w-30});BB.text(r.sub,x+w/2,y+392,28,'#5a6e6a',{maxW:w-30});
      const cx=x+w/2,cy=y+140;
      if(!un){ctx.fillStyle='#ffe066';ctx.strokeStyle=COL.ink;ctx.lineWidth=6;ctx.beginPath();ctx.arc(cx,cy-25,38,Math.PI,0);ctx.stroke();ctx.beginPath();ctx.roundRect(cx-55,cy-20,110,90,12);ctx.fill();ctx.stroke()}
      else if(i===0){BB.wholeNote(cx-40,cy+30,44,{glow:.5});BB.pickbot(cx+60,cy+110,170,(Math.sin(BB.t*4)+1)/2)}
      else if(!ready){BB.rrect(cx-120,cy-35,240,70,20,'#ffe066',COL.ink,4);BB.text('COMING SOON',cx,cy+2,32,COL.ink)}
      if(done){BB.star(x+w-40,y+40,34,COL.yellow,0)}
      ctx.restore();
      if(un)BB.button(x+30,y+h-50,w-60,100,done?'PLAY AGAIN':ready?'PLAY':'PEEK',{style:ready?'green':'cream',size:40,id:'room'+i,onClick:()=>this.open(i)});
      else BB.button(x+30,y+h-50,w-60,100,'LOCKED',{size:40,id:'room'+i,onClick:()=>this.open(i)});
    });
    BB.button(60,H-140,300,100,'MIC SETUP',{size:36,id:'mic',onClick:()=>BB.go(new MicScene())});
    if(this.toast&&BB.t-this.toast.t<2.5){const k=Math.min(1,(BB.t-this.toast.t)*5);ctx.save();ctx.globalAlpha=k;BB.rrect(W/2-450,900,900,100,50,'#fff',COL.ink,5);BB.text(this.toast.txt,W/2,952,42,COL.ink);ctx.restore()}}}
BB.MapScene=MapScene;BB.MicScene=MicScene;
// ---- boot ----
async function boot(){ctx.setTransform(1,0,0,1,0,0);
  await Promise.all([BB.loadImages(['sprocket','sorter','turtle','rocket','whisper','boom','tinytv']),document.fonts.load("40px 'Rammetto One'"),document.fonts.load("40px 'Lilita One'")]);
  BB.loadVO(BB.VO_LINES||[]);
  const p=new URLSearchParams(location.search);
  if(p.get('room')==='mine')BB.go(new BB.MineRoom({skipIntro:p.has('skip'),startAt:+p.get('at')||0}));else BB.go(new TitleScene());
  BB.start()}
boot();
})();
