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

function desktopFileContent(opts: {
  name: string;
  comment: string;
  url: string;
  icon: string | null;
}): string {
  const exec = opts.url.includes("'")
    ? `xdg-open "${opts.url}"`
    : `xdg-open '${opts.url}'`;
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
    "Categories=Network;Office;",
    "StartupNotify=true",
  );
  return `${lines.join("\n")}\n`;
}

/**
 * Génère/met à jour les raccourcis Linux pour chaque instance Compose up.
 * Cibles : ~/Desktop et ~/Bureau (si présents).
 */
export function writeServerDesktopShortcuts(opts: {
  brandRoot: string;
  instances?: ServerInstance[];
}): { files: string[]; product: string } {
  const instances = opts.instances || DEFAULT_SERVER_INSTANCES;
  const product = inferProductName(opts.brandRoot);
  const slug = sanitizeDesktopProduct(product);
  const icon = resolveServerIcon(opts.brandRoot);
  const dirs = desktopDirs();
  const files: string[] = [];
  if (!dirs.length) {
    console.log(
      "⚠ aucun ~/Desktop ni ~/Bureau — raccourcis .desktop non écrits",
    );
    return { files, product };
  }
  for (const inst of instances) {
    const port = resolveInstancePort(inst);
    const url = `http://127.0.0.1:${port}/`;
    const baseName = `${slug}-Server-${inst.n}.desktop`;
    const body = desktopFileContent({
      name: `${product} Server ${inst.n}`,
      comment: `${product} serveur Docker (${inst.id}) — UI/API :${port} (setup /settings via HTTP)`,
      url,
      icon,
    });
    for (const dir of dirs) {
      const dest = path.join(dir, baseName);
      fs.writeFileSync(dest, body, { mode: 0o755 });
      try {
        fs.chmodSync(dest, 0o755);
      } catch {
        /* ignore */
      }
      files.push(dest);
      console.log(`+ raccourci ${dest} → ${url}`);
    }
  }
  return { files, product };
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
      }
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
