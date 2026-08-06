# docker/server-admin — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs docker/server-admin` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## Racine

| Fichier | Rôle |
|---|---|
| [`Dockerfile`](../Dockerfile) | Image admin web multi-serveurs (backend flotte) — sert `packages/observability/fleet-collector/server-admin.mjs` (Node pur, zéro dépendance npm). |
| [`configure-admin-npm.sh`](../configure-admin-npm.sh) | Expose l'admin flotte (127.0.0.1:18800) sur `https://admin.{zone}` : DNS Cloudflare + nginx-proxy-manager + certificat Origin. L'auth reste le Basic auth server-admin. |
