# Creezio — OS desktop & serveur pour marques

Creezio est un **kit plateforme** (monorepo `@creezio/*`) : un « OS » complet
d'application métier — auth, shell UI, API, MCP, assistant IA, tâches, mails,
observabilité, plugins, runtime Electron, serveur Docker headless — que des
**marques** (TempoFlow, Certivan, Fidu…) consomment en y ajoutant uniquement
leur métier vertical. Une nouvelle marque se crée depuis un brief produit,
sans réécrire le socle.

## Architecture en bref

```
                      ┌──────────────────────────────┐
                      │        kit creezio           │
                      │  packages/@creezio/* (24)    │
                      └──────────────┬───────────────┘
                                     │  sync vendor (crm/vendor/creezio)
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
   marque A (tempoflow3)        marque B (certivan)          marque C (fidu)
   métier + BrandSpec           métier + wiring              métier + wiring

Chaque marque se déploie en 4 modes (même code) :
 1. Desktop Electron complet   — startBrandDesktop, embeds locaux (SQLite,
                                 Hermes, n8n, Meilisearch)
 2. Serveur Docker headless    — creezio server-docker, kernel harness sans
                                 Electron, CRM servi en HTTP
 3. Client desktop « thin »    — Electron remote-only pointé sur un serveur
                                 (defaultServerUrl)
 4. Sidecar navigateur IA      — Chromium piloté par CDP (browser-host) pour
                                 les sessions web des agents
```

Détails : [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Quickstart

```bash
npm install
npm run build:packages   # tsc tous les packages + dual CJS
npm run test:kit         # gates pures kit — doivent être 100 % vertes
```

Suites de tests complémentaires (voir [scripts/README.md](./scripts/README.md)) :
`npm run test:brands` (nécessite les repos marque synchronisés, skip auto sinon)
et `npm run test:env` (gates lourdes opt-in).

## Commandes clés

```bash
# Créer une app depuis un brief produit (PRD)
npx creezio new-app --from-prd <PRD.md> --out apps/<id> --force

# Créer/mettre à jour une marque depuis un BrandSpec YAML
npx creezio brand apply --spec brand-spec/
npx creezio brand doctor --spec brand-spec/

# Démo jetable du kit
npx creezio demo-app

# Serveur Docker headless multi-instances (+ console admin)
npx creezio server-docker create --brand-root <racine-marque> --name server-1
npx creezio server-docker admin up
npx creezio server-docker admin add-brand <racine-marque>

# Propagation kit → marques
npm run kit:impact -- --package=@creezio/platform-core
npm run kit:version -- --package=@creezio/shell --bump=patch
```

Toute app générée = **2 repos** : le monorepo marque (`server/` métier +
Docker, `client/` desktop thin remote-only, `brand-spec/` + `vendor/creezio/`
partagés à la racine) **et** un repo admin dédié privé `<brand>-admin`
(app admin de la marque : flotte, support, billing…) — voir
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Les 24 packages

| Package | Rôle |
|---------|------|
| `brand-config` | AppManifest : identité desktop, feeds, GUID, publish |
| `shell` | Preload / IPC contracts / DesktopBridge |
| `platform-core` | Paths, SQLite multi-fichier (`core`/`brand`/`plugin`), embeds env |
| `product-hub` | Product Hub, ACL plugins, PRD factory |
| `api-kernel` | Façade HTTP `/api/v1` (core/platform/modules/plugins) |
| `mcp-facade` | MCP unifié, OAuth, host tools |
| `auth` | Session, login, recovery |
| `shell-ui` | Nav + chrome CRM UI (React) |
| `os-ui` | Surfaces Next OS natives (mails, tâches, setup, admin…) matérialisées dans les marques |
| `onboarding` | Setup first-run + moteur d'onboarding |
| `cockpit` | UI server-cockpit (shell autonome + client CRM) |
| `assistant` | Chat / Hermes Work / tools IA |
| `tasks` | Kanban + missions IA |
| `mails` | Inbox mails |
| `observability` | Ops, fleet, analytics, request-logs |
| `automations` | Lifecycle automations plugins/org |
| `database` | Admin Database CRUD |
| `electron-shell` | Host Electron : boot, updater, tray, plugins, sidecars, Meili |
| `browser-host` | Chromium serveur IA (CDP, driver `external_*`, screencast) |
| `app-runtime` | Façade marque n°1 : `startBrandDesktop` / kernel harness / compose OS |
| `brand-spec` | BrandSpec YAML (SoT déclaratif marque) + doctor |
| `desktop-tooling` | Publish desktop, remote-build, after-pack, build-status |
| `factory` | `creezio new-app` / `brand apply` / `server-docker` |
| `propagation` | Semver, impact kit→marques, registre org |

Index détaillé : [docs/PACKAGES.md](./docs/PACKAGES.md) — chaque package a son
trio `README.md` / `AGENTS.md` / `docs/FILES.md`.

`apps/console` = console ops du parc ; `apps/demobrand` = sandbox kit (pas un
produit client).

## Documentation

| Entrée | Contenu |
|--------|---------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Modes de déploiement, boot, admin, navigateur IA, propagation |
| [docs/PACKAGES.md](./docs/PACKAGES.md) | Index de tous les packages |
| [docs/adr/](./docs/adr/) | Décisions d'architecture (ADR) en vigueur |
| [docs/BACKLOG.md](./docs/BACKLOG.md) | Dettes restantes assumées |
| [docs/archive/](./docs/archive/) | Journal historique de construction (ne décrit pas l'état courant) |
| [AGENTS.md](./AGENTS.md) | Guide agents IA (frontières, où modifier, pièges) |

## Frontières

- Le kit est la **source of truth plateforme** ; le métier vertical vit dans
  les repos marque (pas de domaine marque dans `@creezio/*` —
  [ADR](./docs/adr/ADR-no-brand-domain-in-native-packages.md)).
- Isolation DB stricte `core` / `brand` / `plugin/<id>`.
- Les marques consomment le kit via leur `vendor/creezio` racine
  (`scripts/sync-creezio-vendor.sh` ; legacy TF2 : `crm/vendor/creezio`).
