"use client";

import { useParams } from "next/navigation";
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
import { averageScore, scoreOutOfTen } from "@/lib/grade-average";

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

function scoreForRow(
  row: { grades: { evaluationId: string; score: number }[] },
  evaluationId: string,
) {
  return row.grades.find((g) => g.evaluationId === evaluationId)?.score;
}

export default function GradesPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { evaluations, rows, isLoading, isError, error } = useGradesByClass(classId);
  const upsert = useUpsertGrade();
  const setConcept = useSetConcept();

  const mutationError = upsert.errorMessage ?? setConcept.errorMessage;

  const [q, setQ] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const list = useMemo(() => {
    const base = rows ?? [];
    const filtered = q
      ? base.filter((row) => row.student.name.toLowerCase().includes(q.toLowerCase()))
      : base;
    return sortByStudentName(filtered, sortDir);
  }, [rows, q, sortDir]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {isError && error && (
        <p className="text-sm text-destructive" role="alert">
          {formatGraphqlError(error)}
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
            if (!evaluations || !rows) {
              return;
            }
            exportGradesToXlsx({
              className: String(classId),
              evaluations: evaluations.map((ev) => ({
                id: ev.id,
                title: ev.title,
                maxScore: ev.maxScore ?? 10,
              })),
              rows: list,
            });
          }}
        >
          Exportar XLSX
        </Button>
      </div>

      {isLoading ? (
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
                {evaluations?.map((ev) => (
                  <TableHead key={ev.id}>{ev.title}</TableHead>
                ))}
                <TableHead>Média</TableHead>
                <TableHead>Conceito</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.enrollmentId}>
                  <TablePinCell>
                    <span className="block w-40 truncate" title={row.student.name}>
                      {row.student.name}
                    </span>
                  </TablePinCell>
                  {evaluations?.map((ev) => (
                    <TableCell key={ev.id}>
                      <GradeInput
                        score={scoreForRow(row, ev.id)}
                        maxScore={ev.maxScore ?? 10}
                        onSave={(num) =>
                          upsert.mutate({
                            classId,
                            enrollmentId: row.enrollmentId,
                            evaluationId: ev.id,
                            score: num,
                          })
                        }
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    {(() => {
                      const average = averageScore(
                        (evaluations ?? []).flatMap((ev) => {
                          const score = scoreForRow(row, ev.id);
                          return score == null ? [] : [scoreOutOfTen(score, ev.maxScore ?? 10)];
                        }),
                      );
                      return (
                        <div className="min-w-[64px] text-sm">
                          {average != null ? average.toFixed(1) : "—"}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-10 min-w-[96px] bg-muted/40 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      value={row.concept ?? ""}
                      onChange={(evn) =>
                        setConcept.mutate({
                          classId,
                          enrollmentId: row.enrollmentId,
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
