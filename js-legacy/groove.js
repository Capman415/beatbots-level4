"use strict";
(() => {
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const STY = {
    title: {
      // v13.2 "Beat Bots Theme" (title screen): G major I-V-vi-IV, bouncy bass, bright marimba hook
      ch: [[43, [59, 62, 67]], [38, [57, 62, 66]], [40, [59, 64, 67]], [36, [55, 60, 64]]],
      chB: [[36, [55, 60, 64]], [38, [57, 62, 66]], [43, [59, 62, 67]], [38, [57, 62, 66]]],
      bass: [[0, 0], [3, 12], [6, 7], [8, 0], [11, 12], [14, 7]],
      fill: [[0, 0], [4, 2], [8, 4], [10, 7], [12, 9], [14, 12]],
      keys: [2, 6, 10, 14],
      keysB: [2, 6, 9, 14],
      keyWave: "triangle",
      keyLen: 0.45,
      keyLp: 1700,
      hook: [[0, 79], [2, 78], [4, 74], [8, 76], [10, 74], [12, 71]],
      hookB: [[0, 71], [2, 74], [4, 79], [6, 78], [8, 76], [12, 74]],
      hookWave: "sine",
      hookAmp: 0.06,
      kick: [0, 8],
      kickB: [0, 6, 8],
      sh: [2, 6, 10, 14],
      swing: 0.1,
      lead: "marimba"
    },
    mine: {
      // "Mine Bounce": C major I-vi-IV-V, octave-jumping bass, marimba hook, swung shaker
      ch: [[36, [60, 64, 67]], [45, [57, 60, 64]], [41, [57, 60, 65]], [43, [59, 62, 67]]],
      chB: [[41, [57, 60, 65]], [43, [59, 62, 67]], [40, [55, 59, 64]], [45, [57, 60, 64]]],
      bass: [[0, 0], [3, 12], [6, 0], [8, 7], [10, 12], [14, 0]],
      fill: [[0, 0], [4, 4], [8, 7], [10, 9], [12, 11], [14, 12]],
      keys: [2, 6, 10, 14],
      keysB: [2, 7, 10, 13],
      keyWave: "triangle",
      keyLen: 0.5,
      keyLp: 1500,
      hook: [[0, 72], [3, 76], [6, 79], [8, 76], [11, 74], [14, 72]],
      hookB: [[0, 74], [2, 76], [4, 77], [6, 76], [8, 74], [10, 72], [12, 71], [14, 72]],
      hookWave: "sine",
      hookAmp: 0.075,
      kick: [0, 8],
      kickB: [0, 6, 8],
      sh: [2, 6, 10, 14],
      swing: 0.12,
      lead: "marimba"
    },
    smash: {
      // "Smasher Funk": D dorian Dm7-G7, slap-ish syncopated bass, clavinet-ish stabs, robot hook
      ch: [[38, [60, 65, 69]], [38, [60, 65, 69]], [43, [59, 62, 65]], [43, [59, 62, 65]]],
      chB: [[41, [60, 64, 69]], [43, [59, 62, 65]], [45, [61, 64, 67]], [38, [60, 65, 69]]],
      bass: [[0, 0], [2, 0], [3, 12], [6, 0], [7, 10], [10, 12], [11, 0], [14, 7]],
      fill: [[0, 0], [2, 3], [4, 5], [6, 7], [8, 10], [10, 12], [12, 10], [14, 7]],
      keys: [3, 6, 11, 14],
      keysB: [1, 4, 7, 10, 14],
      keyWave: "square",
      keyLen: 0.22,
      keyLp: 1100,
      hook: [[0, 74], [2, 74], [3, 77], [6, 74], [8, 72], [11, 69], [12, 72]],
      hookB: [[0, 77], [3, 76], [6, 74], [8, 72], [10, 74], [12, 69]],
      hookWave: "triangle",
      hookAmp: 0.07,
      kick: [0, 8],
      kickB: [0, 3, 8, 11],
      sh: [2, 6, 10, 14],
      swing: 0,
      lead: "bloop"
    },
    pack: {
      // "Packing Ska": F major F-Bb-C-F, walking bass, offbeat organ skanks, whistle-ish hook
      ch: [[41, [60, 65, 69]], [46, [62, 65, 70]], [48, [60, 64, 67]], [41, [60, 65, 69]]],
      chB: [[46, [62, 65, 70]], [41, [60, 65, 69]], [43, [62, 67, 70]], [48, [60, 64, 67]]],
      bass: [[0, 0], [4, 4], [8, 7], [12, 9]],
      fill: [[0, 0], [2, 2], [4, 4], [6, 5], [8, 7], [10, 9], [12, 11], [14, 12]],
      keys: [2, 6, 10, 14],
      keysB: [2, 6, 10, 13, 14],
      keyWave: "triangle",
      keyLen: 0.3,
      keyLp: 1300,
      hook: [[0, 77], [4, 81], [6, 79], [8, 77], [12, 72]],
      hookB: [[0, 79], [2, 77], [4, 76], [8, 74], [10, 76], [12, 77]],
      hookWave: "sine",
      hookAmp: 0.07,
      kick: [0, 8],
      kickB: [0, 8, 10],
      sh: [2, 6, 10, 14],
      swing: 0.06,
      lead: "whistle"
    }
  };
  BB.GROOVE_STY = STY;
  BB.makeGroove = (ac, out, o = {}) => {
    const lite = !!o.lite;
    const bus = ac.createGain();
    bus.gain.value = 0;
    bus.connect(out);
    const low = ac.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 300;
    low.connect(bus);
    const keys = ac.createBiquadFilter();
    keys.type = "lowpass";
    keys.frequency.value = 1400;
    keys.Q.value = 0.5;
    keys.connect(bus);
    const lead = ac.createBiquadFilter();
    lead.type = "lowpass";
    lead.frequency.value = 2200;
    lead.connect(bus);
    let shV = null;
    if (!lite) {
      const n = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = n;
      src.loop = true;
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 6500;
      bp.Q.value = 0.9;
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 9e3;
      shV = ac.createGain();
      shV.gain.value = 0;
      src.connect(bp).connect(lp).connect(shV).connect(bus);
      src.start();
    }
    const env = (g, t, pk, a, d) => {
      g.gain.setValueAtTime(1e-4, t);
      g.gain.linearRampToValueAtTime(pk, t + a);
      g.gain.exponentialRampToValueAtTime(1e-4, t + a + d);
    };
    const osc = (type, f, t, d, pk, a, dest, glide) => {
      const v = ac.createOscillator(), g = ac.createGain();
      v.type = type;
      v.frequency.setValueAtTime(f, t);
      if (glide) v.frequency.exponentialRampToValueAtTime(glide, t + 0.12);
      env(g, t, pk, a, d);
      v.connect(g).connect(dest);
      v.start(t);
      v.stop(t + a + d + 0.05);
    };
    const G = {
      on: false,
      t0: 0,
      spb: 0.6,
      next: 0,
      timer: null,
      vol: 0.6,
      sty: STY.mine,
      name: "mine",
      beat(k, t) {
        const S = this.sty, spb = this.spb, q = spb / 4, bar = Math.floor(k / 4), b = (k % 4 + 4) % 4, form = (bar % 16 + 16) % 16, B = form >= 8, fillBar = form % 8 === 7, phr = Math.floor(form / 2) % 4;
        const C = (B ? S.chB : S.ch)[(bar % 4 + 4) % 4], root = C[0];
        for (let s = b * 4; s < b * 4 + 4; s++) {
          const st = t + (s - b * 4) * q + (s % 2 ? S.swing * q : 0);
          if ((B ? S.kickB : S.kick).includes(s)) osc("sine", 120, st, 0.22, 0.55, 6e-3, low, 48);
          for (const [ss, iv] of fillBar ? S.fill : S.bass) if (ss === s) {
            osc("triangle", mtof(root + iv), st, q * (fillBar ? 1.6 : 2.4), 0.42, 0.012, low);
            if (!lite) osc("sine", mtof(root + iv) / 2, st, q * 2, 0.25, 0.012, low);
          }
          if (!(B && form === 8) && (B ? S.keysB : S.keys).includes(s)) {
            const tones = lite ? C[1].slice(0, 2) : C[1];
            for (const m of tones) osc(S.keyWave, mtof(m), st, spb * S.keyLen, S.keyWave === "square" ? 0.028 : 0.05, 0.012, keys);
          }
          if (!fillBar && bar % 2 === 0 && phr !== 1) {
            for (const [ss, m] of B ? S.hookB : S.hook) if (ss === s) {
              const f = mtof(m);
              if (S.lead === "marimba") {
                osc("sine", f, st, 0.28, S.hookAmp, 0.01, lead);
                if (!lite) osc("sine", f * 4, st, 0.06, S.hookAmp * 0.2, 8e-3, lead);
              } else if (S.lead === "bloop") osc(S.hookWave, f, st, 0.22, S.hookAmp, 0.015, lead, f * 1.02);
              else {
                osc("sine", f, st, 0.34, S.hookAmp, 0.025, lead);
              }
            }
          }
          if (!fillBar && bar % 2 === 1 && phr !== 1) {
            for (const [ss, m] of S.hook) if (ss === s && ss < 8) {
              osc(S.hookWave, mtof(m + (B ? 5 : 7)), st, 0.24, S.hookAmp * 0.8, 0.015, lead);
            }
          }
          if (shV && (S.sh.includes(s) || B && s % 2 === 1)) {
            const pk = S.sh.includes(s) ? 0.05 : 0.02;
            shV.gain.setValueAtTime(1e-4, st);
            shV.gain.linearRampToValueAtTime(pk, st + 0.012);
            shV.gain.exponentialRampToValueAtTime(1e-4, st + 0.07);
          }
        }
      },
      tick() {
        if (!this.on) return;
        const ahead = ac.currentTime + 0.2;
        let k = Math.ceil((ac.currentTime - this.t0) / this.spb - 1e-3);
        if (this.next > k) k = this.next;
        while (this.t0 + k * this.spb < ahead) {
          this.beat(k, this.t0 + k * this.spb);
          k++;
        }
        this.next = k;
        const talk = BB.talking && BB.t < BB.talking.until + 0.2, v = BB.paused ? 0 : talk ? this.vol * 0.25 : this.vol;
        bus.gain.setTargetAtTime(v, ac.currentTime, 0.12);
      },
      start(bpm = 100, style) {
        this.on = true;
        this.spb = 60 / bpm;
        this.t0 = ac.currentTime + 0.1;
        this.next = 0;
        if (style && STY[style]) {
          this.sty = STY[style];
          this.name = style;
        }
        if (!this.timer) this.timer = setInterval(() => this.tick(), 50);
      },
      sync(t0, spb) {
        if (!this.on) return;
        const k = Math.ceil((ac.currentTime + 0.2 - t0) / spb);
        this.t0 = t0;
        this.spb = spb;
        this.next = k;
      },
      // re-phase onto a room's beat clock (tempo changes follow)
      stop() {
        this.on = false;
        bus.gain.setTargetAtTime(0, ac.currentTime, 0.15);
      },
      _bus: bus
    };
    return G;
  };
  if (BB.ac && BB.outBus) {
    BB.groove = BB.makeGroove(BB.ac, BB.outBus, { lite: BB.phone || BB.lowDev });
  }
})();
