"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { attendanceDayKey, normalizeAttendanceDate } from "@/lib/attendance-date";
import {
  attendanceBoardQueryOptions,
  enrollmentsQueryOptions,
  queryKeys,
  type AttendanceBoard,
  type AttendanceRecord,
} from "@/lib/query-options";
import { AttendanceStatus } from "@/src/gql/schema";
import { MarkAttendanceDocument, MarkPresentDocument } from "@/src/gql/graphql";

export type { AttendanceBoard, AttendanceRecord };
export { AttendanceStatus };

const STATUS_CYCLE: (AttendanceStatus | null)[] = [
  AttendanceStatus.Present,
  AttendanceStatus.Absent,
  AttendanceStatus.Late,
  null,
];

const nextStatus = (current?: AttendanceStatus | null) => {
  const index = STATUS_CYCLE.indexOf(current ?? null);
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
};

const isCellFor = (record: AttendanceRecord, enrollmentId: string, dayKey: string) => {
  return record.enrollmentId === enrollmentId && attendanceDayKey(record.session.date) === dayKey;
};

const withAttendanceStatus = (
  records: AttendanceRecord[],
  enrollmentId: string,
  date: Date,
  status: AttendanceStatus | null,
): AttendanceRecord[] => {
  const dayKey = attendanceDayKey(date);

  if (status === null) {
    return records.filter((record) => !isCellFor(record, enrollmentId, dayKey));
  }

  const index = records.findIndex((record) => isCellFor(record, enrollmentId, dayKey));
  if (index >= 0) {
    const updated = records.slice();
    updated[index] = { ...updated[index], status };
    return updated;
  }

  return [
    ...records,
    {
      id: `optimistic-${enrollmentId}-${dayKey}`,
      enrollmentId,
      status,
      session: {
        id: `optimistic-session-${dayKey}`,
        date: normalizeAttendanceDate(date).toISOString(),
      },
    },
  ];
};

const markPresentInRecords = (
  records: AttendanceRecord[],
  enrollmentIds: string[],
  dates: Date[],
): AttendanceRecord[] => {
  return dates.reduce(
    (afterDates, date) =>
      enrollmentIds.reduce(
        (afterEnrollments, enrollmentId) =>
          withAttendanceStatus(afterEnrollments, enrollmentId, date, AttendanceStatus.Present),
        afterDates,
      ),
    records,
  );
};

type CellTarget = { date: Date; enrollmentId: string };
type MarkAttendanceInput = CellTarget & { status: AttendanceStatus | null };
type MarkPresentInput = { dates: Date[]; enrollmentIds?: string[] };
type BoardSnapshot = { previousBoard?: AttendanceBoard };

export const useAttendanceMutation = (classId: string) => {
  const queryClient = useQueryClient();
  const boardQueryKey = queryKeys.attendanceBoard(classId);

  const applyOptimisticBoard = async (
    update: (board: AttendanceBoard) => AttendanceBoard,
  ): Promise<BoardSnapshot> => {
    await queryClient.cancelQueries({ queryKey: boardQueryKey });
    const previousBoard = queryClient.getQueryData<AttendanceBoard>(boardQueryKey);
    if (previousBoard) {
      queryClient.setQueryData(boardQueryKey, update(previousBoard));
    }
    return { previousBoard };
  };

  const rollbackBoard = (_error: unknown, _variables: unknown, snapshot?: BoardSnapshot) => {
    if (snapshot?.previousBoard) {
      queryClient.setQueryData(boardQueryKey, snapshot.previousBoard);
    }
  };

  const markAttendance = useAppMutation({
    mutationFn: async ({ enrollmentId, date, status }: MarkAttendanceInput) => {
      const data = await gqlRequest(MarkAttendanceDocument, {
        classId,
        date: normalizeAttendanceDate(date).toISOString(),
        enrollmentId,
        status,
      });
      return data.markAttendance;
    },
    onMutate: ({ enrollmentId, date, status }) =>
      applyOptimisticBoard((board) => ({
        ...board,
        attendanceRecords: withAttendanceStatus(
          board.attendanceRecords,
          enrollmentId,
          date,
          status,
        ),
      })),
    onError: rollbackBoard,
  });

  const markPresent = useAppMutation({
    mutationFn: async ({ dates, enrollmentIds }: MarkPresentInput) => {
      const data = await gqlRequest(MarkPresentDocument, {
        classId,
        dates: dates.map((date) => normalizeAttendanceDate(date).toISOString()),
        enrollmentIds,
      });
      return data.markPresent;
    },
    onMutate: ({ dates, enrollmentIds }) =>
      applyOptimisticBoard((board) => ({
        ...board,
        attendanceRecords: markPresentInRecords(
          board.attendanceRecords,
          enrollmentIds ?? board.enrollments.map((enrollment) => enrollment.id),
          dates,
        ),
      })),
    onError: rollbackBoard,
  });

  const mutations = [markAttendance, markPresent];

  return {
    cycleStatus: (current: AttendanceStatus | undefined, target: CellTarget) =>
      markAttendance.mutate({ ...target, status: nextStatus(current) }),
    markPresent: (input: MarkPresentInput) => markPresent.mutate(input),
    errorMessage: mutations.find((mutation) => mutation.errorMessage)?.errorMessage ?? null,
    clearError: () => mutations.forEach((mutation) => mutation.clearError()),
  };
};

export const useAttendanceBoard = (classId: string, from?: string, to?: string) => {
  return useQuery(attendanceBoardQueryOptions(classId, from, to));
};

export const useEnrollments = (classId: string) => {
  return useQuery(enrollmentsQueryOptions(classId));
};
