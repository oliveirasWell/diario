import { GraphQLClient } from "graphql-request";

export const gqlClient = new GraphQLClient("/api/graphql", {
  credentials: "include",
});

export async function gqlRequest<T>(query: string, variables?: Record<string, any>) {
  return gqlClient.request<T>(query, variables);
}
