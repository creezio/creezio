---
"@creezio/mcp-facade": patch
---

mcp-facade : les access tokens OAuth MCP (HS256 `MCP_JWT_SECRET`, surface `/oauth/*`) sont désormais convertis en session plateforme sur les tools `module.*` — `headersFromActor` mint via `createSessionToken` une session pour le user du consentement (`uid` résolu fail-closed dans le store users, fallback owner strict). Complément : le `auth()` de la façade accepte en fallback un Bearer JWT session plateforme validé par `@creezio/auth` (avant : `invalid_signature` sec). Sans cela, les gardes `requireSession` des mounts métier renvoyaient `session_requise` malgré un OAuth valide (ChatGPT connectors & co) — la propagation du Bearer (#166) ne suffisait pas, les deux secrets de signature étant disjoints.
