"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { attendanceDayKey, normalizeAttendanceDate } from "@/lib/attendance-date";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export type AttendanceRecord = {
  id: string;
  enrollmentId: string;
  status: AttendanceStatus;
  session: { id: string; date: string };
};

export function attendanceRecordsKey(classId: string) {
  return ["attendanceRecords", classId] as const;
}

const CYCLE: (AttendanceStatus | null)[] = ["PRESENT", "ABSENT", "LATE", null];

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

  const mutation = useMutation({
    mutationFn: async ({ enrollmentId, date, status }: MutationVars) => {
      const data = await gqlRequest<{ markAttendance: boolean }>(/* GraphQL */ `
        mutation MarkAttendance($classId: ID!, $date: DateTime!, $enrollmentId: ID!, $status: AttendanceStatus) {
          markAttendance(classId: $classId, date: $date, enrollmentId: $enrollmentId, status: $status)
        }
      `, {
        classId,
        date: normalizeAttendanceDate(date),
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

  const markAllMutation = useMutation({
    mutationFn: async ({ date }: { date: Date }) => {
      const data = await gqlRequest<{ markAllPresent: boolean }>(/* GraphQL */ `
        mutation MarkAllPresent($classId: ID!, $date: DateTime!) {
          markAllPresent(classId: $classId, date: $date)
        }
      `, { classId, date: normalizeAttendanceDate(date) });
      return data.markAllPresent;
    },
    onMutate: async ({ date }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<AttendanceRecord[]>(key) ?? [];
      const enrollments = qc.getQueryData<{ id: string }[]>(["enrollments", classId]) ?? [];
      let next = prev;
      for (const en of enrollments) {
        next = patchAttendanceRecords(next, en.id, date, "PRESENT");
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
      mutation.mutate({ ...vars, status: "PRESENT" }),
    markAllPresent: (date: Date) => markAllMutation.mutate({ date }),
  };
}

export function useAttendanceDates(classId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["attendanceDates", classId, from, to],
    queryFn: async () => {
      const data = await gqlRequest<{ attendanceDates: string[] }>(/* GraphQL */ `
        query AttendanceDates($classId: ID!, $from: DateTime, $to: DateTime) {
          attendanceDates(classId: $classId, from: $from, to: $to)
        }
      `, { classId, from, to });
      return data.attendanceDates.map((d) => new Date(d));
    },
    enabled: !!classId,
  });
}

export function useEnrollments(classId: string) {
  return useQuery({
    queryKey: ["enrollments", classId],
    queryFn: async () => {
      const data = await gqlRequest<{ enrollments: { id: string; concept?: string | null; student: { id: string; name: string } }[] }>(/* GraphQL */ `
        query Enrollments($classId: ID!) {
          enrollments(classId: $classId) { id concept student { id name } }
        }
      `, { classId });
      return data.enrollments;
    },
    enabled: !!classId,
    staleTime: 30_000,
  });
}

export function useAttendanceRecords(classId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: attendanceRecordsKey(classId),
    queryFn: async () => {
      const data = await gqlRequest<{ attendanceRecords: AttendanceRecord[] }>(/* GraphQL */ `
        query AttendanceRecords($classId: ID!, $from: DateTime, $to: DateTime) {
          attendanceRecords(classId: $classId, from: $from, to: $to) {
            id enrollmentId status session { id date }
          }
        }
      `, { classId, from, to });
      return data.attendanceRecords;
    },
    enabled: !!classId,
  });
}
