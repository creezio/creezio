# Preuve E2E dure TempoFlow3

**Mission : SUCCESS** (43 pass / 0 fail)

| Check | Result | Detail |
|-------|--------|--------|
| `arch.main-thin` | ✅ | lines=33 |
| `arch.no-host-stack-brand` | ✅ | hosts dans @creezio/app-runtime |
| `arch.installBrandOsDesktop` | ✅ | installBrandOsDesktop kit |
| `arch.compose-in-kit` | ✅ | composeBrandOs |
| `build.electron` | ✅ | ok |
| `api.health` | ✅ | port 19763 |
| `os.status` | ✅ | {"hermes":true,"n8n":true,"tunnel":true,"meili":true,"plugins":"feature-off"} |
| `os.hosts-constructed` | ✅ | hermes=startHermes,stopHermes,stopHermesAndWait n8n=startN8n,stopN8n,getRunningN8n |
| `mcp.http-list` | ✅ | n=7 |
| `mcp.os-tool` | ✅ | module.platform.list_mounts,module.os.status |
| `os.tasks-create` | ✅ | b8886a7e-466c-483c-ad85-c5a9f5bb8437 |
| `os.platform-tasks` | ✅ | status=200 |
| `os.platform-mails` | ✅ | status=200 |
| `arch.kit-vendor-hermes` | ✅ | /agent/repos/creezio/packages/electron-shell/resources/vendor/hermes-agent |
| `arch.kit-vendor-n8n` | ✅ | /agent/repos/creezio/packages/electron-shell/resources/vendor/n8n |
| `arch.no-brand-vendor` | ✅ | vendor OS hors marque |
| `os.hermes-status` | ✅ | binary=null |
| `os.n8n-status` | ✅ | entry=null |
| `os.n8n-ensure` | ✅ | /tmp/tf3-hard-k4JhVn/n8n-runtime/node_modules/n8n/bin/n8n |
| `os.n8n-start` | ✅ | /tmp/tf3-hard-k4JhVn/n8n-runtime/node_modules/n8n/bin/n8n |
| `os.hermes-ensure` | ✅ | /tmp/tf3-hard-k4JhVn/hermes-runtime/os-profile/.hermes/hermes-agent/venv/bin/hermes |
| `os.hermes-start` | ✅ | /tmp/tf3-hard-k4JhVn/hermes-runtime/os-profile/.hermes/hermes-agent/venv/bin/hermes |
| `os.tunnel-status` | ✅ | mcp=null |
| `metier.fournisseur` | ✅ | 6fe3d1c7-f35a-4c5d-b483-f3aee987b87e |
| `metier.commande` | ✅ | 6a77f4b1-e1c1-47a5-a1ad-9a66870daf74 |
| `metier.optimiser` | ✅ | status=200 |
| `metier.optimiser-apply` | ✅ | status=200 |
| `metier.stack-add` | ✅ | ok |
| `metier.stack-list` | ✅ | n=1 |
| `metier.stack-panier` | ✅ | ok |
| `metier.releve-create` | ✅ | lignes=3 id=9b35f275-58bc-41ed-ab40-09236c2d691d |
| `metier.releve-apply-prix` | ✅ | promo_label=releve:9b35f275-58bc-41ed-ab40-09236c2d691d |
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
