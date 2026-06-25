import { describe, expect, it } from "vitest";
import { buildGradeRows } from "./export-grades";

describe("buildGradeRows", () => {
  it("normalizes scores before averaging", () => {
    expect(
      buildGradeRows({
        evaluations: [
          { id: "eval-1", title: "P1", maxScore: 10 },
          { id: "eval-2", title: "P2", maxScore: 20 },
        ],
        enrollments: [{ id: "enr-1", student: { id: "stu-1", name: "Ana" }, concept: "A" }],
        grades: [
          { enrollmentId: "enr-1", evaluationId: "eval-1", score: 8 },
          { enrollmentId: "enr-1", evaluationId: "eval-2", score: 10 },
        ],
      }),
    ).toEqual([
      ["Aluno", "P1", "P2", "Média", "Conceito"],
      ["Ana", 8, 10, 6.5, "A"],
    ]);
  });
});
