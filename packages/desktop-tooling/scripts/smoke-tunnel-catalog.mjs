#!/usr/bin/env node
/**
 * Smoke ops générique : provisioner tunnel + HEAD catalogue distant (optionnel).
 *
 *   node …/smoke-tunnel-catalog.mjs
 *   node …/smoke-tunnel-catalog.mjs --download   # marque doit brancher ensure
 *
 * Secrets : `<app>/.env` gitignoré.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadLocalEnv } from "./load-local-env.mjs";

const root = path.resolve(process.env.CREEZIO_APP_ROOT || process.cwd());
const doDownload = process.argv.includes("--download");
const envInfo = loadLocalEnv(root);

function readEnvPrefix() {
  try {
    const m = JSON.parse(
      fs.readFileSync(
        path.join(root, "src/electron/app-manifest.json"),
        "utf8",
      ),
    );
    return String(m.envPrefix || "").toUpperCase();
  } catch {
    return "";
  }
}

const prefix = readEnvPrefix();
const tunnelUrl = (
  (prefix && process.env[`${prefix}_TUNNEL_PROVISION_URL`]) ||
  process.env.CREEZIO_TUNNEL_PROVISION_URL ||
  process.env.TEMPOFLOW3_TUNNEL_PROVISION_URL ||
  ""
).replace(/\/$/, "");
const tunnelToken =
  (prefix && process.env[`${prefix}_TUNNEL_PROVISION_TOKEN`]) ||
  process.env.CREEZIO_TUNNEL_PROVISION_TOKEN ||
  process.env.TEMPOFLOW3_TUNNEL_PROVISION_TOKEN ||
  "";
const catalogUrl =
  (prefix && process.env[`${prefix}_CATALOG_URL`]) ||
  process.env.CREEZIO_CATALOG_URL ||
  process.env.TF3_CATALOG_URL ||
  process.env.TF2_CATALOG_URL ||
  "";

console.log(
  JSON.stringify(
    {
      envLoaded: envInfo.loaded,
      envKeys: envInfo.keys,
      tunnelUrlSet: Boolean(tunnelUrl),
      tunnelTokenLen: tunnelToken.length,
      catalogUrlSet: Boolean(catalogUrl),
    },
    null,
    2,
  ),
);

assert.ok(tunnelUrl, "TUNNEL_PROVISION_URL manquant (.env)");
assert.ok(tunnelToken, "TUNNEL_PROVISION_TOKEN manquant (.env)");

const health = await fetch(`${tunnelUrl}/health`);
assert.equal(health.status, 200, `tunnel /health HTTP ${health.status}`);
const healthJson = await health.json();
assert.equal(healthJson.ok, true);

const slug = `creezio-smoke-${Date.now().toString(36).slice(-6)}`;
const check = await fetch(`${tunnelUrl}/check?slug=${slug}`, {
  headers: { Authorization: `Bearer ${tunnelToken}` },
});
assert.equal(check.status, 200, `tunnel /check HTTP ${check.status}`);
const checkJson = await check.json();
assert.equal(checkJson.ok, true);
assert.equal(checkJson.available, true);
assert.ok(
  String(checkJson.hostname || "").includes("."),
  "hostname tunnel attendu",
);

console.log(
  "OK tunnel",
  JSON.stringify({
    health: healthJson.service,
    checkSlug: checkJson.slug,
    hostname: checkJson.hostname,
    available: checkJson.available,
  }),
);

if (!catalogUrl) {
  console.log("SKIP catalog (*_CATALOG_URL / CREEZIO_CATALOG_URL absent)");
  process.exit(0);
}

const head = await fetch(catalogUrl, { method: "HEAD" });
assert.equal(head.status, 200, `catalog HEAD HTTP ${head.status}`);
const len = Number(head.headers.get("content-length") || 0);
assert.ok(len > 1_000_000, `catalog trop petit (${len})`);
console.log(
  "OK catalog HEAD",
  JSON.stringify({
    bytes: len,
    type: head.headers.get("content-type"),
    urlHost: new URL(catalogUrl).host,
  }),
);

if (!doDownload) {
  const partial = await fetch(catalogUrl, {
    headers: { Range: "bytes=0-1" },
  });
  assert.ok([200, 206].includes(partial.status), `Range HTTP ${partial.status}`);
  const buf = Buffer.from(await partial.arrayBuffer());
  assert.equal(buf[0], 0x1f);
  assert.equal(buf[1], 0x8b);
  console.log("OK catalog gzip magic — relancer avec --download si besoin");
  process.exit(0);
}

// Délègue à un hook marque s’il existe
const brandHook = path.join(root, "scripts/smoke-tunnel-catalog.mjs");
const self = fileURLToPath(import.meta.url);
if (path.resolve(brandHook) !== path.resolve(self) && fs.existsSync(brandHook)) {
  const r = spawnSync(process.execPath, [brandHook, "--download"], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    stdio: "inherit",
  });
  process.exit(r.status ?? 1);
}

console.log("SKIP --download : brancher ensureCatalogue côté marque si requis");
process.exit(0);
