"use client";

import { useQueryClient } from "@tanstack/react-query";
import { normalizeAttendanceDate } from "@/lib/attendance-date";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { queryKeys } from "@/lib/query-options";
import { ExDocument } from "@/src/gql/graphql";

export const useExcludeAttendanceDate = (classId: string) => {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: async (vars: { date: Date }) => {
      const data = await gqlRequest(ExDocument, {
        classId,
        date: normalizeAttendanceDate(vars.date).toISOString(),
      });
      return data.excludeAttendanceDate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceBoard(classId) });
    },
  });
};
