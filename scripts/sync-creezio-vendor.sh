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
#   CREEZIO_EXPECT_ARCH_VERSION — assert strict optionnel (vide = skip) ;
#     la compatibilité de version est désormais gérée marque↔kit via
#     DEST/SYNC.json + codemods (voir scripts/codemods/README.md)
#   CREEZIO_VENDOR_PACKAGES — liste espace-séparée (sinon DEFAULT_PACKAGES)
#   CREEZIO_VENDOR_ALLOW_PARTIAL=1 — autorise un sous-ensemble (DÉCONSEILLÉ :
#     le script fait rm -rf DEST puis réécrit SYNC.json = liste fournie)
#   CREEZIO_SYNC_DRY_RUN=1 — liste + assert seulement, pas de copie
#
# INTERDIT (agents) : CREEZIO_VENDOR_PACKAGES=unOuDeuxPkgs — ça VIDE le vendor.
# Toujours sync baseline complète (sans override, ou liste ≥ SYNC.json existant).
#
# Baseline I3 (socle conso marques) — H5 + auth/assistant/tasks/mails.
set -euo pipefail

KIT="${CREEZIO_KIT_ROOT:-/opt/docker/creezio}"
# Assert externe optionnel uniquement : le contrat de version nominal est
# marque (DEST/SYNC.json.architectureVersion) ↔ kit, avec migration codemod
# automatique (scripts/codemods/<versionKit>/manifest.json) en cas d'écart.
EXPECT_ARCH="${CREEZIO_EXPECT_ARCH_VERSION-}"
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
  interactive-demo
  cockpit
  auth
  assistant
  tasks
  mails
  observability
  landing
  admin
  support
  integrations
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

# ── Version marque ↔ kit + codemods (scripts/codemods/README.md) ─────────
# Marque déjà vendorisée sur une autre ARCHITECTURE_VERSION :
#   - un codemod de migration existe pour la version kit → l'exécuter
#     (scripts idempotents, ROOT = racine marque) PUIS continuer le sync ;
#   - sinon → refus explicite (le mécanisme codemod est le chemin nominal).
# Première sync (pas de SYNC.json) : sync direct, pas de codemod.
BRAND_ARCH=""
if [[ -f "${DEST}/SYNC.json" ]]; then
  BRAND_ARCH="$(node -e '
try {
  const j = require(process.argv[1]);
  process.stdout.write(String(j.architectureVersion || ""));
} catch (_) { /* SYNC.json illisible = première sync */ }
' "${DEST}/SYNC.json")"
fi

if [[ -n "${BRAND_ARCH}" && "${BRAND_ARCH}" != "${ARCH}" ]]; then
  CODEMOD_DIR="${KIT}/scripts/codemods/${ARCH}"
  CODEMOD_MANIFEST="${CODEMOD_DIR}/manifest.json"
  if [[ ! -f "${CODEMOD_MANIFEST}" ]]; then
    echo "ERROR: ARCHITECTURE_VERSION marque=${BRAND_ARCH} ≠ kit=${ARCH}" >&2
    echo "       et aucun codemod de migration n'existe : ${CODEMOD_MANIFEST}" >&2
    echo "       Un bump d'ARCHITECTURE_VERSION doit livrer ses codemods" >&2
    echo "       (scripts/codemods/${ARCH}/manifest.json + scripts idempotents" >&2
    echo "       exécutés avec ROOT=<racine marque>) — voir" >&2
    echo "       scripts/codemods/README.md et docs/CONTRIBUTING-BRANDS.md." >&2
    exit 1
  fi
  if [[ -z "${ROOT:-}" ]]; then
    echo "ERROR: migration ${BRAND_ARCH} → ${ARCH} : les codemods transforment" >&2
    echo "       la marque et exigent ROOT=<racine marque> (DEST seul insuffisant)." >&2
    exit 1
  fi
  if [[ "${DRY_RUN}" == "1" ]]; then
    echo "▸ dry-run : migration ${BRAND_ARCH} → ${ARCH} — codemods de ${CODEMOD_DIR} seraient exécutés"
  else
    echo "▸ migration ${BRAND_ARCH} → ${ARCH} : exécution des codemods ${CODEMOD_DIR}"
    while IFS= read -r script; do
      [[ -n "${script}" ]] || continue
      echo "  ▸ codemod ${script}"
      ROOT="${ROOT}" node "${CODEMOD_DIR}/${script}"
    done < <(node -e '
const j = require(process.argv[1]);
for (const s of j.scripts || []) console.log(s);
' "${CODEMOD_MANIFEST}")
    echo "▸ codemods ${ARCH} OK — le sync continue (SYNC.json portera ${ARCH})"
  fi
fi

echo "▸ packages: ${PACKAGES[*]}"
echo "▸ dest: ${DEST}"

# Garde anti-troncature : sync = `rm -rf DEST` + copie PACKAGES + SYNC.json = PACKAGES.
# Un CREEZIO_VENDOR_PACKAGES=sous-ensemble (ex. os-ui seul) vide le vendor et
# tronque SYNC.json.packages. Refuser si DEST a déjà des pkgs absents de la
# nouvelle liste, sauf opt-in explicite.
if [[ "${CREEZIO_VENDOR_ALLOW_PARTIAL:-0}" != "1" && -d "${DEST}" ]]; then
  node -e '
const fs = require("fs");
const path = require("path");
const dest = process.argv[1];
const next = new Set(process.argv.slice(2));
let prev = [];
const syncPath = path.join(dest, "SYNC.json");
if (fs.existsSync(syncPath)) {
  try {
    const j = JSON.parse(fs.readFileSync(syncPath, "utf8"));
    if (Array.isArray(j.packages)) prev = j.packages;
  } catch (_) { /* ignore */ }
}
if (!prev.length) {
  prev = fs.readdirSync(dest).filter((name) => {
    if (name === "SYNC.json") return false;
    try {
      return fs.statSync(path.join(dest, name)).isDirectory();
    } catch {
      return false;
    }
  });
}
const missing = prev.filter((p) => !next.has(p));
if (missing.length) {
  console.error("ERROR: sync partiel refusé — packages déjà présents absents de la liste:");
  console.error("       " + missing.join(" "));
  console.error("       Cause: ce script fait rm -rf du vendor puis réécrit SYNC.json = liste fournie.");
  console.error("       Fix: relancer SANS CREEZIO_VENDOR_PACKAGES (DEFAULT_PACKAGES complète),");
  console.error("       ou avec la liste complète, ou (déconseillé) CREEZIO_VENDOR_ALLOW_PARTIAL=1.");
  process.exit(1);
}
' "${DEST}" "${PACKAGES[@]}"
fi

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

# Garde ADR.1b généralisée : content contracts src↔dist + mtime freshness.
# Refuse de copier un dist plus vieux que le src (routes admin/database, etc.).
node "${KIT}/scripts/lib/assert-runtime-dist.mjs" "${KIT}"

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

# README sentinelle : le vendor est GÉNÉRÉ — toute édition manuelle est
# interdite (et refusée par le garde anti-dérive de kit-compat.sh /
# vendor-update.sh marque).
cat > "${DEST}/README.md" <<'VENDORREADME'
# vendor/creezio — dossier GÉNÉRÉ, NE JAMAIS ÉDITER

Contenu produit par `scripts/sync-creezio-vendor.sh` du kit
[creezio/creezio](https://github.com/creezio/creezio) (packages `@creezio/*`
buildés, pinnés par `SYNC.json.kitSha`). Toute modification locale serait
écrasée au prochain resync — et bloque les workflows **Kit compat** /
**Vendor update** (garde anti-dérive).

- Bug ou évolution kit → reproduire dans un test kit (`scripts/test-*.mjs`
  du repo creezio) → PR sur `creezio/creezio` → le kit vert notifie les
  marques, qui publient leur rapport d'impact (issue « 📦 Compatibilité
  kit »).
- Mise à jour du vendor : geste explicite — workflow **Vendor update** de la
  marque (`gh workflow run vendor-update.yml`), ou localement
  `CREEZIO_KIT_ROOT=<kit> ROOT=<marque> bash <kit>/scripts/sync-creezio-vendor.sh`.
- Doctrine complète : `docs/CONTRIBUTING-BRANDS.md` du kit.
VENDORREADME

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

# Distribution autonome (clone GitHub sans kit) — matérialiser dans la marque :
# - scripts/stage-client-vendor.mjs : re-stage client/vendor depuis le vendor
#   racine commité, sans CREEZIO_KIT_ROOT (post-clone / bootstrap) ;
# - scripts/ensure-server-lock.mjs : lock server/ui cohérent avant docker:build
#   (évite npm ci rouge / boucle agents sur symlink node_modules) ;
# - scripts/install-server-deps.mjs : npm ci server + layout hôte (= Docker
#   /app/node_modules) pour harness / smokes sans kit ;
# - docker/server.Dockerfile : copie byte-identique du Dockerfile serveur kit
#   (`docker build` marche sans le kit checké out à côté) ;
# - .dockerignore : posé/rafraîchi depuis le template kit (marqueur versionné).
# SoT = kit docker/server/ — les copies marque sont rafraîchies à chaque sync.
if [[ -n "${ROOT:-}" && "${DEST}" == "${ROOT}/vendor/creezio" && -f "${ROOT}/client/package.json" ]]; then
  mkdir -p "${ROOT}/scripts" "${ROOT}/docker"
  cp -a "${KIT}/docker/server/stage-client-vendor.mjs" "${ROOT}/scripts/stage-client-vendor.mjs"
  cp -a "${KIT}/docker/server/ensure-server-lock.mjs" "${ROOT}/scripts/ensure-server-lock.mjs"
  cp -a "${KIT}/docker/server/install-server-deps.mjs" "${ROOT}/scripts/install-server-deps.mjs"
  cp -a "${KIT}/docker/server/Dockerfile" "${ROOT}/docker/server.Dockerfile"
  if [[ -f "${KIT}/docker/server/brand.dockerignore" ]]; then
    if [[ ! -f "${ROOT}/.dockerignore" ]] || ! grep -q "creezio-dockerignore" "${ROOT}/.dockerignore"; then
      cp -a "${KIT}/docker/server/brand.dockerignore" "${ROOT}/.dockerignore"
    fi
  fi
  echo "▸ distribution autonome : stage-client-vendor + ensure-server-lock + install-server-deps + docker/server.Dockerfile matérialisés"
fi

echo "OK vendor → ${DEST} (kitSha=${KIT_SHA})"
du -sh "${DEST}"/*
