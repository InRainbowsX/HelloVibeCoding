# helloVibeCoding v2 Idea-First Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the product around idea-first flows on the existing NestJS + Prisma + PostgreSQL stack, replacing the current frontend IA with the v2 Ideas / Apps / Rooms / Submit / Admin experience.

**Architecture:** Add a new v2 domain layer (`Idea`, evidence cards, join requests, members, idea messages) alongside the existing data so the backend can serve the new flows without destructive table removal. Rebuild the frontend routes and primary pages around the new domain model while preserving the existing monorepo structure and API client pattern.

**Tech Stack:** NestJS, Prisma, PostgreSQL, React, React Router, TypeScript, Vite

### Task 1: Prisma v2 Domain

**Files:**
- Modify: `apps/api/src/prisma/schema.prisma`
- Create: `apps/api/src/prisma/migrations/20260305000000_v2_idea_first_rebuild/migration.sql`
- Test: `apps/api/test/app.e2e-spec.ts`

**Step 1: Write the failing test**

Add e2e coverage that expects:
- `GET /api/v1/ideas` returns a paginated `items` list
- `POST /api/v1/ideas` can create an idea

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/api test -- --runInBand`
Expected: FAIL because v2 endpoints and schema do not exist.

**Step 3: Write minimal implementation**

Add Prisma models for:
- `Idea`
- `IdeaEvidence`
- `JoinRequest`
- `Member`
- `IdeaMessage`

Create a migration that adds the new tables and relations without removing existing legacy tables.

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/api test -- --runInBand`
Expected: API tests for new idea endpoints pass.

### Task 2: NestJS v2 APIs

**Files:**
- Create: `apps/api/src/modules/ideas/*`
- Modify: `apps/api/src/modules/app.module.ts`
- Modify: `apps/api/src/modules/admin/admin.controller.ts`
- Modify: `apps/api/src/modules/admin/admin.service.ts`
- Test: `apps/api/test/app.e2e-spec.ts`

**Step 1: Write the failing test**

Add tests for:
- idea detail includes evidence, join status, message list
- join request create and status query
- admin approve/reject join requests
- admin patch idea metadata

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/api test -- --runInBand`
Expected: FAIL on missing routes / handlers.

**Step 3: Write minimal implementation**

Add an `IdeasModule` with service/controller methods for:
- listing ideas with sort + counts
- creating ideas
- idea detail
- list/create/delete evidence
- join request create
- join status lookup
- list/create messages with membership check

Extend admin APIs for:
- listing pending join requests
- approving / rejecting requests
- patching idea featured / novel metadata

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/api test -- --runInBand`
Expected: v2 API tests pass.

### Task 3: Frontend v2 Shell

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/index.css`

**Step 1: Write the failing test**

Use TypeScript compile as the immediate safety net for this repo and add API client types for the new resources.

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/web lint`
Expected: FAIL once new page imports / route references are introduced but not implemented.

**Step 3: Write minimal implementation**

Replace the primary route tree and top navigation with:
- `/` Ideas
- `/ideas/:id`
- `/apps`
- `/rooms`
- global submit modal
- `/admin`

Remove legacy frontend entry points from navigation and page rendering.

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/web lint`
Expected: TypeScript passes.

### Task 4: Frontend v2 Pages

**Files:**
- Create or rewrite: `apps/web/src/pages/Ideas*.tsx`
- Modify: `apps/web/src/pages/Directory.tsx`
- Modify: `apps/web/src/pages/Admin.tsx`

**Step 1: Write the failing test**

Use TypeScript + runtime smoke testing:
- route components compile
- API payload shapes match usage

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/web lint`
Expected: FAIL until the new pages and props are complete.

**Step 3: Write minimal implementation**

Implement:
- ideas list page
- idea detail dual-rail page
- apps evidence library
- rooms index
- v2 admin page
- global submit modal

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/web lint`
Expected: TypeScript passes.

### Task 5: Verification

**Files:**
- Verify only

**Step 1: Run backend verification**

Run: `pnpm -C apps/api test -- --runInBand`

**Step 2: Run frontend verification**

Run: `pnpm -C apps/web lint`

**Step 3: Run build checks if time allows**

Run:
- `pnpm -C apps/api build`
- `pnpm -C apps/web build`

Expected: no type or build errors for the implemented scope.
