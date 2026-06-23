import type { GraphQLContext } from "../context";
import { ownerIdsFrom, requireOwnerIds } from "../auth";
import { getPrisma } from "../prisma";
import type { MutationUpsertGradeArgs, QueryGradesByClassArgs } from "@/src/gql/schema";

export const gradeQueryResolvers = {
  gradesByClass: async (_: unknown, { classId }: QueryGradesByClassArgs, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) {
      return [];
    }
    const prisma = await getPrisma();
    const c = await prisma.class.findFirst({
      where: { id: classId, ownerId: { in: ownerIds } },
    });
    if (!c) {
      return [];
    }
    return prisma.grade.findMany({
      where: { evaluation: { classId } },
    });
  },
};

export const gradeMutationResolvers = {
  upsertGrade: async (_: unknown, args: MutationUpsertGradeArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const enr = await prisma.enrollment.findFirst({
      where: { id: args.enrollmentId, class: { ownerId: { in: ownerIds } } },
    });
    if (!enr) {
      throw new Error("Not found");
    }
    const ev = await prisma.evaluation.findFirst({
      where: { id: args.evaluationId, classId: enr.classId },
    });
    if (!ev) {
      throw new Error("Not found");
    }
    return prisma.grade.upsert({
      where: {
        enrollmentId_evaluationId: {
          enrollmentId: args.enrollmentId,
          evaluationId: args.evaluationId,
        },
      },
      update: { score: args.score },
      create: {
        enrollmentId: args.enrollmentId,
        evaluationId: args.evaluationId,
        score: args.score,
      },
    });
  },
};
