# `scripts/` — gates, build CJS, propagation kit

Outils du monorepo **creezio** (hors packages npm).

## Rôle

- **Gates de phases** : `test-phase-*.mjs` — assertions architecture / contrats / docs
- **Build dual CJS** : `build-cjs.mjs` — génère `packages/*/dist-cjs` pour Electron `require`
- **Propagation** : `kit-version.mjs`, `propagation-impact.mjs`
- **Sync vendor** : `sync-creezio-vendor.sh` (canonique consommé par les marques)
- **Docs** : `generate-files-md.mjs` — génère/rafraîchit les `docs/FILES.md`
  (standard [../docs/DOC-STANDARD.md](../docs/DOC-STANDARD.md), gate
  `test-phase-docs-freshness.mjs`)
- **Lib** : `scripts/lib/*` (brand roots, twins intention, etc.)

Les journaux d'époque des phases (`PHASE-*.md`) sont archivés dans
[../docs/archive/](../docs/archive/).

## Commandes usuelles

```bash
# Depuis la racine du kit
npm run test:kit         # gates pures kit — 100 % vertes partout (fail-fast)
npm run test:brands      # gates lisant les repos marque (skip auto-détecté)
npm run test:env         # gates environnementales (opt-in, skip explicite)
npm test                 # toutes les gates en un node --test (CI complet)
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

## Suites de gates (`test-fast.mjs`)

`npm run test:kit` / `test:brands` / `test:env` partagent le même runner
fail-fast (`scripts/test-fast.mjs`) : séquentiel, stop 1re rouge,
`--from`/`--only`/`--skip`/`--keep-going`, journal JSONL
`/tmp/creezio-test-fast.log`. La liste des gates vient du script npm `test`
(SoT unique) ; la suite de chaque gate est **détectée automatiquement** —
aucune liste figée de noms, aucun assert affaibli.

| Suite | Détection | Prérequis | Skip |
|-------|-----------|-----------|------|
| `kit` | défaut (ne lit que ce repo) | aucun — doit être 100 % verte partout | jamais |
| `brands` | la gate importe `scripts/lib/brand-roots.mjs` / `lib/intention-twins.mjs` ou résout `dockerRoot` | repos marque présents **et** synchronisés (`crm/vendor/creezio` existant) pour chaque marque référencée (`tempoflow2`, `certivan-app`, `fidu`) | auto : par marque manquante/désynchronisée, raison affichée |
| `env` | liste `ENV_GATES` dans `test-fast.mjs` | `test-os-cold-warm.mjs` : `CREEZIO_COLD_WARM=1` (bootstrap embeds réseau, ~4 Go `/tmp`, ~10 min) ; `test-phase-factory-prd*.mjs` : `CREEZIO_FACTORY_PRD=1` (npm install d'une app générée, binaire Electron téléchargeable) ; `test-phase-factory-docker-parity.mjs` : `CREEZIO_FACTORY_DOCKER=1` (app neuve factory → npm install → image Docker → parité boot-status/cloudflared, ~10 min, docker requis) | opt-in : skip explicite tant que la variable n'est pas posée |

Workflow quotidien : `npm run test:kit` → première rouge → corriger →
`npm run test:kit -- --from <gate>`. Sur un poste avec les repos marque à
jour, `npm run test:brands` lance les ~55 gates M/N/O/P + intention.

### Ajouter une gate

1. Créer `scripts/test-phase-<nom>.mjs` (`node:test`).
2. L'ajouter dans la ligne `test` du `package.json` racine — SoT unique :
   les suites `test:kit` / `test:brands` / `test:env` en dérivent
   automatiquement (classification auto décrite dans l'en-tête de
   `test-fast.mjs` et le tableau ci-dessus).

### Environnement d'exécution (ce VPS)

- Les gates écrivent sous `/tmp` (tmpfs) : nettoyer `/tmp/creezio-*` et
  `/tmp/tempoflow3-*` après un chantier ; `TMPDIR=/opt/docker/tmp` pour les
  runs lourds.
- Durées indicatives : `build:packages` ~10-15 min, `test:kit` ~15 min,
  `npm test` côté TF3 ~20 min.
- État connu : voir « État connu des suites » dans [AGENTS.md](./AGENTS.md).

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
