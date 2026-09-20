import { describe, expect, it } from "vitest";
import { AttendanceStatus, LocationKind, Shift, Weekday } from "@/src/gql/schema";
import {
  PrismaAttendanceStatus,
  PrismaLocationKind,
  PrismaShift,
  PrismaWeekday,
  toPrismaAttendanceStatus,
  toPrismaLocationKind,
  toPrismaShift,
  toPrismaWeekday,
} from "./db-bridge";

describe("toPrismaAttendanceStatus", () => {
  it("keeps GraphQL and Prisma wire values aligned", () => {
    expect(toPrismaAttendanceStatus(AttendanceStatus.Present)).toBe(PrismaAttendanceStatus.PRESENT);
    expect(toPrismaAttendanceStatus(AttendanceStatus.Absent)).toBe(PrismaAttendanceStatus.ABSENT);
    expect(toPrismaAttendanceStatus(AttendanceStatus.Late)).toBe(PrismaAttendanceStatus.LATE);
  });
});

describe("toPrismaLocationKind", () => {
  it("keeps GraphQL and Prisma wire values aligned", () => {
    expect(toPrismaLocationKind(LocationKind.Room)).toBe(PrismaLocationKind.ROOM);
    expect(toPrismaLocationKind(LocationKind.Poi)).toBe(PrismaLocationKind.POI);
  });
});

describe("toPrismaShift", () => {
  it("keeps GraphQL and Prisma wire values aligned", () => {
    expect(toPrismaShift(Shift.Matutino)).toBe(PrismaShift.MATUTINO);
    expect(toPrismaShift(Shift.Vespertino)).toBe(PrismaShift.VESPERTINO);
    expect(toPrismaShift(Shift.Noturno)).toBe(PrismaShift.NOTURNO);
  });
});

describe("toPrismaWeekday", () => {
  it("keeps GraphQL and Prisma wire values aligned", () => {
    expect(toPrismaWeekday(Weekday.Seg)).toBe(PrismaWeekday.SEG);
    expect(toPrismaWeekday(Weekday.Ter)).toBe(PrismaWeekday.TER);
    expect(toPrismaWeekday(Weekday.Qua)).toBe(PrismaWeekday.QUA);
    expect(toPrismaWeekday(Weekday.Qui)).toBe(PrismaWeekday.QUI);
    expect(toPrismaWeekday(Weekday.Sex)).toBe(PrismaWeekday.SEX);
  });
});
