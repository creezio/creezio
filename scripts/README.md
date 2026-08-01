# `scripts/` — gates, build CJS, propagation kit

Outils du monorepo **creezio** (hors packages npm).

## Rôle

- **Gates de phases** : `test-phase-*.mjs` — assertions architecture / cutovers / docs
- **Build dual CJS** : `build-cjs.mjs` — génère `packages/*/dist-cjs` pour Electron `require`
- **Propagation** : `kit-version.mjs`, `propagation-impact.mjs`
- **Sync vendor** : `sync-creezio-vendor.sh` (canonique consommé par les marques)
- **Lib** : `scripts/lib/*` (brand roots, twins intention, etc.)

## Commandes usuelles

```bash
# Depuis la racine du kit
npm test                 # toutes les gates listées dans package.json
npm run build:cjs        # dual CJS uniquement
npm run build:packages   # tsc packages + CJS
npm run kit:impact -- --package=@creezio/platform-core
npm run kit:version -- --package=@creezio/shell --bump=patch
```

Gates ciblées :

```bash
node --test scripts/test-phase-p29.mjs
node --test scripts/test-phase-c2.mjs
node --test scripts/test-phase-o11.mjs
```

## Organisation

| Préfixe | Série |
|---------|--------|
| `test-phase-b*.mjs` … `f` | Extraction / factory / propagation historique |
| `test-phase-h*.mjs` | H1–H5 packages + isolation |
| `test-phase-i*.mjs` | Gouvernance I0–I8 + conso marques |
| `test-phase-v*.mjs` | Vision V1–V3 |
| `test-phase-c*.mjs` | Corrections cutover C* |
| `test-phase-r*.mjs` | Database / gel inventions |
| `test-phase-m*.mjs` / `n*` / `o*` / `p*` | Plans M/N/O/P |

## Voir aussi

- [AGENTS.md](./AGENTS.md)
- [docs/FILES.md](./docs/FILES.md) — inventaire fichier par fichier
- [../docs/PACKAGES.md](../docs/PACKAGES.md)
- [../AGENTS.md](../AGENTS.md)
