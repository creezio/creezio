#!/usr/bin/env node
/**
 * First-run setup + login — API OS kit (@creezio/electron-shell), sans GUI.
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
    /* hors node_modules — fallback monorepo / CREEZIO_ROOT */
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
  throw new Error(
    "createDesktopSessionStore introuvable — installer @creezio/electron-shell ou définir CREEZIO_ROOT",
  );
}

const createDesktopSessionStore = await loadCreateDesktopSessionStore();
assert.equal(typeof createDesktopSessionStore, "function");

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "src/electron/app-manifest.json"), "utf8"),
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tempoflow3-setup-"));
const session = createDesktopSessionStore({ userDataDir: tmp, manifest });

assert.equal(session.isSetupComplete(), false);
assert.equal(session.getSetupStatus().setupComplete, false);

const done = session.completeSetup("chef", "secret-chr");
assert.equal(done.ok, true);
assert.ok(done.sessionToken);
assert.equal(session.isSetupComplete(), true);

assert.equal(session.login("chef", "wrong").ok, false);
const ok = session.login("chef", "secret-chr");
assert.equal(ok.ok, true);
assert.ok(ok.sessionToken);

const sess = session.getSession();
assert.equal(sess.authenticated, true);
assert.equal(sess.user, "chef");

session.chooseConnection({
  mode: "local",
  localBind: "127.0.0.1",
  chosen: true,
});
assert.equal(session.getConnectionProfile().chosen, true);

session.logout();
assert.equal(session.getSession().authenticated, false);

const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /registerDesktopSessionIpc/);
assert.match(main, /spawnBrandMetierApi/);
assert.doesNotMatch(main, /createFileLocalConfigStore/);

const preload = fs.readFileSync(path.join(root, "src/electron/preload.ts"), "utf8");
assert.match(preload, /auth:login/);
assert.match(preload, /setup:complete/);

for (const rel of [
  "src/electron/local-config-store.ts",
  "src/electron/ipc-bridge.ts",
]) {
  assert.ok(!fs.existsSync(path.join(root, rel)), `interdit: ${rel}`);
}

console.log("OK test:setup-login (OS kit createDesktopSessionStore)");
