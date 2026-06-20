"use client";

import { useParams } from "next/navigation";
import { useEvaluationsQuery } from "@/hooks/use-evaluations";
import { useEnrollments } from "@/hooks/use-attendance";
import { useGradesByClass, useSetConcept, useUpsertGrade } from "@/hooks/use-grades";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { exportGradesToXlsx } from "@/lib/export-grades";

export default function GradesPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data: evals, isLoading: loadingE } = useEvaluationsQuery(classId);
  const { data: enrolls, isLoading: loadingEn } = useEnrollments(classId);
  const { data: grades } = useGradesByClass(classId);
  const upsert = useUpsertGrade();
  const setConcept = useSetConcept();

  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const base = enrolls ?? [];
    const filtered = q ? base.filter((e) => e.student.name.toLowerCase().includes(q.toLowerCase())) : base;
    return filtered.slice().sort((a,b)=>a.student.name.localeCompare(b.student.name));
  }, [enrolls, q]);

  const gradeIndex = useMemo(() => {
    const m = new Map<string, number>();
    (grades ?? []).forEach(g => m.set(`${g.enrollmentId}|${g.evaluationId}`, g.score));
    return m;
  }, [grades]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar aluno…" value={q} onChange={(e)=>setQ(e.target.value)} className="w-[40%] min-w-[160px]" />
        <button
          type="button"
          className="px-2 py-1 text-sm bg-muted/60 hover:bg-muted ml-auto"
          onClick={() => {
            if (!evals || !enrolls) return;
            exportGradesToXlsx({
              className: String(classId),
              evaluations: evals.map(ev => ({ id: ev.id, title: ev.title, maxScore: ev.maxScore ?? 10 })),
              enrollments: (list ?? []).map(e => ({ id: e.id, student: { id: e.student.id, name: e.student.name }, concept: (e as any).concept ?? null })),
              grades: (grades ?? []).map(g => ({ enrollmentId: g.enrollmentId, evaluationId: g.evaluationId, score: g.score })),
            });
          }}
        >
          Exportar XLSX
        </button>
      </div>

      {loadingE || loadingEn ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="overflow-auto scroll-area scroll-snap-x">
          <table className="min-w-full table-grid">
            <thead>
              <tr>
                <th className="text-left sticky left-0 bg-background z-20">Aluno</th>
                {evals?.map((ev) => (
                  <th key={ev.id} className="whitespace-nowrap text-xs snap-start">{ev.title}</th>
                ))}
                <th className="whitespace-nowrap text-xs">Média</th>
                <th className="whitespace-nowrap text-xs">Conceito</th>
              </tr>
            </thead>
            <tbody>
              {list?.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap sticky left-0 bg-background z-10">{e.student.name}</td>
                  {evals?.map((ev) => (
                    <td key={ev.id}>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min={0}
                        max={ev.maxScore ?? 10}
                        className="input h-10 min-w-[84px]"
                        defaultValue={gradeIndex.get(`${e.id}|${ev.id}`) ?? ""}
                        onBlur={(evn) => {
                          const v = evn.currentTarget.value.trim();
                          if (v === "") return;
                          const num = Number(v);
                          if (Number.isNaN(num)) return;
                          upsert.mutate({ classId, enrollmentId: e.id, evaluationId: ev.id, score: num });
                        }}
                      />
                    </td>
                  ))}
                  <td>
                    {(() => {
                      const scores = (evals ?? []).map(ev => {
                        const s = gradeIndex.get(`${e.id}|${ev.id}`);
                        if (s == null) return null;
                        const max = ev.maxScore ?? 10;
                        return (s / max) * 10;
                      }).filter((v): v is number => v != null);
                      const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length) : null;
                      return <div className="min-w-[64px] text-sm">{avg != null ? avg.toFixed(1) : "—"}</div>;
                    })()}
                  </td>
                  <td>
                    <select
                      className="select select-lg min-w-[96px]"
                      defaultValue={(e as any).concept ?? ""}
                      onChange={(evn) => setConcept.mutate({ classId, enrollmentId: e.id, concept: evn.currentTarget.value || null })}
                    >
                      <option value="">—</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
