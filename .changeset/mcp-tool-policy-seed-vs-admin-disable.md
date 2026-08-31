---
"@creezio/mcp-facade": patch
---

Fix régression 0.17.1 : `listTools` ne masque plus les tools `enabled=0` seedés par défaut (`mcpPublishDefault=false` — toute op module sans opt-in publish), qui vidaient la liste des tools métier (`module.catalog.status` absent de `GET /mcp`, gate catalog-import TF3). Nouvelle colonne `mcp_tool_policies.admin_override` (migration auto) posée uniquement quand l'admin fixe explicitement `enabled` : seul `enabled=0 AND admin_override=1` est masqué de `listTools`. Le deny au call (`checkToolPolicy`) et le plafond OpenAI 128 restent inchangés.
