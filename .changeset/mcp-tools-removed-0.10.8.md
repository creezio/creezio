---
"@creezio/mcp-facade": patch
"@creezio/brand-spec": patch
"@creezio/app-runtime": patch
"@creezio/api-kernel": patch
"@creezio/factory": patch
---

**feat — `mcpTools` retiré ; `MODULE_MCP_TOOLS_DEPRECATED` = error.**

`BrandModuleDef.mcpTools` n'existe plus. SoT = `operations[]` → tools MCP générés (`listOperations()`). Plus de merge legacy (`mergeGeneratedAndLegacy` / `warnLegacyModuleMcpTools`). Doctor fail-closed : un `mcpTools()` restant = error. Le hook apps `discoverModuleTools` reste (extras / JWT), sans documenter de tools manuscrits.
