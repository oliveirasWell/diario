import type { GraphQLContext } from "../context";
import { ownerIdsFrom, requireOwnerIds } from "../auth";
import { getPrisma } from "../prisma";
import type { MutationUpsertGradeArgs, QueryGradesByClassArgs } from "@/src/gql/schema";

const emptyClassGrades = { evaluations: [], rows: [] };

export const gradeQueryResolvers = {
  gradesByClass: async (_: unknown, { classId }: QueryGradesByClassArgs, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) return emptyClassGrades;
    const prisma = await getPrisma();
    const c = await prisma.class.findFirst({
      where: { id: classId, ownerId: { in: ownerIds } },
    });
    if (!c) return emptyClassGrades;

    const [evaluations, enrollments, grades] = await Promise.all([
      prisma.evaluation.findMany({ where: { classId }, orderBy: { createdAt: "asc" } }),
      prisma.enrollment.findMany({
        where: { classId },
        include: { student: true },
      }),
      prisma.grade.findMany({ where: { evaluation: { classId } } }),
    ]);

    const gradesByEnrollment = new Map<string, typeof grades>();
    for (const grade of grades) {
      const list = gradesByEnrollment.get(grade.enrollmentId) ?? [];
      list.push(grade);
      gradesByEnrollment.set(grade.enrollmentId, list);
    }

    return {
      evaluations,
      rows: enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        concept: enrollment.concept,
        student: enrollment.student,
        grades: gradesByEnrollment.get(enrollment.id) ?? [],
      })),
    };
  },
};

export const gradeMutationResolvers = {
  upsertGrade: async (_: unknown, args: MutationUpsertGradeArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    const prisma = await getPrisma();
    const enr = await prisma.enrollment.findFirst({
      where: { id: args.enrollmentId, class: { ownerId: { in: ownerIds } } },
    });
    if (!enr) throw new Error("Not found");
    const ev = await prisma.evaluation.findFirst({
      where: { id: args.evaluationId, classId: enr.classId },
    });
    if (!ev) throw new Error("Not found");
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
