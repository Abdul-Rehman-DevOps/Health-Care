# Health Care — Hospital Management System

Runs **entirely in Docker**: PostgreSQL + API + React frontend (nginx).

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine + Compose (Linux)

## Start the full app

```bash
docker compose up --build -d
```

Or:

```bash
npm start
```

Open **http://localhost:8080** and sign in with credentials provided by your administrator (configured in the database seed).

| Service | Role | Access |
|---------|------|--------|
| **web** | React UI + nginx (proxies `/api` → API) | http://localhost:8080 |
| **api** | Fastify REST API | internal only |
| **db** | PostgreSQL 16 | internal only |

On first start, the API container runs **migrations** and **seed** data (hospital name: **Health Care**).

## Useful commands

```bash
# Foreground (see logs in terminal)
npm run up

# Stop and remove containers
npm run stop

# Follow all logs
npm run logs

# API logs only
npm run logs:api

# Rebuild after code changes
docker compose up --build -d
```

## Configuration

Copy `.env.example` to `.env` if needed:

```env
APP_PORT=8080
POSTGRES_PASSWORD=healthcare_secret
CORS_ORIGIN=http://localhost:8080
```

Change `APP_PORT` to use another host port (e.g. `APP_PORT=3000` → http://localhost:3000).

## Database migrations

Migrations live in `server/prisma/migrations/`. They run automatically when the `api` container starts.

To reset everything (deletes all data):

```bash
docker compose down -v
docker compose up --build -d
```

## Project structure

```
Health_Care/
  server/          API (Fastify + Prisma)
  src/             React frontend
  nginx/           Production web server config
  docker-compose.yml
  Dockerfile       Frontend image
```

## Development without Docker

Optional — only if you install Node.js and PostgreSQL locally:

```bash
docker compose up db -d
cd server && npm install && npm run db:migrate && npm run db:seed
npm install && npx vite  # separate terminal: npm run dev -w health-care-api
```

Primary workflow is **Docker only**.
