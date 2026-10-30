// Beat Bots Level 4 engine: canvas scaling, input, audio (Web Audio), mic, UI widgets, particles.
'use strict';
const W=1920,H=1080;
const BB=window.BB={W,H,t:0,paused:false,debug:/[?&]sim=1/.test(location.search)};
const cv=document.getElementById('c');let ctx=cv.getContext('2d');BB.ctx=ctx;
// v13.1 lite floor: the main canvas ignores shadow blur and CSS filters (the two costliest per-draw effects on weak GPUs/CPUs).
// Offscreen bakes use their own contexts, so baked sprites keep their shading.
{const P=CanvasRenderingContext2D.prototype,dSB=Object.getOwnPropertyDescriptor(P,'shadowBlur'),dF=Object.getOwnPropertyDescriptor(P,'filter');
  BB.tierGuard=g=>{if(dSB)Object.defineProperty(g,'shadowBlur',{get(){return dSB.get.call(this)},set(v){dSB.set.call(this,BB.tier===0?0:v)}})};
  if(dSB)Object.defineProperty(ctx,'shadowBlur',{get(){return dSB.get.call(this)},set(v){dSB.set.call(this,BB.tier===0?0:v)}});
  if(dF)Object.defineProperty(ctx,'filter',{get(){return dF.get.call(this)},set(v){dF.set.call(this,BB.tier===0?'none':v)}});}
// v12.8: draw any BB.* helpers into an offscreen context (static-layer baking on phones)
BB._sw=[g=>ctx=g];BB.withCtx=(g,fn)=>{const o=ctx;BB._sw.forEach(f=>f(g));BB.ctx=g;try{fn()}finally{BB._sw.forEach(f=>f(o));BB.ctx=o}};
BB.VERSION='v14.0';try{BB.echoOff=new URLSearchParams(location.search).get('echo')==='0'}catch(e){}
let SC=1,OX=0,OY=0;
// Phones only (never Chromebook/Smartboard/desktop): cap the canvas backing store and allow adaptive quality.
BB.phone=/Android|iPhone|iPod|Mobile/i.test(navigator.userAgent)&&!/CrOS/.test(navigator.userAgent)&&matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<=600;
// v13.1 low-power kid devices (Fire/Silk, Kindle, cheap Android tablets, LeapFrog, older iPads): start on the 'lite' floor
const UA=navigator.userAgent,hc=navigator.hardwareConcurrency||4,mem=navigator.deviceMemory||4;
BB.lowDev=/Silk|KF[A-Z]{2,4}\b|Kindle|LeapFrog|LeapPad/i.test(UA)||(/Android/i.test(UA)&&!BB.phone&&(mem<=2||hc<=4))||(/iPad/.test(UA)&&hc<=2)||(/Macintosh/.test(UA)&&navigator.maxTouchPoints>1&&hc<=2);
// tiers: 2 full, 1 light (sprites baked, fewer extras), 0 lite floor (light + lower resolution, no blur/shadows, fewer particles)
BB.tier=BB.lowDev?0:BB.phone?1:2;try{const f=new URLSearchParams(location.search).get('tier');if(f!=null&&f!=='')BB.tier=+f;BB.tierLock=f!=null&&f!==''}catch(e){}
BB.q=BB.tier>=2?1:0;BB.qUp=0;// phones start in light mode and step up only if they prove fast (avoids a mid-scene resize hitch on slow phones)
// 1 = full extras, 0 = phone low mode
// v13.1 safe areas (notches / rounded corners) read from CSS env(); the 16:9 stage is letterboxed inside them
const safe=document.createElement('div');safe.style.cssText='position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';document.body.appendChild(safe);
function resize(){const vw=innerWidth,vh=innerHeight;let dpr=Math.min(2,window.devicePixelRatio||1);
  // v13.1 backing-store cap per tier (the stage is 1920x1080 logical): full <=1920 px wide (4K boards render 1080p and upscale), light 1280 (phones 880), lite 720
  const cap=BB.tier>=2?1920:BB.tier===1?(BB.phone?880:1280):720;dpr=Math.min(dpr,cap/Math.min(vw,vh*16/9));
  const cs=getComputedStyle(safe),sl=parseFloat(cs.paddingLeft)||0,sr=parseFloat(cs.paddingRight)||0,st=parseFloat(cs.paddingTop)||0,sb=parseFloat(cs.paddingBottom)||0;
  const aw=vw-sl-sr,ah=vh-st-sb;SC=Math.min(aw/W,ah/H);OX=sl+(aw-W*SC)/2;OY=st+(ah-H*SC)/2;
  cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr);cv.style.width=vw+'px';cv.style.height=vh+'px';BB.dpr=dpr;}
addEventListener('resize',resize);resize();BB.resize=resize;
// ---------- helpers ----------
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const ease={out:t=>1-Math.pow(1-t,3),inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  back:t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)},
  elastic:t=>t===0||t===1?t:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2*Math.PI/3)+1};
Object.assign(BB,{clamp,lerp,ease});
const COL=BB.COL={ink:'#19191f',cream:'#e8e2cd',creamEdge:'#968c78',teal:'#142826',teal2:'#50aaa0',
  green:'rgb(110,230,120)',greenOff:'#283c3c',yellow:'#ffe066',red:'#e65046',white:'#fff'};
// ---------- images ----------
const IMG=BB.IMG={};
BB.loadImages=names=>Promise.all(names.map(n=>new Promise(r=>{const i=new Image();i.onload=()=>{IMG[n]=i;r()};i.onerror=()=>r();i.src='assets/'+n+'.png'})));
// ---------- input ----------
const ptr={x:0,y:0,down:false,clicks:[]};BB.ptr=ptr;
function toLogical(e){return{x:(e.clientX-OX)/SC,y:(e.clientY-OY)/SC,id:e.pointerId==null?1:e.pointerId}}
cv.addEventListener('pointerdown',e=>{e.preventDefault();const p=toLogical(e);ptr.x=p.x;ptr.y=p.y;ptr.down=true;BB.unlockAudio();if(mic.state==='off'&&!BB.noAutoMic)BB.startMic();if(!(BB.scene&&BB.scene.pdown&&!BB.paused&&BB.scene.pdown(p)))clickAt(p);});
cv.addEventListener('pointermove',e=>{const p=toLogical(e);ptr.x=p.x;ptr.y=p.y;if(BB.scene&&BB.scene.pmove&&!BB.paused)BB.scene.pmove(p)});/* v13.2: per-pointer moves (multi-touch drag) */
addEventListener('pointercancel',e=>{ptr.down=false;if(BB.scene&&BB.scene.pup)BB.scene.pup(toLogical(e))});
addEventListener('pointerup',e=>{ptr.down=false;if(BB.scene&&BB.scene.pup&&(e.target===cv||BB.scene.pmove))BB.scene.pup(toLogical(e))});
const keys=[];addEventListener('keydown',e=>keys.push(e.key));BB.keys=keys;
// ---------- UI buttons (immediate mode) ----------
// A button only fires if a click lands inside it. Buttons are drawn big for small hands.
let hits=[];
BB.button=(x,y,w,h,label,o={})=>{
  if(o.style==='none'){if(!o.disabled)hits.push({x,y,w,h,id:o.id||label,cb:o.onClick});return}
  const hover=!o.disabled&&ptr.x>x&&ptr.x<x+w&&ptr.y>y&&ptr.y<y+h;
  const pressed=hover&&ptr.down;
  const s=o.pop?o.pop:1, cx=x+w/2,cy=y+h/2;
  ctx.save();ctx.translate(cx,cy);ctx.scale(s*(pressed?.95:1),s*(pressed?.95:1));ctx.translate(-cx,-cy);
  ctx.globalAlpha=o.disabled?.45:1;const st=o.style||'cream';
  BB.rrect(x+4,y+8,w,h,o.r||28,'rgba(0,0,0,.35)');
  if(st!=='flat'){BB.rrect(x-4,y-4,w+8,h+8,(o.r||28)+4,BB.lg(y-4,y+h+4,['#f4f7f6','#9aa6a4','#e2e8e6','#6c7775']),'rgba(20,30,30,.7)',2)}// v12.6 chrome bezel
  const R=o.r||28,sheen=()=>{ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(R,h/2));ctx.clip();BB.rrect(x+10,y+6,w-20,h*.4,Math.max(4,R-10),BB.lg(y,y+h*.45,['rgba(255,255,255,.38)','rgba(255,255,255,.04)']));ctx.restore()};
  if(st==='cream'){BB.rrect(x,y,w,h,R,BB.lg(y,y+h,['#fbf6e6','#e8e2cd','#cbc2a8']),'#8a806b',5);sheen();}
  else if(st==='green'){BB.rrect(x,y,w,h,R,BB.lg(y,y+h,['#6fd884','#3fb45a','#2a8a42']),'#1d5a2c',6);sheen();}
  else if(st==='red'){BB.rrect(x,y,w,h,R,BB.lg(y,y+h,['#f07a6e','#d9483f','#a8302a']),'#6b1d18',6);sheen();}
  else if(st==='teal'){BB.rrect(x,y,w,h,R,BB.lg(y,y+h,['#fbf6e6','#e8e2cd','#cbc2a8']),'#8a806b',5);BB.well(x+12,y+12,w-24,h-24,R-10);}
  const fs=o.size||40;
  BB.btnText(label,cx+(o.labelDx??(o.icon?fs*.55:0)),cy+(o.sub?-fs*.3:2),fs,st,o.font||'Lilita One');
  if(o.sub)BB.btnText(o.sub,cx,cy+fs*.6,fs*.5,st,'Lilita One',1);
  if(o.icon)o.icon(cx-BB.measure(label,fs)/2-fs*.2,cy);
  ctx.restore();
  if(!o.disabled)hits.push({x,y,w,h,id:o.id||label,cb:o.onClick});
};
// v12.7: lettering is part of the button - tinted to the button's enamel, with a dark engraved lip below and a lit edge above
/* v12.8 glare pass: even, matte fills (same per-button tint family), faint top lip */
const BTN_INK={green:{f:['#f1faf2','#e4f8e6','#d3f0da'],e:'#1d5a2c',lo:'rgba(10,50,20,.55)',hi:'rgba(255,255,255,.14)'},
  red:{f:['#fdf1ef','#fde6e2','#f6d0ca'],e:'#6b1d18',lo:'rgba(80,15,10,.55)',hi:'rgba(255,255,255,.14)'},
  cream:{f:['#3b5a55','#28403c','#1a2c29'],e:null,lo:'rgba(255,255,255,.75)',hi:null},teal:{f:['#3b5a55','#28403c','#1a2c29'],e:null,lo:'rgba(255,255,255,.75)',hi:null}};
BB.btnText=(t,x,y,s,st,font='Lilita One',sub)=>{let k=BTN_INK[st]||BTN_INK.cream;ctx.font=`${s}px '${font}'`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  if(sub&&k.e){k={...k,f:['#ffe46a','#ffdc55','#f5c83a']}}
  if(k.e){ctx.lineWidth=Math.max(3,s*.12);ctx.strokeStyle=k.e;ctx.strokeText(t,x,y+s*.05)}
  ctx.fillStyle=k.lo;ctx.fillText(t,x,y+Math.max(1.5,s*.05));if(k.hi){ctx.fillStyle=k.hi;ctx.fillText(t,x,y-Math.max(1,s*.03))}
  ctx.fillStyle=BB.lg(y-s*.45,y+s*.45,k.f);ctx.fillText(t,x,y)};
// v12.7: logo-style rendered lettering (same build as the Beat Bots logo: chunky letters, copper rim, deep extrusion, glossy enamel face). Cached.
const LT={};BB.logoText=(t,cx,cy,s,o={})=>{o={matte:1,...o};const key=t+s+(o.face||'')+(o.maxW||0)+(o.matte?'m':'');let c=LT[key];
  if(!c){const f=`${s}px '${o.font||'Rammetto One'}'`,m=document.createElement('canvas').getContext('2d');m.font=f;let tw=m.measureText(t).width;const sc=o.maxW&&tw+s*.4>o.maxW?o.maxW/(tw+s*.4):1;
    c=document.createElement('canvas');c.width=Math.ceil((tw+s*.5)*sc);c.height=Math.ceil(s*1.75*sc);const g=c.getContext('2d');g.scale(sc,sc);g.font=f;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
    const X=(tw+s*.5)/2,Y=s*.8,face=o.face||(o.matte?['#ffe46a','#ffd84a','#f9cb2c','#f0b81c']:['#fff6b0','#ffe066','#f2b81c','#c98a0c']),rim=o.rim||['#e79a5a','#b5642a','#7a3d12'],D=Math.max(4,s*.13);
    g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=s*.2;g.shadowOffsetY=s*.12;g.fillStyle='#000';g.lineWidth=s*.2;g.strokeText(t,X,Y+D);g.shadowColor='transparent';
    for(let i=D;i>0;i-=1){g.strokeStyle=i>D*.6?'#4a230a':'#6b3410';g.lineWidth=s*.2;g.strokeText(t,X,Y+i)}// extrusion
    const rg=g.createLinearGradient(0,Y-s*.6,0,Y+s*.6);rim.forEach((cc,i)=>rg.addColorStop(i/(rim.length-1),cc));g.strokeStyle=rg;g.lineWidth=s*.2;g.strokeText(t,X,Y);// copper rim
    g.strokeStyle=o.matte?'rgba(255,220,180,.25)':'rgba(255,220,180,.6)';g.lineWidth=s*.04;g.strokeText(t,X,Y-s*.03);
    const fg=g.createLinearGradient(0,Y-s*.45,0,Y+s*.45);const fc=o.matte&&o.face?[face[1],face[1],face[2]]:face;fc.forEach((cc,i)=>fg.addColorStop(i/(fc.length-1),cc));/* v12.8 matte: custom faces use mid tones only (no white top) */g.fillStyle=fg;g.fillText(t,X,Y);// enamel face
    g.save();g.globalCompositeOperation='source-atop';g.fillStyle='rgba(120,70,0,.35)';g.fillText(t,X+s*.03,Y+s*.05);g.fillStyle=fg;g.fillText(t,X-s*.01,Y-s*.01);// inner bevel shade
    const gl=g.createLinearGradient(0,Y-s*.45,0,Y);gl.addColorStop(0,`rgba(255,255,255,${o.matte?.14:.75})`);gl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gl;g.fillRect(0,Y-s*.5,c.width/sc,s*(o.matte?.18:.32));/* v12.8 matte: faint top highlight, solid readable fill */g.restore();
    c.sc=sc;LT[key]=c}
  ctx.drawImage(c,cx-c.width/2,cy-s*.8*c.sc);return c.width};
// Clicks run right inside the tap event (a real user gesture) so the mic prompt and audio resume are allowed.
let lastHits=[];
function clickAt(c){for(let i=lastHits.length-1;i>=0;i--){const b=lastHits[i];if(c.x>b.x&&c.x<b.x+b.w&&c.y>b.y&&c.y<b.y+b.h){BB.sfx.click();b.cb&&b.cb();return true}}
  // v13.1: every button is at least a 44 css-px touch target - a near miss snaps to the closest button
  const pad=22/SC;let best=null,bd=pad;for(const b of lastHits){const dx=Math.max(b.x-c.x,0,c.x-b.x-b.w),dy=Math.max(b.y-c.y,0,c.y-b.y-b.h),d=Math.hypot(dx,dy);if(d<bd){bd=d;best=b}}
  if(best){BB.sfx.click();best.cb&&best.cb();return true}return false}
function dispatchClicks(){lastHits=hits}
// ---------- drawing helpers ----------
BB.rrect=(x,y,w,h,r,fill,stroke,lw)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.lineWidth=lw||3;ctx.strokeStyle=stroke;ctx.stroke()}};
BB.measure=(t,s,f='Lilita One')=>{ctx.font=`${s}px '${f}'`;return ctx.measureText(t).width};
/* glyph-true centred number/label: centres the ink box, not the font em box */
BB.ctext=(t,x,y,s,fill,font='Rammetto One')=>{ctx.font=`${s}px '${font}'`;ctx.textAlign='center';ctx.textBaseline='alphabetic';const m=ctx.measureText(t);ctx.fillStyle=fill;ctx.fillText(t,x+(m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2,y+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2)};
BB.text=(t,x,y,s,fill,o={})=>{ctx.font=`${s}px '${o.font||'Lilita One'}'`;ctx.textAlign=o.align||'center';ctx.textBaseline='middle';
  if(o.maxW){const m=ctx.measureText(t).width;if(m>o.maxW){s=s*o.maxW/m;ctx.font=`${s}px '${o.font||'Lilita One'}'`}}
  if(o.stroke){ctx.lineJoin='round';ctx.lineWidth=o.stroke;ctx.strokeStyle=o.strokeCol||'#000';ctx.strokeText(t,x,y)}
  ctx.fillStyle=fill;ctx.fillText(t,x,y)};
// teal+cream panel (same as l2lib_v4.panel / mockups)
// clay-look panel: soft two-step shadow, lit cream rim, deep teal well with inner shadow + top sheen
BB.lg=(y0,y1,stops)=>{const g=ctx.createLinearGradient(0,y0,0,y1);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));return g};
// v12.6: shaded, beveled enamel plaque with a chrome rim, rivets and soft inner/outer shading (matches the robots + CGI rooms)
// v13.5: bevel sprites are cached per size/colours/scale/sub-pixel phase - the 22px outer shadowBlur re-rasterised on every panel,
// plaque and button every frame was the main tier>0 cost in every room. Drawn at the identical device pixel, so it looks the same.
const BVC=new Map();BB.bevelCache=true;
BB.bevel=(x,y,w,h,r,cols)=>{const T=ctx.getTransform();if(!BB.bevelCache||T.b||T.c||T.a!==T.d||!(T.a>0))return bevelLive(x,y,w,h,r,cols);
  const M=40,s=T.a,X0=T.a*(x-M)+T.e,Y0=T.d*(y-M)+T.f,ix=Math.floor(X0),iy=Math.floor(Y0),fx=+(X0-ix).toFixed(3),fy=+(Y0-iy).toFixed(3);
  const k=w+'|'+h+'|'+r+'|'+(cols?cols.join(','):'')+'|'+s.toFixed(4)+'|'+fx+'|'+fy+'|'+BB.tier;let c=BVC.get(k);
  if(!c){if(BVC.size>400)BVC.clear();c=document.createElement('canvas');c.width=Math.ceil((w+M*2)*s+2);c.height=Math.ceil((h+M*2)*s+2);const g=c.getContext('2d');BB.tierGuard(g);
    g.setTransform(s,0,0,s,fx-s*(x-M),fy-s*(y-M));BB.withCtx(g,()=>bevelLive(x,y,w,h,r,cols));BVC.set(k,c)}
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(c,ix,iy);ctx.restore()};
const bevelLive=(x,y,w,h,r,cols=['#fdf8ea','#e9e2cc','#c9bfa3'])=>{ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=22;ctx.shadowOffsetY=10;
  BB.rrect(x-4,y-4,w+8,h+8,r+4,BB.lg(y-4,y+h+4,['#f4f7f6','#9aa6a4','#e2e8e6','#6c7775']));ctx.restore();// chrome rim
  BB.rrect(x-4,y-4,w+8,h+8,r+4,null,'rgba(20,30,30,.75)',2.5);
  BB.rrect(x,y,w,h,r,BB.lg(y,y+h,cols));// enamel
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));ctx.clip();
  BB.rrect(x+2,y+2,w-4,h-4,r,null,'rgba(255,255,255,.75)',3);// top-left bevel light
  ctx.strokeStyle='rgba(60,45,20,.28)';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(x-2,y-2,w+2,h+2,Math.min(r,h/2,w/2));ctx.stroke();
  const g=ctx.createRadialGradient(x+w*.3,y,0,x+w*.3,y,Math.max(w,h));g.addColorStop(0,'rgba(255,240,200,.18)');g.addColorStop(1,'rgba(255,240,200,0)');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);// scene lamp
  ctx.restore()};
BB.rivet=(x,y,s=5)=>{ctx.fillStyle='rgba(40,30,15,.35)';ctx.beginPath();ctx.arc(x+s*.25,y+s*.4,s*1.05,0,7);ctx.fill();ctx.fillStyle=BB.lg(y-s,y+s,['#ffffff','#a9b3b1','#5d6866']);ctx.beginPath();ctx.arc(x,y,s,0,7);ctx.fill();ctx.strokeStyle='rgba(20,30,30,.6)';ctx.lineWidth=1.5;ctx.stroke()};
BB.plaque=(cx,cy,w,h,txt,size,col='#28403c',o={})=>{const x=cx-w/2,y=cy-h/2,r=o.r??Math.min(12,h/3);BB.bevel(x,y,w,h,r,o.cols);if(w>90&&!o.noRivet){BB.rivet(x+9,cy,3.2);BB.rivet(x+w-9,cy,3.2)}
  if(txt)BB.text(txt,cx,cy+1,size,col,{maxW:w-(w>90?30:12),stroke:o.stroke,font:o.font})};
// v12.7: rivets sit on the flat run of the cream rim just past each rounded corner - never on the border/curve, never on the well
BB.panelRivets=(x,y,w,h,r)=>{const ix=Math.max(14,r*.95),iy=8.5,s=3.4;for(const [rx,ry] of[[x+ix,y+iy],[x+w-ix,y+iy],[x+ix,y+h-iy],[x+w-ix,y+h-iy]])BB.rivet(rx,ry,s)};
BB.panel=(x,y,w,h,r=30)=>{BB.bevel(x,y,w,h,r);
  BB.panelRivets(x,y,w,h,r);
  BB.well(x+18,y+16,w-36,h-32,r-8)};
BB.well=(x,y,w,h,r)=>{BB.rrect(x,y,w,h,r,BB.lg(y,y+h,['#0e1f1d','#173230','#11302c']),COL.teal2,5);
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2,w/2));ctx.clip();ctx.fillStyle=BB.lg(y,y+22,['rgba(0,0,0,.35)','rgba(0,0,0,0)']);ctx.fillRect(x,y,w,22);
  ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x+5,y+5,w-10,h-10,Math.max(2,Math.min(r,h/2,w/2)-5));ctx.stroke();ctx.restore()};
BB.glow=(x,y,r,col,a=1)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col.replace('A',a));g.addColorStop(1,col.replace('A',0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r)};
// ---------- particles + shake ----------
const parts=[];BB.parts=parts;
BB.burst=(x,y,n,o={})=>{if(BB.tier<2){n=Math.ceil(n*(BB.tier?.4:.25));if(parts.length>(BB.tier?70:40))return}for(let i=0;i<n;i++){const a=(o.a0??0)+(o.spread??Math.PI*2)*Math.random(),sp=(o.speed||400)*(.4+Math.random()*.8);
  parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(o.up||0),life:o.life||.8,age:0,size:(o.size||10)*(.6+Math.random()*.8),col:o.cols?o.cols[i%o.cols.length]:(o.col||'#ffe066'),g:o.g??900,kind:o.kind||'spark',rot:Math.random()*6,w:o.world?1:0})}};
BB.updParts=dt=>{for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.age+=dt;if(p.age>p.life){parts.splice(i,1);continue}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*(p.kind==='dust'?3:.5);p.rot+=dt*5}};
BB.drawParts=(world=0)=>{for(const p of parts){if((p.w||0)!==world)continue;const k=1-p.age/p.life;ctx.globalAlpha=Math.min(1,k*1.5);ctx.fillStyle=p.col;
  if(p.kind==='spark'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.fillRect(-p.size,-p.size*.2,p.size*2,p.size*.4);ctx.restore()}
  else if(p.kind==='star'){BB.star(p.x,p.y,p.size*k+2,p.col,p.rot)}
  else{ctx.beginPath();ctx.arc(p.x,p.y,p.size*(p.kind==='dust'?(1.5-k*.5):k),0,7);ctx.fill()}}ctx.globalAlpha=1};
BB.star=(x,y,r,col,rot=0)=>{ctx.beginPath();for(let i=0;i<10;i++){const a=rot+i*Math.PI/5,rr=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=COL.ink;ctx.stroke()};
let shakeAmt=0;BB.shake=a=>shakeAmt=Math.min(6,Math.max(shakeAmt,a));// capped at 6px per design doc
// ---------- audio ----------
// v13.2 progressive enhancement: old boards may lack Web Audio or the options form; never let audio stop the game loading
function silentAC(){const t0=performance.now(),node=()=>new Proxy(function(){},{get:(o,k)=>k==='connect'?(()=>node()):k==='gain'||k==='frequency'||k==='Q'||k==='detune'||k==='playbackRate'||k==='offset'?{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}}:(()=>node()),set:()=>true});
  return new Proxy({},{get:(o,k)=>k==='currentTime'?(performance.now()-t0)/1000:k==='state'?'running':k==='sampleRate'?44100:k==='destination'?node():k==='resume'||k==='suspend'||k==='close'?(()=>Promise.resolve()):k==='decodeAudioData'?(()=>Promise.reject(new Error('no audio'))):k==='createBuffer'?((c,n,r)=>({getChannelData:()=>new Float32Array(n),length:n,sampleRate:r,duration:n/r})):k==='outputLatency'||k==='baseLatency'?0:(()=>node())})}
const AC=window.AudioContext||window.webkitAudioContext;let ac;try{ac=new AC({latencyHint:'interactive'})}catch(e){try{ac=new AC()}catch(e2){ac=silentAC();BB.noAudio=true}}BB.ac=ac;// v13.2 beat lights follow what the class HEARS: audio leaves the speaker outputLatency after it is scheduled (big on HDMI/Bluetooth boards)
BB.visLat=()=>Math.min(.25,Math.max(0,(ac.outputLatency||ac.baseLatency||0)+(BB.visLatAdd||0)));
const master=ac.createGain();master.gain.value=.9;master.connect(ac.destination);BB.outBus=master;
const sfxBus=ac.createGain();sfxBus.connect(master);const voBus=ac.createGain();voBus.gain.value=1.1;voBus.connect(master);
BB.unlockAudio=()=>{if(ac.state!=='running'&&!BB.paused&&!document.hidden){ac.resume().catch(()=>{});
  // v13.1 iOS/Silk/old WebView: a 1-sample silent buffer started inside the gesture is what actually unlocks output
  try{const b=ac.createBuffer(1,1,22050),s=ac.createBufferSource();s.buffer=b;s.connect(ac.destination);s.start(0)}catch(e){}}};
// v13.1 unlock on whichever gesture comes first (touchend is the one iOS honours; keys for Chromebook keyboards / clickers)
for(const ev of ['touchend','click','keydown','pointerup'])addEventListener(ev,()=>BB.unlockAudio(),{passive:true});
// v13.1 output meter for the playback-aware clap filter (whole mix: groove, voice, effects)
const outAn=ac.createAnalyser();outAn.fftSize=256;outAn.smoothingTimeConstant=0;master.connect(outAn);const outBuf=new Float32Array(outAn.fftSize);
BB.outRms=()=>{outAn.getFloatTimeDomainData(outBuf);let s=0;for(let i=0;i<outBuf.length;i++)s+=outBuf[i]*outBuf[i];return Math.sqrt(s/outBuf.length)};
const liftBus=ac.createGain();liftBus.connect(sfxBus);setInterval(()=>{const talk=BB.talking&&BB.t<BB.talking.until+.15;liftBus.gain.setTargetAtTime(talk?.18:1,ac.currentTime,.08)},60);
const noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);{const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec)}
function osc(type,f,t,dur,peak,f2,dest=sfxBus){BB.selfSound(t,dur,(type==='sine'||type==='triangle')&&!f2?[f]:null);const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);env(g,t,.004,peak,dur);o.connect(g).connect(dest);o.start(t);o.stop(t+dur+.05)}
function noise(t,dur,peak,ftype,f,q=1,f2){BB.selfSound(t,dur,null);const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf;fl.type=ftype;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;env(g,t,.003,peak,dur);s.connect(fl).connect(g).connect(sfxBus);s.start(t,Math.random()*.5);s.stop(t+dur+.05)}
const now=()=>ac.currentTime;
// v14.0 real drum one-shots (CC0, assets/drums/LICENSE.txt) replace the synth ka-chunks/cracks; synth is the fallback until loaded
const DR={};['kick','snare','hat','tom','tomlo'].forEach(n=>fetch('assets/drums/'+n+'.mp3').then(r=>r.arrayBuffer()).then(b=>ac.decodeAudioData(b)).then(x=>DR[n]=x).catch(()=>{}));
function drum(n,t,v=1,rate=1){const b=DR[n];if(!b)return false;BB.selfSound(t,Math.min(.5,b.duration),null);const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;s.playbackRate.value=rate;g.gain.value=v*(BB.boxVol||1);s.connect(g).connect(sfxBus);s.start(t);return true}
BB.drum=drum;
BB.sfx={
  // v13.0 packing playback voices (robot/factory): ka-chunk ta, double blips ti-ti, quad blips tika-tika, hum for long notes, soft hiss rest
  pkTa:(t=now())=>{if(drum('kick',t,.9)){drum('snare',t,.35);return}noise(t,.07,.35,'lowpass',2200,1,300);osc('square',120,t,.13,.16,60)},
  pkBlip:(t=now(),f=1100)=>{if(drum('hat',t,.8,f/1100))return;osc('square',f,t,.05,.09,f*.8)},
  pkHum:(t=now(),d=.6)=>{if(drum('tomlo',t,.8))return;noise(t,.06,.3,'lowpass',2000,1,300);osc('sawtooth',196,t,d,.07,180);osc('square',98,t,d*.8,.05)},
  pkHiss:(t=now(),d=.4)=>{noise(t,d,.035,'highpass',5000,1)},
  click:(t=now())=>{osc('square',900,t,.05,.08,600)},
  tick:(t=now(),acc=false,v=1)=>{osc('sine',acc?1320:880,t,.06,.18*v)},// pure tone so the mic can tell it apart from claps,
  tink:(t=now(),v=1,quiet)=>{osc('triangle',2200,t,.18,.22*v);osc('sine',3300,t,.12,.1*v);if(!quiet)noise(t,.04,.15*v,'bandpass',4000,3)},// quiet: no noise burst (cave-in whisper claps)
  crack:(t=now())=>{if(drum('snare',t,.9))return;noise(t,.25,.5,'lowpass',2500,1,300);osc('square',140,t,.12,.15,60)},
  rumble:(t=now(),d=1.2)=>{noise(t,d,.35,'lowpass',180,1,60)},
  chime:(t=now())=>{[523,659,784,1046].forEach((f,i)=>osc('sine',f,t+i*.07,1.2,.14));},
  ding:(t=now())=>{osc('sine',1568,t,.6,.2);osc('sine',2093,t+.06,.6,.15)},
  boom:(t=now())=>{if(drum('kick',t,1)){drum('tomlo',t,.6);return}osc('sine',120,t,.5,.6,40);noise(t,.4,.4,'lowpass',800,1,80)},
  shhh:(t=now())=>{noise(t,.9,.18,'highpass',3000)},
  burp:(t=now())=>{if(drum('tomlo',t,.7,.7))return;osc('sawtooth',110,t,.45,.25,70);noise(t,.4,.1,'lowpass',400)},
  whoosh:(t=now(),d=.6)=>{noise(t,d,.3,'bandpass',300,2,3000)},
  bonk:(t=now())=>{if(drum('tom',t,.8))return;osc('square',600,t,.15,.18,150);osc('sine',300,t,.2,.25,120)},
  pebble:(t=now())=>{osc('triangle',1200+Math.random()*600,t,.06,.12);},
  clunk:(t=now())=>{if(drum('tomlo',t,.8,.8))return;noise(t,.18,.4,'lowpass',600);osc('square',90,t,.15,.2,50)},
  alarm:(t=now())=>{for(let i=0;i<3;i++)osc('sawtooth',500,t+i*.4,.35,.12,900)},
  pop:(t=now())=>{osc('sine',400,t,.12,.25,1400)},
  wobble:(t=now())=>{osc('sine',300,t,.3,.15,180);noise(t,.3,.12,'lowpass',500)},
  glitch:(t=now())=>{if(drum('hat',t,.6,1.4)){drum('hat',t+.08,.5,1.2);drum('snare',t+.16,.4,1.3);return}for(let i=0;i<5;i++)osc('square',200+Math.random()*1500,t+i*.04,.04,.06)},
  fanfare:(t=now())=>{[[523,0],[659,.15],[784,.3],[1046,.45],[784,.7],[1046,.85]].forEach(([f,d])=>{osc('square',f,t+d,.25,.08);osc('triangle',f,t+d,.3,.15)})},
  // v12.7 mine lift: smooth low rumble + geared whir + soft cable ticks (no 55 Hz sawtooth buzz). Ducks under voice lines.
  motor:(t=now(),d=2)=>{const g=ac.createGain(),lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;lp.Q.value=.5;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.22,t+.35);g.gain.setValueAtTime(.22,t+Math.max(.4,d-.45));g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(lp).connect(liftBus);
    const n=ac.createBufferSource();n.buffer=noiseBuf;n.loop=true;const nb=ac.createBiquadFilter();nb.type='bandpass';nb.frequency.value=110;nb.Q.value=.9;const ng=ac.createGain();ng.gain.value=.9;n.connect(nb).connect(ng).connect(g);n.start(t);n.stop(t+d+.05);
    for(const [f,a] of[[72,.35],[144,.12]]){const o=ac.createOscillator(),og=ac.createGain(),lfo=ac.createOscillator(),lg=ac.createGain();o.type='sine';o.frequency.value=f;lfo.frequency.value=5.5;lg.gain.value=f*.012;lfo.connect(lg).connect(o.frequency);og.gain.value=a;o.connect(og).connect(g);o.start(t);lfo.start(t);o.stop(t+d+.05);lfo.stop(t+d+.05)}
    for(let k=.5;k<d-.3;k+=.55){const o=ac.createOscillator(),og=ac.createGain();o.type='triangle';o.frequency.value=230+Math.random()*30;og.gain.setValueAtTime(.0001,t+k);og.gain.exponentialRampToValueAtTime(.05,t+k+.02);og.gain.exponentialRampToValueAtTime(.0001,t+k+.12);o.connect(og).connect(liftBus);o.start(t+k);o.stop(t+k+.15)}},
};

// ---------- v12.7 background groove: quiet, beat-locked, no clap-like transients ----------
// Only soft, rounded low tones (< 300 Hz, 25 ms+ attacks): the clap detector's broadband test ignores everything under 300 Hz,
// and there is no noise/hat/snare at all. Ducks under any voice line. Locks to the room's beat clock via sync(t0,spb).
// v12.8: the groove moved to js/groove.js (BB.makeGroove; per-room styles, phone-lite graph).
// ---------- v12.7 room-complete celebration: Level 1 video fanfare + confetti waves + Static Jr. dashes off to the next room ----------
let fanBuf=null;fetch('assets/fanfare.mp3').then(r=>r.arrayBuffer()).then(b=>ac.decodeAudioData(b)).then(b=>fanBuf=b).catch(()=>{});
BB.celebrate=(o={})=>{BB.groove&&BB.groove.stop();BB.selfSound(ac.currentTime,8.6,null);
  if(fanBuf){const s=ac.createBufferSource(),g=ac.createGain();g.gain.value=.8;s.buffer=fanBuf;s.connect(g).connect(sfxBus);s.start()}else BB.sfx.fanfare();
  BB.cele={t:BB.t,next:o.next||''}};
BB.drawCelebrate=()=>{const c=BB.cele;if(!c)return;const t=BB.t-c.t;if(t>9){BB.cele=null;return}
  const cols=['#ffe066','#6ee678','#fff','#e65046','#5ac8fa','#ff9ad5'];
  for(const [tt,x] of[[0,W*.2],[.35,W*.8],[.8,W*.5],[1.5,W*.3],[2.1,W*.7],[3,W*.5]])if(t>=tt&&!c['b'+tt]){c['b'+tt]=1;BB.burst(x,H*.25,45,{cols,kind:Math.random()<.5?'star':'spark',size:15,speed:900,g:500,life:2.2,up:300})}
  // Static Jr. scampers across the floor and out the right side, toward the next room
  if(t>1.2&&t<5.5&&BB.staticJr){const k=(t-1.2)/3.6,x=-120+k*(W+260),y=H-60;BB.contactShadow(x,y,50,.4);
    BB.staticJr(x,y,120,{spd:420,run:1,flip:false,rot:Math.sin(t*20)*.06});
    if(BB.q&&Math.random()<.5)BB.burst(x-40,y-6,2,{cols:['rgba(220,200,170,.8)'],kind:'dust',size:8,speed:80,g:-30,life:.5});
    if(c.next&&k<.85){ctx.save();ctx.globalAlpha=Math.min(1,(t-1.2)*3);BB.plaque(x+170,y-150,240,46,c.next+'  ▶',22,'#b5482a',{font:'Rammetto One',noRivet:1});ctx.restore()}}};
// voice lines (Piper, Sprocket voice from the video pipeline). Caption shown while playing.
const VO={};BB.voText={};BB.caption=null;
// v13.1 VO loads 2 at a time in script order (first lines first) instead of all at once - avoids a decode spike / memory peak on Fire & Chromebooks
BB.loadVO=async list=>{for(const [k,txt,who] of list)BB.voText[k]={txt,who};let i=0;const one=async()=>{while(i<list.length){const k=list[i++][0];try{const r=await fetch('vo/'+k+'.mp3');const ab=await r.arrayBuffer();VO[k]=await new Promise((res,rej)=>{const p=ac.decodeAudioData(ab,res,rej);if(p&&p.then)p.then(res,rej)})}catch(e){}}};await Promise.all([one(),one()])};
let voSrc=null;
BB.say=(k,o={})=>{const info=BB.voText[k]||{txt:k,who:'sprocket'};const b=VO[k];
  if(voSrc&&!o.overlap){try{voSrc.stop()}catch(e){}}
  const dur=b?b.duration:Math.max(1.6,info.txt.length*.06);
  if(b){const s=ac.createBufferSource();s.buffer=b;s.connect(voBus);s.start();if(!o.overlap)voSrc=s}
  if(!o.nocap)BB.caption={txt:info.txt,who:info.who,until:BB.t+dur+.4,start:BB.t};
  BB.talking={who:info.who,until:BB.t+dur};return dur};
BB.isTalking=w=>BB.talking&&BB.talking.who===w&&BB.t<BB.talking.until;
// ---------- microphone: RMS meter + clap onset detection ----------
const mic=BB.mic={ok:false,state:'off',rms:0,level:0,peak:0,floor:.005,sens:1,onsets:[],lastOn:-1,tickLevel:0,hold:0};
const sensSteps=[.5,.7,1,1.4,2,2.8];mic.sensIdx=2;
try{const v=+localStorage.getItem('bb_sens');if(v>=0&&v<=5&&localStorage.getItem('bb_sens')!==null)mic.sensIdx=v}catch(e){}
BB.setSens=i=>{mic.sensIdx=Math.max(0,Math.min(5,i));try{localStorage.setItem('bb_sens',mic.sensIdx)}catch(e){}};
BB.startMic=async()=>{if(mic.starting)return mic.starting;mic.state='asking';mic.err='';ac.resume().catch(()=>{});
  return mic.starting=(async()=>{try{
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw{name:'NoSupport'};
    const st=await MicCore.start(true,BB.aec);mic.ac=MicCore.ctx;mic.stream=st;mic.track=MicCore.track();try{if(mic.lat==null&&window.GroupGate){const ts=mic.track&&mic.track.getSettings?mic.track.getSettings():{};mic.latEst=(ts.latency||0)+micLat();GroupGate.setLat(mic.latEst)}}catch(e){}// v13.2: no beep test yet -> seed latency from the browser's own numbers (USB mics add 50-150 ms); Mine refines it livemic.floor=.003;mic.prev=0;
    if(mic.track)mic.track.onended=()=>{mic.ok=false;mic.state='lost';mic.err='Microphone disconnected. Tap MIC SETUP to turn it back on.'};
    mic.ok=true;mic.state='on';if(BB.MLP&&BB.MLP.on)BB.MLP.init();if(window.C96)C96.start();return true}
  catch(e){const n=e&&e.name;mic.ok=false;
    mic.state=(n==='NotFoundError'||n==='DevicesNotFoundError')?'nodevice':(n==='NotAllowedError'||n==='SecurityError'||n==='PermissionDeniedError')?'denied':'error';
    mic.err=mic.state==='denied'?'Mic permission is blocked. Click the mic/lock icon in the address bar, choose Allow, then reload.':
      mic.state==='nodevice'?'No microphone found. Plug one in or check Chromebook sound settings, then try again.':
      n==='NoSupport'?'This browser cannot use the mic here (some tablets, like Fire/Silk, block it). Use the MANUAL tap button to play along!':'The mic could not start ('+(n||'unknown')+'). Close other apps using the mic and try again.';
    return false}finally{mic.starting=null}})()};
// mic health: after resume / tab return, make sure the audio clock runs again
BB.ensureMic=()=>{if(ac.state!=='running')ac.resume().catch(()=>{});if(MicCore.ctx&&MicCore.ctx.state!=='running')MicCore.ctx.resume().catch(()=>{});mic.onsets=[];mic.prev=0};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!BB.paused)BB.ensureMic()});
// Called every frame. Onset = sharp energy jump above an adaptive noise floor (on the echo residual), 200 ms minimum gap
// (120 ms in tika-tika clap-backs; a much louder burst inside the gap is passed once, flagged up:1 = same group clap).
// ---------- self-sound rejection ----------
// Every sound the game makes is logged with its time. Onsets heard while a noisy/harmonic effect plays are ignored.
// Onsets during a pure-tone beep only count if the mic hears broadband (clap-like) energy away from the beep pitches.
const selfWins=[];BB.selfSound=(t,dur,freqs)=>{selfWins.push({t,e:t+dur,freqs});if(window.ClapDet)ClapDet.TickLat.note(t,dur,freqs);if(selfWins.length>200)selfWins.splice(0,selfWins.length-200)};
mic.lat=null;
// v13.1 echo cancellation: on by default on Chromebooks (speaker right next to the mic); ?aec=0/1 or localStorage bb_aec overrides
{let a=false;// v13.8: Chrome's echo canceller ducked claps under our own ticks (teacher laptop: lvl ~0.001, 0/8 claps); EchoGate already removes our output. ?aec=1 still turns it on
 try{const q=new URLSearchParams(location.search).get('aec'),l=localStorage.getItem('bb_aec');if(l!=null)a=l==='1';if(q!=null)a=q==='1'}catch(e){}BB.aec=a}// measured speaker->mic delay (s); null = not calibrated yet
BB.micLat=()=>micLat();function micLat(){const TL=window.ClapDet&&ClapDet.TickLat;if(TL&&TL.heard(ac.currentTime))return TL.lat;return mic.lat!=null?mic.lat:(ac.outputLatency||ac.baseLatency||.02)+((MicCore.ctx&&MicCore.ctx.baseLatency)||.01)+.03}
let fbin=null,nonTonalFloor=1e-9;const ALLF=[880,1320];
function nonTonalEnergy(freqs){const an=MicCore.an;if(!an)return 0;if(!fbin||fbin.length!==an.frequencyBinCount)fbin=new Float32Array(an.frequencyBinCount);
  an.getFloatFrequencyData(fbin);const hz=MicCore.ctx.sampleRate/an.fftSize;let e=0,tot=0;
  for(let i=Math.floor(300/hz);i<Math.min(fbin.length,Math.floor(9000/hz));i++){const f=i*hz,pw=Math.pow(10,fbin[i]/10);tot+=pw;
    if(freqs&&freqs.some(b=>{for(let k=1;k<=5;k++)if(Math.abs(f-b*k)<90)return true;return false}))continue;e+=pw}
  nonTonalEnergy.frac=tot>0?e/tot:0;return e}
function selfCheck(T){const L=micLat();let tonal=null;
  for(const w of selfWins){if(T<w.t+L-.04)continue;
    // v12.2: a noise sound (tink/boom after a hit) hard-blocks only its ATTACK, not its whole decaying tail - the long
    // boom tail used to swallow the next beats in forte (and the next beat at Allegro). The onset jump rule handles tails.
    if(!w.freqs){if(T<=Math.min(w.e,w.t+.06)+L+.05)return'hard';continue}
    if(T<=w.e+L+.06)(tonal=tonal||[]).push(...w.freqs)}
  return tonal}
BB.selfWins=selfWins;
mic.update=dt=>{if(!mic.ok||BB.paused)return;
  {const TL=window.ClapDet&&ClapDet.TickLat;if(TL&&TL.active()&&MicCore.an){const an=MicCore.an,fb=mic._tfb=mic._tfb||new Float32Array(an.frequencyBinCount),hz=MicCore.ctx.sampleRate/an.fftSize;an.getFloatFrequencyData(fb);
    const was=TL.lat;TL.frame(ac.currentTime-.02,f=>{const k=Math.round(f/hz);return Math.max(fb[k-1],fb[k],fb[k+1])});// v13.2 metronome ticks -> live latency
    if(TL.lat!=null&&TL.lat!==was&&window.GroupGate)GroupGate.setLat(TL.lat)}}
  const r=MicCore.read();const rms=r.rms;mic.rms=rms;mic.raw=rms;mic.max=r.max;const sens=sensSteps[mic.sensIdx];
  const lvl=window.GroupGate?GroupGate.lvl(rms,sens):clamp(Math.sqrt(rms*sens*6),0,1);// same scale as the meter and the soft-clap threshold
  mic.level=Math.max(lvl,mic.level-dt*1.8);
  const tNow=ac.currentTime-.02;
  if(window.GroupGate){GroupGate.push(tNow,GroupGate.hf(MicCore.buf),dt);GroupGate.sensMul=sens}// group-clap gate log
  const softOn=BB.softClap&&BB.t-BB.softClap<.5;const thr=window.GroupGate?GroupGate.onsetThr(mic.floor,sens,softOn):Math.max(mic.floor*2.2+.0015,.003)/sens;mic.thr=thr;// shared rule (group.js)
  const nt=nonTonalEnergy(ALLF);
  const oR=BB.outRms(),EG=BB.echoOff?null:window.EchoGate;if(EG){EG.push(ac.currentTime,oR);if(tNow-mic.lastOn>.3)EG.learn(rms,EG.outAt(tNow,micLat()).peak)}
  // v13.2: onsets are found on the residual after removing the predicted echo of our own output (x = rms when silent)
  const CD=window.ClapDet,x=CD&&EG&&EG.on?EG.resid(tNow,rms,micLat()):rms;
  const gap=CD?CD.gapOk(mic,tNow,x):(tNow-mic.lastOn>.12?1:0);
  const jmp=window.GroupGate?GroupGate.adaptJump(x,softOn&&BB.fastSoft&&BB.t-BB.fastSoft<.5?GroupGate.ONSET_JUMP_FS:GroupGate.ONSET_JUMP):1.3;
  if(x>thr&&(CD&&CD.jumpOk?CD.jumpOk(mic,x,mic.prev||0,jmp,tNow):x>mic.prev*jmp)&&gap){const prevOn=mic.lastOn;mic.lastOn=tNow;if(window.GroupGate)GroupGate.adaptPeak(x);
    const chk=selfCheck(tNow);let ok=true,sg=null;
    if(chk==='hard')ok=false;
    else if(chk){const e=nonTonalEnergy(chk);ok=nonTonalEnergy.frac>.6&&e>nonTonalFloor*6}// clap = mostly broadband energy
    if(ok&&EG&&!EG.check(tNow,rms,micLat(),thr)){ok=false;mic.echoRej=(mic.echoRej||0)+1}// v13.1 playback-aware: drop onsets explained by our own speaker output
    // v13.2 spectral clap signature: reject voiced speech, 's'/'sh' and other non-clap onsets (fbin was just read by nonTonalEnergy)
    if(ok&&CD&&fbin&&!BB.noSig){sg=CD.sig(i=>Math.pow(10,fbin[i]/10),fbin.length,MicCore.ctx.sampleRate/MicCore.an.fftSize);sg.imp=CD.impulse(MicCore.buf);if(CD.isVoice(sg)){ok=false;mic.voiceRej=(mic.voiceRej||0)+1}}
    if(CD){if(ok){if(gap!==2&&CD.fired)CD.fired(mic,x);mic.up=gap===2;mic.lastX=gap===2?Math.max(mic.lastX||0,x):x}else mic.lastOn=prevOn}// a rejected onset must not start a refractory window
    if(mic.calib)mic.calib.push(tNow);
    if(BB.debugMic)(mic.log=mic.log||[]).push([+tNow.toFixed(3),chk==='hard'?'hard':chk?'tone':'none',ok,+(chk&&chk!=='hard'?(nonTonalEnergy(chk),nonTonalEnergy.frac):0).toFixed(2),BB.talking&&BB.t<BB.talking.until?'vo':'',sg?[+sg.hfr.toFixed(2),+sg.flat.toFixed(2),+sg.imp.toFixed(1)]:'',gap]);
    if(ok){const lv=window.GroupGate?((BB.dynMode&&BB.t-BB.dynMode<.5)||GroupGate.notePeak(rms),GroupGate.lvl(rms,sens)):lvl;{const on={t:tNow,lvl:lv,rms,up:gap===2?1:0};if(!BB.MLP||!BB.MLP.on||BB.MLP.submit(on,tNow))mic.onsets.push(on)}mic.peak=lvl;mic.hold=.6}else mic.rejected=(mic.rejected||0)+1}
  else if(x<thr){const nf=lerp(mic.floor,Math.min(x,.05),dt*.8);mic.floor=CD&&CD.active&&CD.active(tNow)&&tNow-mic.lastOn<.35?Math.min(mic.floor,nf):nf}// v13.3: claps' reverb tails between fast claps must not lift the floor
  if(CD&&CD.track)CD.track(mic,x,tNow);
  if(x<thr)nonTonalFloor=lerp(nonTonalFloor,Math.max(nt,1e-9),Math.min(1,dt*2));mic.prev=Math.max(x,(mic.prev||0)*(window.GroupGate?GroupGate.adaptDecay():.6));mic.hold-=dt;if(mic.hold<0)mic.peak=Math.max(0,mic.peak-dt)};
mic.take=()=>{const o=mic.onsets;mic.onsets=[];return o};
// Simulated class (debug ?sim=1): claps on the beat with the requested loudness.
BB.simClap=(t,lvl)=>{mic.onsets.push({t,lvl,sim:1});mic.level=lvl;mic.peak=lvl;mic.hold=.4};
// ---------- main loop ----------
BB.scene=null;BB.go=s=>{BB.scene&&BB.scene.exit&&BB.scene.exit();BB.groove&&BB.groove.stop();BB.scene=s;parts.length=0;s.enter&&s.enter()};
let last=performance.now(),last0=last,perfN=0,perfS=0,perfBad=0,perfGood=0,bootT=last;
BB.setTier=t=>{BB.tier=Math.max(0,Math.min(2,t));BB.q=BB.tier>=2?1:0;BB.tierT=performance.now();resize();BB.onTier&&BB.onTier()};
// v13.1 tab hidden -> stop drawing and suspend audio; back -> resume (rAF already stops, this also silences the groove)
document.addEventListener('visibilitychange',()=>{if(document.hidden){ac.suspend().catch(()=>{})}else{last=performance.now();if(!BB.paused)ac.resume().catch(()=>{})}});
function frame(ts){let dt=Math.min(.05,(ts-last)/1000);last=ts;
  // v13.1 auto quality (all devices): after a 1.5 s settle, 0.6 s windows of frame time step the tier down when slow
  // (>22 ms twice = under ~45 fps); one step up per session when clearly fast (<14 ms x4) so it never flaps.
  if(!BB.tierLock&&ts-bootT>1500&&!document.hidden){perfN++;perfS+=ts-last0;if(perfS>=600){const av=perfS/perfN;
    if(av>22&&BB.tier>0){if(++perfBad>=2){BB.setTier(BB.tier-1);perfBad=0}}else{perfBad=0;if(av<14&&!BB.qUp&&BB.tier<(BB.phone||BB.lowDev?1:2)){if(++perfGood>=4){BB.qUp=1;BB.setTier(BB.tier+1)}}else perfGood=0}
    perfN=perfS=0}}last0=ts;
  if(!BB.paused){BB.t+=dt;BB.updParts(dt);mic.update(dt)}
  hits=[];
  ctx.setTransform(BB.dpr,0,0,BB.dpr,0,0);ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.setTransform(SC*BB.dpr,0,0,SC*BB.dpr,OX*BB.dpr,OY*BB.dpr);ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
  shakeAmt*=Math.pow(.02,dt);const sx=(Math.random()-.5)*2*shakeAmt,sy=(Math.random()-.5)*2*shakeAmt;
  BB.shakeXY=[sx,sy];
  if(BB.scene){if(!BB.paused){BB.listening=0;BB.scene.update(dt);if(BB.MLP&&BB.MLP.on&&mic.ok)BB.MLP.frame()}BB.scene.draw(ctx);if(BB.MLP&&BB.MLP.dbg)BB.MLP.draw(ctx)}
  BB.drawCelebrate&&BB.drawCelebrate();BB.drawParts&&0;
  ctx.restore();
  ctx.save();ctx.setTransform(BB.dpr,0,0,BB.dpr,0,0);ctx.font='13px sans-serif';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillStyle='rgba(255,255,255,.55)';
  ctx.fillText(BB.VERSION+(BB.aec?' aec':'')+' | audio '+ac.state+' '+ac.sampleRate+'Hz'+' | mic '+mic.state+(mic.ok?' '+(mic.track?mic.track.readyState+(mic.track.muted?' MUTED':''):'')+' lvl '+(mic.raw||0).toFixed(4)+(mic.useDefault?' (default)':''):''),cv.width/BB.dpr-6,cv.height/BB.dpr-4);ctx.restore();
  dispatchClicks();keys.length=0;
  requestAnimationFrame(frame)}
BB.start=()=>requestAnimationFrame(frame);
