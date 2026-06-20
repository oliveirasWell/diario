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
      const data = await gqlRequest<{ enrollments: { id: string; student: { id: string; name: string } }[] }>(/* GraphQL */ `
        query Enrollments($classId: ID!) {
          enrollments(classId: $classId) { id student { id name } }
        }
      `, { classId });
      return data.enrollments;
    },
    enabled: !!classId,
  });
}

export function useMarkAttendance(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { date: Date; enrollmentId: string; status: AttendanceStatus }) => {
      const data = await gqlRequest<{ markAttendance: boolean }>(/* GraphQL */ `
        mutation MarkAttendance($classId: ID!, $date: DateTime!, $enrollmentId: ID!, $status: AttendanceStatus!) {
          markAttendance(classId: $classId, date: $date, enrollmentId: $enrollmentId, status: $status)
        }
      `, { classId, date: vars.date, enrollmentId: vars.enrollmentId, status: vars.status });
      return data.markAttendance;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendanceRecords", classId] });
    },
  });
}
