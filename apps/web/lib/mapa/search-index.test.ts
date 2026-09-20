import { describe, expect, it } from "vitest";
import { LocationKind, Shift, Weekday } from "@/src/gql/schema";
import { buildSearchIndex, matchSearchIndex } from "./search-index";
import type { SearchIndexEntry } from "./types";

const mapData = {
  locations: [
    { id: "loc-room-07", code: "07", kind: LocationKind.Room, name: "Sala 07" },
    { id: "loc-biblioteca", code: "biblioteca", kind: LocationKind.Poi, name: "Biblioteca" },
  ],
  roomShifts: [
    {
      id: "room-shift-1",
      location: { id: "loc-room-07", code: "07", kind: LocationKind.Room, name: "Sala 07" },
      shift: Shift.Matutino,
      classGroup: { id: "class-group-1", grade: "9º", section: "A" },
      lessons: [
        {
          id: "lesson-1",
          weekday: Weekday.Seg,
          period: 1,
          subject: { id: "subject-1", name: "Inglês" },
          teacher: { id: "teacher-1", name: "Prof. Ana" },
        },
      ],
    },
  ],
};

describe("buildSearchIndex", () => {
  const index = buildSearchIndex(mapData);

  it("indexes every room and point of interest from the floor plan", () => {
    expect(index.filter((entry) => entry.tag === "SALA")).toHaveLength(16);
    expect(index.filter((entry) => entry.tag === "LOCAL")).toHaveLength(16);
  });

  it("indexes an assigned class group", () => {
    const entry = index.find((entry) => entry.tag === "TURMA");
    expect(entry).toMatchObject({ label: "9º A", locationCode: "07", shift: "MATUTINO" });
  });

  it("indexes a filled lesson as AULA, DISCIPLINA and PROFESSOR entries", () => {
    const tags = index.filter((entry) => entry.locationCode === "07" && entry.shift === "MATUTINO");
    expect(tags.map((entry) => entry.tag)).toEqual(
      expect.arrayContaining(["AULA", "DISCIPLINA", "PROFESSOR"]),
    );
  });

  it("carries an accent-insensitive normalized term combining subject, teacher and room", () => {
    const aula = index.find((entry) => entry.tag === "AULA");
    expect(aula?.term).toContain("ingles");
    expect(aula?.term).toContain("ana");
    expect(aula?.term).toContain("sala 07");
  });

  it("does not index a room shift with no class group and no lessons", () => {
    const emptyIndex = buildSearchIndex({
      locations: mapData.locations,
      roomShifts: [
        {
          id: "room-shift-2",
          location: mapData.locations[0],
          shift: Shift.Vespertino,
          classGroup: null,
          lessons: [],
        },
      ],
    });
    expect(emptyIndex.some((entry) => entry.shift === "VESPERTINO")).toBe(false);
  });
});

describe("matchSearchIndex", () => {
  const entries: SearchIndexEntry[] = [
    { tag: "SALA", label: "Sala 07", locationCode: "07", term: "sala 07" },
    { tag: "LOCAL", label: "Biblioteca", locationCode: "biblioteca", term: "biblioteca" },
    {
      tag: "DISCIPLINA",
      label: "Educação Física",
      locationCode: "05",
      term: "educacao fisica sala 05",
    },
  ];

  it("matches accent-insensitively", () => {
    expect(matchSearchIndex(entries, "educação")).toEqual([entries[2]]);
    expect(matchSearchIndex(entries, "educacao")).toEqual([entries[2]]);
  });

  it("requires every whitespace-separated token to match (AND)", () => {
    expect(matchSearchIndex(entries, "educacao sala")).toEqual([entries[2]]);
    expect(matchSearchIndex(entries, "educacao biblioteca")).toEqual([]);
  });

  it("returns nothing for a blank query", () => {
    expect(matchSearchIndex(entries, "   ")).toEqual([]);
  });

  it("caps results at 20", () => {
    const many: SearchIndexEntry[] = Array.from({ length: 30 }, (_, index) => ({
      tag: "SALA",
      label: `Sala ${index}`,
      locationCode: String(index),
      term: `sala ${index}`,
    }));
    expect(matchSearchIndex(many, "sala")).toHaveLength(20);
  });
});
