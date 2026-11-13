#!/usr/bin/env node
// v14.5.9: throw lanes, tire roll, Sprocket dodge callouts, knockback on-screen.
'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process');
const R=path.join(__dirname,'..'),src=fs.readFileSync(R+'/js/rooms/delivery.js','utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};
const W=1920,H=1080,m=src.match(/const TIRE_LANES=[\s\S]*?DODGE_VO=\{[^}]*\};/);ok(!!m,'lane helpers present');
const L=new Function('W','H',m[0]+';return{throwLane,LANE_TG,DODGE_VO}')(W,H);
// rebuild the 4 dodge rounds from source
const MAP={DK:['duck','junkT'],DL:['L','junkR'],DR:['R','junkL'],JP:['jump','junkF']};
const rounds=[...src.matchAll(/\.\.\.RND\(\d,'[^']*',\[([^\]]*)\]/g)].map(x=>x[1]);ok(rounds.length===4,'4 rounds found');
const seq=[];let nb=0;for(const r of rounds)for(const t of r.match(/DK|DL|DR|JP|FRZ/g)){if(t==='FRZ')seq.push({cue:'freeze',lane:L.throwLane('bomb',nb++)});else seq.push({cue:MAP[t][0],lane:L.throwLane(MAP[t][1],0)})}
const lanes=new Set(seq.map(s=>s.lane));console.log('lanes:',seq.map(s=>s.lane).join(' '));
for(const l of['left','right','high'])ok(lanes.has(l),'lane used: '+l);
ok(seq.some(s=>/^floor/.test(s.lane)),'tire floor lane used');
ok(seq.some(s=>s.lane==='botL'||s.lane==='botR'||/^floor/.test(s.lane)),'things travel toward the bottom');
let run=1,maxRun=1;for(let i=1;i<seq.length;i++){run=seq[i].lane===seq[i-1].lane?run+1:1;maxRun=Math.max(maxRun,run)}ok(maxRun<=1,'no lane repeats back-to-back (max run '+maxRun+')');
const cnt={};seq.forEach(s=>cnt[s.lane]=(cnt[s.lane]||0)+1);ok(Math.max(...Object.values(cnt))<=5,'balanced: no lane over 5 of '+seq.length+' '+JSON.stringify(cnt));
ok(L.LANE_TG.left.x<W*.3&&L.LANE_TG.right.x>W*.7,'left/right lanes well apart');
ok(seq.filter(s=>s.cue==='L').every(s=>s.lane==='right')&&seq.filter(s=>s.cue==='R').every(s=>s.lane==='left'),'lean left dodges a right-side throw (and vice versa)');
ok(seq.filter(s=>s.cue==='duck').every(s=>s.lane==='high')&&seq.filter(s=>s.cue==='jump').every(s=>/^floor/.test(s.lane)),'duck=high, jump=tire floor lane');
// bomb lanes never infinitely the same
const bl=[0,1,2,3,4,5].map(n=>L.throwLane('bomb',n));ok(new Set(bl).size===3&&bl.every((x,i)=>!i||x!==bl[i-1]),'bomb lanes rotate');
// tire: toward viewer and off bottom
ok(/drawTireRoll\(v\*16\)/.test(src)&&/throwPath\(lane,v,JR\.x-40,JR\.y\+170\)/.test(src),'tire rolls from Jr.\'s feet with scrolling tread (visual check: tools/throw_render.js)');
// callouts
for(const[k,id] of Object.entries(L.DODGE_VO)){const f=R+'/vo/'+id+'.mp3';ok(fs.existsSync(f),'vo file '+id);const d=+cp.execSync('ffprobe -v error -show_entries format=duration -of csv=p=0 '+f).toString();ok(d<1.0,id+' short ('+d.toFixed(2)+'s) and ends before the throw lands at 1.2s');ok(src.includes("['"+id+"',"),id+' registered in VO_LINES')}
ok(/if\(b\.mode&&!b\.vo&&DODGE_VO\[b\.ic\]\)b\.vo=DODGE_VO\[b\.ic\]/.test(src),'callouts attached to dodge bars');
ok(/b\.turn=b\.mode\?'jr'/.test(src),'dodge bars are not clap windows (speech cannot charge meter)');
ok(/jx=lerp\(JR\.x,W-250,/.test(src)&&W-250+150<=W,'knockback keeps Static Jr. on screen');
ok(/old gym sock|unmistakable sock/.test(src),'new sock art');
if(fails){console.error(fails+' FAIL');process.exit(1)}console.log('all lane tests passed');
