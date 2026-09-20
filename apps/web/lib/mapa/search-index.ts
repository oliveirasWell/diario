import type { MapData } from "@/src/gql/schema";
import { DAYS, PERIODS } from "./constants";
import { normalizeText } from "./normalize-text";
import type { SearchIndexEntry } from "./types";

type SearchableMapData = Pick<MapData, "locations" | "roomShifts">;

const dayLabel = (weekday: string): string =>
  DAYS.find((day) => day.id === weekday)?.full ?? weekday;

const periodLabel = (period: number): string => PERIODS[period - 1] ?? String(period);

const locationEntry = (location: MapData["locations"][number]): SearchIndexEntry => ({
  tag: location.kind === "ROOM" ? "SALA" : "PONTO",
  label: location.name,
  locationCode: location.code,
  term: normalizeText(location.name),
});

const classGroupEntry = (roomShift: MapData["roomShifts"][number]): SearchIndexEntry | null => {
  if (!roomShift.classGroup) {
    return null;
  }
  const label = `${roomShift.classGroup.grade} ${roomShift.classGroup.section}`;
  return {
    tag: "TURMA",
    label,
    locationCode: roomShift.location.code,
    shift: roomShift.shift,
    term: normalizeText(`${label} ${roomShift.location.name} ${roomShift.shift}`),
  };
};

const lessonEntries = (roomShift: MapData["roomShifts"][number]): SearchIndexEntry[] =>
  roomShift.lessons.flatMap((lesson) => {
    const classGroupLabel = roomShift.classGroup
      ? `${roomShift.classGroup.grade} ${roomShift.classGroup.section}`
      : "";
    const term = normalizeText(
      [
        lesson.subject.name,
        lesson.teacher.name,
        dayLabel(lesson.weekday),
        periodLabel(lesson.period),
        roomShift.shift,
        roomShift.location.name,
        classGroupLabel,
      ].join(" "),
    );

    return [
      {
        tag: "AULA",
        label: `${lesson.subject.name} — ${lesson.teacher.name}`,
        locationCode: roomShift.location.code,
        shift: roomShift.shift,
        term,
      },
      {
        tag: "DISCIPLINA",
        label: lesson.subject.name,
        locationCode: roomShift.location.code,
        shift: roomShift.shift,
        term,
      },
      {
        tag: "PROFESSOR",
        label: lesson.teacher.name,
        locationCode: roomShift.location.code,
        shift: roomShift.shift,
        term,
      },
    ];
  });

export const buildSearchIndex = (mapData: SearchableMapData): SearchIndexEntry[] => [
  ...mapData.locations.map(locationEntry),
  ...mapData.roomShifts.flatMap((roomShift) => {
    const classGroup = classGroupEntry(roomShift);
    return [...(classGroup ? [classGroup] : []), ...lessonEntries(roomShift)];
  }),
];

const SEARCH_RESULTS_LIMIT = 20;

export const matchSearchIndex = (
  entries: SearchIndexEntry[],
  query: string,
  limit = SEARCH_RESULTS_LIMIT,
): SearchIndexEntry[] => {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return [];
  }
  return entries
    .filter((entry) => tokens.every((token) => entry.term.includes(token)))
    .slice(0, limit);
};
