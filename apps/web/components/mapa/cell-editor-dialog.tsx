"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAYS, PERIODS } from "@/lib/mapa/constants";
import { useCreateSubjectMutation } from "@/hooks/mapa/use-map-mutations";
import { NATIVE_SELECT_CLASS_NAME } from "./constants";
import type { MapLesson, MapSubject, MapTeacher } from "./types";

const ADD_SUBJECT_VALUE = "__add__";

type CellEditorDialogProps = {
  weekday: string;
  period: number;
  lesson: MapLesson | undefined;
  subjects: MapSubject[];
  teachers: MapTeacher[];
  onSave: (input: { subjectName: string; teacherName: string }) => void;
  onClear: () => void;
  onClose: () => void;
  isSaving: boolean;
  isClearing: boolean;
  saveError: string | null;
  clearError: string | null;
};

export const CellEditorDialog = ({
  weekday,
  period,
  lesson,
  subjects,
  teachers,
  onSave,
  onClear,
  onClose,
  isSaving,
  isClearing,
  saveError,
  clearError,
}: CellEditorDialogProps) => {
  const [subjectId, setSubjectId] = useState(lesson?.subject.id ?? "");
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [justCreatedSubject, setJustCreatedSubject] = useState<MapSubject | null>(null);
  const [teacherName, setTeacherName] = useState(lesson?.teacher.name ?? "");

  const createSubject = useCreateSubjectMutation();

  const dayLabel = DAYS.find((day) => day.id === weekday)?.full ?? weekday;
  const periodLabel = PERIODS[period - 1] ?? String(period);

  // The lesson's current subject may not be in `subjects` if it was renamed/removed
  // elsewhere, and a subject just created inline isn't in `subjects` yet either — the
  // mapData refetch triggered by createSubject hasn't landed. Both are added locally so
  // Salvar doesn't sit disabled while waiting on the network.
  const availableSubjects = [
    ...subjects,
    ...(lesson && !subjects.some((subject) => subject.id === lesson.subject.id)
      ? [lesson.subject]
      : []),
    ...(justCreatedSubject && !subjects.some((subject) => subject.id === justCreatedSubject.id)
      ? [justCreatedSubject]
      : []),
  ];

  const handleAddSubject = () => {
    const name = newSubjectName.trim();
    if (!name) {
      return;
    }
    createSubject.mutate(
      { name },
      {
        onSuccess: (subject) => {
          setJustCreatedSubject(subject);
          setSubjectId(subject.id);
          setIsAddingSubject(false);
          setNewSubjectName("");
        },
      },
    );
  };

  const selectedSubjectName = availableSubjects.find((subject) => subject.id === subjectId)?.name;
  const canSave = Boolean(selectedSubjectName) && teacherName.trim().length > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dayLabel} · {periodLabel} período
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cell-subject">Disciplina</Label>
            <select
              id="cell-subject"
              className={`w-full ${NATIVE_SELECT_CLASS_NAME}`}
              value={isAddingSubject ? ADD_SUBJECT_VALUE : subjectId}
              onChange={(event) => {
                if (event.target.value === ADD_SUBJECT_VALUE) {
                  setIsAddingSubject(true);
                  // Cleared so a stray Salvar click can't silently save the previously
                  // selected subject instead of the one being typed below.
                  setSubjectId("");
                } else {
                  setIsAddingSubject(false);
                  setSubjectId(event.target.value);
                }
              }}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
              <option value={ADD_SUBJECT_VALUE}>+ Adicionar nova disciplina</option>
            </select>

            {isAddingSubject && (
              <div className="flex gap-1.5">
                <Input
                  autoFocus
                  placeholder="Nome da disciplina"
                  value={newSubjectName}
                  onChange={(event) => setNewSubjectName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddSubject();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddSubject}
                  disabled={createSubject.isPending || !newSubjectName.trim()}
                >
                  Adicionar
                </Button>
              </div>
            )}
            {createSubject.errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {createSubject.errorMessage}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cell-teacher">Professor</Label>
            <Input
              id="cell-teacher"
              list="mapa-teacher-options"
              placeholder="Nome do professor"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
            />
            <datalist id="mapa-teacher-options">
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.name} />
              ))}
            </datalist>
          </div>

          {(saveError || clearError) && (
            <p className="text-sm text-destructive" role="alert">
              {saveError || clearError}
            </p>
          )}
        </div>

        <DialogFooter>
          {lesson && (
            <Button
              type="button"
              variant="destructive"
              onClick={onClear}
              disabled={isSaving || isClearing}
            >
              Limpar
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving || isClearing}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canSave || isSaving || isClearing}
            onClick={() => {
              if (!selectedSubjectName) {
                return;
              }
              onSave({ subjectName: selectedSubjectName, teacherName: teacherName.trim() });
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
