# DemoBrand

Squelette desktop **Client + Serveur** généré par `creezio new-app` (Phase D).

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | `demobrand` |
| bridgeName | `demobrandDesktop` |
| envPrefix | `DEMOBRAND` |
| deepLink | `demobrand://` |
| tunnel | `*.demobrand.creez.io` |
| client appId | `io.creezio.demobrand` |
| server appId | `io.creezio.demobrand.server` |
| client NSIS GUID | `7673ac29-e40f-5262-b420-5fa6b09cb1bf` |
| server NSIS GUID | `30fe0aad-125c-5bdb-9a59-61ff33b07cd7` |
| feed client | `https://demobrand.creez.io/dl-sandboxfac47b3ec4fb510facba4f6f/` |
| feed server | `https://demobrand.creez.io/dl-sandboxfac47b3ec4fb510facba4f6f/server/` |
| sandbox | `true` |

## Structure

```
src/electron/
  app-manifest.ts       # AppManifest embarqué
  main.ts               # boot mince (@creezio/electron-shell)
  preload.ts            # bridge (@creezio/shell)
  nav-core.ts           # nav plateforme placeholder
  vertical-slot.ts      # slot métier VIDE (pas de catalogue TF)
resources/
  icons/{client,server}.png
  renderer/index.html
scripts/build-builder-config.mjs
electron-builder.{base,client,server}.json
```

## Build

```bash
cd /opt/docker/creezio
npm install
npm run build -w @creezio/app-demobrand
```

Configs electron-builder :

```bash
cd apps/demobrand
npm run electron:config:client
npm run electron:config:server
```

## Publish (sandbox — dry-run)

Les feeds sandbox sont **jetables** et distincts des feeds prod TF / Fidu / Certivan.
Tant que le vhost `dl-demobrand` n'existe pas sur NPM, utiliser uniquement le dry-run :

```bash
npm run desktop:resolve-config -- --brand=demobrand --kind=client --pretty
npm run desktop:publish -- --brand=demobrand --kind=client --dry-run --app-root /opt/docker/creezio/apps/demobrand
```

Ne **jamais** pointer `dockerDlName` / feedToken vers `dl-tempoflow`, `dl-fidu` ou `dl-certivan`.

## Product Hub (Phase E)

Stub mémoire dans `src/electron/product-hub-stub.ts` + slot
`verticalSlot.productHub`. Tags n8n / grants dérivés du manifest
(`demobrand-plugin:`, `DEMOBRAND_*`) — zéro hardcode TempoFlow/Certivan.

## Suite

- Remplir `vertical-slot.ts` + UI métier
- Brancher CRM Next + store SQLite Product Hub (Phase G)
- Control plane : `startHostPluginControlPlane` (@creezio/electron-shell)
