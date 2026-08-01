# AGENTS — monorepo `creezio`

Guide pour agents IA travaillant sur le kit plateforme `@creezio/*`.

## Mission du repo

Le kit est la **source of truth (SoT)** du socle desktop Creezio (CMS stable) :
auth, shell UI, API, MCP, assistant, tasks, mails, observability, plugins host,
Electron runtime, tooling publish, factory, propagation.

Les marques (`tempoflow2`, `certivan-app`, `fidu`) consomment le kit via
`crm/vendor/creezio` (sync) + wiring métier. **Le métier vertical reste dans les
repos marque.**

## Carte de documentation

| Zone | Doc humaine | Doc agents | Inventaire fichiers |
|------|-------------|------------|---------------------|
| Racine | [README.md](./README.md) | **ce fichier** | [docs/PACKAGES.md](./docs/PACKAGES.md) |
| Chaque `packages/*` | `packages/<pkg>/README.md` | `packages/<pkg>/AGENTS.md` | `packages/<pkg>/docs/FILES.md` |
| Apps | `apps/*/README.md` | `apps/*/AGENTS.md` | `apps/*/docs/FILES.md` |
| Scripts/gates | [scripts/README.md](./scripts/README.md) | [scripts/AGENTS.md](./scripts/AGENTS.md) | [scripts/docs/FILES.md](./scripts/docs/FILES.md) |
| Architecture | [docs/ARCHITECTURE-INTENTION.md](./docs/ARCHITECTURE-INTENTION.md) | — | phases / matrice / gates |

**Règle** : ne pas créer un mega-doc unique — mettre à jour le package concerné.

## Frontières absolues

1. **Pas de domaine marque** dans `@creezio/*` (ADR `ADR-no-brand-domain-in-native-packages.md`).
2. **Kit = SoT plateforme** ; brands = métier + `configure*` / bindings.
3. **Isolation DB** : `core` / `brand` / `plugin/<id>` — deny cross-layer.
4. **Fidu** : `features.plugins` / `features.fleet` peuvent être `false` — ne pas forcer.
5. **Dual-write interdit** : cutovers C* terminés ; pas de shadow brand « en plus » du kit.

## Ordre de build / dépendances

Voir `package.json` script `build:packages`. Ordre typique :

`brand-config` → `shell` → `platform-core` → `product-hub` → `api-kernel` →
`mcp-facade` → `auth` → `shell-ui` → `onboarding` → `cockpit` → `assistant` →
`tasks` → `mails` → `observability` → `automations` → `database` →
`electron-shell` → `desktop-tooling` → `factory` → `propagation` → `build:cjs`.

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
| First-run setup | `onboarding` |
| Server cockpit UI | `cockpit` |
| Chat / Hermes Work / tools | `assistant` |
| Kanban / AI missions | `tasks` |
| Inbox mails | `mails` |
| Ops / fleet / analytics / request-logs | `observability` |
| Automations lifecycle plugins/org | `automations` |
| Admin Database CRUD | `database` |
| Electron host / plugins / sidecars | `electron-shell` |
| Publish / remote-build | `desktop-tooling` |
| `creezio new-app` | `factory` |
| Semver / impact / registre org | `propagation` |

## Tests

```bash
npm test                 # gates phases (505+)
npm run build:packages   # tsc + dual CJS
```

Gates liées aux packages : `scripts/test-phase-*.mjs`. Ne pas « fixer » un gate
en affaiblissant l’assert sans comprendre la dette documentée.

## Plugins Electron — piège connu

Dans `electron-shell` `host/plugins/launcher.ts`, le handler `child.on("exit")`
doit comparer `cur?.child === child` avant `running.delete(id)`, sinon un
restart après PUT files efface le process respawné.

## Propagation vers marques

1. Changer le kit + build.
2. PR kit mergée sur `main`.
3. Côté marque : `CREEZIO_KIT_ROOT=… bash crm/scripts/electron/sync-creezio-vendor.sh`.
4. Adapter wiring / tests marque si l’API publique change.
5. `test:shell` / gates marque.

## Créer une marque depuis un brief produit

Happy path **non technique** (expérience TempoFlow3) :

1. Suivre la suite ordonnée
   [`docs/experiences/tempoflow3/HISTORIQUE-PROMPTS.md`](./docs/experiences/tempoflow3/HISTORIQUE-PROMPTS.md)
   (cadre → bootstrap → **mini-PRDs par onglet**).
2. Bootstrap :

```bash
creezio new-app \
  --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
cd apps/tempoflow3 && npm run test:metier-parcours
```

3. Enrichir **un module à la fois** via `mini-prds/*.md` — jamais en collant
   du code tempoflow2.
4. Si un générique manque → **corriger creezio**, pas le prompt.

Journal : [`JOURNAL-CREATION.md`](./docs/experiences/tempoflow3/JOURNAL-CREATION.md).  
ADR : [`docs/ADR-factory-from-prd.md`](./docs/ADR-factory-from-prd.md).

## Ne pas faire

- Committer des secrets / PAT.
- Extraire du métier TF/CV/Fidu « pour faire joli » dans le kit.
- Modifier `docs/PHASE-*.md` historiques pour cacher une régression (ajouter une note / nouvelle phase).
- Toucher `apps/demobrand` comme produit client — c’est une sandbox kit.
- Réécrire toute la doc dans un seul fichier à la racine.
- Exiger un plan ingénieur (host-stack, sync-vendor, phases P*) pour un brief
  produit : utiliser `--from-prd` à la place.

## Liens rapides

- [docs/PACKAGES.md](./docs/PACKAGES.md) — index de tous les packages
- [docs/MATRICE-NATIVE-METIER-PLUGIN.md](./docs/MATRICE-NATIVE-METIER-PLUGIN.md)
- [docs/PROPAGATION.md](./docs/PROPAGATION.md)
- [docs/ETAT-DES-LIEUX-INTENTION.md](./docs/ETAT-DES-LIEUX-INTENTION.md)
- [docs/experiences/tempoflow3/PROMPT-PRODUIT.md](./docs/experiences/tempoflow3/PROMPT-PRODUIT.md)
- [docs/ADR-factory-from-prd.md](./docs/ADR-factory-from-prd.md)
