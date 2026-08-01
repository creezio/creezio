# Preuve oracle TempoFlow3

**Mission : FAILURE** (19 pass / 14 fail)

| Check | Result | Detail |
|-------|--------|--------|
| `arch.no-brand-runtime` | ✅ | pas de brand-runtime (kit createBrandKernel) |
| `arch.no-host-stack` | ✅ | pas de glue src/lib/host-stack |
| `arch.startBrandDesktop` | ✅ | main déclaration façade |
| `ui.pages-metier` | ✅ | ok |
| `ui.parity-0.10.26-pages` | ❌ | manquant: skus, promotions, site, login, setup, onboarding, taches, mails, collaborateurs, configuration, parametres, cockpit, developers, admin/mcp, admin/plugins, admin/database |
| `ui.renderer-has-bonus-nav` | ❌ | SPA embarquée doit exposer nav bonus (sinon UI Electron incomplète) |
| `build.electron-tsc` | ❌ | sh: 1: tsc: not found
npm error Lifecycle script `build:electron` failed with error:
npm error code 127
npm error path /agent/repos/creezio/apps/tempoflow3
npm error workspace @creezio/app-tempoflow3@0.1.0
npm error location /agent/repos/creezio/apps/tempoflow3
npm error command failed
npm error command sh -c tsc -p tsconfig.electron.json
 |
| `api.health` | ✅ | port 19472 |
| `api.fournisseurs.create` | ✅ | 6385ff67-e8cd-41d0-a611-65124c188d4a |
| `api.fournisseurs.archive-filter` | ✅ | n=1 |
| `api.produits.create` | ✅ | acc816ce-2260-4fe6-8941-29e2fb0c0d24 |
| `api.prix.create` | ✅ | 5bda321f-d4bb-4dad-8efe-f04540ac2f8e |
| `api.panier.add` | ✅ | 367c32ea-4dfc-402a-930e-9d2074d8cce0 |
| `api.commandes.from-panier` | ✅ | a914620d-5ae0-41be-bd09-6c85c898b1e7 |
| `api.optimiser.suggest` | ❌ | status=400 |
| `api.stack.list` | ✅ | status=200 |
| `api.releves.list` | ✅ | status=200 |
| `api.marketplaces.list` | ✅ | status=200 |
| `api.secteurs.list` | ✅ | status=200 |
| `api.agregateurs.list` | ✅ | status=200 |
| `api.data-mapping.list` | ❌ | status=404 |
| `api.scan.start` | ✅ | status=201 |
| `api.search` | ✅ | status=200 |
| `api.dispatch` | ❌ | status=404 (requis 0.10.26) |
| `api.skus` | ❌ | status=404 (requis 0.10.26) |
| `api.promotions` | ❌ | status=404 (requis 0.10.26) |
| `api.site-fournisseur` | ❌ | status=404 (requis 0.10.26) |
| `os.login-page` | ❌ | page login |
| `os.setup-page` | ❌ | page setup |
| `os.taches-page` | ❌ | page tâches |
| `os.mails-page` | ❌ | page mails |
| `os.mcp-page` | ❌ | page mcp/developers |
| `build.compiled-artifact` | ✅ | TempoFlow-Setup-0.1.0.AppImage, builder-debug.yml, latest-linux.yml, linux-unpacked |

ÉCHEC : parity 0.10.26 + binaire non atteints.
