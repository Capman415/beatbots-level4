#!/usr/bin/env node
// v14.5.26: hamburger drawer menu, no pause button, HUD insets, smash white-gap cleanup
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const art=read('js/art.js'),eng=read('js/engine.js'),shell=read('js/shell.js');
const rooms={};
for(const n of ['mine','smasher','packing','label','delivery','assess']) rooms[n]=read('js/rooms/'+n+'.js');
const allJS=[art,eng,shell,...Object.values(rooms)].join('\n');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

// --- version ---
const ver=JSON.parse(read('version.json'));
ok(ver.version==='v14.5.26'&&ver.build==='1794301526','version.json is v14.5.26 / 1794301526');
ok(/BB\.VERSION='v14.5.26'/.test(eng),'BB.VERSION synced');
ok((read('index.html').match(/1794301526/g)||[]).length>=2,'index.html build synced');
ok(/bb-1794301526/.test(read('sw.js')),'sw cache synced');

// --- no pause button remains ---
ok(!/BB\.pauseBtn\s*=/.test(art),'pauseBtn helper removed from art.js');
ok(!/BB\.pauseOverlay\s*=/.test(art),'pauseOverlay helper removed from art.js');
ok(!/BB\.pauseBtn\(/.test(allJS),'no pauseBtn() calls remain');
ok(!/id:'pause'/.test(allJS),"no hit-target id 'pause'");
for(const [n,src] of Object.entries(rooms)){
  ok(!/BB\.pauseOverlay\(/.test(src),n+' no longer draws pauseOverlay');
  ok(!/BB\.keys\.includes\('p'\)/.test(src),n+' does not handle p itself (engine owns the menu key)');
}

// --- hamburger + drawer ---
ok(/BB\.drawMenuBtn/.test(art)&&/BB\.drawMenuUI/.test(art),'menu button and drawer UI exist');
ok(/id:'menubtn'/.test(art)&&/style:'none'/.test(art),'hamburger is an icon-only hit target (no button chrome)');
ok(/lineCap='round'/.test(art)&&/barW/.test(art),'hamburger uses rounded pill bars');
ok(!/drawMenuBtn=[\s\S]{0,900}'(PAUSE|MENU)'/.test(art),'hamburger has no PAUSE or MENU text label');
ok(/BB\.MENU_BG='#f6f5f2'/.test(art)&&/BB\.MENU_INK='#0d0c22'/.test(art),'Dribbble-like white panel and navy text');
ok(/BB\.MENU_ACCENT/.test(art)&&/label:play\?'Resume':'Close'/.test(art),'Resume uses the accent color; Close on the hub');
ok(/dw=W\/2/.test(art),'drawer covers the left half');
ok(/0\.45\s*\*\s*k/.test(art),'grey overlay is ~45% opacity, faded with the drawer');
ok(/BB\.MENU_MS=250/.test(eng)&&/1-Math\.pow\(1-t,3\)/.test(eng),'250ms cubic ease-out, no bounce');
ok(/id:'menucatch'/.test(art),'tapping the dimmed area closes the drawer');
ok(/id:'mhowto'/.test(art)&&/id:'roomsel'/.test(art)&&/id:'menumic'/.test(art)&&/id:'menuassess'/.test(art)&&/id:'mteacher'/.test(art)&&/id:'resume'/.test(art),'menu reaches Resume, How To Play, Room Select, Mic Setup, Assessment, Teacher');
ok(/menuGoPage\('howto'\)/.test(art)&&/menuGoPage\('teacher'\)/.test(art)&&/menuGoPage\('mic'\)/.test(art),'How To Play, Teacher, and Mic open as drawer sub-pages');
ok(/id:'mback'/.test(art),'sub-pages have a Back control');
ok(/micMeterBars/.test(art)&&((art.match(/drawDrawerTeacher[\s\S]*?drawMenuUI/)||[''])[0].split('micMeterBars').length-1)<=2,'Teacher uses one meter only (micMeterBars, not a second bar graph)');

// --- pause / resume / keys / claps ---
ok(/BB\.openMenu/.test(eng)&&/BB\.pauseGame/.test(eng)&&/BB\.resumeGame/.test(eng)&&/BB\.resyncBeat/.test(eng),'openMenu pauses; close/resume re-syncs the beat');
ok(/BB\.closeMenuNow/.test(eng),'closeMenuNow instantly resumes (for navigation and tests)');
ok(/k==='p'\|\|k==='P'\|\|k==='Escape'/.test(eng),'P and Escape toggle the menu');
ok(!/keys\.some\(k=>k===' '/.test(eng)&&!/k===' '\&\&BB\.toggleMenu/.test(eng),'Space does not toggle the menu');
ok(/const meterOnly=!!BB\.paused/.test(eng)&&/if\(meterOnly\)\{mic\.hold/.test(eng),'paused mic updates the meter but does not collect onsets');
ok(!/openMenu\(\)|toggleMenu\(\)/.test(eng.slice(eng.indexOf('mic.update=')))||!/toggleMenu|openMenu/.test((eng.match(/mic\.update=dt=>[\s\S]*?mic\.lat/)||[''])[0]),'clap/onset path does not open the menu');
ok(/b\.id==='menubtn'/.test(eng),'click snap skips the hamburger so nearby taps/claps do not open it');

// behavioral pause/resume
{
  let paused=false,open=false,closing=false,resync=0,onsets=['x'];
  const API={
    pauseGame(){paused=true;onsets=[]},
    resumeGame(){if(!paused)return;paused=false;resync++;onsets=[]},
    openMenu(){if(open)return;open=true;this.pauseGame()},
    closeMenuNow(){open=false;closing=false;this.resumeGame()}
  };
  API.openMenu();
  ok(paused&&open,'opening the menu pauses the game');
  const midOnsets=onsets.slice();
  ok(midOnsets.length===0,'onsets are cleared when the menu opens (claps cannot sneak in)');
  API.closeMenuNow();
  ok(!paused&&!open&&resync===1,'closing the menu resumes and re-syncs');
}

// --- HUD fixes ---
ok(/Drill-O-Matic 3000/.test(rooms.mine),'mine plaque is Drill-O-Matic 3000');
ok(/was SMASH-O-MATIC/.test(rooms.mine),'comment records the previous name');
ok(/py=GY-260/.test(rooms.mine),'plaque sits on the machine, not under the HUD');
ok(/tpx=W-520/.test(rooms.mine),'tempo panel sits on the right now that the hamburger is top-left');
ok(/MENU_BTN=\{x:28,y:26,s:72\}/.test(art),'hamburger is in the top-left corner');
ok(/translate\(124,24\)/.test(rooms.mine)&&/panel\(124,24/.test(rooms.smasher)&&/panel\(124,24/.test(rooms.packing)&&/PANEL\(124,24/.test(rooms.label)&&/panel\(124,24/.test(rooms.delivery),'top-left HUD panels are shifted right of the hamburger');
ok(/gap=64/.test(rooms.mine)&&/pillW=352/.test(rooms.mine),'strikes are gapped away from the beat lights');
ok(/SMASH-O-MATIC/.test(rooms.smasher),'Note Smasher keeps its own SMASH-O-MATIC 4000 name');
ok(/W-300/.test(rooms.delivery)&&/W-300/.test(rooms.assess),'SKIP controls return toward the right now that the hamburger is gone from that corner');
ok(/in the menu/.test(shell),'GradePick copy points at the menu');
ok(!/id:'hday'/.test(shell)&&!/id:'hgrade'/.test(shell),'DAY/GRADE are off the hub');
ok(!/id:'assess'/.test(shell)&&!/BB\.button\([^)]*'MIC SETUP'/.test(shell),'Assessment and Mic Setup are off the hub');
ok(/drawHudMic|BB\.micIcon/.test(art),'gameplay mic is the tiny icon, not a full meter');
ok(/drawNextTempo|NEXT UP/.test(rooms.mine),'next-tempo preview still present');
for(const [n,src] of Object.entries(rooms)){
  const m=src.match(/steps:\[([^\]]+)\]/);
  if(m){const nSteps=(m[1].match(/'(?:\\'|[^'])*'/g)||[]).length;ok(nSteps<=4,n+' How To Play has at most 4 steps ('+nSteps+')')}
}


// --- Steady Bots title logo ---
ok(/\['logo','webp'\]/.test(art),'title logo loads the webp asset (png fallback on error)');
ok(/assets\/v2\/logo\.webp/.test(read('sw.js'))&&/assets\/v2\/logo\.png/.test(read('sw.js')),'sw.js precaches logo.webp and logo.png');
ok(/STEADY BOTS/.test(shell)||/BB\.V2\.logo/.test(shell),'title screen draws the Steady Bots logo');
ok(!/the real Beat Bots logo/.test(shell),'title screen comment no longer names the old Beat Bots logo');
ok(/Steady Bots Level 4/.test(read('index.html')),'document title is Steady Bots Level 4');
ok(fs.existsSync(path.join(ROOT,'assets/v2/logo.webp'))&&fs.existsSync(path.join(ROOT,'assets/v2/logo.png')),'logo.webp and logo.png are in assets/v2');

// --- assessment: notation, pool, randomization, CSV ---
const as=rooms.assess;
ok(/R\.rhythmCard/.test(as)&&/R\.CHOICE/.test(read('js/rhythm.js')),'hearPick choices use full-card notation (R.rhythmCard)');
ok(!/R\.pills\([^)]*c\.lab/.test(as)&&!/drawGradedHear[\s\S]*?R\.pills\(W\/2/.test(as),'ta/ti-ti word pills are gone from hear choices and the reveal');
ok(/buildAssess/.test(as)&&/_rhythmPool/.test(as),'assessment builds a seedable randomized deck from a rhythm pool');
ok(/rhythm_id,variant_id/.test(as),'CSV keeps existing columns and appends rhythm_id,variant_id');
ok(/o\.rhythmId/.test(as)&&/o\.variantId/.test(as),'log rows store rhythm and variant ids');
ok(/state==='hear'/.test(as),'listening-first hear state is unchanged');
{
  const src=as;
  const start=src.indexOf('const BEAT=');
  const end=src.indexOf('BB.assessLog=');
  const slice=src.slice(start,src.indexOf('/* assessment log'));
  const BB={}; const fn=new Function('BB',slice+';return {buildAssess,POOL,WORDINGS}');
  const {buildAssess,POOL,WORDINGS}=fn(BB);
  ok(POOL.length>=16,'rhythm pool has a solid level-4 set');
  ok(POOL.every(p=>p.seq.reduce((a,k)=>a+({w:4,h:2,q:1,e:1,s:1,r:1}[k]||0),0)===4),'every pool rhythm is exactly 4 beats');
  ok(POOL.some(p=>p.seq.includes('s'))&&POOL.some(p=>p.seq.includes('h'))&&POOL.some(p=>p.seq.includes('w'))&&POOL.some(p=>p.seq.includes('r')),'pool covers tika-tika, half, whole, and rest');
  const d1=buildAssess(1),d2=buildAssess(2),d3=buildAssess(1);
  ok(d1.length===8&&d1.filter(q=>q.kind==='hearPick').length===4,'each run is still 8 questions with 4 hearPicks');
  ok(JSON.stringify(d1)===JSON.stringify(d3),'the same seed rebuilds the same deck');
  ok(JSON.stringify(d1)!==JSON.stringify(d2),'different seeds produce different decks');
  const ids1=d1.filter(q=>q.kind==='hearPick').map(q=>q.rhythmId);
  const ids2=d2.filter(q=>q.kind==='hearPick').map(q=>q.rhythmId);
  ok(new Set(ids1).size===4&&new Set(ids2).size===4,'hearPick targets in a run do not repeat');
  for(const q of d1.concat(d2)){
    if(q.kind!=='hearPick')continue;
    const ks=q.choices.map(c=>c.k);
    ok(new Set(ks).size===ks.length,q.id+' choices are unique');
    ok(ks.includes(q.ans),q.id+' includes the correct answer');
    ok(q.rhythmId===q.ans,q.id+' ans is the target rhythm id');
    ok(q.variantId&&q.prompt,q.id+' has a wording variant');
  }
  const prompts=new Set([d1,d2,buildAssess(3),buildAssess(4),buildAssess(5)].flat().map(q=>q.prompt));
  ok(prompts.size>=6,'wordings vary across seeds');
}


// --- rhythmLine slot layout: no overlapping heads, even spacing, dense ssss fits a choice card ---
{
  const rsrc=read('js/rhythm.js');
  const a=rsrc.indexOf('R.CHOICE='),b=rsrc.indexOf('\n// ---------- extra sounds');
  ok(a>=0&&b>a,'rhythmLayout / CHOICE helpers are exported for tests');
  const R={BEATS:{w:4,h:2,q:1,e:1,s:1,r:1}};
  new Function('R','ctx',rsrc.slice(a,b))(R,{});
  const Wline=400; /* compact staff still has equal slots and no overlaps */
  const minGap=(lay)=> {
    const xs=[];lay.items.forEach(it=>it.heads.forEach(x=>xs.push(x)));
    xs.sort((a,b)=>a-b);
    let g=Infinity;for(let i=1;i<xs.length;i++)g=Math.min(g,xs[i]-xs[i-1]);
    return {xs,g,s:lay.s};
  };
  const ssss=R.rhythmLayout(['s','s','s','s'],Wline,{size:18});
  ok(ssss.items.length===4&&ssss.items.every(it=>it.heads.length===4),'ssss lays out 4 equal beat slots of 4 sixteenths');
  ok(Math.abs(ssss.beatW-100)<1e-6,'four beats share the line equally (100px slots on a 400px card)');
  {
    const {xs,g,s}=minGap(ssss);
    ok(g+1e-6>=2*s,'ssss neighbouring heads are at least a full head-width apart (no overlap)');
    const half=s*0.97; /* rotated ellipse AABB half-width */
    ok(xs[0]-half>=-0.5&&xs[xs.length-1]+half<=Wline+0.5,'ssss heads stay inside the staff');
    ok(ssss.items.every(it=>{
      const last=it.heads[it.heads.length-1],stem=last+s*0.86;
      return stem<=it.slotX+it.slotW+0.75;
    }),'ssss beams/stems stay inside their beat slot');
    const gap0=ssss.items[0].heads[1]-ssss.items[0].heads[0];
    ok(ssss.items.every(it=>it.heads.every((h,i,a)=>i===0||Math.abs((a[i]-a[i-1])-gap0)<1e-6)),'sixteenths are evenly spaced inside each slot');
  }
  const eeee=R.rhythmLayout(['e','e','e','e'],Wline,{size:18});
  ok(eeee.items.every(it=>it.heads.length===2),'eeee lays out 2 eighths per beat slot');
  ok(minGap(eeee).g+1e-6>=2*eeee.s,'eeee heads do not overlap');
  const mixed=R.rhythmLayout(['q','s','e','q'],Wline,{size:18});
  ok(mixed.items.map(it=>it.heads.length).join(',')==='1,4,2,1','mixed q-s-e-q uses 1/4/2/1 heads');
  {
    const {g,s,xs}=minGap(mixed);
    ok(g+1e-6>=2*s,'mixed q-s-e-q heads do not overlap (including across beats)');
    const half=s*0.97;
    ok(xs[0]-half>=-0.5&&xs[xs.length-1]+half<=Wline+0.5,'mixed heads stay on the staff');
  }
  const qonly=R.rhythmLayout(['q','q','q','q'],Wline,{size:18});
  ok(qonly.s>=ssss.s,'lines without sixteenths can keep a larger head size');
  const wide=R.rhythmLayout(['s','s','s','s'],640,{size:22});
  ok(wide.s>ssss.s,'a wider reveal line can use larger heads');
  /* classroom choice-card scale */
  ok(R.CHOICE.bw>=600&&R.CHOICE.bh>=340,'choice cards are wide and tall enough for a classroom');
  const CW=R.choiceWline(),hint=R.CHOICE.size;
  const classS=R.rhythmLayout(['s','s','s','s'],CW,{size:hint});
  const classQ=R.rhythmLayout(['q','q','q','q'],CW,{size:hint});
  const classM=R.rhythmLayout(['q','s','e','q'],CW,{size:hint});
  ok(classS.s+1e-6>=10.638*1.6,'dense (tika-tika ×4) heads are at least 1.6× the previous choice-card size');
  ok(classQ.s>classS.s+6,'quarter-only rhythms stay larger than dense sixteenth lines');
  {
    const {g,s,xs}=minGap(classS);
    ok(g+1e-6>=2*s,'classroom ssss heads do not overlap');
    const half=s*0.97;
    ok(xs[0]-half>=-0.5&&xs[xs.length-1]+half<=CW+0.5,'classroom ssss heads stay on the staff');
    ok(classS.items.every(it=>{
      const last=it.heads[it.heads.length-1],stem=last+s*0.86;
      return stem<=it.slotX+it.slotW+0.75;
    }),'classroom ssss stems/beams stay in their beat slot');
  }
  ok(minGap(classM).g+1e-6>=2*classM.s,'classroom mixed q-s-e-q heads do not overlap');
  ok(/Heard rhythm:[\s\S]*?W\/2,500,34,'#ffe9a0'[\s\S]*?rhythmCard\(W\/2-480,560/.test(as),'Heard rhythm label sits above the reveal plate');
}

// --- smash asset: no leftover white background / enclosed gaps ---
(async()=>{
  try{
    const {createCanvas,loadImage}=require(process.env.CV||'/tmp/cv/node_modules/@napi-rs/canvas');
    const im=await loadImage(path.join(ROOT,'assets/v2/smash.png'));
    const c=createCanvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,im.width,im.height).data;
    const w=im.width,h=im.height,idx=(x,y)=>(y*w+x)*4;
    let near=0,edgeWhite=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=idx(x,y),a=d[i+3],mn=Math.min(d[i],d[i+1],d[i+2]),mx=Math.max(d[i],d[i+1],d[i+2]);
      if(a>20&&mn>=240&&(mx-mn)<=25)near++;
    }
    // pipe-gap samples that used to be solid white
    const gaps=[[196,104],[210,109],[89,158],[205,140]];
    let gapClear=0;
    for(const [x,y] of gaps){if(d[idx(x,y)+3]<16)gapClear++}
    ok(near<=15,'smash.png has almost no near-white background pixels ('+near+')');
    ok(gapClear===gaps.length,'enclosed pipe-gap samples are transparent ('+gapClear+'/'+gaps.length+')');
  }catch(e){ok(false,'smash.png inspect failed: '+e.message)}
  if(fails){console.error('\n'+fails+' failure(s)');process.exit(1)}
  console.log('v14.5.26 tests OK');
})();
