# syntax=docker/dockerfile:1
# Image générique serveur marque Creezio (headless) — sans Electron/AppImage.
#
# Image modulaire par variant (SERVER_VARIANT) :
#   base    (défaut) — kernel + API + CRM Next + Meili
#   browser          — + chromium/xvfb/fonts : sidecar navigateur IA
#                      (CREEZIO_BROWSER_SIDECAR=1, profils /data/browser).
#                      L'image base n'est jamais alourdie.
#
# Build context = racine marque (ex. tempoflow3) :
#   docker build -f $CREEZIO_KIT_ROOT/docker/server/Dockerfile \
#     -t creezio-server-<brandId>:local /path/to/brand
#
# Prérequis marque : `npm run build:electron` (dossier build/ présent)
#   + `npm run build:ui` si ui/ existe (CRM web servi par le container).
# Runtime : startBrandKernelHarness via scripts/brand-kernel-harness.mjs
#   → boot-status HTTP dès le démarrage (GET /api/v1/os/boot-status)
#   → reverse-proxy UI Next standalone (CRM navigateur sur /)
# Bind HTTP Docker : CREEZIO_HTTP_HOST=0.0.0.0 (publier sur 127.0.0.1 côté hôte)

ARG SERVER_VARIANT=base

FROM node:22-bookworm-slim AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor ./vendor
# electron est en devDependencies — omit=dev = image serveur sans GUI
RUN npm ci --omit=dev \
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

FROM node:22-bookworm-slim AS runtime-base
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/vendor ./vendor
COPY --from=meili /usr/local/bin/meilisearch /opt/creezio/bin/meilisearch

# Sources / artefacts marque (voir brand.dockerignore —
# inclut ui/.next/standalone + static si la marque a une UI Next)
COPY . .

# Garantir les deps rebuildées (COPY . ne ramène pas node_modules grâce au dockerignore)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/vendor ./vendor

ENV NODE_ENV=production \
    CREEZIO_HTTP_HOST=0.0.0.0 \
    CREEZIO_NATIVE_WARM=0 \
    CREEZIO_TUNNEL_LOCAL=1 \
    CREEZIO_SKIP_KIT_BINARIES=1 \
    MEILI_BINARY=/opt/creezio/bin/meilisearch \
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
