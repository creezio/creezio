#!/usr/bin/env node
/**
 * Gate OS — surface `/api/v1/email` montée par app-runtime (Worker inbound).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("email.surface — mount + handlesPath", async () => {
  const mod = await import(
    path.join(root, "packages/app-runtime/dist/mount-brand-email-surface.js")
  );
  assert.equal(typeof mod.mountBrandEmailSurface, "function");
  assert.equal(typeof mod.emailSurfaceHandlesPath, "function");
  assert.equal(mod.emailSurfaceHandlesPath("/api/v1/email"), true);
  assert.equal(mod.emailSurfaceHandlesPath("/api/v1/email/inbound"), true);
  assert.equal(mod.emailSurfaceHandlesPath("/api/v1/email/meta"), true);
  assert.equal(mod.emailSurfaceHandlesPath("/api/v1/platform/platform-mails"), false);

  const { app } = mod.mountBrandEmailSurface({
    getStore: () => null,
  });
  const meta = await app.request("http://local/api/v1/email/meta");
  assert.equal(meta.status, 200);
  const json = await meta.json();
  assert.equal(json.ready, false);

  const listenSrc = fs.readFileSync(
    path.join(root, "packages/app-runtime/src/listen-brand-os-http.ts"),
    "utf8",
  );
  assert.match(listenSrc, /emailSurfaceHandlesPath/);
  assert.match(listenSrc, /mountBrandEmailSurface/);
});
