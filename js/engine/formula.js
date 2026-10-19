// Формулы: подсчёт атомов, молярная масса, проверка баланса, красивый вывод
import { ELEMENTS } from "../../data/elements.js?v=13";

// "CH3COOH" → { C: 2, H: 4, O: 2 }; понимает скобки: "Ca(OH)2"
export function countAtoms(formula) {
  const tokens = formula.match(/[A-Z][a-z]?|\d+|\(|\)/g) || [];
  const stack = [{}];
  const add = (obj, el, n) => { obj[el] = (obj[el] || 0) + n; };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = tokens[i + 1];
    const mult = next && /^\d+$/.test(next) ? Number(next) : 1;
    if (t === "(") {
      stack.push({});
    } else if (t === ")") {
      const group = stack.pop();
      if (next && /^\d+$/.test(next)) i++;
      for (const el in group) add(stack[stack.length - 1], el, group[el] * mult);
    } else if (/^\d+$/.test(t)) {
      continue;
    } else {
      if (next && /^\d+$/.test(next)) i++;
      add(stack[stack.length - 1], t, mult);
    }
  }
  return stack[0];
}

export function molarMass(formula) {
  const atoms = countAtoms(formula);
  return Object.entries(atoms).reduce((sum, [el, n]) => sum + ELEMENTS[el].mass * n, 0);
}

// Сумма атомов одной стороны уравнения: [{ f, k }]
export function sideAtoms(side) {
  const total = {};
  for (const { f, k } of side) {
    for (const [el, n] of Object.entries(countAtoms(f))) total[el] = (total[el] || 0) + n * k;
  }
  return total;
}

export function isBalanced(eq) {
  const l = sideAtoms(eq.left), r = sideAtoms(eq.right);
  const els = new Set([...Object.keys(l), ...Object.keys(r)]);
  return [...els].every((el) => l[el] === r[el]);
}

// HTML: цифры — подстрочные, каждый элемент — своим цветом (как шарики в «лупе»)
export function formulaHTML(formula, { colored = false } = {}) {
  return formula.replace(/([A-Z][a-z]?)|(\d+)|([()])/g, (m, el, num, par) => {
    if (num) return `<sub>${num}</sub>`;
    if (par) return par;
    return colored ? `<span class="el el-${el}">${el}</span>` : el;
  });
}

// "NaHCO3" → "NaHCO₃" для подписей на canvas и в атрибутах
const SUB = "₀₁₂₃₄₅₆₇₈₉";
export const formulaText = (f) => f.replace(/\d/g, (d) => SUB[d]);
