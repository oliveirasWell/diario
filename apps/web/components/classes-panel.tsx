"use client";

import { useClassesQuery, useCreateClassMutation, useDeleteClassMutation, useRenameClassMutation } from "@/hooks/use-classes";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EditNameDialog } from "@/components/edit-name-dialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatGraphqlError } from "@/lib/graphql-error";
import { enrollmentsQueryOptions } from "@/lib/query-options";

const NewClassSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  year: z.number().int().min(1900).max(3000),
});

type NewClassInput = z.infer<typeof NewClassSchema>;

type DeleteTarget = { id: string; name: string };

type EditTarget = { id: string; name: string };

export function ClassesPanel() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useClassesQuery();
  const createClass = useCreateClassMutation();
  const deleteClass = useDeleteClassMutation();
  const renameClass = useRenameClassMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NewClassInput>({
    resolver: zodResolver(NewClassSchema),
    defaultValues: { year: new Date().getFullYear() },
  });

  const onSubmit = async (values: NewClassInput) => {
    try {
      await createClass.mutateAsync(values);
      reset({ name: "", year: new Date().getFullYear() });
      setCreateOpen(false);
    } catch {
      // errorMessage shown inline
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClass.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // errorMessage shown inline
    }
  };

  const onRename = async (name: string) => {
    if (!editTarget) return;
    try {
      await renameClass.mutateAsync({ id: editTarget.id, name });
      setEditTarget(null);
    } catch {
      // errorMessage shown inline
    }
  };

  const prefetchClass = (classId: string) => {
    void qc.prefetchQuery(enrollmentsQueryOptions(classId));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>Nova turma</Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive" role="alert">{formatGraphqlError(error)}</p>
      )}

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
              <a
                href={`/classes/${c.id}`}
                className="underline-offset-2 hover:underline"
                onMouseEnter={() => prefetchClass(c.id)}
                onFocus={() => prefetchClass(c.id)}
              >
                {c.name}
              </a>
              <div>{c.year}</div>
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Editar turma"
                  onClick={() => setEditTarget({ id: c.id, name: c.name })}
                >
                  ✏️
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Remover turma"
                  onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) createClass.clearError();
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Nova turma</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="class-name">Nome</label>
              <Input id="class-name" placeholder="Ex.: 1ºA" {...register("name")} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="class-year">Ano</label>
              <Input id="class-year" type="number" {...register("year", { valueAsNumber: true })} />
              {errors.year && <p className="text-sm text-red-600">{errors.year.message}</p>}
            </div>
            {createClass.errorMessage && (
              <p className="text-sm text-destructive" role="alert">{createClass.errorMessage}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || createClass.isPending}>
                {createClass.isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EditNameDialog
        key={editTarget?.id ?? "closed"}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            renameClass.clearError();
          }
        }}
        title="Editar turma"
        initialName={editTarget?.name ?? ""}
        onSave={onRename}
        isPending={renameClass.isPending}
        errorMessage={renameClass.errorMessage}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            deleteClass.clearError();
          }
        }}
        title="Remover turma?"
        description={
          deleteTarget
            ? `A turma "${deleteTarget.name}" e todos os dados relacionados (alunos, presenças, notas) serão removidos permanentemente.`
            : undefined
        }
        onConfirm={onDelete}
        isPending={deleteClass.isPending}
        errorMessage={deleteClass.errorMessage}
      />
    </div>
  );
}
