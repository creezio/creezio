# Contributing Brands — gouvernance kit ↔ marques

Comment une marque naît, vit avec le kit, et comment le kit évolue sans
casser sa flotte. Complète [PROPAGATION.md](./PROPAGATION.md) (contrat de
propagation) — ici : le cycle de vie opérationnel et les règles.

## Cycle de vie d'une marque

```
scaffold factory (creezio new-app)
  → repo marque : vendor/creezio pinné (SYNC.json.kitSha) + workflows CI/CD
  → resync automatique : workflow Vendor latest (push main marque, dispatch
    kit-main-green du kit, nightly, manuel)
  → deploy : workflow Deploy sur CI verte de main
```

1. **Scaffold** : `creezio new-app` génère le repo marque complet — dont
   `.github/workflows/{ci,vendor-latest,deploy}.yml`,
   `scripts/ci/vendor-latest.sh` et la gate
   `server/scripts/test-vendor-integrity.mjs`
   (générateur : `packages/factory/src/generators/brand-workflows.ts`).
2. **Registre** : ajouter la marque à [`docs/brands.json`](./brands.json)
   (`repo`, `runnerLabels`, `active: true`) — la CI kit (jobs `brand-matrix`
   et `notify-brands`) ne voit que les marques du registre.
3. **Runner self-hosted** : enregistrer un runner par repo marque
   (pattern : `~/actions-runners/<marque>` + service systemd user, `.env`
   avec `TMPDIR` hors tmpfs — voir les runners existants du VPS fluxpro).
4. **Vendor pinné** : `vendor/creezio/SYNC.json` pinne `kitSha` +
   `architectureVersion`. Le vendor est GÉNÉRÉ (README sentinelle posé par le
   sync) — jamais édité à la main.
5. **Resync automatique** : le workflow **Vendor latest** de la marque
   compare `SYNC.json.kitSha` au tip kit ; en retard → resync + suite
   complète ; vert → push `[vendor-resync]` (CI + deploy suivent) ; rouge →
   signal « marque incompatible avec le dernier kit » (rien n'est bloqué).

## Process app → kit (bug ou évolution du kit constaté depuis une marque)

**Jamais de patch dans `vendor/creezio/`.** Ce dossier est écrasé à chaque
resync, et le garde anti-dérive de `scripts/ci/vendor-latest.sh` (marque)
refuse de tourner si `git status --porcelain vendor/` n'est pas vide.

Chemin nominal :

1. reproduire le problème dans un **test kit** (`scripts/test-*.mjs` du repo
   creezio — gate dédiée ou cas ajouté à une gate existante) ;
2. corriger le kit ; `npm run build:packages` ; `npm run test:kit` vert ;
3. PR (ou push main) sur `creezio/creezio` ;
4. la propagation est automatique : CI kit verte → `brand-matrix` prouve les
   marques → `notify-brands` dispatch `kit-main-green` → chaque marque
   resynchronise via **Vendor latest**.

## Breaking change — définition

Est breaking (et exige le process ci-dessous) tout changement qui casse une
marque à jour de son wiring :

- contrats `BrandMeiliFeed`, `gate.mjs` (gates module colocalisées),
  manifest `brand-spec` ;
- migrations SQL dont le schéma impacte le métier marque ;
- signatures/exports publics `@creezio/*` consommés par le wiring marque ;
- plus généralement : tout ce qui justifie un bump d'`ARCHITECTURE_VERSION`
  (`packages/platform-core/src/architecture-version.ts`).

## Checklist codemod (bump `ARCHITECTURE_VERSION`)

1. bump de la valeur dans
   `packages/platform-core/src/architecture-version.ts` ;
2. codemods de migration dans `scripts/codemods/<nouvelleVersion>/`
   (`manifest.json` + scripts idempotents, contrat :
   [`scripts/codemods/README.md`](../scripts/codemods/README.md)) — la gate
   `scripts/test-phase-arch-codemod.mjs` refuse un bump sans manifest, et
   `sync-creezio-vendor.sh` exécute les codemods automatiquement au resync
   d'une marque en version antérieure ;
3. ADR dans [`docs/adr/`](./adr/) documentant le breaking change ;
4. `brand-matrix` verte : le job CI kit synce + teste chaque marque du
   registre contre le kit candidat AVANT `notify-brands` — un kit qui casse
   une marque ne lui est jamais annoncé.

## Registre `docs/brands.json`

SoT des marques de la flotte, consommée par la CI kit :

```json
{
  "brands": [
    { "repo": "creezio/winhub", "runnerLabels": ["self-hosted", "fluxpro"], "active": true }
  ]
}
```

- `repo` — repo GitHub de la marque ;
- `runnerLabels` — labels du runner self-hosted de la marque ;
- `active` — `false` retire la marque de `brand-matrix` + `notify-brands`
  sans perdre sa trace (marque gelée, migration en cours…).
