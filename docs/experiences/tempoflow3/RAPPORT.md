# Rapport TempoFlow3 — évaluation creezio (from scratch)

## Verdict

L’expérience est **valide** pour le socle OS + métier cœur/bonus MVP :

1. Prompt 1 = bootstrap **générique** (OS kit + cœur 5 entités CRUD) ;
2. Modules riches = **écrits dans la marque** depuis mini-PRDs / doc creezio ;
3. Aucun dump TempoFlow sous `packages/factory/templates/` ;
4. Pas de sidecar JSON ; Meili = feed `catalog_*` ; desktop = kernel HTTP mince.

Un succès obtenu via template produit pré-cuit **n’évalue pas** creezio.

## Ce qui a été corrigé

| # | Sujet | Statut |
|---|--------|--------|
| P8 | Templates CHR retirés | ✅ |
| P9 | Sidecar JSON → api-kernel + SQLite | ✅ |
| P10 | Meili `BrandMeiliFeed` / `catalog_*` | ✅ |
| P11 | Desktop `listenBrandKernelHttp` + Meili optionnel | ✅ |
| E | Mini-PRDs 06–11 dans la marque | ✅ |

## Preuve actuelle

| Check | Résultat |
|-------|----------|
| `templates/chr` absent | ✅ |
| Prompt 1 regen → 5 entités + runtime natif | ✅ |
| `npm test` TF3 (cœur + bonus 06–11 + OS + Meili) | ✅ |
| Gates factory + meili-feed | ✅ |

## Modules bonus (marque)

Fichier clé : `apps/tempoflow3/src/electron/brand-bonus-api.ts`  
Smoke : `npm run test:mini-prd-bonus`

| Mini-PRD | Mounts |
|----------|--------|
| 06 Optimiser | `POST …/optimiser/suggest` + `apply` |
| 07 Stack | `…/stack` + `…/panier` |
| 08 Relevés | `…/releves` + `apply-prix` |
| 09 Scan | `…/scan/start` + `validate` (pas d’IA marque) |
| 10 Dashboard | orientation + raccourcis |
| 11 Marketplaces | marketplaces / secteurs / agregateurs / data_mappings |

## Gaps restants (oracle / OS)

- `test:shell` complet 0.10.26 (tâches, mails, MCP OAuth, plugins, tunnel…) = kit, hors MVP sonde métier
- `installBrandDesktopRuntime` monolithe non branché (volontaire)
- Coherence Meili child-process encore legacy `tf2_*` sans feed descriptor
- Extraction repo GitHub externe = propagation ultérieure
