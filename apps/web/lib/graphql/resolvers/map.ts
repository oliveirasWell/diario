import type { Prisma } from "@diario/db";
import { createGraphQLError } from "graphql-yoga";
import { toPrismaShift, toPrismaWeekday } from "@/lib/graphql/db-bridge";
import type {
  MutationAssignClassGroupArgs,
  MutationClearLessonCellArgs,
  MutationCreateSubjectArgs,
  MutationSaveLessonCellArgs,
} from "@/src/gql/schema";
import type { GraphQLContext } from "../context";
import { getPrisma } from "../prisma";

const emptyMapData = { locations: [], roomShifts: [], subjects: [], teachers: [] };

type MapStore = Pick<
  Prisma.TransactionClient,
  "roomShift" | "classGroup" | "teacher" | "subject" | "lesson"
>;

const normalizeName = (value: string) => value.trim().toLowerCase();

const requireAuthenticatedUser = (context: GraphQLContext) => {
  if (!context.user) {
    throw createGraphQLError("Unauthorized");
  }
};

const findOrCreateClassGroup = async (store: MapStore, grade: string, section: string) => {
  const existing = await store.classGroup.findFirst({ where: { grade, section } });
  if (existing) {
    return existing;
  }
  return store.classGroup.create({ data: { grade, section } });
};

const findOrCreateRoomShift = async (
  store: MapStore,
  locationId: string,
  shift: Prisma.RoomShiftCreateInput["shift"],
) => {
  const existing = await store.roomShift.findFirst({ where: { locationId, shift } });
  if (existing) {
    return existing;
  }
  return store.roomShift.create({ data: { locationId, shift } });
};

const findOrCreateSubject = async (store: MapStore, name: string) => {
  const normalizedName = normalizeName(name);
  const existing = await store.subject.findFirst({ where: { normalizedName } });
  if (existing) {
    return existing;
  }
  return store.subject.create({ data: { name, normalizedName } });
};

const findOrCreateTeacher = async (store: MapStore, name: string) => {
  const normalizedName = normalizeName(name);
  const existing = await store.teacher.findFirst({ where: { normalizedName } });
  if (existing) {
    return existing;
  }
  return store.teacher.create({ data: { name, normalizedName } });
};

export const mapQueryResolvers = {
  mapData: async (_: unknown, __: unknown, context: GraphQLContext) => {
    if (!context.user) {
      return emptyMapData;
    }
    const prisma = await getPrisma();
    const [locations, roomShifts, subjects, teachers] = await Promise.all([
      prisma.location.findMany(),
      prisma.roomShift.findMany({
        include: {
          location: true,
          classGroup: true,
          lessons: { include: { subject: true, teacher: true } },
        },
      }),
      prisma.subject.findMany(),
      prisma.teacher.findMany(),
    ]);
    return { locations, roomShifts, subjects, teachers };
  },
};

export const mapMutationResolvers = {
  assignClassGroup: async (
    _: unknown,
    args: MutationAssignClassGroupArgs,
    context: GraphQLContext,
  ) => {
    requireAuthenticatedUser(context);
    const grade = args.grade.trim();
    const section = args.section.trim();
    if (!grade || !section) {
      throw createGraphQLError("Série e turma são obrigatórias");
    }
    const prisma = await getPrisma();
    const classGroup = await findOrCreateClassGroup(prisma, grade, section);
    const roomShift = await findOrCreateRoomShift(
      prisma,
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

  saveLessonCell: async (
    _: unknown,
    args: MutationSaveLessonCellArgs,
    context: GraphQLContext,
  ) => {
    requireAuthenticatedUser(context);
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
      const subject = await findOrCreateSubject(transaction, subjectName);
      const teacher = await findOrCreateTeacher(transaction, teacherName);
      const roomShift = await findOrCreateRoomShift(transaction, args.locationId, shift);

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
    requireAuthenticatedUser(context);
    const shift = toPrismaShift(args.shift);
    const weekday = toPrismaWeekday(args.weekday);
    const prisma = await getPrisma();
    const roomShift = await prisma.roomShift.findFirst({
      where: { locationId: args.locationId, shift },
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
    requireAuthenticatedUser(context);
    const name = args.name.trim();
    if (!name) {
      throw createGraphQLError("Nome da disciplina é obrigatório");
    }
    const prisma = await getPrisma();
    return findOrCreateSubject(prisma, name);
  },
};
