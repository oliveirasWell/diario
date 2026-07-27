import { describe, expect, it } from "vitest";
import { attendanceDayKey, normalizeAttendanceDate, sessionDayBounds } from "./attendance-date";

describe("attendance-date", () => {
  it("normalizes date-like values to UTC day keys", () => {
    expect(attendanceDayKey("2026-06-25T23:45:00.000Z")).toBe("2026-06-25");
  });

  it("stores attendance at midday UTC", () => {
    expect(normalizeAttendanceDate("2026-06-25T23:45:00.000Z").toISOString()).toBe(
      "2026-06-25T12:00:00.000Z",
    );
  });

  it("builds inclusive session bounds", () => {
    expect(sessionDayBounds("2026-06-25T12:00:00.000Z")).toEqual({
      gte: new Date("2026-06-25T00:00:00.000Z"),
      lte: new Date("2026-06-25T23:59:59.999Z"),
    });
  });
});
