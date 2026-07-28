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
        rows: [
          {
            enrollmentId: "enr-1",
            student: { id: "stu-1", name: "Ana" },
            concept: "A",
            grades: [
              { evaluationId: "eval-1", score: 8 },
              { evaluationId: "eval-2", score: 10 },
            ],
          },
        ],
      }),
    ).toEqual([
      ["Aluno", "P1", "P2", "Média", "Conceito"],
      ["Ana", 8, 10, 6.5, "A"],
    ]);
  });

  it("leaves missing scores and averages blank", () => {
    const expectedRows = [
      ["Aluno", "P1", "Média", "Conceito"],
      ["Ana", "", "", ""],
    ];

    expect(
      buildGradeRows({
        evaluations: [{ id: "eval-1", title: "P1", maxScore: 0 }],
        rows: [
          {
            enrollmentId: "enr-1",
            student: { id: "stu-1", name: "Ana" },
            concept: null,
            grades: [],
          },
        ],
      }),
    ).toEqual(expectedRows);
  });
});
