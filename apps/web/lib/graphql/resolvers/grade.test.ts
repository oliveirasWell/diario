import { beforeEach, describe, expect, it, vi } from "vitest";
import { gradeMutationResolvers, gradeQueryResolvers } from "./grade";

const prisma = vi.hoisted(() => ({
  class: { findFirst: vi.fn() },
  enrollment: { findFirst: vi.fn() },
  evaluation: { findFirst: vi.fn() },
  grade: { findMany: vi.fn(), upsert: vi.fn() },
}));

vi.mock("../prisma", () => ({
  getPrisma: async () => prisma,
}));

const ctx = { user: { id: "next-1", prismaUserId: "u1" } } as any;
const anon = { user: null } as any;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("grade resolvers", () => {
  it("queries grades by class", async () => {
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
  });

  it("upserts grades", async () => {
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
