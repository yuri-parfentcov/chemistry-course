// Реакции. Каждая описана данными: что смешать, уравнение, что видно в колбе (effects)
// и сценарий для «лупы» (micro): атомы с координатами до и после, связи до и после.
// Атом сохраняет свой id — так видно, что атомы не исчезают, а меняют партнёров.
// condition: "heat" — реакция идёт только при нагреве; produces — какие вещества появляются в стакане
// (например, осадок); effects.precipitate — подпись выпавшего осадка.
export const REACTIONS = [
  {
    id: "methane-burn",
    reactants: [],   // в стакане не ставится — только «лупа»
    equation: {
      left: [
        { f: "CH4", k: 1, name: "метан" },
        { f: "O2", k: 2, name: "кислород" }
      ],
      right: [
        { f: "CO2", k: 1, name: "углекислый газ", gas: true },
        { f: "H2O", k: 2, name: "вода (пар)", gas: true }
      ]
    },
    micro: {
      atoms: [
        { id: "c", el: "C", from: [1.5, 0], to: [3.45, -1.4] },
        { id: "h1", el: "H", from: [1.5, -1.1], to: [0.5, 1.8] },
        { id: "h2", el: "H", from: [0.4, 0], to: [2.1, 1.8] },
        { id: "h3", el: "H", from: [1.5, 1.1], to: [4.4, 1.8] },
        { id: "h4", el: "H", from: [2.6, 0], to: [6.0, 1.8] },
        { id: "oa", el: "O", from: [4.4, -1.0], to: [2.3, -1.4] },
        { id: "ob", el: "O", from: [5.6, -1.0], to: [1.3, 1.2] },
        { id: "oc", el: "O", from: [4.4, 1.0], to: [4.6, -1.4] },
        { id: "od", el: "O", from: [5.6, 1.0], to: [5.2, 1.2] }
      ],
      gasAtoms: ["c", "oa", "oc"],
      bondsBefore: [
        ["c", "h1", 1], ["c", "h2", 1], ["c", "h3", 1], ["c", "h4", 1],
        ["oa", "ob", 2], ["oc", "od", 2]
      ],
      bondsAfter: [
        ["c", "oa", 2], ["c", "oc", 2],
        ["ob", "h1", 1], ["ob", "h2", 1], ["od", "h3", 1], ["od", "h4", 1]
      ],
      labelsBefore: [
        { text: "метан CH₄", x: 1.5, y: 2.3 },
        { text: "кислород 2 O₂", x: 5.0, y: 2.3 }
      ],
      labelsAfter: [
        { text: "CO₂", x: 3.45, y: -3.0 },
        { text: "вода", x: 1.3, y: 2.9 },
        { text: "вода", x: 5.2, y: 2.9 }
      ],
      captions: [
        "Молекула метана и две молекулы кислорода сталкиваются в пламени.",
        "Жар рвёт связи C–H и O=O.",
        "Атомы меняют партнёров: углерод забирает два кислорода, водороды уходят к оставшимся кислородам.",
        "Получились CO₂ и две молекулы воды. При этом выделяется много тепла: на нём мы и готовим.",
        "Продукты улетают с горячим воздухом. Масса не исчезла: она ушла в газы."
      ]
    }
  },
  {
    id: "soda-vinegar",
    reactants: ["soda", "vinegar"],
    equation: {
      left: [
        { f: "NaHCO3", k: 1, name: "сода" },
        { f: "CH3COOH", k: 1, name: "уксусная кислота" }
      ],
      right: [
        { f: "CH3COONa", k: 1, name: "ацетат натрия" },
        { f: "H2O", k: 1, name: "вода" },
        { f: "CO2", k: 1, name: "углекислый газ", gas: true }
      ]
    },
    effects: { gas: "CO₂", foam: true, heat: -1.5 },
    observe: "Шипение и пена! Выделяется углекислый газ CO₂. Термометр показывает, что смесь чуть остыла: эта реакция поглощает тепло.",
    micro: {
      atoms: [
        // сода: Na⁺ и HCO₃⁻
        { id: "na", el: "Na", from: [2.7, 1.9], to: [8.1, 1.9], charge: ["+", "+"] },
        { id: "c1", el: "C", from: [1.5, 0], to: [1.5, -1.2] },
        { id: "oa", el: "O", from: [1.5, -1.2], to: [0.35, -1.2], gas: true },
        { id: "ob", el: "O", from: [0.45, 0.6], to: [1.0, 1.3] },
        { id: "hb", el: "H", from: [-0.35, 0.05], to: [0.2, 1.9] },
        { id: "oc", el: "O", from: [2.55, 0.6], to: [2.65, -1.2], charge: ["−", ""], gas: true },
        // уксусная кислота: CH₃COOH
        { id: "c2", el: "C", from: [5.2, 0], to: [5.2, 0] },
        { id: "h1", el: "H", from: [5.2, -1.05], to: [5.2, -1.05] },
        { id: "h2", el: "H", from: [4.2, 0.35], to: [4.2, 0.35] },
        { id: "h3", el: "H", from: [5.2, 1.05], to: [5.2, 1.05] },
        { id: "c3", el: "C", from: [6.4, 0], to: [6.4, 0] },
        { id: "od", el: "O", from: [7.0, -1.0], to: [7.0, -1.0] },
        { id: "oe", el: "O", from: [7.0, 1.0], to: [7.0, 1.0], charge: ["", "−"] },
        { id: "ha", el: "H", from: [7.95, 1.3], to: [1.8, 1.9] }
      ],
      gasAtoms: ["c1", "oa", "oc"],
      bondsBefore: [
        ["c1", "oa", 2], ["c1", "ob", 1], ["ob", "hb", 1], ["c1", "oc", 1],
        ["c2", "h1", 1], ["c2", "h2", 1], ["c2", "h3", 1], ["c2", "c3", 1],
        ["c3", "od", 2], ["c3", "oe", 1], ["oe", "ha", 1]
      ],
      bondsAfter: [
        ["c2", "h1", 1], ["c2", "h2", 1], ["c2", "h3", 1], ["c2", "c3", 1],
        ["c3", "od", 2], ["c3", "oe", 1],
        ["ob", "hb", 1], ["ob", "ha", 1],
        ["c1", "oa", 2], ["c1", "oc", 2]
      ],
      ionicBefore: [["na", "oc"]],
      ionicAfter: [["na", "oe"]],
      labelsBefore: [
        { text: "сода NaHCO₃", x: 1.2, y: 2.9 },
        { text: "уксусная кислота CH₃COOH", x: 6.0, y: 2.3 }
      ],
      labelsAfter: [
        { text: "ацетат натрия", x: 6.3, y: 2.9 },
        { text: "вода", x: 1.0, y: 2.9 },
        { text: "CO₂ — пузыри!", x: 1.5, y: -3.0 }
      ],
      captions: [
        "Сода и уксусная кислота встретились в воде.",
        "Кислота отдаёт свой атом водорода. Старые связи рвутся.",
        "Атомы меняют партнёров. Ни один не исчез и не появился.",
        "Образуются новые связи: вода и углекислый газ.",
        "Углекислый газ улетает пузырём. В растворе остаётся ацетат натрия."
      ]
    }
  },  {
    id: "antacid",
    reactants: ["stomach", "antacid"],
    equation: {
      left: [{ f: "CaCO3", k: 1, name: "мел (антацид)" }, { f: "HCl", k: 2, name: "соляная кислота" }],
      right: [{ f: "CaCl2", k: 1, name: "хлорид кальция" }, { f: "H2O", k: 1, name: "вода" }, { f: "CO2", k: 1, name: "углекислый газ", gas: true }]
    },
    effects: { gas: "CO₂", heat: 0.5 },
    observe: "Таблетка шипит и растворяется: карбонат кальция гасит кислоту, выделяется CO₂. Отсюда отрыжка после антацида."
  },
  {
    id: "scale-form",
    reactants: ["hardwater"],
    condition: "heat",
    produces: { scale: 1 },
    equation: {
      left: [{ f: "Ca(HCO3)2", k: 1, name: "растворённый кальций" }],
      right: [{ f: "CaCO3", k: 1, name: "накипь" }, { f: "H2O", k: 1, name: "вода" }, { f: "CO2", k: 1, name: "углекислый газ", gas: true }]
    },
    effects: { gas: "CO₂", gasPower: 0.25 },
    observe: "При кипячении вода помутнела, и на дно выпал белый осадок. Это накипь, карбонат кальция."
  },
  {
    id: "scale-citric",
    reactants: ["scale", "citric"],
    equation: {
      left: [{ f: "CaCO3", k: 3, name: "накипь" }, { f: "C6H8O7", k: 2, name: "лимонная кислота" }],
      right: [{ f: "Ca3(C6H5O7)2", k: 1, name: "цитрат кальция" }, { f: "H2O", k: 3, name: "вода" }, { f: "CO2", k: 3, name: "углекислый газ", gas: true }]
    },
    effects: { gas: "CO₂" },
    observe: "Накипь зашипела и исчезла: лимонная кислота превратила её в растворимую соль и CO₂."
  },
  {
    id: "scale-vinegar",
    reactants: ["scale", "vinegar"],
    equation: {
      left: [{ f: "CaCO3", k: 1, name: "накипь" }, { f: "CH3COOH", k: 2, name: "уксусная кислота" }],
      right: [{ f: "Ca(CH3COO)2", k: 1, name: "ацетат кальция" }, { f: "H2O", k: 1, name: "вода" }, { f: "CO2", k: 1, name: "углекислый газ", gas: true }]
    },
    effects: { gas: "CO₂" },
    observe: "Накипь шипит и растворяется в уксусе. Работает, но запах на всю кухню."
  },
  {
    id: "hard-soap",
    reactants: ["hardwater", "soap"],
    produces: { scum: 1 },
    equation: {
      left: [{ f: "Ca(HCO3)2", k: 1, name: "жёсткая вода" }, { f: "C17H35COONa", k: 2, name: "мыло" }],
      right: [{ f: "Ca(C17H35COO)2", k: 1, name: "кальциевое мыло" }, { f: "NaHCO3", k: 2, name: "сода" }]
    },
    effects: { precipitate: "серые хлопья" },
    observe: "Мыло не пенится! В воде появились серые хлопья: кальций из жёсткой воды «съел» мыло."
  },
  {
    id: "softening",
    reactants: ["hardwater", "washsoda"],
    produces: { scale: 1 },
    equation: {
      left: [{ f: "Ca(HCO3)2", k: 1, name: "жёсткая вода" }, { f: "Na2CO3", k: 1, name: "стиральная сода" }],
      right: [{ f: "CaCO3", k: 1, name: "осадок" }, { f: "NaHCO3", k: 2, name: "сода" }]
    },
    effects: { precipitate: "белый осадок" },
    observe: "Вода помутнела, выпал белый осадок: стиральная сода связала кальций. Вода стала мягкой."
  },  {
    id: "bleach-tea",
    reactants: ["tea", "bleach"],
    equation: {
      left: [{ f: "NaOCl", k: 1, name: "гипохлорит" }, { f: "C15H14O6", k: 1, name: "краситель чая (катехин)" }],
      right: [{ f: "NaCl", k: 1, name: "соль" }, { f: "C15H14O7", k: 1, name: "бесцветный продукт" }]
    },
    effects: {},
    observe: "Чай обесцветился! Белизна окислила молекулы красителя: они больше не поглощают свет."
  },
  {
    id: "peroxide-catalase",
    reactants: ["peroxide"],
    catalyst: "yeast",
    equation: {
      left: [{ f: "H2O2", k: 2, name: "перекись водорода" }],
      right: [{ f: "H2O", k: 2, name: "вода" }, { f: "O2", k: 1, name: "кислород", gas: true }]
    },
    effects: { gas: "O₂" },
    observe: "Перекись вскипела пеной! Фермент из картошки разлагает её на воду и кислород. Картошка при этом не расходуется: это катализатор."
  },
  {
    id: "handwarmer",
    reactants: ["acetatepad", "seed"],
    produces: { crystals: 1 },
    equation: {
      left: [{ f: "CH3COONa", k: 1, name: "ацетат в растворе" }],
      right: [{ f: "CH3COONa", k: 1, name: "ацетат-кристаллы" }]
    },
    effects: { heat: 18 },
    observe: "От одной крупинки по всей жидкости побежали кристаллы — и стакан стал горячим! Кристаллизация отдаёт тепло."
  },
  {
    id: "saponification",
    reactants: ["fat", "lye"],
    condition: "heat",
    produces: { soap: 1 },
    equation: {
      left: [{ f: "C57H110O6", k: 1, name: "жир (тристеарин)" }, { f: "NaOH", k: 3, name: "щёлочь" }],
      right: [{ f: "C3H8O3", k: 1, name: "глицерин" }, { f: "C17H35COONa", k: 3, name: "мыло" }]
    },
    effects: {},
    observe: "Масло и щёлочь при нагреве превратились в густую массу — это мыло и глицерин. Попробуйте теперь пену!"
  },
  {
    id: "bleach-acid",
    reactants: ["bleach", "toiletacid"],
    equation: {
      left: [{ f: "NaOCl", k: 1, name: "белизна" }, { f: "HCl", k: 2, name: "кислотное средство" }],
      right: [{ f: "NaCl", k: 1, name: "соль" }, { f: "Cl2", k: 1, name: "хлор", gas: true }, { f: "H2O", k: 1, name: "вода" }]
    },
    effects: { gas: "Cl₂", hazard: "#c8d94a" },
    observe: "⚠️ Над стаканом жёлто-зелёный газ — это хлор! В реальной ванной такой «коктейль» вызывает ожог лёгких. Никогда не смешивайте хлорные средства с кислотными."
  },
  {
    id: "bleach-ammonia",
    reactants: ["bleach", "ammonia"],
    equation: {
      left: [{ f: "NaOCl", k: 1, name: "белизна" }, { f: "NH3", k: 1, name: "нашатырь" }],
      right: [{ f: "NH2Cl", k: 1, name: "хлорамин" }, { f: "NaOH", k: 1, name: "щёлочь" }]
    },
    effects: { hazard: "#dfe8a8" },
    observe: "⚠️ Выделяются пары хлораминов — едкие и ядовитые. Белизна + нашатырь (или средства для стёкол с аммиаком) — опасная пара!"
  },  {
    id: "bleach-vinegar",
    reactants: ["bleach", "vinegar"],
    equation: {
      left: [{ f: "NaOCl", k: 1, name: "белизна" }, { f: "CH3COOH", k: 1, name: "уксус" }],
      right: [{ f: "HOCl", k: 1, name: "хлорноватистая кислота" }, { f: "CH3COONa", k: 1, name: "ацетат натрия" }]
    },
    effects: { hazard: "#d6e27a" },
    observe: "⚠️ Запах хлора усилился: кислота превращает гипохлорит в хлорноватистую кислоту, и та выделяет хлор. Уксус с белизной — тоже опасная пара."
  },  {
    id: "soda-hcl",
    reactants: ["soda", "toiletacid"],
    equation: {
      left: [{ f: "NaHCO3", k: 1, name: "сода" }, { f: "HCl", k: 1, name: "соляная кислота" }],
      right: [{ f: "NaCl", k: 1, name: "соль" }, { f: "H2O", k: 1, name: "вода" }, { f: "CO2", k: 1, name: "углекислый газ", gas: true }]
    },
    effects: { gas: "CO₂" },
    observe: "Бурное шипение: сода гасит соляную кислоту, выделяется углекислый газ. Не опасно, но и чистящей силы у смеси уже нет."
  }
];
