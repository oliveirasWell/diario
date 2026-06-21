import type { GraphQLContext } from "../context";
import { ownerIdsFrom, requireOwnerIds, requireOwnedClass } from "../auth";
import { getPrisma } from "../prisma";
import type {
  MutationCreateEvaluationArgs,
  MutationDeleteEvaluationArgs,
  QueryEvaluationsArgs,
} from "@/src/gql/schema";

export const evaluationQueryResolvers = {
  evaluations: async (_: unknown, { classId }: QueryEvaluationsArgs, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) return [];
    const prisma = await getPrisma();
    return prisma.evaluation.findMany({
      where: { classId, class: { ownerId: { in: ownerIds } } },
    });
  },
};

export const evaluationMutationResolvers = {
  createEvaluation: async (_: unknown, args: MutationCreateEvaluationArgs, ctx: GraphQLContext) => {
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

  deleteEvaluation: async (_: unknown, { id }: MutationDeleteEvaluationArgs, ctx: GraphQLContext) => {
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
