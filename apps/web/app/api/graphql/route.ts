import { createYoga, createSchema } from "graphql-yoga";

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const { handleRequest } = createYoga({
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
        gradesByClass(classId: ID!): [Grade!]!
        attendanceDates(classId: ID!, from: DateTime, to: DateTime): [DateTime!]!
        attendanceRecords(classId: ID!, from: DateTime, to: DateTime): [AttendanceRecord!]!
      }

      type Mutation {
        createClass(name: String!, year: Int!, daysOfWeek: [Int!], startDate: DateTime, endDate: DateTime): Class!
        updateClassSchedule(id: ID!, daysOfWeek: [Int!], startDate: DateTime, endDate: DateTime): Class!
        deleteClass(id: ID!): Boolean!
        createStudent(name: String!, email: String): Student!
        enrollStudent(classId: ID!, studentId: ID!): Enrollment!
        createAndEnroll(classId: ID!, name: String!, email: String): Enrollment!
        unenrollStudent(enrollmentId: ID!): Boolean!
        createEvaluation(classId: ID!, title: String!, weight: Float, maxScore: Float!): Evaluation!
        deleteEvaluation(id: ID!): Boolean!
        upsertGrade(enrollmentId: ID!, evaluationId: ID!, score: Float!): Grade!
        setEnrollmentConcept(enrollmentId: ID!, concept: String): Enrollment!
        markAttendance(classId: ID!, date: DateTime!, enrollmentId: ID!, status: AttendanceStatus!): Boolean!
        clearAttendance(classId: ID!, date: DateTime!, enrollmentId: ID!): Boolean!
        deleteAttendanceSession(classId: ID!, date: DateTime!): Boolean!
        excludeAttendanceDate(classId: ID!, date: DateTime!): Boolean!
        includeAttendanceDate(classId: ID!, date: DateTime!): Boolean!
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
        daysOfWeek: [Int!]!
        startDate: DateTime
        endDate: DateTime
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
        concept: String
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

      type Grade {
        id: ID!
        enrollmentId: ID!
        evaluationId: ID!
        score: Float!
      }

      enum AttendanceStatus { PRESENT ABSENT LATE }
      type AttendanceSession { id: ID!, classId: ID!, date: DateTime!, notes: String }
      type AttendanceRecord { id: ID!, sessionId: ID!, enrollmentId: ID!, status: AttendanceStatus!, session: AttendanceSession! }
    `,
    resolvers: {
      Class: { daysOfWeek: (p: any) => p.daysOfWeek ?? [] },
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
        gradesByClass: async (_: unknown, { classId }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) return [];
          const prisma = await getPrisma();
          // Ensure class belongs to owner
          const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: { in: ownerIds } } });
          if (!c) return [];
          return prisma.grade.findMany({
            where: { evaluation: { classId: classId as string } },
          });
        },
        attendanceDates: async (_: unknown, { classId, from, to }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) return [];
          const prisma = await getPrisma();
          const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: { in: ownerIds } } });
          if (!c) return [];
          const days: number[] = c.daysOfWeek ?? [];
          const start = from ? new Date(from) : c.startDate ? new Date(c.startDate) : null;
          const end = to ? new Date(to) : c.endDate ? new Date(c.endDate) : null;
          if (!start || !end || !days.length) return [];
          const excluded = new Set((c.excludedDates ?? []).map((x: Date) => new Date(x).toISOString().slice(0,10)));
          const out: Date[] = [];
          for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 24*60*60*1000)) {
            if (days.includes(d.getDay()) && !excluded.has(new Date(d).toISOString().slice(0,10))) out.push(new Date(d));
          }
          return out;
        },
        attendanceRecords: async (_: unknown, { classId, from, to }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) return [];
          const prisma = await getPrisma();
          const where: any = { classId: classId as string };
          if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
          }
          const sessions = await prisma.attendanceSession.findMany({ where, include: { records: true } });
          return sessions.flatMap((s: any) => s.records.map((r: any) => ({ ...r, session: { id: s.id, date: s.date } })));
        },
      },
      Mutation: {
        createClass: async (_: unknown, { name, year, daysOfWeek, startDate, endDate }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          const ownerId = ownerIds[0];
          if (!ownerId) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const sd = startDate ? new Date(startDate) : null;
          const ed = endDate ? new Date(endDate) : null;
          return prisma.class.create({ data: { name, year, ownerId, daysOfWeek: daysOfWeek ?? [], startDate: sd, endDate: ed } });
        },
        updateClassSchedule: async (_: unknown, { id, daysOfWeek, startDate, endDate }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const c = await prisma.class.findFirst({ where: { id: id as string, ownerId: { in: ownerIds } } });
          if (!c) throw new Error("Not found");
          const sd = startDate ? new Date(startDate) : null;
          const ed = endDate ? new Date(endDate) : null;
          return prisma.class.update({ where: { id: id as string }, data: { daysOfWeek: daysOfWeek ?? c.daysOfWeek ?? [], startDate: sd, endDate: ed } });
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
        deleteEvaluation: async (_: unknown, { id }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const ev = await prisma.evaluation.findFirst({ where: { id: id as string, class: { ownerId: { in: ownerIds } } } });
          if (!ev) throw new Error("Not found");
          await prisma.grade.deleteMany({ where: { evaluationId: id as string } });
          await prisma.evaluation.delete({ where: { id: id as string } });
          return true;
        },
        upsertGrade: async (_: unknown, { enrollmentId, evaluationId, score }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          // Check enrollment belongs to owner's class and evaluation belongs to same class
          const enr = await prisma.enrollment.findFirst({ where: { id: enrollmentId as string, class: { ownerId: { in: ownerIds } } } });
          if (!enr) throw new Error("Not found");
          const ev = await prisma.evaluation.findFirst({ where: { id: evaluationId as string, classId: enr.classId } });
          if (!ev) throw new Error("Not found");
          return prisma.grade.upsert({
            where: { enrollmentId_evaluationId: { enrollmentId, evaluationId } },
            update: { score },
            create: { enrollmentId, evaluationId, score },
          });
        },
        setEnrollmentConcept: async (_: unknown, { enrollmentId, concept }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const enr = await prisma.enrollment.findFirst({ where: { id: enrollmentId as string, class: { ownerId: { in: ownerIds } } } });
          if (!enr) throw new Error("Not found");
          return prisma.enrollment.update({ where: { id: enrollmentId as string }, data: { concept: concept ?? null } });
        },
        markAttendance: async (_: unknown, { classId, date, enrollmentId, status }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: { in: ownerIds } } });
          if (!c) throw new Error("Not found");
          const d = new Date(date);
          let session = await prisma.attendanceSession.findFirst({ where: { classId: classId as string, date: d } });
          if (!session) session = await prisma.attendanceSession.create({ data: { classId, date: d } });
          const existing = await prisma.attendanceRecord.findFirst({ where: { sessionId: session.id, enrollmentId: enrollmentId as string } });
          if (existing) await prisma.attendanceRecord.update({ where: { id: existing.id }, data: { status } });
          else await prisma.attendanceRecord.create({ data: { sessionId: session.id, enrollmentId, status } });
          return true;
        },
        clearAttendance: async (_: unknown, { classId, date, enrollmentId }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: { in: ownerIds } } });
          if (!c) throw new Error("Not found");
          const d = new Date(date);
          const session = await prisma.attendanceSession.findFirst({ where: { classId: classId as string, date: d } });
          if (!session) return true; // nothing to clear
          const existing = await prisma.attendanceRecord.findFirst({ where: { sessionId: session.id, enrollmentId: enrollmentId as string } });
          if (!existing) return true;
          await prisma.attendanceRecord.delete({ where: { id: existing.id } });
          return true;
        },
        deleteClass: async (_: unknown, { id }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const c = await prisma.class.findFirst({ where: { id: id as string, ownerId: { in: ownerIds } } });
          if (!c) throw new Error("Not found");
          // cascade deletes
          const classId = id as string;
          const sessions = await prisma.attendanceSession.findMany({ where: { classId } });
          await prisma.attendanceRecord.deleteMany({ where: { sessionId: { in: sessions.map(s=>s.id) } } });
          await prisma.attendanceSession.deleteMany({ where: { classId } });
          const evals = await prisma.evaluation.findMany({ where: { classId } });
          await prisma.grade.deleteMany({ where: { evaluationId: { in: evals.map(e=>e.id) } } });
          await prisma.evaluation.deleteMany({ where: { classId } });
          await prisma.enrollment.deleteMany({ where: { classId } });
          await prisma.class.delete({ where: { id: classId } });
          return true;
        },
        deleteAttendanceSession: async (_: unknown, { classId, date }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const d = new Date(date);
          const session = await prisma.attendanceSession.findFirst({ where: { classId: classId as string, date: d, class: { ownerId: { in: ownerIds } } } });
          if (!session) return true;
          // Delete records then session
          await prisma.attendanceRecord.deleteMany({ where: { sessionId: session.id } });
          await prisma.attendanceSession.delete({ where: { id: session.id } });
          return true;
        },
        excludeAttendanceDate: async (_: unknown, { classId, date }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const d = new Date(date);
          const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: { in: ownerIds } } });
          if (!c) throw new Error("Not found");
          const dk = d.toISOString().slice(0,10);
          const cur = (c.excludedDates ?? []).map((x: any)=> new Date(x).toISOString().slice(0,10));
          if (!cur.includes(dk)) {
            const next = [...(c.excludedDates ?? []), d];
            await prisma.class.update({ where: { id: c.id }, data: { excludedDates: next as any } });
          }
          return true;
        },
        includeAttendanceDate: async (_: unknown, { classId, date }: any, ctx: any) => {
          const ownerIds = ownerIdsFrom(ctx);
          if (!ownerIds.length) throw new Error("Unauthorized");
          const prisma = await getPrisma();
          const d = new Date(date);
          const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: { in: ownerIds } } });
          if (!c) throw new Error("Not found");
          const dk = d.toISOString().slice(0,10);
          const next = (c.excludedDates ?? []).filter((x: any)=> new Date(x).toISOString().slice(0,10) !== dk);
          await prisma.class.update({ where: { id: c.id }, data: { excludedDates: next as any } });
          return true;
        },
      },
    },
  }),
  graphqlEndpoint: "/api/graphql",
  context: async () => {
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await getServerSession(authOptions as any);
    return { user: session?.user ?? null };
  },
  maskedErrors: false,
});

async function callYoga(request: Request): Promise<Response> {
  try {
    // Return Yoga's Response directly. In certain runtimes, Response comes
    // from a different realm, so instanceof checks can fail even when valid.
    return await handleRequest(request);
  } catch (err: any) {
    console.error("[GraphQL] Uncaught route error:", err?.stack || err);
    return new Response(JSON.stringify({ error: "GraphQL handler error", message: err?.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function GET(request: Request) {
  return callYoga(request);
}

export async function POST(request: Request) {
  return callYoga(request);
}

export async function OPTIONS(request: Request) {
  return callYoga(request);
}
