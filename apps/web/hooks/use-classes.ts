"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";

export type Class = {
  id: string;
  name: string;
  year: number;
  ownerId: string;
};

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
