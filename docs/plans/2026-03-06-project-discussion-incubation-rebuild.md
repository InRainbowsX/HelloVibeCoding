# Project-Centered Discussion & Incubation Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the current idea-first experience into a project-first system with attached discussions, reusable idea blocks, an idea incubation area, and rooms.

**Architecture:** Keep the existing monorepo and NestJS + Prisma stack, but introduce a new project-centered domain model alongside transitional compatibility where needed. The backend should expose first-class `projects`, `discussions`, `idea-blocks`, `incubations`, and `rooms` resources, while the frontend route tree and primary screens move to the new IA anchored on project detail pages.

**Tech Stack:** NestJS, Prisma, PostgreSQL, React, React Router, TypeScript, Vite

### Task 1: Redefine the Prisma Domain

**Files:**
- Modify: `apps/api/src/prisma/schema.prisma`
- Modify: `apps/api/src/prisma/seed.ts`
- Modify: `apps/api/src/prisma/content/v2-launch.ts`
- Create: `apps/api/src/prisma/migrations/20260306000000_project_discussion_incubation_rebuild/migration.sql`
- Test: `apps/api/test/app.e2e-spec.ts`

**Step 1: Write the failing test**

Add e2e coverage that expects:
- `GET /api/v1/projects` returns seeded project data
- `GET /api/v1/projects/:slug` returns tabs-ready payload including discussions, idea blocks, incubations, and rooms
- `GET /api/v1/idea-blocks` returns extracted reusable blocks
- `GET /api/v1/incubations` returns seeded incubation drafts

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/api test -- --runInBand`
Expected: FAIL on missing routes or payload properties.

**Step 3: Write minimal implementation**

Update Prisma models to:
- Rename application-facing `App` semantics to `Project`
- Add `IdeaBlock`, join tables for block sources and incubation composition, `IdeaIncubation`, `Room`, `RoomMember`, `RoomJoinRequest`, `RoomMessage`
- Expand `Discussion` semantics into thread-style records tied to projects, incubations, or patterns

Seed projects, discussion threads, idea blocks, incubations, and rooms from the existing launch content.

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/api test -- --runInBand`
Expected: PASS for new project-centered API coverage.

### Task 2: Add Project-Centered APIs

**Files:**
- Create: `apps/api/src/modules/projects/*`
- Create: `apps/api/src/modules/idea-blocks/*`
- Create: `apps/api/src/modules/incubations/*`
- Create: `apps/api/src/modules/rooms/*`
- Modify: `apps/api/src/modules/discussions/*`
- Modify: `apps/api/src/modules/app.module.ts`
- Test: `apps/api/test/app.e2e-spec.ts`

**Step 1: Write the failing test**

Add tests for:
- project detail discussions can be created and listed
- incubation detail returns composed blocks and related source projects
- room list includes rooms linked to projects or incubations

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/api test -- --runInBand`
Expected: FAIL on missing controllers/services.

**Step 3: Write minimal implementation**

Implement:
- `ProjectsModule` for list/detail payloads
- `IdeaBlocksModule` for list/detail payloads
- `IncubationsModule` for list/detail payloads
- `RoomsModule` for list/detail payloads
- upgraded `DiscussionsModule` with thread creation under project/incubation targets

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/api test -- --runInBand`
Expected: PASS.

### Task 3: Rebuild the Web IA

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/index.css`

**Step 1: Write the failing test**

Use TypeScript/lint as the immediate safety net by switching route and type usage to the new API surface.

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/web lint`
Expected: FAIL while the old idea-first pages still reference removed types/routes.

**Step 3: Write minimal implementation**

Replace the route tree and navigation with:
- `/` home
- `/projects`
- `/projects/:slug`
- `/discussions`
- `/idea-blocks`
- `/incubations`
- `/rooms`

Build the project detail page with tabs:
- `overview`
- `teardown`
- `discussions`
- `idea-blocks`
- `incubation`
- `rooms`

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/web lint`
Expected: PASS.

### Task 4: Migrate Seeded UI Content

**Files:**
- Modify: `apps/api/src/prisma/content/v2-launch.ts`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/App.tsx`

**Step 1: Write the failing test**

Add backend assertions for seeded project detail content and make the frontend type-check depend on it.

**Step 2: Run test to verify it fails**

Run:
- `pnpm -C apps/api test -- --runInBand`
- `pnpm -C apps/web lint`

Expected: FAIL until seed-to-UI mapping is complete.

**Step 3: Write minimal implementation**

Translate the current `idea` content into:
- discussion thread seeds
- idea block seeds
- incubation seeds
- room seeds

Ensure the UI uses these relations in overview/discussion/incubation modules.

**Step 4: Run test to verify it passes**

Run:
- `pnpm -C apps/api test -- --runInBand`
- `pnpm -C apps/web lint`

Expected: PASS.

### Task 5: Verification

**Files:**
- Verify only

**Step 1: Run backend verification**

Run:
- `pnpm -C apps/api test -- --runInBand`
- `pnpm -C apps/api build`

**Step 2: Run frontend verification**

Run:
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`

**Step 3: Review the resulting IA manually**

Check:
- project detail tabs render with seeded data
- discussions are attached, not primary top-level objects
- idea blocks and incubations are visible as downstream artifacts
- rooms are linked from projects/incubations
