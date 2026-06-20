"use client";

import { useParams } from "next/navigation";
import { useEvaluationsQuery } from "@/hooks/use-evaluations";
import { useEnrollments } from "@/hooks/use-attendance";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

export default function GradesPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data: evals, isLoading: loadingE } = useEvaluationsQuery(classId);
  const { data: enrolls, isLoading: loadingEn } = useEnrollments(classId);

  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const base = enrolls ?? [];
    const filtered = q ? base.filter((e) => e.student.name.toLowerCase().includes(q.toLowerCase())) : base;
    return filtered.slice().sort((a,b)=>a.student.name.localeCompare(b.student.name));
  }, [enrolls, q]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar aluno…" value={q} onChange={(e)=>setQ(e.target.value)} className="w-[40%] min-w-[160px]" />
      </div>

      {loadingE || loadingEn ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="overflow-auto scroll-area scroll-snap-x">
          <table className="min-w-full border rounded table-grid">
            <thead>
              <tr>
                <th className="text-left sticky left-0 bg-background z-20">Aluno</th>
                {evals?.map((ev) => (
                  <th key={ev.id} className="whitespace-nowrap text-xs snap-start">{ev.title}</th>
                ))}
                <th className="whitespace-nowrap text-xs">Conceito</th>
              </tr>
            </thead>
            <tbody>
              {list?.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap sticky left-0 bg-background z-10">{e.student.name}</td>
                  {evals?.map((ev) => (
                    <td key={ev.id}>
                      <Input type="number" inputMode="decimal" placeholder="—" className="h-10 min-w-[80px]" disabled />
                    </td>
                  ))}
                  <td>
                    <select className="select select-lg min-w-[96px]" disabled defaultValue="">
                      <option value="">—</option>
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                      <option>D</option>
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
