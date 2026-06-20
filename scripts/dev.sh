#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Ensure deps installed
pnpm install

# Try to generate Prisma client if approved; ignore failure (Mongo/NextAuth don't need Prisma to run dev)
if pnpm --filter @diario/db prisma generate; then
  echo "Prisma client generated"
else
  echo "Skipping prisma generate (approve builds later with: pnpm approve-builds prisma @prisma/client @prisma/engines)"
fi

# Ensure env file exists (do not overwrite)
if [ ! -f apps/web/.env.local ]; then
  cp apps/web/.env.example apps/web/.env.local
  echo "Created apps/web/.env.local from template. Fill credentials before login works."
fi

# Start web app
pnpm --filter web dev
