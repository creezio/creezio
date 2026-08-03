# syntax=docker/dockerfile:1
# Image générique serveur marque Creezio (headless) — sans Electron/AppImage.
#
# Build context = racine marque (ex. tempoflow3) :
#   docker build -f $CREEZIO_KIT_ROOT/docker/server/Dockerfile \
#     -t creezio-brand-server:local /path/to/brand
#
# Prérequis marque : `npm run build:electron` (dossier build/ présent).
# Runtime : startBrandKernelHarness via scripts/brand-kernel-harness.mjs
# Bind HTTP Docker : CREEZIO_HTTP_HOST=0.0.0.0

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

FROM node:22-bookworm-slim AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/vendor ./vendor

# Sources / artefacts marque (voir brand.dockerignore)
COPY . .

# Garantir les deps rebuildées (COPY . ne ramène pas node_modules grâce au dockerignore)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/vendor ./vendor

ENV NODE_ENV=production \
    CREEZIO_HTTP_HOST=0.0.0.0 \
    CREEZIO_NATIVE_WARM=0 \
    CREEZIO_TUNNEL_LOCAL=1 \
    CREEZIO_SKIP_KIT_BINARIES=1 \
    METIER_DATA_DIR=/data \
    PORT=18791 \
    METIER_PORT=18791 \
    TF3_CATALOG_DISABLE=1

VOLUME ["/data"]
EXPOSE 18791

HEALTHCHECK --interval=10s --timeout=3s --start-period=45s --retries=8 \
  CMD curl -fsS "http://127.0.0.1:${METIER_PORT:-18791}/api/v1/core/health" || exit 1

CMD ["node", "scripts/brand-kernel-harness.mjs"]
