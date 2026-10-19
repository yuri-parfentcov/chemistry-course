// Проверка химии в данных: уравнения уравнены, атомы в «лупе» совпадают с уравнением.
// Запуск: node tools/check.mjs
import { REACTIONS } from "../data/reactions.js";
import { SUBSTANCES } from "../data/substances.js";
import { CARDS } from "../data/cards.js";
import { LESSONS } from "../data/course.js";
import { isBalanced, sideAtoms, countAtoms } from "../js/engine/formula.js";

let errors = 0;
const fail = (msg) => { errors++; console.error("✗ " + msg); };

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
  }
}
for (const c of CARDS) {
  if (!LESSONS[c.lesson]) fail(`карточка ${c.id}: нет урока ${c.lesson}`);
  if (c.wrong.includes(c.answer)) fail(`карточка ${c.id}: ответ среди неверных`);
}
if (JSON.stringify(countAtoms("Ca(OH)2")) !== JSON.stringify({ Ca: 1, O: 2, H: 2 })) fail("countAtoms: скобки");

console.log(errors ? `Ошибок: ${errors}` : `✓ Всё сходится: реакций ${REACTIONS.length}, карточек ${CARDS.length}`);
process.exit(errors ? 1 : 0);
