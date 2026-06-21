import * as XLSX from "xlsx";

export type ExportGradeEval = { id: string; title: string; maxScore: number };
export type ExportGradeRow = {
  enrollmentId: string;
  concept?: string | null;
  student: { id: string; name: string };
  grades: { evaluationId: string; score: number }[];
};

export function exportGradesToXlsx(opts: {
  className: string;
  evaluations: ExportGradeEval[];
  rows: ExportGradeRow[];
}) {
  const { className, evaluations, rows } = opts;

  const header = ["Aluno", ...evaluations.map((e) => e.title), "Média", "Conceito"];
  const sheetRows: (string | number)[][] = [header];

  for (const row of rows) {
    const gradeByEval = new Map(row.grades.map((g) => [g.evaluationId, g.score]));
    const sheetRow: (string | number)[] = [row.student.name];
    const normalizedScores: number[] = [];

    for (const ev of evaluations) {
      const score = gradeByEval.get(ev.id);
      if (typeof score === "number") {
        sheetRow.push(score);
        normalizedScores.push((score / (ev.maxScore || 10)) * 10);
      } else {
        sheetRow.push("");
      }
    }

    const avg = normalizedScores.length
      ? Number((normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length).toFixed(1))
      : "";
    sheetRow.push(avg);
    sheetRow.push(row.concept ?? "");
    sheetRows.push(sheetRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  (ws as { "!cols"?: { wch: number }[] })["!cols"] = [
    { wch: 24 },
    ...evaluations.map(() => ({ wch: 10 })),
    { wch: 8 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Notas");
  XLSX.writeFile(wb, `${className || "turma"}-notas.xlsx`);
}
