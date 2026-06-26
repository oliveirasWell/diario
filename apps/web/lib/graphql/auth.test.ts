import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  firstAccessibleClassId,
  ownerIdsFrom,
  requireOwnedClass,
  requireOwnedOrInvited,
  requireOwnerIds,
  requireOwnerStrict,
} from "./auth";

const prisma = vi.hoisted(() => ({
  class: {
    findFirst: vi.fn(),
  },
}));

vi.mock("./prisma", () => ({
  getPrisma: async () => prisma,
}));

describe("GraphQL auth helpers", () => {
  beforeEach(() => {
    prisma.class.findFirst.mockReset();
  });

  it("dedupes next-auth and prisma ids", () => {
    expect(ownerIdsFrom({ user: { id: "u1", prismaUserId: "u1" } as any })).toEqual(["u1"]);
  });

  it("rejects anonymous users", () => {
    expect(() => requireOwnerIds({ user: null })).toThrow("Unauthorized");
  });

  it("returns unique owner ids", () => {
    expect(requireOwnerIds({ user: { id: "next-1", prismaUserId: "prisma-1" } as any })).toEqual([
      "prisma-1",
      "next-1",
    ]);
  });

  it("requires strict owner access", async () => {
    const klass = { id: "class-1" };
    prisma.class.findFirst.mockResolvedValueOnce(klass);

    await expect(requireOwnerStrict("class-1", ["user-1"])).resolves.toBe(klass);
    expect(prisma.class.findFirst).toHaveBeenCalledWith({
      where: { id: "class-1", ownerId: { in: ["user-1"] } },
    });
  });

  it("rejects strict owner misses", async () => {
    prisma.class.findFirst.mockResolvedValueOnce(null);

    await expect(requireOwnerStrict("class-1", ["user-1"])).rejects.toThrow("Not found");
  });

  it("requires owned class", async () => {
    const klass = { id: "class-1" };
    prisma.class.findFirst.mockResolvedValueOnce(klass);

    await expect(requireOwnedClass("class-1", ["user-1"])).resolves.toBe(klass);
  });

  it("rejects owned class misses", async () => {
    prisma.class.findFirst.mockResolvedValueOnce(null);

    await expect(requireOwnedClass("class-1", ["user-1"])).rejects.toThrow("Not found");
  });

  it("returns owned or invited class", async () => {
    const klass = { id: "class-1" };
    prisma.class.findFirst.mockResolvedValueOnce(klass);

    await expect(requireOwnedOrInvited("class-1", ["user-1"])).resolves.toBe(klass);
    expect(prisma.class.findFirst).toHaveBeenCalledWith({
      where: {
        id: "class-1",
        OR: [{ ownerId: { in: ["user-1"] } }, { invitedUserIds: { hasSome: ["user-1"] } }],
      },
    });
  });

  it("hides inaccessible class ids", async () => {
    prisma.class.findFirst.mockResolvedValueOnce(null);
    await expect(firstAccessibleClassId("class-1", ["user-1"])).resolves.toBeNull();
  });

  it("throws when class is inaccessible", async () => {
    prisma.class.findFirst.mockResolvedValueOnce(null);
    await expect(requireOwnedOrInvited("class-1", ["user-1"])).rejects.toThrow("Not found");
  });

  it("returns accessible class id", async () => {
    prisma.class.findFirst.mockResolvedValueOnce({ id: "class-1" });
    await expect(firstAccessibleClassId("class-1", ["user-1"])).resolves.toBe("class-1");
  });
});
