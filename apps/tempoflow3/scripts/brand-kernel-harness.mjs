#!/usr/bin/env node
/**
 * Harness Node — même api-kernel + SQLite que le desktop (pas de store.json).
 * Usage: npm run build:electron && METIER_DATA_DIR=... METIER_PORT=... node scripts/brand-kernel-harness.mjs
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.METIER_PORT || process.env.PORT || 18791);
const DATA_DIR =
  process.env.METIER_DATA_DIR ||
  fs.mkdtempSync(path.join(os.tmpdir(), "tempoflow3-kernel-"));

const bootMod = await import(
  pathToFileURL(path.join(root, "build/electron/brand-runtime.js")).href
);
const { api, close } = bootMod.bootBrandKernel({ userDataDir: DATA_DIR });

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }
    const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
    const query = Object.fromEntries(url.searchParams.entries());
    const body = ["POST", "PUT", "PATCH"].includes(req.method || "")
      ? await readBody(req)
      : undefined;
    const result = await api.handle({
      method: req.method || "GET",
      path: url.pathname,
      body,
      query,
      headers: req.headers,
    });
    const payload = JSON.stringify(result.body ?? {});
    res.writeHead(result.status || 200, {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...(result.headers || {}),
    });
    res.end(payload);
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: String(err?.message || err) }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `brand-kernel-harness tempoflow3 on http://127.0.0.1:${PORT} data=${DATA_DIR}`,
  );
});

function shutdown() {
  server.close(() => {
    close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
