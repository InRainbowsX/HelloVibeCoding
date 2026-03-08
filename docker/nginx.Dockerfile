FROM docker.m.daocloud.io/node:22-alpine AS web-builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
RUN pnpm install --filter @hvc/web... --no-frozen-lockfile

COPY . .
RUN pnpm -C apps/web build

FROM docker.m.daocloud.io/nginx:1.27-alpine
COPY docker/nginx.ecs.conf /etc/nginx/conf.d/default.conf
COPY --from=web-builder /app/apps/web/dist /usr/share/nginx/html
