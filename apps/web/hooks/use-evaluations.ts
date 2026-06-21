"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { evaluationsQueryOptions, queryKeys } from "@/lib/query-options";

export type Evaluation = {
  id: string;
  classId: string;
  title: string;
  weight?: number | null;
  maxScore: number;
  createdAt: string;
};

export function useEvaluationsQuery(classId: string) {
  return useQuery(evaluationsQueryOptions(classId));
}

export function useCreateEvaluationMutation(classId: string) {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { title: string }) => {
      const data = await gqlRequest<{ createEvaluation: Evaluation }>(/* GraphQL */ `
        mutation CreateEvaluation($classId: ID!, $title: String!) {
          createEvaluation(classId: $classId, title: $title, maxScore: 10) { id classId title weight maxScore createdAt }
        }
      `, { classId, title: input.title });
      return data.createEvaluation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluations(classId) });
    },
  });
}

export function useDeleteEvaluationMutation(classId: string) {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (id: string) => {
      const data = await gqlRequest<{ deleteEvaluation: boolean }>(/* GraphQL */ `
        mutation DelEval($id: ID!) { deleteEvaluation(id: $id) }
      `, { id });
      return data.deleteEvaluation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluations(classId) });
      qc.invalidateQueries({ queryKey: queryKeys.grades(classId) });
    },
  });
}
