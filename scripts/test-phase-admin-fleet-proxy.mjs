#!/usr/bin/env node
/**
 * Gate — proxy module `fleet` (@creezio/admin) vers le backend flotte.
 *
 * Prouve (mock HTTP Basic local) :
 *  1. 503 sans CREEZIO_FLEET_BACKEND_BASIC ;
 *  2. proxy relaie méthode + query multi-valeurs + body JSON ;
 *  3. statut backend conservé ; réponse non JSON → body d'erreur documenté ;
 *  4. 502 si backend down.
 */
import http from "node:http";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createFleetAdminMount } from "../packages/admin/dist/index.js";

function startMockBackend(handler) {
  const srv = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const url = new URL(req.url || "/", "http://x");
      const raw = Buffer.concat(chunks).toString("utf8");
      let body = undefined;
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw;
        }
      }
      handler({ req, res, url, body, raw });
    });
  });
  return new Promise((resolve) => {
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      resolve({
        srv,
        base: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => srv.close(() => r())),
      });
    });
  });
}

test("fleet proxy : 503 sans Basic", async () => {
  delete process.env.CREEZIO_FLEET_BACKEND_BASIC;
  delete process.env.CREEZIO_FLEET_BACKEND_URL;
  const mount = createFleetAdminMount({ backendUrl: "http://127.0.0.1:9" });
  const res = await mount.handle({
    req: { method: "GET", query: {}, headers: {} },
    subPath: "servers",
  });
  assert.equal(res.status, 503);
  assert.match(String(res.body.error), /CREEZIO_FLEET_BACKEND_BASIC/);
});

test("fleet proxy : relaie méthode, query multi-valeurs, body JSON", async () => {
  let seen = null;
  const mock = await startMockBackend(({ req, res, url, body }) => {
    seen = {
      method: req.method,
      path: url.pathname,
      tags: url.searchParams.getAll("tag"),
      auth: req.headers.authorization || "",
      body,
    };
    res.writeHead(201, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, echoed: body }));
  });
  try {
    const mount = createFleetAdminMount({
      backendUrl: mock.base,
      basic: "fleet:secret",
    });
    const res = await mount.handle({
      req: {
        method: "POST",
        query: { tag: ["a", "b"] },
        headers: {},
        body: { name: "server-1" },
      },
      subPath: "servers",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.echoed.name, "server-1");
    assert.equal(seen.method, "POST");
    assert.equal(seen.path, "/admin/api/servers");
    assert.deepEqual(seen.tags, ["a", "b"]);
    assert.match(seen.auth, /^Basic /);
    const decoded = Buffer.from(seen.auth.slice(6), "base64").toString("utf8");
    assert.equal(decoded, "fleet:secret");
  } finally {
    await mock.close();
  }
});

test("fleet proxy : réponse non JSON conserve le statut backend", async () => {
  const mock = await startMockBackend(({ res }) => {
    res.writeHead(418, { "content-type": "text/plain" });
    res.end("teapot");
  });
  try {
    const mount = createFleetAdminMount({
      backendUrl: mock.base,
      basic: "u:p",
    });
    const res = await mount.handle({
      req: { method: "GET", query: {}, headers: {} },
      subPath: "health",
    });
    assert.equal(res.status, 418);
    assert.equal(res.body.ok, false);
    assert.match(String(res.body.error), /non JSON/);
  } finally {
    await mock.close();
  }
});

test("fleet proxy : 502 backend down", async () => {
  const mount = createFleetAdminMount({
    backendUrl: "http://127.0.0.1:1",
    basic: "u:p",
    timeoutMs: 500,
  });
  const res = await mount.handle({
    req: { method: "GET", query: {}, headers: {} },
    subPath: "servers",
  });
  assert.equal(res.status, 502);
  assert.match(String(res.body.error), /injoignable/);
});
