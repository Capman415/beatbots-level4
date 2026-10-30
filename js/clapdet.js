// v13.2 clap detector helpers (shared by engine.js and the offline replays tools/realclaps.js + tools/echotest.js).
// Tuned on two real classroom recordings (25 kids, Smartboard speakers on/off, teacher talking over the claps):
//  - smeared group claps: early kids trigger first, the main body of the class lands 120-200 ms later and used to
//    count as a second clap -> minimum gap between claps (MIN_IOI), lowered only where the rhythm itself is faster.
//  - teacher / kids talking: voiced speech has almost no energy above 2 kHz and a peaky (non-flat) spectrum, a clap
//    is broadband -> spectral clap signature at the onset frame.
//  - speaker output: onsets are found on the RESIDUAL after removing the predicted echo of the app's own output,
//    so a clap on top of loud music still makes a clear jump (EchoGate.resid).
(function(root){
const C={MIN_IOI:.2,MIN_IOI_FAST:.12,UP_K:2.2,VOICE_HFR:.08,VOICE_FLAT:.04,IMP_MIN:2.5,SIB_HFR:.85,SIB_IMP:6,IMP_FLAT:.12,fast:0,fastUntil:-1,// fastUntil: audio time until which 16th-note (tika-tika) rhythms are expected (set by the clap-back)
  refractory(t){if(this.V133&&this.expGap&&(t==null||t<this.expUntil))return Math.min(this.MIN_IOI,Math.max(this.REF_MIN,this.expGap*this.REF_K));return this.fast||(t!=null&&t<this.fastUntil)?this.MIN_IOI_FAST:this.MIN_IOI},
  // v13.3 fast rhythms: rooms announce the shortest note gap they expect (s) -> refractory = .6 x gap (>=70 ms)
  V133:1,IMPX:0,VK:3,REF_K:.6,REF_MIN:.07,REARM:.55,DIP:0,expGap:0,expUntil:-1,expect(gap,until){this.expGap=gap;this.expUntil=until==null?1e9:until},
  // v13.3 re-arm on energy decay: after an onset the detector is disarmed until the level falls below REARM x the
  // clap's peak (or a local dip followed by a new rise = peak-picking inside a smeared group clap); the onset jump is
  // then measured from that valley, not from the decayed peak.
  track(st,x,t){if(!this.V133)return;if(!st.armed){st.pk=Math.max(st.pk||0,x);if(x<st.pk*this.REARM||(this.DIP&&st.px!=null&&t-st.lastOn>this.refractory(t)&&x>st.px*this.DIP&&st.px<st.pk*.7)){st.armed=1;st.val=Math.min(x,st.px==null?x:st.px)}}else st.val=Math.min(st.val,x);st.px=x},
  fired(st,x){st.armed=0;st.pk=x;st.val=x},
  active(t){return this.V133&&this.expGap>0&&(t==null||t<this.expUntil)},
  jumpOk(st,x,prev,jump,t){return x>prev*jump||(this.active(t)&&st.armed&&x>st.val*jump*this.VK)},
  // spectral signature of one analyser frame: pw(i) = linear power of bin i, hz = bin width
  sig(pw,nb,hz){let lo=0,hi=0,lg=0,n=0;const i0=Math.floor(150/hz),i2=Math.floor(2000/hz),i1=Math.min(nb,Math.floor(9000/hz));
    for(let i=i0;i<i1;i++){const p=pw(i);if(i<i2)lo+=p;else hi+=p;lg+=Math.log(p+1e-20);n++}const tot=lo+hi;
    return{hfr:tot>0?hi/tot:0,flat:tot>0?Math.exp(lg/n)/(tot/n):0}},
  // impulsiveness of the newest part of the frame: HF (2nd difference) energy of the loudest 2.7 ms block vs the
  // median block. A clap attack is one sharp spike; vowels, 's'/'sh' and music notes are spread out.
  impulse(buf){const B=128,nb=Math.floor(buf.length/B),e=new Float64Array(nb);for(let b=0;b<nb;b++){let s=0;for(let i=Math.max(2,b*B);i<(b+1)*B;i++){const d=buf[i]-2*buf[i-1]+buf[i-2];s+=d*d}e[b]=s}
    const srt=Array.from(e).sort((x,y)=>x-y),med=srt[nb>>1]+1e-12,mx=Math.max(...e);let r=mx/med;if(this.V133&&this.IMPX){const k=e.indexOf(mx);if(k>=4){const pre=Array.from(e.slice(0,k)).sort((x,y)=>x-y);r=Math.max(r,mx/(pre[pre.length>>1]+1e-12)*.6)}}return r},
  isVoice(s){return(s.imp!=null&&s.hfr>this.SIB_HFR&&s.imp<this.SIB_IMP)||(s.hfr<this.VOICE_HFR&&s.flat<this.VOICE_FLAT)||(s.imp!=null&&s.imp<this.IMP_MIN&&s.flat<this.IMP_FLAT)},
  // gap rule: inside MIN_IOI only a much louder burst (the main body of a smeared group clap) may count, once
  gapOk(st,tNow,x){const g=tNow-st.lastOn;if(g>this.refractory(tNow)&&(!this.active(tNow)||st.armed||g>this.MIN_IOI||st.armed==null))return 1;if(g>this.MIN_IOI_FAST&&!st.up&&x>st.lastX*this.UP_K)return 2;return 0}};

// v13.2 TickLat: the app's own metronome ticks (known schedule, single tone) are found in the mic stream and give the REAL
// speaker->mic latency, continuously (median of recent ticks). binDb(f) = analyser dB at f. Falls back (heard()=false) when
// ticks aren't audible for 8 s, e.g. headphones or muted board.
C.TickLat={pend:[],d:[],lat:null,when:-99,RISE:12,TONAL:10,MAX:.4,
  reset(){this.pend=[];this.d=[];this.lat=null;this.when=-99},
  note(t,dur,freqs){if(freqs&&freqs.length===1&&dur<=.12&&freqs[0]>500){this.pend.push({t:t,f:freqs[0],b:[]});if(this.pend.length>12)this.pend.shift()}},
  frame(tNow,binDb){const keep=[];for(const p of this.pend){if(tNow<p.t-.15){keep.push(p);continue}
      if(tNow<p.t+.005){p.b.push(binDb(p.f));keep.push(p);continue}
      if(tNow>p.t+this.MAX)continue;
      if(p.b.length){const base=p.b.slice().sort((x,y)=>x-y)[p.b.length>>1];const pk=binDb(p.f);if(pk>base+this.RISE&&pk-Math.max(binDb(p.f*.8),binDb(p.f*1.25))>this.TONAL){this.d.push(tNow-p.t);if(this.d.length>9)this.d.shift();if(this.d.length>=5){this.lat=this.d.slice().sort((x,y)=>x-y)[this.d.length>>1];this.when=tNow}continue}}
      keep.push(p)}this.pend=keep},
  active(){return this.pend.length>0},
  heard(tNow){return this.lat!=null&&tNow-this.when<8}};
root.ClapDet=C;if(typeof module!=='undefined')module.exports=C})(typeof window!=='undefined'?window:globalThis);
