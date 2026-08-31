#!/usr/bin/env bash
# Cloud Agent install — kit Creezio + repos marque sœurs s'ils sont checkoutés.
# Idempotent. Ne démarre aucun serveur. Ne lance pas les tests.
# Fail-closed : clone sœur présent + CREEZIO_NPM_TOKEN vide = échec.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"
KIT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
export KIT_ROOT

install_kit() {
  log "install kit — $KIT_ROOT"
  npm_ci "$KIT_ROOT"
  log "build:packages"
  (
    cd "$KIT_ROOT"
    npm run build:packages
  )
}

require_node

tf3=""
admin=""
if tf3=$(find_sibling tempoflow3); then
  :
fi
if admin=$(find_sibling tempoflow3-admin); then
  :
fi

if [ -n "$tf3" ] || [ -n "$admin" ]; then
  require_npm_token "tempoflow3 / tempoflow3-admin"
  log "CREEZIO_NPM_TOKEN présent"
fi

install_kit

installed_brands=()
if [ -n "$tf3" ]; then
  install_brand "$tf3" tempoflow3
  installed_brands+=("tempoflow3")
fi
if [ -n "$admin" ]; then
  install_brand "$admin" tempoflow3-admin
  installed_brands+=("tempoflow3-admin")
fi

if [ "${#installed_brands[@]}" -gt 0 ]; then
  log "install OK — kit + ${installed_brands[*]}"
else
  log "install OK — kit (aucun repo marque sœur)"
fi
