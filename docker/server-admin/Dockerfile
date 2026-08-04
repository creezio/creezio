# syntax=docker/dockerfile:1
# Creezio Server Admin — admin web multi-serveurs Docker (fleet-collector étendu).
#
# Build context = packages/observability/fleet-collector :
#   docker build -f docker/server-admin/Dockerfile \
#     -t creezio-server-admin:local packages/observability/fleet-collector
#
# Run (fait par `creezio server-docker admin up`) :
#   --network host                          (boot-status des serveurs via 127.0.0.1:<port>)
#   -v /var/run/docker.sock:/var/run/docker.sock
#   -v <brandRoot>:<brandRoot>              (registres servers.json + data, mêmes chemins)
#   -e CREEZIO_ADMIN_PASS=…                 (obligatoire)
#   -e CREEZIO_ADMIN_BRAND_ROOTS=/opt/docker/tempoflow3[:…]

FROM node:22-bookworm-slim

WORKDIR /app
COPY . .

ENV NODE_ENV=production \
    CREEZIO_ADMIN_PORT=18800 \
    CREEZIO_ADMIN_HOST=127.0.0.1

EXPOSE 18800

CMD ["node", "server-admin.mjs"]
