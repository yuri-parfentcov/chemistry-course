// Карта курса: модули по порядку, миссии, открытые сферы и статистика
import { MODULES, LESSONS } from "../../data/course.js?v=22";
import { SPHERES } from "../../data/spheres.js?v=22";
import { $, esc } from "../core/util.js?v=22";
import { srs, lessonStatus, openedSpheres, doneCount, ORDER, isDone } from "../core/progress.js?v=22";
import { CHAPTERS } from "../../data/game-levels.js?v=22";
import { stars } from "../game/store.js?v=22";

const STATUS = {
  available: { icon: "▶", text: "Начать" },
  done: { icon: "✓", text: "Пройдена" },
  mastered: { icon: "💎", text: "Освоена" },
  locked: { icon: "🔒", text: "Закрыта" }
};

function render() {
  const opened = openedSpheres();
  const due = srs.due().length + Math.min(srs.newLeftToday(), srs.unseen().length);

  $("#stats").innerHTML = `
    <div><b>${doneCount()}</b><span>миссий пройдено</span></div>
    <div><b>${opened.size}/${Object.keys(SPHERES).length}</b><span>сфер жизни</span></div>
    <div><b>${srs.streakAlive() ? srs.state.streak.count : 0}</b><span>дней подряд</span></div>
    <a class="${due ? "pulse" : ""}" href="garden.html"><b>${due}</b><span>вопросов сегодня</span></a>`;

  $("#spheres").innerHTML = Object.entries(SPHERES).map(([sid, s]) =>
    `<span class="sphere ${opened.has(sid) ? "open" : ""}" title="${esc(s.name)}${opened.has(sid) ? "" : " — ещё не открыта"}">${s.icon}<span>${esc(s.name)}</span></span>`).join("");

  // следующая непройденная миссия — крупно наверху
  const nextId = ORDER.find((lid) => lessonStatus(lid) === "available");
  $("#pilot").innerHTML = nextId ? missionHTML(LESSONS[nextId]) : `<p>🎓 Все миссии пройдены — курс завершён! Возвращайтесь к коллекции кристаллов, чтобы знания не выветрились.</p>`;

  // игра: сколько глав открыто и звёзд собрано
  const playable = CHAPTERS.filter((c) => c.levels.length);
  const open = playable.filter((c) => isDone(c.unlock));
  const got = playable.reduce((s, c) => s + c.levels.reduce((t, l) => t + stars(l.id), 0), 0);
  const max = playable.reduce((s, c) => s + c.levels.length * 3, 0);
  const firstLock = playable.find((c) => !isDone(c.unlock));
  $("#gameCard").innerHTML = `<a class="mission" href="game.html">
    <span class="m-sphere">🎮</span>
    <span class="m-text"><b>Атомная мастерская</b><small>${open.length
      ? `Открыто глав: ${open.length} из ${CHAPTERS.length}`
      : `Первая глава откроется после миссии «${esc(LESSONS[firstLock.unlock].title)}»`}</small></span>
    <span class="m-status">★ ${got} / ${max}</span></a>`;

  $("#modules").innerHTML = MODULES.map((m) => {
    const lessons = (m.lessons || []).map((id) => LESSONS[id]);
    return `<li class="module ${lessons.length ? "" : "soon"}">
      <div class="module-n">${m.n}</div>
      <div class="module-body">
        <h3>${esc(m.title)}</h3>
        ${lessons.length ? `<div class="missions">${lessons.map(missionHTML).join("")}</div>` : ""}
        ${m.plan.length ? `<p class="plan">${lessons.length ? "Скоро ещё: " : "Скоро: "}${m.plan.map(esc).join(" · ")}</p>` : ""}
      </div>
    </li>`;
  }).join("");
}

function missionHTML(l) {
  const st = lessonStatus(l.id);
  const sphere = SPHERES[l.sphere];
  const inner = `<span class="m-sphere" title="${esc(sphere.name)}">${sphere.icon}</span>
    <span class="m-text"><b>${esc(l.title)}</b><small>${esc(l.subtitle)}</small></span>
    <span class="m-status ${st}">${STATUS[st].icon} ${STATUS[st].text}</span>`;
  return st === "locked"
    ? `<div class="mission locked">${inner}</div>`
    : `<a class="mission ${st}" href="lesson.html?id=${encodeURIComponent(l.id)}">${inner}</a>`;
}

render();
