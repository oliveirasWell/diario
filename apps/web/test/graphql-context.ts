import type { GraphQLContext } from "@/lib/graphql/context";

export const TEACHER_NEXT_AUTH_ID = "next-1";
export const TEACHER_PRISMA_ID = "prisma-1";
export const TEACHER_OWNER_IDS = [TEACHER_PRISMA_ID, TEACHER_NEXT_AUTH_ID];

export const teacherContext: GraphQLContext = {
  user: { id: TEACHER_NEXT_AUTH_ID, prismaUserId: TEACHER_PRISMA_ID },
};

export const anonymousContext: GraphQLContext = { user: null };
