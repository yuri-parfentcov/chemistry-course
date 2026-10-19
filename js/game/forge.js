// Глава 1 «Сборка на заказ»: из лотка частиц собрать атомы и ионы по заказу.
// Ход — одна частица, перенесённая из лотка в атом или обратно.
// Логика (par, status) чистая — её же использует tools/check.mjs.
import { BY_Z } from "../../data/periodic.js?v=28";
import { atomMarkup, shellsOf } from "../engine/atom.js?v=28";
import { $, $$, esc } from "../core/util.js?v=28";

const KINDS = ["p", "n", "e"];
const NAMES = { p: ["протон", "протона", "протонов"], n: ["нейтрон", "нейтрона", "нейтронов"], e: ["электрон", "электрона", "электронов"] };
const LIMIT = { p: 20, n: 30, e: 24 };
export const plural = (k, x) => {
  const a = Math.abs(x) % 100, b = a % 10;
  return NAMES[k][a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2];
};

// Подходящие числа нейтронов для заказа: заданное массовое число или любой стабильный изотоп
export function neutronOptions(target) {
  if (target.A) return [target.A - target.z];
  return BY_Z[target.z].stable || [BY_Z[target.z].n];
}

// Минимум ходов: для каждого атома выбираем изотоп так, чтобы суммарно хватило лотка
export function par(level) {
  let best = Infinity;
  const choose = (i, need, cost) => {
    if (i === level.atoms.length) {
      if (KINDS.every((k) => need[k] <= level.stock[k])) best = Math.min(best, cost);
      return;
    }
    const { start, target } = level.atoms[i];
    for (const n of neutronOptions(target)) {
      const d = { p: target.z - start.p, n: n - start.n, e: target.z - target.q - start.e };
      choose(i + 1, { p: need.p + d.p, n: need.n + d.n, e: need.e + d.e }, cost + Math.abs(d.p) + Math.abs(d.n) + Math.abs(d.e));
    }
  };
  choose(0, { p: 0, n: 0, e: 0 }, 0);
  return best;
}

// Что сейчас с атомом относительно заказа
export function status(atom, target) {
  const okP = atom.p === target.z;
  const okE = atom.e === target.z - target.q;
  const stableN = neutronOptions(target).includes(atom.n);
  return { okP, okE, stableN, done: okP && okE && stableN };
}

const symbol = (z, q, A) => {
  const el = BY_Z[z];
  const ch = q ? `<sup>${Math.abs(q) > 1 ? Math.abs(q) : ""}${q > 0 ? "+" : "−"}</sup>` : "";
  return `${A ? `<sup>${A}</sup>` : ""}${el ? el.s : "?"}${ch}`;
};
// «литий» → «лития», «фтор» → «фтора», «сера» → «серы»
const gen = (name) => {
  const w = name.toLowerCase();
  return w.endsWith("й") ? w.slice(0, -1) + "я" : w.endsWith("а") ? w.slice(0, -1) + "ы" : w + "а";
};
const targetName = (t) => {
  const el = BY_Z[t.z];
  if (t.A) return `${el.name.toLowerCase()}-${t.A}`;
  return `${t.q ? "ион" : "атом"} ${gen(el.name)}`;
};

// ───── Карта ядер: по горизонтали нейтроны, по вертикали протоны ─────
// Закрашены стабильные ядра (для первых 20 элементов), пунктир — «нейтронов столько же, сколько протонов».
const MAXZ = 20, MAXN = 28, CS = 14, PAD = 26;
const stableOf = (z) => (BY_Z[z] && BY_Z[z].stable) || [];

export function stability(p, n) {
  if (!p) return { kind: "empty" };
  if (p > MAXZ) return { kind: "far" };
  const st = stableOf(p);
  if (st.includes(n)) return { kind: "stable" };
  if (p === 4 && n === 4) return { kind: "be8" };
  return { kind: n < Math.min(...st) ? "few" : "many", need: st };
}

function nuclideChart(p, n, targetZ) {
  const X = (nn) => PAD + nn * CS, Y = (z) => PAD / 2 + (MAXZ - z) * CS;
  let html = "";
  // строка нужного элемента
  if (targetZ <= MAXZ) html += `<rect x="${X(0)}" y="${Y(targetZ)}" width="${(MAXN + 1) * CS}" height="${CS}" class="nuc-row"/>`;
  for (let z = 1; z <= MAXZ; z++) {
    for (const nn of stableOf(z)) html += `<rect x="${X(nn) + 1}" y="${Y(z) + 1}" width="${CS - 2}" height="${CS - 2}" rx="2" class="nuc-stable"/>`;
    if (z % 2 === 1 || z === targetZ) html += `<text x="${PAD - 4}" y="${Y(z) + CS / 2}" dy="0.35em" text-anchor="end" class="nuc-axis">${BY_Z[z].s}</text>`;
  }
  for (let nn = 0; nn <= MAXN; nn += 4) html += `<text x="${X(nn) + CS / 2}" y="${Y(0) + 6}" text-anchor="middle" class="nuc-axis">${nn}</text>`;
  html += `<line x1="${X(1)}" y1="${Y(1)}" x2="${X(MAXZ + 1)}" y2="${Y(MAXZ + 1)}" class="nuc-diag"/>`;
  html += `<text x="${X(MAXN + 1)}" y="${Y(0) + 18}" text-anchor="end" class="nuc-axis">нейтроны →</text>`;
  html += `<text x="${X(0)}" y="${PAD / 2 - 3}" class="nuc-axis">↑ протоны</text>`;
  html += `<text x="${X(2)}" y="${Y(16)}" class="nuc-zone">мало нейтронов:</text><text x="${X(2)}" y="${Y(15)}" class="nuc-zone">протоны расталкивают</text>`;
  html += `<text x="${X(MAXN)}" y="${Y(2)}" text-anchor="end" class="nuc-zone">много нейтронов:</text><text x="${X(MAXN)}" y="${Y(1)}" text-anchor="end" class="nuc-zone">нейтрон станет протоном</text>`;
  const s = stability(p, n);
  if (p >= 1 && p <= MAXZ && n <= MAXN) html += `<circle cx="${X(n) + CS / 2}" cy="${Y(p) + CS / 2}" r="${CS * 0.62}" class="nuc-dot ${s.kind}"/>`;
  const el = BY_Z[p];
  const NOTES = {
    empty: "Добавьте протон — на карте появится точка вашего ядра.",
    far: "Ядро вышло за пределы карты (на ней первые 20 элементов).",
    stable: `✓ Точка в закрашенной полосе: ядро ${el ? el.s : ""}-${p + n} стабильно.`,
    be8: "Бериллий-8 — особый случай: нейтронов поровну с протонами, но ядру выгоднее развалиться на два очень прочных ядра гелия-4. Стабилен только бериллий-9.",
    few: `Нейтронов мало: протоны расталкивают ядро. Такое ядро избавится от лишнего плюса — один протон превратится в нейтрон. Стабильно при ${s.need ? s.need.join(" или ") : ""} нейтр.`,
    many: `Нейтронов слишком много: лишнему нейтрону выгоднее превратиться в протон (так распадается, например, углерод-14). Стабильно при ${s.need ? s.need.join(" или ") : ""} нейтр.`
  };
  return { html, viewBox: `0 0 ${X(MAXN + 1) + 4} ${Y(0) + 24}`, note: NOTES[s.kind] };
}

export function mount(root, level, api) {
  let atoms, tray, moves, history;
  const reset = () => {
    atoms = level.atoms.map((a) => ({ ...a.start }));
    tray = { ...level.stock };
    moves = 0;
    history = [];
    draw();
  };

  root.innerHTML = `
    <div class="forge">
      <div class="tray" aria-live="polite"></div>
      <div class="forge-atoms">${level.atoms.map((a, i) => `
        <div class="forge-atom card" data-i="${i}">
          <p class="order">Заказ${level.atoms.length > 1 ? ` ${i + 1}` : ""}: <b class="order-sym">${symbol(a.target.z, a.target.q, a.target.A)}</b> <span class="muted">— ${targetName(a.target)}</span></p>
          <svg class="atom-svg forge-svg" role="img" aria-label="Атом"></svg>
          <p class="forge-status"></p>
          <details class="nuc-map" open>
            <summary>Карта ядер: где ваше ядро</summary>
            <svg class="nuc-svg" role="img" aria-label="Карта ядер: протоны и нейтроны"></svg>
            <p class="nuc-note"></p>
          </details>
          <div class="atom-controls">${KINDS.map((k) => `
            <div class="atom-row" data-k="${k}">
              <span class="atom-part ${k}"></span>
              <span class="atom-label"><b>${{ p: "Протоны", n: "Нейтроны", e: "Электроны" }[k]}</b></span>
              <button type="button" class="step-btn" data-d="-1" aria-label="убрать: ${NAMES[k][0]}">−</button>
              <output class="atom-count">0</output>
              <button type="button" class="step-btn" data-d="1" aria-label="добавить: ${NAMES[k][0]}">+</button>
            </div>`).join("")}
          </div>
        </div>`).join("")}
      </div>
    </div>`;

  function draw() {
    $(".tray", root).innerHTML = `<b>Лоток:</b> ${KINDS.map((k) => `<span class="tray-item ${k}"><span class="atom-part ${k}"></span>${tray[k]} ${plural(k, tray[k])}</span>`).join("")}`;
    let allDone = true;
    atoms.forEach((a, i) => {
      const card = root.querySelector(`.forge-atom[data-i="${i}"]`);
      const t = level.atoms[i].target;
      const { html, viewBox } = atomMarkup(a);
      const svg = $("svg", card);
      svg.innerHTML = html;
      svg.setAttribute("viewBox", viewBox);
      KINDS.forEach((k) => {
        const row = card.querySelector(`.atom-row[data-k="${k}"]`);
        $(".atom-count", row).textContent = a[k];
        row.querySelector('[data-d="1"]').disabled = tray[k] <= 0 || a[k] >= LIMIT[k];
        row.querySelector('[data-d="-1"]').disabled = a[k] <= 0;
      });
      const chart = nuclideChart(a.p, a.n, t.z);
      const nsvg = $(".nuc-svg", card);
      nsvg.innerHTML = chart.html;
      nsvg.setAttribute("viewBox", chart.viewBox);
      $(".nuc-note", card).innerHTML = chart.note;
      const st = status(a, t);
      if (!st.done) allDone = false;
      const el = BY_Z[a.p];
      const q = a.p - a.e;
      // ⁶Li — литий-6: 3 протона + 3 нейтрона (массовое число = протоны + нейтроны)
      const mass = el ? ` — ${el.name.toLowerCase()}-${a.p + a.n}: ${a.p} ${plural("p", a.p)} + ${a.n} ${plural("n", a.n)}` : "";
      const now = a.p ? `Сейчас: <b>${symbol(a.p, q, a.p + a.n)}</b>${mass}` : "Пока пусто";
      let msg;
      if (st.done) msg = `✓ Готово: <b>${symbol(t.z, t.q, a.p + a.n)}</b>${mass}`;
      else if (st.okP && st.okE) msg = `⚠ ${now}. Ядро <b>${symbol(a.p, 0, a.p + a.n)}</b> нестабильно — такой атом распадётся. Подберите число нейтронов.`;
      else msg = now;
      const s = $(".forge-status", card);
      s.innerHTML = msg;
      s.className = `forge-status ${st.done ? "ok" : st.okP && st.okE ? "warn" : ""}`;
      card.classList.toggle("done", st.done);
    });
    api.moves(moves);
    if (allDone) api.win(moves);
  }

  root.addEventListener("click", (ev) => {
    const b = ev.target.closest(".step-btn");
    if (!b || b.disabled) return;
    const i = Number(b.closest(".forge-atom").dataset.i);
    const k = b.closest(".atom-row").dataset.k;
    const d = Number(b.dataset.d);
    history.push({ atoms: atoms.map((a) => ({ ...a })), tray: { ...tray }, moves });
    atoms[i][k] += d;
    tray[k] -= d;
    moves++;
    draw();
  });

  reset();
  return {
    reset,
    undo() {
      const h = history.pop();
      if (!h) return;
      ({ atoms, tray, moves } = h);
      draw();
    },
    hint() {
      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i], t = level.atoms[i].target;
        if (status(a, t).done) continue;
        const who = atoms.length > 1 ? `Атому ${i + 1}` : "Атому";
        if (a.p !== t.z) return `${who} нужно ${t.z} ${plural("p", t.z)}: число протонов задаёт элемент (сейчас ${a.p}).`;
        const needE = t.z - t.q;
        if (a.e !== needE) return `Заряд = протоны − электроны. Для заряда ${t.q > 0 ? "+" : ""}${t.q} нужно ${needE} ${plural("e", needE)} (сейчас ${a.e}).`;
        const opts = neutronOptions(t);
        return `Чтобы ядро было стабильным, нейтронов должно быть ${opts.join(" или ")} (сейчас ${a.n}).`;
      }
      return "Всё уже готово!";
    }
  };
}
