// Смеситель растворов: сколько взять концентрата (или чистого вещества) и сколько воды.
// Ползунки меняют количества, стакан показывает объём и насыщенность цвета,
// табло — массу вещества и концентрацию. extra(состояние) — дополнительная строка табло
// (например, температура замерзания антифриза).
import { $, esc, fmt, clamp } from "../core/util.js?v=11";

// cfg: { stock: { name, c, color, max, step }, water: { name, max, step }, unit: "г" | "мл" | "л",
//        extra?: (st) => html }
export function createMixer(root, cfg, { onChange = () => {} } = {}) {
  const { stock, water, unit } = cfg;
  const st = { stock: 0, water: 0 };

  root.innerHTML = `
    <div class="mixer">
      <div class="mix-controls">
        ${[["stock", stock], ["water", water]].map(([k, s]) => `
          <label class="mix-row" data-k="${k}">
            <span class="mix-name"><i class="dot" style="background:${k === "stock" ? stock.color : "#cfe6fb"}"></i><b>${esc(s.name)}</b>${k === "stock" && stock.c < 100 ? ` <small>(${fmt(stock.c, 1)} %)</small>` : ""}</span>
            <input type="range" min="0" max="${s.max}" step="${s.step}" value="0" aria-label="${esc(s.name)}">
            <span class="mix-num"><input type="number" min="0" max="${s.max}" step="${s.step}" value="0" inputmode="decimal" aria-label="${esc(s.name)}, ${unit}"> ${unit}</span>
          </label>`).join("")}
      </div>
      <div class="mix-view">
        <svg viewBox="0 0 160 200" class="mix-svg" aria-hidden="true">
          <rect class="mix-liquid" x="22" width="116" rx="0"/>
          <path class="mix-glass" d="M18 12 V182 Q18 194 30 194 H130 Q142 194 142 182 V12"/>
        </svg>
        <div class="mix-board" aria-live="polite"></div>
      </div>
    </div>`;

  const liquid = $(".mix-liquid", root);
  const board = $(".mix-board", root);
  const capacity = stock.max + water.max;

  function update() {
    const total = st.stock + st.water;
    const solute = st.stock * stock.c / 100;
    const c = total ? (solute / total) * 100 : 0;
    // уровень и насыщенность цвета
    const h = total ? 8 + (176 * total) / capacity : 0;
    liquid.setAttribute("y", 194 - h);
    liquid.setAttribute("height", h);
    liquid.setAttribute("fill", stock.color);
    liquid.setAttribute("fill-opacity", (0.12 + 0.88 * clamp(c / Math.max(stock.c, 1))).toFixed(3));
    const s = { ...st, total, solute, c };
    board.innerHTML = `
      <div><span>Всего</span><b>${fmt(total, 2)} ${unit}</b></div>
      <div><span>Вещества</span><b>${fmt(solute, 2)} ${unit}</b></div>
      <div class="mix-c"><span>Концентрация</span><b>${fmt(c, 2)} %</b></div>
      ${cfg.extra ? cfg.extra(s) : ""}`;
    onChange(s);
  }

  root.addEventListener("input", (e) => {
    const row = e.target.closest(".mix-row");
    if (!row) return;
    const k = row.dataset.k;
    const v = clamp(Number(e.target.value) || 0, 0, cfg[k].max);
    st[k] = v;
    row.querySelectorAll("input").forEach((inp) => { if (inp !== e.target) inp.value = v; });
    update();
  });
  update();
}
