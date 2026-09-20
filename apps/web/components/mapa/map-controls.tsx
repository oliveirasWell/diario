"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { MAP_COPY } from "@/lib/mapa/constants";

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

/**
 * Zoom in/out/reset — the reference prototype's `#controls`. Memoized: the
 * pan/zoom hook hands out stable callback identities, so this skips
 * re-rendering on every pointermove.
 */
const MapControlsComponent = ({ onZoomIn, onZoomOut, onReset }: MapControlsProps) => (
  <div className="absolute right-3 bottom-3 flex flex-col gap-1">
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={MAP_COPY.zoomIn}
      onClick={onZoomIn}
    >
      <Plus className="size-4" />
    </Button>
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={MAP_COPY.zoomOut}
      onClick={onZoomOut}
    >
      <Minus className="size-4" />
    </Button>
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={MAP_COPY.resetZoom}
      onClick={onReset}
    >
      <RotateCcw className="size-4" />
    </Button>
  </div>
);
MapControlsComponent.displayName = "MapControls";

export const MapControls = memo(MapControlsComponent);
