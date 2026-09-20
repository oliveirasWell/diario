"use client";

import { MAP_COPY } from "@/lib/mapa/constants";
import { toPixelRect } from "@/lib/mapa/geometry";
import type { PlacedLocation } from "@/lib/mapa/types";

type SearchTargetLayerProps = {
  location: PlacedLocation | null;
  scale: number;
  onSelect: (code: string) => void;
  wasDragging: () => boolean;
};

export const SearchTargetLayer = ({
  location,
  scale,
  onSelect,
  wasDragging,
}: SearchTargetLayerProps) => {
  if (!location) {
    return null;
  }
  const rect = toPixelRect(location);
  const unit = 1 / scale;
  const pillHeight = 26 * unit;
  const gap = 6 * unit;
  const estimatedWidth = Math.max(rect.width, (location.name.length + 4) * 8 * unit);
  return (
    <g>
      <rect
        className="mapa-search-pulse"
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        rx={6}
      />
      <g
        className="mapa-search-pill"
        onClick={(event) => {
          event.stopPropagation();
          if (wasDragging()) {
            return;
          }
          onSelect(location.code);
        }}
      >
        <rect
          x={rect.x + rect.width / 2 - estimatedWidth / 2}
          y={Math.max(0, rect.y - gap - pillHeight)}
          width={estimatedWidth}
          height={pillHeight}
          rx={pillHeight / 2}
          fill="#2f6fb3"
          stroke="#fff"
          strokeWidth={2}
        />
        <text
          x={rect.x + rect.width / 2}
          y={Math.max(0, rect.y - gap - pillHeight) + pillHeight / 2}
          fill="#fff"
          fontSize={13 * unit}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="central"
          pointerEvents="none"
        >
          {MAP_COPY.searchPin(location.name)}
        </text>
      </g>
    </g>
  );
};
