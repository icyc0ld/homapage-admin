const CONFIG_API_BASE = "/api";

const $c = (selector) => document.querySelector(selector);
const $$c = (selector) => document.querySelectorAll(selector);

let currentServer = null;
let currentConfig = null;

/* ---------------- Helpers ---------------- */

async function configApi(path, options = {}) {
  const url = `${CONFIG_API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `请求失败：HTTP ${res.status}`);
  }
  return data;
}

function escapeHtmlConfig(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showConfigToast(message, type = "info") {
  const container = $c("#toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3500);
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

/* ---------------- Widget Schemas ---------------- */

const INFO_WIDGET_SCHEMAS = {
  resources: [
    { key: "cpu", label: "CPU", type: "checkbox" },
    { key: "memory", label: "内存", type: "checkbox" },
    { key: "disk", label: "磁盘路径", type: "text" },
    { key: "cputemp", label: "CPU 温度", type: "text" },
    { key: "uptime", label: "运行时间", type: "checkbox" },
    { key: "expanded", label: "默认展开", type: "checkbox" },
  ],
  search: [
    { key: "provider", label: "搜索引擎", type: "select", options: ["duckduckgo", "google", "bing", "baidu", "brave", "custom"] },
    { key: "target", label: "打开方式", type: "select", options: ["_blank", "_self", "_top"] },
    { key: "suggestionUrl", label: "建议 URL", type: "text" },
    { key: "showSearchSuggestions", label: "显示搜索建议", type: "checkbox" },
  ],
  datetime: [
    { key: "format", label: "时间格式", type: "text" },
    { key: "textSize", label: "字体大小", type: "text" },
  ],
  greeting: [
    { key: "text_size", label: "字体大小", type: "text" },
    { key: "text", label: "问候语", type: "text" },
  ],
  logo: [
    { key: "href", label: "链接", type: "text" },
    { key: "target", label: "打开方式", type: "select", options: ["_blank", "_self", "_top"] },
  ],
  openweathermap: [
    { key: "latitude", label: "纬度", type: "text" },
    { key: "longitude", label: "经度", type: "text" },
    { key: "provider", label: "Provider", type: "text" },
    { key: "units", label: "单位", type: "select", options: ["metric", "imperial", "kelvin"] },
    { key: "cache", label: "缓存时间（秒）", type: "number" },
  ],
  openmeteo: [
    { key: "latitude", label: "纬度", type: "text" },
    { key: "longitude", label: "经度", type: "text" },
    { key: "units", label: "单位", type: "select", options: ["metric", "imperial"] },
    { key: "cache", label: "缓存时间（秒）", type: "number" },
  ],
};

const SERVICE_WIDGET_SCHEMAS = {
  emby: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Key", type: "text" },
  ],
  jellyfin: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Key", type: "text" },
  ],
  plex: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Token", type: "text" },
  ],
  sonarr: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Key", type: "text" },
  ],
  radarr: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Key", type: "text" },
  ],
  lidarr: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Key", type: "text" },
  ],
  readarr: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Key", type: "text" },
  ],
  prowlarr: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Key", type: "text" },
  ],
  qbittorrent: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "username", label: "用户名", type: "text" },
    { key: "password", label: "密码", type: "text" },
  ],
  transmission: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "username", label: "用户名", type: "text" },
    { key: "password", label: "密码", type: "text" },
  ],
  deluge: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "password", label: "密码", type: "text" },
  ],
  pihole: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Token", type: "text" },
  ],
  "adguard-home": [
    { key: "url", label: "服务地址", type: "text" },
    { key: "username", label: "用户名", type: "text" },
    { key: "password", label: "密码", type: "text" },
  ],
  uptimekuma: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "slug", label: "状态页 Slug", type: "text" },
    { key: "key", label: "API Key", type: "text" },
  ],
  healthchecks: [
    { key: "url", label: "服务地址", type: "text" },
    { key: "key", label: "API Key", type: "text" },
  ],
  customapi: [
    { key: "url", label: "请求地址", type: "text" },
    { key: "method", label: "请求方法", type: "select", options: ["GET", "POST"] },
    { key: "mappings", label: "字段映射（JSON）", type: "textarea" },
  ],
};

const WIDGET_TYPE_OPTIONS = Object.keys(INFO_WIDGET_SCHEMAS)
  .map((type) => `<option value="${type}">${type}</option>`)
  .join("");

const SERVICE_WIDGET_TYPE_OPTIONS = Object.keys(SERVICE_WIDGET_SCHEMAS)
  .map((type) => `<option value="${type}">${type}</option>`)
  .join("");

/* ---------------- Core Functions ---------------- */

async function openConfigEditor(server) {
  currentServer = server;
  $c("#config-server-name").textContent = `${server.name} · 配置`;
  $c("#app").classList.add("hidden");
  $c("#config-editor-view").classList.remove("hidden");

  try {
    const { data } = await configApi(`/servers/${server.id}/config`);
    currentConfig = data;
  } catch (err) {
    showConfigToast(err.message, "error");
    currentConfig = { settings: {}, widgets: [], services: [], bookmarks: [] };
  }

  renderAllPanels();
}

function closeConfigEditor() {
  currentServer = null;
  currentConfig = null;
  $c("#config-editor-view").classList.add("hidden");
  $c("#app").classList.remove("hidden");
}

window.openConfigEditor = openConfigEditor;
window.closeConfigEditor = closeConfigEditor;

/* ---------------- Rendering ---------------- */

function renderAllPanels() {
  renderSettings();
  renderWidgets();
  renderServices();
  renderBookmarks();
  renderLayout();
}

/* Settings Panel */

function renderSettings() {
  const settings = currentConfig.settings || {};
  const layout = settings.layout || {};
  const form = $c("#settings-form");

  form.innerHTML = `
    <div class="form-group">
      <label for="st-title">页面标题</label>
      <input type="text" id="st-title" value="${escapeHtmlConfig(settings.title || "")}" placeholder="My Awesome Homepage" />
    </div>
    <div class="form-group">
      <label for="st-description">页面描述</label>
      <input type="text" id="st-description" value="${escapeHtmlConfig(settings.description || "")}" placeholder="A description" />
    </div>
    <div class="form-group">
      <label for="st-theme">主题</label>
      <select id="st-theme">
        <option value="">跟随系统</option>
        <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>深色</option>
        <option value="light" ${settings.theme === "light" ? "selected" : ""}>浅色</option>
      </select>
    </div>
    <div class="form-group">
      <label for="st-color">主题色</label>
      <select id="st-color">
        ${["slate", "gray", "zinc", "neutral", "stone", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose", "red", "white"]
          .map((c) => `<option value="${c}" ${settings.color === c ? "selected" : ""}>${c}</option>`)
          .join("")}
      </select>
    </div>
    <div class="form-group">
      <label for="st-background">背景图片 URL</label>
      <input type="text" id="st-background" value="${escapeHtmlConfig(typeof settings.background === "string" ? settings.background : settings.background?.image || "")}" placeholder="/images/background.png 或 https://..." />
    </div>
    <div class="form-group">
      <label for="st-favicon">Favicon URL</label>
      <input type="text" id="st-favicon" value="${escapeHtmlConfig(settings.favicon || "")}" placeholder="https://..." />
    </div>
    <div class="form-group">
      <label for="st-language">语言</label>
      <input type="text" id="st-language" value="${escapeHtmlConfig(settings.language || "")}" placeholder="zh-CN" />
    </div>
    <div class="form-group">
      <label for="st-target">链接打开方式</label>
      <select id="st-target">
        <option value="">默认</option>
        <option value="_blank" ${settings.target === "_blank" ? "selected" : ""}>新标签页</option>
        <option value="_self" ${settings.target === "_self" ? "selected" : ""}>当前页</option>
        <option value="_top" ${settings.target === "_top" ? "selected" : ""}>顶层窗口</option>
      </select>
    </div>
    <div class="form-group">
      <label for="st-headerStyle">标题样式</label>
      <select id="st-headerStyle">
        <option value="">默认</option>
        <option value="underlined" ${settings.headerStyle === "underlined" ? "selected" : ""}>underlined</option>
        <option value="boxed" ${settings.headerStyle === "boxed" ? "selected" : ""}>boxed</option>
        <option value="clean" ${settings.headerStyle === "clean" ? "selected" : ""}>clean</option>
        <option value="boxedWidgets" ${settings.headerStyle === "boxedWidgets" ? "selected" : ""}>boxedWidgets</option>
      </select>
    </div>
    <div class="form-group">
      <label for="st-fullWidth">全宽布局</label>
      <select id="st-fullWidth">
        <option value="">默认</option>
        <option value="true" ${settings.fullWidth === true ? "selected" : ""}>开启</option>
      </select>
    </div>
    <div class="form-group">
      <label for="st-disableCollapse">禁用折叠</label>
      <select id="st-disableCollapse">
        <option value="">默认</option>
        <option value="true" ${settings.disableCollapse === true ? "selected" : ""}>开启</option>
      </select>
    </div>
  `;
}

function collectSettings() {
  const settings = {};
  const title = $c("#st-title").value.trim();
  const description = $c("#st-description").value.trim();
  const theme = $c("#st-theme").value;
  const color = $c("#st-color").value;
  const background = $c("#st-background").value.trim();
  const favicon = $c("#st-favicon").value.trim();
  const language = $c("#st-language").value.trim();
  const target = $c("#st-target").value;
  const headerStyle = $c("#st-headerStyle").value;
  const fullWidth = $c("#st-fullWidth").value;
  const disableCollapse = $c("#st-disableCollapse").value;

  if (title) settings.title = title;
  if (description) settings.description = description;
  if (theme) settings.theme = theme;
  if (color) settings.color = color;
  if (background) settings.background = background;
  if (favicon) settings.favicon = favicon;
  if (language) settings.language = language;
  if (target) settings.target = target;
  if (headerStyle) settings.headerStyle = headerStyle;
  if (fullWidth) settings.fullWidth = true;
  if (disableCollapse) settings.disableCollapse = true;

  // Preserve layout
  settings.layout = currentConfig.settings?.layout || {};

  return settings;
}

/* Widgets Panel */

function renderWidgets() {
  const list = $c("#widgets-list");
  const widgets = currentConfig.widgets || [];

  if (widgets.length === 0) {
    list.innerHTML = `<div class="empty-state"><p>暂无信息小部件，点击右上角添加</p></div>`;
    return;
  }

  list.innerHTML = widgets
    .map((widget, index) => {
      const type = widget.type || "resources";
      const schema = INFO_WIDGET_SCHEMAS[type] || [];
      return `
        <div class="config-item" data-index="${index}">
          <div class="config-item-header">
            <select class="widget-type-select" data-index="${index}">${WIDGET_TYPE_OPTIONS}</select>
            <div class="config-item-actions">
              <button class="btn btn-danger btn-small btn-remove-widget" data-index="${index}">删除</button>
            </div>
          </div>
          <div class="config-fields">${renderSchemaFields(schema, widget.options || {}, `widget-${index}`)}</div>
        </div>
      `;
    })
    .join("");

  widgets.forEach((widget, index) => {
    const select = list.querySelector(`.widget-type-select[data-index="${index}"]`);
    if (select) select.value = widget.type || "resources";
  });
}

function collectWidgets() {
  const list = $c("#widgets-list");
  const items = list.querySelectorAll(".config-item");
  return Array.from(items).map((item) => {
    const index = Number(item.dataset.index);
    const type = item.querySelector(".widget-type-select").value;
    const schema = INFO_WIDGET_SCHEMAS[type] || [];
    const options = collectSchemaFields(schema, `widget-${index}`);
    return { type, options };
  });
}

function addWidget() {
  currentConfig.widgets.push({ type: "resources", options: { cpu: true, memory: true } });
  renderWidgets();
}

function removeWidget(index) {
  currentConfig.widgets.splice(index, 1);
  renderWidgets();
}

function changeWidgetType(index, newType) {
  currentConfig.widgets[index].type = newType;
  currentConfig.widgets[index].options = {};
  renderWidgets();
}

/* Services Panel */

function renderServices() {
  const list = $c("#services-list");
  const groups = currentConfig.services || [];

  if (groups.length === 0) {
    list.innerHTML = `<div class="empty-state"><p>暂无服务分组，点击右上角添加</p></div>`;
    return;
  }

  list.innerHTML = groups
    .map((group, gIndex) => {
      return `
        <div class="config-group" data-gindex="${gIndex}">
          <div class="config-group-header">
            <input type="text" class="group-name" value="${escapeHtmlConfig(group.name || "")}" placeholder="分组名称" data-gindex="${gIndex}" />
            <div class="config-item-actions">
              <button class="btn btn-secondary btn-small btn-add-service" data-gindex="${gIndex}">+ 服务</button>
              <button class="btn btn-danger btn-small btn-remove-group" data-gindex="${gIndex}">删除</button>
            </div>
          </div>
          <div class="config-group-body">
            <div class="config-sublist">
              ${group.services.map((service, sIndex) => renderServiceItem(group, gIndex, service, sIndex)).join("")}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderServiceItem(group, gIndex, service, sIndex) {
  const hasWidget = service.widget && Object.keys(service.widget).length > 0;
  const widgetType = hasWidget ? service.widget.type : "";
  const schema = SERVICE_WIDGET_SCHEMAS[widgetType] || [];

  return `
    <div class="config-item" data-gindex="${gIndex}" data-sindex="${sIndex}">
      <div class="config-item-header">
        <input type="text" class="service-name" value="${escapeHtmlConfig(service.name || "")}" placeholder="服务名称" data-gindex="${gIndex}" data-sindex="${sIndex}" />
        <div class="config-item-actions">
          <button class="btn btn-danger btn-small btn-remove-service" data-gindex="${gIndex}" data-sindex="${sIndex}">删除</button>
        </div>
      </div>
      <div class="config-fields">
        <div class="form-group"><label>图标</label><input type="text" class="service-icon" value="${escapeHtmlConfig(service.icon || "")}" placeholder="sonarr.png 或 mdi-xxx" data-gindex="${gIndex}" data-sindex="${sIndex}" /></div>
        <div class="form-group"><label>链接</label><input type="text" class="service-href" value="${escapeHtmlConfig(service.href || "")}" placeholder="http://..." data-gindex="${gIndex}" data-sindex="${sIndex}" /></div>
        <div class="form-group full-width"><label>描述</label><input type="text" class="service-description" value="${escapeHtmlConfig(service.description || "")}" placeholder="可选" data-gindex="${gIndex}" data-sindex="${sIndex}" /></div>
        <div class="form-group"><label>Ping</label><input type="text" class="service-ping" value="${escapeHtmlConfig(service.ping || "")}" placeholder="host" data-gindex="${gIndex}" data-sindex="${sIndex}" /></div>
        <div class="form-group"><label>Site Monitor</label><input type="text" class="service-siteMonitor" value="${escapeHtmlConfig(service.siteMonitor || "")}" placeholder="http://..." data-gindex="${gIndex}" data-sindex="${sIndex}" /></div>
      </div>
      <div class="widget-fields">
        <div class="form-group">
          <label>服务 Widget</label>
          <select class="service-widget-type" data-gindex="${gIndex}" data-sindex="${sIndex}">
            <option value="">无</option>
            ${SERVICE_WIDGET_TYPE_OPTIONS}
          </select>
        </div>
        <div class="config-fields service-widget-fields">${renderSchemaFields(schema, service.widget || {}, `sw-${gIndex}-${sIndex}`)}</div>
      </div>
    </div>
  `;
}

function renderBookmarks() {
  const list = $c("#bookmarks-list");
  const groups = currentConfig.bookmarks || [];

  if (groups.length === 0) {
    list.innerHTML = `<div class="empty-state"><p>暂无书签分组，点击右上角添加</p></div>`;
    return;
  }

  list.innerHTML = groups
    .map((group, gIndex) => {
      return `
        <div class="config-group" data-bgindex="${gIndex}">
          <div class="config-group-header">
            <input type="text" class="bookmark-group-name" value="${escapeHtmlConfig(group.name || "")}" placeholder="分组名称" data-bgindex="${gIndex}" />
            <div class="config-item-actions">
              <button class="btn btn-secondary btn-small btn-add-bookmark" data-bgindex="${gIndex}">+ 书签</button>
              <button class="btn btn-danger btn-small btn-remove-bookmark-group" data-bgindex="${gIndex}">删除</button>
            </div>
          </div>
          <div class="config-group-body">
            <div class="config-sublist">
              ${group.items.map((item, iIndex) => renderBookmarkItem(gIndex, item, iIndex)).join("")}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderBookmarkItem(gIndex, item, iIndex) {
  return `
    <div class="config-item" data-bgindex="${gIndex}" data-bindex="${iIndex}">
      <div class="config-item-header">
        <input type="text" class="bookmark-name" value="${escapeHtmlConfig(item.name || "")}" placeholder="书签名称" data-bgindex="${gIndex}" data-bindex="${iIndex}" />
        <div class="config-item-actions">
          <button class="btn btn-danger btn-small btn-remove-bookmark" data-bgindex="${gIndex}" data-bindex="${iIndex}">删除</button>
        </div>
      </div>
      <div class="config-fields">
        <div class="form-group"><label>缩写</label><input type="text" class="bookmark-abbr" value="${escapeHtmlConfig(item.abbr || "")}" placeholder="GH" data-bgindex="${gIndex}" data-bindex="${iIndex}" /></div>
        <div class="form-group"><label>图标</label><input type="text" class="bookmark-icon" value="${escapeHtmlConfig(item.icon || "")}" placeholder="github.png" data-bgindex="${gIndex}" data-bindex="${iIndex}" /></div>
        <div class="form-group"><label>链接</label><input type="text" class="bookmark-href" value="${escapeHtmlConfig(item.href || "")}" placeholder="https://..." data-bgindex="${gIndex}" data-bindex="${iIndex}" /></div>
        <div class="form-group"><label>描述</label><input type="text" class="bookmark-description" value="${escapeHtmlConfig(item.description || "")}" placeholder="可选" data-bgindex="${gIndex}" data-bindex="${iIndex}" /></div>
      </div>
    </div>
  `;
}

function renderLayout() {
  const list = $c("#layout-list");
  const settings = currentConfig.settings || {};
  const layout = settings.layout || {};

  const groupNames = new Set();
  (currentConfig.services || []).forEach((g) => groupNames.add(g.name));
  (currentConfig.bookmarks || []).forEach((g) => groupNames.add(g.name));

  if (groupNames.size === 0) {
    list.innerHTML = `<div class="empty-state"><p>暂无分组，先在服务或书签页添加</p></div>`;
    return;
  }

  list.innerHTML = Array.from(groupNames)
    .map((name) => {
      const cfg = layout[name] || {};
      return `
        <div class="config-item layout-item" data-lname="${escapeHtmlConfig(name)}">
          <div class="form-group">
            <label>${escapeHtmlConfig(name)}</label>
            <input type="text" class="layout-icon" value="${escapeHtmlConfig(cfg.icon || "")}" placeholder="图标" data-lname="${escapeHtmlConfig(name)}" />
          </div>
          <div class="form-group">
            <label>样式</label>
            <select class="layout-style" data-lname="${escapeHtmlConfig(name)}">
              <option value="">默认</option>
              <option value="row" ${cfg.style === "row" ? "selected" : ""}>行</option>
              <option value="column" ${cfg.style === "column" ? "selected" : ""}>列</option>
            </select>
          </div>
          <div class="form-group">
            <label>列数</label>
            <input type="number" class="layout-columns" value="${cfg.columns ?? ""}" placeholder="列" data-lname="${escapeHtmlConfig(name)}" />
          </div>
          <div class="form-group">
            <label>Tab</label>
            <input type="text" class="layout-tab" value="${escapeHtmlConfig(cfg.tab || "")}" placeholder="标签页" data-lname="${escapeHtmlConfig(name)}" />
          </div>
          <div class="form-group">
            <label>显示标题</label>
            <select class="layout-header" data-lname="${escapeHtmlConfig(name)}">
              <option value="">默认</option>
              <option value="true" ${cfg.header === true ? "selected" : ""}>显示</option>
              <option value="false" ${cfg.header === false ? "selected" : ""}>隐藏</option>
            </select>
          </div>
        </div>
      `;
    })
    .join("");
}

function collectLayout() {
  const items = $c("#layout-list").querySelectorAll(".layout-item");
  const layout = {};
  items.forEach((item) => {
    const name = item.dataset.lname;
    const icon = item.querySelector(".layout-icon").value.trim();
    const style = item.querySelector(".layout-style").value;
    const columns = item.querySelector(".layout-columns").value;
    const tab = item.querySelector(".layout-tab").value.trim();
    const header = item.querySelector(".layout-header").value;

    const cfg = {};
    if (icon) cfg.icon = icon;
    if (style) cfg.style = style;
    if (columns) cfg.columns = Number(columns);
    if (tab) cfg.tab = tab;
    if (header === "true") cfg.header = true;
    if (header === "false") cfg.header = false;

    if (Object.keys(cfg).length > 0) {
      layout[name] = cfg;
    }
  });
  return layout;
}

/* ---------------- Schema Fields ---------------- */

function renderSchemaFields(schema, values, prefix) {
  if (!schema || schema.length === 0) return "";
  return schema
    .map((field) => {
      const id = `${prefix}-${field.key}`;
      const value = values[field.key];
      if (field.type === "checkbox") {
        return `
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="${id}" ${value ? "checked" : ""} data-key="${field.key}" />
              ${field.label}
            </label>
          </div>
        `;
      }
      if (field.type === "select") {
        return `
          <div class="form-group">
            <label for="${id}">${field.label}</label>
            <select id="${id}" data-key="${field.key}">
              <option value="">--</option>
              ${field.options.map((o) => `<option value="${o}" ${value === o ? "selected" : ""}>${o}</option>`).join("")}
            </select>
          </div>
        `;
      }
      if (field.type === "textarea") {
        return `
          <div class="form-group full-width">
            <label for="${id}">${field.label}</label>
            <textarea id="${id}" rows="3" data-key="${field.key}">${escapeHtmlConfig(value || "")}</textarea>
          </div>
        `;
      }
      return `
        <div class="form-group">
          <label for="${id}">${field.label}</label>
          <input type="${field.type}" id="${id}" value="${escapeHtmlConfig(value ?? "")}" data-key="${field.key}" />
        </div>
      `;
    })
    .join("");
}

function collectSchemaFields(schema, prefix) {
  const options = {};
  schema.forEach((field) => {
    const el = document.getElementById(`${prefix}-${field.key}`);
    if (!el) return;
    if (field.type === "checkbox") {
      if (el.checked) options[field.key] = true;
    } else if (field.type === "number") {
      const val = el.value.trim();
      if (val) options[field.key] = Number(val);
    } else if (field.type === "textarea") {
      const val = el.value.trim();
      if (val) {
        try {
          options[field.key] = JSON.parse(val);
        } catch {
          options[field.key] = val;
        }
      }
    } else {
      const val = el.value.trim();
      if (val) options[field.key] = val;
    }
  });
  return options;
}

/* ---------------- Collect Config ---------------- */

function collectConfigFromUi() {
  const settings = collectSettings();
  settings.layout = collectLayout();

  const services = [];
  $c("#services-list").querySelectorAll(".config-group").forEach((groupEl) => {
    const gIndex = Number(groupEl.dataset.gindex);
    const name = groupEl.querySelector(".group-name").value.trim();
    if (!name) return;

    const groupServices = [];
    groupEl.querySelectorAll(".config-item").forEach((itemEl) => {
      const sIndex = Number(itemEl.dataset.sindex);
      const serviceName = itemEl.querySelector(".service-name").value.trim();
      if (!serviceName) return;

      const service = {
        name: serviceName,
        href: itemEl.querySelector(".service-href").value.trim(),
        icon: itemEl.querySelector(".service-icon").value.trim(),
        description: itemEl.querySelector(".service-description").value.trim(),
        ping: itemEl.querySelector(".service-ping").value.trim(),
        siteMonitor: itemEl.querySelector(".service-siteMonitor").value.trim(),
      };

      const widgetTypeSelect = itemEl.querySelector(".service-widget-type");
      const widgetType = widgetTypeSelect ? widgetTypeSelect.value : "";
      if (widgetType) {
        const schema = SERVICE_WIDGET_SCHEMAS[widgetType] || [];
        const options = collectSchemaFields(schema, `sw-${gIndex}-${sIndex}`);
        service.widget = { type: widgetType, ...options };
      }

      // Remove empty fields
      Object.keys(service).forEach((key) => {
        if (!service[key]) delete service[key];
      });

      groupServices.push(service);
    });

    services.push({ name, services: groupServices });
  });

  const bookmarks = [];
  $c("#bookmarks-list").querySelectorAll(".config-group").forEach((groupEl) => {
    const gIndex = Number(groupEl.dataset.bgindex);
    const name = groupEl.querySelector(".bookmark-group-name").value.trim();
    if (!name) return;

    const items = [];
    groupEl.querySelectorAll(".config-item").forEach((itemEl) => {
      const iIndex = Number(itemEl.dataset.bindex);
      const itemName = itemEl.querySelector(".bookmark-name").value.trim();
      if (!itemName) return;

      const item = {
        name: itemName,
        abbr: itemEl.querySelector(".bookmark-abbr").value.trim(),
        icon: itemEl.querySelector(".bookmark-icon").value.trim(),
        href: itemEl.querySelector(".bookmark-href").value.trim(),
        description: itemEl.querySelector(".bookmark-description").value.trim(),
      };
      Object.keys(item).forEach((key) => {
        if (!item[key] && key !== "name") delete item[key];
      });
      items.push(item);
    });

    bookmarks.push({ name, items });
  });

  return {
    settings,
    widgets: collectWidgets(),
    services,
    bookmarks,
  };
}

/* ---------------- Actions ---------------- */

async function saveConfig() {
  const btn = $c("#btn-save-config");
  const originalText = btn.textContent;
  btn.textContent = "保存中...";
  btn.disabled = true;

  try {
    currentConfig = collectConfigFromUi();
    const { data } = await configApi(`/servers/${currentServer.id}/config`, {
      method: "PUT",
      body: currentConfig,
    });
    currentConfig = data;
    showConfigToast("配置已保存", "success");
  } catch (err) {
    showConfigToast(err.message, "error");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function importConfig() {
  const btn = $c("#btn-import");
  const originalText = btn.textContent;
  btn.textContent = "导入中...";
  btn.disabled = true;

  try {
    const { data } = await configApi(`/servers/${currentServer.id}/config/import`, { method: "POST" });
    currentConfig = data;
    renderAllPanels();
    showConfigToast("已从目标 homepage 导入配置", "success");
  } catch (err) {
    showConfigToast(err.message, "error");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function syncConfig() {
  const btn = $c("#btn-sync");
  const originalText = btn.textContent;
  btn.textContent = "同步中...";
  btn.disabled = true;

  try {
    const { data } = await configApi(`/servers/${currentServer.id}/config/sync`, { method: "POST" });
    if (data.warning) {
      showConfigToast(data.warning, "info");
    } else {
      showConfigToast(`已同步 ${data.files.length} 个文件到 homepage`, "success");
    }
  } catch (err) {
    showConfigToast(err.message, "error");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function toggleExportMenu() {
  $c("#export-options").classList.toggle("open");
}

/* ---------------- Event Listeners ---------------- */

function initConfigEditor() {
  // Tabs
  $c(".config-tabs")?.addEventListener("click", (e) => {
    const tab = e.target.closest(".config-tab");
    if (!tab) return;

    $$c(".config-tab").forEach((t) => t.classList.remove("active"));
    $$c(".config-panel").forEach((p) => p.classList.remove("active"));

    tab.classList.add("active");
    const panelId = `panel-${tab.dataset.tab}`;
    $c(`#${panelId}`)?.classList.add("active");
  });

  // Back
  $c("#btn-back")?.addEventListener("click", closeConfigEditor);

  // Save / Import / Export / Sync
  $c("#btn-save-config")?.addEventListener("click", saveConfig);
  $c("#btn-import")?.addEventListener("click", importConfig);
  $c("#btn-sync")?.addEventListener("click", syncConfig);
  $c("#btn-export")?.addEventListener("click", toggleExportMenu);

  // Widgets
  $c("#btn-add-widget")?.addEventListener("click", addWidget);
  $c("#widgets-list")?.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".btn-remove-widget");
    if (removeBtn) {
      removeWidget(Number(removeBtn.dataset.index));
      return;
    }
  });
  $c("#widgets-list")?.addEventListener("change", (e) => {
    const select = e.target.closest(".widget-type-select");
    if (select) {
      changeWidgetType(Number(select.dataset.index), select.value);
    }
  });

  // Services
  $c("#btn-add-group")?.addEventListener("click", () => {
    currentConfig.services.push({ name: "新分组", services: [] });
    renderServices();
  });

  $c("#services-list")?.addEventListener("click", (e) => {
    const addService = e.target.closest(".btn-add-service");
    if (addService) {
      const gIndex = Number(addService.dataset.gindex);
      currentConfig.services[gIndex].services.push({ name: "新服务", href: "" });
      renderServices();
      return;
    }

    const removeGroup = e.target.closest(".btn-remove-group");
    if (removeGroup) {
      currentConfig.services.splice(Number(removeGroup.dataset.gindex), 1);
      renderServices();
      return;
    }

    const removeService = e.target.closest(".btn-remove-service");
    if (removeService) {
      const gIndex = Number(removeService.dataset.gindex);
      const sIndex = Number(removeService.dataset.sindex);
      currentConfig.services[gIndex].services.splice(sIndex, 1);
      renderServices();
    }
  });

  $c("#services-list")?.addEventListener("change", (e) => {
    const select = e.target.closest(".service-widget-type");
    if (select) {
      const gIndex = Number(select.dataset.gindex);
      const sIndex = Number(select.dataset.sindex);
      const type = select.value;
      currentConfig.services[gIndex].services[sIndex].widget = type ? { type } : {};
      renderServices();
    }
  });

  // Bookmarks
  $c("#btn-add-bookmark-group")?.addEventListener("click", () => {
    currentConfig.bookmarks.push({ name: "新书签分组", items: [] });
    renderBookmarks();
  });

  $c("#bookmarks-list")?.addEventListener("click", (e) => {
    const addBookmark = e.target.closest(".btn-add-bookmark");
    if (addBookmark) {
      const gIndex = Number(addBookmark.dataset.bgindex);
      currentConfig.bookmarks[gIndex].items.push({ name: "新书签", href: "" });
      renderBookmarks();
      return;
    }

    const removeGroup = e.target.closest(".btn-remove-bookmark-group");
    if (removeGroup) {
      currentConfig.bookmarks.splice(Number(removeGroup.dataset.bgindex), 1);
      renderBookmarks();
      return;
    }

    const removeBookmark = e.target.closest(".btn-remove-bookmark");
    if (removeBookmark) {
      const gIndex = Number(removeBookmark.dataset.bgindex);
      const iIndex = Number(removeBookmark.dataset.bindex);
      currentConfig.bookmarks[gIndex].items.splice(iIndex, 1);
      renderBookmarks();
    }
  });

  // Group collapse toggle
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".config-group-header");
    if (!header) return;
    // Don't toggle when interacting with inputs or buttons
    if (e.target.closest("input, button, .config-item-actions")) return;
    const body = header.nextElementSibling;
    if (body?.classList.contains("config-group-body")) {
      body.classList.toggle("collapsed");
    }
  });

  // Export menu links
  document.addEventListener("click", (e) => {
    const exportBtn = e.target.closest("#btn-export");
    const menu = $c("#export-options");
    if (!menu) return;
    if (!exportBtn && !e.target.closest("#export-options")) {
      menu.classList.remove("open");
    }
  });
}

// Add export options HTML dynamically
function ensureExportMenu() {
  if ($c("#export-options")) return;
  const btn = $c("#btn-export");
  if (!btn) return;
  const wrapper = document.createElement("div");
  wrapper.className = "export-menu";
  btn.parentNode.insertBefore(wrapper, btn);
  wrapper.appendChild(btn);

  const menu = document.createElement("div");
  menu.id = "export-options";
  menu.className = "export-options";
  menu.innerHTML = `
    <a href="#" class="export-link" data-file="settings">settings.yaml</a>
    <a href="#" class="export-link" data-file="widgets">widgets.yaml</a>
    <a href="#" class="export-link" data-file="services">services.yaml</a>
    <a href="#" class="export-link" data-file="bookmarks">bookmarks.yaml</a>
  `;
  wrapper.appendChild(menu);

  menu.addEventListener("click", (e) => {
    const link = e.target.closest(".export-link");
    if (!link || !currentServer) return;
    e.preventDefault();
    const file = link.dataset.file;
    const url = `/api/servers/${currentServer.id}/config/export/${file}`;
    const downloader = document.createElement("a");
    downloader.href = url;
    downloader.download = `${file}.yaml`;
    document.body.appendChild(downloader);
    downloader.click();
    downloader.remove();
    menu.classList.remove("open");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ensureExportMenu();
  initConfigEditor();
});
