# Preuve E2E dure TempoFlow3

**Mission : SUCCESS** (73 pass / 0 fail)

| Check | Result | Detail |
|-------|--------|--------|
| `arch.kit-binaries` | ✅ | meili+cloudflared |
| `arch.main-thin` | ✅ | lines=35 |
| `arch.no-host-stack-brand` | ✅ | hosts dans @creezio/app-runtime |
| `arch.installBrandOsDesktop` | ✅ | installBrandOsDesktop kit |
| `arch.compose-in-kit` | ✅ | composeBrandOs |
| `build.electron` | ✅ | ok |
| `api.health` | ✅ | port 19866 |
| `os.status` | ✅ | {"hermes":true,"n8n":true,"tunnel":true,"meili":true,"plugins":"feature-off"} |
| `os.hosts-constructed` | ✅ | hermes=startHermes,stopHermes,stopHermesAndWait n8n=startN8n,stopN8n,getRunningN8n |
| `mcp.http-list` | ✅ | n=7 |
| `mcp.os-tool` | ✅ | module.platform.list_mounts,module.os.status |
| `os.tasks-create` | ✅ | 44b1848b-d924-4bd1-8e97-1f56a2912b4e |
| `os.platform-tasks` | ✅ | status=200 |
| `os.platform-mails` | ✅ | status=200 |
| `arch.kit-vendor-hermes` | ✅ | /agent/repos/creezio/packages/electron-shell/resources/vendor/hermes-agent |
| `arch.kit-vendor-n8n` | ✅ | /agent/repos/creezio/packages/electron-shell/resources/vendor/n8n |
| `arch.no-brand-vendor` | ✅ | vendor OS hors marque |
| `os.hermes-status` | ✅ | binary=null |
| `os.n8n-status` | ✅ | entry=null |
| `os.n8n-ensure` | ✅ | /tmp/tf3-hard-Mo567f/n8n-runtime/node_modules/n8n/bin/n8n |
| `os.n8n-start` | ✅ | /tmp/tf3-hard-Mo567f/n8n-runtime/node_modules/n8n/bin/n8n |
| `os.hermes-ensure` | ✅ | /tmp/tf3-hard-Mo567f/hermes-runtime/os-profile/.hermes/hermes-agent/venv/bin/hermes |
| `os.hermes-start` | ✅ | /tmp/tf3-hard-Mo567f/hermes-runtime/os-profile/.hermes/hermes-agent/venv/bin/hermes |
| `os.tunnel-status` | ✅ | mcp=http://127.0.0.1:19866/mcp |
| `os.mcp-public` | ✅ | status=200 tools=7 |
| `metier.fournisseur` | ✅ | 694b0b25-08ca-4240-8f68-3672162c01e9 |
| `metier.commande` | ✅ | a743bc31-55d4-472e-8af4-50ac012afff7 |
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
| `metier.releve-create` | ✅ | lignes=3 id=fa0870ac-4929-4e8c-883b-bf67eed89c9c |
| `metier.releve-apply-prix` | ✅ | promo_label=releve:fa0870ac-4929-4e8c-883b-bf67eed89c9c |
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
| `metier.commande-version-create` | ✅ | 5fc065ac-95dc-4430-bec8-c0591e14a0c5 |
| `metier.commande-versions` | ✅ | n=1 |
| `metier.like-add` | ✅ | ok |
| `metier.likes` | ✅ | n=1 |
| `os.connection-get` | ✅ | local |
| `os.connection-set` | ✅ | chosen=true |
| `os.setup-get` | ✅ | complete=false |
| `os.setup-post` | ✅ | recovery issued |
| `os.plugins-list` | ✅ | mode=feature-off |
| `os.tasks-kanban-create` | ✅ | cbe65e42-ffc8-4ded-9172-7a54552bc889 |
| `os.tasks-kanban-move` | ✅ | done |
| `ui.dashboard/page.tsx` | ✅ | interactive |
| `ui.dispatch/page.tsx` | ✅ | interactive |
| `ui.promotions/page.tsx` | ✅ | interactive |
| `ui.skus/page.tsx` | ✅ | interactive |
| `ui.stack/page.tsx` | ✅ | interactive |
| `ui.setup/page.tsx` | ✅ | interactive |
| `ui.configuration/page.tsx` | ✅ | interactive |
| `ui.taches/page.tsx` | ✅ | interactive |
| `ui.admin/plugins/page.tsx` | ✅ | interactive |
| `ui.likes/page.tsx` | ✅ | interactive |
| `ui.next-standalone` | ✅ | Next standalone prêt |
| `build.appimage` | ✅ | AppImage présent |
