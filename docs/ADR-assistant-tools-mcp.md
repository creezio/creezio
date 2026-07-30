# ADR — Surface tools assistant = kit ∪ MCP ∪ tasks

| | |
|--|--|
| **Statut** | Accepté (O4r + **O4r2** — 2026-07-30) |
| **Contexte** | Remédiation silo `brand-chat-tools` / `TOOL_DEFINITIONS` ×3, puis mini-registre `mcp-bridge` |

## Décision

La surface d’outils de l’assistant est **uniquement** :

1. **Platform kit** — `@creezio/assistant` (`PLATFORM_TOOL_DEFINITIONS` : explore SQL, Meili, surface_*/ui_*/supplier_*, `get_entity`)
2. **Tasks kit** — `configureAssistantBrand({ tasks })` → `create_task` / `list_tasks` (+ aliases `create_todo` / `list_todos`)
3. **MCP registry marque** — **une** factory `modules/brand-mcp.ts` (`create*BrandMcp(api)` → `create*ModuleMcpTools`) consommée par :
   - Electron `brand-runtime` (façade locale / proxy Hono)
   - Assistant via `mcp-bridge.ts` = **adaptateur mince** (`mcpFacadeToAssistantConfig`)
4. **Addendum marque optionnel** — system prompt / Meili / hermes / auth — **jamais** handlers panier/compta dans `lib/assistant/`

## Anti-patterns (NON done)

| Pattern | Verdict |
|---------|---------|
| `lib/assistant/brand-chat-tools.ts` avec `executeTool` métier | **Mort** |
| `BrandTools.executeTool` comme SoT | **Legacy mort** |
| `TOOL_DEFINITIONS` complets ×3 marques | **Mort** |
| `mcp-bridge.ts` qui re-liste N tools + handlers en dur | **Mort (O4r2)** — second SoT interdit |
| `add_to_cart` brand parallèle à `module.panier.*` | **Mort** |
| `module.desktop.open_external_tab` jumeau de `supplier_open_tab` | **Interdit** — open tab = plateforme |

## Différenciation marque

- **Data** + **tools exposés** (ACL / modules montés / discovery MCP)
- OK mince : system prompt, Meili indexes, hermes skills, auth
- Projections `entitySources` / `formatSearchHit` : encore TS marque (dette — pas de JSON déclaratif inventé en O4r2)
- **Pas** de handlers panier / tasks / compta dans `lib/assistant/` hors adaptateurs `mcp-bridge` + `tasks-adapter`

## Dispatch runtime (`executeTool` kit)

```
surface/ui/supplier → explore/sql/meili/get_entity → tasks adapter → mcp.callTool → outil inconnu
```

`mcp.callTool` = même façade que Electron (`create*BrandMcp` → `create*ModuleMcpTools`).

## Références

- [PHASE-O4r.md](PHASE-O4r.md)
- [PHASE-O4r2.md](PHASE-O4r2.md)
- [PHASE-O4p.md](PHASE-O4p.md) (historique)
- Package `@creezio/mcp-facade`, `@creezio/tasks`
