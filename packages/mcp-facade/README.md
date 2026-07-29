# `@creezio/mcp-facade`

**Une seule façade MCP** = MCP de l'app. Pas de « produit MCP Creezio » séparé.

- Tools **cœur admin** (health, architecture, list mounts)
- Hook `discoverTools()` pour modules marque + plugins orga
- Auth JWT alignée `mcpJwtSecret` / `MCP_JWT_SECRET`

```ts
import { createMcpFacade } from "@creezio/mcp-facade";

const mcp = createMcpFacade({
  jwtSecret: process.env.MCP_JWT_SECRET,
  discoverTools: async () => [],
});
const tools = await mcp.listTools({ bearerToken: "..." });
```
