import { averageScore, scoreOutOfTen } from "@/lib/grade-average";
import { downloadSheet, type SheetRow } from "@/lib/xlsx-sheet";

export type ExportGradeEval = { id: string; title: string; maxScore: number };
export type ExportGradeRow = {
  enrollmentId: string;
  concept?: string | null;
  student: { id: string; name: string };
  grades: { evaluationId: string; score: number }[];
};

export const buildGradeRows = (options: {
  evaluations: ExportGradeEval[];
  rows: ExportGradeRow[];
}): SheetRow[] => {
  const { evaluations, rows } = options;

  const header = [
    "Aluno",
    ...evaluations.map((evaluation) => evaluation.title),
    "Média",
    "Conceito",
  ];

  return [
    header,
    ...rows.map((row) => {
      const scoreByEvaluation = new Map(
        row.grades.map((grade) => [grade.evaluationId, grade.score]),
      );
      const scores = evaluations.map((evaluation) => ({
        value: scoreByEvaluation.get(evaluation.id),
        maxScore: evaluation.maxScore,
      }));
      const average = averageScore(
        scores.flatMap((score) =>
          score.value == null ? [] : [scoreOutOfTen(score.value, score.maxScore)],
        ),
      );

      return [
        row.student.name,
        ...scores.map((score) => score.value ?? ""),
        average ?? "",
        row.concept ?? "",
      ];
    }),
  ];
};

export const exportGradesToXlsx = (options: {
  className: string;
  evaluations: ExportGradeEval[];
  rows: ExportGradeRow[];
}) => {
  const { className, evaluations, rows } = options;

  downloadSheet({
    rows: buildGradeRows({ evaluations, rows }),
    sheetName: "Notas",
    fileName: `${className || "turma"}-notas.xlsx`,
    columnWidths: [24, ...evaluations.map(() => 10), 8, 10],
  });
};
