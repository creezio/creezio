/**
 * Stack compose autonome par instance serveur — app seule (modèle 0.10)
 * **ou** app + sidecar cloudflared historique (live pré-0.10).
 *
 * Modèle cible (standard flotte, 0.10.0) :
 *   - 1 instance = 1 projet compose `<brandId>-server-<name>` autonome ;
 *   - ports INTERNES fixes : l'app écoute toujours sur 18791 dans le réseau
 *     du stack ; cloudflared tourne IN-PROCESS dans le conteneur app
 *     (fin du sidecar) et la joint en loopback `http://127.0.0.1:18791` ;
 *   - port hôte indifférent : publié sur 127.0.0.1 avec attribution auto
 *     (`127.0.0.1::18791`) pour debug/healthcheck — fini les collisions ;
 *   - secrets JAMAIS dans `environment:` du compose.yml : `cf.env` (contrat
 *     Cloudflare `CREEZIO_CF_*` + `CREEZIO_DOMAIN` + `CREEZIO_TUNNEL_SLUG`)
 *     et `secrets.env` (clés applicatives détectées) sont des `env_file`
 *     chmod 600 générés par le CLI — invisibles dans ps / docker inspect /
 *     le registre ;
 *   - zéro port public : l'accès utilisateur passe par Cloudflare.
 *
 * Contrat update (0.10.3, non négociable — incident Tempoflow restos) :
 *   - un service `cloudflared*` déjà dans le compose est **préservé**
 *     (seule l'image `app` change) — même tunnel.env, même hostname ;
 *   - un hostname public persisté (tunnel.env / kernel) **sans** sidecar
 *     et **sans** contrat in-process (`cf.env`) → **refus** (fail-closed),
 *     jamais un compose app-seule qui coupe le site ;
 *   - `CREEZIO_TUNNEL_LOCAL=1` : comportement local inchangé ;
 *   - `migrate-stack` seul a le droit de retirer le sidecar (`allowDropSidecar`)
 *     et **réutilise** le tunnel / hostname existants — jamais un 2e hostname
 *     à l'update.
 *
 * SoT partagée : le CLI factory (server-docker create/migrate-stack) et
 * server-lib.mjs (update stack-aware) importent ce module — jamais de
 * copie divergente du template compose.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

/** Port interne fixe de l'app dans le réseau du stack (standard). */
export const STACK_APP_PORT = 18791;

/**
 * Clés du contrat Cloudflare forwardées par le CLI vers `cf.env` (600).
 * L'instance les consomme au boot pour auto-provisionner son tunnel.
 */
export const CF_ENV_KEYS = [
  "CREEZIO_CF_API_TOKEN",
  "CREEZIO_CF_ACCOUNT_ID",
  "CREEZIO_CF_ZONE_ID",
  "CREEZIO_CF_ZONE_NAME",
  "CREEZIO_CF_UNIVERSAL_SSL",
  "CREEZIO_DOMAIN",
  "CREEZIO_TUNNEL_SLUG",
  "CREEZIO_TUNNEL_EXTRA_HOSTNAMES",
];

/** Répertoire du stack (compose.yml + cf.env + secrets.env) — hors /data. */
export function stackDir(brandRoot, inst) {
  return path.join(brandRoot, "docker-data", "stacks", inst.name);
}

export function composeFilePath(brandRoot, inst) {
  return path.join(stackDir(brandRoot, inst), "compose.yml");
}

/** Nom de projet compose stable (fleet tooling, docker compose -p). */
export function stackProjectName(brandId, inst) {
  return `${brandId}-server-${inst.name}`;
}

export function cfEnvPath(brandRoot, inst) {
  return path.join(stackDir(brandRoot, inst), "cf.env");
}

export function secretsEnvPath(brandRoot, inst) {
  return path.join(stackDir(brandRoot, inst), "secrets.env");
}

/** Sidecar historique (pré-0.10) — token + hostname, chmod 600. */
export function tunnelEnvPath(brandRoot, inst) {
  return path.join(stackDir(brandRoot, inst), "tunnel.env");
}

/** Échappement double-quote YAML pour les valeurs d'env. */
function yq(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Clé d'env « secrète » → env_file 600 (jamais dans `environment:`).
 * Couvre tokens, secrets, mots de passe, clés API/privées.
 */
export function isSecretEnvKey(key) {
  return /TOKEN|SECRET|PASSWORD|PASSWD|API[_-]?KEY|PRIVATE[_-]?KEY|CREDENTIALS/i.test(
    String(key || ""),
  );
}

/**
 * Sépare l'env d'instance (registre) : `plain` reste dans `environment:`,
 * `secret` part dans `secrets.env` (600). Règle d'audit : aucun secret
 * applicatif en clair dans le compose généré.
 */
export function splitInstanceEnv(env) {
  const plain = {};
  const secret = {};
  for (const [k, v] of Object.entries(env || {})) {
    (isSecretEnvKey(k) ? secret : plain)[k] = v;
  }
  return { plain, secret };
}

/**
 * Rendu du compose.yml d'une instance.
 * opts.inst.hostPort : 0/undefined = attribution auto (défaut), >0 = fixe.
 * opts.withCf : true → `env_file: cf.env` (contrat Cloudflare — l'instance
 * auto-provisionne son tunnel au boot, cloudflared in-process).
 */
export function renderInstanceCompose({ brandRoot, brandId, image, inst, withCf }) {
  const dataAbs = path.isAbsolute(inst.dataDir)
    ? inst.dataDir
    : path.join(brandRoot, inst.dataDir);
  const publish =
    Number(inst.hostPort) > 0
      ? `127.0.0.1:${Number(inst.hostPort)}:${STACK_APP_PORT}`
      : `127.0.0.1::${STACK_APP_PORT}`;
  const { plain, secret } = splitInstanceEnv(inst.env);
  const env = {
    BRAND_ID: brandId,
    INSTANCE_ID: `server-${inst.name}`,
    PORT: String(STACK_APP_PORT),
    METIER_PORT: String(STACK_APP_PORT),
    CREEZIO_HTTP_HOST: "0.0.0.0",
    ...plain,
  };
  const envLines = Object.entries(env)
    .map(([k, v]) => `      ${k}: ${yq(v)}`)
    .join("\n");
  const labels = [
    `creezio.server=1`,
    `creezio.brand=${brandId}`,
    `creezio.instance=${inst.name}`,
    `creezio.port=${Number(inst.hostPort) > 0 ? Number(inst.hostPort) : "auto"}`,
    `creezio.variant=${inst.variant || "base"}`,
    `creezio.brand-root=${brandRoot}`,
    `creezio.stack=compose`,
  ]
    .map((l) => `      - ${yq(l)}`)
    .join("\n");

  const envFiles = [
    // cf.env : CREEZIO_CF_* (chmod 600) — auto-provisioning tunnel au boot.
    ...(withCf ? [`      - ./cf.env`] : []),
    // secrets.env : clés applicatives (chmod 600) — jamais dans environment:.
    ...(Object.keys(secret).length ? [`      - ./secrets.env`] : []),
  ];

  const app = [
    `  app:`,
    `    image: ${image}`,
    `    container_name: ${inst.containerName}`,
    `    restart: unless-stopped`,
    `    init: true`,
    ...(inst.variant === "browser" ? [`    shm_size: 1g`] : []),
    `    ports:`,
    `      - ${yq(publish)}`,
    `    volumes:`,
    `      - ${yq(`${dataAbs}:/data`)}`,
    ...(envFiles.length ? [`    env_file:`, ...envFiles] : []),
    `    environment:`,
    envLines,
    `    labels:`,
    labels,
    `    extra_hosts:`,
    `      - "host.docker.internal:host-gateway"`,
    `    healthcheck:`,
    `      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:${STACK_APP_PORT}/api/v1/core/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]`,
    `      interval: 30s`,
    `      timeout: 5s`,
    `      retries: 5`,
    `      start_period: 120s`,
    `    logging:`,
    `      driver: json-file`,
    `      options: { max-size: "50m", max-file: "3" }`,
  ];

  return [
    `# Généré par creezio server-docker — stack autonome instance.`,
    `# App seule (cloudflared in-process), ports internes fixes, port hôte`,
    `# loopback auto, secrets en env_file 600, zéro port public.`,
    `# Régénéré à chaque update/migrate — ne pas éditer à la main.`,
    `name: ${stackProjectName(brandId, inst)}`,
    `services:`,
    app.join("\n"),
    ``,
  ].join("\n");
}

/** Écrit un env_file chmod 600 (jamais de secret dans ps/inspect/registre). */
function writeEnvFile600(file, entries) {
  const lines = Object.entries(entries)
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== "")
    .map(([k, v]) => `${k}=${String(v)}`);
  fs.writeFileSync(file, lines.join("\n") + "\n", { mode: 0o600 });
  fs.chmodSync(file, 0o600);
}

/** Parse KEY=VAL (lignes # ignorées) — jamais logué (peut contenir un token). */
export function parseDotEnvFile(file) {
  if (!file || !fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    out[t.slice(0, i)] = t.slice(i + 1);
  }
  return out;
}

/** Services compose dont le nom commence par `cloudflared` (`cloudflared`, `cloudflared-xxx`). */
export function listCloudflaredServiceNames(composeYml) {
  const names = [];
  const re = /^  (cloudflared[A-Za-z0-9_-]*):/gm;
  let m;
  while ((m = re.exec(String(composeYml || "")))) names.push(m[1]);
  return names;
}

export function composeHasCloudflaredSidecar(composeYml) {
  return listCloudflaredServiceNames(composeYml).length > 0;
}

export function isLocalTunnelOnly(inst) {
  const v = String(inst?.env?.CREEZIO_TUNNEL_LOCAL || "").trim();
  return v === "1" || /^true$/i.test(v);
}

/** Contrat in-process 0.10 (cf.env) — l'app spawn cloudflared elle-même. */
export function hasInProcessCfContract(brandRoot, inst) {
  const cf = parseDotEnvFile(cfEnvPath(brandRoot, inst));
  return Boolean(
    String(cf.CREEZIO_CF_API_TOKEN || "").trim() &&
      String(cf.CREEZIO_CF_ACCOUNT_ID || "").trim() &&
      String(cf.CREEZIO_CF_ZONE_ID || "").trim(),
  );
}

/**
 * Hostname public persisté (sidecar historique ou kernel).
 * Ne lit jamais le token pour le renvoyer — source + hostname seulement.
 */
export function readPersistedPublicHostname({ brandRoot, inst, brandId }) {
  const tunnel = parseDotEnvFile(tunnelEnvPath(brandRoot, inst));
  const fromTunnel = String(tunnel.CREEZIO_TUNNEL_HOSTNAME || "").trim();
  if (fromTunnel) return { hostname: fromTunnel, source: "tunnel.env" };
  const fromInst = String(
    inst?.env?.CREEZIO_TUNNEL_HOSTNAME || inst?.env?.CREEZIO_DOMAIN || "",
  ).trim();
  if (fromInst) return { hostname: fromInst, source: "instance.env" };
  if (brandId) {
    const kc = readKernelTunnelConfig(brandRoot, inst, brandId);
    if (kc?.hostname) return { hostname: kc.hostname, source: "kernel" };
  }
  return null;
}

/**
 * Politique update d'un stack existant.
 * @returns {{ action: "preserve-sidecar"|"rewrite"|"refuse", error?: string, hostname?: string, sidecarServices?: string[] }}
 */
export function resolveStackUpdatePolicy({ brandRoot, brandId, inst, composeYml }) {
  const composeFile = composeFilePath(brandRoot, inst);
  const yml =
    composeYml !== undefined
      ? String(composeYml || "")
      : fs.existsSync(composeFile)
        ? fs.readFileSync(composeFile, "utf8")
        : "";
  const sidecarServices = listCloudflaredServiceNames(yml);
  if (sidecarServices.length) {
    return { action: "preserve-sidecar", sidecarServices };
  }
  if (isLocalTunnelOnly(inst)) {
    return { action: "rewrite" };
  }
  if (hasInProcessCfContract(brandRoot, inst)) {
    return { action: "rewrite" };
  }
  const persisted = readPersistedPublicHostname({ brandRoot, inst, brandId });
  const hasTunnelEnv = fs.existsSync(tunnelEnvPath(brandRoot, inst));
  if (persisted || hasTunnelEnv) {
    const hostname = persisted?.hostname || "(adresse publique persistée)";
    return {
      action: "refuse",
      hostname,
      error:
        `update refusé : ${inst.name} a une adresse publique (${hostname}) ` +
        `mais le compose n'a plus de service cloudflared. Réécrire le compose ` +
        `couperait le site. Restaurer le sidecar, ou lancer migrate-stack ` +
        `(réutilise le même tunnel). Rien n'a été modifié.`,
    };
  }
  return { action: "rewrite" };
}

/**
 * Remplace uniquement `image:` du service `app` — jamais celle de cloudflared.
 */
export function patchComposeAppImage(yml, image) {
  const text = String(yml || "");
  const appMatch = text.match(/^  app:\s*$/m);
  if (!appMatch || appMatch.index === undefined) {
    throw new Error("compose.yml sans service app — refus de réécriture");
  }
  const appIdx = appMatch.index;
  const afterHead = text.slice(appIdx + appMatch[0].length);
  const nextSvc = afterHead.search(/^  [A-Za-z0-9_-]+:/m);
  const blockEnd = nextSvc < 0 ? text.length : appIdx + appMatch[0].length + nextSvc;
  const before = text.slice(0, appIdx);
  const block = text.slice(appIdx, blockEnd);
  const rest = text.slice(blockEnd);
  if (!/^[ ]{4}image:/m.test(block)) {
    throw new Error("service app sans image — refus de réécriture");
  }
  const patched = block.replace(
    /^([ ]{4}image:\s+)("[^"]+"|\S+)/m,
    `$1${image}`,
  );
  return before + patched + rest;
}

/**
 * Écrit compose.yml + cf.env (contrat Cloudflare) + secrets.env (clés
 * applicatives) — tous deux chmod 600 : un secret ne doit jamais apparaître
 * dans ps, le registre ou un docker inspect.
 *
 * opts.cf : objet des clés CF_ENV_KEYS à écrire ; `undefined` → cf.env
 * existant conservé (updates sans re-fournir les credentials) ; `null` →
 * cf.env supprimé (tunnel désactivé). secrets.env est recalculé à chaque
 * écriture depuis inst.env (supprimé s'il n'y a plus de secret).
 *
 * opts.allowDropSidecar : **uniquement** `migrate-stack`. Sans ce flag,
 * un sidecar `cloudflared*` est préservé (patch image app) ; un hostname
 * public persisté sans sidecar refuse l'écriture (fail-closed).
 */
export function writeInstanceStack({
  brandRoot,
  brandId,
  image,
  inst,
  cf,
  allowDropSidecar = false,
}) {
  const dir = stackDir(brandRoot, inst);
  fs.mkdirSync(dir, { recursive: true });
  const composeFile = composeFilePath(brandRoot, inst);
  const existing = fs.existsSync(composeFile)
    ? fs.readFileSync(composeFile, "utf8")
    : "";

  if (!allowDropSidecar && existing) {
    const policy = resolveStackUpdatePolicy({
      brandRoot,
      brandId,
      inst,
      composeYml: existing,
    });
    if (policy.action === "refuse") {
      const err = new Error(policy.error);
      err.code = "STACK_UPDATE_REFUSED";
      err.policy = policy;
      throw err;
    }
    if (policy.action === "preserve-sidecar") {
      fs.writeFileSync(composeFile, patchComposeAppImage(existing, image));
      return {
        dir,
        composeFile,
        withCf: fs.existsSync(cfEnvPath(brandRoot, inst)),
        preservedSidecar: true,
        sidecarServices: policy.sidecarServices,
      };
    }
  }

  const cfFile = cfEnvPath(brandRoot, inst);
  if (cf && typeof cf === "object") {
    writeEnvFile600(cfFile, cf);
  } else if (cf === null && fs.existsSync(cfFile)) {
    fs.rmSync(cfFile);
  }
  const secretsFile = secretsEnvPath(brandRoot, inst);
  const { secret } = splitInstanceEnv(inst.env);
  if (Object.keys(secret).length) {
    writeEnvFile600(secretsFile, secret);
  } else if (fs.existsSync(secretsFile)) {
    fs.rmSync(secretsFile);
  }
  const withCf = Boolean(cf && Object.keys(cf).length) || fs.existsSync(cfFile);
  fs.writeFileSync(
    composeFile,
    renderInstanceCompose({ brandRoot, brandId, image, inst, withCf }),
  );
  return { dir, composeFile, withCf, preservedSidecar: false };
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: opts.quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    ...opts,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(" ")} → exit ${r.status}${r.stderr ? ` — ${String(r.stderr).slice(0, 400)}` : ""}`,
    );
  }
  return r;
}

function composeBase(brandRoot, inst) {
  return ["compose", "-f", composeFilePath(brandRoot, inst)];
}

export function stackUp(brandRoot, inst, { quiet, removeOrphans = true } = {}) {
  const args = [...composeBase(brandRoot, inst), "up", "-d"];
  // update d'un sidecar historique : jamais --remove-orphans (c'est ce
  // flag qui a tué cloudflared quand le compose était régénéré app-seule).
  if (removeOrphans) args.push("--remove-orphans");
  run("docker", args, { quiet });
}

export function stackDown(brandRoot, inst, { quiet } = {}) {
  run("docker", [...composeBase(brandRoot, inst), "down"], { quiet });
}

export function stackStop(brandRoot, inst, { quiet } = {}) {
  run("docker", [...composeBase(brandRoot, inst), "stop"], { quiet });
}

export function stackStart(brandRoot, inst, { quiet } = {}) {
  run("docker", [...composeBase(brandRoot, inst), "start"], { quiet });
}

export function stackLogs(brandRoot, inst, { tail = 200, follow = false } = {}) {
  const args = [...composeBase(brandRoot, inst), "logs", "--tail", String(tail)];
  if (follow) args.push("-f");
  run("docker", args);
}

/**
 * Port hôte loopback attribué (auto) au service app — debug/healthcheck.
 * Source de vérité : docker inspect du conteneur (le registre suit).
 */
export function stackHostPort(containerName) {
  const r = spawnSync(
    "docker",
    [
      "inspect",
      containerName,
      "--format",
      `{{(index (index .NetworkSettings.Ports "${STACK_APP_PORT}/tcp") 0).HostPort}}`,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return 0;
  const p = Number(String(r.stdout).trim());
  return Number.isInteger(p) && p > 0 ? p : 0;
}

/** Token tunnel stocké par le kernel dans /data (format {plain} ou brut). */
export function readKernelTunnelConfig(brandRoot, inst, brandId) {
  const dataAbs = path.isAbsolute(inst.dataDir)
    ? inst.dataDir
    : path.join(brandRoot, inst.dataDir);
  const file = path.join(dataAbs, `${brandId}-config.json`);
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
  const meta = raw.tunnelMeta || null;
  let token = "";
  try {
    const t = typeof raw.tunnelToken === "string" ? JSON.parse(raw.tunnelToken) : raw.tunnelToken;
    token = String(t?.plain || t || "");
  } catch {
    token = String(raw.tunnelToken || "");
  }
  if (!meta?.hostname || !token || token === "local") return null;
  return {
    slug: meta.slug || inst.name,
    hostname: meta.hostname,
    publicUrl: meta.publicUrl || `https://${meta.hostname}`,
    tunnelId: meta.tunnelId || "",
    tunnelToken: token,
    localPort: meta.localPort || STACK_APP_PORT,
  };
}
