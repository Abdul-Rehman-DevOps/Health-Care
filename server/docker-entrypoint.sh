#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma migrate deploy
if [ "${SKIP_DB_SEED:-0}" != "1" ]; then
  echo "Applying idempotent seed (missing defaults only; existing records are kept)..."
  npx tsx prisma/seed.ts
else
  echo "SKIP_DB_SEED=1 — seed skipped."
fi
echo "Starting API..."
exec "$@"
