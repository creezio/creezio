#!/usr/bin/env node
/**
 * MCP OAuth + admin — prouvable en local (sans Cloudflare).
 * Harness si probe brand résolu hors monorepo kit.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startBrandKernelHarness } from "../packages/app-runtime/dist/index.js";
import { resolveProbeBrandServerDir } from "./lib/resolve-probe-brand.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TF3 = resolveProbeBrandServerDir(ROOT);

test("mcp oauth well-known + DCR + admin status", async () => {
  if (!TF3 || !fs.existsSync(path.join(TF3, "src/electron/brand-migrations.ts"))) {
    console.log(
      "skip: probe brand absent (CREEZIO_TEMPOFLOW3_ROOT / ../tempoflow3)",
    );
    return;
  }
  const build = spawnSync(
    process.execPath,
    [
      path.join(ROOT, "node_modules/typescript/bin/tsc"),
      "-p",
      "tsconfig.electron.json",
    ],
    {
      encoding: "utf8",
      cwd: TF3,
      env: {
        ...process.env,
        CREEZIO_KIT_ROOT: ROOT,
        CREEZIO_ROOT: ROOT, // legacy compat (Q8)
        NODE_PATH: path.join(ROOT, "node_modules"),
        CREEZIO_NATIVE_WARM: "0",
      },
    },
  );
  assert.equal(build.status, 0, build.stderr);

  const electron = path.join(TF3, "build/electron");
  const manifestMod = await import(
    pathToFileURL(path.join(electron, "app-manifest.js")).href,
  );
  const migMod = await import(
    pathToFileURL(path.join(electron, "brand-migrations.js")).href,
  );
  const apiMod = await import(
    pathToFileURL(path.join(electron, "brand-module-api.js")).href,
  );
  const feedMod = await import(
    pathToFileURL(path.join(electron, "meili-feed.js")).href,
  );
  const manifestKey = Object.keys(manifestMod).find((k) =>
    k.endsWith("Manifest"),
  );

  process.env.CREEZIO_NATIVE_WARM = "0";
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "os-mcp-oauth-"));
  const handle = await startBrandKernelHarness({
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

  try {
    const status = await (
      await fetch(`${handle.baseUrl}/api/v1/os/mcp-oauth/status`)
    ).json();
    assert.equal(status.ok, true, JSON.stringify(status));
    assert.equal(status.oauthReady, true, JSON.stringify(status));
    assert.ok(status.publicUrl);

    const wellKnown = await fetch(
      `${handle.baseUrl}/.well-known/oauth-authorization-server`,
    );
    const meta = await wellKnown.json();
    assert.equal(wellKnown.status, 200, JSON.stringify(meta));
    assert.ok(meta.authorization_endpoint || meta.issuer, JSON.stringify(meta));

    const reg = await fetch(`${handle.baseUrl}/oauth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_name: "proof-local",
        redirect_uris: [`${handle.baseUrl}/oauth/callback`],
        token_endpoint_auth_method: "none",
      }),
    });
    const regBody = await reg.json();
    assert.ok(
      reg.status === 201 || reg.status === 200,
      JSON.stringify(regBody),
    );
    assert.ok(
      regBody.client_id || regBody.client?.client_id,
      JSON.stringify(regBody),
    );

    const admin = await fetch(`${handle.baseUrl}/api/v1/admin/mcp/status`);
    const adminBody = await admin.json();
    assert.equal(admin.status, 200, JSON.stringify(adminBody));
    assert.ok(
      adminBody.oauthReady === true || adminBody.ok !== false,
      JSON.stringify(adminBody),
    );
  } finally {
    await handle.close();
  }
});
