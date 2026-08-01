#!/usr/bin/env node
/**
 * Gate F0–F5 — factory --from-prd natif (api-kernel + SQLite).
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
const SMOKE_ENV = {
  ...process.env,
  CREEZIO_ROOT: ROOT,
  NODE_PATH: path.join(ROOT, "node_modules"),
  PATH: [
    path.join(ROOT, "node_modules", ".bin"),
    process.env.PATH || "",
  ].join(path.delimiter),
};

test("F0.1 factory AGENTS autorise --from-prd", () => {
  const agents = fs.readFileSync(
    path.join(ROOT, "packages/factory/AGENTS.md"),
    "utf8",
  );
  assert.match(agents, /--from-prd/);
  assert.match(agents, /ProductModel/);
});

test("F0.2 ADR factory-from-prd présent", () => {
  const adr = path.join(ROOT, "docs/ADR-factory-from-prd.md");
  assert.ok(fs.existsSync(adr));
  const body = fs.readFileSync(adr, "utf8");
  assert.match(body, /générateurs/);
});

test("F1.1 safeBrandId réserve tempoflow → tempoflow3", () => {
  assert.equal(safeBrandId("TempoFlow"), "tempoflow3");
  assert.equal(safeBrandId("tempoflow"), "tempoflow3");
  assert.equal(safeBrandId("Acme CHR"), "acmechr");
});

test("F1.2 parseProductPrd PRD TempoFlow → cœur achats (pas catalogue oracle)", () => {
  const md = fs.readFileSync(PRD, "utf8");
  const model = parseProductPrd(md, { sourcePath: PRD });
  assert.equal(model.brandId, EXPECTED.brandId);
  assert.deepEqual(
    model.entities.map((e) => e.id),
    EXPECTED.entityIds,
  );
  assert.equal(model.entities.length, 5);
  assert.ok(!model.entities.some((e) => e.id === "stack_items"));
});

test("F1.3 fixture gold = PRD expérience", () => {
  assert.ok(fs.existsSync(FIXTURE_PRD));
  assert.equal(fs.readFileSync(PRD, "utf8"), fs.readFileSync(FIXTURE_PRD, "utf8"));
});

test("F1.4 CLI accepte --from-prd", () => {
  const r = spawnSync(process.execPath, [CLI, "new-app", "--help"], {
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /--from-prd/);
});

test("F1–F4 scaffold --from-prd génère runtime natif (pas sidecar JSON)", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-from-prd-"));
  const r = spawnSync(
    process.execPath,
    [CLI, "new-app", "--from-prd", PRD, "--out", outDir, "--force"],
    { encoding: "utf8", cwd: ROOT },
  );
  assert.equal(r.status, 0, r.stderr + "\n" + r.stdout);

  const mustExist = [
    "product-model.json",
    "crm/src/brand/schema.sql",
    "scripts/brand-kernel-harness.mjs",
    "scripts/test-metier-parcours.mjs",
    "scripts/test-mini-prd-core.mjs",
    "scripts/test-meili-config.mjs",
    "src/electron/main.ts",
    "src/electron/brand-runtime.ts",
    "src/electron/brand-migrations.ts",
    "src/electron/brand-module-api.ts",
    "src/electron/meili-feed.ts",
    "src/electron/preload.ts",
    "ui/app/fournisseurs/page.tsx",
  ];
  for (const rel of mustExist) {
    assert.ok(fs.existsSync(path.join(outDir, rel)), `manquant: ${rel}`);
  }

  assert.ok(!fs.existsSync(path.join(outDir, "scripts/metier-api.mjs")));
  assert.ok(!fs.existsSync(path.join(outDir, "src/lib/brand-module-api.ts")));
  assert.ok(!fs.existsSync(path.join(ROOT, "packages/factory/templates/chr")));

  const main = fs.readFileSync(path.join(outDir, "src/electron/main.ts"), "utf8");
  assert.match(main, /bootBrandKernel/);
  assert.match(main, /createDesktopSessionStore/);
  assert.doesNotMatch(main, /spawnBrandMetierApi/);

  const runtime = fs.readFileSync(
    path.join(outDir, "src/electron/brand-runtime.ts"),
    "utf8",
  );
  assert.match(runtime, /createSqliteRuntime/);
  assert.match(runtime, /createApiKernel/);
  assert.match(runtime, /applyBrandMeiliConfig/);

  const mounts = fs.readFileSync(
    path.join(outDir, "src/electron/brand-module-api.ts"),
    "utf8",
  );
  assert.match(mounts, /registerModuleApi/);
  assert.match(mounts, /createSearchMount|"search"/);
  assert.doesNotMatch(mounts, /delegate_to_metier_api/);

  const feed = fs.readFileSync(
    path.join(outDir, "src/electron/meili-feed.ts"),
    "utf8",
  );
  assert.match(feed, /createChrCatalogMeiliFeed|brandMeiliFeed/);
  assert.doesNotMatch(feed, /tf2_produits|tf2_marketplaces/);

  const pkg = JSON.parse(fs.readFileSync(path.join(outDir, "package.json"), "utf8"));
  assert.equal(pkg.creezio?.nativeKernel, true);
  assert.ok(pkg.scripts["metier:api"].includes("brand-kernel-harness"));
  assert.ok(pkg.scripts["test:meili-config"]);
});

test("F3 smoke kernel natif sur app générée", () => {
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
    {
      encoding: "utf8",
      cwd: outDir,
      timeout: 120000,
      env: SMOKE_ENV,
    },
  );
  assert.equal(smoke.status, 0, smoke.stderr + "\n" + smoke.stdout);
  assert.match(smoke.stdout, /OK test:metier-parcours/);

  const firstRun = spawnSync(
    process.execPath,
    [path.join(outDir, "scripts/test-first-run-auth.mjs")],
    { encoding: "utf8", cwd: outDir, env: SMOKE_ENV },
  );
  assert.equal(firstRun.status, 0, firstRun.stderr + "\n" + firstRun.stdout);

  const setupLogin = spawnSync(
    process.execPath,
    [path.join(outDir, "scripts/test-setup-login.mjs")],
    { encoding: "utf8", cwd: outDir, timeout: 30000, env: SMOKE_ENV },
  );
  assert.equal(setupLogin.status, 0, setupLogin.stderr + "\n" + setupLogin.stdout);

  const allow = spawnSync(
    process.execPath,
    [path.join(outDir, "scripts/test-allowlist.mjs")],
    { encoding: "utf8", cwd: outDir, env: SMOKE_ENV },
  );
  assert.equal(allow.status, 0, allow.stderr + "\n" + allow.stdout);
});

test("F5 AGENTS racine documente brief produit", () => {
  const agents = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8");
  assert.match(agents, /brief produit/i);
  assert.match(agents, /--from-prd/);
});
