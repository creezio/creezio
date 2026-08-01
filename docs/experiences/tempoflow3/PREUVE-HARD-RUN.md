# Preuve E2E dure TempoFlow3

**Mission : SUCCESS** (61 pass / 0 fail)

| Check | Result | Detail |
|-------|--------|--------|
| `arch.kit-binaries` | ✅ | meili+cloudflared |
| `arch.main-thin` | ✅ | lines=35 |
| `arch.no-host-stack-brand` | ✅ | hosts dans @creezio/app-runtime |
| `arch.installBrandOsDesktop` | ✅ | installBrandOsDesktop kit |
| `arch.compose-in-kit` | ✅ | composeBrandOs |
| `build.electron` | ✅ | ok |
| `api.health` | ✅ | port 19438 |
| `os.status` | ✅ | {"hermes":true,"n8n":true,"tunnel":true,"meili":true,"plugins":"feature-off"} |
| `os.hosts-constructed` | ✅ | hermes=startHermes,stopHermes,stopHermesAndWait n8n=startN8n,stopN8n,getRunningN8n |
| `mcp.http-list` | ✅ | n=7 |
| `mcp.os-tool` | ✅ | module.platform.list_mounts,module.os.status |
| `os.tasks-create` | ✅ | 8394d497-d7f8-42a0-868a-26d4b46bc7d5 |
| `os.platform-tasks` | ✅ | status=200 |
| `os.platform-mails` | ✅ | status=200 |
| `arch.kit-vendor-hermes` | ✅ | /agent/repos/creezio/packages/electron-shell/resources/vendor/hermes-agent |
| `arch.kit-vendor-n8n` | ✅ | /agent/repos/creezio/packages/electron-shell/resources/vendor/n8n |
| `arch.no-brand-vendor` | ✅ | vendor OS hors marque |
| `os.hermes-status` | ✅ | binary=null |
| `os.n8n-status` | ✅ | entry=null |
| `os.n8n-ensure` | ✅ | /tmp/tf3-hard-ICgKWv/n8n-runtime/node_modules/n8n/bin/n8n |
| `os.n8n-start` | ✅ | /tmp/tf3-hard-ICgKWv/n8n-runtime/node_modules/n8n/bin/n8n |
| `os.hermes-ensure` | ✅ | /tmp/tf3-hard-ICgKWv/hermes-runtime/os-profile/.hermes/hermes-agent/venv/bin/hermes |
| `os.hermes-start` | ✅ | /tmp/tf3-hard-ICgKWv/hermes-runtime/os-profile/.hermes/hermes-agent/venv/bin/hermes |
| `os.tunnel-status` | ✅ | mcp=http://127.0.0.1:19438/mcp |
| `os.mcp-public` | ✅ | status=200 tools=7 |
| `metier.fournisseur` | ✅ | 3531f2fb-2471-4948-ba16-73ee9280706b |
| `metier.commande` | ✅ | faa1abfd-565f-4740-b2d7-7a324deb9009 |
| `metier.commande-detail` | ✅ | lignes=1 |
| `metier.produit-detail` | ✅ | prix=1 |
| `metier.optimiser` | ✅ | status=200 |
| `metier.optimiser-apply` | ✅ | status=200 |
| `metier.optimiser-commande-get` | ✅ | status=200 n=1 |
| `metier.optimiser-commande-apply` | ✅ | applied=1 |
| `metier.dispatch-graph` | ✅ | candidates=1 |
| `metier.stack-add` | ✅ | ok |
| `metier.stack-list` | ✅ | n=1 |
| `metier.stack-panier` | ✅ | ok |
| `metier.releve-create` | ✅ | lignes=3 id=4fe67feb-4ebe-4c7c-af77-59237d9819a1 |
| `metier.releve-apply-prix` | ✅ | promo_label=releve:4fe67feb-4ebe-4c7c-af77-59237d9819a1 |
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
| `metier.commande-version-create` | ✅ | 65bc1bcf-a914-450d-a644-368b40fdeeba |
| `metier.commande-versions` | ✅ | n=1 |
| `metier.like-add` | ✅ | ok |
| `metier.likes` | ✅ | n=1 |
| `ui.dashboard/page.tsx` | ✅ | interactive |
| `ui.dispatch/page.tsx` | ✅ | interactive |
| `ui.promotions/page.tsx` | ✅ | interactive |
| `ui.skus/page.tsx` | ✅ | interactive |
| `ui.stack/page.tsx` | ✅ | interactive |
| `ui.next-standalone` | ✅ | Next standalone prêt |
| `build.appimage` | ✅ | AppImage présent |
