# Mini-PRD — Optimiser

**Onglet** : Optimiser  
**Route** : `/optimiser` (+ optimiser une commande existante)  
**Dépend** : Panier / Commandes / Prix

## Problème

À panier égal, quel fournisseur est le plus intéressant ? L’acheteur veut
une aide, pas un tableur.

## Comportement attendu

1. Proposer, pour une sélection de besoins (panier ou liste), une
   répartition / choix fournisseur basé sur les prix connus.
2. Montrer un score ou un écart € simple et compréhensible.
3. Permettre d’appliquer le résultat au panier (ou créer une commande
   optimisée) en une action confirmée.
4. Ne pas exiger le cloud : calcul local sur données locales.

## Hors scope

ML opaque, scraping live obligatoire, optimisation multi-entrepôts.

## Critère de done

- Sur un jeu de 2 fournisseurs / 3 produits, l’écran propose un choix
  actionnable et traçable.
