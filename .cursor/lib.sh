#!/usr/bin/env bash
# Fonctions partagées install/start Cloud Agent. Sourcé, jamais exécuté seul.

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
# KIT_ROOT doit être exporté par l'appelant.
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
      if [ "$resolved" != "$KIT_ROOT" ] && [ "$resolved" != "/opt/docker/$name" ]; then
        printf '%s\n' "$resolved"
        return 0
      fi
    fi
  done
  return 1
}

has_npm_token() {
  [ -n "${CREEZIO_NPM_TOKEN:-}" ]
}

install_brand() {
  local root=$1
  local label=$2
  log "install $label — $root"
  if ! has_npm_token; then
    log "skip $label : CREEZIO_NPM_TOKEN absent (GitHub Packages @creezio/*)."
    return 0
  fi
  npm_ci "$root"
  if [ -f "$root/server/ui/package-lock.json" ]; then
    npm_ci "$root/server/ui"
  fi
  if [ -f "$root/client/package-lock.json" ]; then
    npm_ci "$root/client"
  fi
}

# npm ci marques seulement si le token est là et node_modules absent.
ensure_brand_modules() {
  local root=$1
  local label=$2
  if [ ! -d "$root" ]; then
    return 0
  fi
  if [ -d "$root/node_modules" ]; then
    log "ok $label node_modules"
    return 0
  fi
  install_brand "$root" "$label"
}
