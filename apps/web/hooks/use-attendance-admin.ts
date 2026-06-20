"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";

export function useDeleteAttendanceSession(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { date: Date }) => {
      const data = await gqlRequest<{ deleteAttendanceSession: boolean }>(/* GraphQL */ `
        mutation DelSess($classId: ID!, $date: DateTime!) {
          deleteAttendanceSession(classId: $classId, date: $date)
        }
      `, { classId, date: vars.date });
      return data.deleteAttendanceSession;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendanceDates", classId] });
      qc.invalidateQueries({ queryKey: ["attendanceRecords", classId] });
    },
  });
}

export function useExcludeAttendanceDate(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { date: Date }) => {
      const data = await gqlRequest<{ excludeAttendanceDate: boolean }>(/* GraphQL */ `
        mutation Ex($classId: ID!, $date: DateTime!) {
          excludeAttendanceDate(classId: $classId, date: $date)
        }
      `, { classId, date: vars.date });
      return data.excludeAttendanceDate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendanceDates", classId] });
      qc.invalidateQueries({ queryKey: ["attendanceRecords", classId] });
    },
  });
}

export function useIncludeAttendanceDate(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { date: Date }) => {
      const data = await gqlRequest<{ includeAttendanceDate: boolean }>(/* GraphQL */ `
        mutation In($classId: ID!, $date: DateTime!) {
          includeAttendanceDate(classId: $classId, date: $date)
        }
      `, { classId, date: vars.date });
      return data.includeAttendanceDate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendanceDates", classId] });
      qc.invalidateQueries({ queryKey: ["attendanceRecords", classId] });
    },
  });
}
