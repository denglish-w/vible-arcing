#!/bin/sh
# Docker entrypoint (design decision 11): migrate the saved-work database,
# rebuild the corpus store if it is missing or stale, then start the server.
# Any failure stops the container before the server starts.
set -eu

cd /app
export DATA_DIR=/app/data

node scripts/migrate-app.ts
node scripts/seed-if-stale.ts

# The container listens on every interface; the documented run command
# publishes the port on 127.0.0.1 only (design decision 9).
export HOSTNAME=0.0.0.0
echo "NOTICE: listening on all interfaces; publish the port as -p 127.0.0.1:3000:3000 unless ALLOW_UNAUTHENTICATED_NETWORK is intended. Saved work has no authentication." >&2
export PORT="${PORT:-3000}"
exec node server/server.js
