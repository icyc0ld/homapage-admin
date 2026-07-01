const API_BASE = "/api";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let servers = [];

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
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

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("zh-CN");
}

function renderStatus(result) {
  if (!result) {
    return `<span class="status status-unknown">未检测</span>`;
  }

  if (result.ok) {
    return `<span class="status status-online">在线 · ${result.responseTime}ms</span>`;
  }

  return `<span class="status status-offline">离线</span>`;
}

function renderServerList() {
  const list = $("#server-list");

  if (servers.length === 0) {
    list.innerHTML = `<p class="empty">暂无服务器，点击右上角添加</p>`;
    return;
  }

  list.innerHTML = servers
    .map(
      (server) => `
    <div class="server-item" data-id="${server.id}">
      <div class="server-info">
        <h3>${escapeHtml(server.name)}</h3>
        <div class="server-url">${escapeHtml(server.baseUrl)}</div>
        ${server.description ? `<div class="server-description">${escapeHtml(server.description)}</div>` : ""}
        <div class="server-status" id="status-${server.id}">${renderStatus()}</div>
      </div>
      <div class="server-actions">
        <button class="btn btn-secondary btn-small btn-check" data-id="${server.id}">检测</button>
        <button class="btn btn-secondary btn-small btn-edit" data-id="${server.id}">编辑</button>
        <button class="btn btn-danger btn-small btn-delete" data-id="${server.id}">删除</button>
      </div>
    </div>
  `
    )
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadServers() {
  const { data } = await api("/servers");
  servers = data;
  renderServerList();
}

function showForm(server = null) {
  $("#form-section").classList.remove("hidden");
  $("#form-title").textContent = server ? "编辑服务器" : "添加服务器";
  $("#server-id").value = server?.id || "";
  $("#name").value = server?.name || "";
  $("#baseUrl").value = server?.baseUrl || "";
  $("#description").value = server?.description || "";
  $("#check-result").classList.add("hidden");
  $("#check-result").textContent = "";
}

function hideForm() {
  $("#form-section").classList.add("hidden");
  $("#server-form").reset();
  $("#server-id").value = "";
  $("#check-result").classList.add("hidden");
}

function showCheckResult(result) {
  const el = $("#check-result");
  el.classList.remove("hidden", "success", "error");

  if (result.ok) {
    el.classList.add("success");
    el.innerHTML = `连接正常 · HTTP ${result.status} · ${result.responseTime}ms`;
  } else {
    el.classList.add("error");
    el.innerHTML = `<strong>连接失败</strong><br/>${escapeHtml(result.message)}`;
  }
}

async function handleTestConnection() {
  const baseUrl = $("#baseUrl").value.trim();

  if (!baseUrl) {
    showCheckResult({ ok: false, message: "请先填写地址" });
    return;
  }

  const btn = $("#btn-test");
  const originalText = btn.textContent;
  btn.textContent = "检测中...";
  btn.disabled = true;

  try {
    const { data } = await api("/servers/check", {
      method: "POST",
      body: { baseUrl },
    });
    showCheckResult(data);
  } catch (err) {
    showCheckResult({ ok: false, message: err.message });
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function handleCheckServer(id) {
  const statusEl = $(`#status-${id}`);
  statusEl.innerHTML = `<span class="status status-unknown">检测中...</span>`;

  try {
    const { data } = await api(`/servers/${id}/check`, { method: "POST" });
    statusEl.innerHTML = renderStatus(data);
  } catch (err) {
    statusEl.innerHTML = `<span class="status status-offline">检测失败</span>`;
  }
}

async function handleSaveServer(e) {
  e.preventDefault();

  const id = $("#server-id").value;
  const body = {
    name: $("#name").value.trim(),
    baseUrl: $("#baseUrl").value.trim(),
    description: $("#description").value.trim(),
  };

  try {
    if (id) {
      await api(`/servers/${id}`, { method: "PUT", body });
    } else {
      await api("/servers", { method: "POST", body });
    }
    await loadServers();
    hideForm();
  } catch (err) {
    showCheckResult({ ok: false, message: err.message });
  }
}

async function handleDeleteServer(id) {
  if (!confirm("确定要删除该服务器吗？")) return;

  try {
    await api(`/servers/${id}`, { method: "DELETE" });
    await loadServers();
  } catch (err) {
    alert(err.message);
  }
}

function init() {
  $("#btn-add").addEventListener("click", () => showForm());
  $("#btn-cancel").addEventListener("click", hideForm);
  $("#btn-test").addEventListener("click", handleTestConnection);
  $("#server-form").addEventListener("submit", handleSaveServer);

  $("#server-list").addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    const id = target.dataset.id;
    if (target.classList.contains("btn-check")) {
      handleCheckServer(id);
    } else if (target.classList.contains("btn-edit")) {
      const server = servers.find((s) => s.id === id);
      if (server) showForm(server);
    } else if (target.classList.contains("btn-delete")) {
      handleDeleteServer(id);
    }
  });

  loadServers();
}

init();
