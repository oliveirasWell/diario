// Static UI configuration for the school map, extracted verbatim from
// docs/mapa/index.html.
import type { DayOption, ShiftOption } from "./types";

export const DAYS: DayOption[] = [
  { id: "SEG", name: "SEG", full: "Segunda-feira" },
  { id: "TER", name: "TER", full: "Terça-feira" },
  { id: "QUA", name: "QUA", full: "Quarta-feira" },
  { id: "QUI", name: "QUI", full: "Quinta-feira" },
  { id: "SEX", name: "SEX", full: "Sexta-feira" },
];

export const PERIODS = ["1º", "2º", "3º", "4º", "5º", "6º"] as const;

export const SHIFTS: ShiftOption[] = [
  { id: "MATUTINO", name: "MATUTINO", background: "#ffd93d", foreground: "#5c4a00" },
  { id: "VESPERTINO", name: "VESPERTINO", background: "#ff8fc0", foreground: "#5c1030" },
  { id: "NOTURNO", name: "NOTURNO", background: "#b57bee", foreground: "#2e0f4d" },
];

export const GRADE_OPTIONS = ["9º", "1º", "2º", "3º"];

export const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const USER_MARKER_OPTIONS = [
  "👩",
  "👨",
  "🧑",
  "👧",
  "👦",
  "🧑‍🎓",
  "🧑‍🏫",
  "🧑‍🦯",
  "🧑‍🦽",
  "🧑‍🦼",
  "🐱",
  "🐶",
  "⭐",
  "📍",
] as const;

export const DEFAULT_USER_MARKER = "📍";

export const DESTINATION_MARKER = "🎯";

export const MAPA_PATH = "/mapa";
export const CLASSES_PATH = "/classes";

export const DECORATIVE_POI_CODES = ["lobby"] as const;

export const DEFAULT_SUBJECT_NAMES = [
  "Inglês",
  "Matemática",
  "Língua Portuguesa",
  "História",
  "Geografia",
  "Ciências",
  "Educação Física",
  "Arte",
] as const;

export const SEARCH_TAG = {
  room: "SALA",
  poi: "LOCAL",
  classGroup: "TURMA",
  lesson: "AULA",
  subject: "DISCIPLINA",
  teacher: "PROFESSOR",
} as const;

export const MAP_COPY = {
  title: "Mapa Escolar",
  schoolName: "Ee Sidronio Antunes De Andrade",
  navTurmas: "Turmas",
  navMapa: "Mapa",
  searchPlaceholder: "Buscar sala, turma, professor, disciplina...",
  searchEmpty: "Nenhum resultado.",
  hint: "Arraste para mover · pinça ou role para dar zoom",
  loading: "Carregando mapa...",
  howToGet: "Como chegar?",
  howToGetHere: "Como chegar aqui",
  navPanelTitle: "Como chegar?",
  originLabel: "Origem",
  destinationLabel: "Destino",
  markerLabel: "Meu marcador",
  showRoute: "Mostrar rota",
  clearRoute: "Limpar rota",
  close: "Fechar",
  reset: "Reset",
  zoomIn: "Aproximar",
  zoomOut: "Afastar",
  resetZoom: "Redefinir zoom",
  poiDescription: "Ponto de interesse.",
  roomTag: "Sala",
  poiTag: "Local",
  selectOriginDestination: "Selecione origem e destino.",
  sameOriginDestination: "Origem e destino são iguais.",
  routeFailed: "Não foi possível calcular uma rota entre esses locais.",
  searchToast: (name: string) => `Toque em ${name} para ver informações e como chegar`,
  searchPin: (name: string) => `📍 ${name}`,
  routeSummary: (origin: string, destination: string) => `Rota: ${origin} → ${destination}`,
} as const;

export const WHEEL_ZOOM_FACTOR = 1.12;
export const BUTTON_ZOOM_FACTOR = 1.3;
export const MAX_SCALE_FACTOR = 6;
export const DRAG_CLICK_THRESHOLD_PX = 6;
