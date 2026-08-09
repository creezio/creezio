#!/usr/bin/env bash
# brand-matrix — le kit au SHA testé fait-il tourner chaque marque de la
# flotte ? (job `brand-matrix` de .github/workflows/ci.yml, registre
# docs/brands.json). Lancé sur le runner self-hosted du kit AVANT
# notify-brands : un kit qui casse une marque ne lui est jamais annoncé.
#
# Usage : bash scripts/ci/brand-matrix-check.sh <marque>   (ex. winhub)
#
# Contrat :
#   - clone CI dédié ~/.cache/creezio-ci/matrix-<marque> (jamais le clone de
#     dev), checkout origin/main, nettoyé à chaque run ;
#   - sync vendor DEPUIS LE KIT COURANT (checkout du workflow, pas origin/main
#     du kit) puis suite complète marque ;
#   - JAMAIS de push : validation pure, le resync réel reste le rôle du
#     workflow Vendor latest de chaque marque.
set -euo pipefail

BRAND="${1:?usage: brand-matrix-check.sh <marque> (ex. winhub)}"

# TMPDIR hors du tmpfs /tmp (même garde que vendor-latest.sh des marques).
export TMPDIR="${TMPDIR:-$HOME/actions-runners/tmp}"
mkdir -p "${TMPDIR}"

KIT_ROOT="${CREEZIO_KIT_ROOT:-${GITHUB_WORKSPACE:-$(pwd)}}"
BRAND_GIT="${CREEZIO_BRAND_GIT:-https://github.com/creezio/${BRAND}.git}"
BRAND_CLONE="${CREEZIO_MATRIX_CLONE:-$HOME/.cache/creezio-ci/matrix-${BRAND}}"

echo "▸ brand-matrix ${BRAND} : kit=$(git -C "${KIT_ROOT}" rev-parse --short=7 HEAD) clone=${BRAND_CLONE}"

# ── 1. Clone CI de la marque au tip main ─────────────────────────────────
if [[ ! -d "${BRAND_CLONE}/.git" ]]; then
  mkdir -p "$(dirname "${BRAND_CLONE}")"
  git clone "${BRAND_GIT}" "${BRAND_CLONE}"
fi
git -C "${BRAND_CLONE}" fetch origin main
git -C "${BRAND_CLONE}" checkout --detach --force origin/main
git -C "${BRAND_CLONE}" clean -fdx --exclude node_modules --exclude server/ui/node_modules >/dev/null

# ── 2. Sync vendor depuis le kit au SHA testé ────────────────────────────
CREEZIO_KIT_ROOT="${KIT_ROOT}" ROOT="${BRAND_CLONE}" \
  bash "${KIT_ROOT}/scripts/sync-creezio-vendor.sh"

# ── 3. Suite complète marque contre ce kit ───────────────────────────────
cd "${BRAND_CLONE}"
npm run install:server-deps
npm install --prefix server/ui --no-audit --no-fund
npm run build:runtime --prefix server
node server/scripts/test-vendor-integrity.mjs
AUTH_DISABLED=1 CREEZIO_NATIVE_WARM=0 CREEZIO_ROOT="${BRAND_CLONE}" \
  npm test --prefix server

echo "✓ brand-matrix ${BRAND} verte contre le kit $(git -C "${KIT_ROOT}" rev-parse --short=7 HEAD)"
