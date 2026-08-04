/**
 * CLI `creezio server-docker` — serveurs marque headless (Docker).
 *
 * Deux modes :
 *   - registre : create/start/stop/rm/logs/ls (docker run piloté par
 *     docker-data/servers.json — multi-marques, ports auto, bind 127.0.0.1)
 *   - compose  : build/up/down/ps/proof (legacy server-1/server-2)
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  allocateServerPort,
  buildDockerRunArgs,
  instanceDataDirAbs,
  loadServerRegistry,
  saveServerRegistry,
  serverContainerName,
  serverImageName,
  validInstanceName,
  type ServerRegistryInstance,
} from "./server-docker-registry.js";

export type ServerDockerArgs = {
  sub: string;
  brandRoot?: string;
  project?: string;
  kitRoot?: string;
  help?: boolean;
  noBuild?: boolean;
  /** create : port explicite (sinon auto 18790+n). */
  port?: number;
  /** create : bind hôte (défaut 127.0.0.1 ; --expose = 0.0.0.0). */
  bind?: string;
  /** create : env additionnels K=V. */
  env: Record<string, string>;
  /** create : warm n8n/Hermes dans le container. */
  warm?: boolean;
  /** create : variant browser (Chromium sidecar IA, shm 1 Go). */
  browser?: boolean;
  /** rm : supprimer aussi le volume data. */
  purgeData?: boolean;
  /** logs : nombre de lignes (défaut 200). */
  tail?: number;
  /** logs : suivre. */
  follow?: boolean;
  rest: string[];
};

/** Instances Compose par défaut (chiffres — pas de lettres). */
export type ServerInstance = {
  id: string;
  n: number;
  portEnv: string;
  defaultPort: number;
};

export const DEFAULT_SERVER_INSTANCES: ServerInstance[] = [
  { id: "server-1", n: 1, portEnv: "SERVER_1_PORT", defaultPort: 18791 },
  { id: "server-2", n: 2, portEnv: "SERVER_2_PORT", defaultPort: 18792 },
];

function kitRootDefault(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../..");
}

export function parseServerDockerArgs(argv: string[]): ServerDockerArgs {
  const rest = [...argv];
  const out: ServerDockerArgs = {
    sub: rest.shift() || "",
    rest: [],
    env: {},
    project: "creezio-servers",
  };
  while (rest.length) {
    const a = rest.shift()!;
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--no-build") out.noBuild = true;
    else if (a === "--expose") out.bind = "0.0.0.0";
    else if (a === "--warm") out.warm = true;
    else if (a === "--browser") out.browser = true;
    else if (a === "--purge-data") out.purgeData = true;
    else if (a === "--follow" || a === "-f") out.follow = true;
    else if (a.startsWith("--port=")) out.port = Number(a.slice(7));
    else if (a === "--port") out.port = Number(rest.shift());
    else if (a.startsWith("--bind=")) out.bind = a.slice(7);
    else if (a === "--bind") out.bind = rest.shift();
    else if (a.startsWith("--tail=")) out.tail = Number(a.slice(7));
    else if (a === "--tail") out.tail = Number(rest.shift());
    else if (a.startsWith("--env=")) {
      const kv = a.slice(6);
      const i = kv.indexOf("=");
      if (i > 0) out.env[kv.slice(0, i)] = kv.slice(i + 1);
    } else if (a === "--env") {
      const kv = rest.shift() || "";
      const i = kv.indexOf("=");
      if (i > 0) out.env[kv.slice(0, i)] = kv.slice(i + 1);
    } else if (a.startsWith("--brand-root="))
      out.brandRoot = a.slice("--brand-root=".length);
    else if (a === "--brand-root") out.brandRoot = rest.shift();
    else if (a.startsWith("--project="))
      out.project = a.slice("--project=".length);
    else if (a === "--project") out.project = rest.shift();
    else if (a.startsWith("--kit-root="))
      out.kitRoot = a.slice("--kit-root=".length);
    else if (a === "--kit-root") out.kitRoot = rest.shift();
    else out.rest.push(a);
  }
  return out;
}

export function printServerDockerHelp(): void {
  console.log(`creezio server-docker — serveurs marque headless (Docker)

Instances nommées (registre docker-data/servers.json — recommandé) :
  creezio server-docker create <nom> --brand-root <app> [--port N] [--expose] [--warm] [--browser] [--env K=V]…
    --browser : image variant browser (Chromium+Xvfb, sidecar navigateur IA,
                profils /data/browser, shm 1 Go)
  creezio server-docker start  <nom> --brand-root <app>
  creezio server-docker stop   <nom> --brand-root <app>
  creezio server-docker rm     <nom> --brand-root <app> [--purge-data]
  creezio server-docker logs   <nom> --brand-root <app> [--tail 200] [--follow]
  creezio server-docker ls     --brand-root <app>

Admin web multi-serveurs (fleet-collector étendu) :
  creezio server-docker admin up|down|status --brand-root <app> [--port 18800]
  creezio server-docker admin add-brand <brandRoot> --brand-root <app>
    (ajoute une marque au server-admin.json + recreate le container admin)

Compose legacy (server-1 / server-2) :
  creezio server-docker build  --brand-root <app> [--kit-root <kit>]
  creezio server-docker up     --brand-root <app> [--project creezio-servers] [--no-build]
  creezio server-docker down   --brand-root <app> [--project creezio-servers]
  creezio server-docker ps     [--project creezio-servers]
  creezio server-docker proof  --brand-root <app>   # up + curl health server-1/2 + .desktop

Sécurité : ports publiés sur 127.0.0.1 par défaut — --expose ou SERVER_BIND=0.0.0.0 pour ouvrir.
Image par marque : creezio-server-<brandId>:local (multi-marques sans collision).

Env:
  BRAND_ROOT, CREEZIO_KIT_ROOT, BRAND_ID, SERVER_BIND, SERVER_1_PORT, SERVER_2_PORT
  DATA_DIR (volumes SQLite isolés : …/server-1, …/server-2)
  SERVER_DESKTOP_PRODUCT  (override nom raccourcis, défaut brandName BrandSpec)

Après up/create : GET /api/v1/os/boot-status = progression du boot (splash JSON).
Après up : raccourcis ~/Desktop et ~/Bureau → {Product}-Server-{N}.desktop
  Exec = ~/bin/open-creezio-server <url> (wrapper firefox/chromium/xdg-open/gio)

Doc: docker/server/README.md
`);
}

function ensureDocker(): void {
  const d = spawnSync("docker", ["--version"], { encoding: "utf8" });
  if (d.status !== 0) {
    throw new Error(
      "docker introuvable — installer Docker Engine + plugin compose",
    );
  }
  const c = spawnSync("docker", ["compose", "version"], { encoding: "utf8" });
  if (c.status !== 0) {
    throw new Error("docker compose introuvable — installer le plugin Compose v2");
  }
}

/** Marqueur de version du template — un .dockerignore sans lui est rafraîchi. */
const DOCKERIGNORE_MARKER = "# creezio-dockerignore v2";

function ensureBrandDockerignore(brandRoot: string, kit: string): void {
  const dest = path.join(brandRoot, ".dockerignore");
  const src = path.join(kit, "docker/server/brand.dockerignore");
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dest)) {
    const cur = fs.readFileSync(dest, "utf8");
    if (cur.includes(DOCKERIGNORE_MARKER)) return;
    fs.copyFileSync(src, dest);
    console.log(`~ .dockerignore rafraîchi (template kit v2 — UI Next incluse)`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`+ .dockerignore (depuis kit docker/server/brand.dockerignore)`);
}

function resolvePaths(args: ServerDockerArgs): {
  kit: string;
  brandRoot: string;
  composeFile: string;
  dockerfile: string;
  project: string;
} {
  const kit = path.resolve(
    args.kitRoot || process.env.CREEZIO_KIT_ROOT || kitRootDefault(),
  );
  const brandRaw = String(args.brandRoot || process.env.BRAND_ROOT || "").trim();
  if (!brandRaw) {
    throw new Error("--brand-root <app> (ou env BRAND_ROOT) requis");
  }
  const brandRoot = path.resolve(brandRaw);
  if (!fs.existsSync(brandRoot)) {
    throw new Error(`brand-root introuvable: ${brandRoot}`);
  }
  const composeFile = path.join(kit, "docker/server/docker-compose.yml");
  const dockerfile = path.join(kit, "docker/server/Dockerfile");
  if (!fs.existsSync(composeFile) || !fs.existsSync(dockerfile)) {
    throw new Error(`docker/server incomplet sous ${kit}`);
  }
  return {
    kit,
    brandRoot,
    composeFile,
    dockerfile,
    project: args.project || "creezio-servers",
  };
}

function run(
  cmd: string,
  argv: string[],
  env: NodeJS.ProcessEnv,
  opts?: { cwd?: string },
): void {
  const r = spawnSync(cmd, argv, {
    stdio: "inherit",
    env,
    cwd: opts?.cwd,
  });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${argv.join(" ")} exit ${r.status ?? "?"}`);
  }
}

function composeEnv(
  paths: ReturnType<typeof resolvePaths>,
): NodeJS.ProcessEnv {
  const brandId =
    process.env.BRAND_ID || inferBrandId(paths.brandRoot) || "brand";
  return {
    ...process.env,
    BRAND_ROOT: paths.brandRoot,
    CREEZIO_KIT_ROOT: paths.kit,
    BRAND_ID: brandId,
    // Image par marque — compose et `docker run` (registre) partagent le tag.
    SERVER_IMAGE: serverImageName(brandId),
    DATA_DIR:
      process.env.DATA_DIR ||
      path.join(paths.brandRoot, "docker-data", "servers"),
  };
}

function inferBrandId(brandRoot: string): string | null {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(brandRoot, "package.json"), "utf8"),
    ) as { name?: string; creezio?: { brandId?: string } };
    if (pkg.creezio?.brandId) return pkg.creezio.brandId;
    if (!pkg.name) return null;
    // "@creezio/app-tempoflow3" → "tempoflow3" (tag image / nom container).
    const last = pkg.name.split("/").pop() || pkg.name;
    return last.replace(/^app-/, "").replace(/[^a-z0-9-]/gi, "") || null;
  } catch {
    return null;
  }
}

/** Nom produit pour raccourcis (TempoFlow → TempoFlow-Server-1.desktop). */
export function inferProductName(brandRoot: string): string {
  const env = String(process.env.SERVER_DESKTOP_PRODUCT || "").trim();
  if (env) return env;
  for (const rel of ["brand-spec/brand.yaml", "brand-spec/brand.yml"]) {
    const p = path.join(brandRoot, rel);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    const m = text.match(/^\s*brandName:\s*["']?([^\n#"']+)/m);
    if (m?.[1]) return m[1].trim();
  }
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(brandRoot, "package.json"), "utf8"),
    ) as { creezio?: { productName?: string }; description?: string };
    if (pkg.creezio?.productName) return pkg.creezio.productName;
  } catch {
    /* ignore */
  }
  const id = inferBrandId(brandRoot) || "Brand";
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function resolveServerIcon(brandRoot: string): string | null {
  for (const rel of [
    "resources/icons/server.png",
    "brand-spec/icons/server.png",
    "icons/server.png",
  ]) {
    const p = path.join(brandRoot, rel);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function desktopDirs(): string[] {
  const home = os.homedir();
  const dirs: string[] = [];
  for (const name of ["Desktop", "Bureau"]) {
    const d = path.join(home, name);
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) dirs.push(d);
  }
  return dirs;
}

function sanitizeDesktopProduct(product: string): string {
  return product
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9._-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "Brand";
}

function resolveInstancePort(inst: ServerInstance): number {
  const raw = process.env[inst.portEnv];
  if (raw && /^\d+$/.test(raw)) return Number(raw);
  return inst.defaultPort;
}

/** Script générique URL → navigateur (copié depuis docker/server/). */
export const CREEZIO_OPEN_URL_BIN = "creezio-open-url";

/** Fallback inline si le script kit est absent (tests / kit partiel). */
const CREEZIO_OPEN_URL_FALLBACK = `#!/usr/bin/env bash
set -u
URL="\${1:-}"
LOG_DIR="\${XDG_STATE_HOME:-\${HOME:-/home/deploy}/.local/state}/tempoflow-server"
LOG="\$LOG_DIR/open-server.log"
mkdir -p "\$LOG_DIR" 2>/dev/null || true
log() { echo "[\$(date -Iseconds 2>/dev/null || date)] \$*" >>"\$LOG" 2>/dev/null || true; echo "\$*" >&2; }
[[ -n "\$URL" ]] || { log "ERROR usage: creezio-open-url <url>"; exit 2; }
if [[ -z "\${DISPLAY:-}" ]]; then
  for sock in /tmp/.X11-unix/X10 /tmp/.X11-unix/X*; do
    [[ -S "\$sock" ]] || continue
    n="\${sock##*/X}"
    [[ "\$n" =~ ^[0-9]+$ ]] || continue
    export DISPLAY=":\$n"
    break
  done
fi
export XAUTHORITY="\${XAUTHORITY:-\${HOME:-/home/deploy}/.Xauthority}"
export PATH="/snap/bin:/usr/local/bin:/usr/bin:/bin:\${PATH:-}"
export PATH="\${HOME:-/home/deploy}/bin:\${HOME:-/home/deploy}/.local/firefox:/snap/bin:/usr/bin:/bin:\${PATH:-}"
log "start url=\$URL DISPLAY=\${DISPLAY:-}"
for bin in "\${HOME:-/home/deploy}/.local/firefox/firefox" /snap/bin/firefox \\
  /usr/bin/firefox-esr /usr/bin/firefox firefox \\
  /usr/bin/chromium-browser /usr/bin/chromium chromium; do
  if [[ -x "\$bin" ]] || command -v "\$bin" >/dev/null 2>&1; then
    r="\$bin"; [[ -x "\$bin" ]] || r="\$(command -v "\$bin")"
    nohup env MOZ_DISABLE_CONTENT_SANDBOX=1 "\$r" "\$URL" >>"\$LOG" 2>&1 &
    log "OK \$r → \$URL (pid \$!)"; echo "opened with \$r → \$URL (pid \$!)"; exit 0
  fi
done
log "ERROR aucun navigateur pour \$URL"; exit 1
`;

function binDir(): string {
  const d = path.join(os.homedir(), "bin");
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function chmod755(p: string): void {
  try {
    fs.chmodSync(p, 0o755);
  } catch {
    /* ignore */
  }
}

/**
 * Installe ~/bin/creezio-open-url (copie kit docker/server/creezio-open-url.sh).
 */
export function ensureCreezioOpenUrl(kitRoot?: string): string {
  const dest = path.join(binDir(), CREEZIO_OPEN_URL_BIN);
  const kit = path.resolve(
    kitRoot || process.env.CREEZIO_KIT_ROOT || kitRootDefault(),
  );
  const src = path.join(kit, "docker/server/creezio-open-url.sh");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    fs.writeFileSync(dest, CREEZIO_OPEN_URL_FALLBACK, { mode: 0o755 });
  }
  chmod755(dest);
  return dest;
}

/** @deprecated alias — préférer ensureCreezioOpenUrl */
export function ensureOpenCreezioServerWrapper(kitRoot?: string): string {
  return ensureCreezioOpenUrl(kitRoot);
}

/**
 * Wrapper par instance : ~/bin/open-creezio-server-N → URL fixe.
 * Les .desktop appellent ce binaire (pas xdg-open direct).
 */
export function writeOpenCreezioServerN(opts: {
  n: number;
  url: string;
  openUrlBin: string;
}): string {
  const dest = path.join(binDir(), `open-creezio-server-${opts.n}`);
  const body = `#!/usr/bin/env bash
# Raccourci Docker server-${opts.n} — généré par creezio server-docker
set -u
LOG_DIR="\${XDG_STATE_HOME:-\${HOME:-/home/deploy}/.local/state}/tempoflow-server"
LOG="\$LOG_DIR/open-server.log"
mkdir -p "\$LOG_DIR" 2>/dev/null || true
echo "[\$(date -Iseconds 2>/dev/null || date)] open-creezio-server-${opts.n} → ${opts.url} DISPLAY=\${DISPLAY:-}" >>"\$LOG" 2>/dev/null || true
export PATH="/snap/bin:/usr/local/bin:/usr/bin:/bin:\${PATH:-}"
exec "${opts.openUrlBin}" "${opts.url}"
`;
  fs.writeFileSync(dest, body, { mode: 0o755 });
  chmod755(dest);
  return dest;
}

function markDesktopTrusted(desktopPath: string): void {
  // XFCE/GNOME refuse le double-clic tant que metadata::trusted n'est pas true.
  const r = spawnSync(
    "gio",
    ["set", desktopPath, "metadata::trusted", "true"],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.log(
      `⚠ gio set metadata::trusted échoué pour ${desktopPath}: ${r.stderr || r.stdout || r.status}`,
    );
  }
}

function desktopFileContent(opts: {
  name: string;
  comment: string;
  icon: string | null;
  /** Chemin absolu du wrapper open-creezio-server-N (sans args). */
  execPath: string;
}): string {
  const exec = opts.execPath.includes(" ")
    ? `"${opts.execPath}"`
    : opts.execPath;
  const lines = [
    "[Desktop Entry]",
    "Version=1.0",
    "Type=Application",
    `Name=${opts.name}`,
    `Comment=${opts.comment}`,
    `Exec=${exec}`,
  ];
  if (opts.icon) lines.push(`Icon=${opts.icon}`);
  lines.push(
    "Terminal=false",
    "Categories=Network;",
    // false : le wrapper bash n'émet pas de startup notification → sinon XFCE « rien ».
    "StartupNotify=false",
  );
  return `${lines.join("\n")}\n`;
}

/**
 * Génère/met à jour les raccourcis Linux pour chaque instance Compose up.
 * Cibles : ~/Desktop et ~/Bureau (si présents).
 * Exec → ~/bin/open-creezio-server-N (firefox/chromium/gio/xdg-open…).
 */
export function writeServerDesktopShortcuts(opts: {
  brandRoot: string;
  kitRoot?: string;
  instances?: ServerInstance[];
}): {
  files: string[];
  product: string;
  wrappers: string[];
  openUrlBin: string;
} {
  const instances = opts.instances || DEFAULT_SERVER_INSTANCES;
  const product = inferProductName(opts.brandRoot);
  const slug = sanitizeDesktopProduct(product);
  const icon = resolveServerIcon(opts.brandRoot);
  const openUrlBin = ensureCreezioOpenUrl(opts.kitRoot);
  const dirs = desktopDirs();
  const files: string[] = [];
  const wrappers: string[] = [];
  if (!dirs.length) {
    console.log(
      "⚠ aucun ~/Desktop ni ~/Bureau — raccourcis .desktop non écrits",
    );
    return { files, product, wrappers, openUrlBin };
  }
  for (const inst of instances) {
    const port = resolveInstancePort(inst);
    const url = `http://127.0.0.1:${port}/`;
    const wrapper = writeOpenCreezioServerN({
      n: inst.n,
      url,
      openUrlBin,
    });
    wrappers.push(wrapper);
    const baseName = `${slug}-Server-${inst.n}.desktop`;
    const body = desktopFileContent({
      name: `${product} Server ${inst.n}`,
      comment: `${product} serveur Docker (${inst.id}) — UI/API :${port} (setup /settings via HTTP)`,
      icon,
      execPath: wrapper,
    });
    for (const dir of dirs) {
      const dest = path.join(dir, baseName);
      fs.writeFileSync(dest, body, { mode: 0o755 });
      chmod755(dest);
      markDesktopTrusted(dest);
      files.push(dest);
      console.log(`+ raccourci ${dest} → Exec=${wrapper} (${url}) [trusted]`);
    }
  }
  return { files, product, wrappers, openUrlBin };
}

/**
 * App standalone dockerisable — répare automatiquement une app factory
 * fraîche (hors workspace kit) : deps `@creezio/*` → `file:vendor/creezio/*`,
 * sync vendor depuis le kit, `npm install` (node_modules + package-lock,
 * requis par le `npm ci` de l'image).
 */
function ensureBrandStandalone(brandRoot: string, kit: string): void {
  const pkgPath = path.join(brandRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const creezioPkgs = new Set<string>();
  let rewrote = false;
  for (const field of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const [k, v] of Object.entries(deps)) {
      const m = /^@creezio\/(.+)$/.exec(k);
      if (!m || !m[1]) continue;
      creezioPkgs.add(m[1]);
      if (!v.startsWith("file:")) {
        deps[k] = `file:vendor/creezio/${m[1]}`;
        rewrote = true;
      }
    }
  }
  if (creezioPkgs.size === 0) return;

  const vendorDir = path.join(brandRoot, "vendor/creezio");
  if (!fs.existsSync(path.join(vendorDir, "SYNC.json"))) {
    const syncScript = path.join(kit, "scripts/sync-creezio-vendor.sh");
    if (!fs.existsSync(syncScript)) {
      throw new Error(
        `vendor/creezio absent et script sync introuvable: ${syncScript}`,
      );
    }
    // Union deps app + socle : les packages vendorés se référencent en
    // file:../<name> — tout le graphe doit être présent.
    const base = [
      "brand-config",
      "shell",
      "platform-core",
      "product-hub",
      "electron-shell",
      "desktop-tooling",
      "api-kernel",
      "mcp-facade",
      "os-ui",
      "shell-ui",
      "onboarding",
      "cockpit",
      "auth",
      "assistant",
      "tasks",
      "mails",
      "observability",
      "automations",
      "database",
      "brand-spec",
      "app-runtime",
    ];
    const list = [...new Set([...base, ...creezioPkgs])];
    console.log("vendor/creezio manquant — sync depuis le kit…");
    run("bash", [syncScript], {
      ...process.env,
      CREEZIO_KIT_ROOT: kit,
      ROOT: brandRoot,
      CREEZIO_VENDOR_PACKAGES: list.join(" "),
    });
  }
  if (rewrote) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log("package.json : deps @creezio/* → file:vendor/creezio/*");
  }
  if (
    !fs.existsSync(path.join(brandRoot, "node_modules")) ||
    !fs.existsSync(path.join(brandRoot, "package-lock.json")) ||
    rewrote
  ) {
    console.log("npm install (node_modules + package-lock)…");
    run("npm", ["install", "--no-audit", "--no-fund"], process.env, {
      cwd: brandRoot,
    });
  }
}

function ensureElectronBuild(brandRoot: string): void {
  const marker = path.join(brandRoot, "build/electron/app-manifest.js");
  if (fs.existsSync(marker)) return;
  // build:runtime = nom nominal ; build:electron = alias historique.
  const pkg = JSON.parse(
    fs.readFileSync(path.join(brandRoot, "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> };
  const script = pkg.scripts?.["build:runtime"]
    ? "build:runtime"
    : "build:electron";
  console.log(`build/electron manquant — npm run ${script}…`);
  run("npm", ["run", script], process.env, { cwd: brandRoot });
  if (!fs.existsSync(marker)) {
    throw new Error(`${script} n'a pas produit ${marker}`);
  }
}

/**
 * UI Next standalone pour le container (CRM navigateur).
 * Si `ui/` existe sans build standalone → `npm run build:ui` (ou build --prefix ui).
 */
function ensureUiBuild(brandRoot: string): void {
  const uiDir = path.join(brandRoot, "ui");
  if (!fs.existsSync(path.join(uiDir, "package.json"))) {
    console.log("⚠ pas de ui/ — le container servira l'API sans CRM web");
    return;
  }
  const marker = path.join(uiDir, ".next/standalone/server.js");
  if (fs.existsSync(marker)) return;
  if (!fs.existsSync(path.join(uiDir, "node_modules"))) {
    console.log("ui/node_modules manquant — npm install (ui)…");
    run("npm", ["install", "--no-audit", "--no-fund"], process.env, {
      cwd: uiDir,
    });
  }
  console.log("ui/.next/standalone manquant — build UI Next…");
  const pkg = JSON.parse(
    fs.readFileSync(path.join(brandRoot, "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> };
  if (pkg.scripts?.["build:ui"]) {
    run("npm", ["run", "build:ui"], process.env, { cwd: brandRoot });
  } else {
    run("npm", ["run", "build", "--prefix", "ui"], process.env, {
      cwd: brandRoot,
    });
  }
  if (!fs.existsSync(marker)) {
    throw new Error(`build UI n'a pas produit ${marker}`);
  }
}

function dockerBuildImage(
  paths: ReturnType<typeof resolvePaths>,
  env: NodeJS.ProcessEnv,
  opts?: { variant?: "base" | "browser"; image?: string },
): void {
  const variant = opts?.variant || "base";
  ensureBrandStandalone(paths.brandRoot, paths.kit);
  ensureElectronBuild(paths.brandRoot);
  ensureUiBuild(paths.brandRoot);
  run(
    "docker",
    [
      "build",
      "-f",
      paths.dockerfile,
      "--build-arg",
      `SERVER_VARIANT=${variant}`,
      "-t",
      opts?.image || String(env.SERVER_IMAGE),
      paths.brandRoot,
    ],
    env,
  );
}

function dockerImageExists(image: string): boolean {
  const r = spawnSync("docker", ["image", "inspect", image], {
    encoding: "utf8",
  });
  return r.status === 0;
}

function dockerContainerState(name: string): {
  exists: boolean;
  running: boolean;
  status: string;
  health: string | null;
} {
  const r = spawnSync(
    "docker",
    [
      "inspect",
      "--format",
      "{{.State.Status}}\t{{if .State.Health}}{{.State.Health.Status}}{{end}}",
      name,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    return { exists: false, running: false, status: "absent", health: null };
  }
  const [status = "?", health = ""] = r.stdout.trim().split("\t");
  return {
    exists: true,
    running: status === "running",
    status,
    health: health || null,
  };
}

async function curlHealth(
  port: number,
): Promise<{ ok: boolean; status: number; brandId?: string; body: string }> {
  const url = `http://127.0.0.1:${port}/api/v1/core/health`;
  try {
    const res = await fetch(url);
    const body = await res.text();
    let brandId: string | undefined;
    try {
      brandId = (JSON.parse(body) as { brandId?: string }).brandId;
    } catch {
      /* ignore */
    }
    return { ok: res.status === 200, status: res.status, brandId, body };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Admin web multi-serveurs — container fleet-collector étendu (docker.sock). */
const ADMIN_IMAGE = "creezio-server-admin:local";
const ADMIN_CONTAINER = "creezio-server-admin";
const ADMIN_DEFAULT_PORT = 18800;

type AdminConfig = {
  port: number;
  user: string;
  pass: string;
  brandRoots: string[];
};

function adminConfigPath(brandRoot: string): string {
  return path.join(brandRoot, "docker-data", "server-admin.json");
}

function loadOrInitAdminConfig(
  brandRoot: string,
  port?: number,
): AdminConfig {
  const file = adminConfigPath(brandRoot);
  let cfg: AdminConfig | null = null;
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as AdminConfig;
    if (raw && raw.user && raw.pass) cfg = raw;
  } catch {
    /* premier up */
  }
  if (!cfg) {
    cfg = {
      port: port || ADMIN_DEFAULT_PORT,
      user: "admin",
      pass: crypto.randomBytes(12).toString("base64url"),
      brandRoots: [brandRoot],
    };
  }
  if (port && port > 0) cfg.port = port;
  if (!cfg.brandRoots.includes(brandRoot)) cfg.brandRoots.push(brandRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n", { mode: 0o600 });
  return cfg;
}

async function runServerAdminSubcommand(
  args: ServerDockerArgs,
  paths: ReturnType<typeof resolvePaths>,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  let action = args.rest[0] || "up";

  if (action === "add-brand") {
    const rootArg = args.rest[1];
    if (!rootArg) {
      throw new Error(
        "creezio server-docker admin add-brand <brandRoot> --brand-root <app>",
      );
    }
    const abs = path.resolve(rootArg);
    if (!fs.existsSync(abs)) {
      throw new Error(`brand root introuvable: ${abs}`);
    }
    const cfg = loadOrInitAdminConfig(paths.brandRoot);
    if (cfg.brandRoots.includes(abs)) {
      console.log(`= marque déjà enregistrée: ${abs}`);
    } else {
      cfg.brandRoots.push(abs);
      const file = adminConfigPath(paths.brandRoot);
      fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n", {
        mode: 0o600,
      });
      console.log(`+ marque ajoutée à l'admin: ${abs}`);
    }
    const st = dockerContainerState(ADMIN_CONTAINER);
    if (!st.exists) {
      console.log(
        "admin pas encore démarré — creezio server-docker admin up pour le lancer",
      );
      return;
    }
    // Recreate : le container doit monter le nouveau volume + env brandRoots.
    console.log("~ recreate du container admin (nouveau volume marque)…");
    action = "up";
  }

  if (action === "down") {
    const st = dockerContainerState(ADMIN_CONTAINER);
    if (st.exists) run("docker", ["rm", "-f", ADMIN_CONTAINER], env);
    console.log("✓ admin arrêté");
    return;
  }

  if (action === "status") {
    const st = dockerContainerState(ADMIN_CONTAINER);
    console.log(
      `admin ${ADMIN_CONTAINER}: ${st.status}${st.health ? ` (${st.health})` : ""}`,
    );
    if (st.running) {
      const cfg = loadOrInitAdminConfig(paths.brandRoot);
      console.log(`  URL  : http://127.0.0.1:${cfg.port}/admin`);
      console.log(`  user : ${cfg.user} (pass: docker-data/server-admin.json)`);
    }
    return;
  }

  if (action !== "up") {
    throw new Error(`admin ${action} inconnu (up|down|status|add-brand)`);
  }

  const cfg = loadOrInitAdminConfig(paths.brandRoot, args.port);
  const adminDockerfile = path.join(paths.kit, "docker/server-admin/Dockerfile");
  const adminContext = path.join(
    paths.kit,
    "packages/observability/fleet-collector",
  );
  if (!fs.existsSync(adminDockerfile)) {
    throw new Error(`Dockerfile admin introuvable: ${adminDockerfile}`);
  }
  run(
    "docker",
    ["build", "-f", adminDockerfile, "-t", ADMIN_IMAGE, adminContext],
    env,
  );
  const st = dockerContainerState(ADMIN_CONTAINER);
  if (st.exists) run("docker", ["rm", "-f", ADMIN_CONTAINER], env);

  const runArgs = [
    "run",
    "-d",
    "--name",
    ADMIN_CONTAINER,
    "--restart",
    "unless-stopped",
    // host network : boot-status/health des serveurs via 127.0.0.1:<port>
    // (ports serveurs publiés loopback) — l'admin bind lui-même 127.0.0.1.
    "--network",
    "host",
    "-v",
    "/var/run/docker.sock:/var/run/docker.sock",
    "--label",
    "creezio.server-admin=1",
    "-e",
    `CREEZIO_ADMIN_PORT=${cfg.port}`,
    "-e",
    `CREEZIO_ADMIN_USER=${cfg.user}`,
    "-e",
    `CREEZIO_ADMIN_PASS=${cfg.pass}`,
    "-e",
    `CREEZIO_ADMIN_BRAND_ROOTS=${cfg.brandRoots.join(":")}`,
  ];
  for (const root of cfg.brandRoots) {
    runArgs.push("-v", `${root}:${root}`);
  }
  runArgs.push(ADMIN_IMAGE);
  run("docker", runArgs, env);

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cfg.port}/admin/api/health`, {
        headers: {
          authorization: `Basic ${Buffer.from(`${cfg.user}:${cfg.pass}`).toString("base64")}`,
        },
      });
      if (res.status === 200) break;
    } catch {
      /* warming */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(`✓ Creezio Server Admin : http://127.0.0.1:${cfg.port}/admin`);
  console.log(
    `  login ${cfg.user} — mot de passe dans ${path.relative(paths.brandRoot, adminConfigPath(paths.brandRoot))}`,
  );
}

async function waitBootReady(port: number, timeoutMs = 180000): Promise<void> {
  const started = Date.now();
  let lastLine = "";
  while (Date.now() - started < timeoutMs) {
    const h = await curlHealth(port);
    if (h.ok) {
      if (lastLine) process.stdout.write("\n");
      return;
    }
    try {
      const res = await fetch(
        `http://127.0.0.1:${port}/api/v1/os/boot-status`,
      );
      if (res.status === 200) {
        const model = (await res.json()) as {
          overallPercent?: number;
          steps?: { id: string; status: string; label: string }[];
        };
        const running = (model.steps || []).find(
          (s) => s.status === "running",
        );
        const line = `boot ${Math.round(model.overallPercent || 0)}% — ${running?.label || "…"}`;
        if (line !== lastLine) {
          process.stdout.write(`\r${line.padEnd(70)}`);
          lastLine = line;
        }
      }
    } catch {
      /* container pas encore up */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (lastLine) process.stdout.write("\n");
  throw new Error(`serveur pas prêt après ${Math.round(timeoutMs / 1000)}s`);
}

async function runRegistrySubcommand(
  args: ServerDockerArgs,
  paths: ReturnType<typeof resolvePaths>,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  const brandId = String(env.BRAND_ID);
  const registry = loadServerRegistry(paths.brandRoot, brandId);
  registry.image = serverImageName(brandId);

  if (args.sub === "ls") {
    if (!registry.instances.length) {
      console.log(
        `aucune instance (registre ${path.join("docker-data", "servers.json")}) — creezio server-docker create <nom>`,
      );
      return;
    }
    console.log(`${"NOM".padEnd(14)}${"CONTAINER".padEnd(34)}${"PORT".padEnd(8)}${"ÉTAT".padEnd(12)}SANTÉ`);
    for (const inst of registry.instances) {
      const st = dockerContainerState(inst.containerName);
      console.log(
        `${inst.name.padEnd(14)}${inst.containerName.padEnd(34)}${String(inst.port).padEnd(8)}${st.status.padEnd(12)}${st.health ?? "-"}`,
      );
    }
    return;
  }

  const name = args.rest[0];
  if (!name) {
    throw new Error(`creezio server-docker ${args.sub} <nom> — nom requis`);
  }
  if (!validInstanceName(name)) {
    throw new Error(
      `nom d'instance invalide: ${name} (attendu [a-z0-9][a-z0-9-]*)`,
    );
  }

  if (args.sub === "create") {
    if (registry.instances.some((i) => i.name === name)) {
      throw new Error(
        `instance déjà enregistrée: ${name} (creezio server-docker start ${name})`,
      );
    }
    const containerName = serverContainerName(brandId, name);
    const st = dockerContainerState(containerName);
    if (st.exists) {
      throw new Error(`container ${containerName} existe déjà — docker rm -f ?`);
    }
    const variant = args.browser ? ("browser" as const) : ("base" as const);
    const image = serverImageName(brandId, variant);
    if (!dockerImageExists(image)) {
      console.log(`image ${image} absente — build (variant ${variant})…`);
      dockerBuildImage(paths, env, { variant, image });
    }
    const port =
      args.port && args.port > 0 ? args.port : await allocateServerPort(registry);
    const extraEnv: Record<string, string> = { ...args.env };
    if (args.warm) extraEnv.CREEZIO_NATIVE_WARM = "1";
    const inst: ServerRegistryInstance = {
      name,
      containerName,
      port,
      bind: args.bind || "127.0.0.1",
      dataDir: path.join("docker-data", "servers", name),
      createdAt: new Date().toISOString(),
      ...(Object.keys(extraEnv).length ? { env: extraEnv } : {}),
      ...(variant === "browser" ? { variant } : {}),
    };
    fs.mkdirSync(instanceDataDirAbs(paths.brandRoot, inst), {
      recursive: true,
    });
    run(
      "docker",
      buildDockerRunArgs({
        brandRoot: paths.brandRoot,
        brandId,
        image,
        inst,
      }),
      env,
    );
    registry.instances.push(inst);
    saveServerRegistry(paths.brandRoot, registry);
    console.log(
      `+ instance ${name} → http://${inst.bind === "0.0.0.0" ? "127.0.0.1" : inst.bind}:${port}/ (container ${containerName})`,
    );
    console.log(
      `  boot-status : curl http://127.0.0.1:${port}/api/v1/os/boot-status`,
    );
    await waitBootReady(port);
    console.log(`✓ serveur ${name} prêt — CRM: http://127.0.0.1:${port}/`);
    return;
  }

  const inst = registry.instances.find((i) => i.name === name);
  if (!inst) {
    throw new Error(
      `instance inconnue: ${name} — creezio server-docker ls (registre ${path.join("docker-data", "servers.json")})`,
    );
  }

  if (args.sub === "start") {
    run("docker", ["start", inst.containerName], env);
    await waitBootReady(inst.port);
    console.log(`✓ ${name} démarré — http://127.0.0.1:${inst.port}/`);
    return;
  }

  if (args.sub === "stop") {
    run("docker", ["stop", inst.containerName], env);
    console.log(`✓ ${name} arrêté`);
    return;
  }

  if (args.sub === "logs") {
    const tail = args.tail && args.tail > 0 ? args.tail : 200;
    const logArgs = ["logs", "--tail", String(tail)];
    if (args.follow) logArgs.push("-f");
    logArgs.push(inst.containerName);
    run("docker", logArgs, env);
    return;
  }

  if (args.sub === "rm") {
    const st = dockerContainerState(inst.containerName);
    if (st.exists) {
      run("docker", ["rm", "-f", inst.containerName], env);
    }
    registry.instances = registry.instances.filter((i) => i.name !== name);
    saveServerRegistry(paths.brandRoot, registry);
    if (args.purgeData) {
      fs.rmSync(instanceDataDirAbs(paths.brandRoot, inst), {
        recursive: true,
        force: true,
      });
      console.log(`✓ ${name} supprimé (container + données)`);
    } else {
      console.log(
        `✓ ${name} supprimé (données conservées: ${inst.dataDir} — --purge-data pour tout effacer)`,
      );
    }
    return;
  }
}

export async function runServerDockerCli(argv: string[]): Promise<void> {
  const args = parseServerDockerArgs(argv);
  if (args.help || !args.sub || args.sub === "help") {
    printServerDockerHelp();
    if (!args.sub || args.sub === "help") return;
    return;
  }

  ensureDocker();

  if (args.sub === "ps") {
    const project = args.project || "creezio-servers";
    run("docker", ["compose", "-p", project, "ps"], process.env);
    return;
  }

  const paths = resolvePaths(args);
  const env = composeEnv(paths);
  ensureBrandDockerignore(paths.brandRoot, paths.kit);

  const registrySubs = new Set([
    "create",
    "start",
    "stop",
    "rm",
    "logs",
    "ls",
  ]);
  if (registrySubs.has(args.sub)) {
    await runRegistrySubcommand(args, paths, env);
    return;
  }

  if (args.sub === "admin") {
    await runServerAdminSubcommand(args, paths, env);
    return;
  }

  if (args.sub === "build") {
    dockerBuildImage(paths, env);
    return;
  }

  if (args.sub === "down") {
    run(
      "docker",
      [
        "compose",
        "-p",
        paths.project,
        "-f",
        paths.composeFile,
        "down",
        ...args.rest,
      ],
      env,
    );
    return;
  }

  if (args.sub === "up" || args.sub === "proof") {
    ensureElectronBuild(paths.brandRoot);
    ensureUiBuild(paths.brandRoot);
    const upArgs = [
      "compose",
      "-p",
      paths.project,
      "-f",
      paths.composeFile,
      "up",
      "-d",
      "--remove-orphans",
    ];
    if (!args.noBuild) upArgs.push("--build");
    upArgs.push(...args.rest);
    run("docker", upArgs, env);

    const shortcuts = writeServerDesktopShortcuts({
      brandRoot: paths.brandRoot,
      kitRoot: paths.kit,
    });

    if (args.sub === "proof") {
      const instances = DEFAULT_SERVER_INSTANCES;
      const expected = env.BRAND_ID;
      const ports = instances.map((i) => resolveInstancePort(i));
      let results = await Promise.all(ports.map((p) => curlHealth(p)));
      for (let i = 0; i < 30 && !results.every((r) => r.ok); i++) {
        await new Promise((r) => setTimeout(r, 2000));
        results = await Promise.all(ports.map((p) => curlHealth(p)));
      }
      for (let i = 0; i < instances.length; i++) {
        const inst = instances[i]!;
        const h = results[i]!;
        console.log(
          `health ${inst.id} :${ports[i]} → ${h.status} brandId=${h.brandId}`,
        );
      }
      if (!results.every((r) => r.ok)) {
        throw new Error(
          "preuve health échouée (attendu HTTP 200 sur server-1 et server-2)",
        );
      }
      if (results.some((r) => r.brandId !== expected)) {
        throw new Error(
          `brandId incohérent: ${results.map((r) => r.brandId).join(", ")} expected=${expected}`,
        );
      }
      if (!shortcuts.files.length) {
        throw new Error(
          "preuve raccourcis échouée — aucun .desktop écrit (créer ~/Desktop ou ~/Bureau)",
        );
      }
      for (const f of shortcuts.files) {
        if (!fs.existsSync(f)) {
          throw new Error(`raccourci manquant: ${f}`);
        }
        const body = fs.readFileSync(f, "utf8");
        if (/^Exec=.*xdg-open/m.test(body)) {
          throw new Error(`raccourci utilise encore xdg-open direct: ${f}`);
        }
        if (!/^Exec=.*open-creezio-server-\d+/m.test(body)) {
          throw new Error(`raccourci sans Exec open-creezio-server-N: ${f}`);
        }
      }
      for (const w of shortcuts.wrappers) {
        if (!fs.existsSync(w)) {
          throw new Error(`wrapper manquant: ${w}`);
        }
      }
      // Smoke réel : lancer le wrapper server-1 (DISPLAY xrdp si besoin).
      const smokeEnv: NodeJS.ProcessEnv = {
        ...process.env,
        HOME: os.homedir(),
        XAUTHORITY:
          process.env.XAUTHORITY || path.join(os.homedir(), ".Xauthority"),
      };
      if (!smokeEnv.DISPLAY) {
        const x10 = "/tmp/.X11-unix/X10";
        smokeEnv.DISPLAY = fs.existsSync(x10) ? ":10" : ":0";
      }
      const wrapper1 = shortcuts.wrappers[0]!;
      const smoke = spawnSync(wrapper1, [], {
        encoding: "utf8",
        env: smokeEnv,
        timeout: 15000,
      });
      if (smoke.status !== 0) {
        throw new Error(
          `preuve wrapper échouée (${wrapper1}): status=${smoke.status} stderr=${smoke.stderr || smoke.stdout || "?"}`,
        );
      }
      console.log(
        `✓ wrapper ${path.basename(wrapper1)} → ${(smoke.stdout || "").trim() || "ok"}`,
      );
      console.log(
        `✓ preuve server-docker : ${instances.length} instances OK + ${shortcuts.files.length} raccourcis (${shortcuts.product})`,
      );
    }
    return;
  }

  throw new Error(
    `Sous-commande inconnue: ${args.sub} (create|start|stop|rm|logs|ls|admin|build|up|down|ps|proof)`,
  );
}
