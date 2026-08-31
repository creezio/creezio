---
"@creezio/fleet": patch
---

fleet : le suivi `update-status` du host-agent (et du plan local server-admin) est persisté sur disque (T8, dette « Suivi update en mémoire »). Journal JSON atomique (tmp+rename) par process dans le répertoire d'état existant (`host-agent-updates.json` à côté du state file agent, `server-admin-updates.json` dans le docker-data admin), rechargé au boot : une entrée `running` interrompue par un restart reçoit le flag additif `agentRestarted` puis est résolue via `servers.json` (image enregistrée = image cible → `done`, sinon `error` avec la dernière étape persistée). TTL 24 h sur les entrées terminées. Protocole v1 intact (champs additifs `lastStep` / `agentRestarted` seulement) ; `updateServer` gagne un hook optionnel `onStep`.
