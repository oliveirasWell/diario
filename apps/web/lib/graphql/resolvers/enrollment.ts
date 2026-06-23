import type { GraphQLContext } from "../context";
import { ownerIdsFrom, requireOwnerIds, requireOwnedOrInvited } from "../auth";
import { getPrisma } from "../prisma";
import type {
  MutationCreateAndEnrollArgs,
  MutationRenameStudentArgs,
  MutationSetEnrollmentConceptArgs,
  MutationUnenrollStudentArgs,
  QueryEnrollmentsArgs,
} from "@/src/gql/schema";

export const enrollmentQueryResolvers = {
  enrollments: async (_: unknown, { classId }: QueryEnrollmentsArgs, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) {
      return [];
    }
    const prisma = await getPrisma();
    return prisma.enrollment.findMany({
      where: {
        classId,
        class: {
          OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
        },
      },
      include: { student: true },
    });
  },
};

export const enrollmentMutationResolvers = {
  createAndEnroll: async (_: unknown, args: MutationCreateAndEnrollArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    await requireOwnedOrInvited(args.classId, ownerIds);
    const data: { name: string; email?: string } = { name: args.name };
    const normalized = typeof args.email === "string" ? args.email.trim() : undefined;
    if (normalized) {
      data.email = normalized.toLowerCase();
    }
    const prisma = await getPrisma();
    return prisma.$transaction(async (tx) => {
      const student = await tx.student.create({ data });
      return tx.enrollment.create({
        data: { classId: args.classId, studentId: student.id, status: "ACTIVE" },
        include: { student: true },
      });
    });
  },

  unenrollStudent: async (
    _: unknown,
    { enrollmentId }: MutationUnenrollStudentArgs,
    ctx: GraphQLContext,
  ) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const found = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        class: {
          OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
        },
      },
    });
    if (!found) {
      throw new Error("Not found");
    }

    // Delete dependent data (grades, attendance) before removing enrollment
    await prisma.$transaction(async (tx) => {
      await tx.grade.deleteMany({ where: { enrollmentId } });
      await tx.attendanceRecord.deleteMany({ where: { enrollmentId } });
      await tx.enrollment.delete({ where: { id: enrollmentId } });
    });

    return true;
  },

  renameStudent: async (_: unknown, args: MutationRenameStudentArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nome é obrigatório");
    }
    const prisma = await getPrisma();
    const found = await prisma.enrollment.findFirst({
      where: {
        id: args.enrollmentId,
        class: {
          OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
        },
      },
    });
    if (!found) {
      throw new Error("Not found");
    }
    await prisma.student.update({
      where: { id: found.studentId },
      data: { name },
    });
    return prisma.enrollment.findUniqueOrThrow({
      where: { id: args.enrollmentId },
      include: { student: true },
    });
  },

  setEnrollmentConcept: async (
    _: unknown,
    { enrollmentId, concept }: MutationSetEnrollmentConceptArgs,
    ctx: GraphQLContext,
  ) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const enr = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        class: {
          OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
        },
      },
    });
    if (!enr) {
      throw new Error("Not found");
    }
    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { concept: concept ?? null },
    });
  },
};
