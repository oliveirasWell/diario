"use client";

import { memo } from "react";
import { SHIFTS } from "@/lib/mapa/constants";
import { rooms, toPixelRect } from "@/lib/mapa/geometry";
import type { MapDataQuery } from "@/src/gql/graphql";

const LABEL_HEIGHT = 12;
const LABEL_GAP = 2;

type MapRoomShifts = MapDataQuery["mapData"]["roomShifts"];

type RoomLabelsLayerProps = {
  roomShifts: MapRoomShifts;
};

/**
 * Class-group badges stacked over each occupied room — the reference
 * prototype's `#roomLabelsLayer`. Memoized: `roomShifts` stays referentially
 * stable while panning/zooming (TanStack Query keeps the same reference
 * until the query itself refetches), so this skips rebuilding the grouping
 * and re-rendering on every pointermove.
 */
const RoomLabelsLayerComponent = ({ roomShifts }: RoomLabelsLayerProps) => {
  const assignedByRoom = new Map<string, MapRoomShifts>();
  for (const roomShift of roomShifts) {
    if (!roomShift.classGroup) {
      continue;
    }
    const list = assignedByRoom.get(roomShift.location.code) ?? [];
    list.push(roomShift);
    assignedByRoom.set(roomShift.location.code, list);
  }

  return (
    <g>
      {Array.from(assignedByRoom.entries()).map(([code, shifts]) => {
        const geometry = rooms.find((room) => room.code === code);
        if (!geometry) {
          return null;
        }
        const rect = toPixelRect(geometry);
        return (
          <g key={code}>
            {shifts.map((roomShift, index) => {
              const style = SHIFTS.find((shift) => shift.id === roomShift.shift);
              return (
                <g
                  key={roomShift.id}
                  transform={`translate(${rect.x + 2}, ${rect.y + 2 + index * (LABEL_HEIGHT + LABEL_GAP)})`}
                >
                  <rect
                    width={Math.max(rect.width - 4, LABEL_HEIGHT)}
                    height={LABEL_HEIGHT}
                    fill={style?.background ?? "#ffd93d"}
                  />
                  <text
                    x={3}
                    y={LABEL_HEIGHT - 3}
                    fontSize={8}
                    fill={style?.foreground ?? "#5c4a00"}
                  >
                    {roomShift.classGroup?.grade} {roomShift.classGroup?.section}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
RoomLabelsLayerComponent.displayName = "RoomLabelsLayer";

export const RoomLabelsLayer = memo(RoomLabelsLayerComponent);
