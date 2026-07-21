# Build context is the repo ROOT (set in docker-compose.yml)
# so all paths below are relative to the monorepo root.

# ── Stage 1: Install dependencies ────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root lockfile + this service's package.json
COPY package-lock.json ./
COPY services/user-service/package.json ./package.json

RUN npm ci --only=production

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# Copy only this service's source files
COPY services/user-service/ .

EXPOSE 3001
CMD ["node", "src/index.js"]
