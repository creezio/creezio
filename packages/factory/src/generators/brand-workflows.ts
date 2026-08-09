/**
 * Workflows GitHub CI/CD scaffoldés pour chaque marque Creezio.
 *
 * Contrat flotte (même filet pour TOUTES les apps Creezio) :
 *   - `ci.yml` — anti-régression sur chaque push/PR (GitHub-hosted) :
 *     install lockfile, gate vendor-integrity, build backend, gates
 *     complètes (`npm test`, dont les gates module colocalisées), build UI ;
 *   - `vendor-latest.yml` — fraîcheur kit : à chaque push (+ dispatch
 *     `kit-main-green` émis par la CI du kit + nightly), vérifie que la
 *     marque tourne avec le DERNIER kit ; si le vendor est en retard,
 *     resync + suite complète, et récupère automatiquement la dernière
 *     version (push `[vendor-resync]`) si tout est vert ;
 *   - `deploy.yml` — CD : ne part que sur CI verte de main (workflow_run),
 *     runner self-hosted.
 *
 * Les tests NATIFS Creezio restent dans le repo kit : la CI de marque ne
 * prouve que le métier (gates colocalisées) et l'intégration (gates
 * transversales + vendor-integrity).
 */

export type BrandWorkflowsOptions = {
  brandId: string;
  /** Labels du runner self-hosted (défaut : [self-hosted, fluxpro]). */
  runnerLabels?: string[];
  /** URL git du kit (défaut : https://github.com/creezio/creezio.git). */
  kitGitUrl?: string;
  /** Clone kit de dev sur la machine runner (accélère le clone CI). */
  kitDevClone?: string;
};

function labels(opts: BrandWorkflowsOptions): string {
  return `[${(opts.runnerLabels ?? ["self-hosted", "fluxpro"]).join(", ")}]`;
}

export function renderBrandCiWorkflow(opts: BrandWorkflowsOptions): string {
  return `# CI ${opts.brandId} — anti-régression sur chaque push/PR (contrat flotte
# Creezio : les tests natifs vivent dans le repo kit ; ici, gates métier
# colocalisées + intégration + intégrité du vendor pinné).
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    env:
      AUTH_DISABLED: "1"
      CREEZIO_NATIVE_WARM: "0"
      CREEZIO_ROOT: \${{ github.workspace }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: server/package-lock.json

      - name: Install serveur (lockfile + file:vendor)
        run: npm run install:server-deps

      - name: Install UI
        run: npm install --prefix server/ui

      - name: Gate vendor-integrity
        run: node server/scripts/test-vendor-integrity.mjs

      - name: Build backend
        run: npm run build:runtime --prefix server

      - name: Gates complètes (transversales + modules colocalisés)
        run: npm test --prefix server

      - name: Build front (Next)
        run: npm run build:ui --prefix server
`;
}

export function renderVendorLatestWorkflow(
  opts: BrandWorkflowsOptions,
): string {
  return `# Fraîcheur vendor — ${opts.brandId} doit tourner avec le DERNIER kit
# Creezio (contrat flotte). Vendor en retard → resync + suite complète sur le
# runner ; vert → push automatique [vendor-resync] ; rouge → workflow rouge =
# « marque incompatible avec le dernier kit » (signal, ne bloque pas la CI).
name: Vendor latest

on:
  push:
    branches: [main]
  repository_dispatch:
    types: [kit-main-green]
  schedule:
    - cron: "17 3 * * *"
  workflow_dispatch:

concurrency:
  group: vendor-latest
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  freshness:
    runs-on: ${labels(opts)}
    timeout-minutes: 60
    if: >-
      github.event_name != 'push' ||
      !contains(github.event.head_commit.message, '[vendor-resync]')
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Fraîcheur kit + resync auto si vert
        run: bash scripts/ci/vendor-latest.sh
        env:
          CREEZIO_KIT_GIT: ${opts.kitGitUrl ?? "https://github.com/creezio/creezio.git"}
          CREEZIO_KIT_DEV_CLONE: ${opts.kitDevClone ?? "/home/fidus/creezio"}
`;
}

export function renderBrandDeployWorkflow(
  opts: BrandWorkflowsOptions,
): string {
  return `# CD ${opts.brandId} — ne part que sur CI verte de main (workflow_run).
# À adapter à l'infra de la marque (server-docker update, healthcheck domaine).
name: Deploy

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-${opts.brandId}
  cancel-in-progress: false

jobs:
  deploy:
    if: >-
      github.event_name == 'workflow_dispatch' ||
      github.event.workflow_run.conclusion == 'success'
    runs-on: ${labels(opts)}
    timeout-minutes: 30
    steps:
      - name: Déployer (adapter : server-docker build + update --backup)
        run: |
          echo "::warning::deploy non câblé pour ${opts.brandId} — adapter deploy.yml (voir winhub)"
`;
}

export function renderVendorLatestScript(opts: BrandWorkflowsOptions): string {
  return `#!/usr/bin/env bash
# Fraîcheur vendor kit → resync auto si la marque est verte avec le dernier
# kit (workflow vendor-latest.yml). Générique flotte Creezio — généré par la
# factory. S'exécute sur le runner self-hosted, cwd = checkout de la marque.
set -euo pipefail

# TMPDIR hors du tmpfs /tmp : sur un hôte avec session graphique, Chrome fuit
# des fichiers tmp en RAM et sature le tmpfs, cassant npm ci (ENOENT). Disque.
export TMPDIR="\${TMPDIR:-\$HOME/actions-runners/tmp}"
mkdir -p "\${TMPDIR}"

BRAND_ROOT="$(pwd)"

# ── Garde anti-dérive : vendor/ doit être vierge avant tout resync. Une
# modification locale de vendor/creezio/ est INTERDITE (le resync l'écraserait
# silencieusement) : bug ou évolution kit → test kit + PR creezio/creezio,
# propagation automatique via ce workflow (docs/CONTRIBUTING-BRANDS.md du kit).
if [[ -n "\$(git -C "\${BRAND_ROOT}" status --porcelain -- vendor/)" ]]; then
  echo "✗ dérive locale détectée sous vendor/ — patch vendor interdit :" >&2
  git -C "\${BRAND_ROOT}" status --porcelain -- vendor/ >&2
  echo "  → reproduire dans un test kit puis PR sur creezio/creezio" >&2
  exit 1
fi

# Cache kit namespacé PAR MARQUE : plusieurs runners self-hosted partagent le
# même \$HOME — un clone commun serait détruit en plein build par le
# \`git clean -fdx\` concurrent d'une autre marque (TS2307 en cascade).
CACHE_SLUG="\${GITHUB_REPOSITORY##*/}"
CACHE_SLUG="\${CACHE_SLUG:-\$(basename "\${BRAND_ROOT}")}"
KIT_CI_CLONE="\${KIT_CI_CLONE:-\$HOME/.cache/creezio-ci/kit-\${CACHE_SLUG}}"
KIT_GIT="\${CREEZIO_KIT_GIT:-https://github.com/creezio/creezio.git}"
KIT_DEV_CLONE="\${CREEZIO_KIT_DEV_CLONE:-}"

if [[ ! -d "\${KIT_CI_CLONE}/.git" ]]; then
  mkdir -p "\$(dirname "\${KIT_CI_CLONE}")"
  if [[ -n "\${KIT_DEV_CLONE}" && -d "\${KIT_DEV_CLONE}/.git" ]]; then
    git clone --reference-if-able "\${KIT_DEV_CLONE}" "\${KIT_GIT}" "\${KIT_CI_CLONE}"
  else
    git clone "\${KIT_GIT}" "\${KIT_CI_CLONE}"
  fi
fi
git -C "\${KIT_CI_CLONE}" fetch origin main --tags
git -C "\${KIT_CI_CLONE}" checkout --detach --force origin/main
git -C "\${KIT_CI_CLONE}" clean -fdx --exclude node_modules >/dev/null

LATEST_SHA="\$(git -C "\${KIT_CI_CLONE}" rev-parse --short=7 origin/main)"
CURRENT_SHA="\$(node -e 'process.stdout.write(String(require("./vendor/creezio/SYNC.json").kitSha||"").slice(0,7))')"

echo "▸ kit origin/main = \${LATEST_SHA} ; vendor pinné = \${CURRENT_SHA}"
if [[ "\${LATEST_SHA}" == "\${CURRENT_SHA}" ]]; then
  echo "✓ vendor à jour avec le dernier kit — rien à faire"
  exit 0
fi

echo "▸ vendor en retard — resync + validation complète contre kit \${LATEST_SHA}"
(cd "\${KIT_CI_CLONE}" && npm ci --no-audit --no-fund)
CREEZIO_KIT_ROOT="\${KIT_CI_CLONE}" ROOT="\${BRAND_ROOT}" \\
  bash "\${KIT_CI_CLONE}/scripts/sync-creezio-vendor.sh"

npm run install:server-deps
npm install --prefix server/ui --no-audit --no-fund
npm run build:runtime --prefix server
node server/scripts/test-vendor-integrity.mjs
AUTH_DISABLED=1 CREEZIO_NATIVE_WARM=0 CREEZIO_ROOT="\${BRAND_ROOT}" \\
  npm test --prefix server
npm run build:ui --prefix server

git config user.name "creezio-bot"
git config user.email "creezio@users.noreply.github.com"
git add vendor/ server/package.json server/package-lock.json
if git diff --cached --quiet; then
  echo "✓ resync sans diff — rien à pousser"
  exit 0
fi
git commit -m "[vendor-resync] kit \${CURRENT_SHA} → \${LATEST_SHA} (suite complète verte contre le dernier kit)"
git push origin HEAD:main
echo "✓ vendor resync \${LATEST_SHA} poussé sur main — CI + deploy vont suivre"
`;
}

/**
 * Gate vendor-integrity — vendor kit pinné COHÉRENT et COMPLET (sans réseau).
 * La fraîcheur vis-à-vis du dernier kit est le rôle de vendor-latest.yml.
 */
export function renderVendorIntegrityGate(): string {
  return `#!/usr/bin/env node
/**
 * Gate vendor-integrity — le vendor kit embarqué est cohérent et complet.
 * Générée par la factory Creezio (contrat flotte) :
 *   1. SYNC.json présent, parseable, pinné (kitSha) ;
 *   2. chaque package listé existe avec package.json + dist/ non vide ;
 *   3. deps file:vendor/creezio/* de server/package.json ↔ vendor réels ;
 *   4. symlink server/vendor → ../vendor (layout 2-repos) ;
 *   5. aucun node_modules COMMITTÉ sous vendor/ (vérifié via l'index git —
 *      l'install file: crée des node_modules réels dans les packages
 *      vendorisés, légitimes et non committés ; hors repo git, repli
 *      filesystem limité à la racine des packages).
 * AUCUN réseau : la fraîcheur kit = workflow vendor-latest.yml.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const appRoot = path.resolve(serverRoot, "..");
const vendorRoot = path.join(appRoot, "vendor", "creezio");

const syncPath = path.join(vendorRoot, "SYNC.json");
assert.ok(fs.existsSync(syncPath), "vendor/creezio/SYNC.json manquant");
const sync = JSON.parse(fs.readFileSync(syncPath, "utf8"));
assert.match(
  String(sync.kitSha || ""),
  /^[0-9a-f]{7,40}$/,
  "SYNC.json.kitSha doit être un sha git",
);
assert.ok(
  Array.isArray(sync.packages) && sync.packages.length >= 10,
  "SYNC.json.packages vide ou anormalement court",
);
assert.ok(sync.architectureVersion, "SYNC.json.architectureVersion manquant");

for (const pkg of sync.packages) {
  const dir = path.join(vendorRoot, pkg);
  assert.ok(fs.existsSync(dir), \`package vendorisé manquant: \${pkg}\`);
  assert.ok(
    fs.existsSync(path.join(dir, "package.json")),
    \`package.json manquant: vendor/creezio/\${pkg}\`,
  );
  const dist = path.join(dir, "dist");
  assert.ok(
    fs.existsSync(dist) && fs.readdirSync(dist).length > 0,
    \`dist/ vide ou absent: vendor/creezio/\${pkg} — resync vendor requis\`,
  );
}

const serverPkg = JSON.parse(
  fs.readFileSync(path.join(serverRoot, "package.json"), "utf8"),
);
const fileDeps = Object.entries({
  ...(serverPkg.dependencies || {}),
  ...(serverPkg.devDependencies || {}),
}).filter(([, spec]) => String(spec).startsWith("file:vendor/creezio/"));
assert.ok(fileDeps.length >= 10, "aucune dep file:vendor/creezio détectée");
for (const [name, spec] of fileDeps) {
  const dir = path.join(serverRoot, String(spec).slice("file:".length));
  assert.ok(fs.existsSync(dir), \`dep \${name} → \${spec} : dossier manquant\`);
  const vendored = JSON.parse(
    fs.readFileSync(path.join(dir, "package.json"), "utf8"),
  );
  assert.equal(vendored.name, name, \`dep \${name} ≠ \${vendored.name}\`);
}

assert.ok(
  fs.existsSync(path.join(serverRoot, "vendor", "creezio", "SYNC.json")),
  "server/vendor/creezio inaccessible (symlink ../vendor absent ?)",
);

// Garde anti-pollution : aucun node_modules COMMITTÉ sous vendor/. On
// interroge l'index git (pas le filesystem) : \`npm ci\` crée légitimement
// des node_modules DANS les packages vendorisés file: pendant l'install —
// ceux-là ne sont pas committés et ne doivent pas faire échouer la gate.
import { execFileSync } from "node:child_process";
let committed = [];
try {
  committed = execFileSync("git", ["ls-files", "vendor/creezio"], {
    cwd: appRoot,
    encoding: "utf8",
  })
    .split("\\n")
    .filter((f) => f.includes("node_modules"));
} catch {
  // Hors repo git (archive) : repli filesystem, racine des packages seule.
  for (const pkg of sync.packages) {
    assert.ok(
      !fs.existsSync(path.join(vendorRoot, pkg, "node_modules")),
      \`node_modules à la racine de vendor/creezio/\${pkg} — resync sale\`,
    );
  }
}
assert.equal(
  committed.length,
  0,
  \`node_modules committés sous vendor/ :\\n  \${committed.slice(0, 10).join("\\n  ")}\`,
);

console.log(
  \`OK test-vendor-integrity — kit \${sync.kitSha} (\${sync.architectureVersion}), \` +
    \`\${sync.packages.length} packages vendorisés, \${fileDeps.length} deps file: cohérentes\`,
);
`;
}

/** Les fichiers CI/CD d'une marque : chemin relatif racine → contenu. */
export function renderBrandWorkflowFiles(
  opts: BrandWorkflowsOptions,
): Record<string, string> {
  return {
    ".github/workflows/ci.yml": renderBrandCiWorkflow(opts),
    ".github/workflows/vendor-latest.yml": renderVendorLatestWorkflow(opts),
    ".github/workflows/deploy.yml": renderBrandDeployWorkflow(opts),
    "scripts/ci/vendor-latest.sh": renderVendorLatestScript(opts),
    "server/scripts/test-vendor-integrity.mjs": renderVendorIntegrityGate(),
  };
}
