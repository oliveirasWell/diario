import type { NavEdge, NavNodeId, NavNodes } from "./types";

const distanceBetween = (nodes: NavNodes, a: NavNodeId, b: NavNodeId): number => {
  const [ax, ay] = nodes[a];
  const [bx, by] = nodes[b];
  return Math.hypot(ax - bx, ay - by);
};

const buildAdjacency = (nodes: NavNodes, edges: NavEdge[]): Map<NavNodeId, NavNodeId[]> => {
  const adjacency = new Map<NavNodeId, NavNodeId[]>();
  for (const nodeId of Object.keys(nodes)) {
    adjacency.set(nodeId, []);
  }
  for (const [from, to] of edges) {
    adjacency.get(from)?.push(to);
    adjacency.get(to)?.push(from);
  }
  return adjacency;
};

/**
 * Shortest path between two nav-graph nodes, by Euclidean edge weight.
 * O(n²) linear-scan Dijkstra — the school's nav graph is a few dozen nodes,
 * so a priority queue isn't worth the complexity (matches docs/mapa/index.html).
 */
export const findShortestPath = (
  nodes: NavNodes,
  edges: NavEdge[],
  origin: NavNodeId,
  destination: NavNodeId,
): NavNodeId[] | null => {
  if (!(origin in nodes) || !(destination in nodes)) {
    return null;
  }
  if (origin === destination) {
    return [origin];
  }

  const adjacency = buildAdjacency(nodes, edges);
  const distances = new Map<NavNodeId, number>();
  const previous = new Map<NavNodeId, NavNodeId>();
  const unvisited = new Set<NavNodeId>(Object.keys(nodes));

  for (const nodeId of unvisited) {
    distances.set(nodeId, Infinity);
  }
  distances.set(origin, 0);

  while (unvisited.size) {
    let current: NavNodeId | null = null;
    let currentDistance = Infinity;
    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId) ?? Infinity;
      if (distance < currentDistance) {
        current = nodeId;
        currentDistance = distance;
      }
    }
    if (current === null || currentDistance === Infinity) {
      break;
    }
    if (current === destination) {
      break;
    }
    unvisited.delete(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      if (!unvisited.has(neighbor)) {
        continue;
      }
      const candidate = currentDistance + distanceBetween(nodes, current, neighbor);
      if (candidate < (distances.get(neighbor) ?? Infinity)) {
        distances.set(neighbor, candidate);
        previous.set(neighbor, current);
      }
    }
  }

  if (!previous.has(destination) && origin !== destination) {
    return null;
  }

  const path: NavNodeId[] = [destination];
  let step = destination;
  while (step !== origin) {
    const previousStep = previous.get(step);
    if (!previousStep) {
      return null;
    }
    path.unshift(previousStep);
    step = previousStep;
  }
  return path;
};
