// Плеер урока-миссии: шаги по порядку, «Дальше» открывается, когда шаг выполнен.
// Шаги-тренажёры (lab, separate, atom, build, balance, micro) показывают список целей
// и открывают теорию, когда цели выполнены.
import { LESSONS } from "../../data/course.js?v=11";
import { REACTIONS } from "../../data/reactions.js?v=11";
import { SPHERES } from "../../data/spheres.js?v=11";
import { CARDS } from "../../data/cards.js?v=11";
import { $, $$, esc } from "../core/util.js?v=11";
import { completeLesson, lessonStatus, nextLesson } from "../core/progress.js?v=11";
import { createLab } from "../engine/lab.js?v=11";
import { createSeparator } from "../engine/separate.js?v=11";
import { createMicro } from "../engine/lab-micro.js?v=11";
import { createCalc } from "../engine/calc.js?v=11";
import { createAtom } from "../engine/atom.js?v=11";
import { createBuilder } from "../engine/builder.js?v=11";
import { createBalancer } from "../engine/balancer.js?v=11";
import { createMixer } from "../engine/mixer.js?v=11";
import { createCell } from "../engine/cell.js?v=11";
import { createRate } from "../engine/rate.js?v=11";
import { createSort } from "../engine/sort.js?v=11";
import { createCombine } from "../engine/combine.js?v=11";
import { createMicelle } from "../engine/micelle.js?v=11";
import { equationHTML, } from "../engine/equation.js?v=11";
import { formulaHTML } from "../engine/formula.js?v=11";

const id = new URLSearchParams(location.search).get("id");
const lesson = LESSONS[id];
const stage = $("#stage");
const nextBtn = $("#nextBtn");
const prevBtn = $("#prevBtn");

let current = 0;
const done = new Set();   // выполненные шаги
const memory = {};        // ответы ученика внутри урока: гипотеза, достигнутые цели

function init() {
  if (!lesson || lessonStatus(id) === "locked") {
    $("#lessonTitle").textContent = "Миссия пока закрыта";
    stage.innerHTML = `<div class="card"><p>Эта миссия ещё не открыта. Вернитесь на <a href="index.html">карту курса</a>.</p></div>`;
    $("#lessonNav").hidden = true;
    return;
  }
  const sphere = SPHERES[lesson.sphere];
  document.title = `${lesson.title} — Химия руками`;
  $("#lessonTitle").textContent = lesson.title;
  $("#lessonSub").textContent = lesson.subtitle;
  $("#lessonSphere").textContent = `${sphere.icon} ${sphere.name}`;
  go(0);
}

function renderStepper() {
  $("#stepper").innerHTML = lesson.steps.map((s, i) =>
    `<li class="${i === current ? "now" : ""} ${done.has(i) ? "done" : ""}"><button type="button" data-i="${i}" ${i > current && !done.has(i - 1) ? "disabled" : ""}>
      <span class="num">${done.has(i) ? "✓" : i + 1}</span><span class="lbl">${esc(s.title)}</span></button></li>`).join("");
}

$("#stepper").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-i]");
  if (b && !b.disabled) go(Number(b.dataset.i));
});

// Подсказка под кнопкой «Дальше»: что осталось сделать на этом шаге
const HINTS = {
  hypothesis: "Чтобы идти дальше, выберите один из вариантов.",
  calc: "Чтобы идти дальше, решите все шаги расчёта."
};
function hint(text) {
  $("#nextHint").textContent = text || "";
}

function complete(i) {
  done.add(i);
  if (i === current) { nextBtn.disabled = false; hint(""); }
  renderStepper();
}

function go(i) {
  current = i;
  const step = lesson.steps[i];
  prevBtn.disabled = i === 0;
  nextBtn.disabled = !done.has(i);
  const last = i === lesson.steps.length - 1;
  nextBtn.textContent = last ? (nextLesson(lesson.id) ? "Следующая миссия →" : "На карту →") : "Дальше →";
  nextBtn.hidden = last && !done.has(i);
  renderStepper();
  hint(done.has(i) ? "" : HINTS[step.type]);
  stage.innerHTML = "";
  RENDER[step.type](step, i);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

prevBtn.addEventListener("click", () => current > 0 && go(current - 1));
nextBtn.addEventListener("click", () => {
  if (current < lesson.steps.length - 1) return go(current + 1);
  // последний шаг пройден — к следующей миссии или на карту
  const next = nextLesson(lesson.id);
  location.href = next ? `lesson.html?id=${encodeURIComponent(next.id)}` : "index.html";
});

// ───── общий каркас шага-тренажёра: вступление, цели, рабочая зона, теория ─────
function trainer(step, i, { title = "", work = "" } = {}) {
  const key = `goals-${i}`;
  const reached = memory[key] || (memory[key] = new Set());
  stage.innerHTML = `
    <section class="card">
      ${title ? `<h2>${title}</h2>` : ""}
      ${step.intro ? `<p>${step.intro}</p>` : ""}
      <ul class="checklist">${step.goals.map((g) =>
        `<li data-goal="${g.id}" class="${reached.has(g.id) ? "ok" : ""}"><span class="box"></span>${esc(g.text)}${g.optional ? ' <span class="opt-tag">по желанию</span>' : ""}</li>`).join("")}</ul>
    </section>
    <section class="card work-card">${work}</section>
    <section class="card explain" id="explain" hidden>
      <div id="verdict"></div>
      <div id="explainExtra"></div>
      <div class="theory">${step.theory || ""}</div>
    </section>`;

  const reveal = () => {
    const box = $("#explain", stage);
    if (!box.hidden) return;
    box.hidden = false;
    $("#verdict", stage).innerHTML = verdictHTML(step);
  };
  const required = step.goals.filter((g) => !g.optional);
  const left = () => required.filter((g) => !reached.has(g.id));
  const showLeft = () => {
    if (done.has(i)) return;
    hint(`Чтобы идти дальше, осталось: ${left().map((g) => `«${g.text}»`).join(", ")}.`);
  };
  const goal = (gid) => {
    if (!reached.has(gid)) {
      reached.add(gid);
      const li = stage.querySelector(`[data-goal="${gid}"]`);
      if (li) li.classList.add("ok");
    }
    if (!left().length) {
      const first = !done.has(i);
      complete(i);
      reveal();
      if (first) setTimeout(() => $("#explain", stage)?.scrollIntoView({ behavior: "smooth", block: "start" }), 600);
    } else showLeft();
  };
  if (!left().length) { complete(i); reveal(); } else showLeft();
  return { goal, reached, reveal };
}

// Проверка гипотезы, если шаг её проверяет (verdict: true)
function verdictHTML(step) {
  if (!step.verdict) return "";
  const h = lesson.steps.find((s) => s.type === "hypothesis");
  if (!h || memory.hypothesis === undefined) return "";
  const o = h.options[memory.hypothesis];
  const right = h.options.find((x) => x.ok);
  return o.ok
    ? `<p class="verdict ok">Ваша гипотеза «${esc(o.t)}» подтвердилась ✓</p>`
    : `<p class="verdict bad">Ваша гипотеза была «${esc(o.t)}». Опыт показал другое: ${esc(right.t.toLowerCase())}.</p>`;
}

const RENDER = {
  task(step, i) {
    stage.innerHTML = `<section class="card story">${step.html}</section>`;
    complete(i);
  },

  hypothesis(step, i) {
    stage.innerHTML = `<section class="card">
        <h2>${esc(step.q)}</h2>
        <p class="muted">${esc(step.note)}</p>
        <div class="options wide">${step.options.map((o, k) =>
          `<button type="button" class="opt ${memory.hypothesis === k ? "chosen" : ""}" data-k="${k}">${esc(o.t)}</button>`).join("")}</div>
        <p class="hyp-msg" aria-live="polite"></p>
      </section>`;
    const msg = $(".hyp-msg", stage);
    const show = () => {
      if (memory.hypothesis !== undefined) msg.textContent = "Ответ записан. Проверим на практике: нажмите «Дальше».";
    };
    stage.firstElementChild.addEventListener("click", (e) => {
      const b = e.target.closest(".opt");
      if (!b) return;
      memory.hypothesis = Number(b.dataset.k);
      $$(".opt", stage).forEach((x) => x.classList.toggle("chosen", x === b));
      show();
      complete(i);
    });
    show();
  },

  info(step, i) {
    stage.innerHTML = `<section class="card theory">${step.html}</section>`;
    complete(i);
  },

  // Опыт в стакане. Цели: { event: "dissolve" | "reaction" | "ph" | "heat", substance?, reaction? }
  // или { test(событие, состояние) }. Если у реакции урока есть сценарий «лупы», он открывается
  // после реакции (цель с id "micro" — досмотреть его).
  lab(step, i) {
    const reaction = step.reaction && REACTIONS.find((r) => r.id === step.reaction);
    const verdict = step.verdict !== false;
    const t = trainer({ ...step, verdict }, i, { work: '<div id="labRoot"></div>' });
    let micro = null;
    if (reaction) {
      $("#explainExtra", stage).innerHTML = reaction.micro
        ? `<h2>Что видно в лупу</h2><div id="microRoot"></div><h3>Уравнение реакции</h3>${equationHTML(reaction.equation)}`
        : `<h3>Уравнение реакции</h3>${equationHTML(reaction.equation)}`;
    }
    const showMicro = (autoplay) => {
      const box = $("#explain", stage);
      box.hidden = false;
      $("#verdict", stage).innerHTML = verdictHTML({ verdict });
      if (!reaction.micro) return;
      if (!micro) micro = createMicro($("#microRoot", stage), reaction.micro, { onDone: () => t.goal("micro") });
      if (autoplay) {
        micro.play();
        setTimeout(() => box.scrollIntoView({ behavior: "smooth", block: "start" }), 1800);
      }
    };
    const matches = (g, ev, st) => g.test ? g.test(ev, st)
      : g.event === ev.type && (!g.substance || g.substance === ev.id) && (!g.reaction || g.reaction === ev.reaction?.id);
    createLab($("#labRoot", stage), {
      substances: step.substances,
      tools: step.tools,
      onEvent(ev, st) {
        if (reaction && ev.type === "reaction" && ev.reaction.id === reaction.id) {
          const first = !t.reached.has("reaction");
          showMicro(first && reaction.micro);
        }
        step.goals.forEach((g) => { if (matches(g, ev, st)) t.goal(g.id); });
      }
    });
    if (reaction && t.reached.has("reaction")) showMicro(false);
  },

  // Гальванический элемент: цели с test(состояние: a, b, el, cells, voltage, anode, led)
  cell(step, i) {
    const t = trainer(step, i, { work: '<div id="cellRoot"></div>' });
    createCell($("#cellRoot", stage), { ...step.cell, onChange(st) { step.goals.forEach((g) => { if (g.test(st)) t.goal(g.id); }); } });
  },

  // Скорость реакции: цели с test(состояние: T, conc, catalyst, rate)
  rate(step, i) {
    const t = trainer(step, i, { work: '<div id="rateRoot"></div>' });
    createRate($("#rateRoot", stage), step.sim, { onChange(st) { step.goals.forEach((g) => { if (g.test(st)) t.goal(g.id); }); } });
  },

  // Сортировка: одна цель — разложить всё
  sort(step, i) {
    const t = trainer({ ...step, goals: [{ id: "all", text: step.goalText || "Разложите все карточки по корзинам" }] }, i, { work: '<div id="sortRoot"></div>' });
    createSort($("#sortRoot", stage), step.sort, { onProgress(p) { if (p.done === p.total) t.goal("all"); } });
  },

  // Комбинатор: цели { id, key } — найти конкретную пару
  combine(step, i) {
    const t = trainer(step, i, { work: '<div id="cmbRoot"></div>' });
    createCombine($("#cmbRoot", stage), step.combine, { onResult(key) { step.goals.filter((g) => g.key === key).forEach((g) => t.goal(g.id)); } });
  },

  // Мыло и капля жира: цели { id, event }
  micelle(step, i) {
    const t = trainer(step, i, { work: '<div id="micRoot"></div>' });
    createMicelle($("#micRoot", stage), { onEvent(ev) { step.goals.filter((g) => g.event === ev).forEach((g) => t.goal(g.id)); } });
  },

  // Смеситель растворов: цели с test(состояние: stock, water, total, solute, c)
  mix(step, i) {
    const t = trainer(step, i, { work: '<div id="mixRoot"></div>' });
    createMixer($("#mixRoot", stage), step.mixer, {
      onChange(st) { step.goals.forEach((g) => { if (g.test(st)) t.goal(g.id); }); }
    });
  },

  // Разделение смесей: цели с функцией test(снимок состояния)
  separate(step, i) {
    const t = trainer(step, i, { work: '<div id="sepRoot"></div>' });
    createSeparator($("#sepRoot", stage), {
      shelf: step.shelf,
      tools: step.tools,
      toolLabels: step.toolLabels,
      onChange(snap) {
        step.goals.forEach((g) => { if (g.test(snap)) t.goal(g.id); });
      }
    });
  },

  atom(step, i) {
    const t = trainer(step, i, { work: '<div id="atomRoot"></div>' });
    createAtom($("#atomRoot", stage), {
      start: step.start,
      table: step.table !== false,
      onChange(st) {
        step.goals.forEach((g) => { if (g.test(st)) t.goal(g.id); });
      }
    });
  },

  build(step, i) {
    const t = trainer(step, i, { work: '<div id="buildRoot"></div>' });
    createBuilder($("#buildRoot", stage), {
      palette: step.palette,
      onMolecule(formula) {
        step.goals.filter((g) => g.formula === formula).forEach((g) => t.goal(g.id));
      }
    });
  },

  balance(step, i) {
    const t = trainer({ ...step, goals: step.equations.map((e) => ({ id: e.id, text: e.text })) }, i, {
      work: step.equations.map((e, k) => `<div class="bal-block" data-k="${k}" ${k > 0 && !(memory[`goals-${i}`] || new Set()).has(step.equations[k - 1].id) ? "hidden" : ""}>
        <h3>${esc(e.text)}</h3><div class="bal-root"></div>${e.after ? `<p class="bal-after" hidden>${e.after}</p>` : ""}</div>`).join("")
    });
    step.equations.forEach((e, k) => {
      const block = stage.querySelector(`.bal-block[data-k="${k}"]`);
      createBalancer($(".bal-root", block), e.eq, {
        onBalanced() {
          t.goal(e.id);
          const after = $(".bal-after", block);
          if (after) after.hidden = false;
          const next = stage.querySelector(`.bal-block[data-k="${k + 1}"]`);
          if (next) next.hidden = false;
        }
      });
    });
  },

  // Только «лупа» и уравнение (для реакций, которые в стакане не поставишь)
  micro(step, i) {
    const reaction = REACTIONS.find((r) => r.id === step.reaction);
    const t = trainer({ ...step, goals: [{ id: "watch", text: "Досмотрите реакцию в лупе до конца" }] }, i, {
      work: `<div id="microRoot"></div><h3>Уравнение</h3>${equationHTML(reaction.equation)}`
    });
    createMicro($("#microRoot", stage), reaction.micro, { onDone: () => t.goal("watch") });
  },

  calc(step, i) {
    stage.innerHTML = `
      ${step.theory ? `<section class="card theory">${step.theory}</section>` : ""}
      <section class="card"><h2>🧮 Посчитайте</h2><div id="calcRoot"></div></section>`;
    createCalc($("#calcRoot", stage), step, { onDone: () => complete(i) });
  },

  cards(step, i) {
    const cards = CARDS.filter((c) => c.lesson === lesson.id);
    const next = nextLesson(lesson.id);
    stage.innerHTML = `
      <section class="card">
        <h2>💎 ${cards.length} новых кристаллов</h2>
        <p>${esc(step.text || "Эти вопросы попадут в вашу коллекцию кристаллов. Отвечайте на несколько каждый день: вопросы, которые вы помните, будут возвращаться всё реже.")}</p>
        <ul class="card-list">${cards.map((c) => `<li>${c.type === "formula" ? `${esc(c.q)} <span class="muted">(${formulaHTML(c.answer)})</span>` : esc(c.q || c.topic)}</li>`).join("")}</ul>
        <button type="button" class="btn big" id="finishBtn">Завершить миссию</button>
      </section>
      <section class="card finish" id="finish" hidden>
        <h2>🎉 Миссия пройдена!</h2>
        <p>Сфера «${esc(SPHERES[lesson.sphere].name)}» открыта на карте. Вопросы ждут вас в коллекции.</p>
        <div class="row">
          ${next ? `<a class="btn big" href="lesson.html?id=${next.id}">Следующая миссия: ${esc(next.title)} →</a>` : ""}
          <a class="btn ${next ? "ghost" : "big"}" href="garden.html">💎 Ответить на вопросы</a>
          <a class="btn ghost" href="index.html">🗺️ На карту</a>
        </div>
      </section>`;
    $("#finishBtn", stage).addEventListener("click", (e) => {
      completeLesson(lesson.id);
      complete(i);
      e.target.hidden = true;
      nextBtn.hidden = false;
      $("#finish", stage).hidden = false;
      $("#finish", stage).scrollIntoView({ behavior: "smooth" });
    });
  }
};

init();
