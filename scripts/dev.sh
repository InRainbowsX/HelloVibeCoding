#!/usr/bin/env bash
set -euo pipefail

echo '[dev] starting api + web...'
pnpm -C apps/api start:dev &
pnpm -C apps/web dev
