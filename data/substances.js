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
    state: "solid", color: "#ffffff", sep: { type: "soluble" }, ph: 8.3, base: 1,
    inWater: "Сода растворилась, раствор прозрачный. Пузырей нет."
  },
  vinegar: {
    name: "Уксус 9 %", formula: "CH3COOH", chem: "9 % уксусной кислоты в воде",
    state: "liquid", color: "#fbf3d5", ph: 2.5, acid: 1,
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
  // ───── кислоты, щёлочи, индикатор (модули 5, 7) ─────
  stomach: {
    name: "Желудочный сок", formula: "HCl", chem: "модель: слабый раствор соляной кислоты",
    state: "liquid", color: "#f3efe2", ph: 1.2, acid: 1,
    pour: "Налили «желудочный сок» — слабую соляную кислоту."
  },
  antacid: {
    name: "Таблетка антацида", formula: "CaCO3", chem: "карбонат кальция, как мел",
    state: "solid", color: "#f6f6f6", ph: 9, base: 1, insoluble: true,
    inWater: "Таблетка рассыпалась на дне. В воде она почти не растворяется."
  },
  cabbage: {
    name: "Капустный индикатор", chem: "отвар краснокочанной капусты",
    state: "liquid", color: "#6c5bc4", ph: 7, indicator: true,
    pour: "Налили фиолетовый отвар краснокочанной капусты."
  },
  lemon: {
    name: "Лимонный сок", chem: "лимонная кислота в воде",
    state: "liquid", color: "#fbf1a8", ph: 2.3, acid: 1,
    pour: "Выжали лимон."
  },
  milk: {
    name: "Молоко", chem: "вода, жиры, белки, молочный сахар",
    state: "liquid", color: "#fbfaf4", ph: 6.6, acid: 0.05,
    pour: "Налили молока."
  },
  soap: {
    name: "Мыльный раствор", formula: "C17H35COONa", chem: "хозяйственное мыло в воде",
    state: "liquid", color: "#eef3f6", ph: 10, base: 0.3, lather: true,
    pour: "Налили мыльный раствор."
  },
  shampoo: {
    name: "Шампунь", chem: "ПАВ с кислой добавкой",
    state: "liquid", color: "#e9f4ef", ph: 5.5, acid: 0.05, lather: true,
    pour: "Налили шампунь."
  },
  ammonia: {
    name: "Нашатырный спирт", formula: "NH3", chem: "раствор аммиака",
    state: "liquid", color: "#f2f6fb", ph: 11.5, base: 1,
    pour: "Налили нашатырь. Резкий запах — не нюхайте близко!"
  },
  soilwater: {
    name: "Вытяжка из почвы", chem: "вода, настоянная на кислой почве с грядки",
    state: "liquid", color: "#c8b38c", ph: 4.6, acid: 0.4,
    pour: "Налили настой почвы с грядки."
  },
  lime: {
    name: "Известь (мел)", formula: "CaCO3", chem: "карбонат кальция: мел, доломитовая мука",
    state: "solid", color: "#f4f2ea", ph: 9, base: 0.3, insoluble: true,
    inWater: "Мел почти не растворяется, но потихоньку гасит кислоту."
  },
  // ───── соли и жёсткость (модуль 8) ─────
  hardwater: {
    name: "Жёсткая вода", formula: "Ca(HCO3)2", chem: "вода с растворёнными солями кальция",
    state: "liquid", color: "#d5e8f5", ph: 7.6,
    pour: "Налили жёсткой воды из-под крана. С виду обычная."
  },
  citric: {
    name: "Лимонная кислота", formula: "C6H8O7", chem: "порошок из хозяйственного отдела",
    state: "solid", color: "#ffffff", ph: 2.2, acid: 1.5,
    inWater: "Лимонная кислота растворилась. Раствор кислый."
  },
  washsoda: {
    name: "Стиральная сода", formula: "Na2CO3", chem: "карбонат натрия",
    state: "solid", color: "#fbfbfb", ph: 11.4, base: 1,
    inWater: "Стиральная сода растворилась. Раствор щелочной, скользкий на ощупь."
  },
  scale: {
    name: "Накипь", formula: "CaCO3", chem: "карбонат кальция",
    state: "precipitate", color: "#f1ede2", ph: 9, base: 0.05
  },
  scum: {
    name: "Кальциевое мыло", chem: "серые хлопья: мыло + кальций",
    state: "precipitate", color: "#c9c4b4"
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
