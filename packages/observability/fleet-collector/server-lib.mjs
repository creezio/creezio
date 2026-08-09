/**
 * Logique serveurs Docker partagée admin ↔ agent hôte flotte.
 *
 * SoT registre : {brandRoot}/docker-data/servers.json (conventions
 * `creezio server-docker` — packages/factory/src/server-docker-registry.ts).
 *
 * Consommé par :
 *   - server-admin.mjs  (Creezio Server Admin — VPS admin, socket local)
 *   - host-agent.mjs    (agent hôte flotte — VPS restaurant, exposé tunnel)
 */

import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  containerLogs,
  createContainer,
  dockerPing,
  imageExists,
  inspectContainer,
  listContainers,
  pullImage,
  removeContainer,
  startContainer,
  stopContainer,
} from "./admin-docker.mjs";

// Conventions registre (miroir de factory/src/server-docker-registry.ts).
export const SERVER_PORT_BASE = 18790;
export const SERVER_CONTAINER_PORT = 18791;
export const SERVER_LABEL = "creezio.server";
export const NAME_RE = /^[a-z0-9][a-z0-9-]{0,30}$/;

/* ---------------------------------------------------------------- fichiers */

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

export async function fetchJson(url, timeoutMs, init) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...(init || {}), signal: ctrl.signal });
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

/* ---------------------------------------------------------------- registre */

export function registryPath(brandRoot) {
  return path.join(brandRoot, "docker-data", "servers.json");
}

export function inferBrandId(brandRoot) {
  for (const dir of [brandRoot, path.join(brandRoot, "server")]) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf8"),
      );
      if (pkg?.creezio?.brandId) return pkg.creezio.brandId;
      if (pkg?.name) {
        const last = String(pkg.name).split("/").pop() || "";
        const id = last.replace(/^app-/, "").replace(/[^a-z0-9-]/gi, "");
        if (id) return id;
      }
    } catch {
      /* dossier suivant */
    }
  }
  return path.basename(brandRoot);
}

export function loadRegistry(brandRoot) {
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

export function saveRegistry(brandRoot, registry) {
  writeJson(registryPath(brandRoot), registry);
}

export function instanceDataDirAbs(brandRoot, inst) {
  return path.isAbsolute(inst.dataDir)
    ? inst.dataDir
    : path.join(brandRoot, inst.dataDir);
}

/** Image effective d'une instance (per-instance après update, sinon marque). */
export function instanceImage(registry, inst) {
  return inst.image || registry.image;
}

/**
 * Proxy vers le mount support natif d'une instance (loopback uniquement).
 * Utilisé par host-agent et server-admin — l'admin de marque pull les
 * tickets / pousse les réponses via ce relais (jamais de push instance→admin).
 */
export async function proxyInstanceSupport(inst, method, restPath, search, body) {
  const target =
    `http://127.0.0.1:${inst.port}/api/v1/platform/platform-support` +
    `${restPath || ""}${search || ""}`;
  return fetchJson(target, 5000, {
    method,
    ...(body != null
      ? {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
}

export function findInstance(brandRoots, brandId, name) {
  for (const brandRoot of brandRoots) {
    const registry = loadRegistry(brandRoot);
    if (registry.brandId !== brandId) continue;
    const inst = registry.instances.find((i) => i.name === name);
    if (inst) return { brandRoot, registry, inst };
  }
  return null;
}

export function portBusy(port, host = "127.0.0.1") {
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
export async function allocatePort(brandRoots) {
  const used = new Set();
  for (const brandRoot of brandRoots) {
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

/* ------------------------------------------------------------ état docker */

/** Inspect léger : {state, health, startedAt, image}. "unknown" si docker KO. */
export async function dockerStateOf(containerName) {
  try {
    const info = await inspectContainer(containerName);
    if (!info)
      return { state: "absent", health: null, startedAt: null, image: null };
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
export async function fetchBootStatusLight(port) {
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

/** Version applicative (GET /api/v1/core/version) — null si injoignable. */
export async function fetchVersionLight(port) {
  try {
    const r = await fetchJson(
      `http://127.0.0.1:${port}/api/v1/core/version`,
      1000,
    );
    if (r.status !== 200 || !r.json) return null;
    return r.json.version ?? null;
  } catch {
    return null;
  }
}

export async function collectServers(brandRoots) {
  const dockerUp = await dockerPing();
  const servers = [];
  const known = new Set();
  for (const brandRoot of brandRoots) {
    const registry = loadRegistry(brandRoot);
    for (const inst of registry.instances) {
      known.add(inst.containerName);
      const docker = dockerUp
        ? await dockerStateOf(inst.containerName)
        : { state: "unknown", health: null, startedAt: null, image: null };
      const running = docker.state === "running";
      const bootStatus = running ? await fetchBootStatusLight(inst.port) : null;
      const version = running ? await fetchVersionLight(inst.port) : null;
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
        image: instanceImage(registry, inst),
        version,
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
          version: null,
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

/* --------------------------------------------------------------- spec/run */

/**
 * Spec Engine API d'une instance — miroir de buildDockerRunArgs (CLI).
 * Même volume /data, mêmes labels, mêmes env de base + env persistés.
 */
export function buildContainerSpec({ brandRoot, brandId, image, inst }) {
  const dataAbs = instanceDataDirAbs(brandRoot, inst);
  const envList = [
    `BRAND_ID=${brandId}`,
    `INSTANCE_ID=server-${inst.name}`,
    `PORT=${SERVER_CONTAINER_PORT}`,
    `METIER_PORT=${SERVER_CONTAINER_PORT}`,
    "CREEZIO_HTTP_HOST=0.0.0.0",
    ...Object.entries(inst.env || {}).map(([k, v]) => `${k}=${v}`),
  ];
  return {
    Image: image,
    Env: envList,
    Labels: {
      [SERVER_LABEL]: "1",
      "creezio.brand": brandId,
      "creezio.instance": inst.name,
      "creezio.port": String(inst.port),
      "creezio.variant": inst.variant || "base",
      "creezio.brand-root": brandRoot,
    },
    ExposedPorts: { [`${SERVER_CONTAINER_PORT}/tcp`]: {} },
    HostConfig: {
      Binds: [`${dataAbs}:/data`],
      PortBindings: {
        [`${SERVER_CONTAINER_PORT}/tcp`]: [
          { HostIp: inst.bind || "127.0.0.1", HostPort: String(inst.port) },
        ],
      },
      RestartPolicy: { Name: "unless-stopped" },
      // Chromium sidecar : /dev/shm 64 Mo par défaut = crashs renderer.
      ...(inst.variant === "browser" ? { ShmSize: 1024 * 1024 * 1024 } : {}),
    },
  };
}

export async function createServer(brandRoots, body, audit) {
  const brandRoot = path.resolve(String(body.brandRoot || ""));
  if (!brandRoots.includes(brandRoot)) {
    return {
      code: 400,
      out: { ok: false, error: "brandRoot inconnu (brand roots configurés)" },
    };
  }
  const name = String(body.name || "");
  if (!NAME_RE.test(name)) {
    return {
      code: 400,
      out: { ok: false, error: "nom invalide (attendu [a-z0-9][a-z0-9-]{0,30})" },
    };
  }
  const registry = loadRegistry(brandRoot);
  if (registry.instances.some((i) => i.name === name)) {
    return {
      code: 409,
      out: { ok: false, error: `instance déjà enregistrée: ${name}` },
    };
  }
  const containerName = `${registry.brandId}-server-${name}`;
  const existing = await inspectContainer(containerName);
  if (existing) {
    return {
      code: 409,
      out: { ok: false, error: `container ${containerName} existe déjà` },
    };
  }
  const image = String(body.image || registry.image);
  if (!(await imageExists(image))) {
    if (body.pull === true) {
      await pullImage(image, { authB64: registryAuthB64() });
    } else {
      return {
        code: 409,
        out: {
          ok: false,
          error: `image ${image} absente — build ou pull requis (body.pull=true)`,
        },
      };
    }
  }
  const requested = Number(body.port || 0);
  if (requested > 0 && (await portBusy(requested))) {
    return {
      code: 409,
      out: { ok: false, error: `port ${requested} déjà occupé` },
    };
  }
  const port =
    requested > 0 && Number.isInteger(requested)
      ? requested
      : await allocatePort(brandRoots);
  const extraEnv = {};
  if (body.env && typeof body.env === "object") {
    for (const [k, v] of Object.entries(body.env)) {
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) extraEnv[k] = String(v);
    }
  }
  const inst = {
    name,
    containerName,
    port,
    bind: "127.0.0.1",
    dataDir: path.join("docker-data", "servers", name),
    createdAt: new Date().toISOString(),
    ...(Object.keys(extraEnv).length ? { env: extraEnv } : {}),
    ...(body.image ? { image } : {}),
  };
  fs.mkdirSync(instanceDataDirAbs(brandRoot, inst), { recursive: true });
  const spec = buildContainerSpec({
    brandRoot,
    brandId: registry.brandId,
    image,
    inst,
  });
  const created = await createContainer(containerName, spec);
  await startContainer(created.Id);
  registry.instances.push(inst);
  saveRegistry(brandRoot, registry);
  audit?.(
    `create brand=${registry.brandId} name=${name} port=${port} container=${containerName}`,
  );
  return {
    code: 200,
    out: {
      ok: true,
      instance: { ...inst, brandId: registry.brandId, brandRoot },
    },
  };
}

/* --------------------------------------------------------------- backups */

export function backupsDir(brandRoot) {
  return path.join(brandRoot, "docker-data", "backups");
}

/**
 * tar.gz du volume /data d'une instance, puis vérification d'intégrité
 * (gzip -t). Sémantique GNU tar sur volume VIVANT : exit 1 = « file changed
 * as we read it » — l'archive est écrite et valide (vécu resto-lyon : backup
 * 2,4 Go complet signalé « indisponible »). Seuls exit ≥ 2, spawn error ou
 * archive invalide sont des échecs (fichier partiel supprimé).
 * Retourne { ok, file, detail }.
 */
export function backupInstanceData(brandRoot, inst) {
  const run = (cmd, args) =>
    new Promise((resolve) => {
      const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      child.stderr?.on("data", (c) => {
        if (stderr.length < 4096) stderr += String(c);
      });
      child.on("error", (e) => resolve({ code: -1, stderr: String(e?.message || e) }));
      child.on("exit", (code) => resolve({ code: code ?? -1, stderr }));
    });
  return (async () => {
    const dataAbs = instanceDataDirAbs(brandRoot, inst);
    if (!fs.existsSync(dataAbs)) {
      return { ok: false, file: null, detail: `volume introuvable: ${dataAbs}` };
    }
    const dir = backupsDir(brandRoot);
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(dir, `${inst.name}-${stamp}.tar.gz`);
    const tar = await run("tar", [
      "-czf",
      file,
      "--warning=no-file-changed",
      // Fichiers illisibles (état volatil root-owned écrit par le container,
      // ex. hermes-home/cron/*) : warning, pas d'échec fatal — l'archive
      // reste complète à 99,9 % et le deploy n'est pas bloqué.
      "--ignore-failed-read",
      "-C",
      path.dirname(dataAbs),
      path.basename(dataAbs),
    ]);
    // GNU tar : 0 = OK, 1 = fichiers modifiés pendant la lecture (archive
    // complète — normal sur un container up), ≥ 2 / -1 = erreur réelle.
    if (tar.code !== 0 && tar.code !== 1) {
      try {
        fs.rmSync(file, { force: true });
      } catch {
        /* partiel absent */
      }
      return {
        ok: false,
        file: null,
        detail: `tar exit ${tar.code}${tar.stderr ? ` — ${tar.stderr.trim().slice(0, 300)}` : ""}`,
      };
    }
    let size = 0;
    try {
      size = fs.statSync(file).size;
    } catch {
      /* stat KO → vérif gzip échouera */
    }
    // Vérification : gzip -t relit l'archive de bout en bout.
    const check = await run("gzip", ["-t", file]);
    if (check.code !== 0 || size <= 0) {
      try {
        fs.rmSync(file, { force: true });
      } catch {
        /* déjà absent */
      }
      return {
        ok: false,
        file: null,
        detail: `archive invalide (gzip -t exit ${check.code}, ${size} octets)`,
      };
    }
    return {
      ok: true,
      file,
      detail: `${path.basename(file)} (${Math.round(size / 1e6)} Mo, gzip vérifié${tar.code === 1 ? ", fichiers vivants" : ""})`,
    };
  })();
}

/**
 * Rétention backups d'update (défaut 1, env CREEZIO_UPDATE_BACKUP_KEEP ≥ 1).
 * Chaque backup pèse ~la taille du volume /data compressé (vécu : 2,4 Go par
 * resto) — sans borne le disque du VPS regonfle à chaque update de flotte.
 * On ne garde que le DERNIER backup par serveur (décision 2026-08-06).
 */
export function updateBackupKeep() {
  const n = Number.parseInt(process.env.CREEZIO_UPDATE_BACKUP_KEEP || "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Rétention simple : garder les N derniers backups d'une instance. */
export function pruneBackups(brandRoot, instName, keep = updateBackupKeep()) {
  try {
    const dir = backupsDir(brandRoot);
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith(`${instName}-`) && f.endsWith(".tar.gz"))
      .sort()
      .reverse();
    for (const f of files.slice(keep)) {
      fs.rmSync(path.join(dir, f), { force: true });
    }
  } catch {
    /* pas de backups */
  }
}

/* ---------------------------------------------------------------- update */

export function registryAuthB64() {
  // base64 de {"username","password","serveraddress"} — registres privés.
  return (process.env.CREEZIO_REGISTRY_AUTH || "").trim() || undefined;
}

export async function waitBootReady(port, timeoutMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const r = await fetchJson(
        `http://127.0.0.1:${port}/api/v1/core/health`,
        2000,
      );
      if (r.status === 200 && r.json?.ok) return true;
    } catch {
      /* pas encore up */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

/**
 * Update d'une instance : pull nouvelle image → [opt-in backup /data] →
 * recreate même volume/labels/env → attente health → rollback image
 * précédente si KO.
 *
 * Défaut `backup=false` (itération / data stables) : pas de nouveau tar.gz.
 * Les archives déjà dans `docker-data/backups/` sont **conservées** (pas de
 * prune ici). Opt-in : CLI `--backup` / API `{"backup":true}` / one-shot
 * `creezio server-docker backup <nom>`.
 */
export async function updateServer({
  brandRoot,
  registry,
  inst,
  image,
  audit,
  waitTimeoutMs = 180_000,
  backup = false,
}) {
  const brandId = registry.brandId;
  const prev = await dockerStateOf(inst.containerName);
  const previousImage = prev.image || instanceImage(registry, inst);
  const steps = [];
  const log = (s) => {
    steps.push(s);
    audit?.(`update ${brandId}/${inst.name}: ${s}`);
  };

  if (!(await imageExists(image))) {
    log(`pull ${image}`);
    await pullImage(image, { authB64: registryAuthB64() });
  } else {
    log(`image ${image} déjà locale`);
  }

  let backupFile = null;
  if (backup) {
    const b = await backupInstanceData(brandRoot, inst);
    if (!b.ok) {
      // Backup demandé mais impossible : échec PROPRE avant tout recreate
      // (rien n'a été touché) — jamais un warning silencieux.
      log(`backup impossible: ${b.detail} — update annulé`);
      return {
        ok: false,
        error: `backup impossible: ${b.detail}`,
        image,
        previousImage,
        rolledBack: false,
        backup: null,
        steps,
      };
    }
    backupFile = b.file;
    // Pas de pruneBackups : les archives de référence existantes se gardent
    // (politique propriétaire — un backup stable > un snapshot à chaque update).
    log(`backup ${b.detail}`);
  } else {
    // Défaut : pas de nouveau tar.gz. Volume bind-mount conservé au recreate ;
    // archives déjà présentes dans docker-data/backups/ inchangées.
    log("pas de nouveau backup (défaut) — volume /data + archives existantes conservés");
  }

  const recreate = async (img) => {
    try {
      await removeContainer(inst.containerName, { force: true });
    } catch {
      /* déjà absent */
    }
    const spec = buildContainerSpec({ brandRoot, brandId, image: img, inst });
    const created = await createContainer(inst.containerName, spec);
    await startContainer(created.Id);
  };

  log(`recreate → ${image}`);
  await recreate(image);
  const ready = await waitBootReady(inst.port, waitTimeoutMs);
  if (ready) {
    inst.image = image;
    saveRegistry(brandRoot, registry);
    const version = await fetchVersionLight(inst.port);
    log(`health OK (version ${version || "?"})`);
    return {
      ok: true,
      image,
      previousImage,
      version,
      backup: backupFile ? path.basename(backupFile) : null,
      steps,
    };
  }

  // Rollback : retour à l'image précédente (conservée localement).
  log(`health KO après update — rollback → ${previousImage}`);
  let rolledBack = false;
  try {
    await recreate(previousImage);
    rolledBack = await waitBootReady(inst.port, waitTimeoutMs);
  } catch (e) {
    log(`rollback KO: ${e?.message || e}`);
  }
  if (rolledBack) {
    inst.image = previousImage;
    saveRegistry(brandRoot, registry);
    log("rollback OK — serveur sur l'image précédente");
  }
  return {
    ok: false,
    error: `serveur pas prêt après update (${Math.round(waitTimeoutMs / 1000)}s)`,
    image,
    previousImage,
    rolledBack,
    backup: backupFile ? path.basename(backupFile) : null,
    steps,
  };
}

/* --------------------------------------------------------------- ops/disk */

export function readOpsEvents(brandRoot, inst, limit) {
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

/**
 * Taille récursive ASYNCHRONE avec garde-fou (max entrées, pas de symlinks).
 * fs.promises + yield périodique (setImmediate ~toutes les 500 entrées) :
 * un gros /data ne doit JAMAIS geler l'event loop mono-thread de l'admin.
 */
export async function dirSizeBytes(dir, budget = { entries: 200_000 }) {
  let total = 0;
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    budget.entries -= 1;
    if (budget.entries <= 0) return total;
    if (budget.entries % 500 === 0) {
      await new Promise((r) => setImmediate(r));
    }
    const full = path.join(dir, e.name);
    try {
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) total += await dirSizeBytes(full, budget);
      else if (e.isFile()) total += (await fs.promises.stat(full)).size;
    } catch {
      /* fichier disparu */
    }
  }
  return total;
}

export async function buildDiskReport(brandRoots) {
  const instances = [];
  for (const brandRoot of brandRoots) {
    const registry = loadRegistry(brandRoot);
    for (const inst of registry.instances) {
      instances.push({
        brandId: registry.brandId,
        name: inst.name,
        dataDir: inst.dataDir,
        sizeBytes: await dirSizeBytes(instanceDataDirAbs(brandRoot, inst)),
      });
    }
  }
  let fsInfo = null;
  if (brandRoots.length) {
    try {
      const s = fs.statfsSync(brandRoots[0]);
      fsInfo = {
        path: brandRoots[0],
        freeBytes: s.bavail * s.bsize,
        totalBytes: s.blocks * s.bsize,
      };
    } catch {
      /* statfs indisponible */
    }
  }
  return { ok: true, instances, filesystem: fsInfo };
}

/* ------------------------------------------------- snapshot flotte (F1) */

/**
 * Poller interne : matérialise en mémoire un snapshot {servers, hosts, disk,
 * refreshedAt} en appelant les collecteurs injectés. Les routes GET de
 * l'admin répondent depuis ce snapshot (instantané) au lieu de refaire des
 * healthchecks synchrones à chaque appel (UI = refresh toutes les 5 s).
 *
 * Contrat :
 *  - premier cycle immédiat au `start()` (disque compris) ;
 *  - jamais réentrant : un cycle (ou scan disque) en cours est réutilisé,
 *    pas relancé (flag « cycle en cours » = promesse in-flight) ;
 *  - le scan disque tourne 1 cycle sur `diskEveryNCycles` (plus lourd) ;
 *  - `refreshCore()` / `refreshDisk()` forcent une collecte immédiate
 *    (param `?fresh=1` côté routes).
 */
export function createFleetSnapshotPoller({
  collectServersView,
  collectHostsView,
  collectDiskView,
  intervalMs = 30_000,
  diskEveryNCycles = 4,
  onError = () => {},
}) {
  const snapshot = {
    servers: null, // { docker, servers }
    hosts: null, // [ { hostId, … } ]
    disk: null, // { ok, instances, filesystem }
    refreshedAt: null,
    diskRefreshedAt: null,
  };
  let coreInFlight = null;
  let diskInFlight = null;
  let cycleCount = 0;
  let timer = null;

  function refreshCore() {
    if (coreInFlight) return coreInFlight;
    coreInFlight = (async () => {
      try {
        const [serversView, hosts] = await Promise.all([
          collectServersView(),
          collectHostsView ? collectHostsView() : null,
        ]);
        snapshot.servers = serversView;
        if (collectHostsView) snapshot.hosts = hosts;
        snapshot.refreshedAt = new Date().toISOString();
      } catch (e) {
        onError(e);
      } finally {
        coreInFlight = null;
      }
    })();
    return coreInFlight;
  }

  function refreshDisk() {
    if (diskInFlight) return diskInFlight;
    diskInFlight = (async () => {
      try {
        snapshot.disk = await collectDiskView();
        snapshot.diskRefreshedAt = new Date().toISOString();
      } catch (e) {
        onError(e);
      } finally {
        diskInFlight = null;
      }
    })();
    return diskInFlight;
  }

  function start() {
    refreshCore();
    refreshDisk();
    timer = setInterval(() => {
      cycleCount += 1;
      refreshCore();
      if (cycleCount % diskEveryNCycles === 0) refreshDisk();
    }, intervalMs);
    timer.unref?.();
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return { snapshot, refreshCore, refreshDisk, start, stop };
}

/* ------------------------------------------------------- tokens (Bearer) */

/** Hash de token stockable — jamais le token en clair côté serveur. */
export function sha256Hex(s) {
  return "sha256:" + crypto.createHash("sha256").update(String(s)).digest("hex");
}

/** Comparaison temps-constant token présenté ↔ hash stocké. */
export function tokenMatchesHash(token, storedHash) {
  const a = Buffer.from(sha256Hex(token));
  const b = Buffer.from(String(storedHash || ""));
  if (a.length !== b.length) {
    crypto.timingSafeEqual(a, a);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function newToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("hex");
}
