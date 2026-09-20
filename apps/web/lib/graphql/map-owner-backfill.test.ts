import { describe, expect, it, vi } from "vitest";
import {
  MAP_OWNER_COLLECTIONS,
  claimUnownedMapRecords,
  ownerBackfillUpdateCommand,
  unownedOwnerFilter,
} from "./map-owner-backfill";

const OWNER_ID = "507f1f77bcf86cd799439011";

describe("ownerBackfillUpdateCommand", () => {
  it("updates every document that still has no ownerId", () => {
    expect(ownerBackfillUpdateCommand("Teacher", OWNER_ID)).toEqual({
      update: "Teacher",
      updates: [
        {
          q: unownedOwnerFilter,
          u: { $set: { ownerId: { $oid: OWNER_ID } } },
          multi: true,
        },
      ],
    });
  });
});

describe("claimUnownedMapRecords", () => {
  it("claims Teacher, Subject, ClassGroup and RoomShift rows for this user", async () => {
    const runCommandRaw = vi.fn().mockResolvedValue({ ok: 1 });

    await claimUnownedMapRecords({ $runCommandRaw: runCommandRaw }, OWNER_ID);

    expect(runCommandRaw).toHaveBeenCalledTimes(MAP_OWNER_COLLECTIONS.length);
    for (const collection of MAP_OWNER_COLLECTIONS) {
      expect(runCommandRaw).toHaveBeenCalledWith(ownerBackfillUpdateCommand(collection, OWNER_ID));
    }
  });
});
