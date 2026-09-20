"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <p className="text-xs font-bold tracking-wide text-primary uppercase" aria-hidden>
          {location.kind === "ROOM" ? MAP_COPY.roomTag : MAP_COPY.poiTag}
        </p>
        <DialogTitle>{location.name}</DialogTitle>
      </DialogHeader>
      <Button type="button" variant="secondary" onClick={() => onRouteHere(location.code)}>
        {MAP_COPY.howToGetHere}
      </Button>
      {location.kind === "ROOM" && dbLocation ? (
        <RoomSchedule
          key={location.code}
          locationId={dbLocation.id}
          roomShifts={roomShifts}
          subjects={subjects}
          teachers={teachers}
          initialShift={initialShift}
        />
      ) : location.kind === "POI" ? (
        <p className="text-sm text-muted-foreground">{MAP_COPY.poiDescription}</p>
      ) : null}
    </DialogContent>
  </Dialog>
);
