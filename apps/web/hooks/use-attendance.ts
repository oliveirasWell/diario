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
import { MarkAllPresentDocument, MarkAttendanceDocument } from "@/src/gql/graphql";

export type { AttendanceRecord };
export { AttendanceStatus };

export function attendanceRecordsKey(classId: string) {
  return queryKeys.attendanceRecords(classId);
}

const CYCLE: (AttendanceStatus | null)[] = [
  AttendanceStatus.Present,
  AttendanceStatus.Absent,
  AttendanceStatus.Late,
  null,
];

function nextStatus(current?: AttendanceStatus | null) {
  const idx = CYCLE.indexOf(current ?? null);
  return CYCLE[(idx + 1) % CYCLE.length];
}

function patchAttendanceRecords(
  records: AttendanceRecord[],
  enrollmentId: string,
  date: Date,
  status: AttendanceStatus | null
): AttendanceRecord[] {
  const dK = attendanceDayKey(date);
  const sessionDate = normalizeAttendanceDate(date).toISOString();
  if (status === null) {
    return records.filter(
      (r) => !(r.enrollmentId === enrollmentId && attendanceDayKey(r.session.date) === dK)
    );
  }
  const idx = records.findIndex(
    (r) => r.enrollmentId === enrollmentId && attendanceDayKey(r.session.date) === dK
  );
  if (idx >= 0) {
    const next = records.slice();
    next[idx] = { ...next[idx], status };
    return next;
  }
  return [
    ...records,
    {
      id: `optimistic-${enrollmentId}-${dK}`,
      enrollmentId,
      status,
      session: { id: `optimistic-session-${dK}`, date: sessionDate },
    },
  ];
}

type CellVars = { date: Date; enrollmentId: string };
type MutationVars = CellVars & { status: AttendanceStatus | null };
type MutationCtx = { prev: AttendanceRecord[]; key: ReturnType<typeof attendanceRecordsKey> };

export function useAttendanceMutation(classId: string) {
  const qc = useQueryClient();
  const key = attendanceRecordsKey(classId);

  const mutation = useAppMutation({
    mutationFn: async ({ enrollmentId, date, status }: MutationVars) => {
      const data = await gqlRequest(MarkAttendanceDocument, {
        classId,
        date: normalizeAttendanceDate(date).toISOString(),
        enrollmentId,
        status,
      });
      return data.markAttendance;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<AttendanceRecord[]>(key) ?? [];
      qc.setQueryData(key, patchAttendanceRecords(prev, vars.enrollmentId, vars.date, vars.status));
      return { prev, key } satisfies MutationCtx;
    },
    onError: (_err, _vars, ctx?: MutationCtx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
    },
  });

  const markAllMutation = useAppMutation({
    mutationFn: async ({ date }: { date: Date }) => {
      const data = await gqlRequest(MarkAllPresentDocument, {
        classId,
        date: normalizeAttendanceDate(date).toISOString(),
      });
      return data.markAllPresent;
    },
    onMutate: async ({ date }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<AttendanceRecord[]>(key) ?? [];
      const enrollments = qc.getQueryData<{ id: string }[]>(queryKeys.enrollments(classId)) ?? [];
      let next = prev;
      for (const en of enrollments) {
        next = patchAttendanceRecords(next, en.id, date, AttendanceStatus.Present);
      }
      qc.setQueryData(key, next);
      return { prev, key } satisfies MutationCtx;
    },
    onError: (_err, _vars, ctx?: MutationCtx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
    },
  });

  return {
    cycle: (current: AttendanceStatus | undefined, vars: CellVars) =>
      mutation.mutate({ ...vars, status: nextStatus(current) }),
    markPresent: (vars: CellVars) =>
      mutation.mutate({ ...vars, status: AttendanceStatus.Present }),
    markAllPresent: (date: Date) => markAllMutation.mutate({ date }),
    errorMessage: mutation.errorMessage ?? markAllMutation.errorMessage,
    clearError: () => {
      mutation.clearError();
      markAllMutation.clearError();
    },
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
