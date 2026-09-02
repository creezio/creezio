#!/usr/bin/env node
/**
 * Gate app-runtime — façade exports + composeBrandOs smoke (sans apps/tempoflow3).
 * Extract P1.2 depuis archive/tf3-probe-65b9273.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createAppManifest } from "../packages/brand-config/dist/index.js";
import {
  composeBrandOs,
  createBrandModuleRegistry,
  startBrandDesktop,
  startBrandKernelHarness,
} from "../packages/app-runtime/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("AR1 package app-runtime exporté", () => {
  const idx = fs.readFileSync(
    path.join(ROOT, "packages/app-runtime/dist/index.js"),
    "utf8",
  );
  assert.match(idx, /startBrandDesktop/);
  assert.match(idx, /startBrandKernelHarness/);
  assert.match(idx, /composeBrandOs/);
  assert.equal(typeof startBrandDesktop, "function");
  assert.equal(typeof startBrandKernelHarness, "function");
  assert.equal(typeof composeBrandOs, "function");
});

test("AR2 composeBrandOs assemble host stack (sandbox)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ar-compose-"));
  const electronDir = path.join(tmp, "electron");
  fs.mkdirSync(electronDir, { recursive: true });
  const resourcesRoot = path.join(
    ROOT,
    "packages/host-runtime/resources",
  );
  const manifest = createAppManifest({
    brandId: "acmeprobe",
    productName: "Acme Probe",
    domain: "acmeprobe.local",
    sandbox: true,
  });
  const osHandle = composeBrandOs({
    manifest,
    userDataDir: tmp,
    isPackaged: false,
    resourcesRoot,
    electronDirname: electronDir,
  });
  assert.ok(osHandle.hostRuntime);
  assert.ok(osHandle.hostStack);
  assert.equal(osHandle.status().brandId, "acmeprobe");
  assert.equal(osHandle.status().ok, true);
  osHandle.close();
});

test("AR3 ADR BrandSpec/app-runtime présent", () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, "docs/adr/ADR-brand-spec-app-runtime.md")),
  );
});

test("AR4 collectNavPermissions / collectPermissionGroups depuis navItems", () => {
  const { collectNavPermissions, collectPermissionGroups } =
    createBrandModuleRegistry([
      {
        id: "alpha",
        navItems: [
          {
            id: "brand.alpha",
            label: "Alpha",
            href: "/alpha",
            order: 10,
            permission: "nav.alpha",
          },
        ],
      },
      {
        id: "beta",
        navItems: [
          {
            id: "brand.beta-a",
            label: "Beta A",
            href: "/beta-a",
            order: 20,
            permission: "nav.beta",
          },
          {
            id: "brand.beta-b",
            label: "Beta B",
            href: "/beta-b",
            order: 21,
            permission: "nav.beta",
          },
        ],
      },
      { id: "gamma", navItems: [] },
    ]);
  assert.deepEqual(collectNavPermissions(), ["nav.alpha", "nav.beta"]);
  const groups = collectPermissionGroups();
  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.id, "alpha");
  assert.equal(groups[1]?.id, "beta");
  assert.equal(groups[1]?.permissions.length, 1);
});
