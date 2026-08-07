/**
 * Cohérence package.json ↔ package-lock.json (requis par `npm ci` Docker).
 *
 * Piège récurrent marque neuve : le push factory sync le vendor mais ne
 * générait pas de lock → `npm run docker:build` (COPY + npm ci) ou un lock
 * stale fait échouer le build ; les agents régénèrent à la main, cassent le
 * symlink `server/node_modules` → `../node_modules`, et bouclent.
 *
 * SoT : vérifier le root lock (`packages[""]`) comme `npm ci`, régénérer via
 * `npm install --package-lock-only` (push) ou `npm install` (build host).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type PkgJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type LockRoot = {
  packages?: Record<
    string,
    {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    }
  >;
  dependencies?: Record<string, { version?: string } | string>;
};

function declaredDeps(pkg: PkgJson): Record<string, string> {
  return {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
    ...(pkg.optionalDependencies || {}),
  };
}

function lockedRootDeps(lock: LockRoot): Record<string, string> | null {
  const root = lock.packages?.[""];
  if (root) {
    return {
      ...(root.dependencies || {}),
      ...(root.devDependencies || {}),
      ...(root.optionalDependencies || {}),
    };
  }
  // lockfileVersion 1 legacy
  if (lock.dependencies) {
    const out: Record<string, string> = {};
    for (const [name, meta] of Object.entries(lock.dependencies)) {
      if (typeof meta === "string") out[name] = meta;
      else if (meta?.version) out[name] = meta.version;
    }
    return out;
  }
  return null;
}

/** True si le lock couvre exactement les deps déclarées (contrat npm ci). */
export function isPackageLockInSync(
  packageJsonPath: string,
  lockPath = path.join(path.dirname(packageJsonPath), "package-lock.json"),
): boolean {
  if (!fs.existsSync(packageJsonPath) || !fs.existsSync(lockPath)) return false;
  let pkg: PkgJson;
  let lock: LockRoot;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PkgJson;
    lock = JSON.parse(fs.readFileSync(lockPath, "utf8")) as LockRoot;
  } catch {
    return false;
  }
  const declared = declaredDeps(pkg);
  const locked = lockedRootDeps(lock);
  if (!locked) return false;
  const dKeys = Object.keys(declared).sort();
  const lKeys = Object.keys(locked).sort();
  if (dKeys.length !== lKeys.length) return false;
  for (const k of dKeys) {
    if (locked[k] !== declared[k]) return false;
  }
  return true;
}

function ensureVendorSymlink(brandRoot: string, serverDir: string): void {
  if (serverDir === brandRoot) return;
  const link = path.join(serverDir, "vendor");
  try {
    const st = fs.lstatSync(link);
    if (st.isSymbolicLink() || st.isDirectory()) return;
  } catch {
    /* absent */
  }
  fs.symlinkSync("../vendor", link);
}

const FILE_VENDOR_RE = /^file:((?:\.\.\/)*vendor\/creezio)\/([^/]+)$/;

/**
 * npm (Debian 9.2 / lock-only) résout les deps transitives `file:../pkg`
 * des packages vendor **relativement à node_modules/@creezio/<parent>**,
 * pas au dossier vendor — → ENOENT sur
 * `node_modules/@creezio/<pkg>/package.json`. Contre-mesure : déclarer
 * toute la clôture `file:` en deps directes `file:…/vendor/creezio/<pkg>`
 * (hoist ROOT, chemins valides). Miroir : docker/server/ensure-server-lock.mjs.
 */
export function expandFileVendorClosure(
  packageJsonPath: string,
): { added: string[] } {
  if (!fs.existsSync(packageJsonPath)) return { added: [] };
  let pkg: PkgJson & { name?: string };
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PkgJson & {
      name?: string;
    };
  } catch {
    return { added: [] };
  }
  const deps = { ...(pkg.dependencies || {}) };
  /** @type {Map<string, string>} name → file: spec relative to package.json dir */
  const declared = new Map<string, string>();
  let vendorPrefix: string | null = null;
  for (const [name, spec] of Object.entries(deps)) {
    if (!name.startsWith("@creezio/") || typeof spec !== "string") continue;
    const m = FILE_VENDOR_RE.exec(spec);
    if (!m?.[1]) continue;
    vendorPrefix = m[1];
    declared.set(name.slice("@creezio/".length), spec);
  }
  if (!vendorPrefix || declared.size === 0) return { added: [] };

  const pkgDir = path.dirname(packageJsonPath);
  const vendorRoot = path.resolve(pkgDir, vendorPrefix);
  if (!fs.existsSync(vendorRoot)) return { added: [] };

  const queue = [...declared.keys()];
  const seen = new Set(queue);
  while (queue.length) {
    const id = queue.shift()!;
    const nestedPkg = path.join(vendorRoot, id, "package.json");
    if (!fs.existsSync(nestedPkg)) continue;
    let nested: PkgJson;
    try {
      nested = JSON.parse(fs.readFileSync(nestedPkg, "utf8")) as PkgJson;
    } catch {
      continue;
    }
    const nestedDeps = {
      ...(nested.dependencies || {}),
      ...(nested.optionalDependencies || {}),
    };
    for (const [name, spec] of Object.entries(nestedDeps)) {
      if (!name.startsWith("@creezio/") || typeof spec !== "string") continue;
      if (!spec.startsWith("file:")) continue;
      const child = name.slice("@creezio/".length);
      if (seen.has(child)) continue;
      seen.add(child);
      queue.push(child);
    }
  }

  const added: string[] = [];
  for (const id of [...seen].sort()) {
    if (declared.has(id)) continue;
    const childPath = path.join(vendorRoot, id, "package.json");
    if (!fs.existsSync(childPath)) continue;
    const spec = `file:${vendorPrefix}/${id}`;
    deps[`@creezio/${id}`] = spec;
    added.push(`@creezio/${id}`);
  }
  if (!added.length) return { added: [] };
  pkg.dependencies = deps;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return { added };
}

/**
 * Régénère les package-lock manquants / incohérents d'une marque.
 * @param mode `lock-only` = push GitHub (pas de node_modules) ;
 *             `install` = build Docker host (node_modules + lock).
 */
export function ensureBrandPackageLocks(
  brandRoot: string,
  opts?: {
    mode?: "lock-only" | "install";
    log?: (line: string) => void;
  },
): { refreshed: string[] } {
  const log = opts?.log || ((l: string) => console.log(l));
  const mode = opts?.mode || "lock-only";
  const serverDir = fs.existsSync(path.join(brandRoot, "server/package.json"))
    ? path.join(brandRoot, "server")
    : brandRoot;
  ensureVendorSymlink(brandRoot, serverDir);

  const dirs: string[] = [serverDir];
  const uiDir = path.join(serverDir, "ui");
  if (fs.existsSync(path.join(uiDir, "package.json"))) dirs.push(uiDir);
  const clientDir = path.join(brandRoot, "client");
  if (
    clientDir !== serverDir &&
    fs.existsSync(path.join(clientDir, "package.json"))
  ) {
    dirs.push(clientDir);
  }

  const refreshed: string[] = [];
  for (const dir of dirs) {
    const pkgPath = path.join(dir, "package.json");
    const expanded = expandFileVendorClosure(pkgPath);
    if (expanded.added.length) {
      const relPkg = path.relative(brandRoot, dir) || ".";
      log(
        `deps @creezio/* complétées (${relPkg}) : ${expanded.added.join(", ")} (clôture file: vendor — npm ENOENT)`,
      );
    }
    if (isPackageLockInSync(pkgPath)) continue;
    const rel = path.relative(brandRoot, dir) || ".";
    log(
      `package-lock manquant/incohérent (${rel}) — npm ${mode === "install" ? "install" : "install --package-lock-only"}…`,
    );
    const args =
      mode === "install"
        ? ["install", "--no-audit", "--no-fund"]
        : [
            "install",
            "--package-lock-only",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
          ];
    const r = spawnSync("npm", args, {
      cwd: dir,
      stdio: "inherit",
      env: process.env,
    });
    if (r.status !== 0) {
      throw new Error(
        `npm ${args.join(" ")} exit ${r.status ?? "?"} dans ${rel} — lock Docker impossible`,
      );
    }
    if (!isPackageLockInSync(pkgPath)) {
      throw new Error(
        `package-lock toujours incohérent après npm dans ${rel} (deps package.json ≠ packages[""])`,
      );
    }
    refreshed.push(rel);
  }
  return { refreshed };
}
