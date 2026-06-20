import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string; // NextAuth adapter user id
      prismaUserId?: string; // Our domain user id (Prisma)
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
