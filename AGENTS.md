# helloVibeCoding — AGENTS.md（中文）

> AI 编码助手阅读此文件以了解项目背景、技术栈、架构约定和开发规范。

---

## 1. 项目概述

**helloVibeCoding** 是一个"数据库式产品库"平台，收录已上线的真实产品，提供商业拆解（8 格拆解）、点子实验室（Idea Blocks）、Idea 孵化区、讨论社区等功能。目标用户是想从真实产品中学习、寻找灵感、组合新方向的独立开发者。

### 核心功能闭环

```
作品库（Projects）→ 商业拆解（Teardown）→ 点子实验室（Idea Blocks）
     ↓                                         ↓
讨论区（Discussions） ← Idea 孵化区（Incubations）← 组合创建
```

### 线上地址

- 主站：https://www.hellovibecoding.cn
- 后台：https://www.hellovibecoding.cn/admin（需 Admin Token）
- API 文档：`/api/v1/docs`（Swagger UI）

---

## 2. 技术栈

### 后端（apps/api）

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 22.x | 运行时 |
| NestJS | 11.x | Web 框架 |
| Prisma | 6.x | ORM + 数据库迁移 |
| PostgreSQL | 16 | 主数据库 |
| Swagger | - | API 文档自动生成 |
| sharp | - | 图片压缩处理 |
| class-validator | - | DTO 校验 |

### 前端（apps/web）

| 技术 | 版本 | 用途 |
|------|------|------|
| Vite | 6.x | 构建工具 |
| React | 19.x | UI 框架 |
| React Router | 7.x | 路由 |
| Tailwind CSS | 4.x | 样式系统 |
| motion | 12.x | 动画库 |
| lucide-react | - | 图标库 |

### 开发工具

- **包管理器**：pnpm 10.x（使用 corepack 管理）
- **TypeScript**：5.7.x（全链路类型安全）
- **测试**：Jest 30.x（后端）

---

## 3. 项目结构

```
hellovibecoding/
├── apps/
│   ├── api/                    # NestJS 后端
│   │   ├── src/
│   │   │   ├── modules/        # 业务模块（见下）
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma   # 数据库模型定义
│   │   │   │   ├── seed.ts         # 种子数据
│   │   │   │   └── content/        # 内容种子（v2 启动数据）
│   │   │   └── main.ts         # 入口文件
│   │   ├── Dockerfile          # API 容器构建
│   │   └── nest-cli.json
│   │
│   └── web/                    # Vite + React 前端
│       ├── src/
│       │   ├── App.tsx         # 主应用组件（含所有页面）
│       │   ├── lib/api.ts      # API 客户端 + 类型定义 + 降级数据
│       │   ├── index.css       # 全局样式 + Tailwind 主题
│       │   └── main.tsx        # 入口
│       ├── public/             # 静态资源（项目图标等）
│       └── vite.config.ts
│
├── packages/
│   └── shared/                 # 共享类型（预留，当前内容较少）
│
├── docker/                     # Docker 配置
│   ├── docker-compose.prod.yml     # 本地生产环境
│   ├── docker-compose.ecs.yml      # ECS 部署（HTTP）
│   ├── docker-compose.ecs.https.yml # ECS 部署（HTTPS）
│   ├── nginx.conf              # 本地 Nginx 配置
│   ├── nginx.ecs.conf          # ECS Nginx 配置
│   └── .env.ecs.example        # ECS 环境变量模板
│
├── scripts/                    # 开发脚本
│   ├── dev.sh                  # 同时启动 API + Web
│   └── seed.sh                 # 数据库种子
│
├── docs/
│   ├── spec/SPEC.md            # 详细规格说明书
│   └── deployment/alibaba-ecs.md  # 阿里云 ECS 部署指南
│
├── .env.example                # 本地环境变量模板
├── pnpm-workspace.yaml         # pnpm workspace 定义
└── package.json                # 根 package.json（scripts 入口）
```

### 后端模块划分（apps/api/src/modules/）

| 模块 | 职责 |
|------|------|
| `admin` | 后台管理 CRUD、Token 鉴权、截图上传 |
| `apps` | 产品（App）的增删改查 |
| `projects` | 作品库列表/详情聚合查询（面向前端） |
| `patterns` | 模式（Pattern）管理 |
| `discussions` | 讨论主题 + 评论 |
| `ideas` | 灵感（Idea）+ 证据（Evidence）+ 加入申请 |
| `idea-blocks` | 点子块（可复用的产品机制） |
| `incubations` | Idea 孵化项目 |
| `rooms` | 房间（协作空间）+ 消息 |
| `submissions` | 用户提交 + 邮件订阅 |
| `digest` | Digest 邮件内容管理 |
| `prisma` | PrismaService（数据库连接） |
| `health` | 健康检查端点 |

---

## 4. 数据库模型（Prisma）

核心模型关系：

```
App ──┬── Pattern（多对一）
      ├── Discussion（一对多）
      ├── Teardown（一对一，8格拆解）
      ├── AppAssetBundle（一对一，构建资源）
      ├── IdeaBlockSource（多对多，关联 IdeaBlock）
      ├── IncubationProject（多对多，关联 Incubation）
      └── Room（一对多）

Idea ──┬── IdeaEvidence（一对多，证据链）
       ├── JoinRequest（一对多，加入申请）
       ├── Member（一对多，成员）
       └── IdeaMessage（一对多，留言）

IdeaBlock ──┬── IdeaBlockSource（多对多）
            └── IncubationBlock（多对多）

Discussion ──┬── Comment（一对多，扁平评论）
             └── IdeaBlock（可选关联）
```

### 关键枚举类型

- `PricingModel`: FREE | FREEMIUM | PAID | USAGE_BASED
- `TargetType`: APP | PROJECT | PATTERN | INCUBATION
- `IdeaBlockType`: FORMULA | FEATURE | WORKFLOW | CHANNEL
- `IncubationStatus`: OPEN | VALIDATING | BUILDING | ARCHIVED
- `SubmissionStatus`: PENDING | APPROVED | REJECTED

---

## 5. 开发命令

```bash
# 安装依赖（根目录执行）
corepack pnpm install

# 开发模式（同时启动 API + Web）
pnpm dev
# 或单独启动：
pnpm -C apps/api start:dev    # API: http://localhost:3001
pnpm -C apps/web dev          # Web: http://localhost:5173

# 数据库操作（需先确保 PostgreSQL 运行）
pnpm -C apps/api prisma:migrate   # 执行迁移
pnpm -C apps/api prisma:seed      # 填充种子数据
pnpm -C apps/api prisma:generate  # 重新生成 Prisma Client

# 构建
pnpm -C apps/api build        # 构建 API（输出到 dist/）
pnpm -C apps/web build        # 构建 Web（输出到 dist/）

# 测试
pnpm -C apps/api test         # 运行 Jest 测试

# Lint
pnpm lint                     # 全仓库 lint
```

---

## 6. 环境变量

### 本地开发（.env）

```env
# 数据库
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hellovibecoding

# API / Web 地址
API_BASE_URL=http://localhost:3001
WEB_BASE_URL=http://localhost:5173

# Admin 后台鉴权（最小实现）
ADMIN_TOKEN=change-this-admin-token

# SMTP（Digest 邮件，当前未启用）
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
DIGEST_FROM=

# AI 推荐（可选，用于点子组合推荐）
QWEN_API_KEY=
QWEN_MODEL=qwen-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

### 生产环境（docker/.env.ecs）

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/hellovibecoding
PORT=3001
NODE_ENV=production
VITE_API_BASE_URL=/api/v1
ADMIN_TOKEN=your-secure-admin-token
```

---

## 7. 代码规范与约定

### 7.1 命名规范

- **文件**：kebab-case（如 `list-projects-query.dto.ts`）
- **类**：PascalCase（如 `ProjectsController`）
- **方法/变量**：camelCase
- **数据库表**：PascalCase（Prisma 默认）
- **API 端点**：kebab-case（如 `/idea-blocks`）

### 7.2 API 设计规范

- **前缀**：`/api/v1`
- **响应格式**：统一使用 `{ items, total, page?, pageSize? }` 分页结构
- **Swagger**：所有 Controller 必须使用 `@ApiTags()` 和 `@ApiOkResponse()`
- **DTO 校验**：使用 `class-validator` + `class-transformer`
- **时间格式**：ISO 8601（UTC）

### 7.3 前端规范

- **样式系统**：Tailwind CSS 4.x，使用 CSS 变量定义主题色
- **主题变量**（定义于 `index.css`）：
  - `--color-brand-bg`: #f5f5f3（背景）
  - `--color-brand-surface`: #ffffff（卡片表面）
  - `--color-brand-ink`: #1a1a1a（主文字）
  - `--color-brand-muted`: #666666（次要文字）
  - `--color-brand-line`: #e0e0de（分割线）
  - `--color-brand-accent`: #3d5a6c（强调色）
- **字体**：IBM Plex Sans（正文）、Newsreader（标题）、JetBrains Mono（代码）
- **降级策略**：`lib/api.ts` 中所有 API 方法都带有 fallback 数据，确保离线可开发

### 7.4 UI 风格指南

参考技能：`$ui-ux-pro-max`、`$frontend-design`

- **整体风格**：Notion 风清爽留白
- **信息密度**：密但不拥挤
- **分割线**：细线（1px，#e0e0de）
- **Hover 效果**：轻微反馈，避免花哨动效
- **阴影**：避免强阴影，保持扁平
- **卡片**：细边框 + 纯白背景

---

## 8. 关键实现细节

### 8.1 前端降级数据

`apps/web/src/lib/api.ts` 中每个 API 方法都实现了 `withFallback()` 模式：

```typescript
export function getProjects() {
  return withFallback(
    () => requestJson<PaginatedResult<ProjectListItem>>('/projects'),
    { items: fallbackProjects, total: fallbackProjects.length }
  );
}
```

这样即使后端未启动，前端也能用 fallback 数据正常显示，方便开发。

### 8.2 Admin Token 鉴权

后台接口（`/api/v1/admin/*`）使用最小 Token 鉴权：

1. 请求头携带 `X-Admin-Token`
2. `AdminTokenGuard` 比对环境变量 `ADMIN_TOKEN`
3. Token 错误返回 401

### 8.3 截图上传处理

- 端点：`POST /api/v1/admin/uploads/screenshot`
- 限制：自动压缩到 100KB 以内
- 存储：保存到 `uploads/` 目录，通过 `/uploads/` 路径访问
- 生产环境 Nginx 需配置 `/uploads/` 反代

### 8.4 模块组织（NestJS）

每个模块遵循标准结构：

```
modules/feature/
├── feature.module.ts      # 模块定义
├── feature.controller.ts  # HTTP 路由
├── feature.service.ts     # 业务逻辑
└── dto/
    ├── create-feature.dto.ts
    └── list-feature-query.dto.ts
```

---

## 9. 部署流程

### 9.1 本地生产测试

```bash
# 1. 启动 PostgreSQL
docker compose -f docker/docker-compose.prod.yml up -d db

# 2. 迁移 + 种子
pnpm -C apps/api prisma:migrate
pnpm -C apps/api prisma:seed

# 3. 构建前端
pnpm -C apps/web build

# 4. 启动所有服务
docker compose -f docker/docker-compose.prod.yml up -d
```

### 9.2 阿里云 ECS 部署

使用一键部署脚本：

```bash
# 1. 配置环境变量
cp docker/.env.ecs.example docker/.env.ecs
# 编辑 docker/.env.ecs

# 2. 执行部署
bash scripts/deploy-ecs.sh
```

脚本会自动检测证书目录，有证书走 HTTPS，无证书走 HTTP。

### 9.3 手动 ECS 部署步骤

1. 安装 Docker / Docker Compose
2. 拉取代码到 `/opt/hellovibecoding`
3. 配置 `docker/.env.ecs`
4. `pnpm install && pnpm -C apps/web build`
5. `docker compose -f docker/docker-compose.ecs.yml up -d --build`
6. 执行数据库迁移和种子

详见：`docs/deployment/alibaba-ecs.md`

---

## 10. 测试策略

### 后端测试

- 框架：Jest
- 配置：`apps/api/jest.config.ts`
- 运行：`pnpm -C apps/api test`
- 覆盖目标（待完善）：
  - apps list/detail
  - create comment
  - create submission
  - admin CRUD

### 前端测试

当前状态：占位（`echo 'todo: web test'`）

---

## 11. 已知限制与 TODO

详见 `TODO.md`：

### 当前版本已支持

- ✅ Admin 后台可用录入与维护
- ✅ 真实截图上传（压缩到 100KB 内）
- ✅ 作品库浏览与搜索
- ✅ 点子实验室（Idea Blocks）组合
- ✅ Idea 孵化区创建与讨论

### 明确延期（下一版）

- ⏸️ 登录功能（仅预留，无真实鉴权）
- ⏸️ 完整审核流程（草稿流、发布流）
- ⏸️ 资产动态生成（当前为手动录入）
- ⏸️ 邮件发送（Digest 订阅邮件）

### 仍需补齐的工程项

- Admin 页面组件化（当前集中在 App.tsx）
- 后端 admin CRUD 更细粒度测试
- 截图上传增强（格式校验、失败反馈）
- 生产运维（日志采集、监控告警、数据库备份）
- 安全风控（管理接口鉴权强化、限流、防刷）

---

## 12. 开发检查清单

开始新功能前，确认：

- [ ] 已阅读 `docs/spec/SPEC.md` 相关章节
- [ ] 数据库模型需要变更时，先更新 `schema.prisma` 并执行迁移
- [ ] API 接口添加 Swagger 装饰器
- [ ] 前端 API 方法添加到 `lib/api.ts` 并包含 fallback 数据
- [ ] 遵循 UI 风格规范（颜色变量、字体、间距）
- [ ] 关键逻辑有错误处理

---

## 13. 参考资料

- `README.md`：快速开始指南
- `docs/spec/SPEC.md`：详细规格说明书（阶段规划）
- `docs/deployment/alibaba-ecs.md`：ECS 部署完整指南
- `TODO.md`：待办事项与已知限制
