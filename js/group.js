// Group-clap gate (shared by the game and the offline classroom simulator, tools/groupsim.js).
// Each mic frame we log a high-frequency clap energy: mean square of the 2nd difference of the waveform.
// That emphasises broadband clap transients (2-8 kHz) and suppresses our own 880/1320 Hz beeps ~80x and most speech.
// A beat counts only if the energy that piles up inside its window looks like a GROUP: a big, time-smeared burst
// compared with (a) the quiet-room floor and (b) what single stray claps sound like in this room.
(function(root){
const G={hist:[],floor:1e-9,single:0,singleN:0,group:0,groupN:0,cal:0,sensMul:1,
  W0:-.12,W1:.16,
  win(spb){return[-Math.min(.12,spb*.24),Math.min(.16,spb*.4)]},// v12.2: beat window shrinks at Allegro so the off-beat half doesn't leak in      // beat window (s) around the expected clap time
  K_FLOOR:1.2,          // window energy must exceed this many "quiet windows"
  K_SINGLE:1.6,         // ... and this many single stray claps
  K_GROUP:.15,          // ... and this fraction of the learned/calibrated group level
  MIN_DUR:.035,PW:.5,        // burst must stay above 1/4 of its peak this long (group claps smear)
  // clap onset rule (shared with engine.js): relative jump over an adaptive noise floor, low absolute minimum so soft claps count
  ONSET_K:2.2,ONSET_ADD:.0015,ONSET_MIN:.003,ONSET_JUMP:1.3,
  // meter scale (shared by the mic meter, onsets and the room's p/f checks)
  // v12.2 loudness: dB scale relative to THIS mic's clap range (raw Chromebook/phone mics put even soft claps near
  // full scale, which saturated the old sqrt meter). Range = clap-check soft/loud samples if we have them, else an
  // adaptive percentile of recent clap peaks, else a default -46..-14 dBFS. Meter, piano and forte all use it.
  loud:{peaks:[],calLo:null,calHi:null},
  dB(r){return 20*Math.log10(Math.max(r,1e-6))},
  // centre = median of recent NORMAL claps (piano/forte rocks don't teach it). Normal claps read ~0.5,
  // +10 dB reads 1.0 (forte needs >= LOUD_MIN), and the soft side spans 30 dB so even whisper claps light the bar.
  centre(sens){const L=this.loud;if(L.calLo!=null&&L.calHi!=null&&L.calHi-L.calLo>4)return(L.calLo+L.calHi)/2;
    if(L.peaks.length>=4){const a=[...L.peaks].sort((x,y)=>x-y);return a[a.length>>1]}return-30-20*Math.log10(sens||1)},
  notePeak(rms){const L=this.loud;L.peaks.push(this.dB(rms));if(L.peaks.length>40)L.peaks.shift()},
  calLoud(softRms,loudRms){this.loud.calLo=softRms?this.dB(softRms):null;this.loud.calHi=loudRms?this.dB(loudRms):null},
  lvl(rms,sens){const d=this.dB(rms)-this.centre(sens);return Math.min(1,Math.max(0,d>=0?.5+d/20:.5+d/60))},
  SOFT_BAR:.1,SOFT_MAX:.65,LOUD_MIN:.8,// SOFT_BAR = first green meter segment lit
  rmsForLvl(l,sens){const c=this.centre(sens),d=l>=.5?(l-.5)*20:(l-.5)*60;return Math.pow(10,(c+d)/20)},
  // soft=true (piano challenge): anything that lights the soft bar is an onset, as long as it clears the room floor
  onsetThr(floor,sens,soft){const t=Math.max(floor*this.ONSET_K+this.ONSET_ADD,this.ONSET_MIN)/(sens||1);
    return soft?Math.min(t,Math.max(floor*1.6,this.rmsForLvl(this.SOFT_BAR,sens))):t},
  reset(){this.hist.length=0},
  hf(buf){let s=0;for(let i=2;i<buf.length;i++){const d=buf[i]-2*buf[i-1]+buf[i-2];s+=d*d}return s/(buf.length-2)},
  push(t,e,dt){const h=this.hist;h.push(t,e);if(h.length>2400)h.splice(0,h.length-2000);
    // quiet-room floor: slow follower of the low end of the energy
    if(!this.fInit){this.floor=e;this.fInit=1}else if(e<this.floor*2.5)this.floor+=(e-this.floor)*Math.min(1,dt*1.5);else this.floor*=1+dt*.05},
  // integrate excess energy in [t0,t1]
  measure(t0,t1,fm=1.5){const h=this.hist,f=this.floor*fm;let E=0,pk=0,pt=0,last=null;const ev=[];
    for(let i=0;i<h.length;i+=2){const t=h[i];if(t<t0||t>t1)continue;const dt=last==null?1/60:Math.min(.05,t-last);last=t;const x=Math.pow(Math.max(0,h[i+1]-f),this.PW);E+=x*dt;ev.push(t,x);if(x>pk){pk=x;pt=t}}
    let dur=0;for(let i=0;i<ev.length;i+=2)if(ev[i+1]>pk*.25)dur+=i?Math.min(.05,ev[i]-ev[i-2]):1/60;
    return{E,pk,pt,dur}},
  thresh(){const win=this.W1-this.W0;let thr=Math.pow(this.floor,this.PW)*win*this.K_FLOOR;
    if(this.singleN>=2)thr=Math.max(thr,this.single*this.K_SINGLE);
    const g=this.cal&&this.group?Math.min(this.cal,this.group):(this.cal||this.group);if(g)thr=Math.max(thr,g*this.K_GROUP);return thr/this.sensMul},
  // decide one beat; tc = expected clap time on the mic clock
  judge(tc,soft,spb){const[w0,w1]=spb?this.win(spb):[this.W0,this.W1];const m=this.measure(tc+w0,tc+w1,soft?1.05:1.5);const thr=(soft?Math.pow(this.floor,this.PW)*(w1-w0)*this.K_FLOOR*.5/this.sensMul:this.thresh()*(w1-w0)/(this.W1-this.W0));// piano: the onset already passed the soft-bar test; only demand it beats the room floor
    m.ok=m.E>thr&&m.dur>=(soft?this.MIN_DUR*.6:this.MIN_DUR);m.thr=thr;
    if(m.ok&&!soft){this.group=this.groupN?this.group+(m.E-this.group)*(m.E>this.group?.2:.3):m.E;this.groupN++}
    return m},
  // a stray onset well away from any beat teaches us what one or two kids sound like here
  // beat tolerance and stray test scale with tempo: at Allegro (145 bpm, 0.41 s/beat) a slightly late GROUP clap
  // must never be mistaken for a lone stray, or it teaches the gate that the group is 'single-kid' loud.
  tol(spb){return Math.min(.17,spb*.36)},
  isStray(dt,spb){return Math.abs(dt)>=Math.max(this.tol(spb)+.03,Math.min(.2,spb*.45))},
  stray(t){const m=this.measure(t-.03,t+.1);if(m.E<=0)return;this.single=this.singleN?Math.max(this.single*.9+m.E*.1,Math.min(this.single,m.E)):m.E;this.singleN++},
  calibrate(Es){Es=Es.filter(x=>x>0).sort((a,b)=>a-b);if(Es.length>=2)this.cal=Es[Es.length>>1];return this.cal}};
root.GroupGate=G;if(typeof module!=='undefined')module.exports=G})(typeof window!=='undefined'?window:globalThis);
