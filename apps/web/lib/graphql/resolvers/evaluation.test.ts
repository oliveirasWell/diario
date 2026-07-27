import { describe, expect, it } from "vitest";
import { anonymousContext, teacherContext } from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import { evaluationMutationResolvers, evaluationQueryResolvers } from "./evaluation";

const CLASS_ID = "class-1";
const EVALUATION_ID = "evaluation-1";

describe("evaluationQueryResolvers.evaluations", () => {
  it("returns nothing for anonymous users", async () => {
    await expect(
      evaluationQueryResolvers.evaluations(null, { classId: CLASS_ID }, anonymousContext),
    ).resolves.toEqual([]);
  });

  it("returns the evaluations of an accessible class", async () => {
    prismaMock.evaluation.findMany.mockResolvedValue([{ id: EVALUATION_ID }]);

    await expect(
      evaluationQueryResolvers.evaluations(null, { classId: CLASS_ID }, teacherContext),
    ).resolves.toEqual([{ id: EVALUATION_ID }]);
  });
});

describe("evaluationMutationResolvers.createEvaluation", () => {
  it("defaults the weight to 1", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.evaluation.create.mockResolvedValue({ id: EVALUATION_ID });

    await expect(
      evaluationMutationResolvers.createEvaluation(
        null,
        { classId: CLASS_ID, title: "P1", maxScore: 10, weight: null },
        teacherContext,
      ),
    ).resolves.toEqual({ id: EVALUATION_ID });
    expect(prismaMock.evaluation.create).toHaveBeenCalledWith({
      data: { classId: CLASS_ID, title: "P1", weight: 1, maxScore: 10 },
    });
  });
});

describe("evaluationMutationResolvers.deleteEvaluation", () => {
  it("rejects evaluations outside the accessible classes", async () => {
    prismaMock.evaluation.findFirst.mockResolvedValue(null);

    await expect(
      evaluationMutationResolvers.deleteEvaluation(null, { id: "missing" }, teacherContext),
    ).rejects.toThrow("Not found");
  });

  it("deletes the grades before the evaluation", async () => {
    prismaMock.evaluation.findFirst.mockResolvedValue({ id: EVALUATION_ID });

    await expect(
      evaluationMutationResolvers.deleteEvaluation(null, { id: EVALUATION_ID }, teacherContext),
    ).resolves.toBe(true);
    expect(prismaMock.grade.deleteMany).toHaveBeenCalledWith({
      where: { evaluationId: EVALUATION_ID },
    });
    expect(prismaMock.evaluation.delete).toHaveBeenCalledWith({ where: { id: EVALUATION_ID } });
  });
});
