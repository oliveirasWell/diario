"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DEFAULT_USER_MARKER, MAP_COPY, USER_MARKER_OPTIONS } from "@/lib/mapa/constants";
import { routableLocations } from "@/lib/mapa/geometry";
import { NATIVE_SELECT_CLASS_NAME } from "./constants";

type NavPanelProps = {
  originCode: string;
  destinationCode: string;
  originMarker: string;
  infoMessage: string | null;
  onOriginChange: (code: string) => void;
  onDestinationChange: (code: string) => void;
  onOriginMarkerChange: (marker: string) => void;
  onShowRoute: () => void;
  onClearRoute: () => void;
  onClose: () => void;
};

export const NavPanel = ({
  originCode,
  destinationCode,
  originMarker,
  infoMessage,
  onOriginChange,
  onDestinationChange,
  onOriginMarkerChange,
  onShowRoute,
  onClearRoute,
  onClose,
}: NavPanelProps) => {
  const [marker, setMarker] = useState(originMarker || DEFAULT_USER_MARKER);
  const locations = routableLocations();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{MAP_COPY.navPanelTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mapa-origin">{MAP_COPY.originLabel}</Label>
            <select
              id="mapa-origin"
              className={NATIVE_SELECT_CLASS_NAME}
              value={originCode}
              onChange={(event) => onOriginChange(event.target.value)}
            >
              <option value="" />
              {locations.map((location) => (
                <option key={location.code} value={location.code}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mapa-destination">{MAP_COPY.destinationLabel}</Label>
            <select
              id="mapa-destination"
              className={NATIVE_SELECT_CLASS_NAME}
              value={destinationCode}
              onChange={(event) => onDestinationChange(event.target.value)}
            >
              <option value="" />
              {locations.map((location) => (
                <option key={location.code} value={location.code}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{MAP_COPY.markerLabel}</Label>
            <div className="flex flex-wrap gap-1">
              {USER_MARKER_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={option === marker ? "default" : "outline"}
                  onClick={() => {
                    setMarker(option);
                    onOriginMarkerChange(option);
                  }}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          {infoMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {infoMessage}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClearRoute}>
            {MAP_COPY.clearRoute}
          </Button>
          <Button type="button" onClick={onShowRoute}>
            {MAP_COPY.showRoute}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
