# CREATE-BRAND — interview agent → BrandSpec → app

Guide pour un **agent créateur** qui crée une marque Creezio sans écrire
d'orchestration OS.

## Flux

```text
Interview (questionnaire) → brand-spec/ → creezio brand doctor
                                      → creezio brand apply
                                      → creezio brand smoke
                                      → startBrandDesktop (runtime)
```

## 1. Interview (remplir BrandSpec)

Questions minimales (voir `interview.schema.json`) :

1. Nom produit / brandId / domaine
2. Tagline + utilisateurs cibles
3. Entités cœur + champs
4. Flux métier principal (étapes)
5. Besoins plateforme : Meili / MCP / chat / onboarding
6. Modules métier — chaque module = dossier `modules/<id>/` **4 fichiers**
   (`prd.md`, `interview.md`, `TODO.md`, `CHANGELOG.md`) au standard
   [DOC-STANDARD-MODULE.md](../DOC-STANDARD-MODULE.md). Scaffold :
   `creezio brand module init <id> --app <app>`. L'interview de module
   déclare notamment, pour chaque page UI, les composants du **kit graphique
   imposé** ([DOC-STANDARD-UI.md](../DOC-STANDARD-UI.md)).

Ne **jamais** demander à l'agent d'implémenter des launchers Meili/n8n/Hermes
dans la marque.

Travail multi-agents sur les modules : périmètre de fichiers par agent,
claim des tâches TODO et branches `module/<id>/<tache>` — voir
[DOC-STANDARD-MODULE.md](../DOC-STANDARD-MODULE.md).

## 2. Commandes

```bash
creezio brand init --id acme --name Acme --domain acme.local --vertical generic
# → apps/acme/brand-spec/

# Après remplissage product.md + modules/
creezio brand doctor --spec apps/acme/brand-spec
creezio brand apply --spec apps/acme/brand-spec --out apps/acme --force
creezio brand smoke --app apps/acme
```

## 2b. Layout généré — 2 repos (LA norme)

`creezio brand apply` / `new-app` / `demo-app` génèrent **2 repos** :

```text
<app>/                  # monorepo marque (client + server)
├── brand-spec/     # SoT marque
├── vendor/creezio/ # kit synchronisé — UN SEUL vendor partagé
├── server/         # livrable principal (métier, ui/, harness, Docker)
│   └── vendor -> ../vendor (symlink)
├── client/         # desktop thin remote-only (main client-only, pack, feeds)
│   └── vendor/     # copie hardlink stagée par sync-creezio-vendor.sh
├── docker-data/    # runtime gitignoré (registre servers.json, volumes)
└── package.json    # orchestrateur racine (scripts délégués)

<app>-admin/            # repo ADMIN dédié (privé, jamais public)
├── server-admin.json        # config flotte versionnée SANS secrets
├── fleet-hosts.json         # miroir hôtes enrôlés SANS tokens
├── docker-compose.admin.yml
└── docker-data/             # runtime gitignoré (secrets, tokens)
```

**Pas de `admin/` dans le monorepo marque.** L'app admin complète (OS en mode
admin : flotte, support, billing…) vit dans le repo `<app>-admin` — voir
[../adr/ADR-admin-app-os.md](../adr/ADR-admin-app-os.md).

Le `client/src/electron/main.ts` est **client-only** : pas de
`brand-migrations` / `brand-module-api` (inutiles en `requireRemoteProfile`).
Plus de layout plat.

## 3. Contrat runtime marque

`main.ts` doit rester une **déclaration** :

```ts
import { startBrandDesktop } from "@creezio/app-runtime";
// manifest + bootBrandKernel + meiliFeed + navItems
await startBrandDesktop({ … });
```

Si un besoin OS manque → **gap kit** (`@creezio/app-runtime` /
`electron-shell`), pas de copie dans la marque.

## 4. Anti-triche

| Interdit | Pourquoi |
|----------|----------|
| Templates CHR riches dans factory | Contourne la sonde |
| Sidecar `metier-api.mjs` / `store.json` | Hors contrat SQLite |
| Jumeau `listenBrandKernelHttp` dans main | Contourne la façade |
| UIDs Meili `tf2_*` | Réservés — seuls les UIDs `catalog_*` du kit sont admis |

## 4b. Fichiers métier protégés (`owned-by-brand`)

Après enrichissement manuel (bonus API, UI interactive, migrations riches),
protéger contre `creezio brand apply --force` :

1. **Sources TS/TSX/MD** — première ligne / en-tête :
   `/** creezio:owned-by-brand */`
2. **`package.json`** — `"creezio": { "ownedByBrand": true, … }`  
   → apply **merge** (conserve `creezio.*` + scripts métier, met à jour le shell deps).

Sans marker, `--force` réécrit le fichier avec le template factory (stubs).
Gate : `node --test scripts/test-os-owned-by-brand.mjs`.

Reset clean-room TF3 : `node scripts/reset-tempoflow3.mjs` (backup + apply + build).

## 5. Sonde TempoFlow3

Référence vivante : le repo marque `tempoflow3` (frère du kit —
`brand-spec/` à sa racine) + gates kit
`scripts/test-phase-brand-spec.mjs` / `test-phase-app-runtime.mjs`.
