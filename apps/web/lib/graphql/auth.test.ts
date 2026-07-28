import { describe, expect, it } from "vitest";
import {
  anonymousContext,
  teacherContext,
  TEACHER_NEXT_AUTH_ID,
  TEACHER_OWNER_IDS,
  TEACHER_PRISMA_ID,
} from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import {
  ownedOrInvitedWhere,
  ownerIdsFrom,
  requireOwnedOrInvited,
  requireOwnerIds,
  requireOwnerStrict,
} from "./auth";

const CLASS_ID = "class-1";
const OWNER_IDS = ["user-1"];

describe("ownerIdsFrom", () => {
  it("lists the prisma id before the next-auth id", () => {
    expect(ownerIdsFrom(teacherContext)).toEqual([TEACHER_PRISMA_ID, TEACHER_NEXT_AUTH_ID]);
  });

  it("dedupes ids that are the same", () => {
    expect(ownerIdsFrom({ user: { id: "u1", prismaUserId: "u1" } })).toEqual(["u1"]);
  });
});

describe("requireOwnerIds", () => {
  it("rejects anonymous users", () => {
    expect(() => requireOwnerIds(anonymousContext)).toThrow("Unauthorized");
  });

  it("returns the owner ids of a signed in user", () => {
    expect(requireOwnerIds(teacherContext)).toEqual(TEACHER_OWNER_IDS);
  });
});

describe("ownedOrInvitedWhere", () => {
  it("matches classes owned by or shared with the user", () => {
    expect(ownedOrInvitedWhere(OWNER_IDS)).toEqual({
      OR: [{ ownerId: { in: OWNER_IDS } }, { invitedUserIds: { hasSome: OWNER_IDS } }],
    });
  });
});

describe("requireOwnerStrict", () => {
  it("looks the class up by owner only", async () => {
    const classRecord = { id: CLASS_ID };
    prismaMock.class.findFirst.mockResolvedValue(classRecord);

    await expect(requireOwnerStrict(CLASS_ID, OWNER_IDS)).resolves.toBe(classRecord);
    expect(prismaMock.class.findFirst).toHaveBeenCalledWith({
      where: { id: CLASS_ID, ownerId: { in: OWNER_IDS } },
    });
  });

  it("throws when the user does not own the class", async () => {
    prismaMock.class.findFirst.mockResolvedValue(null);

    await expect(requireOwnerStrict(CLASS_ID, OWNER_IDS)).rejects.toThrow("Not found");
  });
});

describe("requireOwnedOrInvited", () => {
  it("accepts owned and invited classes", async () => {
    const classRecord = { id: CLASS_ID };
    prismaMock.class.findFirst.mockResolvedValue(classRecord);

    await expect(requireOwnedOrInvited(CLASS_ID, OWNER_IDS)).resolves.toBe(classRecord);
    expect(prismaMock.class.findFirst).toHaveBeenCalledWith({
      where: { id: CLASS_ID, ...ownedOrInvitedWhere(OWNER_IDS) },
    });
  });

  it("throws when the class is inaccessible", async () => {
    prismaMock.class.findFirst.mockResolvedValue(null);

    await expect(requireOwnedOrInvited(CLASS_ID, OWNER_IDS)).rejects.toThrow("Not found");
  });
});
