---
name: creezio-fleet-ops
description: Runbook opérationnel de la flotte Creezio (serveurs Docker headless, comptes, login, publish/update/rollback, admin flotte, enrôlement VPS, client desktop thin, diagnostics boot). Utiliser dès qu'il faut créer/mettre à jour un serveur marque, créer un compte owner ou collaborateur sans UI, vérifier un login, publier une image, lancer l'admin, enrôler un hôte, builder le client, ou diagnostiquer un boot qui échoue.
---

# Creezio Fleet Ops — runbook flotte

Commandes **vérifiées** (code + prod VPS TempoFlow). Chaque section :
Objectif → Commande exacte → Vérification → Où est la vérité → Pièges.

## Conventions

```bash
export CREEZIO_KIT_ROOT=/opt/docker/creezio        # kit (SoT)
export BRAND_ROOT=/opt/docker/tempoflow3           # marque exemple
export ADMIN_ROOT=/opt/docker/tempoflow-admin      # repo admin flotte
alias creezio='node $CREEZIO_KIT_ROOT/packages/factory/bin/creezio.js'
```

Containers : `<brandId>-server-<nom>` (ex. `tempoflow3-server-demo`).
Ports : auto 18790+n, bind `127.0.0.1` (exposition = `--expose`).

## Index « Je veux X → fais Y »

| Je veux… | Section |
|---|---|
| Créer un serveur (test ou prod) | 1 |
| Créer un compte owner/user sans UI | 2 |
| Me connecter / vérifier un compte | 3 |
| Publier une image, updater, rollback | 4 |
| Lancer l'admin flotte | 5 |
| Enrôler un VPS (agent hôte) | 6 |
| Builder / publier le client desktop | 7 |
| Diagnostiquer un boot qui échoue | 8 |
| Ne pas refaire un piège connu | 9 |

---

## 1. Créer un serveur

**Objectif** : instance headless (API + CRM web) dans le registre.

```bash
# Test local (image buildée si absente, port auto, attend le boot) :
creezio server-docker create demo --brand-root "$BRAND_ROOT"

# Prod flotte (warm n8n/Hermes + catalogue + forward env hôte tunnel/fleet) :
CREEZIO_TUNNEL_PROVISION_URL=http://172.17.0.1:8666 \
CREEZIO_TUNNEL_PROVISION_TOKEN=<token du service creezio-tunnel-provisioner> \
CREEZIO_TUNNEL_SLUG=<slug> \
OPENAI_API_KEY=<clé LLM entreprise de la marque> \
creezio server-docker create <slug> --brand-root "$BRAND_ROOT" --profile prod

# Variantes : --browser (Chromium sidecar IA), --warm, --port N, --expose, --env K=V

# Assistant chat (serveur headless) : --profile prod forwarde OPENAI_API_KEY /
# ANTHROPIC_API_KEY depuis l'env hôte s'ils sont posés (clé TF3 : dans
# {BRAND_ROOT}/.env, gitignoré). Sans clé, POST /api/v1/assistant/chat répond
# 503 LLM_KEYS_MISSING. Vérif :
#   curl http://127.0.0.1:<port>/api/v1/assistant/llm-status  # assistantReady:true
# Serveur existant sans clé : ajouter "OPENAI_API_KEY" dans env de l'instance
# (docker-data/servers.json) puis re-POST update admin avec la même image —
# le recreate réapplique l'env du registre (§4).
```

**Vérification** :

```bash
creezio server-docker ls --brand-root "$BRAND_ROOT"
curl -sS http://127.0.0.1:<port>/api/v1/os/boot-status | head -c 300   # 200 dès le lancement
curl -sS http://127.0.0.1:<port>/api/v1/core/health                    # {"ok":true,"brandId":…}
# --profile prod : https://<slug>.tempoflow.fr répond (CRM 200)
```

**Vérité** : CLI `packages/factory/src/server-docker-cli.ts` ; registre
`{BRAND_ROOT}/docker-data/servers.json`
(`packages/factory/src/server-docker-registry.ts`) ; doc
`docker/server/README.md`. Data : `docker-data/servers/<nom>` → `/data`.
Provisioner tunnel : service systemd `creezio-tunnel-provisioner` (VPS, :8666,
code `docker/tunnel-provisioner/`), token dans son unit.

**Pièges** : prérequis `npm run build:runtime` côté marque ; slug tunnel dans
`RESERVED_SLUGS` (`docker/tunnel-provisioner/lib.mjs` : `admin`, `mcp`, `api`,
`agent`, `demo`, `test`, `registry`…) → jamais pour un serveur client.

## 2. Créer un compte owner / user en headless (sans UI)

**Objectif** : compte qui **se loggue** sur le CRM, sans wizard Electron.

Deux stores distincts — il faut les DEUX pour un owner complet :

| Store | Contenu | Écrit par |
|---|---|---|
| `/data/{brand}-config.json` (local-config, valeurs scellées) | authUser/authPassword, recovery key, clé OpenAI, `setupComplete` | `POST /api/v1/os/setup` → `applyFirstRunSetup` |
| `/data/sqlite/core.db` table `creezio_users` (hash scrypt) | credentials **du login CRM** (kit-first) | `migrateBrandCredentialsToKit` |

```bash
PORT=18793; CT=tempoflow3-server-demo
USER=owner@resto.local; PASS=motdepasse-6car-min

# a) First-run local-config (marque setupComplete, génère la recovery key) :
curl -sS -X POST http://127.0.0.1:$PORT/api/v1/os/setup \
  -H 'content-type: application/json' \
  -d "{\"username\":\"$USER\",\"password\":\"$PASS\"}"
# → {"ok":true,"setupComplete":true,"recoveryKey":"…"} — NOTER la recoveryKey

# b) Credentials kit (login CRM) — dans le container :
docker exec -w /app -e CREEZIO_CORE_DB_PATH=/data/sqlite/core.db $CT node -e \
  "import('@creezio/auth').then(async a => { const r = await a.migrateBrandCredentialsToKit({username:'$USER', password:'$PASS', displayName:'Owner'}); console.log(JSON.stringify(r)); })"
# → {"ok":true,"action":"registered",…}
```

Collaborateur (human/ai) ensuite, avec le cookie owner (voir §3) — API
plateforme = **référentiel unique** (alias `/api/v1/users` ≡
`/api/v1/platform/users`, cycle de vie complet) :

```bash
# Création human : password OBLIGATOIRE (≥6) → login immédiat, permissions
# par défaut marque (configureAuth collaboratorDefaultPermissions) si omises.
curl -sS -X POST http://127.0.0.1:$PORT/api/v1/users \
  -H "cookie: $COOKIE" -H 'content-type: application/json' \
  -d '{"username":"vendeur1","kind":"human","password":"S3cret-…"}'
# IA : {"username":"Jarvis","kind":"ai"} (pas de credentials).
# Reset mot de passe / permissions / désactivation :
curl -sS -X PATCH http://127.0.0.1:$PORT/api/v1/users/<id> \
  -H "cookie: $COOKIE" -H 'content-type: application/json' \
  -d '{"password":"Nouveau-…","permissions":["nav.dashboard"],"active":true}'
# Meta ACL marque (assignables / owner-only / défauts) :
curl -sS http://127.0.0.1:$PORT/api/v1/users/meta -H "cookie: $COOKIE"
```

Les collaborateurs vivent dans `creezio_platform_users` (core.db) ; leurs
credentials dans `creezio_users` (créés par le POST). Le 1er inscrit
`creezio_users` reste « owner » (`ownerRow` = plus ancien). La page
Collaborateurs d'une marque (UI TF verbatim) parle directement à
`/api/v1/users` — le kernel intercepte ce préfixe AVANT le plane : ne
jamais créer une table `users` métier parallèle (comptes non logables).

**Vérité** : `packages/app-runtime/src/listen-brand-os-http.ts` (route setup),
`packages/electron-shell/src/host/local-config.ts` (`applyFirstRunSetup`),
`packages/auth/src/env-store.ts` (+ `password.ts` : scrypt N=16384),
`packages/app-runtime/src/brand-platform-store.ts` (owner/collaborateurs),
`mount-brand-platform-surface.ts` (routes `/api/v1/platform/users`).

**Pièges** : `POST /api/v1/os/setup` seul ne suffit PAS pour le login CRM
(il n'écrit pas `creezio_users`) — sans l'étape (b), `/api/v1/auth/login`
répond 401. Password ≥ 6 car., username ≥ 2. Ne PAS re-POSTer setup sur un
serveur déjà configuré (écrase compte + recovery key). Gate de référence :
`scripts/test-phase-platform-users.mjs` (création → login, meta, reset,
désactivation).

## 3. Login / vérifier un compte

```bash
COOKIE=$(curl -si -X POST http://127.0.0.1:$PORT/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$USER\",\"password\":\"$PASS\"}" \
  | rg -i '^set-cookie' | sed 's/^[Ss]et-[Cc]ookie: //' | cut -d';' -f1)
echo "$COOKIE"          # tempoflow3_session=eyJ… sinon login KO (401)
curl -sS http://127.0.0.1:$PORT/api/v1/auth/me -H "cookie: $COOKIE"
# → {"ok":true,"user":"owner@…","role":"owner",…}
```

Payload = `{"email","password"}` (le champ s'appelle `email` même pour un
identifiant simple). Cookie `<brandId>_session` (JWT HS256 signé
`AUTH_SECRET`). Le cookie ou `Authorization: Bearer <token>` marchent sur
toutes les routes plateforme.

**Vérité** : `packages/auth/src/hono-routes.ts` (login kit-first),
`session.ts` (JWT), montage `/api/v1/auth` dans
`packages/app-runtime/src/mount-brand-platform-surface.ts`.

## 4. Publier une image, updater, rollback

**Objectif** : image versionnée dans le registre Docker local
(`creezio-registry`, `127.0.0.1:5000`), déployée via l'admin.

```bash
# Publish (build + push ; --browser pour la variante sidecar) :
creezio server-docker publish --brand-root "$BRAND_ROOT" \
  --tag 0.2.2 --registry 127.0.0.1:5000
# → 127.0.0.1:5000/creezio-server-tempoflow3:0.2.2
#   /api/v1/core/version affichera 0.2.2 (CREEZIO_APP_VERSION)
# Rétention auto après push : garde les 5 derniers tags (daemon + registre
# privé) et prune le build cache (--keep-storage 12GB). Régler :
# --keep-tags N / CREEZIO_PUBLISH_KEEP_TAGS, CREEZIO_PUBLISH_KEEP_STORAGE ;
# désactiver ponctuellement : --no-retention. Voir §10.

# Tags dispo (auth Basic admin, voir §5) :
curl -sS -u "admin:$ADMPASS" \
  'http://127.0.0.1:18800/admin/api/registry/tags?image=creezio-server-tempoflow3'

# Update d'une instance (ASYNC : 202 immédiat, jamais bloquant) :
curl -sS -u "admin:$ADMPASS" -X POST \
  http://127.0.0.1:18800/admin/api/servers/tempoflow3/<nom>/update \
  -H 'content-type: application/json' \
  -d '{"image":"127.0.0.1:5000/creezio-server-tempoflow3:0.2.2"}'
# Suivi :
curl -sS -u "admin:$ADMPASS" \
  http://127.0.0.1:18800/admin/api/servers/tempoflow3/<nom>/update-status
# Hôte distant enrôlé : mêmes chemins sous /admin/api/hosts/<hostId>/servers/…
```

Update = pull → backup `/data` (`docker-data/backups/`) → recreate même
volume/env → attente health → **rollback auto** vers l'image précédente si
KO. Rollback manuel = re-POST update avec le tag précédent.

**Vérification** : `curl -sS http://127.0.0.1:<port>/api/v1/core/version`
→ la nouvelle version ; `update-status` → `"status":"done"`.

**Vérité** : `packages/factory/src/server-docker-cli.ts` (publish),
`packages/observability/fleet-collector/server-admin.mjs` (routes update),
`server-lib.mjs` (`updateServer`, backups). Env : `CREEZIO_REGISTRY`,
`CREEZIO_REGISTRY_BASIC`.

**Pièges** : update synchrone interdit — Cloudflare coupe les requêtes
longues, d'où le contrat 202 + polling `update-status`. Registre requis
(`--registry` ou env), sinon erreur explicite.

## 5. Admin flotte

```bash
creezio server-docker admin up --admin-root "$ADMIN_ROOT" --brand-root "$BRAND_ROOT"
# (raccourci marque : npm run server-docker:admin)
# → http://127.0.0.1:18800/admin — et https://admin.tempoflow.fr (tunnel)
ADMPASS=$(python3 -c "import json;print(json.load(open('$ADMIN_ROOT/docker-data/server-admin.json'))['pass'])")
curl -sS -u "admin:$ADMPASS" http://127.0.0.1:18800/admin/api/health
# → {"ok":true,"service":"creezio-server-admin",…}
```

Config **sans secrets** versionnée : `{ADMIN_ROOT}/server-admin.json`
(`port`, `user`, `brandRoots[]`) + `fleet-hosts.json` (hôtes enrôlés, tokens
**hashés**). Le `pass` runtime vit dans `{ADMIN_ROOT}/docker-data/server-admin.json`
(gitignoré). Attention : avec `--admin-root`, c'est bien le pass du repo
admin qui fait foi (pas un éventuel `docker-data/server-admin.json` de la
marque).

**Vérité** : `packages/observability/fleet-collector/server-admin.mjs`,
`docker/server-admin/README.md`, repo `creezio/tempoflow-admin`.

## 6. Agent hôte + enrôlement d'un VPS

**Objectif** : un VPS distant piloté par l'admin (create/update/logs à
travers le tunnel `agent.{slug}.{zone}`).

```bash
# Sur le VPS à enrôler :
creezio server-docker agent up --brand-root "$BRAND_ROOT"     # :18810, bind 127.0.0.1+172.17.0.1

# Côté admin — générer un enrollToken (one-shot, hashé dans fleet-hosts.json) :
curl -sS -u "admin:$ADMPASS" -X POST \
  http://127.0.0.1:18800/admin/api/hosts/enroll-token \
  -H 'content-type: application/json' -d '{"label":"vps-resto-x"}'
# → {"ok":true,"enrollToken":"…"}  (affiché UNE fois)

# Sur le VPS — enrôlement (réserve l'ingress agent.{slug} via le provisioner) :
creezio server-docker enroll --brand-root "$BRAND_ROOT" \
  --admin https://admin.tempoflow.fr --token <enrollToken> --slug <slug>
```

**Vérification** : `curl -sS -u admin:… http://127.0.0.1:18800/admin/api/hosts`
→ l'hôte avec `"online":true` et son `agentUrl` `https://agent.<slug>.…`.

**Vérité** : `packages/factory/src/server-docker-cli.ts` (agent/enroll),
`server-admin.mjs` (`/admin/api/enroll` — auth par enrollToken, pas Basic),
tokens agent : `docker-data/host-agent.json` (hashés, `agent token new|revoke`).

## 7. Client desktop thin (remote-only)

**Objectif** : binaire client (AppImage/NSIS) sans services locaux —
picker « Rejoindre un serveur ».

```bash
cd "$BRAND_ROOT"
npm run pack:win            # NSIS x64 (livrable client/)
npm run electron:publish:dry   # contrôle feed/kind sans pousser
npm run electron:publish       # → feed https://crm.tempoflow.fr/dl-…/tf3/
npm run electron:verify-pack   # vérifie kind=client dans l'artefact
```

URL serveur pré-provisionnée : env `TF3_DEFAULT_SERVER_URL` (prefixe env de
la marque) ou `defaultServerUrl` dans le BrandSpec/manifest — ne remplace
jamais le dernier choix utilisateur.

**Vérité** : `client/package.json` + `client/electron-builder.client.json`
(GUID NSIS propre TF3, feed `…/tf3/`),
`vendor/creezio/desktop-tooling/scripts/publish-desktop.sh`,
picker : `packages/electron-shell/src/desktop/brand-desktop-runtime.ts`.

**Pièges** : publish détecte le feed **local** (container nginx-proxy-manager
sur le même VPS) → `docker cp` direct, PAS de ssh-vers-soi ; feed TF2
(`…/dl-…/` racine ou GUID TF2) à ne jamais polluer — TF3 = sous-dossier
`/tf3/` + GUID dédié ; electron-builder refuse les symlinks hors racine
projet → `client/vendor` est une **copie hardlink** stagée par
`sync-creezio-vendor.sh` (ne pas remettre un symlink).

## 8. Diagnostics — boot qui échoue

Dans l'ordre :

```bash
curl -sS http://127.0.0.1:<port>/api/v1/os/boot-status   # étapes + % + détail erreur (200 même pendant le boot)
curl -sS http://127.0.0.1:<port>/api/v1/core/health      # 503 pendant le boot, 200+brandId après
curl -sS http://127.0.0.1:<port>/api/v1/core/version     # version image (update OK ?)
curl -sS http://127.0.0.1:<port>/api/v1/os/ready         # agrégat hosts n8n/Hermes/Meili
creezio server-docker logs <nom> --brand-root "$BRAND_ROOT" --tail 200
docker logs <container> 2>&1 | rg '"creezio":"boot-step"' | tail   # une ligne JSONL par transition
docker exec <container> sh -c 'ls -t /data/ops/*.jsonl | head -2'  # journal ops (mêmes kinds que desktop)
npm run crash:list --prefix "$BRAND_ROOT/server"                   # crash reports
```

L'admin (§5) montre boot-status live, logs et ops par serveur sans SSH.

**Vérité** : `packages/app-runtime/src/listen-brand-os-http.ts` (routes os),
`start-brand-kernel-harness.ts` (étapes boot),
`packages/observability/src/ops/journal.ts`.

## 9. Pièges connus (ne pas les refaire)

| Piège | Règle |
|---|---|
| Ordre catalogue vs listen | L'import catalogue doit tourner **après** le listen HTTP (`METIER_BASE_URL` posé), sinon « skipped ». Déjà corrigé dans le harness — ne pas réintroduire d'étape catalogue pré-listen. |
| AUTH_SECRET | Généré/persisté **par instance** (`/data/{brand}-config.json`) au boot ; jamais le fallback dev en prod ; ne pas partager entre serveurs. |
| Setup ≠ login | `POST /api/v1/os/setup` n'écrit pas `creezio_users` → faire aussi `migrateBrandCredentialsToKit` (§2). |
| Vendor sync | `sync-creezio-vendor.sh` doit inclure `browser-host` (déjà dans la liste par défaut — ne pas la réduire). |
| Symlinks electron-builder | Refuse les symlinks hors racine projet : `client/vendor` = copie hardlink, pas un symlink. |
| Publish desktop | Feed sur le même VPS → flux Docker local (`docker cp`), pas de SSH vers soi-même. |
| Feed TF2 | Ne pas écrire dans le feed/GUID TempoFlow2 — TF3 a son sous-dossier `/tf3/` et son GUID. |
| Collector TF2 | `tf2-fleet-collector.service` loopback **:8665** = prod TF2, ne pas toucher (ni élargir son `ALLOWED_REMOTE`). Provisioner kit = `creezio-tunnel-provisioner` **:8666**. |
| Slugs réservés | `admin`, `mcp`, `api`, `agent`, `demo`, `test`, `registry`… (`docker/tunnel-provisioner/lib.mjs`) — jamais pour un serveur client. |
| Cloudflare timeouts | Toute opération longue exposée via tunnel = async (202 + route de statut), jamais une requête bloquante. |
| Compose vs registre | Instances Compose = `server-1`, `server-2` (chiffres) ; instances registre (`create <nom>`) = libres. Projet Compose `creezio-servers`/`tf3-servers`, jamais `tempoflow`/`n8n`. |
| Résolution module packagé | Jamais de parsing de stack pour retrouver `file://` (les frames Windows `file:///C:/…` cassent tout regex naïf → crash client). SoT : `createAppRequire` (`@creezio/platform-core`) ; gate `verify-pack-runtime` refuse le pattern. |
| UI marque = chrome kit + Tailwind | La factory génère `ui/tailwind.config.ts` (scan `../vendor/creezio/*/ui`), `postcss.config.js`, `globals.css` (tokens) et `components/brand-chrome.tsx` (WorkspaceRoot/configureSidebar). App qui rend du HTML brut sans sidebar = Tailwind/chrome manquant, corriger la factory (gate `test-phase-os-ui-scaffold`). |
| Gros catalogues (85k+ skus) | Jamais une requête SQL par ligne dans un handler liste (N+1 = event loop bloqué, tout le serveur pend, même `/health`). Agréger en SQL (CTE + window), indexer (`produits(sku_id)`, `prix(produit_id)`), capper les listes génériques. |
| Login API | `POST /api/v1/auth/login` body JSON `{"email": <username>, "password": …}` (champ `email` même pour un username) ; cookie de session, contrôle via `/api/v1/auth/me`. |
| Permissions owner | La marque DOIT déclarer `configureAuth({ cookieName, ownerPermissions })` au beforeBoot (bindings plateforme) — sinon les sessions owner sont signées avec `permissions: []`, `/api/v1/auth/me` renvoie une liste vide et la sidebar métier est amputée (seules les entrées non gardées restent). Collaborateurs : permissions stockées par user (`creezio_platform_users.permissions`) ; défauts/assignables/owner-only déclarés via `configureAuth({ collaboratorDefaultPermissions, collaboratorAssignablePermissions, ownerOnlyPermissions })`. |
| Référentiel users unique | `/api/v1/users` est une route PLATEFORME (alias de `/api/v1/platform/users`, interceptée par le kernel avant le plane). Un `POST` human exige `password` et crée les credentials kit → login immédiat. Jamais de table `users` métier in-plane pour les comptes (l'ancienne route TF2 in-plane est shadowée, code mort inoffensif). |
| Enregistrement des gates | La SoT des gates est le script `npm test` du `package.json` racine (test-fast la parse) — un fichier `scripts/test-*.mjs` NON listé n'est **jamais** exécuté par `test:kit`/CI. Toute nouvelle gate doit y être ajoutée (piège réel : `test-phase-os-ui-scaffold` a existé non branchée). |
| Design system généré | La factory ne DOIT générer que des pages avec composants kit (`@/components/ui/*` = re-exports `@creezio/shell-ui/ui/primitives/*`, tables via `EntityTable`/DataTable kit). `renderNextLayoutTsx` (layout HTML brut) est supprimé — gate `test-phase-os-ui-scaffold` verrouille. |
| Page métier vs wrapper os-ui | `materialize.mjs` (os-ui) skippe toute route que la marque possède (`ui/app/<route>/page.*`) — la page métier verbatim (ex. `/onboarding`, `/parametres` TF) prime sur le wrapper kit. Ne jamais supprimer une page métier pour « résoudre » un conflit parallel pages : c'est le wrapper qui cède. Gate : `test-phase-os-ui-scaffold`. |
| Réindexation Meili vs update | Une réindexation complète (bump `schemaVersion` du feed marque, gros catalogue : ~5 min pour 86k produits) ne doit JAMAIS être awaitée dans le boot — sinon le healthcheck d'update (180 s) expire et l'update **rollback automatiquement** (vécu sur 0.3.4). SoT : `maybeBootBrandMeili({ backgroundIndex: true })` dans le harness et le desktop ; `/search` sert `source:"indexing"` pendant l'indexation, boot-step `index` passe à done à la fin (`docker logs … \| grep index.done`). |
| Feed Meili riche marque | UIDs marque legacy (`tf2_*`) interdits — le kit impose `catalog_*`. Pour des documents riches (jointures/provenance/taxonomie), la marque fournit `loadDocs` dans son `BrandMeiliIndexSpec` (SQL marque côté marque, jamais dans le kit) + fallback documents simples si le schéma catalogue n'est pas encore matérialisé (serveur neuf). L'UI doit interroger les mêmes UIDs (`lib/meilisearch.ts`, `queries.ts`, `meili-rag.ts`). |
| Sous-routes plateforme in-plane | Les préfixes plateforme (`/api/v1/{auth,users,tasks,assistant,desktop}`) sont interceptés par la surface kit AVANT le kernel ; une sous-route inconnue (ex. `POST /api/v1/desktop/heartbeat` métier) fallthrough vers le plane UI via le marqueur `platform_route_not_found` (notFound de `mountBrandPlatformSurface`). Si une route métier sous ces préfixes renvoie un 404 texte : vérifier que le vendor porte ce fix. |
| E2E parité marque | `tempoflow3/server/scripts/test-e2e-parite.mjs` (env `TF3_BASE` — pas `TF3_BASE_URL` —, `TF3_OWNER_USER/PASS`, `TF3_STAFF_USER/PASS`, `--full` pour le volet mutant étude→optimiser→dispatch). CDP : les sleeps fixes flakent à froid post-update — toujours des attentes actives (`waitEv` sur sélecteur) + retry de page ; `document.body` peut être null pendant une transition. La sidebar SSR est NON filtrée (le filtre ACL est client après `/auth/me`) : attendre l'hydratation avant d'asserter. |

## 10. Entretien disque Docker (VPS hôte)

**Objectif** : ne plus jamais saturer le disque du VPS avec les builds
répétés du kit (build cache BuildKit + vieilles images versionnées dans le
daemon et le registre `registry:2`). Trois mécanismes standard, en couches :

1. **GC BuildKit native** (`/etc/docker/daemon.json`, appliquée au restart
   du daemon) :

```json
{
  "builder": {
    "gc": {
      "enabled": true,
      "defaultReservedSpace": "10GB",
      "defaultMaxUsedSpace": "15GB",
      "defaultMinFreeSpace": "25GB"
    }
  }
}
```

   (Docker ≥ 25 : `defaultReservedSpace`/`defaultMaxUsedSpace`/`defaultMinFreeSpace` ;
   l'ancien `defaultKeepStorage` reste accepté = `defaultReservedSpace`.)
   Valider avant restart : `sudo dockerd --validate --config-file /etc/docker/daemon.json`.

2. **Timer systemd quotidien** (VPS TempoFlow : `docker-disk-maintenance.timer`,
   04h30 UTC, script `/usr/local/sbin/docker-disk-maintenance.sh`) :
   - alerte journal (`logger`, prio warning) si usage disque `/` ≥ 85 % ;
   - **garde-fou** : purge sautée si un `docker build|push` ou
     `server-docker publish` est en cours ;
   - `docker system prune -f` (**sans `-a`** : ne supprime jamais une image
     taguée, donc les images des serveurs à l'arrêt restent rollbackables) ;
   - `docker builder prune --keep-storage 12GB -f` ;
   - rétention registre : garde les 5 derniers tags par repo (tri version),
     DELETE des manifests plus vieux (digests partagés avec un tag conservé
     protégés) puis `registry garbage-collect` dans le container
     `creezio-registry` (blobs). Pré-requis : `REGISTRY_STORAGE_DELETE_ENABLED=true`.
   - Réglages : `/etc/default/docker-disk-maintenance`
     (`DOCKER_MAINT_KEEP_TAGS`, `_KEEP_STORAGE`, `_ALERT_PCT`, `_REGISTRY_URL`).
   - Suivi : `systemctl list-timers docker-disk-maintenance.timer` ;
     `sudo journalctl -u docker-disk-maintenance.service -n 50`.

3. **Rétention dans le flux publish** (§4) : après chaque push réussi,
   `server-docker publish` supprime du daemon les vieilles images du même
   repo au-delà des 5 derniers tags, prune le build cache et supprime les
   vieux tags du registre privé (manifests ; blobs balayés par le timer).
   Best-effort : ne fait jamais échouer le publish.

**Vérification** : `docker system df` (Build Cache sous le keep-storage),
`df -h /` < 85 %, `curl -s http://127.0.0.1:5000/v2/<repo>/tags/list` ≤ 5 tags.

**Vérité** : `packages/factory/src/server-docker-cli.ts`
(`runPublishRetention`, `selectTagsToPrune`) ; hôte : `/etc/docker/daemon.json`,
`/usr/local/sbin/docker-disk-maintenance.sh`,
`/etc/systemd/system/docker-disk-maintenance.{service,timer}`.

**Pièges** : `daemon.json` exige un **restart** de `docker.service` (pas un
reload) → jamais pendant un build/publish ; re-vérifier ensuite la santé des
containers prod (restos, TF2 `crm.tempoflow.fr`, collector :8665). Ne jamais
lancer `registry garbage-collect` pendant un push (risque de blobs
manquants) — le timer s'en garde via son garde-fou. `docker system prune -a`
interdit en cron : il supprimerait les images des serveurs arrêtés.

## Ressources

- Doc serveur Docker : `docker/server/README.md` (+ `REMOTE-ACCESS.md`, `PARITE-TF2.md`)
- Admin : `docker/server-admin/README.md` · Provisioner : `docker/tunnel-provisioner/README.md`
- Miroir doc : `docs/RUNBOOK-FLOTTE.md`
