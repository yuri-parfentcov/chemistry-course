// Разделение смесей: полка + инструменты (перемешать, отстоять, фильтр, делительная воронка,
// прокипятить, выпарить). Поведение каждого вещества задаёт поле sep в data/substances.js.
// После каждого действия урок получает снимок состояния и сам проверяет свои цели.
import { SUBSTANCES } from "../../data/substances.js?v=13";
import { createBeaker } from "./lab-macro.js?v=13";
import { jarHTML, bindShelf } from "./lab.js?v=13";
import { $, esc } from "../core/util.js?v=13";

const CAPACITY = 4;
const TOOLS = {
  stir: { icon: "🥄", name: "Перемешать" },
  settle: { icon: "⏳", name: "Отстоять" },
  filter: { icon: "🧻", name: "Профильтровать" },
  funnel: { icon: "🔻", name: "Слить нижний слой" },
  boil: { icon: "🔥", name: "Прокипятить" },
  evaporate: { icon: "♨️", name: "Выпарить досуха" }
};

// toolLabels — свои подписи инструментов для конкретного урока, например { filter: "…" }
export function createSeparator(root, { shelf, tools, toolLabels = {}, onChange = () => {} }) {
  root.innerHTML = `
    <div class="lab sep">
      <div class="shelf" role="group" aria-label="Полка">${shelf.map(jarHTML).join("")}</div>
      <div class="bench">
        <canvas class="beaker" width="320" height="300" aria-label="Стакан"></canvas>
        <div class="tools" role="group" aria-label="Инструменты">
          ${tools.map((t) => `<button type="button" class="btn small tool" data-tool="${t}">${TOOLS[t].icon} ${toolLabels[t] || TOOLS[t].name}</button>`).join("")}
          <button type="button" class="btn ghost small" data-act="empty">🧽 Вылить и помыть</button>
        </div>
      </div>
      <div class="products" aria-live="polite"></div>
      <ol class="lab-log" aria-live="polite"></ol>
    </div>`;

  const beaker = createBeaker($(".beaker", root));
  const log = $(".lab-log", root);
  const productsBox = $(".products", root);

  // c[id] = { amt, st }; st: dry | wet | dissolved | suspended | settled | hazy | crystals | mixed | layer
  let c = {};
  let products = [];
  let busy = false;

  const sep = (id) => SUBSTANCES[id].sep;
  const has = (pred) => Object.entries(c).some(([id, v]) => v.amt > 0 && pred(sep(id), v, id));
  const water = () => (c.water ? c.water.amt : 0);
  const liquids = () => Object.entries(c).filter(([id, v]) => v.amt > 0 && ["solvent", "immiscible"].includes(sep(id).type));
  const liquidAmt = () => liquids().reduce((s, [, v]) => s + v.amt, 0);
  const name = (id) => SUBSTANCES[id].name.toLowerCase();

  function note(text, kind = "") {
    const li = document.createElement("li");
    li.className = kind;
    li.textContent = text;
    log.prepend(li);
    while (log.children.length > 6) log.lastChild.remove();
  }

  function snapshot(tool) {
    const s = { tool, products: [...products], has: {} };
    for (const [id, v] of Object.entries(c)) if (v.amt > 0) s.has[id] = v.st;
    s.water = water();
    return s;
  }

  function render() {
    const imm = Object.entries(c).find(([id, v]) => v.amt > 0 && sep(id).type === "immiscible");
    const liq = liquidAmt();
    const scene = { portions: liq, turbid: 0, sediment: null, layer: null, crystals: null, microbes: 0, pile: 0 };
    if (liq) scene.rgb = water() ? SUBSTANCES.water.color : SUBSTANCES[imm[0]].color;
    if (imm && water()) {
      scene.layer = imm[1].st === "mixed"
        ? { emulsion: true, rgb: SUBSTANCES[imm[0]].color }
        : { frac: imm[1].amt / liq, rgb: SUBSTANCES[imm[0]].color };
    }
    let sedAmt = 0, sedColor = null, pileAmt = 0, pileColor = null;
    for (const [id, v] of Object.entries(c)) {
      if (!v.amt) continue;
      const t = sep(id).type;
      if (t === "microbes") { scene.microbes = liq ? 1 : 0; continue; }
      if (v.st === "suspended") scene.turbid = Math.max(scene.turbid, sep(id).settle === "slow" ? 1 : 0.55);
      if (v.st === "hazy") { scene.turbid = Math.max(scene.turbid, 0.5); sedAmt += 0.3; sedColor = sedColor || SUBSTANCES[id].color; }
      if (v.st === "settled") { sedAmt += 0.6; sedColor = SUBSTANCES[id].color; }
      if (v.st === "dry" || v.st === "wet") { pileAmt += 0.5; pileColor = SUBSTANCES[id].color; }
      if (v.st === "crystals") scene.crystals = { amt: 0.8, rgb: SUBSTANCES[id].color };
    }
    if (sedAmt) scene.sediment = { amt: Math.min(1, sedAmt), rgb: sedColor };
    if (pileAmt) { scene.pile = Math.min(1, pileAmt); scene.pileRgb = pileColor; }
    beaker.setScene(scene);

    productsBox.innerHTML = products.length
      ? `<span class="muted">Получено:</span> ${products.map((p) => `<span class="product">${esc(p)}</span>`).join("")}`
      : "";
  }

  function changed(tool) {
    render();
    onChange(snapshot(tool));
  }

  function add(id) {
    if (busy) return;
    const s = SUBSTANCES[id];
    const parts = s.mix || { [id]: 1 };
    const addLiquid = Object.keys(parts).filter((p) => ["solvent", "immiscible"].includes(sep(p).type)).reduce((n, p) => n + parts[p], 0);
    if (liquidAmt() + addLiquid > CAPACITY) { note("Стакан полон. Вылейте его, чтобы начать заново.", "hint"); return; }
    const wasWater = water() > 0;
    for (const [pid, amt] of Object.entries(parts)) {
      const t = sep(pid);
      const cur = c[pid] || { amt: 0, st: "" };
      cur.amt += amt;
      if (t.type === "soluble") cur.st = wasWater || parts.water ? "dissolved" : "dry";
      if (t.type === "insoluble") cur.st = (wasWater || parts.water) ? (t.settle === "slow" ? "suspended" : "settled") : "dry";
      if (t.type === "immiscible") cur.st = s.shaken ? "mixed" : "layer";
      if (t.type === "solvent") cur.st = "liquid";
      if (t.type === "microbes") cur.st = "alive";
      c[pid] = cur;
    }
    // вода попала на сухие вещества
    if (id === "water" || parts.water) {
      for (const [pid, v] of Object.entries(c)) {
        if (v.st !== "dry" || !v.amt) continue;
        v.st = sep(pid).type === "soluble" ? "wet" : "settled";
      }
    }
    if (s.state === "liquid") note(s.pour || `Налили: ${name(id)}.`);
    else if (!water()) note(`${s.name} лежит на дне сухого стакана.`);
    else if (s.inWater) note(s.inWater);
    else if (sep(id) && sep(id).type === "insoluble") note(`${s.name} не растворяется и опускается на дно.`);
    else note(`Насыпали: ${name(id)}.`);
    if (id === "water" && has((t, v) => v.st === "wet")) note("Часть вещества на дне ещё не растворилась. Помешайте!", "hint");
    changed("add");
  }

  const ACTIONS = {
    stir() {
      if (!liquidAmt()) return note("Нечего перемешивать: в стакане нет жидкости.", "hint");
      const msgs = [];
      for (const [id, v] of Object.entries(c)) {
        if (!v.amt) continue;
        const t = sep(id).type;
        if (t === "soluble" && v.st === "wet" && water()) { v.st = "dissolved"; msgs.push(`Растворилось: ${name(id)}.`); }
        if (t === "insoluble" && ["settled", "hazy"].includes(v.st)) { v.st = "suspended"; msgs.push(`Со дна поднялась муть: ${name(id)}.`); }
        if (t === "immiscible" && v.st === "layer" && water()) { v.st = "mixed"; msgs.push(`Получились капли (${name(id)}), но с водой это не смешалось.`); }
      }
      note(msgs.length ? msgs.join(" ") : "Перемешали. Ничего не изменилось.");
    },
    settle() {
      if (!liquidAmt()) return note("Отстаивают жидкость, а в стакане её нет.", "hint");
      const msgs = [];
      for (const [id, v] of Object.entries(c)) {
        if (!v.amt) continue;
        const t = sep(id);
        if (t.type === "insoluble" && v.st === "suspended") {
          v.st = t.settle === "slow" ? "hazy" : "settled";
          msgs.push(t.settle === "slow" ? "Крупная муть осела, но вода всё ещё мутноватая: мелкие частицы оседают часами." : `Быстро осело на дно: ${name(id)}.`);
        } else if (t.type === "insoluble" && v.st === "hazy") {
          msgs.push("Мелкая муть почти не оседает. Ждать придётся долго: лучше профильтровать.");
        }
        if (t.type === "immiscible" && v.st === "mixed") {
          v.st = "layer";
          msgs.push(`Капли собрались в слой и всплыли: ${name(id)} легче воды (${String(t.density).replace(".", ",")} г/мл против 1 г/мл).`);
        }
      }
      if (has((t, v) => t.type === "microbes")) msgs.push("Микробы не оседают: они слишком мелкие и плавают сами.");
      note(msgs.length ? msgs.join(" ") : "Подождали. Ничего не изменилось: оседать нечему.");
    },
    filter() {
      if (!liquidAmt()) return note("Фильтруют жидкость. Сначала налейте воды.", "hint");
      const kept = [];
      for (const [id, v] of Object.entries(c)) {
        if (!v.amt) continue;
        const t = sep(id).type;
        if (t === "insoluble" || (t === "soluble" && v.st === "wet")) { kept.push(SUBSTANCES[id].name.toLowerCase()); v.amt = 0; }
      }
      const msgs = [];
      if (kept.length) {
        products.push(`на фильтре: ${kept.join(", ")}`);
        msgs.push(`На фильтре осталось: ${kept.join(", ")}. Жидкость прошла насквозь и стала прозрачной.`);
      } else msgs.push("Через фильтр всё прошло: задерживать было нечего.");
      if (has((t) => t.type === "soluble")) msgs.push("Растворённое вещество прошло вместе с водой: фильтр ловит только нерастворимые частицы.");
      if (has((t) => t.type === "microbes")) msgs.push("Осторожно: бумажный фильтр не задерживает бактерии, они намного мельче его пор.");
      if (has((t) => t.type === "immiscible") && water()) msgs.push("Обе жидкости прошли сквозь фильтр: жидкости фильтром не разделить.");
      note(msgs.join(" "), kept.length ? "reaction" : "");
    },
    funnel() {
      const imm = Object.entries(c).find(([id, v]) => v.amt > 0 && sep(id).type === "immiscible");
      if (!imm || !water()) return note("Делительная воронка нужна для двух несмешивающихся жидкостей. Здесь такой пары нет.", "hint");
      if (imm[1].st === "mixed") return note("Слоёв пока нет, жидкости перемешаны каплями. Сначала дайте отстояться.", "hint");
      products.push("вода (слита снизу)", `${SUBSTANCES[imm[0]].name.toLowerCase()} (остался сверху)`);
      for (const [id, v] of Object.entries(c)) if (id !== imm[0]) v.amt = 0;
      note(`Открыли кран снизу: вода тяжелее, поэтому стекла первой. В стакане осталось: ${name(imm[0])}, уже без воды.`, "reaction");
    },
    boil() {
      if (has((t) => t.flammable)) return danger();
      if (!water()) return note("Кипятить нечего: нет воды.", "hint");
      busy = true;
      beaker.heat(2.5);
      setTimeout(() => {
        busy = false;
        const killed = has((t) => t.type === "microbes");
        for (const [id, v] of Object.entries(c)) if (sep(id).type === "microbes") v.amt = 0;
        note(killed ? "Вскипятили: микробы погибли. Вода осталась, её можно пить, когда остынет." : "Покипятили. Вода стала горячей, больше ничего не изменилось.", killed ? "reaction" : "");
        changed("boil");
      }, 2500);
      return "async";
    },
    evaporate() {
      if (has((t) => t.flammable)) return danger();
      if (!water()) return note("Выпаривать нечего: в стакане нет воды.", "hint");
      busy = true;
      beaker.heat(3.2);
      setTimeout(() => {
        busy = false;
        c.water.amt = 0;
        const got = [];
        for (const [id, v] of Object.entries(c)) {
          if (!v.amt) continue;
          const t = sep(id).type;
          if (t === "soluble" && ["dissolved", "wet"].includes(v.st)) { v.st = "crystals"; got.push(SUBSTANCES[id].name.toLowerCase()); }
          if (t === "microbes") v.amt = 0;
          if (t === "insoluble") v.st = "settled";
        }
        if (got.length) products.push(`кристаллы: ${got.join(", ")}`);
        note(got.length
          ? `Вода выкипела, а растворённое осталось: на дне кристаллы (${got.join(", ")}).`
          : "Вода выкипела полностью. На дне ничего полезного, и пить теперь нечего.", got.length ? "reaction" : "hint");
        changed("evaporate");
      }, 3200);
      return "async";
    }
  };

  function danger() {
    note("⚠️ Стоп! Бензин нельзя нагревать на огне: его пары вспыхивают от искры. Горючие жидкости разделяют без нагрева.", "danger");
    onChange({ ...snapshot("danger") });
    return "async";
  }

  bindShelf(root, $(".bench", root), add);
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tool]");
    if (t && !busy) {
      const r = ACTIONS[t.dataset.tool]();
      if (r !== "async") changed(t.dataset.tool);
    }
    if (e.target.closest('[data-act="empty"]') && !busy) {
      c = {};
      products = [];
      beaker.reset();
      note("Стакан чистый.");
      changed("empty");
    }
  });

  note("Стакан чистый. Возьмите что-нибудь с полки.");
  render();
}
