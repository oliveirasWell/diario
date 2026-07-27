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
import type {
  MutationExcludeAttendanceDateArgs,
  MutationMarkAllPresentArgs,
  MutationMarkAttendanceArgs,
  MutationMarkEnrollmentPresentForDatesArgs,
  QueryAttendanceDatesArgs,
  QueryAttendanceRecordsArgs,
} from "@/src/gql/schema";

type AttendanceStore = Pick<Prisma.TransactionClient, "attendanceSession" | "attendanceRecord">;

async function findOrCreateSessions(
  store: AttendanceStore,
  classId: string,
  dates: (Date | string)[],
) {
  const dayKeys = Array.from(new Set(dates.map((date) => attendanceDayKey(date)))).sort();
  if (!dayKeys.length) {
    return [];
  }

  const sessions = await store.attendanceSession.findMany({
    where: {
      classId,
      date: {
        gte: sessionDayBounds(dayKeys[0]).gte,
        lte: sessionDayBounds(dayKeys[dayKeys.length - 1]).lte,
      },
    },
  });

  const requested = new Set(dayKeys);
  const found = sessions.filter((session) => requested.has(attendanceDayKey(session.date)));
  const foundDayKeys = new Set(found.map((session) => attendanceDayKey(session.date)));
  const created = await Promise.all(
    dayKeys
      .filter((dayKey) => !foundDayKeys.has(dayKey))
      .map((dayKey) =>
        store.attendanceSession.create({
          data: { classId, date: normalizeAttendanceDate(dayKey) },
        }),
      ),
  );

  return [...found, ...created];
}

async function findOrCreateSession(store: AttendanceStore, classId: string, date: Date | string) {
  const [session] = await findOrCreateSessions(store, classId, [date]);
  return session;
}

function setAttendanceStatus(
  store: AttendanceStore,
  sessionId: string,
  enrollmentId: string,
  status: PrismaAttendanceStatus,
) {
  return store.attendanceRecord.upsert({
    where: { sessionId_enrollmentId: { sessionId, enrollmentId } },
    update: { status },
    create: { sessionId, enrollmentId, status },
  });
}

function sessionDateRangeWhere(from?: string | null, to?: string | null) {
  if (!from && !to) {
    return {};
  }
  return {
    date: {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    },
  };
}

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

  markAllPresent: async (_: unknown, args: MutationMarkAllPresentArgs, context: GraphQLContext) => {
    const ownerIds = requireOwnerIds(context);
    await requireOwnedOrInvited(args.classId, ownerIds);
    const prisma = await getPrisma();

    // Fora de transação: cada upsert é idempotente, e uma turma grande não cabe
    // no timeout de 5s de uma transação interativa.
    const session = await findOrCreateSession(prisma, args.classId, args.date);
    const enrollments = await prisma.enrollment.findMany({ where: { classId: args.classId } });
    await Promise.all(
      enrollments.map((enrollment) =>
        setAttendanceStatus(prisma, session.id, enrollment.id, PrismaAttendanceStatus.PRESENT),
      ),
    );

    return true;
  },

  markEnrollmentPresentForDates: async (
    _: unknown,
    args: MutationMarkEnrollmentPresentForDatesArgs,
    context: GraphQLContext,
  ) => {
    const ownerIds = requireOwnerIds(context);
    await requireOwnedOrInvited(args.classId, ownerIds);
    const prisma = await getPrisma();

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: args.enrollmentId, classId: args.classId },
    });
    if (!enrollment) {
      throw new Error("Not found");
    }

    // Fora de transação: cada upsert é idempotente, e um semestre inteiro de datas
    // não cabe no timeout de 5s de uma transação interativa.
    const sessions = await findOrCreateSessions(prisma, args.classId, args.dates);
    await Promise.all(
      sessions.map((session) =>
        setAttendanceStatus(prisma, session.id, args.enrollmentId, PrismaAttendanceStatus.PRESENT),
      ),
    );

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
