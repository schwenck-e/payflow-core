# ==============================================================================
# HumanLayer Canonical Template: Multi-Stage Production Dockerfile
# ==============================================================================
# Usage: Copy this template to Dockerfile and customize for your target runtime.
# Supports: Node.js / Bun / TypeScript / Go services.
# Security: Multi-stage build, minimal Alpine base, non-root user, dumb-init.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Dependencies
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Install security updates and build requirements
RUN apk add --no-cache libc6-compat

# Copy dependency manifests first for optimal layer caching
COPY package.json package-lock.json* bun.lock* pnpm-lock.yaml* ./

# Install dependencies deterministically
RUN \
  if [ -f bun.lock ]; then npm install -g bun && bun install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# ------------------------------------------------------------------------------
# Stage 2: Build & Transpilation
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build stage
ENV NODE_ENV=production
ENV CI=true

# Execute typecheck and compilation
RUN npm run build || bun run build

# Prune development dependencies for minimal production footprint
RUN \
  if [ -f bun.lock ]; then rm -rf node_modules && bun install --production --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm prune --production; \
  fi

# ------------------------------------------------------------------------------
# Stage 3: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

# Install lightweight init system and curl for health checks
RUN apk add --no-cache dumb-init curl

# Enforce secure non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 -G appgroup appuser

# Copy built artifacts and production dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Set ownership to unprivileged user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Runtime Environment Variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose standard application port
EXPOSE 3000

# Container Health Check Probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health/liveness || exit 1

# Launch application via PID 1 init process
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
