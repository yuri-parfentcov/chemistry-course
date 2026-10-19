// Уравнение реакции: цветные формулы, названия под ними и проверка «атомов слева = справа»
import { formulaHTML, sideAtoms } from "./formula.js?v=20";
import { ELEMENTS } from "../../data/elements.js?v=20";
import { esc } from "../core/util.js?v=20";

function termHTML({ f, k, name, gas }) {
  return `<span class="eq-term">
    <span class="eq-f">${k > 1 ? `<b class="eq-k">${k}</b>` : ""}${formulaHTML(f, { colored: true })}${gas ? '<span class="eq-gas" title="газ">↑</span>' : ""}</span>
    ${name ? `<span class="eq-name">${esc(name)}</span>` : ""}
  </span>`;
}

const side = (terms) => terms.map(termHTML).join('<span class="eq-op">+</span>');

export function equationHTML(eq) {
  const l = sideAtoms(eq.left), r = sideAtoms(eq.right);
  const els = Object.keys(l);
  const ok = els.every((el) => l[el] === r[el]);
  const counts = (obj) => els.map((el) =>
    `<span class="atom-count"><i class="dot" style="background:${ELEMENTS[el].color}"></i>${el}&nbsp;${obj[el] || 0}</span>`).join("");
  return `<div class="equation">
      <div class="eq-row">${side(eq.left)}<span class="eq-op eq-arrow">→</span>${side(eq.right)}</div>
      <div class="eq-check ${ok ? "ok" : "bad"}">
        <span>Слева: ${counts(l)}</span>
        <span>Справа: ${counts(r)}</span>
        <strong>${ok ? "✓ Атомов поровну" : "✗ Не сходится"}</strong>
      </div>
    </div>`;
}
