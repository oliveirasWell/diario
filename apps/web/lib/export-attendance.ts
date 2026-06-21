import * as XLSX from "xlsx";
import { attendanceDayKey } from "@/lib/attendance-date";

type Status = "PRESENT" | "ABSENT" | "LATE";

const LABELS: Record<Status, string> = {
  PRESENT: "Presente",
  ABSENT: "Falta",
  LATE: "Atraso",
};

export function exportAttendanceToXlsx(opts: {
  className: string;
  dates: Date[];
  enrollments: { id: string; student: { id: string; name: string } }[];
  records: { enrollmentId: string; status: Status; session: { date: string } }[];
}) {
  const { className, dates, enrollments, records } = opts;

  const recMap = new Map<string, Status>();
  for (const r of records) recMap.set(`${r.enrollmentId}|${attendanceDayKey(r.session.date)}`, r.status);

  const header = ["Aluno", ...dates.map((d) => attendanceDayKey(d))];
  const rows: (string | number)[][] = [header];

  for (const e of enrollments) {
    const row: (string | number)[] = [e.student.name];
    for (const d of dates) {
      const k = `${e.id}|${attendanceDayKey(d)}`;
      const s = recMap.get(k);
      row.push(s ? LABELS[s] : "");
    }
    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Presencas");
  XLSX.writeFile(wb, `${className || "turma"}-presencas.xlsx`);
}
