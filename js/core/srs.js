// Интервальное повторение (система Лейтнера). Перенесено из pharao/learn.js и отвязано от страницы.
export const NEW_PER_DAY = 8;
// Через сколько дней повторить после перехода на ступень 1..5
export const INTERVALS = [0, 1, 2, 3, 5, 10];
export const LEARNED_BOX = 4;

// ───── Дата (параметр ?shift=N сдвигает «сегодня» для проверки) ─────
const shift = Number(new URLSearchParams(location.search).get("shift")) || 0;
export function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDays(str, n) {
  const [y, m, d] = str.split("-").map(Number);
  return dateStr(new Date(y, m - 1, d + n));
}
export const today = () => addDays(dateStr(new Date()), shift);

export function formatDay(str) {
  const diff = Math.round((new Date(str) - new Date(today())) / 86400000);
  if (diff <= 0) return "сегодня";
  if (diff === 1) return "завтра";
  if (diff === 2) return "послезавтра";
  return `через ${diff} дн.`;
}

// key — ключ localStorage; cards — все карточки; isAvailable(card) — открыта ли карточка (урок пройден)
export function createSrs({ key, cards, isAvailable = () => true }) {
  const blank = () => ({ cards: {}, gold: 0, streak: { last: null, count: 0 }, newToday: { date: null, count: 0 } });
  function load() {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return Object.assign(blank(), JSON.parse(raw));
    } catch (e) { /* приватный режим и т.п. */ }
    return blank();
  }
  const state = load();
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* ничего */ }
  };

  const pool = () => cards.filter(isAvailable);
  const box = (id) => (state.cards[id] ? state.cards[id].box : 0);
  const newLeftToday = () => NEW_PER_DAY - (state.newToday.date === today() ? state.newToday.count : 0);

  function due() {
    const t = today();
    return pool().filter((c) => state.cards[c.id] && state.cards[c.id].due <= t)
      .sort((a, b) => state.cards[a.id].due.localeCompare(state.cards[b.id].due));
  }
  const unseen = () => pool().filter((c) => !state.cards[c.id]);
  const nextDue = () => Object.values(state.cards).map((c) => c.due).sort()[0];
  const streakAlive = () => state.streak.last === today() || state.streak.last === addDays(today(), -1);

  // isRetry — карточку уже провалили в этой тренировке
  function grade(card, correct, isRetry) {
    const t = today();
    const c = state.cards[card.id] || { box: 0, right: 0, wrong: 0, due: t };
    const isNew = !state.cards[card.id];
    const before = c.box;
    let gold = 0;

    if (correct) {
      c.right++;
      c.box = isRetry ? 1 : Math.min(5, c.box + 1);
      c.due = addDays(t, INTERVALS[c.box]);
      gold = 1 + (c.box === 5 && before < 5 ? 3 : 0);
    } else {
      c.wrong++;
      c.box = 1;
      // второй промах подряд — не мучаем сегодня, повторим завтра
      c.due = isRetry ? addDays(t, 1) : t;
    }
    state.gold += gold;
    if (isNew) {
      if (state.newToday.date !== t) state.newToday = { date: t, count: 0 };
      state.newToday.count++;
    }
    state.cards[card.id] = c;
    save();
    return { before, after: c.box, gold };
  }

  function finishSession() {
    const t = today();
    if (state.streak.last !== t) {
      state.streak.count = state.streak.last === addDays(t, -1) ? state.streak.count + 1 : 1;
      state.streak.last = t;
    }
    save();
  }

  return { state, pool, box, due, unseen, nextDue, newLeftToday, streakAlive, grade, finishSession };
}
