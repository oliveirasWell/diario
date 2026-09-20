"use client";

import { memo } from "react";
import { MAP_COPY } from "@/lib/mapa/constants";

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

const MapControlsComponent = ({ onZoomIn, onZoomOut, onReset }: MapControlsProps) => (
  <div className="mapa-controls">
    <button type="button" aria-label={MAP_COPY.zoomIn} onClick={onZoomIn}>
      {MAP_COPY.zoomIn}
    </button>
    <button type="button" aria-label={MAP_COPY.zoomOut} onClick={onZoomOut}>
      {MAP_COPY.zoomOut}
    </button>
    <button type="button" aria-label={MAP_COPY.resetZoom} onClick={onReset}>
      {MAP_COPY.resetZoom}
    </button>
  </div>
);
MapControlsComponent.displayName = "MapControls";

export const MapControls = memo(MapControlsComponent);
