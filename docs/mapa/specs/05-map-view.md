# Spec 05 — Map view (read-only)

Part of the school map feature (`docs/mapa/SPEC.md`), fifth in the PR chain (stacked on `mapa/04-client-data-layer`).

## Scope

The page route and the read-only map canvas: pan/zoom, the floor plan image, room/POI hotspots, and class-group badges over occupied rooms. No panels yet (spec 06) — hotspots render and are click-ready (`onSelectLocation`), but nothing is wired to that callback until the room panel exists.

In scope:
- `app/mapa/page.tsx` — the `/mapa` route (thin, `export default`).
- `components/mapa/mapa-page.tsx` — orchestrator: loads `useMapDataQuery`, owns the pan/zoom container ref, composes the stage/layers/controls.
- `components/mapa/map-stage.tsx` — the pannable/zoomable SVG canvas rendering the floor plan image.
- `components/mapa/hotspot-layer.tsx` — clickable room/POI rects.
- `components/mapa/room-labels-layer.tsx` — class-group badges stacked over occupied rooms.
- `components/mapa/map-controls.tsx` — zoom in/out/reset.
- `hooks/mapa/use-pan-zoom.ts` — the pan/zoom engine (pointer-drag pan, wheel zoom, two-finger pinch, drag-vs-click threshold), adapted from the prototype's vanilla-JS stage engine.
- `lib/mapa/geometry.ts`: added `toPixelRect`/`toPixelCenter` (normalized → pixel conversion, needed by the layers above) — with tests.

## A real bug this spec caught

`MapDataDocument` (spec 04) only selected `id code` on `roomShifts[].location`, not `name`/`kind`. `search-index.ts` (spec 03) needs `location.name` to build its search terms — this was a genuine functional gap, not just a type mismatch, caught by `tsc` once a real component tried to pass query data through the full `lib/mapa` type contracts. Fixed by selecting the full `Location` shape in both `MapDataDocument` and `AssignClassGroupDocument`, then regenerating codegen.

## A layout adaptation from the prototype

The prototype is a full-viewport SPA (`overflow:hidden` on `html`/`body`). This project's root layout wraps every page in a fixed header + `max-w-6xl` content column (`apps/web/CLAUDE.md`'s established chrome) — changing that shell is out of scope for one feature. The map instead renders inside a bounded container (`h-[calc(100vh-8rem)]`) within the normal page column; pan/zoom works the same way inside that box. Noted here rather than silently deviating from "same design" without explanation.

## React Compiler note

`next.config.ts` has `reactCompiler: true`. The pan/zoom hook's return value must never mix a ref together with derived render data — the compiler's ref-safety analysis treats a returned object as "ref-like" the moment any field in it is a ref, and then flags every other field read from that same object as an unsafe render-time ref access. `usePanZoom` therefore takes `containerRef` as a parameter (created by the caller) instead of creating and returning one.

## Verification

No React Testing Library in this repo (spec 04's rationale applies here too), so this spec is verified by:
- `pnpm lint && pnpm typecheck && pnpm test:coverage` (green, coverage unaffected — components/hooks aren't in the enforced coverage path).
- `pnpm --filter web build` — full production build, `/mapa` prerenders as a static route (`○`) alongside `/` and `/classes`, no server or auth needed. This is how this spec was checked end-to-end without a running dev server: `apps/web/proxy.ts` gates every route behind a NextAuth session (including `/api/graphql`) and stays untouched — no route is made public for testing, in dev or otherwise.
- Manual, authenticated verification in a real browser (pan/zoom feel, hotspot hover/click) is left to the user, since this sandbox has no real Google OAuth credentials to sign in with.
