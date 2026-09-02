---
"@creezio/factory": minor
---

**Breaking (comportement CLI)** : `creezio brand create` / `new-app` / `brand apply` ne créent plus les repos GitHub dès qu'un token est résolvable. Le push est **opt-in `--push`** uniquement — sans ce flag : zéro appel réseau, zéro résolution de token (env `GITHUB_TOKEN` / `CREEZIO_GITHUB_TOKEN` / `.github-token` ignorés). `--no-push` devient le défaut (flag accepté, redondant). `--push` sans token reste une erreur explicite.

`creezio server-docker publish` pose le label OCI `org.opencontainers.image.source=https://github.com/<org>/<repo-marque>` dérivé du remote git `origin` du brand-root (fail-closed si le registre cible est `ghcr.io` et que le remote est introuvable), pour que GHCR rattache chaque package au repo marque.
