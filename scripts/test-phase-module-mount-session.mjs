#!/usr/bin/env node
/**
 * Gate — session HTTP sur `/api/v1/modules/*` (BACKLOG F3 / DASH-5).
 *
 * Prouve la garde à la bordure `listenBrandOsHttp` :
 *  1. GET module anonyme → 401 ;
 *  2. GET module avec Bearer JWT session → 200 ;
 *  3. chemin allowlisté (landing/public) sans session → pas bloqué par la garde ;
 *  4. `api.handle` in-process reste libre (pollers / gates unitaires) ;
 *  5. clé API machine brand (Bearer opaque, table api_keys) → 200 en lecture,
 *     clé inconnue → 401 (auth machine Hermes/plugins/n8n).
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  configureAuth,
  createSessionToken,
  resetAuthConfigForTests,
} from "../packages/auth/dist/index.js";
import { createApiKernel } from "../packages/api-kernel/dist/index.js";
import {
  assertModuleMountSession,
  createBrandApiKeyModuleVerifier,
  isPublicModulePath,
  listenBrandOsHttp,
} from "../packages/app-runtime/dist/index.js";

const prevAuthDisabled = process.env.AUTH_DISABLED;
const prevAuthSecret = process.env.AUTH_SECRET;
const prevAllowDev = process.env.AUTH_ALLOW_DEV_SECRET;

function restoreEnv() {
  if (prevAuthDisabled === undefined) delete process.env.AUTH_DISABLED;
  else process.env.AUTH_DISABLED = prevAuthDisabled;
  if (prevAuthSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = prevAuthSecret;
  if (prevAllowDev === undefined) delete process.env.AUTH_ALLOW_DEV_SECRET;
  else process.env.AUTH_ALLOW_DEV_SECRET = prevAllowDev;
  resetAuthConfigForTests();
}

test("module-mount-session : allowlist + décision pure", async () => {
  assert.equal(
    isPublicModulePath("GET", "/api/v1/modules/landing/public"),
    true,
  );
  assert.equal(
    isPublicModulePath("POST", "/api/v1/modules/fleet-registry/register"),
    true,
  );
  assert.equal(
    isPublicModulePath("GET", "/api/v1/modules/widgets"),
    false,
  );

  delete process.env.AUTH_DISABLED;
  const denied = await assertModuleMountSession({
    method: "GET",
    pathname: "/api/v1/modules/widgets",
    headers: {},
  });
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.status, 401);

  const pub = await assertModuleMountSession({
    method: "GET",
    pathname: "/api/v1/modules/landing/public",
    headers: {},
  });
  assert.equal(pub.ok, true);
  assert.equal(pub.public, true);
  restoreEnv();
});

test("module-mount-session : listenBrandOsHttp exige une session", async () => {
  delete process.env.AUTH_DISABLED;
  process.env.AUTH_SECRET = "gate-module-mount-session-secret";
  process.env.AUTH_ALLOW_DEV_SECRET = "1";
  configureAuth({ cookieName: "gate_module_session" });

  const api = createApiKernel({ brandId: "demobrand", appVersion: "0.0.0" });
  api.registerModuleApi("widgets", {
    dbLayer: "brand",
    handle: async () => ({ status: 200, body: { ok: true, items: [] } }),
  });
  api.registerModuleApi("landing", {
    dbLayer: "brand",
    handle: async ({ subPath }) => {
      if (subPath === "public" || subPath.startsWith("public/")) {
        return { status: 200, body: { ok: true, public: true } };
      }
      return { status: 401, body: { error: "need_session_in_mount" } };
    },
  });

  // In-process : pas de garde HTTP.
  const direct = await api.handle({
    method: "GET",
    path: "/api/v1/modules/widgets",
  });
  assert.equal(direct.status, 200);

  const mcp = {
    listTools: async () => ({ tools: [] }),
    callTool: async () => ({ ok: false, error: "unused" }),
  };

  // Table api_keys brand.db simulée (SqliteHandle minimal) : une clé
  // machine valide scopée crm:read — contrat clé service Hermes/plugins.
  const machineKey = "svc-key-gate-module-mount";
  const machineHash = createHash("sha256")
    .update(machineKey, "utf8")
    .digest("hex");
  const fakeBrandDb = {
    prepare: () => ({
      get: (hash) =>
        hash === machineHash ? { scopes: "crm:read" } : undefined,
    }),
  };

  const http = await listenBrandOsHttp({
    api,
    mcp,
    host: "127.0.0.1",
    port: 0,
    moduleMountMachineKey: createBrandApiKeyModuleVerifier(() => fakeBrandDb),
  });

  try {
    const anon = await fetch(`${http.baseUrl}/api/v1/modules/widgets`);
    assert.equal(anon.status, 401);
    const anonBody = await anon.json();
    assert.equal(anonBody.error, "unauthorized");

    // Clé machine valide (Bearer opaque) → passe la garde en lecture.
    const machine = await fetch(`${http.baseUrl}/api/v1/modules/widgets`, {
      headers: { Authorization: `Bearer ${machineKey}` },
    });
    assert.equal(machine.status, 200);

    // Clé machine valide mais scope lecture seule → mutation refusée.
    const machineWrite = await fetch(
      `${http.baseUrl}/api/v1/modules/widgets`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${machineKey}`,
          "content-type": "application/json",
        },
        body: "{}",
      },
    );
    assert.equal(machineWrite.status, 401);

    // Clé opaque inconnue → 401.
    const badKey = await fetch(`${http.baseUrl}/api/v1/modules/widgets`, {
      headers: { Authorization: "Bearer svc-key-unknown" },
    });
    assert.equal(badKey.status, 401);

    const token = await createSessionToken({
      user: {
        id: "u1",
        username: "owner-gate",
        role: "owner",
        permissions: [],
      },
    });
    const authed = await fetch(`${http.baseUrl}/api/v1/modules/widgets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(authed.status, 200);
    assert.equal((await authed.json()).ok, true);

    const landing = await fetch(
      `${http.baseUrl}/api/v1/modules/landing/public`,
    );
    assert.equal(landing.status, 200);
    assert.equal((await landing.json()).public, true);
  } finally {
    await http.close();
    restoreEnv();
  }
});
