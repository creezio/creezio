#!/usr/bin/env node
/**
 * Gate M2 — stack compose autonome par instance (app + cloudflared sidecar).
 *
 * Vérifie le contrat du renderer instance-stack.mjs :
 *   - port INTERNE fixe 18791, port hôte loopback auto (127.0.0.1::18791)
 *     ou fixe (hostPort > 0) — jamais de port public ;
 *   - sidecar cloudflared rendu ssi tunnel (token ou tunnel.env existant) ;
 *   - container_name stable (fleet tooling) + labels creezio.server ;
 *   - token UNIQUEMENT dans tunnel.env (chmod 600) — jamais dans compose.yml ;
 *   - ingress provisioner : serviceHost "app" (stack) vs 127.0.0.1 (legacy) ;
 *   - lecture du store kernel /data (format {plain}).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STACK = path.join(
  ROOT,
  "packages/observability/fleet-collector/instance-stack.mjs",
);
const PROVISIONER_LIB = path.join(ROOT, "docker/tunnel-provisioner/lib.mjs");

const stack = await import(pathToFileUrl(STACK));
const provLib = await import(pathToFileUrl(PROVISIONER_LIB));

function pathToFileUrl(p) {
  const abs = path.resolve(p).replace(/\\/g, "/");
  return `file://${abs.startsWith("/") ? "" : "/"}${abs}`;
}

const BASE_INST = {
  name: "resto-test",
  containerName: "tempoflow3-server-resto-test",
  port: 0,
  bind: "127.0.0.1",
  dataDir: path.join("docker-data", "servers", "resto-test"),
  createdAt: new Date().toISOString(),
  env: { CREEZIO_NATIVE_WARM: "1" },
  stack: true,
};

test("M2 stack : ports internes fixes + port hôte loopback auto", () => {
  const yml = stack.renderInstanceCompose({
    brandRoot: "/srv/brand",
    brandId: "tempoflow3",
    image: "creezio-server-tempoflow3:local",
    inst: BASE_INST,
    withTunnel: true,
  });
  // App interne toujours 18791 ; publication loopback à attribution auto.
  assert.match(yml, /PORT: "18791"/);
  assert.match(yml, /METIER_PORT: "18791"/);
  assert.match(yml, /"127\.0\.0\.1::18791"/);
  assert.doesNotMatch(yml, /0\.0\.0\.0:\d+:18791/);
  // Nom de conteneur stable → fleet tooling (labels, inspect) intact.
  assert.match(yml, /container_name: tempoflow3-server-resto-test/);
  assert.match(yml, /creezio\.server=1/);
  assert.match(yml, /creezio\.stack=compose/);
  // Sidecar cloudflared : token via env_file, jamais en clair dans le YAML.
  assert.match(yml, /cloudflared:/);
  assert.match(yml, /env_file:\n      - \.\/tunnel\.env/);
  assert.match(yml, /command: tunnel --no-autoupdate run/);
  assert.doesNotMatch(yml, /eyJ[A-Za-z0-9_-]{10}/);
  // Seed kernel : le kernel ne spawn plus cloudflared, ingress par nom.
  assert.match(yml, /CREEZIO_TUNNEL_SIDECAR: "1"/);
  assert.match(yml, /CREEZIO_TUNNEL_SERVICE_HOST: "app"/);
  // Agent hôte joignable depuis le sidecar (extra_hosts host-gateway).
  assert.match(yml, /host\.docker\.internal:host-gateway/);
  // Healthcheck interne au réseau du stack.
  assert.match(yml, /api\/v1\/core\/health/);
});

test("M2 stack : hostPort fixe (cas tempoflowadmin — lp tunnel + NPM)", () => {
  const yml = stack.renderInstanceCompose({
    brandRoot: "/srv/brand",
    brandId: "tempoflowadmin",
    image: "creezio-server-tempoflowadmin:local",
    inst: { ...BASE_INST, name: "main", containerName: "tempoflowadmin-server-main", hostPort: 18801 },
    withTunnel: false,
  });
  assert.match(yml, /"127\.0\.0\.1:18801:18791"/);
  assert.doesNotMatch(yml, /cloudflared:/);
});

test("M2 stack : sans tunnel → pas de sidecar ni env_file", () => {
  const yml = stack.renderInstanceCompose({
    brandRoot: "/srv/brand",
    brandId: "tempoflow3",
    image: "img:local",
    inst: BASE_INST,
    withTunnel: false,
  });
  assert.doesNotMatch(yml, /cloudflared/);
  assert.doesNotMatch(yml, /tunnel\.env/);
  assert.doesNotMatch(yml, /CREEZIO_TUNNEL_SIDECAR/);
});

test("M2 stack : writeInstanceStack écrit tunnel.env 0600, token hors compose", () => {
  const brandRoot = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-stack-"));
  const inst = { ...BASE_INST };
  const { composeFile, withTunnel } = stack.writeInstanceStack({
    brandRoot,
    brandId: "tempoflow3",
    image: "img:local",
    inst,
    tunnel: { token: "tok-secret-123", hostname: "resto-test.tempoflow.fr", tunnelId: "tid" },
  });
  assert.ok(withTunnel);
  const envFile = path.join(brandRoot, "docker-data", "stacks", "resto-test", "tunnel.env");
  const stat = fs.statSync(envFile);
  assert.equal(stat.mode & 0o777, 0o600, "tunnel.env doit être 0600");
  const envBody = fs.readFileSync(envFile, "utf8");
  assert.match(envBody, /TUNNEL_TOKEN=tok-secret-123/);
  assert.match(envBody, /CREEZIO_TUNNEL_TOKEN=tok-secret-123/);
  assert.match(envBody, /CREEZIO_TUNNEL_HOSTNAME=resto-test\.tempoflow\.fr/);
  const yml = fs.readFileSync(composeFile, "utf8");
  assert.ok(!yml.includes("tok-secret-123"), "token dans compose.yml !");
  // Re-render SANS token (update) : le sidecar persiste grâce à tunnel.env.
  const again = stack.writeInstanceStack({
    brandRoot,
    brandId: "tempoflow3",
    image: "img:v2",
    inst,
  });
  assert.ok(again.withTunnel, "sidecar conservé à l'update");
  assert.match(fs.readFileSync(composeFile, "utf8"), /image: img:v2/);
  fs.rmSync(brandRoot, { recursive: true, force: true });
});

test("M2 provisioner : serviceHost app (stack) vs 127.0.0.1 (legacy)", () => {
  const ports = { crmPort: 18791, n8nPort: 15678, hermesPort: 18797 };
  const legacy = provLib.buildIngressRules("x.tempoflow.fr", ports, null, {});
  assert.deepEqual(
    legacy.map((r) => r.service),
    ["http://127.0.0.1:18791", "http://127.0.0.1:15678", "http://127.0.0.1:18797", "http_status:404"],
  );
  const stacked = provLib.buildIngressRules("x.tempoflow.fr", ports, null, { serviceHost: "app" });
  assert.deepEqual(
    stacked.map((r) => r.service),
    ["http://app:18791", "http://app:15678", "http://app:18797", "http_status:404"],
  );
  // L'ingress agent reste hors stack (hôte) — jamais réécrit en "app".
  const withAgent = provLib.buildIngressRules("x.tempoflow.fr", ports, { port: 18810, host: "host.docker.internal" }, { serviceHost: "app" });
  assert.ok(withAgent.some((r) => r.service === "http://host.docker.internal:18810"));
});

test("M2 store kernel : readKernelTunnelConfig parse le format {plain}", () => {
  const brandRoot = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-kc-"));
  const dataDir = path.join(brandRoot, "docker-data", "servers", "resto-test");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, "tempoflow3-config.json"),
    JSON.stringify({
      tunnelMeta: {
        slug: "resto-test",
        hostname: "resto-test.tempoflow.fr",
        publicUrl: "https://resto-test.tempoflow.fr",
        tunnelId: "tid-1",
        localPort: 18791,
      },
      tunnelToken: JSON.stringify({ plain: "tok-plain-abc" }),
    }),
  );
  const kc = stack.readKernelTunnelConfig(brandRoot, BASE_INST, "tempoflow3");
  assert.equal(kc.tunnelToken, "tok-plain-abc");
  assert.equal(kc.hostname, "resto-test.tempoflow.fr");
  assert.equal(kc.slug, "resto-test");
  // Token "local" (surface loopback) = pas de tunnel réel → null.
  fs.writeFileSync(
    path.join(dataDir, "tempoflow3-config.json"),
    JSON.stringify({ tunnelMeta: { hostname: "x" }, tunnelToken: JSON.stringify({ plain: "local" }) }),
  );
  assert.equal(stack.readKernelTunnelConfig(brandRoot, BASE_INST, "tempoflow3"), null);
  fs.rmSync(brandRoot, { recursive: true, force: true });
});
