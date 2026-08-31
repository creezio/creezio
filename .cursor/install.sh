#!/usr/bin/env bash
# Cloud Agent install — kit Creezio + repos marque sœurs s'ils sont checkoutés.
# Idempotent. Ne démarre aucun serveur. Ne lance pas les tests.
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
if has_npm_token; then
  log "CREEZIO_NPM_TOKEN présent"
else
  log "CREEZIO_NPM_TOKEN absent — kit seulement ; marques au start si le secret est injecté"
fi
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
