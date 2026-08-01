# Oracle TempoFlow 0.10.26 (`e36e4d0`)

Source : `git show v0.10.26` / tag `v0.10.26` = `e36e4d0`.

État kit à cette date : **pas de vendor `@creezio/*`**. Tout le desktop vit
dans `crm/` (electron + Next + scripts). L’expérience TempoFlow3 doit
**reproduire le comportement**, pas la structure monolithe.

## Produit (ce que l’utilisateur a)

D’après `crm/README.md` @ 0.10.26 :

- Catalogue fournisseurs local (SQLite + Meilisearch)
- Shell Electron + UI Next.js
- BYOK OpenAI
- Tunnel Cloudflare (`{slug}.tempoflow.fr`)
- Auto-update feed tokenisé
- Serveur MCP sur le tunnel (`…/mcp`)

## Pages App Router à couvrir (minimum)

Extrait `src/app/**/page.tsx` @ 0.10.26 — parity fonctionnelle attendue :

**Cœur métier**
- `/dashboard`, `/fournisseurs`, `/fournisseurs/[id]`
- `/produits`, `/produits/[id]`, `/skus`, `/skus/[id]`
- `/panier`, `/commandes`, `/commandes/[id]`, `/commandes/[id]/optimiser`
- `/optimiser`, `/stack`, `/releves`, `/scan`, `/promotions`
- `/secteurs`, `/marketplaces`, `/agregateurs`, `/data-mapping`
- `/site/[fournisseurId]` (surface fournisseur)

**Plateforme (doit venir du kit dans TF3, pas réécrit)**
- `/login`, `/setup`, `/onboarding`, `/configuration`, `/parametres`
- `/taches`, `/collaborateurs`, `/mails`
- `/mcp`, `/developers`, `/cockpit`, `/server-cockpit`
- `/admin/*` (mcp, plugins, database, api, analytics, request-logs, …)

## Agrégat `test:shell` @ 0.10.26 (OS + desktop)

Chaîne exacte dans `package.json` :

```
test:byok-strict
test:updater
test:first-run-auth
test:catalog-client-purge
test:recovery-key
test:connection-profile
test:profile-argv
test:app-kind
test:installer-prefs
test:node-runtime
test:hermes-embed
test:n8n-embed
test:n8n-api-key
test:plugin-runtime
test:plugin-control-api
test:plugin-git
test:hermes-context-seed
test:splash-ui
test:ops-journal
test:embed-sandbox
test:tasks
test:mcp-tasks
test:ai-task-agent
test:ai-screencast-hub
test:nav-acl
test:cockpit-api
test:agent-isolation
test:ai-missions
test:desktop-presence
test:open-external-tab
test:tab-document-url
test:supplier-slot-loading
test:supplier-surface-reactivation
test:mcp-base-url
test:tunnel-slug
test:public-origin
test:assistant-chat-scope
test:electron-main-graph
```

Pour TempoFlow3 : **mêmes capacités**, tests adaptés aux chemins kit
(`@creezio/*` / vendor) mais **assertions comportementales** équivalentes.

## Tests métier hors `test:shell` (cœur)

À rejouer ou équivaloir pour le MVP métier :

| Script | Domaine |
|--------|---------|
| `test:panier-sku` | Panier |
| `test:dispatch` / `test:dispatch-v1` / `test:dispatch-candidates` | Dispatch commandes |
| `test:optimiser` (+ score/snapshot/guard/graph/filters) | Optimiser |
| `test:data-mapping` | Data mapping |
| `test:api-publique` | API publique |
| `test:mcp-oauth` / `test:mcp-admin:*` | MCP OAuth/admin |

## Surfaces Electron présentes @ 0.10.26 (comportement à retrouver via kit)

Sans tout lister fichier par fichier : le tip avait ~87 fichiers top-level
`electron/` (launchers Hermes/n8n/Meili, plugins control plane, fleet, ops,
AI workspace, tunnel, updater…).  

Dans TF3 ces **comportements** doivent venir de `@creezio/electron-shell` (+
bindings), pas d’une copie des 87 fichiers.

## Métier lib @ 0.10.26 (doit rester marque)

Exemples de domaines code marque :

- `catalog-queries`, `commande-queries`, `promo-queries`, `rayons`, `statut`
- `dispatch-*`, `optimiser-*`, `data-mapping-queries`
- routes server : `catalog`, `fournisseurs`, `panier`, `commandes`,
  `commande-dispatch`, `stack`, `statut`, `search`, `data-mapping`

## Comment valider « au moins 0.10.26 »

1. Cocher [ORACLE checklist](#checklist-opérateur) manuellement / scripts.  
2. `test:shell` TF3 vert (équivalent).  
3. Smokes métier cœur verts.  
4. Parcours manuel : first-run → catalogue → panier → commande → tâches → MCP health.  
5. **Ne pas** exiger les refactors architecture post-27 juil.

## Checklist opérateur

### Métier TF3 (sonde — 2026-08-01)

- [x] Bootstrap `--from-prd` natif (api-kernel + SQLite)
- [x] Auth / setup via OS kit (`createDesktopSessionStore`)
- [x] Catalogue fournisseurs + produits + prix + panier + commande
- [x] Recherche (`/modules/search` Meili ou SQL)
- [x] Optimiser (suggest + apply)
- [x] Stack / relevés / scan (mapping métier, pas d’IA marque)
- [x] Dashboard métier (orientation + raccourcis)
- [x] Marketplaces + secteurs + agrégateurs + data-mapping
- [x] Desktop mince : kernel HTTP + Meili optionnel

### OS / parity 0.10.26 (hors MVP sonde métier)

- [ ] Boot Client / Serveur (profils Héberger / Rejoindre) complet
- [ ] Recovery key
- [ ] Tâches kanban + mission IA
- [ ] Mails inbox
- [ ] MCP URL publique tunnel + OAuth
- [ ] Plugins control plane
- [ ] Hermes / n8n embeds
- [ ] Admin MCP / database / plugins
- [ ] `test:shell` agrégat vert (équivalent kit)
