# PRD — TempoFlow3 (expérience OS Creezio)

**Statut** : protocole d’expérience  
**Oracle** : TempoFlow **0.10.26** / `e36e4d0` (27 juil. 2026) — voir [ORACLE-0.10.26.md](./ORACLE-0.10.26.md)  
**Non-oracle** : `0.10.33` et toute dette/amélioration née du refactor kit

---

## 1. Produit

**TempoFlow3** est une application desktop CRM fournisseurs (Electron + Next.js)
dont le **socle natif** est fourni exclusivement par le kit `@creezio/*`, et dont
le repo marque ne contient que :

- le **métier** TempoFlow (catalogue, panier, commandes, optimiser, …) ;
- le **wiring mince** vers le kit (`configure*`, host-stack composition, nav métier).

Promesse utilisateur (identique à 0.10.26) :

- catalogue fournisseurs local (SQLite + Meilisearch) ;
- shell desktop, BYOK, tunnel `{slug}.tempoflow.fr` ;
- MCP sur le tunnel ;
- tâches / assistant / mails / plugins / admin issus de l’OS.

---

## 2. Non-objectifs

- Parité avec `tempoflow2@0.10.33` (post-refactor).
- Implémenter les visions architecture P/N/O « améliorées » non présentes au 27 juil.
- Porter Fidu / Certivan.
- Cloner le monolithe 0.10.26 fichier à fichier.
- Publier un build Windows production pendant l’expérience (optionnel en fin).

---

## 3. Frontière kit vs marque

### 3.1 Interdit dans `tempoflow3` (SoT = creezio)

Auth/session/recovery, shell-ui chrome générique, api-kernel, mcp-facade (OAuth,
policies, host tools génériques), electron-shell (boot, tray, updater, splash,
launchers Hermes/n8n/Meili/tunnel, plugin launcher/control plane), tasks kanban
générique, mails inbox générique, observability/ops/fleet génériques, product-hub
lifecycle générique, database admin générique, onboarding/cockpit engines,
brand-config manifests helpers, desktop-tooling publish.

### 3.2 Autorisé dans `tempoflow3`

Voir [ALLOWLIST.md](./ALLOWLIST.md).

En résumé : identité TempoFlow, `configure*`, modules/routes/UI/queries métier,
migrations **brand**, seeds métier, tests métier + adaptateurs de gates OS.

---

## 4. Contrats kit à consommer

| Capacité 0.10.26 | Package kit attendu | Wiring marque |
|------------------|---------------------|---------------|
| Manifest / feeds / bridge | `@creezio/brand-config` | `electron/brand.ts` |
| Boot desktop / host stack | `@creezio/electron-shell` | `main`, `host-stack`, bindings |
| Paths / SQLite multi-DB | `@creezio/platform-core` | brand-runtime mince |
| HTTP `/api/v1` | `@creezio/api-kernel` | register mounts + modules métier |
| MCP | `@creezio/mcp-facade` | brand facade + aliases métier |
| Auth | `@creezio/auth` | montage routes/UI |
| Nav / AppShell | `@creezio/shell-ui` | nav métier + slots |
| Onboarding / cockpit | `@creezio/onboarding`, `cockpit` | `configure*` |
| Assistant | `@creezio/assistant` | `configureAssistantBrand` + prompts métier |
| Tâches | `@creezio/tasks` | `configure-tasks` |
| Mails | `@creezio/mails` | `configure-mails` |
| Plugins / Product Hub | `@creezio/product-hub` + electron-shell CP | hub store + ACL |
| Observability | `@creezio/observability` | opt-in fleet TF |
| Database admin | `@creezio/database` | mount admin |

Si un contrat manque → **stop expérience**, ouvrir gap kit, ne pas réimplémenter
dans tempoflow3.

---

## 5. Métier (périmètre MVP puis extension)

### MVP (doit égaler le « cœur » 0.10.26)

1. Schéma brand + migrations catalogue / panier / commandes / stack de base  
2. Routes API + queries associées  
3. Pages : dashboard, fournisseurs, produits, skus, panier, commandes  
4. Search (Meili via kit/host + fallback SQL marque)  
5. Nav métier + ACL  
6. Data-mapping / agrégateurs (niveau utilisable 0.10.26)

### Extension (après MVP vert)

- Optimiser complet + tests optimiser_*  
- Dispatch avancé  
- Relevés, scan, promotions, secteurs, marketplaces, surface `/site/[id]`

L’oracle checklist reste la boussole : on coche MVP d’abord, extension ensuite.

---

## 6. Données

| DB | Contenu | Propriétaire |
|----|---------|--------------|
| `core.db` | users, auth, tasks, mails, mcp, plugins hub, ops… | kit |
| `brand.db` (tempoflow) | catalogue, panier, commandes, mapping… | marque |
| `plugin/<id>.db` | sidecars | kit à l’install |

---

## 7. Acceptance

### A — OS (équivalent `test:shell` 0.10.26)

Tous les items de la chaîne listée dans [ORACLE-0.10.26.md](./ORACLE-0.10.26.md)
passent (ou équivalent documenté si renommé côté kit).

### B — Métier MVP

- [ ] API catalogue / panier / commandes répondent  
- [ ] Pages cœur rendent sans crash  
- [ ] `test:panier-sku` (ou équivalent) vert  
- [ ] Parcours manuel first-run → panier

### C — Allowlist

Audit P12 : 0 fichier natif dupliqué hors allowlist ; wiring ≤ seuil documenté
dans le rapport.

### D — Oracle

Checklist opérateur [ORACLE-0.10.26.md](./ORACLE-0.10.26.md) cochée pour MVP
(+ extension si jouée).

---

## 8. Livrables

1. Repo GitHub `creezio/tempoflow3`  
2. Ce PRD + prompts exécutés (historique commits `Pxx:`)  
3. `RAPPORT-EXPERIENCE.md` (template [RAPPORT-TEMPLATE.md](./RAPPORT-TEMPLATE.md))  
4. PR creezio éventuelles pour gaps

---

## 9. Prompt pack

Textes complets : [PROMPTS.md](./PROMPTS.md).
