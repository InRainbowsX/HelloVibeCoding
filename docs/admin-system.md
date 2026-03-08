# 管理系统使用文档

## 概述

新增了一套完整的管理系统，支持内容管理、用户管理、评论审核和模拟数据生成。

## 新增功能

### 1. 数据库模型更新

- **User 模型**: 支持真实用户和模拟用户
  - `isSimulated`: 标记是否为模拟用户
  - `persona`: 用户角色画像 (indie_hacker, product_manager, designer, etc.)
  - `role`: 用户权限角色

- **Comment 模型**: 增强评论审核
  - `status`: 评论状态 (PENDING, APPROVED, REJECTED, SPAM)
  - `isSimulated`: 标记是否为模拟评论
  - `authorId`: 关联到用户

- **App/Discussion 模型**: 内容审核
  - `contentStatus`: 内容状态 (DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED)

- **AuditLog 模型**: 操作审计日志
  - 记录所有管理员操作
  - 支持变更前后值对比

### 2. 后端 API 增强

#### 内容管理
- `GET /admin/content-stats` - 内容统计
- `GET /admin/review-queue` - 审核队列
- `PATCH /admin/apps/:id/content` - 更新作品内容
- `POST /admin/apps/bulk-status` - 批量更新作品状态
- `PATCH /admin/discussions/:id/content` - 更新讨论内容

#### 评论管理
- `GET /admin/comments` - 评论列表（支持过滤）
- `PATCH /admin/comments/:id/status` - 更新评论状态
- `POST /admin/comments/bulk-status` - 批量更新评论状态
- `DELETE /admin/comments/:id` - 删除评论

#### 用户管理
- `GET /admin/users` - 用户列表
- `POST /admin/users` - 创建用户
- `PATCH /admin/users/:id` - 更新用户
- `DELETE /admin/users/:id` - 删除用户

#### 模拟数据
- `POST /admin/simulated/users` - 生成模拟用户
- `POST /admin/simulated/comments` - 生成模拟评论
- `DELETE /admin/simulated/comments` - 清除模拟评论

#### 审计日志
- `GET /admin/audit-logs` - 操作日志

### 3. 前端管理界面

访问地址: `/admin`

#### 功能模块

1. **概览面板**
   - 内容统计卡片（待审核作品、讨论、评论）
   - 审核队列预览
   - 快捷操作入口

2. **内容管理**
   - 作品/讨论列表
   - 状态筛选和搜索
   - 批量状态更新
   - 内容编辑弹窗

3. **评论管理**
   - 评论列表（支持状态、来源筛选）
   - 批量操作（通过/拒绝/删除）
   - 一键生成模拟评论
   - 清除模拟评论

4. **用户管理**
   - 用户列表（真实/模拟筛选）
   - 生成模拟用户（指定数量）
   - 查看用户活跃度

### 4. 模拟数据系统

#### 用户角色画像
- **独立开发者 (indie_hacker)**: 关注技术实现、MVP验证
- **产品经理 (product_manager)**: 关注用户需求、商业模式
- **设计师 (designer)**: 关注体验、视觉、交互
- **开发者 (developer)**: 关注技术细节、性能
- **创业者 (startup_founder)**: 关注PMF、融资、商业化
- **科技爱好者 (tech_enthusiast)**: 早期采用者、愿意尝鲜
- **副业爱好者 (side_project_lover)**: 关注ROI、时间成本
- **效率控 (productivity_ninja)**: 关注工作流、自动化

#### 评论生成逻辑
- 根据用户画像生成符合角色的评论前缀/后缀
- 模板变量自动填充（产品特性、设计评价、风险等）
- 随机添加emoji增加真实感
- 评论内容针对作品/讨论类型有不同模板

## 使用指南

### 1. 首次使用

1. 访问 `/admin`
2. 输入 Admin Token 登录
3. 进入概览面板查看统计

### 2. 生成模拟数据

```
1. 进入「用户管理」
2. 点击「生成模拟用户」，输入数量（建议10-20个）
3. 进入「评论管理」
4. 点击「生成模拟评论」
```

### 3. 内容审核流程

```
1. 在「概览」查看待审核数量
2. 进入「内容管理」筛选待审核内容
3. 单个编辑或批量修改状态
4. 所有操作自动记录审计日志
```

### 4. 评论审核

```
1. 进入「评论管理」
2. 筛选待审核评论
3. 单条或批量操作
4. 模拟评论会有机器人图标标记
```

## 技术说明

### API Token 设置

前端通过 `localStorage` 存储 adminToken，在 API 请求中通过 Header `X-Admin-Token` 传递。

### 模拟数据识别

- 用户: `isSimulated = true`
- 评论: `isSimulated = true`
- 界面显示: 蓝色机器人图标 + "模拟"标签

### 权限控制

当前使用简单的 Token 验证，生产环境建议增加:
- 管理员角色分级
- 操作频率限制
- 敏感操作二次确认

## 文件结构

```
apps/api/src/modules/admin/
├── admin.controller.ts          # API 路由
├── admin.service.ts             # 基础服务
├── admin-content.service.ts     # 内容管理服务
├── admin-user.service.ts        # 用户管理服务
├── admin-comment-seed.service.ts # 评论生成服务
└── dto/
    └── content-moderation.dto.ts # DTO 定义

apps/web/src/components/admin/
├── index.tsx                    # 主入口
├── Dashboard.tsx                # 概览面板
├── ContentManager.tsx           # 内容管理
├── CommentManager.tsx           # 评论管理
└── UserManager.tsx              # 用户管理

apps/web/src/lib/
└── admin-api.ts                 # Admin API 客户端
```
