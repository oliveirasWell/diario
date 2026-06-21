"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { enrollmentsQueryOptions, queryKeys } from "@/lib/query-options";
import { CreateAndEnrollDocument, UnenrollDocument } from "@/src/gql/graphql";

export function useEnrollmentsQuery(classId: string) {
  return useQuery(enrollmentsQueryOptions(classId));
}

export function useCreateAndEnrollMutation(classId: string) {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { name: string; email?: string | null }) => {
      const data = await gqlRequest(CreateAndEnrollDocument, { classId, ...input });
      return data.createAndEnroll;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.enrollments(classId) });
    },
  });
}

export function useUnenrollStudentMutation(classId: string) {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (enrollmentId: string) => {
      const data = await gqlRequest(UnenrollDocument, { enrollmentId });
      return data.unenrollStudent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.enrollments(classId) });
    },
  });
}
