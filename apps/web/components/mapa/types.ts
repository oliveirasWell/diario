import type { MapDataQuery } from "@/src/gql/graphql";

export type MapLocation = MapDataQuery["mapData"]["locations"][number];
export type MapRoomShift = MapDataQuery["mapData"]["roomShifts"][number];
export type MapLesson = MapRoomShift["lessons"][number];
export type MapSubject = MapDataQuery["mapData"]["subjects"][number];
export type MapTeacher = MapDataQuery["mapData"]["teachers"][number];

export type OpenCell = { weekday: string; period: number };
