# @creezio/factory

## Rôle

`@creezio/factory` fournit le CLI `creezio new-app` pour generer un squelette d'application marque Client + Serveur consommant le kit `@creezio/*`.

## Périmètre

Inclus :

- parsing CLI `creezio new-app` ;
- creation d'un `AppManifest` via `@creezio/brand-config` ;
- generation d'une app Electron minimale ;
- configs electron-builder client/serveur ;
- resources renderer et icones placeholder ;
- slot metier vide, nav core et Product Hub stub sandbox.

Hors perimetre :

- migration d'une marque existante ;
- injection de catalogue TempoFlow/Fidu/Certivan ;
- provisioning de feeds production ;
- runtime desktop complet avance, qui vit dans `@creezio/electron-shell`.

## Installation/build

```bash
npm install
npm run build -w @creezio/factory
npm run typecheck -w @creezio/factory
```

Le binaire publie est :

```bash
creezio new-app --help
```

## Configuration

Arguments obligatoires :

- `--name` : nom produit ;
- `--id` : `brandId` court ;
- `--domain` : domaine feed/tunnel.

Options :

- `--out` : dossier cible, defaut `apps/<id>` sous la racine kit ;
- `--env-prefix` : prefixe env, defaut `ID` uppercase ;
- `--feed-token` : token `/dl-<token>/`, defaut sandbox deterministe ;
- `--sandbox` / `--no-sandbox` ;
- `--force` pour ecraser les fichiers existants.

## API publique + exemples

Exports :

- `parseArgs`, `runCli` ;
- `scaffoldNewApp`, `renderManifestTs` ;
- types `NewAppOptions`, `ScaffoldResult`.

CLI :

```bash
creezio new-app \
  --name DemoBrand \
  --id demobrand \
  --domain demobrand.creez.io
```

API Node :

```ts
import { scaffoldNewApp } from "@creezio/factory";

const result = scaffoldNewApp({
  brandId: "demobrand",
  productName: "DemoBrand",
  domain: "demobrand.creez.io",
  outDir: "/opt/docker/creezio/apps/demobrand",
  sandbox: true,
});
```

Fichiers generes principaux :

- `package.json`
- `tsconfig.electron.json`
- `electron-builder.base.json`
- `electron-builder.client.json`
- `electron-builder.server.json`
- `src/electron/app-manifest.ts`
- `src/electron/main.ts`
- `src/electron/preload.ts`
- `src/electron/nav-core.ts`
- `src/electron/vertical-slot.ts`
- `src/electron/product-hub-stub.ts`
- `resources/renderer/index.html`
- `resources/icons/{client,server}.png`
- `README.md`

## Flux

1. Le CLI parse `new-app`.
2. `createAppManifest` genere identite, feeds, GUID NSIS, deep-link et prefixe env.
3. `validateAppManifest` bloque les manifests invalides.
4. Les fichiers sont ecrits dans `outDir`.
5. Les configs electron-builder client/serveur sont derivees du manifest.
6. Le CLI affiche la suite : `npm install`, build et dry-run publish.

## Intégration marques

Le squelette est volontairement minimal :

- `main.ts` branche `prepareDesktopBoot`, `api-kernel`, `mcp-facade`, auth memoire et shell-ui ;
- `vertical-slot.ts` est vide par defaut ;
- `product-hub-stub.ts` utilise un store memoire sandbox ;
- les icones PNG sont placeholders a remplacer avant publication.

Une marque de production doit remplacer les GUID/feeds sandbox, completer le slot metier et brancher ses stores persistants.

## Dépendances

- `@creezio/brand-config` pour `AppManifest`, validation et electron-builder ;
- `@creezio/product-hub` pour le stub sandbox ;
- TypeScript et Node.

## Voir aussi

- `AGENTS.md`
- `docs/FILES.md`
- `packages/desktop-tooling/README.md`
- `packages/electron-shell/README.md`
