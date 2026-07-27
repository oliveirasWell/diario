"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { enrollmentsQueryOptions, queryKeys } from "@/lib/query-options";
import {
  CreateAndEnrollDocument,
  RenameStudentDocument,
  UnenrollDocument,
} from "@/src/gql/graphql";

export const useEnrollmentsQuery = (classId: string) => {
  return useQuery(enrollmentsQueryOptions(classId));
};

export const useCreateAndEnrollMutation = (classId: string) => {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { name: string; email?: string | null }) => {
      const data = await gqlRequest(CreateAndEnrollDocument, { classId, ...input });
      return data.createAndEnroll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(classId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceBoard(classId) });
    },
  });
};

export const useUnenrollStudentMutation = (classId: string) => {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: async (enrollmentId: string) => {
      const data = await gqlRequest(UnenrollDocument, { enrollmentId });
      return data.unenrollStudent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(classId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceBoard(classId) });
    },
  });
};

export const useRenameStudentMutation = (classId: string) => {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { enrollmentId: string; name: string }) => {
      const data = await gqlRequest(RenameStudentDocument, input);
      return data.renameStudent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(classId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceBoard(classId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.grades(classId) });
    },
  });
};
