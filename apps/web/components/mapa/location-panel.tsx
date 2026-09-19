"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoomSchedule } from "./room-schedule";
import type { MapLocation, MapRoomShift, MapSubject, MapTeacher } from "./types";

type LocationPanelProps = {
  location: MapLocation;
  roomShifts: MapRoomShift[];
  subjects: MapSubject[];
  teachers: MapTeacher[];
  onClose: () => void;
};

/** Room/POI info panel — the reference prototype's `#panel`. For a room, delegates the schedule grid to `RoomSchedule`. */
export const LocationPanel = ({
  location,
  roomShifts,
  subjects,
  teachers,
  onClose,
}: LocationPanelProps) => (
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{location.name}</DialogTitle>
      </DialogHeader>
      {location.kind === "ROOM" ? (
        <RoomSchedule
          locationId={location.id}
          roomShifts={roomShifts}
          subjects={subjects}
          teachers={teachers}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Ponto de interesse.</p>
      )}
    </DialogContent>
  </Dialog>
);
