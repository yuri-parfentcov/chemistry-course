// Конструктор атома: протоны, нейтроны, электроны → какой это элемент, ион или изотоп.
// Рядом мини-таблица Менделеева: в ней подсвечивается собранный атом, клик по клетке — справка.
import { PERIODIC, BY_Z, ISOTOPE_NOTES } from "../../data/periodic.js?v=13";
import { $, esc } from "../core/util.js?v=13";

const SHELLS = [2, 8, 8, 18];           // упрощённая схема заполнения для первых 20 элементов
const SHELL_R = [62, 98, 134, 166];
const MAX = 20;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function shellsOf(e) {
  const out = [];
  let left = e;
  for (const cap of SHELLS) {
    if (left <= 0) break;
    out.push(Math.min(cap, left));
    left -= cap;
  }
  return out;
}

export function createAtom(root, { start = { p: 1, n: 0, e: 1 }, table = true, onChange = () => {} } = {}) {
  const st = { ...start, clicked: null };
  root.innerHTML = `
    <div class="atom-lab">
      <div class="atom-view">
        <svg viewBox="-180 -180 360 360" class="atom-svg" role="img" aria-label="Модель атома"></svg>
      </div>
      <div class="atom-side">
        <div class="atom-controls">
          ${[["p", "Протоны", "в ядре, заряд +"], ["n", "Нейтроны", "в ядре, без заряда"], ["e", "Электроны", "вокруг ядра, заряд −"]].map(([k, name, hint]) => `
            <div class="atom-row" data-k="${k}">
              <span class="atom-part ${k}"></span>
              <span class="atom-label"><b>${name}</b><small>${hint}</small></span>
              <button type="button" class="step-btn" data-d="-1" aria-label="${name}: убрать">−</button>
              <output class="atom-count">0</output>
              <button type="button" class="step-btn" data-d="1" aria-label="${name}: добавить">+</button>
            </div>`).join("")}
        </div>
        <div class="atom-info" aria-live="polite"></div>
      </div>
    </div>
    ${table ? `<div class="ptable-wrap"><p class="muted small">Таблица Менделеева (первые 4 ряда). Нажмите на клетку, чтобы узнать об элементе.</p><div class="ptable"></div><div class="ptable-info" aria-live="polite"></div></div>` : ""}`;

  const svg = $(".atom-svg", root);
  const info = $(".atom-info", root);

  function drawAtom() {
    const shells = shellsOf(st.e);
    const outer = shells.length - 1;
    let html = "";
    SHELL_R.slice(0, Math.max(1, shells.length)).forEach((r) => {
      html += `<circle r="${r}" class="shell"/>`;
    });
    shells.forEach((count, si) => {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2 + si * 0.4;
        html += `<circle class="electron ${si === outer ? "outer" : ""}" r="7" cx="${(SHELL_R[si] * Math.cos(a)).toFixed(1)}" cy="${(SHELL_R[si] * Math.sin(a)).toFixed(1)}"/>`;
      }
    });
    // ядро: частицы по спирали подсолнуха, протоны и нейтроны вперемешку
    const total = st.p + st.n;
    const parts = [];
    let placedP = 0;
    for (let i = 0; i < total; i++) {
      // равномерно перемешиваем: протон, если их пока «недостаёт» до нужной доли
      const isP = placedP < st.p && (placedP + 1) / (i + 1) <= st.p / total + 1e-9;
      const last = total - i === st.p - placedP;
      if (isP || last) { parts.push("p"); placedP++; } else parts.push("n");
    }
    parts.forEach((k, i) => {
      const r = 5.2 * Math.sqrt(i + 0.5);
      const a = i * GOLDEN;
      html += `<circle class="nucleon ${k}" r="6.5" cx="${(r * Math.cos(a)).toFixed(1)}" cy="${(r * Math.sin(a)).toFixed(1)}"/>`;
    });
    svg.innerHTML = html;
    // приближаем «камеру», чтобы маленький атом не терялся
    const R = SHELL_R[Math.max(0, shells.length - 1)] + 22;
    svg.setAttribute("viewBox", `${-R} ${-R} ${2 * R} ${2 * R}`);
  }

  function describe() {
    const el = BY_Z[st.p];
    const charge = st.p - st.e;
    const A = st.p + st.n;
    const shells = shellsOf(st.e);
    const outer = shells.length ? shells[shells.length - 1] : 0;
    let iso = "";
    if (el && el.stable) {
      const note = ISOTOPE_NOTES[`${st.p}-${st.n}`];
      if (note) iso = note;
      else if (st.n === el.n) iso = "Самый распространённый, стабильный вариант ядра.";
      else if (el.stable.includes(st.n)) iso = "Редкий, но стабильный изотоп.";
      else iso = "Такое ядро нестабильно и быстро распадётся. Подберите число нейтронов.";
    }
    const chargeText = charge === 0 ? "0 — нейтральный атом"
      : `${charge > 0 ? "+" : "−"}${Math.abs(charge)} — это ион: ${charge > 0 ? "электронов меньше, чем протонов" : "электронов больше, чем протонов"}`;
    info.innerHTML = el ? `
      <div class="atom-name"><span class="big-symbol">${el.s}${charge ? `<sup>${Math.abs(charge) > 1 ? Math.abs(charge) : ""}${charge > 0 ? "+" : "−"}</sup>` : ""}</span>
        <span><b>${esc(el.name)}</b><small>№ ${el.z} в таблице</small></span></div>
      <dl>
        <dt>Массовое число</dt><dd>${A} <small>(протоны + нейтроны)</small></dd>
        <dt>Заряд</dt><dd>${chargeText}</dd>
        <dt>Внешних электронов</dt><dd>${outer}${outer && st.p <= 20 ? (outer <= 2 && st.e > 2 ? " — легко отдаёт их" : outer >= 6 ? " — охотно забирает чужие" : "") : ""}</dd>
      </dl>
      ${iso ? `<p class="iso">${esc(iso)}</p>` : ""}`
      : `<p>Без протонов это не атом. Добавьте протон: <b>число протонов определяет элемент</b>.</p>`;
    root.querySelectorAll(".atom-row").forEach((row) => { $(".atom-count", row).textContent = st[row.dataset.k]; });
    root.querySelectorAll(".pt-cell").forEach((c) => c.classList.toggle("now", Number(c.dataset.z) === st.p));
  }

  function update() {
    drawAtom();
    describe();
    onChange({ ...st });
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest(".step-btn");
    if (b) {
      const k = b.closest(".atom-row").dataset.k;
      const limit = k === "n" ? 30 : MAX;
      st[k] = Math.max(0, Math.min(limit, st[k] + Number(b.dataset.d)));
      update();
    }
    const cell = e.target.closest(".pt-cell");
    if (cell) {
      const el = BY_Z[Number(cell.dataset.z)];
      st.clicked = el.s;
      root.querySelectorAll(".pt-cell").forEach((c) => c.classList.toggle("picked", c === cell));
      $(".ptable-info", root).innerHTML = `<b>${el.s} — ${esc(el.name)}</b> · № ${el.z} · ${String(el.mass).replace(".", ",")} г/моль<br>${esc(el.use)}`;
      onChange({ ...st });
    }
  });

  if (table) {
    $(".ptable", root).innerHTML = PERIODIC.map((el) =>
      `<button type="button" class="pt-cell" data-z="${el.z}" style="grid-row:${el.pos[0]};grid-column:${el.pos[1]}" title="${esc(el.name)}"><small>${el.z}</small>${el.s}</button>`).join("");
  }
  update();
  return { state: st };
}
