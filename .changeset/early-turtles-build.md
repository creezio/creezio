---
"@creezio/factory": patch
---

server-docker : build 100% in-image — le stage `brand-build` du Dockerfile kit produit `build/electron` (tsc) et `ui/.next/standalone` (materialize + next build) ; `ensureUiBuild`/`ensureElectronBuild` hôte supprimés du chemin standard (`build`/`create`/`publish`/`up`). node/npm de l'hôte ne produisent plus aucun artefact d'image : même résultat sur tous les serveurs.

Fix template tailwind factory (`renderUiTailwindConfig`) : suppression des globs `../../node_modules/@creezio/*` — le symlink workspace racine `@creezio/app-<brand>` → `server/` y matchait et Tailwind scannait `server/ui/node_modules` + `.next` (~900 Mo, ~20k fichiers → compile Next 30 s → 17 min+, hang tempoflow3-admin). Scan local `./node_modules/@creezio/*` uniquement (server/ui = projet npm indépendant, deps jamais hoistées).

dockerignore v5 : sources `server/` + `server/ui` dans le contexte ; `**/node_modules`, `**/.next`, `build/` hôte exclus.
