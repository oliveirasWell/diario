import type { GraphQLContext } from "../context";
import { ownerIdsFrom, requireOwnerIds, requireOwnedOrInvited, requireOwnerStrict } from "../auth";
import { getPrisma } from "../prisma";
import type {
  MutationCreateClassArgs,
  MutationDeleteClassArgs,
  MutationRenameClassArgs,
  MutationUpdateClassScheduleArgs,
  QueryClassArgs,
} from "@/src/gql/schema";

export const classFieldResolvers = {
  Class: {
    daysOfWeek: (parent: { daysOfWeek?: number[] }) => parent.daysOfWeek ?? [],

    owner: async (parent: { ownerId: string }) => {
      const prisma = await getPrisma();
      return prisma.user.findUnique({ where: { id: parent.ownerId } });
    },

    invitedUserIds: async (
      parent: { ownerId: string; invitedUserIds?: string[] },
      _: unknown,
      ctx: GraphQLContext,
    ) => {
      // ponytail: hide invited list from non-owners. Resolver-level, not DB-level.
      if (parent.ownerId === ctx.user?.prismaUserId) {
        return parent.invitedUserIds ?? [];
      }
      return [];
    },
  },
};

export const classQueryResolvers = {
  classes: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) {
      return [];
    }
    const prisma = await getPrisma();
    return prisma.class.findMany({
      where: {
        OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
      },
    });
  },

  class: async (_: unknown, { id }: QueryClassArgs, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) {
      return null;
    }
    const prisma = await getPrisma();
    return prisma.class.findFirst({
      where: {
        id,
        OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
      },
    });
  },

  classInviteInfo: async (_: unknown, { id }: { id: string }) => {
    const prisma = await getPrisma();
    const c = await prisma.class.findUnique({ where: { id } });
    if (!c) {
      return null;
    }
    const owner = await prisma.user.findUnique({ where: { id: c.ownerId } });
    // ponytail: public-ish lookup. Only exposes name + ownerName. Safe enough.
    return { id: c.id, name: c.name, ownerName: owner?.name ?? null };
  },
};

export const classMutationResolvers = {
  createClass: async (_: unknown, args: MutationCreateClassArgs, ctx: GraphQLContext) => {
    const ownerId = ctx.user?.prismaUserId;
    if (!ownerId) {
      throw new Error("Unauthorized");
    }
    const prisma = await getPrisma();
    return prisma.class.create({
      data: {
        name: args.name,
        year: args.year,
        ownerId,
        daysOfWeek: args.daysOfWeek ?? [],
        startDate: args.startDate ? new Date(args.startDate) : null,
        endDate: args.endDate ? new Date(args.endDate) : null,
      },
    });
  },

  updateClassSchedule: async (
    _: unknown,
    args: MutationUpdateClassScheduleArgs,
    ctx: GraphQLContext,
  ) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const c = await requireOwnedOrInvited(args.id, ownerIds);
    return prisma.class.update({
      where: { id: args.id },
      data: {
        daysOfWeek: args.daysOfWeek ?? c.daysOfWeek ?? [],
        startDate: args.startDate ? new Date(args.startDate) : null,
        endDate: args.endDate ? new Date(args.endDate) : null,
      },
    });
  },

  renameClass: async (_: unknown, args: MutationRenameClassArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    await requireOwnedOrInvited(args.id, ownerIds);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nome é obrigatório");
    }
    const prisma = await getPrisma();
    return prisma.class.update({
      where: { id: args.id },
      data: { name },
    });
  },

  deleteClass: async (_: unknown, { id }: MutationDeleteClassArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    await requireOwnedOrInvited(id, ownerIds);
    const prisma = await getPrisma();
    await prisma.$transaction(async (tx) => {
      const sessions = await tx.attendanceSession.findMany({ where: { classId: id } });
      await tx.attendanceRecord.deleteMany({
        where: { sessionId: { in: sessions.map((s) => s.id) } },
      });
      await tx.attendanceSession.deleteMany({ where: { classId: id } });
      const evals = await tx.evaluation.findMany({ where: { classId: id } });
      await tx.grade.deleteMany({ where: { evaluationId: { in: evals.map((e) => e.id) } } });
      await tx.evaluation.deleteMany({ where: { classId: id } });
      await tx.enrollment.deleteMany({ where: { classId: id } });
      await tx.class.delete({ where: { id } });
    });
    return true;
  },

  createInviteLink: async (_: unknown, { classId }: { classId: string }, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    await requireOwnerStrict(classId, ownerIds);
    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
    // ponytail: classId in URL. Token-based links if link-sharing becomes an issue.
    return `${origin}/invite/${classId}`;
  },

  acceptInvite: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const c = await prisma.class.findUnique({ where: { id } });
    if (!c) {
      throw new Error("Not found");
    }
    // ponytail: idempotent — if already invited, just return class.
    const alreadyInvited = c.invitedUserIds?.some((uid) => ownerIds.includes(uid)) ?? false;
    if (alreadyInvited) {
      return c;
    }
    return prisma.class.update({
      where: { id },
      data: { invitedUserIds: { push: ownerIds[0] } },
    });
  },
};
