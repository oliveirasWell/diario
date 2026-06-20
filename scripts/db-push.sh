#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Try to read MONGODB_URI from apps/web/.env.local
if [ -f apps/web/.env.local ]; then
  export MONGODB_URI=$(grep -E '^MONGODB_URI=' apps/web/.env.local | tail -n1 | cut -d= -f2- || true)
fi

if [ -z "${MONGODB_URI:-}" ]; then
  echo "MONGODB_URI not set. Options:"
  echo "  - export MONGODB_URI=... and rerun"
  echo "  - put it in packages/db/.env and rerun pnpm db:push"
  echo "  - or fill apps/web/.env.local with MONGODB_URI and rerun this script"
  exit 1
fi

# Validate that DB name exists in URI (e.g., ...mongodb.net/diario?....)
if [[ ! "$MONGODB_URI" =~ ^mongodb(\+srv)?:\/\/[^\/]+\/[^^\/?#]+ ]]; then
  echo "Invalid MONGODB_URI: missing database name."
  echo "Example: mongodb+srv://user:pass@cluster0.x.mongodb.net/diario?retryWrites=true&w=majority"
  exit 1
fi

cd packages/db
pnpm run db:push
