# Build context is the repo ROOT (set in docker-compose.yml)

# ── Stage 1: Install dependencies ────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy the service package.json and root lockfile
COPY package-lock.json ./
COPY services/user-service/package.json ./package.json

# Install only production dependencies for this service
RUN npm install --omit=dev

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules

# Copy only this service's source files
COPY services/user-service/ .

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001
CMD ["node", "src/index.js"]
