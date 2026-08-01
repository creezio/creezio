# Mini-PRD — Relevés

**Onglet** : Relevés  
**Route** : `/releves`  
**Dépend** : Fournisseurs, Prix

## Problème

Il faut tracer « j’ai relevé tel prix tel jour chez tel fournisseur »
(terrain, site, catalogue PDF…).

## Comportement attendu

1. Créer un relevé : date, fournisseur, source (site / magasin / autre),
   lignes produit + montant.
2. Liste des relevés récents.
3. Un relevé peut mettre à jour / proposer la mise à jour du prix catalogue.
4. Consultation ultérieure pour audit « d’où vient ce prix ? ».

## Critère de done

- Un relevé à 3 lignes crée ou met à jour les prix correspondants avec
  traçabilité.
