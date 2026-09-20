import { describe, expect, it } from "vitest";
import { Shift, Weekday } from "@/src/gql/schema";
import {
  anonymousContext,
  teacherContext,
  TEACHER_OWNER_IDS,
  TEACHER_PRISMA_ID,
} from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import { MAP_OWNER_COLLECTIONS, ownerBackfillUpdateCommand } from "../map-owner-backfill";
import { mapMutationResolvers, mapQueryResolvers } from "./map";

const LOCATION_ID = "location-1";
const ROOM_SHIFT_ID = "room-shift-1";
const CLASS_GROUP_ID = "class-group-1";
const SUBJECT_ID = "subject-1";
const TEACHER_ID = "teacher-1";
const LESSON_ID = "lesson-1";

const OWNER_WHERE = { ownerId: { in: TEACHER_OWNER_IDS } };

describe("mapQueryResolvers.mapData", () => {
  it("ensures campus locations even for anonymous users", async () => {
    const location = { id: LOCATION_ID, code: "07", kind: "ROOM", name: "Sala 07" };
    prismaMock.location.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([location]);
    prismaMock.location.create.mockResolvedValue(location);

    await expect(mapQueryResolvers.mapData(null, {}, anonymousContext)).resolves.toEqual({
      locations: [location],
      roomShifts: [],
      subjects: [],
      teachers: [],
    });
    expect(prismaMock.location.create).toHaveBeenCalled();
  });

  it("returns campus locations and empty user data for anonymous users", async () => {
    const location = { id: LOCATION_ID, code: "07", kind: "ROOM", name: "Sala 07" };
    prismaMock.location.findMany.mockResolvedValue([location]);

    await expect(mapQueryResolvers.mapData(null, {}, anonymousContext)).resolves.toEqual({
      locations: [location],
      roomShifts: [],
      subjects: [],
      teachers: [],
    });
    expect(prismaMock.$runCommandRaw).not.toHaveBeenCalled();
  });

  it("reads this user's map data in one round trip", async () => {
    const location = { id: LOCATION_ID, code: "07", kind: "ROOM", name: "Sala 07" };
    const roomShift = { id: ROOM_SHIFT_ID, locationId: LOCATION_ID, shift: "MATUTINO" };
    const subject = { id: SUBJECT_ID, name: "Inglês", normalizedName: "inglês" };
    const teacher = { id: TEACHER_ID, name: "Prof. Ana", normalizedName: "prof. ana" };
    prismaMock.location.findMany.mockResolvedValue([location]);
    prismaMock.roomShift.findMany.mockResolvedValue([roomShift]);
    prismaMock.subject.findMany.mockResolvedValue([subject]);
    prismaMock.teacher.findMany.mockResolvedValue([teacher]);

    await expect(mapQueryResolvers.mapData(null, {}, teacherContext)).resolves.toEqual({
      locations: [location],
      roomShifts: [roomShift],
      subjects: [subject],
      teachers: [teacher],
    });
    expect(prismaMock.roomShift.findMany).toHaveBeenCalledWith({
      where: OWNER_WHERE,
      include: {
        location: true,
        classGroup: true,
        lessons: { include: { subject: true, teacher: true } },
      },
    });
    expect(prismaMock.subject.findMany).toHaveBeenCalledWith({ where: OWNER_WHERE });
    expect(prismaMock.teacher.findMany).toHaveBeenCalledWith({ where: OWNER_WHERE });
  });

  it("claims map rows that still have no ownerId before reading", async () => {
    prismaMock.location.findMany.mockResolvedValue([]);
    prismaMock.roomShift.findMany.mockResolvedValue([]);
    prismaMock.subject.findMany.mockResolvedValue([{ id: SUBJECT_ID }]);
    prismaMock.teacher.findMany.mockResolvedValue([]);

    await mapQueryResolvers.mapData(null, {}, teacherContext);

    expect(prismaMock.$runCommandRaw).toHaveBeenCalledTimes(MAP_OWNER_COLLECTIONS.length);
    for (const collection of MAP_OWNER_COLLECTIONS) {
      expect(prismaMock.$runCommandRaw).toHaveBeenCalledWith(
        ownerBackfillUpdateCommand(collection, TEACHER_PRISMA_ID),
      );
    }
  });

  it("still returns campus locations when owner backfill fails", async () => {
    const location = { id: LOCATION_ID, code: "07", kind: "ROOM", name: "Sala 07" };
    prismaMock.location.findMany.mockResolvedValue([location]);
    prismaMock.$runCommandRaw.mockRejectedValue(new Error("backfill failed"));
    prismaMock.roomShift.findMany.mockResolvedValue([]);
    prismaMock.subject.findMany.mockResolvedValue([{ id: SUBJECT_ID }]);
    prismaMock.teacher.findMany.mockResolvedValue([]);

    await expect(mapQueryResolvers.mapData(null, {}, teacherContext)).resolves.toEqual({
      locations: [location],
      roomShifts: [],
      subjects: [{ id: SUBJECT_ID }],
      teachers: [],
    });
  });

  it("seeds the default subjects for a user who has none yet", async () => {
    prismaMock.location.findMany.mockResolvedValue([]);
    prismaMock.roomShift.findMany.mockResolvedValue([]);
    prismaMock.subject.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: SUBJECT_ID }]);
    prismaMock.teacher.findMany.mockResolvedValue([]);
    prismaMock.subject.create.mockResolvedValue({ id: SUBJECT_ID });

    const result = await mapQueryResolvers.mapData(null, {}, teacherContext);

    expect(prismaMock.subject.create).toHaveBeenCalled();
    expect(result.subjects).toEqual([{ id: SUBJECT_ID }]);
  });

  it("still returns subjects when default-subject creates race on the unique owner key", async () => {
    prismaMock.location.findMany.mockResolvedValue([]);
    prismaMock.roomShift.findMany.mockResolvedValue([]);
    prismaMock.subject.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: SUBJECT_ID }]);
    prismaMock.teacher.findMany.mockResolvedValue([]);
    prismaMock.subject.create.mockRejectedValue({ code: "P2002" });

    const result = await mapQueryResolvers.mapData(null, {}, teacherContext);

    expect(result.subjects).toEqual([{ id: SUBJECT_ID }]);
  });
});

describe("mapMutationResolvers.assignClassGroup", () => {
  const args = { locationId: LOCATION_ID, shift: Shift.Matutino, grade: "9º", section: "A" };

  it("rejects anonymous users", async () => {
    await expect(
      mapMutationResolvers.assignClassGroup(null, args, anonymousContext),
    ).rejects.toThrow("Unauthorized");
  });

  it("rejects blank grade or section", async () => {
    await expect(
      mapMutationResolvers.assignClassGroup(
        null,
        { ...args, grade: "  ", section: "A" },
        teacherContext,
      ),
    ).rejects.toThrow();
  });

  it("reuses an existing class group instead of creating a duplicate", async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue({
      id: CLASS_GROUP_ID,
      grade: "9º",
      section: "A",
    });
    prismaMock.roomShift.findFirst.mockResolvedValue({
      id: ROOM_SHIFT_ID,
      locationId: LOCATION_ID,
      shift: "MATUTINO",
    });
    prismaMock.roomShift.update.mockResolvedValue({ id: ROOM_SHIFT_ID });

    await mapMutationResolvers.assignClassGroup(null, args, teacherContext);

    expect(prismaMock.classGroup.create).not.toHaveBeenCalled();
    expect(prismaMock.classGroup.findFirst).toHaveBeenCalledWith({
      where: { grade: "9º", section: "A", ...OWNER_WHERE },
    });
  });

  it("creates the class group when it doesn't exist yet", async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue(null);
    prismaMock.classGroup.create.mockResolvedValue({
      id: CLASS_GROUP_ID,
      grade: "9º",
      section: "A",
    });
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.roomShift.update.mockResolvedValue({ id: ROOM_SHIFT_ID });

    await mapMutationResolvers.assignClassGroup(null, args, teacherContext);

    expect(prismaMock.classGroup.create).toHaveBeenCalledWith({
      data: { grade: "9º", section: "A", ownerId: TEACHER_PRISMA_ID },
    });
  });

  it("creates the room shift on demand when it doesn't exist yet", async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue({ id: CLASS_GROUP_ID });
    prismaMock.roomShift.findFirst.mockResolvedValue(null);
    prismaMock.roomShift.create.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.roomShift.update.mockResolvedValue({ id: ROOM_SHIFT_ID });

    await mapMutationResolvers.assignClassGroup(null, args, teacherContext);

    expect(prismaMock.roomShift.create).toHaveBeenCalledWith({
      data: { locationId: LOCATION_ID, shift: "MATUTINO", ownerId: TEACHER_PRISMA_ID },
    });
  });

  it("sets the room shift's class group", async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue({ id: CLASS_GROUP_ID });
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.roomShift.update.mockResolvedValue({
      id: ROOM_SHIFT_ID,
      classGroupId: CLASS_GROUP_ID,
    });

    await mapMutationResolvers.assignClassGroup(null, args, teacherContext);

    expect(prismaMock.roomShift.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ROOM_SHIFT_ID },
        data: { classGroupId: CLASS_GROUP_ID },
      }),
    );
  });
});

describe("mapMutationResolvers.saveLessonCell", () => {
  const args = {
    locationId: LOCATION_ID,
    shift: Shift.Matutino,
    weekday: Weekday.Seg,
    period: 1,
    subjectName: "Inglês",
    teacherName: "Prof. Ana",
  };

  it("rejects anonymous users", async () => {
    await expect(mapMutationResolvers.saveLessonCell(null, args, anonymousContext)).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("rejects a blank subject name", async () => {
    await expect(
      mapMutationResolvers.saveLessonCell(null, { ...args, subjectName: "  " }, teacherContext),
    ).rejects.toThrow();
  });

  it("rejects a blank teacher name", async () => {
    await expect(
      mapMutationResolvers.saveLessonCell(null, { ...args, teacherName: "  " }, teacherContext),
    ).rejects.toThrow();
  });

  it("reuses an existing subject case-insensitively instead of creating a duplicate", async () => {
    prismaMock.subject.findFirst.mockResolvedValue({
      id: SUBJECT_ID,
      name: "Inglês",
      normalizedName: "inglês",
    });
    prismaMock.teacher.findFirst.mockResolvedValue({ id: TEACHER_ID });
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.lesson.findFirst.mockResolvedValue(null);
    prismaMock.lesson.create.mockResolvedValue({ id: LESSON_ID });

    await mapMutationResolvers.saveLessonCell(
      null,
      { ...args, subjectName: "INGLÊS" },
      teacherContext,
    );

    expect(prismaMock.subject.findFirst).toHaveBeenCalledWith({
      where: { normalizedName: "inglês", ...OWNER_WHERE },
    });
    expect(prismaMock.subject.create).not.toHaveBeenCalled();
  });

  it("creates the subject when it doesn't exist yet", async () => {
    prismaMock.subject.findFirst.mockResolvedValue(null);
    prismaMock.subject.create.mockResolvedValue({ id: SUBJECT_ID });
    prismaMock.teacher.findFirst.mockResolvedValue({ id: TEACHER_ID });
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.lesson.findFirst.mockResolvedValue(null);
    prismaMock.lesson.create.mockResolvedValue({ id: LESSON_ID });

    await mapMutationResolvers.saveLessonCell(null, args, teacherContext);

    expect(prismaMock.subject.create).toHaveBeenCalledWith({
      data: { name: "Inglês", normalizedName: "inglês", ownerId: TEACHER_PRISMA_ID },
    });
  });

  it("reuses an existing teacher case-insensitively instead of creating a duplicate", async () => {
    prismaMock.subject.findFirst.mockResolvedValue({ id: SUBJECT_ID });
    prismaMock.teacher.findFirst.mockResolvedValue({
      id: TEACHER_ID,
      name: "Prof. Ana",
      normalizedName: "prof. ana",
    });
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.lesson.findFirst.mockResolvedValue(null);
    prismaMock.lesson.create.mockResolvedValue({ id: LESSON_ID });

    await mapMutationResolvers.saveLessonCell(
      null,
      { ...args, teacherName: "prof. ana" },
      teacherContext,
    );

    expect(prismaMock.teacher.findFirst).toHaveBeenCalledWith({
      where: { normalizedName: "prof. ana", ...OWNER_WHERE },
    });
    expect(prismaMock.teacher.create).not.toHaveBeenCalled();
  });

  it("creates the room shift on demand when it doesn't exist yet", async () => {
    prismaMock.subject.findFirst.mockResolvedValue({ id: SUBJECT_ID });
    prismaMock.teacher.findFirst.mockResolvedValue({ id: TEACHER_ID });
    prismaMock.roomShift.findFirst.mockResolvedValue(null);
    prismaMock.roomShift.create.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.lesson.findFirst.mockResolvedValue(null);
    prismaMock.lesson.create.mockResolvedValue({ id: LESSON_ID });

    await mapMutationResolvers.saveLessonCell(null, args, teacherContext);

    expect(prismaMock.roomShift.create).toHaveBeenCalledWith({
      data: { locationId: LOCATION_ID, shift: "MATUTINO", ownerId: TEACHER_PRISMA_ID },
    });
  });

  it("creates the teacher when it doesn't exist yet", async () => {
    prismaMock.subject.findFirst.mockResolvedValue({ id: SUBJECT_ID });
    prismaMock.teacher.findFirst.mockResolvedValue(null);
    prismaMock.teacher.create.mockResolvedValue({ id: TEACHER_ID });
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.lesson.findFirst.mockResolvedValue(null);
    prismaMock.lesson.create.mockResolvedValue({ id: LESSON_ID });

    await mapMutationResolvers.saveLessonCell(null, args, teacherContext);

    expect(prismaMock.teacher.create).toHaveBeenCalledWith({
      data: { name: "Prof. Ana", normalizedName: "prof. ana", ownerId: TEACHER_PRISMA_ID },
    });
  });

  it("creates the lesson on the room shift/weekday/period key", async () => {
    prismaMock.subject.findFirst.mockResolvedValue({ id: SUBJECT_ID });
    prismaMock.teacher.findFirst.mockResolvedValue({ id: TEACHER_ID });
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.lesson.findFirst.mockResolvedValue(null);
    prismaMock.lesson.create.mockResolvedValue({ id: LESSON_ID });

    await mapMutationResolvers.saveLessonCell(null, args, teacherContext);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.lesson.create).toHaveBeenCalledWith({
      data: {
        roomShiftId: ROOM_SHIFT_ID,
        weekday: "SEG",
        period: 1,
        subjectId: SUBJECT_ID,
        teacherId: TEACHER_ID,
      },
      include: { subject: true, teacher: true },
    });
  });

  it("updates the lesson when that cell already exists", async () => {
    prismaMock.subject.findFirst.mockResolvedValue({ id: SUBJECT_ID });
    prismaMock.teacher.findFirst.mockResolvedValue({ id: TEACHER_ID });
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.lesson.findFirst.mockResolvedValue({ id: LESSON_ID });
    prismaMock.lesson.update.mockResolvedValue({ id: LESSON_ID });

    await mapMutationResolvers.saveLessonCell(null, args, teacherContext);

    expect(prismaMock.lesson.create).not.toHaveBeenCalled();
    expect(prismaMock.lesson.update).toHaveBeenCalledWith({
      where: { id: LESSON_ID },
      data: { subjectId: SUBJECT_ID, teacherId: TEACHER_ID },
      include: { subject: true, teacher: true },
    });
  });

  it("creates the campus location from the floor-plan code when no id is sent", async () => {
    prismaMock.location.findUnique.mockResolvedValue(null);
    prismaMock.location.create.mockResolvedValue({ id: LOCATION_ID, code: "07" });
    prismaMock.subject.findFirst.mockResolvedValue({ id: SUBJECT_ID });
    prismaMock.teacher.findFirst.mockResolvedValue({ id: TEACHER_ID });
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.lesson.findFirst.mockResolvedValue(null);
    prismaMock.lesson.create.mockResolvedValue({ id: LESSON_ID });

    await mapMutationResolvers.saveLessonCell(
      null,
      { ...args, locationId: undefined, locationCode: "07" },
      teacherContext,
    );

    expect(prismaMock.location.create).toHaveBeenCalledWith({
      data: { code: "07", name: "Sala 07", kind: "ROOM" },
    });
  });
});

describe("mapMutationResolvers.clearLessonCell", () => {
  const args = { locationId: LOCATION_ID, shift: Shift.Matutino, weekday: Weekday.Seg, period: 1 };

  it("rejects anonymous users", async () => {
    await expect(
      mapMutationResolvers.clearLessonCell(null, args, anonymousContext),
    ).rejects.toThrow("Unauthorized");
  });

  it("is a no-op when the room shift doesn't exist yet", async () => {
    prismaMock.roomShift.findFirst.mockResolvedValue(null);

    await expect(mapMutationResolvers.clearLessonCell(null, args, teacherContext)).resolves.toBe(
      true,
    );
    expect(prismaMock.lesson.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes the matching lesson", async () => {
    prismaMock.roomShift.findFirst.mockResolvedValue({ id: ROOM_SHIFT_ID });
    prismaMock.lesson.deleteMany.mockResolvedValue({ count: 1 });

    await expect(mapMutationResolvers.clearLessonCell(null, args, teacherContext)).resolves.toBe(
      true,
    );
    expect(prismaMock.lesson.deleteMany).toHaveBeenCalledWith({
      where: { roomShiftId: ROOM_SHIFT_ID, weekday: "SEG", period: 1 },
    });
  });
});

describe("mapMutationResolvers.createSubject", () => {
  it("rejects anonymous users", async () => {
    await expect(
      mapMutationResolvers.createSubject(null, { name: "Filosofia" }, anonymousContext),
    ).rejects.toThrow("Unauthorized");
  });

  it("rejects a blank name", async () => {
    await expect(
      mapMutationResolvers.createSubject(null, { name: "  " }, teacherContext),
    ).rejects.toThrow();
  });

  it("reuses an existing subject case-insensitively instead of creating a duplicate", async () => {
    prismaMock.subject.findFirst.mockResolvedValue({ id: SUBJECT_ID, name: "Filosofia" });

    await mapMutationResolvers.createSubject(null, { name: "FILOSOFIA" }, teacherContext);

    expect(prismaMock.subject.findFirst).toHaveBeenCalledWith({
      where: { normalizedName: "filosofia", ...OWNER_WHERE },
    });
    expect(prismaMock.subject.create).not.toHaveBeenCalled();
  });

  it("creates the subject when it doesn't exist yet", async () => {
    prismaMock.subject.findFirst.mockResolvedValue(null);
    prismaMock.subject.create.mockResolvedValue({ id: SUBJECT_ID, name: "Filosofia" });

    await expect(
      mapMutationResolvers.createSubject(null, { name: "Filosofia" }, teacherContext),
    ).resolves.toEqual({ id: SUBJECT_ID, name: "Filosofia" });
    expect(prismaMock.subject.create).toHaveBeenCalledWith({
      data: { name: "Filosofia", normalizedName: "filosofia", ownerId: TEACHER_PRISMA_ID },
    });
  });
});
