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
