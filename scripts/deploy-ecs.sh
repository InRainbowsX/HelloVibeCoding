#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_DIR="$ROOT_DIR/docker"
COMPOSE_HTTP="$DOCKER_DIR/docker-compose.ecs.yml"
COMPOSE_HTTPS="$DOCKER_DIR/docker-compose.ecs.https.yml"
CERT_DIR="/etc/letsencrypt/live/www.hellovibecoding.cn"
CERT_FULLCHAIN="$CERT_DIR/fullchain.pem"
CERT_PRIVKEY="$CERT_DIR/privkey.pem"

cd "$ROOT_DIR"

if [[ ! -f "$DOCKER_DIR/.env.ecs" ]]; then
  echo "Missing $DOCKER_DIR/.env.ecs"
  echo "Copy $DOCKER_DIR/.env.ecs.example to $DOCKER_DIR/.env.ecs and update the values first."
  exit 1
fi

mkdir -p "$ROOT_DIR/uploads/screenshots"

COMPOSE_FILE="$COMPOSE_HTTP"
if [[ -f "$CERT_FULLCHAIN" && -f "$CERT_PRIVKEY" ]]; then
  COMPOSE_FILE="$COMPOSE_HTTPS"
  echo "HTTPS certificates detected. Deploying with TLS (80/443)."
else
  echo "TLS certificates not found at $CERT_DIR. Deploying HTTP only (port 80)."
fi

echo "Starting ECS containers with Docker-only builds..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "Waiting for API container..."
for i in {1..40}; do
  if docker compose -f "$COMPOSE_FILE" ps api | grep -q "Up"; then
    break
  fi
  sleep 2
done

echo "Running Prisma migrate in container..."
docker exec hvc-api sh -lc 'pnpm -C apps/api prisma:migrate'

echo "Seeding v2 content in container..."
docker exec hvc-api sh -lc 'pnpm -C apps/api prisma:seed'

echo "Deployment assets are ready."
echo "Check health with: curl http://127.0.0.1/api/v1/health"
