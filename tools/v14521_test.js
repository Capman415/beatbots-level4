#!/usr/bin/env node
// v14.5.21: higher throws, tire rewrite, clap-fill rebalance, intro line, 67 arms, no opening blast, assess layout
'use strict';
const fs=require('fs'),path=require('path');
const d=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
const a=fs.readFileSync(path.join(__dirname,'../js/rooms/assess.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

ok(/bb_sj8/.test(d)&&/Even my static has better timing than that!/.test(d),'new Static Jr. intro line registered');
ok(/\[10\.8,'bb_sj8'/.test(d),'line is scheduled in the 10.8s intro gap (after 8.3, before 13.3)');
ok(!/BB\.rrect\(-45,-20,90,40/.test(d)&&!/sx=jx\+sd\*78/.test(d),'6-7 no floating ovals and no added metal arms (v14.5.22)');
ok(!/g\.kind==='67'&&gv<g\.dur\)\{for\(const sd of\[-1,1\]\)\{const bob=[\s\S]*?BB\.rrect\(-45,-20,90,40/.test(d),'old floating-hand ovals removed');

ok(/this\.fuzzT=0;this\.fuzzD=0/.test(d)&&/BB\.parts\)BB\.parts\.length=0/.test(d),'startKO clears fuzz and leftover particles');
ok(!/startKO\(\)\{[\s\S]{0,500}BB\.sfx\.glitch\(\)/.test(d),'startKO no longer fires an opening glitch');
ok(!/k<\.6&&BB\.q/.test(d),'opening screen-fuzz at k<.6 is gone');
ok(/k>KO_T0&&last&&!KO_ATK\(kd\)&&since<1\.2/.test(d),'idle lightning only after a real hit');

ok(/cw:3/.test(d),'clap window is 3 bars');
ok(/sum\*\.70/.test(d),'per-clap fill gain is 0.70');
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const m=d.match(/const clapDyn=[\s\S]*?HIT_DMG=6;/);
const H=new Function('clamp','window',m[0]+';return{clapDyn,dynFill,dynLevel}')(clamp,{});
const fill=(lvl,n)=>H.dynFill(Array.from({length:n},()=>H.clapDyn({lvl})));
ok(Math.abs(fill(.5,12)-2.4864)<.02,'12 piano claps ≈ 2.49 (MEGA)');
ok(fill(.7,8)>=2.99,'8 mezzo claps fill all 3 canisters');
ok(fill(.95,4)>=2.7,'4 forte claps reach MEGA');

ok(/tread-on tire rolling toward the viewer/.test(d)&&/ctx\.ellipse\(-14,0,30,62/.test(d),'toward-viewer sidewall tire restored');
ok(!/roundRect\(-14,-62,56,124/.test(d),'protruding 56x124 side slab stays gone');
ok(!/ctx\.arc\(0,0,58/.test(d),'v14.5.21 circular face-on tire is no longer used');

ok(/drawBlastRing\(jx,jy-60,130/.test(d)&&/this\.hitPop=/.test(d),'hit explosions use the big-blast ring style');

ok(/W\/2,350,40/.test(a),'assessment question moved down to y=350');
ok(!/c\.sub\)BB\.text\(c\.sub/.test(a),'choice sub/hint strings are not drawn');
ok(!/BB\.text\('Answers stay up while you listen/.test(a),'no-peeking line not rendered');
ok(/Clap with the lights — 8 steady ta beats/.test(a),'follow cue is kid-friendly');

const ver=JSON.parse(fs.readFileSync(path.join(__dirname,'../version.json'),'utf8'));
ok(ver.version==='v14.5.22'&&ver.build==='1794301522','version.json is v14.5.22 / 1794301522');
const eng=fs.readFileSync(path.join(__dirname,'../js/engine.js'),'utf8');
ok(/BB\.VERSION='v14\.5\.22'/.test(eng),'engine version synced');

if(fails){console.error(fails+' FAIL');process.exit(1)}
console.log('v14.5.21 tests OK');
