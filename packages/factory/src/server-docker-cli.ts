/**
 * CLI `creezio server-docker` — build/up/down des serveurs marque headless.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
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
  creezio server-docker proof  --brand-root <app>   # up + curl health A/B

Env:
  BRAND_ROOT, CREEZIO_KIT_ROOT, BRAND_ID, SERVER_A_PORT, SERVER_B_PORT
  DATA_DIR (volumes SQLite isolés par instance)

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
    ];
    if (!args.noBuild) upArgs.push("--build");
    upArgs.push(...args.rest);
    run("docker", upArgs, env);

    if (args.sub === "proof") {
      const portA = Number(process.env.SERVER_A_PORT || 18791);
      const portB = Number(process.env.SERVER_B_PORT || 18792);
      const expected = env.BRAND_ID;
      let a = await curlHealth(portA);
      let b = await curlHealth(portB);
      for (let i = 0; i < 30 && !(a.ok && b.ok); i++) {
        await new Promise((r) => setTimeout(r, 2000));
        a = await curlHealth(portA);
        b = await curlHealth(portB);
      }
      console.log(`health A :${portA} → ${a.status} brandId=${a.brandId}`);
      console.log(`health B :${portB} → ${b.status} brandId=${b.brandId}`);
      if (!a.ok || !b.ok) {
        throw new Error("preuve health échouée (attendu HTTP 200 sur A et B)");
      }
      if (a.brandId !== expected || b.brandId !== expected) {
        throw new Error(
          `brandId incohérent: A=${a.brandId} B=${b.brandId} expected=${expected}`,
        );
      }
      console.log("✓ preuve server-docker : 2 instances OK");
    }
    return;
  }

  throw new Error(
    `Sous-commande inconnue: ${args.sub} (build|up|down|ps|proof)`,
  );
}
