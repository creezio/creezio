# Preuve E2E dure TempoFlow3

**Mission : SUCCESS** (36 pass / 0 fail)

| Check | Result | Detail |
|-------|--------|--------|
| `arch.main-thin` | ✅ | lines=33 |
| `arch.no-host-stack-brand` | ✅ | hosts dans @creezio/app-runtime |
| `arch.installBrandOsDesktop` | ✅ | installBrandOsDesktop kit |
| `arch.compose-in-kit` | ✅ | composeBrandOs |
| `build.electron` | ✅ | ok |
| `api.health` | ✅ | port 19722 |
| `os.status` | ✅ | {"hermes":true,"n8n":true,"tunnel":true,"meili":true,"plugins":"feature-off"} |
| `os.hosts-constructed` | ✅ | hermes=startHermes,stopHermes,stopHermesAndWait n8n=startN8n,stopN8n,getRunningN8n |
| `mcp.http-list` | ✅ | n=7 |
| `mcp.os-tool` | ✅ | module.platform.list_mounts,module.os.status |
| `os.tasks-create` | ✅ | 3e145247-1152-4647-bc2d-4b0cfac614fe |
| `os.platform-tasks` | ✅ | status=200 |
| `os.platform-mails` | ✅ | status=200 |
| `os.hermes-status` | ✅ | binary=null |
| `os.n8n-status` | ✅ | entry=null |
| `os.tunnel-status` | ✅ | mcp=null |
| `metier.fournisseur` | ✅ | 936d297e-4a2d-4a9c-a245-42f4efc79c31 |
| `metier.commande` | ✅ | b231df60-bb9e-47b7-afd9-f58832c7c081 |
| `metier.optimiser` | ✅ | status=200 |
| `metier.optimiser-apply` | ✅ | status=200 |
| `metier.stack-add` | ✅ | ok |
| `metier.stack-list` | ✅ | n=1 |
| `metier.stack-panier` | ✅ | ok |
| `metier.releve-create` | ✅ | lignes=3 id=632eb159-3bef-4f03-adc6-b3e2df14ab45 |
| `metier.releve-apply-prix` | ✅ | promo_label=releve:632eb159-3bef-4f03-adc6-b3e2df14ab45 |
| `metier.scan-start` | ✅ | props=2 |
| `metier.scan-validate` | ✅ | {"produits":2,"prix":2,"releves":1} |
| `metier.scan-list` | ✅ | n=1 |
| `arch.desktop-shell-runtime-default` | ✅ | runtime par défaut |
| `metier.dispatch` | ✅ | status=200 |
| `metier.skus` | ✅ | status=200 |
| `metier.promotions` | ✅ | status=200 |
| `metier.site` | ✅ | status=200 |
| `metier.data-mapping` | ✅ | status=200 |
| `ui.next-standalone` | ✅ | Next standalone prêt |
| `build.appimage` | ✅ | AppImage présent |
