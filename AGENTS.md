# AGENTS — monorepo `creezio`

Guide pour agents IA travaillant sur le kit plateforme `@creezio/*`.

## Mission du repo

Le kit est la **source of truth (SoT)** du socle desktop Creezio (CMS stable) :
auth, shell UI, API, MCP, assistant, tasks, mails, observability, plugins host,
Electron runtime, tooling publish, factory, propagation.

Les marques (`tempoflow2`, `certivan-app`, `fidu`, `tempoflow3`) consomment le
kit via leur vendor synchronisé (`vendor/creezio` racine ; legacy TF2 :
`crm/vendor/creezio`) + wiring métier. **Le métier vertical reste dans les
repos marque.**

Toute marque générée par la factory est un **monorepo 3 livrables** :
`server/` (métier + Docker), `client/` (desktop thin remote-only, main
client-only), `admin/` (pilotage flotte, config sans secrets), avec
`brand-spec/` + `vendor/creezio/` partagés à la racine et `docker-data/`
runtime gitignoré. Plus de layout plat (détection legacy conservée côté
tooling). Voir [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Carte de documentation

| Zone | Doc humaine | Doc agents | Inventaire fichiers |
|------|-------------|------------|---------------------|
| Racine | [README.md](./README.md) | **ce fichier** | [docs/PACKAGES.md](./docs/PACKAGES.md) |
| Chaque `packages/*` | `packages/<pkg>/README.md` | `packages/<pkg>/AGENTS.md` | `packages/<pkg>/docs/FILES.md` |
| Apps | `apps/*/README.md` | `apps/*/AGENTS.md` | `apps/*/docs/FILES.md` |
| Scripts/gates | [scripts/README.md](./scripts/README.md) | [scripts/AGENTS.md](./scripts/AGENTS.md) | [scripts/docs/FILES.md](./scripts/docs/FILES.md) |
| Architecture | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | [docs/ARCHITECTURE-INTENTION.md](./docs/ARCHITECTURE-INTENTION.md) | [docs/archive/](./docs/archive/) (historique) |

**Règle** : ne pas créer un mega-doc unique — mettre à jour le package concerné.

## Frontières absolues

1. **Pas de domaine marque** dans `@creezio/*` (ADR `ADR-no-brand-domain-in-native-packages.md`).
2. **Kit = SoT plateforme** ; brands = métier + `configure*` / bindings.
3. **Isolation DB** : `core` / `brand` / `plugin/<id>` — deny cross-layer.
4. **Fidu** : `features.plugins` / `features.fleet` peuvent être `false` — ne pas forcer.
5. **Dual-write interdit** : cutovers C* terminés ; pas de shadow brand « en plus » du kit.

## Install-dir data layout (toutes marques)

Packagé (`app.isPackaged`) : **toutes** les données runtime vivent sous
`{installDir}/data/` — pas sous Roaming / `%APPDATA%`.

| Chemin | Contenu |
|--------|---------|
| `{installDir}/data/` | `userData` Electron (`app.setPath`) |
| `{installDir}/data/logs/` | journal main (`{logBasename}.log`) |
| `{installDir}/data/crash-reports/` | JSON crash + `pending/` |
| `{installDir}/data/sqlite/`, embeds… | DB, Hermes/n8n homes, Meili… |

- Windows NSIS : `Local\Programs\<Product>\data\` (writable utilisateur).
- AppImage : `{dirname($APPIMAGE)}/data/` (le mount squashfs est read-only).
- Dev / non packagé : comportement Electron + remap `userDataSegment` inchangé.
- SoT : `resolvePackagedDataDir` / `guessPackagedDataDir` (`@creezio/platform-core`),
  ancré dans `startBrandDesktop` + `prepareDesktopBoot` — la factory/`--from-prd`
  hérite automatiquement via `@creezio/app-runtime`.
- NSIS : crée `$INSTDIR\data` à l’install ; purge optionnelle à la désinstall.
- Ne **pas** documenter Roaming comme lieu des logs pour les builds packagés.

## Ordre de build / dépendances

Voir `package.json` script `build:packages`. Ordre typique :

`brand-config` → `shell` → `platform-core` → `product-hub` → `api-kernel` →
`mcp-facade` → `auth` → `shell-ui` → `os-ui` → `onboarding` → `cockpit` →
`assistant` → `tasks` → `mails` → `observability` → `automations` →
`database` → `browser-host` → `electron-shell` → `brand-spec` →
`app-runtime` → `desktop-tooling` → `factory` → `propagation` → `build:cjs`.

Après changement runtime consommé par les marques : `npm run build:packages` puis
resync vendor (`scripts/sync-creezio-vendor.sh` côté marque, `CREEZIO_KIT_ROOT`).

## Où modifier quoi

| Besoin | Package |
|--------|---------|
| Identité desktop / feeds / GUID | `brand-config` |
| Preload / IPC contracts | `shell` |
| Paths, SQLite multi-fichier, embeds env | `platform-core` |
| Product Hub / ACL plugins / factory PRD | `product-hub` |
| Façade HTTP `/api/v1` | `api-kernel` |
| MCP unifié / OAuth / host tools | `mcp-facade` |
| Session / login / recovery | `auth` |
| Nav + chrome CRM UI | `shell-ui` |
| Pages Next OS (mails/tâches/setup/admin…) matérialisées dans les marques | `os-ui` |
| First-run setup | `onboarding` |
| Server cockpit UI | `cockpit` |
| Chat / Hermes Work / tools | `assistant` |
| Kanban / AI missions | `tasks` |
| Inbox mails | `mails` |
| Ops / fleet / analytics / request-logs | `observability` |
| Automations lifecycle plugins/org | `automations` |
| Admin Database CRUD | `database` |
| Electron host / plugins / sidecars | `electron-shell` |
| Chromium serveur IA (CDP, driver, screencast) | `browser-host` |
| Façade desktop marque (`startBrandDesktop`) | `app-runtime` |
| BrandSpec YAML / doctor | `brand-spec` |
| Publish / remote-build | `desktop-tooling` |
| `creezio new-app` / `creezio brand` | `factory` |
| Serveur Docker headless multi-instances | `docker/server` + `creezio server-docker` |
| Semver / impact / registre org | `propagation` |

## Tests

```bash
npm run test:kit         # gates pures kit (~75) — 100 % vertes partout, fail-fast
npm run test:brands      # gates lisant les repos marque (~55) — skip auto si absents
npm run test:env         # gates lourdes opt-in (cold-warm, factory-prd)
npm test                 # les 133 gates en un node --test (CI complet)
npm run build:packages   # tsc + dual CJS
```

Gates liées aux packages : `scripts/test-phase-*.mjs`. Ne pas « fixer » un gate
en affaiblissant l’assert sans comprendre la dette documentée. Matrice
suite→prérequis : [scripts/README.md](./scripts/README.md).

Workflow : `npm run test:kit` → première rouge → corriger →
`npm run test:kit -- --from <gate>`. Les skips sont toujours explicites
(raison affichée), jamais silencieux.

## Plugins Electron — piège connu

Dans `electron-shell` `host/plugins/launcher.ts`, le handler `child.on("exit")`
doit comparer `cur?.child === child` avant `running.delete(id)`, sinon un
restart après PUT files efface le process respawné.

## Propagation vers marques

1. Changer le kit + build.
2. PR kit mergée sur `main`.
3. Côté marque : `CREEZIO_KIT_ROOT=… bash server/scripts/sync-creezio-vendor.sh`
   (legacy TF2 : `crm/scripts/electron/sync-creezio-vendor.sh`).
4. Adapter wiring / tests marque si l’API publique change.
5. `test:shell` / gates marque.

## Créer une marque (BrandSpec + brief produit)

Chemin nominal agent : interview → `brand-spec/` → `creezio brand apply`
(voir [docs/agents/CREATE-BRAND.md](./docs/agents/CREATE-BRAND.md)).

Compat : `creezio new-app --from-prd` reste supporté.

## Créer une marque depuis un brief produit (legacy --from-prd)

Happy path **non technique** (expérience TempoFlow3) :

1. Partir du brief produit ([`docs/experiences/tempoflow3/PRD-PRODUIT.md`](./docs/experiences/tempoflow3/PRD-PRODUIT.md)
   — fixture factory).
2. Bootstrap :

```bash
creezio new-app \
  --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
cd apps/tempoflow3 && npm run test:metier-parcours
```

3. Enrichir **un module à la fois** via des mini-PRDs — jamais en collant
   du code tempoflow2.
4. Si un générique manque → **corriger creezio**, pas le prompt.

Historique de l'expérience (prompts, journal) : archivé dans le repo
`tempoflow3` (`docs/archive/`).  
ADR : [`docs/adr/ADR-factory-from-prd.md`](./docs/adr/ADR-factory-from-prd.md).

## Ne pas faire

- Committer des secrets / PAT.
- Extraire du métier TF/CV/Fidu « pour faire joli » dans le kit.
- Modifier `docs/archive/PHASE-*.md` historiques pour cacher une régression (ajouter une note / nouvelle phase).
- Toucher `apps/demobrand` comme produit client — c’est une sandbox kit.
- Réécrire toute la doc dans un seul fichier à la racine.
- Exiger un plan ingénieur (host-stack, sync-vendor, phases P*) pour un brief
  produit : utiliser `--from-prd` à la place.

## Liens rapides

- [docs/PACKAGES.md](./docs/PACKAGES.md) — index de tous les packages
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — modes de déploiement, boot, admin
- [docs/MATRICE-NATIVE-METIER-PLUGIN.md](./docs/MATRICE-NATIVE-METIER-PLUGIN.md)
- [docs/PROPAGATION.md](./docs/PROPAGATION.md)
- [docs/BACKLOG.md](./docs/BACKLOG.md) — dettes restantes assumées
- [docs/experiences/tempoflow3/PROMPT-PRODUIT.md](./docs/experiences/tempoflow3/PROMPT-PRODUIT.md)
- [docs/adr/ADR-factory-from-prd.md](./docs/adr/ADR-factory-from-prd.md)
