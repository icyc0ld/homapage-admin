import yaml from "js-yaml";

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
  const name = Object.keys(group)[0];
  const rawServices = group[name] || [];
  return {
    name,
    services: rawServices.map(homepageServiceToInternal).filter(Boolean),
  };
}

function homepageServiceToInternal(service) {
  const name = Object.keys(service)[0];
  const data = service[name] || {};
  const internal = { name, ...data };

  // Normalize single widget vs multiple widgets to internal shape
  if (data.widget && !data.widgets) {
    internal.widget = { ...data.widget };
    delete internal.widgets;
  } else if (data.widgets) {
    internal.widgets = data.widgets.map((w) => ({ ...w }));
    delete internal.widget;
  }

  return internal;
}

function homepageBookmarkGroupToInternal(group) {
  const name = Object.keys(group)[0];
  const rawItems = group[name] || [];
  return {
    name,
    items: rawItems.map(homepageBookmarkToInternal).filter(Boolean),
  };
}

function homepageBookmarkToInternal(bookmark) {
  const name = Object.keys(bookmark)[0];
  const data = bookmark[name] || {};
  return { name, ...data };
}

function homepageWidgetToInternal(widget) {
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
