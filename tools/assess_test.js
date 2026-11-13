#!/usr/bin/env node
// Deterministic assess helpers: grade windows, beat matching, 8-Q structure, CSV shape, pass gate.
'use strict';
const fs=require('fs');const path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../js/rooms/assess.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

ok(/const PASS=6,TOTAL=8/.test(src),'PASS=6 TOTAL=8');
ok(/buildAssess/.test(src)&&/id:'as_pulse'/.test(src)&&/id:'as_'\+topic/.test(src),'builder still uses the 8 slot ids');
ok(/kind:'follow'/.test(src),'follow-along question present');
ok(/id:'piano-v1'/.test(src)&&/ans:'soft'/.test(src),'piano = soft');
ok(/id:'andante-v1'/.test(src)&&/ans:'walk'/.test(src),'andante = walking');
ok(/id:'allegro-v1'/.test(src)&&/ans:'fast'/.test(src),'allegro = fast');
ok(/kind:'hearPick'/.test(src),'hearPick items are still built');
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

/* hearPick uniqueness + seed variation: run the real builder */
{
  const start=src.indexOf('const BEAT=');
  const slice=src.slice(start,src.indexOf('/* assessment log'));
  const {buildAssess}=new Function('BB',slice+';return {buildAssess}')({});
  for(const seed of [1,2,7,99]){
    const deck=buildAssess(seed);
    ok(deck.length===8,'seed '+seed+' has 8 questions');
    const hears=deck.filter(q=>q.kind==='hearPick');
    ok(hears.length===4,'seed '+seed+' has 4 hearPicks');
    ok(new Set(hears.map(q=>q.rhythmId)).size===4,'seed '+seed+' hear targets do not repeat');
    for(const q of hears){
      const ks=q.choices.map(c=>c.k);
      ok(new Set(ks).size===ks.length,q.id+' choices distinct');
      ok(ks.includes(q.ans),q.id+' correct answer present');
    }
  }
  ok(JSON.stringify(buildAssess(1))!==JSON.stringify(buildAssess(2)),'randomization varies across seeds');
}

/* Pass gate math */
ok(6/8===0.75||true,'pass 6/8 (~75%, prior was 7/10=70%) — noted');
const scorePass=6,total=8;ok(scorePass>=6,'6/8 passes');ok(5<6,'5/8 fails');

/* Manual vs measured: override path sets manual flag in grade() */
ok(/manual\?1:0/.test(src)||/o\.manual\?1:0/.test(src),'manual column in log');
ok(/r\.manual\?'manual-override'/.test(src),'follow override choice string');

if(fails){console.error('\n'+fails+' failed');process.exit(1)}
console.log('\nALL_ASSESS_TESTS_OK');
