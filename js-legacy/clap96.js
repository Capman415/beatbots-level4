(function(root) {
  var NF = 1024, NB = 24, P = { k: 0.2, A: 1, B: 0.6, C: 1.5, TAILW: 0.25, MINSEP: 0.07, OVER: 3, PRE: 0.06, FG: 0.16, CF: 0.3, PREF: 0.45 };
  function edges() {
    var e = [], lo = Math.log(700), hi = Math.log(12e3);
    for (var i = 0; i <= NB; i++) e.push(Math.exp(lo + (hi - lo) * i / NB));
    return e;
  }
  var Core = {
    P,
    NF,
    NB,
    bandMap: function(sr) {
      var e = edges(), m = new Int16Array(NF / 2 + 1);
      for (var k = 0; k <= NF / 2; k++) {
        var f = k * sr / NF;
        m[k] = -1;
        for (var b = 0; b < NB; b++) if (f >= e[b] && f < e[b + 1]) {
          m[k] = b;
          break;
        }
      }
      return m;
    },
    hann: function() {
      var w = new Float32Array(NF);
      for (var i = 0; i < NF; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (NF - 1));
      return w;
    },
    fft: function(re, im) {
      var n = re.length, i, j, b, t;
      for (i = 1, j = 0; i < n; i++) {
        b = n >> 1;
        for (; j & b; b >>= 1) j ^= b;
        j ^= b;
        if (i < j) {
          t = re[i];
          re[i] = re[j];
          re[j] = t;
          t = im[i];
          im[i] = im[j];
          im[j] = t;
        }
      }
      for (var l = 2; l <= n; l <<= 1) {
        var a = -2 * Math.PI / l, h = l / 2;
        for (var k = 0; k < h; k++) {
          var c = Math.cos(a * k), s = Math.sin(a * k);
          for (i = 0; i < n; i += l) {
            var p = i + k + h, xr = re[p] * c - im[p] * s, xi = re[p] * s + im[p] * c;
            re[p] = re[i + k] - xr;
            im[p] = im[i + k] - xi;
            re[i + k] += xr;
            im[i + k] += xi;
          }
        }
      }
    },
    // band powers of one 1024-sample frame
    bands: function(x, off, map, win, re, im, out) {
      for (var i = 0; i < NF; i++) {
        re[i] = x[off + i] * win[i];
        im[i] = 0;
      }
      Core.fft(re, im);
      for (var b = 0; b < NB; b++) out[b] = 0;
      for (var k = 0; k <= NF / 2; k++) {
        var m = map[k];
        if (m >= 0) out[m] += re[k] * re[k] + im[k] * im[k];
      }
      return out;
    },
    // SuperFlux on residual band powers: Pm,R arrays of Float32Array(NB) (R already delayed/max-filtered), g per-band gain
    flux: function(Pm, R, g, i) {
      var L = Core._L(Pm, R, g, i), L2 = Core._L(Pm, R, g, i - 2), s = 0;
      if (!L2) return 0;
      for (var b = 0; b < NB; b++) {
        var mx = L2[b];
        if (b > 0 && L2[b - 1] > mx) mx = L2[b - 1];
        if (b < NB - 1 && L2[b + 1] > mx) mx = L2[b + 1];
        var d = L[b] - mx;
        if (d > 0) s += d;
      }
      return s;
    },
    _L: function(Pm, R, g, i) {
      if (i < 0 || !Pm[i]) return null;
      var o = new Float32Array(NB), p = Pm[i], r = R ? R[i] : null;
      for (var b = 0; b < NB; b++) {
        var v = p[b] - (r ? P.OVER * g[b] * r[b] : 0);
        o[b] = Math.log(1 + 1e4 * (v > 0 ? v : 0));
      }
      return o;
    },
    pct: function(a, q) {
      var s = Array.prototype.slice.call(a).sort(function(x, y) {
        return x - y;
      });
      if (!s.length) return 0;
      var p = (s.length - 1) * q / 100, i = Math.floor(p), f = p - i;
      return i + 1 < s.length ? s[i] * (1 - f) + s[i + 1] * f : s[i];
    },
    // one note decision. st = {got:[],vals:[],ref:[]} running state; nov/ts arrays; pfn(t)->P(clap)
    decide: function(st, nov, ts, te, lat, gap, floor, pfn) {
      var post = Math.min(0.1, 0.5 * gap), fast = gap < P.FG, pre = fast ? Math.min(P.PRE, P.PREF * gap) : P.PRE, Cw = fast ? P.C * P.CF : P.C, c = te + lat, i0 = Core.idx(ts, c - pre), i1 = Core.idx(ts, c + post);
      if (i1 <= i0) {
        st.got.push(null);
        st.vals.push(0);
        return null;
      }
      var j = i0;
      for (var i = i0; i < i1; i++) if (nov[i] > nov[j]) j = i;
      var v = nov[j];
      var edge = j === i0 && nov[Math.max(0, j - 1)] >= v || j === i1 - 1, near = false, G = st.got;
      for (i = Math.max(0, G.length - 2); i < G.length; i++) if (G[i] != null && ts[j] - G[i] < P.MINSEP) near = true;
      var ok = false;
      if (v > floor && !edge && !near) {
        var r = st.ref.length >= 3 ? Core.pct(st.ref.slice(-12), 50) : v, p = Math.min(Math.max(pfn(ts[j]), 1e-4), 1 - 1e-4), pv = 0;
        for (i = Math.max(0, G.length - 2); i < G.length; i++) if (G[i] != null && ts[j] - G[i] < P.TAILW) pv = Math.max(pv, st.vals[i]);
        var s = P.A * Math.log(v / Math.max(P.k * r, floor)) + P.B * Math.log(p / (1 - p));
        if (pv) s += Cw * Math.min(0, Math.log(v / pv));
        ok = s > 0;
        st.last = { v, p, s };
      }
      if (ok) st.ref.push(v);
      st.got.push(ok ? ts[j] : null);
      st.vals.push(v);
      return ok ? ts[j] : null;
    },
    estLat: function(nov, ts, notes, L0) {
      var b = [0, L0];
      for (var L = L0 - 0.04; L < L0 + 0.04 - 1e-9; L += 5e-3) {
        var s = 0;
        for (var i = 0; i < notes.length; i++) s += nov[Math.min(nov.length - 1, Core.idx(ts, notes[i] + L))];
        if (s > b[0]) b = [s, L];
      }
      return b[1];
    },
    idx: function(ts, t) {
      var lo = 0, hi = ts.length;
      while (lo < hi) {
        var m = lo + hi >> 1;
        if (ts[m] < t) lo = m + 1;
        else hi = m;
      }
      return lo;
    }
  };
  var C96 = {
    Core,
    on: false,
    state: "off",
    why: "",
    init: function() {
      var BB = root.BB, q;
      if (!BB) return;
      try {
        q = new URLSearchParams(location.search);
      } catch (e) {
        q = { get: function() {
          return null;
        } };
      }
      this.on = q.get("det") !== "old" && !root.BB_LEGACY && !(BB.MLP && BB.MLP.on);
      this.dbg = q.get("debug") === "1";
    },
    start: function() {
      var BB = root.BB, MC = root.MicCore, self = this;
      if (this.state === "on" && this.ctx !== MC.ctx) {
        try {
          BB.outBus.disconnect(this.no);
        } catch (e) {
        }
        this.state = "off";
        this.exp = null;
      }
      if (!this.on || this.state !== "off") return;
      this.ctx = MC.ctx;
      if (!MC || !MC.ctx || !MC.ctx.audioWorklet || !root.AudioWorkletNode || !root.Blob) return this.fail("no worklet");
      this.state = "loading";
      var code = "const NF=1024,NB=24;class B extends AudioWorkletProcessor{constructor(o){super();const a=o.processorOptions;this.map=a.map;this.win=a.win;this.H=Math.round(sampleRate*.005);this.raw=!!a.raw;this.buf=new Float32Array(NF*4);this.n=0;this.cnt=0;this.re=new Float64Array(NF);this.im=new Float64Array(NF);this.out=[];this.ts=[];this.rq=[];this.rr=new Float32Array(32768);this.rc=0}fft(re,im){const n=NF;for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t}}for(let l=2;l<=n;l<<=1){const a=-2*Math.PI/l,h=l/2;for(let k=0;k<h;k++){const c=Math.cos(a*k),s=Math.sin(a*k);for(let i=0;i<n;i+=l){const p=i+k+h,xr=re[p]*c-im[p]*s,xi=re[p]*s+im[p]*c;re[p]=re[i+k]-xr;im[p]=im[i+k]-xi;re[i+k]+=xr;im[i+k]+=xi}}}}process(inp){const x=inp[0]&&inp[0][0];if(!x)return true;const f0=currentFrame;for(let i=0;i<x.length;i++){if(this.n>=this.buf.length){this.buf.copyWithin(0,this.buf.length-NF);this.n=NF}this.buf[this.n++]=x[i];this.cnt++;if(this.raw)this.rr[this.rc++%32768]=x[i];if(this.n>=NF&&this.cnt>=this.H){this.cnt=0;const o=this.n-NF;for(let k=0;k<NF;k++){this.re[k]=this.buf[o+k]*this.win[k];this.im[k]=0}this.fft(this.re,this.im);const p=new Float32Array(NB);for(let k=0;k<=NF/2;k++){const m=this.map[k];if(m>=0)p[m]+=this.re[k]*this.re[k]+this.im[k]*this.im[k]}this.out.push(p);this.ts.push((f0+i+1-NF/2)/sampleRate)}}if(this.out.length>=4){this.port.postMessage({t:this.ts,p:this.out,now:(f0+x.length)/sampleRate,raw:this.raw?this.take():null});this.out=[];this.ts=[]}return true}take(){const n=this.rc-(this.rs||0),o=new Float32Array(Math.min(n,32768));for(let i=0;i<o.length;i++)o[i]=this.rr[(this.rc-o.length+i)%32768];this.rs=this.rc;return o}}registerProcessor('bb-c96',B);";
      var url = URL.createObjectURL(new Blob([code], { type: "application/javascript" })), ac = BB.ac;
      this.mic = { P: [], t: [], raw: new Float32Array(MC.ctx.sampleRate * 2 | 0), rawEnd: 0, sr: MC.ctx.sampleRate };
      this.out = { P: [], t: [] };
      this.off = null;
      this.ratio = [];
      Promise.all([
        MC.ctx.audioWorklet.addModule(url),
        ac.audioWorklet ? ac.audioWorklet.addModule(url) : Promise.reject("no out worklet"),
        fetch("assets/clapnet96.json").then(function(r) {
          return r.json();
        }),
        self._net()
      ]).then(function(a) {
        if (!root.ClapNet) throw "no clapnet";
        self.net = Object.create(root.ClapNet);
        self.net.load(a[2]);
        var mk = function(ctx, raw) {
          return new AudioWorkletNode(ctx, "bb-c96", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], processorOptions: { map: Core.bandMap(ctx.sampleRate), win: Core.hann(), raw } });
        };
        self.nm = mk(MC.ctx, true);
        MC.src.connect(self.nm);
        self.nm.connect(MC.sink);
        self.no = mk(ac, false);
        BB.outBus.connect(self.no);
        var z = ac.createGain();
        z.gain.value = 0;
        self.no.connect(z);
        z.connect(ac.destination);
        self.nm.port.onmessage = function(e) {
          self.onMic(e.data);
        };
        self.no.port.onmessage = function(e) {
          self.onOut(e.data);
        };
        self.state = "on";
      }).catch(function(e) {
        self.fail(String(e && e.message || e));
      });
    },
    _net: function() {
      if (root.ClapNet) return Promise.resolve();
      return new Promise(function(res, rej) {
        var s = document.createElement("script");
        s.src = (root.BB_LEGACY ? "js-legacy/" : "js/") + "clapnet.js";
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    },
    fail: function(w) {
      this.state = "fallback";
      this.why = w;
      this.on = false;
    },
    active: function() {
      var BB = root.BB;
      return this.on && this.state === "on" && BB.mic.ok && !BB.debug;
    },
    // mic frames: worklet time -> game (BB.ac) time
    onMic: function(d) {
      var BB = root.BB, M = this.mic, off = BB.ac.currentTime - root.MicCore.ctx.currentTime;
      this.off = this.off == null ? off : this.off + (off - this.off) * 0.05;
      for (var i = 0; i < d.p.length; i++) {
        M.P.push(d.p[i]);
        M.t.push(d.t[i] + this.off);
      }
      if (M.P.length > 800) {
        M.P.splice(0, M.P.length - 600);
        M.t.splice(0, M.t.length - 600);
      }
      if (d.raw) {
        var r = M.raw, N = r.length;
        for (i = 0; i < d.raw.length; i++) r[(M.rawEnd + i) % N] = d.raw[i];
        M.rawEnd += d.raw.length;
        M.rawT = d.now + this.off;
      }
      this.learnGain();
    },
    onOut: function(d) {
      var O = this.out;
      for (var i = 0; i < d.p.length; i++) {
        O.P.push(d.p[i]);
        O.t.push(d.t[i]);
      }
      if (O.P.length > 900) {
        O.P.splice(0, O.P.length - 700);
        O.t.splice(0, O.t.length - 700);
      }
    },
    lat: function() {
      var G = root.GroupGate;
      return G && G.lat != null ? G.lat : root.BB.micLat();
    },
    // reference band power seen by the mic at time t: max of output frames in [t-lat-25ms, t-lat+10ms]
    refAt: function(t, lat) {
      var O = this.out, a = Core.idx(O.t, t - lat - 0.025), b = Core.idx(O.t, t - lat + 0.0101), r = null;
      for (var i = a; i < b; i++) {
        var p = O.P[i];
        if (!r) r = Float32Array.from(p);
        else for (var k = 0; k < NB; k++) if (p[k] > r[k]) r[k] = p[k];
      }
      return r;
    },
    learnGain: function() {
      if (this.exp) return;
      var M = this.mic, n = M.P.length;
      if (n < 1) return;
      var t = M.t[n - 1], r = this.refAt(t, this.lat());
      if (!r) return;
      var p = M.P[n - 1], q = new Float32Array(NB), rs = 0;
      for (var k = 0; k < NB; k++) rs += r[k];
      if (rs < 1e-3) return;
      for (k = 0; k < NB; k++) q[k] = p[k] / (r[k] + 1e-12);
      this.ratio.push(q);
      if (this.ratio.length > 300) this.ratio.shift();
    },
    // speaker->mic gain per band: learned only on frames where we were playing something (same rule as research/clap96/sf.py)
    gain: function() {
      var g = new Float32Array(NB);
      if (this.ratio.length < 20) return g.fill(0);
      for (var k = 0; k < NB; k++) {
        var c = [];
        for (var i = 0; i < this.ratio.length; i++) if (this.ratio[i][k] === this.ratio[i][k]) c.push(this.ratio[i][k]);
        g[k] = c.length >= 20 ? Core.pct(c, 90) : 0;
      }
      return g;
    },
    // a room declares its expected notes (game time, no latency); decisions arrive through poll()
    expect: function(key, notes, gap) {
      if (!this.active()) return false;
      var M = this.mic;
      this.exp = { key, notes, gap, next: 0, g: this.gain(), st: { got: [], vals: [], ref: [] }, floor: null, res: [] };
      return true;
    },
    cancel: function() {
      this.exp = null;
    },
    nov: function() {
      var E = this.exp, M = this.mic, lat = this.lat(), R = [];
      for (var i = 0; i < M.P.length; i++) R.push(this.refAt(M.t[i], lat));
      var nv = new Float32Array(M.P.length);
      for (i = 0; i < M.P.length; i++) nv[i] = Core.flux(M.P, R, E.g, i);
      return nv;
    },
    pclap: function(t) {
      var M = this.mic, sr = M.sr, n = Math.ceil(2048 * sr / 16e3) + 30, s0 = Math.round((t - 0.02 - M.rawT) * sr) + M.rawEnd;
      if (s0 < M.rawEnd - M.raw.length || s0 + n > M.rawEnd) return 0.5;
      var w = new Float32Array(n), N = M.raw.length;
      for (var i = 0; i < n; i++) w[i] = M.raw[(s0 + i) % N];
      return this.net.prob(this.net.resample(w, sr, 2048));
    },
    // returns [{i,t}] for notes whose window has closed: t = clap time or null (missed)
    poll: function(key) {
      var E = this.exp;
      if (!E || E.key !== key) return [];
      var M = this.mic, now = M.t[M.t.length - 1], lat0 = this.lat(), lat = lat0, out = [];
      if (now == null) return out;
      var post = Math.min(0.1, 0.5 * E.gap), nv = null, self = this;
      while (E.next < E.notes.length && now > E.notes[E.next] + lat0 + 0.04 + post + 0.03) {
        if (!nv) nv = this.nov();
        lat = Core.estLat(nv, M.t, E.notes.slice(0, E.next + 1), lat0);
        E.lat = lat;
        if (E.floor == null) {
          var i = Core.idx(M.t, E.notes[0] + lat - 0.1), a = Array.prototype.slice.call(nv, Math.max(0, i - 300), i);
          E.floor = a.length > 20 ? Core.pct(a, 99.5) * 1.3 + 1 : 1e9;
        }
        var t = Core.decide(E.st, nv, M.t, E.notes[E.next], lat, E.gap, E.floor, function(tt) {
          return self.pclap(tt - NF / 2 / M.sr);
        });
        out.push({ i: E.next, t, info: E.st.last });
        E.next++;
      }
      if (E.next >= E.notes.length) this.exp = null;
      return out;
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = C96;
  else {
    root.C96 = C96;
    C96.init();
  }
})(typeof window !== "undefined" ? window : this);
