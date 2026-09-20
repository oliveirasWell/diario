import { allLocations, findPlacedLocation } from "@/lib/mapa/geometry";

export const CAMPUS_LOCATION_INPUTS = allLocations.map((location) => ({
  code: location.code,
  name: location.name,
  kind: location.kind,
}));

export const CAMPUS_LOCATION_COUNT = CAMPUS_LOCATION_INPUTS.length;

type CampusLocationRow = (typeof CAMPUS_LOCATION_INPUTS)[number] & { id: string };

type LocationStore = {
  location: {
    findMany: () => Promise<CampusLocationRow[]>;
    findUnique: (args: { where: { code: string } }) => Promise<CampusLocationRow | null>;
    create: (args: { data: (typeof CAMPUS_LOCATION_INPUTS)[number] }) => Promise<CampusLocationRow>;
  };
};

export const isPrismaUniqueConflict = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  return error.code === "P2002";
};

export const findOrCreateCampusLocation = async (prisma: LocationStore, code: string) => {
  const placed = findPlacedLocation(code);
  if (!placed) {
    return null;
  }
  const existing = await prisma.location.findUnique({ where: { code: placed.code } });
  if (existing) {
    return existing;
  }
  try {
    return await prisma.location.create({
      data: { code: placed.code, name: placed.name, kind: placed.kind },
    });
  } catch (error) {
    if (!isPrismaUniqueConflict(error)) {
      throw error;
    }
    return prisma.location.findUnique({ where: { code: placed.code } });
  }
};

export const ensureCampusLocations = async (prisma: LocationStore) => {
  const existing = await prisma.location.findMany();
  const existingCodes = new Set(existing.map((location) => location.code));
  const missing = CAMPUS_LOCATION_INPUTS.filter((location) => !existingCodes.has(location.code));
  if (missing.length === 0) {
    return existing;
  }
  await Promise.all(
    missing.map(async (location) => {
      try {
        await prisma.location.create({ data: location });
      } catch (error) {
        if (!isPrismaUniqueConflict(error)) {
          throw error;
        }
      }
    }),
  );
  return prisma.location.findMany();
};
