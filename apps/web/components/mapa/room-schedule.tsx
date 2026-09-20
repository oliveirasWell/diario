"use client";

import { useState } from "react";
import {
  useAssignClassGroupMutation,
  useClearLessonCellMutation,
  useSaveLessonCellMutation,
} from "@/hooks/mapa/use-map-mutations";
import { ADD_SECTION_VALUE, gradeOptionsFor, sectionOptionsFor } from "@/lib/mapa/class-options";
import { DAYS, MAP_COPY, PERIODS, SHIFTS } from "@/lib/mapa/constants";
import type { Shift, Weekday } from "@/src/gql/schema";
import { CellEditorDialog } from "./cell-editor-dialog";
import type { MapRoomShift, MapSubject, MapTeacher, OpenCell } from "./types";

type RoomScheduleProps = {
  locationCode: string;
  locationName: string;
  locationId?: string;
  roomShifts: MapRoomShift[];
  subjects: MapSubject[];
  teachers: MapTeacher[];
  initialShift?: string;
};

type ClassGroupSelectsProps = {
  initialGrade: string;
  initialSection: string;
  extraSections: string[];
  canEdit: boolean;
  onComplete: (grade: string, section: string) => void;
  onAddSection: (section: string) => void;
  errorMessage: string | null;
};

const ClassGroupSelects = ({
  initialGrade,
  initialSection,
  extraSections,
  canEdit,
  onComplete,
  onAddSection,
  errorMessage,
}: ClassGroupSelectsProps) => {
  const [grade, setGrade] = useState(initialGrade);
  const [section, setSection] = useState(initialSection);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSection, setNewSection] = useState("");

  const grades = gradeOptionsFor(initialGrade);
  const sections = sectionOptionsFor(extraSections, initialSection);
  const summary = grade && section ? `${grade} ${section}` : MAP_COPY.unassignedClass;

  const applyIfComplete = (nextGrade: string, nextSection: string) => {
    if (!canEdit || !nextGrade || !nextSection || nextSection === ADD_SECTION_VALUE) {
      return;
    }
    onComplete(nextGrade, nextSection);
  };

  const handleAddSection = () => {
    const nextSection = newSection.trim().toUpperCase();
    if (!nextSection) {
      return;
    }
    onAddSection(nextSection);
    setSection(nextSection);
    setIsAddingSection(false);
    setNewSection("");
    applyIfComplete(grade, nextSection);
  };

  return (
    <>
      <div className="mapa-turma-editor">
        <label>
          {MAP_COPY.gradeLabel}:
          <select
            aria-label={MAP_COPY.gradeLabel}
            className="mapa-select"
            value={grade}
            disabled={!canEdit}
            onChange={(event) => {
              const nextGrade = event.target.value;
              setGrade(nextGrade);
              applyIfComplete(nextGrade, section);
            }}
          >
            <option value="">{MAP_COPY.emptySelect}</option>
            {grades.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          {MAP_COPY.sectionLabel}:
          <select
            aria-label={MAP_COPY.sectionLabel}
            className="mapa-select"
            value={isAddingSection ? ADD_SECTION_VALUE : section}
            disabled={!canEdit}
            onChange={(event) => {
              const nextSection = event.target.value;
              if (nextSection === ADD_SECTION_VALUE) {
                setIsAddingSection(true);
                return;
              }
              setIsAddingSection(false);
              setSection(nextSection);
              applyIfComplete(grade, nextSection);
            }}
          >
            <option value="">{MAP_COPY.emptySelect}</option>
            {sections.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={ADD_SECTION_VALUE}>{MAP_COPY.addSection}</option>
          </select>
        </label>
      </div>
      {isAddingSection ? (
        <div className="mapa-inline-add">
          <input
            autoFocus
            className="mapa-input"
            placeholder={MAP_COPY.addSectionPlaceholder}
            value={newSection}
            onChange={(event) => setNewSection(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddSection();
              }
            }}
          />
          <button type="button" onClick={handleAddSection} disabled={!newSection.trim()}>
            {MAP_COPY.addSectionConfirm}
          </button>
        </div>
      ) : null}
      <div className="mapa-turma-label">{MAP_COPY.classSummary(summary)}</div>
      {errorMessage ? (
        <p className="mapa-form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </>
  );
};

/** Shift tabs + grade/section assignment + the weekday x period lesson grid — the reference prototype's `#scheduleContainer`. */
export const RoomSchedule = ({
  locationCode,
  locationName,
  locationId,
  roomShifts,
  subjects,
  teachers,
  initialShift,
}: RoomScheduleProps) => {
  const [currentShift, setCurrentShift] = useState<string>(initialShift ?? SHIFTS[0]?.id ?? "");
  const [openCell, setOpenCell] = useState<OpenCell | null>(null);
  const [extraSections, setExtraSections] = useState<string[]>([]);

  const assignClassGroup = useAssignClassGroupMutation();
  const saveLessonCell = useSaveLessonCellMutation();
  const clearLessonCell = useClearLessonCellMutation();

  const roomShift = roomShifts.find((shift) => shift.shift === currentShift);
  const canEdit = Boolean(locationId);

  const assignClassGroupIfComplete = (nextGrade: string, nextSection: string) => {
    if (!locationId) {
      return;
    }
    assignClassGroup.mutate({
      locationId,
      shift: currentShift as Shift,
      grade: nextGrade,
      section: nextSection,
    });
  };

  const lessonAt = (weekday: string, period: number) =>
    roomShift?.lessons.find((lesson) => lesson.weekday === weekday && lesson.period === period);

  return (
    <div>
      <div className="mapa-turno-tabs">
        {SHIFTS.map((shift) => (
          <button
            key={shift.id}
            type="button"
            className={shift.id === currentShift ? "mapa-turno-tab is-active" : "mapa-turno-tab"}
            onClick={() => setCurrentShift(shift.id)}
          >
            {shift.name}
          </button>
        ))}
      </div>

      <ClassGroupSelects
        key={`${locationCode}:${currentShift}`}
        initialGrade={roomShift?.classGroup?.grade ?? ""}
        initialSection={roomShift?.classGroup?.section ?? ""}
        extraSections={extraSections}
        canEdit={canEdit}
        onComplete={assignClassGroupIfComplete}
        onAddSection={(section) =>
          setExtraSections((current) =>
            current.includes(section) ? current : [...current, section],
          )
        }
        errorMessage={assignClassGroup.errorMessage}
      />

      <div className="mapa-schedule-wrap">
        <table className="mapa-schedule">
          <thead>
            <tr>
              <th>{MAP_COPY.periodHeader}</th>
              {DAYS.map((day) => (
                <th key={day.id}>{day.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((periodLabel, periodIndex) => {
              const period = periodIndex + 1;
              return (
                <tr key={period}>
                  <td>
                    <strong>{periodLabel}</strong>
                  </td>
                  {DAYS.map((day) => {
                    const lesson = lessonAt(day.id, period);
                    return (
                      <td
                        key={day.id}
                        className={lesson ? "mapa-schedule-cell is-filled" : "mapa-schedule-cell"}
                        onClick={() => {
                          if (!canEdit) {
                            return;
                          }
                          setOpenCell({ weekday: day.id, period });
                        }}
                      >
                        {lesson ? (
                          <>
                            <span className="mapa-schedule-subj">{lesson.subject.name}</span>
                            <span className="mapa-schedule-teach">{lesson.teacher.name}</span>
                          </>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openCell && locationId ? (
        <CellEditorDialog
          roomName={locationName}
          weekday={openCell.weekday}
          period={openCell.period}
          lesson={lessonAt(openCell.weekday, openCell.period)}
          subjects={subjects}
          teachers={teachers}
          isSaving={saveLessonCell.isPending}
          isClearing={clearLessonCell.isPending}
          saveError={saveLessonCell.errorMessage}
          clearError={clearLessonCell.errorMessage}
          onSave={({ subjectName, teacherName }) => {
            saveLessonCell.mutate(
              {
                locationId,
                shift: currentShift as Shift,
                weekday: openCell.weekday as Weekday,
                period: openCell.period,
                subjectName,
                teacherName,
              },
              { onSuccess: () => setOpenCell(null) },
            );
          }}
          onClear={() => {
            clearLessonCell.mutate(
              {
                locationId,
                shift: currentShift as Shift,
                weekday: openCell.weekday as Weekday,
                period: openCell.period,
              },
              { onSuccess: () => setOpenCell(null) },
            );
          }}
          onClose={() => setOpenCell(null)}
        />
      ) : null}
    </div>
  );
};
