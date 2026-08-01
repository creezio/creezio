#!/usr/bin/env node
/**
 * Gate OS native plug-and-play — multi-marques (pas TF3-only).
 *
 * Prouve qu'une app neuve (brand apply) démarre avec :
 * - main mince startBrandDesktop + desktopShell runtime
 * - vendor/binaires dans le kit (jamais resources/vendor marque)
 * - electron-builder injecte kit vendor+bin
 * - harness compose OS + /api/v1/os/ready + MCP + tunnel local
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ensureKitOsBinaries,
  kitBinaryPaths,
  kitOsVendorDir,
} from "../packages/electron-shell/dist/index.js";
import { startBrandKernelHarness } from "../packages/app-runtime/dist/index.js";
import { buildElectronBuilderConfig } from "../packages/brand-config/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");
const SMOKE_ENV = {
  ...process.env,
  CREEZIO_ROOT: ROOT,
  CREEZIO_NATIVE_WARM: "0",
  CREEZIO_TUNNEL_LOCAL: "1",
  NODE_PATH: path.join(ROOT, "node_modules"),
  PATH: [
    path.join(ROOT, "node_modules", ".bin"),
    process.env.PATH || "",
  ].join(path.delimiter),
};

function runCli(args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    cwd: ROOT,
    env: SMOKE_ENV,
  });
}

test("PnP1 binaires + vendors kit présents (ensure)", async () => {
  const bins = await ensureKitOsBinaries();
  assert.ok(bins.meili, `meili manquant: ${bins.errors.join("; ")}`);
  assert.ok(
    bins.cloudflared || bins.errors.some((e) => e.includes("cloudflared")),
    "cloudflared doit être présent ou erreur explicite",
  );
  const paths = kitBinaryPaths();
  assert.ok(paths.meili && fs.existsSync(paths.meili));
  assert.ok(
    fs.existsSync(path.join(kitOsVendorDir("n8n"), "runtime-manifest.json")),
    "vendor n8n kit",
  );
  assert.ok(
    fs.existsSync(
      path.join(kitOsVendorDir("hermes-agent"), "runtime-manifest.json"),
    ),
    "vendor hermes kit",
  );
});

test("PnP2 brand apply → main P&P + pas de vendor marque", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "os-pnp-apply-"));
  const specDir = path.join(work, "brand-spec");
  const appDir = path.join(work, "app");

  const init = runCli([
    "brand",
    "init",
    "--id",
    "pnpprobe",
    "--name",
    "PnpProbe",
    "--domain",
    "pnpprobe.local",
    "--vertical",
    "generic",
    "--out",
    specDir,
    "--force",
  ]);
  assert.equal(init.status, 0, init.stderr + "\n" + init.stdout);

  fs.writeFileSync(
    path.join(specDir, "product.md"),
    `# PnpProbe

Catalogue simple.

## Utilisateurs

- Opérateurs

## Parcours

1. Lister les articles
2. Créer un article

## Entités

### Articles
- nom (texte)
- prix (nombre)

## Plateforme

Desktop Creezio natif.
`,
    "utf8",
  );

  const apply = runCli([
    "brand",
    "apply",
    "--spec",
    specDir,
    "--out",
    appDir,
    "--force",
  ]);
  assert.equal(apply.status, 0, apply.stderr + "\n" + apply.stdout);

  const main = fs.readFileSync(
    path.join(appDir, "src/electron/main.ts"),
    "utf8",
  );
  assert.match(main, /startBrandDesktop/);
  assert.match(main, /@creezio\/app-runtime/);
  assert.match(main, /desktopShell/);
  assert.match(main, /CREEZIO_DESKTOP_SHELL === "window"/);
  assert.doesNotMatch(
    main,
    /prepareDesktopBoot|listenBrandKernelHttp|bootBrandKernel|brand-runtime/,
  );
  assert.ok(
    !fs.existsSync(path.join(appDir, "resources/vendor")),
    "vendor OS interdit dans la marque",
  );
  assert.ok(!fs.existsSync(path.join(appDir, "src/lib/host-stack.ts")));
  assert.ok(!fs.existsSync(path.join(appDir, "src/electron/brand-runtime.ts")));

  const harness = fs.readFileSync(
    path.join(appDir, "scripts/brand-kernel-harness.mjs"),
    "utf8",
  );
  assert.match(harness, /startBrandKernelHarness/);

  // electron-builder doit injecter kit vendor + bin
  const manifest = JSON.parse(
    fs.readFileSync(path.join(appDir, "src/electron/app-manifest.json"), "utf8"),
  );
  const base = JSON.parse(
    fs.readFileSync(path.join(appDir, "electron-builder.base.json"), "utf8"),
  );
  const cfg = buildElectronBuilderConfig(manifest, "client", base);
  const froms = (cfg.extraResources || []).map((e) =>
    typeof e === "string" ? e : String(e.from || ""),
  );
  assert.ok(
    froms.some((f) => f.includes("electron-shell/resources/vendor")),
    `extraResources vendor kit manquant: ${JSON.stringify(froms)}`,
  );
  assert.ok(
    froms.some((f) => f.includes("electron-shell/resources/bin")),
    `extraResources bin kit manquant: ${JSON.stringify(froms)}`,
  );

  // Persiste chemin pour PnP3
  fs.writeFileSync(path.join(work, "APP_DIR"), appDir, "utf8");
  globalThis.__PNP_APP_DIR = appDir;
});

test("PnP3 harness OS ready sur marque apply (non-TF3)", async () => {
  const appDir =
    globalThis.__PNP_APP_DIR ||
    (() => {
      throw new Error("PnP2 doit précéder PnP3");
    })();

  const build = spawnSync("npx", ["tsc", "-p", "tsconfig.electron.json"], {
    encoding: "utf8",
    cwd: appDir,
    env: SMOKE_ENV,
    shell: true,
  });
  assert.equal(build.status, 0, build.stderr + "\n" + build.stdout);

  const electron = path.join(appDir, "build/electron");
  const manifestMod = await import(
    pathToFileURL(path.join(electron, "app-manifest.js")).href
  );
  const migMod = await import(
    pathToFileURL(path.join(electron, "brand-migrations.js")).href
  );
  const apiMod = await import(
    pathToFileURL(path.join(electron, "brand-module-api.js")).href
  );
  const feedMod = await import(
    pathToFileURL(path.join(electron, "meili-feed.js")).href
  );
  const manifestKey = Object.keys(manifestMod).find((k) =>
    k.endsWith("Manifest"),
  );
  assert.ok(manifestKey, "manifest export");

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "os-pnp-data-"));
  const handle = await startBrandKernelHarness({
    brandId: "pnpprobe",
    appRoot: appDir,
    dataDir,
    manifest: manifestMod[manifestKey],
    brandMigrations: migMod.brandMigrations(),
    registerModuleApi: apiMod.registerBrandModuleApi,
    beforeBoot: feedMod.applyBrandMeiliConfig,
    meiliFeed: feedMod.brandMeiliFeed,
    skipIndex: true,
  });

  try {
    const arch = await fetch(`${handle.baseUrl}/api/v1/core/architecture`);
    assert.equal(arch.status, 200);

    const status = await fetch(`${handle.baseUrl}/api/v1/os/status`);
    assert.equal(status.status, 200);
    const statusBody = await status.json();
    assert.equal(statusBody.ok, true);
    assert.equal(statusBody.brandId, "pnpprobe");
    assert.equal(statusBody.hosts.n8n, true);
    assert.equal(statusBody.hosts.hermes, true);
    assert.equal(statusBody.hosts.tunnel, true);

    const hosts = await fetch(`${handle.baseUrl}/api/v1/os/hosts`);
    assert.equal(hosts.status, 200);
    const hostsBody = await hosts.json();
    assert.equal(hostsBody.constructed.n8n, true);
    assert.equal(hostsBody.constructed.hermes, true);
    assert.equal(hostsBody.constructed.tunnel, true);

    const n8n = await fetch(`${handle.baseUrl}/api/v1/os/n8n/status`);
    assert.equal(n8n.status, 200);
    const n8nBody = await n8n.json();
    assert.equal(n8nBody.ok, true);
    // nativeReady = entry installée OU au minimum vendor kit résolu via ensure path
    assert.ok(
      n8nBody.nativeReady === true ||
        fs.existsSync(
          path.join(kitOsVendorDir("n8n"), "runtime-manifest.json"),
        ),
      "n8n vendor kit doit permettre native ensure",
    );

    const hermes = await fetch(`${handle.baseUrl}/api/v1/os/hermes/status`);
    assert.equal(hermes.status, 200);
    const hermesBody = await hermes.json();
    assert.equal(hermesBody.ok, true);

    const tunnel = await fetch(`${handle.baseUrl}/api/v1/os/tunnel/status`);
    assert.equal(tunnel.status, 200);
    const tunnelBody = await tunnel.json();
    assert.ok(
      tunnelBody.publicMcp,
      `publicMcp attendu: ${JSON.stringify(tunnelBody)}`,
    );
    assert.match(String(tunnelBody.publicMcp), /\/mcp$/);

    const mcp = await fetch(`${handle.baseUrl}/mcp`);
    assert.equal(mcp.status, 200);
    const mcpBody = await mcp.json();
    assert.ok(Array.isArray(mcpBody.tools) && mcpBody.tools.length > 0);

    const ready = await fetch(`${handle.baseUrl}/api/v1/os/ready`);
    const readyBody = await ready.json();
    assert.equal(
      ready.status,
      200,
      `os/ready: ${JSON.stringify(readyBody)}`,
    );
    assert.equal(readyBody.ready, true, JSON.stringify(readyBody));
    assert.equal(readyBody.checks.kitN8nVendor, true);
    assert.equal(readyBody.checks.kitHermesVendor, true);
    assert.equal(readyBody.checks.kitMeili, true);
    assert.equal(readyBody.checks.tunnelMcpSurface, true);
    assert.equal(readyBody.checks.mcpTools, true);
    assert.equal(readyBody.checks.apiMounts, true);
  } finally {
    await handle.close();
  }
});

test("PnP4 défauts app-runtime = shell runtime + ensure binaries", () => {
  const desktop = fs.readFileSync(
    path.join(ROOT, "packages/app-runtime/src/start-brand-desktop.ts"),
    "utf8",
  );
  assert.match(desktop, /desktopShell = config\.desktopShell \|\| "runtime"/);
  assert.match(desktop, /ensureKitOsBinaries/);
  assert.match(desktop, /kitBinaryPaths\(\)\.meili/);
  assert.match(desktop, /warmBrandNativeHosts/);
  assert.match(desktop, /enableLocalPublicSurface/);

  const harness = fs.readFileSync(
    path.join(ROOT, "packages/app-runtime/src/start-brand-kernel-harness.ts"),
    "utf8",
  );
  assert.match(harness, /ensureKitOsBinaries/);
  assert.match(harness, /kitBinaryPaths/);

  const factory = fs.readFileSync(
    path.join(
      ROOT,
      "packages/factory/src/generators/native-runtime.ts",
    ),
    "utf8",
  );
  assert.match(factory, /desktopShell:/);
  assert.match(factory, /CREEZIO_DESKTOP_SHELL/);
});
