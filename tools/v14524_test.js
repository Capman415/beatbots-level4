#!/usr/bin/env node
// v14.5.26: head-on tire rolling straight at the camera; no diagonal path or 3/4 silhouette
'use strict';
const fs=require('fs'),path=require('path');
const d=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

const i=d.indexOf('  drawTireRoll(ph){');
const end=i+20+d.slice(i+20).search(/\n  [a-zA-Z]/);
const fn=d.slice(i,end);

ok(/v14\.5\.24/.test(fn)&&/dead-on tread face rolling straight at the camera/.test(fn),'drawTireRoll is still the v14.5.24 head-on tire');
ok(/HW=32,R=62,RAD=22/.test(fn),'capsule is 64×124 (width ≈ 52% of height) with slightly rounded caps');
ok(/roundRect\(-HW,-R,HW\*2,R\*2,RAD\)/.test(fn),'silhouette is a symmetric upright rounded rectangle');
ok(!/ellipse\(-14,0,30,62/.test(fn)&&!/ellipse\(-16,0,13,30/.test(fn)&&!/arc\(16,36,26/.test(fn),'no 3/4 sidewall, hub, or offset tread caps');
ok(!/roundRect\(-14,-62,56,124/.test(d),'hanging 56×124 side slab stays gone');
ok(!/ctx\.arc\(0,0,58/.test(d)&&!/clean circular tire/.test(d),'v14.5.21 circular face-on tire stays gone');
ok(/R\*Math\.sin\(a\)/.test(fn)&&/ph\*26\/R/.test(fn),'chevrons still use y=R sin(α) with angular scroll');
ok(/1-Math\.cos\(a\)/.test(fn),'wrap-edge shading darkens toward the poles');
ok(/go\(\.08,\.5,a0,a1\);go\(\.5,\.92,a1,a0\)/.test(fn),'chevrons are symmetric and centered (V pointing down)');
ok(/createRadialGradient\(0,0,4,0,0,R\*\.85\)/.test(fn),'subtle center highlight');
ok(/sliver\(-1\);sliver\(1\)/.test(fn),'thin sidewall slivers are symmetric on both sides');
ok(/tire\?62\*P\.sc/.test(d),'ground-contact offset stays 62');

ok(/tx=lane==='floor'\?sx:T\.x/.test(d)&&/lane!=='floor'&&v<TIRE_HOP/.test(d),'legacy floor lane still locks x to sx; new lanes hop then hold T.x');
ok(/kind==='tire'\)return\{rot:0,sx:1\}/.test(d),'tire stays upright with no lean');
ok(/floor:\{x:1390,y:H\*\.86\}/.test(d),'floor lane is locked to the release x (JR.x-40)');
ok(/tx=clamp\(tire\?P\.x:T\.x,330,W-330\)/.test(d),'jump banner tracks the tire x');

// functional: floor x is constant, y and scale still grow toward the camera
const W=1920,H=1080,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const help=d.match(/const TIRE_LANES=[\s\S]*?DODGE_VO=\{[^}]*\};/)[0]
  +d.match(/const SAFE_Y=\d+,throwPath=[\s\S]*?fg:sc>=1\.7\|\|u>=\.4\}\};/)[0]
  +d.match(/const LANE_DIR=[\s\S]*?sx:kind==='bomb'\?1:1-\.16\*Math\.sin\(Math\.PI\*Math\.min\(u,1\)\)\}\};/)[0];
const L=new Function('W','H','clamp','lerp',help+';return{throwPath,throwTurn,LANE_TG}')(W,H,clamp,lerp);
const sx=1390,sy=710;let xs=[],prevY=null,prevSc=null,xDrift=0;
for(let v=0;v<=1.4;v+=.1){
  const P=L.throwPath('floor',v,sx,sy);if(!P)continue;
  xs.push(P.x);xDrift=Math.max(xDrift,Math.abs(P.x-sx));
  if(prevY!=null)ok(P.y>=prevY-1,'floor y does not move back up at v='+v.toFixed(1));
  if(prevSc!=null)ok(P.sc>=prevSc-1e-6,'floor scale does not shrink at v='+v.toFixed(1));
  prevY=P.y;prevSc=P.sc;
}
ok(xDrift<1,'floor path has no sideways drift (max |x-sx|='+xDrift+')');
const P0=L.throwPath('floor',0,sx,sy),P1=L.throwPath('floor',1,sx,sy),Pend=L.throwPath('floor',1.3,sx,sy);
ok(P1.sc>P0.sc*3&&Pend.sc>5&&Pend.y>H,'tire still grows toward the camera and rolls off the bottom');
ok(L.throwTurn('floor',1,'tire').rot===0,'tire rotation is 0 at mid/end of the roll');
ok(L.LANE_TG.floor.x===1390,'LANE_TG.floor.x is the release lane');

const ver=JSON.parse(fs.readFileSync(path.join(__dirname,'../version.json'),'utf8'));
ok(ver.version==='v14.5.26'&&ver.build==='1794301526','version.json is v14.5.26 / 1794301526');
ok(/BB\.VERSION='v14\.5\.26'/.test(fs.readFileSync(path.join(__dirname,'../js/engine.js'),'utf8')),'engine version synced');
ok((fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/1794301526/g)||[]).length>=2,'index.html build synced');
ok(/bb-1794301526/.test(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8')),'sw cache synced');

ok(/no extra hand motion/.test(d)&&!/sx=jx\+sd\*/.test(d),'6-7 still has no extra hands');
ok(/bb_sj8/.test(d),'intro line kept');
ok(/sum\*\.70/.test(d)&&/cw:3/.test(d),'clap fill kept');
ok(/SAFE_Y=200/.test(d),'high throws kept');
ok(/W\/2,350,40/.test(fs.readFileSync(path.join(__dirname,'../js/rooms/assess.js'),'utf8')),'assess layout kept');

if(fails){console.error(fails+' FAIL');process.exit(1)}
console.log('v14.5.26 tests OK');
