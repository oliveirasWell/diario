"use client";

import { useState } from "react";
import { DAYS, MAP_COPY, PERIODS } from "@/lib/mapa/constants";
import { useCreateSubjectMutation } from "@/hooks/mapa/use-map-mutations";
import type { MapLesson, MapSubject, MapTeacher } from "./types";

const ADD_SUBJECT_VALUE = "__add__";

type CellEditorDialogProps = {
  roomName: string;
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
  roomName,
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

  const dayLabel = DAYS.find((day) => day.id === weekday)?.name ?? weekday;
  const periodLabel = PERIODS[period - 1] ?? String(period);

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
  const busy = isSaving || isClearing;

  return (
    <div
      className="mapa-overlay mapa-cell-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="mapa-cell-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mapa-cell-title"
      >
        <h2 id="mapa-cell-title">{MAP_COPY.cellTitle(roomName, dayLabel, periodLabel)}</h2>
        <label htmlFor="cell-subject">{MAP_COPY.subjectLabel}</label>
        <select
          id="cell-subject"
          className="mapa-select"
          value={isAddingSubject ? ADD_SUBJECT_VALUE : subjectId}
          onChange={(event) => {
            if (event.target.value === ADD_SUBJECT_VALUE) {
              setIsAddingSubject(true);
              setSubjectId("");
            } else {
              setIsAddingSubject(false);
              setSubjectId(event.target.value);
            }
          }}
        >
          <option value="" disabled>
            {MAP_COPY.selectSubject}
          </option>
          {availableSubjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
          <option value={ADD_SUBJECT_VALUE}>+ {MAP_COPY.addSubject}</option>
        </select>

        {isAddingSubject ? (
          <div className="mapa-inline-add">
            <input
              autoFocus
              className="mapa-input"
              placeholder={MAP_COPY.addSubjectPlaceholder}
              value={newSubjectName}
              onChange={(event) => setNewSubjectName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddSubject();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddSubject}
              disabled={createSubject.isPending || !newSubjectName.trim()}
            >
              {MAP_COPY.addSubjectConfirm}
            </button>
          </div>
        ) : null}
        {createSubject.errorMessage ? (
          <p className="mapa-form-error" role="alert">
            {createSubject.errorMessage}
          </p>
        ) : null}

        <label htmlFor="cell-teacher">{MAP_COPY.teacherLabel}</label>
        <input
          id="cell-teacher"
          className="mapa-input"
          list="mapa-teacher-options"
          placeholder={MAP_COPY.teacherPlaceholder}
          value={teacherName}
          onChange={(event) => setTeacherName(event.target.value)}
        />
        <datalist id="mapa-teacher-options">
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.name} />
          ))}
        </datalist>

        {(saveError || clearError) && (
          <p className="mapa-form-error" role="alert">
            {saveError || clearError}
          </p>
        )}

        <div className="mapa-cell-actions">
          <button
            type="button"
            className="mapa-cell-save"
            disabled={!canSave || busy}
            onClick={() => {
              if (!selectedSubjectName) {
                return;
              }
              onSave({ subjectName: selectedSubjectName, teacherName: teacherName.trim() });
            }}
          >
            {MAP_COPY.saveLesson}
          </button>
          {lesson ? (
            <button type="button" className="mapa-cell-clear" onClick={onClear} disabled={busy}>
              {MAP_COPY.clearLesson}
            </button>
          ) : null}
        </div>
        <button type="button" className="mapa-cell-cancel" onClick={onClose} disabled={busy}>
          {MAP_COPY.cancelLesson}
        </button>
      </div>
    </div>
  );
};
