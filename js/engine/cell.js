// Гальванический элемент: две пластинки разных металлов в электролите.
// Чем дальше металлы друг от друга в ряду активности, тем больше напряжение.
// Более активный металл отдаёт электроны и растворяется (он же «жертва» при коррозии).
// Режим battery — лимоны, напряжение и светодиод; режим corrosion — какой металл ржавеет.
import { $, esc, fmt } from "../core/util.js?v=28";

// «Практические» потенциалы (условно, В): разница даёт напряжение лимонной батарейки
export const METALS = {
  Mg: { name: "Магний", p: 1.6, color: "#c9ced3" },
  Zn: { name: "Цинк", p: 0.95, color: "#b9c3cc" },
  Fe: { name: "Железо", p: 0.45, color: "#8a8f94" },
  Sn: { name: "Олово", p: 0.3, color: "#d8dde2" },
  Cu: { name: "Медь", p: 0, color: "#c8803a" },
  Ag: { name: "Серебро", p: -0.1, color: "#e4e7ea" }
};
export const ELECTROLYTES = {
  lemon: { name: "Лимон", k: 1, color: "#f6e27a", note: "лимонная кислота: много ионов" },
  vinegar: { name: "Уксус", k: 1, color: "#fbf3d5", note: "уксусная кислота" },
  salt: { name: "Солёная вода", k: 0.95, color: "#cfe6fb", note: "ионы натрия и хлора" },
  sugar: { name: "Сладкая вода", k: 0.03, color: "#fff7e6", note: "сахар не даёт ионов" },
  distilled: { name: "Дистиллированная вода", k: 0.02, color: "#e9f3fb", note: "почти нет ионов" }
};
const LED_V = 1.8;

export function createCell(root, { mode = "battery", metals = Object.keys(METALS), electrolytes = Object.keys(ELECTROLYTES), maxCells = 4, start = {}, onChange = () => {} } = {}) {
  const st = { a: start.a || metals[0], b: start.b || metals[metals.length - 1], el: start.el || electrolytes[0], cells: 1 };

  const select = (k, list, dict) => `<select data-k="${k}">${list.map((id) =>
    `<option value="${id}">${esc(dict[id].name)}</option>`).join("")}</select>`;

  root.innerHTML = `
    <div class="cell">
      <div class="cell-controls">
        <label>Левая пластинка ${select("a", metals, METALS)}</label>
        <label>Правая пластинка ${select("b", metals, METALS)}</label>
        <label>${mode === "battery" ? "Во что воткнуть" : "Среда"} ${select("el", electrolytes, ELECTROLYTES)}</label>
        ${mode === "battery" ? `<label>Сколько штук подряд
          <span class="cells-k"><button type="button" class="step-btn" data-d="-1" aria-label="Меньше">−</button><output>1</output><button type="button" class="step-btn" data-d="1" aria-label="Больше">+</button></span></label>` : ""}
      </div>
      <svg class="cell-svg" viewBox="0 0 560 260" role="img" aria-label="Схема элемента"></svg>
      <p class="cell-status" aria-live="polite"></p>
    </div>`;
  root.querySelector('[data-k="a"]').value = st.a;
  root.querySelector('[data-k="b"]').value = st.b;
  root.querySelector('[data-k="el"]').value = st.el;
  const svg = $(".cell-svg", root);
  const status = $(".cell-status", root);

  function compute() {
    const pa = METALS[st.a].p, pb = METALS[st.b].p;
    const one = Math.abs(pa - pb) * ELECTROLYTES[st.el].k;
    const voltage = one * (mode === "battery" ? st.cells : 1);
    const anode = pa === pb ? null : pa > pb ? st.a : st.b;
    return { ...st, voltage, one, anode, led: mode === "battery" && voltage >= LED_V };
  }

  function draw(s) {
    const n = mode === "battery" ? s.cells : 1;
    const el = ELECTROLYTES[s.el];
    const w = 110, gap = 18, total = n * w + (n - 1) * gap;
    const x0 = (560 - total) / 2;
    let html = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (w + gap);
      // ёмкость с электролитом (лимон — овал)
      html += mode === "battery" && s.el === "lemon"
        ? `<ellipse cx="${x + w / 2}" cy="180" rx="${w / 2}" ry="48" fill="${el.color}" stroke="#c9a93a" stroke-width="2"/>`
        : `<rect x="${x}" y="140" width="${w}" height="90" rx="10" fill="${el.color}" stroke="var(--glass)" stroke-width="2"/>`;
      // пластинки
      const ca = METALS[s.a].color, cb = METALS[s.b].color;
      const dissolvingA = s.anode === s.a && s.voltage > 0.05, dissolvingB = s.anode === s.b && s.voltage > 0.05;
      html += `<rect x="${x + 22}" y="110" width="12" height="100" fill="${ca}" stroke="#555" ${dissolvingA ? 'class="anode"' : ""}/>
               <rect x="${x + w - 34}" y="110" width="12" height="100" fill="${cb}" stroke="#555" ${dissolvingB ? 'class="anode"' : ""}/>
               <text x="${x + 28}" y="104" class="cell-lbl">${s.a}</text><text x="${x + w - 28}" y="104" class="cell-lbl">${s.b}</text>`;
      // провод к следующему элементу (последовательно)
      if (i < n - 1) html += `<path d="M${x + w - 28} 110 V92 H${x + w + gap + 28} V110" class="wire"/>`;
    }
    const left = x0 + 28, right = x0 + total - 28;
    if (mode === "battery") {
      html += `<path d="M${left} 110 V40 H250" class="wire"/><path d="M310 40 H${right} V110" class="wire"/>
        <g transform="translate(280 40)">
          <circle r="22" class="led ${s.led ? "on" : ""}"/>
          <text y="5" class="cell-lbl">${s.led ? "💡" : "LED"}</text>
        </g>
        <text x="280" y="84" class="volt">${fmt(s.voltage, 2)} В</text>`;
    } else {
      html += `<path d="M${left} 110 V60 H${right} V110" class="wire"/><text x="280" y="50" class="volt">${fmt(s.voltage, 2)} В</text>`;
    }
    // электроны бегут от активного металла по проводу
    if (s.anode && s.voltage > 0.05) {
      html += `<text x="${mode === "battery" ? 205 : 280}" y="${mode === "battery" ? 32 : 30}" class="electrons">e⁻ ${s.anode === s.a ? "→" : "←"}</text>`;
    }
    svg.innerHTML = html;
  }

  function update() {
    const s = compute();
    draw(s);
    if (s.a === s.b) status.textContent = "Пластинки одинаковые — напряжения нет: электронам незачем перетекать.";
    else if (ELECTROLYTES[s.el].k < 0.1) status.textContent = `${ELECTROLYTES[s.el].name}: ${ELECTROLYTES[s.el].note}, ток почти не идёт.`;
    else if (mode === "battery") {
      status.textContent = `${fmt(s.voltage, 2)} В. ${METALS[s.anode].name} отдаёт электроны и понемногу растворяется. ` +
        (s.led ? "Светодиод горит!" : "Красному светодиоду нужно около 1,8–2 В.");
    } else {
      status.textContent = `Разрушается ${METALS[s.anode].name.toLowerCase()}: он активнее и отдаёт электроны. ${METALS[s.anode === s.a ? s.b : s.a].name} при этом защищён.`;
    }
    onChange(s);
  }

  root.addEventListener("change", (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    st[k] = e.target.value;
    update();
  });
  root.addEventListener("click", (e) => {
    const b = e.target.closest(".step-btn");
    if (!b) return;
    st.cells = Math.max(1, Math.min(maxCells, st.cells + Number(b.dataset.d)));
    $(".cells-k output", root).textContent = st.cells;
    update();
  });
  update();
}
