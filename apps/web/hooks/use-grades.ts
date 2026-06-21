"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";

export type Grade = { id: string; enrollmentId: string; evaluationId: string; score: number };

export function useGradesByClass(classId: string) {
  return useQuery({
    queryKey: ["grades", classId],
    queryFn: async () => {
      const data = await gqlRequest<{ gradesByClass: Grade[] }>(/* GraphQL */ `
        query GradesByClass($classId: ID!) { gradesByClass(classId: $classId) { id enrollmentId evaluationId score } }
      `, { classId });
      return data.gradesByClass;
    },
    enabled: !!classId,
  });
}

export function useUpsertGrade() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (vars: { enrollmentId: string; evaluationId: string; score: number; classId: string }) => {
      const data = await gqlRequest<{ upsertGrade: Grade }>(/* GraphQL */ `
        mutation UpsertGrade($enrollmentId: ID!, $evaluationId: ID!, $score: Float!) {
          upsertGrade(enrollmentId: $enrollmentId, evaluationId: $evaluationId, score: $score) { id enrollmentId evaluationId score }
        }
      `, vars);
      return data.upsertGrade;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["grades", vars.classId] });
    },
  });
}

export function useSetConcept() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (vars: { enrollmentId: string; concept: string | null; classId: string }) => {
      const data = await gqlRequest<{ setEnrollmentConcept: { id: string } }>(/* GraphQL */ `
        mutation SetConcept($enrollmentId: ID!, $concept: String) {
          setEnrollmentConcept(enrollmentId: $enrollmentId, concept: $concept) { id }
        }
      `, vars);
      return data.setEnrollmentConcept;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["enrollments", vars.classId] });
    },
  });
}
