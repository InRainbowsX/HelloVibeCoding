# Growth Loop Followups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real discussion creation, improve asset export ergonomics, and document deployment-ready startup steps.

**Architecture:** Extend the existing discussions module with a minimal create-thread endpoint tied to existing `APP`/`PATTERN` targets, then wire the web discussion page to that endpoint with a lightweight editorial form. Keep asset export client-side by reusing fetched asset content and adding a batch download action. Finish by documenting the updated local/prod run sequence in the root README.

**Tech Stack:** NestJS, Prisma, Vite, React, TypeScript

### Task 1: Add discussion creation API
- Modify: `apps/api/test/app.e2e-spec.ts`
- Modify: `apps/api/src/modules/discussions/discussions.controller.ts`
- Modify: `apps/api/src/modules/discussions/discussions.service.ts`
- Create: `apps/api/src/modules/discussions/dto/create-discussion.dto.ts`

### Task 2: Wire discussion creation in frontend
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/App.tsx`

### Task 3: Improve asset export ergonomics
- Modify: `apps/web/src/components/AssetBundlePanel.tsx`

### Task 4: Update deployment and startup docs
- Modify: `README.md`
