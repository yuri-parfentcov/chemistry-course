// «Коллекция кристаллов» — тренировка с интервальным повторением (порт learn.js из pharao)
import { CARDS } from "../../data/cards.js?v=19";
import { LESSONS } from "../../data/course.js?v=19";
import { $, $$, esc, shuffle } from "../core/util.js?v=19";
import { formulaHTML } from "../engine/formula.js?v=19";
import { formatDay, LEARNED_BOX } from "../core/srs.js?v=19";
import { srs } from "../core/progress.js?v=19";

const STAGES = ["⚪", "💧", "🧪", "⚗️", "🔬", "💎"];
const STAGE_NAMES = ["ещё не начат", "капля", "пробирка", "колба", "микроскоп", "кристалл"];
const TYPE_LABELS = { mc: "Вопрос", predict: "Что увидим?", formula: "Формула", whoami: "Кто я?" };

let session = null;

function renderHome() {
  const due = srs.due().length;
  const fresh = Math.min(srs.newLeftToday(), srs.unseen().length);
  const pool = srs.pool();
  const learned = pool.filter((c) => srs.box(c.id) >= LEARNED_BOX).length;

  $("#statStreak").textContent = srs.streakAlive() ? srs.state.streak.count : 0;
  $("#statGold").textContent = srs.state.gold;
  $("#statLearned").textContent = `${learned}/${pool.length}`;
  $("#statCrystals").textContent = pool.filter((c) => srs.box(c.id) === 5).length;

  const total = due + fresh;
  $("#startBtn").hidden = total === 0;
  $("#extraBtn").hidden = total > 0 || srs.unseen().length === 0;
  if (!pool.length) {
    $("#todayText").innerHTML = `Коллекция пока пуста. Пройдите <a href="index.html">миссию</a>, и здесь появятся первые вопросы.`;
  } else if (total > 0) {
    const parts = [];
    if (due) parts.push(`повторить: ${due}`);
    if (fresh) parts.push(`новых: ${fresh}`);
    $("#todayText").textContent = `Сегодня вас ждут вопросы — ${parts.join(", ")}.`;
    $("#startBtn").textContent = `Начать тренировку (${total})`;
  } else {
    const next = srs.nextDue();
    $("#todayText").textContent = `🎉 На сегодня всё! ${next ? `Следующее повторение: ${formatDay(next)}.` : ""}`;
  }

  $("#stageLegend").innerHTML = STAGES.map((s, i) => `<span>${s} ${STAGE_NAMES[i]}</span>`).join("");
  $("#collection").innerHTML = CARDS.map((c) => {
    const open = pool.includes(c);
    const b = srs.box(c.id);
    return open
      ? `<a class="plot stage-${b}" href="lesson.html?id=${c.lesson}" title="${esc(c.topic)} — ${STAGE_NAMES[b]}"><span class="plant">${STAGES[b]}</span><span class="plot-name">${esc(c.topic)}</span></a>`
      : `<span class="plot closed" title="Откроется после миссии «${esc(LESSONS[c.lesson].title)}»"><span class="plant">🔒</span><span class="plot-name">???</span></span>`;
  }).join("");
}

function show(id) {
  ["home", "quiz", "done"].forEach((s) => { $("#" + s).hidden = s !== id; });
  window.scrollTo(0, 0);
}

function startSession(extraNew) {
  const due = shuffle(srs.due());
  const fresh = srs.unseen().slice(0, extraNew || Math.max(0, srs.newLeftToday()));
  session = { queue: [...due, ...fresh], pos: 0, retry: new Set(), right: 0, wrong: 0, grown: 0, gold: 0, done: 0, total: due.length + fresh.length };
  if (!session.queue.length) return;
  show("quiz");
  ask();
}

function ask() {
  const c = session.queue[session.pos];
  const options = shuffle([c.answer, ...c.wrong]);
  session.current = { c, options, clues: 1, answered: false };
  $("#progressBar").style.width = `${Math.round((session.done / session.total) * 100)}%`;
  $("#progressText").textContent = `Вопрос ${Math.min(session.done + 1, session.total)} из ${session.total}` +
    (session.retry.has(c.id) ? " · повторяем" : "");
  $("#qType").textContent = `${STAGES[srs.box(c.id)]} ${TYPE_LABELS[c.type]}`;
  $("#qText").textContent = c.type === "whoami" ? "Кто я?" : c.q;
  renderClues();
  const show = (o) => (c.type === "formula" ? formulaHTML(o) : esc(o));
  $("#options").className = "options" + (c.type === "formula" ? "" : " wide");
  $("#options").innerHTML = options.map((o, i) => `<button type="button" class="opt" data-i="${i}">${show(o)}</button>`).join("");
  $("#feedback").hidden = true;
  $("#nextBtn").hidden = true;
}

function renderClues() {
  const { c, clues, answered } = session.current;
  if (c.type !== "whoami") { $("#qClues").innerHTML = ""; $("#clueBtn").hidden = true; return; }
  $("#qClues").innerHTML = c.clues.slice(0, clues).map((t) => `<p class="clue">🔎 ${esc(t)}</p>`).join("");
  $("#clueBtn").hidden = answered || clues >= c.clues.length;
}

function answer(btn) {
  const { c, options } = session.current;
  const correct = options[Number(btn.dataset.i)] === c.answer;
  session.current.answered = true;
  $("#clueBtn").hidden = true;
  $$(".opt").forEach((b) => {
    b.disabled = true;
    if (options[Number(b.dataset.i)] === c.answer) b.classList.add("correct");
    else if (b === btn) b.classList.add("wrong");
  });

  const isRetry = session.retry.has(c.id);
  const { before, after, gold } = srs.grade(c, correct, isRetry);
  session.done++;
  session.gold += gold;
  if (correct) { session.right++; if (after > before) session.grown++; }
  else {
    session.wrong++;
    if (!isRetry) { session.retry.add(c.id); session.queue.push(c); session.total++; }
  }

  let line;
  if (correct && after > before) line = `${STAGES[before]} → ${STAGES[after]} Кристалл подрос!`;
  else if (correct) line = `${STAGES[after]} Верно! Закрепим завтра.`;
  else {
    const again = session.queue.lastIndexOf(c) > session.pos ? "Вернёмся к нему в конце тренировки." : "Повторим завтра.";
    line = `Не страшно, так и запоминают. ${again}`;
  }
  $("#feedback").className = "feedback " + (correct ? "ok" : "bad");
  $("#feedback").innerHTML = `<p class="fb-line">${line}</p><p>${esc(c.explain)}</p>
    <p class="muted">Подробнее — в миссии <a href="lesson.html?id=${c.lesson}">«${esc(LESSONS[c.lesson].title)}»</a>.</p>`;
  $("#feedback").hidden = false;
  $("#nextBtn").hidden = false;
  $("#nextBtn").focus();
}

function next() {
  session.pos++;
  if (session.pos < session.queue.length) return ask();
  srs.finishSession();
  $("#doneText").innerHTML = `Верных ответов: <b>${session.right}</b>, ошибок: <b>${session.wrong}</b>.<br>
    Кристаллов подросло: <b>${session.grown}</b>. Золота: <b>+${session.gold}</b>.<br>
    Серия: <b>${srs.state.streak.count}</b> дн. подряд.`;
  show("done");
}

$("#startBtn").addEventListener("click", () => startSession());
$("#extraBtn").addEventListener("click", () => startSession(5));
$("#clueBtn").addEventListener("click", () => { session.current.clues++; renderClues(); });
$("#options").addEventListener("click", (e) => {
  const b = e.target.closest(".opt");
  if (b && !session.current.answered) answer(b);
});
$("#nextBtn").addEventListener("click", next);
$("#homeBtn").addEventListener("click", () => { renderHome(); show("home"); });

renderHome();
