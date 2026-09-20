"use client";

import { useMemo, useRef, useState } from "react";
import { useMapDataQuery } from "@/hooks/mapa/use-map-data";
import { usePanZoom } from "@/hooks/mapa/use-pan-zoom";
import { formatGraphqlError } from "@/lib/graphql-error";
import { DEFAULT_USER_MARKER, MAP_COPY } from "@/lib/mapa/constants";
import { findPlacedLocation, IMG_H, IMG_W, toPixelCenter } from "@/lib/mapa/geometry";
import { shiftForOpenedLocation } from "@/lib/mapa/open-location";
import { buildRoute, type BuiltRoute } from "@/lib/mapa/route";
import { buildSearchIndex, matchSearchIndex } from "@/lib/mapa/search-index";
import type { SearchIndexEntry } from "@/lib/mapa/types";
import { FloorPlanLayer } from "./floor-plan-layer";
import { LocationPanel } from "./location-panel";
import { MapControls } from "./map-controls";
import { MapStage } from "./map-stage";
import { NavPanel } from "./nav-panel";
import { RoomLabelsLayer } from "./room-labels-layer";
import { RouteLayer } from "./route-layer";
import { SearchBar } from "./search-bar";
import { SearchTargetLayer } from "./search-target-layer";

export const MapaPage = () => {
  const { data, isLoading, isError, error } = useMapDataQuery();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const panZoom = usePanZoom({
    containerRef,
    contentWidth: IMG_W,
    contentHeight: IMG_H,
    getTopInset: () => {
      const searchBar = searchBarRef.current;
      if (!searchBar) {
        return 8;
      }
      return searchBar.offsetTop + searchBar.offsetHeight + 8;
    },
  });

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [panelShift, setPanelShift] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTargetCode, setSearchTargetCode] = useState<string | null>(null);
  const [searchTargetShift, setSearchTargetShift] = useState<string | undefined>(undefined);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [originCode, setOriginCode] = useState("");
  const [destinationCode, setDestinationCode] = useState("");
  const [originMarker, setOriginMarker] = useState<string>(DEFAULT_USER_MARKER);
  const [route, setRoute] = useState<BuiltRoute | null>(null);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(true);

  const searchIndex = useMemo(
    () =>
      buildSearchIndex({
        locations: data?.locations ?? [],
        roomShifts: data?.roomShifts ?? [],
      }),
    [data],
  );
  const searchResults = useMemo(
    () => matchSearchIndex(searchIndex, searchQuery),
    [searchIndex, searchQuery],
  );

  const selectedGeometry = selectedCode ? findPlacedLocation(selectedCode) : undefined;
  const selectedDbLocation = data?.locations.find((location) => location.code === selectedCode);
  const selectedRoomShifts =
    data?.roomShifts.filter((roomShift) => roomShift.location.code === selectedCode) ?? [];
  const searchTarget = searchTargetCode ? (findPlacedLocation(searchTargetCode) ?? null) : null;

  const hideHint = () => {
    if (hintVisible) {
      setHintVisible(false);
    }
  };

  const clearSearchTarget = () => {
    setSearchTargetCode(null);
    setSearchTargetShift(undefined);
  };

  const openLocation = (code: string, shift?: string) => {
    hideHint();
    setSelectedCode(code);
    setPanelShift(shiftForOpenedLocation(shift, code, searchTargetCode, searchTargetShift));
    if (searchTargetCode === code) {
      clearSearchTarget();
    }
  };

  const closeLocation = () => {
    setSelectedCode(null);
    setPanelShift(undefined);
  };

  const handleSearchSelect = (entry: SearchIndexEntry) => {
    const location = findPlacedLocation(entry.locationCode);
    if (!location) {
      return;
    }
    setSearchQuery("");
    setSelectedCode(null);
    setPanelShift(undefined);
    setSearchTargetCode(entry.locationCode);
    setSearchTargetShift(entry.shift);
    const [x, y] = toPixelCenter(location);
    panZoom.centerOn(x, y);
    hideHint();
  };

  const openNav = (destination?: string) => {
    if (destination) {
      setDestinationCode(destination);
    }
    setIsNavOpen(true);
    closeLocation();
  };

  const showRoute = () => {
    if (!originCode || !destinationCode) {
      setRouteMessage(MAP_COPY.selectOriginDestination);
      return;
    }
    if (originCode === destinationCode) {
      setRouteMessage(MAP_COPY.sameOriginDestination);
      return;
    }
    const nextRoute = buildRoute(originCode, destinationCode);
    if (!nextRoute) {
      setRouteMessage(MAP_COPY.routeFailed);
      return;
    }
    setRoute(nextRoute);
    setRouteMessage(null);
    setIsNavOpen(false);
    const mid = nextRoute.points[Math.floor(nextRoute.points.length / 2)];
    if (mid) {
      panZoom.centerOn(mid.x, mid.y);
    }
  };

  return (
    <div className="mapa-app">
      {isError && (
        <p className="px-3 py-2 text-sm text-destructive" role="alert">
          {formatGraphqlError(error)}
        </p>
      )}
      <MapStage
        containerRef={containerRef}
        transform={panZoom.transform}
        isDragging={panZoom.isDragging}
      >
        <FloorPlanLayer
          activeCode={selectedCode ?? searchTargetCode}
          onSelectLocation={(code) => openLocation(code)}
          wasDragging={panZoom.wasDragging}
        />
        {data ? (
          <RoomLabelsLayer
            roomShifts={data.roomShifts}
            onSelectLocation={(code, shift) => openLocation(code, shift)}
          />
        ) : null}
        <RouteLayer route={route} originMarker={originMarker} />
        <SearchTargetLayer
          location={searchTarget}
          scale={panZoom.scale}
          onSelect={(code) => openLocation(code)}
          wasDragging={panZoom.wasDragging}
        />
      </MapStage>

      <SearchBar
        containerRef={searchBarRef}
        query={searchQuery}
        results={searchResults}
        onQueryChange={setSearchQuery}
        onSelectResult={handleSearchSelect}
      />

      {isLoading ? <p className="mapa-hint">{MAP_COPY.loading}</p> : null}
      {!isLoading && hintVisible ? <p className="mapa-hint">{MAP_COPY.hint}</p> : null}

      {searchTarget ? (
        <div className="mapa-toast" role="status">
          <span>{MAP_COPY.searchToast(searchTarget.name)}</span>
          <button
            type="button"
            className="mapa-toast-close"
            aria-label={MAP_COPY.close}
            onClick={clearSearchTarget}
          >
            ×
          </button>
        </div>
      ) : null}

      <button type="button" className="mapa-nav-btn" onClick={() => openNav()}>
        {MAP_COPY.howToGet}
      </button>

      <div
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <MapControls
          onZoomIn={panZoom.zoomIn}
          onZoomOut={panZoom.zoomOut}
          onReset={panZoom.reset}
        />
      </div>

      {selectedGeometry ? (
        <LocationPanel
          location={selectedGeometry}
          dbLocation={selectedDbLocation}
          roomShifts={selectedRoomShifts}
          subjects={data?.subjects ?? []}
          teachers={data?.teachers ?? []}
          initialShift={panelShift}
          onRouteHere={openNav}
          onClose={closeLocation}
        />
      ) : null}

      {isNavOpen ? (
        <NavPanel
          originCode={originCode}
          destinationCode={destinationCode}
          originMarker={originMarker}
          infoMessage={routeMessage}
          onOriginChange={setOriginCode}
          onDestinationChange={setDestinationCode}
          onOriginMarkerChange={setOriginMarker}
          onShowRoute={showRoute}
          onClearRoute={() => {
            setRoute(null);
            setRouteMessage(null);
          }}
          onClose={() => setIsNavOpen(false)}
        />
      ) : null}
    </div>
  );
};
