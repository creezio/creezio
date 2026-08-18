---
"@creezio/api-kernel": patch
"@creezio/mcp-facade": patch
"@creezio/brand-spec": patch
"@creezio/observability": patch
"@creezio/app-runtime": patch
"@creezio/interactive-demo": patch
"@creezio/factory": patch
---

**feat — SoT unique : une opération de module = HTTP + /admin/api + tool MCP.**

`ModuleOperation` sur `ApiMount` / EntitySpec (CRUD auto). Le kit collecte puis génère les tools `module.<mountId>.<op.id>` (handler = requête HTTP synthétique). Catalogue `/admin/api` = ops kernel, plus seulement la surface Hono admin. `mcpTools()` déprécié (doctor error si recouvrement). Doctor fail-closed `MODULE_OP_MISSING` / `MODULE_OP_UNCATALOGUED` depuis 0.10.6. Enable MCP = policies sur tools générés (`mcpPublishDefault`, `roles`).
