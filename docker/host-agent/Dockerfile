# syntax=docker/dockerfile:1
# Creezio Host Agent — agent hôte flotte (VPS restaurant).
#
# Build context = packages/observability/fleet-collector :
#   docker build -f docker/host-agent/Dockerfile \
#     -t creezio-host-agent:local packages/observability/fleet-collector
#
# Run (fait par `creezio server-docker agent up`) :
#   --network host                          (serveurs 127.0.0.1:<port> + bind 172.17.0.1 pour l'ingress tunnel)
#   -v /var/run/docker.sock:/var/run/docker.sock
#   -v <brandRoot>:<brandRoot>              (registres servers.json + volumes /data + backups)
#   -e CREEZIO_AGENT_BRAND_ROOTS=/opt/docker/tempoflow3[:…]
#   -e CREEZIO_AGENT_HOSTS=127.0.0.1,172.17.0.1

FROM node:22-bookworm-slim

# tar/gzip : backups /data avant update (rollback-safe).
RUN apt-get update \
  && apt-get install -y --no-install-recommends tar gzip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

ENV NODE_ENV=production \
    CREEZIO_AGENT_PORT=18810 \
    CREEZIO_AGENT_HOSTS=127.0.0.1

EXPOSE 18810

CMD ["node", "host-agent.mjs"]
