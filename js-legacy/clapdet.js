(function(root) {
  const C = {
    MIN_IOI: 0.2,
    MIN_IOI_FAST: 0.12,
    UP_K: 2.2,
    VOICE_HFR: 0.08,
    VOICE_FLAT: 0.04,
    IMP_MIN: 2.5,
    SIB_HFR: 0.85,
    SIB_IMP: 6,
    IMP_FLAT: 0.12,
    fast: 0,
    fastUntil: -1,
    // fastUntil: audio time until which 16th-note (tika-tika) rhythms are expected (set by the clap-back)
    refractory(t) {
      return this.fast || t != null && t < this.fastUntil ? this.MIN_IOI_FAST : this.MIN_IOI;
    },
    // spectral signature of one analyser frame: pw(i) = linear power of bin i, hz = bin width
    sig(pw, nb, hz) {
      let lo = 0, hi = 0, lg = 0, n = 0;
      const i0 = Math.floor(150 / hz), i2 = Math.floor(2e3 / hz), i1 = Math.min(nb, Math.floor(9e3 / hz));
      for (let i = i0; i < i1; i++) {
        const p = pw(i);
        if (i < i2) lo += p;
        else hi += p;
        lg += Math.log(p + 1e-20);
        n++;
      }
      const tot = lo + hi;
      return { hfr: tot > 0 ? hi / tot : 0, flat: tot > 0 ? Math.exp(lg / n) / (tot / n) : 0 };
    },
    // impulsiveness of the newest part of the frame: HF (2nd difference) energy of the loudest 2.7 ms block vs the
    // median block. A clap attack is one sharp spike; vowels, 's'/'sh' and music notes are spread out.
    impulse(buf) {
      const B = 128, nb = Math.floor(buf.length / B), e = new Float64Array(nb);
      for (let b = 0; b < nb; b++) {
        let s = 0;
        for (let i = Math.max(2, b * B); i < (b + 1) * B; i++) {
          const d = buf[i] - 2 * buf[i - 1] + buf[i - 2];
          s += d * d;
        }
        e[b] = s;
      }
      const srt = Array.from(e).sort((x, y) => x - y), med = srt[nb >> 1] + 1e-12;
      return Math.max(...e) / med;
    },
    isVoice(s) {
      return s.imp != null && s.hfr > this.SIB_HFR && s.imp < this.SIB_IMP || s.hfr < this.VOICE_HFR && s.flat < this.VOICE_FLAT || s.imp != null && s.imp < this.IMP_MIN && s.flat < this.IMP_FLAT;
    },
    // gap rule: inside MIN_IOI only a much louder burst (the main body of a smeared group clap) may count, once
    gapOk(st, tNow, x) {
      const g = tNow - st.lastOn;
      if (g > this.refractory(tNow)) return 1;
      if (g > this.MIN_IOI_FAST && !st.up && x > st.lastX * this.UP_K) return 2;
      return 0;
    }
  };
  C.TickLat = {
    pend: [],
    d: [],
    lat: null,
    when: -99,
    RISE: 12,
    TONAL: 10,
    MAX: 0.4,
    reset() {
      this.pend = [];
      this.d = [];
      this.lat = null;
      this.when = -99;
    },
    note(t, dur, freqs) {
      if (freqs && freqs.length === 1 && dur <= 0.12 && freqs[0] > 500) {
        this.pend.push({ t, f: freqs[0], b: [] });
        if (this.pend.length > 12) this.pend.shift();
      }
    },
    frame(tNow, binDb) {
      const keep = [];
      for (const p of this.pend) {
        if (tNow < p.t - 0.15) {
          keep.push(p);
          continue;
        }
        if (tNow < p.t + 5e-3) {
          p.b.push(binDb(p.f));
          keep.push(p);
          continue;
        }
        if (tNow > p.t + this.MAX) continue;
        if (p.b.length) {
          const base = p.b.slice().sort((x, y) => x - y)[p.b.length >> 1];
          const pk = binDb(p.f);
          if (pk > base + this.RISE && pk - Math.max(binDb(p.f * 0.8), binDb(p.f * 1.25)) > this.TONAL) {
            this.d.push(tNow - p.t);
            if (this.d.length > 9) this.d.shift();
            if (this.d.length >= 5) {
              this.lat = this.d.slice().sort((x, y) => x - y)[this.d.length >> 1];
              this.when = tNow;
            }
            continue;
          }
        }
        keep.push(p);
      }
      this.pend = keep;
    },
    active() {
      return this.pend.length > 0;
    },
    heard(tNow) {
      return this.lat != null && tNow - this.when < 8;
    }
  };
  root.ClapDet = C;
  if (typeof module !== "undefined") module.exports = C;
})(typeof window !== "undefined" ? window : globalThis);
