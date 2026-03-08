# helloVibeCoding Spec Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first working foundation for the SPEC: a real NestJS API structure with Prisma-backed core endpoints plus frontend API integration points.

**Architecture:** Keep the existing monorepo layout. Build backend feature modules around Prisma queries and simple DTO validation first, then wire frontend pages to those endpoints with lightweight React state. Prioritize runnable infrastructure and the product/discussion/submission data loop.

**Tech Stack:** NestJS, Prisma, PostgreSQL, TypeScript, Vite, React

### Task 1: Backend Foundation

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/modules/health/*`
- Create: `apps/api/src/modules/prisma/*`
- Modify: `apps/api/src/modules/app.module.ts`

**Step 1: Write failing tests**
- Add e2e smoke tests for `/api/v1/health` and `/api/v1/apps`.

**Step 2: Run tests to verify they fail**
- Run the API test command after Jest config exists.

**Step 3: Write minimal implementation**
- Add `PrismaService`, `PrismaModule`, `HealthController`, and module registration.

**Step 4: Run tests to verify they pass**
- Ensure the smoke endpoints return valid JSON.

### Task 2: Core Product and Pattern APIs

**Files:**
- Create: `apps/api/src/modules/apps/*`
- Create: `apps/api/src/modules/patterns/*`

**Step 1: Write failing tests**
- Add tests for list/filter/detail behaviors.

**Step 2: Run tests to verify they fail**
- Confirm failure for missing routes/logic.

**Step 3: Write minimal implementation**
- Implement list/detail services with Prisma filters, sorting, and relations.

**Step 4: Run tests to verify they pass**
- Confirm responses include pagination and joined pattern/discussion data.

### Task 3: Discussion / Submission / Admin APIs

**Files:**
- Create: `apps/api/src/modules/discussions/*`
- Create: `apps/api/src/modules/submissions/*`
- Create: `apps/api/src/modules/admin/*`
- Create: `apps/api/src/modules/digest/*`

**Step 1: Write failing tests**
- Add tests for comment creation, submission creation, review, and subscribe.

**Step 2: Run tests to verify they fail**
- Confirm route absence/validation failure.

**Step 3: Write minimal implementation**
- Implement controllers, DTOs, and Prisma-backed services.

**Step 4: Run tests to verify they pass**
- Confirm DB writes and shaped response payloads.

### Task 4: Frontend Integration Baseline

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/pages/*.tsx`
- Modify: `apps/web/src/styles/global.css`

**Step 1: Write failing tests**
- Add UI tests or minimal type-checked integration hooks.

**Step 2: Run tests to verify they fail**
- Confirm missing data rendering.

**Step 3: Write minimal implementation**
- Wire pages to real endpoints with loading/error states and clean responsive layout.

**Step 4: Run tests to verify they pass**
- Verify pages render API-driven content and forms can submit.
