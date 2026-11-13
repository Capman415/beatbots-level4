#!/usr/bin/env node
// v14.5.25: cylinder-mapped chevrons kept; silhouette is now a head-on capsule
'use strict';
const fs=require('fs'),path=require('path');
const d=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

const i=d.indexOf('  drawTireRoll(ph){');
const end=i+20+d.slice(i+20).search(/\n  [a-zA-Z]/);
const fn=d.slice(i,end);

ok(/v14\.5\.24/.test(fn)&&/dead-on tread face/.test(fn),'drawTireRoll remains the v14.5.24 head-on tire');
ok(/y=R sin/.test(fn)||/R\*Math\.sin\(a\)/.test(fn),'tread uses sin angle mapping for y');
ok(/foreshorten by cos/.test(fn)||/Math\.cos\(/.test(fn),'foreshorten uses cos(α)');
ok(/ph\*26\/R/.test(fn),'scroll is angular (ph*26/R), not linear y');
ok(/1-Math\.cos\(a\)/.test(fn),'wrap-edge shading darkens toward the poles');
ok(/map=\(u,a\)=>/.test(fn)&&/go\(\.08,\.5/.test(fn)&&/go\(\.5,\.92/.test(fn),'chevrons are sampled along a symmetric cylindrical map');
ok(!/lineTo\(16,y\+10\)/.test(fn)&&!/moveTo\(-6,y\)/.test(fn),'flat linear chevrons are gone');

ok(!/ellipse\(-14,0,30,62/.test(fn)&&!/ellipse\(-16,0,13,30/.test(d)&&!/arc\(16,36,26/.test(fn),'3/4 sidewall, hub, and offset caps are gone');
ok(/roundRect\(-HW,-R,HW\*2,R\*2,RAD\)/.test(fn),'head-on capsule silhouette');
ok(/tire\?62\*P\.sc/.test(d),'ground-contact and toward-camera growth offset unchanged');
ok(!/roundRect\(-14,-62,56,124/.test(d),'no hanging 56x124 slab');

const ver=JSON.parse(fs.readFileSync(path.join(__dirname,'../version.json'),'utf8'));
ok(ver.version==='v14.5.25'&&ver.build==='1794301525','version.json is v14.5.25 / 1794301525');
ok(/BB\.VERSION='v14\.5\.25'/.test(fs.readFileSync(path.join(__dirname,'../js/engine.js'),'utf8')),'engine version synced');
ok((fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/1794301525/g)||[]).length>=2,'index.html build synced');
ok(/bb-1794301525/.test(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8')),'sw cache synced');

// keep prior behavior
ok(/no extra hand motion/.test(d)&&!/sx=jx\+sd\*/.test(d),'6-7 still has no extra hands');
ok(/bb_sj8/.test(d),'intro line kept');
ok(/sum\*\.70/.test(d)&&/cw:3/.test(d),'clap fill kept');
ok(/SAFE_Y=200/.test(d),'high throws kept');

if(fails){console.error(fails+' FAIL');process.exit(1)}
console.log('v14.5.23 tests OK');
