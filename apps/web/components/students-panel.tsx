"use client";

import {
  useCreateAndEnrollMutation,
  useEnrollmentsQuery,
  useRenameStudentMutation,
  useUnenrollStudentMutation,
} from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EditNameDialog } from "@/components/edit-name-dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatGraphqlError } from "@/lib/graphql-error";
import { useState } from "react";

const NewStudentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type NewStudentInput = z.infer<typeof NewStudentSchema>;
type EditTarget = { id: string; name: string };

export function StudentsPanel({ classId }: { classId: string }) {
  const { data, isLoading, isError, error } = useEnrollmentsQuery(classId);
  const createAndEnroll = useCreateAndEnrollMutation(classId);
  const unenroll = useUnenrollStudentMutation(classId);
  const renameStudent = useRenameStudentMutation(classId);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [deleteTarget, setDeleteTarget] = useState<EditTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const sorted = data
    ? [...data].sort((a, b) =>
        sortDir === "asc"
          ? a.student.name.localeCompare(b.student.name, undefined, { numeric: true })
          : b.student.name.localeCompare(a.student.name, undefined, { numeric: true }),
      )
    : data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewStudentInput>({
    resolver: zodResolver(NewStudentSchema),
  });

  const onSubmit = async (values: NewStudentInput) => {
    try {
      await createAndEnroll.mutateAsync({ name: values.name, email: values.email || undefined });
      reset({ name: "", email: "" });
    } catch {
      // errorMessage shown inline
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await unenroll.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // errorMessage shown inline
    }
  };

  const onRename = async (name: string) => {
    if (!editTarget) {
      return;
    }
    try {
      await renameStudent.mutateAsync({ enrollmentId: editTarget.id, name });
      setEditTarget(null);
    } catch {
      // errorMessage shown inline
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {isError && (
        <p className="text-sm text-destructive" role="alert">
          {formatGraphqlError(error)}
        </p>
      )}
      <div className="space-y-3 bg-muted/25 p-3 sm:space-y-4 sm:p-4">
        <h3 className="font-normal">Adicionar aluno à turma</h3>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 items-end gap-2 sm:gap-3 md:grid-cols-3"
        >
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
            <Button type="submit" disabled={isSubmitting || createAndEnroll.isPending}>
              Adicionar
            </Button>
          </div>
        </form>
        {createAndEnroll.errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {createAndEnroll.errorMessage}
          </p>
        )}
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="bg-muted/25">
          <div className="grid grid-cols-3 bg-muted/50 px-4 py-2 font-normal">
            <button
              className="inline-flex items-center gap-1 text-left"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            >
              Nome
              {sortDir === "asc" ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            <div>Email</div>
            <div className="text-right">Ações</div>
          </div>
          {sorted?.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-3 items-center px-4 py-2 transition-colors hover:bg-muted/40"
            >
              <div>{e.student.name}</div>
              <div className="truncate">{e.student.email || "—"}</div>
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Editar aluno"
                  onClick={() => setEditTarget({ id: e.id, name: e.student.name })}
                >
                  ✏️
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Remover aluno desta turma"
                  onClick={() => setDeleteTarget({ id: e.id, name: e.student.name })}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditNameDialog
        key={editTarget?.id ?? "closed"}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            renameStudent.clearError();
          }
        }}
        title="Editar aluno"
        initialName={editTarget?.name ?? ""}
        onSave={onRename}
        isPending={renameStudent.isPending}
        errorMessage={renameStudent.errorMessage}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            unenroll.clearError();
          }
        }}
        title="Remover aluno desta turma?"
        description={
          deleteTarget
            ? `O aluno "${deleteTarget.name}" será removido desta turma. Presenças e notas dele nesta turma também serão excluídas.`
            : undefined
        }
        onConfirm={onDelete}
        isPending={unenroll.isPending}
        errorMessage={unenroll.errorMessage}
      />
    </div>
  );
}
