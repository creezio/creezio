#!/usr/bin/env bash
# Per-boot : chemins /opt/docker/<nom> + npm ci marques si token et modules absents.
# Idempotent. Ne démarre aucun serveur.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"
KIT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
export KIT_ROOT

ensure_docker_root() {
  if [ ! -d /opt/docker ]; then
    sudo -n mkdir -p /opt/docker
  fi
  if [ ! -w /opt/docker ]; then
    sudo -n chown "$(id -u):$(id -g)" /opt/docker
  fi
}

ensure_link() {
  local dest=$1
  local src=$2
  if [ ! -e "$src" ]; then
    return 0
  fi
  local resolved
  resolved=$(cd "$src" && pwd)
  if [ -L "$dest" ] || [ -e "$dest" ]; then
    if [ "$(readlink -f "$dest" 2>/dev/null || true)" = "$resolved" ]; then
      log "ok $dest -> $resolved"
      return 0
    fi
    if [ -L "$dest" ]; then
      rm -f "$dest"
    elif [ -e "$dest" ]; then
      log "skip $dest (existe, pas un symlink)"
      return 0
    fi
  fi
  ln -sfn "$resolved" "$dest"
  log "link $dest -> $resolved"
}

ensure_docker_root
ensure_link /opt/docker/creezio "$KIT_ROOT"

if tf3=$(find_sibling tempoflow3); then
  ensure_link /opt/docker/tempoflow3 "$tf3"
  ensure_brand_modules "$tf3" tempoflow3
fi
if admin=$(find_sibling tempoflow3-admin); then
  ensure_link /opt/docker/tempoflow3-admin "$admin"
  ensure_brand_modules "$admin" tempoflow3-admin
fi

log "start OK"
