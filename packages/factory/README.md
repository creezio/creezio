# @creezio/factory

## Rôle

CLI `creezio new-app` pour générer une application marque Client + Serveur
consommant `@creezio/*`, avec option **création depuis un brief produit**
(`--from-prd`).

## Deux modes

### Mode produit — `--from-prd`

```bash
creezio new-app \
  --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out /tmp/tempoflow3
```

1. Parse le PRD → `ProductModel` (entities, pages, flows, platformNeeds).
2. Dérive `brandId` / `name` / `domain` (ex. TempoFlow → `tempoflow3`).
3. Génère OS shell + métier marque (schéma, API HTTP, pages, nav, wiring).
4. Fournit `npm run test:metier-parcours` (fournisseurs → panier → commande).

### Mode technique — flags

```bash
creezio new-app \
  --name DemoBrand \
  --id demobrand \
  --domain demobrand.creez.io
```

Squelette OS + slot métier vide (comportement historique Phase D).

### Serveur Docker headless

```bash
creezio server-docker proof --brand-root /opt/docker/tempoflow3
```

Image générique + Compose multi-instances (`server-1` / `server-2`) —
SoT dans `docker/server/` (sans Electron/AppImage). Voir `docker/server/README.md`.

## Options

| Option | Description |
|--------|-------------|
| `--from-prd` | Chemin PRD markdown |
| `--name` / `--id` / `--domain` | Requis sans PRD ; overrides avec PRD |
| `--out` | Dossier cible (défaut `apps/<id>`) |
| `--env-prefix` | Préfixe env |
| `--feed-token` | Token feed sandbox |
| `--sandbox` / `--no-sandbox` | Flag sandbox (défaut oui) |
| `--force` | Écrase les fichiers existants |

## API publique

```ts
import {
  scaffoldNewApp,
  parseProductPrd,
  safeBrandId,
  parseArgs,
  runCli,
} from "@creezio/factory";
```

## Artefacts `--from-prd`

- `product-model.json`
- `crm/src/brand/schema.{ts,sql}`
- `scripts/metier-api.mjs` + `test-metier-parcours.mjs`
- `ui/app/**` pages App Router
- `src/lib/{paths,host-stack,creezio-boot,…}.ts` wiring générique
- `src/electron/main.ts` → `installBrandDesktopRuntime` + boot shell
- `resources/renderer/index.html` UI SPA métier

## Build

```bash
npm run build -w @creezio/factory
npm run typecheck -w @creezio/factory
```

## Voir aussi

- `AGENTS.md`
- `docs/ADR-factory-from-prd.md`
- `docs/experiences/tempoflow3/`
