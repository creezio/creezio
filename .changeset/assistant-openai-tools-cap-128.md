---
"@creezio/assistant": patch
"@creezio/mcp-facade": patch
---

Fix OpenAI `Invalid 'tools': array too long` (plafond 128) : le chat OS n'envoie plus les alias Hermes en double, `listTools` masque les tools `enabled=0`, et le payload est dédupliqué / tronqué à 128. `callTool` et l'admin MCP restent inchangés.
