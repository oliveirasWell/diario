"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";

const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

export function useClearAttendance(classId: string) {
  const qc = useQueryClient();
  const key = ["attendanceRecords", classId, undefined, undefined] as const;
  return useMutation({
    mutationFn: async (vars: { date: Date; enrollmentId: string }) => {
      const data = await gqlRequest<{ clearAttendance: boolean }>(/* GraphQL */ `
        mutation ClearAttendance($classId: ID!, $date: DateTime!, $enrollmentId: ID!) {
          clearAttendance(classId: $classId, date: $date, enrollmentId: $enrollmentId)
        }
      `, { classId, date: vars.date, enrollmentId: vars.enrollmentId });
      return data.clearAttendance;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any[]>(key) ?? [];
      const dK = dayKey(vars.date);
      const next = prev.filter(r => !(r.enrollmentId === vars.enrollmentId && dayKey(r.session.date) === dK));
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_e,_v,ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: key }); },
  });
}
