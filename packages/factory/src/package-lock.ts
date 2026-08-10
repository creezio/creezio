/**
 * Cohérence package.json ↔ package-lock.json (requis par `npm ci` Docker).
 *
 * Mode npm (distribution GitHub Packages) : la racine marque est le SoT —
 * `packages[""]` (orchestrateur) + `packages["server"]` (livrable serveur,
 * workspace). Locks autonomes pour les projets npm indépendants (server/ui,
 * client/). Plus de vendor ni de clôture file: à expanser.
 *
 * Régénération via `npm install --package-lock-only` (push) ou
 * `npm install` (build host) — interroge le registre GitHub Packages :
 * CREEZIO_NPM_TOKEN doit être exporté (le .npmrc généré référence
 * ${CREEZIO_NPM_TOKEN}).
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

function lockedEntryDeps(
  lock: LockRoot,
  lockKey: string,
): Record<string, string> | null {
  const entry = lock.packages?.[lockKey];
  if (entry) {
    return {
      ...(entry.dependencies || {}),
      ...(entry.devDependencies || {}),
      ...(entry.optionalDependencies || {}),
    };
  }
  // lockfileVersion 1 legacy (locks racine uniquement)
  if (lockKey === "" && lock.dependencies) {
    const out: Record<string, string> = {};
    for (const [name, meta] of Object.entries(lock.dependencies)) {
      if (typeof meta === "string") out[name] = meta;
      else if (meta?.version) out[name] = meta.version;
    }
    return out;
  }
  return null;
}

/**
 * True si le lock couvre exactement les deps déclarées (contrat npm ci).
 * lockKey "" = entrée racine ; "server" = membre du workspace racine (lock
 * racine SoT).
 */
export function isPackageLockInSync(
  packageJsonPath: string,
  lockPath = path.join(path.dirname(packageJsonPath), "package-lock.json"),
  lockKey = "",
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
  const locked = lockedEntryDeps(lock, lockKey);
  if (!locked) return false;
  const dKeys = Object.keys(declared).sort();
  const lKeys = Object.keys(locked).sort();
  if (dKeys.length !== lKeys.length) return false;
  for (const k of dKeys) {
    if (locked[k] !== declared[k]) return false;
  }
  return true;
}

type LockTarget = {
  pkgPath: string;
  lockPath: string;
  lockKey: string;
  /** cwd de la régénération npm (workspace → racine). */
  cwd: string;
  rel: string;
};

/**
 * Cibles à garantir : racine (SoT) + membre server/ si monorepo (couvert
 * par le lock racine, entrée packages["server"]) + projets npm autonomes
 * (server/ui, client/) avec leur propre lock.
 */
function collectTargets(brandRoot: string): LockTarget[] {
  const monorepo = fs.existsSync(path.join(brandRoot, "server/package.json"));
  const rootPkg = path.join(brandRoot, "package.json");
  const rootLock = path.join(brandRoot, "package-lock.json");
  const targets: LockTarget[] = [
    { pkgPath: rootPkg, lockPath: rootLock, lockKey: "", cwd: brandRoot, rel: "." },
  ];
  if (monorepo) {
    targets.push({
      pkgPath: path.join(brandRoot, "server/package.json"),
      lockPath: rootLock,
      lockKey: "server",
      cwd: brandRoot, // regen workspace à la racine (jamais de lock server/)
      rel: "server",
    });
  }
  for (const sub of ["server/ui", "client"]) {
    const dir = path.join(brandRoot, sub);
    if (!fs.existsSync(path.join(dir, "package.json"))) continue;
    targets.push({
      pkgPath: path.join(dir, "package.json"),
      lockPath: path.join(dir, "package-lock.json"),
      lockKey: "",
      cwd: dir,
      rel: sub,
    });
  }
  return targets;
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
  const refreshed: string[] = [];
  for (const target of collectTargets(brandRoot)) {
    if (isPackageLockInSync(target.pkgPath, target.lockPath, target.lockKey)) {
      continue;
    }
    log(
      `package-lock manquant/incohérent (${target.rel}) — npm ${mode === "install" ? "install" : "install --package-lock-only"}…`,
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
      cwd: target.cwd,
      stdio: "inherit",
      env: process.env,
    });
    if (r.status !== 0) {
      throw new Error(
        `npm ${args.join(" ")} exit ${r.status ?? "?"} dans ${target.rel} — ` +
          "lock impossible (deps @creezio/* privées → exporter CREEZIO_NPM_TOKEN)",
      );
    }
    if (!isPackageLockInSync(target.pkgPath, target.lockPath, target.lockKey)) {
      throw new Error(
        `package-lock toujours incohérent après npm dans ${target.rel} (deps package.json ≠ lock)`,
      );
    }
    refreshed.push(target.rel);
  }
  return { refreshed };
}
