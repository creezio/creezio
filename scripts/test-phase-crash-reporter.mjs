/**
 * Gate crash-reporter kit — upload configurable + brandId + pending queue.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("crash-reporter expose configure + pending + brandId", () => {
  const src = fs.readFileSync(
    path.join(root, "packages/electron-shell/src/host/crash-reporter.ts"),
    "utf8",
  );
  assert.match(src, /configureCrashReporter/);
  assert.match(src, /flushPendingCrashReports/);
  assert.match(src, /brandId/);
  assert.match(src, /crash-reports/);
  assert.match(src, /pending/);
  assert.match(src, /CREEZIO_CRASH_ENDPOINT/);
});

test("startBrandDesktop configure crash tôt", () => {
  const src = fs.readFileSync(
    path.join(root, "packages/app-runtime/src/start-brand-desktop.ts"),
    "utf8",
  );
  assert.match(src, /configureCrashReporter/);
  assert.match(src, /initCrashReporter/);
  assert.match(src, /installGlobalHandlers/);
  assert.match(src, /crashEndpoint/);
  assert.match(src, /CRASH_ENDPOINT/);
});

test("boot-failure dialog mentionne crash-reports", () => {
  const src = fs.readFileSync(
    path.join(
      root,
      "packages/electron-shell/src/desktop/brand-desktop-runtime.ts",
    ),
    "utf8",
  );
  assert.match(src, /boot-failure/);
  assert.match(src, /crashReportsDir|crash-reports/);
  assert.match(src, /crashLogHint/);
});
