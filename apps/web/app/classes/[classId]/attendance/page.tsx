"use client";

import { useAttendanceDates, useEnrollments, useMarkAttendance } from "@/hooks/use-attendance";
import { useParams } from "next/navigation";

const statuses = ["PRESENT", "ABSENT", "LATE"] as const;

type Status = typeof statuses[number];

export default function AttendancePage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data: dates } = useAttendanceDates(classId);
  const { data: enrollments } = useEnrollments(classId);
  const mark = useMarkAttendance(classId);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Presenças</h2>
      {!dates?.length ? (
        <p className="text-sm text-muted-foreground">Configure os dias da semana e datas de início/fim da turma para gerar as colunas.</p>
      ) : null}
      {dates && enrollments && (
        <div className="overflow-auto">
          <table className="min-w-full border rounded">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left border">Aluno</th>
                {dates.map((d) => (
                  <th key={d.toISOString()} className="px-2 py-1 border whitespace-nowrap text-xs">
                    {d.toLocaleDateString()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id}>
                  <td className="px-2 py-1 border whitespace-nowrap">{e.student.name}</td>
                  {dates.map((d) => (
                    <td key={d.toISOString()} className="px-2 py-1 border">
                      <select
                        className="border rounded px-1 py-0.5 text-xs bg-background"
                        defaultValue=""
                        onChange={(ev) => {
                          const val = ev.target.value as Status | "";
                          if (!val) return;
                          mark.mutate({ date: d, enrollmentId: e.id, status: val });
                        }}
                      >
                        <option value="">—</option>
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
