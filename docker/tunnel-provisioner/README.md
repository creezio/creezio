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

| Mode | Activation | CRM | embeds / agent | DNS |
|------|------------|-----|----------------|-----|
| **nested** (défaut) | — | `{slug}.{zone}` | `n8n.{slug}`, `hermes.{slug}`, `agent.{slug}` | CNAME `{slug}` + wildcard `*.{slug}` |
| **flat** | `CREEZIO_TUNNEL_FLAT_HOSTS=1` | `{slug}.{zone}` | `n8n-{slug}`, `hermes-{slug}`, `agent-{slug}` | CNAME plats (pas de `*.{slug}`) |

Le mode **flat** est requis sur les zones en **Universal SSL** Cloudflare
(certificats limités à 1 niveau de sous-domaine — ex. `winhub.fr`). Les zones
avec Advanced Certificate Manager (ex. TempoFlow) restent en nested.

Agent hôte flotte : service `http://172.17.0.1:18810` par défaut, joignable
depuis le cloudflared qui tourne DANS le container serveur.

Slugs réservés : `admin`, `mcp`, `api`, `agent`, `registry`, … (`lib.mjs`).
En mode flat, les slugs préfixés `n8n-` / `hermes-` / `agent-` sont aussi
refusés (collision avec les embeds aplatis).

Voir [ADR-tunnel-flat-hosts](../../docs/adr/ADR-tunnel-flat-hosts.md).

## Lancer (VPS admin/infra)

```bash
CREEZIO_TUNNEL_PROVISION_TOKEN="$(openssl rand -hex 24)" \
CREEZIO_TUNNEL_CF_ENV_FILE=/opt/docker/wp-provisioner/.cloudflare-tempoflow.env \
CREEZIO_TUNNEL_STATE_DIR=/opt/docker/creezio-fleet/tunnel-state \
CREEZIO_TUNNEL_PROVISIONER_HOSTS=127.0.0.1,172.17.0.1 \
# CREEZIO_TUNNEL_FLAT_HOSTS=1 \   # Universal SSL uniquement
node docker/tunnel-provisioner/server.mjs
```

`GET /health` renvoie `hostMode: "nested"|"flat"` pour vérifier le flag.

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
# Sans URL/token : create ÉCHOUE (fail-closed). Jamais de stack loopback « OK ».
# Sans CREEZIO_OWNER_EMAIL/_PASSWORD : create ÉCHOUE (fail-closed owner).
# Slug réservé (demo, test…) : CREEZIO_TUNNEL_SLUG=<brand>-<slug> auto (ex. foove2-demo).
# Dev local : CREEZIO_TUNNEL_LOCAL=1 (owner optionnel)
```

L'agent hôte est ensuite exposé par
`creezio server-docker enroll … --slug resto1` (ingress `agent.resto1.{zone}`).

## Réservations brand-web (`lp.{zone}` — landing page de marque)

Hostnames zone-level de la marque elle-même (pas d'un serveur client) :
un seul ingress HTTP, pas d'embeds n8n/hermes, pas de wildcard, pas d'e-mail.
Slugs autorisés : `BRAND_WEB_SLUGS` (`lib.mjs`, aujourd'hui `lp`) — aussi
présents dans `RESERVED_SLUGS` pour qu'un serveur client ne les vole jamais.

```bash
# lp.{zone} → plane Next de l'app admin de marque (rendu /lp public —
# module @creezio/landing, ADR-module-natif-hybride) :
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"slug":"lp","kind":"brand-web","crmPort":18801}' \
  http://127.0.0.1:8666/reserve
# → tunnelToken : lancer cloudflared sur l'hôte (unit systemd dédiée) :
#   cloudflared tunnel --no-autoupdate run --token <tunnelToken>
```

## Nettoyage d'un slug de test

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"slug":"proof-flotte"}' \
  http://127.0.0.1:8666/deprovision
```
