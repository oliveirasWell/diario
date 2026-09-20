import { describe, expect, it } from "vitest";
import { shiftForOpenedLocation } from "./open-location";

const ROOM_07 = "07";
const ROOM_08 = "08";
const VESPERTINO = "VESPERTINO";

describe("shiftForOpenedLocation", () => {
  it("uses the explicit shift from a class-group badge", () => {
    expect(shiftForOpenedLocation(VESPERTINO, ROOM_07, ROOM_07, "MATUTINO")).toBe(VESPERTINO);
  });

  it("uses the search shift only when opening the highlighted location", () => {
    expect(shiftForOpenedLocation(undefined, ROOM_07, ROOM_07, VESPERTINO)).toBe(VESPERTINO);
  });

  it("does not reuse a leftover search shift on a different room", () => {
    expect(shiftForOpenedLocation(undefined, ROOM_08, ROOM_07, VESPERTINO)).toBeUndefined();
  });

  it("has no shift when opening a room with no search target", () => {
    expect(shiftForOpenedLocation(undefined, ROOM_07, null, VESPERTINO)).toBeUndefined();
  });
});
