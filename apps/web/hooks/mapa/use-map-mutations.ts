"use client";

import { useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { queryKeys } from "@/lib/query-options";
import {
  AssignClassGroupDocument,
  ClearLessonCellDocument,
  CreateSubjectDocument,
  SaveLessonCellDocument,
} from "@/src/gql/graphql";
import type { Shift, Weekday } from "@/src/gql/schema";

export const useAssignClassGroupMutation = () => {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: {
      locationId: string;
      shift: Shift;
      grade: string;
      section: string;
    }) => {
      const data = await gqlRequest(AssignClassGroupDocument, input);
      return data.assignClassGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mapData() });
    },
  });
};

export const useSaveLessonCellMutation = () => {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: {
      locationId: string;
      shift: Shift;
      weekday: Weekday;
      period: number;
      subjectName: string;
      teacherName: string;
    }) => {
      const data = await gqlRequest(SaveLessonCellDocument, input);
      return data.saveLessonCell;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mapData() });
    },
  });
};

export const useClearLessonCellMutation = () => {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: {
      locationId: string;
      shift: Shift;
      weekday: Weekday;
      period: number;
    }) => {
      const data = await gqlRequest(ClearLessonCellDocument, input);
      return data.clearLessonCell;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mapData() });
    },
  });
};

export const useCreateSubjectMutation = () => {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { name: string }) => {
      const data = await gqlRequest(CreateSubjectDocument, input);
      return data.createSubject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mapData() });
    },
  });
};
