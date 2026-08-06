# AGENTS — `docker/tunnel-provisioner`

## Mission

Provisioner Cloudflare Tunnel du kit (brand-agnostic) : réservation
slug + tunnel + DNS (`{slug}.{zone}`, `n8n.{slug}`, `hermes.{slug}`,
`agent.{slug}`), ingress, déprovision. Tourne sur le VPS qui détient les
credentials Cloudflare de la zone marque.

## Ne pas faire

- Committer un token/credential Cloudflare (le `CF_ENV_FILE` vit hors repo).
- Changer le format des hostnames ici : la SoT est
  `packages/platform-core/src/tunnel-urls.ts`.
- Retirer un slug de `RESERVED_SLUGS` (`lib.mjs`) sans vérifier qu'aucun
  service zone-level ne l'utilise (`admin`, `mcp`, `registry`, `lp`…).
- Renvoyer le `tunnelToken` ailleurs qu'à la réservation initiale
  (il n'est restitué qu'une seule fois).

## Points d'entrée

- `server.mjs` — serveur HTTP (reserve / configure / deprovision / state / check).
- `lib.mjs` — helpers purs testables sans réseau (slugs, hostnames, réservés).

## Tests / gates

```bash
cd /opt/docker/creezio
node --test scripts/test-os-tunnel-provision.mjs
```

## Liens

- [README.md](./README.md)
- [docs/FILES.md](./docs/FILES.md)
