import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "@/src/gql/schema";
import { buildAttendanceRows } from "./export-attendance";

describe("buildAttendanceRows", () => {
  it("maps records by enrollment and day", () => {
    expect(
      buildAttendanceRows({
        dates: [new Date("2026-06-25T12:00:00.000Z"), new Date("2026-06-26T12:00:00.000Z")],
        enrollments: [{ id: "enr-1", student: { id: "stu-1", name: "Ana" } }],
        records: [
          {
            enrollmentId: "enr-1",
            status: AttendanceStatus.Present,
            session: { date: "2026-06-25T15:00:00.000Z" },
          },
        ],
      }),
    ).toEqual([
      ["Aluno", "2026-06-25", "2026-06-26"],
      ["Ana", "Presente", ""],
    ]);
  });
});
