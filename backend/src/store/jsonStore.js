import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const FILE_PATH = join(DATA_DIR, "servers.json");

function ensureStore() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(FILE_PATH)) {
    writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
  }
}

export function readServers() {
  ensureStore();
  const raw = readFileSync(FILE_PATH, "utf-8");
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

export function writeServers(servers) {
  ensureStore();
  writeFileSync(FILE_PATH, JSON.stringify(servers, null, 2));
}
