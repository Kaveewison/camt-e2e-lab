#!/usr/bin/env bash
#
# One-command e2e cycle (Exercise 4):
#
#   dependencies + test data  ->  SUT  ->  Playwright  ->  cleanup
#
#   cd e2e-exercise && npm run test:e2e
#
# Mirrors `test:e2e` in app/package.json, with one difference: this script always
# tears the stack down on exit — tests fail, you hit Ctrl+C, it does not matter
# (the trap below). One command, no leaked containers: safe for a CI job.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running — start Docker Desktop first." >&2
  exit 1
fi

cd "$SCRIPT_DIR/../../app"

cleanup() {
  echo "-> stopping SUT and dependencies"
  # Run from the app directory: this script may be anywhere when the trap fires.
  (cd "$SCRIPT_DIR/../../app" && docker compose --profile e2e down)
}
trap cleanup EXIT

echo "-> [1/3] fresh db-e2e (tmpfs) + Liquibase test data (contexts: e2e, e2e-exercise)"
docker compose up -d --force-recreate --wait db-e2e
npm run db:migrate:e2e-exercise

echo "-> [2/3] build and start the SUT (docker image, not tsx dev)"
docker compose up -d --build --force-recreate --wait app

echo "-> [3/3] Playwright"
cd "$SCRIPT_DIR/.."
npm test
