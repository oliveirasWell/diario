"use client";

import {
  useAttendanceDates,
  useAttendanceMutation,
  useAttendanceRecords,
  useEnrollments,
} from "@/hooks/use-attendance";
import { attendanceDayKey } from "@/lib/attendance-date";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { exportAttendanceToXlsx } from "@/lib/export-attendance";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TablePinCell,
  TablePinHead,
  TableRow,
} from "@/components/ui/table";

import { useExcludeAttendanceDate } from "@/hooks/use-attendance-admin";
import { formatGraphqlError } from "@/lib/graphql-error";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/hooks/use-attendance";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "✅ P",
  ABSENT: "❌ F",
  LATE: "⏰ A",
};

const STATUS_CLASS: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-500/15 hover:bg-green-500/25",
  ABSENT: "bg-red-500/15 hover:bg-red-500/25",
  LATE: "bg-orange-500/15 hover:bg-orange-500/25",
};

export default function AttendancePage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data: dates, isLoading: isLoadingDates, isError: errorDates, error: errDates } = useAttendanceDates(classId);
  const { data: enrollments, isLoading: isLoadingEnroll, isError: errorEnroll, error: errEnroll } = useEnrollments(classId);
  const { data: records, isError: errorRecords, error: errRecords } = useAttendanceRecords(classId);
  const attendance = useAttendanceMutation(classId);
  const excludeDate = useExcludeAttendanceDate(classId);
  const [hidePast, setHidePast] = useState(false);
  const [q, setQ] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const todayKey = attendanceDayKey(new Date());
  const visibleDates = useMemo(() => {
    if (!dates) return [] as Date[];
    if (!hidePast) return dates;
    return dates.filter((d) => attendanceDayKey(d) >= todayKey);
  }, [dates, hidePast, todayKey]);

  const recMap = useMemo(() => {
    const m = new Map<string, AttendanceStatus>();
    if (!records) return m;
    for (const r of records) {
      m.set(`${r.enrollmentId}|${attendanceDayKey(r.session.date)}`, r.status);
    }
    return m;
  }, [records]);

  const list = useMemo(() => {
    const base = enrollments ?? [];
    const filtered = q ? base.filter((e) => e.student.name.toLowerCase().includes(q.toLowerCase())) : base;
    return filtered.slice().sort((a, b) => a.student.name.localeCompare(b.student.name));
  }, [enrollments, q]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const todayCol = container.querySelector<HTMLElement>('[data-today="true"]');
    const pinCol = container.querySelector<HTMLElement>("[data-table-pin]");
    if (!todayCol || !pinCol) return;
    requestAnimationFrame(() => {
      container.scrollLeft = Math.max(0, todayCol.offsetLeft - pinCol.offsetWidth);
    });
  }, [todayKey, visibleDates, list.length, hidePast]);

  const onExport = () => {
    if (!dates || !enrollments) return;
    exportAttendanceToXlsx({
      className: String(classId),
      dates: visibleDates,
      enrollments,
      records: records ?? [],
    });
  };

  const queryError = errorDates ? errDates : errorEnroll ? errEnroll : errorRecords ? errRecords : null;
  const mutationError = attendance.errorMessage ?? excludeDate.errorMessage;

  return (
    <div className="space-y-4">
      {queryError ? (
        <p className="text-sm text-destructive" role="alert">{formatGraphqlError(queryError)}</p>
      ) : null}
      {mutationError ? (
        <p className="text-sm text-destructive" role="alert">{mutationError}</p>
      ) : null}
      {isLoadingDates || isLoadingEnroll ? (
        <div className="text-sm text-muted-foreground">Carregando presenças…</div>
      ) : !dates?.length ? (
        <p className="text-sm text-muted-foreground">Configure os dias da semana e datas de início/fim da turma para gerar as colunas.</p>
      ) : null}
      {dates && dates.length > 0 && enrollments && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Checkbox id="hidePast" checked={hidePast} onCheckedChange={(v) => setHidePast(Boolean(v))} />
              <Label htmlFor="hidePast">Ocultar datas passadas</Label>
            </div>
            <div className="hidden items-center gap-2 text-xs sm:flex">
              <span className="inline-flex items-center bg-green-500/15 px-2 py-0.5 text-xs">✅ Presente</span>
              <span className="inline-flex items-center bg-red-500/15 px-2 py-0.5 text-xs">❌ Falta</span>
              <span className="inline-flex items-center bg-orange-500/15 px-2 py-0.5 text-xs">⏰ Atraso</span>
            </div>
            <Input placeholder="Buscar aluno…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-[160px] flex-1 sm:max-w-xs" />
            <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={onExport}>
              Exportar XLSX
            </Button>
          </div>
          <TableContainer ref={containerRef}>
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TablePinHead>Aluno</TablePinHead>
                  {visibleDates.map((d) => {
                    const dKey = attendanceDayKey(d);
                    const isToday = dKey === todayKey;
                    return (
                      <TableHead
                        key={dKey}
                        data-today={isToday ? "true" : undefined}
                        className={cn("text-center", isToday && "bg-primary/10")}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {d.toLocaleDateString()}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="hidden shrink-0 bg-muted/15 hover:bg-muted/25 md:inline-flex"
                                  aria-label="Ações da data"
                                />
                              }
                            >
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => attendance.markAllPresent(d)}>
                                Marcar todos Presente
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => excludeDate.mutate({ date: d })} className="text-destructive">
                                Remover dia da lista
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((e) => (
                  <TableRow key={e.id}>
                    <TablePinCell>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{e.student.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="hidden shrink-0 md:inline-flex"
                          title="Marcar semana toda Presente"
                          onClick={() => {
                            visibleDates.forEach((d) =>
                              attendance.markPresent({ date: d, enrollmentId: e.id })
                            );
                          }}
                        >
                          ✅
                        </Button>
                      </div>
                    </TablePinCell>
                    {visibleDates.map((d) => {
                      const dKey = attendanceDayKey(d);
                      const current = recMap.get(`${e.id}|${dKey}`);
                      const isToday = dKey === todayKey;
                      return (
                        <TableCell
                          key={dKey}
                          data-today={isToday ? "true" : undefined}
                          className={cn("text-center px-1", isToday && "bg-primary/10")}
                        >
                          <button
                            type="button"
                            className={cn(
                              "mx-auto flex h-11 w-full min-w-[104px] items-center justify-center text-sm font-normal transition-colors",
                              current ? STATUS_CLASS[current] : "hover:bg-muted/40"
                            )}
                            onClick={() => attendance.cycle(current, { date: d, enrollmentId: e.id })}
                          >
                            {current ? STATUS_LABEL[current] : "—"}
                          </button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </div>
  );
}
