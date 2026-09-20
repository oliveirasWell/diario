export type LocationKindCode = "ROOM" | "POI";

export type LocationGeometry = {
  code: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlacedLocation = LocationGeometry & { kind: LocationKindCode };

export type NavNodeId = string;

export type NavNodes = Record<NavNodeId, [number, number]>;

export type NavEdge = [NavNodeId, NavNodeId];

export type ShiftOption = {
  id: string;
  name: string;
  background: string;
  foreground: string;
};

export type DayOption = {
  id: string;
  name: string;
  full: string;
};

export type SearchIndexEntry = {
  tag: string;
  label: string;
  locationCode: string;
  shift?: string;
  term: string;
};
