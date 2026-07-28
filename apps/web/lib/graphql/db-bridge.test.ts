import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "@/src/gql/schema";
import { PrismaAttendanceStatus, toPrismaAttendanceStatus } from "./db-bridge";

describe("toPrismaAttendanceStatus", () => {
  it("keeps GraphQL and Prisma wire values aligned", () => {
    expect(toPrismaAttendanceStatus(AttendanceStatus.Present)).toBe(PrismaAttendanceStatus.PRESENT);
    expect(toPrismaAttendanceStatus(AttendanceStatus.Absent)).toBe(PrismaAttendanceStatus.ABSENT);
    expect(toPrismaAttendanceStatus(AttendanceStatus.Late)).toBe(PrismaAttendanceStatus.LATE);
  });
});
