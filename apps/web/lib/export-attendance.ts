import * as XLSX from "xlsx";

type Status = "PRESENT" | "ABSENT" | "LATE";

const LABELS: Record<Status, string> = {
  PRESENT: "Presente",
  ABSENT: "Falta",
  LATE: "Atraso",
};

function dayKey(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

export function exportAttendanceToXlsx(opts: {
  className: string;
  dates: Date[];
  enrollments: { id: string; student: { id: string; name: string } }[];
  records: { enrollmentId: string; status: Status; session: { date: string } }[];
}) {
  const { className, dates, enrollments, records } = opts;

  // Build index for quick lookup
  const recMap = new Map<string, Status>();
  for (const r of records) recMap.set(`${r.enrollmentId}|${dayKey(r.session.date)}`, r.status);

  const header = ["Aluno", ...dates.map((d) => dayKey(d))];
  const rows: (string | number)[][] = [header];

  for (const e of enrollments) {
    const row: (string | number)[] = [e.student.name];
    for (const d of dates) {
      const k = `${e.id}|${dayKey(d)}`;
      const s = recMap.get(k) as Status | undefined;
      row.push(s ? LABELS[s] : "");
    }
    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Presencas");
  const fileName = `${className || "turma"}-presencas.xlsx`;
  XLSX.writeFile(wb, fileName);
}
