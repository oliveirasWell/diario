import type {
  AttendanceStatus as GqlAttendanceStatus,
  LocationKind as GqlLocationKind,
  Shift as GqlShift,
  Weekday as GqlWeekday,
} from "@/src/gql/schema";
import {
  AttendanceStatus as PrismaAttendanceStatus,
  LocationKind as PrismaLocationKind,
  Shift as PrismaShift,
  Weekday as PrismaWeekday,
} from "@diario/db";

export { PrismaAttendanceStatus, PrismaLocationKind, PrismaShift, PrismaWeekday };

/** GraphQL e Prisma usam os mesmos valores wire (PRESENT/ABSENT/LATE). */
export function toPrismaAttendanceStatus(status: GqlAttendanceStatus): PrismaAttendanceStatus {
  return status as PrismaAttendanceStatus;
}

/** GraphQL e Prisma usam os mesmos valores wire (ROOM/POI). */
export function toPrismaLocationKind(kind: GqlLocationKind): PrismaLocationKind {
  return kind as PrismaLocationKind;
}

/** GraphQL e Prisma usam os mesmos valores wire (MATUTINO/VESPERTINO/NOTURNO). */
export function toPrismaShift(shift: GqlShift): PrismaShift {
  return shift as PrismaShift;
}

/** GraphQL e Prisma usam os mesmos valores wire (SEG/TER/QUA/QUI/SEX). */
export function toPrismaWeekday(weekday: GqlWeekday): PrismaWeekday {
  return weekday as PrismaWeekday;
}
