#!/usr/bin/env node
// v14.5.8/19 boss checks: dynamics (piano->forte) + cumulative amount fill, no speed, constant damage, grander blast, no MEGA VS zoom.
'use strict';
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};
const m=src.match(/const clapDyn=[\s\S]*?HIT_DMG=6;/);ok(!!m,'dynamics helpers present');
const clamp=(v,a,b)=>v<a?a:v>b?b:v;global.window={};
const H=new Function('clamp','window',m[0]+';return{clapDyn,dynFill,dynLevel,BLAST_R,HIT_DMG}')(clamp,global.window);
const fill=(lvl,n)=>H.dynFill(Array.from({length:n},()=>H.clapDyn({lvl})));
const pS=fill(.5,8),mf=fill(.7,8),fF=fill(.95,8);
ok(H.dynLevel(pS)===1,'8 piano claps -> BIG / canister 2 ('+pS.toFixed(2)+')');
ok(H.dynLevel(mf)===2,'8 mezzo claps -> MEGA ('+mf.toFixed(2)+')');
ok(H.dynLevel(fF)===2&&fF>=2.4,'8 forte claps -> all 3 canisters ('+fF.toFixed(2)+')');
ok(fill(.5,12)>=2.4,'12 piano claps in a 3-bar window reach MEGA ('+fill(.5,12).toFixed(2)+')');
// v14.5.19: amount fills progressively — more accepted soft claps fill more (not capped at n/4)
ok(fill(.5,24)>fill(.5,8)+.2,'amount: 24 soft claps fill more than 8 soft');
ok(fill(.5,1)<fill(.5,2)&&fill(.5,2)<fill(.5,4)&&fill(.5,4)<fill(.5,8),'progressive soft steps (no big n/4 chunks)');
ok(fill(.95,4)>fill(.5,8),'4 loud still beat 8 soft (dynamics lesson)');
ok(fill(.5,4)>0&&fill(.5,4)<fill(.7,4)&&fill(.7,4)<fill(.95,4),'monotonic in loudness at 4 claps (before the cap)');
const step=fill(.7,1);ok(step>0&&step<.5,'single clap adds a small smooth step ('+step.toFixed(3)+')');
// calibrated path (LoudCal) uses dB between soft/loud
global.window.GroupGate={calOk:()=>true,loud:{calLo:-40,calHi:-20},dB:r=>20*Math.log10(r)};
const Hc=new Function('clamp','window',m[0]+';return{clapDyn}')(clamp,global.window);
ok(Math.abs(Hc.clapDyn({rms:Math.pow(10,-20/20)})-1)<1e-6&&Hc.clapDyn({rms:Math.pow(10,-40/20)})===0,'calibrated soft/loud mapping');
ok(H.BLAST_R[0]<H.BLAST_R[1]&&H.BLAST_R[1]<H.BLAST_R[2],'blast visual grows with fill');
ok(H.BLAST_R[2]>=420,'MEGA blast radius enlarged for grander explosion');
// damage constant + hitbox unchanged
const hp=src.match(/const w=kind==='chunk'\?6:kind==='big'\?6:1;tot\+=w;if\(k>=hk\)dmg\+=w}const hpf=1-dmg\/tot;/);ok(!!hp,'HP damage formula unchanged (no fill term)');
ok(!/if\(lv===1\)\[1,2\]\.forEach/.test(src),'no extra combo hits at higher fill');
ok(/this\.impact\(2,0\);/.test(src)&&!/this\.impact\(lv\+1,0\)/.test(src),'same impact for every fill level');
ok(/JR=\{x:1430,y:540\}/.test(src),'Static Jr. position/hitbox unchanged');
ok(!/\.035\*\(tr\|\|0\)/.test(src),'canister fill no longer uses clap-rate tier');
ok(/drawBlastRing\(/.test(src)&&/rendered like the robots/.test(src),'robot-style junk + blast ring present');
ok(/shockwave|layered explosion|grander/.test(src),'grander layered blast present');
ok(!/shadowBlur=30;ctx\.lineWidth=10/.test(src),'old glow clap blast removed');
// v14.5.19: MEGA clear no longer triggers VS zoom action scene
ok(/intro standoff VS split only|MEGA clear no longer zooms/.test(src),'MEGA clear VS zoom removed');
ok(!/else if\(this\.state==='end'&&k<KO_BIG\)\{const bi=barAt\(k\),b=KO_BARS\[bi\];if\(b&&b\.clear&&this\.hitLv===2\)/.test(src),'no end-state drawSplit MEGA branch');
ok(/bossMode/.test(src)&&/dl_done/.test(src)&&/KO_CEL/.test(src)&&/bb_tease/.test(src),'ending + boss modes preserved');
ok(/dt\*14/.test(src),'powerTick smooth-chases canister fill');
ok(!/MediaRecorder|toDataURL|localStorage\.setItem\([^)]*audio/i.test(src),'no student audio recorded');
// preserve toward-camera throws + assess lessons not touched here
ok(/toward-camera|_throwFG/.test(src),'toward-camera throw FG queue preserved');
if(fails){console.error(fails+' FAIL');process.exit(1)}console.log('all boss tests passed');
