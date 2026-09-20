"use client";

import { memo } from "react";
import { pois, rooms, toPixelRect } from "@/lib/mapa/geometry";
import type { LocationGeometry } from "@/lib/mapa/types";

const locations: LocationGeometry[] = [...rooms, ...pois];

type HotspotLayerProps = {
  activeCode?: string | null;
  onSelectLocation?: (code: string) => void;
  wasDragging?: () => boolean;
};

/**
 * Clickable room/POI rects over the floor plan — the reference prototype's
 * `#hotspotLayer`. Memoized: its props stay referentially stable while
 * panning/zooming (only the transform on a sibling layer changes), so this
 * skips re-rendering 32 rects on every pointermove.
 */
const HotspotLayerComponent = ({
  activeCode,
  onSelectLocation,
  wasDragging,
}: HotspotLayerProps) => (
  <g>
    {locations.map((location) => {
      const rect = toPixelRect(location);
      const isActive = location.code === activeCode;
      return (
        <rect
          key={location.code}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          className={
            isActive
              ? "cursor-pointer fill-[rgba(232,161,61,0.38)] stroke-[#e8a13d] stroke-2 transition-colors"
              : "cursor-pointer fill-[rgba(47,111,179,0)] stroke-[rgba(47,111,179,0.9)] stroke-2 transition-colors hover:fill-[rgba(47,111,179,0.28)]"
          }
          onClick={() => {
            if (wasDragging?.()) {
              return;
            }
            onSelectLocation?.(location.code);
          }}
        >
          <title>{location.name}</title>
        </rect>
      );
    })}
  </g>
);
HotspotLayerComponent.displayName = "HotspotLayer";

export const HotspotLayer = memo(HotspotLayerComponent);
