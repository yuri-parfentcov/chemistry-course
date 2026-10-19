// Реактивы на полке лаборатории.
// state: solid — насыпается, liquid — наливается.
// inWater — что видно, когда твёрдое вещество попадает в жидкость.
export const SUBSTANCES = {
  soda: {
    name: "Пищевая сода", formula: "NaHCO3", chem: "гидрокарбонат натрия",
    state: "solid", color: "#ffffff",
    inWater: "Сода растворилась, раствор прозрачный. Пузырей нет."
  },
  vinegar: {
    name: "Уксус 9 %", formula: "CH3COOH", chem: "9 % уксусной кислоты в воде",
    state: "liquid", color: "#fbf3d5",
    pour: "Налили уксус. Пахнет кисло."
  },
  water: {
    name: "Вода", formula: "H2O", chem: "вода",
    state: "liquid", color: "#cfe6fb",
    pour: "Налили воды."
  },
  salt: {
    name: "Поваренная соль", formula: "NaCl", chem: "хлорид натрия",
    state: "solid", color: "#eef2f4",
    inWater: "Соль растворилась без следа. Ни пузырей, ни мути."
  },
  sugar: {
    name: "Сахар", formula: "C12H22O11", chem: "сахароза",
    state: "solid", color: "#fffaf0",
    inWater: "Сахар растворился. Раствор прозрачный и сладкий."
  }
};
