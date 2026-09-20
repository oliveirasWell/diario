# Spec 04 — Client data layer

Part of the school map feature (`docs/mapa/SPEC.md`), fourth in the PR chain (stacked on `mapa/03-domain-utils`).

## Scope

Wires the GraphQL API from spec 02 into the client, following the exact pattern used by every other domain (`evaluation`/`grade`), so spec 05+ components only ever call hooks — never `gqlRequest` directly.

In scope:
- `lib/gql-documents.ts`: `MapDataDocument` (query) + `AssignClassGroupDocument`, `SaveLessonCellDocument`, `ClearLessonCellDocument`, `CreateSubjectDocument` (mutations).
- `pnpm codegen:web` regenerating `src/gql/graphql.ts`/`src/gql/schema.ts` (generated, never hand-edited).
- `lib/query-options.ts`: `queryKeys.mapData` + `mapDataQueryOptions()`.
- `hooks/mapa/use-map-data.ts`: `useMapDataQuery`.
- `hooks/mapa/use-map-mutations.ts`: `useAssignClassGroupMutation`, `useSaveLessonCellMutation`, `useClearLessonCellMutation`, `useCreateSubjectMutation`, all via `useAppMutation`, invalidating `queryKeys.mapData()` on success.

Out of scope: any UI (spec 05+).

## Why a `hooks/mapa/` subfolder

Every existing domain keeps its query + mutation hooks in one file (`hooks/use-evaluations.ts`). The map domain has significantly more hooks once UI state is added (spec 05-07: pan/zoom, search, routing) — splitting data hooks from UI-state hooks now, both under `hooks/mapa/`, avoids one file accumulating unrelated concerns later. Same idea as the existing convention (one hook file per concern), just given its own folder because there are more concerns.

## Test-first, and why this spec has none of its own

The codebase has no hook-testing setup (no React Testing Library, no `hooks/*.test.ts` anywhere) — every existing data hook (`use-evaluations.ts`, `use-grades.ts`) is covered only by the resolver tests underneath it (spec 02, already green) plus manual/e2e verification. Adding a new testing dependency here would go against SPEC.md's "do not add dependencies the project doesn't already use." This spec's hooks are thin wiring (mirroring `use-evaluations.ts` almost line for line) with no branching logic of their own — the coverage config (`vitest.config.ts`) doesn't even include `hooks/**` or `lib/query-options.ts`. Correctness is verified by `pnpm codegen:check` + `pnpm typecheck`, and functionally in spec 06 once a page renders and calls these hooks against the real resolvers from spec 02.

## Done when

- `pnpm codegen:web` then `pnpm codegen:check` — generated types match the SDL and documents.
- `pnpm lint && pnpm typecheck && pnpm test:coverage` (unaffected — no new test files expected here).
