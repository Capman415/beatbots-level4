(function(root) {
  var ClapNet = {
    M: null,
    L: null,
    cal: null,
    ready: false,
    ms: [],
    TH: 0.3,
    TH_REF: 0.6,
    BUDGET: 12,
    off: false,
    load: function(M) {
      this.M = M;
      var self = this;
      this.L = M.layers.map(function(l) {
        var q = self._b64(l.w8), w = new Float32Array(q.length);
        for (var i2 = 0; i2 < q.length; i2++) w[i2] = q[i2] * l.s;
        return { w, r: l.shape[0], c: l.shape[1], b: Float32Array.from(l.b) };
      });
      this.fb = this._mel();
      this.hw = new Float32Array(512);
      for (var i = 0; i < 512; i++) this.hw[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / 511);
      this.re = new Float64Array(512);
      this.im = new Float64Array(512);
      this.ready = true;
      return this;
    },
    _b64: function(s) {
      var bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary"), o = new Int8Array(bin.length);
      for (var i = 0; i < bin.length; i++) {
        var v = bin.charCodeAt(i);
        o[i] = v > 127 ? v - 256 : v;
      }
      return o;
    },
    _mel: function() {
      var n = 32, nf = 512, SR = 16e3, m = function(f) {
        return 2595 * Math.log10(1 + f / 700);
      }, im = function(x) {
        return 700 * (Math.pow(10, x / 2595) - 1);
      }, lo = m(100), hi = m(7800), b = [], fb = [];
      for (var i = 0; i < n + 2; i++) b.push(Math.floor((nf + 1) * im(lo + (hi - lo) * i / (n + 1)) / SR));
      for (i = 0; i < n; i++) {
        var a = b[i], c = b[i + 1], d = b[i + 2], r = new Float32Array(nf / 2 + 1);
        for (var k = a; k < c; k++) r[k] = (k - a) / Math.max(c - a, 1);
        for (k = c; k < d; k++) r[k] = (d - k) / Math.max(d - c, 1);
        var lo2 = a, hi2 = d;
        fb.push({ r, a: lo2, d: hi2 });
      }
      return fb;
    },
    _fft: function(re, im) {
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
    // any rate -> 16 kHz: windowed-sinc low-pass (7.2 kHz) + linear interpolation
    resample: function(x, fs, n) {
      if (fs === 16e3) return x.subarray ? x.subarray(0, n) : x;
      var out = new Float32Array(n), r = fs / 16e3, K = 12, fc = 7200 / fs, h = [], sum = 0;
      for (var k = -K; k <= K; k++) {
        var v = k === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * k) / (Math.PI * k);
        v *= 0.54 + 0.46 * Math.cos(Math.PI * k / K);
        h.push(v);
        sum += v;
      }
      for (var i = 0; i < n; i++) {
        var p = i * r, i0 = Math.floor(p), f = p - i0, a = 0, b = 0;
        for (k = -K; k <= K; k++) {
          var j = i0 + k;
          if (j >= 0 && j < x.length) a += x[j] * h[k + K];
          if (j + 1 >= 0 && j + 1 < x.length) b += x[j + 1] * h[k + K];
        }
        out[i] = (a * (1 - f) + b * f) / sum;
      }
      return out;
    },
    feat: function(w) {
      var mx = 1e-6, i, f = new Float32Array(224), k = 0, re = this.re, im = this.im;
      for (i = 0; i < w.length; i++) {
        var a = w[i] < 0 ? -w[i] : w[i];
        if (a > mx) mx = a;
      }
      for (var fr = 0; fr < 7; fr++) {
        for (i = 0; i < 512; i++) {
          re[i] = w[fr * 256 + i] / mx * this.hw[i];
          im[i] = 0;
        }
        this._fft(re, im);
        for (var m = 0; m < 32; m++) {
          var B = this.fb[m], s = 0;
          for (i = B.a; i < B.d && i < 257; i++) if (B.r[i]) s += B.r[i] * (re[i] * re[i] + im[i] * im[i]);
          f[k++] = Math.log(s + 1e-6);
        }
      }
      var mean = 0;
      for (i = 0; i < 224; i++) mean += f[i];
      mean /= 224;
      for (i = 0; i < 224; i++) f[i] = (f[i] - mean - this.M.mu[i]) / this.M.sd[i];
      return f;
    },
    embed: function(f) {
      var h = f;
      for (var li = 0; li < this.L.length - 1; li++) {
        var l = this.L[li], o = new Float32Array(l.c);
        for (var j = 0; j < l.c; j++) {
          var s = l.b[j];
          for (var i = 0; i < l.r; i++) s += h[i] * l.w[i * l.c + j];
          o[j] = s > 0 ? s : 0;
        }
        h = o;
      }
      return h;
    },
    head: function(e) {
      var l = this.cal || this.L[this.L.length - 1], s = l.b[0];
      for (var i = 0; i < l.r; i++) s += e[i] * l.w[i];
      return 1 / (1 + Math.exp(-s));
    },
    // w16: 2048 samples at 16 kHz starting 20 ms before the onset -> P(clap)
    prob: function(w16) {
      var t0 = Date.now(), p = this.head(this.embed(this.feat(w16)));
      this.note(Date.now() - t0);
      return p;
    },
    note: function(ms) {
      this.ms.push(ms);
      if (this.ms.length > 40) this.ms.shift();
      if (this.ms.length >= 5) {
        var a = this.ms.slice().sort(function(x, y) {
          return x - y;
        });
        if (a[a.length >> 1] > this.BUDGET) {
          this.off = true;
        }
      }
    },
    // "clap 8 times" calibration: refit ONLY the last layer (logistic regression) on this room's claps + room/app-audio
    // negatives, regularised toward the shipped head and anchored by the shipped prototype embeddings.
    calibrate: function(posE, negE) {
      var L0 = this.L[this.L.length - 1], w = Float32Array.from(L0.w), b = L0.b[0], self = this, P = this._protos();
      var X = [], Y = [];
      posE.forEach(function(e) {
        X.push(e);
        Y.push(1);
      });
      negE.forEach(function(e) {
        X.push(e);
        Y.push(0);
      });
      P.pos.forEach(function(e) {
        X.push(e);
        Y.push(1);
      });
      P.neg.forEach(function(e) {
        X.push(e);
        Y.push(0);
      });
      var wt = X.map(function(_, i2) {
        return i2 < posE.length + negE.length ? 4 : 1;
      }), lr = 0.05, lam = 0.02;
      for (var it = 0; it < 300; it++) {
        var gw = new Float32Array(w.length), gb = 0, n = 0;
        for (var i = 0; i < X.length; i++) {
          var s = b;
          for (var k = 0; k < w.length; k++) s += X[i][k] * w[k];
          var p = 1 / (1 + Math.exp(-s)), g = (p - Y[i]) * wt[i];
          for (k = 0; k < w.length; k++) gw[k] += g * X[i][k];
          gb += g;
          n += wt[i];
        }
        for (k = 0; k < w.length; k++) w[k] -= lr * (gw[k] / n + lam * (w[k] - L0.w[k]));
        b -= lr * gb / n;
      }
      this.cal = { w, b: Float32Array.of(b), r: w.length, c: 1 };
      return this.cal;
    },
    _protos: function() {
      var M = this.M, self = this, f = function(o) {
        var q = self._b64(o.w8), n = q.length / 32, a = [];
        for (var i = 0; i < n; i++) {
          var e = new Float32Array(32);
          for (var k = 0; k < 32; k++) e[k] = q[i * 32 + k] * o.s;
          a.push(e);
        }
        return a;
      };
      return { pos: f(M.protoPos), neg: f(M.protoNeg) };
    },
    saveCal: function(key) {
      try {
        localStorage.setItem(key || "bb_clapcal", JSON.stringify({ v: this.M.v, w: Array.from(this.cal.w), b: this.cal.b[0] }));
      } catch (e) {
      }
    },
    loadCal: function(key) {
      try {
        var o = JSON.parse(localStorage.getItem(key || "bb_clapcal"));
        if (o && o.v === this.M.v) {
          this.cal = { w: Float32Array.from(o.w), b: Float32Array.of(o.b), r: o.w.length, c: 1 };
          return true;
        }
      } catch (e) {
      }
      return false;
    },
    clearCal: function(key) {
      this.cal = null;
      try {
        localStorage.removeItem(key || "bb_clapcal");
      } catch (e) {
      }
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = ClapNet;
  else root.ClapNet = ClapNet;
})(typeof window !== "undefined" ? window : this);
