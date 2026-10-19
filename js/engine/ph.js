// Упрощённая модель pH для лаборатории.
// У вещества: ph — его pH «в чистом виде», acid/base — сколько кислоты/щёлочи даёт одна порция
// (условные «эквиваленты»). Кислоты и щёлочи гасят друг друга; избыток задаёт pH,
// разбавление водой немного сдвигает его к 7.
import { clamp } from "../core/util.js?v=15";

export function mixturePH(items) {
  // items: [{ sub, units }]
  let A = 0, B = 0, pHa = 7, pHb = 7, V = 0, acidVol = 0, baseVol = 0;
  for (const { sub, units } of items) {
    if (!units) continue;
    if (sub.state === "liquid") V += units;
    if (sub.acid) { A += units * sub.acid; pHa = Math.min(pHa, sub.ph); acidVol += units; }
    if (sub.base) { B += units * sub.base; pHb = Math.max(pHb, sub.ph); baseVol += units; }
  }
  if (V === 0) return null;
  if (A + B === 0) return 7;
  // x от −1 (только кислота) до +1 (только щёлочь); корень делает переход у нейтральной точки плавным
  const x = (B - A) / (A + B);
  if (x < 0) {
    const dilution = 0.5 * Math.log10(Math.max(1, V / acidVol)) * -x;
    return clamp(7 - (7 - pHa) * Math.sqrt(-x) + dilution, pHa, 7);
  }
  const dilution = 0.5 * Math.log10(Math.max(1, V / baseVol)) * x;
  return clamp(7 + (pHb - 7) * Math.sqrt(x) - dilution, 7, pHb);
}

// Цвет сока краснокочанной капусты при разном pH
const CABBAGE = [
  [1, "#d7263d"], [3, "#e0578a"], [5, "#9b4fb5"], [7, "#6c5bc4"],
  [8.5, "#3f72d6"], [10, "#2a9d8f"], [12, "#58b947"], [14, "#d9cf3a"]
];
// Универсальная индикаторная бумага
const STRIP = [
  [1, "#d62828"], [3, "#f77f00"], [5, "#fcbf49"], [7, "#5bb15a"],
  [9, "#2a9d8f"], [11, "#2463c7"], [13, "#5a2a82"]
];

function scale(stops, ph) {
  const p = clamp(ph, stops[0][0], stops[stops.length - 1][0]);
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i], [b, cb] = stops[i + 1];
    if (p <= b) return mixHex(ca, cb, (p - a) / (b - a));
  }
  return stops[stops.length - 1][1];
}
function mixHex(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return "#" + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("");
}

export const cabbageColor = (ph) => scale(CABBAGE, ph);
export const stripColor = (ph) => scale(STRIP, ph);

export function phWord(ph) {
  if (ph < 3) return "сильнокислая";
  if (ph < 6.5) return "кислая";
  if (ph <= 7.5) return "нейтральная";
  if (ph < 11) return "щелочная";
  return "сильнощелочная";
}
