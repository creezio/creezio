#!/usr/bin/env bash
# Bootstrap Cloud Agent multi-repos : kit creezio + marques sœurs.
# Idempotent. Doit terminer (pas de serveur). Voir AGENTS.md « Cursor Cloud ».
set -euo pipefail

KIT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$KIT_ROOT"

BRANDS=(foove2 foove2-admin tempoflow3 tempoflow3-admin)

log() { printf '[cloud-agent-install] %s\n' "$*"; }
die() { printf '[cloud-agent-install] ERREUR: %s\n' "$*" >&2; exit 1; }

ensure_opt_docker_link() {
  local name="$1" target="$2"
  local dest="/opt/docker/${name}"
  if [[ -e "$dest" || -L "$dest" ]]; then
    return 0
  fi
  if [[ ! -d /opt/docker ]]; then
    if mkdir -p /opt/docker 2>/dev/null; then
      :
    elif command -v sudo >/dev/null && sudo -n mkdir -p /opt/docker && sudo -n chown "$(id -u)":"$(id -g)" /opt/docker; then
      :
    else
      log "pas de /opt/docker (symlink ${name} ignoré)"
      return 0
    fi
  fi
  if ln -sfn "$target" "$dest" 2>/dev/null; then
    log "symlink ${dest} → ${target}"
  elif command -v sudo >/dev/null && sudo -n ln -sfn "$target" "$dest"; then
    log "symlink ${dest} → ${target} (sudo)"
  else
    log "symlink ${dest} impossible — CREEZIO_KIT_ROOT suffit"
  fi
}

resolve_brand() {
  local name="$1" cand
  for cand in \
    "${KIT_ROOT}/../${name}" \
    "/agent/repos/${name}" \
    "/opt/docker/${name}" \
    "/workspace/${name}" \
    "/workspace/repos/${name}"
  do
    if [[ -f "${cand}/package.json" ]] && {
      [[ -d "${cand}/server" ]] || [[ -d "${cand}/brand-spec" ]] || [[ -d "${cand}/admin-spec" ]]
    }; then
      # ignorer un symlink cassé ou qui pointe vers le kit
      local real
      real="$(cd "$cand" && pwd -P)"
      if [[ "$real" == "$KIT_ROOT" ]]; then
        continue
      fi
      printf '%s\n' "$real"
      return 0
    fi
  done
  return 1
}

log "kit=${KIT_ROOT} node=$(node -v) npm=$(npm -v)"

ensure_opt_docker_link creezio "$KIT_ROOT"
export CREEZIO_KIT_ROOT="${CREEZIO_KIT_ROOT:-$KIT_ROOT}"

found=()
for name in "${BRANDS[@]}"; do
  root="$(resolve_brand "$name" || true)"
  if [[ -n "$root" ]]; then
    found+=("$name|$root")
  fi
done

if ((${#found[@]} > 0)) && [[ -z "${CREEZIO_NPM_TOKEN:-}" ]]; then
  die "CREEZIO_NPM_TOKEN requis pour installer ${#found[@]} marque(s) (@creezio/* sur GitHub Packages, PAT read:packages). Secret à poser sur l'environnement Cloud Agent."
fi

if [[ -f package-lock.json ]]; then
  log "kit npm ci"
  npm ci --no-audit --no-fund
else
  log "kit npm install (pas de lockfile)"
  npm install --no-audit --no-fund
fi

log "kit build:packages"
npm run build:packages

if ((${#found[@]} > 0)); then
  for entry in "${found[@]}"; do
    name="${entry%%|*}"
    root="${entry#*|}"
    log "marque ${name} → ${root}"
    ensure_opt_docker_link "$name" "$root"
    if grep -q '"setup"' "$root/package.json"; then
      (cd "$root" && npm run setup)
    else
      (cd "$root" && npm ci --no-audit --no-fund)
      if [[ -f "$root/server/ui/package.json" ]]; then
        (cd "$root" && npm ci --prefix server/ui --no-audit --no-fund)
      fi
      if [[ -f "$root/client/package.json" ]]; then
        (cd "$root" && npm ci --prefix client --no-audit --no-fund)
      fi
      if grep -q '"build:electron"' "$root/server/package.json" 2>/dev/null; then
        (cd "$root" && npm run build:electron --prefix server)
      fi
    fi
  done
fi

if ((${#found[@]} == 0)); then
  log "aucune marque sœur trouvée — install kit seul"
else
  log "marques installées: ${#found[@]}"
fi

log "ok"
