import { GraphQLClient } from "graphql-request";

function getGqlEndpoint() {
  // Browser: prefer absolute origin; in dev allow hardcoded localhost
  if (typeof window !== "undefined") {
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3000/api/graphql";
    }
    return `${window.location.origin}/api/graphql`;
  }
  // Server: use NEXTAUTH_URL (recommended) or localhost in dev
  if (process.env.NEXTAUTH_URL) return `${process.env.NEXTAUTH_URL.replace(/\/$/, "")}/api/graphql`;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000/api/graphql";
  // Vercel fallback (if NEXTAUTH_URL not set)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/graphql`;
  return "http://localhost:3000/api/graphql";
}

export async function gqlRequest<T>(query: string, variables?: Record<string, any>) {
  const client = new GraphQLClient(getGqlEndpoint(), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return client.request<T>(query, variables);
}
