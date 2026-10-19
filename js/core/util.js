// Общие помощники (как в pharao: $, esc, shuffle)
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Число по-русски: запятая, не больше digits знаков после неё
export const fmt = (n, digits = 2) => n.toLocaleString("ru-RU", { maximumFractionDigits: digits });

// Ровно digits знаков: fixed(0.0595, 3) → «0,060»
export const fixed = (n, digits) => n.toFixed(digits).replace(".", ",");

// «0,036» и «0.036» оба понимаем
export function parseNum(str) {
  const v = parseFloat(String(str).trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

export function cssVar(el, name) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}
