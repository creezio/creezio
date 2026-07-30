# AGENTS.md — @creezio/factory

## Mission

Maintenir le CLI `creezio new-app` et le scaffold d'app marque sandbox Client + Serveur. Le resultat doit rester generique, minimal et sans vertical metier.

## Ne pas faire

- Ne pas recycler des GUID, feeds ou tokens de production.
- Ne pas injecter de catalogue TempoFlow/Fidu/Certivan dans le scaffold.
- Ne pas ecraser des fichiers existants sans `--force`.
- Ne pas ajouter de dependances runtime lourdes si le squelette peut rester minimal.
- Ne pas toucher `docs/FILES.md` sans demande dediee.

## Points d'entrée

- `bin/creezio.js` : binaire npm.
- `src/cli.ts` : parsing et commande `new-app`.
- `src/scaffold.ts` : generation des fichiers.
- `src/minimal-png.ts` : icone placeholder.
- `src/index.ts` : exports publics.

## Modifier sans casser

- Garder `new-app` comme seule commande tant que l'API publique ne change pas explicitement.
- Toute nouvelle option CLI doit etre ajoutee a `CliArgs`, `parseArgs`, `printHelp` et `NewAppOptions` si elle affecte le scaffold.
- Les fichiers generes doivent compiler sans installer le binaire Electron.
- `--force` doit rester la seule voie d'ecrasement.
- Les chemins generes doivent rester relatifs a la racine app et compatibles monorepo.

## Config brand

Le scaffold prend :

- `brandId`
- `productName`
- `domain`
- `envPrefix`
- `feedToken`
- `sandbox`
- `outDir`

Ces valeurs alimentent `createAppManifest`. Une marque production doit revoir manifest, feeds, icons, installer et slot metier avant publish.

## Tests/gates

Avant validation :

```bash
npm run typecheck -w @creezio/factory
npm run build -w @creezio/factory
```

Smoke recommande dans un dossier temporaire :

```bash
node packages/factory/bin/creezio.js new-app \
  --name DemoBrand \
  --id demobrand-smoke \
  --domain demobrand-smoke.creez.io \
  --out /tmp/demobrand-smoke
```

Puis verifier `package.json`, `app-manifest.json` et configs electron-builder.

## Fichiers sensibles

- `src/scaffold.ts` : toute la surface generee.
- `src/cli.ts` : contrat CLI utilisateur.
- `src/minimal-png.ts` : placeholder seulement, ne pas considerer production-ready.

## Liens

- `README.md`
- `docs/FILES.md`
- `packages/brand-config/README.md` si present
- `packages/desktop-tooling/README.md`
