# docker/host-agent — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs docker/host-agent` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## Racine

| Fichier | Rôle |
|---|---|
| [`Dockerfile`](../Dockerfile) | Image agent hôte flotte (VPS restaurant) — Node slim + tar/gzip (backups /data), CMD `host-agent.mjs` (contexte de build = packages/observability/fleet-collector). Lancée par `creezio server-docker agent up`. |
