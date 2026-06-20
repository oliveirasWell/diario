import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import getClientPromise from "@/lib/mongodb";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";

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
  callbacks: {
    async jwt({ token, user }) {
      // Ensure prisma user exists and attach prismaUserId on token
      try {
        const email = user?.email ?? token?.email;
        if (email) {
          const { prisma } = await import("@diario/db");
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
              name: user?.name ?? undefined,
              image: (user as any)?.image ?? undefined,
            },
            create: {
              email,
              name: user?.name ?? null,
              image: (user as any)?.image ?? null,
            },
          });
          // @ts-ignore
          token.prismaUserId = dbUser.id;
        }
      } catch (e) {
        // swallow to not block auth; GraphQL layer can handle absence
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        // @ts-ignore next-auth adapter id
        if (token.sub) session.user.id = token.sub;
        // @ts-ignore custom field from jwt
        if (token.prismaUserId) session.user.prismaUserId = token.prismaUserId as string;
      }
      return session;
    },
  },
  adapter: MongoDBAdapter(getClientPromise()),
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
