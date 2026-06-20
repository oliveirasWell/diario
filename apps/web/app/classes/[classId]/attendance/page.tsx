"use client";

import { useAttendanceDates, useAttendanceRecords, useEnrollments, useMarkAttendance } from "@/hooks/use-attendance";
import { useClearAttendance } from "@/hooks/use-clear-attendance";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { exportAttendanceToXlsx } from "@/lib/export-attendance";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useExcludeAttendanceDate } from "@/hooks/use-attendance-admin";

const statuses = ["PRESENT", "ABSENT", "LATE"] as const;

type Status = typeof statuses[number];

const LABELS: Record<Status, string> = {
  PRESENT: "✅ P",
  ABSENT: "❌ F",
  LATE: "⏰ A",
};

function toISODate(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data: dates, isLoading: isLoadingDates } = useAttendanceDates(classId);
  const { data: enrollments, isLoading: isLoadingEnroll } = useEnrollments(classId);
  const { data: records } = useAttendanceRecords(classId);
  const mark = useMarkAttendance(classId);
  const clearMut = useClearAttendance(classId);
  const excludeDate = useExcludeAttendanceDate(classId);
  const [hidePast, setHidePast] = useState(false);
  const [q, setQ] = useState("");

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

  const list = useMemo(() => {
    const base = enrollments ?? [];
    const filtered = q ? base.filter((e) => e.student.name.toLowerCase().includes(q.toLowerCase())) : base;
    return filtered.slice().sort((a,b)=>a.student.name.localeCompare(b.student.name));
  }, [enrollments, q]);

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
      {isLoadingDates || isLoadingEnroll ? (
        <div className="text-sm text-muted-foreground">Carregando presenças…</div>
      ) : !dates?.length ? (
        <p className="text-sm text-muted-foreground">Configure os dias da semana e datas de início/fim da turma para gerar as colunas.</p>
      ) : null}
      {dates && dates.length > 0 && enrollments && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Checkbox id="hidePast" checked={hidePast} onCheckedChange={(v)=>setHidePast(Boolean(v))} />
              <Label htmlFor="hidePast">Ocultar datas passadas</Label>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="badge">✅ Presente</span>
              <span className="badge">❌ Falta</span>
              <span className="badge">⏰ Atraso</span>
            </div>
            <Input placeholder="Buscar aluno…" value={q} onChange={(e)=>setQ(e.target.value)} className="w-[40%] min-w-[160px] ml-auto" />
            <button className="px-2 py-1 border rounded text-sm" onClick={onExport} type="button">Exportar XLSX</button>
          </div>
          <div className="overflow-auto scroll-area scroll-snap-x">
            <table className="min-w-full border rounded table-grid">
              <thead>
                <tr>
                  <th className="text-left sticky left-0 bg-background z-20">Aluno</th>
                  {visibleDates.map((d) => (
                    <th key={toISODate(d)} className="whitespace-nowrap text-xs snap-start">
                      <div className="flex items-center gap-2">
                        {d.toLocaleDateString()}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="h-8 w-8 p-0 hidden md:inline-flex items-center justify-center rounded-md border bg-background hover:bg-muted"
                            aria-label="Ações da data"
                          >
                            ⋮
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => enrollments?.forEach((e) => mark.mutate({ date: d, enrollmentId: e.id, status: "PRESENT" }))}>
                              Marcar todos Presente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => excludeDate.mutate({ date: d })} className="text-destructive">
                              Remover dia da lista
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap sticky left-0 bg-background z-10">
                      <div className="flex items-center gap-2">
                        <span>{e.student.name}</span>
                        <button
                          className="btn-icon-xs hidden md:inline-flex"
                          title="Marcar semana toda Presente"
                          onClick={() => {
                            visibleDates.forEach((d) => mark.mutate({ date: d, enrollmentId: e.id, status: "PRESENT" }));
                          }}
                          type="button"
                        >
                          ✅
                        </button>
                      </div>
                    </td>
                    {visibleDates.map((d) => {
                      const dKey = toISODate(d);
                      const current = recMap.get(`${e.id}|${dKey}`);
                      return (
                        <td key={dKey}>
                          <button
                            type="button"
                            className="cell-btn min-w-[104px]"
                            onClick={() => {
                              const order: (Status | null)[] = ["PRESENT","ABSENT","LATE",null];
                              const idx = order.indexOf((current ?? null) as any);
                              const next = order[(idx + 1) % order.length];
                              if (next === null) {
                                clearMut.mutate({ date: d, enrollmentId: e.id });
                              } else {
                                mark.mutate({ date: d, enrollmentId: e.id, status: next });
                              }
                            }}
                          >
                            {current ? LABELS[current] : "—"}
                          </button>
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
