"use client";

import { memo, type PointerEvent, type ReactNode, type RefObject, type WheelEvent } from "react";
import { IMG_H, IMG_W } from "@/lib/mapa/geometry";

type MapStageProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  transform: string;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  children: ReactNode;
};

/** The pannable/zoomable floor plan canvas — the reference prototype's `#stage-wrap`/`#stage`/`#mapSvg`. */
export const MapStage = memo(function MapStage({
  containerRef,
  transform,
  onPointerDown,
  onWheel,
  children,
}: MapStageProps) {
  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-[#f3ede3]"
      onPointerDown={onPointerDown}
      onWheel={onWheel}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform, width: IMG_W, height: IMG_H }}
      >
        <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} width={IMG_W} height={IMG_H}>
          <image
            href="/mapa/planta-baixa.png"
            x={0}
            y={0}
            width={IMG_W}
            height={IMG_H}
            preserveAspectRatio="xMidYMid meet"
          />
          {children}
        </svg>
      </div>
    </div>
  );
});
