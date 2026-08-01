# Mini-PRD — Scan

**Onglet** : Scan  
**Route** : `/scan`  
**Dépend** : Produits / Prix / Relevés

## Problème

Saisie manuelle lente ; l’acheteur veut capturer une info (étiquette,
page, liste) et en faire des lignes métier.

## Comportement attendu

1. Démarrer un flux « scan / capture » guidé.
2. Produire des propositions de lignes (produit, prix, fournisseur) à
   valider avant écriture catalogue.
3. S’appuyer sur l’**assistant / outils génériques Creezio** pour la partie
   capture / aide ; le mapping métier reste TempoFlow3.
4. Après validation : données visibles dans Produits / Prix / Relevés.

## Critère de done

- Un parcours scan → validation → prix catalogue mis à jour, sans
  réimplémenter un moteur d’IA dans la marque.
