"use client";

import { useParams } from "next/navigation";
import { useEvaluationsQuery, useCreateEvaluationMutation } from "@/hooks/use-evaluations";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({ title: z.string().min(1, "Informe um título") });

type FormValues = z.infer<typeof schema>;

export default function EvaluationsPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data, isLoading } = useEvaluationsQuery(classId);
  const createEval = useCreateEvaluationMutation(classId);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (vals: FormValues) => {
    await createEval.mutateAsync({ title: vals.title });
    reset({ title: "" });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium">Nova avaliação</label>
            <Input placeholder="Ex.: Prova 1" {...register("title")} />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting || createEval.isPending}>Adicionar</Button>
        </form>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="overflow-auto scroll-area">
          <table className="min-w-full border rounded table-grid">
            <thead>
              <tr>
                <th className="text-left">Título</th>
                <th className="text-left">Criada em</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.title}</td>
                  <td>{new Date(ev.createdAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    <button
                      className="btn-icon-xs"
                      title="Remover avaliação"
                      onClick={async () => {
                        if (!confirm("Remover esta avaliação e suas notas?")) return;
                        await fetch('/api/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `mutation DelEval($id: ID!) { deleteEvaluation(id: $id) }`, variables: { id: ev.id } }) });
                        location.reload();
                      }}
                    >
                      🗑️
                    </button>
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
