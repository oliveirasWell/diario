import { averageScore, scoreOutOfTen } from "@/lib/grade-average";
import { downloadSheet, type SheetRow } from "@/lib/xlsx-sheet";

export type ExportGradeEval = { id: string; title: string; maxScore: number };
type ExportEnrollment = {
  id: string;
  student: { id: string; name: string };
  concept?: string | null;
};
type ExportGrade = { enrollmentId: string; evaluationId: string; score: number };

export function exportGradesToXlsx(options: {
  className: string;
  evaluations: ExportGradeEval[];
  enrollments: ExportEnrollment[];
  grades: ExportGrade[];
}) {
  const { className, evaluations, enrollments, grades } = options;

  downloadSheet({
    rows: buildGradeRows({ evaluations, enrollments, grades }),
    sheetName: "Notas",
    fileName: `${className || "turma"}-notas.xlsx`,
    columnWidths: [24, ...evaluations.map(() => 10), 8, 10],
  });
}

export function buildGradeRows(options: {
  evaluations: ExportGradeEval[];
  enrollments: ExportEnrollment[];
  grades: ExportGrade[];
}): SheetRow[] {
  const { evaluations, enrollments, grades } = options;
  const scoreByCell = new Map(
    grades.map((grade) => [`${grade.enrollmentId}|${grade.evaluationId}`, grade.score]),
  );

  const header = [
    "Aluno",
    ...evaluations.map((evaluation) => evaluation.title),
    "Média",
    "Conceito",
  ];

  return [
    header,
    ...enrollments.map((enrollment) => {
      const scores = evaluations.map((evaluation) => ({
        value: scoreByCell.get(`${enrollment.id}|${evaluation.id}`),
        maxScore: evaluation.maxScore,
      }));
      const average = averageScore(
        scores.flatMap((score) =>
          score.value == null ? [] : [scoreOutOfTen(score.value, score.maxScore)],
        ),
      );

      return [
        enrollment.student.name,
        ...scores.map((score) => score.value ?? ""),
        average ?? "",
        enrollment.concept ?? "",
      ];
    }),
  ];
}
