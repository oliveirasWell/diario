"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { formatGraphqlError } from "@/lib/graphql-error";

export function useAppMutation<TData, TVariables, TContext = unknown>(
  options: UseMutationOptions<TData, unknown, TVariables, TContext>,
) {
  const mutation = useMutation(options);
  return {
    ...mutation,
    errorMessage: mutation.error ? formatGraphqlError(mutation.error) : null,
    clearError: () => mutation.reset(),
  };
}
