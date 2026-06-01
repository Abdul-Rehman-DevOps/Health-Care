# Health Care: Hospital Management System

Enterprise-style web application for hospital operations: patient registration, clinical scheduling, departmental organization, pharmacy inventory, and centralized administration. The stack is containerized for consistent deployment (PostgreSQL, REST API, React SPA behind nginx).

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Application modules](#application-modules)
- [Authentication and authorization](#authentication-and-authorization)
- [Security and session management](#security-and-session-management)
- [Regional and validation rules](#regional-and-validation-rules)
- [Branding and configuration](#branding-and-configuration)
- [Printing](#printing)
- [Deployment](#deployment)
- [Configuration reference](#configuration-reference)
- [API reference](#api-reference)
- [Data persistence](#data-persistence)
- [Database](#database)
- [Project structure](#project-structure)
- [Development](#development)
- [Production checklist](#production-checklist)

---

## Overview

| Item | Detail |
|------|--------|
| **Default URL** | `http://localhost:8080` |
| **Runtime** | Docker Compose (recommended) |
| **Database** | PostgreSQL 16 with Prisma ORM |
| **API** | Fastify, JWT bearer authentication, Zod request validation |
| **UI** | React 18, Vite, Tailwind CSS, TanStack Query, React Router |

On first startup, the API container applies migrations and runs the seed script to provision hospital settings, reference data (departments, sample doctors), and initial user accounts for local evaluation.

---

## Architecture

```
┌─────────────┐     /api/*      ┌─────────────┐     SQL      ┌──────────────┐
│   Browser   │ ──────────────► │  nginx:80   │ ───────────► │  Fastify API │
│  (React SPA)│                 │  (web svc)  │   proxy      │  (api svc)   │
└─────────────┘                 └─────────────┘              └──────┬───────┘
                                                                  │
                                                                  ▼
                                                           ┌──────────────┐
                                                           │ PostgreSQL   │
                                                           │ (db svc)     │
                                                           └──────────────┘
```

| Service | Responsibility | Host access |
|---------|----------------|-------------|
| **web** | Static frontend, reverse proxy for `/api` | `APP_PORT` (default `8080`) |
| **api** | REST API, auth, business rules | Internal only |
| **db** | Persistent relational storage | Internal only |

---

## Application modules

### OPD & Prescription (primary clinical flow)

End-to-end outpatient desk workflow aligned with clinic practice:

- **Patient**: searchable dropdown (name, ID, phone) or quick-register new patient (name, phone, gender, age)
- **Vitals**: weight, blood pressure, temperature, blood sugar, pulse, SpO2
- **Doctor**: select consulting doctor (name prints on prescription; consultation fee auto-filled)
- **Medicines**: searchable pharmacy picker; custom medicine name and dosage
- **Lab tests**: searchable lab catalog picker; custom lab test name and price (not in catalog)
- **Billing**: consultation fee, line items, discount, paid/unpaid flag; visit numbers `V-*`, bills `B-*`
- **Save & print**: professional A5 prescription and bill (see [Printing](#printing))
- **History**: per-patient visit modal with reprint
- **Today’s visits**: sidebar list for quick reprint

### Previous visits

Searchable archive of OPD records:

- Filter by patient name, visit number, patient ID, and date range
- View full visit detail (vitals, diagnosis, lines, bill status)
- Reprint prescription, bill, or both
- **Admin**: delete visit (removes prescription lines and bill)

### Printing

Prescription and bill are designed for **A5** paper and clinic printers:

| Output | Pages |
|--------|--------|
| Prescription only | 1 × A5 |
| Bill only | 1 × A5 |
| Both | 2 × A5 (prescription, then bill) |

- Layout uses compact print styles; long prescriptions auto-compact when there are many line items
- **Save as PDF**: default file name is `{PatientName}_{VisitNumber}` (e.g. `Ali Khan_V-1005`)
- Print runs in a hidden iframe so the saved PDF does not use the app URL as the document title
- In the browser print dialog: set paper to **A5**, and under **More settings** turn off **Headers and footers** so the website URL does not appear at the bottom of the page

### Dashboard

Operational summary: patient count, active doctors, same-day appointments, pharmacy stock metrics, and low-stock indicators. Quick link to **New OPD visit**. Hospital name is driven by configured branding.

### Patients

Full patient lifecycle with search and pagination.

- Structured demographics, CNIC, contact, address, medical notes
- Emergency contact validation (name **or** phone required)
- Pakistan-specific CNIC and mobile formatting with client and server validation
- Role-gated delete (administrators only)

### Doctors

Physician directory linked to departments: qualifications, specialization, consultation fee, contact details, active status. Create, update, and delete restricted to administrators; standard users have read-only access.

### Appointments

Scheduling with doctor and department association.

- Past date/time blocked using **Pakistan Standard Time (PKT)**
- Duplicate slot detection per doctor with explicit conflict messaging
- Standard users: create and edit; administrators: delete

### Departments

Hospital units (e.g. GOPD, specialty clinics) with codes, descriptions, and color tags. Mutations require administrator role.

### Pharmacy

Drug catalog with stock levels, pricing, and low-stock awareness. Stock adjustments via dedicated endpoint. Delete restricted to administrators.

### Settings

Hospital profile and administration (administrators).

| Section | Capabilities |
|---------|----------------|
| **Hospital identity** | Name, tagline; propagated app-wide (login, sidebar, header, browser title, dashboard) |
| **Contact & location** | Phone, email, address, city, currency |
| **User accounts** | List users, create accounts (admin or standard role), reset passwords, delete users (with safeguards) |

Live preview reflects branding changes before save.

### About

Application information, hospital branding display, and product credits.

### Login

Lock-screen style authentication:

- Live clock and date (PKT)
- Hospital name and tagline from public branding API
- Password visibility toggle
- Session cleared on login page load after expiry or logout

### Navigation and UX

- Client-side routing with bookmarkable paths
- Fixed sidebar; scrollable main content
- Browser tab title: `{Hospital Name}, {Page}`
- SVG favicon (hospital logo)
- Toast notifications and confirmation dialogs for destructive actions
- Field-level validation messages from API

---

## Authentication and authorization

### Roles

| Role | Identifier | Scope |
|------|------------|--------|
| **Administrator** | `admin` | Full CRUD, settings, user management |
| **Standard user** | `user` | Operational data entry; restricted deletes and configuration |

The interface displays display name, username, and role badge in the sidebar.

### Permission matrix

| Module | Standard user | Administrator |
|--------|---------------|---------------|
| Dashboard | Read | Read |
| Patients | Create, update | Create, update, delete |
| Appointments | Create, update | Create, update, delete |
| Pharmacy | Create, update | Create, update, delete |
| Doctors | Read | Full CRUD |
| Departments | Read | Full CRUD |
| Settings | Read hospital profile | Edit profile, manage users |
| About | Read | Read |

Unauthorized API operations return `403 Forbidden`. Restricted controls are omitted in the UI for standard users.

### Initial access (development only)

Bootstrap accounts are created by `server/prisma/seed.ts` for **local and demonstration environments only**. Credentials are defined in that file, not duplicated here.

**Before any production or shared deployment:**

1. Change all seeded passwords via **Settings → User accounts → Reset password**, or update the seed and re-run after a controlled database reset.
2. Remove or replace demo accounts you do not require.
3. Never deploy with default secrets unchanged (see [Production checklist](#production-checklist)).

Sign in at `http://localhost:8080/login` using an account provisioned by your environment’s seed or your own user records.

---

## Security and session management

| Mechanism | Behavior |
|-----------|----------|
| **JWT** | Issued on successful login; sent as `Authorization: Bearer <token>` |
| **Token lifetime** | Seven days (server-signed) |
| **Inactivity timeout** | Automatic logout after **one hour** without user activity |
| **Session expiry** | Expired tokens cleared from storage; login flow does not reuse stale credentials |
| **Login errors** | Invalid credentials return `400` with a clear message (not conflated with session expiry) |
| **Protected routes** | All `/api/*` routes except health, branding, and login require authentication |
| **Admin routes** | Settings PATCH, user management, doctor/department mutations, patient/drug/appointment deletes |

User deletion rules (administrators):

- Cannot delete the currently signed-in account
- Cannot delete the last remaining administrator account

---

## Regional and validation rules

Designed for Pakistan hospital workflows.

| Field | Format | Rules |
|-------|--------|--------|
| **CNIC** | `12345-6789123-4` | 13 digits; auto-formatting; validated on client and server |
| **Mobile** | `+92 3XX-XXXXXXX` | Country code `+92`, mobile prefix `3`; 10 national digits |
| **Appointments** | Date/time in PKT | No bookings in the past; no double-booking for the same doctor and slot |

Emergency contact accepts either a contact name or a phone number (not both mandatory).

---

## Branding and configuration

- **Public branding API** (`GET /api/branding`): hospital name and tagline without authentication (login screen).
- **Settings API**: full hospital profile; updates invalidate branding cache across the application.
- **Browser metadata**: dynamic document title; static favicon at `/favicon.svg`.

Developer attribution appears in the **About** module and in the sidebar below **Sign out** only.

---

## Deployment

### Prerequisites

- Docker Desktop (Windows/macOS) or Docker Engine with Compose (Linux)

### Start the stack

```bash
docker compose up --build -d
```

Equivalent:

```bash
npm start
```

Application URL: **http://localhost:8080**

### Operations

| Command | Description |
|---------|-------------|
| `npm run up` | Foreground start with build (stream logs) |
| `npm run stop` | Stop and remove containers |
| `npm run restart` | Stop, rebuild, and start detached |
| `npm run logs` | Follow all service logs |
| `npm run logs:api` | Follow API logs only |
| `npm run build` | Build images without starting |
| `npm run typecheck` | TypeScript check (frontend) |
| `npm run db:backup` | Stream SQL dump to stdout (redirect to file) |
| `npm run db:volume:inspect` | Show Docker volume details for `health-care_pgdata` |

### Stop without losing data

```bash
docker compose down          # stops containers; database volume is kept
docker compose up -d         # start again; all patients, appointments, etc. remain
docker compose restart       # quick restart; data unchanged
```

**Do not** use `-v` unless you intend to wipe the database.

---

## Data persistence

All application data (patients, appointments, users, settings, pharmacy stock, and so on) is stored in **PostgreSQL** on a **Docker named volume**:

| Property | Value |
|----------|--------|
| Volume name | `health-care_pgdata` |
| Mount point (in `db` container) | `/var/lib/postgresql/data` |
| Managed by | Docker (local driver) |

### What keeps your data safe

| Event | Data preserved? |
|-------|-----------------|
| Close browser / sign out | Yes |
| Restart `web` or `api` container | Yes |
| `docker compose stop` / `down` (without `-v`) | Yes |
| Rebuild images (`docker compose up --build -d`) | Yes |
| PC reboot (Docker Desktop running) | Yes |
| API crash or container `restart: unless-stopped` | Yes |

Migrations run on API startup (`prisma migrate deploy`) and **only add or alter schema**; they do not truncate tables. The seed script is **idempotent**: it creates missing defaults (e.g. first hospital settings) and does **not** delete or replace existing patients, appointments, or user-changed passwords.

### What deletes data

| Command | Effect |
|---------|--------|
| `docker compose down -v` | **Removes** volume `health-care_pgdata`; full data loss |
| `docker volume rm health-care_pgdata` | Same as above |
| Deleting the volume in Docker Desktop | Same as above |

### Verify the volume exists

```bash
npm run db:volume:inspect
# or
docker volume inspect health-care_pgdata
```

### Backups (recommended)

Create a SQL dump while the stack is running:

**Windows (PowerShell):**

```powershell
.\scripts\backup-database.ps1
```

**Linux / macOS:**

```bash
sh scripts/backup-database.sh
```

Files are written to `backups/healthcare-YYYYMMDD-HHmmss.sql` (folder is git-ignored).

Manual one-liner:

```bash
docker compose exec -T db pg_dump -U healthcare -d healthcare --no-owner --clean --if-exists > backups/manual-backup.sql
```

Restore (advanced; stops writes, test on a copy first):

```bash
docker compose exec -T db psql -U healthcare -d healthcare < backups/your-backup.sql
```

### Optional: skip seed on startup

Set in `.env` for the API service (via `docker-compose` `environment` if you wire it):

```env
SKIP_DB_SEED=1
```

Migrations still run; only the idempotent seed is skipped.

### Reset database (intentional wipe)

Removes the PostgreSQL volume and all data:

```bash
docker compose down -v
docker compose up --build -d
```

---

## Configuration reference

Copy `.env.example` to `.env` for overrides.

```env
POSTGRES_USER=healthcare
POSTGRES_PASSWORD=healthcare_secret
POSTGRES_DB=healthcare

APP_PORT=8080
CORS_ORIGIN=http://localhost:8080
JWT_SECRET=your-strong-secret-here
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_PORT` | `8080` | Host port mapped to nginx |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed browser origin for API |
| `POSTGRES_*` | See `.env.example` | Database credentials |
| `JWT_SECRET` | Compose default | **Must be overridden in production** |

If `APP_PORT` changes, set `CORS_ORIGIN` to the matching origin (e.g. `http://localhost:3000`).

---

## API reference

Base path: `/api`. JSON request and response bodies unless noted.

### Public endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/branding` | Hospital name and tagline |
| `POST` | `/auth/login` | Authenticate; returns JWT and user profile |

### Authenticated endpoints

Require `Authorization: Bearer <token>`.

| Prefix | Endpoints | Notes |
|--------|-----------|--------|
| `/auth/me` | `GET` | Current user from token |
| `/dashboard/stats` | `GET` | Aggregated dashboard metrics |
| `/patients` | `GET`, `GET /:id`, `POST`, `PATCH /:id` | Search, pagination on list |
| `/patients/:id` | `DELETE` | Admin only |
| `/doctors` | `GET` | All roles |
| `/doctors` | `POST`, `PATCH /:id`, `DELETE /:id` | Admin only |
| `/departments` | `GET` | All roles |
| `/departments` | `POST`, `PATCH /:id`, `DELETE /:id` | Admin only |
| `/appointments` | `GET`, `POST`, `PATCH /:id` | PKT and conflict rules on write |
| `/appointments/:id` | `DELETE` | Admin only |
| `/drugs` | `GET`, `POST`, `PATCH /:id`, `PATCH /:id/stock` | Pharmacy inventory |
| `/drugs/:id` | `DELETE` | Admin only |
| `/settings` | `GET` | Hospital profile |
| `/settings` | `PATCH` | Admin only |
| `/users` | `GET`, `POST`, `PATCH /:id/password`, `DELETE /:id` | Admin only |
| `/visits` | `GET`, `GET /:id`, `GET /patient/:id/history`, `POST` | OPD visit, vitals, Rx, bill |
| `/visits/:id` | `DELETE` | Admin only; removes visit, lines, and bill |
| `/visits/:id/bill/paid` | `PATCH` | Mark bill paid |
| `/lab-tests` | `GET` | Lab catalog (`?search=` optional) |

Validation errors return structured field messages suitable for form display.

---

## Application routes

| Path | Module |
|------|--------|
| `/`, `/dashboard` | Dashboard |
| `/opd` | OPD & Prescription |
| `/visits` | Previous visits (records & reprint) |
| `/patients` | Patients |
| `/doctors` | Doctors |
| `/appointments` | Appointments |
| `/departments` | Departments |
| `/pharmacy` | Pharmacy |
| `/settings` | Settings |
| `/about` | About |
| `/login` | Authentication |

Unauthenticated users are redirected to `/login`. Deep links to protected paths work after sign-in.

---

## Database

| Artifact | Location |
|----------|----------|
| Schema | `server/prisma/schema.prisma` |
| Migrations | `server/prisma/migrations/` (applied on API container start) |
| Seed | `server/prisma/seed.ts` (idempotent; safe on every restart) |
| Persistent storage | Docker volume `health-care_pgdata` |

**Entities:** `HospitalSettings`, `User`, `Patient`, `Doctor`, `Department`, `Appointment`, `Visit`, `PrescriptionLine`, `Bill`, `Drug`, `LabTest`, `SystemCounter`.

See [Data persistence](#data-persistence) for backup commands and what survives restarts.

---

## Project structure

```
Health_Care/
├── src/                          React application
│   ├── pages/                    Route-level views
│   ├── components/               Layout, VisitPrint, SearchableDropdown, dialogs
│   ├── context/                  Auth, hospital branding, toasts
│   ├── hooks/                    Session timeout, visit print, confirm delete
│   └── lib/                      API client, print helpers, validation, auth session
├── public/                       Static assets (favicon)
├── server/
│   ├── src/routes/               REST handlers
│   ├── src/plugins/              JWT and role guards
│   ├── src/lib/                  Validation, PKT time, appointment rules
│   └── prisma/                   Schema, migrations, seed
├── nginx/                        Production reverse proxy
├── docker-compose.yml            Service orchestration
├── Dockerfile                    Frontend image
└── server/Dockerfile             API image
```

---

## Development

Docker is the supported workflow. Optional local development requires Node.js 20+ and PostgreSQL.

```bash
# Database only
docker compose up db -d

# API
cd server
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Frontend (repository root)
npm install
npx vite
```

Configure `CORS_ORIGIN` and API base URL to match your Vite dev server if not using nginx.

---

## Production checklist

- [ ] Set a strong, unique `JWT_SECRET`
- [ ] Change all seeded user passwords; disable unused accounts
- [ ] Use strong `POSTGRES_PASSWORD` and restrict database network access
- [ ] Terminate TLS at a reverse proxy (e.g. nginx, Caddy) with valid certificates
- [ ] Align `CORS_ORIGIN` with the public application URL
- [ ] Schedule regular SQL backups (`scripts/backup-database.ps1` or `pg_dump`)
- [ ] Never run `docker compose down -v` on production unless intentionally wiping data
- [ ] Review seed script before first production deploy; do not ship default credentials

---

## Technology stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS 3, TanStack Query 5, React Router 6, Lucide icons |
| Backend | Fastify 4, `@fastify/jwt`, `@fastify/cors`, Zod |
| Data | PostgreSQL 16, Prisma |
| Infrastructure | Docker Compose, nginx, Alpine-based images |

---

*Developed and deployed by Abdul Rehman.*
