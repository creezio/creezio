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

/**
 * Clôture @creezio serveur (deps directes npm publiées) — SoT unique pour
 * `scaffold.ts` et `scaffold-from-prd.ts`. Toute page OS qui importe un
 * `@creezio/*` côté serveur (granola, grokbot, nav, …) doit figurer ici
 * — une liste parallèle dans --from-prd a déjà fait rater la gate
 * os-ui-scaffold (PR #154/#166).
 */
export const SERVER_CREEZIO_DEPS = [
  "api-kernel",
  "app-runtime",
  "assistant",
  "auth",
  "brand-config",
  "brand-spec",
  "browser-host",
  "cockpit",
  "database",
  "desktop-tooling",
  "host-runtime",
  "granola",
  "grokbot",
  "integrations",
  "interactive-demo",
  "mails",
  "mcp-facade",
  "nav",
  "observability",
  "onboarding",
  "os-ui",
  "platform-core",
  "product-hub",
  "search",
  "shell",
  "shell-ui",
  "support",
  "tasks",
] as const;

/** Clôture @creezio requise par le client thin (startBrandDesktop remote-only). */
export const CLIENT_CREEZIO_DEPS = [
  "api-kernel",
  "app-runtime",
  "assistant",
  "auth",
  "brand-config",
  "brand-spec",
  "browser-host",
  "cockpit",
  "database",
  "desktop-tooling",
  "electron-shell",
  "granola",
  "grokbot",
  "integrations",
  "mails",
  "mcp-facade",
  "nav",
  "observability",
  "onboarding",
  "os-ui",
  "platform-core",
  "product-hub",
  "shell",
  "shell-ui",
  "support",
  "tasks",
] as const;

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