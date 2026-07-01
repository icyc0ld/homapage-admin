import "dotenv/config";
import cors from "cors";
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import serversRouter from "./routes/servers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use("/api/servers", serversRouter);

app.use(express.static(join(__dirname, "../../frontend")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "homepage-admin-backend" });
});

app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../../frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`Homepage admin backend listening on port ${PORT}`);
});
