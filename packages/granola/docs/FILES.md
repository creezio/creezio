# packages/granola — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs granola` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## `src/`

| Fichier | Rôle |
|---|---|
| [`src/client.ts`](../src/client.ts) | Client REST API publique Granola (notes, transcript, folders, webhook-endpoints) — `fetchImpl` injectable. **Câblé en prod** via le mount. |
| [`src/config.ts`](../src/config.ts) | `GranolaModuleConfig`, schéma SQL (`granola_settings`/`granola_events`/`granola_notes`), `granolaMigrations()`, merge défauts/override, masquage secrets. |
| [`src/index.ts`](../src/index.ts) | Surface publique du package (toute l'API passe par ici). |
| [`src/mount.ts`](../src/mount.ts) | `createGranolaMount` → `/api/v1/modules/granola/*` : webhook signé, webhook-info, register-webhook, config, events, notes, proxys remote/*. **Câblé par la marque** (`registerModuleApi`). |
| [`src/signature.ts`](../src/signature.ts) | Vérification Standard Webhooks (HMAC-SHA256, tolérance rejeu) + `signGranolaPayload` (tests/simulateur). |

## `ui/`

| Fichier | Rôle |
|---|---|
| [`ui/granola-client.tsx`](../ui/granola-client.tsx) | Page `GranolaClient` : config, URL webhook à copier, enregistrement API, livraisons, notes synchronisées. **Disponible** — page à câbler par la marque. |
| [`ui/index.ts`](../ui/index.ts) | Export UI public (`GranolaClient`). |
