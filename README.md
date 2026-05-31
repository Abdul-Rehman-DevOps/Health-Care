# Health Care — Hospital Management System

A full-stack hospital management web app: patients, doctors, appointments, departments, pharmacy, and hospital settings. Runs entirely in **Docker** (PostgreSQL + Fastify API + React frontend behind nginx).

## Features

- **Dashboard** — overview stats and recent activity
- **Patients** — register, search, view details, edit records (CNIC & Pakistani mobile validation)
- **Doctors** — list by department with qualifications and fees
- **Appointments** — schedule and manage patient visits
- **Departments** — organize hospital units (GOPD, surgery, etc.)
- **Pharmacy** — drug inventory, stock, and pricing
- **Settings** — hospital name, contact, address, currency (admin only to edit)
- **Lock screen login** — clean sign-in screen with Pakistan time (PKT), no slideshow
- **URL routing** — bookmarkable pages (`/dashboard`, `/patients`, `/doctors`, etc.)
- **Session timeout** — automatic logout after **1 hour** of inactivity
- **Role-based access** — admin vs simple user (see [User accounts](#user-accounts))

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query, React Router |
| Backend | Fastify, JWT auth, Zod validation |
| Database | PostgreSQL 16, Prisma ORM |
| Deployment | Docker Compose, nginx (reverse proxy for `/api`) |

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine + Compose (Linux)

## Quick start

```bash
docker compose up --build -d
```

Or:

```bash
npm start
```

Open **http://localhost:8080** and sign in (see accounts below).

On first start, the API container runs **Prisma migrations** and **seed data** (hospital name: **Health Care**, sample departments/doctors, default users).

### Services

| Service | Role | Access |
|---------|------|--------|
| **web** | React UI + nginx (proxies `/api` → API) | http://localhost:8080 |
| **api** | Fastify REST API | internal only |
| **db** | PostgreSQL 16 | internal only |

## User accounts

Seeded on first run (change passwords in production):

| Username | Password | Role | Access |
|----------|----------|------|--------|
| `admin` | `admin` | Admin | Full access everywhere |
| `desolate` | `desolate` | Simple user | Limited access (see below) |

The sidebar shows the logged-in **display name**, **@username**, and an **Admin** or **Simple user** badge.

### Permissions

| Page | Simple user | Admin |
|------|-------------|-------|
| Dashboard | View | View |
| Patients | Add, Edit | Add, Edit, Delete |
| Appointments | Add, Edit | Add, Edit, Delete |
| Pharmacy | Add, Edit | Add, Edit, Delete |
| Doctors | **View only** | Add, Edit, Delete |
| Departments | **View only** | Add, Edit, Delete |
| Settings | **View only** | Edit |

Delete actions are hidden in the UI for simple users and blocked on the API with `403 Forbidden`. Doctors and Departments create/update/delete routes require admin on both frontend and backend.

## App routes

| Path | Page |
|------|------|
| `/` or `/dashboard` | Dashboard |
| `/patients` | Patients |
| `/doctors` | Doctors |
| `/appointments` | Appointments |
| `/departments` | Departments |
| `/pharmacy` | Pharmacy |
| `/settings` | Settings |

## Login screen

The sign-in page is a simple **lock screen** style login:

- Large clock and date (Pakistan time — PKT)
- Glass-style unlock card with username and password
- No slideshow or background images — fast load, works offline

Always open the app at **http://localhost:8080** (include the port). Hard refresh on `/dashboard`, `/patients`, etc. is supported.

## Pakistan CNIC & phone formats

Used on patient (and related) forms:

| Field | Format | Rules |
|-------|--------|-------|
| **CNIC** | `12345-6789123-4` | Exactly **13 digits**, numbers only; auto-formatted as you type |
| **Mobile** | `+92 3XX-XXXXXXX` | Pakistani mobile; must start with **+92 3**; 10 digits after country code |

Validation runs on the frontend and API. Non-digit keys are blocked in numeric fields.

## Useful commands

```bash
# Foreground (see logs in terminal)
npm run up

# Stop and remove containers
npm run stop

# Restart (rebuild)
npm run restart

# Follow all logs
npm run logs

# API logs only
npm run logs:api

# Rebuild after code changes
docker compose up --build -d

# Typecheck frontend
npm run typecheck
```

## Configuration

Copy `.env.example` to `.env` if you need custom values:

```env
POSTGRES_USER=healthcare
POSTGRES_PASSWORD=healthcare_secret
POSTGRES_DB=healthcare

APP_PORT=8080
CORS_ORIGIN=http://localhost:8080
```

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | `8080` | Host port for the web UI |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed browser origin for the API |
| `POSTGRES_*` | see `.env.example` | Database credentials |
| `JWT_SECRET` | set in `docker-compose.yml` | **Change in production** |

If you change `APP_PORT` (e.g. `3000`), update `CORS_ORIGIN` to match (e.g. `http://localhost:3000`).

## Database

- Migrations: `server/prisma/migrations/` (run automatically when the `api` container starts)
- Schema: `server/prisma/schema.prisma`
- Seed: `server/prisma/seed.ts` (users, settings, sample departments/doctors)

**Reset everything** (deletes all data):

```bash
docker compose down -v
docker compose up --build -d
```

## API overview

All routes except `/api/health` and `/api/auth/login` require a valid JWT (`Authorization: Bearer …`).

| Prefix | Resources |
|--------|-----------|
| `/api/auth` | Login |
| `/api/dashboard` | Stats |
| `/api/patients` | Patient CRUD |
| `/api/doctors` | Doctor CRUD (admin for POST/PATCH/DELETE) |
| `/api/departments` | Department CRUD (admin for POST/PATCH/DELETE) |
| `/api/appointments` | Appointment CRUD |
| `/api/drugs` | Pharmacy drug CRUD |
| `/api/settings` | Hospital settings (admin for PATCH) |

Health check: `GET /api/health`

## Project structure

```
Health_Care/
├── src/                    React frontend
│   ├── pages/              Dashboard, Patients, Doctors, etc.
│   ├── components/         Layout, modals, ActionButtons
│   ├── context/            Auth (JWT, isAdmin)
│   ├── hooks/              Session timeout
│   └── lib/                API client, routes, Pakistan input helpers
├── server/                 Fastify API
│   ├── src/routes/         REST route handlers
│   ├── src/plugins/        JWT auth helpers
│   └── prisma/             Schema, migrations, seed
├── nginx/                  Production nginx config (proxies /api)
├── docker-compose.yml      db + api + web
├── Dockerfile              Frontend image
└── server/Dockerfile         API image
```

## Development without Docker

Optional — requires Node.js 20+ and a running PostgreSQL instance:

```bash
# Start database only
docker compose up db -d

# API (from project root)
cd server
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Frontend (separate terminal, from project root)
npm install
npx vite
```

The primary workflow is **Docker only** (`docker compose up --build -d`).

## Production notes

- Change default user passwords and set a strong `JWT_SECRET` in `docker-compose.yml` or `.env`
- Use HTTPS with a real certificate (e.g. Let's Encrypt) in front of nginx; the app ships with HTTP on port 8080 for local use
- Back up the `pgdata` Docker volume before major upgrades or resets
