// Проверка содержимого курса: химия в уравнениях, «лупа», балансировщик, расчёты, карточки.
// Запуск: node tools/check.mjs
import { REACTIONS } from "../data/reactions.js";
import { SUBSTANCES } from "../data/substances.js";
import { CARDS } from "../data/cards.js";
import { LESSONS, MODULES } from "../data/course.js";
import { MOLECULES } from "../data/molecules.js";
import { ELEMENTS } from "../data/elements.js";
import { isBalanced, sideAtoms, countAtoms } from "../js/engine/formula.js";

let errors = 0;
const fail = (msg) => { errors++; console.error("✗ " + msg); };

// Реакции и «лупа»
for (const r of REACTIONS) {
  if (!isBalanced(r.equation)) fail(`${r.id}: уравнение не уравнено`);
  r.reactants.forEach((id) => { if (!SUBSTANCES[id]) fail(`${r.id}: нет вещества ${id}`); });
  if (r.micro) {
    const left = sideAtoms(r.equation.left);
    const micro = {};
    r.micro.atoms.forEach((a) => { micro[a.el] = (micro[a.el] || 0) + 1; });
    for (const el of new Set([...Object.keys(left), ...Object.keys(micro)])) {
      if (left[el] !== micro[el]) fail(`${r.id}: в лупе ${el} ×${micro[el] || 0}, в уравнении ×${left[el] || 0}`);
    }
    const ids = new Set(r.micro.atoms.map((a) => a.id));
    [...r.micro.bondsBefore, ...r.micro.bondsAfter].forEach(([a, b]) => {
      if (!ids.has(a) || !ids.has(b)) fail(`${r.id}: связь ${a}-${b} с несуществующим атомом`);
    });
    // валентность после реакции: у ковалентных атомов число связей = валентности
    for (const [bonds, when] of [[r.micro.bondsBefore, "до"], [r.micro.bondsAfter, "после"]]) {
      const used = {};
      bonds.forEach(([a, b, o]) => { used[a] = (used[a] || 0) + o; used[b] = (used[b] || 0) + o; });
      for (const a of r.micro.atoms) {
        const v = ELEMENTS[a.el].valence;
        const charged = a.charge && a.charge[when === "до" ? 0 : 1];
        if (v && !charged && (used[a.id] || 0) !== v) fail(`${r.id}: у атома ${a.id} (${a.el}) ${when} реакции ${used[a.id] || 0} связей вместо ${v}`);
      }
    }
  }
}

// Уроки
const order = MODULES.flatMap((m) => m.lessons || []);
order.forEach((id) => { if (!LESSONS[id]) fail(`модуль ссылается на несуществующий урок ${id}`); });
for (const l of Object.values(LESSONS)) {
  if (!order.includes(l.id)) fail(`${l.id}: урок не стоит ни в одном модуле`);
  if (!CARDS.some((c) => c.lesson === l.id)) fail(`${l.id}: нет карточек`);
  for (const step of l.steps) {
    if (step.type === "balance") {
      for (const e of step.equations) if (!isBalanced(e.eq)) fail(`${l.id}/${e.id}: ответ в балансировщике не уравнен`);
    }
    if (step.type === "build") {
      for (const g of step.goals) {
        if (!MOLECULES.some((m) => m.formula === g.formula)) fail(`${l.id}: молекулы ${g.formula} нет в справочнике`);
        Object.keys(countAtoms(g.formula)).forEach((el) => { if (!step.palette.includes(el)) fail(`${l.id}: для ${g.formula} нет атома ${el} в палитре`); });
      }
    }
    if (step.type === "separate" || step.type === "lab") {
      (step.shelf || step.substances).forEach((id) => { if (!SUBSTANCES[id]) fail(`${l.id}: нет вещества ${id}`); });
    }
    if (step.type === "micro" && !REACTIONS.some((r) => r.id === step.reaction)) fail(`${l.id}: нет реакции ${step.reaction}`);
    if (step.type === "lab") {
      if (step.reaction && !REACTIONS.some((r) => r.id === step.reaction)) fail(`${l.id}: нет реакции ${step.reaction}`);
      step.goals.filter((g) => g.reaction).forEach((g) => { if (!REACTIONS.some((r) => r.id === g.reaction)) fail(`${l.id}: цель ждёт несуществующую реакцию ${g.reaction}`); });
    }
    if (step.type === "mix") {
      // перебираем все положения ползунков: каждая цель должна быть достижима
      const { stock, water } = step.mixer;
      const reached = new Set();
      for (let a = 0; a <= stock.max + 1e-9; a += stock.step) {
        for (let w = 0; w <= water.max + 1e-9; w += water.step) {
          const sa = +a.toFixed(4), sw = +w.toFixed(4);
          const total = sa + sw, solute = sa * stock.c / 100;
          const st = { stock: sa, water: sw, total, solute, c: total ? solute / total * 100 : 0 };
          step.goals.forEach((g) => { if (!reached.has(g.id) && g.test(st)) reached.add(g.id); });
        }
      }
      step.goals.forEach((g) => { if (!reached.has(g.id)) fail(`${l.id}: цель смесителя «${g.id}» недостижима`); });
    }
    if (step.type === "calc") {
      for (let k = 0; k < 30; k++) {
        const p = step.generate();
        p.steps.forEach((s, i) => { if (!Number.isFinite(s.answer) || s.answer <= 0) fail(`${l.id}: шаг расчёта ${i + 1} дал ${s.answer}`); });
      }
    }
    if (step.type === "sort") {
      const bins = new Set(step.sort.bins.map((b) => b.id));
      step.sort.items.forEach((it) => { if (!bins.has(it.bin)) fail(`${l.id}: карточка ${it.id} ссылается на несуществующую корзину ${it.bin}`); });
    }
    if (step.type === "combine") {
      step.goals.forEach((g) => { if (!step.combine.results[g.key]) fail(`${l.id}: комбинатор не знает пару ${g.key}`); });
    }
    if (step.verdict && !l.steps.some((s) => s.type === "hypothesis" && s.options.some((o) => o.ok))) fail(`${l.id}: verdict без гипотезы с верным ответом`);
  }
}

// Карточки
const seen = new Set();
for (const c of CARDS) {
  if (seen.has(c.id)) fail(`карточка ${c.id} повторяется`);
  seen.add(c.id);
  if (!LESSONS[c.lesson]) fail(`карточка ${c.id}: нет урока ${c.lesson}`);
  if (c.wrong.includes(c.answer)) fail(`карточка ${c.id}: ответ среди неверных`);
  if (new Set(c.wrong).size !== c.wrong.length) fail(`карточка ${c.id}: повторяются неверные варианты`);
}
for (const m of MOLECULES) {
  const atoms = countAtoms(m.formula);
  const totalValence = Object.entries(atoms).reduce((s, [el, n]) => s + ELEMENTS[el].valence * n, 0);
  if (totalValence % 2) fail(`молекула ${m.formula}: нечётная сумма валентностей, её не собрать`);
}
if (JSON.stringify(countAtoms("Ca(OH)2")) !== JSON.stringify({ Ca: 1, O: 2, H: 2 })) fail("countAtoms: скобки");

console.log(errors ? `Ошибок: ${errors}` : `✓ Всё сходится: уроков ${Object.keys(LESSONS).length}, реакций ${REACTIONS.length}, карточек ${CARDS.length}`);
process.exit(errors ? 1 : 0);
