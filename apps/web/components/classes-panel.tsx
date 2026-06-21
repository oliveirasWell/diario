"use client";

import { useClassesQuery, useCreateClassMutation, useDeleteClassMutation } from "@/hooks/use-classes";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const NewClassSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  year: z.coerce.number().int().min(1900).max(3000),
});

type NewClassInput = z.infer<typeof NewClassSchema>;

export function ClassesPanel() {
  const { data, isLoading } = useClassesQuery();
  const createClass = useCreateClassMutation();
  const deleteClass = useDeleteClassMutation();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NewClassInput>({
    resolver: zodResolver(NewClassSchema),
    defaultValues: { year: new Date().getFullYear() },
  });

  const onSubmit = async (values: NewClassInput) => {
    await createClass.mutateAsync(values);
    reset({ name: "", year: new Date().getFullYear() });
    setOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>Nova turma</Button>
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="bg-muted/25">
          <div className="grid grid-cols-3 bg-muted/50 px-4 py-2 font-normal">
            <div>Nome</div>
            <div>Ano</div>
            <div className="text-right">Ações</div>
          </div>
          {data?.map((c) => (
            <div key={c.id} className="grid grid-cols-3 items-center px-4 py-2 transition-colors hover:bg-muted/40">
              <a href={`/classes/${c.id}`} className="underline-offset-2 hover:underline">{c.name}</a>
              <div>{c.year}</div>
              <div className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Remover turma"
                  onClick={() => {
                    if (confirm("Remover esta turma e todos os dados relacionados?")) deleteClass.mutate(c.id);
                  }}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-3 bg-background p-3 shadow-lg sm:space-y-4 sm:p-6">
            <h3 className="text-lg font-normal">Nova Turma</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Nome</label>
                <Input placeholder="Ex.: 1ºA" {...register("name")} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Ano</label>
                <Input type="number" {...register("year", { valueAsNumber: true })} />
                {errors.year && <p className="text-sm text-red-600">{errors.year.message}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>Criar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
