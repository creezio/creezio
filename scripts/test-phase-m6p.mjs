#!/usr/bin/env node
/**
 * Gate kit M6p — dual-reads legacy Certivan (préalable cutover marques).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`✗ ${name}:`, e instanceof Error ? e.message : e);
  }
}

check("n8n launcher dual-read .${prefix}-encryption-key / owner", () => {
  const src = read("packages/electron-shell/src/host/n8n/launcher.ts");
  assert.ok(src.includes("-encryption-key"));
  assert.ok(src.includes("-n8n-encryption-key"));
  assert.ok(src.includes("-owner.json"));
  assert.ok(src.includes("-n8n-owner.json"));
  assert.ok(src.includes("brandLegacy") || src.includes("secretPrefix()"));
});

check("hermes ensureApiKey brand-aware + clear certivan webui password", () => {
  const src = read("packages/electron-shell/src/host/hermes/launcher.ts");
  assert.ok(src.includes("-api-server-key"));
  assert.ok(src.includes("secretFilePrefix") || src.includes("manifest.brandId"));
  assert.ok(src.includes("certivan-webui-password"));
  assert.ok(src.includes("clearGeneratedWebuiPassword"));
});

check("hermes bootstrap WEBUI_DEPS_MARKER_LEGACY_CERTIVAN + FIDU", () => {
  const src = read(
    "packages/electron-shell/src/host/hermes/runtime-bootstrap.ts",
  );
  assert.ok(src.includes("WEBUI_DEPS_MARKER_LEGACY_CERTIVAN"));
  assert.ok(src.includes("WEBUI_DEPS_MARKER_LEGACY_FIDU"));
  assert.ok(src.includes(".certivan-webui-deps"));
  assert.ok(src.includes(".fidu-webui-deps"));
  assert.ok(src.includes(".certivan-webui-pin"));
  assert.ok(src.includes(".fidu-webui-pin"));
  const idx = read("packages/electron-shell/src/index.ts");
  assert.ok(idx.includes("WEBUI_DEPS_MARKER_LEGACY_CERTIVAN"));
  assert.ok(idx.includes("WEBUI_DEPS_MARKER_LEGACY_FIDU"));
  const hermes = read("packages/electron-shell/src/host/hermes/launcher.ts");
  assert.ok(hermes.includes("fidu-webui-password"));
});

check("PHASE-M6p.md présent", () => {
  assert.ok(fs.existsSync(path.join(root, "docs/archive/PHASE-M6p.md")));
  const doc = read("docs/archive/PHASE-M6p.md");
  assert.ok(doc.includes("Certivan"));
  assert.ok(doc.includes("Fidu"));
});

if (failed) {
  console.error(`\n${failed} échec(s) M6p`);
  process.exit(1);
}
console.log("\nOK test-phase-m6p");
