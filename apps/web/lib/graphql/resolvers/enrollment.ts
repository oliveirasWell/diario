import type { GraphQLContext } from "../context";
import { ownerIdsFrom, requireOwnerIds, requireOwnedClass } from "../auth";
import { getPrisma } from "../prisma";
import type {
  MutationCreateAndEnrollArgs,
  MutationSetEnrollmentConceptArgs,
  MutationUnenrollStudentArgs,
  QueryEnrollmentsArgs,
} from "@/src/gql/schema";

export const enrollmentQueryResolvers = {
  enrollments: async (_: unknown, { classId }: QueryEnrollmentsArgs, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) return [];
    const prisma = await getPrisma();
    return prisma.enrollment.findMany({
      where: { classId, class: { ownerId: { in: ownerIds } } },
      include: { student: true },
    });
  },
};

export const enrollmentMutationResolvers = {
  createAndEnroll: async (_: unknown, args: MutationCreateAndEnrollArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    await requireOwnedClass(args.classId, ownerIds);
    const data: { name: string; email?: string } = { name: args.name };
    const normalized = typeof args.email === "string" ? args.email.trim() : undefined;
    if (normalized) data.email = normalized.toLowerCase();
    const prisma = await getPrisma();
    return prisma.$transaction(async (tx) => {
      const student = await tx.student.create({ data });
      return tx.enrollment.create({
        data: { classId: args.classId, studentId: student.id, status: "ACTIVE" },
        include: { student: true },
      });
    });
  },

  unenrollStudent: async (_: unknown, { enrollmentId }: MutationUnenrollStudentArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const found = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, class: { ownerId: { in: ownerIds } } },
    });
    if (!found) throw new Error("Not found");
    await prisma.enrollment.delete({ where: { id: enrollmentId } });
    return true;
  },

  setEnrollmentConcept: async (
    _: unknown,
    { enrollmentId, concept }: MutationSetEnrollmentConceptArgs,
    ctx: GraphQLContext
  ) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const enr = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, class: { ownerId: { in: ownerIds } } },
    });
    if (!enr) throw new Error("Not found");
    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { concept: concept ?? null },
    });
  },
};
