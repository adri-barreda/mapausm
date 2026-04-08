export interface USMUnit {
  id: string;
  name: string;
  fullName: string;
  phone: string;
  color: string;
  colorLight: string;
  municipalities: string[]; // GeoJSON mun_name values
  urbanZones: string[]; // Barrios/zonas urbanas de Castelló de la Plana
}

export const USM_DATA: USMUnit[] = [
  {
    id: "2.1",
    name: "RAFALAFENA",
    fullName: "USM 2.1 Rafalafena",
    phone: "964399190",
    color: "#4A90B8",
    colorLight: "#93C5E8",
    municipalities: [
      "Albocàsser",
      "Ares del Maestrat",
      "Benassal",
      "les Coves de Vinromà",
      "Culla",
      "la Serratella",
      "Tírig",
      "la Torre d'En Besora",
      "Vilar de Canes",
      "Vilafranca",
    ],
    urbanZones: [
      "Benadressa",
      "Grupo Reyes",
      "La Salera",
      "9 d'Octubre",
      "Pintor Sorolla",
      "Rafalafena",
      "San Agustín",
      "San Lorenzo",
    ],
  },
  {
    id: "2.2",
    name: "COLUMBRETES",
    fullName: "USM 2.2 Columbretes",
    phone: "964558756",
    color: "#5A9E54",
    colorLight: "#A8D5A2",
    municipalities: [
      "l'Alcora",
      "Atzeneta del Maestrat",
      "Benlloc",
      "Borriol",
      "Cabanes",
      "Castillo de Villamalefa",
      "Benafigos",
      "Cortes de Arenoso",
      "Costur",
      "Figueroles",
      "la Pobla Tornesa",
      "les Useres",
      "Llucena",
      "Ludiente",
      "Sant Joan de Moró",
      "Sierra Engarcerán",
      "la Torre d'en Doménec",
      "Vall d'Alba",
      "Vilafamés",
      "Vilanova d'Alcolea",
      "Villahermosa del Río",
      "Torreblanca",
      "Vistabella del Maestrat",
      "Xodos",
      "Zucaina",
    ],
    urbanZones: [
      "Alcora la Foia",
      "Barranquet",
      "Rosildos",
      "Illes Columbretes",
      "Universitat-Raval",
    ],
  },
  {
    id: "2.3",
    name: "CARDENAL COSTA",
    fullName: "USM 2.3 Cardenal Costa",
    phone: "964376016",
    color: "#D4873E",
    colorLight: "#F5C28A",
    municipalities: [],
    urbanZones: [
      "Casalduch",
      "Gran Via",
      "Fernando el Católico",
      "Palleter",
      "Plaza Constitución",
    ],
  },
  {
    id: "grau",
    name: "GRAU",
    fullName: "USM Grau",
    phone: "964390656",
    color: "#C46B6B",
    colorLight: "#E8A0A0",
    municipalities: [
      "Almassora",
      "Benicàssim",
      "Orpesa",
    ],
    urbanZones: ["Grao"],
  },
];

// Color especial para Castelló de la Plana (multi-USM)
export const CASTELLO_COLOR = "#B8A0CC";
export const CASTELLO_COLOR_LIGHT = "#C4B5D4";
export const CASTELLO_NAME = "Castelló de la Plana";

// Lookup: municipality GeoJSON name → USM id
export function getUSMForMunicipality(name: string): USMUnit | null {
  if (name === CASTELLO_NAME) return null; // special case
  for (const usm of USM_DATA) {
    if (usm.municipalities.includes(name)) return usm;
  }
  return null;
}

// All searchable items (municipalities + urban zones)
export interface SearchItem {
  name: string;
  type: "municipality" | "urbanZone";
  usm: USMUnit;
  parentMunicipality?: string; // for urban zones
}

export function getAllSearchItems(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const usm of USM_DATA) {
    for (const m of usm.municipalities) {
      items.push({ name: m, type: "municipality", usm });
    }
    for (const z of usm.urbanZones) {
      items.push({
        name: z,
        type: "urbanZone",
        usm,
        parentMunicipality: CASTELLO_NAME,
      });
    }
  }
  return items;
}

// Normalize text for accent-insensitive search
export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Search aliases: alternative names people might type
// Maps alias → official GeoJSON name
export const SEARCH_ALIASES: Record<string, string> = {
  "Benasal": "Benassal",
  "Oropesa": "Orpesa",
  "Oropesa del Mar": "Orpesa",
  "Lucena del Cid": "Llucena",
  "Lucena": "Llucena",
  "Alcora": "l'Alcora",
  "La Alcora": "l'Alcora",
  "Coves de Vinromà": "les Coves de Vinromà",
  "Las Cuevas de Vinromá": "les Coves de Vinromà",
  "Useres": "les Useres",
  "Las Useras": "les Useres",
  "Pobla Tornesa": "la Pobla Tornesa",
  "Torre Endomenech": "la Torre d'en Doménec",
  "Torre de Endomenech": "la Torre d'en Doménec",
  "Torre d'en Besora": "la Torre d'En Besora",
  "Serratella": "la Serratella",
  "Sarratella": "la Serratella",
  "Benlloch": "Benlloc",
  "Vilafranca del Cid": "Vilafranca",
  "San Juan de Moró": "Sant Joan de Moró",
  "Castellón": "Castelló de la Plana",
  "Castellon": "Castelló de la Plana",
  "Castello": "Castelló de la Plana",
  "Castelló": "Castelló de la Plana",
  "Vistabella": "Vistabella del Maestrat",
  "Vistavella": "Vistabella del Maestrat",
  "Benicasim": "Benicàssim",
  "Almazora": "Almassora",
};
