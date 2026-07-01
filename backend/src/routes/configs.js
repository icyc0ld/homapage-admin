import { Router } from "express";
import { readServers } from "../store/jsonStore.js";
import { readConfig, writeConfig, createEmptyConfig } from "../store/configStore.js";
import { fetchHomepageConfig, exportYaml } from "../services/homepageConfig.js";

const router = Router({ mergeParams: true });

function getServer(req, res) {
  const servers = readServers();
  const server = servers.find((s) => s.id === req.params.id);
  if (!server) {
    res.status(404).json({ error: "服务器不存在" });
    return null;
  }
  return server;
}

function validateConfig(body) {
  if (!body || typeof body !== "object") {
    return { error: "配置格式错误" };
  }
  const { settings, widgets, services, bookmarks } = body;
  return {
    config: {
      settings: settings || {},
      widgets: Array.isArray(widgets) ? widgets : [],
      services: Array.isArray(services) ? services : [],
      bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
    },
  };
}

router.get("/", (req, res) => {
  const server = getServer(req, res);
  if (!server) return;

  const config = readConfig(server.id);
  res.json({ data: config });
});

router.put("/", (req, res) => {
  const server = getServer(req, res);
  if (!server) return;

  const validation = validateConfig(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  writeConfig(server.id, validation.config);
  res.json({ data: validation.config });
});

router.post("/import", async (req, res) => {
  const server = getServer(req, res);
  if (!server) return;

  try {
    const imported = await fetchHomepageConfig(server.baseUrl);
    const config = { ...createEmptyConfig(), ...imported };
    writeConfig(server.id, config);
    res.json({ data: config });
  } catch (error) {
    res.status(502).json({ error: `从目标 homepage 导入失败：${error.message}` });
  }
});

router.get("/export/:file", (req, res) => {
  const server = getServer(req, res);
  if (!server) return;

  const { file } = req.params;
  if (!["settings", "widgets", "services", "bookmarks"].includes(file)) {
    return res.status(400).json({ error: "不支持的导出文件" });
  }

  const config = readConfig(server.id);
  const yamls = exportYaml(config);

  res.setHeader("Content-Type", "text/yaml; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${file}.yaml"`);
  res.send(yamls[file]);
});

export default router;
