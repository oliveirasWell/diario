# Spec 03 — Domain utilities and static assets

Part of the school map feature (`docs/mapa/SPEC.md`), third in the PR chain (stacked on `mapa/02-graphql-api`).

## Scope

Everything the UI (spec 05+) needs that is pure logic or static configuration, extracted verbatim from `docs/mapa/index.html`. Nothing here touches the network or React — plain, independently testable modules.

In scope:
- `apps/web/public/mapa/planta-baixa.png` — the floor plan image, decoded from the prototype's inline base64 `data:` URI (1155×1362 PNG). First static asset in this app; `apps/web/public/` didn't exist before.
- `apps/web/lib/mapa/geometry.ts` — `IMG_W`/`IMG_H`, the `rooms`/`pois` arrays (code, name, normalized x/y/width/height), `navNodes`/`navEdges` (the Dijkstra routing graph). Matched to `Location.code` at runtime — this data does **not** go in the database (SPEC.md § "Static assets").
- `apps/web/lib/mapa/constants.ts` — `DAYS`, `PERIODS`, `SHIFTS` (with the badge colors from the prototype's `turnoLabelStyle`), `GRADE_OPTIONS`/`SECTION_OPTIONS`, `USER_MARKER_OPTIONS`.
- `apps/web/lib/mapa/normalize-text.ts` — accent-insensitive text normalization (NFD + strip diacritics + lowercase), used by search and by the client-side "reuse teacher/subject" matching.
- `apps/web/lib/mapa/dijkstra.ts` — shortest-path over `navNodes`/`navEdges` (small graph, O(n²) is fine, matching the prototype).
- `apps/web/lib/mapa/search-index.ts` — builds the search index (rooms, POIs, assigned class groups, filled lesson cells) from a loaded `MapData`, and matches a query against it (AND-tokenized substring match, using `normalize-text`).
- `apps/web/lib/mapa/types.ts` — shared types for the geometry/constants/search modules.

Out of scope: anything that renders UI or calls the GraphQL API (spec 04+).

## Test-first

`dijkstra.test.ts` and `normalize-text.test.ts` are written before their implementations (pure functions, straightforward to specify from `docs/mapa/SPEC.md` and the extracted prototype behavior). `search-index.test.ts` follows the same approach against a small hand-built `MapData` fixture. `geometry.ts`/`constants.ts` are data, not logic — covered by being imported, no dedicated test.

## Done when

- `dijkstra.test.ts`, `normalize-text.test.ts`, `search-index.test.ts` pass.
- `pnpm lint && pnpm typecheck && pnpm test:coverage` pass — `lib/mapa/**/*.ts` is included in the coverage thresholds (`lib/**/*.ts` per `vitest.config.ts`), so these need real coverage, not just imports.
- `apps/web/public/mapa/planta-baixa.png` is a valid 1155×1362 PNG, reachable at `/mapa/planta-baixa.png` once the dev server serves `public/`.
