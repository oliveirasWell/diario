import { beforeEach, describe, expect, it, vi } from "vitest";
import { enrollmentMutationResolvers, enrollmentQueryResolvers } from "./enrollment";

const prisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  attendanceRecord: { deleteMany: vi.fn() },
  class: { findFirst: vi.fn() },
  enrollment: {
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  grade: { deleteMany: vi.fn() },
  student: { create: vi.fn(), update: vi.fn() },
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

  it("creates enrollment with normalized email", async () => {
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
  });

  it("unenrolls students", async () => {
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
  });

  it("renames students", async () => {
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
  });

  it("sets enrollment concepts", async () => {
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
