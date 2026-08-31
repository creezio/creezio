#!/usr/bin/env node
/**
 * Gate T7 — tunnel cloudflared DÉDIÉ au host-agent.
 *
 * L'ingress `agent.{slug}.{zone}` ne passe plus par le cloudflared d'un
 * serveur applicatif : container dédié `creezio-agent-tunnel`, provisionné
 * à l'enroll (volet API CF : test-phase-tunnel-self-provision §10).
 * Ici, le volet HÔTE :
 *
 *  1. politique de respawn du watch fleet (miroir cloudflared-respawn,
 *     bornée : ignore/respawn/give-up, backoff, reset après uptime sain,
 *     overrides env bornés) ;
 *  2. boucle de surveillance (docker injecté — aucun daemon requis) :
 *     absent = idle loggé une fois, mort → restart borné, abandon après N,
 *     stop() annule, container redevenu sain → compteur remis à zéro ;
 *  3. contrats source : helpers factory (container/run-args/env-file 600,
 *     token JAMAIS en argv), ordre de migration douce de l'enroll
 *     (provision → connecteur → bascule DNS → retrait règle legacy),
 *     host-agent démarre le watch, jamais de POST cfd_tunnel côté watch,
 *     noms de container alignés fleet ↔ factory.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const fleetDist = path.join(ROOT, "packages/fleet/dist/agent-tunnel.js");
assert.ok(
  fs.existsSync(fleetDist),
  "packages/fleet/dist/agent-tunnel.js absent — npm run build -w @creezio/fleet",
);
const {
  AGENT_TUNNEL_CONTAINER,
  AGENT_TUNNEL_RESPAWN,
  agentTunnelRespawnDelayMs,
  resolveAgentTunnelRespawnPolicy,
  shouldRespawnAgentTunnel,
  startAgentTunnelWatch,
} = await import(pathToFileURL(fleetDist).href);

const factoryDist = path.join(
  ROOT,
  "packages/factory/dist/server-docker-agent-tunnel.js",
);
assert.ok(
  fs.existsSync(factoryDist),
  "packages/factory/dist/server-docker-agent-tunnel.js absent — npm run build -w @creezio/factory",
);
const factory = await import(pathToFileURL(factoryDist).href);

function poll(fn, { timeoutMs = 4_000, intervalMs = 20 } = {}) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      const v = fn();
      if (v) {
        clearInterval(timer);
        resolve(v);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`poll timeout après ${timeoutMs}ms`));
      }
    }, intervalMs);
  });
}

/* ── 1. politique ── */

test("politique : stop volontaire → ignore ; container mort → respawn backoff ; abandon", () => {
  const policy = {
    ...AGENT_TUNNEL_RESPAWN,
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 400,
    healthyResetMs: 1_000,
  };
  assert.deepEqual(
    shouldRespawnAgentTunnel({
      stopping: true,
      consecutiveFailures: 0,
      startedAtMs: Date.now(),
      observedStatus: "exited",
      policy,
    }),
    { action: "ignore" },
  );
  const dead = shouldRespawnAgentTunnel({
    stopping: false,
    consecutiveFailures: 0,
    startedAtMs: Date.now(),
    observedStatus: "exited",
    nowMs: Date.now(),
    policy,
  });
  assert.equal(dead.action, "respawn");
  assert.equal(dead.attempt, 1);
  assert.equal(dead.delayMs, 100);
  assert.match(dead.reason, /exited/);
  const second = shouldRespawnAgentTunnel({
    stopping: false,
    consecutiveFailures: 1,
    startedAtMs: Date.now(),
    observedStatus: "dead",
    nowMs: Date.now(),
    policy,
  });
  assert.equal(second.attempt, 2);
  assert.equal(second.delayMs, 200);
  const giveUp = shouldRespawnAgentTunnel({
    stopping: false,
    consecutiveFailures: 3,
    startedAtMs: 1_000,
    observedStatus: "exited",
    nowMs: 1_500,
    policy,
  });
  assert.equal(giveUp.action, "give-up");
  assert.equal(giveUp.attempt, 4);
  // Uptime sain ≥ healthyResetMs → compteur remis à zéro.
  const reset = shouldRespawnAgentTunnel({
    stopping: false,
    consecutiveFailures: 7,
    startedAtMs: 1_000,
    observedStatus: "exited",
    nowMs: 1_000 + 1_000,
    policy,
  });
  assert.equal(reset.action, "respawn");
  assert.equal(reset.attempt, 1);
});

test("politique : backoff borné + mêmes défauts que cloudflared-respawn + overrides env bornés", () => {
  assert.equal(agentTunnelRespawnDelayMs(1), 1_000);
  assert.equal(agentTunnelRespawnDelayMs(2), 2_000);
  assert.equal(agentTunnelRespawnDelayMs(6), 30_000);
  assert.equal(agentTunnelRespawnDelayMs(20), 30_000);
  // Miroir de CLOUDFLARED_RESPAWN (host-runtime) — fleet reste Node pur.
  assert.deepEqual(AGENT_TUNNEL_RESPAWN, {
    maxAttempts: 8,
    initialDelayMs: 1_000,
    maxDelayMs: 30_000,
    factor: 2,
    healthyResetMs: 60_000,
  });
  const p = resolveAgentTunnelRespawnPolicy({
    CREEZIO_AGENT_TUNNEL_RESPAWN_MAX: "2",
    CREEZIO_AGENT_TUNNEL_RESPAWN_DELAY_MS: "40",
    CREEZIO_AGENT_TUNNEL_RESPAWN_MAX_DELAY_MS: "80",
    CREEZIO_AGENT_TUNNEL_RESPAWN_HEALTHY_MS: "10",
  });
  assert.deepEqual(p, {
    maxAttempts: 2,
    initialDelayMs: 40,
    maxDelayMs: 80,
    factor: 2,
    healthyResetMs: 10,
  });
  const bad = resolveAgentTunnelRespawnPolicy({
    CREEZIO_AGENT_TUNNEL_RESPAWN_MAX: "0",
    CREEZIO_AGENT_TUNNEL_RESPAWN_DELAY_MS: "nope",
  });
  assert.equal(bad.maxAttempts, AGENT_TUNNEL_RESPAWN.maxAttempts);
  assert.equal(bad.initialDelayMs, AGENT_TUNNEL_RESPAWN.initialDelayMs);
});

/* ── 2. watch (docker injecté) ── */

function fakeDocker(initial) {
  const state = {
    view: initial, // null = absent, sinon {running, status, startedAtMs}
    starts: 0,
    onStart: null,
  };
  return {
    state,
    deps: {
      inspect: async () =>
        state.view === null
          ? null
          : { exists: true, ...state.view },
      start: async () => {
        state.starts += 1;
        if (state.onStart) state.onStart();
      },
      log: () => {},
    },
  };
}

test("watch : container mort → restart, puis sain → compteur remis à zéro", async () => {
  const logs = [];
  const fake = fakeDocker({ running: false, status: "exited", startedAtMs: null });
  fake.state.onStart = () => {
    fake.state.view = {
      running: true,
      status: "running",
      startedAtMs: Date.now(),
    };
  };
  fake.deps.log = (l) => logs.push(l);
  const watch = startAgentTunnelWatch({
    container: "creezio-agent-tunnel",
    intervalMs: 25,
    policy: {
      maxAttempts: 4,
      initialDelayMs: 10,
      maxDelayMs: 40,
      factor: 2,
      healthyResetMs: 60,
    },
    deps: fake.deps,
  });
  try {
    await poll(() => fake.state.starts >= 1);
    assert.equal(watch.getStatus().consecutiveFailures, 1);
    // Sain ≥ healthyResetMs → reset.
    await poll(() => watch.getStatus().consecutiveFailures === 0, {
      timeoutMs: 3_000,
    });
    assert.equal(watch.getStatus().observed, "running");
    assert.equal(watch.getStatus().gaveUp, false);
    assert.ok(
      logs.some((l) => /respawn/.test(l)),
      `log respawn manquant: ${logs.join(" | ")}`,
    );
    assert.ok(logs.some((l) => /compteur de pannes remis à zéro/.test(l)));
  } finally {
    watch.stop();
  }
});

test("watch : abandon après N essais (pas de boucle folle), repart si redevenu sain", async () => {
  const logs = [];
  const fake = fakeDocker({ running: false, status: "exited", startedAtMs: null });
  fake.deps.log = (l) => logs.push(l);
  const watch = startAgentTunnelWatch({
    container: "creezio-agent-tunnel",
    intervalMs: 20,
    policy: {
      maxAttempts: 2,
      initialDelayMs: 5,
      maxDelayMs: 10,
      factor: 2,
      healthyResetMs: 50,
    },
    deps: fake.deps,
  });
  try {
    await poll(() => watch.getStatus().gaveUp, { timeoutMs: 3_000 });
    const startsAtGiveUp = fake.state.starts;
    assert.equal(startsAtGiveUp, 2, "starts = maxAttempts puis abandon");
    assert.ok(logs.some((l) => /abandon après/.test(l)));
    await new Promise((r) => setTimeout(r, 120));
    assert.equal(fake.state.starts, startsAtGiveUp, "plus aucun start après abandon");
    // Redevenu sain (ex. docker start manuel) → le watch repart.
    fake.state.view = {
      running: true,
      status: "running",
      startedAtMs: Date.now() - 60_000,
    };
    await poll(() => watch.getStatus().gaveUp === false, { timeoutMs: 3_000 });
    assert.equal(watch.getStatus().consecutiveFailures, 0);
  } finally {
    watch.stop();
  }
});

test("watch : container absent = idle loggé UNE fois ; stop() annule", async () => {
  const logs = [];
  const fake = fakeDocker(null);
  fake.deps.log = (l) => logs.push(l);
  const watch = startAgentTunnelWatch({
    container: "creezio-agent-tunnel",
    intervalMs: 15,
    deps: fake.deps,
  });
  try {
    await poll(() => logs.length >= 1);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(
      logs.filter((l) => /non provisionné/.test(l)).length,
      1,
      `log absent répété: ${logs.join(" | ")}`,
    );
    assert.equal(fake.state.starts, 0, "jamais de start sur container absent");
    assert.equal(watch.getStatus().observed, "absent");
  } finally {
    watch.stop();
  }
  // stop() : un container mort après stop ne déclenche plus rien.
  const fake2 = fakeDocker({ running: false, status: "exited", startedAtMs: null });
  const watch2 = startAgentTunnelWatch({
    container: "creezio-agent-tunnel",
    intervalMs: 10,
    policy: {
      maxAttempts: 8,
      initialDelayMs: 5,
      maxDelayMs: 10,
      factor: 2,
      healthyResetMs: 50,
    },
    deps: fake2.deps,
  });
  watch2.stop();
  await new Promise((r) => setTimeout(r, 80));
  assert.equal(fake2.state.starts, 0, "stop() annule la boucle");
});

/* ── 3. contrats factory (helpers purs via dist) ── */

test("factory : run-args du connecteur (network host, restart, token via env-file JAMAIS en argv)", () => {
  assert.equal(factory.AGENT_TUNNEL_CONTAINER, AGENT_TUNNEL_CONTAINER);
  assert.equal(AGENT_TUNNEL_CONTAINER, "creezio-agent-tunnel");
  const args = factory.buildAgentTunnelRunArgs({
    image: "cloudflare/cloudflared:latest",
    envFile: "/opt/docker/brand/docker-data/agent-tunnel.env",
  });
  assert.deepEqual(args, [
    "run",
    "-d",
    "--name",
    "creezio-agent-tunnel",
    "--restart",
    "unless-stopped",
    "--network",
    "host",
    "--label",
    "creezio.agent-tunnel=1",
    "--env-file",
    "/opt/docker/brand/docker-data/agent-tunnel.env",
    "cloudflare/cloudflared:latest",
    "tunnel",
    "--no-autoupdate",
    "--protocol",
    "http2",
    "run",
  ]);
  assert.ok(
    !args.some((a) => /--token/.test(a)),
    "token jamais en argv (docker inspect / ps)",
  );
  assert.equal(
    factory.agentTunnelEnvPath("/opt/docker/brand"),
    path.join("/opt/docker/brand", "docker-data", "agent-tunnel.env"),
  );
  const rendered = factory.renderAgentTunnelEnvFile("tok-gate-1");
  assert.match(rendered, /^TUNNEL_TOKEN=tok-gate-1$/m);
  assert.throws(
    () => factory.renderAgentTunnelEnvFile("  "),
    /tunnelToken vide/,
  );
  assert.equal(
    factory.resolveAgentTunnelImage({}),
    "cloudflare/cloudflared:latest",
  );
  assert.equal(
    factory.resolveAgentTunnelImage({
      CREEZIO_AGENT_TUNNEL_IMAGE: "mirror.local/cloudflared:2024",
    }),
    "mirror.local/cloudflared:2024",
  );
});

/* ── 4. contrats source (enroll / host-agent / fail-closed) ── */

test("source : enroll = provision → connecteur → bascule DNS → retrait règle legacy (migration douce)", () => {
  const cli = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/server-docker-cli.ts"),
    "utf8",
  );
  const iEnsure = cli.indexOf("cf.ensureCfAgentTunnel(");
  const iContainer = cli.indexOf(
    "ensureAgentTunnelContainer({ env: process.env, envFile, recreate: true })",
  );
  const iDns = cli.indexOf("cf.ensureCfAgentTunnelDns(");
  const iLegacy = cli.indexOf("cf.removeCfTunnelAgentRule(");
  assert.ok(iEnsure > 0, "enroll provisionne le tunnel dédié (ensureCfAgentTunnel)");
  assert.ok(
    iEnsure < iContainer && iContainer < iDns && iDns < iLegacy,
    `ordre migration douce cassé (ensure=${iEnsure}, container=${iContainer}, dns=${iDns}, legacy=${iLegacy})`,
  );
  // La bascule DNS est différée (dns: false à l'ensure) — pas de coupure.
  const enrollSlice = cli.slice(iEnsure, iDns);
  assert.match(enrollSlice, /dns: false/);
  // Plus JAMAIS d'ingress agent posé sur le tunnel du serveur à l'enroll.
  assert.ok(
    !/agent:\s*\{\s*host:\s*"host\.docker\.internal"/.test(cli),
    "l'enroll ne pose plus la règle agent sur le tunnel partagé du serveur",
  );
  // agent up relance le connecteur si l'env file existe (reprise sans re-enroll).
  assert.match(cli, /recreate: false/);
  // Token connecteur : env file 600 uniquement.
  assert.match(cli, /writeAgentTunnelEnv/);

  const helper = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/server-docker-agent-tunnel.ts"),
    "utf8",
  );
  assert.match(helper, /mode: 0o600|chmod|600/);
});

test("source : host-agent démarre le watch ; le watch ne (re)crée JAMAIS de tunnel CF", () => {
  const hostAgent = fs.readFileSync(
    path.join(ROOT, "packages/fleet/src/host-agent.ts"),
    "utf8",
  );
  assert.match(hostAgent, /startAgentTunnelWatch/);
  assert.match(hostAgent, /CREEZIO_AGENT_TUNNEL_WATCH/);
  const agentTunnel = fs.readFileSync(
    path.join(ROOT, "packages/fleet/src/agent-tunnel.ts"),
    "utf8",
  );
  // Fail-closed #84/#86/#87 (même règle que cloudflared-respawn) : la
  // surveillance redémarre un container existant, elle ne touche pas l'API CF.
  assert.match(agentTunnel, /jamais de POST/);
  assert.doesNotMatch(agentTunnel, /ensureCfTunnel\(|createCfTunnel\(|cfApi\(/);
  assert.doesNotMatch(
    agentTunnel,
    /^import /m,
    "agent-tunnel.ts reste autonome (Node pur, zéro import — docker injecté)",
  );
});
