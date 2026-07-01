# Homepage Admin

一个为 [gethomepage/homepage](https://github.com/gethomepage/homepage) 设计的独立、轻量、前后端分离的管理后台。可连接部署在任意 ARM/x64 服务器 Docker 中的 homepage 容器。

## 特性

- 前后端分离，可合并或分开部署
- 原生 HTML/JS 前端，无构建步骤
- Node.js + Express 后端，轻量快速
- JSON 文件存储，无需数据库，便于迁移
- 多架构 Docker 镜像（linux/amd64、linux/arm64）
- 第一阶段功能：管理服务器列表 + 连接检测

## 快速开始

### Docker Compose（推荐）

```bash
cd homepage-admin
docker compose up -d
```

打开浏览器访问 `http://localhost:8080`。

### 本地开发

```bash
cd homepage-admin/backend
cp .env.example .env
npm install
npm run dev
```

前端为静态文件，由后端自动托管在 `http://localhost:8080`。

## 连接检测说明

管理后台通过访问目标 homepage 的 `/api/healthcheck` 端点来判断是否在线。

如果目标 homepage 设置了 `HOMEPAGE_ALLOWED_HOSTS` 环境变量，需要将管理后台的访问地址加入允许列表，或设置为 `*`。

例如：

```yaml
environment:
  - HOMEPAGE_ALLOWED_HOSTS=homepage-admin.example.com,192.168.1.5:8080
```

## 目录结构

```
homepage-admin/
├── backend/
│   ├── src/
│   │   ├── index.js           # Express 入口
│   │   ├── routes/servers.js  # 服务器 API
│   │   ├── services/homepage.js
│   │   └── store/jsonStore.js
│   ├── data/                  # JSON 数据持久化
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── Dockerfile
└── docker-compose.yml
```

## 后续可扩展

- 远程读取/编辑 homepage 配置文件
- 多服务器分组与标签
- 定时轮询与状态告警
- 用户认证

## 多架构构建

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t yourname/homepage-admin:latest --push .
```
