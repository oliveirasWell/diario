"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

/** Zoom in/out/reset — the reference prototype's `#controls`. */
export const MapControls = ({ onZoomIn, onZoomOut, onReset }: MapControlsProps) => (
  <div className="absolute right-3 bottom-3 flex flex-col gap-1">
    <Button type="button" variant="secondary" size="icon" aria-label="Aproximar" onClick={onZoomIn}>
      <Plus className="size-4" />
    </Button>
    <Button type="button" variant="secondary" size="icon" aria-label="Afastar" onClick={onZoomOut}>
      <Minus className="size-4" />
    </Button>
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label="Redefinir zoom"
      onClick={onReset}
    >
      <RotateCcw className="size-4" />
    </Button>
  </div>
);
