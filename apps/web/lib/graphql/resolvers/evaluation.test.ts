import { beforeEach, describe, expect, it, vi } from "vitest";
import { evaluationMutationResolvers, evaluationQueryResolvers } from "./evaluation";

const prisma = vi.hoisted(() => ({
  class: { findFirst: vi.fn() },
  evaluation: { create: vi.fn(), delete: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
  grade: { deleteMany: vi.fn() },
}));

vi.mock("../prisma", () => ({
  getPrisma: async () => prisma,
}));

const ctx = { user: { id: "next-1", prismaUserId: "u1" } } as any;
const anon = { user: null } as any;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("evaluation resolvers", () => {
  it("queries evaluations", async () => {
    await expect(
      evaluationQueryResolvers.evaluations(null, { classId: "class-1" }, anon),
    ).resolves.toEqual([]);

    prisma.evaluation.findMany.mockResolvedValueOnce([{ id: "evaluation-1" }]);
    await expect(
      evaluationQueryResolvers.evaluations(null, { classId: "class-1" }, ctx),
    ).resolves.toEqual([{ id: "evaluation-1" }]);
  });

  it("creates evaluations", async () => {
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
  });

  it("deletes evaluations and grades", async () => {
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
