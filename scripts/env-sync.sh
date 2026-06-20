#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ROOT_ENV=".env.local"
WEB_ENV="apps/web/.env.local"
DB_ENV="packages/db/.env"

# Ensure root env exists; seed from example if missing
if [ ! -f "$ROOT_ENV" ]; then
  cp .env.example "$ROOT_ENV"
  echo "Created $ROOT_ENV from .env.example. Fill values and rerun."
  exit 0
fi

# Load root env into current shell
set -a
# shellcheck disable=SC1090
source "$ROOT_ENV"
set +a

# If MONGODB_URI is empty but components exist, build it
if [ -z "${MONGODB_URI:-}" ] && [ -n "${MONGO_USER:-}" ] && [ -n "${MONGO_PASSWORD:-}" ] && [ -n "${MONGODB_HOST:-}" ] && [ -n "${MONGODB_DB:-}" ]; then
  OPTS="${MONGODB_OPTIONS:-retryWrites=true&w=majority}"
  export MONGODB_URI="mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGODB_HOST}/${MONGODB_DB}?${OPTS}"
  echo "Built MONGODB_URI from components."
fi

if [ -z "${MONGODB_URI:-}" ]; then
  echo "Warning: MONGODB_URI is empty. Prisma and NextAuth will fail until set."
fi

# Write apps/web/.env.local
mkdir -p "apps/web"
{
  echo "NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}"
  echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-change-me}"
  echo "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}"
  echo "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}"
  echo "MONGODB_URI=${MONGODB_URI:-}"
} > "$WEB_ENV"
echo "Synced $WEB_ENV"

# Write packages/db/.env (Prisma only needs MONGODB_URI)
mkdir -p "packages/db"
{
  echo "MONGODB_URI=${MONGODB_URI:-}"
} > "$DB_ENV"
echo "Synced $DB_ENV"
