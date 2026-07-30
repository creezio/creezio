# `@creezio/mcp-facade`

**Une seule façade / proxy MCP** = MCP de l'app. Pas de « produit MCP Creezio » séparé.

## Capacités

| Phase | Surface |
|-------|---------|
| H1 | Tools cœur + `discoverTools` + JWT |
| H2 | `listToolsBySpace` / `discoverToolsBySpace` |
| **H4** | Registry, namespacing, **aliases legacy**, policies deny cross-layer, `publicSurface` |
| **M9** | `wrapMcpFacadeWithHonoProxy` + contrat `MCP_PRODUCT_EXECUTOR` + `createCoreMcpTools` (SoT kit) |

### Namespaces

- `creezio.*` / `core.*` — cœur (réservé façade)
- `module.<ownerId>.*` — métier brand
- `plugin.<ownerId>.*` — sidecars orga

### Anti double exposition

```ts
import { createMcpFacade } from "@creezio/mcp-facade";

const mcp = createMcpFacade({
  jwtSecret: process.env.MCP_JWT_SECRET,
  publicSurface: "legacy-preferred", // masque module.panier.get si alias get_panier
  aliases: {
    get_panier: "module.panier.get",
    add_to_panier: "module.panier.add_ligne",
    list_releves_prix: "module.releves.list",
  },
  discoverToolsBySpace: async () => ({ module: [/* … */], plugin: [] }),
});

// listTools → get_panier (pas les deux)
await mcp.callTool("get_panier", {}); // → handler module.panier.get
```

`publicSurface` : `legacy-preferred` (défaut H4) | `canonical` | `both`.
