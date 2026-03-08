# Discussion Detail And ECS Deployment Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a real frontend discussion detail page so shared discussion links land on a dedicated thread view, and document a concrete Alibaba Cloud ECS deployment path.

**Architecture:** Reuse the existing `GET /api/v1/discussions/:id` API and add a client-side route at `/discussions/:id`. Keep the current editorial visual language and avoid redesigning the main list page. For deployment, add a dedicated markdown guide with exact service order, ports, and environment setup, then link it from the root README.

**Tech Stack:** React Router, Vite, TypeScript, Tailwind CSS, NestJS API (existing endpoint), Markdown docs.

### Task 1: Add Discussion Detail Route

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1:** Create a `DiscussionDetailPage` component that loads `getDiscussion(id)` from route params.

**Step 2:** Render the thread in the current site style:
- title
- target type
- created date
- like count
- full flat comment stream
- reply form

**Step 3:** Register route `'/discussions/:id'` and keep `'/discussions'` intact.

### Task 2: Update Share And Entry Points

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1:** Change discussion share URLs from hash links to `'/discussions/:id'`.

**Step 2:** Add a visible thread entry point from the list page (title link or “查看详情”).

### Task 3: Add ECS Deployment Guide

**Files:**
- Create: `docs/deployment/alibaba-ecs.md`
- Modify: `README.md`

**Step 1:** Document ECS setup:
- install Docker
- clone code
- configure `.env`
- build frontend
- build API
- start Postgres/Nginx
- run API
- configure Nginx reverse proxy
- open required ports

**Step 2:** Link the guide from `README.md`.

### Task 4: Verify

**Files:**
- None

**Step 1:** Run `corepack pnpm -C apps/web lint`

**Step 2:** Run `corepack pnpm -C apps/web build`

**Step 3:** If docs changed only, no extra runtime verification is required beyond build success.
