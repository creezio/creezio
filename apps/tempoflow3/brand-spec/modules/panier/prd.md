# Mini-PRD — Panier

**Onglet** : Panier  
**Route** : `/panier`  
**Dépend** : Produits, Prix, Fournisseurs

## Problème

Préparer une commande sans panier clair = erreurs de quantités et oublis.

## Comportement attendu

1. Ajouter une ligne : produit, fournisseur, quantité, prix unitaire
   (prérempli depuis le tarif courant si connu).
2. Modifier quantité / supprimer une ligne.
3. Total HT du panier (et sous-totaux par fournisseur si plusieurs).
4. Vider le panier ou transformer en commande (action « commander » → module
   Commandes).
5. Persistance locale : rouvrir l’app = panier encore là.

## Critère de done

- 3 lignes, total correct, modification quantité, une suppression.
- Action claire vers création de commande.
