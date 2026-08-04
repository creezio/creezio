#!/usr/bin/env node
/**
 * @creezio/observability fleet-collector — Creezio Server Admin.
 *
 * Admin web multi-serveurs Docker pour les serveurs marque headless
 * (docker/server). Point d'entrée SÉPARÉ de server.mjs (fleet collector
 * prod) — aucun endpoint partagé.
 *
 * SoT registre : {brandRoot}/docker-data/servers.json (conventions
 * partagées avec `creezio server-docker` — voir
 * packages/factory/src/server-docker-registry.ts).
 *
 * Env :
 *   CREEZIO_ADMIN_PORT        (défaut 18800)
 *   CREEZIO_ADMIN_HOST        (défaut 127.0.0.1 — loopback only)
 *   CREEZIO_ADMIN_USER        (défaut admin)
 *   CREEZIO_ADMIN_PASS        (obligatoire — refus de démarrer sinon)
 *   CREEZIO_ADMIN_BRAND_ROOTS (chemins racines marques séparés par ":")
 *   CREEZIO_DOCKER_SOCK       (défaut /var/run/docker.sock)
 *
 * 0 domaine marque hardcodé — injection env uniquement.
 */

import http from "node:http";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  containerLogs,
  createContainer,
  dockerPing,
  imageExists,
  inspectContainer,
  listContainers,
  removeContainer,
  startContainer,
  stopContainer,
} from "./admin-docker.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");

const PORT = Number(process.env.CREEZIO_ADMIN_PORT || 18800);
const HOST = process.env.CREEZIO_ADMIN_HOST || "127.0.0.1";
const ADMIN_USER = process.env.CREEZIO_ADMIN_USER || "admin";
const ADMIN_PASS = process.env.CREEZIO_ADMIN_PASS || "";
const BRAND_ROOTS = String(process.env.CREEZIO_ADMIN_BRAND_ROOTS || "")
  .split(":")
  .map((p) => p.trim())
  .filter(Boolean)
  .map((p) => path.resolve(p));
const MAX_BODY = 1 * 1024 * 1024;

// Conventions registre (miroir de factory/src/server-docker-registry.ts).
const SERVER_PORT_BASE = 18790;
const SERVER_CONTAINER_PORT = 18791;
const SERVER_LABEL = "creezio.server";
const NAME_RE = /^[a-z0-9][a-z0-9-]{0,30}$/;

if (!ADMIN_PASS) {
  console.error(
    "[server-admin] CREEZIO_ADMIN_PASS requis (auth Basic obligatoire)",
  );
  process.exit(1);
}

/* ---------------------------------------------------------------- utils */

function safeEqualStr(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) {
    crypto.timingSafeEqual(aa, aa);
    return false;
  }
  return crypto.timingSafeEqual(aa, bb);
}

function audit(line) {
  console.log(`[server-admin] ${new Date().toISOString()} ${line}`);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res, code, body, headers = {}) {
  const payload =
    body === undefined || body === null
      ? ""
      : typeof body === "string"
        ? body
        : JSON.stringify(body);
  const h = {
    "Content-Type":
      typeof body === "string" && body.trimStart().startsWith("<")
        ? "text/html; charset=utf-8"
        : "application/json; charset=utf-8",
    ...headers,
  };
  if (!payload) delete h["Content-Type"];
  res.writeHead(code, h);
  res.end(payload);
}

function parseBasicAuth(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const i = decoded.indexOf(":");
    if (i < 0) return null;
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

function authorized(req) {
  const basic = parseBasicAuth(req.headers.authorization || "");
  return (
    basic !== null &&
    safeEqualStr(basic.user, ADMIN_USER) &&
    safeEqualStr(basic.pass, ADMIN_PASS)
  );
}

function sendUnauthorized(res) {
  send(
    res,
    401,
    { ok: false, error: "unauthorized" },
    { "WWW-Authenticate": 'Basic realm="Creezio Server Admin", charset="UTF-8"' },
  );
}

async function fetchJson(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* corps non JSON */
    }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------- registre */

function registryPath(brandRoot) {
  return path.join(brandRoot, "docker-data", "servers.json");
}

function inferBrandId(brandRoot) {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(brandRoot, "package.json"), "utf8"),
    );
    if (pkg?.creezio?.brandId) return pkg.creezio.brandId;
    if (pkg?.name) {
      const last = String(pkg.name).split("/").pop() || "";
      const id = last.replace(/^app-/, "").replace(/[^a-z0-9-]/gi, "");
      if (id) return id;
    }
  } catch {
    /* pas de package.json */
  }
  return path.basename(brandRoot);
}

function loadRegistry(brandRoot) {
  const brandId = inferBrandId(brandRoot);
  const raw = readJson(registryPath(brandRoot), null);
  if (raw && Array.isArray(raw.instances)) {
    return {
      version: 1,
      brandId: raw.brandId || brandId,
      image: raw.image || `creezio-server-${brandId}:local`,
      instances: raw.instances,
    };
  }
  return {
    version: 1,
    brandId,
    image: `creezio-server-${brandId}:local`,
    instances: [],
  };
}

function saveRegistry(brandRoot, registry) {
  writeJson(registryPath(brandRoot), registry);
}

function instanceDataDirAbs(brandRoot, inst) {
  return path.isAbsolute(inst.dataDir)
    ? inst.dataDir
    : path.join(brandRoot, inst.dataDir);
}

/** Trouve {brandRoot, registry, inst} par (brandId, name) sur toutes les marques. */
function findInstance(brandId, name) {
  for (const brandRoot of BRAND_ROOTS) {
    const registry = loadRegistry(brandRoot);
    if (registry.brandId !== brandId) continue;
    const inst = registry.instances.find((i) => i.name === name);
    if (inst) return { brandRoot, registry, inst };
  }
  return null;
}

function portBusy(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host });
    const done = (busy) => {
      sock.destroy();
      resolve(busy);
    };
    sock.once("connect", () => done(true));
    sock.once("error", () => done(false));
    sock.setTimeout(400, () => done(false));
  });
}

/** Premier port libre à partir de 18791 — évite les registres de TOUTES les marques. */
async function allocatePort() {
  const used = new Set();
  for (const brandRoot of BRAND_ROOTS) {
    for (const inst of loadRegistry(brandRoot).instances) used.add(inst.port);
  }
  for (let n = 1; n < 200; n++) {
    const candidate = SERVER_PORT_BASE + n;
    if (used.has(candidate)) continue;
    if (await portBusy(candidate)) continue;
    return candidate;
  }
  throw new Error("aucun port libre entre 18791 et 18990");
}

/* --------------------------------------------------------------- docker */

/** Inspect léger : {state, health, startedAt, image}. "unknown" si docker KO. */
async function dockerStateOf(containerName) {
  try {
    const info = await inspectContainer(containerName);
    if (!info) return { state: "absent", health: null, startedAt: null, image: null };
    return {
      state: info?.State?.Status || "?",
      health: info?.State?.Health?.Status || null,
      startedAt: info?.State?.StartedAt || null,
      image: info?.Config?.Image || null,
    };
  } catch {
    return { state: "unknown", health: null, startedAt: null, image: null };
  }
}

/** Boot-status léger (timeout 1s) — null si injoignable. */
async function fetchBootStatusLight(port) {
  try {
    const r = await fetchJson(
      `http://127.0.0.1:${port}/api/v1/os/boot-status`,
      1000,
    );
    if (r.status !== 200 || !r.json) return null;
    return {
      booting: r.json.booting === true,
      headline: r.json.headline ?? null,
      overallPercent: r.json.overallPercent ?? null,
      bootStartedAt: r.json.bootStartedAt ?? null,
    };
  } catch {
    return null;
  }
}

async function collectServers() {
  const dockerUp = await dockerPing();
  const servers = [];
  const known = new Set();
  for (const brandRoot of BRAND_ROOTS) {
    const registry = loadRegistry(brandRoot);
    for (const inst of registry.instances) {
      known.add(inst.containerName);
      const docker = dockerUp
        ? await dockerStateOf(inst.containerName)
        : { state: "unknown", health: null, startedAt: null, image: null };
      const bootStatus =
        docker.state === "running"
          ? await fetchBootStatusLight(inst.port)
          : null;
      servers.push({
        brandId: registry.brandId,
        brandRoot,
        name: inst.name,
        containerName: inst.containerName,
        port: inst.port,
        bind: inst.bind,
        dataDir: inst.dataDir,
        createdAt: inst.createdAt,
        env: inst.env || {},
        image: registry.image,
        orphan: false,
        docker,
        bootStatus,
      });
    }
  }
  // Containers docker labellisés creezio.server=1 absents des registres.
  if (dockerUp) {
    try {
      const list = await listContainers({
        all: true,
        filters: { label: [`${SERVER_LABEL}=1`] },
      });
      for (const c of list) {
        const cname = String((c.Names || [])[0] || "").replace(/^\//, "");
        if (!cname || known.has(cname)) continue;
        const labels = c.Labels || {};
        servers.push({
          brandId: labels["creezio.brand"] || null,
          brandRoot: labels["creezio.brand-root"] || null,
          name: labels["creezio.instance"] || cname,
          containerName: cname,
          port: labels["creezio.port"] ? Number(labels["creezio.port"]) : null,
          bind: null,
          dataDir: null,
          createdAt: null,
          env: {},
          image: c.Image || null,
          orphan: true,
          docker: {
            state: c.State || "?",
            health: null,
            startedAt: null,
            image: c.Image || null,
          },
          bootStatus: null,
        });
      }
    } catch {
      /* best effort */
    }
  }
  return { servers, docker: dockerUp };
}

/* --------------------------------------------------------------- create */

async function createServer(body) {
  const brandRoot = path.resolve(String(body.brandRoot || ""));
  if (!BRAND_ROOTS.includes(brandRoot)) {
    return { code: 400, out: { ok: false, error: "brandRoot inconnu (CREEZIO_ADMIN_BRAND_ROOTS)" } };
  }
  const name = String(body.name || "");
  if (!NAME_RE.test(name)) {
    return { code: 400, out: { ok: false, error: "nom invalide (attendu [a-z0-9][a-z0-9-]{0,30})" } };
  }
  const registry = loadRegistry(brandRoot);
  if (registry.instances.some((i) => i.name === name)) {
    return { code: 409, out: { ok: false, error: `instance déjà enregistrée: ${name}` } };
  }
  const containerName = `${registry.brandId}-server-${name}`;
  const existing = await inspectContainer(containerName);
  if (existing) {
    return { code: 409, out: { ok: false, error: `container ${containerName} existe déjà` } };
  }
  if (!(await imageExists(registry.image))) {
    return {
      code: 409,
      out: {
        ok: false,
        error: `image ${registry.image} absente — lancer creezio server-docker build --brand-root ${brandRoot}`,
      },
    };
  }
  const requested = Number(body.port || 0);
  const port =
    requested > 0 && Number.isInteger(requested)
      ? requested
      : await allocatePort();
  if (requested > 0 && (await portBusy(requested))) {
    return { code: 409, out: { ok: false, error: `port ${requested} déjà occupé` } };
  }
  const extraEnv = {};
  if (body.env && typeof body.env === "object") {
    for (const [k, v] of Object.entries(body.env)) {
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) extraEnv[k] = String(v);
    }
  }
  const bind = "127.0.0.1";
  const inst = {
    name,
    containerName,
    port,
    bind,
    dataDir: path.join("docker-data", "servers", name),
    createdAt: new Date().toISOString(),
    ...(Object.keys(extraEnv).length ? { env: extraEnv } : {}),
  };
  const dataAbs = instanceDataDirAbs(brandRoot, inst);
  fs.mkdirSync(dataAbs, { recursive: true });

  const envList = [
    `BRAND_ID=${registry.brandId}`,
    `INSTANCE_ID=server-${name}`,
    `PORT=${SERVER_CONTAINER_PORT}`,
    `METIER_PORT=${SERVER_CONTAINER_PORT}`,
    "CREEZIO_HTTP_HOST=0.0.0.0",
    ...Object.entries(extraEnv).map(([k, v]) => `${k}=${v}`),
  ];
  const spec = {
    Image: registry.image,
    Env: envList,
    Labels: {
      [SERVER_LABEL]: "1",
      "creezio.brand": registry.brandId,
      "creezio.instance": name,
      "creezio.port": String(port),
      "creezio.brand-root": brandRoot,
    },
    ExposedPorts: { [`${SERVER_CONTAINER_PORT}/tcp`]: {} },
    HostConfig: {
      Binds: [`${dataAbs}:/data`],
      PortBindings: {
        [`${SERVER_CONTAINER_PORT}/tcp`]: [
          { HostIp: bind, HostPort: String(port) },
        ],
      },
      RestartPolicy: { Name: "unless-stopped" },
    },
  };
  const created = await createContainer(containerName, spec);
  await startContainer(created.Id);
  registry.instances.push(inst);
  saveRegistry(brandRoot, registry);
  audit(`create brand=${registry.brandId} name=${name} port=${port} container=${containerName}`);
  return { code: 200, out: { ok: true, instance: { ...inst, brandId: registry.brandId, brandRoot } } };
}

/* --------------------------------------------------------------- ops/disk */

function readOpsEvents(brandRoot, inst, limit) {
  try {
    const dir = path.join(instanceDataDirAbs(brandRoot, inst), "ops");
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => {
        const full = path.join(dir, f);
        return { full, mtime: fs.statSync(full).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    if (!files.length) return [];
    const lines = fs
      .readFileSync(files[0].full, "utf8")
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .slice(-limit);
    const events = [];
    for (const l of lines) {
      try {
        events.push(JSON.parse(l));
      } catch {
        /* ligne partielle */
      }
    }
    return events;
  } catch {
    return [];
  }
}

/** Taille récursive avec garde-fou (max entrées, pas de symlinks). */
function dirSizeBytes(dir, budget = { entries: 200_000 }) {
  let total = 0;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    if (budget.entries-- <= 0) return total;
    const full = path.join(dir, e.name);
    try {
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) total += dirSizeBytes(full, budget);
      else if (e.isFile()) total += fs.statSync(full).size;
    } catch {
      /* fichier disparu */
    }
  }
  return total;
}

function buildDiskReport() {
  const instances = [];
  for (const brandRoot of BRAND_ROOTS) {
    const registry = loadRegistry(brandRoot);
    for (const inst of registry.instances) {
      instances.push({
        brandId: registry.brandId,
        name: inst.name,
        dataDir: inst.dataDir,
        sizeBytes: dirSizeBytes(instanceDataDirAbs(brandRoot, inst)),
      });
    }
  }
  let fsInfo = null;
  if (BRAND_ROOTS.length) {
    try {
      const s = fs.statfsSync(BRAND_ROOTS[0]);
      fsInfo = {
        path: BRAND_ROOTS[0],
        freeBytes: s.bavail * s.bsize,
        totalBytes: s.blocks * s.bsize,
      };
    } catch {
      /* statfs indisponible */
    }
  }
  return { ok: true, instances, filesystem: fsInfo };
}

/* --------------------------------------------------------------- routes */

async function handleInstanceRoute(req, res, url, brandId, name, action) {
  const found = findInstance(brandId, name);

  if (action === "start" && req.method === "POST") {
    if (!found) return send(res, 404, { ok: false, error: "instance inconnue" });
    await startContainer(found.inst.containerName);
    audit(`start brand=${brandId} name=${name}`);
    return send(res, 200, { ok: true });
  }

  if (action === "stop" && req.method === "POST") {
    if (!found) return send(res, 404, { ok: false, error: "instance inconnue" });
    await stopContainer(found.inst.containerName);
    audit(`stop brand=${brandId} name=${name}`);
    return send(res, 200, { ok: true });
  }

  if (!action && req.method === "DELETE") {
    if (!found) return send(res, 404, { ok: false, error: "instance inconnue" });
    try {
      await removeContainer(found.inst.containerName, { force: true });
    } catch (e) {
      // Container déjà absent ou docker KO : le registre reste la SoT.
      audit(`rm container KO brand=${brandId} name=${name}: ${e?.message || e}`);
    }
    found.registry.instances = found.registry.instances.filter(
      (i) => i.name !== name,
    );
    saveRegistry(found.brandRoot, found.registry);
    const purge = url.searchParams.get("purgeData") === "1";
    if (purge) {
      const dataAbs = instanceDataDirAbs(found.brandRoot, found.inst);
      // Garde-fou : ne purger que sous brandRoot.
      if (dataAbs.startsWith(found.brandRoot + path.sep)) {
        fs.rmSync(dataAbs, { recursive: true, force: true });
      }
    }
    audit(`rm brand=${brandId} name=${name} purgeData=${purge}`);
    return send(res, 200, { ok: true, purgedData: purge });
  }

  if (req.method !== "GET") return send(res, 405, { ok: false });
  if (!found) return send(res, 404, { ok: false, error: "instance inconnue" });
  const { inst, brandRoot } = found;

  if (action === "boot-status") {
    try {
      const r = await fetchJson(
        `http://127.0.0.1:${inst.port}/api/v1/os/boot-status`,
        2000,
      );
      if (!r.json) return send(res, 504, { ok: false, error: "boot-status injoignable" });
      return send(res, 200, r.json);
    } catch {
      return send(res, 504, { ok: false, error: "boot-status injoignable" });
    }
  }

  if (action === "health") {
    const out = { ok: true, health: null, ready: null };
    try {
      out.health = await fetchJson(
        `http://127.0.0.1:${inst.port}/api/v1/core/health`,
        2000,
      );
    } catch {
      /* injoignable */
    }
    try {
      out.ready = await fetchJson(
        `http://127.0.0.1:${inst.port}/api/v1/os/ready`,
        2000,
      );
    } catch {
      /* injoignable */
    }
    return send(res, 200, out);
  }

  if (action === "logs") {
    const tail = Math.min(
      Math.max(Number(url.searchParams.get("tail") || 200), 1),
      2000,
    );
    try {
      const lines = await containerLogs(inst.containerName, { tail });
      return send(res, 200, { ok: true, lines });
    } catch (e) {
      return send(res, 502, { ok: false, error: String(e?.message || e) });
    }
  }

  if (action === "ops") {
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") || 100), 1),
      1000,
    );
    return send(res, 200, { ok: true, events: readOpsEvents(brandRoot, inst, limit) });
  }

  return send(res, 404, { ok: false });
}

async function handleAdmin(req, res, url) {
  const p = url.pathname;

  if (!authorized(req)) return sendUnauthorized(res);

  if (req.method === "GET" && (p === "/admin" || p === "/admin/")) {
    return send(res, 200, fs.readFileSync(path.join(PUBLIC_DIR, "admin.html"), "utf8"));
  }

  if (req.method === "GET" && p === "/admin/api/health") {
    return send(res, 200, {
      ok: true,
      service: "creezio-server-admin",
      brandRoots: BRAND_ROOTS,
      docker: await dockerPing(),
    });
  }

  if (req.method === "GET" && p === "/admin/api/servers") {
    const { servers, docker } = await collectServers();
    return send(res, 200, { ok: true, docker, servers });
  }

  if (req.method === "POST" && p === "/admin/api/servers") {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return send(res, 400, { ok: false, error: "json" });
    }
    try {
      const r = await createServer(body);
      return send(res, r.code, r.out);
    } catch (e) {
      audit(`create KO: ${e?.message || e}`);
      return send(res, 502, { ok: false, error: String(e?.message || e) });
    }
  }

  if (req.method === "GET" && p === "/admin/api/disk") {
    return send(res, 200, buildDiskReport());
  }

  // /admin/api/servers/<brandId>/<name>[/<action>]
  const m = p.match(
    /^\/admin\/api\/servers\/([^/]+)\/([^/]+)(?:\/(start|stop|boot-status|health|logs|ops))?$/,
  );
  if (m) {
    const [, brandIdEnc, nameEnc, action] = m;
    try {
      return await handleInstanceRoute(
        req,
        res,
        url,
        decodeURIComponent(brandIdEnc),
        decodeURIComponent(nameEnc),
        action || "",
      );
    } catch (e) {
      audit(`route KO ${p}: ${e?.message || e}`);
      return send(res, 502, { ok: false, error: String(e?.message || e) });
    }
  }

  return send(res, 404, { ok: false });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
    if (url.pathname === "/") {
      return send(res, 302, "", { Location: "/admin" });
    }
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      return await handleAdmin(req, res, url);
    }
    return send(res, 404, { ok: false });
  } catch (e) {
    console.error("[server-admin] error", e);
    if (!res.writableEnded) send(res, 500, { ok: false });
  }
});

server.listen(PORT, HOST, () => {
  console.log(
    `[server-admin] écoute ${HOST}:${PORT} brandRoots=${BRAND_ROOTS.join(",") || "(aucun)"} sock=${process.env.CREEZIO_DOCKER_SOCK || "/var/run/docker.sock"}`,
  );
});
