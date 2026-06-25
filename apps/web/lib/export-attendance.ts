import * as XLSX from "xlsx";
import { attendanceDayKey } from "@/lib/attendance-date";
import { AttendanceStatus } from "@/src/gql/schema";
const LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Present]: "Presente",
  [AttendanceStatus.Absent]: "Falta",
  [AttendanceStatus.Late]: "Atraso",
};

export function exportAttendanceToXlsx(opts: {
  className: string;
  dates: Date[];
  enrollments: { id: string; student: { id: string; name: string } }[];
  records: { enrollmentId: string; status: AttendanceStatus; session: { date: string } }[];
}) {
  const { className, dates, enrollments, records } = opts;

  const rows = buildAttendanceRows({ dates, enrollments, records });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Presencas");
  XLSX.writeFile(wb, `${className || "turma"}-presencas.xlsx`);
}

export function buildAttendanceRows(opts: {
  dates: Date[];
  enrollments: { id: string; student: { id: string; name: string } }[];
  records: { enrollmentId: string; status: AttendanceStatus; session: { date: string } }[];
}) {
  const { dates, enrollments, records } = opts;
  const recMap = new Map<string, AttendanceStatus>();
  for (const r of records) {
    recMap.set(`${r.enrollmentId}|${attendanceDayKey(r.session.date)}`, r.status);
  }

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

  return rows;
}
