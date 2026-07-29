#!/usr/bin/env node
/**
 * Tests kit Phase C — tooling publish + feeds + config marque.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  certivanManifest,
  fiduManifest,
  latestYmlUrl,
  listBrandIds,
  resolveArtifactFileName,
  resolveLatestAlias,
  tempoflowManifest,
} from "../packages/brand-config/dist/index.js";
import {
  fetchBrandFeeds,
  fetchFeedSnapshot,
  parseLatestYml,
  resolvePublishConfig,
  toShellExports,
} from "../packages/desktop-tooling/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("manifests exposent publish Client+Serveur", () => {
  for (const m of [tempoflowManifest, certivanManifest, fiduManifest]) {
    assert.ok(m.publish?.dockerDlName, `${m.brandId} dockerDlName`);
    assert.ok(m.publish?.remoteBuildHost, `${m.brandId} remoteBuildHost`);
    assert.ok(m.publish?.statusFile, `${m.brandId} statusFile`);
    assert.ok(m.publish?.defaultAppRoot, `${m.brandId} defaultAppRoot`);
    assert.equal(typeof m.publish.buildServerArtifact, "boolean");
    assert.ok(m.client.feedUrl.endsWith("/"));
    assert.ok(m.server.feedUrl.includes("/server/"));
  }
  assert.equal(fiduManifest.publish.buildServerArtifact, false);
  assert.equal(certivanManifest.publish.buildServerArtifact, true);
  assert.equal(certivanManifest.publish.legacyClientAlias, "Certivan-Setup-0.1.0.exe");
});

test("resolveArtifactFileName / latest alias", () => {
  assert.equal(
    resolveArtifactFileName(tempoflowManifest.client, "0.10.26"),
    "TempoFlow-Setup-0.10.26.exe",
  );
  assert.equal(
    resolveLatestAlias(tempoflowManifest.server),
    "TempoFlow-Server-Setup-latest.exe",
  );
  assert.equal(
    latestYmlUrl(fiduManifest, "client"),
    "https://fidu.creez.io/dl-e660352fb04dbd5e2519f0e60897c548/latest.yml",
  );
});

test("resolvePublishConfig tempoflow client", () => {
  const cfg = resolvePublishConfig({
    brandId: "tempoflow",
    kind: "client",
    version: "0.10.26",
    appRoot: tempoflowManifest.publish.defaultAppRoot,
  });
  assert.equal(cfg.exeFileName, "TempoFlow-Setup-0.10.26.exe");
  assert.equal(cfg.dockerDlName, "dl-tempoflow");
  assert.equal(cfg.kind, "client");
  assert.ok(cfg.feedUrl.includes("crm.tempoflow.fr"));
  const sh = toShellExports(cfg);
  assert.match(sh, /CREEZIO_BRAND='tempoflow'/);
  assert.match(sh, /CREEZIO_EXE='TempoFlow-Setup-0.10.26.exe'/);
});

test("resolvePublishConfig certivan server", () => {
  const cfg = resolvePublishConfig({
    brandId: "certivan",
    kind: "server",
    version: "0.1.10",
  });
  assert.equal(cfg.exeFileName, "Certivan-Server-Setup-0.1.10.exe");
  assert.equal(cfg.distDir, "dist-electron-server");
  assert.ok(cfg.dockerDlDir.endsWith("/server"));
  assert.equal(cfg.legacyAlias, null);
});

test("parseLatestYml", () => {
  const meta = parseLatestYml(`version: 1.2.3
path: Foo-Setup-1.2.3.exe
releaseDate: '2026-07-01T00:00:00.000Z'
files:
  - url: Foo-Setup-1.2.3.exe
    size: 123
sha512: abc
`);
  assert.equal(meta.version, "1.2.3");
  assert.equal(meta.path, "Foo-Setup-1.2.3.exe");
  assert.equal(meta.size, 123);
});

test("scripts publish / remote-build / after-pack présents et exécutables", () => {
  const scripts = [
    "packages/desktop-tooling/scripts/publish-desktop.sh",
    "packages/desktop-tooling/scripts/remote-build-win.sh",
    "packages/desktop-tooling/scripts/after-pack.cjs",
    "packages/desktop-tooling/scripts/resolve-config.mjs",
    "packages/desktop-tooling/scripts/desktop-build-status.mjs",
  ];
  for (const rel of scripts) {
    const p = path.join(ROOT, rel);
    assert.ok(fs.existsSync(p), rel);
    if (rel.endsWith(".sh") || rel.endsWith(".mjs")) {
      fs.accessSync(p, fs.constants.X_OK);
    }
  }
});

test("resolve-config.mjs CLI --export-shell", () => {
  const res = spawnSync(
    "node",
    [
      path.join(ROOT, "packages/desktop-tooling/scripts/resolve-config.mjs"),
      "--brand=fidu",
      "--kind=client",
      "--version=0.1.51",
      "--export-shell",
    ],
    { encoding: "utf8" },
  );
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /CREEZIO_EXE='Fidu-Setup-0.1.51.exe'/);
  assert.match(res.stdout, /CREEZIO_DOCKER_DL_NAME='dl-fidu'/);
});

test("publish-desktop --dry-run sans artefacts → exit 1 attendu ou dry avant check", () => {
  // dry-run vérifie d'abord la présence des artefacts — OK si exit 1
  const res = spawnSync(
    "bash",
    [
      path.join(ROOT, "packages/desktop-tooling/scripts/publish-desktop.sh"),
      "--brand=tempoflow",
      "--kind=client",
      "--app-root",
      tempoflowManifest.publish.defaultAppRoot,
      "--dry-run",
    ],
    { encoding: "utf8" },
  );
  // Soit dry-run OK si artefacts présents, soit ERROR manquant
  assert.ok(
    res.status === 0 || /manquant|DRY-RUN|ERROR/.test(res.stdout + res.stderr),
    res.stdout + res.stderr,
  );
});

test("feeds live client (réseau)", () => {
  for (const brandId of listBrandIds()) {
    const snap = fetchFeedSnapshot(brandId, "client");
    assert.equal(snap.httpStatus, 200, `${brandId} client latest.yml`);
    assert.ok(snap.meta.version, `${brandId} version`);
    assert.ok(snap.downloadUrl, `${brandId} downloadUrl`);
  }
  const fiduServer = fetchFeedSnapshot("fidu", "server");
  assert.ok(
    fiduServer.httpStatus === 404 || !fiduServer.ok,
    "fidu server feed encore cible",
  );
  const all = fetchBrandFeeds("certivan");
  assert.ok(all.client.ok);
  assert.ok(all.server.ok);
});

test("console app présente", () => {
  assert.ok(fs.existsSync(path.join(ROOT, "apps/console/package.json")));
  assert.ok(fs.existsSync(path.join(ROOT, "apps/console/src/app/page.tsx")));
  assert.ok(
    fs.existsSync(path.join(ROOT, "apps/console/src/app/api/remote-build/route.ts")),
  );
});
