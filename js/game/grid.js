// Глава 3 «Молекулы на поле» (по мотивам Sokobond): двигаете свой атом по клеткам,
// соседние атомы со свободными «руками» связываются сами. Связь не разорвать — только отменить ход.
// Связанная молекула ездит целиком и толкает другие атомы. Уровень пройден, когда у вашей
// молекулы заняты все руки и это нужное вещество.
// Логика и решатель (поиск в ширину) чистые — их же использует tools/check.mjs.
import { ELEMENTS } from "../../data/elements.js?v=26";
import { MOLECULE_BY_KEY, compositionKey } from "../../data/molecules.js?v=26";
import { countAtoms } from "../engine/formula.js?v=26";
import { $, esc } from "../core/util.js?v=26";

const LETTER = { h: "H", o: "O", n: "N", c: "C", l: "Cl" };
const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const ORDER = [[0, -1], [1, 0], [0, 1], [-1, 0]];

// Карта уровня: # стена, . пол, буквы — атомы (h o n c l), заглавная — ваш атом
export function parse(level) {
  const walls = new Set();
  const atoms = [];
  let player = -1;
  level.map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === "#" || ch === " ") walls.add(`${x},${y}`);
    const el = LETTER[ch.toLowerCase()];
    if (el) {
      if (ch !== ch.toLowerCase()) player = atoms.length;
      atoms.push({ el, x, y });
    }
  }));
  const w = Math.max(...level.map.map((r) => r.length)), h = level.map.length;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x >= level.map[y].length) walls.add(`${x},${y}`);
  return { w, h, walls, els: atoms.map((a) => a.el), player, start: { pos: atoms.map((a) => [a.x, a.y]), bonds: [] } };
}

const key2 = (i, j) => (i < j ? `${i}-${j}` : `${j}-${i}`);
const hands = (els, bonds, i) => (ELEMENTS[els[i]].valence || 0) - bonds.filter((b) => b[0] === i || b[1] === i).length;

// Атомы, связанные с i (вся молекула)
export function molecule(bonds, i) {
  const seen = new Set([i]);
  const stack = [i];
  while (stack.length) {
    const a = stack.pop();
    for (const [p, q] of bonds) {
      const o = p === a ? q : q === a ? p : -1;
      if (o >= 0 && !seen.has(o)) { seen.add(o); stack.push(o); }
    }
  }
  return [...seen];
}

// Новые связи: соседи по стороне, у обоих есть свободная рука. Порядок — сверху вниз, слева направо.
function bondUp(g, st) {
  const bonds = st.bonds.slice();
  const have = new Set(bonds.map(([p, q]) => key2(p, q)));
  const at = new Map(st.pos.map(([x, y], i) => [`${x},${y}`, i]));
  const order = st.pos.map((p, i) => i).sort((a, b) => st.pos[a][1] - st.pos[b][1] || st.pos[a][0] - st.pos[b][0]);
  const made = [];
  for (const i of order) {
    for (const [dx, dy] of ORDER) {
      const j = at.get(`${st.pos[i][0] + dx},${st.pos[i][1] + dy}`);
      if (j === undefined || have.has(key2(i, j))) continue;
      if (hands(g.els, bonds, i) > 0 && hands(g.els, bonds, j) > 0) {
        bonds.push(i < j ? [i, j] : [j, i]);
        have.add(key2(i, j));
        made.push([i, j]);
      }
    }
  }
  return { st: { pos: st.pos, bonds }, made };
}

// Ход: молекула игрока сдвигается и толкает всё, во что упирается. null — если упёрлись в стену.
export function move(g, st, dir) {
  const [dx, dy] = DIRS[dir];
  const at = new Map(st.pos.map(([x, y], i) => [`${x},${y}`, i]));
  const moving = new Set(molecule(st.bonds, g.player));
  const queue = [...moving];
  while (queue.length) {
    const i = queue.pop();
    const nx = st.pos[i][0] + dx, ny = st.pos[i][1] + dy;
    if (g.walls.has(`${nx},${ny}`)) return null;
    const j = at.get(`${nx},${ny}`);
    if (j !== undefined && !moving.has(j)) for (const k of molecule(st.bonds, j)) if (!moving.has(k)) { moving.add(k); queue.push(k); }
  }
  const pos = st.pos.map((p, i) => (moving.has(i) ? [p[0] + dx, p[1] + dy] : p));
  return bondUp(g, { pos, bonds: st.bonds });
}

// Состояние молекулы игрока: собрана ли, и что это
export function verdict(g, st, target) {
  const mol = molecule(st.bonds, g.player);
  const free = mol.reduce((s, i) => s + hands(g.els, st.bonds, i), 0);
  if (free > 0) return { full: false, free };
  const counts = {};
  mol.forEach((i) => { counts[g.els[i]] = (counts[g.els[i]] || 0) + 1; });
  const want = countAtoms(target);
  const same = compositionKey(counts) === compositionKey(want);
  const m = MOLECULE_BY_KEY[compositionKey(counts)];
  let shapeOk = true;
  if (same && m && m.heavy) {
    const sig = mol.filter((i) => g.els[i] !== "H").map((i) => {
      const nb = st.bonds.filter((b) => b[0] === i || b[1] === i).map((b) => g.els[b[0] === i ? b[1] : b[0]]).sort().join("");
      return `${g.els[i]}:${nb}`;
    }).sort().join(" ");
    shapeOk = sig === [...m.heavy].sort().join(" ");
  }
  return { full: true, win: same && shapeOk, molecule: m, counts, isomer: same && !shapeOk };
}

const hash = (st) => st.pos.map((p) => p.join(",")).join(";") + "|" + st.bonds.map((b) => b.join("-")).sort().join(",");

// Кратчайшее решение (число ходов) или Infinity
export function solve(level, limit = 300000) {
  const g = parse(level);
  const start = bondUp(g, g.start).st;
  const seen = new Set([hash(start)]);
  let frontier = [start];
  for (let depth = 0; frontier.length && seen.size < limit; depth++) {
    const next = [];
    for (const st of frontier) {
      const v = verdict(g, st, level.target);
      if (v.win) return depth;
      if (v.full) continue;                          // молекула замкнулась не та — тупик
      for (const dir of Object.keys(DIRS)) {
        const r = move(g, st, dir);
        if (!r) continue;
        const h = hash(r.st);
        if (!seen.has(h)) { seen.add(h); next.push(r.st); }
      }
    }
    frontier = next;
  }
  return Infinity;
}
// норма записана в данных уровня (решатель долгий), tools/check.mjs сверяет её с решателем
export const par = (level) => level.par ?? solve(level);

// ───────────────────────── интерфейс ─────────────────────────
const CELL = 64;
const sym = (el) => el;

export function mount(root, level, api) {
  const g = parse(level);
  let st, moves, history;
  root.innerHTML = `
    <div class="grid-game">
      <p class="grid-target">Цель: <b>${esc(level.targetName)}</b> <span class="muted">${esc(level.target.replace(/(\d+)/g, (d) => d.split("").map((c) => "₀₁₂₃₄₅₆₇₈₉"[c]).join("")))}</span></p>
      <svg class="grid-svg" viewBox="0 0 ${g.w * CELL} ${g.h * CELL}" role="application" aria-label="Поле: стрелки двигают ваш атом" tabindex="0"></svg>
      <div class="dpad" aria-label="Движение">
        <button type="button" class="btn ghost" data-dir="up" aria-label="Вверх">↑</button>
        <button type="button" class="btn ghost" data-dir="left" aria-label="Влево">←</button>
        <button type="button" class="btn ghost" data-dir="down" aria-label="Вниз">↓</button>
        <button type="button" class="btn ghost" data-dir="right" aria-label="Вправо">→</button>
      </div>
      <p class="board-msg" aria-live="polite"></p>
    </div>`;
  const svg = $(".grid-svg", root);
  const msg = $(".board-msg", root);

  function draw() {
    let html = "";
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const wall = g.walls.has(`${x},${y}`);
      const outside = wall && (level.map[y] || "")[x] === " " || x >= (level.map[y] || "").length;
      if (outside) continue;
      html += `<rect x="${x * CELL + 1}" y="${y * CELL + 1}" width="${CELL - 2}" height="${CELL - 2}" rx="8" class="${wall ? "g-wall" : "g-floor"}"/>`;
    }
    const mine = new Set(molecule(st.bonds, g.player));
    const c = (i) => [st.pos[i][0] * CELL + CELL / 2, st.pos[i][1] * CELL + CELL / 2];
    for (const [i, j] of st.bonds) {
      const [x1, y1] = c(i), [x2, y2] = c(j);
      html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="g-bond ${mine.has(i) ? "mine" : ""}"/>`;
    }
    st.pos.forEach((p, i) => {
      const [x, y] = c(i);
      const el = ELEMENTS[g.els[i]];
      const free = hands(g.els, st.bonds, i);
      let dots = "";
      for (let k = 0; k < free; k++) {
        const a = -Math.PI / 2 + (k - (free - 1) / 2) * 0.7;
        dots += `<circle class="g-hand" r="4.5" cx="${(x + 24 * Math.cos(a)).toFixed(1)}" cy="${(y + 24 * Math.sin(a)).toFixed(1)}"/>`;
      }
      html += `<g class="g-atom ${i === g.player ? "player" : ""} ${mine.has(i) ? "mine" : ""}">
        ${i === g.player ? `<circle cx="${x}" cy="${y}" r="27" class="g-ring"/>` : ""}
        <circle cx="${x}" cy="${y}" r="20" fill="${el.color}" class="g-ball"/>
        <text x="${x}" y="${y}" dy="0.35em" text-anchor="middle" fill="${el.ink}" class="g-sym">${sym(g.els[i])}</text>
        ${dots}</g>`;
    });
    svg.innerHTML = html;
    api.moves(moves);
  }

  function check(made) {
    const v = verdict(g, st, level.target);
    if (v.win) { msg.innerHTML = `✓ Готово: ${esc(v.molecule ? v.molecule.name : level.targetName)}!`; draw(); return api.win(moves); }
    if (v.full) {
      const what = v.isomer ? "атомы те же, но соединены по-другому — это изомер" : v.molecule ? `получилось «${v.molecule.name}»` : "получилось не то вещество";
      msg.innerHTML = `⚠ Все руки вашей молекулы заняты, но ${what}. Связь не разорвать — нажмите «Отменить».`;
    } else if (made.length) {
      msg.innerHTML = `Связь: ${made.map(([i, j]) => `${g.els[i]}–${g.els[j]}`).join(", ")}. Свободных рук у вашей молекулы: ${v.free}.`;
    } else msg.textContent = "";
  }

  function go(dir) {
    if (verdict(g, st, level.target).full) return;
    const r = move(g, st, dir);
    if (!r) { msg.textContent = "Дальше стена."; return; }
    history.push({ st, moves });
    st = r.st;
    moves++;
    draw();
    check(r.made);
  }

  const reset = () => {
    st = bondUp(g, g.start).st;
    moves = 0;
    history = [];
    msg.textContent = "Двигайте свой атом (с кольцом) стрелками на клавиатуре, кнопками или свайпом.";
    draw();
  };

  root.addEventListener("click", (e) => { const b = e.target.closest("[data-dir]"); if (b) go(b.dataset.dir); });
  const KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", ц: "up", ы: "down", ф: "left", в: "right" };
  const onKey = (e) => {
    if (!root.isConnected) return document.removeEventListener("keydown", onKey);
    const dir = KEYS[e.key];
    if (dir && !root.closest(".won")) { e.preventDefault(); go(dir); }
  };
  document.addEventListener("keydown", onKey);
  let touch = null;
  svg.addEventListener("pointerdown", (e) => { touch = [e.clientX, e.clientY]; });
  svg.addEventListener("pointerup", (e) => {
    if (!touch) return;
    const dx = e.clientX - touch[0], dy = e.clientY - touch[1];
    touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });

  reset();
  return {
    reset,
    undo() {
      const h = history.pop();
      if (!h) return;
      ({ st, moves } = h);
      msg.textContent = "";
      draw();
    },
    hint() {
      const v = verdict(g, st, level.target);
      if (v.full) return "Молекула замкнулась не та. Отмените ходы до того, как появилась лишняя связь.";
      return level.hint || "Связь появляется сама, как только два атома со свободными руками оказываются рядом. Подумайте, какие связи нужны первыми.";
    }
  };
}
