#!/usr/bin/env node
/**
 * Tests kit Phase D — factory new-app + sandbox DemoBrand.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  createAppManifest,
  demobrandManifest,
  fiduManifest,
  listProductionBrandIds,
  nsisGuidFromAppId,
  tempoflowManifest,
  validateAppManifest,
  certivanManifest,
} from "../packages/brand-config/dist/index.js";
import { scaffoldNewApp } from "../packages/factory/dist/index.js";
import { buildElectronBuilderConfig } from "../packages/brand-config/dist/index.js";
import { resolvePublishConfig } from "../packages/desktop-tooling/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PROD_FEED_TOKENS = [
  "e660352fb04dbd5e2519f0e60897c548",
  "3c94d486b0efa7618fad5bdfff410c49",
];

test("nsisGuidFromAppId = UUID.v5 OID (fidu known)", () => {
  assert.equal(
    nsisGuidFromAppId("fr.fidu.desktop"),
    "f124e69d-95f4-5dd2-b199-5b89c875649d",
  );
  assert.equal(
    nsisGuidFromAppId("fr.fidu.desktop.server"),
    "9a6b4565-45b5-5572-a867-74ab1954e3da",
  );
});

test("createAppManifest + validate — Client+Serveur", () => {
  const m = createAppManifest({
    brandId: "acmeapp",
    productName: "AcmeApp",
    domain: "acme.creez.io",
    sandbox: true,
  });
  assert.equal(m.brandId, "acmeapp");
  assert.equal(m.envPrefix, "ACMEAPP");
  assert.equal(m.bridgeName, "acmeappDesktop");
  assert.equal(m.sandbox, true);
  assert.ok(m.client.appId.endsWith(".acmeapp"));
  assert.ok(m.server.appId.endsWith(".acmeapp.server"));
  assert.equal(m.client.nsisGuid, nsisGuidFromAppId(m.client.appId));
  assert.equal(m.server.nsisGuid, nsisGuidFromAppId(m.server.appId));
  assert.notEqual(m.client.nsisGuid, m.server.nsisGuid);
  assert.equal(m.publish.buildServerArtifact, true);
  assert.equal(m.publish.dockerDlName, "dl-acmeapp");
  assert.ok(m.client.feedUrl.includes("sandbox"));
  assert.deepEqual(validateAppManifest(m), []);
});

test("createAppManifest refuse marques prod", () => {
  assert.throws(() =>
    createAppManifest({
      brandId: "tempoflow",
      productName: "X",
      domain: "x.creez.io",
    }),
  );
  assert.throws(() =>
    createAppManifest({
      brandId: "fidu",
      productName: "X",
      domain: "x.creez.io",
    }),
  );
});

test("demobrand sandbox distinct des feeds/GUID prod", () => {
  assert.equal(demobrandManifest.sandbox, true);
  assert.deepEqual(validateAppManifest(demobrandManifest), []);
  for (const tok of PROD_FEED_TOKENS) {
    assert.ok(
      !demobrandManifest.client.feedUrl.includes(tok),
      `feed ne doit pas contenir ${tok}`,
    );
  }
  const prodGuids = new Set([
    tempoflowManifest.client.nsisGuid,
    tempoflowManifest.server.nsisGuid,
    certivanManifest.client.nsisGuid,
    certivanManifest.server.nsisGuid,
    fiduManifest.client.nsisGuid,
    fiduManifest.server.nsisGuid,
  ]);
  assert.ok(!prodGuids.has(demobrandManifest.client.nsisGuid));
  assert.ok(!prodGuids.has(demobrandManifest.server.nsisGuid));
  assert.equal(demobrandManifest.publish.dockerDlName, "dl-demobrand");
  assert.notEqual(demobrandManifest.publish.dockerDlName, "dl-tempoflow");
  assert.notEqual(demobrandManifest.publish.dockerDlName, "dl-fidu");
  assert.notEqual(demobrandManifest.publish.dockerDlName, "dl-certivan");
});

test("listProductionBrandIds exclut demobrand", () => {
  const prod = listProductionBrandIds();
  assert.ok(prod.includes("tempoflow"));
  assert.ok(prod.includes("certivan"));
  assert.ok(prod.includes("fidu"));
  assert.ok(!prod.includes("demobrand"));
});

test("scaffoldNewApp génère structure + builder configs", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-factory-"));
  const outDir = path.join(tmp, "sandboxapp");
  const result = scaffoldNewApp({
    brandId: "sandboxapp",
    productName: "SandboxApp",
    domain: "sandboxapp.creez.io",
    outDir,
    force: true,
  });
  assert.equal(result.manifest.brandId, "sandboxapp");
  const required = [
    "package.json",
    "README.md",
    "src/electron/main.ts",
    "src/electron/preload.ts",
    "src/electron/nav-core.ts",
    "src/electron/vertical-slot.ts",
    "src/electron/product-hub-stub.ts",
    "src/electron/app-manifest.ts",
    "electron-builder.base.json",
    "electron-builder.client.json",
    "electron-builder.server.json",
    "scripts/build-builder-config.mjs",
  ];
  for (const rel of required) {
    assert.ok(fs.existsSync(path.join(outDir, rel)), rel);
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(outDir, "package.json"), "utf8"),
  );
  assert.ok(pkg.dependencies["@creezio/product-hub"]);
  assert.ok(pkg.dependencies["@creezio/shell-ui"]);
  assert.ok(pkg.dependencies["@creezio/api-kernel"]);
  assert.ok(pkg.dependencies["@creezio/auth"]);
  assert.ok(pkg.dependencies["@creezio/app-runtime"]);
  const main = fs.readFileSync(
    path.join(outDir, "src/electron/main.ts"),
    "utf8",
  );
  assert.match(main, /startBrandDesktop/);
  assert.match(main, /desktopShell/);
  assert.doesNotMatch(main, /prepareDesktopBoot/);
  assert.ok(fs.existsSync(path.join(outDir, "src/electron/brand-migrations.ts")));
  assert.ok(
    fs.existsSync(path.join(outDir, "scripts/brand-kernel-harness.mjs")),
  );
  const vertical = fs.readFileSync(
    path.join(outDir, "src/electron/vertical-slot.ts"),
    "utf8",
  );
  assert.match(vertical, /registerBrandNav\(\[\]\)/);
  assert.match(vertical, /productHub/);
  assert.doesNotMatch(vertical, /catalogue|tempoflow/i);
  const hubStub = fs.readFileSync(
    path.join(outDir, "src/electron/product-hub-stub.ts"),
    "utf8",
  );
  assert.match(hubStub, /@creezio\/product-hub/);
  assert.doesNotMatch(hubStub, /TEMPOFLOW_|CERTIVAN_/);
  const nav = fs.readFileSync(
    path.join(outDir, "src/electron/nav-core.ts"),
    "utf8",
  );
  assert.match(nav, /PAS de catalogue TempoFlow/);

  const clientCfg = JSON.parse(
    fs.readFileSync(path.join(outDir, "electron-builder.client.json"), "utf8"),
  );
  const serverCfg = JSON.parse(
    fs.readFileSync(path.join(outDir, "electron-builder.server.json"), "utf8"),
  );
  assert.equal(clientCfg.appId, result.manifest.client.appId);
  assert.equal(serverCfg.appId, result.manifest.server.appId);
  assert.equal(clientCfg.nsis.guid, result.manifest.client.nsisGuid);
  assert.equal(serverCfg.nsis.guid, result.manifest.server.nsisGuid);
  assert.equal(clientCfg.directories.output, "dist-electron");
  assert.equal(serverCfg.directories.output, "dist-electron-server");

  fs.rmSync(tmp, { recursive: true, force: true });
});

test("CLI creezio new-app", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-cli-"));
  const outDir = path.join(tmp, "clipapp");
  const res = spawnSync(
    "node",
    [
      path.join(ROOT, "packages/factory/bin/creezio.js"),
      "new-app",
      "--name",
      "ClipApp",
      "--id",
      "clipapp",
      "--domain",
      "clipapp.creez.io",
      "--out",
      outDir,
      "--force",
    ],
    { encoding: "utf8" },
  );
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.match(res.stdout, /AppManifest clipapp/);
  assert.ok(fs.existsSync(path.join(outDir, "package.json")));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("sandbox demobrand présente et compilée", () => {
  const app = path.join(ROOT, "apps/demobrand");
  assert.ok(fs.existsSync(path.join(app, "package.json")));
  assert.ok(fs.existsSync(path.join(app, "build/electron/main.js")));
  assert.ok(fs.existsSync(path.join(app, "build/electron/preload.js")));
  assert.ok(fs.existsSync(path.join(app, "electron-builder.client.json")));
  assert.ok(fs.existsSync(path.join(app, "electron-builder.server.json")));
  const pkg = JSON.parse(
    fs.readFileSync(path.join(app, "package.json"), "utf8"),
  );
  assert.equal(pkg.name, "@creezio/app-demobrand");
  for (const dep of [
    "@creezio/brand-config",
    "@creezio/shell",
    "@creezio/platform-core",
    "@creezio/electron-shell",
    "@creezio/desktop-tooling",
  ]) {
    assert.ok(pkg.dependencies[dep], dep);
  }
});

test("buildElectronBuilderConfig demobrand", () => {
  const base = {
    files: ["build/electron/**/*"],
    extraResources: [{ from: "build/electron", to: "build/electron" }],
  };
  const client = buildElectronBuilderConfig(demobrandManifest, "client", base);
  const server = buildElectronBuilderConfig(demobrandManifest, "server", base);
  assert.equal(client.appId, "io.creezio.demobrand");
  assert.equal(server.appId, "io.creezio.demobrand.server");
  assert.equal(client.publish.url, demobrandManifest.client.feedUrl);
  assert.equal(server.publish.url, demobrandManifest.server.feedUrl);
});

test("resolvePublishConfig demobrand dry-run ready", () => {
  const cfg = resolvePublishConfig({
    brandId: "demobrand",
    kind: "client",
    version: "0.1.0",
    appRoot: demobrandManifest.publish.defaultAppRoot,
  });
  assert.equal(cfg.dockerDlName, "dl-demobrand");
  assert.equal(cfg.exeFileName, "DemoBrand-Setup-0.1.0.exe");
  assert.ok(cfg.feedUrl.includes("sandbox"));
  assert.ok(!cfg.feedUrl.includes("e660352fb04dbd5e2519f0e60897c548"));
});

test("docs PHASE-D.md + factory package", () => {
  assert.ok(fs.existsSync(path.join(ROOT, "docs/PHASE-D.md")));
  assert.ok(
    fs.existsSync(path.join(ROOT, "packages/factory/package.json")),
  );
  assert.ok(fs.existsSync(path.join(ROOT, "packages/factory/bin/creezio.js")));
});

test("npm run factory:new-app --help", () => {
  const res = spawnSync(
    "npm",
    ["run", "factory:new-app", "--", "--help"],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout + res.stderr, /new-app/);
});
