# syntax=docker/dockerfile:1

###############################################################################
# Base image with corepack/npm ready
###############################################################################
FROM node:20-alpine AS base
# Needed by Prisma's query engine and a few native deps on Alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

###############################################################################
# 1. deps: install dependencies only (cached separately from source changes)
###############################################################################
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

###############################################################################
# 2. builder: build the Next.js app
###############################################################################
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client must be generated before `next build` if your code imports it
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

###############################################################################
# 3. runner: minimal production image
###############################################################################
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output (requires `output: "standalone"` in next.config.js)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma needs its schema + generated client + engine binaries at runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run pending migrations, then start the server.
# Remove the `prisma migrate deploy &&` part if migrations are handled
# in CI/CD instead of at container startup.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
