import { GraphQLClient } from "graphql-request";

function getGqlEndpoint() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/graphql`;
  }
  // Server-side fallback (dev)
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base}/api/graphql`;
}

export async function gqlRequest<T>(query: string, variables?: Record<string, any>) {
  const client = new GraphQLClient(getGqlEndpoint(), {
    credentials: "include",
  });
  return client.request<T>(query, variables);
}
