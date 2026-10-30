"use strict";
(() => {
  let ctx = BB.ctx;
  BB._sw.push((g) => ctx = g);
  const COL = BB.COL, W = BB.W, H = BB.H, { clamp, lerp, ease } = BB;
  BB.VO_LINES = (BB.VO_LINES || []).concat([
    ["oh_no", "Oh no! The whole note bin is empty!", "sprocket"],
    ["ate_all", "He ate ALL the whole notes! Rhythm Engineers, to the mine!", "sprocket"],
    ["mic", "Hello, Rhythm Engineers! Let's switch on the microphone, so I can hear your claps!", "sprocket"],
    ["andante", "Andante! Walking speed. Clap slow and steady with the turtle!", "sprocket"],
    ["allegro", "Allegro! Fast! Keep up with the rocket!", "sprocket"],
    ["piano", "Piano means soft. Tiny, quiet claps, so the crystal cracks!", "sprocket"],
    ["forte", "Forte means loud! Big, strong claps!", "sprocket"],
    ["cavein", "Cave-in! Allegro AND piano. Fast, but soft!", "sprocket"],
    ["got_note", "A whole note! Four beats long!", "sprocket"],
    ["pebbles", "Hey! Static Jr. is dropping pebbles! Hold that beat steady!", "sprocket"],
    ["complete", "Eight whole notes! Room one complete! Next stop, the Note Smasher!", "sprocket"],
    ["ready", "Ready? Warm up with four claps in a row on the green lights. Then every clap is a pickaxe strike. Four strikes break the rock!", "sprocket"],
    ["mn_more", "This rock is tougher! Keep striking on the beat!", "sprocket"],
    ["keepgoing", "Keep that beat going!", "sprocket"],
    ["jr_giggle", "Hee hee hee!", "jr"],
    ["jr_nom", "Nom nom nom!", "jr"],
    ["jr_catch", "Can't catch me!", "jr"],
    ["jr_oof", "Oof!", "jr"]
  ]);
  const GY = 880, SHAFT = [1680, 2200], PIPE_X = 1520, BIN_X = 1520, HATCH = [2010, 2185], SMASH_X = 2500, SPR_X = 2880, BTN_X = 2720;
  const top = (k) => 1e3 + k * 560, rail = (k) => top(k) + 380, camY = (k) => top(k) + 240;
  const ROCK_X = 2800, BOT_X = 2470, LEAD_X = 3160, CART_X = 1830;
  const FLOORS = [
    { name: "ANDANTE", mean: "walking speed", icon: "turtle", vo: "andante", col: "#5f412d" },
    { name: "ALLEGRO", mean: "fast!", icon: "rocket", vo: "allegro", col: "#553a28" },
    { name: "PIANO", mean: "soft", icon: "whisper", vo: "piano", col: "#3a3550" },
    { name: "FORTE", mean: "loud!", icon: "boom", vo: "forte", col: "#4b3223" },
    { name: "CAVE-IN!", mean: "bonus round", icon: null, vo: "cavein", col: "#41291e" }
  ];
  const ROCKS = [
    { f: 0, kind: "rock", bpm: 75 },
    { f: 0, kind: "rock", bpm: 75 },
    { f: 1, kind: "rock", bpm: 145, prank: true },
    { f: 1, kind: "rock", bpm: 145 },
    { f: 2, kind: "crystal", bpm: 96, dyn: "p", st: 6 },
    { f: 2, kind: "crystal", bpm: 96, dyn: "p", prank: true, st: 6 },
    { f: 3, kind: "boulder", bpm: 96, dyn: "f", st: 8 },
    { f: 3, kind: "boulder", bpm: 96, dyn: "f", st: 8 },
    { f: 4, kind: "crystal", bpm: 145, dyn: "p", bonus: true, sign: ["ALLEGRO + PIANO", "fast but soft"], icons: ["rocket", "whisper"], prank: true },
    { f: 4, kind: "boulder", bpm: 75, dyn: "f", bonus: true, sign: ["ANDANTE + FORTE", "slow and loud"], icons: ["turtle", "boom"] }
  ];
  const TBOX = (k) => ({ x0: 1480, x1: 3320, y0: top(k) + 34, y1: rail(k) });
  const LIGHT = [{ rim: "#ffd08a", amb: "#ff9a40", haze: "60,34,18" }, { rim: "#ffc070", amb: "#ff8030", haze: "64,32,16" }, { rim: "#bfe6ff", amb: "#6a8cff", haze: "24,26,60" }, { rim: "#ffb060", amb: "#ff6a30", haze: "66,28,14" }, { rim: "#ffa070", amb: "#d05030", haze: "58,24,16" }];
  const NEED = 4, WARM = 4;
  const strikesFor = (R) => R ? R.bonus ? 4 : R.st || 4 : 4;
  const SOFT_MAX = window.GroupGate ? GroupGate.SOFT_MAX : 0.62, LOUD_MIN = window.GroupGate ? GroupGate.LOUD_MIN : 0.7;
  let dirtPat = null;
  function dirt() {
    if (dirtPat) return dirtPat;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#78503a";
    g.fillRect(0, 0, 256, 256);
    let s = 7;
    const r = () => (s = s * 16807 % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
      g.fillStyle = ["#6a4532", "#86593f", "#5f3e2c", "#8d6447"][i % 4];
      g.beginPath();
      g.ellipse(r() * 256, r() * 256, 4 + r() * 16, 3 + r() * 8, r() * 3, 0, 7);
      g.fill();
    }
    return dirtPat = ctx.createPattern(c, "repeat");
  }
  let ePat = null, shaftC = null, dustC = null;
  function dustSprite() {
    if (dustC) return dustC;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64 - 0.3 * 64, 0, 64, 64 - 0.3 * 64, 64);
    gr.addColorStop(0, "rgba(214,180,140,.55)");
    gr.addColorStop(0.6, "rgba(170,130,95,.3)");
    gr.addColorStop(1, "rgba(150,110,80,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return dustC = c;
  }
  const litCache = {};
  function litC(k, amb) {
    if (litCache[k]) return litCache[k];
    const im = BB.V2["tun" + k];
    if (!im) return null;
    const c = document.createElement("canvas");
    c.width = 1140;
    c.height = 420;
    const g = c.getContext("2d");
    g.drawImage(im, -740, 0, 1880, 420);
    g.globalCompositeOperation = "soft-light";
    g.globalAlpha = 0.3;
    g.fillStyle = amb;
    g.fillRect(0, 0, 1140, 420);
    return litCache[k] = c;
  }
  function earthPat() {
    if (ePat) return ePat;
    const e = BB.V2.earth;
    if (!e) return dirt();
    const D = rail(4) + 200 - GY + 2e3, c = document.createElement("canvas");
    c.width = e.width;
    c.height = D;
    const g = c.getContext("2d");
    g.fillStyle = g.createPattern(e, "repeat");
    g.translate(0, -GY);
    g.fillRect(0, GY, e.width, D);
    const gr = g.createLinearGradient(0, GY, 0, rail(4) + 200);
    gr.addColorStop(0, "rgba(20,10,5,.15)");
    gr.addColorStop(1, "rgba(10,5,3,.55)");
    g.fillStyle = gr;
    g.fillRect(0, GY, e.width, D);
    const p = ctx.createPattern(c, "repeat-x");
    p.setTransform(new DOMMatrix([1, 0, 0, 1, 0, GY]));
    return ePat = p;
  }
  const howTo = {
    title: "NOTE MINE: dig up the whole notes!",
    steps: ["Watch the green beat lights.", "WARM UP: 4 claps in a row on the lights.", "Then 4 MORE claps in a row strike the rock. Miss a beat and the rock goes back to whole!", "Tougher rocks later need 6 or 8 strikes.", "Piano = soft claps. Forte = loud claps.", "No mic? Tap MANUAL OVERRIDE when they nail it."],
    words: '"ta - a - a - a" (one whole note = 4 beats)   andante = walking speed,  allegro = fast',
    example: (x, y, w, h, t) => {
      const bpm = 90, ph = t * bpm / 60, b = Math.floor(ph) % 4, f = ph % 1;
      const lit = [0, 0, 0, 0];
      lit[b] = 1 - f * 0.6;
      ctx.save();
      ctx.translate(x + w / 2, y + h - 80);
      ctx.scale(0.62, 0.62);
      BB.beatPills(0, 0, lit);
      ctx.restore();
      const stage = Math.floor(ph / 4) % 5;
      drawRock(x + w / 2, y + 170, 95, "rock", stage, f < 0.15 ? (1 - f / 0.15) * 6 : 0, 0);
      const k = f < 0.15 ? 1 : 0;
      ctx.save();
      ctx.translate(x + w - 80, y + 90);
      ctx.fillStyle = "#f2c49b";
      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 4;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.rotate(s * (k ? 0.05 : 0.45));
        ctx.beginPath();
        ctx.ellipse(s * (k ? 14 : 30), 0, 18, 34, 0, 0, 7);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      if (k) BB.text("CLAP!", 0, -60, 30, COL.yellow, { stroke: 4 });
      ctx.restore();
    }
  };
  function rockPts(r, seed) {
    let s = seed * 9301 + 49297;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const p = [];
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      p.push([r * (1 + (rnd() - 0.5) * 0.27) * Math.cos(a), r * 0.85 * (1 + (rnd() - 0.5) * 0.27) * Math.sin(a)]);
    }
    return p;
  }
  const crackPaths = [];
  {
    let s = 7;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const O = [-0.18, -0.2];
    const grow = (x, y, a, len, depth, pts0) => {
      const pts = pts0 || [[x, y]];
      let L = 0;
      while (L < len) {
        const st = 0.07 + rnd() * 0.06;
        a += (rnd() - 0.5) * 0.9;
        x += Math.cos(a) * st;
        y += Math.sin(a) * st;
        L += st;
        pts.push([x, y]);
        if (depth < 2 && rnd() < 0.28) {
          crackPaths.push({ pts: grow(x, y, a + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.5), len * 0.45, depth + 1), d: depth + 1, at: L / len });
        }
      }
      return pts;
    };
    for (let k = 0; k < 5; k++) {
      const a = k * 1.26 + 0.3 + (rnd() - 0.5) * 0.4;
      crackPaths.unshift({ pts: grow(O[0], O[1], a, 0.55 + rnd() * 0.35, 0), d: 0, at: 0 });
    }
  }
  const crackLine = (p, f, r) => {
    const n = Math.max(2, Math.ceil(p.length * f));
    ctx.beginPath();
    for (let i = 0; i < n && i < p.length; i++) ctx.lineTo(p[i][0] * r, p[i][1] * r - r * 0.05);
  };
  function drawPick(x, y, r, dt) {
    const a = dt < 0.07 ? -0.9 + 1 * (dt / 0.07) : dt < 0.35 ? 0.1 - 1 * ease.out((dt - 0.07) / 0.28) : -0.9, L = r * 1.05;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-a);
    ctx.lineJoin = "round";
    ctx.strokeStyle = COL.ink || "#1b1410";
    ctx.lineWidth = 6;
    ctx.fillStyle = "#9a6a3e";
    ctx.beginPath();
    ctx.rect(-L, -11, L, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#8f9aa3";
    ctx.beginPath();
    ctx.moveTo(-L - 6, -r * 0.55);
    ctx.quadraticCurveTo(-L + 16, 0, -L - 6, r * 0.55);
    ctx.lineTo(-L - 22, r * 0.42);
    ctx.quadraticCurveTo(-L - 4, 0, -L - 22, -r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawRock(x, y, r, kind, stage, shake, wob, o = {}) {
    const k = o.k, L = k != null ? LIGHT[k] : null;
    const img = kind === "crystal" ? "crystal" : "rock", h = r * 1.85 * (kind === "crystal" ? 1.12 : 1), base = r * 0.85;
    if (o.shadow !== false) BB.contactShadow(x, y + base, r * 1.15, 0.5);
    ctx.save();
    ctx.translate(x + Math.sin(BB.t * 60) * shake, y);
    ctx.rotate(Math.sin(BB.t * 14) * wob * 0.08);
    if (kind === "crystal") BB.glow(0, 0, r * 1.35, o.mixed ? "rgba(255,170,120,A)" : "rgba(150,220,255,A)", 0.45);
    const amb = o.mixed ? "#ff7a40" : kind === "boulder" ? "#2a2030" : L ? L.amb : null;
    BB.prop(img, 0, base, h, { shadow: false, rim: L ? L.rim : "#ffe0b0", amb, ambA: kind === "boulder" ? 0.3 : 0.16 });
    const g = 0.25 + stage * 0.18;
    BB.glow(0, -r * 0.05, r * 0.62, "rgba(255,245,190,A)", g);
    BB.wholeNote(0, -r * 0.05, r * 0.3, { fill: "#fff8d0" });
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.05, r * 0.78, r * 0.7, 0, 0, 7);
    ctx.clip();
    ctx.lineCap = "round";
    ctx.lineJoin = "miter";
    if (stage > 0) {
      const f = Math.min(1, stage / 4), lq = !BB.q, list = crackPaths.filter((c) => c.d === 0 || f > 0.45 && c.at < f * 1.3 && !(lq && c.d > 1));
      for (const c of list) {
        const g2 = c.d === 0 ? f : Math.min(1, (f - 0.45) / 0.55);
        if (g2 <= 0) continue;
        const lw = (c.d === 0 ? 7 : c.d === 1 ? 4.5 : 3) * (0.7 + 0.3 * f);
        if (!lq) {
          ctx.strokeStyle = "rgba(255,236,200,.55)";
          ctx.lineWidth = lw * 0.55;
          ctx.save();
          ctx.translate(1.8, 2.2);
          crackLine(c.pts, g2, r * 1.05);
          ctx.stroke();
          ctx.restore();
        }
        ctx.strokeStyle = "#120d0b";
        ctx.lineWidth = lw;
        crackLine(c.pts, g2, r * 1.05);
        ctx.stroke();
      }
      if (stage >= 3) {
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(BB.t * 20);
        ctx.strokeStyle = "#fff3b0";
        ctx.lineWidth = 2.5;
        for (const c of crackPaths.filter((c2) => c2.d === 0)) {
          crackLine(c.pts, f * 0.9, r * 1.05);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
    ctx.restore();
  }
  function drawCart(x, base, n) {
    const P = [[-52, -118, -0.25], [0, -122, 0.12], [52, -117, 0.3], [-26, -146, -0.08], [28, -148, 0.22], [-64, -136, 0.4], [64, -137, -0.35], [0, -172, 0.05], [-38, -166, -0.3], [38, -168, 0.28], [-14, -192, 0.18], [18, -194, -0.2]];
    const m = Math.min(n + (n > 0 ? 2 : 0), P.length);
    for (let i = 0; i < m; i++) {
      const [dx, dy, r] = P[i];
      ctx.save();
      ctx.translate(x + dx, base + dy);
      ctx.rotate(r);
      BB.R.tile("w", -40, -46, 80, 56, { shadow: i >= 3 });
      ctx.restore();
    }
    BB.prop("cart", x, base, 150, { shadowA: 0.35 });
  }
  class MineRoom {
    constructor(o = {}) {
      this.o = o;
    }
    enter() {
      BB.groove.start(96, "mine");
      Object.assign(this, {
        cam: { x: 960, y: 540, z: 1 },
        count: 0,
        binCount: 0,
        lit: [0, 0, 0, 0, 0],
        pipeGlow: 0,
        elevY: GY,
        botX: 1960,
        botOnElev: true,
        jr: { x: 1650, y: GY, vis: true, mode: "munch" },
        rockI: 0,
        state: "intro",
        st: 0,
        beat: null,
        flying: [],
        pipeNotes: [],
        stage: 0,
        wob: 0,
        shk: 0,
        hatch: 0,
        btnPress: 0,
        sprCheer: 0,
        said: {},
        prank: null,
        cardT: -9,
        lastOverride: -9,
        doneT: 0,
        marks: [0, 0, 0, 0],
        dust: []
      });
      this.introT0 = BB.t;
      for (let i = 0; i < 40; i++) this.dust.push({ x: Math.random() * W, y: Math.random() * H, s: 1 + Math.random() * 3, v: 5 + Math.random() * 12 });
      if (this.o.skipIntro || this.o.startAt) {
        this.skipIntro(this.o.startAt || 0);
      }
    }
    exit() {
      this.beat = null;
    }
    // -------- intro timeline (~32 s) --------
    skipIntro(at = 0) {
      this.rockI = at;
      this.count = Math.min(8, at);
      this.binCount = this.count;
      this.lit = [1, 1, 1, 1, 1];
      this.pipeGlow = 1;
      this.jr.vis = false;
      const f = ROCKS[at].f;
      this.elevY = rail(f);
      this.cam = { x: 2400, y: camY(f), z: 1 };
      this.botOnElev = false;
      this.botX = BOT_X;
      this.hatch = 0;
      this.beginRock(true);
    }
    intro(t, dt) {
      const c = this.cam, ev = (k, fn) => {
        if (!this.said[k] && t >= +k.split("@")[1]) {
          this.said[k] = 1;
          fn();
        }
      };
      if (t < 6) {
        c.x = lerp(960, 2400, ease.inOut(clamp(t / 6, 0, 1)));
        c.y = 540;
        c.z = 1;
      }
      ev("alarm@.2", () => BB.sfx.alarm());
      ev("nom@6.2", () => BB.say("jr_nom"));
      ev("burp@8.5", () => {
        BB.sfx.burp();
        this.jr.mode = "burp";
        this.burpT = BB.t;
        BB.shake(3);
      });
      ev("gig@9.8", () => {
        BB.say("jr_giggle");
        BB.sfx.glitch();
        this.jr.mode = "giggle";
      });
      ev("run@11.4", () => {
        this.jr.mode = "run";
        BB.sfx.whoosh();
      });
      if (this.jr.mode === "run") {
        this.jr.x = Math.min(2098, this.jr.x + dt * 520);
        if (this.jr.x >= 2098) {
          this.jr.mode = "dive";
          this.jr.vy = -700;
          BB.sfx.clunk();
          this.hatch = 1;
        }
      }
      if (this.jr.mode === "dive") {
        this.jr.vy += 2200 * dt;
        this.jr.y += this.jr.vy * dt;
        this.jr.rot = (this.jr.rot || 0) + dt * 8;
        if (this.jr.y > GY + 700) {
          this.jr.vis = false;
          this.jr.mode = "gone";
        }
      }
      if (this.jr.mode === "gone") this.hatch = Math.max(0, this.hatch - dt * 1.5);
      ev("ohno@13.4", () => {
        BB.say("oh_no");
        this.sprCheer = -1;
      });
      ev("ateall@16.3", () => {
        BB.say("ate_all");
        this.sprCheer = 1;
      });
      ev("btn@20.6", () => {
        this.btnPress = BB.t;
        BB.sfx.clunk();
        BB.sfx.motor(BB.ac.currentTime, 4.4);
        this.sprCheer = 0;
      });
      if (t > 20.6 && t < 24) {
        const k = ease.inOut(clamp((t - 20.6) / 3.2, 0, 1));
        c.z = lerp(1, 0.29, k);
        c.y = lerp(540, 1880, k);
        c.x = 2400;
      }
      if (t > 21) {
        this.elevY = lerp(GY, rail(0), ease.inOut(clamp((t - 21) / 4, 0, 1)));
      }
      for (let k = 0; k < 5; k++) ev("lit".concat(k, "@").concat(23.6 + k * 0.8), () => {
        BB.sfx.clunk();
        BB.shake(2);
        this.litT = BB.t;
      });
      for (let k = 0; k < 5; k++) if (t > 23.6 + k * 0.8) this.lit[k] = Math.min(1, this.lit[k] + dt * 4);
      if (t > 27.6) this.pipeGlow = Math.min(1, (t - 27.6) / 1.2);
      ev("pipe@27.6", () => BB.sfx.whoosh(BB.ac.currentTime, 1.2));
      if (t > 28.8 && t < 31.2) {
        const k = ease.inOut(clamp((t - 28.8) / 2.4, 0, 1));
        c.z = lerp(0.29, 1, k);
        c.y = lerp(1880, camY(0), k);
      }
      if (t > 27.5 && this.botOnElev) {
      }
      if (t >= 31.2) {
        this.botOnElev = false;
        this.botWalk = BB.t;
        this.beginRock(true);
      }
    }
    // -------- rock flow --------
    beginRock(first) {
      const R = ROCKS[this.rockI];
      this.R = R;
      if (strikesFor(R) > 4 && !R.bonus && !(this.said || {})["st" + R.st]) {
        (this.said = this.said || {})["st" + R.st] = 1;
        setTimeout(() => BB.scene === this && BB.say("mn_more", { overlap: true }), 5200);
      }
      this.stage = 0;
      this.state = "drop";
      this.st = BB.t;
      this.rockY = -400;
      this.marks = [0, 0, 0, 0];
      this.missVO = false;
      const newFloor = first || ROCKS[this.rockI - 1] && ROCKS[this.rockI - 1].f !== R.f;
      if (newFloor) {
        this.cardT = BB.t;
        this.prewarm(R.f);
        if (ROCKS[this.rockI + 2]) this.prewarm(ROCKS[this.rockI + 2].f);
        if (R.f === 4) {
          this.startCave();
        }
        this.voEnd = BB.t + 9;
        setTimeout(() => {
          if (BB.scene === this) this.voEnd = BB.t + BB.say(FLOORS[R.f].vo);
        }, R.f === 4 ? 3e3 : first ? 2200 : 300);
      } else this.voEnd = BB.t + 0.5;
      if (R.bonus && !newFloor) {
        this.voEnd = BB.t + 0.5;
        BB.caption = { txt: "BONUS! Andante + forte: slow and LOUD!", who: "sprocket", until: BB.t + 3.5, start: BB.t };
      }
    }
    // ---- cave-in event: painted rocks crash down and pile up in the tunnel; clearing both bonus rocks digs it out ----
    // build per-floor caches up front so the first frames of a floor don't stall (tinted props, baked layers, dust sprite)
    prewarm(k) {
      const L = LIGHT[k];
      earthPat();
      dustSprite();
      litC(k, L.amb);
      for (const [n, a, amb] of [["rock", 0.22, L.amb], ["rock", 0.16, L.amb], ["rock", 0.16, "#ff7a40"], ["rock", 0.3, "#2a2030"], ["crystal", 0.16, L.amb], ["crystal", 0.16, "#ff7a40"], ["rubble", 0.2, L.amb], ["funnel", 0.12, L.amb]]) BB.tinted(n, n === "rock" || n === "crystal" ? k === 4 && amb === "#ff7a40" ? L.rim : L.rim : L.rim, amb, a);
    }
    startCave() {
      this.caveT = BB.t;
      this.caveCleared = 0;
      this.caveDust = [];
      BB.sfx.rumble(BB.ac.currentTime, 2.6);
      BB.shake(8);
      const y = top(4);
      this.caveRocks = [[2560, 0.15, 95, 0.4], [3240, 0.3, 120, -0.6], [2700, 0.45, 80, 1.2], [3080, 0.55, 140, 0.2], [2930, 0.7, 105, -1], [3300, 0.85, 90, 0.9], [2620, 1, 70, -0.3], [3150, 1.15, 85, 0.7]].map(([x, d, h, r]) => ({ x, d, h, r, y0: y + 20, landed: 0 }));
      BB.caption = { txt: "Cave-in! Clear it with rhythm!", who: "sprocket", until: BB.t + 2.8, start: BB.t };
    }
    updCave() {
      if (!this.caveRocks) return;
      const t = BB.t - this.caveT;
      for (const r of this.caveRocks) {
        if (!r.landed && t > r.d + 0.55) {
          r.landed = 1;
          BB.shake(4);
          BB.sfx.clunk();
          if (BB.q) this.caveDust.push({ x: r.x, y: rail(4) - 10, t: BB.t, r: r.h * 1.3 }, { x: r.x + r.h * 0.6, y: rail(4) - 30, t: BB.t + 0.08, r: r.h }, { x: r.x - r.h * 0.6, y: rail(4) - 20, t: BB.t + 0.12, r: r.h * 0.9 });
          else this.caveDust.push({ x: r.x, y: rail(4) - 10, t: BB.t, r: r.h * 1.6 });
        }
      }
      this.caveDust = this.caveDust.filter((d) => BB.t - d.t < 1.6);
    }
    pileSettled() {
      return this.caveRocks && BB.t - this.caveT > 2.2 && (!this.caveClearT || BB.t - this.caveClearT > 0.85);
    }
    drawCave(k, bakeOnly) {
      if (k !== 4 || !this.caveRocks) return;
      const settled = this.pileSettled();
      if (bakeOnly && !settled) return;
      if (!bakeOnly && settled && this._stat) {
        this.drawDust();
        return;
      }
      const t = BB.t - this.caveT, y = top(4), L = LIGHT[4], B = TBOX(4), keep = 1 - (this.caveCleared || 0) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(1460, y, 1880, 420, 70);
      ctx.clip();
      if (t < 1.8) {
        ctx.globalAlpha = 1 - t / 1.8;
        ctx.strokeStyle = "rgba(20,10,4,.8)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(2540, y + 40);
        ctx.lineTo(2700, y + 62);
        ctx.lineTo(2820, y + 48);
        ctx.lineTo(3e3, y + 70);
        ctx.lineTo(3180, y + 52);
        ctx.lineTo(3320, y + 66);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const cl = this.caveClearT ? clamp((BB.t - this.caveClearT) / 0.8, 0, 1) : 0;
      this.caveRocks.forEach((r, i) => {
        if (i >= Math.ceil(this.caveRocks.length * keep) && !(cl < 1 && i < Math.ceil(this.caveRocks.length * (keep + 0.5)))) return;
        const ft = clamp((t - r.d) / 0.55, 0, 1), yy = lerp(r.y0 + r.h, rail(4) + 8, ft * ft);
        if (t < r.d) return;
        const leaving = i >= Math.ceil(this.caveRocks.length * keep);
        const a = leaving ? 1 - cl : 1;
        if (a <= 0) return;
        if (ft >= 1) BB.contactShadow(r.x, rail(4) + 6, r.h * 0.6, 0.45 * a);
        ctx.globalAlpha = a;
        BB.prop("rock", r.x, yy - (leaving ? cl * 60 : 0), r.h, { box: B, rim: L.rim, amb: L.amb, ambA: 0.22, shadow: false, rot: r.r * (1 - ft * 0.6) });
        ctx.globalAlpha = 1;
      });
      if (!bakeOnly) {
        ctx.restore();
        this.drawDust();
      } else ctx.restore();
    }
    drawDust() {
      if (!this.caveDust.length) return;
      const y = top(4);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(1460, y, 1880, 420, 70);
      ctx.clip();
      const ds = dustSprite();
      for (const d of this.caveDust) {
        const dt = BB.t - d.t;
        if (dt < 0) continue;
        const k2 = dt / 1.6, rr = d.r * (0.5 + k2 * 1.2);
        ctx.globalAlpha = 1 - k2;
        ctx.drawImage(ds, d.x - rr, d.y - rr * 1.3, rr * 2, rr * 2);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    startBeat() {
      const R = this.R, spb = 60 / R.bpm;
      let vo = 0;
      if (!this.said.ready) {
        this.said.ready = 1;
        vo = BB.say("ready") || 0;
      }
      const t0 = BB.ac.currentTime + 0.25 + vo;
      this.beat = { spb, t0, next: 0, evalM: 1, hits: {}, sim: 0 };
      this.warm = 0;
      this.warmLast = -9;
      this.strikes = 0;
      BB.groove.sync(t0, spb);
    }
    beatNow() {
      const b = this.beat;
      return b ? (BB.ac.currentTime - b.t0) / b.spb : 0;
    }
    scheduleTicks() {
      const b = this.beat, ahead = BB.ac.currentTime + 0.12;
      while (b.t0 + b.next * b.spb < ahead) {
        const t = b.t0 + b.next * b.spb;
        BB.sfx.tick(t, b.next % 4 === 0, this.R.dyn === "p" ? 0.6 : 1);
        if (BB.debug && Math.random() < 0.92) {
          const lvl = this.R.dyn === "p" ? 0.45 : this.R.dyn === "f" ? 0.9 : 0.7;
          setTimeout(() => BB.simClap(t + (Math.random() - 0.5) * 0.08, lvl), Math.max(0, (t - BB.ac.currentTime) * 1e3 + 30));
        }
        b.next++;
      }
    }
    // v13.2 auto latency: median offset of near-beat onsets nudges GroupGate.lat (kept within +-.08 s of the mic-setup value)
    autoLat(dt) {
      const G = window.GroupGate, a = this._dts = this._dts || [];
      a.push(dt);
      if (a.length > 16) a.shift();
      if (a.length < 6 || a.length % 2) return;
      const m = a.slice().sort((x, y) => x - y)[a.length >> 1], TL = window.ClapDet && ClapDet.TickLat, tb = TL && TL.heard(BB.ac.currentTime) ? Math.max(0, TL.lat - G.LAT_BASE) : null, tg = Math.min(0.25, Math.max(tb != null ? tb - 0.03 : 0, Math.min(tb != null ? tb + 0.12 : 1, m)));
      if (Math.abs(tg - G.lat) > 0.015) G.lat += (tg - G.lat) * 0.5;
    }
    handleOnsets() {
      const b = this.beat, ons = BB.mic.take();
      if (!b || this.state !== "dig" && this.state !== "count") return;
      if (window.ClapDet && ClapDet.expect) ClapDet.expect(b.spb, BB.ac.currentTime + 0.5);
      if (BB.MLP && BB.MLP.on) BB.MLP.openWin("mine", b.t0 - 0.12, BB.ac.currentTime + 0.3);
      if (this.R.dyn) BB.dynMode = BB.t;
      if (this.R.dyn === "p") {
        BB.softClap = BB.t;
        if (b.spb < 0.5) BB.fastSoft = BB.t;
      }
      const G = window.GroupGate, tol = G ? G.tol(b.spb) : Math.min(0.17, b.spb * 0.4);
      for (const o of ons) {
        if (BB.talking && BB.t < BB.talking.until && !BB.debug) continue;
        const bi = Math.round((o.t - b.t0 - (G ? G.lat : 0)) / b.spb), dt = o.t - (b.t0 + bi * b.spb), inT = G ? G.inTol(dt, b.spb) : Math.abs(dt) <= tol;
        if (G && bi >= 4 && !o.up && dt > -0.1 && dt < 0.3) this.autoLat(dt);
        if (bi >= 4 && !inT) {
          if (this.gated() && !o.up && (this._dts || []).length >= 8 && G.isStray(dt, b.spb)) (b.strays = b.strays || []).push(o.t);
          continue;
        }
        if (bi < 4 && this.state !== "count" || bi < 0 || !inT || b.hits[bi] || b.pend && b.pend[bi]) continue;
        const d = this.R.dyn;
        if (d === "p" && o.lvl > Math.min(0.95, SOFT_MAX * 1.3)) {
          this.tooLoud = BB.t;
          BB.sfx.wobble();
          BB.burst(ROCK_X, rail(this.R.f) - 170, 14, { world: 1, cols: ["#cfefff", "#fff", "#9fe0ff"], kind: "star", size: 9, g: 200, speed: 300 });
          continue;
        }
        if (d === "f" && !(G && o.rms ? G.isLoud(o.rms, G.sensMul || 1) : o.lvl >= LOUD_MIN)) {
          this.tooSoft = BB.t;
          BB.burst(ROCK_X - 120, rail(this.R.f) - 150, 6, { world: 1, col: "#b9a58c", kind: "dust", size: 16, g: -40, speed: 120 });
          continue;
        }
        if (this.gated() && !o.sim) {
          (b.pend = b.pend || {})[bi] = 1;
          continue;
        }
        if (this.state === "count") this.warmClap(bi);
        else this.hit(bi);
      }
    }
    gated() {
      return BB.mic.ok && window.GroupGate && !BB.debug;
    }
    hit(bi) {
      const b = this.beat, d = this.R.dyn;
      b.hits[bi] = 1;
      this.marks[bi % 4] = 0.01;
      this.hitT = BB.t;
      this.swingT = BB.t;
      this.strikes++;
      {
        const n = strikesFor(this.R), st = Math.floor(this.strikes * NEED / n + 1e-9);
        while (this.stage < st && this.stage < NEED) this.crack(1);
      }
      if (d === "p" && b.spb < 0.5) BB.sfx.tink(void 0, 0.3, true);
      else BB.sfx.tink();
      if (d === "f") {
        BB.sfx.boom();
        BB.shake(5);
      }
      BB.burst(ROCK_X - 140, rail(this.R.f) - 170, 12, { world: 1, cols: ["#ffe066", "#fff", "#ffb040"], speed: 600, size: 12 });
    }
    resolveGroup() {
      const b = this.beat, G = window.GroupGate;
      if (!b || !G) return;
      const now = BB.ac.currentTime - 0.02;
      if (b.strays) b.strays = b.strays.filter((t) => {
        if (now < t + 0.12) return true;
        G.stray(t);
        return false;
      });
      if (b.pend) for (const k in b.pend) {
        if (this.beat !== b) return;
        const bi = +k, tc = b.t0 + bi * b.spb;
        if (now < tc + G.lat + Math.max(G.W1, G.win(b.spb)[1]) + 0.02) continue;
        delete b.pend[k];
        const m = G.judge(tc, this.R.dyn === "p", b.spb);
        if (m.ok && this.state === "count") this.warmClap(bi);
        else if (m.ok && this.state === "dig") this.hit(bi);
        else {
          this.fewHands = BB.t;
          if (this.state === "count") this.warm = 0;
        }
      }
    }
    // v13.2 warm-up: the first FOUR claps in a row on the beat are the count-in; then every on-beat clap is a pickaxe strike
    warmClap(bi) {
      const b = this.beat;
      b.hits[bi] = 1;
      this.warm = bi === this.warmLast + 1 ? this.warm + 1 : 1;
      this.warmLast = bi;
      this.marks = [0, 0, 0, 0];
      for (let i = 0; i < this.warm; i++) this.marks[(bi - i) % 4] = 0.01;
      if (this.warm >= WARM) {
        this.state = "dig";
        this.marks = [0, 0, 0, 0];
        b.evalM = Math.floor(bi / 4) + 1;
        this.warmEnd = bi;
        b.chk = bi + 1;
      }
    }
    evalMeasures() {
      const b = this.beat;
      this.resolveGroup();
      if (this.state !== "dig") return;
      this.streakCheck();
      const tol = window.GroupGate ? GroupGate.tol(b.spb) : 0.17;
      while (BB.ac.currentTime > b.t0 + (b.evalM * 4 + 3) * b.spb + Math.max(tol, 0.2) + 0.03 + (window.GroupGate ? GroupGate.lat + 0.03 : 0)) {
        const m = b.evalM;
        let n = 0;
        for (let i = 0; i < 4; i++) if (b.hits[m * 4 + i]) n++;
        b.evalM++;
        this.marks = [0, 0, 0, 0];
        if (m <= (this.warmEnd != null ? Math.floor(this.warmEnd / 4) : 0)) continue;
        if (n >= 2) {
        } else {
          const talking = BB.talking && BB.t < BB.talking.until;
          if (talking && !BB.debug) continue;
          this.wob = 1;
          BB.sfx.wobble();
          this.shrugT = BB.t;
          BB.burst(ROCK_X, rail(this.R.f) - 60, 10, { world: 1, col: "#c8b49a", kind: "dust", size: 18, g: -60, speed: 160 });
          if (!this.missVO && n < 2) {
            this.missVO = true;
            BB.say("keepgoing");
          }
        }
      }
    }
    // v14.0 rule: after the warm-up, strikes must be CONSECUTIVE beats; miss one and the rock goes back to whole
    streakCheck() {
      const b = this.beat, G = window.GroupGate;
      if (!b || b.chk == null) return;
      const close = (G ? G.lat + Math.max(G.W1, G.win(b.spb)[1]) : 0.2) + 0.06;
      while (this.beat === b && this.state === "dig" && BB.ac.currentTime > b.t0 + b.chk * b.spb + close) {
        const bi = b.chk++;
        if (b.hits[bi] || b.pend && b.pend[bi]) continue;
        if (BB.talking && BB.t < BB.talking.until && !BB.debug || this.ovPop && BB.t - this.ovPop < 1) continue;
        if (this.strikes > 0) {
          this.strikes = 0;
          this.stage = 0;
          this.healT = BB.t;
          BB.sfx.wobble();
          this.wob = 1;
          BB.burst(ROCK_X, rail(this.R.f) - 120, 10, { world: 1, col: "#c8b49a", kind: "dust", size: 18, g: -60, speed: 160 });
          if (!this.missVO) {
            this.missVO = true;
            BB.say("keepgoing");
          }
        }
      }
    }
    crack(one) {
      const R = this.R;
      this.stage += one ? 1 : R.bonus ? 2 : 1;
      BB.sfx.crack();
      BB.shake(4);
      this.shk = 1;
      {
        const ix = ROCK_X - 30, iy = rail(R.f) - 170, lq = !BB.q;
        BB.burst(ix, iy, lq ? 8 : 18, { world: 1, cols: ["#a08c78", "#6e5a4a", "#cbb79c"], speed: 520, size: 10, kind: "dot" });
        if (!lq) BB.burst(ix, iy, 10, { world: 1, cols: ["rgba(210,190,160,.5)"], speed: 160, size: 22, kind: "dot", g: -40 });
      }
      if (this.stage >= NEED) this.popNote();
    }
    popNote() {
      const R = this.R;
      BB.burst(ROCK_X, rail(R.f) - 140, BB.q ? 14 : 6, { world: 1, cols: ["#8c7764", "#5e4c3e", "#a8957f"], speed: 700, size: 30, kind: "dot", g: 900 });
      this.state = "pop";
      this.st = BB.t;
      this.beat = null;
      BB.sfx.chime();
      BB.sfx.pop();
      BB.shake(6);
      BB.burst(ROCK_X, rail(R.f) - 150, 40, { world: 1, cols: ["#ffe066", "#fff", "#6ee678"], speed: 800, size: 14, kind: "star", g: 500 });
      this.halves = { t: BB.t };
      this.flying.push({ t0: BB.t, x0: ROCK_X, y0: rail(R.f) - 150, x1: PIPE_X, y1: rail(R.f) - 120, gold: !!R.bonus, f: R.f });
      if (this.rockI === 0) setTimeout(() => BB.scene === this && BB.say("got_note"), 500);
      if (R.f === 4 && this.caveRocks) {
        this.caveCleared = (this.caveCleared || 0) + 1;
        this.caveClearT = BB.t;
        if (this.caveCleared >= 2 && !this.chipFly) {
          const c = this.cam;
          this.chipFly = { t: BB.t + 0.3, x0: (ROCK_X - c.x) * c.z + W / 2, y0: (rail(4) - 160 - c.y) * c.z + H / 2 };
          BB.caption = { txt: "Cave-in cleared! You earned a Level 4 Beat Chip piece!", who: "sprocket", until: BB.t + 3, start: BB.t };
        }
      }
    }
    manualOverride() {
      if (BB.t - this.lastOverride < 0.5) return;
      this.lastOverride = BB.t;
      this.ovPop = BB.t;
      if (this.state === "dig" || this.state === "count") {
        this.marks = [1, 1, 1, 1];
        if (this.state === "count") {
          this.state = "dig";
          this.beat.evalM = Math.max(1, Math.ceil(this.beatNow() / 4));
        }
        this.beat.evalM = Math.max(this.beat.evalM, Math.ceil(this.beatNow() / 4));
        this.strikes = Math.max(this.strikes || 0, Math.ceil((this.stage + (this.R.bonus ? 2 : 1)) * strikesFor(this.R) / NEED));
        this.crack();
      }
    }
    pause() {
      BB.paused = true;
      BB.ac.suspend();
    }
    resume() {
      BB.paused = false;
      BB.ensureMic();
    }
    update(dt) {
      const t = BB.t;
      if (BB.keys.includes(" ")) this.manualOverride();
      if (BB.keys.includes("p")) {
        this.pause();
        return;
      }
      if (this.state === "intro") {
        this.intro(t - this.introT0, dt);
        if (BB.keys.includes("s")) this.skipIntro();
      }
      if (this.introT0 === void 0) this.introT0 = t;
      this.wob = Math.max(0, this.wob - dt * 1.5);
      this.shk = Math.max(0, this.shk - dt * 3);
      for (let i = 0; i < 4; i++) if (this.marks[i]) this.marks[i] = Math.min(1, this.marks[i] + dt * 5);
      if (this.botWalk !== void 0 && !this.botRoll) this.rollBot(1960, BOT_X, 1.4, t);
      this.botWalk = void 0;
      if (this.botRoll) {
        const r = this.botRoll, k = clamp((t - r.t) / r.dur, 0, 1);
        this.botX = lerp(r.from, r.to, ease.inOut(k));
        r.k = k;
        if (k >= 1) this.botRoll = null;
      }
      if (this.state === "drop") {
        const k = clamp((t - this.st) / 0.9, 0, 1);
        this.rockY = lerp(-400, 0, ease.out(k));
        if (k >= 1 && !this.landed) {
          this.landed = 1;
          BB.sfx.clunk();
          BB.shake(4);
        }
        if (k >= 1 && t > this.voEnd && this.lcWant && !this.lc) {
          this.lcWant = 0;
          if (BB.mic.ok) this.lc = new BB.LoudCal(() => {
            this.lc = null;
            this.voEnd = BB.t + 0.3;
          });
        }
        if (this.lc) this.lc.update();
        if (k >= 1 && t > this.voEnd && !this.lc && !this.lcWant) {
          this.landed = 0;
          this.state = "count";
          this.startBeat();
        }
      }
      if (this.beat) {
        this.scheduleTicks();
        if (this.state === "count" && this.beatNow() >= 3.6 && !(BB.mic.ok && window.GroupGate)) {
          this.state = "dig";
          this.warmEnd = 3;
        }
        this.handleOnsets();
        this.evalMeasures();
      } else BB.mic.take();
      this.updCave();
      if (this.chipFly && !this.chipFly.done && BB.t - this.chipFly.t > 1.4) {
        this.chipFly.done = 1;
        this.chip = 1;
        this.chipPop = BB.t;
        BB.sfx.ding();
        BB.sfx.chime();
      }
      if (this.state === "pop" && t - this.st > 2.4) {
        this.rockI++;
        if (this.rockI >= ROCKS.length) this.finish();
        else this.beginRock(false);
      }
      if (this.R && this.state !== "intro" && this.state !== "end") {
        const ty = rail(this.R.f);
        if (Math.abs(this.elevY - ty) > 1) {
          if (!this.moving) {
            if (this.botRoll) return this.updTail(dt);
            if (Math.abs(this.botX - 1960) > 2) {
              this.rollBot(this.botX, 1960, 1.1);
              return this.updTail(dt);
            }
            this.moving = 1;
            BB.sfx.motor(BB.ac.currentTime, 1.8);
            this.botOnElev = true;
          }
          this.elevY = Math.min(ty, this.elevY + dt * 340);
          this.cam.y = Math.min(camY(this.R.f), this.elevY - 140);
          if (this.state === "drop") this.st = t;
        } else if (this.moving) {
          this.moving = 0;
          this.botOnElev = false;
          this.rollBot(1960, BOT_X, 1.4);
          this.cam.y = camY(this.R.f);
        }
      }
      this.updTail(dt);
    }
    updTail(dt) {
      const t = BB.t;
      for (let i = this.flying.length - 1; i >= 0; i--) {
        const n = this.flying[i];
        if (t - n.t0 > 1.1) {
          this.flying.splice(i, 1);
          this.pipeNotes.push({ y: n.y1, gold: n.gold });
          if (!n.gold) this.count++;
          BB.sfx.ding();
          this.meterPop = t;
        }
      }
      for (let i = this.pipeNotes.length - 1; i >= 0; i--) {
        const p = this.pipeNotes[i];
        p.y -= dt * 1100;
        if (p.y < GY - 120) {
          this.pipeNotes.splice(i, 1);
          this.binCount++;
        }
      }
      if (this.R && this.R.prank && this.state === "dig" && !this.prank && this.beat && this.beatNow() > 8 && !(this.R.f === 4 && BB.t - (this.caveT || -99) < 9)) this.startPrank();
      if (this.prank) this.updPrank(dt);
      if (this.state === "end") this.updEnd(dt);
      for (const d of this.dust) {
        d.y -= d.v * dt;
        d.x += Math.sin(t * 0.5 + d.s) * 6 * dt;
        if (d.y < -10) {
          d.y = H + 10;
          d.x = Math.random() * W;
        }
      }
    }
    startPrank() {
      this.prank = { t: BB.t, x: 3400, ph: "in" };
      BB.sfx.glitch();
      setTimeout(() => {
        if (BB.scene === this) BB.say("jr_giggle", { overlap: true });
      }, 500);
    }
    updPrank(dt) {
      const p = this.prank, t = BB.t - p.t;
      if (p.ph === "in") {
        p.x = lerp(3400, 3060, ease.out(clamp(t / 0.9, 0, 1)));
        if (t > 1) {
          p.ph = "throw";
          p.t2 = BB.t;
          this.pebbleT = BB.t;
          BB.say("pebbles", { nocap: false });
        }
      }
      if (p.ph === "throw") {
        const tt = BB.t - p.t2;
        this.wob = Math.max(this.wob, 0.9);
        if (Math.random() < dt * 14) {
          BB.sfx.pebble();
          this.pebbles = this.pebbles || [];
          this.pebbles.push({ x: 780 + Math.random() * 360, y: H - 260, vy: -200, vx: (Math.random() - 0.5) * 200 });
        }
        if (tt > 3.2) {
          p.ph = "bonk";
          p.t3 = BB.t;
          BB.sfx.bonk();
          BB.say("jr_oof", { overlap: true, nocap: true });
          BB.burst(p.x, rail(this.R.f) - 200, 10, { world: 1, col: COL.yellow, kind: "star", size: 14, g: 300 });
        }
      }
      if (p.ph === "bonk") {
        const tt = BB.t - p.t3;
        if (tt > 1.4) {
          p.ph = "out";
        }
      }
      if (p.ph === "out") {
        p.x += dt * 900;
        if (p.x > 3500) p.ph = "done";
      }
      if (this.pebbles) for (const q of this.pebbles) {
        q.vy += 1600 * dt;
        q.y += q.vy * dt;
        q.x += q.vx * dt;
        if (q.y > H - 70 && q.vy > 0) {
          q.vy *= -0.4;
          q.y = H - 70;
        }
      }
      if (this.pebbles) this.pebbles = this.pebbles.filter((q) => Math.abs(q.vy) > 40 || q.y < H - 75);
    }
    rollBot(from, to, dur, t = BB.t) {
      this.botRoll = { from, to, dur, t, k: 0 };
      BB.sfx.motor && BB.sfx.motor(BB.ac.currentTime, dur * 0.6);
    }
    botRolling() {
      return !!this.botRoll;
    }
    // in the shaft (on the lift) the bot is drawn with the cage; size eases 300 -> 250 as it rolls in so it fits the car
    botOnLift() {
      return this.botX < SHAFT[1] - 10 || this.state === "end" && this.endRide >= 1;
    }
    drawBot(y, sw, o = {}) {
      const k = clamp((BOT_X - this.botX) / (BOT_X - 1960), 0, 1), sz = lerp(300, 250, ease.inOut(k)), r = this.botRoll;
      const bob = r && r.k < 1 ? Math.abs(Math.sin(r.k * Math.PI * 6)) * 6 : 0;
      BB.contactShadow(this.botX, y, sz * 0.42, 0.35);
      BB.pickbot(this.botX, y - bob, sz, r && r.k < 1 ? 0.25 : sw, r && r.k < 1 ? { squash: bob * 6e-3 } : o);
    }
    finish() {
      this.state = "end";
      this.st = BB.t;
      this.botOnElev = true;
      this.rollBot(this.botX, 1960, 1.1);
      this.endSaid = 0;
      this.endRide = 0;
    }
    updEnd(dt) {
      const t = BB.t - this.st, c = this.cam;
      const E0 = 1.2;
      if (t > E0 && !this.endRide) {
        this.endRide = 1;
        BB.sfx.motor(BB.ac.currentTime, 4);
      }
      if (t > E0 + 4.1 && this.endRide === 1) {
        this.endRide = 2;
        this.rollBot(1960, 2330, 1.2);
      }
      this.elevY = lerp(rail(4), GY, ease.inOut(clamp((t - E0) / 4, 0, 1)));
      c.z = lerp(1, 0.62, ease.inOut(clamp(t / 1.5, 0, 1)));
      if (t > 4.8) c.z = lerp(0.62, 1, ease.inOut(clamp((t - 4.8) / 1.5, 0, 1)));
      c.y = t < 5.2 ? this.elevY - 60 : lerp(GY - 60, 540, ease.inOut(clamp((t - 5.2) / 1.2, 0, 1)));
      c.x = 2400;
      if (t > 5.6 && !this.endSaid) {
        this.endSaid = 1;
        BB.say("complete");
        BB.celebrate({ next: "NOTE SMASHER" });
        this.sprCheer = 1;
        BB.burst(W / 2, 300, 60, { cols: ["#ffe066", "#6ee678", "#fff", "#e65046", "#5ac8fa"], kind: "star", size: 16, speed: 900, g: 600, life: 2 });
      }
      if (t > 6.6 && !this.saved) {
        this.saved = 1;
        if (!BB.save.done.includes("mine")) {
          BB.save.done.push("mine");
          localStorage.setItem("bb4", JSON.stringify(BB.save));
        }
      }
    }
    // ================= drawing =================
    draw() {
      const c = this.cam, [sx, sy] = BB.shakeXY;
      ctx.save();
      ctx.translate(W / 2 + sx, H / 2 + sy);
      ctx.scale(c.z, c.z);
      ctx.translate(-c.x, -c.y);
      this.drawWorld();
      BB.drawParts(1);
      ctx.restore();
      if (c.y > GY && BB.q) {
        ctx.fillStyle = "rgba(255,240,200,.35)";
        for (const d of this.dust) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.s, 0, 7);
          ctx.fill();
        }
      }
      BB.drawParts();
      if (this.state === "intro") this.drawIntroHUD();
      else if (this.state !== "end") this.drawHUD();
      if (this.lc) this.lc.draw(W / 2, 330);
      BB.captionBox();
      if (this.state !== "intro") this.drawChipFly();
      if (this.R && BB.t - this.cardT < 2.4 && this.state !== "end") {
        const F = FLOORS[this.R.f];
        BB.titleCard(this.rockI === 0 ? "ROOM 1: NOTE MINE" : F.name, this.rockI === 0 ? "Static Jr. ate the whole notes. Dig them back up!" : F.mean, (BB.t - this.cardT) / 2.4);
      }
      if (this.state === "end") this.drawEnd();
      if (BB.paused) BB.pauseOverlay(howTo, () => this.resume());
    }
    drawWorld() {
      const c = this.cam, t = BB.t;
      const vx0 = c.x - W / 2 / c.z - 50, vx1 = c.x + W / 2 / c.z + 50, vy0 = c.y - H / 2 / c.z - 50, vy1 = c.y + H / 2 / c.z + 50;
      if (vy0 < GY) {
        const g = ctx.createLinearGradient(0, 0, 0, GY);
        g.addColorStop(0, "#9ccfe6");
        g.addColorStop(1, "#c7e3ee");
        ctx.fillStyle = g;
        ctx.fillRect(vx0, Math.min(vy0, 0), vx1 - vx0, GY - Math.min(vy0, 0));
        this.drawWarehouse(vx0, vx1);
      }
      this._ug = 0;
      if (!BB.q && vy1 > GY && BB.V2.shaft) {
        const U = this.ugBake();
        if (U) {
          this._ug = 1;
          this._stat = 0;
          const S = U.S, y0 = Math.max(GY, vy0), y1 = Math.min(U.Y1, vy1), x0 = Math.max(U.XA, vx0), x1 = Math.min(U.X1, vx1);
          if (y1 > y0 && x1 > x0) ctx.drawImage(U.c, (x0 - U.XA) * S, (y0 - GY) * S, (x1 - x0) * S, (y1 - y0) * S, x0, y0, x1 - x0, y1 - y0);
          for (let k = 0; k < 5; k++) {
            const y = top(k), l = this.lit[k];
            if (y > vy1 || y + 420 < vy0 || l >= 1) continue;
            ctx.fillStyle = "rgba(10,6,4,".concat(0.78 * (1 - l), ")");
            ctx.beginPath();
            ctx.roundRect(1460, y, 1880, 420, 70);
            ctx.fill();
          }
          for (let k = 0; k < 5; k++) {
            const y = top(k);
            if (y > vy1 || y + 420 < vy0) continue;
            this.drawTunnel(k);
          }
          this.drawPipe();
          this.drawRest(vx0, vx1, vy0, vy1);
          return;
        }
      }
      const key = [c.x, c.y, c.z, ...this.lit].map((v) => v.toFixed(3)).join() + (this.pileSettled() ? "p" + this.caveCleared : "") + (vy0 < GY ? "w" : "") + BB.dpr + ctx.canvas.width;
      if (vy1 > GY && key === this._sk && BB.statCache !== false) {
        this._built = 0;
        if (this._skB !== key) {
          this._skB = key;
          this.buildStatic(vx0, vx1, vy0, vy1);
        }
        if (!this._built) {
          const [sx, sy] = BB.shakeXY, M = ctx.getTransform(), k0 = M.a / this.cam.z;
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(this._sc, sx * k0 - this._sxy[0] * k0, sy * k0 - this._sxy[1] * k0);
          ctx.restore();
        }
        this._stat = 1;
      } else this._stat = 0;
      this._sk = key;
      if (!this._stat) this.drawStatic(vx0, vx1, vy0, vy1);
      for (let k = 0; k < 5; k++) {
        const y = top(k);
        if (y > vy1 || y + 420 < vy0) continue;
        this.drawTunnel(k);
      }
      this.drawPipe();
      const sh = BB.V2.shaft, sx0 = SHAFT[0], sw = SHAFT[1] - SHAFT[0], sb = rail(4) + 60;
      if (sh && !this._stat) this.drawShaftWall(vx0, vx1, vy0, vy1);
      this.drawRest(vx0, vx1, vy0, vy1);
    }
    ugBake() {
      if (this._U) return this._U;
      const S = 0.42, XA = -2400, X1 = 6400, Y1 = rail(4) + 300, c = document.createElement("canvas");
      c.width = Math.ceil((X1 - XA) * S);
      c.height = Math.ceil((Y1 - GY) * S);
      const g = c.getContext("2d");
      g.scale(S, S);
      g.translate(-XA, -GY);
      const lit = this.lit;
      this.lit = [1, 1, 1, 1, 1];
      BB.withCtx(g, () => {
        this.drawStatic(XA, X1, GY, Y1);
        this.drawShaftWall(XA, X1, GY, Y1);
      });
      this.lit = lit;
      this._U = { c, S, XA, X1, Y1 };
      return this._U;
    }
    buildStatic(vx0, vx1, vy0, vy1) {
      if (!this._sc) this._sc = document.createElement("canvas");
      const c = this._sc, cv = ctx.canvas;
      c.width = cv.width;
      c.height = cv.height;
      const m = ctx.getTransform();
      this._sxy = BB.shakeXY.slice();
      this.drawStatic(vx0, vx1, vy0, vy1);
      this.drawShaftWall(vx0, vx1, vy0, vy1);
      if (top(4) < vy1 && top(4) + 420 > vy0) this.drawCave(4, true);
      const yd = Math.max(0, Math.floor(m.d * GY + m.f));
      if (yd < cv.height) c.getContext("2d").drawImage(cv, 0, yd, cv.width, cv.height - yd, 0, yd, cv.width, cv.height - yd);
      this._built = 1;
    }
    drawStatic(vx0, vx1, vy0, vy1) {
      ctx.fillStyle = earthPat();
      ctx.fillRect(vx0, GY, vx1 - vx0, Math.max(0, vy1 - GY));
      if (!BB.V2.earth) {
        const g = ctx.createLinearGradient(0, GY, 0, rail(4) + 200);
        g.addColorStop(0, "rgba(20,10,5,.15)");
        g.addColorStop(1, "rgba(10,5,3,.55)");
        ctx.fillStyle = g;
        ctx.fillRect(vx0, GY, vx1 - vx0, Math.max(0, vy1 - GY));
      }
      for (let k = 0; k < 5; k++) {
        const y = top(k);
        if (y > vy1 || y + 420 < vy0) continue;
        this.tunnelBg(k);
      }
    }
    drawShaftWall(vx0, vx1, vy0, vy1) {
      const sh = BB.V2.shaft, sx0 = SHAFT[0], sw = SHAFT[1] - SHAFT[0], sb = rail(4) + 60;
      if (sh) {
        if (!shaftC) {
          shaftC = document.createElement("canvas");
          shaftC.width = sw;
          shaftC.height = sb - GY;
          const g = shaftC.getContext("2d"), th = sh.height * sw / sh.width;
          for (let y = 0; y < sb - GY; y += th) g.drawImage(sh, 0, y, sw, th);
          g.fillStyle = "rgba(12,7,4,.35)";
          g.fillRect(0, 0, sw, sb - GY);
          for (let k = 0; k < 5; k++) {
            const y0 = top(k) + 40 - GY;
            g.fillStyle = "rgba(18,10,6,.55)";
            g.fillRect(0, y0, sw, rail(k) + GY - GY - top(k) - 40 + 6);
          }
        }
        const v0 = Math.max(GY, vy0), v1 = Math.min(sb, vy1);
        if (v1 > v0) ctx.drawImage(shaftC, 0, v0 - GY, sw, v1 - v0, sx0, v0, sw, v1 - v0);
      }
    }
    drawRest(vx0, vx1, vy0, vy1) {
      const c = this.cam, t = BB.t, sh = BB.V2.shaft, sx0 = SHAFT[0], sw = SHAFT[1] - SHAFT[0], sb = rail(4) + 60;
      for (let k = 0; k < 5; k++) {
        const y0 = top(k) + 40;
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx0, y0, sw, rail(k) - y0 + 6);
        ctx.clip();
        if (!sh) {
          ctx.fillStyle = "rgba(18,10,6,.55)";
          ctx.fillRect(sx0, y0, sw, rail(k) - y0 + 6);
        }
        if (!!BB.q) BB.glow((SHAFT[0] + SHAFT[1]) / 2, rail(k) - 120, 320, "rgba(" + (k === 2 ? "150,200,255" : "255,190,110") + ",A)", 0.18 * this.lit[k]);
        ctx.restore();
        ctx.fillStyle = "#6b4428";
        ctx.fillRect(sx0 - 6, y0 - 22, sw + 12, 22);
        ctx.fillStyle = "rgba(0,0,0,.3)";
        ctx.fillRect(sx0 - 6, y0, sw + 12, 6);
        const l = this.lit[k];
        ctx.fillStyle = l > 0.5 ? Math.sin(t * 3 + k) > 0 ? "#6ee678" : "#3c8a48" : "#333";
        ctx.beginPath();
        ctx.arc(sx0 + 24, y0 - 11, 7, 0, 7);
        ctx.arc(SHAFT[1] - 24, y0 - 11, 7, 0, 7);
        ctx.fill();
      }
      const ey = this.elevY;
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(1932, 140);
      ctx.lineTo(1932, ey - 330);
      ctx.moveTo(1948, 140);
      ctx.lineTo(1948, ey - 330);
      ctx.stroke();
      BB.prop("elev", 1940, ey + 56, 336, { shadow: false });
      drawCart(CART_X + 10, ey, this.count);
      if (this.botOnLift()) {
        const end = this.state === "end" && this.botX > SHAFT[1] - 10;
        this.drawBot(end ? GY : ey, end ? 0.3 + 0.05 * Math.sin(t * 3) : 0.2 + 0.1 * Math.sin(t * 3));
      }
      {
        const on = this.botOnLift() && Math.abs(this.botX - 1940) < 36, dtg = Math.min(0.05, Math.max(0, t - (this._gT || t)));
        this._gT = t;
        this.gate = clamp((this.gate || 0) + (on ? 1 : -1) * dtg * 3.2, 0, 1);
        const g = ease.inOut(this.gate), L = 1818, R = 2062, yt = ey - 142, yb = ey + 6, w = 22 + (R - L - 22) * g, x0 = R - w, n = Math.max(2, Math.round(2 + 9 * g));
        ctx.save();
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(0,0,0,.35)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let i = 0; i < n - 1; i++) {
          const xa = x0 + w * i / (n - 1), xb = x0 + w * (i + 1) / (n - 1);
          ctx.moveTo(xa + 3, yt + 12);
          ctx.lineTo(xb + 3, yb - 6);
          ctx.moveTo(xb + 3, yt + 12);
          ctx.lineTo(xa + 3, yb - 6);
        }
        ctx.stroke();
        ctx.strokeStyle = "#4a4a50";
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < n - 1; i++) {
          const xa = x0 + w * i / (n - 1), xb = x0 + w * (i + 1) / (n - 1);
          ctx.moveTo(xa, yt + 8);
          ctx.lineTo(xb, yb - 8);
          ctx.moveTo(xb, yt + 8);
          ctx.lineTo(xa, yb - 8);
        }
        ctx.stroke();
        for (let i = 0; i < n; i++) {
          const x = x0 + w * i / (n - 1);
          ctx.fillStyle = BB.lg(yt, yb, ["#7a7a82", "#3c3c42"]);
          ctx.fillRect(x - 4, yt, 8, yb - yt);
          ctx.fillStyle = "rgba(255,255,255,.25)";
          ctx.fillRect(x - 3, yt, 2, yb - yt);
        }
        ctx.fillStyle = "#2f2f34";
        ctx.fillRect(x0 - 6, yt - 4, w + 12, 9);
        ctx.fillRect(x0 - 6, yb - 6, w + 12, 9);
        if (g > 0.9) {
          ctx.fillStyle = COL.yellow;
          ctx.beginPath();
          ctx.arc(x0 + 2, (yt + yb) / 2, 7, 0, 7);
          ctx.fill();
          ctx.strokeStyle = "#19191f";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }
      if (this.jr.vis && this.jr.mode === "dive") BB.staticJr(this.jr.x, this.jr.y, 110, { noShadow: 1, rot: this.jr.rot, glitch: 0.6 });
      if (vy0 < GY + 60) {
        ctx.fillStyle = BB.lg(GY, GY + 50, ["#a89a86", "#7e7262", "#4a3f35"]);
        ctx.fillRect(vx0, GY, SHAFT[0] - vx0, 46);
        ctx.fillRect(SHAFT[1], GY, vx1 - SHAFT[1], 46);
        ctx.fillStyle = "rgba(255,240,210,.35)";
        ctx.fillRect(vx0, GY, SHAFT[0] - vx0, 3);
        ctx.fillRect(SHAFT[1], GY, vx1 - SHAFT[1], 3);
        ctx.fillStyle = BB.lg(GY + 46, GY + 80, ["rgba(10,5,2,.55)", "rgba(10,5,2,0)"]);
        ctx.fillRect(vx0, GY + 46, vx1 - vx0, 34);
        ctx.strokeStyle = "rgba(30,22,16,.45)";
        ctx.lineWidth = 2;
        for (let x = Math.floor(vx0 / 160) * 160; x < vx1; x += 160) {
          if (x > SHAFT[0] - 4 && x < SHAFT[1] + 4) continue;
          ctx.beginPath();
          ctx.moveTo(x, GY + 4);
          ctx.lineTo(x, GY + 44);
          ctx.stroke();
          if (BB.q) {
            BB.rivet(x + 10, GY + 12, 3);
            BB.rivet(x + 10, GY + 36, 3);
            BB.rivet(x - 10, GY + 12, 3);
            BB.rivet(x - 10, GY + 36, 3);
          }
        }
        const hd = ease.out(this.hatch), HW = HATCH[1] - HATCH[0];
        if (hd > 0.02) {
          const sg = ctx.createLinearGradient(0, GY, 0, GY + 46);
          sg.addColorStop(0, "#0b0907");
          sg.addColorStop(1, "#000");
          ctx.fillStyle = sg;
          ctx.fillRect(HATCH[0], GY, HW, 46);
          ctx.fillStyle = "rgba(120,100,80,.35)";
          ctx.fillRect(HATCH[0], GY, 6, 46);
          ctx.fillRect(HATCH[1] - 6, GY, 6, 46);
          ctx.fillStyle = "rgba(0,0,0,.6)";
          ctx.fillRect(HATCH[0] + 6, GY, HW - 12, 8);
        }
        for (const [hx, s] of [[HATCH[0], 1], [HATCH[1], -1]]) {
          const fw = HW / 2;
          ctx.save();
          ctx.translate(hx, GY);
          ctx.rotate(s * hd * 1.4);
          const x0 = s > 0 ? 0 : -fw;
          ctx.fillStyle = BB.lg(0, 24, ["#c3cbc9", "#7f8a88", "#525c5a"]);
          ctx.strokeStyle = COL.ink;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.rect(x0, 0, fw, 24);
          ctx.fill();
          ctx.stroke();
          ctx.save();
          ctx.beginPath();
          ctx.rect(s > 0 ? fw - 18 : -fw, 0, 18, 24);
          ctx.clip();
          for (let k = -2; k < 4; k++) {
            ctx.fillStyle = k % 2 ? "#19191f" : "#ffd23c";
            ctx.beginPath();
            const bx = (s > 0 ? fw - 18 : -fw) + k * 9;
            ctx.moveTo(bx, 0);
            ctx.lineTo(bx + 9, 0);
            ctx.lineTo(bx + 18, 24);
            ctx.lineTo(bx + 9, 24);
            ctx.fill();
          }
          ctx.restore();
          ctx.strokeStyle = "rgba(255,255,255,.35)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x0 + 3, 3);
          ctx.lineTo(x0 + fw - 3, 3);
          ctx.stroke();
          for (const rx of [x0 + 10, x0 + fw / 2, x0 + fw - 28]) BB.rivet(rx, 12, 3);
          ctx.fillStyle = BB.lg(-8, 8, ["#ffffff", "#6c7775"]);
          ctx.strokeStyle = COL.ink;
          ctx.lineWidth = 2.5;
          for (const hy of [4, 18]) {
            ctx.beginPath();
            ctx.roundRect(-6, hy - 5, 12, 10, 4);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      if (this.jr.vis && this.jr.mode !== "dive") this.drawJrWarehouse();
    }
    // v12.8: phones (low quality) draw the static warehouse (wall tiles, conveyor render, signs, Smash-O-Matic prop) from one baked,
    // reduced-resolution layer; only the belt cleats, bulbs, bin notes, button and Sprocket are drawn per frame. Desktop unchanged.
    whStatic(vx0, vx1) {
      const t = BB.t;
      const wh = BB.V2.wh;
      if (wh) {
        const s = GY / 946, tw = wh.width * s, th = wh.height * s;
        for (let i = Math.floor(vx0 / tw); i * tw < vx1; i++) {
          ctx.save();
          ctx.translate(i * tw + (i % 2 ? tw : 0), 0);
          if (i % 2) ctx.scale(-1, 1);
          ctx.drawImage(wh, 0, 0, tw, th);
          ctx.restore();
        }
      }
      BB.contactShadow(710, GY, 720, 0.35);
      {
        const im = BB.V2.conveyor;
        if (im) {
          const sx = 1340 / im.width, sy = sx * 0.8, X0 = 40, Y0 = 767;
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, 1500, GY + 2);
          ctx.clip();
          ctx.drawImage(im, X0, Y0, im.width * sx, im.height * sy);
          ctx.restore();
        }
      }
      BB.plaque(1305, 588, 320, 76, "RHYTHM WAREHOUSE", 28, "#28403c", { font: "Rammetto One", r: 18 });
      {
        const nx = (HATCH[0] + HATCH[1]) / 2;
        BB.plaque(nx, 452, 250, 80, "NOTE MINE", 32, "#b5482a", { font: "Rammetto One", r: 18 });
        BB.text("\u25BC", nx, 508, 30, COL.yellow, { stroke: 5 });
      }
      const mx = SMASH_X;
      BB.prop("smash", mx, GY + 6, 420, { shadowA: 0.4 });
      {
        const py = GY - 498;
        BB.plaque(mx, py + 31, 230, 66, "SMASH-O-MATIC", 24, "#b5482a", { font: "Rammetto One", r: 16, cols: ["#fdf8ea", "#ecdcb8", "#caa77a"] });
      }
    }
    whBake() {
      const V = BB.V2;
      if (!V.wh || !V.conveyor) return null;
      if (this._wh) return this._wh;
      const S = 0.42, XA = -2400, X1 = 6400, Y1 = GY + 40, c = document.createElement("canvas");
      c.width = Math.ceil((X1 - XA) * S);
      c.height = Math.ceil(Y1 * S);
      const g = c.getContext("2d");
      g.scale(S, S);
      g.translate(-XA, 0);
      BB.withCtx(g, () => this.whStatic(XA, X1));
      this._wh = { c, XA, X1, Y1 };
      return this._wh;
    }
    drawWarehouse(vx0, vx1) {
      const t = BB.t;
      const lq = !BB.q, bk = lq ? this.whBake() : null, baked = !!bk;
      if (baked) ctx.drawImage(bk.c, bk.XA, 0, bk.X1 - bk.XA, bk.Y1);
      else this.whStatic(vx0, vx1);
      {
        const im = BB.V2.conveyor;
        if (im) {
          const sx = 1340 / im.width, sy = sx * 0.8, X0 = 40, Y0 = 767, P = (px, py) => [X0 + px * sx, Y0 + py * sy];
          if (!baked) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, 1500, GY + 2);
            ctx.clip();
            ctx.drawImage(im, X0, Y0, im.width * sx, im.height * sy);
            ctx.restore();
          }
          const [bx0, by0] = P(40, 5), [bx1, by1] = P(1165, 27);
          ctx.save();
          ctx.beginPath();
          ctx.rect(bx0, by0, bx1 - bx0, by1 - by0);
          ctx.clip();
          ctx.fillStyle = "rgba(120,110,100,.35)";
          for (let x = -60; x < bx1 - bx0 + 60; x += 46) {
            const xx = bx0 + (x + t * 80) % (bx1 - bx0 + 46);
            ctx.fillRect(xx, by0, 6, by1 - by0);
          }
          ctx.restore();
          if (!baked) for (const px of [42, 1157]) {
            const [rx, ry] = P(px, 75);
            ctx.save();
            ctx.translate(rx, ry);
            ctx.scale(1, 0.8);
            ctx.rotate(t * 2.4);
            ctx.strokeStyle = "rgba(40,45,45,.7)";
            ctx.lineWidth = 3;
            for (let k = 0; k < 3; k++) {
              ctx.rotate(Math.PI / 3);
              ctx.beginPath();
              ctx.moveTo(-14, 0);
              ctx.lineTo(14, 0);
              ctx.stroke();
            }
            ctx.restore();
          }
          for (let k = 0; k < 11; k++) {
            const [lx, ly] = P(137 + 92 * k, 70), on = (k + Math.floor(t * 5)) % 3 === 0;
            if (on) {
              if (BB.q) BB.glow(lx, ly, 26, "rgba(255,214,90,A)", 0.7);
              ctx.fillStyle = "rgba(255,250,215,.9)";
              ctx.beginPath();
              ctx.arc(lx, ly, 8, 0, 7);
              ctx.fill();
            } else {
              ctx.fillStyle = "rgba(60,40,10,.35)";
              ctx.beginPath();
              ctx.arc(lx, ly, 9, 0, 7);
              ctx.fill();
            }
          }
        }
      }
      const bx = BIN_X;
      for (let i = 0; i < Math.min(this.binCount, 10); i++) BB.solidWhole(bx - 60 + i % 4 * 40, GY - 160 - Math.floor(i / 4) * 24 + i % 2 * 6, 24, { rot: (i % 3 - 1) * 0.3 });
      BB.prop("bin", bx, GY + 4, 170, { shadowA: 0.4 });
      BB.rrect(bx - 85, GY - 108, 170, 42, 10, BB.lg(GY - 108, GY - 66, ["#fbf6e6", "#ddd5bd"]), "#8a806b", 3);
      BB.text("WHOLE NOTES", bx, GY - 86, 20, "#28403c");
      if (this.binCount === 0) {
        ctx.fillStyle = "#e8e4d8";
        for (let i = 0; i < 9; i++) {
          ctx.beginPath();
          ctx.arc(bx - 110 + i * 28, GY - 6 - i % 3 * 5, 4 + i % 2 * 3, 0, 7);
          ctx.fill();
        }
      }
      {
        const pressed = this.btnPress && BB.t - this.btnPress < 0.4, im = BB.V2.redbtn;
        BB.contactShadow(BTN_X, GY, 70, 0.45);
        if (im) {
          const h = 215, s2 = h / im.height, w = im.width * s2, x0 = BTN_X - w / 2, y0 = GY - h, capH = im.height * 0.17, pz = pressed ? 6 : 0;
          ctx.drawImage(im, 0, capH, im.width, im.height - capH, x0, y0 + capH * s2, w, (im.height - capH) * s2);
          ctx.drawImage(im, 0, 0, im.width, capH, x0, y0 + pz, w, capH * s2);
          if (pressed || this.btnGlow && BB.t < this.btnGlow) BB.glow(BTN_X, y0 + capH * s2 * 0.5 + pz, 60, "rgba(255,80,60,A)", 0.5);
        }
      }
      const talk = BB.isTalking("sprocket"), ch = this.sprCheer;
      BB.sprite("sprocket", SPR_X, GY, 400, { squash: (talk ? Math.sin(t * 16) * 0.02 : 0) + (ch > 0 ? Math.abs(Math.sin(t * 8)) * 0.04 : 0), rot: ch < 0 ? Math.sin(t * 20) * 0.03 : 0 });
    }
    drawJrWarehouse() {
      const j = this.jr, m = j.mode, t = BB.t;
      const glitch = m === "giggle" ? Math.sin(t * 30) > 0.3 ? 1 : 0 : 0;
      const sq = m === "munch" ? Math.abs(Math.sin(t * 12)) * 0.06 : m === "burp" ? 0.08 * Math.exp(-(t - this.burpT) * 4) : 0;
      BB.staticJr(j.x, j.y, 110, { spd: 520, stuffed: m === "munch", squash: sq, glitch, run: m === "run" ? 1 : 0, rot: m === "giggle" ? Math.sin(t * 25) * 0.08 : 0 });
      if (m === "munch" && Math.random() < 0.2) BB.burst(j.x + 30, j.y - 110, 1, { world: 1, cols: ["#f6eed6", "#e8dcb8", "#3a3226"], kind: "dot", size: 6, g: 900, speed: 150, a0: -2.2, spread: 1.2 });
      if (m === "burp" && t - this.burpT < 1.6) {
        const k = (t - this.burpT) / 1.6;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.font = "70px 'Lilita One'";
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = COL.ink;
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.strokeText("\u266A", j.x + 20 + Math.sin(k * 8) * 20, j.y - 180 - k * 120);
        ctx.fillText("\u266A", j.x + 20 + Math.sin(k * 8) * 20, j.y - 180 - k * 120);
        BB.text("BURP!", j.x - 90, j.y - 200, 40, COL.yellow, { stroke: 6 });
        ctx.restore();
      }
    }
    // static tunnel backdrop (cacheable): painted panorama, darkness until powered, edge vignette
    tunnelBg(k) {
      const y = top(k), l = this.lit[k], F = FLOORS[k];
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(1460, y, 1880, 420, 70);
      ctx.clip();
      const im = BB.V2["tun" + k];
      if (im) ctx.drawImage(im, 1460, y, 1880, 420);
      else BB.rrect(1460, y, 1880, 420, 70, F.col);
      if (l < 1) {
        ctx.fillStyle = "rgba(10,6,4,".concat(0.78 * (1 - l), ")");
        ctx.fillRect(1460, y, 1880, 420);
      }
      ctx.lineWidth = 40;
      ctx.strokeStyle = "rgba(15,8,4,.35)";
      ctx.beginPath();
      ctx.roundRect(1460, y, 1880, 420, 70);
      ctx.stroke();
      ctx.restore();
    }
    drawTunnel(k) {
      const y = top(k), l = this.lit[k], F = FLOORS[k], t = BB.t, active = this.R && this.R.f === k, L = LIGHT[k], B = TBOX(k);
      this._bub = [];
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(1460, y, 1880, 420, 70);
      ctx.clip();
      if (!this._stat && !this._ug) this.tunnelBg(k);
      if (active && BB.phone && BB.q && l > 0) {
        const lc = litC(k, L.amb);
        if (lc) {
          ctx.globalAlpha = l;
          ctx.drawImage(lc, 2200, y);
          ctx.globalAlpha = 1;
        }
      }
      if (k === 1 && active && this.beat) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(1460, y, 1880, 420);
        ctx.clip();
        ctx.lineCap = "round";
        for (let i = 0; i < 12; i++) {
          const sx = 3400 - (t * 1600 + i * 397) % 2e3, sy = y + 50 + i * 71 % 300, len = 120 + i % 4 * 40, g = ctx.createLinearGradient(sx, 0, sx + len, 0);
          g.addColorStop(0, "rgba(255,220,160,.32)");
          g.addColorStop(1, "rgba(255,220,160,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 3 + i % 3 * 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + len, sy);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
      BB.text(F.name, 2330, y + 48, 34, COL.yellow, { font: "Rammetto One", align: "left", stroke: 5 });
      const ph = active && this.beat ? (this.beatNow() % 1 + 1) % 1 : t * 1.2 % 1, b = BB.bounce(ph, active ? 0.07 : 0.02);
      if (k === 0) BB.sprite("turtle", LEAD_X, rail(k), 190, { squash: b });
      if (k === 1) BB.rocketBot(LEAD_X, rail(k), 240, { squash: b, rot: -0.1 });
      if (k === 2) {
        BB.sprite("whisper", LEAD_X, rail(k), 260, { squash: b });
        if (active && this.tooLoud && t - this.tooLoud < 1.2) this.bubble(LEAD_X - 260, rail(k) - 330, "shhh... softer!", k);
      }
      if (k === 3) {
        BB.sprite("boom", LEAD_X, rail(k), 270, { squash: b * 1.5 });
        if (active && this.tooSoft && t - this.tooSoft < 1.2) this.bubble(LEAD_X - 280, rail(k) - 330, "LOUDER! BOOM!", k);
      }
      if (active && k < 4 && this.fewHands && t - this.fewHands < 1.2 && !(this.tooSoft && t - this.tooSoft < 1.2) && !(this.tooLoud && t - this.tooLoud < 1.2)) this.bubble(LEAD_X - 280, rail(k) - 330, "Everyone together!", k);
      if (k === 4) {
        this.drawCave(4);
        BB.prop("rubble", 3170, rail(k) + 8, 150, { box: B, rim: L.rim, amb: L.amb, ambA: 0.2 });
        if (this.R && this.R.icons && active) {
          BB.sprite(this.R.icons[0], 3060, rail(k), 170, { squash: b, parts: false });
          BB.sprite(this.R.icons[1], 3230, rail(k), 200, { squash: b, parts: false });
        }
      }
      if (active || this.R && k === this.R.f) {
        if (!this.botOnLift() && this.state !== "end") {
          const ph2 = this.beat ? (this.beatNow() % 1 + 1) % 1 : 0.5;
          let sw = this.beat ? ph2 < 0.12 ? 1 : ph2 < 0.8 ? 1 - ease.out((ph2 - 0.12) / 0.68) : ease.inOut((ph2 - 0.8) / 0.2) : 0.3 + 0.05 * Math.sin(t * 3);
          const shrug = this.shrugT && t - this.shrugT < 0.8;
          this.drawBot(rail(k), sw, { squash: this.beat ? BB.bounce(ph2, 0.06) : 0 });
          if (shrug) this.bubble(this.botX + 70, rail(k) - 420, "\xAF\\_(\u30C4)_/\xAF", k);
        }
        if (this.state !== "pop" && this.state !== "end" && this.state !== "intro") {
          const R = this.R, r = R.kind === "boulder" ? 170 : R.kind === "crystal" ? 135 : 150;
          const beatShk = this.beat && this.state !== "drop" ? Math.max(0, 1 - (this.beatNow() % 1 + 1) % 1 * 6) * 2 : 0;
          const ry = rail(k) - r * 0.85 + this.rockY;
          if (ry > y - r * 2) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(1460, y, 1880, 440);
            ctx.clip();
            drawRock(ROCK_X, ry, r, R.kind, this.stage, beatShk + this.shk * 10, this.wob, { mixed: R.bonus, k, shadow: this.rockY > -20 });
            ctx.restore();
          }
          if (R.bonus) BB.text("BONUS", ROCK_X, Math.max(y + 60, rail(k) - r * 1.9 + this.rockY), 36, COL.yellow, { stroke: 6, font: "Rammetto One" });
        }
        if (this.state === "pop") {
          const tt = BB.t - this.st, R = this.R, r = 150;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(1460, y, 1880, 420, 70);
          ctx.clip();
          for (const s of [-1, 1]) {
            ctx.save();
            ctx.translate(ROCK_X + s * tt * 500, rail(k) - 120 + tt * tt * 900 - tt * 400);
            ctx.rotate(s * tt * 4);
            ctx.globalAlpha = clamp(1 - tt, 0, 1);
            ctx.beginPath();
            ctx.rect(s > 0 ? 0 : -400, -400, 400, 800);
            ctx.clip();
            BB.prop(R.kind === "crystal" ? "crystal" : "rock", 0, r * 0.8, r * 1.6, { shadow: false, rim: L.rim, amb: L.amb });
            ctx.restore();
          }
          if (tt < 0.4) {
            ctx.save();
            ctx.globalAlpha = 1 - tt / 0.4;
            ctx.fillStyle = "#fff8d0";
            ctx.beginPath();
            ctx.arc(ROCK_X, rail(k) - 130, 200 * tt / 0.4 + 40, 0, 7);
            ctx.fill();
            ctx.restore();
          }
          ctx.restore();
        }
      }
      for (const n of this.flying) {
        if (n.f !== k) continue;
        const tt = clamp((BB.t - n.t0) / 1.1, 0, 1), e = ease.inOut(tt);
        const x = lerp(n.x0, n.x1, e), base = lerp(n.y0, n.y1, e), arc = Math.max(0, Math.min(320, base - (y + 90))), yy = base - Math.sin(tt * Math.PI) * arc;
        BB.wholeNote(x, yy, 46 * (1 + 0.3 * Math.sin(tt * Math.PI)), { glow: 0.8, fill: n.gold ? "#ffe066" : "#fff", rot: tt * 6 });
      }
      if (this.prank && active && this.prank.ph !== "done") {
        const p = this.prank, yb = y + 150;
        BB.rrect(2960, yb + 18, 260, 16, 8, "rgba(20,8,2,.35)");
        BB.rrect(2960, yb, 260, 24, 10, BB.lg(yb, yb + 24, ["#b07a48", "#7a4e2c", "#4e2f18"]), "#2e1a0c", 3);
        ctx.fillStyle = "rgba(255,230,190,.3)";
        ctx.fillRect(2970, yb + 3, 240, 3);
        ctx.fillStyle = "#3a2414";
        for (const bx of [2980, 3200]) {
          ctx.beginPath();
          ctx.arc(bx, yb + 12, 4, 0, 7);
          ctx.fill();
        }
        {
          const jy = p.ph === "bonk" ? rail(k) : yb;
          BB.contactShadow(p.x, jy, 60, 0.45);
          if (p.ph === "throw" && Math.sin(BB.t * 20) > 0.6) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            BB.glow(p.x, jy - 60, 110, "rgba(120,200,255,A)", 0.35);
            ctx.restore();
          }
        }
        const bonk = p.ph === "bonk";
        BB.staticJr(p.x, bonk ? yb + Math.min(1, (BB.t - p.t3) * 3) * (rail(k) - yb) : yb, 95, { run: p.ph === "in" || p.ph === "out" ? 1 : 0, glitch: p.ph === "throw" && Math.sin(BB.t * 20) > 0.6 ? 1 : 0, dizzy: bonk, rot: bonk ? 0.6 : 0, spd: p.ph === "out" ? 900 : 500, flip: p.ph === "in" });
        if (p.ph === "throw") this.bubble(p.x - 330, yb - 190, "hee hee! pebbles!", k);
        if (bonk) this.bubble(p.x - 170, yb - 150, "oof!", k);
      }
      if (active && BB.q && !BB.phone) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(2200, y, 1140, 420);
        ctx.clip();
        ctx.globalCompositeOperation = "soft-light";
        ctx.globalAlpha = 0.3 * l;
        ctx.fillStyle = L.amb;
        ctx.fillRect(2200, y, 1140, 420);
        ctx.restore();
      }
      for (const b2 of this._bub) this.bubble(b2[0], b2[1], b2[2], b2[3], true);
      this._bub = null;
    }
    bubble(x, y, txt, k, now) {
      if (k != null && this._bub && !now) {
        this._bub.push([x, y, txt, k, 1]);
        return;
      }
      const w = BB.measure(txt, 34) + 50;
      if (k != null) {
        const B = TBOX(k);
        x = clamp(x, B.x0 + 10, B.x1 - w - 10);
        y = clamp(y, top(k) + 14, rail(k) - 80);
      }
      BB.rrect(x + 2, y + 7, w, 64, 30, "rgba(0,0,0,.22)");
      BB.rrect(x, y, w, 64, 30, BB.lg(y, y + 64, ["#ffffff", "#f1ecdd"]), COL.ink, 4);
      BB.text(txt, x + w / 2, y + 34, 34, COL.ink);
    }
    drawPipe() {
      const top0 = GY - 150, bot = rail(4) - 60, x = PIPE_X, pi = BB.V2.pipe;
      if (pi) {
        ctx.drawImage(pi, x - 40, GY, 80, bot - GY);
      } else {
        ctx.fillStyle = "#b87333";
        ctx.fillRect(x - 24, GY, 48, bot - GY);
      }
      if (this.pipeGlow > 0) {
        ctx.save();
        ctx.globalAlpha = this.pipeGlow * (0.35 + 0.2 * Math.sin(BB.t * 4));
        const g = ctx.createLinearGradient(x - 14, 0, x + 14, 0);
        g.addColorStop(0, "rgba(255,233,160,0)");
        g.addColorStop(0.5, "rgba(255,240,180,1)");
        g.addColorStop(1, "rgba(255,233,160,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 14, GY, 28, bot - GY);
        ctx.restore();
      }
      for (let k = 0; k < 5; k++) {
        const hy = rail(k) - 120, L = LIGHT[k];
        BB.prop("funnel", x, hy + 70, 150, { shadow: false, rim: L.rim, amb: L.amb, ambA: 0.12 });
      }
      for (const p of this.pipeNotes) {
        BB.glow(x, p.y, 60, "rgba(255,240,170,A)", 0.9);
        BB.wholeNote(x, p.y, 20, { fill: p.gold ? "#ffe066" : "#fff" });
      }
    }
    // -------- HUD --------
    drawChipFly() {
      const f = this.chipFly;
      if (!f || f.done) return;
      const tt = clamp((BB.t - f.t) / 1.1, 0, 1);
      if (BB.t < f.t) {
      }
      const e = ease.inOut(tt), im = BB.V2.chip;
      if (!im) return;
      const x = lerp(f.x0, 762, e), y = lerp(f.y0, 83, e) - Math.sin(tt * Math.PI) * 160, h = lerp(150, 78, e) * (BB.t < f.t ? ease.back(clamp(1 - (f.t - BB.t) / 0.3, 0, 1)) : 1), w = im.width * h / im.height;
      BB.glow(x, y, h * 1.1, "rgba(255,225,130,A)", 0.55);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(tt * Math.PI) * 0.5);
      ctx.drawImage(im, -w / 2, -h / 2, w, h);
      ctx.restore();
      if (Math.random() < 0.5) BB.burst(x, y, 1, { cols: ["#ffe066", "#fff"], kind: "star", size: 8, g: 200, speed: 120, life: 0.5 });
    }
    drawHUD() {
      const R = this.R || ROCKS[0], F = FLOORS[R.f];
      const mp = this.meterPop && BB.t - this.meterPop < 0.5 ? 1 + 0.12 * Math.sin((BB.t - this.meterPop) * Math.PI * 2) : 1;
      {
        const cp = this.chipPop && BB.t - this.chipPop < 0.6 ? 1 + 0.15 * Math.sin((BB.t - this.chipPop) / 0.6 * Math.PI) : 1, im = BB.V2.chip;
        ctx.save();
        ctx.translate(752, 79);
        ctx.scale(cp, cp);
        BB.panel(-55, -55, 110, 110, 26);
        if (im) {
          const h = 60, w = im.width * h / im.height;
          if (this.chip) {
            BB.glow(0, 0, 70, "rgba(255,220,120,A)", 0.35 + 0.1 * Math.sin(BB.t * 3));
            ctx.drawImage(im, -w / 2, -h / 2 - 6, w, h);
          } else {
            ctx.globalAlpha = 0.22;
            ctx.drawImage(im, -w / 2, -h / 2 - 6, w, h);
            ctx.globalAlpha = 1;
          }
        }
        BB.text("BEAT CHIP", 0, 38, 15, this.chip ? COL.yellow : "#8fb5ad", { stroke: 3 });
        ctx.restore();
      }
      ctx.save();
      ctx.translate(40, 24);
      ctx.scale(mp, mp);
      BB.panel(0, 0, 480, 110, 28);
      BB.text("WHOLE NOTES", 24, 30, 30, COL.yellow, { align: "left", stroke: 4 });
      BB.text("".concat(this.count, " of 8"), 24, 76, 26, "#fff", { align: "left", font: "Rammetto One", stroke: 4 });
      for (let i = 0; i < 8; i++) {
        const on = i < this.count;
        BB.wholeNote(206 + i * 32, 76, 12, { fill: on ? "#6ee678" : "#2d4744", ring: on ? COL.ink : "#22383a" });
      }
      ctx.restore();
      const sg = R.sign || [F.name, F.mean], icons = R.icons || (F.icon ? [F.icon] : []);
      BB.panel(W - 520, 24, 480, 110, 28);
      icons.forEach(
        (ic, i) => BB.sprite(ic, W - 470 + i * 70, 124, 76, { shadow: false })
        /* inside border */
      );
      BB.text(sg[0], W - 500 + icons.length * 70, 60, sg[0].length > 10 ? 32 : 40, "#fff", { align: "left", font: "Rammetto One", stroke: 5, maxW: 440 - icons.length * 70 });
      BB.text(sg[1] + (R.dyn === "p" ? "  (p)" : R.dyn === "f" ? "  (f)" : "") + "  \xB7  ".concat(R.bpm, " bpm"), W - 500 + icons.length * 70, 104, 24, COL.yellow, { align: "left", stroke: 4, maxW: 440 - icons.length * 70 });
      BB.pauseBtn(() => this.pause(), 984);
      const lit = [0, 0, 0, 0];
      let count = false;
      if (this.beat) {
        const bn = this.beatNow() - BB.visLat() / this.beat.spb;
        if (bn >= 0) {
          const bi = Math.floor(bn), f = bn - bi;
          lit[bi % 4] = Math.max(0.25, 1 - f * 0.9);
          count = this.state === "count";
        }
      }
      const need = strikesFor(this.R), pw = need > 6 ? 26 : 34, sw = need * pw - 8 + 40, gx = W / 2 - (392 + 20 + sw) / 2;
      BB.beatPills(gx + 196, H - 95, lit, { marks: this.marks, wobble: this.wob * (this.prank && this.prank.ph === "throw" ? 1 : 0.4) });
      if (count) {
        BB.text(this.warm > 0 ? this.warm + " ..." : "WARM UP: clap 4 in a row!", W / 2, H - 200, this.warm > 0 ? 70 : 44, COL.yellow, { font: "Rammetto One", stroke: 8 });
      } else if (this.state === "dig") {
        BB.text(R.dyn === "p" ? "soft claps!" : R.dyn === "f" ? "LOUD claps!" : strikesFor(R) + " strikes break the rock!", W / 2, H - 185, 34, "#fff", { stroke: 6 });
      }
      if (this.pebbles) {
        ctx.fillStyle = "#8a7060";
        ctx.strokeStyle = COL.ink;
        ctx.lineWidth = 3;
        for (const q of this.pebbles) {
          ctx.beginPath();
          ctx.ellipse(q.x, q.y, 14, 10, q.x, 0, 7);
          ctx.fill();
          ctx.stroke();
        }
      }
      BB.panel(gx + 412, H - 150, sw, 110, 26);
      for (let i = 0; i < need; i++) {
        const on = this.state === "pop" || i < (this.strikes || 0);
        BB.rrect(gx + 432 + i * pw, H - 90, pw - 8, 36, 8, on ? COL.yellow : "#3a4a48", "#fff", 2);
      }
      BB.text("STRIKES", gx + 412 + sw / 2, H - 118, 20, "#fff", { stroke: 4 });
      BB.micMeter(40, H - 150, { band: R.dyn === "p" ? "soft" : R.dyn === "f" ? "loud" : null });
      BB.overrideBtn(() => this.manualOverride(), { pop: this.ovPop && BB.t - this.ovPop < 0.3 ? 1.08 : 1 });
    }
    drawIntroHUD() {
      BB.button(W - 370, H - 150, 330, 110, "SKIP INTRO", { size: 34, id: "skip", onClick: () => this.skipIntro() });
      BB.pauseBtn(() => this.pause(), 984);
    }
    drawEnd() {
      const t = BB.t - this.st;
      if (t < 7.4) return;
      const k = ease.back(clamp((t - 7.4) / 0.6, 0, 1));
      ctx.save();
      ctx.translate(W / 2, 330);
      ctx.scale(k, k);
      BB.panel(-560, -250, 1120, 500, 44);
      BB.text("ROOM 1 COMPLETE!", 0, -160, 72, "#fff", { font: "Rammetto One", stroke: 9 });
      for (let i = 0; i < 8; i++) BB.wholeNote(-280 + i * 80, -60, 30, { fill: "#6ee678", glow: 0.4, rot: Math.sin(BB.t * 3 + i) * 0.2 });
      BB.text("8 whole notes are back in the bin!", 0, 20, 40, COL.yellow, { stroke: 5 });
      if (this.chip && BB.V2.chip) {
        const im = BB.V2.chip, h = 110, w = im.width * h / im.height;
        BB.glow(455, 140, 80, "rgba(255,220,120,A)", 0.4);
        ctx.drawImage(im, 455 - w / 2, 138 - h / 2, w, h);
        BB.text("+ BEAT CHIP piece", 440, 212, 22, COL.yellow, { stroke: 4 });
      }
      BB.text("Next: the NOTE SMASHER!", 0, 80, 36, "#fff", { stroke: 5 });
      ctx.restore();
      if (t > 6) {
        BB.button(W / 2 - 220, 620, 440, 130, "ROOM MAP", { size: 50, id: "tomap", onClick: () => BB.roomDone("mine") });
        BB.button(W / 2 - 690, 620, 440, 130, "NEXT ROOM", { style: "green", size: 56, id: "nextroom", onClick: () => {
          if (!BB.save.done.includes("mine")) {
            BB.save.done.push("mine");
            localStorage.setItem("bb4", JSON.stringify(BB.save));
          }
          BB.go(new BB.SmasherRoom());
        } });
        BB.button(W / 2 + 250, 620, 440, 130, "PLAY AGAIN", { size: 44, id: "again", onClick: () => BB.go(new MineRoom()) });
      }
    }
  }
  BB.MineRoom = MineRoom;
})();
