// Макро-слой: стакан на canvas — жидкость, порошок, пузыри, пена, термометр
import { cssVar, fmt } from "../core/util.js";

const W = 320, H = 300;
const B = { x1: 70, x2: 210, top: 36, bottom: 272, r: 14 };
const CAPACITY = 4; // порций жидкости

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function createBeaker(canvas) {
  const ctx = canvas.getContext("2d");
  const s = {
    portions: 0, level: 0, rgb: null,
    pile: 0, pileRgb: [255, 255, 255],
    grains: [], bubbles: [], fizz: 0, foam: 0,
    temp: 22, tempShown: 22, gasLabel: null, gasAlpha: 0,
    pour: null
  };
  let running = false;
  let last = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  const innerH = B.bottom - B.top - 16;
  const surfaceY = () => B.bottom - s.level * innerH;

  function beakerPath() {
    ctx.beginPath();
    ctx.moveTo(B.x1, B.top);
    ctx.lineTo(B.x1, B.bottom - B.r);
    ctx.quadraticCurveTo(B.x1, B.bottom, B.x1 + B.r, B.bottom);
    ctx.lineTo(B.x2 - B.r, B.bottom);
    ctx.quadraticCurveTo(B.x2, B.bottom, B.x2, B.bottom - B.r);
    ctx.lineTo(B.x2, B.top);
  }

  function step(dt) {
    const target = s.portions / CAPACITY;
    s.level += (target - s.level) * Math.min(1, dt * 3);
    if (s.pour) {
      s.pour.t -= dt;
      if (s.pour.t <= 0) s.pour = null;
    }
    // крупинки падают и растворяются
    for (const g of s.grains) {
      g.vy += 400 * dt;
      g.y += g.vy * dt;
      if (g.dissolve && g.y > surfaceY()) { g.a -= dt * 1.4; g.vy *= 0.85; }
      if (!g.dissolve && g.y > B.bottom - 6 - s.pile * 14) g.a = 0;
    }
    s.grains = s.grains.filter((g) => g.a > 0 && g.y < B.bottom);
    // пузыри
    if (s.fizz > 0.02 && s.level > 0.02) {
      const n = s.fizz * 60 * dt * 8;
      for (let i = 0; i < n; i++) {
        s.bubbles.push({ x: B.x1 + 12 + Math.random() * (B.x2 - B.x1 - 24), y: B.bottom - 4 - Math.random() * 10, r: 1.5 + Math.random() * 3.5, vy: 40 + Math.random() * 60, w: Math.random() * 6 });
      }
    }
    for (const b of s.bubbles) {
      b.y -= b.vy * dt;
      b.vy += 30 * dt;
      b.w += dt * 5;
    }
    const sy = surfaceY();
    s.bubbles = s.bubbles.filter((b) => b.y > sy - 2);
    s.fizz *= Math.pow(0.55, dt); // затухает за несколько секунд
    const foamTarget = Math.min(1, s.fizz * 1.1);
    s.foam += (foamTarget - s.foam) * Math.min(1, dt * (foamTarget > s.foam ? 4 : 0.6));
    s.gasAlpha += ((s.fizz > 0.15 ? 1 : 0) - s.gasAlpha) * Math.min(1, dt * 2);
    s.tempShown += (s.temp - s.tempShown) * Math.min(1, dt * 0.8);
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    const glass = cssVar(canvas, "--glass") || "#7a8a90";
    const ink = cssVar(canvas, "--muted") || "#555";
    const sy = surfaceY();

    ctx.save();
    beakerPath();
    ctx.closePath();
    ctx.clip();
    // жидкость
    if (s.level > 0.005 && s.rgb) {
      const [r, g, b] = s.rgb;
      const grad = ctx.createLinearGradient(0, sy, 0, B.bottom);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
      grad.addColorStop(1, `rgba(${Math.round(r * 0.85)},${Math.round(g * 0.88)},${Math.round(b * 0.92)},1)`);
      ctx.fillStyle = grad;
      ctx.fillRect(B.x1, sy, B.x2 - B.x1, B.bottom - sy);
      // голубоватая толща воды, чтобы прозрачная жидкость была видна
      ctx.fillStyle = "rgba(90,160,210,0.16)";
      ctx.fillRect(B.x1, sy, B.x2 - B.x1, B.bottom - sy);
      // волна по поверхности
      ctx.strokeStyle = "rgba(60,130,180,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = B.x1; x <= B.x2; x += 4) {
        const y = sy + Math.sin(x / 9 + time / 300) * (1 + s.fizz * 2);
        x === B.x1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // кучка порошка на дне сухого стакана
    if (s.pile > 0.01) {
      const [r, g, b] = s.pileRgb;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      const cx = (B.x1 + B.x2) / 2, w = 40 + s.pile * 30, h = 8 + s.pile * 12;
      ctx.beginPath();
      ctx.moveTo(cx - w, B.bottom);
      ctx.quadraticCurveTo(cx, B.bottom - h * 2, cx + w, B.bottom);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // пузыри
    for (const b of s.bubbles) {
      ctx.beginPath();
      ctx.arc(b.x + Math.sin(b.w) * 2, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(50,110,160,0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fill();
    }
    // пена
    if (s.foam > 0.02 && s.level > 0.02) {
      const top = sy - s.foam * Math.min(110, sy - B.top - 6);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.strokeStyle = "rgba(120,150,170,0.45)";
      ctx.lineWidth = 1;
      for (let y = sy + 4; y > top; y -= 9) {
        for (let x = B.x1 + 4; x < B.x2; x += 13) {
          const jitter = Math.sin(x * 12.9898 + y * 78.233) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x + jitter * 6, y + Math.sin(time / 200 + x) * 1.2, 6 + jitter * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // струя при наливании
    if (s.pour) {
      const [r, g, b] = s.pour.rgb;
      ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(140, 0);
      ctx.lineTo(140, sy);
      ctx.stroke();
    }
    // крупинки
    for (const g of s.grains) {
      ctx.fillStyle = `rgba(${g.rgb.join(",")},${Math.max(0, g.a)})`;
      ctx.strokeStyle = `rgba(0,0,0,${0.25 * Math.max(0, g.a)})`;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // стекло
    ctx.lineWidth = 3;
    ctx.strokeStyle = glass;
    beakerPath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(B.x1 - 8, B.top);
    ctx.lineTo(B.x1, B.top);
    ctx.moveTo(B.x2, B.top);
    ctx.lineTo(B.x2 + 8, B.top);
    ctx.stroke();
    // блик
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(B.x1 + 10, B.top + 20);
    ctx.lineTo(B.x1 + 10, B.bottom - 30);
    ctx.stroke();
    // деления
    ctx.strokeStyle = glass;
    ctx.fillStyle = ink;
    ctx.lineWidth = 1;
    ctx.font = "10px system-ui, sans-serif";
    for (let i = 1; i <= CAPACITY; i++) {
      const y = B.bottom - (i / CAPACITY) * innerH;
      ctx.beginPath();
      ctx.moveTo(B.x2 - 18, y);
      ctx.lineTo(B.x2 - 4, y);
      ctx.stroke();
      ctx.fillText(`${i * 50}`, B.x2 - 40, y + 3);
    }

    // газ над стаканом
    if (s.gasAlpha > 0.02 && s.gasLabel) {
      ctx.globalAlpha = s.gasAlpha;
      ctx.fillStyle = ink;
      ctx.font = "600 15px system-ui, sans-serif";
      const y = 22 + Math.sin(time / 400) * 3;
      ctx.fillText(`↑ ${s.gasLabel}`, 118, y);
      ctx.globalAlpha = 1;
    }

    // термометр
    const tx = 262, tTop = 50, tBot = 250;
    ctx.strokeStyle = glass;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx - 6, tTop, 12, tBot - tTop, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tx, tBot + 10, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#e0453a";
    ctx.fill();
    const frac = Math.min(1, Math.max(0, (s.tempShown - 10) / 30));
    const mercY = tBot - frac * (tBot - tTop - 8);
    ctx.fillRect(tx - 3, mercY, 6, tBot - mercY + 4);
    ctx.fillStyle = ink;
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${fmt(s.tempShown, 1)} °C`, tx, tTop - 10);
    ctx.textAlign = "start";
  }

  function frame(time) {
    const dt = Math.min(0.05, (time - (last || time)) / 1000);
    last = time;
    step(dt);
    draw(time);
    const busy = s.grains.length || s.bubbles.length || s.fizz > 0.02 || s.foam > 0.02 || s.pour ||
      Math.abs(s.level - s.portions / CAPACITY) > 0.002 || Math.abs(s.temp - s.tempShown) > 0.05;
    if (busy) requestAnimationFrame(frame);
    else { running = false; last = 0; }
  }
  function kick() {
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  function mixColor(rgb) {
    if (!s.rgb || s.portions === 0) return rgb;
    const k = 1 / (s.portions + 1);
    return s.rgb.map((c, i) => Math.round(c * (1 - k) + rgb[i] * k));
  }

  const api = {
    get full() { return s.portions >= CAPACITY; },
    get hasLiquid() { return s.portions > 0; },
    pour(hex) {
      const rgb = hexToRgb(hex);
      s.rgb = mixColor(rgb);
      s.portions++;
      s.pour = { rgb, t: 0.8 };
      // порошок на дне растворяется
      if (s.pile > 0) { api.dissolvePile(); }
      kick();
    },
    sprinkle(hex, dissolve) {
      const rgb = hexToRgb(hex);
      for (let i = 0; i < 40; i++) {
        s.grains.push({ x: 120 + Math.random() * 40, y: -Math.random() * 60, vy: Math.random() * 40, a: 1, rgb, dissolve });
      }
      if (!dissolve) { s.pile = Math.min(1, s.pile + 0.5); s.pileRgb = rgb; }
      kick();
    },
    dissolvePile() {
      s.pile = 0;
      kick();
    },
    fizz(power, gasLabel) {
      s.fizz = Math.min(1.6, s.fizz + power);
      s.gasLabel = gasLabel;
      kick();
    },
    addHeat(dT) {
      s.temp += dT;
      kick();
    },
    reset() {
      Object.assign(s, { portions: 0, level: 0, rgb: null, pile: 0, grains: [], bubbles: [], fizz: 0, foam: 0, temp: 22, gasLabel: null, gasAlpha: 0, pour: null });
      kick();
    },
    redraw: kick
  };
  draw(0);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => draw(performance.now()));
  return api;
}
