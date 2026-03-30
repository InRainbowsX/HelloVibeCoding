# 阿里云 ECS 部署指南

当前线上目标：

- 域名：[https://www.hellovibecoding.cn](https://www.hellovibecoding.cn)
- 部署方式：单台 ECS + Docker Compose
- 运行结构：
  - `hvc-nginx`：前端静态资源 + HTTPS + 反向代理
  - `hvc-api`：NestJS API
  - `hvc-db`：PostgreSQL

这份文档按当前已经验证可用的方式整理，只描述真实可执行路径。

## 1. 服务器准备

建议配置：

- 系统：Ubuntu 24.04 / Ubuntu 22.04
- 规格：`2C4G` 起步
- 磁盘：`40GB` 起步

安全组放行：

- `22`
- `80`
- `443`

生产环境不需要放行：

- `3001`
- `5432`

数据库通过 Docker 内网给 API 用，本地工具通过 SSH 隧道访问。

## 2. 安装 Docker

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin curl git
sudo systemctl enable docker
sudo systemctl start docker
docker --version
docker compose version
```

## 3. 项目目录

线上目录约定：

```bash
/opt/hellovibecoding
```

常用子目录：

- `docker/`
- `uploads/`
- 临时同步目录：`/opt/hellovibecoding.tmp-sync`

初始化示例：

```bash
sudo mkdir -p /opt/hellovibecoding /opt/hellovibecoding.tmp-sync
sudo chown -R $USER:$USER /opt/hellovibecoding /opt/hellovibecoding.tmp-sync
```

## 4. 环境变量

线上环境文件：

```bash
cp docker/.env.ecs.example docker/.env.ecs
```

当前可用模板：

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/hellovibecoding
PORT=3001
NODE_ENV=production
VITE_API_BASE_URL=https://www.hellovibecoding.cn/api/v1
ADMIN_TOKEN=change-this-admin-token
JWT_SECRET=change-this-long-random-jwt-secret
```

关键点：

- `DATABASE_URL` 必须指向 `db:5432`
- 不要把本地 `.env` 打进 Docker 镜像
- 前端线上 API 基地址使用正式域名
- `JWT_SECRET` 是生产环境必填项；未配置时，API 会在启动阶段直接退出

## 5. Docker Compose 文件

当前使用这两个文件：

- HTTP：[docker/docker-compose.ecs.yml](/Users/qitmac001629/Documents/p/HelloVibeCoding/docker/docker-compose.ecs.yml)
- HTTPS：[docker/docker-compose.ecs.https.yml](/Users/qitmac001629/Documents/p/HelloVibeCoding/docker/docker-compose.ecs.https.yml)

当前 HTTPS 版的关键行为：

- `db` 只绑定 `127.0.0.1:5432:5432`
- `api` 使用 `hvc-api:deploy`
- `nginx` 使用 `hvc-nginx:deploy`
- `80/443` 由 `nginx` 对外暴露

这意味着：

- ECS 自己能访问数据库本机端口
- 外网不能直接扫到 PostgreSQL
- DBeaver 可以通过 SSH Tunnel 访问

## 6. 纯 Docker 发布

当前推荐方式不是在 ECS 宿主机安装 Node / pnpm 后构建，而是：

1. 本地构建发布镜像
2. 导出镜像包
3. 上传到 ECS
4. 在 ECS 上 `docker load`
5. `docker compose up -d --no-build`

### 本地构建 amd64 镜像

前端：

```bash
docker buildx build \
  --platform linux/amd64 \
  -t hvc-nginx:deploy \
  -f docker/nginx.Dockerfile \
  --load .
```

后端：

```bash
docker buildx build \
  --platform linux/amd64 \
  -t hvc-api:deploy \
  -f apps/api/Dockerfile.mirror \
  --load .
```

### 本地导出镜像

```bash
docker save hvc-api:deploy hvc-nginx:deploy | gzip > /tmp/hvc-deploy-images-amd64.tar.gz
```

### 上传到 ECS

```bash
scp /tmp/hvc-deploy-images-amd64.tar.gz root@<ECS_IP>:/opt/hellovibecoding.tmp-sync/
scp docker/docker-compose.ecs.yml docker/docker-compose.ecs.https.yml root@<ECS_IP>:/opt/hellovibecoding.tmp-sync/
```

### ECS 上加载并启动

```bash
cd /opt/hellovibecoding
cp /opt/hellovibecoding.tmp-sync/docker-compose.ecs.yml docker/docker-compose.ecs.yml
cp /opt/hellovibecoding.tmp-sync/docker-compose.ecs.https.yml docker/docker-compose.ecs.https.yml

cd docker
docker compose -f docker-compose.ecs.https.yml down
zcat /opt/hellovibecoding.tmp-sync/hvc-deploy-images-amd64.tar.gz | docker load
docker compose -f docker-compose.ecs.https.yml up -d --no-build
docker compose -f docker-compose.ecs.https.yml ps
```

### 验证镜像架构

```bash
docker image inspect hvc-api:deploy --format '{{.Architecture}} {{.Os}}'
docker image inspect hvc-nginx:deploy --format '{{.Architecture}} {{.Os}}'
```

期望结果：

```bash
amd64 linux
```

## 7. 数据库同步与 Seed

容器内不要依赖 `pnpm`，直接调用已安装的二进制：

```bash
docker exec hvc-api sh -lc 'apps/api/node_modules/.bin/prisma db push --schema apps/api/src/prisma/schema.prisma'
docker exec hvc-api sh -lc 'apps/api/node_modules/.bin/tsx apps/api/src/prisma/seed.ts'
```

当前线上已经验证这套方式可用。

## 8. HTTPS 与域名

域名策略：

- `hellovibecoding.cn` 重定向到 `www`
- 主站使用 `https://www.hellovibecoding.cn`

证书目录约定：

```bash
/etc/letsencrypt/live/www.hellovibecoding.cn
```

签发示例：

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

Nginx 配置文件：

- [docker/nginx.ecs.conf](/Users/qitmac001629/Documents/p/HelloVibeCoding/docker/nginx.ecs.conf)

## 9. 一键脚本

仓库里有部署脚本：

- [scripts/deploy-ecs.sh](/Users/qitmac001629/Documents/p/HelloVibeCoding/scripts/deploy-ecs.sh)

它当前做的事情：

- 选择 HTTP / HTTPS compose
- 启动容器
- 等待 API 容器
- 在容器里执行 `db push`
- 在容器里执行 seed

注意：

- 这个脚本适合在 ECS 宿主机本地执行
- 如果你走的是“本地 build -> 上传镜像 -> ECS load”模式，仍然建议用上面的手动命令

## 10. DBeaver 连接远程数据库

推荐方式：`SSH Tunnel`

原因：

- PostgreSQL 没有暴露公网
- 只绑定在 ECS 本机 `127.0.0.1:5432`
- 这样风险更低

### DBeaver 连接参数

`Main`：

- Host：`127.0.0.1`
- Port：`5432`
- Database：`hellovibecoding`
- Username：`postgres`
- Password：`postgres`

`SSH`：

- Use SSH Tunnel：开启
- Host/IP：你的 ECS 公网 IP
- Port：`22`
- User：`root`
- Authentication：`Password` 或私钥

连接路径是：

```text
本地 DBeaver -> SSH 到 ECS -> ECS 本机 127.0.0.1:5432 -> PostgreSQL 容器
```

## 11. 健康检查

推荐检查：

```bash
docker compose -f docker/docker-compose.ecs.https.yml ps
docker exec hvc-api wget -qO- http://127.0.0.1:3001/api/v1/health
curl -s https://www.hellovibecoding.cn/api/v1/health
curl -I -s https://www.hellovibecoding.cn | head
```

## 12. 常见故障

### 1. API 容器一直重启

先看日志：

```bash
docker logs --tail=200 hvc-api
```

这次实际遇到过两个问题：

- 镜像架构错误：本地 arm64 镜像被部署到 amd64 ECS
- Docker 上下文混入本地 `.env`，导致 `DATABASE_URL` 错误地指向 `localhost:5432`

修复方式：

- 强制构建 `linux/amd64`
- 用 `.dockerignore` 排除 `.env` 和 `**/.env`

### 2. Nginx 重启并提示 `host not found in upstream "api"`

原因通常不是 Nginx 配置本身，而是：

- `api` 容器还没正常起来

处理方式：

1. 先修好 `hvc-api`
2. 再看 `docker compose ps`
3. 必要时重启 nginx：

```bash
docker compose -f docker-compose.ecs.https.yml up -d --no-build nginx
```

### 3. 容器里找不到 `pnpm`

当前运行镜像不依赖 `pnpm`，直接用：

- `apps/api/node_modules/.bin/prisma`
- `apps/api/node_modules/.bin/tsx`

### 4. DBeaver 连不上

优先检查：

1. `hvc-db` 是否运行
2. ECS 上是否有 `127.0.0.1:5432->5432/tcp`
3. DBeaver 是否开启了 SSH Tunnel

## 13. 当前线上基线

当前已验证：

- 站点可访问：[https://www.hellovibecoding.cn](https://www.hellovibecoding.cn)
- API 健康检查可访问：[https://www.hellovibecoding.cn/api/v1/health](https://www.hellovibecoding.cn/api/v1/health)
- PostgreSQL 可通过 SSH 隧道接入

这份文档后续只按真实线上做法更新，不保留已经失效的旧流程。
