"use client";

import type { RefObject, SyntheticEvent } from "react";
import { MAP_COPY } from "@/lib/mapa/constants";
import type { SearchIndexEntry } from "@/lib/mapa/types";

type SearchBarProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  query: string;
  results: SearchIndexEntry[];
  onQueryChange: (value: string) => void;
  onSelectResult: (entry: SearchIndexEntry) => void;
};

const stopMapGesture = (event: SyntheticEvent) => {
  event.stopPropagation();
};

export const SearchBar = ({
  containerRef,
  query,
  results,
  onQueryChange,
  onSelectResult,
}: SearchBarProps) => (
  <div
    ref={containerRef}
    className="mapa-search"
    onMouseDown={stopMapGesture}
    onTouchStart={stopMapGesture}
  >
    <input
      aria-label={MAP_COPY.searchPlaceholder}
      placeholder={MAP_COPY.searchPlaceholder}
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
    />
    {query.trim() ? (
      <div className="mapa-search-results" role="listbox">
        {results.length === 0 ? (
          <div className="mapa-search-item">{MAP_COPY.searchEmpty}</div>
        ) : (
          results.map((entry, index) => (
            <button
              key={`${entry.tag}:${entry.locationCode}:${index}`}
              type="button"
              className="mapa-search-item"
              onClick={() => onSelectResult(entry)}
            >
              <span className="mapa-search-tag">{entry.tag}</span>
              <span>{entry.label}</span>
            </button>
          ))
        )}
      </div>
    ) : null}
  </div>
);
