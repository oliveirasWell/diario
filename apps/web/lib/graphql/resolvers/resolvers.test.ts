import { beforeEach, describe, expect, it, vi } from "vitest";
import { attendanceMutationResolvers, attendanceQueryResolvers } from "./attendance";
import { classFieldResolvers, classMutationResolvers, classQueryResolvers } from "./class";
import { enrollmentMutationResolvers, enrollmentQueryResolvers } from "./enrollment";
import { evaluationMutationResolvers, evaluationQueryResolvers } from "./evaluation";
import { gradeMutationResolvers, gradeQueryResolvers } from "./grade";
import { AttendanceStatus } from "@/src/gql/schema";

const prisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  attendanceRecord: {
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  attendanceSession: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  class: {
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  enrollment: {
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  evaluation: {
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  grade: {
    deleteMany: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  student: {
    create: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock("../prisma", () => ({
  getPrisma: async () => prisma,
}));

const ctx = { user: { id: "next-1", prismaUserId: "u1" } } as any;
const anon = { user: null } as any;

beforeEach(() => {
  vi.resetAllMocks();
  prisma.$transaction.mockImplementation(async (fn: (tx: any) => unknown) => fn(prisma));
  delete process.env.NEXTAUTH_URL;
});

describe("class resolvers", () => {
  it("resolves class fields", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: "u1", name: "Owner" });

    expect(classFieldResolvers.Class.daysOfWeek({})).toEqual([]);
    await expect(classFieldResolvers.Class.owner({ ownerId: "u1" })).resolves.toEqual({
      id: "u1",
      name: "Owner",
    });
    await expect(
      classFieldResolvers.Class.invitedUserIds(
        { ownerId: "u1", invitedUserIds: ["u2"] },
        null,
        ctx,
      ),
    ).resolves.toEqual(["u2"]);
    await expect(
      classFieldResolvers.Class.invitedUserIds(
        { ownerId: "u2", invitedUserIds: ["u1"] },
        null,
        ctx,
      ),
    ).resolves.toEqual([]);
  });

  it("queries classes and public invite info", async () => {
    await expect(classQueryResolvers.classes(null, null, anon)).resolves.toEqual([]);

    prisma.class.findMany.mockResolvedValueOnce([{ id: "class-1" }]);
    await expect(classQueryResolvers.classes(null, null, ctx)).resolves.toEqual([
      { id: "class-1" },
    ]);

    await expect(classQueryResolvers.class(null, { id: "class-1" }, anon)).resolves.toBeNull();

    prisma.class.findFirst.mockResolvedValueOnce({ id: "class-1" });
    await expect(classQueryResolvers.class(null, { id: "class-1" }, ctx)).resolves.toEqual({
      id: "class-1",
    });

    prisma.class.findUnique.mockResolvedValueOnce(null);
    await expect(classQueryResolvers.classInviteInfo(null, { id: "missing" })).resolves.toBeNull();

    prisma.class.findUnique.mockResolvedValueOnce({ id: "class-1", name: "Math", ownerId: "u1" });
    prisma.user.findUnique.mockResolvedValueOnce({ name: "Owner" });
    await expect(classQueryResolvers.classInviteInfo(null, { id: "class-1" })).resolves.toEqual({
      id: "class-1",
      name: "Math",
      ownerName: "Owner",
    });
  });

  it("mutates class schedule, name, deletion, invites", async () => {
    prisma.class.findFirst.mockResolvedValue({ id: "class-1", daysOfWeek: [1], excludedDates: [] });
    prisma.class.update.mockResolvedValue({ id: "class-1" });

    await classMutationResolvers.updateClassSchedule(
      null,
      { id: "class-1", daysOfWeek: [2], startDate: "2026-01-01", endDate: null },
      ctx,
    );
    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class-1" },
      data: { daysOfWeek: [2], startDate: new Date("2026-01-01"), endDate: null },
    });

    await expect(
      classMutationResolvers.renameClass(null, { id: "class-1", name: " " }, ctx),
    ).rejects.toThrow("Nome é obrigatório");

    await classMutationResolvers.renameClass(null, { id: "class-1", name: "  Physics  " }, ctx);
    expect(prisma.class.update).toHaveBeenLastCalledWith({
      where: { id: "class-1" },
      data: { name: "Physics" },
    });

    prisma.attendanceSession.findMany.mockResolvedValueOnce([{ id: "session-1" }]);
    prisma.evaluation.findMany.mockResolvedValueOnce([{ id: "evaluation-1" }]);
    await expect(classMutationResolvers.deleteClass(null, { id: "class-1" }, ctx)).resolves.toBe(
      true,
    );
    expect(prisma.attendanceRecord.deleteMany).toHaveBeenCalledWith({
      where: { sessionId: { in: ["session-1"] } },
    });
    expect(prisma.grade.deleteMany).toHaveBeenCalledWith({
      where: { evaluationId: { in: ["evaluation-1"] } },
    });
    expect(prisma.class.delete).toHaveBeenCalledWith({ where: { id: "class-1" } });

    process.env.NEXTAUTH_URL = "https://diario.test";
    await expect(
      classMutationResolvers.createInviteLink(null, { classId: "class-1" }, ctx),
    ).resolves.toBe("https://diario.test/invite/class-1");

    prisma.class.findUnique.mockResolvedValueOnce({ id: "class-1", invitedUserIds: ["u1"] });
    await expect(
      classMutationResolvers.acceptInvite(null, { id: "class-1" }, ctx),
    ).resolves.toEqual({
      id: "class-1",
      invitedUserIds: ["u1"],
    });

    prisma.class.findUnique.mockResolvedValueOnce({ id: "class-2", invitedUserIds: [] });
    prisma.class.update.mockResolvedValueOnce({ id: "class-2", invitedUserIds: ["u1"] });
    await expect(
      classMutationResolvers.acceptInvite(null, { id: "class-2" }, ctx),
    ).resolves.toEqual({
      id: "class-2",
      invitedUserIds: ["u1"],
    });

    prisma.class.findUnique.mockResolvedValueOnce(null);
    await expect(classMutationResolvers.acceptInvite(null, { id: "missing" }, ctx)).rejects.toThrow(
      "Not found",
    );
  });
});

describe("enrollment resolvers", () => {
  it("queries enrollments", async () => {
    await expect(
      enrollmentQueryResolvers.enrollments(null, { classId: "class-1" }, anon),
    ).resolves.toEqual([]);

    prisma.enrollment.findMany.mockResolvedValueOnce([{ id: "enrollment-1" }]);
    await expect(
      enrollmentQueryResolvers.enrollments(null, { classId: "class-1" }, ctx),
    ).resolves.toEqual([{ id: "enrollment-1" }]);
  });

  it("creates, removes, renames, and grades enrollment concepts", async () => {
    prisma.class.findFirst.mockResolvedValue({ id: "class-1" });
    prisma.student.create.mockResolvedValueOnce({ id: "student-1" });
    prisma.enrollment.create.mockResolvedValueOnce({ id: "enrollment-1" });

    await expect(
      enrollmentMutationResolvers.createAndEnroll(
        null,
        { classId: "class-1", name: "Ana", email: " ANA@EXAMPLE.COM " },
        ctx,
      ),
    ).resolves.toEqual({ id: "enrollment-1" });
    expect(prisma.student.create).toHaveBeenCalledWith({
      data: { name: "Ana", email: "ana@example.com" },
    });

    prisma.enrollment.findFirst.mockResolvedValueOnce({
      id: "enrollment-1",
      studentId: "student-1",
    });
    await expect(
      enrollmentMutationResolvers.unenrollStudent(null, { enrollmentId: "enrollment-1" }, ctx),
    ).resolves.toBe(true);
    expect(prisma.attendanceRecord.deleteMany).toHaveBeenCalledWith({
      where: { enrollmentId: "enrollment-1" },
    });
    expect(prisma.enrollment.delete).toHaveBeenCalledWith({ where: { id: "enrollment-1" } });

    prisma.enrollment.findFirst.mockResolvedValueOnce(null);
    await expect(
      enrollmentMutationResolvers.unenrollStudent(null, { enrollmentId: "missing" }, ctx),
    ).rejects.toThrow("Not found");

    await expect(
      enrollmentMutationResolvers.renameStudent(
        null,
        { enrollmentId: "enrollment-1", name: " " },
        ctx,
      ),
    ).rejects.toThrow("Nome é obrigatório");

    prisma.enrollment.findFirst.mockResolvedValueOnce({
      id: "enrollment-1",
      studentId: "student-1",
    });
    prisma.enrollment.findUniqueOrThrow.mockResolvedValueOnce({ id: "enrollment-1" });
    await expect(
      enrollmentMutationResolvers.renameStudent(
        null,
        { enrollmentId: "enrollment-1", name: "  Bia " },
        ctx,
      ),
    ).resolves.toEqual({ id: "enrollment-1" });
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: "student-1" },
      data: { name: "Bia" },
    });

    prisma.enrollment.findFirst.mockResolvedValueOnce(null);
    await expect(
      enrollmentMutationResolvers.renameStudent(
        null,
        { enrollmentId: "missing", name: "Bia" },
        ctx,
      ),
    ).rejects.toThrow("Not found");

    prisma.enrollment.findFirst.mockResolvedValueOnce({ id: "enrollment-1" });
    prisma.enrollment.update.mockResolvedValueOnce({ id: "enrollment-1", concept: null });
    await expect(
      enrollmentMutationResolvers.setEnrollmentConcept(
        null,
        { enrollmentId: "enrollment-1", concept: null },
        ctx,
      ),
    ).resolves.toEqual({ id: "enrollment-1", concept: null });

    prisma.enrollment.findFirst.mockResolvedValueOnce(null);
    await expect(
      enrollmentMutationResolvers.setEnrollmentConcept(
        null,
        { enrollmentId: "missing", concept: "A" },
        ctx,
      ),
    ).rejects.toThrow("Not found");
  });
});

describe("evaluation resolvers", () => {
  it("queries and mutates evaluations", async () => {
    await expect(
      evaluationQueryResolvers.evaluations(null, { classId: "class-1" }, anon),
    ).resolves.toEqual([]);

    prisma.evaluation.findMany.mockResolvedValueOnce([{ id: "evaluation-1" }]);
    await expect(
      evaluationQueryResolvers.evaluations(null, { classId: "class-1" }, ctx),
    ).resolves.toEqual([{ id: "evaluation-1" }]);

    prisma.class.findFirst.mockResolvedValueOnce({ id: "class-1" });
    prisma.evaluation.create.mockResolvedValueOnce({ id: "evaluation-1" });
    await expect(
      evaluationMutationResolvers.createEvaluation(
        null,
        { classId: "class-1", title: "P1", maxScore: 10, weight: null },
        ctx,
      ),
    ).resolves.toEqual({ id: "evaluation-1" });
    expect(prisma.evaluation.create).toHaveBeenCalledWith({
      data: { classId: "class-1", title: "P1", weight: 1, maxScore: 10 },
    });

    prisma.evaluation.findFirst.mockResolvedValueOnce(null);
    await expect(
      evaluationMutationResolvers.deleteEvaluation(null, { id: "missing" }, ctx),
    ).rejects.toThrow("Not found");

    prisma.evaluation.findFirst.mockResolvedValueOnce({ id: "evaluation-1" });
    await expect(
      evaluationMutationResolvers.deleteEvaluation(null, { id: "evaluation-1" }, ctx),
    ).resolves.toBe(true);
    expect(prisma.grade.deleteMany).toHaveBeenCalledWith({
      where: { evaluationId: "evaluation-1" },
    });
    expect(prisma.evaluation.delete).toHaveBeenCalledWith({ where: { id: "evaluation-1" } });
  });
});

describe("grade resolvers", () => {
  it("queries and upserts grades", async () => {
    await expect(
      gradeQueryResolvers.gradesByClass(null, { classId: "class-1" }, anon),
    ).resolves.toEqual([]);

    prisma.class.findFirst.mockResolvedValueOnce(null);
    await expect(
      gradeQueryResolvers.gradesByClass(null, { classId: "class-1" }, ctx),
    ).resolves.toEqual([]);

    prisma.class.findFirst.mockResolvedValueOnce({ id: "class-1" });
    prisma.grade.findMany.mockResolvedValueOnce([{ id: "grade-1" }]);
    await expect(
      gradeQueryResolvers.gradesByClass(null, { classId: "class-1" }, ctx),
    ).resolves.toEqual([{ id: "grade-1" }]);

    prisma.enrollment.findFirst.mockResolvedValueOnce(null);
    await expect(
      gradeMutationResolvers.upsertGrade(
        null,
        { enrollmentId: "enrollment-1", evaluationId: "evaluation-1", score: 8 },
        ctx,
      ),
    ).rejects.toThrow("Not found");

    prisma.enrollment.findFirst.mockResolvedValueOnce({ id: "enrollment-1", classId: "class-1" });
    prisma.evaluation.findFirst.mockResolvedValueOnce(null);
    await expect(
      gradeMutationResolvers.upsertGrade(
        null,
        { enrollmentId: "enrollment-1", evaluationId: "evaluation-1", score: 8 },
        ctx,
      ),
    ).rejects.toThrow("Not found");

    prisma.enrollment.findFirst.mockResolvedValueOnce({ id: "enrollment-1", classId: "class-1" });
    prisma.evaluation.findFirst.mockResolvedValueOnce({ id: "evaluation-1" });
    prisma.grade.upsert.mockResolvedValueOnce({ id: "grade-1", score: 8 });
    await expect(
      gradeMutationResolvers.upsertGrade(
        null,
        { enrollmentId: "enrollment-1", evaluationId: "evaluation-1", score: 8 },
        ctx,
      ),
    ).resolves.toEqual({ id: "grade-1", score: 8 });
    expect(prisma.grade.upsert).toHaveBeenCalledWith({
      where: {
        enrollmentId_evaluationId: {
          enrollmentId: "enrollment-1",
          evaluationId: "evaluation-1",
        },
      },
      update: { score: 8 },
      create: { enrollmentId: "enrollment-1", evaluationId: "evaluation-1", score: 8 },
    });
  });
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
