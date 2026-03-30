#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_DIR="$ROOT_DIR/docker"
COMPOSE_HTTP="$DOCKER_DIR/docker-compose.ecs.yml"
COMPOSE_HTTPS="$DOCKER_DIR/docker-compose.ecs.https.yml"
CERT_DIR="/etc/letsencrypt/live/www.hellovibecoding.cn"
CERT_FULLCHAIN="$CERT_DIR/fullchain.pem"
CERT_PRIVKEY="$CERT_DIR/privkey.pem"
PRISMA_BIN="apps/api/node_modules/.bin/prisma"
TSX_BIN="apps/api/node_modules/.bin/tsx"

cd "$ROOT_DIR"

if [[ ! -f "$DOCKER_DIR/.env.ecs" ]]; then
  echo "Missing $DOCKER_DIR/.env.ecs"
  echo "Copy $DOCKER_DIR/.env.ecs.example to $DOCKER_DIR/.env.ecs and update the values first."
  exit 1
fi

required_vars=(DATABASE_URL PORT NODE_ENV VITE_API_BASE_URL ADMIN_TOKEN JWT_SECRET)
for var_name in "${required_vars[@]}"; do
  if ! grep -Eq "^${var_name}=.+" "$DOCKER_DIR/.env.ecs"; then
    echo "Missing required env var in $DOCKER_DIR/.env.ecs: $var_name"
    exit 1
  fi
done

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

echo "Running Prisma schema sync in container..."
docker exec hvc-api sh -lc "$PRISMA_BIN db push --schema apps/api/src/prisma/schema.prisma"

echo "Seeding v2 content in container..."
docker exec hvc-api sh -lc "$TSX_BIN apps/api/src/prisma/seed.ts"

echo "Deployment assets are ready."
echo "Check API health in container with: docker exec hvc-api wget -qO- http://127.0.0.1:3001/api/v1/health"
