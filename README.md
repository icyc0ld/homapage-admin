# Homepage Admin

一个为 [gethomepage/homepage](https://github.com/gethomepage/homepage) 设计的独立、轻量、前后端分离的管理后台。可连接部署在任意 ARM/x64 服务器 Docker 中的 homepage 容器。

## 特性

- 前后端分离，可合并或分开部署
- 原生 HTML/JS 前端，无构建步骤
- Node.js + Express 后端，轻量快速
- JSON 文件存储，无需数据库，便于迁移
- 多架构 Docker 镜像（linux/amd64、linux/arm64）
- v3 新增：图形化编辑 homepage 设置、信息小部件、服务分组、书签与布局
- v3 新增：从目标 homepage 导入现有配置，导出生成 YAML 文件

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
│   │   ├── routes/
│   │   │   ├── servers.js     # 服务器 API
│   │   │   └── configs.js     # 配置编辑与导出 API
│   │   ├── services/
│   │   │   ├── homepage.js    # 连接检测
│   │   │   └── homepageConfig.js  # 配置导入/导出
│   │   └── store/
│   │       ├── jsonStore.js   # 服务器列表持久化
│   │       └── configStore.js # 配置持久化
│   ├── data/                  # JSON 数据持久化
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── js/config-editor.js
├── Dockerfile
└── docker-compose.yml
```

## v3 配置编辑器

1. 在服务器列表中点击某台服务器的「配置」按钮。
2. 在设置页填写全局设置（标题、主题、配色、背景等）。
3. 在小部件页添加/编辑信息小部件（resources、search、datetime 等）。
4. 在服务页添加分组和服务卡片，并为其选择服务 widget。
5. 在书签页添加书签分组和书签项。
6. 在布局页为每个分组设置显示样式、列数、Tab 等。
7. 点击「保存配置」将配置保存在 admin 后端。
8. 点击「导出 YAML」下载 `settings.yaml`、`widgets.yaml`、`services.yaml`、`bookmarks.yaml`，替换目标 homepage 的 `config` 目录下对应文件并刷新页面即可生效。

## 后续可扩展

- 通过挂载卷或 SSH 直接推送配置到 remote homepage
- 多服务器分组与标签
- 定时轮询与状态告警
- 用户认证

## 多架构构建

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t yourname/homepage-admin:latest --push .
```
