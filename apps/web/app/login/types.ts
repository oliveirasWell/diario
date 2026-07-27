export type ClevelandArtwork = {
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

export type ClevelandArtworkResponse = {
  data?: ClevelandArtwork[];
};

export type Artwork = {
  title: string | null;
  artistTitle: string | null;
  dateDisplay: string | null;
  url: string;
};
