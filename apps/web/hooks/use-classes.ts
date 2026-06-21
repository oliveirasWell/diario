"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { classesQueryOptions, queryKeys } from "@/lib/query-options";

import type { Class } from "@/src/gql/schema-types";

export function useClassesQuery() {
  return useQuery(classesQueryOptions());
}

export function useCreateClassMutation() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: async (input: { name: string; year: number }) => {
      const data = await gqlRequest<{ createClass: Class }>(/* GraphQL */ `
        mutation CreateClass($name: String!, $year: Int!) {
          createClass(name: $name, year: $year) { id name year ownerId }
        }
      `, input);
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
      const data = await gqlRequest<{ deleteClass: boolean }>(/* GraphQL */ `
        mutation DelClass($id: ID!) { deleteClass(id: $id) }
      `, { id });
      return data.deleteClass;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.classes() });
    },
  });
}
