// Интерактивные демонстрации к теории: масштаб, ионы, взаимодействие атомов, опыт Резерфорда.
// createDemo(root, kind, { onEvent }) — onEvent(строка) сообщает уроку, что ученик что-то увидел.
import { $, $$, esc, ease, lerp, reducedMotion } from "../core/util.js?v=13";
import { shellsOf } from "./atom.js?v=13";

const NS = "http://www.w3.org/2000/svg";

// Плавная анимация 0 → 1 за ms миллисекунд; при «уменьшить движение» — сразу в конец
function animate(ms, step) {
  return new Promise((done) => {
    if (reducedMotion()) { step(1); return done(); }
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      step(ease(t));
      if (t < 1) requestAnimationFrame(tick); else done();
    };
    requestAnimationFrame(tick);
  });
}

export function createDemo(root, kind, { onEvent = () => {} } = {}) {
  const make = DEMOS[kind];
  if (!make) throw new Error(`Нет демонстрации ${kind}`);
  make(root, onEvent);
}

// ───────────────────────── 1. Масштаб: от яблока до ядра ─────────────────────────
const LEVELS = [
  { name: "Яблоко", size: "8 см", m: 8e-2, color: "#d94a3d", note: "Обычный предмет. Будем увеличивать по шагу, каждый раз заглядывая в крошечную точку в центре." },
  { name: "Песчинка", size: "0,5 мм", m: 5e-4, color: "#d6b06a", note: "Видна глазом, но уже с трудом." },
  { name: "Эритроцит", size: "7 мкм", m: 7e-6, color: "#c0392b", note: "Красная клетка крови: 7 тысячных миллиметра. Видна только в микроскоп." },
  { name: "Вирус гриппа", size: "0,1 мкм", m: 1e-7, color: "#6aa84f", note: "Меньше длины волны видимого света — в обычный микроскоп его уже не разглядеть." },
  { name: "Молекула воды", size: "0,3 нм", m: 3e-10, color: "#2f7de1", note: "Три атома: два водорода и кислород. Нанометр — миллионная доля миллиметра." },
  { name: "Атом кислорода", size: "≈ 0,12 нм", m: 1.2e-10, color: "#9fb4ba", atom: true, note: "Вот он, атом. Почти весь его объём — облако из 8 лёгких электронов." },
  { name: "Ядро атома", size: "≈ 0,000006 нм", m: 6e-15, color: "#e0453a", nucleus: true, note: "Ядро в 20 000 раз меньше атома. Если раздуть атом до стадиона (200 м), ядро будет с горошину в центре поля. Но в нём почти вся масса атома." }
];

function scaleDemo(root, onEvent) {
  let k = 0;
  let busy = false;
  root.innerHTML = `
    <div class="demo demo-scale">
      <svg viewBox="-200 -170 400 340" class="demo-svg" role="img" aria-label="Масштаб"></svg>
      <div class="demo-side">
        <p class="scale-name" aria-live="polite"></p>
        <p class="scale-note"></p>
        <div class="row">
          <button type="button" class="btn" data-act="zoom">Увеличить 🔍</button>
          <button type="button" class="btn ghost small" data-act="reset">С начала</button>
        </div>
        <ol class="scale-path"></ol>
      </div>
    </div>`;
  const svg = $("svg", root);
  const R = 140;

  // объект: круг с подписью; атом — облако с ядром; ядро — шарик из протонов и нейтронов
  function shape(lv, r, opacity = 1) {
    if (r < 1.5) r = 1.5;
    if (lv.nucleus) {
      let s = "";
      for (let i = 0; i < 16; i++) {
        const rr = r * 0.32 * Math.sqrt(i + 0.5) / 2.2, a = i * 2.4;
        s += `<circle r="${(r * 0.26).toFixed(1)}" cx="${(rr * Math.cos(a)).toFixed(1)}" cy="${(rr * Math.sin(a)).toFixed(1)}" fill="${i % 2 ? "#8d999e" : "#e0453a"}" stroke="rgba(0,0,0,.25)"/>`;
      }
      return `<g opacity="${opacity}">${s}</g>`;
    }
    if (lv.atom) {
      return `<g opacity="${opacity}"><circle r="${r}" fill="url(#cloud)"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i * 0.785 + 0.3, rr = r * (i < 2 ? 0.3 : 0.75); return `<circle r="${Math.max(1, r * 0.035).toFixed(1)}" cx="${(rr * Math.cos(a)).toFixed(1)}" cy="${(rr * Math.sin(a)).toFixed(1)}" fill="#2f7de1"/>`; }).join("")}
        <circle r="${Math.max(1, r * 0.02).toFixed(1)}" fill="#e0453a"/></g>`;
    }
    if (lv.name === "Молекула воды") {
      return `<g opacity="${opacity}"><circle r="${r * 0.55}" fill="#d23c32"/><circle r="${r * 0.36}" cx="${-r * 0.55}" cy="${r * 0.45}" fill="#e8eef0" stroke="#8d969a"/><circle r="${r * 0.36}" cx="${r * 0.55}" cy="${r * 0.45}" fill="#e8eef0" stroke="#8d969a"/></g>`;
    }
    return `<circle r="${r}" fill="${lv.color}" opacity="${opacity}" stroke="rgba(0,0,0,.2)"/>`;
  }

  function draw(cur, next, t) {
    // t: 0 — видим текущий объект, 1 — следующий заполнил экран
    const ratio = next ? cur.m / next.m : 1;
    const zoom = Math.pow(ratio, t);                 // логарифмическое приближение
    const rCur = R * zoom;
    const rNext = next ? (R / ratio) * zoom : 0;
    svg.innerHTML = `<defs><radialGradient id="cloud"><stop offset="0" stop-color="#2f7de1" stop-opacity=".35"/><stop offset="1" stop-color="#2f7de1" stop-opacity="0"/></radialGradient></defs>
      ${rCur < 4000 ? shape(cur, rCur, 1 - t * 0.85) : ""}
      ${next ? shape(next, rNext, 0.4 + t * 0.6) : ""}
      ${next && t === 0 ? `<circle r="10" fill="none" stroke="var(--amber)" stroke-width="2" stroke-dasharray="3 3"/><text y="-16" text-anchor="middle" class="demo-label">${esc(next.name.toLowerCase())} — где-то здесь</text>` : ""}`;
  }

  function show() {
    const lv = LEVELS[k];
    const next = LEVELS[k + 1];
    draw(lv, next, 0);
    $(".scale-name", root).innerHTML = `<b>${esc(lv.name)}</b> · ${esc(lv.size)}`;
    $(".scale-note", root).textContent = lv.note;
    $(".scale-path", root).innerHTML = LEVELS.slice(0, k + 1).map((l, i) => `<li>${esc(l.name)} — ${esc(l.size)}${i ? ` <span class="muted">(меньше в ${fmtRatio(LEVELS[i - 1].m / l.m)})</span>` : ""}</li>`).join("");
    const btn = $("[data-act=zoom]", root);
    btn.disabled = !next;
    btn.textContent = next ? `Увеличить в ${fmtRatio(lv.m / next.m)} 🔍` : "Дальше некуда";
    if (lv.atom) onEvent("atom");
    if (lv.nucleus) onEvent("nucleus");
  }

  root.addEventListener("click", async (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act || busy) return;
    if (act === "reset") { k = 0; return show(); }
    const cur = LEVELS[k], next = LEVELS[k + 1];
    if (!next) return;
    busy = true;
    await animate(1400, (t) => draw(cur, next, t));
    k++;
    busy = false;
    show();
  });
  show();
}

// «в 160 раз», «в 2,5 раза», «в 71 раз»
function fmtRatio(x) {
  const v = x >= 100 ? Math.round(x / 10) * 10 : x >= 10 ? Math.round(x) : Math.round(x * 10) / 10;
  const word = !Number.isInteger(v) ? "раза" : (v % 10 >= 2 && v % 10 <= 4 && (v % 100 < 12 || v % 100 > 14)) ? "раза" : "раз";
  return `${v.toLocaleString("ru-RU")} ${word}`;
}

// ───────────────────────── 2. Ионы: отнять или добавить электрон ─────────────────────────
const ION_ELEMENTS = [
  { s: "Li", z: 3, name: "литий", gen: "лития" },
  { s: "Na", z: 11, name: "натрий", gen: "натрия" },
  { s: "Mg", z: 12, name: "магний", gen: "магния" },
  { s: "O", z: 8, name: "кислород", gen: "кислорода" },
  { s: "F", z: 9, name: "фтор", gen: "фтора" },
  { s: "Cl", z: 17, name: "хлор", gen: "хлора" }
];
const RADII = [46, 78, 110];

function ionDemo(root, onEvent) {
  let el = ION_ELEMENTS[0];
  let e = el.z;
  root.innerHTML = `
    <div class="demo demo-ion">
      <div class="chips" role="group" aria-label="Элемент">
        ${ION_ELEMENTS.map((x) => `<button type="button" class="chip-btn" data-el="${x.s}">${x.s} · ${x.name}</button>`).join("")}
      </div>
      <div class="demo-row">
        <svg viewBox="-130 -130 260 260" class="demo-svg ion-svg" role="img" aria-label="Атом"></svg>
        <div class="demo-side">
          <p class="ion-symbol" aria-live="polite"></p>
          <dl class="ion-dl"></dl>
          <div class="row">
            <button type="button" class="btn" data-d="-1">− Отнять электрон</button>
            <button type="button" class="btn" data-d="1">+ Добавить электрон</button>
          </div>
          <p class="ion-msg"></p>
        </div>
      </div>
    </div>`;
  const svg = $("svg", root);

  function render(flyOut = false) {
    const shells = shellsOf(e);
    const charge = el.z - e;
    const outer = shells.length ? shells[shells.length - 1] : 0;
    const cap = shells.length === 1 ? 2 : 8;
    const full = outer === cap;
    let html = "";
    shells.forEach((n, si) => {
      const r = RADII[si];
      html += `<circle r="${r}" class="shell"/>`;
      let dots = "";
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        dots += `<circle class="electron ${si === shells.length - 1 ? "outer" : ""}" r="7" cx="${(r * Math.cos(a)).toFixed(1)}" cy="${(r * Math.sin(a)).toFixed(1)}"/>`;
      }
      html += `<g class="spin" style="animation-duration:${8 + si * 6}s">${dots}</g>`;
    });
    html += `<circle r="24" class="nucleus-ball"/><text dy="0.35em" text-anchor="middle" class="nucleus-text">+${el.z}</text>`;
    if (flyOut) html += `<circle class="electron outer flyout" r="7" cx="${RADII[shells.length] || 120}" cy="0"/>`;
    svg.innerHTML = html;
    svg.classList.toggle("pos", charge > 0);
    svg.classList.toggle("neg", charge < 0);

    const sign = charge > 0 ? "+" : "−";
    const sup = charge ? `<sup>${Math.abs(charge) > 1 ? Math.abs(charge) : ""}${sign}</sup>` : "";
    $(".ion-symbol", root).innerHTML = `<span class="big-symbol">${el.s}${sup}</span> ${charge ? `ион ${el.gen}` : `атом: ${el.name}`}`;
    $(".ion-dl", root).innerHTML = `
      <dt>Протонов (+)</dt><dd>${el.z}</dd>
      <dt>Электронов (−)</dt><dd>${e}</dd>
      <dt>Заряд</dt><dd>${charge === 0 ? "0 — плюсы и минусы уравновешены" : `${charge > 0 ? "+" : "−"}${Math.abs(charge)}`}</dd>
      <dt>Внешний слой</dt><dd>${outer} из ${cap}${full ? " — заполнен ✓" : ""}</dd>`;
    let msg;
    if (full && charge !== 0) msg = `Внешний слой заполнен — это устойчивое состояние. Именно таким ионом ${el.name} и бывает в веществах.`;
    else if (full) msg = "Внешний слой заполнен.";
    else if (Math.abs(charge) > 2) msg = "Так далеко заходить не стоит: чем больше заряд, тем сильнее атом сопротивляется. В веществах таких ионов не бывает.";
    else msg = outer <= 3
      ? `Снаружи всего ${outer} — проще отдать ${outer === 1 ? "его" : "их"}, чем найти ещё ${cap - outer}.`
      : `Снаружи ${outer} из ${cap} — проще забрать ${cap - outer === 1 ? "ещё один" : `ещё ${cap - outer}`}, чем отдать ${outer}.`;
    $(".ion-msg", root).textContent = msg;
    $$(".chip-btn", root).forEach((b) => b.classList.toggle("on", b.dataset.el === el.s));
    if (charge !== 0) onEvent(`${el.s}${Math.abs(charge) > 1 ? Math.abs(charge) : ""}${charge > 0 ? "+" : "-"}`);
  }

  root.addEventListener("click", (ev) => {
    const chip = ev.target.closest(".chip-btn");
    if (chip) { el = ION_ELEMENTS.find((x) => x.s === chip.dataset.el); e = el.z; return render(); }
    const b = ev.target.closest("[data-d]");
    if (!b) return;
    const d = Number(b.dataset.d);
    const ne = Math.max(Math.max(0, el.z - 3), Math.min(el.z + 3, e + d));
    if (ne === e) return;
    e = ne;
    render(d < 0);
  });
  render();
}

// ───────────────────────── 3. Как атомы взаимодействуют ─────────────────────────
function interactDemo(root, onEvent) {
  root.innerHTML = `
    <div class="demo demo-interact">
      <div class="chips" role="tablist">
        <button type="button" class="chip-btn on" data-tab="charges">1. Плюс и минус</button>
        <button type="button" class="chip-btn" data-tab="ionic">2. Отдать и забрать</button>
        <button type="button" class="chip-btn" data-tab="covalent">3. Поделиться</button>
      </div>
      <svg viewBox="0 0 600 240" class="demo-svg wide" role="img" aria-label="Взаимодействие"></svg>
      <p class="demo-caption" aria-live="polite"></p>
      <div class="row demo-buttons"></div>
    </div>`;
  const svg = $("svg", root);
  const caption = $(".demo-caption", root);
  const buttons = $(".demo-buttons", root);
  let tab = "charges";
  let busy = false;

  // ── 1. заряды ──
  const ch = { a: 1, b: -1, xa: 170, xb: 430 };
  function drawCharges() {
    const ball = (x, s) => `<g class="charge ${s > 0 ? "pos" : "neg"}" data-ball="${x === ch.xa ? "a" : "b"}" transform="translate(${x} 120)" style="cursor:pointer">
      <circle r="38"/><text dy="0.35em" text-anchor="middle">${s > 0 ? "+" : "−"}</text></g>`;
    svg.innerHTML = ball(ch.xa, ch.a) + ball(ch.xb, ch.b) + `<text x="300" y="225" text-anchor="middle" class="demo-label">нажмите на шарик, чтобы сменить заряд</text>`;
  }
  async function releaseCharges() {
    const same = ch.a === ch.b;
    const [a0, b0] = [ch.xa, ch.xb];
    const [a1, b1] = same ? [60, 540] : [262, 338];
    await animate(900, (t) => { ch.xa = lerp(a0, a1, t); ch.xb = lerp(b0, b1, t); drawCharges(); });
    caption.innerHTML = same
      ? "<b>Одинаковые заряды оттолкнулись.</b> Поэтому электроны держатся порознь, а ядра двух атомов не слипаются."
      : "<b>Разные заряды притянулись.</b> Эта сила держит электроны возле ядра, а ионы Na⁺ и Cl⁻ — в кристалле соли.";
    onEvent(same ? "repel" : "attract");
  }

  // ── 2 и 3. два атома: рисуем внешний слой и «остов» (ядро + внутренние электроны) ──
  const atomSVG = (x, label, coreText, r, electrons, cls = "") => `
    <g transform="translate(${x} 115)" class="${cls}">
      <circle r="${r}" class="shell"/>
      <circle r="24" class="nucleus-ball"/><text dy="0.35em" text-anchor="middle" class="nucleus-text small">${coreText}</text>
      <text y="${r + 26}" text-anchor="middle" class="demo-label big">${label}</text>
    </g>${electrons}`;
  const eDot = (x, y, cls = "") => `<circle class="electron outer ${cls}" r="7" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"/>`;
  const ring = (cx, r, n, skip = -1, offset = 0) => {
    let s = "";
    for (let i = 0; i < n; i++) if (i !== skip) {
      const a = (i / n) * Math.PI * 2 + offset;
      s += eDot(cx + r * Math.cos(a), 115 + r * Math.sin(a));
    }
    return s;
  };

  let ionic = { dx: 0, t: 0, done: false };
  function drawIonic() {
    const xNa = 170 + ionic.dx, xCl = 430 - ionic.dx;
    // у Na один внешний электрон (справа), у Cl — 7 из 8, свободное место слева
    const travel = ionic.t;
    const ex = lerp(xNa + 55, xCl - 62, travel), ey = 115 - Math.sin(travel * Math.PI) * 50;
    const naLabel = ionic.done ? "Na⁺" : "Na";
    const clLabel = ionic.done ? "Cl⁻" : "Cl";
    svg.innerHTML =
      atomSVG(xNa, naLabel, "+11, 10e", ionic.done ? 30 : 55, "") +
      atomSVG(xCl, clLabel, "+17, 10e", 62, ring(xCl, 62, 8, 4)) +
      eDot(ex, ey, "moving") +
      (ionic.done ? `<text x="300" y="30" text-anchor="middle" class="demo-label big">+  притягиваются  −</text>` : "");
  }
  async function runIonic() {
    ionic = { dx: 0, t: 0, done: false };
    await animate(700, (t) => { ionic.dx = 40 * t; drawIonic(); });
    await animate(1100, (t) => { ionic.t = t; drawIonic(); });
    ionic.done = true;
    await animate(600, (t) => { ionic.dx = 40 + 20 * t; drawIonic(); });
    caption.innerHTML = "<b>Натрий отдал свой единственный внешний электрон хлору.</b> У Na⁺ теперь снаружи заполненный слой из 8 (бывший внутренний), у Cl⁻ — 8 из 8. Оба стали ионами с разными зарядами и притянулись. Это <b>ионная связь</b> — так устроена поваренная соль.";
    onEvent("ionic");
  }

  let cov = { dx: 0, t: 0 };
  function drawCovalent() {
    const xa = 200 + cov.dx, xb = 400 - cov.dx;
    const mid = (xa + xb) / 2;
    // электроны съезжают в область между ядрами
    const e1 = [lerp(xa - 46, mid, cov.t), lerp(115, 105, cov.t)];
    const e2 = [lerp(xb + 46, mid, cov.t), lerp(115, 125, cov.t)];
    svg.innerHTML =
      atomSVG(xa, cov.t === 1 ? "" : "H", "+1", 46, "") +
      atomSVG(xb, cov.t === 1 ? "" : "H", "+1", 46, "") +
      (cov.t === 1 ? `<ellipse cx="${mid}" cy="115" rx="22" ry="34" class="pair-glow"/><text x="${mid}" y="196" text-anchor="middle" class="demo-label big">H₂: общая пара</text>` : "") +
      eDot(...e1, "moving") + eDot(...e2, "moving");
  }
  async function runCovalent() {
    cov = { dx: 0, t: 0 };
    await animate(900, (t) => { cov.dx = 62 * t; drawCovalent(); });
    await animate(900, (t) => { cov.t = t; drawCovalent(); });
    cov.t = 1; drawCovalent();
    caption.innerHTML = "<b>Оба водорода тянут к себе оба электрона.</b> Ни один не может забрать чужой целиком, и пара встаёт между ядрами — её притягивают сразу оба. У каждого атома теперь «как бы» 2 электрона: слой заполнен. Это <b>ковалентная связь</b>, молекула H₂.";
    onEvent("covalent");
  }

  const TABS = {
    charges: {
      text: "Две заряженные частицы. Выберите знаки зарядов и отпустите их.",
      buttons: [["Отпустить", releaseCharges], ["Вернуть", () => { ch.xa = 170; ch.xb = 430; drawCharges(); }]],
      draw: () => { ch.xa = 170; ch.xb = 430; drawCharges(); }
    },
    ionic: {
      text: "Натрий: снаружи один электрон. Хлор: 7 из 8. Сблизьте их.",
      buttons: [["Сблизить", runIonic], ["Заново", () => { ionic = { dx: 0, t: 0, done: false }; drawIonic(); }]],
      draw: () => { ionic = { dx: 0, t: 0, done: false }; drawIonic(); }
    },
    covalent: {
      text: "Два атома водорода, у каждого один электрон. Отдавать некому: оба одинаково «жадные». Сблизьте их.",
      buttons: [["Сблизить", runCovalent], ["Заново", () => { cov = { dx: 0, t: 0 }; drawCovalent(); }]],
      draw: () => { cov = { dx: 0, t: 0 }; drawCovalent(); }
    }
  };
  function openTab(name) {
    tab = name;
    const T = TABS[name];
    $$(".chip-btn", root).forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
    caption.textContent = T.text;
    buttons.innerHTML = T.buttons.map(([label], i) => `<button type="button" class="btn ${i ? "ghost small" : ""}" data-b="${i}">${label}</button>`).join("");
    T.draw();
  }
  root.addEventListener("click", async (ev) => {
    if (busy) return;
    const t = ev.target.closest("[data-tab]");
    if (t) return openTab(t.dataset.tab);
    const ball = ev.target.closest("[data-ball]");
    if (ball && tab === "charges") { ch[ball.dataset.ball] *= -1; return drawCharges(); }
    const b = ev.target.closest("[data-b]");
    if (b) {
      busy = true;
      $$("button", root).forEach((x) => (x.disabled = true));
      try { await TABS[tab].buttons[Number(b.dataset.b)][1](); } finally {
        busy = false;
        $$("button", root).forEach((x) => (x.disabled = false));
      }
    }
  });
  openTab("charges");
}

// ───────────────────────── 4. Опыт Резерфорда: золотая фольга ─────────────────────────
function rutherfordDemo(root, onEvent) {
  root.innerHTML = `
    <div class="demo demo-ruth">
      <svg viewBox="0 0 600 300" class="demo-svg wide" role="img" aria-label="Опыт Резерфорда"></svg>
      <div class="row">
        <button type="button" class="btn" data-act="fire">Выпустить 50 частиц</button>
        <button type="button" class="btn ghost small" data-act="zoom">Что внутри фольги?</button>
      </div>
      <p class="ruth-count" aria-live="polite"></p>
      <p class="ruth-zoom" hidden></p>
    </div>`;
  const svg = $("svg", root);
  const FOIL = 330;
  const SPACING = 14;     // расстояние между ядрами по вертикали (условно)
  const K = 0.05;         // «сила» ядра: в модели отражается ~1 частица из 140 (в опыте — 1 из ~8000)
  let parts = [];         // летящие частицы
  let trails = [];        // следы прошедших
  let fired = 0, straight = 0, bent = 0, back = 0;
  let running = false;
  let last = 0;

  svg.innerHTML = `
    <rect x="10" y="125" width="70" height="50" rx="8" class="ruth-source"/><text x="45" y="155" text-anchor="middle" class="demo-label">источник</text>
    <rect x="${FOIL - 3}" y="20" width="6" height="260" class="ruth-foil"/><text x="${FOIL}" y="14" text-anchor="middle" class="demo-label">золотая фольга</text>
    <g class="trails"></g><g class="flying"></g>`;
  const gTrails = $(".trails", svg), gFly = $(".flying", svg);

  function launch(n) {
    for (let i = 0; i < n; i++) {
      const y = 140 + (Math.random() - 0.5) * 30;        // узкий пучок
      // прицельное расстояние до ближайшего ядра в фольге — случайное от 0 до SPACING/2
      let b = Math.random() * (SPACING / 2);
      if (fired + i > 220 && back === 0 && i === 0) b = K * 0.4;   // чтобы чудо точно случилось
      const theta = 2 * Math.atan(K / b) * (Math.random() < 0.5 ? 1 : -1);
      parts.push({ x: 80 - i * 9, y, theta, turned: false, path: [[80, y]] });
    }
    fired += n;
    if (!running) { last = performance.now(); requestAnimationFrame(loop); running = true; }
  }

  // скорость — от прошедшего времени, а не от числа кадров: в фоновой вкладке кадры реже
  function loop(now = performance.now()) {
    running = true;
    const dt = Math.min(250, Math.max(0, now - last));
    last = now;
    const speed = reducedMotion() ? 600 : dt * 0.36;
    let html = "";
    parts = parts.filter((p) => {
      if (!p.turned && p.x + speed >= FOIL) {
        p.x = FOIL; p.turned = true; p.path.push([p.x, p.y]);
        const deg = Math.abs(p.theta) * 180 / Math.PI;
        if (deg > 90) { back++; onEvent("back"); } else if (deg > 10) bent++; else straight++;
        p.vx = Math.cos(p.theta); p.vy = Math.sin(p.theta);
      } else if (p.turned) { p.x += p.vx * speed; p.y += p.vy * speed; } else p.x += speed;
      const out = p.turned && (p.x < 0 || p.x > 600 || p.y < 0 || p.y > 300);
      if (out) {
        p.path.push([Math.max(0, Math.min(600, p.x)), Math.max(0, Math.min(300, p.y))]);
        const deg = Math.abs(p.theta) * 180 / Math.PI;
        trails.push(`<polyline points="${p.path.map((q) => q.map((v) => v.toFixed(0)).join(",")).join(" ")}" class="ruth-trail ${deg > 90 ? "back" : deg > 10 ? "bent" : ""}"/>`);
        if (trails.length > 120) trails.shift();
        return false;
      }
      if (p.x > 80) html += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" class="ruth-alpha"/>`;
      return true;
    });
    gFly.innerHTML = html;
    gTrails.innerHTML = trails.join("");
    $(".ruth-count", root).innerHTML = `Выпущено: <b>${fired}</b> · прошли прямо: <b>${straight}</b> · отклонились больше чем на 10°: <b>${bent}</b> · <span class="${back ? "hot" : ""}">отскочили назад: <b>${back}</b></span>`;
    if (fired >= 200) onEvent("many");
    if (parts.length) requestAnimationFrame(loop); else running = false;
  }

  root.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "fire") launch(50);
    if (act === "zoom") {
      const z = $(".ruth-zoom", root);
      z.hidden = false;
      z.innerHTML = "Фольга толщиной в тысячи атомов, но почти вся она — <b>пустота</b>. Электроны слишком лёгкие и тяжёлую α-частицу не остановят. Отбросить её назад может только крошечное, тяжёлое и плюсовое <b>ядро</b>, и только если частица летит почти точно в него. Поэтому таких случаев так мало.";
      onEvent("zoom");
    }
  });
  loop();
}

const DEMOS = { scale: scaleDemo, ion: ionDemo, interact: interactDemo, rutherford: rutherfordDemo };
