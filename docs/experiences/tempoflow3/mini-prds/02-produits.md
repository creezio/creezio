# Mini-PRD — Produits (catalogue)

**Onglet** : Produits  
**Route** : `/produits` (+ fiche)  
**Dépend** : Fournisseurs

## Problème

Sans catalogue local, impossible de comparer les tarifs ni de préparer un panier.

## Comportement attendu

1. Liste produits : nom, unité, catégorie, fournisseur associé.
2. Créer / éditer : nom obligatoire, unité (kg, pièce…), catégorie libre,
   lien fournisseur.
3. Fiche produit : derniers prix connus, actions « ajouter au panier ».
4. Recherche par nom / catégorie.
5. SKU optionnel plus tard : pour le MVP, un produit = une ligne catalogue
   simple (pas de sur-modélisation).

## Critère de done

- Créer un produit rattaché à un fournisseur existant.
- Le voir dans la liste et ouvrir sa fiche.
