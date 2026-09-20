import type { Prisma } from "@diario/db";

export const MAP_OWNER_COLLECTIONS = ["Teacher", "Subject", "ClassGroup", "RoomShift"] as const;

export const unownedOwnerFilter = {
  $or: [{ ownerId: { $exists: false } }, { ownerId: null }],
};

export const ownerBackfillUpdateCommand = (
  collection: string,
  ownerId: string,
): Prisma.InputJsonObject => ({
  update: collection,
  updates: [
    {
      q: unownedOwnerFilter,
      u: { $set: { ownerId: { $oid: ownerId } } },
      multi: true,
    },
  ],
});

type MongoCommandClient = {
  $runCommandRaw: (command: Prisma.InputJsonObject) => Promise<unknown>;
};

export const claimUnownedMapRecords = async (
  prisma: MongoCommandClient,
  ownerId: string,
): Promise<void> => {
  await Promise.all(
    MAP_OWNER_COLLECTIONS.map((collection) =>
      prisma.$runCommandRaw(ownerBackfillUpdateCommand(collection, ownerId)),
    ),
  );
};
