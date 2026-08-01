# Mini-PRD — Commandes

**Onglet** : Commandes  
**Route** : `/commandes` (+ fiche)  
**Dépend** : Panier

## Problème

Sans historique de commandes, l’acheteur ne sait plus ce qu’il a passé ni
où en est le suivi.

## Comportement attendu

1. Créer une commande **depuis le panier** (par fournisseur) : lignes figées,
   total HT, statut initial `brouillon` puis `envoyée` / `reçue` (statuts
   simples MVP).
2. Liste : date, fournisseur, statut, total.
3. Fiche : détail lignes, notes, changement de statut.
4. Le panier se vide des lignes commandées pour ce fournisseur.
5. Parcours bout-en-bout garanti :
   fournisseurs → produits/prix → panier → commande.

## Critère de done

- Smoke automatisé vert sur le parcours complet.
- Au moins une commande listée avec total cohérent.
