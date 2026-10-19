// «Парфюмер»: выберите кислоту и спирт — получится сложный эфир со своим запахом.
// Найденные запахи собираются в коллекцию.
import { $, $$, esc } from "../core/util.js?v=22";
import { formulaHTML } from "./formula.js?v=22";

// cfg: { left: [{ id, name, formula }], right: [...], results: { "leftId+rightId": { name, formula, smell, icon, use } },
//        fallback: (l, r) => ({ name, smell, ... }), action }
export function createCombine(root, cfg, { onResult = () => {} } = {}) {
  let L = null, R = null;
  const found = new Set();
  const col = (side, list, title) => `<div class="cmb-col"><h3>${esc(title)}</h3>${list.map((x) =>
    `<button type="button" class="cmb-opt" data-side="${side}" data-id="${x.id}"><b>${esc(x.name)}</b><small>${formulaHTML(x.formula)}</small></button>`).join("")}</div>`;

  root.innerHTML = `
    <div class="combine">
      <div class="cmb-pick">
        ${col("L", cfg.left, cfg.leftTitle)}
        <div class="cmb-plus">+</div>
        ${col("R", cfg.right, cfg.rightTitle)}
      </div>
      <button type="button" class="btn big" data-act="go" disabled>${esc(cfg.action)}</button>
      <div class="cmb-result" aria-live="polite"></div>
      <div class="cmb-found"></div>
    </div>`;

  const go = $('[data-act="go"]', root);
  root.addEventListener("click", (e) => {
    const o = e.target.closest(".cmb-opt");
    if (o) {
      if (o.dataset.side === "L") L = o.dataset.id; else R = o.dataset.id;
      $$(`.cmb-opt[data-side="${o.dataset.side}"]`, root).forEach((x) => x.classList.toggle("chosen", x === o));
      go.disabled = !(L && R);
      return;
    }
    if (e.target.closest('[data-act="go"]') && L && R) {
      const key = `${L}+${R}`;
      const res = cfg.results[key] || cfg.fallback(cfg.left.find((x) => x.id === L), cfg.right.find((x) => x.id === R));
      $(".cmb-result", root).innerHTML = `<div class="cmb-card">
        <span class="cmb-icon">${res.icon || "🧪"}</span>
        <div><b>${esc(res.name)}</b>${res.formula ? ` <span class="muted">${formulaHTML(res.formula)}</span>` : ""}
        <p>Запах: <b>${esc(res.smell)}</b>${res.use ? `. ${esc(res.use)}` : ""}</p></div></div>`;
      if (cfg.results[key] && !found.has(key)) {
        found.add(key);
        $(".cmb-found", root).insertAdjacentHTML("beforeend", `<span class="product">${res.icon || ""} ${esc(res.smell)}</span>`);
      }
      onResult(key, res);
    }
  });
}
