FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
RUN pnpm install --filter @hvc/api... --no-frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm -C apps/api prisma:generate
RUN pnpm -C apps/api build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 3001
CMD ["node", "apps/api/dist/src/main.js"]
