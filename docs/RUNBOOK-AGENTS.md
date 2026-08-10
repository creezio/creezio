# RUNBOOK AGENTS — opérer l'écosystème Creezio

> **Document de référence opérationnel.** Un agent ou un dev qui débarque lit
> CE fichier et sait opérer tout l'écosystème sans rien redécouvrir.
> Faits vérifiés dans le code et sur les serveurs (2026-08-10). Ton assertif,
> zéro aspiration : si un fait change, corriger ce fichier dans la même PR.

## 1. Topologie

### Serveurs

| Serveur | SSH (depuis le PC Windows) | User | Rôle |
|---|---|---|---|
| **fluxpro-vps** | `ssh fluxpro-vps` | `fidus` | marque **winhub** (+ admin), kit, 3 runners |
| **tempoflow-vps** | `ssh tempoflow-vps` | `deploy` | marque **tempoflow3** (+ admin), kit, runner, registry |

### Chemins

| Chemin | Contenu |
|---|---|
| fluxpro : `/home/fidus/creezio` | clone du kit (branche `main`) |
| fluxpro : `/home/fidus/winhub` | monorepo marque winhub (`server/`, `client/`, `brand-spec/`, `docker-data/` gitignoré) |
| fluxpro : `/home/fidus/winhub-admin` | repo admin winhub (`server-admin.json`, `fleet-hosts.json`) |
| fluxpro : `/home/fidus/actions-runners/{creezio,winhub,winhub-admin}` | runners self-hosted (services systemd user `actions-runner-*.service`) |
| tempoflow : `/opt/docker/creezio` | clone du kit (branche `main`) |
| tempoflow : `/opt/docker/tempoflow3` | monorepo marque tempoflow3 |
| tempoflow : `/opt/docker/tempoflow-admin` | repo admin — remote GitHub `creezio/tempoflow3-admin` (dossier local = ancien nom) |
| tempoflow : `/home/deploy/actions-runners/tempoflow3` | runner self-hosted (`actions-runner-tempoflow3.service`) |
| tempoflow : `127.0.0.1:5000` | registry d'images local (container `creezio-registry`) |

Tunnel-provisioner : fluxpro `:8667`, tempoflow `:8666`
(`CREEZIO_TUNNEL_PROVISION_URL=http://172.17.0.1:<port>` dans les env d'instances).

### Instances prod et domaines

| Instance | Serveur | Container | Port hôte (loopback) | URL |
|---|---|---|---|---|
| winhub `server-1` | fluxpro | `winhub-server-server-1` | 18791→18791 | https://server-1.winhub.fr |
| tempoflow3 `resto-lyon` | tempoflow | `tempoflow3-server-resto-lyon` | 18796→18791 | https://resto-lyon.tempoflow.fr |
| tempoflow3 `resto-marseille` | tempoflow | `tempoflow3-server-resto-marseille` | 18795→18791 | https://resto-marseille.tempoflow.fr |
| admin winhub | fluxpro | `winhubadmin-server-main` | 18801→18791 | console admin flotte (repo `winhub-admin`) |
| admin tempoflow3 | tempoflow | `tempoflowadmin-server-main` | — | https://admin.tempoflow.fr |

Registre d'instances : `{brand-root}/docker-data/servers.json` (gitignoré —
absent du checkout runner, présent sur le clone serveur).

> **État 2026-08-10** : les instances prod tournent encore en conteneurs
> legacy `docker run` (ports hôtes fixes). Le modèle cible M2 (stacks compose
> + cloudflared sidecar, §6) est mergé dans le kit ; bascule par
> `creezio server-docker migrate-stack <nom>`.

### Repos GitHub (org `creezio`, tous privés)

`creezio` (kit — source of truth plateforme) · `winhub` · `winhub-admin` ·
`tempoflow3` · `tempoflow3-admin`.

## 2. Environnement provisionné (ne PAS re-chercher)

| Fait | Règle |
|---|---|
| `CREEZIO_NPM_TOKEN` | Exporté dans `~/.bashrc` des deux VPS (`fidus` et `deploy`), actif en shell non-interactif. Toujours `$CREEZIO_NPM_TOKEN` — **jamais en clair** (commande, log, fichier, commit). |
| Identité git | `Creezio <creezio@users.noreply.github.com>` configurée sur les deux VPS. Ne jamais toucher `git config` : committer avec `git -c user.name=Creezio -c user.email=creezio@users.noreply.github.com commit …`. |
| `gh` | Authentifié (compte `creezio`) sur les deux VPS. |
| Registre npm | GitHub Packages **privé** (décision assumée 2026-08-10) : toute installation (`npm ci` / `npm install`, kit ou app) exige un PAT `read:packages` d'un membre de l'org. Le `.npmrc` des repos est commité **sans** token et consomme `${CREEZIO_NPM_TOKEN}`. En CI apps : secret repo `CREEZIO_NPM_TOKEN` ; en CI kit : `GITHUB_TOKEN` (packages:read). |

## 3. Release kit → apps (le flow exact)

1. **Changeset** — toute PR touchant `packages/` embarque un changeset
   (`npx changeset`, commit `.changeset/*.md`). Gate PR `changeset-status`
   (`npx changeset status --since=origin/main`) : rouge sinon — sans
   changeset, la version ne bumpe pas et les apps ne verront JAMAIS le
   contenu.
2. **Merge sur `main`** → `publish.yml` ouvre/actualise la PR automatique
   « chore(release): version packages » (bump lockstep + CHANGELOG **+ regen
   `package-lock.json`** via `version:packages` = `changeset version && npm
   install --package-lock-only …` — sans ça les entrées workspace du lock
   restent à l'ancienne version et `npm ci` casse).
3. **Merge de la release PR** → `publish.yml` publie tous les `@creezio/*`
   en **lockstep fixed** (groupe `fixed` de changesets : une version de kit =
   un ensemble cohérent) sur GitHub Packages.
4. **Bump d'une app — RÈGLE D'OR : les DEUX manifests ensemble.**

```bash
npm install '@creezio/<pkg>@^X.Y.Z' --save           # racine / workspace server
npm install '@creezio/<pkg>@^X.Y.Z' --save --prefix server/ui
```

   Le hook prebuild `os-ui:materialize` lit les routes OS depuis le
   `node_modules` hoisted de la racine (workspace `server`), **pas** celui de
   `server/ui`. Un bump partiel laisse les pages OS matérialisées sur
   l'ancienne version et crée un `node_modules` nested (dual-package) — CI
   verte, deploy vert, mais ancienne page servie (incident login 0.6.0,
   2026-08-10). Détail : [PROPAGATION.md](./PROPAGATION.md), § « Règle d'or
   du bump côté apps ».
5. **CI app verte → deploy auto** : le `deploy.yml` de l'app écoute
   `workflow_run` (CI `success` sur `main`) et déploie **depuis le clone
   local du brand root** sur le runner self-hosted de l'app (jamais depuis le
   checkout `_work` — le registre `docker-data/` est gitignoré).

## 4. Runners CI self-hosted

- Layout : `~/actions-runners/<app>/_work/<repo>/<repo>/` — le `_work`
  **PERSISTE entre les runs**.
- Conséquence : la CI ne doit **jamais dépendre d'un fichier pré-existant**
  (node_modules, dist, .env laissés par le run précédent). Chaque job repart
  du checkout + `npm ci`.
- Résolution des scripts de packages consommés : via la **résolution de
  package npm** (`import.meta.resolve` / `createRequire`), jamais par sondage
  de chemins `node_modules/<pkg>/...` (le hoisting workspaces casse les
  chemins relatifs — vécu e2e, fix 200476c).
- **Hygiène — avant toute purge** (`_work`, `node_modules`, caches) :

```bash
ps aux | grep Runner.Worker | grep -v grep   # doit répondre 0 ligne
```

  Incident 2026-08-10 : restes de l'ère vendoring purgés sur les runners —
  toute purge se fait runner idle, sinon on supprime le workdir d'un job en
  cours.
- Pilotage : `systemctl --user status actions-runner-<app>.service`.

## 5. Gates CI — philosophie et mode d'emploi

**Philosophie** : une gate protège un contrat ; on ne l'affaiblit **jamais**
pour faire passer un commit — on corrige la cause. SoT des gates kit = la
ligne `test` du `package.json` racine : un fichier `scripts/test-*.mjs` non
listé n'est jamais exécuté (piège réel : `os-ui-scaffold` a existé non
branchée). Suites : `npm run test:kit` (pures kit, 100 % vertes partout),
`test:brands` (repos marque requis, skip auto sinon), `test:env` (lourdes,
opt-in).

| Gate | Où | Protège | Satisfaire | Relancer seule |
|---|---|---|---|---|
| `changeset-status` | PR kit | tout changement `packages/` a son changeset | `npx changeset` + commit du `.changeset/*.md` | `npx changeset status --since=origin/main` |
| deps-integrity | CI apps (`server/scripts/test-deps-integrity.mjs`) | packages `@creezio/*` installés : présents, **pas de symlink**, ranges `^` satisfaits, **même version partout**, `vendor/creezio` absent | `npm ci` racine ; aligner les versions des DEUX manifests | `npm run test:deps-integrity --prefix server` |
| docs-freshness | kit (`test-phase-docs-freshness`) | trio `README.md`/`AGENTS.md`/`docs/FILES.md` complet par zone (`packages/*`, `docker/*`, `apps/*`, `scripts`) et FILES.md exhaustif | après ajout/suppression de fichier : `node scripts/generate-files-md.mjs <cible>` — ou `--all` (vérif seule : `--all --check`) | `node --test scripts/test-phase-docs-freshness.mjs` |
| assert-runtime-dist | kit (`test-phase-runtime-dist-freshness`) + `server-docker publish\|build` | `dist/` (gitignoré) rebuildé après modif `packages/*/src` — sinon package/image **sans les routes** (vécu Admin Database). Compare le **hash sha256 des src** au manifest `dist/.creezio-src-hash.json` écrit au build (les mtimes ne sont pas fiables : src touchés à contenu propre bloquaient les deploys) | `npm run build:packages` avant toute release/publish | `node --test scripts/test-phase-runtime-dist-freshness.mjs` ; bypass urgence `CREEZIO_SKIP_RUNTIME_DIST_ASSERT=1` (déconseillé) |
| materialize anti-stale | apps — hooks `predev`/`prebuild` de `server/ui` | pages OS régénérées depuis `@creezio/os-ui` hoisted racine ; possession **exacte** par route (une page métier prime le wrapper kit, sans masquer les enfants kit) | bumper les deux manifests (§3) ; vérifier sans écrire : `npm run os-ui:check --prefix server` | `npm run os-ui:materialize --prefix server` |
| arch-codemod | kit (`test-phase-arch-codemod`) | un bump `ARCHITECTURE_VERSION` livre ses codemods de migration dans le MÊME commit | écrire le codemod (`scripts/codemods/`) avec le bump | `node --test scripts/test-phase-arch-codemod.mjs` |

**Templates d'apps** générés par la factory : `packages/factory/src/generators/`
— `brand-workflows.ts` (workflows CI + deploy des apps), `os-ui.ts`
(materialize des pages OS), `native-runtime.ts`, et `scaffold.ts` /
`scaffold-from-prd.ts` à la racine de `packages/factory/src/`. Un défaut qui
touche toute marque générée se corrige LÀ (+ publish npm), jamais en
workaround dans une seule app.

## 6. Deploy et instances

CLI SoT : `packages/factory/src/server-docker-cli.ts`. Depuis une app :
`node scripts/creezio-cli.mjs server-docker …` (`--brand-root` = racine du
monorepo marque ; `CREEZIO_KIT_ROOT` pointe le clone kit du serveur).

| Geste | Commande |
|---|---|
| Créer une instance (stack M2 par défaut) | `creezio server-docker create <nom> --brand-root . [--profile prod] [--browser] [--host-port N]` (`--no-stack` = legacy `docker run`) |
| Lister / logs / cycle de vie | `ls --brand-root .` · `logs <nom> [--tail 500] [--follow]` · `start\|stop <nom>` · `rm <nom> [--purge-data]` |
| Update (recreate, même volume `/data`) | `update <nom> --image <ref> [--backup]` — **défaut = PAS de nouveau tar.gz** ; `--backup` = snapshot frais avant recreate (prod critique) |
| Backup one-shot | `backup <nom>` → `docker-data/backups/` (tar exit 0/1 acceptés, archive vérifiée `gzip -t`) |
| Legacy → stack M2 | `migrate-stack <nom>` — backup `/data` obligatoire, ingress tunnel repointé `http://app:18791`, healthcheck URL publique, **rollback legacy automatique si KO** |
| Publier une image versionnée | `publish --tag <v> [--registry 127.0.0.1:5000] [--release]` (la garde assert-runtime-dist s'applique au build) |
| Admin flotte | `admin up --admin-root <repo-admin>` · `admin add-brand <brandRoot>` |

**Modèle cible ports/tunnel (M2, mergé 2026-08-10, #55)** : 1 instance = 1
stack compose autonome (`docker-data/stacks/<nom>/compose.yml`, généré — ne
pas éditer) : **app** (port interne fixe `18791` dans le réseau du stack,
healthcheck `/api/v1/core/health`) + **cloudflared sidecar** (token dans
`tunnel.env` chmod 600 — jamais dans `ps`, le registre ou `docker inspect` ;
ingress `http://app:18791` par nom de service). Port hôte **loopback auto**
(`127.0.0.1::18791`) pour debug/healthcheck seulement — fini les collisions
entre instances ; **zéro port public**, l'accès utilisateur passe par
Cloudflare. Kernel en mode sidecar : `CREEZIO_TUNNEL_SIDECAR=1` (config
seedée par env, cloudflared non spawné, ingress repointé via le provisioner
avec `serviceHost=app`).

**Healthchecks de déploiement** (pattern winhub `deploy.yml`) : après update,
`GET /health`, `/login`, `/inscription` sur l'URL publique → 200 exigé.
Diagnostics boot : `GET /api/v1/os/boot-status` (répond dès le lancement),
`/health`, `/version` ; transitions JSONL dans `docker logs <container>` ;
journal ops `/data/ops/*.jsonl`.

## 7. Règles d'or agents (les 8 commandements)

1. **Aucun fichier sur le PC local** — tout vit sur les VPS.
2. **SSH base64 pour le non-trivial** — toute commande ssh avec quotes, pipes
   ou boucles est encodée : `echo <b64> | base64 -d | bash`.
3. **2 échecs = stop + rapport** — on ne brute-force jamais une commande ;
   on rapporte ce qui bloque.
4. **Backup avant recreate** — `update --backup` / `backup <nom>` ; aucune
   exception en prod.
5. **Jamais de token en clair** — `$CREEZIO_NPM_TOKEN` partout ; zéro secret
   dans les commandes, logs, fichiers, commits.
6. **Jamais de pkill à pattern large** — tuer par PID précis ; vérifier le
   cycle de vie (`docker ps`, `ps aux`) avant toute action destructive.
7. **Bumper les deux manifests** — `server/package.json` ET
   `server/ui/package.json` (§3).
8. **Branche + PR + CI verte avant merge** — jamais de push direct sur
   `main` ; branche courte depuis un `origin/main` frais.

## 8. Cookbook incidents (cause → fix)

| Incident | Cause → fix |
|---|---|
| Bundle winhub stale (vendor vieux de 24 h) | deps `file:` vendored : contenu changé sans version = invisible pour npm et le cache webpack (`managedPaths`) → `managedPaths=[]` côté winhub, puis **fin du vendoring** : distribution npm versionnée (#49). |
| Heartbeat 404 desktop / tempête CPU | `POST /api/v1/desktop/heartbeat` métier re-proxifié OS→plane en boucle infinie → marqueur `kernel-fallthrough` partagé (kit `cab5273`). Une route métier sous `/api/v1/{auth,users,tasks,assistant,desktop}` qui renvoie 404 = version `@creezio/*` sans le fix. |
| Zombies next-server / meilisearch | cycle de vie : shutdown incomplet (keep-alive HTTP + tunnel restés) → shutdown complet avant reset (kit `80c526a`) ; côté gates, helper `gate-tmp.mjs` (arrêt harness SIGTERM→SIGKILL 10 s avant `rm`). |
| Collision ports 18790/18791 | attribution legacy `18790+n` à port hôte fixe → M2 : port **interne** fixe 18791 + port hôte loopback auto (`127.0.0.1::18791`), collisions impossibles (§6). |
| Lockfile désync après bump | `changeset version` ne régénérait pas `package-lock.json` (workspaces à l'ancienne version, `npm ci` cassé) → `version:packages` chaîne `npm install --package-lock-only` (publish.yml). |
| Escalade peer deps (release en 1.0.0) | changesets majorait tout peer-dependent dès qu'un peer bumpait (même satisfait) → `onlyUpdatePeerDependentsWhenOutOfRange` (`84dc367`) + peers internes en `>=0.4.0` (`d674c86`). |
| Gate mtime bloquait les deploys | mtimes non fiables (src touchés à contenu git propre pendant le build) → assert par **hash de contenu** `dist/.creezio-src-hash.json` (`5f023df`). |
| E401 GitHub Packages en CI kit | gates scaffold/factory résolvant `@creezio/*` sur le registre sans token → `CREEZIO_NPM_TOKEN: ${{ secrets.GITHUB_TOKEN }}` (packages:read) dans les jobs (`bf2fb3f`). |
| Gate à version figée rouge post-release | `test-phase-f` lisait `0.1.0` figé ; changesets bumpe aussi les packages privés → lecture dynamique depuis `package.json` (`1695e9a`). |
| « backup indisponible (tar) » en update | GNU tar sur `/data` vivant sort exit 1 avec une archive complète et valide → exit 0/1 acceptés + `gzip -t` (skill fleet-ops). |
| Update qui rollback toute seule | réindex Meili (86k produits, ~5 min) awaitée au boot → healthcheck update (180 s) expiré → `backgroundIndex: true` ; `/search` sert `source:"indexing"` pendant l'indexation. |
| Wrapper sudo refusait les tags auto | validation semver stricte des tags → charset sûr, tags `auto.*` acceptés (`411931a`). |
| E2E cassé par le hoisting npm | scripts résolus par sondage de chemins `node_modules` → résolution package npm `import.meta.resolve` (kit `200476c`). |
| docs-freshness rouge sur main | fichier ajouté dans un package sans regen du FILES.md → `node scripts/generate-files-md.mjs <pkg>` (`746ca43`). |
| Login resté en 0.5.x après bump 0.6.0 | bump partiel (`server/ui` seul) → pages OS matérialisées sur l'ancienne version → double manifest obligatoire (`d657798`, §3). |
| Gate jamais exécutée | `scripts/test-*.mjs` non listé dans la ligne `test` du `package.json` racine = jamais run → l'y ajouter (vécu : `os-ui-scaffold`). |

## 9. Liens — le détail par domaine

| Doc | Contenu |
|---|---|
| [docs/PROPAGATION.md](./PROPAGATION.md) | contrat kit → marques, semver, règle d'or du bump, modèle PULL |
| [docs/CONTRIBUTING-BRANDS.md](./CONTRIBUTING-BRANDS.md) | gouvernance apps : cycle de vie, app → kit, breaking changes, codemods |
| [docs/NPM-DISTRIBUTION.md](./NPM-DISTRIBUTION.md) | publication GitHub Packages, changesets, consommation côté app |
| [docs/ARCHITECTURE.md](./ARCHITECTURE.md) | 4 modes de déploiement, modèle M2, boot, admin |
| [docs/RUNBOOK-FLOTTE.md](./RUNBOOK-FLOTTE.md) → skill `.cursor/skills/creezio-fleet-ops` | gestes flotte vérifiés : créer serveur/compte, publish/update, enroll, diagnostics, pièges |
| [scripts/README.md](../scripts/README.md) + [scripts/AGENTS.md](../scripts/AGENTS.md) | matrice des gates, ajout/modification de gate |
| [docs/DOC-STANDARD.md](./DOC-STANDARD.md) | trio documentaire, format FILES.md |