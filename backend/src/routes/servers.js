import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readServers, writeServers } from "../store/jsonStore.js";
import { checkHomepageConnection } from "../services/homepage.js";
import { deleteConfig } from "../store/configStore.js";

const router = Router();

function validateServer(body) {
  const { name, baseUrl, description } = body;
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("名称不能为空");
  }

  if (!baseUrl || typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
    errors.push("地址不能为空");
  }

  return {
    name: name?.trim(),
    baseUrl: baseUrl?.trim(),
    description: description?.trim() || "",
    errors,
  };
}

router.get("/", (req, res) => {
  const servers = readServers();
  res.json({ data: servers });
});

router.post("/", async (req, res) => {
  const { name, baseUrl, description, errors } = validateServer(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("；") });
  }

  const servers = readServers();
  const now = new Date().toISOString();

  const server = {
    id: uuidv4(),
    name,
    baseUrl,
    description,
    createdAt: now,
    updatedAt: now,
  };

  servers.push(server);
  writeServers(servers);

  res.status(201).json({ data: server });
});

router.get("/:id", (req, res) => {
  const servers = readServers();
  const server = servers.find((s) => s.id === req.params.id);

  if (!server) {
    return res.status(404).json({ error: "服务器不存在" });
  }

  res.json({ data: server });
});

router.put("/:id", (req, res) => {
  const servers = readServers();
  const index = servers.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "服务器不存在" });
  }

  const { name, baseUrl, description, errors } = validateServer(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("；") });
  }

  servers[index] = {
    ...servers[index],
    name,
    baseUrl,
    description,
    updatedAt: new Date().toISOString(),
  };

  writeServers(servers);
  res.json({ data: servers[index] });
});

router.delete("/:id", (req, res) => {
  const servers = readServers();
  const filtered = servers.filter((s) => s.id !== req.params.id);

  if (filtered.length === servers.length) {
    return res.status(404).json({ error: "服务器不存在" });
  }

  writeServers(filtered);
  deleteConfig(req.params.id);
  res.status(204).send();
});

router.post("/check", async (req, res) => {
  const { baseUrl } = req.body;

  if (!baseUrl || typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
    return res.status(400).json({ error: "地址不能为空" });
  }

  const result = await checkHomepageConnection(baseUrl.trim());
  res.json({ data: result });
});

router.post("/:id/check", async (req, res) => {
  const servers = readServers();
  const server = servers.find((s) => s.id === req.params.id);

  if (!server) {
    return res.status(404).json({ error: "服务器不存在" });
  }

  const result = await checkHomepageConnection(server.baseUrl);
  res.json({ data: result });
});

export default router;
