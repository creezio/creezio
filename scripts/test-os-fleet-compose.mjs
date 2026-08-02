#!/usr/bin/env node
/**
 * Gate OS — composeBrandOs branche fleet: depuis manifest.features.fleet.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  createAppManifest,
  fiduManifest,
  tempoflowManifest,
} from "../packages/brand-config/dist/index.js";
import { composeBrandOs } from "../packages/app-runtime/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resourcesRoot = path.join(ROOT, "packages/electron-shell/resources");

function compose(manifest) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "os-fleet-"));
  const electronDir = path.join(tmp, "electron");
  fs.mkdirSync(electronDir, { recursive: true });
  const handle = composeBrandOs({
    manifest,
    userDataDir: tmp,
    isPackaged: false,
    resourcesRoot,
    electronDirname: electronDir,
  });
  return { handle, tmp };
}

test("fleet.compose — TF features.fleet=true → agent runtime", () => {
  const { handle } = compose(tempoflowManifest);
  try {
    const st = handle.status();
    assert.equal(st.hosts.fleet, "enabled");
    assert.equal(typeof handle.hostRuntime.fleetAgent, "function");
    const agent = handle.hostRuntime.fleetAgent();
    assert.ok(agent);
    assert.equal(typeof agent.startFleetAgent, "function");
  } finally {
    handle.close();
  }
});

test("fleet.compose — Fidu features.fleet=false → feature-off", () => {
  const { handle } = compose(fiduManifest);
  try {
    const st = handle.status();
    assert.equal(st.hosts.fleet, "feature-off");
    assert.equal(handle.hostRuntime.fleetAgent, undefined);
  } finally {
    handle.close();
  }
});

test("fleet.compose — sandbox défaut (features absentes) → enabled", () => {
  const manifest = createAppManifest({
    brandId: "fleetprobe",
    productName: "Fleet Probe",
    domain: "fleetprobe.local",
    sandbox: true,
  });
  const { handle } = compose(manifest);
  try {
    assert.equal(handle.status().hosts.fleet, "enabled");
    assert.equal(typeof handle.hostRuntime.fleetAgent, "function");
  } finally {
    handle.close();
  }
});

test("fleet.compose — src contient isFeatureEnabled + fleet:", () => {
  const src = fs.readFileSync(
    path.join(ROOT, "packages/app-runtime/src/compose-brand-os.ts"),
    "utf8",
  );
  assert.match(src, /isFeatureEnabled/);
  assert.match(src, /fleet:\s*\{/);
  assert.match(src, /includeFleetOpsDirs/);
  assert.match(src, /getFleetAgent/);
});
