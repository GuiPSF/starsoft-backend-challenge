#!/bin/sh
set -e

cd /app

if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "node_modules missing/empty -> installing dependencies..."
  if [ -f yarn.lock ]; then
    yarn install --frozen-lockfile
  else
    npm ci || npm install
  fi
fi

exec "$@"
