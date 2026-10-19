// Элементы для «лупы», конструктора и уравнений: масса (г/моль), цвет шарика (цвета CPK),
// радиус в условных единицах, valence — сколько «рук»-связей у атома в конструкторе молекул
export const ELEMENTS = {
  H:  { name: "Водород",  mass: 1.008,  color: "#f4f4f4", ink: "#333", r: 0.3, valence: 1 },
  Li: { name: "Литий",    mass: 6.94,   color: "#c77dff", ink: "#fff", r: 0.5 },
  C:  { name: "Углерод",  mass: 12.011, color: "#41474d", ink: "#fff", r: 0.42, valence: 4 },
  N:  { name: "Азот",     mass: 14.007, color: "#3b6fe0", ink: "#fff", r: 0.42, valence: 3 },
  O:  { name: "Кислород", mass: 15.999, color: "#e0453a", ink: "#fff", r: 0.42, valence: 2 },
  Na: { name: "Натрий",   mass: 22.990, color: "#9b5de5", ink: "#fff", r: 0.5 },
  Mg: { name: "Магний",   mass: 24.305, color: "#5fa83a", ink: "#fff", r: 0.48 },
  Al: { name: "Алюминий", mass: 26.982, color: "#a9b3bb", ink: "#222", r: 0.48 },
  P:  { name: "Фосфор",   mass: 30.974, color: "#f08a24", ink: "#fff", r: 0.46, valence: 3 },
  S:  { name: "Сера",     mass: 32.06,  color: "#e5c22a", ink: "#222", r: 0.46, valence: 2 },
  Cl: { name: "Хлор",     mass: 35.45,  color: "#2fa84f", ink: "#fff", r: 0.48, valence: 1 },
  K:  { name: "Калий",    mass: 39.098, color: "#7d3fc4", ink: "#fff", r: 0.55 },
  Ca: { name: "Кальций",  mass: 40.078, color: "#4c9e6e", ink: "#fff", r: 0.52 },
  Fe: { name: "Железо",   mass: 55.845, color: "#c4622d", ink: "#fff", r: 0.5 },
  Cu: { name: "Медь",     mass: 63.546, color: "#c8803a", ink: "#fff", r: 0.5 }
};
