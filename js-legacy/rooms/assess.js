"use strict";
(() => {
  let ctx = BB.ctx;
  BB._sw.push((g) => ctx = g);
  const COL = BB.COL, W = BB.W, H = BB.H, { clamp, lerp, ease } = BB, R = BB.R;
  BB.VO_LINES = (BB.VO_LINES || []).concat([
    ["as_intro", "Checkpoint! Ten quick checks from every room. Get seven right and you can fight Static Jr.!", "sprocket"],
    ["as_pass", "You passed! Rhythm Engineers... open the Delivery bay!", "sprocket"],
    ["as_fail", "Almost! Let's try those again. Tap RETRY when you're ready.", "sprocket"],
    ["as_next", "Next one!", "sprocket"]
  ]);
  const PASS = 7, TOTAL = 10;
  const QS = [
    { id: "mn_steady", room: "mine", kind: "clap", prompt: "NOTE MINE: Clap 4 steady beats with the lights.", seq: ["q", "q", "q", "q"], bpm: 92, need: 0.6 },
    { id: "mn_dyn", room: "mine", kind: "choice", prompt: "NOTE MINE: Which means SOFT (piano)?", choices: [{ k: "piano", lab: "PIANO", sub: "soft / quiet" }, { k: "forte", lab: "FORTE", sub: "loud / strong" }], ans: "piano" },
    { id: "sm_tt", room: "smasher", kind: "clap", prompt: "NOTE SMASHER: Listen, then clap back: ta  ta  ti-ti", seq: ["q", "q", "e"], bpm: 84, need: 0.55 },
    { id: "sm_wrong", room: "smasher", kind: "pickNote", prompt: "NOTE SMASHER: Tap the WRONG note on this ticket.", seq: ["q", "e", "q", "r"], wrong: 1, fix: ["q", "q", "q", "r"] },
    { id: "pk_empty", room: "packing", kind: "pickBeat", prompt: "PACKING: Which beat on the pallet is EMPTY?", cells: ["q", "e", "q", null, "h", "q", "e", "q"], ans: 3 },
    { id: "pk_swap", room: "packing", kind: "choice", prompt: "PACKING: Static Jr. swapped a crate! Which one does NOT belong?", choices: [{ k: "q", lab: "TA", sub: "1 beat" }, { k: "x", lab: "???", sub: "glitch crate!" }, { k: "e", lab: "TI-TI", sub: "2 quick" }], ans: "x" },
    { id: "lb_match", room: "label", kind: "hearPick", prompt: "LABEL ROOM: Which label matches the rhythm you hear?", seq: ["q", "e", "q", "r"], choices: [{ k: "a", lab: ["q", "e", "q", "r"] }, { k: "b", lab: ["q", "q", "e", "r"] }, { k: "c", lab: ["e", "e", "q", "q"] }], ans: "a" },
    { id: "lb_say", room: "label", kind: "choice", prompt: "LABEL ROOM: What do you SAY for this note?", show: "e", choices: [{ k: "ta", lab: "ta" }, { k: "titi", lab: "ti-ti" }, { k: "rest", lab: "(rest)" }], ans: "titi" },
    { id: "dl_pkg", room: "delivery", kind: "clap", prompt: "DELIVERY: Clap the rhythm on the package.", seq: ["q", "r", "e", "q"], bpm: 90, need: 0.55 },
    { id: "dl_mix", room: "delivery", kind: "clap", prompt: "DELIVERY: Listen, then clap it back.", seq: ["q", "e", "r", "q"], bpm: 88, need: 0.55 }
  ];
  {
    const KEY = "bb_assess2", SKEY = "bb_assess_sess", CAP = 2e3, T0 = 17e9;
    const ld = (k, d) => {
      try {
        return JSON.parse(localStorage.getItem(k) || "null") || d;
      } catch (e) {
        return d;
      }
    };
    let ev = ld(KEY, []), sess = ld(SKEY, []);
    const pad = (n) => String(n).padStart(2, "0"), dstr = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    const qcsv = (v) => {
      v = String(v == null ? "" : v);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    const dl = (txt, name) => {
      const b = new Blob([txt], { type: "text/csv" }), a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 500);
    };
    let dirty = 0;
    const save = () => {
      if (!dirty)
        return;
      try {
        localStorage.setItem(SKEY, JSON.stringify(sess));
        localStorage.setItem(KEY, JSON.stringify(ev));
        dirty = 0;
      } catch (e) {
        if (ev.length > 8) {
          ev.splice(0, ev.length >> 3);
          try {
            localStorage.setItem(KEY, JSON.stringify(ev));
            dirty = 0;
          } catch (e2) {
          }
        }
      }
    };
    setInterval(() => {
      try {
        save();
      } catch (e) {
      }
    }, 3e3);
    const tag = () => ({ day: BB.session && BB.session.day || "", cls: BB.session && BB.session.cls || "", grade: BB.grade || BB.session && BB.session.cls || "" });
    const curRun = () => {
      const t = tag(), td = dstr(/* @__PURE__ */ new Date()), l = sess[sess.length - 1];
      if (l && l.open && l.date === td && l.day === t.day && l.grade === t.grade)
        return sess.length - 1;
      const d = /* @__PURE__ */ new Date();
      sess.push({ id: td.replace(/-/g, "") + "-" + pad(d.getHours()) + pad(d.getMinutes()) + "-G" + (t.grade || "?"), date: td, day: t.day, cls: t.cls, grade: t.grade, open: 1, correct: 0, total: 0, passed: 0, ver: BB.VERSION || "" });
      dirty = 1;
      return sess.length - 1;
    };
    BB.assessLog = {
      startRun() {
        const i = curRun();
        sess[i].open = 1;
        sess[i].correct = 0;
        sess[i].total = 0;
        sess[i].passed = 0;
        dirty = 1;
        return sess[i];
      },
      add(o) {
        var _a;
        try {
          const i = curRun(), S = sess[i], ms = (v) => v == null || v === "" || isNaN(v) ? "" : Math.round(+v * 1e3);
          ev.push([Math.round(Date.now() / 100) - T0, i, o.qid || "", o.room || "", o.ok ? 1 : 0, o.choice || "", ms(o.ms), BB.VERSION || "", (_a = o.i) != null ? _a : ""]);
          if (ev.length > CAP)
            ev.splice(0, ev.length - CAP);
          S.total++;
          if (o.ok)
            S.correct++;
          dirty = 1;
        } catch (e) {
        }
      },
      finish(passed) {
        const i = curRun();
        sess[i].open = 0;
        sess[i].passed = passed ? 1 : 0;
        sess[i].ver = BB.VERSION || "";
        dirty = 1;
        save();
      },
      csv() {
        save();
        return "session_id,date,day,class,grade,timestamp,q_id,room,correct,choice,offset_ms,app_version,beat_index\n" + ev.map((r) => {
          const S = sess[r[1]] || {};
          return [S.id || "", S.date || "", S.day || "", S.cls || "", S.grade || "", r[0] ? new Date((r[0] + T0) * 100).toISOString() : "", r[2], r[3], r[4], r[5], r[6], r[7], r[8]].map(qcsv).join(",");
        }).join("\n");
      },
      summaryCsv() {
        save();
        return "session_id,date,day,class,grade,correct,total,passed,app_version\n" + sess.map((S) => [S.id || "", S.date || "", S.day || "", S.cls || "", S.grade || "", S.correct || 0, S.total || 0, S.passed ? 1 : 0, S.ver || ""].map(qcsv).join(",")).join("\n");
      },
      download() {
        dl(BB.assessLog.csv(), "beatbots_assess_" + dstr(/* @__PURE__ */ new Date()) + ".csv");
      },
      downloadSummary() {
        dl(BB.assessLog.summaryCsv(), "beatbots_assess_summary_" + dstr(/* @__PURE__ */ new Date()) + ".csv");
      },
      count: () => ev.length
    };
  }
  class AssessRoom {
    constructor(o = {}) {
      this.o = o;
    }
    enter() {
      this.qi = 0;
      this.score = 0;
      this.state = "intro";
      this.st = BB.t;
      this.cb = null;
      this.flash = null;
      this.picked = null;
      this.run = BB.assessLog.startRun();
      BB.groove && BB.groove.start(96, "pack");
      BB.mic && BB.mic.take && BB.mic.take();
      this.voEnd = BB.t + (BB.say("as_intro") || 2.5) + 0.3;
      window.__as = this;
      if (this.o.auto || BB.debug)
        setTimeout(() => BB.scene === this && this.state === "intro" && this.beginQ(), 900);
    }
    exit() {
      this.cb = null;
    }
    beginQ() {
      this.cb = null;
      this.picked = null;
      this.flash = null;
      this.hearPlayed = 0;
      this.state = "q";
      this.st = BB.t;
      this.Q = QS[this.qi];
      if (this.Q.kind === "clap")
        this.startClap();
      if (this.Q.kind === "hearPick") {
        this.state = "hear";
        this.st = BB.t;
        this.playHear();
      }
    }
    playHear() {
      const seq = this.Q.seq, spb = 60 / (this.Q.bpm || 88), t0 = BB.ac.currentTime + 0.35;
      seq.forEach((k, i) => {
        let b = 0;
        for (let j = 0; j < i; j++)
          b += R.BEATS[seq[j]];
        const t = t0 + b * spb;
        (R.SUB[k] || [0]).forEach((f) => BB.sfx.block(t + f * spb));
      });
      this.hearEnd = BB.t + seq.reduce((a, k) => a + R.BEATS[k], 0) * spb + 0.6;
    }
    startClap() {
      const Q = this.Q;
      this.cb = new R.ClapBack(Q.seq, { bpm: Q.bpm || 88, onDone: (sc) => this.clapDone(sc) });
      this.state = "clap";
    }
    clapDone(sc) {
      const need = this.Q.need || 0.6, ok = sc >= need;
      this.cb = null;
      this.grade(ok, "clap:" + (sc * 100 | 0) + "%");
    }
    grade(ok, choice) {
      if (this.state === "graded" || this.state === "end")
        return;
      this.state = "graded";
      this.st = BB.t;
      this.lastOk = ok;
      if (ok)
        this.score++;
      BB.assessLog.add({ qid: this.Q.id, room: this.Q.room, ok, choice: choice || "", ms: this._off });
      BB.sfx[ok ? "ding" : "wobble"]();
      BB.burst(W / 2, 420, ok ? 28 : 10, { cols: ok ? ["#6ee678", "#ffe066", "#fff"] : ["#c8b49a"], kind: ok ? "star" : "dust", size: ok ? 14 : 12, speed: ok ? 700 : 200 });
      setTimeout(() => {
        if (BB.scene !== this)
          return;
        this.qi++;
        if (this.qi >= TOTAL)
          this.finish();
        else {
          if (BB.say)
            BB.say("as_next", { overlap: true, nocap: true });
          this.beginQ();
        }
      }, ok ? 900 : 1100);
    }
    finish() {
      const passed = this.score >= PASS;
      this.state = "end";
      this.st = BB.t;
      this.passed = passed;
      BB.assessLog.finish(passed);
      BB.assessUnlocked = !!passed;
      try {
        if (passed)
          localStorage.setItem("bb_assess_ok", "1");
      } catch (e) {
      }
      BB.say(passed ? "as_pass" : "as_fail");
      BB.sfx[passed ? "fanfare" : "wobble"]();
    }
    goBoss() {
      BB.assessUnlocked = 1;
      BB.go(new BB.DeliveryRoom(this.o || {}));
    }
    retry() {
      this.qi = 0;
      this.score = 0;
      this.run = BB.assessLog.startRun();
      this.beginQ();
    }
    pick(choice) {
      if (this.state !== "q" && this.state !== "hear")
        return;
      const Q = this.Q;
      let ok = false;
      if (Q.kind === "choice" || Q.kind === "hearPick")
        ok = choice === Q.ans;
      else if (Q.kind === "pickNote")
        ok = +choice === Q.wrong;
      else if (Q.kind === "pickBeat")
        ok = +choice === Q.ans;
      this.picked = choice;
      this.grade(ok, String(choice));
    }
    override() {
      if (this.cb) {
        this.cb.override();
        return;
      }
      if (this.state === "q" || this.state === "hear" || this.state === "clap")
        this.grade(true, "manual-override");
    }
    update(dt) {
      if (BB.keys.includes(" "))
        this.override();
      if (this.state === "intro" && BB.t > this.voEnd)
        this.beginQ();
      if (this.state === "hear" && BB.t > (this.hearEnd || 0)) {
        this.state = "q";
        this.st = BB.t;
      }
      if (this.cb)
        this.cb.update(dt);
      if (BB.debug && (this.state === "q" || this.state === "clap" || this.state === "hear") && BB.t - this.st > 1.2 && !this._auto) {
        this._auto = 1;
        setTimeout(() => {
          this._auto = 0;
          if (BB.scene === this)
            this.override();
        }, 400);
      }
    }
    drawBanner() {
      BB.panel(80, 40, 1760, 110, 28);
      BB.text("CHECKPOINT  " + Math.min(this.qi + 1, TOTAL) + " / " + TOTAL, W / 2, 78, 36, COL.yellow, { font: "Rammetto One", stroke: 5 });
      BB.text("Score  " + this.score + "  \xB7  need " + PASS + " to unlock Static Jr.", W / 2, 118, 28, "#cfe8e2", { stroke: 4 });
    }
    drawProgress() {
      for (let i = 0; i < TOTAL; i++) {
        const x = 220 + i * 148, y = 155, done = i < this.qi, cur = i === this.qi && this.state !== "end" && this.state !== "intro";
        BB.rrect(x, y, 120, 18, 9, done ? "#6ee678" : cur ? "#ffe066" : "#2a3a38", "#fff", 2);
      }
    }
    drawPrompt(txt) {
      BB.text(txt, W / 2, 230, 40, "#fff", { font: "Rammetto One", stroke: 7, maxW: 1700 });
    }
    drawClap() {
      if (this.cb)
        this.cb.draw(W / 2, 520);
      BB.text("No mic? Teacher taps MANUAL OVERRIDE when the class nails it.", W / 2, 780, 26, COL.yellow, { stroke: 4 });
      BB.button(W / 2 - 220, 820, 440, 100, "MANUAL OVERRIDE", { style: "cream", size: 34, id: "asov", onClick: () => this.override() });
    }
    drawChoice() {
      const Q = this.Q, n = Q.choices.length, bw = Math.min(420, Math.floor(1500 / n) - 24), gap = 24, tot = n * bw + (n - 1) * gap, x0 = W / 2 - tot / 2;
      if (Q.show) {
        R.tile(Q.show, W / 2 - 70, 300, 140, 160, { gs: 1.1 });
        BB.text(R.SAY[Q.show] || "", W / 2, 500, 36, COL.yellow, { stroke: 5 });
      }
      Q.choices.forEach((c, i) => {
        const x = x0 + i * (bw + gap), on = this.picked === c.k;
        BB.button(x, 560, bw, 160, "", { style: on ? "green" : "cream", id: "asc" + i, onClick: () => this.pick(c.k) });
        BB.text(c.lab, x + bw / 2, 620, c.lab.length > 6 ? 36 : 52, "#19191f", { font: "Rammetto One", maxW: bw - 20 });
        if (c.sub)
          BB.text(c.sub, x + bw / 2, 680, 26, "#3a4038", { maxW: bw - 24 });
        if (c.lab && Array.isArray(c.lab)) {
        }
      });
    }
    drawHearPick() {
      const Q = this.Q;
      if (this.state === "hear") {
        BB.text("Listen...", W / 2, 360, 64, COL.yellow, { font: "Rammetto One", stroke: 8 });
        R.pills(W / 2, 520, Q.seq, { words: true });
        return;
      }
      const n = Q.choices.length, bw = 480, gap = 30, tot = n * bw + (n - 1) * gap, x0 = W / 2 - tot / 2;
      BB.text("Tap the matching label", W / 2, 300, 34, COL.yellow, { stroke: 4 });
      Q.choices.forEach((c, i) => {
        const x = x0 + i * (bw + gap);
        BB.button(x, 360, bw, 280, "", { style: "cream", id: "ash" + i, onClick: () => this.pick(c.k) });
        R.pills(x + bw / 2, 520, c.lab, { bw: 70, gap: 10, words: true });
      });
    }
    drawPickNote() {
      const Q = this.Q, seq = Q.fix, n = seq.length, bw = 200, gap = 28, tot = n * bw + (n - 1) * gap, x0 = W / 2 - tot / 2;
      BB.text("Ticket (one note is wrong)", W / 2, 320, 32, COL.yellow, { stroke: 4 });
      seq.forEach((k, i) => {
        const x = x0 + i * (bw + gap);
        BB.button(x, 400, bw, 220, "", { style: "cream", id: "asn" + i, onClick: () => this.pick(i) });
        R.tile(k, x + 30, 440, bw - 60, 120);
        BB.text(R.SAY[k] || "", x + bw / 2, 580, 28, "#19191f");
      });
    }
    drawPickBeat() {
      const Q = this.Q, cells = Q.cells, n = cells.length, bw = 150, gap = 12, tot = n * bw + (n - 1) * gap, x0 = W / 2 - tot / 2;
      BB.text("8-beat pallet \u2014 tap the empty beat", W / 2, 320, 32, COL.yellow, { stroke: 4 });
      cells.forEach((k, i) => {
        const x = x0 + i * (bw + gap);
        BB.button(x, 400, bw, 200, "", { style: k ? "cream" : "green", id: "asb" + i, onClick: () => this.pick(i) });
        BB.text(String(i + 1), x + bw / 2, 430, 24, "#5a6058");
        if (k)
          R.tile(k, x + 20, 460, bw - 40, 100);
        else
          BB.text("EMPTY", x + bw / 2, 540, 28, COL.yellow, { stroke: 4 });
      });
    }
    draw() {
      ctx.fillStyle = "#0d1d1b";
      ctx.fillRect(0, 0, W, H);
      if (BB.V2 && BB.V2.hub_bg) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(BB.V2.hub_bg, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      BB.contactShadow(220, 980, 110, 0.45);
      BB.sprite && BB.sprite("sprocket", 220, 980, 360, { squash: BB.isTalking && BB.isTalking("sprocket") ? Math.sin(BB.t * 16) * 0.015 : 0 });
      if (this.state === "intro") {
        BB.panel(260, 220, 1400, 520, 40);
        BB.text("CHECKPOINT", W / 2, 320, 72, "#fff", { font: "Rammetto One", stroke: 10 });
        BB.text("10 quick checks from every room. Get " + PASS + " right to unlock the boss.", W / 2, 420, 36, COL.yellow, { stroke: 5, maxW: 1200 });
        BB.button(W / 2 - 260, 560, 520, 120, "START CHECK", { style: "green", size: 48, id: "asstart", onClick: () => this.beginQ() });
        return;
      }
      this.drawBanner();
      this.drawProgress();
      if (this.state === "end") {
        BB.panel(260, 240, 1400, 620, 40);
        BB.text(this.passed ? "YOU PASSED!" : "TRY AGAIN", W / 2, 340, 72, this.passed ? COL.green : COL.yellow, { font: "Rammetto One", stroke: 10 });
        BB.text("Class score: " + this.score + " / " + TOTAL, W / 2, 440, 48, "#fff", { stroke: 6 });
        BB.text(this.passed ? "Delivery bay unlocked. Ready for Static Jr.!" : "Need " + PASS + " correct. Tap RETRY for another run.", W / 2, 520, 32, COL.yellow, { stroke: 4, maxW: 1200 });
        if (this.passed)
          BB.button(W / 2 - 280, 620, 560, 120, "FIGHT STATIC JR.!", { style: "green", size: 44, id: "asboss", onClick: () => this.goBoss() });
        else
          BB.button(W / 2 - 280, 620, 560, 120, "RETRY CHECKPOINT", { style: "green", size: 44, id: "asretry", onClick: () => this.retry() });
        BB.button(200, 780, 360, 80, "Download assess CSV", { size: 26, id: "asdl", onClick: () => BB.assessLog.download() });
        BB.button(580, 780, 360, 80, "Download summary", { size: 26, id: "asdls", onClick: () => BB.assessLog.downloadSummary() });
        BB.button(960, 780, 360, 80, "ROOM MAP", { size: 26, id: "asmap", onClick: () => BB.go(new BB.MapScene()) });
        return;
      }
      if (this.state === "graded") {
        BB.text(this.lastOk ? "GOT IT!" : "Not yet \u2014 that's ok!", W / 2, 480, 72, this.lastOk ? COL.green : COL.yellow, { font: "Rammetto One", stroke: 10 });
        BB.captionBox();
        return;
      }
      this.drawPrompt(this.Q.prompt);
      if (this.Q.kind === "clap" || this.state === "clap")
        this.drawClap();
      else if (this.Q.kind === "choice")
        this.drawChoice();
      else if (this.Q.kind === "hearPick")
        this.drawHearPick();
      else if (this.Q.kind === "pickNote")
        this.drawPickNote();
      else if (this.Q.kind === "pickBeat")
        this.drawPickBeat();
      BB.button(W - 300, 24, 260, 70, "SKIP Q", { size: 28, id: "asskip", onClick: () => this.grade(false, "skip") });
      BB.captionBox();
    }
  }
  BB.AssessRoom = AssessRoom;
  BB.openDelivery = (o = {}) => {
    try {
      const q = new URLSearchParams(location.search).get("assess");
      if (q === "0" || BB.assessUnlocked)
        return new BB.DeliveryRoom(o);
    } catch (e) {
    }
    return new AssessRoom(o);
  };
})();
