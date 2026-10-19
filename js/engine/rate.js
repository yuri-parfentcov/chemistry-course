// Симулятор скорости реакции: частицы A и B летают в коробке, при удачном столкновении
// превращаются в продукт. Скорость считается по закону Аррениуса (энергия активации ≈ 50 кДж/моль:
// примерно вдвое быстрее на каждые +10 °C), катализатор ускоряет в 8 раз.
// Анимация показывает то же самое: частицы летают быстрее, вспышки реакций чаще.
import { $, esc, fmt, cssVar, reducedMotion } from "../core/util.js?v=22";

const W = 560, H = 300;
const EA_R = 50000 / 8.314;
const BASE_T = 293;

export function relRate({ T, conc, catalyst }) {
  const k = Math.exp(EA_R * (1 / BASE_T - 1 / (T + 273)));
  return k * (conc / 20) ** 2 * (catalyst ? 8 : 1);
}

// cfg: { labels: { a, b, product }, presets: [{ t, label }], catalystName, tMin, tMax }
export function createRate(root, cfg, { onChange = () => {} } = {}) {
  const st = { T: 20, conc: 20, catalyst: false };
  const { labels } = cfg;
  root.innerHTML = `
    <div class="rate">
      <canvas width="${W}" height="${H}" aria-label="Частицы в реакции"></canvas>
      <div class="rate-board" aria-live="polite"></div>
      <div class="rate-controls">
        <label><span>🌡️ Температура: <b class="t-out">20 °C</b></span>
          <input type="range" data-k="T" min="${cfg.tMin ?? -20}" max="${cfg.tMax ?? 80}" step="1" value="20"></label>
        ${cfg.presets ? `<div class="presets">${cfg.presets.map((p) => `<button type="button" class="btn ghost small" data-t="${p.t}">${esc(p.label)}</button>`).join("")}</div>` : ""}
        <label><span>🧪 Концентрация: <b class="c-out">20</b> частиц каждого вида</span>
          <input type="range" data-k="conc" min="4" max="40" step="1" value="20"></label>
        ${cfg.catalystName ? `<label class="cat"><input type="checkbox" data-k="catalyst"> Добавить катализатор: ${esc(cfg.catalystName)}</label>` : ""}
      </div>
      <p class="rate-legend"><span><i class="dot" style="background:#e0453a"></i>${esc(labels.a)}</span><span><i class="dot" style="background:#3b6fe0"></i>${esc(labels.b)}</span><span><i class="dot" style="background:#9b5de5"></i>${esc(labels.product)}</span></p>
    </div>`;

  const canvas = $("canvas", root);
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const board = $(".rate-board", root);

  let parts = [];
  let flashes = [];
  let products = [];
  let acc = 0;

  const speed = () => 40 * Math.sqrt((st.T + 273) / BASE_T) ** 3;   // визуально заметнее, чем в жизни
  function spawn(kind) {
    const a = Math.random() * Math.PI * 2;
    const v = speed() * (0.5 + Math.random());
    return { kind, x: 20 + Math.random() * (W - 40), y: 20 + Math.random() * (H - 40), vx: Math.cos(a) * v, vy: Math.sin(a) * v };
  }
  function populate() {
    const want = { a: st.conc, b: st.conc };
    for (const k of ["a", "b"]) {
      const have = parts.filter((p) => p.kind === k);
      if (have.length > want[k]) parts = parts.filter((p) => p.kind !== k).concat(have.slice(0, want[k]));
      else for (let i = have.length; i < want[k]; i++) parts.push(spawn(k));
    }
  }
  function rescaleSpeed() {
    const target = speed();
    for (const p of parts) {
      const v = Math.hypot(p.vx, p.vy) || 1;
      const nv = target * (0.5 + Math.random());
      p.vx *= nv / v; p.vy *= nv / v;
    }
  }

  function update() {
    const r = relRate(st);
    $(".t-out", root).textContent = `${st.T} °C`;
    $(".c-out", root).textContent = st.conc;
    board.innerHTML = `<span>Скорость реакции</span><b>${r >= 10 ? fmt(r, 0) : fmt(r, 2)} ×</b><small>относительно 20 °C без катализатора</small>`;
    onChange({ ...st, rate: r });
  }

  function step(dt) {
    for (const p of parts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 8 || p.x > W - 8) { p.vx *= -1; p.x = Math.max(8, Math.min(W - 8, p.x)); }
      if (p.y < 8 || p.y > H - 8) { p.vy *= -1; p.y = Math.max(8, Math.min(H - 8, p.y)); }
    }
    // реакции: столько, сколько велит скорость (в среднем ~1,5 в секунду при «1×»)
    acc += relRate(st) * 1.5 * dt;
    while (acc >= 1) {
      acc -= 1;
      const A = parts.filter((p) => p.kind === "a"), B = parts.filter((p) => p.kind === "b");
      if (!A.length || !B.length) break;
      const a = A[Math.floor(Math.random() * A.length)];
      let best = B[0], bd = Infinity;
      for (const b of B) { const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < bd) { bd = d; best = b; } }
      const x = (a.x + best.x) / 2, y = (a.y + best.y) / 2;
      flashes.push({ x, y, life: 0.5 });
      products.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 2.5 });
      // реагенты «подвозятся» снова — концентрация остаётся постоянной
      Object.assign(a, spawn("a"));
      Object.assign(best, spawn("b"));
    }
    flashes.forEach((f) => { f.life -= dt; });
    flashes = flashes.filter((f) => f.life > 0);
    products.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    products = products.filter((p) => p.life > 0).slice(-80);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = cssVar(canvas, "--glass") || "#889";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
    if (st.catalyst) {
      ctx.fillStyle = "rgba(160,160,170,0.35)";
      ctx.fillRect(0, H - 14, W, 14);
    }
    const dot = (x, y, r, c, a = 1) => { ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; };
    for (const p of products) dot(p.x, p.y, 6, "#9b5de5", Math.min(1, p.life));
    for (const p of parts) dot(p.x, p.y, 6, p.kind === "a" ? "#e0453a" : "#3b6fe0");
    for (const f of flashes) dot(f.x, f.y, 16 * (1 - f.life * 1.5) + 6, "#f0b24a", f.life * 1.6);
  }

  let last = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    if (!reducedMotion()) step(dt);
    draw();
    if (root.isConnected) requestAnimationFrame(frame);
  }

  root.addEventListener("input", (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    st[k] = k === "catalyst" ? e.target.checked : Number(e.target.value);
    if (k === "conc") populate();
    if (k === "T") rescaleSpeed();
    update();
  });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    st.T = Number(b.dataset.t);
    $('[data-k="T"]', root).value = st.T;
    rescaleSpeed();
    update();
  });

  populate();
  update();
  requestAnimationFrame(frame);
}
