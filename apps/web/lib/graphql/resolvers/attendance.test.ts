import { beforeEach, describe, expect, it, vi } from "vitest";
import { attendanceMutationResolvers, attendanceQueryResolvers } from "./attendance";
import { AttendanceStatus } from "@/src/gql/schema";

const prisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  attendanceRecord: {
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  attendanceSession: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
  class: { findFirst: vi.fn(), update: vi.fn() },
  enrollment: { findFirst: vi.fn(), findMany: vi.fn() },
}));

vi.mock("../prisma", () => ({
  getPrisma: async () => prisma,
}));

const ctx = { user: { id: "next-1", prismaUserId: "u1" } } as any;
const anon = { user: null } as any;

beforeEach(() => {
  vi.resetAllMocks();
  prisma.$transaction.mockImplementation(async (fn: (tx: any) => unknown) => fn(prisma));
});

describe("attendance resolvers", () => {
  it("builds attendance dates and record rows", async () => {
    await expect(
      attendanceQueryResolvers.attendanceDates(null, { classId: "class-1" }, anon),
    ).resolves.toEqual([]);

    prisma.class.findFirst.mockResolvedValueOnce(null);
    await expect(
      attendanceQueryResolvers.attendanceDates(null, { classId: "class-1" }, ctx),
    ).resolves.toEqual([]);

    prisma.class.findFirst.mockResolvedValueOnce({
      id: "class-1",
      daysOfWeek: [1, 3],
      startDate: new Date("2026-01-05T00:00:00.000Z"),
      endDate: new Date("2026-01-07T00:00:00.000Z"),
      excludedDates: [new Date("2026-01-07T00:00:00.000Z")],
    });
    const dates = await attendanceQueryResolvers.attendanceDates(null, { classId: "class-1" }, ctx);
    expect(dates.map((d) => d.toISOString().slice(0, 10))).toEqual(["2026-01-05"]);

    prisma.class.findFirst.mockResolvedValueOnce({ id: "class-1" });
    prisma.attendanceSession.findMany.mockResolvedValueOnce([
      {
        id: "session-1",
        date: new Date("2026-01-05T12:00:00.000Z"),
        records: [{ id: "record-1", sessionId: "session-1", enrollmentId: "enrollment-1" }],
      },
    ]);
    await expect(
      attendanceQueryResolvers.attendanceRecords(
        null,
        { classId: "class-1", from: "2026-01-05", to: "2026-01-06" },
        ctx,
      ),
    ).resolves.toEqual([
      {
        id: "record-1",
        sessionId: "session-1",
        enrollmentId: "enrollment-1",
        session: { id: "session-1", date: new Date("2026-01-05T12:00:00.000Z") },
      },
    ]);

    await expect(
      attendanceQueryResolvers.attendanceRecords(null, { classId: "class-1" }, anon),
    ).resolves.toEqual([]);

    prisma.class.findFirst.mockResolvedValueOnce(null);
    await expect(
      attendanceQueryResolvers.attendanceRecords(null, { classId: "class-1" }, ctx),
    ).resolves.toEqual([]);
  });

  it("marks and clears attendance", async () => {
    prisma.class.findFirst.mockResolvedValue({ id: "class-1" });

    prisma.attendanceSession.findFirst.mockResolvedValueOnce(null);
    await expect(
      attendanceMutationResolvers.markAttendance(
        null,
        { classId: "class-1", enrollmentId: "enrollment-1", date: "2026-01-05", status: null },
        ctx,
      ),
    ).resolves.toBe(true);
    expect(prisma.attendanceRecord.delete).not.toHaveBeenCalled();

    prisma.attendanceSession.findFirst.mockResolvedValueOnce({ id: "session-1" });
    prisma.attendanceRecord.findFirst.mockResolvedValueOnce({ id: "record-1" });
    await attendanceMutationResolvers.markAttendance(
      null,
      { classId: "class-1", enrollmentId: "enrollment-1", date: "2026-01-05", status: null },
      ctx,
    );
    expect(prisma.attendanceRecord.delete).toHaveBeenCalledWith({ where: { id: "record-1" } });

    prisma.attendanceSession.findFirst.mockResolvedValueOnce(null);
    prisma.attendanceSession.create.mockResolvedValueOnce({ id: "session-2" });
    prisma.attendanceRecord.findFirst.mockResolvedValueOnce(null);
    await attendanceMutationResolvers.markAttendance(
      null,
      {
        classId: "class-1",
        enrollmentId: "enrollment-1",
        date: "2026-01-05",
        status: AttendanceStatus.Present,
      },
      ctx,
    );
    expect(prisma.attendanceRecord.create).toHaveBeenCalledWith({
      data: { sessionId: "session-2", enrollmentId: "enrollment-1", status: "PRESENT" },
    });

    prisma.attendanceSession.findFirst.mockResolvedValueOnce({ id: "session-3" });
    prisma.attendanceRecord.findFirst.mockResolvedValueOnce({ id: "record-3" });
    await attendanceMutationResolvers.markAttendance(
      null,
      {
        classId: "class-1",
        enrollmentId: "enrollment-1",
        date: "2026-01-05",
        status: AttendanceStatus.Absent,
      },
      ctx,
    );
    expect(prisma.attendanceRecord.update).toHaveBeenCalledWith({
      where: { id: "record-3" },
      data: { status: "ABSENT" },
    });
  });

  it("bulk marks attendance", async () => {
    prisma.class.findFirst.mockResolvedValue({ id: "class-1" });
    prisma.attendanceSession.findFirst.mockResolvedValueOnce(null);
    prisma.attendanceSession.create.mockResolvedValueOnce({ id: "session-1" });
    prisma.enrollment.findMany.mockResolvedValueOnce([
      { id: "enrollment-1" },
      { id: "enrollment-2" },
    ]);
    prisma.attendanceRecord.findFirst
      .mockResolvedValueOnce({ id: "record-1" })
      .mockResolvedValueOnce(null);

    await expect(
      attendanceMutationResolvers.markAllPresent(
        null,
        { classId: "class-1", date: "2026-01-05" },
        ctx,
      ),
    ).resolves.toBe(true);
    expect(prisma.attendanceRecord.update).toHaveBeenCalledWith({
      where: { id: "record-1" },
      data: { status: "PRESENT" },
    });
    expect(prisma.attendanceRecord.create).toHaveBeenCalledWith({
      data: { sessionId: "session-1", enrollmentId: "enrollment-2", status: "PRESENT" },
    });
  });

  it("marks one enrollment present across dates", async () => {
    prisma.class.findFirst.mockResolvedValue({ id: "class-1" });
    prisma.enrollment.findFirst.mockResolvedValueOnce({ id: "enrollment-1" });
    prisma.attendanceSession.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "session-2" });
    prisma.attendanceSession.create.mockResolvedValueOnce({ id: "session-1" });

    await expect(
      attendanceMutationResolvers.markEnrollmentPresentForDates(
        null,
        {
          classId: "class-1",
          enrollmentId: "enrollment-1",
          dates: ["2026-01-05", "2026-01-06"],
        },
        ctx,
      ),
    ).resolves.toBe(true);
    expect(prisma.attendanceRecord.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.attendanceRecord.upsert).toHaveBeenLastCalledWith({
      where: { sessionId_enrollmentId: { sessionId: "session-2", enrollmentId: "enrollment-1" } },
      update: { status: "PRESENT" },
      create: { sessionId: "session-2", enrollmentId: "enrollment-1", status: "PRESENT" },
    });

    prisma.enrollment.findFirst.mockResolvedValueOnce(null);
    await expect(
      attendanceMutationResolvers.markEnrollmentPresentForDates(
        null,
        { classId: "class-1", enrollmentId: "missing", dates: ["2026-01-05"] },
        ctx,
      ),
    ).rejects.toThrow("Not found");
  });

  it("excludes attendance dates once", async () => {
    prisma.class.findFirst.mockResolvedValueOnce({
      id: "class-1",
      excludedDates: [new Date("2026-01-05T00:00:00.000Z")],
    });
    await expect(
      attendanceMutationResolvers.excludeAttendanceDate(
        null,
        { classId: "class-1", date: "2026-01-05" },
        ctx,
      ),
    ).resolves.toBe(true);
    expect(prisma.class.update).not.toHaveBeenCalled();

    prisma.class.findFirst.mockResolvedValueOnce({ id: "class-1", excludedDates: [] });
    await attendanceMutationResolvers.excludeAttendanceDate(
      null,
      { classId: "class-1", date: "2026-01-06" },
      ctx,
    );
    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class-1" },
      data: { excludedDates: [new Date("2026-01-06")] },
    });
  });
});
