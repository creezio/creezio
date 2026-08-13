---
"@creezio/factory": patch
---

Factory : les DEUX repos d'une marque naissent avec leurs `package-lock.json` — `maybePushBrandRepos` ne préparait les locks que du monorepo marque, le repo admin `<brand>-admin` était poussé sans aucun lock (vécu foove2-admin, 2026-08-13) ; échec explicite si un lock n'est pas produit. Tout scaffold (marque ET admin) génère aussi `.cursor/environment.json` (`npm install --no-audit --no-fund`) pour les cloud agents Cursor.
