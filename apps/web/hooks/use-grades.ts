"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { gradesQueryOptions, queryKeys } from "@/lib/query-options";
import { SetConceptDocument, UpsertGradeDocument } from "@/src/gql/graphql";
import type { ClassGradeRow, Grade } from "@/src/gql/schema";

export type { ClassGradeRow, Grade };

export function useGradesByClass(classId: string) {
  const query = useQuery(gradesQueryOptions(classId));
  return {
    ...query,
    evaluations: query.data?.evaluations,
    rows: query.data?.rows,
  };
}

export function useUpsertGrade() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (vars: { enrollmentId: string; evaluationId: string; score: number; classId: string }) => {
      const data = await gqlRequest(UpsertGradeDocument, {
        enrollmentId: vars.enrollmentId,
        evaluationId: vars.evaluationId,
        score: vars.score,
      });
      return data.upsertGrade;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.grades(vars.classId) });
    },
  });
}

export function useSetConcept() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (vars: { enrollmentId: string; concept: string | null; classId: string }) => {
      const data = await gqlRequest(SetConceptDocument, {
        enrollmentId: vars.enrollmentId,
        concept: vars.concept,
      });
      return data.setEnrollmentConcept;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.grades(vars.classId) });
      qc.invalidateQueries({ queryKey: queryKeys.enrollments(vars.classId) });
    },
  });
}
