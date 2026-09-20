"use client";

import { memo } from "react";
import { DEFAULT_USER_MARKER, DESTINATION_MARKER } from "@/lib/mapa/constants";
import { routePathData, type BuiltRoute } from "@/lib/mapa/route";

type RouteLayerProps = {
  route: BuiltRoute | null;
  originMarker?: string;
};

const RouteLayerComponent = ({ route, originMarker = DEFAULT_USER_MARKER }: RouteLayerProps) => {
  if (!route) {
    return null;
  }
  const origin = route.points[0];
  const destination = route.points[route.points.length - 1];
  if (!origin || !destination) {
    return null;
  }
  return (
    <g pointerEvents="none">
      <path className="mapa-route-line" d={routePathData(route.points)} />
      <circle className="mapa-route-marker-bg" cx={origin.x} cy={origin.y} r={22} />
      <text className="mapa-route-marker-text" x={origin.x} y={origin.y}>
        {originMarker}
      </text>
      <circle className="mapa-route-marker-bg" cx={destination.x} cy={destination.y} r={22} />
      <text className="mapa-route-marker-text" x={destination.x} y={destination.y}>
        {DESTINATION_MARKER}
      </text>
    </g>
  );
};
RouteLayerComponent.displayName = "RouteLayer";

export const RouteLayer = memo(RouteLayerComponent);
