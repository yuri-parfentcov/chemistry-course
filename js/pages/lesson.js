// Плеер урока-миссии: 5 шагов, «Дальше» открывается, когда шаг выполнен
import { LESSONS } from "../../data/course.js";
import { REACTIONS } from "../../data/reactions.js";
import { SPHERES } from "../../data/spheres.js";
import { CARDS } from "../../data/cards.js";
import { $, $$, esc } from "../core/util.js";
import { completeLesson, lessonStatus } from "../core/progress.js";
import { createLab } from "../engine/lab.js";
import { createMicro } from "../engine/lab-micro.js";
import { createCalc } from "../engine/calc.js";
import { equationHTML } from "../engine/equation.js";
import { formulaHTML } from "../engine/formula.js";

const id = new URLSearchParams(location.search).get("id");
const lesson = LESSONS[id];
const stage = $("#stage");
const nextBtn = $("#nextBtn");
const prevBtn = $("#prevBtn");

let current = 0;
const done = new Set();   // выполненные шаги
const memory = {};        // ответы ученика внутри урока (гипотеза)

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

function complete(i) {
  done.add(i);
  if (i === current) nextBtn.disabled = false;
  renderStepper();
}

function go(i) {
  current = i;
  const step = lesson.steps[i];
  prevBtn.disabled = i === 0;
  nextBtn.disabled = !done.has(i);
  nextBtn.hidden = i === lesson.steps.length - 1;
  renderStepper();
  stage.innerHTML = "";
  RENDER[step.type](step, i);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

prevBtn.addEventListener("click", () => current > 0 && go(current - 1));
nextBtn.addEventListener("click", () => current < lesson.steps.length - 1 && go(current + 1));

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
      if (memory.hypothesis === undefined) return;
      msg.textContent = "Ответ записан. Проверим опытом: нажмите «Дальше».";
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

  lab(step, i) {
    const reaction = REACTIONS.find((r) => r.id === step.reaction);
    const reached = new Set(memory.labGoals || []);
    memory.labGoals = reached;
    stage.innerHTML = `
      <section class="card">
        <p>${esc(step.intro)}</p>
        <ul class="checklist">${step.goals.map((g) =>
          `<li data-goal="${g.id}" class="${reached.has(g.id) ? "ok" : ""}"><span class="box"></span>${esc(g.text)}</li>`).join("")}</ul>
      </section>
      <section class="card lab-card"><div id="labRoot"></div></section>
      <section class="card explain" id="explain" hidden>
        <h2>Что видно в лупу</h2>
        <div id="hypVerdict"></div>
        <div id="microRoot"></div>
        <h3>Уравнение реакции</h3>
        ${equationHTML(reaction.equation)}
        <div class="theory">${step.theory}</div>
      </section>`;

    const goal = (gid) => {
      if (reached.has(gid)) return;
      reached.add(gid);
      const li = stage.querySelector(`[data-goal="${gid}"]`);
      if (li) li.classList.add("ok");
      if (step.goals.every((g) => reached.has(g.id))) complete(i);
    };

    let micro = null;
    const reveal = (autoplay) => {
      const box = $("#explain", stage);
      box.hidden = false;
      if (!micro) {
        micro = createMicro($("#microRoot", stage), reaction.micro, { onDone: () => goal("micro") });
        const h = lesson.steps.find((s) => s.type === "hypothesis");
        if (h && memory.hypothesis !== undefined) {
          const o = h.options[memory.hypothesis];
          $("#hypVerdict", stage).innerHTML = o.ok
            ? `<p class="verdict ok">Ваша гипотеза «${esc(o.t)}» подтвердилась ✓</p>`
            : `<p class="verdict bad">Ваша гипотеза была «${esc(o.t)}». На самом деле это углекислый газ. Посмотрите, откуда он берётся.</p>`;
        }
      }
      if (autoplay) {
        micro.play();
        setTimeout(() => box.scrollIntoView({ behavior: "smooth", block: "start" }), 1800);
      }
    };

    createLab($("#labRoot", stage), {
      substances: step.substances,
      onEvent(ev) {
        if (ev.type === "dissolve" && ev.id === "soda") goal("soda-water");
        if (ev.type === "reaction" && ev.reaction.id === reaction.id) {
          const first = !reached.has("reaction");
          goal("reaction");
          reveal(first);
        }
      }
    });
    if (reached.has("reaction")) reveal(false);
  },

  calc(step, i) {
    stage.innerHTML = `
      <section class="card theory">${step.theory}</section>
      <section class="card"><h2>🧮 Посчитайте</h2><div id="calcRoot"></div></section>`;
    createCalc($("#calcRoot", stage), step, { onDone: () => complete(i) });
  },

  cards(step, i) {
    const cards = CARDS.filter((c) => c.lesson === lesson.id);
    stage.innerHTML = `
      <section class="card">
        <h2>💎 ${cards.length} новых кристаллов</h2>
        <p>${esc(step.text)}</p>
        <ul class="card-list">${cards.map((c) => `<li>${c.type === "formula" ? `${esc(c.q)} <span class="muted">(${formulaHTML(c.answer)})</span>` : esc(c.q || c.topic)}</li>`).join("")}</ul>
        <button type="button" class="btn big" id="finishBtn">Завершить миссию</button>
      </section>
      <section class="card finish" id="finish" hidden>
        <h2>🎉 Миссия пройдена!</h2>
        <p>Сфера «${esc(SPHERES[lesson.sphere].name)}» открыта на карте. Вопросы ждут вас в коллекции.</p>
        <div class="row">
          <a class="btn big" href="garden.html">💎 Ответить на вопросы</a>
          <a class="btn ghost" href="index.html">🗺️ На карту курса</a>
        </div>
      </section>`;
    $("#finishBtn", stage).addEventListener("click", (e) => {
      completeLesson(lesson.id);
      complete(i);
      e.target.hidden = true;
      $("#finish", stage).hidden = false;
      $("#finish", stage).scrollIntoView({ behavior: "smooth" });
    });
  }
};

init();
