"use client";

import { useRouter } from "next/navigation";
import { useClassInviteInfoQuery, useAcceptInviteMutation } from "@/hooks/use-classes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatGraphqlError } from "@/lib/graphql-error";

export function InviteClient({ classId }: { classId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useClassInviteInfoQuery(classId);
  const acceptInvite = useAcceptInviteMutation();
  const open = true;

  const handleAccept = async () => {
    try {
      await acceptInvite.mutateAsync(classId);
      router.push("/classes");
    } catch {
      // errorMessage shown inline
    }
  };

  const handleDecline = () => {
    router.push("/classes");
  };

  if (isLoading) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>;
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-sm text-destructive">{formatGraphqlError(error)}</div>
    );
  }

  if (!data) {
    return null;
  }

  // ponytail: dialog is always open; decline navigates away. Simple enough.
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          handleDecline();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Convite</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {data.ownerName ?? "Um usuário"} te convidou para administrar a turma &ldquo;{data.name}
          &rdquo;. Deseja aceitar?
        </DialogDescription>
        {acceptInvite.errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {acceptInvite.errorMessage}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleDecline}>
            Recusar
          </Button>
          <Button type="button" onClick={handleAccept} disabled={acceptInvite.isPending}>
            {acceptInvite.isPending ? "Aceitando…" : "Aceitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
