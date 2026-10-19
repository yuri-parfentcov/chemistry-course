// «Атомная мастерская»: главы → уровни → уровень. Адреса: game.html, ?ch=forge, ?ch=forge&lv=f3
import { CHAPTERS, CHAPTER_BY_ID } from "../../data/game-levels.js?v=19";
import { LESSONS } from "../../data/course.js?v=19";
import { isDone } from "../core/progress.js?v=19";
import { $, esc } from "../core/util.js?v=19";
import * as store from "../game/store.js?v=19";
import * as forge from "../game/forge.js?v=19";

const ENGINES = { forge };
const main = $("#game");
const params = new URLSearchParams(location.search);
// ?preview — для проверки: всё открыто, звёзды не записываются, прогресс курса не трогаем
const preview = params.has("preview");
const P = preview ? "&preview" : "";

const ready = (c) => c.levels.length > 0 && ENGINES[c.engine];
const unlocked = (c) => preview || isDone(c.unlock);
const levelOpen = (c, i) => preview || i === 0 || store.stars(c.levels[i - 1].id) > 0;
const starLine = (n, max = 3) => `<span class="stars" aria-label="${n} из ${max} звёзд">${"★".repeat(n)}<span class="dim">${"★".repeat(max - n)}</span></span>`;
const chapterStars = (c) => c.levels.reduce((s, l) => s + store.stars(l.id), 0);

function home() {
  const total = CHAPTERS.reduce((s, c) => s + chapterStars(c), 0);
  const max = CHAPTERS.reduce((s, c) => s + c.levels.length * 3, 0);
  main.innerHTML = `
    <h1>🎮 Атомная мастерская</h1>
    <p class="muted">Головоломки на то, что вы узнали в курсе: собирайте атомы и ионы, передавайте электроны, стройте молекулы и зажигайте звёзды. Главы открываются по мере прохождения миссий.</p>
    <p class="total">${starLine(1, 1)} Звёзд собрано: <b>${total}</b> из ${max}</p>
    <div class="chapters">${CHAPTERS.map((c) => {
      const lesson = LESSONS[c.unlock];
      let foot;
      if (!ready(c)) foot = `<span class="muted">В разработке</span>`;
      else if (!unlocked(c)) foot = `🔒 Откроется после миссии <a href="lesson.html?id=${c.unlock}">«${esc(lesson.title)}»</a>`;
      else foot = `<span class="stars">★</span> ${chapterStars(c)} из ${c.levels.length * 3} <span class="muted">· уровней: ${c.levels.length}</span>`;
      const open = ready(c) && unlocked(c);
      const inner = `<span class="ch-icon">${c.icon}</span><span class="ch-text"><small>Глава ${c.n}</small><b>${esc(c.title)}</b><span class="muted">${esc(c.sub)}</span><span class="ch-foot">${foot}</span></span>`;
      return open ? `<a class="chapter card" href="game.html?ch=${c.id}${P}">${inner}</a>` : `<div class="chapter card locked">${inner}</div>`;
    }).join("")}</div>`;
}

function chapter(c) {
  if (!ready(c) || !unlocked(c)) return home();
  main.innerHTML = `
    <p><a class="back" href="game.html">← Все главы</a></p>
    <h1>${c.icon} ${esc(c.title)}</h1>
    <p>${esc(c.intro || c.sub)}</p>
    <div class="levels">${c.levels.map((l, i) => {
      const open = levelOpen(c, i);
      const inner = `<span class="lv-n">${i + 1}</span><span class="lv-title">${esc(l.title)}</span>${starLine(store.stars(l.id))}`;
      return open ? `<a class="level card" href="game.html?ch=${c.id}&lv=${l.id}${P}">${inner}</a>` : `<div class="level card locked" title="Сначала пройдите предыдущий уровень">${inner}</div>`;
    }).join("")}</div>`;
}

function level(c, idx) {
  const lv = c.levels[idx];
  const engine = ENGINES[c.engine];
  const par = engine.par(lv);
  const next = c.levels[idx + 1];
  main.innerHTML = `
    <p><a class="back" href="game.html?ch=${c.id}">← ${esc(c.title)}</a></p>
    <h1><span class="muted">${idx + 1}.</span> ${esc(lv.title)}</h1>
    <p class="story">${esc(lv.story)}</p>
    <div class="toolbar">
      <span class="moves" aria-live="polite"></span>
      <span class="tools">
        <button type="button" class="btn ghost small" data-act="undo">↶ Отменить</button>
        <button type="button" class="btn ghost small" data-act="reset">Заново</button>
        <button type="button" class="btn ghost small" data-act="hint">💡 Подсказка</button>
      </span>
    </div>
    <p class="hint" hidden></p>
    <div id="board"></div>
    <section class="card win" hidden></section>`;

  let won = false;
  const board = $("#board");
  const ctl = engine.mount(board, lv, {
    moves(n) { $(".moves", main).innerHTML = `Ходов: <b>${n}</b> · норма для трёх звёзд: ${par}`; },
    win(moves) {
      if (won) return;
      won = true;
      const s = store.starsFor(moves, par);
      if (!preview) store.record(lv.id, s, moves);
      board.classList.add("won");
      $(".tools", main).hidden = true;
      const box = $(".win", main);
      box.hidden = false;
      box.innerHTML = `
        <h2>🎉 Заказ выполнен! ${starLine(s)}</h2>
        <p class="muted">Ходов: ${moves}, норма: ${par}.${s < 3 ? " Можно пройти экономнее — попробуйте ещё раз." : ""}</p>
        <p><b>Что это было.</b> ${esc(lv.note)}</p>
        <div class="row">
          ${next ? `<a class="btn" href="game.html?ch=${c.id}&lv=${next.id}${P}">Следующий уровень →</a>` : `<a class="btn" href="game.html">🏁 Глава пройдена — к главам</a>`}
          ${s < 3 ? `<a class="btn ghost" href="game.html?ch=${c.id}&lv=${lv.id}${P}">Ещё раз</a>` : ""}
          <a class="btn ghost" href="game.html?ch=${c.id}">К уровням</a>
        </div>`;
      setTimeout(() => box.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300);
    }
  });

  main.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act || won) return;
    const hint = $(".hint", main);
    if (act === "undo") ctl.undo();
    if (act === "reset") { ctl.reset(); hint.hidden = true; }
    if (act === "hint") { hint.hidden = false; hint.textContent = ctl.hint(); }
  });
}

function route() {
  const c = CHAPTER_BY_ID[params.get("ch")];
  if (!c) return home();
  const idx = c.levels.findIndex((l) => l.id === params.get("lv"));
  if (idx < 0 || !ready(c) || !unlocked(c) || !levelOpen(c, idx)) return chapter(c);
  level(c, idx);
}

route();
