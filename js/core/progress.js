// Прогресс по курсу: пройденные миссии, открытые сферы, доступ к урокам
import { LESSONS } from "../../data/course.js";
import { CARDS } from "../../data/cards.js";
import { createSrs, today, LEARNED_BOX } from "./srs.js";

const KEY = "chem-progress-v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign({ lessons: {} }, JSON.parse(raw));
  } catch (e) { /* приватный режим */ }
  return { lessons: {} };
}
const progress = load();
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) { /* ничего */ }
};

export const isDone = (id) => Boolean(progress.lessons[id]);

export function completeLesson(id) {
  if (!progress.lessons[id]) progress.lessons[id] = { done: today() };
  save();
}

// Один сад-хранилище карточек на весь курс: карточка открыта, когда пройден её урок
export const srs = createSrs({ key: "chem-garden-v1", cards: CARDS, isAvailable: (c) => isDone(c.lesson) });

// locked → available → done → mastered (все карточки урока на ступени ≥ 4)
export function lessonStatus(id) {
  const lesson = LESSONS[id];
  if (!lesson || lesson.soon) return "locked";
  if (!isDone(id)) return (lesson.requires || []).every(isDone) ? "available" : "locked";
  const cards = CARDS.filter((c) => c.lesson === id);
  return cards.length && cards.every((c) => srs.box(c.id) >= LEARNED_BOX) ? "mastered" : "done";
}

export const openedSpheres = () =>
  new Set(Object.keys(progress.lessons).map((id) => LESSONS[id] && LESSONS[id].sphere).filter(Boolean));

export const doneCount = () => Object.keys(progress.lessons).length;
