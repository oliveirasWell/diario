"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { attendanceDayKey, normalizeAttendanceDate } from "@/lib/attendance-date";
import {
  attendanceDatesQueryOptions,
  attendanceRecordsQueryOptions,
  enrollmentsQueryOptions,
  queryKeys,
  type AttendanceRecord,
} from "@/lib/query-options";
import { AttendanceStatus } from "@/src/gql/schema";
import {
  MarkAllPresentDocument,
  MarkAttendanceDocument,
  MarkEnrollmentPresentForDatesDocument,
} from "@/src/gql/graphql";

export type { AttendanceRecord };
export { AttendanceStatus };

export function attendanceRecordsKey(classId: string) {
  return queryKeys.attendanceRecords(classId);
}

const STATUS_CYCLE: (AttendanceStatus | null)[] = [
  AttendanceStatus.Present,
  AttendanceStatus.Absent,
  AttendanceStatus.Late,
  null,
];

function nextStatus(current?: AttendanceStatus | null) {
  const index = STATUS_CYCLE.indexOf(current ?? null);
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
}

function isCellFor(record: AttendanceRecord, enrollmentId: string, dayKey: string) {
  return record.enrollmentId === enrollmentId && attendanceDayKey(record.session.date) === dayKey;
}

function withAttendanceStatus(
  records: AttendanceRecord[],
  enrollmentId: string,
  date: Date,
  status: AttendanceStatus | null,
): AttendanceRecord[] {
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
}

function markEnrollmentsPresent(
  records: AttendanceRecord[],
  enrollmentIds: string[],
  date: Date,
): AttendanceRecord[] {
  return enrollmentIds.reduce(
    (updated, enrollmentId) =>
      withAttendanceStatus(updated, enrollmentId, date, AttendanceStatus.Present),
    records,
  );
}

function markDatesPresent(
  records: AttendanceRecord[],
  enrollmentId: string,
  dates: Date[],
): AttendanceRecord[] {
  return dates.reduce(
    (updated, date) => withAttendanceStatus(updated, enrollmentId, date, AttendanceStatus.Present),
    records,
  );
}

type CellTarget = { date: Date; enrollmentId: string };
type MarkAttendanceInput = CellTarget & { status: AttendanceStatus | null };
type BulkPresentInput = { dates: Date[]; enrollmentId: string };
type RecordsSnapshot = { previousRecords: AttendanceRecord[] };

export function useAttendanceMutation(classId: string) {
  const queryClient = useQueryClient();
  const recordsQueryKey = attendanceRecordsKey(classId);

  const applyOptimisticRecords = async (
    update: (records: AttendanceRecord[]) => AttendanceRecord[],
  ): Promise<RecordsSnapshot> => {
    await queryClient.cancelQueries({ queryKey: recordsQueryKey });
    const previousRecords = queryClient.getQueryData<AttendanceRecord[]>(recordsQueryKey) ?? [];
    queryClient.setQueryData(recordsQueryKey, update(previousRecords));
    return { previousRecords };
  };

  const rollbackRecords = (_error: unknown, _variables: unknown, snapshot?: RecordsSnapshot) => {
    if (snapshot) {
      queryClient.setQueryData(recordsQueryKey, snapshot.previousRecords);
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
      applyOptimisticRecords((records) =>
        withAttendanceStatus(records, enrollmentId, date, status),
      ),
    onError: rollbackRecords,
  });

  const markAllPresent = useAppMutation({
    mutationFn: async ({ date }: { date: Date }) => {
      const data = await gqlRequest(MarkAllPresentDocument, {
        classId,
        date: normalizeAttendanceDate(date).toISOString(),
      });
      return data.markAllPresent;
    },
    onMutate: ({ date }) => {
      const enrollments =
        queryClient.getQueryData<{ id: string }[]>(queryKeys.enrollments(classId)) ?? [];
      return applyOptimisticRecords((records) =>
        markEnrollmentsPresent(
          records,
          enrollments.map((enrollment) => enrollment.id),
          date,
        ),
      );
    },
    onError: rollbackRecords,
  });

  const markPresentForDates = useAppMutation({
    mutationFn: async ({ dates, enrollmentId }: BulkPresentInput) => {
      const data = await gqlRequest(MarkEnrollmentPresentForDatesDocument, {
        classId,
        enrollmentId,
        dates: dates.map((date) => normalizeAttendanceDate(date).toISOString()),
      });
      return data.markEnrollmentPresentForDates;
    },
    onMutate: ({ dates, enrollmentId }) =>
      applyOptimisticRecords((records) => markDatesPresent(records, enrollmentId, dates)),
    onError: rollbackRecords,
  });

  const mutations = [markAttendance, markAllPresent, markPresentForDates];

  return {
    cycleStatus: (current: AttendanceStatus | undefined, target: CellTarget) =>
      markAttendance.mutate({ ...target, status: nextStatus(current) }),
    markEnrollmentPresentForDates: (input: BulkPresentInput) => markPresentForDates.mutate(input),
    markAllPresent: (date: Date) => markAllPresent.mutate({ date }),
    errorMessage: mutations.find((mutation) => mutation.errorMessage)?.errorMessage ?? null,
    clearError: () => mutations.forEach((mutation) => mutation.clearError()),
  };
}

export function useAttendanceDates(classId: string, from?: string, to?: string) {
  return useQuery(attendanceDatesQueryOptions(classId, from, to));
}

export function useEnrollments(classId: string) {
  return useQuery(enrollmentsQueryOptions(classId));
}

export function useAttendanceRecords(classId: string, from?: string, to?: string) {
  return useQuery(attendanceRecordsQueryOptions(classId, from, to));
}
