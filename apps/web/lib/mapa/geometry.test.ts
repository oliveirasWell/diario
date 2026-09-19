import { describe, expect, it } from "vitest";
import {
  IMG_H,
  IMG_W,
  navEdges,
  navNodeIdForLocation,
  navNodes,
  pois,
  rooms,
  toPixelCenter,
  toPixelRect,
} from "./geometry";

describe("geometry", () => {
  it("has the image dimensions from the reference floor plan", () => {
    expect(IMG_W).toBe(1155);
    expect(IMG_H).toBe(1362);
  });

  it("seeds the 16 rooms and 16 points of interest from the reference prototype", () => {
    expect(rooms).toHaveLength(16);
    expect(pois).toHaveLength(16);
  });

  it("has unique codes across rooms and points of interest", () => {
    const codes = [...rooms, ...pois].map((location) => location.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("keeps every location's geometry within the normalized 0-1 range", () => {
    for (const location of [...rooms, ...pois]) {
      expect(location.x).toBeGreaterThanOrEqual(0);
      expect(location.x).toBeLessThanOrEqual(1);
      expect(location.y).toBeGreaterThanOrEqual(0);
      expect(location.y).toBeLessThanOrEqual(1);
    }
  });

  it("only references nav nodes that exist", () => {
    for (const [from, to] of navEdges) {
      expect(navNodes).toHaveProperty(from);
      expect(navNodes).toHaveProperty(to);
    }
  });

  it("has a nav node for every room and POI", () => {
    for (const room of rooms) {
      expect(navNodes).toHaveProperty(navNodeIdForLocation(room.code, "ROOM"));
    }
    // "lobby" is background/decorative only, per docs/mapa/SPEC.md extraction notes.
    for (const poi of pois.filter((poi) => poi.code !== "lobby")) {
      expect(navNodes).toHaveProperty(navNodeIdForLocation(poi.code, "POI"));
    }
  });

  it("builds the nav node id from the location kind and code", () => {
    expect(navNodeIdForLocation("07", "ROOM")).toBe("room_07");
    expect(navNodeIdForLocation("biblioteca", "POI")).toBe("poi_biblioteca");
  });

  it("converts normalized geometry to pixel coordinates", () => {
    expect(toPixelRect({ code: "x", name: "X", x: 0.5, y: 0.25, width: 0.1, height: 0.2 })).toEqual({
      x: 0.5 * IMG_W,
      y: 0.25 * IMG_H,
      width: 0.1 * IMG_W,
      height: 0.2 * IMG_H,
    });
  });

  it("gives the pixel center of a location's rect", () => {
    const [centerX, centerY] = toPixelCenter({
      code: "x",
      name: "X",
      x: 0,
      y: 0,
      width: 0.1,
      height: 0.2,
    });
    expect(centerX).toBeCloseTo((0.1 * IMG_W) / 2);
    expect(centerY).toBeCloseTo((0.2 * IMG_H) / 2);
  });
});
