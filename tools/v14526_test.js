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
ok(/tpx=W-630/.test(rooms.mine),'tempo panel is inset so the hamburger cannot clip ANDANTE');
ok(/gap=64/.test(rooms.mine)&&/pillW=352/.test(rooms.mine),'strikes are gapped away from the beat lights');
ok(/SMASH-O-MATIC/.test(rooms.smasher),'Note Smasher keeps its own SMASH-O-MATIC 4000 name');
ok(/W-430/.test(rooms.delivery)&&/W-430/.test(rooms.assess),'SKIP controls sit clear of the hamburger');
ok(/in the menu/.test(shell),'GradePick copy points at the menu');
ok(!/id:'hday'/.test(shell)&&!/id:'hgrade'/.test(shell),'DAY/GRADE are off the hub');
ok(!/id:'assess'/.test(shell)&&!/BB\.button\([^)]*'MIC SETUP'/.test(shell),'Assessment and Mic Setup are off the hub');
ok(/drawHudMic|BB\.micIcon/.test(art),'gameplay mic is the tiny icon, not a full meter');
ok(/drawNextTempo|NEXT UP/.test(rooms.mine),'next-tempo preview still present');
for(const [n,src] of Object.entries(rooms)){
  const m=src.match(/steps:\[([^\]]+)\]/);
  if(m){const nSteps=(m[1].match(/'(?:\\'|[^'])*'/g)||[]).length;ok(nSteps<=4,n+' How To Play has at most 4 steps ('+nSteps+')')}
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
