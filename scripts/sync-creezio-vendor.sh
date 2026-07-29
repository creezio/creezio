#!/usr/bin/env bash
# Contrat sync vendor @creezio/* → crm/vendor/creezio/ (Phase I0).
#
# Usage (depuis une marque, ou avec DEST/ROOT explicites) :
#   CREEZIO_KIT_ROOT=/opt/docker/creezio \
#   DEST=/opt/docker/tempoflow2/crm/vendor/creezio \
#   bash /opt/docker/creezio/scripts/sync-creezio-vendor.sh
#
# Options env :
#   CREEZIO_KIT_ROOT   — racine kit (défaut /opt/docker/creezio)
#   DEST               — dossier vendor cible (obligatoire sauf si ROOT fourni)
#   ROOT               — racine crm marque ; DEST défaut = $ROOT/vendor/creezio
#   CREEZIO_EXPECT_ARCH_VERSION — assert (défaut H5) ; vide = skip assert
#   CREEZIO_VENDOR_PACKAGES — liste espace-séparée (sinon baseline H5)
#   CREEZIO_SYNC_DRY_RUN=1 — liste + assert seulement, pas de copie
#
# Baseline I3 (socle conso marques) — H5 + auth/assistant/tasks/mails.
set -euo pipefail

KIT="${CREEZIO_KIT_ROOT:-/opt/docker/creezio}"
EXPECT_ARCH="${CREEZIO_EXPECT_ARCH_VERSION-H6}"
DRY_RUN="${CREEZIO_SYNC_DRY_RUN:-0}"

DEFAULT_PACKAGES=(
  brand-config
  shell
  platform-core
  product-hub
  electron-shell
  desktop-tooling
  api-kernel
  mcp-facade
  shell-ui
  auth
  assistant
  tasks
  mails
)

if [[ -n "${CREEZIO_VENDOR_PACKAGES:-}" ]]; then
  # shellcheck disable=SC2206
  PACKAGES=(${CREEZIO_VENDOR_PACKAGES})
else
  PACKAGES=("${DEFAULT_PACKAGES[@]}")
fi

if [[ -n "${DEST:-}" ]]; then
  :
elif [[ -n "${ROOT:-}" ]]; then
  DEST="${ROOT}/vendor/creezio"
else
  echo "ERROR: set DEST=... or ROOT=... (crm root of the brand)" >&2
  exit 1
fi

[[ -d "${KIT}/packages/brand-config" ]] || {
  echo "ERROR: kit introuvable: ${KIT}" >&2
  exit 1
}

read_arch_version() {
  local f="${KIT}/packages/platform-core/src/architecture-version.ts"
  [[ -f "$f" ]] || f="${KIT}/packages/platform-core/dist-cjs/architecture-version.js"
  [[ -f "$f" ]] || {
    echo "ERROR: architecture-version introuvable sous ${KIT}" >&2
    return 1
  }
  node -e '
const fs = require("fs");
const s = fs.readFileSync(process.argv[1], "utf8");
const m = /ARCHITECTURE_VERSION\s*=\s*["'\'']([^"'\'']+)["'\'']/.exec(s);
if (!m) { console.error("ERROR: ARCHITECTURE_VERSION introuvable"); process.exit(1); }
process.stdout.write(m[1]);
' "$f"
}

ARCH="$(read_arch_version)"
echo "▸ kit ARCHITECTURE_VERSION=${ARCH} (expect=${EXPECT_ARCH:-skip})"
if [[ -n "${EXPECT_ARCH}" && "${ARCH}" != "${EXPECT_ARCH}" ]]; then
  echo "ERROR: ARCHITECTURE_VERSION mismatch: got ${ARCH}, expected ${EXPECT_ARCH}" >&2
  exit 1
fi

echo "▸ packages: ${PACKAGES[*]}"
echo "▸ dest: ${DEST}"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "OK dry-run (pas de copie)"
  exit 0
fi

if [[ ! -f "${KIT}/packages/brand-config/dist-cjs/index.js" ]]; then
  echo "▸ build kit packages + CJS…"
  (cd "${KIT}" && npm run build:packages)
fi

# Assert CJS présent pour chaque package
for name in "${PACKAGES[@]}"; do
  src="${KIT}/packages/${name}"
  [[ -d "${src}/dist" && -d "${src}/dist-cjs" ]] || {
    echo "▸ missing dist for ${name} — build:packages…"
    (cd "${KIT}" && npm run build:packages)
    break
  }
done

rm -rf "${DEST}"
mkdir -p "${DEST}"

for name in "${PACKAGES[@]}"; do
  src="${KIT}/packages/${name}"
  out="${DEST}/${name}"
  [[ -d "${src}" ]] || {
    echo "ERROR: package manquant: ${src}" >&2
    exit 1
  }
  echo "▸ vendor ${name}"
  mkdir -p "${out}"
  cp -a "${src}/package.json" "${out}/"
  cp -a "${src}/dist" "${out}/"
  cp -a "${src}/dist-cjs" "${out}/"
  if [[ -d "${src}/scripts" ]]; then
    cp -a "${src}/scripts" "${out}/"
  fi
  if [[ -d "${src}/bin" ]]; then
    cp -a "${src}/bin" "${out}/"
  fi
  if [[ -d "${src}/ui" ]]; then
    cp -a "${src}/ui" "${out}/"
  fi
  node -e '
const fs = require("fs");
const path = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
let changed = false;
for (const field of ["dependencies", "peerDependencies"]) {
  const deps = pkg[field];
  if (!deps) continue;
  for (const [k, v] of Object.entries(deps)) {
    const m = /^@creezio\/(.+)$/.exec(k);
    if (!m) continue;
    deps[k] = "file:../" + m[1];
    changed = true;
  }
}
if (changed) fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
' "${out}/package.json"
done

# Marqueur sync
node -e '
const fs = require("fs");
const path = require("path");
const dest = process.argv[1];
const arch = process.argv[2];
const pkgs = process.argv.slice(3);
const out = {
  syncedAt: new Date().toISOString(),
  architectureVersion: arch,
  packages: pkgs,
};
fs.writeFileSync(path.join(dest, "SYNC.json"), JSON.stringify(out, null, 2) + "\n");
' "${DEST}" "${ARCH}" "${PACKAGES[@]}"

echo "OK vendor → ${DEST}"
du -sh "${DEST}"/*
