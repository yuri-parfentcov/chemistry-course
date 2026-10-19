// Звёзды игры: лучший результат по каждому уровню. Хранится только в этом браузере.
const KEY = "chem-game-v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign({ levels: {} }, JSON.parse(raw));
  } catch (e) { /* приватный режим */ }
  return { levels: {} };
}
const state = load();
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ничего */ }
};

export const result = (id) => state.levels[id] || null;
export const stars = (id) => (state.levels[id] ? state.levels[id].stars : 0);

// Сохраняем лучшее: больше звёзд, меньше ходов
export function record(id, starCount, moves) {
  const old = state.levels[id];
  state.levels[id] = {
    stars: Math.max(starCount, old ? old.stars : 0),
    best: old ? Math.min(old.best, moves) : moves
  };
  save();
}

// 3 звезды — не дольше нормы, 2 — до полутора норм, 1 — просто решено
export const starsFor = (moves, par) => (moves <= par ? 3 : moves <= Math.ceil(par * 1.5) ? 2 : 1);
