import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "@/src/gql/schema";
import { anonymousContext, teacherContext } from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import { attendanceMutationResolvers, attendanceQueryResolvers } from "./attendance";

const CLASS_ID = "class-1";
const ENROLLMENT_ID = "enrollment-1";
const SESSION_ID = "session-1";
const SESSION_JAN_5 = { id: SESSION_ID, date: new Date("2026-01-05T12:00:00.000Z") };
const SESSION_JAN_6 = { id: "session-2", date: new Date("2026-01-06T12:00:00.000Z") };

const mockSessionStore = (existing: { id: string; date: Date }[]) => {
  let sessions = [...existing];
  prismaMock.attendanceSession.findMany.mockImplementation(async () => sessions);
  prismaMock.attendanceSession.createMany.mockImplementation(
    async ({ data }: { data: { date: Date }[] }) => {
      sessions = [
        ...sessions,
        ...data.map((row, index) => ({ id: `created-${index}`, date: row.date })),
      ];
      return { count: data.length };
    },
  );
};

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
    mockSessionStore([]);

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

    expect(prismaMock.attendanceSession.createMany).toHaveBeenCalledWith({
      data: [{ classId: CLASS_ID, date: new Date("2026-01-05T12:00:00.000Z") }],
    });
    expect(prismaMock.attendanceRecord.upsert).toHaveBeenCalledWith({
      where: { sessionId_enrollmentId: { sessionId: "created-0", enrollmentId: ENROLLMENT_ID } },
      update: { status: "ABSENT" },
      create: { sessionId: "created-0", enrollmentId: ENROLLMENT_ID, status: "ABSENT" },
    });
  });
});

describe("attendanceMutationResolvers.markPresent", () => {
  it("looks every requested day up in a single query", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findMany.mockResolvedValue([{ id: ENROLLMENT_ID }]);
    mockSessionStore([SESSION_JAN_5, SESSION_JAN_6]);
    prismaMock.attendanceRecord.findMany.mockResolvedValue([]);

    await expect(
      attendanceMutationResolvers.markPresent(
        null,
        {
          classId: CLASS_ID,
          dates: ["2026-01-06", "2026-01-05"],
          enrollmentIds: [ENROLLMENT_ID],
        },
        teacherContext,
      ),
    ).resolves.toBe(true);

    expect(prismaMock.attendanceSession.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.attendanceSession.findMany).toHaveBeenCalledWith({
      where: {
        classId: CLASS_ID,
        date: { in: [SESSION_JAN_6.date, SESSION_JAN_5.date] },
      },
    });
    expect(prismaMock.attendanceSession.createMany).not.toHaveBeenCalled();
  });

  it("creates the missing days in one call", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findMany.mockResolvedValue([{ id: ENROLLMENT_ID }]);
    mockSessionStore([SESSION_JAN_5]);
    prismaMock.attendanceRecord.findMany.mockResolvedValue([]);

    await attendanceMutationResolvers.markPresent(
      null,
      { classId: CLASS_ID, dates: ["2026-01-05", "2026-01-06"], enrollmentIds: [ENROLLMENT_ID] },
      teacherContext,
    );

    expect(prismaMock.attendanceSession.createMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.attendanceSession.createMany).toHaveBeenCalledWith({
      data: [{ classId: CLASS_ID, date: new Date("2026-01-06T12:00:00.000Z") }],
    });
  });

  it("updates the existing records and creates the missing ones in one call each", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findMany.mockResolvedValue([{ id: ENROLLMENT_ID }]);
    mockSessionStore([SESSION_JAN_5, SESSION_JAN_6]);
    prismaMock.attendanceRecord.findMany.mockResolvedValue([
      { sessionId: SESSION_JAN_5.id, enrollmentId: ENROLLMENT_ID },
    ]);

    await attendanceMutationResolvers.markPresent(
      null,
      { classId: CLASS_ID, dates: ["2026-01-05", "2026-01-06"], enrollmentIds: [ENROLLMENT_ID] },
      teacherContext,
    );

    expect(prismaMock.attendanceRecord.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.attendanceRecord.updateMany).toHaveBeenCalledWith({
      where: {
        sessionId: { in: [SESSION_JAN_5.id, SESSION_JAN_6.id] },
        enrollmentId: { in: [ENROLLMENT_ID] },
      },
      data: { status: "PRESENT" },
    });
    expect(prismaMock.attendanceRecord.createMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.attendanceRecord.createMany).toHaveBeenCalledWith({
      data: [{ sessionId: SESSION_JAN_6.id, enrollmentId: ENROLLMENT_ID, status: "PRESENT" }],
    });
  });

  it("marks the whole class when no enrollment is named", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findMany.mockResolvedValue([
      { id: ENROLLMENT_ID },
      { id: "enrollment-2" },
    ]);
    mockSessionStore([SESSION_JAN_5]);
    prismaMock.attendanceRecord.findMany.mockResolvedValue([]);

    await attendanceMutationResolvers.markPresent(
      null,
      { classId: CLASS_ID, dates: ["2026-01-05"], enrollmentIds: null },
      teacherContext,
    );

    expect(prismaMock.enrollment.findMany).toHaveBeenCalledWith({ where: { classId: CLASS_ID } });
    expect(prismaMock.attendanceRecord.createMany).toHaveBeenCalledWith({
      data: [
        { sessionId: SESSION_JAN_5.id, enrollmentId: ENROLLMENT_ID, status: "PRESENT" },
        { sessionId: SESSION_JAN_5.id, enrollmentId: "enrollment-2", status: "PRESENT" },
      ],
    });
  });

  it("rejects an enrollment from another class", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findMany.mockResolvedValue([]);

    await expect(
      attendanceMutationResolvers.markPresent(
        null,
        { classId: CLASS_ID, dates: ["2026-01-05"], enrollmentIds: ["missing"] },
        teacherContext,
      ),
    ).rejects.toThrow("Not found");
  });

  it("creates nothing when every cell already exists", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findMany.mockResolvedValue([{ id: ENROLLMENT_ID }]);
    mockSessionStore([SESSION_JAN_5]);
    prismaMock.attendanceRecord.findMany.mockResolvedValue([
      { sessionId: SESSION_JAN_5.id, enrollmentId: ENROLLMENT_ID },
    ]);

    await attendanceMutationResolvers.markPresent(
      null,
      { classId: CLASS_ID, dates: ["2026-01-05"], enrollmentIds: [ENROLLMENT_ID] },
      teacherContext,
    );

    expect(prismaMock.attendanceRecord.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.attendanceRecord.createMany).not.toHaveBeenCalled();
  });

  it("writes nothing when there is no date to mark", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findMany.mockResolvedValue([{ id: ENROLLMENT_ID }]);
    mockSessionStore([]);

    await expect(
      attendanceMutationResolvers.markPresent(
        null,
        { classId: CLASS_ID, dates: [], enrollmentIds: [ENROLLMENT_ID] },
        teacherContext,
      ),
    ).resolves.toBe(true);

    expect(prismaMock.attendanceRecord.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.attendanceRecord.createMany).not.toHaveBeenCalled();
  });

  it("writes everything inside a single transaction", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.enrollment.findMany.mockResolvedValue([{ id: ENROLLMENT_ID }]);
    mockSessionStore([SESSION_JAN_5]);
    prismaMock.attendanceRecord.findMany.mockResolvedValue([]);

    await attendanceMutationResolvers.markPresent(
      null,
      { classId: CLASS_ID, dates: ["2026-01-05"], enrollmentIds: [ENROLLMENT_ID] },
      teacherContext,
    );

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
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
