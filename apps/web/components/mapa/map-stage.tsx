"use client";

import type { ReactNode, RefObject } from "react";
import { FLOOR_PLAN_IMAGE_SRC } from "@/lib/mapa/constants";
import { IMG_H, IMG_W } from "@/lib/mapa/geometry";

type MapStageProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  transform: string;
  isDragging: boolean;
  children: ReactNode;
};

export const MapStage = ({ containerRef, transform, isDragging, children }: MapStageProps) => (
  <div ref={containerRef} className="mapa-stage-wrap">
    <div
      className={isDragging ? "mapa-stage is-dragging" : "mapa-stage"}
      style={{ transform, width: IMG_W, height: IMG_H }}
    >
      <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} width={IMG_W} height={IMG_H}>
        <image href={FLOOR_PLAN_IMAGE_SRC} width={IMG_W} height={IMG_H} />
        {children}
      </svg>
    </div>
  </div>
);
