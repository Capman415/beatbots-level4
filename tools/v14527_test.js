#!/usr/bin/env node
// v14.5.28: recut Steady Bots title logo (clean matte, no baked shadow), moved down, code drop shadow
'use strict';
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const ROOT=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const shell=read('js/shell.js'),eng=read('js/engine.js'),art=read('js/art.js');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

const ver=JSON.parse(read('version.json'));
ok(ver.version==='v14.5.28'&&ver.build==='1794301528','version.json is v14.5.28 / 1794301528');
ok(/BB\.VERSION='v14.5.28'/.test(eng),'BB.VERSION synced');
ok((read('index.html').match(/1794301528/g)||[]).length>=2,'index.html build synced');
ok(/bb-1794301528/.test(read('sw.js')),'sw cache bumped so devices fetch the new logo');
ok(/assets\/v2\/logo\.webp/.test(read('sw.js'))&&/assets\/v2\/logo\.png/.test(read('sw.js')),'sw.js still precaches logo.webp and logo.png');

ok(/\['logo','webp'\]/.test(art),'title logo loads the webp asset (png fallback on error)');
ok(fs.existsSync(path.join(ROOT,'assets/v2/logo.webp'))&&fs.existsSync(path.join(ROOT,'assets/v2/logo.png')),'logo.webp and logo.png are in assets/v2');

// --- TitleScene placement: rest top 90, h=372, subtitle and START clear, room for robots ---
const title=shell.slice(shell.indexOf('class TitleScene'), shell.indexOf('// ---- Mic setup'));
ok(/const h=372/.test(title),'title logo height is 372 (shrunk to leave a top margin)');
ok(/drawImage\(lg,-w\/2,-210,w,h\)/.test(title),'logo is drawn at y=-210 relative to origin 300 (rest top 90)');
ok(/logoText\('LEVEL 4: THE RHYTHM WAREHOUSE',0,254,70/.test(title),'subtitle sits at relative y=254 (stage 554), below the logo');
ok(/BB\.button\(W\/2-260,705,520,160,'START'/.test(title),'START is at y=705, below the subtitle');
ok(/BB\.contactShadow\(380,1010/.test(title)&&/BB\.sprite\('sprocket',380,1010/.test(title),'corner robots stay at y=1010');
ok(/shadowBlur=32/.test(title)&&/shadowOffsetY=14/.test(title),'drop shadow is drawn in code from the logo alpha');
ok(!/,-310,w,h\)/.test(title),'old clipped drawImage y=-310 is gone');
ok(!/const h=420/.test(title),'old logo height 420 is gone');

// Geometry: ease.back peaks at ~1.1017 around origin y=300
const ORIGIN=300, LOGO_H=372, DRAW_Y=-210, SUB_REL=254, START_Y=705, ROBOT_Y=1010;
const restTop=ORIGIN+DRAW_Y, restBot=restTop+LOGO_H;
const peak=t=>ORIGIN+(t-ORIGIN)*1.1017;
// logoText: bitmap top = cy - s*0.8, bottom ~= cy + s*0.95  (canvas h = s*1.75, drawn at cy-s*0.8)
const subCy=ORIGIN+SUB_REL, subTop=subCy-70*0.8, subBot=subCy-70*0.8+70*1.75;
ok(restTop>=80,'rest logo top has a comfortable margin (>=80px)');
ok(peak(restTop)>=60,'ease.back overshoot still keeps logo top (antenna) on stage (>=60px)');
ok(restBot+16<=subTop,'logo bottom does not overlap the subtitle (16px gap)');
ok(subBot+16<=START_Y,'subtitle does not overlap START');
ok(START_Y+160+40<=ROBOT_Y,'START stays clear of the corner robots');
ok(peak(subBot)+16<=START_Y,'subtitle overshoot still stays above START');
console.log('  layout',{restTop,restBot,peakTop:+peak(restTop).toFixed(1),subTop,subBot,START_Y,ROBOT_Y});

// --- asset matte quality (python / PIL) ---
const py=`
from PIL import Image
import numpy as np, sys
im=Image.open(sys.argv[1])
assert im.mode=='RGBA', 'logo.png must be RGBA, got '+im.mode
a=np.array(im)
al=a[...,3]; rgb=a[...,:3].astype(np.float32)
h,w=al.shape
ys,xs=np.where(al>0)
assert xs.size>0
y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
# padding so AA is not clipped
assert y0>=6 and x0>=6 and (h-1-y1)>=6 and (w-1-x1)>=6, f'content too tight to the frame {x0,y0,x1,y1} in {w}x{h}'
# full robot head / antenna: opaque content should start near the top pad (not a cropped head)
# the top-most opaque pixels are the STEADY letter tops + we require a reasonably tall mark
assert (y1-y0) > h*0.85, 'content looks vertically cropped'
# no baked cream/white halo: partial-alpha pixels should not be clustered on the cream plate color
band=(al>12)&(al<240)
bg=np.array([252.5,240.5,231.2])
if band.any():
    d=np.linalg.norm(rgb[band]-bg,axis=1)
    frac=(d<18).mean()
    assert frac<0.08, f'cream remnants in the matte fringe: {frac:.3f} of partial pixels are plate-colored'
# no chunky mid-alpha blotches (the old baked shadow was a large semi-transparent tan region)
soft=(al>8)&(al<180)
# tan / brown-gray blotch: mid lightness, low-ish saturation, not on a tight 1-2px edge
# count soft pixels deep inside a 8px+ blob — baked shadow; a clean matte only has thin AA fringes
from scipy.ndimage import distance_transform_edt, binary_erosion
deep = soft & (distance_transform_edt(al>8)>6)
assert deep.mean()<0.004, f'blotchy baked-shadow leftovers: deep soft alpha {deep.mean():.4f}'
print('ASSET_OK', w, h, 'pad', int(y0), int(x0), int(h-1-y1), int(w-1-x1), 'partial%', round(100*((al>0)&(al<255)).mean(),2))
`
try{
  const out=execFileSync('python3',['-c',py,path.join(ROOT,'assets/v2/logo.png')],{encoding:'utf8'});
  process.stdout.write(out);
  ok(/ASSET_OK/.test(out),'logo.png has a clean antialiased matte, padding, and no baked cream shadow');
}catch(e){
  if(e.stdout)process.stdout.write(e.stdout);
  if(e.stderr)process.stderr.write(e.stderr);
  ok(false,'logo.png matte check failed: '+(e.stderr||e.stdout||e.message).toString().trim().split('\n').pop());
}


// --- fixed notation scale + equal choice-card rects ---
{
  const rsrc=read('js/rhythm.js'),as=read('js/rooms/assess.js');
  const a=rsrc.indexOf('R.CHOICE='),b=rsrc.indexOf('\n// ---------- extra sounds');
  ok(a>=0&&b>a,'rhythm helpers extractable');
  const R={BEATS:{w:4,h:2,q:1,e:1,s:1,r:1}};
  new Function('R','ctx',rsrc.slice(a,b))(R,{});
  ok(typeof R.choiceScale==='function'&&R.CHOICE.pack>0,'choiceScale + pack are exported');
  const CW=R.choiceWline(),s0=R.choiceScale();
  ok(s0>0,'choiceScale is a positive classroom head size');
  const pool=[
    ['s','s','s','s'],['e','e','e','e'],['q','q','q','q'],['r','q','q','q'],
    ['q','s','e','q'],['e','s','e','s'],['s','e','q','q'],['e','e','q','q'],
    ['h','q','q'],['w'],['q','e','s','r']
  ];
  const sizes=pool.map(seq=>R.rhythmLayout(seq,CW,{s:s0}).s);
  ok(sizes.every(s=>Math.abs(s-s0)<1e-9),'identical head radius across all pool-like rhythms on a choice card');
  const reveal=R.rhythmLayout(['q','s','e','q'],916,{s:s0});
  ok(Math.abs(reveal.s-s0)<1e-9,'the reveal plate uses the same head size as the choice cards');
  // densest fits with no overlaps at that fixed size
  const ssss=R.rhythmLayout(['s','s','s','s'],CW,{s:s0});
  const xs=[];ssss.items.forEach(it=>it.heads.forEach(x=>xs.push(x)));xs.sort((a,b)=>a-b);
  let g=Infinity;for(let i=1;i<xs.length;i++)g=Math.min(g,xs[i]-xs[i-1]);
  ok(g+1e-6>=2*s0,'tika-tika ×4 heads do not overlap at the fixed classroom scale');
  const half=R.HEAD_HALF(s0);
  ok(xs[0]-half>=-0.5&&xs[xs.length-1]+half<=CW+0.5,'tika-tika ×4 heads stay on the staff');
  ok(ssss.items.every(it=>it.heads[it.heads.length-1]+s0*0.86<=it.slotX+it.slotW+0.75),'tika-tika ×4 stems/beams stay in their beat slot');
  // equal card rects, aligned
  const hear=as.slice(as.indexOf('drawHearPick()'), as.indexOf('drawGradedHear()'));
  ok(/const listening=this\.state==='hear',n=Q\.choices\.length,C=R\.CHOICE,bw=C\.bw,bh=C\.bh,gap=C\.gap/.test(hear),'all three hear-pick cards share R.CHOICE width, height, and gap');
  ok(/const x=x0\+i\*\(bw\+gap\);BB\.button\(x,y,bw,bh/.test(hear),'cards are laid out on one y with identical bw×bh hit rects');
  ok(/R\.rhythmCard\(x,y,bw,bh,c\.lab/.test(hear),'notation fills those same equal card rects');
  ok(/s:R\.choiceScale\(\)/.test(as),'graded reveal passes the shared choiceScale');
}

// --- result screen: no downloads, buttons inside a centered panel, clear of pips, no Sprocket overlap ---
{
  const as=read('js/rooms/assess.js');
  const end=as.slice(as.indexOf("if(this.state==='end')"), as.indexOf("if(this.state==='graded')"));
  ok(!/Download assess CSV/.test(end)&&!/Download summary/.test(end)&&!/id:'asdl'/.test(end)&&!/id:'asdls'/.test(end),'result screen no longer has the download buttons');
  ok(/FIGHT STATIC JR\.!/.test(end)&&/RETRY CHECKPOINT/.test(end)&&/id:'asmap'/.test(end)&&/ROOM MAP/.test(end),'pass keeps FIGHT STATIC JR.!; fail keeps RETRY; both keep ROOM MAP');
  ok(/pipBot=173/.test(end)&&/availT=pipBot\+40/.test(end),'result panel is placed below the header pips');
  ok(/px=\(W-pw\)\/2/.test(end)&&/py=Math\.round\(\(availT\+availB\)\/2-ph\/2\)/.test(end),'result panel is centered in the remaining stage');
  ok(/btnY=py\+ph-pad-btnH/.test(end)&&/priW=540/.test(end)&&/secW=420/.test(end),'primary and secondary buttons sit side by side above the panel padding');
  // numeric containment
  const W=1920,H=1080,pipBot=173,pad=56,pw=1400,ph=560,px=(W-pw)/2,availT=pipBot+40,availB=H-48,py=Math.round((availT+availB)/2-ph/2);
  const btnH=120,btnY=py+ph-pad-btnH,priW=540,secW=420,gap=36,row=priW+gap+secW,bx=W/2-row/2;
  ok(py>=pipBot+40,'panel top is at least 40px below the pips');
  ok(px>=0&&px+pw<=W&&py>=0&&py+ph<=H,'panel stays on stage');
  ok(bx>=px+pad&&bx+priW+gap+secW<=px+pw-pad,'both buttons are fully inside the panel padding');
  ok(btnY>=py+pad&&btnY+btnH<=py+ph-pad,'buttons sit fully inside the vertical padding');
  ok(/state!=='end'/.test(as)&&/sprite\('sprocket',220,980,360/.test(as),'Sprocket is not drawn on the result screen (no overlap)');
}

// --- Teacher > Data still has working assess downloads ---
{
  const art=read('js/art.js');
  const teach=art.slice(art.indexOf('BB.drawDrawerTeacher='), art.indexOf('BB.drawMenuUI='));
  ok(/head\('Data'\)/.test(teach),'Teacher drawer has a Data section');
  ok(/Download assess CSV/.test(teach)&&/Download assess summary/.test(teach),'Teacher Data lists assess CSV and summary downloads');
  ok(/row\('Download assess CSV','asdl',\(\)=>BB\.assessLog\.download\(\)\)/.test(teach),'Data row downloads the assess CSV');
  ok(/row\('Download assess summary','asdls',\(\)=>BB\.assessLog\.downloadSummary\(\)\)/.test(teach),'Data row downloads the assess summary');
}

if(fails){console.error(fails+' v14.5.28 test(s) failed');process.exit(1)}
console.log('v14.5.28 tests OK');
