import type { Prisma } from "@diario/db";
import { createGraphQLError } from "graphql-yoga";
import { toPrismaShift, toPrismaWeekday } from "@/lib/graphql/db-bridge";
import { ownerIdsFrom, requireOwnerIds } from "@/lib/graphql/auth";
import { claimUnownedMapRecords } from "@/lib/graphql/map-owner-backfill";
import { DEFAULT_SUBJECT_NAMES } from "@/lib/mapa/constants";
import type {
  MutationAssignClassGroupArgs,
  MutationClearLessonCellArgs,
  MutationCreateSubjectArgs,
  MutationSaveLessonCellArgs,
} from "@/src/gql/schema";
import type { GraphQLContext } from "../context";
import { getPrisma } from "../prisma";

const ownerWhere = (ownerIds: string[]) => ({ ownerId: { in: ownerIds } });

type MapStore = Pick<
  Prisma.TransactionClient,
  "roomShift" | "classGroup" | "teacher" | "subject" | "lesson"
>;

const requireMapOwner = (context: GraphQLContext) => {
  const ownerIds = requireOwnerIds(context);
  const ownerId = ownerIds[0];
  if (!ownerId) {
    throw createGraphQLError("Unauthorized");
  }
  return { ownerIds, ownerId };
};

const normalizeName = (value: string) => value.trim().toLowerCase();

const findOrCreateClassGroup = async (
  store: MapStore,
  ownerIds: string[],
  ownerId: string,
  grade: string,
  section: string,
) => {
  const existing = await store.classGroup.findFirst({
    where: { grade, section, ...ownerWhere(ownerIds) },
  });
  if (existing) {
    return existing;
  }
  return store.classGroup.create({ data: { grade, section, ownerId } });
};

const findOrCreateRoomShift = async (
  store: MapStore,
  ownerIds: string[],
  ownerId: string,
  locationId: string,
  shift: Prisma.RoomShiftCreateInput["shift"],
) => {
  const existing = await store.roomShift.findFirst({
    where: { locationId, shift, ...ownerWhere(ownerIds) },
  });
  if (existing) {
    return existing;
  }
  return store.roomShift.create({ data: { locationId, shift, ownerId } });
};

const findOrCreateSubject = async (
  store: MapStore,
  ownerIds: string[],
  ownerId: string,
  name: string,
) => {
  const normalizedName = normalizeName(name);
  const existing = await store.subject.findFirst({
    where: { normalizedName, ...ownerWhere(ownerIds) },
  });
  if (existing) {
    return existing;
  }
  return store.subject.create({ data: { name, normalizedName, ownerId } });
};

const findOrCreateTeacher = async (
  store: MapStore,
  ownerIds: string[],
  ownerId: string,
  name: string,
) => {
  const normalizedName = normalizeName(name);
  const existing = await store.teacher.findFirst({
    where: { normalizedName, ...ownerWhere(ownerIds) },
  });
  if (existing) {
    return existing;
  }
  return store.teacher.create({ data: { name, normalizedName, ownerId } });
};

const isPrismaUniqueConflict = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  return error.code === "P2002";
};

const ensureDefaultSubjects = async (
  store: MapStore,
  ownerIds: string[],
  ownerId: string,
  existing: Awaited<ReturnType<MapStore["subject"]["findMany"]>>,
) => {
  if (existing.length) {
    return existing;
  }
  try {
    await Promise.all(
      DEFAULT_SUBJECT_NAMES.map((name) =>
        store.subject.create({
          data: { name, normalizedName: normalizeName(name), ownerId },
        }),
      ),
    );
  } catch (error) {
    if (!isPrismaUniqueConflict(error)) {
      throw error;
    }
  }
  return store.subject.findMany({ where: ownerWhere(ownerIds) });
};

export const mapQueryResolvers = {
  mapData: async (_: unknown, __: unknown, context: GraphQLContext) => {
    const prisma = await getPrisma();
    const locations = await prisma.location.findMany();
    const ownerIds = ownerIdsFrom(context);
    const ownerId = ownerIds[0];
    if (!ownerIds.length || !ownerId) {
      return { locations, roomShifts: [], subjects: [], teachers: [] };
    }
    await claimUnownedMapRecords(prisma, ownerId);
    const [roomShifts, existingSubjects, teachers] = await Promise.all([
      prisma.roomShift.findMany({
        where: ownerWhere(ownerIds),
        include: {
          location: true,
          classGroup: true,
          lessons: { include: { subject: true, teacher: true } },
        },
      }),
      prisma.subject.findMany({ where: ownerWhere(ownerIds) }),
      prisma.teacher.findMany({ where: ownerWhere(ownerIds) }),
    ]);
    const subjects = await ensureDefaultSubjects(prisma, ownerIds, ownerId, existingSubjects);
    return { locations, roomShifts, subjects, teachers };
  },
};

export const mapMutationResolvers = {
  assignClassGroup: async (
    _: unknown,
    args: MutationAssignClassGroupArgs,
    context: GraphQLContext,
  ) => {
    const { ownerIds, ownerId } = requireMapOwner(context);
    const grade = args.grade.trim();
    const section = args.section.trim();
    if (!grade || !section) {
      throw createGraphQLError("Série e turma são obrigatórias");
    }
    const prisma = await getPrisma();
    const classGroup = await findOrCreateClassGroup(prisma, ownerIds, ownerId, grade, section);
    const roomShift = await findOrCreateRoomShift(
      prisma,
      ownerIds,
      ownerId,
      args.locationId,
      toPrismaShift(args.shift),
    );
    return prisma.roomShift.update({
      where: { id: roomShift.id },
      data: { classGroupId: classGroup.id },
      include: {
        location: true,
        classGroup: true,
        lessons: { include: { subject: true, teacher: true } },
      },
    });
  },

  saveLessonCell: async (_: unknown, args: MutationSaveLessonCellArgs, context: GraphQLContext) => {
    const { ownerIds, ownerId } = requireMapOwner(context);
    const subjectName = args.subjectName.trim();
    const teacherName = args.teacherName.trim();
    if (!subjectName) {
      throw createGraphQLError("Disciplina é obrigatória");
    }
    if (!teacherName) {
      throw createGraphQLError("Professor é obrigatório");
    }
    const shift = toPrismaShift(args.shift);
    const weekday = toPrismaWeekday(args.weekday);
    const prisma = await getPrisma();

    return prisma.$transaction(async (transaction) => {
      const subject = await findOrCreateSubject(transaction, ownerIds, ownerId, subjectName);
      const teacher = await findOrCreateTeacher(transaction, ownerIds, ownerId, teacherName);
      const roomShift = await findOrCreateRoomShift(
        transaction,
        ownerIds,
        ownerId,
        args.locationId,
        shift,
      );

      return transaction.lesson.upsert({
        where: {
          roomShiftId_weekday_period: {
            roomShiftId: roomShift.id,
            weekday,
            period: args.period,
          },
        },
        update: { subjectId: subject.id, teacherId: teacher.id },
        create: {
          roomShiftId: roomShift.id,
          weekday,
          period: args.period,
          subjectId: subject.id,
          teacherId: teacher.id,
        },
        include: { subject: true, teacher: true },
      });
    });
  },

  clearLessonCell: async (
    _: unknown,
    args: MutationClearLessonCellArgs,
    context: GraphQLContext,
  ) => {
    const { ownerIds } = requireMapOwner(context);
    const shift = toPrismaShift(args.shift);
    const weekday = toPrismaWeekday(args.weekday);
    const prisma = await getPrisma();
    const roomShift = await prisma.roomShift.findFirst({
      where: { locationId: args.locationId, shift, ...ownerWhere(ownerIds) },
    });
    if (!roomShift) {
      return true;
    }
    await prisma.lesson.deleteMany({
      where: { roomShiftId: roomShift.id, weekday, period: args.period },
    });
    return true;
  },

  createSubject: async (_: unknown, args: MutationCreateSubjectArgs, context: GraphQLContext) => {
    const { ownerIds, ownerId } = requireMapOwner(context);
    const name = args.name.trim();
    if (!name) {
      throw createGraphQLError("Nome da disciplina é obrigatório");
    }
    const prisma = await getPrisma();
    return findOrCreateSubject(prisma, ownerIds, ownerId, name);
  },
};
