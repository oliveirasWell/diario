"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

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
    queryKey: ["attendanceRecords", classId, from, to],
    queryFn: async () => {
      const data = await gqlRequest<{ attendanceRecords: { id: string; enrollmentId: string; status: AttendanceStatus; session: { id: string; date: string } }[] }>(/* GraphQL */ `
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

const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

export function useMarkAttendance(classId: string) {
  const qc = useQueryClient();
  const key = ["attendanceRecords", classId, undefined, undefined] as const;
  return useMutation({
    mutationFn: async (vars: { date: Date; enrollmentId: string; status: AttendanceStatus }) => {
      const data = await gqlRequest<{ markAttendance: boolean }>(/* GraphQL */ `
        mutation MarkAttendance($classId: ID!, $date: DateTime!, $enrollmentId: ID!, $status: AttendanceStatus!) {
          markAttendance(classId: $classId, date: $date, enrollmentId: $enrollmentId, status: $status)
        }
      `, { classId, date: vars.date, enrollmentId: vars.enrollmentId, status: vars.status });
      return data.markAttendance;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<typeof key extends any ? any[] : never>(key) as any[] | undefined;
      const next = (prev ?? []).slice();
      const dK = dayKey(vars.date);
      const idx = next.findIndex((r) => r.enrollmentId === vars.enrollmentId && dayKey(r.session.date) === dK);
      if (idx >= 0) next[idx] = { ...next[idx], status: vars.status };
      else next.push({ id: `optimistic-${vars.enrollmentId}-${dK}`, enrollmentId: vars.enrollmentId, status: vars.status, session: { id: `optimistic-session-${dK}`, date: new Date(vars.date).toISOString() } });
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
