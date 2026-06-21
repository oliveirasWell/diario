import type { GraphQLContext } from "../context";
import { ownerIdsFrom, requireOwnerIds, requireOwnedClass } from "../auth";
import { getPrisma } from "../prisma";

type CreateEvaluationArgs = {
  classId: string;
  title: string;
  weight?: number | null;
  maxScore: number;
};

export const evaluationQueryResolvers = {
  evaluations: async (_: unknown, { classId }: { classId: string }, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) return [];
    const prisma = await getPrisma();
    return prisma.evaluation.findMany({
      where: { classId, class: { ownerId: { in: ownerIds } } },
    });
  },
};

export const evaluationMutationResolvers = {
  createEvaluation: async (_: unknown, args: CreateEvaluationArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    await requireOwnedClass(args.classId, ownerIds);
    const prisma = await getPrisma();
    return prisma.evaluation.create({
      data: {
        classId: args.classId,
        title: args.title,
        weight: args.weight ?? 1,
        maxScore: args.maxScore,
      },
    });
  },

  deleteEvaluation: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const ev = await prisma.evaluation.findFirst({
      where: { id, class: { ownerId: { in: ownerIds } } },
    });
    if (!ev) throw new Error("Not found");
    await prisma.grade.deleteMany({ where: { evaluationId: id } });
    await prisma.evaluation.delete({ where: { id } });
    return true;
  },
};
