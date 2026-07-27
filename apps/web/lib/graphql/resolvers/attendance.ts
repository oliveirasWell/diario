import type { Prisma } from "@diario/db";
import {
  attendanceDayKey,
  eachDayBetween,
  normalizeAttendanceDate,
  sessionDayBounds,
} from "@/lib/attendance-date";
import { toPrismaAttendanceStatus, PrismaAttendanceStatus } from "@/lib/graphql/db-bridge";
import type { GraphQLContext } from "../context";
import { ownedOrInvitedWhere, ownerIdsFrom, requireOwnerIds, requireOwnedOrInvited } from "../auth";
import { getPrisma } from "../prisma";
import { createGraphQLError } from "graphql-yoga";
import type {
  MutationExcludeAttendanceDateArgs,
  MutationMarkAttendanceArgs,
  MutationMarkPresentArgs,
  QueryAttendanceDatesArgs,
  QueryAttendanceRecordsArgs,
} from "@/src/gql/schema";

type AttendanceStore = Pick<Prisma.TransactionClient, "attendanceSession" | "attendanceRecord">;

// Sessions are always stored at midday UTC, so a day is matched by equality.
const findOrCreateSessions = async (
  store: AttendanceStore,
  classId: string,
  dates: (Date | string)[],
) => {
  const dayKeys = Array.from(new Set(dates.map((date) => attendanceDayKey(date))));
  const wanted = dayKeys.map((dayKey) => normalizeAttendanceDate(dayKey));
  if (!wanted.length) {
    return [];
  }

  const found = await store.attendanceSession.findMany({
    where: { classId, date: { in: wanted } },
  });
  if (found.length === wanted.length) {
    return found;
  }

  const foundDates = new Set(found.map((session) => session.date.getTime()));
  await store.attendanceSession.createMany({
    data: wanted
      .filter((date) => !foundDates.has(date.getTime()))
      .map((date) => ({ classId, date })),
  });

  // createMany returns no ids on MongoDB, hence the re-read.
  return store.attendanceSession.findMany({ where: { classId, date: { in: wanted } } });
};

const findOrCreateSession = async (
  store: AttendanceStore,
  classId: string,
  date: Date | string,
) => {
  const [session] = await findOrCreateSessions(store, classId, [date]);
  return session;
};

const setAttendanceStatus = (
  store: AttendanceStore,
  sessionId: string,
  enrollmentId: string,
  status: PrismaAttendanceStatus,
) =>
  store.attendanceRecord.upsert({
    where: { sessionId_enrollmentId: { sessionId, enrollmentId } },
    update: { status },
    create: { sessionId, enrollmentId, status },
  });

const sessionDateRangeWhere = (from?: string | null, to?: string | null) => {
  if (!from && !to) {
    return {};
  }
  return {
    date: {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    },
  };
};

export const attendanceQueryResolvers = {
  attendanceDates: async (_: unknown, args: QueryAttendanceDatesArgs, context: GraphQLContext) => {
    const ownerIds = ownerIdsFrom(context);
    if (!ownerIds.length) {
      return [];
    }

    const prisma = await getPrisma();
    const classRecord = await prisma.class.findFirst({
      where: { id: args.classId, ...ownedOrInvitedWhere(ownerIds) },
    });
    if (!classRecord) {
      return [];
    }

    const weekdays: number[] = classRecord.daysOfWeek ?? [];
    const start = args.from
      ? new Date(args.from)
      : classRecord.startDate
        ? new Date(classRecord.startDate)
        : null;
    const end = args.to
      ? new Date(args.to)
      : classRecord.endDate
        ? new Date(classRecord.endDate)
        : null;
    if (!start || !end || !weekdays.length) {
      return [];
    }

    const excludedDayKeys = new Set(
      (classRecord.excludedDates ?? []).map((date) => attendanceDayKey(date)),
    );

    return eachDayBetween(start, end).filter(
      (date) => weekdays.includes(date.getUTCDay()) && !excludedDayKeys.has(attendanceDayKey(date)),
    );
  },

  attendanceRecords: async (
    _: unknown,
    args: QueryAttendanceRecordsArgs,
    context: GraphQLContext,
  ) => {
    const ownerIds = ownerIdsFrom(context);
    if (!ownerIds.length) {
      return [];
    }

    const prisma = await getPrisma();
    const classRecord = await prisma.class.findFirst({
      where: { id: args.classId, ...ownedOrInvitedWhere(ownerIds) },
    });
    if (!classRecord) {
      return [];
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: { classId: args.classId, ...sessionDateRangeWhere(args.from, args.to) },
      include: { records: true },
    });
    return sessions.flatMap((session) =>
      session.records.map((record) => ({
        ...record,
        session: { id: session.id, date: session.date },
      })),
    );
  },
};

export const attendanceMutationResolvers = {
  markAttendance: async (_: unknown, args: MutationMarkAttendanceArgs, context: GraphQLContext) => {
    const ownerIds = requireOwnerIds(context);
    await requireOwnedOrInvited(args.classId, ownerIds);
    const prisma = await getPrisma();

    if (args.status == null) {
      const session = await prisma.attendanceSession.findFirst({
        where: { classId: args.classId, date: sessionDayBounds(args.date) },
      });
      if (session) {
        await prisma.attendanceRecord.deleteMany({
          where: { sessionId: session.id, enrollmentId: args.enrollmentId },
        });
      }
      return true;
    }

    const session = await findOrCreateSession(prisma, args.classId, args.date);
    await setAttendanceStatus(
      prisma,
      session.id,
      args.enrollmentId,
      toPrismaAttendanceStatus(args.status),
    );
    return true;
  },

  markPresent: async (_: unknown, args: MutationMarkPresentArgs, context: GraphQLContext) => {
    const ownerIds = requireOwnerIds(context);
    await requireOwnedOrInvited(args.classId, ownerIds);
    if (!args.dates.length) {
      return true;
    }
    const prisma = await getPrisma();

    await prisma.$transaction(async (transaction) => {
      const enrollments = await transaction.enrollment.findMany({
        where: args.enrollmentIds?.length
          ? { id: { in: args.enrollmentIds }, classId: args.classId }
          : { classId: args.classId },
      });
      if (args.enrollmentIds?.length && enrollments.length !== args.enrollmentIds.length) {
        throw createGraphQLError("Not found");
      }
      const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
      if (!enrollmentIds.length) {
        return;
      }

      const sessions = await findOrCreateSessions(transaction, args.classId, args.dates);
      const sessionIds = sessions.map((session) => session.id);

      const existing = await transaction.attendanceRecord.findMany({
        where: { sessionId: { in: sessionIds }, enrollmentId: { in: enrollmentIds } },
        select: { sessionId: true, enrollmentId: true },
      });
      const existingCells = new Set(
        existing.map((record) => `${record.sessionId}|${record.enrollmentId}`),
      );

      await transaction.attendanceRecord.updateMany({
        where: { sessionId: { in: sessionIds }, enrollmentId: { in: enrollmentIds } },
        data: { status: PrismaAttendanceStatus.PRESENT },
      });

      const missing = sessionIds.flatMap((sessionId) =>
        enrollmentIds
          .filter((enrollmentId) => !existingCells.has(`${sessionId}|${enrollmentId}`))
          .map((enrollmentId) => ({
            sessionId,
            enrollmentId,
            status: PrismaAttendanceStatus.PRESENT,
          })),
      );
      // An empty createMany throws on MongoDB ("No documents provided to insert_many").
      if (missing.length) {
        await transaction.attendanceRecord.createMany({ data: missing });
      }
    });

    return true;
  },

  excludeAttendanceDate: async (
    _: unknown,
    args: MutationExcludeAttendanceDateArgs,
    context: GraphQLContext,
  ) => {
    const ownerIds = requireOwnerIds(context);
    const classRecord = await requireOwnedOrInvited(args.classId, ownerIds);
    const excludedDates = classRecord.excludedDates ?? [];
    const date = new Date(args.date);
    if (excludedDates.some((excluded) => attendanceDayKey(excluded) === attendanceDayKey(date))) {
      return true;
    }

    const prisma = await getPrisma();
    await prisma.class.update({
      where: { id: classRecord.id },
      data: { excludedDates: [...excludedDates, date] },
    });
    return true;
  },
};
