"use client";

import { useClassesQuery, useCreateClassMutation } from "@/hooks/use-classes";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const NewClassSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  year: z.coerce.number().int().min(1900).max(3000),
});

type NewClassInput = z.infer<typeof NewClassSchema>;

export function ClassesPanel() {
  const { data, isLoading } = useClassesQuery();
  const createClass = useCreateClassMutation();
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Turmas</h2>
        <Button onClick={() => setOpen(true)}>Nova turma</Button>
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="border rounded-lg divide-y">
          <div className="grid grid-cols-2 font-medium px-4 py-2 bg-muted/40">
            <div>Nome</div>
            <div>Ano</div>
          </div>
          {data?.map((c) => (
            <a key={c.id} href={`/classes/${c.id}`} className="grid grid-cols-2 px-4 py-2 hover:bg-muted/50 transition-colors">
              <div className="underline-offset-2 hover:underline">{c.name}</div>
              <div>{c.year}</div>
            </a>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow w-full max-w-md p-3 sm:p-6 space-y-3 sm:space-y-4">
            <h3 className="text-lg font-semibold">Nova Turma</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Nome</label>
                <input className="input" placeholder="Ex.: 1ºA" {...register("name")} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Ano</label>
                <input type="number" className="input" {...register("year", { valueAsNumber: true })} />
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
