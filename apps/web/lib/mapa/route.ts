import { findShortestPath } from "./dijkstra";
import {
  findPlacedLocation,
  isRoutableLocation,
  navEdges,
  navNodeIdForLocation,
  navNodes,
  toPixelCenter,
} from "./geometry";
import type { PlacedLocation } from "./types";

export type RoutePoint = { x: number; y: number };

export type BuiltRoute = {
  points: RoutePoint[];
  origin: PlacedLocation;
  destination: PlacedLocation;
};

export const buildRoute = (originCode: string, destinationCode: string): BuiltRoute | null => {
  const origin = findPlacedLocation(originCode);
  const destination = findPlacedLocation(destinationCode);
  if (!origin || !destination || !isRoutableLocation(origin) || !isRoutableLocation(destination)) {
    return null;
  }

  const originNode = navNodeIdForLocation(origin.code, origin.kind);
  const destinationNode = navNodeIdForLocation(destination.code, destination.kind);
  const path = findShortestPath(navNodes, navEdges, originNode, destinationNode);
  if (!path) {
    return null;
  }

  const [originX, originY] = toPixelCenter(origin);
  const [destinationX, destinationY] = toPixelCenter(destination);
  const points: RoutePoint[] = [
    { x: originX, y: originY },
    ...path.map((nodeId) => {
      const [x, y] = navNodes[nodeId];
      return { x, y };
    }),
    { x: destinationX, y: destinationY },
  ];

  return { points, origin, destination };
};

export const routePathData = (points: RoutePoint[]): string => {
  if (!points.length) {
    return "";
  }
  const [first, ...rest] = points;
  return [`M ${first.x} ${first.y}`, ...rest.map((point) => `L ${point.x} ${point.y}`)].join(" ");
};
