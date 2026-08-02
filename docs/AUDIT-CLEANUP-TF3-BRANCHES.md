# Audit cleanup — TempoFlow3, branches agents, archi SoT

> **Date** : 2026-08-02  
> **Périmètre** : `creezio/creezio`, `creezio/tempoflow2`, `creezio/certivan-app`, `creezio/fidu`  
> **Nature** : audit + plan de tâches uniquement — **aucun merge**, **aucune création de repo**, **aucune suppression de branche** dans cette livraison.  
> **Mesures** : tip `main` creezio `cb60082` ; branche TF3 `cursor/tempoflow3-create-457d` @ `65b9273` ; PR [#25](https://github.com/creezio/creezio/pull/25), [#24](https://github.com/creezio/creezio/pull/24).

---

## A. Carte de situation (1 page)

### Qui est où

| Artefact | Où | Rôle | Statut |
|----------|----|------|--------|
| **Kit `@creezio/*` (H6 cutovers)** | `creezio` `main` | **SoT plateforme actuelle** (auth, shell-ui, api-kernel, mcp, tasks, mails, product-hub, electron-shell, …) | **Stable / shipped** — cutovers natifs mergés fin juillet |
| **Docs expérience TF3 (oracle 0.10.26)** | `creezio` `main` via PR #23 | Protocole, PRD, prompts — **pas** le code factory/app | SoT doc expérience |
| **Factory `--from-prd` + BrandSpec + app-runtime + session OS** | branche `cursor/tempoflow3-create-457d` (+ sous-ensemble PR #24) | **Expérimental / half-state** — 66 commits ahead, **CONFLICTING** avec `main` | **Pas SoT** tant que non découpé |
| **`apps/tempoflow3`** | uniquement sur la branche TF3 (monorepo) | Sonde clean-room métier CHR générée + preuves Linux | Expérimental — **candidat extraction** vers repo séparé |
| **Repo `creezio/tempoflow3`** | n’existe **pas** sur GitHub | Cible annoncée | À créer **après** découpe kit |
| **TempoFlow2** | `tempoflow2` `main` only (0 branche remote agent) | Produit gold CHR — consomme kit via `crm/vendor` `kitSha=9c474c2` | SoT produit TF2 ; **pas** encore BrandSpec/app-runtime |
| **Certivan / Fidu** | `main` ; cutovers mergés ; stubs remote morts | Marques alignées H6 vendor même `kitSha` | SoT marques ; sync kit = docs-only après `9c474c2` |
| **Archive oracle** | `creezio/tempoflow2-archive-0.10.26` (archived) | Référence comportement 0.10.26 | Lecture seule |

### Expérimental vs SoT (résumé)

```text
SoT aujourd’hui
├── creezio/main          → packages natifs H6 + docs TF3 (#23)
├── tempoflow2/main       → métier gold + vendor kitSha 9c474c2
├── certivan-app/main     → métier VASP + même vendor
└── fidu/main             → métier GED + même vendor

Expérimental (ne pas merger tel quel)
├── PR #25 / 65b9273      → factory++ + brand-spec + app-runtime
│                           + electron-shell session/OS + apps/tempoflow3
│                           + hermes/n8n vendor kit + preuves
└── PR #24                → ancêtre factory F0–F5 (déjà inclus/dépassé dans #25)
```

**Point clé** : la « nouvelle archi » **complète** (BrandSpec, `app-runtime`, factory from-prd, main Electron mince) **n’est pas sur `main` creezio**. Seule la couche cutover H6 + la doc expérience y sont. Les marques tournent déjà sur H6 vendor, pas sur le runtime mince TF3.

---

## B. Inventaire branches / PR

### B.1 PRs ouvertes (creezio)

| Branche / PR | Repo | Valeur | Risque | Notes |
|--------------|------|--------|--------|-------|
| **PR #25** `cursor/tempoflow3-create-457d` @ `65b9273` | creezio | **Extraire / découper** — ne pas merger tel quel | **Élevé** | Draft, `CONFLICTING`/`DIRTY` vs `main` (+1 commit docs #23). +39k/−0.9k lignes, 258 fichiers, 66 commits. Mélange kit + app + preuves + vendor Hermes install scripts. Windows **non prouvé**. |
| **PR #24** `cursor/factory-from-prd-457d` @ `33bbdfa` | creezio | **Extraire via #25** puis fermer | Moyen | Ancêtre de #25 (`YES` is-ancestor). Contenu factory F0–F5 **déjà dépassé** sur tip TF3 (+2461 lignes factory depuis #24). Draft CONFLICTING. |

### B.2 Branches remote creezio `cursor/*`

| Branche | Valeur | Risque | Notes |
|---------|--------|--------|-------|
| `cursor/tempoflow3-create-457d` | **Garder** jusqu’à extraction | Élevé si touchée pendant découpe | Tip = `65b9273` (annoncé). Worktree local absent ; seul checkout `main`. |
| `cursor/factory-from-prd-457d` | **Supprimer** après extraction factory depuis tip TF3 | Faible | Redondant avec #25. |
| `cursor/integrate-native-kit-457d` | **Supprimer** | Nul | `ahead=0`, merged into main. |
| `cursor/native-*-sot-457d` (api-kernel, assistant, auth, database, mails, mcp-facade, observability, onboarding, product-hub, tasks) | **Supprimer** | Nul | Tous `ahead=0` / merged. |
| `cursor/native-shell-ui-pshell5-457d` | **Supprimer** | Nul | Merged (PR #13). |
| `cursor/native-shell-ui-sot-457d` | **Supprimer** (ou cherry-pick 1 commit test) | Faible | `ahead=1` : gate test `scripts/test-phase-p-shell-ui.mjs` — **déjà livré** via pshell5 / PR #13 ; commit orphelin redondant. |
| `cursor/docs-packages-complete-457d` | déjà absente remote (prune) | — | Merged #22. |

### B.3 tempoflow2

| Branche / PR | Repo | Valeur | Risque | Notes |
|--------------|------|--------|--------|-------|
| `main` only | tempoflow2 | SoT produit | — | **Aucune** branche `cursor/*` remote restante. 0 PR ouverte. |
| PRs cutover #7–#26 | tempoflow2 | Historique | — | Toutes mergées (dernier : docs marque #26). |

### B.4 certivan-app

| Branche / PR | Repo | Valeur | Risque | Notes |
|--------------|------|--------|--------|-------|
| `main` | certivan-app | SoT | **Local dirty** | Working tree avec **13 fichiers Deleted** non commités (`main.ts`, onboarding, settings…) — **à investiguer** avant tout sync (pas inventé comme feature ; état disque observé). |
| `feat/cdc-nav-stubs` (local) | certivan-app | Vérifier | Moyen | Branche locale `0.1.7` stubs CDC — pas sur remote listée ici. |
| `cursor/certivan-plugin-factory-457d` | certivan-app | **Supprimer** | Faible | `ahead=1` mais PR #19 **MERGED** — tip remote probablement rebase-lag. |
| `cursor/fix-shell-embed-tests-457d` | certivan-app | **Supprimer** | Faible | PR #21 MERGED ; `ahead=1` lag. |
| Autres `cursor/native-*-cutover-*`, `integrate-*`, `resync-*`, `sync-*` | certivan-app | **Supprimer** | Nul | `ahead=0` / merged. |
| 0 PR ouverte | — | — | — | Cleanup = delete remote only. |

### B.5 fidu

| Branche / PR | Repo | Valeur | Risque | Notes |
|--------------|------|--------|--------|-------|
| `main` | fidu | SoT | — | Propre, 0 PR ouverte. |
| `cursor/fix-shell-embed-tests-457d` | fidu | **Supprimer** | Faible | PR #19 MERGED ; `ahead=1` lag. |
| Autres `cursor/*` cutover/resync | fidu | **Supprimer** | Nul | Merged. |

---

## C. Écarts archi

### C.1 creezio `main` vs branche TF3 (`65b9273`)

| Zone | Sur `main` | Sur TF3 tip | Action recommandée |
|------|------------|-------------|--------------------|
| Packages cutover H6 | Oui | Oui (+évolutions) | SoT = main ; cherry-pick sélectif depuis TF3 |
| `packages/brand-spec` | **Absent** | Présent | **Merger en PR kit dédiée** |
| `packages/app-runtime` | **Absent** | Présent (`composeBrandOs`, `installBrandOsDesktop`, …) | **Merger en PR kit dédiée** |
| `packages/factory` `--from-prd` / generators | **Absent** (factory classique seulement) | Présent + évolué vs #24 | **PR factory** après brand-spec/app-runtime |
| `electron-shell` session desktop, Meili feed générique, ensure-kit-binaries, vendor hermes/n8n | Partiel (cutover existant) | **Enrichi massivement** | **PR electron-shell** découpée ; vendor install scripts = attention taille/licence |
| `apps/tempoflow3` | **Absent** (`apps/` = console, demobrand) | 113 fichiers app CHR | **Extraire** → repo `tempoflow3`, **pas** garder durablement dans monorepo kit |
| Docs expérience | #23 mergé | + preuves/journaux/mini-PRDs/ADR | Cherry-pick docs preuves utiles ; éviter doublons conflictuels |
| Gates `scripts/test-os-*.mjs`, `test-phase-factory-prd*.mjs` | Partiel | Nombreux ajouts | Suivre les PR kit correspondantes |
| Mergeability | — | **CONFLICTING** avec main | Rebase/découpe obligatoire |

**Ce que TF3 apporte d’unique (valeur réelle)**

1. **Contrats OS mince** : BrandSpec YAML + `app-runtime` (compose OS, main mince, UI plane).  
2. **Factory from-prd** : brief → scaffold métier (F0–F5+) — au-delà de demobrand notes.  
3. **Session desktop dans le kit** (`createDesktopSessionStore` / IPC) vs jumeaux marque.  
4. **Sonde `apps/tempoflow3`** + preuves Linux (`proof:hard` 81/81, `proof:oracle` 37/37 — déclarés dans la PR).  
5. **Vendor Hermes/n8n côté kit** (intention ADR no-brand-domain) — à valider (poids, bins Linux vs Win).

**Ce qui n’est pas unique / déjà SoT**

- Cutovers packages natifs (déjà sur `main`).  
- Doc protocole oracle (déjà #23).  
- Parité produit complète 0.10.26 (oracle SUCCESS ≠ feature parity — documenté sur la branche).

### C.2 tempoflow2 vs nouvelle archi

| Critère | État TF2 `main` | Gap |
|---------|-----------------|-----|
| Consomme `@creezio/*` via vendor | **Oui** — 18 packages, `architectureVersion: H6` | — |
| `kitSha` | `9c474c2` (2026-07-31) | = tip **code** creezio main ; seuls #22/#23 docs après → **resync non bloquant** pour code |
| BrandSpec / `@creezio/brand-spec` | Non | Gap post-merge kit |
| `@creezio/app-runtime` / main mince | Non — `crm/electron/` ~25 fichiers, `local-config-store` shim | Gap **volontaire** tant que gold stable ; migration incrémentale |
| Factory `--from-prd` | N/A (app existante) | Pas requis pour TF2 gold |
| Remplacer par TF3 | **Non** — TF3 = rebuild parallèle | Conserver TF2 + aligner kit progressivement |

### C.3 Certivan / Fidu

| Critère | Certivan | Fidu |
|---------|----------|------|
| Vendor `kitSha` | `9c474c2` H6 | `9c474c2` H6 |
| Cutovers natifs sur main | Oui (PRs mergées) | Oui |
| BrandSpec / app-runtime | Non | Non |
| Branches agents mortes | ~15–18 remote à purger | ~15 remote à purger |
| Attention | Working tree **dirty (D)** local | OK |

---

## D. Plan cible (recommandation)

1. **`creezio` `main` = SoT archi**  
   - Découper #25 en PRs kit **sans** `apps/tempoflow3` :  
     (a) `brand-spec` + ADR, (b) `app-runtime`, (c) `electron-shell` session/OS/binaries, (d) `factory --from-prd` (+ gates), (e) docs/preuves kit.  
   - **Fermer #24** une fois (d) porté depuis tip TF3 (pas depuis tip #24 obsolète).  
   - **Ne pas** merger #25 tel quel (half-state + conflits + app dans monorepo + Windows non shippable).

2. **Nouveau repo `creezio/tempoflow3`** (après a–d sur main, ou en parallèle dès que deps `@creezio/*` publiées/vendorables)  
   - Extraire `apps/tempoflow3` + scripts preuve + docs expérience marque.  
   - Dépendances workspace/`file:` ou vendor sync comme TF2.  
   - CI : `npm test`, `proof:oracle`, `proof:hard` Linux ; Win = job dédié plus tard.  
   - Relation TF2 : **frère**, pas fork silencieux — oracle comportement = archive 0.10.26 ; archi = tip kit.

3. **`tempoflow2` `main` aligné archi**  
   - Resync vendor après chaque PR kit mergée.  
   - Adoption BrandSpec/app-runtime = **chantier séparé**, gated gold (`test:fidu`-équivalent TF / smokes métier) — pas big-bang.

4. **Cleanup branches mortes**  
   - Après inventaire sign-off : delete remote `cursor/native-*`, `integrate-*`, cutovers marques, factory tip une fois absorbé.  
   - Garder `tempoflow3-create-457d` jusqu’à extraction + PRs kit vertes, puis archive tag + delete.

5. **CV / Fidu sync**  
   - Même cadence vendor que TF2.  
   - D’abord **réparer/clarifier dirty Certivan local**.  
   - BrandSpec seulement quand kit stable sur main.

---

## E. Liste de tâches ordonnée (P0 → P3)

### P0 — Stabiliser la lecture / ne pas casser

| ID | Tâche | Done falsifiable | Dépendances | Effort |
|----|-------|------------------|-------------|--------|
| P0.1 | **Geler** merges #24/#25 ; communiquer « découpe only » | Les 2 PR restent draft ; commentaire audit lié | — | S |
| P0.2 | Tag annoté `archive/tf3-probe-65b9273` sur creezio pointant `65b9273` | `git tag -l` montre le tag ; tip branch inchangé | — | S |
| P0.3 | Investiguer **Certivan dirty** (13 D) : restore ou commit intentionnel | `git status` clean sur certivan `main` **ou** doc incident | — | S |
| P0.4 | Reproduire gates TF3 en lecture (checkout worktree) : `proof:hard` / `npm test` app | Log local attaché au ticket ; pas de push | P0.2 | M |

### P1 — SoT kit sur `main` (découpe #25)

| ID | Tâche | Done falsifiable | Dépendances | Effort |
|----|-------|------------------|-------------|--------|
| P1.1 | PR **brand-spec** (+ ADR `ADR-brand-spec-app-runtime`) sans app | Mergée sur main ; `packages/brand-spec` build/test | P0.1 | M |
| P1.2 | PR **app-runtime** (compose/install/start) | Mergée ; demobrand ou harness smoke vert | P1.1 | M |
| P1.3 | PR **electron-shell** (session desktop, kit binaries, Meili feed générique) — **sans** dumps inutiles si revue licence/taille Hermes | Mergée ; gates shell existants + nouveaux ciblés verts | P1.2 | L |
| P1.4 | PR **factory `--from-prd`** depuis tip TF3 (pas #24) + gates `test-phase-factory-prd*.mjs` | `creezio new-app --from-prd …` produit sandbox hors monorepo ; 11/11 (ou équivalent tip) | P1.1–P1.3 | L |
| P1.5 | Cherry-pick **docs** preuves/ADR factory utiles (sans conflit #23) | Docs sur main ; PR #24 fermée « superseded » | P1.4 | S |
| P1.6 | Fermer #25 comme « superseded by P1.x + extract repo » | PR #25 closed avec lien | P1.5 + P2.1 | S |

### P2 — Repo `tempoflow3` + coexistence TF2

| ID | Tâche | Done falsifiable | Dépendances | Effort |
|----|-------|------------------|-------------|--------|
| P2.1 | Créer `creezio/tempoflow3` ; importer arbre app (pas le kit) ; README relation TF2/oracle | Repo existe ; `main` build ; deps `@creezio/*` résolues | P1.2+ (idéalement P1.4) | M |
| P2.2 | CI Linux : test + proof oracle/hard | Checks verts sur `main` TF3 | P2.1 | M |
| P2.3 | Resync vendor **tempoflow2** → tip creezio post-P1 | `SYNC.json` kitSha = tip main code ; smokes TF2 verts | P1.3+ | M |
| P2.4 | Plan migration TF2 → app-runtime (stubs/jumeaux) **sans** casser gold | Doc + 1er shim optionnel mergé **ou** explicit « defer » daté | P2.3 | L |

### P3 — Cleanup + sync marques

| ID | Tâche | Done falsifiable | Dépendances | Effort |
|----|-------|------------------|-------------|--------|
| P3.1 | Delete remote branches creezio `cursor/native-*`, `integrate-native-kit`, `factory-from-prd` (après P1.6) | `git ls-remote` sans ces refs | P1.6 | S |
| P3.2 | Delete remote cutovers certivan/fidu (`cursor/*` listés §B) | Idem sur les 2 repos | P0.3 | S |
| P3.3 | Resync vendor Certivan + Fidu + smoke minimal | SYNC kitSha aligné ; pas de régression tests OS paths | P2.3 | M |
| P3.4 | Windows TF3 : machine Win réelle + bins kit win (hors scope actuel) | Verdict Win mis à jour (PASS ou FAIL honnête) | P2.2 | L |

---

## F. Prochaines actions concrètes (5–10)

1. Commenter sur PR #25 / #24 : pointer ce doc ; **pas de merge**.  
2. Tag `archive/tf3-probe-65b9273`.  
3. Clarifier le working tree Certivan (restore vs intention).  
4. Ouvrir worktree TF3 ; noter résultats `proof:hard` / tests (baseline).  
5. Ouvrir PR kit **P1.1 brand-spec** depuis extrait de `65b9273`.  
6. Enchaîner P1.2 → P1.3 → P1.4 (factory tip, pas #24).  
7. Fermer #24 « superseded ».  
8. Créer repo `tempoflow3` seulement après deps kit sur main (P2.1).  
9. Resync vendor TF2 ; garder gold.  
10. Purger branches `cursor/*` mortes (P3.1–P3.2).

---

## Références mesurées

| Item | Valeur |
|------|--------|
| creezio `main` | `cb60082` — `docs(experience): protocole TempoFlow3 — oracle 0.10.26 (#23)` |
| TF3 tip | `65b9273` — `docs(tf3): verdict Windows honnête + pack:win + fix UI/icons` |
| Merge-base main…TF3 | `440dc97` (#22) ; TF3 behind main = 1 (#23) |
| Factory tip | `33bbdfa` ; ancêtre de TF3 |
| Brands kitSha | `9c474c2` / H6 / sync 2026-07-31 |
| `creezio/tempoflow3` GitHub | **absent** |
| PR #25/#24 | draft, CONFLICTING |

---

---

## G. Statut exécution (session 2026-08-02)

| ID | Statut | Preuve |
|----|--------|--------|
| P0.1 | **DONE** | Commentaires PR [#25](https://github.com/creezio/creezio/pull/25#issuecomment-5158955110) / [#24](https://github.com/creezio/creezio/pull/24#issuecomment-5158955183) — superseded by progressive extract ; PRs laissées ouvertes |
| P0.2 | **DONE** | Tag annoté `archive/tf3-probe-65b9273` → `65b9273` poussé sur `origin` |
| P0.3 | **DONE** | Certivan : 13 deletes **accidentels** (fichiers présents sur HEAD, working tree only) → `git restore` ; `main` clean |
| P0.4 | deferred | Pas rejoué `proof:hard` cette session (focus extract kit) |
| P1.1 | **MERGED** | PR [#26](https://github.com/creezio/creezio/pull/26) → `main` |
| P1.3 | **MERGED** | PR [#27](https://github.com/creezio/creezio/pull/27) → `main` (shell avant runtime pour deps) |
| P1.2 | **MERGED** | PR [#28](https://github.com/creezio/creezio/pull/28) → `main` |
| P1.4 | **IN PR** | `extract/factory-from-prd` — tip #25 (pas #24) + brand CLI + gates |
| P2 | blocked on P1 | Repo `creezio/tempoflow3` non créé |

### Inventaire `cursor/*` creezio (aucune delete)

| Branche | Classification | Action |
|---------|----------------|--------|
| `tempoflow3-create-457d` | **unique @ 65b9273** (taggé) | Garder jusqu’à extract |
| `factory-from-prd-457d` | **only in 65b9273** (ancêtre) | Garder jusqu’à extract factory |
| `native-shell-ui-sot-457d` | tip commit orphelin ; **contenu fully in main** (P-shell.5 identique) | OK delete plus tard (P3) |
| `integrate-native-kit` + `native-*-sot` + `pshell5` | **fully in main** (`ahead=0`) | OK delete P3 |

*Fin audit — livrable doc + exécution P0/P1 en cours.*

