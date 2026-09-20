"use client";

import { memo } from "react";
import { SHIFTS } from "@/lib/mapa/constants";
import { rooms, toPixelRect } from "@/lib/mapa/geometry";
import type { MapDataQuery } from "@/src/gql/graphql";

const LABEL_HEIGHT = 14;
const LABEL_GAP = 2;

type MapRoomShifts = MapDataQuery["mapData"]["roomShifts"];

type RoomLabelsLayerProps = {
  roomShifts: MapRoomShifts;
  onSelectLocation?: (code: string, shift: string) => void;
};

/**
 * Class-group badges stacked over each occupied room — the reference
 * prototype's `#roomLabelsLayer`. Memoized: `roomShifts` stays referentially
 * stable while panning/zooming (TanStack Query keeps the same reference
 * until the query itself refetches), so this skips rebuilding the grouping
 * and re-rendering on every pointermove.
 */
const RoomLabelsLayerComponent = ({ roomShifts, onSelectLocation }: RoomLabelsLayerProps) => {
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
        const badgeWidth = Math.max(rect.width - 8, 30);
        const centerX = rect.x + rect.width / 2;
        return (
          <g key={code}>
            {shifts.map((roomShift, index) => {
              const style = SHIFTS.find((shift) => shift.id === roomShift.shift);
              const badgeY = rect.y + 4 + index * (LABEL_HEIGHT + LABEL_GAP);
              return (
                <g
                  key={roomShift.id}
                  className="mapa-room-label-badge"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectLocation?.(code, roomShift.shift);
                  }}
                >
                  <rect
                    x={centerX - badgeWidth / 2}
                    y={badgeY}
                    width={badgeWidth}
                    height={LABEL_HEIGHT}
                    rx={LABEL_HEIGHT / 2}
                    fill={style?.background ?? "#ffd93d"}
                  />
                  <text
                    x={centerX}
                    y={badgeY + LABEL_HEIGHT / 2}
                    fontSize={Math.max(LABEL_HEIGHT * 0.62, 8)}
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
