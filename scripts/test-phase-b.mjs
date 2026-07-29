#!/usr/bin/env node
/**
 * Tests kit Phase B — modules purs (sans Electron GUI).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  tempoflowManifest,
  certivanManifest,
  fiduManifest,
  buildElectronBuilderConfig,
  envKey,
  exeForKind,
  getManifest,
  listBrandIds,
} from "../packages/brand-config/dist/index.js";
import {
  parseAppKind,
  resolveAppKind,
  bootBehaviorFor,
  isAllowedServerCockpitPath,
  userDataDirForAppKind,
  normalizeRemoteUrl,
  sanitizeConnectionProfile,
  parseProfileArgv,
  parseJoinDeepLink,
  buildTunnelPublicUrls,
  deriveTunnelServiceUrl,
  reduceUpdateEvent,
  initialUpdateStatus,
  factoryResetTargets,
  buildNextHostEnv,
  feedUrlForKind,
} from "../packages/platform-core/dist/index.js";
import { IpcChannels, createDesktopApi } from "../packages/shell/dist/index.js";
import {
  createLocalSplashSteps,
  computeOverallPercent,
  activateSplashStep,
  completeSplashStep,
} from "../packages/electron-shell/dist/index.js";

test("manifests : client + serveur obligatoires", () => {
  for (const id of listBrandIds()) {
    const m = getManifest(id);
    assert.ok(m.client.appId, id);
    assert.ok(m.server.appId, id);
    assert.notEqual(m.client.appId, m.server.appId);
    assert.ok(m.deepLinkProtocol);
    assert.ok(m.sessionPartition);
    assert.ok(m.tunnelRootDomain);
    assert.ok(m.client.feedUrl.endsWith("/"));
    assert.ok(m.server.feedUrl.includes("/server"));
  }
});

test("app-kind : résolution + boot behavior", () => {
  assert.equal(parseAppKind(" SERVER "), "server");
  assert.equal(resolveAppKind({}), "legacy");
  assert.equal(resolveAppKind({ env: "client" }), "client");

  const serverBoot = bootBehaviorFor("server", { mode: "server" });
  assert.equal(serverBoot.allowLocalStack, true);
  assert.equal(serverBoot.forceLocalProfile, true);
  assert.equal(serverBoot.registerDeepLink, false);
  assert.equal(serverBoot.cockpitPath, "/server-cockpit");

  const clientBoot = bootBehaviorFor("client", { mode: "server" });
  assert.equal(clientBoot.allowLocalStack, false);
  assert.equal(clientBoot.requireRemoteProfile, true);
  assert.equal(clientBoot.pickerVariant, "join-only");

  assert.ok(isAllowedServerCockpitPath("/server-cockpit"));
  assert.equal(isAllowedServerCockpitPath("/dashboard"), false);

  const ud = userDataDirForAppKind(
    tempoflowManifest,
    "server",
    "/home/u/.config/tempoflow2-crm",
  );
  assert.ok(ud?.endsWith("TempoFlow Server"));
});

test("connection + profile + tunnel", () => {
  assert.equal(
    normalizeRemoteUrl("cabinet.tempoflow.fr"),
    "http://cabinet.tempoflow.fr",
  );
  const p = sanitizeConnectionProfile({ mode: "remote", remoteUrl: "https://x.test/" });
  assert.equal(p.mode, "remote");
  assert.equal(p.remoteUrl, "https://x.test");

  const join = parseJoinDeepLink(
    "tempoflow://join/cabinet.tempoflow.fr",
    "tempoflow",
  );
  assert.equal(join, "https://cabinet.tempoflow.fr");

  const launch = parseProfileArgv(
    ["node", "main", "--tf2-profile=join:http://127.0.0.1:3456"],
    tempoflowManifest,
  );
  assert.equal(launch.mode, "join");
  assert.equal(launch.serverUrl, "http://127.0.0.1:3456");

  const urls = buildTunnelPublicUrls("resto1.tempoflow.fr");
  assert.equal(urls.n8n, "https://n8n.resto1.tempoflow.fr");
  assert.equal(
    deriveTunnelServiceUrl("https://resto1.tempoflow.fr", "hermes", "tempoflow.fr"),
    "https://hermes.resto1.tempoflow.fr",
  );
  assert.equal(
    deriveTunnelServiceUrl("https://other.example", "n8n", "tempoflow.fr"),
    null,
  );
});

test("updater reduce + builder config", () => {
  let st = initialUpdateStatus("1.0.0");
  st = reduceUpdateEvent(st, { type: "idle" });
  assert.equal(st.state, "idle");
  st = reduceUpdateEvent(st, { type: "available", version: "1.1.0" });
  assert.equal(st.updateAvailable, true);

  const base = {
    files: ["build/electron/**/*", "!node_modules/**/*", "node_modules/electron-updater/**/*"],
    extraResources: [{ from: "vendor/meili", to: "vendor/meili" }, { from: "build/electron" }],
    win: {},
  };
  const serverCfg = buildElectronBuilderConfig(tempoflowManifest, "server", base);
  assert.equal(serverCfg.appId, tempoflowManifest.server.appId);
  assert.equal(serverCfg.executableName, "TF2-Server");
  assert.equal(serverCfg.publish.url, tempoflowManifest.server.feedUrl);
  const serverFiles = serverCfg.files || [];
  assert.ok(
    serverFiles.some(
      (e) =>
        typeof e === "object" &&
        e?.from === "vendor/creezio/brand-config" &&
        e?.to === "node_modules/@creezio/brand-config",
    ),
    "server : asar embarque @creezio/brand-config depuis vendor/",
  );
  for (const pkg of [
    "brand-config",
    "platform-core",
    "product-hub",
    "shell",
    "electron-shell",
  ]) {
    assert.ok(
      serverFiles.some(
        (e) =>
          typeof e === "object" && e?.from === `vendor/creezio/${pkg}`,
      ),
      `server : asar embarque @creezio/${pkg}`,
    );
  }

  const clientCfg = buildElectronBuilderConfig(certivanManifest, "client", base);
  assert.equal(clientCfg.appId, certivanManifest.client.appId);
  const extras = clientCfg.extraResources;
  assert.ok(Array.isArray(extras));
  assert.ok(!extras.some((e) => String(e.from || e).startsWith("vendor/")));
  assert.ok(
    (clientCfg.files || []).some(
      (e) =>
        typeof e === "object" &&
        e?.from === "vendor/creezio/brand-config",
    ),
    "client slim : asar embarque aussi @creezio/*",
  );
});

test("paths / env brand / factory targets", () => {
  assert.equal(envKey(fiduManifest, "APP_KIND"), "FIDU_APP_KIND");
  assert.equal(
    feedUrlForKind(fiduManifest, "client"),
    fiduManifest.client.feedUrl,
  );
  const env = buildNextHostEnv({
    manifest: tempoflowManifest,
    port: 3000,
    hostname: "127.0.0.1",
    dbPath: "/tmp/x.db",
    assistantDbPath: "/tmp/a.db",
    uploadsDir: "/tmp/u",
  });
  assert.equal(env.PORT, "3000");
  assert.equal(env.TF2_BRAND_ID, "tempoflow");

  const targets = factoryResetTargets({
    manifest: tempoflowManifest,
    userDataRoot: "/tmp/ud",
    isPackaged: true,
  });
  assert.ok(targets.some((t) => t.endsWith("tempoflow-config.json")));
  assert.ok(targets.some((t) => t.includes("tempoflow-node")));
});

test("shell createDesktopApi + IPC", () => {
  assert.equal(IpcChannels.desktop.info, "desktop:info");
  const calls = [];
  const api = createDesktopApi({
    invoke: async (ch, ...args) => {
      calls.push([ch, ...args]);
      return { ok: true };
    },
    send: (ch) => calls.push([ch]),
    on: () => {},
    removeListener: () => {},
  });
  assert.equal(api.isDesktop, true);
  void api.getInfo();
  assert.equal(calls[0][0], "desktop:info");
});

test("splash model", () => {
  let model = {
    headline: "Boot",
    bootStartedAt: Date.now(),
    overallPercent: 0,
    steps: createLocalSplashSteps({
      needIndex: false,
      needNode: true,
      needHermes: false,
      needN8n: false,
      needTunnel: false,
    }),
    footer: "",
  };
  model = activateSplashStep(model, "migrations", { detail: "…" });
  assert.equal(model.steps.find((s) => s.id === "migrations")?.status, "running");
  model = completeSplashStep(model, "migrations");
  assert.ok(computeOverallPercent(model.steps) > 0);
});

test("exeForKind", () => {
  assert.equal(exeForKind(tempoflowManifest, "client").productName, "TempoFlow");
  assert.equal(exeForKind(tempoflowManifest, "server").productName, "TempoFlow Server");
});
