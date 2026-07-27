type ClevelandArtwork = {
  title: string | null;
  creation_date: string | null;
  creators?: Array<{
    description?: string | null;
    name?: string | null;
  }>;
  images?: {
    web?: {
      url?: string | null;
    };
  };
};

type ClevelandArtworkResponse = {
  data?: ClevelandArtwork[];
};

export type Artwork = {
  title: string | null;
  artistTitle: string | null;
  dateDisplay: string | null;
  url: string;
};

async function fetchClevelandArtworks(): Promise<ClevelandArtwork[]> {
  const skip = Math.floor(Math.random() * 40000);
  const response = await fetch(
    `https://openaccess-api.clevelandart.org/api/artworks/?cc0=1&has_image=1&fields=id,title,creation_date,creators,images&limit=100&skip=${skip}`,
    { cache: "no-store", signal: AbortSignal.timeout(3000) },
  );

  if (!response.ok) {
    return [];
  }

  const { data = [] }: ClevelandArtworkResponse = await response.json();
  return data;
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
    const artworks = (await fetchClevelandArtworks())
      .map(toArtwork)
      .filter((artwork) => artwork !== null);
    return artworks[Math.floor(Math.random() * artworks.length)] ?? null;
  } catch {
    return null;
  }
}
