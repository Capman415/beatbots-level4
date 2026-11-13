#!/usr/bin/env node
// v14.5.28: Skip Q at bottom center; checkpoint bar and its lettering centered
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const as=read('js/rooms/assess.js'),eng=read('js/engine.js'),art=read('js/art.js');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

const ver=JSON.parse(read('version.json'));
ok(ver.version==='v14.5.28'&&ver.build==='1794301528','version.json is v14.5.28 / 1794301528');
ok(/BB\.VERSION='v14.5.28'/.test(eng),'BB.VERSION synced');
ok((read('index.html').match(/1794301528/g)||[]).length>=2,'index.html build synced');
ok(/bb-1794301528/.test(read('sw.js')),'sw cache synced');

const banner=as.slice(as.indexOf('drawBanner()'), as.indexOf('drawProgress()'));
ok(/const bw=1480,bh=110,bx=\(W-bw\)\/2,by=40/.test(banner),'checkpoint bar is 1480×110 and horizontally centered on the stage');
ok(/mid=by\+16\+\(bh-32\)\/2/.test(banner),'lettering mid-line is the vertical center of the panel well');
ok(/BB\.text\('CHECKPOINT  '\+[\s\S]*?W\/2,mid-18,36/.test(banner),'CHECKPOINT title is centered horizontally and just above the well mid-line');
ok(/need '\+PASS\+' of '\+TOTAL[\s\S]*?W\/2,mid\+22,28/.test(banner),'score line is centered horizontally and just below the well mid-line');
ok(!/BB\.panel\(124,40,1480,110/.test(banner),'old left-shifted banner x=124 is gone');
ok(!/W\/2,78,36/.test(banner)&&!/W\/2,118,28/.test(banner),'old uncentered lettering y=78 / y=118 is gone');

ok(/BB\.button\(W\/2-130,974,260,70,'SKIP Q'/.test(as),'SKIP Q is 260×70 at the bottom center (x=W/2-130, y=974)');
ok(!/BB\.button\(W-300,24,260,70,'SKIP Q'/.test(as),'SKIP Q is no longer in the top-right corner');

// geometry vs other UI on a 1920×1080 stage
const W=1920,H=1080,bw=1480,bh=110,bx=(W-bw)/2,by=40,mid=by+16+(bh-32)/2;
const skip={x:W/2-130,y:974,w:260,h:70};
const ham={x:28,y:26,s:72};
const cards={y:400,h:370}; // R.CHOICE
const choice={y:420,h:220};
const replay={y:320,h:64};
const override={y:840,h:90};
const overlap=(a,b)=>!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
ok(bx===220&&Math.abs(bx+bw/2-W/2)<1e-9,'bar x=220, so its center is exactly W/2');
ok(mid===95,'well vertical center is y=95');
ok(Math.abs(((mid-18-18)+(mid+22+14))/2-mid)<1e-9,'the two text ink-boxes are vertically centered in the well');
ok(skip.x+skip.w/2===W/2,'SKIP Q is horizontally centered');
ok(skip.y+skip.h<=H-24,'SKIP Q has a comfortable bottom margin');
ok(skip.y>=cards.y+cards.h+40,'SKIP Q sits below the hear-pick notation cards with a gap');
ok(skip.y>=choice.y+choice.h+40,'SKIP Q sits below the vocab/choice cards with a gap');
ok(skip.y>=replay.y+replay.h+40,'SKIP Q does not overlap REPLAY RHYTHM');
ok(skip.y>=override.y+override.h,'SKIP Q does not overlap MANUAL OVERRIDE on follow questions');
ok(!overlap(skip,{x:ham.x,y:ham.y,w:ham.s,h:ham.s}),'SKIP Q does not overlap the hamburger');
ok(!overlap({x:bx,y:by,w:bw,h:bh},{x:ham.x,y:ham.y,w:ham.s,h:ham.s}),'centered checkpoint bar does not overlap the hamburger');
ok(/MENU_BTN=\{x:28,y:26,s:72\}/.test(art),'hamburger stays top-left');

// everything else requested to stay put
ok(/state==='hear'/.test(as)&&/playHear/.test(as),'listening-first hear state is unchanged');
ok(/R\.rhythmCard\(x,y,bw,bh,c\.lab/.test(as)&&/R\.CHOICE/.test(read('js/rhythm.js')),'hear-pick cards and notation scale hook are unchanged');
ok(/s:R\.choiceScale\(\)/.test(as),'reveal still uses the shared choiceScale');
ok(/id:'asboss'/.test(as)&&/id:'asmap'/.test(as)&&!/id:'asdl'/.test(as.slice(as.indexOf("if(this.state==='end')"),as.indexOf("if(this.state==='graded')"))),'result-screen layout from v14.5.27 is unchanged');

if(fails){console.error(fails+' v14.5.28 test(s) failed');process.exit(1)}
console.log('v14.5.28 tests OK');
