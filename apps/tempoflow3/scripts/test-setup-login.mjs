#!/usr/bin/env node
/**
 * First-run setup + login — API OS kit (@creezio/electron-shell).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadCreateDesktopSessionStore() {
  try {
    const mod = await import("@creezio/electron-shell");
    if (typeof mod.createDesktopSessionStore === "function") {
      return mod.createDesktopSessionStore;
    }
  } catch {
    /* fallback */
  }
  const candidates = [];
  if (process.env.CREEZIO_ROOT) {
    candidates.push(
      path.join(process.env.CREEZIO_ROOT, "packages/electron-shell/dist/index.js"),
    );
  }
  let dir = root;
  for (let i = 0; i < 8; i++) {
    candidates.push(path.join(dir, "packages/electron-shell/dist/index.js"));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      const mod = await import(pathToFileURL(cand).href);
      return mod.createDesktopSessionStore;
    }
  }
  throw new Error("createDesktopSessionStore introuvable");
}

const createDesktopSessionStore = await loadCreateDesktopSessionStore();
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "src/electron/app-manifest.json"), "utf8"),
);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tempoflow3-setup-"));
const session = createDesktopSessionStore({ userDataDir: tmp, manifest });

assert.equal(session.isSetupComplete(), false);
const done = session.completeSetup("chef", "secret-os");
assert.equal(done.ok, true);
assert.equal(session.login("chef", "secret-os").ok, true);
session.logout();

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /startBrandDesktop/);
assert.match(main, /brandMigrations|registerModuleApi/);
assert.doesNotMatch(main, /spawnBrandMetierApi|bootBrandKernel/);

console.log("OK test:setup-login (OS kit + startBrandDesktop)");
