# État des lieux — intention OS Creezio (post-O11, arbitrage ×3)

| | |
|--|--|
| **Date** | 2026-07-30 |
| **Baseline mesurée** | kit `b5b8735` tip · TF `ffb76bb` (0.10.33) · CV `8f3a88f` (0.1.16) · Fidu `8d85b1e` (0.1.65) |
| **SoT intention** | [ARCHITECTURE-INTENTION.md](ARCHITECTURE-INTENTION.md) · [MATRICE-NATIVE-METIER-PLUGIN.md](MATRICE-NATIVE-METIER-PLUGIN.md) · R0 |
| **Plans fermés (≠ 100 % intention)** | M16 · N9 · O11 (~76 % auto-déclaré sur sous-ensemble) |
| **Ce doc** | Règle ×3 · carte piliers → écart réel → dettes → Plan P* jusqu’à intention |

> **Interdit de lire ceci comme un audit MCP.** MCP est **un pilier parmi
> d’autres**. Le fil conducteur = *plateforme porte tout le commun ; marques =
> minimum métier ; zéro jumeau plateforme*.

---

## 0. Règle d’arbitrage UNIQUE (intention première)

**Si une fonctionnalité existe (ou existait avant nos cassures) dans les TROIS
projets TempoFlow + Certivan + Fidu → c’est NATIF plateforme (`@creezio/*`),
avec config optionnelle si besoin.**

| Cas | Verdict |
|-----|---------|
| Présent ×3 (même forme divergente) | **NATIF** — extraire / éteindre jumeaux locaux |
| Présent ×2 + 3ᵉ feature-off / absent UI mais store/dep kit | **NATIF** + config optionnelle (pas « métier ») |
| Spécifique à **une seule** marque | **MÉTIER** (panier TF, RTI/VASP CV, GED/Pennylane Fidu, …) |

**Conséquences verrouillées (plus jamais de « questions bloquantes ») :**

- Tasks / kanban ×3 → **NATIF** (même sans config connue ; kanban+AI/Hermes inclus).
- Cockpit + onboarding / setup ×3 → **NATIF shell**.
- Product Hub / plugins / fabrique, Fleet, Mails, Auth UI, Assistant surfaces,
  Database UI, Search / sidebar / workspace → **NATIF** dès que ×3 (preuve §B).
- `features.plugins/fleet=false` (Fidu) = **config optionnelle**, pas un trou
  produit ni une invitation à reclasser en métier.
- `resolveBrandDbPath` / `resolvePluginDbPath` peu utilisés = **dette adoption
  API** (P02), pas une question ouverte.

Les anciennes « 5 questions bloquantes » (§B trous) étaient une **erreur de
cadrage**. Elles sont **retirées** ; chaque point est tranché par preuve code
ci-dessous.

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
   (+ UI kanban kit) alors que TF/CV gardent `src/lib/tasks.ts` ~725 LOC
   (+ runners IA jumelés) et Fidu un autre jumeau (`cabinet-tasks` + kanban local).

5. **Audits successifs recentrés sur le dernier chantier** (MCP O4r, host O7,
   vocabulaire O9) → on re-mesure un sous-ensemble et on re-publie ~76 %.

6. **Cadrage faux « est-ce métier ? »** sur des surfaces ×3 (tasks, cockpit,
   onboarding…) → paralysie artificielle. **Corrigé par §0.**

**Conclusion :** on n’est pas à 76 % d’un OS presque fini. On est à **socle
packages largement créé**, avec une **dette transversale massive** :
*les marques ne sont pas encore des compositions minces*.

---

## B. Verdict ×3 — surfaces plateforme (mesure 2026-07-30)

Légende présence : **local** = code marque encore SoT UI/HTTP ; **kit** =
consomme `@creezio/*` ; **off** = feature flag / UI absente mais capacité
plateforme ; **twin** = TF↔CV sim≥0,85.

| Feature | TF | CV | Fidu | Verdict | Où ça vit aujourd’hui | Cassé / jumeau par cutovers ? |
|---------|----|----|------|---------|------------------------|-------------------------------|
| **Tasks / kanban (+ AI/Hermes)** | local `tasks.ts` 725 + routes 597 + `ai-task-*` ~1,3 k + `task-runs` 556 ; page `/taches` | twin TF (sim≈0,99) | routes 487 + `cabinet-tasks` 303 + `taches-kanban-client` 411 + `ai-task-runner` 635 + `task-runs` 515 | **NATIF** | Kit : `@creezio/tasks` store/API + `tasks/ui` kanban **partiel** ; marques = **jumeaux locaux** (Fidu forme divergente) | Oui — extraction store sans extinction UI/HTTP ; kanban riche resté brand |
| **Cockpit (server shell)** | `server-cockpit-shell` 926 + client 490 + routes 81 | twin TF (sim≈0,98) | **pas d’UI cockpit** (admin host kit seulement) | **NATIF shell** | Local TF/CV ; kit `electron-shell` admin-window partiel ; Fidu = trou **parité** (pas métier) | Oui — jamais extrait ; Fidu non parité |
| **Onboarding / setup** | onboarding ~2,8 kLOC + routes 309 + `setup-wizard` 484 | onboarding + routes 309 + setup 484 (twin setup sim≈0,94) | onboarding ~2,2 kLOC + routes 76 + setup 484 (sim setup≈0,93 ×3) | **NATIF shell** | **100 % local ×3** ; rien d’équivalent complet dans `shell-ui` | Oui — jamais extrait (setup quasi identique ×3) |
| **Product Hub / plugins HTTP** | `plugin-products` 846 + thin hub lib | twin 851 | store kit monté ; **pas** de route `plugin-products` ; `features.plugins=false` | **NATIF** (+ config) | Kit `@creezio/product-hub` ; HTTP/UI admin encore local TF/CV | Oui — store cutover, routes restées twin |
| **Fabrique plugins** | 0 conso runtime | 0 | 0 | **NATIF** | Kit + demobrand/console seulement | Non cassé — **jamais shippé** marques (dette P10) |
| **Fleet** | `fleet-collector` ~1,3 kLOC + tracker UI + telemetry | twin collector ~1,3 kLOC | `features.fleet=false` ; vendor/settings kit présents | **NATIF** (+ config) | Kit `platform-core`/`shell-ui`/`observability` partiel ; collector encore marque TF/CV | Oui — dualité collector ; Fidu off volontaire N5 = config |
| **Mails** | `mail-inbox` 420 + routes email 147 ; store kit | twin | store kit monté ; **pas d’UI mail** | **NATIF** (+ config UI) | `@creezio/mails` ; UI inbox encore twin TF/CV | Oui — store cutover, UI non éteinte / Fidu sans UI |
| **Auth / login UI** | `login-form` 299 | twin 299 (sim≈0,97) | 294 (sim≈0,73 vs TF) | **NATIF** | `@creezio/auth` store ; UI login **locale ×3** ; `shell-ui/ui/auth` quasi vide | Oui — credentials kit, chrome login resté brand |
| **Assistant surfaces** | routes 763 + mounts brand | twin 763 | routes 406 (plus mince) | **NATIF** | `@creezio/assistant` runtime kit ; HTTP/routes encore brand | Oui — chat-db kit, routes twin/partiel |
| **Database UI** | `admin-database` ~20 (façade) + kit panels | idem | idem | **NATIF** | `@creezio/database` moteur+UI kit (M2p) ; policy encore teintée TF | Partiel OK ; dette vocabulaire policy |
| **Search global** | `global-search-provider` 507 | twin 507 | 503 (sim≈0,93) | **NATIF** | Hosts kit `global-search*` partiels ; provider **local ×3** | Oui — jumeau non éteint |
| **Sidebar / nav shell** | sidebar 1026 | 999 (sim≈0,87) | 895 | **NATIF** | `@creezio/shell-ui` nav adapters ; sidebar CRM **locale ×3** | Oui |
| **Workspace / tabs** | tab-workspace 1113 + shell 241 | twin ~1114 / 241 | 1042 / 243 (sim≈0,85–0,96) | **NATIF** | kit `shell-ui/ui/workspace/*` partiel ; context **local ×3** | Oui |
| **Boot Electron** | `creezio-boot.ts` 90 | 91 | 85 | **NATIF** | Composition encore locale ×3 | Mineur — wiring acceptable court terme ; cible = kit |
| **MCP façade** | host-tools + oauth twin | server monolith | GED tools hors factory | **NATIF** (façade) | `@creezio/mcp-facade` ; résidus brand | Oui — unification O4r incomplète |
| **n8n provisioning plugins** | ~315 twin | twin | — | **NATIF** (hub) | Encore brand TF/CV | Oui |

### Métier (une seule marque) — hors extraction kit

| Feature | Marque | Preuve |
|---------|--------|--------|
| Panier, dispatch, relevés, catalogue, scan, supplier-tabs | **TF only** | modules TF |
| RTI / VASP / dossiers pièces atelier | **CV only** | modules Certivan |
| GED, Pennylane, contacts/cabinet métier, relances | **Fidu only** | modules Fidu |

### Anciens « trous » — réponses par preuve (plus de questions)

| Ancien trou | Réponse |
|-------------|---------|
| Tasks kanban AI/Hermes natif ou vertical ? | **NATIF.** ×3 (TF/CV twin + Fidu kanban/routes/AI). Kit a déjà store + UI kanban partielle. Extraire gold TF, éteindre locaux, aligner Fidu. |
| Cockpit / setup / onboarding shell ou marque ? | **NATIF shell.** Setup-wizard sim≥0,93 ×3 ; onboarding ×3 ; cockpit TF+CV twin, Fidu = dette parité shell. |
| Fleet-collector kit ou infra hors repo ? | **NATIF ops** → SoT kit/console ; marques = flag + samples. |
| Fidu `plugins/fleet=false` permanent ? | **Config optionnelle** plateforme (N5). Capacité reste native ; on peut réactiver sans reclasser métier. |
| `resolveBrand/PluginDbPath` absents ? | **Dette adoption P02** — API kit existe ; runtime marques encore sur alias `resolveDbPath`. Pas bloquant produit pour classer les surfaces. |

---

## C. Carte de l’intention première (piliers)

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
| P09 | Product Hub | Lifecycle plugins, ACL L3, control-plane, store `core.db` | `product-hub` + host CP | evidence FS ; **config** on/off | sidecars |
| P10 | Fabrique plugins | Intention→PRD→scaffold | `product-hub` (+ console/demobrand) | consommation runtime (à shipper) | résultat |
| P11 | Observabilité | Activité / usages / CP | `observability` | mounts / pas de 2ᵉ moteur | events |
| P12 | Automations lifecycle | plugin/org/factory/obs triggers | `automations` (**≠** DB row-level) | — | — |
| P13 | Database admin + auto row-level | Browse/CRUD/views + automations données | `database` | `configureDatabasePolicy` métier | — |
| P14 | Auth | Session, login UI, recovery, core.db | `auth` + shell-ui | branding / JWT ACL si besoin | — |
| P15 | Shell-UI / nav + slots | Nav + sidebar + workspace + cockpit + setup/onboarding + search | `shell-ui` | slots métier + labels | nav plugin |
| P16 | Assistant runtime | Chat, tools plateforme, UI | `assistant` | prompts/Meili/règles déclaratives | tools découverts |
| P17 | API kernel | Façade HTTP cœur + mount modules/plugins | `api-kernel` | modules API métier | APIs plugin |
| P18 | MCP façade | **Un** MCP app : cœur + modules + plugins | `mcp-facade` | factory modules métier | tools plugin |
| P19 | Tasks plateforme | CRUD + **kanban + AI/Hermes** natifs | `tasks` (+ assistant hermes) | **0** jumeau kanban | — |
| P20 | Mails plateforme | Boîte / index générique | `mails` | providers / templates ; UI on/off config | — |
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

---

## D. État réel par pilier (mesure 2026-07-30)

Légende écart : **OK** / **PARTIEL** / **ABSENT produit** / **INVENTÉ à côté** (prototype).

| Pilier | État | Preuve mesurable | Écart vs intention |
|--------|------|------------------|--------------------|
| P01 Identité / multi-exe | **OK** | Manifests + electron-builder ×3 ; Client+Serveur | Mineur (docs packing) |
| P02 SQLite multi-DB | **PARTIEL** | `createSqliteRuntime` ×3 ; `platformCoreMigrations` ; **0** `resolveBrandDbPath` / `resolvePluginDbPath` dans marques | Layout conceptuel kit ; adoption API paths incomplète |
| P03 Shell IPC | **OK** | `@creezio/shell` deps ×3 ; preload mince O7 | — |
| P04 Electron runtime | **PARTIEL** | `electron-shell` ~24,5 kLOC kit ; host sous plafonds O7 ; `creezio-boot.ts` ~85–91 LOC ×3 locaux | Boot jumeau mince |
| P05 Meili | **PARTIEL** | Host kit ; indexeurs métier marques | OK frontière ; vocabulaire TF dans kit (P29) |
| P06 Tunnel | **OK** | Host kit + domaines marque | — |
| P07 n8n | **PARTIEL** | Host kit ; `n8n-plugin-provisioning.ts` ~315 LOC twin TF↔CV | Provisioning encore jumeau marque |
| P08 Hermes | **PARTIEL** | Host kit ; skills marque ; kanban tasks marque jumelé | Couplage tasks/Hermes encore brand |
| P09 Product Hub | **PARTIEL** | Store kit ×3 ; **plugin-products.ts ~846/851 twin TF↔CV** ; Fidu `plugins:false` | Routes HTTP encore locale ; config Fidu OK |
| P10 Fabrique plugins | **INVENTÉ à côté** | demobrand + console **seulement** ; **0** TF/CV/Fidu | À shipper marques (natif, pas option « rester prototype ») |
| P11 Observabilité | **PARTIEL** | Package ~7,2 kLOC ; deps ×3 ; Fidu plus mince | Cutover UI/ops incomplet Fidu |
| P12 Automations lifecycle | **PARTIEL** | Dep ×3 ; surface surtout demobrand / brand-runtime TF | Peu de surface produit |
| P13 Database | **OK** | `@creezio/database` fail-closed ; allowlists métier ×3 marques ; panels locaux absents | — |
| P14 Auth | **PARTIEL** | `@creezio/auth` ; login UI ~294–299 LOC ×3 locaux | UI login à extraire |
| P15 Shell-UI | **PARTIEL** | kit ~10,5 kLOC ; **sidebar / workspace / cockpit / setup / search / onboarding** encore locaux (souvent twin) | **Dette P0** |
| P16 Assistant | **PARTIEL** | kit ~14,4 kLOC ; routes assistant twin TF↔CV ; Fidu plus mince | Surface HTTP encore brand |
| P17 API kernel | **PARTIEL** | Package existe ; modules montés marques | Façade unique pas partout |
| P18 MCP façade | **PARTIEL** | `create*BrandMcp` ×3 ; Fidu GED 16 tools hors factory ; TF host-tools ; CV server monolith | Pas une seule SoT runtime |
| P19 Tasks | **PARTIEL** | kit store+UI partielle ; **jumeaux locaux ×3** (TF/CV twin, Fidu divergent) | **Dette P0** — verdict NATIF tranché |
| P20 Mails | **PARTIEL** | kit mails ; TF/CV inbox twin ; Fidu sans mail UI | Parité UI à rétablir (config ok) |
| P21 Sync / propagation | **OK** | dry-run H6 + kitSha (O10/O11) | — |
| P22 Desktop ship | **OK** | Feeds : TF 0.10.33 · CV 0.1.16 · Fidu 0.1.65 | — |
| P23 Factory / demobrand | **OK kit** | apps/demobrand | Preuve scaffold ≠ marques minces |
| P24 Console | **OK kit** | apps/console | — |
| P25 Fleet | **PARTIEL** | collector twin TF↔CV ; Fidu `fleet:false` | Collector → kit ; flag = config |
| P26 Modules métier | **OK frontière** | symlink `modules`→`electron/modules` ×3 | — |
| P27 Plugins discovery | **PARTIEL** | Host kit ; Fidu feature-off | Config, pas reclassement |
| P28 Anti-jumeau | **ABSENT** | TF↔CV product twins sim≥0.85 : **111 fichiers · ~21,7 kLOC** | **Dette centrale** |
| P29 Kit sans domaine TF | **PARTIEL** | encore `fournisseur*` / `supplier_*` dans packages | Labels/API legacy |

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

## E. Inventaire RESTANT (dettes = écarts piliers)

Sévérité : **P0** = ×3 encore local / bloque marques minces ; **P1** pilier
incomplet ; **P2** hygiene ; **P3** polish.

| ID | Zone (pilier) | Symptôme mesurable | Impact | Sév. | Effort | Dépendances |
|----|---------------|--------------------|--------|------|--------|-------------|
| D-P28a | Shell-UI (P15+P28) | sidebar/workspace/cockpit/setup/onboarding/search twins ~6–8 kLOC+ | Pas CMS ; fix ×2–3 | **P0** | XL | D-GATES |
| D-P19 | Tasks (P19+P08) | `tasks.ts`+routes+`ai-task-*`+`task-runs` TF/CV + jumeau Fidu kanban | Tasks natifs non SoT marques | **P0** | XL | D-GATES ; gold TF |
| D-P09 | Product Hub (P09) | `plugin-products` ~850 twin ; factory 0 marques | Hub HTTP pas SoT | **P0** | L | — |
| D-P16 | Assistant surface (P16) | routes ~763 twin ; mounts ~1 kLOC ×3 | Chat OK kit ; HTTP gras | **P1** | L | P18 |
| D-P18 | MCP (P18) | Fidu GED hors factory ; TF host-tools ; CV monolith | ≠ une liste tools | **P1** | L | D-P09 |
| D-P25 | Fleet (P25) | fleet-collector twin TF↔CV ; Fidu off | Ops pas kit-only | **P1** | M | — |
| P10 | Fabrique (P10) | 0 conso TF/CV/Fidu | Vision non produit | **P1** | L | Ship ≥1 marque |
| D-P20 | Mails (P20) | inbox twin TF↔CV ; absent UI Fidu | Parité mails | **P1** | M | — |
| D-P14 | Auth UI (P14) | login-form ~300 ×3 | UI encore brand | **P2** | M | avec P15 |
| D-P07 | n8n provisioning | ~315 twin | brand SoT | **P2** | M | P09 |
| D-P04 | Boot | `creezio-boot` ~90 ×3 | composition non unique | **P2** | S | — |
| D-P02 | Multi-DB paths | resolveBrand/Plugin quasi 0 | adoption floue | **P2** | M | — |
| D-P29 | Domaine kit | fournisseur*/supplier_* packages | kit ≠ générique | **P2** | L | — |
| D-P11 | Obs Fidu | deps faibles | parité | **P2** | M | — |
| D-P12 | Automations lifecycle | peu hors demobrand | V3 | **P2** | M | — |
| D-P28b | Schemas/oauth MCP | schemas + oauth twin | serveur plateforme brand | **P1** | L | D-P18 |
| D-P28c | Scripts twins | ~14 kLOC | CI ×2 | **P3** | L | après runtime |
| D-GATES | Gates/CI | pas de gate « 0 twin plateforme » | piège 75 % | **P0** | M | avant extract |
| D-MATRICE | Docs | ✅ package ≠ cutover | mensonge cosmétique | **P0** | S | avec D-GATES |

---

## F. Plan d’implémentation par dette (critères falsifiables)

### D-GATES + D-MATRICE (d’abord process)

1. **Done** : gate kit échoue si fichier plateforme (allowlist inverse) encore jumeau TF↔CV sim≥0,85 hors allowlist **métier** ; matrice ✅ seulement si cutover marques prouvé.
2. **Étapes** : `scripts/lib/intention-twins.mjs` + `scripts/test-phase-p0-intention.mjs` ; rewrite légende matrice ; [PHASE-P0.md](PHASE-P0.md).
3. **Preuve** : `npm test` (p0) mesure cutover (jumeau local XOR SoT kit) ; p1/p2 durcissent l’absence.
4. **Ordre** : **avant / en parallèle immédiat** des extractions P0 code.
5. **Risque** : faux positifs métier — allowlist panier/GED/RTI/Pennylane.

### D-P28a — Shell-UI / cockpit / workspace / setup / onboarding / search

1. **Done** : 0 jumeau `sidebar` / `tab-workspace-context` / `server-cockpit-shell` / `setup-wizard` / `onboarding-*` plateforme / `global-search-provider` entre TF et CV ; Fidu consomme les mêmes exports kit ; marques ≤ wiring + slots + steps métier onboarding.
2. **Étapes** : inventaire gold TF → extract `shell-ui` ; cutover TF→CV→Fidu ; delete locaux.
3. **Preuve** : sim path absent ou sim&lt;0,4 ; build×3 ; smoke shell/onboarding.
4. **Ordre** : **P0 code** (avec tasks).
5. **Risque** : slots nav métier — tests nav ×3.

### D-P19 — Tasks natifs complets (kanban + AI/Hermes)

1. **Done** : `tasks.ts` / `ai-task-*` / routes tasks génériques / kanban UI **absents** des marques (ou wrappers ≤ mince) ; SoT `@creezio/tasks` (+ assistant hermes) ; Fidu sans `cabinet-tasks` jumeau.
2. **Étapes** : extract gold TF → kit ; cutover TF→CV→Fidu ; delete.
3. **Preuve** : `test ! -f src/lib/tasks.ts` × TF/CV ; kanban tests verts ×3 ; Fidu `/taches` via kit.
4. **Ordre** : **P0 code** parallèle shell.
5. **Risque** : Hermes sync / AI workspace — smokes existants.

### D-P09 / P10 — Product Hub HTTP + fabrique

1. **Done** : 0 `plugin-products.ts` jumeau ; routes = mount kit ; fabrique **shippée** dans ≥1 marque (config on) — plus de ✅ cosmétique demobrand-only.
2. **Étapes** : extract routes gold TF → product-hub ; cutover ; brancher factory UI/runtime.
3. **Preuve** : tests plugin-product-hub × marques actives ; factory e2e marque.
4. **Ordre** : après P0 shell/tasks (ou juste après gates).
5. **Risque** : grants / n8n tags.

### D-P18 — MCP une SoT

1. **Done** : `listTools` Electron = Hono = assistant ; Fidu GED dans factory modules ; TF host-tools = host-only.
2. **Étapes** : move GED host → factory ; trim CV monolith.
3. **Preuve** : égalité ensembles tools ; smokes MCP ×3.
4. **Ordre** : après D-P09.
5. **Risque** : clients MCP externes (aliases).

### D-P16 / D-P25 / D-P20 / D-P14 / …

Voir tableau §E : done = « jumeau plateforme absent + import kit + test marque »
(ou feature-off **documenté comme config**, jamais comme reclassement métier).

---

## G. Roadmap séquencée — Plan P* (incréments poussables)

**Règles :** une vague = un incrément poussable (kit + marques touchées) ;
façade/re-export ≠ done ; pas de « P(n+1) si gate intention rouge » ;
extraire TF gold ; **règle §0** — **pas** de vague « décisions humaines » sur
les surfaces ×3.

```text
P0  Gates intention + matrice honnête + doc §0     (S)   ← PROCESS
P1  Shell-UI jumeaux (sidebar/workspace/cockpit/     (XL) ← CODE P0
    setup/onboarding/search) → kit + cutover ×3
P2  Tasks+AI+Hermes kanban → kit SoT + extinction    (XL) ← CODE P0
    jumeaux TF/CV/Fidu
P3  Product Hub routes + n8n provisioning            (L)
P4  MCP SoT unique (GED Fidu + trim host)            (L)
P5  Assistant routes + mounts plafonds               (M)
P6  Auth login UI + mails UI parité (config Fidu)    (M)
P7  Fleet collector → kit/ops (flag Fidu reste ok)   (M)
P8  Server twins (schemas, mcp/oauth)                (L)
P9  Boot creezio-boot + multi-DB paths clairs        (M)
P10 Purge vocabulaire TF kit (P29)                   (L)
P11 Obs/automations lifecycle parité marques         (M)
P12 Fabrique plugins shippée ≥1 marque               (L)
P13 Scripts/tests twins hygiene                      (L)
P14 Freeze intention 100 % (checklist §H) + republish (S)
```

**Sessions estimées :** ~**14–18** (plus de branchement sur « si métier » —
tasks/shell sont **toujours** P1–P2).

**Chemin critique :** `P0 → P1 → P2 → P3 → P4 → … → P14`.

---

## H. Critère 100 % intention (checklist cochable)

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

- [ ] Shell-UI : pas de sidebar/cockpit/workspace/setup/onboarding/search plateforme locaux jumelés
- [ ] Auth UI : login générique kit (marque = branding)
- [ ] Tasks : SoT kit **complet** (CRUD + kanban + AI/Hermes) — **pas** de zone grise
- [ ] Mails : UI/API natifs kit ; parité ou feature-off **config** documenté Fidu
- [ ] Database : panels + engine kit + policy sans fuite domaine TF non configurée
- [ ] Product Hub : HTTP/control-plane/store sans route jumeau ; ACL L3
- [ ] Fabrique plugins : **shippée** dans ≥1 marque (plus ✅ demobrand-only)
- [ ] Observabilité + automations lifecycle : consommation réelle ou feature-off config
- [ ] Fleet : SoT kit/ops ; pas de collector jumeau
- [ ] Hosts Meili/tunnel/n8n/Hermes : wiring mince seulement
- [ ] Assistant : runtime kit ; mounts brand plafonnés ; tools via MCP unique
- [ ] API kernel + MCP : une façade ; plugins découverts dans `listTools`
- [ ] Sync vendor H6 + kitSha ×3

### Gold TempoFlow / métier marques

- [ ] Aucune régression features TF (panier, dispatch, relevés, catalogue, scan, supplier-tabs, **kanban natif**)
- [ ] Certivan RTI / Fidu GED : features métier intactes après cutovers

### Process

- [ ] Gate `test-phase-p*-intention` verte
- [ ] Matrice : ✅ seulement si cutover prouvé ; 🟡/❌ sincères
- [ ] Plan P* fermé **sans** redéfinir 100 % comme « gates plan »
- [ ] Republish TF/CV/Fidu post-cutovers runtime

---

## I. Références

- [ARCHITECTURE-INTENTION.md](ARCHITECTURE-INTENTION.md)
- [MATRICE-NATIVE-METIER-PLUGIN.md](MATRICE-NATIVE-METIER-PLUGIN.md)
- [PLAN-P.md](PLAN-P.md)
- [PHASE-R0.md](PHASE-R0.md) · [VISION-V1-V3.md](VISION-V1-V3.md)
- [PLAN-M.md](PLAN-M.md) · [PHASE-M16.md](PHASE-M16.md)
- [PLAN-N.md](PLAN-N.md) · [PHASE-N9.md](PHASE-N9.md)
- [PLAN-O.md](PLAN-O.md) · [PHASE-O11.md](PHASE-O11.md)
- [ADR-assistant-tools-mcp.md](ADR-assistant-tools-mcp.md)
- [ADR-no-brand-domain-in-native-packages.md](ADR-no-brand-domain-in-native-packages.md)

---

*Livrable mesure + arbitrage. Les questions bloquantes sont retirées. Prochaine
vague code = P0 gates puis P1–P2 (shell + tasks).*
