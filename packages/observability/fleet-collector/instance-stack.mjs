/**
 * Stack compose autonome par instance serveur — app seule.
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

/**
 * Écrit compose.yml + cf.env (contrat Cloudflare) + secrets.env (clés
 * applicatives) — tous deux chmod 600 : un secret ne doit jamais apparaître
 * dans ps, le registre ou un docker inspect.
 *
 * opts.cf : objet des clés CF_ENV_KEYS à écrire ; `undefined` → cf.env
 * existant conservé (updates sans re-fournir les credentials) ; `null` →
 * cf.env supprimé (tunnel désactivé). secrets.env est recalculé à chaque
 * écriture depuis inst.env (supprimé s'il n'y a plus de secret).
 */
export function writeInstanceStack({ brandRoot, brandId, image, inst, cf }) {
  const dir = stackDir(brandRoot, inst);
  fs.mkdirSync(dir, { recursive: true });
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
  const composeFile = composeFilePath(brandRoot, inst);
  fs.writeFileSync(
    composeFile,
    renderInstanceCompose({ brandRoot, brandId, image, inst, withCf }),
  );
  return { dir, composeFile, withCf };
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

export function stackUp(brandRoot, inst, { quiet } = {}) {
  run("docker", [...composeBase(brandRoot, inst), "up", "-d", "--remove-orphans"], { quiet });
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
