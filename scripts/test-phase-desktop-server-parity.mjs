/**
 * Gate parité desktop Serveur TF2 0.10.26 :
 * - NSIS : démarrage auto + désinstall profonde (pas de placeholder)
 * - UI Configuration : tray / launchAtStartup / factory-reset montés
 * - Runtime : TrayController + applyLaunchAtStartup + factory-reset IPC
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  renderNsisInstallerInclude,
  tempoflow3Manifest,
  demobrandManifest,
} from "../packages/brand-config/dist/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("renderNsisInstallerInclude — TF3 segments + macros profondes", () => {
  const nsh = renderNsisInstallerInclude(tempoflow3Manifest);
  assert.match(nsh, /TempoFlow-Server\.exe/);
  assert.match(nsh, /TempoFlow Server/);
  assert.match(nsh, /tempoflow3/);
  assert.match(nsh, /customUnWelcomePage/);
  assert.match(nsh, /czWantDeleteData/);
  assert.match(nsh, /launchAtStartup/);
  assert.match(nsh, /installer-prefs\.json/);
  assert.match(nsh, /Software\\Microsoft\\Windows\\CurrentVersion\\Run/);
  assert.doesNotMatch(nsh, /placeholder \(custom macros marque\)/);
  assert.doesNotMatch(nsh, /TF2-Server\.exe/);
  assert.doesNotMatch(nsh, /tempoflow2-crm/);
});

test("renderNsisInstallerInclude — demobrand distinct", () => {
  const nsh = renderNsisInstallerInclude(demobrandManifest);
  assert.match(nsh, new RegExp(demobrandManifest.server.executableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(nsh, new RegExp(demobrandManifest.client.userDataSegment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("DesktopSettingsPage monte background + factory-reset", () => {
  const page = fs.readFileSync(
    path.join(
      root,
      "packages/shell-ui/ui/os-pages/desktop-settings-page.tsx",
    ),
    "utf8",
  );
  assert.match(page, /DesktopBackgroundSettings/);
  assert.match(page, /FactoryResetSettings/);
  assert.match(page, /value="systeme"/);
});

test("electron-shell expose tray + launchAtStartup + factory-reset", () => {
  const tray = fs.readFileSync(
    path.join(root, "packages/electron-shell/src/tray.ts"),
    "utf8",
  );
  assert.match(tray, /export class TrayController/);
  assert.match(tray, /export function applyLaunchAtStartup/);
  assert.match(tray, /setLoginItemSettings/);

  const runtime = fs.readFileSync(
    path.join(
      root,
      "packages/electron-shell/src/desktop/brand-desktop-runtime.ts",
    ),
    "utf8",
  );
  assert.match(runtime, /TrayController/);
  assert.match(runtime, /applyLaunchAtStartup/);
  assert.match(runtime, /config:factory-reset/);
  assert.match(runtime, /background:get/);
});

test("factory scaffold n'émet plus de placeholder NSIS", () => {
  const scaffold = fs.readFileSync(
    path.join(root, "packages/factory/src/scaffold.ts"),
    "utf8",
  );
  assert.match(scaffold, /renderNsisInstallerInclude/);
  assert.doesNotMatch(
    scaffold,
    /placeholder \(custom macros marque\)/,
  );
});

test("afterPack + nextServerEntry packagé (resources/server)", () => {
  const afterPack = fs.readFileSync(
    path.join(root, "packages/desktop-tooling/scripts/after-pack.cjs"),
    "utf8",
  );
  assert.match(afterPack, /resources.*server/);
  assert.match(afterPack, /ui\/\.next\/standalone|assembleFromUiStandalone/);

  const builder = fs.readFileSync(
    path.join(root, "packages/brand-config/src/build-builder-config.ts"),
    "utf8",
  );
  assert.match(builder, /afterPack/);

  const compose = fs.readFileSync(
    path.join(root, "packages/app-runtime/src/compose-brand-os.ts"),
    "utf8",
  );
  assert.match(compose, /resourcesRoot.*server/);
  assert.match(compose, /isPackaged/);
});
