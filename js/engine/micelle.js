// Как мыло отмывает жир: молекулы мыла — «головастики» с водолюбивой головой и жиролюбивым хвостом.
// Хвосты втыкаются в каплю жира, головы смотрят в воду; если потереть, капля отрывается от ткани
// и уплывает в окружении молекул мыла (мицелла).
import { $, lerp, cssVar } from "../core/util.js";

const W = 560, H = 300, FLOOR = 250, TAIL = 22;

export function createMicelle(root, { onEvent = () => {} } = {}) {
  root.innerHTML = `
    <div class="micelle">
      <canvas width="${W}" height="${H}" aria-label="Капля жира на ткани в воде"></canvas>
      <div class="row">
        <button type="button" class="btn small" data-act="soap">🧼 Добавить мыло</button>
        <button type="button" class="btn small" data-act="rub">👐 Потереть</button>
        <button type="button" class="btn ghost small" data-act="reset">↻ Сначала</button>
      </div>
      <p class="micelle-msg" aria-live="polite">Жирное пятно на ткани, вокруг вода. Попробуйте потереть без мыла.</p>
    </div>`;
  const canvas = $("canvas", root);
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const msg = $(".micelle-msg", root);

  let mols, drop, progress, rubs;
  function reset() {
    mols = [];
    drop = { x: 280, y: FLOOR, rx: 70, ry: 34, lifted: 0 };
    progress = 0;
    rubs = 0;
  }
  reset();

  function targets() {
    const k = Math.round(Math.min(1, progress) * mols.length);
    mols.forEach((m, i) => {
      m.attached = i < k;
      if (!m.attached) return;
      // голова — снаружи капли, хвост смотрит к центру
      const full = drop.lifted > 0.5;
      const t = full ? (i / k) * Math.PI * 2 : Math.PI + (i + 0.5) / k * Math.PI;
      const rx = full ? 38 : drop.rx, ry = full ? 38 : drop.ry;
      const cy = full ? drop.y : FLOOR;
      m.tx = drop.x + Math.cos(t) * (rx + TAIL - 6);
      m.ty = cy + Math.sin(t) * (ry + TAIL - 6);
      m.tang = t + Math.PI;
    });
  }

  function act(a) {
    if (a === "soap") {
      if (mols.length) { msg.textContent = "Мыла уже достаточно. Потрите!"; return; }
      for (let i = 0; i < 34; i++) {
        mols.push({ x: 30 + Math.random() * (W - 60), y: 20 + Math.random() * 150, ang: Math.random() * 6.28, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, attached: false });
      }
      msg.textContent = "Молекулы мыла плавают в воде: голова (синяя) любит воду, хвост (оранжевый) — жир.";
      onEvent("soap");
    }
    if (a === "rub") {
      rubs++;
      if (!mols.length) {
        msg.textContent = rubs > 1 ? "Сколько ни три — вода скатывается с жира: им не за что ухватиться друг за друга." : "Вода не смачивает жир: пятно на месте.";
        onEvent("rub-dry");
        return;
      }
      progress += 0.5;
      if (progress >= 1 && !drop.lifted) {
        drop.lifted = 0.01;
        msg.textContent = "Хвосты облепили каплю со всех сторон. Капля оторвалась от ткани и уплыла в воду — пятно отмыто!";
        onEvent("clean");
      } else if (!drop.lifted) {
        msg.textContent = "Хвосты мыла втыкаются в жир, а головы остаются в воде. Потрите ещё!";
      }
      onEvent("rub");
    }
    if (a === "reset") {
      reset();
      msg.textContent = "Снова жирное пятно на ткани.";
    }
  }

  function step(dt) {
    if (drop.lifted) {
      drop.lifted = Math.min(1, drop.lifted + dt * 0.5);
      drop.y = lerp(FLOOR, 120, drop.lifted);
      drop.x = lerp(280, 330, drop.lifted);
    }
    targets();
    for (const m of mols) {
      if (m.attached) {
        m.x = lerp(m.x, m.tx, Math.min(1, dt * 4));
        m.y = lerp(m.y, m.ty, Math.min(1, dt * 4));
        m.ang = m.tang;
      } else {
        m.x += m.vx * dt; m.y += m.vy * dt; m.ang += dt;
        if (m.x < 20 || m.x > W - 20) m.vx *= -1;
        if (m.y < 15 || m.y > FLOOR - 30) m.vy *= -1;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(120,180,230,0.18)";
    ctx.fillRect(0, 0, W, FLOOR);
    // ткань
    ctx.fillStyle = cssVar(canvas, "--bg-2") || "#ddd";
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    for (let x = 0; x < W; x += 8) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x + 8, H); ctx.stroke(); }
    // капля жира
    ctx.fillStyle = "rgba(240,190,46,0.92)";
    ctx.beginPath();
    if (drop.lifted > 0.5) ctx.arc(drop.x, drop.y, 38, 0, Math.PI * 2);
    else ctx.ellipse(drop.x, drop.lifted ? drop.y : FLOOR, drop.rx, drop.ry, 0, Math.PI, 0);
    ctx.fill();
    if (!drop.lifted) {
      ctx.fillStyle = "#6b5d48";
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("жир", drop.x, FLOOR - 10);
    }
    // молекулы мыла
    for (const m of mols) {
      const hx = m.x, hy = m.y;
      ctx.strokeStyle = "#e08a1e";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      for (let j = 1; j <= 4; j++) {
        const d = (TAIL / 4) * j, wig = (j % 2 ? 3 : -3);
        ctx.lineTo(hx + Math.cos(m.ang) * d - Math.sin(m.ang) * wig, hy + Math.sin(m.ang) * d + Math.cos(m.ang) * wig);
      }
      ctx.stroke();
      ctx.fillStyle = "#2f7de1";
      ctx.beginPath();
      ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = "start";
  }

  let last = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    step(dt);
    draw();
    if (root.isConnected) requestAnimationFrame(frame);
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (b) act(b.dataset.act);
  });
  requestAnimationFrame(frame);
}
