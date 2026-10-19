// Балансировщик: ученик подбирает коэффициенты, а «весы» для каждого элемента
// показывают, сколько атомов слева и справа. Каждая копия молекулы видна как кучка шариков.
import { ELEMENTS } from "../../data/elements.js?v=15";
import { countAtoms, formulaHTML } from "./formula.js?v=15";
import { $, esc } from "../core/util.js?v=15";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

export function createBalancer(root, eq, { onBalanced = () => {} } = {}) {
  const terms = [...eq.left.map((t) => ({ ...t, side: "L" })), ...eq.right.map((t) => ({ ...t, side: "R" }))];
  terms.forEach((t) => { t.k = 1; t.atoms = countAtoms(t.f); });
  const elements = [...new Set(terms.flatMap((t) => Object.keys(t.atoms)))];
  let done = false;

  function cluster(t) {
    // одна копия молекулы — кучка цветных точек
    const dots = Object.entries(t.atoms).flatMap(([el, n]) => Array(n).fill(el));
    return `<span class="mol-copy">${dots.map((el) => `<i style="background:${ELEMENTS[el].color}"></i>`).join("")}</span>`;
  }

  function render() {
    const side = (s) => terms.filter((t) => t.side === s).map((t) => {
      const i = terms.indexOf(t);
      return `<div class="bal-term">
        <div class="bal-k">
          <button type="button" class="step-btn" data-i="${i}" data-d="-1" aria-label="Уменьшить коэффициент">−</button>
          <output>${t.k}</output>
          <button type="button" class="step-btn" data-i="${i}" data-d="1" aria-label="Увеличить коэффициент">+</button>
        </div>
        <div class="bal-f">${t.k > 1 ? `<b class="eq-k">${t.k}</b>` : ""}${formulaHTML(t.f, { colored: true })}</div>
        ${t.name ? `<small class="eq-name">${esc(t.name)}</small>` : ""}
        <div class="copies">${Array.from({ length: t.k }, () => cluster(t)).join("")}</div>
      </div>`;
    }).join('<span class="eq-op">+</span>');

    const count = (s) => {
      const tot = {};
      terms.filter((t) => t.side === s).forEach((t) => {
        for (const [el, n] of Object.entries(t.atoms)) tot[el] = (tot[el] || 0) + n * t.k;
      });
      return tot;
    };
    const L = count("L"), Rr = count("R");
    const allEqual = elements.every((el) => L[el] === Rr[el]);
    const g = terms.reduce((acc, t) => gcd(acc, t.k), 0);

    root.innerHTML = `
      <div class="balancer">
        <div class="bal-row">${side("L")}<span class="eq-op eq-arrow">→</span>${side("R")}</div>
        <div class="scales">${elements.map((el) => {
          const diff = (Rr[el] || 0) - (L[el] || 0);
          const tilt = Math.max(-14, Math.min(14, diff * 4));
          return `<div class="scale ${diff === 0 ? "even" : ""}">
            <span class="sc-n">${L[el] || 0}</span>
            <span class="beam" style="transform:rotate(${tilt}deg)"><i class="dot" style="background:${ELEMENTS[el].color}"></i>${el}</span>
            <span class="sc-n">${Rr[el] || 0}</span>
          </div>`;
        }).join("")}</div>
        <p class="bal-status ${allEqual ? (g > 1 ? "warn" : "ok") : ""}" aria-live="polite">${
          allEqual
            ? (g > 1 ? `Сходится, но все коэффициенты делятся на ${g}. Химики пишут самые маленькие числа: сократите.` : "✓ Уравнено! Каждого атома слева и справа поровну.")
            : "Чаши не в равновесии: где-то атомов больше, чем с другой стороны. Меняйте коэффициенты, а не формулы."
        }</p>
      </div>`;
    if (allEqual && g === 1 && !done) { done = true; onBalanced(); }
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest(".step-btn");
    if (!b) return;
    const t = terms[Number(b.dataset.i)];
    t.k = Math.max(1, Math.min(9, t.k + Number(b.dataset.d)));
    render();
  });
  render();
}
