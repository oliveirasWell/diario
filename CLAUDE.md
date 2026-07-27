# Diario

Teacher dashboard: classes, students, attendance, grades, evaluations, class invites.

pnpm workspace + Turbo. `apps/web` (Next.js App Router + GraphQL API + UI), `packages/db` (Prisma/MongoDB wrapper, exported as `@diario/db`).

Versions live in `package.json`, env vars in `.env.example`, domain model in `packages/db/prisma/schema.prisma` and `apps/web/schema.graphql`.

## Architecture

- App Router pages stay thin; client behavior goes in components/hooks.
- Root redirects to `/classes`; class routes under `app/classes/[classId]/`.
- GraphQL: SDL in `apps/web/schema.graphql`, schema factory composes resolvers from `lib/graphql/resolvers/*` (one file per domain: class, enrollment, evaluation, grade, attendance).
- GraphQL context exposes `user` from the NextAuth server session.
- `apps/web/src/gql/` is generated — never hand-edited.
- Client operations in `lib/gql-documents.ts`; `pnpm codegen:web` regenerates typed documents.
- Hooks in `hooks/*`; mutations use `useAppMutation` for consistent error messages and reset behavior.
- Query keys/options in `lib/query-options.ts` so invalidation stays consistent.
- Prisma client cached on `globalThis` outside production.
- Sentry only in production with a DSN present.

## Styling

- Theme = OKLCH CSS variables in `app/globals.css`. Default radius `0` — UI is square, light, compact.
- Layout: `sm:max-w-6xl`, mobile-first `px-3 sm:px-6`. `tabular-nums` on `<html>`.
- Reuse `components/ui/*` before adding a primitive. Prefer native controls (`input[type="date"]`, `number`) over UI dependencies.

## Commands

`pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:coverage` · `pnpm test:e2e` · `pnpm codegen:check`

Setup: `pnpm setup:all` (env sync, Prisma approve/generate, db push, codegen). Schema changes: `pnpm db:generate` then `pnpm db:push`.

Vitest (node env) for unit/integration, Playwright (chromium, dev server on :3000) for e2e. Coverage: V8, 80% thresholds on core libs/resolvers/auth.

## Rules

- Keep diffs small and domain-local.
- Schema change order: SDL/Prisma → implementation → codegen → tests.
- Comments only for non-obvious why.
- No abbreviated identifiers: `queryClient` not `qc`, `context` not `ctx`, `dayKey` not `dk`, `transaction` not `tx`, `record` not `r`. Only universal short names stay: `id`, `url`, `i`.
- Tests: one behavior per `it`, named after the behavior. No ordered `mockResolvedValueOnce` chains encoding a flow. Repeated ids go in named constants.
- Never hide TypeScript/build errors.
- Lint/test scripts check by default; autofix belongs in explicit fix commands.
- No new dependency when the platform, stdlib, or an installed dependency is enough.
