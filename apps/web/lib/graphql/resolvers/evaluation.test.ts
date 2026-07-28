import { describe, expect, it } from "vitest";
import { anonymousContext, teacherContext, TEACHER_OWNER_IDS } from "@/test/graphql-context";
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

describe("evaluationMutationResolvers.renameEvaluation", () => {
  it("renames an evaluation from an owned or invited class", async () => {
    prismaMock.evaluation.findFirst.mockResolvedValue({ id: EVALUATION_ID });
    prismaMock.evaluation.update.mockResolvedValue({ id: EVALUATION_ID, title: "Prova 1" });

    await expect(
      evaluationMutationResolvers.renameEvaluation(
        null,
        { id: EVALUATION_ID, title: " Prova 1 " },
        teacherContext,
      ),
    ).resolves.toEqual({ id: EVALUATION_ID, title: "Prova 1" });
    expect(prismaMock.evaluation.findFirst).toHaveBeenCalledWith({
      where: {
        id: EVALUATION_ID,
        class: {
          OR: [
            { ownerId: { in: TEACHER_OWNER_IDS } },
            { invitedUserIds: { hasSome: TEACHER_OWNER_IDS } },
          ],
        },
      },
    });
    expect(prismaMock.evaluation.update).toHaveBeenCalledWith({
      where: { id: EVALUATION_ID },
      data: { title: "Prova 1" },
    });
  });

  it("rejects an empty title without updating the evaluation", async () => {
    await expect(
      evaluationMutationResolvers.renameEvaluation(
        null,
        { id: EVALUATION_ID, title: " " },
        teacherContext,
      ),
    ).rejects.toThrow("Título é obrigatório");
    expect(prismaMock.evaluation.update).not.toHaveBeenCalled();
  });

  it("rejects evaluations outside the accessible classes", async () => {
    prismaMock.evaluation.findFirst.mockResolvedValue(null);

    await expect(
      evaluationMutationResolvers.renameEvaluation(
        null,
        { id: EVALUATION_ID, title: "Prova 1" },
        teacherContext,
      ),
    ).rejects.toThrow("Not found");
    expect(prismaMock.evaluation.update).not.toHaveBeenCalled();
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
