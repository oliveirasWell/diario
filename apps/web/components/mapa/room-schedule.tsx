"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useAssignClassGroupMutation,
  useClearLessonCellMutation,
  useSaveLessonCellMutation,
} from "@/hooks/mapa/use-map-mutations";
import { DAYS, GRADE_OPTIONS, PERIODS, SECTION_OPTIONS, SHIFTS } from "@/lib/mapa/constants";
import { cn } from "@/lib/utils";
import type { Shift, Weekday } from "@/src/gql/schema";
import { CellEditorDialog } from "./cell-editor-dialog";
import { NATIVE_SELECT_CLASS_NAME } from "./constants";
import type { MapRoomShift, MapSubject, MapTeacher } from "./types";

type RoomScheduleProps = {
  locationId: string;
  roomShifts: MapRoomShift[];
  subjects: MapSubject[];
  teachers: MapTeacher[];
};

type OpenCell = { weekday: string; period: number };

/** Shift tabs + grade/section assignment + the weekday x period lesson grid — the reference prototype's `#scheduleContainer`. */
export const RoomSchedule = ({ locationId, roomShifts, subjects, teachers }: RoomScheduleProps) => {
  const [currentShift, setCurrentShift] = useState<string>(SHIFTS[0].id);
  const [openCell, setOpenCell] = useState<OpenCell | null>(null);

  const assignClassGroup = useAssignClassGroupMutation();
  const saveLessonCell = useSaveLessonCellMutation();
  const clearLessonCell = useClearLessonCellMutation();

  const roomShift = roomShifts.find((shift) => shift.shift === currentShift);
  const grade = roomShift?.classGroup?.grade ?? "";
  const section = roomShift?.classGroup?.section ?? "";

  const assignClassGroupIfComplete = (nextGrade: string, nextSection: string) => {
    if (!nextGrade || !nextSection) {
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
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {SHIFTS.map((shift) => (
          <Button
            key={shift.id}
            type="button"
            size="sm"
            variant={shift.id === currentShift ? "default" : "outline"}
            onClick={() => setCurrentShift(shift.id)}
          >
            {shift.name}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Série"
          className={NATIVE_SELECT_CLASS_NAME}
          value={grade}
          onChange={(event) => assignClassGroupIfComplete(event.target.value, section)}
        >
          <option value="" disabled>
            Série
          </option>
          {GRADE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          aria-label="Turma"
          className={NATIVE_SELECT_CLASS_NAME}
          value={section}
          onChange={(event) => assignClassGroupIfComplete(grade, event.target.value)}
        >
          <option value="" disabled>
            Turma
          </option>
          {SECTION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {grade && section && (
          <span className="text-sm text-muted-foreground">
            Turma: {grade} {section}
          </span>
        )}
        {assignClassGroup.errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {assignClassGroup.errorMessage}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-border p-1" />
              {DAYS.map((day) => (
                <th key={day.id} className="border border-border p-1 font-normal">
                  {day.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((periodLabel, periodIndex) => {
              const period = periodIndex + 1;
              return (
                <tr key={period}>
                  <td className="border border-border p-1 text-center font-normal">
                    {periodLabel}
                  </td>
                  {DAYS.map((day) => {
                    const lesson = lessonAt(day.id, period);
                    return (
                      <td
                        key={day.id}
                        className={cn(
                          "cursor-pointer border border-border p-1 text-center align-middle hover:bg-muted/40",
                          lesson && "bg-muted/60",
                        )}
                        onClick={() => setOpenCell({ weekday: day.id, period })}
                      >
                        {lesson ? (
                          <span className="block leading-tight">
                            {lesson.subject.name}
                            <br />
                            <span className="text-muted-foreground">{lesson.teacher.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">+</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openCell && (
        <CellEditorDialog
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
      )}
    </div>
  );
};
