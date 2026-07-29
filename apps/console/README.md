# Console Creezio (`@creezio/console`)

Console de **pilotage du parc** desktop (TempoFlow, Certivan, Fidu) :
versions live depuis les `latest.yml`, liens de téléchargement, statut build,
wrappers remote-build en **dry-run** par défaut.

Ce n’est **pas** un CRM métier.

## Lancer en local

Depuis la racine du monorepo `/opt/docker/creezio` :

```bash
npm install
npm run build          # packages + console
npm run console:dev    # http://127.0.0.1:3080
```

Ou depuis ce dossier :

```bash
cd apps/console
npm run dev
```

Production locale :

```bash
npm run console:start  # après npm run build
```

## Fonctions

| Zone | Comportement |
|------|----------------|
| Parc | 3 marques, cartes Client + Serveur |
| Feeds | Lecture HTTP des `latest.yml` (URLs `brand-config`) |
| Téléchargements | Liens directs exe + latest.yml |
| Statut build | Fichier JSON `/tmp/{brand}-build-status.json` si présent |
| Remote-build | Bouton **dry-run** (SSH + rsync `-n`) — jamais de publish auto |

## Déclencher un remote-build (hors UI)

Les builds réels restent manuels / documentés — l’UI n’autorise que le dry-run
par sécurité. Pour un vrai build depuis une app marque :

```bash
# Dry-run (sûr)
CREEZIO_BRAND=fidu bash packages/desktop-tooling/scripts/remote-build-win.sh \
  --app-root=/opt/docker/fidu/crm --dry-run

# Build + publish (risqué — ops explicite)
CREEZIO_BRAND=certivan bash packages/desktop-tooling/scripts/remote-build-win.sh \
  --app-root=/opt/docker/certivan-app/crm --publish
```

Via la console API (dry-run uniquement) :

```bash
curl -X POST http://127.0.0.1:3080/api/remote-build \
  -H 'content-type: application/json' \
  -d '{"brandId":"tempoflow","dryRun":true}'
```

## Variables

| Env | Rôle |
|-----|------|
| `CREEZIO_CONSOLE_ALLOW_BUILD=1` | Autorise `dryRun:false` sur `/api/remote-build` (défaut: refusé) |
| `CREEZIO_APP_ROOT_*` | Override app root (sinon `manifest.publish.defaultAppRoot`) |
