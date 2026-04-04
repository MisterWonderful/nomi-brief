#!/bin/bash
# Auto-update nomi-brief from GitHub
# Pulls latest, re-applies local deployment fixes, rebuilds if changed.

set -euo pipefail
LOG="/tmp/nomi-brief-update.log"
DIR="$HOME/homelab/nomi-brief"
cd "$DIR"

echo "$(date '+%Y-%m-%d %H:%M:%S') — Checking for updates..." >> "$LOG"

# Stash local changes (our deployment overrides)
git stash -q 2>/dev/null || true

# Check for remote changes
git fetch origin main -q
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    # No changes — restore our overrides and exit
    git stash pop -q 2>/dev/null || true
    echo "$(date '+%Y-%m-%d %H:%M:%S') — No updates found." >> "$LOG"
    exit 0
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') — Update found: $LOCAL -> $REMOTE" >> "$LOG"

# Pull the update
git pull -q origin main

# Re-apply our deployment overrides

# 1. docker-compose.yml — use .env, port 3050, openclaw network, healthcheck
cat > docker-compose.yml << 'COMPOSE'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nomi-brief
    ports:
      - "3050:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - DEFAULT_USER_EMAIL=${DEFAULT_USER_EMAIL}
      - DEFAULT_USER_NAME=${DEFAULT_USER_NAME}
      - API_SECRET=${API_SECRET}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - OPENCLAW_URL=${OPENCLAW_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - VOICE_ENABLED=false
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - nomi-brief-network
      - openclaw_default

  postgres:
    image: postgres:16-alpine
    container_name: nomi-brief-db
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - nomi-brief-network

volumes:
  postgres_data:

networks:
  nomi-brief-network:
    driver: bridge
  openclaw_default:
    external: true
COMPOSE

# 2. Dockerfile — add openssl, fix build
cat > Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN NODE_ENV=development npm ci

FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
DOCKERFILE

# 3. Prisma — add binaryTargets for Alpine OpenSSL
sed -i 's/provider = "prisma-client-js"/provider      = "prisma-client-js"\n  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]/' prisma/schema.prisma

# 4. CSS fix — move raw CSS properties into @apply where needed
sed -i 's/@apply text-2xl font-bold text-white mt-10 mb-4 font-display; border-b border-zinc-800 pb-2;/@apply text-2xl font-bold text-white mt-10 mb-4 font-display border-b border-zinc-800 pb-2;/' src/app/globals.css
sed -i 's/@apply text-violet-400 hover:text-violet-300 underline underline-offset-2 decoration-violet-400\/50; font-weight: 500;/@apply text-violet-400 hover:text-violet-300 underline underline-offset-2 decoration-violet-400\/50 font-medium;/' src/app/globals.css
sed -i 's/@apply font-mono text-sm bg-zinc-900 px-2 py-0.5 rounded text-violet-300; border: 1px solid rgba(139,92,246,0.15);/@apply font-mono text-sm bg-zinc-900 px-2 py-0.5 rounded text-violet-300 border border-violet-500\/15;/' src/app/globals.css
sed -i 's/@apply bg-zinc-900 rounded-xl p-5 overflow-x-auto mb-6; border: 1px solid rgba(255,255,255,0.06);/@apply bg-zinc-900 rounded-xl p-5 overflow-x-auto mb-6 border border-white\/\[0.06\];/' src/app/globals.css
sed -i 's/@apply bg-transparent p-0; border: none;/@apply bg-transparent p-0 border-none;/' src/app/globals.css
sed -i 's/@apply border-l-0 rounded-xl p-5 my-6 text-zinc-300; background: rgba(139,92,246,0.06); border: 1px solid rgba(139,92,246,0.2); font-style: normal;/@apply border-l-0 rounded-xl p-5 my-6 text-zinc-300 border border-violet-500\/20; background: rgba(139,92,246,0.06); font-style: normal;/' src/app/globals.css
sed -i 's/@apply text-zinc-300 mb-1; line-height: 1.75;/@apply text-zinc-300 mb-1; line-height: 1.75;/' src/app/globals.css

# 5. Rebuild and restart
sg docker -c 'docker compose up -d --build' >> "$LOG" 2>&1

echo "$(date '+%Y-%m-%d %H:%M:%S') — Update deployed successfully." >> "$LOG"
