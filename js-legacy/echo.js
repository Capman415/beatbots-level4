(function(root) {
  const G = {
    hist: new Float32Array(512 * 3),
    n: 0,
    i: 0,
    ratios: new Float32Array(96),
    rn: 0,
    ri: 0,
    gain: 0.6,
    on: true,
    SLOP: 0.03,
    RSLOP: 0.045,
    JUMP: 6e-3,
    stats: { echoRej: 0, passed: 0 },
    // record one output meter sample: t = audio time the sound left the app, rms of the master bus, prev = previous rms
    push(t, rms) {
      const k = this.i * 3, prev = this.n ? this.hist[(this.i + 511) % 512 * 3 + 1] : 0;
      this.hist[k] = t;
      this.hist[k + 1] = rms;
      this.hist[k + 2] = Math.max(0, rms - prev);
      this.i = (this.i + 1) % 512;
      if (this.n < 512) this.n++;
    },
    // learn echo gain (mic rms per unit output rms) from frames where the app is loud; median of recent ratios ignores the odd clap
    learn(micRms, outRms) {
      if (outRms < 0.02) return;
      this.ratios[this.ri] = micRms / outRms;
      this.ri = (this.ri + 1) % 96;
      if (this.rn < 96) this.rn++;
      if (this.ri % 8 === 0) {
        const a = Array.from(this.ratios.subarray(0, this.rn)).sort((x, y) => x - y);
        this.gain = Math.max(0.02, a[a.length >> 1]);
      }
    },
    // loudest app output that could be arriving at the mic at time T (speaker->mic delay lat, +-SLOP for clock jitter)
    outAt(T, lat) {
      let peak = 0, jump = 0;
      const lo = T - lat - this.SLOP, hi = T - lat + this.SLOP;
      for (let j = 0; j < this.n; j++) {
        const k = j * 3, t = this.hist[k];
        if (t < lo || t > hi) continue;
        if (this.hist[k + 1] > peak) peak = this.hist[k + 1];
        if (this.hist[k + 2] > jump) jump = this.hist[k + 2];
      }
      return { peak, jump };
    },
    // v13.2 residual mic level after removing the predicted echo of our own output (= rms when nothing is playing)
    resid(T, micRms, lat) {
      if (!this.on || !this.n) return micRms;
      const g = this.rn < 24 ? Math.max(this.gain, 1.5) : this.gain, sl = this.SLOP;
      this.SLOP = this.RSLOP;
      const pk = this.outAt(T, lat).peak;
      this.SLOP = sl;
      const pred = g * pk * 1.4;
      return pred < 2e-3 ? micRms : Math.sqrt(Math.max(0, micRms * micRms - pred * pred));
    },
    // true = real clap. Subtract the predicted echo energy; what is left must be a clear onset of its own.
    check(T, micRms, lat, thr) {
      if (!this.on) return true;
      const o = this.outAt(T, lat), pred = this.gain * o.peak * 1.25;
      if (pred < 2e-3) {
        this.stats.passed++;
        return true;
      }
      const resid = Math.sqrt(Math.max(0, micRms * micRms - pred * pred));
      const ok = resid > Math.max(thr || 3e-3, pred * (o.jump > this.JUMP ? 0.55 : 0.35));
      if (ok) this.stats.passed++;
      else this.stats.echoRej++;
      return ok;
    }
  };
  root.EchoGate = G;
  if (typeof module !== "undefined") module.exports = G;
})(typeof window !== "undefined" ? window : globalThis);
