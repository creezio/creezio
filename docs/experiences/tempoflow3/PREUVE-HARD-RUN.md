# Preuve E2E dure TempoFlow3

**Mission : SUCCESS** (54 pass / 0 fail)

| Check | Result | Detail |
|-------|--------|--------|
| `arch.kit-binaries` | ✅ | meili+cloudflared |
| `arch.main-thin` | ✅ | lines=35 |
| `arch.no-host-stack-brand` | ✅ | hosts dans @creezio/app-runtime |
| `arch.installBrandOsDesktop` | ✅ | installBrandOsDesktop kit |
| `arch.compose-in-kit` | ✅ | composeBrandOs |
| `build.electron` | ✅ | ok |
| `api.health` | ✅ | port 19470 |
| `os.status` | ✅ | {"hermes":true,"n8n":true,"tunnel":true,"meili":true,"plugins":"feature-off"} |
| `os.hosts-constructed` | ✅ | hermes=startHermes,stopHermes,stopHermesAndWait n8n=startN8n,stopN8n,getRunningN8n |
| `mcp.http-list` | ✅ | n=7 |
| `mcp.os-tool` | ✅ | module.platform.list_mounts,module.os.status |
| `os.tasks-create` | ✅ | b446421e-ae69-4853-9e49-8b08f5b2f495 |
| `os.platform-tasks` | ✅ | status=200 |
| `os.platform-mails` | ✅ | status=200 |
| `arch.kit-vendor-hermes` | ✅ | /agent/repos/creezio/packages/electron-shell/resources/vendor/hermes-agent |
| `arch.kit-vendor-n8n` | ✅ | /agent/repos/creezio/packages/electron-shell/resources/vendor/n8n |
| `arch.no-brand-vendor` | ✅ | vendor OS hors marque |
| `os.hermes-status` | ✅ | binary=null |
| `os.n8n-status` | ✅ | entry=null |
| `os.n8n-ensure` | ✅ | /tmp/tf3-hard-ddmOgZ/n8n-runtime/node_modules/n8n/bin/n8n |
| `os.n8n-start` | ✅ | /tmp/tf3-hard-ddmOgZ/n8n-runtime/node_modules/n8n/bin/n8n |
| `os.hermes-ensure` | ✅ | /tmp/tf3-hard-ddmOgZ/hermes-runtime/os-profile/.hermes/hermes-agent/venv/bin/hermes |
| `os.hermes-start` | ✅ | /tmp/tf3-hard-ddmOgZ/hermes-runtime/os-profile/.hermes/hermes-agent/venv/bin/hermes |
| `os.tunnel-status` | ✅ | mcp=http://127.0.0.1:19470/mcp |
| `os.mcp-public` | ✅ | status=200 tools=7 |
| `metier.fournisseur` | ✅ | 047eb27b-944e-422d-aba6-274c9a51bf0f |
| `metier.commande` | ✅ | dde9ab9e-2ae8-4b31-9b81-c2133bfb9b04 |
| `metier.commande-detail` | ✅ | lignes=1 |
| `metier.produit-detail` | ✅ | prix=1 |
| `metier.optimiser` | ✅ | status=200 |
| `metier.optimiser-apply` | ✅ | status=200 |
| `metier.stack-add` | ✅ | ok |
| `metier.stack-list` | ✅ | n=1 |
| `metier.stack-panier` | ✅ | ok |
| `metier.releve-create` | ✅ | lignes=3 id=98c8a7e1-6473-406e-ba2b-3df00586fcba |
| `metier.releve-apply-prix` | ✅ | promo_label=releve:98c8a7e1-6473-406e-ba2b-3df00586fcba |
| `metier.scan-start` | ✅ | props=2 |
| `metier.scan-validate` | ✅ | {"produits":2,"prix":2,"releves":1} |
| `metier.scan-list` | ✅ | n=1 |
| `arch.desktop-shell-runtime-default` | ✅ | runtime par défaut |
| `metier.dispatch` | ✅ | n=2 |
| `metier.dispatch-apply` | ✅ | items=1 removed=1 |
| `metier.skus` | ✅ | status=200 |
| `metier.promotions` | ✅ | status=200 |
| `metier.site` | ✅ | status=200 |
| `metier.data-mapping` | ✅ | status=200 |
| `metier.dashboard` | ✅ | status=200 |
| `ui.dashboard/page.tsx` | ✅ | interactive |
| `ui.dispatch/page.tsx` | ✅ | interactive |
| `ui.promotions/page.tsx` | ✅ | interactive |
| `ui.skus/page.tsx` | ✅ | interactive |
| `ui.stack/page.tsx` | ✅ | interactive |
| `ui.next-standalone` | ✅ | Next standalone prêt |
| `build.appimage` | ✅ | AppImage présent |
