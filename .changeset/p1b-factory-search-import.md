---
"@creezio/factory": patch
---

P1.b suivi — le smoke `test:meili-config` généré importait le dist interne
d'electron-shell (`dist/host/meili-launcher.js`, `dist/host/meili/generic-indexer.js`),
chemins disparus avec l'extraction `@creezio/search` (0.11.0) — vécu CI
tempoflow3 PR #57. Le template importe désormais la surface publique
`@creezio/search` (bare import, node_modules-first par construction) et le
scaffold serveur déclare `@creezio/search` + `@creezio/host-runtime` en
dépendances directes. Gate `test-phase-factory-templates` durcie : tout
import profond de dist dans le smoke généré = rouge.
