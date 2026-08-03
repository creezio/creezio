/**
 * CLI `creezio server-docker` — build/up/down des serveurs marque headless.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ServerDockerArgs = {
  sub: string;
  brandRoot?: string;
  project?: string;
  kitRoot?: string;
  help?: boolean;
  noBuild?: boolean;
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
    project: "creezio-servers",
  };
  while (rest.length) {
    const a = rest.shift()!;
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--no-build") out.noBuild = true;
    else if (a.startsWith("--brand-root="))
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

Usage:
  creezio server-docker build  --brand-root <app> [--kit-root <kit>]
  creezio server-docker up     --brand-root <app> [--project creezio-servers] [--no-build]
  creezio server-docker down   --brand-root <app> [--project creezio-servers]
  creezio server-docker ps     [--project creezio-servers]
  creezio server-docker proof  --brand-root <app>   # up + curl health server-1/2 + .desktop

Env:
  BRAND_ROOT, CREEZIO_KIT_ROOT, BRAND_ID, SERVER_1_PORT, SERVER_2_PORT
  DATA_DIR (volumes SQLite isolés : …/server-1, …/server-2)
  SERVER_DESKTOP_PRODUCT  (override nom raccourcis, défaut brandName BrandSpec)

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

function ensureBrandDockerignore(brandRoot: string, kit: string): void {
  const dest = path.join(brandRoot, ".dockerignore");
  const src = path.join(kit, "docker/server/brand.dockerignore");
  if (fs.existsSync(dest)) return;
  if (!fs.existsSync(src)) return;
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
  return {
    ...process.env,
    BRAND_ROOT: paths.brandRoot,
    CREEZIO_KIT_ROOT: paths.kit,
    BRAND_ID:
      process.env.BRAND_ID ||
      inferBrandId(paths.brandRoot) ||
      "brand",
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
    return pkg.creezio?.brandId || pkg.name || null;
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

function ensureElectronBuild(brandRoot: string): void {
  const marker = path.join(brandRoot, "build/electron/app-manifest.js");
  if (fs.existsSync(marker)) return;
  console.log("build/electron manquant — npm run build:electron…");
  run("npm", ["run", "build:electron"], process.env, { cwd: brandRoot });
  if (!fs.existsSync(marker)) {
    throw new Error(`build:electron n'a pas produit ${marker}`);
  }
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

  if (args.sub === "build") {
    ensureElectronBuild(paths.brandRoot);
    run(
      "docker",
      [
        "build",
        "-f",
        paths.dockerfile,
        "-t",
        process.env.SERVER_IMAGE || "creezio-brand-server:local",
        paths.brandRoot,
      ],
      env,
    );
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
    `Sous-commande inconnue: ${args.sub} (build|up|down|ps|proof)`,
  );
}
