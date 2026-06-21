"use client";

import { useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { queryKeys } from "@/lib/query-options";
import { ExDocument } from "@/src/gql/graphql";

export function useExcludeAttendanceDate(classId: string) {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (vars: { date: Date }) => {
      const data = await gqlRequest(ExDocument, { classId, date: vars.date });
      return data.excludeAttendanceDate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendanceDates(classId) });
      qc.invalidateQueries({ queryKey: queryKeys.attendanceRecords(classId) });
    },
  });
}
