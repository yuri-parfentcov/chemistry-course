// Сброс кэша браузера: проставляет ?v=N во все относительные импорты (js/, data/)
// и в ссылки на css/js в html. Без этого браузер берёт файлы уроков из кэша.
// Запуск: node tools/bump.mjs        — следующая версия
//         node tools/bump.mjs 15     — конкретная версия
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const html = ["index.html", "lesson.html", "garden.html", "game.html"].map((f) => join(ROOT, f));
const cur = Number(readFileSync(html[1], "utf8").match(/\?v=(\d+)/)?.[1] || 0);
const v = Number(process.argv[2]) || cur + 1;

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith(".js") ? [p] : [];
});

let n = 0;
const rewrite = (file, re) => {
  const src = readFileSync(file, "utf8");
  const out = src.replace(re, (_, a, path, _q, b) => `${a}${path}?v=${v}${b}`);
  if (out !== src) { writeFileSync(file, out); n++; }
};
for (const f of [...walk(join(ROOT, "js")), ...walk(join(ROOT, "data"))])
  rewrite(f, /(from\s+["'])(\.{1,2}\/[^"'?]+\.js)(\?v=\d+)?(["'])/g);
for (const f of html)
  rewrite(f, /((?:href|src)=")((?:css|js)\/[^"?]+\.(?:css|js))(\?v=\d+)?(")/g);
console.log(`версия ${v}, файлов изменено: ${n}`);
