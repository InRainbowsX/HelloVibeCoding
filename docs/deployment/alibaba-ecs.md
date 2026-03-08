# 阿里云 ECS 部署指南

适用于当前单机部署方案：

- 前端：Vite 构建后的静态资源
- 后端：NestJS API
- 数据库：PostgreSQL（Docker 容器）
- 反向代理：Nginx

## 1. ECS 基础准备

建议配置：

- 系统：Alibaba Cloud Linux 3 / Ubuntu 22.04
- CPU / 内存：`2C4G` 起步
- 磁盘：`40GB` 起步

安全组至少放行：

- `22`：SSH
- `80`：HTTP
- `443`：HTTPS

如果临时直连 API 调试，可短期开：

- `3001`

生产环境不建议长期暴露 `3001`，应只通过 Nginx 反代访问。

## 2. 安装运行时

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git curl
sudo systemctl enable docker
sudo systemctl start docker
```

验证：

```bash
docker --version
docker compose version
```

## 3. 拉取代码并准备目录

```bash
sudo mkdir -p /opt/hellovibecoding
sudo chown -R $USER:$USER /opt/hellovibecoding
cd /opt/hellovibecoding
git clone <your-repo-url> .
```

## 4. 配置环境变量

在 ECS 上使用专用环境文件：

```bash
cp docker/.env.ecs.example docker/.env.ecs
```

至少确认以下变量：

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/hellovibecoding
PORT=3001
NODE_ENV=production
VITE_API_BASE_URL=/api/v1
ADMIN_TOKEN=change-this-admin-token
```

## 5. 安装依赖并构建

```bash
corepack enable
corepack pnpm install
corepack pnpm -C apps/web build
```

## 6. 启动数据库、API 与 Nginx

```bash
docker compose -f docker/docker-compose.ecs.yml up -d --build
```

确认数据库就绪：

```bash
docker compose -f docker/docker-compose.ecs.yml ps
docker exec -it hvc-db pg_isready -U postgres
```

## 7. 执行数据库迁移与种子

首次部署：

```bash
set -a
source docker/.env.ecs
set +a
corepack pnpm -C apps/api prisma:migrate
corepack pnpm -C apps/api prisma:seed
```

后续更新：

```bash
set -a
source docker/.env.ecs
set +a
corepack pnpm -C apps/api prisma:migrate
```

## 8. 一键部署脚本（推荐）

仓库已提供：

- [scripts/deploy-ecs.sh](/Users/qitmac001629/Documents/p/HelloVibeCoding/scripts/deploy-ecs.sh)

执行前先确认：

- `docker/.env.ecs` 已填写
- 域名已解析到 ECS

执行：

```bash
bash scripts/deploy-ecs.sh
```

## 9. Nginx 反向代理

目标流量分配：

- `/` -> 前端静态资源
- `/api/` -> `http://api:3001/api/`
- `/uploads/` -> `http://api:3001/uploads/`

ECS 专用 Nginx 配置文件：

- [docker/nginx.ecs.conf](/Users/qitmac001629/Documents/p/HelloVibeCoding/docker/nginx.ecs.conf)

这一步很关键：如果没有 `/uploads/` 反代，后台上传的截图在生产域名下会直接 404。

## 10. 域名与 HTTPS

当前线上推荐做法（适配容器 Nginx）：

```bash
sudo apt install -y certbot
```

1. 先确认域名解析：

- `hellovibecoding.cn -> ECS 公网 IP`
- `www.hellovibecoding.cn -> ECS 公网 IP`

2. 暂停容器 Nginx，使用 standalone 模式签发：

```bash
docker stop hvc-nginx
sudo certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email \
  --cert-name www.hellovibecoding.cn \
  --expand \
  -d www.hellovibecoding.cn \
  -d hellovibecoding.cn
```

3. 在 `docker/docker-compose.ecs.yml` 中挂载证书目录：

```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
ports:
  - "80:80"
  - "443:443"
```

4. 在 `docker/nginx.ecs.conf` 中增加：

- `80 -> https://www.hellovibecoding.cn`
- `443 ssl`
- `hellovibecoding.cn -> https://www.hellovibecoding.cn`

5. 重启 Nginx：

```bash
docker compose -f docker/docker-compose.ecs.yml up -d nginx
```

## 11. 自动续签

如果证书使用 `standalone` 模式签发，续签时要临时释放 `80` 端口。

在 `/etc/letsencrypt/renewal/www.hellovibecoding.cn.conf` 里加入：

```ini
pre_hook = sh -c "docker stop hvc-nginx >/dev/null 2>&1 || true"
post_hook = sh -c "cd /opt/hellovibecoding && docker compose -f docker/docker-compose.ecs.yml up -d nginx >/dev/null 2>&1"
```

验证：

```bash
sudo certbot renew --dry-run
```

## 12. Admin 访问

当前版本 `admin` 有最小 token 鉴权。

1. 先在 `docker/.env.ecs` 中设置：

```env
ADMIN_TOKEN=change-this-admin-token
```

2. 重建 API：

```bash
docker compose -f docker/docker-compose.ecs.yml up -d --build api
```

3. 打开后台：

- `https://www.hellovibecoding.cn/admin`

4. 在页面顶部输入 `Admin Token` 后保存，才可读写后台数据。

## 13. 上线后检查

验证接口：

```bash
curl http://127.0.0.1/api/v1/health
curl https://www.hellovibecoding.cn/api/v1/health
```

验证页面：

- 打开首页
- 打开产品详情
- 打开讨论区
- 提交一条讨论

## 14. 当前方案的已知限制

- PostgreSQL 仍在单机容器内，适合 MVP，不适合高可靠生产
- `admin` 只是最小 token 鉴权，不是正式登录体系
- 还没有日志采集、监控、自动备份

如果要更稳：

- PostgreSQL 迁移到阿里云 RDS
- 再决定是否改成 `systemd` 常驻（当前版本已可直接容器化）
- 再补监控、备份、SSL 续签
