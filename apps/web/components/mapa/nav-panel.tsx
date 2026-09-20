"use client";

import { useState } from "react";
import { DEFAULT_USER_MARKER, MAP_COPY, USER_MARKER_OPTIONS } from "@/lib/mapa/constants";
import { routableLocations } from "@/lib/mapa/geometry";

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
    <div
      className="mapa-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mapa-panel" role="dialog" aria-modal="true" aria-labelledby="mapa-nav-title">
        <h2 id="mapa-nav-title">{MAP_COPY.navPanelTitle}</h2>
        <label htmlFor="mapa-origin">{MAP_COPY.originLabel}</label>
        <select
          id="mapa-origin"
          className="mapa-select"
          value={originCode}
          onChange={(event) => onOriginChange(event.target.value)}
        >
          <option value="">{MAP_COPY.selectLocation}</option>
          {locations.map((location) => (
            <option key={location.code} value={location.code}>
              {location.name}
            </option>
          ))}
        </select>
        <label htmlFor="mapa-destination">{MAP_COPY.destinationLabel}</label>
        <select
          id="mapa-destination"
          className="mapa-select"
          value={destinationCode}
          onChange={(event) => onDestinationChange(event.target.value)}
        >
          <option value="">{MAP_COPY.selectLocation}</option>
          {locations.map((location) => (
            <option key={location.code} value={location.code}>
              {location.name}
            </option>
          ))}
        </select>
        <label>{MAP_COPY.markerLabel}</label>
        <div className="mapa-emoji-picker">
          {USER_MARKER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={option === marker ? "mapa-emoji-opt is-selected" : "mapa-emoji-opt"}
              onClick={() => {
                setMarker(option);
                onOriginMarkerChange(option);
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {infoMessage ? (
          <p className="mapa-form-error" role="alert">
            {infoMessage}
          </p>
        ) : null}
        <div className="mapa-nav-actions">
          <button type="button" className="mapa-show-route" onClick={onShowRoute}>
            {MAP_COPY.showRoute}
          </button>
          <button type="button" className="mapa-clear-route" onClick={onClearRoute}>
            {MAP_COPY.clearRoute}
          </button>
        </div>
        <button type="button" className="mapa-panel-text-close" onClick={onClose}>
          {MAP_COPY.closePanel}
        </button>
      </div>
    </div>
  );
};
