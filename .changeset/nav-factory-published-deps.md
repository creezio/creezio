---
"@creezio/factory": patch
---

Factory : ne plus lister `@creezio/granola` / `@creezio/grokbot` /
`@creezio/nav` dans les deps npm générées (`SERVER_CREEZIO_DEPS`,
`CLIENT_CREEZIO_DEPS`, `renderUiPackageJson`, `transpilePackages`) tant
que ces packages ne sont pas publiés sur GitHub Packages. Un module OS
nouveau s'enregistre au catalogue nav (shell-ui / os-ui) sans être une
dep marque — après merge `main` → publish.yml seulement. Le loader
chrome vit dans `@creezio/shell-ui/ui` (déjà publié). Gate fail-closed :
le `package.json` généré n'installe pas ces packages.
