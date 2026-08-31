---
"@creezio/brand-spec": minor
---

Doctor : nouveau check fail-closed `OS_UI_PAGE_DEP_MISSING` — tout package `@creezio/*` importé par une page os-ui (matérialisée sous `server/ui/app/(creezio-os)/` ou embarquée dans le `@creezio/os-ui` installé) doit être déclaré dans `server/ui/package.json` (error, pas warn — c'est le check qui aurait attrapé l'incident prod 0.20.0 avant le build). Skip explicite en info (`OS_UI_DEPS_UNCHECKED`) quand ni pages matérialisées ni package os-ui installé ne sont disponibles.
