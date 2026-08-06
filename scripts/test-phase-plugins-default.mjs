#!/usr/bin/env node
/**
 * Gate P1 plugins natifs — activation par défaut.
 *
 * - PD1 : sans env ⇒ plugins ENABLED (défaut inversé, plus d'opt-in).
 * - PD2 : manifest `features.plugins = false` (Fidu) ⇒ feature-off.
 * - PD3 : kill-switch `CREEZIO_PLUGINS=0` ⇒ feature-off.
 * - PD4 : `CREEZIO_PLUGINS=1` legacy ⇒ toujours enabled (no-op).
 *
 * Hermétique : marque synthétique via createAppManifest + harness kit,
 * zéro repo marque requis.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createAppManifest } from "../packages/brand-config/dist/index.js";
import { startBrandKernelHarness } from "../packages/app-runtime/dist/index.js";

const ENV_KEYS = [
  "CREEZIO_PLUGINS",
  "CREEZIO_NATIVE_WARM",
  "CREEZIO_SKIP_KIT_BINARIES",
];
const saveEnv = () =>
  Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
const restoreEnv = (saved) => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
};

async function bootProbe({ pluginsEnv, featureOff } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plugins-default-"));
  process.env.CREEZIO_SKIP_KIT_BINARIES = "1";
  process.env.CREEZIO_NATIVE_WARM = "0";
  if (pluginsEnv === undefined) delete process.env.CREEZIO_PLUGINS;
  else process.env.CREEZIO_PLUGINS = pluginsEnv;

  const base = createAppManifest({
    brandId: "pluginsprobe",
    productName: "Plugins Probe",
    domain: "pluginsprobe.local",
    sandbox: true,
  });
  const manifest = featureOff
    ? { ...base, features: { ...(base.features || {}), plugins: false } }
    : base;

  const handle = await startBrandKernelHarness({
    brandId: "pluginsprobe",
    appRoot: tmp,
    dataDir: path.join(tmp, "data"),
    manifest,
    brandMigrations: [],
    registerModuleApi: () => {},
    skipIndex: true,
  });
  return {
    handle,
    close: async () => {
      await handle.close();
      fs.rmSync(tmp, { recursive: true, force: true });
    },
  };
}

async function pluginsMode(handle) {
  const status = await (
    await fetch(`${handle.baseUrl}/api/v1/os/status`)
  ).json();
  const endpoint = await (
    await fetch(`${handle.baseUrl}/api/v1/os/plugins`)
  ).json();
  return { status: status.hosts.plugins, endpoint };
}

test("PD1 sans env : plugins ENABLED par défaut (endpoint + control plane)", async () => {
  const saved = saveEnv();
  let probe = null;
  try {
    probe = await bootProbe({ pluginsEnv: undefined });
    const { status, endpoint } = await pluginsMode(probe.handle);
    assert.equal(status, "enabled", "hosts.plugins enabled sans env");
    assert.equal(endpoint.ok, true, JSON.stringify(endpoint));
    assert.equal(endpoint.mode, "enabled");
    assert.ok(Array.isArray(endpoint.plugins));
    assert.equal(typeof endpoint.count, "number");
  } finally {
    await probe?.close();
    restoreEnv(saved);
  }
});

test("PD2 manifest features.plugins=false (Fidu) : feature-off", async () => {
  const saved = saveEnv();
  let probe = null;
  try {
    probe = await bootProbe({ pluginsEnv: undefined, featureOff: true });
    const { status, endpoint } = await pluginsMode(probe.handle);
    assert.equal(status, "feature-off", "features.plugins=false respecté");
    assert.equal(endpoint.mode, "feature-off");
    assert.deepEqual(endpoint.plugins, []);
  } finally {
    await probe?.close();
    restoreEnv(saved);
  }
});

test("PD3 kill-switch CREEZIO_PLUGINS=0 : feature-off", async () => {
  const saved = saveEnv();
  let probe = null;
  try {
    probe = await bootProbe({ pluginsEnv: "0" });
    const { status, endpoint } = await pluginsMode(probe.handle);
    assert.equal(status, "feature-off", "CREEZIO_PLUGINS=0 coupe les plugins");
    assert.equal(endpoint.mode, "feature-off");
  } finally {
    await probe?.close();
    restoreEnv(saved);
  }
});

test("PD4 legacy CREEZIO_PLUGINS=1 : no-op, toujours enabled", async () => {
  const saved = saveEnv();
  let probe = null;
  try {
    probe = await bootProbe({ pluginsEnv: "1" });
    const { status } = await pluginsMode(probe.handle);
    assert.equal(status, "enabled", "opt-in historique accepté (no-op)");
  } finally {
    await probe?.close();
    restoreEnv(saved);
  }
});
