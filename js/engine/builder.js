// Конструктор молекул: атом — шарик с «руками» (валентность).
// Нажмите атом, потом другой — появится связь; нажмите ещё раз — связь станет двойной.
// Нажатие на связь убирает её. Атомы можно перетаскивать.
import { ELEMENTS } from "../../data/elements.js";
import { MOLECULE_BY_KEY, compositionKey } from "../../data/molecules.js";
import { formulaHTML } from "./formula.js";
import { $, esc } from "../core/util.js";

const W = 600, H = 340;
const R = (el) => ELEMENTS[el].r * 58;

export function createBuilder(root, { palette = ["H", "C", "O"], onMolecule = () => {} } = {}) {
  root.innerHTML = `
    <div class="builder">
      <div class="palette" role="group" aria-label="Атомы">
        ${palette.map((el) => `<button type="button" class="pal-atom" data-el="${el}" style="--c:${ELEMENTS[el].color};--ink:${ELEMENTS[el].ink}">
          <span class="ball">${el}</span><small>${ELEMENTS[el].valence} ${hands(ELEMENTS[el].valence)}</small></button>`).join("")}
        <span class="pal-sep"></span>
        <button type="button" class="btn ghost small" data-act="del">✕ Убрать атом</button>
        <button type="button" class="btn ghost small" data-act="clear">Очистить</button>
      </div>
      <svg class="build-area" viewBox="0 0 ${W} ${H}" role="application" aria-label="Поле сборки молекул"></svg>
      <p class="build-status" aria-live="polite"></p>
      <div class="build-found"></div>
    </div>`;

  const svg = $(".build-area", root);
  const status = $(".build-status", root);
  const foundBox = $(".build-found", root);
  let atoms = [];
  let bonds = [];
  let selected = null;
  let nextId = 1;
  const found = new Set();

  const used = (id) => bonds.reduce((s, b) => s + (b.a === id || b.b === id ? b.o : 0), 0);
  const free = (a) => ELEMENTS[a.el].valence - used(a.id);
  const byId = (id) => atoms.find((a) => a.id === id);

  function addAtom(el) {
    // ставим новый атом в свободное место
    let best = null;
    for (let tries = 0; tries < 60; tries++) {
      const x = 60 + Math.random() * (W - 120), y = 50 + Math.random() * (H - 100);
      const d = Math.min(999, ...atoms.map((a) => Math.hypot(a.x - x, a.y - y)));
      if (!best || d > best.d) best = { x, y, d };
      if (d > 110) break;
    }
    const a = { id: nextId++, el, x: best.x, y: best.y };
    atoms.push(a);
    if (selected && free(byId(selected)) > 0) {
      // удобно: если выбран атом со свободной рукой — сразу присоединяем рядом
      const s = byId(selected);
      const ang = Math.random() * Math.PI * 2;
      a.x = clampX(s.x + Math.cos(ang) * 95);
      a.y = clampY(s.y + Math.sin(ang) * 95);
      bonds.push({ a: s.id, b: a.id, o: 1 });
    }
    render();
  }
  const clampX = (x) => Math.max(30, Math.min(W - 30, x));
  const clampY = (y) => Math.max(30, Math.min(H - 30, y));

  function bond(a, b) {
    if (free(a) < 1 || free(b) < 1) {
      const full = free(a) < 1 ? a : b;
      status.textContent = `У атома ${full.el} больше нет свободных рук: у него их всего ${ELEMENTS[full.el].valence}.`;
      return;
    }
    const ex = bonds.find((x) => (x.a === a.id && x.b === b.id) || (x.a === b.id && x.b === a.id));
    if (ex) {
      if (ex.o >= 3) return;
      ex.o++;
    } else bonds.push({ a: a.id, b: b.id, o: 1 });
  }

  // свободные «руки» рисуем в стороны, где нет связей
  function stubAngles(a) {
    const n = free(a);
    if (n <= 0) return [];
    const taken = bonds.filter((b) => b.a === a.id || b.b === a.id).map((b) => {
      const o = byId(b.a === a.id ? b.b : b.a);
      return Math.atan2(o.y - a.y, o.x - a.x);
    });
    const out = [];
    const cands = Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2 - Math.PI / 2);
    const dist = (x, y) => { const d = Math.abs(x - y) % (Math.PI * 2); return Math.min(d, Math.PI * 2 - d); };
    for (let k = 0; k < n; k++) {
      let best = cands[0], bestD = -1;
      for (const c of cands) {
        const d = Math.min(Math.PI, ...taken.map((t) => dist(c, t)), ...out.map((t) => dist(c, t)));
        if (d > bestD + 1e-6) { bestD = d; best = c; }
      }
      out.push(best);
    }
    return out;
  }

  function components() {
    const seen = new Set();
    const comps = [];
    for (const a of atoms) {
      if (seen.has(a.id)) continue;
      const stack = [a.id], ids = [];
      seen.add(a.id);
      while (stack.length) {
        const id = stack.pop();
        ids.push(id);
        bonds.forEach((b) => {
          const o = b.a === id ? b.b : b.b === id ? b.a : null;
          if (o && !seen.has(o)) { seen.add(o); stack.push(o); }
        });
      }
      comps.push(ids.map(byId));
    }
    return comps;
  }

  // Строение: для каждого «тяжёлого» атома (не H) — его соседи, например "C:CHHO"
  function structureKey(comp) {
    return comp.filter((a) => a.el !== "H").map((a) => {
      const nb = [];
      bonds.forEach((b) => {
        const o = b.a === a.id ? b.b : b.b === a.id ? b.a : null;
        if (o) for (let k = 0; k < b.o; k++) nb.push(byId(o).el);
      });
      return `${a.el}:${nb.sort().join("")}`;
    }).sort().join(" ");
  }

  function analyse() {
    if (!atoms.length) {
      status.textContent = "Нажмите на атом сверху, чтобы положить его на стол.";
      return;
    }
    const comps = components();
    const msgs = [];
    for (const comp of comps) {
      const counts = {};
      comp.forEach((a) => { counts[a.el] = (counts[a.el] || 0) + 1; });
      const freeHands = comp.reduce((s, a) => s + free(a), 0);
      if (freeHands > 0 || comp.length < 2) continue;
      const m = MOLECULE_BY_KEY[compositionKey(counts)];
      if (m && m.heavy && structureKey(comp) !== [...m.heavy].sort().join(" ")) {
        // состав верный, а атомы соединены иначе — это другое вещество (изомер)
        msgs.push(`Атомов столько же, сколько в молекуле «${m.name}», но соединены они по-другому. ${m.isomer || "Это другое вещество — изомер."} Попробуйте перестроить.`);
        continue;
      }
      if (m) {
        msgs.push(`✓ Готово: ${m.name}!`);
        if (!found.has(m.formula)) {
          found.add(m.formula);
          foundBox.insertAdjacentHTML("beforeend",
            `<div class="found-mol"><span class="found-f">${formulaHTML(m.formula, { colored: true })}</span><span><b>${esc(m.name)}</b>. ${esc(m.note)}</span></div>`);
        }
        onMolecule(m.formula);
      } else {
        msgs.push("Такая молекула возможна, но в нашем справочнике её нет.");
      }
    }
    const totalFree = atoms.reduce((s, a) => s + free(a), 0);
    if (msgs.length) status.textContent = msgs.join(" ") + (totalFree ? ` Ещё свободных рук на столе: ${totalFree}.` : "");
    else if (totalFree) status.textContent = `Свободных рук: ${totalFree}. Молекула готова, когда у каждого атома все руки заняты.`;
    else status.textContent = "Все руки заняты.";
  }

  function render() {
    let html = "";
    for (const b of bonds) {
      const a1 = byId(b.a), a2 = byId(b.b);
      const dx = a2.x - a1.x, dy = a2.y - a1.y, len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * 6, ny = (dx / len) * 6;
      const offs = b.o === 1 ? [0] : b.o === 2 ? [-0.6, 0.6] : [-1, 0, 1];
      html += `<g class="bond" data-a="${b.a}" data-b="${b.b}">
        <line class="bond-hit" x1="${a1.x}" y1="${a1.y}" x2="${a2.x}" y2="${a2.y}"/>
        ${offs.map((o) => `<line class="bond-line" x1="${a1.x + nx * o}" y1="${a1.y + ny * o}" x2="${a2.x + nx * o}" y2="${a2.y + ny * o}"/>`).join("")}
      </g>`;
    }
    for (const a of atoms) {
      const r = R(a.el);
      const el = ELEMENTS[a.el];
      html += `<g class="atom ${selected === a.id ? "sel" : ""} ${free(a) === 0 ? "full" : ""}" data-id="${a.id}" transform="translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})">
        ${stubAngles(a).map((ang) => `<line class="stub" x1="${(Math.cos(ang) * r).toFixed(1)}" y1="${(Math.sin(ang) * r).toFixed(1)}" x2="${(Math.cos(ang) * (r + 16)).toFixed(1)}" y2="${(Math.sin(ang) * (r + 16)).toFixed(1)}"/>
          <circle class="stub-end" r="3.5" cx="${(Math.cos(ang) * (r + 17)).toFixed(1)}" cy="${(Math.sin(ang) * (r + 17)).toFixed(1)}"/>`).join("")}
        <circle class="ball" r="${r}" fill="${el.color}"/>
        <circle class="shine" r="${(r * 0.2).toFixed(1)}" cx="${(-r * 0.55).toFixed(1)}" cy="${(-r * 0.5).toFixed(1)}"/>
        <text fill="${el.ink}" dy="0.36em" font-size="${a.el.length > 1 ? r * 0.8 : r * 0.95}">${a.el}</text>
      </g>`;
    }
    svg.innerHTML = html;
    analyse();
  }

  // ───── указатель: перетаскивание и нажатия ─────
  let drag = null;
  const toSvg = (e) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener("pointerdown", (e) => {
    const g = e.target.closest(".atom");
    if (!g) return;
    const p = toSvg(e);
    const a = byId(Number(g.dataset.id));
    drag = { a, dx: a.x - p.x, dy: a.y - p.y, sx: e.clientX, sy: e.clientY, moved: false };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
    if (!drag.moved) return;
    const p = toSvg(e);
    drag.a.x = clampX(p.x + drag.dx);
    drag.a.y = clampY(p.y + drag.dy);
    render();
  });
  svg.addEventListener("pointerup", (e) => {
    if (drag) {
      const { a, moved } = drag;
      drag = null;
      if (!moved) {
        if (selected === null) selected = a.id;
        else if (selected === a.id) selected = null;
        else { bond(byId(selected), a); selected = null; }
        render();
      }
      return;
    }
    const bg = e.target.closest(".bond");
    if (bg) {
      const b = bonds.find((x) => x.a === Number(bg.dataset.a) && x.b === Number(bg.dataset.b));
      b.o--;
      if (b.o <= 0) bonds = bonds.filter((x) => x !== b);
      render();
      return;
    }
    if (selected !== null) { selected = null; render(); }
  });

  root.addEventListener("click", (e) => {
    const pal = e.target.closest(".pal-atom");
    if (pal) addAtom(pal.dataset.el);
    const act = e.target.closest("[data-act]");
    if (!act) return;
    if (act.dataset.act === "clear") { atoms = []; bonds = []; selected = null; render(); }
    if (act.dataset.act === "del" && selected !== null) {
      atoms = atoms.filter((a) => a.id !== selected);
      bonds = bonds.filter((b) => b.a !== selected && b.b !== selected);
      selected = null;
      render();
    }
  });

  render();
}

function hands(n) {
  return n === 1 ? "рука" : n < 5 ? "руки" : "рук";
}
