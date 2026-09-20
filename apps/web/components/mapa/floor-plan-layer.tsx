"use client";

import { memo } from "react";
import { allLocations, toPixelRect } from "@/lib/mapa/geometry";
import type { PlacedLocation } from "@/lib/mapa/types";

const locationClassName = (location: PlacedLocation, isActive: boolean): string => {
  const classes = ["mapa-location"];
  if (location.kind === "ROOM") {
    classes.push("mapa-location-room");
  } else if (location.code.startsWith("area_verde")) {
    classes.push("mapa-location-green");
  } else if (location.code === "lobby") {
    classes.push("mapa-location-lobby");
  } else {
    classes.push("mapa-location-poi");
  }
  if (isActive) {
    classes.push("is-active");
  }
  return classes.join(" ");
};

const locationLabel = (location: PlacedLocation): string =>
  location.kind === "ROOM" ? location.code : location.name;

type FloorPlanLayerProps = {
  activeCode?: string | null;
  onSelectLocation: (code: string) => void;
  wasDragging: () => boolean;
};

const FloorPlanLayerComponent = ({
  activeCode,
  onSelectLocation,
  wasDragging,
}: FloorPlanLayerProps) => (
  <g>
    {allLocations.map((location) => {
      const rect = toPixelRect(location);
      return (
        <g key={location.code}>
          <rect
            className={locationClassName(location, location.code === activeCode)}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            data-location-code={location.code}
            data-location-kind={location.kind}
            onClick={(event) => {
              event.stopPropagation();
              if (wasDragging()) {
                return;
              }
              onSelectLocation(location.code);
            }}
          >
            <title>{location.name}</title>
          </rect>
          <text
            className="mapa-location-label"
            x={rect.x + rect.width / 2}
            y={rect.y + rect.height / 2}
            fontSize={Math.max(10, Math.min(18, rect.width / 4.5))}
          >
            {locationLabel(location)}
          </text>
        </g>
      );
    })}
  </g>
);
FloorPlanLayerComponent.displayName = "FloorPlanLayer";

export const FloorPlanLayer = memo(FloorPlanLayerComponent);
