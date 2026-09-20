"use client";

import { MAP_COPY } from "@/lib/mapa/constants";
import type { PlacedLocation } from "@/lib/mapa/types";
import { RoomSchedule } from "./room-schedule";
import type { MapLocation, MapRoomShift, MapSubject, MapTeacher } from "./types";

type LocationPanelProps = {
  location: PlacedLocation;
  dbLocation?: MapLocation;
  roomShifts: MapRoomShift[];
  subjects: MapSubject[];
  teachers: MapTeacher[];
  initialShift?: string;
  onRouteHere: (code: string) => void;
  onClose: () => void;
};

export const LocationPanel = ({
  location,
  dbLocation,
  roomShifts,
  subjects,
  teachers,
  initialShift,
  onRouteHere,
  onClose,
}: LocationPanelProps) => (
  <div
    className="mapa-overlay"
    onClick={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}
  >
    <div className="mapa-panel" role="dialog" aria-modal="true" aria-labelledby="mapa-panel-title">
      <span className="mapa-panel-tag">
        {location.kind === "ROOM" ? MAP_COPY.roomTag : MAP_COPY.poiTag}
      </span>
      <h2 id="mapa-panel-title">{location.name}</h2>
      <button type="button" className="mapa-goto-nav" onClick={() => onRouteHere(location.code)}>
        {MAP_COPY.howToGetHere}
      </button>
      {location.kind === "ROOM" ? (
        <>
          {!dbLocation ? <p className="mapa-seed-note">{MAP_COPY.seedLocations}</p> : null}
          <RoomSchedule
            key={location.code}
            locationCode={location.code}
            locationName={location.name}
            locationId={dbLocation?.id}
            roomShifts={roomShifts}
            subjects={subjects}
            teachers={teachers}
            initialShift={initialShift}
          />
        </>
      ) : (
        <p>{MAP_COPY.poiDescription}</p>
      )}
      <button type="button" className="mapa-panel-close" onClick={onClose}>
        {MAP_COPY.closePanel}
      </button>
    </div>
  </div>
);
