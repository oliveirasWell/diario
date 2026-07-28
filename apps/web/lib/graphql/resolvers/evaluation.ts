import type { GraphQLContext } from "../context";
import { ownedOrInvitedWhere, ownerIdsFrom, requireOwnerIds, requireOwnedOrInvited } from "../auth";
import { getPrisma } from "../prisma";
import { createGraphQLError } from "graphql-yoga";
import type {
  MutationCreateEvaluationArgs,
  MutationDeleteEvaluationArgs,
  MutationRenameEvaluationArgs,
  QueryEvaluationsArgs,
} from "@/src/gql/schema";

export const evaluationQueryResolvers = {
  evaluations: async (_: unknown, { classId }: QueryEvaluationsArgs, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) {
      return [];
    }
    const prisma = await getPrisma();
    return prisma.evaluation.findMany({
      where: {
        classId,
        class: {
          OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
        },
      },
    });
  },
};

export const evaluationMutationResolvers = {
  createEvaluation: async (_: unknown, args: MutationCreateEvaluationArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    await requireOwnedOrInvited(args.classId, ownerIds);
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

  renameEvaluation: async (_: unknown, args: MutationRenameEvaluationArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    const title = args.title.trim();
    if (!title) {
      throw createGraphQLError("Título é obrigatório");
    }
    const prisma = await getPrisma();
    const evaluation = await prisma.evaluation.findFirst({
      where: { id: args.id, class: ownedOrInvitedWhere(ownerIds) },
    });
    if (!evaluation) {
      throw createGraphQLError("Not found");
    }
    return prisma.evaluation.update({
      where: { id: args.id },
      data: { title },
    });
  },

  deleteEvaluation: async (
    _: unknown,
    { id }: MutationDeleteEvaluationArgs,
    ctx: GraphQLContext,
  ) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const ev = await prisma.evaluation.findFirst({
      where: {
        id,
        class: {
          OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
        },
      },
    });
    if (!ev) {
      throw createGraphQLError("Not found");
    }
    await prisma.grade.deleteMany({ where: { evaluationId: id } });
    await prisma.evaluation.delete({ where: { id } });
    return true;
  },
};
