// Глава 4 «Звёздная кузница»: сливайте ядра, как звёзды. Нажмите ядро, потом второе —
// если такая реакция идёт в звёздах, получится новое ядро и выделится энергия.
// Модель упрощена: только протон-протонная цепочка, тройная альфа и альфа-лестница до никеля-56.
// Энергии (МэВ) — табличные значения реакций. Логика и решатель чистые.
import { $, $$, esc } from "../core/util.js?v=26";

// Ядра: символ, массовое число, цвет фишки
export const NUC = {
  p: { s: "H", A: 1, name: "протон (ядро водорода)", c: "#d9dde0" },
  d: { s: "H", A: 2, name: "дейтерий", c: "#b8c4ca" },
  He3: { s: "He", A: 3, name: "гелий-3", c: "#f2c94c" },
  He4: { s: "He", A: 4, name: "гелий-4", c: "#f0b429" },
  Be8: { s: "Be", A: 8, name: "бериллий-8 (нестабилен!)", c: "#9ad1c4" },
  C12: { s: "C", A: 12, name: "углерод-12", c: "#4a5157" },
  O16: { s: "O", A: 16, name: "кислород-16", c: "#e0453a" },
  Ne20: { s: "Ne", A: 20, name: "неон-20", c: "#ff7ab6" },
  Mg24: { s: "Mg", A: 24, name: "магний-24", c: "#5fa83a" },
  Si28: { s: "Si", A: 28, name: "кремний-28", c: "#a07f5a" },
  S32: { s: "S", A: 32, name: "сера-32", c: "#e5c22a" },
  Ar36: { s: "Ar", A: 36, name: "аргон-36", c: "#8fa7ff" },
  Ca40: { s: "Ca", A: 40, name: "кальций-40", c: "#4c9e6e" },
  Ti44: { s: "Ti", A: 44, name: "титан-44", c: "#9aa3ad" },
  Cr48: { s: "Cr", A: 48, name: "хром-48", c: "#7aa6a1" },
  Fe52: { s: "Fe", A: 52, name: "железо-52", c: "#c4622d" },
  Ni56: { s: "Ni", A: 56, name: "никель-56 → железо-56", c: "#8c5a3c" }
};

// Реакции: [a, b] → продукты, энергия в МэВ
const R = [
  ["p", "p", ["d"], 1.44, "Два протона слились, и один из них превратился в нейтрон: получился дейтерий. Это самая медленная ступень — в Солнце один протон ждёт её в среднем миллиарды лет."],
  ["d", "p", ["He3"], 5.49, "Дейтерий захватил протон — получился лёгкий гелий-3."],
  ["He3", "He3", ["He4", "p", "p"], 12.86, "Два гелия-3 дали гелий-4 и вернули два протона в звезду."],
  ["He4", "He4", ["Be8"], -0.09, "Бериллий-8! Он распадается обратно за ничтожную долю секунды — скорее добавьте третий гелий."],
  ["Be8", "He4", ["C12"], 7.37, "Третий гелий успел: углерод-12 — основа всей жизни."],
  ["C12", "He4", ["O16"], 7.16, "Углерод + гелий = кислород."],
  ["O16", "He4", ["Ne20"], 4.73, "Кислород + гелий = неон."],
  ["Ne20", "He4", ["Mg24"], 9.32, "Неон + гелий = магний."],
  ["Mg24", "He4", ["Si28"], 9.98, "Магний + гелий = кремний."],
  ["Si28", "He4", ["S32"], 6.95, "Кремний + гелий = сера."],
  ["S32", "He4", ["Ar36"], 6.64, "Сера + гелий = аргон."],
  ["Ar36", "He4", ["Ca40"], 7.04, "Аргон + гелий = кальций."],
  ["Ca40", "He4", ["Ti44"], 5.13, "Кальций + гелий = титан."],
  ["Ti44", "He4", ["Cr48"], 7.70, "Титан + гелий = хром."],
  ["Cr48", "He4", ["Fe52"], 7.94, "Хром + гелий = железо-52."],
  ["Fe52", "He4", ["Ni56"], 8.00, "Никель-56 — конец лестницы. За несколько месяцев он распадается в кобальт и затем в железо-56."]
];
const reaction = (a, b) => R.find(([x, y]) => (x === a && y === b) || (x === b && y === a));

// Решатель: наименьшее число слияний до цели (поиск в ширину по наборам ядер)
const keyOf = (pool) => Object.keys(pool).filter((k) => pool[k]).sort().map((k) => `${k}${pool[k]}`).join(",");
const reached = (pool, target) => Object.entries(target).every(([k, n]) => (pool[k] || 0) >= n);
export function par(level) {
  let frontier = [{ ...level.pool }];
  const seen = new Set([keyOf(level.pool)]);
  for (let depth = 0; frontier.length && depth < 60; depth++) {
    const next = [];
    for (const pool of frontier) {
      if (reached(pool, level.target)) return depth;
      const kinds = Object.keys(pool).filter((k) => pool[k]);
      for (const [a, b, out] of R) {
        if (!pool[a] || !pool[b] || (a === b && pool[a] < 2)) continue;
        if (!kinds.includes(a)) continue;
        const np = { ...pool };
        np[a]--; np[b]--;
        out.forEach((o) => { np[o] = (np[o] || 0) + 1; });
        const k = keyOf(np);
        if (!seen.has(k)) { seen.add(k); next.push(np); }
      }
    }
    frontier = next;
  }
  return Infinity;
}

const label = (k) => `<sup>${NUC[k].A}</sup>${NUC[k].s}`;
const BE_LIFE = 4000;   // мс: в игре бериллий «живёт» 4 секунды, в природе — около 10⁻¹⁶ с

export function mount(root, level, api) {
  let chips, energy, moves, history, picked, nextId;
  let timers = [];

  root.innerHTML = `
    <div class="stellar">
      <p class="st-goal">Цель: ${Object.entries(level.target).map(([k, n]) => `<b>${n > 1 ? n + " × " : ""}${label(k)}</b> <span class="muted">(${NUC[k].name})</span>`).join(" и ")}</p>
      <div class="st-energy"><span>Энергия звезды:</span><div class="st-bar"><div></div></div><b class="st-mev"></b></div>
      <div class="st-core" role="group" aria-label="Ядра в звезде"></div>
      <p class="board-msg" aria-live="polite"></p>
    </div>`;
  const msg = $(".board-msg", root);
  const say = (t) => { msg.innerHTML = t; };

  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const reset = () => {
    clearTimers();
    nextId = 0;
    chips = [];
    for (const [k, n] of Object.entries(level.pool)) for (let i = 0; i < n; i++) chips.push({ id: nextId++, k });
    energy = 0; moves = 0; history = []; picked = null;
    say("Нажмите на ядро, потом на второе — они сольются, если такая реакция бывает в звёздах.");
    draw();
  };

  function draw() {
    $(".st-core", root).innerHTML = chips.map((ch) => {
      const n = NUC[ch.k];
      const size = 40 + Math.min(34, Math.sqrt(n.A) * 6);
      return `<button type="button" class="st-chip ${picked === ch.id ? "sel" : ""} ${ch.k === "Be8" ? "unstable" : ""}" data-id="${ch.id}"
        style="--c:${n.c};width:${size}px;height:${size}px" title="${esc(n.name)}">${label(ch.k)}${ch.k === "Be8" ? '<span class="st-fuse"></span>' : ""}</button>`;
    }).join("");
    $(".st-mev", root).textContent = `${energy.toFixed(1).replace(".", ",")} МэВ`;
    $(".st-bar div", root).style.width = `${Math.max(0, Math.min(100, (energy / (level.fullEnergy || 30)) * 100))}%`;
    api.moves(moves);
    const pool = {};
    chips.forEach((c) => { pool[c.k] = (pool[c.k] || 0) + 1; });
    if (reached(pool, level.target)) { clearTimers(); api.win(moves); }
  }

  function decayBe(id) {
    const ch = chips.find((c) => c.id === id && c.k === "Be8");
    if (!ch) return;
    chips = chips.filter((c) => c !== ch);
    chips.push({ id: nextId++, k: "He4" }, { id: nextId++, k: "He4" });
    energy += 0.09;
    if (picked === id) picked = null;
    say("💥 Бериллий-8 распался обратно на два ядра гелия. Ход потрачен — в следующий раз держите третий гелий наготове.");
    draw();
  }

  function fuse(a, b) {
    const r = reaction(a.k, b.k);
    if (!r) {
      if ((a.k === "p" && b.k === "He4") || (a.k === "He4" && b.k === "p")) return say("Протон + гелий-4 дали бы литий-5, а он распадается мгновенно. В звёздах так гелий не растёт.");
      if (a.k === "Ni56" || b.k === "Ni56") return say("Дальше железа звёзды энергию не получают: самые прочные ядра — у железа и никеля. Более тяжёлые элементы рождаются при взрывах звёзд и слияниях нейтронных звёзд.");
      return say(`${NUC[a.k].name} + ${NUC[b.k].name} — в этой модели так не сливаются. Подсказка: тяжёлые ядра растут, добавляя по одному гелию-4.`);
    }
    history.push({ chips: chips.map((c) => ({ ...c })), energy, moves, nextId });
    const [, , out, q, text] = r;
    chips = chips.filter((c) => c !== a && c !== b);
    const born = out.map((k) => ({ id: nextId++, k }));
    chips.push(...born);
    energy += q;
    moves++;
    say(`${label(a.k)} + ${label(b.k)} → ${out.map(label).join(" + ")} <span class="muted">(${q > 0 ? "+" : ""}${q.toFixed(2).replace(".", ",")} МэВ)</span>. ${text}`);
    born.filter((c) => c.k === "Be8").forEach((c) => timers.push(setTimeout(() => decayBe(c.id), BE_LIFE)));
    draw();
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest(".st-chip");
    if (!b) return;
    const id = Number(b.dataset.id);
    const ch = chips.find((c) => c.id === id);
    if (picked === null) { picked = id; say(`Выбрано: ${NUC[ch.k].name}. Теперь второе ядро.`); return draw(); }
    if (picked === id) { picked = null; return draw(); }
    const first = chips.find((c) => c.id === picked);
    picked = null;
    if (first) fuse(first, ch); else draw();
  });

  reset();
  return {
    reset,
    undo() {
      const h = history.pop();
      if (!h) return;
      clearTimers();
      ({ chips, energy, moves, nextId } = h);
      picked = null;
      // восстановленный бериллий снова начинает распадаться
      chips.filter((c) => c.k === "Be8").forEach((c) => timers.push(setTimeout(() => decayBe(c.id), BE_LIFE)));
      draw();
    },
    hint() { return level.hint || "Тяжёлые ядра растут ступеньками: каждый раз добавляйте ядро гелия-4."; }
  };
}
