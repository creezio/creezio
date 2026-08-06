# docker/tunnel-provisioner — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs docker/tunnel-provisioner` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## Racine

| Fichier | Rôle |
|---|---|
| [`creezio-tunnel-provisioner.service.example`](../creezio-tunnel-provisioner.service.example) | Unit systemd d'exemple pour lancer le provisioner sur le VPS admin/infra. |
| [`lib.mjs`](../lib.mjs) | Helpers purs du provisioner (testables sans réseau) : regex slugs, réservés (`admin`, `mcp`, `registry`…), format hostnames (SoT `packages/platform-core/src/tunnel-urls.ts`). |
| [`server.mjs`](../server.mjs) | Serveur HTTP du provisioner Cloudflare Tunnel (reserve/configure/deprovision/state/check) — brand-agnostic, ingress `agent.{slug}.{zone}` pour l'agent flotte. |
