---
"@creezio/factory": minor
"@creezio/platform-core": minor
"@creezio/brand-spec": minor
---

P3.a — runner de montée de version marque : nouvelle commande `creezio
upgrade` (détection version d'architecture, chaîne de codemods H* dans
l'ordre avec idempotence vérifiée, bump `@creezio/*` de tous les manifests
en `--package-lock-only`, rematérialisation os-ui, doctor fail-closed,
`--dry-run`) ; codemods embarqués dans le package factory publié ; scaffold
stampe `creezio.architectureVersion` ; doctor brand-spec : les seuils datés
(`*_CONTRACT_SINCE`) passent en politique N-2 (pin marque à plus de 2
versions lockstep derrière le kit = error, sinon warn).
