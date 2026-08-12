---
"@creezio/app-runtime": minor
"@creezio/auth": minor
"@creezio/shell-ui": minor
"@creezio/interactive-demo": minor
---

Polish UI démo + heartbeat desktop natif + lien secondaire login.

- **Palette de recherche Ctrl+K** (`shell-ui`) : géométrie scopée au composant (classe dédiée `.creezio-search-palette`, spécificité renforcée dans `theme.css`) — la palette ne dépend plus des règles de modale génériques de la marque (cassée par un `[role="dialog"]` global côté app).
- **Démo interactive** (`interactive-demo`) : la carte garde des dimensions compactes face aux règles globales « modales bornées au viewport » ; nouveau `launcher: "sidebar"` — le lanceur « Visite guidée » devient une entrée d'action de la sidebar kit (registre `registerSidebarActionsProvider` dans `shell-ui`), jamais affichée sur les pages publiques (/login). `launcher: "floating"` reste le défaut rétrocompatible.
- **Heartbeat desktop natif** (`app-runtime`) : `POST /api/v1/desktop/heartbeat` répond 200 `{ ok: true, desktop }` dans la surface plateforme — les apps web sans bridge Electron ne subissent plus le 404 → fallthrough plane (bruit + faux états) ; quand un bridge est en ligne, `desktop: true` reflète le registre de présence réel.
- **Login** (`auth` + `shell-ui`) : lien d'action secondaire configurable via `ShellUiBrand.login.secondaryLink` (`{ label, href }`, ex. inscription POS) — clé absente = rien ne s'affiche, aucun libellé hardcodé.
