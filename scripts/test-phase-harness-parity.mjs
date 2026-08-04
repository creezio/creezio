#!/usr/bin/env node
/**
 * Gate parité serveur Docker headless — phases TF2 portées dans le harness
 * (`startBrandKernelHarness`), prouvées FONCTIONNELLEMENT en sandbox :
 *
 * - HPP1 : boot harness synthétique complet →
 *     · import catalogue APRÈS le listen (METIER_BASE_URL posé — plus de skip) ;
 *     · tunnel provisionné via un provisioner STUB local (reserve/configure)
 *       + faux cloudflared spawné avec le token (aucun DNS/réseau réel) ;
 *     · MCP OAuth public = URL tunnel https (plus de 127.0.0.1 forcé) ;
 *     · EMAIL_INBOUND_SECRET posé depuis le provisioner (mails entrants) ;
 *     · plugins démarrés + control plane (CREEZIO_PLUGINS=1) ;
 *     · fleet agent démarré, no-op propre sur endpoint sentinelle ;
 *     · toutes les étapes visibles dans /api/v1/os/boot-status.
 * - HPP2 : ordre du code harness (catalog-import post-listen, bridge Hermes
 *     post-warm, n8n publicBaseUrl) + Dockerfile cloudflared + template factory.
 * - HPP3 : applyBrandCatalogEnvDefaults (défaut léger tests / opt-in prod).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createAppManifest } from "../packages/brand-config/dist/index.js";
import {
  applyBrandCatalogEnvDefaults,
  startBrandKernelHarness,
} from "../packages/app-runtime/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ENV_KEYS = [
  "CREEZIO_SKIP_KIT_BINARIES",
  "CREEZIO_NATIVE_WARM",
  "CREEZIO_PLUGINS",
  "CREEZIO_TUNNEL_PROVISION_URL",
  "CREEZIO_TUNNEL_PROVISION_TOKEN",
  "CREEZIO_TUNNEL_SLUG",
  "CREEZIO_CLOUDFLARED_BINARY",
  "CREEZIO_FLEET_ENDPOINT",
  "CREEZIO_GATE_CF_MARKER",
  "EMAIL_INBOUND_SECRET",
  "EMAIL_DOMAIN",
  "APP_PUBLIC_URL",
  "MCP_PUBLIC_URL",
  "AUTH_SECRET",
  "MCP_JWT_SECRET",
  "METIER_BASE_URL",
];
const saveEnv = () =>
  Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
const restoreEnv = (saved) => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
};

/** Provisioner tunnel STUB local (reserve/configure) — zéro Cloudflare. */
function startStubProvisioner() {
  const calls = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = chunks.length
        ? JSON.parse(Buffer.concat(chunks).toString("utf8"))
        : {};
      calls.push({ method: req.method, url: req.url, body });
      res.setHeader("content-type", "application/json");
      if (req.url?.endsWith("/reserve")) {
        res.end(
          JSON.stringify({
            ok: true,
            slug: body.slug,
            hostname: "probe.gate.test",
            publicUrl: "https://probe.gate.test",
            tunnelId: "t-gate-1",
            tunnelToken: "tok-gate-abc",
            emailDomain: "probe.mail.gate.test",
            emailInboundSecret: "inbound-secret-gate",
          }),
        );
        return;
      }
      if (req.url?.endsWith("/configure")) {
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "not found" }));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({
        baseUrl: `http://127.0.0.1:${port}/prov`,
        calls,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

/** Faux cloudflared : écrit ses args puis émet la ligne « Registered … ». */
function writeFakeCloudflared(dir) {
  const bin = path.join(dir, "cloudflared");
  fs.writeFileSync(
    bin,
    `#!/bin/sh
printf '%s\\n' "$@" > "$CREEZIO_GATE_CF_MARKER"
echo "Registered tunnel connection (gate stub)"
# exec : child.kill() du kit tue bien le sleep (pas d'orphelin qui retient
# les pipes stdio du process de test).
exec sleep 300
`,
    { mode: 0o755 },
  );
  return bin;
}

test("HPP1 harness : catalogue post-listen + tunnel stub + MCP public + plugins + fleet", async () => {
  const saved = saveEnv();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-parity-"));
  const provisioner = await startStubProvisioner();
  const marker = path.join(tmp, "cloudflared-args.txt");
  let handle = null;
  try {
    delete process.env.AUTH_SECRET;
    delete process.env.MCP_JWT_SECRET;
    delete process.env.EMAIL_INBOUND_SECRET;
    delete process.env.EMAIL_DOMAIN;
    delete process.env.CREEZIO_FLEET_ENDPOINT; // sentinelle ingest-disabled
    process.env.CREEZIO_SKIP_KIT_BINARIES = "1";
    process.env.CREEZIO_NATIVE_WARM = "0";
    process.env.CREEZIO_PLUGINS = "1";
    process.env.CREEZIO_TUNNEL_PROVISION_URL = provisioner.baseUrl;
    process.env.CREEZIO_TUNNEL_PROVISION_TOKEN = "gate-token";
    process.env.CREEZIO_TUNNEL_SLUG = "probe";
    process.env.CREEZIO_CLOUDFLARED_BINARY = writeFakeCloudflared(tmp);
    process.env.CREEZIO_GATE_CF_MARKER = marker;

    const manifest = createAppManifest({
      brandId: "harnessprobe",
      productName: "Harness Probe",
      domain: "harnessprobe.local",
      sandbox: true,
    });

    // Host catalogue stub : enregistre l'état de METIER_BASE_URL au moment
    // de l'import — la régression corrigée était « import avant listen ».
    const importCalls = [];
    const catalogHost = {
      RateEstimator: class {},
      formatEta: () => "—",
      ensureCatalogPresent: async (onProgress) => {
        onProgress({ phase: "done", percent: 100, detail: "stub présent" });
        return "present";
      },
      ensureCatalogImported: async (onProgress) => {
        importCalls.push({
          metierBaseUrl: (process.env.METIER_BASE_URL || "").trim(),
        });
        onProgress({ phase: "done", percent: 100, detail: "stub importé" });
        return "imported";
      },
    };

    handle = await startBrandKernelHarness({
      brandId: "harnessprobe",
      appRoot: tmp,
      dataDir: path.join(tmp, "data"),
      manifest,
      brandMigrations: [],
      registerModuleApi: () => {},
      skipIndex: true,
      catalogHost,
    });

    // 1) Import catalogue appelé APRÈS le listen, avec l'URL kernel réelle.
    assert.equal(importCalls.length, 1, "ensureCatalogImported appelé 1×");
    assert.equal(
      importCalls[0].metierBaseUrl,
      handle.baseUrl,
      "METIER_BASE_URL posé avant l'import (plus de skip pré-listen)",
    );

    // 2) Provisioner stub : reserve puis configure avec le port CRM réel.
    const reserve = provisioner.calls.find((c) => c.url?.endsWith("/reserve"));
    const configure = provisioner.calls.find((c) =>
      c.url?.endsWith("/configure"),
    );
    assert.ok(reserve, "reserveTunnel appelé");
    assert.equal(reserve.body.slug, "probe");
    assert.ok(configure, "configureTunnelIngress appelé");
    assert.equal(configure.body.crmPort, handle.port);

    // 3) cloudflared spawné avec le token du provisioner (faux binaire).
    const cfArgs = fs.readFileSync(marker, "utf8").trim().split("\n");
    assert.deepEqual(
      cfArgs,
      ["tunnel", "--no-autoupdate", "run", "--token", "tok-gate-abc"],
      "startCloudflared lance le binaire avec le token réservé",
    );

    // 4) Boot-status : étapes serveur visibles et vertes.
    const status = await (
      await fetch(`${handle.baseUrl}/api/v1/os/boot-status`)
    ).json();
    const step = (id) => status.steps.find((s) => s.id === id);
    assert.equal(step("catalog-import")?.status, "done", JSON.stringify(step("catalog-import")));
    assert.equal(step("tunnel")?.status, "done", JSON.stringify(step("tunnel")));
    assert.equal(step("plugins")?.status, "done", JSON.stringify(step("plugins")));
    assert.equal(step("fleet")?.status, "done", JSON.stringify(step("fleet")));
    assert.match(
      String(step("fleet")?.detail || ""),
      /sentinelle|désactivée/i,
      "fleet sans endpoint réel = no-op propre (pas d'envoi réseau)",
    );
    assert.match(
      String(step("plugins")?.detail || ""),
      /API http:\/\/127\.0\.0\.1:\d+/,
      "control plane plugins démarré",
    );

    // 5) MCP OAuth public = URL tunnel https (plus de loopback forcé).
    const mcpStatus = await (
      await fetch(`${handle.baseUrl}/api/v1/os/mcp-oauth/status`)
    ).json();
    assert.ok(
      String(mcpStatus.publicUrl || "").startsWith("https://probe.gate.test"),
      `MCP public attendu sur le tunnel: ${JSON.stringify(mcpStatus)}`,
    );
    assert.equal(process.env.APP_PUBLIC_URL, "https://probe.gate.test");
    assert.equal(process.env.MCP_PUBLIC_URL, "https://probe.gate.test");

    // 6) Secret mails entrants posé depuis le provisioner (env in-process).
    assert.equal(process.env.EMAIL_INBOUND_SECRET, "inbound-secret-gate");
    assert.equal(process.env.EMAIL_DOMAIN, "probe.mail.gate.test");
  } finally {
    await handle?.close();
    await provisioner.close();
    restoreEnv(saved);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("HPP2 ordre harness + Dockerfile cloudflared + template factory", () => {
  const harness = fs.readFileSync(
    path.join(ROOT, "packages/app-runtime/src/start-brand-kernel-harness.ts"),
    "utf8",
  );
  const listenAt = harness.indexOf("listenBrandOsHttp({");
  const importAt = harness.indexOf("runHarnessCatalogImportPhase({");
  const warmAt = harness.indexOf("warmBrandNativeHosts(brandOs");
  const bridgeAt = harness.indexOf("runHarnessHermesBridgePhase({");
  assert.ok(listenAt > 0 && importAt > 0 && warmAt > 0 && bridgeAt > 0);
  assert.ok(
    listenAt < importAt,
    "import catalogue APRÈS le listen HTTP (METIER_BASE_URL posé)",
  );
  assert.ok(
    warmAt < bridgeAt,
    "bridge Hermes APRÈS le warm des hosts natifs",
  );
  assert.match(harness, /n8nPublicBaseUrl/, "warm n8n reçoit l'URL publique");
  assert.match(harness, /runHarnessTunnelPhase/, "phase tunnel câblée");
  assert.match(harness, /runHarnessFleetPhase/, "phase fleet câblée");
  assert.match(harness, /runHarnessPluginsPhase/, "phase plugins câblée");

  const dockerfile = fs.readFileSync(
    path.join(ROOT, "docker/server/Dockerfile"),
    "utf8",
  );
  assert.match(dockerfile, /AS cloudflared/, "stage cloudflared dans l'image");
  assert.match(
    dockerfile,
    /CREEZIO_CLOUDFLARED_BINARY=\/opt\/creezio\/bin\/cloudflared/,
    "binaire cloudflared exposé via env générique",
  );

  // Kit-first : le template factory du harness embarque les mêmes décisions
  // (défauts catalogue + modules optionnels) pour TOUTE app générée.
  const template = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/generators/native-runtime.ts"),
    "utf8",
  );
  assert.match(template, /applyBrandCatalogEnvDefaults/);
  assert.match(template, /importOptional\("catalog-sync\.js"\)/);
  assert.match(template, /importOptional\("brand-mcp-tools\.js"\)/);
  assert.match(template, /importOptional\("brand-platform-bindings\.js"\)/);
  const bare = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/scaffold.ts"),
    "utf8",
  );
  assert.match(bare, /applyBrandCatalogEnvDefaults/);

  // cloudflaredBinary honore l'override générique kit (image Docker).
  const tunnel = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/host/tunnel/tunnel.ts"),
    "utf8",
  );
  assert.match(tunnel, /CREEZIO_CLOUDFLARED_BINARY/);
});

test("HPP3 applyBrandCatalogEnvDefaults : léger par défaut, opt-in prod", () => {
  const saved = {
    CREEZIO_CATALOG: process.env.CREEZIO_CATALOG,
    HPPX_CATALOG_DISABLE: process.env.HPPX_CATALOG_DISABLE,
    HPPX_CATALOG_ENABLE: process.env.HPPX_CATALOG_ENABLE,
    HPPX_CATALOG_LOCAL_PATH: process.env.HPPX_CATALOG_LOCAL_PATH,
  };
  try {
    for (const k of Object.keys(saved)) delete process.env[k];

    applyBrandCatalogEnvDefaults("HPPX");
    assert.equal(
      process.env.HPPX_CATALOG_DISABLE,
      "1",
      "tests/CI : catalogue désactivé par défaut",
    );

    delete process.env.HPPX_CATALOG_DISABLE;
    process.env.CREEZIO_CATALOG = "1";
    applyBrandCatalogEnvDefaults("HPPX");
    assert.equal(
      process.env.HPPX_CATALOG_DISABLE,
      undefined,
      "CREEZIO_CATALOG=1 (Docker prod) : catalogue activé",
    );

    delete process.env.CREEZIO_CATALOG;
    process.env.HPPX_CATALOG_LOCAL_PATH = "/tmp/x.db";
    applyBrandCatalogEnvDefaults("HPPX");
    assert.equal(
      process.env.HPPX_CATALOG_DISABLE,
      undefined,
      "seed local explicite : pas de désactivation",
    );

    delete process.env.HPPX_CATALOG_LOCAL_PATH;
    process.env.HPPX_CATALOG_ENABLE = "1";
    applyBrandCatalogEnvDefaults("HPPX");
    assert.equal(process.env.HPPX_CATALOG_DISABLE, undefined);

    delete process.env.HPPX_CATALOG_ENABLE;
    process.env.HPPX_CATALOG_DISABLE = "0";
    applyBrandCatalogEnvDefaults("HPPX");
    assert.equal(
      process.env.HPPX_CATALOG_DISABLE,
      "0",
      "DISABLE=0 explicite respecté",
    );
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
