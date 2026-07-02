import yaml from "js-yaml";
import { execFileSync } from "child_process";

function normalizeUrl(url) {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }
  return normalized.replace(/\/$/, "");
}

async function fetchJson(baseUrl, path) {
  const url = `${normalizeUrl(baseUrl)}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json, */*" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function homepageGroupToInternal(group) {
  // homepage /api/services returns: { name, services: [...], groups: [...] }
  if (group && typeof group === "object" && !Array.isArray(group) && group.name) {
    const nested = Array.isArray(group.groups) ? group.groups.map(homepageGroupToInternal) : [];
    return {
      name: group.name,
      services: Array.isArray(group.services)
        ? group.services.map(homepageServiceToInternal).filter(Boolean)
        : [],
      ...(nested.length > 0 ? { groups: nested } : {}),
    };
  }

  // Fallback: YAML-style { "GroupName": [services] }
  const name = Object.keys(group)[0];
  const rawServices = group[name] || [];
  return {
    name,
    services: Array.isArray(rawServices)
      ? rawServices.map(homepageServiceToInternal).filter(Boolean)
      : [],
  };
}

function homepageServiceToInternal(service) {
  // homepage /api/services returns services as: { name, href, description, icon, widgets: [...], ... }
  if (service && typeof service === "object" && !Array.isArray(service) && service.name) {
    const { name, widgets, ...rest } = service;
    const internal = { name, ...rest };

    // Drop homepage-internal fields not needed for editing
    delete internal.weight;
    delete internal.type;

    if (Array.isArray(widgets) && widgets.length > 0) {
      if (widgets.length === 1) {
        internal.widget = normalizeWidgetEntry(widgets[0]);
      } else {
        internal.widgets = widgets.map(normalizeWidgetEntry);
      }
    }
    return internal;
  }

  // Fallback: YAML-style { "ServiceName": { ...data } }
  const name = Object.keys(service)[0];
  const data = service[name] || {};
  const internal = { name, ...data };

  if (data.widget && !data.widgets) {
    internal.widget = { ...data.widget };
    delete internal.widgets;
  } else if (data.widgets) {
    internal.widgets = data.widgets.map((w) => ({ ...w }));
    delete internal.widget;
  }

  return internal;
}

function normalizeWidgetEntry(widget) {
  // widgets from API may be { type, ...options } or { type: { ...options } }
  if (!widget || typeof widget !== "object") return widget;
  if (widget.type && typeof widget.type === "string") {
    const { type, ...options } = widget;
    return { type, ...options };
  }
  const type = Object.keys(widget)[0];
  return { type, ...widget[type] };
}

function homepageBookmarkGroupToInternal(group) {
  // homepage /api/bookmarks returns: { name, bookmarks: [...] }
  if (group && typeof group === "object" && !Array.isArray(group) && group.name) {
    return {
      name: group.name,
      items: Array.isArray(group.bookmarks)
        ? group.bookmarks.map(homepageBookmarkToInternal).filter(Boolean)
        : [],
    };
  }

  // Fallback: YAML-style { "GroupName": [items] }
  const name = Object.keys(group)[0];
  const rawItems = group[name] || [];
  return {
    name,
    items: Array.isArray(rawItems)
      ? rawItems.map(homepageBookmarkToInternal).filter(Boolean)
      : [],
  };
}

function homepageBookmarkToInternal(bookmark) {
  // homepage /api/bookmarks items: { name, abbr, href, ... }
  if (bookmark && typeof bookmark === "object" && !Array.isArray(bookmark) && bookmark.name) {
    const { name, ...rest } = bookmark;
    return { name, ...rest };
  }
  // Fallback: YAML-style { "BookmarkName": { ...data } }
  const name = Object.keys(bookmark)[0];
  const data = bookmark[name] || {};
  return { name, ...data };
}

function homepageWidgetToInternal(widget) {
  // homepage /api/widgets returns: { type, options: {...} }
  if (widget && typeof widget === "object" && !Array.isArray(widget) && widget.type) {
    const options = widget.options || {};
    const { index, ...cleanOptions } = options;
    return { type: widget.type, options: cleanOptions };
  }
  // Fallback: YAML-style { "widgetType": { ...options } }
  const type = Object.keys(widget)[0];
  return { type, options: { ...widget[type] } };
}

export async function fetchHomepageConfig(baseUrl) {
  const [services, bookmarks, widgets] = await Promise.allSettled([
    fetchJson(baseUrl, "/api/services"),
    fetchJson(baseUrl, "/api/bookmarks"),
    fetchJson(baseUrl, "/api/widgets"),
  ]);

  return {
    services: services.status === "fulfilled" && Array.isArray(services.value)
      ? services.value.map(homepageGroupToInternal)
      : [],
    bookmarks: bookmarks.status === "fulfilled" && Array.isArray(bookmarks.value)
      ? bookmarks.value.map(homepageBookmarkGroupToInternal)
      : [],
    widgets: widgets.status === "fulfilled" && Array.isArray(widgets.value)
      ? widgets.value.map(homepageWidgetToInternal)
      : [],
    settings: {},
  };
}

function internalGroupToHomepage(group) {
  return {
    [group.name]: group.services.map(internalServiceToHomepage),
  };
}

function internalServiceToHomepage(service) {
  const { name, ...rest } = service;
  const data = { ...rest };

  // Clean empty fields
  if (data.widget && Object.keys(data.widget).length === 0) delete data.widget;
  if (data.widgets && data.widgets.length === 0) delete data.widgets;

  return { [name]: data };
}

function internalBookmarkGroupToHomepage(group) {
  return {
    [group.name]: group.items.map((item) => {
      const { name, ...rest } = item;
      return { [name]: rest };
    }),
  };
}

function internalWidgetToHomepage(widget) {
  return { [widget.type]: { ...widget.options } };
}

export function exportYaml(config) {
  const settings = { ...(config.settings || {}) };
  const layout = settings.layout || {};

  // Ensure layout is serialized in a stable way. js-yaml will turn objects into mappings.
  // If layout was an array originally, we keep it as object for simplicity.
  settings.layout = layout;

  return {
    settings: yaml.dump(settings, { indent: 2, lineWidth: -1, noRefs: true }),
    widgets: yaml.dump((config.widgets || []).map(internalWidgetToHomepage), {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    }),
    services: yaml.dump((config.services || []).map(internalGroupToHomepage), {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    }),
    bookmarks: yaml.dump((config.bookmarks || []).map(internalBookmarkGroupToHomepage), {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    }),
  };
}

export function createEmptyConfig() {
  return {
    settings: {},
    widgets: [],
    services: [],
    bookmarks: [],
  };
}

/* ---------------- Sync to remote homepage via SSH ---------------- */

const SYNC_HOST = process.env.SYNC_HOST || "";
const SYNC_PORT = process.env.SYNC_PORT || "22";
const SYNC_USER = process.env.SYNC_USER || "";
const SYNC_PASSWORD = process.env.SYNC_PASSWORD || "";
const HOMEPAGE_CONFIG_DIR = process.env.HOMEPAGE_CONFIG_DIR || "/app/config";

function writeRemoteFile(filePath, content) {
  execFileSync(
    "sshpass",
    [
      "-p",
      SYNC_PASSWORD,
      "ssh",
      "-o", "StrictHostKeyChecking=no",
      "-o", "UserKnownHostsFile=/dev/null",
      "-o", "LogLevel=ERROR",
      "-p",
      SYNC_PORT,
      `${SYNC_USER}@${SYNC_HOST}`,
      `cat > ${HOMEPAGE_CONFIG_DIR}/${filePath}`,
    ],
    { input: content, encoding: "utf8", timeout: 30000 },
  );
}

async function revalidateHomepage(baseUrl) {
  const url = `${normalizeUrl(baseUrl)}/api/revalidate`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { ok: response.ok, status: response.status };
  } catch (error) {
    clearTimeout(timeout);
    return { ok: false, status: null, error: error.message };
  }
}

export async function syncConfigToHomepage(config, homepageBaseUrl) {
  if (!SYNC_HOST || !SYNC_USER || !SYNC_PASSWORD) {
    throw new Error("未配置同步凭据（SYNC_HOST / SYNC_USER / SYNC_PASSWORD）");
  }

  const yamls = exportYaml(config);
  const files = ["settings", "widgets", "services", "bookmarks"];

  for (const file of files) {
    writeRemoteFile(`${file}.yaml`, yamls[file]);
  }

  const revalidate = await revalidateHomepage(homepageBaseUrl);

  return {
    files,
    revalidate,
  };
}
