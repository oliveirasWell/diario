import type { Session } from "next-auth";
import { E2E_BYPASS_USER_EMAIL, isE2eAuthBypassEnabled } from "@/lib/auth/e2e-bypass";

export type GraphQLUser = NonNullable<Session["user"]>;

export type GraphQLContext = {
  user: GraphQLUser | null;
};

const e2eBypassUser = async (): Promise<GraphQLUser> => {
  const { getPrisma } = await import("./prisma");
  const prisma = await getPrisma();
  const existing = await prisma.user.findUnique({
    where: { email: E2E_BYPASS_USER_EMAIL },
  });
  if (existing) {
    return { id: existing.id, prismaUserId: existing.id, email: E2E_BYPASS_USER_EMAIL };
  }
  const dbUser = await prisma.user.create({
    data: { email: E2E_BYPASS_USER_EMAIL, name: "E2E" },
  });
  return { id: dbUser.id, prismaUserId: dbUser.id, email: E2E_BYPASS_USER_EMAIL };
};

export async function createGraphQLContext(): Promise<GraphQLContext> {
  const { getServerSession } = await import("next-auth/next");
  const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return { user: session.user };
  }
  if (!isE2eAuthBypassEnabled()) {
    return { user: null };
  }
  return { user: await e2eBypassUser() };
}
