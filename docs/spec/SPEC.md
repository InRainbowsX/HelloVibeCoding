# helloVibeCoding SPEC（单 ECS，NestJS + Prisma + PostgreSQL）

## 1. 项目整体架构

### 1.1 技术栈

- 后端：NestJS + Prisma + PostgreSQL
- 前端：Vite + React（后期可迁移 Next.js）
- 数据库：PostgreSQL（Prisma Migrate 管理）
- 部署：单台阿里云 ECS + Docker Compose
- 网关：Nginx（静态文件托管 + API 反向代理）
- 定时任务：`@nestjs/schedule`（不使用 Redis / BullMQ）

### 1.2 功能闭环

产品库（Directory） -> 产品拆解（Intelligence） -> 讨论（Discussions） -> 提交（Submit） -> 审核（Admin） -> 发布（Directory） -> Digest 订阅增长

## 2. Monorepo 目录规范

```text
hellovibecoding/
  AGENTS.md
  README.md
  package.json
  pnpm-workspace.yaml
  .editorconfig
  .gitignore
  .env.example

  docker/
    docker-compose.prod.yml
    nginx.conf

  apps/
    web/
      src/
        pages/
        components/
        lib/api.ts
        styles/
      public/
      dist/

    api/
      src/
        modules/
          apps/
          patterns/
          discussions/
          submissions/
          digest/
          admin/
        prisma/
          schema.prisma
          migrations/
          seed.ts
      test/

  packages/
    shared/
      src/
        types.ts
        enums.ts
        schemas.ts

  scripts/
    dev.sh
    seed.sh

  docs/
    spec/
      SPEC.md
```

## 3. 环境变量

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hellovibecoding`
- `API_BASE_URL=http://localhost:3001`
- `WEB_BASE_URL=http://localhost:5173`
- 邮件发送（Digest）：`SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / DIGEST_FROM`

## 4. 数据模型（Prisma）

核心表：

- `App`：产品主体 + 8 格拆解字段 + 关联 Pattern
- `Pattern`：模式定义 + 关联 App
- `Discussion`：讨论主题（targetType / targetId）
- `Comment`：扁平评论流（`replyToCommentId` 仅做引用关系）
- `Submission`：用户提交待审核
- `Subscriber`：Digest 邮件订阅
- `DigestIssue`：Digest 内容归档

## 5. API 统一约定

- 前缀：`/api/v1`
- 文档：`GET /api/v1/docs`（Swagger）
- 响应格式：优先保持 `items + total + page + pageSize` 的分页结构
- 时间字段：ISO 8601（UTC）

## 6. 阶段规划

## SPEC 0 — 后端与数据库初始化

### 目标

搭建 API 基础设施并打通 PostgreSQL。

### 任务

- 初始化 `apps/api`（NestJS 主模块 + 全局前缀）。
- 集成 Prisma，完成初始 schema。
- 执行 migration，确保数据库结构可落地。
- seed 初始化：10 条 App + 10 条 Pattern + 示例 Discussion。
- 集成 Swagger，保证 `/api/v1/docs` 可访问。

### 交付物

- API 能启动。
- DB 可迁移、可 Seed。
- Swagger 文档可浏览。

### 验收

- `pnpm -C apps/api start:dev` 正常启动。
- `pnpm -C apps/api prisma:migrate && pnpm -C apps/api prisma:seed` 无报错。

## SPEC 1 — Directory（6 列 + 行展开）

### 目标

前端目录页改造为真实 API 数据驱动。

### API

- `GET /api/v1/apps`
  - query：`search, pattern, pricing, sort, page, pageSize`
  - sort 支持：`hot`, `latest`, `difficulty`

### 前端

- `Directory.tsx` 接入 `/apps`。
- 6 列默认展示：`name, pricing, pattern, channels, heat, difficulty`。
- 行展开显示：`targetPersona, triggerScene, coldStartHighlights` 等。
- 支持筛选、排序、分页、响应式。

### 交付物

- 可用的目录页数据浏览体验。

### 验收

- 不同筛选条件下返回结果正确。
- 移动端不出现横向滚动。

## SPEC 2 — Intelligence（先拆解后讨论）

### 目标

产品详情页完整呈现 8 格拆解，并关联讨论。

### API

- `GET /api/v1/apps/:slug`
  - 返回详情 + 8 格字段 + screenshotUrls + relatedPattern + discussions。

### 前端

- `Intelligence.tsx`：首屏结论、三卡、截图、亮点、8 格拆解。
- 展示同模式产品推荐。
- 讨论区嵌入或跳转讨论详情。

### 交付物

- 详情页形成“信息消费闭环”。

### 验收

- 8 格字段缺省时有合理 fallback。
- 讨论区与当前 app 数据绑定正确。

## SPEC 3 — Discussions（扁平评论流）

### 目标

完成讨论列表与评论交互。

### API

- `GET /api/v1/discussions`
  - query：`targetType, targetId, sort, page, pageSize`
- `POST /api/v1/discussions/:id/comments`
  - body：`authorName, content, replyToCommentId?`

### 前端

- `Discussions.tsx`：讨论列表、筛选、排序。
- `DiscussionDetail.tsx`：主题 + 评论流。
- 扁平流展示回复引用条（非树状嵌套）。

### 交付物

- 用户可发评论、看回复、点赞。

### 验收

- `replyToCommentId` 正确显示引用来源。
- 评论创建后列表即时更新。

## SPEC 4 — Patterns + Submit + Digest 订阅

### 目标

完成增长闭环：模式详情、产品提交、Digest 订阅、审核入口。

### API

- `GET /api/v1/patterns/:slug`
- `POST /api/v1/submissions`
- `POST /api/v1/subscribe`
- 管理端：`GET /api/v1/admin/submissions`、`POST /api/v1/admin/submissions/:id/review`

### 前端

- `PatternDetail.tsx`：模式详情 + 关联产品。
- `Submit.tsx`：提交表单（名称、链接、截图、模式、备注）。
- 订阅入口：邮箱订阅 Digest。

### 后台

- 审核 `Submission`，审批后可生成 `App` 草稿并发布。

### 交付物

- 提交、审核、订阅完整可用。

### 验收

- 提交后能在管理端看到记录。
- 订阅邮箱去重、校验合法性。

## 7. 定时任务方案（无 Redis）

- 使用 `@nestjs/schedule` 设定周任务。
- 任务内容：
  - 汇总本周新增/高热产品。
  - 生成 `DigestIssue`。
  - 调用邮件服务发送至 `Subscriber`。
- 失败重试：先采用数据库标记 + 下次扫描补发（无需队列）。

## 8. 部署方案（单 ECS）

1. ECS 安装 Docker / Docker Compose。
2. 代码部署到 `/opt/hellovibecoding/`。
3. 配置 `.env` 并执行：
   - `docker compose -f docker/docker-compose.prod.yml up -d --build`
4. Nginx 配置反代 `/api` 到 `api:3001`，静态文件托管 `apps/web/dist`。
5. 使用 Certbot 申请 HTTPS 证书。
6. 用健康检查确保 API、DB、Nginx 可用。

## 9. 质量门槛

- TypeScript 全链路。
- Lint / Test 最小闭环。
- API 核心接口集成测试最少覆盖：
  - apps list
  - app detail
  - create comment
  - create submission
- 前端保持 Notion 风：留白、细分割线、轻 hover、信息密但不拥挤。

## 10. 当前状态说明

本仓库当前已落地目录骨架、基础配置、入口文件和 SPEC 文档；业务功能尚未进入实现阶段。
