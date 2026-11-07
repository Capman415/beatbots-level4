"use strict";
(() => {
  let ctx = BB.ctx;
  BB._sw.push((g) => ctx = g);
  const COL = BB.COL, W = BB.W, H = BB.H, { clamp, lerp, ease } = BB, R = BB.R;
  BB.VO_LINES = (BB.VO_LINES || []).concat([
    ["dl_left", "Lean left!", "sprocket"],
    ["dl_right", "Lean right!", "sprocket"],
    ["dl_duck", "Duck!", "sprocket"],
    ["dl_jump", "Jump!", "sprocket"],
    ["dl_freeze", "Freeze!", "sprocket"],
    ["dl_intro", "It's Static Jr.! Clap each box's rhythm to throw it at him, and fill the delivery truck!", "sprocket"],
    ["dl_shield", "He put up a static shield! Only a perfect clap can break it!", "sprocket"],
    ["dl_phase2", "He's getting faster! Keep reading carefully!", "sprocket"],
    ["dl_phase3", "Last few boxes! He's going wild!", "sprocket"],
    ["dl_face", "He dropped his face box! Drag it onto his head!", "sprocket"],
    ["dl_assist", "I'll help with that one! Next box!", "sprocket"],
    ["jr_boss", "Hee hee! You'll never deliver these boxes!", "jr"],
    ["jr_nofair", "No fair! Hey, what are you doing? Put me down!", "jr"],
    ["bb_fixed", "You fixed the factory! Levels one, two, three, and four, complete! Your reward... a boss brain break!", "sprocket"],
    ["bb_tease", "Next stop... somewhere new!", "sprocket"],
    ["bb_p6", "Phase six! Air juggle party! Ta, ta, ta, ta! Keep him bouncing!", "sprocket"],
    ["bb_chant", "Sing-along time! Stomp, stomp, clap! Everybody sing!", "sp"],
    ["bb_ch1", "Rhythm, Rhythm Engineers.", "sp"],
    ["bb_ch2", "Pull the levers, turn your gears.", "sp"],
    ["bb_who1", "Who fixed the factory?", "sp"],
    ["bb_who2", "Who are we?", "sp"],
    ["bb_g1", "Umph!", "jr"],
    ["bb_g2", "Ughh!", "jr"],
    ["bb_g3", "Oof!", "jr"],
    ["bb_6", "Six!", "jr"],
    ["bb_7", "Seven!", "jr"],
    ["bb_clapgo", "Clap attack! Go!", "sp"],
    ["bb_stop", "Stop! Freeze!", "sp"],
    ["bb_heehee", "Hee-hee! Hee-hee!", "jr"],
    ["bb_laugh", "Ha ha ha! Hee hee!", "sprocket"],
    ["bb_sj1", "Your claps are softer than a marshmallow!", "jr"],
    ["bb_sj2", "I've heard louder sneezes!", "jr"],
    ["bb_sj3", "My grandma TV has better rhythm!", "jr"],
    ["bb_sj7", "I've seen kindergartners with better rhythm!", "jr"],
    ["bb_sj4", "Ti-ti? More like tee-hee!", "jr"],
    ["bb_sj5", "I ate all your whole notes... now I'm gonna eat your halves!", "jr"],
    ["bb_sj6", "Come at me, bro!", "jr"],
    ["bb_sp1", "Rhythm Engineers... let's show him!", "sprocket"],
    ["bb_speed", "Clap speed challenge! Clap fast! Faster is stronger!", "sprocket"],
    ["bb_fire", "You're on fire! Prestissimo! Hero punch!", "sprocket"],
    ["bb_treat", "Bonus round! Stand up, Rhythm Engineers! Dodge with your body, and attack by clapping! Nobody fails!", "sprocket"],
    ["bb_p1", "Phase one! Shake and freeze!", "sprocket"],
    ["bb_p2", "Phase two! Duck and lean!", "sprocket"],
    ["bb_p3", "Phase three! Jump and freeze!", "sprocket"],
    ["bb_p4", "Phase four! Factory claps!", "sprocket"],
    ["bb_p5", "Phase five! The clap back finale!", "sprocket"],
    ["bb_allegro", "Clap power up! Allegro means fast! Clap, clap, clap!", "sprocket"],
    ["bb_presto", "New word! Presto means very fast! Clap faster!", "sprocket"],
    ["bb_prestissimo", "Prestissimo! That means as fast as possible! Clap, clap, clap, clap!", "sprocket"],
    ["bb_blast", "Super beat blast!", "sprocket"],
    ["bb_jump", "Everybody, jump!", "sprocket"],
    ["dl_done", "Return to sender! The truck is full! Level four complete!", "sprocket"]
  ]);
  const TOTAL = 8, POOL = [["q", "e", "r", "h"], ["q", "e", "r", "h"], ["q", "e", "r", "h", "s"], ["q", "e", "r", "h", "s"], ["q", "e", "r", "h", "s"], ["q", "e", "r", "h", "s"], ["q", "e", "r", "h", "s"], ["q", "e", "r", "h", "s"]];
  const KO_B = 0.6, KO_BAR = 2.4, KO_T0 = 0.6, KO_INTRO = 37;
  const KB = (cue, ic, h, o = {}) => Object.assign({ cue, ic, h }, o), FOUR = (k) => [[0, k], [1, k], [2, k], [3, k]];
  const SH = () => KB("SHAKE! SHAKE! SHAKE!", "loud", [], { mode: "dance" }), SOFT = () => KB("SHAKE SOFT... shh!", "soft", [], { mode: "sneak" }), FRZ = (b) => KB("FREEZE! FUZZ BOMB!", "freeze", [[b, "bomb"]], { mode: "freeze" }), PH = (n, name) => KB("PHASE " + n + ": " + name, "ready", [], { count: 1, phase: n }), CLR = () => KB("SUPER BEAT BLAST!", "clap", [[0, "chunk"]], { clear: 1 }), TEMPI = { allegro: { w: "ALLEGRO", def: "Allegro = fast!", bpm: 125, inc: 0.25 }, presto: { w: "PRESTO", def: "PRESTO = very fast!", bpm: 170, inc: 0.15, isNew: 1 }, prestissimo: { w: "PRESTISSIMO", def: "PRESTISSIMO = as fast as possible!", bpm: 210, inc: 0.1, isNew: 1 } }, PWQ = ["allegro", "allegro", "presto", "presto", "prestissimo"];
  let PWN = 0;
  const PWR = () => {
    const tp = TEMPI[PWQ[Math.min(PWN++, 4)]];
    return [KB(tp.def, "clap", [], { count: 1, pwr: 1, tp }), KB(tp.w + "! CLAP CLAP CLAP!", "clap", [], { pwr: 2, tp })];
  };
  const A_ = (cue, h) => KB(cue, "clap", h, { atk: 1 }), C4 = (k) => A_("CLAP NOW! SLAP HIM SILLY!", [[0, "L"], [1, "R"], [2, "L"], [2.5, "R"], [3, k]]), CT = (k) => A_("CLAP CLAP CLAP! SLAP-HAPPY!", [[0, "L"], [0.5, "R"], [1, "L"], [1.5, "R"], [2, k]]), BOMBS = () => KB("FUZZ BOMBS! FREEZE... then SHAKE!", "freeze", [[1, "bomb"], [3, "bomb"]], { mode: "throw" }), DK = () => KB("DUCK!", "duck", [[2, "junkT"]], { mode: "throw" }), DL = () => KB("LEAN LEFT!", "L", [[2, "junkR"]], { mode: "throw" }), DR = () => KB("LEAN RIGHT!", "R", [[2, "junkL"]], { mode: "throw" }), JP = () => KB("JUMP! (rolling tire!)", "jump", [[2, "junkF"]], { mode: "throw" });
  const CW = () => [KB("CLAP ATTACK! CHARGE IT UP!", "clap", [], { cw: 1 }), KB("CLAP ATTACK! KEEP CLAPPING!", "clap", [], { cw: 2 })], HIT = () => KB("HERE IT COMES...", "ready", [[1, "chunk"]], { clear: 1 }), SAY = { sj7: "I've seen kindergartners with better rhythm!", sj5: "I ate all your WHOLE notes... now I'm gonna eat your HALVES!" }, OOF = (g) => KB(g === "67" ? "Uh-oh... what is he doing?" : g ? "STATIC JR. TALKS TRASH..." : "OOF! He felt that!", "ready", [], { rest: 1, gag: g, line: SAY[g] }), RND = (n, name, d, g) => [KB("ROUND " + n + ": " + name, "ready", [], { count: 1, phase: n, rn: 1 }), ...d, ...CW(), HIT(), OOF(g)];
  const KO_BARS = [
    ...RND(1, "DUCK & LEAN", [DK(), DL(), DR(), DK()], "sj7"),
    ...RND(2, "JUMP & LEAN", [JP(), DR(), DL(), JP(), DK()], "67"),
    ...RND(3, "FREEZE & DODGE", [FRZ(2), DL(), JP(), DR()], "sj5"),
    ...RND(4, "ALL THE MOVES!", [DK(), JP(), DL(), DR(), FRZ(2)]),
    /* v14.4.1 TEACHER-LED CHANT: optional recorded teacher clip assets/voice/teacher_chant.mp3 (plays from the CHANT TIME bar); no clip = lyrics + soft beat only */
    ...(() => {
      const L1 = ["Rhythm,", "Rhythm", "Engi-", "neers."], L2 = ["Pull the", "levers,", "turn your", "gears."], CH = (who, ws, o = {}) => KB("CHANT! Echo your teacher!", "ready", [], Object.assign({ chant: who, ws, bpm: 96, sty: "chant" }, o));
      return [
        KB("CHANT TIME!", "ready", [], { bpm: 96, sty: "chant", chantIntro: 1 }),
        CH("lead", L1),
        CH("echo", L1),
        CH("lead", L2),
        CH("echo", L2),
        CH("lead", ["Who fixed the factory?"]),
        CH("crowd", ["WE DID!"], { shout: 1 }),
        CH("lead", ["Who are we?"]),
        CH("crowd", ["RHYTHM ENGINEERS!"], { shout: 1 }),
        CH("all", L1),
        CH("all", L2)
      ];
    })(),
    ...[0, 1, 2, 3].map((j) => KB("CHARGE UP! Sing AHHH and go HIGHER!", "ready", [], { voice: 1, vi: j, bpm: 100 })),
    KB("FINALE! EVERY CLAP = ONE PUNCH!", "ready", [], { count: 1 }),
    ...[0, 1, 2].map((j) => KB("PUNCH RUSH! CLAP CLAP CLAP!", "clap", [[0, "L"], [1, "R"], [2, "L"], [3, "R"]], { rush: 1 })),
    Object.assign(KB("EVERYBODY GET LOW...", "duck", [], { count: 2 }), { bpm: 110, sty: "chantUp" }),
    Object.assign(KB("EVERYBODY JUMP!", "jump", [[0, "big"]]), { bpm: 110, sty: "chantUp" })
  ];
  const BS = [], BL = [];
  {
    let x = KO_T0;
    KO_BARS.forEach((b, i) => {
      b.bpm = b.bpm || 100;
      BS[i] = x;
      BL[i] = 240 / b.bpm;
      x += BL[i];
    });
    BS.push(x);
    BL.push(KO_BAR);
  }
  const barAt = (k) => {
    if (k < KO_T0)
      return Math.floor((k - KO_T0) / KO_BAR);
    const n = KO_BARS.length;
    if (k >= BS[n])
      return n + Math.floor((k - BS[n]) / KO_BAR);
    let i = 0;
    while (BS[i + 1] <= k)
      i++;
    return i;
  };
  BB.KO_BS = BS;
  const clapDyn = (o) => {
    if (!o)
      return 0;
    if (o.sim && o.dyn != null)
      return clamp(o.dyn, 0, 1);
    const G = window.GroupGate;
    if (G && G.calOk && G.calOk() && o.rms) {
      const L = G.loud;
      return clamp((G.dB(o.rms) - L.calLo) / (L.calHi - L.calLo), 0, 1);
    }
    return clamp(((o.lvl == null ? 0.6 : o.lvl) - 0.4) / 0.5, 0, 1);
  }, dynFill = (ds) => {
    if (!ds || !ds.length)
      return 0;
    let m = 0;
    for (const d of ds)
      m += d;
    m /= ds.length;
    return clamp(3 * (0.12 + 0.88 * m) * Math.min(1, ds.length / 4), 0, 3);
  }, dynLevel = (f) => f >= 2.4 ? 2 : f >= 1.2 ? 1 : 0, BLAST_R = [150, 240, 380], HIT_DMG = 6;
  const BOMB_LANES = ["botL", "botR", "mid"], LANE_TG = { left: { x: W * 0.1, y: H * 0.55 }, right: { x: W * 0.94, y: H * 0.76 }, high: { x: W * 0.4, y: 600 }, floor: { x: W * 0.5, y: H * 0.86 }, botL: { x: W * 0.26, y: H * 0.82 }, botR: { x: W * 0.84, y: H * 0.84 }, mid: { x: W * 0.5, y: H * 0.62 } }, throwLane = (kind, n) => kind === "junkR" ? "right" : kind === "junkL" ? "left" : kind === "junkT" ? "high" : kind === "junkF" ? "floor" : kind === "bomb" ? BOMB_LANES[(n || 0) % 3] : "mid", DODGE_VO = { L: "dl_left", R: "dl_right", duck: "dl_duck", jump: "dl_jump", freeze: "dl_freeze" };
  const SAFE_Y = 430, throwPath = (lane, v, sx, sy) => {
    if (v < 0 || v > 1.5)
      return null;
    const T = LANE_TG[lane] || LANE_TG.mid, po = Math.max(0, v - 1), a = v <= 1 ? 1 : clamp(1 - po / 0.5, 0, 1);
    if (lane === "floor") {
      const p2 = Math.pow(Math.min(v, 1), 1.15);
      return { x: lerp(sx, T.x, p2), y: lerp(sy, T.y, p2) + po * 2e3, sc: 0.55 + 3 * Math.pow(Math.min(v, 1), 1.3) + po * 2, a: 1 };
    }
    const p = 1 - Math.pow(1 - Math.min(v, 1), 1.7), dx = T.x - sx, dy = T.y - sy;
    const dl = Math.hypot(dx, dy) || 1;
    let x = sx + dx * p + dx / dl * po * 1500, y = sy + dy * p + dy / dl * po * 1500 - Math.sin(Math.min(v, 1) * Math.PI) * 40;
    if (lane === "high") {
      y = sy + dy * p - Math.sin(Math.min(v, 1) * Math.PI) * 20;
      return { x, y: Math.max(SAFE_Y + 140, y), sc: 0.6 + 1.3 * Math.pow(Math.min(v, 1), 1.4) + po * 0.6, a };
    }
    return { x, y: Math.max(SAFE_Y, y), sc: 0.6 + 2.1 * Math.pow(Math.min(v, 1), 1.4) + po * 1.5, a };
  };
  const LANE_DIR = { left: -1, right: 1, high: -1, floor: -1, botL: -1, botR: 1, mid: -1 }, throwTurn = (lane, v, kind) => {
    const d = LANE_DIR[lane] || 1, u = clamp(v, 0, 1.5), e = 1 - Math.pow(1 - Math.min(u, 1), 2), po = Math.max(0, u - 1);
    if (kind === "tire")
      return { rot: d * 0.1 * e, sx: 1 };
    const amp = kind === "bomb" ? 0.24 : kind === "sock" ? 0.38 : 0.44, tilt = lane === "high" ? -0.12 : lane === "botL" || lane === "botR" || lane === "mid" ? 0.12 : 0;
    const rot = clamp(d * (0.12 + amp * e + 0.25 * po) + tilt * e + 0.06 * Math.sin(u * 7), -0.6, 0.6);
    return { rot, sx: kind === "bomb" ? 1 : 1 - 0.16 * Math.sin(Math.PI * Math.min(u, 1)) };
  };
  BB.throwTurn = throwTurn;
  BB.LANE_DIR = LANE_DIR;
  BB.throwPath = throwPath;
  BB.SAFE_Y = SAFE_Y;
  BB.throwLane = throwLane;
  BB.LANE_TG = LANE_TG;
  BB.DODGE_VO = DODGE_VO;
  const PUNCH_GAP = 0.25;
  BB.PUNCH_GAP = PUNCH_GAP;
  BB.clapDyn = clapDyn;
  BB.dynFill = dynFill;
  BB.dynLevel = dynLevel;
  BB.BLAST_R = BLAST_R;
  BB.HIT_DMG = HIT_DMG;
  const TIERS = [["ANDANTE", 0, "#7ec8ff"], ["MODERATO", 90, "#6ee678"], ["ALLEGRO", 120, "#ffe066"], ["PRESTO", 170, "#ffb020"], ["PRESTISSIMO", 200, "#ff5a5a"]], tierOf = (c) => {
    let i = 0;
    TIERS.forEach((x, j) => {
      if (c >= x[1])
        i = j;
    });
    return i;
  };
  {
    const j = KO_BARS.findIndex((b) => b.phase === 6);
    for (let i = j - 1; i >= 0 && KO_BARS[i].pwr; i--)
      KO_BARS[i].beam = 1;
  }
  KO_BARS.forEach((b) => {
    if (b.mode && !b.vo && DODGE_VO[b.ic])
      b.vo = DODGE_VO[b.ic];
  });
  BB.KO_BARS = KO_BARS;
  KO_BARS.forEach((b) => {
    b.turn = b.mode ? "jr" : b.cw || b.rush || b.atk || b.pwr ? "us" : "";
  });
  let RUN = 0;
  KO_BARS.forEach((b, i) => {
    if (b.turn === "us" && !(KO_BARS[i - 1] && KO_BARS[i - 1].turn === "us"))
      RUN++;
    b.run = b.turn === "us" ? RUN : 0;
  });
  const HERO_AT = [];
  KO_BARS.forEach((b, i) => {
    if (b.atk && !KO_BARS.slice(i + 1).some((c) => c.atk && c.run === b.run))
      HERO_AT.push({ t: BS[i] + 3 * BL[i] / 4, run: b.run, style: HERO_AT.length % 3 });
  });
  BB.HERO_AT = HERO_AT;
  const KO_PHASE_END = [];
  KO_BARS.forEach((b, i) => b.clear && KO_PHASE_END.push(BS[i]));
  const KO_HITS = [];
  KO_BARS.forEach((b, i) => b.h.forEach(([bt, kind]) => KO_HITS.push([BS[i] + bt * BL[i] / 4, kind])));
  const KO_BIG = BS[KO_BARS.length - 1], KO_TF = 8.6, KO_LAUNCH = KO_BIG + KO_TF, KO_CEL = KO_LAUNCH + 2.4, KO_ATK = (k) => ["bomb", "junkT", "junkL", "junkR", "junkF", "zap"].includes(k);
  const bossMode = () => {
    try {
      const q = new URLSearchParams(location.search).get("boss");
      return q || localStorage.bbBoss || "move";
    } catch (e) {
      return "move";
    }
  };
  BB.bossMode = bossMode;
  const CHIP_ROOMS = ["mine", "smasher", "packing", "label"], chipCount = () => {
    try {
      const d = BB.save && BB.save.done || JSON.parse(localStorage.getItem("bb4") || '{"done":[]}').done || [];
      return CHIP_ROOMS.filter((r) => d.includes(r)).length;
    } catch (e) {
      return 0;
    }
  }, deluxeOn = () => {
    try {
      const q = new URLSearchParams(location.search).get("deluxe");
      if (q != null)
        return q === "1";
    } catch (e) {
    }
    return chipCount() >= 4;
  };
  BB.chipCount = chipCount;
  const SHIELD = [2, 5, 7], FACE = [3, 6], JR = { x: 1430, y: 540 }, LCH = { x: 300, y: 760 }, TRK = { x: 1110, y: 560 };
  const howTo = {
    title: "DELIVERY SHOWDOWN: beat Static Jr.!",
    steps: ["Each box shows a rhythm. Listen, then clap it back.", "A good clap THROWS the box at Static Jr.", "Every hit drops a box into the truck. Fill it up!", "Shield up? Only a PERFECT clap breaks it.", "Face box? Drag it onto his head to BONK him.", "No mic? Tap MANUAL OVERRIDE when they nail it."],
    words: "ta = 1   ti-ti = 2 quick   tika-tika = 4 quicker   ta-ah = 2 beats   rest = silent beat",
    example: (x, y, w, h, t) => {
    }
  };
  class DeliveryRoom {
    constructor(o = {}) {
      this.o = o;
    }
    enter() {
      BB.groove.start(100, "pack");
      this.n = this.o.startAt || 0;
      this.hp = TOTAL - this.n;
      this.state = "load";
      this.said = {};
      this.bolts = [];
      this.fx = [];
      this.motes = R.motes(10);
      this.ph = 0;
      this.jrK = null;
      R.loadImgs([["pack_blur", "jpg"], ["dock_bg", "jpg"], ["chip", "png"]]).then(() => {
        this.static = R.bake((g) => this.bake(g));
        this.state = "intro";
        this.st = BB.t;
        if (bossMode() === "clap")
          BB.say("jr_boss");
        else {
          BB.celebrate && 0;
          BB.burst(W / 2, 300, 40, { cols: ["#ffe066", "#6ee678", "#fff", "#ff8adf"], kind: "star", size: 14, speed: 900, g: 400 });
        }
        this.voEnd = BB.t + 3.2;
        setTimeout(() => BB.scene === this && !this.move && BB.say("dl_intro"), 2600);
      });
      this.move = bossMode() !== "clap";
      if (this.move)
        setTimeout(() => BB.scene === this && this.state === "intro" && BB.say("bb_treat", { overlap: true }), 11200);
      if (!this.move)
        BB.mic.take();
      window.__dl = this;
    }
    exit() {
      BB.paused = false;
      BB.fuzz = 0;
    }
    bake(g) {
      const V = BB.V2;
      if (V.dock_bg) {
        g.drawImage(V.dock_bg, 0, -90, W, H);
        g.drawImage(V.dock_bg, 0, H - 90, W, 90, 0, H - 90, W, 90);
        return;
      }
      if (V.pack_blur) {
        g.filter = "brightness(.35) saturate(.6)";
        g.drawImage(V.pack_blur, 0, 0, W, H);
        g.filter = "none";
      }
      const sky = g.createLinearGradient(0, 0, 0, 240);
      sky.addColorStop(0, "#0b1030");
      sky.addColorStop(1, "#1d2550");
      g.fillStyle = sky;
      g.fillRect(0, 0, W, 240);
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(255,255,240,${0.3 + Math.random() * 0.6})`;
        g.beginPath();
        g.arc(Math.random() * W, Math.random() * 220, Math.random() * 2 + 0.5, 0, 7);
        g.fill();
      }
      const wall = g.createLinearGradient(0, 240, 0, 740);
      wall.addColorStop(0, "#3a4152");
      wall.addColorStop(1, "#272c38");
      g.fillStyle = wall;
      g.fillRect(0, 240, W, 500);
      for (let y = 260; y < 740; y += 46) {
        g.fillStyle = "rgba(0,0,0,.12)";
        g.fillRect(0, y, W, 3);
      }
      for (let i = 0; i < 3; i++) {
        const x = 150 + i * 600;
        g.fillStyle = "#161a22";
        g.fillRect(x - 12, 330, 444, 410);
        for (let y = 340; y < 735; y += 30) {
          const lg = g.createLinearGradient(0, y, 0, y + 28);
          lg.addColorStop(0, "#6d7688");
          lg.addColorStop(1, "#4b5263");
          g.fillStyle = lg;
          g.fillRect(x, y, 420, 27);
        }
        g.fillStyle = "#ffe9a8";
        g.fillRect(x + 170, 258, 80, 22);
        const cone = g.createRadialGradient(x + 210, 280, 10, x + 210, 520, 380);
        cone.addColorStop(0, "rgba(255,236,170,.38)");
        cone.addColorStop(1, "rgba(255,236,170,0)");
        g.fillStyle = cone;
        g.beginPath();
        g.moveTo(x + 175, 280);
        g.lineTo(x - 60, 740);
        g.lineTo(x + 480, 740);
        g.lineTo(x + 245, 280);
        g.fill();
        g.fillStyle = "#ffe066";
        g.font = '34px "Rammetto One"';
        g.textAlign = "center";
        g.fillText("DOCK " + (i + 1), x + 210, 316);
      }
      const fl = g.createLinearGradient(0, 740, 0, H);
      fl.addColorStop(0, "#3b3f47");
      fl.addColorStop(1, "#1c1e23");
      g.fillStyle = fl;
      g.fillRect(0, 740, W, H - 740);
      for (let x = 0; x < W; x += 80) {
        g.fillStyle = x / 80 % 2 ? "#ffe066" : "#1e2b29";
        g.fillRect(x, 740, 80, 22);
      }
      g.fillStyle = "rgba(255,255,255,.35)";
      for (let x = 40; x < W; x += 220)
        g.fillRect(x, 960, 120, 10);
      const vg = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.1);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,.5)");
      g.fillStyle = vg;
      g.fillRect(0, 0, W, H);
    }
    phase() {
      return this.hp <= 2 ? 2 : this.hp <= 5 ? 1 : 0;
    }
    bpm() {
      return [92, 96, 100][this.phase()];
    }
    /* v14.2: capped at the Label Room's 100 BPM */
    clapTurn() {
      const c = this.cb;
      if (!c)
        return false;
      const p = c.phase();
      return p === "ready" || p === "clap";
    }
    newBox() {
      const p = this.phase();
      if (p > this.ph) {
        this.ph = p;
        BB.say(p === 1 ? "dl_phase2" : "dl_phase3");
        BB.sfx.glitch();
        BB.shake(8);
        this.phT = BB.t;
      }
      this.seq = BB.LabelGen ? BB.LabelGen.genRhythm(POOL[this.n], this.last, 4) : ["q", "e", "q", "r"];
      this.last = this.seq.join("");
      this.tries = 0;
      this.cb = null;
      this.shield = SHIELD.includes(this.n) ? 2 : 0;
      this.thr = null;
      this.state = "show";
      this.st = BB.t;
      this.voEnd = Math.max(this.voEnd || 0, BB.t + 1.2);
      this.atk = BB.t + 2 + Math.random() * 2;
      if (this.shield) {
        this.shT = BB.t;
        BB.sfx.zap();
        if (!this.said.sh) {
          this.said.sh = 1;
          this.voEnd = BB.t + (BB.say("dl_shield", { overlap: true }) || 2.5);
        }
      }
      if (FACE.includes(this.n) && !this.face) {
        this.face = { x: JR.x - 420, y: 260, t: BB.t, vy: 0 };
        BB.sfx.boing();
        if (!this.said.f) {
          this.said.f = 1;
          BB.say("dl_face", { overlap: true });
        }
      }
    }
    startClap() {
      this.state = "clap";
      this.st = BB.t;
      this.cb = new R.ClapBack(this.seq, { bpm: this.bpm(), onDone: (sc) => this.clapDone(sc) });
    }
    clapDone(sc) {
      this.cb = null;
      this.tries++;
      const need = this.shield === 2 ? 0.999 : 0.6;
      if (sc >= need) {
        if (this.shield) {
          this.shield = 0;
          BB.sfx.crack();
          BB.burst(JR.x, JR.y - 140, 40, { cols: ["#7ef0ff", "#fff"], kind: "star", size: 12, speed: 900, g: 200 });
        }
        this.throwBox(false);
        return;
      }
      if (this.shield === 2 && sc >= 0.6) {
        this.shield = 1;
        BB.sfx.crack();
        BB.caption = { txt: "Crack! Almost perfect. The shield is weaker now: one more good clap!", who: "sprocket", until: BB.t + 2.6, start: BB.t };
      }
      if (this.tries >= 2) {
        this.shield = 0;
        BB.say("dl_assist", { overlap: true });
        this.throwBox(true);
        return;
      }
      this.dodge();
      this.state = "wait";
      this.st = BB.t;
      this.voEnd = BB.t + 1.6;
    }
    dodge() {
      this.jrK = { t: BB.t, ph: "dodge" };
      BB.sfx.boing();
      BB.say(Math.random() < 0.5 ? "jr_giggle" : "jr_catch", { overlap: true, nocap: true });
      this.fuzzT = BB.t;
      this.fuzzD = 0.6;
    }
    throwBox(assist) {
      this.state = "throw";
      this.st = BB.t;
      this.thr = { assist, seq: this.seq };
      BB.sfx.whoosh();
    }
    landHit() {
      this.hp--;
      this.n++;
      this.jrK = { t: BB.t, ph: "hit" };
      BB.sfx.bonk();
      BB.shake(6);
      BB.say("jr_oof", { overlap: true, nocap: true });
      BB.burst(JR.x, JR.y - 150, 24, { cols: ["#ffe066", "#fff", "#ff8adf"], kind: "star", size: 14, speed: 700, g: 300 });
      this.fx.push({ k: "bonk", t: BB.t });
      this.drop = { t: BB.t };
    }
    startKO() {
      this.deluxe = deluxeOn();
      this.chips = this.deluxe ? 4 : chipCount();
      this.state = "end";
      this.cb = null;
      this.bolts = [];
      this.face = null;
      BB.groove.start(100, "pack");
      this.a0 = BB.groove.t0;
      this.st = BB.t + (this.a0 - BB.ac.currentTime) - KO_T0;
      BB.sfx.glitch();
      this.fuzzT = BB.t;
      this.fuzzD = 0.4;
      BB.mic.take();
      BB.ensureMic && BB.ensureMic();
      this.heroes = HERO_AT.map((h) => Object.assign({}, h));
      this.heroes.push({ t: KO_BIG, run: -1, style: 3, w: 1.2 });
      this.cts = [];
      this.cpm = 0;
      this.fireRun = 0;
    }
    bombAt(i) {
      const r = Math.sin(i * 12.9898) * 43758.5453, f = r - Math.floor(r);
      return { x: 260 + f * (W - 520), y: 420 + f * 7 % 1 * 300 };
    }
    skipKO() {
      if (this.state !== "end" || this.cel)
        return;
      (this.heroes || []).forEach((h) => h.armed = 2);
      BB.groove.stop();
      this.st = BB.t - KO_CEL + 0.05;
      this.ko = this.dinged = 1;
      KO_HITS.forEach((h, i) => this["h" + i] = 1);
      BB.say("dl_done", { overlap: true });
    }
    manualOverride() {
      if (BB.t - (this.lastOv || 0) < 0.5)
        return;
      this.lastOv = BB.t;
      this.ovPop = BB.t;
      if (this.cb)
        this.cb.override();
    }
    pause() {
      BB.paused = true;
      BB.ac.suspend();
    }
    resume() {
      BB.paused = false;
      BB.ensureMic();
    }
    // static attacks (cosmetic + brief fuzz; never hides the rhythm for long)
    attack() {
      const p = this.phase(), r = Math.random();
      this.jrK = { t: BB.t, ph: "zap" };
      if (r < 0.55 || !this.cb) {
        const n = 1 + p;
        for (let i = 0; i < n; i++)
          this.bolts.push({ x: JR.x, y: JR.y - 170, tx: 300 + Math.random() * (W - 600), ty: 200 + Math.random() * 500, t: BB.t + i * 0.18 });
        BB.sfx.zap();
      } else {
        this.fuzzT = BB.t;
        this.fuzzD = 0.35 + 0.1 * p;
        BB.sfx.glitch();
        if (!this.said.x) {
          this.said.x = 1;
          BB.say("jr_extra", { overlap: true, nocap: true });
        }
      }
      this.atk = BB.t + [5, 3.6, 2.6][p] + Math.random() * 2;
    }
    update(dt) {
      this.voiceTick(dt);
      this.powerTick(dt, BB.t - this.st);
      if (BB.keys.includes("p")) {
        this.pause();
        return;
      }
      if (BB.keys.includes(" ")) {
        if (this.state !== "end")
          this.manualOverride();
        else
          this.manualPc = 1;
      }
      const t = BB.t - this.st;
      if (this.state === "intro" && t > (this.move ? KO_INTRO : 6)) {
        if (this.move)
          this.startKO();
        else
          this.newBox();
      }
      if (this.state === "intro" && this.move) {
        if (t > 8 && !this.saidJr) {
          this.saidJr = 1;
          BB.say("jr_boss", { overlap: true });
        }
        if (t > 1.2 && !this.saidFx) {
          this.saidFx = 1;
          BB.say("bb_fixed", { overlap: true });
        }
      }
      if (this.state === "show" && t > 1.4 && BB.t > this.voEnd && !this.face)
        this.startClap();
      if (this.state === "wait" && BB.t > this.voEnd && !this.face)
        this.startClap();
      if (this.state === "throw" && t > 0.9 && !this.thrHit) {
        this.thrHit = 1;
        this.landHit();
      }
      if (this.state === "throw" && t > 2.2) {
        this.thrHit = 0;
        if (this.hp <= 0) {
          this.startKO();
          this.cb = null;
          this.bolts = [];
          this.face = null;
          BB.groove && BB.groove.stop && BB.groove.stop();
          BB.sfx.glitch();
          BB.shake(10);
          this.fuzzT = BB.t;
          this.fuzzD = 0.4;
        } else
          this.newBox();
      }
      if (this.state === "end") {
        if (!this.ko) {
          this.ko = 1;
          const A = (k) => this.a0 + k - KO_T0, S = BB.sfx;
          KO_BARS.forEach((b, i) => {
            const b0 = BS[i];
            if (b.count)
              for (let q = 0; q < 4; q++)
                S.tick && S.tick(A(b0 + q * BL[i] / 4));
            if (b.mode === "sneak")
              S.shhh && S.shhh(A(b0));
            if (b.mode === "freeze")
              S.ding && S.ding(A(b0));
            if (i >= KO_BARS.findIndex((x) => x.phase === 5) && !b.pwr && b.h.length)
              for (let q = 0; q < 4; q++)
                S.pkBlip && S.pkBlip(A(b0 + q * BL[i] / 4));
            if (b.pwr === 2) {
              const sp = 60 / b.tp.bpm;
              for (let q = 0; q * sp < KO_BAR - 0.05; q++)
                S.pkBlip && S.pkBlip(A(b0 + q * sp));
            }
          });
          KO_HITS.forEach(([k, kind]) => {
            const a = A(k);
            if (kind === "big") {
              [0, 0.12, 0.24].forEach((d) => S.pkTa && S.pkTa(a + d));
              S.bonk && S.bonk(a);
              S.wobble && S.wobble(a + 0.05);
              S.ding && S.ding(a + KO_TF + 1.2);
              S.chime && S.chime(a + KO_TF + 0.95);
              S.pop && S.pop(a + 0.9);
              [0, 0.12, 0.24, 0.36, 0.6, 0.72].forEach((d, q) => q % 2 ? S.tink && S.tink(a + 1.5 + d) : S.pkBlip && S.pkBlip(a + 1.5 + d));
              S.pkTa && S.pkTa(a + KO_TF);
              S.wobble && S.wobble(a + KO_TF + 0.05);
              if (this.deluxe) {
                [0.36, 0.48, 0.6].forEach((d) => S.pkTa && S.pkTa(a + d));
                S.fanfare && S.fanfare(a + 0.7);
              }
            } else if (kind === "bomb") {
              S.whoosh && S.whoosh(a - 0.5);
              S.pkTa && S.pkTa(a);
              S.pop && S.pop(a);
            } else if (kind === "chunk") {
              [0, 0.12].forEach((d) => S.pkTa && S.pkTa(a + d));
              S.bonk && S.bonk(a);
              S.wobble && S.wobble(a + 0.05);
              S.chime && S.chime(a + 0.6);
            } else if (kind === "stamp" || kind === "push") {
              S.pkTa && S.pkTa(a);
              S.clunk && S.clunk(a);
            } else if (kind === "pat") {
              S.pkTa && S.pkTa(a);
            } else if (kind === "pick") {
              S.pkTa && S.pkTa(a);
              S.tink && S.tink(a);
            } else if (kind[0] === "j") {
              S.whoosh && S.whoosh(a - 0.5);
              S.pop && S.pop(a);
            } else if ((KO_BARS[barAt(k)] || {}).rush && S.punchT)
              S.punchT(a, 0.8);
            else {
              S.pkTa && S.pkTa(a);
              if (kind === "stomp")
                S.clunk && S.clunk(a);
              else
                S.bonk && S.bonk(a);
            }
          });
        }
        KO_HITS.forEach(([hk, kind], i) => {
          if (t >= hk && !this["h" + i]) {
            this["h" + i] = 1;
            if (kind === "big") {
              this.cFire = BB.t;
              this.impact(3, 0);
              BB.shake(this.deluxe ? 44 : 30);
              if (this.deluxe)
                for (let q = 0; q < 3; q++)
                  BB.burst(W * (0.25 + q * 0.25), H * 0.3, 40, { cols: ["#ff5a5a", "#ffb020", "#ffe066", "#6ee678", "#5ac8fa", "#b07aff"], kind: "star", size: 16, speed: 1200, g: 400, life: 2 });
              BB.burst(JR.x, JR.y - 60, 40, { cols: ["#f4ecd8", "#ff8adf", "#6ee678"], kind: "spark", size: 16, speed: 1300, g: 450, life: 2 });
              BB.burst(JR.x, JR.y - 170, 60, { cols: ["#d24a3c", "#ffe066", "#fff", "#7ef0ff"], kind: "star", size: 16, speed: 1100, g: 400, life: 1.4 });
              BB.groove.stop();
            } else if (kind === "bomb") {
              const p = LANE_TG[throwLane("bomb", KO_HITS.slice(0, i).filter((h) => h[1] === "bomb").length)];
              BB.shake(5);
              BB.burst(p.x, p.y, 26, { cols: ["#7ef0ff", "#ff8adf", "#ffe066", "#fff"], kind: "star", size: 13, speed: 700, g: 250 });
            } else if (KO_ATK(kind)) {
            } else if (kind === "chunk" && (KO_BARS[barAt(hk)] || {}).clear) {
              const lv = this.hitLv || 0, bl = BL[barAt(hk)] / 4, A = (x) => this.a0 + x - KO_T0, S = BB.sfx;
              this.cFire = BB.t;
              S.boom ? S.boom() : S.clunk && S.clunk();
              this.hitShow = { k: hk, lv, r: BLAST_R[lv] };
              BB.shake([10, 18, 30][lv]);
              this.impact(2, 0);
              BB.burst(JR.x, JR.y - 80, [14, 24, 60][lv], { cols: ["#ffe066", "#fff", "#ff8adf", "#7ef0ff"], kind: "star", size: 14, speed: [600, 900, 1400][lv], g: 400 });
              BB.say(["bb_g1", "bb_g2", "bb_g3"][lv], { overlap: true });
              if (lv === 2) {
                S.wobble && S.wobble(A(hk + bl));
                S.pop && S.pop(A(hk + bl));
              }
            } else if (kind === "chunk") {
              BB.shake(26);
              BB.burst(JR.x, JR.y - 60, 40, { cols: ["#ff8adf", "#7ef0ff", "#ffe066", "#6ee678", "#f4ecd8"], kind: "spark", size: 14, speed: 1200, g: 500, life: 1.6 });
              BB.burst(JR.x, JR.y - 100, 45, { cols: ["#ffe066", "#fff", "#ff8adf"], kind: "star", size: 15, speed: 1e3, g: 350, life: 1.3 });
            } else {
              if (kind === "L" || kind === "R") {
                this.has = (this.has || []).filter((p) => BB.t - p.t < 1);
                const _sb = KO_BARS[barAt(BB.t - this.st)], _sc = _sb && this.sceneOf(_sb);
                if (_sc !== "beam" && _sc !== "aura" && Math.random() < 0.15)
                  this.has.push({ t: BB.t, w: ["HA!", "HEE HEE!", "HA HA!", "LOL!"][Math.floor(Math.random() * 4)], x: LCH.x + (Math.random() * 160 - 40), y: LCH.y - 300 - Math.random() * 60, c: ["#6ee678", "#ffe066", "#7ec8ff"][Math.floor(Math.random() * 3)] });
                if (BB.t - (this.lastLaugh || -9) > 4.5) {
                  this.lastLaugh = BB.t;
                  BB.say("bb_laugh", { overlap: true });
                }
                this.hitN = (this.hitN || 0) + 1;
                if (this.hitN % 3 === 1 && BB.t - (this.lastGr || -9) > 1.5 && !(this.gag && BB.t - this.gag.t < 2)) {
                  this.lastGr = BB.t;
                  this.grN = (this.grN || 0) + 1;
                  BB.say(["bb_g1", "bb_g2", "bb_g3"][this.grN % 3], { overlap: true });
                }
                const g = this.gag, gv = g ? BB.t - g.t : 9;
                if (g && g.kind === "mw" && gv > g.dur) {
                  this.gag = null;
                  this.gagLast = this.hitN;
                  BB.text && 0;
                  this.has.push({ t: BB.t, w: "SLAP! (mid-glide!)", x: JR.x - 120, y: JR.y - 330, c: "#ffe066" });
                  BB.sfx.bonk && BB.sfx.bonk();
                } else if (!g || gv > 2.6) {
                  const bt = 60 / (240 / (BL[barAt(BB.t - this.st)] || 2.4));
                  if (0) {
                    this.mwN = (this.mwN || 0) + 1;
                    this.gag = { kind: "mw", t: BB.t, dur: 4 * (BL[barAt(BB.t - this.st)] || 2.4) / 4, beat: (BL[barAt(BB.t - this.st)] || 2.4) / 4 };
                    BB.say("bb_heehee", { overlap: true });
                  } else if (!KO_HITS.some((h) => KO_ATK(h[1]) && Math.abs(h[0] - (BB.t - this.st)) < 2.2) && !(KO_BARS[barAt(BB.t - this.st)] || {}).chant && (KO_BARS[barAt(BB.t - this.st)] || {}).atk && 0) {
                    this.n67 = (this.n67 || 0) + 1;
                    this.gagLast = this.hitN;
                    this.gag = { kind: "67", t: BB.t, dur: 1.6 };
                    BB.say("bb_6", { overlap: true });
                    setTimeout(() => BB.scene === this && BB.say("bb_7", { overlap: true }), 800);
                  }
                }
              }
              BB.shake(kind === "stomp" ? 12 : 7);
              this.impact(kind === "stomp" || kind === "chunk" ? 2 : 1, kind === "L" ? -1 : kind === "R" ? 1 : 0);
              const sx = JR.x + (kind === "L" ? -90 : kind === "R" ? 90 : 0);
              BB.burst(sx, JR.y - 60, 16, { cols: ["#e2b272", "#ffe066", "#fff"], kind: "star", size: 12, speed: 650, g: 300 });
              BB.burst(sx, JR.y - 60, 10, { cols: ["#f4ecd8", "#efe3c8"], kind: "spark", size: 14, speed: 500, g: 500 });
            }
          }
        });
        {
          const bi = barAt(t), b = KO_BARS[bi], on = BB.mic.take();
          this.blasts = this.blasts || [];
          const us = b && b.turn === "us" && t < KO_BIG, tr = tierOf(this.cpm || 0);
          if (us) {
            for (const o of on)
              if (BB.t - (this.lastBl || 0) > 0.1) {
                this.lastBl = BB.t;
                this.cts.push(BB.t);
                const dy = clapDyn(o);
                if (b.cw) {
                  (this.dyn = this.dyn || []).push(dy);
                  this.cfDyn = dynFill(this.dyn);
                }
                this.combo = (BB.t - (this.lastCl || 0) < 0.8 ? this.combo || 0 : 0) + 1;
                this.lastCl = BB.t;
                if (b.rush) {
                  this.rushN = (this.rushN || 0) + 1;
                  this.impact(1, this.rushN % 2 ? -1 : 1, 1);
                  BB.shake(Math.min(26, 5 + this.rushN * 0.7));
                } else if (!b.cw)
                  this.blasts.push({ t: BB.t, x: W * (0.3 + Math.random() * 0.4), s: 1 + dy * 0.7 });
                if (b.cw)
                  BB.sfx.chime && BB.sfx.chime();
                if (!b.rush)
                  BB.sfx.pkTa && BB.sfx.pkTa();
                if (!b.cw) {
                  if (tr >= 2)
                    BB.sfx.bonk && BB.sfx.bonk();
                  BB.shake(3 + tr * 3);
                  BB.burst(JR.x + (Math.random() - 0.5) * 120, JR.y - 60, 10 + tr * 8, { cols: ["#ffe066", "#fff", TIERS[tr][2]], kind: "star", size: 10 + tr * 3, speed: 500 + tr * 200, g: 200 });
                }
              }
          }
          if (this.manualPc && us) {
            this.cts.push(BB.t);
            if (b.cw) {
              (this.dyn = this.dyn || []).push(0.6);
              this.cfDyn = dynFill(this.dyn);
            }
            this.blasts.push({ t: BB.t, x: W / 2, s: 1 });
          }
          this.cts = (this.cts || []).filter((x) => BB.t - x < 1.5);
          {
            const raw = us ? this.cts.length / 1.5 * 60 * 1.2 : 0;
            this.cpm = lerp(this.cpm || 0, raw, Math.min(1, (BB.dt || 0.016) * (raw > this.cpm ? 6 : 2)));
            if (b && b.pwr === 2)
              this.cpm = Math.max(this.cpm, Math.pow((t - BS[bi]) / BL[bi], 1.5) * 235);
          }
          {
            const tn = tierOf(this.cpm);
            if (us && tn === 4 && !b.cw && !b.rush && this.fireRun !== b.run) {
              this.fireRun = b.run;
              this.fire = BB.t;
              BB.say("bb_fire", { overlap: true });
              const qb = BL[bi] / 4, nb = BS[bi] + Math.ceil((t - BS[bi]) / qb + 1) * qb;
              const h = this.heroes.find((h2) => h2.run === b.run && !h2.armed);
              if (h) {
                if (h.t > nb)
                  h.t = nb;
              } else
                this.heroes.push({ t: nb, run: b.run, style: this.heroes.length % 3 });
            }
            if (us && tn >= 2) {
              const hb = Math.floor((t - KO_T0) / (KO_B / (tn >= 4 ? 4 : 2)));
              if (hb !== this.layB) {
                this.layB = hb;
                BB.sfx.tick && BB.sfx.tick();
                if (tn >= 3 && hb % 2)
                  BB.sfx.pkBlip && BB.sfx.pkBlip();
              }
            }
          }
          for (const h of this.heroes)
            if (!h.armed && t >= h.t - (h.w || 0.6) - 0.15 && t < h.t) {
              h.armed = 1;
              const S = BB.sfx, A = (k) => this.a0 + k - KO_T0;
              S.whoosh && S.whoosh(A(h.t - (h.w || 0.6)));
              [0, 0.1, 0.2].forEach((d) => S.pkTa && S.pkTa(A(h.t + d)));
              S.bonk && S.bonk(A(h.t));
              S.wobble && S.wobble(A(h.t + 0.05));
              S.pop && S.pop(A(h.t + 0.15));
            } else if (h.armed === 1 && t >= h.t) {
              h.armed = 2;
              BB.shake(30);
              this.impact(3, 0);
              BB.burst(JR.x, JR.y - 80, 50, { cols: ["#ffe066", "#fff", "#ff8adf", "#7ef0ff"], kind: "star", size: 16, speed: 1300, g: 400 });
            }
          if (b && b.pwr === 2) {
            const u = (t - BS[bi]) / BL[bi];
            this.pw = this.pw || 0;
            for (const o of on) {
              if (BB.t - (this.lastPc || 0) > 0.1) {
                this.lastPc = BB.t;
                this.pw += b.tp.inc * (1 + tierOf(this.cpm || 0) * 0.4);
                BB.sfx.chime && BB.sfx.chime();
                BB.burst(LCH.x - 175, LCH.y - 240, 14, { cols: ["#ffe066", "#fff"], kind: "star", size: 10, speed: 500, g: 200 });
              }
            }
            if (this.manualPc) {
              this.manualPc = 0;
              this.pw += b.tp.inc;
            }
            this.pw = Math.max(this.pw, u * u);
          } else if (!(b && b.clear))
            this.pw = 0;
        }
        {
          const bi = barAt(t), b = KO_BARS[bi], bt = (t - BS[bi]) / BL[bi];
          if (b && this.lastBi !== bi) {
            this.lastBi = bi;
            if (b.rest) {
              if (b.gag === "67") {
                this.gag = { kind: "67", t: BB.t, dur: 1.6 };
                BB.say("bb_6", { overlap: true });
                setTimeout(() => BB.scene === this && BB.say("bb_7", { overlap: true }), 800);
              } else if (b.gag)
                BB.say("bb_" + b.gag, { overlap: true });
            }
            if (b.phase) {
              if (!b.rn)
                BB.say("bb_p" + b.phase, { overlap: true });
              const sty = ["pack", "pack", "mine", "smash", "pack", "smash", "pack"][b.phase];
              BB.groove.start(100, sty);
              BB.groove.t0 = this.a0 + BS[bi] - KO_T0 + KO_B;
              this.sty = sty;
            }
            {
              const p = KO_BARS[bi - 1], ws = b.sty || this.sty || "pack", ps = p ? p.sty || this.sty || "pack" : ws;
              if (p && !b.phase && !b.pwr && (p.bpm !== b.bpm || ps !== ws || p.pwr === 2)) {
                BB.groove.start(b.bpm, ws);
                BB.groove.t0 = this.a0 + BS[bi] - KO_T0;
              }
            }
            if (b.phase)
              this.curPh = b.phase;
            BB.groove.vol = b.chant || b.chantIntro ? 0.3 : b.sty ? 0.9 : 0.5 + 0.05 * (this.curPh || 1);
            if (b.vo)
              BB.say(b.vo, { overlap: true });
            if (b.rush && !(KO_BARS[bi - 1] || {}).rush && window.ClapDet && ClapDet.expect) {
              let j = bi;
              while ((KO_BARS[j + 1] || {}).rush)
                j++;
              ClapDet.expect(PUNCH_GAP, this.a0 + BS[j + 1] - KO_T0 + 0.3);
            }
            if (b.chantIntro) {
              try {
                const au = this.tAu = new Audio("assets/voice/teacher_chant.mp3");
                au.volume = 1;
                au.play().catch(() => {
                });
              } catch (e) {
              }
            }
            if (b.chant || b.chantIntro) {
              const S = BB.sfx, A = (x) => this.a0 + BS[bi] - KO_T0 + x * BL[bi] / 4;
              [0, 1, 2, 3].forEach((x) => S.tick && S.tick(A(x)));
            }
            if (b.pwr === 1)
              BB.say("bb_speed", { overlap: true });
            if (b.clear)
              BB.say("bb_blast", { overlap: true });
            if (b.h.some((h) => h[1] === "big"))
              BB.say("bb_jump", { overlap: true });
            if (b.pwr === 2)
              BB.groove.stop();
          }
          if (b && b.pwr === 2 && bt > 0.9 && !this["gr" + bi]) {
            this["gr" + bi] = 1;
            BB.groove.start(100, this.sty || "pack");
            BB.groove.t0 = this.a0 + BS[bi + 1] - KO_T0;
          }
        }
        if (t >= KO_LAUNCH + 1.2 && !this.dinged) {
          this.dinged = 1;
          BB.say("dl_done", { overlap: true });
        }
        if (t >= KO_CEL && !this.cel) {
          this.cel = 1;
          BB.celebrate({ next: "", noJr: true });
        }
      }
      if (this.clapTurn() && BB.t > this.atk - 1)
        this.atk = BB.t + 1;
      if ((this.state === "clap" || this.state === "show" || this.state === "wait") && BB.t > this.atk && this.state !== "end")
        this.attack();
      this.bolts = this.bolts.filter((b) => BB.t - b.t < 1.1);
      const f = this.face;
      if (f && !f.drag && !this.clapTurn()) {
        f.vy = Math.min(f.vy + dt * 120, 160);
        f.y += f.vy * dt;
        if (f.y > 900) {
          this.face = null;
          BB.sfx.glitch();
          BB.sfx.pop();
          this.fuzzT = BB.t;
          this.fuzzD = 0.8;
          this.jrK = { t: BB.t, ph: "laugh" };
          BB.say("jr_giggle", { overlap: true, nocap: true });
          BB.caption = { txt: "Missed him! A little static fuzz... keep going!", who: "sprocket", until: BB.t + 2.2, start: BB.t };
          this.voEnd = BB.t + 1;
        }
      }
      BB.fuzz = this.fuzzT && BB.t - this.fuzzT < this.fuzzD ? 1 : 0;
      if (this.cb)
        this.cb.update(dt);
      else
        BB.mic.take();
    }
    pdown(p) {
      if (this.state === "end")
        return false;
      const f = this.face;
      if (f && !f.drag && Math.abs(p.x - f.x) < 110 && Math.abs(p.y - f.y) < 110) {
        f.drag = { id: p.id, dx: p.x - f.x, dy: p.y - f.y };
        BB.sfx.pop();
        return true;
      }
      return false;
    }
    pmove(p) {
      const f = this.face;
      if (f && f.drag && f.drag.id === p.id) {
        f.x = clamp(p.x - f.drag.dx, 80, W - 80);
        f.y = clamp(p.y - f.drag.dy, 40, H - 60);
      }
    }
    pup(p) {
      const f = this.face;
      if (f && f.drag && (!p || f.drag.id === p.id)) {
        f.drag = null;
        if (Math.hypot(f.x - JR.x, f.y - (JR.y - 200)) < 190) {
          this.face = null;
          this.jrK = { t: BB.t, ph: "hit" };
          BB.sfx.bonk();
          BB.shake(5);
          BB.say("jr_oof", { overlap: true, nocap: true });
          this.fx.push({ k: "bonk", t: BB.t });
          this.atk = BB.t + 6;
          BB.burst(JR.x, JR.y - 200, 20, { col: COL.yellow, kind: "star", size: 14, g: 300 });
          BB.caption = { txt: "BONK! He's dizzy: no static for a bit!", who: "sprocket", until: BB.t + 2.4, start: BB.t };
          this.voEnd = BB.t + 1.2;
        }
      }
    }
    drawTruck(x, y, fill, o = {}) {
      ctx.save();
      ctx.translate(x, y);
      R.shadow(ctx, 320, 255, 380, 0.5);
      const V = (p, x0, y0, w, h, c, op) => this.junkVol(p, x0, y0, w, h, c, op), B = () => ctx.beginPath(), SP = (...q) => this.junkSpec(...q), INK = "rgba(45,18,6,.9)";
      const rivet = (rx, ry, r) => {
        const G = ctx.createRadialGradient(rx - r * 0.4, ry - r * 0.4, 0, rx, ry, r);
        G.addColorStop(0, "#f2f5f7");
        G.addColorStop(0.5, "#8d9aa3");
        G.addColorStop(1, "#3a4248");
        ctx.fillStyle = G;
        B();
        ctx.arc(rx, ry, r, 0, 7);
        ctx.fill();
      };
      V(() => {
        B();
        ctx.roundRect(0, 0, 480, 240, 20);
      }, 0, 0, 480, 240, ["#fffaf0", "#e8dfca", "#b3a78d"], { wear: 21, wc: "110,85,50" });
      for (const px of [160, 320]) {
        ctx.strokeStyle = "rgba(60,45,25,.45)";
        ctx.lineWidth = 3;
        B();
        ctx.moveTo(px, 46);
        ctx.lineTo(px, 234);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,250,235,.7)";
        ctx.lineWidth = 2;
        B();
        ctx.moveTo(px + 3, 46);
        ctx.lineTo(px + 3, 234);
        ctx.stroke();
      }
      for (let q = 0; q < 12; q++)
        rivet(20 + q * 40, 232, 4.5);
      {
        B();
        ctx.roundRect(14, 54, 452, 172, 12);
        const G = ctx.createLinearGradient(0, 54, 0, 226);
        G.addColorStop(0, "#1a1d23");
        G.addColorStop(0.35, "#2d323c");
        G.addColorStop(1, "#3b414d");
        ctx.fillStyle = G;
        ctx.fill();
        ctx.save();
        ctx.clip();
        const T = ctx.createLinearGradient(0, 54, 0, 90);
        T.addColorStop(0, "rgba(0,0,0,.55)");
        T.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = T;
        ctx.fillRect(14, 54, 452, 36);
        for (const [x0, d] of [[14, 1], [466, -1]]) {
          const S = ctx.createLinearGradient(x0, 0, x0 + d * 30, 0);
          S.addColorStop(0, "rgba(0,0,0,.45)");
          S.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = S;
          ctx.fillRect(Math.min(x0, x0 + d * 30), 54, 30, 172);
        }
        ctx.strokeStyle = "rgba(255,255,255,.05)";
        ctx.lineWidth = 2;
        for (let yy = 70; yy < 226; yy += 18) {
          B();
          ctx.moveTo(14, yy);
          ctx.lineTo(466, yy);
          ctx.stroke();
        }
        ctx.restore();
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        B();
        ctx.roundRect(14, 54, 452, 172, 12);
        ctx.stroke();
      }
      for (let i = 0; i < fill; i++) {
        const c = i % 4, r = 1 - (i / 4 | 0), bx = 24 + c * 110, by = 62 + r * 82;
        ctx.save();
        ctx.translate(bx + 50, by + 38);
        ctx.scale(100 / 140, 76 / 120);
        this.paintBox(0);
        ctx.restore();
      }
      V(() => {
        B();
        ctx.roundRect(0, 0, 480, 46, 14);
      }, 0, 0, 480, 46, ["#ff7a6a", "#d8322a", "#8e1a16"], { wear: 13, wc: "70,10,5" });
      SP(120, 10, 70, 4, 0, 0.45);
      ctx.save();
      ctx.translate(30, 23);
      ctx.strokeStyle = "#ffd84a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, 7);
      ctx.stroke();
      for (let q = 0; q < 8; q++) {
        const a = q * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11);
        ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
        ctx.stroke();
      }
      ctx.restore();
      BB.text("BEAT BOTS EXPRESS", 250, 24, 30, "#fff", { font: "Rammetto One", stroke: 4, maxW: 400 });
      const cab = () => {
        B();
        ctx.moveTo(480, 240);
        ctx.lineTo(480, 96);
        ctx.quadraticCurveTo(482, 74, 520, 72);
        ctx.lineTo(600, 72);
        ctx.quadraticCurveTo(640, 74, 652, 130);
        ctx.lineTo(660, 240);
        ctx.closePath();
      };
      V(cab, 480, 72, 180, 168, ["#a8eedc", "#4fa896", "#245e55"], { wear: 17, wc: "20,50,45" });
      SP(530, 86, 40, 6, -0.1, 0.5);
      ctx.strokeStyle = "rgba(20,50,45,.55)";
      ctx.lineWidth = 3;
      B();
      ctx.moveTo(500, 166);
      ctx.lineTo(500, 236);
      ctx.moveTo(500, 166);
      ctx.lineTo(640, 166);
      ctx.stroke();
      V(() => {
        B();
        ctx.roundRect(516, 176, 30, 8, 3);
      }, 516, 176, 30, 8, ["#e3eaee", "#8d9aa3", "#4d575e"]);
      {
        const win = () => {
          B();
          ctx.moveTo(504, 100);
          ctx.lineTo(596, 100);
          ctx.quadraticCurveTo(622, 102, 630, 160);
          ctx.lineTo(504, 160);
          ctx.closePath();
        };
        win();
        const G = ctx.createLinearGradient(0, 100, 0, 160);
        G.addColorStop(0, "#f2fbff");
        G.addColorStop(0.5, "#a9dcf2");
        G.addColorStop(1, "#5f9fbf");
        ctx.fillStyle = G;
        ctx.fill();
        ctx.save();
        win();
        ctx.clip();
        ctx.fillStyle = "rgba(255,255,255,.55)";
        B();
        ctx.moveTo(520, 100);
        ctx.lineTo(546, 100);
        ctx.lineTo(522, 160);
        ctx.lineTo(496, 160);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.3)";
        B();
        ctx.moveTo(556, 100);
        ctx.lineTo(566, 100);
        ctx.lineTo(542, 160);
        ctx.lineTo(532, 160);
        ctx.fill();
        const I = ctx.createLinearGradient(0, 100, 0, 112);
        I.addColorStop(0, "rgba(20,40,60,.35)");
        I.addColorStop(1, "rgba(20,40,60,0)");
        ctx.fillStyle = I;
        ctx.fillRect(500, 100, 140, 12);
        ctx.restore();
        win();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
      {
        const G = ctx.createRadialGradient(650, 190, 1, 653, 193, 22);
        G.addColorStop(0, "#fffef0");
        G.addColorStop(0.5, "#ffe9a0");
        G.addColorStop(1, "#d9a940");
        B();
        ctx.roundRect(640, 180, 26, 26, 8);
        ctx.fillStyle = G;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.stroke();
        SP(648, 187, 5, 3, -0.5, 0.9);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const L = ctx.createRadialGradient(660, 193, 0, 660, 193, 60);
        L.addColorStop(0, "rgba(255,240,170,.35)");
        L.addColorStop(1, "rgba(255,240,170,0)");
        ctx.fillStyle = L;
        B();
        ctx.arc(660, 193, 60, 0, 7);
        ctx.fill();
        ctx.restore();
      }
      V(() => {
        B();
        ctx.roundRect(486, 178, 30, 8, 3);
      }, 486, 178, 30, 8, ["#4a4f58", "#2a2f35", "#15171b"]);
      V(() => {
        B();
        ctx.roundRect(452, -34, 20, 40, 6);
      }, 452, -34, 20, 40, ["#eef3f5", "#9aa6ae", "#4d575e"], { wear: 5, wc: "60,40,20" });
      if (o.spin) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#d8d2c6";
        for (let q = 0; q < 3; q++) {
          const u = (BB.t * 2 + q / 3) % 1;
          ctx.beginPath();
          ctx.arc(462 - u * 80, -40 - u * 60, 10 + u * 24, 0, 7);
          ctx.fill();
        }
        ctx.restore();
      }
      for (const wx of [110, 370, 570]) {
        const G = ctx.createRadialGradient(wx, 236, 30, wx, 236, 60);
        G.addColorStop(0, "rgba(10,5,0,.55)");
        G.addColorStop(1, "rgba(10,5,0,0)");
        ctx.fillStyle = G;
        B();
        ctx.arc(wx, 236, 60, Math.PI, 0);
        ctx.fill();
      }
      const sp = o.spin || 0;
      for (const wx of [110, 370, 570]) {
        ctx.save();
        ctx.translate(wx, 246);
        {
          const G = ctx.createRadialGradient(-14, -16, 4, 0, 0, 46);
          G.addColorStop(0, "#4d535c");
          G.addColorStop(0.7, "#24272d");
          G.addColorStop(1, "#101114");
          ctx.fillStyle = G;
          B();
          ctx.arc(0, 0, 44, 0, 7);
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = INK;
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,236,200,.28)";
          ctx.lineWidth = 3;
          B();
          ctx.arc(0, 0, 36, Math.PI * 1.05, Math.PI * 1.6);
          ctx.stroke();
          ctx.strokeStyle = "rgba(130,220,230,.22)";
          B();
          ctx.arc(0, 0, 36, Math.PI * 0.05, Math.PI * 0.45);
          ctx.stroke();
        }
        ctx.rotate(sp);
        for (let q = 0; q < 10; q++) {
          const a = q * Math.PI / 5;
          ctx.strokeStyle = "rgba(0,0,0,.55)";
          ctx.lineWidth = 4;
          B();
          ctx.moveTo(Math.cos(a) * 38, Math.sin(a) * 38);
          ctx.lineTo(Math.cos(a) * 44, Math.sin(a) * 44);
          ctx.stroke();
        }
        {
          const G = ctx.createRadialGradient(-7, -8, 1, 0, 0, 24);
          G.addColorStop(0, "#f6f9fa");
          G.addColorStop(0.45, "#aeb9c0");
          G.addColorStop(1, "#56616a");
          ctx.fillStyle = G;
          B();
          ctx.arc(0, 0, 22, 0, 7);
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = INK;
          ctx.stroke();
        }
        for (let q = 0; q < 5; q++) {
          const a = q * 1.2566;
          rivet(Math.cos(a) * 12, Math.sin(a) * 12, 3.6);
        }
        ctx.rotate(-sp);
        SP(-8, -9, 6, 3.5, -0.6, 0.8);
        ctx.restore();
      }
      ctx.restore();
    }
    paintBox(open, lab) {
      if (open) {
        for (const sd of [-1, 1]) {
          ctx.save();
          ctx.translate(sd * 70, -60);
          ctx.rotate(sd * (0.5 + 0.1 * Math.sin(BB.t * 6)));
          BB.rrect(sd > 0 ? 0 : -60, -48, 60, 48, 4, BB.lg(-48, 0, ["#d9a868", "#b07a40"]), "#5a3a1e", 4);
          ctx.restore();
        }
        ctx.fillStyle = "#3a2410";
        ctx.fillRect(-66, -64, 132, 10);
      }
      BB.rrect(-70, -60, 140, 120, 8, BB.lg(-60, 60, ["#ebc286", "#c88e4e", "#9c6632"]), "#4a2e14", 5);
      ctx.fillStyle = "rgba(74,46,20,.22)";
      ctx.fillRect(-66, 24, 132, 32);
      ctx.fillStyle = "rgba(255,244,214,.45)";
      ctx.fillRect(-62, -54, 7, 104);
      ctx.strokeStyle = "rgba(74,46,20,.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-66, -20);
      ctx.lineTo(66, -20);
      ctx.stroke();
      if (!open) {
        ctx.fillStyle = "rgba(214,180,120,.95)";
        ctx.fillRect(-12, -60, 24, 120);
        ctx.strokeStyle = "rgba(120,80,40,.5)";
        ctx.strokeRect(-12, -60, 24, 120);
      }
      ctx.save();
      ctx.translate(-42, -38);
      ctx.strokeStyle = "rgba(74,46,20,.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, 7);
      ctx.stroke();
      for (let q = 0; q < 8; q++) {
        const a = q * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "rgba(74,46,20,.5)";
      ctx.beginPath();
      ctx.moveTo(44, -48);
      ctx.lineTo(52, -36);
      ctx.lineTo(36, -36);
      ctx.fill();
      ctx.fillRect(42, -36, 4, 12);
      if (lab) {
        ctx.save();
        ctx.rotate(-0.06);
        BB.rrect(-62, -4, 124, 40, 4, "#fffaf0", "#d24a3c", 4);
        BB.text(lab, 0, 16, lab.length > 16 ? 13 : 17, "#d24a3c", { font: "Rammetto One", stroke: 0, maxW: 114 });
        ctx.restore();
      }
    }
    drawBox(x, y, s, seq, rot = 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s, s);
      R.shadow && 0;
      BB.rrect(-200, -120, 400, 240, 14, BB.lg(-120, 120, ["#ebc286", "#c88e4e", "#9c6632"]), "#4a2e14", 5);
      ctx.fillStyle = "rgba(74,46,20,.22)";
      ctx.fillRect(-194, 70, 388, 44);
      ctx.fillStyle = "rgba(255,244,214,.45)";
      ctx.fillRect(-190, -112, 9, 224);
      ctx.fillStyle = "rgba(214,180,120,.95)";
      ctx.fillRect(-22, -120, 44, 240);
      BB.rrect(-180, -70, 360, 150, 10, "#fffaf0", "#d24a3c", 4);
      BB.text("SHIP TO: STATIC JR.", 0, -94, 20, "#5a3a1e", { stroke: 0 });
      if (seq) {
        const bw = 86, bh = 130, U = R.noteSize("q", bw - 6, bh);
        let b = 0;
        for (const k of seq) {
          const w = R.BEATS[k] * bw;
          R.tile(k, -172 + b * bw + 3, -62, w - 6, bh, { ns: R.cardNs(k, bw, bh, R.BEATS[k]), shadow: false });
          b += R.BEATS[k];
        }
      }
      ctx.restore();
    }
    drawJr() {
      const k = this.jrK ? BB.t - this.jrK.t : 9, ph = this.jrK && this.jrK.ph, p = this.phase();
      let x = JR.x, y = JR.y, rot = 0, o = { flip: true, glitch: p * 0.15 };
      if (ph === "dodge" && k < 1) {
        x += Math.sin(k * Math.PI) * 170;
        o.lift = Math.sin(k * Math.PI) * 60;
      }
      if (ph === "hit" && k < 1.8) {
        o.dizzy = true;
        o.glitch = 0.5;
        rot = Math.sin(k * 20) * 0.12 * (1 - k / 1.8);
      }
      if (ph === "zap" && k < 0.5)
        o.glitch = 0.8;
      x += Math.sin(BB.t * (2 + p)) * 14 * (1 + p);
      BB.staticJr(x, y, 190, Object.assign(o, { rot }));
      if (this.shield) {
        const a = 0.35 + 0.15 * Math.sin(BB.t * 7), r = 190;
        ctx.save();
        ctx.globalAlpha = this.shield === 1 ? a * 0.55 : a;
        ctx.strokeStyle = "#7ef0ff";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, y - 120, r, 0, 7);
        ctx.stroke();
        ctx.fillStyle = "rgba(126,240,255,.14)";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        for (let i = 0; i < 7; i++) {
          const a0 = Math.random() * 7;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a0) * r, y - 120 + Math.sin(a0) * r);
          ctx.lineTo(x + Math.cos(a0 + 0.2) * (r - 30), y - 120 + Math.sin(a0 + 0.2) * (r - 30));
          ctx.stroke();
        }
        ctx.restore();
        BB.rrect(x - 150, y - 345, 300, 44, 14, "rgba(10,30,40,.85)", "#7ef0ff", 3);
        BB.text(this.shield === 2 ? "SHIELD: PERFECT CLAP!" : "SHIELD CRACKED!", x, y - 323, 22, "#bff8ff", { stroke: 0 });
      }
      let bub = null;
      if (ph === "dodge" && k < 1.6)
        bub = "missed me! hee hee!";
      else if (ph === "laugh" && k < 1.6)
        bub = "hee hee hee!";
      else if (ph === "hit" && k < 1.4)
        bub = "OOF!";
      else if (this.state === "intro")
        bub = "you'll never deliver these!";
      if (bub && !this.shield)
        R.bubble(x - 300, y - 250, bub);
    }
    /* v14.1.1 beside his head, clear of the HP panel */
    drawHP() {
      const x = W - 40 - 400 + 20, y = 78, w = 360, f = this.hp / TOTAL;
      BB.rrect(x - 20, y - 54, w + 40, 110, 28, "rgba(12,16,28,.85)", "#ff8adf", 3);
      BB.text("STATIC JR.", x + w / 2, y - 24, 24, "#ffd6f4", { stroke: 0 });
      BB.rrect(x, y, w, 28, 10, "#2a2233", null, 0);
      if (f > 0)
        BB.rrect(x, y, w * f, 28, 10, BB.lg(y, y + 28, ["#ff9ad8", "#c03a8e"]), null, 0);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, 28);
      for (let i = 1; i < TOTAL; i++) {
        ctx.fillStyle = "rgba(0,0,0,.4)";
        ctx.fillRect(x + i * w / TOTAL - 1, y, 2, 28);
      }
    }
    drawLauncher() {
      const x = LCH.x, y = LCH.y, k = this.state === "throw" ? BB.t - this.st : 9, rc = k < 0.25 ? Math.sin(k / 0.25 * Math.PI) * 18 : 0;
      if (BB.IMG.sprocket) {
        const tk = BB.isTalking && BB.isTalking("sprocket"), cheer = this.state === "end" || this.jrK && this.jrK.ph === "hit" && BB.t - this.jrK.t < 1.2;
        if (!(this.spIn && BB.t - this.spIn < 0.15)) {
          BB.contactShadow && BB.contactShadow(x - 175, y + 100, 100, 0.5);
          BB.sprite("sprocket", x - 175, y + 100, 330, { squash: (tk ? Math.sin(BB.t * 16) * 0.02 : Math.sin(BB.t * 2) * 6e-3) + (cheer ? Math.abs(Math.sin(BB.t * 8)) * 0.04 : 0), rot: Math.sin(BB.t * 1.3) * 0.015 });
        }
      }
      {
        const fv = BB.t - (this.cFire || -9), rr = rc + (fv < 0.35 ? Math.sin(Math.min(1, fv / 0.35) * Math.PI) * 34 : 0), ang = -0.5, mx = x - rr + Math.cos(ang) * 200, my = y + Math.sin(ang) * 200;
        BB.rrect(x - 86, y - 14, 172, 118, 16, "#50aaa0", COL.ink, 6);
        BB.rrect(x - 86, y + 70, 172, 34, 12, "#3c7f78", COL.ink, 6);
        ctx.fillStyle = COL.ink;
        for (const rx of [-70, -30, 30, 70])
          for (const ry of [0, 84]) {
            ctx.beginPath();
            ctx.arc(x + rx, y + ry + 6, 5, 0, 7);
            ctx.fill();
          }
        ctx.save();
        ctx.translate(x - 30, y + 48);
        ctx.fillStyle = "#f4f0e6";
        ctx.strokeStyle = COL.ink;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, 7);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#d24a3c";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(-2.4 + (fv < 1 ? 1.8 * (1 - fv) : 0)) * 16, Math.sin(-2.4 + (fv < 1 ? 1.8 * (1 - fv) : 0)) * 16);
        ctx.stroke();
        ctx.restore();
        for (let q = 0; q < 3; q++) {
          ctx.save();
          ctx.translate(x + 30 + q * 20, y + 30);
          ctx.fillStyle = q === 1 ? "#ffd84a" : "#3a4248";
          ctx.fillRect(-5, -5, 10, 40);
          ctx.restore();
        }
        ctx.save();
        ctx.translate(x - rr, y);
        ctx.rotate(ang);
        BB.rrect(-40, -44, 240, 88, 24, "#e8e2cd", COL.ink, 6);
        for (let i = 0; i < 2; i++) {
          BB.rrect(40 + i * 70, -44, 22, 88, 4, "#ffd84a", COL.ink, 4);
        }
        ctx.fillStyle = "#7ef0ff";
        ctx.strokeStyle = COL.ink;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(150, -18);
        ctx.lineTo(132, 2);
        ctx.lineTo(146, 2);
        ctx.lineTo(134, 22);
        ctx.lineTo(162, -4);
        ctx.lineTo(148, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        BB.rrect(190, -54, 36, 108, 10, "#d24a3c", COL.ink, 6);
        ctx.fillStyle = COL.ink;
        ctx.beginPath();
        ctx.ellipse(226, 0, 10, 36, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.55)";
        BB.rrect(-20, -32, 180, 10, 5, "rgba(255,255,255,.55)", null, 0);
        ctx.restore();
        if (fv < 1.4) {
          ctx.save();
          if (fv < 0.18) {
            const fs = 1 + fv * 8;
            ctx.translate(mx + Math.cos(ang) * 40, my + Math.sin(ang) * 40);
            ctx.rotate(ang);
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = "rgba(255,230,120,.95)";
            ctx.beginPath();
            for (let q = 0; q < 12; q++) {
              const a = q / 12 * Math.PI * 2, r = (q % 2 ? 40 : 120) * fs * (q === 0 ? 1.8 : 1);
              ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.8);
            }
            ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.95)";
            ctx.beginPath();
            ctx.ellipse(0, 0, 60 * fs, 34 * fs, 0, 0, 7);
            ctx.fill();
            ctx.setTransform(ctx.getTransform());
          }
          ctx.restore();
          ctx.save();
          const u = fv / 1.4;
          ctx.globalAlpha = (1 - u) * 0.9;
          ctx.strokeStyle = "#fff6c8";
          ctx.lineWidth = 14 * (1 - u) + 2;
          ctx.beginPath();
          ctx.ellipse(mx, my, 40 + u * 420, 20 + u * 200, ang, 0, 7);
          ctx.stroke();
          for (let q = 0; q < 7; q++) {
            const a = ang + (q - 3) * 0.35, d = 60 + u * (180 + q * 30);
            ctx.globalAlpha = (1 - u) * 0.75;
            ctx.fillStyle = q % 2 ? "#c9c3b8" : "#e8e2d6";
            ctx.beginPath();
            ctx.arc(mx + Math.cos(a) * d, my + Math.sin(a) * d - u * 80, 30 + u * 70, 0, 7);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      BB.text("BOX LAUNCHER", x, y + 122, 20, "#fff", { stroke: 4 });
    }
    drawKO(k, t) {
      const bi = barAt(k), bt = bi * 4 + (k - BS[Math.max(0, Math.min(bi, KO_BARS.length))]) / KO_B, bar = KO_BARS[bi], gone = k >= KO_BIG;
      let last = null;
      for (const h of KO_HITS)
        if (k >= h[0])
          last = h;
      const since = last ? k - last[0] : 9, kd = last && last[1];
      const sd = kd === "L" ? 1 : kd === "R" || kd === "push" ? -1 : kd === "chunk" ? (Math.sin(since * 40) > 0 ? 1 : -1) * Math.exp(-since * 3) : 0;
      let jx = JR.x + sd * 110 * Math.exp(-since * 6) * Math.cos(since * 30), jy = JR.y, rot = sd * 0.28 * Math.exp(-since * 6), sq = 0;
      {
        const nx = KO_HITS.find((h) => h[0] > k && h[0] - k < 0.16 && (h[1] === "L" || h[1] === "R"));
        if (nx) {
          const a = 1 - (nx[0] - k) / 0.16, e = a * a * (3 - 2 * a);
          jx += (nx[1] === "L" ? -1 : 1) * -28 * e;
          rot += (nx[1] === "L" ? -1 : 1) * -0.06 * e;
          sq = Math.max(sq, -0.06 * e);
        }
      }
      {
        const g = this.gag, gv = g ? BB.t - g.t : 9;
        if (g && g.kind === "mw" && gv < g.dur + 1.2) {
          const st = Math.min(gv, g.dur) / g.beat, f = Math.floor(st) + Math.min(1, st % 1 * 2.5);
          jx -= Math.min(f, 4) * 55;
          rot += Math.sin(st * Math.PI) * 0.04;
        }
        if (g && g.kind === "67")
          rot += Math.sin(gv * 12) * 0.03;
      }
      if (kd === "stomp" && since < 0.5) {
        jy -= Math.sin(since / 0.5 * Math.PI) * 90;
        sq = since < 0.08 ? 0.25 : 0;
      }
      if (["rain", "zap", "pat", "stamp", "pick"].includes(kd) && since < 0.6)
        sq = Math.max(0, 0.35 - since * 0.7);
      {
        const hv = this.heroV(k);
        if (hv != null && hv >= 0 && hv < 0.5) {
          sq = 0.5 * (1 - hv / 0.5);
          jx += [0, 120, 0, 0][this.heroS] * Math.exp(-hv * 6);
          jy -= [140, 0, 0, 160][this.heroS] * Math.sin(Math.min(1, hv / 0.5) * Math.PI);
          rot += [0.1, 0.4, 0, 0.2][this.heroS] * Math.exp(-hv * 5);
        }
      }
      if (bar && bar.read && !gone) {
        const qb = BL[bi] / 4, ph = (k - BS[bi]) / qb % 1;
        jy -= 180 + Math.sin(ph * Math.PI) * 140;
        rot += Math.sin(k * 9) * 0.2;
      }
      if (since < 0.3 && (kd === "L" || kd === "R") && !gone) {
        sq = Math.max(sq, 0.18 * Math.sin(since * 60) * Math.exp(-since * 8));
      }
      const md = bar && bar.mode;
      if (md === "sneak") {
        jx += Math.sin((k - KO_T0) / KO_B * Math.PI / 2) * 160;
        jy -= Math.abs(Math.sin((k - KO_T0) / KO_B * Math.PI)) * 20;
      }
      if (md === "throw")
        rot += Math.sin(t * 14) * 0.05;
      if (kd === "chunk" && since < 1.4) {
        const tri = (x) => 1 - Math.abs(x % 2 - 1);
        jx = lerp(JR.x, W - 250, tri(since * 2.2));
        jy = JR.y - Math.abs(Math.sin(since * 7)) * 120 * (1.4 - since);
        rot = since * 14;
        sq = 0;
      }
      if (k >= KO_LAUNCH) {
        const u = k - KO_LAUNCH;
        jx = JR.x + u * 1500;
        jy = JR.y - u * 1700 + u * u * 900;
        rot = u * 14;
      }
      let dmg = 0, tot = 0;
      for (const [hk, kind] of KO_HITS) {
        if (KO_ATK(kind))
          continue;
        const w = kind === "chunk" ? 6 : kind === "big" ? 6 : 1;
        tot += w;
        if (k >= hk)
          dmg += w;
      }
      const hpf = 1 - dmg / tot;
      if (k < KO_CEL) {
        const x = W - 40 - 400 + 20, y = 200, w = 360;
        BB.rrect(x - 20, y - 54, w + 40, 110, 28, "rgba(12,16,28,.85)", "#ff8adf", 3);
        BB.text("STATIC JR. POWER", x + w / 2, y - 24, 24, "#ffd6f4", { stroke: 0 });
        BB.rrect(x, y, w, 28, 10, "#2a2233", null, 0);
        if (hpf > 0)
          BB.rrect(x, y, w * hpf, 28, 10, BB.lg(y, y + 28, ["#ff9ad8", "#c03a8e"]), null, 0);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, 28);
        if (since < 0.25 && last && !KO_ATK(kd)) {
          ctx.save();
          ctx.globalAlpha = 1 - since / 0.25;
          BB.rrect(x + w * hpf, y, Math.min(w * (1 - hpf), 40), 28, 6, "#fff", null, 0);
          ctx.restore();
        }
      }
      const post = [];
      post.push(() => {
        if (bar && bar.turn && !gone) {
          const us = bar.turn === "us", BY = 318;
          BB.rrect(W / 2 - 330, BY, 660, 66, 22, us ? "#ffe066" : "#ff8adf", COL.ink, 4);
          BB.text(us ? bar.rush ? "EVERY CLAP = ONE PUNCH!" : "PIANO TO FORTE: LOUDER = BIGGER BLAST!" : "STATIC JR. ATTACKS: DODGE!", W / 2, BY + 34, 38, us ? "#3a2a00" : "#3a1040", { stroke: 0, maxW: 620 });
        }
      });
      {
        const lc = KO_PHASE_END.filter((x) => x <= k).pop(), hs = this.hitShow;
        if (hs && k - hs.k >= 0 && k - hs.k < 1.6) {
          this.drawBlastRing(JR.x, JR.y - 90, hs.r || BLAST_R[hs.lv], (k - hs.k) / 0.7);
        }
        if (hs && k - hs.k >= 0 && k - hs.k < 1.6)
          BB.text(["BLAST!", "BIG BLAST!", "MEGA BLAST!"][hs.lv], W / 2, 640 - (k - hs.k) * 30, [90, 104, 124][hs.lv], ["#ffe066", "#ff8adf", "#7ef0ff"][hs.lv], { font: "Rammetto One", stroke: 10, strokeCol: "#1a1a1a" });
        if (0) {
          ctx.save();
          ctx.globalAlpha = 1 - (k - lc - 0.6) / 0.5;
          ctx.strokeStyle = "#ffe066";
          ctx.shadowColor = "#ffe066";
          ctx.shadowBlur = 60;
          ctx.lineWidth = 90;
          ctx.beginPath();
          ctx.moveTo(LCH.x - 150, LCH.y - 60);
          ctx.lineTo(JR.x, JR.y - 60);
          ctx.stroke();
          ctx.restore();
        }
      }
      if (bar && bar.tp && !bar.beam) {
        const tp = bar.tp, u = (k - BS[bi]) / BL[bi];
        const dlx = this.deluxe && tp.w === "PRESTISSIMO";
        if (bar.pwr === 1) {
          const s = 0.8 + 0.2 * ease.back(clamp(u * 3, 0, 1));
          ctx.save();
          ctx.translate(730, 560);
          ctx.scale(s, s);
          BB.panel(-490, -120, 980, 240, 30);
          if (dlx) {
            const g = ctx.createLinearGradient(-490, 0, 490, 0);
            ["#ff5a5a", "#ffb020", "#ffe066", "#6ee678", "#5ac8fa", "#b07aff"].forEach((c, j) => g.addColorStop(j / 5, c));
            ctx.strokeStyle = g;
            ctx.lineWidth = 12;
            ctx.strokeRect(-500, -130, 1e3, 260);
            BB.text("ALL 4 BEAT CHIPS: DELUXE ULTRA UNLOCKED!", 0, -150, 44, "#ffd63c", { stroke: 8, strokeCol: "#782814", maxW: 1100 });
          }
          BB.text("CLAP PARTY!", 0, -50, 62, COL.yellow, { stroke: 9, maxW: 940 });
          BB.text("Clap fast! Faster = sillier! Can we hit PRESTISSIMO?", 0, 40, 40, "#fff", { stroke: 5, maxW: 940 });
          ctx.restore();
        } else {
          const tw = TIERS[tierOf(this.cpm || 0)][0], s = 1 + 0.25 * Math.exp(-(BB.t - (this.lastCl || 0)) * 8);
          ctx.save();
          ctx.translate(730, 580);
          ctx.scale(s, s);
          BB.text(dlx ? "MEGA " + tw : tw, 0, 0, tw.length > 8 ? dlx ? 78 : 96 : 130, dlx ? "#ffd63c" : "#ff8adf", { font: "Rammetto One", stroke: 12, strokeCol: "#3a1040" });
          ctx.restore();
          BB.text("CLAP FASTER! FASTER!", 730, 680, 40, "#fff", { stroke: 5 });
        }
      }
      if (this.blasts) {
        this.blasts = this.blasts.filter((b) => BB.t - b.t < 0.5);
        for (const b of this.blasts) {
          const u = (BB.t - b.t) / 0.35;
          if (u < 1) {
            const x = lerp(b.x, jx, u), y = lerp(H, jy - 60, u);
            {
              const r = (26 + u * 20) * (b.s || 1);
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(u * 6);
              ctx.beginPath();
              for (let q = 0; q < 10; q++) {
                const a = q / 10 * Math.PI * 2, rr = q % 2 ? r * 0.5 : r;
                ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
              }
              ctx.closePath();
              ctx.fillStyle = "#ffe066";
              ctx.strokeStyle = COL.ink;
              ctx.lineWidth = 6;
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
          } else
            BB.text("POW!", jx - 200, jy - 160, 60 * (b.s || 1), "#ffe066", { font: "Rammetto One", stroke: 7 });
        }
      }
      for (const [hk, kind] of KO_HITS) {
        if (KO_ATK(kind) || kind === "chunk" || kind === "big")
          continue;
        const u = (k - (hk - 0.25)) / 0.25;
        if (u >= 0 && u < 1) {
          ctx.save();
          ctx.globalAlpha = 0.7;
          ctx.strokeStyle = "#fff38a";
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(lerp(W / 2, jx, u), lerp(H + 40, jy - 60, u), 40, 0, 7);
          ctx.stroke();
          ctx.restore();
        }
      }
      if (bar && bar.turn && !gone) {
        const prev = KO_BARS[bi - 1];
        if (!prev || prev.turn !== bar.turn) {
          const v = (k - BS[bi]) / BL[bi];
          if (v < 0.35) {
            const s = lerp(3, 1, ease.out(clamp(v / 0.12, 0, 1)));
            ctx.save();
            ctx.globalAlpha = v < 0.25 ? 1 : 1 - (v - 0.25) / 0.1;
            ctx.translate(W / 2, 540);
            ctx.scale(s, s);
            ctx.rotate(-0.06);
            BB.text(bar.turn === "us" ? "CLAP ATTACK!" : "DODGE!", 0, 0, 190, bar.turn === "us" ? "#6ee678" : "#7ef0ff", { font: "Rammetto One", stroke: 16, strokeCol: "#2a1040" });
            ctx.restore();
            if (v < 0.04) {
              ctx.fillStyle = "rgba(255,255,255,.45)";
              ctx.fillRect(0, 0, W, H);
            }
          }
        }
      }
      if (bar && bar.pwr === 2) {
        const v = (k - BS[bi]) / BL[bi];
        if (v < 0.25) {
          const s = lerp(2.6, 1, ease.out(clamp(v / 0.1, 0, 1)));
          ctx.save();
          ctx.globalAlpha = 1 - v / 0.25;
          ctx.translate(W / 2, 420);
          ctx.scale(s, s);
          BB.text(bar.tp.w + "!", 0, 0, 170, "#ff8adf", { font: "Rammetto One", stroke: 16, strokeCol: "#3a1040" });
          ctx.restore();
        }
      }
      for (const [hk, kind] of KO_HITS) {
        const v = k - hk;
        if (v < 0 || v > 0.12)
          continue;
        if (kind === "chunk" || kind === "big") {
          ctx.fillStyle = `rgba(255,250,220,${0.7 * (1 - v / 0.12)})`;
          ctx.fillRect(0, 0, W, H);
        } else if (!KO_ATK(kind)) {
          ctx.fillStyle = `rgba(255,240,180,${0.15 * (1 - v / 0.12)})`;
          ctx.fillRect(0, 0, W, H);
        }
      }
      if (!gone && hpf < 0.75)
        for (let i = 0; i < (hpf < 0.4 ? 3 : 1); i++) {
          const ph = (t * 0.8 + i / 3) % 1;
          ctx.save();
          ctx.globalAlpha = 0.5 * (1 - ph);
          ctx.fillStyle = "#8a8f99";
          ctx.beginPath();
          ctx.arc(jx - 30 + i * 30 + Math.sin(t * 3 + i) * 10, jy - 200 - ph * 120, 18 + ph * 26, 0, 7);
          ctx.fill();
          ctx.restore();
        }
      if (k >= KO_LAUNCH && this.deluxe && k - KO_LAUNCH < 1.6) {
        const cols = ["#ff5a5a", "#ffb020", "#ffe066", "#6ee678", "#5ac8fa", "#b07aff"];
        ctx.save();
        ctx.lineCap = "round";
        cols.forEach((c, j) => {
          ctx.strokeStyle = c;
          ctx.lineWidth = 22;
          ctx.beginPath();
          for (let q = 0; q <= 20; q++) {
            const u = Math.max(0, k - KO_LAUNCH - 0.6 + q * 0.03);
            ctx.lineTo(JR.x + u * 1500, JR.y + (j - 2.5) * 20 - u * 1700 + u * u * 900 + 230);
          }
          ctx.stroke();
        });
        ctx.restore();
        if (k - KO_LAUNCH < 0.15) {
          ctx.fillStyle = "rgba(255,255,255,.8)";
          ctx.fillRect(0, 0, W, H);
        }
        BB.text("DELUXE ULTRA!", W / 2, 860, 120, "#ffd63c", { font: "Rammetto One", stroke: 14, strokeCol: "#782814" });
      }
      if (gone && k - KO_LAUNCH > 0.9 && k - KO_LAUNCH < 2.6) {
        const v = k - KO_LAUNCH - 0.9, s = Math.sin(Math.min(1, v / 0.3) * Math.PI / 2) * (1 + 0.3 * Math.sin(t * 20));
        ctx.save();
        ctx.translate(W - 260, 110);
        ctx.rotate(t * 2);
        ctx.scale(s * (this.deluxe ? 2 : 1), s * (this.deluxe ? 2 : 1));
        ctx.fillStyle = "#fff8c0";
        ctx.shadowColor = "#ffe066";
        ctx.shadowBlur = 40;
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          const r = j % 2 ? 14 : 70, a = j * Math.PI / 4;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.fill();
        ctx.restore();
      }
      if (bar && bar.turn === "us" && !gone) {
        if (bar.read)
          R.turnBorder(true);
        else
          this.drawSpeed(t);
      }
      {
        const nx = KO_BARS[bi + 1];
        if (bar && bar.read)
          this.drawCard(bar, (k - BS[bi]) / BL[bi], t);
        else if (nx && nx.read && k > BS[bi + 1] - 0.6)
          this.drawCard(nx, -1, t);
      }
      for (const [hk, kind] of KO_HITS) {
        if (kind !== "L" && kind !== "R")
          continue;
        const v = k - hk;
        if (v < -0.12 || v > 0.3 || gone)
          continue;
        const dir = kind === "L" ? 1 : -1, u = clamp((v + 0.12) / 0.16, 0, 1), hx = jx - dir * lerp(260, -40, u), hy = jy - 60;
        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(dir, 1);
        ctx.rotate(-0.3 + u * 0.5);
        BB.rrect(-70, -50, 110, 100, 30, BB.lg(-50, 50, ["#ecc088", "#b88246"]), "#5a3a1e", 5);
        for (let f = 0; f < 4; f++)
          BB.rrect(30, -48 + f * 25, 60, 22, 10, "#ecc088", "#5a3a1e", 4);
        BB.rrect(-40, -80, 40, 40, 14, "#ecc088", "#5a3a1e", 4);
        BB.rrect(-170, -22, 110, 44, 10, BB.lg(-22, 22, ["#e2b272", "#b07a40"]), "#5a3a1e", 4);
        ctx.restore();
        if (v > 0 && v < 0.3)
          BB.text("SLAP!", jx + dir * 150, jy - 230 - v * 80, 56, "#ffe066", { font: "Rammetto One", stroke: 7 });
      }
      for (const p of this.has || []) {
        const v = BB.t - p.t;
        if (v < 1)
          BB.text(p.w, p.x, p.y - v * 60, 44 * (1 + 0.2 * Math.exp(-v * 8)), p.c, { stroke: 6 });
      }
      this.drawHero(k, t);
      if (bar && bar.pwr || bar && bar.clear && k - BS[bi] < 0.4) {
        const x = LCH.x - 175, y = LCH.y - 330, pw = clamp((KO_BARS[barAt(k)] || {}).voice ? (this.vf || 0) / 3 : this.pw || 0, 0, 1);
        BB.rrect(x - 30, y - 30, 60, 240, 20, "#1e2228", "#fff", 4);
        BB.rrect(x - 22, y - 22 + 224 * (1 - pw), 44, 224 * pw, 14, this.deluxe && bar.tp && bar.tp.w === "PRESTISSIMO" ? BB.lg(y, y + 210, ["#ff5a5a", "#ffb020", "#ffe066", "#6ee678", "#5ac8fa", "#b07aff"]) : BB.lg(y, y + 210, ["#fff38a", "#ffb020"]), null, 0);
        BB.text("POWER", x, y + 240, 28, COL.yellow, { stroke: 4 });
        if (pw >= 1)
          BB.text("FULL!", x, y - 60, 44, "#6ee678", { font: "Rammetto One", stroke: 6 });
      }
      if (k < 0.6 && BB.q) {
        ctx.save();
        ctx.globalAlpha = 0.3 * (1 - Math.max(0, k) / 0.6);
        for (let i = 0; i < 30; i++) {
          ctx.fillStyle = Math.random() < 0.5 ? "#fff" : "#7ef0ff";
          ctx.fillRect(Math.random() * W, Math.random() * H, 60 + Math.random() * 300, 3 + Math.random() * 5);
        }
        ctx.restore();
      }
      {
        const sc = BB.t - (this.lastCl || -9);
        this.flinch = since < 0.22 && last && !KO_ATK(kd) || sc < 0.22;
        if (sc < 0.35 && !gone) {
          const dir = (this.combo || 0) % 2 ? 1 : -1;
          jx += dir * 60 * Math.exp(-sc * 12);
          sq = Math.max(sq, 0.22 * Math.exp(-sc * 10));
          rot += dir * 0.12 * Math.exp(-sc * 10);
        }
        if (hpf < 0.2 && !gone)
          rot += Math.sin(t * 3) * 0.06;
      }
      if (gone && k < KO_LAUNCH)
        this.drawTransform(k - KO_BIG, t);
      this.jp = { x: jx, y: jy };
      if (jy > -400 && jx < W + 400 && !(k >= KO_BIG + 0.45)) {
        ctx.save();
        ctx.translate(jx, jy);
        ctx.rotate(rot);
        ctx.scale(1 + sq * 0.6, 1 - sq);
        BB.staticJr(0, 230, 300, { dizzy: hpf < 0.2 || gone, flip: md === "sneak" && Math.cos((k - KO_T0) / KO_B * Math.PI / 2) < 0, glitch: 0.2 + 0.15 * Math.sin(t * 20), noShadow: gone });
        this.drawDmg(1 - hpf, t, gone);
        ctx.restore();
        {
          const g = this.gag, gv = g ? BB.t - g.t : 9;
          if (g && g.kind === "67" && gv < g.dur) {
            for (const sd2 of [-1, 1]) {
              const bob = Math.cos(gv * Math.PI / 0.8 + (sd2 > 0 ? Math.PI : 0)) * 40;
              ctx.save();
              ctx.translate(jx + sd2 * 190, jy - 60 + bob);
              BB.rrect(-45, -20, 90, 40, 18, "#e2b272", "#5a3a1e", 5);
              BB.rrect(-30, -34, 60, 22, 10, "#efe3c8", "#5a3a1e", 4);
              ctx.restore();
            }
            BB.text(gv < 0.8 ? "6..." : "6... 7!", jx - 330, jy - 60, 72, "#ffe066", { font: "Rammetto One", stroke: 8 });
          }
          if (g && g.kind === "mw" && gv < g.dur)
            BB.text("hee-hee!", jx - 300, jy - 60, 64, "#ff8adf", { stroke: 7 });
          if (g && g.kind === "mw" && gv > g.dur + 1.2)
            this.gag = null;
        }
        if (k > KO_T0) {
          ctx.save();
          ctx.strokeStyle = "#bff8ff";
          ctx.lineWidth = 3;
          for (let i = 0; i < 5; i++) {
            const a = t * 7 + i * 1.3, r = 150 + 20 * Math.sin(t * 13 + i);
            ctx.beginPath();
            ctx.moveTo(jx + Math.cos(a) * r, jy + 40 + Math.sin(a) * r * 0.6);
            ctx.lineTo(jx + Math.cos(a + 0.2) * (r + 25), jy + 40 + Math.sin(a + 0.2) * r * 0.6 - 12);
            ctx.stroke();
          }
          ctx.restore();
        }
        if (bi >= 14 && !gone)
          for (let i = 0; i < 4; i++) {
            const a = t * 5 + i * Math.PI / 2;
            BB.text("\u2605", jx + Math.cos(a) * 110, jy - 160 + Math.sin(a) * 26, 40, "#ffe066", { stroke: 4 });
          }
      }
      post.push(() => {
        if (md && !gone && !(this.gag && BB.t - this.gag.t < 2)) {
          const lines = { sneak: "tip... toe... hee hee", throw: "catch THIS!", freeze: "statues?! no fair!" };
          lines[md] && R.bubble(jx, jy - 200, lines[md]);
        }
        if (bar && bar.line && !gone)
          R.bubble(jx, jy - 200, bar.line);
      });
      const box = (x, y, s, r, lab) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r);
        ctx.scale(s, s);
        this.paintBox(0, lab);
        ctx.restore();
      };
      const glove = (x, y, dir) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(dir, 1);
        for (let q = 0; q < 4; q++) {
          const x0 = -900 + q * 200, hh = 34 - q * 4;
          BB.rrect(x0, -hh / 2, 210, hh, 8, BB.lg(-hh / 2, hh / 2, ["#e3eaee", "#8d9aa3", "#5b666e"]), "#2a2f35", 4);
          ctx.fillStyle = "#ffd84a";
          ctx.fillRect(x0 + 180, -hh / 2 + 3, 8, hh - 6);
          ctx.fillStyle = "#2a2f35";
          ctx.beginPath();
          ctx.arc(x0 + 20, 0, 4, 0, 7);
          ctx.fill();
        }
        BB.rrect(-150, -30, 60, 60, 10, BB.lg(-30, 30, ["#9aa6ae", "#4d575e"]), "#2a2f35", 4);
        for (let q = 0; q < 3; q++) {
          ctx.strokeStyle = "#2a2f35";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-140 + q * 18, -30);
          ctx.lineTo(-140 + q * 18, 30);
          ctx.stroke();
        }
        BB.rrect(-100, -46, 30, 92, 8, "#f4f0e6", "#2a2f35", 4);
        BB.rrect(-74, -64, 140, 128, 52, BB.lg(-64, 64, ["#ff7a6a", "#d8322a", "#8e1a16"]), "#3a0e0c", 6);
        BB.rrect(-30, -80, 70, 58, 26, BB.lg(-80, -22, ["#ff8a7a", "#c42a24"]), "#3a0e0c", 5);
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.beginPath();
        ctx.ellipse(10, -30, 26, 10, -0.3, 0, 7);
        ctx.fill();
        ctx.restore();
      };
      for (const [hk, kind] of KO_HITS) {
        const u = (k - (hk - 0.25)) / 0.25;
        if (k < hk - 1.3 || k > hk + 1)
          continue;
        const ty = JR.y - 60;
        if (kind === "L" || kind === "R") {
          const dir = kind === "L" ? 1 : -1, x0 = kind === "L" ? -120 : W + 120, x1 = jx - dir * 130, x = u <= 1 ? lerp(x0, x1, ease.in ? ease.in(u) : u * u) : lerp(x1, x0, Math.min(1, (u - 1) * 1.6));
          glove(x, ty + (kind === "L" ? -20 : 20), dir);
        }
        if (kind === "rain") {
          for (let i = 0; i < 3; i++) {
            const uu = u - i * 0.15;
            if (uu < 0)
              continue;
            const y = uu <= 1 ? lerp(-150, jy - 330, uu * uu) : jy - 330 - Math.sin(Math.min(1, uu - 1) * Math.PI) * 160 + (uu - 1) * 600 * (uu - 1);
            box(jx + (i - 1) * 90 + (uu > 1 ? (i - 1) * (uu - 1) * 400 : 0), y, 0.8, uu * 3 * (i - 1));
          }
        }
        if (kind === "zap") {
          const v = k - (hk - KO_B * 1.5);
          if (v > 0 && v < KO_B * 1.5 + 0.4) {
            const p = v / (KO_B * 1.5);
            const x = p < 0.5 ? lerp(jx - 100, 200, p * 2) : lerp(200, jx, (p - 0.5) * 2), y = p < 0.5 ? lerp(jy - 200, 260, p * 2) : lerp(260, jy - 200, (p - 0.5) * 2);
            if (p < 1) {
              ctx.save();
              ctx.strokeStyle = "#bff8ff";
              ctx.shadowColor = "#7ef0ff";
              ctx.shadowBlur = 24;
              ctx.lineWidth = 8;
              ctx.beginPath();
              ctx.moveTo(x - 50, y - 15);
              for (let i = 0; i < 5; i++)
                ctx.lineTo(x - 50 + i * 25, y + (i % 2 ? 20 : -20));
              ctx.stroke();
              ctx.restore();
              if (p > 0.3 && p < 0.6)
                BB.text("BOING! it bounced back!", 200, 200, 34, "#fff", { stroke: 5 });
            }
          }
        }
        if (KO_ATK(kind) && kind !== "zap") {
          const fl = 1.2, v = (k - (hk - fl)) / fl;
          if (v < 0 || v > 1.5)
            continue;
          const i = KO_HITS.findIndex((h) => h[0] === hk && h[1] === kind), lane = throwLane(kind, KO_HITS.slice(0, i).filter((h) => h[1] === "bomb").length), tire = kind === "junkF";
          const junk = kind === "bomb" ? "bomb" : tire ? "tire" : lane === "left" ? "sock" : lane === "right" ? "chicken" : i % 2 ? "sock" : "chicken";
          const P = tire ? throwPath(lane, v, JR.x - 40, JR.y + 170) : throwPath(lane, v, lane === "right" || lane === "botR" ? JR.x + 60 : JR.x - 90, JR.y - 40);
          if (!P)
            continue;
          ctx.save();
          ctx.globalAlpha = P.a;
          ctx.translate(P.x, P.y - (tire ? 62 * P.sc : 0));
          ctx.scale(P.sc, P.sc);
          {
            const TT = throwTurn(lane, v, tire ? "tire" : junk);
            ctx.rotate(TT.rot);
            ctx.scale(TT.sx, 1);
          }
          if (tire)
            this.drawTireRoll(v * 16);
          else
            this.drawJunk(junk, t);
          ctx.restore();
          if (v < 1 && v > 0.15 && !tire) {
            ctx.save();
            ctx.globalAlpha = 0.6 * (1 - v);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 5;
            const bk = throwPath(lane, Math.max(0, v - 0.15), lane === "right" || lane === "botR" ? JR.x + 60 : JR.x - 90, JR.y - 40);
            if (bk) {
              ctx.beginPath();
              ctx.moveTo(bk.x, bk.y);
              ctx.lineTo(P.x, P.y);
              ctx.stroke();
            }
            ctx.restore();
          }
          if (v >= 1 && v < 1.5) {
            const w = v - 1, al = clamp(1 - w / 0.5, 0, 1), T = LANE_TG[lane], tx = clamp(T.x, 330, W - 330), ty2 = clamp(T.y - (tire ? 60 : 120), SAFE_Y + 40, H - 120);
            ctx.save();
            ctx.globalAlpha = al;
            if (kind === "bomb") {
              ctx.fillStyle = "rgba(255,138,223,.5)";
              for (let q = 0; q < 9; q++) {
                const r = 60 + q % 3 * 40;
                ctx.beginPath();
                ctx.arc(T.x + Math.cos(q * 0.7) * r * 1.4, T.y + Math.sin(q * 0.7) * r, 44 + q % 4 * 16, 0, 7);
                ctx.fill();
              }
              BB.text("POOF! MISSED!", tx, ty2, 72, "#fff", { font: "Rammetto One", stroke: 9, strokeCol: "#3a1040" });
            } else
              BB.text(tire ? "BOING! JUMPED IT!" : "MISSED!", tx, ty2, 80, COL.yellow, { font: "Rammetto One", stroke: 10, strokeCol: "#3a1040" });
            ctx.restore();
          }
          continue;
        }
        if (kind === "pick") {
          const a = u <= 1 ? lerp(-1.9, 0.2, u * u) : lerp(0.2, -1.9, Math.min(1, (u - 1) * 1.5));
          ctx.save();
          ctx.translate(jx - 260, jy - 260);
          ctx.rotate(a + 1.57);
          ctx.fillStyle = "#8a5a2e";
          ctx.fillRect(-10, -260, 20, 260);
          ctx.translate(0, -260);
          ctx.beginPath();
          ctx.moveTo(-90, 10);
          ctx.quadraticCurveTo(0, -40, 90, 10);
          ctx.lineTo(0, -10);
          ctx.closePath();
          ctx.fillStyle = "#c9d6de";
          ctx.fill();
          ctx.strokeStyle = COL.ink;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        }
        if (kind === "pat") {
          const y = u <= 1 ? lerp(-150, jy - 210, u * u) : jy - 210 - Math.sin(Math.min(1, u - 1) * Math.PI) * 60;
          box(jx, y, 0.9, 0, "PAT!");
        }
        if (kind === "stamp") {
          const y = u <= 1 ? lerp(-300, jy - 260, u * u) : lerp(jy - 260, -300, Math.min(1, (u - 1) * 1.5));
          ctx.save();
          ctx.fillStyle = "#7d8c96";
          ctx.fillRect(jx - 14, -20, 28, y + 20);
          BB.rrect(jx - 110, y, 220, 70, 10, BB.lg(y, y + 70, ["#c9d6de", "#7d8c96"]), COL.ink, 5);
          BB.rrect(jx - 100, y + 70, 200, 22, 6, "#d24a3c", COL.ink, 4);
          ctx.restore();
        }
        if (kind === "push") {
          const x = u <= 1 ? lerp(W + 300, jx + 230, u) : jx + 230 + (u - 1) * 900, fy = JR.y + 150;
          ctx.save();
          BB.rrect(x - 40, fy - 150, 230, 150, 18, BB.lg(fy - 150, fy, ["#ffd63c", "#d9a020"]), COL.ink, 5);
          BB.rrect(x + 30, fy - 250, 120, 110, 12, "rgba(126,240,255,.25)", COL.ink, 5);
          ctx.fillStyle = "#3d4650";
          ctx.fillRect(x - 160, fy - 40, 140, 16);
          ctx.fillRect(x - 30, fy - 260, 16, 240);
          ctx.fillStyle = "#1e2228";
          ctx.beginPath();
          ctx.arc(x + 20, fy + 10, 32, 0, 7);
          ctx.arc(x + 150, fy + 10, 32, 0, 7);
          ctx.fill();
          ctx.restore();
        }
        if (kind === "stomp" && u >= 1 && u < 1.6) {
          ctx.save();
          ctx.globalAlpha = 1.6 - u;
          ctx.strokeStyle = "#ffe066";
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.ellipse(JR.x, JR.y + 10, (u - 1) * 600, (u - 1) * 80, 0, 0, 7);
          ctx.stroke();
          ctx.restore();
        }
      }
      {
        const u = (k - (KO_LAUNCH - 0.6)) / 0.3;
        if (0) {
          const L = k >= KO_LAUNCH, x = L ? jx - 200 : u <= 1 ? lerp(-300, JR.x - 200, ease.out(u)) : JR.x - 200, y = L ? jy - 60 : JR.y - 60;
          if (L) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot * 0.3);
            ctx.translate(-x, -y);
          }
          if (k > KO_LAUNCH - 0.15 && !L)
            this.drawMini(JR.x - 200, JR.y - 250 - Math.sin(t * 30) * 6, 0.5, t);
          box(x, y, this.deluxe ? 2.8 : 2.1, u <= 1 ? 0 : -0.05 * (u - 1), this.deluxe ? "DELUXE ULTRA RETURN" : "RETURN TO SENDER");
          if (L)
            ctx.restore();
        }
      }
      const WD = { pick: ["TINK!", "CLINK!"], pat: ["PAT!", "PAT-PAT!"], stamp: ["STAMP!", "KA-CHUNK!"], push: ["SHOVE!", "VROOM!"], chunk: ["WHAM!"], L: ["POW!", "BONK!", "BAM!"], R: ["WHAM!", "BOP!", "SMACK!"], stomp: ["THUD!"], rain: ["CLONK!"], zap: ["ZZT-OOPS!"] };
      KO_HITS.forEach(([hk, kind], i) => {
        const v = k - hk;
        if (kind === "big" || v < 0 || v >= 0.4 || !WD[kind])
          return;
        const w = WD[kind][i % WD[kind].length], s = 1 + 0.4 * Math.exp(-v * 12);
        ctx.save();
        ctx.translate(JR.x + (kind === "R" ? -240 : 240), JR.y - 300 - v * 40);
        ctx.scale(s, s);
        ctx.rotate(i % 2 ? 0.12 : -0.12);
        BB.text(w, 0, 0, 76, COL.yellow, { font: "Rammetto One", stroke: 9 });
        ctx.restore();
      });
      {
        const v = k - KO_LAUNCH;
        if (0) {
          const s = 0.6 + 0.6 * (ease.back ? ease.back(clamp(v / 0.3, 0, 1)) : 1);
          ctx.save();
          ctx.translate(W / 2 + 220, 330);
          ctx.scale(s, s);
          ctx.rotate(-0.08);
          BB.text("KA-BOING!", 0, 0, 120, "#ff8adf", { font: "Rammetto One", stroke: 12, strokeCol: "#3a1040" });
          ctx.restore();
        }
      }
      if (0)
        BB.text("beep-boop-byeee...!", Math.min(W - 200, JR.x + (k - KO_LAUNCH) * 900), Math.max(80, JR.y - (k - KO_LAUNCH) * 1100), 40, "#fff", { stroke: 6 });
      if (md === "freeze") {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#bff8ff";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      post.forEach((f) => f());
      if (bar && bi >= 0 && !(gone && k > KO_BIG + 1)) {
        const bb = bt - bi * 4, pop = 1 + 0.06 * Math.exp(-(bb % 1) * 10), cx = W / 2, cy = 150;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(pop, pop);
        BB.panel(-560, -110, 1120, 220, 30);
        this.koIcon(bar.ic, -440, -10, t);
        let txt = bar.cue;
        if (bar.count === 1)
          txt = bar.tp ? bar.cue : bar.cue + "  " + ["1", "2", "3", "4"][Math.min(3, bb | 0)];
        if (bar.count === 2)
          txt = "EVERYBODY GET LOW... " + ["1", "2", "3", "4"][Math.min(3, bb | 0)];
        BB.text(txt, 60, -20, txt.length > 16 ? 54 : 78, COL.yellow, { font: "Rammetto One", stroke: 8, maxW: 820 });
        for (let q = 0; q < 4; q++)
          BB.rrect(-110 + q * 90, 50, 60, 34, 12, q === (bb | 0) ? "#6ee678" : "#2d4744", "#fff", 3);
        ctx.restore();
        const nx = KO_BARS[bi + 1];
        if (nx && bb > 2 && !(KO_BARS[bi] && (KO_BARS[bi].chant || KO_BARS[bi].chantIntro)))
          BB.text("NEXT: " + nx.cue, cx, cy + 150, 34, "#fff", { stroke: 5, maxW: 900 });
        if (bb % 1 < 0.5 && !bar.count && !bar.chant && !bar.chantIntro)
          R.bubble(LCH.x + 20, LCH.y - 300, bar.cue.toLowerCase());
      }
      if (!this.cel)
        (this.q || ((f) => f())).call(this, () => BB.button(W - 300, 30, 260, 90, "SKIP", { size: 40, id: "koskip", onClick: () => this.skipKO() }));
      if (k > KO_CEL) {
        const a = clamp((k - KO_CEL) / 0.4, 0, 1), s = 0.7 + 0.3 * ease.back(a);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(W / 2, 190);
        ctx.scale(s, s);
        BB.text("DELIVERY DOCK FIXED!", 0, 0, 92, "#ffd63c", { font: "Rammetto One", stroke: 12, strokeCol: "#782814" });
        if (BB.V2.chip) {
          const im = BB.V2.chip, h = 150, w = im.width * h / im.height;
          BB.glow(0, 170, 110, "rgba(255,220,120,A)", 0.5);
          ctx.drawImage(im, -w / 2, 170 - h / 2, w, h);
        }
        BB.text("Level 4 Beat Chip earned!", 0, 275, 40, "#fff", { stroke: 6 });
        BB.panel(-430, 320, 860, 90, 24);
        BB.text("Great work, Rhythm Engineers!", 0, 366, 44, COL.yellow, { stroke: 5 });
        ctx.restore();
        if (this.deluxe) {
          ctx.save();
          ctx.globalAlpha = a;
          ctx.translate(W - 250, 520);
          ctx.rotate(0.12 + Math.sin(t * 2) * 0.04);
          for (let j = 0; j < 16; j++) {
            ctx.fillStyle = ["#ff5a5a", "#ffb020", "#ffe066", "#6ee678", "#5ac8fa", "#b07aff"][j % 6];
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 140, j * Math.PI / 8, (j + 1) * Math.PI / 8);
            ctx.fill();
          }
          ctx.fillStyle = "#ffd63c";
          ctx.beginPath();
          ctx.arc(0, 0, 105, 0, 7);
          ctx.fill();
          ctx.strokeStyle = "#782814";
          ctx.lineWidth = 6;
          ctx.stroke();
          BB.text("DELUXE", 0, -22, 40, "#782814", { font: "Rammetto One", stroke: 0 });
          BB.text("ULTRA", 0, 26, 44, "#782814", { font: "Rammetto One", stroke: 0 });
          ctx.restore();
        } else {
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          BB.panel(W / 2 - 430, 700, 860, 110, 24);
          BB.text("Beat Chips: " + (this.chips || 0) + " of 4", W / 2, 735, 34, "#ffd63c", { stroke: 4 });
          BB.text("Collect all 4 Beat Chips to unlock DELUXE ULTRA!", W / 2, 780, 30, "#fff", { stroke: 4, maxW: 820 });
          ctx.restore();
        }
      }
    }
    heroV(k) {
      let best = null;
      for (const h of this.heroes || []) {
        const v = k - h.t, w = h.w || 0.6;
        if (v > -w - 0.1 && v < 0.8 && (best == null || Math.abs(v) < Math.abs(best))) {
          best = v;
          this.heroS = h.style;
          this.heroW = w;
        }
      }
      return best;
    }
    drawSpeed(t) {
      const c = this.cpm || 0, ti = tierOf(c), fire = ti === 4;
      R.turnBorder(true);
      const w = 480, x = W / 2 - w / 2 - 20, y = H - 240;
      BB.panel(x, y, w + 40, 210, 26);
      BB.text("CLAP SPEED", x + 20 + w / 2, y + 40, 26, "#ffd84a", { stroke: 0 });
      TIERS.forEach(([n, lo, col], i) => {
        const hi = (TIERS[i + 1] || [0, 240])[1], x0 = x + 20 + lo / 240 * w, x1 = x + 20 + hi / 240 * w;
        ctx.globalAlpha = i <= ti ? 1 : 0.3;
        BB.rrect(x0 + 2, y + 60, x1 - x0 - 4, 30, 8, col, null, 0);
        ctx.globalAlpha = 1;
      });
      const nx = x + 20 + clamp(c, 0, 240) / 240 * w;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(nx, y + 94);
      ctx.lineTo(nx - 12, y + 114);
      ctx.lineTo(nx + 12, y + 114);
      ctx.fill();
      const s = 1 + 0.15 * Math.exp(-(BB.t - (this.lastCl || 0)) * 8);
      ctx.save();
      ctx.translate(x + 20 + w / 2, y + 152);
      ctx.scale(s, s);
      BB.text(TIERS[ti][0], 0, 0, ti === 4 ? 50 : 56, TIERS[ti][2], { stroke: 8 });
      ctx.restore();
      if (this.combo > 2 && BB.t - this.lastCl < 0.8)
        BB.text("COMBO x" + this.combo + "!", x + w + 180, y + 105, 52, "#ffe066", { stroke: 8 });
      if (fire) {
        const f = 1 + 0.08 * Math.sin(t * 25);
        ctx.save();
        ctx.translate(W / 2, H - 300);
        ctx.scale(f, f);
        BB.text("ON FIRE!", 0, 0, 90, "#ffb020", { stroke: 14, strokeCol: "#7a1a00" });
        ctx.restore();
        BB.burst(W / 2 + (Math.random() - 0.5) * 400, H - 300, 1, { cols: ["#ff5a20", "#ffb020", "#ffe066"], kind: "spark", size: 12, speed: 200, g: -400, life: 0.8 });
      }
    }
    drawFist(x, y, s, rot) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s, s);
      BB.rrect(-170, -60, 170, 120, 20, BB.lg(-60, 60, ["#e2b272", "#b07a40"]), "#5a3a1e", 6);
      BB.rrect(-10, -95, 150, 190, 46, BB.lg(-95, 95, ["#ecc088", "#b88246"]), "#5a3a1e", 7);
      ctx.strokeStyle = "#5a3a1e";
      ctx.lineWidth = 6;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(60, -95 + 48 * (i + 1));
        ctx.lineTo(140, -95 + 48 * (i + 1));
        ctx.stroke();
      }
      BB.rrect(0, 30, 70, 46, 18, "#ecc088", "#5a3a1e", 6);
      ctx.fillStyle = "rgba(240,220,170,.85)";
      ctx.fillRect(-170, -12, 170, 24);
      ctx.restore();
    }
    drawHero(k, t) {
      const v = this.heroV(k);
      if (v == null)
        return;
      const st = this.heroS, tx = JR.x, ty = JR.y - 90;
      if (v < 0) {
        const u = clamp(1 + v / this.heroW, 0, 1), p = u < 0.85 ? u / 0.85 * 0.75 : 0.75 + (u - 0.85) / 0.15 * 0.25;
        ctx.save();
        ctx.globalAlpha = 0.55 * u;
        const g = ctx.createRadialGradient(tx, ty, 150, tx, ty, 1100);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(10,0,30,1)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.6 * u;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        for (let i = 0; i < 28; i++) {
          const a = i / 28 * Math.PI * 2 + i * 0.37, r0 = 260 + i * 97 % 120, r1 = r0 + 300 + u * 200;
          ctx.beginPath();
          ctx.moveTo(tx + Math.cos(a) * r0, ty + Math.sin(a) * r0);
          ctx.lineTo(tx + Math.cos(a) * r1, ty + Math.sin(a) * r1);
          ctx.stroke();
        }
        ctx.restore();
        BB.text(st === 3 ? "SUPER SLOW-MO..." : "SLOW-MO...", W / 2, 250, 52, "#bff8ff", { stroke: 6 });
        const fs = [[[tx - 40, H + 260], [tx - 10, ty + 60], -Math.PI / 2.4]], hay = [[[-260, ty - 40], [tx - 150, ty - 20], 0]], dbl = [[[-260, ty + 40], [tx - 160, ty], 0], [[W + 260, ty + 40], [tx + 160, ty], Math.PI]];
        for (const [[ax, ay], [bx, by], r] of [fs, hay, dbl, [...fs, ...dbl]][st])
          this.drawFist(lerp(ax, bx, p), lerp(ay, by, p), 0.9 + 0.6 * p, r);
      } else {
        if (v < 0.14) {
          ctx.fillStyle = `rgba(255,255,240,${0.85 * (1 - v / 0.14)})`;
          ctx.fillRect(0, 0, W, H);
        }
        const word = ["KA-POW!", "BAM-WHAM!", "DOUBLE POW!", this.deluxe ? "DELUXE KA-BOOM!" : "ULTRA KA-BOOM!"][st], s = v < 0.12 ? lerp(3, 1, v / 0.12) : 1 + 0.05 * Math.sin(t * 30);
        ctx.save();
        ctx.globalAlpha = clamp((0.8 - v) / 0.2, 0, 1);
        ctx.translate(tx, ty - 250);
        ctx.rotate(-0.12);
        ctx.scale(s, s);
        ctx.fillStyle = "#ffe066";
        ctx.beginPath();
        for (let i = 0; i < 24; i++) {
          const a = i / 24 * Math.PI * 2, r = i % 2 ? 150 : 260;
          ctx.lineTo(Math.cos(a) * r * 1.6, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#782814";
        ctx.lineWidth = 8;
        ctx.stroke();
        BB.text(word, 0, 0, 110, "#ff5a5a", { font: "Rammetto One", stroke: 12, strokeCol: "#fff" });
        ctx.restore();
        if (v < 0.3) {
          const fs = [[tx - 10, ty + 60 - v * 200, -Math.PI / 2.4]], hay = [[tx - 150 + v * 100, ty - 20, 0]], dbl = [[tx - 160, ty, 0], [tx + 160, ty, Math.PI]];
          for (const [x, y, r] of [fs, hay, dbl, [...fs, ...dbl]][st])
            this.drawFist(x, y, 1.5, r);
        }
      }
    }
    drawMini(x, y, s, t, o = {}) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.rotate(o.rot || 0);
      ctx.strokeStyle = "#2a2d33";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-40, 140);
      ctx.lineTo(-48, 190);
      ctx.moveTo(40, 140);
      ctx.lineTo(48, 190);
      ctx.stroke();
      BB.rrect(-72, 182, 52, 20, 8, "#2e1a0e", null, 0);
      BB.rrect(22, 182, 52, 20, 8, "#2e1a0e", null, 0);
      ctx.strokeStyle = "#2a2d33";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(60, -150);
      ctx.lineTo(85, -215);
      ctx.stroke();
      ctx.fillStyle = "#7ef0ff";
      ctx.beginPath();
      ctx.arc(85, -215, 10 + 3 * Math.sin(t * 30), 0, 7);
      ctx.fill();
      BB.rrect(-110, -160, 220, 310, 30, BB.lg(-160, 150, ["#f0525a", "#a8202a"]), "#4a0e14", 7);
      BB.rrect(-110, -160, 220, 40, 30, "rgba(255,255,255,.12)", null, 0);
      BB.rrect(-88, -130, 176, 140, 14, "#1e2228", null, 0);
      BB.rrect(-72, -116, 144, 112, 6, "#7ef0ff", null, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-72, -116, 144, 112);
      ctx.clip();
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
        ctx.fillRect(-72 + Math.random() * 144, -116 + Math.random() * 112, 6 + Math.random() * 12, 3);
      }
      const P = (cx, cy, c) => {
        ctx.fillStyle = c || "#14243a";
        ctx.fillRect(cx * 8 - 60, cy * 8 - 110, 8, 8);
      };
      const fl = Math.sin(t * 16) > 0;
      [[2, 3], [3, 4], [4, 5], [10, 5], [11, 4], [12, 3]].forEach(([a, b]) => P(a, b));
      [[4, 6], [10, 6]].forEach(([a, b]) => {
        P(a, b, "#d8203a");
        P(a, b + 1, "#d8203a");
      });
      for (let i = 4; i <= 10; i++)
        P(i, fl ? 10 : 11);
      P(3, fl ? 11 : 10);
      P(11, fl ? 11 : 10);
      ctx.restore();
      ctx.fillStyle = "#2a2d33";
      ctx.fillRect(-80, 45, 22, 62);
      ctx.fillRect(-100, 65, 62, 22);
      ctx.fillStyle = "#ffd63c";
      ctx.beginPath();
      ctx.arc(52, 82, 16, 0, 7);
      ctx.arc(85, 58, 16, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#4a0e14";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = "rgba(60,8,12,.6)";
      ctx.lineWidth = 5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(30 + i * 14, 140);
        ctx.lineTo(55 + i * 14, 112);
        ctx.stroke();
      }
      ctx.restore();
    }
    drawTransform(v, t) {
      const BX = JR.x - 120, BY = JR.y + 110, BS2 = 2.2, S = BB.sfx, ev = (n, f) => {
        if (!this["ev" + n]) {
          this["ev" + n] = 1;
          f();
        }
      }, lab = this.deluxe ? "DELUXE ULTRA RETURN" : "RETURN TO SENDER", top = BY - 60 * BS2, jx = JR.x, jy = JR.y - 100;
      let bx = BX, by = BY, bs = BS2;
      if (v >= 3.7 && v < 4.6) {
        const u = (v - 3.7) / 0.9, e = u * u * (3 - 2 * u);
        bx = lerp(BX, TRK.x + 300, e);
        by = lerp(BY, TRK.y + 150, e) - Math.sin(u * Math.PI) * 160;
        bs = lerp(BS2, 1.25, e);
      }
      if (v >= 4.6) {
        bx = TRK.x + 300 + (v - 4.6) ** 2 * 520;
        by = TRK.y + 150;
        bs = 1.25;
        ev("go", () => {
          S.wobble && S.wobble();
        });
      }
      if (v >= 0.9 && bx < W + 400) {
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(bs, bs);
        this.paintBox(v < 2.6, v >= 2.95 ? lab : null);
        ctx.restore();
      }
      if (v >= 1.2 && v < 2.5) {
        const u = (v - 1.2) / 1.3, e = u * u, mx = lerp(jx, BX, e) + Math.sin(u * 9) * 40 * (1 - u), my = lerp(jy - 120, top + 40, e) - Math.sin(u * Math.PI) * 260;
        ev("nooo", () => {
          BB.say("bb_nooo", { overlap: true });
        });
        ctx.save();
        ctx.beginPath();
        ctx.rect(-200, -600, W + 400, u > 0.8 ? top + 600 : H + 600);
        ctx.clip();
        this.drawMini(mx, my, 0.55, t, { rot: u * 9 });
        ctx.restore();
        if (u < 0.95)
          BB.text("NOOOOOOOOOO!", mx, my - 120, 44 + u * 20, "#7ef0ff", { font: "Rammetto One", stroke: 6 });
        if (u >= 0.97)
          ev("plop", () => {
            BB.shake(10);
            S.clunk && S.clunk();
          });
      }
      if (v < 1.6) {
        const u = v / 1.6;
        ctx.save();
        if (u < 0.15) {
          ctx.globalAlpha = 1 - u / 0.15;
          ctx.fillStyle = "#fff8e0";
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;
        }
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255,${180 - u * 100 | 0},60,${0.9 * (1 - u)})`;
        ctx.beginPath();
        ctx.arc(jx, jy, 80 + u * 260, 0, 7);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = `rgba(255,246,200,${1 - u})`;
        ctx.lineWidth = 20 * (1 - u) + 2;
        ctx.beginPath();
        ctx.arc(jx, jy, 60 + u * 700, 0, 7);
        ctx.stroke();
        for (let q = 0; q < 14; q++) {
          const a = q / 14 * 7, d = 40 + u * (180 + q % 3 * 60);
          ctx.globalAlpha = Math.min(1, (1.6 - v) * 1.2) * 0.85;
          ctx.fillStyle = q % 2 ? "#8a8378" : "#bdb6aa";
          ctx.beginPath();
          ctx.arc(jx + Math.cos(a) * d, jy + Math.sin(a) * d * 0.7 - u * 60, 60 + u * 90, 0, 7);
          ctx.fill();
        }
        ctx.restore();
        ev("boom", () => {
          BB.shake(30);
          S.boom ? S.boom() : S.clunk && S.clunk();
          BB.burst(jx, jy, 50, { cols: ["#ffe066", "#ff8a3a", "#fff"], kind: "star", size: 16, speed: 1100, g: 200 });
        });
        if (v < 1)
          BB.text("KA-BOOOM!", jx, jy - 260, 120, "#ffe066", { font: "Rammetto One", stroke: 12, strokeCol: "#782814" });
      }
      if (v >= 2.6 && v < 3.4) {
        const u = (v - 2.6) / 0.35, y = u < 1 ? lerp(-260, top + 20, u * u) : lerp(top + 20, -260, Math.min(1, (u - 1) * 1.3));
        ctx.save();
        ctx.fillStyle = "#7d8c96";
        ctx.fillRect(BX - 14, -40, 28, y + 40);
        BB.rrect(BX - 130, y - 70, 260, 70, 10, BB.lg(y - 70, y, ["#c9d6de", "#7d8c96"]), COL.ink, 5);
        BB.rrect(BX - 120, y, 240, 22, 6, "#d24a3c", COL.ink, 4);
        ctx.restore();
        if (u >= 1)
          ev("stamp", () => {
            BB.shake(22);
            S.clunk && S.clunk();
            S.pkTa && S.pkTa();
            BB.burst(BX, top + 40, 30, { cols: ["#d24a3c", "#fff", "#ffe066"], kind: "star", size: 14, speed: 800, g: 300 });
          });
        if (u >= 1 && u < 1.8)
          BB.text("KA-CHUNK!", BX, top - 120, 90, "#ffe066", { font: "Rammetto One", stroke: 10, strokeCol: "#3a1040" });
      }
      if (v >= 4.6 && v < 5.6)
        BB.text(lab + "!", W / 2, 300, 96, "#ffe066", { font: "Rammetto One", stroke: 12, strokeCol: "#782814", maxW: W - 120 });
      if (v >= 5.6) {
        const u = Math.min(1, (v - 5.6) / 0.5);
        this.spIn = BB.t;
        ev("saved", () => {
          BB.say("sp_saved", { overlap: true });
          S.fanfare && S.fanfare();
          BB.burst(W / 2, 260, 60, { cols: ["#ffe066", "#7ef0ff", "#ff8adf", "#6ee678"], kind: "star", size: 14, speed: 1e3, g: 500 });
        });
        const sx = lerp(LCH.x - 175, W / 2 - 120, u * u * (3 - 2 * u)), hop = Math.abs(Math.sin(t * 7)) * 40;
        BB.sprite("sprocket", sx, LCH.y + 100 - hop, 420, {});
        R.bubble(sx + 40, LCH.y - 330 - hop, "rhythm engineers... you saved the day!");
        BB.text("YOU SAVED THE DAY!", W / 2 + 220, 300, 92, "#ffe066", { font: "Rammetto One", stroke: 12, strokeCol: "#3a1040", maxW: W - 500 });
      }
    }
    drawCard(b, u, t) {
      const cx = 760, cy = 345, w = 620, h = 230, pre = u < 0;
      ctx.save();
      ctx.globalAlpha = pre ? 0.75 : 1;
      const pop = pre ? 1 : 1 + 0.05 * Math.exp(-u * 12);
      ctx.translate(cx, cy);
      ctx.scale(pop, pop);
      BB.panel(-w / 2, -h / 2, w, h, 26);
      BB.text((pre ? "NEXT: " : "") + "AIR JUGGLE " + (b.cardN + 1) + "  " + b.tw + "!", 0, -h / 2 + 40, 32, "#ffd84a", { stroke: 0 });
      const cw = (w - 60) / 4, bh = h - 90, y0 = -h / 2 + 66;
      b.read.forEach((k, i) => {
        const x = -w / 2 + 30 + i * cw, on = !pre && Math.floor(u * 4) === i;
        if (on)
          BB.rrect(x + 2, y0 - 4, cw - 4, bh + 8, 14, "rgba(110,230,120,.35)", "#6ee678", 3);
        R.tile(k, x + 4, y0, cw - 8, bh, { ns: R.cardNs(k, cw, bh, 1), shadow: false, label: true });
      });
      if (!pre) {
        const px = -w / 2 + 30 + u * (w - 60);
        ctx.fillStyle = "#ffd84a";
        ctx.fillRect(px - 3, y0 - 6, 6, bh + 12);
      }
      ctx.restore();
    }
    drawStandoff(v, t) {
      const SJ = [[3.3, "bb_sj1", "Your claps are softer than a marshmallow!"], [5.8, "bb_sj2", "I've heard louder sneezes!"], [8.3, "bb_sj3", "My grandma TV has better rhythm!"], [13.3, "bb_sj4", "Ti-ti? More like tee-hee!"], [15.8, "bb_sp1", "Rhythm Engineers... let's show him!"], [20.2, "bb_sj6", "COME AT ME, BRO!"]];
      for (const [a, id] of SJ)
        if (v >= a && !this["so" + id]) {
          this["so" + id] = 1;
          BB.say(id, { overlap: true });
        }
      const fx = v < 1.5 ? lerp(W + 300, JR.x, ease.out ? ease.out(v / 1.5) : v / 1.5) : JR.x, hop = v < 1.5 ? Math.abs(Math.sin(v * 8)) * 50 : Math.abs(Math.sin(t * 3)) * 6;
      ctx.save();
      ctx.strokeStyle = "rgba(238,228,204,.35)";
      ctx.lineWidth = 4;
      for (let i = 0; i < 9; i++) {
        const y = 420 + i * 60, x = (t * 900 + i * 377) % (W + 600) - 300;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 160, y - 6);
        ctx.stroke();
      }
      ctx.restore();
      {
        const px = v * 420 % (W + 400) - 200, py = 820 - Math.abs(Math.sin(v * 5)) * 80;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(v * 6);
        ctx.fillStyle = "#f4ecd8";
        ctx.strokeStyle = "#b8a888";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(-14, 0, 20, 14, 0, 0, 7);
        ctx.ellipse(14, 0, 20, 14, 0, 0, 7);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      const stare = v >= 1.5 && v < 3.5;
      if (stare) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, 110);
        ctx.fillRect(0, H - 110, W, 110);
        ctx.restore();
        BB.text(". . .", LCH.x + 20, LCH.y - 330, 64, "#fff", { stroke: 6 });
        BB.text(". . .", JR.x, JR.y - 360, 64, "#fff", { stroke: 6 });
        BB.text("THE STANDOFF", W / 2, 200, 72, "#ffd63c", { font: "Rammetto One", stroke: 10, strokeCol: "#782814" });
      }
      if (v > 1.6 && v < 3.6)
        this.q(() => {
          const a = clamp(Math.min((v - 1.6) / 0.25, (3.6 - v) / 0.25), 0, 1), sl = (1 - a) * 80;
          ctx.save();
          ctx.globalAlpha = a;
          BB.panel(60 - sl, H - 330, 520, 130, 24);
          BB.text("SPROCKET", 320 - sl, H - 290, 52, "#7ef0ff", { font: "Rammetto One", stroke: 7 });
          BB.text("Chief Rhythm Engineer", 320 - sl, H - 235, 34, "#fff", { stroke: 5 });
          BB.panel(W - 580 + sl, H - 330, 520, 130, 24);
          BB.text("STATIC JR.", W - 320 + sl, H - 290, 52, "#ff8adf", { font: "Rammetto One", stroke: 7 });
          BB.text("Fuzz Menace (very silly)", W - 320 + sl, H - 235, 34, "#fff", { stroke: 5 });
          ctx.restore();
        });
      const beck = v >= 20.2 && v < 22;
      BB.staticJr(fx, JR.y + 230 - hop, 300, { flip: true, glitch: 0.15 + 0.1 * Math.sin(t * 20), rot: beck ? Math.sin(t * 10) * 0.08 : 0 });
      if (beck) {
        const bx = fx - 190, by = JR.y - 20, c = Math.sin(t * 12);
        ctx.save();
        ctx.translate(bx, by);
        BB.rrect(-40, -30, 70, 60, 22, BB.lg(-30, 30, ["#ecc088", "#b88246"]), "#5a3a1e", 4);
        BB.rrect(-70, -14 + c * 10, 40, 22, 10, "#ecc088", "#5a3a1e", 4);
        ctx.restore();
        BB.text("COME AT ME, BRO!", W / 2 + 120, 230, 92, "#ff8adf", { font: "Rammetto One", stroke: 12, strokeCol: "#3a1040" });
      }
      if (0) {
        const u = v - 17.6, S = BB.sfx, ch = Math.floor(u / 0.45);
        if (ch !== this.chompN && u < 1.9) {
          this.chompN = ch;
          S.clunk && S.clunk();
          S.pop && S.pop();
        }
        if (u >= 2 && !this.burped) {
          this.burped = 1;
          S.glitch && S.glitch();
          BB.burst(JR.x - 60, JR.y - 120, 20, { cols: ["#7ef0ff", "#fff"], kind: "spark", size: 10, speed: 400, g: -100 });
        }
        const cw = 220, bh = 220, ns = R.cardNs("q", cw, bh, 1);
        [["w", JR.x - 560], ["h", JR.x - 560]].forEach(([nk, x], q) => {
          if (q === 0 && u > 1)
            return;
          if (q === 1 && (u < 1 || u >= 2))
            return;
          const uu = q ? u - 1 : u, bites = Math.min(3, Math.floor(uu / 0.33)), y = JR.y - 260, sl = uu * 120;
          R.tile(nk, x + sl, y, cw, bh, { ns, shadow: false, label: true });
          ctx.save();
          ctx.fillStyle = "#3a2a22";
          for (let b = 0; b < bites; b++) {
            for (let m = 0; m < 3; m++) {
              ctx.beginPath();
              ctx.arc(x + sl + cw + 4, y + 30 + b * 60 + m * 22, 18, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
          if (bites)
            BB.burst(x + sl + cw, y + bh / 2, 1, { cols: ["#f4ecd8", "#e2b272"], kind: "spark", size: 8, speed: 200, g: 500 });
        });
        if (u >= 2)
          BB.text("BURP! bzzt!", JR.x - 40, JR.y - 260, 56, "#7ef0ff", { font: "Rammetto One", stroke: 7 });
        else
          BB.text("CHOMP!", JR.x - 300, JR.y - 260, 52, "#ffe066", { font: "Rammetto One", stroke: 7 });
      }
      let cur = null;
      for (const l of SJ)
        if (v >= l[0])
          cur = l;
      if (cur && v < cur[0] + 2.4 && cur[1] !== "bb_sj6") {
        if (cur[1] === "bb_sp1")
          R.bubble(LCH.x - 10, LCH.y - 310, cur[2].toLowerCase());
        else
          R.bubble(JR.x - 40, JR.y - 360, cur[2].toLowerCase(), "#2a6f8a");
      }
      if (v >= 22) {
        const u = v - 22, s = u < 0.2 ? lerp(3.2, 1, u / 0.2) : 1 + 0.03 * Math.sin(t * 20);
        if (!this.fightSlam) {
          this.fightSlam = 1;
          BB.shake(26);
          BB.sfx.pkTa && BB.sfx.pkTa();
          BB.sfx.bonk && BB.sfx.bonk();
          BB.burst(W / 2, 480, 50, { cols: ["#ffe066", "#ff8adf", "#fff"], kind: "star", size: 16, speed: 1200, g: 300 });
        }
        ctx.save();
        ctx.translate(W / 2, 480);
        ctx.scale(s, s);
        BB.text("FIGHT!", 0, 0, 220, "#ffd63c", { font: "Rammetto One", stroke: 16, strokeCol: "#782814" });
        ctx.restore();
      }
      this.q(() => BB.button(W - 300, 30, 260, 90, "SKIP", { size: 40, id: "soskip", onClick: () => {
        if (this.state === "intro")
          this.startKO();
      } }));
    }
    drawDmg(d, t, wreck) {
      if (wreck)
        d = 1;
      const ink = "#3a2a1e";
      ctx.save();
      const tape = (x, y, r, w = 70) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r);
        BB.rrect(-w / 2, -12, w, 24, 6, "#f3e2c0", "#b89a6a", 2);
        ctx.fillStyle = "#e8c9a0";
        ctx.fillRect(-8, -8, 16, 16);
        ctx.restore();
      };
      if (d > 0.2) {
        ctx.strokeStyle = "#2a2d33";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, -178);
        ctx.lineTo(10, -205);
        ctx.lineTo(-6, -222);
        ctx.lineTo(22, -245);
        ctx.stroke();
        ctx.fillStyle = "#ff5a5a";
        ctx.beginPath();
        ctx.arc(22, -245, 9, 0, 7);
        ctx.fill();
        tape(-105, -120, -0.6);
      }
      if (d > 0.4) {
        ctx.strokeStyle = "rgba(255,255,255,.85)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(30, -95);
        ctx.lineTo(10, -60);
        ctx.lineTo(28, -35);
        ctx.moveTo(10, -60);
        ctx.lineTo(-20, -70);
        ctx.stroke();
        BB.rrect(-60, 95, 60, 50, 4, BB.lg(95, 145, ["#e2b272", "#b07a40"]), ink, 3);
      }
      if (d > 0.6) {
        ctx.strokeStyle = "#8a8f99";
        ctx.lineWidth = 4;
        for (let i = 0; i < 9; i++) {
          const x = -70 + i * 17;
          ctx.beginPath();
          ctx.moveTo(x, -188);
          ctx.lineTo(x + (i % 2 ? 14 : -10) + Math.sin(t * 9 + i) * 4, -215 - i % 3 * 8);
          ctx.stroke();
        }
        ctx.save();
        ctx.translate(130, 150);
        ctx.rotate(0.5 + 0.15 * Math.sin(t * 5));
        BB.rrect(-14, -10, 28, 90, 10, "#f4f0e6", ink, 3);
        ctx.restore();
        if (Math.sin(t * 13) > 0.3)
          BB.burst && 0;
        ctx.strokeStyle = "#ffe066";
        ctx.lineWidth = 3;
        if (Math.floor(t * 8) % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(110, -90);
          ctx.lineTo(135, -100);
          ctx.lineTo(125, -80);
          ctx.lineTo(150, -88);
          ctx.stroke();
        }
      }
      if (d > 0.8) {
        tape(-15, -40, 0.7, 150);
        tape(-15, -40, -0.7, 150);
      }
      if (this.flinch && !wreck) {
        ctx.fillStyle = "#0e2a33";
        ctx.fillRect(-115, -105, 200, 130);
        ctx.strokeStyle = "#7ef0ff";
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-80, -75);
        ctx.lineTo(-50, -55);
        ctx.lineTo(-80, -35);
        ctx.moveTo(50, -75);
        ctx.lineTo(20, -55);
        ctx.lineTo(50, -35);
        ctx.moveTo(-60, 0);
        for (let i = 0; i < 6; i++)
          ctx.lineTo(-60 + i * 20 + 10, i % 2 ? -12 : 0);
        ctx.stroke();
        BB.text("OOF!", 90, -170, 40, "#fff", { font: "Rammetto One", stroke: 6 });
      }
      ctx.restore();
    }
    /* v14.3.4 CAMERA: gentle action-movie moves (zoom always >= tilt cover, max 1.14x, max 2 deg tilt, eased; no shake added here) */
    /* v14.3.5 SPECTACLE: one call per landed hit. lvl 1 slap, 2 big, 3 hero/finisher. Layered SFX, cardboard shards + shock rings, rim flash, hit-stop (lvl>=2) */
    impact(lvl, dir, tonal) {
      const S = BB.sfx;
      if (tonal && S.punchT) {
        S.punchT();
        lvl = Math.min(lvl, 1);
      } else
        S.pop && S.pop();
      if (lvl >= 2) {
        S.clunk && S.clunk();
        S.pebble && S.pebble();
      }
      if (lvl >= 3) {
        S.boom && S.boom();
        S.tink && S.tink();
      }
      this.fx2 = (this.fx2 || []).filter((f) => BB.t - f.t < 1.2);
      if (this.fx2.length > 90)
        this.fx2.splice(0, 30);
      const x = JR.x + dir * 90, y = JR.y - 60;
      for (let i = 0; i < 4 + lvl * 4; i++) {
        const a = Math.random() * Math.PI * 2, sp = 300 + Math.random() * 500 * lvl;
        this.fx2.push({ k: "shard", t: BB.t, x, y, vx: Math.cos(a) * sp - dir * 200, vy: Math.sin(a) * sp - 300, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, w: 14 + Math.random() * 16, c: ["#e2b272", "#c9935a", "#f4ecd8"][i % 3] });
      }
      this.fx2.push({ k: "ring", t: BB.t, x, y, lvl });
      this.rim = { t: BB.t, lvl, dir };
      if (lvl >= 2)
        this.hs = { until: BB.t + (lvl >= 3 ? 0.12 : 0.07), k: BB.t - this.st };
    }
    drawFx2() {
      const now = BB.t, dt = BB.dt || 0.016;
      for (const f of this.fx2 || []) {
        const v = now - f.t;
        if (v > 1.2)
          continue;
        if (f.k === "shard") {
          f.vy += 1400 * dt;
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.r += f.vr * dt;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - v / 1.1);
          ctx.translate(f.x, f.y);
          ctx.rotate(f.r);
          ctx.fillStyle = f.c;
          ctx.strokeStyle = "#5a3a1e";
          ctx.lineWidth = 2;
          ctx.fillRect(-f.w / 2, -f.w / 3, f.w, f.w * 0.66);
          ctx.strokeRect(-f.w / 2, -f.w / 3, f.w, f.w * 0.66);
          ctx.restore();
        } else if (f.k === "ring" && v < 0.45) {
          const e = 1 - Math.pow(1 - v / 0.45, 3);
          ctx.save();
          ctx.globalAlpha = (1 - v / 0.45) * 0.8;
          ctx.strokeStyle = "#fff6d0";
          ctx.lineWidth = 10 * (1 - e) + 2;
          ctx.beginPath();
          ctx.ellipse(f.x, f.y, 40 + e * (120 + f.lvl * 70), 30 + e * (80 + f.lvl * 45), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    drawRim() {
      const r = this.rim;
      if (!r)
        return;
      const v = BB.t - r.t;
      if (v > 0.35)
        return;
      const a = (1 - v / 0.35) * (0.25 + 0.12 * r.lvl);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(JR.x + r.dir * 60, JR.y - 80, 40, JR.x, JR.y - 80, 380);
      g.addColorStop(0, "rgba(255,240,190," + a + ")");
      g.addColorStop(1, "rgba(255,240,190,0)");
      ctx.fillStyle = g;
      ctx.fillRect(JR.x - 420, JR.y - 480, 840, 840);
      ctx.restore();
      if (r.lvl >= 3 && v < 0.08) {
        ctx.save();
        ctx.globalAlpha = 0.35 * (1 - v / 0.08);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
    drawSplit(k) {
      let v = -1, jf = { x: JR.x, y: JR.y - 100 };
      if (this.state === "intro" && this.move)
        v = k - 14;
      else if (this.state === "end" && k < KO_BIG) {
        const bi = barAt(k), b = KO_BARS[bi];
        if (b && b.clear && this.hitLv === 2) {
          v = 1.6 + (k - BS[bi] - 0.25) * 1.1;
          const p = this.jp || JR;
          jf = { x: clamp(p.x, 300, W - 200), y: clamp(p.y - 100, 250, H - 250) };
        }
      }
      if (v < 1.6 || v > 3.6)
        return;
      const E = (x) => {
        x = clamp(x, 0, 1);
        return 1 - Math.pow(1 - x, 3);
      }, a = E((v - 1.6) / 0.35) * (1 - E((v - 3.25) / 0.35));
      if (a <= 0)
        return;
      const c = this.snap || (this.snap = document.createElement("canvas"));
      c.width = W;
      c.height = H;
      c.getContext("2d").drawImage(ctx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height, 0, 0, W, H);
      const sh = (1 - a) * W * 0.5, zz = 1.7;
      ctx.save();
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-sh, 0);
      ctx.lineTo(W * 0.56 - sh, 0);
      ctx.lineTo(W * 0.44 - sh, H);
      ctx.lineTo(-sh, H);
      ctx.clip();
      ctx.drawImage(c, LCH.x - 175 - W / zz * 0.25, LCH.y - 60 - H / zz * 0.5, W / zz, H / zz, -sh, 0, W, H);
      ctx.fillStyle = "rgba(126,240,255,.10)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(W * 0.56 + sh, 0);
      ctx.lineTo(W + sh, 0);
      ctx.lineTo(W + sh, H);
      ctx.lineTo(W * 0.44 + sh, H);
      ctx.clip();
      ctx.drawImage(c, jf.x - W / zz * 0.75, jf.y - H / zz * 0.5, W / zz, H / zz, sh, 0, W, H);
      ctx.fillStyle = "rgba(255,138,223,.10)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.globalAlpha = a;
      ctx.strokeStyle = "#eee4cc";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(W * 0.56, -10);
      ctx.lineTo(W * 0.44, H + 10);
      ctx.stroke();
      ctx.strokeStyle = "#1d3b38";
      ctx.lineWidth = 5;
      ctx.stroke();
      BB.text("VS", W / 2, H / 2, 120, "#ffd84a", { font: "Rammetto One", stroke: 10 });
      ctx.restore();
    }
    /* v14.3.5 ANIME SET-PIECES (see preview/boss_storyboard.md). sceneOf: which set-piece a bar belongs to */
    sceneOf(b) {
      if (!b)
        return "";
      if (b.voice || b.cw)
        return "aura";
      if (b.rush)
        return "rush";
      if (b.beam)
        return "beam";
      if (b.pwr)
        return "aura";
      if (b.read)
        return "air";
      if (b.clear)
        return "knock";
      if (b.atk)
        return "rush";
      if (b.mode)
        return "dodge";
      return "";
    }
    drawSceneBack(k, t) {
      if (this.state !== "end" || k < KO_T0 || k > KO_BIG)
        return;
      const bi = barAt(k), b = KO_BARS[bi], sc = this.sceneOf(b), u = b ? (k - BS[bi]) / BL[bi] : 0, SP = { x: LCH.x - 175, y: LCH.y - 60 };
      const inA = clamp((k - BS[bi]) / 0.35, 0, 1);
      if (sc === "air") {
        const first = !KO_BARS[bi - 1] || !KO_BARS[bi - 1].read, a = first ? inA : 1;
        ctx.save();
        ctx.globalAlpha = a;
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#3b6fb6");
        g.addColorStop(0.6, "#8fc3ea");
        g.addColorStop(1, "#d9ecf7");
        ctx.fillStyle = g;
        ctx.fillRect(-60, -60, W + 120, H + 120);
        ctx.fillStyle = "rgba(255,255,255,.85)";
        for (let i = 0; i < 7; i++) {
          const y = (i * 170 + k * 420) % (H + 300) - 150, x = i * 397 % W;
          ctx.beginPath();
          ctx.ellipse(x, y, 160, 46, 0, 0, Math.PI * 2);
          ctx.ellipse(x + 90, y - 20, 110, 40, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = "rgba(255,255,255,.5)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 14; i++) {
          const x = (i * 139 + k * 60) % W, y = (i * 263 + k * 1600) % (H + 400) - 200;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 160);
          ctx.stroke();
        }
        ctx.restore();
        return;
      }
      if (sc === "aura" || sc === "beam") {
        const p = clamp((KO_BARS[barAt(k)] || {}).voice ? (this.vf || 0) / 3 : (this.cf || 0) / 3, 0, 1), a = sc === "beam" ? 0.45 : 0.35 + 0.25 * p;
        ctx.save();
        ctx.globalAlpha = a * inA;
        ctx.fillStyle = "#0a0c18";
        ctx.fillRect(-60, -60, W + 120, H + 120);
        ctx.restore();
        if (sc === "aura") {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const R0 = 150 + p * 170;
          for (let L = 0; L < 3; L++) {
            ctx.beginPath();
            for (let i = 0; i <= 36; i++) {
              const an = i / 36 * Math.PI * 2, fl = Math.max(0, -Math.sin(an)) * (0.6 + 0.4 * Math.sin(t * 14 + i * 1.7 + L)) * (80 + p * 160), r = R0 * (1 - L * 0.22) + fl;
              const x = SP.x + Math.cos(an) * r * 0.75, y = SP.y + Math.sin(an) * r;
              i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = ["rgba(255,190,40,.18)", "rgba(255,220,90,.22)", "rgba(255,250,200,.28)"][L];
            ctx.fill();
          }
          const gg = ctx.createRadialGradient(SP.x, SP.y, 20, SP.x, SP.y, 700);
          gg.addColorStop(0, "rgba(255,220,120," + (0.15 + 0.3 * p) + ")");
          gg.addColorStop(1, "rgba(255,220,120,0)");
          ctx.fillStyle = gg;
          ctx.fillRect(-60, -60, W + 120, H + 120);
          ctx.restore();
          for (let i = 0; i < 7; i++) {
            const ph = (k * 0.5 + i / 7) % 1, x = SP.x - 260 + i * 173 % 560, y = LCH.y + 140 - ph * (500 + p * 300);
            ctx.save();
            ctx.globalAlpha = Math.min(1, (1 - ph) * 2) * inA;
            ctx.translate(x, y);
            ctx.rotate(t * 2 + i);
            ctx.fillStyle = "#6b5a4a";
            ctx.strokeStyle = "#2e2620";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-18, -10);
            ctx.lineTo(4, -20);
            ctx.lineTo(20, -2);
            ctx.lineTo(8, 16);
            ctx.lineTo(-14, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          ctx.save();
          ctx.strokeStyle = "#1a1410";
          ctx.lineWidth = 5;
          const len = p * 900;
          for (const d of [1, -1, 0.5]) {
            ctx.beginPath();
            let x = SP.x, y = LCH.y + 150;
            ctx.moveTo(x, y);
            for (let s = 0; s < len; s += 60) {
              x += 60 * Math.sign(d || 1) * (d === 0.5 ? 1 : 1) * (d < 0 ? -0.5 : 1);
              y += Math.sin(s * 0.07 + d * 3) * 14 + (d === 0.5 ? 6 : 0);
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = 0.25 * inA;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        for (let i = 0; i < 40; i++) {
          const an = i / 40 * Math.PI * 2 + t * 0.3, r1 = 380 + (i * 97 + k * 900) % 500;
          ctx.beginPath();
          ctx.moveTo(SP.x + Math.cos(an) * r1, SP.y + Math.sin(an) * r1);
          ctx.lineTo(SP.x + Math.cos(an) * (r1 + 220), SP.y + Math.sin(an) * (r1 + 220));
          ctx.stroke();
        }
        ctx.restore();
        return;
      }
      if (sc === "rush" || sc === "knock") {
        ctx.save();
        ctx.globalAlpha = 0.18 * inA;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        for (let i = 0; i < 46; i++) {
          const an = i / 46 * Math.PI * 2 + i % 3 * 0.05, r1 = 300 + (i * 131 + Math.floor(k * 12) * 57) % 260;
          ctx.beginPath();
          ctx.moveTo(JR.x + Math.cos(an) * r1, JR.y - 80 + Math.sin(an) * r1);
          ctx.lineTo(JR.x + Math.cos(an) * 1500, JR.y - 80 + Math.sin(an) * 1500);
          ctx.stroke();
        }
        ctx.restore();
        return;
      }
      if (sc === "dodge") {
        ctx.save();
        ctx.globalAlpha = 0.16 * inA;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        for (let i = 0; i < 22; i++) {
          const y = i * 53 % H, x = W - (i * 311 + k * 2600) % (W + 600);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 380, y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    drawSceneFront(k, t) {
      if (this.state !== "end" || k < KO_T0 || k > KO_BIG)
        return;
      const bi = barAt(k), b = KO_BARS[bi], sc = this.sceneOf(b), SP = { x: LCH.x - 175, y: LCH.y - 60 };
      if (sc === "rush") {
        const v = k - BS[bi];
        if (v < 0.45) {
          const e = 1 - Math.pow(1 - v / 0.45, 3);
          ctx.save();
          ctx.globalAlpha = 0.7 * (1 - e);
          ctx.strokeStyle = "#fff6c8";
          ctx.lineWidth = 18 * (1 - e) + 2;
          ctx.beginPath();
          ctx.moveTo(SP.x, SP.y);
          ctx.lineTo(lerp(SP.x, JR.x - 200, e), SP.y - 20);
          ctx.stroke();
          ctx.restore();
        }
        for (const [hk, kind] of KO_HITS) {
          const d = k - hk;
          if (d < 0 || d > 0.18 || kind !== "L" && kind !== "R")
            continue;
          const s = kind === "L" ? -1 : 1;
          ctx.save();
          ctx.globalAlpha = 1 - d / 0.18;
          ctx.strokeStyle = "#ffe066";
          ctx.lineWidth = 10;
          for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.arc(JR.x + s * 30, JR.y - 80 + j * 30 - 30, 120 + j * 20, s > 0 ? -0.6 : Math.PI - 0.6, s > 0 ? 0.6 : Math.PI + 0.6);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      if (sc === "beam") {
        const p = b.pwr === 2 ? clamp(this.pw || 0, 0, 1.2) : 0, v = k - BS[bi], sx = SP.x + 120, sy = SP.y - 30, jx = JR.x - 130, jy = JR.y - 90, cx = lerp(lerp(sx, jx, 0.42), jx - 40, Math.min(1, p)), cy = lerp(sy, jy, (cx - sx) / (jx - sx)), wob = Math.sin(t * 40) * 4;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const beam = (x0, y0, x1, y1, c1, c2, w) => {
          ctx.lineCap = "round";
          ctx.strokeStyle = c1;
          ctx.lineWidth = w + wob;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.strokeStyle = c2;
          ctx.lineWidth = w * 0.45;
          ctx.stroke();
        };
        beam(sx, sy, cx, cy, "rgba(255,200,60,.75)", "rgba(255,255,230,.95)", 70 + p * 40);
        beam(jx, jy, cx, cy, "rgba(90,220,255,.7)", "rgba(230,255,255,.9)", 62);
        const r = 90 + Math.sin(t * 30) * 10 + p * 40, g = ctx.createRadialGradient(cx, cy, 10, cx, cy, r * 2);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.4, "rgba(255,230,140,.7)");
        g.addColorStop(1, "rgba(255,230,140,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.6)";
        ctx.lineWidth = 4;
        for (let i = 0; i < 10; i++) {
          const an = t * 9 + i * 0.63;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r);
          ctx.lineTo(cx + Math.cos(an) * (r + 90 + 40 * Math.sin(t * 20 + i)), cy + Math.sin(an) * (r + 90));
          ctx.stroke();
        }
        ctx.restore();
        if (b.pwr === 2)
          BB.text(p >= 1 ? "BEAM WINS!" : "CLAP FASTER! PUSH THE BEAM!", W / 2, H - 330, p >= 1 ? 80 : 52, p >= 1 ? "#ffe066" : "#fff", { font: p >= 1 ? "Rammetto One" : "Lilita One", stroke: 8 });
      }
      if (sc === "knock" && this.jp) {
        this.trail = (this.trail || []).concat([{ x: this.jp.x, y: this.jp.y - 90, t: BB.t }]).filter((p) => BB.t - p.t < 0.5);
        ctx.save();
        ctx.lineCap = "round";
        for (let i = 1; i < this.trail.length; i++) {
          const a = this.trail[i - 1], c = this.trail[i], f = 1 - (BB.t - c.t) / 0.5;
          ctx.globalAlpha = f * 0.8;
          ctx.strokeStyle = "#bff8ff";
          ctx.lineWidth = 60 * f;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    drawCloseup(k) {
      if (this.state !== "end" || k < KO_T0 || k > KO_BIG)
        return;
      const bi = barAt(k), b = KO_BARS[bi];
      if (!b || !b.phase)
        return;
      const v = k - BS[bi];
      if (v > 1.9)
        return;
      const E = (x) => {
        x = clamp(x, 0, 1);
        return 1 - Math.pow(1 - x, 3);
      }, a = E(v / 0.25) * (1 - E((v - 1.6) / 0.3));
      if (a <= 0)
        return;
      const c = this.snap || (this.snap = document.createElement("canvas"));
      c.width = W;
      c.height = H;
      c.getContext("2d").drawImage(ctx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height, 0, 0, W, H);
      const z = 3.2 + v * 0.25, sh = H * 0.24, SPf = { x: LCH.x - 178, y: LCH.y - 130 }, JRf = { x: JR.x, y: JR.y - 95 };
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = "#0b0f14";
      ctx.fillRect(0, 0, W, H);
      const strip = (f, y, off) => {
        const sw = W / z, shh = sh / z;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, y, W, sh);
        ctx.clip();
        ctx.drawImage(c, f.x - sw / 2 + off, f.y - shh / 2, sw, shh, 0, y, W, sh);
        ctx.restore();
        ctx.strokeStyle = "#eee4cc";
        ctx.lineWidth = 8;
        ctx.strokeRect(-10, y, W + 20, sh);
      };
      strip(SPf, H * 0.2, 0);
      strip(JRf, H * 0.56, 0);
      ctx.restore();
    }
    /* v14.3.5 VOICE POWER-UP: class sings a rising AHHH. Lenient: sustained voiced loudness fills, upward glide adds bonus; auto-fills with time so nobody fails.
       Pitch = autocorrelation on the existing analyser, read live only; nothing is recorded or stored. Clap detection is muted (BB.voiceSeg). */
    pitchNow() {
      const M = window.MicCore;
      if (!BB.mic.ok || !M || !M.an)
        return null;
      const n = M.an.fftSize, b = this.pbuf || (this.pbuf = new Float32Array(n));
      M.an.getFloatTimeDomainData(b);
      let r = 0;
      for (let i = 0; i < n; i++)
        r += b[i] * b[i];
      r = Math.sqrt(r / n);
      if (r < 0.01)
        return { rms: r, f: 0, c: 0 };
      const sr = M.ctx.sampleRate, lo = Math.floor(sr / 700), hi = Math.min(n >> 1, Math.floor(sr / 90)), N = n >> 1;
      let best = 0, bl = 0, e0 = 0;
      for (let i = 0; i < N; i++)
        e0 += b[i] * b[i];
      for (let l = lo; l <= hi; l += 2) {
        let c = 0, e1 = 0;
        for (let i = 0; i < N; i++) {
          c += b[i] * b[i + l];
          e1 += b[i + l] * b[i + l];
        }
        c /= Math.sqrt(e0 * e1) + 1e-9;
        if (c > best) {
          best = c;
          bl = l;
        }
      }
      return { rms: r, f: best > 0.5 ? sr / bl : 0, c: best };
    }
    voiceTick(dt) {
      const k = BB.t - this.st, b = this.state === "end" && k >= KO_T0 && k <= KO_BIG ? KO_BARS[barAt(k)] : null;
      if (!b || !b.voice) {
        if (this.vOn) {
          this.vOn = 0;
          BB.voiceSeg = 0;
          BB.mic && BB.mic.take && BB.mic.take();
        }
        return;
      }
      const bi = barAt(k);
      if (!this.vOn) {
        this.vOn = 1;
        this.vf = 0;
        this.vp = [];
        this.vPit = 0;
        this.vBurst = 0;
        this.vDemo = 0;
      }
      BB.voiceSeg = 1;
      BB.mic && BB.mic.take && BB.mic.take();
      if (this.gag)
        this.gag = null;
      this.has = [];
      if (b.vi === 0) {
        if (!this.vDemo && k - BS[bi] > 0.3) {
          this.vDemo = 1;
          this.ahhh();
        }
        this.vPit = clamp((k - BS[bi] - 0.3) / 2.2, 0, 1) * 0.8;
        return;
      }
      const tt = this.vt = (this.vt || 0) + dt;
      if (tt > 0.05) {
        this.vt = 0;
        const p = this.pitchNow();
        let add = 0;
        if (p && p.f && p.rms > 0.015) {
          const lf = Math.log2(p.f);
          this.vp.push(lf);
          if (this.vp.length > 12)
            this.vp.shift();
          add = 0.5;
          const L = this.vp.length;
          if (L > 4 && this.vp[L - 1] - this.vp[0] > 0.05)
            add += 0.45;
          this.vPit = lerp(this.vPit, clamp((lf - Math.log2(110)) / 2.6, 0, 1), 0.3);
        } else if (p && p.rms > 0.03)
          add = 0.25;
        const s0 = BS[barAt(k) - b.vi + 1], auto = clamp((k - s0) / (BL[bi] * 3 - 0.4), 0, 1) * 3;
        this.vf = Math.min(3, Math.max(this.vf + add * 0.05 * 1.4, auto, this.vf));
        if (!(p && p.f))
          this.vPit = lerp(this.vPit, this.vf / 3, 0.15);
      }
      if (this.vf >= 3 && !this.vBurst) {
        this.vBurst = k;
        BB.shake(30);
        this.impact && this.impact(3, 1);
      }
    }
    ahhh() {
      const ac = BB.ac;
      if (!ac)
        return;
      try {
        const t0 = ac.currentTime, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), m = ac.createGain();
        o.type = "sawtooth";
        o2.type = "sawtooth";
        o2.detune.value = 8;
        o.frequency.setValueAtTime(240, t0);
        o.frequency.exponentialRampToValueAtTime(520, t0 + 2.1);
        o2.frequency.setValueAtTime(240, t0);
        o2.frequency.exponentialRampToValueAtTime(520, t0 + 2.1);
        f1.type = "bandpass";
        f1.frequency.value = 800;
        f1.Q.value = 5;
        f2.type = "bandpass";
        f2.frequency.value = 1200;
        f2.Q.value = 6;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.5, t0 + 0.15);
        g.gain.setValueAtTime(0.5, t0 + 1.9);
        g.gain.linearRampToValueAtTime(0, t0 + 2.3);
        o.connect(f1);
        o2.connect(f1);
        o.connect(f2);
        f1.connect(g);
        f2.connect(g);
        g.connect(m);
        m.gain.value = 0.9;
        m.connect(BB.outBus || ac.destination);
        o.start(t0);
        o2.start(t0);
        o.stop(t0 + 2.4);
        o2.stop(t0 + 2.4);
      } catch (e) {
      }
    }
    drawVoice(k, t) {
      if (this.state !== "end" || k < KO_T0 || k > KO_BIG)
        return;
      const bi = barAt(k), b = KO_BARS[bi];
      if (!b || !b.voice)
        return;
      const f = this.vf || 0, X0 = 470, Y0 = 470, JW = 110, JH = 250, cols = ["#ffd84a", "#7ef0ff", "#ff8adf"];
      if (f > 1)
        BB.shake(1 + f * 2);
      this.drawCans(X0, Y0, f, k, t, this.vBurst);
      const LX = X0 + 380, LY = Y0 + JH, LH = 320;
      ctx.save();
      ctx.strokeStyle = "#eee4cc";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(LX, LY);
      ctx.lineTo(LX, LY - LH);
      ctx.moveTo(LX + 50, LY);
      ctx.lineTo(LX + 50, LY - LH);
      for (let r = 0; r <= 7; r++) {
        ctx.moveTo(LX, LY - r * LH / 7);
        ctx.lineTo(LX + 50, LY - r * LH / 7);
      }
      ctx.stroke();
      const ay = LY - clamp(this.vPit || 0, 0, 1) * LH;
      ctx.fillStyle = "#ffd84a";
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(LX - 6, ay);
      ctx.lineTo(LX - 36, ay - 20);
      ctx.lineTo(LX - 28, ay);
      ctx.lineTo(LX - 36, ay + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(LX + 25, LY - LH - 58);
      ctx.lineTo(LX - 5, LY - LH - 18);
      ctx.lineTo(LX + 55, LY - LH - 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      const msg = b.vi === 0 ? "LISTEN... then you try!" : f >= 3 ? "FULL POWER!" : "HIGHER! HIGHER!";
      BB.text(msg, X0 + 140, Y0 + JH + 70, f >= 3 ? 64 : 48, f >= 3 ? "#ffd84a" : "#fff", { font: f >= 3 ? "Rammetto One" : "Lilita One", stroke: 8, strokeCol: "#1a1a1a", maxW: 700 });
      if (this.vBurst && k - this.vBurst < 0.6) {
        const u = (k - this.vBurst) / 0.6;
        ctx.save();
        ctx.globalAlpha = 1 - u;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 14;
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(X0 + j * 140, Y0 + JH / 2, 40 + u * 400, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    drawCans(X0, Y0, f, k, t, bt) {
      const JW = 110, JH = 250, cols = ["#ffd84a", "#7ef0ff", "#ff8adf"];
      for (let j = 0; j < 3; j++) {
        const x = X0 + j * 140, fl = clamp(f - j, 0, 1), y = Y0;
        ctx.save();
        ctx.fillStyle = "rgba(15,25,35,.6)";
        ctx.fillRect(x - JW / 2 + 10, y, JW - 20, JH);
        if (fl > 0) {
          const lh = JH * fl, wv = Math.sin(t * 9 + j) * 5;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x - JW / 2 + 10, y, JW - 20, JH);
          ctx.clip();
          const g = ctx.createLinearGradient(x - JW / 2, 0, x + JW / 2, 0);
          g.addColorStop(0, cols[j]);
          g.addColorStop(0.5, "#fff");
          g.addColorStop(1, cols[j]);
          ctx.fillStyle = g;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.moveTo(x - JW / 2, y + JH);
          ctx.lineTo(x - JW / 2, y + JH - lh + wv);
          ctx.quadraticCurveTo(x, y + JH - lh - wv, x + JW / 2, y + JH - lh + wv);
          ctx.lineTo(x + JW / 2, y + JH);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = "rgba(255,255,255,.8)";
          ctx.lineWidth = 3;
          for (let q = 0; q < 3; q++) {
            const zy = y + JH - (t * 160 + q * 70 + j * 40) % Math.max(30, lh);
            ctx.beginPath();
            ctx.moveTo(x - 18, zy);
            ctx.lineTo(x - 4, zy - 10);
            ctx.lineTo(x + 4, zy + 4);
            ctx.lineTo(x + 18, zy - 6);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.strokeStyle = "#eee4cc";
        ctx.lineWidth = 6;
        ctx.strokeRect(x - JW / 2 + 10, y, JW - 20, JH);
        ctx.fillStyle = "rgba(255,255,255,.25)";
        ctx.fillRect(x - JW / 2 + 18, y + 8, 8, JH - 16);
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 3;
        for (let q = 1; q < 5; q++) {
          const ty = y + JH * q / 5;
          ctx.beginPath();
          ctx.moveTo(x + JW / 2 - 10, ty);
          ctx.lineTo(x + JW / 2 - (q % 2 ? 24 : 32), ty);
          ctx.stroke();
        }
        const cap = (cy, h) => {
          const g = ctx.createLinearGradient(x - JW / 2, 0, x + JW / 2, 0);
          g.addColorStop(0, "#6d7880");
          g.addColorStop(0.45, "#cfd8dc");
          g.addColorStop(1, "#56616a");
          ctx.fillStyle = g;
          ctx.strokeStyle = "#eee4cc";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(x - JW / 2 - 6, cy, JW + 12, h, 8);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#3a4248";
          for (const rx of [-JW / 2 + 6, 0, JW / 2 - 6]) {
            ctx.beginPath();
            ctx.arc(x + rx, cy + h / 2, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        };
        const pop = bt && k - bt < 0.5 ? (k - bt) / 0.5 : 0, po = pop ? -60 * Math.sin(pop * Math.PI) : 0;
        cap(y - 34 + po, 38);
        cap(y + JH - 4, 34);
        if (fl >= 1) {
          ctx.globalCompositeOperation = "lighter";
          const g = ctx.createRadialGradient(x, y + JH / 2, 10, x, y + JH / 2, 170);
          g.addColorStop(0, cols[j] + "88");
          g.addColorStop(1, cols[j] + "00");
          ctx.fillStyle = g;
          ctx.fillRect(x - 170, y - 60, 340, JH + 120);
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = "rgba(240,240,240,.5)";
          for (let q = 0; q < 4; q++) {
            const u = (t * 1.4 + q * 0.25 + j * 0.13) % 1;
            ctx.globalAlpha = 0.6 * (1 - u);
            ctx.beginPath();
            ctx.arc(x + (q % 2 ? 1 : -1) * (JW / 2 + 6 + u * 30), y - 20 - u * 70, 10 + u * 22, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        if (pop) {
          ctx.strokeStyle = "#ffd84a";
          ctx.lineWidth = 4;
          for (let q = 0; q < 8; q++) {
            const a = -Math.PI / 2 + (q - 3.5) * 0.3, r0 = 30 + pop * 120;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * r0 * 0.5, y - 30 + Math.sin(a) * r0 * 0.5);
            ctx.lineTo(x + Math.cos(a) * r0, y - 30 + Math.sin(a) * r0);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }
    /* shared POWER system: claps (only inside prompted CLAP ATTACK windows) surge the canisters, faster = bigger surge; the AHHH scene fills them too; full canisters unleash KNOCKBACK blasts, the beam and the final blow */
    powerTick(dt, k) {
      if (this.state !== "end" || k < KO_T0 || k > KO_BIG + 1) {
        return;
      }
      const bi = barAt(k), b = KO_BARS[bi] || {};
      const win = b.turn === "us";
      if (win && !this.cwOn) {
        this.cwOn = 1;
        this.cwT = k;
        BB.say && BB.say("bb_clapgo", { overlap: true });
      } else if (!win && this.cwOn) {
        this.cwOn = 0;
        this.cwStop = k;
        BB.mic && BB.mic.take && BB.mic.take();
        if (!b.voice && !b.phase)
          BB.say && BB.say("bb_stop", { overlap: true });
      }
      if (!win && BB.mic && BB.mic.onsets && BB.mic.onsets.length && !b.read && !b.chant)
        BB.mic.take();
      if (b.voice)
        this.cf = Math.max(this.cf || 0, this.vf || 0);
      else if (win && b.cw) {
        this.cfT = Math.min(0.6, (this.cfT || 0) + dt * 0.04);
        this.cf = Math.max(this.cfT, this.cfDyn || 0);
      } else if (win && !b.rush && !b.beam)
        this.cf = Math.min(3, (this.cf || 0) + dt * 0.04);
      if (!b.cw && this.dyn && this.dyn.length && !b.clear) {
        this.dyn = [];
        this.cfDyn = 0;
        this.cfT = 0;
      }
      const big = b.clear || b.beam && !(KO_BARS[bi - 1] || {}).beam || k >= KO_BIG;
      if (big && this.cbBar !== (k >= KO_BIG ? -1 : bi)) {
        this.cbBar = k >= KO_BIG ? -1 : bi;
        if (b.clear && k < KO_BIG) {
          this.hitLv = dynLevel(this.cf || 0);
          this.dyn = [];
          this.cfDyn = 0;
          this.cfT = 0;
        } else
          this.cf = 3;
        this.cBurst = k;
      }
      if (this.cBurst && k - this.cBurst > 0.6 && (b.clear || b.rest || this.cf >= 3 && !b.cw) && !b.voice && !b.rush)
        this.cf = 0, this.spIn = 0, ["evboom", "evnooo", "evplop", "evstamp", "evgo", "evsaved", "evthunk", "evmini"].forEach((n) => this[n] = 0);
    }
    drawClapWin(k, t) {
      if (this.state !== "end" || k < KO_T0 || k > KO_BIG)
        return;
      const b = KO_BARS[barAt(k)] || {};
      if (b.turn === "us") {
        const a = 0.75 + 0.25 * Math.sin(t * 10);
        ctx.save();
        ctx.strokeStyle = "rgba(110,230,120," + a + ")";
        ctx.lineWidth = 22;
        ctx.strokeRect(11, 11, W - 22, H - 22);
        ctx.restore();
      } else if (this.cwStop != null && k - this.cwStop < 0.9 && !b.voice && !b.phase) {
        const u = (k - this.cwStop) / 0.9;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (1 - u) * 3);
        ctx.strokeStyle = "#ff5a5a";
        ctx.lineWidth = 22;
        ctx.strokeRect(11, 11, W - 22, H - 22);
        BB.text("STOP!", W / 2, H * 0.85, 110 * (1 + 0.2 * Math.max(0, 1 - u * 4)), "#ff5a5a", { font: "Rammetto One", stroke: 12, strokeCol: "#1a1a1a" });
        ctx.restore();
      }
    }
    /* v14.4 centred CLAP METER: the 3 POWER canisters fill from claps in the window; fill picks the hit size */
    drawMeter(k, t) {
      if (this.state !== "end" || k < KO_T0 || k > KO_BIG)
        return;
      const bi = barAt(k), b = KO_BARS[bi] || {};
      if (b.cw) {
        const f = this.cf || 0, X0 = W / 2 - 140, Y0 = 420, lv = dynLevel(f);
        this.drawCans(X0, Y0, f, k, t, 0);
        const s0 = BS[bi - (b.cw - 1)], left = Math.max(0, 8 - Math.floor((k - s0) / (BL[bi] / 4)));
        for (let q = 0; q < 8; q++)
          BB.rrect(W / 2 - 236 + q * 60, Y0 + 300, 44, 22, 10, q < 8 - left ? "#2d4744" : "#6ee678", "#fff", 3);
        ["p  BLAST", "mf  BIG BLAST", "f  MEGA BLAST"].forEach((w, q) => {
          const x = W / 2 + (q - 1) * 300;
          BB.rrect(x - 135, Y0 + 340, 270, 56, 18, q === lv ? ["#ffe066", "#ff8adf", "#7ef0ff"][q] : "rgba(20,30,40,.75)", "#fff", 3);
          BB.text(w, x, Y0 + 369, 34, q === lv ? "#1a1a1a" : "#9fb0b8", { stroke: 0, maxW: 250 });
        });
      }
      if (b.rush && this.rushN)
        BB.text(this.rushN + (this.rushN === 1 ? " PUNCH!" : " PUNCHES!"), W / 2, 660, Math.min(130, 70 + this.rushN * 2), this.rushN > 30 ? "#ff5a5a" : this.rushN > 15 ? "#ffb020" : "#ffe066", { font: "Rammetto One", stroke: 10, strokeCol: "#1a1a1a" });
    }
    drawPowerHud(k, t) {
      if (this.state !== "end" || k < KO_T0 || k > KO_BIG + 1)
        return;
      const b = KO_BARS[barAt(k)] || {};
      if (b.cw || b.rush || b.voice || b.chant || b.chantIntro || b.phase)
        return;
      ctx.save();
      ctx.translate(40, 170);
      ctx.scale(0.36, 0.36);
      this.drawCans(70, 60, this.cf || 0, k, t, this.cBurst);
      ctx.restore();
      BB.text("POWER", 40 + 0.36 * 210, 170 + 0.36 * 360, 30, "#ffd84a", { stroke: 6, strokeCol: "#1a1a1a" });
    }
    drawFreeze(k, t) {
      if (this.state !== "end" || k < KO_T0 || k > KO_BIG)
        return;
      if (!this.frzL) {
        this.frzL = [];
        let n = 0;
        KO_BARS.forEach((b, i) => {
          const sc = this.sceneOf(b);
          if (sc !== "rush" && sc !== "air")
            return;
          const hs = KO_HITS.filter((h) => (h[1] === "L" || h[1] === "R" || KO_ATK(h[1])) && h[0] >= BS[i] && h[0] < BS[i] + BL[i]);
          const lf = this.frzL[this.frzL.length - 1];
          if (hs.length >= 3 && (!lf || hs[2][0] - lf.t > 15))
            this.frzL.push({ t: hs[2][0], i });
        });
      }
      const HOLD = 0.75, f = this.frzL.find((f2) => k >= f2.t && k < f2.t + HOLD + 0.45);
      if (!f) {
        this.frzS = null;
        return;
      }
      const v = k - f.t;
      if (v < HOLD) {
        if (this.frzS !== f) {
          this.frzS = f;
          const c2 = this.frzC || (this.frzC = document.createElement("canvas"));
          c2.width = W;
          c2.height = H;
          c2.getContext("2d").drawImage(ctx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height, 0, 0, W, H);
          BB.sfx && BB.sfx.bonk && BB.sfx.bonk();
        }
        const c = this.frzC, z = 1.06 + v * 0.04, r = f.i % 2 ? -0.05 : 0.05;
        ctx.save();
        ctx.translate(JR.x * 0.6 + W * 0.2, JR.y - 120);
        ctx.rotate(r);
        ctx.scale(z, z);
        ctx.translate(-(JR.x * 0.6 + W * 0.2), -(JR.y - 120));
        ctx.filter = "grayscale(1) contrast(2.2)";
        ctx.drawImage(c, 0, 0);
        ctx.filter = "none";
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = this.frzL.indexOf(f) % 2 ? "#7ec8ff" : "#ffc870";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = "#fff";
        for (let j = 0; j < 44; j++) {
          const a = j / 44 * Math.PI * 2 + j * 7 % 5 * 0.02, r0 = 260 + j * 53 % 120;
          ctx.lineWidth = 2 + j % 3 * 3;
          ctx.beginPath();
          ctx.moveTo(JR.x + Math.cos(a) * r0, JR.y - 100 + Math.sin(a) * r0);
          ctx.lineTo(JR.x + Math.cos(a) * 1900, JR.y - 100 + Math.sin(a) * 1900);
          ctx.stroke();
        }
        ctx.restore();
        const s = 1 + 0.3 * Math.max(0, 1 - v / 0.12);
        BB.text("3-HIT COMBO!", W * 0.36, H * 0.5, 84 * s, "#ffd84a", { font: "Rammetto One", stroke: 12, strokeCol: "#1a1a1a", maxW: 1200 });
      } else {
        const u = (v - HOLD) / 0.45;
        if (!this.frzB || this.frzB !== f) {
          this.frzB = f;
          BB.shake(28);
          BB.burst(JR.x, JR.y - 90, 40, { cols: ["#fff", "#ffd84a", "#7ef0ff"], kind: "spark", size: 14, speed: 1300, g: 300, life: 1 });
          this.impact && this.impact(3, 1);
        }
        ctx.save();
        ctx.globalAlpha = 1 - u;
        ctx.strokeStyle = "#fff";
        for (let j = 0; j < 3; j++) {
          ctx.lineWidth = 18 - j * 5;
          ctx.beginPath();
          ctx.arc(JR.x, JR.y - 90, 60 + u * (700 + j * 260), 0, Math.PI * 2);
          ctx.stroke();
        }
        if (u < 0.15) {
          ctx.fillStyle = "rgba(255,255,255," + 0.6 * (1 - u / 0.15) + ")";
          ctx.fillRect(0, 0, W, H);
        }
        ctx.restore();
      }
    }
    q(f) {
      (this.qq = this.qq || []).push(f);
    }
    camFor(k) {
      const E = (x) => {
        x = clamp(x, 0, 1);
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      }, win = (v, a, b, r = 0.4) => E((v - a) / r) * (1 - E((v - b + r) / r));
      let z = 1, cx = W / 2, cy = H / 2, rot = 0, px = 0, lb = 0, orb = 0;
      if (this.state === "intro" && this.move && k >= 14) {
        const v = k - 14;
        {
          const w = win(v, 1.5, 3.6, 0.5);
          z += 0.08 * w;
          lb = Math.max(lb, w);
        }
        for (const a of [3.3, 5.8, 8.3, 10.8, 13.3, 17.6]) {
          const w = win(v, a, a + (a === 17.6 ? 2.6 : 2.4), 0.35);
          rot -= 0.035 * w;
          z += 0.075 * w;
          cx = lerp(cx, JR.x - 120, w * 0.6);
          cy = lerp(cy, JR.y - 100, w * 0.6);
        }
        {
          const w = win(v, 15.8, 18, 0.35);
          z += 0.12 * w;
          cx = lerp(cx, LCH.x + 80, w * 0.7);
          cy = lerp(cy, LCH.y + 120, w * 0.7);
        }
        {
          const w = win(v, 20.2, 22, 0.3);
          z += 0.1 * w;
          cx = lerp(cx, JR.x, w * 0.6);
        }
        lb = Math.max(lb, win(v, 0, 3.8, 0.6), win(v, 20.2, 23, 0.3));
      }
      if (this.state === "end") {
        const bi = barAt(k), b = KO_BARS[bi], u = b ? (k - BS[bi]) / BL[bi] : 0, p = KO_BARS[bi - 1];
        if (b && p && p.turn !== b.turn && b.turn && u < 0.3) {
          const d = (b.turn === "us" ? -1 : 1) * 50 * (1 - E(u / 0.3));
          px += d;
          z += 0.04 * (1 - E(u / 0.3));
        }
        if (b && u < 1) {
          const sc = this.sceneOf(b), e = E(Math.min(1, u * 3));
          if (sc === "rush") {
            z += 0.05 * e;
            rot += (bi % 2 ? 0.022 : -0.022) * e;
            cx = lerp(cx, JR.x, 0.5 * e);
          } else if (sc === "dodge") {
            z += 0.06 * e;
            cx = lerp(cx, LCH.x, 0.6 * e);
            cy = lerp(cy, LCH.y, 0.4 * e);
          } else if (sc === "aura") {
            z += 0.07 * e;
            cx = lerp(cx, LCH.x - 120, 0.7 * e);
            cy = lerp(cy, H, 0.5 * e);
          } else if (sc === "beam") {
            z += 0.03 * e;
          }
        }
        if (b && b.chantIntro) {
          z += 0.05 * (1 - E(u));
        }
        if (b && b.shout) {
          const w = Math.sin(Math.min(1, u) * Math.PI);
          z += 0.05 * w;
          cx = lerp(cx, JR.x - 200, w * 0.6);
          cy = lerp(cy, JR.y - 60, w * 0.6);
        }
        if (b && b.chant === "all" && b.lay === 4) {
          z += 0.03 + 0.02 * Math.sin(k * Math.PI * 110 / 60 / 2);
        }
        if (k > KO_BIG && k < KO_CEL + 1) {
          const w = E((k - KO_BIG) / 0.6) * (1 - E((k - KO_CEL) / 1));
          z += 0.05 * w;
          const o = Math.sin((k - KO_BIG) * 1.1) * w;
          px += o * 25;
          orb = o * 15;
          rot += o * 6e-3;
          cy = lerp(cy, H / 2 + 40, w);
        }
      }
      z = Math.min(z, 1.16);
      rot = clamp(rot, -0.04, 0.03);
      const need = 1 + Math.abs(rot) * 1.9 + Math.abs(px) / W * 2;
      z = Math.max(z, need);
      const mx = (z - 1) * W / 2, my = (z - 1) * H / 2;
      let tx = (W / 2 - cx) * (z - 1), ty = (H / 2 - cy) * (z - 1);
      tx = clamp(tx + px, -mx, mx);
      ty = clamp(ty, -my, my);
      return { z, rot, tx, ty, lb, orb };
    }
    drawLetterbox(lb) {
      if (lb <= 0.01)
        return;
      const h = 64 * lb;
      ctx.save();
      ctx.fillStyle = "#0b0f14";
      ctx.fillRect(0, 0, W, h);
      ctx.fillRect(0, H - h, W, h);
      ctx.restore();
    }
    drawReplay(k, t) {
      if (this.state !== "end")
        return;
      const bi = barAt(k), b = KO_BARS[bi], p = KO_BARS[bi - 1];
      if (!b || !p || !(p.shout && p.ws[0] === "RHYTHM ENGINEERS!") && !(KO_BARS[bi - 2] && KO_BARS[bi - 2].shout && KO_BARS[bi - 2].ws[0] === "RHYTHM ENGINEERS!"))
        return;
      const v = k - BS[KO_BARS.indexOf(p.shout ? p : KO_BARS[bi - 2]) + 1];
      if (v < 0 || v > 2.6)
        return;
      const a = clamp(Math.min(v / 0.2, (2.6 - v) / 0.3), 0, 1), x = W - 470, y = H - 420, w = 420, h = 280;
      ctx.save();
      ctx.globalAlpha = a;
      BB.panel(x, y, w, h, 24);
      ctx.beginPath();
      ctx.rect(x + 14, y + 14, w - 28, h - 28);
      ctx.clip();
      ctx.fillStyle = "#24323a";
      ctx.fillRect(x + 14, y + 14, w - 28, h - 28);
      const s = v * 0.35, jx = x + 120 + s * 260, jy = y + 190 - Math.sin(Math.min(1, s) * Math.PI) * 90;
      ctx.translate(jx, jy);
      ctx.rotate(s * 5);
      ctx.scale(0.42, 0.42);
      BB.staticJr(0, 230, 300, { dizzy: true, glitch: 0.3 });
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = a;
      BB.text("REPLAY", x + 90, y + 52, 40, "#ff5a5a", { font: "Rammetto One", stroke: 6 });
      BB.text("slow-mo x4", x + w - 100, y + h - 36, 30, "#fff", { stroke: 5 });
      ctx.restore();
    }
    drawChant(k, t) {
      const bi = barAt(k), b = KO_BARS[bi];
      if (!b || !(b.chant || b.chantIntro))
        return;
      const bt = (k - BS[bi]) / BL[bi] * 4, beat = Math.min(3, Math.floor(bt)), fr = bt - beat, pw = 1140, ph = 250, px = W / 2 - pw / 2, py = 300, ee = 1 - Math.pow(1 - clamp((k - BS[bi]) / 0.3, 0, 1), 3), cw = pw / 4;
      ctx.save();
      if (b.chantIntro) {
        const s = lerp(0.6, 1, ee);
        ctx.translate(W / 2, py + ph / 2);
        ctx.scale(s, s);
        ctx.translate(-W / 2, -(py + ph / 2));
        BB.panel(px, py, pw, ph, 30);
        BB.text("CHANT TIME!", W / 2, py + 100, 90, "#ffe066", { font: "Rammetto One", stroke: 9 });
        BB.text("Listen to your teacher, then echo!", W / 2, py + 190, 48, "#fff", { stroke: 6 });
        ctx.restore();
        return;
      }
      BB.panel(px, py, pw, ph, 30);
      const hd = { lead: ["TEACHER", "#7ec8ff"], echo: ["CLASS ECHO", "#6ee678"], crowd: ["CLASS", "#ff8adf"], all: ["EVERYBODY", "#ffe066"] }[b.chant];
      {
        const p = Math.exp(-fr * 5);
        ctx.save();
        ctx.globalAlpha = 0.25 + 0.5 * p;
        ctx.fillStyle = hd[1];
        ctx.beginPath();
        ctx.arc(px + 60, py + 46, 14 + 10 * p, 0, 7);
        ctx.arc(px + pw - 60, py + 46, 14 + 10 * p, 0, 7);
        ctx.fill();
        ctx.restore();
      }
      BB.text(hd[0], W / 2, py + 46, 40, hd[1], { stroke: 5 });
      if (b.ws.length === 1) {
        const s = b.shout ? 1 + 0.25 * Math.exp(-((k - BS[bi]) * 6)) : 1;
        ctx.save();
        ctx.translate(W / 2, py + 140);
        ctx.scale(s, s);
        BB.text(b.ws[0], 0, 0, b.shout ? 84 : 76, b.shout ? "#ffe066" : "#fff", { font: b.shout ? "Rammetto One" : "Lilita One", stroke: 9, maxW: pw - 80 });
        ctx.restore();
      } else {
        b.ws.forEach((w, i) => {
          const x = px + cw * (i + 0.5), on = i === beat;
          BB.text(w, x, py + 140 - (on ? 8 * Math.sin(Math.min(1, fr * 3) * Math.PI) : 0), on ? 74 : 64, on ? "#ffe066" : i < beat ? "#cfe8ff" : "#ffffff", { stroke: on ? 9 : 6 });
        });
        ctx.save();
        ctx.fillStyle = "#ff8adf";
        ctx.strokeStyle = "#3a1040";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(px + cw * (beat + 0.5), py + 86 - Math.abs(Math.sin(fr * Math.PI)) * 30, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      for (let x = 0; x < 4; x++) {
        const on = bt >= x && bt < x + 0.5;
        ctx.fillStyle = on ? "#ffe066" : "rgba(255,255,255,.3)";
        ctx.beginPath();
        ctx.arc(px + cw * (x + 0.5), py + 216, on ? 11 : 7, 0, 7);
        ctx.fill();
      }
      if ((beat === 1 || beat === 3) && fr < 0.25) {
        ctx.save();
        ctx.globalAlpha = 0.1 * (1 - fr / 0.25) * ((b.lay || 1) / 2);
        ctx.fillStyle = "#fff3c0";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      ctx.restore();
    }
    drawReward(k, t) {
      ctx.save();
      ctx.fillStyle = "rgba(8,12,24,.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      if (k < 8) {
        const s = k < 0.3 ? lerp(2.6, 1, k / 0.3) : 1 + 0.03 * Math.sin(t * 6);
        ctx.save();
        ctx.translate(W / 2, 215);
        ctx.scale(s, s);
        BB.text("YOU FIXED THE FACTORY!", 0, 0, 88, "#ffd63c", { font: "Rammetto One", stroke: 12, strokeCol: "#782814" });
        ctx.restore();
        const L = [["LEVEL 1", "gear", "#6ee678"], ["LEVEL 2", "box", "#5ac8fa"], ["LEVEL 3", "bolt", "#ff8adf"], ["LEVEL 4", "truck", "#ffd63c"]];
        L.forEach(([n, ic, c], i) => {
          const v = k - (1.6 + i * 1.2);
          if (v < 0)
            return;
          const sc = ease.back ? ease.back(clamp(v / 0.4, 0, 1)) : 1, x = W / 2 - 450 + i * 320, y = 540;
          if (v < 0.05 && !this["bd" + i]) {
            this["bd" + i] = 1;
            BB.sfx.pkTa && BB.sfx.pkTa();
            BB.sfx.chime && BB.sfx.chime();
            BB.burst(x, y, 24, { cols: [c, "#fff", "#ffe066"], kind: "star", size: 12, speed: 700, g: 300 });
          }
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(sc, sc);
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(0, 0, 120, 0, 7);
          ctx.fill();
          ctx.strokeStyle = "#eee4cc";
          ctx.lineWidth = 8;
          ctx.stroke();
          ctx.fillStyle = "#1d3b38";
          ctx.beginPath();
          ctx.arc(0, 0, 96, 0, 7);
          ctx.fill();
          if (ic === "gear") {
            ctx.fillStyle = c;
            for (let j = 0; j < 8; j++) {
              ctx.save();
              ctx.rotate(j * Math.PI / 4 + t * 0.5);
              ctx.fillRect(-12, -70, 24, 28);
              ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(0, 0, 48, 0, 7);
            ctx.fill();
            ctx.fillStyle = "#1e3b38";
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, 7);
            ctx.fill();
          } else if (ic === "box") {
            BB.rrect(-55, -45, 110, 90, 8, BB.lg(-45, 45, ["#e2b272", "#b07a40"]), "#5a3a1e", 5);
            ctx.fillStyle = "rgba(240,220,170,.85)";
            ctx.fillRect(-10, -45, 20, 90);
          } else if (ic === "bolt") {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.moveTo(10, -70);
            ctx.lineTo(-40, 10);
            ctx.lineTo(0, 10);
            ctx.lineTo(-12, 70);
            ctx.lineTo(42, -14);
            ctx.lineTo(4, -14);
            ctx.closePath();
            ctx.fill();
          } else {
            BB.rrect(-70, -35, 90, 60, 8, "#e8e0d0", "#5a3a1e", 4);
            BB.rrect(20, -20, 48, 45, 8, "#6fd0b8", "#5a3a1e", 4);
            ctx.fillStyle = "#1e2228";
            ctx.beginPath();
            ctx.arc(-45, 32, 13, 0, 7);
            ctx.arc(40, 32, 13, 0, 7);
            ctx.fill();
          }
          BB.text(n, 0, 158, 40, "#fff", { stroke: 6 });
          BB.text("COMPLETE!", 0, 198, 30, c, { stroke: 5 });
          ctx.restore();
        });
        if (k > 2)
          R.bubble(LCH.x - 10, LCH.y - 310, "woo-hoo! party time!");
      } else if (k < 11.2) {
        const v = k - 8, s = v < 0.3 ? lerp(3, 1, v / 0.3) : 1 + 0.04 * Math.sin(t * 8);
        if (v < 0.05 && !this.rvl) {
          this.rvl = 1;
          BB.shake(18);
          BB.sfx.pkTa && BB.sfx.pkTa();
          BB.sfx.bonk && BB.sfx.bonk();
          BB.burst(W / 2, 400, 50, { cols: ["#ffe066", "#ff8adf", "#7ef0ff", "#6ee678"], kind: "star", size: 15, speed: 1100, g: 400 });
        }
        ctx.save();
        ctx.translate(W / 2, 330);
        ctx.scale(s, s);
        BB.text("YOUR REWARD:", 0, -90, 64, "#fff", { stroke: 9 });
        BB.text("BOSS BRAIN BREAK!", 0, 30, 120, "#ff8adf", { font: "Rammetto One", stroke: 14, strokeCol: "#3a1040" });
        ctx.restore();
        if (v < 0.12) {
          ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - v / 0.12)})`;
          ctx.fillRect(0, 0, W, H);
        }
      } else {
        BB.panel(W / 2 - 560, 140, 1120, 200, 30);
        BB.text("STAND UP, RHYTHM ENGINEERS!", W / 2, 190, 64, COL.yellow, { stroke: 8, maxW: 1060 });
        BB.text("DODGE: duck, lean, freeze, jump.  ATTACK: CLAP! Faster = stronger!  Everybody wins!", W / 2, 265, 34, "#fff", { stroke: 5, maxW: 1040 });
      }
      this.q(() => BB.button(W - 300, 30, 260, 90, "SKIP", { size: 40, id: "rwskip", onClick: () => {
        if (this.state === "intro") {
          BB.sayStop && BB.sayStop();
          this.startKO();
        }
      } }));
    }
    drawTease(k, t) {
      const v = k - (KO_CEL + 3);
      if (v < 0)
        return;
      if (!this.teased) {
        this.teased = 1;
        BB.say("bb_tease", { overlap: true });
      }
      const a = clamp(v / 1, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.55;
      const g = ctx.createLinearGradient(LCH.x, 0, LCH.x - 120, LCH.y);
      g.addColorStop(0, "rgba(255,250,220,.9)");
      g.addColorStop(1, "rgba(255,250,220,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(LCH.x - 260, 0);
      ctx.lineTo(LCH.x + 60, 0);
      ctx.lineTo(LCH.x + 40, LCH.y + 80);
      ctx.lineTo(LCH.x - 420, LCH.y + 80);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = a;
      for (let i = 0; i < 6; i++) {
        const x = LCH.x - 300 + i * 70, y = 40 + i * 37 % 60, s = 0.6 + 0.4 * Math.sin(t * 4 + i);
        BB.text("\u2726", x, y, 30 * s + 10, "#fff8c0", { stroke: 0 });
      }
      R.bubble(LCH.x + 60, LCH.y - 330, "next stop... somewhere new!");
      ctx.restore();
    }
    /* v14.5.11 thrown junk rendered like the robots (same recipe as art.js jrCanvas 'vol'): vertical material gradient, warm key light
       upper-left, ambient-occlusion bottom, dark right edge, warm + cool (cyan) rim strokes, glossy specular, thin dark-brown outline, wear specks. */
    junkVol(path, x, y, w, h, cols, o = {}) {
      const g = ctx, LG = (x0, y0, x1, y1, a) => {
        const G = g.createLinearGradient(x0, y0, x1, y1);
        a.forEach((v, i) => G.addColorStop(i / (a.length - 1), v));
        return G;
      };
      g.save();
      path();
      g.fillStyle = LG(0, y, 0, y + h, cols);
      g.fill();
      g.clip();
      const R2 = g.createRadialGradient(x + w * 0.3, y + h * 0.22, 0, x + w * 0.3, y + h * 0.22, Math.max(w, h) * 0.75);
      R2.addColorStop(0, "rgba(255,226,180,.45)");
      R2.addColorStop(0.5, "rgba(255,200,150,.12)");
      R2.addColorStop(1, "rgba(255,200,150,0)");
      g.fillStyle = R2;
      g.fillRect(x, y, w, h);
      g.fillStyle = LG(0, y + h * 0.55, 0, y + h, ["rgba(40,15,5,0)", "rgba(40,15,5,.45)"]);
      g.fillRect(x, y, w, h);
      g.fillStyle = LG(x + w * 0.72, 0, x + w, 0, ["rgba(0,0,0,0)", "rgba(30,10,0,.35)"]);
      g.fillRect(x, y, w, h);
      if (o.wear) {
        let sd = o.wear;
        const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647;
        for (let i = 0; i < 14; i++) {
          g.fillStyle = `rgba(${o.wc || "90,50,20"},${0.15 + rnd() * 0.25})`;
          g.beginPath();
          g.ellipse(x + rnd() * w, y + rnd() * h, 1 + rnd() * 3.5, 1 + rnd() * 2.5, rnd() * 3, 0, 7);
          g.fill();
        }
      }
      if (o.extra)
        o.extra();
      g.lineWidth = 3;
      g.strokeStyle = "rgba(255,236,200,.55)";
      g.translate(1.5, 1.5);
      path();
      g.stroke();
      g.translate(-3, -3);
      g.strokeStyle = "rgba(130,220,230,.35)";
      path();
      g.stroke();
      g.restore();
      g.save();
      path();
      g.lineWidth = 3.5;
      g.strokeStyle = "rgba(45,18,6,.9)";
      g.stroke();
      g.restore();
    }
    junkSpec(x, y, rx, ry, r, a) {
      ctx.save();
      const G = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      G.addColorStop(0, `rgba(255,255,255,${a || 0.85})`);
      G.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = G;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, r || -0.5, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    junkShadow() {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.beginPath();
      ctx.ellipse(6, 78, 70, 10, 0, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    drawJunk(j, t) {
      const V = (p, x, y, w, h, c, o) => this.junkVol(p, x, y, w, h, c, o), S = (...a) => this.junkSpec(...a), B = () => ctx.beginPath();
      if (j === "bomb") {
        B();
        ctx.save();
        const G = ctx.createRadialGradient(-16, -10, 4, 0, 6, 48);
        G.addColorStop(0, "#9b8ce6");
        G.addColorStop(0.45, "#5b4bb0");
        G.addColorStop(1, "#241a5a");
        ctx.fillStyle = G;
        ctx.arc(0, 6, 44, 0, 7);
        ctx.fill();
        ctx.restore();
        V(() => {
          B();
          ctx.arc(0, 6, 44, 0, 7);
        }, -44, -38, 88, 88, ["rgba(0,0,0,0)", "rgba(0,0,0,0)"], { wear: 7, wc: "20,10,40" });
        S(-17, -14, 13, 8, -0.6);
        V(() => {
          B();
          ctx.roundRect(-15, -48, 30, 15, 4);
        }, -15, -48, 30, 15, ["#dfe6ea", "#9aa6ae", "#5d6870"], { wear: 3, wc: "110,60,20" });
        ctx.save();
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(45,18,6,.9)";
        ctx.lineWidth = 7;
        B();
        ctx.moveTo(0, -48);
        ctx.quadraticCurveTo(14, -64, 6, -76);
        ctx.stroke();
        ctx.strokeStyle = "#d9b27a";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = "#8a6232";
        ctx.stroke();
        ctx.restore();
        const sp = Math.sin(t * 40) > 0, gl = ctx.createRadialGradient(6, -80, 0, 6, -80, sp ? 26 : 18);
        gl.addColorStop(0, "rgba(255,255,230,1)");
        gl.addColorStop(0.35, "rgba(255,214,90,.9)");
        gl.addColorStop(1, "rgba(255,160,40,0)");
        ctx.fillStyle = gl;
        B();
        ctx.arc(6, -80, sp ? 26 : 18, 0, 7);
        ctx.fill();
        for (const d of [-14, 14]) {
          B();
          ctx.ellipse(d, 2, 10, 11, 0, 0, 7);
          ctx.fillStyle = "#f6f2ea";
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "rgba(45,18,6,.9)";
          ctx.stroke();
          B();
          ctx.arc(d + 2, 4, 5, 0, 7);
          ctx.fillStyle = "#14121c";
          ctx.fill();
          S(d + 4, 1, 2.5, 2.5, 0, 1);
        }
        ctx.save();
        ctx.strokeStyle = "#7ef0ff";
        ctx.shadowColor = "#7ef0ff";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3.5;
        B();
        ctx.moveTo(-14, 24);
        ctx.lineTo(-6, 30);
        ctx.lineTo(2, 22);
        ctx.lineTo(10, 30);
        ctx.lineTo(16, 24);
        ctx.stroke();
        ctx.restore();
      } else if (j === "sock") {
        const sp = () => {
          B();
          ctx.moveTo(-30, -58);
          ctx.lineTo(16, -58);
          ctx.lineTo(16, 6);
          ctx.quadraticCurveTo(18, 18, 34, 20);
          ctx.lineTo(70, 20);
          ctx.quadraticCurveTo(96, 22, 96, 44);
          ctx.quadraticCurveTo(96, 66, 70, 66);
          ctx.lineTo(-2, 66);
          ctx.quadraticCurveTo(-32, 66, -32, 34);
          ctx.closePath();
        };
        V(sp, -32, -58, 128, 124, ["#fffaf0", "#ece3cf", "#c7b99c"], { wear: 5, wc: "120,95,60", extra: () => {
          const RG = (x, y, r, c1, c2) => {
            const G = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, r);
            G.addColorStop(0, c1);
            G.addColorStop(1, c2);
            return G;
          };
          ctx.fillStyle = RG(-30, 66, 36, "#ef6a58", "#9e2a20");
          B();
          ctx.arc(-30, 66, 34, 0, 7);
          ctx.fill();
          ctx.fillStyle = RG(100, 44, 32, "#ef6a58", "#9e2a20");
          B();
          ctx.arc(100, 44, 30, 0, 7);
          ctx.fill();
          for (const y of [-30, -10]) {
            const G = ctx.createLinearGradient(0, y, 0, y + 10);
            G.addColorStop(0, "#7fd0c6");
            G.addColorStop(1, "#2f7c74");
            ctx.fillStyle = G;
            ctx.fillRect(-40, y, 70, 10);
          }
          ctx.strokeStyle = "rgba(120,100,70,.18)";
          ctx.lineWidth = 1.5;
          for (let x = -28; x < 96; x += 7) {
            B();
            ctx.moveTo(x, -58);
            ctx.lineTo(x, 70);
            ctx.stroke();
          }
        } });
        S(-14, -36, 7, 18, 0, 0.5);
        V(() => {
          B();
          ctx.roundRect(-36, -80, 58, 26, 7);
        }, -36, -80, 58, 26, ["#fbf6ea", "#e2d8c2", "#b9aa8c"]);
        ctx.strokeStyle = "rgba(90,70,45,.55)";
        ctx.lineWidth = 2.5;
        for (let q = 0; q < 5; q++) {
          B();
          ctx.moveTo(-26 + q * 10, -77);
          ctx.lineTo(-26 + q * 10, -57);
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(140,170,70,.85)";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        for (let q = 0; q < 3; q++) {
          const a = t * 6 + q * 2;
          B();
          ctx.moveTo(-20 + q * 16, -90);
          ctx.quadraticCurveTo(-12 + q * 16 + Math.sin(a) * 6, -106, -20 + q * 16, -122);
          ctx.stroke();
        }
      } else if (j === "chicken") {
        V(() => {
          B();
          ctx.ellipse(0, 0, 74, 24, 0, 0, 7);
        }, -74, -24, 148, 48, ["#fff1a0", "#f5c935", "#b9800f"], { wear: 9, wc: "150,90,10" });
        S(-6, -12, 34, 6, 0, 0.8);
        V(() => {
          B();
          ctx.moveTo(74, -10);
          ctx.lineTo(92, -18);
          ctx.lineTo(88, 0);
          ctx.lineTo(92, 18);
          ctx.lineTo(74, 10);
          ctx.closePath();
        }, 74, -18, 18, 36, ["#fff1a0", "#f0bf2a", "#b9800f"]);
        V(() => {
          B();
          ctx.arc(-74, -6, 20, 0, 7);
        }, -94, -26, 40, 40, ["#fff1a0", "#f5c935", "#b9800f"]);
        S(-80, -14, 7, 4, -0.5, 0.8);
        V(() => {
          B();
          ctx.moveTo(-82, -23);
          ctx.lineTo(-76, -38);
          ctx.lineTo(-68, -27);
          ctx.lineTo(-60, -37);
          ctx.lineTo(-58, -20);
          ctx.closePath();
        }, -82, -38, 24, 18, ["#ff7a6a", "#d8322a", "#8e1a16"]);
        V(() => {
          B();
          ctx.moveTo(-92, -4);
          ctx.lineTo(-118, 2);
          ctx.lineTo(-92, 8);
          ctx.closePath();
        }, -118, -4, 26, 12, ["#ffc070", "#ff9c3a", "#b8601a"]);
        B();
        ctx.arc(-78, -10, 4.5, 0, 7);
        ctx.fillStyle = "#14121c";
        ctx.fill();
        S(-79, -11.5, 1.6, 1.6, 0, 1);
        ctx.strokeStyle = "rgba(45,18,6,.8)";
        ctx.lineWidth = 3;
        for (const d of [-10, 10]) {
          B();
          ctx.moveTo(-68 + d, -14);
          ctx.lineTo(-76 + d, -6);
          ctx.stroke();
        }
      } else
        this.drawTireRoll(t * 8);
    }
    drawTireRoll(ph) {
      const B = () => ctx.beginPath(), V = (p, x, y, w, h, c, o) => this.junkVol(p, x, y, w, h, c, o);
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.3)";
      B();
      ctx.ellipse(6, 66, 56, 11, 0, 0, 7);
      ctx.fill();
      ctx.restore();
      V(() => {
        B();
        ctx.ellipse(-14, 0, 30, 62, 0, 0, 7);
      }, -44, -62, 60, 124, ["#4d535c", "#2e3239", "#15171b"], { wear: 4, wc: "150,140,120" });
      B();
      ctx.ellipse(-16, 0, 13, 30, 0, 0, 7);
      const hub = ctx.createLinearGradient(0, -30, 0, 30);
      hub.addColorStop(0, "#e3eaee");
      hub.addColorStop(0.5, "#8d9aa3");
      hub.addColorStop(1, "#4d575e");
      ctx.fillStyle = hub;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(45,18,6,.9)";
      ctx.stroke();
      V(() => {
        B();
        ctx.roundRect(-14, -62, 56, 124, 26);
      }, -14, -62, 56, 124, ["#3f444c", "#25282e", "#111316"], { wear: 2, wc: "170,160,140", extra: () => {
        for (let q = -3; q < 6; q++) {
          const y = -62 + ((q * 26 + ph * 26) % (26 * 8) + 26 * 8) % (26 * 8) - 26;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#0b0c0e";
          ctx.lineWidth = 8;
          B();
          ctx.moveTo(-10, y);
          ctx.lineTo(14, y + 10);
          ctx.lineTo(38, y);
          ctx.stroke();
          ctx.strokeStyle = "rgba(190,200,210,.35)";
          ctx.lineWidth = 2;
          B();
          ctx.moveTo(-10, y - 4);
          ctx.lineTo(14, y + 6);
          ctx.lineTo(38, y - 4);
          ctx.stroke();
        }
      } });
      this.junkSpec(0, -30, 5, 26, 0, 0.35);
    }
    drawBlastRing(x, y, R2, u) {
      if (u < 0 || u > 1)
        return;
      const e = 1 - Math.pow(1 - u, 3), r = R2 * (0.35 + 0.65 * e);
      ctx.save();
      ctx.globalAlpha = 1 - u;
      ctx.translate(x, y);
      ctx.beginPath();
      for (let q = 0; q < 16; q++) {
        const a = q / 16 * Math.PI * 2, rr = q % 2 ? r * 0.62 : r;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = "#ffe066";
      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 8;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, 7);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    koIcon(ic, x, y, t) {
      ctx.save();
      ctx.translate(x, y);
      BB.rrect(-80, -80, 160, 160, 24, "#1e3b38", "#fff", 4);
      ctx.fillStyle = "#ffe066";
      ctx.strokeStyle = "#5a3a1e";
      ctx.lineWidth = 5;
      const tri = (r) => {
        ctx.save();
        ctx.rotate(r);
        ctx.beginPath();
        ctx.moveTo(50, 0);
        ctx.lineTo(-20, -42);
        ctx.lineTo(-20, 42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      const fist = (dx, dir) => {
        ctx.save();
        ctx.translate(dx, 0);
        ctx.scale(dir, 1);
        BB.rrect(-30, -30, 60, 60, 18, BB.lg(-30, 30, ["#e2b272", "#b07a40"]), "#5a3a1e", 4);
        ctx.fillStyle = "#ffe066";
        ctx.fillRect(-62, -6, 26, 12);
        ctx.restore();
      };
      if (ic === "L")
        fist(-6, -1);
      else if (ic === "R")
        fist(6, 1);
      else if (ic === "LR") {
        ctx.scale(0.7, 0.7);
        fist(-42, -1);
        fist(42, 1);
      } else if (ic === "duck")
        tri(Math.PI / 2);
      else if (ic === "jump")
        tri(-Math.PI / 2);
      else if (ic === "clap") {
        const c = Math.abs(Math.sin(t * Math.PI / 0.6)) * 14;
        BB.rrect(-50 - c, -40, 44, 80, 18, "#e8e0d0", "#5a3a1e", 4);
        BB.rrect(6 + c, -40, 44, 80, 18, "#e8e0d0", "#5a3a1e", 4);
      } else if (ic === "pick") {
        ctx.rotate(-0.6);
        ctx.fillStyle = "#8a5a2e";
        ctx.fillRect(-6, -20, 12, 80);
        ctx.beginPath();
        ctx.moveTo(-55, -15);
        ctx.quadraticCurveTo(0, -50, 55, -15);
        ctx.lineTo(0, -28);
        ctx.closePath();
        ctx.fillStyle = "#c9d6de";
        ctx.fill();
      } else if (ic === "pat") {
        BB.rrect(-50, -10, 100, 60, 8, BB.lg(-10, 50, ["#e2b272", "#b07a40"]), "#5a3a1e", 4);
        BB.rrect(-26, -60 + Math.abs(Math.sin(t * 5)) * 20, 52, 40, 16, "#e8e0d0", "#5a3a1e", 4);
      } else if (ic === "stampI") {
        BB.rrect(-14, -60, 28, 50, 6, "#7d8c96", COL.ink, 3);
        BB.rrect(-50, -14, 100, 40, 8, "#c9d6de", COL.ink, 4);
        BB.rrect(-46, 26, 92, 16, 4, "#d24a3c", COL.ink, 3);
      } else if (ic === "push") {
        BB.rrect(-60, -30, 90, 60, 10, "#ffd63c", "#5a3a1e", 4);
        ctx.fillStyle = "#1e2228";
        ctx.beginPath();
        ctx.arc(-40, 36, 14, 0, 7);
        ctx.arc(10, 36, 14, 0, 7);
        ctx.fill();
        tri(0);
      } else if (ic === "soft") {
        BB.rrect(-20, -40, 40, 60, 20, "#fff", "#5a3a1e", 4);
        ctx.globalAlpha = 0.6;
        for (const d of [-44, 44])
          BB.text("~", d, -6, 44, "#ffe066", { stroke: 3 });
        ctx.globalAlpha = 1;
        BB.text("shh", 0, 52, 28, "#fff", { stroke: 3 });
      } else if (ic === "loud") {
        ctx.rotate(Math.sin(t * 30) * 0.2);
        BB.rrect(-26, -48, 52, 76, 26, "#fff", "#5a3a1e", 4);
        for (const d of [-1, 1])
          for (let j = 0; j < 3; j++) {
            ctx.strokeStyle = "#ffe066";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(d * 40, -30 + j * 25);
            ctx.lineTo(d * 66, -36 + j * 30);
            ctx.stroke();
          }
      } else if (ic === "freeze") {
        ctx.strokeStyle = "#bff8ff";
        ctx.lineWidth = 8;
        for (let j = 0; j < 3; j++) {
          ctx.save();
          ctx.rotate(j * Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(-55, 0);
          ctx.lineTo(55, 0);
          ctx.stroke();
          ctx.restore();
        }
      } else if (ic === "stomp") {
        for (const d of [-30, 30]) {
          BB.rrect(d - 22, -30 + (Math.sin(t * 10 + d) > 0 ? -8 : 0), 44, 70, 10, "#ffe066", "#5a3a1e", 4);
        }
      } else
        BB.text("!", 0, 10, 100, "#ffe066", { font: "Rammetto One", stroke: 6 });
      ctx.restore();
    }
    draw() {
      const t = BB.t;
      let k = t - this.st;
      if (this.hs && t < this.hs.until)
        k = this.hs.k;
      const CAM = this.state === "load" ? { z: 1, rot: 0, tx: 0, ty: 0, lb: 0, orb: 0 } : this.camFor(k);
      {
        const bz = 1 + (CAM.z - 1) * 0.45 + (CAM.orb ? 0.04 : 0);
        ctx.save();
        ctx.translate(W / 2 + CAM.tx * 0.45 - (CAM.orb || 0) * 0.6, H / 2 + CAM.ty * 0.45);
        ctx.rotate(CAM.rot * 0.45);
        ctx.scale(bz, bz);
        ctx.translate(-W / 2, -H / 2);
        if (this.static)
          ctx.drawImage(this.static, 0, 0, W, H);
        else {
          ctx.fillStyle = "#111";
          ctx.fillRect(0, 0, W, H);
        }
        ctx.restore();
      }
      R.drawMotes(this.motes, BB.dt || 0.016, t);
      if (this.state === "load")
        return;
      this.qq = [];
      ctx.save();
      ctx.translate(W / 2 + CAM.tx, H / 2 + CAM.ty);
      ctx.rotate(CAM.rot);
      ctx.scale(CAM.z, CAM.z);
      ctx.translate(-W / 2, -H / 2);
      this.drawSceneBack(k, t);
      const end = this.state === "end", dx = end ? Math.max(0, k - (KO_BIG + 4.6)) ** 2 * 520 : 0, fill = end ? clamp(Math.floor(barAt(k) / (KO_BARS.length - 1) * TOTAL) + 1, 0, TOTAL) : Math.min(TOTAL, this.n);
      if (!(this.state === "end" && k < KO_BIG && (KO_BARS[barAt(k)] || {}).read))
        R.paint(ctx, () => this.drawTruck(TRK.x + dx, TRK.y, fill, { spin: end ? Math.max(0, k - (KO_BIG + 4.6)) * 14 : 0 }));
      if (!end && !(this.move && this.state === "intro")) {
        this.drawJr();
        this.drawHP();
      } else if (!(this.move && this.state === "intro")) {
        const hv = this.heroV(k);
        let z = 1;
        if (hv != null)
          z = hv < 0 ? 1 + (this.heroS === 3 ? 0.35 : 0.22) * clamp(1 + hv / this.heroW, 0, 1) : 1 + 0.22 * Math.max(0, 1 - hv / 0.15);
        ctx.save();
        if (z > 1) {
          ctx.translate(JR.x, JR.y - 90);
          ctx.scale(z, z);
          ctx.translate(-JR.x, -(JR.y - 90));
        }
        this.drawKO(k, t);
        ctx.restore();
        this.drawChant(k, t);
      }
      R.paint(ctx, () => this.drawLauncher());
      if (this.seq && !end && this.state !== "intro") {
        let bx = 760, by = 470, s = 1, rot = 0, show = this.seq;
        if (this.state === "show") {
          const e = ease.out(clamp(k / 0.6, 0, 1));
          by = lerp(-200, 470, e);
        }
        if (this.state === "throw") {
          const u = clamp(k / 0.9, 0, 1);
          if (u < 1) {
            bx = lerp(760, JR.x, u);
            by = lerp(470, JR.y - 150, u) - Math.sin(u * Math.PI) * 260;
            s = lerp(1, 0.4, u);
            rot = u * 6;
          } else {
            const v = clamp((k - 0.9) / 0.8, 0, 1);
            const sl = this.n - 1, c = sl % 4, r = 1 - (sl / 4 | 0);
            bx = lerp(JR.x, TRK.x + 74 + c * 110, v);
            by = lerp(JR.y - 150, TRK.y + 100 + r * 82, ease.in ? ease.in(v) : v * v);
            s = lerp(0.4, 0.25, v);
            rot = 6 + v * 2;
            show = null;
          }
        }
        if (!(this.state === "throw" && k > 1.7)) {
          if (BB.fuzz) {
            ctx.save();
            ctx.translate((Math.random() - 0.5) * 14, 0);
          }
          this.drawBox(bx, by, s, show, rot);
          if (BB.fuzz)
            ctx.restore();
        }
      }
      for (const b of this.bolts) {
        const u = (BB.t - b.t) / 0.7;
        if (u < 0)
          continue;
        if (u < 1) {
          const x = lerp(b.x, b.tx, u), y = lerp(b.y, b.ty, u), sz = 20 + u * 90;
          ctx.save();
          ctx.strokeStyle = "#bff8ff";
          ctx.shadowColor = "#7ef0ff";
          ctx.shadowBlur = 24;
          ctx.lineWidth = 4 + u * 8;
          ctx.beginPath();
          ctx.moveTo(x - sz, y - sz * 0.3);
          for (let i = 0; i < 5; i++)
            ctx.lineTo(x - sz + i * sz / 2, y + (i % 2 ? sz * 0.4 : -sz * 0.4));
          ctx.stroke();
          ctx.restore();
        } else {
          const v = (u - 1) / 0.57;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - v);
          ctx.fillStyle = "#e8ffff";
          ctx.beginPath();
          ctx.arc(b.tx, b.ty, 60 + v * 80, 0, 7);
          ctx.fill();
          BB.text("ZZT!", b.tx, b.ty, 48, "#2a6f8a", { font: "Rammetto One", stroke: 0 });
          ctx.restore();
        }
      }
      for (const f of this.fx)
        if (f.k === "bonk" && t - f.t < 1)
          BB.text("BONK!", JR.x, JR.y - 380 - (t - f.t) * 40, 90, COL.yellow, { font: "Rammetto One", stroke: 9 });
      this.fx = this.fx.filter((f) => t - f.t < 1);
      if (this.face) {
        const f = this.face, s = 95;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.drag ? 0 : Math.sin(t * 3) * 0.1);
        BB.rrect(-s, -s, s * 2, s * 2, 16, BB.lg(-s, s, ["#9b8fe0", "#4b3f8f"]), COL.ink, 6);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(-s + 5, -s + 5, s * 2 - 10, s * 2 - 10, 12);
        ctx.clip();
        BB.staticJr(0, s * 1.25, s * 2.1, {});
        ctx.restore();
        BB.rrect(-90, s + 6, 180, 34, 10, "rgba(12,28,26,.85)", COL.yellow, 2);
        BB.text(f.drag ? "DROP ON HIS HEAD!" : "DRAG ME TO HIM!", 0, s + 23, 18, "#fff", { maxW: 170 });
        ctx.restore();
        if (!f.drag) {
          ctx.save();
          ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 8);
          ctx.strokeStyle = COL.yellow;
          ctx.lineWidth = 6;
          ctx.setLineDash([14, 10]);
          ctx.beginPath();
          ctx.moveTo(f.x, f.y - s);
          ctx.quadraticCurveTo((f.x + JR.x) / 2, Math.min(f.y, JR.y) - 260, JR.x, JR.y - 230);
          ctx.stroke();
          ctx.restore();
        }
      }
      if (!end && !(this.move && this.state === "intro")) {
        BB.panel(40, 24, 400, 110, 28);
        BB.text("TRUCK LOAD  " + fill + " of " + TOTAL, 64, 52, 28, COL.yellow, { align: "left", stroke: 4 });
        for (let i = 0; i < TOTAL; i++)
          BB.rrect(64 + i * 44, 78, 36, 36, 8, i < fill ? BB.lg(78, 114, ["#e2b272", "#b07a40"]) : "#2d4744", "#fff", 3);
        if (this.phT && t - this.phT < 2.4)
          BB.text(this.ph === 1 ? "PHASE 2: FASTER!" : "PHASE 3: WILD STATIC!", W / 2, 200, 64, "#ff8adf", { font: "Rammetto One", stroke: 8 });
      }
      if (!end && !this.move) {
        BB.pauseBtn(() => this.pause());
        BB.micMeter(40, H - 150);
      }
      if (this.cb) {
        BB.overrideBtn(() => this.manualOverride(), { pop: this.ovPop && t - this.ovPop < 0.3 ? 1.08 : 1 });
        if (BB.fuzz) {
          ctx.save();
          ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 4);
        }
        this.cb.draw(W / 2, H - 95);
        if (BB.fuzz)
          ctx.restore();
      }
      if (BB.fuzz) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        for (let i = 0; i < 70; i++) {
          ctx.fillStyle = Math.random() < 0.5 ? "#fff" : "#7ef0ff";
          ctx.fillRect(Math.random() * W, Math.random() * H, 40 + Math.random() * 260, 2 + Math.random() * 5);
        }
        ctx.restore();
      }
      if (this.state === "intro" && !this.move && k < 2.6)
        BB.titleCard("ROOM 5: DELIVERY SHOWDOWN", "Clap the boxes. Beat Static Jr.!", k / 2.6);
      if (this.state === "intro" && this.move) {
        if (k < 14)
          this.drawReward(k, t);
        else
          this.drawStandoff(k - 14, t);
      }
      if (end)
        this.drawTease(k, t);
      if (end && k > KO_CEL + 2) {
        BB.button(W / 2 - 520, 860, 480, 130, "ROOM MAP", { style: "green", size: 56, id: "tomap", onClick: () => BB.roomDone("finale") });
        BB.button(W / 2 + 40, 860, 480, 130, "PLAY AGAIN", { size: 50, id: "again", onClick: () => BB.go(new DeliveryRoom()) });
      }
      this.drawSceneFront(k, t);
      this.drawFx2();
      this.drawRim();
      ctx.restore();
      this.drawSplit(k);
      this.drawCloseup(k);
      this.drawVoice(k, t);
      this.drawClapWin(k, t);
      this.drawMeter(k, t);
      this.drawFreeze(k, t);
      this.drawPowerHud(k, t);
      this.drawLetterbox(CAM.lb);
      for (const f of this.qq)
        f();
      this.drawReplay(k, t);
      if (BB.paused)
        BB.pauseOverlay(howTo, () => this.resume());
    }
  }
  BB.DeliveryRoom = DeliveryRoom;
})();
