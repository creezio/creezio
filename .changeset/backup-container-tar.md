---
"@creezio/observability": patch
---

server-docker backup : tar exécuté dans un conteneur éphémère (image de l'instance) au lieu du tar hôte. Le volume `/data` contient des fichiers root-owned 600 écrits par le conteneur (token plugins, config) et `backups/` peut être root-owned : le tar hôte en user deploy produisait une archive incomplète (fichiers skippés) ou non créable (tar exit 2, update annulé — vécu tempoflow 2026-08-12). Via le socket docker (groupe docker, sans sudo), le tar tourne en root : archive complète, écriture garantie, puis `chown` au uid/gid appelant pour la rétention. Comportement identique sur tous les hôtes.
