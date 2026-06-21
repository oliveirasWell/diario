import { normalizeAttendanceDate, sessionDayBounds } from "@/lib/attendance-date";
import { toPrismaAttendanceStatus, PrismaAttendanceStatus } from "@/lib/graphql/db-bridge";
import type { GraphQLContext } from "../context";
import { ownerIdsFrom, requireOwnerIds, requireOwnedClass } from "../auth";
import { getPrisma } from "../prisma";
import type {
  MutationExcludeAttendanceDateArgs,
  MutationMarkAllPresentArgs,
  MutationMarkAttendanceArgs,
  QueryAttendanceDatesArgs,
  QueryAttendanceRecordsArgs,
} from "@/src/gql/schema";

export const attendanceQueryResolvers = {
  attendanceDates: async (_: unknown, args: QueryAttendanceDatesArgs, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) return [];
    const prisma = await getPrisma();
    const c = await prisma.class.findFirst({
      where: { id: args.classId, ownerId: { in: ownerIds } },
    });
    if (!c) return [];
    const days: number[] = c.daysOfWeek ?? [];
    const start = args.from ? new Date(args.from) : c.startDate ? new Date(c.startDate) : null;
    const end = args.to ? new Date(args.to) : c.endDate ? new Date(c.endDate) : null;
    if (!start || !end || !days.length) return [];
    const excluded = new Set(
      (c.excludedDates ?? []).map((x) => new Date(x).toISOString().slice(0, 10))
    );
    const out: Date[] = [];
    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      const key = new Date(d).toISOString().slice(0, 10);
      if (days.includes(d.getDay()) && !excluded.has(key)) out.push(new Date(d));
    }
    return out;
  },

  attendanceRecords: async (_: unknown, args: QueryAttendanceRecordsArgs, ctx: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(ctx);
    if (!ownerIds.length) return [];
    const prisma = await getPrisma();
    const c = await prisma.class.findFirst({
      where: { id: args.classId, ownerId: { in: ownerIds } },
    });
    if (!c) return [];
    const where: { classId: string; date?: { gte?: Date; lte?: Date } } = { classId: args.classId };
    if (args.from || args.to) {
      where.date = {};
      if (args.from) where.date.gte = new Date(args.from);
      if (args.to) where.date.lte = new Date(args.to);
    }
    const sessions = await prisma.attendanceSession.findMany({ where, include: { records: true } });
    return sessions.flatMap((s) =>
      s.records.map((r) => ({ ...r, session: { id: s.id, date: s.date } }))
    );
  },
};

export const attendanceMutationResolvers = {
  markAttendance: async (_: unknown, args: MutationMarkAttendanceArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    await requireOwnedClass(args.classId, ownerIds);
    const prisma = await getPrisma();
    const bounds = sessionDayBounds(args.date);
    const session = await prisma.attendanceSession.findFirst({
      where: { classId: args.classId, date: bounds },
    });

    if (args.status == null) {
      if (!session) return true;
      const existing = await prisma.attendanceRecord.findFirst({
        where: { sessionId: session.id, enrollmentId: args.enrollmentId },
      });
      if (!existing) return true;
      await prisma.attendanceRecord.delete({ where: { id: existing.id } });
      return true;
    }

    const prismaStatus = toPrismaAttendanceStatus(args.status);
    let activeSession = session;
    if (!activeSession) {
      activeSession = await prisma.attendanceSession.create({
        data: { classId: args.classId, date: normalizeAttendanceDate(args.date) },
      });
    }

    const existing = await prisma.attendanceRecord.findFirst({
      where: { sessionId: activeSession.id, enrollmentId: args.enrollmentId },
    });
    if (existing) {
      await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { status: prismaStatus },
      });
    } else {
      await prisma.attendanceRecord.create({
        data: {
          sessionId: activeSession.id,
          enrollmentId: args.enrollmentId,
          status: prismaStatus,
        },
      });
    }
    return true;
  },

  markAllPresent: async (_: unknown, args: MutationMarkAllPresentArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    await requireOwnedClass(args.classId, ownerIds);
    const prisma = await getPrisma();
    const bounds = sessionDayBounds(args.date);
    const normalizedDate = normalizeAttendanceDate(args.date);

    await prisma.$transaction(async (tx) => {
      let session = await tx.attendanceSession.findFirst({
        where: { classId: args.classId, date: bounds },
      });
      if (!session) {
        session = await tx.attendanceSession.create({
          data: { classId: args.classId, date: normalizedDate },
        });
      }
      const enrollments = await tx.enrollment.findMany({ where: { classId: args.classId } });
      for (const en of enrollments) {
        const existing = await tx.attendanceRecord.findFirst({
          where: { sessionId: session.id, enrollmentId: en.id },
        });
        if (existing) {
          await tx.attendanceRecord.update({
            where: { id: existing.id },
            data: { status: PrismaAttendanceStatus.PRESENT },
          });
        } else {
          await tx.attendanceRecord.create({
            data: {
              sessionId: session.id,
              enrollmentId: en.id,
              status: PrismaAttendanceStatus.PRESENT,
            },
          });
        }
      }
    });

    return true;
  },

  excludeAttendanceDate: async (_: unknown, args: MutationExcludeAttendanceDateArgs, ctx: GraphQLContext) => {
    const ownerIds = requireOwnerIds(ctx);
    const c = await requireOwnedClass(args.classId, ownerIds);
    const prisma = await getPrisma();
    const d = new Date(args.date);
    const dk = d.toISOString().slice(0, 10);
    const cur = (c.excludedDates ?? []).map((x) => new Date(x).toISOString().slice(0, 10));
    if (!cur.includes(dk)) {
      const next = [...(c.excludedDates ?? []), d];
      await prisma.class.update({ where: { id: c.id }, data: { excludedDates: next } });
    }
    return true;
  },
};
