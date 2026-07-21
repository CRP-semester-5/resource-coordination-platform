# Resource Coordination Platform

A microservices-based backend platform for coordinating resources, volunteers, tasks, and organizations. Built with Node.js + Express, containerized with Docker, and backed by Supabase (PostgreSQL).

---

## Architecture

```
resource-coordination-platform/
├── api-gateway/                  # Single entry point — routes traffic to services
├── services/
│   ├── user-service/             # User accounts & authentication   → :3001
│   ├── organization-service/     # Organization management          → :3002
│   ├── resource-service/         # Resource inventory & tracking    → :3003
│   ├── request-service/          # Resource requests & approvals    → :3004
│   ├── task-service/             # Task assignment & tracking       → :3005
│   ├── volunteer-service/        # Volunteer profiles & matching    → :3006
│   └── notification-service/     # Alerts & notifications           → :3007
├── docs/                         # API docs & project reports
├── database/                     # DB migration scripts (Supabase)
├── docker-compose.yml
├── package.json                  # Root npm workspace config
├── .env.example
├── .gitignore
└── .dockerignore
```

### Service Port Map

| Service               | Port |
|-----------------------|------|
| API Gateway           | 3000 |
| User Service          | 3001 |
| Organization Service  | 3002 |
| Resource Service      | 3003 |
| Request Service       | 3004 |
| Task Service          | 3005 |
| Volunteer Service     | 3006 |
| Notification Service  | 3007 |

---

## Tech Stack

- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Express.js
- **Database**: [Supabase](https://supabase.com) (hosted PostgreSQL) — *not containerized*
- **Package Management**: npm workspaces (monorepo)
- **Containerization**: Docker + Docker Compose

---

## Prerequisites

Make sure the following are installed before starting:

- [Node.js](https://nodejs.org/) v20+
- [npm](https://www.npmjs.com/) v10+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Supabase](https://supabase.com) account & project

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/CRP-semester-5/resource-coordination-platform.git
cd resource-coordination-platform
```

### 2. Set Up Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder values:

```env
# Get these from: Supabase Dashboard → Project → Settings → API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Get this from: Supabase Dashboard → Settings → Database → Connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project-id.supabase.co:5432/postgres

# Auth
JWT_SECRET=your-secret-key
```

### 3. Install Node Modules

This project uses **npm workspaces**. A single install from the root installs dependencies for all services:

```bash
npm install
```

> Shared packages (express, dotenv) are hoisted to the root `node_modules/`. Each service's specific dependencies are symlinked automatically.

---

## Running the Project

### Option A — Docker (Recommended)

Builds and starts all 8 containers (api-gateway + 7 services) on a shared Docker network:

```bash
docker-compose up --build
```

Run in the background:

```bash
docker-compose up --build -d
```

Stop all containers:

```bash
docker-compose down
```

Rebuild a single service after a code change:

```bash
docker-compose up --build user-service
```

### Option B — Local Development (without Docker)

Run each service individually using nodemon for hot-reload:

```bash
# From inside any service folder
cd services/user-service
npm run dev
```

Or run all services concurrently from the root (requires a tool like `concurrently`):

```bash
npm install -g concurrently
# then from root:
concurrently "npm run dev --workspace=services/user-service" \
             "npm run dev --workspace=services/organization-service" \
             ...
```

---

## Docker Notes

- **Build context** for all services is the **repo root** (`.`) so Docker can access the shared root `package-lock.json` (required by npm workspaces).
- Each `Dockerfile` uses a **multi-stage build**: a `deps` stage installs production dependencies, and the final `runtime` stage is a lean Alpine image.
- `.dockerignore` excludes `node_modules/`, `.env`, and editor files from the image.
- **Supabase is not containerized** — services connect to it as an external hosted service via environment variables.

---

## What's Set Up

| Area | Status |
|---|---|
| npm workspaces (monorepo) | ✅ Done |
| `package.json` for all 8 services | ✅ Done |
| `Dockerfile` for all 8 services | ✅ Done |
| Root `docker-compose.yml` | ✅ Done |
| Root `.gitignore` | ✅ Done |
| Root `.dockerignore` | ✅ Done |
| `.env.example` with Supabase variables | ✅ Done |
| Supabase DB integration (per service) | ⏳ Pending |
| Service source code (`src/index.js`) | ⏳ Pending |
| API Gateway routing logic | ⏳ Pending |

---

## Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit: `git commit -m "feat: describe your change"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request