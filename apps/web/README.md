# diario web application

This is the monorepo's Next.js application. It contains the UI, App Router routes, NextAuth authentication, and GraphQL API.

Run commands from the repository root, where the workspace configuration and environment files live:

```bash
pnpm env:sync
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000). See the [root README](../../README.md) for requirements, MongoDB and OAuth setup, Prisma/GraphQL generation, and test commands.

`src/gql/` contains generated code. After changing the schema or GraphQL documents, run `pnpm codegen:web` from the root instead of editing those files manually.
