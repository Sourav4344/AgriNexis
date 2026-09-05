# ==============================================================================
# AgriNexis Admin Dashboard Dockerfile
# Next.js 15 application on port 3002
# ==============================================================================

# --- Stage 1: Dependency Installation ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY apps/admin-web/package.json apps/admin-web/package-lock.json ./
RUN npm ci

# --- Stage 2: Production Build ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/admin-web ./

ARG NEXT_PUBLIC_ADMIN_API_URL=http://localhost:8000/api/v1
ARG NEXT_PUBLIC_ADMIN_DEMO_MODE=true
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ARG NEXT_PUBLIC_DEMO_MODE=true

ENV NEXT_PUBLIC_ADMIN_API_URL=$NEXT_PUBLIC_ADMIN_API_URL \
    NEXT_PUBLIC_ADMIN_DEMO_MODE=$NEXT_PUBLIC_ADMIN_DEMO_MODE \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_DEMO_MODE=$NEXT_PUBLIC_DEMO_MODE \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN npm run build

# --- Stage 3: Runtime Environment ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3002 \
    NEXT_TELEMETRY_DISABLED=1

# Install wget for lightweight container healthchecks
RUN apk add --no-cache wget

# Create non-root system user and group
RUN addgroup --system --gid 10001 nodejs && \
    adduser --system --uid 10001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3002

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/ || exit 1

CMD ["npm", "start"]
