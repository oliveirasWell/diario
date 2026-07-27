import { Suspense } from "react";
import { ArtworkCaption } from "./artwork-caption";
import { getArtwork } from "./artwork";
import { LoginClient } from "./client";

const artworkFallback = "linear-gradient(135deg, oklch(0.2 0.04 260), oklch(0.55 0.16 35))";

export default async function LoginPage() {
  const art = await getArtwork();

  return (
    <div className="relative left-1/2 grid min-h-screen w-screen -mx-[50vw] grid-rows-[1fr_auto] md:h-screen md:grid-cols-2 md:grid-rows-none">
      <section
        className="absolute inset-0 overflow-hidden bg-cover bg-center md:relative md:inset-auto md:col-start-1 md:h-full"
        style={{
          backgroundImage: art ? `url("${art.url}"), ${artworkFallback}` : artworkFallback,
        }}
      >
        {art ? <ArtworkCaption art={art} /> : null}
      </section>
      <Suspense
        fallback={<div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>}
      >
        <LoginClient />
      </Suspense>
    </div>
  );
}
