"use client";

import { useCreateAndEnrollMutation, useEnrollmentsQuery, useUnenrollStudentMutation } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <div className="space-y-3 bg-muted/25 p-3 sm:space-y-4 sm:p-4">
        <h3 className="font-normal">Adicionar aluno à turma</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 items-end gap-2 sm:gap-3 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <Input placeholder="Ex.: Maria Silva" {...register("name")} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Email (opcional)</label>
            <Input placeholder="maria@email.com" {...register("email")} />
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
        <div className="bg-muted/25">
          <div className="grid grid-cols-3 bg-muted/50 px-4 py-2 font-normal">
            <div>Nome</div>
            <div>Email</div>
            <div className="text-right">Ações</div>
          </div>
          {data?.map((e) => (
            <div key={e.id} className="grid grid-cols-3 items-center px-4 py-2 transition-colors hover:bg-muted/40">
              <div>{e.student.name}</div>
              <div className="truncate">{e.student.email || "—"}</div>
              <div className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Remover aluno desta turma"
                  onClick={() => {
                    if (confirm("Remover aluno desta turma?")) unenroll.mutate(e.id);
                  }}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
