# packages/grokbot — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs grokbot` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## `src/`

| Fichier | Rôle |
|---|---|
| [`src/client.ts`](../src/client.ts) | Client REST API Cursor Cloud Agents v1 (agents, runs, usage, artefacts, me, models, repositories) — `fetchImpl` injectable. **Câblé en prod** via le mount. |
| [`src/config.ts`](../src/config.ts) | `GrokbotModuleConfig`, schéma SQL (`grokbot_settings`/`grokbot_agents`), `grokbotMigrations()`, merge défauts/override, masquage token. |
| [`src/index.ts`](../src/index.ts) | Surface publique du package (toute l'API passe par ici). |
| [`src/mount.ts`](../src/mount.ts) | `createGrokbotMount` → `/api/v1/modules/grokbot/*` : config, status, models, repositories (cache 1 h), agents + miroir local, runs, usage, artefacts. **Câblé par la marque** (`registerModuleApi`). |

## `ui/`

| Fichier | Rôle |
|---|---|
| [`ui/grokbot-client.tsx`](../ui/grokbot-client.tsx) | Page `GrokbotClient` : token, lancement d'agents, runs, prompts de suivi, annulation, archivage. **Disponible** — page à câbler par la marque. |
| [`ui/index.ts`](../ui/index.ts) | Export UI public (`GrokbotClient`). |
