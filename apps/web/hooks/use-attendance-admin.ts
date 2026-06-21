"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";

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
