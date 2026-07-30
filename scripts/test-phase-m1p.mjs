/**
 * Phase M1p — propagate Database Certivan puis Fidu (vision stricte).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveBrandCrmRoot } from "./lib/brand-roots.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const certivan = resolveBrandCrmRoot("certivan-app");
const fidu = resolveBrandCrmRoot("fidu");

const FULL_VENDOR =
  /observability automations database|database.*observability|automations database/;

test("M1p.1 PHASE-M1p.md documente Certivan puis Fidu", () => {
  const doc = fs.readFileSync(path.join(root, "docs/PHASE-M1p.md"), "utf8");
  assert.match(doc, /Certivan/);
  assert.match(doc, /Fidu/);
  assert.match(doc, /liste complète/);
  assert.match(doc, /src\/lib\/database/);
  assert.doesNotMatch(doc, /stub = done/);
});

test("M1p.2 Certivan : plus de lib/database + brand host + @creezio/database", () => {
  assert.equal(fs.existsSync(path.join(certivan, "src/lib/database")), false);
  const host = fs.readFileSync(
    path.join(certivan, "src/lib/brand-host.ts"),
    "utf8",
  );
  assert.match(host, /@creezio\/database/);
  assert.match(host, /Certivan-Database-Automation/);
  const route = fs.readFileSync(
    path.join(certivan, "src/server/routes/admin-database.ts"),
    "utf8",
  );
  assert.match(route, /from ["']@creezio\/database["']/);
  assert.doesNotMatch(route, /from ["']@\/lib\/database/);
  const sync = fs.readFileSync(
    path.join(certivan, "scripts/electron/sync-creezio-vendor.sh"),
    "utf8",
  );
  assert.match(sync, FULL_VENDOR);
});

test("M1p.3 Fidu : brand host + migration kit + pas de lib/database", () => {
  assert.equal(fs.existsSync(path.join(fidu, "src/lib/database")), false);
  const host = fs.readFileSync(
    path.join(fidu, "src/lib/brand-host.ts"),
    "utf8",
  );
  assert.match(host, /configureFiduDatabaseHost/);
  assert.match(host, /FIDU_CRUD_WHITELIST/);
  // O2 : compose plateforme (plus de wrap steps/023)
  const compose = fs.readFileSync(
    path.join(fidu, "electron/migrations/platform-compose.ts"),
    "utf8",
  );
  assert.match(compose, /platformHistoricalMigrationByName|database-automations/);
  const sync = fs.readFileSync(
    path.join(fidu, "scripts/electron/sync-creezio-vendor.sh"),
    "utf8",
  );
  assert.match(sync, FULL_VENDOR);
  const pkg = JSON.parse(
    fs.readFileSync(path.join(fidu, "package.json"), "utf8"),
  );
  assert.ok(pkg.dependencies["@creezio/database"]);
  assert.ok(pkg.scripts["test:database-module"]);
});
