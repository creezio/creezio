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
  os-ui
  shell-ui
  onboarding
  cockpit
  auth
  assistant
  tasks
  mails
  observability
  browser-host
  automations
  database
  brand-spec
  app-runtime
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

# Assert dist présent ; dist-cjs optionnel (packages ESM-only : brand-spec, app-runtime)
for name in "${PACKAGES[@]}"; do
  src="${KIT}/packages/${name}"
  [[ -d "${src}/dist" ]] || {
    echo "▸ missing dist for ${name} — build:packages…"
    (cd "${KIT}" && npm run build:packages)
    break
  }
done

# Garde anti-wipe (O11 hotfix) : pin kitSha SANS build:packages réel = INTERDIT.
# Un dist/ vide ou stale (create* undefined) ne doit jamais écraser le vendor marque.
node -e '
const path = require("path");
const kit = process.argv[1];
const checks = [
  ["auth", "createAuthRoutes"],
  ["assistant", "createAssistantRoutes"],
  ["mails", "createEmailInboxRoutes"],
  ["tasks", "createTasksHonoRoutes"],
  ["product-hub", "createPluginProductsRoutes"],
  ["api-kernel", "mountApiKernelOnHono"],
  ["mcp-facade", "createMcpOAuthRoutes"],
];
let fail = 0;
for (const [pkg, sym] of checks) {
  const file = path.join(kit, "packages", pkg, "dist-cjs/index.js");
  try {
    const mod = require(file);
    if (typeof mod[sym] !== "function") {
      console.error("ERROR: kit dist stale — " + pkg + "." + sym + " is " + typeof mod[sym]);
      console.error("       Run: cd " + kit + " && npm run build:packages");
      console.error("       Pin kitSha sans artefacts dist réels = INTERDIT.");
      fail++;
    }
  } catch (e) {
    console.error("ERROR: kit dist unloadable — " + pkg + ": " + e.message);
    console.error("       Run: cd " + kit + " && npm run build:packages");
    fail++;
  }
}
if (fail) process.exit(1);
console.log("▸ kit dist symbols OK (create*/mount*/oauth)");
' "${KIT}"

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
  if [[ -d "${src}/dist-cjs" ]]; then
    cp -a "${src}/dist-cjs" "${out}/"
  else
    echo "  (ESM-only — pas de dist-cjs)"
  fi
  if [[ -d "${src}/scripts" ]]; then
    cp -a "${src}/scripts" "${out}/"
  fi
  if [[ -d "${src}/bin" ]]; then
    cp -a "${src}/bin" "${out}/"
  fi
  if [[ -d "${src}/ui" ]]; then
    cp -a "${src}/ui" "${out}/"
  fi
  # @creezio/os-ui uniquement : pages Next + boot client (hors git marque)
  if [[ "${name}" == "os-ui" ]]; then
    if [[ -d "${src}/routes" ]]; then
      cp -a "${src}/routes" "${out}/"
    fi
    if [[ -d "${src}/src" ]]; then
      cp -a "${src}/src" "${out}/"
    fi
  fi
  if [[ -d "${src}/templates" ]]; then
    cp -a "${src}/templates" "${out}/"
  fi
  if [[ -d "${src}/fleet-collector" ]]; then
    cp -a "${src}/fleet-collector" "${out}/"
  fi
  if [[ -d "${src}/email-worker" ]]; then
    cp -a "${src}/email-worker" "${out}/"
  fi
  # electron-shell : vendor OS (Hermes/n8n) oui ; bins fat (Meili/cloudflared) NON —
  # ils ne doivent jamais atterrir dans vendor marques → asar. Serveur Win les
  # prend via stage `.creezio/win-bin-stage` (desktop-tooling/stage-win-bins.sh).
  if [[ -d "${src}/resources" ]]; then
    if [[ "${name}" == "electron-shell" ]]; then
      mkdir -p "${out}/resources/bin"
      if [[ -d "${src}/resources/vendor" ]]; then
        cp -a "${src}/resources/vendor" "${out}/resources/"
      fi
      # Scripts Node lancés hors asar (ex. cohérence Meili) : légers, génériques
      # et requis dans resources/scripts par le pack serveur.
      if [[ -d "${src}/resources/scripts" ]]; then
        cp -a "${src}/resources/scripts" "${out}/resources/"
      fi
      if [[ -f "${src}/resources/bin/.gitkeep" ]]; then
        cp -a "${src}/resources/bin/.gitkeep" "${out}/resources/bin/"
      else
        : > "${out}/resources/bin/.gitkeep"
      fi
      if [[ -f "${src}/resources/bin/README.md" ]]; then
        cp -a "${src}/resources/bin/README.md" "${out}/resources/bin/"
      fi
    else
      cp -a "${src}/resources" "${out}/"
    fi
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

# Marqueur sync (O0 : pin kitSha tip pour audit / dry-run polish)
KIT_SHA="$(git -C "${KIT}" rev-parse --short HEAD 2>/dev/null || echo unknown)"
node -e '
const fs = require("fs");
const path = require("path");
const dest = process.argv[1];
const arch = process.argv[2];
const kitSha = process.argv[3];
const pkgs = process.argv.slice(4);
const out = {
  syncedAt: new Date().toISOString(),
  architectureVersion: arch,
  kitSha,
  packages: pkgs,
};
fs.writeFileSync(path.join(dest, "SYNC.json"), JSON.stringify(out, null, 2) + "\n");
' "${DEST}" "${ARCH}" "${KIT_SHA}" "${PACKAGES[@]}"

# Monorepo 3 livrables : client/vendor = copie hardlink du vendor racine.
# electron-builder refuse tout fichier hors racine projet (symlinks résolus en
# realpath), donc le livrable client a besoin de chemins réels sous client/.
# Hardlinks = zéro duplication disque ; re-stagé à chaque sync.
if [[ -n "${ROOT:-}" && "${DEST}" == "${ROOT}/vendor/creezio" && -f "${ROOT}/client/package.json" ]]; then
  CLIENT_VENDOR="${ROOT}/client/vendor"
  [[ -L "${CLIENT_VENDOR}" ]] && rm "${CLIENT_VENDOR}"
  rm -rf "${CLIENT_VENDOR}"
  mkdir -p "${CLIENT_VENDOR}"
  cp -al "${ROOT}/vendor/creezio" "${CLIENT_VENDOR}/" 2>/dev/null \
    || cp -a "${ROOT}/vendor/creezio" "${CLIENT_VENDOR}/"
  echo "▸ client/vendor stagé (hardlinks) → ${CLIENT_VENDOR}"
fi

echo "OK vendor → ${DEST} (kitSha=${KIT_SHA})"
du -sh "${DEST}"/*
