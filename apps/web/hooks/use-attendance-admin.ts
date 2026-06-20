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
