#!/usr/bin/env node
/**
 * Smoke générique tunnel Cloudflare provisioner (toutes marques).
 *
 * Env (dans l’ordre) :
 *   {ENV_PREFIX}_TUNNEL_PROVISION_URL / TOKEN
 *   CREEZIO_TUNNEL_PROVISION_URL / TOKEN
 *   TEMPOFLOW3_TUNNEL_* (legacy TF3)
 *
 * Usage :
 *   node …/smoke-tunnel.mjs
 *   CREEZIO_APP_ROOT=/path/to/brand node …/smoke-tunnel.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadLocalEnv } from "./load-local-env.mjs";

const root = path.resolve(process.env.CREEZIO_APP_ROOT || process.cwd());
loadLocalEnv(root);

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

console.log(
  "OK tunnel",
  JSON.stringify({
    health: healthJson.service,
    checkSlug: checkJson.slug,
    hostname: checkJson.hostname,
    available: checkJson.available,
  }),
);

void pathToFileURL;
