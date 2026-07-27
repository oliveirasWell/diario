import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "@/src/gql/schema";
import { anonymousContext, teacherContext } from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import { attendanceMutationResolvers, attendanceQueryResolvers } from "./attendance";

const CLASS_ID = "class-1";
const ENROLLMENT_ID = "enrollment-1";
const SESSION_ID = "session-1";

describe("attendanceQueryResolvers.attendanceDates", () => {
  it("returns nothing for anonymous users", async () => {
    await expect(
      attendanceQueryResolvers.attendanceDates(null, { classId: CLASS_ID }, anonymousContext),
    ).resolves.toEqual([]);
  });

  it("returns nothing when the class is not accessible", async () => {
    prismaMock.class.findFirst.mockResolvedValue(null);

    await expect(
      attendanceQueryResolvers.attendanceDates(null, { classId: CLASS_ID }, teacherContext),
    ).resolves.toEqual([]);
  });

  it("returns nothing when the class has no schedule", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });

    await expect(
      attendanceQueryResolvers.attendanceDates(null, { classId: CLASS_ID }, teacherContext),
    ).resolves.toEqual([]);
  });

  it("prefers the requested range over the class range", async () => {
    prismaMock.class.findFirst.mockResolvedValue({
      id: CLASS_ID,
      daysOfWeek: [1, 2],
      startDate: new Date("2026-01-05T00:00:00.000Z"),
      endDate: new Date("2026-01-31T00:00:00.000Z"),
    });

    const dates = await attendanceQueryResolvers.attendanceDates(
      null,
      { classId: CLASS_ID, from: "2026-01-12", to: "2026-01-13" },
      teacherContext,
    );

    expect(dates.map((date) => date.toISOString().slice(0, 10))).toEqual([
      "2026-01-12",
      "2026-01-13",
    ]);
  });

  it("keeps only the class weekdays that are not excluded", async () => {
    prismaMock.class.findFirst.mockResolvedValue({
      id: CLASS_ID,
      daysOfWeek: [1, 3],
      startDate: new Date("2026-01-05T00:00:00.000Z"),
      endDate: new Date("2026-01-07T00:00:00.000Z"),
      excludedDates: [new Date("2026-01-07T00:00:00.000Z")],
    });

    const dates = await attendanceQueryResolvers.attendanceDates(
      null,
      { classId: CLASS_ID },
      teacherContext,
    );

    expect(dates.map((date) => date.toISOString().slice(0, 10))).toEqual(["2026-01-05"]);
  });
});

describe("attendanceQueryResolvers.attendanceRecords", () => {
  it("returns nothing for anonymous users", async () => {
    await expect(
      attendanceQueryResolvers.attendanceRecords(null, { classId: CLASS_ID }, anonymousContext),
    ).resolves.toEqual([]);
  });

  it("returns nothing when the class is not accessible", async () => {
    prismaMock.class.findFirst.mockResolvedValue(null);

    await expect(
      attendanceQueryResolvers.attendanceRecords(null, { classId: CLASS_ID }, teacherContext),
    ).resolves.toEqual([]);
  });

  it("flattens session records and keeps the session date", async () => {
    const sessionDate = new Date("2026-01-05T12:00:00.000Z");
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.attendanceSession.findMany.mockResolvedValue([
      {
        id: SESSION_ID,
        date: sessionDate,
        records: [{ id: "record-1", sessionId: SESSION_ID, enrollmentId: ENROLLMENT_ID }],
      },
    ]);

    await expect(
      attendanceQueryResolvers.attendanceRecords(
        null,
        { classId: CLASS_ID, from: "2026-01-05", to: "2026-01-06" },
        teacherContext,
      ),
    ).resolves.toEqual([
      {
        id: "record-1",
        sessionId: SESSION_ID,
        enrollmentId: ENROLLMENT_ID,
        session: { id: SESSION_ID, date: sessionDate },
      },
    ]);
  });
});

describe("attendanceMutationResolvers.markAttendance", () => {
  it("does nothing when clearing a day without a session", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.attendanceSession.findFirst.mockResolvedValue(null);

    await expect(
      attendanceMutationResolvers.markAttendance(
        null,
        { classId: CLASS_ID, enrollmentId: ENROLLMENT_ID, date: "2026-01-05", status: null },
        teacherContext,
      ),
    ).resolves.toBe(true);
    expect(prismaMock.attendanceRecord.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes the record when the status is cleared", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.attendanceSession.findFirst.mockResolvedValue({ id: SESSION_ID });

    await attendanceMutationResolvers.markAttendance(
      null,
      { classId: CLASS_ID, enrollmentId: ENROLLMENT_ID, date: "2026-01-05", status: null },
      teacherContext,
    );

    expect(prismaMock.attendanceRecord.deleteMany).toHaveBeenCalledWith({
      where: { sessionId: SESSION_ID, enrollmentId: ENROLLMENT_ID },
    });
  });

  it("creates the session on demand and upserts the status", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.attendanceSession.findMany.mockResolvedValue([]);
    prismaMock.attendanceSession.create.mockResolvedValue({ id: SESSION_ID });

    await attendanceMutationResolvers.markAttendance(
      null,
      {
        classId: CLASS_ID,
        enrollmentId: ENROLLMENT_ID,
        date: "2026-01-05",
        status: AttendanceStatus.Absent,
      },
      teacherContext,
    );

    expect(prismaMock.attendanceSession.create).toHaveBeenCalledWith({
      data: { classId: CLASS_ID, date: new Date("2026-01-05T12:00:00.000Z") },
    });
    expect(prismaMock.attendanceRecord.upsert).toHaveBeenCalledWith({
      where: { sessionId_enrollmentId: { sessionId: SESSION_ID, enrollmentId: ENROLLMENT_ID } },
      update: { status: "ABSENT" },
      create: { sessionId: SESSION_ID, enrollmentId: ENROLLMENT_ID, status: "ABSENT" },
    });
  });
});

describe("attendanceMutationResolvers.markAllPresent", () => {
  it("marks every enrollment of the class present", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.attendanceSession.findMany.mockResolvedValue([
      { id: SESSION_ID, date: new Date("2026-01-05T12:00:00.000Z") },
    ]);
    prismaMock.enrollment.findMany.mockResolvedValue([
      { id: ENROLLMENT_ID },
      { id: "enrollment-2" },
    ]);

    await expect(
      attendanceMutationResolvers.markAllPresent(
        null,
        { classId: CLASS_ID, date: "2026-01-05" },
        teacherContext,
      ),
    ).resolves.toBe(true);

    expect(prismaMock.attendanceRecord.upsert).toHaveBeenCalledTimes(2);
    expect(prismaMock.attendanceRecord.upsert).toHaveBeenLastCalledWith({
      where: { sessionId_enrollmentId: { sessionId: SESSION_ID, enrollmentId: "enrollment-2" } },
      update: { status: "PRESENT" },
      create: { sessionId: SESSION_ID, enrollmentId: "enrollment-2", status: "PRESENT" },
    });
  });
});

describe("attendanceMutationResolvers.markEnrollmentPresentForDates", () => {
  it("reuses the existing sessions and creates only the missing ones", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findFirst.mockResolvedValue({ id: ENROLLMENT_ID });
    prismaMock.attendanceSession.findMany.mockResolvedValue([
      { id: SESSION_ID, date: new Date("2026-01-05T12:00:00.000Z") },
    ]);
    prismaMock.attendanceSession.create.mockImplementation(
      async ({ data }: { data: { date: Date } }) => ({ id: "session-2", date: data.date }),
    );

    await expect(
      attendanceMutationResolvers.markEnrollmentPresentForDates(
        null,
        { classId: CLASS_ID, enrollmentId: ENROLLMENT_ID, dates: ["2026-01-05", "2026-01-06"] },
        teacherContext,
      ),
    ).resolves.toBe(true);

    expect(prismaMock.attendanceSession.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.attendanceSession.create).toHaveBeenCalledWith({
      data: { classId: CLASS_ID, date: new Date("2026-01-06T12:00:00.000Z") },
    });
    expect(prismaMock.attendanceRecord.upsert).toHaveBeenCalledTimes(2);
    expect(prismaMock.attendanceRecord.upsert).toHaveBeenCalledWith({
      where: { sessionId_enrollmentId: { sessionId: "session-2", enrollmentId: ENROLLMENT_ID } },
      update: { status: "PRESENT" },
      create: { sessionId: "session-2", enrollmentId: ENROLLMENT_ID, status: "PRESENT" },
    });
  });

  it("looks the sessions up in a single range query", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findFirst.mockResolvedValue({ id: ENROLLMENT_ID });
    prismaMock.attendanceSession.findMany.mockResolvedValue([]);
    prismaMock.attendanceSession.create.mockImplementation(
      async ({ data }: { data: { date: Date } }) => ({ id: SESSION_ID, date: data.date }),
    );

    await attendanceMutationResolvers.markEnrollmentPresentForDates(
      null,
      { classId: CLASS_ID, enrollmentId: ENROLLMENT_ID, dates: ["2026-01-06", "2026-01-05"] },
      teacherContext,
    );

    expect(prismaMock.attendanceSession.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.attendanceSession.findMany).toHaveBeenCalledWith({
      where: {
        classId: CLASS_ID,
        date: {
          gte: new Date("2026-01-05T00:00:00.000Z"),
          lte: new Date("2026-01-06T23:59:59.999Z"),
        },
      },
    });
  });

  it("rejects an enrollment from another class", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findFirst.mockResolvedValue(null);

    await expect(
      attendanceMutationResolvers.markEnrollmentPresentForDates(
        null,
        { classId: CLASS_ID, enrollmentId: "missing", dates: ["2026-01-05"] },
        teacherContext,
      ),
    ).rejects.toThrow("Not found");
  });
});

describe("attendanceMutationResolvers.excludeAttendanceDate", () => {
  it("skips the update when the date is already excluded", async () => {
    prismaMock.class.findFirst.mockResolvedValue({
      id: CLASS_ID,
      excludedDates: [new Date("2026-01-05T00:00:00.000Z")],
    });

    await expect(
      attendanceMutationResolvers.excludeAttendanceDate(
        null,
        { classId: CLASS_ID, date: "2026-01-05" },
        teacherContext,
      ),
    ).resolves.toBe(true);
    expect(prismaMock.class.update).not.toHaveBeenCalled();
  });

  it("appends a new excluded date", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID, excludedDates: [] });

    await attendanceMutationResolvers.excludeAttendanceDate(
      null,
      { classId: CLASS_ID, date: "2026-01-06" },
      teacherContext,
    );

    expect(prismaMock.class.update).toHaveBeenCalledWith({
      where: { id: CLASS_ID },
      data: { excludedDates: [new Date("2026-01-06")] },
    });
  });
});
