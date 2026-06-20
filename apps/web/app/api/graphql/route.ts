import { createYoga, createSchema } from "graphql-yoga";
import type { NextRequest } from "next/server";

const yoga = createYoga<{ req: NextRequest }>({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        health: String!
        me: User
      }
      type User {
        id: ID!
        email: String!
        name: String
        image: String
      }
    `,
    resolvers: {
      Query: {
        health: () => "ok",
        me: async (_: unknown, __: unknown, ctx: any) => {
          return ctx.user;
        },
      },
    },
  }),
  graphqlEndpoint: "/api/graphql",
  context: async ({ req }) => {
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await getServerSession(authOptions as any);
    return { user: session?.user ?? null };
  },
  maskedErrors: false,
});

export { yoga as GET, yoga as POST };
