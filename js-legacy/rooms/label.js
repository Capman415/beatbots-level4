"use strict";
(() => {
  let ctx = BB.ctx;
  BB._sw.push((g) => ctx = g);
  const COL = BB.COL, W = BB.W, H = BB.H, { clamp, lerp, ease } = BB, R = BB.R, ac = BB.ac;
  Object.assign(R.BEATS, { a: 1, b: 1 });
  Object.assign(R.NAME, { a: "TI-TIKA", b: "TIKA-TI" });
  Object.assign(R.SAY, { a: "ti-tika", b: "tika-ti" });
  Object.assign(R.SUB, { a: [0, 0.5, 0.75], b: [0, 0.25, 0.5] });
  R.COLS.a = R.COLS.b = R.COLS.q;
  const g0 = R.glyph, ns0 = R.noteSize;
  R.noteSize = (k, w, h) => k === "a" || k === "b" ? Math.min(h * 0.2, w / 7.4) : ns0(k, w, h);
  R.glyph = (k, x, y, s, col = "#19191f", g = ctx) => {
    if (k !== "a" && k !== "b") return g0(k, x, y, s, col, g);
    g.save();
    g.fillStyle = col;
    g.strokeStyle = col;
    const st = s * 3.4, lw = Math.max(2, s * 0.24), gap = s * 2.5, x0 = x - gap, hs = s * 0.9;
    for (let i = 0; i < 3; i++) {
      const hx = x0 + i * gap;
      g.save();
      g.translate(hx, y);
      g.rotate(-0.35);
      g.beginPath();
      g.ellipse(0, 0, hs, hs * 0.72, 0, 0, 7);
      g.fill();
      g.restore();
      g.lineWidth = lw;
      g.beginPath();
      g.moveTo(hx + hs * 0.86, y - hs * 0.2);
      g.lineTo(hx + hs * 0.86, y - st);
      g.stroke();
    }
    const bx = (i) => x0 + i * gap + hs * 0.86, bh = s * 0.62;
    g.fillRect(bx(0) - lw / 2, y - st, bx(2) - bx(0) + lw, bh);
    if (k === "a") g.fillRect(bx(1) - lw / 2, y - st + bh * 1.7, bx(2) - bx(1) + lw, bh);
    else g.fillRect(bx(0) - lw / 2, y - st + bh * 1.7, bx(1) - bx(0) + lw, bh);
    g.restore();
  };
  const SYL = { q: "ta", e: "tee-tee", s: "tika-tika", a: "tee-tika", b: "tika-tee", h: "ta-ah", r: "(rest)" };
  BB.VO_LINES = (BB.VO_LINES || []).concat([
    ["lb_intro", "Oh no! Static Jr. zapped the label printer and scrambled all the shipping labels!", "sprocket"],
    ["lb_intro2", "Every box hides a rhythm. Rhythm Engineers, listen closely and help me fix them!", "sprocket"],
    ["jr_lbl", "Hee hee! I scrambled all the labels!", "jr"],
    ["jr_lwrong", "Wrong label! Hee hee!", "jr"],
    ["jr_lstreak", "No fair! You're too good!", "jr"],
    ["lb_how", "Tap the box to hear what's inside. Then pick the label that matches!", "sprocket"],
    ["lb_right", "That's the one! Label on, ship it out!", "sprocket"],
    ["lb_right2", "Perfect match! Off it goes!", "sprocket"],
    ["lb_wrong", "Hmm, that label doesn't match. Listen again!", "sprocket"],
    ["lb_hint", "Here's a hint!", "sprocket"],
    ["lb_faster", "Great streak! The labels are getting trickier!", "sprocket"],
    ["lb_clap", "Now clap the rhythm back to me!", "sprocket"],
    ["lb_done", "Every box is labeled and shipped! Room four complete!", "sprocket"],
    ["lb_done2", "Next stop, the delivery dock!", "sprocket"],
    ["syl_q", "ta", "sprocket"],
    ["syl_e", "tee-tee", "sprocket"],
    ["syl_s", "tika-tika", "sprocket"],
    ["syl_a", "tee-tika", "sprocket"],
    ["syl_b", "tika-tee", "sprocket"],
    ["syl_h", "ta-ah", "sprocket"]
  ]);
  const STAGES = [[4, 6], [6, 4]], BOXES = STAGES.reduce((a, x) => a + x[1], 0), beatsFor = (n) => {
    for (const [L, c] of STAGES) {
      if (n < c) return L;
      n -= c;
    }
    return 6;
  };
  const ALL = ["q", "e", "r", "h", "s", "a", "b"];
  const LV = [["q", "e"], ["q", "e", "r"], ["q", "e", "r", "h"], ["q", "e", "r", "h", "s"], ["q", "e", "r", "h", "s", "a", "b"]];
  const loadAllowed = () => {
    try {
      const a = JSON.parse(localStorage.getItem("bb_lbl_notes") || "null");
      if (Array.isArray(a) && a.length) return a;
    } catch (e) {
    }
    return ALL.slice();
  };
  const key = (s) => s.join("");
  function genRhythm(pool, last, L = 4) {
    for (let n = 0; n < 60; n++) {
      const s = [];
      let b = 0, rests = 0;
      while (b < L) {
        const ok = pool.filter((k2) => R.BEATS[k2] <= L - b && !(k2 === "r" && rests >= L / 4) && !(k2 === "h" && s.filter((x) => x === "h").length >= L / 4));
        const k = ok[Math.random() * ok.length | 0];
        s.push(k);
        if (k === "r") rests++;
        b += R.BEATS[k];
      }
      const kinds = new Set(s);
      if (kinds.size < 2 && pool.length > 1) continue;
      if (s.every((k) => k === "r")) continue;
      if (last && key(s) === last) continue;
      return s;
    }
    const f = ["q", "e", "q", "q"];
    while (f.length < L) f.push(f.length % 2 ? "e" : "q");
    return f;
  }
  function nearMiss(ans, pool, n) {
    const out = [], seen = /* @__PURE__ */ new Set([key(ans)]), one = pool.filter((k) => R.BEATS[k] === 1);
    const ops = [
      (s) => {
        const i = s.findIndex((k) => k === "e" || k === "q");
        if (i < 0) return null;
        const c = s.slice();
        c[i] = c[i] === "e" ? "q" : "e";
        return c;
      },
      // ti-ti/ta swap
      (s) => {
        const i = Math.random() * s.length | 0;
        if (R.BEATS[s[i]] !== 1) return null;
        const alt = one.filter((k) => k !== s[i]);
        if (!alt.length) return null;
        const c = s.slice();
        c[i] = alt[Math.random() * alt.length | 0];
        return c;
      },
      // one beat changed
      (s) => {
        const idx = [];
        for (let i2 = 0; i2 < s.length - 1; i2++) if (s[i2] !== s[i2 + 1]) idx.push(i2);
        if (!idx.length) return null;
        const i = idx[Math.random() * idx.length | 0], c = s.slice();
        [c[i], c[i + 1]] = [c[i + 1], c[i]];
        return c;
      },
      // beats swapped
      (s) => {
        const i = s.indexOf("h");
        if (i < 0) return null;
        const c = s.slice();
        c.splice(i, 1, "q", "q");
        return c;
      },
      // half -> ta ta
      (s) => {
        const i = s.findIndex((k) => k === "s" || k === "a" || k === "b");
        if (i < 0) return null;
        const alt = ["s", "a", "b", "e"].filter((k) => k !== s[i]);
        const c = s.slice();
        c[i] = alt[Math.random() * alt.length | 0];
        return c;
      }
    ];
    for (let t = 0; t < 200 && out.length < n; t++) {
      const c = ops[Math.random() * ops.length | 0](ans);
      if (!c || R.len(c) !== R.len(ans) || c.every((k) => k === "r")) continue;
      const kk = key(c);
      if (seen.has(kk)) continue;
      seen.add(kk);
      out.push(c);
    }
    while (out.length < n) {
      const c = genRhythm(pool.length > 1 ? pool : ["q", "e"], null, R.len(ans));
      if (!seen.has(key(c))) {
        seen.add(key(c));
        out.push(c);
      }
    }
    return out;
  }
  const howTo = {
    title: "LABEL ROOM: Static Jr. scrambled the labels!",
    steps: ["Tap the box to shake it and hear its rhythm.", "Pick the label card with the matching notes.", "Tap the box again to hear it again.", "Right label = it ships down the conveyor!", "TEACHER picks which notes can appear."],
    words: "ta = 1 sound   ti-ti = 2   tika-tika = 4   rest = silence   (all 1 beat)",
    example: (x, y, w, h, t) => {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      const sh = Math.sin(t * 20) * (t % 2 < 0.5 ? 6 : 0);
      drawBox(-90 + sh, -160, 180, 150, null, t);
      [["q", "e", "q", "q"], ["q", "q", "e", "q"]].forEach((s, i) => drawCard(-220 + i * 230, 40, 210, 140, s, { badge: "AB"[i], hl: i === 1 && t % 3 > 1.5 }));
      ctx.restore();
    }
  };
  const PR = { x: 80, y: 370, w: 216, h: 180 };
  const BELT_Y = 560, BOX_X = 880, BOX_W = 224, BOX_H = 206;
  function drawBox(x, y, w, h, lbl, t, o = {}) {
    const im = BB.V2.crate;
    BB.rrect(x + 6, y + 10, w, h, 12, "rgba(0,0,0,.3)");
    const gr = BB.lg(y, y + h, ["#e2a868", "#c08446", "#93582a"]);
    BB.rrect(x, y, w, h, 12, gr, "#4a2e12", 4);
    ctx.fillStyle = "rgba(255,240,210,.3)";
    ctx.fillRect(x + 6, y + 6, w - 12, 6);
    ctx.fillStyle = "rgba(240,220,170,.85)";
    ctx.fillRect(x + w / 2 - 16, y, 32, h * 0.38);
    ctx.fillStyle = "rgba(60,30,10,.18)";
    ctx.fillRect(x + w * 0.78, y + 8, w * 0.18, h - 16);
    const lx = x + w * 0.12, ly = y + h * 0.42, lw = w * 0.76, lh = h * 0.48;
    if (lbl) drawCard(lx, ly, lw, lh, lbl, { mini: 1 });
    else {
      ctx.setLineDash([10, 8]);
      BB.rrect(lx, ly, lw, lh, 10, "rgba(60,30,10,.18)", "rgba(255,240,210,.7)", 3);
      ctx.setLineDash([]);
      if (o.first) {
        const cw = lw / 4;
        R.tile(o.first, lx + 4, ly + 4, cw * R.BEATS[o.first] - 8, lh - 8, { shadow: false });
        for (let i = R.BEATS[o.first]; i < 4; i++) BB.text("?", lx + cw * i + cw / 2, ly + lh / 2, lh * 0.5, "rgba(255,240,210,.8)", { font: "Rammetto One" });
      } else BB.text("?", lx + lw / 2, ly + lh / 2, lh * 0.6, "rgba(255,240,210,.85)", { font: "Rammetto One" });
    }
    if (o.lamps) for (let i = 0; i < 4; i++) {
      const cx = x + w * 0.2 + i * w * 0.2, cy = y + h * 0.22, l = o.lamps[i] || 0;
      ctx.fillStyle = "#2a1a0a";
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, 7);
      ctx.fill();
      ctx.fillStyle = l > 0 ? "rgba(255,".concat(200 + 55 * l | 0, ",90,").concat(0.4 + 0.6 * l, ")") : "#5a4a2a";
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, 7);
      ctx.fill();
    }
  }
  const CARDC = /* @__PURE__ */ new Map(), PANC = /* @__PURE__ */ new Map();
  function PANEL(x, y, w, h, r = 30) {
    const k = w + "|" + h + "|" + r + "|" + BB.tier;
    let c = PANC.get(k);
    const M = 48;
    if (!c) {
      c = document.createElement("canvas");
      c.width = w + M * 2;
      c.height = h + M * 2;
      const g = c.getContext("2d");
      g.translate(M - x, M - y);
      BB.withCtx(g, () => BB.panel(x, y, w, h, r));
      PANC.set(k, c);
    }
    ctx.drawImage(c, x - M, y - M);
  }
  function drawCard(x, y, w, h, seq, o = {}) {
    if (o.lit && o.lit.some((v) => v > 0)) return drawCardRaw(x, y, w, h, seq, o);
    const k = seq.join("") + "|" + w + "|" + h + "|" + (o.badge || "") + "|" + (o.hl ? 1 : 0) + (o.mini ? 1 : 0) + (o.syl ? 1 : 0) + (o.x ? 1 : 0) + "|" + BB.tier;
    let c = CARDC.get(k);
    if (!c) {
      if (CARDC.size > 160) CARDC.clear();
      const P = 12, sc = BB.q ? 1 : 0.5;
      c = document.createElement("canvas");
      c.width = Math.ceil((w + P * 2) * sc);
      c.height = Math.ceil((h + P * 2) * sc);
      const g = c.getContext("2d");
      g.scale(sc, sc);
      g.translate(P - x, P - y);
      BB.withCtx(g, () => drawCardRaw(x, y, w, h, seq, o));
      CARDC.set(k, c);
    }
    ctx.drawImage(c, x - 12, y - 12, w + 24, h + 24);
  }
  function drawStampArm(t) {
    const X = 1300, TOP = 110, PAD = 398, c = t % 4, p = c < 3.4 ? 0 : c < 3.6 ? (c - 3.4) / 0.2 : c < 3.75 ? 1 : 1 - (c - 3.75) / 0.25, e = p * p * (3 - 2 * p), ext = 30 + e * 178;
    ctx.save();
    BB.rrect(X - 120, TOP - 40, 240, 50, 10, BB.lg(TOP - 40, TOP + 10, ["#6e7a86", "#2e363e"]), "#22282e", 4);
    ctx.fillStyle = "#f2c230";
    for (let i = 0; i < 6; i++) ctx.fillRect(X - 110 + i * 38, TOP - 30, 18, 30);
    BB.rrect(X - 34, TOP, 68, 90, 12, BB.lg(TOP, TOP + 90, ["#a4b2bc", "#4e5a64"]), "#22282e", 4);
    ctx.fillStyle = "#ff5a4a";
    ctx.beginPath();
    ctx.arc(X, TOP + 45, 10, 0, 7);
    ctx.fill();
    const y0 = TOP + 90;
    const pg = ctx.createLinearGradient(X - 16, 0, X + 16, 0);
    pg.addColorStop(0, "#7d8a92");
    pg.addColorStop(0.35, "#f2f6f8");
    pg.addColorStop(1, "#5d6a72");
    BB.rrect(X - 16, y0, 32, ext, 6, pg, "#22282e", 3);
    ctx.fillStyle = "rgba(0,0,0,.18)";
    for (let y = y0 + 14; y < y0 + ext - 8; y += 22) ctx.fillRect(X - 16, y, 32, 4);
    const hy = y0 + ext;
    BB.rrect(X - 50, hy, 100, 46, 10, BB.lg(hy, hy + 46, ["#a8704a", "#5e3620"]), "#22282e", 4);
    BB.rrect(X - 70, hy + 46, 140, 26, 6, BB.lg(hy + 46, hy + 72, ["#e8685a", "#9c2e24"]), "#22282e", 4);
    {
      const py = PAD + 66;
      BB.rrect(X - 100, py, 200, 90, 8, BB.lg(py, py + 90, ["#d8a466", "#9a6430"]), "#4a2e12", 4);
      ctx.fillStyle = "rgba(240,220,170,.8)";
      ctx.fillRect(X - 14, py, 28, 90);
    }
    if (e > 0.5 || c < 1.2) {
      ctx.globalAlpha = c < 1.2 ? 1 - c / 1.2 * 0.6 : 1;
      ctx.strokeStyle = "#d24a3c";
      ctx.lineWidth = 5;
      ctx.strokeRect(X - 60, PAD + 84, 120, 46);
      BB.text("OK!", X, PAD + 108, 30, "#d24a3c");
    }
    ctx.restore();
  }
  function drawCardRaw(x, y, w, h, seq, o = {}) {
    ctx.save();
    if (!o.mini) BB.rrect(x + 5, y + 8, w, h, 12, "rgba(0,0,0,.35)");
    BB.rrect(x, y, w, h, 12, BB.lg(y, y + h, ["#fffaf0", "#f1e8d2", "#ddd0b2"]));
    R.paper(x, y, w, h);
    BB.rrect(x, y, w, h, 12, null, o.hl ? COL.yellow : "rgba(110,95,70,.7)", o.hl ? 6 : 2);
    const hh = o.mini ? 0 : Math.min(40, h * 0.2);
    if (hh) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, hh + 4, [12, 12, 0, 0]);
      ctx.clip();
      ctx.fillStyle = "#d24a3c";
      ctx.fillRect(x, y, w, hh + 4);
      ctx.restore();
      BB.text("SHIP TO: DELIVERY", x + (o.badge ? 58 : w / 2), y + hh / 2 + 2, Math.min(22, hh * 0.6), "#fff", { maxW: w - (o.badge ? 80 : 20), align: o.badge ? "left" : "center" });
    }
    if (o.badge) {
      BB.rrect(x + 10, y + 6, 40, hh - 4, 8, "#fbf6e6", COL.ink, 2);
      BB.text(o.badge, x + 30, y + hh / 2 + 2, 24, COL.ink);
    }
    const pad = o.mini ? 4 : 12, bx = x + pad, by = y + hh + pad, bw = (w - pad * 2) / Math.max(4, R.len(seq)), bh = h - hh - pad * 2 - (o.syl ? 28 : 0);
    let b = 0;
    const U = R.noteSize("q", bw - 6, bh);
    for (const k of seq) {
      const n = R.BEATS[k], cx = bx + b * bw;
      if (!o.mini && b > 0) {
        ctx.fillStyle = "rgba(90,80,64,.18)";
        ctx.fillRect(cx - 1, by + 6, 2, bh - 12);
      }
      const lit = o.lit && o.lit[b] > 0;
      if (lit) BB.rrect(cx + 2, by, n * bw - 4, bh, 8, "rgba(255,224,102,".concat(0.25 + 0.4 * o.lit[b], ")"));
      R.tile(k, cx + 3, by, n * bw - 6, bh, { ns: Math.min(U, R.noteSize(k, n * bw - 6, bh)), shadow: !o.mini && BB.tier > 0 });
      if (o.syl) BB.text(SYL[k], cx + n * bw / 2, by + bh + 16, 20, "#5a5040", { maxW: n * bw - 6 });
      b += n;
    }
    if (o.x) {
      ctx.strokeStyle = "#d24a3c";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + 30, y + 30);
      ctx.lineTo(x + w - 30, y + h - 30);
      ctx.moveTo(x + w - 30, y + 30);
      ctx.lineTo(x + 30, y + h - 30);
      ctx.stroke();
    }
    ctx.restore();
  }
  class LabelRoom {
    constructor(o = {}) {
      this.o = o;
    }
    enter() {
      BB.groove.start(100, "pack");
      this.allowed = loadAllowed();
      this.streak = 0;
      this.best = 0;
      this.score = 0;
      this.shipped = this.o.startAt || 0;
      this.last = null;
      this.said = {};
      this.motes = R.motes(18);
      this.belt = 0;
      this.lamps = [0, 0, 0, 0];
      this.clapBack = localStorage.getItem("bb_lbl_clap") === "1";
      this.state = "load";
      this.teacher = false;
      this.lastOverride = -9;
      R.loadImgs([["mail_bg", "jpg"], ["pack_blur", "jpg"], ["crate", "png"]]).then(() => {
        this.static = this.bake();
        if (this.o.skipIntro || this.o.startAt) this.newBox(true);
        else this.startIntro();
      });
      BB.mic.take();
      window.__lbl = this;
    }
    exit() {
      BB.paused = false;
      if (window.__lbl === this) window.__lbl = null;
    }
    bake() {
      const s = !BB.q ? 0.5 : 1, c = document.createElement("canvas");
      c.width = W * s;
      c.height = H * s;
      const g = c.getContext("2d");
      g.scale(s, s);
      const V = BB.V2;
      if (V.mail_bg || V.pack_blur) g.drawImage(V.mail_bg || V.pack_blur, 0, 0, W, H);
      g.fillStyle = "rgba(8,18,17,.28)";
      g.fillRect(0, 0, W, H);
      R.paint(g, () => {
        const g2 = BB.ctx;
        {
          g2.save();
          g2.translate(W - 250, 300);
          g2.fillStyle = "#1e2b29";
          g2.beginPath();
          g2.roundRect(-190, -70, 380, 120, 22);
          g2.fill();
          g2.strokeStyle = "#ff8adf";
          g2.lineWidth = 6;
          g2.shadowColor = "#ff8adf";
          g2.shadowBlur = 24;
          g2.beginPath();
          g2.roundRect(-176, -56, 352, 92, 16);
          g2.stroke();
          g2.shadowBlur = 0;
          g2.fillStyle = "#ffd6f4";
          g2.font = '44px "Rammetto One"';
          g2.textAlign = "center";
          g2.textBaseline = "middle";
          g2.fillText("LABEL ROOM", 0, -10);
          g2.restore();
          for (let x = 0; x < W; x += 60) {
            g2.fillStyle = x / 60 % 2 ? "#ffe066" : "#1e2b29";
            g2.fillRect(x, H - 36, 60, 14);
          }
        }
        R.shadow(g2, 780, BELT_Y + 120, 760, 0.55);
        const fr = g2.createLinearGradient(0, BELT_Y + 24, 0, BELT_Y + 80);
        fr.addColorStop(0, "#c9d2d3");
        fr.addColorStop(0.5, "#8a9798");
        fr.addColorStop(1, "#56625f");
        g2.fillStyle = fr;
        g2.fillRect(40, BELT_Y + 24, 1440, 56);
        g2.fillStyle = "rgba(0,0,0,.3)";
        g2.fillRect(40, BELT_Y + 80, 1440, 8);
        for (const x of [120, 760, 1400]) {
          const lg = g2.createLinearGradient(x, 0, x + 44, 0);
          lg.addColorStop(0, "#5d696b");
          lg.addColorStop(0.5, "#aab4b5");
          lg.addColorStop(1, "#4d585a");
          g2.fillStyle = lg;
          g2.fillRect(x, BELT_Y + 88, 44, 60);
        }
      });
      return c;
    }
    // beat clock = the groove's grid (one shared grid for music, playback, lights and clap-back)
    beatV() {
      const gr = BB.groove;
      return gr && gr.on ? (ac.currentTime - BB.visLat() - gr.t0) / gr.spb : BB.t / 0.6;
    }
    nextBeat() {
      const gr = BB.groove;
      if (!gr || !gr.on) return { t: ac.currentTime + 0.3, spb: 0.6 };
      const k = Math.ceil((ac.currentTime + 0.2 - gr.t0) / gr.spb);
      return { t: gr.t0 + k * gr.spb, spb: gr.spb };
    }
    // intro: Static Jr. runs in, zaps the label printer, labels spew out and tumble, he runs off; then Sprocket asks for help
    startIntro() {
      this.state = "intro";
      this.st = BB.t;
      this.flurry = [];
      this.ijr = { x: -160, ph: "in" };
    }
    introJr(dt) {
      const t = BB.t - this.st, j = this.ijr;
      if (!j) return;
      if (j.ph === "in") {
        j.x = lerp(-160, PR.x + PR.w + 90, ease.out(clamp(t / 1.2, 0, 1)));
        if (t > 1.2) {
          j.ph = "zap";
          BB.sfx.glitch();
          BB.sfx.zap && BB.sfx.zap();
          BB.shake(5);
          BB.say("jr_lbl", { overlap: true });
        }
      } else if (j.ph === "zap") {
        if (Math.random() < 0.5) BB.burst(PR.x + PR.w - 20, PR.y + 60, 3, { cols: ["#9ff", "#fff", "#ffe066"], kind: "spark", size: 10, speed: 600, g: 200, life: 0.4 });
        if (t > 2.4) {
          j.ph = "out";
          this.zapEnd = BB.t;
          setTimeout(() => {
            if (BB.scene !== this || this.state !== "intro") return;
            const d = BB.say("lb_intro");
            setTimeout(() => {
              if (BB.scene === this && this.state === "intro") this.voEnd = BB.t + BB.say("lb_intro2");
            }, (d + 0.25) * 1e3);
          }, 300);
        }
      } else if (j.ph === "out") {
        j.x += dt * 900;
        if (j.x > W + 200) this.ijr = null;
      }
      if (t > 1.5 && this.flurry.length < 10 && BB.t - (this.lastFlake || 0) > 0.28) {
        this.lastFlake = BB.t;
        this.flurry.push(this.flake(PR.y + 40, true));
        BB.sfx.pop();
      }
    }
    flake(y, fromPr) {
      return { x: fromPr ? PR.x + PR.w / 2 : 260 + Math.random() * 1200, vx: fromPr ? 250 + Math.random() * 700 : 0, y, vy: fromPr ? -120 - Math.random() * 120 : 150 + Math.random() * 70, p: Math.random() * 6, r: (Math.random() - 0.5) * 0.6, vr: (Math.random() - 0.5) * 1.6, s: genRhythm(["q", "e", "r"], null) };
    }
    skipIntro() {
      this.flurry = null;
      this.ijr = null;
      BB.talking = null;
      BB.caption = null;
      this.newBox(true);
    }
    level() {
      return Math.min(LV.length - 1, Math.floor(this.streak / 2) + Math.floor(this.shipped / 3));
    }
    pool() {
      let p = LV[this.level()].filter((k) => this.allowed.includes(k));
      if (p.length < 2) p = this.allowed.slice();
      if (!p.length) p = ["q", "e"];
      if (p.length === 1 && p[0] === "r") p = ["q", "r"];
      return p;
    }
    newBox(first) {
      const pool = this.pool();
      const L = beatsFor(this.shipped), ans = genRhythm(pool, this.last, L);
      if (first || L !== this.L) {
        if (this.L && L !== this.L) {
          this.stageT = BB.t;
          BB.sfx.chime();
        }
        this.L = L;
      }
      this.last = key(ans);
      const nc = L > 4 ? 3 : this.streak >= 3 || this.level() >= 3 ? 4 : 3;
      const cards = [ans, ...nearMiss(ans, pool, nc - 1)].sort(() => Math.random() - 0.5).map((s) => ({ s, out: false, x: false, shake: 0 }));
      this.ans = ans;
      this.cards = cards;
      this.hint = 0;
      this.tries = 0;
      this.state = "enter";
      this.st = BB.t;
      this.boxX = -400;
      this.pb = null;
      this.fly = null;
      this.revealed = false;
      this.lit = new Array(L).fill(0);
      BB.sfx.whoosh(void 0, 0.6);
      if (first) {
        this.cardT = BB.t;
        if (!this.said.how) {
          this.said.how = 1;
          setTimeout(() => BB.scene === this && BB.say("lb_how"), 1200);
        }
      }
    }
    // play the hidden rhythm (robot sounds) on the beat grid; slow = half speed (still on grid beats)
    play(slow, syl) {
      if (this.state !== "pick" && this.state !== "enter") return;
      const nb = this.nextBeat(), spb = nb.spb * (slow ? 2 : 1), t0 = nb.t, S = BB.sfx;
      let b = 0;
      const notes = [];
      BB.boxVol = 1.9;
      for (const k of this.ans) {
        const t = t0 + b * spb;
        notes.push({ k, b, t, n: R.BEATS[k] });
        if (k === "q") S.pkTa(t);
        else if (k === "e") {
          S.pkBlip(t, 1100);
          S.pkBlip(t + spb / 2, 1100);
        } else if (k === "s") {
          for (let i = 0; i < 4; i++) S.pkBlip(t + i * spb / 4, 1500);
        } else if (k === "a") {
          S.pkBlip(t, 1100);
          S.pkBlip(t + spb / 2, 1500);
          S.pkBlip(t + spb * 0.75, 1500);
        } else if (k === "b") {
          S.pkBlip(t, 1500);
          S.pkBlip(t + spb / 4, 1500);
          S.pkBlip(t + spb / 2, 1100);
        } else if (k === "r") S.pkHiss(t, spb * 0.5);
        else S.pkHum(t, R.BEATS[k] * spb * 0.9);
        if (syl && k !== "r") setTimeout(() => BB.scene === this && BB.say("syl_" + k, { overlap: true, nocap: true }), Math.max(0, (t - ac.currentTime) * 1e3 - 20));
        b += R.BEATS[k];
      }
      BB.boxVol = 1;
      this.pb = { t0, spb, notes, end: t0 + R.len(this.ans) * spb };
      this.shakeT = BB.t;
    }
    tapBox() {
      if (this.state === "pick") {
        if (this.pb && ac.currentTime < this.pb.end) return;
        this.play(false);
      }
    }
    doHint() {
      if (this.state !== "pick" || this.hint >= 5) return;
      this.hint++;
      BB.sfx.pop();
      const h = this.hint;
      if (h === 1) this.play(true);
      else if (h === 2) this.play(false);
      else if (h === 3) {
        BB.say("lb_hint", { overlap: true });
      } else if (h === 4) {
        const w = this.cards.filter((c) => !c.out && c.s !== this.ans);
        if (w.length) {
          const c = w[Math.random() * w.length | 0];
          c.out = true;
          c.outT = BB.t;
        }
      } else if (h === 5) {
        this.revealed = true;
        this.play(true, true);
      }
    }
    pick(c) {
      if (this.state !== "pick" || c.out) return;
      if (c.s === this.ans) {
        this.correct(c);
        return;
      }
      this.tries++;
      c.x = true;
      c.out = true;
      c.outT = BB.t;
      c.shake = BB.t;
      this.streak = 0;
      BB.sfx.bonk();
      if (this.tries === 1 && Math.random() < 0.6 && !this.pop) {
        this.pop = { t: BB.t, txt: "wrong label! hee hee" };
        BB.say("jr_lwrong", { overlap: true });
        setTimeout(() => BB.scene === this && BB.say("lb_wrong"), 1100);
      } else BB.say("lb_wrong");
      setTimeout(() => BB.scene === this && this.state === "pick" && this.play(false), 1400);
    }
    points() {
      return Math.max(1, 10 - 2 * this.hint - 3 * this.tries);
    }
    correct(c) {
      const i = this.cards.indexOf(c);
      this.state = "fly";
      this.st = BB.t;
      this.fly = { i, from: this.cardRect(i) };
      const p = this.points();
      this.score += p;
      this.gain = { p, t: BB.t };
      this.streak++;
      this.best = Math.max(this.best, this.streak);
      BB.sfx.ding();
      BB.say(this.streak % 2 ? "lb_right" : "lb_right2");
      if (this.streak === 3 || this.streak === 6) setTimeout(() => {
        if (BB.scene !== this) return;
        this.pop = { t: BB.t, txt: "no fair!" };
        BB.say("jr_lstreak", { overlap: true });
      }, 1500);
      if (this.streak === 4) setTimeout(() => BB.scene === this && BB.say("lb_faster", { overlap: false }), 1800);
    }
    slapped() {
      BB.sfx.thunk();
      BB.sfx.clunk(ac.currentTime + 0.05);
      BB.shake(5);
      BB.burst(BOX_X, BELT_Y - BOX_H * 0.3, 18, { cols: ["#ffe066", "#fff", "#d24a3c"], kind: "star", size: 12, speed: 500, g: 500 });
      if (this.clapBack) {
        this.state = "clap";
        this.cb = new R.ClapBack(this.ans, { bpm: 100, onDone: () => setTimeout(() => BB.scene === this && this.ship(), 500) });
        BB.say("lb_clap", { overlap: true });
      } else setTimeout(() => BB.scene === this && this.ship(), 500);
    }
    ship() {
      this.cb = null;
      this.state = "ship";
      this.st = BB.t;
      BB.sfx.whoosh(void 0, 1);
    }
    manualOverride() {
      if (BB.t - this.lastOverride < 0.5) return;
      this.lastOverride = BB.t;
      this.ovPop = BB.t;
      if (this.cb) this.cb.override();
      else if (this.state === "pick") this.tapBox();
    }
    pause() {
      BB.paused = true;
      BB.ac.suspend();
    }
    resume() {
      BB.paused = false;
      BB.ensureMic();
    }
    cardRect(i) {
      const n = this.cards.length, cw = (this.L || 4) > 4 ? 470 : n > 3 ? 340 : 400, ch = 215, gap = 30, tot = n * cw + (n - 1) * gap, x0 = W / 2 - tot / 2;
      return { x: x0 + i * (cw + gap), y: 690, w: cw, h: ch };
    }
    update(dt) {
      BB.dt = dt;
      if (BB.keys.includes("p")) {
        this.pause();
        return;
      }
      if (BB.keys.includes(" ")) this.manualOverride();
      for (const k of BB.keys) {
        if (k >= "1" && k <= "4" && this.cards && this.cards[+k - 1]) this.pick(this.cards[+k - 1]);
        if (k === "b") this.tapBox();
      }
      if (this.state === "intro") {
        const t = BB.t - this.st;
        this.introJr(dt);
        for (const f of this.flurry) {
          f.vy = Math.min(f.vy + 500 * dt, 170);
          f.vx *= 1 - dt * 1.2;
          f.y += f.vy * dt;
          f.x += f.vx * dt + Math.sin(BB.t * 1.6 + f.p) * 70 * dt;
          f.r += f.vr * dt;
          if (f.y > BELT_Y - 60) {
            Object.assign(f, this.flake(-90));
          }
          if (f.x > 1450) f.x = 1450;
        }
        if (BB.keys.includes("s")) this.skipIntro();
        if (t > 2 && this.voEnd && BB.t > this.voEnd + 0.4) this.skipIntro();
        if (t > 14) this.skipIntro();
      }
      const bv = this.beatV();
      this.belt = bv;
      if (this.state === "enter") {
        const k = clamp((BB.t - this.st) / 1.1, 0, 1);
        this.boxX = lerp(-400, BOX_X, ease.out(k));
        if (k >= 1) {
          this.state = "pick";
          this.play(false);
        }
      }
      if (this.state === "fly" && BB.t - this.st > 0.55) {
        this.state = "slap";
        this.slapped();
      }
      if (this.state === "ship") {
        const k = clamp((BB.t - this.st) / 1.4, 0, 1);
        this.boxX = lerp(BOX_X, W + 400, ease.inOut(k));
        if (k >= 1) {
          this.shipped++;
          if (this.shipped >= BOXES) {
            this.state = "end";
            this.st = BB.t;
            {
              const d = BB.say("lb_done");
              setTimeout(() => BB.scene === this && BB.say("lb_done2"), (d + 0.2) * 1e3);
            }
            BB.celebrate({ next: "DELIVERY" });
            if (!BB.save.done.includes("label")) {
              BB.save.done.push("label");
              localStorage.setItem("bb4", JSON.stringify(BB.save));
            }
          } else this.newBox();
        }
      }
      const lam = [0, 0, 0, 0];
      if (this.pb) {
        const tv = ac.currentTime - BB.visLat();
        for (const n of this.pb.notes) {
          const d = tv - n.t;
          if (d >= 0 && d < n.n * this.pb.spb) for (let j = 0; j < n.n; j++) {
            const dj = tv - (n.t + j * this.pb.spb);
            if (dj >= 0 && dj < this.pb.spb) lam[n.b + j] = 1 - dj / this.pb.spb * 0.6;
          }
        }
      }
      this.lit = lam;
      if (this.cb) this.cb.update && this.cb.update(dt);
      else BB.mic.take();
    }
    draw() {
      const t = BB.t, [sx, sy] = BB.shakeXY;
      ctx.save();
      ctx.translate(sx, sy);
      if (this.static) ctx.drawImage(this.static, 0, 0, W, H);
      else {
        ctx.fillStyle = "#2a3a38";
        ctx.fillRect(0, 0, W, H);
      }
      R.paint(ctx, () => {
        this.drawBelt(t);
        drawStampArm(t);
      });
      if (this.state !== "intro" && this.state !== "load" && this.state !== "end") {
        const sh = this.shakeT && t - this.shakeT < 0.35 ? Math.sin((t - this.shakeT) * 60) * 8 * (1 - (t - this.shakeT) / 0.35) : 0;
        const lbl = this.state === "slap" || this.state === "ship" || this.state === "clap" ? this.ans : null, bx = this.boxX - BOX_W / 2 + sh, by = BELT_Y - BOX_H;
        ctx.save();
        if (sh) {
          ctx.translate(this.boxX, BELT_Y);
          ctx.rotate(sh * 6e-3);
          ctx.translate(-this.boxX, -BELT_Y);
        }
        drawBox(bx, by, BOX_W, BOX_H, lbl, t, { lamps: this.hint >= 2 && this.state === "pick" ? this.lit : null, first: this.hint >= 3 && !lbl ? this.ans[0] : null });
        ctx.restore();
        if (this.state === "pick") BB.button(bx, by, BOX_W, BOX_H, "", { style: "none", id: "box", onClick: () => this.tapBox() });
        if (this.state === "pick" && (!this.pb || ac.currentTime > this.pb.end)) {
          const pu = 0.5 + 0.5 * Math.sin(t * 5);
          BB.plaque(this.boxX, by - 40, 224, 44, "TAP TO SHAKE!", 22, "#28403c", { cols: pu > 0.5 ? ["#fff8d0", "#ffe680", "#e8b830"] : void 0 });
        } else if (this.state === "pick" && this.pb && ac.currentTime < this.pb.end) BB.plaque(this.boxX, by - 46, 270, 50, this.pb.spb > 0.9 ? "\u266A SLOW..." : "\u266A LISTEN...", 24, "#28403c");
      }
      R.paint(ctx, () => this.drawPrinter(t));
      this.drawSprocket(t);
      if (this.ijr) BB.staticJr(this.ijr.x, BELT_Y - 4, 120, { run: this.ijr.ph !== "zap" ? 1 : 0, glitch: this.ijr.ph === "zap" ? 0.6 : 0, spd: this.ijr.ph === "out" ? 900 : 600, flip: this.ijr.ph === "zap" });
      if (this.ijr && this.ijr.ph === "zap") {
        ctx.save();
        ctx.strokeStyle = Math.sin(t * 40) > 0 ? "#bff" : "#fff";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        let x = this.ijr.x - 40, y = BELT_Y - 90;
        ctx.moveTo(x, y);
        for (let i = 1; i <= 5; i++) {
          const tx = lerp(x, PR.x + PR.w - 10, i / 5), ty = lerp(y, PR.y + 80, i / 5) + (i < 5 ? (Math.random() - 0.5) * 40 : 0);
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();
        ctx.restore();
      }
      if (this.pop) {
        const pp = this.pop, a = BB.t - pp.t;
        if (a < 1.8) {
          const k = a < 0.3 ? ease.out(a / 0.3) : a > 1.5 ? 1 - (a - 1.5) / 0.3 : 1;
          BB.staticJr(520, BELT_Y - 4, 110 * Math.max(0.01, k), { glitch: 0.3 });
          if (a > 0.2 && a < 1.5) R.bubble(520, BELT_Y - 250, pp.txt);
        } else this.pop = null;
      }
      if (this.flurry) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 170, 1500, BELT_Y - 170);
        ctx.rect(PR.x - 30, 170, PR.w + 60, BELT_Y - 170);
        ctx.clip("evenodd");
      }
      if (this.flurry) for (const f of this.flurry) {
        ctx.save();
        ctx.globalAlpha = clamp((BELT_Y - 60 - f.y) / 120, 0, 1);
        ctx.translate(f.x, f.y);
        ctx.rotate(f.r);
        drawCard(-120, -70, 240, 140, f.s, {});
        ctx.restore();
      }
      if (this.flurry) ctx.restore();
      ctx.restore();
      R.drawMotes(this.motes, BB.paused ? 0 : Math.min(0.05, BB.dt || 0.016), t);
      BB.drawParts();
      if (this.cards && ["pick", "fly", "slap", "clap", "ship", "enter"].includes(this.state)) this.drawCards(t);
      this.drawHUD(t);
      BB.captionBox();
      if (this.state === "enter" && this.cardT && t - this.cardT < 2.6) BB.titleCard("ROOM 4: LABEL ROOM", "Static Jr. scrambled the labels. Match them!", (t - this.cardT) / 2.6);
      if (this.state === "end") this.drawEnd();
      if (this.teacher) this.drawTeacher();
      if (BB.paused) BB.pauseOverlay(howTo, () => this.resume());
    }
    drawBelt(t) {
      const y = BELT_Y, x0 = 40, x1 = 1480;
      BB.rrect(x0, y, x1 - x0, 26, 8, BB.lg(y, y + 26, ["#3a4644", "#222b2a"]), "#121918", 2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y, x1 - x0, 26);
      ctx.clip();
      const off = (this.belt * 60 % 60 + 60) % 60;
      ctx.fillStyle = "rgba(160,210,200,.22)";
      for (let x = x0 - 60 + off; x < x1; x += 60) ctx.fillRect(x, y + 3, 6, 20);
      ctx.restore();
      const bv = this.belt, bi = (Math.floor(bv) % 4 + 4) % 4, ph = bv - Math.floor(bv), fl = Math.max(0, 1 - ph * 2.2);
      for (let i = 0; i < 16; i++) {
        const lx = x0 + 50 + i * ((x1 - x0 - 100) / 15), ly = y + 52, on = i % 4 === bi;
        ctx.fillStyle = "#1b2322";
        ctx.beginPath();
        ctx.arc(lx, ly, 13, 0, 7);
        ctx.fill();
        ctx.fillStyle = on && fl > 0 ? "rgba(255,".concat(210 + 40 * fl | 0, ",90,").concat(0.35 + 0.65 * fl, ")") : "#4a5250";
        ctx.beginPath();
        ctx.arc(lx, ly, 9, 0, 7);
        ctx.fill();
        if (on && fl > 0.2 && BB.tier > 0) BB.glow(lx, ly, 34, "rgba(255,220,120,A)", fl * 0.5);
      }
    }
    drawPrinter(t) {
      const { x, y, w, h } = PR, zap = this.ijr && this.ijr.ph === "zap", jit = zap ? Math.sin(t * 50) * 3 : 0;
      ctx.save();
      ctx.translate(jit, 0);
      BB.rrect(x + 6, y + 10, w, h, 16, "rgba(0,0,0,.3)");
      BB.rrect(x, y, w, h, 16, BB.lg(y, y + h, ["#d9e4e2", "#a7b6b4", "#6f7f7d"]), "#2b3534", 4);
      BB.rrect(x + 20, y + 24, w - 40, 70, 10, "#132322", "#50aaa0", 3);
      const scr = zap || this.state === "intro" && this.flurry && this.flurry.length ? Math.sin(t * 14) > 0 ? "#e65046" : "#ffe066" : "#6ee678";
      BB.text(zap ? "ZZZT!" : this.state === "intro" ? "ERROR" : "READY", x + w / 2, y + 60, 30, scr, { font: "Rammetto One" });
      BB.rrect(x + 30, y + h - 60, w - 60, 22, 8, "#1b2322");
      ctx.fillStyle = "#fbf6e6";
      ctx.fillRect(x + 40, y + h - 52, w - 80, 6);
      BB.plaque(x + w / 2, y - 26, 220, 44, "LABEL PRINTER", 20, "#28403c");
      ctx.restore();
    }
    drawSprocket(t) {
      const x = 1720, base = 712;
      R.paint(ctx, () => {
        for (const [y, h, w] of [[712, 100, 190], [812, 96, 206]]) {
          BB.rrect(x - w / 2, y, w, h, 8, BB.lg(y, y + h, ["#d8a466", "#9a6430"]), "#4a2e12", 4);
          ctx.fillStyle = "rgba(240,220,170,.8)";
          ctx.fillRect(x - 14, y, 28, h);
        }
      });
      BB.contactShadow(x, base, 90, 0.4);
      BB.sprite("sprocket", x, base, 300, { squash: BB.isTalking("sprocket") ? Math.sin(t * 18) * 0.015 : Math.sin(t * 2) * 6e-3 });
    }
    drawCards(t) {
      const fl = this.fly;
      this.cards.forEach((c, i) => {
        const r = this.cardRect(i);
        if (fl && fl.i === i && this.state !== "fly") return;
        let x = r.x, y = r.y, w = r.w, h = r.h, a = 1;
        if (fl && fl.i !== i) {
          const k = clamp((t - this.st) / 0.3, 0, 1);
          a = 1 - k;
          if (a <= 0) return;
        } else if (c.out) {
          const k = clamp((t - (c.outT || 0)) / 0.4, 0, 1);
          a = c.x ? 1 - 0.55 * k : 1 - k;
          if (a <= 0) return;
        }
        if (fl && fl.i === i) {
          const k = ease.inOut(clamp((t - this.st) / 0.55, 0, 1));
          const tx = BOX_X - BOX_W * 0.38, ty = BELT_Y - BOX_H * 0.58, tw = BOX_W * 0.76, th = BOX_H * 0.48;
          x = lerp(r.x, tx, k);
          y = lerp(r.y, ty, k) - Math.sin(k * Math.PI) * 120;
          w = lerp(r.w, tw, k);
          h = lerp(r.h, th, k);
        }
        const sh = c.shake && t - c.shake < 0.4 ? Math.sin((t - c.shake) * 50) * 10 : 0;
        ctx.save();
        ctx.globalAlpha = a;
        drawCard(x + sh, y, w, h, c.s, { badge: fl && fl.i === i ? null : "ABCD"[i], x: c.x, syl: this.revealed && c.s === this.ans, hl: this.revealed && c.s === this.ans && Math.sin(t * 6) > 0 });
        ctx.restore();
        if (this.state === "pick" && !c.out) BB.button(r.x, r.y, r.w, r.h, "", { style: "none", id: "card" + i, onClick: () => this.pick(c) });
      });
    }
    drawHUD(t) {
      if (this.state === "end") return;
      PANEL(40, 24, 470, 110, 28);
      BB.text("BOXES SHIPPED", 64, 52, 30, COL.yellow, { align: "left", stroke: 4 });
      BB.text("".concat(this.shipped, " of ").concat(BOXES), 64, 98, 28, "#fff", { align: "left", font: "Rammetto One", stroke: 4 });
      for (let i = 0; i < BOXES; i++) BB.rrect(196 + i * 28, 82, 22, 32, 6, i < this.shipped ? BB.lg(82, 114, ["#a6f5ae", "#3fb45a"]) : "#2d4744", "#fff", 3);
      PANEL(1196, 24, 260, 110, 28);
      BB.text("POINTS " + this.score, 1326, 56, 30, "#fff", { stroke: 4, maxW: 224 });
      BB.text("STREAK " + this.streak + (this.streak >= 3 ? " \u2605" : ""), 1326, 100, 26, COL.yellow, { stroke: 4, maxW: 290 });
      if (this.gain && t - this.gain.t < 1.4) {
        const k = (t - this.gain.t) / 1.4;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        BB.text("+" + this.gain.p, 1326, 170 - k * 40, 44, COL.green, { font: "Rammetto One", stroke: 6 });
        ctx.restore();
      }
      BB.button(1680, 24, 200, 110, "TEACHER", { size: 30, id: "teacher", onClick: () => {
        this.teacher = true;
      } });
      BB.pauseBtn(() => this.pause(), 738);
      if (this.state === "end") return;
      if (this.state === "intro") {
        BB.button(W - 370, H - 150, 330, 110, "SKIP INTRO", { size: 34, id: "skip", onClick: () => this.skipIntro() });
        return;
      }
      BB.micMeter(40, H - 150);
      if (this.cb) {
        BB.overrideBtn(() => this.manualOverride(), { pop: this.ovPop && t - this.ovPop < 0.3 ? 1.08 : 1 });
        this.cb.draw(W / 2, H - 95);
      }
    }
    drawTeacher() {
      ctx.fillStyle = "rgba(8,18,17,.78)";
      ctx.fillRect(0, 0, W, H);
      const x = W / 2 - 560, y = 150, w = 1120, h = 780;
      PANEL(x, y, w, h, 40);
      BB.text("TEACHER SETTINGS", W / 2, y + 70, 52, "#fff", { font: "Rammetto One", stroke: 7 });
      BB.text("Notes allowed on the labels (higher streaks unlock more of these)", W / 2, y + 130, 28, COL.yellow, { stroke: 4, maxW: w - 80 });
      ALL.forEach((k, i) => {
        const cx = x + 90 + i % 4 * 240, cy = y + 180 + Math.floor(i / 4) * 220, on = this.allowed.includes(k);
        BB.rrect(cx, cy, 210, 190, 20, on ? BB.lg(cy, cy + 190, ["#fffaf0", "#e8e2cd"]) : "#2d4744", on ? "#3fb45a" : "#5d6866", on ? 6 : 3);
        R.tile(k, cx + 20, cy + 10, 170, 120, { shadow: false, alpha: on ? 1 : 0.4 });
        BB.text(R.NAME[k], cx + 105, cy + 160, 26, on ? COL.ink : "#9fb3ae", { maxW: 190 });
        BB.button(cx, cy, 210, 190, "", { style: "none", id: "tn" + k, onClick: () => {
          const a = this.allowed;
          if (a.includes(k)) {
            if (a.filter((z) => z !== "r").length > 1 || k === "r") a.splice(a.indexOf(k), 1);
          } else a.push(k);
          try {
            localStorage.setItem("bb_lbl_notes", JSON.stringify(a));
          } catch (e) {
          }
        } });
      });
      BB.button(x + 90 + 3 * 240, y + 400, 210, 90, this.clapBack ? "CLAP: ON" : "CLAP: OFF", { style: this.clapBack ? "green" : "cream", size: 30, id: "tclap", onClick: () => {
        this.clapBack = !this.clapBack;
        try {
          localStorage.setItem("bb_lbl_clap", this.clapBack ? "1" : "0");
        } catch (e) {
        }
      } });
      BB.text("CLAP: after a correct label, the class claps the rhythm back (mic or MANUAL OVERRIDE).", W / 2, y + 640, 24, "#d8efe9", { maxW: w - 80 });
      BB.button(W / 2 - 160, y + h - 120, 320, 96, "DONE", { style: "green", size: 44, id: "tdone", onClick: () => {
        this.teacher = false;
      } });
    }
    capPos() {
      return this.state === "end" ? { y: 722, maxW: 1150 } : { y: 942, maxW: 1100 };
    }
    drawEnd() {
      const t = BB.t - this.st;
      if (t < 0.4) return;
      const k = ease.back(clamp((t - 0.4) / 0.6, 0, 1));
      ctx.fillStyle = "rgba(8,18,17,".concat(0.6 * clamp(t, 0, 1), ")");
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, 370);
      ctx.scale(k, k);
      PANEL(-600, -195, 1200, 390, 44);
      BB.text("ROOM 4 COMPLETE!", 0, -130, 68, "#fff", { font: "Rammetto One", stroke: 9 });
      drawCard(-230, -80, 460, 140, ["q", "e", "s", "q"], {});
      BB.text(BOXES + " boxes labeled  \u2022  " + this.score + " points  \u2022  best streak " + this.best, 0, 100, 34, COL.yellow, { stroke: 5, maxW: 1100 });
      BB.text("Next: DELIVERY DOCK", 0, 150, 30, "#fff", { stroke: 5 });
      ctx.restore();
      if (t > 1.6) {
        BB.button(W / 2 - 520, 590, 480, 110, "ROOM MAP", { style: "green", size: 52, id: "tomap", onClick: () => BB.roomDone("label") });
        BB.button(W / 2 + 40, 590, 480, 110, "PLAY AGAIN", { size: 46, id: "again", onClick: () => BB.go(new LabelRoom()) });
      }
    }
  }
  BB.LabelRoom = LabelRoom;
  BB.LabelGen = { genRhythm, nearMiss, LV };
})();
