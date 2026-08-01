#!/usr/bin/env node
/**
 * Cold-start OS : userData vide + warm n8n réel + /os/ready.
 * Hermes skip par défaut (install lourde) — CREEZIO_COLD_WARM_HERMES=1 pour inclure.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startBrandKernelHarness } from "../packages/app-runtime/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TF3 = path.join(ROOT, "apps/tempoflow3");

test("cold-warm n8n + os/ready sur TF3 (userData neuf)", async () => {
  if (!fs.existsSync(path.join(TF3, "src/electron/brand-migrations.ts"))) {
    return;
  }
  const build = spawnSync(
    process.execPath,
    [path.join(ROOT, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.electron.json"],
    {
      encoding: "utf8",
      cwd: TF3,
      env: {
        ...process.env,
        CREEZIO_ROOT: ROOT,
        NODE_PATH: path.join(ROOT, "node_modules"),
      },
    },
  );
  assert.equal(build.status, 0, build.stderr);

  const electron = path.join(TF3, "build/electron");
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

  // Libère un éventuel n8n zombie left by proof:hard (port fixe 15678).
  try {
    spawnSync("fuser", ["-k", "15678/tcp"], { encoding: "utf8" });
  } catch {
    /* */
  }

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "os-cold-warm-"));
  const prevWarm = process.env.CREEZIO_NATIVE_WARM;
  const prevHermes = process.env.CREEZIO_NATIVE_WARM_HERMES;
  const prevStart = process.env.CREEZIO_NATIVE_START;
  process.env.CREEZIO_NATIVE_WARM = "1";
  process.env.CREEZIO_NATIVE_START = "1";
  process.env.CREEZIO_NATIVE_WARM_HERMES =
    process.env.CREEZIO_COLD_WARM_HERMES === "1" ? "1" : "0";
  process.env.CREEZIO_TUNNEL_LOCAL = "1";

  let handle;
  try {
    handle = await startBrandKernelHarness({
      brandId: "tempoflow3",
      appRoot: TF3,
      dataDir,
      manifest: manifestMod[manifestKey],
      brandMigrations: migMod.brandMigrations(),
      registerModuleApi: apiMod.registerBrandModuleApi,
      beforeBoot: feedMod.applyBrandMeiliConfig,
      meiliFeed: feedMod.brandMeiliFeed,
      skipIndex: true,
    });

    const ready = await fetch(`${handle.baseUrl}/api/v1/os/ready`);
    const readyBody = await ready.json();
    assert.equal(ready.status, 200, JSON.stringify(readyBody));
    assert.equal(readyBody.ready, true, JSON.stringify(readyBody));
    assert.equal(readyBody.checks.kitN8nVendor, true);
    assert.equal(readyBody.checks.tunnelMcpSurface, true);

    const n8n = await fetch(`${handle.baseUrl}/api/v1/os/n8n/status`);
    const n8nBody = await n8n.json();
    assert.equal(n8n.status, 200);
    assert.ok(
      n8nBody.nativeReady || n8nBody.entry,
      `n8n entry attendu: ${JSON.stringify(n8nBody)}`,
    );

    // Soft : started peut timeout owner HTTP mais entry doit exister après warm
    assert.ok(
      readyBody.soft?.n8nEntry === true || n8nBody.entry,
      "n8n soft entry",
    );
  } finally {
    await handle?.close();
    if (prevWarm === undefined) delete process.env.CREEZIO_NATIVE_WARM;
    else process.env.CREEZIO_NATIVE_WARM = prevWarm;
    if (prevHermes === undefined) delete process.env.CREEZIO_NATIVE_WARM_HERMES;
    else process.env.CREEZIO_NATIVE_WARM_HERMES = prevHermes;
    if (prevStart === undefined) delete process.env.CREEZIO_NATIVE_START;
    else process.env.CREEZIO_NATIVE_START = prevStart;
  }
}, { timeout: 600_000 });
