"use client";

import { useAttendanceDates, useAttendanceRecords, useEnrollments, useMarkAttendance } from "@/hooks/use-attendance";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { exportAttendanceToXlsx } from "@/lib/export-attendance";

const statuses = ["PRESENT", "ABSENT", "LATE"] as const;

type Status = typeof statuses[number];

const LABELS: Record<Status, string> = {
  PRESENT: "✅ Presente",
  ABSENT: "❌ Falta",
  LATE: "⏰ Atraso",
};

function toISODate(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data: dates } = useAttendanceDates(classId);
  const { data: enrollments } = useEnrollments(classId);
  const { data: records } = useAttendanceRecords(classId);
  const mark = useMarkAttendance(classId);
  const [hidePast, setHidePast] = useState(false);

  const todayKey = toISODate(new Date());
  const visibleDates = useMemo(() => {
    if (!dates) return [] as Date[];
    if (!hidePast) return dates;
    return dates.filter((d) => toISODate(d) >= todayKey);
  }, [dates, hidePast, todayKey]);

  const recMap = useMemo(() => {
    const m = new Map<string, Status>();
    if (!records) return m;
    for (const r of records) m.set(`${r.enrollmentId}|${toISODate(new Date(r.session.date))}`, r.status as Status);
    return m;
  }, [records]);

  const onExport = () => {
    if (!dates || !enrollments) return;
    exportAttendanceToXlsx({
      className: String(classId),
      dates: visibleDates,
      enrollments,
      records: records ?? [],
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Presenças</h2>
      {!dates?.length ? (
        <p className="text-sm text-muted-foreground">Configure os dias da semana e datas de início/fim da turma para gerar as colunas.</p>
      ) : null}
      {dates && enrollments && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hidePast} onChange={(e) => setHidePast(e.target.checked)} />
              Ocultar datas passadas
            </label>
            <button className="px-2 py-1 border rounded text-sm" onClick={onExport} type="button">Exportar XLSX</button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full border rounded">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left border sticky left-0 bg-background z-20">Aluno</th>
                  {visibleDates.map((d) => (
                    <th key={toISODate(d)} className="px-2 py-1 border whitespace-nowrap text-xs">
                      {d.toLocaleDateString()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="px-2 py-1 border whitespace-nowrap sticky left-0 bg-background z-10">{e.student.name}</td>
                    {visibleDates.map((d) => {
                      const dKey = toISODate(d);
                      const current = recMap.get(`${e.id}|${dKey}`);
                      return (
                        <td key={dKey} className="px-2 py-1 border">
                          <select
                            className="border rounded px-1 py-0.5 text-xs bg-background"
                            value={current || ""}
                            onChange={(ev) => {
                              const val = ev.target.value as Status | "";
                              if (!val) return;
                              mark.mutate({ date: d, enrollmentId: e.id, status: val });
                            }}
                          >
                            <option value="">—</option>
                            {statuses.map((s) => (
                              <option key={s} value={s}>{LABELS[s]}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
