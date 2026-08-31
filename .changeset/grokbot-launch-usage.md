---
"@creezio/grokbot": minor
---

UI GrokBot : sélecteur de dépôts (cache mount 1 h, bouton refresh + toast
429), Select kit pour modèles et mode `agent` | `plan`, checkbox PR
labellisée, blocs usage tokens et artefacts (download présigné via le
mount, sans exposer le token Cursor). Split
`grokbot-launch-form` / `grokbot-usage-artifacts` / `grokbot-agent-runs`.

Suivi live (GROKBOT-2) : poll ciblé de l'agent ouvert (`GET agents/:id` +
runs, 4 s si RUNNING/CREATING sinon 15 s, jamais models/repos), timeline
(durée, result, branches/PR), follow-up Textarea kit, cancel confirmé
(Dialog kit), filtre Archivés + `POST unarchive`, skeletons, CTA token
manquant et message module non monté. SSE hors scope v1.
