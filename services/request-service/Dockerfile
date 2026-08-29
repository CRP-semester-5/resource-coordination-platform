# Build context is the repo ROOT (set in docker-compose.yml)
# so all paths below are relative to the monorepo root.

# ── Stage 1: Install dependencies ────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy root lockfile + package.jsons
COPY packages/shared-middleware/package.json ./packages/shared-middleware/package.json
COPY package.json package-lock.json ./
COPY services/request-service/package.json ./services/request-service/package.json

RUN npm ci \
    --workspace=packages/shared-middleware \
    --workspace=services/request-service \
    --omit=dev \
    --ignore-scripts

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY packages/shared-middleware/ ./packages/shared-middleware/
COPY services/request-service/ ./services/request-service/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app/services/request-service

EXPOSE 3004
CMD ["node", "src/index.js"]
