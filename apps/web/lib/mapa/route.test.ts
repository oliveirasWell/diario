import { describe, expect, it } from "vitest";
import { buildRoute, routePathData } from "./route";

describe("buildRoute", () => {
  it("returns a polyline from origin center through corridor nodes to destination center", () => {
    const route = buildRoute("07", "biblioteca");
    expect(route).not.toBeNull();
    expect(route?.origin.code).toBe("07");
    expect(route?.destination.code).toBe("biblioteca");
    expect(route?.points.length).toBeGreaterThan(2);
  });

  it("returns null for the decorative lobby", () => {
    expect(buildRoute("lobby", "07")).toBeNull();
  });

  it("returns null for an unknown code", () => {
    expect(buildRoute("missing", "07")).toBeNull();
  });
});

describe("routePathData", () => {
  it("builds an SVG path from the points", () => {
    expect(
      routePathData([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]),
    ).toBe("M 1 2 L 3 4");
  });

  it("is empty for no points", () => {
    expect(routePathData([])).toBe("");
  });
});
