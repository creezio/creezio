# CREATE-PACKAGE — créer un package `@creezio/*`

Guide pas-à-pas pour ajouter un package natif au kit. Chaque étape est
obligatoire : les derniers packages créés ont chacun raté au moins une
étape de cette liste (gate non branchée, ordre de build absent, doc trio
manquant, vendor non synchronisé…).

## Flux

```text
squelette → build:packages (ordre) → dual CJS → trio doc → gate →
enregistrements racine → sync vendor marques
```

## 1. Squelette `packages/<nom>/`

```text
packages/<nom>/
├── package.json          # exports ESM + CJS (modèle ci-dessous)
├── tsconfig.json         # build ESM → dist/
├── tsconfig.cjs.json     # build CJS → dist-cjs/ (posé par build-cjs)
├── src/index.ts          # TOUTE la surface publique passe par index.ts
└── ui/                   # optionnel : composants React (TS brut, non buildé)
```

`package.json` minimal (modèle réel : `packages/integrations/package.json`) :

```json
{
  "name": "@creezio/<nom>",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist-cjs/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist-cjs/index.js",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist", "dist-cjs"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "license": "UNLICENSED",
  "module": "./dist/index.js"
}
```

Si le package a une UI : export `"./ui"` pointant sur `./ui/index.ts` (TS
brut compilé par l'app Next consommatrice) + `react` / `@creezio/shell-ui`
en `peerDependencies` **optionnelles** (`peerDependenciesMeta`).

## 2. Ordre de build (`build:packages`)

Dans le `package.json` **racine**, insérer
`npm run build -w @creezio/<nom>` dans le script `build:packages` **après
toutes ses dépendances `@creezio/*`** (l'ordre canonique est documenté dans
[`AGENTS.md` racine](../../AGENTS.md) — le mettre à jour aussi).

```bash
cd /opt/docker/creezio && npm run build:packages   # doit finir vert
```

## 3. Dual CJS

Si le package est consommé en `require()` par un main Electron CJS (toutes
les marques desktop), l'ajouter à la liste `PACKAGES` de
`scripts/build-cjs.mjs` (exécuté en fin de `build:packages`). Il produit
`dist-cjs/` + un `package.json` `{ "type": "commonjs" }` local.

## 4. Trio doc obligatoire (DOC-STANDARD)

Voir [`docs/DOC-STANDARD.md`](../DOC-STANDARD.md) : `README.md`,
`AGENTS.md`, `docs/FILES.md` — les trois, dès la création.

```bash
node /opt/docker/creezio/scripts/generate-files-md.mjs <nom>   # génère docs/FILES.md
```

Rédiger la colonne « Rôle » (le générateur préserve le texte existant).
Préciser pour chaque API si elle est **câblée en prod** ou seulement
**disponible**.

## 5. Gate associée

Créer `scripts/test-phase-<nom>.mjs` (node --test) qui prouve le contrat
public, puis **l'enregistrer dans la ligne `test` du `package.json`
racine** — une gate non listée n'est JAMAIS exécutée par `test:kit`/CI
(piège vécu : `test-phase-os-ui-scaffold` a existé non branchée).
Procédure détaillée : [`scripts/AGENTS.md`](../../scripts/AGENTS.md).

```bash
node --test scripts/test-phase-<nom>.mjs   # vert en isolation
npm run test:kit                           # 100 % vert
```

## 6. Enregistrements racine

- [`docs/PACKAGES.md`](../PACKAGES.md) : ligne dans la table de la bonne
  section (README/AGENTS/FILES).
- [`README.md` racine](../../README.md) : liste des packages (le compte
  affiché doit rester vrai).
- [`AGENTS.md` racine](../../AGENTS.md) : ordre de build + table
  « Où modifier quoi ».

## 7. Propagation vendor

Ajouter `<nom>` à `DEFAULT_PACKAGES` dans
`scripts/sync-creezio-vendor.sh` si les marques doivent le consommer.
Après merge sur `main` (jamais avant — `SYNC.json` pinne le HEAD kit) :

```bash
cd /opt/docker/tempoflow3 && npm run electron:sync-vendor
```

## Pièges

| Piège | Règle |
|---|---|
| zod v3/v4 | Ne **pas** ajouter `zod` aux dependencies — le hoisting npm résout la v3 attendue par le kit (une v4 locale casse les types croisés). Utiliser les helpers de `@creezio/tasks` qui encapsulent déjà zod. |
| Domaine marque | Aucun métier TF/CV/Fidu dans un package natif — ADR [ADR-no-brand-domain-in-native-packages](../adr/ADR-no-brand-domain-in-native-packages.md). |
| Electron dans un package pur | Seuls `electron-shell` / `app-runtime` touchent Electron ; les autres reçoivent leurs side effects par injection. |
| Import `@/` | Interdit dans le kit (alias app) — imports relatifs ou `@creezio/*`. |
| CJS incompatible | Éviter top-level await et `import.meta` non gardé si le package est dans la liste dual CJS. |

## Checklist finale

- [ ] `npm run build:packages` vert (ordre correct)
- [ ] `scripts/build-cjs.mjs` mis à jour si consommé en CJS
- [ ] README.md + AGENTS.md + docs/FILES.md présents et rédigés
- [ ] Gate créée **et** enregistrée dans la ligne `test` racine
- [ ] `npm run test:kit` 100 % vert (docs-freshness incluse)
- [ ] PACKAGES.md + README racine + AGENTS racine à jour
- [ ] `sync-creezio-vendor.sh` mis à jour si consommé par les marques
- [ ] Resync vendor des marques APRÈS push `main`
