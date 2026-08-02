# Extract `apps/tempoflow3` → `creezio/tempoflow3`

> Dépendances kit P1 : **mergées** (#26–#29). Repo cible bootstrap : https://github.com/creezio/tempoflow3  
> Source freeze : tag `archive/tf3-probe-65b9273` (`65b9273`).

## Étapes

1. Worktree lecture seule sur le tag (ne pas merger #25).
2. Exporter l’arbre :
   ```bash
   git archive archive/tf3-probe-65b9273 apps/tempoflow3 | tar -x -C /tmp/tf3-export
   # contenu → racine du repo tempoflow3
   ```
3. Brancher deps `@creezio/*` comme TF2 (vendor sync + `kitSha` = tip creezio post-P1) ; `npm run build:packages` côté kit avant sync.
4. CI Linux : tests métier + `proof:oracle` + `proof:hard`.
5. **Ne pas** modifier tempoflow2 gold.
6. Après verts : fermer PR #25 superseded ; garder le tag archive.

## Hors scope immédiat

- Windows shippable
- Remplacement TF2
- Delete branches `cursor/*` mortes (P3, après sign-off)
