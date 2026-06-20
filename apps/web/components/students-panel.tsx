"use client";

import { useCreateAndEnrollMutation, useEnrollmentsQuery, useUnenrollStudentMutation } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const NewStudentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type NewStudentInput = z.infer<typeof NewStudentSchema>;

export function StudentsPanel({ classId }: { classId: string }) {
  const { data, isLoading } = useEnrollmentsQuery(classId);
  const createAndEnroll = useCreateAndEnrollMutation(classId);
  const unenroll = useUnenrollStudentMutation(classId);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NewStudentInput>({
    resolver: zodResolver(NewStudentSchema),
  });

  const onSubmit = async (values: NewStudentInput) => {
    await createAndEnroll.mutateAsync({ name: values.name, email: values.email || undefined });
    reset({ name: "", email: "" });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="surface-form">
        <h3 className="font-normal">Adicionar aluno à turma</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 items-end">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <input className="input" placeholder="Ex.: Maria Silva" {...register("name")} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Email (opcional)</label>
            <input className="input" placeholder="maria@email.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || createAndEnroll.isPending}>Adicionar</Button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="surface">
          <div className="grid grid-cols-3 surface-header">
            <div>Nome</div>
            <div>Email</div>
            <div className="text-right">Ações</div>
          </div>
          {data?.map((e) => (
            <div key={e.id} className="grid grid-cols-3 surface-row items-center">
              <div>{e.student.name}</div>
              <div className="truncate">{e.student.email || "—"}</div>
              <div className="text-right">
                <button
                  className="btn-icon-xs"
                  title="Remover aluno desta turma"
                  onClick={() => {
                    if (confirm("Remover aluno desta turma?")) unenroll.mutate(e.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
