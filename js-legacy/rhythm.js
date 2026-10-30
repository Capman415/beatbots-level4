"use strict";
(() => {
  let ctx = BB.ctx;
  BB._sw.push((g) => ctx = g);
  const COL = BB.COL, W = BB.W, H = BB.H, { clamp, lerp, ease } = BB;
  const R = BB.R = {};
  R.BEATS = { w: 4, h: 2, q: 1, e: 1, s: 1, r: 1 };
  R.NAME = { w: "WHOLE", h: "HALF", q: "TA", e: "TI-TI", s: "TIKA-TIKA", r: "REST" };
  R.SAY = { w: "ta-a-a-a", h: "ta-a", q: "ta", e: "ti-ti", s: "tika-tika", r: "(rest)" };
  const INK = ["#5a5a68", "#1a1a22", "#040406"];
  R.COLS = { w: INK, h: INK, q: INK, e: INK, s: INK, r: ["#7d8c8a", "#55625f", "#323b39"] };
  R.SUB = { w: [0], h: [0], q: [0], e: [0, 0.5], s: [0, 0.25, 0.5, 0.75], r: [] };
  R.sounds = (seq) => {
    const o = [];
    let b = 0;
    seq.forEach((k, i) => {
      for (const f of R.SUB[k]) o.push({ b: b + f, i, k, f });
      b += R.BEATS[k];
    });
    return o;
  };
  R.len = (seq) => seq.reduce((a, k) => a + (R.BEATS[k && k.k ? k.k : k] || 0), 0);
  function head(x, y, s, filled, g = ctx) {
    g.save();
    g.translate(x, y);
    g.rotate(-0.35);
    g.beginPath();
    g.ellipse(0, 0, s, s * 0.72, 0, 0, 7);
    if (filled) {
      g.fill();
    } else {
      g.lineWidth = s * 0.34;
      g.stroke();
    }
    g.restore();
  }
  R.glyph = (k, x, y, s, col = "#19191f", g = ctx) => {
    g.save();
    g.fillStyle = col;
    g.strokeStyle = col;
    g.lineCap = "butt";
    const st = s * 3.4, lw = Math.max(2, s * 0.24);
    const stem = (hx, hy) => {
      g.lineWidth = lw;
      g.beginPath();
      g.moveTo(hx + s * 0.86, hy - s * 0.2);
      g.lineTo(hx + s * 0.86, hy - st);
      g.stroke();
    };
    if (k === "w") {
      g.save();
      g.translate(x, y);
      g.beginPath();
      g.ellipse(0, 0, s * 1.15, s * 0.78, 0, 0, 7);
      g.fill();
      g.globalCompositeOperation = "destination-out";
      g.beginPath();
      g.ellipse(0, 0, s * 0.55, s * 0.42, -0.8, 0, 7);
      g.fill();
      g.restore();
    } else if (k === "h") {
      head(x, y, s, false, g);
      stem(x, y);
    } else if (k === "q") {
      head(x, y, s, true, g);
      stem(x, y);
    } else if (k === "e" || k === "s") {
      const n = k === "e" ? 2 : 4, gap = k === "e" ? s * 2.9 : s * 2.2, x0 = x - gap * (n - 1) / 2;
      for (let i = 0; i < n; i++) {
        head(x0 + i * gap, y, s * (k === "s" ? 0.86 : 1), true, g);
        stem(x0 + i * gap, y);
      }
      const bx0 = x0 + s * 0.86 - lw / 2, bx1 = x0 + gap * (n - 1) + s * 0.86 + lw / 2, bh = s * 0.62;
      g.fillRect(bx0, y - st, bx1 - bx0, bh);
      if (k === "s") g.fillRect(bx0, y - st + bh * 1.7, bx1 - bx0, bh);
    } else if (k === "r") {
      g.lineWidth = lw * 1.2;
      g.lineJoin = "round";
      const u = s * 0.9, yy = y - s * 1.7;
      g.beginPath();
      g.moveTo(x - u * 0.4, yy - u * 1.6);
      g.lineTo(x + u * 0.5, yy - u * 0.5);
      g.lineTo(x - u * 0.3, yy + u * 0.3);
      g.lineTo(x + u * 0.5, yy + u * 1.2);
      g.stroke();
      g.beginPath();
      g.moveTo(x + u * 0.5, yy + u * 1.2);
      g.quadraticCurveTo(x - u * 0.7, yy + u * 0.9, x - u * 0.1, yy + u * 2.1);
      g.stroke();
    }
    g.restore();
  };
  const n3c = {};
  function tint(src, fill) {
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    const g = c.getContext("2d");
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = fill(g, c);
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  R.noteSize = (k, w, h) => Math.min(h * 0.2, w / (k === "s" ? 8.6 : k === "e" ? 6.2 : k === "w" ? 2.9 : 3.1));
  R.note3d = (k, w, h, o = {}) => {
    const sc = 2, key = k + "|" + Math.round(w) + "|" + Math.round(h) + "|" + (o.gs || 1);
    if (n3c[key]) return n3c[key];
    const s = R.noteSize(k, w, h) * (o.gs || 1) * sc, PAD = Math.ceil(s * 0.9), cw = Math.ceil(w * sc) + PAD * 2, ch = Math.ceil(h * sc) + PAD * 2;
    const m = document.createElement("canvas");
    m.width = cw;
    m.height = ch;
    const mg = m.getContext("2d");
    const gx = cw / 2 + (k === "e" || k === "s" || k === "w" ? 0 : -s * 0.4), gy = PAD + h * sc * 0.86 - (k === "w" ? h * sc * 0.3 : 0);
    if (k === "w") {
      mg.save();
      mg.translate(gx, gy);
      mg.fillStyle = "#000";
      mg.beginPath();
      mg.ellipse(0, 0, s * 1.25, s * 0.85, 0, 0, 7);
      mg.fill();
      mg.globalCompositeOperation = "destination-out";
      mg.beginPath();
      mg.ellipse(0, 0, s * 0.55, s * 0.42, -0.8, 0, 7);
      mg.fill();
      mg.restore();
    } else R.glyph(k, gx, gy, s, "#000", mg);
    const c = R.COLS[k], out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    const g = out.getContext("2d");
    const ink = tint(m, () => "#141419"), deep = tint(m, () => c[2]), face = tint(m, (gg) => {
      const L = gg.createLinearGradient(0, PAD, 0, ch - PAD);
      L.addColorStop(0, c[0]);
      L.addColorStop(0.55, c[1]);
      L.addColorStop(1, c[2]);
      return L;
    });
    const d = Math.max(3, s * 0.3), ex = d * 0.55;
    const edge = (dx, dy, fill) => {
      const e = document.createElement("canvas");
      e.width = cw;
      e.height = ch;
      const eg = e.getContext("2d");
      eg.drawImage(m, 0, 0);
      eg.globalCompositeOperation = "destination-out";
      eg.drawImage(m, dx, dy);
      return tint(e, fill);
    };
    const sideC = tint(m, (gg) => {
      const L = gg.createLinearGradient(0, 0, 0, ch);
      L.addColorStop(0, "#2c2c36");
      L.addColorStop(1, "#08080b");
      return L;
    });
    for (let i = Math.ceil(d); i > 0; i--) {
      g.globalAlpha = 1;
      g.drawImage(sideC, i * ex / d * 1, i);
    }
    g.drawImage(edge(0, -1.5, () => "rgba(150,150,170,.5)"), ex, d);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      g.drawImage(ink, Math.cos(a) * s * 0.05, Math.sin(a) * s * 0.05);
    }
    const hx = gx - s * 0.45, hy = gy - s * 0.45;
    const face2 = tint(m, (gg) => {
      const G = gg.createRadialGradient(hx, hy, s * 0.1, gx, gy, s * 1.9);
      G.addColorStop(0, "#7a7a8c");
      G.addColorStop(0.35, "#2e2e3a");
      G.addColorStop(1, "#060608");
      return G;
    });
    g.drawImage(face2, 0, 0);
    {
      const cy = tint(m, (gg) => {
        const L = gg.createLinearGradient(0, 0, 0, gy - s * 0.6);
        L.addColorStop(0, "rgba(120,120,140,.25)");
        L.addColorStop(1, "rgba(0,0,0,0)");
        return L;
      });
      g.save();
      g.globalCompositeOperation = "source-atop";
      g.drawImage(cy, 0, 0);
      g.restore();
    }
    const b1 = Math.max(1.5, s * 0.14);
    g.save();
    g.globalCompositeOperation = "source-atop";
    g.drawImage(edge(b1, b1, () => "rgba(255,255,255,.55)"), 0, 0);
    g.drawImage(edge(b1 * 0.45, b1 * 0.45, () => "rgba(255,255,255,.5)"), 0, 0);
    g.drawImage(edge(-b1, -b1, () => "rgba(0,0,0,.7)"), 0, 0);
    g.drawImage(edge(-b1 * 0.7, 0, () => "rgba(255,205,140,.55)"), 0, 0);
    g.restore();
    const sp = document.createElement("canvas");
    sp.width = cw;
    sp.height = ch;
    const sg = sp.getContext("2d");
    sg.drawImage(m, 0, 0);
    sg.globalCompositeOperation = "destination-out";
    sg.drawImage(m, s * 0.09, s * 0.12);
    const spt = tint(sp, () => "rgba(255,255,255,.55)");
    g.drawImage(spt, 0, 0);
    if (k !== "r") {
      const G = g.createRadialGradient(hx + s * 0.15, hy + s * 0.2, 0, hx + s * 0.15, hy + s * 0.2, s * 0.45);
      G.addColorStop(0, "rgba(255,255,255,.75)");
      G.addColorStop(1, "rgba(255,255,255,0)");
      g.save();
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = G;
      g.fillRect(0, 0, cw, ch);
      g.restore();
    }
    const sh = document.createElement("canvas");
    sh.width = cw;
    sh.height = ch;
    {
      const hg = sh.getContext("2d");
      hg.shadowColor = "rgba(0,0,0,.5)";
      hg.shadowBlur = Math.max(4, s * 0.35);
      hg.shadowOffsetX = cw * 4;
      hg.drawImage(m, -cw * 4, 0);
    }
    return n3c[key] = { c: out, sh, sc, PAD, s: s / sc, gy: gy / sc };
  };
  R.syl = (k, x, w, h) => {
    const c = x + w / 2;
    if (k === "e" || k === "s") {
      const n = k === "e" ? 2 : 4, s = R.noteSize(k, w, h), gap = k === "e" ? s * 2.9 : s * 2.2, x0 = c - gap * (n - 1) / 2;
      return (k === "e" ? ["ti", "ti"] : ["ti", "ka", "ti", "ka"]).map((sy, i) => [x0 + i * gap + s * 0.1, sy]);
    }
    return [[c, { w: "ta-a-a-a", h: "ta-a", q: "ta", r: "rest" }[k] || R.SAY[k]]];
  };
  R.tile = (k, x, y, w, h, o = {}) => {
    var _a;
    ctx.save();
    ctx.globalAlpha = (_a = o.alpha) != null ? _a : 1;
    const fs = o.label ? Math.max(14, Math.min(21, h * 0.16)) : 0, tagH = o.label ? fs + 10 : 0, pad = o.label ? Math.max(6, h * 0.07) : 0;
    if (o.label) h -= tagH + pad * 2;
    if (o.shadow !== false) {
      const sw = Math.min(w * 0.46, R.noteSize(k, w, h) * (k === "s" ? 4.6 : k === "e" ? 3.4 : 1.8));
      const gr = ctx.createRadialGradient(x + w / 2, y + h, 0, x + w / 2, y + h, sw);
      gr.addColorStop(0, "rgba(0,0,0,.42)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gr;
      ctx.save();
      ctx.translate(x + w / 2, y + h);
      ctx.scale(1, 0.22);
      ctx.translate(-x - w / 2, -y - h);
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h, sw, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    if (o.glyph !== false) {
      const sp = R.note3d(k, w, h, o);
      if (o.shadow !== false && !!BB.q) {
        const ox = sp.s * 0.35, oy = sp.s * 0.18;
        ctx.save();
        ctx.globalAlpha *= 0.75;
        const pv = y - sp.PAD / sp.sc + sp.gy + sp.s * 0.7;
        ctx.translate(x + w / 2, pv);
        ctx.transform(1, 0, -0.35, 0.45, 0, 0);
        ctx.translate(-x - w / 2, -pv);
        ctx.drawImage(sp.sh, x - sp.PAD / sp.sc + ox, y - sp.PAD / sp.sc + oy, sp.c.width / sp.sc, sp.c.height / sp.sc);
        ctx.restore();
      }
      ctx.drawImage(sp.c, x - sp.PAD / sp.sc, y - sp.PAD / sp.sc, sp.c.width / sp.sc, sp.c.height / sp.sc);
    }
    if (o.label) {
      const tw = Math.min(w - 8, BB.measure(R.NAME[k], fs) + 18), ty = y + h + pad;
      BB.rrect(x + w / 2 - tw / 2 + 2, ty + 3, tw, tagH, 7, "rgba(0,0,0,.3)");
      BB.rrect(x + w / 2 - tw / 2, ty, tw, tagH, 7, BB.lg(ty, ty + tagH, ["#fbf6e6", "#ddd3b8"]), "rgba(25,25,31,.8)", 2);
      BB.text(R.NAME[k], x + w / 2, ty + tagH / 2 + 1, fs, COL.ink, { maxW: tw - 8 });
    }
    if (o.beats) {
      BB.text(String(R.BEATS[k]), x + w - 18, y + h - 18, 22, "#fff", { stroke: 4 });
    }
    ctx.restore();
  };
  R.pills = (cx, y, seq, st = {}) => {
    const L = Math.max(4, seq.reduce((a, k) => a + R.BEATS[k], 0)), gap = st.gap || (L > 4 ? 14 : 24), bw = st.bw || (L > 4 ? Math.floor((672 - (L - 1) * gap) / L) : 150), ph = 50, tot = L * bw + (L - 1) * gap;
    BB.rrect(cx - tot / 2 - 28, y - 40, tot + 56, 100, 30, "rgba(0,0,0,.25)");
    BB.well(cx - tot / 2 - 30, y - 50, tot + 60, 100, 30);
    let b = 0, si = 0;
    seq.forEach((k, i) => {
      const n = R.BEATS[k], x = cx - tot / 2 + b * (bw + gap), w = n * bw + (n - 1) * gap, subs = R.SUB[k];
      if (k === "r") {
        BB.rrect(x, y - ph / 2, w, ph, 14, "#1b2a29", "rgba(235,245,240,.4)", 3);
        R.glyph("r", x + w / 2, y + ph * 0.62, 9, "rgba(235,245,240,.7)");
      } else {
        const sg = subs.length === 1 ? [[0, 1]] : subs.map((f, j) => [f, f + 1 / subs.length]);
        const sgap = k === "s" ? 6 : 8;
        sg.forEach(([f0, f1], j) => {
          const xx = x + (subs.length === 1 ? 0 : f0 * w + (j ? sgap / 2 : 0)), ww = subs.length === 1 ? w : (f1 - f0) * w - (j ? sgap / 2 : 0) - (j < subs.length - 1 ? sgap / 2 : 0);
          const l = st.lit && st.lit[si] || 0, m = st.marks && st.marks[si], cur = st.cur === si;
          if (l > 0.01 && BB.q) {
            ctx.save();
            ctx.globalAlpha = l * 0.8;
            BB.glow(xx + ww / 2, y, 70, "rgba(110,230,120,A)", 0.7);
            ctx.restore();
          }
          const g = Math.round(40 + l * 70), gg = Math.round(60 + l * 170), bb = Math.round(60 + l * 60);
          BB.rrect(xx, y - ph / 2, ww, ph, 12, m ? BB.lg(y - ph / 2, y + ph / 2, ["#a6f5ae", "#6ee678", "#3fb45a"]) : BB.lg(y - ph / 2, y + ph / 2, ["rgb(".concat(g + 40, ",").concat(Math.min(255, gg + 40), ",").concat(bb + 30, ")"), "rgb(".concat(g, ",").concat(gg, ",").concat(bb, ")")]), cur ? COL.yellow : "rgba(235,245,240,.85)", cur ? 5 : 3);
          if (m) BB.star(xx + ww / 2, y, 13 * ease.back(Math.min(1, m)), COL.yellow, BB.t);
          si++;
        });
      }
      b += n;
    });
    if (st.words) {
      b = 0;
      seq.forEach((k) => {
        const n = R.BEATS[k], x = cx - tot / 2 + b * (bw + gap), w = n * bw + (n - 1) * gap;
        BB.text(R.SAY[k], x + w / 2, y - 72, 28, "#fff", { stroke: 5 });
        b += n;
      });
    }
  };
  const ac = BB.ac, bus = BB.outBus;
  let nb = null;
  function tone(type, f, t, d, pk, f2) {
    BB.selfSound(t, d, null);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(1e-4, t);
    g.gain.exponentialRampToValueAtTime(pk, t + 4e-3);
    g.gain.exponentialRampToValueAtTime(1e-4, t + d);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + d + 0.05);
  }
  function nz(t, d, pk, type, f, q = 1, f2) {
    BB.selfSound(t, d, null);
    if (!nb) {
      nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const a = nb.getChannelData(0);
      for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
    }
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nb;
    fl.type = type;
    fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d);
    fl.Q.value = q;
    g.gain.setValueAtTime(1e-4, t);
    g.gain.exponentialRampToValueAtTime(pk, t + 3e-3);
    g.gain.exponentialRampToValueAtTime(1e-4, t + d);
    s.connect(fl).connect(g).connect(bus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + d + 0.05);
  }
  const now = () => ac.currentTime;
  Object.assign(BB.sfx, {
    block: (t = now(), v = 1) => {
      tone("triangle", 1050, t, 0.07, 0.3 * v, 700);
      nz(t, 0.03, 0.2 * v, "bandpass", 2500, 4);
    },
    crunch: (t = now()) => {
      nz(t, 0.35, 0.6, "lowpass", 3e3, 1, 200);
      tone("square", 90, t, 0.18, 0.25, 45);
      for (let i = 0; i < 4; i++) tone("sine", 2600 + Math.random() * 2400, t + 0.05 + i * 0.05, 0.12, 0.06);
    },
    ting: (t = now()) => {
      for (let i = 0; i < 3; i++) tone("sine", 3e3 + Math.random() * 1800, t + i * 0.06, 0.15, 0.07);
    },
    bell: (t = now()) => {
      tone("sine", 1760, t, 0.7, 0.22);
      tone("sine", 2637, t, 0.5, 0.08);
      tone("sine", 1760, t + 0.22, 0.8, 0.22);
      tone("sine", 2637, t + 0.22, 0.6, 0.08);
    },
    bleep: (t = now()) => {
      [660, 990, 780].forEach((f, i) => tone("square", f, t + i * 0.08, 0.07, 0.06));
    },
    thunk: (t = now()) => {
      tone("sine", 140, t, 0.25, 0.5, 60);
      nz(t, 0.12, 0.35, "lowpass", 900);
    },
    boing: (t = now()) => {
      tone("sine", 220, t, 0.45, 0.25, 660);
      tone("triangle", 330, t + 0.05, 0.3, 0.1, 900);
    },
    sweep: (t = now()) => {
      nz(t, 0.5, 0.25, "bandpass", 1800, 1.5, 600);
    },
    zap: (t = now()) => {
      tone("sawtooth", 1200, t, 0.25, 0.08, 120);
      nz(t, 0.2, 0.12, "highpass", 4e3);
    },
    hiss: (t = now()) => {
      tone("sawtooth", 300, t, 0.12, 0.15, 120);
      tone("square", 500, t + 0.1, 0.25, 0.08, 900);
    },
    piston: (t = now()) => {
      nz(t, 0.25, 0.3, "highpass", 2e3, 1, 500);
    }
  });
  class ClapBack {
    constructor(seq, o = {}) {
      this.seq = seq;
      this.bpm = o.bpm || 84;
      this.spb = 60 / this.bpm;
      this.snd = R.sounds(seq);
      this.n = this.snd.length;
      this.L = Math.max(4, seq.reduce((a, k) => a + R.BEATS[k], 0));
      this.t0 = ac.currentTime + 0.35;
      this.next = 0;
      this.lit = new Array(this.n).fill(0);
      this.marks = new Array(this.n).fill(0);
      this.got = new Array(this.n).fill(0);
      this.pend = [];
      this.done = false;
      this.onDone = o.onDone;
      this.voice = o.voice || (() => {
      });
      this.cnt = o.countIn !== false;
      this.base = this.cnt ? 4 : 0;
      BB.mic.take();
      BB.groove && BB.groove.sync(this.t0, this.spb);
    }
    beatNow() {
      return (ac.currentTime - this.t0) / this.spb;
    }
    beatNowV() {
      return (ac.currentTime - BB.visLat() - this.t0) / this.spb;
    }
    // v13.2 visual clock = audible beat
    phase() {
      const b = this.beatNow() - this.base;
      return b < 0 ? "count" : b < this.L ? "listen" : b < this.L + 4 ? "ready" : b < 2 * this.L + 4 ? "clap" : "end";
    }
    // v12.2: 4-beat count-in between listen and clap
    update(dt) {
      {
        const ph = this.phase();
        BB.listening = ph === "clap" ? 2 : ph === "ready" ? 1 : 0;
      }
      const ahead = ac.currentTime + 0.12, spb = this.spb, T0 = this.t0 + this.base * spb;
      while (this.t0 + this.next * spb < ahead && this.next < this.base + 2 * this.L + 4) {
        const t = this.t0 + this.next * spb, rd = this.next >= this.base + this.L && this.next < this.base + this.L + 4;
        BB.sfx.tick(t, this.next % 4 === 0 || rd, rd ? 1 : 0.8);
        if (this.next === this.base + this.L) R.turnCue(t);
        this.next++;
      }
      if (!this.sched) {
        this.sched = 1;
        this.snd.forEach((s, i) => {
          const t = T0 + s.b * spb;
          BB.sfx.block(t);
          setTimeout(() => this.voice(s), Math.max(0, (t - ac.currentTime) * 1e3));
        });
        if (BB.debug) this.snd.forEach((s, i) => {
          if (Math.random() < 0.93) {
            const t = T0 + (this.L + 4 + s.b) * spb + (Math.random() - 0.5) * 0.05;
            setTimeout(() => BB.simClap(t, 0.7), Math.max(0, (t - ac.currentTime) * 1e3 + 30));
          }
        });
      }
      {
        const tv = ac.currentTime - BB.visLat(), Cc = T0 + (this.L + 4) * spb;
        for (let i = 0; i < this.n; i++) {
          let l = 0;
          for (const b0 of [T0, Cc]) {
            const d = tv - (b0 + this.snd[i].b * spb);
            if (d >= 0 && d < 0.4) l = Math.max(l, 1 - d * 2.5);
          }
          this.lit[i] = l;
        }
      }
      for (let i = 0; i < this.n; i++) {
        if (this.marks[i]) this.marks[i] = Math.min(1, this.marks[i] + dt * 5);
      }
      const ons = BB.mic.take(), C = T0 + (this.L + 4) * spb;
      if (BB.MLP && BB.MLP.on) {
        const bs = this.snd.map((x) => x.b);
        BB.MLP.openWin("rhythm", C + Math.min(...bs) * spb - 0.12, C + Math.max(...bs) * spb + 0.18);
      }
      const G = window.GroupGate, gated = BB.mic.ok && G && !BB.debug;
      if (window.ClapDet && this.seq.includes("s")) ClapDet.fastUntil = ac.currentTime + 0.5;
      if (window.ClapDet && ClapDet.expect && !this._gap) {
        const bs = this.snd.map((x) => x.b).sort((p, q) => p - q);
        let g = 1;
        for (let i = 1; i < bs.length; i++) g = Math.min(g, bs[i] - bs[i - 1]);
        this._gap = Math.max(0.125, g) * spb;
      }
      if (window.ClapDet && ClapDet.expect) ClapDet.expect(this._gap, ac.currentTime + 0.5);
      for (const o of ons) {
        if (BB.talking && BB.t < BB.talking.until && !BB.debug) continue;
        if (o.up) continue;
        let best = -1, bd = 1;
        for (let i = 0; i < this.n; i++) {
          if (this.got[i]) continue;
          const s2 = this.snd[i], te = C + s2.b * spb, gapB = Math.min(...this.snd.filter((x, j) => j !== i).map((x) => Math.abs(x.b - s2.b)), 1), lat = G ? G.lat || 0 : 0, dd = o.t - lat - te, tol = dd < 0 ? Math.min(0.12, gapB * spb * 0.45) : Math.min(0.18, gapB * spb * 0.5), d = Math.abs(dd);
          if (d < tol && d < bd) {
            bd = d;
            best = i;
          }
        }
        if (best < 0) {
          if (gated && o.t > C) G.stray(o.t);
          continue;
        }
        const s = this.snd[best];
        if (gated && !o.sim && s.f === 0) {
          this.got[best] = 2;
          this.pend.push(best);
        } else this.hit(best);
      }
      if (gated) this.pend = this.pend.filter((i) => {
        const te = C + this.snd[i].b * spb;
        if (ac.currentTime - 0.02 < te + G.lat + Math.max(G.W1, G.win(spb)[1]) + 0.02) return true;
        const m = G.judge(te, false, spb);
        if (m.ok) this.hit(i);
        else {
          this.got[i] = 0;
          this.few = BB.t;
        }
        return false;
      });
      if (!this.done && ac.currentTime > C + this.L * spb + 0.25) {
        this.done = true;
        const sc = this.got.filter((x) => x === 1).length / this.n;
        this.score = sc;
        this.onDone && this.onDone(sc);
      }
    }
    hit(i) {
      this.got[i] = 1;
      this.marks[i] = 0.01;
      BB.sfx.tink(void 0, 0.6);
    }
    override() {
      if (this.done) return;
      for (let i = 0; i < this.n; i++) if (!this.got[i]) {
        this.got[i] = 1;
        this.marks[i] = 0.01;
      }
      this.done = true;
      this.score = 1;
      this.onDone && this.onDone(1);
    }
    cursor() {
      const ph = this.phase();
      if (ph !== "clap") return -1;
      const b = this.beatNow() - this.base - this.L - 4;
      for (let i = 0; i < this.n; i++) if (!this.got[i] && this.snd[i].b >= b - 0.12) return i;
      return -1;
    }
    draw(cx, y) {
      const ph = this.phase(), yt = ph === "ready" || ph === "clap";
      if (yt) R.yourTurn(ph, this.beatNowV() - this.base - this.L, y);
      if (yt) {
        ctx.save();
        ctx.translate(cx, y);
        ctx.scale(1.18, 1.18);
        ctx.translate(-cx, -y);
      }
      R.pills(cx, y, this.seq, { lit: this.lit, marks: this.marks, cur: this.cursor(), words: true });
      if (yt) ctx.restore();
      const bn = this.beatNowV();
      let msg = "";
      if (ph === "count") {
        const n = 4 - Math.floor(bn);
        msg = n > 0 ? "Listen... " + n : "";
      } else if (ph === "listen") msg = "MY TURN: listen!";
      else if (ph === "ready") {
        const n = Math.floor(bn - this.base - this.L) + 1;
        msg = ["", "1", "2", "READY", "GO!"][n] || "";
      } else if (ph === "clap") msg = "YOUR TURN: clap it!";
      if (msg) BB.text(msg, cx, y - 125, ph === "ready" ? 56 : 40, ph === "clap" || msg === "GO!" ? COL.green : COL.yellow, { font: "Rammetto One", stroke: 7 });
      if (ph !== "end" && bn >= 0) {
        const rd = ph === "ready", nd = rd ? 4 : this.L, tot = 4 * 150 + 3 * 24, step = (tot - 150) / (nd - 1), rel = bn - this.base, bi = rd ? Math.floor(rel - this.L) : ph === "clap" ? Math.floor(rel - this.L - 4) : ph === "listen" ? Math.floor(rel) : Math.floor(bn) % 4;
        for (let i = 0; i < nd; i++) {
          const on = rd ? i <= bi : i === bi;
          ctx.fillStyle = on ? rd ? COL.green : COL.yellow : "rgba(255,255,255,.25)";
          ctx.beginPath();
          ctx.arc(cx - tot / 2 + 75 + i * step, y + 62, on ? rd ? 13 : 9 : 6, 0, 7);
          ctx.fill();
          if (rd && on && BB.q) BB.glow(cx - tot / 2 + 75 + i * step, y + 62, 40, "rgba(110,230,120,A)", 0.5);
        }
      }
    }
  }
  R.ClapBack = ClapBack;
  let paperPat = null;
  R.paper = (x, y, w, h) => {
    if (!paperPat) {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      for (let i = 0; i < 1400; i++) {
        const v = Math.random();
        g.fillStyle = v < 0.5 ? "rgba(120,95,60,".concat(Math.random() * 0.06, ")") : "rgba(255,255,255,".concat(Math.random() * 0.12, ")");
        g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 1);
      }
      paperPat = ctx.createPattern(c, "repeat");
    }
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.clip();
    ctx.fillStyle = paperPat;
    ctx.fillRect(x, y, w, h);
    const e = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    e.addColorStop(0, "rgba(120,90,40,0)");
    e.addColorStop(1, "rgba(120,90,40,.18)");
    ctx.fillStyle = e;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };
  R.turnCue = (t) => {
    const s = BB.sfx;
    if (s.ding) {
      s.ding(t);
      s.ding(t + 0.22);
    }
  };
  R.yourTurn = (ph, rb, py) => {
    const t = BB.t, pu = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.4), cl = ph === "clap";
    ctx.save();
    const bw = cl ? 26 : 16;
    ctx.lineWidth = bw;
    ctx.strokeStyle = cl ? "rgba(110,230,120,".concat(0.55 + 0.4 * pu, ")") : "rgba(255,224,102,".concat(0.4 + 0.3 * pu, ")");
    ctx.shadowColor = cl ? "#6ee678" : "#ffe066";
    ctx.shadowBlur = 40;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);
    ctx.restore();
    const by = 118, bh = 150;
    ctx.save();
    ctx.shadowColor = cl ? "#6ee678" : "#ffe066";
    ctx.shadowBlur = 30 + 30 * pu;
    BB.rrect(30, by - bh / 2 + 8, W - 60, bh, 34, "rgba(0,0,0,.35)");
    BB.rrect(30, by - bh / 2, W - 60, bh, 34, BB.lg(
      -bh / 2,
      bh / 2,
      cl ? ["#86e486", "#3fae4c"] : ["#f6d65e", "#e3b02a"]
      /* v12.8 glare pass: even marquee fill */
    ), "#1e2b29", 8);
    ctx.restore();
    for (let i = 0; i < 14; i++) {
      const bx = 70 + i * (W - 140) / 13, on = (Math.floor(t * 6) + i) % 2;
      ctx.fillStyle = on ? "#fffbe0" : "rgba(80,60,20,.5)";
      ctx.beginPath();
      ctx.arc(bx, by - bh / 2 + 16, 7, 0, 7);
      ctx.arc(bx, by + bh / 2 - 16, 7, 0, 7);
      ctx.fill();
    }
    const big = cl ? "YOUR TURN, ENGINEERS! CLAP!" : ["GET READY... 1", "GET READY... 2", "READY...", "GO!"][Math.max(0, Math.min(3, Math.floor(rb)))];
    BB.text(big, W / 2, by + 4, (cl ? 84 : 90) * (1 + 0.04 * pu), "#fffdf2", { font: "Rammetto One", stroke: 12, maxW: W - 420 });
    for (const sd of [-1, 1]) {
      const rx = W / 2 + sd * (W / 2 - 130), ry = by + 70;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.scale(-sd, 1);
      if (BB.IMG && BB.IMG.sprocket) BB.sprite("sprocket", 0, 0, 150, { parts: false });
      const sw = Math.sin(t * 8) * 0.08;
      ctx.rotate(sw);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1e2b29";
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(18, -70);
      ctx.lineTo(70, -40);
      ctx.stroke();
      ctx.strokeStyle = "#cfeee4";
      ctx.lineWidth = 12;
      ctx.stroke();
      ctx.fillStyle = "#e9e2c8";
      ctx.strokeStyle = "#1e2b29";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(76, -36, 15, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(84, -34);
      ctx.lineTo(106, -26);
      ctx.lineWidth = 9;
      ctx.stroke();
      ctx.restore();
    }
  };
  R.bake = (fn) => {
    const s = !BB.q ? 0.5 : 1, c = document.createElement("canvas");
    c.width = W * s;
    c.height = H * s;
    const g = c.getContext("2d");
    g.scale(s, s);
    const old = BB.ctx;
    fn(g);
    return c;
  };
  R.shadow = (g, x, y, rw, a = 0.45) => {
    g.save();
    g.translate(x, y);
    g.scale(1, 0.16);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rw);
    gr.addColorStop(0, "rgba(10,5,2,".concat(a, ")"));
    gr.addColorStop(0.6, "rgba(10,5,2,".concat(a * 0.5, ")"));
    gr.addColorStop(1, "rgba(10,5,2,0)");
    g.fillStyle = gr;
    g.fillRect(-rw, -rw, 2 * rw, 2 * rw);
    g.restore();
  };
  R.lampGlow = (pts, t) => {
    if (!BB.q) return;
    for (const [x, y, s] of pts) {
      BB.glow(x, y + 30, 180 * (s || 1), "rgba(255,220,150,A)", 0.13 + 0.03 * Math.sin(t * 2.3 + x));
    }
  };
  R.motes = (n) => {
    const a = [];
    for (let i = 0; i < n; i++) a.push({ x: Math.random() * W, y: Math.random() * H, s: 1 + Math.random() * 2.5, v: 6 + Math.random() * 14, p: Math.random() * 6 });
    return a;
  };
  R.drawMotes = (m, dt, t) => {
    if (!BB.q) return;
    ctx.fillStyle = "rgba(255,240,200,.28)";
    for (const d of m) {
      d.y -= d.v * dt;
      d.x += Math.sin(t * 0.4 + d.p) * 8 * dt;
      if (d.y < -10) {
        d.y = H + 10;
        d.x = Math.random() * W;
      }
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.s, 0, 7);
      ctx.fill();
    }
  };
  R.bubble = (x, y, txt, col = "#c0392b") => {
    const w = BB.measure(txt, 30) + 50;
    BB.rrect(x - w / 2 + 3, y - 34 + 6, w, 68, 30, "rgba(0,0,0,.25)");
    BB.rrect(x - w / 2, y - 34, w, 68, 30, "#fff", COL.ink, 4);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 32);
    ctx.lineTo(x, y + 56);
    ctx.lineTo(x + 14, y + 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(x - 14, y + 26, 30, 8);
    BB.text(txt, x, y + 2, 30, col);
  };
  R.loadImgs = (names) => Promise.all(names.map(([n, e]) => BB.V2[n] ? 0 : new Promise((r) => {
    const i = new Image();
    i.onload = () => {
      BB.V2[n] = i;
      (i.decode ? i.decode().catch(() => {
      }) : Promise.resolve()).then(r);
    };
    i.onerror = () => r();
    i.src = "assets/v2/" + n + "." + e + "?v=" + BB.VERSION;
  })));
})();
