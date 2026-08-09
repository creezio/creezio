# Contributing Brands — gouvernance kit ↔ marques

Comment une marque naît, vit avec le kit, et comment le kit évolue sans
casser sa flotte. Complète [PROPAGATION.md](./PROPAGATION.md) (contrat de
propagation) — ici : le cycle de vie opérationnel et les règles.

## Cycle de vie d'une marque

```
scaffold factory (creezio new-app)
  → repo marque : vendor/creezio pinné (SYNC.json.kitSha) + workflows CI/CD
  → rapport d'impact : workflow Kit compat (dispatch kit-main-green du kit,
    nightly, manuel) — resync éphémère + suite complète, JAMAIS de push
  → mise à jour décidée : workflow Vendor update (workflow_dispatch)
  → deploy : workflow Deploy sur CI verte de main (runner du serveur marque)
```

1. **Scaffold** : `creezio new-app` génère le repo marque complet — dont
   `.github/workflows/{ci,kit-compat,vendor-update,deploy}.yml`,
   `scripts/ci/{kit-compat,vendor-update}.sh` et la gate
   `server/scripts/test-vendor-integrity.mjs`
   (générateur : `packages/factory/src/generators/brand-workflows.ts`).
2. **Registre** : ajouter la marque à [`docs/brands.json`](./brands.json)
   (`repo`, `runnerLabels`, `active: true`) — la CI kit (jobs `brand-matrix`
   et `notify-brands`) ne voit que les marques du registre.
3. **Un serveur par app, un runner par app** : chaque marque vit sur SON
   serveur, avec son runner self-hosted pour kit-compat/vendor-update/deploy
   (pattern : `~/actions-runners/<marque>` + service systemd user, `.env`
   avec `TMPDIR` hors tmpfs — voir les runners existants). Le serveur du
   kit fait tourner `brand-matrix` : banc de test flotte, aucun push.
   Marque sans runner (serveur pas encore câblé) : générer les workflows
   avec `githubHosted: true` (ubuntu-latest) + secret repo
   `CREEZIO_CI_TOKEN` (PAT lisant le kit privé) — seuls kit-compat et
   vendor-update tournent alors sur GitHub-hosted ; le deploy attend le
   runner du serveur de la marque.
4. **Vendor pinné** : `vendor/creezio/SYNC.json` pinne `kitSha` +
   `architectureVersion`. Le vendor est GÉNÉRÉ (README sentinelle posé par le
   sync) — jamais édité à la main.
5. **Rapport d'impact** : le workflow **Kit compat** de la marque compare
   `SYNC.json.kitSha` au tip kit ; en retard → resync ÉPHÉMÈRE (workspace
   jetable) + suite complète, puis met à jour l'issue unique « 📦
   Compatibilité kit — rapport automatique » : ✅ compatible / ❌
   incompatible, commits kit entre pin et tip (breaking mis en avant),
   packages vendorisés touchés, log de la gate en échec. RIEN n'est poussé ;
   un run rouge = échec d'infrastructure uniquement.
6. **Mise à jour décidée** : le développeur lance **Vendor update**
   (workflow_dispatch, input `kit_sha` optionnel) — resync réel + suite
   complète ; vert → commit `[vendor-update] kit X → Y` + push `main`
   (CI + deploy suivent) ; déjà à jour → run vert sans commit.

## Process app → kit (bug ou évolution du kit constaté depuis une marque)

**Jamais de patch dans `vendor/creezio/`.** Ce dossier est écrasé à chaque
resync, et le garde anti-dérive de `scripts/ci/kit-compat.sh` /
`scripts/ci/vendor-update.sh` (marque) refuse de tourner si
`git status --porcelain vendor/` n'est pas vide.

Chemin nominal :

1. reproduire le problème dans un **test kit** (`scripts/test-*.mjs` du repo
   creezio — gate dédiée ou cas ajouté à une gate existante) ;
2. corriger le kit ; `npm run build:packages` ; `npm run test:kit` vert ;
3. PR (ou push main) sur `creezio/creezio` ;
4. la propagation suit le contrat « le kit notifie, l'app rapporte, le dev
   décide » : CI kit verte → `brand-matrix` prouve les marques →
   `notify-brands` dispatch `kit-main-green` → chaque marque publie son
   rapport d'impact (**Kit compat**) → mise à jour par **Vendor update**
   quand le développeur le décide.

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
- `runnerLabels` — où tournent les workflows kit-compat/vendor-update de la
  marque : labels de son runner self-hosted, ou `["ubuntu-latest"]` si la
  marque est GitHub-hosted (pas encore de runner sur son serveur) ;
- `active` — `false` retire la marque de `brand-matrix` + `notify-brands`
  sans perdre sa trace (marque gelée, migration en cours…).
