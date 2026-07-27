import type { Artwork } from "./artwork";

type ArtworkCaptionProps = {
  art: Artwork;
};

export function ArtworkCaption({ art }: ArtworkCaptionProps) {
  const caption = [art.title, art.artistTitle, art.dateDisplay].filter(Boolean).join(" · ");

  if (!caption) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 to-transparent p-4 pb-16 text-sm text-white md:top-auto md:bottom-0 md:bg-gradient-to-t md:p-6 md:pt-16 md:text-xs">
      {caption}
    </div>
  );
}
