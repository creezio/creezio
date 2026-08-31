---
"@creezio/factory": patch
---

Factory `--link-kit` / `CREEZIO_LINK_KIT=1` : l'install d'une app fraîche pin les `@creezio/*` sur le worktree kit (`file:`), sans dépendre d'un publish préalable. Les gates scaffold et la CI l'utilisent toujours — la PR de release n'a plus d'œuf-poule registre. Les manifests générés restent `^<lockstep>`.
