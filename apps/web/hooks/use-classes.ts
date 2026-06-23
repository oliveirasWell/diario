"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { classesQueryOptions, queryKeys } from "@/lib/query-options";
import {
  CreateClassDocument,
  DelClassDocument,
  RenameClassDocument,
  CreateInviteLinkDocument,
  AcceptInviteDocument,
  ClassInviteInfoDocument,
} from "@/src/gql/graphql";

export function useClassesQuery() {
  return useQuery(classesQueryOptions());
}

export function useCreateClassMutation() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { name: string; year: number }) => {
      const data = await gqlRequest(CreateClassDocument, input);
      return data.createClass;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.classes() });
    },
  });
}

export function useDeleteClassMutation() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (id: string) => {
      const data = await gqlRequest(DelClassDocument, { id });
      return data.deleteClass;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.classes() });
    },
  });
}

export function useRenameClassMutation() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const data = await gqlRequest(RenameClassDocument, input);
      return data.renameClass;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.classes() });
      qc.invalidateQueries({ queryKey: queryKeys.class(vars.id) });
    },
  });
}

export function useCreateInviteLinkMutation() {
  return useAppMutation({
    mutationFn: async (classId: string) => {
      const res = await gqlRequest(CreateInviteLinkDocument, { classId });
      return res.createInviteLink;
    },
  });
}

export function useAcceptInviteMutation() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (id: string) => {
      const res = await gqlRequest(AcceptInviteDocument, { id });
      return res.acceptInvite;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.classes() });
    },
  });
}

export function useClassInviteInfoQuery(id: string) {
  return useQuery({
    queryKey: ["classInviteInfo", id],
    queryFn: async () => {
      const res = await gqlRequest(ClassInviteInfoDocument, { id });
      return res.classInviteInfo;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}
