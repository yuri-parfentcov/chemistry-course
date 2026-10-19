// Глава 2 «Обмен электронами»: металлы отдают внешние электроны неметаллам, пока у всех
// не заполнится внешний слой. Ход — передача одного электрона или атом со склада/на склад.
// Логика (par, правила) чистая — её же использует tools/check.mjs.
import { PERIODIC } from "../../data/periodic.js?v=24";
import { shellsOf } from "../engine/atom.js?v=24";
import { $, esc, lerp, animate } from "../core/util.js?v=24";

const Z = Object.fromEntries(PERIODIC.map((e) => [e.s, e.z]));
const NAME = Object.fromEntries(PERIODIC.map((e) => [e.s, e.name]));
export const METALS = new Set(["Li", "Na", "K", "Mg", "Ca", "Al"]);
const COLOR = { Li: "#a55be0", Na: "#8a4fd6", K: "#7d3fc4", Mg: "#5fa83a", Ca: "#3e8a5c", Al: "#8a96a0", F: "#2fb39a", Cl: "#2fa84f", O: "#e0453a", S: "#c9a312", N: "#3b6fe0" };

// внешний слой: сколько в нём электронов и сколько помещается
export function outer(e) {
  const sh = shellsOf(e);
  return { n: sh[sh.length - 1] || 0, cap: sh.length === 1 ? 2 : 8 };
}
const full = (e) => { const o = outer(e); return o.n === o.cap; };
export const valence = (el) => outer(Z[el]).n;                 // сколько отдаёт металл
export const need = (el) => outer(Z[el]).cap - outer(Z[el]).n;  // сколько не хватает неметаллу

// Минимум ходов: сколько атомов каждого вида оставить на поле, чтобы электронов хватило ровно.
// Передач = сумма валентностей металлов; плюс перенос атомов со склада и на склад.
export function par(level) {
  const kinds = [...new Set([...level.board, ...Object.keys(level.stock || {})])];
  const onBoard = (el) => level.board.filter((x) => x === el).length;
  const avail = (el) => onBoard(el) + ((level.stock || {})[el] || 0);
  const movable = Boolean(level.stock);
  let best = Infinity;
  const go = (i, counts) => {
    if (i === kinds.length) {
      let give = 0, take = 0, moves = 0, metals = 0;
      kinds.forEach((el, k) => {
        const f = counts[k];
        moves += Math.abs(f - onBoard(el));
        if (METALS.has(el)) { give += f * valence(el); metals += f; } else take += f * need(el);
      });
      if (metals && give === take) best = Math.min(best, moves + give);
      return;
    }
    const el = kinds[i];
    const lo = movable ? 0 : onBoard(el), hi = movable ? avail(el) : onBoard(el);
    for (let f = lo; f <= hi; f++) go(i + 1, [...counts, f]);
  };
  go(0, []);
  return best;
}

// Формула получившегося вещества: Al₂O₃, NaCl, или список ионов, если веществ несколько
const SUB = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n) => (n > 1 ? String(n).split("").map((d) => SUB[d]).join("") : "");
const ionName = (el, q) => `${el}${q ? `${Math.abs(q) > 1 ? Math.abs(q) : ""}${q > 0 ? "⁺" : "⁻"}`.replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]) : ""}`;

export function mount(root, level, api) {
  let atoms, stock, moves, history, selected;
  let busy = false;
  const W = 600, CELL = 150;

  const reset = () => {
    let id = 0;
    atoms = level.board.map((el) => ({ id: id++, el, e: Z[el] }));
    stock = { ...(level.stock || {}) };
    moves = 0;
    history = [];
    selected = null;
    say("Нажмите на атом, который отдаст электрон, потом — на атом, который его примет.");
    draw();
  };

  root.innerHTML = `
    <div class="transfer">
      ${level.stock ? `<div class="tray store"></div>` : ""}
      <svg class="board-svg" role="application" aria-label="Поле с атомами"></svg>
      <p class="board-msg" aria-live="polite"></p>
      <p class="board-formula"></p>
    </div>`;
  const svg = $(".board-svg", root);
  const msg = $(".board-msg", root);
  function say(t) { msg.innerHTML = t; }

  // металлы — верхний ряд (отдают), неметаллы — нижний (принимают)
  const layout = () => {
    const rows = [atoms.filter((a) => METALS.has(a.el)), atoms.filter((a) => !METALS.has(a.el))].filter((r) => r.length);
    rows.forEach((row, r) => {
      const step = Math.min(CELL, W / row.length);
      const x0 = W / 2 - ((row.length - 1) * step) / 2;
      row.forEach((a, i) => { a.x = x0 + i * step; a.y = 85 + r * CELL; });
    });
    svg.setAttribute("viewBox", `0 0 ${W} ${Math.max(1, rows.length) * CELL + 20}`);
  };
  const charge = (a) => Z[a.el] - a.e;

  function atomG(a, hideOne = false) {
    const o = outer(a.e);
    const q = charge(a);
    const done = o.n === o.cap;
    const n = hideOne ? o.n - 1 : o.n;
    let dots = "";
    for (let i = 0; i < n; i++) {
      const ang = (i / Math.max(o.cap, 1)) * Math.PI * 2 - Math.PI / 2;
      dots += `<circle class="electron outer" r="7" cx="${(a.x + 52 * Math.cos(ang)).toFixed(1)}" cy="${(a.y + 52 * Math.sin(ang)).toFixed(1)}"/>`;
    }
    return `<g class="b-atom ${selected === a.id ? "sel" : ""} ${done ? "full" : ""}" data-id="${a.id}">
      <circle class="b-hit" cx="${a.x}" cy="${a.y}" r="66"/>
      <circle class="shell ${done ? "done" : ""}" cx="${a.x}" cy="${a.y}" r="52"/>
      <circle cx="${a.x}" cy="${a.y}" r="27" fill="${COLOR[a.el] || "#777"}" class="b-core"/>
      <text x="${a.x}" y="${a.y}" dy="0.35em" text-anchor="middle" class="b-sym">${a.el}</text>
      ${dots}
      <text x="${a.x}" y="${a.y + 80}" text-anchor="middle" class="b-cap">${q ? ionName(a.el, q) : "нейтр."} · ${o.n}/${o.cap}${done ? " ✓" : ""}</text>
      ${level.stock && q === 0 ? `<g class="b-del" data-del="${a.id}"><circle cx="${a.x + 48}" cy="${a.y - 50}" r="12"/><text x="${a.x + 48}" y="${a.y - 50}" dy="0.35em" text-anchor="middle">×</text></g>` : ""}
    </g>`;
  }

  function draw(hide = null) {
    layout();
    svg.innerHTML = atoms.map((a) => atomG(a, hide === a.id)).join("") + `<g class="fly"></g>`;
    if (level.stock) {
      const kinds = Object.keys(stock);
      $(".store", root).innerHTML = `<b>Склад:</b> ${kinds.length ? kinds.map((el) => `<button type="button" class="chip-btn" data-add="${el}" ${stock[el] ? "" : "disabled"}>＋ ${el} <span class="muted">(${stock[el]})</span></button>`).join("") : '<span class="muted">пусто</span>'}<span class="muted small"> · × на атоме — убрать его на склад</span>`;
    }
    // формула и победа
    const allFull = atoms.length > 0 && atoms.every((a) => full(a.e));
    const ions = {};
    atoms.forEach((a) => { ions[a.el] = (ions[a.el] || 0) + 1; });
    const ms = Object.keys(ions).filter((el) => METALS.has(el)), nm = Object.keys(ions).filter((el) => !METALS.has(el));
    const total = atoms.reduce((s, a) => s + charge(a), 0);
    let f = "";
    if (allFull && ms.length === 1 && nm.length === 1) f = `Получилось: <b>${ms[0]}${sub(ions[ms[0]])}${nm[0]}${sub(ions[nm[0]])}</b>`;
    else if (allFull) f = `Получились ионы: <b>${Object.entries(ions).map(([el, c]) => `${c > 1 ? c + " " : ""}${ionName(el, charge(atoms.find((a) => a.el === el)))}`).join(", ")}</b>`;
    $(".board-formula", root).innerHTML = atoms.length ? `${f}${f ? " · " : ""}суммарный заряд: ${total === 0 ? "0" : (total > 0 ? "+" : "−") + Math.abs(total)}` : "";
    api.moves(moves);
    if (allFull && atoms.some((a) => METALS.has(a.el))) api.win(moves);
  }

  const snapshot = () => history.push({ atoms: atoms.map((a) => ({ ...a })), stock: { ...stock }, moves });

  async function transfer(from, to) {
    // правила: отдают металлы, принимают неметаллы; заполненный слой не трогаем
    const refuse = (t) => { say(t); draw(); };
    if (!METALS.has(from.el)) return refuse(`${NAME[from.el]} не отдаёт электроны: до восьми ему не хватает ${need(from.el)}, он сам их забирает. Начните с металла.`);
    if (full(from.e)) return refuse(`У иона ${ionName(from.el, charge(from))} внешний слой уже заполнен: отдавать больше нечего, следующий электрон пришлось бы вырывать из заполненного слоя.`);
    if (METALS.has(to.el)) return refuse("Металлы электроны отдают, а не забирают. Выберите неметалл.");
    if (full(to.e)) return refuse(`У ${ionName(to.el, charge(to))} внешний слой уже заполнен — электрону некуда сесть.`);
    snapshot();
    busy = true;
    // электрон летит от донора к получателю
    draw(from.id);
    const g = $(".fly", svg);
    await animate(650, (t) => {
      const x = lerp(from.x + 52, to.x - 52, t), y = lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * 40;
      g.innerHTML = `<circle class="electron outer" r="7" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"/>`;
    });
    from.e--; to.e++;
    moves++;
    busy = false;
    selected = null;
    const q = charge(to);
    say(full(to.e) ? `${ionName(to.el, q)}: слой заполнен ✓` : `${NAME[to.el]} принял электрон. Ещё ${outer(to.e).cap - outer(to.e).n} — и слой заполнится.`);
    draw();
  }

  svg.addEventListener("click", (ev) => {
    if (busy) return;
    const del = ev.target.closest("[data-del]");
    if (del) {
      const a = atoms.find((x) => x.id === Number(del.dataset.del));
      snapshot();
      atoms = atoms.filter((x) => x !== a);
      stock[a.el] = (stock[a.el] || 0) + 1;
      moves++;
      selected = null;
      say(`${NAME[a.el]} убран на склад.`);
      return draw();
    }
    const g = ev.target.closest(".b-atom");
    if (!g) { selected = null; return draw(); }
    const a = atoms.find((x) => x.id === Number(g.dataset.id));
    if (selected === null) {
      selected = a.id;
      say(`${NAME[a.el]} выбран. Теперь нажмите на атом, который примет электрон.`);
      return draw();
    }
    if (selected === a.id) { selected = null; return draw(); }
    const from = atoms.find((x) => x.id === selected);
    selected = null;
    transfer(from, a);
  });

  root.addEventListener("click", (ev) => {
    const add = ev.target.closest("[data-add]");
    if (!add || busy) return;
    const el = add.dataset.add;
    if (!stock[el]) return;
    if (atoms.length >= 8) return say("На поле больше не помещается.");
    snapshot();
    stock[el]--;
    atoms.push({ id: Math.max(-1, ...atoms.map((a) => a.id)) + 1, el, e: Z[el] });
    moves++;
    say(`${NAME[el]} на поле.`);
    draw();
  });

  reset();
  return {
    reset,
    undo() {
      if (busy) return;
      const h = history.pop();
      if (!h) return;
      ({ atoms, stock, moves } = h);
      selected = null;
      draw();
    },
    hint() {
      const give = atoms.filter((a) => METALS.has(a.el)).reduce((s, a) => s + valence(a.el), 0);
      const take = atoms.filter((a) => !METALS.has(a.el)).reduce((s, a) => s + need(a.el), 0);
      if (give !== take) return `Металлы на поле могут отдать ${give} эл., а неметаллам нужно ${take}. ${level.stock ? "Поменяйте набор атомов: добавьте со склада или уберите лишний." : ""}`;
      const donor = atoms.find((a) => METALS.has(a.el) && !full(a.e));
      const taker = atoms.find((a) => !METALS.has(a.el) && !full(a.e));
      if (donor && taker) return `${NAME[donor.el]} может отдать ещё ${outer(donor.e).n} эл., а атому ${taker.el} не хватает ${outer(taker.e).cap - outer(taker.e).n}. Электроны одного металла можно раздать разным атомам.`;
      return "Всё сходится — осталось довести передачи до конца.";
    }
  };
}
