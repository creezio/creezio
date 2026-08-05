# creezio-tunnel-provisioner — tunnels Cloudflare des serveurs marque

Provisioner kit (portage brand-agnostic du provisioner TF2, qui reste l'oracle
gelé côté `tempoflow2`). Tourne sur le VPS qui détient les credentials
Cloudflare de la zone marque (ex. `tempoflow.fr`).

## Ce qu'il fait

| Endpoint | Rôle |
|----------|------|
| `GET /health` | Sonde (sans auth) |
| `GET /check?slug=` | Slug libre ? (regex + réservés + DNS) |
| `GET /state?slug=` | Réservation existante (sans tunnelToken) |
| `POST /reserve` | Crée tunnel CF + DNS `{slug}` + `*.{slug}` + mail MX/SPF ; retourne `tunnelToken` (une seule fois) |
| `POST /configure` | PUT ingress complet : crm/n8n/hermes (+ `agent.{slug}` si `agentPort`) |
| `POST /deprovision` | Supprime DNS (slug, wildcard, mail) + tunnel CF + state |

Hostnames (SoT `packages/platform-core/src/tunnel-urls.ts`) :
`{slug}.{zone}` (CRM), `n8n.{slug}`, `hermes.{slug}`, `agent.{slug}` (agent
hôte flotte — service `http://172.17.0.1:18810` par défaut, joignable depuis
le cloudflared qui tourne DANS le container serveur).

Slugs réservés : `admin`, `mcp`, `api`, `agent`, `registry`, … (`lib.mjs`).

## Lancer (VPS admin/infra)

```bash
CREEZIO_TUNNEL_PROVISION_TOKEN="$(openssl rand -hex 24)" \
CREEZIO_TUNNEL_CF_ENV_FILE=/opt/docker/wp-provisioner/.cloudflare-tempoflow.env \
CREEZIO_TUNNEL_STATE_DIR=/opt/docker/creezio-fleet/tunnel-state \
CREEZIO_TUNNEL_PROVISIONER_HOSTS=127.0.0.1,172.17.0.1 \
node docker/tunnel-provisioner/server.mjs
```

- `CF_ENV_FILE` : `CF_API_TOKEN`, `CF_ZONE_ID`, `CF_ZONE_NAME`,
  `CREEZIO_EMAIL_INBOUND_SECRET` (fallback `TF2_EMAIL_INBOUND_SECRET`) —
  jamais commité.
- Écouter aussi `172.17.0.1` (gateway bridge Docker) permet aux containers
  serveurs d'appeler le provisioner sans exposition publique
  (`CREEZIO_TUNNEL_PROVISION_URL=http://172.17.0.1:8666`).
- Unit systemd d'exemple : `creezio-tunnel-provisioner.service.example`.

## Chaîne complète serveur Docker

```bash
export CREEZIO_TUNNEL_PROVISION_URL=http://172.17.0.1:8666
export CREEZIO_TUNNEL_PROVISION_TOKEN=…
creezio server-docker create resto1 --brand-root <marque> --profile prod \
  --env CREEZIO_TUNNEL_SLUG=resto1
# → reserve + ingress + cloudflared dans le container → https://resto1.{zone}
```

L'agent hôte est ensuite exposé par
`creezio server-docker enroll … --slug resto1` (ingress `agent.resto1.{zone}`).

## Nettoyage d'un slug de test

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"slug":"proof-flotte"}' \
  http://127.0.0.1:8666/deprovision
```
