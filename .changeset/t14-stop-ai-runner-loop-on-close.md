---
"@creezio/tasks": patch
"@creezio/app-runtime": patch
---

Teardown fail-closed de la boucle runner IA : `stopAiRunnerLoop()` exporté par
`@creezio/tasks` (arrêt des timers runner 2 s + récurrence 60 s posés par
`ensureAiRunnerLoop`) et appelé par `mountBrandPlatformSurface().close()`.
Sans cet arrêt, le `setInterval` process-global survivait à la fermeture de la
surface plateforme et son tick suivant jetait `requireTasksBrand()` en
`unhandledRejection` (« configureTasksBrand() requis avant d'utiliser le
runtime kanban ») — cause de la flake de la gate
`test-phase-platform-native-mounts` (PNM.2). Une nouvelle surface relance la
boucle à sa première requête tasks.
