---
"@creezio/electron-shell": patch
---

`searchMeiliIndexes` fail-closed : le catch vide avalait Meili down en `[]`
(le search mount répondait 200 `engine:"meili"` silencieux avec un Meili
mort). Seul l'index absent (HTTP 404, indexation initiale pas passée) reste
toléré — toute autre erreur (connexion refusée, timeout, 5xx) est rethrow
pour que l'appelant réponde 503 `meili_unavailable`.
