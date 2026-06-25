#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Ensure deps installed
pnpm install

# Try to generate Prisma client if approved; ignore failure (Mongo/NextAuth don't need Prisma to run dev)
if pnpm --filter @diario/db run generate; then
  echo "Prisma client generated"
else
  echo "Skipping prisma generate (approve builds later with: pnpm approve-builds prisma @prisma/client @prisma/engines)"
fi

# Ensure env file exists (do not overwrite)
if [ ! -f apps/web/.env.local ]; then
  cp apps/web/.env.example apps/web/.env.local
  echo "Created apps/web/.env.local from template. Fill credentials before login works."
fi

MONGODB_URI=$(grep -E '^MONGODB_URI=' apps/web/.env.local | tail -n1 | cut -d= -f2- || true)
if [[ "$MONGODB_URI" =~ ^mongodb(\+srv)?:\/\/[^\/]+\/([^\/?#]+) ]] && [ "${BASH_REMATCH[2]}" = "diario" ] && [ "${ALLOW_PROD_DB_DEV:-}" != "1" ]; then
  echo "Refusing to run local dev against production database 'diario'."
  echo "Set apps/web/.env.local to diario-dev, or rerun with ALLOW_PROD_DB_DEV=1 if intentional."
  exit 1
fi

# Start web app
pnpm --filter web dev
