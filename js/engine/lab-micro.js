// Микро-слой («лупа»): атомы-шарики перестраивают связи.
// Фазы шкалы t ∈ [0, 1]: встреча → разрыв связей → перестройка → новые связи → газ улетает
import { ELEMENTS } from "../../data/elements.js";
import { $, clamp, lerp, ease, cssVar, reducedMotion } from "../core/util.js";

const W = 640, H = 330;
const PHASES = [0, 0.15, 0.35, 0.75, 0.9, 1];
const DURATION = 9000;

const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const toMap = (list) => new Map(list.map(([a, b, o = 1]) => [key(a, b), { a, b, o }]));

export function createMicro(root, scene, { onDone = () => {} } = {}) {
  root.innerHTML = `
    <div class="micro">
      <div class="micro-head"><span class="lens">🔍</span> Лупа: атомы в реакции</div>
      <canvas width="${W}" height="${H}" aria-label="Анимация перестройки атомов"></canvas>
      <p class="micro-caption" aria-live="polite"></p>
      <div class="micro-controls">
        <button type="button" class="btn small" data-act="play">▶ Смотреть</button>
        <input type="range" min="0" max="1000" value="0" aria-label="Перемотка реакции">
      </div>
      <div class="micro-legend">${[...new Set(scene.atoms.map((a) => a.el))].map((el) =>
        `<span><i class="dot" style="background:${ELEMENTS[el].color}"></i>${el} — ${ELEMENTS[el].name.toLowerCase()}</span>`).join("")}</div>
    </div>`;

  const canvas = $("canvas", root);
  const ctx = canvas.getContext("2d");
  const caption = $(".micro-caption", root);
  const playBtn = $('[data-act="play"]', root);
  const slider = $('input[type="range"]', root);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const before = toMap(scene.bondsBefore);
  const after = toMap(scene.bondsAfter);
  const atomById = Object.fromEntries(scene.atoms.map((a) => [a.id, a]));
  const gas = new Set(scene.gasAtoms || []);

  // масштаб: вписываем обе раскладки в холст
  const xs = scene.atoms.flatMap((a) => [a.from[0], a.to[0]]);
  const labelYs = [...(scene.labelsBefore || []), ...(scene.labelsAfter || [])].map((l) => l.y);
  const ys = scene.atoms.flatMap((a) => [a.from[1], a.to[1] - (gas.has(a.id) ? 0.9 : 0)]).concat(labelYs.map((y) => y - 0.3), labelYs.map((y) => y + 0.3));
  const minX = Math.min(...xs) - 0.9, maxX = Math.max(...xs) + 0.9;
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const S = Math.min(W / (maxX - minX), H / (maxY - minY));
  const ox = (W - (maxX - minX) * S) / 2 - minX * S;
  const oy = (H - (maxY - minY) * S) / 2 - minY * S;
  const px = (x) => ox + x * S;
  const py = (y) => oy + y * S;

  let t = 0, playing = false, last = 0, doneFired = false;

  const phaseOf = (tt) => Math.max(0, PHASES.findIndex((p, i) => tt >= p && tt < (PHASES[i + 1] ?? 2)));
  const seg = (tt, i) => clamp((tt - PHASES[i]) / (PHASES[i + 1] - PHASES[i]));

  function pos(a, tt, time) {
    const u = ease(seg(tt, 2) * (tt >= PHASES[2] ? 1 : 0));
    let x = lerp(a.from[0], a.to[0], u);
    let y = lerp(a.from[1], a.to[1], u);
    // «дрожание» молекул в растворе
    const wob = reducedMotion() ? 0 : 0.03;
    x += Math.sin(time / 300 + a.from[0] * 3) * wob;
    y += Math.cos(time / 350 + a.from[1] * 3) * wob;
    if (gas.has(a.id)) y -= seg(tt, 4) * 0.9;
    return [px(x), py(y)];
  }

  function bondLine(p1, p2, order, color, width, alpha) {
    if (alpha <= 0.01) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 4, ny = (dx / len) * 4;
    const offs = order === 2 ? [-1, 1] : [0];
    for (const o of offs) {
      ctx.beginPath();
      ctx.moveTo(p1[0] + nx * o, p1[1] + ny * o);
      ctx.lineTo(p2[0] + nx * o, p2[1] + ny * o);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    const ink = cssVar(canvas, "--ink") || "#222";
    const muted = cssVar(canvas, "--muted") || "#666";
    const bondColor = cssVar(canvas, "--bond") || "#8a969b";
    const stroke = cssVar(canvas, "--atom-stroke") || "rgba(0,0,0,.35)";
    const P = Object.fromEntries(scene.atoms.map((a) => [a.id, pos(a, t, time)]));
    const blink = 0.5 + 0.5 * Math.sin(time / 90);

    // ионные пары — пунктир
    ctx.setLineDash([4, 5]);
    for (const [a, b] of scene.ionicBefore || []) bondLine(P[a], P[b], 1, muted, 1.5, 1 - seg(t, 1));
    for (const [a, b] of scene.ionicAfter || []) bondLine(P[a], P[b], 1, muted, 1.5, seg(t, 3));
    ctx.setLineDash([]);

    // связи
    const keys = new Set([...before.keys(), ...after.keys()]);
    for (const k of keys) {
      const b0 = before.get(k), b1 = after.get(k);
      const { a, b } = b0 || b1;
      if (b0 && !b1) {
        // рвётся: мигает красным и гаснет
        const s = seg(t, 1);
        const col = t >= PHASES[1] ? "#e0453a" : bondColor;
        bondLine(P[a], P[b], b0.o, col, 4, t < PHASES[1] ? 1 : (1 - s) * (0.5 + 0.5 * blink));
      } else if (!b0 && b1) {
        // образуется: проявляется зелёным
        const s = seg(t, 3);
        bondLine(P[a], P[b], b1.o, t < PHASES[4] ? "#2f9e5a" : bondColor, 4, t >= PHASES[3] ? s : 0);
      } else if (b0.o !== b1.o) {
        const useAfter = t >= PHASES[3];
        bondLine(P[a], P[b], useAfter ? b1.o : b0.o, useAfter && t < PHASES[4] ? "#2f9e5a" : bondColor, 4, 1);
      } else {
        bondLine(P[a], P[b], b0.o, bondColor, 4, 1);
      }
    }

    // атомы
    for (const a of scene.atoms) {
      const el = ELEMENTS[a.el];
      const [x, y] = P[a.id];
      const r = el.r * S * 0.7;
      // небольшой блик в углу, чтобы не перекрывать букву
      const grad = ctx.createRadialGradient(x - r * 0.5, y - r * 0.5, 0, x - r * 0.5, y - r * 0.5, r * 0.55);
      grad.addColorStop(0, "rgba(255,255,255,0.7)");
      grad.addColorStop(1, el.color);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.fillStyle = el.ink;
      ctx.font = `700 ${Math.round(r * (a.el.length > 1 ? 0.95 : 1.15))}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(a.el, x, y + 1);
      const charge = a.charge ? a.charge[t < 0.55 ? 0 : 1] : "";
      if (charge) {
        ctx.fillStyle = ink;
        ctx.font = `700 ${Math.round(r * 0.8)}px system-ui, sans-serif`;
        ctx.fillText(charge, x + r * 0.95, y - r * 0.95);
      }
    }

    // подписи молекул
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.fillStyle = muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const aBefore = 1 - clamp((t - 0.12) / 0.1);
    const aAfter = clamp((t - 0.86) / 0.08);
    ctx.globalAlpha = aBefore;
    for (const l of scene.labelsBefore || []) ctx.fillText(l.text, px(l.x), py(l.y));
    ctx.globalAlpha = aAfter;
    for (const l of scene.labelsAfter || []) ctx.fillText(l.text, px(l.x), py(l.y));
    ctx.globalAlpha = 1;
    ctx.textAlign = "start";

    caption.textContent = scene.captions[Math.min(phaseOf(t), scene.captions.length - 1)];
  }

  function frame(time) {
    if (playing) {
      const dt = last ? time - last : 0;
      t = Math.min(1, t + dt / DURATION);
      slider.value = Math.round(t * 1000);
      if (t >= 1) {
        playing = false;
        playBtn.textContent = "↻ Ещё раз";
        if (!doneFired) { doneFired = true; onDone(); }
      }
    }
    last = time;
    draw(time);
    if (root.isConnected) requestAnimationFrame(frame);
  }

  playBtn.addEventListener("click", () => {
    if (t >= 1) t = 0;
    playing = !playing;
    playBtn.textContent = playing ? "❚❚ Пауза" : "▶ Смотреть";
  });
  slider.addEventListener("input", () => {
    playing = false;
    playBtn.textContent = "▶ Смотреть";
    t = slider.value / 1000;
    if (t >= 0.999 && !doneFired) { doneFired = true; onDone(); }
  });

  requestAnimationFrame(frame);
  return {
    play() { t = 0; playing = true; playBtn.textContent = "❚❚ Пауза"; }
  };
}
