# État des lieux — intention OS Creezio (post-O11)

| | |
|--|--|
| **Date** | 2026-07-30 |
| **Baseline mesurée** | kit `514555f` · TF `ffb76bb` (0.10.33) · CV `8f3a88f` (0.1.16) · Fidu `8d85b1e` (0.1.65) |
| **SoT intention** | [ARCHITECTURE-INTENTION.md](ARCHITECTURE-INTENTION.md) · [MATRICE-NATIVE-METIER-PLUGIN.md](MATRICE-NATIVE-METIER-PLUGIN.md) · R0 |
| **Plans fermés (≠ 100 % intention)** | M16 · N9 · O11 (~76 % auto-déclaré sur sous-ensemble) |
| **Ce doc** | Carte piliers → écart réel → dettes → Plan P* jusqu’à intention |

> **Interdit de lire ceci comme un audit MCP.** MCP est **un pilier parmi
> d’autres**. Le fil conducteur = *plateforme porte tout le commun ; marques =
> minimum métier ; zéro jumeau plateforme*.

---

## A. Pourquoi on n’avance pas (causes structurelles)

Cinq freezes (M16, N9, O11 + audits) ressortent ~75 % pour les **mêmes raisons** :

1. **Done = package kit existe + gate verte**, pas « marque = minimum métier ».
   La matrice marque ✅ dès qu’un `@creezio/*` est présent et syncable — alors
   que TF/CV gardent encore des **dizaines de kLOC** de plateforme locale
   (shell UI, tasks kanban, plugin-products, oauth MCP, cockpit…).

2. **Chaque plan redéfinit « 100 % » comme la fin de *son* chemin critique.**
   M* = modules/cutovers ciblés ; N* = hosts/assistant/migrations ; O* =
   anti-façades + host mince + quelques jumeaux. Aucun plan n’a pris comme
   gate la checklist **intention §4** (CMS complet + marques sans jumeaux).

3. **Extraction sans extinction.** On porte TF → kit, on sync vendor, on laisse
   la copie marque « pour ne pas casser ». Résultat : **double SoT** (kit +
   brand). Les gates O8 interdisent les façades ≤40 LOC, pas les jumeaux
   500–1100 LOC.

4. **Matrice ✅ ≠ consommation produit.** Ex. fabrique conversationnelle ✅
   (demobrand/console) mais **0** usage dans TF/CV/Fidu ; `@creezio/tasks` ✅
   alors que TF/CV gardent `src/lib/tasks.ts` ~725 LOC (+ runners IA jumelés).

5. **Audits successifs recentrés sur le dernier chantier** (MCP O4r, host O7,
   vocabulaire O9) → on re-mesure un sous-ensemble et on re-publie ~76 %.

**Conclusion :** on n’est pas à 76 % d’un OS presque fini. On est à **socle
packages largement créé**, avec une **dette transversale massive** :
*les marques ne sont pas encore des compositions minces*.

---

## B. Carte de l’intention première (piliers)

Source : ARCHITECTURE-INTENTION §1–4 + matrice §1–3 + R0/VISION (prototypes ≠ SoT).

| # | Pilier | Rôle | Kit | Marque | Plugin |
|---|--------|------|-----|--------|--------|
| P01 | Identité / multi-exe | Manifest Client+Serveur+publish, feeds, bridge | `brand-config`, tooling | data branding, secrets feeds | — |
| P02 | SQLite multi-fichiers | `core` / `brand` / `plugin/<id>` jour 0 | `platform-core` runtime | schéma métier brand + seeds | DB à l’install |
| P03 | Shell IPC / DesktopBridge | Canaux preload, API desktop | `shell` | bindings noms marque | — |
| P04 | Runtime Electron | Boot, updater, tray, splash, window | `electron-shell` | wiring mince + labels | — |
| P05 | Host Meili | Search launcher + index plateforme | `electron-shell` | indexeurs / schémas métier | — |
| P06 | Host tunnel | URLs / service tunnel | `electron-shell` + platform-core | domaine marque | — |
| P07 | Host n8n | Runtime embed n8n | `electron-shell` | hooks ≤ mince | sidecars tags |
| P08 | Host Hermes | Runtime agent central | `electron-shell` | skills métier | — |
| P09 | Product Hub | Lifecycle plugins, ACL L3, control-plane, store `core.db` | `product-hub` + host CP | evidence FS, UI admin marque si besoin | sidecars |
| P10 | Fabrique plugins | Intention→PRD→scaffold | `product-hub` (+ console/demobrand) | consommation runtime | résultat |
| P11 | Observabilité | Activité / usages / CP | `observability` | mounts / pas de 2ᵉ moteur | events |
| P12 | Automations lifecycle | plugin/org/factory/obs triggers | `automations` (**≠** DB row-level) | — | — |
| P13 | Database admin + auto row-level | Browse/CRUD/views + automations données | `database` | `configureDatabasePolicy` métier | — |
| P14 | Auth | Session, login, recovery, core.db | `auth` | JWT/ACL brand si besoin | — |
| P15 | Shell-UI / nav + slots | Nav native + slots métier | `shell-ui` | remplissage slots + labels | nav plugin |
| P16 | Assistant runtime | Chat, tools plateforme, UI | `assistant` | prompts/Meili/règles déclaratives | tools découverts |
| P17 | API kernel | Façade HTTP cœur + mount modules/plugins | `api-kernel` | modules API métier | APIs plugin |
| P18 | MCP façade | **Un** MCP app : cœur + modules + plugins | `mcp-facade` | factory modules métier | tools plugin |
| P19 | Tasks plateforme | CRUD tasks natifs (+ kanban/AI **si** natif) | `tasks` (+ parts assistant) | **pas** de jumeau kanban | — |
| P20 | Mails plateforme | Boîte / index générique | `mails` | providers / templates marque | — |
| P21 | Sync vendor / propagation | Kit→marques, semver, registres | scripts + `propagation` | wrappers sync | org registry |
| P22 | Desktop ship | remote-build, publish, feeds | `desktop-tooling` | packing marque | — |
| P23 | Factory new-app | Scaffold Client+Serveur | `factory` + demobrand | — | — |
| P24 | Console ops | Versions, feeds, gates, factory demo | `apps/console` | — | — |
| P25 | Fleet / ops telemetry | Agent flotte, samples, settings | `observability` + `platform-core` + `shell-ui` | feature flag / samples métier | — |
| P26 | Modules métier | API+MCP+nav+data **marque** | **contrats seulement** | TF/CV/Fidu modules | — |
| P27 | Couche plugins orga | Sidecars ACL, data isolée, discovery façades | hub + host | feature on/off | **plugins** |
| P28 | Anti-jumeau plateforme | Transversal : 0 copie plateforme dans marques | gates + extract | delete cutover | — |
| P29 | Kit sans domaine marque | Capacités génériques ; labels via config | ADR no-brand-domain | i18n / configure* | — |

### Hors scope volontaire (docs — ne pas compter comme dette 100 %)

- Auto-promotion plugin → module marque
- Univers perso hors org
- Cloud registry multi-tenant

### Trous documentaires (ne pas inventer)

| Trou | Question à poser |
|------|------------------|
| **Tasks kanban AI/Hermes** (`tasks.ts` ~725 + `ai-task-*` ~1,3 kLOC × TF/CV) | Natif kit (extraction) ou « vertical produit » TF/CV ? L’intention dit *tasks plateforme* mais le gold TF est un kanban riche Hermes/AI. |
| **Cockpit / server-cockpit / setup-wizard / onboarding** | Shell natif à extraire, ou UI marque acceptable ? Matrice ne tranche pas fichier par fichier. |
| **Fleet-collector scripts** (~1,3 kLOC × TF/CV) | Doivent vivre dans kit/console ops, ou infra hors repos marques ? |
| **Fidu `features.plugins/fleet=false`** | Permanent produit ou dette temporaire N5 ? |
| **`resolveBrandDbPath` / `resolvePluginDbPath` quasi absents des marques** | Adoption multi-DB incomplète, ou API legacy `resolveDbPath` encore SoT runtime ? |

---

## C. État réel par pilier (mesure 2026-07-30)

Légende écart : **OK** / **PARTIEL** / **ABSENT produit** / **INVENTÉ à côté** (prototype).

| Pilier | État | Preuve mesurable | Écart vs intention |
|--------|------|------------------|--------------------|
| P01 Identité / multi-exe | **OK** | Manifests + electron-builder ×3 ; Client+Serveur | Mineur (docs packing) |
| P02 SQLite multi-DB | **PARTIEL** | `createSqliteRuntime` ×3 ; `platformCoreMigrations` ; **0** `resolveBrandDbPath` / `resolvePluginDbPath` dans marques | Layout conceptuel kit ; adoption API paths incomplète (trou doc) |
| P03 Shell IPC | **OK** | `@creezio/shell` deps ×3 ; preload mince O7 | — |
| P04 Electron runtime | **PARTIEL** | `electron-shell` 24,5 kLOC kit ; host-stack/ctx/preload **sous plafonds O7** ; `creezio-boot.ts` ~85–91 LOC ×3 encore locaux | Boot jumeau + `main.ts` ~340–354 encore composition marque |
| P05 Meili | **PARTIEL** | Host kit ; indexeurs métier marques | OK frontière ; cohérence indexer TF vocabulaire dans kit (P29) |
| P06 Tunnel | **OK** | Host kit + domaines marque | — |
| P07 n8n | **PARTIEL** | Host kit ; `n8n-plugin-provisioning.ts` ~315 LOC twin TF↔CV | Provisioning encore jumeau marque |
| P08 Hermes | **PARTIEL** | Host kit ; skills marque ; kanban tasks marque jumelé | Couplage tasks/Hermes encore brand |
| P09 Product Hub | **PARTIEL** | Store kit `createSqliteProductHubStore` ×3 ; ACL tests ; **plugin-products.ts ~846/851 LOC twin TF↔CV** ; Fidu sans route (feature-off) | Routes HTTP / UI admin encore plateforme locale |
| P10 Fabrique plugins | **INVENTÉ à côté** | `createConversationalPluginFactory` : demobrand + console **seulement** ; **0** dans TF/CV/Fidu | R0 : prototype ≠ SoT produit marques |
| P11 Observabilité | **PARTIEL** | Package 7,2 kLOC ; deps ×3 ; usage TF/CV riche, Fidu mince | Pas un 2ᵉ moteur ; cutover UI/ops incomplet Fidu |
| P12 Automations lifecycle | **PARTIEL** | Dep ×3 ; usage runtime surtout brand-runtime TF | Peu de surface produit hors demobrand |
| P13 Database | **OK / PARTIEL** | `@creezio/database` 3,9 kLOC ; configure policy ×3 ; panels locaux absents (M2p) | Policy/whitelist encore teintée TF (`fournisseur` dans kit whitelist) |
| P14 Auth | **PARTIEL** | `@creezio/auth` ; login UI ~299 LOC twin TF↔CV↔Fidu | UI login / users encore locaux |
| P15 Shell-UI | **PARTIEL** | kit 10,5 kLOC ; imports nombreux ; **sidebar ~900–1026**, **workspace ~1,3–1,4 kLOC**, **cockpit TF/CV ~1,4 kLOC** encore locaux et jumelés | Nav slots OK conceptuellement ; shell CRM encore jumeau |
| P16 Assistant | **PARTIEL** | kit 14,4 kLOC SoT chat ; mounts brand ~1,1–1,3 kLOC ×3 ; routes assistant ~763 twin TF↔CV | Runtime kit ; surface HTTP/UI encore brand |
| P17 API kernel | **PARTIEL** | Package existe ; modules montés marques | Façade unique pas encore « seule entrée » partout |
| P18 MCP façade | **PARTIEL** | `create*BrandMcp` + bind Hono ×3 ; résidus : Fidu GED host **16 tools** hors factory ; TF `hono-host-tools` 429 LOC ; CV server 754 LOC | Unifié en intention O4r* ; pas une seule SoT runtime |
| P19 Tasks | **PARTIEL** | kit `@creezio/tasks` ; **TF/CV `tasks.ts` 725 + routes 597 + ai-task-* ~1,9 kLOC jumelés** ; Fidu routes 487 sans `tasks.ts` | Intention « tasks natifs » non réalisée côté marques TF/CV |
| P20 Mails | **PARTIEL** | kit mails ; TF/CV `mail-inbox` 420 twin ; Fidu sans mail UI | Parité multi-marque absente |
| P21 Sync / propagation | **OK** | dry-run H6 + kitSha (O10/O11) | — |
| P22 Desktop ship | **OK** | Feeds O11 : TF 0.10.33 · CV 0.1.16 · Fidu 0.1.65 | Process standing OK |
| P23 Factory / demobrand | **OK kit** | apps/demobrand 1,7 kLOC | Preuve scaffold ; pas preuve marques minces |
| P24 Console | **OK kit** | apps/console 1,7 kLOC | — |
| P25 Fleet | **PARTIEL** | fleet-* dans observability/platform-core/shell-ui ; **fleet-collector scripts ~1,3 kLOC twin TF↔CV** ; Fidu feature-off | Collecteur / agent encore dupliqués marques |
| P26 Modules métier | **OK frontière** | symlink `modules`→`electron/modules` ×3 (M10) ; métier dans marque | — |
| P27 Plugins discovery | **PARTIEL** | Host runtime kit (N1) ; Fidu feature-off ; factory pas en prod marques | Discovery façade plugins ≠ complète produit |
| P28 Anti-jumeau | **ABSENT** | TF↔CV product twins sim≥0.85 : **111 fichiers · ~21,7 kLOC** (hors scripts) ; + scripts tests/fleet ~14 kLOC | **Dette centrale** |
| P29 Kit sans domaine TF | **PARTIEL** | ADR ; encore `fournisseur*` 201 hits / `fournisseurId` 91 / `supplier_*` 88 dans `packages/` src | Labels/API legacy |

### Chiffre jumeaux (ne pas omettre)

| Périmètre | Fichiers | LOC (TF) |
|-----------|---------:|---------:|
| TF↔CV même path sim≥0.85 **produit** (`src/`+`electron/`) | 111 | **~21 650** |
| dont UI shell-ish (layout/cockpit/workspace/mail/setup/desktop/search) | ~18+ | **~6 500+** |
| dont lib tasks/AI/onboarding/oauth/n8n | ~10+ | **~5 000+** |
| dont server (assistant/tasks/plugin-products/mcp/schemas) | ~18 | **~5 700** |
| Scripts/tests/fleet-collector twins | ~67 | **~14 000** |
| `modules/` duplique `electron/modules` | — | **Non** — symlink M10 ✅ |

---

## D. Inventaire RESTANT (dettes = écarts piliers)

Sévérité : **P0** bloque l’intention « marques minces » ou casse gold TF ;
**P1** pilier produit incomplet ; **P2** hygiene/parity ; **P3** polish.

| ID | Zone (pilier) | Symptôme mesurable | Impact | Sév. | Effort | Dépendances |
|----|---------------|--------------------|--------|------|--------|-------------|
| D-P28a | Anti-jumeau / Shell-UI (P15+P28) | sidebar/workspace/cockpit/setup/search twins ~6–8 kLOC TF↔CV | Chaque fix UI ×2–3 ; pas CMS | **P0** | XL | Clarifier trou cockpit/onboarding |
| D-P19 | Tasks (P19+P08) | `tasks.ts`+routes+`ai-task-*`+`task-runs` ~3,2 kLOC × TF/CV | Tasks natifs non SoT ; Fidu divergent | **P0** | XL | Question kanban Hermes |
| D-P09 | Product Hub (P09) | `plugin-products.ts` ~850 LOC twin TF↔CV ; factory 0 marques | Hub pas SoT HTTP ; fabrique hors prod | **P0** | L | P10 décision produit |
| D-P16 | Assistant surface (P16) | routes assistant ~763 twin ; mounts ~1,2 kLOC ×3 | Chat OK kit ; HTTP/brand encore gras | **P1** | L | P18 |
| D-P18 | MCP (P18) | Fidu 16 tools GED Hono hors factory ; TF host-tools 429 ; CV mcp/server 754 | Assistant/Electron/Hono ≠ une liste | **P1** | L | D-P09 modules API |
| D-P25 | Fleet (P25) | fleet-collector + builds electron fleet-* encore marques ; Fidu off | Ops flotte pas kit-only | **P1** | M | Feature-flag Fidu |
| P10 | Fabrique (P10) | 0 consommation TF/CV/Fidu | Vision Notion non produit | **P1** | L | Décision : ship marques ou rester demobrand |
| D-P20 | Mails (P20) | mail-inbox twin TF↔CV ; absent Fidu | Parité mails native cassée | **P1** | M | — |
| D-P14 | Auth UI (P14) | login-form ~300 twin ×3 | Auth kit + UI encore brand | **P2** | M | P15 extract |
| D-P07 | n8n provisioning (P07+P09) | `n8n-plugin-provisioning.ts` ~315 twin | Plugins n8n encore brand SoT | **P2** | M | P09 |
| D-P04 | Boot (P04) | `creezio-boot.ts` ~90 ×3 | Composition boot pas unique | **P2** | S | — |
| D-P02 | Multi-DB paths (P02) | resolveBrand/Plugin quasi 0 | Intention multi-fichiers floue runtime | **P2** | M | Clarifier trou paths |
| D-P29 | Domaine kit (P29) | fournisseur*/supplier_* centaines hits packages | Kit ≠ générique | **P2** | L | Cookies `persist:fournisseur` |
| D-P11 | Obs Fidu (P11) | deps faibles vs TF/CV | Parité obs | **P2** | M | N5 feature-off |
| D-P12 | Automations lifecycle prod (P12) | peu de surface hors demobrand | V3 prototype | **P2** | M | R0 |
| D-P28b | Schemas/oauth MCP (P17/P18) | `schemas.ts` 823 + `mcp/oauth.ts` ~800 twin | Plateforme serveur encore brand | **P1** | L | D-P18 |
| D-P28c | Scripts twins (P28) | ~14 kLOC tests/fleet scripts TF↔CV | CI/maintenance ×2 | **P3** | L | Après runtime |
| D-GATES | Gates/CI | Gates valident absences ciblées, pas « 0 twin plateforme » | Reproduit le piège 75 % | **P0** | M | Avant freeze P* |
| D-MATRICE | Docs | Matrice ✅ packages ≠ intention satisfaite | Mensonge cosmétique | **P0** | S | Avec D-GATES |

---

## E. Plan d’implémentation par dette (critères falsifiables)

### D-GATES + D-MATRICE (d’abord)

1. **Done** : gate kit qui échoue si un fichier plateforme listé (allowlist inverse) existe encore en jumeau TF↔CV sim≥0,85 hors allowlist métier ; matrice n’utilise ✅ que si *cutover marques* prouvé.
2. **Étapes** : `scripts/test-phase-p0-intention.mjs` ; rewrite légende matrice.
3. **Preuve** : `npm test` rouge sur HEAD actuel (dette visible) puis vert vague par vague.
4. **Ordre** : **avant toute extraction P\***.
5. **Risque** : faux positifs métier — allowlist explicite panier/GED/RTI.

### D-P28a — Shell-UI / cockpit / workspace

1. **Done** : 0 jumeau `sidebar` / `tab-workspace-context` / `server-cockpit-shell` / `setup-wizard` / `global-search-provider` entre TF et CV ; imports `@creezio/shell-ui` ; marques ≤ wiring + slots.
2. **Étapes** : inventaire gold TF → extract packages shell-ui ; cutover TF→CV→Fidu ; delete.
3. **Preuve** : sim path absent ou sim&lt;0,4 ; build×3 ; smoke shell.
4. **Ordre** : après D-GATES ; avant D-P14 UI.
5. **Risque** : casse nav métier slots — tests nav TF/CV/Fidu.

### D-P19 — Tasks natifs complets

1. **Done** : **après réponse utilisateur** sur le trou kanban : soit (A) `tasks.ts`+ai-task+routes absents marques et SoT `@creezio/tasks` (+assistant hermes), soit (B) documentés **métier** dans matrice (alors retirer « tasks natifs riches » de l’intention).
2. **Étapes** : ne pas coder avant décision ; si A → extract gold TF.
3. **Preuve** : `test ! -f src/lib/tasks.ts` × marques concernées + tests kanban verts.
4. **Ordre** : bloquant P0 parallèle shell.
5. **Risque** : casse Hermes sync / AI workspace.

### D-P09 / P10 — Product Hub HTTP + fabrique

1. **Done** : 0 `plugin-products.ts` jumeau ; routes = mount kit ; décision écrite : fabrique **shippée** dans ≥1 marque **ou** matrice ❌ volontaire produit.
2. **Étapes** : extract routes gold TF → product-hub ; cutover ; brancher factory ou documenter hors-scope produit.
3. **Preuve** : tests plugin-product-hub × marques actives ; factory e2e ou doc ❌.
4. **Ordre** : après D-GATES ; avant D-P18 plugins tools.
5. **Risque** : grants / n8n tags.

### D-P18 — MCP une SoT

1. **Done** : `listTools` Electron = Hono = assistant pour modules+plugins ; Fidu GED tools **dans** `createFiduModuleMcpTools` (ou alias legacy documentés + un seul handler) ; TF host-tools = host-only sans jumeau `module.*`.
2. **Étapes** : move GED host → factory ; trim CV monolith ; garder open_external_tab host-only.
3. **Preuve** : test égalité ensembles tools ; smokes MCP ×3.
4. **Ordre** : après D-P09 (APIs modules stables).
5. **Risque** : clients MCP externes (aliases legacy).

### D-P16 — Assistant surfaces

1. **Done** : routes assistant génériques kit ; brand mount ≤ plafond LOC (ex. 400) prompts/rules only.
2. **Étapes** : extract `src/server/routes/assistant.ts` commun.
3. **Preuve** : routing/active-surface ×3 ; LOC mounts.
4. **Ordre** : après D-P18 tools stables.
5. **Risque** : SSE / cookies session.

### D-P25 — Fleet

1. **Done** : collector/agent SoT kit ou console ; marques = feature flag + samples métier ; Fidu décision on/off documentée.
2. **Étapes** : move `scripts/fleet-collector` → kit/ops ; cutover.
3. **Preuve** : 0 twin collector ; tests fleet.
4. **Ordre** : après shell ; peut suivre Product Hub.
5. **Risque** : télémétrie prod.

### D-P20 / D-P14 / D-P04 / D-P07 / D-P28b / D-P29 / D-P02 / D-P11 / D-P12

Voir tableau §D : chacun a un done falsifiable du type « fichier jumeau absent + import kit + test marque ».

---

## F. Roadmap séquencée — Plan P* (incréments poussables)

**Règles :** une vague = un incrément poussable (kit + marques touchées) ;
façade/re-export ≠ done ; pas de « P(n+1) si gate intention rouge » ;
extraire TF gold ; **questions trous avant code** sur D-P19 / cockpit / fabrique / Fidu fleet.

```text
P0  Gates intention + matrice honnête          (S)   ← BLOQUANT PROCESS
P1  Décisions trous (tasks/cockpit/fabrique/Fidu fleet/paths)  (S)  ← HUMAIN
P2  Shell-UI jumeaux (sidebar/workspace/cockpit/setup/search) (XL)
P3  Tasks+AI+Hermes kanban (si décision A)     (XL)
P4  Product Hub routes + n8n provisioning      (L)
P5  MCP SoT unique (GED Fidu + trim host)      (L)
P6  Assistant routes + mounts plafonds         (M)
P7  Auth login UI + mails UI parité            (M)
P8  Fleet collector → kit/ops + Fidu flag      (M)
P9  Server twins (schemas, mcp/oauth)          (L)
P10 Boot creezio-boot + multi-DB paths clairs  (M)
P11 Purge vocabulaire TF kit (P29)             (L)
P12 Obs/automations lifecycle parité marques   (M)
P13 Scripts/tests twins hygiene                (L)
P14 Freeze intention 100 % (checklist §G)      (S) + republish
```

**Sessions estimées (ordre de grandeur, 1 session ≈ 1 vague poussée) :**
~**14–20 sessions** selon réponses P1 (si tasks restent « métier », P3 saute
mais la matrice doit le dire — sinon on ment encore).

**Chemin critique :** `P0 → P1 → P2 → (P3) → P4 → P5 → P6 → … → P14`.

---

## G. Critère 100 % intention (checklist cochable)

Si **un** item reste ouvert → **pas** 100 %.

### Intention structurelle

- [ ] Commun uniquement dans `@creezio/*` ; marques = data + modules API/MCP/nav + config/labels/branding
- [ ] **0** jumeau plateforme TF↔CV (sim≥0,85) hors allowlist métier explicite
- [ ] **0** façade/re-export « done » (même ≤40 LOC)
- [ ] Paperclip mort (déjà vrai)
- [ ] Domaine TF absent des API/labels kit (aliases dépréciés = liste fermée + plan suppression)
- [ ] SQLite `core`/`brand`/`plugin/<id>` : chemins + runtime utilisés clairement (doc + code alignés)
- [ ] Multi-exe Client+Serveur+publish par marque (déjà vrai) + feeds à jour après cutovers runtime

### Piliers natifs — cutover marques

- [ ] Shell-UI : pas de sidebar/cockpit/workspace/setup/search plateforme locaux jumelés
- [ ] Auth UI : login générique kit (marque = branding)
- [ ] Tasks : SoT kit **ou** reclassement matrice explicite (plus de zone grise)
- [ ] Mails : UI/API natifs kit ; parité ou feature-off documenté Fidu
- [ ] Database : panels + engine kit (déjà) + policy sans fuite domaine TF non configurée
- [ ] Product Hub : HTTP/control-plane/store sans route jumeau ; ACL L3
- [ ] Fabrique plugins : **shippée** dans marques **ou** ❌ volontaire produit (pas ✅ cosmétique)
- [ ] Observabilité + automations lifecycle : consommation réelle ou feature-off
- [ ] Fleet : SoT kit/ops ; pas de collector jumeau
- [ ] Hosts Meili/tunnel/n8n/Hermes : wiring mince seulement
- [ ] Assistant : runtime kit ; mounts brand plafonnés ; tools via MCP unique
- [ ] API kernel + MCP : une façade ; plugins découverts dans `listTools`
- [ ] Sync vendor H6 + kitSha ×3

### Gold TempoFlow

- [ ] Aucune régression features TF (panier, dispatch, relevés, catalogue, scan, supplier-tabs, kanban selon décision)
- [ ] Certivan RTI / Fidu GED : features métier intactes après cutovers

### Process

- [ ] Gate `test-phase-p*-intention` verte
- [ ] Matrice : ✅ seulement si cutover prouvé ; 🟡/❌ sincères
- [ ] Plan P* fermé **sans** redéfinir 100 % comme « gates plan »
- [ ] Republish TF/CV/Fidu post-cutovers runtime

---

## H. Références

- [ARCHITECTURE-INTENTION.md](ARCHITECTURE-INTENTION.md)
- [MATRICE-NATIVE-METIER-PLUGIN.md](MATRICE-NATIVE-METIER-PLUGIN.md)
- [PHASE-R0.md](PHASE-R0.md) · [VISION-V1-V3.md](VISION-V1-V3.md)
- [PLAN-M.md](PLAN-M.md) · [PHASE-M16.md](PHASE-M16.md)
- [PLAN-N.md](PLAN-N.md) · [PHASE-N9.md](PHASE-N9.md)
- [PLAN-O.md](PLAN-O.md) · [PHASE-O11.md](PHASE-O11.md)
- [ADR-assistant-tools-mcp.md](ADR-assistant-tools-mcp.md)
- [ADR-no-brand-domain-in-native-packages.md](ADR-no-brand-domain-in-native-packages.md)

---

*Fin du livrable mesure. Aucune implémentation métier dans ce commit — doc + roadmap seulement.*
