# Spec 02 — GraphQL API

Part of the school map feature (`docs/mapa/SPEC.md`), second in the PR chain (stacked on `mapa/01-data-model`, see `docs/mapa/specs/01-data-model.md` for the schema this builds on).

## Scope

The server-side GraphQL API for the map: one query that returns everything the page needs in a single read, and the four operations listed in SPEC.md § "Operations".

In scope:
- `schema.graphql`: `Query.mapData`, `Mutation.assignClassGroup/saveLessonCell/clearLessonCell/createSubject`, and the supporting object/enum types.
- `apps/web/lib/graphql/resolvers/map.ts`: `mapQueryResolvers`, `mapMutationResolvers`.
- Enum bridging (`LocationKind`, `Shift`, `Weekday`) in `lib/graphql/db-bridge.ts`, mirroring the existing `AttendanceStatus` bridge — GraphQL and Prisma share wire values, so the bridge is a typed identity cast.
- Wiring into `lib/graphql/resolvers/index.ts`.

Out of scope: any client-side code (gql-documents, hooks, components) — that's spec 04+. Delete mutations for `Teacher`/`Subject`/`RoomShift` are not part of SPEC.md's Operations list and are not added here.

## Authorization

Per the confirmed decision in the plan: any authenticated user may read and write map data — no per-user/per-class scoping (the data model has no owner field). Queries follow the codebase's existing soft-fail convention for anonymous access (return empty data, like `gradesByClass`/`evaluations`); mutations hard-fail with `Unauthorized` (like `requireOwnerIds`), via a local `requireAuthenticatedUser` — there is no ownership set to check, so this doesn't belong in the generic `lib/graphql/auth.ts` helpers built around `Class` ownership.

## Operations (SPEC.md § Operations)

- `assignClassGroup(locationId, shift, grade, section)`: find-or-create `ClassGroup` by `(grade, section)`, find-or-create the `RoomShift`, set its `classGroupId`.
- `saveLessonCell(locationId, shift, weekday, period, subjectName, teacherName)`: one transaction — find-or-create `Teacher`/`Subject` by normalized name, find-or-create the `RoomShift`, upsert the `Lesson` on `(roomShiftId, weekday, period)`.
- `clearLessonCell(locationId, shift, weekday, period)`: delete the matching `Lesson` if any; no-op (not an error) if the `RoomShift` doesn't exist yet.
- `createSubject(name)`: find-or-create `Subject` by normalized name.
- `mapData`: a single read — all `Location`, `RoomShift` (with `location`, `classGroup`, `lessons.subject`, `lessons.teacher` included), `Subject`, `Teacher`.

## Test-first

`lib/graphql/resolvers/map.test.ts` is written before `map.ts`, using the same fixtures as every other domain (`test/prisma-mock.ts`, `test/graphql-context.ts`), one `it` per behavior: anonymous vs. authenticated, create vs. reuse (find-or-create), update vs. create (upsert), and the "RoomShift doesn't exist yet" no-op case for `clearLessonCell`.

## Done when

- `map.test.ts` passes against `map.ts`.
- `lib/graphql/graphql.integration.test.ts` (which builds the real schema from `schema.graphql` + `resolvers`) still passes, proving the SDL and resolver wiring are consistent.
- `pnpm codegen:web`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass.
