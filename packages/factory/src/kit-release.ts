/**
 * Version npm publiée des packages @creezio/* (lockstep — SoT
 * packages/platform-core/package.json du kit courant). Les apps générées
 * consomment `@creezio/<pkg>: ^<version>` (docs/NPM-DISTRIBUTION.md) —
 * plus de `file:vendor/creezio/*`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Racine kit par défaut : packages/factory/{src,dist} → ../../.. */
function defaultKitRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../..");
}

/** Version lockstep publiée (fallback 0.4.0 = bootstrap). */
export function kitPublishedVersion(kitRoot?: string): string {
  const root = path.resolve(
    kitRoot || process.env.CREEZIO_KIT_ROOT || defaultKitRoot(),
  );
  try {
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(root, "packages/platform-core/package.json"),
        "utf8",
      ),
    ) as { version?: string };
    if (typeof pkg.version === "string" && pkg.version) return pkg.version;
  } catch {
    /* kit partiel (tests unitaires) → fallback */
  }
  return "0.4.0";
}

/** Spec npm des deps @creezio/* générées (`^<lockstep>`). */
export function creezioDepSpec(kitRoot?: string): string {
  return `^${kitPublishedVersion(kitRoot)}`;
}

/** Map de deps `@creezio/<name>` → `^<lockstep>` (triées). */
export function creezioNpmDeps(
  names: readonly string[],
  kitRoot?: string,
): Record<string, string> {
  const spec = creezioDepSpec(kitRoot);
  const deps: Record<string, string> = {};
  for (const name of [...names].sort()) {
    deps[`@creezio/${name}`] = spec;
  }
  return deps;
}

const LINK_KIT_TRUTHY = new Set(["1", "true", "yes", "on"]);

/**
 * Mode `--link-kit` / `CREEZIO_LINK_KIT=1` : l'install d'une app fraîche
 * consomme les packages du worktree kit (`file:`) au lieu du registre.
 * Les manifests générés restent `^<lockstep>` (contrat clone autonome).
 */
export function isLinkKitEnabled(explicit?: boolean): boolean {
  if (explicit === true) return true;
  if (explicit === false) return false;
  const raw = (process.env.CREEZIO_LINK_KIT || "").trim().toLowerCase();
  return LINK_KIT_TRUTHY.has(raw);
}

/** Racine kit : option, `CREEZIO_KIT_ROOT`, ou monorepo autour de factory. */
export function resolveKitRoot(kitRoot?: string): string {
  return path.resolve(
    kitRoot || process.env.CREEZIO_KIT_ROOT || defaultKitRoot(),
  );
}

export type CreezioPackageRef = { name: string; dir: string };

/** Packages `@creezio/*` présents sous `<kit>/packages/*`. */
export function listCreezioPackageRefs(kitRoot?: string): CreezioPackageRef[] {
  const packagesDir = path.join(resolveKitRoot(kitRoot), "packages");
  if (!fs.existsSync(packagesDir)) return [];
  const out: CreezioPackageRef[] = [];
  for (const name of fs.readdirSync(packagesDir)) {
    const dir = path.join(packagesDir, name);
    const pj = path.join(dir, "package.json");
    if (!fs.existsSync(pj)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(pj, "utf8")) as { name?: string };
      if (typeof pkg.name === "string" && pkg.name.startsWith("@creezio/")) {
        out.push({ name: pkg.name, dir: path.resolve(dir) });
      }
    } catch {
      /* package.json illisible */
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Specs `file:<abs>` pour chaque package `@creezio/*` du kit. */
export function creezioLinkKitFileSpecs(
  kitRoot?: string,
): Record<string, string> {
  const specs: Record<string, string> = {};
  for (const ref of listCreezioPackageRefs(kitRoot)) {
    specs[ref.name] = `file:${ref.dir}`;
  }
  return specs;
}

/**
 * Contenu des `.npmrc` générés (racine + livrables hors workspace) :
 * registre GitHub Packages pour @creezio/*, token via env — JAMAIS commité.
 */
export function renderCreezioNpmrc(): string {
  return `# Registre npm des packages du kit Creezio (GitHub Packages, org creezio).
# Le token n'est JAMAIS commite : il vient de l'env CREEZIO_NPM_TOKEN
# (PAT scope read:packages - exporte en local, secret CI, secret BuildKit Docker).
@creezio:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${CREEZIO_NPM_TOKEN}
`;
}