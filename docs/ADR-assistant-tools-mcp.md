# ADR — Surface tools assistant = kit ∪ MCP ∪ tasks

| | |
|--|--|
| **Statut** | Accepté (O4r — 2026-07-30) |
| **Contexte** | Remédiation silo `brand-chat-tools` / `TOOL_DEFINITIONS` ×3 |

## Décision

La surface d’outils de l’assistant est **uniquement** :

1. **Platform kit** — `@creezio/assistant` (`PLATFORM_TOOL_DEFINITIONS` : explore SQL, Meili, surface_*/ui_*/supplier_*, `get_entity`)
2. **Tasks kit** — `configureAssistantBrand({ tasks })` → `create_task` / `list_tasks` (+ aliases `create_todo` / `list_todos`)
3. **MCP registry** — `configureAssistantBrand({ mcp })` → discovery `listTools` + `callTool` pour `module.*` / `plugin.*` (et aliases legacy)
4. **Addendum marque optionnel** — `prompts.toolDefinitions` mince (kinds `get_entity`, etc.) — **jamais** une 2ᵉ copie des defs plateforme ni des handlers panier/compta

## Anti-patterns (NON done)

| Pattern | Verdict |
|---------|---------|
| `lib/assistant/brand-chat-tools.ts` avec `executeTool` métier | **Mort** — fichier absent |
| `BrandTools.executeTool` comme SoT | **Legacy mort** (type déprécié, runtime ignore) |
| Façade 20 LOC `brand-chat-tools` → MCP | **NON done** |
| `TOOL_DEFINITIONS` complets ×3 marques | **Mort** — SoT kit |
| `add_to_cart` brand parallèle à `module.panier.*` | **Mort** |

## Différenciation marque

- **Data** + **tools exposés** (ACL / modules montés / MCP discovery)
- OK mince : system prompt addendum, Meili indexes, hermes skills, auth, `entitySources` / `formatSearchHit`
- **Pas** de handlers panier / tasks / compta dans `lib/assistant/` hors `mcp-bridge` + `tasks-adapter`

## Dispatch runtime (`executeTool` kit)

```
surface/ui/supplier → explore/sql/meili/get_entity → tasks adapter → mcp.callTool → outil inconnu
```

## Références

- [PHASE-O4r.md](PHASE-O4r.md)
- [PHASE-O4p.md](PHASE-O4p.md) (historique — gates réécrits)
- Package `@creezio/mcp-facade`, `@creezio/tasks`
