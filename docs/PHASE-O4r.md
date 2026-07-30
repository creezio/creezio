# Phase O4r — Remédiation assistant tools → MCP / kit

| | |
|--|--|
| **Statut** | ✅ **Sign-off** (gates verts) |
| **Date** | 2026-07-30 |
| **Repo** | `creezio/creezio` (+ marques) |
| **Prérequis** | [PHASE-O4p.md](PHASE-O4p.md) · ADR [ADR-assistant-tools-mcp.md](ADR-assistant-tools-mcp.md) |
| **ARCHITECTURE_VERSION** | `"H6"` (inchangé) |
| **Republish** | Non |

---

## Objectif

Éliminer le silo parallèle `brand-chat-tools` + `TOOL_DEFINITIONS` métier ×3.
Assistant = runtime kit unique ; métier = **discovery MCP** ; tasks = adapter kit.

**Paperclip = mort. Façades = NON done.**

---

## Deletes

| Fichier | TF | CV | Fidu |
|---------|----|----|------|
| `lib/assistant/brand-chat-tools.ts` | ✅ | ✅ | ✅ |
| `TOOL_DEFINITIONS` complets marque | ✅ vide | ✅ vide | ✅ vide |

---

## Wiring marque (cible)

| Surface | SoT | Brand |
|---------|-----|-------|
| Platform tools defs + handlers | `@creezio/assistant` | — |
| Tasks `create_task` / `list_tasks` | kit + `tasks` adapter | `tasks-adapter.ts` |
| Métier panier / RTI / accounting | MCP `module.*` | `mcp-bridge.ts` → `createMcpFacade` |
| Auth / Meili / hermes / entitySources | marque | mince |
| `tools.executeTool` | **absent** | — |

### Preuve métier

| Marque | Tool LLM | Handler |
|--------|----------|---------|
| TF | `module.panier.add_ligne` (alias `add_to_panier`) | MCP bridge |
| TF | `module.statut.set` | MCP bridge |
| CV | `module.rti.*` — **pas** de panier | MCP bridge |
| Fidu | `module.accounting.query` (alias `accounting_query`) | MCP bridge |
| ×3 | `create_task` / `list_tasks` (Fidu + todos) | `tasks` adapter |

---

## Gates

```bash
# Kit
cd /opt/docker/creezio && npm run build -w @creezio/assistant && npm run build:cjs
npm test   # incl. test-phase-o4r

# ×3 marques
bash scripts/electron/sync-creezio-vendor.sh   # liste complète
npm run test:assistant-routing
npm run test:active-surface
```

### Gate `test-phase-o4r`

- Absents ×3 : `brand-chat-tools.ts`
- Présents ×3 : `mcp-bridge.ts`, `tasks-adapter.ts`, `mcp:` + `tasks:` dans `brand-config.ts`
- Kit : `mcpFacadeToAssistantConfig`, `PLATFORM_TOOL_DEFINITIONS`, dispatch MCP/tasks (pas `BrandTools.executeTool` SoT)
- ADR + PLAN-O O4r

---

## Suite

Dettes éventuelles (hors vague) : unifier handlers Hono `/mcp` et bridge assistant (même registre) ; monter `createPanierMount` côté Next ; entitySources déclaratifs JSON.
