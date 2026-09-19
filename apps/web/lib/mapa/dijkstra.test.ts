import { describe, expect, it } from "vitest";
import { findShortestPath } from "./dijkstra";
import type { NavEdge, NavNodes } from "./types";

const nodes: NavNodes = {
  a: [0, 0],
  b: [10, 0],
  c: [10, 10],
  d: [0, 10],
  isolated: [100, 100],
};

const edges: NavEdge[] = [
  ["a", "b"],
  ["b", "c"],
  ["a", "d"],
  ["d", "c"],
];

describe("findShortestPath", () => {
  it("returns a single-node path when origin and destination are the same", () => {
    expect(findShortestPath(nodes, edges, "a", "a")).toEqual(["a"]);
  });

  it("finds the direct path along a single edge", () => {
    expect(findShortestPath(nodes, edges, "a", "b")).toEqual(["a", "b"]);
  });

  it("picks the shorter of two routes by Euclidean edge weight", () => {
    // a->b->c (20) and a->d->c (20) tie in this square, so add a shortcut edge
    // that makes one route strictly shorter to disambiguate.
    const shortcutEdges: NavEdge[] = [...edges, ["a", "c"]];
    expect(findShortestPath(nodes, shortcutEdges, "a", "c")).toEqual(["a", "c"]);
  });

  it("returns null when destination is unreachable", () => {
    expect(findShortestPath(nodes, edges, "a", "isolated")).toBeNull();
  });

  it("returns null for an unknown origin or destination", () => {
    expect(findShortestPath(nodes, edges, "unknown", "a")).toBeNull();
    expect(findShortestPath(nodes, edges, "a", "unknown")).toBeNull();
  });

  it("treats edges as undirected", () => {
    expect(findShortestPath(nodes, edges, "b", "a")).toEqual(["b", "a"]);
  });
});
