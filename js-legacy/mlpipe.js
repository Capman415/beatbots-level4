(function() {
  var BB = window.BB, q;
  try {
    q = new URLSearchParams(location.search);
  } catch (e) {
    q = { get: function() {
      return null;
    } };
  }
  var P = BB.MLP = {
    on: q.get("ml") === "1",
    dbg: q.get("debug") === "1",
    state: "off",
    why: "",
    st: { dsp: 0, acc: 0, ret: 0, gate: 0, ref: 0, fail: 0 },
    log: [],
    pend: [],
    wins: {},
    want: -9,
    id: 0,
    node: null,
    ring: null,
    ringT: 0,
    sr: 48e3,
    benchMs: null,
    lastP: null,
    cal: null,
    // ---- listening gate ----
    openWin: function(key, t0, t1) {
      this.wins[key] = [t0, t1];
    },
    closeWin: function(key) {
      delete this.wins[key];
    },
    micWant: function() {
      this.want = BB.t;
    },
    talking: function() {
      return BB.talking && BB.t < BB.talking.until;
    },
    gateOpen: function(tAudio) {
      if (BB.t - this.want < 0.2) return true;
      if (this.talking()) return false;
      var lat = window.GroupGate ? GroupGate.lat || 0 : 0, t = tAudio - lat;
      for (var k in this.wins) {
        var w = this.wins[k];
        if (t >= w[0] - 0.15 && t <= w[1] + 0.18) return true;
      }
      return false;
    },
    frame: function() {
      if (!this.on) return;
      var now = BB.ac.currentTime, lat = window.GroupGate ? GroupGate.lat || 0 : 0;
      for (var k in this.wins) if (this.wins[k][1] + 0.18 + lat < now - 1) delete this.wins[k];
      BB.listening = this.gateOpen(now - 0.02) ? 2 : 0;
      if (this.state === "stitch") this.stitch();
      this.flush(false);
    },
    // ---- model + audio tap (lazy, only once the mic is on) ----
    init: function() {
      if (!this.on || this.state !== "off") return;
      this.state = "loading";
      var self = this, dir = window.BB_LEGACY ? "js-legacy/" : "js/";
      var s = document.createElement("script");
      s.src = dir + "clapnet.js?v=" + (BB.VERSION || "");
      s.onerror = function() {
        self.fail("script");
      };
      s.onload = function() {
        fetch("assets/clapnet.json").then(function(r) {
          return r.json();
        }).then(function(M) {
          ClapNet.load(M);
          ClapNet.loadCal();
          self.bench();
          if (self.state === "dsp-only") return;
          return self.tap();
        }).catch(function(e) {
          self.fail("load " + (e && e.message));
        });
      };
      document.head.appendChild(s);
    },
    fail: function(w) {
      this.state = "dsp-only";
      this.why = w;
      this.flush(true);
    },
    bench: function() {
      var w = new Float32Array(2048);
      for (var i = 0; i < 2048; i++) w[i] = Math.random() - 0.5;
      var a = [];
      for (i = 0; i < 7; i++) {
        var t = performance.now();
        ClapNet.prob(w);
        a.push(performance.now() - t);
      }
      a.sort(function(x, y) {
        return x - y;
      });
      this.benchMs = a[3];
      ClapNet.ms = [];
      if (this.benchMs > ClapNet.BUDGET) this.fail("slow device " + this.benchMs.toFixed(1) + " ms");
    },
    tap: function() {
      var ctx = MicCore.ctx, self = this;
      this.ctx = ctx;
      if (!ctx || !MicCore.src) return this.fail("no mic");
      this.sr = ctx.sampleRate;
      var code = "class R extends AudioWorkletProcessor{constructor(){super();this.N=sampleRate*2|0;this.b=new Float32Array(this.N);this.end=0;this.q=[];this.port.onmessage=e=>this.q.push(e.data)}process(inp){const x=inp[0]&&inp[0][0];if(x){const f0=currentFrame;for(let i=0;i<x.length;i++)this.b[(f0+i)%this.N]=x[i];this.end=f0+x.length}for(let k=this.q.length-1;k>=0;k--){const r=this.q[k];if(this.end>=r.s+r.n){const o=new Float32Array(r.n);for(let i=0;i<r.n;i++){const j=r.s+i;o[i]=j>=0&&j>this.end-this.N?this.b[j%this.N]:0}this.port.postMessage({id:r.id,b:o},[o.buffer]);this.q.splice(k,1)}}return true}}registerProcessor('bb-ring',R);";
      if (ctx.audioWorklet && window.AudioWorkletNode && window.Blob) {
        var url = URL.createObjectURL(new Blob([code], { type: "application/javascript" }));
        ctx.audioWorklet.addModule(url).then(function() {
          self.node = new AudioWorkletNode(ctx, "bb-ring", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
          MicCore.src.connect(self.node);
          self.node.connect(MicCore.sink);
          self.node.port.onmessage = function(e) {
            self.reply(e.data.id, e.data.b);
          };
          self.state = "worklet";
        }).catch(function() {
          self.startStitch();
        });
      } else this.startStitch();
    },
    startStitch: function() {
      this.ring = new Float32Array(this.sr * 2 | 0);
      this.ringEnd = Math.round(MicCore.ctx.currentTime * this.sr);
      this.state = "stitch";
    },
    stitch: function() {
      var b = MicCore.buf, end = Math.round(MicCore.ctx.currentTime * this.sr), n = Math.min(b.length, end - this.ringEnd);
      if (n <= 0) return;
      var N = this.ring.length;
      for (var i = 0; i < n; i++) this.ring[(end - n + i) % N] = b[b.length - n + i];
      this.ringEnd = end;
      for (var k = this.pend.length - 1; k >= 0; k--) {
        var r = this.pend[k];
        if (!r.done && end >= r.s + r.n) {
          var o = new Float32Array(r.n);
          for (i = 0; i < r.n; i++) o[i] = this.ring[(r.s + i) % N];
          this.reply(r.id, o);
        }
      }
    },
    // ---- per onset ----
    // returns true if the engine should push the onset itself (ML off / fallback)
    submit: function(o, tNow) {
      if (!this.on) return true;
      if (this.ctx && MicCore.ctx !== this.ctx && (this.state === "worklet" || this.state === "stitch")) {
        this.state = "retap";
        this.node = null;
        this.tap();
      }
      if (!this.gateOpen(tNow)) {
        this.st.gate++;
        this.note(o, "gate");
        return false;
      }
      this.st.dsp++;
      if (this.state !== "worklet" && this.state !== "stitch" || window.ClapNet && ClapNet.off) {
        if (window.ClapNet && ClapNet.off && this.state !== "dsp-only") this.fail("over budget");
        this.st.acc++;
        this.note(o, "dsp");
        return true;
      }
      var sr = this.sr, s = Math.round((MicCore.ctx.currentTime - 0.02 - 0.02) * sr), n = Math.ceil(2048 * sr / 16e3) + 30, r = { id: ++this.id, o, s, n, t: BB.t, ref: this.refTransient(tNow) };
      this.pend.push(r);
      if (this.state === "worklet") this.node.port.postMessage({ id: r.id, s, n });
      return false;
    },
    refTransient: function(tNow) {
      var EG = window.EchoGate;
      if (!EG || !EG.on || !EG.outAt) return false;
      try {
        var L = BB.micLat ? BB.micLat() : 0.09, a = EG.outAt(tNow, L).peak, b = EG.outAt(tNow - 0.09, L).peak;
        return a > 1e-4 && a > 3 * b;
      } catch (e) {
        return false;
      }
    },
    reply: function(id, buf) {
      var r = null;
      for (var i = 0; i < this.pend.length; i++) if (this.pend[i].id === id) r = this.pend[i];
      if (!r || r.done) return;
      r.done = 1;
      var p = 1;
      try {
        p = ClapNet.prob(ClapNet.resample(buf, this.sr, 2048));
      } catch (e) {
        p = 1;
      }
      this.lastP = p;
      if (r.ref) this.st.ref++;
      if (p >= (r.ref ? ClapNet.TH_REF : ClapNet.TH)) {
        r.o.ml = +p.toFixed(2);
        BB.mic.onsets.push(r.o);
        this.st.acc++;
        this.note(r.o, "acc", p);
      } else {
        this.st.ret++;
        this.note(r.o, "ret", p);
      }
      if (this.calRec) this.calRec.push({ t: r.o.t, buf });
      this.pend = this.pend.filter(function(x) {
        return !x.done;
      });
    },
    flush: function(all) {
      var self = this;
      this.pend = this.pend.filter(function(r) {
        if (r.done) return false;
        if (all || BB.t - r.t > 0.45) {
          BB.mic.onsets.push(r.o);
          self.st.fail++;
          self.st.acc++;
          self.note(r.o, "timeout");
          return false;
        }
        return true;
      });
    },
    // fail-open
    note: function(o, k, p) {
      if (!this.dbg) return;
      this.log.push({ t: BB.t, k, p });
      if (this.log.length > 14) this.log.shift();
    },
    // ---- "clap 8 times" calibration: claps = DSP onsets inside 8 ticks; room negatives = windows from the room/app audio between them
    calibrate: function(done) {
      if (!window.ClapNet || !ClapNet.ready || !MicCore.ctx) {
        done && done(false);
        return;
      }
      var self = this, ac = BB.ac, t0 = ac.currentTime + 1, S = 0.75, ticks = [];
      for (var i = 0; i < 8; i++) {
        ticks.push(t0 + i * S);
        BB.sfx.tick(t0 + i * S, i % 4 === 0);
      }
      this.calRec = [];
      this.cal = { ph: "run", t0, S, n: 0 };
      this.openWin("cal", t0, t0 + 7 * S);
      var negs = [], sr = this.sr, grab = function() {
        if (self.state !== "worklet" && self.state !== "stitch") return;
        var s = Math.round((MicCore.ctx.currentTime - 0.15) * sr), n = Math.ceil(2048 * sr / 16e3) + 30, id = ++self.id;
        self.pend.push({ id, o: { t: -1, neg: 1 }, s, n, t: BB.t, neg: 1 });
        if (self.state === "worklet") self.node.port.postMessage({ id, s, n });
      };
      var orig = this.reply;
      this.reply = function(id, buf) {
        var r = null;
        for (var i2 = 0; i2 < self.pend.length; i2++) if (self.pend[i2].id === id) r = self.pend[i2];
        if (r && r.neg) {
          r.done = 1;
          negs.push(buf);
          self.pend = self.pend.filter(function(x) {
            return !x.done;
          });
          return;
        }
        return orig.call(self, id, buf);
      };
      for (i = 0; i < 8; i++) setTimeout(grab, (t0 + i * S + 0.42 - ac.currentTime) * 1e3);
      setTimeout(function() {
        self.reply = orig;
        self.closeWin("cal");
        var claps = self.calRec;
        self.calRec = null;
        var pe = claps.map(function(c) {
          return ClapNet.embed(ClapNet.feat(ClapNet.resample(c.buf, sr, 2048)));
        }), ne = negs.map(function(b) {
          return ClapNet.embed(ClapNet.feat(ClapNet.resample(b, sr, 2048)));
        });
        var ok = pe.length >= 5;
        if (ok) {
          ClapNet.calibrate(pe, ne);
          ClapNet.saveCal();
        }
        self.cal = { ph: "done", ok, n: pe.length };
        done && done(ok, pe.length);
      }, (t0 + 8 * S + 0.6 - ac.currentTime) * 1e3);
    },
    // calRec collects verified AND retracted claps (the room's claps may look unusual before calibration)
    draw: function(ctx) {
      if (!this.dbg) return;
      var s = this.st, x = 260, y = 200, l = [
        "ML " + (this.on ? this.state + (this.why ? " (" + this.why + ")" : "") : "off (add ?ml=1)"),
        "gate " + (this.on ? BB.listening === 2 ? "OPEN" : "closed" : "-") + "  gated " + s.gate,
        "DSP hits " + s.dsp + "  ML accepts " + s.acc + "  retracted " + s.ret,
        "ref-transient " + s.ref + "  fail-open " + s.fail,
        "p(last) " + (this.lastP == null ? "-" : this.lastP.toFixed(2)) + "  ms " + (window.ClapNet && ClapNet.ms.length ? ClapNet.ms.slice().sort(function(a, b) {
          return a - b;
        })[ClapNet.ms.length >> 1].toFixed(2) : "-") + (this.benchMs != null ? "  bench " + this.benchMs.toFixed(2) : "") + (window.ClapNet && ClapNet.cal ? "  CAL" : "")
      ];
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.65)";
      ctx.fillRect(x - 6, y - 24, 560, l.length * 26 + 14 + this.log.length * 0);
      ctx.font = "20px monospace";
      ctx.fillStyle = "#9f9";
      for (var i = 0; i < l.length; i++) ctx.fillText(l[i], x, y + i * 26);
      var lx = x;
      ctx.font = "16px monospace";
      for (i = 0; i < this.log.length; i++) {
        var e = this.log[i];
        ctx.fillStyle = e.k === "acc" || e.k === "dsp" ? "#6f6" : e.k === "gate" ? "#888" : e.k === "ret" ? "#f66" : "#fc6";
        ctx.fillText(e.k + (e.p != null ? e.p.toFixed(1) : ""), lx, y + l.length * 26 + 6);
        lx += 66;
        if (lx > 540) break;
      }
      ctx.restore();
    }
  };
  if (P.on && window.ClapNet === void 0) {
  }
})();
