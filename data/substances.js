// Реактивы на полке лаборатории.
// state: solid — насыпается, liquid — наливается.
// inWater — что видно, когда твёрдое вещество попадает в жидкость.
// sep — как вещество ведёт себя при разделении смесей:
//   solvent (вода), soluble (растворяется), insoluble (не растворяется; settle: fast/slow),
//   immiscible (жидкость, не смешивается с водой; density, flammable), microbes.
// mix — готовая смесь: при добавлении раскладывается на составные части.
export const SUBSTANCES = {
  soda: {
    name: "Пищевая сода", formula: "NaHCO3", chem: "гидрокарбонат натрия",
    state: "solid", color: "#ffffff", sep: { type: "soluble" },
    inWater: "Сода растворилась, раствор прозрачный. Пузырей нет."
  },
  vinegar: {
    name: "Уксус 9 %", formula: "CH3COOH", chem: "9 % уксусной кислоты в воде",
    state: "liquid", color: "#fbf3d5",
    pour: "Налили уксус. Пахнет кисло."
  },
  water: {
    name: "Вода", formula: "H2O", chem: "вода",
    state: "liquid", color: "#cfe6fb", sep: { type: "solvent" },
    pour: "Налили воды."
  },
  salt: {
    name: "Поваренная соль", formula: "NaCl", chem: "хлорид натрия",
    state: "solid", color: "#eef2f4", sep: { type: "soluble" },
    inWater: "Соль растворилась без следа. Ни пузырей, ни мути."
  },
  sugar: {
    name: "Сахар", formula: "C12H22O11", chem: "сахароза",
    state: "solid", color: "#fffaf0", sep: { type: "soluble" },
    inWater: "Сахар растворился. Раствор прозрачный и сладкий."
  },
  sand: {
    name: "Песок", formula: "SiO2", chem: "в основном оксид кремния",
    state: "solid", color: "#d9b46c", sep: { type: "insoluble", settle: "fast" }
  },
  clay: {
    name: "Глина и муть", chem: "мельчайшие частицы глины",
    state: "solid", color: "#9a7348", sep: { type: "insoluble", settle: "slow" }
  },
  microbes: {
    name: "Микробы", chem: "бактерии и простейшие из ручья",
    state: "solid", color: "#5aa05a", sep: { type: "microbes" }
  },
  gasoline: {
    name: "Бензин", formula: "C8H18", chem: "смесь углеводородов, в основном октан",
    state: "liquid", color: "#f6df6e", sep: { type: "immiscible", density: 0.74, flammable: true },
    pour: "Налили бензин. Резкий запах — пары легко воспламеняются."
  },
  oil: {
    name: "Подсолнечное масло", chem: "жиры: длинные цепочки из C и H",
    state: "liquid", color: "#f0bf2e", sep: { type: "immiscible", density: 0.92 },
    pour: "Налили масло. Оно легло слоем поверх воды."
  },
  // ───── готовые смеси ─────
  creek: {
    name: "Вода из ручья", chem: "вода + глина + микробы",
    state: "liquid", color: "#c4ad84", mix: { water: 2, clay: 1, microbes: 1 },
    pour: "Набрали воды из ручья. Мутная, с запахом тины."
  },
  saltsand: {
    name: "Соль с песком", chem: "соль + песок вперемешку",
    state: "solid", color: "#e6d5b0", mix: { salt: 1, sand: 1 }
  },
  tank: {
    name: "Бензин из бака", chem: "бензин, в который попала вода",
    state: "liquid", color: "#ede0a6", mix: { gasoline: 2, water: 1 }, shaken: true,
    pour: "Слили бензин из бака. Он мутноватый: внутри мелкие капли воды."
  }
};
