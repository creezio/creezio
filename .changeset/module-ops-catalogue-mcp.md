---
"@creezio/api-kernel": patch
"@creezio/mcp-facade": patch
"@creezio/brand-spec": patch
"@creezio/app-runtime": patch
"@creezio/observability": patch
"@creezio/factory": patch
---

**feat — catalogue `listOperations()` + tools MCP générés + doctor ops non vides.**

`api.listOperations()` alimente `/admin/api` (plus seulement la surface Hono). Les tools `module.<mountId>.<op.id>` sont générés depuis ce catalogue (handler = requête HTTP synthétique). Doctor fail-closed : `MODULE_OP_MISSING` si `apiMounts` sans `operations[]` **non vide** (pin ≥ 0.10.6) ; EntitySpec seul = OK (CRUD auto) ; `mcpTools` restant = `MODULE_MCP_TOOLS_DEPRECATED` (warn). Mounts kit/OS hors `modules/*.ts` non scannés.
