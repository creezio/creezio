/**
 * Workflows GitHub CI/CD scaffoldés pour chaque marque Creezio.
 *
 * Contrat flotte (même filet pour TOUTES les apps Creezio — modèle
 * « le kit notifie, l'app rapporte l'impact, le dev décide ») :
 *   - `ci.yml` — anti-régression sur chaque push/PR (GitHub-hosted) :
 *     install lockfile, gate vendor-integrity, build backend, gates
 *     complètes (`npm test`, dont les gates module colocalisées), build UI ;
 *   - `kit-compat.yml` — rapport d'impact kit : sur dispatch
 *     `kit-main-green` (émis par la CI du kit), nightly ou à la demande,
 *     resync ÉPHÉMÈRE du vendor vers le dernier kit (workspace jetable,
 *     JAMAIS de push) + suite complète, puis publication du rapport dans
 *     l'issue unique « 📦 Compatibilité kit — rapport automatique » ;
 *   - `vendor-update.yml` — mise à jour DÉCIDÉE (workflow_dispatch
 *     uniquement) : resync réel + suite complète ; vert → commit
 *     `[vendor-update] kit X → Y` + push main ;
 *   - `deploy.yml` — CD : ne part que sur CI verte de main (workflow_run),
 *     runner self-hosted du serveur de la marque.
 *
 * Hébergement des jobs kit-compat/vendor-update : runner self-hosted du
 * serveur de la marque par défaut ; `githubHosted: true` génère la variante
 * ubuntu-latest (marque sans runner — requiert le secret repo
 * `CREEZIO_CI_TOKEN`, un PAT lisant le kit privé, pour cloner le kit,
 * pousser la mise à jour et publier le rapport).
 *
 * Les tests NATIFS Creezio restent dans le repo kit : la CI de marque ne
 * prouve que le métier (gates colocalisées) et l'intégration (gates
 * transversales + vendor-integrity).
 */

export type BrandWorkflowsOptions = {
  brandId: string;
  /** Labels du runner self-hosted (défaut : [self-hosted, fluxpro]). */
  runnerLabels?: string[];
  /**
   * true → kit-compat/vendor-update tournent sur ubuntu-latest
   * (GitHub-hosted) au lieu du runner self-hosted. Requiert le secret repo
   * CREEZIO_CI_TOKEN (PAT avec accès lecture au kit privé + push marque).
   */
  githubHosted?: boolean;
  /** URL git du kit (défaut : https://github.com/creezio/creezio.git). */
  kitGitUrl?: string;
  /** Clone kit de dev sur la machine runner (accélère le clone CI). */
  kitDevClone?: string;
};

function labels(opts: BrandWorkflowsOptions): string {
  return `[${(opts.runnerLabels ?? ["self-hosted", "fluxpro"]).join(", ")}]`;
}

function runsOn(opts: BrandWorkflowsOptions): string {
  return opts.githubHosted ? "ubuntu-latest" : labels(opts);
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

/** Bloc env GH-hosted : PAT (kit privé + issues + push) et flags CI kit. */
const GITHUB_HOSTED_ENV = `    env:
      # PAT (secret repo CREEZIO_CI_TOKEN) : clone du kit privé, publication
      # du rapport d'issue, push vendor-update (redéclenche la CI, ce que le
      # GITHUB_TOKEN éphémère ne ferait pas).
      # Poser le secret : gh secret set CREEZIO_CI_TOKEN -R <owner/marque>.
      GH_TOKEN: \${{ secrets.CREEZIO_CI_TOKEN }}
      CREEZIO_SKIP_KIT_BINARIES: "1"
      CREEZIO_NATIVE_WARM: "0"
`;

const GITHUB_HOSTED_SETUP = `
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: server/package-lock.json

      - name: Autoriser git à cloner le kit privé (credential helper gh)
        run: gh auth setup-git
`;

export function renderKitCompatWorkflow(opts: BrandWorkflowsOptions): string {
  const gh = opts.githubHosted === true;
  const kitGit = opts.kitGitUrl ?? "https://github.com/creezio/creezio.git";
  return `# Compatibilité kit — ${opts.brandId} teste le DERNIER kit Creezio (resync
# ÉPHÉMÈRE dans un workspace jetable, JAMAIS de push) et publie un rapport
# d'impact dans l'issue unique « 📦 Compatibilité kit — rapport
# automatique » : kit pinné vs dernier kit, commits kit entre les deux,
# packages vendorisés touchés, résultat ✅/❌ de la suite complète.
# La mise à jour réelle reste un geste explicite : workflow vendor-update.
# Un run rouge = échec d'infrastructure uniquement ; une incompatibilité
# kit est rapportée ❌ dans l'issue et le run reste vert (le rapport EST le
# signal — un rouge permanent serait illisible).
name: Kit compat

on:
  repository_dispatch:
    types: [kit-main-green]
  schedule:
    - cron: "17 3 * * *"
  workflow_dispatch:

concurrency:
  group: kit-compat
  cancel-in-progress: false

permissions:
  contents: read
  issues: write

jobs:
  compat:
    runs-on: ${runsOn(opts)}
    timeout-minutes: 90
${gh ? GITHUB_HOSTED_ENV : ""}    steps:
      - uses: actions/checkout@v4
${gh ? GITHUB_HOSTED_SETUP : ""}
      - name: Compat kit + rapport d'impact (jamais de push)
        run: bash scripts/ci/kit-compat.sh
        env:
          CREEZIO_KIT_GIT: ${kitGit}
${gh ? "" : `          CREEZIO_KIT_DEV_CLONE: ${opts.kitDevClone ?? "/home/fidus/creezio"}\n`}`;
}

export function renderVendorUpdateWorkflow(
  opts: BrandWorkflowsOptions,
): string {
  const gh = opts.githubHosted === true;
  const kitGit = opts.kitGitUrl ?? "https://github.com/creezio/creezio.git";
  return `# Mise à jour vendor — geste EXPLICITE du développeur (workflow_dispatch
# uniquement, input kit_sha optionnel). Resync RÉEL du vendor vers le kit
# cible + suite complète de la marque ; vert → commit
# "[vendor-update] kit X → Y" + push main (la CI de la marque suit).
# Déjà à jour → run vert sans commit. L'impact d'une mise à jour se lit
# AVANT dans l'issue « 📦 Compatibilité kit » (workflow kit-compat).
name: Vendor update

on:
  workflow_dispatch:
    inputs:
      kit_sha:
        description: "SHA kit cible (défaut : origin/main)"
        required: false

concurrency:
  group: vendor-update
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  update:
    runs-on: ${runsOn(opts)}
    timeout-minutes: 90
${gh ? GITHUB_HOSTED_ENV : ""}    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          # Push via le credential helper gh (token utilisateur/PAT), pas le
          # GITHUB_TOKEN éphémère : un push GITHUB_TOKEN ne redéclencherait
          # ni la CI ni le deploy en aval.
          persist-credentials: false
${gh ? GITHUB_HOSTED_SETUP : ""}
      - name: Resync réel + suite complète + push si vert
        run: bash scripts/ci/vendor-update.sh
        env:
          CREEZIO_KIT_SHA: \${{ inputs.kit_sha }}
          CREEZIO_KIT_GIT: ${kitGit}
${gh ? "" : `          CREEZIO_KIT_DEV_CLONE: ${opts.kitDevClone ?? "/home/fidus/creezio"}\n`}`;
}

export function renderBrandDeployWorkflow(
  opts: BrandWorkflowsOptions,
): string {
  return `# CD ${opts.brandId} — ne part que sur CI verte de main (workflow_run).
# À adapter à l'infra de la marque (server-docker update, healthcheck
# domaine). Requiert le runner self-hosted du SERVEUR DE LA MARQUE (chaque
# app a son serveur + son runner — installer via docs/CONTRIBUTING-BRANDS.md
# du kit).
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

export function renderKitCompatScript(_opts: BrandWorkflowsOptions): string {
  return `#!/usr/bin/env bash
# Compatibilité kit — rapport d'impact SANS push (workflow kit-compat.yml).
# Généré par la factory Creezio (contrat flotte).
#
# Resync ÉPHÉMÈRE du vendor vers le dernier kit dans un workspace JETABLE
# (jamais de commit/push), suite complète de la marque, puis publication du
# rapport dans l'issue unique « 📦 Compatibilité kit — rapport automatique ».
# La mise à jour réelle est un geste explicite : workflow vendor-update.
#
# Codes de sortie : 0 même si la marque est INCOMPATIBLE avec le dernier kit
# (le rapport ❌ EST le signal — un run rouge permanent serait illisible) ;
# ≠ 0 uniquement pour un échec d'infrastructure (clone kit, gh, publication).
set -euo pipefail

BRAND_ROOT="$(pwd)"
export REPORT_TITLE="📦 Compatibilité kit — rapport automatique"
REPO_FLAG=()
[[ -n "\${GITHUB_REPOSITORY:-}" ]] && REPO_FLAG=(-R "\${GITHUB_REPOSITORY}")

# Self-hosted : TMPDIR hors tmpfs (Chrome sature le tmpfs RAM) + cache kit
# persistant namespacé par marque (plusieurs runners partagent $HOME).
# GitHub-hosted : machine jetable — RUNNER_TEMP suffit, clone kit frais.
if [[ "\${RUNNER_ENVIRONMENT:-self-hosted}" == "github-hosted" ]]; then
  KIT_CI_CLONE="\${KIT_CI_CLONE:-\${RUNNER_TEMP:-/tmp}/creezio-kit}"
else
  export TMPDIR="\${TMPDIR:-$HOME/actions-runners/tmp}"
  mkdir -p "\${TMPDIR}"
  CACHE_SLUG="\${GITHUB_REPOSITORY:-}"; CACHE_SLUG="\${CACHE_SLUG##*/}"
  CACHE_SLUG="\${CACHE_SLUG:-$(basename "\${BRAND_ROOT}")}"
  KIT_CI_CLONE="\${KIT_CI_CLONE:-$HOME/.cache/creezio-ci/kit-\${CACHE_SLUG}}"
fi
KIT_GIT="\${CREEZIO_KIT_GIT:-https://github.com/creezio/creezio.git}"
KIT_DEV_CLONE="\${CREEZIO_KIT_DEV_CLONE:-}"

# ── Garde anti-dérive : vendor/ doit être vierge. Un patch local du vendor
# est INTERDIT (écrasé au resync) : reproduire dans un test kit puis PR sur
# creezio/creezio (docs/CONTRIBUTING-BRANDS.md du kit).
if [[ -n "$(git -C "\${BRAND_ROOT}" status --porcelain -- vendor/)" ]]; then
  echo "✗ dérive locale détectée sous vendor/ — patch vendor interdit :" >&2
  git -C "\${BRAND_ROOT}" status --porcelain -- vendor/ >&2
  echo "  → reproduire dans un test kit puis PR sur creezio/creezio" >&2
  exit 1
fi

# ── 1. Clone CI du kit à jour ────────────────────────────────────────────
if [[ ! -d "\${KIT_CI_CLONE}/.git" ]]; then
  mkdir -p "$(dirname "\${KIT_CI_CLONE}")"
  if [[ -n "\${KIT_DEV_CLONE}" && -d "\${KIT_DEV_CLONE}/.git" ]]; then
    git clone --reference-if-able "\${KIT_DEV_CLONE}" "\${KIT_GIT}" "\${KIT_CI_CLONE}"
  else
    git clone "\${KIT_GIT}" "\${KIT_CI_CLONE}"
  fi
fi
git -C "\${KIT_CI_CLONE}" fetch origin main --tags
git -C "\${KIT_CI_CLONE}" checkout --detach --force origin/main
git -C "\${KIT_CI_CLONE}" clean -fdx --exclude node_modules >/dev/null

export LATEST_SHA="$(git -C "\${KIT_CI_CLONE}" rev-parse --short=7 origin/main)"
export LATEST_DATE="$(git -C "\${KIT_CI_CLONE}" log -1 --format=%cs origin/main)"
export CURRENT_SHA="$(node -e 'process.stdout.write(String(require("./vendor/creezio/SYNC.json").kitSha||"").slice(0,7))')"
export CURRENT_DATE="$(git -C "\${KIT_CI_CLONE}" log -1 --format=%cs "\${CURRENT_SHA}" 2>/dev/null || echo "inconnue")"
echo "▸ kit origin/main = \${LATEST_SHA} (\${LATEST_DATE}) ; vendor pinné = \${CURRENT_SHA} (\${CURRENT_DATE})"

# ── 2. Impact : commits kit pin..latest + packages vendorisés touchés ────
export COMMITS="(historique indisponible : pin \${CURRENT_SHA} absent du clone kit)"
export CHANGED_VENDORED="(indéterminé — pin absent du clone kit)"
if git -C "\${KIT_CI_CLONE}" cat-file -e "\${CURRENT_SHA}^{commit}" 2>/dev/null; then
  RANGE="\${CURRENT_SHA}..origin/main"
  # ⚠️ = breaking potentiel : feat!/fix! (Conventional) ou commit touchant
  # ARCHITECTURE_VERSION (packages/platform-core/src/architecture-version.ts).
  ARCH_BUMP_SHAS=" $(git -C "\${KIT_CI_CLONE}" log --format=%h "\${RANGE}" \\
    -- packages/platform-core/src/architecture-version.ts | tr '\\n' ' ') "
  BREAKING_RE='^(feat|fix)(\\([^)]*\\))?!:'
  COMMITS="$(git -C "\${KIT_CI_CLONE}" log --format='%h %s' "\${RANGE}" | head -100 | \\
    while IFS= read -r line; do
      sha="\${line%% *}"; subject="\${line#* }"; mark="   "
      if [[ "\${ARCH_BUMP_SHAS}" == *" \${sha} "* ]] || \\
         [[ "\${subject}" =~ \${BREAKING_RE} ]]; then mark="⚠️ "; fi
      printf '%s%s\\n' "\${mark}" "\${line}"
    done)"
  # Intersection packages kit modifiés ↔ set vendorisé de la marque.
  export CHANGED_DIRS="$(git -C "\${KIT_CI_CLONE}" diff --name-only "\${RANGE}" -- packages/ | \\
    cut -d/ -f2 | sort -u)"
  CHANGED_VENDORED="$(node -e '
    const vendored = new Set(require("./vendor/creezio/SYNC.json").packages);
    const changed = (process.env.CHANGED_DIRS || "").split("\\n").filter(Boolean);
    const hit = changed.filter((p) => vendored.has(p));
    const miss = changed.length - hit.length;
    let out = hit.length
      ? hit.map((p) => "- \\x60" + p + "\\x60").join("\\n")
      : "_aucun package vendorisé par la marque n'\\''est modifié_";
    if (miss > 0) out += "\\n\\n_+ " + miss + " package(s) kit modifié(s) hors du set vendorisé_";
    process.stdout.write(out);
  ' 2>/dev/null || echo "(indéterminé)")"
fi
export RUN_URL="\${GITHUB_SERVER_URL:-https://github.com}/\${GITHUB_REPOSITORY:-}/actions/runs/\${GITHUB_RUN_ID:-}"
[[ -n "\${GITHUB_RUN_ID:-}" ]] || RUN_URL=""

# ── 3. À jour → rapport direct ; en retard → resync éphémère + suite ─────
export REPORT_STATUS FAILED_STEP="" FAIL_TAIL=""
if [[ "\${LATEST_SHA}" == "\${CURRENT_SHA}" ]]; then
  REPORT_STATUS="uptodate"
  echo "✓ vendor à jour avec le dernier kit — rapport « à jour »"
else
  WORK="$(mktemp -d "\${TMPDIR:-/tmp}/kit-compat.XXXXXX")"
  LOG="\${WORK}/suite.log"
  trap 'cd /; rm -rf "\${WORK}"' EXIT
  COMPAT_OK=1

  try() { # try "<gate>" cmd… — s'arrête au premier échec SANS tuer le run
    local name="$1"; shift
    [[ "\${COMPAT_OK}" -eq 1 ]] || return 0
    echo "──▸ \${name}"
    if "$@" >>"\${LOG}" 2>&1; then return 0; fi
    COMPAT_OK=0
    FAILED_STEP="\${name}"
    echo "✗ gate en échec : \${name} — 30 dernières lignes :"
    tail -n 30 "\${LOG}" || true
  }

  echo "▸ resync éphémère + suite complète contre kit \${LATEST_SHA} (workspace jetable, jamais de push)"
  git clone --quiet "\${BRAND_ROOT}" "\${WORK}/brand"
  cd "\${WORK}/brand"

  try "install kit (npm ci)" env -C "\${KIT_CI_CLONE}" npm ci --no-audit --no-fund
  try "resync vendor (sync-creezio-vendor.sh)" \\
    env CREEZIO_KIT_ROOT="\${KIT_CI_CLONE}" ROOT="\${WORK}/brand" \\
    bash "\${KIT_CI_CLONE}/scripts/sync-creezio-vendor.sh"
  try "install serveur" npm run install:server-deps
  try "install UI" npm install --prefix server/ui --no-audit --no-fund
  try "build backend" npm run build:runtime --prefix server
  try "gate vendor-integrity" node server/scripts/test-vendor-integrity.mjs
  try "gates complètes (npm test)" \\
    env AUTH_DISABLED=1 CREEZIO_NATIVE_WARM=0 CREEZIO_ROOT="\${WORK}/brand" \\
    npm test --prefix server
  try "build UI" npm run build:ui --prefix server

  [[ "\${COMPAT_OK}" -eq 1 ]] && REPORT_STATUS="ok" || REPORT_STATUS="fail"
  [[ -f "\${LOG}" ]] && FAIL_TAIL="$(tail -n 30 "\${LOG}")"
  cd "\${BRAND_ROOT}"
fi

# ── 4. Publication du rapport (issue unique, retrouvée par titre) ────────
BODY_FILE="$(mktemp)"
node -e '
  const e = process.env;
  const B = "\\x60"; // backtick
  const L = [];
  L.push("_Rapport automatique du workflow **kit-compat** — mis à jour le " +
    new Date().toISOString() + (e.RUN_URL ? " · [run](" + e.RUN_URL + ")" : "") + "_", "");
  L.push("| | SHA | Date |", "|---|---|---|");
  L.push("| Kit pinné (vendor) | " + B + e.CURRENT_SHA + B + " | " + e.CURRENT_DATE + " |");
  L.push("| Kit main (dernier) | " + B + e.LATEST_SHA + B + " | " + e.LATEST_DATE + " |", "");
  if (e.REPORT_STATUS === "uptodate") {
    L.push("## ✅ À jour", "", "Le vendor est déjà pinné sur le dernier kit — aucune action requise.");
  } else if (e.REPORT_STATUS === "ok") {
    L.push("## ✅ Compatible — mise à jour sûre", "",
      "Suite complète de la marque VERTE contre le kit " + B + e.LATEST_SHA + B +
      " (resync éphémère — rien n'\\''a été poussé).");
  } else {
    L.push("## ❌ Incompatible avec le dernier kit", "",
      "Gate en échec : **" + e.FAILED_STEP + "** (resync éphémère contre " +
      B + e.LATEST_SHA + B + " — rien n'\\''a été poussé).");
  }
  if (e.REPORT_STATUS !== "uptodate") {
    L.push("", "### Commits kit " + B + e.CURRENT_SHA + ".." + e.LATEST_SHA + B, "",
      B + B + B + "text", e.COMMITS || "(aucun)", B + B + B, "",
      "_⚠️ = breaking potentiel (feat!/fix! ou bump ARCHITECTURE_VERSION)_");
    L.push("", "### Packages kit modifiés vs set vendorisé de la marque", "",
      e.CHANGED_VENDORED || "(indéterminé)");
  }
  if (e.REPORT_STATUS === "fail" && e.FAIL_TAIL) {
    L.push("", "### Sortie de la gate en échec (30 dernières lignes)", "",
      B + B + B + "text", e.FAIL_TAIL, B + B + B);
  }
  L.push("", "---", "",
    "**Pour mettre à jour** : lancer le workflow **vendor-update** " +
    "(Actions → Vendor update → Run workflow — input " + B + "kit_sha" + B +
    " optionnel, défaut " + B + "origin/main" + B + ").");
  process.stdout.write(L.join("\\n") + "\\n");
' > "\${BODY_FILE}"

ISSUE_NUM="$(gh issue list "\${REPO_FLAG[@]}" --state open --limit 100 --json number,title \\
  --jq '.[] | select(.title == env.REPORT_TITLE) | .number' | head -n1)"
if [[ -z "\${ISSUE_NUM}" ]]; then
  ISSUE_URL="$(gh issue create "\${REPO_FLAG[@]}" --title "\${REPORT_TITLE}" --body-file "\${BODY_FILE}")"
  ISSUE_NUM="\${ISSUE_URL##*/}"
  # Épingler l'issue (best-effort — le rapport reste utilisable sans).
  if [[ -n "\${GITHUB_REPOSITORY:-}" ]]; then
    NODE_ID="$(gh api "repos/\${GITHUB_REPOSITORY}/issues/\${ISSUE_NUM}" --jq .node_id 2>/dev/null || true)"
    if [[ -n "\${NODE_ID}" ]]; then
      gh api graphql \\
        -f query='mutation($id:ID!){pinIssue(input:{issueId:$id}){issue{number}}}' \\
        -f id="\${NODE_ID}" >/dev/null 2>&1 || true
    fi
  fi
else
  gh issue edit "\${ISSUE_NUM}" "\${REPO_FLAG[@]}" --body-file "\${BODY_FILE}"
fi
rm -f "\${BODY_FILE}"
echo "✓ rapport publié : issue #\${ISSUE_NUM} « \${REPORT_TITLE} »"

if [[ "\${REPORT_STATUS}" == "fail" ]]; then
  echo "✗ marque incompatible avec le kit \${LATEST_SHA} — rapport ❌ publié (run vert : le rapport est le signal)"
else
  echo "✓ compat kit \${LATEST_SHA} : \${REPORT_STATUS}"
fi
exit 0
`;
}

export function renderVendorUpdateScript(
  _opts: BrandWorkflowsOptions,
): string {
  return `#!/usr/bin/env bash
# Mise à jour vendor — geste EXPLICITE du développeur (workflow
# vendor-update.yml, workflow_dispatch uniquement). Généré par la factory
# Creezio (contrat flotte).
#
# Resync RÉEL du vendor vers le kit cible (CREEZIO_KIT_SHA, défaut
# origin/main) + suite complète de la marque ; vert → commit
# "[vendor-update] kit X → Y" + push main (la CI de la marque suit).
# Déjà à jour → sortie propre sans commit vide. Échec suite → run ROUGE
# (geste explicite : l'échec doit être bruyant, contrairement à kit-compat).
set -euo pipefail

BRAND_ROOT="$(pwd)"

# Self-hosted : TMPDIR hors tmpfs + cache kit persistant namespacé par
# marque. GitHub-hosted : machine jetable — RUNNER_TEMP, clone kit frais.
if [[ "\${RUNNER_ENVIRONMENT:-self-hosted}" == "github-hosted" ]]; then
  KIT_CI_CLONE="\${KIT_CI_CLONE:-\${RUNNER_TEMP:-/tmp}/creezio-kit}"
else
  export TMPDIR="\${TMPDIR:-$HOME/actions-runners/tmp}"
  mkdir -p "\${TMPDIR}"
  CACHE_SLUG="\${GITHUB_REPOSITORY:-}"; CACHE_SLUG="\${CACHE_SLUG##*/}"
  CACHE_SLUG="\${CACHE_SLUG:-$(basename "\${BRAND_ROOT}")}"
  KIT_CI_CLONE="\${KIT_CI_CLONE:-$HOME/.cache/creezio-ci/kit-\${CACHE_SLUG}}"
fi
KIT_GIT="\${CREEZIO_KIT_GIT:-https://github.com/creezio/creezio.git}"
KIT_DEV_CLONE="\${CREEZIO_KIT_DEV_CLONE:-}"

# ── Garde anti-dérive : vendor/ doit être vierge (patch vendor interdit —
# reproduire dans un test kit puis PR sur creezio/creezio). ─────────────────
if [[ -n "$(git -C "\${BRAND_ROOT}" status --porcelain -- vendor/)" ]]; then
  echo "✗ dérive locale détectée sous vendor/ — patch vendor interdit :" >&2
  git -C "\${BRAND_ROOT}" status --porcelain -- vendor/ >&2
  echo "  → reproduire dans un test kit puis PR sur creezio/creezio" >&2
  exit 1
fi

# ── 1. Clone CI du kit + checkout du kit cible ───────────────────────────
if [[ ! -d "\${KIT_CI_CLONE}/.git" ]]; then
  mkdir -p "$(dirname "\${KIT_CI_CLONE}")"
  if [[ -n "\${KIT_DEV_CLONE}" && -d "\${KIT_DEV_CLONE}/.git" ]]; then
    git clone --reference-if-able "\${KIT_DEV_CLONE}" "\${KIT_GIT}" "\${KIT_CI_CLONE}"
  else
    git clone "\${KIT_GIT}" "\${KIT_CI_CLONE}"
  fi
fi
git -C "\${KIT_CI_CLONE}" fetch origin main --tags
TARGET_REF="\${CREEZIO_KIT_SHA:-origin/main}"
git -C "\${KIT_CI_CLONE}" checkout --detach --force "\${TARGET_REF}"
git -C "\${KIT_CI_CLONE}" clean -fdx --exclude node_modules >/dev/null

TARGET_SHA="$(git -C "\${KIT_CI_CLONE}" rev-parse --short=7 HEAD)"
CURRENT_SHA="$(node -e 'process.stdout.write(String(require("./vendor/creezio/SYNC.json").kitSha||"").slice(0,7))')"

echo "▸ kit cible = \${TARGET_SHA} (\${TARGET_REF}) ; vendor pinné = \${CURRENT_SHA}"
if [[ "\${TARGET_SHA}" == "\${CURRENT_SHA}" ]]; then
  echo "✓ vendor déjà pinné sur le kit \${TARGET_SHA} — rien à faire"
  exit 0
fi

# ── 2. Resync réel du vendor dans CE checkout marque ─────────────────────
echo "▸ resync vendor \${CURRENT_SHA} → \${TARGET_SHA} + suite complète"
(cd "\${KIT_CI_CLONE}" && npm ci --no-audit --no-fund)
CREEZIO_KIT_ROOT="\${KIT_CI_CLONE}" ROOT="\${BRAND_ROOT}" \\
  bash "\${KIT_CI_CLONE}/scripts/sync-creezio-vendor.sh"

# ── 3. Marque : réinstall + build + suite complète ───────────────────────
npm run install:server-deps
npm install --prefix server/ui --no-audit --no-fund
npm run build:runtime --prefix server
node server/scripts/test-vendor-integrity.mjs
AUTH_DISABLED=1 CREEZIO_NATIVE_WARM=0 CREEZIO_ROOT="\${BRAND_ROOT}" \\
  npm test --prefix server
npm run build:ui --prefix server

# ── 4. Vert → commit + push de la mise à jour ────────────────────────────
git config user.name "creezio-bot"
git config user.email "creezio@users.noreply.github.com"
git add vendor/ server/package.json server/package-lock.json
if git diff --cached --quiet; then
  echo "✓ resync sans diff (kitSha déjà aligné) — rien à pousser"
  exit 0
fi
git commit -m "[vendor-update] kit \${CURRENT_SHA} → \${TARGET_SHA} (mise à jour décidée — suite complète verte)"
git push origin HEAD:main
echo "✓ vendor-update \${TARGET_SHA} poussé sur main — la CI de la marque suit"
`;
}

/**
 * Gate vendor-integrity — vendor kit pinné COHÉRENT et COMPLET (sans réseau).
 * La fraîcheur vis-à-vis du dernier kit est le rôle de kit-compat.yml.
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
 * AUCUN réseau : la fraîcheur kit = workflow kit-compat.yml.
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
    ".github/workflows/kit-compat.yml": renderKitCompatWorkflow(opts),
    ".github/workflows/vendor-update.yml": renderVendorUpdateWorkflow(opts),
    ".github/workflows/deploy.yml": renderBrandDeployWorkflow(opts),
    "scripts/ci/kit-compat.sh": renderKitCompatScript(opts),
    "scripts/ci/vendor-update.sh": renderVendorUpdateScript(opts),
    "server/scripts/test-vendor-integrity.mjs": renderVendorIntegrityGate(),
  };
}
