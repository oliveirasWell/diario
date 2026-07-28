# diario

A teacher dashboard for managing classes, students, attendance, evaluations, grades, and class invitations.

This is a pnpm/Turbo monorepo with:

- `apps/web`: Next.js App Router application, UI, and GraphQL API.
- `packages/db`: Prisma client and MongoDB schema, published internally as `@diario/db`.

## Requirements

- A Node.js version compatible with the project's dependencies.
- pnpm `10.33.3` (the version declared in `package.json`).
- An accessible MongoDB instance.
- Google OAuth credentials for sign-in.

## Local setup

```bash
pnpm install
pnpm env:sync
```

The first `pnpm env:sync` creates `.env.local` from `.env.example` and stops. Set at least `MONGODB_URI`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` there — the root file is the source of truth — then run `pnpm env:sync` again to propagate the values to the application and Prisma.

To prepare the database and GraphQL types in a new installation, run:

```bash
pnpm setup:all
```

This command approves Prisma binaries, generates the client, applies the schema to MongoDB, and updates GraphQL types. After changing the Prisma schema, run `pnpm db:generate` and then `pnpm db:push`.

## Development

```bash
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000). `pnpm dev` starts every application in the workspace. `pnpm dev:local` installs dependencies, prepares Prisma when possible, and starts the web application; by default, it refuses to use a database named `diario` to reduce the risk of accidentally using the production database. Set `ALLOW_PROD_DB_DEV=1` to override that check.

## Quality checks and code generation

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm codegen:check
pnpm build
```

Unit and integration tests use Vitest. End-to-end tests use Playwright and start the application on port `3000`. After changing `apps/web/schema.graphql` or operations in `apps/web/lib/gql-documents.ts`, run `pnpm codegen:web`; files in `apps/web/src/gql/` are generated and must not be edited manually.

## Observability (optional)

| Variable | Location | Purpose |
| --- | --- | --- |
| `SENTRY_DSN` | Server | Unexpected GraphQL and Node runtime errors |
| `NEXT_PUBLIC_SENTRY_DSN` | Client | Unhandled browser errors |

Sentry is enabled only in `NODE_ENV=production` when the applicable DSN is set. Development and CI do not send events.

Structured JSON logs live in `apps/web/lib/log.ts`; they use identifiers only, without PII such as student names or email addresses.
