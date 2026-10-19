// Лаборатория: полка с реактивами + стакан + журнал наблюдений.
// Реакции находятся по данным REACTIONS: когда в жидкости есть все реагенты — запускаем.
import { SUBSTANCES } from "../../data/substances.js";
import { REACTIONS } from "../../data/reactions.js";
import { formulaHTML } from "./formula.js";
import { createBeaker } from "./lab-macro.js";
import { $, esc } from "../core/util.js";

// Банка на полке (общая для лаборатории и разделения смесей)
export function jarHTML(id) {
  const s = SUBSTANCES[id];
  return `<button type="button" class="jar" data-id="${id}" draggable="true" title="${esc(s.chem)}">
    <span class="jar-glass ${s.state}" style="--fill:${s.color}"></span>
    <span class="jar-name">${esc(s.name)}</span>
    <span class="jar-formula">${s.formula ? formulaHTML(s.formula) : esc(s.chem)}</span>
  </button>`;
}

// Банку можно нажать или перетащить на стол
export function bindShelf(root, bench, add) {
  root.addEventListener("click", (e) => {
    const jar = e.target.closest(".jar");
    if (jar) add(jar.dataset.id);
  });
  root.addEventListener("dragstart", (e) => {
    const jar = e.target.closest(".jar");
    if (jar) e.dataTransfer.setData("text/plain", jar.dataset.id);
  });
  bench.addEventListener("dragover", (e) => { e.preventDefault(); bench.classList.add("drop"); });
  bench.addEventListener("dragleave", () => bench.classList.remove("drop"));
  bench.addEventListener("drop", (e) => {
    e.preventDefault();
    bench.classList.remove("drop");
    const id = e.dataTransfer.getData("text/plain");
    if (SUBSTANCES[id]) add(id);
  });
}

export function createLab(root, { substances, onEvent = () => {} }) {
  root.innerHTML = `
    <div class="lab">
      <div class="shelf" role="group" aria-label="Полка с реактивами">
        ${substances.map(jarHTML).join("")}
      </div>
      <div class="bench">
        <canvas class="beaker" width="320" height="300" aria-label="Стакан"></canvas>
        <button type="button" class="btn ghost small" data-act="empty">🧽 Вылить и помыть</button>
      </div>
      <ol class="lab-log" aria-live="polite"></ol>
    </div>`;

  const canvas = $(".beaker", root);
  const beaker = createBeaker(canvas);
  const log = $(".lab-log", root);

  // units — сколько порций вещества ещё не прореагировало; added — что вообще клали
  let units = {};
  let added = {};

  function note(text, kind = "") {
    const li = document.createElement("li");
    li.className = kind;
    li.textContent = text;
    log.prepend(li);
    while (log.children.length > 6) log.lastChild.remove();
  }

  function tryReactions(justAdded) {
    if (!beaker.hasLiquid) return false;
    let reacted = false;
    for (const r of REACTIONS) {
      if (!r.reactants.length || !r.reactants.every((id) => units[id] > 0)) continue;
      const n = Math.min(...r.reactants.map((id) => units[id]));
      r.reactants.forEach((id) => { units[id] -= n; });
      if (r.effects.gas) beaker.fizz(0.9 * n, r.effects.gas);
      if (r.effects.heat) beaker.addHeat(r.effects.heat * n);
      note(r.observe, "reaction");
      onEvent({ type: "reaction", reaction: r });
      reacted = true;
    }
    if (!reacted && justAdded) {
      // реагент добавили, а партнёр уже израсходован
      for (const r of REACTIONS) {
        if (!r.reactants.includes(justAdded)) continue;
        const partner = r.reactants.find((id) => id !== justAdded);
        if (added[partner] && !units[partner]) {
          note(`Шипения нет: партнёр для реакции («${SUBSTANCES[partner].name}») уже израсходован. Новая порция осталась в избытке.`, "hint");
          return true;
        }
      }
    }
    return reacted;
  }

  function add(id) {
    const s = SUBSTANCES[id];
    if (s.state === "liquid") {
      if (beaker.full) { note("Стакан полон. Вылейте его, чтобы начать заново.", "hint"); return; }
      const hadPile = Object.keys(units).some((k) => SUBSTANCES[k].state === "solid" && units[k] > 0) && !beaker.hasLiquid;
      beaker.pour(s.color);
      note(s.pour);
      units[id] = (units[id] || 0) + 1;
      added[id] = true;
      onEvent({ type: "add", id });
      if (!tryReactions(id) && hadPile) {
        note("Порошок со дна растворился. Пузырей нет.");
        Object.keys(units).filter((k) => SUBSTANCES[k].state === "solid").forEach((k) => onEvent({ type: "dissolve", id: k }));
      }
    } else {
      units[id] = (units[id] || 0) + 1;
      added[id] = true;
      onEvent({ type: "add", id });
      if (!beaker.hasLiquid) {
        beaker.sprinkle(s.color, false);
        note(`${s.name} лежит на дне сухого стакана. Ничего не происходит: веществам нужна жидкость, чтобы встретиться.`);
        return;
      }
      beaker.sprinkle(s.color, true);
      if (!tryReactions(id)) {
        note(s.inWater);
        onEvent({ type: "dissolve", id });
      }
    }
  }

  bindShelf(root, $(".bench", root), add);
  root.addEventListener("click", (e) => {
    if (e.target.closest('[data-act="empty"]')) {
      beaker.reset();
      units = {};
      added = {};
      note("Стакан чистый.");
      onEvent({ type: "empty" });
    }
  });
  note("Стакан чистый. Добавьте что-нибудь с полки.");
  return { add };
}
