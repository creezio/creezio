# Contributing Brands — gouvernance kit ↔ apps consommatrices

Comment une app naît, vit avec le kit, et comment le kit évolue sans casser
ses consommateurs. Complète [PROPAGATION.md](./PROPAGATION.md) (contrat de
propagation) — ici : le cycle de vie opérationnel et les règles.

**Modèle open source PULL** : le kit ne connaît pas ses consommateurs
(potentiellement 100+ apps, dont des apps d'autres développeurs). Pas de
registre central, pas de notification, pas de test des apps dans la CI kit.
Le kit publie sur `main` avec changelog + `ARCHITECTURE_VERSION` + codemods ;
chaque app tire la dernière version QUAND ELLE LE DÉCIDE, mesure l'impact
chez elle (kit-compat) et applique la mise à jour par un geste explicite
(vendor-update).

## Cycle de vie d'une app

```
scaffold factory (creezio new-app)
  → repo app : vendor/creezio pinné (SYNC.json.kitSha) + workflows CI/CD
  → rapport d'impact : workflow Kit compat (manuel + cron hebdo, choix de
    l'app) — resync éphémère + suite complète, JAMAIS de push
  → mise à jour décidée : workflow Vendor update (workflow_dispatch)
  → deploy : workflow Deploy sur CI verte de main (runner du serveur app)
```

1. **Scaffold** : `creezio new-app` génère le repo app complet — dont
   `.github/workflows/{ci,kit-compat,vendor-update,deploy}.yml`,
   `scripts/ci/{kit-compat,vendor-update}.sh` et la gate
   `server/scripts/test-vendor-integrity.mjs`
   (générateur : `packages/factory/src/generators/brand-workflows.ts`).
2. **Un serveur par app, un runner par app** : chaque app vit sur SON
   serveur, avec son runner self-hosted pour kit-compat/vendor-update/deploy
   (pattern : `~/actions-runners/<app>` + service systemd user, `.env`
   avec `TMPDIR` hors tmpfs — voir les runners existants).
   App sans runner (serveur pas encore câblé, dev tiers sans infra) :
   générer les workflows avec `githubHosted: true` (ubuntu-latest) + secret
   repo `CREEZIO_CI_TOKEN` (token lisant le repo kit) — seuls kit-compat et
   vendor-update tournent alors sur GitHub-hosted ; le deploy attend le
   runner du serveur de l'app.
   **Deploy depuis le SERVEUR de l'app** (pattern winhub, repris par
   tempoflow3) : la source d?ploy?e est le clone local du brand root ? le
   registre d'instances `docker-data/servers.json` est gitignor?, donc
   ABSENT d'un checkout runner (`--brand-root .` depuis le checkout casse
   `server-docker update`). Le job deploy rebuilde aussi le kit AVANT tout
   build (`git merge --ff-only origin/main` puis `npm ci && npm run
   build:packages` dans le clone kit du serveur) : un pull du clone kit
   sans rebuild laisse un dist stale et la garde `assert-runtime-dist`
   refuse ? ? juste titre ? le build d'image.
   **Update `--backup` : sudo requis pour le runner.** Les fichiers de
   `docker-data/servers/<nom>/` sont écrits par les conteneurs (root, y
   compris des secrets en mode 600) et `docker-data/backups/` appartient à
   root : le tar de snapshot lancé par l'utilisateur du runner échoue en
   `Permission denied` et l'update est annulé (échec propre, rien touché).
   Le job deploy lance donc les étapes `server-docker update` en
   `sudo -n env "PATH=$PATH" node …` — l'utilisateur du runner doit avoir
   sudo NOPASSWD sur le serveur (constat tempoflow-vps, runner `deploy`).
3. **Vendor pinné** : `vendor/creezio/SYNC.json` pinne `kitSha` +
   `architectureVersion`. Le vendor est GÉNÉRÉ (README sentinelle posé par le
   sync) — jamais édité à la main.
4. **Rapport d'impact (pull)** : le workflow **Kit compat** de l'app compare
   `SYNC.json.kitSha` au tip kit ; en retard → resync ÉPHÉMÈRE (workspace
   jetable) + suite complète, puis met à jour l'issue unique « 📦
   Compatibilité kit — rapport automatique » : ✅ compatible / ❌
   incompatible, commits kit entre pin et tip (breaking mis en avant),
   packages vendorisés touchés, log de la gate en échec. RIEN n'est poussé ;
   un run rouge = échec d'infrastructure uniquement. Déclencheurs : manuel
   + cron hebdo par défaut — l'app ajuste ou retire le cron librement.
5. **Mise à jour décidée** : le développeur de l'app lance **Vendor update**
   (workflow_dispatch, input `kit_sha` optionnel) — resync réel + suite
   complète ; vert → commit `[vendor-update] kit X → Y` + push `main`
   (CI + deploy suivent) ; déjà à jour → run vert sans commit.


## Consommation npm (doctrine cible — remplace le vendoring)

Voir [NPM-DISTRIBUTION.md](./NPM-DISTRIBUTION.md). Résumé app :
`.npmrc` (registry GitHub Packages + `CREEZIO_NPM_TOKEN`), deps
`"@creezio/<pkg>": "^0.4.0"`, mise à jour par `npm update "@creezio/*"`.
Les workflows `kit-compat` / `vendor-update` et les scripts
`install-server-deps` / symlinks trackés sont **SUPPRIMÉS** (côté kit —
les apps migrent une à une, cf. feat/npm-consumption de tempoflow3).
## Process app → kit (bug ou évolution du kit constaté depuis une app)

**Jamais de patch dans `node_modules/@creezio/`.** Ces packages sont
réinstallés à chaque `npm ci` — un fix se fait dans le repo kit, publié,
puis consommé par `npm update "@creezio/*"`.

Chemin nominal :

1. reproduire le problème dans un **test kit** (`scripts/test-*.mjs` du repo
   creezio — gate dédiée ou cas ajouté à une gate existante) ;
2. corriger le kit ; `npm run build:packages` ; `npm run test:kit` vert ;
3. PR (ou push main) sur `creezio/creezio` ;
4. chaque app verra le correctif dans son prochain rapport **Kit compat**
   et le récupérera via **Vendor update** quand son développeur le décide.

## Breaking change — définition

Est breaking (et exige le process ci-dessous) tout changement qui casse une
app à jour de son wiring :

- contrats `BrandMeiliFeed`, `gate.mjs` (gates module colocalisées),
  manifest `brand-spec` ;
- migrations SQL dont le schéma impacte le métier app ;
- signatures/exports publics `@creezio/*` consommés par le wiring app ;
- plus généralement : tout ce qui justifie un bump d'`ARCHITECTURE_VERSION`
  (`packages/platform-core/src/architecture-version.ts`).

## Checklist codemod (bump `ARCHITECTURE_VERSION`)

C'est CE contrat qui protège les 100+ apps : un breaking change est
versionné et livre sa migration automatique.

1. bump de la valeur dans
   `packages/platform-core/src/architecture-version.ts` ;
2. codemods de migration dans `scripts/codemods/<nouvelleVersion>/`
   (`manifest.json` + scripts idempotents, contrat :
   [`scripts/codemods/README.md`](../scripts/codemods/README.md)) — la gate
   `scripts/test-phase-arch-codemod.mjs` REFUSE un bump sans manifest ;
   la marque applique les codemods lors de sa montée de version npm ;
3. ADR dans [`docs/adr/`](./adr/) documentant le breaking change ;
4. le commit de bump apparaîtra surligné ⚠️ dans le rapport kit-compat de
   chaque app — la mise à jour reste son choix, la migration est fournie.
