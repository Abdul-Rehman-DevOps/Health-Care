# Backup PostgreSQL to ./backups/healthcare-YYYYMMDD-HHmmss.sql
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$dir = Join-Path $root "backups"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = Join-Path $dir "healthcare-$stamp.sql"

$user = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "healthcare" }
$db = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "healthcare" }

Write-Host "Writing backup to $out"
docker compose exec -T db pg_dump -U $user -d $db --no-owner --clean --if-exists | Set-Content -Path $out -Encoding utf8
Write-Host "Done."
