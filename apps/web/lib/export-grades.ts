import * as XLSX from "xlsx";

export type ExportGradeEval = { id: string; title: string; maxScore: number };
export type ExportEnrollment = { id: string; student: { id: string; name: string }; concept?: string | null };
export type ExportGrade = { enrollmentId: string; evaluationId: string; score: number };

export function exportGradesToXlsx(opts: {
  className: string;
  evaluations: ExportGradeEval[];
  enrollments: ExportEnrollment[];
  grades: ExportGrade[];
}) {
  const { className, evaluations, enrollments, grades } = opts;

  // Index grades by enrollment|evaluation
  const idx = new Map<string, number>();
  for (const g of grades) idx.set(`${g.enrollmentId}|${g.evaluationId}`, g.score);

  // Header: Aluno, each evaluation title, Média, Conceito
  const header = ["Aluno", ...evaluations.map((e) => e.title), "Média", "Conceito"];
  const rows: (string | number)[][] = [header];

  for (const enr of enrollments) {
    const row: (string | number)[] = [enr.student.name];
    const normalizedScores: number[] = [];
    for (const ev of evaluations) {
      const s = idx.get(`${enr.id}|${ev.id}`);
      if (typeof s === "number") {
        row.push(s);
        const max = ev.maxScore || 10;
        normalizedScores.push((s / max) * 10);
      } else {
        row.push("");
      }
    }
    const avg = normalizedScores.length
      ? Number((normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length).toFixed(1))
      : "";
    row.push(avg as any);
    row.push(enr.concept ?? "");
    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set basic column widths (Aluno wider)
  const colWidths = [{ wch: 24 }, ...evaluations.map(() => ({ wch: 10 })), { wch: 8 }, { wch: 10 }];
  (ws as any)["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Notas");
  const fileName = `${className || "turma"}-notas.xlsx`;
  XLSX.writeFile(wb, fileName);
}
