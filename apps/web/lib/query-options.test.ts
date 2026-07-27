import { beforeEach, describe, expect, it, vi } from "vitest";
import { gqlRequest } from "@/lib/graphql-client";
import { attendanceBoardQueryOptions, queryKeys } from "./query-options";

vi.mock("@/lib/graphql-client", () => ({ gqlRequest: vi.fn() }));

const CLASS_ID = "class-1";
const ENROLLMENT_ID = "enrollment-1";

const board = {
  attendanceDates: ["2026-01-05T00:00:00.000Z"],
  enrollments: [{ id: ENROLLMENT_ID, student: { id: "student-1", name: "Ana" } }],
  attendanceRecords: [
    {
      id: "record-1",
      enrollmentId: ENROLLMENT_ID,
      status: "PRESENT",
      session: { id: "session-1", date: "2026-01-05T12:00:00.000Z" },
    },
  ],
};

const runQueryFn = () => {
  const { queryFn } = attendanceBoardQueryOptions(CLASS_ID);
  return (queryFn as () => Promise<ReturnType<typeof structuredClone>>)();
};

describe("attendanceBoardQueryOptions", () => {
  beforeEach(() => {
    vi.mocked(gqlRequest).mockResolvedValue(board);
  });

  it("loads dates, students and records with a single request", async () => {
    await runQueryFn();

    expect(gqlRequest).toHaveBeenCalledTimes(1);
  });

  it("parses the attendance dates", async () => {
    const result = await runQueryFn();

    expect(result).toEqual({
      attendanceDates: [new Date("2026-01-05T00:00:00.000Z")],
      enrollments: board.enrollments,
      attendanceRecords: board.attendanceRecords,
    });
  });

  it("keys the board by class and range", () => {
    expect(queryKeys.attendanceBoard(CLASS_ID, "2026-01-01", "2026-01-31")).toEqual([
      "attendanceBoard",
      CLASS_ID,
      "2026-01-01",
      "2026-01-31",
    ]);
  });
});
