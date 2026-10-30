// Room 5: DELIVERY DOCK (v14.0 first playable prototype). Design: research/delivery_room.md
// Static Jr. jammed the trucks' route codes. Each truck's route label is a 4-beat rhythm. Trucks 1-3: Sprocket plays it,
// the class claps it back (echo). Trucks 4-6: READ mode - Sprocket stays silent, the class reads the notation and claps it.
'use strict';
(()=>{let ctx=BB.ctx;BB._sw.push(g=>ctx=g);const COL=BB.COL,W=BB.W,H=BB.H,{clamp,lerp,ease}=BB,R=BB.R;
BB.VO_LINES=(BB.VO_LINES||[]).concat([
 ['dl_intro',"Static Jr. jammed the delivery trucks! Clap each route code to send the truck on its way!",'sprocket'],
 ['dl_read',"Now I'll stay quiet. Read the route code, and clap it on your own!",'sprocket'],
 ['dl_go',"Route unlocked! Truck away!",'sprocket'],
 ['dl_done',"Every truck is delivered! Level four complete!",'sprocket'],
]);
const TRUCKS=6,POOL=[['q','e','r','h'],['q','e','r','h'],['q','e','r','h','s'],['q','e','r','h'],['q','e','r','h','s'],['q','e','r','h','s']];
const howTo={title:'DELIVERY DOCK: clap the route codes!',steps:['Each truck shows a 4-beat route code.','Trucks 1-3: listen to Sprocket, then clap it back.','Trucks 4-6: READ it and clap - no help!','Good clapping sends the truck out.','No mic? Tap MANUAL OVERRIDE when they nail it.'],
  words:'ta = 1   ti-ti = 2 quick   tika-tika = 4 quicker   ta-ah = 2 beats   rest = silent beat',example:(x,y,w,h,t)=>{}};
class DeliveryRoom{constructor(o={}){this.o=o}
  enter(){BB.groove.start(100,'pack');this.n=this.o.startAt||0;this.state='load';this.said={};this.truckX=-500;this.motes=R.motes(14);
    R.loadImgs([['pack_blur','jpg']]).then(()=>{this.static=R.bake(g=>this.bake(g));this.newTruck()});BB.mic.take()}
  exit(){BB.paused=false}
  bake(g){const V=BB.V2;if(V.pack_blur)g.drawImage(V.pack_blur,0,0,W,H);const wg=g.createLinearGradient(0,0,0,H);wg.addColorStop(0,'rgba(24,40,70,.85)');wg.addColorStop(.62,'rgba(40,64,104,.8)');wg.addColorStop(.62,'#2b2f36');wg.addColorStop(1,'#15181d');g.fillStyle=wg;g.fillRect(0,0,W,H);
    // roll-up dock doors + hazard strip + road lines
    for(let i=0;i<3;i++){const x=260+i*520;g.fillStyle='#1b2433';g.fillRect(x-10,170,420,500);for(let y=180;y<660;y+=34){g.fillStyle=y%68?'#8b97a8':'#727e90';g.fillRect(x,y,400,30)}g.fillStyle='#ffe066';g.font='34px "Rammetto One"';g.textAlign='center';g.fillText('DOCK '+(i+1),x+200,150)}
    for(let x=0;x<W;x+=80){g.fillStyle=(x/80)%2?'#ffe066':'#1e2b29';g.fillRect(x,668,80,18)}g.fillStyle='rgba(255,255,255,.5)';for(let x=40;x<W;x+=220)g.fillRect(x,905,120,10)}
  newTruck(){const read=this.n>=3;this.read=read;this.seq=BB.LabelGen?BB.LabelGen.genRhythm(POOL[this.n],this.last,4):['q','e','q','r'];this.last=this.seq.join('');this.state='in';this.st=BB.t;this.tries=0;this.cb=null;
    if(this.n===0&&!this.said.i){this.said.i=1;this.voEnd=BB.t+(BB.say('dl_intro')||0)}else if(read&&!this.said.r){this.said.r=1;this.voEnd=BB.t+(BB.say('dl_read')||0)}else this.voEnd=BB.t}
  startClap(){this.state='clap';this.cb=new R.ClapBack(this.seq,{bpm:100,read:this.read,onDone:sc=>this.clapDone(sc)})}
  clapDone(sc){this.cb=null;this.tries++;if(sc>=.6||this.tries>=2){this.state='out';this.st=BB.t;BB.sfx.ding();BB.say('dl_go',{overlap:true});BB.burst(this.truckX+300,560,30,{cols:['#ffe066','#fff','#6ee678'],kind:'star',size:14,speed:700,g:400})}
    else{BB.sfx.bonk();this.state='wait';this.st=BB.t;this.voEnd=BB.t+.8}}// one retry, then the truck goes anyway (never stuck)
  manualOverride(){if(BB.t-(this.lastOv||0)<.5)return;this.lastOv=BB.t;this.ovPop=BB.t;if(this.cb)this.cb.override()}
  pause(){BB.paused=true;BB.ac.suspend()}
  resume(){BB.paused=false;BB.ensureMic()}
  update(dt){if(BB.keys.includes('p')){this.pause();return}if(BB.keys.includes(' '))this.manualOverride();const t=BB.t-this.st;
    if(this.state==='in'){this.truckX=lerp(-700,560,ease.out(clamp(t/1.6,0,1)));if(t>1.6&&BB.t>this.voEnd+.3)this.startClap()}
    if(this.state==='wait'&&BB.t>this.voEnd)this.startClap();
    if(this.state==='out'){this.truckX=lerp(560,W+200,ease.inOut(clamp((t-.6)/1.4,0,1)));if(t>2.2){this.n++;if(this.n>=TRUCKS){this.state='end';this.st=BB.t;BB.say('dl_done');BB.celebrate({next:'ROOM MAP'})}else this.newTruck()}}
    if(this.cb)this.cb.update(dt);else BB.mic.take()}
  drawTruck(x,y){const bob=this.state==='out'||this.state==='in'?Math.sin(BB.t*18)*2:0;ctx.save();ctx.translate(x,y+bob);
    R.shadow(ctx,300,250,360,.5);BB.rrect(0,0,470,230,18,BB.lg(0,230,['#f2efe6','#cfcabb']),COL.ink,6);BB.rrect(470,70,170,160,20,BB.lg(70,230,['#6fc7b4','#3f8f84']),COL.ink,6);BB.rrect(500,92,100,64,10,'#bfe9ff',COL.ink,4);
    BB.text('BEAT BOTS EXPRESS',235,36,30,'#3f8f84',{font:'Rammetto One',stroke:0,maxW:440});
    // route label = the rhythm (notation the class reads)
    BB.rrect(20,62,430,150,14,'#fffaf0','#d24a3c',4);{const L=4,bw=100;let b=0;for(const k of this.seq){const w=R.BEATS[k]*bw;R.glyph(k,40+b*bw+w/2,170,R.noteSize(k,w,150)*1.1);b+=R.BEATS[k]}}
    for(const wx of[110,360,560]){ctx.fillStyle='#1e2b29';ctx.beginPath();ctx.arc(wx,236,40,0,7);ctx.fill();ctx.fillStyle='#9aa4a8';ctx.beginPath();ctx.arc(wx,236,16,0,7);ctx.fill()}ctx.restore()}
  draw(){const t=BB.t;if(this.static)ctx.drawImage(this.static,0,0,W,H);R.drawMotes(this.motes,BB.dt||.016,t);
    if(this.state!=='load'&&this.state!=='end')this.drawTruck(this.truckX,560);
    if(this.state==='end'){BB.panel(W/2-560,200,1120,420,40);BB.text('ALL TRUCKS DELIVERED!',W/2,320,64,COL.yellow,{font:'Rammetto One',stroke:8});BB.text(TRUCKS+' route codes clapped',W/2,410,36,'#fff',{stroke:5});
      if(BB.t-this.st>1.6)BB.button(W/2-240,480,480,110,'ROOM MAP',{style:'green',size:52,id:'tomap',onClick:()=>BB.roomDone('finale')});return}
    BB.panel(40,24,520,120,30);BB.text('TRUCKS DELIVERED',70,58,30,COL.yellow,{align:'left',stroke:4});for(let i=0;i<TRUCKS;i++)BB.rrect(70+i*60,84,46,40,8,i<this.n?BB.lg(84,124,['#a6f5ae','#3fb45a']):'#2d4744','#fff',3);
    if(this.read&&this.state!=='out'){BB.rrect(W-560,24,520,90,24,'rgba(30,20,60,.85)','#ff8adf',4);BB.text('READ MODE: no help!',W-300,70,38,'#ffd6f4',{font:'Rammetto One',stroke:5})}
    BB.pauseBtn(()=>this.pause());BB.micMeter(40,H-150);if(this.cb){BB.overrideBtn(()=>this.manualOverride(),{pop:this.ovPop&&t-this.ovPop<.3?1.08:1});this.cb.draw(W/2,H-90)}
    if(this.n===0&&this.state==='in'&&t-this.st<2.6)BB.titleCard('ROOM 5: DELIVERY DOCK','Clap the route codes. Send the trucks!',(BB.t-this.st)/2.6);
    if(BB.paused)BB.pauseOverlay(howTo,()=>this.resume())}}
BB.DeliveryRoom=DeliveryRoom})();
