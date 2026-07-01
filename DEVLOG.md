# homepage-admin 开发日志

为 [gethomepage/homepage](https://github.com/gethomepage/homepage) 构建的独立、轻量、前后端分离管理后台。

---

## v1 — 基础框架与服务器管理

**时间：** 2026-07-01

**目标：** 搭建一个可连接任意 ARM/x64 Docker 中 homepage 容器的轻量管理后台。

**完成功能：**
- 服务器列表的增删改查（JSON 文件持久化，无需数据库）
- 通过目标 homepage 的 `/api/healthcheck` 端点检测连接状态
- 识别 `HOMEPAGE_ALLOWED_HOSTS` 主机头校验失败的情况
- 原生 HTML/CSS/JS 前端，无构建步骤
- Node.js + Express 后端，ES Module
- 多架构 Dockerfile（linux/amd64、linux/arm64）
- GitHub Actions 自动构建并推送镜像到 GHCR

**镜像：** `ghcr.io/icyc0ld/homapage-admin:test-v1`

---

## v2 — 前端美化与 ARM NAS 部署

**时间：** 2026-07-01

**目标：** 美化前端界面，参考 hmlab.tech 风格，并将 v2 部署到家用 ARM NAS。

### 前端改动

- 采用**深色玻璃拟态（Dark Glassmorphism）**风格
- 新增 **Canvas 粒子背景**：粒子缓慢漂移、近距离连线、鼠标靠近时轻微吸引
- 新增**仪表盘概览**：服务器总数 / 在线 / 离线统计卡片
- 将添加/编辑表单改为**模态弹窗**，减少页面跳动
- 用 **Toast 通知**替代原生 `alert()`
- 按钮添加 loading 状态与悬停动效
- 优化响应式布局与可访问性（aria、ESC 关闭模态等）

### 新增/修改文件

- `frontend/js/particles.js`（新增）
- `frontend/css/style.css`（重写）
- `frontend/index.html`（重构）
- `frontend/js/app.js`（重构）
- `deploy-arm1.sh`（新增，ARM 服务器一键部署脚本）
- `.deploy-askpass.sh`（新增，SSH 密码自动输入助手）
- `.env.deploy`（新增，存储部署密码，已加入 `.gitignore`）
- `~/.ssh/config`（本地配置，Host 别名 `arm1`）

### 部署信息

- **服务器：** OESPlus-NAS（ARM，192.168.100.101:220）
- **访问地址：** `http://192.168.100.101:7666`
- **数据挂载：** `/vol2/1000/docker/hp-admin` → `/app/backend/data`
- **容器名：** `hp-admin`
- **镜像：** `ghcr.io/icyc0ld/homapage-admin:test-v2`

### 踩坑记录

1. **GHCR 私有仓库拉取失败**
   - 现象：`docker pull ghcr.io/...` 提示需要登录或 manifest unknown
   - 解决：在 ARM 服务器上执行 `docker login ghcr.io -u icyc0ld`，使用具有 `repo` 和 `read:packages` 权限的 Personal Access Token

2. **镜像代理不能当镜像名前缀用**
   - 现象：`docker pull mh5tjqtuhnnixf-ghcr.xuanyuan.run/icyc0ld/homapage-admin:test-v2` 报 `manifest unknown`
   - 解决：将 `https://mh5tjqtuhnnixf-ghcr.xuanyuan.run` 写入 `/etc/docker/daemon.json` 的 `registry-mirrors`，然后重启 Docker

3. **Chrome 拦截 6666 端口**
   - 现象：浏览器访问 `http://192.168.100.101:6666` 报错 `ERR_UNSAFE_PORT`
   - 原因：Chrome 将 6666 列为 IRC 相关不安全端口
   - 解决：将容器暴露端口改为 `7666`

4. **ARM 服务器 admin 用户无家目录**
   - 现象：`ssh-copy-id` 无法创建 `~/.ssh/authorized_keys`
   - 解决：本地使用 `SSH_ASKPASS` 机制，从 `.env.deploy` 读取密码自动输入

### 镜像

- `ghcr.io/icyc0ld/homapage-admin:test-v2`（linux/amd64、linux/arm64）

---

## v3 — 图形化 Homepage 配置编辑器

**时间：** 2026-07-01

**目标：** 让管理员可以通过 Web UI 图形化地编辑每台 homepage 实例的布局、小部件和全局设置。

### 后端改动

- 新增 `backend/src/store/configStore.js`：按 `serverId` 持久化 `configs.json`
- 新增 `backend/src/services/homepageConfig.js`：
  - 从目标 homepage 的 `/api/services`、`/api/bookmarks`、`/api/widgets` 拉取现有配置
  - 将内部 JSON 配置导出为 homepage 兼容的 YAML
- 新增 `backend/src/routes/configs.js`：
  - `GET /api/servers/:id/config` 读取配置
  - `PUT /api/servers/:id/config` 保存配置
  - `POST /api/servers/:id/config/import` 从目标 homepage 导入
  - `GET /api/servers/:id/config/export/:file` 下载 YAML
- `backend/src/index.js` 挂载配置路由；删除服务器时级联删除其配置
- `backend/package.json` 新增 `js-yaml` 依赖

### 前端改动

- `frontend/index.html`：新增「配置」按钮与全页配置编辑器视图
- `frontend/js/config-editor.js`（新增）：
  - 设置页：标题、主题、配色、背景、语言、链接打开方式等
  - 小部件页：resources、search、datetime、greeting、logo、天气等常用 info widget
  - 服务页：分组与服务的增删改，支持服务 widget
  - 书签页：书签分组与书签项的增删改
  - 布局页：为每个分组设置 style、columns、tab、header、icon
  - 从目标 homepage 导入配置
  - 导出 4 个 YAML 文件
- `frontend/css/style.css`：新增编辑器布局、Tab 导航、可折叠分组、表单字段等样式
- `frontend/js/app.js`：服务器卡片增加「配置」入口

### 部署信息

- 与 v2 共用同一数据卷，新增 `configs.json` 会自动创建在 `/app/backend/data`
- 镜像：`ghcr.io/icyc0ld/homapage-admin:test-v3`（linux/amd64、linux/arm64）

### 使用方式

1. 在服务器列表点击「配置」。
2. 如需基于现有配置修改，点击「从服务器导入」。
3. 在设置 / 小部件 / 服务 / 书签 / 布局页编辑。
4. 点击「保存配置」。
5. 点击「导出 YAML」下载 4 个 YAML 文件，替换目标 homepage `config` 目录下对应文件并刷新页面。

---

## 后续可扩展

- 通过挂载卷或 SSH 直接推送配置到 remote homepage
- 多服务器分组与标签
- 定时轮询与状态告警
- 用户认证
