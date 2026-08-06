# Standard documentaire du kit Creezio

Contrat unique pour la documentation du monorepo. Objectif : docs exploitables
par des petits modèles LLM — conventions écrites, zéro doc périmée, commandes
copiables. Vérifié par la gate `scripts/test-phase-docs-freshness.mjs`
(dans `npm test` / `npm run test:kit`).

Compléments : [DOC-STANDARD-MODULE.md](./DOC-STANDARD-MODULE.md) (contrat
« module = unité de travail autonome », 4 fichiers spec par module, gate
`test-phase-module-docs`) et [DOC-STANDARD-UI.md](./DOC-STANDARD-UI.md)
(kit graphique imposé).

## Le trio obligatoire

Chaque **package** (`packages/*`), chaque **zone Docker** (`docker/*`), chaque
**app** (`apps/*`) et la zone `scripts/` portent trois fichiers :

| Fichier | Public | Contenu |
|---------|--------|---------|
| `README.md` | humains | mission, usage, commandes |
| `AGENTS.md` | agents IA | frontières, pièges, comment modifier sans casser |
| `docs/FILES.md` | tous | inventaire fichier par fichier (format ci-dessous) |

## Format unique de `docs/FILES.md`

Généré/rafraîchi par `node scripts/generate-files-md.mjs <cible>` — ne pas
inventer d'autre format. Structure :

- un titre `# <zone>/<nom> — inventaire des fichiers` ;
- une section `## \`<dossier>/\`` par dossier contenant des fichiers source
  (`## Racine` pour les fichiers à la racine) ;
- dans chaque section, un tableau `| Fichier | Rôle |`, **une ligne par
  fichier source**, chemin relatif à la racine du package/zone, lien relatif.

Un fichier « source » = extensions `.ts .tsx .mts .cts .js .jsx .mjs .cjs
.sql .sh` (hors `.d.ts`), plus `Dockerfile*`, `docker-compose*.yml`,
`*.dockerignore`, `*.service.example`. Exclus : `dist/`, `dist-cjs/`,
`node_modules/`, `.next/`, `coverage/`, `__snapshots__/`, `docs/`,
`docker-data/`, `build/`.

La colonne **Rôle** est éditable à la main : la régénération préserve le texte
existant et marque `(à documenter)` les nouveaux fichiers.

```bash
node /opt/docker/creezio/scripts/generate-files-md.mjs api-kernel      # un package
node /opt/docker/creezio/scripts/generate-files-md.mjs docker/server   # une zone
node /opt/docker/creezio/scripts/generate-files-md.mjs --all           # tout
node /opt/docker/creezio/scripts/generate-files-md.mjs --all --check   # vérif (gate)
```

## Règles éditoriales

1. **Câblé en prod vs disponible** : toute API décrite (README, AGENTS,
   FILES.md) précise si elle est **câblée en prod** (branchée dans un runtime
   livré : desktop, harness Docker, admin) ou seulement **disponible**
   (exportée mais non branchée). Ne jamais laisser croire qu'un export est
   actif s'il ne l'est pas.
2. **Pièges écrits le jour même** : tout piège découvert en chantier
   (comportement surprenant, ordre d'appel obligatoire, env requise…) est
   consigné le jour même dans l'`AGENTS.md` du package concerné.
3. **Docs d'étape → archive** : handoffs, matrices de suivi, snapshots de
   gates et autres documents liés à une étape partent dans `docs/archive/`
   (du repo concerné) dès que l'étape est close, avec une note de renvoi si
   un contrat vivant les remplace. Les docs actives ne décrivent que l'état
   courant.
4. **Commandes copiables** : chaque commande documentée doit être exécutable
   telle quelle — chemins absolus (ou répertoire de départ explicite),
   variables d'env explicites avec valeur d'exemple, pas de `<...>` sans
   explication immédiate.
5. **Fin de chantier propre** : un chantier se termine en finissant la phase
   en cours — commit + push + rapport — jamais en laissant un état
   intermédiaire non documenté.

## Gate de fraîcheur

`scripts/test-phase-docs-freshness.mjs` échoue si :

- un package/zone du périmètre (packages/\*, docker/\*, apps/\*, `scripts/`)
  n'a pas son trio README.md / AGENTS.md / docs/FILES.md ;
- un fichier source n'apparaît pas dans le `docs/FILES.md` de sa zone.

La vérification est **format-agnostique** (présence du chemin dans le
fichier) : les FILES.md historiques restent valides tant qu'ils sont
complets ; toute régénération les fait converger vers le format standard.
Rattrapage : `node scripts/generate-files-md.mjs <cible>`.
