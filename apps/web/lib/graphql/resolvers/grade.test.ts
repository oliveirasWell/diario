import { describe, expect, it } from "vitest";
import { anonymousContext, teacherContext } from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import { gradeMutationResolvers, gradeQueryResolvers } from "./grade";

const CLASS_ID = "class-1";
const ENROLLMENT_ID = "enrollment-1";
const EVALUATION_ID = "evaluation-1";
const GRADE_ID = "grade-1";
const STUDENT_ID = "student-1";

describe("gradeQueryResolvers.gradesByClass", () => {
  it("returns nothing for anonymous users", async () => {
    await expect(
      gradeQueryResolvers.gradesByClass(null, { classId: CLASS_ID }, anonymousContext),
    ).resolves.toEqual({ evaluations: [], rows: [] });
  });

  it("returns nothing when the class is not accessible", async () => {
    prismaMock.class.findFirst.mockResolvedValue(null);

    await expect(
      gradeQueryResolvers.gradesByClass(null, { classId: CLASS_ID }, teacherContext),
    ).resolves.toEqual({ evaluations: [], rows: [] });
  });

  it("returns the grades of an accessible class", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.evaluation.findMany.mockResolvedValue([{ id: EVALUATION_ID }]);
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        id: ENROLLMENT_ID,
        concept: "A",
        student: { id: STUDENT_ID, name: "Ana" },
      },
    ]);
    prismaMock.grade.findMany.mockResolvedValue([
      { id: GRADE_ID, enrollmentId: ENROLLMENT_ID, evaluationId: EVALUATION_ID, score: 8 },
    ]);

    await expect(
      gradeQueryResolvers.gradesByClass(null, { classId: CLASS_ID }, teacherContext),
    ).resolves.toEqual({
      evaluations: [{ id: EVALUATION_ID }],
      rows: [
        {
          enrollmentId: ENROLLMENT_ID,
          concept: "A",
          student: { id: STUDENT_ID, name: "Ana" },
          grades: [
            { id: GRADE_ID, enrollmentId: ENROLLMENT_ID, evaluationId: EVALUATION_ID, score: 8 },
          ],
        },
      ],
    });
  });
});

describe("gradeMutationResolvers.upsertGrade", () => {
  const args = { enrollmentId: ENROLLMENT_ID, evaluationId: EVALUATION_ID, score: 8 };

  it("rejects an enrollment outside the accessible classes", async () => {
    prismaMock.enrollment.findFirst.mockResolvedValue(null);

    await expect(gradeMutationResolvers.upsertGrade(null, args, teacherContext)).rejects.toThrow(
      "Not found",
    );
  });

  it("rejects an evaluation from another class", async () => {
    prismaMock.enrollment.findFirst.mockResolvedValue({ id: ENROLLMENT_ID, classId: CLASS_ID });
    prismaMock.evaluation.findFirst.mockResolvedValue(null);

    await expect(gradeMutationResolvers.upsertGrade(null, args, teacherContext)).rejects.toThrow(
      "Not found",
    );
  });

  it("upserts on the enrollment and evaluation pair", async () => {
    prismaMock.enrollment.findFirst.mockResolvedValue({ id: ENROLLMENT_ID, classId: CLASS_ID });
    prismaMock.evaluation.findFirst.mockResolvedValue({ id: EVALUATION_ID });
    prismaMock.grade.upsert.mockResolvedValue({ id: GRADE_ID, score: 8 });

    await expect(gradeMutationResolvers.upsertGrade(null, args, teacherContext)).resolves.toEqual({
      id: GRADE_ID,
      score: 8,
    });
    expect(prismaMock.grade.upsert).toHaveBeenCalledWith({
      where: {
        enrollmentId_evaluationId: {
          enrollmentId: ENROLLMENT_ID,
          evaluationId: EVALUATION_ID,
        },
      },
      update: { score: 8 },
      create: { enrollmentId: ENROLLMENT_ID, evaluationId: EVALUATION_ID, score: 8 },
    });
  });
});
