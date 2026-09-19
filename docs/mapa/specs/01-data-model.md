# Spec 01 — Data model

Part of the school map feature (`docs/mapa/SPEC.md`). Full plan and PR chain: `docs/mapa/SPEC.md` + implementation plan.

## Scope

Persist the school map's domain model in `packages/db/prisma/schema.prisma`, and seed the fixed master data (locations, subjects) that the HTML prototype hard-codes in memory.

In scope:
- Prisma models: `Location`, `Teacher`, `Subject`, `ClassGroup`, `RoomShift`, `Lesson`.
- Enums: `LocationKind`, `Shift`, `Weekday`.
- Seed script (`packages/db/scripts/seed.cjs`) for the 16 rooms + 16 POIs (as `Location`) and 8 subjects, extracted verbatim from `docs/mapa/index.html`.

Out of scope (later specs): GraphQL API, resolvers, UI, static geometry config (room/POI coordinates and the nav graph stay in application code, not the database — see SPEC.md "Static assets").

## Data model

See `docs/mapa/SPEC.md` § "Data model" and § "Relationships" for the authoritative field list and lifecycle rules (RoomShift created on demand, deleting a RoomShift deletes its Lessons, Subject/Teacher in use can't be deleted). This spec only adds the schema; lifecycle behavior is implemented by the resolvers in spec 02.

Conventions followed (existing models in the same file):
- `id String @id @default(auto()) @map("_id") @db.ObjectId` on every model.
- Foreign keys as plain `String @db.ObjectId` + an explicit `@relation` field, no `onDelete` cascade (cascading deletes are done manually in resolvers, per `class.ts`'s `deleteClass`).
- Compound `@@unique` indexes back every find-or-create/upsert target.

## Do not seed

The HTML prototype's example data (class "5º A", "Prof. Ana", one Monday-1st-period English lesson in Sala 07) is illustrative only — the seed script must not create it. `Teacher`, `ClassGroup`, `RoomShift`, and `Lesson` all start empty; only `Location` and `Subject` are seeded.

## Done when

- `pnpm db:generate` (Prisma client generation) succeeds against the new schema.
- `pnpm typecheck` passes.
- `packages/db/scripts/seed.cjs` upserts by `Location.code` / `Subject.normalizedName`, so it is safe to run more than once.
