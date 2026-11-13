// v14.5.7 Boss-gate assessment: 8 checks (follow-along pulse + vocab + hear/pick). Pass 6/8 unlocks Delivery.
// Class answers together. Timing/choice only — never student audio. Manual override logged distinctly.
'use strict';
(()=>{let ctx=BB.ctx;BB._sw.push(g=>ctx=g);const COL=BB.COL,W=BB.W,H=BB.H,{clamp,lerp,ease}=BB,R=BB.R;
BB.VO_LINES=(BB.VO_LINES||[]).concat([
 ['as_intro',"Checkpoint! Eight quick checks. Clap a steady beat, answer three music words, then match four rhythms. Get six right to fight Static Jr.!",'sprocket'],
 ['as_pass',"You passed! Rhythm Engineers... open the Delivery bay!",'sprocket'],
 ['as_fail',"Almost! Let's try those again. Tap RETRY when you're ready.",'sprocket'],
 ['as_next',"Next one!",'sprocket'],
]);
const PASS=6,TOTAL=8;
/* Grade-aware clap window (mirrors GroupGate; assess-only helper — no detector changes) */
BB.assessTol=spb=>{const G=window.GroupGate;if(G&&G.early&&G.late)return{early:G.early(spb),late:G.late(spb),src:'GroupGate'};
  const b=BB.gradeBand&&BB.gradeBand();
  if(b==='k1')return{early:Math.min(.17,spb*.36),late:Math.min(.32,spb*.6),src:'k1'};
  if(b==='m')return{early:Math.min(.14,spb*.32),late:Math.min(.25,spb*.5),src:'m'};
  return{early:Math.min(.12,spb*.28),late:Math.min(.18,spb*.4),src:'u'}};
BB.assessMatchBeat=(onT,expT,spb,lat)=>{const tol=BB.assessTol(spb),dd=(onT-(lat||0))-expT,ok=dd>=-tol.early&&dd<=tol.late;return{ok,off:dd,tol}};


/* v14.5.26: level-appropriate 4-beat rhythm pool + seedable assessment builder.
   Tokens: q quarter, e beamed eighths, r quarter rest, h half, w whole, s tika-tika (16ths). */
const BEAT={w:4,h:2,q:1,e:1,s:1,r:1};
const POOL=[
 {id:'r_qqqq',seq:['q','q','q','q']},
 {id:'r_eqqq',seq:['e','q','q','q']},
 {id:'r_qeqq',seq:['q','e','q','q']},
 {id:'r_qqeq',seq:['q','q','e','q']},
 {id:'r_qqqe',seq:['q','q','q','e']},
 {id:'r_eqeq',seq:['e','q','e','q']},
 {id:'r_qeqe',seq:['q','e','q','e']},
 {id:'r_eeqq',seq:['e','e','q','q']},
 {id:'r_qqee',seq:['q','q','e','e']},
 {id:'r_qeeq',seq:['q','e','e','q']},
 {id:'r_eeee',seq:['e','e','e','e']},
 {id:'r_qqqr',seq:['q','q','q','r']},
 {id:'r_qeqr',seq:['q','e','q','r']},
 {id:'r_qreq',seq:['q','r','e','q']},
 {id:'r_eqqr',seq:['e','q','q','r']},
 {id:'r_qerq',seq:['q','e','r','q']},
 {id:'r_rqqq',seq:['r','q','q','q']},
 {id:'r_qrqq',seq:['q','r','q','q']},
 {id:'r_hqq',seq:['h','q','q']},
 {id:'r_qhq',seq:['q','h','q']},
 {id:'r_qqh',seq:['q','q','h']},
 {id:'r_hh',seq:['h','h']},
 {id:'r_heq',seq:['h','e','q']},
 {id:'r_hqe',seq:['h','q','e']},
 {id:'r_eqh',seq:['e','q','h']},
 {id:'r_sqqq',seq:['s','q','q','q']},
 {id:'r_qsqq',seq:['q','s','q','q']},
 {id:'r_qqsq',seq:['q','q','s','q']},
 {id:'r_seqq',seq:['s','e','q','q']},
 {id:'r_qseq',seq:['q','s','e','q']},
 {id:'r_ssss',seq:['s','s','s','s']},
 {id:'r_sese',seq:['s','e','s','e']},
 {id:'r_eses',seq:['e','s','e','s']},
 {id:'r_w',seq:['w']}
];
POOL.forEach(p=>{const n=p.seq.reduce((a,k)=>a+(BEAT[k]||0),0);if(n!==4)throw new Error('pool '+p.id+' is '+n+' beats')});
const WORDINGS={
 follow:[
  {id:'follow-v1',prompt:'FOLLOW THE BEAT: Clap with the lights — 8 steady ta beats.'},
  {id:'follow-v2',prompt:'Clap a STEADY BEAT with the lights. 8 claps in a row.'},
  {id:'follow-v3',prompt:'Keep a steady beat: clap when the lights flash — 8 times.'}
 ],
 piano:[
  {id:'piano-v1',prompt:'What does PIANO mean?',choices:[{k:'soft',lab:'SOFT / quiet'},{k:'slow',lab:'SLOW'},{k:'loud',lab:'LOUD'}],ans:'soft'},
  {id:'piano-v2',prompt:'If the music says PIANO, how should you play?',choices:[{k:'soft',lab:'SOFT / quietly'},{k:'fast',lab:'FAST'},{k:'loud',lab:'LOUD'}],ans:'soft'},
  {id:'piano-v3',prompt:'PIANO is another word for…',choices:[{k:'soft',lab:'SOFT / quiet'},{k:'slow',lab:'SLOW'},{k:'loud',lab:'LOUD'}],ans:'soft'}
 ],
 andante:[
  {id:'andante-v1',prompt:'What does ANDANTE mean?',choices:[{k:'walk',lab:'WALKING pace'},{k:'loud',lab:'LOUD'},{k:'soft',lab:'SOFT'}],ans:'walk'},
  {id:'andante-v2',prompt:'ANDANTE is a tempo that is…',choices:[{k:'walk',lab:'WALKING pace'},{k:'fast',lab:'FAST / racing'},{k:'loud',lab:'LOUD'}],ans:'walk'},
  {id:'andante-v3',prompt:'If the music says ANDANTE, you should play at a…',choices:[{k:'walk',lab:'WALKING pace'},{k:'soft',lab:'SOFT volume'},{k:'fast',lab:'VERY FAST pace'}],ans:'walk'}
 ],
 allegro:[
  {id:'allegro-v1',prompt:'What does ALLEGRO mean?',choices:[{k:'fast',lab:'FAST / lively'},{k:'loud',lab:'LOUD'},{k:'soft',lab:'SOFT'}],ans:'fast'},
  {id:'allegro-v2',prompt:'ALLEGRO is a tempo that is…',choices:[{k:'fast',lab:'FAST / lively'},{k:'slow',lab:'SLOW / dragging'},{k:'soft',lab:'SOFT'}],ans:'fast'},
  {id:'allegro-v3',prompt:'If the music says ALLEGRO, you should play…',choices:[{k:'fast',lab:'FAST / lively'},{k:'loud',lab:'LOUD only'},{k:'walk',lab:'WALKING pace'}],ans:'fast'}
 ],
 hear:[
  {id:'hear-v1',prompt:'Listen, then tap the matching rhythm.'},
  {id:'hear-v2',prompt:'Which rhythm did you hear?'},
  {id:'hear-v3',prompt:'Listen first. Then pick the notes that match.'},
  {id:'hear-v4',prompt:'Tap the rhythm you just heard.'}
 ]
};
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function shuf(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function pick(a,rnd){return a[Math.floor(rnd()*a.length)]}
function buildAssess(seed){
  const rnd=mulberry32((seed>>>0)||1),qs=[];
  const fv=pick(WORDINGS.follow,rnd);
  qs.push({id:'as_pulse',topic:'steady-beat',room:'assess',kind:'follow',prompt:fv.prompt,variantId:fv.id,bpm:92,countIn:4,practice:4,n:8,need:.625});
  for(const topic of['piano','andante','allegro']){
    const v=pick(WORDINGS[topic],rnd);
    qs.push({id:'as_'+topic,topic,room:'assess',kind:'choice',prompt:v.prompt,choices:shuf(v.choices,rnd),ans:v.ans,variantId:v.id});
  }
  const targets=shuf(POOL,rnd).slice(0,4);
  targets.forEach((tgt,i)=>{
    const others=shuf(POOL.filter(p=>p.id!==tgt.id),rnd).slice(0,2);
    const opts=shuf([tgt,...others],rnd);
    const labs=opts.map(p=>p.seq.join(','));
    if(new Set(labs).size!==opts.length)throw new Error('duplicate hear choices');
    const pv=pick(WORDINGS.hear,rnd);
    qs.push({id:'as_hear'+(i+1),topic:'hear-pick',room:'assess',kind:'hearPick',bpm:86+i*2,
      prompt:pv.prompt,variantId:pv.id,seq:tgt.seq,rhythmId:tgt.id,
      choices:opts.map(p=>({k:p.id,lab:p.seq})),ans:tgt.id});
  });
  return qs;
}
BB.buildAssess=buildAssess;BB._rhythmPool=POOL;BB._assessWordings=WORDINGS;


/* assessment log: numbers/choices only, never audio */
{const KEY='bb_assess2',SKEY='bb_assess_sess',CAP=2000,T0=17e9;
 const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}};
 let ev=ld(KEY,[]),sess=ld(SKEY,[]);
 const pad=n=>String(n).padStart(2,'0'),dstr=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 const qcsv=v=>{v=String(v==null?'':v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
 const dl=(txt,name)=>{const b=new Blob([txt],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
 let dirty=0;const save=()=>{if(!dirty)return;try{localStorage.setItem(SKEY,JSON.stringify(sess));localStorage.setItem(KEY,JSON.stringify(ev));dirty=0}catch(e){if(ev.length>8){ev.splice(0,ev.length>>3);try{localStorage.setItem(KEY,JSON.stringify(ev));dirty=0}catch(e2){}}}};
 setInterval(()=>{try{save()}catch(e){}},3000);
 const tag=()=>({day:(BB.session&&BB.session.day)||'',cls:(BB.session&&BB.session.cls)||'',grade:BB.grade||(BB.session&&BB.session.cls)||''});
 const curRun=()=>{const t=tag(),td=dstr(new Date()),l=sess[sess.length-1];
  if(l&&l.open&&l.date===td&&l.day===t.day&&l.grade===t.grade)return sess.length-1;
  const d=new Date();sess.push({id:td.replace(/-/g,'')+'-'+pad(d.getHours())+pad(d.getMinutes())+'-G'+(t.grade||'?'),date:td,day:t.day,cls:t.cls,grade:t.grade,open:1,correct:0,total:0,passed:0,ver:BB.VERSION||''});dirty=1;return sess.length-1};
 BB.assessLog={
  startRun(){const i=curRun();sess[i].open=1;sess[i].correct=0;sess[i].total=0;sess[i].passed=0;dirty=1;return sess[i]},
  add(o){try{const i=curRun(),S=sess[i],ms=v=>v==null||v===''||isNaN(+v)?'':Math.round(+v*1000);
   /* row: ts, sessIdx, qid, room/topic, ok, choice/response, offset_ms, ver, beat_i, topic, matched, expected, thr_early_ms, thr_late_ms, manual, offs_pipe */
   ev.push([Math.round(Date.now()/100)-T0,i,o.qid||'',o.room||o.topic||'',o.ok?1:0,o.choice||'',ms(o.ms),BB.VERSION||'',o.i??'',o.topic||'',o.matched??'',o.expected??'',ms(o.thrEarly),ms(o.thrLate),o.manual?1:0,o.offs||'',o.rhythmId||'',o.variantId||'']);
   if(ev.length>CAP)ev.splice(0,ev.length-CAP);S.total++;if(o.ok)S.correct++;dirty=1}catch(e){}},
  finish(passed){const i=curRun();sess[i].open=0;sess[i].passed=passed?1:0;sess[i].ver=BB.VERSION||'';dirty=1;save()},
  csv(){save();return 'session_id,date,day,class,grade,timestamp,q_id,room,topic,correct,choice,offset_ms,matched,expected,thr_early_ms,thr_late_ms,manual,offsets_ms,app_version,beat_index,rhythm_id,variant_id\n'+ev.map(r=>{const S=sess[r[1]]||{};
   return[S.id||'',S.date||'',S.day||'',S.cls||'',S.grade||'',r[0]?new Date((r[0]+T0)*100).toISOString():'',r[2],r[3],r[9]||'',r[4],r[5],r[6],r[10],r[11],r[12],r[13],r[14],r[15],r[7],r[8],r[16]||'',r[17]||''].map(qcsv).join(',')}).join('\n')},
  summaryCsv(){save();return 'session_id,date,day,class,grade,correct,total,passed,app_version\n'+sess.map(S=>[S.id||'',S.date||'',S.day||'',S.cls||'',S.grade||'',S.correct||0,S.total||0,S.passed?1:0,S.ver||''].map(qcsv).join(',')).join('\n')},
  download(){dl(BB.assessLog.csv(),'beatbots_assess_'+dstr(new Date())+'.csv')},
  downloadSummary(){dl(BB.assessLog.summaryCsv(),'beatbots_assess_summary_'+dstr(new Date())+'.csv')},
  count:()=>ev.length,
  /* test hook */_reset(){ev=[];sess=[];dirty=1;save()},
  _peek:()=>({ev,sess})}}

/* Follow-along steady pulse: count-in → short practice → scored 8 quarters with visual beat guide */
class FollowPulse{constructor(o={}){this.bpm=o.bpm||92;this.spb=60/this.bpm;this.n=o.n||8;this.countIn=o.countIn||4;this.practice=o.practice||4;
  this.need=o.need||.625;this.onDone=o.onDone;this.t0=BB.ac.currentTime+.45;this.next=0;this.got=new Array(this.n).fill(0);
  this.offs=new Array(this.n).fill(null);this.done=false;this.manual=false;this.lit=new Array(this.n).fill(0);this.marks=new Array(this.n).fill(0);
  this.tol=BB.assessTol(this.spb);BB.mic&&BB.mic.take&&BB.mic.take();BB.groove&&BB.groove.sync(this.t0,this.spb)}
  scoreStart(){return this.countIn+this.practice}
  totalBeats(){return this.scoreStart()+this.n}
  beatNow(){return(BB.ac.currentTime-this.t0)/this.spb}
  beatNowV(){return(BB.ac.currentTime-(BB.visLat?BB.visLat():0)-this.t0)/this.spb}
  phase(){const b=this.beatNow();if(b<0)return 'wait';if(b<this.countIn)return 'count';if(b<this.scoreStart())return 'practice';if(b<this.totalBeats())return 'score';return 'end'}
  expT(i){return this.t0+(this.scoreStart()+i)*this.spb}
  update(dt){const ac=BB.ac,ahead=ac.currentTime+.12,spb=this.spb,N=this.totalBeats();
    /* v14.5.18: SCORE ticks must stay pure-tone. countPulse uses noise (nz) → hard selfSound window that rejects the on-beat clap (same class of bug as punch-rush). Practice/count keep soft ticks only. */
    while(this.t0+this.next*spb<ahead&&this.next<N){const t=this.t0+this.next*spb,i=this.next,sc=i>=this.scoreStart();
      BB.sfx.tick(t,i%4===0||sc,sc?1.15:.7);this.next++}
    const ph=this.phase();BB.listening=ph==='score'?2:(ph==='practice'||ph==='count')?1:0;
    if(window.ClapDet&&ClapDet.expect&&(ph==='score'||ph==='practice'))ClapDet.expect(spb,ac.currentTime+.55);
    {const tv=ac.currentTime-(BB.visLat?BB.visLat():0);for(let i=0;i<this.n;i++){const d=tv-this.expT(i);this.lit[i]=d>=0&&d<.35?1-d/.35:0}}
    for(let i=0;i<this.n;i++)if(this.marks[i])this.marks[i]=Math.min(1,this.marks[i]+dt*5);
    /* drain mic in every live phase so practice claps cannot flood the score window; only SCORE matches count */
    if(ph==='count'||ph==='practice'||ph==='score'||ph==='end'){const ons=BB.mic.take?BB.mic.take():[],lat=(window.GroupGate&&GroupGate.lat)||0;
      if(ph==='score'||ph==='end'){for(const o of ons){if(o.up)continue;if(BB.voBlocks&&BB.voBlocks())continue;
        const bm=BB.bounceMs?BB.bounceMs():.1;if(this._lastOn!=null&&o.t-this._lastOn<bm)continue;this._lastOn=o.t;
        let best=-1,bd=1;for(let i=0;i<this.n;i++){if(this.got[i])continue;const m=BB.assessMatchBeat(o.t,this.expT(i),spb,lat);if(m.ok&&Math.abs(m.off)<bd){bd=Math.abs(m.off);best=i}}
        if(best>=0){const m=BB.assessMatchBeat(o.t,this.expT(best),spb,lat);this.got[best]=1;this.offs[best]=m.off;this.marks[best]=.01;BB.sfx.tink&&BB.sfx.tink(undefined,.55,true)/* quiet: no noise burst */}}}
      /* count/practice: ons discarded above via take() */}
    if(!this.done&&ac.currentTime>this.expT(this.n-1)+this.tol.late+.35){this.finish(false)}}
  finish(manual){if(this.done)return;this.done=true;this.manual=!!manual;const matched=this.got.filter(x=>x===1).length;
    const sc=manual?1:matched/this.n;const ok=manual?true:sc>=this.need;this.score=sc;this.matched=matched;
    this.onDone&&this.onDone({ok,matched,expected:this.n,offs:this.offs.map(v=>v==null?'':Math.round(v*1000)).join('|'),
      thrEarly:this.tol.early,thrLate:this.tol.late,manual:this.manual,sc})}
  override(){if(this.done)return;for(let i=0;i<this.n;i++){if(!this.got[i]){this.got[i]=1;this.marks[i]=.01;this.offs[i]=null/* not a measured offset */}}this.finish(true)}
  draw(cx,y){const ph=this.phase(),bn=this.beatNowV(),seq=Array(this.n).fill('q');
    R.pills(cx,y,seq,{lit:this.lit,marks:this.marks,words:true,bw:78,gap:12});
    /* big synchronized beat dots for follow-along */
    const nd=this.n,tot=nd*90+(nd-1)*10,x0=cx-tot/2;for(let i=0;i<nd;i++){const on=ph==='score'&&Math.floor(bn-this.scoreStart())===i;ctx.fillStyle=on?COL.green:(this.got[i]?COL.yellow:'rgba(255,255,255,.28)');ctx.beginPath();ctx.arc(x0+i*100+40,y+70,on?14:8,0,7);ctx.fill()}
    let msg='';if(ph==='count'){const n=this.countIn-Math.floor(Math.max(0,bn));msg=n>0?'Get ready… '+n:'GO!'}
    else if(ph==='practice')msg='PRACTICE — clap with the lights (not scored)';
    else if(ph==='score')msg='SCORE — clap WITH the green lights!';
    else if(ph==='end')msg='';
    if(msg)BB.text(msg,cx,y-130,40,ph==='score'?COL.green:COL.yellow,{font:'Rammetto One',stroke:7});
    BB.text('Clap with the lights — 8 steady ta beats.',cx,y+130,24,'#cfe8e2',{stroke:4})}}

class AssessRoom{constructor(o={}){this.o=o}
  enter(){this.howTo={title:'CHECKPOINT',steps:['The class answers together — not a one-kid test.','Follow the beat, or pick the matching rhythm.','Get enough right to unlock Static Jr.','No mic? Use Manual Override.'],words:''};this.qi=0;this.score=0;this.state='intro';this.st=BB.t;this.cb=null;this.fp=null;this.flash=null;this.picked=null;this.seed=(this.o&&this.o.seed!=null)?(this.o.seed>>>0):((Date.now()^((Math.random()*1e9)|0))>>>0);this.deck=buildAssess(this.seed);this.run=BB.assessLog.startRun();
    BB.groove&&BB.groove.start(96,'pack');BB.mic&&BB.mic.take&&BB.mic.take();
    this.voEnd=BB.t+(BB.say('as_intro')||2.5)+.3;window.__as=this;
    if(this.o.auto||BB.debug)setTimeout(()=>BB.scene===this&&this.state==='intro'&&this.beginQ(),900)}
  exit(){this.cb=null;this.fp=null}
  beginQ(){this.cb=null;this.fp=null;this.picked=null;this.flash=null;this.hearPlayed=0;this.state='q';this.st=BB.t;this.Q=this.deck[this.qi];
    if(this.Q.kind==='follow')this.startFollow();
    if(this.Q.kind==='hearPick'){this.state='hear';this.st=BB.t;this.playHear()}}
  playHear(){const seq=this.Q.seq,spb=60/(this.Q.bpm||88),t0=BB.ac.currentTime+.35;seq.forEach((k,i)=>{let b=0;for(let j=0;j<i;j++)b+=R.BEATS[seq[j]];const t=t0+b*spb;(R.SUB[k]||[0]).forEach(f=>BB.sfx.block(t+f*spb))});
    this.hearEnd=BB.t+seq.reduce((a,k)=>a+R.BEATS[k],0)*spb+.6}
  startFollow(){const Q=this.Q;this.fp=new FollowPulse({bpm:Q.bpm,n:Q.n,countIn:Q.countIn,practice:Q.practice,need:Q.need,onDone:r=>this.followDone(r)});this.state='follow'}
  followDone(r){this.fp=null;this.grade(r.ok,r.manual?'manual-override':'follow:'+r.matched+'/'+r.expected,{
    matched:r.matched,expected:r.expected,offs:r.offs,thrEarly:r.thrEarly,thrLate:r.thrLate,manual:r.manual,ms:null})}
  grade(ok,choice,perf){if(this.state==='graded'||this.state==='end')return;this.state='graded';this.st=BB.t;this.lastOk=ok;if(ok)this.score++;
    const Q=this.Q,p=perf||{};
    BB.assessLog.add({qid:Q.id,room:Q.room,topic:Q.topic,ok,choice:choice||'',ms:p.ms,matched:p.matched,expected:p.expected,
      thrEarly:p.thrEarly,thrLate:p.thrLate,manual:!!p.manual,offs:p.offs||'',rhythmId:Q.rhythmId||'',variantId:Q.variantId||''});
    BB.sfx[ok?'ding':'wobble']();BB.burst(W/2,420,ok?28:10,{cols:ok?['#6ee678','#ffe066','#fff']:['#c8b49a'],kind:ok?'star':'dust',size:ok?14:12,speed:ok?700:200});
    setTimeout(()=>{if(BB.scene!==this)return;this.qi++;if(this.qi>=TOTAL)this.finish();else{if(BB.say)BB.say('as_next',{overlap:true,nocap:true});this.beginQ()}},ok?900:1100)}
  finish(){const passed=this.score>=PASS;this.state='end';this.st=BB.t;this.passed=passed;BB.assessLog.finish(passed);
    BB.assessUnlocked=!!passed;try{if(passed)localStorage.setItem('bb_assess_ok','1')}catch(e){}
    BB.say(passed?'as_pass':'as_fail');BB.sfx[passed?'fanfare':'wobble']()}
  goBoss(){BB.assessUnlocked=1;BB.go(new BB.DeliveryRoom(this.o||{}))}
  retry(){this.qi=0;this.score=0;this.seed=(this.seed+0x9e3779b9)>>>0;this.deck=buildAssess(this.seed);this.run=BB.assessLog.startRun();this.beginQ()}
  pick(choice){if(this.state!=='q'&&this.state!=='hear')return;const Q=this.Q;let ok=false;
    if(Q.kind==='choice'||Q.kind==='hearPick')ok=choice===Q.ans;
    this.picked=choice;this.grade(ok,String(choice))}
  override(){if(this.fp){this.fp.override();return}
    if(this.state==='q'||this.state==='hear'||this.state==='follow')this.grade(true,'manual-override',{manual:1})}
  update(dt){if(BB.keys.includes(' '))this.override();
    if(this.state==='intro'&&BB.t>this.voEnd)this.beginQ();
    if(this.state==='hear'&&BB.t>(this.hearEnd||0)){this.state='q';this.st=BB.t}
    if(this.fp)this.fp.update(dt);
    if(BB.debug&&(this.state==='q'||this.state==='follow'||this.state==='hear')&&BB.t-this.st>1.2&&!this._auto){this._auto=1;setTimeout(()=>{this._auto=0;if(BB.scene===this)this.override()},400)}}
  drawBanner(){BB.panel(124,40,1480,110,28);BB.text('CHECKPOINT  '+(Math.min(this.qi+1,TOTAL))+' / '+TOTAL,W/2,78,36,COL.yellow,{font:'Rammetto One',stroke:5});
    BB.text('Score  '+this.score+'  ·  need '+PASS+' of '+TOTAL+' to unlock Static Jr.',W/2,118,28,'#cfe8e2',{stroke:4})}
  drawProgress(){for(let i=0;i<TOTAL;i++){const x=260+i*175,y=155,done=i<this.qi,cur=i===this.qi&&this.state!=='end'&&this.state!=='intro';
      BB.rrect(x,y,150,18,9,done?'#6ee678':cur?'#ffe066':'#2a3a38','#fff',2)}}
  drawPrompt(txt){/* sit the question above the taller notation cards (replay lives between them) */BB.text(txt,W/2,260,40,'#fff',{font:'Rammetto One',stroke:7,maxW:1700})}
  drawFollow(){if(this.fp)this.fp.draw(W/2,500);BB.text('No mic? Teacher taps MANUAL OVERRIDE when the class nails it (logged as override, not a measured clap).',W/2,780,24,COL.yellow,{stroke:4,maxW:1600});
    BB.button(W/2-220,840,440,90,'MANUAL OVERRIDE',{style:'cream',size:32,id:'asov',onClick:()=>this.override()})}
  drawChoice(){const Q=this.Q,n=Q.choices.length,bw=Math.min(420,Math.floor(1500/n)-24),gap=24,tot=n*bw+(n-1)*gap,x0=W/2-tot/2;
    Q.choices.forEach((c,i)=>{const x=x0+i*(bw+gap),on=this.picked===c.k;
      BB.button(x,420,bw,220,'',{style:on?'green':'cream',id:'asc'+i,onClick:()=>this.pick(c.k)});
      /* v14.5.18: cream/gold lettering on the dark teal cream-button face (was near-black #19191f — unreadable) */
      /* v14.5.21: removed spoiler/hint sub-labels under each choice (e.g. 'that is forte', 'not about speed') */
      BB.text(c.lab,x+bw/2,530,c.lab.length>12?32:44,'#ffe9a0',{font:'Rammetto One',stroke:6,strokeCol:'#1a1a1a',maxW:bw-24})})}
  drawHearPick(){const Q=this.Q;
    /* audio-first: options stay up while the drum plays — never draw the target Q.seq, never highlight the answer. Target notation only after a correct grade. */
    const listening=this.state==='hear',n=Q.choices.length,C=R.CHOICE,bw=C.bw,bh=C.bh,gap=C.gap,tot=n*bw+(n-1)*gap,x0=W/2-tot/2,y=C.y;
    if(!listening)BB.button(W/2-160,320,320,64,'REPLAY RHYTHM',{size:26,id:'asreplay',onClick:()=>{this.state='hear';this.st=BB.t;this.playHear()}});
    Q.choices.forEach((c,i)=>{const x=x0+i*(bw+gap);BB.button(x,y,bw,bh,'',{style:'cream',id:'ash'+i,onClick:()=>this.pick(c.k)});
      R.rhythmCard(x,y,bw,bh,c.lab,{ink:'#19191f',letter:String.fromCharCode(65+i)})})}
  drawGradedHear(){const Q=this.Q;if(!(Q&&Q.kind==='hearPick'&&this.lastOk))return;
    /* label sits clearly above the cream plate, gold on the dark room for classroom contrast */
    BB.text('Heard rhythm:',W/2,500,34,'#ffe9a0',{font:'Rammetto One',stroke:6});
    R.rhythmCard(W/2-480,560,960,280,Q.seq,{ink:'#19191f',size:28})}
  draw(){ctx.fillStyle='#0d1d1b';ctx.fillRect(0,0,W,H);if(BB.V2&&BB.V2.hub_bg){ctx.globalAlpha=.35;ctx.drawImage(BB.V2.hub_bg,0,0,W,H);ctx.globalAlpha=1}
    BB.contactShadow(220,980,110,.45);BB.sprite&&BB.sprite('sprocket',220,980,360,{squash:BB.isTalking&&BB.isTalking('sprocket')?Math.sin(BB.t*16)*.015:0});
    if(this.state==='intro'){BB.panel(260,200,1400,560,40);BB.text('CHECKPOINT',W/2,300,72,'#fff',{font:'Rammetto One',stroke:10});
      BB.text(TOTAL+' checks: steady beat · piano · andante · allegro · 4 rhythm matches.',W/2,390,32,COL.yellow,{stroke:5,maxW:1200});
      BB.text('Get '+PASS+' right to unlock the boss. Class answers together — not a one-kid test.',W/2,450,28,'#cfe8e2',{stroke:4,maxW:1200});
      BB.button(W/2-260,560,520,120,'START CHECK',{style:'green',size:48,id:'asstart',onClick:()=>this.beginQ()});return}
    this.drawBanner();this.drawProgress();
    if(this.state==='end'){BB.panel(260,240,1400,620,40);
      BB.text(this.passed?'YOU PASSED!':'TRY AGAIN',W/2,340,72,this.passed?COL.green:COL.yellow,{font:'Rammetto One',stroke:10});
      BB.text('Class score: '+this.score+' / '+TOTAL,W/2,440,48,'#fff',{stroke:6});
      BB.text(this.passed?'Delivery bay unlocked. Ready for Static Jr.!':'Need '+PASS+' correct. Tap RETRY for another run.',W/2,520,32,COL.yellow,{stroke:4,maxW:1200});
      if(this.passed)BB.button(W/2-280,620,560,120,'FIGHT STATIC JR.!',{style:'green',size:44,id:'asboss',onClick:()=>this.goBoss()});
      else BB.button(W/2-280,620,560,120,'RETRY CHECKPOINT',{style:'green',size:44,id:'asretry',onClick:()=>this.retry()});
      BB.button(200,780,360,80,'Download assess CSV',{size:26,id:'asdl',onClick:()=>BB.assessLog.download()});
      BB.button(580,780,360,80,'Download summary',{size:26,id:'asdls',onClick:()=>BB.assessLog.downloadSummary()});
      BB.button(960,780,360,80,'ROOM MAP',{size:26,id:'asmap',onClick:()=>BB.go(new BB.MapScene())});
      return}
    if(this.state==='graded'){BB.text(this.lastOk?'GOT IT!':"Not yet — that's ok!",W/2,400,72,this.lastOk?COL.green:COL.yellow,{font:'Rammetto One',stroke:10});if(this.lastOk)this.drawGradedHear();BB.captionBox();return}
    this.drawPrompt(this.Q.prompt);
    if(this.Q.kind==='follow'||this.state==='follow')this.drawFollow();
    else if(this.Q.kind==='choice')this.drawChoice();
    else if(this.Q.kind==='hearPick')this.drawHearPick();
    BB.button(W-300,24,260,70,'SKIP Q',{size:28,id:'asskip',onClick:()=>this.grade(false,'skip')});
    BB.captionBox()}}
BB.AssessRoom=AssessRoom;BB._assessQS=buildAssess(1);BB._assessPASS=PASS;BB._assessTOTAL=TOTAL;BB.FollowPulse=FollowPulse;
/* open Delivery through the gate unless already unlocked this session or ?assess=0 */
BB.openDelivery=(o={})=>{try{const q=new URLSearchParams(location.search).get('assess');if(q==='0'||BB.assessUnlocked)return new BB.DeliveryRoom(o)}catch(e){}return new AssessRoom(o)};
})();
