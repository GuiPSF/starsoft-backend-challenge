#!/bin/sh
set -e

if [ -f yarn.lock ]; then
  echo "Detected yarn.lock → using yarn"
  corepack enable
  yarn install --frozen-lockfile
  exec yarn start:dev
elif [ -f package-lock.json ]; then
  echo "Detected package-lock.json → using npm"
  npm ci
  exec npm run start:dev
else
  echo "No lockfile found. Falling back to npm install"
  npm install
  exec npm run start:dev
fi
