"use client";

import { useRef } from "react";
import { useMapDataQuery } from "@/hooks/mapa/use-map-data";
import { usePanZoom } from "@/hooks/mapa/use-pan-zoom";
import { formatGraphqlError } from "@/lib/graphql-error";
import { IMG_H, IMG_W } from "@/lib/mapa/geometry";
import { HotspotLayer } from "./hotspot-layer";
import { MapControls } from "./map-controls";
import { MapStage } from "./map-stage";
import { RoomLabelsLayer } from "./room-labels-layer";

export const MapaPage = () => {
  const { data, isLoading, isError, error } = useMapDataQuery();
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoom = usePanZoom(containerRef, IMG_W, IMG_H);

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[420px] flex-col gap-2">
      <h1 className="text-lg font-normal">Mapa da escola</h1>
      {isError && (
        <p className="text-sm text-destructive" role="alert">
          {formatGraphqlError(error)}
        </p>
      )}
      <div className="relative flex-1 border border-border">
        <MapStage containerRef={containerRef} transform={panZoom.transform} {...panZoom.handlers}>
          <HotspotLayer wasDragging={panZoom.wasDragging} />
          {data ? <RoomLabelsLayer roomShifts={data.roomShifts} /> : null}
        </MapStage>
        <MapControls
          onZoomIn={panZoom.zoomIn}
          onZoomOut={panZoom.zoomOut}
          onReset={panZoom.reset}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground">
            Carregando mapa...
          </div>
        )}
      </div>
    </div>
  );
};
