import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  CAMPUS_LOCATION_COUNT,
  CAMPUS_LOCATION_INPUTS,
  ensureCampusLocations,
  findOrCreateCampusLocation,
} from "./ensure-campus-locations";

describe("ensureCampusLocations", () => {
  it("returns existing rows when the campus catalog is already complete", async () => {
    const existing = CAMPUS_LOCATION_INPUTS.map((location, index) => ({
      ...location,
      id: `loc-${index}`,
    }));
    prismaMock.location.findMany.mockResolvedValue(existing);

    await expect(ensureCampusLocations(prismaMock as never)).resolves.toEqual(existing);
    expect(prismaMock.location.create).not.toHaveBeenCalled();
  });

  it("creates every missing campus location", async () => {
    const created = CAMPUS_LOCATION_INPUTS.map((location, index) => ({
      ...location,
      id: `loc-${index}`,
    }));
    prismaMock.location.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce(created);
    prismaMock.location.create.mockResolvedValue({});

    await expect(ensureCampusLocations(prismaMock as never)).resolves.toEqual(created);
    expect(prismaMock.location.create).toHaveBeenCalledTimes(CAMPUS_LOCATION_COUNT);
    expect(prismaMock.location.create).toHaveBeenCalledWith({
      data: { code: "07", name: "Sala 07", kind: "ROOM" },
    });
  });

  it("ignores unique conflicts when another request created the same location", async () => {
    prismaMock.location.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prismaMock.location.create.mockRejectedValue({ code: "P2002" });

    await expect(ensureCampusLocations(prismaMock as never)).resolves.toEqual([]);
  });
});

describe("findOrCreateCampusLocation", () => {
  it("reuses a location that already exists for that floor-plan code", async () => {
    const existing = { id: "loc-07", code: "07", name: "Sala 07", kind: "ROOM" as const };
    prismaMock.location.findUnique.mockResolvedValue(existing);

    await expect(findOrCreateCampusLocation(prismaMock as never, "07")).resolves.toEqual(existing);
    expect(prismaMock.location.create).not.toHaveBeenCalled();
  });

  it("creates the campus location from static geometry", async () => {
    prismaMock.location.findUnique.mockResolvedValue(null);
    prismaMock.location.create.mockResolvedValue({
      id: "loc-07",
      code: "07",
      name: "Sala 07",
      kind: "ROOM",
    });

    await expect(findOrCreateCampusLocation(prismaMock as never, "07")).resolves.toMatchObject({
      code: "07",
    });
    expect(prismaMock.location.create).toHaveBeenCalledWith({
      data: { code: "07", name: "Sala 07", kind: "ROOM" },
    });
  });

  it("returns null for a code that is not on the floor plan", async () => {
    await expect(findOrCreateCampusLocation(prismaMock as never, "nope")).resolves.toBeNull();
  });
});
