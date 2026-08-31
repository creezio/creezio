---
"@creezio/granola": minor
"@creezio/grokbot": minor
---

Deux nouveaux modules natifs hybrides (ADR-module-natif-hybride) :

- `@creezio/granola` — connecteur Granola (AI meeting notes) : mount
  `/api/v1/modules/granola/*` avec récepteur webhook signé
  (Standard Webhooks, fail-closed dès qu'un `signingSecret` est configuré,
  dédup par `event_id`), sync des notes en brand.db via l'API publique
  (`grn_…`), `register-webhook` qui crée l'endpoint côté Granola et capture
  le `signing_secret` (retourné une seule fois), proxys
  notes/transcript/folders/webhook-endpoints, UI `GranolaClient`
  (URL webhook à copier, livraisons, notes).
- `@creezio/grokbot` — pilotage d'agents cloud via l'API Cursor v1 :
  client REST complet (agents, runs, usage, artefacts, models,
  repositories), mount `/api/v1/modules/grokbot/*` avec token stocké côté
  serveur (masqué en GET), miroir local des agents en brand.db, cache DB
  1 h sur `repositories` (rate limit amont), ops clés publiées MCP
  (`create-agent`, `create-run`, `get-run`…), UI `GrokbotClient`
  (lancement, suivi des runs, prompts de suivi, annulation).

Câblage marque : composer `granolaMigrations()` / `grokbotMigrations()`
dans les migrations brand et enregistrer `createGranolaMount({ defaults })`
/ `createGrokbotMount({ defaults })` via `registerModuleApi`.
