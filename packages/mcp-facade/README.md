# `@creezio/mcp-facade`

**Une seule façade MCP** = MCP de l'app. Pas de « produit MCP Creezio » séparé.

- Tools **cœur admin** (health, architecture, list mounts, list tools by space)
- Hook `discoverTools()` (plat H1) + `discoverToolsBySpace()` (H2)
- `listTools({ space })` / `listToolsBySpace()` — discovery scindée
- Auth JWT alignée `mcpJwtSecret` / `MCP_JWT_SECRET`

```ts
import { createMcpFacade } from "@creezio/mcp-facade";

const mcp = createMcpFacade({
  jwtSecret: process.env.MCP_JWT_SECRET,
  discoverToolsBySpace: async () => ({ module: [], plugin: [] }),
});
const bySpace = await mcp.listToolsBySpace({ bearerToken: "..." });
// bySpace.core | .module | .plugin
```
