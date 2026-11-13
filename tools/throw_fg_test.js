// v14.5.18: toward-camera throws + FG layering over Sprocket
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../js/rooms/delivery.js','utf8');
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exitCode=1}else console.log('ok',m)};
ok(/v14\.5\.18 TOWARD-CAMERA/.test(src),'toward-camera comment present');
ok(/this\._throwFG=\[\]/.test(src),'drawKO clears FG queue');
ok(/if\(P\.fg\)this\._throwFG\.push\(paint\);else paint\(\)/.test(src),'late/large throws queued to FG');
ok(/this\._throwFG\.forEach\(f=>f\(\)\)/.test(src)&&/drawLauncher\(\)/.test(src)
  && src.indexOf('this._throwFG.forEach')>src.indexOf("R.paint(ctx,()=>this.drawLauncher())"),'FG flush runs AFTER drawLauncher (in front of Sprocket)');
const help=src.match(/const BOMB_LANES=[\s\S]*?DODGE_VO=\{[^}]*\};/)[0]+src.match(/const SAFE_Y=\d+,throwPath=[\s\S]*?fg:sc>=1\.7\|\|u>=\.4\}\};/)[0]+src.match(/const LANE_DIR=[\s\S]*?sx:kind==='bomb'\?1:1-\.16\*Math\.sin\(Math\.PI\*Math\.min\(u,1\)\)\}\};/)[0];
const L=new Function('W','H','clamp','lerp',help+';return{throwPath,LANE_TG}')(1920,1080,(v,a,b)=>v<a?a:v>b?b:v,(a,b,t)=>a+(b-a)*t);
const P0=L.throwPath('left',0,1340,500),P1=L.throwPath('left',1,1340,500),Pmid=L.throwPath('left',.5,1340,500),Pdive=L.throwPath('left',1.25,1340,500);
ok(P1.sc>P0.sc*4,'left lane grows >4x toward camera');
ok(P1.a===1,'opaque at dodge beat (no mid-air fade)');
ok(P1.fg===true&&P0.fg===false,'fg flips on for late approach');
ok(Pmid.y<540,'mid-flight left throw is in the upper half (y='+Pmid.y.toFixed(0)+')');
ok(Pdive.y>1000,'after the dodge beat it still dives toward the bottom');
const Pr=L.throwPath('right',1,1490,500);ok(Pr.x>1600,'right lane still reaches right side');
const Pl=L.throwPath('left',.9,1340,500);ok(Pl.x<700,'left lane still reaches left side');
const Pf=L.throwPath('floor',1.3,1390,710);ok(Pf.y>1080&&Pf.sc>5,'tire rolls off bottom and grows');
const Ph=L.throwPath('high',.5,1340,500);ok(Ph.y<540,'high-lane mid-flight also in the upper half');
if(!process.exitCode)console.log('throw FG tests OK');
