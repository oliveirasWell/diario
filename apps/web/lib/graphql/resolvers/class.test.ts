import { afterEach, describe, expect, it, vi } from "vitest";
import {
  anonymousContext,
  teacherContext,
  TEACHER_OWNER_IDS,
  TEACHER_PRISMA_ID,
} from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import { classFieldResolvers, classMutationResolvers, classQueryResolvers } from "./class";

const CLASS_ID = "class-1";
const OTHER_USER_ID = "user-2";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("classFieldResolvers.Class", () => {
  it("defaults daysOfWeek to an empty list", () => {
    expect(classFieldResolvers.Class.daysOfWeek({})).toEqual([]);
  });

  it("resolves the owner user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: TEACHER_PRISMA_ID, name: "Owner" });

    await expect(classFieldResolvers.Class.owner({ ownerId: TEACHER_PRISMA_ID })).resolves.toEqual({
      id: TEACHER_PRISMA_ID,
      name: "Owner",
    });
  });

  it("shows the invited users to the owner", async () => {
    await expect(
      classFieldResolvers.Class.invitedUserIds(
        { ownerId: TEACHER_PRISMA_ID, invitedUserIds: [OTHER_USER_ID] },
        null,
        teacherContext,
      ),
    ).resolves.toEqual([OTHER_USER_ID]);
  });

  it("hides the invited users from everyone else", async () => {
    await expect(
      classFieldResolvers.Class.invitedUserIds(
        { ownerId: OTHER_USER_ID, invitedUserIds: [TEACHER_PRISMA_ID] },
        null,
        teacherContext,
      ),
    ).resolves.toEqual([]);
  });
});

describe("classQueryResolvers.classes", () => {
  it("returns nothing for anonymous users", async () => {
    await expect(classQueryResolvers.classes(null, null, anonymousContext)).resolves.toEqual([]);
  });

  it("returns the owned and invited classes", async () => {
    prismaMock.class.findMany.mockResolvedValue([{ id: CLASS_ID }]);

    await expect(classQueryResolvers.classes(null, null, teacherContext)).resolves.toEqual([
      { id: CLASS_ID },
    ]);
    expect(prismaMock.class.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { ownerId: { in: TEACHER_OWNER_IDS } },
          { invitedUserIds: { hasSome: TEACHER_OWNER_IDS } },
        ],
      },
    });
  });
});

describe("classQueryResolvers.class", () => {
  it("returns null for anonymous users", async () => {
    await expect(
      classQueryResolvers.class(null, { id: CLASS_ID }, anonymousContext),
    ).resolves.toBeNull();
  });

  it("returns an accessible class", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });

    await expect(
      classQueryResolvers.class(null, { id: CLASS_ID }, teacherContext),
    ).resolves.toEqual({ id: CLASS_ID });
  });
});

describe("classQueryResolvers.classInviteInfo", () => {
  it("returns null for an unknown class", async () => {
    prismaMock.class.findUnique.mockResolvedValue(null);

    await expect(classQueryResolvers.classInviteInfo(null, { id: "missing" })).resolves.toBeNull();
  });

  it("exposes only the class name and the owner name", async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: CLASS_ID,
      name: "Math",
      ownerId: TEACHER_PRISMA_ID,
    });
    prismaMock.user.findUnique.mockResolvedValue({ name: "Owner" });

    await expect(classQueryResolvers.classInviteInfo(null, { id: CLASS_ID })).resolves.toEqual({
      id: CLASS_ID,
      name: "Math",
      ownerName: "Owner",
    });
  });
});

describe("classMutationResolvers.updateClassSchedule", () => {
  it("stores the new weekdays and dates", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID, daysOfWeek: [1] });

    await classMutationResolvers.updateClassSchedule(
      null,
      { id: CLASS_ID, daysOfWeek: [2], startDate: "2026-01-01", endDate: null },
      teacherContext,
    );

    expect(prismaMock.class.update).toHaveBeenCalledWith({
      where: { id: CLASS_ID },
      data: { daysOfWeek: [2], startDate: new Date("2026-01-01"), endDate: null },
    });
  });
});

describe("classMutationResolvers.renameClass", () => {
  it("rejects a blank name", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });

    await expect(
      classMutationResolvers.renameClass(null, { id: CLASS_ID, name: " " }, teacherContext),
    ).rejects.toThrow("Nome é obrigatório");
  });

  it("trims the new name", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });

    await classMutationResolvers.renameClass(
      null,
      { id: CLASS_ID, name: "  Physics  " },
      teacherContext,
    );

    expect(prismaMock.class.update).toHaveBeenCalledWith({
      where: { id: CLASS_ID },
      data: { name: "Physics" },
    });
  });
});

describe("classMutationResolvers.deleteClass", () => {
  it("deletes the dependent data before the class", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.attendanceSession.findMany.mockResolvedValue([{ id: "session-1" }]);
    prismaMock.evaluation.findMany.mockResolvedValue([{ id: "evaluation-1" }]);

    await expect(
      classMutationResolvers.deleteClass(null, { id: CLASS_ID }, teacherContext),
    ).resolves.toBe(true);

    expect(prismaMock.attendanceRecord.deleteMany).toHaveBeenCalledWith({
      where: { sessionId: { in: ["session-1"] } },
    });
    expect(prismaMock.grade.deleteMany).toHaveBeenCalledWith({
      where: { evaluationId: { in: ["evaluation-1"] } },
    });
    expect(prismaMock.class.delete).toHaveBeenCalledWith({ where: { id: CLASS_ID } });
  });
});

describe("classMutationResolvers.createInviteLink", () => {
  it("builds the link from NEXTAUTH_URL", async () => {
    vi.stubEnv("NEXTAUTH_URL", "https://diario.test");
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });

    await expect(
      classMutationResolvers.createInviteLink(null, { classId: CLASS_ID }, teacherContext),
    ).resolves.toBe(`https://diario.test/invite/${CLASS_ID}`);
  });

  it("falls back to localhost", async () => {
    vi.stubEnv("NEXTAUTH_URL", "");
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });

    await expect(
      classMutationResolvers.createInviteLink(null, { classId: CLASS_ID }, teacherContext),
    ).resolves.toBe(`http://localhost:3000/invite/${CLASS_ID}`);
  });
});

describe("classMutationResolvers.acceptInvite", () => {
  it("throws for an unknown class", async () => {
    prismaMock.class.findUnique.mockResolvedValue(null);

    await expect(
      classMutationResolvers.acceptInvite(null, { id: "missing" }, teacherContext),
    ).rejects.toThrow("Not found");
  });

  it("is a no-op when the user is already invited", async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: CLASS_ID,
      invitedUserIds: [TEACHER_PRISMA_ID],
    });

    await expect(
      classMutationResolvers.acceptInvite(null, { id: CLASS_ID }, teacherContext),
    ).resolves.toEqual({ id: CLASS_ID, invitedUserIds: [TEACHER_PRISMA_ID] });
    expect(prismaMock.class.update).not.toHaveBeenCalled();
  });

  it("adds the user to the invited list", async () => {
    prismaMock.class.findUnique.mockResolvedValue({ id: CLASS_ID, invitedUserIds: [] });
    prismaMock.class.update.mockResolvedValue({
      id: CLASS_ID,
      invitedUserIds: [TEACHER_PRISMA_ID],
    });

    await expect(
      classMutationResolvers.acceptInvite(null, { id: CLASS_ID }, teacherContext),
    ).resolves.toEqual({ id: CLASS_ID, invitedUserIds: [TEACHER_PRISMA_ID] });
    expect(prismaMock.class.update).toHaveBeenCalledWith({
      where: { id: CLASS_ID },
      data: { invitedUserIds: { push: TEACHER_PRISMA_ID } },
    });
  });
});
