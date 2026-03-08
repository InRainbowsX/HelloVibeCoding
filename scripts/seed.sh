#!/usr/bin/env bash
set -euo pipefail

echo '[seed] running prisma migrate + seed...'
pnpm -C apps/api prisma:migrate
pnpm -C apps/api prisma:seed
