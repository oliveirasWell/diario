import { beforeEach, describe, expect, it, vi } from "vitest";
import { classFieldResolvers, classMutationResolvers, classQueryResolvers } from "./class";

const prisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  attendanceRecord: { deleteMany: vi.fn() },
  attendanceSession: { deleteMany: vi.fn(), findMany: vi.fn() },
  class: {
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  enrollment: { deleteMany: vi.fn() },
  evaluation: { deleteMany: vi.fn(), findMany: vi.fn() },
  grade: { deleteMany: vi.fn() },
  user: { findUnique: vi.fn() },
}));

vi.mock("../prisma", () => ({
  getPrisma: async () => prisma,
}));

const ctx = { user: { id: "next-1", prismaUserId: "u1" } } as any;
const anon = { user: null } as any;

beforeEach(() => {
  vi.resetAllMocks();
  prisma.$transaction.mockImplementation(async (fn: (tx: any) => unknown) => fn(prisma));
  delete process.env.NEXTAUTH_URL;
});

describe("class resolvers", () => {
  it("resolves class fields", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: "u1", name: "Owner" });

    expect(classFieldResolvers.Class.daysOfWeek({})).toEqual([]);
    await expect(classFieldResolvers.Class.owner({ ownerId: "u1" })).resolves.toEqual({
      id: "u1",
      name: "Owner",
    });
    await expect(
      classFieldResolvers.Class.invitedUserIds(
        { ownerId: "u1", invitedUserIds: ["u2"] },
        null,
        ctx,
      ),
    ).resolves.toEqual(["u2"]);
    await expect(
      classFieldResolvers.Class.invitedUserIds(
        { ownerId: "u2", invitedUserIds: ["u1"] },
        null,
        ctx,
      ),
    ).resolves.toEqual([]);
  });

  it("queries classes and public invite info", async () => {
    await expect(classQueryResolvers.classes(null, null, anon)).resolves.toEqual([]);

    prisma.class.findMany.mockResolvedValueOnce([{ id: "class-1" }]);
    await expect(classQueryResolvers.classes(null, null, ctx)).resolves.toEqual([
      { id: "class-1" },
    ]);

    await expect(classQueryResolvers.class(null, { id: "class-1" }, anon)).resolves.toBeNull();

    prisma.class.findFirst.mockResolvedValueOnce({ id: "class-1" });
    await expect(classQueryResolvers.class(null, { id: "class-1" }, ctx)).resolves.toEqual({
      id: "class-1",
    });

    prisma.class.findUnique.mockResolvedValueOnce(null);
    await expect(classQueryResolvers.classInviteInfo(null, { id: "missing" })).resolves.toBeNull();

    prisma.class.findUnique.mockResolvedValueOnce({ id: "class-1", name: "Math", ownerId: "u1" });
    prisma.user.findUnique.mockResolvedValueOnce({ name: "Owner" });
    await expect(classQueryResolvers.classInviteInfo(null, { id: "class-1" })).resolves.toEqual({
      id: "class-1",
      name: "Math",
      ownerName: "Owner",
    });
  });

  it("updates class schedule and name", async () => {
    prisma.class.findFirst.mockResolvedValue({ id: "class-1", daysOfWeek: [1], excludedDates: [] });
    prisma.class.update.mockResolvedValue({ id: "class-1" });

    await classMutationResolvers.updateClassSchedule(
      null,
      { id: "class-1", daysOfWeek: [2], startDate: "2026-01-01", endDate: null },
      ctx,
    );
    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class-1" },
      data: { daysOfWeek: [2], startDate: new Date("2026-01-01"), endDate: null },
    });

    await expect(
      classMutationResolvers.renameClass(null, { id: "class-1", name: " " }, ctx),
    ).rejects.toThrow("Nome é obrigatório");

    await classMutationResolvers.renameClass(null, { id: "class-1", name: "  Physics  " }, ctx);
    expect(prisma.class.update).toHaveBeenLastCalledWith({
      where: { id: "class-1" },
      data: { name: "Physics" },
    });
  });

  it("deletes class dependent data", async () => {
    prisma.class.findFirst.mockResolvedValue({ id: "class-1" });
    prisma.attendanceSession.findMany.mockResolvedValueOnce([{ id: "session-1" }]);
    prisma.evaluation.findMany.mockResolvedValueOnce([{ id: "evaluation-1" }]);

    await expect(classMutationResolvers.deleteClass(null, { id: "class-1" }, ctx)).resolves.toBe(
      true,
    );
    expect(prisma.attendanceRecord.deleteMany).toHaveBeenCalledWith({
      where: { sessionId: { in: ["session-1"] } },
    });
    expect(prisma.grade.deleteMany).toHaveBeenCalledWith({
      where: { evaluationId: { in: ["evaluation-1"] } },
    });
    expect(prisma.class.delete).toHaveBeenCalledWith({ where: { id: "class-1" } });
  });

  it("creates and accepts invites", async () => {
    prisma.class.findFirst.mockResolvedValue({ id: "class-1" });

    process.env.NEXTAUTH_URL = "https://diario.test";
    await expect(
      classMutationResolvers.createInviteLink(null, { classId: "class-1" }, ctx),
    ).resolves.toBe("https://diario.test/invite/class-1");

    prisma.class.findUnique.mockResolvedValueOnce({ id: "class-1", invitedUserIds: ["u1"] });
    await expect(
      classMutationResolvers.acceptInvite(null, { id: "class-1" }, ctx),
    ).resolves.toEqual({
      id: "class-1",
      invitedUserIds: ["u1"],
    });

    prisma.class.findUnique.mockResolvedValueOnce({ id: "class-2", invitedUserIds: [] });
    prisma.class.update.mockResolvedValueOnce({ id: "class-2", invitedUserIds: ["u1"] });
    await expect(
      classMutationResolvers.acceptInvite(null, { id: "class-2" }, ctx),
    ).resolves.toEqual({
      id: "class-2",
      invitedUserIds: ["u1"],
    });

    prisma.class.findUnique.mockResolvedValueOnce(null);
    await expect(classMutationResolvers.acceptInvite(null, { id: "missing" }, ctx)).rejects.toThrow(
      "Not found",
    );
  });
});
