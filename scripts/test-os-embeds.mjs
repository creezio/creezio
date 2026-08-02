#!/usr/bin/env node
/**
 * Gate OS — embeds Hermes/n8n + catalogue env (port TF2 hermes-embed / n8n-embed / embed-env).
 * Tests purs platform-core — pas de spawn Electron.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  HERMES_DEFAULT_API_PORT,
  N8N_LOCKED_KEYS,
  OS_SANDBOX_LOCKED_KEYS,
  buildHermesHomeEnvFile,
  buildN8nSpawnEnv,
  hermesBinaryCandidates,
  mergeEmbedUserEnv,
  resolveHermesBinary,
  sanitizeHermesEmbedConfig,
  shouldSpawnEmbeddedHermes,
} from "../packages/platform-core/dist/index.js";
import { kitOsVendorDir } from "../packages/electron-shell/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("embeds.hermes — sanitize + spawn gate", () => {
  const cfg = sanitizeHermesEmbedConfig(null);
  assert.equal(cfg.mode, "embedded");
  assert.equal(
    shouldSpawnEmbeddedHermes({
      connectionMode: "local",
      hermes: cfg,
    }),
    true,
  );
  assert.equal(
    shouldSpawnEmbeddedHermes({
      connectionMode: "remote",
      hermes: cfg,
    }),
    false,
  );
  assert.ok(HERMES_DEFAULT_API_PORT > 0);
  assert.ok(hermesBinaryCandidates("linux").includes("hermes"));
  assert.ok(hermesBinaryCandidates("win32").includes("hermes.exe"));
});

test("embeds.hermes — resolveBinary sans match → null", () => {
  const bin = resolveHermesBinary({
    platform: process.platform,
    searchDirs: [path.join(ROOT, "scripts")],
    allowEnvOverride: false,
    existsSync: () => false,
  });
  assert.equal(bin, null);
});

test("embeds.hermes — buildHermesHomeEnvFile + bridge CRM", () => {
  const env = buildHermesHomeEnvFile({
    apiKey: "hermes-local-key",
    apiPort: HERMES_DEFAULT_API_PORT,
    bridgeEnv: {
      TEMPOFLOW3_API_KEY: "tf3_live_test",
      TEMPOFLOW3_API_URL: "http://127.0.0.1:18790",
    },
  });
  assert.match(env, /API_SERVER_KEY/);
  assert.match(env, /hermes-local-key/);
  assert.match(env, /TEMPOFLOW3_API_KEY/);
  assert.match(env, /tf3_live_test/);
});

test("embeds.n8n — buildN8nSpawnEnv + locked keys", () => {
  assert.ok(N8N_LOCKED_KEYS.includes("N8N_USER_FOLDER"));
  assert.ok(N8N_LOCKED_KEYS.includes("HOME"));
  assert.ok(OS_SANDBOX_LOCKED_KEYS.includes("PATH"));
  assert.ok(OS_SANDBOX_LOCKED_KEYS.includes("XDG_CACHE_HOME"));
  const env = buildN8nSpawnEnv({
    userFolder: "/tmp/creezio-n8n-home-test",
    port: 5678,
    publicBaseUrl: "http://127.0.0.1:5678",
    encryptionKey: "test-key-32-chars-padding!!!!!!",
    baseEnv: { PATH: "/usr/bin" },
  });
  assert.equal(env.N8N_PORT, "5678");
  assert.equal(env.N8N_USER_FOLDER, "/tmp/creezio-n8n-home-test");
  assert.equal(env.N8N_ENCRYPTION_KEY, "test-key-32-chars-padding!!!!!!");
});

test("embeds.env — mergeEmbedUserEnv respecte locked system", () => {
  const merged = mergeEmbedUserEnv({
    service: "n8n",
    systemEnv: { N8N_PORT: "5678", CUSTOM_A: "1" },
    userOverlay: { N8N_PORT: "9999", CUSTOM_A: "2", CUSTOM_B: "3" },
  });
  assert.equal(merged.N8N_PORT, "5678");
  assert.equal(merged.CUSTOM_B, "3");
});

test("embeds.vendors — runtime-manifest hermes + n8n", () => {
  for (const name of ["n8n", "hermes-agent"]) {
    const manifest = path.join(kitOsVendorDir(name), "runtime-manifest.json");
    assert.ok(fs.existsSync(manifest), manifest);
    const m = JSON.parse(fs.readFileSync(manifest, "utf8"));
    assert.ok(m.decision || m.version || m.sha256 || m.webui);
  }
});
