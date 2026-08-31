---
"@creezio/granola": minor
---

Connecteur Granola opérable : santé (badges clé / secret / URL HTTPS /
endpoint id + bandeau fail-closed si `verified=0` avec secret), gestion des
endpoints distants (list / désactiver PATCH / supprimer DELETE), livraisons
filtrables, empty/error actionnables (`db_unavailable` / module non monté).
`register-webhook` et les proxys `remote/webhook-endpoints` ne renvoient
jamais `signing_secret` au client HTTP (`secretStored: true`).
