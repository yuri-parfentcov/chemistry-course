// Сортировщик: разложите карточки по корзинам. Нажмите карточку, потом корзину.
// Верно — карточка ложится в корзину с пояснением; неверно — подсказка, можно попробовать ещё.
import { $, $$, esc, shuffle } from "../core/util.js";

// cfg: { bins: [{ id, icon, label }], items: [{ id, icon, label, bin, explain }] }
export function createSort(root, cfg, { onProgress = () => {} } = {}) {
  const placed = new Map();   // itemId → была ли с первой попытки
  const missed = new Set();
  let picked = null;
  const items = shuffle(cfg.items);

  root.innerHTML = `
    <div class="sorter">
      <div class="sort-items" role="group" aria-label="Карточки">
        ${items.map((it) => `<button type="button" class="sort-item" data-id="${it.id}">${it.icon ? `<span class="si-icon">${it.icon}</span>` : ""}<span>${esc(it.label)}</span></button>`).join("")}
      </div>
      <p class="sort-msg" aria-live="polite">Выберите карточку, потом корзину.</p>
      <div class="sort-bins">
        ${cfg.bins.map((b) => `<button type="button" class="sort-bin" data-bin="${b.id}">
          <span class="sb-head"><span class="sb-icon">${b.icon}</span><b>${esc(b.label)}</b></span>
          <span class="sb-list"></span></button>`).join("")}
      </div>
    </div>`;

  const msg = $(".sort-msg", root);

  root.addEventListener("click", (e) => {
    const it = e.target.closest(".sort-item");
    if (it && !it.disabled) {
      picked = it.dataset.id;
      $$(".sort-item", root).forEach((x) => x.classList.toggle("picked", x === it));
      msg.textContent = "Теперь выберите корзину.";
      return;
    }
    const bin = e.target.closest(".sort-bin");
    if (!bin || !picked) return;
    const item = cfg.items.find((x) => x.id === picked);
    const btn = root.querySelector(`.sort-item[data-id="${picked}"]`);
    if (item.bin === bin.dataset.bin) {
      placed.set(item.id, !missed.has(item.id));
      btn.disabled = true;
      btn.classList.remove("picked");
      btn.hidden = true;
      $(".sb-list", bin).insertAdjacentHTML("beforeend", `<span class="sb-item">${item.icon || ""} ${esc(item.label)}</span>`);
      msg.className = "sort-msg ok";
      msg.textContent = `✓ ${item.explain}`;
      picked = null;
      onProgress({ done: placed.size, total: cfg.items.length, firstTry: [...placed.values()].filter(Boolean).length });
    } else {
      missed.add(item.id);
      bin.classList.add("shake");
      setTimeout(() => bin.classList.remove("shake"), 400);
      msg.className = "sort-msg bad";
      msg.textContent = "Не сюда. Подумайте ещё — и попробуйте другую корзину.";
    }
  });
}
