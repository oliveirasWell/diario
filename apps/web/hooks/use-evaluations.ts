"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";

export type Evaluation = {
  id: string;
  classId: string;
  title: string;
  weight?: number | null;
  maxScore: number;
  createdAt: string;
};

export function useEvaluationsQuery(classId: string) {
  return useQuery({
    queryKey: ["evaluations", classId],
    queryFn: async () => {
      const data = await gqlRequest<{ evaluations: Evaluation[] }>(/* GraphQL */ `
        query Evaluations($classId: ID!) { evaluations(classId: $classId) { id classId title weight maxScore createdAt } }
      `, { classId });
      return data.evaluations;
    },
    enabled: !!classId,
  });
}

export function useCreateEvaluationMutation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string }) => {
      const data = await gqlRequest<{ createEvaluation: Evaluation }>(/* GraphQL */ `
        mutation CreateEvaluation($classId: ID!, $title: String!) {
          createEvaluation(classId: $classId, title: $title, maxScore: 10) { id classId title weight maxScore createdAt }
        }
      `, { classId, title: input.title });
      return data.createEvaluation;
    },
    onSuccess: () => {
      useQueryClient().invalidateQueries({ queryKey: ["evaluations", classId] });
    },
  });
}

export function useDeleteEvaluationMutation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await gqlRequest<{ deleteEvaluation: boolean }>(/* GraphQL */ `
        mutation DelEval($id: ID!) { deleteEvaluation(id: $id) }
      `, { id });
      return data.deleteEvaluation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evaluations", classId] });
      qc.invalidateQueries({ queryKey: ["grades", classId] });
    },
  });
}
