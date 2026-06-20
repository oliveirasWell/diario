"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";

export type Student = {
  id: string;
  name: string;
  email?: string | null;
};

export function useStudentsQuery(classId: string) {
  return useQuery({
    queryKey: ["students", classId],
    queryFn: async () => {
      const data = await gqlRequest<{ students: Student[] }>(/* GraphQL */ `
        query Students($classId: ID!) { students(classId: $classId) { id name email } }
      `, { classId });
      return data.students;
    },
    enabled: !!classId,
  });
}

export function useCreateStudentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email?: string | null }) => {
      const data = await gqlRequest<{ createStudent: Student }>(/* GraphQL */ `
        mutation CreateStudent($name: String!, $email: String) {
          createStudent(name: $name, email: $email) { id name email }
        }
      `, input);
      return data.createStudent;
    },
  });
}

export function useEnrollStudentMutation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) => {
      const data = await gqlRequest<{ enrollStudent: { id: string } }>(/* GraphQL */ `
        mutation EnrollStudent($classId: ID!, $studentId: ID!) {
          enrollStudent(classId: $classId, studentId: $studentId) { id }
        }
      `, { classId, studentId });
      return data.enrollStudent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students", classId] });
    },
  });
}
