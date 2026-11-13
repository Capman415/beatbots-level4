#!/usr/bin/env node
// v14.5.26: random left/center/right tire lanes; hop then straight roll; jump dodge stays jump
'use strict';
const fs=require('fs'),path=require('path');
const d=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

const W=1920,H=1080,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const help=d.match(/const TIRE_LANES=[\s\S]*?DODGE_VO=\{[^}]*\};/)[0]
  +d.match(/const SAFE_Y=\d+,throwPath=[\s\S]*?fg:sc>=1\.7\|\|u>=\.4\}\};/)[0]
  +d.match(/const LANE_DIR=[\s\S]*?sx:kind==='bomb'\?1:1-\.16\*Math\.sin\(Math\.PI\*Math\.min\(u,1\)\)\}\};/)[0];
const L=new Function('W','H','clamp','lerp',help+';return{throwPath,throwTurn,throwLane,pickTireLanes,tireLane,LANE_TG,TIRE_HOP,TIRE_LANES,DODGE_VO}')(W,H,clamp,lerp);

ok(L.TIRE_LANES.join()==='floorL,floorC,floorR','three named tire lanes');
ok(Math.abs(L.LANE_TG.floorL.x-W*.22)<1&&Math.abs(L.LANE_TG.floorC.x-W*.5)<1&&Math.abs(L.LANE_TG.floorR.x-W*.78)<1,'lanes sit at 22% / 50% / 78% of the screen');
ok(L.LANE_TG.floorL.x<W*.35&&L.LANE_TG.floorR.x>W*.65&&L.LANE_TG.floorC.x>W*.4&&L.LANE_TG.floorC.x<W*.6,'lanes are spread left / center / right');

// pickTireLanes: all three occur, no back-to-back repeats, deck reshuffle
function seedRng(seed){let s=seed|0||1;return()=>{s=s*16807%2147483647;return s/2147483647}}
let allThree=0,repeats=0,samples=40;
for(let s=1;s<=samples;s++){
  const seq=L.pickTireLanes(4,seedRng(s*9973+11));
  if(new Set(seq).size===3)allThree++;
  for(let i=1;i<seq.length;i++)if(seq[i]===seq[i-1])repeats++;
  ok(seq.length===4,'pickTireLanes(4) length for seed '+s);
}
ok(repeats===0,'no back-to-back lane repeats across '+samples+' fights');
ok(allThree===samples,'all three lanes occur in every 4-throw fight ('+allThree+'/'+samples+')');
ok(L.pickTireLanes(3,seedRng(7)).length===3&&new Set(L.pickTireLanes(3,seedRng(7))).size===3,'a 3-throw pack is a permutation of all three lanes');

// throwLane honors a fight sequence; default cycle still a tire lane
const seq=['floorR','floorL','floorC','floorL'];
ok(seq.every((l,i)=>L.throwLane('junkF',i,seq)===l),'throwLane(junkF, i, seq) returns the chosen tire lane');
ok(L.TIRE_LANES.includes(L.throwLane('junkF',0)),'default junkF lane is one of the three tire lanes');
ok(L.throwLane('junkL',0)==='left'&&L.throwLane('junkR',0)==='right'&&L.throwLane('junkT',0)==='high','non-tire throw lanes unchanged');

// hop then straight roll
const sx=1390,sy=710,HOP=L.TIRE_HOP;
for(const lane of L.TIRE_LANES){
  const tx=L.LANE_TG[lane].x;
  const P0=L.throwPath(lane,0,sx,sy),Pmid=L.throwPath(lane,HOP/2,sx,sy),Pland=L.throwPath(lane,HOP,sx,sy);
  ok(P0&&Math.abs(P0.x-sx)<1,lane+' starts at Jr\'s release x');
  ok(Pmid&&Math.abs(Pmid.x-sx)>20&&Math.abs(Pmid.x-tx)>20||Math.abs(tx-sx)<40,lane+' hop moves x toward the lane (or is already there)');
  ok(Pland&&Math.abs(Pland.x-tx)<1,lane+' lands on the lane x at hop end');
  ok(Pmid.y<P0.y-40,lane+' hop has a visible upward bounce');
  let maxDrift=0,prevY=Pland.y,prevSc=Pland.sc;
  for(let v=HOP;v<=1.4;v+=.05){
    const P=L.throwPath(lane,v,sx,sy);if(!P)continue;
    maxDrift=Math.max(maxDrift,Math.abs(P.x-tx));
    if(v>HOP){ok(P.y>=prevY-1,lane+' roll y does not move back up at v='+v.toFixed(2));ok(P.sc>=prevSc-1e-6,lane+' roll scale does not shrink at v='+v.toFixed(2))}
    prevY=P.y;prevSc=P.sc;
  }
  ok(maxDrift<1,lane+' roll has constant x (max |x-tx|='+maxDrift+')');
  const P1=L.throwPath(lane,1,sx,sy),Pend=L.throwPath(lane,1.3,sx,sy);
  ok(P1.sc>3&&Pend.sc>5&&Pend.y>H,lane+' still grows toward the camera and rolls off the bottom');
  ok(L.throwTurn(lane,1,'tire').rot===0,lane+' stays head-on (rot 0) during the roll');
}

// legacy floor path still locks to sx with no hop
const Pf=L.throwPath('floor',HOP/2,sx,sy);
ok(Pf&&Math.abs(Pf.x-sx)<1,'legacy floor lane does not hop sideways');

// dodge mapping: jump bars still throw junkF; jump VO unchanged; lean mappings unchanged
ok(/JP=\(\)=>KB\('JUMP! \(rolling tire!\)','jump',\[\[2,'junkF'\]\]/.test(d),'jump bars still throw junkF — the dodge is JUMP for every tire lane');
ok(L.DODGE_VO.jump==='dl_jump'&&L.DODGE_VO.L==='dl_left'&&L.DODGE_VO.R==='dl_right','dodge VO mapping unchanged');
ok(/lean left <- junk flies RIGHT; lean right <- LEFT/.test(d),'lean dodges still oppose the flying-junk side');
ok(/jump is still the dodge for every tire/.test(d),'comment documents that left/center/right tires are all jumped');
ok(/this\.tireSeq=pickTireLanes\(KO_HITS\.filter\(h=>h\[1\]==='junkF'\)\.length\)/.test(d),'startKO rolls a fresh random sequence each fight');
ok(/throwLane\(kind,n,tire\?this\.tireSeq:null\)/.test(d),'drawKO feeds the chosen tire lane into throwLane/throwPath');
ok(/tx=clamp\(tire\?P\.x:T\.x,330,W-330\)/.test(d),'BOING banner follows the tire x (the chosen lane during the roll)');

// every scripted jump throw is junkF (so the random lane still uses the jump dodge)
const jumps=[...d.matchAll(/JP\(\)/g)];
ok(jumps.length>=4,'fight still has multiple jump/tire throws');
ok(/DL=\(\)=>KB\('LEAN LEFT!','L',\[\[2,'junkR'\]\]/.test(d)&&/DR=\(\)=>KB\('LEAN RIGHT!','R',\[\[2,'junkL'\]\]/.test(d),'lean-left/right still dodge the opposite flying junk');

const ver=JSON.parse(fs.readFileSync(path.join(__dirname,'../version.json'),'utf8'));
ok(ver.version==='v14.5.26'&&ver.build==='1794301526','version.json is v14.5.26 / 1794301526');
ok(/BB\.VERSION='v14\.5\.26'/.test(fs.readFileSync(path.join(__dirname,'../js/engine.js'),'utf8')),'engine version synced');
ok((fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/1794301526/g)||[]).length>=2,'index.html build synced');
ok(/bb-1794301526/.test(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8')),'sw cache synced');

ok(/dead-on tread face rolling straight at the camera/.test(d),'head-on tire art kept');
ok(/no extra hand motion/.test(d)&&/bb_sj8/.test(d)&&/sum\*\.70/.test(d)&&/SAFE_Y=200/.test(d),'prior 21–24 work kept');
ok(/W\/2,350,40/.test(fs.readFileSync(path.join(__dirname,'../js/rooms/assess.js'),'utf8')),'assess layout kept');

if(fails){console.error(fails+' FAIL');process.exit(1)}
console.log('v14.5.26 tests OK');
