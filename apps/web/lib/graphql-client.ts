import { GraphQLClient } from "graphql-request";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

function getGqlEndpoint() {
  if (typeof window !== "undefined") {
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3000/api/graphql";
    }
    return `${window.location.origin}/api/graphql`;
  }
  if (process.env.NEXTAUTH_URL) return `${process.env.NEXTAUTH_URL.replace(/\/$/, "")}/api/graphql`;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000/api/graphql";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/graphql`;
  return "http://localhost:3000/api/graphql";
}

export async function gqlRequest<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  const client = new GraphQLClient(getGqlEndpoint(), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return client.request(document, variables);
}
