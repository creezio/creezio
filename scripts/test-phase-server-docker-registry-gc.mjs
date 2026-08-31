#!/usr/bin/env node
/**
 * Gate — `creezio server-docker registry-gc` (dette T11).
 *
 * Toujours : fonctions pures + mock HTTP (pas de Docker requis).
 * Optionnel : registry:2 éphémère si le daemon Docker est dispo.
 * Skip live explicite (raison affichée), jamais silencieux.
 *
 * SoT : packages/factory/src/server-docker-registry-gc.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "packages/factory/dist/server-docker-registry-gc.js");
const CLI = path.join(ROOT, "packages/factory/src/server-docker-cli.ts");
const BIN = path.join(ROOT, "packages/factory/bin/creezio.js");

assert.ok(
  fs.existsSync(DIST),
  "packages/factory/dist/server-docker-registry-gc.js absent — npm run build -w @creezio/factory",
);

const gc = await import(new URL(`file://${DIST}`).href);

function mockRes(status, body = {}, headers = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get(name) {
        const key = Object.keys(headers).find(
          (k) => k.toLowerCase() === name.toLowerCase(),
        );
        return key ? headers[key] : null;
      },
    },
    json: async () => (typeof body === "string" ? JSON.parse(body || "{}") : body),
    text: async () => text,
  };
}

function createMemoryRegistry(initial) {
  const repos = structuredClone(initial);
  const deleted = [];
  const http = {
    down: false,
    deleteStatus: 202,
    async request(url, init) {
      if (http.down) {
        throw new Error("registre injoignable (http://127.0.0.1:9/v2/) — ECONNREFUSED");
      }
      const u = new URL(url);
      const method = (init?.method || "GET").toUpperCase();
      if (u.pathname === "/v2/" && method === "GET") return mockRes(200, {});
      if (u.pathname === "/v2/_catalog") {
        return mockRes(200, { repositories: Object.keys(repos) });
      }
      const tags = /^\/v2\/(.+)\/tags\/list$/.exec(u.pathname);
      if (tags) {
        const repo = tags[1];
        const list = Object.keys(repos[repo] || {});
        return mockRes(200, { name: repo, tags: list });
      }
      const man = /^\/v2\/(.+)\/manifests\/(.+)$/.exec(u.pathname);
      if (man) {
        const [, repo, ref] = man;
        const table = repos[repo] || {};
        if (method === "HEAD" || method === "GET") {
          const digest = table[ref] || (ref.startsWith("sha256:") ? ref : "");
          if (!digest || (ref.startsWith("sha256:") && !Object.values(table).includes(ref))) {
            if (!table[ref] && !Object.values(table).includes(ref)) {
              return mockRes(404, { errors: [{ code: "MANIFEST_UNKNOWN" }] });
            }
          }
          const resolved = table[ref] || ref;
          return mockRes(200, {}, { "Docker-Content-Digest": resolved });
        }
        if (method === "DELETE") {
          if (http.deleteStatus >= 400) {
            return mockRes(http.deleteStatus, { errors: [{ code: "DENIED" }] });
          }
          for (const [tag, digest] of Object.entries(table)) {
            if (digest === ref || tag === ref) delete table[tag];
          }
          deleted.push({ repo, ref });
          return mockRes(http.deleteStatus, {});
        }
      }
      return mockRes(404, {});
    },
  };
  return { repos, deleted, http };
}

function createMockDocker(opts = {}) {
  const state = {
    available: opts.available !== false,
    inUse: opts.inUse || [],
    running: opts.running !== false,
    gcStatus: opts.gcStatus ?? 0,
    gcCalls: 0,
  };
  return {
    state,
    available: () => state.available,
    listInUseImages: () => state.inUse,
    containerRunning: () => state.running,
    garbageCollect() {
      state.gcCalls += 1;
      return {
        status: state.gcStatus,
        stdout: state.gcStatus === 0 ? "blob eligible for deletion\n" : "",
        stderr: state.gcStatus === 0 ? "" : "gc failed",
      };
    },
  };
}

test("CLI help + dispatch registry-gc (source)", () => {
  const src = fs.readFileSync(CLI, "utf8");
  assert.match(src, /registry-gc/);
  assert.match(src, /runRegistryGcCommand/);
  assert.match(src, /--dry-run/);
  assert.match(src, /CREEZIO_REGISTRY_GC_KEEP/);
  const help = spawnSync(process.execPath, [BIN, "server-docker", "--help"], {
    encoding: "utf8",
  });
  assert.equal(help.status, 0, help.stderr || help.stdout);
  assert.match(help.stdout, /registry-gc/);
  assert.match(help.stdout, /--dry-run/);
  assert.match(help.stdout, /garbage-collect/);
});

test("parseImageRef + collectInUseKeys", () => {
  const a = gc.parseImageRef("127.0.0.1:5000/creezio-server-probe:0.2.1");
  assert.deepEqual(a, {
    host: "127.0.0.1:5000",
    repo: "creezio-server-probe",
    tag: "0.2.1",
    digest: undefined,
  });
  const b = gc.parseImageRef(
    "localhost:5000/library/alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  assert.equal(b.repo, "library/alpine");
  assert.equal(b.digest.startsWith("sha256:"), true);
  assert.equal(gc.parseImageRef("sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb").digest.startsWith("sha256:"), true);
  const keys = gc.collectInUseKeys([
    { ref: "127.0.0.1:5000/creezio-server-probe:0.1.0" },
    {
      ref: "127.0.0.1:5000/creezio-server-probe@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      digest: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    },
  ]);
  assert.ok(keys.tags.has("creezio-server-probe:0.1.0"));
  assert.ok(
    keys.digests.has(
      "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    ),
  );
});

test("compareVersionTags + selectTagsToPrune + planRepoGc", () => {
  assert.ok(gc.compareVersionTags("0.3.9", "0.3.10") < 0);
  assert.deepEqual(gc.selectTagsToPrune(["0.1.0", "0.3.0", "0.2.0"], 2), [
    "0.1.0",
  ]);
  assert.deepEqual(gc.selectTagsToPrune(["0.1.0"], 2), []);
  assert.equal(gc.REGISTRY_GC_KEEP_DEFAULT, 2);
  assert.equal(gc.resolveRegistryGcKeep({}), 2);
  assert.equal(gc.resolveRegistryGcKeep({ keepTags: 5 }), 5);
  assert.equal(
    gc.resolveRegistryGcKeep({}, { CREEZIO_REGISTRY_GC_KEEP: "3" }),
    3,
  );

  const plan = gc.planRepoGc({
    repo: "creezio-server-probe",
    tags: [
      { tag: "0.1.0", digest: "sha256:1" },
      { tag: "0.2.0", digest: "sha256:2" },
      { tag: "0.3.0", digest: "sha256:3" },
      { tag: "0.4.0", digest: "sha256:4" },
    ],
    keep: 2,
    inUseTags: new Set(["creezio-server-probe:0.1.0"]),
    inUseDigests: new Set(),
  });
  const kept = plan.keep.map((k) => `${k.tag}:${k.reason}`).sort();
  assert.deepEqual(kept, ["0.1.0:in-use", "0.3.0:recent", "0.4.0:recent"]);
  assert.deepEqual(
    plan.delete.map((d) => d.tag),
    ["0.2.0"],
  );

  const shared = gc.planRepoGc({
    repo: "creezio-server-probe",
    tags: [
      { tag: "0.1.0", digest: "sha256:same" },
      { tag: "0.2.0", digest: "sha256:2" },
      { tag: "latest", digest: "sha256:same" },
    ],
    keep: 1,
    inUseTags: new Set(),
    inUseDigests: new Set(),
  });
  assert.ok(shared.keep.some((k) => k.tag === "latest"));
  assert.ok(shared.skipShared.some((s) => s.tag === "0.1.0"));
  assert.deepEqual(
    shared.delete.map((d) => d.tag),
    ["0.2.0"],
  );

  assert.throws(
    () =>
      gc.planRepoGc({
        repo: "x",
        tags: [],
        keep: 0,
        inUseTags: new Set(),
        inUseDigests: new Set(),
      }),
    /--keep invalide/,
  );
});

test("mock HTTP : dry-run ne mute pas + garde le tag en usage", async () => {
  const mem = createMemoryRegistry({
    "creezio-server-probe": {
      "0.1.0": "sha256:aaa",
      "0.2.0": "sha256:bbb",
      "0.3.0": "sha256:ccc",
      "0.4.0": "sha256:ddd",
    },
  });
  const docker = createMockDocker({
    inUse: [{ ref: "127.0.0.1:5000/creezio-server-probe:0.1.0" }],
  });
  const logs = [];
  const dry = await gc.runRegistryGc({
    registry: "127.0.0.1:5000",
    keep: 2,
    dryRun: true,
    container: "creezio-registry",
    http: mem.http,
    docker,
    log: (l) => logs.push(l),
  });
  assert.equal(dry.dryRun, true);
  assert.equal(dry.gcRan, false);
  assert.equal(docker.state.gcCalls, 0);
  assert.equal(mem.deleted.length, 0);
  assert.ok(dry.kept.some((k) => k.tag === "0.1.0" && k.reason === "in-use"));
  assert.ok(logs.some((l) => /\[dry-run\]/.test(l)));
  assert.equal(
    Object.keys(mem.repos["creezio-server-probe"]).length,
    4,
    "dry-run ne supprime aucun tag",
  );
});

test("mock HTTP : DELETE hors rétention + GC, jamais le tag en usage", async () => {
  const mem = createMemoryRegistry({
    "creezio-server-probe": {
      "0.1.0": "sha256:aaa",
      "0.2.0": "sha256:bbb",
      "0.3.0": "sha256:ccc",
      "0.4.0": "sha256:ddd",
    },
  });
  const docker = createMockDocker({
    inUse: [{ ref: "127.0.0.1:5000/creezio-server-probe:0.1.0" }],
  });
  const out = await gc.runRegistryGc({
    registry: "127.0.0.1:5000",
    keep: 2,
    dryRun: false,
    container: "creezio-registry",
    http: mem.http,
    docker,
    log: () => {},
  });
  assert.equal(out.gcRan, true);
  assert.equal(docker.state.gcCalls, 1);
  assert.deepEqual(
    out.deleted.map((d) => d.tag).sort(),
    ["0.2.0"],
  );
  assert.ok(!out.deleted.some((d) => d.tag === "0.1.0"));
  assert.deepEqual(
    Object.keys(mem.repos["creezio-server-probe"]).sort(),
    ["0.1.0", "0.3.0", "0.4.0"],
  );
});

test("fail-closed : docker absent / registre down / DELETE KO / GC KO", async () => {
  const base = {
    registry: "127.0.0.1:5000",
    keep: 2,
    dryRun: false,
    container: "creezio-registry",
    log: () => {},
  };

  await assert.rejects(
    () =>
      gc.runRegistryGc({
        ...base,
        http: createMemoryRegistry({ x: { "0.1.0": "sha256:1" } }).http,
        docker: createMockDocker({ available: false }),
      }),
    /docker introuvable/,
  );

  const down = createMemoryRegistry({ x: { "0.1.0": "sha256:1" } });
  down.http.down = true;
  await assert.rejects(
    () =>
      gc.runRegistryGc({
        ...base,
        http: down.http,
        docker: createMockDocker(),
      }),
    /registre injoignable/,
  );

  const denied = createMemoryRegistry({
    "creezio-server-probe": {
      "0.1.0": "sha256:aaa",
      "0.2.0": "sha256:bbb",
      "0.3.0": "sha256:ccc",
    },
  });
  denied.http.deleteStatus = 405;
  const dockerDenied = createMockDocker();
  await assert.rejects(
    () =>
      gc.runRegistryGc({
        ...base,
        http: denied.http,
        docker: dockerDenied,
      }),
    /DELETE manifeste KO|REGISTRY_STORAGE_DELETE_ENABLED/,
  );
  assert.equal(dockerDenied.state.gcCalls, 0, "pas de GC après DELETE KO");

  const gcKo = createMemoryRegistry({
    "creezio-server-probe": {
      "0.1.0": "sha256:aaa",
      "0.2.0": "sha256:bbb",
      "0.3.0": "sha256:ccc",
    },
  });
  await assert.rejects(
    () =>
      gc.runRegistryGc({
        ...base,
        http: gcKo.http,
        docker: createMockDocker({ gcStatus: 1 }),
      }),
    /garbage-collect KO/,
  );

  const stopped = createMemoryRegistry({
    "creezio-server-probe": {
      "0.1.0": "sha256:aaa",
      "0.2.0": "sha256:bbb",
      "0.3.0": "sha256:ccc",
    },
  });
  await assert.rejects(
    () =>
      gc.runRegistryGc({
        ...base,
        http: stopped.http,
        docker: createMockDocker({ running: false }),
      }),
    /absent ou arrêté/,
  );
});

function dockerLiveSkipReason() {
  const ver = spawnSync("docker", ["--version"], { encoding: "utf8" });
  if (ver.status !== 0) {
    return "docker CLI indisponible — mock HTTP uniquement";
  }
  const info = spawnSync("docker", ["info"], {
    encoding: "utf8",
    timeout: 8000,
  });
  if (info.status !== 0) {
    return "daemon Docker injoignable — mock HTTP uniquement";
  }
  return null;
}

function freePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function waitHttpOk(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve(res.statusCode);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`timeout ${url} HTTP ${res.statusCode}`));
          return;
        }
        setTimeout(tryOnce, 200);
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`timeout ${url} (connexion)`));
          return;
        }
        setTimeout(tryOnce, 200);
      });
    };
    tryOnce();
  });
}

const liveSkip = dockerLiveSkipReason();
if (liveSkip) {
  console.log(`skip live registry:2 : ${liveSkip}`);
}

test(
  "live registry:2 éphémère : keep + dry-run + delete",
  { skip: liveSkip || false, timeout: 120_000 },
  async () => {
    const port = await freePort();
    assert.ok(port !== 18791 && port !== 18792, "port éphémère (pas 18791/18792)");
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-registry-gc-"));
    const name = `creezio-gc-gate-${process.pid}-${port}`;
    const usedName = `${name}-used`;
    const repo = "creezio-gc-probe";
    const registry = `127.0.0.1:${port}`;
    let started = false;
    try {
      const run = spawnSync(
        "docker",
        [
          "run",
          "-d",
          "--name",
          name,
          "-p",
          `127.0.0.1:${port}:5000`,
          "-e",
          "REGISTRY_STORAGE_DELETE_ENABLED=true",
          "-v",
          `${dataDir}:/var/lib/registry`,
          "registry:2",
        ],
        { encoding: "utf8" },
      );
      if (run.status !== 0) {
        const why = (run.stderr || run.stdout || "").trim();
        console.log(
          `skip live registry:2 : impossible de démarrer registry:2 (${why || "docker run KO"})`,
        );
        return;
      }
      started = true;
      await waitHttpOk(`http://${registry}/v2/`, 30_000);

      const srcImage = "registry:2";
      for (const tag of ["0.1.0", "0.2.0", "0.3.0", "0.4.0"]) {
        const ref = `${registry}/${repo}:${tag}`;
        const tagR = spawnSync("docker", ["tag", srcImage, ref], {
          encoding: "utf8",
        });
        assert.equal(tagR.status, 0, tagR.stderr);
        const push = spawnSync("docker", ["push", ref], { encoding: "utf8" });
        assert.equal(push.status, 0, push.stderr || push.stdout);
      }

      const usedRef = `${registry}/${repo}:0.1.0`;
      const used = spawnSync(
        "docker",
        ["run", "-d", "--name", usedName, "--entrypoint", "sleep", usedRef, "120"],
        { encoding: "utf8" },
      );
      const usedOk = used.status === 0;

      const dry = await gc.runRegistryGc({
        registry,
        keep: 2,
        dryRun: true,
        container: name,
        repo,
        log: () => {},
      });
      assert.equal(dry.dryRun, true);
      assert.equal(dry.gcRan, false);
      const listedDry = await fetch(`http://${registry}/v2/${repo}/tags/list`);
      const dryTags = ((await listedDry.json()).tags || []).sort();
      assert.deepEqual(dryTags, ["0.1.0", "0.2.0", "0.3.0", "0.4.0"]);

      const out = await gc.runRegistryGc({
        registry,
        keep: 2,
        dryRun: false,
        container: name,
        repo,
        log: () => {},
      });
      assert.equal(out.gcRan, true);
      const listed = await fetch(`http://${registry}/v2/${repo}/tags/list`);
      const left = ((await listed.json()).tags || []).sort();
      assert.ok(left.includes("0.3.0"));
      assert.ok(left.includes("0.4.0"));
      assert.ok(!left.includes("0.2.0"), "0.2.0 doit être purgé");
      if (usedOk) {
        assert.ok(
          left.includes("0.1.0"),
          "tag en usage (conteneur) jamais supprimé",
        );
        assert.ok(!out.deleted.some((d) => d.tag === "0.1.0"));
      } else {
        console.log(
          "skip live in-use : image registry:2 sans entrypoint sleep — couvert par le mock HTTP",
        );
      }
    } finally {
      spawnSync("docker", ["rm", "-f", usedName], { encoding: "utf8" });
      if (started) {
        spawnSync("docker", ["rm", "-f", name], { encoding: "utf8" });
      }
      try {
        fs.rmSync(dataDir, { recursive: true, force: true });
      } catch {
        /* tmp */
      }
    }
  },
);
