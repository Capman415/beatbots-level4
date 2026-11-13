#!/usr/bin/env node
// v14.5.22: no 6-7 hand motion; restore toward-viewer tire minus the hanging side slab
'use strict';
const fs=require('fs'),path=require('path');
const d=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

ok(/g\.kind==='67'&&gv<g\.dur/.test(d),'6-7 gag still plays the line');
ok(/BB\.text\(gv<\.8\?'6\.\.\.':'6\.\.\. 7!'/.test(d),'6-7 caption remains');
ok(!/sx=jx\+sd\*/.test(d)&&!/proper robot arms/.test(d),'no added metal arms');
ok(!/BB\.rrect\(-45,-20,90,40/.test(d)&&!/BB\.rrect\(-28,-24,56,48/.test(d),'no extra drawn fists or floating ovals');
ok(/no extra hand motion/.test(d),'v14.5.22 comment documents the removal');

ok(/dead-on tread face rolling straight at the camera/.test(d),'head-on tire rolling straight at the camera');
ok(!/ctx\.ellipse\(-14,0,30,62/.test(d)&&!/ctx\.ellipse\(-16,0,13,30/.test(d),'3/4 sidewall and hub are gone');
ok(/ph\*26/.test(d),'tread still scrolls toward the viewer with ph');
ok(!/roundRect\(-14,-62,56,124/.test(d),'56x124 hanging side slab is not back');
ok(!/ctx\.arc\(0,0,58/.test(d)&&!/clean circular tire/.test(d),'face-on circular v14.5.21 tire is gone');
ok(/tire\?62\*P\.sc/.test(d),'tire ground-contact offset restored to 62');
ok(/roundRect\(-HW,-R,HW\*2,R\*2,RAD\)/.test(d),'symmetric capsule silhouette, no hanging slab');

const ver=JSON.parse(fs.readFileSync(path.join(__dirname,'../version.json'),'utf8'));
ok(ver.version==='v14.5.27'&&ver.build==='1794301527','version.json is v14.5.27 / 1794301527');
const eng=fs.readFileSync(path.join(__dirname,'../js/engine.js'),'utf8');
ok(/BB\.VERSION='v14\.5\.27'/.test(eng),'engine version synced');
const idx=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
ok((idx.match(/1794301527/g)||[]).length>=2,'index.html build synced');
const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
ok(/bb-1794301527/.test(sw),'sw cache synced');

// other v14.5.21 work stays
ok(/bb_sj8/.test(d)&&/Even my static has better timing than that!/.test(d),'intro line kept');
ok(/sum\*\.70/.test(d)&&/cw:3/.test(d),'clap fill rebalance kept');
ok(/SAFE_Y=200/.test(d),'high throw arcs kept');
ok(/W\/2,350,40/.test(fs.readFileSync(path.join(__dirname,'../js/rooms/assess.js'),'utf8')),'assess layout kept');

if(fails){console.error(fails+' FAIL');process.exit(1)}
console.log('v14.5.22 tests OK');
