import type { Session } from "next-auth";

export type GraphQLUser = NonNullable<Session["user"]>;

export type GraphQLContext = {
  user: GraphQLUser | null;
};

export async function createGraphQLContext(): Promise<GraphQLContext> {
  const { getServerSession } = await import("next-auth/next");
  const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
  const session = await getServerSession(authOptions);
  return { user: session?.user ?? null };
}
