#!/usr/bin/env bash
# Cloud Agent install — kit Creezio + repos marque sœurs s'ils sont checkoutés.
# Idempotent. Ne démarre aucun serveur. Ne lance pas les tests.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
KIT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

log() { printf '%s\n' "$*"; }

require_node() {
  node -e '
    const [maj, min] = process.versions.node.split(".").map(Number);
    if (maj < 22 || (maj === 22 && min < 5)) {
      console.error("Node >= 22.5 requis, trouvé " + process.versions.node);
      process.exit(1);
    }
  '
  log "node $(node -p process.versions.node) npm $(npm -v)"
}

npm_ci() {
  local dir=$1
  log "npm ci — $dir"
  (
    cd "$dir"
    npm ci --no-audit --no-fund
  )
}

# Résout un clone sœur (layouts cloud / VPS / workspace).
find_sibling() {
  local name=$1
  local candidates=()
  local dir=$KIT_ROOT
  local i
  for i in 1 2 3; do
    dir=$(dirname "$dir")
    candidates+=("$dir/$name")
  done
  candidates+=(
    "/agent/repos/$name"
    "/opt/docker/$name"
    "/workspace/$name"
    "/workspaces/$name"
  )
  local c resolved
  for c in "${candidates[@]}"; do
    if [ -f "$c/package.json" ]; then
      resolved=$(cd "$c" && pwd)
      if [ "$resolved" != "$KIT_ROOT" ]; then
        printf '%s\n' "$resolved"
        return 0
      fi
    fi
  done
  return 1
}

install_kit() {
  log "install kit — $KIT_ROOT"
  npm_ci "$KIT_ROOT"
  log "build:packages"
  (
    cd "$KIT_ROOT"
    npm run build:packages
  )
}

install_brand() {
  local root=$1
  local label=$2
  log "install $label — $root"
  if [ -z "${CREEZIO_NPM_TOKEN:-}" ]; then
    log "ERREUR: CREEZIO_NPM_TOKEN requis pour $label (GitHub Packages @creezio/*)."
    return 1
  fi
  npm_ci "$root"
  if [ -f "$root/server/ui/package-lock.json" ]; then
    npm_ci "$root/server/ui"
  fi
  if [ -f "$root/client/package-lock.json" ]; then
    npm_ci "$root/client"
  fi
}

require_node
install_kit

installed_brands=()
if tf3=$(find_sibling tempoflow3); then
  install_brand "$tf3" tempoflow3
  installed_brands+=("tempoflow3")
fi
if admin=$(find_sibling tempoflow3-admin); then
  install_brand "$admin" tempoflow3-admin
  installed_brands+=("tempoflow3-admin")
fi

if [ "${#installed_brands[@]}" -gt 0 ]; then
  log "install OK — kit + ${installed_brands[*]}"
else
  log "install OK — kit (aucun repo marque sœur)"
fi
