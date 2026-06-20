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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Alunos</h2>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium">Adicionar aluno à turma</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <input className="w-full border rounded px-3 py-2 bg-background" placeholder="Ex.: Maria Silva" {...register("name")} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Email (opcional)</label>
            <input className="w-full border rounded px-3 py-2 bg-background" placeholder="maria@email.com" {...register("email")} />
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
        <div className="border rounded-lg divide-y">
          <div className="grid grid-cols-3 font-medium px-4 py-2 bg-muted/40">
            <div>Nome</div>
            <div>Email</div>
            <div className="text-right">Ações</div>
          </div>
          {data?.map((e) => (
            <div key={e.id} className="grid grid-cols-3 px-4 py-2 items-center">
              <div>{e.student.name}</div>
              <div className="truncate">{e.student.email || "—"}</div>
              <div className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Remover aluno desta turma?")) unenroll.mutate(e.id);
                  }}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
