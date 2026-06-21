"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";

import type { Class } from "@/lib/graphql-types";

export function useClassesQuery() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const data = await gqlRequest<{ classes: Class[] }>(/* GraphQL */ `
        query Classes {
          classes { id name year ownerId }
        }
      `);
      return data.classes;
    },
  });
}

export function useCreateClassMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; year: number }) => {
      const data = await gqlRequest<{ createClass: Class }>(/* GraphQL */ `
        mutation CreateClass($name: String!, $year: Int!) {
          createClass(name: $name, year: $year) { id name year ownerId }
        }
      `, input);
      return data.createClass;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useDeleteClassMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await gqlRequest<{ deleteClass: boolean }>(/* GraphQL */ `
        mutation DelClass($id: ID!) { deleteClass(id: $id) }
      `, { id });
      return data.deleteClass;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
