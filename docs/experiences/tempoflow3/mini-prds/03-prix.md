# Mini-PRD — Prix & promotions

**Onglet** : Prix (et surface Promotions si déjà navigable)  
**Route** : `/prix` (+ `/promotions` si étendu)  
**Dépend** : Produits, Fournisseurs

## Problème

Les prix bougent ; l’acheteur doit voir le tarif courant et les écarts /
promos sans ouvrir chaque site fournisseur.

## Comportement attendu

1. Enregistrer un prix : produit + fournisseur + montant HT + devise.
2. Historiser (au moins : nouveau prix = nouvelle entrée ou mise à jour
   datée — l’utilisateur voit « avant / maintenant »).
3. Liste filtrable par fournisseur ou produit.
4. Promo simple (MVP) : marquer un prix en promotion + libellé / date de fin
   optionnelle.
5. Depuis Produits ou Fournisseurs : voir le prix actuel.

## Critère de done

- Saisir deux prix successifs pour le même couple produit/fournisseur et
  constater l’évolution.
- Une promo visible clairement dans la liste.
