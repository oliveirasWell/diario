"use client";

import { useParams } from "next/navigation";
import { useEvaluationsQuery } from "@/hooks/use-evaluations";
import { useEnrollments } from "@/hooks/use-attendance";
import { useGradesByClass, useSetConcept, useUpsertGrade } from "@/hooks/use-grades";
import { formatGraphqlError } from "@/lib/graphql-error";
import { sortByStudentName } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { exportGradesToXlsx } from "@/lib/export-grades";

function GradeInput({
  score,
  maxScore,
  onSave,
}: {
  score: number | undefined;
  maxScore: number;
  onSave: (score: number) => void;
}) {
  const [value, setValue] = useState(() => (score != null ? String(score) : ""));

  useEffect(() => {
    setValue(score != null ? String(score) : "");
  }, [score]);

  return (
    <Input
      type="number"
      inputMode="decimal"
      step="0.1"
      min={0}
      max={maxScore}
      className="h-10 min-w-[84px]"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const v = value.trim();
        if (v === "") {
          return;
        }
        const num = Number(v);
        if (Number.isNaN(num)) {
          return;
        }
        onSave(num);
      }}
    />
  );
}

export default function GradesPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const {
    data: evals,
    isLoading: loadingE,
    isError: errorE,
    error: errE,
  } = useEvaluationsQuery(classId);
  const {
    data: enrolls,
    isLoading: loadingEn,
    isError: errorEn,
    error: errEn,
  } = useEnrollments(classId);
  const { data: grades, isError: errorG, error: errG } = useGradesByClass(classId);
  const upsert = useUpsertGrade();
  const setConcept = useSetConcept();

  const queryError = errorE ? errE : errorEn ? errEn : errorG ? errG : null;
  const mutationError = upsert.errorMessage ?? setConcept.errorMessage;

  const [q, setQ] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const list = useMemo(() => {
    const base = enrolls ?? [];
    const filtered = q
      ? base.filter((e) => e.student.name.toLowerCase().includes(q.toLowerCase()))
      : base;
    return sortByStudentName(filtered, sortDir);
  }, [enrolls, q, sortDir]);

  const gradeIndex = useMemo(() => {
    const m = new Map<string, number>();
    (grades ?? []).forEach((g) => m.set(`${g.enrollmentId}|${g.evaluationId}`, g.score));
    return m;
  }, [grades]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {queryError && (
        <p className="text-sm text-destructive" role="alert">
          {formatGraphqlError(queryError)}
        </p>
      )}
      {mutationError && (
        <p className="text-sm text-destructive" role="alert">
          {mutationError}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar aluno…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-[40%] min-w-[160px]"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={() => {
            if (!evals || !enrolls) {
              return;
            }
            exportGradesToXlsx({
              className: String(classId),
              evaluations: evals.map((ev) => ({
                id: ev.id,
                title: ev.title,
                maxScore: ev.maxScore ?? 10,
              })),
              enrollments: (list ?? []).map((e) => ({
                id: e.id,
                student: { id: e.student.id, name: e.student.name },
                concept: (e as any).concept ?? null,
              })),
              grades: (grades ?? []).map((g) => ({
                enrollmentId: g.enrollmentId,
                evaluationId: g.evaluationId,
                score: g.score,
              })),
            });
          }}
        >
          Exportar XLSX
        </Button>
      </div>

      {loadingE || loadingEn ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <TableContainer>
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TablePinHead>
                  <button
                    className="inline-flex items-center gap-1"
                    onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  >
                    Aluno
                    {sortDir === "asc" ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>
                </TablePinHead>
                {evals?.map((ev) => (
                  <TableHead key={ev.id}>{ev.title}</TableHead>
                ))}
                <TableHead>Média</TableHead>
                <TableHead>Conceito</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list?.map((e) => (
                <TableRow key={e.id}>
                  <TablePinCell>{e.student.name}</TablePinCell>
                  {evals?.map((ev) => (
                    <TableCell key={ev.id}>
                      <GradeInput
                        score={gradeIndex.get(`${e.id}|${ev.id}`)}
                        maxScore={ev.maxScore ?? 10}
                        onSave={(num) =>
                          upsert.mutate({
                            classId,
                            enrollmentId: e.id,
                            evaluationId: ev.id,
                            score: num,
                          })
                        }
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    {(() => {
                      const scores = (evals ?? [])
                        .map((ev) => {
                          const s = gradeIndex.get(`${e.id}|${ev.id}`);
                          if (s == null) {
                            return null;
                          }
                          const max = ev.maxScore ?? 10;
                          return (s / max) * 10;
                        })
                        .filter((v): v is number => v != null);
                      const avg = scores.length
                        ? scores.reduce((a, b) => a + b, 0) / scores.length
                        : null;
                      return (
                        <div className="min-w-[64px] text-sm">
                          {avg != null ? avg.toFixed(1) : "—"}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-10 min-w-[96px] bg-muted/40 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      value={(e as { concept?: string | null }).concept ?? ""}
                      onChange={(evn) =>
                        setConcept.mutate({
                          classId,
                          enrollmentId: e.id,
                          concept: evn.currentTarget.value || null,
                        })
                      }
                    >
                      <option value="">—</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
