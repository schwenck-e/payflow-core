# ==============================================================================
# PayFlow Core Platform: Production Multi-Stage Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependencies Cache
# ------------------------------------------------------------------------------
FROM oven/bun:1-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json bun.lock* ./
COPY prisma ./prisma

RUN bun install --frozen-lockfile
RUN bunx prisma generate

# ------------------------------------------------------------------------------
# Stage 2: Compilation & Verification
# ------------------------------------------------------------------------------
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV CI=true

# Verificação estática e compilação
RUN bun run typecheck
RUN bun run check-arch
RUN bun run build

# ------------------------------------------------------------------------------
# Stage 3: Minimal Production Runner
# ------------------------------------------------------------------------------
FROM oven/bun:1-alpine AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init curl

# Usuário não-privilegiado de segurança
RUN addgroup -S -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup appuser

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.example ./.env

RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health/liveness || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["bun", "run", "dist/index.js"]
