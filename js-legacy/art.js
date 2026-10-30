"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
(() => {
  let ctx = BB.ctx;
  BB._sw.push((g) => ctx = g);
  const COL = BB.COL, IMG = BB.IMG, W = BB.W, H = BB.H;
  const P = (w, h, u, v) => [-w / 2 + u * w, -h + v * h];
  const LQ = () => BB.q === 0;
  const INK = () => COL.ink;
  const gear = (r, teeth, a) => {
    ctx.save();
    ctx.rotate(a);
    const lw = Math.max(2.5, r * 0.07);
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK();
    const ro = r, ri = r * 0.8, st = Math.PI * 2 / teeth;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const c = i * st;
      ctx.lineTo(Math.cos(c - st * 0.32) * ri, Math.sin(c - st * 0.32) * ri);
      ctx.lineTo(Math.cos(c - st * 0.18) * ro, Math.sin(c - st * 0.18) * ro);
      ctx.lineTo(Math.cos(c + st * 0.18) * ro, Math.sin(c + st * 0.18) * ro);
      ctx.lineTo(Math.cos(c + st * 0.32) * ri, Math.sin(c + st * 0.32) * ri);
    }
    ctx.closePath();
    ctx.restore();
    ctx.save();
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
    g.addColorStop(0, "#f2d48e");
    g.addColorStop(0.6, "#c9973f");
    g.addColorStop(1, "#8a5c22");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = INK();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.rotate(a);
    ctx.lineWidth = lw;
    ctx.strokeStyle = INK();
    ctx.fillStyle = "#5f8f86";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d4a656";
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 2);
      ctx.beginPath();
      ctx.rect(-r * 0.08, r * 0.18, r * 0.16, r * 0.42);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    ctx.save();
    const hg = ctx.createRadialGradient(-r * 0.07, -r * 0.07, 0, 0, 0, r * 0.24);
    hg.addColorStop(0, "#fff4d0");
    hg.addColorStop(1, "#b8863a");
    ctx.fillStyle = hg;
    ctx.lineWidth = lw;
    ctx.strokeStyle = INK();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#4a3010";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.07, 0, 7);
    ctx.fill();
    ctx.restore();
  };
  const twinkle = (x, y, s, ph) => {
    const k = 0.5 + 0.5 * Math.sin(BB.t * 3 + ph);
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.35 * k;
    BB.glow(x, y, s * 2.2, "rgba(255,230,140,A)", 0.8);
    ctx.restore();
  };
  const PARTS = BB.PARTS = {
    turtle: {
      // Andante: wind-up key turns, shell gear spins (slow and steady)
      clip: (w, h) => {
        ctx.beginPath();
        ctx.rect(-w / 2, -h, w, h);
        const [a, b] = P(w, h, 0.15, 0), [c, d] = P(w, h, 0.66, 0.295);
        ctx.rect(c, b, a - c, d - b);
        ctx.clip("evenodd");
      },
      post: (w, h, im) => {
        const t = BB.t, sp = LQ() ? 0.5 : 1;
        const ang = t * 1.6 * sp, sx = Math.cos(ang), ax = -w / 2 + 0.41 * w;
        ctx.save();
        ctx.translate(ax, 0);
        ctx.scale(Math.max(0.12, Math.abs(sx)), 1);
        const su = 0.15, sv = 0, eu = 0.66, ev = 0.295;
        ctx.drawImage(im, su * im.width, 0, (eu - su) * im.width, ev * im.height, (su - 0.41) * w, -h, (eu - su) * w, ev * h);
        if (sx < 0) {
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = "#3a2a10";
          ctx.fillRect((su - 0.41) * w, -h, (eu - su) * w, ev * h * 0.48);
        }
        ctx.restore();
        const [gx, gy] = P(w, h, 0.272, 0.53);
        ctx.save();
        ctx.translate(gx, gy);
        gear(w * 0.128, 12, t * 0.9 * sp);
        ctx.restore();
      }
    },
    rocket: {
      // Allegro: rocket blast + billowing smoke under the nozzle
      pre: (w, h, im, o) => {
        var _a;
        const t = BB.t, [nx, ny] = P(w, h, 0.5, 0.9), lq = LQ(), f = (_a = o.thrust) != null ? _a : 1;
        const n = lq ? 4 : 10;
        for (let i = 0; i < n; i++) {
          const life = (t * 1.1 + i / n) % 1, sd = i * 137.5 % 1, side = i % 2 ? 1 : -1;
          const x = nx + side * life * w * (0.35 + 0.4 * (i * 7 % 5) / 5), y = ny + h * 0.12 + life * h * 0.18 * f, r = w * (0.08 + life * 0.22);
          ctx.globalAlpha = (1 - life) * 0.55;
          ctx.fillStyle = life < 0.25 ? "#fff4d8" : "#e9e4da";
          ctx.strokeStyle = "rgba(25,25,31,.35)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 7);
          ctx.fill();
          if (!lq) ctx.stroke();
        }
        ctx.globalAlpha = 1;
        const fl = 1 + 0.12 * Math.sin(t * 31) + 0.08 * Math.sin(t * 17), L = h * 0.24 * f * fl;
        BB.glow(nx, ny + L * 0.4, w * 0.55, "rgba(255,170,60,A)", 0.5);
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK();
        ctx.fillStyle = "#ff8a2a";
        ctx.beginPath();
        ctx.moveTo(nx - w * 0.13, ny);
        ctx.quadraticCurveTo(nx - w * 0.1, ny + L * 0.6, nx, ny + L);
        ctx.quadraticCurveTo(nx + w * 0.1, ny + L * 0.6, nx + w * 0.13, ny);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffe066";
        ctx.beginPath();
        ctx.moveTo(nx - w * 0.07, ny);
        ctx.quadraticCurveTo(nx - w * 0.05, ny + L * 0.4, nx, ny + L * 0.62);
        ctx.quadraticCurveTo(nx + w * 0.05, ny + L * 0.4, nx + w * 0.07, ny);
        ctx.closePath();
        ctx.fill();
      },
      post: (w, h) => {
        const [x, y] = P(w, h, 0.5, 0.04);
        twinkle(x, y, w * 0.12, 0);
      }
    },
    sprocket: {
      // Sprocket: antenna with spinning ring + blinking bulb, turning dials, blinking belly light
      pre: (w, h) => {
        const t = BB.t, [x, y] = P(w, h, 0.55, 0.15), L = h * 0.11, lq = LQ(), lw = Math.max(3, h * 9e-3);
        const rx = h * 0.05, ry = h * 0.016, ry0 = y - L * 0.5, sp = t * (lq ? 1.5 : 3);
        const ringHalf = (front) => {
          ctx.lineWidth = lw + 3;
          ctx.strokeStyle = INK();
          ctx.beginPath();
          ctx.ellipse(x, ry0, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = lw;
          ctx.strokeStyle = front ? "#eef3f1" : "#9aa6a4";
          ctx.stroke();
          for (let i = 0; i < 6; i++) {
            const a = sp + i * Math.PI / 3, sn = Math.sin(a);
            if (front !== sn > 0) continue;
            ctx.fillStyle = front ? "#ffd75a" : "#a8892e";
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * rx, ry0 + sn * ry, lw * 0.7, 0, 7);
            ctx.fill();
          }
        };
        ringHalf(false);
        ctx.strokeStyle = INK();
        ctx.lineWidth = lw;
        ctx.fillStyle = BB.lg(0, 1, ["#eef3f1", "#9aa6a4"]);
        const mg = ctx.createLinearGradient(x - h * 8e-3, 0, x + h * 8e-3, 0);
        mg.addColorStop(0, "#7d8987");
        mg.addColorStop(0.4, "#f4f8f7");
        mg.addColorStop(1, "#6b7775");
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.roundRect(x - h * 8e-3, y - L, h * 0.016, L, 3);
        ctx.fill();
        ctx.stroke();
        ringHalf(true);
        const bl = 0.5 + 0.5 * Math.sin(t * 2.4), br = h * 0.02, by = y - L - br * 0.7;
        BB.glow(x, by, h * 0.05, "rgba(255,90,70,A)", 0.25 + 0.45 * bl);
        const bg = ctx.createRadialGradient(x - br * 0.35, by - br * 0.35, br * 0.1, x, by, br);
        bg.addColorStop(0, "#ffe0d8");
        bg.addColorStop(0.35, "rgb(".concat(220 + 35 * bl | 0, ",").concat(80 + 40 * bl | 0, ",64)"));
        bg.addColorStop(1, "#8a2018");
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(x, by, br, 0, 7);
        ctx.fill();
        ctx.stroke();
      },
      post: (w, h) => {
        const t = BB.t;
        for (const [u, v, s] of [[0.52, 0.555, 1], [0.51, 0.62, -1]]) {
          const [x, y] = P(w, h, u, v);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.sin(t * 1.3 * s) * 1.2);
          ctx.strokeStyle = INK();
          ctx.lineWidth = Math.max(2, h * 6e-3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -w * 0.022);
          ctx.stroke();
          ctx.restore();
        }
        const [rx, ry] = P(w, h, 0.445, 0.645);
        ctx.save();
        ctx.globalAlpha = 0.6 * (Math.sin(t * 4.2) > 0.3 ? 1 : 0);
        BB.glow(rx, ry, w * 0.03, "rgba(255,80,60,A)", 0.9);
        ctx.restore();
      }
    },
    sorter: {
      // Sorter Bot: LED sorting bar chases, mast light blinks, star twinkles
      post: (w, h) => {
        const t = BB.t, n = 8, cols = ["255,90,80", "255,160,70", "255,220,90", "150,230,110", "110,220,150", "90,200,255", "90,170,255", "120,150,255"];
        const hd = t * (LQ() ? 3 : 6) % (n + 3);
        for (let i = 0; i < n; i++) {
          const d = Math.abs(i - hd);
          if (d > 1.5) continue;
          const [x, y] = P(w, h, 0.35 + i * 0.0443, 0.543);
          ctx.save();
          ctx.globalAlpha = (1 - d / 1.5) * 0.9;
          BB.glow(x, y, w * 0.06, "rgba(".concat(cols[i], ",A)"), 0.9);
          ctx.restore();
        }
        const [sx, sy] = P(w, h, 0.8, 0.035);
        twinkle(sx, sy, w * 0.08, 1);
        const [mx, my] = P(w, h, 0.815, 0.32);
        ctx.save();
        ctx.globalAlpha = Math.sin(t * 2.6) > 0 ? 0.8 : 0.15;
        BB.glow(mx, my, w * 0.04, "rgba(255,90,70,A)", 0.9);
        ctx.restore();
      }
    },
    whisper: {
      // Piano bot: grille lights breathe softly
      post: (w, h) => {
        const t = BB.t, k = 0.5 + 0.5 * Math.sin(t * 1.4), [x, y] = P(w, h, 0.5, 0.24);
        ctx.save();
        ctx.globalAlpha = 0.25 + 0.35 * k;
        BB.glow(x, y, w * 0.55, "rgba(120,200,255,A)", 0.6);
        ctx.restore();
        if (!LQ()) {
          const [mx, my] = P(w, h, 0.38, 0.43);
          for (let i = 0; i < 3; i++) {
            const life = (t * 0.5 + i / 3) % 1;
            ctx.save();
            ctx.globalAlpha = (1 - life) * 0.5;
            ctx.strokeStyle = "#cfe8ff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(mx - w * 0.1, my, w * (0.08 + life * 0.25), Math.PI * 0.75, Math.PI * 1.25);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    },
    boom: {
      // Forte bot: megaphone pulses sound rings, bulb flares
      post: (w, h) => {
        const t = BB.t, [x, y] = P(w, h, 0.12, 0.24), n = LQ() ? 2 : 3;
        for (let i = 0; i < n; i++) {
          const life = (t * 1.2 + i / n) % 1;
          ctx.save();
          ctx.globalAlpha = (1 - life) * 0.7;
          ctx.strokeStyle = "#ffb347";
          ctx.lineWidth = Math.max(3, w * 0.02) * (1 - life * 0.5);
          ctx.beginPath();
          ctx.arc(x + w * 0.1, y, w * (0.12 + life * 0.35), Math.PI * 0.72, Math.PI * 1.28);
          ctx.stroke();
          ctx.restore();
        }
        const [bx, by] = P(w, h, 0.29, 0.26), k = Math.pow(0.5 + 0.5 * Math.sin(t * 5), 2);
        ctx.save();
        ctx.globalAlpha = 0.3 + 0.6 * k;
        BB.glow(bx, by, w * 0.16, "rgba(255,240,170,A)", 0.9);
        ctx.restore();
        const [sx, sy] = P(w, h, 0.6, 0.035);
        twinkle(sx, sy, w * 0.08, 2);
      }
    }
  };
  BB.sprite = (name, x, base, h, o = {}) => {
    var _a;
    const im = IMG[name];
    if (!im) return;
    const w = im.width * h / im.height;
    const sq = o.squash || 0;
    const pt = o.parts !== false && h >= 150 ? PARTS[name] : null;
    ctx.save();
    ctx.translate(x, base);
    if (o.shadow !== false) {
      ctx.fillStyle = "rgba(0,0,0,.28)";
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.38, 12, 0, 0, 7);
      ctx.fill();
    }
    ctx.rotate(o.rot || 0);
    ctx.scale((o.flip ? -1 : 1) * (1 + sq), 1 - sq);
    ctx.globalAlpha = (_a = o.alpha) != null ? _a : 1;
    if (pt && pt.pre) {
      ctx.save();
      pt.pre(w, h, im, o);
      ctx.restore();
    }
    if (o.cut) {
      ctx.save();
      o.cut(w, h);
    }
    if (pt && pt.clip) {
      ctx.save();
      pt.clip(w, h);
      ctx.drawImage(im, -w / 2, -h, w, h);
      ctx.restore();
    } else ctx.drawImage(im, -w / 2, -h, w, h);
    if (o.cut) ctx.restore();
    if (pt && pt.post) {
      ctx.save();
      pt.post(w, h, im, o);
      ctx.restore();
    }
    ctx.restore();
  };
  BB.rocketBot = (x, ground, h, o = {}) => {
    const t = BB.t, lift = h * 0.32 + Math.sin(t * 2.2) * h * 0.035, sq = o.squash || 0;
    BB.contactShadow(x, ground, h * 0.38 * (1 - lift / h * 0.6), 0.45);
    BB.sprite("rocket", x, ground - lift, h, { squash: sq, rot: o.rot || 0, shadow: false });
  };
  BB.bounce = (ph, amt = 0.06) => {
    const k = Math.exp(-ph * 7);
    return amt * k * Math.cos(ph * 9);
  };
  const chromeX = (x0, x1, a = 1) => {
    const G = ctx.createLinearGradient(x0, 0, x1, 0);
    G.addColorStop(0, "rgba(58,64,70,".concat(a, ")"));
    G.addColorStop(0.18, "rgba(150,160,168,".concat(a, ")"));
    G.addColorStop(0.32, "rgba(250,252,253,".concat(a, ")"));
    G.addColorStop(0.48, "rgba(170,180,188,".concat(a, ")"));
    G.addColorStop(0.7, "rgba(96,104,112,".concat(a, ")"));
    G.addColorStop(0.88, "rgba(196,206,214,".concat(a, ")"));
    G.addColorStop(1, "rgba(70,76,84,".concat(a, ")"));
    return G;
  };
  BB.pickbot = (x, base, h, swing, o = {}) => {
    const sq = o.squash || 0;
    ctx.save();
    ctx.translate(x, base);
    const ang = BB.lerp(-1.9, 0.35, swing), u = h * 0.032, edge = "rgba(20,24,28,.75)", ew = Math.max(1.2, h * 6e-3);
    ctx.save();
    ctx.translate(h * 0.22, -h * 0.62);
    ctx.rotate(ang);
    {
      const y0 = h * 0.05, y1 = -h * 0.4;
      ctx.beginPath();
      ctx.roundRect(-u, y1, u * 2, y0 - y1, u);
      {
        const G = ctx.createLinearGradient(-u, 0, u, 0);
        G.addColorStop(0, "#3a1e0c");
        G.addColorStop(0.22, "#8a5228");
        G.addColorStop(0.4, "#d89a5c");
        G.addColorStop(0.52, "#f3c38a");
        G.addColorStop(0.7, "#a8642e");
        G.addColorStop(1, "#2e1608");
        ctx.fillStyle = G;
      }
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(60,28,8,.35)";
      ctx.lineWidth = Math.max(0.8, h * 25e-4);
      for (let i = 0; i < 5; i++) {
        const gx = -u * 0.7 + i * u * 0.35;
        ctx.beginPath();
        ctx.moveTo(gx, y1);
        ctx.bezierCurveTo(gx + u * 0.25, y1 * 0.6, gx - u * 0.25, y1 * 0.3, gx + u * 0.1, y0);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,240,215,.35)";
      ctx.fillRect(-u * 0.25, y1, u * 0.18, y0 - y1);
      ctx.fillStyle = "rgba(150,230,240,.25)";
      ctx.fillRect(u * 0.72, y1, u * 0.2, y0 - y1);
      {
        const G = ctx.createLinearGradient(0, -h * 0.09, 0, h * 0.05);
        G.addColorStop(0, "rgba(0,0,0,0)");
        G.addColorStop(0.45, "rgba(10,4,0,.55)");
        G.addColorStop(0.7, "rgba(10,4,0,.55)");
        G.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = G;
        ctx.fillRect(-u, -h * 0.09, u * 2, h * 0.14);
      }
      {
        const G = ctx.createLinearGradient(0, y1, 0, y1 + h * 0.08);
        G.addColorStop(0, "rgba(10,4,0,.6)");
        G.addColorStop(1, "rgba(10,4,0,0)");
        ctx.fillStyle = G;
        ctx.fillRect(-u, y1, u * 2, h * 0.08);
      }
      ctx.restore();
      ctx.strokeStyle = edge;
      ctx.lineWidth = ew;
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-u * 1.15, y0 - h * 0.035, u * 2.3, h * 0.035, u * 0.4);
      ctx.fillStyle = chromeX(-u * 1.15, u * 1.15);
      ctx.fill();
      ctx.strokeStyle = edge;
      ctx.stroke();
      const hy = -h * 0.38;
      const pick = (k) => {
        ctx.beginPath();
        ctx.moveTo(-h * 0.23, hy + h * 0.035);
        ctx.quadraticCurveTo(-h * 0.12, hy - h * 0.055 * k, 0, hy - h * 0.075 * k);
        ctx.quadraticCurveTo(h * 0.12, hy - h * 0.055 * k, h * 0.24, hy + h * 0.03);
        ctx.quadraticCurveTo(h * 0.12, hy - h * 5e-3, 0, hy - h * 0.015);
        ctx.quadraticCurveTo(-h * 0.12, hy - h * 5e-3, -h * 0.23, hy + h * 0.035);
        ctx.closePath();
      };
      ctx.save();
      ctx.translate(h * 8e-3, h * 0.012);
      pick(1);
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fill();
      ctx.restore();
      pick(1);
      {
        const G = ctx.createLinearGradient(0, hy - h * 0.08, 0, hy + h * 0.03);
        G.addColorStop(0, "#ffffff");
        G.addColorStop(0.18, "#dfe6ea");
        G.addColorStop(0.38, "#8b959d");
        G.addColorStop(0.55, "#4a5259");
        G.addColorStop(0.75, "#9aa5ad");
        G.addColorStop(1, "#2e3439");
        ctx.fillStyle = G;
      }
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath();
      ctx.ellipse(-h * 0.07, hy - h * 0.045, h * 0.09, h * 8e-3, -0.12, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(h * 0.1, hy - h * 0.04, h * 0.06, h * 6e-3, 0.15, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,190,120,.22)";
      ctx.fillRect(-h * 0.25, hy - h * 0.01, h * 0.5, h * 0.012);
      ctx.restore();
      ctx.save();
      pick(1);
      ctx.clip();
      ctx.lineWidth = h * 0.012;
      ctx.strokeStyle = "rgba(255,255,255,.65)";
      ctx.translate(0, h * 4e-3);
      pick(1);
      ctx.stroke();
      ctx.translate(0, -h * 9e-3);
      ctx.strokeStyle = "rgba(0,0,0,.45)";
      pick(1);
      ctx.stroke();
      ctx.restore();
      pick(1);
      ctx.strokeStyle = edge;
      ctx.lineWidth = ew;
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-u * 1.5, hy - h * 0.085, u * 3, h * 0.1, u * 0.6);
      ctx.fillStyle = chromeX(-u * 1.5, u * 1.5);
      ctx.fill();
      ctx.strokeStyle = edge;
      ctx.stroke();
      {
        const r = Math.max(2, h * 0.013), cx = 0, cy = hy - h * 0.035, G = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 0, cx, cy, r);
        G.addColorStop(0, "#ffffff");
        G.addColorStop(0.5, "#9aa5ad");
        G.addColorStop(1, "#2e3439");
        ctx.fillStyle = G;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 7);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.restore();
    BB.sprite("sorter", x, base, h, { squash: sq });
  };
  const jrC = {};
  function jrCanvas(h) {
    const key = Math.round(h);
    if (jrC[key]) return jrC[key];
    const S = h < 160 ? 3 : 2, H2 = h * S, Wd = H2 * 1.08, P2 = Math.ceil(H2 * 0.03), c = document.createElement("canvas");
    c.width = Math.ceil(Wd + P2 * 2);
    c.height = Math.ceil(H2 + P2 * 2);
    const g = c.getContext("2d");
    g.translate(P2, P2);
    let sd = 11;
    const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647;
    const LG = (x0, y0, x1, y1, a) => {
      const G = g.createLinearGradient(x0, y0, x1, y1);
      a.forEach((v, i) => G.addColorStop(Array.isArray(v) ? v[0] : i / (a.length - 1), Array.isArray(v) ? v[1] : v));
      return G;
    };
    const RG = (x, y, r0, x1, y1, r1, a) => {
      const G = g.createRadialGradient(x, y, r0, x1, y1, r1);
      a.forEach((v, i) => G.addColorStop(i / (a.length - 1), v));
      return G;
    };
    const rp = (x, y, w, hh2, r) => {
      g.beginPath();
      g.roundRect(x, y, w, hh2, r);
    };
    const vol = (path, x, y, w, hh2, cols, o = {}) => {
      g.save();
      path();
      g.fillStyle = LG(0, y, 0, y + hh2, cols);
      g.fill();
      g.clip();
      g.fillStyle = RG(x + w * 0.3, y + hh2 * 0.22, 0, x + w * 0.3, y + hh2 * 0.22, Math.max(w, hh2) * 0.75, ["rgba(255,226,180,.42)", "rgba(255,200,150,.12)", "rgba(255,200,150,0)"]);
      g.fillRect(x, y, w, hh2);
      g.fillStyle = LG(0, y + hh2 * 0.6, 0, y + hh2, ["rgba(40,15,5,0)", "rgba(40,15,5,.45)"]);
      g.fillRect(x, y, w, hh2);
      g.fillStyle = LG(x + w * 0.75, 0, x + w, 0, ["rgba(0,0,0,0)", "rgba(30,10,0,.35)"]);
      g.fillRect(x, y, w, hh2);
      if (o.rust) o.rust(x, y, w, hh2);
      g.globalCompositeOperation = "source-atop";
      g.lineWidth = H2 * 0.014;
      g.strokeStyle = "rgba(255,236,200,.55)";
      g.translate(H2 * 6e-3, H2 * 6e-3);
      path();
      g.stroke();
      g.translate(-H2 * 0.012, -H2 * 0.012);
      g.strokeStyle = "rgba(130,220,230,.35)";
      path();
      g.stroke();
      g.restore();
      g.save();
      path();
      g.lineWidth = Math.max(1.5, H2 * 6e-3);
      g.strokeStyle = "rgba(45,18,6,.85)";
      g.stroke();
      g.restore();
    };
    const rustTex = (x, y, w, hh2, n) => {
      for (let i = 0; i < n; i++) {
        const px = x + rnd() * w, py = y + rnd() * hh2, r = H2 * (6e-3 + rnd() * rnd() * 0.035), a = rnd() * 3;
        g.fillStyle = rnd() < 0.35 ? "rgba(70,55,48,.85)" : "rgba(92,36,12,.6)";
        g.beginPath();
        for (let k = 0; k < 7; k++) {
          const aa = a + k / 7 * 6.28, rr = r * (0.55 + rnd() * 0.6);
          g.lineTo(px + Math.cos(aa) * rr, py + Math.sin(aa) * rr * 0.75);
        }
        g.fill();
        g.strokeStyle = "rgba(255,190,140,.35)";
        g.lineWidth = H2 * 3e-3;
        g.beginPath();
        g.arc(px, py + r * 0.15, r * 0.8, 0.3, 2.6);
        g.stroke();
      }
      for (let i = 0; i < n * 3; i++) {
        g.fillStyle = rnd() < 0.5 ? "rgba(80,30,8,.25)" : "rgba(255,190,130,.18)";
        g.fillRect(x + rnd() * w, y + rnd() * hh2, H2 * 4e-3, H2 * 4e-3);
      }
      for (let i = 0; i < n / 4; i++) {
        const px = x + rnd() * w, py = y + rnd() * hh2;
        g.strokeStyle = "rgba(255,215,170,.3)";
        g.lineWidth = H2 * 25e-4;
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(px + H2 * (0.02 + rnd() * 0.03), py + H2 * (rnd() - 0.5) * 0.01);
        g.stroke();
      }
      for (let i = 0; i < 3; i++) {
        const px = x + w * (0.15 + rnd() * 0.7), py = y + hh2 * (0.2 + rnd() * 0.6), r = H2 * (0.02 + rnd() * 0.02);
        g.fillStyle = RG(px - r * 0.3, py - r * 0.3, 0, px, py, r, ["rgba(40,12,0,.35)", "rgba(40,12,0,0)"]);
        g.fillRect(px - r, py - r, r * 2, r * 2);
        g.strokeStyle = "rgba(255,220,180,.3)";
        g.lineWidth = H2 * 3e-3;
        g.beginPath();
        g.arc(px, py, r * 0.8, 2.2, 4.2);
        g.stroke();
      }
    };
    const rivet = (x, y, r) => {
      g.fillStyle = "rgba(30,10,0,.45)";
      g.beginPath();
      g.arc(x + r * 0.25, y + r * 0.35, r, 0, 7);
      g.fill();
      g.fillStyle = RG(x - r * 0.35, y - r * 0.35, 0, x, y, r, ["#ffd7a8", "#b0612c", "#5a2a10"]);
      g.beginPath();
      g.arc(x, y, r, 0, 7);
      g.fill();
    };
    const metal = (x, y, w, hh2, r) => {
      rp(x, y, w, hh2, r);
      g.fillStyle = LG(x, 0, x + w, 0, ["#3b3f45", "#9aa3ab", [0.35, "#d6dde2"], "#6c737b", "#2c3035"]);
      g.fill();
      g.strokeStyle = "rgba(15,15,20,.7)";
      g.lineWidth = H2 * 5e-3;
      g.stroke();
    };
    const cx = Wd / 2;
    const ty = H2 * 0.6, tw = Wd * 0.56, tx = cx - tw / 2, th = H2 * 0.36;
    for (const s of [-1, 1]) {
      const ax = cx + s * tw * 0.56;
      g.save();
      g.translate(ax, ty + H2 * 0.05);
      g.rotate(s * -0.12);
      vol(() => {
        rp(-H2 * 0.045, 0, H2 * 0.09, H2 * 0.12, H2 * 0.04);
      }, -H2 * 0.045, 0, H2 * 0.09, H2 * 0.12, ["#e48a4e", "#b2551f", "#6e2e0e"], { rust: (x, y, w, hh2) => rustTex(x, y, w, hh2, 6) });
      metal(-H2 * 0.03, H2 * 0.115, H2 * 0.06, H2 * 0.035, H2 * 0.01);
      vol(() => {
        rp(-H2 * 0.042, H2 * 0.145, H2 * 0.084, H2 * 0.1, H2 * 0.035);
      }, -H2 * 0.042, H2 * 0.145, H2 * 0.084, H2 * 0.1, ["#de844a", "#a94e1c", "#64290c"], { rust: (x, y, w, hh2) => rustTex(x, y, w, hh2, 5) });
      for (const f of [-1, 0, 1]) {
        g.save();
        g.translate(f * H2 * 0.022, H2 * 0.245);
        g.rotate(f * 0.35);
        metal(-H2 * 0.011, 0, H2 * 0.022, H2 * 0.05, H2 * 0.01);
        g.restore();
      }
      g.restore();
    }
    const tp = () => rp(tx, ty, tw, th, H2 * 0.07);
    g.save();
    g.fillStyle = "rgba(20,8,0,.35)";
    g.filter = "blur(".concat(H2 * 0.01, "px)");
    rp(tx - H2 * 0.01, ty - H2 * 0.02, tw + H2 * 0.02, H2 * 0.06, H2 * 0.03);
    g.fill();
    g.restore();
    vol(tp, tx, ty, tw, th, ["#ef9a5c", "#c8652b", "#8d3c13", "#5e250b"], { rust: (x, y, w, hh2) => rustTex(x, y, w, hh2, 28) });
    g.strokeStyle = "rgba(50,18,4,.6)";
    g.lineWidth = H2 * 4e-3;
    g.beginPath();
    g.moveTo(tx + H2 * 0.03, ty + th * 0.82);
    g.lineTo(tx + tw - H2 * 0.03, ty + th * 0.82);
    g.stroke();
    g.strokeStyle = "rgba(255,210,170,.3)";
    g.beginPath();
    g.moveTo(tx + H2 * 0.03, ty + th * 0.82 + H2 * 4e-3);
    g.lineTo(tx + tw - H2 * 0.03, ty + th * 0.82 + H2 * 4e-3);
    g.stroke();
    for (const [px, py, pw, ph, r] of [[tx + tw * 0.1, ty + th * 0.2, tw * 0.34, th * 0.46, -0.08], [tx + tw * 0.56, ty + th * 0.14, tw * 0.32, th * 0.48, 0.06]]) {
      g.save();
      g.translate(px + pw / 2, py + ph / 2);
      g.rotate(r);
      g.fillStyle = "rgba(30,10,0,.4)";
      rp(-pw / 2 + H2 * 6e-3, -ph / 2 + H2 * 8e-3, pw, ph, H2 * 0.012);
      g.fill();
      rp(-pw / 2, -ph / 2, pw, ph, H2 * 0.012);
      g.fillStyle = LG(-pw / 2, -ph / 2, pw / 2, ph / 2, ["#a9d9c4", "#73ad97", "#4c816e"]);
      g.fill();
      g.save();
      g.clip();
      for (let i = 0; i < 14; i++) {
        g.fillStyle = rnd() < 0.5 ? "rgba(30,60,50,.25)" : "rgba(220,255,240,.2)";
        g.beginPath();
        g.arc((rnd() - 0.5) * pw, (rnd() - 0.5) * ph, H2 * (3e-3 + rnd() * 8e-3), 0, 7);
        g.fill();
      }
      g.restore();
      g.strokeStyle = "rgba(30,50,45,.8)";
      g.lineWidth = H2 * 4e-3;
      g.stroke();
      g.strokeStyle = "#d8c9a8";
      g.lineWidth = H2 * 5e-3;
      g.lineCap = "round";
      const st = (x0, y0, x1, y1, n) => {
        for (let i = 0; i < n; i++) {
          const k = (i + 0.5) / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k, nx = y1 - y0 ? H2 * 0.012 : 0, ny = x1 - x0 ? H2 * 0.012 : 0;
          g.beginPath();
          g.moveTo(x - nx, y - ny);
          g.lineTo(x + nx, y + ny);
          g.stroke();
        }
      };
      st(-pw / 2, -ph / 2, pw / 2, -ph / 2, 4);
      st(-pw / 2, ph / 2, pw / 2, ph / 2, 4);
      st(-pw / 2, -ph / 2, -pw / 2, ph / 2, 4);
      st(pw / 2, -ph / 2, pw / 2, ph / 2, 4);
      g.restore();
    }
    for (const [rx, ry] of [[tx + H2 * 0.03, ty + H2 * 0.03], [tx + tw - H2 * 0.03, ty + H2 * 0.03], [tx + H2 * 0.03, ty + th - H2 * 0.035], [tx + tw - H2 * 0.03, ty + th - H2 * 0.035]]) rivet(rx, ry, H2 * 9e-3);
    const hx = Wd * 0.07, hw = Wd * 0.86, hy = H2 * 0.08, hh = H2 * 0.53, hp = () => rp(hx, hy, hw, hh, H2 * 0.07);
    for (const s of [-1, 1]) {
      const ex = s < 0 ? hx - H2 * 0.035 : hx + hw - H2 * 0.015, ey = hy + hh * 0.28, ew = H2 * 0.05, eh = hh * 0.44;
      rp(ex, ey, ew, eh, H2 * 0.025);
      g.fillStyle = LG(ex, 0, ex + ew, 0, s < 0 ? ["#2c3035", "#7b838b", "#b8c0c6", "#555c63"] : ["#555c63", "#b8c0c6", "#7b838b", "#2c3035"]);
      g.fill();
      g.strokeStyle = "rgba(15,15,20,.8)";
      g.lineWidth = H2 * 5e-3;
      g.stroke();
      g.fillStyle = "rgba(255,255,255,.25)";
      rp(ex + ew * 0.3, ey + eh * 0.08, ew * 0.18, eh * 0.84, ew * 0.09);
      g.fill();
    }
    {
      const dx = cx, dy = hy + H2 * 0.01, dr = hw * 0.17;
      g.save();
      g.beginPath();
      g.ellipse(dx, dy, dr, H2 * 0.065, 0, Math.PI, 0);
      g.closePath();
      g.fillStyle = RG(dx - dr * 0.35, dy - H2 * 0.05, 0, dx, dy, dr, ["#ffbe88", "#d0692c", "#7a3210"]);
      g.fill();
      g.clip();
      rustTex(dx - dr, dy - H2 * 0.07, dr * 2, H2 * 0.07, 6);
      g.restore();
      g.strokeStyle = "rgba(45,18,6,.85)";
      g.lineWidth = H2 * 5e-3;
      g.beginPath();
      g.ellipse(dx, dy, dr, H2 * 0.065, 0, Math.PI, 0);
      g.stroke();
    }
    vol(hp, hx, hy, hw, hh, ["#f6a466", "#d8743a", "#a74c1c", "#6e2e0e"], { rust: (x, y, w, hh2) => rustTex(x, y, w, hh2, 60) });
    g.lineWidth = H2 * 4e-3;
    for (const [x0, y0, x1, y1] of [[hx + hw * 0.28, hy, hx + hw * 0.28, hy + hh * 0.1], [hx + hw * 0.7, hy, hx + hw * 0.7, hy + hh * 0.1], [hx + hw * 0.3, hy + hh, hx + hw * 0.3, hy + hh * 0.9], [hx + hw * 0.72, hy + hh, hx + hw * 0.72, hy + hh * 0.9], [hx, hy + hh * 0.5, hx + hw * 0.04, hy + hh * 0.5]]) {
      g.strokeStyle = "rgba(50,18,4,.75)";
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
      g.strokeStyle = "rgba(255,215,175,.35)";
      g.beginPath();
      g.moveTo(x0 + H2 * 4e-3, y0);
      g.lineTo(x1 + H2 * 4e-3, y1);
      g.stroke();
    }
    {
      const px = hx + hw * 0.11, py = hy + H2 * 4e-3, pw = hw * 0.1, ph = H2 * 0.045;
      rp(px, py, pw, ph, H2 * 6e-3);
      g.fillStyle = LG(px, py, px + pw, py + ph, ["#b4e0cc", "#6ea692", "#4a7f6c"]);
      g.fill();
      g.strokeStyle = "rgba(30,50,45,.8)";
      g.lineWidth = H2 * 4e-3;
      g.stroke();
    }
    const sx = hx + hw * 0.065, sy = hy + hh * 0.14, sw = hw * 0.66, sh = hh * 0.72, br = H2 * 0.055;
    g.save();
    g.filter = "blur(".concat(H2 * 8e-3, "px)");
    g.fillStyle = "rgba(30,10,0,.5)";
    rp(sx - H2 * 0.01, sy - H2 * 2e-3, sw + H2 * 0.03, sh + H2 * 0.03, br);
    g.fill();
    g.restore();
    rp(sx - H2 * 0.022, sy - H2 * 0.022, sw + H2 * 0.044, sh + H2 * 0.044, br * 1.2);
    g.fillStyle = LG(0, sy - H2 * 0.02, 0, sy + sh + H2 * 0.02, ["#c9d0d5", "#7d858c", "#4a5056", "#8e969c"]);
    g.fill();
    g.strokeStyle = "rgba(15,15,20,.75)";
    g.lineWidth = H2 * 5e-3;
    g.stroke();
    rp(sx - H2 * 8e-3, sy - H2 * 8e-3, sw + H2 * 0.016, sh + H2 * 0.016, br);
    g.fillStyle = LG(0, sy, 0, sy + sh, ["#2a2e33", "#5c646b"]);
    g.fill();
    rp(sx, sy, sw, sh, br);
    g.fillStyle = RG(sx + sw * 0.5, sy + sh * 0.45, H2 * 0.01, sx + sw * 0.5, sy + sh * 0.5, sw * 0.65, ["#1d6670", "#0d3a42", "#051a1f"]);
    g.fill();
    g.save();
    rp(sx, sy, sw, sh, br);
    g.clip();
    g.strokeStyle = "rgba(110,230,240,.07)";
    g.lineWidth = 1;
    const m = H2 * 8e-3;
    for (let y = sy; y < sy + sh; y += m) {
      g.beginPath();
      g.moveTo(sx, y);
      g.lineTo(sx + sw, y);
      g.stroke();
    }
    for (let x = sx; x < sx + sw; x += m) {
      g.beginPath();
      g.moveTo(x, sy);
      g.lineTo(x, sy + sh);
      g.stroke();
    }
    g.shadowColor = "#6ff0ff";
    g.shadowBlur = H2 * 0.035;
    g.fillStyle = "#a8f7ff";
    for (const s of [-1, 1]) {
      const ex = sx + sw / 2 + s * sw * 0.2, ey = sy + sh * 0.43;
      g.save();
      g.translate(ex, ey);
      g.rotate(s * 0.2);
      g.beginPath();
      g.ellipse(0, 0, sw * 0.12, sh * 0.15, 0, 0, 7);
      g.fill();
      g.fillStyle = "#08262c";
      g.shadowBlur = 0;
      g.beginPath();
      g.arc(-s * sw * 0.03, sh * 0.03, sw * 0.048, 0, 7);
      g.fill();
      g.fillStyle = "#e9fdff";
      g.beginPath();
      g.arc(-s * sw * 0.045, sh * 0, sw * 0.014, 0, 7);
      g.fill();
      g.restore();
      g.shadowBlur = H2 * 0.03;
      g.strokeStyle = "#a8f7ff";
      g.lineWidth = H2 * 0.024;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(ex - s * sw * 0.15, ey - sh * 0.28);
      g.lineTo(ex + s * sw * 0.09, ey - sh * 0.17);
      g.stroke();
    }
    g.lineWidth = H2 * 0.028;
    g.beginPath();
    g.arc(sx + sw / 2, sy + sh * 0.5, sw * 0.23, 0.28, Math.PI - 0.28);
    g.stroke();
    g.shadowBlur = 0;
    {
      const ix = sx + sw * 0.68, iy = sy + sh * 0.22;
      g.strokeStyle = "rgba(225,250,255,.8)";
      g.lineWidth = Math.max(1, H2 * 35e-4);
      for (let i = 0; i < 9; i++) {
        let a = i / 9 * 6.28 + rnd() * 0.4, x = ix, y = iy;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          const L = sw * (0.05 + rnd() * 0.09);
          a += (rnd() - 0.5) * 0.7;
          x += Math.cos(a) * L;
          y += Math.sin(a) * L;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.strokeStyle = "rgba(225,250,255,.45)";
      for (const r of [sw * 0.05, sw * 0.11]) {
        g.beginPath();
        for (let k = 0; k <= 9; k++) {
          const a = k / 9 * 6.28, rr = r * (0.8 + rnd() * 0.4);
          g.lineTo(ix + Math.cos(a) * rr, iy + Math.sin(a) * rr);
        }
        g.stroke();
      }
      g.fillStyle = "rgba(255,255,255,.6)";
      g.beginPath();
      g.arc(ix, iy, H2 * 6e-3, 0, 7);
      g.fill();
    }
    g.fillStyle = LG(0, sy, 0, sy + sh * 0.45, ["rgba(255,255,255,.28)", "rgba(255,255,255,.04)"]);
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx + sw * 0.75, sy);
    g.quadraticCurveTo(sx + sw * 0.45, sy + sh * 0.25, sx, sy + sh * 0.42);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.5)";
    g.beginPath();
    g.ellipse(sx + sw * 0.15, sy + sh * 0.14, sw * 0.05, sh * 0.025, -0.6, 0, 7);
    g.fill();
    g.strokeStyle = "rgba(0,0,0,.45)";
    g.lineWidth = H2 * 0.02;
    rp(sx, sy, sw, sh, br);
    g.stroke();
    g.restore();
    for (let i = 0; i < 3; i++) {
      const dx = hx + hw * 0.865, dy = hy + hh * (0.22 + i * 0.27), r = H2 * 0.045;
      g.fillStyle = "rgba(30,10,0,.45)";
      g.beginPath();
      g.arc(dx + r * 0.15, dy + r * 0.25, r * 1.12, 0, 7);
      g.fill();
      g.fillStyle = LG(dx - r, dy - r, dx + r, dy + r, ["#5d636a", "#2a2d31"]);
      g.beginPath();
      g.arc(dx, dy, r * 1.1, 0, 7);
      g.fill();
      g.fillStyle = RG(dx - r * 0.4, dy - r * 0.45, 0, dx, dy, r, ["#e3e8ec", "#8f979e", "#3c4147"]);
      g.beginPath();
      g.arc(dx, dy, r * 0.88, 0, 7);
      g.fill();
      g.strokeStyle = "#26292d";
      g.lineWidth = H2 * 7e-3;
      g.beginPath();
      g.moveTo(dx - r * 0.5, dy);
      g.lineTo(dx + r * 0.5, dy);
      g.stroke();
      g.fillStyle = "rgba(255,255,255,.7)";
      g.beginPath();
      g.ellipse(dx - r * 0.35, dy - r * 0.42, r * 0.22, r * 0.1, -0.6, 0, 7);
      g.fill();
    }
    for (const [rx, ry] of [[hx + H2 * 0.03, hy + H2 * 0.03], [hx + hw - H2 * 0.03, hy + H2 * 0.03], [hx + H2 * 0.03, hy + hh - H2 * 0.03], [hx + hw - H2 * 0.03, hy + hh - H2 * 0.03], [hx + hw * 0.5, hy + H2 * 0.022]]) rivet(rx, ry, H2 * 0.01);
    return jrC[key] = { c, w: Wd / S, h: H2 / S, pad: P2 / S };
  }
  const jrSp = {};
  function jrSprite(h) {
    const I = IMG.jr_a;
    if (!I || /jr=code/.test(location.search)) return null;
    const k = Math.round(h);
    if (jrSp[k]) return jrSp[k];
    const S = 2, H2 = Math.round(h * S), W2 = Math.round(H2 * I.width / I.height), P2 = 2, c = document.createElement("canvas");
    c.width = W2 + P2 * 2;
    c.height = H2 + P2 * 2;
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(I, P2, P2, W2, H2);
    return jrSp[k] = { c, w: W2 / S, h: H2 / S, pad: P2 / S, sprite: 1 };
  }
  BB.staticJr = (x, base, h, o = {}) => {
    const J = jrSprite(h * 1.2925) || jrCanvas(h), im = J.c;
    if (J.sprite) h = J.h;
    const SPR = !!J.sprite;
    const t = BB.t, w = J.w, legH = SPR ? h * 0.195 : h * 0.3, run = o.run || 0;
    ctx.save();
    ctx.translate(x, base);
    const lift = o.lift || 0;
    if (!o.noShadow) {
      const k = 1 / (1 + lift / 60);
      ctx.fillStyle = "rgba(0,0,0,".concat(0.28 * k, ")");
      ctx.beginPath();
      ctx.ellipse(0, lift, w * 0.4 * k, 10 * k, 0, 0, 7);
      ctx.fill();
    }
    ctx.rotate(o.rot || 0);
    if (o.flip) ctx.scale(-1, 1);
    const spd = o.spd || 450, fq = Math.min(11, Math.max(3.5, spd / (4 * h * 0.16))), A = Math.min(h * 0.26, spd / (4 * fq)) * run, cyc = t * fq;
    const bob = run ? -Math.abs(Math.sin(cyc * Math.PI * 2)) * h * 0.035 * run : 0, hipY = -legH + bob, LL = legH * 0.56;
    for (const lx of [-0.2, 0.2]) {
      const c = ((cyc + (lx > 0 ? 0.5 : 0)) % 1 + 1) % 1;
      let fx = w * lx * 0.8, fy = 0;
      if (run) {
        if (c < 0.5) {
          fx += A - 2 * A * (c / 0.5);
        } else {
          const u = (c - 0.5) / 0.5;
          fx += -A + 2 * A * (u * u * (3 - 2 * u));
          fy = -Math.sin(Math.PI * u) * h * 0.12 * run;
        }
      }
      const hx = w * lx * 0.8, ax = fx, ay = fy - h * 0.06, dx = ax - hx, dy = ay - hipY, d = Math.hypot(dx, dy), bend = Math.sqrt(Math.max(0, LL * LL - d * d / 4));
      const kx = (hx + ax) / 2 + -dy / d * bend * -1, ky = (hipY + ay) / 2 + dx / d * bend * -1;
      const sa = o.noShadow || lift ? 0 : Math.max(0, 1 + fy / (h * 0.15));
      if (sa) ctx.fillStyle = "rgba(0,0,0,".concat(0.25 * sa, ")");
      if (sa) {
        ctx.beginPath();
        ctx.ellipse(fx + h * 0.03, 0, h * 0.1 * (0.6 + 0.4 * sa), h * 0.025, 0, 0, 7);
        ctx.fill();
      }
      ctx.strokeStyle = "#2a2d33";
      ctx.lineWidth = Math.max(6, h * (SPR ? 0.07 : 0.08));
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(hx, hipY);
      ctx.lineTo(kx, ky);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      ctx.strokeStyle = "#6a7279";
      ctx.lineWidth = Math.max(3, h * 0.05);
      ctx.stroke();
      ctx.save();
      ctx.translate(-h * 0.012, -h * 6e-3);
      ctx.strokeStyle = "rgba(225,232,238,.75)";
      ctx.lineWidth = Math.max(1.2, h * 0.014);
      ctx.stroke();
      ctx.restore();
      {
        const kr = Math.max(3, h * 0.042);
        const G = ctx.createRadialGradient(kx - kr * 0.4, ky - kr * 0.4, 0, kx, ky, kr);
        G.addColorStop(0, "#eef2f4");
        G.addColorStop(0.5, "#8e979e");
        G.addColorStop(1, "#33373c");
        ctx.fillStyle = G;
        ctx.beginPath();
        ctx.arc(kx, ky, kr, 0, 7);
        ctx.fill();
        ctx.strokeStyle = "rgba(15,15,20,.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      const tilt = fy < 0 ? -0.25 * run : 0;
      ctx.save();
      ctx.translate(fx + h * 0.03, fy - h * 0.06);
      ctx.rotate(tilt);
      ctx.fillStyle = "#2e1a0e";
      ctx.beginPath();
      ctx.roundRect(-h * 0.11, h * 0.02, h * 0.22, h * 0.04, h * 0.015);
      ctx.fill();
      {
        const G = ctx.createRadialGradient(-h * 0.04, -h * 0.04, 0, 0, 0, h * 0.13);
        G.addColorStop(0, "#ffb47a");
        G.addColorStop(0.45, "#c4602a");
        G.addColorStop(1, "#5e250b");
        ctx.fillStyle = G;
      }
      ctx.strokeStyle = "rgba(45,18,6,.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -h * 5e-3, h * 0.11, h * 0.06, 0, Math.PI, 0);
      ctx.lineTo(h * 0.11, h * 0.025);
      ctx.lineTo(-h * 0.11, h * 0.025);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(70,40,30,.7)";
      ctx.beginPath();
      ctx.arc(h * 0.04, -h * 0.02, h * 0.018, 0, 7);
      ctx.arc(-h * 0.06, h * 0, h * 0.012, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,230,200,.55)";
      ctx.beginPath();
      ctx.ellipse(-h * 0.035, -h * 0.042, h * 0.04, h * 0.012, -0.2, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    const by = -legH - h, sq = o.squash || 0;
    ctx.translate(0, hipY + (SPR ? h * 0.125 : 0));
    ctx.scale(1 + sq, 1 - sq);
    {
      const lq = BB.q === 0;
      for (const s of [-1, 1]) {
        const a = s * (0.45 + Math.sin(t * 2 + s) * 0.08), L = h * 0.5, bx = J.sprite ? w * (-0.013 + s * 0.075) : s * w * 0.12, tx = bx + Math.sin(a) * L, ty = -h - Math.cos(a) * L;
        ctx.strokeStyle = "#3a3e44";
        ctx.lineWidth = Math.max(3, h * 0.028);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(bx, -h * (J.sprite ? 0.975 : 0.9));
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.strokeStyle = "rgba(220,226,232,.7)";
        ctx.lineWidth = Math.max(1, h * 9e-3);
        ctx.beginPath();
        ctx.moveTo(bx - h * 6e-3, -h * (J.sprite ? 0.975 : 0.9));
        ctx.lineTo(tx - h * 6e-3, ty);
        ctx.stroke();
        {
          const mx = bx + (tx - bx) * 0.45, my = -h * 0.9 + (ty + h * 0.9) * 0.45, r = Math.max(2, h * 0.02);
          ctx.fillStyle = "#8e979e";
          ctx.beginPath();
          ctx.arc(mx, my, r, 0, 7);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.7)";
          ctx.beginPath();
          ctx.arc(mx - r * 0.3, my - r * 0.3, r * 0.4, 0, 7);
          ctx.fill();
        }
        const sp = Math.sin(t * 7 + s * 2) > 0.55;
        if (sp) BB.glow(tx, ty, h * 0.25, "rgba(140,220,255,A)", 0.6);
        {
          const r = h * 0.045, G = ctx.createRadialGradient(tx - r * 0.4, ty - r * 0.4, 0, tx, ty, r);
          G.addColorStop(0, sp ? "#ffffff" : "#e9eef1");
          G.addColorStop(0.5, sp ? "#bff0ff" : "#8e979e");
          G.addColorStop(1, sp ? "#4fb6cc" : "#33373c");
          ctx.fillStyle = G;
          ctx.strokeStyle = "rgba(15,15,20,.7)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(tx, ty, r, 0, 7);
          ctx.fill();
          ctx.stroke();
        }
        if (sp && !lq) {
          ctx.strokeStyle = "#ffe066";
          ctx.lineWidth = 2.5;
          for (let i = 0; i < 3; i++) {
            const aa = i * 2.1 + t * 9, r1 = h * 0.09, r2 = h * 0.2;
            ctx.beginPath();
            ctx.moveTo(tx + Math.cos(aa) * r1, ty + Math.sin(aa) * r1);
            ctx.lineTo(tx + Math.cos(aa + 0.3) * (r1 + r2) * 0.6, ty + Math.sin(aa + 0.3) * (r1 + r2) * 0.6);
            ctx.lineTo(tx + Math.cos(aa) * r2, ty + Math.sin(aa) * r2);
            ctx.stroke();
          }
        }
      }
    }
    if (o.glitch) {
      for (let i = 0; i < 8; i++) {
        const sy = im.height * i / 8, dy = -h + h * i / 8, off = (Math.random() - 0.5) * h * 0.25 * o.glitch;
        const P2 = J.pad;
        ctx.drawImage(im, 0, P2 * 2 + sy * (im.height - P2 * 4) / im.height, im.width, (im.height - P2 * 4) / 8, -w / 2 - P2 + off, dy, w + P2 * 2, h / 8 + 1);
      }
    } else ctx.drawImage(im, -w / 2 - J.pad, -h - J.pad, w + J.pad * 2, h + J.pad * 2);
    if (o.stuffed) {
      ctx.fillStyle = "rgba(255,140,150,.95)";
      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 3;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(s * w * 0.46, -h * 0.62, w * 0.1, h * 0.14, 0, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
      BB.solidWhole(w * 0.02, -h * 0.48, h * 0.17, { rot: -0.4 + Math.sin(t * 12) * 0.1 });
    }
    if (o.dizzy) {
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + i * 2.1;
        BB.star(Math.cos(a) * w * 0.45, -h * 1.08 + Math.sin(a) * 12, 12, COL.yellow, a);
      }
    }
    ctx.restore();
  };
  BB.solidWhole = (x, y, s, o = {}) => {
    const R = BB.R;
    if (!R || !R.note3d) return BB.wholeNote(x, y, s, o);
    const n = s / 1.25, hh = n / 0.2, ww = n * 2.9, sp = R.note3d("w", ww, hh);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    if (o.glow) BB.glow(0, 0, s * 2.2, "rgba(255,245,190,A)", o.glow);
    const cw = sp.c.width / sp.sc, ch = sp.c.height / sp.sc;
    ctx.drawImage(sp.c, -cw / 2, -sp.gy, cw, ch);
    ctx.restore();
  };
  BB.wholeNote = (x, y, s, o = {}) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    if (o.glow) BB.glow(0, 0, s * 2.2, "rgba(255,245,190,A)", o.glow);
    ctx.lineWidth = Math.max(3, s * 0.16);
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = o.ring || COL.ink;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.68, 0, 0, 7);
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = o.fill || "#fff";
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.3, -0.75, 0, 7);
    ctx.fill();
    ctx.restore();
  };
  BB.beatPills = (cx, y, lit, o = {}) => {
    const n = lit.length, pw = o.pw || 76, gap = o.gap || 16, ph = o.ph || 64, tot = n * pw + (n - 1) * gap;
    const wob = o.wobble || 0;
    BB.rrect(cx - tot / 2 - 18, y - 45, tot + 36, 110, 26, "rgba(0,0,0,.25)");
    BB.well(cx - tot / 2 - 20, y - 55, tot + 40, 110, 26);
    for (let i = 0; i < n; i++) {
      const x = cx - tot / 2 + i * (pw + gap) + Math.sin(BB.t * 20 + i * 2) * wob * 14, yy = y - ph / 2 + Math.cos(BB.t * 17 + i) * wob * 10, l = lit[i];
      if (l > 0.01) {
        ctx.save();
        ctx.globalAlpha = l * 0.85;
        BB.glow(x + pw / 2, y, 62, "rgba(110,230,120,A)", 0.7);
        ctx.restore();
      }
      const g = Math.round(40 + l * 70), gg = Math.round(60 + l * 170), bb = Math.round(60 + l * 60);
      BB.rrect(x, yy, pw, ph, 14, BB.lg(yy, yy + ph, ["rgb(".concat(g + 40, ",").concat(Math.min(255, gg + 40), ",").concat(bb + 30, ")"), "rgb(".concat(g, ",").concat(gg, ",").concat(bb, ")"), "rgb(".concat(g * 0.7 | 0, ",").concat(gg * 0.75 | 0, ",").concat(bb * 0.75 | 0, ")")]), "rgba(235,245,240,.85)", 3);
      ctx.fillStyle = "rgba(255,255,255,.18)";
      ctx.beginPath();
      ctx.roundRect(x + 8, yy + 5, pw - 16, 12, 6);
      ctx.fill();
      if (o.marks && o.marks[i]) {
        const m = o.marks[i];
        BB.star(x + pw / 2, yy + ph / 2, 16 * BB.ease.back(Math.min(1, m)), COL.yellow, BB.t);
      }
    }
  };
  BB.micMeter = (x, y, o = {}) => {
    if (BB.listening && !o._in) {
      const sc = BB.listening === 2 ? 1.35 : 1.15, cx = x < W / 2 ? x : x + 330, cy = y > H / 2 ? y + 110 : y;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.translate(-cx, -cy);
      ctx.save();
      ctx.shadowColor = "#6ee678";
      ctx.shadowBlur = 30 + 20 * Math.sin(BB.t * 9);
      BB.rrect(x - 8, y - 8, 346, 126, 30, null, "#6ee678", 6);
      ctx.restore();
      BB.micMeter(x, y, __spreadProps(__spreadValues({}, o), { _in: 1 }));
      BB.text("LISTENING", x + 165, y - 24, 26, "#6ee678", { stroke: 5 });
      ctx.restore();
      return;
    }
    const m = BB.mic;
    BB.bevel(x - 8, y - 8, 346, 126, 30);
    BB.well(x, y, 330, 110, 26);
    BB.text("MIC", x + 50, y + 40, 32, COL.yellow, { stroke: 4 });
    BB.text(m.ok ? "ON" : { denied: "BLOCKED", nodevice: "NONE", lost: "LOST", error: "ERROR" }[m.state] || "OFF", x + 50, y + 78, m.ok ? 22 : 16, m.ok ? COL.green : "#ff9c8a");
    const n = 10, lvl = m.level;
    for (let i = 0; i < n; i++) {
      const on = i < lvl * n, bx = x + 95 + i * 20;
      let c = on ? i < 4 ? "#6ee678" : i < 7 ? "#ffe066" : "#ff7b5c" : "#3c5050";
      if (o.band === "soft" && i >= 4) c = on ? "#ff7b5c" : "#2a3a3a";
      if (o.band === "loud" && i < 6) c = on ? "#8aa" : "#2a3a3a";
      const by = y + 22 + (9 - i) * 3, bh = 64 - (9 - i) * 3;
      BB.rrect(bx, by, 14, bh, 4, c);
      if (on) {
        ctx.fillStyle = "rgba(255,255,255,.3)";
        ctx.fillRect(bx + 2, by + 2, 4, bh - 4);
      }
    }
    if (o.band) {
      const bx0 = x + 95 + (o.band === "soft" ? 0 : 6 * 20), bw = (o.band === "soft" ? 4 : 4) * 20 - 6;
      BB.rrect(bx0 - 3, y + 14, bw + 6, 80, 6, null, o.band === "soft" ? "#b6f0ff" : "#ffd23c", 3);
    }
  };
  BB.sensButtons = (x, y) => {
    const m = BB.mic;
    BB.button(x, y, 90, 90, "\u2212", { size: 50, id: "sens-", onClick: () => BB.setSens(m.sensIdx - 1) });
    BB.button(x + 110, y, 90, 90, "+", { size: 50, id: "sens+", onClick: () => BB.setSens(m.sensIdx + 1) });
  };
  BB.pauseBtn = (onClick, x = W / 2 - 120, y = 24) => {
    BB.button(x, y, 240, 110, "PAUSE", {
      size: 34,
      id: "pause",
      onClick,
      labelDx: 22,
      icon: (ix, iy) => {
        ix = x + 48;
        ctx.fillStyle = COL.ink;
        for (const bx of [ix - 13, ix + 4]) ctx.fillRect(bx, iy - 16, 10, 32);
      }
    });
  };
  BB.overrideBtn = (onClick, o = {}) => {
    const x = W - 370, y = H - 150;
    BB.button(x, y, 330, 110, "MANUAL", { style: "red", size: 40, sub: "OVERRIDE", id: "override", onClick, pop: o.pop });
  };
  BB.captionBox = () => {
    const c = BB.caption;
    if (!c || BB.t > c.until) return;
    const k = Math.min(1, (BB.t - c.start) * 6);
    const cp = BB.scene && BB.scene.capPos && BB.scene.capPos() || {};
    const fs = 38, w = Math.min(cp.maxW || 1150, BB.measure(c.txt, fs) + 200), x = (cp.cx || W / 2) - w / 2, y = cp.y != null ? cp.y : H - 300;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(0, (1 - k) * 30);
    BB.rrect(x + 4, y + 8, w, 96, 48, "rgba(0,0,0,.3)");
    BB.rrect(x, y, w, 96, 48, "#fff", COL.ink, 5);
    const jr = c.who === "jr", im = BB.IMG[jr ? "jr_a" : "sprocket"], pcx = x + 48, pcy = y + 48, pr = 36;
    if (im) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pcx, pcy, pr, 0, 7);
      ctx.fillStyle = jr ? "#3a2a3a" : "#cdeee0";
      ctx.fill();
      ctx.clip();
      if (jr) {
        const k2 = pr * 2.05 / 360, iw = im.width * k2, ih = im.height * k2;
        ctx.drawImage(im, pcx - iw / 2, pcy - 135 * k2, iw, ih);
      } else {
        const s = 150;
        ctx.drawImage(im, pcx - s * im.width / im.height / 2, pcy - s * 0.28, s * im.width / im.height, s);
      }
      ctx.restore();
      ctx.lineWidth = 4;
      ctx.strokeStyle = COL.ink;
      ctx.beginPath();
      ctx.arc(pcx, pcy, pr, 0, 7);
      ctx.stroke();
    }
    BB.text(c.txt, x + w / 2 + 40, y + 50, fs, c.who === "jr" ? "#c0392b" : COL.ink, { maxW: w - 170 });
    ctx.restore();
  };
  BB.pauseOverlay = (howTo, onResume) => {
    ctx.fillStyle = "rgba(8,18,17,.72)";
    ctx.fillRect(0, 0, W, H);
    const x = 210, y = 36, w = 1500, h = 1008;
    BB.panel(x, y, w, h, 40);
    BB.text("HOW TO PLAY", W / 2, y + 85, 62, "#fff", { font: "Rammetto One", stroke: 8 });
    BB.text(howTo.title, W / 2, y + 150, 40, COL.yellow, { stroke: 5 });
    howTo.steps.forEach((s, i) => {
      const yy = y + 225 + i * 80;
      ctx.fillStyle = COL.green;
      ctx.beginPath();
      ctx.arc(x + 100, yy, 30, 0, 7);
      ctx.fill();
      BB.text(String(i + 1), x + 100, yy + 2, 36, COL.ink);
      BB.text(s, x + 150, yy + 2, 36, "#fff", { align: "left", maxW: 760 });
    });
    BB.rrect(x + 950, y + 195, 490, 420, 26, "#0b1917", COL.teal2, 4);
    howTo.example(x + 950, y + 195, 490, 420, BB.realT());
    BB.text("Say it:", x + 100, y + h - 300, 34, COL.yellow, { align: "left" });
    BB.text(howTo.words, x + 220, y + h - 300, 34, "#fff", { align: "left", maxW: 1180 });
    {
      const m = BB.mic, wx = x + w - 560, wy = y + h - 230, sx = wx + 30, sy = wy + 56;
      BB.well(wx, wy, 520, 180, 26);
      BB.text("Clap sensitivity", wx + 260, wy + 32, 30, COL.yellow, { stroke: 4 });
      BB.button(sx, sy + 8, 80, 80, "\u2212", { size: 46, id: "psens-", onClick: () => BB.setSens(m.sensIdx - 1) });
      for (let i = 0; i < 6; i++) {
        const on = i <= m.sensIdx;
        BB.rrect(sx + 108 + i * 40, sy + 70 - i * 8, 30, 18 + i * 8, 6, on ? i < 2 ? "#6ee678" : i < 4 ? "#ffe066" : "#ff9c5c" : "#2f4242", "rgba(0,0,0,.35)", 2);
      }
      BB.button(sx + 380, sy + 8, 80, 80, "+", { size: 46, id: "psens+", onClick: () => BB.setSens(m.sensIdx + 1) });
    }
    BB.button(x + 60, y + h - 200, 380, 120, "ROOM SELECT", { size: 40, id: "roomsel", onClick: () => {
      BB.paused = false;
      BB.ac.resume().catch(() => {
      });
      BB.caption = null;
      BB.talking = null;
      BB.go(new BB.MapScene());
    } });
    {
      const S = BB.clapStats;
      if (S) {
        const m = BB.mic;
        BB.text("CLAP READOUT  counted " + S.hit + "/" + S.exp + "  \u2022  heard " + S.heard + "  \u2022  off-beat " + S.stray + "  \u2022  blocked by voice " + S.talk + "  \u2022  mic peak " + Math.round(S.peak * 100) + "%  \u2022  slow frames " + S.slow + "  \u2022  mic " + (m.ok ? "on" : m.state) + (window.C96 && C96.active && C96.active() ? " (clap96)" : ""), W / 2, y + h - 38, 22, "#cfe8e2", { maxW: w - 80 });
      }
    }
    if (BB.clapLog) {
      const L = BB.clapLog, bx = x + w - 330, bw = 290;
      BB.button(bx, y + 30, bw, 56, "CLAP LOG: " + (L.on ? "ON" : "OFF") + " (" + L.count() + ")", { size: 22, id: "clog", onClick: () => {
        L.on = !L.on;
      } });
      BB.button(bx, y + 92, bw, 56, "Download clap log (CSV)", { size: 20, id: "clogdl", onClick: () => L.download() });
      BB.button(bx, y + 154, bw, 46, "Clear log", { size: 20, id: "clogclr", onClick: () => L.clear() });
    }
    BB.button(W / 2 - 220, y + h - 200, 440, 120, "RESUME", { style: "green", size: 56, id: "resume", onClick: onResume });
  };
  let rt = 0, rl = performance.now();
  BB.realT = () => {
    const n = performance.now();
    rt += (n - rl) / 1e3;
    rl = n;
    return rt;
  };
  BB.titleCard = (txt, sub, k) => {
    if (k <= 0 || k >= 1) return;
    const a = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    const s = 0.8 + 0.2 * BB.ease.back(Math.min(1, k * 4));
    ctx.translate(W / 2, H / 2 - 60);
    ctx.scale(s, s);
    BB.panel(-520, -130, 1040, 260, 40);
    BB.text(txt, 0, -30, 84, "#fff", { font: "Rammetto One", stroke: 9, maxW: 832 });
    BB.text(sub, 0, 58, 40, COL.yellow, { stroke: 5, maxW: 900 });
    ctx.restore();
  };
})();
(() => {
  let ctx = BB.ctx;
  BB._sw.push((g) => ctx = g);
  BB.V2 = {};
  BB.loadV2 = () => Promise.all([["rock", "png"], ["crystal", "png"], ["cart", "png"], ["elev", "png"], ["smash", "png"], ["bin", "png"], ["rubble", "png"], ["wh", "jpg"], ["tun0", "jpg"], ["tun1", "jpg"], ["tun2", "jpg"], ["tun3", "jpg"], ["tun4", "jpg"], ["pipe", "png"], ["funnel", "png"], ["title_bg", "jpg"], ["map_bg", "jpg"], ["hub_bg", "jpg"], ["conveyor", "png"], ["redbtn", "png"], ["smash_blur", "jpg"], ["pack_blur", "jpg"], ["logo", "png"], ["mic", "png"], ["lock", "png"], ["chip", "png"], ["earth", "jpg"], ["shaft", "jpg"]].map(([n, e]) => new Promise((r) => {
    const i = new Image();
    i.onload = () => {
      BB.V2[n] = i;
      (i.decode ? i.decode().catch(() => {
      }) : Promise.resolve()).then(r);
    };
    i.onerror = () => r();
    i.src = "assets/v2/" + n + "." + e + "?v=" + (BB.VERSION || "");
  })));
  const tcache = {};
  BB.tinted = (name, rim, amb, ambA = 0.18) => {
    const key = name + rim + amb + ambA;
    if (tcache[key]) return tcache[key];
    const im = BB.V2[name];
    if (!im) return null;
    const c = document.createElement("canvas");
    c.width = im.width;
    c.height = im.height;
    const g = c.getContext("2d");
    g.drawImage(im, 0, 0);
    g.globalCompositeOperation = "source-atop";
    if (amb) {
      g.globalAlpha = ambA;
      g.fillStyle = amb;
      g.fillRect(0, 0, c.width, c.height);
      g.globalAlpha = 1;
    }
    if (rim) {
      const gr = g.createLinearGradient(0, 0, 0, c.height * 0.55);
      gr.addColorStop(0, rim);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = 0.35;
      g.fillStyle = gr;
      g.fillRect(0, 0, c.width, c.height);
      g.globalAlpha = 1;
    }
    return tcache[key] = c;
  };
  BB.contactShadow = (x, y, rw, a = 0.45) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.16);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rw);
    g.addColorStop(0, "rgba(10,5,2,".concat(a, ")"));
    g.addColorStop(0.6, "rgba(10,5,2,".concat(a * 0.5, ")"));
    g.addColorStop(1, "rgba(10,5,2,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-rw, -rw, 2 * rw, 2 * rw);
    ctx.restore();
  };
  BB.prop = (name, x, base, h, o = {}) => {
    var _a, _b;
    const im = BB.V2[name];
    if (!im) return;
    let hh = h;
    const ar = im.width / im.height;
    if (o.box) {
      hh = Math.min(hh, base - o.box.y0);
      hh = Math.min(hh, (o.box.x1 - o.box.x0) / ar);
      const w2 = hh * ar;
      x = Math.max(o.box.x0 + w2 / 2, Math.min(o.box.x1 - w2 / 2, x));
    }
    const w = hh * ar, src = o.rim || o.amb ? BB.tinted(name, o.rim, o.amb, o.ambA) : im;
    if (o.shadow !== false) BB.contactShadow(x, base, w * 0.55, (_a = o.shadowA) != null ? _a : 0.45);
    ctx.save();
    ctx.translate(x, base);
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    ctx.globalAlpha = (_b = o.alpha) != null ? _b : 1;
    ctx.drawImage(src, -w / 2, -hh + (o.sink || 0), w, hh);
    ctx.restore();
    return { x, w, h: hh };
  };
})();
BB.VO_LINES = (BB.VO_LINES || []).concat([
  ["lc_intro", "Let's teach my ears your claps! First, we'll clap softly, piano, for eight beats. Then loudly, forte, for eight beats.", "sprocket"],
  ["lc_soft", "Soft claps, piano. Watch the lights. Get ready!", "sprocket"],
  ["lc_mid", "Nice and soft! Now loud claps, forte! Big and strong. Get ready!", "sprocket"],
  ["lc_done", "Got it! Now I know soft from loud.", "sprocket"],
  ["lc_again", "Hmm. Let's try that again. Make the loud claps much louder than the soft ones.", "sprocket"]
]);
BB.LoudCal = class {
  constructor(onDone) {
    this.onDone = onDone;
    this.SPB = 0.6;
    this.soft = [];
    this.loud = [];
    this.ph = "intro";
    this.t0 = BB.t;
    this.wait = BB.say("lc_intro") + 0.4;
    BB.mic.take();
  }
  get busy() {
    return this.ph !== "gone";
  }
  prep(kind) {
    this.kind = kind;
    this[kind] = [];
    this.got = [];
    this.ph = "prep";
    this.t0 = BB.t;
    this.wait = BB.say(kind === "soft" ? "lc_soft" : "lc_mid") + 0.3;
    BB.mic.take();
  }
  run() {
    const ac = BB.ac, S = this.SPB, tA = ac.currentTime + 0.35;
    this.tA = tA;
    this.ph = "run";
    BB.mic.take();
    for (let i = 0; i < 12; i++) BB.sfx.tick(tA + i * S, i === 0 || i === 4 || i === 8, i < 4 ? 1 : this.kind === "soft" ? 0.6 : 1);
  }
  beatIdx() {
    return (BB.ac.currentTime - this.tA) / this.SPB;
  }
  update() {
    const t = BB.t;
    if (this.ph === "gone") return;
    BB.dynMode = t;
    if (this.kind === "soft" && this.ph === "run") BB.softClap = t;
    if (BB.MLP && BB.MLP.on && this.ph === "run") BB.MLP.micWant();
    const os = BB.mic.take();
    if (this.ph === "intro" && t - this.t0 > this.wait) this.prep("soft");
    else if (this.ph === "prep" && t - this.t0 > this.wait) this.run();
    else if (this.ph === "run") {
      const a = this[this.kind], S = this.SPB, lat = BB.mic.lat != null ? BB.mic.lat : 0.06;
      for (const o of os) {
        if (!o.rms) continue;
        const x = (o.t - lat - this.tA) / S, i = Math.round(x), d = (x - i) * S;
        if (i >= 4 && i < 12 && d > -0.16 && d < 0.26 && !this.got[i]) {
          this.got[i] = 1;
          a.push(o.rms);
          this.pop = t;
        }
      }
      if (this.beatIdx() > 11.9) {
        if (this.kind === "soft") this.prep("loud");
        else this.finish();
      }
    } else if (this.ph === "done" && this.ok && t - this.t0 > 2.6) {
      this.ph = "gone";
      this.onDone && this.onDone(true);
    }
  }
  finish() {
    const G = window.GroupGate, med = (a) => {
      const b = [...a].sort((x, y) => x - y);
      return b[b.length >> 1];
    };
    this.ok = false;
    if (G && this.soft.length >= 3 && this.loud.length >= 3) {
      const s = med(this.soft), l = med(this.loud);
      if (20 * Math.log10(l / s) > 4) {
        G.calLoud(s, l);
        this.ok = G.calOk();
      }
    }
    this.ph = "done";
    this.t0 = BB.t;
    BB.say(this.ok ? "lc_done" : "lc_again");
    if (this.ok) BB.sfx.ding();
  }
  retry() {
    this.prep("soft");
  }
  skip() {
    if (this.ph === "gone") return;
    this.ph = "gone";
    this.onDone && this.onDone(false);
  }
  // defaults: adaptive scale from normal claps
  draw(cx, cy) {
    if (this.ph === "gone") return;
    const t = BB.t, COL = BB.COL, ctx = BB.ctx, pw = 980, ph = 520, x = cx - pw / 2, y = cy - ph / 2;
    BB.panel(x, y, pw, ph, 34);
    BB.text("CLAP CHECK", cx, y + 54, 42, COL.yellow, { font: "Rammetto One", stroke: 6 });
    const soft = this.kind !== "loud", done = this.ph === "done";
    if (this.ph === "intro") {
      BB.text("Teach Sprocket your claps!", cx, y + 130, 44, "#fff", { stroke: 5 });
      BB.text("8 SOFT claps (piano), then 8 LOUD claps (forte)", cx, y + 200, 32, "#cfe", { stroke: 4, maxW: pw - 80 });
    } else if (done) {
      BB.text(this.ok ? "Got it! Soft and loud saved." : "Hmm, the loud claps need to be much louder.", cx, y + 130, 38, this.ok ? COL.green : "#ff9c8a", { stroke: 5, maxW: pw - 60 });
      BB.text("soft claps heard: ".concat(this.soft.length, "   loud claps heard: ").concat(this.loud.length), cx, y + 200, 30, "#cfe", {});
      if (!this.ok) {
        BB.button(cx - 260, y + ph - 130, 240, 80, "TRY AGAIN", { style: "green", size: 34, id: "lcretry", onClick: () => this.retry() });
        BB.button(cx + 20, y + ph - 130, 240, 80, "Skip", { size: 34, id: "lcskip2", onClick: () => this.skip() });
      }
    } else {
      BB.text(soft ? "Clap SOFTLY  (piano)" : "Clap LOUDLY!  (forte)", cx, y + 120, soft ? 44 : 52, soft ? "#b6f0ff" : "#ffb36b", { stroke: 5 });
      const bi = this.ph === "run" ? this.beatIdx() : -1, lit = [];
      for (let i = 0; i < 8; i++) {
        const k = bi - (i + 4);
        lit.push(k >= -0.05 && k < 0.5 ? 1 - k : this.got[i + 4] ? 0.35 : 0);
      }
      if (bi >= -0.2 && bi < 4) {
        const n = Math.min(3, Math.max(0, Math.floor(bi + 0.05)));
        const ph2 = bi - Math.floor(bi);
        BB.text(["1", "2", "3", "4"][n], cx, y + 235, 90 * (1 + Math.max(0, 0.25 - ph2)), COL.yellow, { font: "Rammetto One", stroke: 8 });
      } else if (this.ph === "prep") BB.text("get ready...", cx, y + 225, 40, "rgba(255,255,255,.8)", {});
      else BB.beatPills(cx, y + 235, lit, { pw: 70, gap: 18 });
      const a = this[this.kind] || [];
      BB.text("".concat(soft ? "soft" : "loud", " claps: ").concat(a.length, " / 8"), cx - 335, y + ph - 80, 34, a.length && this.pop && t - this.pop < 0.3 ? COL.green : "#fff", { stroke: 4 });
      BB.micMeter(cx - 130, y + ph - 148, { band: soft ? "soft" : "loud" });
      BB.button(x + pw - 190, y + ph - 112, 150, 60, "Skip", { size: 28, id: "lcskip", onClick: () => this.skip() });
    }
  }
};
