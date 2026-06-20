import { createYoga, createSchema } from "graphql-yoga";
import type { NextRequest } from "next/server";

async function getPrisma() {
  const { prisma } = await import("@diario/db");
  return prisma;
}

function ownerIdsFrom(ctx: any): string[] {
  const ids = [] as string[];
  const u = ctx?.user as any;
  if (u?.prismaUserId) ids.push(u.prismaUserId as string);
  if (u?.id) ids.push(u.id as string);
  // dedupe
  return Array.from(new Set(ids));
}

const yoga = createYoga<{ req: NextRequest }>({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      scalar DateTime

      type Query {
        health: String!
        me: User
        classes: [Class!]!
        class(id: ID!): Class
        students(classId: ID!): [Student!]!
        enrollments(classId: ID!): [Enrollment!]!
        evaluations(classId: ID!): [Evaluation!]!
      }

      type Mutation {
        createClass(name: String!, year: Int!): Class!
        createStudent(name: String!, email: String): Student!
        enrollStudent(classId: ID!, studentId: ID!): Enrollment!
        createAndEnroll(classId: ID!, name: String!, email: String): Enrollment!
        unenrollStudent(enrollmentId: ID!): Boolean!
        createEvaluation(classId: ID!, title: String!, weight: Float, maxScore: Float!): Evaluation!
      }

      type User {
        id: ID!
        email: String!
        name: String
        image: String
      }

      type Class {
        id: ID!
        name: String!
        year: Int!
        ownerId: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
      }

      type Student {
        id: ID!
        name: String!
        email: String
        externalId: String
        createdAt: DateTime!
        updatedAt: DateTime!
      }

      type Enrollment {
        id: ID!
        classId: ID!
        studentId: ID!
        status: String!
        student: Student!
      }

      type Evaluation {
        id: ID!
        classId: ID!
        title: String!
        weight: Float
        maxScore: Float!
        createdAt: DateTime!
      }
    `,
    resolvers: {
      Query: {
        health: () => "ok",
        me: async (_: unknown, __: unknown, ctx: any) => ctx.user,
        classes: async (_: unknown, __: unknown, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) return [];
          const prisma = await getPrisma();
          return prisma.class.findMany({ where: { ownerId: { in: ownerIds } } });
        },
        class: async (_: unknown, { id }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) return null;
          const prisma = await getPrisma();
          const c = await prisma.class.findFirst({ where: { id: id as string, ownerId: { in: ownerIds } } });
          return c;
        },
        students: async (_: unknown, { classId }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) return [];
          const prisma = await getPrisma();
          const enrollments = await prisma.enrollment.findMany({
            where: { classId: classId as string, class: { ownerId: { in: ownerIds } } },
            select: { student: true },
          });
          return enrollments.map((e: any) => e.student);
        },
        enrollments: async (_: unknown, { classId }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) return [];
          const prisma = await getPrisma();
          return prisma.enrollment.findMany({
            where: { classId: classId as string, class: { ownerId: { in: ownerIds } } },
            include: { student: true },
          });
        },
        evaluations: async (_: unknown, { classId }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) return [];
          const prisma = await getPrisma();
          return prisma.evaluation.findMany({
            where: { classId: classId as string, class: { ownerId: { in: ownerIds } } },
          });
        },
      },
      Mutation: {
        createClass: async (_: unknown, { name, year }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          const ownerId = ownerIds[0];
          if (!ownerId) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          return prisma.class.create({ data: { name, year, ownerId } });
        },
        createStudent: async (_: unknown, { name, email }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          return prisma.student.create({ data: { name, email: email || null } });
        },
        enrollStudent: async (_: unknown, { classId, studentId }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: { in: ownerIds } } });
          if (!c) throw new Error("Not found");
          return prisma.enrollment.create({ data: { classId, studentId, status: "ACTIVE" } });
        },
        createAndEnroll: async (_: unknown, { classId, name, email }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: { in: ownerIds } } });
          if (!c) throw new Error("Not found");
          const data: any = { name };
          const normalized = typeof email === "string" ? email.trim() : undefined;
          if (normalized) data.email = normalized.toLowerCase();
          const student = await prisma.student.create({ data });
          return prisma.enrollment.create({ data: { classId, studentId: student.id, status: "ACTIVE" } });
        },
        unenrollStudent: async (_: unknown, { enrollmentId }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const found = await prisma.enrollment.findFirst({ where: { id: enrollmentId as string, class: { ownerId: { in: ownerIds } } } });
          if (!found) throw new Error("Not found");
          await prisma.enrollment.delete({ where: { id: enrollmentId as string } });
          return true;
        },
        createEvaluation: async (_: unknown, { classId, title, weight, maxScore }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: { in: ownerIds } } });
          if (!c) throw new Error("Not found");
          return prisma.evaluation.create({ data: { classId, title, weight: weight ?? 1, maxScore } });
        },
      },
    },
  }),
  graphqlEndpoint: "/api/graphql",
  context: async ({ req }) => {
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await getServerSession(authOptions as any);
    return { user: session?.user ?? null };
  },
  maskedErrors: false,
});

export { yoga as GET, yoga as POST };
