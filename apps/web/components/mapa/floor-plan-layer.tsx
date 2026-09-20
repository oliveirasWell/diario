"use client";

import { memo } from "react";
import { allLocations, toPixelRect } from "@/lib/mapa/geometry";

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
        <rect
          key={location.code}
          className={location.code === activeCode ? "mapa-location is-active" : "mapa-location"}
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
      );
    })}
  </g>
);
FloorPlanLayerComponent.displayName = "FloorPlanLayer";

export const FloorPlanLayer = memo(FloorPlanLayerComponent);
