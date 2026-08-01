#!/usr/bin/env node
/**
 * Smoke shell runtime Electron — wiring kit + lancement court si electron/xvfb.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TF3 = path.join(ROOT, "apps/tempoflow3");

test("electron.runtime wiring dans kit + main TF3", () => {
  const main = fs.readFileSync(
    path.join(TF3, "src/electron/main.ts"),
    "utf8",
  );
  assert.match(main, /startBrandDesktop/);
  assert.match(main, /CREEZIO_DESKTOP_SHELL/);
  const desktop = fs.readFileSync(
    path.join(ROOT, "packages/app-runtime/src/start-brand-desktop.ts"),
    "utf8",
  );
  assert.match(desktop, /desktopShell = config\.desktopShell \|\| "runtime"/);
  assert.match(desktop, /installBrandOsDesktop/);
});

test("electron.runtime launch smoke (si electron+xvfb)", async () => {
  if (process.env.CREEZIO_SKIP_ELECTRON_SMOKE === "1") {
    console.log("skip: CREEZIO_SKIP_ELECTRON_SMOKE=1");
    return;
  }
  const electronBin = [
    process.env.ELECTRON_BINARY,
    path.join(TF3, "node_modules/.bin/electron"),
    path.join(ROOT, "node_modules/.bin/electron"),
    path.join(ROOT, "node_modules/electron/cli.js"),
  ].find((p) => p && fs.existsSync(p));
  const hasXvfb =
    spawnSync("which", ["xvfb-run"], { encoding: "utf8" }).status === 0;
  if (!electronBin || !hasXvfb) {
    console.log(
      `skip: electron=${Boolean(electronBin)} xvfb=${hasXvfb} (wiring déjà asserté)`,
    );
    return;
  }

  const build = spawnSync("npm", ["run", "build:electron"], {
    cwd: TF3,
    encoding: "utf8",
    shell: true,
    env: {
      ...process.env,
      CREEZIO_ROOT: ROOT,
      NODE_PATH: path.join(ROOT, "node_modules"),
      PATH: [
        path.join(ROOT, "node_modules/.bin"),
        process.env.PATH || "",
      ].join(path.delimiter),
    },
  });
  assert.equal(build.status, 0, build.stderr);

  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "os-electron-rt-"));
  let out = "";
  const child = spawn(
    "xvfb-run",
    ["-a", electronBin, "."],
    {
      cwd: TF3,
      env: {
        ...process.env,
        CREEZIO_ROOT: ROOT,
        CREEZIO_NATIVE_WARM: "0",
        CREEZIO_DESKTOP_SHELL: "runtime",
        ELECTRON_USER_DATA: userData,
      },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  child.stdout.on("data", (d) => {
    out += d.toString();
  });
  child.stderr.on("data", (d) => {
    out += d.toString();
  });

  await new Promise((r) => setTimeout(r, 6000));
  try {
    if (child.pid) {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }
  } catch {
    /* */
  }
  await new Promise((r) => setTimeout(r, 500));

  fs.writeFileSync(path.join(userData, "smoke.log"), out);
  assert.doesNotMatch(out, /Cannot find module '@creezio\/app-runtime'/);
});
