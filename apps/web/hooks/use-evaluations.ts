"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { evaluationsQueryOptions, queryKeys } from "@/lib/query-options";
import {
  CreateEvaluationDocument,
  DelEvalDocument,
  RenameEvaluationDocument,
} from "@/src/gql/graphql";
import type { Evaluation } from "@/src/gql/schema";

export type { Evaluation };

export function useEvaluationsQuery(classId: string) {
  return useQuery(evaluationsQueryOptions(classId));
}

export function useCreateEvaluationMutation(classId: string) {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { title: string }) => {
      const data = await gqlRequest(CreateEvaluationDocument, { classId, title: input.title });
      return data.createEvaluation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluations(classId) });
    },
  });
}

export const useRenameEvaluationMutation = (classId: string) => {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { id: string; title: string }) => {
      const data = await gqlRequest(RenameEvaluationDocument, input);
      return data.renameEvaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluations(classId) });
    },
  });
};

export function useDeleteEvaluationMutation(classId: string) {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (id: string) => {
      const data = await gqlRequest(DelEvalDocument, { id });
      return data.deleteEvaluation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.evaluations(classId) });
      qc.invalidateQueries({ queryKey: queryKeys.grades(classId) });
    },
  });
}
