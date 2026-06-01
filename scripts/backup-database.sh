#!/usr/bin/env sh
# Backup PostgreSQL to ./backups/healthcare-YYYYMMDD-HHmmss.sql
set -e
cd "$(dirname "$0")/.."

mkdir -p backups
stamp=$(date +%Y%m%d-%H%M%S)
out="backups/healthcare-${stamp}.sql"

user="${POSTGRES_USER:-healthcare}"
db="${POSTGRES_DB:-healthcare}"

echo "Writing backup to ${out}"
docker compose exec -T db pg_dump -U "$user" -d "$db" --no-owner --clean --if-exists > "$out"
echo "Done."
