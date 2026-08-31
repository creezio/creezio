---
"@creezio/grokbot": minor
---

UI GrokBot : sélecteur de dépôts (cache mount 1 h, bouton refresh + toast
429), Select kit pour modèles et mode `agent` | `plan`, checkbox PR
labellisée, blocs usage tokens et artefacts (download présigné via le
mount, sans exposer le token Cursor). Split
`grokbot-launch-form` / `grokbot-usage-artifacts` / `grokbot-agent-runs`
pour paralléliser GROKBOT-2.
