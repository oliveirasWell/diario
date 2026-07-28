import { attendanceDayKey } from "@/lib/attendance-date";
import { downloadSheet, type SheetRow } from "@/lib/xlsx-sheet";
import { AttendanceStatus } from "@/src/gql/schema";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Present]: "Presente",
  [AttendanceStatus.Absent]: "Falta",
  [AttendanceStatus.Late]: "Atraso",
};

type ExportEnrollment = { id: string; student: { id: string; name: string } };
type ExportRecord = {
  enrollmentId: string;
  status: AttendanceStatus;
  session: { date: string };
};

export function exportAttendanceToXlsx(options: {
  className: string;
  dates: Date[];
  enrollments: ExportEnrollment[];
  records: ExportRecord[];
}) {
  const { className, dates, enrollments, records } = options;

  downloadSheet({
    rows: buildAttendanceRows({ dates, enrollments, records }),
    sheetName: "Presencas",
    fileName: `${className || "turma"}-presencas.xlsx`,
  });
}

export function buildAttendanceRows(options: {
  dates: Date[];
  enrollments: ExportEnrollment[];
  records: ExportRecord[];
}): SheetRow[] {
  const { dates, enrollments, records } = options;
  const statusByCell = new Map(
    records.map((record) => [
      `${record.enrollmentId}|${attendanceDayKey(record.session.date)}`,
      record.status,
    ]),
  );
  const dayKeys = dates.map((date) => attendanceDayKey(date));

  return [
    ["Aluno", ...dayKeys],
    ...enrollments.map((enrollment) => [
      enrollment.student.name,
      ...dayKeys.map((dayKey) => {
        const status = statusByCell.get(`${enrollment.id}|${dayKey}`);
        return status ? STATUS_LABELS[status] : "";
      }),
    ]),
  ];
}
