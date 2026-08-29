#!/usr/bin/env node
/**
 * Gate resolveManifest — registre + fallback app-manifest.json (from-prd).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  createAppManifest,
  listBrandIds,
  listProductionBrandIds,
  resolveManifest,
  isRegisteredBrandId,
} from "../packages/brand-config/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("registre : dépréciés (tempoflow/certivan/fidu) + demobrand — tempoflow3 SORTI (P1.d)", () => {
  // P1.d : le manifest tempoflow3 vit dans le repo marque (matérialisé) —
  // le kit ne le publie plus. Les 3 manifests prod historiques restent UNE
  // version (dépréciés, repos hors de portée), demobrand = sandbox kit.
  assert.deepEqual(
    [...listBrandIds()].sort(),
    ["certivan", "demobrand", "fidu", "tempoflow"],
  );
  assert.ok(!listBrandIds().includes("tempoflow3"));
  assert.ok(!listProductionBrandIds().includes("demobrand"));
  assert.equal(isRegisteredBrandId("tempoflow3"), false);
  assert.equal(isRegisteredBrandId("acme-future"), false);
});

test("resolveManifest registre", () => {
  const m = resolveManifest("tempoflow");
  assert.equal(m.brandId, "tempoflow");
  assert.ok(m.client.feedUrl.includes("tempoflow"));
});

test("resolveManifest from-prd via app-manifest.json", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "resolve-manifest-"));
  const manifest = createAppManifest({
    brandId: "acmechr",
    productName: "Acme CHR",
    domain: "acmechr.creez.io",
    sandbox: true,
    defaultAppRoot: dir,
  });
  fs.mkdirSync(path.join(dir, "src/electron"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "src/electron/app-manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  const resolved = resolveManifest("acmechr", { appRoot: dir });
  assert.equal(resolved.brandId, "acmechr");
  assert.equal(resolved.client.productName, "Acme CHR");
  assert.ok(resolved.sandbox);
});

test("resolveManifest inconnu sans JSON → erreur", () => {
  assert.throws(
    () => resolveManifest("no-such-brand-xyz", { appRoot: ROOT }),
    /Marque inconnue/,
  );
});
