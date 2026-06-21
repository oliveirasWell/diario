"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import type { Enrollment } from "@/lib/graphql-types";

export function useEnrollmentsQuery(classId: string) {
  return useQuery({
    queryKey: ["enrollments", classId],
    queryFn: async () => {
      const data = await gqlRequest<{ enrollments: Enrollment[] }>(/* GraphQL */ `
        query Enrollments($classId: ID!) { enrollments(classId: $classId) { id student { id name email } } }
      `, { classId });
      return data.enrollments;
    },
    enabled: !!classId,
  });
}

export function useCreateAndEnrollMutation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email?: string | null }) => {
      const data = await gqlRequest<{ createAndEnroll: { id: string } }>(/* GraphQL */ `
        mutation CreateAndEnroll($classId: ID!, $name: String!, $email: String) {
          createAndEnroll(classId: $classId, name: $name, email: $email) { id }
        }
      `, { classId, ...input });
      return data.createAndEnroll;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments", classId] });
    },
  });
}

export function useUnenrollStudentMutation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const data = await gqlRequest<{ unenrollStudent: boolean }>(/* GraphQL */ `
        mutation Unenroll($enrollmentId: ID!) { unenrollStudent(enrollmentId: $enrollmentId) }
      `, { enrollmentId });
      return data.unenrollStudent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments", classId] });
    },
  });
}
