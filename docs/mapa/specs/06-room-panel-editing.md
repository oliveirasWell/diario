# Spec 06 — Room panel and editing

Part of the school map feature (`docs/mapa/SPEC.md`), sixth in the PR chain (stacked on `mapa/05-map-view`).

## Scope

Wires hotspot clicks to a room/POI info panel, and for rooms, the shift tabs + grade/section assignment + weekday x period lesson grid, backed by the spec 02/04 mutations.

- `components/mapa/location-panel.tsx` — the panel (`components/ui/dialog`), delegating to `RoomSchedule` for rooms.
- `components/mapa/room-schedule.tsx` — shift tabs, grade/section `<select>`s (calls `useAssignClassGroupMutation` once both are chosen), the 6x5 grid.
- `components/mapa/cell-editor-dialog.tsx` — subject `<select>` with inline creation (calls `useCreateSubjectMutation`), teacher `<input list>` (free text + datalist suggestions), save/clear (`useSaveLessonCellMutation`/`useClearLessonCellMutation`).
- `components/mapa/mapa-page.tsx` — now owns `selectedCode` state; `HotspotLayer.onSelectLocation` sets it, opening the panel.
- `components/mapa/types.ts` — `MapLocation`/`MapRoomShift`/`MapLesson`/`MapSubject`/`MapTeacher`, derived from `MapDataQuery`.

## Subject vs. teacher creation, per SPEC.md

SPEC.md distinguishes the two: "Subject is picked from a select, with inline creation" vs. "Teacher is free text, with suggestions and case-insensitive reuse." So subject stays a constrained `<select>` — inline creation calls `createSubject` explicitly (a real mutation, refetches `mapData`, auto-selects the new subject) — while teacher is a plain `<input list>` bound to a `<datalist>` of known names; `saveLessonCell`'s server-side find-or-create (spec 02) is what actually handles a new or differently-cased teacher name, matching the prototype's native-datalist-autocomplete behavior exactly.

## Verification

- `pnpm format && pnpm lint && pnpm typecheck && pnpm test:coverage` — all pass (no new automated tests here, same rationale as spec 04: no component-testing setup in this repo; the mutations underneath are covered by spec 02's resolver tests).
- `pnpm build` (with CI-matching env vars) — `/mapa` still prerenders as a static route with no errors.
- Manual, authenticated verification (opening a room, assigning a class, editing a cell, inline subject creation, teacher autocomplete) is left to the user — same constraint as spec 05: this sandbox has no real Google OAuth session, and `apps/web/proxy.ts` was not touched to work around that.

## CI note

This spec also fixes formatting drift found while investigating why PRs #24-28 were failing CI: `pnpm format:check` is a CI step (`Format check`) that was never run locally before this point in the chain. `docs/mapa/index.html` is now in `.prettierignore` (fixed on `mapa/01-data-model` and merged forward through every branch in the chain), and a few files across specs 02/03/05 needed a plain `prettier --write` pass. No behavior changed — formatting only.
