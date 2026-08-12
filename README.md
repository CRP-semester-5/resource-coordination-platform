# ResQ Hub — Resource Coordination Platform

A microservices backend for coordinating community resources, volunteers, tasks, and emergency relief operations. Built with **Node.js + Express**, routed through **Kong Gateway**, backed by **Supabase (PostgreSQL)**, and containerized with **Docker**.

---

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [First-Time Setup](#first-time-setup)
- [Running the Project](#running-the-project)
  - [Option A — Individual Service (dev)](#option-a--individual-service-recommended-for-development)
  - [Option B — All Services with Docker](#option-b--all-services-with-docker)
- [Service Reference](#service-reference)
- [API Quick Reference](#api-quick-reference)
- [Testing Endpoints](#testing-endpoints)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Git Workflow](#git-workflow)

---

## Architecture

```
Client (Browser / Mobile)
        │
        ▼
  Kong Gateway  :3000          ← single public entry point
        │
  ┌─────┴──────────────────────────────────┐
  │                                         │
user-service :3001        organization-service :3002
request-service :3004     resource-service :3003
task-service :3005        volunteer-service :3006
notification-service :3007
        │
        ▼
  Supabase (PostgreSQL)        ← hosted database, not containerized
```

```
resource-coordination-platform/
├── api-gateway/
│   └── kong/
│       └── kong.yml           ← Kong declarative config (DB-less)
├── services/
│   ├── user-service/          ← auth, profiles, addresses  → :3001
│   ├── organization-service/  ← orgs & memberships         → :3002
│   ├── resource-service/      ← inventory & donations       → :3003
│   ├── request-service/       ← assistance requests         → :3004
│   ├── task-service/          ← tasks & assignments         → :3005
│   ├── volunteer-service/     ← volunteer profiles          → :3006
│   └── notification-service/  ← real-time notifications     → :3007
├── packages/
│   └── shared-middleware/     ← JWT auth + RBAC (npm workspace package)
├── database/
│   └── resource_coordination_platform_schema.sql
├── docs/
│   ├── resQHub.md             ← project plan
│   └── API/
│       └── resource-coordination-api.yaml
├── docker-compose.yml
├── .env.example
└── package.json               ← npm workspaces root
```

---

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|---|---|---|
| Node.js | v20+ | https://nodejs.org |
| npm | v10+ | comes with Node |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |
| Git | any | https://git-scm.com |

You also need a **Supabase** project (free):
→ https://supabase.com — create an account, create a new project

---

## First-Time Setup

### 1. Clone the repository

```bash
git clone https://github.com/CRP-semester-5/resource-coordination-platform.git
cd resource-coordination-platform
```

### 2. Install all dependencies

This project uses **npm workspaces** — one install from the root handles all services:

```bash
npm install
```

### 3. Create your `.env` file

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Open `.env` and fill in these values (get them from your Supabase dashboard):

```env
# Supabase Dashboard → Project → Settings → API
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOiJIUz...     ← use the service_role key

# Make this a long random string — keep it secret
JWT_SECRET=change-this-to-a-long-random-secret

# Gmail SMTP (see email setup section below)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=ResQ Hub <youremail@gmail.com>
```

> **Leave SMTP_USER empty** if you want to use Ethereal (fake inbox). The service auto-creates a test account and prints a preview URL to the console — good for quick testing without Gmail.

### 4. Set up the database

(already done)

Open your **Supabase Dashboard → SQL Editor** and run the full schema:

1. Open `database/resource_coordination_platform_schema.sql`
2. Copy all contents
3. Paste into the SQL Editor and click **Run**

---

## Running the Project

### Option A — Individual Service (recommended for development)

Run a single service with hot-reload (nodemon restarts on file save):

```bash
# User Service
cd services/user-service
npm run dev

# Organization Service
cd services/organization-service
npm run dev

# (same pattern for any other service)
```

Check it's running:
```
✅  user-service running on port 3001
    Health  → http://localhost:3001/health
    Auth    → http://localhost:3001/api/v1/auth
    Users   → http://localhost:3001/api/v1/users
```

Hit the health endpoint to confirm the DB connection:
```
GET http://localhost:3001/health
```

Expected response:
```json
{ "status": "healthy", "service": "user-service", "db": "connected" }
```

---

### Option B — All Services with Docker

> Requires Docker Desktop to be running.

**Build and start everything** (Kong + all 7 services):

```bash
docker-compose up --build
```

**Run in the background:**

```bash
docker-compose up --build -d
```

**View logs for a specific service:**

```bash
docker-compose logs -f user-service
docker-compose logs -f kong
```

**Stop everything:**

```bash
docker-compose down
```

**Rebuild a single service after code changes:**

```bash
docker-compose up --build user-service
```

**Kong Admin API** (inspect routes, plugins, etc.) — dev only:
```
http://localhost:8001
```

---

## Service Reference

### User Service `:3001` ✅ Implemented

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new user — sends verification email |
| `POST` | `/api/v1/auth/login` | Public | Login → returns JWT + roles |
| `GET` | `/api/v1/auth/verify-email?token=` | Public | Verify email by clicking link |
| `POST` | `/api/v1/auth/verify-email` | Public | Verify email via API (body: `{token}`) |
| `POST` | `/api/v1/auth/forgot-password` | Public | Send password reset email |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password with token |
| `POST` | `/api/v1/auth/logout` | Bearer | Acknowledge logout |
| `GET` | `/api/v1/users/me` | Bearer | Get own profile |
| `PATCH` | `/api/v1/users/me` | Bearer | Update own profile |
| `GET` | `/api/v1/users/me/addresses` | Bearer | List own addresses |
| `POST` | `/api/v1/users/me/addresses` | Bearer | Add address |
| `DELETE` | `/api/v1/users/me/addresses/:id` | Bearer | Delete address |
| `GET` | `/api/v1/users/:userId` | Bearer | Get any user by UUID |
| `GET` | `/health` | Public | Health check |

### Organization Service `:3002` ⏳ Pending

### Resource Service `:3003` ⏳ Pending

### Request Service `:3004` ⏳ Pending

### Task Service `:3005` ⏳ Pending

### Volunteer Service `:3006` ⏳ Pending

### Notification Service `:3007` ⏳ Pending

---

## API Quick Reference

All requests go through Kong on port `3000` in Docker, or directly to the service port in dev.`

---

## Environment Variables

All variables live in the root `.env` file (copy from `.env.example`).

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | ✅ | Supabase `service_role` key |
| `JWT_SECRET` | ✅ | Secret for signing JWTs — keep this private |
| `JWT_EXPIRES_IN` | — | Token expiry (default: `7d`) |
| `SMTP_HOST` | — | SMTP server host |
| `SMTP_PORT` | — | SMTP port (587 for TLS) |
| `SMTP_USER` | — | Email address — leave empty for Ethereal auto-account |
| `SMTP_PASS` | — | App password (Gmail) or SMTP password |
| `EMAIL_FROM` | — | Display name + address in outgoing emails |
| `EMAIL_VERIFICATION_EXPIRES_MINUTES` | — | Verification link TTL (default: 60) |
| `PASSWORD_RESET_EXPIRES_MINUTES` | — | Reset link TTL (default: 15) |
| `FRONTEND_URL` | — | Frontend origin for CORS (default: `http://localhost:5173`) |
| `USER_SERVICE_PORT` | — | Port for user-service (default: 3001) |

### Gmail App Password setup

1. Enable **2-Step Verification** on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an app password — name it anything (e.g. `ResQHub`)
4. Copy the 16-character password into `SMTP_PASS` (no spaces)

---

## Database Setup

Database: **PostgreSQL hosted on Supabase** (not containerized locally).

Schema file: `database/resource_coordination_platform_schema.sql`

Run this SQL in **Supabase Dashboard → SQL Editor** to create all tables, enums, indexes, and triggers.


**Available roles:** `SUPER_ADMIN` · `ORGANIZATION_ADMIN` · `COORDINATOR` · `COMMUNITY_MEMBER` · `DONOR` · `VOLUNTEER`

> ⚠️ `requireRole` checks if the user has the role in **any** organization. For org-specific checks, also verify `req.user.roles.find(r => r.org_id === req.params.orgId)` in your controller.

---

## Git Workflow

```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# After coding
git add .
git commit -m "feat(service): describe what you did"
git push origin feature/your-feature-name
# → Open a Pull Request to develop
```

**Commit format:**
```
feat(user): add password reset flow
fix(task): prevent duplicate volunteer assignments
docs(api): update donation endpoints
test(resource): add inventory transaction tests
chore(docker): update service health checks
```

**Branch rules:**
- `main` — production only, protected
- `develop` — integration branch, all PRs merge here
- `feature/*` — your working branch
- Never push directly to `main` or `develop`

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `Missing required environment variable` | `.env` not set up | Check `.env` exists and values are filled |
| `503 db: unreachable` on `/health` | Wrong Supabase credentials | Verify `SUPABASE_URL` and `SUPABASE_SECRET_KEY` |
| `403 Please verify your email` | Account is PENDING | Check email inbox, click verification link |
| `401 Invalid token` | Missing or wrong JWT | Send `Authorization: Bearer <token>` header |
| `409 Email already registered` | Duplicate email | Use different email or delete row from Supabase |
| `400 first_name is required` | Joi validation failed | Check request body has all required fields |
| Gmail email not arriving | Wrong App Password | Re-generate App Password, check spam folder |
| `nodemon: command not found` | nodemon not installed | `npm install -D nodemon --workspace=services/user-service` |
| Port already in use | Another process on same port | Change `USER_SERVICE_PORT` in `.env` or kill the process |