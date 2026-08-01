#!/usr/bin/env node
/**
 * Gate F0–F5 — factory --from-prd + ProductModel + métier CHR + wiring.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  parseProductPrd,
  safeBrandId,
  scaffoldNewApp,
} from "../packages/factory/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRD = path.join(
  ROOT,
  "docs/experiences/tempoflow3/PRD-PRODUIT.md",
);
const FIXTURE_PRD = path.join(
  ROOT,
  "packages/factory/fixtures/prd-tempoflow-produit.md",
);
const EXPECTED = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "packages/factory/fixtures/prd-tempoflow-produit.expected.json",
    ),
    "utf8",
  ),
);
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");

test("F0.1 factory AGENTS autorise --from-prd", () => {
  const agents = fs.readFileSync(
    path.join(ROOT, "packages/factory/AGENTS.md"),
    "utf8",
  );
  assert.match(agents, /--from-prd/);
  assert.match(agents, /ProductModel/);
  assert.match(agents, /Mode produit/);
});

test("F0.2 ADR factory-from-prd présent", () => {
  const adr = path.join(ROOT, "docs/ADR-factory-from-prd.md");
  assert.ok(fs.existsSync(adr), "ADR-factory-from-prd.md manquant");
  const body = fs.readFileSync(adr, "utf8");
  assert.match(body, /dossier marque|code métier généré/i);
  assert.match(body, /générateurs/);
});

test("F1.1 safeBrandId réserve tempoflow → tempoflow3", () => {
  assert.equal(safeBrandId("TempoFlow"), "tempoflow3");
  assert.equal(safeBrandId("tempoflow"), "tempoflow3");
  assert.equal(safeBrandId("Acme CHR"), "acmechr");
});

test("F1.2 parseProductPrd PRD TempoFlow → catalogue CHR", () => {
  const md = fs.readFileSync(PRD, "utf8");
  const model = parseProductPrd(md, { sourcePath: PRD });
  assert.equal(model.brandId, EXPECTED.brandId);
  assert.equal(model.brandName, EXPECTED.brandName);
  assert.deepEqual(
    model.entities.map((e) => e.id),
    EXPECTED.entityIds,
  );
  assert.deepEqual(
    model.pages.map((p) => p.path),
    EXPECTED.pagePaths,
  );
  assert.equal(model.vertical, "chr");
  assert.ok(model.entities.some((e) => e.id === "stack_items"));
  assert.ok(model.pages.some((p) => p.id === "optimiser"));
  assert.equal(model.flows[0]?.id, EXPECTED.flowId);
  assert.equal(model.platformNeeds.auth, true);
  assert.equal(model.platformNeeds.desktop, true);
});

test("F1.3 fixture gold = PRD expérience", () => {
  assert.ok(fs.existsSync(FIXTURE_PRD));
  const a = fs.readFileSync(PRD, "utf8");
  const b = fs.readFileSync(FIXTURE_PRD, "utf8");
  assert.equal(a, b);
});

test("F1.4 CLI accepte --from-prd (plus Argument inconnu)", () => {
  const r = spawnSync(
    process.execPath,
    [CLI, "new-app", "--help"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /--from-prd/);
});

test("F1–F4 scaffold --from-prd génère métier + wiring", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-from-prd-"));
  const r = spawnSync(
    process.execPath,
    [
      CLI,
      "new-app",
      "--from-prd",
      PRD,
      "--out",
      outDir,
      "--force",
    ],
    { encoding: "utf8", cwd: ROOT },
  );
  assert.equal(r.status, 0, r.stderr + "\n" + r.stdout);
  assert.match(r.stdout, /tempoflow3/);
  assert.match(r.stdout, /fournisseurs/);

  const mustExist = [
    "product-model.json",
    "crm/src/brand/schema.ts",
    "crm/src/brand/schema.sql",
    "scripts/metier-api.mjs",
    "scripts/test-metier-parcours.mjs",
    "scripts/test-first-run-auth.mjs",
    "scripts/test-allowlist.mjs",
    "scripts/test-desktop-smoke-profile.mjs",
    "ui/app/fournisseurs/page.tsx",
    "ui/app/panier/page.tsx",
    "ui/app/commandes/page.tsx",
    "ui/app/optimiser/page.tsx",
    "ui/app/dashboard/page.tsx",
    "src/lib/paths.ts",
    "src/lib/host-stack.ts",
    "src/lib/creezio-boot.ts",
    "src/lib/connection-profile.ts",
    "src/lib/brand-module-api.ts",
    "src/electron/main.ts",
    "src/electron/vertical-slot.ts",
    "resources/renderer/index.html",
  ];
  for (const rel of mustExist) {
    assert.ok(
      fs.existsSync(path.join(outDir, rel)),
      `manquant: ${rel}`,
    );
  }

  const main = fs.readFileSync(path.join(outDir, "src/electron/main.ts"), "utf8");
  assert.match(main, /installBrandDesktopRuntime/);

  const schema = fs.readFileSync(
    path.join(outDir, "crm/src/brand/schema.sql"),
    "utf8",
  );
  assert.match(schema, /CREATE TABLE IF NOT EXISTS fournisseurs/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS panier_lignes/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS commandes/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS stack_items/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS data_mappings/);

  const nav = fs.readFileSync(
    path.join(outDir, "src/electron/vertical-slot.ts"),
    "utf8",
  );
  assert.match(nav, /brand\.fournisseurs/);
  assert.match(nav, /brand\.panier/);
  assert.match(nav, /brand\.optimiser/);

  const api = fs.readFileSync(path.join(outDir, "scripts/metier-api.mjs"), "utf8");
  assert.match(api, /optimiser\/suggest/);
  assert.match(api, /scan\/start/);

  const pkg = JSON.parse(
    fs.readFileSync(path.join(outDir, "package.json"), "utf8"),
  );
  assert.equal(pkg.creezio?.fromPrd, true);
  assert.equal(pkg.creezio?.vertical, "chr");
  assert.ok(pkg.scripts["test:metier-parcours"]);
  assert.ok(pkg.scripts["test:allowlist"]);
  assert.ok(pkg.scripts["test:desktop-smoke-profile"]);
});

test("F3 smoke test:metier-parcours sur app générée", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-metier-"));
  const model = parseProductPrd(fs.readFileSync(PRD, "utf8"));
  scaffoldNewApp({
    brandId: model.brandId,
    productName: model.brandName,
    domain: model.domain,
    outDir,
    sandbox: true,
    force: true,
    productModel: model,
  });

  const smoke = spawnSync(
    process.execPath,
    [path.join(outDir, "scripts/test-metier-parcours.mjs")],
    { encoding: "utf8", cwd: outDir, timeout: 30000 },
  );
  assert.equal(smoke.status, 0, smoke.stderr + "\n" + smoke.stdout);
  assert.match(smoke.stdout, /OK test:metier-parcours/);

  const firstRun = spawnSync(
    process.execPath,
    [path.join(outDir, "scripts/test-first-run-auth.mjs")],
    { encoding: "utf8", cwd: outDir },
  );
  assert.equal(firstRun.status, 0, firstRun.stderr + "\n" + firstRun.stdout);

  const allow = spawnSync(
    process.execPath,
    [path.join(outDir, "scripts/test-allowlist.mjs")],
    { encoding: "utf8", cwd: outDir },
  );
  assert.equal(allow.status, 0, allow.stderr + "\n" + allow.stdout);

  const desk = spawnSync(
    process.execPath,
    [path.join(outDir, "scripts/test-desktop-smoke-profile.mjs")],
    { encoding: "utf8", cwd: outDir },
  );
  assert.equal(desk.status, 0, desk.stderr + "\n" + desk.stdout);
});

test("F5 AGENTS racine documente brief produit", () => {
  const agents = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8");
  assert.match(agents, /brief produit/i);
  assert.match(agents, /--from-prd/);
  assert.match(agents, /PROMPT-PRODUIT/);
});
