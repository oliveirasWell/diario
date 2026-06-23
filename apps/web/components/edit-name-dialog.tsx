"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EditNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  initialName: string;
  label?: string;
  onSave: (name: string) => void | Promise<void>;
  isPending?: boolean;
  errorMessage?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function EditNameDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName,
  label = "Nome",
  onSave,
  isPending = false,
  errorMessage,
  confirmLabel = "Salvar",
  cancelLabel = "Cancelar",
}: EditNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError("Nome é obrigatório");
      return;
    }
    setValidationError(null);
    await onSave(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="edit-name-input">
            {label}
          </label>
          <Input
            id="edit-name-input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (validationError) {
                setValidationError(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSave();
              }
            }}
          />
          {validationError && (
            <p className="text-sm text-red-600" role="alert">
              {validationError}
            </p>
          )}
        </div>
        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isPending}>
            {isPending ? "Salvando…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
