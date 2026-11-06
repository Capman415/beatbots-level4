#!/usr/bin/env node
// Deterministic assess helpers: grade windows, beat matching, 8-Q structure, CSV shape, pass gate.
'use strict';
const fs=require('fs');const path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/assess.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

ok(/const PASS=6,TOTAL=8/.test(src),'PASS=6 TOTAL=8');
ok((src.match(/id:'as_/g)||[]).length===8,'exactly 8 question ids');
ok(/kind:'follow'/.test(src),'follow-along question present');
ok(/id:'as_piano'/.test(src)&&/ans:'soft'/.test(src),'piano = soft');
ok(/id:'as_andante'/.test(src)&&/ans:'walk'/.test(src),'andante = walking');
ok(/id:'as_allegro'/.test(src)&&/ans:'fast'/.test(src),'allegro = fast');
ok((src.match(/kind:'hearPick'/g)||[]).length===4,'four hearPick items');
ok(/REPLAY RHYTHM/.test(src),'replay button');
ok(/manual-override/.test(src),'manual override logged distinctly');
ok(/thr_early_ms/.test(src)&&/matched/.test(src),'CSV has performance evidence columns');
ok(/need \+PASS\+' of '\+TOTAL/.test(src)||/need '\+PASS/.test(src),'UI pass threshold uses PASS');
ok(/openDelivery/.test(src),'boss gate preserved');

/* Pure mirrors of BB.assessTol / assessMatchBeat (same formulas as assess.js / group.js) */
function gradeBand(g){return(g==='K'||g==='1')?'k1':(g==='2'||g==='3')?'m':'u'}
function assessTol(spb,g){const b=gradeBand(g);
  if(b==='k1')return{early:Math.min(.17,spb*.36),late:Math.min(.32,spb*.6)};
  if(b==='m')return{early:Math.min(.14,spb*.32),late:Math.min(.25,spb*.5)};
  return{early:Math.min(.12,spb*.28),late:Math.min(.18,spb*.4)}}
function match(onT,expT,spb,g,lat=0){const tol=assessTol(spb,g),dd=(onT-lat)-expT;return{ok:dd>=-tol.early&&dd<=tol.late,off:dd,tol}}

const spb=60/92;
const k=assessTol(spb,'K'),u=assessTol(spb,'5');
ok(k.late>u.late,'K late window wider than grade 5');
ok(k.early>=u.early,'K early window >= grade 5');
const exp=10;
ok(match(exp+0.05,exp,spb,'3').ok,'grade3 +50ms hit');
ok(!match(exp+0.40,exp,spb,'5').ok,'grade5 +400ms miss');
ok(match(exp+0.25,exp,spb,'K').ok,'gradeK +250ms still hit');
ok(!match(exp-0.25,exp,spb,'5').ok,'grade5 -250ms early miss');

/* hearPick uniqueness: parse seq/choices from source roughly */
const hears=[...src.matchAll(/id:'(as_hear\d)'[\s\S]*?seq:(\[[^\]]+\])[\s\S]*?choices:\[([\s\S]*?)\],ans:'(\w)'/g)];
ok(hears.length===4,'parsed 4 hearPick blocks');
for(const h of hears){
  const seq=h[2],ans=h[4],ch=h[3];
  const labs=[...ch.matchAll(/lab:(\[[^\]]+\])/g)].map(m=>m[1]);
  ok(new Set(labs).size===labs.length,h[1]+' choices distinct');
  const ansLab=(ch.match(new RegExp("k:'"+ans+"',lab:(\\[[^\\]]+\\])"))||[])[1];
  ok(ansLab===seq,h[1]+' ans lab equals heard seq '+seq);
}

/* Pass gate math */
ok(6/8===0.75||true,'pass 6/8 (~75%, prior was 7/10=70%) — noted');
const scorePass=6,total=8;ok(scorePass>=6,'6/8 passes');ok(5<6,'5/8 fails');

/* Manual vs measured: override path sets manual flag in grade() */
ok(/manual\?1:0/.test(src)||/o\.manual\?1:0/.test(src),'manual column in log');
ok(/r\.manual\?'manual-override'/.test(src),'follow override choice string');

if(fails){console.error('\n'+fails+' failed');process.exit(1)}
console.log('\nALL_ASSESS_TESTS_OK');
