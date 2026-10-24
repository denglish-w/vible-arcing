#!/bin/sh
# `npm start`: run the built standalone server (design decision 1).
#
# Standalone server.js changes into .next/standalone, so DATA_DIR is always set
# to an absolute path here. The saved-work database is migrated first, and the
# server does not start if that fails. It listens on 127.0.0.1 unless
# BIND_ADDRESS is set, because without accounts anyone who can reach it can read
# and change all saved work (design decision 9). server.js reads HOSTNAME, but
# that is not honoured from the caller: Docker and some shells export it as the
# machine's name, which would bind to a network address.
set -eu

cd "$(dirname "$0")/.."

if [ ! -f .next/standalone/server.js ]; then
  echo "No standalone build found. Run \`npm run build\` first." >&2
  exit 1
fi

# Absolute, because server.js resolves it from .next/standalone. A relative
# value is taken from the project root, where npm runs scripts.
case "${DATA_DIR:-}" in
  "") DATA_DIR="$PWD/data" ;;
  /*) ;;
  *) DATA_DIR="$PWD/$DATA_DIR" ;;
esac
export DATA_DIR

node scripts/migrate-app.ts

export HOSTNAME="${BIND_ADDRESS:-127.0.0.1}"

case "$HOSTNAME" in
  127.0.0.1 | localhost | ::1 | "[::1]") ;;
  *)
    echo "WARNING: listening on $HOSTNAME, not loopback. Saved work has no authentication: anyone who can reach this port can read, change and delete it." >&2
    ;;
esac

# Standalone output does not include these.
rm -rf .next/standalone/public .next/standalone/.next/static
# public/ may not exist: git does not keep an empty directory.
if [ -d public ]; then cp -R public .next/standalone/public; fi
cp -R .next/static .next/standalone/.next/static

exec node .next/standalone/server.js
