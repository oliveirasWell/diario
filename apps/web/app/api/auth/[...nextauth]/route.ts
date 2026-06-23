import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import getClientPromise from "@/lib/mongodb";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  adapter: MongoDBAdapter(getClientPromise()),
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      try {
        const email = user?.email ?? token.email;
        if (email) {
          const { prisma } = await import("@diario/db");
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
              name: user?.name ?? undefined,
              image: user?.image ?? undefined,
            },
            create: {
              email,
              name: user?.name ?? null,
              image: user?.image ?? null,
            },
          });
          token.prismaUserId = dbUser.id;
        }
      } catch {
        // swallow to not block auth; GraphQL layer can handle absence
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.prismaUserId) {
          session.user.prismaUserId = token.prismaUserId;
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
