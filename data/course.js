// Курс: модули → уроки-миссии → шаги.
// Шаги: task (задача) → hypothesis (гипотеза) → lab (опыт) → calc (расчёт) → cards (закрепление)
import { fmt, fixed, pick } from "../js/core/util.js";
import * as m1 from "./lessons/m1.js";
import * as m2 from "./lessons/m2.js";
import * as m3 from "./lessons/m3.js";
import * as m4 from "./lessons/m4.js";
import * as m5 from "./lessons/m5.js";
import * as m6 from "./lessons/m6.js";
import * as m7 from "./lessons/m7.js";
import * as m8 from "./lessons/m8.js";
import * as m9 from "./lessons/m9.js";
import * as m10 from "./lessons/m10.js";
import * as m11 from "./lessons/m11.js";
import * as m12 from "./lessons/m12.js";
import * as m13 from "./lessons/m13.js";

export const LESSON_PACKS = [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13];

export const MODULES = [
  { n: 1, title: "Вещества и смеси", lessons: ["creek-water", "salt-sand", "fuel-water"], plan: [] },
  { n: 2, title: "Атомы и таблица Менделеева", lessons: ["battery-lithium", "fertilizer-npk"], plan: ["из чего сделана монета 🔨"] },
  { n: 3, title: "Связи и молекулы", lessons: ["water-oil", "kitchen-gases"], plan: ["почему клей клеит 🔨"] },
  { n: 4, title: "Реакции и уравнения", lessons: ["gas-stove", "rust-thermite"], plan: [] },
  { n: 5, title: "Моль и масса", lessons: ["soda-vinegar", "antacid"], plan: [] },
  { n: 6, title: "Растворы и концентрации", lessons: ["vinegar-essence", "saline", "antifreeze"], plan: [] },
  { n: 7, title: "Кислоты, основания, pH", lessons: ["cabbage-indicator", "soil-lime", "shampoo-ph"], plan: [] },
  { n: 8, title: "Соли, осадки, жёсткость воды", lessons: ["limescale", "hard-water-soap"], plan: ["высолы на кирпиче 🔨"] },
  { n: 9, title: "Окисление и восстановление", lessons: ["lemon-battery", "zinc-protection", "bleach-peroxide"], plan: [] },
  { n: 10, title: "Энергия и скорость реакций", lessons: ["hand-warmers", "fridge-rate", "car-catalyst"], plan: [] },
  { n: 11, title: "Органика I: топливо, спирты, ароматы", lessons: ["fuels", "antiseptic", "esters"], plan: [] },
  { n: 12, title: "Органика II: мыло и полимеры", lessons: ["soap-making", "plastics"], plan: ["эпоксидка 🔨"] },
  { n: 13, title: "Безопасность", lessons: ["never-mix", "hazard-labels", "fire-safety"], plan: [] }
];

const PILOT = {
  "soda-vinegar": {
    id: "soda-vinegar",
    module: 5,
    sphere: "kitchen",
    pilot: true,
    title: "Зачем гасить соду уксусом",
    subtitle: "и сколько уксуса на самом деле нужно",
    steps: [
      {
        type: "task",
        title: "Задача",
        html: `
          <p class="lead">В рецепте оладий написано: <q>½ чайной ложки соды, погасить уксусом</q>.</p>
          <p>Многие делают это по привычке. А зачем? Почему не насыпать соду прямо в тесто? И сколько уксуса нужно, чтобы не осталось ни лишней соды, ни лишней кислоты?</p>
          <div class="goals">
            <p><b>За эту миссию вы:</b></p>
            <ul>
              <li>🔬 увидите, что происходит с атомами, когда сода шипит;</li>
              <li>⚖️ научитесь читать уравнение реакции;</li>
              <li>🧮 посчитаете, сколько уксуса нужно на ваше количество соды.</li>
            </ul>
          </div>`
      },
      {
        type: "hypothesis",
        title: "Гипотеза",
        q: "Сода в уксусе шипит. Как вы думаете, что это за пузыри?",
        note: "Угадывать можно и нужно: проверим в лаборатории.",
        options: [
          { t: "Углекислый газ — как в газировке", ok: true },
          { t: "Кислород — как от перекиси на ране" },
          { t: "Пары уксуса — он вскипает" },
          { t: "Воздух, который был спрятан в порошке" }
        ]
      },
      {
        type: "lab",
        title: "Опыт",
        intro: "Перед вами стакан и полка с реактивами. Нажмите на банку (или перетащите её в стакан), чтобы добавить вещество.",
        substances: ["soda", "vinegar", "water", "salt", "sugar"],
        goals: [
          { id: "soda-water", text: "Насыпьте соду в воду. Будут пузыри?", event: "dissolve", substance: "soda" },
          { id: "reaction", text: "Добавьте к соде уксус", event: "reaction" },
          { id: "micro", text: "Посмотрите в «лупу», что делают атомы" }
        ],
        reaction: "soda-vinegar",
        theory: `
          <p><b>Что произошло.</b> Уксусная кислота отдаёт соде атом водорода. Получается угольная кислота H<sub>2</sub>CO<sub>3</sub>. Она нестойкая и сразу распадается на воду и <b>углекислый газ CO<sub>2</sub></b>. Это и есть пузыри, тот же газ, что в газировке.</p>
          <p><b>Зачем это тесту.</b> Пузыри CO<sub>2</sub> делают тесто пышным. Если кислоты мало, часть соды остаётся в тесте, и у оладий появляется мыльный горьковатый привкус. Если кислоты много, тесто кислит.</p>
          <p><b>Главное правило химии.</b> Атомы в реакции не исчезают и не появляются. Они только меняют партнёров. Поэтому в уравнении слева и справа атомов поровну.</p>`
      },
      {
        type: "calc",
        title: "Расчёт",
        theory: `
          <p>Химики считают вещества <b>молями</b>. Моль — это «химическая дюжина», огромная, но всегда одинаковая порция частиц. Удобно то, что моль каждого вещества весит столько граммов, сколько весят его атомы в сумме.</p>
          <table class="mass-table">
            <tr><th>Атом</th><td><span class="el el-H">H</span></td><td><span class="el el-C">C</span></td><td><span class="el el-O">O</span></td><td><span class="el el-Na">Na</span></td></tr>
            <tr><th>Масса, г/моль</th><td>1</td><td>12</td><td>16</td><td>23</td></tr>
          </table>
          <p>Уравнение говорит: <b>1 моль соды реагирует с 1 молем уксусной кислоты</b>. Значит, считаем так: граммы соды → моли соды → моли кислоты → граммы кислоты → миллилитры уксуса.</p>`,
        generate() {
          const m = pick([2, 3, 4, 5, 6]);
          const c = pick([9, 6]);
          const vinegar = c === 9 ? "столовый уксус 9 %" : "яблочный уксус 6 %";
          const n = m / 84;
          const mA = n * 60;
          const V = mA / (c / 100);
          return {
            intro: `В рецепте <b>${m} г соды</b> (для ориентира: чайная ложка соды без горки — около 5 г). У вас <b>${vinegar}</b>. Сколько уксуса нужно, чтобы погасить всю соду?`,
            steps: [
              {
                q: "Молярная масса соды NaHCO₃",
                unit: "г/моль", answer: 84, tol: 0.01,
                hint: "Сложите массы атомов: Na + H + C + 3 × O = 23 + 1 + 12 + 3 × 16.",
                explain: "23 + 1 + 12 + 48 = 84 г/моль. Один моль соды весит 84 г."
              },
              {
                q: `Сколько молей соды в ${m} г?`,
                unit: "моль", answer: n, tol: 0.05,
                hint: "Моли = масса / молярная масса. Округлите до тысячных.",
                explain: `${m} / 84 ≈ ${fixed(n, 3)} моль.`
              },
              {
                q: "Сколько граммов уксусной кислоты CH₃COOH нужно? (M = 60 г/моль)",
                unit: "г", answer: mA, tol: 0.05,
                hint: "Молей кислоты столько же, сколько молей соды. Масса = моли × 60.",
                explain: `${fixed(n, 3)} × 60 ≈ ${fixed(mA, 2)} г чистой кислоты.`
              },
              {
                q: `Сколько миллилитров уксуса ${c} %? (1 мл уксуса ≈ 1 г)`,
                unit: "мл", answer: V, tol: 0.05,
                hint: `В ${c} % уксусе на каждые 100 г приходится ${c} г кислоты. Масса уксуса = масса кислоты / ${fmt(c / 100, 2)}.`,
                explain: `${fixed(mA, 2)} / ${fmt(c / 100, 2)} ≈ ${fmt(V, 0)} мл.`
              }
            ],
            conclusion: `Нужно около <b>${fmt(V, 0)} мл</b> уксуса, это примерно <b>${fmt(V / 15, 1)} ст. ложки</b>. Больше, чем обычно льют на глаз! Поэтому соду часто «гасят» кислотой самого теста: кефиром, йогуртом, лимонным соком. А если кислоты не хватает, остаток соды даёт тот самый мыльный привкус.`
          };
        }
      },
      {
        type: "cards",
        title: "Закрепление",
        text: "Эти вопросы попадут в вашу коллекцию кристаллов. Каждый день отвечайте на несколько. Вопросы, которые вы помните, будут возвращаться всё реже: через 1, 2, 3, 5 и 10 дней."
      }
    ]
  }
};

// Все уроки по id; module — номер модуля, в котором урок стоит на карте
export const LESSONS = Object.fromEntries(
  [...LESSON_PACKS.flatMap((p) => p.LESSONS), ...Object.values(PILOT)].map((l) => [l.id, l])
);
for (const m of MODULES) for (const id of m.lessons || []) LESSONS[id].module = m.n;
