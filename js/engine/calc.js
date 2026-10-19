// Расчётный стол: пошаговая задача, каждый шаг открывается после верного ответа.
// Числа генерируются заново (task.generate), проверка с допуском.
import { $, esc, parseNum } from "../core/util.js";

export function createCalc(root, task, { onDone = () => {} } = {}) {
  let p, idx;

  function start() {
    p = task.generate();
    idx = 0;
    root.innerHTML = `
      <div class="calc">
        <p class="calc-intro">${p.intro}</p>
        <ol class="calc-steps">${p.steps.map((s, i) => `
          <li class="calc-step" data-i="${i}" ${i > 0 ? "hidden" : ""}>
            <label><span class="calc-q">${esc(s.q)}</span>
              <span class="calc-input"><input type="text" inputmode="decimal" autocomplete="off" aria-label="${esc(s.q)}"><span class="unit">${esc(s.unit)}</span></span>
            </label>
            <div class="calc-actions">
              <button type="button" class="btn small" data-act="check">Проверить</button>
              <button type="button" class="btn ghost small" data-act="hint">Подсказка</button>
            </div>
            <p class="calc-msg" aria-live="polite"></p>
          </li>`).join("")}
        </ol>
        <div class="calc-done" hidden><p>${p.conclusion}</p></div>
        <button type="button" class="btn ghost small" data-act="new">🎲 Другие числа</button>
      </div>`;
  }

  function check(li) {
    const i = Number(li.dataset.i);
    const s = p.steps[i];
    const v = parseNum($("input", li).value);
    const msg = $(".calc-msg", li);
    if (v === null) { msg.className = "calc-msg hint"; msg.textContent = "Введите число. Дробную часть можно через запятую."; return; }
    const ok = Math.abs(v - s.answer) <= Math.max(s.tol * Math.abs(s.answer), 0.001);
    if (!ok) {
      msg.className = "calc-msg bad";
      msg.textContent = "Пока не сходится. Попробуйте ещё раз или откройте подсказку.";
      return;
    }
    msg.className = "calc-msg ok";
    msg.textContent = `✓ ${s.explain}`;
    li.classList.add("solved");
    $("input", li).disabled = true;
    li.querySelectorAll("button").forEach((b) => { b.hidden = true; });
    const next = root.querySelector(`.calc-step[data-i="${i + 1}"]`);
    if (next) {
      next.hidden = false;
      $("input", next).focus();
      idx = i + 1;
    } else {
      $(".calc-done", root).hidden = false;
      onDone();
    }
  }

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const li = btn.closest(".calc-step");
    if (btn.dataset.act === "check") check(li);
    if (btn.dataset.act === "hint") {
      const msg = $(".calc-msg", li);
      msg.className = "calc-msg hint";
      msg.textContent = `💡 ${p.steps[Number(li.dataset.i)].hint}`;
    }
    if (btn.dataset.act === "new") start();
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches(".calc-step input")) check(e.target.closest(".calc-step"));
  });

  start();
}
