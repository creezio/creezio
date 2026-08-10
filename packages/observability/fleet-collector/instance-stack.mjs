/**
 * Stack compose autonome par instance serveur (M2) — app + cloudflared sidecar.
 *
 * Modèle cible (standard flotte) :
 *   - 1 instance = 1 projet compose `<brandId>-server-<name>` autonome ;
 *   - ports INTERNES fixes : l'app écoute toujours sur 18791 dans le réseau
 *     du stack, le tunnel la joint par nom de service (`http://app:18791`) ;
 *   - port hôte indifférent : publié sur 127.0.0.1 avec attribution auto
 *     (`127.0.0.1::18791`) pour debug/healthcheck — fini les collisions ;
 *   - cloudflared = conteneur sidecar du stack (token dans tunnel.env,
 *     chmod 600, jamais dans ps ni dans le registre) ;
 *   - zéro port public : l'accès utilisateur passe par Cloudflare.
 *
 * SoT partagée : le CLI factory (server-docker create/migrate-stack) et
 * server-lib.mjs (update stack-aware) importent ce module — jamais de
 * copie divergente du template compose.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

/** Port interne fixe de l'app dans le réseau du stack (standard M2). */
export const STACK_APP_PORT = 18791;
/** Image du sidecar — alignée sur le binaire embarqué du kit (resources/bin). */
export const CLOUDFLARED_IMAGE =
  process.env.CREEZIO_CLOUDFLARED_IMAGE || "cloudflare/cloudflared:2026.7.3";

/** Répertoire du stack (compose.yml + tunnel.env) — hors volume /data. */
export function stackDir(brandRoot, inst) {
  return path.join(brandRoot, "docker-data", "stacks", inst.name);
}

export function composeFilePath(brandRoot, inst) {
  return path.join(stackDir(brandRoot, inst), "compose.yml");
}

export function tunnelEnvPath(brandRoot, inst) {
  return path.join(stackDir(brandRoot, inst), "tunnel.env");
}

export function stackProjectName(brandId, inst) {
  return `${brandId}-server-${inst.name}`;
}

/** Échappement double-quote YAML pour les valeurs d'env. */
function yq(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Rendu du compose.yml d'une instance.
 * opts.inst.hostPort : 0/undefined = attribution auto (défaut), >0 = fixe
 * (cas tempoflowadmin : le tunnel lp hôte et NPM ciblent 18801).
 * opts.withTunnel : true → service cloudflared sidecar (token via tunnel.env).
 */
export function renderInstanceCompose({ brandRoot, brandId, image, inst, withTunnel }) {
  const dataAbs = path.isAbsolute(inst.dataDir)
    ? inst.dataDir
    : path.join(brandRoot, inst.dataDir);
  const publish =
    Number(inst.hostPort) > 0
      ? `127.0.0.1:${Number(inst.hostPort)}:${STACK_APP_PORT}`
      : `127.0.0.1::${STACK_APP_PORT}`;
  const env = {
    BRAND_ID: brandId,
    INSTANCE_ID: `server-${inst.name}`,
    PORT: String(STACK_APP_PORT),
    METIER_PORT: String(STACK_APP_PORT),
    CREEZIO_HTTP_HOST: "0.0.0.0",
    ...(withTunnel
      ? {
          // Le kernel seede sa config tunnel depuis l'env et ne spawn rien.
          CREEZIO_TUNNEL_SIDECAR: "1",
          CREEZIO_TUNNEL_SERVICE_HOST: "app",
        }
      : {}),
    ...(inst.env || {}),
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
    ...(withTunnel
      ? [
          // tunnel.env : TUNNEL_TOKEN + CREEZIO_TUNNEL_* (seed kernel) —
          // chmod 600, jamais dans ps ni dans le registre.
          `    env_file:`,
          `      - ./tunnel.env`,
        ]
      : []),
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

  const services = [app.join("\n")];
  if (withTunnel) {
    services.push(
      [
        `  cloudflared:`,
        `    image: ${CLOUDFLARED_IMAGE}`,
        `    container_name: ${inst.containerName}-tunnel`,
        `    restart: unless-stopped`,
        `    command: tunnel --no-autoupdate run`,
        `    env_file:`,
        `      - ./tunnel.env`,
        `    depends_on:`,
        `      app:`,
        `        condition: service_started`,
        `    extra_hosts:`,
        `      - "host.docker.internal:host-gateway"`,
        `    logging:`,
        `      driver: json-file`,
        `      options: { max-size: "10m", max-file: "2" }`,
      ].join("\n"),
    );
  }

  return [
    `# Généré par creezio server-docker — stack autonome instance (M2).`,
    `# Ports internes fixes, port hôte loopback auto, tunnel sidecar, zéro port public.`,
    `# Régénéré à chaque update/migrate — ne pas éditer à la main.`,
    `name: ${stackProjectName(brandId, inst)}`,
    `services:`,
    services.join("\n"),
    ``,
  ].join("\n");
}

/**
 * Écrit compose.yml + tunnel.env (chmod 600 — le token ne doit jamais
 * apparaître dans ps, le registre ou un docker inspect : env_file le garde
 * hors de la commande). Le sidecar est rendu dès qu'un tunnel.env existe
 * (updates ultérieurs sans re-fournir le token).
 */
export function writeInstanceStack({ brandRoot, brandId, image, inst, tunnel }) {
  const dir = stackDir(brandRoot, inst);
  fs.mkdirSync(dir, { recursive: true });
  const envFile = tunnelEnvPath(brandRoot, inst);
  if (tunnel?.token) {
    const lines = [
      `TUNNEL_TOKEN=${tunnel.token}`,
      `CREEZIO_TUNNEL_TOKEN=${tunnel.token}`,
    ];
    if (tunnel.hostname) lines.push(`CREEZIO_TUNNEL_HOSTNAME=${tunnel.hostname}`);
    if (tunnel.tunnelId) lines.push(`CREEZIO_TUNNEL_ID=${tunnel.tunnelId}`);
    fs.writeFileSync(envFile, lines.join("\n") + "\n", { mode: 0o600 });
    fs.chmodSync(envFile, 0o600);
  }
  const withTunnel = Boolean(tunnel?.token) || fs.existsSync(envFile);
  const composeFile = composeFilePath(brandRoot, inst);
  fs.writeFileSync(
    composeFile,
    renderInstanceCompose({ brandRoot, brandId, image, inst, withTunnel }),
  );
  return { dir, composeFile, withTunnel };
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

/** Appel provisioner (reserve/configure) côté hôte — token via Authorization. */
export async function provisionerCall(baseUrl, token, route, body) {
  const res = await fetch(`${String(baseUrl).replace(/\/$/, "")}${route}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* réponse non JSON */
  }
  return { status: res.status, json: json || {} };
}
