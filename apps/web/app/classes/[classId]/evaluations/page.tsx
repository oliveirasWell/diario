"use client";

import { useParams } from "next/navigation";
import { useEvaluationsQuery, useCreateEvaluationMutation, useDeleteEvaluationMutation } from "@/hooks/use-evaluations";
import { formatGraphqlError } from "@/lib/graphql-error";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const schema = z.object({ title: z.string().min(1, "Informe um título") });

type FormValues = z.infer<typeof schema>;

export default function EvaluationsPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data, isLoading, isError, error } = useEvaluationsQuery(classId);
  const createEval = useCreateEvaluationMutation(classId);
  const deleteEval = useDeleteEvaluationMutation(classId);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (vals: FormValues) => {
    try {
      await createEval.mutateAsync({ title: vals.title });
      reset({ title: "" });
    } catch {
      // errorMessage shown inline
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {isError ? (
        <p className="text-sm text-destructive" role="alert">{formatGraphqlError(error)}</p>
      ) : null}

      <div className="space-y-3 bg-muted/25 p-3 sm:space-y-4 sm:p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium">Nova avaliação</label>
            <Input placeholder="Ex.: Prova 1" {...register("title")} />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting || createEval.isPending}>Adicionar</Button>
        </form>
        {createEval.errorMessage ? (
          <p className="text-sm text-destructive" role="alert">{createEval.errorMessage}</p>
        ) : null}
      </div>

      {deleteEval.errorMessage ? (
        <p className="text-sm text-destructive" role="alert">{deleteEval.errorMessage}</p>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell>{ev.title}</TableCell>
                  <TableCell>{new Date(ev.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Remover avaliação"
                      onClick={async () => {
                        if (!confirm("Remover esta avaliação e suas notas?")) return;
                        try {
                          await deleteEval.mutateAsync(ev.id);
                        } catch {
                          // errorMessage shown inline
                        }
                      }}
                    >
                      🗑️
                    </Button>
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
