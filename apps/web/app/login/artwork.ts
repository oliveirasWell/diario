import { log } from "@/lib/log";
import { ARTWORK_FETCH_TIMEOUT_MS, ARTWORK_MAX_SKIP, CLEVELAND_ARTWORK_API_URL } from "./constants";
import type { Artwork, ClevelandArtwork, ClevelandArtworkResponse } from "./types";

async function fetchClevelandArtwork(): Promise<ClevelandArtwork | null> {
  const skip = Math.floor(Math.random() * ARTWORK_MAX_SKIP);
  const response = await fetch(
    `${CLEVELAND_ARTWORK_API_URL}?cc0=1&has_image=1&fields=id,title,creation_date,creators,images&limit=1&skip=${skip}`,
    { cache: "no-store", signal: AbortSignal.timeout(ARTWORK_FETCH_TIMEOUT_MS) },
  );

  if (!response.ok) {
    log.warn("login_artwork_fetch_not_ok", { status: response.status });
    return null;
  }

  const { data = [] }: ClevelandArtworkResponse = await response.json();
  return data[0] ?? null;
}

function toArtwork(artwork: ClevelandArtwork): Artwork | null {
  const url = artwork.images?.web?.url;

  if (!url) {
    return null;
  }

  return {
    title: artwork.title,
    artistTitle: artwork.creators?.[0]?.description ?? artwork.creators?.[0]?.name ?? null,
    dateDisplay: artwork.creation_date,
    url,
  };
}

export async function getArtwork(): Promise<Artwork | null> {
  try {
    const artwork = await fetchClevelandArtwork();
    return artwork ? toArtwork(artwork) : null;
  } catch (err) {
    log.error("login_artwork_fetch_failed", undefined, err);
    return null;
  }
}
