import { createYoga } from "graphql-yoga";
import { createGraphQLContext } from "@/lib/graphql/context";
import { createGraphQLSchema } from "@/lib/graphql/create-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const { handleRequest } = createYoga({
  schema: createGraphQLSchema(),
  graphqlEndpoint: "/api/graphql",
  context: createGraphQLContext,
  maskedErrors: false,
});

async function toGlobalResponse(res: Response): Promise<Response> {
  const text = await res.text();
  const headers = new Headers();
  res.headers.forEach((v, k) => headers.set(k, v));
  return new Response(text, { status: res.status, headers });
}

async function proxyYoga(request: Request): Promise<Response> {
  try {
    const res = await handleRequest(request);
    return await toGlobalResponse(res as unknown as Response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[GraphQL] Uncaught route error:", stack || err);
    return new Response(JSON.stringify({ error: "GraphQL handler error", message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function GET(request: Request) {
  return proxyYoga(request);
}

export async function POST(request: Request) {
  return proxyYoga(request);
}

export async function OPTIONS(request: Request) {
  return proxyYoga(request);
}
