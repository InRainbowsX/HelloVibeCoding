# helloVibeCoding

Monorepo skeleton for `NestJS + Prisma + PostgreSQL` backend and `Vite + React` frontend.

## Workspace

- `apps/web`: Vite + React prototype and pages
- `apps/api`: NestJS API + Prisma schema
- `packages/shared`: shared types/enums/schemas
- `docker`: production compose and nginx config
- `docs/spec`: project SPEC and phase plan

## Quick Start

1. Copy env:
   - `cp .env.example .env`
2. Install:
   - `corepack pnpm install`
3. Start PostgreSQL (local):
   - `docker compose -f docker/docker-compose.prod.yml up -d db`
4. Run migration + seed (after API deps installed):
   - `corepack pnpm -C apps/api prisma:migrate`
   - `corepack pnpm -C apps/api prisma:seed`
5. Start services:
   - `corepack pnpm -C apps/api start:dev`
   - `corepack pnpm -C apps/web dev`

## Local URLs

- Web: `http://localhost:5173`
- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/v1/docs`

## Deployment Prep

1. Set production env values in `.env`
2. Build frontend:
   - `corepack pnpm -C apps/web build`
3. Build API:
   - `corepack pnpm -C apps/api build`
4. Start production dependencies:
   - `docker compose -f docker/docker-compose.prod.yml up -d db nginx`
5. Run API separately or with your container runtime:
   - `corepack pnpm -C apps/api start`

## Alibaba Cloud ECS

- Detailed deployment guide:
  - [docs/deployment/alibaba-ecs.md](/Users/qitmac001629/Documents/p/HelloVibeCoding/docs/deployment/alibaba-ecs.md)
- ECS compose:
  - [docker/docker-compose.ecs.yml](/Users/qitmac001629/Documents/p/HelloVibeCoding/docker/docker-compose.ecs.yml)
  - [docker/docker-compose.ecs.https.yml](/Users/qitmac001629/Documents/p/HelloVibeCoding/docker/docker-compose.ecs.https.yml)
- ECS nginx:
  - [docker/nginx.ecs.conf](/Users/qitmac001629/Documents/p/HelloVibeCoding/docker/nginx.ecs.conf)
- ECS env template:
  - [docker/.env.ecs.example](/Users/qitmac001629/Documents/p/HelloVibeCoding/docker/.env.ecs.example)
- Deploy script:
  - [scripts/deploy-ecs.sh](/Users/qitmac001629/Documents/p/HelloVibeCoding/scripts/deploy-ecs.sh)
  - 脚本会自动检测证书目录 `/etc/letsencrypt/live/www.hellovibecoding.cn/`，有证书走 HTTPS，无证书走 HTTP。
- Optional service unit:
  - [deploy/systemd/hellovibecoding-api.service](/Users/qitmac001629/Documents/p/HelloVibeCoding/deploy/systemd/hellovibecoding-api.service)

## Production URLs

- Site: [https://www.hellovibecoding.cn](https://www.hellovibecoding.cn)
- Admin: [https://www.hellovibecoding.cn/admin](https://www.hellovibecoding.cn/admin)

Notes:

- `hellovibecoding.cn` and `www.hellovibecoding.cn` both redirect to `https://www.hellovibecoding.cn`
- `/admin` requires the `ADMIN_TOKEN` configured on the server
