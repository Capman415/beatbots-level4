#!/usr/bin/env node
// v14.5.19: progressive amount-based clap power + grander blast, no MEGA action-scene zoom
'use strict';
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const m=src.match(/const clapDyn=[\s\S]*?HIT_DMG=6;/);
const H=new Function('clamp','window',m[0]+';return{clapDyn,dynFill,dynLevel,BLAST_R}')(clamp,{});
const seq=(lvls)=>H.dynFill(lvls.map(lvl=>H.clapDyn({lvl})));

// progressive fill series (mezzo): each clap adds ~same small amount
const fills=[];for(let n=0;n<=10;n++)fills.push(seq(Array(n).fill(.7)));
ok(fills[0]===0,'empty = 0');
for(let i=1;i<fills.length;i++)ok(fills[i]>fills[i-1]||fills[i-1]>=3,'fill grows with clap count at n='+i+' ('+fills[i-1].toFixed(2)+'->'+fills[i].toFixed(2)+')');
const deltas=[];for(let i=1;i<=6;i++)deltas.push(fills[i]-fills[i-1]);
ok(Math.max(...deltas)<.55,'no single-clap jump bigger than .55 (was chunky n/4)');
ok(Math.min(...deltas)>.15,'each clap still visibly adds');

// dynamics still matter at equal count
ok(seq(Array(6).fill(.5))<seq(Array(6).fill(.7))&&seq(Array(6).fill(.7))<seq(Array(6).fill(.95)),'equal-count loudness order');

// old formula would cap: Math.min(1,n/4)*3*(...) — new must keep growing past 4
ok(seq(Array(8).fill(.7))>seq(Array(4).fill(.7))+.3,'past 4 claps still fills (not n/4 capped)');

// smooth chase present; hitLv uses max(cf,cfDyn)
ok(/const tgt=Math\.max\(this\.cfT,this\.cfDyn\|\|0\)/.test(src),'smooth fill target');
ok(/dynLevel\(Math\.max\(this\.cf\|\|0,this\.cfDyn\|\|0\)\)/.test(src),'hit level uses true fill not lagged draw');

// blast grander
ok(H.BLAST_R[2]>H.BLAST_R[1]&&H.BLAST_R[1]>H.BLAST_R[0],'blast radii ordered');
ok(/for\(let i=0;i<3;i\+\+\)\{const t0=i\*\.12/.test(src)||/shockwave rings/.test(src),'layered shockwaves');
ok(/rim sparks/.test(src),'rim sparks');
ok(/BB\.burst\(JR\.x,JR\.y-100/.test(src),'secondary spark burst on clear');

// no MEGA VS zoom; intro split kept
const split=src.slice(src.indexOf('drawSplit(k)'),src.indexOf('drawSplit(k)')+500);
ok(/intro standoff VS split only/.test(split),'split comment marks intro-only');
ok(!/hitLv===2/.test(split),'no hitLv===2 zoom path in drawSplit');
ok(/this\.state==='intro'&&this\.move/.test(split),'intro VS split preserved');

// damage / impact unchanged
ok(/this\.impact\(2,0\);/.test(src),'impact still 2');
ok(!/HIT_DMG\s*=\s*[^6]/.test(m[0]),'HIT_DMG still 6');

// self-sound / throw FG / assess not broken by this patch
ok(/_throwFG/.test(src),'throw FG preserved');
ok(!/countPulse/.test(fs.readFileSync(path.join(__dirname,'../js/rooms/assess.js'),'utf8').match(/FollowPulse[\s\S]*?draw\(k\)/)?.[0]?.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*/g,'')||''),'FollowPulse still free of countPulse on score');

if(fails){console.error(fails+' FAIL');process.exit(1)}console.log('all power_blast tests passed');
