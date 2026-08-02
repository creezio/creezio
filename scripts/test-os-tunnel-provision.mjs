#!/usr/bin/env node
/**
 * Gate OS — resolveTunnelProvision (envPrefix / CREEZIO_TUNNEL_PROVISION_*).
 * Pas de credentials réels : defaults quand unset, forme quand dummy.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTunnelProvision } from "../packages/electron-shell/dist/index.js";

const BASE_INPUT = {
  envBaseUrlKey: "CREEZIO_TUNNEL_PROVISION_URL",
  defaultBaseUrl: "https://tunnel-sandbox.example.test",
  envTokenKey: "CREEZIO_TUNNEL_PROVISION_TOKEN",
  defaultToken: "sandbox",
  mailRootDomain: "example.test",
};

test("tunnel.unset — defaults kit (skipped/ready sans creds)", () => {
  const savedUrl = process.env.CREEZIO_TUNNEL_PROVISION_URL;
  const savedToken = process.env.CREEZIO_TUNNEL_PROVISION_TOKEN;
  delete process.env.CREEZIO_TUNNEL_PROVISION_URL;
  delete process.env.CREEZIO_TUNNEL_PROVISION_TOKEN;

  try {
    const cfg = resolveTunnelProvision(BASE_INPUT);
    assert.equal(cfg.baseUrl, "https://tunnel-sandbox.example.test");
    assert.equal(cfg.token, "sandbox");
    assert.equal(cfg.mailRootDomain, "example.test");
    assert.ok(cfg.baseUrl.startsWith("https://"));
    assert.ok(!cfg.baseUrl.endsWith("/"));
  } finally {
    if (savedUrl === undefined) delete process.env.CREEZIO_TUNNEL_PROVISION_URL;
    else process.env.CREEZIO_TUNNEL_PROVISION_URL = savedUrl;
    if (savedToken === undefined) delete process.env.CREEZIO_TUNNEL_PROVISION_TOKEN;
    else process.env.CREEZIO_TUNNEL_PROVISION_TOKEN = savedToken;
  }
});

test("tunnel.dummy — lit CREEZIO_TUNNEL_PROVISION_* et normalise l'URL", () => {
  const savedUrl = process.env.CREEZIO_TUNNEL_PROVISION_URL;
  const savedToken = process.env.CREEZIO_TUNNEL_PROVISION_TOKEN;
  process.env.CREEZIO_TUNNEL_PROVISION_URL =
    "https://provisioner.dummy.example.test/v1/";
  process.env.CREEZIO_TUNNEL_PROVISION_TOKEN = "dummy-token-probe";

  try {
    const cfg = resolveTunnelProvision(BASE_INPUT);
    assert.equal(cfg.baseUrl, "https://provisioner.dummy.example.test/v1");
    assert.equal(cfg.token, "dummy-token-probe");
    assert.equal(cfg.mailRootDomain, "example.test");
  } finally {
    if (savedUrl === undefined) delete process.env.CREEZIO_TUNNEL_PROVISION_URL;
    else process.env.CREEZIO_TUNNEL_PROVISION_URL = savedUrl;
    if (savedToken === undefined) delete process.env.CREEZIO_TUNNEL_PROVISION_TOKEN;
    else process.env.CREEZIO_TUNNEL_PROVISION_TOKEN = savedToken;
  }
});

test("tunnel.envPrefix — clés marque via envPrefix", () => {
  const savedUrl = process.env.PROBE_TUNNEL_PROVISION_URL;
  const savedToken = process.env.PROBE_TUNNEL_PROVISION_TOKEN;
  process.env.PROBE_TUNNEL_PROVISION_URL = "https://brand-tunnel.example.test";
  process.env.PROBE_TUNNEL_PROVISION_TOKEN = "brand-token";

  try {
    const cfg = resolveTunnelProvision({
      envBaseUrlKey: "PROBE_TUNNEL_PROVISION_URL",
      defaultBaseUrl: "https://fallback.example.test",
      envTokenKey: "PROBE_TUNNEL_PROVISION_TOKEN",
      defaultToken: "fallback",
      mailRootDomain: "brand.example.test",
    });
    assert.equal(cfg.baseUrl, "https://brand-tunnel.example.test");
    assert.equal(cfg.token, "brand-token");
    assert.equal(cfg.mailRootDomain, "brand.example.test");
  } finally {
    if (savedUrl === undefined) delete process.env.PROBE_TUNNEL_PROVISION_URL;
    else process.env.PROBE_TUNNEL_PROVISION_URL = savedUrl;
    if (savedToken === undefined) delete process.env.PROBE_TUNNEL_PROVISION_TOKEN;
    else process.env.PROBE_TUNNEL_PROVISION_TOKEN = savedToken;
  }
});
