// Лаборатория: полка с реактивами + стакан + инструменты + журнал наблюдений.
// Реакции находятся по данным REACTIONS: когда в жидкости есть все реагенты
// (и выполнено условие, например нагрев) — запускаем. pH считает модель из ph.js,
// капустный индикатор окрашивает жидкость, осадки ложатся на дно, мыло пенится.
import { SUBSTANCES } from "../../data/substances.js?v=15";
import { REACTIONS } from "../../data/reactions.js?v=15";
import { formulaHTML } from "./formula.js?v=15";
import { createBeaker } from "./lab-macro.js?v=15";
import { mixturePH, cabbageColor, stripColor, phWord } from "./ph.js?v=15";
import { $, esc, fmt } from "../core/util.js?v=15";

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

const TOOLS = {
  ph: "🧾 Измерить pH",
  heat: "🔥 Вскипятить"
};

// substances — что стоит на полке; tools — ["ph", "heat"];
// onEvent(событие, состояние) — состояние: { units, ph }
export function createLab(root, { substances, tools = [], onEvent = () => {} }) {
  root.innerHTML = `
    <div class="lab">
      <div class="shelf" role="group" aria-label="Полка с реактивами">
        ${substances.map(jarHTML).join("")}
      </div>
      <div class="bench">
        <canvas class="beaker" width="320" height="300" aria-label="Стакан"></canvas>
        <div class="tools">
          ${tools.map((t) => `<button type="button" class="btn small tool" data-tool="${t}">${TOOLS[t]}</button>`).join("")}
          <button type="button" class="btn ghost small" data-act="empty">🧽 Вылить и помыть</button>
        </div>
      </div>
      <ol class="lab-log" aria-live="polite"></ol>
    </div>`;

  const canvas = $(".beaker", root);
  const beaker = createBeaker(canvas);
  const log = $(".lab-log", root);

  // units — сколько порций вещества ещё не прореагировало; added — что вообще клали
  let units = {};
  let added = {};
  let busy = false;

  const ph = () => mixturePH(Object.entries(units).map(([id, n]) => ({ sub: SUBSTANCES[id], units: n })));
  const state = () => ({ units: { ...units }, ph: ph(), temp: beaker.temp });
  const emit = (ev) => onEvent(ev, state());

  function note(html, kind = "") {
    const li = document.createElement("li");
    li.className = kind;
    li.innerHTML = html;
    log.prepend(li);
    while (log.children.length > 6) log.lastChild.remove();
  }

  // Внешний вид стакана, который зависит от состава: индикатор, осадок, пена
  function refresh() {
    const scene = {};
    const p = ph();
    // цвет жидкости — смесь цветов тех жидкостей, что ещё не прореагировали (краситель весомее)
    if (beaker.hasLiquid) {
      let w = 0;
      const sum = [0, 0, 0];
      for (const [id, n] of Object.entries(units)) {
        const s = SUBSTANCES[id];
        if (!(n > 0) || s.state !== "liquid") continue;
        const k = n * (s.dye ? 4 : 1);
        const c = parseInt(s.color.slice(1), 16);
        sum[0] += ((c >> 16) & 255) * k; sum[1] += ((c >> 8) & 255) * k; sum[2] += (c & 255) * k;
        w += k;
      }
      scene.rgb = w ? "#" + sum.map((v) => Math.round(v / w).toString(16).padStart(2, "0")).join("") : SUBSTANCES.water.color;
    }
    if (units.cabbage > 0 && beaker.hasLiquid && p !== null) scene.rgb = cabbageColor(p);
    let sed = 0, sedColor = null;
    for (const [id, n] of Object.entries(units)) {
      const s = SUBSTANCES[id];
      if (n > 0 && (s.state === "precipitate" || (s.insoluble && beaker.hasLiquid))) { sed += n; sedColor = s.color; }
    }
    scene.sediment = sed ? { amt: Math.min(1, 0.35 * sed), rgb: sedColor } : null;
    scene.turbid = units.scum > 0 ? 0.35 : 0;
    const lather = Object.entries(units).some(([id, n]) => n > 0 && SUBSTANCES[id].lather) && !(units.hardwater > 0);
    scene.lather = lather && beaker.hasLiquid ? 0.45 : 0;
    beaker.setScene(scene);
  }

  function tryReactions(justAdded, heating = false) {
    if (!beaker.hasLiquid) return false;
    let reacted = false;
    for (const r of REACTIONS) {
      if (!r.reactants.length || (r.condition === "heat" && !heating)) continue;
      if (!r.reactants.every((id) => units[id] > 0)) continue;
      if (r.catalyst && !(units[r.catalyst] > 0)) continue;
      const n = Math.min(...r.reactants.map((id) => units[id]));
      r.reactants.forEach((id) => { units[id] -= n; });
      for (const [pid, k] of Object.entries(r.produces || {})) units[pid] = (units[pid] || 0) + k * n;
      if (r.effects.gas) beaker.fizz((r.effects.gasPower || 0.9) * n, r.effects.gas);
      if (r.effects.heat) beaker.addHeat(r.effects.heat * n);
      if (r.effects.hazard) beaker.cloud(r.effects.hazard);
      note(esc(r.observe), r.effects.hazard ? "danger" : "reaction");
      emit({ type: "reaction", reaction: r });
      reacted = true;
    }
    if (!reacted && justAdded) {
      // реагент добавили, а партнёр уже израсходован
      for (const r of REACTIONS) {
        if (!r.reactants.includes(justAdded) || r.reactants.length < 2 || r.condition || !r.effects.gas) continue;
        const partner = r.reactants.find((id) => id !== justAdded);
        if (added[partner] && !units[partner] && SUBSTANCES[partner].state !== "precipitate") {
          note(`Шипения нет: партнёр («${esc(SUBSTANCES[partner].name)}») уже израсходован. Новая порция осталась в избытке.`, "hint");
          return true;
        }
      }
    }
    return reacted;
  }

  function add(id) {
    if (busy) return;
    const s = SUBSTANCES[id];
    if (s.state === "liquid") {
      if (beaker.full) { note("Стакан полон. Вылейте его, чтобы начать заново.", "hint"); return; }
      const hadPile = Object.keys(units).some((k) => SUBSTANCES[k].state === "solid" && units[k] > 0) && !beaker.hasLiquid;
      beaker.pour(s.color);
      note(esc(s.pour || `Налили: ${s.name.toLowerCase()}.`));
      units[id] = (units[id] || 0) + 1;
      added[id] = true;
      emit({ type: "add", id });
      const reacted = tryReactions(id);
      if (s.lather && units[id] > 0 && !(units.hardwater > 0)) note("Взбили: получилась пышная пена.");
      if (!reacted && hadPile) {
        note("Порошок со дна растворился. Пузырей нет.");
        Object.keys(units).filter((k) => SUBSTANCES[k].state === "solid").forEach((k) => emit({ type: "dissolve", id: k }));
      }
    } else {
      units[id] = (units[id] || 0) + 1;
      added[id] = true;
      emit({ type: "add", id });
      if (!beaker.hasLiquid) {
        beaker.sprinkle(s.color, false);
        note(`${esc(s.name)} лежит на дне сухого стакана. Ничего не происходит: веществам нужна жидкость, чтобы встретиться.`);
        refresh();
        return;
      }
      beaker.sprinkle(s.color, true);
      if (!tryReactions(id)) {
        if (s.dissolveHeat) beaker.addHeat(s.dissolveHeat);
        note(esc(s.inWater || `Добавили: ${s.name.toLowerCase()}.`));
        emit({ type: "dissolve", id });
      }
    }
    refresh();
  }

  const ACTIONS = {
    ph() {
      const p = ph();
      if (p === null) { note("Мерить нечего: в стакане нет жидкости.", "hint"); return; }
      note(`<span class="strip" style="background:${stripColor(p)}"></span> Индикаторная полоска: <b>pH ≈ ${fmt(p, 1)}</b>, среда ${phWord(p)}.`);
      emit({ type: "ph", value: p });
    },
    heat() {
      if (!beaker.hasLiquid) { note("Нагревать пустой стакан незачем.", "hint"); return; }
      busy = true;
      beaker.heat(2.6);
      note("Нагреваем до кипения…");
      setTimeout(() => {
        busy = false;
        if (!tryReactions(null, true)) note("Вода покипела и остыла. Больше ничего не изменилось.");
        emit({ type: "heat" });
        refresh();
      }, 2600);
    }
  };

  bindShelf(root, $(".bench", root), add);
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tool]");
    if (t && !busy) ACTIONS[t.dataset.tool]();
    if (e.target.closest('[data-act="empty"]') && !busy) {
      beaker.reset();
      units = {};
      added = {};
      note("Стакан чистый.");
      emit({ type: "empty" });
    }
  });
  note("Стакан чистый. Добавьте что-нибудь с полки.");
  return { add };
}
