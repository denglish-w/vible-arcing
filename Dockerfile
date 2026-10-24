# syntax=docker/dockerfile:1

# All stages use the same glibc base, so the better-sqlite3 binary matches. It
# ships prebuilt binaries for linux glibc (x64, arm64); nothing compiles here.
# The Node major must match .node-version.

# Production dependencies for the entrypoint scripts and the server's external
# native module: drizzle-orm, better-sqlite3 and zod.
FROM node:26-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `prepare` (husky) is a dev tool and is not installed here; it is allowed to fail.
RUN npm ci --omit=dev

# Build the standalone server. No data/ directory exists here (see .dockerignore),
# and the build must not need one.
FROM node:26-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# public/ may be absent (git keeps no empty directory); the runtime copies it.
RUN mkdir -p public && npm run build

FROM node:26-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATA_DIR=/app/data

# package.json carries "type": "module", which the .ts scripts need.
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules

# The server: standalone output plus the static assets it does not include.
COPY --from=build /app/.next/standalone ./server
COPY --from=build /app/.next/static ./server/.next/static
COPY --from=build /app/public ./server/public

# Migrations, the committed corpus, and the scripts with the src/ modules they
# import (the rules for these modules are in src/db/README.md).
COPY drizzle ./drizzle
COPY corpus/v1 ./corpus/v1
COPY scripts/docker-entrypoint.sh scripts/migrate-app.ts scripts/seed-corpus.ts scripts/seed-if-stale.ts ./scripts/
COPY src/db/client.ts src/db/migrate.ts src/db/paths.ts src/db/seed.ts ./src/db/
COPY src/db/schema ./src/db/schema
COPY src/lib/books.ts ./src/lib/books.ts
COPY src/lib/corpus/format.ts ./src/lib/corpus/format.ts

# Saved work and the corpus store. The node user must own the mount point so a
# fresh named volume is writable.
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME /app/data
USER node

EXPOSE 3000
# Run with: docker run -p 127.0.0.1:3000:3000 -v <volume>:/app/data <image>
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
