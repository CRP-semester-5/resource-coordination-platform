# Build context is the repo ROOT (set in docker-compose.yml)
#
# Why root context matters:
#   @crp/shared-middleware is a local npm workspace package.
#   npm must install from the root so it can create the correct symlink:
#     node_modules/@crp/shared-middleware → packages/shared-middleware
#   A standalone per-service install has no knowledge of workspaces and fails.

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy workspace manifests — npm needs these to resolve the workspace graph
COPY package.json package-lock.json ./
COPY packages/shared-middleware/package.json ./packages/shared-middleware/package.json
COPY services/user-service/package.json      ./services/user-service/package.json

# Install production deps for both workspaces in one pass.
# This creates:
#   /app/node_modules/@crp/shared-middleware  (symlink → /app/packages/shared-middleware)
#   /app/node_modules/express, bcryptjs, ...   (user-service production deps)
RUN npm ci \
    --workspace=packages/shared-middleware \
    --workspace=services/user-service \
    --omit=dev \
    --ignore-scripts

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy installed node_modules (includes the @crp/shared-middleware symlink)
COPY --from=deps /app/node_modules ./node_modules

# Copy shared-middleware source — the symlink target must physically exist
COPY packages/shared-middleware/ ./packages/shared-middleware/

# Copy service source
COPY services/user-service/ ./services/user-service/

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Work from inside the service so relative paths in src/index.js resolve correctly
WORKDIR /app/services/user-service

EXPOSE 3001
CMD ["node", "src/index.js"]
