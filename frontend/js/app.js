const API_BASE = "/api";

const $ = (selector) => document.querySelector(selector);

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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ---------------- Toast ---------------- */

function showToast(message, type = "info") {
  const container = $("#toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => {
      toast.remove();
    });
  }, 3500);
}

/* ---------------- Modal ---------------- */

function openModal(title) {
  $("#modal-title").textContent = title;
  $("#modal-overlay").classList.add("open");
  $("#modal-overlay").setAttribute("aria-hidden", "false");
  $("#name").focus();
}

function closeModal() {
  $("#modal-overlay").classList.remove("open");
  $("#modal-overlay").setAttribute("aria-hidden", "true");
  resetForm();
}

function resetForm() {
  $("#server-form").reset();
  $("#server-id").value = "";
  hideCheckResult();
}

function hideCheckResult() {
  const el = $("#check-result");
  el.classList.add("hidden");
  el.classList.remove("success", "error");
  el.textContent = "";
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

/* ---------------- Rendering ---------------- */

function renderStatus(result) {
  if (!result) {
    return `<span class="status status-unknown">未检测</span>`;
  }

  if (result.ok) {
    return `<span class="status status-online">在线 · ${result.responseTime}ms</span>`;
  }

  return `<span class="status status-offline">离线</span>`;
}

function updateStats() {
  let online = 0;
  let offline = 0;

  for (const server of servers) {
    if (!server.lastCheck) {
      offline++;
    } else if (server.lastCheck.ok) {
      online++;
    } else {
      offline++;
    }
  }

  $("#stat-total").textContent = servers.length;
  $("#stat-online").textContent = online;
  $("#stat-offline").textContent = offline;
}

function renderServerList() {
  const list = $("#server-list");

  if (servers.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="2"/>
            <path d="M8.5 8.5C7.1 9.9 6.3 11.4 6.3 12s.8 2.1 2.2 3.5"/>
            <path d="M5.1 5.1C2.7 7.5 1.5 9.8 1.5 12s1.2 4.5 3.6 6.9"/>
            <path d="M15.5 8.5c1.4 1.4 2.2 2.9 2.2 3.5s-.8 2.1-2.2 3.5"/>
            <path d="M18.9 5.1c2.4 2.4 3.6 4.7 3.6 6.9s-1.2 4.5-3.6 6.9"/>
          </svg>
        </div>
        <p>暂无服务器，点击右上角添加</p>
      </div>
    `;
    updateStats();
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
          <div class="server-status" id="status-${server.id}">${renderStatus(server.lastCheck)}</div>
        </div>
        <div class="server-actions">
          <button class="btn btn-secondary btn-small btn-check" data-id="${server.id}" title="检测">
            检测
          </button>
          <button class="btn btn-secondary btn-small btn-edit" data-id="${server.id}" title="编辑">
            编辑
          </button>
          <button class="btn btn-danger btn-small btn-delete" data-id="${server.id}" title="删除">
            删除
          </button>
        </div>
      </div>
    `
    )
    .join("");

  updateStats();
}

async function loadServers() {
  try {
    const { data } = await api("/servers");
    servers = data.map((s) => ({ ...s, lastCheck: null }));
    renderServerList();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------------- Actions ---------------- */

function showForm(server = null) {
  openModal(server ? "编辑服务器" : "添加服务器");
  $("#server-id").value = server?.id || "";
  $("#name").value = server?.name || "";
  $("#baseUrl").value = server?.baseUrl || "";
  $("#description").value = server?.description || "";
  hideCheckResult();
}

async function handleTestConnection() {
  const baseUrl = $("#baseUrl").value.trim();

  if (!baseUrl) {
    showCheckResult({ ok: false, message: "请先填写地址" });
    return;
  }

  const btn = $("#btn-test");
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> 检测中...`;
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
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function handleCheckServer(id) {
  const statusEl = $(`#status-${id}`);
  statusEl.innerHTML = `<span class="status status-unknown">检测中...</span>`;

  try {
    const { data } = await api(`/servers/${id}/check`, { method: "POST" });
    const server = servers.find((s) => s.id === id);
    if (server) {
      server.lastCheck = data;
    }
    statusEl.innerHTML = renderStatus(data);
    updateStats();
  } catch (err) {
    statusEl.innerHTML = `<span class="status status-offline">检测失败</span>`;
    showToast(err.message, "error");
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

  const submitBtn = $("#btn-submit");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = `<span class="spinner"></span> 保存中...`;
  submitBtn.disabled = true;

  try {
    if (id) {
      await api(`/servers/${id}`, { method: "PUT", body });
      showToast("服务器已更新", "success");
    } else {
      await api("/servers", { method: "POST", body });
      showToast("服务器已添加", "success");
    }
    await loadServers();
    closeModal();
  } catch (err) {
    showCheckResult({ ok: false, message: err.message });
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function handleDeleteServer(id) {
  if (!confirm("确定要删除该服务器吗？")) return;

  try {
    await api(`/servers/${id}`, { method: "DELETE" });
    showToast("服务器已删除", "success");
    await loadServers();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------------- Events ---------------- */

function init() {
  // Header add button
  $("#btn-add").addEventListener("click", () => showForm());

  // Modal actions
  $("#btn-cancel").addEventListener("click", closeModal);
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-overlay").addEventListener("click", (e) => {
    if (e.target === $("#modal-overlay")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("#modal-overlay").classList.contains("open")) {
      closeModal();
    }
  });

  // Form
  $("#btn-test").addEventListener("click", handleTestConnection);
  $("#server-form").addEventListener("submit", handleSaveServer);

  // Server list actions (event delegation)
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
