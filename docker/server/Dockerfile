# syntax=docker/dockerfile:1
# Image générique serveur marque Creezio (headless) — sans Electron/AppImage.
#
# Image modulaire par variant (SERVER_VARIANT) :
#   base    (défaut) — kernel + API + CRM Next + Meili
#   browser          — + chromium/xvfb/fonts : sidecar navigateur IA
#                      (CREEZIO_BROWSER_SIDECAR=1, profils /data/browser).
#                      L'image base n'est jamais alourdie.
#
# Layout marque (SERVER_DIR) :
#   server (défaut) — monorepo : workspace npm racine + livrable server/
#   .               — layout plat legacy (tout à la racine marque)
#
# Deps @creezio/* = packages npm publiés sur GitHub Packages (plus de
# vendoring). Le token passe par secret BuildKit — jamais en ARG/ENV, donc
# rien dans l'historique d'image ni dans `docker history` :
#   docker build --secret id=CREEZIO_NPM_TOKEN,env=CREEZIO_NPM_TOKEN …
# Le .npmrc racine de la marque (commité, SANS secret) référence
# ${CREEZIO_NPM_TOKEN} — expansé par npm au moment du npm ci.
#
# Build context = racine marque (ex. tempoflow3) :
#   docker build -f $CREEZIO_KIT_ROOT/docker/server/Dockerfile \
#     --build-arg SERVER_DIR=server \
#     --secret id=CREEZIO_NPM_TOKEN,env=CREEZIO_NPM_TOKEN \
#     -t creezio-server-<brandId>:local /path/to/brand
#
# Prérequis marque : `npm run build:runtime` (dossier <SERVER_DIR>/build présent)
#   + `npm run build:ui` si <SERVER_DIR>/ui existe (CRM web servi par le container).
# Runtime : startBrandKernelHarness via scripts/brand-kernel-harness.mjs
#   → boot-status HTTP dès le démarrage (GET /api/v1/os/boot-status)
#   → reverse-proxy UI Next standalone (CRM navigateur sur /)
# Bind HTTP Docker : CREEZIO_HTTP_HOST=0.0.0.0 (publier sur 127.0.0.1 côté hôte)

ARG SERVER_VARIANT=base
ARG SERVER_DIR=server
# Version applicative embarquée (publish : creezio server-docker publish --tag X).
ARG SERVER_VERSION=0.0.0-local

FROM node:22-bookworm-slim AS deps
ARG SERVER_DIR
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Deps du livrable serveur = workspace npm racine (lockfile racine SoT).
# .npmrc commité sans secret : @creezio → npm.pkg.github.com, token via env.
# (server/ui reste un projet npm indépendant avec son propre lockfile :
# l'UI Next est servie en standalone self-contained, ses deps ne vont pas
# dans l'image.)
COPY package.json package-lock.json .npmrc ./
COPY ${SERVER_DIR}/package.json ./${SERVER_DIR}/package.json
# electron est en devDependencies — omit=dev = image serveur sans GUI.
# Monorepo : -w ${SERVER_DIR} = seules les deps du livrable serveur
# (install workspace → node_modules RACINE, walk-up standard depuis
# /app/${SERVER_DIR}). Layout plat : npm ci à la racine (la racine EST le
# livrable). npm ci strict : le lock commité est garanti frais par les
# gates (test-clone-autonomy + CI marque) — pas de fallback silencieux.
RUN --mount=type=secret,id=CREEZIO_NPM_TOKEN \
    export CREEZIO_NPM_TOKEN="$(cat /run/secrets/CREEZIO_NPM_TOKEN)" \
  && if [ "${SERVER_DIR}" = "." ]; then \
       npm ci --omit=dev --no-audit --no-fund; \
     else \
       npm ci --omit=dev --workspace="${SERVER_DIR}" --no-audit --no-fund; \
     fi \
  && npm rebuild better-sqlite3

# Meilisearch Linux embarqué — recherche réelle (plus de sql-fallback).
# Version alignée sur ensure-kit-binaries.ts (@creezio/electron-shell).
FROM node:22-bookworm-slim AS meili
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL -o /usr/local/bin/meilisearch \
    https://github.com/meilisearch/meilisearch/releases/download/v1.11.3/meilisearch-linux-amd64 \
  && chmod 755 /usr/local/bin/meilisearch \
  && /usr/local/bin/meilisearch --version

# cloudflared Linux embarqué — tunnel d'accès distant (parité TF2 desktop).
# URL alignée sur ensure-kit-binaries.ts (CREEZIO_SKIP_KIT_BINARIES=1 au run :
# le binaire vient de l'image, jamais téléchargé au boot).
FROM node:22-bookworm-slim AS cloudflared
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL -o /usr/local/bin/cloudflared \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  && chmod 755 /usr/local/bin/cloudflared \
  && /usr/local/bin/cloudflared --version

FROM node:22-bookworm-slim AS runtime-base
ARG SERVER_DIR
ARG SERVER_VERSION
# xz-utils : l'install Hermes (warm natif) extrait un node runtime .tar.xz.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl xz-utils \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Version image = version applicative (GET /api/v1/core/version — SoT flotte).
ENV CREEZIO_APP_VERSION=${SERVER_VERSION}
LABEL org.opencontainers.image.version=${SERVER_VERSION}

COPY --from=meili /usr/local/bin/meilisearch /opt/creezio/bin/meilisearch
COPY --from=cloudflared /usr/local/bin/cloudflared /opt/creezio/bin/cloudflared

# Sources / artefacts marque (voir brand.dockerignore —
# inclut <SERVER_DIR>/ui/.next/standalone + static si la marque a une UI Next)
COPY . .

# Deps rebuildées (COPY . ne ramène pas node_modules grâce au dockerignore).
# node_modules à la RACINE : résolution standard par walk-up depuis
# /app/${SERVER_DIR} (packages npm réels — plus de vendor ni de symlink).
COPY --from=deps /app/node_modules ./node_modules

# Workdir = livrable serveur (monorepo : /app/server ; plat : /app).
WORKDIR /app/${SERVER_DIR}

ENV NODE_ENV=production \
    CREEZIO_HTTP_HOST=0.0.0.0 \
    CREEZIO_NATIVE_WARM=0 \
    CREEZIO_TUNNEL_LOCAL=1 \
    CREEZIO_SKIP_KIT_BINARIES=1 \
    MEILI_BINARY=/opt/creezio/bin/meilisearch \
    CREEZIO_CLOUDFLARED_BINARY=/opt/creezio/bin/cloudflared \
    METIER_DATA_DIR=/data \
    PORT=18791 \
    METIER_PORT=18791

VOLUME ["/data"]
EXPOSE 18791

HEALTHCHECK --interval=10s --timeout=3s --start-period=45s --retries=8 \
  CMD curl -fsS "http://127.0.0.1:${METIER_PORT:-18791}/api/v1/core/health" || exit 1

# Le CMD n'est pas supposé être le seul process du container : un variant
# peut lancer des sidecars (browser, …) via un entrypoint superviseur.
CMD ["node", "scripts/brand-kernel-harness.mjs"]

# ---------------------------------------------------------------------------
# Variant browser — sidecar navigateur IA (CREEZIO_BROWSER_SIDECAR=1) :
#   chromium + xvfb + fonts (liberation/noto) + libs rendu.
# Profils persistants /data/browser/<aiUserId> (même volume /data).
# Recommandé au run : --shm-size=1g (Chromium /dev/shm) — appliqué par le
# CLI `creezio server-docker create --browser`.
# Activation : docker build --build-arg SERVER_VARIANT=browser …
# ---------------------------------------------------------------------------
FROM runtime-base AS runtime-browser
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium xvfb \
    fonts-liberation fonts-noto-core fonts-noto-color-emoji \
    libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2 libxss1 \
  && rm -rf /var/lib/apt/lists/* \
  && chromium --version
ENV CREEZIO_BROWSER_SIDECAR=1 \
    CREEZIO_CHROMIUM_BIN=/usr/bin/chromium \
    CREEZIO_BROWSER_DATA_DIR=/data/browser

# Stage final : sélectionné par SERVER_VARIANT (base par défaut).
FROM runtime-${SERVER_VARIANT} AS runtime