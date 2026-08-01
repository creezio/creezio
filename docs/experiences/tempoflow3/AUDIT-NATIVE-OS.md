# Audit en profondeur — TempoFlow3 vs modèle OS Creezio

**Date** : 2026-08-01  
**Constat** : le cœur métier TF3 fonctionne en smoke, mais **hors contrat OS**.  
**Intention utilisateur** : Creezio = OS natif configurable (non customisé) ;
TempoFlow = métier uniquement (alimente / configure l’OS).

---

## 0. Intention (référence)

| Couche | Propriétaire | Exemples |
|--------|--------------|----------|
| **OS natif** | `@creezio/*` | api-kernel, SQLite runtime, Meili launcher/index, auth/setup, desktop, assistant, tasks, mails, tunnel… |
| **Métier marque** | repo / `apps/tempoflow3` | schéma brand, règles achats, mounts `/modules/*`, config tables Meili, nav métier |
| **Plugins org** | client | hors scope TF3 MVP |

Réf. : `docs/ARCHITECTURE-INTENTION.md`, `ALLOWLIST.md`, gold `apps/demobrand`, TF2 `brand-runtime` + `register-brand-api`.

**Règle d’échec** : si TempoFlow doit réécrire HTTP + store + recherche pour
fonctionner → creezio (factory / wiring / Meili générique) n’est pas au niveau.

---

## 1. État actuel (inventaire honnête)

**MAJ 2026-08-01** — Phases **A–E** livrées pour la sonde métier : OS natif +
Meili feed + desktop mince + mini-PRDs 01–11 dans la marque. Hors scope :
`test:shell` 0.10.26 complet, monolithe `installBrandDesktopRuntime`,
coherence Meili child-process feed descriptor.

### 1.1 Ce qui est OK (aligné intention)

| Élément | Où | Note |
|---------|-----|------|
| Anti-triche templates CHR | factory | Plus de dump TempoFlow en template |
| Session first-run / login IPC | `@creezio/electron-shell` `createDesktopSessionStore` | OS, pas marque |
| ProductModel cœur 5 entités | `product-model.ts` | Bootstrap mince |
| Runtime natif factory | `brand-migrations` + `bootBrandKernel` + mounts SQL | Phase A |
| Harness Node | `scripts/brand-kernel-harness.mjs` | Même kernel que desktop |
| Mini-PRDs 01–05 | mounts SQL marque | archive, filtres, panier, from-panier |
| Host-stack feature-off | `src/lib/host-stack.ts` | Wiring mince OK en smoke |
| Allowlist anti-sidecar | smokes | Interdit `metier-api.mjs` / `store.json` SoT |

### 1.2 Écarts restants (après A–D socle)

| Écart | Aujourd’hui | Cible OS |
|-------|-------------|----------|
| **Desktop runtime complet** | boot mince (kernel HTTP + Meili optionnel + SPA) — pas `installBrandDesktopRuntime` | brancher hosts lourds si besoin prod |
| **Cohérence child-process** | feed process-local ; legacy decideMeiliReady encore tf2_* | descriptor feed pour coherence-query |
| **Next serveur embarqué** | pages Next pointent `/modules/*` ; pas de process Next dans main sonde | mount Hono/Next optionnel |
| **Modules bonus** | ✅ `brand-bonus-api` + smoke 06–11 | — |

### 1.3 Fichiers encore à traiter (C+)

**Kit Meili (trop TF / incomplet pour OS générique)**  
- `packages/electron-shell/src/host/meili/indexer.ts` — SQL + index `tf2_*` hardcodés  
- `packages/electron-shell/src/host/meili/index-schema.ts` — UIDs `tf2_*`, fingerprint TF  
- `configureMeiliCatalogSqlTables` — seulement compteurs, pas le document builder

**Legacy encore présent (non SoT)**  
- `spawnBrandMetierApi` dans electron-shell — ne plus être le chemin factory  
- `renderMetierApiMjs` — ne plus écrit par `--from-prd`

---

## 2. Gold de référence (ce que « ça marche » veut dire)

### 2.1 DemoBrand — preuve kit minimale

`apps/demobrand/src/electron/sandbox-runtime.ts` :

1. `createSqliteRuntime({ coreMigrations: platformCoreMigrations(), brandMigrations })`  
2. `createApiKernel({ brandId, sqliteRuntime })`  
3. `registerModuleApi("demo-notes", mount SQL sur ctx.db)`  
4. Platform mounts (tasks/mails/…) sur core  
5. Pas de serveur JSON parallèle

### 2.2 TempoFlow2 — preuve production métier

Pattern attendu (ALLOWLIST / docs) :

- `brand-runtime.ts` — compose runtime + kernel  
- `modules/brand-migrations.ts` — SQL métier  
- `modules/register-brand-api.ts` — mounts panier/catalogue/…  
- Meili via host kit + config marque  

**Ne pas copier le code TF2** ; s’en servir comme **contrat de forme**.

---

## 3. Gaps kit à anticiper (au-delà du JSON)

| # | Gap | Impact | Sévérité |
|---|-----|--------|----------|
| G1 | Factory ne génère pas `brand-migrations` + runtime SQLite | Marques from-prd naissent hors OS | **Bloquant** |
| G2 | Pas de harness Node officiel « kernel+SQLite sans Electron » | Smokes forcent un sidecar | **Bloquant** |
| G3 | Pas de générateur de mounts SQL génériques (CRUD entity → ApiMount) | Agent doit tout écrire à la main OU retombe sur JSON | **Haut** |
| G4 | Indexeur Meili TF-hardcodé (`tf2_*`, jointures agregateur…) | Autre marque / TF3 cœur ne peut pas « juste configurer » | **Haut** |
| G5 | Noms d’index `tf2_*` dans le kit | Fuite domaine marque dans OS | **Moyen** (ADR no-brand-domain) |
| G6 | Main from-prd ne monte pas Hono/Next sur kernel | UI SPA hors façade native | **Haut** pour desktop réel |
| G7 | `installBrandDesktopRuntime` référencé mais non branché (hosts) | First-run lite ≠ boot serveur complet | **Moyen** (phases suivantes) |
| G8 | Recherche shell-ui / assistant attend Meili configuré | Sans config marque, fallback SQL flou | **Moyen** |
| G9 | Admin Database (`@creezio/database`) non câblé from-prd | Nice-to-have browse tables | Bas |
| G10 | Doc agent / PROMPT encore ambigus (« metier:api ») | Agents futurs re-trichemont JSON | **Haut** (doc) |

---

## 4. Architecture cible TempoFlow3

```
┌─────────────────────────────────────────────────────────┐
│ Electron / Node harness                                  │
│  prepareDesktopBoot + createDesktopSessionStore (OS)     │
│  createSqliteRuntime(core + brand migrations)            │
│  createApiKernel({ sqliteRuntime })                      │
│  registerPlatformApi(...)   ← kit                        │
│  registerBrandModuleApi(...)← marque (SQL handlers)      │
│  startMeili + configureMeili* + feed index  ← OS+config  │
│  (optionnel) mountApiKernelOnHono / Next                 │
└─────────────────────────────────────────────────────────┘
         ▲ métier = schema + mounts + config index
         │
┌────────┴────────┐
│ apps/tempoflow3 │  brand-migrations, modules/*, nav, pages
└─────────────────┘
```

**Namespace HTTP** : `/api/v1/modules/{fournisseurs|produits|prix|panier|commandes}/…`  
**Interdit comme SoT** : `/api/v1/brand/*` + `store.json`.

---

## 5. Plan de correction (par phases)

### Phase A — Kit : chemin natif factory (bloquant)

**But** : `--from-prd` naît déjà sur SQLite + kernel, pas sur JSON.

| # | Tâche | Livrable |
|---|-------|----------|
| A1 | Générateur `brand-migrations.ts` depuis `schema.sql` / ProductModel (`composeMigrations`) | `crm/src/brand/brand-migrations.ts` ou `src/lib/brand-migrations.ts` |
| A2 | Générateur `brand-runtime.ts` (ou étendre `creezio-boot`) : `createSqliteRuntime` + `createApiKernel({ sqliteRuntime })` + register mounts | Wiring mince marque |
| A3 | Remplacer mounts 501 par **CRUD SQL générique** (handlers sur `ctx.db`) pour chaque entity ProductModel | `brand-module-api.ts` réel |
| A4 | Main from-prd : **ne plus** appeler `spawnBrandMetierApi` ; ouvrir runtime + kernel | `generators/wiring.ts` |
| A5 | Harness Node kit ou factory : `scripts/run-brand-kernel.mjs` (tmp userData, open runtime, listen HTTP mince **sur le kernel**) | Smoke sans Electron = même code |
| A6 | Deprecate / supprimer `renderMetierApiMjs` comme SoT ; garder éventuellement derrière flag `CREEZIO_LEGACY_JSON_METIER=1` temporaire | Factory + ADR |
| A7 | Mettre à jour smokes factory : parcours contre harness kernel ; assert **absence** de dépendance à `store.json` | `test-phase-factory-prd.mjs` |
| A8 | Docs factory AGENTS / README / PROMPT-PRODUIT : « metier:api » = kernel harness, pas JSON | Doc |

**DoD A** :  
`rm -rf apps/tmp && creezio new-app --from-prd … && node scripts/test-metier-parcours.mjs`  
→ écrit/lit **brand.db** via `/api/v1/modules/…` ; aucun `store.json`.

---

### Phase B — TempoFlow3 : bascule marque (bloquant)

**But** : TF3 n’a plus de mini-backend parallèle.

| # | Tâche | Livrable |
|---|-------|----------|
| B1 | Reset ou migration TF3 via regen factory Phase A | Arborescence native |
| B2 | Porter règles mini-PRD 01–05 **dans** mounts SQL (archive, filtres, historique prix, panier totaux, from-panier, statuts) | `modules/*` ou `brand-module-api` enrichi |
| B3 | Supprimer / archiver `scripts/metier-api.mjs` + `spawnBrandMetierApi` usage | Marque clean |
| B4 | `metier-queries` + renderer → base URL kernel (`/api/v1/modules/…`) | UI alignée |
| B5 | Smokes `test-metier-parcours` + `test-mini-prd-core` → harness kernel | Même stack |
| B6 | Allowlist : interdire `metier-api.mjs` / `store.json` comme SoT | Gate |

**DoD B** : `cd apps/tempoflow3 && npm test` vert **sans** process JSON ; fichiers `.db` sous userData de test.

---

### Phase C — Meili natif configurable (haut)

**But** : recherche = OS ; marque = config + alimentation, pas moteur.

| # | Tâche | Livrable |
|---|-------|----------|
| C1 | Extraire de `indexer.ts` un **contrat d’alimentation** générique : `BrandMeiliFeed { indexes, buildDocuments(db), sqlCountTables }` | API kit |
| C2 | Renommer / aliaser index UIDs hors `tf2_*` (ex. `catalog_products`, `catalog_sites`) avec compat soft TF2 | ADR no-brand-domain |
| C3 | `runIndexation({ feed })` ou `runIndexation` lit feed enregistré via `configureMeiliBrandFeed` | Kit |
| C4 | Factory from-prd : générer **config Meili marque** mince (tables produits/fournisseurs + mapping champs) | Wiring |
| C5 | Host-stack / boot : `startMeili` + cohérence + index au boot (feature flag si binary absent → fallback SQL documenté) | OS |
| C6 | Smoke recherche : index + query Meili **ou** skip explicite si binary manquant + assert fallback | Test |
| C7 | Shell-ui / assistant : brancher indexes configurés (pas hardcode tf2) | Kit follow-up |

**DoD C** : TF3 configure tables + feed ; lance Meili kit ; `search?q=` passe par Meili quand dispo ; zéro filtre maison comme SoT.

---

### Phase D — Desktop / Next réel (après A–B)

| # | Tâche |
|---|-------|
| D1 | Brancher `mountApiKernelOnHono` / serveur Next marque mince sur le même kernel |
| D2 | Remplacer SPA-only comme UI principale **ou** faire pointer SPA sur kernel |
| D3 | `installBrandDesktopRuntime` + hosts (feature-off acceptable) — session lite coexiste avec boot complet |
| D4 | Smoke desktop-profile étendu : runtime files + kernel mounts listés |

---

### Phase E — Modules bonus + audit final

| # | Tâche |
|---|-------|
| E1 | Mini-PRDs 06–11 (optimiser, stack, relevés, scan, dashboard, marketplaces) : **schema + mounts + config Meili** dans la marque |
| E2 | Chaque module : si besoin OS manquant → ticket kit (pas réécriture) |
| E3 | Prompt 13 : ALLOWLIST + ORACLE + rapport gaps |
| E4 | (Optionnel) extraction repo externe via propagation |

---

## 6. Ordre d’exécution recommandé

```
A1–A3 (générateurs natifs)
  → A5 (harness smoke)
  → A4 + A6 (couper sidecar factory)
  → A7–A8 (gates + docs)
  → B1–B6 (TF3 bascule + port mini-PRDs sur SQL)
  → C1–C6 (Meili générique + config TF3)
  → D* (Next/desktop)
  → E* (modules + audit)
```

**Ne pas** commencer par Meili ou Next tant que A–B ne sont pas verts : sinon on empile deux stacks.

---

## 7. Risques anticipés

| Risque | Mitigation |
|--------|------------|
| CRUD générique factory trop pauvre pour from-panier / archive | Factory = CRUD + hooks `registerFlowHandlers` ; règles riches restent code marque (OK métier) |
| better-sqlite3 / native deps en CI | Harness documenté ; même stack qu’aujourd’hui demobrand tests |
| Binary Meili absent en CI | Fallback SQL + smoke skip Meili avec assert config présente |
| Casser TF2 en renommant `tf2_*` | Alias + dual-read pendant cutover |
| Agent régénère `--force` et écrase mounts enrichis | Séparer fichiers générés (`*.generated.ts`) vs `modules/*` agent ; ou allowlist merge |
| Tentation de garder JSON « pour les smokes » | Gate fail si `metier-api.mjs` existe comme SoT |

---

## 8. Critères de succès globaux (architecture)

1. TempoFlow3 ne contient **aucun** serveur HTTP métier parallèle.  
2. Toute donnée métier vit dans **brand.db** via runtime kit.  
3. Toute API métier passe par **api-kernel** `/modules/*`.  
4. Meili est **démarré/indexé par le kit** ; TF3 ne fait que config + mapping métier.  
5. Smokes CI = **même** runtime que desktop (sans GUI).  
6. `--from-prd` clean-room reproduit A sans retouche OS ; le métier riche reste dans la marque / mini-PRDs.  
7. Doc agent ne mentionne plus `store.json` / sidecar comme chemin nominal.

---

## 9. Hors scope immédiat (ne pas mélanger)

- Copier tempoflow2 pour « aller plus vite »  
- Remettre `templates/chr`  
- Packager release / tunnel prod / MCP OAuth complet  
- Extraction GitHub externe (après E3)

---

## 10. Prochaine action concrète

Phases **A–E** closes pour la sonde. Suite éventuelle : parity OS
`test:shell` / tunnel / MCP OAuth (kit), extraction repo externe, coherence
Meili feed descriptor.
